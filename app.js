const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

const SESSION = {
  token: 'eco_auth_token',
  theme: 'eco_theme',
  pendingId: 'eco_pending_signup_id',
  phrase: 'eco_pending_phrase_data'
};

const state = {
  me: null,
  appData: null
};

const token = () => localStorage.getItem(SESSION.token) || '';
const setToken = value => value ? localStorage.setItem(SESSION.token, value) : localStorage.removeItem(SESSION.token);
const setTheme = value => localStorage.setItem(SESSION.theme, value);
const getTheme = () => localStorage.getItem(SESSION.theme) || 'light';

const fmtMoney = n => new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(Number(n || 0));
const fmtDate = d => new Date(d).toLocaleDateString('en-NG', { month: 'short', day: 'numeric', year: 'numeric' });
const titleCase = s => String(s || '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
const goRole = role => role === 'vendor' ? 'dashboard-vendor.html' : role === 'ngo-hub' ? 'dashboard-ngo.html' : 'dashboard.html';
const mask = id => `ECP-****-${String(id || '1024').slice(-4)}`;
const strength = p => {
  const c = { u: /[A-Z]/.test(p), l: /[a-z]/.test(p), n: /\d/.test(p), x: p.length >= 8 };
  const s = Object.values(c).filter(Boolean).length;
  return { c, s, label: s === 4 ? 'Strong' : s >= 2 ? 'Medium' : 'Weak', cls: s === 4 ? 'strong' : s >= 2 ? 'medium' : 'weak', ok: s === 4 };
};

const msg = (el, text = '') => {
  if (!el) return;
  el.textContent = text;
  el.hidden = !text;
};

const loading = (btn, on, text = 'Please wait...') => {
  if (!btn) return;
  if (!btn.dataset.originalText) btn.dataset.originalText = btn.textContent;
  btn.disabled = on;
  btn.textContent = on ? text : btn.dataset.originalText;
};

const loader = {
  show(text = 'Loading, please wait...') {
    let el = $('#pageLoaderBar');
    if (!el) {
      el = document.createElement('div');
      el.id = 'pageLoaderBar';
      el.className = 'page-loader-bar';
      document.body.prepend(el);
    }
    el.textContent = text;
    el.hidden = false;
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => this.hide(), 2200);
    return text;
  },
  hide() {
    const el = $('#pageLoaderBar');
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
    if (el) el.hidden = true;
    return null;
  },
  timer: null
};

const showStartupError = message => {
  let el = $('#startupError');
  if (!el) {
    el = document.createElement('div');
    el.id = 'startupError';
    el.className = 'form-message startup-error';
    document.body.prepend(el);
  }
  el.textContent = message;
  el.hidden = false;
};

const feedback = {
  mount() {
    if ($('#feedbackButton')) return;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.id = 'feedbackButton';
    btn.className = 'feedback-button';
    btn.textContent = 'Feedback';
    document.body.appendChild(btn);
    const modal = document.createElement('div');
    modal.id = 'feedbackModal';
    modal.className = 'feedback-modal';
    modal.hidden = true;
    modal.innerHTML = `
      <div class="feedback-modal-card">
        <div class="panel-header">
          <h2>Share Feedback</h2>
          <p>Tell us what you experienced on this page.</p>
        </div>
        <form id="feedbackForm" class="auth-form" novalidate>
          <label class="field">
            <span>Name</span>
            <input type="text" name="name" placeholder="Enter your name" required>
          </label>
          <label class="field">
            <span>Email</span>
            <input type="email" name="email" placeholder="Enter your email" required>
          </label>
          <label class="field">
            <span>Your Feedback</span>
            <textarea name="text" rows="4" placeholder="Write your feedback" required></textarea>
          </label>
          <p class="form-message" id="feedbackMessage" hidden></p>
          <div class="feedback-modal-actions">
            <button type="button" class="btn btn-secondary" id="closeFeedbackButton">Cancel</button>
            <button type="submit" class="btn btn-primary" id="submitFeedbackButton">Send Feedback</button>
          </div>
        </form>
      </div>
    `;
    document.body.appendChild(modal);
    const open = () => {
      modal.hidden = false;
      document.body.classList.add('modal-open');
      $('input[name="name"]', modal)?.focus();
    };
    const close = () => {
      modal.hidden = true;
      document.body.classList.remove('modal-open');
      $('#feedbackForm')?.reset();
      msg($('#feedbackMessage'), '');
    };
    btn.addEventListener('click', open);
    $('#closeFeedbackButton', modal)?.addEventListener('click', close);
    modal.addEventListener('click', event => {
      if (event.target === modal) close();
    });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && !modal.hidden) close();
    });
    $('#feedbackForm', modal)?.addEventListener('submit', async event => {
      event.preventDefault();
      const form = event.currentTarget;
      const submitBtn = $('#submitFeedbackButton', modal);
      const fd = new FormData(form);
      loading(submitBtn, true);
      try {
        await api('/api/feedback', {
          method: 'POST',
          body: {
            page: document.title,
            name: String(fd.get('name') || '').trim(),
            email: String(fd.get('email') || '').trim(),
            text: String(fd.get('text') || '').trim()
          },
          auth: false
        });
        alert('Feedback received. Thank you.');
        close();
      } catch (error) {
        msg($('#feedbackMessage', modal), error.message || 'Could not send feedback.');
      } finally {
        loading(submitBtn, false);
      }
    });
  }
};

