"use strict";
/* ============================================================
   machimon/data/areas.js — 科目エリア(科目=世界そのもの)
   1行足すだけでエリアが増える。sub は window.SUBJECTS の添字。
   ke  : 解放に必要な知識エネルギー(0=初期解放)。解放順 n(2番目〜)で ke=60+120(n-2)
   ord : 学習推奨順(=解放順)。試験の学習順序と一致させる
   ============================================================ */
(function(){
  var G=(typeof window!=="undefined")?window:globalThis;
  var MM=G.MM=G.MM||{}; var D=MM.DATA=MM.DATA||{};

  D.areas=[
  {id:"rouki",  name:"残業横丁",       sub:0,ke:0,  ord:0,slots:4,blds:["office","factory","home"],
   flavor:"工場とオフィスがひしめく、いちばん最初の街",theme:"#e8a33d"},
  {id:"anei",   name:"安全ヶ丘",       sub:1,ke:60, ord:1,slots:4,blds:["site","home"],
   flavor:"足場と機械の丘。ヘルメットが手放せない",theme:"#4fa04f"},
  {id:"rousai", name:"レスキュー湾",   sub:2,ke:180,ord:2,slots:4,blds:["clinic","home"],
   flavor:"サイレンが響く湾岸。守る者たちの街",theme:"#d8534f"},
  {id:"koyo",   name:"ハロワ通り",     sub:3,ke:300,ord:3,slots:4,blds:["hw","home"],
   flavor:"次の仕事を探す人が集まる通り",theme:"#3d8fd8"},
  {id:"choshu", name:"徴収橋",         sub:4,ke:420,ord:4,slots:3,blds:["tax","home"],
   flavor:"街の財政を支える橋。数字が渡っていく",theme:"#8a6fd8"},
  {id:"kenpo",  name:"メディカルシティ",sub:5,ke:540,ord:5,slots:4,blds:["hosp","home"],
   flavor:"白い建物が並ぶ医療の街",theme:"#3fb0a8"},
  {id:"kokunen",name:"市民生活エリア", sub:6,ke:660,ord:6,slots:4,blds:["city","home"],
   flavor:"ふつうの暮らしがある住宅街",theme:"#c98fb0"},
  {id:"kounen", name:"未来年金都市",   sub:7,ke:780,ord:7,slots:4,blds:["pens","home"],
   flavor:"二階建ての塔がそびえる未来都市",theme:"#5b6fd8"},
  {id:"ippan",  name:"行政タワー",     sub:8,ke:900,ord:8,slots:3,blds:["gov","home"],
   flavor:"統計と白書が集まる街の頭脳",theme:"#8f8f8f"}
  ];
  D.areaById=Object.create(null);
  D.areaBySub=Object.create(null);
  for(var i=0;i<D.areas.length;i++){ D.areaById[D.areas[i].id]=D.areas[i]; D.areaBySub[D.areas[i].sub]=D.areas[i]; }
})();
