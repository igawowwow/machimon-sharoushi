"use strict";
/* ============================================================
   ui-intro.js — 冒頭アーク「簡単クエスト → 試験の悪魔に敗北 → 鍛えて挑む」
   北極星: 試験の悪魔(本試験の化身)を倒す=本試験に受かる。
   ・簡単クエスト(easy): 誰でも確実に勝てる導入戦。最初の成功体験。
   ・試験の悪魔(demon): リアル過去問7問を本試験さながらの制限速度で。装備補助は無効(isExam)。
     初心者はまず敗北する設計。だが非懲罰=学ぶべき論点(弱点)が見える。以後いつでも再挑戦可。
   バトルエンジン(G/base/battle/resolve/nextTurn)は ui-battle.js を再利用。
   ============================================================ */

/* ---------- 導入クエストの出題(やさしい○×を数問) ---------- */
const EASY_N=5,EASY_HP=3; /* 5問中3問正解で突破(問題を出し切っても必ず突破=確実な初勝利) */
function pickEasyIds(){
  /* 労基(科目0)の○×から先頭数問。無ければプール先頭で穴埋め(caseOnly/未監修はQに含まれない) */
  let pool=Q.filter(x=>x.s===0&&x.format==="true_false").map(x=>x.id);
  if(pool.length<EASY_N)pool=pool.concat(Q.map(x=>x.id).filter(id=>pool.indexOf(id)<0));
  return pool.slice(0,EASY_N);
}
/* ---------- 悪魔の出題(本試験形式=五肢択一をちょうど7問) ---------- */
function pickDemonIds(){
  const n=DEMON_CFG.n;
  let pool=examPastIds(); /* 五肢択一(examFmt)を最優先→○×の本試験改題で補う */
  if(pool.length<n){
    /* なお足りなければ最も本試験に近い難問で補う(難度降順→ID安定) */
    const have={};pool.forEach(id=>have[id]=1);
    const extra=Q.filter(x=>!have[x.id]).sort((a,b)=>(b.difficulty||2)-(a.difficulty||2)).map(x=>x.id);
    pool=pool.concat(extra);
  }
  return pool.slice(0,n);
}

/* ---------- 物語 ---------- */
const INTRO={
 opening:[
  {sp:"sage",n:"長老",t:"勇者よ、まずは肩慣らしじゃ。目の前の「練習の的」を、○か×かで斬ってみせよ。恐れることはない。"},
  {sp:"hero",n:"見習い社労士",t:"○×で答えればいいんだね。やってみる!"}
 ],
 entrance:[
  {sp:"mao",n:"???",t:"クックック……よくぞ的を斬った。だが、貴様に本当の壁を見せてやろう。"},
  {sp:"mao",n:"試験の悪魔",t:"我は【試験の悪魔】。本試験そのものの化身よ。リアルな過去問7問、本番と同じ制限時間で相手をしてやる。"},
  {sp:"mao",n:"試験の悪魔",t:"装備もお守りも通用せぬ。あるのは貴様の実力だけ。……さあ、耐えられるかな?"}
 ],
 lose:[
  {sp:"mao",n:"試験の悪魔",t:"フハハ!やはりな。今の実力では、本試験の壁は越えられぬ。"},
  {sp:"mao",n:"試験の悪魔",t:"だが敗北は無駄ではない。今のお前と本試験との距離——それが分かっただけでも収穫よ。"},
  {sp:"mao",n:"試験の悪魔",t:"忘れたか。十二年前、中央法典は砕け散った。その【かけら】は、労基から労一まで——九つの砦に眠っている。"},
  {sp:"mao",n:"試験の悪魔",t:"九つの法典のかけらをすべて集め、砕けた法典を甦らせた時。その時だけ、再びこの壁に挑む資格を得る。……さあ、旅を始めよ。"}
 ],
 win:[
  {sp:"mao",n:"試験の悪魔",t:"ぐ……ぬ……。この一戦を、これほど正確に……。"},
  {sp:"mao",n:"試験の悪魔",t:"見事だ。だが慢心するな。本試験の真の壁は、九つの法典のかけらを集め、砕けた法典を甦らせた者だけが越えられる。我は頂で待つ。"},
  {sp:"hero",n:"社労士",t:"分かってる。まずは第一章から。九つの砦を、一つずつ。"}
 ]
};

