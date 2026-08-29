"use strict";
/* ============================================================
   ui-ladder.js — 中ボス階段(ボスまでの道のり)の描画レイヤー
   ・「雑魚 → 中ボス1 → 中ボス2 → 科目ボス」を1本のラダーで可視化。
   ・修行(train)HUDの組み立て。中ボス戦中はそのHPを主役に見せる。
   ・返すのはHTML文字列のみ(DOM非依存)。生値は esc() で無害化(XSS防止)。
   ・値は engine/game-data のグローバル(masteryPct/unlockNeed/BOSSES/SUBJECTS)を実行時参照。
   ============================================================ */

/* ラダー1本: 現在地(撃破済み✓ / 交戦中⚔ / 未踏◇)と科目ボスの解放状態を表示 */
function trainLadder(si,G){
  const roster=(typeof midbossRoster==="function")?midbossRoster(si):[];
  const stage=(G&&G.mbStage!=null)?G.mbStage
    :((typeof gameState!=="undefined"&&gameState.midboss&&gameState.midboss[si])||0);
  const bossName=(typeof BOSSES!=="undefined"&&BOSSES[si])?BOSSES[si].name:"科目ボス";
  const bossOpen=(typeof masteryPct==="function"&&typeof unlockNeed==="function")
    ?(masteryPct(si)*100>=unlockNeed()):false;
  let html=`<span class="lad-node done">🗡雑魚</span>`;
  roster.forEach((m,i)=>{
    const cleared=i<stage,active=!!(G&&G.mb&&i===stage);
    const cls=cleared?"done":active?"active":"todo";
    const mark=cleared?"✓":active?"⚔":"◇";
    html+=`<span class="lad-arrow">›</span><span class="lad-node ${cls}">${mark}${esc(m.short||m.n)}</span>`;
  });
  const bossDone=stage>=roster.length&&bossOpen;
  html+=`<span class="lad-arrow">›</span><span class="lad-node ${bossDone?"boss-open":"boss-lock"}">${bossDone?"👑":"🔒"}${esc(bossName)}</span>`;
  return `<div class="boss-ladder">${html}</div>`;
}

/* 修行(train)モードのHUD。中ボス戦中はそのHPバーを主役にし、下にラダーを添える */
function trainHud(G,mp,nd){
  const si=G.boss;
  const ladder=trainLadder(si,G);
  if(G.mb){
    const m=G.mb,pct=Math.max(0,Math.min(100,m.hp/m.hpMax*100));
    /* 殿(2026-08-15): 敵の体力だけ表示。街道/撃破数/制圧/ラダーは出さない */
    return `<div class="hp-big" id="hpbig">⚑ ${esc(m.n)} <b style="color:var(--purple)">HP${m.hp}</b><small>/${m.hpMax}</small></div>
      <div class="hpbar"><i id="bosshp" style="width:${pct}%;background:linear-gradient(90deg,#8A6FD1,#FF6B9D)"></i></div>`;
  }
  /* 物語戦: 敵は物語のヴィラン1体だけ。雑魚ロスター(mobFoe)の名前を混ぜない(殿2026-08-28:
     物語の敵カードの下に別の雑魚名が出て、誰と戦っているのか分からなかった)。 */
  if(G.storyVid&&G.storyHPMax){
    const nm=(G.storyFoe&&G.storyFoe.n)||"歪みの具象";
    const shp=(G.storyHP!=null)?G.storyHP:G.storyHPMax;
    const spct=Math.max(0,Math.min(100,shp/G.storyHPMax*100));
    return `<div class="hp-big" id="hpbig">⚔ ${esc(nm)} <b style="color:var(--pink)">HP${shp}</b><small>/${G.storyHPMax}</small></div>
      <div class="hpbar"><i id="bosshp" style="width:${spct}%;background:linear-gradient(90deg,#E8484F,#FF8A3D)"></i></div>
      <div class="hp-label">⚔ 正解で斬りつけ、HPを削り切れば撃破 — 物語が先へ進む</div>`;
  }
  const metal=G.metal;
  /* 撃破ボーナス/レアドロップの「あと◯体」表示は削除(殿: 記載いらない 2026-08-14)。報酬の仕組みは据え置き */
  /* 目の前の悪徳者のHPを主表示に(複数問で論破する持続戦)。メタル中はメタルHPを優先。 */
  const foe=(typeof mobFoe==="function")?mobFoe(si,G.foeIdx):null;
  const fn=foe?foe.n:"悪徳の手下";
  const hpm=(G.mobHPMax>0)?G.mobHPMax:((foe&&foe.el)?4:((foe&&foe.gd)?2:3));
  const hp=(G.mobHP&&G.mobHP>0)?G.mobHP:hpm;
  const pct=Math.max(0,Math.min(100,hp/hpm*100));
  if(metal){
    /* メタルは「あと◯問で逃走」だけが攻略情報なので残す */
    return `<div class="hp-big" id="hpbig">✨ メタル 残りHP<b style="color:#C58900">${metal.hp}</b> ｜ あと${metal.turns}問</div>
      <div class="hpbar"><i style="width:${Math.max(0,Math.min(100,metal.hp/metal.hpMax*100))}%;background:linear-gradient(90deg,var(--mint),var(--yellow))"></i></div>`;
  }
  return `<div class="hp-big" id="hpbig">⚔ ${esc(fn)} <b style="color:var(--pink)">HP${hp}</b><small>/${hpm}</small></div>
    <div class="hpbar"><i id="bosshp" style="width:${pct}%;background:linear-gradient(90deg,#E8484F,#FF8A3D)"></i></div>`;
}
if(typeof window!=="undefined"){window.trainLadder=trainLadder;window.trainHud=trainHud;}
