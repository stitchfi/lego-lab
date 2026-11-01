// 帳號和進度都存在這台裝置瀏覽器的 localStorage，換裝置或清除瀏覽資料就會重來。
// 這是靜態網站，密碼只是防止小孩自己按完成，不是真正的資安保護。
const STORE_KEY = "lego-lab-v2";
const SESSION_KEY = "lego-lab-session";
const ADMIN = "__admin__";
// 大人密碼的 SHA-256（"lego-lab:parent:" + 密碼）。要換密碼就重算這個值。
const PARENT_HASH = "c335c91384a8c00fc4a3042efdaf2a3ac6c79f503cc2a70d6ba0ed7ac488c185";
const AVATARS = ["🦁", "🐼", "🦊", "🐯", "🐸", "🐰", "🐻", "🦄", "🐧", "🐶"];

function readJSON(key, fallback) {
  try {
    const v = JSON.parse(localStorage.getItem(key));
    return v ?? fallback;
  } catch (e) {
    return fallback;
  }
}

function writeJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {}
}

let db = readJSON(STORE_KEY, null);
if (!db || typeof db.kids !== "object") db = { kids: {} };
const saveDb = () => writeJSON(STORE_KEY, db);

let currentUser = readJSON(SESSION_KEY, null);
if (currentUser !== ADMIN && !db.kids[currentUser]) currentUser = null;

const isAdmin = () => currentUser === ADMIN;
const kid = () => (isAdmin() ? null : db.kids[currentUser]);

async function sha256(text) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

const checkParent = async (pw) => (await sha256("lego-lab:parent:" + pw)) === PARENT_HASH;
const kidHash = (name, pw) => sha256(`lego-lab:kid:${name}:${pw}`);

function login(user) {
  currentUser = user;
  writeJSON(SESSION_KEY, user);
}

function logout() {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch (e) {}
  location.href = "login.html";
}

function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

// ===== 計分 =====
function lessonsOf(stageId) {
  return LESSONS.filter((l) => l.stage === stageId);
}

function scoreOf(k) {
  if (!k) return 0;
  const bonus = STAGES.filter((s) => lessonsOf(s.id).every((l) => k.done.includes(l.id))).length * STAGE_BONUS;
  return k.done.length * POINTS_PER_LESSON + bonus;
}

const doneList = () => (kid() ? kid().done : []);
const isDone = (id) => doneList().includes(id);
const score = () => scoreOf(kid());
const stageComplete = (stageId) => lessonsOf(stageId).every((l) => isDone(l.id));
const maxScore = () => LESSONS.length * POINTS_PER_LESSON + STAGES.length * STAGE_BONUS;
const stageUnlocked = (stage) => isAdmin() || score() >= stage.unlockAt;
const stageById = (id) => STAGES.find((s) => s.id === id);

function stageBonusText(stage) {
  return `完成這階段全部 ${lessonsOf(stage.id).length} 堂課，每堂 +${POINTS_PER_LESSON} 分，全部完成再加 ${STAGE_BONUS} 分`;
}

// ===== 圖片 =====
function figure(key, cls = "") {
  const img = typeof IMAGES !== "undefined" && IMAGES[key];
  if (!img) return "";
  return `<figure class="photo ${cls}">
    <img src="${esc(img.src)}" alt="${esc(img.alt)}" loading="lazy">
    <figcaption>示意圖・${esc(img.alt)}｜<a href="${esc(img.page)}" target="_blank" rel="noopener">${esc(img.artist || "Wikimedia Commons")}</a>，${esc(img.license)}</figcaption>
  </figure>`;
}

function thumb(key) {
  const img = typeof IMAGES !== "undefined" && IMAGES[key];
  return img ? `<img class="thumb" src="${esc(img.src)}" alt="" loading="lazy">` : "";
}

// ===== 共用頁首 =====
function renderHeader(active) {
  const links = [
    ["index.html", "🏠 首頁", "home"],
    ["lessons.html", "🔬 實驗課", "lessons"],
    ["shop.html", "🛒 購物清單", "shop"],
    ["parents.html", "👨‍👩‍👧 大人專區", "parents"],
  ];
  const who = isAdmin()
    ? `<span class="score-pill admin">🛠 管理模式</span>`
    : `<span class="score-pill" id="score-pill">${esc(kid().avatar)} ${esc(currentUser)}・⭐ ${score()} 分</span>`;
  document.getElementById("top").innerHTML = `
    <div class="wrap">
      <a class="logo" href="index.html">🧱 樂高實驗室</a>
      <nav class="nav">${links
        .map(([href, text, key]) => `<a href="${href}" class="${key === active ? "on" : ""}">${text}</a>`)
        .join("")}</nav>
      ${who}
      <button class="logout" type="button" id="logout">登出</button>
    </div>`;
  document.getElementById("logout").onclick = logout;
}

