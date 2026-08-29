"use strict";
/* ============================================================
   story/story-title.js — E1: ゲーム風タイトル画面 + 起動ルーティング + ロード演出
   ・「RPGを始める」開始体験。業務アプリのログイン画面に見せない。
   ・崩壊した中央法典と遠くの巨大都市を px/CSS のみで描画（画像・外部フォント不使用）。
   ・ボタン: ゲームを始める / 続きから / データ引き継ぎ / 設定
     初回(セーブ無し)は「続きから」を出さない。認証は無し=ローカルの新規/継続で分岐。
   ・ロード演出: 「法典を読み込んでいます / 記録を復元しています / 冒険の続きを準備しています」。
   ・eval/new Function 禁止・全動的文字列 esc2・data/onclick は固定関数名のみ（ユーザー入力を描画しない）。
   ・壊れ保存でも安全に home へフォールバック。旧UI/既存物語は無改変（起動経路の分岐のみ）。
   docs/story-bible.md / story-architecture.md 準拠。幅480px・min44px・Safe Area・reduced-motion 対応。
   ============================================================ */
(function(){
  var G = (typeof window!=="undefined") ? window : globalThis;
  var S = G.SRStory = G.SRStory || {};

  function doc(){ return G.document; }
  function appEl(){ var d=doc(); return (d&&d.getElementById) ? d.getElementById("app") : (G.app||null); }
  function esc2(s){
    return String(s==null?"":s)
      .replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
      .replace(/"/g,"&quot;").replace(/'/g,"&#39;");
  }
  function reduced(){
    try{ return G.matchMedia ? !!G.matchMedia("(prefers-reduced-motion: reduce)").matches : true; }
    catch(e){ return true; }
  }
  function safeTimeout(fn,ms){
    try{ if(typeof G.setTimeout==="function"){ G.setTimeout(fn,ms); return; } }catch(e){}
    try{ fn(); }catch(_){}
  }

  var T = S.title = S.title || {};
  T.LOAD_MSGS = ["法典を読み込んでいます…","記録を復元しています…","冒険の続きを準備しています…"];

  /* ============================================================
     セーブ有無/進行判定（純ロジック・DOM 非依存＝テスト可能）
     ============================================================ */
  /* 「遊んだ痕跡」があるか(純ロジック)。
     【重要】セーブキーの有無や所持コインで判定してはいけない:
       ・engine の KEY は "sr-quest-v3"。初回起動の checkDaily(ログインボーナス)で
         saveST() が走るため、まだ1問も解いていないのにキーは存在する。
       ・同じ理由で coins/tickets も初回から増える。
     これで判定すると まっさらな新規に「続きから」が出て、初見の最短路
     (すぐ冒険を始める)が最初の1回で消える(#68 の受入条件が壊れる)。 */
  T.played = function(st){
    if(!st || typeof st!=="object") return false;
    if(st.intro && st.intro.easy) return true;               /* 導入クエスト突破 */
    if(st.qs && st.qs.on) return true;                       /* #68 クイックスタートで開始済み */
    if(st.msq && ((st.msq.ch||0)>0 || st.msq.done)) return true;
    if((st.lv||1)>1 || (st.loop||1)>1) return true;
    if((st.totalC||0)>0 || (st.totalW||0)>0) return true;    /* 1問でも解答した */
    try{ for(var k in st.q){ if(Object.prototype.hasOwnProperty.call(st.q,k)) return true; } }catch(e){}
    return false;
  };

  T.hasSave = function(){
    var st = (G.gameState && typeof G.gameState==="object") ? G.gameState : null;
    if(T.played(st)) return true;
    /* gameState が未反映/空でも、保存の中身に進行があれば継続扱い(キーの有無では判定しない) */
    try{
      var raw = (typeof G.localStorage!=="undefined") ? G.localStorage.getItem("sr-quest-v3") : null;
      if(raw && T.played(JSON.parse(raw))) return true;
    }catch(e){}
    try{
      if(S.hasFlag && (S.hasFlag("p_prologue_started")||S.hasFlag("p_prologue_done")||
                       S.hasFlag("c1_ch01_started")||S.hasFlag("c1_ch01_done"))) return true;
    }catch(e){}
    try{ if(S.resume && S.resume()) return true; }catch(e){}
    return false;
  };

  /* 未完了ストーリーシーン（戦闘途中の物語復帰トークン含む）が残っているか */
  T._storyInProgress = function(){
    try{ if(S.resume){ var r=S.resume(); if(r && r.chapterId) return true; } }catch(e){}
    try{
      if(typeof S.mainProgress==="function"){
        var p = S.mainProgress();
        if(p && !p.allDone && p.started) return true;
      }
    }catch(e){}
    return false;
  };

  /* ============================================================
     シーン描画（CSS/px のみ。崩壊した中央法典＋遠くの巨大都市）
     ============================================================ */
  var STARS = [[7,12],[19,7],[31,17],[44,9],[57,14],[69,6],[81,16],[91,10],
               [13,24],[52,26],[76,28],[37,5],[26,30],[63,22],[88,25]];
  function starsHtml(){
    var out=[];
    for(var i=0;i<STARS.length;i++){
      var p=STARS[i], d=(i%3===0)?" big":"";
      out.push('<i class="s'+d+'" style="left:'+p[0]+'%;top:'+p[1]+'%;animation-delay:'+(i*180)+'ms"></i>');
    }
    return out.join("");
  }
  var BLDG = [40,58,32,66,46,72,36,60,50,68,42,54];
  function cityHtml(){
    var out=[];
    for(var i=0;i<BLDG.length;i++){
      out.push('<span class="srq-bldg" style="height:'+BLDG[i]+'%"></span>');
    }
    return out.join("");
  }
  T.sceneHtml = function(){
    return '<div class="srq-scene" aria-hidden="true">'+
      '<div class="srq-stars">'+starsHtml()+'</div>'+
      '<div class="srq-glow"></div>'+
      '<div class="srq-city">'+cityHtml()+'</div>'+
      '<div class="srq-codex">'+
        '<span class="srq-codex-h l"></span><span class="srq-codex-h r"></span>'+
        '<span class="srq-crack"></span>'+
        '<span class="srq-shard s1"></span><span class="srq-shard s2"></span><span class="srq-shard s3"></span>'+
      '</div>'+
      '<div class="srq-ground"></div>'+
    '</div>';
  };

  /* ============================================================
     メニュー（初回=続きから無し）
     ============================================================ */
  function btn(id,label,fn,kind){
    return '<button class="srq-btn srq-'+kind+'" id="'+id+'" type="button" role="menuitem" '+
           'onclick="'+fn+'">'+esc2(label)+'</button>';
  }
  T.menuHtml = function(hasSave){
    var b=[];
    if(hasSave){
      b.push(btn("srqTitleContinueBtn","続きから","srqTitleContinue()","primary"));
      b.push(btn("srqTitleNewBtn","はじめから","srqTitleNew()","ghost"));
    } else {
      /* #68: 初見の最短路。ここを押した次の画面がもう第1問(キャラ作成・オープニングを挟まない)。
         物語から入りたい人のために「物語から始める」を並置＝体験は削らず、選ぶ順番だけ変える。 */
      b.push(btn("srqTitleQuickBtn","⚔ すぐ冒険を始める（30秒で1問目）","srqTitleQuick()","primary"));
      b.push(btn("srqTitleNewBtn","📖 物語から始める","srqTitleNew()","ghost"));
    }
    b.push(btn("srqTitleTransferBtn","データ引き継ぎ","srqTitleTransfer()","ghost"));
    b.push(btn("srqTitleSettingsBtn","設定","srqTitleSettings()","ghost"));
    return '<div class="srq-menu" role="menu" aria-label="タイトルメニュー">'+b.join("")+'</div>';
  };

  T.titleHtml = function(){
    var hasSave = T.hasSave();
    return '<div class="srq-title">'+
      T.sceneHtml()+
      '<div class="srq-hero">'+
        '<div class="srq-emblem">⚖</div>'+
        '<h1 class="srq-name">社労士クエスト</h1>'+
        '<p class="srq-sub">法は、人を守る盾か。<br>人を縛る鎖か。</p>'+
      '</div>'+
      T.menuHtml(hasSave)+
      '<div class="srq-foot">レイバーリア ─ 労務調律師の旅</div>'+
    '</div>';
  };

  T.loadingHtml = function(){
    return '<div class="srq-title srq-loading">'+
      T.sceneHtml()+
      '<div class="srq-load" role="status" aria-live="polite">'+
        '<div class="srq-load-orb"></div>'+
        '<div class="srq-load-msg" id="srqTitleLoadMsg">'+esc2(T.LOAD_MSGS[0])+'</div>'+
      '</div>'+
    '</div>';
  };

  /* ============================================================
     描画・起動（ロード演出→タイトル）
     ============================================================ */
  T._toHome = function(){ try{ if(typeof G.home==="function"){ G.home(); return true; } }catch(e){} return false; };

  T.render = function(){
    T._injectCss();
    try{ if(typeof G.stopTimer==="function") G.stopTimer(); }catch(e){}
    try{ if(typeof G.hideOvlSilent==="function") G.hideOvlSilent(); }catch(e){}
    try{ if(typeof G.setBgmScene==="function") G.setBgmScene("field"); }catch(e){}
    var a=appEl(); if(!a) return T._toHome();
    a.innerHTML = T.titleHtml();
    try{
      var d=doc(), f=d&&d.getElementById?d.getElementById(T.hasSave()?"srqTitleContinueBtn":"srqTitleQuickBtn"):null;
      if(f && typeof f.focus==="function") f.focus();
    }catch(e){}
    return true;
  };

  T.boot = function(){
    try{
      T._injectCss();
      var a=appEl();
      if(!a) return T._toHome();
      if(reduced()) return T.render();      /* 演出簡素化: ロード画面を挟まず即タイトル */
      a.innerHTML = T.loadingHtml();
      var msgs=T.LOAD_MSGS, i=0, self=this;
      var step=function(){
        i++;
        var d=doc(), el=(d&&d.getElementById)?d.getElementById("srqTitleLoadMsg"):null;
        if(el && i<msgs.length){ el.textContent = msgs[i]; safeTimeout(step,650); }
        else { try{ self.render(); }catch(e){ T._toHome(); } }
      };
      safeTimeout(step,650);
      return true;
    }catch(e){ return T._toHome(); }
  };

  /* ============================================================
     ルーティング（新規/継続/引き継ぎ/設定）
     ============================================================ */
  /* #68 すぐ冒険を始める: 3問バトルへ直行(ui-quickstart.js)。未ロードなら従来の新規開始へ退避。 */
  T.quickGame = function(){
    if(typeof G.quickStart==="function"){ try{ return G.quickStart(); }catch(e){} }
    return T.newGame();
  };

  /* ゲームを始める: 将来の E2(キャラ作成→オープニング→序章)。未実装なら序章(prologue)を直接再生。 */
  T.newGame = function(){
    if(typeof G.srqStartCharCreate==="function"){ try{ return G.srqStartCharCreate(); }catch(e){} }
    if(typeof G.startMainStory==="function"){ try{ return G.startMainStory(); }catch(e){} }
    if(typeof G.introStart==="function"){ try{ return G.introStart(); }catch(e){} }
    return T._toHome();
  };

  /* 続きから: 未完了ストーリー→(拠点)。戦闘途中の物語は resume トークンで復帰。 */
  T.continueGame = function(){
    if(T._storyInProgress() && typeof G.startMainStory==="function"){
      try{ return G.startMainStory(); }catch(e){}
    }
    return T._toHome();   /* 今日の冒険は拠点(home)で最優先表示。安全な既定復帰先 */
  };

  T.transfer = function(){
    if(typeof G.showOvl==="function"){
      G.showOvl(
        '<h3>データ引き継ぎ</h3>'+
        '<div class="sub2">別の端末やアプリへ学習データを移せる。引き継ぐ側は「取り込む」。</div>'+
        '<button class="btn mode-btn yellowbg" style="margin-top:10px" onclick="hideOvl();saveImport()">📥<span>コードを取り込む（引き継ぐ）</span></button>'+
        '<button class="btn mode-btn" style="margin-top:6px" onclick="hideOvl();saveExport()">📦<span>コードを書き出す</span></button>'+
        '<button class="btn go-btn" style="width:100%;margin-top:8px;padding:11px" onclick="srqTitleRender()">タイトルへ戻る</button>'
      );
      return true;
    }
    if(typeof G.saveImport==="function"){ try{ return G.saveImport(); }catch(e){} }
    return T._toHome();
  };

  T.settings = function(){
    if(typeof G.statusModal==="function"){ try{ return G.statusModal(); }catch(e){} }
    return T._toHome();
  };

  /* ============================================================
     CSS 注入（1回だけ）
     ============================================================ */
  T._injectCss = function(){
    var d=doc(); if(!d || !d.createElement) return;
    if(d.getElementById && d.getElementById("srqTitleCss")) return;
    var st=d.createElement("style"); st.id="srqTitleCss"; st.textContent=CSS;
    var host=d.head||d.body||d.documentElement;
    if(host && host.appendChild) host.appendChild(st);
  };

  /* ---- グローバル配線（onclick から呼ぶ固定関数名） ---- */
  G.srqTitleScreen  = function(){ return T.boot(); };
  G.srqTitleRender  = function(){ return T.render(); };
  G.srqTitleNew     = function(){ return T.newGame(); };
  G.srqTitleQuick   = function(){ return T.quickGame(); };
  G.srqTitleContinue= function(){ return T.continueGame(); };
  G.srqTitleTransfer= function(){ return T.transfer(); };
  G.srqTitleSettings= function(){ return T.settings(); };

  var CSS =
  "#app .srq-title{position:relative;min-height:100dvh;display:flex;flex-direction:column;align-items:center;"+
  "justify-content:flex-start;overflow:hidden;color:#F3EEFF;font-family:inherit;"+
  "background:linear-gradient(180deg,#080718 0%,#160F38 42%,#2A1A50 68%,#0C0A1C 100%);"+
  "padding:0 16px calc(22px + env(safe-area-inset-bottom,0))}"+
  ".srq-scene{position:relative;width:100%;max-width:480px;height:42dvh;min-height:230px;margin:0 auto;flex:0 0 auto}"+
  ".srq-stars{position:absolute;inset:0}"+
  ".srq-stars .s{position:absolute;width:2px;height:2px;border-radius:50%;background:#FFF6D8;opacity:.8;"+
  "box-shadow:0 0 4px #FFF6D8;animation:srqTwinkle 3.2s ease-in-out infinite}"+
  ".srq-stars .s.big{width:3px;height:3px;box-shadow:0 0 7px #FFE9A8}"+
  ".srq-glow{position:absolute;left:50%;top:8%;width:220px;height:220px;transform:translateX(-50%);"+
  "background:radial-gradient(circle,rgba(255,200,120,.28),rgba(255,160,90,.08) 45%,transparent 70%);"+
  "filter:blur(2px);pointer-events:none}"+
  ".srq-city{position:absolute;left:0;right:0;bottom:34px;height:44%;display:flex;align-items:flex-end;"+
  "justify-content:center;gap:3px;opacity:.9;filter:drop-shadow(0 -1px 8px rgba(120,90,200,.35))}"+
  ".srq-bldg{width:7%;max-width:26px;background:#0B0920;border-top:2px solid #241a44;"+
  "background-image:repeating-linear-gradient(0deg,transparent 0 6px,rgba(150,180,255,.10) 6px 8px),"+
  "repeating-linear-gradient(90deg,transparent 0 5px,rgba(150,180,255,.08) 5px 7px)}"+
  ".srq-ground{position:absolute;left:0;right:0;bottom:0;height:36px;"+
  "background:linear-gradient(180deg,#160f30,#0a0817);border-top:2px solid #2c2054}"+
  ".srq-codex{position:absolute;left:50%;bottom:26px;width:132px;height:92px;transform:translateX(-50%);"+
  "animation:srqFloat 5s ease-in-out infinite}"+
  ".srq-codex-h{position:absolute;bottom:0;width:60px;height:82px;"+
  "background:linear-gradient(160deg,#7A5A2A,#4A3418);border:3px solid #C79A4E;border-radius:6px;"+
  "box-shadow:0 6px 16px rgba(0,0,0,.5),inset 0 0 12px rgba(255,220,150,.15)}"+
  ".srq-codex-h.l{left:2px;transform:rotate(-11deg);transform-origin:bottom right;"+
  "background-image:repeating-linear-gradient(0deg,transparent 0 9px,rgba(255,240,200,.10) 9px 10px)}"+
  ".srq-codex-h.r{right:2px;transform:rotate(11deg);transform-origin:bottom left;"+
  "background-image:repeating-linear-gradient(0deg,transparent 0 9px,rgba(255,240,200,.10) 9px 10px)}"+
  ".srq-crack{position:absolute;left:50%;bottom:2px;width:5px;height:88px;transform:translateX(-50%);"+
  "background:linear-gradient(180deg,#FFF3C4,#FFB347,#FF7A3D);border-radius:2px;"+
  "box-shadow:0 0 14px 4px rgba(255,170,80,.7);animation:srqPulse 2.4s ease-in-out infinite}"+
  ".srq-shard{position:absolute;width:7px;height:7px;background:#D9B36A;border:1px solid #F0D28A;"+
  "box-shadow:0 0 6px rgba(255,210,140,.6)}"+
  ".srq-shard.s1{left:8px;top:-6px;transform:rotate(24deg);animation:srqFloat 4.2s ease-in-out infinite}"+
  ".srq-shard.s2{right:6px;top:-14px;width:5px;height:5px;transform:rotate(-18deg);animation:srqFloat 5.6s ease-in-out .4s infinite}"+
  ".srq-shard.s3{right:24px;top:2px;width:4px;height:4px;animation:srqFloat 4.8s ease-in-out .8s infinite}"+
  ".srq-hero{position:relative;z-index:2;text-align:center;margin:10px 0 4px}"+
  ".srq-emblem{font-size:34px;line-height:1;filter:drop-shadow(0 0 10px rgba(255,200,120,.8))}"+
  ".srq-name{margin:4px 0 0;font-size:34px;font-weight:900;letter-spacing:.12em;"+
  "background:linear-gradient(180deg,#FFF6D8,#FFD98A 55%,#E7A94E);-webkit-background-clip:text;"+
  "background-clip:text;color:transparent;text-shadow:0 2px 10px rgba(0,0,0,.4)}"+
  ".srq-sub{margin:8px 0 0;font-size:12.5px;font-weight:700;line-height:1.7;color:#D7C9F2;letter-spacing:.06em}"+
  ".srq-menu{position:relative;z-index:2;width:100%;max-width:320px;margin:18px auto 0;"+
  "display:flex;flex-direction:column;gap:10px}"+
  ".srq-btn{width:100%;min-height:48px;padding:12px 14px;border-radius:12px;font:inherit;font-size:15px;"+
  "font-weight:900;letter-spacing:.05em;cursor:pointer;transition:transform .08s ease,box-shadow .12s ease}"+
  ".srq-btn:active{transform:translateY(1px)}"+
  ".srq-btn:focus-visible{outline:3px solid #FFE9A8;outline-offset:2px}"+
  ".srq-primary{color:#241833;border:2px solid #FFE6A0;"+
  "background:linear-gradient(180deg,#FFE9A8,#F5C669);box-shadow:0 4px 14px rgba(245,190,90,.4)}"+
  ".srq-ghost{color:#EFE7FF;border:2px solid #6A57A8;background:rgba(40,28,72,.72)}"+
  ".srq-ghost:hover{background:rgba(58,42,98,.9)}"+
  ".srq-foot{position:relative;z-index:2;margin-top:16px;font-size:10.5px;color:#8E7FBE;letter-spacing:.14em}"+
  ".srq-load{position:relative;z-index:2;margin-top:34px;text-align:center}"+
  ".srq-load-orb{width:44px;height:44px;margin:0 auto 14px;border-radius:50%;"+
  "border:3px solid rgba(255,220,150,.25);border-top-color:#FFD98A;animation:srqSpin 1s linear infinite}"+
  ".srq-load-msg{font-size:12.5px;font-weight:800;color:#D7C9F2;letter-spacing:.06em}"+
  "@keyframes srqTwinkle{0%,100%{opacity:.3}50%{opacity:1}}"+
  "@keyframes srqFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}"+
  ".srq-codex{transform:translateX(-50%)}"+
  "@keyframes srqPulse{0%,100%{opacity:.7}50%{opacity:1}}"+
  "@keyframes srqSpin{to{transform:rotate(360deg)}}"+
  "@media (max-width:360px){.srq-name{font-size:28px}.srq-scene{min-height:190px}}"+
  "@media (prefers-reduced-motion:reduce){"+
  ".srq-stars .s,.srq-codex,.srq-crack,.srq-shard,.srq-load-orb,.srq-glow{animation:none}"+
  ".srq-btn{transition:none}}";
})();
