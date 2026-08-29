"use strict";
/* ============ 科目・ボス ============ */
const SUBJECTS=["労働基準法","労働安全衛生法","労災保険法","雇用保険法","労働保険徴収法","健康保険法","国民年金法","厚生年金保険法","労一・社一"];
const BOSSES=[
 {sp:"oni",name:"監督官ロウキ",sub:"労基法"},
 {sp:"helm",name:"安全鬼アンエイ",sub:"安衛法"},
 {sp:"fire",name:"ロウサイ大王",sub:"労災"},
 {sp:"ghost",name:"シツギョウ魔人",sub:"雇用"},
 {sp:"bag",name:"取立番長",sub:"徴収法"},
 {sp:"pill",name:"ケンポ将軍",sub:"健保"},
 {sp:"sage",name:"コクネン仙人",sub:"国年"},
 {sp:"king",name:"コウネン皇帝",sub:"厚年"},
 {sp:"wiz",name:"統計老師",sub:"労一社一"}
];

/* ============ レアリティ ============
   index=rar番号(恒久・不変。既存装備の rar:0..4 を壊さないよう末尾に追加のみ)。
   rar5=LR(虹/レジェンド・星6相当)=最上位ティア。dupe=ダブり時の変換コイン。 */
const RAR=[
 {n:"N",cls:"rarN",dupe:30},
 {n:"R",cls:"rarR",dupe:80},
 {n:"SR",cls:"rarSR",dupe:250},
 {n:"SSR",cls:"rarSSR",dupe:800},
 {n:"UR",cls:"rarUR",dupe:2500},
 {n:"LR",cls:"rarLR",dupe:8000}
];

/* ============ 装備アイテム(武器w/防具a/アクセc/称号t) ============
 st: dmg=与ダメ sh=シールド t=制限時間+秒 crit=クリティカル猶予+秒
     coin=獲得コイン% xp=獲得XP% luck=運(宝箱・ガチャ運) */
