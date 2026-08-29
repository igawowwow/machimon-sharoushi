"use strict";
/* ============================================================
   ui-office.js — 事務所(拠点)の発展 + 稼ぐ拠点化(D2)
   冒険で稼いだコインで施設を建て、事務所が「相談窓口→…→社労士法人本社」へ育つ。
   ★D2で「本当にメリットのある拠点」へ強化:
    ・施設パッシブ(コイン/XP/制限時間/おすすめ枠) … 従来どおりバトル・報酬に効く
    ・顧問料(放置収益): 施設段階・ランク・仲間・信頼度に応じ日次でコイン+強化石が貯まり、
      来訪時に受け取る(最大3日分)。日々戻る動機になる恒常インカム。
    ・仲間の信頼度: 顧問料を受け取るほど働く仲間の信頼度が育ち、顧問料が増える(冒険とは別軸の育成)。
    ・事務所ボーナス合計を明示し、育てるほど数字が伸びる実感を出す。
   進行は ST.office={lv,fac:{facId:段階},claim:最終受取日,trust:{cpId:信頼pt}} に保存。
   学習の芯は不変(答えの自動化なし・支援と動機のみ)。旧セーブは engine.sanitize で安全初期化。
   ============================================================ */
const OFFICE_RANKS=["🏚 ちいさな相談窓口","🏠 個人事務所","🏢 社労士事務所 支店","🏬 社労士ビル","🏙 社労士法人 本社"];
/* 施設: 各3段階。cost=次段階の費用, fx=段階ごとの効果(累積でなく現段階の値) */
const FACILITIES=[
 {id:"desk",name:"相談デスク",icon:"pen",key:"coin",
  tiers:[{cost:300,v:5,label:"来客コイン+5%"},{cost:1200,v:12,label:"コイン+12%"},{cost:4000,v:20,label:"コイン+20%"}]},
 {id:"shelf",name:"六法の本棚",icon:"scroll",key:"xp",
  tiers:[{cost:400,v:8,label:"学びのXP+8%"},{cost:1500,v:16,label:"XP+16%"},{cost:5000,v:25,label:"XP+25%"}]},
 {id:"clock",name:"待合の時計",icon:"clock1",key:"t",
  tiers:[{cost:600,v:1,label:"制限時間+1秒"},{cost:2500,v:2,label:"時間+2秒"},{cost:8000,v:3,label:"時間+3秒"}]},
 {id:"board",name:"求人掲示板",icon:"medal",key:"reco",
  tiers:[{cost:800,v:2,label:"おすすめ+2問"},{cost:3000,v:4,label:"おすすめ+4問"},{cost:9000,v:6,label:"おすすめ+6問"}]}
];
const FAC=Object.create(null);FACILITIES.forEach(f=>FAC[f.id]=f);
/* 施設の現段階(0=未建設,1..3) */
function facTier(id){return (ST.office&&ST.office.fac&&ST.office.fac[id])||0;}
/* 施設パッシブ合計(key別・現段階の値) */
function officeBonus(key){
  let v=0;
  for(const f of FACILITIES){if(f.key!==key)continue;const tr=facTier(f.id);if(tr>0)v+=f.tiers[tr-1].v;}
  return v;
}
/* 建設済み段階の総数(0..12)。ランク・顧問料の基礎 */
function officeFacPoints(){let s=0;for(const f of FACILITIES)s+=facTier(f.id);return s;}
/* 事務所ランク: 建設した段階の合計で昇格 */
function officeRank(){return Math.min(OFFICE_RANKS.length-1,Math.floor(officeFacPoints()/3));}
function officeNextFac(id){const tr=facTier(id);return tr<3?FAC[id].tiers[tr]:null;}

/* ---------- 仲間の信頼度(顧問料の受取で育つ・冒険とは別軸) ---------- */
const TRUST_TIERS=[7,25,60]; /* 信頼pt→★1/★2/★3 */
function trustPts(id){return (ST.office&&ST.office.trust&&ST.office.trust[id])||0;}
function trustLv(id){const p=trustPts(id);let l=0;for(const t of TRUST_TIERS)if(p>=t)l++;return l;}
function trustNext(id){const l=trustLv(id);return l<TRUST_TIERS.length?TRUST_TIERS[l]:null;}
/* 信頼度による顧問料ボーナス(1★=+2コイン/日)。バトルstatには一切干渉しない(学習/戦力バランス不変) */
function officeTrustBonus(){let v=0;for(const c of COMPANIONS)if(ST.party&&ST.party[c.id])v+=trustLv(c.id)*2;return v;}

