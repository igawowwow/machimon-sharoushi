"use strict";
/* ============================================================
   screens/battle.js — 新バトル画面(1画面1問)(Phase4d)
   ------------------------------------------------------------
   §6 Phase4: game/battle-engine 状態機械を描画へ結線する薄い screen。
   ・問題文/選択肢/残り時間(timedのみ)/敵HP(bossのみ)/最小補助(のこり問数・ライフ)。
   ・全形式(true_false/choice/kosuu/fill_blank/reorder)を新レンダラで表示。inline onclick→data-action。
   ・回答前に「長ステータス/多通貨/他モードボタン」を出さない(敵+問題+回答肢のみ)。
   ・採点は learning/scoring(純関数)へ委譲=旧 resolve と数値一致(parityで固定)。SRS/masteryに screen は触らない。
   ・報酬は game/rewards へ委譲。engine(HP/ライフ/コンボ/メタル)と学習(scoring)を分離。
   ・回答→解説(screens/explain をインライン展開)→次へ→…→撃破→result(「もう1戦」)。
   ・XSS: 全ての動的値は esc()。全ボタン 44px は CSS 側。reduced-motion は演出を持たない設計で安全。
   非module classic script。名前空間 window.SRApp.battle / screens.battle。
   ============================================================ */
(function(){
  var G = (typeof window!=="undefined") ? window : globalThis;
  var APP = G.SRApp = G.SRApp || {};

  function esc(s){
    return String(s==null?"":s)
      .replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
      .replace(/"/g,"&quot;").replace(/'/g,"&#39;");
  }
  function today(){ return (typeof G.todayNum==="function") ? G.todayNum() : Math.floor(Date.now()/864e5); }
  function shuffle(a){ a=a.slice(); for(var i=a.length-1;i>0;i--){ var j=Math.floor(Math.random()*(i+1)); var t=a[i];a[i]=a[j];a[j]=t; } return a; }
  function doc(){ return (typeof G.document!=="undefined") ? G.document : null; }

  var _st = null;      /* この画面の一時状態(戦闘は engine 所有・ここは表示制御) */
  var _timer = null;

  function fmt(q){ var L=G.SRLearning; return (L&&L.scoring) ? L.scoring.quizFormat(q) : "true_false"; }
  /* 問題バンクは const(global-lexical)=window プロパティではないため bare 参照(typeof ガード) */
  function byId(id){ return (typeof qById==="function") ? qById(id) : null; }
  function curQ(){
    var g = _st && _st.g; if(!g) return null;
    return byId(G.SRGame.battle.curId(g));
  }
  function bossName(g){
    try{
      if(g.subject!=null && typeof BOSSES!=="undefined" && BOSSES[g.subject]) return BOSSES[g.subject].name;
    }catch(e){}
    return "試験の魔物";
  }

  /* ---------- タイマ(timed 敵=bossのみ。today/review は非timed=起動しない) ---------- */
  function stopTimer(){ if(_timer){ try{ G.clearInterval(_timer); }catch(e){} _timer=null; } }
  function startTimer(){
    stopTimer();
    var g = _st && _st.g;
    if(!g || !G.SRGame.battle.isTimed(g)) return;
    var q = curQ();
    var L = G.SRLearning;
    var TL = (L && L.exam) ? L.exam.examTimeLimit("demon", q) : 30;
    _st.t = TL;
    var d = doc(); if(!d || typeof G.setInterval!=="function") return;
    _timer = G.setInterval(function(){
      if(!_st || _st.phase!=="q"){ stopTimer(); return; }
      _st.t -= 0.1;
      var bar = d.getElementById && d.getElementById("bTimer");
      if(bar && bar.style){ bar.style.width = Math.max(0, _st.t/TL*100) + "%"; }
      if(_st.t<=0){ stopTimer(); _timeout(); }
    }, 100);
    if(APP.lifecycle && APP.lifecycle.addTimer) APP.lifecycle.addTimer(_timer);
  }

  /* ---------- レンダリング ---------- */
  function qCard(q){
    if(q.kosuu && Array.isArray(q.statements)){
      return '<div class="b-qcard"><p class="b-qtext">' + esc(q.q) + '</p>'
        + '<div class="b-kosuu">' + q.statements.map(function(s,i){
            return '<div class="b-kosuu-st"><b>' + (("アイウエオ"[i])||(i+1)) + '</b><span>' + esc(s.t) + '</span></div>';
          }).join("") + '</div></div>';
    }
    return '<div class="b-qcard"><p class="b-qtext">' + esc(q.q) + '</p></div>';
  }
  function ansArea(q){
    var f = fmt(q);
    if(f==="choice" || f==="fill_blank"){
      var kosuu = !!q.kosuu;
      var head = (f==="fill_blank" ? '<div class="b-note">✏️ 【 ? 】に入る語句・数字を選べ</div>' : '')
               + (kosuu ? '<div class="b-note">🔢 正しい記述はいくつあるか下から選べ</div>' : '');
      var opts = (q.choices||[]).map(function(c,i){
        var lbl = kosuu ? "" : ('<b>' + (("アイウエオ"[i])||(i+1)) + '</b> ');
        return '<button type="button" class="btn choice-btn" data-action="battleAns" data-arg="ch:' + i + '">'
             + lbl + esc(c.t) + '</button>';
      }).join("");
      return head + '<div class="b-choices">' + opts + '</div>';
    }
    if(f==="reorder"){
      if(!_st.reView || _st.reViewId!==q.id){ _st.reView = shuffle((q.reorder||[]).map(function(s,i){ return {s:s,i:i}; })); _st.reViewId = q.id; }
      var seq = _st.seq || [];
      var opts2 = _st.reView.map(function(o){
        var pi = seq.indexOf(o.i);
        var done = pi>=0;
        return '<button type="button" class="btn choice-btn' + (done?" is-picked":"") + '"'
             + (done?' disabled':'') + ' data-action="battleAns" data-arg="re:' + o.i + '">'
             + (done?('<b>'+(pi+1)+'.</b> '):'') + esc(o.s) + '</button>';
      }).join("");
      var progTxt = seq.length ? ('選択順: ' + seq.map(function(x){ return q.reorder[x]; }).join(" → ")) : '選択順: ─';
      return '<div class="b-note">🔢 ' + esc(q.reorderPrompt||"正しい順番にタップせよ") + '</div>'
           + '<div class="b-choices">' + opts2 + '</div>'
           + '<div class="b-note b-reprog">' + esc(progTxt) + '</div>';
    }
    /* true_false */
    return '<div class="b-tf">'
      + '<button type="button" class="btn ans-btn maru" data-action="battleAns" data-arg="tf:1">○</button>'
      + '<button type="button" class="btn ans-btn batsu" data-action="battleAns" data-arg="tf:0">×</button>'
      + '</div>';
  }
  function enemyStrip(g){
    if(g.kind==="boss"){
      var pb = APP.progressbar ? APP.progressbar.progressbar({ value:g.hp, max:g.hpMax, variant:"accent", label:"敵HP" }) : "";
      return '<div class="b-enemy"><div class="b-enemy__name">👹 ' + esc(bossName(g)) + '</div>' + pb + '</div>';
    }
    return '<div class="b-enemy"><div class="b-enemy__name">👾 試験の魔物</div></div>';
  }
  function progLine(g){
    var B = G.SRGame.battle;
    if(B.isCourse(g)){
      var done = (g.cAns||0), cap = (g.courseCap||g.ids.length);
      return '<div class="b-prog">問 ' + Math.min(done+1, cap) + ' / ' + cap + '　<span class="b-life">❤️' + g.life + '</span></div>';
    }
    return '<div class="b-prog"><span class="b-life">❤️' + g.life + '</span></div>';
  }

  function questionHtml(){
    var g = _st.g, q = curQ();
    var timer = G.SRGame.battle.isTimed(g)
      ? '<div class="b-timer"><div class="b-timer__bar" id="bTimer" style="width:100%"></div></div>' : '';
    var body = q ? (qCard(q) + ansArea(q)) : '<div class="b-empty">問題がありません</div>';
    return '<section class="screen screen--battle" data-screen="battle">'
         + enemyStrip(g) + timer + progLine(g)
         + '<div class="b-body">' + body + '</div></section>';
  }
  function feedbackHtml(){
    var EX = APP.screens && APP.screens.explain;
    var panel = (EX && EX.render)
      ? EX.render(_st.lastQ, _st.lastRes, { reward:_st.lastRw, ev:_st.lastEv, selfDone:_st.selfDone, selfLv:_st.selfLv })
      : '<div class="exp-panel">' + esc((_st.lastRes&&_st.lastRes.ok)?"正解!":"不正解") + '</div>';
    return '<section class="screen screen--battle screen--battle-fb" data-screen="battle">' + panel + '</section>';
  }
  function html(){
    if(!_st) return '<section class="screen screen--battle" data-screen="battle"></section>';
    return (_st.phase==="fb") ? feedbackHtml() : questionHtml();
  }
  function paint(){
    var d = doc(); if(!d || !d.querySelector) return;
    var mount = d.querySelector("#app"); if(!mount) return;
    mount.innerHTML = html();
  }

  /* ---------- 状態機械への結線 ---------- */
  function begin(params){
    params = params || {};
    var SG = G.SRGame; if(!SG || !SG.battle) return null;
    var enc = params.enc; if(!enc) return null;
    stopTimer();
    var g = SG.battle.start(enc);
    _st = {
      g:g, session:(params.session||null), subject:(params.subject!=null?params.subject:null),
      kind:(params.kind||enc.kind),
      sess:{ correct:0, total:0, bestCombo:0, win:false },
      phase:"q", seq:[], reView:null, reViewId:null,
      selfDone:false, selfLv:-1,
      lastQ:null, lastRes:null, lastEv:null, lastRw:null, t:0
    };
    try{ G.Store.ui.battle = g; }catch(e){}
    return _st;
  }

  /* 回答委譲(data-action="battleAns" data-arg=tf:1|tf:0|ch:i|re:i) */
  function onAns(arg){
    if(!_st || _st.phase!=="q") return;
    var g = _st.g; if(!g || g.phase!=="await") return;
    var q = curQ(); if(!q) return;
    var s = String(arg||"");
    if(s.indexOf("re:")===0){
      var ri = parseInt(s.slice(3),10);
      if(_st.seq.indexOf(ri)>=0) return;
      _st.seq.push(ri);
      if(_st.seq.length < (q.reorder||[]).length){ paint(); return; }
      var okR = _st.seq.every(function(v,idx){ return v===idx; });
      return submit(q, { ok:okR, label: okR?"完璧な順番!":("正しい順番: "+q.reorder.join(" → ")) }, okR);
    }
    if(s.indexOf("tf:")===0){ var b=(s==="tf:1"); return submit(q, b, (b===q.a)); }
    if(s.indexOf("ch:")===0){
      var ci = parseInt(s.slice(3),10);
      var c = (q.choices && q.choices[ci]) || {};
      var okC = !!c.ok;
      return submit(q, { ok:okC, label:"" }, okC);
    }
  }
  function _timeout(){
    if(!_st || _st.phase!=="q") return;
    var q = curQ(); if(!q) return;
    submit(q, null, false);
  }

  /* 採点(scoring・純)→ engine 反映 → 報酬(rewards)→ 解説へ */
  function submit(q, userAns, ok){
    var SG = G.SRGame, L = G.SRLearning, Store = G.Store, SR = G.SRState;
    var g = _st.g;
    if(!SG.battle.answer(g, userAns)) return;
    stopTimer();
    var qid = SG.battle.curId(g);
    var tdn = today();
    var res = null;
    Store.commit(function(s){
      var key = String(qid), qmap = s.learning.q;
      if(!qmap[key]) qmap[key] = (SR && SR.defaultQStat) ? SR.defaultQStat() : L.schema.defaultQStat();
      res = L.scoring.scoreAnswer(qid, userAns, { q:q, stat:qmap[key], today:tdn });
      s.learning.totalC += res.deltas.totalC;
      s.learning.totalW += res.deltas.totalW;
      if(res.deltas.rev) s.learning.cnt.rev = (s.learning.cnt.rev||0) + res.deltas.rev;
    });
    var ev = SG.battle.resolve(g, { ok:ok, dmg:1 });
    /* 報酬(正解時のみ・game/rewards 純関数へ委譲) */
    var atk = res && res.attackKind, akMult = atk ? atk.mult : 1;
    var rw = SG.rewards.answerReward({
      loop:(Store.state.adventure && Store.state.adventure.loop) || 1,
      combo:g.combo, crit:!!(atk && atk.cls==="crit"),
      memMult:res?res.memMult:1, akMult:akMult,
      review:(g.kind==="review"), wasDue:res?res.wasDue:false, repeat:res?res.repeat:false
    });
    if(ok){ Store.commit(function(s){ s.player.coins = (s.player.coins||0) + rw.coin; s.player.xp = (s.player.xp||0) + rw.xpLeveled; }); }
    /* セッション集計 */
    _st.sess.total++; if(ok) _st.sess.correct++;
    if(g.bestCombo > _st.sess.bestCombo) _st.sess.bestCombo = g.bestCombo;
    _st.lastQ = q; _st.lastRes = res; _st.lastEv = ev; _st.lastRw = rw;
    _st.selfDone = false; _st.selfLv = -1; _st.phase = "fb"; _st.seq = [];
    try{ if(typeof G.SFX!=="undefined" && G.SFX) (ok ? G.SFX.ok && G.SFX.ok() : G.SFX.ng && G.SFX.ng()); }catch(e){}
    paint();
  }

  /* 次へ(engine.advance → 継続 or result) */
  function next(){
    if(!_st || _st.phase!=="fb") return;
    var a = G.SRGame.battle.advance(_st.g);
    if(a.done){ return finish(a.win); }
    _st.phase = "q"; _st.seq = []; _st.reView = null; _st.reViewId = null;
    paint(); startTimer();
    return a;
  }
  function finish(win){
    _st.sess.win = !!win;
    try{ G.Store.ui.sess = _st.sess; }catch(e){}
    stopTimer();
    var R = APP.router;
    if(R && R.go) R.go({ tab:"adventure", screen:"result", params:{ result:_st.sess } });
    return _st.sess;
  }

  /* router 入口: enc を受けて開始 → 現フェーズHTMLを返す(router が #app へ mount) */
  function render(params){
    params = params || {};
    if(params.enc && (!_st || _st.g.enc!==params.enc)){ begin(params); }
    else if(!_st && params.enc){ begin(params); }
    var out = html();
    startTimer();
    return out;
  }

  /* leave 時: タイマ確実停止(BGM/状態リーク防止) */
  if(APP.lifecycle && typeof APP.lifecycle.onLeave==="function"){
    APP.lifecycle.onLeave("battle", function(){ stopTimer(); });
  }
  if(APP.router && typeof APP.router.register==="function"){ APP.router.register("battle", render); }
  if(APP.events && typeof APP.events.on==="function"){
    APP.events.on("battleAns", onAns);
    APP.events.on("battleNext", next);
  }

  /* explain(自己評価)から参照する薄い公開API */
  APP.battle = {
    begin:begin, render:render, submit:submit, onAns:onAns, next:next, finish:finish, timeout:_timeout,
    state:function(){ return _st; }, repaint:paint, current:function(){ return _st && _st.g; }
  };
  APP.screens = APP.screens || {};
  APP.screens.battle = { render:render };
})();
