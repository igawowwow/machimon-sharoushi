"use strict";
/* ============================================================
   machimon/ui/hatch.js — 孵化演出
   ★通常: タマゴ→亀裂→発光→誕生(1.3秒)
   ★高レア: 一度ふつうの光に見せてから【短い静寂】を挟む(音を足すのではなく消して期待を作る)
   ★演出中に課金導線を出さない。損失回避を使った射幸性の演出をしない。
     孵化は「問題を解いた結果」であって賭けではない。
   ============================================================ */
(function(){
  var G=(typeof window!=="undefined")?window:globalThis;
  var MM=G.MM=G.MM||{}; var UI=MM.ui;

  var ART={egg:"🥚",crack:"🥚",glow:"✨",hush:"🥚",shift:"🌟",burst:"💫",born:"👾"};

  UI.screens.hatch=function(p){
    var c=UI.ctx();
    if(p&&p.uid)return view(c,p.uid,!!p.rare);
    if((c.mm.res.tama||0)<1){
      return '<div class="mm-wrap">'+UI.resBar(c)
        +'<div class="mm-q">タマゴがありません。事件を解決すると見つかります。</div>'
        +'<button class="small-btn" style="width:100%;min-height:48px" onclick="MM.ui.go(\'mons\')">もどる</button></div>';
    }
    return '<div class="mm-wrap">'+UI.resBar(c)
      +'<div class="mm-h">🥚 タマゴ '+c.mm.res.tama+'個</div>'
      +'<div class="mm-egg" onclick="MM.ui.crack()">🥚</div>'
      +'<div style="text-align:center" class="mm-sub">タップして割る</div>'
      +'<button class="small-btn" style="width:100%;min-height:48px;margin-top:16px" onclick="MM.ui.go(\'mons\')">もどる</button></div>';
  };

  UI.crack=function(){
    var c=UI.ctx();
    var r=MM.hatch.hatch(c);
    if(!r)return UI.go("mons");
    MM.game.save();
    play(MM.hatch.sequence(r.rare),r);
  };

  /* 段取り配列を順に再生するだけ(演出の中身はロジック側 hatch.sequence が持つ) */
  function play(seq,r){
    var box=G.document&&G.document.getElementById?G.document.getElementById("app"):null;
    if(!box)return;
    var i=0;
    (function next(){
      if(i>=seq.length){ UI.go("hatch",{uid:r.uid,rare:r.rare}); return; }
      var s=seq[i++];
      var cls=(s.t==="crack")?"mm-crack":(s.t==="hush")?"mm-hush":(s.t==="burst")?"mm-burst":"";
      var art=(s.t==="born")?MM.px(r.sp,96):(ART[s.t]||"🥚");
      box.innerHTML='<div class="mm-wrap"><div class="mm-egg '+cls+'">'+art+'</div></div>';
      if(!s.silent&&(s.t==="burst"||s.t==="born"))UI.play({step:r.rare?7:3,fx:r.rare?"gold":"glow",haptic:r.rare?"heavy":"light"});
      setTimeout(next,s.ms);
    })();
  }

  function view(c,uid,rare){
    var m=c.mm.mons[uid];
    if(!m)return UI.screens.mons();
    var sp=MM.DATA.speciesById[m.sp]||{};
    var names=G.SUBJECTS||[];
    var esc=UI.esc;
    return '<div class="mm-wrap '+(rare?"mm-fx3":"mm-fx2")+'">'+UI.resBar(c)
      +'<div class="mm-egg"><span class="mm-hop" style="display:inline-block">'+MM.px(m.sp,96)+'</span></div>'
      +'<div style="text-align:center"><b style="font-size:20px">'+esc(sp.name)+'</b>'
      +'<div class="mm-sub">'+MM.DATA.rarName[sp.rar]+' / '+esc(sp.type)+'属性 / '+esc(sp.nature)+'</div>'
      +'<div class="mm-sub">とくい: '+esc(sp.sub>=0?(names[sp.sub]||""):"すべての科目")+'</div></div>'
      +'<div class="mm-q" style="font-size:13px">'+esc((sp.life&&sp.life.m)||"")+'</div>'
      +'<div style="display:flex;gap:8px">'
      +(c.mm.res.tama>0?'<button class="small-btn" style="flex:1;min-height:48px" onclick="MM.ui.go(\'hatch\',{})">もう1つ割る</button>':'')
      +'<button class="small-btn" style="flex:1;min-height:48px" onclick="MM.ui.go(\'town\')">街へもどる</button>'
      +'</div></div>';
  }
})();