function updateScorePill() {
  const el = document.getElementById("score-pill");
  if (el) el.textContent = `${kid().avatar} ${currentUser}・⭐ ${score()} 分`;
}

function toast(emoji, title, text) {
  let t = document.getElementById("toast");
  if (!t) {
    t = document.createElement("div");
    t.id = "toast";
    t.className = "toast";
    t.setAttribute("role", "alert");
    document.body.appendChild(t);
  }
  t.innerHTML = `<span class="emoji">${emoji}</span><b>${esc(title)}</b><p>${esc(text)}</p><button class="btn" type="button">好耶！</button>`;
  t.classList.add("show");
  t.querySelector("button").onclick = () => t.classList.remove("show");
}

// 大人密碼視窗：不用 prompt()，避免擋住頁面
function askParent(message) {
  return new Promise((resolve) => {
    const m = document.createElement("div");
    m.className = "modal";
    m.innerHTML = `<form class="modal-box">
        <span class="emoji">🔐</span>
        <b>請大人確認</b>
        <p>${esc(message)}</p>
        <input type="password" autocomplete="off" placeholder="大人密碼" aria-label="大人密碼">
        <p class="err" aria-live="polite"></p>
        <div class="row">
          <button class="btn" type="button" data-cancel>取消</button>
          <button class="btn primary" type="submit">確認</button>
        </div>
      </form>`;
    document.body.appendChild(m);
    const input = m.querySelector("input");
    input.focus();
    const close = (v) => {
      m.remove();
      resolve(v);
    };
    m.querySelector("[data-cancel]").onclick = () => close(false);
    m.querySelector("form").onsubmit = async (e) => {
      e.preventDefault();
      if (await checkParent(input.value)) close(true);
      else {
        m.querySelector(".err").textContent = "密碼不對，請再試一次。";
        input.value = "";
        input.focus();
      }
    };
  });
}

function speak(text) {
  if (!("speechSynthesis" in window)) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "zh-TW";
  u.rate = 0.9;
  speechSynthesis.speak(u);
}

function speakButton(text) {
  if (!("speechSynthesis" in window)) return "";
  return `<button class="speak" type="button" data-say="${esc(text)}">🔊 唸給我聽</button>`;
}

document.addEventListener("click", (e) => {
  const b = e.target.closest("[data-say]");
  if (b) speak(b.dataset.say);
});

