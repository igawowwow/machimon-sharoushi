"use strict";
/* ============================================================
   ui-quickstart.js — Issue #68: 初見が「2タップ・30秒」で第1問に到達する即開始導線
   ・タイトルの主要CTA「すぐ冒険を始める」= キャラ作成もオープニングも挟まず 3問バトルへ直行。
     (物語は捨てない。「物語から始める」/クリア画面/ホームからいつでも入れる)
   ・初回3問を終える時点で【必ず】レベルアップ or 装備獲得を起こす(手応えの担保)。
   ・その場で次の3問へ進める(「また明日」で終わらせない)。
   ・計測(first_question_started 等)は端末内 ST.ev のみ。外部送信は一切しない。
   北極星: おじいちゃんでも「押す所が1つ」で、押したら問題が出る。
   ============================================================ */

const QS_N=3,QS_HP=2; /* 3問1セット・HP2=2問正解で突破(出し切っても突破するので必ず勝てる) */

/* ---------- 計測(ローカル記録のみ) ---------- */
function qsEv(name,val){
  try{
    if(!ST.ev||typeof ST.ev!=="object"||Array.isArray(ST.ev))ST.ev={};
    const cur=ST.ev[name];
    if(cur&&name.indexOf("first_")===0)return; /* first_* は最初の1回だけ(初回体験の計測) */
    ST.ev[name]={t:Date.now(),n:((cur&&cur.n)||0)+1,v:(val===undefined?null:val)};
  }catch(e){}
}
function qsState(){ if(!ST.qs||typeof ST.qs!=="object"||Array.isArray(ST.qs))ST.qs={on:0,run:0,rounds:0,lv0:1}; return ST.qs; }
function qsRunning(){ const q=qsState(); return !!q.run; }

/* ---------- 出題(やさしい○×を3問。周回ごとに別の3問へずらす) ---------- */
function qsIds(){
  let pool=Q.filter(x=>x.s===0&&x.format==="true_false").map(x=>x.id);
  if(pool.length<QS_N)pool=pool.concat(Q.map(x=>x.id).filter(id=>pool.indexOf(id)<0));
  const done=qsState().rounds||0;
  const from=(done*QS_N)%Math.max(1,pool.length);
  const out=pool.slice(from,from+QS_N);
  return out.length>=QS_N?out:out.concat(pool.slice(0,QS_N-out.length));
}

/* ---------- 開始(タイトルの主要CTA = ここが第1問への最短路) ---------- */
function quickStart(){
  const q=qsState();
  q.on=1;q.run=1;q.lv0=ST.lv;
  qsEv("first_question_started");
  /* 段階解放の対象に印を付ける(新規プレイヤーのホームを散らかさない) */
  try{ if(window.SRStory&&typeof SRStory.markFreshJourney==="function")SRStory.markFreshJourney(); }catch(e){}
  saveST();
  G=Object.assign(base(),{mode:"easy",ids:qsIds(),idx:0,bossHP:QS_HP,bossMax:QS_HP,qs:1});
  battle(); /* 物語・寸劇を挟まず即出題 */
}
/* 2回目以降の「もう3問」 */
function quickNext(){
  const q=qsState();
  q.run=1;q.lv0=ST.lv;saveST();
  G=Object.assign(base(),{mode:"easy",ids:qsIds(),idx:0,bossHP:QS_HP,bossMax:QS_HP,qs:1});
  battle();
}

/* ---------- 必ず報われる初回(レベルアップ or 装備獲得) ---------- */
function qsGuarantee(force){
  const q=qsState();
  if(ST.lv>(q.lv0||1))return {kind:"lv"};      /* 戦闘中に上がっていれば それが報酬 */
  if(!force)return null;
  const it=ITEMS.filter(x=>x.shop!==undefined&&!ST.inv[x.id]).sort((a,b)=>a.shop-b.shop)[0];
  if(it){ ST.inv[it.id]=1;ST.eq[it.slot]=it.id;return {kind:"gear",it:it}; }
  addXpRaw(ST,Math.max(1,xpForNext(ST.lv)-ST.xp)); /* 装備を配れない(全所持)なら確実にレベルアップ */
  return {kind:"lv"};
}

