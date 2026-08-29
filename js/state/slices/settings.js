"use strict";
/* state/slices/settings.js — 設定/音声/アクセシビリティ/PWA
   旧ST: opt{mute,beginner,bgm,big,skk,bgmVol,seVol,focus,lowData,course} + 新規
   opt.mute(SE個別ON-OFF) は意味反転で seOn に。音声設定は settings が所有(ST.opt直書き廃止の土台)。 */
(function(){
  var G = (typeof window!=="undefined") ? window : globalThis;
  var SR = G.SRState = G.SRState || {}; SR.slices = SR.slices || {};
  var U = SR.util;

  function defaultSettings(){ return {
    // 学習体験
    beginner:false,
    course:"normal",          // short(9)/normal(12)/long(15)
    // 音声(初回BGM自動ON, seVol .8, bgmVol .7)
    seOn:true, bgmOn:false,
    bgmVol:0.7, seVol:0.8,
    focus:false, lowData:false, bgmTouched:false,
    // アクセシビリティ
    big:false, skk:true,
    reduceMotion:"system",    // system/on/off
    theme:"system",           // system/light/dark
    // 新旧並行フラグ(§5.2)。画面単位で新UIへ段階切替。既定は全 false=旧UI。
    dev:{ newUI:{} }          // { [screenId]: bool } 例 { home:true, result:true }
  };}

  /* dev.newUI は「画面ID→bool」のみ許可(それ以外は落とす=throwしない) */
  function sanitizeDev(raw){
    var r = U.objOr(raw), nu = U.objOr(r.newUI), out={};
    for(var k in nu){ if(typeof nu[k]==="boolean") out[k]=nu[k]; }
    return { newUI: out };
  }

  function sanitizeSettings(raw){
    var d = defaultSettings(), r = U.objOr(raw);
    return {
      beginner: U.boolOr(r.beginner, d.beginner),
      course:   U.enumOr(r.course, ["short","normal","long"], d.course),
      seOn:     U.boolOr(r.seOn, d.seOn),
      bgmOn:    U.boolOr(r.bgmOn, d.bgmOn),
      bgmVol:   U.fracOr(r.bgmVol, d.bgmVol),
      seVol:    U.fracOr(r.seVol, d.seVol),
      focus:    U.boolOr(r.focus, d.focus),
      lowData:  U.boolOr(r.lowData, d.lowData),
      bgmTouched:U.boolOr(r.bgmTouched, d.bgmTouched),
      big:      U.boolOr(r.big, d.big),
      skk:      U.boolOr(r.skk, d.skk),
      reduceMotion: U.enumOr(r.reduceMotion, ["system","on","off"], d.reduceMotion),
      theme:    U.enumOr(r.theme, ["system","light","dark"], d.theme),
      dev:      sanitizeDev(r.dev)
    };
  }

  var sel = {
    bgmOn: function(s){ return s.settings.bgmOn; },
    seOn:  function(s){ return s.settings.seOn; },
    big:   function(s){ return s.settings.big; }
  };
  var act = {
    setBgm: function(s, on){ s.settings.bgmOn = !!on; s.settings.bgmTouched = true; },
    toggleBig: function(s){ s.settings.big = !s.settings.big; }
  };

  SR.slices.settings = { def:defaultSettings, san:sanitizeSettings, sel:sel, act:act };
  SR.defaultSettings = defaultSettings; SR.sanitizeSettings = sanitizeSettings;
})();
