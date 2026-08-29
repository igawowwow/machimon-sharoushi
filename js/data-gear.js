"use strict";
/* ============================================================
   data-gear.js — D1: 装備大増量 + コレクション(図鑑/シリーズ/収集報酬)
   殿の声「装備が少なすぎる。コレクターにも刺さる内容に」への回答。
   ・各スロットを十数種以上へ大増量(全体で数十種)。レア度N〜LR全域に分散。
   ・シリーズ(科目テーマ・世界観)で見た目と名前を統一=「揃えたくなる」動機。
   ・収集報酬: 総収集数・シリーズ完成で恒久ボーナス(coin/xp%)や称号(=集める意味)。
   厳守(不変条件):
   ・ID恒久・不変。既存 w/a/c/t 系とは別プレフィックス(gw/ga/gc/gt)で衝突なし。
   ・旧セーブの所持データ(ST.inv)を壊さない=末尾追加のみ。専用セーブ不要
     (収集ボーナス collectPct は ST.inv から都度算出=新フィールド無しで後方互換)。
   ・answer自動化は一切足さない(hintは新装備に付けない)。課金なし=ゲーム内資源のみ。
   ・M3(LR/レア感)・M4(強化/凸/セット/戦力)と整合。シリーズはセット効果にも対応。
   依存: game-data.js(ITEMS/ITEM/RAR)・data-sprites.js(PX)。gear-power.js の後にロード
     (GEAR_SETS へシリーズセットを追加するため)。engine.js は runtime で collectPct 参照。
   ============================================================ */

/* ---------- シリーズ(テーマ/色/完成報酬) ---------- */
const GEAR_SERIES=[
 {id:"bunbougu",name:"新星の文具",theme:"入門(ショップで揃う)",color:"#5B8DFF",reward:{xp:2}},
 {id:"rouki",name:"労基戦装束",theme:"労働基準法",color:"#E8484F",reward:{coin:3}},
 {id:"anei",name:"安全鬼装",theme:"労働安全衛生法",color:"#3E9B4F",reward:{coin:2}},
 {id:"choshu",name:"徴収の商隊",theme:"徴収・雇用",color:"#C58900",reward:{coin:4}},
 {id:"kenpo",name:"守護の健保",theme:"健康保険法",color:"#3ED6C0",reward:{xp:3}},
 {id:"nenkin",name:"年金賢者",theme:"国年・厚年",color:"#8A6FD1",reward:{xp:4}},
 {id:"eiko",name:"叙勲の栄光",theme:"栄誉(UR)",color:"#FF8A3D",reward:{coin:5,xp:5}}
];
const GEAR_SERIES_MAP={};GEAR_SERIES.forEach(s=>GEAR_SERIES_MAP[s.id]=s);

/* ---------- 追加装備(大増量) ----------
   st: dmg/sh/t/crit/coin/xp/luck のみ(既存stat範囲)。hintは付けない=学習の芯を守る。
   入手: shop(価格) / g:1(ガチャ) / ach(収集・実績で自動付与)。 */
