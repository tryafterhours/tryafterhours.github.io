// afterhours story v3: interactions (tech-park picker, validation, pop-up pass,
// fit-to-screen, hero card, couple cards). Reads window.AH from story3.js.
(() => {
  const AH = window.AH, st = AH.st, $ = (q, r = document) => r.querySelector(q);
  const clamp = (t) => Math.min(1, Math.max(0, t)), lerp = (a, b, t) => a + (b - a) * t;
  const ease = (t) => 1 - Math.pow(1 - t, 3);

  /* ---------- hero card + couple cards follow the 3D scene ---------- */
  const notify = $('#notify'), pcA = $('#pcA'), pcB = $('#pcB'), pcs = $('.pcspark');
  // hero card cycles through the moments that make afterhours feel like what it is
  const lines = [["Someone's thinking of you", 'afterhours · just now'], ["It's mutual", 'You both Sparked each other'], ['New message', '"wait… it\'s actually you??"']];
  let li = 0; const nt = $('#notify .ntext');
  setInterval(() => { if (st.sky > 0.2) return; nt.style.opacity = 0; setTimeout(() => { li = (li + 1) % lines.length; nt.querySelector('b').textContent = lines[li][0]; nt.querySelector('small').textContent = lines[li][1]; nt.style.opacity = 1; }, 350); }, 3200);
  let nW = 0, nH = 0, cW = 0, cH = 0; const measure = () => { nW = notify.offsetWidth; nH = notify.offsetHeight; cW = pcA.offsetWidth; cH = pcA.offsetHeight; const p1 = document.querySelector('.pola'); if (p1) document.documentElement.style.setProperty('--pola1h', p1.offsetHeight + 'px'); };
  addEventListener('resize', () => requestAnimationFrame(measure)); document.fonts.ready.then(measure); setInterval(measure, 600);
  AH.extra = [() => {
    const s = AH.scr; if (!s) return; if (!nW) measure();
    const hero = 1 - clamp(st.sky * 3);
    notify.style.opacity = hero;
    const nx = Math.min(innerWidth - nW - 12, s.crown.x - 6), ny = Math.max(AH.sceneTop + 6, s.crown.y - nH - 8);
    notify.style.transform = `translate(${Math.max(12, Math.min(nx, innerWidth - nW - 12))}px, ${Math.max(60, ny)}px) translateY(${(1 - hero) * 10}px)`;
    // couple: cards rise out of the two windows and meet in the middle
    const k = ease(clamp((st.zoom - 0.5) / 0.35)), vis = clamp((st.zoom - 0.45) / 0.15);
    const w = cW, h = cH, cx = innerWidth / 2, cy = Math.max(AH.sceneTop + 10, innerHeight * 0.5 - h * 0.62);
    const ax = lerp(s.a.x - w / 2, cx - w - 8, k), ay = lerp(s.a.y - h / 2, cy, k);
    const bx = lerp(s.b.x - w / 2, cx + 8, k), by = lerp(s.b.y - h / 2, cy, k);
    pcA.style.opacity = pcB.style.opacity = vis;
    pcA.style.transform = `translate(${ax}px,${ay}px) rotate(${lerp(0, -6, k)}deg) scale(${lerp(0.3, 1, k)})`;
    pcB.style.transform = `translate(${bx}px,${by}px) rotate(${lerp(0, 5, k)}deg) scale(${lerp(0.3, 1, k)})`;
    if (AH.phone && AH.phone()) { const chat = $('#chat'), tm = chat.querySelector('.timer'); const top = cy + h * lerp(0.3, 1, k) + 18;
      chat.style.bottom = 'auto'; chat.style.top = top + 'px';
      // timer sits above the two photo cards on phones
      Object.assign(tm.style, { position: 'absolute', left: '50%', transform: 'translateX(-50%)', top: (cy - 40 - top) + 'px', whiteSpace: 'nowrap', margin: '0' }); }
    else { const chat = $('#chat'), tm = chat.querySelector('.timer');
      // laptops/desktops: chat bubbles stay put; only the timer moves above the photo cards
      Object.assign(tm.style, { position: 'absolute', left: '50%', transform: 'translateX(-50%)', top: (cy - 40 - chat.offsetTop) + 'px', whiteSpace: 'nowrap', margin: '0' }); }
    pcs.style.opacity = clamp((k - 0.7) / 0.3);
    pcs.style.transform = `translate(${cx}px,${cy + h * 0.5}px) scale(${lerp(0.4, 1, clamp((k - 0.7) / 0.3))})`;
  }];

  // one failing frame must never freeze the overlays: catch, keep going
  (function every() { for (const f of AH.extra || []) { try { f(); } catch (e) { if (!every.warned) { every.warned = true; console.warn('overlay frame skipped', e); } } } requestAnimationFrame(every); })();

  /* ---------- tech-park picker (searchable, tap clears, × button, Other) ---------- */
  const input = $('#t'), list = $('#tlist'), clr = $('.combo .clear');
  let parks = [], active = -1, items = [];
  AH.park = null; // {name, other:boolean}
  fetch('assets/techparks.json').then((r) => r.json()).then((d) => (parks = d)).catch(() => {});
  const norm = (x) => x.toLowerCase().replace(/[^a-z0-9]/g, '');
  function open(q) {
    const n = norm(q);
    // forgiving match: substring first, then letters-in-order ("mny" → Manyata)
    const sub = (x) => { let i = 0; for (const ch of x) if (ch === n[i]) i++; return i === n.length; };
    const score = (p) => { const f = [p.name, ...p.aka].map(norm); if (!n) return 1; if (f.some((x) => x.startsWith(n))) return 4; if (f.some((x) => x.includes(n)) || norm(p.area).includes(n)) return 3; if (n.length >= 3 && f.some(sub)) return 2; return 0; };
    const hits = parks.map((p) => [p, score(p)]).filter(([, k]) => k).sort((a, b) => b[1] - a[1]).map(([p]) => p).slice(0, 40);
    items = hits.map((p) => ({ name: p.name, area: p.area }));
    if (q.trim().length >= 2 && !hits.some((p) => norm(p.name) === n)) items.push({ name: q.trim(), other: true });
    else if (!q.trim()) items.push({ add: true });
    list.innerHTML = items.map((it, i) => `<li role="option" id="opt${i}" class="${it.other ? 'other' : it.add ? 'add' : ''}" aria-selected="${i === active}"><span>${it.add ? '+ My tech park isn\'t listed' : it.other ? `+ Add “${esc(it.name)}”` : esc(it.name)}</span>${it.area ? `<small>${esc(it.area)}</small>` : ''}</li>`).join('')
      || '<li aria-disabled="true"><span>Keep typing…</span></li>';
    list.hidden = false; input.setAttribute('aria-expanded', 'true');
  }
  const esc = (x) => x.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  function close() { list.hidden = true; input.setAttribute('aria-expanded', 'false'); active = -1; }
  function pick(i) { const it = items[i]; if (!it) return;
    if (it.add) { AH.park = null; input.value = ''; input.placeholder = 'Type your tech park or building name'; close(); input.focus(); return; } AH.park = { name: it.name, other: !!it.other }; input.value = it.name; clr.hidden = false; close(); clearErr('t'); requestAnimationFrame(() => input.select()); }
  input.addEventListener('focus', () => { input.select(); open(AH.park ? '' : input.value); });
  input.addEventListener('mouseup', (e) => { if (AH.park) { e.preventDefault(); input.select(); open(''); } });
  input.addEventListener('input', () => { AH.park = null; clr.hidden = !input.value; active = -1; open(input.value); });
  input.addEventListener('keydown', (e) => {
    // a park is already chosen: the next letter starts a fresh search (no manual clearing)
    if (AH.park && e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey && input.selectionStart === input.selectionEnd) { input.value = ''; AH.park = null; }
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); if (list.hidden) open(input.value); active = (active + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length; open(input.value); input.setAttribute('aria-activedescendant', 'opt' + active); }
    else if (e.key === 'Enter') { if (!list.hidden && active >= 0) { e.preventDefault(); pick(active); } }
    else if (e.key === 'Escape') close();
  });
  list.addEventListener('mousedown', (e) => { const li = e.target.closest('li[role=option]'); if (li) { e.preventDefault(); pick(+li.id.slice(3)); } });
  input.addEventListener('blur', () => setTimeout(close, 120));
  clr.addEventListener('click', () => { input.value = ''; AH.park = null; clr.hidden = true; input.focus(); });

  /* ---------- friendly validation (no browser pop-ups) ---------- */
  const form = $('#pass');
  const msg = { e: "That email doesn't look right.", t: 'Pick your tech park, or type your building.', g: 'Choose one.', age: "Please confirm you're 18 or older." };
  function setErr(id, on) { const el = $(`.err[data-for="${id}"]`, form); el.textContent = on ? msg[id] : ''; el.classList.toggle('on', on); el.closest('.row')?.classList.toggle('bad', on); }
  const clearErr = (id) => setErr(id, false);
  const checks = {
    e: () => /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test($('#e').value.trim()),
    t: () => !!AH.park || $('#t').value.trim().length >= 3,
    g: () => !!form.querySelector('input[name=g]:checked'),
    age: () => $('#age').checked,
  };
  $('#e').addEventListener('blur', () => $('#e').value && setErr('e', !checks.e()));
  form.addEventListener('change', (e) => { if (e.target.name === 'g') clearErr('g'); if (e.target.id === 'age') clearErr('age'); });
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const bad = Object.keys(checks).filter((k) => !checks[k]());
    Object.keys(checks).forEach((k) => setErr(k, bad.includes(k)));
    if (bad.length) { form.classList.remove('shake'); void form.offsetWidth; form.classList.add('shake'); (bad[0] === 'g' || bad[0] === 'age' ? form.querySelector(bad[0] === 'g' ? 'input[name=g]' : '#age') : $('#' + bad[0])).focus({ preventScroll: true }); return; }
    submit();
  });
  const fe = $('.formerr', form), btn = $('button[type=submit]', form);
  const serverMsg = { invalid_email: msg.e, tech_park_required: msg.t, unknown_tech_park: msg.t, tech_park_too_long: 'That name is a little long.', invalid_gender: msg.g, consent_required: msg.age, too_many_requests: 'Too many tries from this network. Please try again in a bit.' };
  async function submit() {
    const cfg = window.AH_CONFIG; fe.classList.remove('on');
    if (!cfg) { window.joined(); return; } // prototype without a backend
    btn.disabled = true; btn.style.opacity = .6;
    try {
      const g = form.querySelector('input[name=g]:checked').value;
      const r = await fetch(cfg.url + '/rest/v1/rpc/join_waitlist', { method: 'POST', headers: { 'Content-Type': 'application/json', apikey: cfg.key, Authorization: 'Bearer ' + cfg.key },
        body: JSON.stringify({ p_email: $('#e').value, p_tech_park: AH.park ? AH.park.name : $('#t').value, p_custom: AH.park ? AH.park.other : true, p_gender: g, p_company: $('#c').value || null, p_consent: $('#age').checked }) });
      if (r.ok) { window.joined(); return; }
      const j = await r.json().catch(() => ({}));
      fe.textContent = serverMsg[j.message] || "Something went wrong. Please try again."; fe.classList.add('on');
    } catch { fe.textContent = "We couldn't reach afterhours. Check your connection and try again."; fe.classList.add('on'); }
    finally { btn.disabled = false; btn.style.opacity = ''; }
  }
  document.querySelectorAll('[data-join]').forEach((a) => a.addEventListener('click', (e) => window.openJoin(e)));
  /* ---------- share: easy to send, makes the receiver curious ---------- */
  const SHARE_URL = 'https://tryafterhours.app', SHARE_TEXT = 'ok this is kinda genius 👀 discreet dating for singles & introverts in offices and tech parks';
  const SHARE_FULL = SHARE_TEXT + ' → ' + SHARE_URL;
  const copyLink = (el) => (navigator.clipboard ? navigator.clipboard.writeText(SHARE_FULL) : Promise.reject()).then(() => { const t = el.textContent; el.textContent = 'Copied ✓'; setTimeout(() => (el.textContent = t), 1800); }).catch(() => prompt('Copy this:', SHARE_FULL));
  document.querySelectorAll('[data-share]').forEach((a) => a.addEventListener('click', (e) => { e.preventDefault();
    if (navigator.share) navigator.share({ title: 'afterhours', text: SHARE_TEXT, url: SHARE_URL }).catch(() => {}); else copyLink(a); }));
  document.querySelectorAll('[data-wa]').forEach((a) => (a.href = 'https://wa.me/?text=' + encodeURIComponent(SHARE_FULL)));
  document.querySelectorAll('[data-copy]').forEach((a) => a.addEventListener('click', () => copyLink(a)));
  const sharePop = $('#sharepop'); let spBack = null;
  const closeShare = () => { sharePop.hidden = true; document.body.classList.remove('share-open'); spBack?.focus?.({ preventScroll: true }); };
  sharePop.querySelectorAll('[data-spclose]').forEach((b) => b.addEventListener('click', closeShare));
  sharePop.addEventListener('click', (e) => { if (e.target === sharePop) closeShare(); });
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && !sharePop.hidden) closeShare(); });
  AH.openShare = () => { spBack = document.activeElement; sharePop.hidden = false; document.body.classList.add('share-open'); sharePop.querySelector('.main').focus({ preventScroll: true }); };

  /* ---------- the pass fits any screen ---------- */
  const fit = $('#passfit'), wrap = $('#passwrap'), modal = $('#modal'), slot = $('.mslot', modal);
  function fitPass() {
    fit.style.transform = 'none'; fit.style.transformOrigin = '50% 0';
    const inScene = wrap.contains(fit) && AH.side && AH.side() && innerWidth >= 900;
    if (!inScene) return;
    const avail = (document.getElementById('stage').clientHeight || innerHeight) - 96, need = fit.scrollHeight;
    if (need > avail) { const k = Math.max(0.7, avail / need); fit.style.transform = `scale(${k})`; fit.style.transformOrigin = '50% 50%'; }
  }
  AH.extra.push(() => { if (st.you > 0.2 && wrap.contains(fit) && innerWidth >= 900) { const t = fit.style.transform; fitPass(); } });
  const jinner = $('#joinsec .jinner'), isPhone = () => AH.phone && AH.phone();
  function placePass() { if (!modal.hidden) return; const target = isPhone() ? jinner : wrap; if (fit.parentElement !== target) target.insertBefore(fit, target.firstChild); }
  placePass(); addEventListener('resize', placePass);
  if (location.hash === '#join') setTimeout(() => window.openJoin(), 600); // links from the guides
  // phones: the end-of-page pass is a preview; tapping anywhere on it opens the pop-up
  // (same proven path as the top button; no keyboard opens on the long page)
  const tapCover = document.createElement('button');
  tapCover.type = 'button'; tapCover.className = 'jtap'; tapCover.setAttribute('aria-label', 'Fill in your after-hours pass');
  jinner.style.position = 'relative'; jinner.appendChild(tapCover);
  tapCover.addEventListener('click', (e) => window.openJoin(e));
  addEventListener('resize', fitPass); document.fonts.ready.then(fitPass);

  /* ---------- "Join waitlist" anywhere opens the pass as a glass pop-up ---------- */
  let lastFocus = null, savedY = 0;
  window.openJoin = (e) => {
    e && e.preventDefault();
    if (st.you > 0.85 && !isPhone()) { $('#e').focus(); return; } // laptops: the pass is already on screen
    lastFocus = document.activeElement; savedY = scrollY;
    if (fit.parentElement === jinner) jinner.style.minHeight = jinner.offsetHeight + 'px'; // keep page length: no jump
    slot.appendChild(fit); modal.hidden = false; document.body.classList.add('modal-open'); AH.paused = true;
    fitPass(); setTimeout(() => $('#e').focus({ preventScroll: true }), 300);
  };
  function closeJoin() { modal.hidden = true; document.body.classList.remove('modal-open'); AH.paused = false; (isPhone() ? jinner : wrap).insertBefore(fit, (isPhone() ? jinner : wrap).firstChild); fitPass(); lastFocus?.focus?.({ preventScroll: true }); requestAnimationFrame(() => { jinner.style.minHeight = ''; scrollTo(0, savedY); }); }
  $('.mclose', modal).addEventListener('click', closeJoin);
  $('.mbg', modal).addEventListener('click', closeJoin);
  addEventListener('keydown', (e) => {
    if (modal.hidden) return;
    if (e.key === 'Escape') closeJoin();
    if (e.key === 'Tab') { const f = [...modal.querySelectorAll('input,button,[href]')].filter((x) => !x.disabled && x.offsetParent); const i = f.indexOf(document.activeElement);
      if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); } else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); } }
  });
})();
