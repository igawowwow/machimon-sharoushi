"use strict";
/* ============================================================
   fx.js — 画面演出(パーティクル/紙吹雪/フラッシュ/シェイク/バナー/汎用オーバーレイ)
   音は js/audio/(audio-manager.js・sfx.js・bgm.js)へ分離済み。ここは視覚演出のみ。
   SFX などの音APIは実行時に参照する(読み込み順は index.html で audio→fx)。
   ============================================================ */

/* ============ パーティクル(DOM・軽量) ============ */
const FXL=()=>document.getElementById("fxlayer");
function fxAt(el){/* 要素の中心座標(画面基準) */
  if(!el)return {x:innerWidth/2,y:innerHeight*0.3};
  const r=el.getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2};
}
function burst(x,y,html,count=10,dist=90){
  const L=FXL();if(!L)return;
  for(let i=0;i<count;i++){
    const s=document.createElement("span");s.className="fxp";s.innerHTML=html;
    s.style.left=x+"px";s.style.top=y+"px";
    L.appendChild(s);
    const a=Math.random()*Math.PI*2,d=dist*(0.4+Math.random()*0.8);
    requestAnimationFrame(()=>requestAnimationFrame(()=>{
      s.style.transform=`translate(${Math.cos(a)*d}px,${Math.sin(a)*d+30}px) rotate(${Math.random()*360-180}deg)`;
      s.style.opacity="0";
    }));
    setTimeout(()=>s.remove(),900);
  }
}
function coinBurst(el,n=8){const p=fxAt(el);burst(p.x,p.y,px("coin",16),n,80);}
function confetti(n=36){
  const L=FXL();if(!L)return;
  const cols=["#FF6B9D","#FFC53C","#3ED6C0","#5B8DFF","#8A6FD1","#FF5A5A"];
  for(let i=0;i<n;i++){
    const s=document.createElement("i");s.className="confetti-p";
    s.style.left=Math.random()*100+"%";
    s.style.background=cols[i%cols.length];
    s.style.animationDuration=(1.6+Math.random()*1.6)+"s";
    s.style.animationDelay=(Math.random()*0.5)+"s";
    L.appendChild(s);setTimeout(()=>s.remove(),3800);
  }
}
function flash(color="#FFF",ms=180){
  const d=document.createElement("div");d.className="flashov";d.style.background=color;
  document.body.appendChild(d);
  setTimeout(()=>{d.style.opacity="0";},ms);
  setTimeout(()=>d.remove(),ms+500);
}
function bigBanner(text,color="#FF6B9D",size=34){
  const d=document.createElement("div");d.className="bigban";
  d.style.cssText=`font-size:${size}px;color:${color};text-shadow:3px 3px 0 #33303E,-2px -2px 0 #33303E,2px -2px 0 #33303E,-2px 2px 0 #33303E;`;
  d.textContent=text;document.body.appendChild(d);
  setTimeout(()=>d.remove(),1200);
}
function floatXp(el,text){
  const p=fxAt(el),L=FXL();if(!L)return;
  const s=document.createElement("span");s.className="fxp floatxp";
  s.style.left=(p.x-20)+"px";s.style.top=(p.y-10)+"px";s.textContent=text;
  L.appendChild(s);setTimeout(()=>s.remove(),850);
}
function shakeApp(){
  const a=document.getElementById("app");if(!a)return;
  a.classList.remove("shake");void a.offsetWidth;a.classList.add("shake");
}
/* reduced-motion 判定(fx内の自衛用。呼び側の prefersReduce と二重でも害なし) */
function fxReduced(){try{return matchMedia&&matchMedia("(prefers-reduced-motion: reduce)").matches;}catch(e){return false;}}
/* 斬撃: 敵の上を光の斬線が走る(攻撃の手応え)。strong=会心/高コンボで2本+太く */
function slashFx(el,strong){
  if(fxReduced())return;
  const L=FXL();if(!L||!el)return;
  const p=fxAt(el),n=strong?2:1;
  for(let i=0;i<n;i++){
    const s=document.createElement("i");s.className="slash"+(strong?" crit":"");
    s.style.left=p.x+"px";s.style.top=p.y+"px";
    if(typeof s.style.setProperty==="function")s.style.setProperty("--rot",(strong?(-38+i*76):(-28+Math.random()*56))+"deg");
    L.appendChild(s);setTimeout(()=>s.remove(),380);
  }
}
/* 撃破スタンプ: 敵の位置に「撃破!!」を判子のように叩きつける */
function killStamp(el,text){
  if(fxReduced())return;
  const L=FXL();if(!L)return;const p=fxAt(el);
  const s=document.createElement("span");s.className="kill-stamp dot";s.textContent=text||"撃破!!";
  s.style.left=p.x+"px";s.style.top=(p.y-6)+"px";
  L.appendChild(s);setTimeout(()=>s.remove(),750);
}
/* 衝撃波リング: 撃破の瞬間に広がる輪 */
function shockRing(el,color){
  if(fxReduced())return;
  const L=FXL();if(!L)return;const p=fxAt(el);
  const s=document.createElement("i");s.className="shockring";
  if(color)s.style.borderColor=color;
  s.style.left=p.x+"px";s.style.top=p.y+"px";
  L.appendChild(s);setTimeout(()=>s.remove(),520);
}
function explodeBoss(el){
  const p=fxAt(el);
  burst(p.x,p.y,"💥",8,110);burst(p.x,p.y,"⭐",8,130);
  flash("#FFF3C4",140);shakeApp();SFX.explode();
}

/* ============ 汎用オーバーレイ ============ */
let ovlOnClose=null;
function showOvl(innerHtml,onClose){
  hideOvl();
  ovlOnClose=onClose||null;
  const d=document.createElement("div");d.className="ovl";d.id="ovl";
  d.innerHTML=`<div class="ovl-card lvcard">${innerHtml}</div>`;
  document.body.appendChild(d);
}
function hideOvl(){
  const d=document.getElementById("ovl");if(d)d.remove();
  const cb=ovlOnClose;ovlOnClose=null;if(cb)cb();
}
function hideOvlSilent(){/* コールバックを発火させず閉じる(画面遷移時の掃除用) */
  const d=document.getElementById("ovl");if(d)d.remove();
  ovlOnClose=null;
}
window.hideOvl=hideOvl;