// ===== 登入頁 =====
function renderLogin() {
  const names = Object.keys(db.kids);
  const app = document.getElementById("app");
  document.getElementById("top").innerHTML = `<div class="wrap"><span class="logo">🧱 樂高實驗室</span></div>`;
  app.innerHTML = `
    <section class="hero">
      <span class="big">🧱🤖</span>
      <h1>樂高實驗室</h1>
      <p class="lead">你是誰？點自己的名字登入。</p>
      ${figure("hero", "wide")}
    </section>
    ${
      names.length
        ? `<div class="grid kids">${names
            .map(
              (n) => `<button class="card kid-btn" type="button" data-kid="${esc(n)}">
                <span class="emoji">${esc(db.kids[n].avatar)}</span>${esc(n)}
                <small>⭐ ${scoreOf(db.kids[n])} 分</small></button>`
            )
            .join("")}</div>`
        : `<div class="lock-box"><span class="emoji">👋</span>還沒有小孩帳號，請大人在下面建立一個。</div>`
    }

    <form class="card login-form" id="kid-login" hidden>
      <h3 id="kid-login-title"></h3>
      <input type="password" id="kid-pw" placeholder="我的密碼" autocomplete="off" aria-label="我的密碼">
      <p class="err" id="kid-err" aria-live="polite"></p>
      <button class="btn primary" type="submit">登入</button>
    </form>

    <details class="card fold" ${names.length ? "" : "open"}>
      <summary>➕ 新增小孩帳號（大人操作）</summary>
      <form id="new-kid" class="login-form">
        <label>小孩的名字<input id="nk-name" maxlength="12" required autocomplete="off"></label>
        <span class="label">選一個頭像</span>
        <div class="avatars">${AVATARS.map(
          (a, i) => `<label><input type="radio" name="avatar" value="${a}" ${i === 0 ? "checked" : ""}><span>${a}</span></label>`
        ).join("")}</div>
        <label>小孩的密碼（小孩登入用）<input id="nk-pw" type="password" required autocomplete="new-password"></label>
        <label>大人密碼<input id="nk-parent" type="password" required autocomplete="off"></label>
        <p class="err" id="nk-err" aria-live="polite"></p>
        <button class="btn primary" type="submit">建立帳號</button>
      </form>
    </details>

    <details class="card fold">
      <summary>🛠 大人管理模式（可以看全部的課）</summary>
      <form id="admin-login" class="login-form">
        <label>大人密碼<input id="ad-pw" type="password" required autocomplete="off"></label>
        <p class="err" id="ad-err" aria-live="polite"></p>
        <button class="btn primary" type="submit">進入管理模式</button>
      </form>
    </details>`;

  let picked = null;
  const kidForm = document.getElementById("kid-login");
  app.querySelectorAll("[data-kid]").forEach((b) =>
    b.addEventListener("click", () => {
      picked = b.dataset.kid;
      app.querySelectorAll("[data-kid]").forEach((x) => x.classList.toggle("picked", x === b));
      document.getElementById("kid-login-title").textContent = `${db.kids[picked].avatar} ${picked}，請輸入你的密碼`;
      document.getElementById("kid-err").textContent = "";
      kidForm.hidden = false;
      document.getElementById("kid-pw").focus();
    })
  );

  kidForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const pw = document.getElementById("kid-pw");
    if ((await kidHash(picked, pw.value)) === db.kids[picked].pwHash) {
      login(picked);
      location.href = "index.html";
    } else {
      document.getElementById("kid-err").textContent = "密碼不對，再試一次！";
      pw.value = "";
    }
  });

  document.getElementById("new-kid").addEventListener("submit", async (e) => {
    e.preventDefault();
    const err = document.getElementById("nk-err");
    const name = document.getElementById("nk-name").value.trim();
    const pw = document.getElementById("nk-pw").value;
    if (!name) return (err.textContent = "請輸入名字。");
    if (db.kids[name]) return (err.textContent = "這個名字已經有人用了。");
    if (!(await checkParent(document.getElementById("nk-parent").value))) return (err.textContent = "大人密碼不對。");
    const avatar = app.querySelector('input[name="avatar"]:checked').value;
    db.kids[name] = { avatar, pwHash: await kidHash(name, pw), done: [], checks: {} };
    saveDb();
    login(name);
    location.href = "index.html";
  });

  document.getElementById("admin-login").addEventListener("submit", async (e) => {
    e.preventDefault();
    if (await checkParent(document.getElementById("ad-pw").value)) {
      login(ADMIN);
      location.href = "lessons.html";
    } else {
      document.getElementById("ad-err").textContent = "大人密碼不對。";
    }
  });
}

