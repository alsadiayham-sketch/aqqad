import { json, bad, requireRole, readJson } from "./_utils.js";

// Named settings docs. Both are non-sensitive and public-readable:
//   config     -> store settings (whatsapp, regions, about, links...)
//   heroSlides -> homepage hero slides
// Anything not in this allowlist is rejected (sensitive data lives in dedicated
// tables: admin users -> users, cashier users -> pos_users).
const PUBLIC_KEYS = ["config", "heroSlides"];

function keyOf(url) {
    const k = url.searchParams.get("key");
    return k ? String(k) : "config";
}

// GET /api/settings?key=config|heroSlides -> public
export async function onRequestGet(context) {
    const key = keyOf(new URL(context.request.url));
    if (!PUBLIC_KEYS.includes(key)) return bad(404, "unknown settings key");
    const row = await context.env.DB.prepare("SELECT data FROM settings WHERE key = ?").bind(key).first();
    let data = {};
    if (row) { try { data = JSON.parse(row.data) || {}; } catch (e) { data = {}; } }
    return json({ settings: data });
}

// POST /api/settings?key=config|heroSlides -> admin only (replace the doc)
export async function onRequestPost(context) {
    const gate = await requireRole(context.request, context.env, "admin");
    if (gate.error) return gate.error;
    const key = keyOf(new URL(context.request.url));
    if (!PUBLIC_KEYS.includes(key)) return bad(400, "unknown settings key");
    const body = await readJson(context.request);
    if (!body || typeof body !== "object") return bad(400, "invalid body");
    await context.env.DB
        .prepare("INSERT INTO settings (key, data) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET data = excluded.data")
        .bind(key, JSON.stringify(body))
        .run();
    return json({ settings: body });
}
