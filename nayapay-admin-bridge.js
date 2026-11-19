/* AJ ACCERSSORES - adds proof-view buttons to the owner order panel */
(function () {
  'use strict';

  const frame = document.getElementById('aj-store');
  if (!frame) return;

  frame.addEventListener('load', () => {
    const w = frame.contentWindow;
    const d = frame.contentDocument;
    if (!w || !d) return;

    function injectProofButtons() {
      const list = d.getElementById('admin-orders-list');
      if (!list || !w.state?.orders) return;

      w.state.orders.forEach((order) => {
        if (!order.payment_proof_path) return;

        const cards = Array.from(list.children);
        cards.forEach((card) => {
          if (!card.textContent.includes('#' + order.order_number)) return;
          if (card.querySelector('[data-nayapay-proof="' + order.order_number + '"]')) return;

          const button = d.createElement('button');
          button.type = 'button';
          button.dataset.nayapayProof = order.order_number;
          button.className = 'px-3 py-2 rounded-xl bg-aj-gold/15 border border-aj-gold/40 text-aj-gold text-xs font-bold hover:bg-aj-gold/25 transition';
          button.textContent = 'View NayaPay Screenshot';
          button.onclick = () => w.viewPaymentProof(order.payment_proof_path);

          card.appendChild(button);
        });
      });
    }

    const observer = new MutationObserver(injectProofButtons);
    observer.observe(d.documentElement, { childList: true, subtree: true });

    setTimeout(injectProofButtons, 1000);
  });
})();