/* ---------- 起動導線(新規プレイヤー) ---------- */
function introNeedsBoot(){return !!ST.intro&&!ST.intro.easy;} /* 導入未突破=冒頭アークから開始 */
function introStart(){
  ST.story.intro=1;saveST(); /* 旧オープニングは冒頭アークに統合済みとしてスキップ */
  storyShow(INTRO.opening,startEasyQuest);
}

/* ---------- 簡単クエスト ---------- */
function startEasyQuest(){
  G=Object.assign(base(),{mode:"easy",ids:pickEasyIds(),idx:0,bossHP:EASY_HP,bossMax:EASY_HP});
  battle();
}
function easyClear(){
  /* #68 クイックスタート(タイトルから即開始した3問)は専用リザルトへ。
     初見にいきなり悪魔戦(7問・本試験形式)をぶつけない。悪魔は物語側で対峙する。 */
  if(typeof qsRunning==="function"&&qsRunning()&&typeof qsClear==="function")return qsClear();
  const bf=document.getElementById("bossface");
  if(bf&&typeof explodeBoss==="function")explodeBoss(bf);
  const first=!ST.intro.easy;
  ST.intro.easy=1;
  const reward=Math.round(120*coinMult());
  ST.coins+=(G?G.coinsEarned:0)+reward;
  saveST();
  SFX.win();if(!prefersReduce())confetti(40);
  bigBanner("🎉 初めての勝利! +"+reward+"コイン","#2B9E82",22);
  /* 勝った勢いのまま、試験の悪魔が立ちはだかる */
  setTimeout(()=>{ if(first){demonEntrance(startDemon);} else startDemon(); },first?900:500);
}