/* ---------- 顧問料(放置収益): 日次でコイン+強化石。来訪時に受け取り ---------- */
const OFFICE_CAP_DAYS=3; /* 貯まる上限(放置しても3日分まで=毎日戻る動機) */
function officeDailyCoins(){
  /* 施設投資が主因になるよう配分(建てる→稼ぎが増える の分かりやすいループ) */
  const base=30+officeRank()*20+officeFacPoints()*15+partyCount()*8+officeTrustBonus();
  return Math.round(base*(1+ST.reb*0.05));
}
function officeDailyMat(){return officeRank();} /* 支店以上で強化石も日次で貯まる(0..4) */
function officeAccrueDays(){const tdn=todayNum();const c=(ST.office&&ST.office.claim)||tdn;return Math.min(OFFICE_CAP_DAYS,Math.max(0,tdn-c));}
function officePending(){const d=officeAccrueDays();return {days:d,coins:officeDailyCoins()*d,mat:officeDailyMat()*d};}
function officeClaim(){
  const tdn=todayNum(),p=officePending();
  if(p.days<=0)return null;
  ST.coins+=p.coins;ST.mat=(ST.mat||0)+p.mat;
  /* 出勤した仲間の信頼度が受取日数分だけ育つ */
  for(const c of COMPANIONS)if(ST.party&&ST.party[c.id])ST.office.trust[c.id]=trustPts(c.id)+p.days;
  ST.office.claim=tdn;saveST();return p;
}
/* 事務所ボーナス合計(ホーム/事務所での実感表示用) */
function officeBonusRows(){
  return [
    {ic:"🪙",label:"コイン",val:officeBonus("coin"),suf:"%"},
    {ic:"📖",label:"XP",val:officeBonus("xp"),suf:"%"},
    {ic:"⏱",label:"制限時間",val:officeBonus("t"),suf:"秒"},
    {ic:"🧙",label:"おすすめ",val:officeBonus("reco"),suf:"問"},
    {ic:"💰",label:"顧問料/日",val:officeDailyCoins(),suf:"コイン",always:1}
  ];
}

/* ---------- 建設 ---------- */
function buildFac(id){
  const nx=officeNextFac(id);if(!nx||ST.coins<nx.cost)return;
  const before=officeRank();
  ST.coins-=nx.cost;ST.office.fac[id]=facTier(id)+1;
  const after=officeRank();
  SFX.buy();
  if(after>before){ST.office.lv=after;bigBanner("🎉 事務所が発展! "+OFFICE_RANKS[after],"#C58900",18);SFX.levelup();confetti(40);}
  saveST();office();
}
/* 顧問料の受け取り */
function claimOffice(){
  const p=officeClaim();if(!p)return;
  SFX.coin();
  if(typeof coinBurst==="function")coinBurst(document.querySelector(".coin-chip"),8);
  bigBanner("💰 顧問料 +"+p.coins+"コイン"+(p.mat?" +強化石"+p.mat:""),"#C58900",16);
  office();
}

