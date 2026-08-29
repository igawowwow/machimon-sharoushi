"use strict";
/* ============================================================
   machimon/ui/celebrate.js — 祝福オーバーレイ(建設・配置・大事件・進化)
   紙吹雪 + 大きなアイコンの落下 + ファンファーレ。タップで閉じる。
   ============================================================ */
(function(){
  var G=(typeof window!=="undefined")?window:globalThis;
  var MM=G.MM=G.MM||{}; var UI=MM.ui;
  var COL=["#FF6B9D","#FFC53C","#3ED6C0","#5B8DFF","#8A6FD1"];

  /* o={icon,title,sub,sfx,after} */
  UI.celebrate=function(o){
    var d=G.document; if(!d)return;
    var old=d.getElementById("mmCele"); if(old)old.remove();
    var el=d.createElement("div"); el.id="mmCele"; el.className="mm-cele";
    var conf="";
    for(var i=0;i<40;i++){ conf+='<i style="left:'+(Math.random()*100)+'%;background:'+COL[i%5]+';animation-delay:'+(Math.random()*.8)+'s;animation-duration:'+(1.6+Math.random())+'s;transform:rotate('+(Math.random()*360)+'deg)"></i>'; }
    el.innerHTML='<div class="mm-cele-conf">'+conf+'</div>'
      +'<div class="mm-cele-box"><div class="mm-cele-icon">'+(o.icon||"🎉")+'</div>'
      +'<div class="mm-cele-title">'+(o.title||"")+'</div>'
      +(o.sub?'<div class="mm-cele-sub">'+o.sub+'</div>':'')
      +'<div class="mm-sub" style="margin-top:10px">タップでつづける</div></div>';
    el.onclick=function(){ el.remove(); try{ if(o.after)o.after(); }catch(e){} };
    d.body.appendChild(el);
    try{ if(MM.sfx&&o.sfx&&MM.sfx[o.sfx])MM.sfx[o.sfx](); }catch(e){}
    UI.play({haptic:"heavy"});
  };
})();