/* ---------- 試験の悪魔 ---------- */
function demonEntrance(cb){
  /* 登場演出: 暗転フラッシュ+咆哮→寸劇。reduced-motion では簡素化 */
  if(!prefersReduce()){flash("#3A0010",300);if(typeof shakeApp==="function")shakeApp();}
  SFX.special();
  storyThen("demonEntry",INTRO.entrance,cb);
}
function startDemon(){
  /* 【悪魔は冒頭一度きり】met=1(=一度対峙済)なら二度と発生させない。
     悪魔は「悪魔への道 全9章を制した先の最終目標(本試験)」として頂に君臨(ロック)。
     以降このボタンが呼ばれても戦闘は始めず、メインクエスト(拠点)へ戻す。 */
  if(ST.intro.met){home();return;}
  ST.intro.met=1;saveST();
  const start=()=>{
    G=Object.assign(base(),{mode:"demon",ids:pickDemonIds(),idx:0,hits:0,miss:0,
      need:DEMON_CFG.need,allow:DEMON_CFG.n-DEMON_CFG.need,n:DEMON_CFG.n});
    G.shield=0;G.life=3;G.lifeMax=3; /* 装備・お守り・回復は無効(isExam) */
    battle();
  };
  /* 初対面は登場演出→開戦。以後は直接開戦(storyThenが既視で素通し) */
  if(!ST.story.demonEntry)demonEntrance(start);
  else start();
}
function demonEnd(win){
  stopTimer();
  const bf=document.getElementById("bossface");
  if(win&&bf&&typeof explodeBoss==="function")explodeBoss(bf);
  ST.intro.met=1;
  ST.intro.best=Math.max(ST.intro.best||0,G.hits||0);
  let reward=0;
  if(win){
    ST.intro.win=(ST.intro.win||0)+1;
    reward=Math.round((ST.intro.win===1?600:200)*coinMult());
    ST.chests=(ST.chests||0)+1;
  }
  ST.coins+=(G.coinsEarned||0)+reward;
  saveST();
  if(win){SFX.levelup();if(!prefersReduce())confetti(60);flash("#FFE9A8",250);}
  else SFX.lose();
  const wrong=[...new Set(G.wrong||[])];
  const proceed=()=>demonResult(win,reward,wrong);
  storyShow(win?INTRO.win:INTRO.lose,proceed);
}
function demonResult(win,reward,wrong){
  const face=win?"trophy":"mao";
  const title=win?"👹 試験の悪魔と互角に!":"試験の悪魔に敗北…";
  const sub=win
    ?"本試験の化身と渡り合った。だが真の力は、九つの法典のかけらを集めてこそ磨かれる。まずは第1章で、最初のかけらを取り戻そう。"
    :`正解 ${G.hits}/${DEMON_CFG.n}。今はまだ本試験の壁は高い——だが道はある。砕かれた中央法典の【かけら】を九つ(労基→労一)集め、法典を甦らせた時、再びこの頂に挑む資格を得る。まずは第1章から。`;
  const wl=wrong.map(id=>{const q=qById(id);if(!q)return "";
    return `<div class="note-item"><b>✕ ${esc(q.q)}</b><span class="ans">正解:${q.a?"○":"×"}</span><span class="ex">${esc(q.e)}</span></div>`;}).join("");
  const readyLine=`定着度 ${passPct()}% ｜ 習得 ${masteredCount()}/${Q.length}問`;
  app.innerHTML=`
  <div class="topbar"><span></span><span class="coin-chip">${px("coin",16)} ${ST.coins}</span><span></span></div>
  <div class="end-wrap ${win?"":"dark"}">
    ${px(face,90,"floaty")}
    <div class="end-title dot ${win?"win":"lose"}">${title}</div>
    <div class="end-sub">${sub}</div>
    <div class="reward-box">${px("coin",20)} +${(G.coinsEarned||0)+reward}</div>
    <div style="font-size:12px;font-weight:900;color:#2B9E82;margin-top:4px">+${G.xpEarned||0}XP ｜ ${readyLine}</div>
    ${win&&ST.intro.win===1?'<br><span class="newrec">本試験の化身と渡り合った!</span>':""}
  </div>
  ${ST.chests>0?`<button class="btn mode-btn yellowbg" onclick="openChest()">${px("chest",34)}<span>宝箱を開ける!<span class="d">${ST.chests}個</span></span><span class="cnt">×${ST.chests}</span></button>`:""}
  ${wl?`<div class="sec">${win?"取りこぼした論点(復習ノートに保存済み)":"🎯 鍛えるべき弱点(自動で復習ノートに保存済み)"}</div>${wl}`:""}
  <button class="btn mode-btn" style="background:linear-gradient(135deg,#33303E,#6E5FA0);color:#fff" onclick="home()">
    ${px("excal",30)}<span>悪魔への道へ進む<span class="d" style="color:#D8CFF5">第1章から、一歩ずつ強くなる</span></span></button>
  <button class="btn mode-btn yellowbg" onclick="shop()">${px("hammer",30)}<span>装備を整える<span class="d">道中の砦攻略が楽になる</span></span></button>
  <button class="btn mode-btn" style="background:linear-gradient(135deg,#FFF3C4,#FFE1EB)" onclick="gacha()">${px("gachaball",30)}<span>ガチャで装備を引く</span></button>
  <button class="btn mode-btn" onclick="home()">🏠<span>ホームへ</span></button>`;
}

