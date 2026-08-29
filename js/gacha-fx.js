"use strict";
/* ============================================================
   gacha-fx.js — ガチャ開封演出(M3: レア感=引いた瞬間に震える)
   ・レア度で開封を段階化: N/R素早く → SR光る → SSRため → 閃光 → LR(最上位)は特別な全画面演出
   ・10連は1枚ずつめくる(レア確定の予兆音)。タップで一気にスキップ可
   ・ダブりは限界突破(凸)として表示。数値本強化(enh)はM4連携で、ここは可視化のみ
   厳守: 判定・確率・付与は engine 側で完結済み。ここは「見た目と音」だけ。
        prefers-reduced-motion では派手演出を簡素化(酔わせない・一気に表示)。
        innerHTML には装備名など既存の内部データのみを入れる(生ユーザー入力なし=XSS安全)。
   依存(全て実行時 typeof 参照): fx.js(showOvl/hideOvl/flash/confetti/bigBanner)・
        game-data(RAR)・engine(GACHA/enhLv)・sfx(SFX)・data-sprites(px)・ui-home(gacha)。
   ============================================================ */

function gfxReduceMo(){return typeof prefersReduce==="function"&&prefersReduce();}
function gPityLeft(){return Math.max(0,GACHA.pity-(ST.gPity||0));}

/* ---- S5(C): 提供割合の表示。GACHA.rates から必ず生成する(手書き数値は調整のたびにズレるため) ---- */
function gRatePct(p){const v=p*100;return (v>=10?v.toFixed(0):v.toFixed(1))+"%";}
/* SSR以上(rar>=3)の合計。「どれだけ渋いか」を1つの数字で示す */
function gachaHiRateText(){
  return gRatePct(GACHA.rates.filter(r=>r[0]>=3).reduce((s,r)=>s+r[1],0));
}
/* 提供割合の一覧(高レア順)。中身は RAR/GACHA の内部データのみ */
function gachaRateTblHtml(){
  const parts=[];
  for(let i=GACHA.rates.length-1;i>=1;i--){
    const rr=RAR[GACHA.rates[i][0]];
    parts.push(`<b class="${rr.cls}">${rr.n} ${gRatePct(GACHA.rates[i][1])}</b>`);
  }
  parts.push(`N(コイン・ドリンク) ${gRatePct(GACHA.rates[0][1])}`);
  return parts.join(" / ");
}

/* 結果1件のチップHTML。rar5=LRは虹(bLR)。ダブりは凸(限界突破)として表示 */
function gachaResHtml(r,size=40){
  if(r.coins!==undefined)return `<div class="gacha-item"><span class="rarN">N</span><br>${px("coin",size)}<span class="gn">+${r.coins}コイン</span></div>`;
  if(r.potion)return `<div class="gacha-item"><span class="rarN">N</span><br>${px("potion",size)}<span class="gn">回復ドリンク</span></div>`;
  const it=r.item,rr=RAR[r.rar];
  const bcls=r.rar>=5?"bLR":r.rar===4?"bUR":r.rar===3?"bSSR":r.rar===2?"bSR":"";
  const lv=enhLv(it.id);
  const dupeMsg=r.isNew
    ? '<br><b style="color:var(--pink)">NEW!</b>'
    : (lv>=ENH_MAX
        ? '<br>凸MAX→+'+rr.dupe+'コイン'
        : '<br><b style="color:#C58900">限界突破 凸+'+lv+'!</b>');
  return `<div class="gacha-item ${bcls}"><span class="${rr.cls}">${rr.n}</span><br>${px(it.sp,size)}<span class="gn">${it.name}${dupeMsg}${it.fx?`<br><span style="color:#2B9E82;font-size:8.5px">${it.fx}</span>`:""}</span></div>`;
}

/* レア度に応じた閃光・紙吹雪・SE。best=このガチャの最高レア */
function gachaRevealFlash(best,reduce){
  if(best>=5){ /* LR: 特別な全画面演出 */
    SFX.legend();
    if(!reduce){flash("#FFFFFF",120);setTimeout(()=>flash("#FFE1EB",420),120);confetti(90);
      if(typeof bigBanner==="function")bigBanner("✦ LR ✦","#FF3D7E",40);}
    else flash("#FFE1EB",300);
  }else if(best>=4){ /* UR */
    SFX.ssr();flash("#FFD1E8",reduce?300:420);if(!reduce)confetti(64);
  }else if(best>=3){ /* SSR */
    SFX.ssr();flash("#FFE9A8",reduce?260:360);if(!reduce)confetti(40);
  }else if(best>=2){ /* SR */
    SFX.win();if(!reduce)flash("#E8DEFF",240);
  }else{
    SFX.coin();
  }
}

function gachaFooter(){
  const left=gPityLeft();
  /* サクサク: 結果画面から戻らず連続で引ける。払えるコストがある時だけボタンを出す */
  const c1=ST.tickets>0?"チケ1":(ST.coins>=GACHA.cost1?GACHA.cost1+"コイン":"");
  const c10=(ST.tickets||0)>=10?"チケ10":(ST.coins>=GACHA.cost10?GACHA.cost10+"コイン":"");
  return `<div class="sub2">天井まで あと${left}回${left<=5?" 🔥もうすぐ!":""} ｜ SSR以上 ${gachaHiRateText()}</div>
    ${c1?`<button class="btn go-btn" style="width:100%;margin-top:10px;padding:11px" onclick="gachaAgain(1)">🎰 もう1回引く(${c1})</button>`:""}
    ${c10?`<button class="btn go-btn pinkbg" style="width:100%;margin-top:8px;padding:11px" onclick="gachaAgain(10)">🌈 10連もう1回(${c10})</button>`:""}
    <button class="btn" style="width:100%;margin-top:8px;padding:10px" onclick="hideOvl()">OK!</button>`;
}
/* 結果→即次弾。hideOvlSilent で「閉じる→ガチャ画面再描画→開く」の1往復を省く */
function gachaAgain(n){
  if(typeof hideOvlSilent==="function")hideOvlSilent();else hideOvl();
  gachaDo(n);
}

