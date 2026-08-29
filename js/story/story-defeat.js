"use strict";
/* ============================================================
   story/story-defeat.js — 敗北しても物語は終わらない（非懲罰の敗北幕）＋
                           物語⇔演習の「急すぎ」対策（挑戦幕・突入ワイプ）
   ・物語 encounter で敗北し分岐(else)が無い時、engine は {status:"retry"} を
     返すだけで何も描画されず、空のオーバーレイ＝実質ゲームオーバーに見えていた。
   ・ここで resumeAfterBattle をラップし、retry 時に「敗北幕」を提示する:
       🔥 もう一度挑む … 同じ encounter を再ディスパッチ
       🏠 拠点にもどる … resume 温存＝「続きから」でこの場面に戻れる
     ※「物語を先へ進める」は置かない(殿 2026-08-15: 負け続けるだけで物語が
       最後まで進んでしまう。勝利だけが前進条件)。進行(章の現在地)は失われない。
   ・renderer 本体は無傷（story-anim.js と同じラップ方式）。未ロードでも従来動作。
   ・eval/new Function 禁止・動的文字列なし（全て静的HTML）。
   ============================================================ */
(function(){
  var G = (typeof window!=="undefined") ? window : globalThis;
  var S = G.SRStory = G.SRStory || {};
  var ui = S.ui;
  if(!ui || typeof ui.resumeAfterBattle!=="function") return;  /* renderer 未ロードでも安全 */

  function setScene(sc){ try{ if(typeof G.setBgmScene==="function" && sc) G.setBgmScene(sc); }catch(e){} }
  function esc2(s){
    return String(s==null?"":s)
      .replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
      .replace(/"/g,"&quot;").replace(/'/g,"&#39;");
  }
  function reduced(){ try{ return !!(G.matchMedia && G.matchMedia("(prefers-reduced-motion: reduce)").matches); }catch(e){ return true; } }
  /* 戦闘突入ワイプ: 物語→演習の画面切替を一枚の幕でつなぐ(急な場面転換を和らげる) */
  function battleWipe(){
    if(reduced())return;
    try{
      var d=G.document;if(!d||!d.body)return;
      var w=d.createElement("div");w.className="battle-wipe";
      w.innerHTML='<span class="bw-mark">⚔️</span>';
      d.body.appendChild(w);
      G.setTimeout(function(){ try{ w.classList.add("out"); }catch(e){} },420);
      G.setTimeout(function(){ try{ w.remove(); }catch(e){} },900);
    }catch(e){}
  }

  /* ---- 敗北幕の提示。mode="defeat" 中は api=null なのでタップ送りは自然に無効 ---- */
  ui._showDefeat = function(res){
    this._clearType(); this._clearAuto();
    var node = (res && res.node) || this.node || null;
    this.node = node; this.api = null; this.mode = "defeat"; this.choices = null;
    this._ensureEl();
    var el = this._el; if(!el) return;
    var V = S.visuals, bg = "";
    if(V && node){ try{ bg = V.bgHtml(node.location); }catch(e){ bg = ""; } }
    el.innerHTML = bg +
      '<div class="story-box">'+
        '<div class="sn">💫 力尽きた…</div>'+
        '<div class="st2">だがここまでの歩みは失われない。この演習に勝てば、物語は先へ進む。何度でも挑め。</div>'+
        '<div class="story-choices" role="group" aria-label="敗北後の選択">'+
          '<button class="story-choice" type="button" data-action="storyRetry">🔥 もう一度挑む</button>'+
          '<button class="story-choice" type="button" data-action="storyClose">🏠 拠点にもどる（鍛え直して、続きから再挑戦できる）</button>'+
        '</div>'+
      '</div>';
  };

  /* ---- 敗北幕→もう一度挑む: overlay を閉じ、同じ encounter を再ディスパッチ ---- */
  ui.retryBattle = function(){
    if(this.mode!=="defeat") return;
    var node = this.node;
    this._clearType(); this._clearAuto();
    this.mode = "";
    battleWipe();
    this._removeEl(); this.open = false; setScene(this._entryScene);
    if(node && typeof S.onStoryEncounter==="function") S.onStoryEncounter(node);
  };

  /* ---- 挑戦幕: 物語の encounter で即バトルに飛ばさず、ひと呼吸置く(殿: 急すぎ対策) ----
     ・encounter ノード自身のテキスト(場面説明)をここで初めて見せる
     ・「⚔️ いどむ」で突入ワイプ→従来どおり戦闘へ / 「🏠 拠点」なら resume 温存で離脱 */
  var _enc = ui._encounter;
  ui._encounter = function(node, api){
    this._clearType(); this._clearAuto();
    this.node = node; this.api = api; this.mode = "encounterIntro"; this.choices = null;
    this._ensureEl();
    var el = this._el;
    if(!el){ return _enc.call(this, node, api); }   /* DOM無し(テスト等)は従来どおり即委譲 */
    var V = S.visuals, bg = "";
    if(V && node){ try{ bg = V.bgHtml(node.location); }catch(e){ bg = ""; } }
    var txt = (node && typeof node.text==="string" && node.text) ? node.text : "行く手を阻む者が現れた。";
    el.innerHTML = bg +
      '<div class="story-box">'+
        '<div class="sn">⚔️ 演習</div>'+
        '<div class="st2">'+esc2(txt)+'</div>'+
        '<div class="story-choices" role="group" aria-label="演習にいどむ">'+
          '<button class="story-choice" type="button" data-action="storyFight">⚔️ いどむ</button>'+
          '<button class="story-choice" type="button" data-action="storyClose">🏠 拠点にもどる（続きはいつでも再開できる）</button>'+
        '</div>'+
      '</div>';
  };
  /* 挑戦幕→いどむ: ワイプを被せてから従来の戦闘委譲(橋渡し)へ */
  ui.enterEncounterBattle = function(){
    if(this.mode!=="encounterIntro")return;
    var node=this.node, api=this.api;
    this.mode = "";
    battleWipe();
    try{ if(G.SFX && typeof G.SFX.special==="function") G.SFX.special(); }catch(e){}
    return _enc.call(this, node, api);
  };

  /* ---- タップガード: 敗北幕/挑戦幕は背景タップで前進させない(誤スキップ防止) ---- */
  var _tap = ui.tap;
  ui.tap = function(){
    if(this.mode==="defeat"||this.mode==="encounterIntro")return;
    return _tap.call(this);
  };

  /* ---- resumeAfterBattle をラップ: 敗北(retry)なら敗北幕へ ---- */
  var _resume = ui.resumeAfterBattle;
  ui.resumeAfterBattle = function(win, g){
    var res = _resume.call(this, win, g);
    if(res && res.status==="retry") this._showDefeat(res);
    return res;
  };

  /* ---- クリックをラップ: storyRetry/storyFight だけ拾い、他は従来処理へ ---- */
  var _click = ui._onClick;
  ui._onClick = function(ev){
    var el = ev && ev.target, act = null;
    for(var i=0; el && i<6; i++){
      if(el.getAttribute && (act=el.getAttribute("data-action"))) break;
      el = el.parentNode;
    }
    if(act==="storyRetry" || act==="storyFight"){
      if(ev && typeof ev.stopPropagation==="function") ev.stopPropagation();
      if(act==="storyRetry") this.retryBattle();
      else this.enterEncounterBattle();
      return;
    }
    return _click.call(this, ev);
  };
})();
