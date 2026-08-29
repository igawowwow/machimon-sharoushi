"use strict";
/* ============================================================
   ui-nendo.js — 年度別過去問「裏面モード」= 過去問道場(N2)
   殿の声:「メインクエストをクリアできたら、過去問を年度別に回れる裏面モードに」
   ・メインクエスト(帝国制圧 / 悪魔ルート / 周回クリア)を突破すると解放される「裏面」。
   ・年度を選び、その年度の過去問セット(五肢択一＋個数問題)に本試験形式・本試験ペースで挑戦。
   ・年度別の正答率・ベストを記録(ST.nendo)。既存の悪魔/神とは役割を分け「年度別にやり込む」。
   バトルエンジン(G/battle/resolve/nextTurn)は ui-battle.js を再利用(mode:"nendo"・isExam)。
   問題データは questions/nendo*.js(NENDO_SETS)。一般プール・悪魔/神プールには混入しない。

   【課金設計の下地(ロジックは作らない)】年度セットは tier:"paid" タグを持つ(=有料想定)。
     将来ペイウォールを被せる時は NENDO_GATE_ENABLED を true にし nendoTierLocked を実装する。
     今は全アクセス可(gate無効)。無料の基礎学習と有料想定の年度過去問の境界を tier で構造上明示。
   ============================================================ */

/* 課金ゲートは今は無効(全機能アクセス可)。構造だけ用意しておく。 */
const NENDO_GATE_ENABLED=false;
function nendoTierLocked(set){
  /* 将来: 有料セット(tier==="paid")を未購入なら true を返す実装に差し替える。今は常に false=全アクセス可。 */
  return NENDO_GATE_ENABLED&&!!set&&set.tier==="paid"&&false;
}

/* ---------- 解放条件(メインクエストのクリア) ---------- */
/* 帝国制圧完了(msq.done) / 試験の悪魔撃破(intro.win) / 周回クリア(clears) / ゲームクリア のいずれかで解放。
   いずれも「メインを一定までクリアした」体験の到達点。旧セーブは全て未達=ロックのまま安全。 */
function nendoUnlocked(){
  return !!(ST.msq&&ST.msq.done)
    ||!!(ST.intro&&(ST.intro.win||0)>0)
    ||(ST.clears||0)>=1
    ||!!ST.cleared;
}
function nendoSets(){return window.NENDO_SETS||[];}
function nendoRec(year){return (ST.nendo&&ST.nendo[year])||{best:0,bestPct:0,plays:0};}
function nendoRecord(year,correct,total){
  const r=ST.nendo[year]||(ST.nendo[year]={best:0,bestPct:0,plays:0});
  r.plays=(r.plays||0)+1;
  if(correct>(r.best||0))r.best=correct;
  const pct=total?Math.round(correct/total*100):0;
  if(pct>(r.bestPct||0))r.bestPct=pct;
  return r;
}

/* ---------- ホームのエントリカード ---------- */
function nendoDojoCard(){
  const sets=nendoSets();
  if(!sets.length)return "";
  if(!nendoUnlocked()){
    return `<button class="btn mode-btn" style="background:linear-gradient(135deg,#33303E,#4A4460);color:#fff;opacity:.94" onclick="nendoDojo()">
      🔒<span>裏面モード: 過去問道場(年度別)<span class="d" style="color:#CFCBDE">メインクエストをクリアで解放 ─ 年度別にやり込む本試験形式の過去問</span></span></button>`;
  }
  const done=sets.filter(s=>nendoRec(s.year).plays>0).length;
  const gold=typeof isGold==="function"&&isGold();
  return `<button class="btn mode-btn" style="background:linear-gradient(135deg,#2B2540,#5A4A8C);color:#fff" onclick="nendoDojo()">
    ${px("scroll",34)}<span>📜 裏面: 過去問道場(年度別) ${gold&&typeof goldReadyBadge==="function"?goldReadyBadge():""}<span class="d" style="color:#D8CFF5">${sets.length}年度・本試験形式で年度別にやり込む${done?` ｜ 挑戦済${done}/${sets.length}年度`:""}${gold?" ｜ 🏆本番同等条件で挑める":""}</span></span></button>`;
}

