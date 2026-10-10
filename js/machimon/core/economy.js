"use strict";
/* ============================================================
   machimon/core/economy.js — コイン(お金は これ1つ)
   ★コインは「正解」からしか出ない。放置でも、品評会の勝ち負けでも増えない。課金も無い。
   ★1回答ぶんの中身(コイン・けいけん・けいこ値・ごほうび)は core/keiko.js が決める。ここは財布だけ。
   ============================================================ */
(function(){
  var G=(typeof window!=="undefined")?window:globalThis;
  var MM=G.MM=G.MM||{};
  /* 1回答ぶんの付与。rw は MM.learn.commit の戻り値。gain.mon に くわしい中身が入る */
  function grant(rw,c){
    var gain={g:0}; MM.keiko.onAnswer(rw,gain,c);
    c.mm.res.g=Math.min(1e12,(c.mm.res.g||0)+(gain.g||0));
    return gain;
  }
  function spend(c,kind,n){ var r=c.mm.res; if((r[kind]||0)<n)return false; r[kind]-=n; return true; }
  MM.economy={ grant:grant, spend:spend };
})();