const GEAR_MORE=[
 /* --- 入門・N(ショップ。コレクションの入口) --- */
 {id:"gw_n0",slot:"w",rar:0,sp:"pen_h",name:"鉛筆の投げ矢",st:{dmg:1},shop:80,fx:"ダメージ1"},
 {id:"ga_n0",slot:"a",rar:0,sp:"suit",name:"簡易前掛け",st:{sh:1},shop:150,fx:"ミス1回無効"},
 {id:"gc_n0",slot:"c",rar:0,sp:"ring",name:"銅の指輪",st:{luck:10},shop:200,fx:"運+10"},
 /* --- シリーズ: 文具(bunbougu) R・ショップで揃う入門セット --- */
 {id:"gw_bb",slot:"w",rar:1,sp:"pen_b",name:"羽根ペンの短刀",st:{dmg:3},shop:450,series:"bunbougu",fx:"ダメージ3"},
 {id:"ga_bb",slot:"a",rar:1,sp:"suit_b",name:"学生の制服",st:{sh:1,xp:5},shop:600,series:"bunbougu",fx:"ミス1回無効+XP+5%"},
 {id:"gc_bb",slot:"c",rar:1,sp:"glasses",name:"受験メガネ",st:{xp:10},shop:800,series:"bunbougu",fx:"XP+10%"},
 /* --- シリーズ: 労基(rouki) SR・赤・攻めとコイン --- */
 {id:"gw_rk",slot:"w",rar:2,sp:"katana",name:"是正勧告の刀",st:{dmg:5,crit:1},shop:2600,series:"rouki",fx:"ダメージ5+クリ猶予+1秒"},
 {id:"ga_rk",slot:"a",rar:2,sp:"cloak",name:"監督官の陣羽織",st:{sh:2,coin:8},g:1,series:"rouki",fx:"ミス2回無効+コイン+8%"},
 {id:"gc_rk",slot:"c",rar:2,sp:"fan",name:"臨検の軍配",st:{coin:12,dmg:1},g:1,series:"rouki",fx:"コイン+12%+ダメージ+1"},
 /* --- シリーズ: 安衛(anei) SR・緑・守りと時間 --- */
 {id:"gw_ae",slot:"w",rar:2,sp:"axe",name:"安全第一の斧",st:{dmg:6},g:1,series:"anei",fx:"ダメージ6"},
 {id:"ga_ae",slot:"a",rar:2,sp:"helmet_r",name:"保護具の防護鎧",st:{sh:3,t:1},g:1,series:"anei",fx:"ミス3回無効+時間+1秒"},
 {id:"gc_ae",slot:"c",rar:2,sp:"band_g",name:"安全帯のカラビナ",st:{t:5,sh:1},g:1,series:"anei",fx:"時間+5秒+ミス1回無効"},
 /* --- シリーズ: 徴収(choshu) SR/SSR・金・コイン特化 --- */
 {id:"gw_cs",slot:"w",rar:2,sp:"spear",name:"算定基礎の槍",st:{dmg:5,coin:10},g:1,series:"choshu",fx:"ダメージ5+コイン+10%"},
 {id:"ga_cs",slot:"a",rar:3,sp:"armor_g",name:"取立の黄金鎧",st:{sh:3,coin:12},g:1,series:"choshu",fx:"ミス3回無効+コイン+12%"},
 {id:"gc_cs",slot:"c",rar:3,sp:"abacus",name:"延滞金の算盤",st:{coin:20,luck:10},g:1,series:"choshu",fx:"コイン+20%+運+10"},
 /* --- シリーズ: 健保(kenpo) SSR・青緑・防御 --- */
 {id:"gw_kp",slot:"w",rar:3,sp:"scepter_t",name:"傷病手当の錫",st:{dmg:6,sh:1},g:1,series:"kenpo",fx:"ダメージ6+ミス1回無効"},
 {id:"ga_kp",slot:"a",rar:3,sp:"shield_t",name:"高額療養の大盾",st:{sh:4},g:1,series:"kenpo",fx:"ミス4回無効"},
 {id:"gc_kp",slot:"c",rar:3,sp:"omamori_t",name:"保険証の護符",st:{sh:1,t:4},g:1,series:"kenpo",fx:"ミス1回無効+時間+4秒"},
 /* --- シリーズ: 年金(nenkin) SSR・紫金・XP --- */
 {id:"gw_nk",slot:"w",rar:3,sp:"gavel",name:"裁定の小槌",st:{dmg:6,xp:12},g:1,series:"nenkin",fx:"ダメージ6+XP+12%"},
 {id:"ga_nk",slot:"a",rar:3,sp:"armor_p",name:"老齢の法鎧",st:{sh:3,xp:12},g:1,series:"nenkin",fx:"ミス3回無効+XP+12%"},
 {id:"gc_nk",slot:"c",rar:3,sp:"gem",name:"受給の宝珠",st:{xp:20,luck:15},g:1,series:"nenkin",fx:"XP+20%+運+15"},
 /* --- シリーズ: 叙勲(eiko) UR・金・栄誉 --- */
 {id:"gw_ek",slot:"w",rar:4,sp:"excal_g",name:"栄光の宝剣",st:{dmg:9,crit:2},g:1,series:"eiko",fx:"ダメージ9+クリ猶予+2秒"},
 {id:"ga_ek",slot:"a",rar:4,sp:"wing_g",name:"叙勲の礼装",st:{sh:4,coin:15},g:1,series:"eiko",fx:"ミス4回無効+コイン+15%"},
 {id:"gc_ek",slot:"c",rar:4,sp:"medal_g",name:"叙勲のメダリオン",st:{xp:20,luck:25},g:1,series:"eiko",fx:"XP+20%+運+25"},
 /* --- 単発(レア網羅) --- */
 {id:"gc_g1",slot:"c",rar:2,sp:"bell",name:"合格祈願の鈴",st:{luck:30},g:1,fx:"運+30(レア運UP)"},
 {id:"gw_lr",slot:"w",rar:5,sp:"katana_r",name:"虹閃・審判ノ太刀",st:{dmg:12,crit:3,xp:15},g:1,fx:"ダメージ12+クリ猶予+3秒+XP+15%"},
 /* --- 称号(ガチャ) --- */
 {id:"gt_g1",slot:"t",rar:1,sp:"medal_b",name:"労働法の学徒",st:{xp:8},g:1,fx:"XP+8%"},
 {id:"gt_g2",slot:"t",rar:2,sp:"star_p",name:"判例収集家",st:{coin:8,xp:8},g:1,fx:"コイン+8%+XP+8%"},
 {id:"gt_g3",slot:"t",rar:3,sp:"brush_g",name:"現場の実務家",st:{dmg:1,coin:12},g:1,fx:"ダメージ+1+コイン+12%"},
 /* --- 称号(収集報酬・ach。ガチャ/ショップ非対象=集めた者だけの証) --- */
 {id:"gt_c15",slot:"t",rar:1,sp:"medal_g",name:"蒐集の芽",st:{coin:6},ach:"col15",fx:"装備15種を集めて獲得/コイン+6%"},
 {id:"gt_c25",slot:"t",rar:2,sp:"trophy_t",name:"蒐集家",st:{coin:10},ach:"col25",fx:"装備25種を集めて獲得/コイン+10%"},
 {id:"gt_c50",slot:"t",rar:3,sp:"crown_c",name:"目録の達人",st:{coin:12,xp:12},ach:"col50",fx:"装備50種を集めて獲得/コイン・XP+12%"},
 {id:"gt_bb",slot:"t",rar:1,sp:"pen_b",name:"文具の申し子",st:{xp:8},ach:"col_bunbougu",fx:"文具シリーズ完成で獲得/XP+8%"},
 {id:"gt_rk",slot:"t",rar:2,sp:"helmet2",name:"労基の番人",st:{dmg:1,coin:10},ach:"col_rouki",fx:"労基シリーズ完成で獲得"},
 {id:"gt_ae",slot:"t",rar:2,sp:"helmet_r",name:"安全衛生の鬼",st:{t:2,sh:1},ach:"col_anei",fx:"安衛シリーズ完成で獲得"},
 {id:"gt_cs",slot:"t",rar:2,sp:"abacus",name:"徴収マイスター",st:{coin:15},ach:"col_choshu",fx:"徴収シリーズ完成で獲得/コイン+15%"},
 {id:"gt_kp",slot:"t",rar:3,sp:"shield_t",name:"健保の守護者",st:{sh:1,t:2},ach:"col_kenpo",fx:"健保シリーズ完成で獲得"},
 {id:"gt_nk",slot:"t",rar:3,sp:"gem",name:"年金の賢者",st:{xp:15,coin:5},ach:"col_nenkin",fx:"年金シリーズ完成で獲得"},
 {id:"gt_ek",slot:"t",rar:4,sp:"trophy_p",name:"叙勲されし者",st:{dmg:2,coin:15,xp:10},ach:"col_eiko",fx:"叙勲シリーズ完成で獲得/全能力UP"}
];

