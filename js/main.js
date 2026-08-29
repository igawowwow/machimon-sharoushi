"use strict";
/* ============================================================
   main.js — 起動(最後に読み込む)
   ============================================================ */
/* ============ 起動 ============ */
/* 起動失敗を「無音の真っ白」にしない: 1回だけキャッシュ修復リロード → ダメなら再読込ボタン */
function bootFail(e){
  console.warn("起動失敗:",e);
  window.__srqBoot=true; /* ここで対処するのでインラインのウォッチドッグは黙らせる */
  if(!sessionStorage.getItem("srq-heal")){
    sessionStorage.setItem("srq-heal","1");
    Promise.resolve()
      .then(()=>typeof caches!=="undefined"?caches.keys().then(ks=>Promise.all(ks.map(k=>caches.delete(k)))):null)
      .then(()=>navigator.serviceWorker&&navigator.serviceWorker.getRegistrations?navigator.serviceWorker.getRegistrations():[])
      .then(rs=>Promise.all(Array.from(rs).map(r=>r.unregister())))
      .catch(()=>{})
      .then(()=>location.reload());
    return;
  }
  document.getElementById("app").innerHTML=
    `<div style="text-align:center;padding:60px 20px;font-family:inherit">
      <div style="font-size:40px">😵</div>
      <div style="font-weight:900;margin:10px 0">読み込みに失敗しました</div>
      <div style="font-size:12px;color:#8A8494;margin-bottom:16px">通信環境を確認して、もう一度お試しください(セーブデータは無事です)</div>
      <button class="small-btn" style="font-size:14px;padding:10px 22px" onclick="location.reload()">🔄 再読み込み</button>
    </div>`;
}
/* 従来の旧UI起動フロー(既定 & 新UI失敗時のフォールバック共通)。挙動は従来と完全同一。 */
function bootOldUI(){
try{
  loadST().then(()=>{
    checkDaily();
    if(typeof AudioMgr!=="undefined"&&AudioMgr.applyFromState)AudioMgr.applyFromState(); /* 保存済み音量をオーディオ基盤へ反映 */
    if(typeof bgmRegisterFiles==="function")bgmRegisterFiles(); /* 殿の自作BGMファイルがあれば登録(無ければ合成音) */
    if(typeof applyGoldTheme==="function")applyGoldTheme(); /* N3: 起動時にゴールドモードのテーマを反映 */
    /* MACHIMON単体ビルド: タイトルを経由せず、街へ直行する */
    if(window.__MM_STANDALONE&&window.MM&&MM.ui){
      window.__srqBoot=true;
      try{sessionStorage.removeItem("srq-heal-wd");}catch(e){}
      MM.ui.open();
      return;
    }
    /* E1: ゲーム風タイトル画面を起点にする（初回=ゲームを始める→序章 / 既存=続きから で復帰）。
       旧デモ冒頭(introStart)を新規プレイヤーに二重で見せない。壊れ/未ロードなら従来フローへ安全フォールバック。 */
    var _titledBoot=false;
    try{
      if(typeof SRStory!=="undefined" && SRStory.title && typeof SRStory.title.boot==="function"){
        _titledBoot = SRStory.title.boot()!==false;
      }
    }catch(e){ _titledBoot=false; }
    if(!_titledBoot){
      /* 従来フロー（1バイトも変えない）: 冒頭アーク→旧オープニング→ホーム */
      if(typeof introNeedsBoot==="function"&&introNeedsBoot()&&typeof introStart==="function"){introStart();}
      else if(!ST.story.intro){storyThen("intro",STORY.intro,home);}
      else home();
    }
    window.__srqBoot=true; /* 起動成功 → インラインのウォッチドッグを解除 */
    try{sessionStorage.removeItem("srq-heal-wd");}catch(e){}
  }).catch(bootFail);
}catch(e){bootFail(e);}
}

/* ============ 新UI配線(既定は旧UI。?newui= or settings.dev.newUI がある時だけ) ============ */
/* 新UIが要求されているか: URL ?newui= に1画面以上 or settings.dev.newUI が非空(truthyフラグ有) */
function wantNewUI(){
  try{
    /* 1) URL ?newui=(?newui=all 含む)に画面が1つでもあれば新UI */
    var R=window.SRApp&&window.SRApp.router;
    if(R&&typeof R._urlFlags==="function"){ for(var k in R._urlFlags()){ return true; } }
    /* 2) 保存済み settings.dev.newUI(localStorage を直接 peek・Store は変異させない) */
    var raw=null; try{ raw=localStorage.getItem("sr-quest-v4"); }catch(e){}
    if(raw){ var p=JSON.parse(raw); var nu=p&&p.settings&&p.settings.dev&&p.settings.dev.newUI;
      if(nu&&typeof nu==="object"){ for(var j in nu){ if(nu[j]) return true; } } }
  }catch(e){}
  return false;
}

