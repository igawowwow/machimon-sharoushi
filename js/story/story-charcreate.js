"use strict";
/* ============================================================
   story/story-charcreate.js — E2(A): キャラクター作成（初回のみ・一度きり）
   ・主人公名／呼ばれ方／見た目（既存 px 素材）／性別表現／初期性格 を選ぶ。
   ・初期性格は能力差ではなく「初期思想値」へ影響（正解・不正解はない）:
     正義を貫きたい=law+2/fair+1 ・ 目の前の人を救いたい=human+2/relief+1 ・
     現実的な解決を選びたい=mgmt+2/indep+1（docs/story-bible.md §2）。
   ・入力後「この名前で冒険を始めますか？」で確認 → 開始。名前は必ず esc2。
   ・sq(story-state) へ保存＝自動セーブ。作成済みなら二度と表示しない。
   ・作成 → オープニング（chapters/opening.js）→ 既存の序章(startMainStory)へ接続。
   ・eval/new Function 禁止・動的文字列は全て esc2・onclick は固定関数＋静的引数（ユーザー入力を渡さない）。
   ・幅480px／min44px／Safe Area／reduced-motion／キーボード操作。
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
  function hasPx(k){ return typeof G.px==="function" && G.PX && Object.prototype.hasOwnProperty.call(G.PX,k); }
  function face(k,sz){ return hasPx(k) ? G.px(k,sz) : ""; }

  var CC = S.charCreate = S.charCreate || {};

  /* ---- 選択肢（id は静的＝onclick に載せても安全。ユーザー入力ではない） ---- */
  CC.LOOKS = [
    { id:"hero_app",   label:"見習い（緑）" }, { id:"hero_app_r", label:"情熱（赤）" },
    { id:"hero_app_g", label:"堅実（金）" },   { id:"hero_app_p", label:"聡明（紫）" }
  ];
  CC.CALLED = [
    { id:"name",   label:"名前で" }, { id:"tuner", label:"「調律師」と" }, { id:"sensei", label:"「先生」と" }
  ];
  CC.GENDERS = [
    { id:"neutral", label:"中性的" }, { id:"masc", label:"男性的" },
    { id:"fem",     label:"女性的" }, { id:"free", label:"決めない" }
  ];
  CC.SEEDS = [
    { id:"justice", title:"正義を貫きたい",       desc:"曲がったことが許せない。法の下の公平を信じている。",
      ideo:{ law:2, fair:1 } },
    { id:"relief",  title:"目の前の人を救いたい", desc:"理屈よりも、今泣いている一人を助けたい。",
      ideo:{ human:2, relief:1 } },
    { id:"realist", title:"現実的な解決を選びたい", desc:"きれいごとより、続く答えを。会社も人も、潰さない。",
      ideo:{ mgmt:2, indep:1 } }
  ];

  CC.st = { name:"", called:"name", look:"hero_app", gender:"neutral", seed:"justice", step:"form", _err:"" };
  CC._seed = function(id){ for(var i=0;i<CC.SEEDS.length;i++){ if(CC.SEEDS[i].id===id) return CC.SEEDS[i]; } return null; };

  /* ============================================================
     作成データ → 表示（主人公名/立ち絵）反映。renderer.play が毎回呼ぶ。
     ============================================================ */
  S.applyChar = function(){
    var c = (typeof S.getChar==="function") ? S.getChar() : null;
    if(!c) return;
    var SP = S.SPEAKERS; if(!SP || !SP.hero) return;
    if(c.name) SP.hero.name = c.name;
    /* 旧セーブの look（hero/sage 等の12pxキー）は新バストへ移行済み。無効なら見習い(緑)に退避。 */
    if(c.look && hasPx(c.look)) SP.hero.px = c.look;
    else SP.hero.px = "hero_app";
  };

  /* ============================================================
     HTML 生成（純関数・全 esc2）
     ============================================================ */
  function chips(field, list){
    var out=[];
    for(var i=0;i<list.length;i++){
      var o=list[i], on=(CC.st[field]===o.id);
      out.push('<button type="button" class="srqcc-chip'+(on?' on':'')+'" role="radio" '+
        'aria-checked="'+(on?'true':'false')+'" onclick="srqCharPick(\''+field+'\','+i+')">'+esc2(o.label)+'</button>');
    }
    return '<div class="srqcc-chips" role="radiogroup">'+out.join("")+'</div>';
  }
  function lookChips(){
    var out=[];
    for(var i=0;i<CC.LOOKS.length;i++){
      var o=CC.LOOKS[i], on=(CC.st.look===o.id);
      out.push('<button type="button" class="srqcc-look'+(on?' on':'')+'" role="radio" '+
        'aria-checked="'+(on?'true':'false')+'" onclick="srqCharPick(\'look\','+i+')">'+
        '<span class="srqcc-look-face">'+face(o.id,42)+'</span>'+
        '<span class="srqcc-look-l">'+esc2(o.label)+'</span></button>');
    }
    return '<div class="srqcc-looks" role="radiogroup" aria-label="見た目">'+out.join("")+'</div>';
  }
  function seedCards(){
    var out=[];
    for(var i=0;i<CC.SEEDS.length;i++){
      var o=CC.SEEDS[i], on=(CC.st.seed===o.id);
      out.push('<button type="button" class="srqcc-seed'+(on?' on':'')+'" role="radio" '+
        'aria-checked="'+(on?'true':'false')+'" onclick="srqCharPick(\'seed\','+i+')">'+
        '<b>'+esc2(o.title)+'</b><small>'+esc2(o.desc)+'</small></button>');
    }
    return '<div class="srqcc-seeds" role="radiogroup" aria-label="はじまりの性格">'+out.join("")+'</div>';
  }

  CC.formHtml = function(){
    var err = CC.st._err ? '<div class="srqcc-err" role="alert">'+esc2(CC.st._err)+'</div>' : '';
    return '<div class="srqcc">'+
      '<div class="srqcc-head"><div class="srqcc-emblem">⚖</div>'+
        '<h1>キャラクター作成</h1>'+
        '<p>あなたは今日から、労務調律師。まず、あなた自身のことを。</p></div>'+
      '<div class="srqcc-body">'+
        '<label class="srqcc-lb" for="srqCharName">名前</label>'+
        '<input id="srqCharName" class="srqcc-input" type="text" maxlength="16" autocomplete="off" '+
          'inputmode="text" placeholder="なまえを入力" value="'+esc2(CC.st.name)+'" aria-label="主人公の名前">'+
        err+
        /* 殿指示: キャラ作成は名前だけ。呼ばれ方/見た目/性別/性格の選択は全廃。
           裏で見た目=hero_app・性格=justice を既定適用し立ち絵/思想値は成立させる。 */
      '</div>'+
      '<button type="button" class="srqcc-go" onclick="srqCharToConfirm()">この内容で進む ▶</button>'+
    '</div>';
  };

  CC.confirmHtml = function(){
    var seed = CC._seed(CC.st.seed);
    return '<div class="srqcc srqcc-confirm">'+
      '<div class="srqcc-head"><div class="srqcc-face">'+face(CC.st.look,72)+'</div>'+
        '<h1>'+esc2(CC.st.name)+'</h1>'+
        (seed?'<p class="srqcc-seedname">'+esc2(seed.title)+'</p>':'')+'</div>'+
      '<p class="srqcc-ask">この名前で、冒険を始めますか？</p>'+
      '<div class="srqcc-cbtns">'+
        '<button type="button" class="srqcc-yes" onclick="srqCharConfirmYes()">はい、始める ▶</button>'+
        '<button type="button" class="srqcc-no" onclick="srqCharConfirmNo()">← 直す</button>'+
      '</div>'+
    '</div>';
  };

  /* ============================================================
     操作（DOM 副作用）
     ============================================================ */
  CC._syncName = function(){
    try{ var d=doc(), el=(d&&d.getElementById)?d.getElementById("srqCharName"):null;
      if(el && typeof el.value==="string") CC.st.name = el.value.slice(0,16); }catch(e){}
  };
  CC.pick = function(field, idx){
    CC._syncName();
    var map = { look:CC.LOOKS, called:CC.CALLED, gender:CC.GENDERS, seed:CC.SEEDS };
    var list = map[field]; if(!list || !list[idx]) return;
    CC.st[field] = list[idx].id; CC.st._err = "";
    CC.render();
  };
  CC.toConfirm = function(){
    CC._syncName();
    var nm = String(CC.st.name||"").replace(/^\s+|\s+$/g,"").slice(0,16);
    CC.st.name = nm;
    if(!nm){ CC.st._err = "名前を入力してください。"; CC.st.step="form"; CC.render(); return; }
    CC.st.step = "confirm"; CC.render();
  };
  CC.commit = function(){
    S.setChar({ name:CC.st.name, called:CC.st.called, look:CC.st.look, gender:CC.st.gender, seed:CC.st.seed });
    if(typeof S.setFlag==="function" && typeof S.hasFlag==="function" && !S.hasFlag("char_ideo_applied")){
      var seed = CC._seed(CC.st.seed);
      if(seed && seed.ideo && typeof S.addIdeo==="function"){
        for(var ax in seed.ideo){ if(Object.prototype.hasOwnProperty.call(seed.ideo,ax)) S.addIdeo(ax, seed.ideo[ax]); }
      }
      S.setFlag("char_ideo_applied",1);
    }
    if(typeof S.setFlag==="function") S.setFlag("char_created",1);
    /* E3: 段階解放。まっさら新規で始めた者だけを対象に印を付ける（既存進行があれば全解放のまま） */
    if(typeof S.markFreshJourney==="function") S.markFreshJourney();
    S.applyChar();
    if(typeof S.save==="function") S.save();
    CC.startOpening();
  };

  CC.render = function(){
    CC._injectCss();
    try{ if(typeof G.stopTimer==="function") G.stopTimer(); }catch(e){}
    try{ if(typeof G.hideOvlSilent==="function") G.hideOvlSilent(); }catch(e){}
    try{ if(typeof G.setBgmScene==="function") G.setBgmScene("field"); }catch(e){}
    var a=appEl(); if(!a) return CC.startOpening();
    a.innerHTML = (CC.st.step==="confirm") ? CC.confirmHtml() : CC.formHtml();
    if(CC.st.step!=="confirm"){
      try{ var d=doc(), el=(d&&d.getElementById)?d.getElementById("srqCharName"):null; if(el&&el.focus) el.focus(); }catch(e){}
    }
    return true;
  };

  /* ---- オープニング再生 → 序章へ接続 ---- */
  CC.startOpening = function(){
    if(!(S.ui && typeof S.ui.play==="function")) return CC._goMain();
    return S.ui.play("opening", null, { onDone: CC._afterOpening });
  };
  CC._afterOpening = function(reason){
    try{
      if(typeof S.setFlag==="function"){ S.setFlag("opening_seen",1); if(reason==="closed") S.setFlag("opening_skipped",1); }
      /* 見終わった/飛ばした時点でオープニングの再開トークンは捨てる
         (残すと以後の「続きから」がオープニングへ戻ってしまう) */
      try{
        var rt=(typeof S.resume==="function")?S.resume():null;
        if(rt && rt.chapterId==="opening" && typeof S.clearResume==="function") S.clearResume();
      }catch(e2){}
      if(typeof S.save==="function") S.save();
    }catch(e){}
    return CC._goMain();
  };
  CC._goMain = function(){
    if(typeof G.startMainStory==="function"){ try{ return G.startMainStory(); }catch(e){} }
    if(typeof G.home==="function"){ try{ return G.home(); }catch(e){} }
    return false;
  };

  /* ============================================================
     グローバル配線（title からの入口 / onclick 固定関数）
     ============================================================ */
  /* ゲームを始める → 未作成ならキャラ作成。作成済みなら二度と出さず、未視聴オープニング or 本編へ。 */
  G.srqStartCharCreate = function(){
    try{
      if(typeof S.charCreated==="function" && S.charCreated()){
        if(typeof S.hasFlag==="function" && !S.hasFlag("opening_seen")) return CC.startOpening();
        return CC._goMain();
      }
    }catch(e){}
    CC.st.step = "form"; CC.st._err = "";
    return CC.render();
  };
  G.srqCharPick        = function(field, idx){ return CC.pick(field, idx); };
  G.srqCharToConfirm   = function(){ return CC.toConfirm(); };
  G.srqCharConfirmYes  = function(){ return CC.commit(); };
  G.srqCharConfirmNo   = function(){ CC.st.step="form"; return CC.render(); };

  /* オープニングの途中で離脱した人を、その続きから再開させる（#68関連の離脱対策）。
     オープニングは本編の章一覧に載らないため startMainStory の進行判定に乗らず、
     そのままだと「続きから」で序章の頭に飛び、残りのオープニングが失われていた。
     見終われば従来どおり opening_seen を立てて本編（序章）へ接続する。 */
  G.srqResumeOpening = function(nodeId){
    if(!(S.ui && typeof S.ui.play==="function")) return CC._goMain();
    return S.ui.play("opening", nodeId||null, { onDone: CC._afterOpening });
  };

  /* 回想: オープニングを再閲覧（既読フラグを記録し、終わったら拠点へ） */
  G.srqReplayOpening = function(){
    try{ if(typeof S.setFlag==="function"){ S.setFlag("opening_recollected",1); if(S.save) S.save(); } }catch(e){}
    if(!(S.ui && typeof S.ui.play==="function")){ if(typeof G.home==="function") try{ G.home(); }catch(e){} return false; }
    return S.ui.play("opening", null, { onDone:function(){ if(typeof G.home==="function"){ try{ G.home(); }catch(e){} } } });
  };

  /* ============================================================
     CSS 注入（1回だけ）
     ============================================================ */
  CC._injectCss = function(){
    var d=doc(); if(!d || !d.createElement) return;
    if(d.getElementById && d.getElementById("srqCharCss")) return;
    var st=d.createElement("style"); st.id="srqCharCss"; st.textContent=CSS;
    var host=d.head||d.body||d.documentElement;
    if(host && host.appendChild) host.appendChild(st);
  };

  var CSS =
  "#app .srqcc{position:relative;min-height:100dvh;display:flex;flex-direction:column;color:#F3EEFF;"+
  "font-family:inherit;max-width:480px;margin:0 auto;"+
  "background:linear-gradient(180deg,#0B0920 0%,#1B1440 50%,#0C0A1C 100%);"+
  "padding:calc(14px + env(safe-area-inset-top,0)) 16px calc(88px + env(safe-area-inset-bottom,0))}"+
  ".srqcc-head{text-align:center;margin:4px 0 10px}"+
  ".srqcc-emblem{font-size:30px;filter:drop-shadow(0 0 8px rgba(255,200,120,.7))}"+
  ".srqcc-head h1{margin:2px 0 0;font-size:22px;font-weight:900;letter-spacing:.08em;"+
  "background:linear-gradient(180deg,#FFF6D8,#F5C669);-webkit-background-clip:text;background-clip:text;color:transparent}"+
  ".srqcc-head p{margin:6px 0 0;font-size:12px;color:#CBBEE8;line-height:1.6}"+
  ".srqcc-body{display:flex;flex-direction:column;gap:4px}"+
  ".srqcc-lb{margin:12px 0 4px;font-size:12.5px;font-weight:900;color:#E8DDFF;letter-spacing:.04em}"+
  ".srqcc-note{font-size:10.5px;font-weight:700;color:#9C8FCB;margin-left:6px}"+
  ".srqcc-input{width:100%;min-height:48px;padding:12px 14px;border-radius:12px;font:inherit;font-size:16px;"+
  "color:#fff;background:rgba(20,14,44,.9);border:2px solid #6A57A8;box-sizing:border-box}"+
  ".srqcc-input:focus{outline:3px solid #FFE9A8;outline-offset:1px;border-color:#FFE6A0}"+
  ".srqcc-err{margin:6px 0 0;font-size:12px;font-weight:800;color:#FFC0C0}"+
  ".srqcc-chips{display:flex;flex-wrap:wrap;gap:8px}"+
  ".srqcc-chip{min-height:44px;padding:10px 14px;border-radius:11px;font:inherit;font-size:13.5px;font-weight:800;"+
  "cursor:pointer;color:#EFE7FF;border:2px solid #4C3D7E;background:rgba(38,28,68,.7)}"+
  ".srqcc-chip.on{color:#241833;border-color:#FFE6A0;background:linear-gradient(180deg,#FFE9A8,#F5C669)}"+
  ".srqcc-looks{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}"+
  ".srqcc-look{min-height:44px;padding:8px 4px;border-radius:12px;font:inherit;cursor:pointer;"+
  "display:flex;flex-direction:column;align-items:center;gap:4px;"+
  "color:#EFE7FF;border:2px solid #4C3D7E;background:rgba(38,28,68,.7)}"+
  ".srqcc-look.on{border-color:#FFE6A0;background:rgba(90,68,150,.55);box-shadow:0 0 0 1px #FFE6A0 inset}"+
  ".srqcc-look-face{width:42px;height:42px;display:flex;align-items:center;justify-content:center}"+
  ".srqcc-look-face .px{image-rendering:pixelated}"+
  ".srqcc-look-l{font-size:11px;font-weight:800}"+
  ".srqcc-seeds{display:flex;flex-direction:column;gap:8px}"+
  ".srqcc-seed{min-height:44px;padding:12px 14px;border-radius:12px;font:inherit;cursor:pointer;text-align:left;"+
  "color:#EFE7FF;border:2px solid #4C3D7E;background:rgba(38,28,68,.7);display:block}"+
  ".srqcc-seed b{display:block;font-size:14px;font-weight:900}"+
  ".srqcc-seed small{display:block;margin-top:4px;font-size:11.5px;color:#C6B9E8;line-height:1.5}"+
  ".srqcc-seed.on{border-color:#FFE6A0;background:rgba(90,68,150,.5);box-shadow:0 0 0 1px #FFE6A0 inset}"+
  ".srqcc-go{position:fixed;left:50%;transform:translateX(-50%);bottom:calc(16px + env(safe-area-inset-bottom,0));"+
  "width:calc(100% - 32px);max-width:448px;min-height:52px;padding:14px;border-radius:14px;font:inherit;font-size:16px;"+
  "font-weight:900;cursor:pointer;color:#241833;border:2px solid #FFE6A0;"+
  "background:linear-gradient(180deg,#FFE9A8,#F5C669);box-shadow:0 6px 18px rgba(0,0,0,.4);z-index:3}"+
  ".srqcc-go:focus-visible,.srqcc-yes:focus-visible,.srqcc-no:focus-visible{outline:3px solid #FFE9A8;outline-offset:2px}"+
  ".srqcc-confirm{justify-content:center;align-items:center;text-align:center}"+
  ".srqcc-face{width:72px;height:72px;margin:0 auto 6px;display:flex;align-items:center;justify-content:center}"+
  ".srqcc-seedname{margin:4px 0 0;font-size:13px;font-weight:800;color:#FFD98A}"+
  ".srqcc-ask{margin:18px 0 4px;font-size:15px;font-weight:800;color:#F3EEFF}"+
  ".srqcc-cbtns{display:flex;flex-direction:column;gap:10px;width:100%;max-width:320px;margin:14px auto 0}"+
  ".srqcc-yes{min-height:52px;padding:14px;border-radius:14px;font:inherit;font-size:16px;font-weight:900;cursor:pointer;"+
  "color:#241833;border:2px solid #FFE6A0;background:linear-gradient(180deg,#FFE9A8,#F5C669)}"+
  ".srqcc-no{min-height:48px;padding:12px;border-radius:12px;font:inherit;font-size:14px;font-weight:800;cursor:pointer;"+
  "color:#EFE7FF;border:2px solid #6A57A8;background:rgba(40,28,72,.72)}"+
  "@media (prefers-reduced-motion:reduce){.srqcc-go,.srqcc-yes{box-shadow:none}}";
})();