const ITEMS=[
 /* --- 武器(ショップ系列) --- */
 {id:"w0",slot:"w",rar:0,sp:"pen",name:"赤ペン",st:{dmg:1},shop:0,fx:"ダメージ1(初期装備)"},
 {id:"w1",slot:"w",rar:0,sp:"pens",name:"シャーペン二刀流",st:{dmg:2},shop:150,fx:"ダメージ2"},
 {id:"w2",slot:"w",rar:1,sp:"marker",name:"蛍光マーカー剣",st:{dmg:3},shop:400,fx:"ダメージ3"},
 {id:"w3",slot:"w",rar:1,sp:"hammer",name:"六法ハンマー",st:{dmg:4},shop:900,fx:"ダメージ4"},
 {id:"w4",slot:"w",rar:2,sp:"band",name:"合格ハチマキ",st:{dmg:5},shop:2000,fx:"ダメージ5"},
 {id:"w5",slot:"w",rar:2,sp:"brush",name:"覚醒・朱印の筆",st:{dmg:6,crit:1},shop:4000,fx:"ダメージ6+クリ猶予+1秒"},
 {id:"w6",slot:"w",rar:3,sp:"excal",name:"エクスカリ六法",st:{dmg:8,crit:2},shop:9000,fx:"ダメージ8+クリ猶予+2秒"},
 /* --- 武器(ガチャ限定) --- */
 {id:"w7",slot:"w",rar:3,sp:"scroll",name:"判例マスター",st:{dmg:7,crit:1,xp:20},g:1,fx:"ダメージ7+XP+20%"},
 {id:"w8",slot:"w",rar:4,sp:"excal",name:"伝説の六法",st:{dmg:10,crit:2,coin:10},g:1,fx:"ダメージ10+クリ猶予+2秒+コイン+10%"},
 {id:"w9",slot:"w",rar:5,sp:"excal",name:"虹天・六法エクスカリバー",st:{dmg:13,crit:3,coin:15},g:1,fx:"ダメージ13+クリ猶予+3秒+コイン+15%"},
 /* --- 防具 --- */
 {id:"a1",slot:"a",rar:0,sp:"omamori",name:"学業お守り",st:{sh:1},shop:300,fx:"ミス1回を無効化"},
 {id:"a2",slot:"a",rar:1,sp:"shield",name:"合格祈願の大盾",st:{sh:2},shop:1200,fx:"ミス2回を無効化"},
 {id:"a3",slot:"a",rar:2,sp:"armor",name:"労基法の鎧",st:{sh:2,t:1},g:1,fx:"ミス2回無効+時間+1秒"},
 {id:"a4",slot:"a",rar:3,sp:"wing",name:"女神の羽衣",st:{sh:3},shop:6000,fx:"ミス3回を無効化"},
 {id:"a5",slot:"a",rar:3,sp:"suit",name:"ブラック耐性スーツ",st:{sh:3,coin:10},g:1,fx:"ミス3回無効+コイン+10%"},
 {id:"a6",slot:"a",rar:4,sp:"wiz",name:"厚労省の法衣",st:{sh:4,xp:15},g:1,fx:"ミス4回無効+XP+15%"},
 {id:"a7",slot:"a",rar:5,sp:"wiz",name:"虹光・神威の法衣",st:{sh:5,xp:25,coin:10},g:1,fx:"ミス5回無効+XP+25%+コイン+10%"},
 /* --- アクセサリー --- */
 {id:"c1",slot:"c",rar:0,sp:"clock1",name:"懐中時計",st:{t:3},shop:250,fx:"制限時間+3秒"},
 {id:"c2",slot:"c",rar:1,sp:"clock2",name:"時の砂",st:{t:6},shop:1000,fx:"制限時間+6秒"},
 {id:"c3",slot:"c",rar:1,sp:"daruma",name:"合格ダルマ",st:{luck:25},g:1,fx:"運+25(宝箱・レア運UP)"},
 {id:"c4",slot:"c",rar:2,sp:"coin",name:"金のそろばん",st:{coin:15},g:1,fx:"コイン+15%"},
 {id:"c5",slot:"c",rar:2,sp:"star",name:"六法しおり",st:{xp:15,hint:1},g:1,fx:"XP+15%+択一・穴埋めで誤答肢を1つ除外"},
 {id:"c6",slot:"c",rar:3,sp:"scepter",name:"刻の王笏",st:{t:9},shop:5000,fx:"制限時間+9秒"},
 {id:"c7",slot:"c",rar:3,sp:"megami",name:"労基の女神",st:{sh:1,coin:20},g:1,fx:"ミス1回無効+コイン+20%"},
 {id:"c8",slot:"c",rar:4,sp:"trophy",name:"時空の合格証",st:{t:6,xp:20,luck:30},g:1,fx:"時間+6秒+XP+20%+運+30"},
 {id:"c9",slot:"c",rar:5,sp:"scepter",name:"虹刻・永劫の砂時計",st:{t:12,coin:25,luck:50},g:1,fx:"時間+12秒+コイン+25%+運+50"},
 /* --- 称号 --- */
 {id:"t1",slot:"t",rar:0,sp:"medal",name:"見習い社労士",st:{},start:1,fx:"最初の称号"},
 {id:"t2",slot:"t",rar:1,sp:"medal",name:"判例ハンター",st:{xp:10},g:1,fx:"XP+10%"},
 {id:"t3",slot:"t",rar:2,sp:"medal",name:"暗記王",st:{coin:10,xp:5},g:1,fx:"コイン+10%+XP+5%"},
 {id:"t4",slot:"t",rar:2,sp:"crown2",name:"ブラック企業バスター",st:{dmg:1},ach:"badges9",fx:"全9ボス討伐で獲得/ダメージ+1"},
 {id:"t5",slot:"t",rar:3,sp:"crown2",name:"労働法の守護者",st:{dmg:1,sh:1},ach:"clear1",fx:"試験の神を撃破で獲得/ダメ+1・盾+1"},
 {id:"t6",slot:"t",rar:4,sp:"god",name:"社労士神",st:{dmg:2,sh:1,t:3,coin:20,xp:20,luck:50,hint:1},g:1,fx:"全能力UP+誤答肢1つ除外"},
 {id:"t7",slot:"t",rar:3,sp:"trophy",name:"法律図鑑マスター",st:{luck:40,coin:10},ach:"zukan",fx:"法律図鑑100%で獲得/運+40"},
 {id:"t8",slot:"t",rar:4,sp:"mao",name:"厚生労働神を超えし者",st:{dmg:2,xp:30},ach:"truewin",fx:"真ラスボス撃破で獲得"},
 {id:"t9",slot:"t",rar:5,sp:"god",name:"虹冠・社労士大神",st:{dmg:3,t:3,coin:30,xp:30,luck:60},g:1,fx:"ダメ+3+時間+3秒+コイン+30%+XP+30%+運+60"}
];
const ITEM={};ITEMS.forEach(x=>ITEM[x.id]=x);
const SLOT_NAME={w:"武器",a:"防具",c:"アクセ",t:"称号"};

