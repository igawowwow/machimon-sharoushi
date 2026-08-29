"use strict";
/* ============================================================
   ui-collection.js — D1: 装備コレクション図鑑(zukan の「装備」タブ本体)
   ・所持/未所持(未所持はシルエット + 入手経路)。レア度別・シリーズ別に集計。
   ・コンプ率・シリーズ完成・収集報酬(恒久ボーナス/称号)の進捗を可視化=集める動機。
   厳守: 判定・出題には一切触れない(表示のみ)。XSS: 動的生値は入れない(名前は静的データ)。
        幅480px。data-gear/gear-power 未ロードでも安全(呼び出し側がフォールバック)。
   ============================================================ */

/* 未所持のシルエット表示(黒つぶし)。所持は通常スプライト */
function gearIcon(it,size,owned){
 const img=(typeof px==="function")?px(it.sp,size):"";
 return owned?img:`<span style="display:inline-block;filter:brightness(0);opacity:.45">${img}</span>`;
}
function rarTag(r){const R=RAR[r];return `<span class="${R.cls}" style="font-size:8.5px;font-weight:900">${R.n}</span>`;}

/* 1装備セル(所持=名前+レア+強化バッジ / 未所持=??? + 入手経路) */
function gearCell(it){
 const owned=!!(ST.inv&&ST.inv[it.id]);
 const eq=owned&&ST.eq&&ST.eq[it.slot]===it.id;
 const plus=(owned&&typeof gearPlusLabel==="function")?gearPlusLabel(it.id):"";
 const evb=(owned&&typeof gearEvolBadge==="function")?gearEvolBadge(it.id):"";
 const name=owned?esc(it.name):"???";
 const sub=owned?esc(it.fx||""):((typeof gearSource==="function")?gearSource(it):"未入手");
 return `<div class="zukan-cell ${owned?"":"mystery"}" style="${eq?"outline:2px solid var(--yellow,#FFD34D)":""}">
   ${gearIcon(it,34,owned)}<br>${rarTag(it.rar)} ${name} ${plus}${evb}
   <span class="zr">${eq?"✅装備中 ｜ ":""}${sub}</span></div>`;
}

/* シリーズ・カード(揃える動機の核: 進捗バー・完成報酬・セット導線) */
function seriesCardHtml(s){
 const its=seriesItems(s.id);
 const own=its.filter(x=>ST.inv&&ST.inv[x.id]).length;
 const done=own===its.length;
 const setOn=(typeof activeSets==="function")&&activeSets().some(x=>x.id==="s_"+s.id);
 const rewardTxt=[s.reward&&s.reward.coin?`コイン+${s.reward.coin}%`:"",s.reward&&s.reward.xp?`XP+${s.reward.xp}%`:""].filter(Boolean).join("・");
 const cells=its.map(gearCell).join("");
 return `<div class="col-series" style="border:1.5px solid ${s.color}44;border-radius:12px;padding:8px;margin:8px 0;background:${s.color}0C">
   <div style="display:flex;justify-content:space-between;align-items:baseline">
     <span style="font-weight:900;font-size:12.5px;color:${s.color}">${done?"✅ ":""}${esc(s.name)}</span>
     <span style="font-size:9.5px;color:#8A8494">${esc(s.theme)} ｜ ${own}/${its.length}</span></div>
   <div class="mi-bar" style="margin:4px 0"><i style="width:${Math.round(own/its.length*100)}%;background:${s.color}"></i></div>
   <div style="font-size:9px;color:#6B6580;margin-bottom:4px">
     ${done?`🎁 完成報酬(恒久): ${rewardTxt||"称号"}・称号を獲得済み`:`揃えると恒久${rewardTxt||"ボーナス"}＋称号`}
     ${setOn?' ｜ <b style="color:#7A3BC9">🔗セット発動中</b>':""}</div>
   <div class="zukan-grid">${cells}</div></div>`;
}

