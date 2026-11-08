// Design preview only: no signup requests, cookies, storage or saved personal details.
// Sharing is optional and user-initiated; it shares only the public website and message.
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const wordmark = document.querySelector('.wordmark');
const restoreLogo = () => wordmark.classList.remove('logo-playing');
wordmark.addEventListener('animationend', event => { if (event.animationName === 'sunset-heart') restoreLogo(); });
// One glyph-only flip; never hide or move the page while it loads.
Promise.all([...wordmark.querySelectorAll('img')].map(img => img.decode().catch(() => {}))).then(() => {
  setTimeout(() => {
    if (!reducedMotion.matches && !document.hidden && !document.querySelector('#waitlist').open) wordmark.classList.add('logo-playing');
  }, 700);
});
const demo = document.querySelector('.note-demo');
const scenes = ['note-details', 'note-private', 'note-match'].map(id => document.getElementById(id));
const captions = ['Enter their name, gender and company. Designation and tech park are optional.', 'Your Spark is saved privately. Your name is revealed only if it is mutual.', 'If they enter your details too, you match and have 24 hours to chat.'];
const quotes = [...document.querySelectorAll('.quote-stack blockquote')];
const sequences = [];
let currentScene = 0;

function renderScene(index) {
  currentScene = index;
  demo.classList.toggle('is-private', index === 1);
  demo.classList.toggle('is-mutual', index === 2);
  document.querySelector('#scene-caption').textContent = captions[index];
  document.querySelectorAll('.story-steps li').forEach((step, i) => {
    step.classList.toggle('current', i === index);
    step.querySelector('button').setAttribute('aria-pressed', String(i === index));
    if (i === index) step.setAttribute('aria-current', 'step'); else step.removeAttribute('aria-current');
  });
  document.querySelectorAll('.scene-position i').forEach((dot, i) => dot.classList.toggle('current', i === index));
  scenes.forEach((element, i) => {
    const hidden = !reducedMotion.matches && i !== index;
    element.setAttribute('aria-hidden', String(hidden));
    element.inert = hidden;
  });
}

// Each sequence runs once when visible. Pause retains time left in the current beat.
// Nothing locks scrolling, waits for the quotes, or hides the hero on load.
function sequence(element, durations, render) {
  let index = 0, visible = false, manual = false, timer = null, started = 0, remaining = durations[0];
  function stop() {
    if (timer === null) return;
    clearTimeout(timer);
    remaining = Math.max(0, remaining - (performance.now() - started));
    timer = null;
  }
  function sync() {
    if (manual || !visible || reducedMotion.matches || document.hidden || document.querySelector('#waitlist').open) { stop(); return; }
    if (timer !== null || index >= durations.length) return;
    started = performance.now();
    timer = setTimeout(() => {
      timer = null;
      index += 1;
      render(index);
      remaining = durations[index];
      sync();
    }, remaining);
  }
  new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync(); }, { threshold: .4 }).observe(element);
  const controller = {
    sync,
    select(next) { stop(); manual = true; index = next; remaining = durations[index]; render(index); }
  };
  sequences.push(controller);
  render(0);
  return controller;
}
sequence(document.querySelector('.quote-stack'), [4200], index => {
  quotes.forEach((quote, i) => {
    quote.classList.toggle('active', i === index);
    quote.setAttribute('aria-hidden', String(i !== index));
  });
});
const walkthrough = sequence(document.querySelector('.note-stage'), [4200, 3000], renderScene);
document.querySelectorAll('.step-choice').forEach(button => button.addEventListener('click', event => {
  const index = Number(button.dataset.scene);
  demo.classList.toggle('keyboard-change', event.detail === 0);
  walkthrough.select(index);
  document.querySelector('#manual-step-status').textContent = captions[index];
  if (reducedMotion.matches) scenes[index].scrollIntoView({ block: 'nearest', behavior: 'instant' });
}));
function updateMotion() {
  const reduced = reducedMotion.matches;
  document.body.classList.toggle('reduce-motion', reduced);
  const stopped = reduced || document.hidden || document.querySelector('#waitlist').open;
  document.body.classList.toggle('motion-paused', stopped);
  if (stopped) restoreLogo();
  renderScene(currentScene);
  sequences.forEach(item => item.sync());
}
reducedMotion.addEventListener('change', updateMotion);
document.addEventListener('visibilitychange', updateMotion);
updateMotion();