const api = async (url, { method = 'GET', body, auth = true } = {}) => {
  const headers = { 'Content-Type': 'application/json' };
  if (auth && token()) headers.Authorization = `Bearer ${token()}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  let response;
  try {
    response = await fetch(url, { method, headers, body: body ? JSON.stringify(body) : undefined, signal: controller.signal });
  } catch (error) {
    clearTimeout(timeout);
    if (error.name === 'AbortError') {
      throw new Error('The server took too long to respond. Make sure `npm start` is running on `http://localhost:3000`.');
    }
    throw new Error(window.location.protocol === 'file:' ? 'Open the app through the backend server, not as a local file. Run `npm start` and use `http://localhost:3000`.' : 'Could not reach the server. Make sure `npm start` is running.');
  }
  clearTimeout(timeout);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'Request failed.');
  return data;
};

const applyTheme = theme => {
  const next = theme === 'dark' ? 'dark' : 'light';
  document.body.classList.toggle('dark', next === 'dark');
  const btn = $('#theme-toggle') || $('#darkModeToggle');
  if (btn) {
    btn.setAttribute('aria-pressed', String(next === 'dark'));
    btn.textContent = next === 'dark' ? 'Light Mode' : 'Dark Mode';
  }
  setTheme(next);
};

const syncBackLinks = () => {
  const href = goRole(state.me?.role);
  $$('[data-role-back-link]').forEach(link => link.setAttribute('href', href));
  $('[data-orders-home-link]')?.setAttribute('href', href);
};

const renderPhrase = payload => {
  const grid = $('#secretPhraseGrid');
  const confirmGrid = $('#confirmWordsGrid');
  if (!grid || !confirmGrid || !payload) return;
  grid.innerHTML = payload.phrase.map((word, index) => `<div class="phrase-word"><span>${index + 1}</span><strong>${word}</strong></div>`).join('');
  confirmGrid.innerHTML = payload.confirmPositions.map(pos => `<label class="field"><span>Confirm word #${pos + 1}</span><input type="text" name="confirm_word_${pos}" required></label>`).join('');
};

const readPendingPhrase = () => {
  try { return JSON.parse(sessionStorage.getItem(SESSION.phrase) || 'null'); } catch { return null; }
};

const readPendingId = () => sessionStorage.getItem(SESSION.pendingId) || '';

const setPendingSignup = (pendingId, phraseData = null) => {
  if (pendingId) sessionStorage.setItem(SESSION.pendingId, pendingId);
  else sessionStorage.removeItem(SESSION.pendingId);
  if (phraseData) sessionStorage.setItem(SESSION.phrase, JSON.stringify(phraseData));
  else sessionStorage.removeItem(SESSION.phrase);
};

const setStep = (steps, current) => steps.forEach(step => {
  if (!step) return;
  step.hidden = step !== current;
  step.classList.toggle('active', step === current);
});

const loadMe = async () => {
  if (!token()) return null;
  try {
    const data = await api('/api/me');
    state.me = data.user;
    syncBackLinks();
    return state.me;
  } catch {
    setToken('');
    state.me = null;
    return null;
  }
};

const loadAppData = async () => {
  const data = await api('/api/app-data');
  state.me = data.user;
  state.appData = data;
  syncBackLinks();
  return data;
};