/* ---------- 過去問道場(年度選択) ---------- */
function nendoDojo(){
  stopTimer();hideOvlSilent();
  if(typeof setBgmScene==="function")setBgmScene("town");
  if(!nendoUnlocked())return nendoLockedScreen();
  const sets=nendoSets();
  const cards=sets.map(s=>{
    const rec=nendoRec(s.year),locked=nendoTierLocked(s);
    const stat=rec.plays?`ベスト ${rec.best}/${s.ids.length}(${rec.bestPct}%)・挑戦${rec.plays}回`:"未挑戦";
    const cnt=locked?"🔒":(rec.plays?rec.bestPct+"%":"NEW");
    return `<button class="btn mode-btn" style="background:linear-gradient(135deg,#EFEAF8,#EAF1FF)" onclick="${locked?`nendoPaidMsg()`:`startNendo('${esc(s.year)}')`}">
      ${px("scroll",30)}<span>${esc(s.label)}の過去問(${s.ids.length}問)<span class="d">本試験形式・本試験ペース ｜ ${esc(stat)}</span></span>
      <span class="cnt">${cnt}</span></button>`;
  }).join("");
  app.innerHTML=`
  <div class="topbar">
    <button class="small-btn" onclick="home()">← 戻る</button>
    <span style="font-weight:900;font-size:14px">📜 過去問道場</span>
    <span class="coin-chip">${px("coin",14)} ${ST.coins}</span>
  </div>
  <div class="logo"><div class="t dot" style="font-size:24px">裏面<em>・年度別過去問</em></div>
  <div class="s">メインを越えた者の裏面。年度ごとに本試験形式でやり込む</div></div>
  <div class="banner" style="background:linear-gradient(135deg,#EFEAF8,#EAF1FF);font-size:11px;line-height:1.5">📚 年度を選び、その年の過去問セットに<b>本試験形式・本試験ペース</b>で挑戦。年度別のベスト正答率を更新しよう。<br><span style="color:#7A5B00;font-weight:700">修行・復習・試験の悪魔とは別枠の「やり込み」。装備・回復は無効の実力勝負。</span></div>
  ${typeof isGold==="function"&&isGold()?`<div class="banner gold" style="background:linear-gradient(135deg,#FFF6D0,#FFE59A);border-color:#B8860B;font-size:11px;line-height:1.5;color:#5A3A00">🏆 <b>ゴールドモード</b>解放中 ─ 装備を極めた到達者として<b>本番同等条件</b>(本試験さながらの制限時間・問題数・合格基準)で挑める。</div>`:""}
  ${typeof sentakuDojoCard==="function"?`<div class="sec">📝 選択式演習(本試験の選択式パート)</div>${sentakuDojoCard()}`:""}
  ${cards.length?`<div class="sec">📚 年度別(択一式パート)</div>`:""}${cards}
  <div class="footer-note">年度別過去問は将来の年度パック(有料想定)のコンテンツです。現在は全て無料で挑戦できます。</div>
  <button class="btn mode-btn" onclick="home()">🏠<span>ホームへ</span></button>`;
}
function nendoLockedScreen(){
  app.innerHTML=`
  <div class="topbar"><button class="small-btn" onclick="home()">← 戻る</button>
    <span style="font-weight:900;font-size:14px">📜 過去問道場</span><span></span></div>
  <div class="end-wrap dark">
    ${px("scroll",84,"floaty")}
    <div class="end-title dot lose">🔒 まだ開かれざる裏面</div>
    <div class="end-sub">年度別の過去問道場は<b>メインクエストをクリア</b>すると解放される。<br>まずは帝国制圧(冒険の地図)を進めるか、試験の悪魔を撃破しよう。</div>
  </div>
  <button class="btn mode-btn mintbg" onclick="worldMap()">🗺️<span>冒険の地図へ(メインクエスト)<span class="d">帝国を制圧して裏面を解放せよ</span></span></button>
  ${(ST.intro&&ST.intro.easy)?`<button class="btn mode-btn" style="background:linear-gradient(135deg,#3A1020,#7A2B4A);color:#fff" onclick="startDemon()">${px("mao",30)}<span>試験の悪魔に挑む<span class="d" style="color:#F5C6D6">撃破でも裏面が解放される</span></span></button>`:""}
  <button class="btn mode-btn" onclick="home()">🏠<span>ホームへ</span></button>`;
}
function nendoPaidMsg(){bigBanner("🔒 この年度パックは未購入です","#6E5FA0",16);}

/* ---------- 出撃 ---------- */
function startNendo(year){
  const set=nendoSets().find(s=>s.year===year);
  if(!set||!set.ids.length||nendoTierLocked(set))return;
  const ids=shuffle(set.ids.slice());
  G=Object.assign(base(),{mode:"nendo",ids,idx:0,hits:0,miss:0,n:ids.length,need:ids.length,year:set.year,setLabel:set.label});
  G.shield=0;G.life=3;G.lifeMax=3; /* 装備・お守り・回復は無効(isExam=実力勝負) */
  battle();
}

