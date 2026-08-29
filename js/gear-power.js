"use strict";
/* ============================================================
   gear-power.js — 装備強化の深化・セット効果・総合戦力(M4)
   殿の声「装備を強くしないといけない感が薄い」への回答。
   ・強化(+N): 素材「強化石(mat)」+コインで shop から計画的に上げる。代表stat(itemMainKey)が伸びる。
   ・凸(toppa): ガチャのダブりで限界突破=強化上限を +ENH_PER_TOPPA 拡張し、代表statも+1。
   ・進化: +5「覚醒」/+10「極」で名称バッジと振り味が変わる(見た目のみ)。
   ・セット効果: 特定の武器+防具+装飾を揃えるとボス追撃・コイン/XP/時間の恒常ボーナス。
   ・総合戦力(power): 装備stat+強化+凸+セット+Lv を1つの数値に。各ボスに推奨戦力を設定し、
     不足なら苦戦(HPを控えめにスケール)=「鍛えよ」と明示。正解し続ければ必ず勝てる非懲罰設計。
   厳守: 判定・出題・答えは一切いじらない(戦力は攻撃/演出/表示のみ)。旧セーブ安全初期化。
   依存(実行時 typeof 参照。engine より後にロード): ST/ITEM/ITEMS/RAR/BOSSES/eqItem/eqStat/
     enhLv/ENH_MAX/playerDmg/playerShield/bossHPMax/SFX/px 等。
   ============================================================ */

/* ---------- 凸(限界突破)・強化上限 ---------- */
const ENH_PER_TOPPA=2;   /* 1凸ごとに強化上限を +2 */
const TOPPA_MAX=5;       /* ダブり凸の上限(cap 5 → 最大 +15) */
function toppaLv(id){return (typeof ST!=="undefined"&&ST.toppa&&ST.toppa[id])||0;}
function enhCap(id){return (typeof ENH_MAX!=="undefined"?ENH_MAX:5)+toppaLv(id)*ENH_PER_TOPPA;}
/* 代表statへ乗る強化総量 = +N(enh) + 凸(toppa は1つ+1) */
function enhStatBonus(id){return ((typeof enhLv==="function")?enhLv(id):0)+toppaLv(id);}
/* 全所持装備の凸合計(コレクション価値表示用) */
function totalToppaAll(){let n=0;if(typeof ST!=="undefined")for(const id in (ST.toppa||{}))n+=toppaLv(id);return n;}

/* ---------- 強化コスト曲線(「鍛える」目的を作る) ---------- */
/* +N→+N+1 の費用。段が上がるほど非線形に重く=最終段は本気の投資 */
function enhCost(id){const lv=(typeof enhLv==="function")?enhLv(id):0;
  return {coin:80+lv*lv*35+lv*40, mat:1+Math.floor(lv/2)};}
function canEnhance(id){
  if(typeof ST==="undefined"||!ST.inv[id])return false;
  if(((typeof enhLv==="function")?enhLv(id):0)>=enhCap(id))return false;
  const c=enhCost(id);return ST.coins>=c.coin&&(ST.mat||0)>=c.mat;
}
/* shop の「強化する」アクション。判定・出題には一切触れない */
function enhanceIt(id){
  if(!canEnhance(id))return false;
  const c=enhCost(id);
  ST.coins-=c.coin;ST.mat=(ST.mat||0)-c.mat;
  const before=(typeof enhLv==="function")?enhLv(id):0;
  ST.enh[id]=before+1;
  if(typeof SFX!=="undefined"){(gearEvolTier(id)>gearEvolTierAt(before))?SFX.special&&SFX.special():SFX.buy&&SFX.buy();}
  if(typeof saveST==="function")saveST();
  if(typeof shop==="function")shop();
  if(typeof gearPreview==="function"&&typeof ITEM!=="undefined"&&ITEM[id])gearPreview(ITEM[id].slot,id);
  return true;
}

/* ---------- 進化(見た目・名称) ---------- */
function gearEvolTierAt(lv){return lv>=10?2:lv>=5?1:0;}
function gearEvolTier(id){return gearEvolTierAt((typeof enhLv==="function")?enhLv(id):0);}
const EVOL_BADGE=["","☆覚醒","★極"];
const EVOL_COL=["","#C58900","#FF3D7E"];
/* 表示名の進化バッジ(名称そのものは不変=データを壊さない。バッジと色で進化を魅せる) */
function gearEvolBadge(id){const t=gearEvolTier(id);
  return t?`<span style="font-size:8px;font-weight:900;color:#fff;background:${EVOL_COL[t]};border-radius:5px;padding:0 4px;margin-left:2px">${EVOL_BADGE[t]}</span>`:"";}
