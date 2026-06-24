import { json, bad, requireRole, requirePos, readJson } from "./_utils.js";
function rowToOrder(row) {
    let obj = {};
    try { obj = JSON.parse(row.data) || {}; } catch (e) { obj = {}; }
    obj.id = row.id;
    obj.status = row.status;
    if (row.order_number != null && obj.orderNumber == null) obj.orderNumber = row.order_number;
    if (row.source != null && obj.source == null) obj.source = row.source;
    obj.createdAt = obj.createdAt || row.created_at;
    return obj;
}
function newId() { return "o_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }

// GET /api/orders                  -> list, any authenticated admin/worker
// GET /api/orders?id=...           -> PUBLIC single lookup by id
// GET /api/orders?orderNumber=...  -> PUBLIC single lookup by order number (tracking)
export async function onRequestGet(context) {
    const url = new URL(context.request.url);
    const id = url.searchParams.get("id");
    const orderNumber = url.searchParams.get("orderNumber");
    if (id || orderNumber) {
        const row = id
            ? await context.env.DB.prepare("SELECT id, order_number, source, data, status, created_at FROM orders WHERE id = ?").bind(id).first()
            : await context.env.DB.prepare("SELECT id, order_number, source, data, status, created_at FROM orders WHERE order_number = ? ORDER BY created_at DESC LIMIT 1").bind(orderNumber).first();
        if (!row) return json({ order: null }, 404);
        return json({ order: rowToOrder(row) });
    }
    // List requires a session: admin/worker back-office OR a POS cashier token.
    const gate = await requirePos(context.request, context.env, null);
    if (gate.error) return gate.error;
    const { results } = await context.env.DB
        .prepare("SELECT id, order_number, source, data, status, created_at FROM orders ORDER BY created_at DESC")
        .all();
    return json({ orders: (results || []).map(rowToOrder) });
}

// POST /api/orders -> web checkout is PUBLIC; POS-sourced orders require a cashier token.
export async function onRequestPost(context) {
    const body = await readJson(context.request);
    if (!body || typeof body !== "object") return bad(400, "invalid body");
    const source = String(body.source || "web");
    if (source !== "web") {
        const gate = await requirePos(context.request, context.env, null);
        if (gate.error) return gate.error;
    }
    const id = String(body.id || newId());
    const status = String(body.status || "new");
    const orderNumber = body.orderNumber != null ? String(body.orderNumber) : null;
    const data = { ...body };
    delete data.id;
    delete data.status;
    delete data.createdAt;
    const now = Number(body.createdAt) || Date.now();
    await context.env.DB
        .prepare("INSERT OR REPLACE INTO orders (id, order_number, data, status, source, created_at) VALUES (?, ?, ?, ?, ?, ?)")
        .bind(id, orderNumber, JSON.stringify(data), status, source, now)
        .run();

    // Deduct variant stock server-side so anonymous shoppers never need write
    // access to the products table. Best-effort: a failure here must not lose
    // the order that was already saved.
    try {
        await deductStock(context.env, data.items);
    } catch (e) { /* ignore stock adjustment failure */ }

    return json({ id, order: { ...data, id, status, source, orderNumber, createdAt: now } });
}

async function deductStock(env, items) {
    if (!Array.isArray(items) || !items.length) return;
    // Aggregate quantities per product so each product is read/written once.
    const byProduct = {};
    for (const it of items) {
        const pid = it && it.productId;
        if (!pid) continue;
        if (!byProduct[pid]) byProduct[pid] = [];
        byProduct[pid].push(it);
    }
    for (const pid of Object.keys(byProduct)) {
        const row = await env.DB.prepare("SELECT data FROM products WHERE id = ?").bind(pid).first();
        if (!row) continue;
        let prod = {};
        try { prod = JSON.parse(row.data) || {}; } catch (e) { continue; }
        const variants = Array.isArray(prod.variants) ? prod.variants : [];
        if (!variants.length) continue;
        for (const it of byProduct[pid]) {
            const qty = parseInt(it.qty, 10) || 1;
            for (const v of variants) {
                if (String(v.size) === String(it.size) && String(v.color) === String(it.color)) {
                    v.stock = Math.max(0, (parseInt(v.stock, 10) || 0) - qty);
                }
            }
        }
        prod.variants = variants;
        await env.DB.prepare("UPDATE products SET data = ? WHERE id = ?").bind(JSON.stringify(prod), pid).run();
    }
}

// PATCH /api/orders?id=...  body { status, ... } -> any authenticated user
export async function onRequestPatch(context) {
    const gate = await requireRole(context.request, context.env, null);
    if (gate.error) return gate.error;
    const id = new URL(context.request.url).searchParams.get("id");
    if (!id) return bad(400, "missing id");
    const body = await readJson(context.request);
    if (!body || typeof body !== "object") return bad(400, "invalid body");
    const row = await context.env.DB.prepare("SELECT data FROM orders WHERE id = ?").bind(id).first();
    if (!row) return bad(404, "not found");
    let data = {};
    try { data = JSON.parse(row.data) || {}; } catch (e) { data = {}; }
    const merged = { ...data, ...body };
    const status = body.status != null ? String(body.status) : undefined;
    delete merged.id; delete merged.status; delete merged.createdAt;
    if (status !== undefined) {
        await context.env.DB.prepare("UPDATE orders SET data = ?, status = ? WHERE id = ?").bind(JSON.stringify(merged), status, id).run();
    } else {
        await context.env.DB.prepare("UPDATE orders SET data = ? WHERE id = ?").bind(JSON.stringify(merged), id).run();
    }
    return json({ ok: true });
}

// DELETE /api/orders?id=... -> admin only
export async function onRequestDelete(context) {
    const gate = await requireRole(context.request, context.env, "admin");
    if (gate.error) return gate.error;
    const id = new URL(context.request.url).searchParams.get("id");
    if (!id) return bad(400, "missing id");
    await context.env.DB.prepare("DELETE FROM orders WHERE id = ?").bind(id).run();
    return json({ ok: true });
}
