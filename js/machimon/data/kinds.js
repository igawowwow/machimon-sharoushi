"use strict";
/* ============================================================
   machimon/data/kinds.js — 種類105(9族×10＋配合限定15)・性格10・タマゴの確率・かけら
   ★レア度は「種類」のもの。同じ種類のなかの強さの差は、個体ごとの才能・性格・特性で付く(core/mon.js)。
   ★id(k001〜k105)は一度決めたら変えない(セーブと図鑑がこの番号を持つ)。足すときは末尾に。
   ★絵は data/sprites.js の部品を1行で組むだけ(体型・顔・小物・模様)。
     見分けの決まり: 族=色の系統 / レア度=小物の数と模様 / 種類=体型と小物の中身。
   ============================================================ */
(function(){
  var G=(typeof window!=="undefined")?window:globalThis;
  var MM=G.MM=G.MM||{}; var D=MM.DATA=MM.DATA||{}; var GD=D.garden;

  /* 能力5つ(保存のキー h/m/o/j/s は旧版のまま。名前と並びだけ新しくする) */
  D.KSTATS=[
    {k:"o",name:"ちから",  icon:"💪"},
    {k:"j",name:"ねばり",  icon:"🛡"},
    {k:"h",name:"いきおい",icon:"🔥"},
    {k:"s",name:"ひらめき",icon:"💡"},
    {k:"m",name:"かしこさ",icon:"📘"}
  ];
  D.kstat=Object.create(null); D.KSTATS.forEach(function(s){ D.kstat[s.k]=s; });
  D.RAR_BASE=[150,175,200,225,250,270];          /* 種類の基礎値の合計(N R SR SSR UR LG) */
  D.LV_MAX=50; D.LV_ADULT=10;                    /* Lv10でおとなの姿になる */
  D.TALENT_MAX=10; D.EF_MAX=100; D.EF_TOTAL=300; /* 才能は能力ごと0〜10 / けいこ値は能力ごと100・合計300まで */
  /* 才能の出やすさ(0〜10)。まん中が出やすく、9・10は めったに出ない(10は約3%)。
     タマゴだけでは才能40以上はほぼ出ない(約0.3%)= 高い才能は配合でねらって作るもの。 */
  D.TALENT_W=[5,7,9,10,11,11,10,9,7,5,3];
  D.XP_NEED=[-90,100];                           /* 次のLvまでの経験 = 100×Lv − 90(Lv1→2は正解1問。Lv50まで約12万=1日15分で約5か月) */

  /* タマゴ(コインだけ・1回ずつ)。rate は N/R/SR/SSR/UR。LGは配合だけ */
  D.RATE2={ cost:300, rate:[0.60,0.30,0.085,0.013,0.002], pity:80, pityRar:3, shiny:1/128, shinyBred:1/32, cap:60 };
  /* 手放すと かけら になる(N R SR SSR UR LG) / かけら交換のねだん */
  D.SHARD=[1,3,10,40,150,300];
  D.SHARD_COST={ ssr:300, ur:1000 };

  /* 性格10: 能力の1つが+10%、別の1つが−10%(2種は増減なし) */
  D.natures=[
    {id:"n0",name:"すなお",       up:"",  dn:""},
    {id:"n1",name:"きまぐれ",     up:"",  dn:""},
    {id:"n2",name:"ちからもち",   up:"o", dn:"m"},
    {id:"n3",name:"がんばりや",   up:"j", dn:"s"},
    {id:"n4",name:"せっかち",     up:"h", dn:"j"},
    {id:"n5",name:"ひらめきや",   up:"s", dn:"o"},
    {id:"n6",name:"ものしり",     up:"m", dn:"h"},
    {id:"n7",name:"やんちゃ",     up:"o", dn:"j"},
    {id:"n8",name:"のんびり",     up:"j", dn:"h"},
    {id:"n9",name:"おちょうしもの",up:"h", dn:"m"}
  ];
  D.natureById=Object.create(null); D.natures.forEach(function(n){ D.natureById[n.id]=n; });

  /* ---------- けいこ(3つから選ぶ。1回10問) ----------
     出る問題と、伸びる けいこ値(能力)が ちがう。経験とコインも けいこ ごとに決まる。
     ef=正解1問で入る けいこ値(小数でたまり、画面には切り捨てた整数で出す)。 */
  D.KEIKO={
    size:10,
    kinds:[
      {id:"new",name:"あたらしい問題",icon:"🆕",stat:"o",coin:10,ef:0.12,none:"ぜんぶ ときおわった"},
      {id:"rev",name:"復習",          icon:"🔁",stat:"j",coin:20,ef:0.12,none:"きょうの復習は おわり"},
      {id:"nig",name:"苦手つぶし",    icon:"🎯",stat:"s",coin:30,ef:0.12,none:"苦手は のこっていない"}
    ],
    other:5,                 /* 期限前の問題をたまたま解いたとき(取組など)のコイン */
    lateDays:7, lateMul:2,   /* 7日以上たまっていた復習は けいこ値が2倍 */
    comboEvery:5, comboEf:0.25,   /* 連続正解5問ごとに いきおい */
    examEf:0.30,             /* 本試験形式(択一・個数・選択式)の正解で かしこさ */
    examEvery:4,             /* 4問に1問は本試験形式 */
    revQuota:30,             /* 「きょうの復習」は多くても30問(たまりすぎた人が配合券をもらえなくならないように) */
    ticketMin:10,            /* 配合券は その日に10問以上といた人だけ */
    keep:0.9                 /* 看板をゆずるとき、けいこ値の9割を引きつぐ(Lvはそのまま引きつぐ) */
  };
  D.keikoById=Object.create(null); D.KEIKO.kinds.forEach(function(k){ D.keikoById[k.id]=k; });
  /* Lvの上限: 9科目それぞれの習熟が 段(5%・12%・20%)をこえるたびに +1。全科目そろって Lv50。
     1科目だけ仕上げても +3 にしかならない = 全科目をまんべんなく進めるのが、いちばん強くなる道。 */
  D.LVCAP={ base:23, steps:[0.05,0.12,0.20] };

  /* ---------- 配合 ---------- */
  D.BREED={
    kindA:0.70, kindB:0.25, kindOther:0.05,     /* 子の種類: おや1 / おや2 / 同じ族の別の種類 */
    hi:0.50, lo:0.25,                           /* 才能(能力ごと): 高いほう50% / 低いほう25% / のこりは ふり直し */
    up:0.05, upHidden:0.10,                     /* 両親が同じ値のときだけ +1(かくれ相性は10%) */
    nature:0.60,                                /* 性格: 親のどちらかを継ぐ */
    trait:0.35, traitNew:0.03,                  /* 特性: 親の特性を1つずつ35%で / まれに新しく芽ばえる */
    only:[0,0,0.25,0.20,0.15,0.10],             /* 配合限定の種類が生まれる確率(レア度ごと。条件がそろったとき) */
    hidden:6                                    /* かくれ相性(セーブごとにちがう族の組)の数 */
  };
  /* 育成どうぐ12種(勉強でしか手に入らない消耗品)。use: b=配合のときに使う / m=なかまに使う。tier: 0=ふつう 1=とっておき */
  D.ITEMS=[
    {id:"ito",    name:"ひきつぎの糸",   icon:"🧵",use:"b",tier:1,desc:"両親の差がいちばん大きい能力を、かならず高いほうから継ぐ"},
    {id:"omamori",name:"性格のおまもり", icon:"🧿",use:"b",tier:1,desc:"おや1の性格を かならず継ぐ"},
    {id:"suzu",   name:"むすびの鈴",     icon:"🔔",use:"b",tier:1,desc:"両親の特性を かならず1つ継ぐ"},
    {id:"futago", name:"ふたごの実",     icon:"🍒",use:"b",tier:1,desc:"2体ためして、才能の高いほうが生まれる"},
    {id:"utsushi",name:"うつしの札",     icon:"🪧",use:"b",tier:1,desc:"子の種類が かならず おや2と同じになる"},
    {id:"kawari", name:"かわりだねの種", icon:"🌱",use:"b",tier:0,desc:"同じ族の「べつの種類」が生まれやすくなる(5%→30%)"},
    {id:"mi",     name:"ふり直しの実",   icon:"🎲",use:"m",tier:1,desc:"いちばん低い才能を1つ ふり直す(下がることもある)"},
    {id:"ishi",   name:"ひらめきの石",   icon:"💎",use:"m",tier:1,desc:"特性を1つ ふやす(2つまで)"},
    {id:"happa",  name:"きがえの葉",     icon:"🍃",use:"m",tier:0,desc:"性格を ふり直す"},
    {id:"wasure", name:"わすれ草",       icon:"🌿",use:"m",tier:0,desc:"いちばん多い けいこ値を0にもどす(ふり直せる)"},
    {id:"cho",    name:"けいこ帳",       icon:"📒",use:"k",tier:0,desc:"つぎの10問、けいこ値が2倍"},
    {id:"mochi",  name:"ちから餅",       icon:"🍡",use:"k",tier:0,desc:"つぎの10問、けいけんが2倍"}
  ];
  D.itemById=Object.create(null); D.ITEMS.forEach(function(t){ D.itemById[t.id]=t; });
  D.ITEM_CAP=99;
  /* ごほうび(育成どうぐ・配合券)。入手は 番付・連続正解の節目・科目の習熟の節目 だけ。
     何が出るかは順番で決まる(乱数なし)。t0=ふつう t1=とっておき bt=配合券 */
  D.GIFT={
    basho:{4:{t0:1},5:{t0:2},6:{t0:2,t1:1},7:{t1:2,bt:1}},     /* 場所の勝ち星ごと */
    promo:{t1:1,bt:1},                                          /* 昇進の一番に勝つ */
    combo:[{n:10,t0:1},{n:20,t1:1}],                            /* その日はじめての 10連続・20連続正解 */
    mastery:{t1:1}                                              /* 科目の習熟が Lv上限の段をこえる */
  };
  /* 最初の1体: 3つのタマゴから1つ選ぶ(どれもN。才能は ふつう〜やや良い) */
  D.STARTERS=["k001","k061","k031"];

  /* ---------- 種類の表 ----------
     1行 = [名前, 型, 体型, 顔, [小物], 模様]。型: o/j/h/s/m=その能力が高い  a=平均型。
     族ごとに10行、レア度は並び順で N N N R R R SR SR SSR UR。 */
  var RAR10=[0,0,0,1,1,1,2,2,3,4];
  var T=[
   /* 0 ザンギョン族(労働基準法) */
   [["テイジン","a","round","normal",["clock"],""],["キュウケイン","j","wide","sleepy",["sprout"],""],["シフトン","s","tall","normal",["timecard"],""],
    ["ワリマシン","o","round","keen",["hachimaki"],""],["サブロクン","m","ear","normal",["notebook"],"shima"],["ユウキュン","h","tail","smile",["flower"],""],
    ["フレックスン","s","peak","wink",["clock","scarf"],"naname"],["カイコヨコクン","j","duo","keen",["tie","hanko"],"haramaki"],
    ["ヘンケイロウドン","o","twin","wow",["headphone","timecard"],"buchi"],["ロウキオウ","a","round","keen",["crown","mustache","medal"],"hoshi"]],
   /* 1 ヘルメン族(労働安全衛生法) */
   [["ヘルメッチ","j","round","normal",["helmet"],""],["アシバン","o","tall","normal",["harness"],""],["ヨシヨシ","h","ear","smile",["armband"],""],
    ["エイセイン","m","round","normal",["mask"],""],["ケンシンヌ","s","wide","normal",["stetho"],"mizutama"],["サギョシュ","o","peak","keen",["helmet","badge"],""],
    ["サンギョイ","m","tail","normal",["glasses","stetho"],"shima"],["ストレスチェッカ","s","duo","wow",["headlamp","notebook"],"naname"],
    ["アンゼンタイショウ","j","twin","keen",["helmet","harness"],"hoshi"],["ゼロサイオウ","j","round","smile",["crown","harness","star"],"buchi"]],
   /* 2 キューキュー族(労災保険法) */
   [["ツウキン","s","round","normal",["cap"],""],["バンソコ","j","ear","normal",["bandaid"],""],["タンカン","o","wide","sleepy",["cross"],""],
    ["リョウヨン","j","round","sleepy",["nursecap"],""],["キュウギョン","m","tall","sleepy",["mask","heart"],""],["ショウガイン","h","tail","keen",["bandaid","scarf"],""],
    ["イゾクン","h","peak","smile",["halo","heart"],"mizutama"],["トクベツカニュ","o","duo","normal",["helmet","cross"],"shima"],
    ["カイゴホショウ","j","twin","smile",["nursecap","stetho"],"naname"],["ロウサイシン","a","ear","keen",["crown","cross","horns"],"hoshi"]],
   /* 3 リショクン族(雇用保険法) */
   [["リショクン","s","round","sleepy",["tie"],""],["キュウショクン","h","tall","normal",["notebook"],""],["ニンテイビ","m","ear","wink",["clock"],""],
    ["キホンテアテ","m","round","smile",["coin"],""],["サイシュン","s","tail","keen",["bowtie"],""],["イクキュン","j","wide","smile",["ribbon"],""],
    ["キョウイクン","m","peak","normal",["glasses","book"],"shima"],["コウネンレイ","j","round","sleepy",["beard","tie"],"haramaki"],
    ["ハロワマスター","s","duo","keen",["cap","megaphone"],"naname"],["コヨウテイオウ","a","twin","keen",["crownT","bowtie","star"],"buchi"]],
   /* 4 ノウフー族(労働保険徴収法) */
   [["ノウフー","m","round","normal",["coin"],""],["ガイサン","o","wide","normal",["calc"],""],["インシ","h","tall","wink",["inshi"],""],
    ["カクテイン","m","ear","keen",["abacus"],""],["エンノウン","j","round","sleepy",["payslip"],""],["メリットン","s","peak","smile",["medal"],""],
    ["コウシンヌ","m","tail","normal",["glasses","calc"],"mizutama"],["イッカツユウキ","o","duo","wow",["payslip","hachimaki"],"shima"],
    ["ロウホジムクミ","m","twin","smile",["cap","abacus"],"haramaki"],["チョウシュウオウ","m","round","keen",["crown","monocle","coin"],"naname"]],
   /* 5 ホケンヌ族(健康保険法) */
   [["ホケンヌ","m","round","smile",["nursecap"],""],["ヒフヨウ","h","ear","normal",["heart"],""],["ホケンショ","j","tall","normal",["badge"],""],
    ["ヒョウホウ","m","wide","keen",["payslip"],""],["ショウテン","j","round","sleepy",["bandaid","mask"],""],["シュッサン","h","tail","smile",["ribbon","heart"],""],
    ["コウガクリョウ","m","peak","wow",["stetho","coin"],"buchi"],["ニンケイ","s","duo","normal",["tie","notebook"],"shima"],
    ["キョウカイケンポ","j","twin","keen",["nursecap","cross"],"mizutama"],["ケンポジョオウ","h","round","wink",["crown","flower","scarf"],"hoshi"]],
   /* 6 キソネン族(国民年金法) */
   [["キソネン","h","round","sleepy",["leaf"],""],["ダイイチゴウ","o","tall","keen",["hachimaki"],""],["メンジョ","j","wide","sleepy",["scarf"],""],
    ["フリカエ","h","ear","smile",["flower"],""],["クリサゲ","j","round","normal",["beard"],""],["クリアゲ","s","peak","wink",["antenna"],""],
    ["フカネン","m","tail","normal",["coin","bowtie"],"naname"],["ショウガイキソ","j","duo","smile",["bandaid","medal"],"haramaki"],
    ["マクロスライド","s","twin","wow",["antenna","glasses"],"shima"],["コクネンタイジュ","h","round","sleepy",["crown","beard","leaf"],"buchi"]],
   /* 7 コウネン族(厚生年金保険法) */
   [["コウネン","o","twin","normal",["badge"],""],["ニカイダテ","j","duo","normal",["antenna"],""],["ヒョウゲツ","m","round","wink",["payslip"],""],
    ["ザイロウ","o","wide","keen",["tie"],""],["カキュウ","h","ear","smile",["heart"],""],["ヒレイン","m","tall","normal",["glasses"],""],
    ["ブンカツン","s","tail","wow",["scarf","hanko"],"buchi"],["チュウコウカフ","j","peak","sleepy",["ribbon","beard"],"mizutama"],
    ["ロウコウマスター","o","round","keen",["mage","mawashi"],"naname"],["コウネンコウテイ","o","twin","keen",["crownT","medal","armband"],"hoshi"]],
   /* 8 トウケイン族(労一・社一) */
   [["トウケイン","h","round","normal",["glasses"],""],["ハクショ","m","wide","normal",["book"],""],["グラフン","s","tall","wow",["pencil"],""],
    ["ロウケイ","o","ear","keen",["megaphone"],""],["シャイチ","j","round","smile",["notebook"],""],["ハンレイ","m","peak","sleepy",["monocle"],""],
    ["ロウムカンリ","h","tail","normal",["glasses","tie"],"shima"],["シャロウシホウ","m","duo","keen",["book","badge"],"haramaki"],
    ["ハクショマスター","s","twin","wink",["antenna","pencil"],"mizutama"],["トウケイセンニン","a","round","sleepy",["halo","beard","glasses"],"naname"]]
  ];
  /* 配合限定15: [名前, レア度, 型, 体型, 顔, [小物], 模様, [族A,族B], 親に要るレア度(両方これ以上)]。族は族Aのもの */
  var ONLY=[
   ["ロウロウコンビ",  2,"a","duo","smile",["helmet","tie"],"mizutama",[0,1],1],
   ["ネンキンツイン",  2,"h","twin","smile",["coin","ribbon"],"hoshi",[6,7],1],
   ["ホケンダブル",    2,"j","ear","wink",["cross","heart"],"naname",[2,5],1],
   ["ハロワチョウシュ",3,"m","peak","keen",["cap","calc"],"buchi",[3,4],2],
   ["ハクショネンキン",3,"h","tail","keen",["glasses","flower"],"haramaki",[6,8],2],
   ["ケンポトウケイ",  3,"s","wide","wow",["monocle","stetho"],"shima",[5,8],2],
   ["ロウキチョウシュ",4,"o","round","keen",["crown","abacus","armband"],"shima",[0,4],3],
   ["アンゼンコウネン",4,"j","duo","keen",["crown","harness","medal"],"naname",[1,7],3],
   ["コヨウアンエイ",  4,"s","ear","smile",["crown","megaphone","scarf"],"mizutama",[1,3],3],
   ["ノレンモリ",      5,"a","round","keen",["mage","mawashi","halo"],"hoshi",[0,6],4],
   ["ドヒョウヌシ",    5,"o","wide","keen",["mage","mawashi","hachimaki"],"buchi",[2,7],4],
   ["ハナミチ",        5,"h","tail","smile",["mage","mawashi","flower"],"naname",[4,6],4],
   ["センシュウラク",  5,"m","duo","wink",["mage","mawashi","medal"],"shima",[5,8],4],
   ["オオイチョウ",    5,"j","peak","sleepy",["mage","mawashi","beard"],"mizutama",[1,7],4],
   ["ムスビノイチバン",5,"s","twin","keen",["crownT","mawashi","star"],"hoshi",[3,4],4]
  ];

  /* ---------- 色: 族の色を、種類ごとに明るさを変えて使う ---------- */
  function rgb(h){ h=h.replace("#",""); return [parseInt(h.slice(0,2),16),parseInt(h.slice(2,4),16),parseInt(h.slice(4,6),16)]; }
  function hex(a){ return "#"+a.map(function(v){ v=Math.max(0,Math.min(255,Math.round(v))); return (v<16?"0":"")+v.toString(16).toUpperCase(); }).join(""); }
  function mix(c,to,t){ var a=rgb(c), b=rgb(to); return hex([a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t]); }
  var TONE=[0.46,0.30,0.38,0.18,0.24,0.08,0.02,0.12,-0.14,-0.24];       /* +は白へ、−は黒へ */
  var ACCENT=["#E8484F","#5B8DFF","#FFD34D","#3E9B4F","#FF8A3D","#8A6FD1","#33303E","#E85A9A","#2EA89A","#C58900"];
  var LGPAL=[["#FFF6D8","#FFFFFF","#C58900","#FFD34D"],["#4A4560","#D8D0F0","#E8484F","#33303E"],["#FFC1D6","#FFF2F7","#8A6FD1","#FF8FB8"],
             ["#BFE8E0","#FFFFFF","#2B6FC8","#7FD0CC"],["#D9C59A","#FFF6E5","#2E8055","#B59A62"],["#2F3A6B","#C3D4FF","#FFD34D","#1E2748"]];
  function lookOf(f,idx,rar,row,lgi){
    var body=row[0], fc=row[1], acc=row[2], pat=row[3], fam=GD.families[f], t=TONE[idx%10], c1,c2,a,p;
    if(rar>=5){ var L=LGPAL[lgi%LGPAL.length]; c1=L[0]; c2=L[1]; a=L[2]; p=L[3]; }
    else { c1=t>=0?mix(fam.color,"#FFFFFF",t):mix(fam.color,"#1E1B2A",-t); c2=rar>=4?"#FFE9A8":mix(c1,"#FFFFFF",0.68); a=ACCENT[(f*3+idx)%ACCENT.length]; p=mix(c1,"#1E1B2A",0.24); }
    var look={body:body,face:fc,acc:acc.slice(),c1:c1,c2:c2,a:a,p:p,x:(f===2||f===5)?"#FFFFFF":"#E8484F"};
    if(pat)look.pat=pat;
    return look;
  }
  /* 型 → 基礎値の配分(合計は必ずレア度の基礎値に一致) */
  var KEYS=["h","m","o","j","s"];
  function baseOf(type,famSpec,total,salt){
    var w={}, tot=0, out={}, sum=0;
    KEYS.forEach(function(k,i){ w[k]=1+(k===type?0.6:0)+(k===famSpec?0.2:0)+(((salt*7+i*13)%9)-4)*0.02; tot+=w[k]; });
    KEYS.forEach(function(k){ out[k]=Math.floor(total*w[k]/tot); sum+=out[k]; });
    var top=type==="a"?famSpec:type; out[top]+=total-sum;
    return out;
  }

  var K=[], n=0;
  T.forEach(function(rows,f){ rows.forEach(function(r,i){ n++;
    var rar=RAR10[i], id="k"+("00"+n).slice(-3);
    K.push({ id:id, f:f, rar:rar, name:r[0], type:r[1], base:baseOf(r[1],GD.families[f].spec,D.RAR_BASE[rar],n), look:lookOf(f,i,rar,r.slice(2)), only:null }); }); });
  var lg=0;
  ONLY.forEach(function(r){ n++;
    var id="k"+("00"+n).slice(-3), f=r[7][0], rar=r[1];
    K.push({ id:id, f:f, rar:rar, name:r[0], type:r[2], base:baseOf(r[2],GD.families[f].spec,D.RAR_BASE[rar],n), look:lookOf(f,(n*3)%10,rar,r.slice(3,7),lg), only:{fams:r[7],need:r[8]} });
    if(rar>=5)lg++; });
  D.kinds=K;
  D.kindById=Object.create(null);
  D.kindsByRar=[[],[],[],[],[],[]];        /* タマゴから出る種類(配合限定を除く) */
  K.forEach(function(k){ D.kindById[k.id]=k; if(!k.only)D.kindsByRar[k.rar].push(k);
    /* 絵を登録: おとな=そのまま / こども(id+"c")=小物なし */
    D.looks[k.id]=k.look;
    var ch={}; for(var x in k.look)ch[x]=k.look[x]; ch.acc=[]; D.looks[k.id+"c"]=ch; });
})();
