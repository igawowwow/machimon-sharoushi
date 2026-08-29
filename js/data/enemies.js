"use strict";
/* ============================================================
   data/enemies.js — 雑魚敵ロスター(演出レイヤーのみ)
   ・9科目それぞれの雑魚敵を大増量(各科目16〜17種・全体150種以上)。
     見た目(既存px)+コミカルな名前+軽い個性(el=強敵/gd=宝を落とす)。
   ・恒久ID・問題データ(ST.q/qById)には一切触れない。撃破=正解 のマッピングだけ。
   ・スプライトは data-sprites.js の既存キーのみ使用(新規画像・外部URLなし)。
   ・名前は科目用語を捩ったコミカルなもの。実在作品の固有名詞は使わない。
   ・el(elite)=たまに出る強めの雑魚(撃破で小フラッシュ演出)。学習判定は不変。
   ・gd(gold)=たまに宝を落とす雑魚(撃破で少額ボーナスコイン)。課金要素なし。
   【重要】ロスターは append-only(末尾追加のみ)。ベスティアリ記録は
   キー beKey(si,idx)=位置ベースなので、既存の並びを入れ替えると記録が
   ずれる。増やす時は各科目配列の末尾に足すこと。
   ============================================================ */
const ENEMIES=[
 /* 0 労働基準法 */
 [{sp:"e_boss",n:"サビ残上司"},{sp:"e_sabizan",n:"未払い主任"},{sp:"e_nabakari",n:"みなし残業マン"},
  {sp:"e_gizo",n:"深夜手当監督"},{sp:"e_sabizan",n:"有休つぶし事務員"},{sp:"e_nabakari",n:"名ばかり店長",el:1},
  {sp:"e_kacho",n:"タイムカード部長"},{sp:"e_sabizan",n:"三六協定課長"},{sp:"e_boss",n:"割増賃金上司"},
  {sp:"e_kacho",n:"解雇予告工場長",el:1},{sp:"e_gizo",n:"フレックス役員"},{sp:"e_gizo",n:"変形労働番頭"},
  {sp:"e_nabakari",n:"休憩掠め係"},{sp:"e_sabizan",n:"産休妨害課長"},{sp:"e_gizo",n:"賃金五原則の偽造屋",gd:1},
  {sp:"e_nabakari",n:"管理監督者もどき"},{sp:"e_boss",n:"始業チャイム元締"}],
 /* 1 労働安全衛生法 */
 [{sp:"e_sabizan",n:"無検診課長"},{sp:"e_nabakari",n:"転落放置主任"},{sp:"e_boss",n:"石綿の元締"},
  {sp:"e_kacho",n:"ストレスチェック部長"},{sp:"e_boss",n:"ヘルメット無視親方"},{sp:"e_sabizan",n:"じん肺隠蔽係"},
  {sp:"e_gizo",n:"安全委員会番頭"},{sp:"e_nabakari",n:"作業主任者かぶれ",el:1},{sp:"e_sabizan",n:"有機溶剤隠蔽係"},
  {sp:"e_boss",n:"感電放置係"},{sp:"e_nabakari",n:"重量物担当"},{sp:"e_boss",n:"足場くずし班長"},
  {sp:"e_gizo",n:"特別教育サボり魔"},{sp:"e_sabizan",n:"熱中症放置課長",el:1},{sp:"e_gizo",n:"安全衛生規程の偽造屋",gd:1},
  {sp:"e_kacho",n:"高所恐怖工場長"},{sp:"e_boss",n:"粉じん爆発現場長"}],
 /* 2 労災保険法 */
 [{sp:"e_sabizan",n:"通勤災害主任"},{sp:"e_boss",n:"過労上司"},{sp:"e_kacho",n:"給付基礎日額工場長"},
  {sp:"e_nabakari",n:"障害等級班長"},{sp:"e_kacho",n:"メリット制社長",el:1},{sp:"e_sabizan",n:"療養補償偽装看護長"},
  {sp:"e_gizo",n:"休業補償番頭"},{sp:"e_sabizan",n:"遺族年金課長"},{sp:"e_boss",n:"傷病補償上司"},
  {sp:"e_nabakari",n:"特別加入かぶれ"},{sp:"e_gizo",n:"二次健診顧問"},{sp:"e_nabakari",n:"介護補償担当"},
  {sp:"e_kacho",n:"業務起因親方"},{sp:"e_kacho",n:"寄り道通勤工場長",el:1},{sp:"e_gizo",n:"認定基準の偽造屋",gd:1},
  {sp:"e_sabizan",n:"アフターケア事務員"},{sp:"e_sabizan",n:"第三者行為主任"}],
 /* 3 雇用保険法 */
 [{sp:"e_sabizan",n:"失業課長"},{sp:"e_kacho",n:"基本手当ケチ部長"},{sp:"e_boss",n:"受給資格上司"},
  {sp:"e_nabakari",n:"育休給付主任"},{sp:"e_sabizan",n:"給付制限門番"},{sp:"e_gizo",n:"所定給付日数番頭",el:1},
  {sp:"e_nabakari",n:"高年齢求職かぶれ"},{sp:"e_sabizan",n:"再就職手当課長"},{sp:"e_boss",n:"離職票上司"},
  {sp:"e_gizo",n:"教育訓練顧問"},{sp:"e_nabakari",n:"介護休業担当"},{sp:"e_kacho",n:"特定受給工場長"},
  {sp:"e_sabizan",n:"待期7日事務員"},{sp:"e_gizo",n:"賃金日額番頭",el:1},{sp:"e_gizo",n:"被保険者資格の偽造屋",gd:1},
  {sp:"e_sabizan",n:"日雇労働主任"},{sp:"e_boss",n:"就職促進上司"}],
 /* 4 労働保険徴収法 */
 [{sp:"e_nabakari",n:"保険料取立て部長"},{sp:"e_boss",n:"概算確定上司"},{sp:"e_gizo",n:"延滞金監督"},
  {sp:"e_sabizan",n:"メリット料率課長"},{sp:"e_nabakari",n:"印紙保険料マン"},{sp:"e_kacho",n:"年度更新工場長",el:1},
  {sp:"e_nabakari",n:"一括有期担当"},{sp:"e_sabizan",n:"追徴金事務員"},{sp:"e_boss",n:"労働保険番号上司"},
  {sp:"e_gizo",n:"継続事業顧問"},{sp:"e_gizo",n:"口座振替番頭"},{sp:"e_sabizan",n:"還付請求課長"},
  {sp:"e_nabakari",n:"労働保険事務組合もどき",el:1},{sp:"e_nabakari",n:"認定決定担当"},{sp:"e_gizo",n:"賃金総額の偽造屋",gd:1},
  {sp:"e_kacho",n:"督促状工場長"},{sp:"e_gizo",n:"特例納付番頭"}],
 /* 5 健康保険法 */
 [{sp:"e_sabizan",n:"傷病手当掠め係"},{sp:"e_kacho",n:"標準報酬工場長"},{sp:"e_boss",n:"高額療養上司"},
  {sp:"e_nabakari",n:"埋葬料主任"},{sp:"e_gizo",n:"任意継続番頭"},{sp:"e_sabizan",n:"出産手当偽装看護長",el:1},
  {sp:"e_nabakari",n:"被扶養者かぶれ"},{sp:"e_sabizan",n:"療養費課長"},{sp:"e_boss",n:"標準賞与上司"},
  {sp:"e_gizo",n:"保険給付顧問"},{sp:"e_nabakari",n:"移送費担当"},{sp:"e_kacho",n:"資格喪失工場長"},
  {sp:"e_sabizan",n:"家族療養事務員"},{sp:"e_gizo",n:"日雇特例番頭",el:1},{sp:"e_gizo",n:"保険者算定の偽造屋",gd:1},
  {sp:"e_sabizan",n:"高額介護合算主任"},{sp:"e_kacho",n:"保険料率工場長"}],
 /* 6 国民年金法 */
 [{sp:"e_boss",n:"未納上司"},{sp:"e_sabizan",n:"免除申請課長"},{sp:"e_kacho",n:"追納の部長"},
  {sp:"e_sabizan",n:"学生特例くん"},{sp:"e_gizo",n:"付加年金番頭"},{sp:"e_nabakari",n:"老齢基礎かぶれ",el:1},
  {sp:"e_gizo",n:"障害基礎顧問"},{sp:"e_sabizan",n:"遺族基礎課長"},{sp:"e_boss",n:"合算対象上司"},
  {sp:"e_nabakari",n:"第3号被保険者担当"},{sp:"e_kacho",n:"保険料半額工場長"},{sp:"e_sabizan",n:"納付猶予事務員"},
  {sp:"e_gizo",n:"寡婦年金番頭",el:1},{sp:"e_sabizan",n:"死亡一時金主任"},{sp:"e_gizo",n:"受給資格期間の偽造屋",gd:1},
  {sp:"e_nabakari",n:"任意加入かぶれ"},{sp:"e_boss",n:"基金脱退上司"}],
 /* 7 厚生年金保険法 */
 [{sp:"e_kacho",n:"報酬比例工場長"},{sp:"e_boss",n:"標準賞与上司"},{sp:"e_sabizan",n:"加給年金課長"},
  {sp:"e_gizo",n:"在職老齢監督"},{sp:"e_nabakari",n:"3号分割主任"},{sp:"e_boss",n:"経過的加算重役",el:1},
  {sp:"e_nabakari",n:"特別支給かぶれ"},{sp:"e_sabizan",n:"障害厚生課長"},{sp:"e_boss",n:"遺族厚生上司"},
  {sp:"e_gizo",n:"繰下げ顧問"},{sp:"e_sabizan",n:"脱退一時金事務員"},{sp:"e_kacho",n:"標準報酬月額工場長"},
  {sp:"e_gizo",n:"合意分割番頭"},{sp:"e_boss",n:"高在老重役",el:1},{sp:"e_gizo",n:"被保険者期間の偽造屋",gd:1},
  {sp:"e_nabakari",n:"中高齢寡婦担当"},{sp:"e_sabizan",n:"未支給年金課長"}],
 /* 8 労一・社一 */
 [{sp:"e_sabizan",n:"統計課長"},{sp:"e_boss",n:"白書上司"},{sp:"e_gizo",n:"最賃監督"},
  {sp:"e_kacho",n:"労契法難物部長"},{sp:"e_nabakari",n:"社会保険史主任"},{sp:"e_gizo",n:"派遣法顧問",el:1},
  {sp:"e_nabakari",n:"育介法かぶれ"},{sp:"e_sabizan",n:"高齢者雇用課長"},{sp:"e_boss",n:"障害者雇用上司"},
  {sp:"e_sabizan",n:"社労士法事務員"},{sp:"e_gizo",n:"確定拠出番頭"},{sp:"e_kacho",n:"国保法工場長"},
  {sp:"e_nabakari",n:"介護保険担当"},{sp:"e_gizo",n:"労働経済顧問",el:1},{sp:"e_gizo",n:"労働組合法の偽造屋",gd:1},
  {sp:"e_nabakari",n:"男女雇用機会かぶれ"},{sp:"e_boss",n:"パート法上司"}]
];

