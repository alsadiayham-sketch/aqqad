import { json, bad, pbkdf2Hex, safeEqual, signToken, getPosSessionVersion, readJson } from "./_utils.js";

// POST /api/pos-login  { username, password } -> { token, user }
// Cashier authentication for the ADA POS terminal. Compared server-side; the POS
// never receives any hash. Parameterized exact-match query -> injection-proof.
export async function onRequestPost(context) {
    const { request, env } = context;
    if (!env.AUTH_SECRET) return bad(500, "server not configured");
    const body = await readJson(request);
    if (!body) return bad(400, "invalid body");

    const username = String(body.username || "").trim();
    const password = String(body.password || "");
    if (!username || !password || username.length > 80 || password.length > 200) {
        return bad(400, "missing credentials");
    }

    const row = await env.DB
        .prepare("SELECT username, name, role, salt, iterations, hash, active FROM pos_users WHERE username = ?")
        .bind(username)
        .first();
    if (!row) return bad(401, "invalid credentials");
    if (Number(row.active) === 0) return bad(403, "user disabled");

    const computed = await pbkdf2Hex(password, row.salt, row.iterations || 100000);
    if (!safeEqual(computed, row.hash)) return bad(401, "invalid credentials");

    const sv = await getPosSessionVersion(env);
    const now = Math.floor(Date.now() / 1000);
    const payload = {
        kind: "pos",
        sub: row.username,
        name: row.name,
        role: row.role,
        sv: Number(sv),
        iat: now,
        exp: now + 60 * 60 * 24 // 24h cashier shift token
    };
    const token = await signToken(env.AUTH_SECRET, payload);
    return json({ token, user: { username: row.username, name: row.name, role: row.role } });
}
