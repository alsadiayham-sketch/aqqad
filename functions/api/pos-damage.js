import { json, bad, requireRole, requirePos, readJson } from "./_utils.js";

function rowTo(row) {
    let obj = {};
    try { obj = JSON.parse(row.data) || {}; } catch (e) { obj = {}; }
    obj.id = row.id;
    if (obj.createdAt == null) obj.createdAt = row.created_at;
    return obj;
}
function newId() { return "dmg_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }

// GET /api/pos-damage?limit=100 -> authenticated, newest first
export async function onRequestGet(context) {
    const gate = await requireRole(context.request, context.env, null);
    if (gate.error) {
        const pos = await requirePos(context.request, context.env, null);
        if (pos.error) return pos.error;
    }
    const url = new URL(context.request.url);
    let limit = parseInt(url.searchParams.get("limit") || "100", 10);
    if (!Number.isFinite(limit) || limit <= 0 || limit > 500) limit = 100;
    const { results } = await context.env.DB
        .prepare("SELECT id, data, created_at FROM pos_damage ORDER BY created_at DESC LIMIT ?")
        .bind(limit)
        .all();
    return json({ items: (results || []).map(rowTo) });
}

// POST /api/pos-damage -> cashier (or admin) records damaged/written-off stock
export async function onRequestPost(context) {
    const gate = await requirePos(context.request, context.env, null);
    if (gate.error) return gate.error;
    const body = await readJson(context.request);
    if (!body || typeof body !== "object") return bad(400, "invalid body");
    const id = String(body.id || newId());
    const ts = Number(body.createdAt) || Date.now();
    const data = { ...body };
    delete data.id;
    await context.env.DB
        .prepare("INSERT OR REPLACE INTO pos_damage (id, data, created_at) VALUES (?, ?, ?)")
        .bind(id, JSON.stringify(data), ts)
        .run();
    return json({ id });
}

// DELETE /api/pos-damage?id=... -> admin only
export async function onRequestDelete(context) {
    const gate = await requireRole(context.request, context.env, "admin");
    if (gate.error) return gate.error;
    const id = new URL(context.request.url).searchParams.get("id");
    if (!id) return bad(400, "missing id");
    await context.env.DB.prepare("DELETE FROM pos_damage WHERE id = ?").bind(id).run();
    return json({ ok: true });
}