/* ============================================================
   メタル敵(中毒の目玉): ごく低確率で出現。非常に硬い/高速逃走の代わりに
   莫大なXP/コインの大当たり。逃走ペナルティ無し(倒せなくても損しない)。
   ・rank/w(出現重み)・hp(硬さ)・turns(逃走までの猶予)・coin/xp(大当たり報酬)。
   ・上位ほど硬く・レアで・報酬が桁違い。金属光沢スプライトでメタル感。
   ・後方互換: 旧コードが {hp,turns} を上書きしても coin/xp 未指定は既定値へ。
   【必勝可能性(不変条件・N4)】撃破は1問正解=HP-1、猶予は毎回 turns-1。撃破判定は
   turns 減算より前なので「turns>=hp なら全問正解で必ず倒せる」。以前 M2/M3 は turns<hp で
   完全正解でも決して倒せない"理不尽な釣り餌"だった(倒せば大当たり表示なのに撃破不能)ため、
   全メタルで turns>=hp を保証。上位ほど猶予(turns-hp)が薄い=高精度を要求(=整えれば取れる)。 */
const METAL=[
 {id:"M0",sp:"coin",  n:"鋼の六法",        rank:"鋼",   w:60,hp:2,turns:3,coin:200, xp:80},
 {id:"M1",sp:"medal", n:"白銀の判例",      rank:"白銀",  w:28,hp:3,turns:3,coin:450, xp:160},
 {id:"M2",sp:"gachaball",n:"黄金の条文",   rank:"黄金",  w:9, hp:3,turns:3,coin:700, xp:240},
 {id:"M3",sp:"crown2",n:"虹光の法典",      rank:"虹",    w:3, hp:4,turns:4,coin:1500,xp:400}
];

