"use strict";
/* ============================================================
   story/story-dialogue-renderer.js — 会話/選択の描画層（R3）＋ S2 ビジュアルノベル化
   ・既存 .story-ovl を継承し、背景/立ち絵/話者名/台詞/タップ送り/選択肢を描画。
     背景・立ち絵・表情の HTML は story-visuals.js（純粋関数）に委譲（未ロードでも従来表示で動く）。
   ・オート再生/既読スキップ/早送り/会話ログ/BGMシーン切替/軽い振動・フラッシュ。
   ・全ての動的文字列は esc（自前 esc2 で & < > " ' を確実に無害化）。選択肢は data-action="storyPick"。
   ・進行の真実は S.ui のメソッド（tap/pick/…）に集約し、クリック/キーボードはそれを呼ぶだけ。
   docs/story-architecture.md §1/§4 準拠。Safe Area / 480px / min44px / reduced-motion。eval/new Function 禁止。
   ============================================================ */
(function(){
  var G = (typeof window!=="undefined") ? window : globalThis;
  var S = G.SRStory = G.SRStory || {};
  var _win = G;
  function _doc(){ return G.document; }

  /* ---- 確実なエスケープ（グローバル esc に依存しない=テスト/本番どちらも安全） ---- */
  function esc2(s){
    return String(s==null?"":s)
      .replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
      .replace(/"/g,"&quot;").replace(/'/g,"&#39;");
  }

  /* ---- 話者テーブル（表示名 / 立ち絵スプライトキー）。node.speaker が未登録なら生文字列を表示 ---- */
  S.SPEAKERS = S.SPEAKERS || {
    narrator:{ name:"", px:"" },
    hero:{ name:"あなた", px:"hero_app" },
    zen:{ name:"ゼン", px:"zen" },     kai:{ name:"カイ", px:"kai" },
    mina:{ name:"ミナ", px:"mina" },   gard:{ name:"ガルド", px:"gard" },
    rio:{ name:"リオ", px:"ghost" },  sera:{ name:"セラ", px:"fire" },
    noa:{ name:"ノア", px:"hero_app" },leon:{ name:"レオン", px:"king" },
    arisa:{ name:"アリサ", px:"mina" },el:{ name:"エル", px:"god" },
    yurius:{ name:"ユリウス", px:"yurius" }
  };
  function speakerName(node){
    var k = node && node.speaker;
    if(!k) return "";
    var e = S.SPEAKERS[k];
    return e ? e.name : String(k);
  }
  function nameOfId(id){ return speakerName({ speaker:id }); }
  function portraitKey(node){
    if(node && typeof node.portrait==="string" && node.portrait) return node.portrait;
    var e = node && S.SPEAKERS[node.speaker];
    return (e && e.px) ? e.px : "";
  }
  /* 立ち絵: 有効な PX キーがあれば px() を使い、無ければ頭文字プレースホルダ（img src=undefined を出さない） */
  function faceHtml(node, size){
    var key = portraitKey(node), P = G.PX;
    if(key && typeof G.px==="function" && P && Object.prototype.hasOwnProperty.call(P, key)){
      return G.px(key, size, "floaty");
    }
    var nm = speakerName(node), init = nm ? nm.charAt(0) : "・";
    return '<div class="story-face-ph" style="width:'+size+'px;height:'+size+'px">'+esc2(init)+'</div>';
  }

  /* ---- reduced-motion 判定（matchMedia 不在=テスト環境では簡素化=true） ---- */
  function reduced(){
    try{ return _win.matchMedia ? !!_win.matchMedia("(prefers-reduced-motion: reduce)").matches : true; }
    catch(e){ return true; }
  }
  function setScene(sc){ try{ if(typeof G.setBgmScene==="function" && sc) G.setBgmScene(sc); }catch(e){} }

  /* ---- UI コントローラ（overlay を所有。進行の真実はここのメソッド） ---- */
  var ui = S.ui = {
    open:false, mode:"", node:null, api:null, choices:null,
    auto:false, ff:false, skip:false, logOpen:false,
    _log:[], _priorSeen:null, _entryScene:"field",
    _ilSpec:null, _ilDone:null, _backFromBattle:false,
    _full:"", _shown:"", _typing:false,
    _typeTimer:0, _autoTimer:0, _onDone:null, _onEncounter:null,
    _el:null, _roster:null,

    isOpen:function(){ return !!this.open; },
    isLogOpen:function(){ return !!this.logOpen; },
    currentId:function(){ return this.node ? this.node.id : null; },
    currentMode:function(){ return this.mode; },
    log:function(){ return this._log.slice(); },

    _clearType:function(){ if(this._typeTimer){ try{ _win.clearInterval(this._typeTimer); }catch(e){} this._typeTimer=0; } this._typing=false; },
    _clearAuto:function(){ if(this._autoTimer){ try{ _win.clearTimeout(this._autoTimer); }catch(e){} this._autoTimer=0; } },
    _wasRead:function(id){ return !!(this._priorSeen && this._priorSeen[id]); },

    /* ---- 起動: 章を再生。opts={onDone, onEncounter} ---- */
    play:function(chapterId, nodeId, opts){
      opts = opts || {};
      try{ if(typeof S.applyChar==="function") S.applyChar(); }catch(e){} /* 主人公名/立ち絵を作成データで反映 */
      this._onDone = (typeof opts.onDone==="function") ? opts.onDone : null;
      this._onEncounter = (typeof opts.onEncounter==="function") ? opts.onEncounter : null;
      this._log = []; this.auto=false; this.ff=false; this.skip=false; this.logOpen=false;
      this._roster = S.visuals ? S.visuals.emptyRoster() : null;   /* S2: 立ち位置は再生ごとに空へ */
      this._ilSpec=null; this._ilDone=null; this._backFromBattle=false;
      try{ if(typeof S.resetInterludes==="function") S.resetInterludes(); }catch(e){} /* 幕は再生ごとに出す */
      this._clearType(); this._clearAuto();
      /* 既読スナップショット（engine が到達時に markSeen する前の状態を保持=スキップ判定用） */
      var seen = (S.state && S.state().seen) || {};
      this._priorSeen = {}; for(var k in seen){ this._priorSeen[k]=1; }
      this._entryScene = (typeof G.bgmScene!=="undefined") ? G.bgmScene : "field";
      this._ensureEl();
      this.open = true;
      var self = this;
      var handlers = {
        onDialogue:   function(n,a){ self._show(n,a,"dialogue"); },
        onCutscene:   function(n,a){ self._show(n,a,"dialogue"); },
        onEvidence:   function(n,a){ self._show(n,a,"dialogue"); },
        onReasoning:  function(n,a){ self._show(n,a,"dialogue"); },
        onNegotiation:function(n,a){ self._show(n,a,"dialogue"); },
        onChoice:     function(n,c,a){ self._showChoice(n,c,a); },
        onEnd:        function(n,a){ self._show(n,a,"end"); },
        onEncounter:  function(n,a){ self._encounter(n,a); },
        onChapterEnd: function(chId){
          if(typeof self._chapterEnd==="function"){ self._chapterEnd(chId); return; }
          self._finish("chapterEnd");
        },
        onMissing:    function(){ self._finish("missing"); }
      };
      return S.run(chapterId, nodeId, handlers);
    },

    /* ---- 対話/終端の提示。手前に「幕」を挟む（story-interlude.js 供給。未ロード/スキップ中は素通し） ---- */
    _show:function(node, api, mode){
      var spec = null;
      if(!this.skip && typeof this._interlude==="function" && typeof S.interludeFor==="function"){
        try{ spec = S.interludeFor(node, this); }catch(e){ spec = null; }
      }
      if(spec){
        this.node = node; this.api = api;
        var self = this;
        this._interlude(spec, function(){ self._show(node, api, mode); });  /* 消化済み→次の幕 or 本文 */
        return;
      }
      this._showNode(node, api, mode);
    },

    _showNode:function(node, api, mode){
      this._clearType(); this._clearAuto();
      this.node = node; this.api = api; this.mode = mode; this.choices = null;
      if(node && node.bgmScene) setScene(node.bgmScene);
      this._pushLog(node);
      this._full = (node && typeof node.text==="string") ? node.text : "";
      this._fx(node);
      /* 台詞表示: reduced/早送り/スキップ済みは即時全文、それ以外はタイプ表示 */
      var immediate = reduced() || this.ff || (this.skip && this._wasRead(node.id));
      this._shown = immediate ? this._full : "";
      this._renderFrame();
      if(immediate){ this._afterText(); }
      else { this._startType(); }
    },

    _showChoice:function(node, choices, api){
      this._clearType(); this._clearAuto();
      this.node = node; this.api = api; this.mode = "choice"; this.choices = choices || [];
      if(node && node.bgmScene) setScene(node.bgmScene);
      this._pushLog(node);
      this._full = (node && typeof node.text==="string") ? node.text : "";
      this._shown = this._full;
      this._renderFrame();
    },

    _pushLog:function(node){
      if(!node) return;
      var txt = (typeof node.text==="string") ? node.text : "";
      if(!txt && this.mode!=="choice") return;
      this._log.push({ name:speakerName(node), text:txt });
      if(this._log.length>200) this._log.shift();
    },

    /* ---- タイプ表示（本番のみ。テストは reduced=true で即時全文） ---- */
    _startType:function(){
      this._shown=""; this._typing=true; this._paint();
      var self=this, full=this._full, i=0;
      this._typeTimer = _win.setInterval(function(){
        i += 2; self._shown = full.slice(0,i); self._paint();
        if(i>=full.length){ self._clearType(); self._afterText(); }
      }, 18);
    },
    _completeType:function(){ this._clearType(); this._shown=this._full; this._paint(); this._afterText(); },

    _afterText:function(){
      if(this.mode!=="dialogue") return;
      var delay=-1;
      if(this.skip && this._wasRead(this.node.id)) delay=0;
      else if(this.auto) delay=1400;
      if(delay<0) return;
      var self=this; this._clearAuto();
      this._autoTimer = _win.setTimeout(function(){ self._advance(); }, delay);
    },

    /* ---- タップ（背景タップ/Enter）: タイプ中は全文、それ以外は前進 ---- */
    tap:function(){
      if(!this.open) return;
      if(this.logOpen){ this.closeLog(); return; }
      if(this.mode==="interlude"){ this._ilNext(); return; }   /* 幕はタップで即送れる */
      if(this.mode==="choice") return;             /* 選択待ちは前進しない */
      if(this._typing){ this._completeType(); return; }
      this._advance();
    },
    _advance:function(){
      this._clearAuto();
      if(this.mode==="end"){ this._finish("end"); return; }
      if(this.api && typeof this.api.next==="function") this.api.next();
    },

    /* ---- 選択 ---- */
    pick:function(idx){
      if(!this.open || this.mode!=="choice" || !this.api) return;
      this._clearAuto();
      this.api.pick(idx);   /* effects 適用→次ノードの handler が再描画する */
    },

    /* ---- 戦闘: overlay を閉じ、橋渡し（無ければ resume を残して完了通知） ---- */
    _encounter:function(node, api){
      this._clearType(); this._clearAuto();
      this.node = node; this.api = api;
      this._removeEl(); this.open=false; setScene(this._entryScene);
      if(this._onEncounter){ try{ this._onEncounter(node, api, this); }catch(e){} }
      else if(this._onDone){ try{ this._onDone("encounter", node); }catch(e){} }
    },
    /* 戦闘後、物語を再開（呼び出し側の橋から使う）: overlay を再生成してから復帰 */
    resumeAfterBattle:function(win, g){
      this._ensureEl(); this.open = true;   /* 復帰直後は「物語にもどる」幕を一枚挟む(C) */
      if(typeof this._markBackFromBattle==="function") this._markBackFromBattle();
      return S.onBattleEnd(!!win, g);   /* resume トークンから復帰し次ノードの handler を発火 */
    },

    /* ---- 各種トグル ---- */
    toggleAuto:function(){ this.auto=!this.auto; this._syncCtl(); if(this.auto && !this._typing) this._afterText(); },
    toggleSkip:function(){ this.skip=!this.skip; this._syncCtl(); if(this.skip && !this._typing) this._afterText(); },
    toggleFf:function(){ this.ff=!this.ff; this._syncCtl(); if(this.ff && this._typing) this._completeType(); },
    openLog:function(){ if(this.mode==="interlude") return; this.logOpen=true; this._renderFrame(); },
    closeLog:function(){ this.logOpen=false; this._renderFrame(); },
    close:function(){ this._finish("closed"); },

    _finish:function(reason){
      this._clearType(); this._clearAuto();
      this._ilSpec=null; this._ilDone=null; this._backFromBattle=false;
      this._removeEl(); this.open=false; this.mode="";
      setScene(this._entryScene);
      var cb=this._onDone; this._onDone=null;
      if(cb){ try{ cb(reason, this.node); }catch(e){} }
    },

    /* ---- DOM 生成・描画 ---- */
    _ensureEl:function(){
      var d=_doc(); if(!d) return;
      if(this._el){ return; }
      var el = d.createElement("div");
      el.className = "story-ovl story-ui";
      el.id = "storyUi";
      el.setAttribute("role","dialog");
      el.setAttribute("aria-label","物語");
      var self=this;
      if(typeof el.addEventListener==="function"){
        el.addEventListener("click", function(ev){ self._onClick(ev); });
      }
      if(d.body && typeof d.body.appendChild==="function") d.body.appendChild(el);
      this._el = el;
      this._bindKeys();
    },
    _removeEl:function(){
      var el=this._el;
      if(el){
        if(el.parentNode && typeof el.parentNode.removeChild==="function"){ try{ el.parentNode.removeChild(el); }catch(e){} }
        this._el=null;
      }
      this._unbindKeys();
    },

    _onClick:function(ev){
      var el = ev && ev.target, act=null;
      for(var g=0; el && g<6; g++){
        if(el.getAttribute && (act=el.getAttribute("data-action"))) break;
        el = el.parentNode;
      }
      if(!act){ this.tap(); return; }
      if(ev && typeof ev.stopPropagation==="function") ev.stopPropagation();
      switch(act){
        case "storyPick": this.pick(parseInt(el.getAttribute("data-idx"),10)||0); break;
        case "storyAuto": this.toggleAuto(); break;
        case "storyFf":   this.toggleFf(); break;
        case "storySkip": this.toggleSkip(); break;
        case "storyLog":  this.logOpen ? this.closeLog() : this.openLog(); break;
        case "storyClose":this.close(); break;
        default: break;
      }
    },
    _keyHandler:null,
    _bindKeys:function(){
      var d=_doc(); if(!d || typeof d.addEventListener!=="function") return;
      var self=this;
      this._keyHandler = function(e){
        if(!self.open) return;
        var k=e.key;
        if(k==="Enter"||k===" "||k==="Spacebar"){ if(e.preventDefault)e.preventDefault(); self.tap(); }
        else if(k==="Escape"){ self.logOpen ? self.closeLog() : self.close(); }
        else if(k==="l"||k==="L"){ self.logOpen ? self.closeLog() : self.openLog(); }
        else if(k==="a"||k==="A"){ self.toggleAuto(); }
        else if(self.mode==="choice" && /^[1-9]$/.test(k)){
          var n=parseInt(k,10)-1, list=self.choices||[];
          if(list[n]) self.pick(list[n].idx);
        }
      };
      d.addEventListener("keydown", this._keyHandler);
    },
    _unbindKeys:function(){
      var d=_doc();
      if(d && this._keyHandler && typeof d.removeEventListener==="function"){ d.removeEventListener("keydown", this._keyHandler); }
      this._keyHandler=null;
    },

    _ctlBar:function(){
      function b(act,label,on){
        return '<button class="story-ctl'+(on?' on':'')+'" type="button" data-action="'+act+'" aria-pressed="'+(on?'true':'false')+'">'+esc2(label)+'</button>';
      }
      return '<div class="story-ctls">'+
        b("storyAuto","オート",this.auto)+ b("storySkip","スキップ",this.skip)+
        b("storyFf","早送り",this.ff)+ b("storyLog","ログ",this.logOpen)+
        b("storyClose","閉じる",false)+'</div>';
    },

    _renderFrame:function(){
      var el=this._el; if(!el) return;
      if(this.logOpen){ el.innerHTML = this._logHtml(); return; }
      var node=this.node, nm=speakerName(node), V=S.visuals, bg="", loc, face, nameH;
      if(V){   /* S2: 背景(CSS)＋立ち絵ステージ＋話者名プレート。story-visuals.js が無い時は従来表示 */
        this._roster = V.pushRoster(this._roster, node);
        bg = V.bgHtml(node && node.location);
        loc = V.locHtml(node && node.location);
        face = V.stageHtml(node, this._roster, function(sp, size){
          return faceHtml((node && sp===node.speaker) ? node : { speaker:sp }, size);
        }, nameOfId);
        nameH = V.plateHtml(nm, node && node.speaker);
      } else {
        loc = (node && typeof node.location==="string" && node.location) ?
          '<div class="story-loc">'+esc2(node.location)+'</div>' : "";
        face = '<div class="story-face">'+ faceHtml(node, 90) + '</div>';
        nameH = nm ? '<div class="sn">'+esc2(nm)+'</div>' : '<div class="sn" aria-hidden="true"></div>';
      }
      var body;
      if(this.mode==="choice"){
        var prompt = this._full ? '<div class="st2">'+esc2(this._full)+'</div>' : '';
        body = prompt + this._choiceHtml();
      } else {
        var hint = (this.mode==="end") ? "とじる" : "タップで送る";
        body = '<div class="st2" id="storyTxt">'+esc2(this._shown)+'</div>'+
               '<div class="snext" aria-hidden="true">'+esc2(hint)+' ▶</div>';
      }
      el.innerHTML =
        bg + this._ctlBar() + loc + face +
        '<div class="story-box">'+ nameH + body +'</div>';
    },
    _paint:function(){
      var d=_doc(); if(!d || typeof d.getElementById!=="function") return;
      var t=d.getElementById("storyTxt");
      if(t) t.innerHTML = esc2(this._shown);
    },
    _choiceHtml:function(){
      var list=this.choices||[], out=['<div class="story-choices" role="group" aria-label="選択肢">'];
      for(var i=0;i<list.length;i++){
        var c=list[i];
        out.push('<button class="story-choice" type="button" data-action="storyPick" data-idx="'+
          (parseInt(c.idx,10)||0)+'">'+esc2(c.text)+'</button>');
      }
      if(!list.length) out.push('<div class="st2">…</div>');
      out.push('</div>');
      return out.join("");
    },
    _logHtml:function(){
      var rows=['<div class="story-log" role="log" aria-label="会話ログ">'];
      rows.push('<div class="story-log-head"><b>会話ログ</b>'+
        '<button class="story-ctl" type="button" data-action="storyLog">とじる</button></div>');
      rows.push('<div class="story-log-body">');
      for(var i=0;i<this._log.length;i++){
        var e=this._log[i];
        rows.push('<div class="story-log-row">'+
          (e.name?'<span class="sn">'+esc2(e.name)+'</span>':'')+
          '<span class="lt">'+esc2(e.text)+'</span></div>');
      }
      rows.push('</div></div>');
      return rows.join("");
    },
    _syncCtl:function(){ if(!this.logOpen) this._renderFrame(); },

    /* 軽い演出（reduced-motion で無効化） */
    _fx:function(node){
      if(reduced() || !this._el) return;
      var ex = node && node.expression;
      if(ex==="angry"||ex==="shock"||ex==="shake"){
        var el=this._el;
        try{ el.classList.add("story-shake"); }catch(e){}
        var self=this;
        _win.setTimeout(function(){ try{ if(self._el) self._el.classList.remove("story-shake"); }catch(e){} }, 320);
        try{ if(typeof G.flash==="function") G.flash("#FFE9A8", 120); }catch(e){}
      }
    }
  };

  /* 便利: 章開始（フラグ背後で本編に接続する時に使う。旧UIは無傷） */
  S.playChapter = function(chapterId, nodeId, opts){ return ui.play(chapterId, nodeId, opts); };
})();
