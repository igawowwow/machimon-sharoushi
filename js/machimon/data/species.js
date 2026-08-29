"use strict";
/* ============================================================
   machimon/data/species.js — マチモン30体・進化系統(データ駆動)
   ここに1行足すだけでマチモンが増える。ロジックは一切持たない。
   id は恒久(セーブ互換のため変更・使い回し禁止)。
   sub: 科目index(0..8) / -1=全科目(街ライン)
   rar: 0=N 1=R 2=SR 3=SSR 4=UR ※レアリティは街の生産力と演出のみに効き、
        学習効率(出題・報酬倍率・知識エネルギー)には一切影響しない。
   evo: 進化条件 {to,lv,correct(その科目の正解数),mastery(習熟度0..1),ke}
   ============================================================ */
(function(){
  var G=(typeof window!=="undefined")?window:globalThis;
  var MM=G.MM=G.MM||{}; var D=MM.DATA=MM.DATA||{};

  /* prod=毎時の基礎生産力。fit=配置適性(建物のslotType) */
  D.species=[
  /* --- 街ライン(スターター・全科目適性) --- */
  {id:"m01",name:"マチノコ",sub:-1,stage:1,rar:0,type:"街",nature:"げんき",job:"事務",fit:["work","live"],prod:6,
   skill:"はじまりの一歩",life:{m:"マチノコが街の広場を掃除している",n:"マチノコが道案内をしている",e:"マチノコが今日の出来事を日記に書いている"},
   evo:{to:"m02",lv:10,correct:80,mastery:0,ke:0,note:"総正解80"}},
  {id:"m02",name:"マチスケ",sub:-1,stage:2,rar:2,type:"街",nature:"げんき",job:"事務",fit:["work","live"],prod:18,
   skill:"街の顔",life:{m:"マチスケが住民に挨拶して回っている",n:"マチスケが建設現場を見回っている",e:"マチスケが街の明かりを数えている"},
   evo:{to:"m03",lv:25,correct:400,mastery:0,ke:0,allSub:0.20,note:"総正解400・全科目20%以上"}},
  {id:"m03",name:"マチオー",sub:-1,stage:3,rar:4,type:"街",nature:"げんき",job:"事務",fit:["work","live"],prod:50,
   skill:"街をつくる者",life:{m:"マチオーが街の未来図を広げている",n:"マチオーが全エリアを見渡している",e:"マチオーが静かに街を見守っている"},evo:null},

  /* --- 労働基準法(残業横丁) --- */
  {id:"m04",name:"ザンギョン",sub:0,stage:1,rar:0,type:"労",nature:"のんびり",job:"事務",fit:["work"],prod:6,
   skill:"残業耐性",life:{m:"ザンギョンが今日こそ定時で帰ると宣言している",n:"ザンギョンがタイムカードを眺めている",e:"ザンギョンがまだ会社にいる"},
   evo:{to:"m05",lv:12,correct:40,mastery:0.30,ke:0}},
  {id:"m05",name:"ハタラキー",sub:0,stage:2,rar:2,type:"労",nature:"まじめ",job:"事務",fit:["work"],prod:18,
   skill:"三六協定",life:{m:"ハタラキーが労使協定を読み込んでいる",n:"ハタラキーが工場の労働時間を記録している",e:"ハタラキーが有給の残日数を計算している"},
   evo:{to:"m06",lv:30,correct:100,mastery:0.80,ke:40}},
  {id:"m06",name:"テイジ大明神",sub:0,stage:3,rar:3,type:"労",nature:"まじめ",job:"事務",fit:["work"],prod:30,
   skill:"定時退社",life:{m:"テイジ大明神が街に定時のかねを鳴らしている",n:"テイジ大明神が休憩時間を守らせている",e:"テイジ大明神は既に帰宅している"},evo:null},

  /* --- 労働安全衛生法(安全ヶ丘) --- */
  {id:"m07",name:"ヘルメン",sub:1,stage:1,rar:0,type:"労",nature:"しんちょう",job:"現場",fit:["work"],prod:6,
   skill:"保護具",life:{m:"ヘルメンがヘルメットのあごひもを締め直している",n:"ヘルメンが足場を点検している",e:"ヘルメンが明日の作業手順を確認している"},
   evo:{to:"m08",lv:12,correct:30,mastery:0.30,ke:0}},
  {id:"m08",name:"アンゼンダー",sub:1,stage:2,rar:2,type:"労",nature:"しんちょう",job:"現場",fit:["work"],prod:18,
   skill:"安全委員会",life:{m:"アンゼンダーが朝礼で危険予知をしている",n:"アンゼンダーが健康診断の日程を組んでいる",e:"アンゼンダーが工場の機械を止めて回っている"},
   evo:{to:"m09",lv:30,correct:80,mastery:0.80,ke:40}},
  {id:"m09",name:"ゼロサイガイ",sub:1,stage:3,rar:3,type:"労",nature:"しんちょう",job:"現場",fit:["work"],prod:30,
   skill:"無災害記録",life:{m:"ゼロサイガイが無災害の日数を1つ増やした",n:"ゼロサイガイが現場全体を見張っている",e:"ゼロサイガイが今日も全員の帰宅を見届けた"},evo:null},

  /* --- 労災保険法(レスキュー湾) --- */
  {id:"m10",name:"キューキュー",sub:2,stage:1,rar:0,type:"保",nature:"げんき",job:"医療",fit:["care"],prod:6,
   skill:"応急手当",life:{m:"キューキューが救急バッグを背負って走っている",n:"キューキューが現場へ急行している",e:"キューキューが夜勤明けで眠っている"},
   evo:{to:"m11",lv:12,correct:40,mastery:0.30,ke:0}},
  {id:"m11",name:"ロウサイオン",sub:2,stage:2,rar:2,type:"保",nature:"げんき",job:"医療",fit:["care"],prod:18,
   skill:"業務災害",life:{m:"ロウサイオンが通勤経路の地図を広げている",n:"ロウサイオンが療養給付の書類を整えている",e:"ロウサイオンが患者の話を聞いている"},
   evo:{to:"m12",lv:30,correct:100,mastery:0.80,ke:40}},
  {id:"m12",name:"ホショウ竜",sub:2,stage:3,rar:3,type:"保",nature:"げんき",job:"医療",fit:["care"],prod:30,
   skill:"完全補償",life:{m:"ホショウ竜が湾の空を旋回している",n:"ホショウ竜が現場の上空で見守っている",e:"ホショウ竜が静かに翼を休めている"},evo:null},

  /* --- 雇用保険法(ハロワ通り) --- */
  {id:"m13",name:"リショクン",sub:3,stage:1,rar:0,type:"保",nature:"のんびり",job:"窓口",fit:["desk"],prod:6,
   skill:"離職票",life:{m:"リショクンが求人票を眺めている",n:"リショクンが窓口の列に並んでいる",e:"リショクンが明日の面接の練習をしている"},
   evo:{to:"m14",lv:12,correct:40,mastery:0.30,ke:0}},
  {id:"m14",name:"キュウフー",sub:3,stage:2,rar:2,type:"保",nature:"おせっかい",job:"窓口",fit:["desk"],prod:18,
   skill:"基本手当",life:{m:"キュウフーが給付日数を数えている",n:"キュウフーが職業訓練の案内をしている",e:"キュウフーが認定日のカレンダーに印を付けている"},
   evo:{to:"m15",lv:30,correct:100,mastery:0.80,ke:40}},
  {id:"m15",name:"サイシュウダー",sub:3,stage:3,rar:3,type:"保",nature:"おせっかい",job:"窓口",fit:["desk"],prod:30,
   skill:"再就職支援",life:{m:"サイシュウダーが街の求人を全部把握している",n:"サイシュウダーが誰かの就職を祝っている",e:"サイシュウダーが明日の相談者の資料を読んでいる"},evo:null},

  /* --- 労働保険徴収法(徴収橋) --- */
  {id:"m16",name:"ノウフー",sub:4,stage:1,rar:0,type:"公",nature:"まじめ",job:"行政",fit:["desk"],prod:6,
   skill:"概算保険料",life:{m:"ノウフーが納付書を数えている",n:"ノウフーが申告期限を確認している",e:"ノウフーが帳簿を閉じている"},
   evo:{to:"m17",lv:12,correct:25,mastery:0.30,ke:0}},
  {id:"m17",name:"チョウシュール",sub:4,stage:2,rar:2,type:"公",nature:"まじめ",job:"行政",fit:["desk"],prod:18,
   skill:"確定精算",life:{m:"チョウシュールが年度更新の準備をしている",n:"チョウシュールが延納の回数を説明している",e:"チョウシュールが橋の上で街の収支を眺めている"},
   evo:{to:"m18",lv:30,correct:60,mastery:0.80,ke:40}},
  {id:"m18",name:"メリットン",sub:4,stage:3,rar:3,type:"公",nature:"ひょうきん",job:"行政",fit:["desk"],prod:30,
   skill:"メリット制",life:{m:"メリットンが災害の少ない工場をほめている",n:"メリットンが保険料率の表を掲げている",e:"メリットンが橋の欄干で計算している"},evo:null},

  /* --- 健康保険法(メディカルシティ) --- */
  {id:"m19",name:"ホケンヌ",sub:5,stage:1,rar:0,type:"保",nature:"おせっかい",job:"医療",fit:["care"],prod:6,
   skill:"保険証",life:{m:"ホケンヌが受付で保険証を確認している",n:"ホケンヌが待合室を案内している",e:"ホケンヌが薬の説明をしている"},
   evo:{to:"m20",lv:12,correct:40,mastery:0.30,ke:0}},
  {id:"m20",name:"イリョーヌ",sub:5,stage:2,rar:2,type:"保",nature:"おせっかい",job:"医療",fit:["care"],prod:18,
   skill:"傷病手当金",life:{m:"イリョーヌが休職者に連絡している",n:"イリョーヌが標準報酬月額を調べている",e:"イリョーヌが夜の病棟を見回っている"},
   evo:{to:"m21",lv:30,correct:100,mastery:0.80,ke:40}},
  {id:"m21",name:"コウガクリョー",sub:5,stage:3,rar:3,type:"保",nature:"おせっかい",job:"医療",fit:["care"],prod:30,
   skill:"高額療養費",life:{m:"コウガクリョーが自己負担の上限を計算している",n:"コウガクリョーが入院費の相談に乗っている",e:"コウガクリョーが誰かの不安をひとつ減らした"},evo:null},

  /* --- 国民年金法(市民生活エリア) --- */
  {id:"m22",name:"キソネン",sub:6,stage:1,rar:0,type:"年",nature:"のんびり",job:"窓口",fit:["desk","live"],prod:6,
   skill:"基礎年金",life:{m:"キソネンが市民課の窓口を開けている",n:"キソネンが被保険者の種別を説明している",e:"キソネンが住宅街を散歩している"},
   evo:{to:"m23",lv:12,correct:40,mastery:0.30,ke:0}},
  {id:"m23",name:"メンジョン",sub:6,stage:2,rar:2,type:"年",nature:"のんびり",job:"窓口",fit:["desk","live"],prod:18,
   skill:"保険料免除",life:{m:"メンジョンが学生納付特例の相談を受けている",n:"メンジョンが免除の申請書を整えている",e:"メンジョンが追納の期限を教えている"},
   evo:{to:"m24",lv:30,correct:100,mastery:0.80,ke:40}},
  {id:"m24",name:"ロウレイキング",sub:6,stage:3,rar:3,type:"年",nature:"のんびり",job:"窓口",fit:["desk","live"],prod:30,
   skill:"老齢基礎年金",life:{m:"ロウレイキングが繰下げの得を語っている",n:"ロウレイキングが街の長老たちと話している",e:"ロウレイキングが縁側で年金証書を眺めている"},evo:null},

  /* --- 厚生年金保険法(未来年金都市) --- */
  {id:"m25",name:"コウネン",sub:7,stage:1,rar:0,type:"年",nature:"まじめ",job:"事務",fit:["work","desk"],prod:6,
   skill:"標準報酬",life:{m:"コウネンが給与明細をそろえている",n:"コウネンが算定基礎届を作っている",e:"コウネンが等級表とにらめっこしている"},
   evo:{to:"m26",lv:12,correct:40,mastery:0.30,ke:0}},
  {id:"m26",name:"ホウシュウン",sub:7,stage:2,rar:2,type:"年",nature:"まじめ",job:"事務",fit:["work","desk"],prod:18,
   skill:"報酬比例",life:{m:"ホウシュウンが被保険者期間を積み上げている",n:"ホウシュウンが在職老齢年金を計算している",e:"ホウシュウンが未来の年金額を描いている"},
   evo:{to:"m27",lv:30,correct:100,mastery:0.80,ke:40}},
  {id:"m27",name:"ネンキンゴン",sub:7,stage:3,rar:4,type:"年",nature:"まじめ",job:"事務",fit:["work","desk"],prod:50,
   skill:"二階建て",life:{m:"ネンキンゴンが都市の二階部分を支えている",n:"ネンキンゴンが未来都市の柱を点検している",e:"ネンキンゴンが遠い未来を見つめている"},evo:null},

  /* --- 労一・社一(行政タワー) --- */
  {id:"m28",name:"トウケイン",sub:8,stage:1,rar:0,type:"公",nature:"ひょうきん",job:"研究",fit:["desk"],prod:6,
   skill:"統計調査",life:{m:"トウケインがグラフを描いている",n:"トウケインが調査票を配っている",e:"トウケインが数字の意味を考えている"},
   evo:{to:"m29",lv:12,correct:30,mastery:0.30,ke:0}},
  {id:"m29",name:"ハクショー",sub:8,stage:2,rar:2,type:"公",nature:"ひょうきん",job:"研究",fit:["desk"],prod:18,
   skill:"白書読み",life:{m:"ハクショーが分厚い白書をめくっている",n:"ハクショーが労働経済の動向を語っている",e:"ハクショーが付箋だらけの資料を閉じた"},
   evo:{to:"m30",lv:30,correct:70,mastery:0.80,ke:40}},
  {id:"m30",name:"シャカイモリ",sub:8,stage:3,rar:3,type:"公",nature:"しんちょう",job:"研究",fit:["desk"],prod:30,
   skill:"社会保障",life:{m:"シャカイモリが制度の全体像を描いている",n:"シャカイモリが行政タワーの最上階にいる",e:"シャカイモリが社会の形を静かに見ている"},evo:null}
  ];

  D.speciesById=Object.create(null);
  for(var i=0;i<D.species.length;i++){ D.speciesById[D.species[i].id]=D.species[i]; }

  /* レアリティ表示名(既存 RAR とは独立・MACHIMON内の表示専用) */
  D.rarName=["N","R","SR","SSR","UR"];
  /* 進化による生産力倍率(段階1/2/3) */
  D.stageMult=[1,1,2.0,3.5];
})();
