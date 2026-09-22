"use strict";
/* ============================================================
   machimon/data/garden.js — タネ配合 × 植物街 × 品評会 のデータ
   ★ループ: クイズ正解 → 🪙コイン → 🌰タネガチャ → 花壇に植える → 正解で育つ(水やり)
            → 咲いたら 街が緑になり コインが増える / 配合で もっと強いタネ / 品評会で競う
   ★配合はウイニングポスト式: 系統・ニックス・インブリード・異系の活力・系統の勢い → 爆発力。
   ★時間はボタンで進まない。正解10問 = 1週。解けば解くほど季節が巡り、街もマチモンも植物も育つ。
   ============================================================ */
(function(){
  var G=(typeof window!=="undefined")?window:globalThis;
  var MM=G.MM=G.MM||{}; var D=MM.DATA=MM.DATA||{}; var GD=D.garden={};

  GD.WEEK_NEED=10;          /* 正解何問で1週進むか */
  GD.YEAR_WEEKS=48;         /* 1年=48週(4月始まり) */
  GD.SEASONS=["春","夏","秋","冬"];
  GD.SEASON_ICON=["🌸","🌻","🍁","⛄"];

  /* 能力5種(素質 1..100)。キーは短く(セーブ容量) */
  GD.STATS=[
    {k:"h",name:"花",   icon:"🌺",desc:"美しさ。街の景観と花部門の品評会に効く"},
    {k:"m",name:"実り", icon:"🍎",desc:"咲いている間、クイズ正解のコインが増える"},
    {k:"o",name:"大きさ",icon:"🌳",desc:"巨樹部門の品評会に効く。景観にも少し効く"},
    {k:"j",name:"丈夫さ",icon:"🛡",desc:"咲いていられる期間が長い。インブリードで下がりやすい"},
    {k:"s",name:"成長", icon:"⚡",desc:"芽が出て咲くまでが速い"}
  ];
  GD.TYPES=[
    {name:"早咲き",ramp:0,peak:8, top:1.00,desc:"すぐ咲いて全盛期は短い"},
    {name:"普通",  ramp:2,peak:12,top:1.02,desc:"バランス型"},
    {name:"遅咲き",ramp:6,peak:18,top:1.06,desc:"咲いてから伸び、ピークが高く長い"}
  ];

  /* 科(=科目)。9科 × 子系統。spec=得意能力 */
  GD.families=[
    {id:0,name:"ヒマワリ科",icon:"🌻",sub:0,spec:"o",color:"#F2B31B"},
    {id:1,name:"サボテン科",icon:"🌵",sub:1,spec:"j",color:"#4FA04F"},
    {id:2,name:"アロエ科",  icon:"🪴",sub:2,spec:"j",color:"#3FA37A"},
    {id:3,name:"クローバー科",icon:"🍀",sub:3,spec:"s",color:"#3D9B4F"},
    {id:4,name:"イネ科",    icon:"🌾",sub:4,spec:"m",color:"#C9A13D"},
    {id:5,name:"ハーブ科",  icon:"🌿",sub:5,spec:"m",color:"#3FB0A8"},
    {id:6,name:"サクラ科",  icon:"🌸",sub:6,spec:"h",color:"#E88FB0"},
    {id:7,name:"マツ科",    icon:"🌲",sub:7,spec:"o",color:"#2F7A55"},
    {id:8,name:"バラ科",    icon:"🌹",sub:8,spec:"h",color:"#D8434F"}
  ];
  /* 初期の子系統(系統確立で増えていく)。f=科 spec=得意 */
  GD.lines=[
    {id:"L00",f:0,name:"テイジ系",spec:"o"},{id:"L01",f:0,name:"サンロク系",spec:"h"},{id:"L02",f:0,name:"ユウキュウ系",spec:"s"},
    {id:"L10",f:1,name:"ヘルメット系",spec:"j"},{id:"L11",f:1,name:"アシバ系",spec:"o"},{id:"L12",f:1,name:"エイセイ系",spec:"m"},
    {id:"L20",f:2,name:"ツウキン系",spec:"j"},{id:"L21",f:2,name:"リョウヨウ系",spec:"m"},{id:"L22",f:2,name:"ショウガイ系",spec:"h"},
    {id:"L30",f:3,name:"キホンテアテ系",spec:"s"},{id:"L31",f:3,name:"サイシュウ系",spec:"m"},{id:"L32",f:3,name:"イクキュウ系",spec:"h"},
    {id:"L40",f:4,name:"ガイサン系",spec:"m"},{id:"L41",f:4,name:"メリット系",spec:"o"},{id:"L42",f:4,name:"エンノウ系",spec:"j"},
    {id:"L50",f:5,name:"ヒョウホ系",spec:"m"},{id:"L51",f:5,name:"コウガク系",spec:"h"},{id:"L52",f:5,name:"ショウビョウ系",spec:"j"},
    {id:"L60",f:6,name:"キソ系",spec:"h"},{id:"L61",f:6,name:"フリカエ系",spec:"s"},{id:"L62",f:6,name:"クリサゲ系",spec:"o"},
    {id:"L70",f:7,name:"ニカイダテ系",spec:"o"},{id:"L71",f:7,name:"ホウシュウ系",spec:"m"},{id:"L72",f:7,name:"イゾク系",spec:"j"},
    {id:"L80",f:8,name:"ハクショ系",spec:"h"},{id:"L81",f:8,name:"トウケイ系",spec:"s"},{id:"L82",f:8,name:"ロウケイ系",spec:"o"}
  ];
  /* ニックス(科どうしの相性)。公開ニックス=最初から見える。
     隠しニックス(子系統どうし)はセーブごとに乱数で決まり、配合して初めて判明する */
  GD.NICKS=[[0,6],[1,7],[2,5],[3,4],[6,8],[0,4],[5,8],[1,3],[2,7],[4,6]];
  GD.HIDDEN_NICKS=14;

  /* 配合理論の点数(爆発力) */
  GD.THEORY={ nick:3, hiddenNick:5, hetero:2, lineFix:1, inbreed:3, inbreedMax:2, season:1, lineHot:2, doubleSpec:1 };
  GD.SIGMA=9;               /* ばらつき(同系統の配合は×0.6) */
  GD.MUTATION=0.05;         /* 爆発力10以上で起きる突然変異の確率 */

  /* レアリティ(素質合計) */
  GD.RARITY=[
    {name:"N",  min:0,  color:"#8A8494"},
    {name:"R",  min:250,color:"#3E9B4F"},
    {name:"SR", min:300,color:"#2F6BFF"},
    {name:"SSR",min:350,color:"#B35CFF"},
    {name:"UR", min:400,color:"#F2A516"},
    {name:"LG", min:440,color:"#FF4D6D"}      /* 伝説(ガチャでは出ない。配合だけ) */
  ];

  /* タネガチャ(🪙で引く)。rate は N/R/SR/SSR/UR */
  GD.GACHA={ cost1:500, cost10:4500, rate:[0.55,0.28,0.13,0.035,0.005], pity:50,
    band:[[150,249],[250,299],[300,349],[350,399],[400,430]] };

  /* 施設(コインで拡張) */
  GD.FACILITY={
    plot:  {name:"花壇",     icon:"🪴",desc:"植えられる数が増える",          base:4, per:2, max:12, cost:[0,1500,3000,6000,10000,16000,25000,40000,60000,90000,130000,180000,250000]},
    water: {name:"じょうろ", icon:"🚿",desc:"1正解あたりの成長が増える",      max:5, cost:[0,2000,6000,15000,35000,80000]},
    green: {name:"温室",     icon:"🏡",desc:"咲いていられる期間がのびる",      max:5, cost:[0,3000,9000,22000,50000,110000]},
    lab:   {name:"研究所",   icon:"🔬",desc:"配合で2つタネが取れる確率が上がる", max:5, cost:[0,4000,12000,30000,70000,150000]},
    seedbox:{name:"タネ倉庫",icon:"📦",desc:"持てるタネの数が増える",          base:20,per:10,max:6, cost:[0,1000,3000,8000,20000,45000,90000]}
  };

  /* 植物街ランク(景観スコア) */
  GD.RANKS=[
    {name:"荒れ地",          need:0,     icon:"🟫"},
    {name:"芽吹きの小道",    need:60,    icon:"🌱"},
    {name:"花の路地",        need:200,   icon:"🌼"},
    {name:"ガーデンタウン",  need:500,   icon:"🏡"},
    {name:"フラワーシティ",  need:1000,  icon:"💐"},
    {name:"緑の都",          need:1800,  icon:"🌳"},
    {name:"ボタニカル都市",  need:3000,  icon:"🏙"},
    {name:"花の王国",        need:4800,  icon:"👑"},
    {name:"天空庭園",        need:7200,  icon:"☁️"},
    {name:"世界樹の都",      need:10500, icon:"🌍"},
    {name:"星の楽園",        need:15000, icon:"✨"}
  ];
  GD.RANK_TIX=3;           /* ランクが上がるたびの🎫 */

  /* 名前の部品(タネの品種名) */
  GD.NAME_A=["テイジ","サンロク","ユウキュウ","ワリマシ","キュウケイ","ネンキン","キュウフ","ロウサイ","メリット","ハクショ","ホウシュウ","ヒョウホ",
    "コウガク","イクキュウ","カイゴ","フリカエ","クリサゲ","イゾク","ショウガイ","キソ","アンゼン","エイセイ","サイシュウ","シュウギョウ",
    "ソクテイ","ガイサン","カクテイ","エンノウ","ツウキン","リョウヨウ","シッショウ","ハケン","ロウキ","ホケン","トウケイ","ミライ",
    "ハル","ナツ","アキ","フユ","アサヒ","ツキ","ホシ","ソラ","ニジ","カゼ","ミズ","ヒカリ"];
  GD.NAME_B=["ノヒカリ","オー","スター","ノカゼ","ブレイブ","ハヤテ","サンダー","ドリーム","ノツボミ","ヒメ","プリンセス","キング",
    "クイーン","ノハナ","ボーイ","ガール","エース","マスター","ノミノリ","ジャイアント","ノソラ","ノユメ","ビーナス","ルビー",
    "サファイア","ダイヤ","パール","ノイノリ","チャン","ノモリ","フラワー","ツリー","ブロッサム","ノウタ","レジェンド","ミラクル"];

  /* ライバル園芸家(24組)。lv=腕前(出品する植物の質) */
  GD.rivals=[
    {id:"black",name:"ブラック事務所",   boss:"ザンギョウ社長",lv:62,fam:0,taunt:"花なんか見て何になる。勝つのはうちだ",lose:"ぐぬぬ…次は潰す",win:"はっはっは、所詮その程度か"},
    {id:"white",name:"ホワイト社労士法人",boss:"テイジ所長",  lv:64,fam:6,taunt:"定時で、美しく勝ちます",lose:"お見事。次はこちらが",win:"今日は私たちの日でしたね"},
    {id:"pension",name:"年金ファーム",    boss:"ロウレイ園長",lv:60,fam:7,taunt:"長い目で見れば、うちの松が勝つんじゃよ",lose:"ほっほっほ、やるのう",win:"年の功というやつじゃ"},
    {id:"hw",name:"ハロワ農園",          boss:"キュウフ園主",lv:55,fam:3,taunt:"四つ葉の力、見せてやるぜ！",lose:"給付日数が足りなかった！",win:"再就職手当ゲットだ！"},
    {id:"exam",name:"国家試験ガーデン",   boss:"シケン主任",  lv:70,fam:8,taunt:"合格基準は超えられるかな？",lose:"…合格だ。認めよう",win:"残念、今年は不合格だ"},
    {id:"anzen",name:"安全第一園芸",      boss:"ヘルメ親方",  lv:52,fam:1,taunt:"トゲも丈夫さも一流よ",lose:"ヘルメット脱帽だ",win:"安全確認ヨシ！"},
    {id:"rescue",name:"レスキュー植物園", boss:"キューキュー院長",lv:54,fam:2,taunt:"アロエは万能薬ですよ",lose:"応急手当が要りますね",win:"診断結果、こちらの勝ち"},
    {id:"choshu",name:"徴収ファーム",     boss:"ノウフ課長",  lv:57,fam:4,taunt:"実りは全部、納めてもらう",lose:"延納させてくれ…",win:"確定精算、完了です"},
    {id:"medical",name:"メディカルハーブ園",boss:"ホケンヌ婦長",lv:58,fam:5,taunt:"ハーブの香りで審査員を癒やすわ",lose:"お薬出しておきますね",win:"お大事に〜"},
    {id:"sakura",name:"サクラ保存会",     boss:"キソ会長",    lv:66,fam:6,taunt:"春の主役は、わたくしたち",lose:"散り際も美しく…",win:"満開ですわ"},
    {id:"matsu",name:"厚生マツ林業",      boss:"ニカイ社長",  lv:63,fam:7,taunt:"2階建ての松、見たことあるか",lose:"根元から折れた…",win:"年輪の差だな"},
    {id:"rose",name:"白書ローズガーデン", boss:"トウケイ夫人",lv:68,fam:8,taunt:"統計的に、バラが一番ですの",lose:"データが足りませんでしたわ",win:"有意差、ありですわね"},
    {id:"himawari",name:"ヒマワリ労組",   boss:"サンロク委員長",lv:59,fam:0,taunt:"団結の大輪を咲かせるぞ！",lose:"団体交渉で出直しだ",win:"要求貫徹！"},
    {id:"cactus",name:"砂漠の衛生管理者", boss:"サバク博士",  lv:56,fam:1,taunt:"水なしで咲く根性、あるか？",lose:"干からびた…",win:"乾いた勝利だ"},
    {id:"clover",name:"四つ葉ジョブカフェ",boss:"ヨツバ店長", lv:53,fam:3,taunt:"幸運はうちに味方する",lose:"三つ葉だったか…",win:"ラッキー！"},
    {id:"ine",name:"黄金の田んぼ組合",    boss:"イナホ組合長",lv:61,fam:4,taunt:"実るほど頭を垂れる、それが強さ",lose:"不作の年もある",win:"豊作じゃ！"},
    {id:"herb",name:"高額療養ハーブ研",   boss:"コウガク博士",lv:65,fam:5,taunt:"上限なしの香り、味わいなさい",lose:"自己負担が増えた…",win:"限度額、超えました"},
    {id:"future",name:"未来年金ラボ",     boss:"ミライ所長",  lv:72,fam:7,taunt:"100年先まで設計済みだ",lose:"想定外の数値だ",win:"シミュレーションどおり"},
    {id:"gov",name:"行政タワー緑化課",    boss:"ハクショ課長",lv:67,fam:8,taunt:"前例どおりに勝たせていただく",lose:"前例がない…",win:"通達どおりです"},
    {id:"night",name:"深夜残業ナーセリー",boss:"シンヤ店主",  lv:60,fam:0,taunt:"夜通し水をやった成果を見ろ",lose:"眠い…",win:"徹夜の勝利だ"},
    {id:"haken",name:"ハケン園芸サービス",boss:"ハケン社長",  lv:58,fam:3,taunt:"どこの庭でも咲かせてみせる",lose:"契約満了か…",win:"派遣先で大活躍！"},
    {id:"world1",name:"ロンドン王立協会", boss:"サー・ペンション",lv:80,fam:8,taunt:"Welcome to the real world.",lose:"Splendid...",win:"Jolly good."},
    {id:"world2",name:"パリ花の研究所",   boss:"マダム・ソシアル",lv:82,fam:6,taunt:"Bonjour, 挑戦者さん",lose:"Magnifique...",win:"C'est la vie."},
    {id:"world3",name:"NYボタニカル社",   boss:"ミスター・ベネフィット",lv:84,fam:0,taunt:"Show me what you've got.",lose:"Unbelievable!",win:"That's business."}
  ];
  GD.rivalById=Object.create(null);
  GD.rivals.forEach(function(r){ GD.rivalById[r.id]=r; });

  /* 初期の名木(=ウイポの種牡馬)。配合相手としてコインで花粉を借りられる */
  GD.meiboku=[
    ["テイジノヒカリ","L00",78],["サンロクキング","L01",72],["ユウキュウスター","L02",70],["ワリマシジャイアント","L00",66],
    ["ヘルメットオー","L10",74],["アシバノモリ","L11",68],["エイセイプリンセス","L12",70],["アンゼンエース","L10",64],
    ["ツウキンハヤテ","L20",71],["リョウヨウノハナ","L21",69],["ショウガイビーナス","L22",73],["ロウサイマスター","L20",65],
    ["キホンテアテオー","L30",70],["サイシュウドリーム","L31",74],["イクキュウヒメ","L32",72],["ヨツバミラクル","L30",67],
    ["ガイサンノミノリ","L40",75],["メリットキング","L41",71],["エンノウノソラ","L42",66],["カクテイルビー","L40",69],
    ["ヒョウホクイーン","L50",73],["コウガクダイヤ","L51",76],["ショウビョウノモリ","L52",67],["ハーブノウタ","L50",64],
    ["キソノツボミ","L60",79],["フリカエブロッサム","L61",71],["クリサゲレジェンド","L62",75],["サクラノユメ","L60",68],
    ["ニカイダテツリー","L70",77],["ホウシュウノカゼ","L71",70],["イゾクノイノリ","L72",68],["マツノジャイアント","L70",65],
    ["ハクショローズ","L80",80],["トウケイサファイア","L81",72],["ロウケイパール","L82",70],["バラノクイーン","L80",66]
  ];

  /* ---------- 品評会の暦 ----------
     w=年内の週(1..48) g=1:G1 2:G2 3:G3 4:OP cat=部門(h花/m実/o巨樹/a総合/j耐久) world=世界大会
     名前は社労士ネタの架空大会。出品すると問題(プレゼン)が出る。 */
  var C=[];
  function add(w,g,name,cat,extra){ var o={w:w,g:g,name:name,cat:cat}; if(extra)for(var k in extra)o[k]=extra[k]; C.push(o); }
  /* G1(国内20) */
  add(2,1,"春の労基フラワーカップ","h"); add(6,1,"安全ヶ丘サボテン大賞","j"); add(9,1,"レスキュー湾グランプリ","a"); add(12,1,"桜花基礎年金賞","h",{season:0});
  add(14,1,"ハロワ四つ葉ダービー","a",{rookie:1}); add(17,1,"徴収橋 実りの大典","m"); add(20,1,"メディカルハーブ杯","m"); add(23,1,"真夏のヒマワリ大賞","o",{season:1});
  add(26,1,"厚生年金 巨樹グランプリ","o"); add(28,1,"秋の天皇賞(労働法)","a"); add(30,1,"白書ローズクラシック","h"); add(32,1,"収穫祭ステークス","m",{season:2});
  add(34,1,"ジャパンガーデンカップ","a"); add(36,1,"マイルストーン耐久杯","j"); add(38,1,"年末グランド花博","a"); add(40,1,"冬の常緑グランプリ","j",{season:3});
  add(42,1,"ニューイヤー実り杯","m"); add(44,1,"合格祈願大賞","a"); add(46,1,"フェブラリー花賞","h"); add(47,1,"三月の総決算カップ","a");
  /* 世界G1(12) — 名声が一定以上で出品できる */
  add(8,1,"ドバイ・ワールドガーデン","a",{world:"ドバイ"}); add(11,1,"香港インターナショナル花卉","h",{world:"香港"}); add(15,1,"ロイヤル・チェルシー杯","h",{world:"英国"});
  add(19,1,"ケンタッキー・ボタニカル","o",{world:"米国"}); add(24,1,"アイリッシュ・クローバー大賞","a",{world:"愛国"}); add(27,1,"ベルリン黄金の森賞","o",{world:"独国"});
  add(29,1,"エトワール凱歌賞","a",{world:"仏国"}); add(33,1,"メルボルン大花壇","m",{world:"豪州"}); add(35,1,"ブリーダーズ・ガーデンC","a",{world:"米国"});
  add(39,1,"サウジ・デザートローズ","j",{world:"サウジ"}); add(43,1,"シンガポール・オーキッド","h",{world:"星国"}); add(45,1,"世界樹グランドファイナル","a",{world:"世界"});
  /* G2・G3 は暦に自動で敷き詰める(科目の大会名 × 部門を巡回)。これで重賞は年130本超 */
  var PREF=["労基","安衛","労災","雇用","徴収","健保","国年","厚年","一般"];
  var THEME=[["三六協定","有給","割増","休憩","解雇予告","就業規則"],["安全委員会","健康診断","衛生管理者","作業主任者","ストレスチェック","産業医"],
    ["通勤災害","療養補償","休業補償","障害補償","遺族補償","特別加入"],["基本手当","再就職手当","育児休業給付","教育訓練","高年齢","就職促進"],
    ["概算保険料","確定精算","メリット制","延納","印紙保険料","年度更新"],["標準報酬","高額療養","傷病手当金","出産手当金","任意継続","被扶養者"],
    ["老齢基礎","振替加算","繰下げ","障害基礎","遺族基礎","付加年金"],["在職老齢","報酬比例","加給年金","離婚分割","中高齢寡婦","脱退一時金"],
    ["労働経済","白書","統計","労務管理","社会保険制度","判例"]];
  var SUF2=["記念","カップ"], SUF3=["賞","ステークス","特別","杯"], CATS=["h","m","o","a","j"];
  var used={}; C.forEach(function(x){ used[x.w+"_"+x.g]=1; });
  /* 科目×テーマ54通りを順に使い、周回ごとに接尾辞を変える = 大会名は重複しない */
  function nameOf(i,suf){ var cb=(i*7)%54, s=Math.floor(cb/6), t=cb%6; return PREF[s]+THEME[s][t]+suf[Math.floor(i/54)%suf.length]; }
  var k2=0,k3=0;
  for(var w=1;w<=48;w++){
    if(w%2===0&&!used[w+"_2"]){ C.push({w:w,g:2,name:nameOf(k2,SUF2),cat:CATS[k2%5]}); k2++; }
    if(!used[w+"_3"]){ C.push({w:w,g:3,name:nameOf(k3,SUF3),cat:CATS[(k3+2)%5]}); k3++; }
    if(w%3===0){ C.push({w:w,g:3,name:nameOf(k3,SUF3),cat:CATS[(k3+2)%5]}); k3++; }
  }
  C.forEach(function(x,i){ x.id="c"+i; if(x.w==null)x.w=1; });
  GD.contests=C;
  GD.contestById=Object.create(null); C.forEach(function(x){ GD.contestById[x.id]=x; });
  /* 毎週必ずある一般戦(オープン・新人戦)。重賞に届かない植物の活躍の場 */
  GD.OPEN={ g:4, name:"オープン品評会", cat:"a" };
  GD.ROOKIE={ g:5, name:"新人戦", cat:"a" };

  /* グレード: 賞金🪙・名声・出題数・ライバルの質・出品条件 */
  GD.GRADE={
    1:{label:"G1",color:"#2F6BFF",prize:[5000,2000,1200,800,500],fame:12,n:8,lv:10,req:"重賞1勝 か 通算3勝"},
    2:{label:"G2",color:"#D8534F",prize:[2500,1000,600,400,250],   fame:5, n:6,lv:0, req:"1勝以上"},
    3:{label:"G3",color:"#3E9B4F",prize:[1500,600,400,250,150],    fame:3, n:5,lv:-8,req:"だれでも"},
    4:{label:"OP",color:"#8A6FD1",prize:[700,300,200,120,80],     fame:1, n:4,lv:-16,req:"だれでも"},
    5:{label:"新人",color:"#E08A2E",prize:[400,160,100,60,40],     fame:1, n:3,lv:-24,req:"未勝利のみ"}
  };
  GD.WORLD_FAME=120;        /* 世界大会に出られる名声 */
  GD.ENTRY_MAX=3;           /* 1週に出品できる数 */
  GD.MB_MAX=10;              /* 自家の名木の上限 */
  GD.FIELD=10;              /* 出品数(自分を含む) */
  GD.CAT_W={ /* 部門ごとの能力の重み */
    h:{h:0.62,o:0.10,j:0.10,m:0.08,s:0.10}, m:{m:0.62,h:0.10,o:0.10,j:0.10,s:0.08},
    o:{o:0.62,j:0.14,h:0.10,m:0.08,s:0.06}, j:{j:0.55,o:0.15,h:0.10,m:0.10,s:0.10},
    a:{h:0.24,m:0.20,o:0.20,j:0.18,s:0.18}
  };
  GD.CAT_NAME={h:"花部門",m:"実り部門",o:"巨樹部門",j:"耐久部門",a:"総合部門"};

  /* ---------- 特性(レア能力)。ガチャ・配合でランダムに付く/遺伝する=集めたくなる ---------- */
  GD.TRAITS=[
    {id:"gold",   name:"黄金の実", icon:"💰",rar:2,desc:"実りのコインが2倍"},
    {id:"shiki",  name:"四季咲き", icon:"🌈",rar:2,desc:"どの季節の品評会でも季節ボーナス"},
    {id:"sprout", name:"早熟",     icon:"⚡",rar:1,desc:"咲くまでの成長が40%速い"},
    {id:"phoenix",name:"不死鳥",   icon:"🔥",rar:2,desc:"咲いていられる期間 +12週"},
    {id:"giant",  name:"巨大化",   icon:"🗻",rar:1,desc:"大きさ ×1.15"},
    {id:"rainbow",name:"虹色の花", icon:"🌟",rar:3,desc:"景観 ×2(街評議会に強い)"},
    {id:"lucky",  name:"子宝",     icon:"🍀",rar:1,desc:"配合でタネが2つ取れる確率 +25%"},
    {id:"star",   name:"スター性", icon:"⭐",rar:3,desc:"全能力 ×1.06(品評会の華)"},
    {id:"sage",   name:"賢者の葉", icon:"📜",rar:2,desc:"水やりクイズの成長 +2"},
    {id:"cosmos", name:"宇宙の種", icon:"🪐",rar:4,desc:"全能力 ×1.10・景観 ×1.5(ごくまれ)"}
  ];
  GD.traitById=Object.create(null); GD.TRAITS.forEach(function(t){ GD.traitById[t.id]=t; });
  GD.TRAIT_RATE=[0.02,0.05,0.10,0.20,0.40];  /* ガチャのレア度別 特性が付く確率 */
  GD.TRAIT_INHERIT=0.35;                      /* 親の特性が子に遺伝する確率(親ごと) */
  GD.TRAIT_NEW=0.03;                          /* 配合で新しい特性が芽生える確率(+爆発力×0.4%) */
  GD.SHINY=1/64;                              /* 色違い(景観×1.5・キラキラ) */
  GD.DROP=0.015;                              /* 正解1問ごとの「落としダネ」確率(コンボで上がる) */

  /* ガチャ台。currency: g=コイン medal=評議会メダル */
  GD.BANNERS=[
    {id:"normal", name:"ふつうのタネ",  icon:"🌰",currency:"g",cost1:500,cost10:4500,desc:"いろんな科のタネ。10連はSR以上1つ確定"},
    {id:"pickup", name:"ピックアップ",  icon:"🎯",currency:"g",cost1:600,cost10:5400,desc:"今週の科が70%で出る(毎週かわる)"},
    {id:"season", name:"季節の特性ガチャ",icon:"🌈",currency:"g",cost1:900,cost10:8100,desc:"特性つきのタネが3倍出やすい(季節ごとに特性がかわる)"},
    {id:"council",name:"評議会メダル交換",icon:"🏅",currency:"medal",cost1:10,cost10:30,desc:"1回=SSR以上確定 / 30枚=特性つきUR確定"}
  ];

  /* ---------- 街評議会(季節ごとに街を審査・表彰) ---------- */
  GD.COUNCIL_WEEKS=[12,24,36,48];
  GD.COUNCIL_PRIZE=[
    {name:"大賞",   icon:"🏆",upto:1, medal:10,tix:10,seed:3,statue:1,desc:"黄金像(コイン永続+10%)・特性つきSSR以上のタネ"},
    {name:"金賞",   icon:"🥇",upto:3, medal:5, tix:5, seed:2,desc:"SR以上のタネ・メダル5"},
    {name:"銀賞",   icon:"🥈",upto:6, medal:3, tix:3, seed:1,desc:"R以上のタネ・メダル3"},
    {name:"銅賞",   icon:"🥉",upto:12,medal:1, tix:1, desc:"メダル1"},
    {name:"参加賞", icon:"🎗",upto:99,medal:0, tix:0, desc:"次は入賞を目指そう"}
  ];
  GD.STATUE_MAX=10;      /* 黄金像は最大10体(コイン+100%) */

  /* 年度表彰 */
  GD.AWARDS=[
    {id:"best",name:"年度代表植物",icon:"👑",tix:3,coin:5000},
    {id:"h",name:"最優秀 花部門",icon:"🌺",tix:1,coin:1500},
    {id:"m",name:"最優秀 実り部門",icon:"🍎",tix:1,coin:1500},
    {id:"o",name:"最優秀 巨樹部門",icon:"🌳",tix:1,coin:1500},
    {id:"rookie",name:"最優秀新人",icon:"🌱",tix:1,coin:1500},
    {id:"world",name:"最優秀 世界部門",icon:"🌏",tix:2,coin:3000},
    {id:"lead",name:"リーディング園芸家",icon:"🏆",tix:2,coin:3000},
    {id:"breeder",name:"リーディング名木",icon:"🧬",tix:2,coin:3000}
  ];

  /* 称号(目標)。cond は core/garden.js の titleCheck が評価する */
  GD.TITLES=[
    {id:"plant1",name:"はじめての種まき",desc:"タネを1つ植える",tix:1},
    {id:"bloom1",name:"はじめての開花",desc:"植物を1つ咲かせる",tix:1},
    {id:"breed1",name:"配合デビュー",desc:"はじめて配合する",tix:1},
    {id:"breed50",name:"配合マニア",desc:"配合を50回",tix:3},
    {id:"breed300",name:"配合の鬼",desc:"配合を300回",tix:10},
    {id:"nick",name:"ニックスの発見",desc:"隠しニックスを1つ見つける",tix:2},
    {id:"nick5",name:"血統学者",desc:"隠しニックスを5つ見つける",tix:5},
    {id:"sr",name:"いいタネ",desc:"SR以上のタネを手に入れる",tix:1},
    {id:"ssr",name:"すごいタネ",desc:"SSR以上のタネを手に入れる",tix:2},
    {id:"ur",name:"奇跡のタネ",desc:"URのタネを手に入れる",tix:5},
    {id:"lg",name:"伝説の創造主",desc:"配合で伝説(LG)のタネを生み出す",tix:15},
    {id:"mut",name:"突然変異",desc:"配合で突然変異を起こす",tix:3},
    {id:"win1",name:"初勝利",desc:"品評会で1着",tix:1},
    {id:"g3",name:"重賞ウィナー",desc:"G3で1着",tix:2},
    {id:"g1",name:"G1ガーデナー",desc:"G1で1着",tix:5},
    {id:"g1x10",name:"G1コレクター",desc:"G1を通算10勝",tix:10},
    {id:"world",name:"世界の頂点",desc:"世界G1で1着",tix:10},
    {id:"triple",name:"三冠庭師",desc:"同じ年に花・実り・巨樹のG1を制覇",tix:15},
    {id:"allcat",name:"全部門制覇",desc:"5部門すべてのG1を勝つ",tix:10},
    {id:"best",name:"年度代表",desc:"年度代表植物に選ばれる",tix:5},
    {id:"lead",name:"リーディング園芸家",desc:"年間賞金1位",tix:5},
    {id:"meiboku",name:"名木登録",desc:"自家の植物が名木になる",tix:5},
    {id:"line",name:"系統確立",desc:"自家の名木から新しい系統が生まれる",tix:20},
    {id:"rank3",name:"ガーデンタウン",desc:"植物街ランク「ガーデンタウン」",tix:2},
    {id:"rank6",name:"ボタニカル都市",desc:"植物街ランク「ボタニカル都市」",tix:5},
    {id:"rank10",name:"星の楽園",desc:"植物街ランク最終段",tix:30},
    {id:"fam9",name:"九科の庭",desc:"9科すべてを咲かせる",tix:5},
    {id:"y5",name:"5年目の庭",desc:"5年目を迎える",tix:3},
    {id:"y20",name:"20年目の庭",desc:"20年目を迎える",tix:10},
    {id:"y50",name:"半世紀の庭",desc:"50年目を迎える",tix:30},
    {id:"q1000",name:"水やり1000回",desc:"植物がいる状態で1000問正解",tix:5},
    {id:"q10000",name:"水やり1万回",desc:"植物がいる状態で10000問正解",tix:30},
    {id:"nemesis",name:"宿敵撃破",desc:"宿敵の園芸家に3回勝つ",tix:3},
    {id:"allriv",name:"全園芸家撃破",desc:"24組すべての園芸家に勝つ",tix:10},
    {id:"trait",name:"特性ハンター",desc:"特性つきのタネを手に入れる",tix:1},
    {id:"trait10",name:"特性コレクター",desc:"10種すべての特性を見つける",tix:20},
    {id:"shiny",name:"色違い発見",desc:"色違いのタネを手に入れる",tix:5},
    {id:"council1",name:"評議会デビュー",desc:"街評議会で入賞(銅賞以上)",tix:2},
    {id:"councilG",name:"評議会大賞",desc:"街評議会で大賞",tix:10},
    {id:"statue5",name:"黄金の街",desc:"黄金像を5体",tix:20}
  ];
})();
