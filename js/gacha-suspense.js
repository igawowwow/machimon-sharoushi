"use strict";
/* ============================================================
   gacha-suspense.js — S5: 抽選中の"キュインキュイン"(パチンコ級の煽り)
   ・リールが回る→加速→減速→停止 の一連で「引いてから結果が出るまで」を作る
   ・期待度(heat 0..4)が段階的に上がる: 色・音程・回転速度・光の走り・カットイン
   ・ハズレも短くスパッと流れる(heat0 は 1.5 秒で終わる)。長い時は必ずスキップ可
   ・確定演出(heat4)が出たらもう当たり = 嘘をつかない(高レアは必ず heat>=2 まで上がる)
   厳守: 確率・付与・天井は engine 側で完結済み。ここは「見た目と音」だけで結果を変えない。
        prefers-reduced-motion では回転/閃光/カットインを止め、静かな結果表示に落とす。
        DOM に入れるのは RAR 名・数値など内部データのみ(生ユーザー入力なし)。念のため esc() を通す。
   依存(全て実行時 typeof 参照): fx.js(showOvl/flash)・game-data(RAR/GACHA)・
        engine(ST/esc)・sfx(SFX.kyuin/heat/cutin/confirmed/reelStop)。
   ============================================================ */

const GS_CELL=52;                 /* リール1コマの高さ(px)。CSS .gs-strip>div と一致させる */
const GS_STEP=480;                /* 期待度が1段上がる間隔(ms) */
const GS_HOLD=900;                /* 最終段からリール停止までのタメ(ms) */
const GS_AFTER=620;               /* 停止から結果表示までの余韻(ms) */
const GS_TICK=210;                /* "キュイン"を鳴らす間隔(ms) */
const GS_LABEL=["抽選中…","チャンス!","激アツ!!","超激アツ!!!","確定!!!!"];
const GS_COLOR=["#8A8494","#2B62D9","#8A6FD1","#C58900","#FF3D7E"];

function gsEsc(s){return typeof esc==="function"?esc(String(s)):String(s);}
function gsReduce(){return typeof prefersReduce==="function"&&prefersReduce();}
function gsSfx(n,a){try{if(typeof SFX!=="undefined"&&typeof SFX[n]==="function")SFX[n](a);}catch(e){}}

/* 期待度(0..4)を決める。rnd を差し替えられるのはテストで固定するため。
   不変条件: 上限4/下限0・LRは必ず4(確定)・SSR以上は必ず2以上(高レアで煽らないのは事故)。
   低レアにも稀に"ガセ"の煽りを混ぜる — 煽り=当たり だと演出を見る意味が消えるため。 */
function gachaHeatLevel(best,rnd){
  const r=(typeof rnd==="function"?rnd:Math.random)();
  let lv;
  if(best>=5)lv=4;
  else if(best===4)lv=r<0.55?4:3;
  else if(best===3)lv=r<0.35?3:2;
  else if(best===2)lv=r<0.30?2:1;
  else lv=r<0.04?2:(r<0.16?1:0);
  return Math.max(0,Math.min(4,lv));
}
function gachaHeatLabel(lv){return GS_LABEL[Math.max(0,Math.min(4,lv|0))];}
function gachaHeatColor(lv){return GS_COLOR[Math.max(0,Math.min(4,lv|0))];}

/* 演出全体の長さ(ms)。heat が高いほど長くタメる */
function gachaSuspenseMs(lv){return GS_STEP*Math.max(0,Math.min(4,lv|0))+GS_HOLD+GS_AFTER;}

/* 抽選中に出す情報(天井の残り・SSR以上の提供割合)。C: 期待度の可視化 */
function gachaSuspenseInfo(){
  const left=(typeof GACHA!=="undefined"&&typeof ST!=="undefined")
    ? Math.max(0,GACHA.pity-(ST.gPity||0)) : 0;
  const hi=(typeof gachaHiRateText==="function")?gachaHiRateText():"";
  return "天井まで あと"+left+"回"+(hi?" ｜ SSR以上 "+hi:"");
}

/* リールの帯。RAR を2周ぶん並べ、下半分のどこかで止める(見た目上ずっと回っていたように見える) */
function gsStripHtml(){
  const rr=(typeof RAR!=="undefined")?RAR:[];
  const one=rr.map(r=>`<div class="${gsEsc(r.cls)}">${gsEsc(r.n)}</div>`).join("");
  return one+one;
}

/* ---- 実行中の後始末対象(スキップ/多重起動でも必ず止められるようにまとめて持つ) ---- */
let gsTimers=[],gsTickId=null,gsDone=null,gsRunning=false;
function gsClear(){
  gsTimers.forEach(t=>clearTimeout(t));gsTimers=[];
  if(gsTickId!==null){clearInterval(gsTickId);gsTickId=null;}
}
function gsAt(ms,fn){gsTimers.push(setTimeout(fn,ms));}
function gsEl(id){return typeof document!=="undefined"?document.getElementById(id):null;}

/* 期待度メーターの更新。見た目(幅)と読み上げ(aria)を必ず一緒に動かす —
   幅だけ変えると progressbar が「値なし」のまま読み上げられ、目で見える情報が音声に出ない。 */
function gsSetMeter(lv){
  const i=gsEl("gsMeterI"),m=gsEl("gsMeter");
  if(i)i.style.width=(lv/4*100)+"%";
  if(m&&typeof m.setAttribute==="function"){
    m.setAttribute("aria-valuenow",String(lv));
    m.setAttribute("aria-valuetext",gachaHeatLabel(lv));
  }
}