// ===== 首頁 =====
function renderHome() {
  const s = score();
  const pct = Math.round((s / maxScore()) * 100);
  const next = STAGES.find((st) => !stageUnlocked(st));
  const nextLesson = LESSONS.find((l) => !isDone(l.id) && stageUnlocked(stageById(l.stage)));
  document.getElementById("app").innerHTML = `
    <section class="hero">
      <h1>${isAdmin() ? "🛠 管理模式" : `${esc(kid().avatar)} 歡迎回來，${esc(currentUser)}！`}</h1>
      <p class="lead">${
        isAdmin() ? "所有階段和課程都已打開，可以瀏覽全部內容。管理模式不計分。" : "一起動手做實驗，收集分數，解鎖新的樂高零件和課程。"
      }</p>
      ${figure("hero", "wide")}
    </section>
    ${
      isAdmin()
        ? ""
        : `<div class="card">
      <h3>⭐ 我的分數：${s} / ${maxScore()} 分</h3>
      <div class="progress"><div id="bar"></div></div>
      <p>${next ? `再拿 <b>${next.unlockAt - s}</b> 分，就能解鎖「${esc(next.short)}」！` : "🎉 全部階段都解鎖了！"}
         已完成 ${doneList().length} / ${LESSONS.length} 堂課。</p>
      ${nextLesson ? `<p>👉 下一堂：<a href="lesson.html?id=${nextLesson.id}">第 ${nextLesson.id} 課 ${nextLesson.emoji} ${esc(nextLesson.title)}</a></p>` : ""}
    </div>`
    }
    <h2>要去哪裡？</h2>
    <div class="grid">
      <a class="card big-btn" href="lessons.html"><span class="emoji">🔬</span>親子實驗課<small>每週一個主題，做完拿分數</small></a>
      <a class="card big-btn" href="shop.html"><span class="emoji">🛒</span>分階段購物清單<small>分數夠了才會解鎖下一階段</small></a>
      <a class="card big-btn" href="parents.html"><span class="emoji">👨‍👩‍👧</span>大人專區<small>怎麼陪孩子玩、計分規則</small></a>
    </div>
    <h2>三個階段</h2>
    <div class="grid">
      ${STAGES.map(
        (st) => `
        <div class="card stage-card">
          ${thumb(st.image)}
          <h3>${st.emoji} ${esc(st.name)}</h3>
          <p>${esc(st.goal)}</p>
          <p><b>${isAdmin() ? "🔓 管理模式" : stageUnlocked(st) ? (stageComplete(st.id) ? "✅ 已完成" : "🔓 已解鎖") : `🔒 需要 ${st.unlockAt} 分`}</b></p>
        </div>`
      ).join("")}
    </div>`;
  const bar = document.getElementById("bar");
  if (bar) requestAnimationFrame(() => (bar.style.width = pct + "%"));
}

// ===== 購物清單 =====
function searchLinks(q) {
  if (!q) return "";
  const k = encodeURIComponent(q);
  return `<div class="links">
    <a href="https://www.momoshop.com.tw/search/searchShop.jsp?keyword=${k}" target="_blank" rel="noopener">momo 搜尋</a>
    <a href="https://24h.pchome.com.tw/search/?q=${k}" target="_blank" rel="noopener">PChome 搜尋</a>
    <a href="https://shopee.tw/search?keyword=${k}" target="_blank" rel="noopener">蝦皮搜尋</a>
  </div>`;
}

function renderShop() {
  const s = score();
  document.getElementById("app").innerHTML = `
    <h1>🛒 分階段購物清單</h1>
    <p class="lead">先買第一階段就好！完成實驗課拿到分數，下一階段的清單才會解鎖。
      清單只列型號不列價格，請用型號在各通路比價，並認明正版 LEGO。</p>
    ${SHOP.map((block) => {
      const st = stageById(block.stage);
      const open = stageUnlocked(st);
      return `
      <section class="stage ${open ? "" : "locked"}">
        <div class="stage-head c-${st.color}">
          <span class="name">${st.emoji} ${esc(st.name)}</span>
          <span class="tag">${isAdmin() ? "🛠 管理模式" : open ? "🔓 已解鎖" : `🔒 需要 ${st.unlockAt} 分`}</span>
        </div>
        <p class="stage-goal">${esc(st.goal)}</p>
        ${
          open
            ? `${figure(st.image)}
               ${block.note ? `<div class="note">💡 ${esc(block.note)}</div>` : ""}
               ${block.items
                 .map(
                   (it) => `
                 <div class="card item">
                   <h3>${esc(it.name)}${it.code ? `<span class="code">${esc(it.code)}</span>` : ""}</h3>
                   <p>${esc(it.why)}</p>
                   <p class="where">📍 哪裡買：${esc(it.where)}</p>
                   ${searchLinks(it.search)}
                 </div>`
                 )
                 .join("")}`
            : `<div class="lock-box"><span class="emoji">🔒</span>
                 還差 ${st.unlockAt - s} 分才能看到這階段的清單！<br>
                 <a href="lessons.html">去做實驗課賺分數 →</a></div>`
        }
      </section>`;
    }).join("")}`;
}