/* +N / 凸 のまとめ表示(ショップ・ステータス共通) */
function gearPlusLabel(id){
  const e=(typeof enhLv==="function")?enhLv(id):0,tp=toppaLv(id);
  let s="";
  if(e>0)s+=`<b style="color:#C58900">+${e}</b>`;
  if(tp>0)s+=`<b style="color:#7A3BC9"> ★凸${tp}</b>`;
  return s;
}

/* ---------- セット効果 ---------- */
/* 既存アイテムIDで構成(IDは恒久・不変)。need=全装備を同時装備で発動。
   bonus: dmg=常時与ダメ / bossDmg=ボス・真ボス・中ボスへの追撃 / coin,xp=獲得% / t=制限秒 / power=戦力加点 */
const GEAR_SETS=[
 {id:"trial",name:"試練ノ三種",items:["w6","a4","c6"],power:45,bonus:{t:2,bossDmg:1},
  desc:"ショップ最終装備3種(無課金で到達可)。ボスに追撃+1・時間+2秒"},
 {id:"hanrei",name:"判例ノ探究",items:["w7","c5","t2"],power:35,bonus:{xp:20},
  desc:"判例装備を揃える探究者のセット。獲得XP+20%"},
 {id:"divine",name:"神威ノ法",items:["w8","a6","t6"],power:85,bonus:{coin:15,xp:15,bossDmg:2},
  desc:"伝説の六法+法衣+社労士神。ボス追撃+2・コイン/XP+15%"},
 {id:"rainbow",name:"虹天ノ三神",items:["w9","a7","c9"],power:130,bonus:{coin:25,xp:25,t:3,bossDmg:3},
  desc:"LR3種の最上位セット。ボス追撃+3・コイン/XP+25%・時間+3秒"}
];
function setActive(set){
  if(typeof ST==="undefined"||typeof ITEM==="undefined")return false;
  return set.items.every(id=>ITEM[id]&&ST.eq[ITEM[id].slot]===id);
}
function activeSets(){return GEAR_SETS.filter(setActive);}
function setBonus(key){let v=0;for(const s of activeSets())if(s.bonus&&s.bonus[key])v+=s.bonus[key];return v;}
/* 装備無効モード(実力測定 startLast/mock/demon)ではセット効果も無効=公平 */
function setBossDmg(){if(typeof isExam==="function"&&isExam())return 0;return setBonus("bossDmg");}
/* 揃うまであと何個か(導線用): 最も揃っているセットの不足数 */
function nearestSet(){
  let best=null;
  for(const s of GEAR_SETS){
    const have=s.items.filter(id=>ITEM[id]&&ST.eq[ITEM[id].slot]===id).length;
    const miss=s.items.length-have;
    if(miss===0)continue;
    if(!best||miss<best.miss)best={set:s,miss,have};
  }
  return best;
}

/* ---------- 総合戦力(power) ---------- */
/* 戦闘に効く要素を重み付け合算。playerDmg には eqStat(dmg)+強化+凸+セットdmg が既に乗る */
function powerPerEnh(){return 12;} /* 武器+1(=dmg+1) ≒ 戦力+12 */
function playerPower(){
  if(typeof ST==="undefined")return 0;
  let p=ST.lv*4+ST.reb*30;
  p+=((typeof playerDmg==="function")?playerDmg():1)*powerPerEnh();
  p+=((typeof playerShield==="function")?playerShield():0)*10;
  if(typeof eqStat==="function"){
    p+=eqStat("t")*2+eqStat("crit")*6;
    p+=(eqStat("coin")+eqStat("xp"))*0.4+eqStat("luck")*0.3;
  }
  p+=activeSets().reduce((s,st)=>s+(st.power||30),0);
  return Math.round(p);
}
/* 各ボスの推奨戦力。HP・章・周回と同じドライバでスケール(bossHPMax と整合) */
function bossPowerReq(i){
  const hp=(typeof bossHPMax==="function")?bossHPMax(i):(10+i*7);
  const loop=(typeof ST!=="undefined"?ST.loop:1)||1;
  return Math.round(40+i*35+hp*3+(loop-1)*40);
}
function trueBossPowerReq(){
  const w=(typeof ST!=="undefined"?ST.trueWin:0)||0;
  return Math.round(360+w*60);
}
/* 中ボスの推奨戦力(科目ボスの手前=6割目安) */
function mbPowerReq(si){return Math.round(bossPowerReq(si)*0.6);}
/* 戦力比(1.0で推奨ぴったり)。0で除算しない */
function powerRatio(req){const p=playerPower();return req>0?p/req:1;}
/* 推奨に届くまで、装備中の武器をあと何回強化すればよいか(導線「あと強化◯」) */
function enhToReach(req){
  const p=playerPower(),gap=req-p;
  if(gap<=0)return 0;
  return Math.ceil(gap/powerPerEnh());
}

