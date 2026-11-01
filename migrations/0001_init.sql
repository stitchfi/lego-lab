-- 小孩帳號：done 是完成的課程編號陣列，checks 是 {課程編號: [每一步有沒有打勾]}
CREATE TABLE kids (
  name TEXT PRIMARY KEY,
  avatar TEXT NOT NULL,
  pw_hash TEXT NOT NULL,
  done TEXT NOT NULL DEFAULT '[]',
  checks TEXT NOT NULL DEFAULT '{}',
  created_at INTEGER NOT NULL
);

-- 大人輸入過密碼、被記住的裝置
CREATE TABLE devices (
  token TEXT PRIMARY KEY,
  created_at INTEGER NOT NULL
);

-- 大人密碼錯誤次數（防止一直猜）
CREATE TABLE attempts (
  ip TEXT PRIMARY KEY,
  fails INTEGER NOT NULL,
  first_at INTEGER NOT NULL
);
