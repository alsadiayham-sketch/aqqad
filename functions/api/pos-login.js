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

    // Single source of truth: cashiers ARE employees. Authenticate against the
    // shared `users` table so the POS terminal and the back-office never diverge.
    let row = await env.DB
        .prepare("SELECT username, name, role, salt, iterations, hash FROM users WHERE username = ?")
        .bind(username)
        .first();

    let verified = false;
    if (row) {
        const computed = await pbkdf2Hex(password, row.salt, row.iterations || 100000);
        verified = safeEqual(computed, row.hash);
    }

    // Self-healing migration: a cashier that still lives only in the legacy
    // `pos_users` table is verified there once and copied into `users`, so the
    // unified model needs no manual DB migration and nobody loses POS access.
    if (!verified) {
        const legacy = await env.DB
            .prepare("SELECT username, name, role, salt, iterations, hash, algo, active, created_at FROM pos_users WHERE username = ?")
            .bind(username)
            .first()
            .catch(function () { return null; });
        if (legacy && Number(legacy.active) !== 0) {
            const computedLegacy = await pbkdf2Hex(password, legacy.salt, legacy.iterations || 100000);
            if (safeEqual(computedLegacy, legacy.hash)) {
                if (!row) {
                    // Migrate only when the username is free in `users`, so we never
                    // overwrite an existing (e.g. admin) account with cashier creds.
                    await env.DB
                        .prepare("INSERT OR IGNORE INTO users (username, name, role, salt, iterations, hash, algo, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
                        .bind(legacy.username, legacy.name, legacy.role, legacy.salt, legacy.iterations, legacy.hash, legacy.algo || "PBKDF2-SHA256", legacy.created_at || Date.now())
                        .run()
                        .catch(function () {});
                }
                row = { username: legacy.username, name: legacy.name, role: legacy.role };
                verified = true;
            }
        }
    }

    if (!verified || !row) return bad(401, "invalid credentials");

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
