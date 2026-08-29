"use strict";
/* ============================================================
   gear-fx.js — 装備ごとの見た目エフェクト(M2)
   ・武器(w*)ごとに撃破/命中の演出を差別化(斬撃・連撃・打撃・光の刃・炎・貫き)
   ・防具/装飾(a* や sh持ち)の被弾ガード発動演出
   ・レア装備(SR以上)は装備チップ・バトル表示にほのかなオーラ
   ・shop/equipで装備を選ぶと攻撃/発動エフェクトのプレビュー
   厳守: 判定は一切いじらない(見た目のみ)。答えを自動で当てない。
        prefers-reduced-motion は簡素化。演出は短く・重ねすぎない・幅480px。
   依存(全て実行時に typeof で参照。単体でも安全): fx.js(FXL/fxAt/flash/shakeApp)・
        engine(eqItem/eqStat)・game-data(ITEM/RAR)・ui-battle(prefersReduce/isExam)。
   ============================================================ */

/* 武器/防具ごとのプロファイル: k=演出種別 / g=飛び散る記号 / c=色 */
const GEAR_FX={
 /* 武器: 種別と手触りを差別化(替えると振り味が変わる) */
 w0:{k:"slash", g:"✧", c:"#E8484F"}, /* 赤ペン=軽い斬撃 */
 w1:{k:"combo", g:"✧", c:"#5B8DFF"}, /* 二刀流=連撃 */
 w2:{k:"slash", g:"✦", c:"#FF6B9D"}, /* マーカー剣=斬撃 */
 w3:{k:"blunt", g:"💢", c:"#C58900"}, /* 六法ハンマー=打撃 */
 w4:{k:"combo", g:"✦", c:"#3E9B4F"}, /* ハチマキ=気合の連撃 */
 w5:{k:"fire",  g:"🔥", c:"#FF8A3D"}, /* 朱印の筆=炎 */
 w6:{k:"light", g:"⚡", c:"#5B8DFF"}, /* エクスカリ六法=光の刃 */
 w7:{k:"pierce",g:"≫", c:"#8A6FD1"}, /* 判例マスター=貫き */
 w8:{k:"light", g:"✨", c:"#FFD34D"}, /* 伝説の六法=黄金の光刃 */
 /* 防具/装飾(sh持ち): ガード発動の固有演出 */
 a1:{k:"guard", g:"🛡", c:"#FFD34D"},
 a2:{k:"guard", g:"🛡", c:"#5B8DFF"},
 a3:{k:"guard", g:"🛡", c:"#3E9B4F"},
 a4:{k:"guard", g:"✧", c:"#FF6B9D"}, /* 女神の羽衣=羽根 */
 a5:{k:"guard", g:"🛡", c:"#8A8494"},
 a6:{k:"guard", g:"✨", c:"#8A6FD1"},
 c7:{k:"guard", g:"✧", c:"#FF6B9D"}, /* 労基の女神(sh) */
 t6:{k:"guard", g:"✨", c:"#C58900"}  /* 社労士神(sh) */
};
/* 未登録装備のフォールバック(レア度で振り味を決める=将来の武器も破綻しない) */
const GEAR_FX_RAR=[
 {k:"slash", g:"✧", c:"#E8484F"},{k:"blunt", g:"💢", c:"#C58900"},
 {k:"combo", g:"✦", c:"#3E9B4F"},{k:"pierce",g:"≫", c:"#8A6FD1"},
 {k:"light", g:"✨", c:"#FFD34D"}];
const GEAR_FX_GUARD={k:"guard", g:"🛡", c:"#5B8DFF"};

/* ---- 低レベル描画(#fxlayer に短命DOMを置く。DOM未整備でも安全に抜ける) ---- */
function gfxLayer(){return (typeof FXL==="function")?FXL():(document.getElementById&&document.getElementById("fxlayer"));}
function gfxAt(el){
  if(typeof fxAt==="function")return fxAt(el);
  const W=(typeof innerWidth!=="undefined")?innerWidth:480,H=(typeof innerHeight!=="undefined")?innerHeight:800;
  return {x:W/2,y:H*0.3};
}
const gfxRaf=(f)=>{(typeof requestAnimationFrame==="function")?requestAnimationFrame(f):setTimeout(f,16);};
function gfxStreak(x,y,cls,color,dur){
  const L=gfxLayer();if(!L)return;
  const s=document.createElement("span");s.className="gfx "+cls;
  s.style.left=x+"px";s.style.top=y+"px";if(color)s.style.setProperty("--gc",color);
  L.appendChild(s);setTimeout(()=>s.remove(),dur||420);
}
function gfxSparks(x,y,glyph,color,n,dist){
  const L=gfxLayer();if(!L)return;
  for(let i=0;i<n;i++){
    const s=document.createElement("span");s.className="gfx-p";s.textContent=glyph;
    s.style.left=x+"px";s.style.top=y+"px";if(color)s.style.color=color;
    L.appendChild(s);
    const a=Math.random()*Math.PI*2,d=Math.abs(dist)*(0.5+Math.random()*0.7);
    gfxRaf(()=>gfxRaf(()=>{s.style.transform=`translate(${Math.cos(a)*d}px,${Math.sin(a)*d}px)`;s.style.opacity="0";}));
    setTimeout(()=>s.remove(),440);
  }
}
function gfxReduce(){return typeof prefersReduce==="function"&&prefersReduce();}