/* ---------- 戦力想定でのHPスケール(苦戦を作るが理不尽にしない) ---------- */
/* 戦力が推奨以上 → 素のHP(=既存 bossHPMax と完全一致。クリア済ユーザーは今まで通り)。
   不足 → 最大+50%までHP増(=解く問題数が増えるだけ。正解し続ければ必ず勝てる/即死なし)。 */
function hpScale(req){
  const r=powerRatio(req);
  if(r>=1)return 1;
  const deficit=Math.min(1,1-r);
  return 1+Math.min(0.5,deficit*0.6);
}
function bossHPScaled(i){
  const base=(typeof bossHPMax==="function")?bossHPMax(i):(10+i*7);
  return Math.round(base*hpScale(bossPowerReq(i)));
}
function trueHPScaled(base){return Math.round(base*hpScale(trueBossPowerReq()));}
/* 中ボスHP: 素は 3〜4 と小さいので、戦力不足でも最大 +2 に抑える(テンポを壊さない) */
function mbHPScaled(base,si){
  const bumped=Math.round(base*hpScale(mbPowerReq(si)));
  return Math.min(base+2,bumped);
}

/* ---------- 素材(強化石)ドロップ ---------- */
function matGain(n){if(typeof ST!=="undefined")ST.mat=(ST.mat||0)+(n|0);}

