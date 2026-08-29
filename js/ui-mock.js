"use strict";
/* ============================================================
   ui-mock.js — 簡易模試モード
   9科目×4問=36問を科目順に出題(本試験と同じ並び)。
   基準点判定: 各科目4問中2問以上 かつ 総合25問以上(約7割)。
   装備・お守り・回復は無効(実力測定のため)。ミスでライフは減らない。
   バトル進行は ui-battle.js を共用(mode:"mock")。
   ============================================================ */
const MOCK_PER_SUBJ=4;
const MOCK_TOTAL_NEED=25;
const MOCK_SUBJ_NEED=2;

function startMock(){
  const ids=[];
  for(let si=0;si<SUBJECTS.length;si++){
    ids.push(...shuffle(Q.filter(x=>x.s===si).map(x=>x.id)).slice(0,MOCK_PER_SUBJ));
  }
  G=Object.assign(base(),{mode:"mock",ids,idx:0,hits:0,miss:0,need:MOCK_TOTAL_NEED,n:ids.length});
  G.shield=0;G.life=3;G.lifeMax=3;
  battle();
}
/* バトル画面上部のHUD(ui-battle.battle から呼ばれる) */
function mockHud(){
  const q=qById(G.ids[G.idx]);
  return `<div class="hp-big" id="hpbig">正解 ${G.hits}<small>/${G.need}</small></div>
    <div class="hpbar"><i id="bosshp" style="width:${Math.min(100,G.hits/G.need*100)}%;background:linear-gradient(90deg,var(--mint),var(--yellow))"></i></div>
    <div class="hp-label">第${G.idx+1}/${G.ids.length}問 ｜ ${SUBJECTS[q.s]} ｜ 📝 装備・回復 無効</div>`;
}
/* 結果(ui-battle.nextTurn から全問終了時に呼ばれる) */
function mockEnd(){
  stopTimer();
  const wrongBySub={},asked={};
  G.ids.forEach(id=>{const q=qById(id);asked[q.s]=(asked[q.s]||0)+1;});
  [...new Set(G.wrong)].forEach(id=>{const q=qById(id);wrongBySub[q.s]=(wrongBySub[q.s]||0)+1;});
  let allSubjOK=true;
  const rows=SUBJECTS.map((name,si)=>{
    const a=asked[si]||0,c=a-(wrongBySub[si]||0);
    const ok=c>=MOCK_SUBJ_NEED;
    if(!ok)allSubjOK=false;
    return `<div class="stat-row" style="${ok?"":"background:#FFF0F3;border-radius:8px"}">
      <span>${ok?"✅":"⚠️"} ${name}</span><b style="color:${ok?"#2B9E82":"var(--red)"}">${c}/${a}</b></div>`;
  }).join("");
  const total=G.hits;
  const totalOK=total>=MOCK_TOTAL_NEED;
  const cleared=allSubjOK&&totalOK;
  ST.mock.runs++;
  const newBest=total>ST.mock.best;
  if(newBest)ST.mock.best=total;
  let bonus=0;
  if(cleared){ST.mock.clears++;bonus=Math.round(400*coinMult());ST.coins+=bonus;}
  saveST();
  cleared?SFX.levelup():SFX.win();
  if(cleared)confetti(50);
  const wc=[...new Set(G.wrong)].length;
  app.innerHTML=`
  <div class="topbar"><span></span><span class="coin-chip">${px("coin",16)} ${ST.coins}</span><span></span></div>
  <div class="end-wrap">
    ${px(cleared?"trophy":"god",90,"floaty")}
    <div class="end-title dot ${cleared?"win":"lose"}">${cleared?"基準点クリア!!":"基準点まであと一歩"}</div>
    <div class="end-sub">${cleared
      ?"総合・全科目とも基準を突破。本試験レベルの安定感だ!"
      :!totalOK
        ?`総合 ${total}/${G.ids.length}(基準${MOCK_TOTAL_NEED}問)。⚠️の科目から復習しよう`
        :"総合は基準クリア!⚠️の科目(足切りライン)だけ潰せば完璧だ"}</div>
    <div class="reward-box">総合 ${total}/${G.ids.length} 正解</div>
    ${bonus?`<div style="font-size:12px;font-weight:900;color:#C58900;margin-top:4px">${px("coin",14)} クリアボーナス +${bonus}</div>`:""}
    ${newBest?'<br><span class="newrec">NEW RECORD!</span>':""}
  </div>
  <div class="sec">科目別成績(基準: 各${MOCK_SUBJ_NEED}/${MOCK_PER_SUBJ}問以上+総合${MOCK_TOTAL_NEED}問以上)</div>
  ${rows}
  <div class="banner" style="background:#EFEAF8">📈 自己ベスト ${ST.mock.best}/${G.ids.length} ｜ 挑戦${ST.mock.runs}回 ｜ クリア${ST.mock.clears}回</div>
  ${wc?`<button class="btn mode-btn pinkbg" onclick="startRevenge()">${px("skull",30)}<span>ミスした${wc}問にリベンジ<span class="d">コイン2倍</span></span></button>`:""}
  <button class="btn mode-btn yellowbg" onclick="startMock()">${px("scroll",30)}<span>もう一度 模試を受ける</span></button>
  <button class="btn mode-btn" onclick="home()">🏠<span>ホームへ</span></button>`;
}
window.startMock=startMock;window.mockHud=mockHud;window.mockEnd=mockEnd;
