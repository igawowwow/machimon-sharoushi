"use strict";
/* ============================================================
   story/story-anim.js — S3: シーン遷移・キャラ入退場・感情演出・敵登場アニメ
   ・(A) シーン遷移: 場所（背景シーン）が変わった時だけ暗転＋場所名スライドイン。
   ・(B) キャラ入退場: 新しく画面に出た立ち絵はスライドイン、消えた立ち絵はゴーストで
     フェードアウト、発話者が替わった時は軽いポップ。
   ・(C) 感情演出: expression（怒/驚/悲/喜/苦笑/決意）に応じて振動・閃光・暗転・ズーム。
   ・(D) テキスト演出: 1文字ずつ表示＋句読点で微ウェイト。タップで即全表示（既存の送りのまま）。
     重要語（『…』と労働法の語）はハイライト。
   ・(E) 抑制: 同じ演出を連続させず、直近3ノードで最大2回まで。reduced-motion は全停止。
   ・(F) 敵の登場バナー「◯◯ 現る」＋登場/被弾/攻撃/撃破アニメ（格ごとに強さを変える）。
   ・純ロジック（S.anim.*）は DOM を触らない＝テストは戻り値で検証。DOM 側は既存 S.ui を
     ラップするだけで、既存の送り/ログ/オート/既読スキップの挙動は変えない。
   ・物語データ（章ノード）は読むだけ。全ての動的文字列は自前 esc2 で無害化。
   ・eval / new Function 禁止。外部画像/フォント/ライブラリ不使用。
   docs/story-architecture.md §1/§4 準拠。480px / Safe Area / min44px。
   ============================================================ */