/* ---------- ホーム最上部の冒頭アークカード(北極星) ---------- */
function introCard(){
  if(!ST.intro)return "";
  const met=ST.intro.met,win=ST.intro.win;
  /* Phase A: 導入クエスト未突破 */
  if(!ST.intro.easy){
    return card("#33303E","#6E5FA0","skull","はじまりの試練","まずは練習の的を○×で斬ろう(制限時間なし・誰でも勝てる)","introStart()","試練に挑む ▶","#FFD98A");
  }
  /* Phase B: 導入突破・悪魔と未対峙(リロード時の保険) */
  if(!met){
    return card("#3A1020","#7A2B4A","mao","試験の悪魔が現れた!","本試験の化身が立ちはだかる。今の力で挑んでみよう","startDemon()","悪魔に挑む ▶","#F5C6D6");
  }
  /* Phase C+: 【悪魔は冒頭一度きり】対峙済み以降、悪魔は再戦せず「悪魔への道 全9章を
     制した先の最終目標(本試験の化身)」として頂に君臨(ロック)。進捗で解錠状況を可視化。 */
  /* 【法典のかけら】オープニングで砕け散った中央法典。そのかけらは九つの科目(砦)に眠る。
     一章(科目)を制するごとに かけら を1つ取り戻し、九つ揃えて初めて試験の悪魔=本試験に挑める。 */
  const cleared=(ST.msq&&ST.msq.done)?9:Math.min(9,(ST.msq&&ST.msq.ch)||0);
  const shards="◆".repeat(cleared)+"◇".repeat(Math.max(0,9-cleared));
  if(cleared>=9){
    /* 法典 完全復元=本試験に挑む準備完了。本試験シミュレーション(試験の神/年度別過去問)へ案内。 */
    return `<div class="sec" style="margin-top:2px">📖 中央法典 完全復元 ─ 試験の悪魔に挑める</div>
    <button class="btn intro-card" style="background:linear-gradient(135deg,#2B7A5A,#5FA07E);color:#fff;display:block;text-align:left;padding:11px" onclick="startTodayAdventure()">
      <span style="display:flex;align-items:center;gap:8px">${px("god",38,"floaty")}
        <span style="flex:1"><span style="font-size:11px;color:#FFE39A;font-weight:900;letter-spacing:2px">${shards}</span><br>
        <b style="font-size:14px">法典のかけら 9/9 集結! 本試験へ</b></span></span>
      <span style="display:block;margin-top:6px;font-size:9.5px;color:#D6F5E4">砕かれた法典が甦った。試験の神・年度別過去問で、本試験さながらの腕試しを</span>
    </button>`;
  }
  return `<div class="sec" style="margin-top:2px">👹 最終目標 ─ 試験の悪魔(本試験の化身)</div>
  <button class="btn intro-card" style="background:linear-gradient(135deg,#241019,#3A1020);color:#fff;display:block;text-align:left;padding:12px" onclick="worldMap()">
    <span style="display:flex;align-items:center;gap:8px">
      ${px("mao",42,"floaty")}
      <span style="flex:1"><span style="font-size:11px;color:#F5C6D6;font-weight:900">🔒 頂で待つ最終目標</span><br>
      <b style="font-size:15px">試験の悪魔（本試験）</b></span></span>
    <span style="display:block;margin-top:7px;font-size:13px;color:#FFE39A;font-weight:900;letter-spacing:3px">${shards}</span>
    <span style="display:block;margin-top:4px;font-size:10px;color:#F5C6D6">砕かれた中央法典の<b>かけら</b>を九つ集めよ。今 <b>${cleared}/9</b> ─ 九つ揃った時、悪魔に挑む資格を得る</span>
    <span style="display:block;margin-top:4px;font-size:9.5px;color:#E8CBD6">下の冒険カード（または試練＞科目特訓）で、次のかけらを取り戻そう</span>
  </button>`;
}
function card(c1,c2,sp,ttl,desc,cta,btn,accent){
  return `<div class="sec" style="margin-top:2px">🌅 いまはここから</div>
  <button class="btn intro-card" style="background:linear-gradient(135deg,${c1},${c2});color:#fff;display:block;text-align:left;padding:12px" onclick="${cta}">
    <span style="display:flex;align-items:center;gap:8px">${px(sp,40,"floaty")}
      <span style="flex:1"><b style="font-size:15px">${esc(ttl)}</b>
      <span style="display:block;margin-top:3px;font-size:10px;color:#E8E2F5">${esc(desc)}</span></span></span>
    <span style="display:block;margin-top:8px;text-align:center;background:${accent};color:#33303E;font-weight:900;border-radius:10px;padding:9px;font-size:14px">${esc(btn)}</span>
  </button>`;
}

window.introStart=introStart;window.introNeedsBoot=introNeedsBoot;
window.startEasyQuest=startEasyQuest;window.easyClear=easyClear;
window.startDemon=startDemon;window.demonEnd=demonEnd;window.demonEntrance=demonEntrance;
window.introCard=introCard;
