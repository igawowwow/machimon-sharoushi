"use strict";
/* machimon/ui/zukan.js — 図鑑(系統ごと3体・未発見はシルエット・達成報酬の表示) */
(function(){
  var G=(typeof window!=="undefined")?window:globalThis;
  var MM=G.MM=G.MM||{}; var UI=MM.ui;
  var RN=["N","R","SR","SSR","UR"];
  UI.screens.zukan=function(){
    var c=UI.ctx(), esc=UI.esc, names=G.SUBJECTS||[];
    var got=MM.zukan.claim(c); if(got.length){ MM.game.save(); UI.pendingCele=got; }
    var n=MM.zukan.count(c), total=MM.DATA.species.length;
    var h='<div class="mm-wrap">'+UI.resBar(c)
      +'<div class="mm-h">📖 マチモン図鑑 <span class="mm-sub">'+n+' / '+total+'</span></div>'+UI.bar(n,total)
      +'<div class="mm-q" style="padding:8px;font-size:12px">系統(3体)をそろえると 🎫'+MM.zukan.LINE_TIX+'枚、全'+total+'体で 🎫'+MM.zukan.ALL_TIX+'枚。'
      +'こども→おとな→全盛期(SSR以上)で姿が変わる。育てて姿をそろえよう。'+((c.mm.tix||0)?' いま 🎫<b>'+c.mm.tix+'</b>枚':'')+'</div>';
    var L=MM.zukan.lines();
    for(var i=0;i<L.length;i++){
      var key="L"+L[i].sub, done=!!c.mm.dexc[key];
      h+='<div class="mm-dex-line"><div class="mm-goal-row"><b>'+esc(L[i].sub<0?"街ライン":names[L[i].sub]||"")+'</b>'+(done?'<span class="mm-dex-done">✔ コンプ 🎫+'+MM.zukan.LINE_TIX+'</span>':'')+'</div><div class="mm-dex-row">';
      for(var j=0;j<L[i].list.length;j++){
        var s=L[i].list[j], has=!!c.mm.dex[s.id];
        h+='<div class="mm-dex'+(has?"":" mm-unk")+'">'+MM.px(s.id,48)+'<b>'+(has?esc(s.name):"？？？")+'</b><span class="mm-sub">'+RN[s.rar]+(has?'':' ・ '+(s.stage===1?'かえすと':(s.stage===2?'おとなで':'全盛期のSSR以上')))+'</span></div>';
      }
      h+='</div></div>';
    }
    try{ if(MM.garden){ var gd=MM.garden.W(c), GD=MM.DATA.garden;
      h+='<div class="mm-h">✨ 特性図鑑 <span class="mm-sub">'+Object.keys(gd.trSeen).length+' / '+GD.TRAITS.length+'</span></div><div class="mm-gtitles">';
      GD.TRAITS.forEach(function(t){ var on=gd.trSeen[t.id]; h+='<div class="'+(on?'mm-gt-on':'')+'"><b>'+(on?t.icon+' '+esc(t.name):'❔ ？？？')+'</b><span class="mm-sub">'+(on?esc(t.desc):'ガチャ・配合でまれに出る')+'</span></div>'; });
      h+='</div><div class="mm-h">🌈 色違い図鑑 <span class="mm-sub">'+Object.keys(gd.shF).length+' / 9</span></div><div class="mm-dex-row" style="flex-wrap:wrap">';
      GD.families.forEach(function(f){ var on=gd.shF[f.id]; h+='<div class="mm-dex'+(on?'':' mm-unk')+'"><span class="'+(on?'mm-gi-shiny':'')+'">'+MM.px(f.sp[1],44)+'</span><b>'+(on?esc(f.name):'？？？')+'</b></div>'; });
      h+='</div>'; } }catch(e){}
    h+='</div>'+UI.tabs("zukan");
    setTimeout(function(){ var pc=UI.pendingCele; UI.pendingCele=null; if(pc&&pc.length&&UI.celebrate)UI.celebrate({icon:"📖",title:pc[0].title,sub:"🎫 ガチャチケット +"+pc.reduce(function(a,x){return a+x.tix;},0)+"枚",sfx:"big"}); },300);
    return h;
  };
})();
