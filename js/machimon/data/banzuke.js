"use strict";
/* ============================================================
   machimon/data/banzuke.js — 番付60枚・8段と、五番勝負の決まり
   ★相手は決め打ち(乱数で作らない)。だれが遊んでも同じ相手・同じ強さ=攻略を語れる。
   ★相手は今のライバル24組(名前・親方・せりふは data/garden.js の GD.rivals をそのまま使う)。
     段の入口(関門)は親方の看板マチモンが守る。頂点は「いまの横綱」。
   ★つよさの値は ANCHOR の8行だけで決まる(段のいちばん下〜いちばん上)。つり合わせはここを直す。
   ============================================================ */
(function(){
  var G=(typeof window!=="undefined")?window:globalThis;
  var MM=G.MM=G.MM||{}; var D=MM.DATA=MM.DATA||{}; var GD=D.garden;

  /* 8段。top=その段のいちばん上の枚数 bot=いちばん下(60枚目がいちばん下、1枚目が横綱) */
  D.DAN=[
    {id:0,name:"序ノ口",top:56,bot:60,icon:"🌱"},
    {id:1,name:"序二段",top:51,bot:55,icon:"🌿"},
    {id:2,name:"三段目",top:45,bot:50,icon:"🪵"},
    {id:3,name:"幕下",  top:33,bot:44,icon:"🎋"},
    {id:4,name:"十両",  top:23,bot:32,icon:"🏮"},
    {id:5,name:"前頭",  top:9, bot:22,icon:"🎏"},
    {id:6,name:"三役",  top:2, bot:8, icon:"🏵"},
    {id:7,name:"横綱",  top:1, bot:1, icon:"👑"}
  ];
  /* 五番勝負と場所の決まり */
  D.BASHO={
    bouts:7, perDay:2,                 /* 7番で1場所・1日2番まで */
    perDayLow:4, lowFrom:51,           /* 序ノ口・序二段(51枚目から下)と番付の外では1日4番 */
    up:{4:1,5:2,6:3,7:5}, down:1,      /* 4勝+1 5勝+2 6勝+3 全勝+5 / 3勝以下は1枚さがる */
    rounds:5, need:3,                  /* 能力5つを1つずつ・3本とれば勝ち */
    foe:0.85,                          /* 相手は決まった能力×0.85を出す(運なし) */
    hit:1.0, fast:1.1, fastMs:8000, miss:0.5,   /* 正解=そのまま / 8秒以内の正解=×1.1 / 不正解=×0.5 */
    order:["o","j","h","s","m"],       /* ちから→ねばり→いきおい→ひらめき→かしこさ */
    exam:2,                            /* 5問のうち本試験形式の数(あとの2本) */
    start:61                           /* はじめは番付の外(60枚目の下) */
  };
  /* 段ごとの相手のつよさ [いちばん下, いちばん上] */
  var ANCHOR=[[120,170],[200,300],[340,500],[540,880],[890,980],[1010,1250],[1300,1420],[1500,1500]];
  /* 段ごとの相手のレア度(種類を選ぶときの目安) */
  var DAN_RAR=[[0],[0,1],[1],[1,2],[2],[2,3],[3,4],[4]];
  /* 関門(段の入口)を守る親方。横綱は特別な相手 */
  var GATE={55:"anzen",50:"hw",44:"black",32:"white",22:"pension",8:"exam"};
  D.YOKOZUNA={id:"yokozuna",name:"番付の頂点",boss:"いまの横綱",lv:99,fam:6,
    taunt:"ここまで来たか。さあ、見せてくれ",lose:"見事だ。きょうからは、きみが横綱だ",win:"まだ、ゆずれない"};
  D.bzRival=function(id){ return id==="yokozuna"?D.YOKOZUNA:(GD.rivalById[id]||GD.rivals[0]); };

  function danOf(pos){ for(var i=0;i<D.DAN.length;i++)if(pos<=D.DAN[i].bot&&pos>=D.DAN[i].top)return D.DAN[i]; return D.DAN[0]; }
  D.danOf=danOf;
  function powerAt(pos){ var d=danOf(pos), a=ANCHOR[d.id], n=d.bot-d.top; return Math.round(n?a[0]+(a[1]-a[0])*(d.bot-pos)/n:a[0]); }
  function kindFor(fam,dan,pos){
    var rs=DAN_RAR[dan], rar=rs[pos%rs.length];
    var pool=D.kinds.filter(function(k){ return !k.only&&k.f===fam&&k.rar===rar; });
    return pool[pos%pool.length];
  }
  /* 相手の能力は、種類の配分を7割がた ならして使う(つよさ の数字どおりに勝ち負けが付きやすいように) */
  var FLAT=0.7;
  function statsOf(kd,power){
    var K=["h","m","o","j","s"], tot=0, o={}, sum=0, top=K[0];
    K.forEach(function(k){ tot+=kd.base[k]; if(kd.base[k]>kd.base[top])top=k; });
    K.forEach(function(k){ o[k]=Math.floor(power*(FLAT*0.2+(1-FLAT)*kd.base[k]/tot)); sum+=o[k]; });
    o[top]+=power-sum; return o;
  }
  /* 関門でない枠を、ライバルを腕前(lv)の低い順に 先鋒→大将→切り札 でうめる */
  var ents=[];
  GD.rivals.forEach(function(rv,i){ ents.push({rv:rv.id,role:"先鋒",key:rv.lv*10+i}); ents.push({rv:rv.id,role:"大将",key:rv.lv*10+60+i}); });
  GD.rivals.slice().sort(function(a,b){ return b.lv-a.lv; }).slice(0,5).forEach(function(rv,i){ ents.push({rv:rv.id,role:"切り札",key:rv.lv*10+100+i}); });
  ents.sort(function(a,b){ return a.key-b.key; });
  var B=[], ei=0;
  for(var pos=60;pos>=1;pos--){
    var dan=danOf(pos), e, gate=false;
    if(pos===1){ e={rv:"yokozuna",role:"横綱"}; gate=true; }
    else if(GATE[pos]){ e={rv:GATE[pos],role:"看板"}; gate=true; }
    else e=ents[ei++];
    var rv=D.bzRival(e.rv), kd=pos===1?D.kindById.k100:kindFor(rv.fam,dan.id,pos), pw=powerAt(pos);
    B.push({ pos:pos, dan:dan.id, rival:e.rv, role:e.role, gate:gate, kind:kd.id, name:kd.name, power:pw, stats:statsOf(kd,pw), tr:[] });
  }
  B.sort(function(a,b){ return a.pos-b.pos; });
  D.banzuke=B;
  D.bzAt=function(pos){ return B[pos-1]||null; };
})();
