"use strict";
/* ============================================================
   ui-gold.js — N3: 本試験環境ゲージ / ゴールドモード
   殿の声:「装備が整ったら、100%の表示とゴールドモードになれるように」

   ・本試験環境ゲージ examEnvPct(): 装備の充実度を0〜100%で表す到達度。
     総合戦力 playerPower と 装備コレクション(所持/強化/凸/セット)を重み付き合成。
     「最強クラスの装備が揃い切った=本番想定に到達」を1つの数値に見える化。
   ・100%=ゴールドモード isGold(): 金色テーマ(body.gold-mode)・称号・一度きりの祝福・
     本試験モード/年度別過去問への「本番同等条件」ラベル解放。
   ・到達の記号であって、正解を自動化しない/戦闘判定を歪めない(装備無効の実力勝負は不変)。

   すべて ST から都度算出=新セーブフィールドは祝福フラグ ST.goldSeen のみ。
   旧セーブは goldSeen=0(未祝福)・gold未到達=通常で安全初期化(engine.sanitizeState)。
   依存(実行時 typeof 参照。gear-power/data-gear の後にロード):
     playerPower / totalToppaAll / activeSets / nearestSet / enhCap / enhLv /
     collectCount / ITEMS / ST。未ロード時も 0/空でクラッシュしない。
   ============================================================ */

/* ---------- ゲージの重み(合計100)と満点しきい値 ----------
   到達には「収集を広げ・装備を鍛え上げ・凸を重ね・セットを組み・戦力を積む」全てが要る。
   1項目でも欠ければ100%=ゴールドには届かない=極めた者だけの記号。 */
const EXAM_ENV_W={coll:30,equip:25,toppa:20,set:15,power:10};
const EXAM_ENV_COLL_GOAL=0.85; /* 収集85%で満点(完全コンプでなくても最強クラス網羅で可) */
const EXAM_ENV_TOPPA_GOAL=16;  /* 凸合計16で満点(装備を平均4凸相当まで限界突破) */
const EXAM_ENV_POWER_GOAL=520; /* 本番想定の総合戦力(この値以上で満点) */
const EXAM_ENV_LABEL={coll:"装備コレクション",equip:"装備の強化",toppa:"限界突破(凸)",set:"セット効果",power:"総合戦力"};

function _eeFill(v){return v<0?0:(v>1?1:v);}
/* 各要素の充足度(0..1)と配点。UI・テスト・導線で共有する単一の真実 */
function examEnvParts(){
  if(typeof ST==="undefined")return [];
  const total=(typeof ITEMS!=="undefined"&&ITEMS.length)?ITEMS.length:1;
  const owned=(typeof collectCount==="function")?collectCount():0;
  const coll=_eeFill((owned/total)/EXAM_ENV_COLL_GOAL);
  /* 装備中4スロットの強化フル度(各スロット lv/上限、装備なしは0) */
  const slots=["w","a","c","t"];let ef=0;
  for(const sl of slots){
    const id=ST.eq&&ST.eq[sl];
    if(id&&typeof enhCap==="function"){
      const cap=enhCap(id)||1,lv=(typeof enhLv==="function")?enhLv(id):0;
      ef+=_eeFill(lv/cap);
    }
  }
  const equip=_eeFill(ef/slots.length);
  const tp=(typeof totalToppaAll==="function")?totalToppaAll():0;
  const toppa=_eeFill(tp/EXAM_ENV_TOPPA_GOAL);
  /* セット: 発動中があれば満点。無くても最も揃ったセットの充足で部分点(揃える動機) */
  let set=0;
  if(typeof activeSets==="function"&&activeSets().length>0)set=1;
  else if(typeof nearestSet==="function"){const n=nearestSet();if(n&&(n.have+n.miss)>0)set=_eeFill((n.have/(n.have+n.miss))*0.7);}
  const pw=(typeof playerPower==="function")?playerPower():0;
  const power=_eeFill(pw/EXAM_ENV_POWER_GOAL);
  return [
    {key:"coll",label:EXAM_ENV_LABEL.coll,fill:coll,w:EXAM_ENV_W.coll},
    {key:"equip",label:EXAM_ENV_LABEL.equip,fill:equip,w:EXAM_ENV_W.equip},
    {key:"toppa",label:EXAM_ENV_LABEL.toppa,fill:toppa,w:EXAM_ENV_W.toppa},
    {key:"set",label:EXAM_ENV_LABEL.set,fill:set,w:EXAM_ENV_W.set},
    {key:"power",label:EXAM_ENV_LABEL.power,fill:power,w:EXAM_ENV_W.power}
  ];
}
/* 本試験環境ゲージの到達率(0..100の整数) */
function examEnvPct(){
  let v=0;for(const p of examEnvParts())v+=p.fill*p.w;
  return Math.max(0,Math.min(100,Math.round(v)));
}
/* 100%到達=ゴールドモード(=本番同等条件を解放する準備完了の証) */
function isGold(){return examEnvPct()>=100;}
/* 100%まで残り(%) */
function examEnvRemain(){return Math.max(0,100-examEnvPct());}
/* 次に伸ばすと最も効く項目(未達時の導線用)。無ければ null */
function examEnvNext(){
  let best=null;
  for(const p of examEnvParts()){
    const gap=(1-p.fill)*p.w;
    if(gap>0.4&&(!best||gap>best.gap))best={label:p.label,gap};
  }
  return best;
}