/* ---------- 描画 ---------- */
function office(){
  stopTimer();hideOvlSilent();
  if(typeof setBgmScene==="function")setBgmScene("town");
  const rank=officeRank(),pend=officePending();
  /* 顧問料カード(貯まっていれば受取ボタン・無ければ次回目安) */
  const daily=officeDailyCoins(),dmat=officeDailyMat();
  const claimCard=`<div class="office-claim" style="background:linear-gradient(135deg,#FFF3C4,#FFE1EB);border-radius:12px;padding:11px 12px;margin:8px 0">
    <div style="display:flex;justify-content:space-between;align-items:center;gap:8px">
      <b style="font-size:13px">💰 顧問料(放置収益)</b>
      <span style="font-size:10px;color:#8A7500">${daily}コイン${dmat?"+石"+dmat:""}/日 ・ 最大${OFFICE_CAP_DAYS}日</span></div>
    ${pend.days>0
      ?`<button class="btn go-btn" style="width:100%;margin-top:8px;padding:11px;font-size:14px" onclick="claimOffice()">
          ${px("coin",18)} ${pend.days}日分を受け取る → +${pend.coins}コイン${pend.mat?" +強化石"+pend.mat:""}</button>`
      :`<div class="sub2" style="margin-top:6px">今日の顧問料は受取済み。明日また事務所へ(施設・仲間を育てるほど増える)</div>`}
  </div>`;
  /* 事務所ボーナス合計 */
  const bonusRows=officeBonusRows().filter(r=>r.always||r.val>0)
    .map(r=>`<span class="ob-chip" style="display:inline-block;background:#EFEAF8;border-radius:8px;padding:3px 8px;margin:2px;font-size:11px;font-weight:800">${r.ic}${esc(r.label)} +${r.val}${r.suf}</span>`).join("");
  const bonusPanel=`<div style="background:#F7F4FF;border-radius:12px;padding:9px 10px;margin:8px 0">
    <div style="font-size:11px;font-weight:900;color:#6B5AA6;margin-bottom:3px">📊 事務所ボーナス合計(育てるほど伸びる)</div>
    <div>${bonusRows}</div></div>`;
  /* 次の目標: 最も安い次段階を提示 */
  const nexts=FACILITIES.map(f=>({f,nx:officeNextFac(f.id)})).filter(x=>x.nx).sort((a,b)=>a.nx.cost-b.nx.cost);
  const goal=nexts.length
    ?`<div class="banner" style="background:#EAF1FF;font-size:11px">🎯 次の目標: <b>${esc(nexts[0].f.name)}</b>を${facTier(nexts[0].f.id)>0?"強化":"建設"}(${esc(nexts[0].nx.label)}) ｜ あと <b>${Math.max(0,nexts[0].nx.cost-ST.coins)}</b> コイン</div>`
    :`<div class="banner" style="background:#DFF5EC;font-size:11px">🏆 全施設MAX! 顧問料と仲間の信頼度で稼ぎ続けよう</div>`;
  /* 施設カード */
  const rows=FACILITIES.map(f=>{
    const tr=facTier(f.id),nx=officeNextFac(f.id);
    const cur=tr>0?f.tiers[tr-1].label:"未建設";
    return `<div class="fac-card ${tr>0?"built":""}">
      <div class="fac-ic">${px(f.icon in PX?f.icon:"scroll",34)}</div>
      <div class="fac-body"><b>${esc(f.name)} ${"★".repeat(tr)}${"☆".repeat(3-tr)}</b>
        <span class="fac-cur">${esc(cur)}</span></div>
      ${nx?`<button class="btn buy-btn" onclick="buildFac('${f.id}')" ${ST.coins>=nx.cost?"":"disabled"}>
        ${px("coin",12)}${nx.cost}<br><small>${tr>0?"強化":"建設"}→${esc(nx.label)}</small></button>`
        :`<span class="fac-max">MAX</span>`}
    </div>`;}).join("");
  /* 出勤中の仲間(信頼度) */
  const staff=COMPANIONS.filter(c=>ST.party&&ST.party[c.id]);
  const staffHtml=staff.length
    ? staff.map(c=>{
        const lv=trustLv(c.id),nx=trustNext(c.id),pt=trustPts(c.id);
        const prog=nx?Math.min(100,Math.round((pt-(lv>0?TRUST_TIERS[lv-1]:0))/(nx-(lv>0?TRUST_TIERS[lv-1]:0))*100)):100;
        return `<div class="fac-card built">
          <div class="fac-ic">${px(c.sp,30)}</div>
          <div class="fac-body"><b>${esc(c.name.split("・").pop())} ${"★".repeat(lv)}${"☆".repeat(3-lv)}</b>
            <span class="fac-cur">信頼 ${pt}pt ${lv>0?`・顧問料+${lv*2}/日`:""}</span>
            <div class="mi-bar" style="margin-top:3px"><i style="width:${prog}%;background:var(--purple)"></i></div>
            <span class="fac-cur" style="font-size:8.5px">${nx?`次の★まで あと${nx-pt}pt`:"信頼MAX"}</span></div>
        </div>`;}).join("")
    : `<div class="banner" style="font-size:11px">章をクリアすると仲間が事務所に加わり、顧問料を稼いでくれる(いま ${partyCount()}人)</div>`;
  app.innerHTML=`
  <div class="topbar">
    <button class="small-btn" onclick="home()">← 拠点へ</button>
    <span style="font-weight:900;font-size:14px">🏢 わたしの事務所</span>
    <span class="coin-chip">${px("coin",14)} ${ST.coins}</span>
  </div>
  <div class="office-hero">
    <div class="office-rank dot">${OFFICE_RANKS[rank]}</div>
    <div class="sub2">施設を建て仲間を育てるほど、恒常ボーナスと日次の顧問料が増える稼ぐ拠点。効果はバトル・報酬にも効く。</div>
    <div class="office-prog">発展度 ${officeFacPoints()}/12</div>
  </div>
  ${claimCard}
  ${bonusPanel}
  ${goal}
  <div class="sec">施設(建てるほど事務所が育ち、顧問料も増える)</div>
  ${rows}
  <div class="sec">🤝 出勤中の仲間(顧問料を受け取るほど信頼度が育つ)</div>
  ${staffHtml}
  <div class="footer-note">デスク=コイン / 本棚=XP / 時計=制限時間 / 掲示板=おすすめ数。顧問料は放置で貯まり最大${OFFICE_CAP_DAYS}日分。<br>全施設MAXで「社労士法人 本社」に到達。</div>`;
}
window.office=office;window.buildFac=buildFac;window.claimOffice=claimOffice;