const renderDashboard = data => {
  const me = data.user;
  const pickups = data.pickups || [];
  const uploads = data.uploads || [];
  const transactions = data.transactions || [];
  const myPickups = pickups.filter(x => x.userId === me.id);
  const myUploads = uploads.filter(x => x.userId === me.id);
  const myTransactions = transactions.filter(x => x.userId === me.id);
  const waste = myUploads.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  const points = waste * 20 + myPickups.length * 10;
  const co2 = Math.round(waste * 2.3);

  $('#dashboardUserName') && ($('#dashboardUserName').textContent = me.fullName || 'EcoCycle User');
  $('#dashboardBalance') && ($('#dashboardBalance').textContent = fmtMoney(me.wallet?.balance || 0));
  $('#dashboardWaste') && ($('#dashboardWaste').textContent = `${waste}kg`);
  $('#dashboardPoints') && ($('#dashboardPoints').textContent = `${points}`);
  $('#dashboardCo2') && ($('#dashboardCo2').textContent = `${co2}kg`);
  $('#walletHeading') && ($('#walletHeading').textContent = fmtMoney(me.wallet?.balance || 0));
  $('#walletIdMask') && ($('#walletIdMask').textContent = mask(me.id));
  $('#pickupCountBadge') && ($('#pickupCountBadge').textContent = `${myPickups.length} Pickups`);

  const activity = [
    ...myUploads.map(item => ({ t: `Uploaded ${item.quantity}kg ${item.wasteType}`, d: `Uploaded from ${item.location}`, dt: item.createdAt })),
    ...myPickups.map(item => ({ t: `Pickup request for ${item.wasteType}`, d: `${item.quantity}kg from ${item.location}`, dt: item.createdAt })),
    ...myTransactions.map(item => ({ t: item.type, d: `${fmtMoney(item.amount)} via Interswitch | ${item.status}`, dt: item.createdAt }))
  ].sort((a, b) => new Date(b.dt) - new Date(a.dt));
  const activityList = $('#recentActivityList');
  if (activityList) {
    activityList.innerHTML = activity.slice(0, 5).map(item => `<article class="activity-item"><div><h3>${item.t}</h3><p>${item.d}</p></div><span>${fmtDate(item.dt)}</span></article>`).join('');
    $('#activityEmptyState') && ($('#activityEmptyState').hidden = activity.length > 0);
  }
  const pickupList = $('#pickupStatusList');
  if (pickupList) {
    pickupList.innerHTML = myPickups.slice().reverse().map(item => `<article class="status-card"><div><h3>${item.wasteType} | ${item.quantity}kg</h3><p>${item.location}</p></div><span class="status-badge status-${String(item.status).toLowerCase().replace(/\s+/g, '-')}">${item.status}</span></article>`).join('');
    $('#pickupEmptyState') && ($('#pickupEmptyState').hidden = myPickups.length > 0);
  }

  if (me.role === 'vendor') {
    const paidUploads = uploads.filter(x => x.status === 'Paid');
    const pendingUploads = uploads.filter(x => x.status !== 'Paid');
    $('#vendorOrdersReceived') && ($('#vendorOrdersReceived').textContent = String(uploads.length));
    $('#vendorWasteSupply') && ($('#vendorWasteSupply').textContent = `${uploads.reduce((sum, item) => sum + Number(item.quantity || 0), 0)}kg`);
    $('#vendorOrderValue') && ($('#vendorOrderValue').textContent = fmtMoney(uploads.reduce((sum, item) => sum + Number(item.quantity || 0) * 200, 0)));
    const vendorItems = [
      ...pendingUploads.slice(0, 2).map(item => ({ t: `${item.wasteType} upload available`, d: `${item.quantity}kg ready from ${item.location}`, dt: item.createdAt })),
      ...paidUploads.slice(0, 2).map(item => ({ t: `${item.wasteType} order settled`, d: `Seller paid through Interswitch for ${item.quantity}kg`, dt: item.createdAt }))
    ].sort((a, b) => new Date(b.dt) - new Date(a.dt));
    $('#vendorActivityList') && ($('#vendorActivityList').innerHTML = vendorItems.map(item => `<article class="activity-item"><div><h3>${item.t}</h3><p>${item.d}</p></div><span>${fmtDate(item.dt)}</span></article>`).join(''));
    $('#vendorActivityEmptyState') && ($('#vendorActivityEmptyState').hidden = vendorItems.length > 0);
    const latestAccepted = pickups.filter(x => x.status === 'Accepted').sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
    const latestPaid = paidUploads.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
    const latestItems = [
      latestAccepted ? { t: 'Latest accepted order', d: `${latestAccepted.wasteType} pickup accepted for ${latestAccepted.quantity}kg at ${latestAccepted.location}`, dt: latestAccepted.createdAt } : null,
      latestPaid ? { t: 'Latest paid seller', d: `Seller paid through Interswitch for ${latestPaid.quantity}kg of ${latestPaid.wasteType}`, dt: latestPaid.createdAt } : null
    ].filter(Boolean);
    $('#vendorLatestPanel') && ($('#vendorLatestPanel').innerHTML = latestItems.map(item => `<article class="activity-item"><div><h3>${item.t}</h3><p>${item.d}</p></div><span>${fmtDate(item.dt)}</span></article>`).join(''));
    $('#vendorLatestEmptyState') && ($('#vendorLatestEmptyState').hidden = latestItems.length > 0);
  }

  if (me.role === 'ngo-hub') {
    const acceptedPickups = pickups.filter(x => x.status === 'Accepted');
    const paidUploads = uploads.filter(x => x.status === 'Paid');
    const totalCollected = uploads.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
    const plasticCollected = uploads.filter(x => x.wasteType === 'Plastics').reduce((sum, item) => sum + Number(item.quantity || 0), 0);
    const settledValue = paidUploads.reduce((sum, item) => sum + Number(item.quantity || 0) * 200, 0);
    $('#ngoWasteCollected') && ($('#ngoWasteCollected').textContent = `${totalCollected}kg`);
    $('#ngoActivePickups') && ($('#ngoActivePickups').textContent = String(acceptedPickups.length));
    $('#ngoEarnings') && ($('#ngoEarnings').textContent = fmtMoney(settledValue));
    $('#ngoPlasticCollected') && ($('#ngoPlasticCollected').textContent = `${plasticCollected}kg`);
    $('#ngoSettledValue') && ($('#ngoSettledValue').textContent = fmtMoney(settledValue));
    $('#ngoActiveRequests') && ($('#ngoActiveRequests').textContent = String(pickups.filter(x => x.status !== 'Completed').length + uploads.filter(x => x.status !== 'Paid').length));
    const latestAccepted = acceptedPickups.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
    const latestPaid = paidUploads.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
    $('#ngoAcceptedActivityList') && ($('#ngoAcceptedActivityList').innerHTML = latestAccepted ? `<article class="activity-item"><div><h3>${latestAccepted.wasteType} pickup accepted</h3><p>${latestAccepted.quantity}kg from ${latestAccepted.location} is now in progress.</p></div><span>${fmtDate(latestAccepted.createdAt)}</span></article>` : '');
    $('#ngoAcceptedEmptyState') && ($('#ngoAcceptedEmptyState').hidden = Boolean(latestAccepted));
    $('#ngoPaidActivityList') && ($('#ngoPaidActivityList').innerHTML = latestPaid ? `<article class="activity-item"><div><h3>Latest paid seller</h3><p>${latestPaid.quantity}kg of ${latestPaid.wasteType} was settled through Interswitch.</p></div><span>${fmtDate(latestPaid.createdAt)}</span></article>` : '');
    $('#ngoPaidEmptyState') && ($('#ngoPaidEmptyState').hidden = Boolean(latestPaid));
  }
};

