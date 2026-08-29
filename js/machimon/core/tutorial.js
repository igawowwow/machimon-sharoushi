"use strict";
/* ============================================================
   machimon/core/tutorial.js — コーチ(相棒マチノコ)の「いま何をすればいいか」1行
   ★状態から純粋に導く(DOM非依存)。UIはこの戻り値を表示して target を光らせるだけ。
   ★説明は常に1行・動詞で終わる(「〜をタップ」「〜を解こう」)。
   ============================================================ */
(function(){
  var G=(typeof window!=="undefined")?window:globalThis;
  var MM=G.MM=G.MM||{};

  function correct(c){ return MM.onboard.progress(c).now; }

  /* 空いている(マチモン未配置の)建物と、まだ働いていないマチモンの組 */
  function placeable(c){
    var freeMon=null;
    for(var u in c.mm.mons){ if(!c.mm.mons[u].place){ freeMon=u; break; } }
    if(!freeMon)return null;
    for(var k in c.mm.slots){ if(!c.mm.slots[k].mon)return {uid:freeMon,slot:k}; }
    return null;
  }

  /* 戻り値: {id, say, target, done} / null=コーチ終了 */
  function step(c){
    if(!c.mm.ms.intro)return {id:"intro",say:"",target:""};
    var cor=correct(c), ob=MM.onboard.progress(c);
    if(c.mm.res.tama>0&&cor>=1)return {id:"egg",say:"タマゴが届いたモン！ 街のタマゴをタップして割ろう！",target:"egg"};
    var pl=placeable(c);
    if(pl)return {id:"place",say:"建物にマチモンを配置すると、いない間もコインを稼いでくれるモン！",target:"slot:"+pl.slot,uid:pl.uid,slot:pl.slot};
    if(cor<1)return {id:"first",say:"街で事件が起きてるモン！ 下の事件をタップして解決しよう！",target:"inc"};
    if(cor<3)return {id:"more",say:"正解でコインが入ったモン！ あと"+(3-cor)+"問でタマゴが手に入るよ",target:"inc"};
    if(cor<5)return {id:"build",say:"仲間が増えたモン！ あと"+(5-cor)+"問で最初の建物が建つよ",target:"inc"};
    if(cor<10)return {id:"grow",say:"事件を解くほど街が育つモン。次の出来事まで あと"+ob.left+"問！",target:"inc"};
    if(!c.mm.ms.tut){ c.mm.ms.tut=1; return {id:"done",say:"もう立派な社労士モン！ あとは毎日、街に来てくれたら嬉しいモン",target:"",done:true}; }
    return null;
  }

  /* オープニング完了: 街に名前を付け、相棒(マチノコ)を迎える */
  function finishIntro(c,name){
    if(c.mm.ms.intro)return null;
    c.mm.ms.intro=1;
    c.mm.name=String(name||"マチモンタウン").replace(/[<>"]/g,"").slice(0,12)||"マチモンタウン";
    var uid="u"+(c.mm.uid++);
    c.mm.mons[uid]={ sp:"m01", lv:1, xp:0, born:c.today, place:"" };
    c.mm.dex.m01=1;
    return uid;
  }

  MM.tutorial={ step:step, placeable:placeable, finishIntro:finishIntro };
})();