/* ---- プロファイル取得 ---- */
function weaponFxProfile(id){
  const it=id?(typeof ITEM!=="undefined"&&ITEM[id]):(typeof eqItem==="function"&&eqItem("w"));
  const key=id||(it&&it.id);
  if(key&&GEAR_FX[key])return GEAR_FX[key];
  const rar=it?(it.rar||0):0;
  return GEAR_FX_RAR[Math.min(rar,4)];
}
/* いま盾(ミス無効)を供給している装備。防具>装飾>称号の順。演出の主を決める */
function guardSourceItem(){
  if(typeof eqItem!=="function")return null;
  for(const s of ["a","c","t"]){const it=eqItem(s);if(it&&it.st&&it.st.sh)return it;}
  return null;
}

/* ---- 武器の振り演出(命中=撃破の瞬間)。judgeは触らない ---- */
function weaponSwingFx(el,crit,id){
  const p=weaponFxProfile(id);if(!p)return;
  const c=gfxAt(el);
  if(gfxReduce()){gfxStreak(c.x,c.y,"gfx-slash",p.c,260);return;} /* 簡素: 線一本のみ */
  const nb=crit?1.35:1;
  switch(p.k){
    case "combo":
      gfxStreak(c.x-8,c.y-7,"gfx-slash",p.c,300);
      setTimeout(()=>gfxStreak(c.x+8,c.y+7,"gfx-slash",p.c,300),90);
      gfxSparks(c.x,c.y,p.g,p.c,crit?8:5,70*nb);break;
    case "blunt":
      gfxStreak(c.x,c.y,"gfx-ring",p.c,420);
      gfxSparks(c.x,c.y,p.g,p.c,crit?7:4,60);
      if(typeof shakeApp==="function")shakeApp();break;
    case "fire":
      gfxStreak(c.x,c.y,"gfx-ring",p.c,340);
      gfxSparks(c.x,c.y,p.g,p.c,crit?10:7,54);break;
    case "pierce":
      gfxStreak(c.x-40,c.y,"gfx-thrust",p.c,300);
      gfxSparks(c.x+22,c.y,p.g,p.c,crit?6:3,46);break;
    case "light":
      gfxStreak(c.x,c.y,"gfx-beam",p.c,420);
      gfxSparks(c.x,c.y,p.g,p.c,crit?10:6,80*nb);
      if(crit&&typeof flash==="function")flash("#FFF9E0",90);break;
    default: /* slash */
      gfxStreak(c.x,c.y,"gfx-slash",p.c,340);
      gfxSparks(c.x,c.y,p.g,p.c,crit?7:4,66*nb);
  }
}

/* ---- 防具/装飾のガード発動演出 ---- */
function rarColor(rar){return ["#8A8494","#5B8DFF","#8A6FD1","#C58900","#FF3D7E"][Math.min(rar||0,4)];}
function guardFx(el){
  const it=guardSourceItem();
  let p=GEAR_FX_GUARD;
  if(it)p=GEAR_FX[it.id]||Object.assign({},GEAR_FX_GUARD,{c:rarColor(it.rar)});
  const c=gfxAt(el),reduce=gfxReduce();
  gfxStreak(c.x,c.y,"gfx-ring",p.c,reduce?260:400);
  if(!reduce)gfxSparks(c.x,c.y,p.g,p.c,4,44);
}

/* ---- レアオーラのCSSクラス(SR以上に付与) ---- */
function gearAuraCls(it){
  if(!it)return "";
  return it.rar>=4?"gear-aura-ur":it.rar>=3?"gear-aura-ssr":it.rar>=2?"gear-aura-sr":"";
}
/* バトル画面に出す装備中の武器チップ(レアはオーラ)。実力測定モードは装備無効なので非表示 */
function gearBattleChip(){
  if(typeof isExam==="function"&&isExam())return "";
  if(typeof eqItem!=="function")return "";
  const w=eqItem("w");if(!w)return "";
  const au=gearAuraCls(w),sp=(typeof px==="function")?px(w.sp,15):"";
  return `<span class="gbchip ${au}">${sp}<b>${w.name}</b></span>`;
}

/* ---- 装備プレビュー(shop/equipで選んだ瞬間に演出を再生) ---- */
function gearPreview(slot,id){
  const anchor=(document.querySelector&&(document.querySelector(".logo")||document.querySelector(".coin-chip")))||null;
  if(slot==="w"){weaponSwingFx(anchor,false,id);}
  else if(slot==="a"||(id&&typeof ITEM!=="undefined"&&ITEM[id]&&ITEM[id].st&&ITEM[id].st.sh)){guardFx(anchor);}
  else{const c=gfxAt(anchor);gfxStreak(c.x,c.y,"gfx-ring","#FFD34D",gfxReduce()?260:360);if(!gfxReduce())gfxSparks(c.x,c.y,"✨","#FFD34D",5,48);}
}

if(typeof window!=="undefined"){
  window.weaponSwingFx=weaponSwingFx;window.guardFx=guardFx;
  window.gearBattleChip=gearBattleChip;window.gearAuraCls=gearAuraCls;window.gearPreview=gearPreview;
}
