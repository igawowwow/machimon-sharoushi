"use strict";
/* ============================================================
   machimon/ui/build.js — 建設・強化(タップ2回で完結)
   ★レイアウトの自由編集はMVP対象外(街の操作が学習時間を奪わないため)。
   ★建物には「建った日」と「そのとき解いた累計問題数」が刻まれ、努力の可視化装置になる。
   ============================================================ */
(function(){
  var G=(typeof window!=="undefined")?window:globalThis;
  var MM=G.MM=G.MM||{}; var UI=MM.ui;

  UI.screens.build=function(p){
    var c=UI.ctx(), esc=UI.esc;
    if(p&&p.slot)return slotView(c,p.slot);
    var h='<div class="mm-wrap">'+UI.resBar(c)+'<div class="mm-h">🔨 建設</div>';
    h+='<div class="mm-q" style="font-size:12px">生産 '+MM.town.production(c)+' /時 ・ 倉庫 '+MM.economy.cap(c)
      +'<div class="mm-sub">倉庫の大きさは、直近7日の有効回答数で決まります(学ぶほど大きくなります)</div></div>';
    for(var i=0;i<MM.DATA.areas.length;i++){
      var a=MM.DATA.areas[i];
      if(!c.mm.areas[a.id])continue;
      h+='<div class="mm-area"><div class="mm-h" style="margin:0 0 6px">'+esc(a.name)+'</div><div class="mm-slots">';
      var sl=MM.town.slotsOf(c,a.id);
      for(var j=0;j<sl.length;j++){
        var d=sl[j].data;
        h+='<button class="mm-slot'+(d?"":" mm-empty")+'" onclick="MM.ui.go(\'build\',{slot:\''+sl[j].key+'\'})">'
          +(d?('<b>'+esc((MM.DATA.bldById[d.b]||{}).name)+' Lv'+d.lv+'</b>'):'＋ 建てる')+'</button>';
      }
      h+='</div></div>';
    }
    /* 階層(世界の広がり)。上げるには知識エネルギーが要る */
    var nt=MM.town.nextTier(c);
    h+='<div class="mm-h">🌏 世界の階層</div><div class="mm-q" style="font-size:12px">'
      +'いまは <b>'+esc(MM.town.tier(c).name)+'</b>';
    if(nt){
      h+='<div class="mm-sub" style="margin-top:6px">つぎ: '+esc(nt.name)+' — '+esc(nt.desc)+'</div>'
        +UI.bar(c.mm.res.ke,nt.ke)
        +'<div class="mm-sub">✨ '+c.mm.res.ke+' / '+nt.ke+'</div>'
        +(MM.town.canTier(c)?'<button class="small-btn" style="width:100%;min-height:48px;margin-top:8px" onclick="MM.ui.upTier()">世界を広げる</button>':'');
    }else h+='<div class="mm-sub">これ以上の階層はまだ用意されていません</div>';
    h+='</div>';
    return h+'</div>'+UI.tabs("build");
  };

  function slotView(c,key){
    var esc=UI.esc, d=c.mm.slots[key];
    var aid=String(key).split(":")[0];
    var a=MM.DATA.areaById[aid]||{name:""};
    var h='<div class="mm-wrap">'+UI.resBar(c)+'<div class="mm-h">'+esc(a.name)+'</div>';
    if(d){
      var b=MM.DATA.bldById[d.b]||{name:"?"};
      var cost=MM.economy.bldCost(d.b,d.lv+1);
      h+='<div class="mm-q"><b>'+esc(b.name)+' Lv'+d.lv+'</b>'
        +'<div class="mm-sub">'+esc(b.desc||"")+'</div>'
        +'<div class="mm-sub">生産 '+(b.prod*d.lv)+' /時</div>'
        +'<div class="mm-sub" style="margin-top:6px">🔨 この建物は、あなたが '+d.q+' 問解いた日に建ちました</div>'
        +(d.mon&&c.mm.mons[d.mon]?'<div class="mm-on">👾 '+esc((MM.DATA.speciesById[c.mm.mons[d.mon].sp]||{}).name)+' が働いています</div>':'')
        +'</div>';
      if(!MM.town.has(c,"upgrade")){
        h+='<div class="mm-q" style="font-size:12px">階層「商店街」になると強化できます。</div>';
      }else if(d.lv>=MM.DATA.BLD_LV_MAX){
        h+='<div class="mm-q" style="font-size:12px">この建物は最大まで育っています。</div>';
      }else{
        h+='<button class="small-btn" style="width:100%;min-height:52px" onclick="MM.ui.upgrade(\''+key+'\')">'
          +'強化する（🪙'+cost+'）</button>';
      }
    }else{
      var opts=MM.town.buildable(c,aid);
      h+='<div class="mm-h">＋ 建てる</div>';
      for(var i=0;i<opts.length;i++){
        var o=opts[i], cst=MM.economy.bldCost(o.id,1);
        var can=c.mm.res.g>=cst;
        h+='<button class="mm-slot" style="width:100%;margin-bottom:6px;min-height:56px;opacity:'+(can?1:.55)+'" '
          +'onclick="MM.ui.build(\''+key+'\',\''+o.id+'\')">'
          +'<b>'+esc(o.name)+'（🪙'+cst+'）</b><span class="mm-sub">'+esc(o.desc)+' / 生産'+o.prod+'･時</span></button>';
      }
    }
    h+='<button class="small-btn" style="width:100%;min-height:48px;margin-top:12px" onclick="MM.ui.go(\'town\')">街へもどる</button>';
    return h+'</div>';
  }

  UI.build=function(key,bid){
    var c=UI.ctx();
    if(MM.town.build(c,key,bid)){ MM.game.save(); UI.play({step:3,fx:"glow",haptic:"medium"}); }
    UI.go("build",{slot:key});
  };
  UI.upgrade=function(key){
    var c=UI.ctx();
    if(MM.town.upgrade(c,key)){ MM.game.save(); UI.play({step:3,fx:"glow",haptic:"medium"}); }
    UI.go("build",{slot:key});
  };
  UI.upTier=function(){
    var c=UI.ctx();
    if(MM.town.upTier(c)){ MM.game.save(); UI.play({step:7,fx:"gold",haptic:"heavy"}); }
    UI.go("build");
  };
})();
