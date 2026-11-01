// AfterHours story v3: scroll timeline + UI. The 3D scene (story3-scene.js)
// only reads window.AH.st; this file owns the story, copy and palette.
(() => {
  const st = { sky: 0, dark: 0, off: 0, s1: 0, trail: 0, s2: 0, fuse: 0, zoom: 0, blinds: 0, pan: 0, you: 0, clock: 0, polas: 0 };
  const AH = (window.AH = { st, joined: false, onJoin: null });
  const $ = (q) => document.querySelector(q);
  const R = document.documentElement.style;
  const clamp = (t) => Math.min(1, Math.max(0, t));
  const lerp = (a, b, t) => a + (b - a) * t;
  const hex = (h) => [1, 3, 5].map((i) => parseInt(h.substr(i, 2), 16));
  const mix = (a, b, t) => '#' + hex(a).map((v, i) => Math.round(lerp(v, hex(b)[i], t)).toString(16).padStart(2, '0')).join('');
  const mix3 = (a, b, c, t) => (t < 0.5 ? mix(a, b, t * 2) : mix(b, c, (t - 0.5) * 2));
  AH.palette = (t) => ({
    top: mix3('#efc17e', '#b9757a', '#1d1520', t),
    mid: mix3('#f5dcb2', '#e7a07a', '#2a1d29', t),
    low: mix3('#f7ecdc', '#f2c191', '#3a2731', t),
  });

  /* scene always sits below the tallest text block (no overlap on any screen) */
  const panels = [...document.querySelectorAll('.panel')];
  const phone = () => innerWidth < 900 && innerHeight > innerWidth; AH.phone = phone;
  const side = () => innerWidth >= 900 || (innerWidth > innerHeight && innerHeight < 520);
  AH.side = side;
  function layoutScene() {
    document.body.classList.toggle('side', innerWidth > innerHeight && innerHeight < 520);
    if (document.body.classList.contains('side')) { $('#scene').style.height = ''; $('#polas').style.top = '18%'; $('#polas').style.height = '60%'; AH.sceneTop = 0; return; }
    const bottom = Math.max(...panels.slice(0, 7).map((p) => p.offsetTop + p.offsetHeight));
    const H = $('#stage').clientHeight || innerHeight;
    const h = Math.max(H * (phone() ? 0.3 : 0.36), H - bottom - 18);
    $('#scene').style.height = h + 'px';
    $('#polas').style.top = bottom + 10 + 'px';
    $('#polas').style.height = h * 0.62 + 'px';
    AH.sceneTop = H - h;
  }
  let lastW = innerWidth, lastH = innerHeight;
  const typing = () => document.activeElement && /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName);
  addEventListener('resize', () => { if (typing()) return; if (phone() && innerWidth === lastW && Math.abs(innerHeight - lastH) < 160) return; lastW = innerWidth; lastH = innerHeight; layoutScene(); });
  document.fonts.ready.then(layoutScene);
  layoutScene();

  /* bokeh: warm, out-of-focus city lights drifting in the evening air */
  const bk = $('#bokeh'), bx = bk.getContext('2d');
  const sprites = new Map();
  let dots = [];
  function sizeBokeh() {
    bk.width = innerWidth * Math.min(devicePixelRatio, 1.5); bk.height = innerHeight * Math.min(devicePixelRatio, 1.5);
    const n = innerWidth < 760 ? 16 : 30, k = bk.width / innerWidth; sprites.clear();
    dots = Array.from({ length: n }, () => ({ x: Math.random() * bk.width, y: (0.25 + Math.random() * 0.7) * bk.height, r: (8 + Math.random() * 26) * k, v: (0.05 + Math.random() * 0.12) * k, a: 0.25 + Math.random() * 0.5, h: Math.random() < 0.6 ? '255,190,150' : Math.random() < 0.5 ? '255,150,165' : '255,205,130' }));
  }
  sizeBokeh(); addEventListener('resize', sizeBokeh);
  // each soft heart is painted ONCE to a small sprite, then just stamped (cheap)
  function heartSprite(h, r) {
    const key = h + '|' + Math.round(r); if (sprites.has(key)) return sprites.get(key);
    const pad = Math.ceil(r * 0.5), S = Math.ceil(r * 3.4) + pad * 2, c = document.createElement('canvas'); c.width = c.height = S; const x = c.getContext('2d');
    const cx = S / 2, cy = S / 2; x.filter = `blur(${Math.max(1, r * 0.12)}px)`;
    const g = x.createRadialGradient(cx, cy, 0, cx, cy, r * 1.4); g.addColorStop(0, `rgba(${h},0.6)`); g.addColorStop(1, `rgba(${h},0.12)`); x.fillStyle = g;
    x.beginPath(); x.moveTo(cx, cy + r * 0.9); x.bezierCurveTo(cx - r * 1.6, cy - r * 0.1, cx - r * 0.75, cy - r * 1.25, cx, cy - r * 0.45);
    x.bezierCurveTo(cx + r * 0.75, cy - r * 1.25, cx + r * 1.6, cy - r * 0.1, cx, cy + r * 0.9); x.closePath(); x.fill();
    sprites.set(key, c); return c;
  }
  let bokehOn = true;
  function drawBokeh() {
    const vis = Math.max(0.45 * (1 - clamp(st.sky * 2)), clamp((st.dark - 0.15) / 0.5)) * (1 - st.you * 0.6);
    if (bokehOn) { bx.clearRect(0, 0, bk.width, bk.height);
      if (vis > 0.01) for (const d of dots) {
        d.y -= d.v; d.x += Math.sin(d.y / 90) * 0.15; if (d.y < -d.r) d.y = bk.height + d.r;
        const r = d.r * 0.55, sp = heartSprite(d.h, r); bx.globalAlpha = d.a * vis; bx.drawImage(sp, d.x - sp.width / 2, d.y - sp.height / 2);
      } bx.globalAlpha = 1; }
  requestAnimationFrame(drawBokeh);
  new IntersectionObserver(([e]) => (bokehOn = e.isIntersecting)).observe(document.getElementById('stage'));
  }
  requestAnimationFrame(drawBokeh);

  /* render the HTML side of the story */
  const clock = $('#clock'), pass = $('#passwrap'), chat = $('#chat'), tick = $('#tick');
  const polas = [...document.querySelectorAll('.pola')];
  const fmt = (m) => `${((Math.floor(m / 60) - 1) % 12) + 1}:${String(Math.floor(m % 60)).padStart(2, '0')} PM`;
  function render() {
    const n = st.dark, k = Math.min(1, st.sky), t = Math.max(k * 0.5, n);
    const p = AH.palette(t);
    R.setProperty('--sky1', p.top); R.setProperty('--sky2', p.mid); R.setProperty('--sky3', p.low); R.setProperty('--dark', n);
    AH.t = t;
    document.body.classList.toggle('night', n > 0.45);
    chat.style.opacity = clamp((st.zoom - 0.6) / 0.4);
    document.querySelectorAll('.promises li').forEach((li, i) => { const o = clamp((st.blinds - i * 0.14) / 0.22); li.style.opacity = o; li.style.transform = `translateY(${(1 - o) * 8}px)`; });
    if (tick) tick.style.transform = phone() ? `translateX(${6 - st.pan * 82}%)` : `translateX(${30 - st.pan * 70}%)`;
    polas.forEach((el, i) => { const o = clamp((st.polas - i * 0.18) / 0.35) * (1 - clamp((st.polas - 1.2) / 0.3)); el.style.opacity = o; el.style.setProperty('--y', `${(1 - o) * 18}px`); });
    pass.style.opacity = clamp((st.you - 0.4) / 0.6); pass.classList.toggle('on', st.you > 0.8);
    pass.style.transform = side() ? `translateY(calc(-50% + ${(1 - st.you) * 30}px))` : `translateX(-50%) translateY(${(1 - st.you) * 30}px)`;
    if (!side()) { const hd = panels[7]; pass.style.top = hd.offsetTop + hd.offsetHeight + 4 + 'px'; } else pass.style.top = '';
    pass.style.maxHeight = side() ? '' : `${innerHeight - pass.offsetTop - 12}px`;
    pass.classList.toggle('scrolls', pass.scrollHeight > pass.clientHeight + 2);
    $('#scene').style.opacity = 1 - st.you * 0.5;
    clock.textContent = fmt(lerp(18 * 60 + 58, 21 * 60 + 44, st.clock)) + ' IST';
  }
  AH.render = render;

  const topBar = $('#top'), storyEl = $('#story');
  addEventListener('scroll', () => topBar.classList.toggle('solid', scrollY > storyEl.offsetTop + storyEl.offsetHeight - innerHeight * 1.02), { passive: true });
  window.joined = (e) => {
    e && e.preventDefault(); AH.joined = true;
    $('#pass').classList.add('joined'); pass.classList.add('joined');
    AH.onJoin && AH.onJoin();
    setTimeout(() => AH.openShare && AH.openShare(), 1300); // after the stamp lands
  };
  window.goJoin = (e) => { e.preventDefault(); const s = $('#story'); scrollTo({ top: s.offsetTop + (s.offsetHeight - innerHeight) * 0.97, behavior: 'smooth' }); };

  /* one evening, scrubbed by scroll */
  gsap.registerPlugin(ScrollTrigger);
  ScrollTrigger.config({ ignoreMobileResize: true }); // keyboard opening must not re-flow the story
  const tl = gsap.timeline({ defaults: { ease: 'none' }, onUpdate: render, scrollTrigger: { trigger: '#story', start: 'top top', end: 'bottom bottom', scrub: 0.9 } });
  const show = (i, at, len) => {
    const el = panels[i];
    tl.fromTo(el, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.22, ease: 'power2.out', onStart: () => el.classList.add('on'), onReverseComplete: () => el.classList.remove('on') }, at);
    if (len) tl.to(el, { opacity: 0, y: -10, duration: 0.18, onComplete: () => el.classList.remove('on'), onReverseComplete: () => el.classList.add('on') }, at + len);
  };
  gsap.set(panels[0], { opacity: 1 }); panels[0].classList.add('on');
  tl.to(panels[0], { opacity: 0, y: -10, duration: 0.18 }, 0.5)
    .to(st, { sky: 1, clock: 0.12, duration: 1.3 }, 0.4).to(st, { off: 1, duration: 1.1 }, 0.7)
    .to(st, { polas: 1, duration: 0.6 }, 0.85).to(st, { polas: 1.5, duration: 0.3 }, 1.6);
  show(1, 0.8, 1.05);
  tl.to(st, { dark: 1, clock: 0.3, duration: 0.7 }, 1.75).to(st, { zoom: 0.45, duration: 0.6 }, 1.85).to(st, { s1: 1, duration: 0.9 }, 2.0).to(st, { trail: 1, duration: 0.45 }, 2.85);
  show(2, 2.0, 1.1);
  tl.to(st, { s2: 1, clock: 0.48, duration: 0.7 }, 3.3).to(st, { fuse: 1, duration: 0.4 }, 3.95);
  show(3, 3.35, 1.1);
  tl.to(st, { zoom: 1, clock: 0.5, duration: 0.6 }, 4.6);
  show(4, 4.75, 0.95);
  tl.to(st, { zoom: 0, duration: 0.55 }, 5.85).to(st, { blinds: 1.05, clock: 0.7, duration: 1.3 }, 6.0);
  show(5, 6.05, 1.5);
  tl.to(st, { blinds: 0, clock: 0.85, duration: 0.6 }, 7.7).to(st, { pan: 1, duration: 1.2 }, 7.9);
  show(6, 7.9, 1.2);
  tl.to(st, { pan: 0, clock: 1, duration: 0.6 }, 9.2).to(st, { you: 1, duration: 0.6 }, 9.3);
  show(7, 9.4, 0);
  tl.to({}, { duration: 1.2 }, 9.9);
  render();
})();
