// 進度存在瀏覽器的 localStorage，換裝置或清除瀏覽資料就會重來。
const STORE_KEY = "lego-lab-progress-v1";

function loadState() {
  try {
    const s = JSON.parse(localStorage.getItem(STORE_KEY));
    if (s && Array.isArray(s.done)) return { done: s.done, checks: s.checks || {} };
  } catch (e) {}
  return { done: [], checks: {} };
}

function saveState(state) {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(state));
  } catch (e) {}
}

let state = loadState();

function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function lessonsOf(stageId) {
  return LESSONS.filter((l) => l.stage === stageId);
}

function stageComplete(stageId) {
  return lessonsOf(stageId).every((l) => state.done.includes(l.id));
}

function score() {
  const bonus = STAGES.filter((s) => stageComplete(s.id)).length * STAGE_BONUS;
  return state.done.length * POINTS_PER_LESSON + bonus;
}

function maxScore() {
  return LESSONS.length * POINTS_PER_LESSON + STAGES.length * STAGE_BONUS;
}

function stageUnlocked(stage) {
  return score() >= stage.unlockAt;
}

function stageById(id) {
  return STAGES.find((s) => s.id === id);
}

function stageBonusText(stage) {
  return `完成這階段全部 ${lessonsOf(stage.id).length} 堂課，每堂 +${POINTS_PER_LESSON} 分，全部完成再加 ${STAGE_BONUS} 分`;
}

// ===== 共用頁首 =====
function renderHeader(active) {
  const links = [
    ["index.html", "🏠 首頁", "home"],
    ["lessons.html", "🔬 實驗課", "lessons"],
    ["shop.html", "🛒 購物清單", "shop"],
    ["parents.html", "👨‍👩‍👧 大人專區", "parents"],
  ];
  document.getElementById("top").innerHTML = `
    <div class="wrap">
      <a class="logo" href="index.html">🧱 樂高實驗室</a>
      <nav class="nav">${links
        .map(([href, text, key]) => `<a href="${href}" class="${key === active ? "on" : ""}">${text}</a>`)
        .join("")}</nav>
      <span class="score-pill" id="score-pill">⭐ ${score()} 分</span>
    </div>`;
}

