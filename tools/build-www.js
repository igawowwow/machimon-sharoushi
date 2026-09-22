"use strict";
/* ============================================================
   tools/build-www.js — Capacitor(iOSネイティブ)用の配布物を www/ へ組み立てる。
   ・Web版(Vercel)はリポジトリ直下をそのまま配信する。ここで触るのは www/ だけ。
   ・Service Worker: js/main.js は __srqNative(Capacitor上)なら登録しない。
     capacitor:// では hostname が localhost になり localhost ガードを素通りするため、
     ネイティブ除外の存在を下で検証する。sw.js は www/ に入れない。
   ・ライブアップデート(native-live-update.js)は社労士クエストの配信物を取りにいく
     仕組みなので、www/ の index.html から丸ごと外す(プラグインも同梱しない)。
   ・フォントは native-assets/ のローカル同梱に差し替える(オフラインでも書体を保つ)。
   ・依存ゼロ(Node標準のみ)。
   ============================================================ */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const OUT = path.join(ROOT, "www");
const DIRS = ["css", "js", "assets"];
const FILES = ["index.html", "manifest.json", "privacy.html", "support.html", "icon-192.png", "icon-512.png", "icon-180.png"];

function copyDir(src, dst) {
  fs.mkdirSync(dst, { recursive: true });
  for (const ent of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, ent.name), d = path.join(dst, ent.name);
    if (ent.isDirectory()) copyDir(s, d);
    else if (ent.isFile()) fs.copyFileSync(s, d);
  }
}

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
for (const d of DIRS) copyDir(path.join(ROOT, d), path.join(OUT, d));
for (const f of FILES) fs.copyFileSync(path.join(ROOT, f), path.join(OUT, f));
fs.rmSync(path.join(OUT, "js/native-live-update.js"), { force: true });

const mainSrc = fs.readFileSync(path.join(OUT, "js/main.js"), "utf8");
if (!/__srqNative\s*&&\s*"serviceWorker"\s*in\s*navigator/.test(mainSrc)) {
  throw new Error("js/main.js に SW 登録のネイティブ除外(!__srqNative)が無い。");
}

const NA = path.join(ROOT, "native-assets");
copyDir(path.join(NA, "fonts"), path.join(OUT, "fonts"));
fs.copyFileSync(path.join(NA, "fonts.css"), path.join(OUT, "fonts.css"));
for (const lic of fs.readdirSync(NA).filter(f => /^OFL-.*\.txt$/.test(f))) {
  fs.copyFileSync(path.join(NA, lic), path.join(OUT, lic));   /* OFL 1.1 は全文の同梱が条件 */
}

const idx = path.join(OUT, "index.html");
let h = fs.readFileSync(idx, "utf8");
h = h.replace(/[ \t]*<noscript>\s*<link[^>]*fonts\.googleapis\.com[^>]*>\s*<\/noscript>\n?/g, "");
h = h.replace(/[ \t]*<link[^>]*fonts\.(?:googleapis|gstatic)\.com[^>]*>\n?/g, "");
h = h.replace(/[ \t]*<script src="js\/native-live-update\.js"><\/script>\n?/g, "");
if (/fonts\.(googleapis|gstatic)\.com/.test(h)) throw new Error("index.html に Google Fonts への参照が残っている。");
if (/native-live-update/.test(h)) throw new Error("index.html にライブアップデートの読み込みが残っている。");
h = h.replace("<head>", '<head>\n<link rel="stylesheet" href="./fonts.css">');
fs.writeFileSync(idx, h);

const srcs = [...h.matchAll(/<script src="([^"]+)"/g)].map(m => m[1]);
const links = [...h.matchAll(/<link[^>]+href="([^"]+\.css)"/g)].map(m => m[1]);
const missing = [...srcs, ...links].filter(rel => !fs.existsSync(path.join(OUT, rel)));
if (missing.length) throw new Error("www/ に取りこぼしがある(起動時に白画面になる): " + missing.join(", "));
console.log("www/ を作成した: " + (srcs.length + links.length) + " 資産を検証済み");