/* 撃破マイルストーン(セッション累計・節目報酬) */
const MOB_MILESTONES=[
 {n:10,coin:80},
 {n:25,coin:200},
 {n:50,coin:500,ticket:1},
 {n:100,coin:1200,ticket:2}
];

/* ============================================================
   中ボス(手応えの階段): 各科目2体。雑魚より高HP=数問で撃破。
   ・その科目の代表論点(topic)に紐づく短い煽り(taunt)。
   ・hp=撃破に必要な正解数(1問1ダメージ)。tier順に強く。
   ・weak=弱点となる「攻撃の質」(ATKのkey)。合致すると追撃(+1ダメージ)。
     速さ(会心)は弱点にしない=定着(苦手克服/記憶/看破)を弱点に据える。
   ============================================================ */
const MIDBOSS=[
 /* 0 労働基準法 */
 [{sp:"bag",n:"割増賃金の番人",short:"割増番人",topic:"時間外・割増賃金",taunt:"残業代の計算、正しくできるかな?",hp:3,weak:"weak",weakLabel:"苦手克服"},
  {sp:"oni",n:"解雇予告の門番",short:"解雇門番",topic:"解雇予告(30日)",taunt:"予告なしでクビにできると思うか?",hp:4,weak:"memory",weakLabel:"記憶会心"}],
 /* 1 労働安全衛生法 */
 [{sp:"helm",n:"管理体制の鬼",short:"体制の鬼",topic:"安全衛生管理体制",taunt:"50人の壁、覚えたか?",hp:3,weak:"weak",weakLabel:"苦手克服"},
  {sp:"pill",n:"健診の番人",short:"健診番人",topic:"健康診断",taunt:"雇入れ時健診の項目、言えるか?",hp:4,weak:"memory",weakLabel:"記憶会心"}],
 /* 2 労災保険法 */
 [{sp:"ghost",n:"業務通勤の判定官",short:"判定官",topic:"業務・通勤災害",taunt:"この災害、業務か通勤か?",hp:3,weak:"precise",weakLabel:"誤り看破"},
  {sp:"fire",n:"給付基礎日額の魔",short:"日額の魔",topic:"給付基礎日額",taunt:"平均賃金の計算、逃がさんぞ",hp:4,weak:"memory",weakLabel:"記憶会心"}],
 /* 3 雇用保険法 */
 [{sp:"ghost",n:"受給資格の門番",short:"受給門番",topic:"受給資格・被保険者期間",taunt:"12か月の壁を越えられるか?",hp:3,weak:"weak",weakLabel:"苦手克服"},
  {sp:"bag",n:"基本手当日額の番人",short:"日額番人",topic:"基本手当・所定給付日数",taunt:"所定給付日数、そらで言えるか?",hp:4,weak:"memory",weakLabel:"記憶会心"}],
 /* 4 労働保険徴収法 */
 [{sp:"bag",n:"年度更新の取立",short:"年度更新",topic:"概算・確定保険料",taunt:"概算と確定、混ぜてやろうか",hp:3,weak:"precise",weakLabel:"誤り看破"},
  {sp:"daruma",n:"メリット制の鬼",short:"メリット鬼",topic:"メリット制",taunt:"料率の増減、追えるかな?",hp:4,weak:"memory",weakLabel:"記憶会心"}],
 /* 5 健康保険法 */
 [{sp:"pill",n:"標準報酬の番人",short:"標報番人",topic:"標準報酬月額",taunt:"等級区分、迷わせてやる",hp:3,weak:"weak",weakLabel:"苦手克服"},
  {sp:"ghost",n:"傷病手当金の魔",short:"傷手の魔",topic:"傷病手当金",taunt:"支給要件、4つ言えるか?",hp:4,weak:"memory",weakLabel:"記憶会心"}],
 /* 6 国民年金法 */
 [{sp:"sage",n:"保険料免除の門番",short:"免除門番",topic:"保険料免除・猶予",taunt:"法定免除と申請免除、区別つくか?",hp:3,weak:"precise",weakLabel:"誤り看破"},
  {sp:"daruma",n:"受給資格期間の番人",short:"期間番人",topic:"受給資格期間(10年)",taunt:"10年の壁、覚えているか?",hp:4,weak:"memory",weakLabel:"記憶会心"}],
 /* 7 厚生年金保険法 */
 [{sp:"king",n:"報酬比例の鬼",short:"比例の鬼",topic:"報酬比例部分",taunt:"計算式、そらで書けるか?",hp:3,weak:"weak",weakLabel:"苦手克服"},
  {sp:"oni",n:"在職老齢の番人",short:"在老番人",topic:"在職老齢年金",taunt:"支給停止額、計算してみろ",hp:4,weak:"memory",weakLabel:"記憶会心"}],
 /* 8 労一・社一 */
 [{sp:"wiz",n:"労働統計の魔",short:"統計の魔",topic:"労働統計・白書",taunt:"数字の海で溺れるがいい",hp:3,weak:"precise",weakLabel:"誤り看破"},
  {sp:"scroll",n:"労働契約法の門番",short:"労契門番",topic:"労働契約法",taunt:"判例法理、読み切れるか?",hp:4,weak:"memory",weakLabel:"記憶会心"}]
];
/* 中ボス出現の間隔: 雑魚をこの数だけ倒すと次の中ボスが登場(unlock緩め・テンポ優先) */
const MB_SPAWN_KILLS=5;

