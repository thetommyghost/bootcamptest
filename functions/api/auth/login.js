const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400',
};

const TEST_USERS = [
  { id: 'user_01', username: 'member1', password: 'camp2026', name: 'Aisha Test', role: 'camper', member_no: 'C-001' },
  { id: 'user_02', username: 'admin1', password: 'admin2026', name: 'Admin Test', role: 'admin', member_no: 'A-001' },
];

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS },
  });
}

function encodeToken(payload) {
  const str = JSON.stringify(payload);
  return btoa(str);
}

function decodeToken(token) {
  try {
    const str = atob(token);
    return JSON.parse(str);
  } catch {
    return null;
  }
}

const TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS });
}

export async function onRequestPost({ request }) {
  let body;
  try { body = await request.json(); }
  catch { return json({ error: 'invalid_json' }, 400); }

  const { username, password } = body || {};
  if (!username || !password) {
    return json({ error: 'missing_credentials' }, 400);
  }

  const user = TEST_USERS.find(u => u.username === username && u.password === password);
  if (!user) {
    return json({ error: 'invalid_credentials' }, 401);
  }

  const token = encodeToken({
    uid: user.id,
    sub: user.username,
    name: user.name,
    role: user.role,
    member_no: user.member_no,
    exp: Date.now() + TOKEN_TTL_MS,
  });

  return json({
    token,
    user: {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
      member_no: user.member_no,
    },
  });
}
