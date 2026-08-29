"use strict";
/* ============================================================
   state/store.js — 唯一の真実源(Phase3リニューアル基盤)
   localStorage に触るのは Store だけ。KEY="sr-quest-v4" / SCHEMA=4。
   旧 sr-quest-v3 は読まない(互換破棄・新規プレイヤー開始)。
   壊れた保存 / version不一致 / 欠損でも throw せず Store.fresh() で起動する。
   非module classic script。名前空間 window.SRState に集約(engine.js と非衝突)。
   ============================================================ */
(function(){
  var G = (typeof window!=="undefined") ? window : globalThis;
  var SR = G.SRState = G.SRState || {};

  /* ---- schema 定数 ---- */
  var STORAGE_KEY = "sr-quest-v4";   // 旧KEYと別名 = 旧セーブを物理的に読まない
  var SCHEMA = 4;                    // ルートに1本。slice個別versionは持たない

  /* ---- 数値/型ヘルパ(絶対 throw しない・安全値へクランプ) ---- */
  function numOr(v,d,min,max){
    if(min===undefined)min=-Infinity; if(max===undefined)max=Infinity;
    v = Number(v);
    if(!Number.isFinite(v)) return d;
    return Math.min(max, Math.max(min, v));
  }
  function intOr(v,d,min,max){
    var t = Math.trunc(Number(v));
    return numOr(Number.isFinite(t)?t:NaN, d, min, max);
  }
  function fracOr(v,d){ return numOr(v,d,0,1); }
  function boolOr(v,d){ return typeof v==="boolean" ? v : d; }
  function strOr(v,d){ return typeof v==="string" ? v : d; }
  function strOrNull(v){ return typeof v==="string" ? v : (v===null ? null : null); }
  function objOr(v){ return (v && typeof v==="object" && !Array.isArray(v)) ? v : {}; }
  function fixBoolArr(v,n){
    var out=[]; for(var i=0;i<n;i++){ out.push(Array.isArray(v)&&typeof v[i]==="boolean" ? v[i] : false); }
    return out;
  }
  function enumOr(v,list,d){ return list.indexOf(v)>=0 ? v : d; }
  SR.util = { numOr:numOr, intOr:intOr, fracOr:fracOr, boolOr:boolOr, strOr:strOr,
              strOrNull:strOrNull, objOr:objOr, fixBoolArr:fixBoolArr, enumOr:enumOr };

  /* slice レジストリ。各 slice ファイルが自身を登録する
     SR.slices[name] = { def:default*(), san:sanitize*(raw,ctx), sel:{}, act:{} } */
  SR.slices = SR.slices || {};
  SR.STORAGE_KEY = STORAGE_KEY;
  SR.SCHEMA = SCHEMA;

  /* ---- prototype pollution 対策 reviver(engine.js safeParse を踏襲) ---- */
  function safeParse(s){
    return JSON.parse(s, function(k,v){
      return (k==="__proto__"||k==="constructor"||k==="prototype") ? undefined : v;
    });
  }
  SR.safeParse = safeParse;

  /* ---- storage(同期・localStorage のみ。無ければ no-op で起動継続) ---- */
  function readLS(k){ try{ return G.localStorage ? G.localStorage.getItem(k) : null; }catch(e){ return null; } }
  function writeLS(k,v){ try{ if(G.localStorage) G.localStorage.setItem(k,v); return true; }catch(e){ return false; } }

  /* ---- sanitize 用 ctx(問題バンク解決情報)。未ロードでも安全に false ---- */
  function buildCtx(){
    var qResolvable=null, bankReady=false, today=Math.floor(Date.now()/864e5);
    try{
      if(typeof G.qById==="function"){
        var bank = (typeof G.QBY!=="undefined") ? G.QBY : G.Q;
        bankReady = Array.isArray(bank) ? bank.length>0 : !!bank;
        if(bankReady){
          qResolvable = function(id){ try{ return !!G.qById(id); }catch(e){ return true; } };
        }
      }
    }catch(e){}
    return { qResolvable:qResolvable, bankReady:bankReady, today:today };
  }
  SR.buildCtx = buildCtx;

  function freshUi(){ return { battle:null, sess:null, route:null, msg:{daily:null,login:null,streak:null} }; }

  var listeners = [];

  var Store = {
    state: null,      // 永続: {player,learning,adventure,collection,office,settings}
    ui: freshUi(),    // 非永続: 戦闘G/SESS/一時メッセージ(保存対象外)
    isFresh: true,
    _busy: false, _queued: false,

    /* 新規プレイヤー(明示初期化の唯一経路) */
    fresh: function(){
      var s={};
      for(var k in SR.slices){ s[k] = SR.slices[k].def(); }
      this.state = s; this.ui = freshUi(); this.isFresh = true;
      return s;
    },

    /* ロード(localStorage に触る入口・その1)。例外を出さない */
    load: function(){
      var raw = readLS(STORAGE_KEY);
      if(raw==null){ return this.fresh(); }                 // 新規
      var parsed;
      try{ parsed = safeParse(raw); }catch(e){ return this.fresh(); } // parse失敗→新規
      if(!parsed || typeof parsed!=="object" || parsed.schemaVersion!==SCHEMA){
        return this.fresh();                                // version不一致/旧KEY誤読→新規(旧マイグレ不書)
      }
      var ctx = buildCtx(), s={};
      for(var k in SR.slices){
        try{ s[k] = SR.slices[k].san(parsed[k], ctx); }     // sanitize は throw しない設計
        catch(e){ s[k] = SR.slices[k].def(); }              // 二重の保険: そのsliceだけ既定へ
      }
      this.state = s; this.ui = freshUi(); this.isFresh = false;
      return s;
    },

    /* コミット(状態変更の唯一の作法): 変異 → 自動save → subscribe通知 */
    commit: function(fn){
      if(!this.state) this.load();
      try{ fn(this.state); }catch(e){}
      this.save();
      this._notify();
      return this.state;
    },

    /* セーブ(localStorage に触る入口・その2)。再入をコアレス */
    save: function(){
      if(!this.state) return;
      if(this._busy){ this._queued = true; return; }
      this._busy = true;
      var payload = { schemaVersion:SCHEMA, savedAt:Date.now() };
      for(var k in SR.slices){ payload[k] = this.state[k]; }
      writeLS(STORAGE_KEY, JSON.stringify(payload));  // 保存不能でも起動は継続
      this._busy = false;
      if(this._queued){ this._queued = false; this.save(); }
    },

    /* 派生値。UIは直接 state を読まずここ経由(例: Store.select(s=>s.player.coins)) */
    select: function(sel){
      if(!this.state) this.load();
      try{ return sel(this.state); }catch(e){ return undefined; }
    },

    subscribe: function(fn){
      if(typeof fn==="function") listeners.push(fn);
      return function(){ var i=listeners.indexOf(fn); if(i>=0) listeners.splice(i,1); };
    },
    _notify: function(){
      for(var i=0;i<listeners.length;i++){ try{ listeners[i](this.state); }catch(e){} }
    }
  };

  G.Store = Store;
  SR.Store = Store;
})();