/* --- 純関数(DOM非依存・ui-battle から利用) --- */
function mobFoe(si,idx){
  const r=(typeof ENEMIES!=="undefined"&&ENEMIES[si])?ENEMIES[si]:null;
  if(!r||!r.length)return {sp:"skull",n:"謎の雑魚"};
  const i=((idx|0)%r.length+r.length)%r.length;
  return r[i];
}
function metalPick(seed){
  const list=(typeof METAL!=="undefined"&&METAL.length)?METAL
    :[{id:"M0",sp:"coin",n:"鋼の六法",rank:"鋼",w:1,hp:2,turns:3,coin:200,xp:80}];
  let tot=0;for(let i=0;i<list.length;i++)tot+=(list[i].w||1);
  let r=(typeof Math.random==="function"?Math.random():((Math.abs(seed|0)%100)/100))*tot;
  for(let i=0;i<list.length;i++){r-=(list[i].w||1);if(r<=0)return Object.assign({mi:i},list[i]);}
  return Object.assign({mi:0},list[0]);
}
function mobMilestone(kills){
  for(let i=0;i<MOB_MILESTONES.length;i++)if(MOB_MILESTONES[i].n===kills)return MOB_MILESTONES[i];
  return null;
}

/* ============================================================
   ベスティアリ(敵図鑑)記録 — 純関数(DOM非依存・ST を受ける)。
   撃破/遭遇のたびに ST.bestiary[key] を前進。旧セーブは {} で安全初期化。
   キー: 雑魚=beKey(si,idx) / メタル="M"+index。
   ・k=撃破数 / f=初討伐の日番号(todayNum) / s=遭遇回数(逃走含む)。
   ============================================================ */