/* ---------- ITEMS/ITEM へ末尾追加(既存IDは触らない) ---------- */
(function registerGear(){
 if(typeof ITEMS==="undefined")return;
 for(const it of GEAR_MORE){
  if(typeof ITEM!=="undefined"&&ITEM[it.id])continue; /* 二重登録ガード */
  ITEMS.push(it);
  if(typeof ITEM!=="undefined")ITEM[it.id]=it;
 }
 /* 見た目の安全網: スプライト未定義なら壊れ画像を避けてスロット既定へ(本番のみ) */
 if(typeof PX!=="undefined"&&PX.excal){
  const fb={w:"excal",a:"armor",c:"star",t:"medal"};
  for(const it of GEAR_MORE)if(!PX[it.sp])it.sp=fb[it.slot]||"scroll";
 }
})();

/* ---------- シリーズセット(M4のセット効果に統合。揃えて装備で発動) ----------
   need=trioを同時装備(w+a+c=別スロットなので同時装備可)。GEAR_SETS へ末尾追加。 */
const GEAR_SETS_ADD=[
 {id:"s_bunbougu",name:"新星の文具",items:["gw_bb","ga_bb","gc_bb"],power:25,bonus:{xp:8},
  desc:"文具3種(ショップで揃う入門)。XP+8%"},
 {id:"s_rouki",name:"労基戦装束",items:["gw_rk","ga_rk","gc_rk"],power:55,bonus:{coin:10,bossDmg:1},
  desc:"労基テーマ3種。ボス追撃+1・コイン+10%"},
 {id:"s_anei",name:"安全鬼装",items:["gw_ae","ga_ae","gc_ae"],power:55,bonus:{t:3},
  desc:"安衛テーマ3種。制限時間+3秒"},
 {id:"s_choshu",name:"徴収の商隊",items:["gw_cs","ga_cs","gc_cs"],power:70,bonus:{coin:20,bossDmg:1},
  desc:"徴収テーマ3種。コイン+20%・ボス追撃+1"},
 {id:"s_kenpo",name:"守護の健保",items:["gw_kp","ga_kp","gc_kp"],power:75,bonus:{t:3,coin:8},
  desc:"健保テーマ3種。時間+3秒・コイン+8%"},
 {id:"s_nenkin",name:"年金賢者",items:["gw_nk","ga_nk","gc_nk"],power:80,bonus:{xp:20,t:2},
  desc:"年金テーマ3種。XP+20%・時間+2秒"},
 {id:"s_eiko",name:"叙勲の栄光",items:["gw_ek","ga_ek","gc_ek"],power:110,bonus:{coin:15,xp:15,bossDmg:2},
  desc:"UR3種の栄誉セット。コイン/XP+15%・ボス追撃+2"}
];
(function registerSets(){
 if(typeof GEAR_SETS==="undefined")return;
 const have=new Set(GEAR_SETS.map(s=>s.id));
 for(const s of GEAR_SETS_ADD)if(!have.has(s.id))GEAR_SETS.push(s);
})();

