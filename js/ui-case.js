"use strict";
/* ============================================================
   ui-case.js — 事件簿(労務事件解決RPG)
   流れ: 依頼 → 聞き取り → 証拠集め(ミニバトル) → 論点整理 → ボス戦 → 解決
   進行は ST.cases[caseId] = {ev:{証拠id:1}, heard:{証人id:1}, cleared:0/1}
   ============================================================ */
const CASES=[CASE_ROUKI,CASE_ANEI,CASE_ROUSAI,CASE_KOKUNEN,CASE_KENPO,CASE_KOUNEN,CASE_KOYO,CASE_CHOSHU,CASE_IPPAN];
function caseSt(c){return ST.cases[c.id]||(ST.cases[c.id]={ev:{},heard:{},cleared:0});}
function caseEvDone(c){return c.evidences.filter(e=>caseSt(c).ev[e.id]).length;}

/* ---- 事件簿トップ ---- */
function caseBook(){
  stopTimer();
  const rows=CASES.map(c=>{
    const cs=caseSt(c),done=caseEvDone(c);
    const state=cs.cleared?"👑解決済(再挑戦OK)":done?`捜査中(証拠${done}/${c.evidences.length})`:"未着手";
    return `<button class="btn mode-btn ${cs.cleared?"mintbg":"pinkbg"}" onclick="caseOpen('${c.id}')">
      ${px(c.boss.sp,34)}<span>${c.badge} ${c.title}<span class="d">${SUBJECTS[c.subject]} ｜ ${state}</span></span></button>`;
  }).join("");
  app.innerHTML=`
  <div class="topbar">
    <button class="small-btn" onclick="home()">← 戻る</button>
    <span style="font-weight:900;font-size:14px">📖 事件簿</span>
    <span class="coin-chip">${px("coin",14)} ${ST.coins}</span>
  </div>
  <div class="logo"><div class="t dot" style="font-size:24px">労務事件<em>解決RPG</em></div>
  <div class="s">調査し、証拠を集め、法律で村を救え</div></div>
  ${rows}
  <div class="banner" style="background:#EFEAF8">全9章そろい踏み。全章👑で「事件簿マスター」の称号だ</div>`;
}

/* ---- 事件トップ(捜査ハブ) ---- */
function caseOpen(id){
  const c=CASES.find(x=>x.id===id);if(!c)return;
  const cs=caseSt(c);
  if(!cs.introSeen){cs.introSeen=1;saveST();storyShow(c.intro,()=>caseOpen(id));return;}
  const evRows=c.evidences.map(e=>{
    const got=cs.ev[e.id];
    return `<button class="btn mode-btn ${got?"mintbg":"yellowbg"}" onclick="caseEv('${c.id}','${e.id}')">
      ${px(e.icon,30)}<span>${got?"✅ ":"🔍 "}${e.name}<span class="d">${got?"入手済み(復習できる)":e.desc}</span></span>
      <span class="cnt">${e.qids.length}問</span></button>`;
  }).join("");
  const wRows=c.witnesses.map(w=>`
    <button class="btn mode-btn" style="background:#FFF" onclick="caseHear('${c.id}','${w.id}')">
      ${px(w.sp,28)}<span>${cs.heard[w.id]?"✅":"🗣"} ${w.name}<span class="d">${cs.heard[w.id]?w.hint:"タップで聞き取り"}</span></span></button>`).join("");
  const ready=caseEvDone(c)>=c.evidences.length;
  app.innerHTML=`
  <div class="topbar">
    <button class="small-btn" onclick="caseBook()">← 事件簿</button>
    <span class="coin-chip">${px("coin",14)} ${ST.coins}</span>
    <button class="small-btn" onclick="toggleMute(this)">${muted?"🔇":"🔊"}</button>
  </div>
  <div class="logo"><div class="t dot" style="font-size:22px">${c.title}</div><div class="s">${c.summary}</div></div>
  <div class="sec">🗣 聞き取り(論点のヒント)</div>
  ${wRows}
  <div class="sec">🔍 証拠集め(問題を解いて入手)</div>
  ${evRows}
  ${ready?`<div class="sec">⚖ 論点整理</div>
    <div class="pcard"><b style="font-size:12px">${c.chart.title}</b>
    <table class="exp-table">${c.chart.rows.map(r=>`<tr><td>${r[0]}</td><td>${r[1]}</td></tr>`).join("")}</table></div>
    <button class="btn mode-btn" style="background:#33303E;color:#fff" onclick="caseBoss('${c.id}')">
      ${px(c.boss.sp,38)}<span>${c.boss.name}と対決!<span class="d" style="color:#CFCBDE">原則の直後に例外、数字の入替えに注意せよ</span></span></button>`
    :`<div class="banner">証拠を${c.evidences.length}つ集めると、${c.boss.name}との対決が解放される</div>`}
  ${cs.cleared?`<div class="sec">⚔ EXTRA(解決後の特訓)</div>
  <button class="btn mode-btn yellowbg" onclick="caseExtra('${c.id}')">
    ${px(c.boss.sp,30)}<span>${c.extra.name}<span class="d">選択式(穴埋め)+並べ替えの新形式 全${c.extraSeq.length}問${cs.extra?" ｜ ✅クリア済":""}</span></span></button>
  <div class="banner" style="background:#DFF5EC">👑 この事件は解決済み。記録は「事件記録」としてここに残る</div>`:""}`;
}
function caseHear(cid,wid){
  const c=CASES.find(x=>x.id===cid),w=c.witnesses.find(x=>x.id===wid);
  caseSt(c).heard[wid]=1;saveST();
  storyShow(w.lines.map(t=>({sp:w.sp,n:w.name,t})),()=>{bigBanner("💡 "+w.hint,"#2B62D9",14);caseOpen(cid);});
}

