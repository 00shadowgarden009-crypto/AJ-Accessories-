/* Pin the public hero portrait to the owner's repository image; no visitor uploads. */
(function () {
  'use strict';

  const frame = document.getElementById('aj-store');
  if (!frame) return;

  frame.addEventListener('load', () => {
    const w = frame.contentWindow;
    const d = frame.contentDocument;
    if (!w || !d) return;

    // Resolve beside the embedded store page so this works on GitHub Pages
    // project paths as well as a root custom domain.
    const portraitUrl = new URL('founder.jpg', frame.src).href;

    const style = d.createElement('style');
    style.textContent = `
      #founder-placeholder-overlay,
      label[title="Change Founder Portrait"],
      #setting-founder-portrait,
      input[type="file"] { display: none !important; }
      #hero-founder-img { display: block; }
      #founder-title-overlay {
        position: absolute;
        z-index: 25;
        left: 1rem;
        right: 1rem;
        bottom: 1rem;
        text-align: center;
        pointer-events: none;
        padding: .8rem 1rem;
        border: 1px solid rgba(212, 175, 55, .45);
        border-radius: 1rem;
        background: linear-gradient(90deg, rgba(8,8,8,.88), rgba(23,23,23,.72), rgba(8,8,8,.88));
        box-shadow: 0 0 22px rgba(181, 18, 36, .22);
        backdrop-filter: blur(8px);
      }
      #founder-title-overlay .founder-name {
        color: #fff;
        font: 800 1rem/1.3 Inter, sans-serif;
        letter-spacing: .12em;
        text-transform: uppercase;
        text-shadow: 0 2px 12px rgba(0,0,0,.8);
      }
      #founder-title-overlay .founder-role {
        margin-top: .2rem;
        color: #F3D066;
        font: 700 .68rem/1.4 Inter, sans-serif;
        letter-spacing: .28em;
        text-transform: uppercase;
      }
    `;
    d.head.appendChild(style);

    function pinPortrait() {
      const image = d.getElementById('hero-founder-img');
      if (!image) return;
      image.alt = 'Muhammad Hamza Shafiq, Founder and CEO of AJ ACCERSSORES';
      image.onerror = function () {
        image.style.display = 'none';
        // Do not show a broken-image icon or any user upload controls if the
        // repository image has not yet been added.
        d.getElementById('founder-placeholder-overlay')?.classList.add('hidden');
      };
      if (image.src !== portraitUrl) {
        image.style.display = '';
        image.src = portraitUrl;
      }

      const frameContent = image.parentElement;
      if (frameContent && !d.getElementById('founder-title-overlay')) {
        const title = d.createElement('div');
        title.id = 'founder-title-overlay';
        title.innerHTML = '<div class="founder-name">Muhammad Hamza Shafiq</div><div class="founder-role">Founder &amp; CEO</div>';
        frameContent.appendChild(title);
      }
      d.getElementById('founder-placeholder-overlay')?.classList.add('hidden');
    }

    // Disable local image upload handlers in the embedded page and ignore any
    // portrait URL loaded from browser storage or Supabase.
    w.handleLocalPortraitUpload = function (event) {
      event?.preventDefault?.();
      if (event?.target) event.target.value = '';
    };
    w.applyFounderPortrait = pinPortrait;

    pinPortrait();
    const observer = new MutationObserver(pinPortrait);
    observer.observe(d.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['src']
    });
  });
})();
