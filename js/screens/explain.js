"use strict";
/* ============================================================
   screens/explain.js — 解説パネル(2段階)+ 自己評価(Phase4d)
   ------------------------------------------------------------
   §6 Phase4: 回答直後のフィードバックを描画する純レンダラ + 自己評価アクション。
   ・正解時: ✅ + 敵ダメージ/XP + 短い根拠(要点)+「次へ」
   ・不正解/時間切れ: ❌ + 正解 + 間違えたポイント + 覚え方 + 根拠 + 再出題予定 +「次へ」
   ・解説は2段階: 要点(l1)を常時表示 →「詳しく見る」(<details>=無JS)で全文展開。テンポを止めない。
   ・自己評価「わかった/なんとなく/まだわからない」→ ease/due に反映(既存 ui-explain expSelf の芯を維持)。
       わかった(2): ease+0.1、正解なら次回を後ろ倒し(box=習得は触らない)
       なんとなく(1): 予定どおり(SRSが決めた due を尊重)
       まだ(0): box降格・明日再出題・ease-0.1
     → #42の芯(box前進=習得は別日 retrieval でしか起きない)を尊重。申告は「補助」に留める。
   ・描画は battle 画面(screens/battle.js)から呼ばれてインライン展開(1問1画面のテンポ優先)。
     router 単独 screen としても "explain" を登録(フラグ newUI.explain 用)。
   ・XSS: 全ての動的値は esc()。生値を innerHTML に入れない。全ボタン 44px は CSS 側。
   非module classic script。名前空間 window.SRApp.screens.explain。
   ============================================================ */
