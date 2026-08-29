"use strict";
/* ============================================================
   story/story-encounter.js — 物語の戦闘に「相手」と「意味」を与える層（S0）
   ・(B) 戦う意味: 戦闘に入る直前に「この敵は誰で・何の不正をしていて・なぜ正す必要があるか」を
     必ず提示する（ブリーフィング）。敵の口上（挑発）も添える。
   ・(A) 名前付きヴィラン: js/data/villains.js のロスターから相手を解決し、
     旧UIバトルの敵表示（G.storyFoe）に流し込む。見た目は既存 px スプライトのみ。
   ・(D) ○連打で勝てない: 物語の演習だけ「出題の選び方」を差し替える。
     ○×は正解が○/×へ偏らないよう均衡させ、五肢択一・個数問題を必ず混ぜる。
     ※問題データ・問題ID・採点・SRS・報酬は一切変更しない（選抜のみ）。
   ・全ての動的文字列は自前 esc2 で無害化。eval/new Function 禁止。
   ・reduced-motion では点滅/振動を出さない。ボタンは min44px。
   docs/story-architecture.md §5 / story-bible.md（敵設定）準拠。
   ============================================================ */
(function(){
  var W = (typeof window!=="undefined") ? window : globalThis;
  var S = W.SRStory = W.SRStory || {};

  function esc2(s){
    return String(s==null?"":s)
      .replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
      .replace(/"/g,"&quot;").replace(/'/g,"&#39;");
  }
  function reduced(){
    try{ return W.matchMedia ? !!W.matchMedia("(prefers-reduced-motion: reduce)").matches : true; }
    catch(e){ return true; }
  }

  /* ============================================================
     1. ヴィラン解決（node.villain → ロスター。無ければ科目の手下へフォールバック）
     ============================================================ */
  S.villainOf = function(node){
    var e = (node && node.encounter) || null;
    var vid = (node && node.villain) || (e && e.villain) || null;
    if(vid && typeof W.villainById==="function"){
      var v = W.villainById(vid);
      if(v) return v;
    }
    var si = (e && typeof e.subject==="number") ? e.subject : 0;
    var list = (typeof W.villainsOf==="function") ? W.villainsOf(si,"mob") : [];
    return list.length ? list[0] : null;
  };

  /* 格（rank）ごとの手応え: 出題数と、本試験形式（五肢択一/個数）の最低混入数 */
  S.ENC_SHAPE = {
    mob: { n:8,  exam:1 },
    lt:  { n:10, exam:2 },
    mid: { n:12, exam:3 },
    boss:{ n:12, exam:3 }
  };
  S.encShape = function(node, v){
    var e = (node && node.encounter) || {};
    var base = (v && S.ENC_SHAPE[v.rank]) ? S.ENC_SHAPE[v.rank] : S.ENC_SHAPE.mob;
    var n = (typeof e.n==="number" && e.n>0) ? (e.n|0) : base.n;
    var ex = (typeof e.exam==="number" && e.exam>=0) ? (e.exam|0) : base.exam;
    if(ex > n-2) ex = n-2;
    if(ex < 0) ex = 0;
    return { n:n, exam:ex };
  };

  /* ============================================================
     2. (D) 出題の選び方（純関数・問題データ非改変）
        ・examPool（五肢択一/個数=examFmt）を必ず exam 本混ぜる → ○連打では絶対に解けない
        ・○×は「正解が○」と「正解が×」をほぼ同数（差1以内）に揃える → ○連打は半分外す
        ・並びはシャッフル（○×○×…の交互パターンにもしない）
     ============================================================ */
  S.pickStoryQuestions = function(tfPool, examPool, opts){
    opts = opts || {};
    var n = Math.max(3, (opts.n|0) || 8);
    var rnd = (typeof opts.rand==="function") ? opts.rand : Math.random;
    /* S4(A): 選抜層があるときは「直近に出したIDを避けて広く拾う+論点インターリーブ」に委ねる。
       ○/×の均衡と本試験形式の混入という S0 の不変条件は buildSet 側でも保っている。 */
    var SEL = (W.SRLearning && W.SRLearning.selection) || null;
    if(SEL && opts.wide){
      var qq = SEL.buildSet({ tfPool:tfPool, examPool:examPool, ring:opts.ring, n:n,
                              exam:(opts.exam==null?1:(opts.exam|0)), rand:rnd });
      if(qq.length >= 3) return qq;
    }
    function shuf(a){
      a = (a||[]).slice();
      for(var i=a.length-1;i>0;i--){ var j=Math.floor(rnd()*(i+1)), t=a[i]; a[i]=a[j]; a[j]=t; }
      return a;
    }
    var wantExam = (opts.exam==null) ? 1 : (opts.exam|0);
    if(wantExam < 0) wantExam = 0;
    if(wantExam > n-2) wantExam = n-2;
    var ex = shuf(examPool).slice(0, wantExam);

    var need = n - ex.length, tt = [], ff = [];
    shuf(tfPool).forEach(function(q){ if(q) (q.a===true ? tt : ff).push(q); });
    var tf = [], useT = rnd() < 0.5;
    while(tf.length < need && (tt.length || ff.length)){
      var src = useT ? tt : ff;
      if(!src.length) src = useT ? ff : tt;
      tf.push(src.shift());
      useT = !useT;
    }
    return shuf(tf.concat(ex));
  };

  /* 選抜結果の健全性（テスト/監査用）: ○/×の偏り・本試験形式の混入・○連打での取得点 */
  S.answerBalance = function(qs){
    var t=0, f=0, other=0;
    (qs||[]).forEach(function(q){
      if(!q) return;
      if(q.format && q.format!=="true_false"){ other++; return; }
      if(q.a===true) t++; else f++;
    });
    return { t:t, f:f, other:other, total:t+f+other, skew:Math.abs(t-f), maruOnly:t };
  };

  /* ============================================================
     3. (B) ブリーフィング HTML（純関数・全 esc）
        「誰か / 何の不正か / なぜ正すのか / 口上」を毎回はっきり伝える。
     ============================================================ */
  function faceHtml(v){
    var P = W.PX;
    if(v && v.sp && typeof W.px==="function" && P && Object.prototype.hasOwnProperty.call(P, v.sp)){
      return W.px(v.sp, 72, reduced() ? "" : "floaty");
    }
    return '<div class="story-face-ph" style="width:72px;height:72px">敵</div>';
  }
  /* S4(D): この戦いの「戦略目安」(テーマ/目標/難易度★/敵の狙い/推奨準備)。
     briefHtml は出撃前に描くので、applyStoryLoadout と同じ式で先に見積もる。 */
  S.encPlan = function(v, node){
    var SS = (W.SRLearning && W.SRLearning.strategy) || null;
    var SEL = (W.SRLearning && W.SRLearning.selection) || null;
    if(!SS) return null;
    var e = (node && node.encounter) || {};
    var si = (typeof e.subject==="number") ? e.subject : 0;
    var shape = S.encShape(node, v);
    var rank = (v && v.rank) ? v.rank : "mob";
    var quota = shape.exam;
    if(SEL && !(typeof e.exam==="number")){
      var seen = (typeof W.subjectSeenCount==="function") ? W.subjectSeenCount(si) : 0;
      quota = SEL.examQuota(shape.n, SEL.stageOf(seen), rank);
    }
    var theme = (v && v.topic) ? v.topic : ((W.SUBJECTS && W.SUBJECTS[si]) ? W.SUBJECTS[si] : "この科目の論点");
    return SS.plan({ n:shape.n, exam:quota, rank:rank, theme:theme });
  };
  S.stratHtml = function(v, node){
    var SS = (W.SRLearning && W.SRLearning.strategy) || null;
    var p = S.encPlan(v, node);
    return (SS && p) ? SS.html(p) : "";
  };

  S.briefHtml = function(v, node){
    if(!v) return "";
    var rank = (typeof W.villainRankLabel==="function") ? W.villainRankLabel(v.rank) : "敵";
    var lab = (node && node.encounter && node.encounter.label) ? node.encounter.label : "";
    return ''+
    '<div class="vbrief" role="group" aria-label="対峙する相手">'+
      '<div class="vbrief-head">'+ faceHtml(v) +
        '<div class="vbrief-id">'+
          '<span class="vbrief-rank">'+esc2(rank)+(lab?' ｜ '+esc2(lab):'')+'</span>'+
          '<b class="vbrief-name">'+esc2(v.n)+'</b>'+
          '<span class="vbrief-ttl">'+esc2(v.ttl)+'</span>'+
        '</div>'+
      '</div>'+
      '<div class="vbrief-row"><span class="vbrief-k">している不正</span>'+
        '<span class="vbrief-v">'+esc2(v.crime)+'</span></div>'+
      '<div class="vbrief-row"><span class="vbrief-k">問われる論点</span>'+
        '<span class="vbrief-v">'+esc2(v.topic)+'</span></div>'+
      '<div class="vbrief-row"><span class="vbrief-k">なぜ正すのか</span>'+
        '<span class="vbrief-v">'+esc2(v.why)+'</span></div>'+
      '<div class="vbrief-taunt">「'+esc2(v.taunt)+'」</div>'+
      S.stratHtml(v, node)+
      '<div class="vbrief-note">倒す＝労働法の知識で、この不正を正すということ。'+
        '○×の当てずっぽうでは通らない。読んで、判断しろ。</div>'+
      '<button class="btn go-btn vbrief-go" type="button" style="width:100%;margin-top:10px;padding:12px;min-height:44px" '+
        'onclick="srqStoryFight()">⚖ 事実と知識で立ち向かう ▶</button>'+
    '</div>';
  };

  /* ============================================================
     4. フロー: 物語 encounter → ブリーフィング → 旧UIバトル（出題を差し替え）
     ============================================================ */
  var pendingNode = null;

  /* 旧UIバトルの G に、この戦いの「相手」と「出題」を流し込む（学習判定・報酬は不変） */
  S.applyStoryLoadout = function(node){
    var g = W.G;
    if(!g || !Array.isArray(g.ids)) return null;
    var v = S.villainOf(node);
    var e = (node && node.encounter) || {};
    var si = (typeof e.subject==="number") ? e.subject : 0;
    var shape = S.encShape(node, v);

    var pool = (W.Q && typeof W.Q.filter==="function")
      ? W.Q.filter(function(q){ return q && q.s===si; }) : [];
    var exam = [];
    if(typeof W.examFmtIds==="function" && typeof W.qById==="function"){
      W.examFmtIds().forEach(function(id){
        var q = W.qById(id);
        if(q && q.s===si) exam.push(q);
      });
    }
    /* S4(B): 難易度ランプ。encounter が exam を明示していれば尊重し、そうでなければ
       「その科目をどれだけ解いたか(stage)」と敵の格から本試験形式の混入数を決める。
       ボスは examFmt 中心=過去問と同難易度。初戦は○×中心のまま(いきなり突き放さない)。 */
    var SEL = (W.SRLearning && W.SRLearning.selection) || null;
    var rank = (v && v.rank) ? v.rank : "mob";
    var quota = shape.exam;
    if(SEL && !(e && typeof e.exam==="number")){
      var seen = (typeof W.subjectSeenCount==="function") ? W.subjectSeenCount(si) : 0;
      quota = SEL.examQuota(shape.n, SEL.stageOf(seen), rank);
    }
    var ring = (typeof W.recentQRing==="function") ? W.recentQRing() : [];
    var picked = S.pickStoryQuestions(pool, exam, { n:shape.n, exam:quota, wide:true, ring:ring });
    if(picked.length >= 3){
      g.ids = picked.map(function(q){ return q.id; });
      g.idx = 0; g.course = true; g.courseCap = g.ids.length; g.cAns = 0;
      /* 物語戦は「敵を倒せば先へ進む」(殿2026-08-28)。問数消化ではなく、
         ヴィラン1体のHPを正解で削り切ることが終了条件。HP=選抜数=正解ノルマ。
         誤答で問題が尽きた場合は ui-battle 側が同科目から補充する。 */
      g.storyHPMax = g.ids.length; g.storyHP = g.storyHPMax;
    }
    /* S4(D): 入口の作戦カード用メタ(表示のみ。出題・採点には影響しない) */
    g.encRank = rank;
    g.stratTheme = (v && v.topic) ? v.topic
      : ((W.SUBJECTS && W.SUBJECTS[si]) ? W.SUBJECTS[si] : "この科目の論点");
    g.storyFoe = v ? { sp:v.sp, n:v.n, sub:(v.ttl+" ｜ "+v.topic) } : null;
    g.storyVid = v ? v.vid : null;
    return { villain:v, count:g.ids.length, exam:quota, rank:rank };
  };

  /* ブリーフィングの「立ち向かう」ボタン */
  W.srqStoryFight = function(){
    var node = pendingNode; pendingNode = null;
    if(typeof W.hideOvlSilent==="function"){ try{ W.hideOvlSilent(); }catch(e){} }
    else if(typeof W.hideOvl==="function"){ try{ W.hideOvl(); }catch(e){} }
    if(!node) return false;
    var ok = (typeof S.dispatchEncounter==="function") ? S.dispatchEncounter(node) : false;
    if(!ok) return false;
    S.applyStoryLoadout(node);
    if(typeof W.battle==="function"){ try{ W.battle(); }catch(e){} }  /* 差し替えた出題で描き直す */
    var v = S.villainOf(node);
    /* S3(F): 「◯◯ 現る」の登場バナー＋登場アニメ。演出層が無い環境は従来のバナーへ退く */
    var banner = false;
    if(v && S.anim && typeof S.anim.showFoeBanner==="function"){
      try{ banner = S.anim.showFoeBanner(v); }catch(e){ banner = false; }
      try{ S.anim.foeFx("enter", v.rank); }catch(e2){}
    }
    if(!banner && v && typeof W.bigBanner==="function"){
      try{ W.bigBanner("👹 "+v.n+" が立ちはだかる!", "#7A3BC9", 20); }catch(e3){}
    }
    return true;
  };

  /* 描画層の onEncounter ハンドラ（story-battle-bridge の同名関数を上書き＝ブリーフィングを挟む） */
  S.onStoryEncounter = function(node){
    /* 殿指示: 敵紹介カード(ブリーフィング)は廃止＝意味が分からない・唐突。
       物語の流れからそのまま戦闘へ直行する。相手が誰かは戦闘ヘッダ(storyFoe: 名前｜肩書｜論点)で示し、
       「なぜ戦うか」は物語の台詞側で語る。briefHtml 関数自体は他参照のため残置(未使用)。 */
    if(S.bridge && typeof S.bridge.begin==="function") S.bridge.begin(node);
    pendingNode = node;
    W.srqStoryFight();
  };

  /* テスト・監査用の覗き窓 */
  S._pendingBrief = function(){ return pendingNode; };
})();