function beKey(si,idx){return "e"+(si|0)+"_"+(idx|0);}
function bestiaryHit(ST,key,dayNum,killed){
  if(!ST||!key)return null;
  if(!ST.bestiary||typeof ST.bestiary!=="object"||Array.isArray(ST.bestiary))ST.bestiary={};
  const e=ST.bestiary[key]||(ST.bestiary[key]={k:0,f:-1,s:0});
  e.s=(e.s|0)+1;
  if(killed){e.k=(e.k|0)+1;if(!(e.f>=0))e.f=dayNum|0;}
  return e;
}
function beGet(ST,key){return (ST&&ST.bestiary&&ST.bestiary[key])||null;}
/* コレクション統計: 雑魚+メタル+科目ボス+中ボス を母数に、討伐済みを分子に */
function bestiaryStats(ST){
  let total=0,disc=0;
  for(let si=0;si<ENEMIES.length;si++){
    const row=ENEMIES[si];total+=row.length;
    for(let i=0;i<row.length;i++){const e=beGet(ST,beKey(si,i));if(e&&e.k>0)disc++;}
  }
  total+=METAL.length;
  for(let i=0;i<METAL.length;i++){const e=beGet(ST,"M"+i);if(e&&e.k>0)disc++;}
  if(typeof BOSSES!=="undefined"){
    total+=BOSSES.length;
    for(let i=0;i<BOSSES.length;i++)if(ST&&ST.eKill&&ST.eKill[i])disc++;
  }
  if(typeof MIDBOSS!=="undefined"){
    for(let si=0;si<MIDBOSS.length;si++){
      total+=MIDBOSS[si].length;
      const done=(ST&&ST.midboss&&ST.midboss[si])||0;disc+=Math.min(done,MIDBOSS[si].length);
    }
  }
  return {total,disc,pct:total?Math.round(disc/total*100):0};
}
function bestiaryPct(){return bestiaryStats(typeof ST!=="undefined"?ST:{}).pct;}