/* ============ ガチャ ============ */
const GACHA={
 cost1:100, cost10:900, pity:50,
 /* [rar,確率]。index==rar でソート済(gachaRollRarity が上位から累積判定する不変条件)。
    合計=1.00。LR(rar5)は超低確率=「引いた瞬間に震える」最上位。
    S5(レート調整): SSR以上が出過ぎてレア感が消えていたため、SSR以上の合計を
    5.8% → 3.0% へ絞った(SSR 5%→2.5% / UR 0.8%→0.4% / LR 0.2%→0.1%)。
    渋くしても報われないのはダメなので、天井(pity)は50回のまま据え置き＝
    最悪でも50回でSSR以上が必ず来る。減らした分はN/Rの取り分に回している。 */
 rates:[[0,.52],[1,.31],[2,.14],[3,.025],[4,.004],[5,.001]]
};
function gachaPool(rar){
 if(rar===0)return [];/* N=コイン・ポーション枠 */
 return ITEMS.filter(x=>x.rar===rar&&(x.g||x.shop!==undefined)&&!x.ach&&!x.start);
}

/* ============ コンボ段階・必殺技 ============ */
const TIERS=[
 {n:5,name:"FEVER!",mult:1.2,dmg:1,color:"#FF6B9D"},
 {n:10,name:"PERFECT!!",mult:1.5,dmg:2,color:"#5B8DFF"},
 {n:20,name:"LEGEND!!!",mult:2,dmg:3,color:"#8A6FD1"},
 {n:50,name:"GOD!!!!",mult:3,dmg:5,color:"#C58900"},
 {n:100,name:"社労士神域",mult:5,dmg:8,color:"#FF3D7E"}
];
function comboTier(c){let t=null;for(const x of TIERS)if(c>=x.n)t=x;return t;}
const SPECIALS=[
 {at:10,name:"六法斬り",dmg:3,flash:"#5B8DFF"},
 {at:20,name:"判例ラッシュ",dmg:6,flash:"#8A6FD1"},
 {at:50,name:"社労士覚醒",dmg:12,heal:1,flash:"#FFC53C"}
];

/* ============ デイリーミッション ============ */
const MISSIONS=[
 {key:"cor",need:5,txt:"5問正解する",rw:{coins:100}},
 {key:"cor",need:20,txt:"20問正解する",rw:{coins:250,tickets:1}},
 {key:"ans",need:50,txt:"50問解く",rw:{coins:400,chest:1}},
 {key:"ans",need:100,txt:"100問解く",rw:{coins:800,tickets:2}}
];

/* ============ 週間チャレンジ(月曜リセット) ============ */
const WEEKLY=[
 {key:"a",need:150,txt:"今週150問に挑戦",rw:{coins:300}},
 {key:"c",need:100,txt:"今週100問正解",rw:{tickets:2}},
 {key:"d",need:5,txt:"今週5日プレイ",rw:{chest:1}}
];

/* ============ ログインボーナス(30日カレンダー・7/14/30日目はSSR確定チケ) ============ */
function loginReward(day){/* day=通算ログイン日数を30日周期に */
 const d=((day-1)%30)+1;
 if(d===30)return {ssrT:1,coins:500,label:"SSR確定+500"};
 if(d===14)return {ssrT:1,coins:300,label:"SSR確定+300"};
 if(d===7)return {ssrT:1,coins:200,label:"SSR確定+200"};
 if(d%5===0)return {tickets:1,coins:100,label:"チケ+100"};
 return {coins:50+d*5,label:(50+d*5)+"コイン"};
}

/* ============ 宝箱 ============ */
const CHEST_TABLE=[
 {w:34,type:"coins",min:50,max:150},
 {w:15,type:"potion"},
 {w:15,type:"xp",min:40,max:90},
 {w:14,type:"tickets",n:1},
 {w:10,type:"coins",min:250,max:500},
 {w:8,type:"item",rar:1},
 {w:3.5,type:"item",rar:2},
 {w:0.5,type:"item",rar:3}
];

