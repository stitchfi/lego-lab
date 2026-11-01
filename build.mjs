// 把網站檔案複製到 dist/，給 Cloudflare Pages 部署用（不會把 functions、migrations 等檔案放上網站）
import { cpSync, mkdirSync, readdirSync, rmSync } from "node:fs";

rmSync("dist", { recursive: true, force: true });
mkdirSync("dist");
const skip = new Set(["build.mjs"]);
for (const f of readdirSync(".")) {
  if (/\.(html|js|css)$/.test(f) && !skip.has(f)) cpSync(f, `dist/${f}`);
}
cpSync("images", "dist/images", { recursive: true });
console.log("dist/ 準備好了：", readdirSync("dist").join(", "));