/* 期待度を1段上げる: 文字・色・メーター・回転速度・音を同時に動かす */
function gsApplyHeat(lv,reduce){
  const wrap=gsEl("gsWrap"),head=gsEl("gsHeat"),strip=gsEl("gsStrip");
  if(head){head.textContent=gachaHeatLabel(lv);head.style.color=gachaHeatColor(lv);}
  gsSetMeter(lv);
  if(wrap){wrap.className="gs-wrap gs-h"+lv;}
  /* 回転はCSS変数で速度を渡す。段が上がるほど速く=キュインキュインが詰まる */
  if(strip&&!reduce)strip.style.setProperty("--gsdur",(0.46-lv*0.075).toFixed(3)+"s");
  if(lv>0)gsSfx("heat",lv);
  if(lv>=3&&!reduce)gsCutIn(lv);
  if(lv>=4){
    gsSfx("confirmed");
    if(!reduce&&typeof flash==="function")flash("#FFE1EB",320);
  }
}

/* カットイン: 画面を横切る帯。中身は固定文言のみ(外部入力なし) */
function gsCutIn(lv){
  const c=gsEl("gsCutin");if(!c)return;
  c.textContent=lv>=4?"確定":"激アツ";
  c.classList.remove("on");
  /* reflow を挟んでアニメを再スタート(同一クラスの付け直しだけでは再生されない) */
  void c.offsetWidth;
  c.classList.add("on");
  gsSfx("cutin");
}

/* リールを止める: 実際の最高レアのコマに着地させる(結果と表示が必ず一致) */
function gsStopReel(best,lv,reduce){
  const strip=gsEl("gsStrip");
  if(gsTickId!==null){clearInterval(gsTickId);gsTickId=null;}
  if(strip){
    const rrLen=(typeof RAR!=="undefined")?RAR.length:6;
    const idx=Math.max(0,Math.min(rrLen-1,best|0));
    strip.style.animation="none";
    strip.style.transition=reduce?"none":"transform .46s cubic-bezier(.16,1.5,.4,1)";
    strip.style.transform="translateY(-"+((rrLen+idx)*GS_CELL)+"px)";
  }
  gsSfx("reelStop",lv);
  const wrap=gsEl("gsWrap");if(wrap)wrap.classList.add("gs-stopped");
}

/* 演出を打ち切って結果へ。スキップ・終了の唯一の出口(done は必ず1回だけ呼ぶ) */
function gachaSuspenseSkip(){
  if(!gsRunning)return;
  gsRunning=false;gsClear();
  const d=gsDone;gsDone=null;
  if(typeof d==="function")d();
}
/* タイマー経過での自動進行。演出中に画面を離れた(オーバーレイが消えた)場合は
   結果を別画面の上に開いてしまうので、静かに畳んで何もしない。
   ※ユーザーが自分で押したスキップは常に通す(こちらは必ず結果まで見せる) */
function gsAutoAdvance(){
  if(!gsRunning)return;
  if(typeof document!=="undefined"&&!gsEl("ovl")){gsRunning=false;gsClear();gsDone=null;return;}
  gachaSuspenseSkip();
}

/* 抽選演出の本体。done() を呼ぶと呼び出し側(gacha-fx)が開封演出へ進む */
function gachaSuspense(best,done){
  const reduce=gsReduce();
  gsClear();gsRunning=true;gsDone=done;
  const lv=gachaHeatLevel(best);

  if(typeof showOvl==="function"){
    showOvl(
      `<div class="gs-wrap gs-h0" id="gsWrap">
        <div class="gs-beam" aria-hidden="true"></div>
        <div class="gs-cutin" id="gsCutin" aria-hidden="true"></div>
        <div class="gs-title dot" id="gsHeat">${gsEsc(GS_LABEL[0])}</div>
        <div class="gs-reel"><div class="gs-strip" id="gsStrip">${gsStripHtml()}</div></div>
        <div class="gs-meter" id="gsMeter" role="progressbar" aria-label="期待度" aria-valuemin="0" aria-valuemax="4" aria-valuenow="0" aria-valuetext="${gsEsc(GS_LABEL[0])}"><i id="gsMeterI"></i></div>
        <div class="sub2" id="gsInfo">${gsEsc(gachaSuspenseInfo())}</div>
        <button class="btn gs-skip" type="button" onclick="gachaSuspenseSkip()">スキップ ▶▶</button>
      </div>`);
  }

  /* 動きを減らす設定: 回転も閃光もカットインも出さず、結果だけ短く見せる */
  if(reduce){
    const head=gsEl("gsHeat");
    if(head){head.textContent=gachaHeatLabel(lv);head.style.color=gachaHeatColor(lv);}
    gsSetMeter(lv);
    gsSfx("kyuin",lv);
    gsStopReel(best,lv,true);
    gsAt(420,gsAutoAdvance);
    return;
  }

  /* キュインキュイン: 回転音を一定間隔で刻む。段が上がると音程も上がる */
  let cur=0;
  gsSfx("kyuin",0);
  gsTickId=setInterval(()=>gsSfx("kyuin",cur),GS_TICK);

  for(let s=1;s<=lv;s++){
    const step=s;
    gsAt(GS_STEP*step,()=>{cur=step;gsApplyHeat(step,false);});
  }
  const stopAt=GS_STEP*lv+GS_HOLD;
  gsAt(stopAt,()=>gsStopReel(best,lv,false));
  gsAt(stopAt+GS_AFTER,gsAutoAdvance);
}

if(typeof window!=="undefined"){
  window.gachaSuspense=gachaSuspense;
  window.gachaSuspenseSkip=gachaSuspenseSkip;
  window.gachaHeatLevel=gachaHeatLevel;
  window.gachaHeatLabel=gachaHeatLabel;
  window.gachaHeatColor=gachaHeatColor;
  window.gachaSuspenseMs=gachaSuspenseMs;
  window.gachaSuspenseInfo=gachaSuspenseInfo;
}
