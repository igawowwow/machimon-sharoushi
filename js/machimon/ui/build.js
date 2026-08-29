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
        +'</div>';
      /* 働き手: メリット(+N/時)を数字で見せる。はずす/入れ替えも1タップ */
      h+='<div class="mm-h">👾 はたらくマチモン</div>';
      if(d.mon&&c.mm.mons[d.mon]){
        var wm=c.mm.mons[d.mon], wsp=MM.DATA.speciesById[wm.sp]||{name:"?"};
        h+='<div class="mm-q" style="display:flex;align-items:center;gap:10px;padding:10px">'+MM.px(wm.sp,44)+'<div style="flex:1"><b>'+esc(wsp.name)+' Lv'+wm.lv+'</b>'
          +'<div class="mm-sub">この子の生産 <b style="color:#B58900">+'+(Math.round(MM.town.monProd(c,d.mon)*10)/10)+' 🪙/時</b>'+(MM.town.fits(wsp,b)?' ◎適性':'')+((MM.DATA.areaById[aid]||{}).sub===wsp.sub?' ◎科目一致×1.5':'')+'</div></div>'
          +'<button class="small-btn" style="min-height:40px" onclick="MM.ui.unplaceSlot(\''+key+'\')">はずす</button></div>';
      }else{
        var free=[]; for(var fu in c.mm.mons){ if(!c.mm.mons[fu].place)free.push(fu); }
        if(!free.length)h+='<div class="mm-q" style="font-size:12px">空き枠。手のあいたマチモンがいません(ガチャ/タマゴで仲間を増やそう)</div>';
        else{
          h+='<div class="mm-q" style="font-size:12px;padding:8px">配置すると、いない間も 🪙 を稼ぐ(放置収入)。科目が同じ子は×1.5</div><div class="mm-slots">';
          for(var fi=0;fi<free.length&&fi<8;fi++){
            var fm=c.mm.mons[free[fi]], fsp=MM.DATA.speciesById[fm.sp]||{name:"?"};
            var est=fsp.prod*(1+(fm.lv-1)*0.02)*((MM.DATA.areaById[aid]||{}).sub===fsp.sub?1.5:1)*(MM.town.fits(fsp,b)?1.2:1);
            h+='<button class="mm-slot" onclick="MM.ui.placeGuided(\''+free[fi]+'\',\''+key+'\')">'+MM.px(fm.sp,28)+' <b style="display:inline">'+esc(fsp.name)+'</b><span class="mm-sub">+'+(Math.round(est*10)/10)+' 🪙/時 → 配置</span></button>';
          }
          h+='</div>';
        }
      }
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
    if(MM.town.build(c,key,bid)){ MM.game.save(); var b=MM.DATA.bldById[bid]||{name:"建物"};
      UI.go("town"); if(UI.celebrate)UI.celebrate({icon:MM.DATA.bldIcon[bid]||"🏠",title:b.name+" が建った！",sub:"街Lv"+c.mm.lv+" ・ 生産 "+MM.town.production(c)+"/時 ・ 事件枠 +"+MM.DATA.INC_PER_BLD,sfx:"build"}); return; }
    UI.go("build",{slot:key});
  };
  UI.unplaceSlot=function(key){
    var c=UI.ctx(), d=c.mm.slots[key];
    if(d&&d.mon){ MM.town.unplace(c,d.mon); MM.game.save(); UI.play({sfx:"tap"}); }
    UI.go("build",{slot:key});
  };
  UI.upgrade=function(key){
    var c=UI.ctx();
    if(MM.town.upgrade(c,key)){ MM.game.save(); var d=c.mm.slots[key], b=MM.DATA.bldById[d.b]||{name:"建物"};
      UI.go("build",{slot:key}); if(UI.celebrate)UI.celebrate({icon:MM.DATA.bldIcon[d.b]||"🏠",title:b.name+" Lv"+d.lv+" に強化！",sub:"生産 "+MM.town.production(c)+"/時",sfx:"build"}); return; }
    UI.go("build",{slot:key});
  };
  UI.upTier=function(){
    var c=UI.ctx();
    if(MM.town.upTier(c)){ MM.game.save(); var t=MM.town.tier(c);
      UI.go("town"); if(UI.celebrate)UI.celebrate({icon:"🌏",title:"世界が広がった！ 「"+t.name+"」",sub:t.desc,sfx:"big"}); return; }
    UI.go("build");
  };
})();
