"use strict";
/* ============================================================
   ui-bestiary.js — 敵図鑑(ベスティアリ)の描画レイヤー
   ・zukan('e') から呼ばれ、倒した敵が埋まっていくコレクションを表示。
   ・科目別に雑魚を一覧。未遭遇はシルエット(mystery)。討伐で開放。
   ・メタル(激レア)/中ボス/科目ボス/ラスボスも種別ごとに集計。
   ・撃破数・初討伐・遭遇はセーブ(ST.bestiary / ST.midboss / ST.eKill)から読む。
   ・返すのはHTML文字列のみ(DOM非依存)。生値(敵名)は esc() で無害化(XSS防止)。
   ・埋める動機=繰り返し戦う=反復学習。速さでなく「また戦う」を促す設計。
   ============================================================ */

/* 初討伐からの経過(演出用の軽い文言)。dayNum は todayNum()基準 */
function beAgo(f){
  if(f===undefined||f===null||f<0)return "";
  const d=(typeof todayNum==="function")?todayNum()-f:0;
  return d<=0?"本日初討伐":d===1?"昨日初討伐":d+"日前に初討伐";
}
/* 雑魚1体のセル。killed でないとシルエット表示 */
function beCell(si,idx){
  const foe=ENEMIES[si][idx];
  const e=(typeof beGet==="function")?beGet(ST,beKey(si,idx)):null;
  const killed=!!(e&&e.k>0);
  const tag=foe.gd?'<span style="color:#C58900">💰宝</span>':foe.el?'<span style="color:#C0392B">⚔強敵</span>':"";
  if(!killed)return `<div class="zukan-cell mystery">${px(foe.sp,36)}<br>???<span class="zr">未遭遇</span></div>`;
  return `<button class="btn zukan-cell" style="font-family:inherit" onclick="beDetail(${si},${idx})">${px(foe.sp,36)}<br>${esc(foe.n)}<span class="zr">⚔${e.k}体 ${tag}</span></button>`;
}
/* メタル1体のセル */
function beMetalCell(i){
  const m=METAL[i];
  const e=(typeof beGet==="function")?beGet(ST,"M"+i):null;
  const killed=!!(e&&e.k>0),seen=!!(e&&e.s>0);
  if(!killed&&!seen)return `<div class="zukan-cell mystery">${px(m.sp,36)}<br>???<span class="zr">未遭遇</span></div>`;
  const label=killed?`⚔${e.k}討伐`:"遭遇のみ";
  return `<button class="btn zukan-cell${killed?" metal-cell":""}" style="font-family:inherit" onclick="beMetalDetail(${i})">${px(m.sp,36)}<br>${killed?esc(m.n):"？"+esc(m.rank)+"？"}<span class="zr">${label}</span></button>`;
}
/* 敵図鑑タブ本体(zukan('e') から差し込む) */
function bestiaryTab(){
  const st=(typeof bestiaryStats==="function")?bestiaryStats(ST):{disc:0,total:0,pct:0};
  let body=`<div class="banner">👹 撃破した敵が図鑑に刻まれる ─ コンプ率 <b>${st.pct}%</b>(${st.disc}/${st.total}種)｜ 累計撃破 <b>${ST.mobKills||0}</b>体 ｜ ✨メタル討伐 <b>${ST.metalKills||0}</b></div>`;
  /* メタル(激レア) */
  body+=`<div class="sec">✨ メタル系(激レア・大当たり)</div><div class="zukan-grid">${METAL.map((_,i)=>beMetalCell(i)).join("")}</div>`;
  /* 科目別の雑魚 */
  for(let si=0;si<ENEMIES.length;si++){
    const row=ENEMIES[si];
    let dk=0;for(let i=0;i<row.length;i++){const e=beGet(ST,beKey(si,i));if(e&&e.k>0)dk++;}
    body+=`<div class="sec">${esc(SUBJECTS[si])} <span style="color:#8A8494;font-weight:700">(${dk}/${row.length})</span></div>
      <div class="zukan-grid">${row.map((_,i)=>beCell(si,i)).join("")}</div>`;
  }
  /* 中ボス */
  let mbCells="";
  for(let si=0;si<MIDBOSS.length;si++){
    const done=(ST.midboss&&ST.midboss[si])||0;
    MIDBOSS[si].forEach((m,ti)=>{
      const killed=ti<done;
      mbCells+=killed
        ?`<div class="zukan-cell">${px(m.sp,36)}<br>${esc(m.short||m.n)}<span class="zr">👑撃破</span></div>`
        :`<div class="zukan-cell mystery">${px(m.sp,36)}<br>???<span class="zr">中ボス</span></div>`;
    });
  }
  body+=`<div class="sec">⚑ 中ボス(道中の門番)</div><div class="zukan-grid">${mbCells}</div>`;
  /* 科目ボス+ラスボス(既存の eKill / clears / trueWin から) */
  let bCells=BOSSES.map((b,i)=>{
    const seen=ST.eSeen&&ST.eSeen[i],kill=ST.eKill&&ST.eKill[i];
    return `<div class="zukan-cell ${seen?"":"mystery"}">${px(b.sp,36)}<br>${seen?esc(b.name):"???"}<span class="zr">${kill?"👑討伐済":seen?"遭遇":"未遭遇"}</span></div>`;
  }).join("");
  const godSeen=(typeof badgeCount==="function"&&badgeCount()>=9)||ST.clears>=1;
  bCells+=`<div class="zukan-cell ${godSeen?"":"mystery"}">${px("god",36)}<br>${godSeen?"試験の神":"???"}<span class="zr">${ST.clears>=1?"👑撃破":"未討伐"}</span></div>`;
  bCells+=`<div class="zukan-cell ${ST.clears>=1?"":"mystery"}">${px("mao",36)}<br>${ST.clears>=1?"厚生労働神":"???"}<span class="zr">${ST.trueWin?"👑撃破":"未討伐"}</span></div>`;
  body+=`<div class="sec">👑 科目ボス・ラスボス</div><div class="zukan-grid">${bCells}</div>`;
  return body;
}
/* 雑魚の詳細(討伐済みのみ) */
function beDetail(si,idx){
  const foe=ENEMIES[si][idx];
  const e=beGet(ST,beKey(si,idx));if(!e||!e.k)return;
  const kind=foe.gd?"💰 宝を落とすことがある雑魚":foe.el?"⚔ たまに出る強めの雑魚":"街道の雑魚";
  showOvl(`${px(foe.sp,64,"floaty")}
    <h3>${esc(foe.n)}</h3>
    <div class="sub2">${esc(SUBJECTS[si])}街道 ｜ ${kind}</div>
    <div class="stat-row"><span>⚔ 撃破数</span><b>${e.k}体</b></div>
    <div class="stat-row"><span>🗓 初討伐</span><b>${beAgo(e.f)}</b></div>
    <button class="btn go-btn" style="width:100%;margin-top:10px;padding:11px" onclick="hideOvl()">とじる</button>`);
}
/* メタルの詳細 */
function beMetalDetail(i){
  const m=METAL[i],e=beGet(ST,"M"+i);if(!e)return;
  showOvl(`${px(m.sp,64,"floaty")}
    <h3>✨ ${esc(m.n)}</h3>
    <div class="sub2">メタル系【${esc(m.rank)}】 ─ 硬いが倒せば大当たり</div>
    <div class="stat-row"><span>⚔ 討伐数</span><b>${e.k||0}体</b></div>
    <div class="stat-row"><span>👀 遭遇数</span><b>${e.s||0}回</b></div>
    <div class="stat-row"><span>💰 撃破報酬(目安)</span><b>${m.coin}コイン / ${m.xp}XP</b></div>
    ${e.k?`<div class="stat-row"><span>🗓 初討伐</span><b>${beAgo(e.f)}</b></div>`:'<div class="sub2" style="margin-top:6px">まだ討伐できていない…次こそトドメを!</div>'}
    <button class="btn go-btn" style="width:100%;margin-top:10px;padding:11px" onclick="hideOvl()">とじる</button>`);
}
if(typeof window!=="undefined"){
  window.bestiaryTab=bestiaryTab;window.beDetail=beDetail;window.beMetalDetail=beMetalDetail;
}
