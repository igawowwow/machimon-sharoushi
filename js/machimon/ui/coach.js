"use strict";
/* ============================================================
   machimon/ui/coach.js — 相棒マチノコのコーチ吹き出し + 「つぎの目標」カード + ハイライト
   ★街画面の最上部に常駐。いま何をすべきか1行と、目標までの進捗バーを出す。
   ★target と一致する要素に .mm-hl(脈打つ枠+👆)を付ける = 迷わせない。
   ============================================================ */
(function(){
  var G=(typeof window!=="undefined")?window:globalThis;
  var MM=G.MM=G.MM||{}; var UI=MM.ui;

  UI.coachStep=function(c){ try{ return MM.tutorial.step(c); }catch(e){ return null; } };

  /* コーチ吹き出し(チュートリアル中のみ) */
  UI.coach=function(c,st){
    if(!st||!st.say)return "";
    return '<div class="mm-coach'+(st.done?" mm-coach-done":"")+'">'+MM.px("m01",44,"mm-hop")
      +'<div class="mm-coach-text">'+st.say+'</div></div>';
  };

  /* つぎの目標カード: 進捗バー付き(Day1は出来事まで / 以降はエリア解放やタマゴ) */
  UI.goal=function(c){
    var ob=MM.onboard.progress(c);
    if(ob.next){
      var label={m1:"🪙 最初の報酬",m3:"🥚 タマゴが手に入る",m4:"👾 仲間が生まれる",m5:"🏢 最初の建物が建つ",
                 m10:"🥚 2つ目のタマゴ",m15:"🏢 会社の相談(🪙500)",m20:"💤 放置収入が始まる",m25:"🚪 となりの街の門",m30:"🎉 Day1クリア"}[ob.next.id]||"✨ 次の出来事";
      var from=ob.done>0?MM.onboard.STEPS[ob.done-1].at:0;
      return '<div class="mm-goal"><div class="mm-goal-row"><span>つぎ: <b>'+label+'</b></span><span class="mm-goal-left">あと <b>'+ob.left+'</b> 問</span></div>'
        +UI.bar(ob.now-from,ob.next.at-from)+'</div>';
    }
    /* Day1後: いちばん近いエリア解放 */
    var best=null;
    for(var i=0;i<MM.DATA.areas.length;i++){ var a=MM.DATA.areas[i]; if(!c.mm.areas[a.id]){ if(!best||a.ke<best.ke)best=a; } }
    if(best){
      var left=Math.max(0,best.ke-c.mm.res.ke);
      return '<div class="mm-goal"><div class="mm-goal-row"><span>つぎ: <b>🚪 '+UI.esc(best.name)+' を開く</b></span><span class="mm-goal-left">✨ あと <b>'+left+'</b></span></div>'
        +UI.bar(c.mm.res.ke,best.ke)+'<div class="mm-sub">知識エネルギーは「復習」と「苦手の克服」でたまる</div></div>';
    }
    return "";
  };

  /* 指定 target のハイライトクラス */
  UI.hl=function(st,target){ return (st&&st.target===target)?" mm-hl":""; };
})();
