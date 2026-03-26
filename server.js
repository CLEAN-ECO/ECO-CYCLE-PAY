const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = process.env.PORT || 3000;
const ROOT = __dirname;
const DATA_DIR = process.env.DATA_DIR ? path.resolve(process.env.DATA_DIR) : path.join(ROOT, 'data');
const DATA_FILE = path.join(DATA_DIR, 'db.json');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const emptyDb = () => ({
  users: [],
  sessions: [],
  pendingSignups: [],
  pickups: [],
  uploads: [],
  transactions: [],
  feedback: []
});

const ensureDb = () => {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, JSON.stringify(emptyDb(), null, 2));
};

const readDb = () => {
  ensureDb();
  return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
};

const writeDb = db => {
  ensureDb();
  fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2));
};

const json = (res, status, payload) => {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(payload));
};

const parseBody = req => new Promise((resolve, reject) => {
  let data = '';
  req.on('data', chunk => {
    data += chunk;
    if (data.length > 1_000_000) req.destroy();
  });
  req.on('end', () => {
    if (!data) return resolve({});
    try {
      resolve(JSON.parse(data));
    } catch (error) {
      reject(error);
    }
  });
  req.on('error', reject);
});

const id = prefix => `${prefix}-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
const token = () => crypto.randomBytes(24).toString('hex');
const otp = () => String(Math.floor(100000 + Math.random() * 900000));
const money = n => Number(Number(n || 0).toFixed(2));
const phrase = () => {
  const words = 'green wallet planet plastic future bottle reward pickup forest impact carbon energy clean market supply vendor earth solar river paper metal cycle secure profit growth hub mission nature points value'.split(' ');
  const result = [];
  while (result.length < 12) {
    const next = words[Math.floor(Math.random() * words.length)];
    if (!result.includes(next)) result.push(next);
  }
  return result;
};

const hashPassword = password => {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
};

const verifyPassword = (password, stored) => {
  const [salt, original] = String(stored || '').split(':');
  if (!salt || !original) return false;
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(original, 'hex'));
};

const publicUser = user => ({
  id: user.id,
  fullName: user.fullName,
  email: user.email,
  phone: user.phone,
  role: user.role,
  subtype: user.subtype,
  userType: user.userType,
  roleData: user.roleData || {},
  referralLink: user.referralLink,
  referralCount: user.referralCount || 0,
  wallet: {
    balance: money(user.wallet?.balance || 0)
  }
});

const getAuthToken = req => {
  const auth = req.headers.authorization || '';
  return auth.startsWith('Bearer ') ? auth.slice(7) : '';
};

const getSessionUser = req => {
  const db = readDb();
  const session = db.sessions.find(s => s.token === getAuthToken(req));
  if (!session) return { db, user: null, session: null };
  const user = db.users.find(u => u.id === session.userId) || null;
  return { db, user, session };
};

const requireAuth = req => {
  const state = getSessionUser(req);
  return state.user ? state : null;
};

const seedStarterData = (db, user) => {
  if (!db.pickups.some(x => x.userId === user.id)) {
    db.pickups.push({
      id: id('pickup'),
      userId: user.id,
      role: user.role,
      wasteType: 'Plastics',
      quantity: 5,
      location: 'Yaba, Lagos',
      pickupTime: new Date(Date.now() + 86400000).toISOString(),
      notes: 'Front gate',
      status: 'Pending',
      createdAt: new Date().toISOString()
    });
  }
  if (!db.uploads.some(x => x.userId === user.id)) {
    db.uploads.push({
      id: id('upload'),
      userId: user.id,
      role: user.role,
      wasteType: 'Plastics',
      quantity: 12,
      location: 'Surulere, Lagos',
      imageName: '',
      status: 'Pending payment',
      createdAt: new Date().toISOString()
    });
  }
};

const routes = async (req, res, url) => {
  if (req.method === 'GET' && url.pathname === '/api/health') {
    return json(res, 200, { ok: true });
  }

  if (req.method === 'POST' && url.pathname === '/api/auth/signup/start') {
    const body = await parseBody(req);
    const db = readDb();
    const exists = db.users.some(u => u.email === body.email || u.phone === body.phone);
    if (exists) return json(res, 400, { error: 'An account with this email or phone already exists.' });
    const pending = {
      id: id('pending'),
      fullName: body.fullName,
      email: body.email,
      phone: body.phone,
      passwordHash: hashPassword(body.password),
      role: body.role,
      subtype: body.subtype || '',
      userType: body.userType || body.role,
      roleData: body.roleData || {},
      referralCode: body.referralCode || '',
      verificationCode: otp(),
      verified: false,
      phrase: phrase(),
      confirmPositions: [1, 5, 9],
      createdAt: new Date().toISOString()
    };
    db.pendingSignups = db.pendingSignups.filter(x => x.email !== pending.email && x.phone !== pending.phone);
    db.pendingSignups.push(pending);
    writeDb(db);
    return json(res, 200, {
      pendingId: pending.id,
      message: 'Verification code generated.',
      verificationCode: pending.verificationCode
    });
  }

  if (req.method === 'POST' && url.pathname === '/api/auth/signup/verify') {
    const body = await parseBody(req);
    const db = readDb();
    const pending = db.pendingSignups.find(x => x.id === body.pendingId);
    if (!pending) return json(res, 404, { error: 'Signup session expired.' });
    if (String(body.code || '').trim() !== pending.verificationCode) return json(res, 400, { error: 'Invalid verification code.' });
    pending.verified = true;
    writeDb(db);
    return json(res, 200, {
      phrase: pending.phrase,
      confirmPositions: pending.confirmPositions
    });
  }

  if (req.method === 'POST' && url.pathname === '/api/auth/signup/complete') {
    const body = await parseBody(req);
    const db = readDb();
    const pending = db.pendingSignups.find(x => x.id === body.pendingId);
    if (!pending || !pending.verified) return json(res, 400, { error: 'Signup is not verified yet.' });
    const answers = body.answers || {};
    const ok = pending.confirmPositions.every(pos => String(answers[pos] || '').trim().toLowerCase() === pending.phrase[pos].toLowerCase());
    if (!ok) return json(res, 400, { error: 'Secret phrase confirmation does not match.' });
    const user = {
      id: id('user'),
      fullName: pending.fullName,
      email: pending.email,
      phone: pending.phone,
      passwordHash: pending.passwordHash,
      role: pending.role,
      subtype: pending.subtype,
      userType: pending.userType,
      roleData: pending.roleData,
      referralLink: `ecocyclepay.com/ref?user=${pending.email}`,
      referralCount: 0,
      wallet: { pin: String(body.pin), balance: 2500, secretPhrase: pending.phrase },
      createdAt: new Date().toISOString()
    };
    db.users.push(user);
    db.pendingSignups = db.pendingSignups.filter(x => x.id !== pending.id);
    seedStarterData(db, user);
    const session = { token: token(), userId: user.id, createdAt: new Date().toISOString() };
    db.sessions.push(session);
    writeDb(db);
    return json(res, 200, { token: session.token, user: publicUser(user) });
  }

  if (req.method === 'POST' && url.pathname === '/api/auth/login') {
    const body = await parseBody(req);
    const db = readDb();
    const user = db.users.find(u => u.email === body.identifier || u.phone === body.identifier);
    if (!user || !verifyPassword(body.password, user.passwordHash)) return json(res, 401, { error: 'Invalid login details.' });
    const session = { token: token(), userId: user.id, createdAt: new Date().toISOString() };
    db.sessions.push(session);
    writeDb(db);
    return json(res, 200, { token: session.token, user: publicUser(user) });
  }

  if (req.method === 'POST' && url.pathname === '/api/auth/logout') {
    const db = readDb();
    db.sessions = db.sessions.filter(s => s.token !== getAuthToken(req));
    writeDb(db);
    return json(res, 200, { ok: true });
  }

  if (req.method === 'GET' && url.pathname === '/api/me') {
    const state = requireAuth(req);
    if (!state) return json(res, 401, { error: 'Unauthorized.' });
    return json(res, 200, { user: publicUser(state.user) });
  }

  if (req.method === 'GET' && url.pathname === '/api/app-data') {
    const state = requireAuth(req);
    if (!state) return json(res, 401, { error: 'Unauthorized.' });
    return json(res, 200, {
      user: publicUser(state.user),
      pickups: state.db.pickups,
      uploads: state.db.uploads,
      transactions: state.db.transactions
    });
  }

  if (req.method === 'POST' && url.pathname === '/api/pickups') {
    const state = requireAuth(req);
    if (!state) return json(res, 401, { error: 'Unauthorized.' });
    const body = await parseBody(req);
    const item = {
      id: id('pickup'),
      userId: state.user.id,
      role: state.user.role,
      wasteType: body.wasteType,
      quantity: Number(body.quantity),
      location: body.location,
      pickupTime: body.pickupTime,
      notes: body.notes || '',
      status: 'Pending',
      createdAt: new Date().toISOString()
    };
    state.db.pickups.push(item);
    writeDb(state.db);
    return json(res, 200, { pickup: item });
  }

  if (req.method === 'POST' && url.pathname === '/api/uploads') {
    const state = requireAuth(req);
    if (!state) return json(res, 401, { error: 'Unauthorized.' });
    const body = await parseBody(req);
    const item = {
      id: id('upload'),
      userId: state.user.id,
      role: state.user.role,
      wasteType: body.wasteType,
      quantity: Number(body.quantity),
      location: body.location,
      imageName: body.imageName || '',
      status: 'Pending payment',
      createdAt: new Date().toISOString()
    };
    state.db.uploads.push(item);
    writeDb(state.db);
    return json(res, 200, { upload: item });
  }

  if (req.method === 'POST' && url.pathname === '/api/wallet/withdraw') {
    const state = requireAuth(req);
    if (!state) return json(res, 401, { error: 'Unauthorized.' });
    const body = await parseBody(req);
    if (String(body.pin || '') !== String(state.user.wallet?.pin || '')) return json(res, 400, { error: 'Wallet PIN is incorrect.' });
    const amount = Number(body.amount || 0);
    if (amount <= 0 || amount > Number(state.user.wallet?.balance || 0)) return json(res, 400, { error: 'Insufficient wallet balance.' });
    state.user.wallet.balance = money(state.user.wallet.balance - amount);
    state.db.users = state.db.users.map(u => u.id === state.user.id ? state.user : u);
    state.db.transactions.unshift({
      id: id('txn'),
      userId: state.user.id,
      type: 'Withdrawal',
      amount,
      status: 'Processing',
      createdAt: new Date().toISOString()
    });
    writeDb(state.db);
    return json(res, 200, { user: publicUser(state.user) });
  }

  if (req.method === 'GET' && url.pathname === '/api/orders') {
    const state = requireAuth(req);
    if (!state) return json(res, 401, { error: 'Unauthorized.' });
    const usersById = Object.fromEntries(state.db.users.map(u => [u.id, u]));
    const orders = [
      ...state.db.pickups.map(p => ({ kind: 'pickup', ...p, sellerName: usersById[p.userId]?.fullName || 'Unknown user' })),
      ...state.db.uploads.map(u => ({ kind: 'upload', ...u, sellerName: usersById[u.userId]?.fullName || 'Unknown user' }))
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return json(res, 200, { orders });
  }

  if (req.method === 'POST' && url.pathname === '/api/orders/respond') {
    const state = requireAuth(req);
    if (!state) return json(res, 401, { error: 'Unauthorized.' });
    const body = await parseBody(req);
    if (body.kind === 'pickup') {
      state.db.pickups = state.db.pickups.map(p => p.id === body.id ? { ...p, status: 'Accepted', respondedBy: state.user.id } : p);
      writeDb(state.db);
      return json(res, 200, { ok: true });
    }
    if (body.kind === 'upload') {
      const upload = state.db.uploads.find(x => x.id === body.id);
      if (!upload) return json(res, 404, { error: 'Upload not found.' });
      upload.status = 'Paid';
      upload.respondedBy = state.user.id;
      const seller = state.db.users.find(u => u.id === upload.userId);
      const amount = money(Number(upload.quantity || 0) * 200);
      if (seller) {
        seller.wallet.balance = money(Number(seller.wallet?.balance || 0) + amount);
        state.db.transactions.unshift({
          id: id('txn'),
          userId: seller.id,
          type: 'Waste Payment',
          amount,
          status: 'Completed',
          createdAt: new Date().toISOString()
        });
      }
      writeDb(state.db);
      return json(res, 200, { ok: true });
    }
    return json(res, 400, { error: 'Invalid order action.' });
  }

  if (req.method === 'POST' && url.pathname === '/api/feedback') {
    const body = await parseBody(req);
    const state = getSessionUser(req);
    state.db.feedback.unshift({
      id: id('feedback'),
      page: body.page,
      name: body.name || '',
      email: body.email || '',
      text: body.text,
      userId: state.user?.id || null,
      createdAt: new Date().toISOString()
    });
    writeDb(state.db);
    return json(res, 200, { ok: true });
  }

  return false;
};

const serveStatic = (req, res, url) => {
  let filePath = path.join(ROOT, url.pathname === '/' ? 'index.html' : url.pathname);
  if (!filePath.startsWith(ROOT)) return json(res, 403, { error: 'Forbidden.' });
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) return false;
  const ext = path.extname(filePath).toLowerCase();
  res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
  fs.createReadStream(filePath).pipe(res);
  return true;
};

ensureDb();

http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  try {
    if (url.pathname.startsWith('/api/')) {
      const handled = await routes(req, res, url);
      if (handled !== false) return;
      return json(res, 404, { error: 'Not found.' });
    }
    if (serveStatic(req, res, url)) return;
    return json(res, 404, { error: 'Not found.' });
  } catch (error) {
    return json(res, 500, { error: error.message || 'Server error.' });
  }
}).listen(PORT, '0.0.0.0', () => {
  console.log(`EcoCycle Pay running on port ${PORT}`);
});