function updateScorePill() {
  const el = document.getElementById("score-pill");
  if (el) el.textContent = `⭐ ${score()} 分`;
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

// ===== 首頁 =====
function renderHome() {
  const s = score();
  const pct = Math.round((s / maxScore()) * 100);
  const next = STAGES.find((st) => !stageUnlocked(st));
  const nextLesson = LESSONS.find((l) => !state.done.includes(l.id) && stageUnlocked(stageById(l.stage)));
  document.getElementById("app").innerHTML = `
    <section class="hero">
      <span class="big">🧱🤖</span>
      <h1>歡迎來到樂高實驗室！</h1>
      <p class="lead">一起動手做實驗，收集分數，解鎖新的樂高零件和課程。</p>
    </section>
    <div class="card">
      <h3>⭐ 我的分數：${s} / ${maxScore()} 分</h3>
      <div class="progress"><div id="bar"></div></div>
      <p>${next ? `再拿 <b>${next.unlockAt - s}</b> 分，就能解鎖「${esc(next.short)}」！` : "🎉 全部階段都解鎖了！"}
         已完成 ${state.done.length} / ${LESSONS.length} 堂課。</p>
      ${nextLesson ? `<p>👉 下一堂：<a href="lesson.html?id=${nextLesson.id}">第 ${nextLesson.id} 課 ${nextLesson.emoji} ${esc(nextLesson.title)}</a></p>` : ""}
    </div>
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
        <div class="card">
          <h3>${st.emoji} ${esc(st.name)}</h3>
          <p>${esc(st.goal)}</p>
          <p><b>${stageUnlocked(st) ? (stageComplete(st.id) ? "✅ 已完成" : "🔓 已解鎖") : `🔒 需要 ${st.unlockAt} 分`}</b></p>
        </div>`
      ).join("")}
    </div>`;
  requestAnimationFrame(() => (document.getElementById("bar").style.width = pct + "%"));
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
          <span class="tag">${open ? "🔓 已解鎖" : `🔒 需要 ${st.unlockAt} 分`}</span>
        </div>
        <p class="stage-goal">${esc(st.goal)}</p>
        ${
          open
            ? `${block.note ? `<div class="note">💡 ${esc(block.note)}</div>` : ""}
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
    <p class="lead">每週做一堂。每堂課完成 +${POINTS_PER_LESSON} 分，整個階段做完再送 ${STAGE_BONUS} 分！</p>
    ${STAGES.map((st) => {
      const open = stageUnlocked(st);
      const ls = lessonsOf(st.id);
      const n = ls.filter((l) => state.done.includes(l.id)).length;
      return `
      <section class="stage ${open ? "" : "locked"}">
        <div class="stage-head c-${st.color}">
          <span class="name">${st.emoji} ${esc(st.name)}</span>
          <span class="tag">${open ? `${n} / ${ls.length} 完成` : `🔒 需要 ${st.unlockAt} 分`}</span>
        </div>
        <p class="stage-goal">${esc(st.goal)}<br><small>${esc(stageBonusText(st))}</small></p>
        <div class="grid">
          ${ls
            .map((l) => {
              const done = state.done.includes(l.id);
              const inner = `<span class="emoji">${l.emoji}</span>
                <span><b>第 ${l.id} 課・${esc(l.title)}</b><br><span class="meta">⏱ ${esc(l.time)}</span></span>
                <span class="badge">${done ? "✅ 完成" : open ? `+${POINTS_PER_LESSON}` : "🔒"}</span>`;
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
  const checks = state.checks[l.id] || [];
  const done = state.done.includes(l.id);
  const prev = LESSONS.find((x) => x.id === l.id - 1);
  const next = LESSONS.find((x) => x.id === l.id + 1);
  app.innerHTML = `
    <p><a href="lessons.html">← 回到實驗課列表</a></p>
    <div class="lesson-top">
      <span class="emoji">${l.emoji}</span>
      <div>
        <span class="stage-head c-${st.color}" style="display:inline-flex;padding:2px 12px;font-size:15px">${st.emoji} ${esc(st.short)}</span>
        <h1>第 ${l.id} 課・${esc(l.title)}</h1>
        <span class="meta">⏱ ${esc(l.time)}</span>
      </div>
    </div>
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

    <button class="done-btn" id="done-btn" type="button"></button>
    <p class="hint" id="done-hint"></p>

    <div class="pager">
      ${prev ? `<a href="lesson.html?id=${prev.id}">← 第 ${prev.id} 課</a>` : "<span></span>"}
      ${next ? `<a href="lesson.html?id=${next.id}">第 ${next.id} 課 →</a>` : "<span></span>"}
    </div>`;

  const btn = document.getElementById("done-btn");
  const hint = document.getElementById("done-hint");
  const boxes = [...app.querySelectorAll("[data-step]")];

  function refresh() {
    const isDone = state.done.includes(l.id);
    const all = boxes.every((b) => b.checked);
    btn.disabled = !isDone && !all;
    btn.classList.toggle("finished", isDone);
    btn.textContent = isDone ? "✅ 這堂課完成了！" : `🎉 我完成了！ +${POINTS_PER_LESSON} 分`;
    hint.textContent = isDone ? "" : all ? "太棒了，按上面的按鈕領分數！" : `還有 ${boxes.filter((b) => !b.checked).length} 個步驟還沒打勾`;
  }

  boxes.forEach((b) =>
    b.addEventListener("change", () => {
      if (state.done.includes(l.id)) {
        b.checked = true;
        return;
      }
      state.checks[l.id] = boxes.map((x) => x.checked);
      saveState(state);
      refresh();
    })
  );

  btn.addEventListener("click", () => {
    if (state.done.includes(l.id) || !boxes.every((b) => b.checked)) return;
    const before = STAGES.filter(stageUnlocked).map((s) => s.id);
    state.done.push(l.id);
    delete state.checks[l.id];
    saveState(state);
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
  document.getElementById("app").innerHTML = `
    <h1>👨‍👩‍👧 大人專區</h1>
    <p class="lead">這個網站是給 6–7 歲的孩子和大人一起使用的樂高動手做教學網站。</p>

    <h2>計分和解鎖規則</h2>
    <div class="card">
      <ul>
        <li>每堂實驗課要把<b>製作流程全部打勾</b>，才能按「我完成了」，得 ${POINTS_PER_LESSON} 分。</li>
        <li>一個階段的課全部完成，再加 ${STAGE_BONUS} 分。</li>
        ${STAGES.filter((s) => s.unlockAt > 0)
          .map((s) => `<li>${s.unlockAt} 分解鎖「${esc(s.name)}」的購物清單和實驗課。</li>`)
          .join("")}
        <li>全部完成共 ${maxScore()} 分。</li>
      </ul>
      <p>進度只存在<b>這台裝置的這個瀏覽器</b>裡。換裝置、用無痕模式或清除瀏覽資料，進度會重來。</p>
    </div>

    <h2>陪孩子做實驗的小提醒</h2>
    <div class="card">
      <ul>
        <li><b>先問再講：</b>讓孩子先猜，做完再一起對答案。猜錯也沒關係。</li>
        <li><b>大人陪組：</b>一開始大人看說明書，孩子找零件和組裝，熟了再慢慢放手。</li>
        <li><b>只記錄、不打分：</b>用星星、圖畫或照片記錄就好，重點是有趣。</li>
        <li><b>時間到就停：</b>孩子累了就收，留一點期待到下次。</li>
        <li><b>安全：</b>電池由大人安裝；馬達轉動時，手指和頭髮遠離齒輪；家裡有更小的孩子時，小零件要收好。</li>
        <li><b>唸給我聽：</b>課程頁有 🔊 按鈕，可以用瀏覽器的語音把題目和步驟唸出來，適合還在學認字的孩子。</li>
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

    <h2>重設進度</h2>
    <div class="card">
      <p>想讓另一個孩子從頭開始，或重新挑戰？</p>
      <button class="btn danger" id="reset" type="button">清除所有進度</button>
    </div>`;
  document.getElementById("reset").addEventListener("click", () => {
    if (!confirm("確定要清除所有分數和完成紀錄嗎？這個動作不能復原。")) return;
    state = { done: [], checks: {} };
    saveState(state);
    updateScorePill();
    toast("🧹", "進度已清除", "從第一階段重新開始吧！");
  });
}

const PAGES = { home: renderHome, shop: renderShop, lessons: renderLessons, lesson: renderLesson, parents: renderParents };

document.addEventListener("DOMContentLoaded", () => {
  const page = document.body.dataset.page;
  renderHeader(page === "lesson" ? "lessons" : page);
  PAGES[page]();
});
