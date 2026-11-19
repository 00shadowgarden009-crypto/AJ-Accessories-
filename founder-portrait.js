/* Pin the public hero portrait to founder.jpeg and remove visitor upload controls. */
(function () {
  'use strict';

  const frame = document.getElementById('aj-store');
  if (!frame) return;

  frame.addEventListener('load', () => {
    const w = frame.contentWindow;
    const d = frame.contentDocument;
    if (!w || !d) return;

    // The uploaded repository file is founder.jpeg (not founder.jpg).
    const portraitUrl = new URL('founder.jpeg', frame.src).href;

    const style = d.createElement('style');
    style.textContent = `
      #founder-placeholder-overlay,
      label[title="Change Founder Portrait"],
      #setting-founder-portrait,
      input[type="file"] { display: none !important; }
      #hero-founder-img { display: block; }

      #hero-parallax-zone .parallax-badge[data-depth="38"] { translate: -22px 0; }
      #hero-parallax-zone .parallax-badge[data-depth="48"] { translate: 22px 0; }
      @media (max-width: 640px) {
        #hero-parallax-zone .parallax-badge[data-depth="38"] { translate: -8px 0; }
        #hero-parallax-zone .parallax-badge[data-depth="48"] { translate: 8px 0; }
      }

      #founder-title-overlay {
        position: absolute;
        z-index: 25;
        left: .85rem;
        right: .85rem;
        bottom: .85rem;
        overflow: hidden;
        text-align: center;
        pointer-events: none;
        padding: .9rem 1rem .85rem;
        border: 1px solid rgba(243, 208, 102, .62);
        border-radius: 14px;
        background: linear-gradient(110deg, rgba(8,8,8,.95), rgba(30,10,15,.88) 48%, rgba(8,8,8,.95));
        box-shadow: 0 0 14px rgba(225, 29, 51, .35), inset 0 0 18px rgba(212, 175, 55, .08);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        clip-path: polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px);
      }
      #founder-title-overlay::before {
        content: "";
        position: absolute;
        top: 0;
        left: -45%;
        width: 35%;
        height: 1px;
        background: linear-gradient(90deg, transparent, #F3D066, #FF2E43, transparent);
        box-shadow: 0 0 12px rgba(243, 208, 102, .8);
        animation: founderScan 4s ease-in-out infinite;
      }
      #founder-title-overlay::after {
        content: "AJ  /  LEADERSHIP";
        display: block;
        margin-bottom: .35rem;
        color: rgba(243, 208, 102, .82);
        font: 700 .52rem/1.3 Inter, sans-serif;
        letter-spacing: .3em;
      }
      #founder-title-overlay .founder-role {
        display: inline-flex;
        align-items: center;
        gap: .45rem;
        color: #F3D066;
        font: 800 .68rem/1.4 Inter, sans-serif;
        letter-spacing: .32em;
        text-transform: uppercase;
      }
      #founder-title-overlay .founder-role::before,
      #founder-title-overlay .founder-role::after {
        content: "";
        width: 1.15rem;
        height: 1px;
        background: linear-gradient(90deg, transparent, #FF2E43, #F3D066);
      }
      #founder-title-overlay .founder-role::after { transform: rotate(180deg); }
      @keyframes founderScan {
        0% { left: -45%; opacity: 0; }
        15%, 75% { opacity: 1; }
        100% { left: 110%; opacity: 0; }
      }
      @media (prefers-reduced-motion: reduce) {
        #founder-title-overlay::before { animation: none; }
      }
    `;
    d.head.appendChild(style);

    function pinPortrait() {
      const image = d.getElementById('hero-founder-img');
      if (!image) return;

      image.alt = 'Founder portrait';
      image.onerror = function () {
        image.alt = '';
        image.style.display = 'none';
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
        title.innerHTML = '<div class="founder-role">Founder &amp; CEO</div>';
        frameContent.appendChild(title);
      }
      d.getElementById('founder-placeholder-overlay')?.classList.add('hidden');
    }

    w.handleLocalPortraitUpload = function (event) {
      event?.preventDefault?.();
      if (event?.target) event.target.value = '';
    };
    w.applyFounderPortrait = pinPortrait;

    pinPortrait();
    const observer = new MutationObserver(pinPortrait);
    observer.observe(d.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['src'] });
  });
})();
