/* ============================================================
   tools/appstore-shots.js — App Store 提出用スクリーンショット(8枚・1320×2868)を作る
   ・実際のアプリ画面を 440×956(×3 = 1320×2868 相当)で撮り、上に短い見出しを載せて 1320×2868 ちょうどに組む。
   ・まっさらなセーブから、決まった乱数で40日ぶん遊ばせて撮る(実行のたびに同じ絵になる)。
   ・書体は同梱の native-assets/fonts.css(ネットワーク不要)。

     node tools/appstore-shots.js          # → docs/appstore/shots/01-….png 〜 08-….png
     (playwright は開発機に入っているものを使う。無ければ: npm i -D playwright && npx playwright install chromium)
   ============================================================ */
const fs = require("fs"), path = require("path"), http = require("http");
let chromium;
for (const m of ["playwright", path.join(process.env.HOME || "", "sharoushi-quest/node_modules/playwright")]) { try { chromium = require(m).chromium; break; } catch (e) {} }
if (!chromium) { console.error("playwright が見つからない"); process.exit(1); }

const ROOT = path.join(__dirname, ".."), OUT = path.join(ROOT, "docs/appstore/shots");
const W = 1320, H = 2868, VW = 440, VH = 956;
fs.mkdirSync(OUT, { recursive: true });

/* 見出し(使う人が得るもの を一言＋数字) */
const SHOTS = [
  { name: "01-home",    head: "看板マチモンを育てて、\n番付をのぼる",       sub: "60枚・8段。めざすは 横綱" },
  { name: "02-talent",  head: "同じ種類でも、\n1体ずつ 才能がちがう",       sub: "105種類 × 才能・性格・特性36種" },
  { name: "03-bout",    head: "勝てるかどうか、\n始める前に分かる",         sub: "運なし。1対1の 五番勝負" },
  { name: "04-quiz",    head: "全9科目 3,100問。\n解くほど 強くなる",       sub: "1問ごとに やさしい解説" },
  { name: "05-keiko",   head: "けいこは 3つ。\nどの力を伸ばすか 選べる",    sub: "新しい問題・復習・苦手つぶし" },
  { name: "06-breed",   head: "配合で、才能のいい子を\nねらって作る",       sub: "見込みが 先に分かる" },
  { name: "07-zukan",   head: "105種類を あつめる。\nはんこは 315個",       sub: "色ちがい・配合だけの種類も" },
  { name: "08-story",   head: "消えた看板の なぞ。\n物語 全8話",            sub: "番付を上がるたびに 1話ひらく" }
];

const MIME = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".png": "image/png", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".txt": "text/plain" };
const server = http.createServer((req, res) => {
  const u = decodeURIComponent(req.url.split("?")[0]), f = path.join(ROOT, u === "/" ? "index.html" : u);
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { "Content-Type": MIME[path.extname(f)] || "application/octet-stream" }); res.end(fs.readFileSync(f));
});

/* 決まった乱数・確認ダイアログは「はい」・動きは止める・書体は同梱のもの */
const INIT = `(()=>{ let s=20261010; Math.random=()=>{ s=(s*16807)%2147483647; return (s-1)/2147483646; }; window.confirm=()=>true;
  document.addEventListener("DOMContentLoaded",()=>{ const l=document.createElement("link"); l.rel="stylesheet"; l.href="/native-assets/fonts.css"; document.head.appendChild(l);
    const st=document.createElement("style"); st.textContent="*{animation:none!important;transition:none!important}.mm-pop,.mm-stamp{opacity:1!important;transform:none!important}"; document.head.appendChild(st); }); })()`;
/* 正しい答えを押す */
const ANS = (fn, id) => `(()=>{ const q=qById(${id}); const A=MM.ui.${fn}; if(q.sentaku){ q.blanks.forEach(b=>A(b.ok)); } else if(q.choices&&q.choices.length&&q.format!=='true_false'){ let ci=q.choices.findIndex(ch=>ch&&ch.ok); A(ci<0?(q.answerIndex||0):ci); } else A(typeof q.a==='boolean'?q.a:!!q.answer); })()`;
/* 40日ぶん遊ばせて、見せたい姿にととのえる */
const PLAY = `(()=>{ document.querySelectorAll('.mm-v2-eggbtn')[0].click();
  const c=MM.ui.ctx(), M=MM.mon, g=M.W(c); let seed=7; const r=()=>{ seed=(seed*16807)%2147483647; return (seed-1)/2147483646; };
  for(let d=1;d<=40;d++){ const c2=MM.state.ctx({today:c.today-40+d,dstr:'p'+d,rand:r}); MM.state.rollDay(c2); if(M.freeReady(c2)&&g.mons.length<40)M.pull(c2,true);
    for(const kind of ['rev','rev','nig','new','new','new']){ const s=MM.keiko.start(c2,kind); if(s.err)continue; while(s.qid!=null){ const ok=r()<0.8; const gain=MM.economy.grant(MM.learn.commit(s.qid,ok,5000,c2),c2); MM.keiko.advance(c2,s,ok,gain); } }
    while(c2.mm.res.g>=300&&g.mons.length<40)M.pull(c2,false);
    let best=null; g.mons.forEach(p=>{ const v=M.pot(g,p).d; if(p.i!==g.kan&&(!best||v>best.v))best={p,v}; }); if(best&&best.v>0)M.setKan(c2,best.p.i); }
  const z=MM.banzuke.Z(c); z.pos=41; z.w=3; z.l=1; z.n=4; z.basho=8; z.tw=38; z.tl=14; z.story=4; g.sread=4; z.day={d:'',n:0};
  MM.breed.give(c,{t0:2,t1:3,bt:2},[]); c.mm.day={d:c.dstr,eff:0,ans:0,cor:0}; c.mm.res.g=840; g.rv=null; g.btd=''; g.shard=126; c.mm.name='ひだまり町';
  const k=M.kanban(g); k.tr=['sente','giant']; k.ef=[38,22,61,47,30]; const mate=g.mons.filter(p=>p.i!==g.kan).sort((x,y)=>M.talent(y)-M.talent(x))[0]; mate.k=k.k; mate.n=M.kindOf(k).name; mate.tl=[9,8,9,7,9]; M.mark(g,mate); MM.game.save(); MM.ui.bzS.noScroll=1; MM.ui.go('h2');
  return k.n+' つよさ'+M.power(k)+' / なかま'+g.mons.length; })()`;