/* --- 中ボス純関数(DOM非依存) --- */
function midbossRoster(si){const r=(typeof MIDBOSS!=="undefined"&&MIDBOSS[si])?MIDBOSS[si]:null;return r||[];}
function midbossCount(si){return midbossRoster(si).length;}
/* stage=撃破済みの中ボス数 → 次に出現する中ボス(いなければnull)。tierを付与 */
function midbossNext(si,stage){
  const r=midbossRoster(si),s=stage|0;
  if(s<0||s>=r.length)return null;
  return Object.assign({tier:s},r[s]);
}
/* 中ボス撃破報酬(純関数・倍率は呼び出し側で適用)。tierが上=まとまった報酬 */
function midbossReward(mb,loop){
  const tier=(mb&&mb.tier)|0,lp=Math.max(1,loop|0);
  return {coin:(120+tier*90)*lp,xp:45+tier*25,chest:1,ticket:tier>=1?1:0};
}
/* 弱点判定: 攻撃の質(ATK.key)が中ボスの弱点に合致すれば追撃。速さ(crit)は弱点にしない方針 */
function mbWeakHit(mb,ctx){
  if(!mb||!mb.weak||!ctx)return false;
  return !!(ctx.ak&&ctx.ak.key===mb.weak);
}
if(typeof window!=="undefined"){
  window.ENEMIES=ENEMIES;window.METAL=METAL;window.MOB_MILESTONES=MOB_MILESTONES;
  window.mobFoe=mobFoe;window.metalPick=metalPick;window.mobMilestone=mobMilestone;
  window.beKey=beKey;window.bestiaryHit=bestiaryHit;window.beGet=beGet;
  window.bestiaryStats=bestiaryStats;window.bestiaryPct=bestiaryPct;
  window.MIDBOSS=MIDBOSS;window.MB_SPAWN_KILLS=MB_SPAWN_KILLS;
  window.midbossRoster=midbossRoster;window.midbossCount=midbossCount;window.midbossNext=midbossNext;
  window.midbossReward=midbossReward;window.mbWeakHit=mbWeakHit;
}
