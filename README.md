# 🧱 樂高實驗室

給 6–7 歲孩子的樂高動手做教學網站，大人和孩子一起使用。

- **小孩帳號**：每個小孩用自己的名字和密碼登入，分數各自累積；新增帳號需要大人密碼
- **分階段購物清單**：三個階段，用實驗課的分數解鎖下一階段（只列型號，請在台灣各通路用型號比價）
- **親子實驗課**：20 堂課，每堂列出需要的材料、製作流程和完成的效果；步驟全部打勾、再由大人輸入密碼確認，才會得分
- **大人管理模式**：在登入頁輸入大人密碼，可以瀏覽全部課程（不計分），也能重設或刪除小孩帳號

- **跨裝置同步**：網站和資料庫都在 Cloudflare（Pages + D1）。每台平板第一次打開時，大人輸入一次大人密碼，之後小孩的帳號和分數在每台裝置同步

大人密碼只在 Cloudflare 伺服器檢查，雜湊值存在 Cloudflare 的祕密變數 `PARENT_HASH`，不在這個公開的 repo 裡；同一個 IP 錯 10 次會鎖 15 分鐘。

## 修改內容

- 課程和購物清單：`data.js`
- 圖片和來源：`images.js`、`images/`
- 後端 API：`functions/api/[[path]].js`；資料表：`migrations/`
- 換大人密碼：重算 `"lego-lab:parent:" + 新密碼` 的 SHA-256，用 `npx wrangler pages secret put PARENT_HASH` 更新

## 部署到 Cloudflare

```bash
node build.mjs
npx wrangler pages deploy
```

第一次部署前要先 `npx wrangler login`、建立 D1 資料庫並套用 `migrations/`。本機測試：在 `.dev.vars` 放 `PARENT_HASH=...`，再執行 `npx wrangler d1 migrations apply lego-lab --local` 和 `npx wrangler pages dev`。

## 圖片來源

照片都是來自 Wikimedia Commons 的自由授權圖片，作者和授權列在 `images.js`，網站的圖說和「大人專區」也有標示。

LEGO® 是樂高集團的商標，本站為個人製作的教學網站，與樂高集團無關。