const dialog = document.querySelector('#waitlist');
const form = document.querySelector('#preview-form');
const confirmation = document.querySelector('#confirmation');
let opener;
let attempted = false;
const fieldKeys = ['email', 'gender', 'work', 'consent'];
function controls(key) {
  return key === 'gender' ? [...form.querySelectorAll('[name=gender]')] : [document.getElementById(key)];
}
controls('gender').forEach(input => input.setAttribute('aria-describedby', 'gender-error'));
function messageFor(key) {
  if (key === 'email') {
    const input = document.querySelector('#email');
    const value = input.value.trim();
    if (!value) return 'Add your personal email so we can let you know.';
    if (value.length > 254 || input.validity.typeMismatch || !/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(value)) return 'That email looks incomplete. Try name@example.com.';
  }
  if (key === 'gender' && !form.querySelector('[name=gender]:checked')) return 'Choose the option that fits you.';
  if (key === 'work' && document.querySelector('#work').value.length > 120) return 'Keep the company or tech park name under 121 characters.';
  if (key === 'consent' && !document.querySelector('#consent').checked) return 'Please confirm you’re 18+ and agree to the Privacy Policy.';
  return '';
}
function showError(key, message) {
  const error = document.getElementById(`${key}-error`);
  error.textContent = message;
  error.hidden = !message;
  controls(key).forEach(input => {
    if (message) input.setAttribute('aria-invalid', 'true'); else input.removeAttribute('aria-invalid');
  });
  if (key === 'gender') {
    const group = form.querySelector('.gender-choices');
    if (message) group.setAttribute('aria-invalid', 'true'); else group.removeAttribute('aria-invalid');
  }
}
function validatePass() {
  attempted = true;
  document.querySelector('#email').value = document.querySelector('#email').value.trim();
  const invalid = fieldKeys.filter(key => { const message = messageFor(key); showError(key, message); return !!message; });
  document.querySelector('#validation-status').textContent = invalid.length ? `Please check ${invalid.length === 1 ? 'the highlighted detail' : 'the highlighted details'} below.` : '';
  if (!invalid.length) return true;
  const first = controls(invalid[0])[0];
  first.focus({ preventScroll: true });
  const field = first.getBoundingClientRect(), viewport = dialog.getBoundingClientRect();
  if (field.top < viewport.top + 24) dialog.scrollTop += field.top - viewport.top - 24;
  else if (field.bottom > viewport.bottom - 24) dialog.scrollTop += field.bottom - viewport.bottom + 24;
  return false;
}
function refreshField(event) {
  const key = event.target.name === 'gender' ? 'gender' : event.target.id;
  if (!fieldKeys.includes(key)) return;
  if (attempted || event.target.getAttribute('aria-invalid') === 'true') showError(key, messageFor(key));
}
form.addEventListener('input', refreshField);
form.addEventListener('change', refreshField);

document.querySelectorAll('[data-join]').forEach(button => {
  button.addEventListener('click', () => {
    opener = button;
    dialog.showModal();
    updateMotion();
    // Do not open a mobile keyboard until the user chooses a field.
    dialog.querySelector('.close').focus({ preventScroll: true });
  });
});

