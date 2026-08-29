"use strict";
/* ============================================================
   region.js — 地域の物語的状態(第1地域「労基」限定)
   「問題を解く→世界が変わる」を最初の1地域で成立させる。
   状態はクエスト進行(msq.ch/step・習得数・ボス討伐・事件解決)から算出。
   区分は5段階で排他・欠番なし: 未解決→調査中→ボス出現→解決→復興。
   既存の第1章/事件簿(rouki)・BOSSES[0]・MSQ_STORY[0] を活かし重複実装しない。
   ============================================================ */
const REGION_STATES=["unresolved","investigating","boss","resolved","revived"];
/* 各状態の見た目と物語(色/アイコン/背景の一言/NPCの一言)。
   NPCは既存の第1章キャラ(ghost=被害社員, oni=監督官ロウキ, hero=あなた)を流用。 */
const REGION_META={
 unresolved:{jp:"未解決",icon:"🏚️",sp:"skull",col:"#8A3B3B",bg:"#F3E5E5",
  land:"残業マグマの黒煙が村を覆っている。誰も声を上げられない。",
  npcSp:"ghost",npc:"月120時間の残業…同期は駅のホームで倒れた。誰か、助けて。"},
 investigating:{jp:"調査中",icon:"🔍",sp:"scroll",col:"#B07A00",bg:"#FBF1D6",
  land:"あなたが調べ始めた。村人が少しずつ口を開き始めている。",
  npcSp:"ghost",npc:"本当は…おかしいと思ってた。話を聞いてくれるのか。"},
 boss:{jp:"ボス出現",icon:"⚔️",sp:"oni",col:"#C0392B",bg:"#FBE3DE",
  land:"証拠は揃った。監督官ロウキが砦の門に立ちはだかる。",
  npcSp:"oni",npc:"残業は情熱の証!文句があるなら労基法で殴ってみせよ!"},
 resolved:{jp:"解決",icon:"⚖️",sp:"hero",col:"#2B62D9",bg:"#E4EDFB",
  land:"ロウキを討伐した。あとは伝票の後始末と、村の立て直しだ。",
  npcSp:"hero",npc:"残業マグマは鎮火した。次は記録を正しく残そう。"},
 revived:{jp:"復興",icon:"🌸",sp:"megami",col:"#2B9E82",bg:"#DFF5EC",
  land:"定時に灯りが消える。休日が戻り、村に笑顔が芽吹いた。",
  npcSp:"ghost",npc:"定時で帰れる日が来るなんて。あなたのおかげです。"}
};
/* 進行度 → 状態(第1地域=章ch、既定0)。
   参照する事実: 事件解決(MSQ_CASE[ch]) / ボス討伐(eKill[ch]) / 修行段階(msq.step) / 習得数。 */
function regionState(ch){
  ch=ch|0;
  const m=ST.msq;
  const caseId=(typeof MSQ_CASE!=="undefined")?MSQ_CASE[ch]:null;
  const caseCleared=!!(caseId&&ST.cases[caseId]&&ST.cases[caseId].cleared);
  const bossKilled=!!ST.eKill[ch];
  /* 復興: 事件解決済み、または章を完全通過(現在地が先へ進んだ/物語クリア) */
  if(caseCleared||m.done||m.ch>ch)return "revived";
  /* 解決: ボス討伐済み(事件はまだ) */
  if(bossKilled)return "resolved";
  /* ボス出現: 現在地かつ修行ノルマ達成(step>=1) */
  if(m.ch===ch&&(m.step|0)>=1)return "boss";
  /* 調査中: この地域の習得を始めている */
  const mastered=(typeof msqMastered==="function")?msqMastered(ch):0;
  if(mastered>0)return "investigating";
  /* 未解決: まだ手つかず */
  return "unresolved";
}
function regionStateIdx(ch){return REGION_STATES.indexOf(regionState(ch));}
/* 地図に差し込む地域ステータス幕(第1地域)。学習成果を数字でなく世界の変化として見せる。 */
function regionBanner(ch){
  ch=ch|0;
  const s=regionState(ch),me=REGION_META[s],idx=REGION_STATES.indexOf(s);
  const subj=(typeof SUBJECTS!=="undefined")?SUBJECTS[ch]:"労働基準法";
  const corp=(typeof MSQ_STORY!=="undefined"&&MSQ_STORY[ch])?MSQ_STORY[ch].corp:"";
  const pips=REGION_STATES.map((_,i)=>`<span style="width:7px;height:7px;border-radius:50%;background:${i<=idx?me.col:"rgba(0,0,0,.15)"}"></span>`).join("");
  return `<div class="region-card" style="border-color:${me.col};background:${me.bg}">
    <div class="row" style="display:flex;align-items:center;gap:8px">
      <span style="font-size:22px">${me.icon}</span>
      <span style="flex:1">
        <b style="font-size:13px;color:${me.col}">${esc(subj)}の地 ─ ${esc(me.jp)}</b>
        <span style="display:block;font-size:10px;font-weight:800;color:#6B6577">${corp?"帝国「"+esc(corp)+"」":"見習いの旅立ちの地"}</span>
      </span>
      ${px(me.sp,30)}
    </div>
    <div style="display:flex;align-items:center;gap:5px;margin:7px 0 5px">${pips}
      <span style="font-size:9px;font-weight:800;color:${me.col};margin-left:4px">${idx+1}/5 段階</span></div>
    <div style="font-size:11px;font-weight:700;color:#33303E;line-height:1.5">${esc(me.land)}</div>
    <div style="display:flex;align-items:center;gap:7px;margin-top:6px;padding:6px 8px;border-radius:10px;background:rgba(255,255,255,.6)">
      ${px(me.npcSp,24)}<span style="font-size:10.5px;font-style:italic;color:#4A4556;line-height:1.4">「${esc(me.npc)}」</span></div>
  </div>`;
}
window.regionState=regionState;window.regionStateIdx=regionStateIdx;
window.regionBanner=regionBanner;window.REGION_STATES=REGION_STATES;window.REGION_META=REGION_META;
