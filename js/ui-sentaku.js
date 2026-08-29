"use strict";
/* ============================================================
   ui-sentaku.js — 本試験「選択式」演習モード(V2)
   殿の声:「本試験の選択式は 1科目=長文の中に空欄【A】〜【E】(5マス)＋20の選択肢①〜⑳から選ぶ形式。
   アプリのfill_blank(1マス)は別物。本物の選択式形式を実装する」。
   ・questions/sentaku.js(format:"sentaku")を専用に出題(sentakuIds)。一般プール・悪魔/神(examFmt)・
     年度別(nendo)とは別枠=本試験の「選択式パート」。既存の五肢択一/個数(択一パート)と二本立て。
   ・レンダラ/採点は ui-quiz.js(sentakuInner/sentakuGrade)。バトルエンジンは ui-battle.js を再利用
     (mode:"sentaku"・isExam=装備/回復無効の実力勝負・isTimed=本試験ペースの長め制限)。
   ・採点は各空欄1点(1問=5点満点)。全問の合計点で仕上がりを見せる。
   解放条件は過去問道場(裏面)と同じ=メインクエストをクリアした到達者向けのやり込み。
   ============================================================ */

/* 選択式が解放済みか(過去問道場と同じ到達点。nendoUnlocked未ロード環境では素通しで解放) */
function sentakuUnlocked(){return (typeof nendoUnlocked==="function")?nendoUnlocked():true;}

/* ---------- 1回分のセット=各科目1問(本試験の選択式と同じ構成) ----------
   同じ科目に複数のストックがあるときは、そのうち1問をランダムに選ぶ(周回で別の問題に当たる)。
   科目順(s昇順)に並べるので、本試験と同じ「労基→安衛→労災…」の流れで解ける。 */
function sentakuSetIds(){
  const all=(typeof sentakuIds==="function")?sentakuIds():[];
  const by={};
  all.forEach(id=>{const q=qById(id);if(!q)return;(by[q.s]=by[q.s]||[]).push(id);});
  const out=[];
  Object.keys(by).map(Number).sort((a,b)=>a-b).forEach(s=>{
    const a=by[s];out.push(a[Math.floor(Math.random()*a.length)]);
  });
  return out;
}

/* ---------- 過去問道場に差し込むエントリ(選択式パート) ---------- */
function sentakuDojoCard(){
  const ids=(typeof sentakuIds==="function")?sentakuIds():[];
  if(!ids.length)return "";
  const set=sentakuSetIds().length;
  return `<button class="btn mode-btn" style="background:linear-gradient(135deg,#EAF7F0,#EAF1FF)" onclick="startSentaku()">
    ${px("scroll",30)}<span>選択式演習(本試験形式・1回${set}科目)<span class="d">長文の空欄【A〜E】に20択から語句を入れる ｜ 各1点・実力勝負 ｜ 収録${ids.length}問</span></span>
    <span class="cnt">📝</span></button>`;
}

/* ---------- 出撃 ---------- */
function startSentaku(){
  const ids=sentakuSetIds();
  if(!ids.length){if(typeof bigBanner==="function")bigBanner("選択式問題がまだありません","#6E5FA0",16);return;}
  G=Object.assign(base(),{mode:"sentaku",ids,idx:0,hits:0,miss:0,n:ids.length,need:ids.length,
    snScores:{}});
  G.shield=0;G.life=3;G.lifeMax=3; /* 装備・お守り・回復は無効(isExam=実力勝負) */
  if(typeof storyThen==="function")return storyThen("sentaku",null,battle);
  battle();
}

/* ---------- バトル画面上部のHUD(ui-battle.battle から呼ばれる) ---------- */
function sentakuHud(){
  const q=qById(G.ids[G.idx]);
  const n=Math.max(1,G.n||G.ids.length);
  const pts=sentakuPoints();
  return `<div class="hp-big" id="hpbig">📝 得点 ${pts}<small>/${n*5}</small></div>
    <div class="hpbar"><i id="bosshp" style="width:${Math.min(100,pts/(n*5)*100)}%;background:linear-gradient(90deg,var(--mint),var(--yellow))"></i></div>
    <div class="hp-label">第${G.idx+1}/${n}問 ｜ ${SUBJECTS[q.s]} ｜ 選択式(空欄A〜E・各1点)・本試験ペース</div>`;
}
/* いま時点の合計得点(採点済みの各問の空欄正解数を合算) */
function sentakuPoints(){let s=0;const m=(G&&G.snScores)||{};for(const k in m)s+=m[k]|0;return s;}

