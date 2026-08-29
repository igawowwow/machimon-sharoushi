"use strict";
/* ============================================================
   machimon/core/exam.js — 本試験との統合(100日前〜前日の世界変化と振り返り)
   ★カウントダウンで不安を煽らない。主表示は「積み上がった量」、残日数は副表示。
   ★前日の振り返りは端末内の実測値だけで作る(誇張しない・将来予測や合否示唆をしない)。
   ============================================================ */
(function(){
  var G=(typeof window!=="undefined")?window:globalThis;
  var MM=G.MM=G.MM||{};

  /* 残日数 → 段階。試験日が未設定なら段階なし(時計塔も出ない) */
  var PHASES=[
   {id:"tower", from:100,name:"時計塔",     desc:"街の中央に時計塔が建ち始める"},
   {id:"review",from:60, name:"総復習期",   desc:"全エリアで総復習の事件が増える"},
   {id:"raid",  from:30, name:"試験イベント",desc:"レイドボス(模試)が週ごとに現れる"},
   {id:"focus", from:14, name:"最終補強",   desc:"弱点の論点だけが光る"},
   {id:"cheer", from:7,  name:"応援",       desc:"マチモンたちが広場に集まる"},
   {id:"eve",   from:1,  name:"前日",       desc:"これまでの学習を振り返る"}
  ];

  function daysLeft(c){
    var d=c.mm.exam&&c.mm.exam.date;
    if(!d)return null;
    var t=Date.parse(d+"T00:00:00");
    if(!isFinite(t))return null;
    return Math.ceil((t-c.now)/864e5);
  }
  function phase(c){
    var left=daysLeft(c);
    if(left===null||left<0)return null;
    var cur=null;
    for(var i=0;i<PHASES.length;i++){ if(left<=PHASES[i].from)cur=PHASES[i]; }
    return cur?{ id:cur.id, name:cur.name, desc:cur.desc, left:left }:null;
  }
  /* 時計塔の段数: 100日前から1日1段(=積み上がった量の可視化) */
  function towerFloors(c){
    var left=daysLeft(c);
    if(left===null||left>100)return 0;
    return Math.max(0,Math.min(100,100-Math.max(0,left)));
  }

  /* 振り返り(前日イベント)。全て ST.q / ST.mm の実測から生成する */
  function recap(c){
    var q=c.ST.q||{},ans=0,cor=0,mastered=0,ids=0;
    for(var k in q){
      var st=q[k];
      ans+=((st.c||0)+(st.w||0)); cor+=(st.c||0); ids++;
      if((st.box||0)>=3&&!st.ng&&(st.c||0)>0)mastered++;
    }
    var mast=MM.learn?MM.learn.masteryBySub(c):{};
    var subs=[];
    var names=G.SUBJECTS||[];
    for(var s in mast)subs.push({ sub:Number(s), name:names[s]||("科目"+s), pct:Math.round(mast[s]*100) });
    subs.sort(function(a,b){ return a.pct-b.pct; });
    var mons=Object.keys(c.mm.mons).length, blds=MM.town?MM.town.bldCount(c):0;
    var days=0,h=c.ST.hist||{};
    for(var d in h)days++;
    return {
      answers:ans, correct:cor, pct:ans?Math.round(cor/ans*100):0,
      mastered:mastered, questions:ids,
      weakest:subs.slice(0,3), strongest:subs.slice(-3).reverse(),
      mons:mons, buildings:blds, days:days,
      best:c.mm.best, tier:(MM.town?MM.town.tier(c).name:""),
      favorite:favorite(c)
    };
  }
  /* いちばん長く一緒にいたマチモン(誕生が最も古く、配置されている個体) */
  function favorite(c){
    var best=null;
    for(var uid in c.mm.mons){
      var m=c.mm.mons[uid];
      var score=(m.lv*10)+(m.place?50:0)+Math.max(0,(c.today-(m.born||c.today)));
      if(!best||score>best.score)best={uid:uid,score:score,m:m};
    }
    if(!best)return null;
    var sp=MM.DATA.speciesById[best.m.sp]||{};
    return { uid:best.uid, name:sp.name||"", lv:best.m.lv };
  }

  function setDate(c,ymd){
    if(!/^\d{4}-\d{2}-\d{2}$/.test(String(ymd||"")))return false;
    c.mm.exam.date=ymd;
    return true;
  }

  MM.exam={ PHASES:PHASES, daysLeft:daysLeft, phase:phase, towerFloors:towerFloors,
            recap:recap, favorite:favorite, setDate:setDate };
})();