/* ---------- 表示部品(純粋な文字列。DOM非依存・XSS: 動的生値は入れない) ---------- */
/* 次に挑むべき未討伐ボスの index(全討伐なら真ボス=-1) */
function nextTargetBoss(){
  if(typeof BOSSES==="undefined")return 0;
  for(let i=0;i<BOSSES.length;i++)if(!(ST.badges&&ST.badges[i]))return i;
  return -1;
}
/* shop 冒頭の「総合戦力 vs 次のボス推奨」パネル。鍛える→挑むの導線の核 */
function powerPanelHtml(){
  const pw=playerPower(),tgt=nextTargetBoss();
  const isTrue=(tgt<0);
  const req=isTrue?trueBossPowerReq():bossPowerReq(tgt);
  const name=isTrue?"厚生労働神(真ボス)":(BOSSES[tgt]?BOSSES[tgt].name:"ボス");
  const ok=pw>=req,need=enhToReach(req);
  const pct=Math.min(100,Math.round(pw/req*100));
  const col=ok?"#2B9E82":pct>=70?"#C58900":"#E8484F";
  const verdict=ok?"⚔ 討伐圏!挑めば勝てる":`あと強化 <b>${need}</b> でクリア圏 — 装備を鍛えよ`;
  const sets=activeSets(),near=nearestSet();
  const setLine=sets.length
    ?`🔗 発動中セット: ${sets.map(s=>`<b style="color:#7A3BC9">${s.name}</b>`).join(" / ")}`
    :(near?`🔗 セットまで <b>あと${near.miss}個</b>(${near.set.name})`:"");
  return `<div class="power-panel" style="background:linear-gradient(135deg,#FFF3C4,#EFEAF8);border-radius:12px;padding:10px 12px;margin:8px 0">
    <div style="display:flex;justify-content:space-between;align-items:baseline">
      <span style="font-weight:900;font-size:13px">⚔ 総合戦力 <b style="font-size:20px;color:${col}">${pw}</b></span>
      <span style="font-size:10.5px;color:#6B6580">次: ${name} 推奨 <b>${req}</b></span>
    </div>
    <div class="mi-bar" style="margin:5px 0"><i style="width:${pct}%;background:${col}"></i></div>
    <div style="font-size:11px;font-weight:700;color:${col}">${verdict}</div>
    ${setLine?`<div style="font-size:10px;color:#6B6580;margin-top:3px">${setLine}</div>`:""}
    <div style="font-size:9.5px;color:#8A8494;margin-top:2px">🪙強化石 ×${(ST.mat||0)} ｜ 敵を倒すと手に入る(強化の素材)</div>
  </div>`;
}
/* 装備中の1品の「強化する」行(コスト・上限・進化を表示) */
function enhanceRowHtml(id){
  if(typeof ITEM==="undefined"||!ITEM[id])return "";
  const it=ITEM[id],lv=(typeof enhLv==="function")?enhLv(id):0,cap=enhCap(id);
  const maxed=lv>=cap;
  const c=enhCost(id);
  const can=canEnhance(id);
  const gain=itemMainKey(it);
  const gainName=({dmg:"⚔ダメ",sh:"🛡盾",t:"⏱時間",crit:"⚡クリ",coin:"🪙コイン",xp:"📖XP",luck:"🍀運",hint:"📖ヒント"}[gain]||gain);
  const bar=`<div class="mi-bar" style="margin:3px 0"><i style="width:${Math.round(lv/cap*100)}%;background:linear-gradient(90deg,#C58900,#FF8A3D)"></i></div>`;
  const btn=maxed
    ?`<span style="font-size:10px;font-weight:900;color:#7A3BC9">${toppaLv(id)>=TOPPA_MAX?"完全体!":"凸で上限UP"}</span>`
    :`<button class="btn buy-btn" onclick="enhanceIt('${id}')" ${can?"":"disabled"}>${px("coin",12)}${c.coin} 🪙${c.mat}</button>`;
  return `<div class="shop-item enh-row" style="align-items:center">
    ${px(it.sp,34)}<span style="flex:1">
      <span class="n" style="font-size:11px">${it.name} ${gearPlusLabel(id)} ${gearEvolBadge(id)}</span>
      <br><span class="fx" style="font-size:9px">強化+${lv}/上限${cap} ｜ ${gainName}+${enhStatBonus(id)}${maxed?"":` → 次+1で ${gainName}強化`}</span>
      ${bar}</span>${btn}</div>`;
}
/* セット一覧(shop 下部・図鑑的な「揃える動機」) */
function setListHtml(){
  const rows=GEAR_SETS.map(s=>{
    const on=setActive(s);
    const have=s.items.filter(id=>ITEM[id]&&ST.eq[ITEM[id].slot]===id).length;
    const icons=s.items.map(id=>{
      const owned=ST.inv[id],eq=ITEM[id]&&ST.eq[ITEM[id].slot]===id;
      return `<span style="opacity:${eq?1:owned?0.55:0.25}">${px(ITEM[id].sp,20)}</span>`;
    }).join("");
    return `<div class="shop-item ${on?"legend":""}" style="align-items:center">
      <span>${icons}</span>
      <span style="flex:1"><span class="n" style="font-size:11px">${on?"✅ ":""}${s.name} <small style="color:#8A8494">(${have}/${s.items.length})</small></span>
        <br><span class="fx" style="font-size:9px">${s.desc}</span></span></div>`;
  }).join("");
  return `<div class="sec">🔗 セット効果(揃えると発動・装備画面で確認)</div>${rows}`;
}

if(typeof window!=="undefined"){
  window.ENH_PER_TOPPA=ENH_PER_TOPPA;window.TOPPA_MAX=TOPPA_MAX;
  window.toppaLv=toppaLv;window.enhCap=enhCap;window.enhStatBonus=enhStatBonus;window.totalToppaAll=totalToppaAll;
  window.enhCost=enhCost;window.canEnhance=canEnhance;window.enhanceIt=enhanceIt;
  window.gearEvolTier=gearEvolTier;window.gearEvolBadge=gearEvolBadge;window.gearPlusLabel=gearPlusLabel;
  window.GEAR_SETS=GEAR_SETS;window.setActive=setActive;window.activeSets=activeSets;window.setBonus=setBonus;
  window.setBossDmg=setBossDmg;window.nearestSet=nearestSet;
  window.playerPower=playerPower;window.powerPerEnh=powerPerEnh;window.bossPowerReq=bossPowerReq;
  window.trueBossPowerReq=trueBossPowerReq;window.mbPowerReq=mbPowerReq;window.powerRatio=powerRatio;window.enhToReach=enhToReach;
  window.bossHPScaled=bossHPScaled;window.trueHPScaled=trueHPScaled;window.mbHPScaled=mbHPScaled;
  window.matGain=matGain;window.nextTargetBoss=nextTargetBoss;
  window.powerPanelHtml=powerPanelHtml;window.enhanceRowHtml=enhanceRowHtml;window.setListHtml=setListHtml;
}