const STEPS = [
  { js: "MM.ui.go('h2')" },
  { js: "MM.ui.go('n2d',{id:MM.mon.W(MM.ui.ctx()).kan})" },
  { js: "MM.ui.go('bzPre')" },
  { js: `(()=>{ MM.ui.k2Go('rev'); const s=MM.ui.v2.quiz; s.t0=Date.now()-5000; ${ANS("k2Ans", "s.qid")}; clearTimeout(MM.ui._gt); })()` },
  { js: "MM.ui.v2.quiz=null; MM.ui.go('k2m')" },
  { js: "(()=>{ const g=MM.mon.W(MM.ui.ctx()); MM.ui.b2Open(); const l=g.mons.filter(p=>p.i!==g.kan).sort((a,b)=>MM.mon.talent(b)-MM.mon.talent(a)); MM.ui.b2Pick('b',l[0].i); })()" },
  { js: "MM.ui.go('z2')" },
  { js: "MM.ui.storyRead(3,'r2'); for(let i=0;i<9;i++)MM.ui.storyTap(); window.scrollTo(0,0);" }
];

function poster(s, dataUrl) {
  const head = s.head.split("\n").map(x => `<div><span>${x}</span></div>`).join("");
  return `<!doctype html><html lang="ja"><head><meta charset="utf-8"><link rel="stylesheet" href="/native-assets/fonts.css"><style>
  *{margin:0;padding:0;box-sizing:border-box} html,body{width:${W}px;height:${H}px;overflow:hidden}
  body{font-family:'M PLUS Rounded 1c',sans-serif;color:#33303E;background:#FFC53C;background-image:radial-gradient(#FFD877 9%,transparent 10%);background-size:66px 66px;position:relative}
  .head{position:absolute;left:0;right:0;top:118px;text-align:center;font-weight:900;font-size:104px;line-height:1.24;letter-spacing:-1px}
  .sub{position:absolute;left:0;right:0;top:420px;text-align:center}
  .sub span{display:inline-block;font-weight:900;font-size:50px;color:#fff;background:#33303E;border-radius:999px;padding:12px 48px}
  .phone{position:absolute;left:${(W - 1056) / 2}px;top:586px;width:1056px;height:${Math.round(1056 * VH / VW) + 24}px;border:12px solid #33303E;border-bottom:0;border-radius:72px 72px 0 0;overflow:hidden;background:#FFF6E5;box-shadow:0 14px 0 rgba(51,48,62,.25)}
  .phone img{display:block;width:1032px;height:${Math.round(1032 * VH / VW)}px}
  </style></head><body><div class="head">${head}</div><div class="sub"><span>${s.sub}</span></div><div class="phone"><img src="${dataUrl}"></div></body></html>`;
}

(async () => {
  await new Promise(r => server.listen(0, "127.0.0.1", r));
  const base = "http://127.0.0.1:" + server.address().port;
  const b = await chromium.launch();
  const app = await b.newContext({ viewport: { width: VW, height: VH }, deviceScaleFactor: 3, serviceWorkers: "block", locale: "ja-JP" });
  await app.addInitScript(INIT);
  const p = await app.newPage(); p.on("pageerror", e => console.log("PAGEERR", e.message));
  await p.goto(base + "/index.html"); await p.waitForTimeout(1500); await p.evaluate(() => document.fonts.ready);
  console.log("play:", await p.evaluate(PLAY));
  const post = await b.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
  const pp = await post.newPage(); await pp.goto(base + "/manifest.json");
  for (let i = 0; i < SHOTS.length; i++) {
    await p.evaluate(STEPS[i].js); await p.waitForTimeout(500);
    const bad = await p.evaluate(() => { const h = document.getElementById("app").innerHTML; return /undefined|NaN/.test(h.replace(/<[^>]*>/g, "")); });
    if (bad) throw new Error(SHOTS[i].name + ": 画面に undefined / NaN がある");
    const png = await p.screenshot();
    await pp.setContent(poster(SHOTS[i], "data:image/png;base64," + png.toString("base64")), { waitUntil: "load" });
    await pp.evaluate(() => document.fonts.ready); await pp.waitForTimeout(200);
    /* 見出しが はみ出していないこと */
    const over = await pp.evaluate(() => [...document.querySelectorAll(".head span,.sub span")].some(e => { const r = e.getBoundingClientRect(); return r.left < 20 || r.right > innerWidth - 20; }) || document.querySelector(".head").getBoundingClientRect().bottom > document.querySelector(".sub").getBoundingClientRect().top || document.querySelector(".sub").getBoundingClientRect().bottom > document.querySelector(".phone").getBoundingClientRect().top);
    if (over) throw new Error(SHOTS[i].name + ": 見出しが はみ出している・重なっている");
    const out = path.join(OUT, SHOTS[i].name + ".png");
    await pp.screenshot({ path: out, clip: { x: 0, y: 0, width: W, height: H } });
    console.log("shot ->", path.relative(ROOT, out));
  }
  await b.close(); server.close();
})().catch(e => { console.error(e); server.close(); process.exit(1); });
