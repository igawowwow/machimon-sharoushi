"use strict";
/* ============================================================
   story/story-home.js — 統合レイヤー（R6）
   ・ホームの「今日の冒険」をメインストーリーの入口にする（最優先のヒーローカード）。
     ＝次に進めるメイン（章/話/タイトル/短い状況/[物語を進める]）を1枚に集約。
   ・章選択・回想（既読シーンの読み返し）の最低限の土台。
   ・既存機能（事件簿=サブ事件/科目ボス=章の挑戦/装備=道具/図鑑=記録/事務所=仲間…）の意味づけを最低限反映。
   ・全ての動的文字列は自前 esc2 で無害化。eval/new Function 禁止。
   ・engine/renderer/bridge に委譲。DOM 副作用は薄いラッパ関数のみ（HTML 生成は純関数）。
   docs/story-bible.md §9 / story-architecture.md §6 準拠。
   ============================================================ */
(function(){
  var G = (typeof window!=="undefined") ? window : globalThis;
  var S = G.SRStory = G.SRStory || {};

  function esc2(s){
    return String(s==null?"":s)
      .replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
      .replace(/"/g,"&quot;").replace(/'/g,"&#39;");
  }
  function clip(s,n){ s=String(s==null?"":s); return s.length>n ? s.slice(0,n)+"…" : s; }
  function spName(k){ var e=S.SPEAKERS&&S.SPEAKERS[k]; return e&&e.name ? e.name : (k||""); }

  /* ---- メイン章の並び（本編の背骨）。doneFlag/startedFlag は章データのフラグと一致 ---- */
  S.MAIN = S.MAIN || [
    { id:"prologue", no:"序章",   title:"灰色の朝",           loc:"辺境ロウム・調律事務所",
      doneFlag:"p_prologue_done",  startedFlag:"p_prologue_started" },
    { id:"ch01",     no:"第一章", title:"鐘の鳴らない工都",   loc:"工都ベルガ",
      doneFlag:"c1_ch01_done",     startedFlag:"c1_ch01_started" }
  ];

  /* 既存機能の物語的意味づけ（最低限・データのみ。章選択の凡例で提示） */
  S.FEATURE_MEANINGS = S.FEATURE_MEANINGS || [
    { icon:"🗂", label:"事件簿",   mean:"本編の外で起きるサブ事件・調査依頼" },
    { icon:"⚔", label:"科目ボス", mean:"各章の終盤に立ちはだかる歪みへの挑戦" },
    { icon:"🛡", label:"装備",     mean:"法典の欠片・調査の道具" },
    { icon:"📚", label:"図鑑",     mean:"制度・証拠・人物の記録" },
    { icon:"🏢", label:"事務所",   mean:"仲間との会話・依頼・章の合間の拠点" },
    { icon:"📝", label:"模試",     mean:"国家試験（中央法典の断片）への腕試し" },
    { icon:"💀", label:"リベンジ", mean:"取りこぼした論点の取り戻し" },
    { icon:"🔖", label:"ブックマーク", mean:"気になった論点＝調査メモ" }
  ];

  /* ============================================================
     進行判定（純ロジック）
     ============================================================ */
  /* 次に進めるメイン章の状態を返す。壊れ/未登録でも安全に既定を返す。 */
  S.mainProgress = function(){
    var list = Array.isArray(S.MAIN) ? S.MAIN : [], prev=null;
    for(var i=0;i<list.length;i++){
      var ch = list[i]; if(!ch || !ch.id) continue;
      if(!S.hasFlag(ch.doneFlag)){
        var rt = (typeof S.resume==="function") ? S.resume() : null;
        var first = (typeof S._firstNode==="function") ? S._firstNode(ch.id) : null;
        var onThis = !!(rt && rt.chapterId===ch.id);
        var started = onThis || S.hasFlag(ch.startedFlag) || (first ? S.isSeen(first) : false);
        return { done:false, allDone:false, index:i, total:list.length,
                 chapterId:ch.id, meta:ch, started:!!started,
                 nodeId: onThis ? rt.nodeId : null };
      }
      prev = ch;
    }
    return { done:true, allDone:true, index:Math.max(0,list.length-1), total:list.length,
             chapterId: prev?prev.id:"", meta:prev, started:true, nodeId:null };
  };

  /* いまの短い状況テキスト（続きなら現在ノード、未開始なら章の冒頭のひと言） */
  S.mainSituation = function(prog){
    prog = prog || S.mainProgress();
    if(prog.allDone) return "本編を歩き終えた。旅の記憶は、いつでも辿り直せる。";
    var chId = prog.chapterId;
    if(prog.started && prog.nodeId){
      var n = S.node(chId, prog.nodeId);
      if(n && typeof n.text==="string" && n.text) return n.text;
    }
    var fn = (typeof S._firstNode==="function") ? S._firstNode(chId) : null;
    var n0 = fn ? S.node(chId, fn) : null;
    if(n0 && typeof n0.text==="string" && n0.text) return n0.text;
    return "新たな章が、あなたを待っている。";
  };

  /* 物語全体の進捗(0-100)。殿要望2026-08-21「何%進捗してるか分からんから入れろ」。
     章の数だけでは粒度が粗い(1章あたり10話以上ある)ので、
     「クリア済みの章数 + 進行中の章の既読ノード率」で連続的な%にする。 */
  S.mainProgressPct = function(prog){
    prog = prog || S.mainProgress();
    var list = Array.isArray(S.MAIN) ? S.MAIN : [];
    if(!list.length) return 0;
    if(prog.allDone) return 100;
    var cleared = 0;
    for(var i=0;i<list.length;i++){ if(S.hasFlag(list[i].doneFlag)) cleared++; }
    /* 進行中の章の中でどこまで来たか(既読ノード / 章の総ノード) */
    var frac = 0, m = S._chapters && S._chapters[prog.chapterId];
    if(m){
      var tot=0, seen=0;
      for(var k in m){
        var n = m[k]; if(!n || !n.id) continue;
        tot++; if(S.isSeen(n.id)) seen++;
      }
      if(tot>0) frac = seen/tot;
    }
    if(cleared > list.length) cleared = list.length;
    var pct = Math.round((cleared + Math.min(1,frac)) / list.length * 100);
    return Math.max(0, Math.min(99, pct));   /* 100% は全章クリアのときだけ */
  };

  /* 既読シーンの読み返し用リスト（選択肢は除外・登録順＝物語順） */
  S.recollectScenes = function(chapterId){
    var m = S._chapters && S._chapters[chapterId];
    if(!m) return [];
    var out=[];
    for(var k in m){
      var n = m[k];
      if(n && n.type!=="choice" && typeof n.text==="string" && n.text && S.isSeen(n.id)){
        out.push({ id:n.id, name:spName(n.speaker), text:n.text, location:n.location||"" });
      }
    }
    return out;
  };

  /* ============================================================
     HTML 生成（純関数・全 esc）
     ============================================================ */
  S.heroCardHtml = function(){
    if(!Array.isArray(S.MAIN) || !S.MAIN.length) return "";
    if(!S._chapters || !S._chapters[S.MAIN[0].id]) return "";  /* 章未登録なら描画しない=安全 */
    var prog = S.mainProgress(), meta = prog.meta || {};
    var badge = prog.allDone ? "本編クリア"
      : esc2(meta.no||"") + " " + (prog.index+1) + "/" + prog.total;
    var title = prog.allDone ? "旅の記憶をたどる" : esc2(meta.title||"");
    var loc   = esc2(meta.loc||"");
    var sit   = esc2(clip(S.mainSituation(prog), 54));
    var btn   = prog.allDone ? "回想する" : (prog.started ? "物語を進める" : "物語を始める");
    var onClick = prog.allDone ? "storyChapterSelect()" : "startMainStory()";
    var pct   = S.mainProgressPct(prog);
    return ''+
    '<div class="sec" style="margin-top:2px">🌅 今日の冒険 ─ 物語を進める</div>'+
    '<button class="btn story-hero" type="button" style="width:100%;font-family:inherit;text-align:left;'+
      'background:linear-gradient(135deg,#241B33,#4A2E63);color:#fff;padding:12px;display:block;min-height:44px" '+
      'onclick="'+onClick+'">'+
      '<span style="display:flex;align-items:center;gap:10px">'+
        '<span style="font-size:26px;line-height:1">📖</span>'+
        '<span style="flex:1">'+
          '<span style="font-size:10px;color:#E7C6F0;font-weight:900">'+badge+(loc?' ｜ '+loc:'')+'</span><br>'+
          '<b style="font-size:15px">'+title+'</b>'+
        '</span>'+
      '</span>'+
      '<span style="display:block;margin-top:6px;font-size:11px;color:#CFCBDE;font-style:italic">「'+sit+'」</span>'+
      /* 物語ぜんたいの進み具合(%)。どこまで来たかが一目で分かる */
      '<span style="display:flex;align-items:center;gap:7px;margin-top:8px">'+
        '<span style="flex:1;height:8px;border-radius:999px;background:rgba(255,255,255,.22);overflow:hidden;display:block">'+
          '<span style="display:block;height:100%;width:'+pct+'%;background:linear-gradient(90deg,#7BD8BC,#FFD98A)"></span>'+
        '</span>'+
        '<span style="font-size:10.5px;font-weight:900;color:#FFD98A">物語 '+pct+'%</span>'+
      '</span>'+
      '<span style="display:block;margin-top:8px;text-align:center;background:#FFD98A;color:#241B33;font-weight:900;'+
        'border-radius:10px;padding:9px;font-size:14px">'+esc2(btn)+' ▶</span>'+
    '</button>'+
    /* #68: 物語を一度も始めていない人に「回想する」は意味がない(読み返す記憶がまだ無い)。
       初見のホームから選択肢を1つ減らす。1話でも進めた時点で出る。 */
    (prog.started || prog.allDone
      ? '<button class="btn" type="button" style="width:100%;font-family:inherit;background:transparent;border:none;'+
        'color:#7A5BD9;font-size:11px;font-weight:800;padding:6px 2px;margin:0 0 4px;min-height:44px" '+
        'onclick="storyChapterSelect()">📜 章を選ぶ・回想する ｜ 👥 人物録 ▶</button>'
      : '');
  };

  S.chapterSelectHtml = function(){
    var list = Array.isArray(S.MAIN) ? S.MAIN : [];
    var metN = (typeof S.metCast==="function") ? S.metCast().length : 0;
    var rows = [], prevDone = true;
    for(var i=0;i<list.length;i++){
      var ch = list[i], done = S.hasFlag(ch.doneFlag);
      var first = (typeof S._firstNode==="function") ? S._firstNode(ch.id) : null;
      var started = S.hasFlag(ch.startedFlag) || (first ? S.isSeen(first) : false);
      var locked = !prevDone && !started && !done;
      var seenN = S.recollectScenes(ch.id).length;
      var state = done ? "✅ 完了" : started ? "▶ 進行中" : locked ? "🔒 未到達" : "・未開始";
      var act;
      if(locked){
        act = '<span style="font-size:11px;color:#8A8494">前の章を進めると解放</span>';
      } else if(done){
        act = '<button class="small-btn" type="button" onclick="storyReplayChapter(\''+esc2(ch.id)+'\')">▶ もう一度</button>'+
              ' <button class="small-btn" type="button" onclick="storyRecollect(\''+esc2(ch.id)+'\')">回想('+seenN+')</button>';
      } else {
        act = '<button class="small-btn" type="button" onclick="startMainStory()">'+(started?'続きから':'始める')+'</button>'+
              (seenN? ' <button class="small-btn" type="button" onclick="storyRecollect(\''+esc2(ch.id)+'\')">回想</button>':'');
      }
      rows.push(
        '<div class="stat-row" style="align-items:flex-start">'+
          '<span><b style="font-size:12.5px">'+esc2(ch.no)+' '+esc2(ch.title)+'</b>'+
          '<small style="display:block;color:#8A8494">'+esc2(ch.loc)+' ｜ '+state+'</small></span>'+
          '<span style="white-space:nowrap">'+act+'</span>'+
        '</div>');
      prevDone = done;
    }
    /* E2: オープニング映像を見たなら、回想から再閲覧できる導線を出す（未視聴なら出さない＝ネタバレ回避） */
    var openRow = "";
    if(typeof S.hasFlag==="function" && S.hasFlag("opening_seen") && typeof G.srqReplayOpening==="function"){
      openRow =
        '<div class="stat-row" style="align-items:flex-start">'+
          '<span><b style="font-size:12.5px">🎬 オープニング</b>'+
          '<small style="display:block;color:#8A8494">十二年前・灰色革命 ｜ 再閲覧できる</small></span>'+
          '<span style="white-space:nowrap"><button class="small-btn" type="button" onclick="srqReplayOpening()">もう一度見る</button></span>'+
        '</div>';
    }
    var legend = S.FEATURE_MEANINGS.map(function(f){
      return '<div class="stat-row"><span>'+esc2(f.icon)+' '+esc2(f.label)+'</span>'+
             '<small style="color:#8A8494;text-align:right;max-width:62%">'+esc2(f.mean)+'</small></div>';
    }).join("");
    return ''+
    '<div class="topbar">'+
      '<button class="small-btn" type="button" onclick="home()">← 拠点へ</button>'+
      '<span style="font-weight:900;font-size:14px">📜 物語の章</span><span></span>'+
    '</div>'+
    '<div class="logo"><div class="t dot" style="font-size:22px">章<em>選択・回想</em></div>'+
    '<div class="s">読み終えた章は何度でも遊び直せる（周回）・回想できる</div></div>'+
    rows.join("")+
    openRow+
    /* S1(D): 出会った人物を見返せる人物録。カイが誰なのかを、いつでも確認できる。 */
    '<div class="stat-row" style="align-items:flex-start">'+
      '<span><b style="font-size:12.5px">👥 人物録</b>'+
      '<small style="display:block;color:#8A8494">出会った人物 '+metN+'人 ｜ 立場・背景・関わりを見返す</small></span>'+
      '<span style="white-space:nowrap"><button class="small-btn" type="button" onclick="storyCastDex()">開く</button></span>'+
    '</div>'+
    '<div class="sec">🧭 調律師の道具（既存の機能は、物語の一部）</div>'+
    legend+
    '<div class="footer-note">本編の外にも、あなたを待つ人がいる。事件簿・科目ボス・事務所は、旅の続きだ。</div>';
  };

  S.recollectHtml = function(chapterId){
    var meta=null, list=Array.isArray(S.MAIN)?S.MAIN:[];
    for(var i=0;i<list.length;i++){ if(list[i].id===chapterId){ meta=list[i]; break; } }
    var scenes = S.recollectScenes(chapterId);
    var head = '<h3>'+esc2(meta?(meta.no+" "+meta.title):"回想")+'</h3>';
    if(!scenes.length){
      return head+'<div class="sub2">まだ読んだ場面がない。</div>'+
        '<button class="btn go-btn" style="width:100%;margin-top:10px;padding:11px" onclick="hideOvl()">とじる</button>';
    }
    var body = ['<div class="story-log" role="log" aria-label="回想" style="text-align:left;max-height:60dvh;overflow-y:auto">'];
    body.push('<div class="story-log-body">');
    for(var j=0;j<scenes.length;j++){
      var e=scenes[j];
      body.push('<div class="story-log-row">'+
        (e.name?'<span class="sn">'+esc2(e.name)+'</span>':'')+
        '<span class="lt">'+esc2(e.text)+'</span></div>');
    }
    body.push('</div></div>');
    return head+body.join("")+
      '<button class="btn go-btn" style="width:100%;margin-top:8px;padding:11px" onclick="hideOvl()">とじる</button>';
  };

  /* ============================================================
     副作用ラッパ（DOM/遷移。純関数の HTML を貼るだけ）
     ============================================================ */
  /* その章IDが本編(MAIN)の章か。MAIN 外＝オープニング等の挿話。 */
  function isMainChapter(id){
    var list = Array.isArray(S.MAIN) ? S.MAIN : [];
    for(var i=0;i<list.length;i++){ if(list[i] && list[i].id===id) return true; }
    return false;
  }

  function play(chapterId, nodeId){
    if(!(S.ui && typeof S.ui.play==="function")) return null;
    return S.ui.play(chapterId, nodeId, {
      onEncounter: function(node){ S.onStoryEncounter(node); },
      onDone: function(){ if(typeof G.home==="function") try{ G.home(); }catch(e){} }
    });
  }

  /* ホーム主役ボタン: 次に進めるメイン章を再生（続き or 冒頭から） */
  G.startMainStory = function(){
    try{ if(typeof G.qsEv==="function") G.qsEv("home_primary_cta_clicked"); }catch(e){} /* #68 計測(端末内のみ) */
    /* #68: クイックスタートで始めた人が物語へ入る時は、まず名前を決めてもらう(キャラ作成未了のときだけ)。
       既存プレイヤー(qs.on が無い保存)の挙動は変えない。 */
    try{
      var st = G.gameState;
      if(st && st.qs && st.qs.on && typeof S.charCreated==="function" && !S.charCreated()
         && typeof G.srqStartCharCreate==="function"){ return G.srqStartCharCreate(); }
    }catch(e){}
    /* 本編の章一覧に無い章（＝オープニング）の途中で離脱していたら、そこから再開する。
       これが無いと「続きから」でオープニングの残りが飛ばされ、序章の頭に落ちる。
       ただし一度でも見終わった/飛ばした人(opening_seen)は対象外＝本編へ直行。 */
    try{
      var rt = (typeof S.resume==="function") ? S.resume() : null;
      if(rt && rt.chapterId==="opening" && !isMainChapter(rt.chapterId)
         && S._chapters && S._chapters[rt.chapterId]
         && !(typeof S.hasFlag==="function" && S.hasFlag("opening_seen"))
         && typeof G.srqResumeOpening==="function"){
        return G.srqResumeOpening(rt.nodeId);
      }
    }catch(e){}
    var prog = S.mainProgress();
    if(prog.allDone){ return G.storyChapterSelect(); }
    return play(prog.chapterId, prog.started ? prog.nodeId : null);
  };

  /* 周回: 読み終えた章を冒頭からもう一度再生する。
     ・本編の進行位置(resume)は周回前の状態を退避し、周回を終えたら戻す
       （周回で「続きから」の位置を失わせない。周回中の中断は周回位置を優先=そのまま再開できる）。
     ・フラグ/報酬はノード単位で冪等（story-effects.js）なので、再訪しても二重付与しない。 */
  G.storyReplayChapter = function(chapterId){
    if(!(S.ui && typeof S.ui.play==="function")) return null;
    var first = (typeof S._firstNode==="function") ? S._firstNode(chapterId) : null;
    if(!first) return null;
    var prev = (typeof S.resume==="function") ? S.resume() : null;
    var keep = (prev && prev.chapterId && prev.chapterId!==chapterId) ? prev : null;
    if(typeof G.stopTimer==="function") try{ G.stopTimer(); }catch(e){}
    if(typeof G.hideOvlSilent==="function") try{ G.hideOvlSilent(); }catch(e){}
    return S.ui.play(chapterId, first, {
      onEncounter: function(node){ S.onStoryEncounter(node); },
      onDone: function(){
        try{
          if(keep) S.setResume(keep.chapterId, keep.nodeId);
          else if(typeof S.clearResume==="function") S.clearResume();
          if(typeof S.save==="function") S.save();
        }catch(e){}
        if(typeof G.home==="function") try{ G.home(); }catch(e){}
      }
    });
  };

  /* 章選択・回想画面 */
  G.storyChapterSelect = function(){
    if(typeof G.stopTimer==="function") try{ G.stopTimer(); }catch(e){}
    if(typeof G.hideOvlSilent==="function") try{ G.hideOvlSilent(); }catch(e){}
    var app = G.document && G.document.getElementById ? G.document.getElementById("app") : (G.app||null);
    if(app) app.innerHTML = S.chapterSelectHtml();
  };

  /* 既読シーンの回想（オーバーレイ） */
  G.storyRecollect = function(chapterId){
    var html = S.recollectHtml(chapterId);
    if(typeof G.showOvl==="function"){ G.showOvl(html); return; }
    var app = G.document && G.document.getElementById ? G.document.getElementById("app") : (G.app||null);
    if(app) app.innerHTML = html;
  };

  /* ホームのヒーローカード（ui-home.js から typeof ガードで呼ばれる） */
  G.storyHeroCard = function(){ try{ return S.heroCardHtml(); }catch(e){ return ""; } };
})();
