"use strict";
/* ============================================================
   gacha-history.js — ガチャの排出履歴画面(改善リスト#54、App Store申請向け)
   確率・天井表(gacha-fx.js)に続き、「実際に何を引いてきたか」を一覧で見せる。
   記録は engine.js の gachaLogPush(ST.gLog、直近30件・新しい順)。
   ここは表示専用(判定・付与は一切行わない)。innerHTMLに入れるのは装備名など
   既存の内部データのみ=生ユーザー入力なし(XSS安全)。
   ============================================================ */

/* ST.gLog の1件をガチャ結果と同じ形に戻す(gachaResHtml をそのまま再利用するため) */
function gachaLogToResult(e){
  if(e.id!==undefined)return {rar:e.rar,item:ITEM[e.id],isNew:!!e.isNew};
  if(e.potion)return {rar:0,potion:1};
  return {rar:0,coins:e.coins};
}

function gachaHistory(){
  stopTimer();
  const log=ST.gLog||[];
  const rows=log.length
    ?`<div class="gacha-hist-grid">${log.map(e=>gachaResHtml(gachaLogToResult(e),34)).join("")}</div>`
    :`<div class="fx" style="font-size:12px;padding:14px 4px">まだ何も引いていない。1回引くとここに記録される。</div>`;
  app.innerHTML=`
  <div class="topbar">
    <button class="small-btn" onclick="gacha()">← 戻る</button>
    <span style="font-weight:900;font-size:14px">📜 排出履歴</span>
    <span></span>
  </div>
  <div class="logo"><div class="t dot" style="font-size:22px">直近の<em>排出</em></div>
  <div class="s">新しい順・最大30件(古いものから自動で消える) ｜ 累計${ST.gTotal}回</div></div>
  ${rows}
  <button class="btn mode-btn" onclick="gacha()">🎰<span>ガチャへ戻る</span></button>`;
}
window.gachaHistory=gachaHistory;window.gachaLogToResult=gachaLogToResult;
