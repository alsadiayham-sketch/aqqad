import { json, bad, requireRole, makeUserRecord, pbkdf2Hex, genSalt, readJson } from "./_utils.js";

// POS cashier accounts are NOT a separate store anymore: cashiers ARE employees.
// This endpoint is a thin compatibility alias over the single `users` table, so
// the POS terminal and the back-office always read/write the exact same records.
// Manage people from /api/users; this endpoint stays for backward compatibility.

// GET /api/pos-users -> admin. Safe fields only. `active` is always true (the
// unified `users` model has no per-cashier disable flag — remove to revoke).
export async function onRequestGet(context) {
    const gate = await requireRole(context.request, context.env, "admin");
    if (gate.error) return gate.error;
    const { results } = await context.env.DB
        .prepare("SELECT username, name, role FROM users ORDER BY username ASC")
        .all();
    return json({ users: (results || []).map(function (u) { return { username: u.username, name: u.name, role: u.role, active: true }; }) });
}

// POST /api/pos-users -> admin. Create/update in the shared `users` table.
// body { username, name, role, password? }
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

    const existing = await context.env.DB
        .prepare("SELECT username FROM users WHERE username = ?")
        .bind(username)
        .first();

    if (!existing) {
        if (!password) return bad(400, "password required for new user");
        const rec = await makeUserRecord(name, role, password);
        await context.env.DB
            .prepare("INSERT INTO users (username, name, role, salt, iterations, hash, algo, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
            .bind(username, rec.name, rec.role, rec.salt, rec.iterations, rec.hash, rec.algo, Date.now())
            .run();
        return json({ user: { username, name: rec.name, role: rec.role, active: true } });
    }

    if (password) {
        const salt = genSalt();
        const iterations = 100000;
        const hash = await pbkdf2Hex(password, salt, iterations);
        await context.env.DB
            .prepare("UPDATE users SET name = ?, role = ?, salt = ?, iterations = ?, hash = ?, algo = 'PBKDF2-SHA256' WHERE username = ?")
            .bind(name, role, salt, iterations, hash, username)
            .run();
    } else {
        await context.env.DB
            .prepare("UPDATE users SET name = ?, role = ? WHERE username = ?")
            .bind(name, role, username)
            .run();
    }
    return json({ user: { username, name, role, active: true } });
}

// DELETE /api/pos-users?username=... -> admin. Removes from the shared `users`
// table (refuses to remove the last admin, mirroring /api/users).
export async function onRequestDelete(context) {
    const gate = await requireRole(context.request, context.env, "admin");
    if (gate.error) return gate.error;
    const username = new URL(context.request.url).searchParams.get("username");
    if (!username) return bad(400, "missing username");

    const target = await context.env.DB
        .prepare("SELECT role FROM users WHERE username = ?")
        .bind(username)
        .first();
    if (!target) return json({ ok: true });
    if (target.role === "admin") {
        const row = await context.env.DB
            .prepare("SELECT COUNT(*) AS c FROM users WHERE role = 'admin'")
            .first();
        if (row && row.c <= 1) return bad(400, "cannot remove the last admin");
    }
    await context.env.DB.prepare("DELETE FROM users WHERE username = ?").bind(username).run();
    return json({ ok: true });
}
