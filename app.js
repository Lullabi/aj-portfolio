(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- routing: each page is a [data-view] block, picked by the URL hash ---------- */
  const views = [...document.querySelectorAll('[data-view]')];
  const titles = { home: 'Aj Hervey · Product Designer' };
  views.forEach(v => { if (v.dataset.title) titles[v.dataset.view] = v.dataset.title + ' · Aj Hervey'; });
  const homeAnchors = ['top', 'work', 'about'];
  let current = null;

  function show(name) {
    if (current === name) return false;
    views.forEach(v => { v.hidden = v.dataset.view !== name; });
    current = name;
    document.title = titles[name] || titles.home;
    document.querySelectorAll('.nav-links a').forEach(a => {
      const target = a.getAttribute('href').slice(1);
      const on = target === name || (target === 'work' && a.dataset.cases && a.dataset.cases.split(' ').includes(name));
      if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
    if (name === 'home') tinIntro();
    setupToc(name);
    return true;
  }

  function route() {
    const h = decodeURIComponent(location.hash.slice(1)) || 'top';
    if (h === 'contact') {
      if (!current) show('home');
      document.getElementById('contact').scrollIntoView();
      return;
    }
    const view = views.find(v => v.dataset.view === h);
    if (view && h !== 'home') {
      show(h);
      window.scrollTo(0, 0);
      return;
    }
    show('home');
    const el = homeAnchors.includes(h) && h !== 'top' ? document.getElementById(h) : null;
    if (el) el.scrollIntoView(); else window.scrollTo(0, 0);
  }
  addEventListener('hashchange', route);

  /* ---------- the tin ---------- */
  const tin = document.getElementById('tin'), lid = document.getElementById('lid');
  // two handles: the classic side key (drag up to open) and the pastel pull tab (drag down to open)
  const handles = [{ el: document.getElementById('key'), dir: 1 }, { el: document.getElementById('pull-ring'), dir: -1 }];
  const toggle = document.getElementById('toggle'), stage = document.getElementById('stage');
  let p = 0, anim = null, introduced = false;

  function set(v) {
    p = Math.max(0, Math.min(1, v));
    tin.style.setProperty('--p', p.toFixed(4));
    handles.forEach(({ el }) => {
      el.setAttribute('aria-valuenow', Math.round(p * 100));
      el.setAttribute('aria-valuetext', p > .97 ? 'Open' : p < .03 ? 'Closed' : Math.round(p * 100) + '% open');
    });
    toggle.textContent = p > .5 ? 'Close the tin' : 'Open the tin';
  }
  function animateTo(target, ms = 1500) {
    cancelAnimationFrame(anim);
    if (reduce) return set(target);
    const from = p, t0 = performance.now();
    const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    const step = now => {
      const t = Math.min(1, (now - t0) / ms);
      set(from + (target - from) * ease(t));
      if (t < 1) anim = requestAnimationFrame(step);
    };
    anim = requestAnimationFrame(step);
  }
  function tinIntro() {
    if (introduced) return;
    introduced = true;
    set(0);
    setTimeout(() => animateTo(1, 1800), 700);
  }

  let drag = null;
  const end = () => { if (!drag) return; drag = null; if (p > .88) animateTo(1, 300); else if (p < .08) animateTo(0, 300); };
  handles.forEach(({ el, dir }) => {
    el.addEventListener('pointerdown', e => {
      cancelAnimationFrame(anim);
      drag = { y: e.clientY, p, h: lid.getBoundingClientRect().height, dir };
      el.setPointerCapture(e.pointerId);
    });
    el.addEventListener('pointermove', e => { if (drag) set(drag.p + drag.dir * (drag.y - e.clientY) / drag.h); });
    el.addEventListener('pointerup', end);
    el.addEventListener('pointercancel', end);
    el.addEventListener('keydown', e => {
      const k = e.key;
      if (k === 'ArrowUp' || k === 'ArrowRight') set(p + .1);
      else if (k === 'ArrowDown' || k === 'ArrowLeft') set(p - .1);
      else if (k === 'Home') set(0);
      else if (k === 'End') set(1);
      else if (k === 'Enter' || k === ' ') animateTo(p > .5 ? 0 : 1, 900);
      else return;
      e.preventDefault();
    });
  });
  toggle.addEventListener('click', () => animateTo(p > .5 ? 0 : 1, 1100));
  lid.addEventListener('click', () => { if (p < .5) animateTo(1, 1100); });

  if (!reduce && matchMedia('(hover: hover)').matches) {
    const hero = document.querySelector('.hero');
    hero.addEventListener('pointermove', e => {
      if (drag) return;
      const r = stage.getBoundingClientRect();
      const x = (e.clientX - (r.left + r.width / 2)) / innerWidth;
      const y = (e.clientY - (r.top + r.height / 2)) / innerHeight;
      tin.style.setProperty('--ty', (x * 14).toFixed(2) + 'deg');
      tin.style.setProperty('--tx', (-y * 10).toFixed(2) + 'deg');
    });
    hero.addEventListener('pointerleave', () => { tin.style.setProperty('--tx', '0deg'); tin.style.setProperty('--ty', '0deg'); });
  }

  /* ---------- packaging style switch: pastel (default) or classic ---------- */
  const pastelCss = document.getElementById('pastel-css');
  const styleBtns = [...document.querySelectorAll('.style-switch button')];
  function applyStyle(style) {
    pastelCss.disabled = style === 'classic';
    document.documentElement.dataset.style = style;
    styleBtns.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.style === style)));
    try { localStorage.setItem('tin-style', style); } catch (e) {}
  }
  applyStyle(document.documentElement.dataset.style === 'classic' ? 'classic' : 'pastel');
  styleBtns.forEach(b => b.addEventListener('click', () => {
    const style = b.dataset.style;
    if (style === document.documentElement.dataset.style) return;
    const r = stage.getBoundingClientRect();
    const tinInView = current === 'home' && r.bottom > 0 && r.top < innerHeight;
    if (reduce || !tinInView || p < .5) return applyStyle(style);
    // close the lid, swap the label, open it again
    animateTo(0, 450);
    setTimeout(() => { applyStyle(style); animateTo(1, 900); }, 500);
  }));

  /* ---------- case study contents: built from each section's heading ---------- */
  let tocObserver = null;
  function setupToc(name) {
    if (tocObserver) { tocObserver.disconnect(); tocObserver = null; }
    const view = views.find(v => v.dataset.view === name);
    const toc = view && view.querySelector('.toc');
    if (!toc) return;
    const secs = [...view.querySelectorAll('.case-sec')];
    if (!toc.dataset.built) {
      secs.forEach(s => {
        const b = document.createElement('button');
        b.type = 'button';
        b.textContent = s.dataset.toc || s.querySelector('h2').textContent;
        b.addEventListener('click', () => s.scrollIntoView({ block: 'start' }));
        toc.appendChild(b);
      });
      toc.dataset.built = '1';
    }
    const btns = [...toc.querySelectorAll('button')];
    if (!('IntersectionObserver' in window)) return;
    tocObserver = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (!en.isIntersecting) return;
        const i = secs.indexOf(en.target);
        btns.forEach((b, j) => b.classList.toggle('on', i === j));
      });
    }, { rootMargin: '-20% 0px -70% 0px' });
    secs.forEach(s => tocObserver.observe(s));
  }

  /* ---------- takeaway receipts print out when scrolled into view ---------- */
  if (!reduce && 'IntersectionObserver' in window) {
    const printers = document.querySelectorAll('.printer');
    const printObserver = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (!en.isIntersecting) return;
        en.target.classList.replace('pending', 'printed');
        printObserver.unobserve(en.target);
      });
    }, { threshold: .15 });
    printers.forEach(pr => { pr.classList.add('pending'); printObserver.observe(pr); });
  }

  /* ---------- screenshot lightbox ---------- */
  const box = document.getElementById('lightbox');
  const boxImg = box.querySelector('img'), boxCap = box.querySelector('p');
  document.addEventListener('click', e => {
    const shot = e.target.closest('.shot');
    if (!shot) return;
    const img = shot.querySelector('img');
    boxImg.src = img.src;
    boxImg.alt = img.alt;
    const cap = shot.closest('figure') && shot.closest('figure').querySelector('figcaption');
    boxCap.textContent = cap ? cap.textContent : img.alt;
    if (box.showModal) box.showModal(); else box.setAttribute('open', '');
  });
  box.addEventListener('click', e => { if (e.target === box || e.target.closest('button')) box.close(); });

  /* ---------- copy email ---------- */
  const copy = document.getElementById('copy'), email = document.getElementById('email');
  copy.addEventListener('click', () => {
    const done = () => { copy.textContent = 'Copied'; setTimeout(() => { copy.textContent = 'Copy email'; }, 1600); };
    const fallback = () => {
      const r = document.createRange(); r.selectNodeContents(email);
      const s = getSelection(); s.removeAllRanges(); s.addRange(r);
      copy.textContent = 'Selected, press Ctrl+C';
    };
    if (navigator.clipboard) navigator.clipboard.writeText(email.textContent).then(done, fallback); else fallback();
  });

  /* ---------- barcode ---------- */
  const bars = document.getElementById('bars');
  let seed = 7;
  for (let i = 0; i < 46; i++) {
    seed = (seed * 9301 + 49297) % 233280;
    const b = document.createElement('i');
    b.style.width = (1 + (seed % 3)) + 'px';
    b.style.marginRight = (1 + (seed % 2) * 2) + 'px';
    bars.appendChild(b);
  }

  route();
})();