/* 新UI起動: Store.load(壊れでも fresh)→ 下部5タブ+home を Router.start で描画。例外は旧UIへ安全フォールバック */
function bootNewUI(){
  try{
    var Store=window.Store;
    if(Store){ try{ Store.load(); }catch(e){ try{ Store.fresh(); }catch(_){} } if(!Store.state){ try{ Store.fresh(); }catch(_){} } }
    try{ if(typeof checkDaily==="function") checkDaily(); }catch(e){}
    try{ if(typeof AudioMgr!=="undefined"&&AudioMgr.applyFromState) AudioMgr.applyFromState(); }catch(e){}
    try{ if(typeof bgmRegisterFiles==="function") bgmRegisterFiles(); }catch(e){}
    try{ if(typeof applyGoldTheme==="function") applyGoldTheme(); }catch(e){}
    var APP=window.SRApp||{};
    var R=APP.router;
    if(!R||typeof R.start!=="function"){ throw new Error("router unavailable"); }
    try{ document.body.classList.add("sr-newui"); }catch(e){} /* 下部タブバー表示(Phase3 の仕組み) */
    try{ if(APP.tabbar&&APP.tabbar.render) APP.tabbar.render("home"); }catch(e){}
    R.start({tab:"home",screen:"home",params:{}}); /* ?newui= の対象画面フラグに従い home から描画 */
    window.__srqBoot=true; /* 新UI描画=起動成功 → インラインのウォッチドッグを解除 */
    try{sessionStorage.removeItem("srq-heal-wd");}catch(e){}
  }catch(e){
    /* 新UIが例外 → 安全側で旧UIへフォールバック */
    console.warn("新UI起動失敗→旧UIへフォールバック:",e);
    try{ document.body.classList.remove("sr-newui"); }catch(_){}
    bootOldUI();
  }
}

/* 分岐: 新UI要求時のみ新経路。無ければ従来の旧フロー(1バイトも変えない) */
function __srqBootDispatch(){ if(wantNewUI()){ bootNewUI(); } else { bootOldUI(); } }
/* ネイティブのみ、Preferences からの書き戻しを待ってから起動する。
   Web版は __srqStorageReady が null なので従来どおり同期実行(タイミングを変えない)。 */
if(window.__srqStorageReady){ window.__srqStorageReady.then(__srqBootDispatch,__srqBootDispatch); }
else { __srqBootDispatch(); }

/* ネイティブ(Capacitor)はアプリ本体に資産が同梱されるのでSWは不要。
   iosScheme=capacitor では location.hostname が "localhost" になり下の条件を
   通過してしまうため明示的に除外する(通すと、同梱していない sw.js を取りにいって404になる)。 */
const __srqNative=!!(window.Capacitor&&typeof window.Capacitor.isNativePlatform==="function"&&window.Capacitor.isNativePlatform());
if("serviceWorker" in navigator){try{let __mmSwapped=false;navigator.serviceWorker.addEventListener("controllerchange",()=>{if(__mmSwapped)return;__mmSwapped=true;if(!sessionStorage.getItem("mm-swap")){sessionStorage.setItem("mm-swap","1");location.reload();}else{sessionStorage.removeItem("mm-swap");}});}catch(e){}}
if(!__srqNative && "serviceWorker" in navigator && (location.protocol==="https:"||["localhost","127.0.0.1"].includes(location.hostname))){
  addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").then(reg=>{
    /* 起動直後に waiting の新SWがいたら、プレイ開始前の今だけ安全に切替えて1回リロード。
       (プレイ中に updatefound しても触らない=次回起動から適用。乗っ取りによる混在ロードを防ぐ) */
    const w=reg.waiting;
    if(w&&navigator.serviceWorker.controller&&!sessionStorage.getItem("srq-swap")){
      w.addEventListener("statechange",()=>{
        if(w.state==="activated"&&!sessionStorage.getItem("srq-swap")){
          sessionStorage.setItem("srq-swap","1");location.reload();
        }
      });
      w.postMessage("SKIP_WAITING");
    }else if(!w){
      sessionStorage.removeItem("srq-swap"); /* 切替完了 → 次の更新に備えてガード解除 */
    }
  }).catch(()=>{}));
}
