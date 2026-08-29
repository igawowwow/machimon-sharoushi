"use strict";
/* ============================================================
   machimon/core/combo-audio.js — コンボ音響レイヤー(純関数)
   ★「連続正解すると音楽が完成していく」。音を足していくのはロジックの仕事、
     実際に鳴らすのは UI(既存 js/audio/* の合成音)。ここは何が鳴るべきかだけを返す。
   ★不正解に強い不快音を鳴らさない。コンボが切れたら音は静かにフェードして戻るだけ
     = 沈黙は罰ではなく「完成前の状態」。
   ★音は情報伝達に使わない(消音でも遊べる)。あくまで報酬の増幅。
   ============================================================ */
(function(){
  var G=(typeof window!=="undefined")?window:globalThis;
  var MM=G.MM=G.MM||{};

  /* ペンタトニック(どう重なっても不協和にならない) */
  var SCALE=["C5","D5","E5","G5","A5","C6"];

  /* しきい値・段階(docs/machimon/09-audio-visual.md の表と一対一) */
  var STEPS=[
   {at:0,  step:0,layers:[],                                  fx:"none",  haptic:"",       bgm:0},
   {at:1,  step:1,layers:["base"],                            fx:"spark", haptic:"light",  bgm:0},
   {at:3,  step:2,layers:["base"],                            fx:"spark", haptic:"light",  bgm:0},
   {at:5,  step:3,layers:["base","harmony"],                  fx:"glow",  haptic:"medium", bgm:0},
   {at:8,  step:4,layers:["base","harmony","bass"],           fx:"glow",  haptic:"medium", bgm:0},
   {at:10, step:5,layers:["base","harmony","bass","perc"],    fx:"wave",  haptic:"medium", bgm:1},
   {at:15, step:6,layers:["base","harmony","bass","perc","counter"], fx:"wave", haptic:"medium",bgm:1},
   {at:20, step:7,layers:["base","harmony","bass","perc","counter","reverb"], fx:"gold", haptic:"heavy",bgm:2}
  ];

  /* いま鳴らすべき音・演出・振動を返す */
  function layerFor(combo){
    combo=Math.max(0,combo|0);
    var s=STEPS[0];
    for(var i=0;i<STEPS.length;i++){ if(combo>=STEPS[i].at)s=STEPS[i]; }
    /* 音程はコンボが進むほど上がる(6音で一巡し、以降は最高音を保つ) */
    var ni=Math.min(SCALE.length-1,Math.max(0,combo-1));
    return { step:s.step, note:SCALE[ni], notes:SCALE.slice(0,Math.min(SCALE.length,Math.max(1,s.step+1))),
             layers:s.layers.slice(), fx:s.fx, haptic:s.haptic, bgmLayer:s.bgm, combo:combo };
  }

  /* コンボが切れたときの指示(不快音を鳴らさない=フェードのみ) */
  function onBreak(){ return { fade:true, ms:600, sfx:"soft", haptic:"" }; }

  /* 誤答時の音(柔らかい短音。恐怖で学習させない) */
  function onWrong(){ return { sfx:"soft", ms:120, haptic:"", fx:"none" }; }

  /* 段階が上がった瞬間か(UIは上がった時だけ追加演出を出す=刺激の飽和を防ぐ) */
  function stepUp(prev,now){ return layerFor(now).step>layerFor(prev).step; }

  MM.audio={ SCALE:SCALE, STEPS:STEPS, layerFor:layerFor, onBreak:onBreak, onWrong:onWrong, stepUp:stepUp };
})();
