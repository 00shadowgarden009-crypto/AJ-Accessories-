/* AJ ACCERSSORES - manual NayaPay checkout for the same-origin store iframe. */
(function () {
  'use strict';

  const frame = document.getElementById('aj-store');
  if (!frame) return;

  frame.addEventListener('load', () => {
    const w = frame.contentWindow;
    const d = frame.contentDocument;
    if (!w || !d || !w.supabase?.createClient) return;

    const supabaseUrl = w.localStorage.getItem('aj_supabase_url');
    const supabaseKey = w.localStorage.getItem('aj_supabase_key');
    if (!supabaseUrl || !supabaseKey) {
      console.warn('Configure Supabase from the store Owner Portal before using NayaPay checkout.');
      return;
    }

    // Uses the same origin and auth storage as the embedded store.
    const client = w.supabase.createClient(supabaseUrl, supabaseKey);
    let proofObserver;
    let proofRefreshTimer;

    function setBusy(button, busy) {
      if (!button) return;
      button.disabled = busy;
      button.textContent = busy ? 'Recording Order...' : 'Place Official Order';
    }

    function showPaymentMethod(method) {
      const bankBox = d.getElementById('payment-bank-box');
      const gatewayBox = d.getElementById('payment-gateway-box');
      const reference = d.getElementById('chk-bank-ref');
      if (bankBox) bankBox.classList.toggle('hidden', method !== 'NayaPay');
      if (gatewayBox) gatewayBox.classList.add('hidden');
      if (reference) reference.required = method === 'NayaPay';
    }

    function setupCheckout() {
      const paymentSelect = d.getElementById('chk-payment');
      const bankBox = d.getElementById('payment-bank-box');
      const form = d.querySelector('#checkout-modal form');
      if (!paymentSelect || !bankBox || !form) {
        w.setTimeout(setupCheckout, 250);
        return;
      }

      paymentSelect.innerHTML = [
        '<option value="Cash on Delivery">Cash on Delivery (COD)</option>',
        '<option value="NayaPay">NayaPay - Manual Verification</option>'
      ].join('');

      bankBox.innerHTML = `
        <div class="font-bold text-aj-gold uppercase tracking-wider">Pay with NayaPay</div>
        <p class="text-white whitespace-pre-line">Account title: Muhammad Hamza Shafiq\nNayaPay number: 03199061682\nSend the exact payable amount, then enter the transaction reference below.</p>
        <div>
          <label class="block text-aj-muted mb-1" for="chk-bank-ref">NayaPay Transaction Reference *</label>
          <input type="text" id="chk-bank-ref" required maxlength="120" autocomplete="off" placeholder="Enter transaction reference / TID" class="w-full bg-aj-black border border-white/20 rounded-xl px-3 py-2 text-white focus:border-aj-gold focus:outline-none">
        </div>
        <div>
          <label class="block text-aj-muted mb-1" for="chk-payment-proof">Payment screenshot (optional, max 5 MB)</label>
          <input type="file" id="chk-payment-proof" accept="image/jpeg,image/png,image/webp" class="w-full text-xs text-aj-muted">
          <p class="text-[11px] text-aj-muted mt-1">For review only. A screenshot or reference does not confirm payment.</p>
        </div>`;

      paymentSelect.onchange = () => showPaymentMethod(paymentSelect.value);
      showPaymentMethod(paymentSelect.value);

      // Override the inline handler in the store iframe so the proof upload and
      // order insert use the authenticated Supabase session directly.
      w.handleSubmitRealOrder = async function (event) {
        event.preventDefault();
        const button = d.getElementById('submit-order-btn');
        if (!w.state?.user || !Array.isArray(w.state.cart) || w.state.cart.length === 0) {
          w.showToast?.('Sign in and add an item before checkout.', 'error');
          return;
        }
        if (paymentSelect.value === 'Online Card / Gateway') {
          w.showToast?.('Online gateway payments are not enabled. Select NayaPay or COD.', 'error');
          return;
        }

        setBusy(button, true);
        let uploadedPath = null;
        try {
          const { data: sessionData, error: sessionError } = await client.auth.getSession();
          if (sessionError || !sessionData?.session?.user) throw new Error('Your sign-in session expired. Please sign in again.');
          const user = sessionData.session.user;
          const payment_method = paymentSelect.value;
          const payment_reference = payment_method === 'NayaPay'
            ? (d.getElementById('chk-bank-ref')?.value || '').trim()
            : '';
          if (payment_method === 'NayaPay' && !payment_reference) throw new Error('Enter your NayaPay transaction reference.');

          const cart = JSON.parse(w.localStorage.getItem('aj_cart') || '[]');
          if (!Array.isArray(cart) || cart.length === 0) throw new Error('Your bag is empty.');
          const ids = [...new Set(cart.map(item => item.id).filter(Boolean))];
          const { data: products, error: productsError } = await client.from('products').select('id,name,price,stock').in('id', ids);
          if (productsError) throw productsError;
          const productMap = new Map((products || []).map(product => [String(product.id), product]));
          const items = cart.map(item => {
            const product = productMap.get(String(item.id));
            const qty = Number(item.qty);
            if (!product || !Number.isInteger(qty) || qty < 1) throw new Error('A product in your bag is no longer available. Refresh and try again.');
            if (Number(product.stock) < qty) throw new Error(`Only ${product.stock} units of ${product.name} remain.`);
            return { product_id: item.id, name: product.name, price: Number(product.price), qty };
          });

          const totals = w.calculateCartTotals();
          const order_number = 'AJ-' + Date.now().toString().slice(-8) + Math.floor(Math.random() * 90 + 10);
          const proofFile = payment_method === 'NayaPay' ? d.getElementById('chk-payment-proof')?.files?.[0] : null;
          if (proofFile) {
            if (!/^image\/(jpeg|png|webp)$/.test(proofFile.type) || proofFile.size > 5 * 1024 * 1024) {
              throw new Error('Choose a JPG, PNG, or WebP image no larger than 5 MB.');
            }
            const ext = proofFile.type === 'image/png' ? 'png' : proofFile.type === 'image/webp' ? 'webp' : 'jpg';
            uploadedPath = `${user.id}/${order_number}-${Date.now()}.${ext}`;
            const { error: uploadError } = await client.storage.from('payment-proofs').upload(uploadedPath, proofFile, {
              contentType: proofFile.type,
              upsert: false
            });
            if (uploadError) throw uploadError;
          }

          const payload = {
            order_number,
            user_id: user.id,
            user_email: user.email,
            customer_name: d.getElementById('chk-name').value.trim(),
            customer_phone: d.getElementById('chk-phone').value.trim(),
            customer_city: d.getElementById('chk-city').value.trim(),
            customer_address: d.getElementById('chk-address').value.trim(),
            payment_method,
            payment_status: payment_method === 'NayaPay' ? 'Awaiting Verification' : 'COD Pending',
            payment_reference,
            payment_proof_path: uploadedPath,
            items,
            subtotal: totals.subtotal,
            delivery_fee: totals.delivery,
            grand_total: totals.grandTotal,
            status: 'Order Received',
            estimated_delivery_at: new Date(Date.now() + 48 * 3600 * 1000).toISOString()
          };
          const { error: orderError } = await client.from('orders').insert(payload);
          if (orderError) throw orderError;

          // Keep the existing app view and local cart in sync after a successful order.
          w.localStorage.setItem('aj_cart', '[]');
          if (w.state) w.state.cart = [];
          w.updateBadges?.();
          w.renderCartDrawer?.();
          await w.loadProductsFromSupabase?.();
          w.closeCheckoutModal?.();

          d.getElementById('success-order-id').textContent = `#${order_number}`;
          const waText = encodeURIComponent(`New order ${order_number}\nPayment: ${payment_method}\nStatus: ${payload.payment_status}\nTotal: ${w.formatPKR(totals.grandTotal)}`);
          d.getElementById('success-whatsapp-btn').href = `https://wa.me/923199061682?text=${waText}`;
          d.getElementById('order-success-modal').classList.remove('hidden');
          w.lucide?.createIcons?.();
          w.showToast?.(payment_method === 'NayaPay' ? 'Order placed. Payment is awaiting owner verification.' : 'COD order placed.');
        } catch (error) {
          if (uploadedPath) await client.storage.from('payment-proofs').remove([uploadedPath]).catch(() => {});
          w.showToast?.(error.message || 'Could not place your order. Please try again.', 'error');
        } finally {
          setBusy(button, false);
        }
      };
    }

    async function isOwner() {
      const { data: sessionData } = await client.auth.getSession();
      const user = sessionData?.session?.user;
      if (!user) return false;
      const [{ data: profile }, { data: settings }] = await Promise.all([
        client.from('profiles').select('role').eq('id', user.id).maybeSingle(),
        client.from('store_settings').select('owner_email').eq('id', 1).maybeSingle()
      ]);
      return profile?.role === 'owner' || (!!settings?.owner_email && user.email?.toLowerCase() === settings.owner_email.toLowerCase());
    }

    async function addOwnerProofButtons() {
      const list = d.getElementById('admin-orders-list');
      if (!list || !await isOwner()) return;
      const { data: orders, error } = await client.from('orders').select('order_number,payment_proof_path').not('payment_proof_path', 'is', null);
      if (error || !orders?.length) return;

      for (const order of orders) {
        const card = Array.from(list.children).find(element => element.textContent.includes(`#${order.order_number}`));
        if (!card || card.querySelector(`[data-nayapay-proof="${CSS.escape(order.order_number)}"]`)) continue;
        const button = d.createElement('button');
        button.type = 'button';
        button.dataset.nayapayProof = order.order_number;
        button.className = 'px-3 py-2 rounded-xl bg-aj-gold/15 border border-aj-gold/40 text-aj-gold text-xs font-bold hover:bg-aj-gold/25 transition';
        button.textContent = 'View NayaPay Screenshot';
        button.addEventListener('click', async () => {
          if (!await isOwner()) {
            w.showToast?.('Owner access required.', 'error');
            return;
          }
          const { data, error: urlError } = await client.storage.from('payment-proofs').createSignedUrl(order.payment_proof_path, 60);
          if (urlError) {
            w.showToast?.(urlError.message, 'error');
            return;
          }
          w.open(data.signedUrl, '_blank', 'noopener,noreferrer');
        });
        const actions = card.querySelector('.flex.flex-wrap.items-center.gap-2') || card;
        actions.appendChild(button);
      }
    }

    function setupAdminProofs() {
      const list = d.getElementById('admin-orders-list');
      if (!list || proofObserver) return;
      proofObserver = new MutationObserver(() => {
        w.clearTimeout(proofRefreshTimer);
        proofRefreshTimer = w.setTimeout(() => { addOwnerProofButtons().catch(console.error); }, 200);
      });
      proofObserver.observe(list, { childList: true, subtree: true });
      addOwnerProofButtons().catch(console.error);
    }

    setupCheckout();
    setupAdminProofs();
    const appObserver = new MutationObserver(() => {
      if (!proofObserver) setupAdminProofs();
    });
    appObserver.observe(d.documentElement, { childList: true, subtree: true });
  });
})();