/* ---------- 3問クリア(冒頭アークの悪魔戦は挟まない) ---------- */
function qsClear(){
  const bf=document.getElementById("bossface");
  if(bf&&typeof explodeBoss==="function")explodeBoss(bf);
  const q=qsState();
  q.run=0;q.rounds=(q.rounds||0)+1;
  ST.intro.easy=1; /* 導入突破済み扱い=冒頭アークのカードと二重に出さない */
  const first=q.rounds===1;
  const coins=Math.round((first?120:60)*coinMult());
  const earned=(G&&G.coinsEarned)||0,xp=(G&&G.xpEarned)||0;
  if(G)G.mode="qsend"; /* 決着済み: 積み残しの nextTurn が来ても再入しない(悪魔戦へ流れ込ませない) */
  ST.coins+=earned+coins;
  const rw=qsGuarantee(first);
  qsEv("first_battle_completed");
  if(rw)qsEv("first_reward_received",rw.kind);
  qsEv("first_session_questions",(q.rounds||1)*QS_N);
  saveST();
  if(typeof SFX!=="undefined")SFX.win();
  if(typeof prefersReduce==="function"&&!prefersReduce()&&typeof confetti==="function")confetti(40);
  if(typeof bigBanner==="function")bigBanner((first?"🎉 初めての勝利!":"⚔ 撃破!")+" +"+coins+"コイン","#2B9E82",20);
  qsResult(earned+coins,xp,rw,first);
}

/* ---------- リザルト: 大きなCTAは1つだけ ---------- */
function qsResult(coins,xp,rw,first){
  const q=qsState();
  const rwLine=rw
    ?(rw.kind==="gear"
      ?`<div class="reward-box">${px(rw.it.sp,20)} ${esc(rw.it.name)} を手に入れた!(装備済み)</div>`
      :`<div class="reward-box">⬆ レベルアップ! Lv.${ST.lv}</div>`)
    :"";
  const storyBtn=`<button class="btn mode-btn" style="background:linear-gradient(135deg,#241B33,#4A2E63);color:#fff" onclick="qsToStory()">
    📖<span>物語を始める<span class="d" style="color:#D8CFF5">名前を決めて、序章「灰色の朝」へ</span></span></button>`;
  const moreBtn=`<button class="btn mode-btn yellowbg" onclick="quickNext()">
    ${px("excal",30)}<span>もう3問すすむ<span class="d">約1分・XPとコインが増える</span></span></button>`;
  const storyFirst=(q.rounds||0)>=3; /* 3セット遊んだら物語を主役に切り替える */
  app.innerHTML=`
  <div class="topbar"><span></span><span class="coin-chip">${px("coin",16)} ${ST.coins}</span><span></span></div>
  <div class="end-wrap">
    ${px("trophy",84,"floaty")}
    <div class="end-title dot win">${first?"はじめての3問クリア!":"3問クリア!"}</div>
    <div class="end-sub">${first?"これが冒険の1歩目。ここから、解くたびに強くなる。":"いい調子。続けるほど記憶に残る。"}</div>
    <div class="reward-box">${px("coin",20)} +${coins}</div>
    ${rwLine}
    <div style="font-size:12px;font-weight:900;color:#2B9E82;margin-top:4px">+${xp}XP ｜ Lv.${ST.lv} ｜ 定着度 ${passPct()}%</div>
  </div>
  ${storyFirst?storyBtn:moreBtn}
  ${storyFirst?moreBtn:storyBtn}
  <button class="btn mode-btn" onclick="home()">🏠<span>拠点(ホーム)へ</span></button>`;
}

/* ---------- 物語へ合流(名前を決めていなければキャラ作成から) ---------- */
function qsToStory(){
  if(typeof srqStartCharCreate==="function"){ try{ return srqStartCharCreate(); }catch(e){} }
  if(typeof startMainStory==="function"){ try{ return startMainStory(); }catch(e){} }
  return home();
}

/* ---------- ホーム: クイック開始した人向けの「次の3問」導線(小) ---------- */
function qsHomeChip(){
  const q=qsState();
  if(!q.on)return "";
  return `<button class="btn go-btn" style="width:100%;margin:0 0 8px;padding:11px;font-size:13px" onclick="quickNext()">⚔ サッと3問(約1分) ▶</button>`;
}

window.quickStart=quickStart;window.quickNext=quickNext;window.qsClear=qsClear;
window.qsToStory=qsToStory;window.qsRunning=qsRunning;window.qsHomeChip=qsHomeChip;
window.qsEv=qsEv;window.qsIds=qsIds;window.qsState=qsState;
