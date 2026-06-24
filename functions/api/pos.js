import { json, bad, requireRole, requirePos, readJson } from "./_utils.js";

function rowTo(row) {
    let obj = {};
    try { obj = JSON.parse(row.data) || {}; } catch (e) { obj = {}; }
    obj.id = row.id;
    if (obj.timestamp == null) obj.timestamp = row.timestamp;
    return obj;
}
function newId() { return "log_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }

// GET /api/pos?limit=100 -> authenticated (admin/worker/cashier) activity log, newest first
export async function onRequestGet(context) {
    const gate = await requireRole(context.request, context.env, null);
    if (gate.error) {
        // allow cashier tokens too
        const pos = await requirePos(context.request, context.env, null);
        if (pos.error) return pos.error;
    }
    const url = new URL(context.request.url);
    let limit = parseInt(url.searchParams.get("limit") || "100", 10);
    if (!Number.isFinite(limit) || limit <= 0 || limit > 500) limit = 100;
    const { results } = await context.env.DB
        .prepare("SELECT id, data, timestamp FROM pos_logs ORDER BY timestamp DESC LIMIT ?")
        .bind(limit)
        .all();
    return json({ logs: (results || []).map(rowTo) });
}

// POST /api/pos -> cashier (or admin) appends a log entry
export async function onRequestPost(context) {
    const gate = await requirePos(context.request, context.env, null);
    if (gate.error) return gate.error;
    const body = await readJson(context.request);
    if (!body || typeof body !== "object") return bad(400, "invalid body");
    const id = String(body.id || newId());
    const ts = Number(body.timestamp) || Date.now();
    const data = { ...body };
    delete data.id;
    await context.env.DB
        .prepare("INSERT OR REPLACE INTO pos_logs (id, data, timestamp) VALUES (?, ?, ?)")
        .bind(id, JSON.stringify(data), ts)
        .run();
    return json({ id });
}

// DELETE /api/pos?id=... -> admin only
export async function onRequestDelete(context) {
    const gate = await requireRole(context.request, context.env, "admin");
    if (gate.error) return gate.error;
    const id = new URL(context.request.url).searchParams.get("id");
    if (!id) return bad(400, "missing id");
    await context.env.DB.prepare("DELETE FROM pos_logs WHERE id = ?").bind(id).run();
    return json({ ok: true });
}
