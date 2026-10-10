"use strict";
/* ============================================================
   machimon/data/sprites.js — マチモンのドット絵(12×12・SVG生成)。旧30体＋種類105(data/kinds.js)
   ★既存 data-sprites.js と同じ「太い輪郭のドット絵」だが、canvasではなく
     SVGのdata URIで描く(DOM不要=nodeテストでそのまま検証できる)。
   ★パーツ合成方式: 体型8+色+顔6+模様6+小物47。
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
    "............"],
   tall:[   /* のっぽ */
    "....BBBB....",
    "...BBBBBB...",
    "...BBBBBB...",
    "..BBBBBBBB..",
    "..BBBBBBBB..",
    "..BBBBBBBB..",
    "..BBBBBBBB..",
    "..BBbbbbBB..",
    "..BBbbbbBB..",
    "..BBbbbbBB..",
    "..BBBBBBBB..",
    "...BB..BB..."],
   wide:[   /* ずんぐり */
    "............",
    "............",
    "..BBBBBBBB..",
    ".BBBBBBBBBB.",
    "BBBBBBBBBBBB",
    "BBBBBBBBBBBB",
    "BBBBBBBBBBBB",
    "BBBbbbbbbBBB",
    "BBBbbbbbbBBB",
    "BBBbbbbbbBBB",
    ".BBBBBBBBBB.",
    ".BBB....BBB."],
   ear:[    /* 耳つき */
    ".BB......BB.",
    ".BBB....BBB.",
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
   tail:[   /* しっぽつき */
    "............",
    "...BBBB.....",
    ".BBBBBBBB...",
    "BBBBBBBBBB..",
    "BBBBBBBBBB.B",
    "BBBBBBBBBBBB",
    "BBBBBBBBBBB.",
    "BBbbbbbbBB..",
    "BBbbbbbbBB..",
    ".BbbbbbbB...",
    ".BBBBBBBB...",
    "..BB..BB...."],
   peak:[   /* とんがり */
    ".....BB.....",
    "....BBBB....",
    "...BBBBBB...",
    "..BBBBBBBB..",
    ".BBBBBBBBBB.",
    "BBBBBBBBBBBB",
    "BBBBBBBBBBBB",
    "BBBbbbbbbBBB",
    "BBBbbbbbbBBB",
    ".BBbbbbbbBB.",
    ".BBBBBBBBBB.",
    "..BB....BB.."],
   duo:[    /* ふたご大 */
    "..BBB..BBB..",
    ".BBBBBBBBBB.",
    ".BBBBBBBBBB.",
    ".BBBBBBBBBB.",
    "BBBBBBBBBBBB",
    "BBBBBBBBBBBB",
    "BBBBBBBBBBBB",
    "BBBbbbbbbBBB",
    "BBBbbbbbbBBB",
    "BBBBBBBBBBBB",
    ".BBB....BBB.",
    "............"]
  };
  /* 体型ごとの基準点: ey=目の上の行 lx/rx=目の列 ck=ほっぺの列(左,右) / 小物をずらす量 hy(頭) hx(横) */
  var ANCH={
   round:{ey:5,lx:3,rx:8,ck:[[1,2],[9,10]],hy:0,hx:0},
   twin: {ey:3,lx:4,rx:7,ck:[[2],[9]],hy:0,hx:0},
   tall: {ey:4,lx:4,rx:7,ck:[[3],[8]],hy:0,hx:0},
   wide: {ey:5,lx:3,rx:8,ck:[[1,2],[9,10]],hy:1,hx:0},
   ear:  {ey:5,lx:3,rx:8,ck:[[1,2],[9,10]],hy:0,hx:0},
   tail: {ey:5,lx:2,rx:7,ck:[[0,1],[8,9]],hy:0,hx:-1},
   peak: {ey:5,lx:3,rx:8,ck:[[1,2],[9,10]],hy:0,hx:0},
   duo:  {ey:4,lx:3,rx:8,ck:[[1,2],[9,10]],hy:0,hx:0}
  };
  /* 顔6種(基準点から作る): normal/sleepy/smile(にっこり)/keen(きりっ)/wow(びっくり)/wink */
  function face(body,kind){
    var a=ANCH[body]||ANCH.round, y=a.ey, L=a.lx, R=a.rx, mid=Math.floor((L+R)/2), o=[];
    function cheeks(){ a.ck[0].forEach(function(x){ o.push([y+2,x,"C"]); }); a.ck[1].forEach(function(x){ o.push([y+2,x,"C"]); }); }
    if(kind==="sleepy"){ o.push([y+1,L-1,"K"],[y+1,L,"K"],[y+1,R,"K"],[y+1,R+1,"K"]); cheeks(); }
    else if(kind==="smile"){ o.push([y+1,L,"K"],[y+1,R,"K"],[y+2,mid,"K"],[y+2,mid+1,"K"]); cheeks(); }
    else if(kind==="keen"){ o.push([y,L,"K"],[y+1,L,"K"],[y,R,"K"],[y+1,R,"K"],[y-1,L+1,"K"],[y-1,R-1,"K"]); }
    else if(kind==="wow"){ o.push([y,L,"K"],[y+1,L,"K"],[y,R,"K"],[y+1,R,"K"],[y+2,mid,"R"],[y+2,mid+1,"R"]); cheeks(); }
    else if(kind==="wink"){ o.push([y,L,"K"],[y+1,L,"K"],[y+1,R,"K"],[y+1,R+1,"K"]); cheeks(); }
    else { o.push([y,L,"K"],[y+1,L,"K"],[y,R,"K"],[y+1,R,"K"]); cheeks(); }
    return o;
  }
  var FACE_KINDS=["normal","sleepy","smile","keen","wow","wink"];
  /* --- 顔(体型ごとの座標)。目+ほっぺだけ=いちばん可愛い --- */
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
   glasses:[[5,2,"W"],[6,2,"W"],[5,4,"W"],[6,4,"W"],[5,7,"W"],[6,7,"W"],[5,9,"W"],[6,9,"W"],[5,5,"K"],[5,6,"K"]],
   /* ---- ここから社労士ネタの小物(種類105で使う) ---- */
   hanko:[[7,5,"R"],[7,6,"R"],[8,4,"R"],[8,5,"W"],[8,6,"W"],[8,7,"R"],[9,5,"R"],[9,6,"R"]],
   timecard:[[7,5,"W"],[7,6,"W"],[8,5,"A"],[8,6,"W"],[9,5,"W"],[9,6,"A"],[10,5,"W"],[10,6,"W"]],
   inshi:[[8,7,"G"],[8,8,"G"],[9,7,"W"],[9,8,"G"]],
   payslip:[[8,4,"D"],[8,5,"D"],[8,6,"D"],[8,7,"D"],[9,4,"D"],[9,5,"Y"],[9,6,"Y"],[9,7,"D"]],
   calc:[[8,4,"K"],[8,5,"W"],[8,6,"W"],[8,7,"K"],[9,4,"K"],[9,5,"Y"],[9,6,"R"],[9,7,"K"]],
   stetho:[[7,4,"K"],[8,4,"K"],[9,5,"K"],[9,6,"K"],[8,7,"K"],[7,7,"K"],[10,6,"W"]],
   harness:[[7,3,"O"],[8,4,"O"],[9,5,"O"],[9,3,"O"],[9,4,"O"],[9,6,"O"],[9,7,"O"],[9,8,"O"]],
   armband:[[8,0,"A"],[8,1,"A"],[8,2,"W"],[8,9,"W"],[8,10,"A"],[8,11,"A"]],
   abacus:[[9,3,"D"],[9,4,"R"],[9,5,"D"],[9,6,"R"],[9,7,"D"],[9,8,"R"],[10,3,"D"],[10,4,"D"],[10,5,"D"],[10,6,"D"],[10,7,"D"],[10,8,"D"]],
   clock:[[7,5,"W"],[7,6,"W"],[8,4,"W"],[8,5,"K"],[8,6,"W"],[8,7,"W"],[9,5,"W"],[9,6,"K"]],
   notebook:[[8,7,"K"],[8,8,"K"],[9,7,"K"],[9,8,"Y"],[10,7,"K"],[10,8,"K"]],
   ribbon:[[1,7,"R"],[1,9,"R"],[2,7,"R"],[2,8,"R"],[2,9,"R"]],
   bowtie:[[7,4,"A"],[7,5,"A"],[7,6,"A"],[7,7,"A"],[8,4,"A"],[8,7,"A"]],
   scarf:[[7,3,"A"],[7,4,"A"],[7,5,"A"],[7,6,"A"],[7,7,"A"],[7,8,"A"],[8,8,"A"],[9,8,"A"]],
   mask:[[7,4,"W"],[7,5,"W"],[7,6,"W"],[7,7,"W"],[8,4,"W"],[8,5,"W"],[8,6,"W"],[8,7,"W"]],
   headphone:[[1,3,"K"],[1,4,"K"],[1,5,"K"],[1,6,"K"],[1,7,"K"],[1,8,"K"],[2,2,"K"],[2,9,"K"],[3,1,"A"],[4,1,"A"],[3,10,"A"],[4,10,"A"]],
   flower:[[0,7,"C"],[1,6,"C"],[1,8,"C"],[2,7,"C"],[1,7,"Y"]],
   leaf:[[0,6,"G"],[0,7,"G"],[1,5,"G"],[1,6,"G"]],
   medal:[[7,5,"R"],[7,6,"R"],[8,5,"Y"],[8,6,"Y"],[9,5,"Y"],[9,6,"Y"]],
   badge:[[8,3,"Y"],[8,4,"Y"],[9,3,"Y"],[9,4,"D"]],
   mage:[[0,5,"K"],[0,6,"K"],[0,7,"K"],[1,4,"K"],[1,5,"K"],[1,6,"K"],[1,7,"K"]],
   mawashi:[[9,2,"A"],[9,3,"A"],[9,4,"A"],[9,5,"A"],[9,6,"A"],[9,7,"A"],[9,8,"A"],[9,9,"A"],[10,4,"W"],[10,5,"A"],[10,6,"A"],[10,7,"W"]],
   megaphone:[[7,10,"R"],[8,9,"R"],[8,10,"R"],[9,10,"R"],[7,11,"R"],[8,11,"W"],[9,11,"R"]],
   pencil:[[1,10,"K"],[2,10,"Y"],[3,10,"Y"],[4,10,"Y"]],
   bandaid:[[4,7,"D"],[4,8,"D"],[4,9,"D"]],
   heart:[[8,4,"R"],[8,6,"R"],[9,4,"R"],[9,5,"R"],[9,6,"R"],[10,5,"R"]],
   monocle:[[4,8,"Y"],[5,7,"Y"],[5,9,"Y"],[6,7,"Y"],[6,9,"Y"],[7,8,"Y"],[8,9,"Y"]],
   mustache:[[7,4,"K"],[7,5,"K"],[7,6,"K"],[7,7,"K"],[8,3,"K"],[8,8,"K"]],
   headlamp:[[2,5,"Y"],[2,6,"Y"],[3,3,"K"],[3,4,"K"],[3,5,"K"],[3,6,"K"],[3,7,"K"],[3,8,"K"]]
  };
  var OVER={glasses:1,mask:1,monocle:1,mustache:1,bandaid:1}; /* 顔より後に描くアクセサリ */
  /* 顔の高さに合わせてずらす小物(目の行が基準)。それ以外は 行3以下=頭(hy)、行7以上=おなか */
  var FACEZ={hachimaki:1,glasses:1,fangs:1,beard:1,mask:1,monocle:1,mustache:1,bandaid:1};
  /* --- 模様6種: 本体色(B)の上に重ねる。P=模様の色(本体より濃い) --- */
  var PATTERNS={
   shima:function(y,x,ch){ return (ch==="B"&&(y===2||y===4||y===10))?"P":ch; },                      /* しま */
   buchi:function(y,x,ch){ return (ch==="B"&&((y<=3&&x>=7&&x<=8)||(y>=4&&y<=5&&x<=2)||(y>=9&&x>=8)))?"P":ch; }, /* ぶち */
   hoshi:function(y,x,ch){ return (ch==="B"&&((y===2&&x===5)||(y===3&&x>=4&&x<=6)||(y===4&&x===5)))?"Y":ch; }, /* ほし */
   haramaki:function(y,x,ch){ return ((ch==="B"||ch==="b")&&(y===8||y===9))?"P":ch; },             /* はら巻き */
   mizutama:function(y,x,ch){ return (ch==="B"&&y%2===0&&(x+y)%4===0)?"P":ch; },                    /* 水玉 */
   naname:function(y,x,ch){ return (ch==="B"&&(x+y)%5===0)?"P":ch; }                                /* ななめ */
  };
  D.spriteParts={ bodies:Object.keys(BODIES), faces:FACE_KINDS, accs:Object.keys(ACCS), patterns:Object.keys(PATTERNS) };

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

  /* --- 合成: 体 → 模様 → アクセサリ → 顔 → 上掛けアクセサリ(めがね等) --- */
  function compose(look){
    var bn=BODIES[look.body]?look.body:"round", body=BODIES[bn], an=ANCH[bn];
    var g=[],y,x;
    for(y=0;y<12;y++)g.push(body[y].split(""));
    var pt=PATTERNS[look.pat];
    if(pt){ for(y=0;y<12;y++)for(x=0;x<12;x++)g[y][x]=pt(y,x,g[y][x]); }
    var accs=look.acc||[];
    function put(list,dy,dx){ for(var i=0;i<list.length;i++){ var p=list[i]; if(!p||p.length!==3)continue; var yy=p[0]+(dy||0), xx=p[1]+(dx||0); if(yy>=0&&yy<12&&xx>=0&&xx<12)g[yy][xx]=p[2]; } }
    function acc(name){ var list=ACCS[name]||[]; if(!list.length)return;
      if(FACEZ[name])return put(list,an.ey-5,an.hx);
      var top=12; for(var i=0;i<list.length;i++)top=Math.min(top,list[i][0]);
      put(list,top<=3?an.hy:0,an.hx); }
    for(var i=0;i<accs.length;i++){ if(!OVER[accs[i]])acc(accs[i]); }
    var old=FACES[bn]&&FACES[bn][look.face||"normal"];
    put(old||face(bn,look.face||"normal"));
    for(var j=0;j<accs.length;j++){ if(OVER[accs[j]])acc(accs[j]); }
    return g;
  }
  /* テスト用: 合成したドットの並び(色を除いた形)を1本の文字列で返す */
  MM.pxGrid=function(spId){ var look=D.looks[spId]; if(!look)return ""; return compose(look).map(function(r){ return r.join(""); }).join("/"); };

  /* --- 12×12 → SVG data URI(太い輪郭つき・crispEdges) --- */
  function toSvg(g,look){
    var pal={B:look.c1,b:look.c2,A:look.a||look.c1,X:look.x||"#FFFFFF",P:look.p||look.c1};
    for(var k in FIX)pal[k]=FIX[k];
    var solid=[],y,x;
    for(y=0;y<12;y++){ solid[y]=[]; for(x=0;x<12;x++)solid[y][x]=(g[y][x]!=="."&&pal[g[y][x]])?1:0; }
    var out='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 14 14" shape-rendering="crispEdges">';
    /* 輪郭: シルエットに隣接する空白を1px塗る(かたまり感を出す) */
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
})();