/* ---------- 結果(ui-battle.nextTurn から全問終了時に呼ばれる) ---------- */
function sentakuEnd(){
  stopTimer();
  const n=G.n||G.ids.length,maxPts=n*5,pts=sentakuPoints();
  const perfect=G.hits||0; /* 完答した問題数 */
  const pct=maxPts?Math.round(pts/maxPts*100):0;
  const good=pct>=70; /* 選択式は各科目3/5が基準。全体7割で合格ラインの目安 */
  const bonus=Math.round((pts*10+(good?200:0))*coinMult());
  ST.coins+=(G.coinsEarned||0)+bonus;
  saveST();
  good?SFX.levelup():SFX.win();
  if(good&&!prefersReduce())confetti(40);
  /* 空欄を1つでも落とした問題の復習メモ(正解語句を提示) */
  const wl=G.ids.map(id=>{
    const q=qById(id);if(!q||!Array.isArray(q.blanks))return "";
    const sc=(G.snScores&&G.snScores[id]);
    if(sc===q.blanks.length)return ""; /* 完答は載せない */
    const ans=q.blanks.map(b=>`【${esc(b.key)}】${esc((q.options&&q.options[b.ok])||"")}`).join("・");
    return `<div class="note-item"><b>△ ${esc(q.q)}(${sc==null?"未":sc}/${q.blanks.length}点)</b><span class="ans">正解:${ans}</span><span class="ex">${esc(q.e||"")}</span></div>`;
  }).join("");
  app.innerHTML=`
  <div class="topbar"><span></span><span class="coin-chip">${px("coin",16)} ${ST.coins}</span><span></span></div>
  <div class="end-wrap">
    ${px(good?"trophy":"scroll",90,"floaty")}
    <div class="end-title dot ${good?"win":"lose"}">選択式演習 ${good?"高得点!":"挑戦完了"}</div>
    <div class="end-sub">${good
      ?"本試験の選択式を高い得点率で突破。空欄補充の型が身についている!"
      :"選択式は各科目3/5が基準。落とした空欄の正解語句を下で確認して再挑戦しよう。"}</div>
    <div class="reward-box">得点 ${pts}/${maxPts}(${pct}%) ｜ 完答 ${perfect}/${n}問</div>
    <div style="font-size:12px;font-weight:900;color:#C58900;margin-top:4px">${px("coin",14)} +${(G.coinsEarned||0)+bonus}</div>
  </div>
  <div class="banner" style="background:#EAF7F0;font-size:11px;line-height:1.5">📝 本試験の選択式は「長文の空欄【A〜E】に20の選択肢から語句を入れる」形式。1科目5点(各1点)。3点未満は科目足切りの対象。</div>
  ${wl?`<div class="sec">復習メモ(落とした空欄の正解)</div>${wl}`:""}
  <button class="btn mode-btn yellowbg" onclick="startSentaku()">${px("scroll",30)}<span>もう一度 選択式に挑む</span></button>
  ${typeof nendoDojo==="function"?`<button class="btn mode-btn mintbg" onclick="nendoDojo()">📜<span>過去問道場へ戻る</span></button>`:""}
  <button class="btn mode-btn" onclick="home()">🏠<span>ホームへ</span></button>`;
}

window.sentakuUnlocked=sentakuUnlocked;window.sentakuDojoCard=sentakuDojoCard;window.sentakuSetIds=sentakuSetIds;
window.startSentaku=startSentaku;window.sentakuHud=sentakuHud;window.sentakuEnd=sentakuEnd;
window.sentakuPoints=sentakuPoints;
