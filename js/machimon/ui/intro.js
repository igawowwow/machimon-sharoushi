"use strict";
/* ============================================================
   machimon/ui/intro.js — オープニング(初回だけ・4画面・全部タップで進む)
   1) ロゴ → 2) 相棒マチノコの登場と3行の物語 → 3) 街に名前を付ける → 4) 出発
   ★文字は最小。1画面に伝えることは1つ。
   ============================================================ */
(function(){
  var G=(typeof window!=="undefined")?window:globalThis;
  var MM=G.MM=G.MM||{}; var UI=MM.ui;

  var NAMES=["マチモンタウン","ろうむ村","ヴィレの街"];

  UI.screens.intro=function(p){
    var page=(p&&p.page)||1, esc=UI.esc;
    if(page===1){
      return '<div class="mm-intro mm-intro-1" onclick="MM.ui.go(\'intro\',{page:2})">'
        +'<div class="mm-intro-sky"><span class="mm-cloud" style="left:10%;top:18px">☁️</span><span class="mm-cloud" style="left:70%;top:40px;animation-delay:-20s">☁️</span></div>'
        +'<div class="mm-intro-logo">MACHIMON<span>社労士</span></div>'
        +'<div class="mm-intro-tag">問題を解くと、街が育つ。</div>'
        +'<div class="mm-intro-mons">'+MM.px("m04",56)+MM.px("m01",72,"mm-hop")+MM.px("m07",56)+'</div>'
        +'<div class="mm-intro-ground"></div>'
        +'<button class="mm-cta" onclick="event.stopPropagation();MM.ui.go(\'intro\',{page:2})">はじめる ▶</button>'
        +'</div>';
    }
    if(page===2){
      var lines=[
        "はじめまして！ ぼく <b>マチノコ</b>モン。",
        "ここは まだ <b>なにもない街</b>…",
        "でも 街の事件(=社労士の問題)を解決すると、<b>お金が入って 街が育つ</b>んだモン！",
        "いっしょに 日本一の街を つくろう！"
      ];
      var i=(p.line||0);
      var last=i>=lines.length-1;
      return '<div class="mm-intro mm-intro-2" onclick="MM.ui.go(\'intro\',{page:'+(last?3:2)+',line:'+(i+1)+'})">'
        +'<div class="mm-intro-stage">'+MM.px("m01",120,"mm-hop")+'</div>'
        +'<div class="mm-talk"><div class="mm-talk-name">マチノコ</div><div class="mm-talk-text">'+lines[i]+'</div>'
        +'<div class="mm-talk-next">'+(last?'▶ 次へ':'▼ タップ')+'</div></div>'
        +'<div class="mm-intro-dots">'+dots(i,lines.length)+'</div>'
        +'</div>';
    }
    if(page===3){
      var h='<div class="mm-intro mm-intro-3">'
        +'<div class="mm-intro-stage">'+MM.px("m01",84)+'</div>'
        +'<div class="mm-talk"><div class="mm-talk-name">マチノコ</div><div class="mm-talk-text">この街に <b>名前</b>を付けてほしいモン！</div></div>'
        +'<input id="mmTownName" class="mm-input" maxlength="12" placeholder="街の名前(12文字まで)" value="'+esc(NAMES[0])+'" onclick="event.stopPropagation()">'
        +'<div class="mm-chips">';
      for(var n=0;n<NAMES.length;n++)h+='<button class="mm-chipbtn" onclick="document.getElementById(\'mmTownName\').value=\''+esc(NAMES[n])+'\'">'+esc(NAMES[n])+'</button>';
      h+='</div><button class="mm-cta" onclick="MM.ui.introDone()">この名前で出発 ▶</button></div>';
      return h;
    }
    return UI.screens.town();
  };
  function dots(i,n){ var s=""; for(var k=0;k<n;k++)s+='<i class="'+(k<=i?"mm-on":"")+'"></i>'; return s; }

  UI.introDone=function(){
    var c=UI.ctx();
    var el=G.document.getElementById("mmTownName");
    var name=el?el.value.trim():"";
    var uid=MM.tutorial.finishIntro(c,name);
    MM.game.save();
    UI.play({step:7,fx:"gold",haptic:"heavy"});
    /* 相棒の誕生演出 → 街へ */
    var box=G.document.getElementById("app");
    if(box&&uid){
      box.innerHTML='<div class="mm-intro mm-intro-4"><div class="mm-intro-stage mm-burst">'+MM.px("m01",120)+'</div>'
        +'<div class="mm-talk"><div class="mm-talk-name">マチノコ</div><div class="mm-talk-text"><b>'+UI.esc(c.mm.name)+'</b>、いい名前モン！<br>さっそく 最初の事件を解決しよう！</div></div>'
        +'<button class="mm-cta" onclick="MM.ui.open()">街へ ▶</button></div>';
      return;
    }
    UI.open();
  };
})();