// ===== 課程列表 =====
function renderLessons() {
  document.getElementById("app").innerHTML = `
    <h1>🔬 親子實驗課</h1>
    <p class="lead">${
      isAdmin()
        ? "🛠 管理模式：全部課程都已打開，可以直接點進去看內容。"
        : `每週做一堂。每堂課完成 +${POINTS_PER_LESSON} 分，整個階段做完再送 ${STAGE_BONUS} 分！`
    }</p>
    ${STAGES.map((st) => {
      const open = stageUnlocked(st);
      const ls = lessonsOf(st.id);
      const n = ls.filter((l) => isDone(l.id)).length;
      return `
      <section class="stage ${open ? "" : "locked"}">
        <div class="stage-head c-${st.color}">
          <span class="name">${st.emoji} ${esc(st.name)}</span>
          <span class="tag">${isAdmin() ? `解鎖條件：${st.unlockAt} 分` : open ? `${n} / ${ls.length} 完成` : `🔒 需要 ${st.unlockAt} 分`}</span>
        </div>
        <p class="stage-goal">${esc(st.goal)}<br><small>${esc(stageBonusText(st))}</small></p>
        <div class="grid">
          ${ls
            .map((l) => {
              const done = isDone(l.id);
              const inner = `<span class="emoji">${l.emoji}</span>
                <span><b>第 ${l.id} 課・${esc(l.title)}</b><br><span class="meta">⏱ ${esc(l.time)}</span></span>
                <span class="badge">${done ? "✅ 完成" : isAdmin() ? "👀 瀏覽" : open ? `+${POINTS_PER_LESSON}` : "🔒"}</span>`;
              return open
                ? `<a class="card lesson-card ${done ? "done" : ""}" href="lesson.html?id=${l.id}">${inner}</a>`
                : `<div class="card lesson-card locked" aria-disabled="true">${inner}</div>`;
            })
            .join("")}
        </div>
      </section>`;
    }).join("")}`;
}

// ===== 單堂課 =====
function renderLesson() {
  const id = Number(new URLSearchParams(location.search).get("id"));
  const l = LESSONS.find((x) => x.id === id);
  const app = document.getElementById("app");
  if (!l) {
    app.innerHTML = `<div class="lock-box"><span class="emoji">🤔</span>找不到這堂課。<br><a href="lessons.html">回到實驗課列表</a></div>`;
    return;
  }
  document.title = `第 ${l.id} 課 ${l.title}｜樂高實驗室`;
  const st = stageById(l.stage);
  if (!stageUnlocked(st)) {
    app.innerHTML = `<div class="lock-box"><span class="emoji">🔒</span>
      這堂課在「${esc(st.short)}」，需要 ${st.unlockAt} 分才能打開（現在 ${score()} 分）。<br>
      <a href="lessons.html">回到實驗課列表</a></div>`;
    return;
  }
  const k = kid();
  const checks = (k && k.checks[l.id]) || [];
  const done = isDone(l.id);
  const prev = LESSONS.find((x) => x.id === l.id - 1);
  const next = LESSONS.find((x) => x.id === l.id + 1);
  app.innerHTML = `
    <p><a href="lessons.html">← 回到實驗課列表</a></p>
    ${isAdmin() ? `<div class="note">🛠 管理模式：可以瀏覽內容，但不會計分。這堂課的編號是「第 ${l.id} 課」，要修改內容時可以用這個編號溝通。</div>` : ""}
    <div class="lesson-top">
      <span class="emoji">${l.emoji}</span>
      <div>
        <span class="stage-head c-${st.color}" style="display:inline-flex;padding:2px 12px;font-size:15px">${st.emoji} ${esc(st.short)}</span>
        <h1>第 ${l.id} 課・${esc(l.title)}</h1>
        <span class="meta">⏱ ${esc(l.time)}</span>
      </div>
    </div>
    ${figure(l.image)}
    <div class="question">❓ ${esc(l.question)} ${speakButton(l.question)}</div>

    <section class="section">
      <h2><span class="n">1</span>需要的材料</h2>
      <div class="card"><ul class="materials">${l.materials.map((m) => `<li>${esc(m)}</li>`).join("")}</ul></div>
    </section>

    <section class="section">
      <h2><span class="n">2</span>製作流程 ${speakButton(l.steps.map((s, i) => `第${i + 1}步，${s}`).join("。"))}</h2>
      <p class="hint" style="text-align:left">做完一步，就打勾一步 ✔️</p>
      <ol class="steps">
        ${l.steps
          .map(
            (s, i) => `<li><label>
              <input type="checkbox" data-step="${i}" ${checks[i] || done ? "checked" : ""}>
              <span class="num">${i + 1}</span><span>${esc(s)}</span>
            </label></li>`
          )
          .join("")}
      </ol>
    </section>

    <section class="section">
      <h2><span class="n">3</span>完成的效果 ${speakButton(l.result)}</h2>
      <div class="card result">🎯 ${esc(l.result)}</div>
    </section>

    <section class="section">
      <h2><span class="n">💡</span>今天的小發現</h2>
      <div class="card discovery">${esc(l.discovery)}</div>
    </section>

    ${
      isAdmin()
        ? ""
        : `<button class="done-btn" id="done-btn" type="button"></button>
           <p class="hint" id="done-hint"></p>`
    }

    <div class="pager">
      ${prev ? `<a href="lesson.html?id=${prev.id}">← 第 ${prev.id} 課</a>` : "<span></span>"}
      ${next ? `<a href="lesson.html?id=${next.id}">第 ${next.id} 課 →</a>` : "<span></span>"}
    </div>`;

  if (isAdmin()) return;

  const btn = document.getElementById("done-btn");
  const hint = document.getElementById("done-hint");
  const boxes = [...app.querySelectorAll("[data-step]")];

  function refresh() {
    const finished = isDone(l.id);
    const all = boxes.every((b) => b.checked);
    btn.disabled = !finished && !all;
    btn.classList.toggle("finished", finished);
    btn.textContent = finished ? "✅ 這堂課完成了！" : `🎉 我完成了！請大人確認 +${POINTS_PER_LESSON} 分`;
    hint.textContent = finished ? "" : all ? "太棒了！請大人來看看你的作品，再輸入大人密碼。" : `還有 ${boxes.filter((b) => !b.checked).length} 個步驟還沒打勾`;
  }

  boxes.forEach((b) =>
    b.addEventListener("change", () => {
      if (isDone(l.id)) {
        b.checked = true;
        return;
      }
      k.checks[l.id] = boxes.map((x) => x.checked);
      saveDb();
      refresh();
    })
  );

  btn.addEventListener("click", async () => {
    if (isDone(l.id) || !boxes.every((b) => b.checked)) return;
    const ok = await askParent(`${currentUser} 完成了「第 ${l.id} 課・${l.title}」，請大人看過作品後輸入密碼。`);
    if (!ok) return;
    const before = STAGES.filter(stageUnlocked).map((s) => s.id);
    k.done.push(l.id);
    delete k.checks[l.id];
    saveDb();
    updateScorePill();
    refresh();
    const newly = STAGES.filter((s) => stageUnlocked(s) && !before.includes(s.id));
    if (newly.length) {
      toast("🔓", `解鎖「${newly[0].short}」！`, `你完成了整個階段，多拿 ${STAGE_BONUS} 分！現在 ${score()} 分，新的購物清單和實驗課都打開了。`);
    } else if (stageComplete(l.stage)) {
      toast("🏆", "階段完成！", `你完成了「${st.short}」全部的課，多拿 ${STAGE_BONUS} 分！現在 ${score()} 分。`);
    } else {
      toast("⭐", `+${POINTS_PER_LESSON} 分！`, `你完成了「${l.title}」，現在 ${score()} 分。`);
    }
  });

  refresh();
}

