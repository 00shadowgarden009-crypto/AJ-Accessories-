/* AJ ACCERSSORES - manual NayaPay checkout integration */
(function () {
  'use strict';

  const frame = document.getElementById('aj-store');

  frame.addEventListener('load', () => {
    const w = frame.contentWindow;
    const d = frame.contentDocument;
    if (!w || !d) return;

    function applyIntegration() {
      const paymentSelect = d.getElementById('chk-payment');
      const bankBox = d.getElementById('payment-bank-box');
      const gatewayBox = d.getElementById('payment-gateway-box');

      if (!paymentSelect) {
        setTimeout(applyIntegration, 250);
        return;
      }

      paymentSelect.innerHTML = `
        <option value="Cash on Delivery">Cash on Delivery (COD)</option>
        <option value="NayaPay">NayaPay - Manual Verification</option>
      `;

      if (bankBox) {
        bankBox.innerHTML = `
          <div class="font-bold text-aj-gold uppercase tracking-wider">Pay with NayaPay</div>
          <p class="text-white whitespace-pre-line">Account title: Muhammad Hamza Shafiq\nNayaPay number: 03199061682\nSend the exact payable amount, then enter the transaction reference below.</p>
          <div>
            <label class="block text-aj-muted mb-1">NayaPay Transaction Reference *</label>
            <input type="text" id="chk-bank-ref" required placeholder="Enter transaction reference / TID" class="w-full bg-aj-black border border-white/20 rounded-xl px-3 py-2 text-white focus:border-aj-gold focus:outline-none">
          </div>
          <div>
            <label class="block text-aj-muted mb-1">Payment screenshot (optional, max 5 MB)</label>
            <input type="file" id="chk-payment-proof" accept="image/jpeg,image/png,image/webp" class="w-full text-xs text-aj-muted">
            <p class="text-[11px] text-aj-muted mt-1">The screenshot is for review. It does not confirm payment automatically.</p>
          </div>
        `;
      }

      if (gatewayBox) gatewayBox.classList.add('hidden');

      w.togglePaymentMethodDetails = function (method) {
        if (!bankBox) return;
        const gateway = d.getElementById('payment-gateway-box');
        const ref = d.getElementById('chk-bank-ref');
        bankBox.classList.toggle('hidden', method !== 'NayaPay');
        if (gateway) gateway.classList.add('hidden');
        if (ref) ref.required = method === 'NayaPay';
      };

      w.togglePaymentMethodDetails(paymentSelect.value);

      w.handleSubmitRealOrder = async function (event) {
        event.preventEventDefault?.();
        event.preventDefault?.();

        if (!w.ensureSupabaseConnected || !w.ensureSupabaseConnected() || !w.state?.user || w.state.cart.length === 0) return;

        const btn = d.getElementById('submit-order-btn');
        if (btn) {
          btn.disabled = true;
          btn.textContent = 'Recording Order...';
        }

        const customer_name = d.getElementById('chk-name').value.trim();
        const customer_phone = d.getElementById('chk-phone').value.trim();
        const customer_city = d.getElementById('chk-city').value.trim();
        const payment_method = d.getElementById('chk-payment').value;
        const payment_reference = d.getElementById('chk-bank-ref')?.value.trim() || '';
        const customer_address = d.getElementById('chk-address').value.trim();

        if (payment_method === 'NayaPay' && !payment_reference) {
          w.showToast?.('Enter your NayaPay transaction reference.', 'error');
          if (btn) { btn.disabled = false; btn.textContent = 'Place Official Order'; }
          return;
        }

        const totals = w.calculateCartTotals();
        const order_number = 'AJ-' + Math.floor(100000 + Math.random() * 900000);
        const payment_status = payment_method === 'NayaPay' ? 'Awaiting Verification' : 'COD Pending';

        const items = w.state.cart.map((item) => {
          const product = w.state.products.find((p) => p.id === item.id);
          return {
            product_id: item.id,
            name: product ? product.name : 'Item',
            price: product ? Number(product.price) : 0,
            qty: item.qty
          };
        });

        let payment_proof_path = null;
        const proofInput = d.getElementById('chk-payment-proof');
        const proofFile = payment_method === 'NayaPay' ? proofInput?.files?.[0] : null;

        if (proofFile) {
          if (!/^image\/(jpeg|png|webp)$/.test(proofFile.type) || proofFile.size > 5 * 1024 * 1024) {
            w.showToast?.('Choose a JPG, PNG or WebP image no larger than 5 MB.', 'error');
            if (btn) { btn.disabled = false; btn.textContent = 'Place Official Order'; }
            return;
          }

          const extension = proofFile.name.split('.').pop().toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
          payment_proof_path = w.state.user.id + '/' + order_number + '-' + Date.now() + '.' + extension;

          const upload = await w.supabaseClient.storage
            .from('payment-proofs')
            .upload(payment_proof_path, proofFile, { contentType: proofFile.type, upsert: false });

          if (upload.error) {
            w.showToast?.('Screenshot upload failed: ' + upload.error.message, 'error');
            if (btn) { btn.disabled = false; btn.textContent = 'Place Official Order'; }
            return;
          }
        }

        const estimated_delivery_at = new Date(Date.now() + 48 * 3600 * 1000).toISOString();

        const { error } = await w.supabaseClient.from('orders').insert({
          order_number,
          user_id: w.state.user.id,
          user_email: w.state.user.email,
          customer_name,
          customer_phone,
          customer_city,
          customer_address,
          payment_method,
          payment_status,
          payment_reference,
          payment_proof_path,
          items,
          subtotal: totals.subtotal,
          delivery_fee: totals.delivery,
          grand_total: totals.grandTotal,
          status: 'Order Received',
          estimated_delivery_at
        });

        if (btn) {
          btn.disabled = false;
          btn.textContent = 'Place Official Order';
        }

        if (error) {
          w.showToast?.(error.message, 'error');
          return;
        }

        for (const item of items) {
          const product = w.state.products.find((p) => p.id === item.product_id);
          if (product) {
            await w.supabaseClient.from('products').update({ stock: Math.max(0, Number(product.stock) - item.qty) }).eq('id', product.id);
          }
        }

        w.state.cart = [];
        w.saveCartAndWishlist?.();
        await w.loadProductsFromSupabase?.();
        w.closeCheckoutModal?.();

        const itemSummary = items.map((item) => '• ' + item.name + ' (x' + item.qty + ') - ' + w.formatPKR(item.price * item.qty)).join('\n');
        const waText = encodeURIComponent(
          '*NEW NAYAPAY ORDER - AJ ACCERSSORES*\n' +
          'Order ID: *#' + order_number + '*\n' +
          'Customer: ' + customer_name + ' (' + w.state.user.email + ')\n' +
          'Phone: ' + customer_phone + '\n' +
          'City: ' + customer_city + '\n' +
          'Address: ' + customer_address + '\n' +
          'Payment: NayaPay\n' +
          'Payment status: Awaiting Verification\n' +
          'Reference: ' + payment_reference + '\n\n' +
          '*Items:*\n' + itemSummary + '\n\n' +
          '*Grand Total: ' + w.formatPKR(totals.grandTotal) + '*'
        );

        d.getElementById('success-order-id').textContent = '#' + order_number;
        d.getElementById('success-whatsapp-btn').href = 'https://wa.me/923199061682?text=' + waText;
        d.getElementById('order-success-modal').classList.remove('hidden');
        w.lucide?.createIcons?.();
      };

      w.viewPaymentProof = async function (path) {
        if (!w.isCurrentUserOwner?.() || !path) {
          w.showToast?.('Owner access required.', 'error');
          return;
        }
        const result = await w.supabaseClient.storage.from('payment-proofs').createSignedUrl(path, 60);
        if (result.error) {
          w.showToast?.(result.error.message, 'error');
          return;
        }
        w.open(result.data.signedUrl, '_blank', 'noopener,noreferrer');
      };

      w.lucide?.createIcons?.();
    }

    applyIntegration();
  });
})();
