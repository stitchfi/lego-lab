# ☁️ 設定跨裝置同步（Firebase）

設定好之後，每台平板只要大人登入一次「家庭帳號」，小孩的帳號和分數就會在每台裝置同步。
Firebase 的免費方案（Spark）就夠用，不需要綁信用卡。

## 1. 建立 Firebase 專案
1. 用你的 Google 帳號打開 <https://console.firebase.google.com>
2. 按「建立專案」，名稱例如 `lego-lab`
3. Google Analytics 可以關掉，然後按「建立專案」

## 2. 開啟 Email／密碼登入
1. 左邊選單「建構」→「Authentication」→「開始使用」
2. 「Sign-in method」分頁 →「電子郵件/密碼」→ 啟用 → 儲存

## 3. 建立家庭帳號
1. Authentication →「Users」分頁 →「新增使用者」
2. 輸入一個 Email 和密碼，這就是每台平板要登入一次的「家庭帳號」
   - 建議用全新的密碼，不要和其他網站相同
   - 家庭帳號密碼和確認任務用的大人密碼是兩組不同的密碼

## 4. 允許網站網域
1. Authentication →「Settings」分頁 →「已授權網域」
2. 按「新增網域」，輸入 `stitchfi.github.io`

## 5. 建立資料庫
1. 左邊選單「建構」→「Firestore Database」→「建立資料庫」
2. 位置選 `asia-east1 (台灣)`
3. 選「以正式版模式啟動」
4. 建好後到「規則」分頁，把內容整個換成這個 repo 裡 `firestore.rules` 的內容，按「發布」

## 6. 取得網頁設定
1. 左上角齒輪 →「專案設定」→「一般」
2. 拉到「你的應用程式」，按網頁圖示 `</>`
3. 應用程式暱稱填 `lego-lab`（不用勾 Firebase Hosting）→ 註冊
4. 畫面會出現一段 `const firebaseConfig = { ... }`，把它複製下來

把這段設定貼到 `firebase-config.js`，取代 `null`：

```js
const FIREBASE_CONFIG = {
  apiKey: "...",
  authDomain: "...",
  projectId: "...",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "...",
};
```

這段設定不是密碼，可以公開放在 GitHub；資料靠第 5 步的規則保護，只有登入家庭帳號的裝置能讀寫。

## 之後怎麼用
- 每台平板打開網站，第一次會看到「連上家庭帳號」，由大人登入一次
- 之後小孩一樣點自己的名字、輸入自己的密碼登入
- 原本存在某台裝置上的小孩帳號，會在那台裝置第一次登入家庭帳號時自動搬到雲端
