import { json, bad, requirePos, readJson } from "./_utils.js";

// POST /api/pos-stock  { productId, variants }  -> cashier (or admin).
// Lets the POS terminal adjust a product's variant stock (restock / damage)
// WITHOUT granting full product write access (that stays admin-only via
// /api/products). Only the variants array is replaced.
export async function onRequestPost(context) {
    const gate = await requirePos(context.request, context.env, null);
    if (gate.error) return gate.error;
    const body = await readJson(context.request);
    if (!body || typeof body !== "object") return bad(400, "invalid body");
    const productId = String(body.productId || "");
    if (!productId) return bad(400, "missing productId");
    if (!Array.isArray(body.variants)) return bad(400, "variants must be an array");

    const row = await context.env.DB.prepare("SELECT data FROM products WHERE id = ?").bind(productId).first();
    if (!row) return bad(404, "product not found");
    let prod = {};
    try { prod = JSON.parse(row.data) || {}; } catch (e) { prod = {}; }
    prod.variants = body.variants;
    await context.env.DB
        .prepare("UPDATE products SET data = ?, updated_at = ? WHERE id = ?")
        .bind(JSON.stringify(prod), Date.now(), productId)
        .run();
    return json({ ok: true });
}