function closePreview() { dialog.close(); }
dialog.querySelector('.close').addEventListener('click', closePreview);
dialog.querySelector('[data-close]').addEventListener('click', closePreview);
dialog.addEventListener('click', event => {
  if (event.target !== dialog) return;
  const rect = dialog.getBoundingClientRect();
  if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) closePreview();
});
dialog.addEventListener('close', () => {
  updateMotion();
  opener?.focus({ preventScroll: true });
  form.reset();
  attempted = false;
  showFormNote('');
  fieldKeys.forEach(key => showError(key, ''));
  document.querySelector('#validation-status').textContent = '';
  form.hidden = false;
  confirmation.hidden = true;
  dialog.setAttribute('aria-labelledby', 'join-title');
  document.querySelector('#share-status').textContent = '';
  document.querySelector('#share-text').hidden = true;
});
function showConfirmation() {
  form.hidden = true;
  confirmation.hidden = false;
  dialog.setAttribute('aria-labelledby', 'confirmation-title');
  document.querySelector('#confirmation-title').focus({ preventScroll: true });
  dialog.scrollTop = 0;
}
const serverMessages = {
  invalid_email: ['email', 'That email looks incomplete. Try name@example.com.'],
  invalid_gender: ['gender', 'Choose the option that fits you.'],
  consent_required: ['consent', 'Please confirm you’re 18+ and agree to the Privacy Policy.'],
  tech_park_too_long: ['work', 'Keep the company or tech park name under 121 characters.']
};
const submitButton = form.querySelector('.form-submit');
const submitLabel = submitButton.textContent;
form.addEventListener('submit', async event => {
  event.preventDefault();
  if (submitButton.disabled || !validatePass()) return;
  const cfg = window.AH_CONFIG;
  if (!cfg) { showConfirmation(); return; } // local design preview: nothing is sent
  submitButton.disabled = true;
  submitButton.textContent = 'Getting your pass…';
  const status = document.querySelector('#validation-status');
  try {
    const response = await fetch(`${cfg.url}/rest/v1/rpc/join_waitlist`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: cfg.key, Authorization: `Bearer ${cfg.key}` },
      body: JSON.stringify({
        p_email: document.querySelector('#email').value.trim(),
        p_tech_park: null,
        p_custom: false,
        p_gender: form.querySelector('[name=gender]:checked').value,
        p_company: document.querySelector('#work').value.trim() || null,
        p_consent: document.querySelector('#consent').checked
      })
    });
    if (response.ok) { showConfirmation(); return; }
    const body = await response.json().catch(() => ({}));
    const known = serverMessages[body.message];
    if (known) { status.textContent = ''; showError(known[0], known[1]); controls(known[0])[0].focus({ preventScroll: true }); }
    else status.textContent = body.message === 'too_many_requests'
      ? 'Too many tries from this network. Please try again in a bit.'
      : 'Something went wrong. Please try again.';
    showFormNote(status.textContent);
  } catch {
    status.textContent = 'We couldn’t reach afterhours. Check your connection and try again.';
    showFormNote(status.textContent);
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = submitLabel;
  }
});
function showFormNote(message) {
  const note = document.querySelector('#form-note');
  note.textContent = message || '';
  note.hidden = !message;
}
if (location.hash === '#join') setTimeout(() => document.querySelector('[data-join]').click(), 300);

const shareUrl = 'https://tryafterhours.app/';
const shareText = 'ok this is kinda genius 👀 a private dating app for office crushes. coming soon — the waitlist is open';
const shareMessage = `${shareText}\n${shareUrl}`;
const shareStatus = document.querySelector('#share-status');
const shareField = document.querySelector('#share-text');
shareField.value = shareMessage;
document.querySelector('[data-whatsapp]').href = `https://wa.me/?text=${encodeURIComponent(shareMessage)}`;

async function copyMessage() {
  try {
    await navigator.clipboard.writeText(shareMessage);
    shareStatus.textContent = 'Message copied.';
  } catch {
    shareField.hidden = false;
    shareField.focus();
    shareField.select();
    shareStatus.textContent = 'Select and copy the message below.';
  }
}
document.querySelector('[data-copy]').addEventListener('click', copyMessage);
document.querySelector('[data-share]').addEventListener('click', async () => {
  if (!navigator.share) return copyMessage();
  try {
    await navigator.share({ title: 'afterhours', text: shareText, url: shareUrl });
  } catch (error) {
    if (error.name !== 'AbortError') shareStatus.textContent = 'Sharing is unavailable here. You can copy the message instead.';
  }
});