/* ============ ストーリー ============ */
const STORY={
 intro:[
  {sp:"mao",n:"???",t:"フハハハ…この国はブラック企業帝国が支配した。サービス残業、違法解雇、未払い賃金…やりたい放題じゃ!"},
  {sp:"hero",n:"見習い社労士",t:"労働者のみんなが苦しんでる…。でも、僕はまだ法律を知らない…"},
  {sp:"sage",n:"長老",t:"勇者よ、帝国の魔物に唯一効く武器──それが「労働法の知識」じゃ。9体の科目ボスを倒し、試験の神を超えるのじゃ。"},
  {sp:"mao",n:"???",t:"クックック…頂で待っておるぞ。ワシの名は【厚生労働神】。知識なき者に勝ち目はない!"},
  {sp:"hero",n:"見習い社労士",t:"みんなを守るため、僕は日本一の社労士になる!いくぞ!"}
 ],
 boss:[
  [{sp:"oni",n:"監督官ロウキ",t:"解雇予告も知らん若造が、ワシに挑むじゃと?労基法の基礎で叩き潰してくれるわ!"}],
  [{sp:"helm",n:"安全鬼アンエイ",t:"安全なくして労働なし!50人の壁を越えられるかな?"}],
  [{sp:"fire",n:"ロウサイ大王",t:"業務災害と通勤災害…その区別、命がけで教えてやろう!"}],
  [{sp:"ghost",n:"シツギョウ魔人",t:"フフフ…失業の恐怖を思い知れ。基本手当の数字は覚えたか?"}],
  [{sp:"bag",n:"取立番長",t:"保険料は耳を揃えて払ってもらうぜ。160万と1.8億…意味わかるか?"}],
  [{sp:"pill",n:"ケンポ将軍",t:"病気・ケガ・出産…人生の危機を守るのが健保。生半可な知識では倒せん!"}],
  [{sp:"sage",n:"コクネン仙人",t:"ほっほっほ…国民皆年金の深淵、見せてしんぜよう。"}],
  [{sp:"king",n:"コウネン皇帝",t:"厚生年金は帝国の礎!報酬比例の重みを知るがよい!"}],
  [{sp:"wiz",n:"統計老師",t:"最後の関門、労一社一。広く浅く、されど鋭く…じゃ。"}]
 ],
 last:[
  {sp:"god",n:"試験の神",t:"9体のボスを倒した勇気、見事。だが本番は時間との勝負…約7割の壁、越えてみせよ!"}
 ],
 truePre:[
  {sp:"mao",n:"厚生労働神",t:"よくぞここまで来た…。だがワシは法律そのものを支配する神。全科目・全論点で相手をしてやろう!"},
  {sp:"hero",n:"社労士",t:"みんなの働く毎日を守る。その想いがある限り、負けない!"}
 ],
 trueWin:[
  {sp:"mao",n:"厚生労働神",t:"ぐぬぬ…完敗じゃ。もはやそなたは知識の頂に立った…。"},
  {sp:"hero",n:"社労士",t:"ブラック企業帝国は崩壊した!でも本当の戦いはこれから──本試験だ!"},
  {sp:"sage",n:"長老",t:"おめでとう。そなたはもう「遊んでいたら合格してしまう」領域におる。この調子で毎日続けるのじゃ!"}
 ]
};

/* ============ ラスボス・真ラスボス設定 ============ */
function LASTCFG_BASE(loop){const L=Math.min(loop,3);return [{n:15,need:10,t:15},{n:20,need:14,t:12},{n:25,need:18,t:10}][L-1];}
const TRUE_BOSS={sp:"mao",name:"厚生労働神",sub:"真ラスボス",hp:40};

/* ============ 試験の悪魔(本試験の化身・冒頭アークの北極星) ============
   リアル過去問をちょうど7問、本試験さながらの短い制限時間で出す。装備補助は無効(isExam)。
   need=7問中5問正解(約7割=本試験の合格ラインに相当)で撃破=合格の擬似体験。
   t=1問あたりの制限秒(モバイルで理不尽にならない範囲での「試験さながら」)。 */
const DEMON_CFG={n:7,need:5,t:12};

/* classic script の const を window へ公開(物語層が window.SUBJECTS を参照する) */
if(typeof window!=="undefined"){ window.SUBJECTS=SUBJECTS; window.BOSSES=BOSSES; }