const bootstrap = async () => {
  loader.show();
  const startupFallback = setTimeout(() => loader.hide(), 2500);
  applyTheme(getTheme());
  feedback.mount();
  ($('#theme-toggle') || $('#darkModeToggle'))?.addEventListener('click', () => applyTheme(document.body.classList.contains('dark') ? 'light' : 'dark'));

  const slides = $$('.slide');
  if (slides.length) {
    let index = 0;
    const showSlide = current => slides.forEach((slide, slideIndex) => slide.classList.toggle('active', slideIndex === current));
    showSlide(0);
    setInterval(() => { index = (index + 1) % slides.length; showSlide(index); }, 5000);
  }

  $('#logoutButton')?.addEventListener('click', async () => {
    try { await api('/api/auth/logout', { method: 'POST' }); } catch {}
    setToken('');
    location.href = 'login.html';
  });

  const me = await loadMe();

  const signupForm = $('#signupForm');
  const verifyForm = $('#verificationForm');
  const walletForm = $('#walletSetupForm');
  if (signupForm && verifyForm && walletForm) {
    const steps = [$('#signupStep'), $('#verificationStep'), $('#walletStep')];
    const roleInput = $('#selectedRole');
    const roleTitle = $('#selectedRoleTitle');
    const formContainer = $('#signupFormContainer');
    const roleSelection = $('#roleSelection');
    const details = $('#signupDetailsPanel');
    const roleGrid = $('#roleCardGrid');
    const ngoType = $('#ngoHubType');
    const signupMsg = $('#signupMessage');
    const verMsg = $('#verificationMessage');
    const wallMsg = $('#walletMessage');
    const createBtn = $('#createAccountButton');
    const pwd = $('#signupPassword');
    const cpwd = $('#confirmSignupPassword');
    const roles = { generator: 'Waste Generator', vendor: 'Vendor', 'ngo-hub': 'NGO / Hub' };
    const gen = $('#generatorFields'), ven = $('#vendorFields'), ngoHub = $('#ngoHubFields'), ngo = $('#ngoFields'), hub = $('#hubFields');
    const toggleWrap = (wrap, on) => { if (!wrap) return; wrap.hidden = !on; wrap.style.display = on ? 'block' : 'none'; };
    const req = (wrap, on) => wrap ? $$('input,select,textarea', wrap).forEach(i => i.required = on) : null;
    const syncStrength = () => {
      const result = strength(pwd?.value || '');
      $('#passwordStrengthLabel') && ($('#passwordStrengthLabel').textContent = result.label);
      $('#passwordStrengthLabel') && ($('#passwordStrengthLabel').className = `strength-label ${result.cls}`);
      $('#strengthBar') && ($('#strengthBar').className = `strength-bar ${result.cls}`);
      $('#strengthBar') && ($('#strengthBar').style.width = `${(result.s / 4) * 100}%`);
      [['#ruleUppercase', result.c.u], ['#ruleLowercase', result.c.l], ['#ruleNumber', result.c.n], ['#ruleLength', result.c.x]].forEach(([selector, valid]) => $(selector)?.classList.toggle('valid', valid));
      return result;
    };
    const syncCreateButton = () => { if (createBtn) createBtn.disabled = !(roleInput.value && syncStrength().ok); };
    const setRole = role => {
      roleInput.value = role;
      $$('.role-card').forEach(card => card.classList.toggle('active', card.dataset.role === role));
      if (roleTitle) roleTitle.textContent = roles[role] || 'Selected Role';
      if (details) details.hidden = !role;
      if (roleSelection) roleSelection.style.display = role ? 'none' : 'block';
      if (formContainer) formContainer.style.display = role ? 'block' : 'none';
      toggleWrap(gen, role === 'generator');
      toggleWrap(ven, role === 'vendor');
      toggleWrap(ngoHub, role === 'ngo-hub');
      req(gen, role === 'generator');
      req(ven, role === 'vendor');
      req(ngoHub, role === 'ngo-hub');
      if (role !== 'ngo-hub') {
        ngoType.value = '';
        toggleWrap(ngo, false);
        toggleWrap(hub, false);
      }
      syncCreateButton();
    };
    $('#toggleSignupPassword')?.addEventListener('click', () => { const v = pwd.type === 'password'; pwd.type = v ? 'text' : 'password'; $('#toggleSignupPassword').textContent = v ? 'Hide' : 'Show'; });
    $('#toggleConfirmSignupPassword')?.addEventListener('click', () => { const v = cpwd.type === 'password'; cpwd.type = v ? 'text' : 'password'; $('#toggleConfirmSignupPassword').textContent = v ? 'Hide' : 'Show'; });
    roleGrid?.addEventListener('click', event => { const card = event.target.closest('.role-card'); if (card) setRole(card.dataset.role || ''); });
    $('#changeRoleButton')?.addEventListener('click', () => setRole(''));
    ngoType?.addEventListener('change', () => { toggleWrap(ngo, ngoType.value === 'NGO'); toggleWrap(hub, ngoType.value === 'Hub'); req(ngo, ngoType.value === 'NGO'); req(hub, ngoType.value === 'Hub'); syncCreateButton(); });
    pwd?.addEventListener('input', syncCreateButton);
    cpwd?.addEventListener('input', syncCreateButton);
    signupForm.addEventListener('change', syncCreateButton);
    setRole(new URLSearchParams(location.search).get('role') || '');
    syncStrength();
    syncCreateButton();

    signupForm.addEventListener('submit', async event => {
      event.preventDefault();
      msg(signupMsg, '');
      const fd = new FormData(signupForm);
      const password = String(fd.get('password') || '');
      const confirmPassword = String(fd.get('confirm_password') || '');
      if (password !== confirmPassword) return msg(signupMsg, 'Passwords do not match.');
      if (!syncStrength().ok) return msg(signupMsg, 'Password must be strong before you continue.');
      const payload = {
        fullName: String(fd.get('full_name') || '').trim(),
        email: String(fd.get('email') || '').trim(),
        phone: String(fd.get('phone') || '').trim(),
        password,
        role: String(fd.get('role') || '').trim(),
        subtype: String(fd.get('generator_subtype') || fd.get('vendor_business_type') || fd.get('ngo_hub_type') || '').trim(),
        userType: String(fd.get('generator_subtype') || fd.get('vendor_business_type') || fd.get('ngo_hub_type') || fd.get('role') || '').trim(),
        referralCode: String(fd.get('referral_code') || '').trim(),
        roleData: {
          generatorSubtype: String(fd.get('generator_subtype') || '').trim(),
          businessName: String(fd.get('vendor_business_name') || '').trim(),
          businessType: String(fd.get('vendor_business_type') || '').trim(),
          location: String(fd.get('vendor_location') || fd.get('ngo_location') || fd.get('hub_location') || '').trim(),
          yearsOfOperation: String(fd.get('vendor_years') || '').trim(),
          registrationNumber: String(fd.get('vendor_registration') || fd.get('ngo_registration') || fd.get('hub_registration') || '').trim(),
          organizationName: String(fd.get('ngo_name') || '').trim(),
          yearsActive: String(fd.get('ngo_years') || '').trim(),
          focusArea: String(fd.get('ngo_focus') || '').trim(),
          missionDescription: String(fd.get('ngo_mission') || '').trim(),
          hubName: String(fd.get('hub_name') || '').trim(),
          availability: String(fd.get('hub_availability') || '').trim(),
          dailyCapacity: String(fd.get('hub_capacity') || '').trim(),
          wasteTypesAccepted: String(fd.get('hub_waste_types') || '').trim()
        }
      };
      loading(createBtn, true, 'Please wait...');
      loader.show('Creating account, please wait...');
      try {
        const data = await api('/api/auth/signup/start', { method: 'POST', body: payload, auth: false });
        setPendingSignup(data.pendingId);
        msg(verMsg, `Verification code sent. Current code: ${data.verificationCode}`);
        setStep(steps, $('#verificationStep'));
      } catch (error) {
        msg(signupMsg, error.message);
      } finally {
        loading(createBtn, false);
        loader.hide();
      }
    });

    verifyForm.addEventListener('submit', async event => {
      event.preventDefault();
      const body = { pendingId: readPendingId(), code: String(new FormData(verifyForm).get('verification_code') || '').trim() };
      loader.show('Verifying, please wait...');
      try {
        const data = await api('/api/auth/signup/verify', { method: 'POST', body, auth: false });
        setPendingSignup(readPendingId(), data);
        renderPhrase(data);
        setStep(steps, $('#walletStep'));
      } catch (error) {
        msg(verMsg, error.message);
      } finally {
        loader.hide();
      }
    });

    walletForm.addEventListener('submit', async event => {
      event.preventDefault();
      const fd = new FormData(walletForm);
      const pin = String(fd.get('wallet_pin') || '').trim();
      const cpin = String(fd.get('confirm_wallet_pin') || '').trim();
      if (pin !== cpin) return msg(wallMsg, 'Wallet PINs do not match.');
      const phraseData = readPendingPhrase();
      const answers = Object.fromEntries((phraseData?.confirmPositions || []).map(pos => [pos, String(fd.get(`confirm_word_${pos}`) || '').trim()]));
      loader.show('Finalizing account, please wait...');
      try {
        const data = await api('/api/auth/signup/complete', { method: 'POST', body: { pendingId: readPendingId(), pin, answers }, auth: false });
        setToken(data.token);
        setPendingSignup('', null);
        location.href = goRole(data.user.role);
      } catch (error) {
        msg(wallMsg, error.message);
      } finally {
        loader.hide();
      }
    });
  }

  const loginForm = $('#loginForm');
  if (loginForm) {
    $('#toggleLoginPassword')?.addEventListener('click', () => {
      const input = $('#loginPassword');
      const visible = input.type === 'password';
      input.type = visible ? 'text' : 'password';
      $('#toggleLoginPassword').textContent = visible ? 'Hide' : 'Show';
    });
    loginForm.addEventListener('submit', async event => {
      event.preventDefault();
      const formMessage = $('#loginMessage');
      msg(formMessage, '');
      const fd = new FormData(loginForm);
      try {
        const data = await api('/api/auth/login', {
          method: 'POST',
          body: {
            identifier: String(fd.get('identifier') || '').trim(),
            password: String(fd.get('password') || '')
          },
          auth: false
        });
        setToken(data.token);
        location.href = goRole(data.user.role);
      } catch (error) {
        msg(formMessage, error.message);
      }
    });
  }

  if ($('#dashboardPage')) {
    if (!me) return location.href = 'login.html';
    const data = await loadAppData();
    if (($('#dashboardPage').dataset.dashboardRole || 'generator') !== data.user.role) return location.href = goRole(data.user.role);
    renderDashboard(data);
  }

  const pickupForm = $('#pickupForm');
  if (pickupForm) {
    if (!me) return location.href = 'login.html';
    $('input[name="pickup_time"]', pickupForm)?.setAttribute('min', new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16));
    pickupForm.addEventListener('submit', async event => {
      event.preventDefault();
      const button = $('#pickupSubmitButton');
      const messageEl = $('#pickupMessage');
      const fd = new FormData(pickupForm);
      loading(button, true);
      loader.show('Submitting pickup request, please wait...');
      try {
        await api('/api/pickups', { method: 'POST', body: { wasteType: String(fd.get('waste_type') || '').trim(), quantity: Number(fd.get('quantity') || 0), location: String(fd.get('location') || '').trim(), pickupTime: String(fd.get('pickup_time') || '').trim(), notes: String(fd.get('notes') || '').trim() } });
        msg(messageEl, 'Pickup request sent.');
        pickupForm.reset();
      } catch (error) {
        msg(messageEl, error.message);
      } finally {
        loading(button, false);
        loader.hide();
      }
    });
  }

  const uploadForm = $('#uploadForm');
  if (uploadForm) {
    if (!me) return location.href = 'login.html';
    uploadForm.addEventListener('submit', async event => {
      event.preventDefault();
      const button = $('#uploadSubmitButton');
      const messageEl = $('#uploadMessage');
      const fd = new FormData(uploadForm);
      const file = $('input[name="waste_image"]', uploadForm)?.files?.[0];
      loading(button, true);
      loader.show('Uploading waste, please wait...');
      try {
        await api('/api/uploads', { method: 'POST', body: { wasteType: String(fd.get('waste_type') || '').trim(), quantity: Number(fd.get('quantity') || 0), location: String(fd.get('location') || '').trim(), imageName: file ? file.name : '' } });
        msg(messageEl, 'Waste uploaded.');
        uploadForm.reset();
      } catch (error) {
        msg(messageEl, error.message);
      } finally {
        loading(button, false);
        loader.hide();
      }
    });
  }

  if ($('#walletPage')) {
    if (!me) return location.href = 'login.html';
    const data = await loadAppData();
    $('#walletBalanceAmount') && ($('#walletBalanceAmount').textContent = fmtMoney(data.user.wallet.balance));
    $('#walletIdMask') && ($('#walletIdMask').textContent = mask(data.user.id));
    $('#referralLinkText') && ($('#referralLinkText').textContent = data.user.referralLink || '');
    $('#referralCountText') && ($('#referralCountText').textContent = `${data.user.referralCount || 0} referrals`);
    const tx = data.transactions.filter(item => item.userId === data.user.id).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    $('#walletTransactionList') && ($('#walletTransactionList').innerHTML = tx.map(item => `<article class="transaction-item"><div><h3>${fmtMoney(item.amount)}</h3><p>${item.type} via Interswitch | ${item.status}</p></div><span>${fmtDate(item.createdAt)}</span></article>`).join(''));
    $('#walletEmptyState') && ($('#walletEmptyState').hidden = tx.length > 0);
    $('#copyReferralButton')?.addEventListener('click', async () => {
      try { await navigator.clipboard.writeText($('#referralLinkText')?.textContent || ''); } finally { $('#copyReferralButton').textContent = 'Copied'; }
    });
    $('#withdrawForm')?.addEventListener('submit', async event => {
      event.preventDefault();
      const button = $('#withdrawSubmitButton');
      const messageEl = $('#withdrawMessage');
      const fd = new FormData($('#withdrawForm'));
      loading(button, true);
      loader.show('Processing Interswitch withdrawal, please wait...');
      try {
        const result = await api('/api/wallet/withdraw', { method: 'POST', body: { amount: Number(fd.get('amount') || 0), pin: String(fd.get('wallet_pin') || '').trim(), accountName: String(fd.get('account_name') || '').trim(), bankName: String(fd.get('bank_name') || '').trim(), accountNumber: String(fd.get('account_number') || '').trim() } });
        $('#walletBalanceAmount') && ($('#walletBalanceAmount').textContent = fmtMoney(result.user.wallet.balance));
        msg(messageEl, 'Withdrawal submitted through Interswitch.');
        $('#withdrawForm').reset();
      } catch (error) {
        msg(messageEl, error.message);
      } finally {
        loading(button, false);
        loader.hide();
      }
    });
  }

  if ($('#profilePage')) {
    if (!me) return location.href = 'login.html';
    const currentMe = state.me || await loadMe();
    const grid = $('#profileGrid');
    const items = [['Full Name', currentMe.fullName], ['Email', currentMe.email], ['Phone Number', currentMe.phone], ['Role', currentMe.role], ['Subtype', currentMe.userType || currentMe.subtype], ['Referral Link', currentMe.referralLink]];
    Object.entries(currentMe.roleData || {}).forEach(([key, value]) => { if (value) items.push([titleCase(key), String(value)]); });
    grid && (grid.innerHTML = items.map(([label, value]) => `<article class="profile-card"><p>${label}</p><h3>${value || 'Not set'}</h3></article>`).join(''));
    $('#profileEmptyState') && ($('#profileEmptyState').hidden = items.length > 0);
  }

  if ($('#manageOrdersPage')) {
    if (!me) return location.href = 'login.html';
    const notice = $('#manageOrdersMessage');
    const list = $('#ordersList');
    const empty = $('#ordersEmptyState');
    const renderOrders = async () => {
      const data = await api('/api/orders');
      list.innerHTML = data.orders.map(order => `<article class="order-card"><div class="order-card-top"><div><p class="dashboard-kicker">${order.kind === 'pickup' ? 'Pickup Request' : 'Waste Upload'}</p><h3>${order.wasteType} ${order.kind === 'pickup' ? 'pickup request' : 'waste upload'}</h3></div><span class="status-badge status-${String(order.status).toLowerCase().replace(/\s+/g, '-')}">${order.status}</span></div><p>${order.quantity}kg from ${order.location}</p><div class="order-meta"><span>${order.sellerName}</span><span>${titleCase(order.role)}</span><span>${fmtDate(order.createdAt)}</span></div><div class="order-actions"><button type="button" class="btn btn-primary order-action" data-kind="${order.kind}" data-id="${order.id}">${order.kind === 'pickup' ? 'Accept Order' : 'Pay Seller via Interswitch'}</button></div></article>`).join('');
      if (empty) empty.hidden = data.orders.length > 0;
    };
    await renderOrders();
    list?.addEventListener('click', async event => {
      const button = event.target.closest('.order-action');
      if (!button) return;
      loading(button, true);
      try {
        await api('/api/orders/respond', { method: 'POST', body: { kind: button.dataset.kind, id: button.dataset.id } });
        msg(notice, button.dataset.kind === 'pickup' ? 'Pickup request accepted.' : 'Seller payment completed through Interswitch.');
        await renderOrders();
      } catch (error) {
        msg(notice, error.message);
      } finally {
        loading(button, false);
      }
    });
  }

  clearTimeout(startupFallback);
  loader.hide();
};

bootstrap().catch(error => {
  console.error(error);
  showStartupError(error.message || 'The app could not start.');
  loader.hide();
});