// ===== 大人專區 =====
function renderParents() {
  const kids = Object.keys(db.kids);
  const credits = typeof IMAGES !== "undefined" ? Object.values(IMAGES) : [];
  document.getElementById("app").innerHTML = `
    <h1>👨‍👩‍👧 大人專區</h1>
    <p class="lead">這個網站是給 6–7 歲的孩子和大人一起使用的樂高動手做教學網站。</p>

    ${
      isAdmin()
        ? `<h2>小孩帳號</h2>
      <div class="card">
        ${
          kids.length
            ? `<table class="kids-table"><tr><th>小孩</th><th>分數</th><th>完成課數</th><th></th></tr>
            ${kids
              .map(
                (n) => `<tr><td>${esc(db.kids[n].avatar)} ${esc(n)}</td><td>${scoreOf(db.kids[n])}</td><td>${db.kids[n].done.length} / ${LESSONS.length}</td>
                <td><button class="btn small" data-reset="${esc(n)}" type="button">重設進度</button>
                    <button class="btn small danger" data-del="${esc(n)}" type="button">刪除帳號</button></td></tr>`
              )
              .join("")}</table>`
            : "<p>還沒有小孩帳號。登出後在登入頁可以新增。</p>"
        }
      </div>`
        : ""
    }

    <h2>帳號和計分規則</h2>
    <div class="card">
      <ul>
        <li>每個小孩用自己的名字和密碼登入，分數各自累積。新增小孩帳號需要大人密碼。</li>
        <li>每堂實驗課要把<b>製作流程全部打勾</b>，再由<b>大人輸入密碼確認</b>，才會得到 ${POINTS_PER_LESSON} 分。</li>
        <li>一個階段的課全部完成，再加 ${STAGE_BONUS} 分。</li>
        ${STAGES.filter((s) => s.unlockAt > 0)
          .map((s) => `<li>${s.unlockAt} 分解鎖「${esc(s.name)}」的購物清單和實驗課。</li>`)
          .join("")}
        <li>全部完成共 ${maxScore()} 分。</li>
        <li>大人在登入頁選「大人管理模式」，可以瀏覽全部課程（不計分），也能重設或刪除小孩帳號。</li>
      </ul>
      <p>帳號和進度只存在<b>這台裝置的這個瀏覽器</b>裡。換裝置、用無痕模式或清除瀏覽資料，就要重新建立。</p>
    </div>

    <h2>陪孩子做實驗的小提醒</h2>
    <div class="card">
      <ul>
        <li><b>先問再講：</b>讓孩子先猜，做完再一起對答案。猜錯也沒關係。</li>
        <li><b>大人陪組：</b>一開始大人看說明書，孩子找零件和組裝，熟了再慢慢放手。</li>
        <li><b>確認時看作品：</b>輸入大人密碼前，請孩子介紹作品和今天的小發現。</li>
        <li><b>時間到就停：</b>孩子累了就收，留一點期待到下次。</li>
        <li><b>安全：</b>電池由大人安裝；馬達轉動時，手指和頭髮遠離齒輪；家裡有更小的孩子時，小零件要收好。</li>
        <li><b>唸給我聽：</b>課程頁有 🔊 按鈕，可以用瀏覽器的語音把題目和步驟唸出來。</li>
      </ul>
    </div>

    <h2>購物提醒</h2>
    <div class="card">
      <ul>
        <li>清單只列型號，不列價格。台灣各通路價格常變動，請用型號搜尋比價。</li>
        <li>價格便宜得不合理、包裝上沒有 LEGO 商標的，大多是副廠或仿品。</li>
        <li>SPIKE Essential 要找樂高教育的台灣授權經銷商。</li>
      </ul>
    </div>

    ${
      credits.length
        ? `<h2>圖片來源</h2>
    <div class="card credits">
      <p>網站上的照片都是示意圖，來自 Wikimedia Commons 的自由授權圖片，不一定是課程裡用到的同一款零件或套組。</p>
      <ul>${credits
        .map(
          (c) =>
            `<li>${esc(c.alt)}：<a href="${esc(c.page)}" target="_blank" rel="noopener">${esc(c.artist || "Wikimedia Commons")}</a>，${
              c.licenseUrl ? `<a href="${esc(c.licenseUrl)}" target="_blank" rel="noopener">${esc(c.license)}</a>` : esc(c.license)
            }</li>`
        )
        .join("")}</ul>
    </div>`
        : ""
    }`;

  document.querySelectorAll("[data-reset]").forEach((b) =>
    b.addEventListener("click", async () => {
      const n = b.dataset.reset;
      if (!(await askParent(`確定要把 ${n} 的分數和完成紀錄清空嗎？這個動作不能復原。`))) return;
      db.kids[n].done = [];
      db.kids[n].checks = {};
      saveDb();
      renderParents();
      toast("🧹", "進度已清除", `${n} 可以從第一階段重新開始。`);
    })
  );
  document.querySelectorAll("[data-del]").forEach((b) =>
    b.addEventListener("click", async () => {
      const n = b.dataset.del;
      if (!(await askParent(`確定要刪除 ${n} 的帳號嗎？分數也會一起刪掉，不能復原。`))) return;
      delete db.kids[n];
      saveDb();
      renderParents();
      toast("🗑️", "帳號已刪除", `${n} 的帳號已經刪除。`);
    })
  );
}

const PAGES = { home: renderHome, shop: renderShop, lessons: renderLessons, lesson: renderLesson, parents: renderParents };

document.addEventListener("DOMContentLoaded", () => {
  const page = document.body.dataset.page;
  if (page === "login") {
    if (currentUser) location.replace("index.html");
    else renderLogin();
    return;
  }
  if (!currentUser) {
    location.replace("login.html");
    return;
  }
  renderHeader(page === "lesson" ? "lessons" : page);
  PAGES[page]();
});