/* ---------- ゲージUI(バー+%) ---------- */
/* shop・ホーム共通。opt.compact でホーム用に一回り小さく。
   XSS: 生値は入れない(数値と固定ラベルのみ・labelは定数由来) */
function examEnvGaugeHtml(opt){
  opt=opt||{};
  const pct=examEnvPct(),gold=pct>=100,remain=100-pct;
  const nx=gold?null:examEnvNext();
  const title=gold
    ?`🏆 本試験環境 <b class="ee-pct">100%</b> <span class="gold-badge">ゴールドモード</span>`
    :`🎯 本試験環境 <b class="ee-pct">${pct}%</b>`;
  const sub=gold
    ?`装備を極めた ─ 本試験と<b>同等の環境</b>が整った。本番同等条件で挑める。`
    :`あと <b>${remain}%</b> で本試験環境(ゴールド)に到達${nx?` ─ 次に伸ばすなら「<b>${nx.label}</b>」`:""}。装備を極めれば本番同等条件が解放される。`;
  return `<div class="exam-env${gold?" gold":""}">
    <div class="ee-top"><span>${title}</span></div>
    <div class="ee-bar"><i style="width:${pct}%"></i></div>
    <div class="ee-sub">${sub}</div>
  </div>`;
}
/* 本試験モード/年度別過去問に添える解放ラベル(ゴールド時のみ) */
function goldReadyBadge(){return isGold()?`<span class="gold-badge">🏆本試験環境</span>`:"";}

/* ---------- 金色テーマの適用(body.gold-mode) ---------- */
/* 各画面描画時に呼ぶ。isGold の変化に追従して付け外し(判定・出題には一切触れない) */
function applyGoldTheme(){
  if(typeof document==="undefined"||!document.body||!document.body.classList)return;
  const g=isGold();
  document.body.classList.toggle("gold-mode",g);
}

/* ---------- 到達演出(一度きりの祝福) ---------- */
/* isGold かつ未祝福なら1回だけ祝う。goldSeen を立てて二度目以降は静かに通常運転。
   演出は既存 confetti/flash(reduced-motion で自動的に静止) + 汎用オーバーレイのみ。 */
function goldMaybeCelebrate(){
  if(typeof ST==="undefined"||!isGold()||ST.goldSeen)return false;
  ST.goldSeen=1;
  if(typeof saveST==="function")saveST();
  applyGoldTheme();
  try{if(typeof flash==="function")flash("#FFE59A",220);}catch(e){}
  try{if(typeof confetti==="function")confetti(44);}catch(e){}
  try{if(typeof SFX!=="undefined"&&SFX.levelup)SFX.levelup();}catch(e){}
  const body=`<div style="text-align:center">
    <div style="font-size:44px;line-height:1">🏆</div>
    <div class="dot" style="font-size:22px;font-weight:900;color:#B8860B;margin:6px 0">ゴールドモード解放</div>
    <div style="font-size:12.5px;font-weight:800;line-height:1.6;color:#5A3A00">
      装備を極めた者よ。本試験と<b>同等の環境</b>が整った。<br>
      称号<b>【本試験環境の到達者】</b>を授ける。<br>
      これより<b>本試験モード・年度別過去問</b>を<b>本番同等条件</b>で挑める。
    </div>
    <div style="font-size:10.5px;color:#8A6A00;margin-top:8px">※ゴールドは準備完了の証。実力勝負(装備無効)の中身は変わらない。</div>
    <button class="btn mode-btn yellowbg" style="margin-top:12px" onclick="hideOvl()">本番へ挑む準備ができた</button>
  </div>`;
  if(typeof showOvl==="function")showOvl(body);
  return true;
}
/* 画面描画の共通フック: テーマ追従 → 未祝福なら祝う。home/shop の末尾で呼ぶ */
function goldSync(){applyGoldTheme();goldMaybeCelebrate();}

if(typeof window!=="undefined"){
  window.EXAM_ENV_W=EXAM_ENV_W;
  window.examEnvParts=examEnvParts;window.examEnvPct=examEnvPct;window.isGold=isGold;
  window.examEnvRemain=examEnvRemain;window.examEnvNext=examEnvNext;
  window.examEnvGaugeHtml=examEnvGaugeHtml;window.goldReadyBadge=goldReadyBadge;
  window.applyGoldTheme=applyGoldTheme;window.goldMaybeCelebrate=goldMaybeCelebrate;window.goldSync=goldSync;
}
