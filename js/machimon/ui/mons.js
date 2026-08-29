"use strict";
/* ============================================================
   machimon/ui/mons.js — マチモン(一覧・詳細・進化・配置)
   ★進化条件は「あと労基法38問」のように、常に【次にとるべき行動】で示す。
   ★詳細画面から「この子を育てる」で、その科目の事件へ1タップで入れる
     = 育成の欲求を学習行動へ変換する最短経路。
   ============================================================ */
(function(){
  var G=(typeof window!=="undefined")?window:globalThis;
  var MM=G.MM=G.MM||{}; var UI=MM.ui;

  UI.screens.mons=function(){
    var c=UI.ctx(), esc=UI.esc;
    var h='<div class="mm-wrap">'+UI.resBar(c)+'<div class="mm-h">👾 マチモン';
    var uids=Object.keys(c.mm.mons);
    h+=' <span class="mm-sub">'+uids.length+'体</span></div>';
    if(c.mm.res.tama>0){
      h+='<button class="mm-inc" onclick="MM.ui.go(\'hatch\',{})"><span class="mm-line">🥚 タマゴが '+c.mm.res.tama+'個 あります — 割る</span></button>';
    }
    if(!uids.length){
      h+='<div class="mm-q">まだ誰もいません。事件を解決するとタマゴが見つかります。</div>';
      return h+'</div>'+UI.tabs("mons");
    }
    h+='<div class="mm-mons">';
    for(var i=0;i<uids.length;i++){
      var uid=uids[i], m=c.mm.mons[uid], sp=MM.DATA.speciesById[m.sp];
      if(!sp)continue;
      var goal=MM.evolve.nextGoal(c,uid);
      var ck=MM.evolve.check(c,uid);
      h+='<button class="mm-mon" onclick="MM.ui.go(\'mon\',{uid:\''+uid+'\'})">'
        +'<span class="mm-mon-face">'+MM.px(m.sp,40)+'</span>'
        +'<span class="mm-mon-info"><b>'+esc(sp.name)+'</b>'
        +'<span class="mm-sub">Lv'+m.lv+' / '+MM.DATA.rarName[sp.rar]
        +(m.place?' / 🏠はたらき中':'')+'</span>'
        +(ck.ok?'<span class="mm-need mm-ok">✨ 進化できます</span>':(goal?'<span class="mm-need">'+esc(goalText(goal))+'</span>':''))
        +'</span></button>';
    }
    h+='</div></div>'+UI.tabs("mons");
    return h;
  };

  function placeName(c,key){
    var s=c.mm.slots[key]; if(!s)return "";
    var b=MM.DATA.bldById[s.b]||{name:""};
    var a=MM.DATA.areaById[String(key).split(":")[0]]||{name:""};
    return a.name+"の"+b.name;
  }
  function goalText(g){
    var names=G.SUBJECTS||[];
    if(g.kind==="correct")return "進化まで "+(names[g.sub]||"")+" あと"+g.left+"問";
    if(g.kind==="mastery")return "進化まで 習熟度あと"+g.left+"%";
    if(g.kind==="allSub")return "進化まで 全科目あと"+g.left+"%";
    if(g.kind==="lv")return "進化まで Lvあと"+g.left;
    if(g.kind==="ke")return "進化まで 知識エネルギーあと"+g.left;
    return "";
  }

  /* --- 個体の詳細 --- */
  UI.screens.mon=function(p){
    var c=UI.ctx(), esc=UI.esc;
    var m=c.mm.mons[p.uid];
    if(!m)return UI.screens.mons();
    var sp=MM.DATA.speciesById[m.sp]||{};
    var ck=MM.evolve.check(c,p.uid);
    var names=G.SUBJECTS||[];
    var h='<div class="mm-wrap">'+UI.resBar(c)
      +'<div style="text-align:center;margin:8px 0"><span class="mm-hop" style="display:inline-block">'+MM.px(m.sp,88)+'</span></div>'
      +'<div class="mm-h" style="justify-content:center">'+esc(sp.name)+' <span class="mm-sub">Lv'+m.lv+' / '+MM.DATA.rarName[sp.rar]+'</span></div>'
      +'<div class="mm-q" style="font-size:13px">'
      +'<div>'+esc(sp.type)+'属性 / '+esc(sp.nature)+' / '+esc(sp.job)+'</div>'
      +'<div class="mm-sub">とくい: '+esc(sp.sub>=0?(names[sp.sub]||""):"すべての科目")+' — '+esc(sp.skill||"")+'</div>'
      +'<div style="margin-top:6px">'+esc(life(sp,c))+'</div>'
      +'</div>';
    /* 進化条件を進捗バーで常時表示(= 学習目標の可視化) */
    if(ck.need){
      h+='<div class="mm-h">✨ 進化条件 → '+esc(ck.toName)+'</div><div class="mm-q" style="font-size:12px">';
      h+=row("レベル",ck.need.lv);
      h+=row((sp.sub>=0?(names[sp.sub]||"")+"の正解数":"総正解数"),ck.need.correct);
      h+=row("習熟度(%)",ck.need.mastery);
      if(ck.need.allSub)h+=row("全科目の最低習熟度(%)",ck.need.allSub);
      if(ck.need.ke.need>0)h+=row("知識エネルギー",ck.need.ke);
      h+='</div>';
      if(ck.ok)h+='<button class="small-btn" style="width:100%;min-height:52px;font-size:16px" onclick="MM.ui.evolve(\''+p.uid+'\')">✨ 進化させる</button>';
      else if(sp.sub>=0)h+='<button class="small-btn" style="width:100%;min-height:52px" onclick="MM.ui.train('+sp.sub+')">この子を育てる（'+esc(names[sp.sub]||"")+'の事件へ）</button>';
      else h+='<button class="small-btn" style="width:100%;min-height:52px" onclick="MM.ui.go(\'town\')">街の事件を解決する</button>';
    }else{
      h+='<div class="mm-q">この子はもう最終進化です。街の顔として働いています。</div>';
    }
    /* 配置 */
    h+='<div class="mm-h">🏠 はたらく場所</div>';
    if(!MM.town.has(c,"place")){
      h+='<div class="mm-q" style="font-size:12px">階層「町」になると、マチモンを施設で働かせられます。</div>';
    }else{
      h+='<div class="mm-slots">';
      for(var k in c.mm.slots){
        var s=c.mm.slots[k], b=MM.DATA.bldById[s.b]||{name:"?"};
        var fit=MM.town.fits(sp,b);
        h+='<button class="mm-slot" onclick="MM.ui.place(\''+p.uid+'\',\''+k+'\')">'
          +'<b>'+esc(b.name)+'</b><span class="mm-sub">'+esc(placeName(c,k))+(fit?' ◎適性':'')+'</span>'
          +(s.mon===p.uid?'<span class="mm-on">ここで働いています</span>':'')+'</button>';
      }
      h+='</div>';
    }
    h+='<button class="small-btn" style="width:100%;min-height:48px;margin-top:12px" onclick="MM.ui.go(\'mons\')">もどる</button>';
    return h+'</div>';
  };
  function row(label,n){
    if(!n)return "";
    return '<div class="mm-row"><span>'+UI.esc(label)+'</span><span'+(n.ok?' style="color:#3ED6C0;font-weight:900"':'')+'>'
      +n.now+' / '+n.need+'</span></div>'+UI.bar(n.now,n.need);
  }
  function life(sp,c){
    if(!sp.life)return "";
    var hr=new Date(c.now).getHours();
    return hr<11?sp.life.m:(hr<18?sp.life.n:sp.life.e);
  }

  UI.evolve=function(uid){
    var c=UI.ctx();
    var r=MM.evolve.evolve(c,uid);
    if(r){ MM.game.save(); UI.play({step:7,fx:"gold",haptic:"heavy"}); }
    UI.go("mon",{uid:uid});
  };
  UI.place=function(uid,key){
    var c=UI.ctx();
    if(c.mm.slots[key]&&c.mm.slots[key].mon===uid)MM.town.unplace(c,uid);
    else MM.town.place(c,uid,key);
    MM.game.save();
    UI.go("mon",{uid:uid});
  };
  /* 「この子を育てる」= その科目の事件を作って直行する(育成→学習の最短導線) */
  UI.train=function(sub){
    var c=UI.ctx();
    var a=MM.DATA.areaBySub[sub];
    if(!a||!c.mm.areas[a.id]){ UI.go("town"); return; }
    var made=MM.incident.more(c,a.id,3);
    MM.game.save();
    if(made.length)UI.go("incident",{id:made[0].id});
    else UI.go("town");
  };
})();