/* 1枚引きの開封 */
function gachaRevealSingle(r,best,reduce){
  const head=best>=5?"🌈✦ 虹 降臨!! ✦🌈":best>=4?"🌈UR 大当たり!!":best>=3?"🌈大当たり!!":best>=2?"✨当たり!":"結果";
  showOvl(`<h3 class="dot">${head}</h3><div style="margin:8px 0">${gachaResHtml(r,64)}</div>${gachaFooter()}`,()=>gacha());
}

/* 10連の開封: 伏せた10枚を1枚ずつめくる(レア確定の予兆音)。タップで一気にスキップ */
let gRevealTimers=[],gRevealDone=null;
function gachaClearTimers(){gRevealTimers.forEach(t=>clearTimeout(t));gRevealTimers=[];}
function gachaRevealCell(i,r){
  const cell=document.getElementById("gc"+i);if(!cell)return;
  cell.classList.add("gon");
  if(r.rar>=3&&typeof SFX!=="undefined"&&SFX.omen)SFX.omen();
  else if(typeof SFX!=="undefined"&&SFX.flip)SFX.flip();
}
/* 一気開放: 残りを全部めくる。1枚ずつの緊張から解放される瞬間を作る */
function gachaRevealAllNow(rs,best,reduce){
  gachaClearTimers();
  rs.forEach((r,i)=>{const cell=document.getElementById("gc"+i);if(cell)cell.classList.add("gon");});
  const grid=document.getElementById("gRevGrid");
  if(grid&&!reduce)grid.classList.add("gburst");
  gachaShowFooter(best,reduce);
}
function gachaShowFooter(best,reduce){
  if(gRevealDone)return;gRevealDone=true;
  const f=document.getElementById("gRevFoot");if(f)f.innerHTML=gachaFooter();
  if(best>=4)gachaRevealFlash(best,reduce); /* 全部めくり終えた最後にご褒美の大演出 */
}
function gachaRevealTen(rs,best,reduce){
  gRevealDone=false;gachaClearTimers();
  const grid=rs.map((r,i)=>
    `<div class="gcell gpend" id="gc${i}"><div class="gback">${px("gachaball",30,reduce?"":"gwig")}</div><div class="gfront">${gachaResHtml(r,30)}</div></div>`
  ).join("");
  const head=best>=5?"🌈✦ 虹入り!! ✦":best>=4?"🌈UR入り!!":best>=3?"🌈大当たり入り!!":"10連結果";
  showOvl(`<h3 class="dot">${head}</h3>
    <div class="g10grid" id="gRevGrid" onclick="gachaSkipReveal()">${grid}</div>
    <div id="gRevFoot"><button class="btn gs-skip" type="button" onclick="gachaSkipReveal()">一気にめくる ▶▶</button></div>`,()=>gacha());
  window._gRevArgs={rs,best,reduce};
  if(reduce){gachaRevealAllNow(rs,best,reduce);return;}
  rs.forEach((r,i)=>{
    gRevealTimers.push(setTimeout(()=>{
      /* 高レアが来る手前で予兆音を先出し(期待を煽る) */
      if(r.rar>=3){const pre=document.getElementById("gc"+i);if(pre)pre.classList.add("gomen");}
      gachaRevealCell(i,r);
      if(i===rs.length-1)gRevealTimers.push(setTimeout(()=>gachaShowFooter(best,reduce),260));
    },180*(i+1)));
  });
}
function gachaSkipReveal(){
  const a=window._gRevArgs;if(!a)return;
  gachaRevealAllNow(a.rs,a.best,a.reduce);
}

/* 開封の入口。S5: まず抽選演出(キュインキュイン)を挟み、その後に開封へ渡す。
   gacha-suspense.js が読めていない時は従来のカプセル演出へ確実にフォールバックする。 */
function gachaReveal(rs){
  const best=Math.max(...rs.map(r=>r.rar));
  const reduce=gfxReduceMo();
  gachaClearTimers();gRevealDone=false;
  SFX.gacha();
  const open=()=>{
    if(rs.length===1){gachaRevealFlash(best,reduce);gachaRevealSingle(rs[0],best,reduce);}
    else gachaRevealTen(rs,best,reduce);
  };
  if(typeof gachaSuspense==="function"){gachaSuspense(best,open);return;}
  showOvl(`<div id="capW">${px("gachaball",80,reduce?"":"capshake")}</div>
    <h3 class="dot">${best>=4?"…なにか、光ってる…":"・・・"}</h3>`);
  const capDelay=reduce?240:(best>=5?1600:best>=4?1250:best>=3?1000:best>=2?720:520);
  if(!reduce&&best>=3&&best<5)setTimeout(()=>{if(SFX.omen)SFX.omen();},Math.max(0,capDelay-460));
  setTimeout(open,capDelay);
}

if(typeof window!=="undefined"){
  window.gachaReveal=gachaReveal;window.gachaResHtml=gachaResHtml;
  window.gachaSkipReveal=gachaSkipReveal;window.gachaAgain=gachaAgain;window.totalToppa=(typeof totalToppa!=="undefined"?totalToppa:window.totalToppa);
  window.gRatePct=gRatePct;window.gachaHiRateText=gachaHiRateText;window.gachaRateTblHtml=gachaRateTblHtml;
}
