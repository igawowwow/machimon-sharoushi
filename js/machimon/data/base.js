"use strict";
/* ============================================================
   machimon/data/base.js — 土台のデータ: 9つの族(=9科目)・族の相性・レア度の名前と色・ライバル24組
   ★族の並び(id 0〜8)は科目の並びと同じ。セーブと図鑑がこの番号を持つので変えない。
   ★ライバルの名前・親方・せりふは、番付(data/banzuke.js)と物語(data/story.js)が使う。
   ============================================================ */
(function(){
  var G=(typeof window!=="undefined")?window:globalThis;
  var MM=G.MM=G.MM||{}; var D=MM.DATA=MM.DATA||{}; var GD=D.garden={};

  /* 族(=科目)。spec=その族が得意な能力(h いきおい / m かしこさ / o ちから / j ねばり / s ひらめき) */
  GD.families=[
    {id:0,name:"ザンギョン族",icon:"⏰",sub:0,spec:"o",color:"#E8A33D"},
    {id:1,name:"ヘルメン族",  icon:"⛑",sub:1,spec:"j",color:"#4FA04F"},
    {id:2,name:"キューキュー族",icon:"🚑",sub:2,spec:"j",color:"#D8534F"},
    {id:3,name:"リショクン族",icon:"📄",sub:3,spec:"s",color:"#3D8FD8"},
    {id:4,name:"ノウフー族",  icon:"💴",sub:4,spec:"m",color:"#8A6FD8"},
    {id:5,name:"ホケンヌ族",  icon:"🏥",sub:5,spec:"m",color:"#3FB0A8"},
    {id:6,name:"キソネン族",  icon:"🏠",sub:6,spec:"h",color:"#C98FB0"},
    {id:7,name:"コウネン族",  icon:"🏢",sub:7,spec:"o",color:"#5B6FD8"},
    {id:8,name:"トウケイン族",icon:"📊",sub:8,spec:"h",color:"#8F8F8F"}
  ];
  /* 族の相性(配合で、高いほうの才能を継ぎやすい組)。最初から見える。
     かくれ相性はセーブごとに決まり、配合してはじめて分かる(core/mon.js) */
  GD.NICKS=[[0,6],[1,7],[2,5],[3,4],[6,8],[0,4],[5,8],[1,3],[2,7],[4,6]];

  /* レア度(種類のもの)。LG は配合でしか生まれない */
  GD.RARITY=[
    {name:"N",  color:"#8A8494"},
    {name:"R",  color:"#3E9B4F"},
    {name:"SR", color:"#2F6BFF"},
    {name:"SSR",color:"#B35CFF"},
    {name:"UR", color:"#F2A516"},
    {name:"LG", color:"#FF4D6D"}
  ];

  /* ライバル(24組)。lv=腕前(番付での並び順に使う) */
  GD.rivals=[
    {id:"black",name:"ブラック事務所",   boss:"ザンギョウ社長",lv:62,fam:0,taunt:"勉強なんかして何になる。勝つのはうちだ",lose:"ぐぬぬ…次は潰す",win:"はっはっは、所詮その程度か"},
    {id:"white",name:"ホワイト社労士法人",boss:"テイジ所長",  lv:64,fam:6,taunt:"定時で、美しく勝ちます",lose:"お見事。次はこちらが",win:"今日は私たちの日でしたね"},
    {id:"pension",name:"年金ファーム",    boss:"ロウレイ園長",lv:60,fam:7,taunt:"長い目で見れば、うちの子が勝つんじゃよ",lose:"ほっほっほ、やるのう",win:"年の功というやつじゃ"},
    {id:"hw",name:"ハロワ牧場",          boss:"キュウフ園主",lv:55,fam:3,taunt:"失業知らずの力、見せてやるぜ！",lose:"給付日数が足りなかった！",win:"再就職手当ゲットだ！"},
    {id:"exam",name:"国家試験ハウス",   boss:"シケン主任",  lv:70,fam:8,taunt:"基準点は超えられるかな？",lose:"…お見事だ。認めよう",win:"残念、出直しだな"},
    {id:"anzen",name:"安全第一ファーム",      boss:"ヘルメ親方",  lv:52,fam:1,taunt:"丈夫さなら一流よ",lose:"ヘルメット脱帽だ",win:"安全確認ヨシ！"},
    {id:"rescue",name:"レスキュー牧場", boss:"キューキュー院長",lv:54,fam:2,taunt:"うちの子は回復が早いですよ",lose:"応急手当が要りますね",win:"診断結果、こちらの勝ち"},
    {id:"choshu",name:"徴収ファーム",     boss:"ノウフ課長",  lv:57,fam:4,taunt:"稼ぎは全部、納めてもらう",lose:"延納させてくれ…",win:"確定精算、完了です"},
    {id:"medical",name:"メディカル牧場",boss:"ホケンヌ婦長",lv:58,fam:5,taunt:"うちの子で審査員を癒やすわ",lose:"お薬出しておきますね",win:"お大事に〜"},
    {id:"sakura",name:"キソネン保存会",     boss:"キソ会長",    lv:66,fam:6,taunt:"年金の主役は、わたくしたち",lose:"引き際も美しく…",win:"満点ですわ"},
    {id:"matsu",name:"厚生年金ランチ",      boss:"ニカイ社長",  lv:63,fam:7,taunt:"2階建ての実力、見たことあるか",lose:"土台から崩れた…",win:"年季の差だな"},
    {id:"rose",name:"白書ハウス", boss:"トウケイ夫人",lv:68,fam:8,taunt:"統計的に、うちが一番ですの",lose:"データが足りませんでしたわ",win:"有意差、ありですわね"},
    {id:"himawari",name:"残業労組",   boss:"サンロク委員長",lv:59,fam:0,taunt:"団結の力を見せるぞ！",lose:"団体交渉で出直しだ",win:"要求貫徹！"},
    {id:"cactus",name:"砂漠の衛生牧場", boss:"サバク博士",  lv:56,fam:1,taunt:"水なしで働く根性、あるか？",lose:"干からびた…",win:"乾いた勝利だ"},
    {id:"clover",name:"ジョブカフェ牧場",boss:"ヨツバ店長", lv:53,fam:3,taunt:"幸運はうちに味方する",lose:"運が足りなかったか…",win:"ラッキー！"},
    {id:"ine",name:"黄金の徴収組合",    boss:"イナホ組合長",lv:61,fam:4,taunt:"納めるほど強くなる、それがうちだ",lose:"不作の年もある",win:"大漁じゃ！"},
    {id:"herb",name:"高額療養ラボ",   boss:"コウガク博士",lv:65,fam:5,taunt:"上限なしの実力、味わいなさい",lose:"自己負担が増えた…",win:"限度額、超えました"},
    {id:"future",name:"未来年金ラボ",     boss:"ミライ所長",  lv:72,fam:7,taunt:"100年先まで設計済みだ",lose:"想定外の数値だ",win:"シミュレーションどおり"},
    {id:"gov",name:"行政タワー育成課",    boss:"ハクショ課長",lv:67,fam:8,taunt:"前例どおりに勝たせていただく",lose:"前例がない…",win:"通達どおりです"},
    {id:"night",name:"深夜残業ファーム",boss:"シンヤ店主",  lv:60,fam:0,taunt:"夜通し育てた成果を見ろ",lose:"眠い…",win:"徹夜の勝利だ"},
    {id:"haken",name:"ハケン育成サービス",boss:"ハケン社長",  lv:58,fam:3,taunt:"どこの現場でも活躍させる",lose:"契約満了か…",win:"派遣先で大活躍！"},
    {id:"world1",name:"ロンドン王立協会", boss:"サー・ペンション",lv:80,fam:8,taunt:"Welcome to the real world.",lose:"Splendid...",win:"Jolly good."},
    {id:"world2",name:"パリ育成研究所",   boss:"マダム・ソシアル",lv:82,fam:6,taunt:"Bonjour, 挑戦者さん",lose:"Magnifique...",win:"C'est la vie."},
    {id:"world3",name:"NYマチモン社",   boss:"ミスター・ベネフィット",lv:84,fam:0,taunt:"Show me what you've got.",lose:"Unbelievable!",win:"That's business."}
  ];
  GD.rivalById=Object.create(null);
  GD.rivals.forEach(function(r){ GD.rivalById[r.id]=r; });
})();
