const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Max-Age': '86400',
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS },
  });
}

function decodeToken(token) {
  try {
    const str = atob(token);
    return JSON.parse(str);
  } catch {
    return null;
  }
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS });
}

export async function onRequestGet({ request }) {
  const auth = request.headers.get('Authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (!token) {
    return json({ error: 'missing_token' }, 401);
  }

  const payload = decodeToken(token);
  if (!payload || !payload.uid || !payload.exp) {
    return json({ error: 'invalid_token' }, 401);
  }

  if (Date.now() > payload.exp) {
    return json({ error: 'token_expired' }, 401);
  }

  return json({
    id: payload.uid,
    username: payload.sub,
    name: payload.name,
    role: payload.role,
    member_no: payload.member_no,
  });
}
