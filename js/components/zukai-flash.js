"use strict";
/* ============================================================
   components/zukai-flash.js — S4(C) 図解フラッシュ
   ※現在は戦闘から呼ばれない(殿: 正解時は解説だけで良い)。部品として残置。
   正解した瞬間に、その論点の図解カード(既存 ZUKAI 資産)を画面上部へ大きく一瞬だけ出す。
   ・テンポ最優先: 下の「次へ ▶」は常に押せる(カードは画面上部だけを占め、下は塞がない)。
   ・連続で正解するほど図解が次々に焼き付く=殿の言う「頭にフラッシュで入る」体験。
   ・誤答時は出さない(従来どおり解説をじっくり見せる)。
   ・prefers-reduced-motion: アニメ無し・表示を長めにして静的に見せる。いつでもタップ/Escで消せる。
   ・省データ(ST.opt.lowData)や設定OFF(ST.opt.zf===false)では出さない。
   ・図解HTMLは既存 zcardHtml() の出力をそのまま使う(問題データ・図解データは非改変)。
   eval/new Function 不使用。
   ============================================================ */
(function(){
  var W = (typeof window!=="undefined") ? window : globalThis;
  /* 図解は表と複数行を読み切れる長さを確保(殿: 図解が途中までしか出ない=短すぎた)。
     下の「次へ ▶」/タップ/Esc/Enter でいつでも即送りできるのでテンポは損なわない。 */
  var HOLD_MS = 2800, HOLD_MS_REDUCED = 3600;
  var timer = null, node = null, keyHandler = null;

  function reduced(){
    try{ return typeof W.matchMedia==="function" && W.matchMedia("(prefers-reduced-motion: reduce)").matches; }
    catch(e){ return false; }
  }
  /* 既存資産は classic script のトップレベル束縛(const/function)なので window には載らない。
     素の識別子を typeof ガードで見に行き、無ければ window 経由へ退く(どちらでも壊れない)。 */
  function state(){
    if(typeof ST!=="undefined" && ST) return ST;
    return W.gameState || W.ST || null;
  }
  function zukaiMap(){ return (typeof ZUKAI!=="undefined") ? ZUKAI : (W.ZUKAI || null); }
  function zkeyFn(){ return (typeof zkey==="function") ? zkey : W.zkey; }
  function zcardFn(){ return (typeof zcardHtml==="function") ? zcardHtml : W.zcardHtml; }

  function enabled(){
    var st = state();
    if(!st || !st.opt) return true;
    if(st.opt.lowData) return false;
    return st.opt.zf !== false;
  }

  /* 表示中のフラッシュを消す(バトル再描画・撤退・次の問題で必ず呼ぶ) */
  function clear(){
    if(timer){ try{ clearTimeout(timer); }catch(e){} timer = null; }
    if(keyHandler && typeof document!=="undefined" && document.removeEventListener){
      try{ document.removeEventListener("keydown", keyHandler); }catch(e2){}
    }
    keyHandler = null;
    if(node){ try{ node.remove(); }catch(e3){} node = null; }
  }

  /* 正解時のフラッシュ表示。q は問題オブジェクト。表示できたら true。 */
  function flash(q){
    if(!q || !enabled()) return false;
    if(typeof document==="undefined" || !document.createElement || !document.body) return false;
    var ZK = zkeyFn(), ZC = zcardFn(), ZM = zukaiMap();
    if(typeof ZK!=="function" || typeof ZC!=="function" || !ZM) return false;
    var k = null;
    try{ k = ZK(q); }catch(e){ return false; }
    if(!k || !ZM[k]) return false;
    var inner = "";
    try{ inner = ZC(k); }catch(e2){ return false; }
    if(!inner) return false;

    clear();
    var soft = reduced();
    var el = document.createElement("div");
    el.className = "zflash" + (soft ? " soft" : "");
    el.setAttribute("role", "status");
    el.setAttribute("aria-label", "正解の図解");
    /* 中身は既存の図解カードHTML(zcardHtml)。見出しの静的文言のみ自前で足す。 */
    el.innerHTML = '<div class="zflash-in">' +
      '<div class="zflash-tag">⚡ 正解! この図で覚えろ</div>' + inner +
      '<button class="zflash-x" type="button" aria-label="図解をとじる">✕ とじる</button></div>';
    if(el.addEventListener) el.addEventListener("click", clear);
    try{ document.body.appendChild(el); }catch(e3){ return false; }
    node = el;

    keyHandler = function(ev){
      var kk = ev && ev.key;
      if(kk==="Escape" || kk==="Enter" || kk===" ") clear();
    };
    if(document.addEventListener) document.addEventListener("keydown", keyHandler);
    timer = setTimeout(clear, soft ? HOLD_MS_REDUCED : HOLD_MS);
    return true;
  }

  W.zFlash = flash;
  W.zFlashClear = clear;
  W.zFlashEnabled = enabled;
  W.ZFLASH_HOLD_MS = HOLD_MS;
})();
