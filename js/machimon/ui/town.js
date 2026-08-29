"use strict";
/* ============================================================
   machimon/ui/town.js — 街(ハブ画面)
   ★事件だけがアニメーションする。街の他の要素は静止させる(事件が埋もれないため)。
   ★エリアの門には「解放に 知識エネルギー 60」ではなく
     「あと復習6件で開く」という【次にとるべき行動】を出す。
   ============================================================ */
(function(){
  var G=(typeof window!=="undefined")?window:globalThis;
  var MM=G.MM=G.MM||{}; var UI=MM.ui;

  UI.screens.town=function(){
    var c=UI.ctx();
    var s=MM.game.summary({ST:c.ST});
    var esc=UI.esc;
    var st=UI.coachStep?UI.coachStep(c):null;
    var h='<div class="mm-wrap">'+UI.resBar(c);
    /* 街の生活シーン: マチモンが歩き・働き・つぶやく(動くのはここだけ) */
    if(UI.scene)h+=UI.scene(c);
    /* 相棒のコーチ(いま何をすべきか1行)と、つぎの目標(進捗バー) */
    if(UI.coach)h+=UI.coach(c,st);
    if(UI.goal)h+=UI.goal(c);
    h+='<div class="mm-quick"><button onclick="MM.ui.go(\'boss\')">⚔️ ボスに挑む</button><button onclick="MM.ui.go(\'record\')">📊 記録</button><button onclick="MM.ui.go(\'hatch\',{})">🥚 タマゴ '+(c.mm.res.tama||0)+'</button></div>';

    /* 放置収益の回収(街に戻った瞬間に自動。タップ不要) */
    var idle=UI.lastIdle; UI.lastIdle=null;
    if(idle&&(idle.g>0||idle.mat>0)){
      h+='<div class="mm-q" style="padding:8px;font-size:12px">🏠 街のみんなが '+idle.hours+'時間ぶん働きました → 🪙'+idle.g
        +(idle.mat?' 🧩'+idle.mat:'')+(idle.capped?' <span class="mm-sub">(倉庫がいっぱいです)</span>':'')+'</div>';
    }

    /* 試験日連動(設定時のみ。残日数は副表示・積み上がった量を主表示にする) */
    if(s.exam){
      h+='<div class="mm-q" style="padding:8px;font-size:12px">⏰ '+esc(s.exam.name)+' — 時計塔 '
        +MM.exam.towerFloors(c)+'段 <span class="mm-sub">(あと'+s.exam.left+'日)</span></div>';
    }

    h+='<div class="mm-h">💬 いま起きている事件 <span class="mm-sub">'+s.incidents+'件</span></div>';
    var pend=MM.incident.pending(c);
    if(!pend.length){
      h+='<button class="mm-inc" onclick="MM.ui.more(\'rouki\')"><span class="mm-line">今日の事件は解決しました。もう少し見回るモン？</span></button>';
    }
    var showAll=!!UI.showAllInc, lim=showAll?12:3;
    for(var i=0;i<pend.length&&i<lim;i++){
      var x=pend[i], k=MM.DATA.incKindById[x.kind]||{badge:"",color:"#8A8494"};
      var a=MM.DATA.areaById[x.area]||{name:""};
      var isBig=x.kind==="big";
      h+='<button class="mm-inc'+(isBig?" mm-inc-big":"")+(i===0?UI.hl(st,"inc"):"")+'" onclick="MM.ui.go(\'incident\',{id:\''+esc(x.id)+'\'})">'
        +'<span class="mm-inc-face">'+face(c,x)+'</span><span class="mm-inc-body">'
        +'<span class="mm-badge" style="background:'+k.color+'">'+esc(k.badge)+'</span>'
        +'<span class="mm-sub">'+esc(a.name)+(isBig?' ・ '+(x.prog||0)+'/'+x.need+' 連続正解 ・ 🥚+🪙'+MM.DATA.BIG_BONUS.g:'')+'</span><br>'
        +'<span class="mm-line">'+esc(x.line)+'</span></span><span class="mm-inc-go">'+(isBig?"挑む":"解決")+' ▶</span></button>';
    }
    if(pend.length>lim)h+='<button class="mm-more" onclick="MM.ui.showAllInc=1;MM.ui.go(\'town\')">ほか '+(pend.length-lim)+' 件の事件を見る ▼</button>';

    /* エリア(解放済みは建物、未解放は門) */
    h+='<div class="mm-h">🏠 '+esc(MM.town.tier(c).name)+' <span class="mm-sub">街Lv'+s.lv+' / 生産 '+s.prod+'･時 / 倉庫 '+s.cap+'</span></div>';
    var names=G.SUBJECTS||[];
    for(var ai=0;ai<MM.DATA.areas.length;ai++){
      var ar=MM.DATA.areas[ai];
      if(c.mm.areas[ar.id]){
        h+='<div class="mm-area"><div class="mm-h" style="margin:0 0 6px">'+esc(ar.name)
          +' <span class="mm-sub">'+esc(names[ar.sub]||"")+'</span></div><div class="mm-slots">';
        var sl=MM.town.slotsOf(c,ar.id);
        for(var si=0;si<sl.length;si++){
          var d=sl[si].data;
          if(d){
            var b=MM.DATA.bldById[d.b]||{name:"?"};
            var mon=d.mon&&c.mm.mons[d.mon]?(MM.DATA.speciesById[c.mm.mons[d.mon].sp]||{}).name:"";
            var hl=UI.hl(st,"slot:"+sl[si].key);
            var oc=hl&&st.uid?'MM.ui.placeGuided(\''+st.uid+'\',\''+sl[si].key+'\')':'MM.ui.go(\'build\',{slot:\''+sl[si].key+'\'})';
            h+='<button class="mm-slot'+hl+'" onclick="'+oc+'">'
              +'<b>'+(MM.DATA.bldIcon[d.b]||"🏠")+' '+esc(b.name)+' Lv'+d.lv+'</b>'
              +(mon?'<span class="mm-on">👾 '+esc(mon)+' はたらき中</span>':'<span class="mm-sub">'+(hl?'👆 マチモンを配置':'空き枠')+'</span>')
              +'</button>';
          }else{
            h+='<button class="mm-slot mm-empty" onclick="MM.ui.go(\'build\',{slot:\''+sl[si].key+'\'})">＋ 建てる</button>';
          }
        }
        h+='</div></div>';
      }else{
        var can=c.mm.res.ke>=ar.ke;
        var left=Math.max(0,ar.ke-c.mm.res.ke);
        h+='<button class="mm-gate '+(can?"mm-can":"")+'" onclick="MM.ui.openArea(\''+ar.id+'\')">'
          +'🔒 <b>'+esc(ar.name)+'</b> <span class="mm-sub">'+esc(names[ar.sub]||"")+'</span><br>'
          +(can?'✨ 知識エネルギー '+ar.ke+' で開ける — タップ'
               :'✨ '+c.mm.res.ke+' / '+ar.ke+' … '+hint(left))
          +'</button>';
      }
    }
    h+='</div>'+UI.tabs("town");
    return h;
  };
  /* 事件カードの顔: 相談に来る住民(そのエリアの種族の第1段階 or 相棒) */
  function face(c,x){ return MM.px(x.face||"m01",34); }
  /* コーチ誘導の配置: 1タップで配置して街へ */
  UI.placeGuided=function(uid,key){
    var c=UI.ctx();
    if(MM.town.place(c,uid,key)){ MM.game.save(); var nm=(MM.DATA.speciesById[c.mm.mons[uid].sp]||{}).name||"マチモン"; var bn=(MM.DATA.bldById[c.mm.slots[key].b]||{}).name||"建物";
      UI.go("town"); if(UI.celebrate)UI.celebrate({icon:MM.px(c.mm.mons[uid].sp,96),title:nm+" が働きはじめた！",sub:bn+"で 🪙 を稼いでくれる(いない間も)",sfx:"place"}); return; }
    UI.go("town");
  };
  /* 「あと◯◯」を、資源量ではなく行動で示す(復習1件=3・苦手克服=8) */
  function hint(left){
    var rev=Math.ceil(left/3);
    return 'あと復習'+rev+'件ぶん(苦手の克服なら'+Math.ceil(left/8)+'件)';
  }

  UI.openArea=function(id){
    var c=UI.ctx();
    if(MM.town.openArea(c,id)){ MM.game.save(); UI.play({step:7,fx:"gold",haptic:"heavy"}); }
    UI.go("town");
  };
  /* 事件が尽きたときの追加見回り(そのエリアの科目から出題する) */
  UI.more=function(area){
    var c=UI.ctx();
    MM.incident.more(c,area,3);
    MM.game.save();
    UI.go("town");
  };
})();
