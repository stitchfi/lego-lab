// 雲端同步設定。填入 Firebase 專案的網頁應用程式設定後，帳號和分數就會在每台裝置同步。
// 這些值不是密碼，可以公開；資料靠 firestore.rules 保護，只有登入家庭帳號的裝置能讀寫。
// 保持 null 時，資料只存在這台裝置的瀏覽器裡。
const FIREBASE_CONFIG = null;
