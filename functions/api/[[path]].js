// 樂高實驗室的後端 API（Cloudflare Pages Functions + D1 資料庫）。
// 大人密碼只在這裡檢查：它的雜湊值存在 Cloudflare 的祕密變數 PARENT_HASH，不放進公開的程式碼。
const AVATARS = ["🦁", "🐼", "🦊", "🐯", "🐸", "🐰", "🐻", "🦄", "🐧", "🐶"];
const MAX_FAILS = 10; // 同一個 IP 在 LOCK_MS 內最多錯幾次大人密碼
const LOCK_MS = 15 * 60 * 1000;

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });

async function sha256(text) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

const kidHash = (name, pw) => sha256(`lego-lab:kid:${name}:${pw}`);

const validName = (n) => typeof n === "string" && n.trim().length >= 1 && n.trim().length <= 12;
const validPw = (p) => typeof p === "string" && p.length >= 1 && p.length <= 50;
const validLesson = (id) => Number.isInteger(id) && id >= 1 && id <= 999;

function rowToKid(r) {
  return { avatar: r.avatar, done: JSON.parse(r.done), checks: JSON.parse(r.checks) };
}

async function getKid(env, name) {
  const r = await env.DB.prepare("SELECT avatar, done, checks FROM kids WHERE name = ?").bind(name).first();
  return r ? rowToKid(r) : null;
}

// 檢查大人密碼，錯太多次會暫時鎖住，避免被一直猜
async function checkParent(env, request, pw) {
  const ip = request.headers.get("cf-connecting-ip") || "local";
  const now = Date.now();
  const row = await env.DB.prepare("SELECT fails, first_at FROM attempts WHERE ip = ?").bind(ip).first();
  const fresh = !row || now - row.first_at >= LOCK_MS;
  if (!fresh && row.fails >= MAX_FAILS) return json({ error: "locked" }, 429);
  if (validPw(pw) && (await sha256("lego-lab:parent:" + pw)) === env.PARENT_HASH) {
    if (row) await env.DB.prepare("DELETE FROM attempts WHERE ip = ?").bind(ip).run();
    return null;
  }
  if (fresh) await env.DB.prepare("INSERT OR REPLACE INTO attempts (ip, fails, first_at) VALUES (?, 1, ?)").bind(ip, now).run();
  else await env.DB.prepare("UPDATE attempts SET fails = fails + 1 WHERE ip = ?").bind(ip).run();
  return json({ error: "parent" }, 403);
}

// 第一次在這台裝置使用：大人輸入密碼，換到一個記住這台裝置的 token
async function registerDevice(env, request, body) {
  const denied = await checkParent(env, request, body.parentPassword);
  if (denied) return denied;
  const token = crypto.randomUUID() + crypto.randomUUID();
  await env.DB.prepare("INSERT INTO devices (token, created_at) VALUES (?, ?)").bind(token, Date.now()).run();

  // 把這台裝置以前只存在瀏覽器裡的小孩帳號搬上來（同名的以雲端為準）
  const legacy = body.importKids && typeof body.importKids === "object" ? body.importKids : {};
  for (const [name, k] of Object.entries(legacy).slice(0, 20)) {
    if (!validName(name) || !k || typeof k.pwHash !== "string") continue;
    const done = Array.isArray(k.done) ? k.done.filter(validLesson) : [];
    await env.DB.prepare("INSERT OR IGNORE INTO kids (name, avatar, pw_hash, done, checks, created_at) VALUES (?, ?, ?, ?, '{}', ?)")
      .bind(name.trim(), AVATARS.includes(k.avatar) ? k.avatar : AVATARS[0], k.pwHash, JSON.stringify(done), Date.now())
      .run();
  }
  return json({ token });
}