/* 収集報酬パネル(総収集数の段階ボーナス・現在の恒久%) */
function collectRewardHtml(){
 const c=collectCount();
 const coin=(typeof collectPct==="function")?collectPct("coin"):0;
 const xp=(typeof collectPct==="function")?collectPct("xp"):0;
 const tiers=COLLECT_TIERS.map(t=>{
  const ok=c>=t.n,bonus=[t.coin?`🪙+${t.coin}%`:"",t.xp?`📖+${t.xp}%`:""].filter(Boolean).join("");
  return `<span style="font-size:9px;font-weight:800;padding:2px 6px;border-radius:8px;margin:2px;display:inline-block;
    background:${ok?"#DFF5EC":"#EFECF5"};color:${ok?"#2B9E82":"#8A8494"}">${ok?"✅":"🔒"}${t.label} ${bonus}</span>`;
 }).join("");
 return `<div class="col-reward" style="background:linear-gradient(135deg,#FFF3C4,#EFEAF8);border-radius:12px;padding:10px 12px;margin:8px 0">
   <div style="font-weight:900;font-size:12.5px">🎁 収集報酬 <small style="color:#6B6580;font-weight:700">集めるほど恒久ボーナス</small></div>
   <div style="font-size:11px;font-weight:800;color:#2B62D9;margin:3px 0">現在の恒久ボーナス: 🪙コイン+${coin}% ｜ 📖XP+${xp}%</div>
   <div>${tiers}</div></div>`;
}

/* レア度内訳の帯(コレクター向けの俯瞰) */
function rarBreakdownHtml(){
 const chips=RAR.map((r,i)=>{
  const tot=(typeof rarTotal==="function")?rarTotal(i):ITEMS.filter(x=>x.rar===i).length;
  const ow=(typeof rarOwned==="function")?rarOwned(i):ITEMS.filter(x=>x.rar===i&&ST.inv[x.id]).length;
  if(!tot)return "";
  const full=ow===tot;
  return `<span class="${r.cls}" style="font-size:9px;font-weight:900;margin-right:6px">${r.n} ${ow}/${tot}${full?"✨":""}</span>`;
 }).join("");
 return `<div style="font-size:9px;margin:4px 0;line-height:1.7">${chips}</div>`;
}

/* 非シリーズ装備(基本装備・単発)をスロット別に列挙 */
function otherSlotHtml(sl){
 const its=ITEMS.filter(x=>x.slot===sl&&!x.series);
 if(!its.length)return "";
 const own=its.filter(x=>ST.inv&&ST.inv[x.id]).length;
 const order={N:0,R:1,SR:2,SSR:3,UR:4,LR:5};
 its.sort((a,b)=>a.rar-b.rar);
 return `<div class="sec" style="margin-top:6px">${(typeof SLOT_NAME!=="undefined"?SLOT_NAME[sl]:sl)}(単発・基本) ${own}/${its.length}</div>
   <div class="zukan-grid">${its.map(gearCell).join("")}</div>`;
}

/* 図鑑「装備」タブ本体。zukan('i') から呼ばれる */
function gearZukanHtml(){
 const total=ITEMS.length,owned=ITEMS.filter(x=>ST.inv&&ST.inv[x.id]).length;
 const pct=Math.round(owned/total*100);
 const completeSeries=GEAR_SERIES.filter(s=>seriesComplete(s.id)).length;
 const head=`<div class="banner" style="background:linear-gradient(135deg,#EAF1FF,#DFF5EC)">
   <b style="font-size:14px">装備コレクション ${owned}/${total}(${pct}%)</b>
   <span style="font-size:9.5px;color:#6B6580"> ｜ シリーズ完成 ${completeSeries}/${GEAR_SERIES.length}</span>
   ${rarBreakdownHtml()}
   <div style="font-size:9px;color:#6B6580">🛒ショップ・🎰ガチャ・📦宝箱・🏅実績/収集で集めよう。未所持はシルエット表示</div></div>`;
 const reward=collectRewardHtml();
 const series=`<div class="sec">🎽 シリーズ装備(テーマで揃える)</div>`+GEAR_SERIES.map(seriesCardHtml).join("");
 const other=`<div class="sec">🧰 その他の装備</div>`+["w","a","c","t"].map(otherSlotHtml).join("");
 return head+reward+series+other;
}

if(typeof window!=="undefined"){
 window.gearZukanHtml=gearZukanHtml;window.seriesCardHtml=seriesCardHtml;
 window.collectRewardHtml=collectRewardHtml;window.gearCell=gearCell;
}