/* ---------- コレクション: 収集数・シリーズ完成の集計(すべて ST.inv から都度算出) ---------- */
function collectCount(){let n=0;if(typeof ST==="undefined")return 0;for(const it of ITEMS)if(ST.inv[it.id])n++;return n;}
function seriesItems(sid){return ITEMS.filter(x=>x.series===sid);}
function seriesOwned(sid){if(typeof ST==="undefined")return 0;return seriesItems(sid).filter(x=>ST.inv[x.id]).length;}
function seriesComplete(sid){const its=seriesItems(sid);return its.length>0&&its.every(x=>ST&&ST.inv[x.id]);}
/* レア度別の所持/総数(図鑑表示用) */
function rarOwned(r){return ITEMS.filter(x=>x.rar===r&&ST&&ST.inv[x.id]).length;}
function rarTotal(r){return ITEMS.filter(x=>x.rar===r).length;}

/* 収集ボーナスの段階(総収集数)。cumulative=しきい値に達するごとに加算(恒久・非課金) */
const COLLECT_TIERS=[
 {n:10,coin:2,label:"10種"},{n:20,xp:3,label:"20種"},
 {n:35,coin:3,label:"35種"},{n:50,xp:5,label:"50種"},{n:65,coin:5,label:"65種"}
];
/* 収集による恒久 coin/xp ボーナス%(coinMult/xpMult が加算)。ST.inv 由来=後方互換 */
function collectPct(key){
 let v=0;const c=collectCount();
 for(const t of COLLECT_TIERS)if(c>=t.n&&t[key])v+=t[key];
 for(const s of GEAR_SERIES)if(s.reward&&s.reward[key]&&seriesComplete(s.id))v+=s.reward[key];
 return v;
}
/* 収集報酬称号の付与条件(engine.grantAchTitles が cond にマージ) */
function collectConds(){
 if(typeof ST==="undefined")return {};
 const c=collectCount(),o={col15:c>=15,col25:c>=25,col50:c>=50};
 for(const s of GEAR_SERIES)o["col_"+s.id]=seriesComplete(s.id);
 return o;
}
/* 入手経路ラベル(図鑑の「どこで手に入るか」) */
function gearSource(it){
 if(!it)return "";
 if(it.shop!==undefined)return "🛒ショップ";
 if(it.g)return "🎰ガチャ";
 if(it.ach)return (String(it.ach).indexOf("col")===0)?"🏅コレクション報酬":"🏅実績";
 if(it.start)return "初期装備";
 if(it.drop)return "📦宝箱";
 return "🎁報酬";
}

if(typeof window!=="undefined"){
 window.GEAR_SERIES=GEAR_SERIES;window.GEAR_SERIES_MAP=GEAR_SERIES_MAP;window.GEAR_MORE=GEAR_MORE;
 window.collectCount=collectCount;window.seriesItems=seriesItems;window.seriesOwned=seriesOwned;
 window.seriesComplete=seriesComplete;window.rarOwned=rarOwned;window.rarTotal=rarTotal;
 window.COLLECT_TIERS=COLLECT_TIERS;window.collectPct=collectPct;window.collectConds=collectConds;window.gearSource=gearSource;
}