(function(){
  var G = (typeof window!=="undefined") ? window : globalThis;
  var S = G.SRStory = G.SRStory || {};
  var _win = G;

  function esc2(s){
    return String(s==null?"":s)
      .replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
      .replace(/"/g,"&quot;").replace(/'/g,"&#39;");
  }
  /* matchMedia が無い環境（テスト/最小）は「簡素化する」側に倒す＝演出は動かない */
  function reduced(){
    try{ return _win.matchMedia ? !!_win.matchMedia("(prefers-reduced-motion: reduce)").matches : true; }
    catch(e){ return true; }
  }
  function has(o,k){ return !!o && Object.prototype.hasOwnProperty.call(o,k); }
  function arr(a){ return (Object.prototype.toString.call(a)==="[object Array]") ? a : []; }

  var A = S.anim = S.anim || {};
  A.reduced = reduced;

  /* ============================================================
     1. (A) シーン遷移 — 背景シーンが変わった時だけ幕を引く
     ============================================================ */
  S.ANIM_TRANS = {
    none: { kind:"none", cls:"",           ms:0   },
    wipe: { kind:"wipe", cls:"sv-tr-wipe", ms:420 }
  };
  A.sceneOf = function(location){
    if(S.visuals && typeof S.visuals.sceneKeyOf==="function"){
      try{ return S.visuals.sceneKeyOf(location); }catch(e){}
    }
    return "";
  };
  /* prev が空（初回）でも、シーンが変わった時と同じく一枚の幕を引く */
  A.transitionFor = function(prevScene, nextScene){
    if(!nextScene) return S.ANIM_TRANS.none;
    if(prevScene===nextScene) return S.ANIM_TRANS.none;
    return S.ANIM_TRANS.wipe;
  };
  /* 遷移中に出す場所名（スライドイン）。location が無ければ何も出さない */
  A.transHtml = function(location){
    var s = (typeof location==="string") ? location : "";
    return '<div class="sv-tr" aria-hidden="true"><span class="sv-tr-veil"></span>'+
      (s ? '<span class="sv-tr-loc">'+esc2(s)+'</span>' : '')+'</div>';
  };

  /* ============================================================
     2. (B) キャラ入退場 — 立ち位置（roster）の差分から誰が入り誰が去ったかを出す
     ============================================================ */
  A.rosterDelta = function(prevIds, nextIds){
    var p = arr(prevIds), n = arr(nextIds), i, entered=[], left=[], stayed=[];
    for(i=0;i<n.length;i++){ if(p.indexOf(n[i])<0) entered.push(n[i]); else stayed.push(n[i]); }
    for(i=0;i<p.length;i++){ if(n.indexOf(p[i])<0) left.push(p[i]); }
    return { entered:entered, left:left, stayed:stayed };
  };
  /* 発話者が替わった＝中央の立ち絵を軽くポップさせる（入場アニメとは重ねない） */
  A.focusChanged = function(prevActive, nextActive){
    return !!nextActive && prevActive!==nextActive;
  };
  A.FIG_ENTER="sv-enter"; A.FIG_LEAVE="sv-leave"; A.FIG_FOCUS="sv-focus";
  A.figClass = function(id, delta, prevActive, nextActive){
    if(!id) return "";
    var d = delta || { entered:[], left:[] };
    if(arr(d.entered).indexOf(id)>=0) return A.FIG_ENTER;
    if(id===nextActive && A.focusChanged(prevActive,nextActive)) return A.FIG_FOCUS;
    return "";
  };

  /* ============================================================
     3. (C) 感情演出 — expression → 演出スペック（強すぎない/被せない）
     ============================================================ */
  var EX_ALIAS = {
    angry:"angry", rage:"angry", furious:"angry",
    shock:"shock", shake:"shock", surprise:"shock", surprised:"shock",
    sad:"sad", cry:"sad", grief:"sad",
    joy:"joy", smile:"joy", laugh:"joy", happy:"joy",
    wry:"wry", awkward:"wry", sweat:"wry",
    resolve:"resolve", determined:"resolve", vow:"resolve"
  };
  /* cls = overlay(.story-ui) に一時付与するクラス / flash = 全画面フラッシュ色 / hold = 解除まで ms */
  S.ANIM_EMOTION = {
    angry:  { key:"angry",  cls:"story-shake sv-fx-angry", flash:"#FFC9C0", flashMs:110, hold:340, buzz:1 },
    shock:  { key:"shock",  cls:"sv-fx-shock",             flash:"#FFF3C4", flashMs:110, hold:420, sfx:"special" },
    sad:    { key:"sad",    cls:"sv-fx-sad",               flash:"",        flashMs:0,   hold:700 },
    joy:    { key:"joy",    cls:"sv-fx-joy",               flash:"",        flashMs:0,   hold:420 },
    wry:    { key:"wry",    cls:"sv-fx-wry",               flash:"",        flashMs:0,   hold:360 },
    resolve:{ key:"resolve",cls:"sv-fx-resolve",           flash:"#FFFFFF", flashMs:150, hold:520 }
  };
  A.emotionKey = function(ex){
    var k = (typeof ex==="string") ? ex : "";
    return has(EX_ALIAS,k) ? EX_ALIAS[k] : "";
  };
  A.emotionFx = function(ex){
    var k = A.emotionKey(ex);
    return (k && has(S.ANIM_EMOTION,k)) ? S.ANIM_EMOTION[k] : null;
  };

  /* ---- (E) 抑制ゲート: 同じ演出を連続させない／直近 WINDOW ノードで MAX 回まで ---- */
  A.GATE_WINDOW = 3; A.GATE_MAX = 2;
  A.gate = function(history, key){
    if(!key) return false;
    var h = arr(history), i, n=0;
    if(h[0]===key) return false;
    for(i=0;i<h.length && i<A.GATE_WINDOW;i++){ if(h[i]) n++; }
    return n < A.GATE_MAX;
  };

  /* ============================================================
     4. (D) テキスト演出 — タイプ表示の間合いと重要語ハイライト
     ============================================================ */
  S.ANIM_TYPE = { base:15, comma:110, period:180, ellipsis:130, bang:150, br:150 };
  A.typeDelay = function(ch){
    var T = S.ANIM_TYPE, c = (typeof ch==="string") ? ch : "";
    if(c==="、"||c==="，"||c==="､") return T.comma;
    if(c==="。"||c==="."||c==="｡") return T.period;
    if(c==="…"||c==="‥") return T.ellipsis;
    if(c==="!"||c==="！"||c==="?"||c==="？") return T.bang;
    if(c==="\n") return T.br;
    return T.base;
  };
  /* 重要語（労働法の芯になる言葉）。物語データは書き換えず、表示時だけ強調する */
  S.ANIM_KEYWORDS = [
    "労働基準法","労働安全衛生法","労働災害","三六協定","就業規則","賃金台帳","労働者名簿",
    "割増賃金","時間外労働","法定労働時間","休憩","休日","年次有給休暇","解雇予告",
    "管理監督者","安全配慮義務","労災","打刻","最低賃金","賃金の全額払い","労働契約"
  ];
  /* 入力は「既に esc2 済み」の文字列であること。日本語語句と『』のみを対象にするため
     &amp; などの実体参照の内側にタグが割り込むことはない。 */
  A.highlight = function(escaped){
    var s = (typeof escaped==="string") ? escaped : "";
    if(!s) return "";
    s = s.replace(/『([^『』]{1,40})』/g, '<em class="sv-key">『$1』</em>');
    var list = S.ANIM_KEYWORDS, i, w, out=s;
    for(i=0;i<list.length;i++){
      w = list[i];
      if(!w || out.indexOf(w)<0) continue;
      out = out.split(w).join('<em class="sv-key">'+w+'</em>');
    }
    return out;
  };

  /* ============================================================
     5. (F) 敵の登場バナー / 被弾・攻撃・撃破アニメ
     ============================================================ */
  S.ANIM_FOE_RANK = {
    mob: { rank:"mob",  label:"手下",   color:"#6E86A8", ms:1150, cls:"sfoe-mob"  },
    lt:  { rank:"lt",   label:"幹部",   color:"#C58900", ms:1350, cls:"sfoe-lt"   },
    mid: { rank:"mid",  label:"中ボス", color:"#7A3BC9", ms:1600, cls:"sfoe-mid"  },
    boss:{ rank:"boss", label:"ボス",   color:"#FF3D7E", ms:1900, cls:"sfoe-boss" }
  };
  A.foeRank = function(rank){
    var k = (typeof rank==="string") ? rank : "";
    return has(S.ANIM_FOE_RANK,k) ? S.ANIM_FOE_RANK[k] : S.ANIM_FOE_RANK.mob;
  };
  A.FOE_KINDS = ["enter","hit","attack","defeat"];
  A.foeFxClass = function(kind, rank){
    var k = (typeof kind==="string") ? kind : "";
    if(A.FOE_KINDS.indexOf(k)<0) return "";
    return "sfoe-"+k+" "+A.foeRank(rank).cls;
  };
  A.FOE_FX_MS = { enter:560, hit:340, attack:460, defeat:720 };
  A.foeFxMs = function(kind){ return has(A.FOE_FX_MS,kind) ? A.FOE_FX_MS[kind] : 0; };
  /* 撃破は forwards のまま消えたままにする（外すと旧 .foe-die が再生し直して敵が甦って見える）。
     次の battle() 再描画が #bossface を作り直すのでクラスは残しても次の敵に影響しない。 */
  A.FOE_FX_STICKY = { defeat:1 };
  A.foeFxSticky = function(kind){ return has(A.FOE_FX_STICKY,kind); };
  /* 旧UIのアニメクラス。#bossface.sfoe-* を外した瞬間にこれらが再生し直すので一緒に落とす */
  A.FOE_LEGACY_CLS = ["foe-in","pop","hit"];
  /* 「工場長ベルガ 現る」— 名前で覚えさせる登場バナー（全て esc） */
  A.foeBannerHtml = function(v){
    if(!v || !v.n) return "";
    var r = A.foeRank(v.rank);
    return '<div class="sfoe-ban '+r.cls+'" style="--sfoe-c:'+r.color+'" role="status">'+
      '<div class="sfoe-ban-in">'+
        '<span class="sfoe-rank">'+esc2(r.label)+'</span>'+
        '<b class="sfoe-name">'+esc2(v.n)+'</b>'+
        (v.ttl ? '<span class="sfoe-ttl">'+esc2(v.ttl)+'</span>' : '')+
        '<span class="sfoe-arw">現る</span>'+
      '</div></div>';
  };

  /* ---- DOM 側（本番のみ動く。reduced-motion では静かな短時間表示） ---- */
  function body(){ var d=G.document; return d && d.body ? d.body : null; }
  A.showFoeBanner = function(v){
    var b = body(), html = A.foeBannerHtml(v);
    if(!b || !html || typeof G.document.createElement!=="function") return false;
    var d = G.document.createElement("div");
    d.className = "sfoe-ban-wrap" + (reduced() ? " sfoe-quiet" : "");
    d.innerHTML = html;
    b.appendChild(d);
    var ms = reduced() ? 900 : A.foeRank(v.rank).ms;
    _win.setTimeout(function(){
      if(d.parentNode && typeof d.parentNode.removeChild==="function"){ try{ d.parentNode.removeChild(d); }catch(e){} }
    }, ms);
    return true;
  };
  A.foeFx = function(kind, rank){
    var cls = A.foeFxClass(kind, rank);
    if(!cls || reduced()) return false;
    var d = G.document, el = (d && typeof d.getElementById==="function") ? d.getElementById("bossface") : null;
    if(!el || !el.classList) return false;
    var parts = cls.split(" "), i;
    for(i=0;i<parts.length;i++){ try{ el.classList.remove(parts[i]); }catch(e){} }
    /* リフロー無しでも再生されるよう、次フレームで付け直す */
    _win.setTimeout(function(){
      for(var j=0;j<parts.length;j++){ try{ el.classList.add(parts[j]); }catch(e){} }
      if(A.foeFxSticky(kind)) return;   /* 撃破は消えたまま＝甦らせない */
      _win.setTimeout(function(){
        for(var m=0;m<parts.length;m++){ try{ el.classList.remove(parts[m]); }catch(e){} }
        var L = A.FOE_LEGACY_CLS;
        for(var g=0;g<L.length;g++){ try{ el.classList.remove(L[g]); }catch(e){} }
      }, A.foeFxMs(kind));
    }, 0);
    return true;
  };
  G.srqFoeBanner = function(v){ return A.showFoeBanner(v); };
  G.srqFoeFx = function(kind, rank){ return A.foeFx(kind, rank); };

  /* ============================================================
     6. 描画層（S.ui）へのラップ。既存メソッドは呼び出しを保ったまま演出だけ足す。
     ============================================================ */
  var ui = S.ui;
  if(!ui) return;

  ui._animHist = [];
  ui._svScene = ""; ui._svIds = []; ui._svActive = ""; ui._svFig = null;

  /* ---- (D) タイプ表示: 句読点で微ウェイト。タップ即全表示は既存 _completeType のまま ---- */
  ui._clearType = function(){
    if(this._typeTimer){
      try{ _win.clearTimeout(this._typeTimer); }catch(e){}
      try{ _win.clearInterval(this._typeTimer); }catch(e2){}
      this._typeTimer = 0;
    }
    this._typing = false;
  };
  ui._startType = function(){
    this._shown = ""; this._typing = true; this._paint();
    var self = this, full = this._full, i = 0;
    function step(){
      if(!self._typing) return;
      i++;
      self._shown = full.slice(0, i);
      self._paint();
      if(i >= full.length){ self._clearType(); self._afterText(); return; }
      self._typeTimer = _win.setTimeout(step, A.typeDelay(full.charAt(i-1)));
    }
    this._typeTimer = _win.setTimeout(step, 0);
  };
  /* ---- (D) 重要語ハイライト（esc2 の後にだけ適用＝生の台詞は決してそのまま入れない） ---- */
  ui._paint = function(){
    var d = G.document; if(!d || typeof d.getElementById!=="function") return;
    var t = d.getElementById("storyTxt");
    if(t) t.innerHTML = A.highlight(esc2(this._shown));
  };

  /* ---- (C) 感情演出: 1ノード1演出まで。ゲートで連続・多重を抑える ---- */
  ui._fx = function(node){
    var spec = A.emotionFx(node && node.expression);
    var key = spec ? spec.key : "";
    if(!spec || reduced() || !this._el){ this._animHist.unshift(""); this._animHist.length=Math.min(this._animHist.length,8); return; }
    if(!A.gate(this._animHist, key)){ this._animHist.unshift(""); this._animHist.length=Math.min(this._animHist.length,8); return; }
    this._animHist.unshift(key); this._animHist.length = Math.min(this._animHist.length, 8);
    var el = this._el, parts = String(spec.cls||"").split(" "), i;
    for(i=0;i<parts.length;i++){ if(parts[i]){ try{ el.classList.add(parts[i]); }catch(e){} } }
    _win.setTimeout(function(){
      for(var j=0;j<parts.length;j++){ if(parts[j]){ try{ el.classList.remove(parts[j]); }catch(e){} } }
    }, spec.hold);
    if(spec.flash){ try{ if(typeof G.flash==="function") G.flash(spec.flash, spec.flashMs); }catch(e2){} }
    if(spec.buzz){ try{ if(G.navigator && typeof G.navigator.vibrate==="function") G.navigator.vibrate(18); }catch(e3){} }
  };

  /* ---- (A)(B) シーン遷移とキャラ入退場: _renderFrame をラップして描画後に演出を載せる ---- */
  var _renderFrame = ui._renderFrame;
  ui._renderFrame = function(){
    var prevScene = this._svScene, prevIds = arr(this._svIds), prevActive = this._svActive;
    var prevFig = this._svFig;
    var node = this.node;
    var nextScene = this.logOpen ? prevScene : A.sceneOf(node && node.location);
    var nextActive = (node && typeof node.speaker==="string" && node.speaker!=="narrator") ? node.speaker : "";

    _renderFrame.call(this);
    if(this.logOpen || this.mode==="interlude"){ return; }
    if(this.mode!=="choice") this._paint();   /* 即時全文表示の時もハイライトを効かせる */

    var nextIds = arr(this._roster && this._roster.ids);
    var delta = A.rosterDelta(prevIds, nextIds);
    this._svScene = nextScene; this._svIds = nextIds.slice(0); this._svActive = nextActive;
    if(reduced() || !this._el) { this._svFig = null; return; }

    var el = this._el, figs = this._figMap(el);
    this._svFig = figs;
    var id, cls;
    for(id in figs){
      cls = A.figClass(id, delta, prevActive, nextActive);
      if(cls && figs[id].el && figs[id].el.classList){ try{ figs[id].el.classList.add(cls); }catch(e){} }
    }
    this._ghosts(delta.left, prevFig);
    var tr = A.transitionFor(prevScene, nextScene);
    if(tr.ms) this._sceneTrans(tr, node && node.location);
  };

  /* 現在フレームの立ち絵を data-sp で引ける形にする（DOM が無い環境では空） */
  ui._figMap = function(el){
    var out = {};
    if(!el || typeof el.querySelectorAll!=="function") return out;
    var list;
    try{ list = el.querySelectorAll(".sv-fig[data-sp]"); }catch(e){ return out; }
    for(var i=0; list && i<list.length; i++){
      var f = list[i], sp = (typeof f.getAttribute==="function") ? f.getAttribute("data-sp") : null;
      if(sp) out[sp] = { el:f, html:(typeof f.outerHTML==="string") ? f.outerHTML : "" };
    }
    return out;
  };
  /* 去った立ち絵は「幽霊」を一枚だけ重ねてフェードアウトさせる（本物は再描画で既に消えている） */
  ui._ghosts = function(left, prevFig){
    var ids = arr(left);
    if(!ids.length || !prevFig || !this._el) return;
    var d = G.document; if(!d || typeof d.createElement!=="function") return;
    var stage = (typeof this._el.querySelector==="function") ? this._el.querySelector(".sv-stage") : null;
    if(!stage || typeof stage.appendChild!=="function") return;
    var layer = d.createElement("div");
    layer.className = "sv-ghosts";
    var html = "", i;
    for(i=0;i<ids.length && i<2;i++){
      var g = prevFig[ids[i]];
      if(g && g.html) html += g.html;   /* 自前生成の HTML（既に esc 済み）のみを再利用 */
    }
    if(!html) return;
    layer.innerHTML = html;
    stage.appendChild(layer);
    _win.setTimeout(function(){
      if(layer.parentNode && typeof layer.parentNode.removeChild==="function"){ try{ layer.parentNode.removeChild(layer); }catch(e){} }
    }, 320);
  };
  /* 場所が変わった時の暗転＋場所名スライドイン（1枚だけ・タップの邪魔をしない） */
  ui._sceneTrans = function(tr, location){
    var d = G.document; if(!d || typeof d.createElement!=="function" || !this._el) return;
    var w = d.createElement("div");
    w.className = "sv-tr-wrap " + tr.cls;
    w.innerHTML = A.transHtml(location);
    if(typeof this._el.appendChild!=="function") return;
    this._el.appendChild(w);
    _win.setTimeout(function(){
      if(w.parentNode && typeof w.parentNode.removeChild==="function"){ try{ w.parentNode.removeChild(w); }catch(e){} }
    }, tr.ms);
  };

  /* 再生開始のたびに演出の記憶を捨てる（前の話の残像を持ち込まない） */
  var _play = ui.play;
  ui.play = function(chapterId, nodeId, opts){
    this._animHist = []; this._svScene=""; this._svIds=[]; this._svActive=""; this._svFig=null;
    return _play.call(this, chapterId, nodeId, opts);
  };
})();