(function(){
  var G = (typeof window!=="undefined") ? window : globalThis;
  var APP = G.SRApp = G.SRApp || {};

  function esc(s){
    return String(s==null?"":s)
      .replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
      .replace(/"/g,"&quot;").replace(/'/g,"&#39;");
  }
  function num(v,d){ v=Number(v); return Number.isFinite(v)?v:(d||0); }
  function today(){ return (typeof G.todayNum==="function") ? G.todayNum() : Math.floor(Date.now()/864e5); }

  /* この問題の「正解」を人間向けラベルへ(答えを自動で当てる情報は描画時のみ・履歴に書かない) */
  function correctText(q){
    if(!q) return "";
    var L = G.SRLearning;
    var f = (L && L.scoring) ? L.scoring.quizFormat(q) : (q.format||"true_false");
    if(f==="choice" || f==="fill_blank"){
      if(Array.isArray(q.choices)){
        for(var i=0;i<q.choices.length;i++){
          if(q.choices[i] && q.choices[i].ok){
            var mark = q.kosuu ? "" : (("アイウエオ"[i]||(i+1))+" ");
            return mark + (q.choices[i].t||"");
          }
        }
      }
      return "";
    }
    if(f==="reorder") return Array.isArray(q.reorder) ? q.reorder.join(" → ") : "";
    return (q.a===true) ? "○(正しい)" : "×(誤り)";
  }

  /* 再出題予定(scoring 反映後の due を Store から読む・表示専用) */
  function dueText(q){
    try{
      var s = G.Store && G.Store.state;
      var st = s && s.learning && s.learning.q[String(q.id)];
      if(!st) return "";
      var d = (st.due||0) - today();
      var when = d<=0 ? "今日" : (d===1 ? "明日" : (d+"日後"));
      return "🔁 次の復習: " + when;
    }catch(e){ return ""; }
  }

  /* 自己評価ブロック(未申告=3ボタン / 申告済=結果メッセージ) */
  function selfHtml(ctx){
    if(ctx.selfDone){
      var m = ["🔁 明日もう一度出題します","🔁 予定どおり復習に出します","👍 次回は少し先に出題します"][ctx.selfLv||0] || "";
      return '<div class="exp-self exp-self--done">' + esc(m) + '</div>';
    }
    return '<div class="exp-self">'
      + '<div class="exp-self__q">今の理解度は?<small>(次回の出題タイミングに反映・任意)</small></div>'
      + '<div class="exp-self__btns">'
      + '<button type="button" class="btn small-btn sa-ok" data-action="explainSelf" data-arg="2">😎 わかった</button>'
      + '<button type="button" class="btn small-btn sa-mid" data-action="explainSelf" data-arg="1">🙂 なんとなく</button>'
      + '<button type="button" class="btn small-btn sa-ng" data-action="explainSelf" data-arg="0">😕 まだ</button>'
      + '</div></div>';
  }

  /* --- 本体: 解説パネルHTML(battle が phase==="fb" で差し込む) --- */
  function render(q, res, ctx){
    q = q || {}; res = res || {}; ctx = ctx || {};
    var ok = !!res.ok, timeout = !!res.timeout;
    var reward = ctx.reward || {};
    var parts = [];

    if(ok){
      var atk = res.attackKind;
      parts.push('<div class="exp-head exp-head--ok">✅ 正解!'
        + (atk ? ' <span class="exp-atk">' + esc(atk.name) + '</span>' : '') + '</div>');
      parts.push('<div class="exp-reward">🪙+' + num(reward.coin,0) + '　✨XP+' + num(reward.xp,0)
        + ((atk && atk.cls==="crit") ? '　' + esc(atk.word) : '') + '</div>');
    } else {
      parts.push('<div class="exp-head exp-head--ng">' + (timeout ? '⌛ 時間切れ' : '❌ 不正解') + '</div>');
      parts.push('<div class="exp-correct">正解: <b>' + esc(correctText(q)) + '</b></div>');
      if(q.wrongPoint) parts.push('<div class="exp-row">❌ <b>どこが間違い?</b> ' + esc(q.wrongPoint) + '</div>');
      if(q.mnemonic || q.memoryPoint) parts.push('<div class="exp-row">🧠 <b>覚え方</b> ' + esc(q.mnemonic || q.memoryPoint) + '</div>');
    }

    /* 要点(l1)= 常時表示 */
    var l1 = q.easyExplanation || q.e || "";
    if(l1) parts.push('<div class="exp-l1">' + esc(l1) + '</div>');

    /* 詳しく見る(2段階目・<details>=無JSで開閉・reduced-motion 安全) */
    var det = [];
    if(q.ruleExplanation) det.push('<div class="exp-row">📐 <b>ルール</b> ' + esc(q.ruleExplanation) + '</div>');
    if(q.reason)          det.push('<div class="exp-row">🤔 <b>なぜ?</b> ' + esc(q.reason) + '</div>');
    if(q.example)         det.push('<div class="exp-row">🍞 <b>具体例</b> ' + esc(q.example) + '</div>');
    if(q.trap)            det.push('<div class="exp-row">⚠️ <b>ひっかけ</b> ' + esc(q.trap) + '</div>');
    if(ok && q.wrongPoint) det.push('<div class="exp-row">❌ <b>間違えやすい所</b> ' + esc(q.wrongPoint) + '</div>');
    if(q.source)          det.push('<div class="exp-row">🧾 <b>根拠</b> ' + esc(q.source) + '</div>');
    if(det.length) parts.push('<details class="exp-more"><summary>📖 詳しく見る</summary><div class="exp-more__in">' + det.join("") + '</div></details>');

    /* 再出題予定 */
    var due = dueText(q);
    if(due) parts.push('<div class="exp-due">' + esc(due) + '</div>');

    /* 自己評価 */
    parts.push(selfHtml(ctx));

    /* 次へ(唯一の前進CTA) */
    parts.push('<div class="exp-next"><button type="button" class="btn btn--primary cta" data-action="battleNext">'
      + '<span class="cta__label">次へ</span></button></div>');

    return '<div class="exp-panel exp-panel--' + (ok ? "ok" : "ng") + '">' + parts.join("") + '</div>';
  }

  /* --- 自己評価の適用(ease/due 反映)。battle の現在戦闘状態を参照して1問へ反映 --- */
  function applySelf(lv){
    if(!(lv>=0 && lv<=2)) return;
    var B = APP.battle;
    var st = (B && B.state) ? B.state() : null;
    if(!st || st.phase!=="fb" || st.selfDone) return;
    var SG = G.SRGame, L = G.SRLearning, Store = G.Store;
    if(!SG || !L || !Store) return;
    var qid = SG.battle.curId(st.g);
    var good = !!(st.lastRes && st.lastRes.ok);
    var sched = L.scheduler, IV_MAX = sched.IV_MAX, tdn = today();
    Store.commit(function(s){
      var q = s.learning.q[String(qid)];
      if(!q) return;
      q.sa = lv;
      q.sac = (typeof q.sac==="number" ? q.sac : 0) + 1;   /* 申告回数(slice schema は数値) */
      s.learning.cnt.sa = (s.learning.cnt.sa||0) + 1;
      if(lv===0){
        q.box  = Math.max(0, (q.box||0) - 1);
        q.due  = tdn + 1;
        q.ease = sched.clampEase((q.ease||2.3) - 0.1);
      } else if(lv===2){
        q.ease = sched.clampEase((q.ease||2.3) + 0.1);
        if(good){
          var cur = Math.max(1, (q.due||tdn+1) - tdn);
          q.due = tdn + Math.min(IV_MAX, Math.max(cur, Math.round(cur*1.3) + 1));
        }
      }
      /* lv===1: SRS が決めた予定を尊重(何もしない) */
    });
    st.selfDone = true; st.selfLv = lv;
    if(B && B.repaint) B.repaint();
    try{ if(G.SFX && typeof G.SFX.coin==="function") G.SFX.coin(); }catch(e){}
  }

  /* router 単独 screen 登録(フラグ newUI.explain 用・単独表示時は最後の戦闘の解説) */
  function screenRender(){
    var B = APP.battle, st = (B && B.state) ? B.state() : null;
    var body = (st && st.lastQ)
      ? render(st.lastQ, st.lastRes, { reward:st.lastRw, selfDone:st.selfDone, selfLv:st.selfLv })
      : '<div class="exp-panel">解説はまだありません</div>';
    return '<section class="screen screen--explain" data-screen="explain">' + body + '</section>';
  }

  if(APP.router && typeof APP.router.register==="function"){ APP.router.register("explain", screenRender); }
  if(APP.events && typeof APP.events.on==="function"){
    APP.events.on("explainSelf", function(arg){ applySelf(parseInt(arg,10)); });
  }

  APP.screens = APP.screens || {};
  APP.screens.explain = { render:render, applySelf:applySelf, correctText:correctText };
})();
