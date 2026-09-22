"use strict";
/* ============================================================
   tools/make-appicon.js — iOS のアプリアイコンと起動画面を作る。
   ・AppIcon(1024x1024): assets/icon-maskable.svg から生成する。App Store の提出要件で
     アイコンはアルファチャンネル(透過)を持てず、sips で SVG を変換するとアルファが
     残るため、ここで RGB(アルファなし)の PNG を直接書き出す。
     元 SVG は viewBox 0 0 512 512 の <rect> のみのドット絵。512→1024 はちょうど 2 倍
     なので、矩形を整数倍で塗るだけで劣化なく拡大できる(再サンプルしない)。
   ・Splash(2732x2732): Capacitor 既定は真っ白で、アプリ本体の暗い背景との間に
     起動のたび白いちらつきが出る。アプリ背景と同じ #FFF6E5 の単色で置き換える
     (capacitor.config.json の ios.backgroundColor と同値)。
   ・依存ゼロ(Node標準の zlib のみ)・eval なし。
   使い方: node tools/make-appicon.js
   ============================================================ */
const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const ROOT = path.join(__dirname, "..");
const SRC = path.join(ROOT, "assets/icon-maskable.svg");
const OUT = path.join(ROOT, "ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png");
const SPLASH_DIR = path.join(ROOT, "ios/App/App/Assets.xcassets/Splash.imageset");
const SPLASH_FILES = ["splash-2732x2732.png", "splash-2732x2732-1.png", "splash-2732x2732-2.png"];
const SPLASH_SIZE = 2732;
const SPLASH_BG = "#FFF6E5";  /* capacitor.config.json の ios.backgroundColor と同値 */

const SIZE = 1024;          /* 出力の一辺 */
const VIEWBOX = 512;        /* SVG の viewBox 一辺 */
const SCALE = SIZE / VIEWBOX;

const svg = fs.readFileSync(SRC, "utf8");

/* viewBox が想定と違えば、黙って歪んだ絵を出さずに止める。 */
const vb = (svg.match(/viewBox="0 0 (\d+) (\d+)"/) || []);
if (Number(vb[1]) !== VIEWBOX || Number(vb[2]) !== VIEWBOX) {
  throw new Error("SVG の viewBox が 0 0 " + VIEWBOX + " " + VIEWBOX + " ではない: " + vb.slice(1).join("x"));
}

/* #rgb / #rrggbb を [r,g,b] にする。 */
function hex(c) {
  const s = String(c).trim().replace(/^#/, "");
  const t = s.length === 3 ? s.split("").map(ch => ch + ch).join("") : s;
  if (!/^[0-9a-fA-F]{6}$/.test(t)) throw new Error("対応していない色指定: " + c);
  return [parseInt(t.slice(0, 2), 16), parseInt(t.slice(2, 4), 16), parseInt(t.slice(4, 6), 16)];
}

/* 全 rect を出現順に取り出す(SVG は後勝ちで上書きされるため順序を保つ)。
   MACHIMON のアイコンは 背景 rect(1枚目) + <g transform="translate(tx,ty) scale(s)"> 内のドット rect。
   g 内の rect は変換を掛けて viewBox 座標へ戻す。背景の角丸(rx)は無視して全面を塗る
   (角の切り抜きは iOS が行う。App Store 用アイコンは四角・不透明が要件)。 */
const gm = svg.match(/<g\b[^>]*transform="translate\((-?[\d.]+),\s*(-?[\d.]+)\)\s*scale\((-?[\d.]+)\)"/);
const gStart = gm ? svg.indexOf(gm[0]) : -1;
const T = gm ? { tx: Number(gm[1]), ty: Number(gm[2]), s: Number(gm[3]) } : { tx: 0, ty: 0, s: 1 };
const rects = [];
const re = /<rect\b([^>]*)\/?>/g;
let m;
while ((m = re.exec(svg)) !== null) {
  const at = m[1];
  const num = k => { const g = at.match(new RegExp("\\b" + k + '="(-?[\\d.]+)"')); return g ? Number(g[1]) : 0; };
  const fill = (at.match(/fill="([^"]+)"/) || [])[1];
  if (!fill) throw new Error("fill のない rect がある: " + m[0].slice(0, 80));
  const inG = gStart >= 0 && m.index > gStart;
  const k = inG ? T.s : 1, ox = inG ? T.tx : 0, oy = inG ? T.ty : 0;
  rects.push({ x: num("x") * k + ox, y: num("y") * k + oy, w: num("width") * k, h: num("height") * k, c: hex(fill) });
}
if (!rects.length) throw new Error("rect が 1 つも取れなかった");

/* RGB バッファ(アルファなし)。背景は最初の rect が全面を覆う前提だが、
   念のため不透明な黒で初期化しておく(未塗り領域を透過にしない)。 */
const px = Buffer.alloc(SIZE * SIZE * 3, 0);
for (const r of rects) {
  const x0 = Math.round(r.x * SCALE), y0 = Math.round(r.y * SCALE);
  const x1 = Math.min(SIZE, Math.round((r.x + r.w) * SCALE));
  const y1 = Math.min(SIZE, Math.round((r.y + r.h) * SCALE));
  for (let y = Math.max(0, y0); y < y1; y++) {
    let o = (y * SIZE + Math.max(0, x0)) * 3;
    for (let x = Math.max(0, x0); x < x1; x++) {
      px[o] = r.c[0]; px[o + 1] = r.c[1]; px[o + 2] = r.c[2];
      o += 3;
    }
  }
}

/* --- PNG(color type 2 = truecolor, アルファなし)を書き出す --- */
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(body) >>> 0, 0);
  return Buffer.concat([len, body, crc]);
}
const CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    t[n] = c;
  }
  return t;
})();
function crc32(buf) {
  let c = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xFF] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF);
}

/* RGB バッファ(1辺 size・アルファなし)を PNG として書き出す。 */
function writePng(outPath, size, rgb) {
  /* 各行の先頭にフィルタバイト0(None)を付けた raw データ */
  const stride = size * 3 + 1;
  const raw = Buffer.alloc(size * stride);
  for (let y = 0; y < size; y++) {
    raw[y * stride] = 0;
    rgb.copy(raw, y * stride + 1, y * size * 3, (y + 1) * size * 3);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;   /* bit depth */
  ihdr[9] = 2;   /* color type 2 = truecolor(RGB・アルファなし) */
  ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;

  const png = Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]),
    chunk("IHDR", ihdr),
    chunk("IDAT", zlib.deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0))
  ]);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, png);
}

writePng(OUT, SIZE, px);
console.log("AppIcon を書き出した: " + path.relative(ROOT, OUT) + " (" + SIZE + "x" + SIZE + ", アルファなし, rect " + rects.length + "個)");

/* 起動画面。単色なので 1 枚作って 3 スケール分へ同じ内容を置く
   (Contents.json が 1x/2x/3x の 3 ファイルを要求するため)。 */
const sc = hex(SPLASH_BG);
const splashPx = Buffer.alloc(SPLASH_SIZE * SPLASH_SIZE * 3);
for (let i = 0; i < splashPx.length; i += 3) {
  splashPx[i] = sc[0]; splashPx[i + 1] = sc[1]; splashPx[i + 2] = sc[2];
}
for (const f of SPLASH_FILES) writePng(path.join(SPLASH_DIR, f), SPLASH_SIZE, splashPx);
console.log("Splash を書き出した: " + SPLASH_FILES.length + "枚 (" + SPLASH_SIZE + "x" + SPLASH_SIZE + ", " + SPLASH_BG + ")");