export async function onRequest({ request, env, params }) {
  const parts = [].concat(params.path || []).map((p) => {
    try {
      return decodeURIComponent(p);
    } catch (e) {
      return p;
    }
  });
  const route = parts.join("/");
  const method = request.method;
  let body = {};
  if (method === "POST") {
    try {
      body = await request.json();
    } catch (e) {
      return json({ error: "bad-request" }, 400);
    }
  } else if (method !== "GET") {
    return json({ error: "method" }, 405);
  }

  try {
    if (route === "device" && method === "POST") return await registerDevice(env, request, body);

    // 其他 API 都要是已經設定過的裝置
    const token = (request.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
    const device = token && (await env.DB.prepare("SELECT 1 AS ok FROM devices WHERE token = ?").bind(token).first());
    if (!device) return json({ error: "device" }, 401);

    if (route === "kids" && method === "GET") {
      const { results } = await env.DB.prepare("SELECT name, avatar, done, checks FROM kids ORDER BY created_at").all();
      const kids = {};
      for (const r of results) kids[r.name] = rowToKid(r);
      return json({ kids });
    }

    if (route === "kids" && method === "POST") {
      const denied = await checkParent(env, request, body.parentPassword);
      if (denied) return denied;
      if (!validName(body.name) || !validPw(body.password)) return json({ error: "bad-request" }, 400);
      const name = body.name.trim();
      const avatar = AVATARS.includes(body.avatar) ? body.avatar : AVATARS[0];
      const res = await env.DB.prepare("INSERT OR IGNORE INTO kids (name, avatar, pw_hash, done, checks, created_at) VALUES (?, ?, ?, '[]', '{}', ?)")
        .bind(name, avatar, await kidHash(name, body.password), Date.now())
        .run();
      if (!res.meta.changes) return json({ error: "name-taken" }, 409);
      return json({ name, kid: await getKid(env, name) });
    }

    if (route === "kid-login" && method === "POST") {
      if (!validName(body.name) || !validPw(body.password)) return json({ error: "kid-password" }, 403);
      const r = await env.DB.prepare("SELECT pw_hash FROM kids WHERE name = ?").bind(body.name).first();
      if (!r || r.pw_hash !== (await kidHash(body.name, body.password))) return json({ error: "kid-password" }, 403);
      return json({ ok: true });
    }

    if (route === "parent-check" && method === "POST") {
      return (await checkParent(env, request, body.parentPassword)) || json({ ok: true });
    }

    if (route === "device-logout" && method === "POST") {
      const denied = await checkParent(env, request, body.parentPassword);
      if (denied) return denied;
      await env.DB.prepare("DELETE FROM devices WHERE token = ?").bind(token).run();
      return json({ ok: true });
    }

    // kids/<名字>/<動作>
    if (parts.length === 3 && parts[0] === "kids" && method === "POST") {
      const [, name, action] = parts;
      if (!(await getKid(env, name))) return json({ error: "no-kid" }, 404);

      if (action === "checks") {
        const checks = Array.isArray(body.checks) ? body.checks.slice(0, 30).map(Boolean) : null;
        if (!validLesson(body.lessonId) || !checks) return json({ error: "bad-request" }, 400);
        await env.DB.prepare(`UPDATE kids SET checks = json_set(checks, '$."' || ?1 || '"', json(?2)) WHERE name = ?3`)
          .bind(String(body.lessonId), JSON.stringify(checks), name)
          .run();
        return json({ kid: await getKid(env, name) });
      }

      // 下面這些都要大人密碼
      const denied = await checkParent(env, request, body.parentPassword);
      if (denied) return denied;

      if (action === "complete") {
        if (!validLesson(body.lessonId)) return json({ error: "bad-request" }, 400);
        await env.DB.prepare(
          `UPDATE kids SET
             done = CASE WHEN EXISTS (SELECT 1 FROM json_each(kids.done) WHERE value = CAST(?1 AS INTEGER)) THEN done ELSE json_insert(done, '$[#]', CAST(?1 AS INTEGER)) END,
             checks = json_remove(checks, '$."' || ?1 || '"')
           WHERE name = ?2`
        )
          // 課程編號用字串傳，避免 D1 把數字存成 1.0
          .bind(String(body.lessonId), name)
          .run();
        return json({ kid: await getKid(env, name) });
      }
      if (action === "reset") {
        await env.DB.prepare("UPDATE kids SET done = '[]', checks = '{}' WHERE name = ?").bind(name).run();
        return json({ kid: await getKid(env, name) });
      }
      if (action === "delete") {
        await env.DB.prepare("DELETE FROM kids WHERE name = ?").bind(name).run();
        return json({ ok: true });
      }
    }

    return json({ error: "not-found" }, 404);
  } catch (e) {
    return json({ error: "server", message: String(e.message || e) }, 500);
  }
}
