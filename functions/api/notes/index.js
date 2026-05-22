// Bootcamp Scout V3 Round 3 — Pages Function for shared team notes.
// Storage: env.NOTES_KV (workspace_id → JSON { schema_version, notes: [...] }).
// Routes (all match /api/notes via this file because the directory is /api/notes/):
//   GET    /api/notes?workspace=<id>&since=<ms>   list all notes (or delta)
//   POST   /api/notes?workspace=<id>              upsert one note
//   DELETE /api/notes?workspace=<id>&id=<note_id> soft-delete (deleted_at)
// Access model: anyone with the workspace URL writes. Workspace IDs are
// sanitized to [a-z0-9_-]{1,64} so a URL leak doesn't expose other workspaces.

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400',
};

function json(data, status = 200, extra = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS, ...extra },
  });
}

function sanitizeWs(raw) {
  const ws = String(raw || 'edward-said').toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 64);
  return ws || 'edward-said';
}

function validNote(note) {
  if (!note || typeof note !== 'object') return false;
  if (!note.id || typeof note.id !== 'string' || note.id.length > 64) return false;
  const title = String(note.title || '');
  const body  = String(note.body  || '');
  if (title.length > 120) return false;
  if (body.length  > 1200) return false;
  if (!title && !body) return false;
  if (note.zone && typeof note.zone !== 'string') return false;
  if (note.author && typeof note.author !== 'string') return false;
  if (note.reply_to && typeof note.reply_to !== 'string') return false;
  if (note.pinned !== undefined && typeof note.pinned !== 'boolean') return false;
  if (note.pos && (typeof note.pos.x !== 'number' || typeof note.pos.y !== 'number')) return false;
  return true;
}

async function readWorkspace(env, wsId) {
  if (!env.NOTES_KV) throw new Error('NOTES_KV binding missing');
  const raw = await env.NOTES_KV.get(wsId);
  if (!raw) return { schema_version: 1, workspace_id: wsId, notes: [] };
  try {
    const d = JSON.parse(raw);
    if (!Array.isArray(d.notes)) d.notes = [];
    return d;
  } catch {
    return { schema_version: 1, workspace_id: wsId, notes: [] };
  }
}

async function writeWorkspace(env, wsId, data) {
  await env.NOTES_KV.put(wsId, JSON.stringify(data));
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS });
}

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const wsId = sanitizeWs(url.searchParams.get('workspace'));
  const since = parseInt(url.searchParams.get('since') || '0', 10) || 0;
  let data;
  try { data = await readWorkspace(env, wsId); }
  catch (e) { return json({ error: 'kv_unavailable', detail: String(e.message) }, 503); }
  let notes = data.notes;
  if (since > 0) notes = notes.filter(n => (n.updated_at || 0) > since);
  return json({
    workspace_id: wsId,
    schema_version: data.schema_version || 1,
    notes,
    server_time: Date.now(),
  });
}

// Cap per-workspace notes (live + tombstones) so the KV blob can't grow without
// bound. 1000 notes ~= 300KB at ~300B each — well below KV's 25MB value ceiling.
// Anyone abusing the write budget hits 409 instead of corrupting the workspace.
const MAX_NOTES_PER_WORKSPACE = 1000;

export async function onRequestPost({ request, env }) {
  const url = new URL(request.url);
  const wsId = sanitizeWs(url.searchParams.get('workspace'));
  let note;
  try { note = await request.json(); }
  catch { return json({ error: 'invalid_json' }, 400); }
  if (!validNote(note)) return json({ error: 'invalid_note' }, 400);
  const now = Date.now();
  note.updated_at = now;
  if (!note.created_at) note.created_at = now;
  let data;
  try { data = await readWorkspace(env, wsId); }
  catch (e) { return json({ error: 'kv_unavailable', detail: String(e.message) }, 503); }
  const idx = data.notes.findIndex(n => n.id === note.id);
  if (idx >= 0) {
    data.notes[idx] = { ...data.notes[idx], ...note };
  } else {
    if (data.notes.length >= MAX_NOTES_PER_WORKSPACE) {
      return json({ error: 'workspace_full', limit: MAX_NOTES_PER_WORKSPACE }, 409);
    }
    data.notes.push(note);
  }
  try { await writeWorkspace(env, wsId, data); }
  catch (e) { return json({ error: 'kv_write_failed', detail: String(e.message) }, 503); }
  return json({ note, server_time: now });
}

export async function onRequestDelete({ request, env }) {
  const url = new URL(request.url);
  const wsId = sanitizeWs(url.searchParams.get('workspace'));
  const id = url.searchParams.get('id');
  if (!id) return json({ error: 'missing_id' }, 400);
  let data;
  try { data = await readWorkspace(env, wsId); }
  catch (e) { return json({ error: 'kv_unavailable', detail: String(e.message) }, 503); }
  const note = data.notes.find(n => n.id === id);
  if (!note) return json({ error: 'not_found' }, 404);
  const now = Date.now();
  note.deleted_at = now;
  note.updated_at = now;
  try { await writeWorkspace(env, wsId, data); }
  catch (e) { return json({ error: 'kv_write_failed', detail: String(e.message) }, 503); }
  return json({ ok: true, server_time: now });
}
