"use strict";
/* ============================================================
   machimon/ui/scene.js — 街の生活シーン(マチモンが歩き・建て・つぶやく)
   ★「所有ではなく同居」を目に見える形にする層。
     配置済みのマチモンは自分の建物のそばで働き(🔨コツコツ)、
     未配置のマチモンは街をてくてく歩き、ときどき生活のつぶやきを出す。
   ★動かすのはマチモンだけ(建物・背景は静止)。同時アニメは最大6体+吹き出し
     = 通常時の低刺激の原則(Phase9)を守る。reduced-motion では静止する。
   ============================================================ */
(function(){
  var G=(typeof window!=="undefined")?window:globalThis;
  var MM=G.MM=G.MM||{}; var UI=MM.ui;

  var WALKERS_MAX=6;

  /* 時間帯に合った生活のひとこと */
  function lifeText(sp,now){
    if(!sp.life)return "";
    var hr=new Date(now).getHours();
    return hr<11?sp.life.m:(hr<18?sp.life.n:sp.life.e);
  }

  /* 街シーンのHTML。c=ctx */
  UI.scene=function(c){
    var esc=UI.esc, D=MM.DATA;
    var hr=new Date(c.now).getHours();
    var sky=(hr>=6&&hr<16)?"mm-sky-day":(hr<19?"mm-sky-eve":"mm-sky-night");
    var ti=c.mm.tier||0, look=(D.tierLook||[])[ti]||{icon:"🏢",h:170,deco:[]};
    if(look.space)sky="mm-sky-space";
    var h='<div class="mm-scene '+sky+' mm-tier-'+ti+'" style="height:'+look.h+'px">';
    h+='<span class="mm-sun">'+(look.space?"🌍":((hr>=6&&hr<18)?"☀️":"🌙"))+'</span>';
    if(look.space)for(var st=0;st<14;st++)h+='<i class="mm-star" style="left:'+((st*37)%100)+'%;top:'+((st*23)%70)+'%;animation-delay:-'+(st*.4)+'s"></i>';
    if(look.far)h+='<div class="mm-far">'+look.far+'</div>';
    for(var di=0;di<(look.deco||[]).length;di++)h+='<span class="mm-deco" style="left:'+(4+di*26)+'%">'+look.deco[di]+'</span>';
    if(look.car)h+='<span class="mm-car">🚗</span>';
    if(look.train)h+='<span class="mm-train">🚃🚃🚃</span>';
    h+='<span class="mm-cloud" style="left:14%;top:10px">☁️</span>'
      +'<span class="mm-cloud" style="left:62%;top:4px;animation-delay:-14s">☁️</span>';

    /* 建物(静止)。建っている順に最大5棟 */
    var slots=[];
    for(var k in c.mm.slots)slots.push({key:k,s:c.mm.slots[k]});
    slots.sort(function(a,b){ return (a.s.day||0)-(b.s.day||0); });
    var count=Math.min(slots.length,5);
    var step=count>1?Math.min(30,72/(count-1)):0;   /* 少ないほど広く・多くても重ならない間隔 */
    var pos={};                                     /* slotKey → left% (働くマチモンの立ち位置) */
    for(var i=0;i<count;i++){
      var bx=Math.round(8+i*step);
      pos[slots[i].key]=bx;
      h+='<span class="mm-bld" style="left:'+bx+'%">'+(D.bldIcon[slots[i].s.b]||"🏠")
        +'<i class="mm-bld-lv">Lv'+slots[i].s.lv+'</i></span>';
    }
    if(!slots.length)h+='<span class="mm-bld" style="left:8%;opacity:.5">⛺</span>';

    /* マチモン(唯一動くもの)。配置済み=建物のそばで働く / 未配置=歩き回る */
    var uids=Object.keys(c.mm.mons),n=0,delay=0;
    for(var u=0;u<uids.length&&n<WALKERS_MAX;u++){
      var m=c.mm.mons[uids[u]], sp=D.speciesById[m.sp];
      if(!sp)continue;
      var say=lifeText(sp,c.now);
      var working=m.place&&pos[m.place]!==undefined;
      if(working){
        /* 建物のとなりで 🔨 を振る(建てている・働いている感) */
        h+='<span class="mm-worker" style="left:'+(pos[m.place]+9)+'%;animation-delay:-'+(n*1.3)+'s">'
          +'<i class="mm-bub" style="animation-delay:'+(4+n*5)+'s">'+esc(say)+'</i>'
          +MM.px(m.sp,30)
          +'<i class="mm-tool" style="animation-delay:-'+(n*0.4)+'s">🔨</i></span>';
      }else{
        /* 街をてくてく歩く(壁で向きを変える) */
        h+='<span class="mm-walker" style="left:'+(6+(n*13)%55)+'%;--mm-dur:'+(9+n*2)+'s;animation-delay:-'+(n*3.1)+'s">'
          +'<i class="mm-bub" style="animation-delay:'+(2+n*5)+'s">'+esc(say)+'</i>'
          +'<span class="mm-hop" style="animation-delay:-'+(n*0.23)+'s">'+MM.px(m.sp,30)+'</span></span>';
      }
      n++; delay++;
    }
    if(!uids.length){
      h+='<span class="mm-walker" style="left:42%"><i class="mm-bub" style="animation-delay:2s">だれか来ないかな…</i>🥚</span>';
    }
    /* 持っているタマゴ: 割れそうに揺れる。タップで孵化へ */
    if((c.mm.res.tama||0)>0){
      var st=UI.coachStep?UI.coachStep(c):null;
      h+='<button class="mm-egg-btn'+(UI.hl?UI.hl(st,"egg"):"")+'" onclick="MM.ui.go(\'hatch\',{})" aria-label="タマゴを割る">'
        +'<span class="mm-egg-wob">🥚</span><i class="mm-egg-n">×'+c.mm.res.tama+'</i><i class="mm-egg-tap">タップ!</i></button>';
    }
    if(c.mm.name)h+='<span class="mm-townname">'+esc(c.mm.name)+'</span>';
    h+='<div class="mm-ground"></div></div>';
    return h;
  };
})();
