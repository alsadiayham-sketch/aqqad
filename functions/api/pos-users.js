import { json, bad, requireRole, makeUserRecord, pbkdf2Hex, genSalt, readJson } from "./_utils.js";

// POS cashier accounts. Admin-only management; salt/hash are NEVER returned.
// Passwords are write-only. Cashiers authenticate via /api/pos-login.

// GET /api/pos-users -> admin. Safe fields only (+ active flag).
export async function onRequestGet(context) {
    const gate = await requireRole(context.request, context.env, "admin");
    if (gate.error) return gate.error;
    const { results } = await context.env.DB
        .prepare("SELECT username, name, role, active FROM pos_users ORDER BY username ASC")
        .all();
    return json({ users: (results || []).map(function (u) { return { username: u.username, name: u.name, role: u.role, active: Number(u.active) === 1 }; }) });
}

// POST /api/pos-users -> admin. Create/update. body { username, name, role, password?, active? }
export async function onRequestPost(context) {
    const gate = await requireRole(context.request, context.env, "admin");
    if (gate.error) return gate.error;
    const body = await readJson(context.request);
    if (!body) return bad(400, "invalid body");

    const username = String(body.username || "").trim();
    if (!username || username.length > 80) return bad(400, "invalid username");
    const name = String(body.name || username);
    const role = body.role === "admin" ? "admin" : "worker";
    const password = body.password ? String(body.password) : "";
    const active = body.active === false ? 0 : 1;

    const existing = await context.env.DB
        .prepare("SELECT username FROM pos_users WHERE username = ?")
        .bind(username)
        .first();

    if (!existing) {
        if (!password) return bad(400, "password required for new user");
        const rec = await makeUserRecord(name, role, password);
        await context.env.DB
            .prepare("INSERT INTO pos_users (username, name, role, salt, iterations, hash, algo, active, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)")
            .bind(username, rec.name, rec.role, rec.salt, rec.iterations, rec.hash, rec.algo, active, Date.now())
            .run();
        return json({ user: { username, name: rec.name, role: rec.role, active: active === 1 } });
    }

    if (password) {
        const salt = genSalt();
        const iterations = 100000;
        const hash = await pbkdf2Hex(password, salt, iterations);
        await context.env.DB
            .prepare("UPDATE pos_users SET name = ?, role = ?, salt = ?, iterations = ?, hash = ?, algo = 'PBKDF2-SHA256', active = ? WHERE username = ?")
            .bind(name, role, salt, iterations, hash, active, username)
            .run();
    } else {
        await context.env.DB
            .prepare("UPDATE pos_users SET name = ?, role = ?, active = ? WHERE username = ?")
            .bind(name, role, active, username)
            .run();
    }
    return json({ user: { username, name, role, active: active === 1 } });
}

// DELETE /api/pos-users?username=... -> admin.
export async function onRequestDelete(context) {
    const gate = await requireRole(context.request, context.env, "admin");
    if (gate.error) return gate.error;
    const username = new URL(context.request.url).searchParams.get("username");
    if (!username) return bad(400, "missing username");
    await context.env.DB.prepare("DELETE FROM pos_users WHERE username = ?").bind(username).run();
    return json({ ok: true });
}
