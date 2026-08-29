"use strict";
/* ============================================================
   machimon/data/sprites.js — マチモン30体のドット絵(12×12・SVG生成)
   ★既存 data-sprites.js と同じ「太い輪郭のドット絵」だが、canvasではなく
     SVGのdata URIで描く(DOM不要=nodeテストでそのまま検証できる)。
   ★パーツ合成方式: 体型(round/twin)+色+顔+アクセサリ。
     新種族は spec を1行足すだけで姿が生まれる(データ駆動)。
   ============================================================ */
(function(){
  var G=(typeof window!=="undefined")?window:globalThis;
  var MM=G.MM=G.MM||{}; var D=MM.DATA=MM.DATA||{};

  /* --- 固定色(既存パレットPと同系) --- */
  var FIX={ K:"#33303E", W:"#FFFFFF", R:"#E8484F", Y:"#FFD34D", G:"#3E9B4F",
            D:"#C58900", C:"#FF9EB8", O:"#FF8A3D" };
  var OUTLINE="#3A3547";

  /* --- 体型(B=本体色 b=おなか色) --- */
  var BODIES={
   round:[
    "............",
    "....BBBB....",
    "..BBBBBBBB..",
    ".BBBBBBBBBB.",
    ".BBBBBBBBBB.",
    "BBBBBBBBBBBB",
    "BBBBBBBBBBBB",
    "BBBbbbbbbBBB",
    "BBBbbbbbbBBB",
    ".BBbbbbbbBB.",
    ".BBBBBBBBBB.",
    "..BB....BB.."],
   twin:[
    "............",
    "...BBBBBB...",
    "..BBBBBBBB..",
    "..BBBBBBBB..",
    "..BBBBBBBB..",
    ".BBBBBBBBBB.",
    "BBBBBBBBBBBB",
    "BBBbbbbbbBBB",
    "BBBbbbbbbBBB",
    ".BBBBBBBBBB.",
    "..BB....BB..",
    "............"]
  };
  /* --- 顔(体型ごとの座標)。Kirby式: 目+ほっぺだけ=いちばん可愛い --- */
  var FACES={
   round:{ normal:[[5,3,"K"],[6,3,"K"],[5,8,"K"],[6,8,"K"],[7,1,"C"],[7,2,"C"],[7,9,"C"],[7,10,"C"]],
           sleepy:[[6,2,"K"],[6,3,"K"],[6,8,"K"],[6,9,"K"],[7,1,"C"],[7,2,"C"],[7,9,"C"],[7,10,"C"]] },
   twin: { normal:[[3,4,"K"],[4,4,"K"],[3,7,"K"],[4,7,"K"],[5,2,"C"],[5,9,"C"]],
           sleepy:[[4,3,"K"],[4,4,"K"],[4,7,"K"],[4,8,"K"],[5,2,"C"],[5,9,"C"]] }
  };
  /* --- アクセサリ([y,x,色]。"A"=種族ごとの差し色) --- */
  var ACCS={
   sprout:[[0,4,"G"],[0,5,"G"],[0,7,"G"]],
   cap:[[1,4,"A"],[1,5,"A"],[1,6,"A"],[1,7,"A"],[2,2,"A"],[2,3,"A"],[2,4,"A"],[2,5,"A"],[2,6,"A"],[2,7,"A"],[2,8,"A"],[2,9,"A"],[0,5,"W"]],
   crown:[[0,4,"Y"],[0,6,"Y"],[1,4,"Y"],[1,5,"Y"],[1,6,"Y"],[1,7,"Y"],[0,7,"Y"]],
   crownT:[[0,4,"Y"],[0,6,"Y"],[1,3,"Y"],[1,4,"Y"],[1,5,"Y"],[1,6,"Y"],[1,7,"Y"],[1,8,"Y"]],
   tie:[[9,5,"A"],[9,6,"A"],[10,5,"A"],[10,6,"A"]],
   hachimaki:[[4,1,"A"],[4,2,"A"],[4,3,"A"],[4,4,"A"],[4,5,"W"],[4,6,"W"],[4,7,"A"],[4,8,"A"],[4,9,"A"],[4,10,"A"]],
   halo:[[0,4,"Y"],[0,5,"Y"],[0,6,"Y"],[0,7,"Y"]],
   helmet:[[1,4,"A"],[1,5,"A"],[1,6,"A"],[1,7,"A"],[2,2,"A"],[2,3,"A"],[2,4,"A"],[2,5,"W"],[2,6,"A"],[2,7,"A"],[2,8,"A"],[2,9,"A"],[3,1,"A"],[3,2,"A"],[3,3,"A"],[3,4,"A"],[3,5,"A"],[3,6,"A"],[3,7,"A"],[3,8,"A"],[3,9,"A"],[3,10,"A"]],
   star:[[7,5,"Y"],[8,4,"Y"],[8,5,"Y"],[8,6,"Y"],[9,5,"Y"]],
   cross:[[7,5,"X"],[7,6,"X"],[8,4,"X"],[8,5,"X"],[8,6,"X"],[8,7,"X"],[9,5,"X"],[9,6,"X"]],
   horns:[[0,3,"Y"],[0,8,"Y"]],
   fangs:[[7,4,"W"],[7,7,"W"]],
   coin:[[8,5,"Y"],[8,6,"Y"],[9,5,"D"],[9,6,"D"]],
   beard:[[8,4,"W"],[8,5,"W"],[8,6,"W"],[8,7,"W"],[9,5,"W"],[9,6,"W"]],
   nursecap:[[1,4,"W"],[1,5,"W"],[1,6,"W"],[1,7,"W"],[2,3,"W"],[2,4,"R"],[2,5,"R"],[2,6,"R"],[2,7,"W"],[2,8,"W"]],
   antenna:[[0,5,"Y"]],
   book:[[9,2,"W"],[9,3,"W"],[10,2,"W"],[10,3,"W"]],
   /* 顔の後に重ねるもの(めがね) */
   glasses:[[5,2,"W"],[6,2,"W"],[5,4,"W"],[6,4,"W"],[5,7,"W"],[6,7,"W"],[5,9,"W"],[6,9,"W"],[5,5,"K"],[5,6,"K"]]
  };
  var OVER={glasses:1}; /* 顔より後に描くアクセサリ */

  /* --- 種族ごとの見た目(体型・本体色・おなか色・差し色・顔・アクセサリ) --- */
  D.looks={
   m01:{c1:"#FFD98E",c2:"#FFF2CF",acc:["sprout"]},
   m02:{c1:"#FFC53C",c2:"#FFE7A6",a:"#5B8DFF",acc:["cap"]},
   m03:{c1:"#FFC53C",c2:"#FFFFFF",acc:["crown"]},
   m04:{c1:"#A9BDDC",c2:"#DCE6F4",a:"#E8484F",acc:["tie"],face:"sleepy"},
   m05:{c1:"#5B8DFF",c2:"#C3D4FF",a:"#E8484F",acc:["hachimaki"]},
   m06:{c1:"#4A6FD8",c2:"#E8EEFF",acc:["halo","beard"]},
   m07:{c1:"#A8D89A",c2:"#E0F2D8",a:"#FFD34D",acc:["helmet"]},
   m08:{c1:"#4FA04F",c2:"#C6E8C0",a:"#FF8A3D",acc:["helmet"]},
   m09:{c1:"#2E8055",c2:"#BFE8CE",a:"#FFD34D",acc:["helmet","star"]},
   m10:{c1:"#FFB3B3",c2:"#FFE2E2",x:"#E8484F",acc:["cross"]},
   m11:{c1:"#FF5A5A",c2:"#FFD0D0",x:"#FFFFFF",acc:["cross"]},
   m12:{c1:"#E8484F",c2:"#FFC9A8",acc:["horns","fangs"]},
   m13:{c1:"#9FC4E8",c2:"#E2EEF8",a:"#3D8FD8",acc:["tie"],face:"sleepy"},
   m14:{c1:"#3D8FD8",c2:"#CFE4F6",a:"#FFC53C",acc:["cap"]},
   m15:{c1:"#2B6FC8",c2:"#D6E6F8",a:"#FFC53C",acc:["cap","star"]},
   m16:{c1:"#C0A8E8",c2:"#EAE2F8",acc:["coin"]},
   m17:{c1:"#8A6FD1",c2:"#DDD4F0",a:"#4A4560",acc:["cap","coin"]},
   m18:{c1:"#6F55B8",c2:"#D8D0F0",acc:["crown","coin"]},
   m19:{c1:"#FFC1D6",c2:"#FFEBF2",acc:["nursecap"]},
   m20:{c1:"#FF8FB8",c2:"#FFDCE8",x:"#E8484F",acc:["nursecap","cross"]},
   m21:{c1:"#E85A9A",c2:"#FFD4E4",x:"#FFFFFF",acc:["crown","cross"]},
   m22:{c1:"#FFB35C",c2:"#FFE6C6",acc:["coin"],face:"sleepy"},
   m23:{c1:"#FF9A3D",c2:"#FFE0B8",a:"#4FA04F",acc:["cap"],face:"sleepy"},
   m24:{c1:"#E88A2E",c2:"#FFEAC8",acc:["crown","beard"],face:"sleepy"},
   m25:{body:"twin",c1:"#7FD0CC",c2:"#DDF4F2",acc:[]},
   m26:{body:"twin",c1:"#3ED6C0",c2:"#CFF4EE",acc:["antenna"]},
   m27:{body:"twin",c1:"#2EA89A",c2:"#FFE9A8",acc:["crownT"]},
   m28:{c1:"#C6C6D4",c2:"#EDEDF4",acc:["glasses"]},
   m29:{c1:"#9A9AB4",c2:"#E2E2EE",acc:["glasses","book"]},
   m30:{c1:"#6E6E92",c2:"#D2D2E4",acc:["glasses","halo"]}
  };

  /* --- 合成: 体 → アクセサリ → 顔 → 上掛けアクセサリ(めがね) --- */
  function compose(look){
    var body=BODIES[look.body||"round"];
    var g=[];
    for(var y=0;y<12;y++)g.push(body[y].split(""));
    var accs=look.acc||[];
    function put(list){ for(var i=0;i<list.length;i++){ var p=list[i]; if(p&&p.length===3)g[p[0]][p[1]]=p[2]; } }
    for(var i=0;i<accs.length;i++){ if(!OVER[accs[i]])put(ACCS[accs[i]]||[]); }
    put(FACES[look.body||"round"][look.face||"normal"]);
    for(var j=0;j<accs.length;j++){ if(OVER[accs[j]])put(ACCS[accs[j]]||[]); }
    return g;
  }

  /* --- 12×12 → SVG data URI(太い輪郭つき・crispEdges) --- */
  function toSvg(g,look){
    var pal={B:look.c1,b:look.c2,A:look.a||look.c1,X:look.x||"#FFFFFF"};
    for(var k in FIX)pal[k]=FIX[k];
    var solid=[],y,x;
    for(y=0;y<12;y++){ solid[y]=[]; for(x=0;x<12;x++)solid[y][x]=(g[y][x]!=="."&&pal[g[y][x]])?1:0; }
    var out='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 14 14" shape-rendering="crispEdges">';
    /* 輪郭: シルエットに隣接する空白を1px塗る(勇者30風の塊感) */
    for(y=0;y<12;y++)for(x=0;x<12;x++){
      if(solid[y][x])continue;
      var adj=false;
      for(var dy=-1;dy<=1&&!adj;dy++)for(var dx=-1;dx<=1;dx++){
        if(!dx&&!dy)continue;
        var ny=y+dy,nx=x+dx;
        if(ny>=0&&ny<12&&nx>=0&&nx<12&&solid[ny][nx]){adj=true;break;}
      }
      if(adj)out+='<rect x="'+(x+1)+'" y="'+(y+1)+'" width="1" height="1" fill="'+OUTLINE+'"/>';
    }
    for(y=0;y<12;y++)for(x=0;x<12;x++){
      var ch=g[y][x];
      if(ch==="."||!pal[ch])continue;
      out+='<rect x="'+(x+1)+'" y="'+(y+1)+'" width="1" height="1" fill="'+pal[ch]+'"/>';
    }
    return "data:image/svg+xml,"+encodeURIComponent(out+"</svg>");
  }

  var CACHE={};
  /* データURIを返す(テスト・<img>共用)。未知IDは代表のマチノコ */
  MM.pxData=function(spId){
    if(CACHE[spId])return CACHE[spId];
    var look=D.looks[spId]||D.looks.m01;
    return (CACHE[spId]=toSvg(compose(look),look));
  };
  /* <img>タグを返す(UI用) */
  MM.px=function(spId,size,cls){
    return '<img class="mm-px '+(cls||"")+'" alt="" src="'+MM.pxData(spId)+'" style="width:'+(size||36)+'px;height:'+(size||36)+'px">';
  };
  /* 建物の絵文字(シーン用) */
  D.bldIcon={home:"🏠",office:"🏢",factory:"🏭",site:"🚧",clinic:"🚑",hw:"🏢",tax:"🏦",hosp:"🏥",city:"🏛️",pens:"🏦",gov:"🏛️"};
})();
