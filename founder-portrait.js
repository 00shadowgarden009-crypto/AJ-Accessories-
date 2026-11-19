/* Pin the public hero portrait to the owner's image; never expose image upload controls. */
(function () {
  'use strict';

  const frame = document.getElementById('aj-store');
  if (!frame) return;

  frame.addEventListener('load', () => {
    const w = frame.contentWindow;
    const d = frame.contentDocument;
    if (!w || !d) return;

    const portraitUrl = new URL('./founder.jpg', document.baseURI).href;

    const style = d.createElement('style');
    style.textContent = `
      #founder-placeholder-overlay,
      label[title="Change Founder Portrait"],
      #setting-founder-portrait,
      #setting-founder-portrait + *,
      input[type="file"] { display: none !important; }
      #hero-founder-img { display: block !important; }
    `;
    d.head.appendChild(style);

    function pinPortrait() {
      const image = d.getElementById('hero-founder-img');
      if (!image) return;
      image.alt = 'AJ ACCERSSORES Founder';
      image.onerror = function () {
        // Never reveal a customer-facing file picker if the owner's image is missing.
        image.classList.add('hidden');
        d.getElementById('founder-placeholder-overlay')?.classList.add('hidden');
      };
      if (image.src !== portraitUrl) image.src = portraitUrl;
      d.getElementById('founder-placeholder-overlay')?.classList.add('hidden');
    }

    // Disable local image upload handlers in the embedded page.
    w.handleLocalPortraitUpload = function (event) {
      if (event) {
        event.preventDefault?.();
        event.target.value = '';
      }
    };
    w.applyFounderPortrait = pinPortrait;

    pinPortrait();
    const observer = new MutationObserver(pinPortrait);
    observer.observe(d.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['src'] });
  });
})();