/* ---- 証拠集め: ミニバトル ---- */
function caseEv(cid,evid){
  const c=CASES.find(x=>x.id===cid),ev=c.evidences.find(x=>x.id===evid);
  const hp=ev.qids.length*playerDmg();
  G=Object.assign(base(),{mode:"case",ids:ev.qids.slice(),idx:0,bossHP:hp,bossMax:hp,
    caseId:cid,caseEv:evid,caseBoss:{sp:ev.icon,name:ev.name+"を調査",sub:c.title}});
  battle();
}
/* ---- ボス戦 ---- */
function caseBoss(cid){
  const c=CASES.find(x=>x.id===cid);
  const ids=c.bossSeq.map(x=>x.id);
  const taunts={};c.bossSeq.forEach(x=>{if(x.taunt)taunts[x.id]=x.taunt;});
  const hp=ids.length*playerDmg();
  G=Object.assign(base(),{mode:"case",ids,idx:0,bossHP:hp,bossMax:hp,
    caseId:cid,caseFinal:true,taunts,caseBoss:c.boss});
  battle();
}
/* ---- EXTRA: 選択式・並べ替え特訓 ---- */
function caseExtra(cid){
  const c=CASES.find(x=>x.id===cid);
  const hp=c.extraSeq.length*playerDmg();
  G=Object.assign(base(),{mode:"case",ids:c.extraSeq.slice(),idx:0,bossHP:hp,bossMax:hp,
    caseId:cid,caseExtra:true,caseBoss:{sp:c.boss.sp,name:c.extra.name,sub:c.extra.sub}});
  battle();
}
/* ---- バトル終了(ui-battle から呼ばれる) ---- */
window.caseBattleEnd=function(win,g){
  const c=CASES.find(x=>x.id===g.caseId);
  const cs=caseSt(c);
  ST.coins+=g.coinsEarned;
  if(win&&g.caseEv&&!cs.ev[g.caseEv]){
    cs.ev[g.caseEv]=1;saveST();
    bigBanner("🔍 証拠【"+c.evidences.find(e=>e.id===g.caseEv).name+"】を入手!","#2B9E82",18);
    SFX.chest();
    setTimeout(()=>caseOpen(c.id),900);return;
  }
  if(win&&g.caseExtra){
    const first=!cs.extra;
    cs.extra=1;
    if(first)ST.coins+=c.extraReward.coins;
    saveST();SFX.win();
    showOvl(`${px("trophy",56)}<h3 class="dot">再審請求を棄却!</h3>
      <div class="sub2">選択式・並べ替えを制覇した${first?`<br><b>報酬: ${c.extraReward.coins}コイン</b>`:"(再挑戦)"}</div>
      <button class="btn go-btn" style="width:100%;margin-top:10px;padding:11px" onclick="hideOvl();caseOpen('${g.caseId}')">戻る</button>`);
    return;
  }
  if(win&&g.caseFinal){
    const first=!cs.cleared;
    cs.cleared=1;
    if(first){ST.coins+=c.reward.coins;ST.chests+=c.reward.chest;}
    saveST();SFX.levelup();confetti(50);
    storyShow(c.ending,()=>{
      showOvl(`${px(c.boss.sp,56)}<h3 class="dot">事件解決!</h3>
        <div class="sub2">${c.title} を解決した!${first?`<br><b>報酬: ${c.reward.coins}コイン+宝箱${c.reward.chest}個</b>`:"(再挑戦クリア)"}</div>
        <button class="btn go-btn" style="width:100%;margin-top:10px;padding:11px" onclick="hideOvl();caseBook()">事件簿へ</button>`);
      if(first&&typeof msqBeat==="function")setTimeout(()=>msqBeat("cas",c.subject),300); /* M5: 事件解決の物語ビート(一度きり) */
    });return;
  }
  saveST();
  showOvl(`${px(win?"trophy":"skull",56)}<h3 class="dot">${win?"調査完了!":"捜査失敗…"}</h3>
    <div class="sub2">${win?"+"+g.coinsEarned+"コイン":"間違えた論点は復習ノートに記録された。もう一度挑もう"}</div>
    <button class="btn go-btn" style="width:100%;margin-top:10px;padding:11px" onclick="hideOvl();caseOpen('${g.caseId}')">戻る</button>`);
};
window.caseBook=caseBook;window.caseOpen=caseOpen;window.caseHear=caseHear;
window.caseEv=caseEv;window.caseBoss=caseBoss;window.caseExtra=caseExtra;