/* ---------- バトル画面上部のHUD(ui-battle.battle から呼ばれる) ---------- */
function nendoHud(){
  const q=qById(G.ids[G.idx]);
  const n=Math.max(1,G.n||G.ids.length);
  return `<div class="hp-big" id="hpbig">正解 ${G.hits}<small>/${G.n||G.ids.length}</small></div>
    <div class="hpbar"><i id="bosshp" style="width:${Math.min(100,G.hits/n*100)}%;background:linear-gradient(90deg,var(--mint),var(--yellow))"></i></div>
    <div class="hp-label">第${G.idx+1}/${G.n||G.ids.length}問 ｜ ${SUBJECTS[q.s]} ｜ 📝 ${esc(G.setLabel||"")}・本試験ペース</div>`;
}

/* ---------- 結果(ui-battle.nextTurn から全問終了時に呼ばれる) ---------- */
function nendoEnd(){
  stopTimer();
  const total=G.n||G.ids.length,correct=G.hits||0;
  const pct=total?Math.round(correct/total*100):0;
  const prev=nendoRec(G.year),first=(prev.plays||0)===0;
  const newBest=first||correct>(prev.best||0);
  nendoRecord(G.year,correct,total);
  const rec=nendoRec(G.year);
  /* 科目別の内訳(本試験の足切り意識づけ。年度は科目横断のため参考表示) */
  const asked={},wrongBySub={};
  G.ids.forEach(id=>{const q=qById(id);if(q)asked[q.s]=(asked[q.s]||0)+1;});
  [...new Set(G.wrong||[])].forEach(id=>{const q=qById(id);if(q)wrongBySub[q.s]=(wrongBySub[q.s]||0)+1;});
  const rows=SUBJECTS.map((name,si)=>{
    const a=asked[si]||0;if(!a)return "";
    const c=a-(wrongBySub[si]||0);
    return `<div class="stat-row"><span>${c===a?"✅":"⚠️"} ${name}</span><b style="color:${c===a?"#2B9E82":"var(--red)"}">${c}/${a}</b></div>`;
  }).join("");
  const good=pct>=70;
  const bonus=Math.round((correct*15+(good?200:0))*coinMult());
  ST.coins+=(G.coinsEarned||0)+bonus;
  saveST();
  good?SFX.levelup():SFX.win();
  if(good&&!prefersReduce())confetti(40);
  const wl=[...new Set(G.wrong||[])].map(id=>{const q=qById(id);if(!q)return "";
    const rt=(q.choices&&q.choices.find(c=>c.ok))||{};
    return `<div class="note-item"><b>✕ ${esc(q.q)}</b><span class="ans">正解:${esc(rt.t||"")}</span><span class="ex">${esc(q.e||"")}</span></div>`;}).join("");
  app.innerHTML=`
  <div class="topbar"><span></span><span class="coin-chip">${px("coin",16)} ${ST.coins}</span><span></span></div>
  <div class="end-wrap">
    ${px(good?"trophy":"scroll",90,"floaty")}
    <div class="end-title dot ${good?"win":"lose"}">${esc(G.setLabel||"年度別過去問")} ${good?"高得点!":"挑戦完了"}</div>
    <div class="end-sub">${good
      ?"本試験レベルの年度セットを高い正答率で突破。この年度は仕上がっている!"
      :"年度別過去問はやり込みの裏面。⚠️の科目と下の敗因メモを潰して再挑戦しよう。"}</div>
    <div class="reward-box">正答 ${correct}/${total}(${pct}%)</div>
    <div style="font-size:12px;font-weight:900;color:#C58900;margin-top:4px">${px("coin",14)} +${(G.coinsEarned||0)+bonus}</div>
    ${newBest?'<br><span class="newrec">NEW BEST!</span>':""}
  </div>
  <div class="banner" style="background:#EFEAF8">📈 ${esc(G.setLabel||"")} ベスト ${rec.best}/${total}(${rec.bestPct}%) ｜ 挑戦${rec.plays}回</div>
  ${rows?`<div class="sec">科目別の内訳(この年度セット)</div>${rows}`:""}
  ${wl?`<div class="sec">敗因メモ(自動で復習ノートに保存済み)</div>${wl}`:""}
  <button class="btn mode-btn yellowbg" onclick="startNendo('${esc(G.year)}')">${px("scroll",30)}<span>この年度にもう一度挑む</span></button>
  <button class="btn mode-btn mintbg" onclick="nendoDojo()">📜<span>他の年度を選ぶ</span></button>
  <button class="btn mode-btn" onclick="home()">🏠<span>ホームへ</span></button>`;
}

window.nendoUnlocked=nendoUnlocked;window.nendoDojo=nendoDojo;window.nendoDojoCard=nendoDojoCard;
window.startNendo=startNendo;window.nendoHud=nendoHud;window.nendoEnd=nendoEnd;
window.nendoRecord=nendoRecord;window.nendoPaidMsg=nendoPaidMsg;window.nendoTierLocked=nendoTierLocked;
