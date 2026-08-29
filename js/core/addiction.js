"use strict";
/* ============================================================
   core/addiction.js — M6: 中毒フック(やめられない)純ロジック層
   ・ドロップ&レア(射幸性・課金なし)/ ニアミス可視化 / 連続日数ストリーク /
     セッション締め(今日の戦果)/ 段階的な強化実感(今日の成長)。
   ・返すのは 数値 / 文字列 / セーブ更新 のみ(DOM非依存)。演出は呼び出し側(fx.js)。
   ・学習の芯(#42 SRS/retrieval/同日連打非習得)には一切触れない。
     ドロップ報酬は「答えを当てる」機能ではない=ゲーム内資源(強化石/チケット/装備)のみ。
   ・生値を混ぜる表示は必ず esc() で無害化(XSS防止)。engine/game-data の
     グローバル(ST/stats/matGain/grantItem/gachaPool/RAR/playerPower…)は実行時参照。
   ・後方互換: 旧セーブは dropPity=0 / pow 空 で安全初期化(engine.sanitizeState)。
   ============================================================ */

/* ===== (C) 連続日数ストリーク ===== */
/* 節目(連続◯日)で追加報酬。ログインボーナスとは別枠の「継続そのものへの報酬」。
   途切れて再挑戦したら同じ節目を再獲得できる=罰しない設計(checkDaily が exact-match で付与)。 */
const STREAK_MILES=[
 {d:3, coins:150,            label:"3日"},
 {d:7, coins:250,tickets:1,  label:"7日"},
 {d:14,coins:500,tickets:2,chest:1,label:"14日"},
 {d:30,coins:1000,ssrT:1,chest:1,   label:"30日"}
];
function streakReward(days){for(const m of STREAK_MILES)if(m.d===(days|0))return m;return null;}
function streakNext(days){for(const m of STREAK_MILES)if(m.d>(days|0))return m;return null;}
function streakInfo(days){days=days|0;const next=streakNext(days);return {days,next,toNext:next?next.d-days:0};}

/* ===== (A) ドロップ&レア(あと1体で出るかも) ===== */
/* pity メーター: 撃破ごとに ST.dropPity++。低確率でレア(強化石まとめ取り)。
   DROP_CAP 体まで出なければ確定(=天井)。天井到達時のみ「装備ドロップ」も混ぜる。
   ※報酬はゲーム内資源のみ・課金なし。速度や正誤の"当て"には無関与。 */
const DROP_CAP=40;
function dropChance(pity,luck){return Math.min(0.6,0.02+(pity|0)*0.006+((luck|0)||0)*0.0002);}
function dropMeterInfo(ST){const p=(ST&&ST.dropPity|0)||0;const to=Math.max(0,DROP_CAP-p);return {pity:p,cap:DROP_CAP,toCap:to,near:to<=3};}
/* rareDropRoll(ST[,rnd]): 撃破1回分。null=ドロップなし / obj=ドロップ内容。
   rnd はテスト用の注入RNG(省略時 Math.random)。ST.dropPity を必ず前進させる。 */
function rareDropRoll(ST,rnd){
  if(!ST)return null;
  const r=(typeof rnd==="function")?rnd:Math.random;
  ST.dropPity=((ST.dropPity|0)||0)+1;
  const luck=(typeof stats==="function")?(stats().luck||0):0;
  const forced=ST.dropPity>=DROP_CAP;
  if(!forced&&r()>=dropChance(ST.dropPity,luck))return null;
  ST.dropPity=0;
  if(forced){
    /* 天井: 確定レア。装備(rar1〜2)+強化石。装備は grantItem 経由(ダブりは既存仕様で凸/コイン化) */
    let item=null;
    if(typeof gachaPool==="function"){
      const pool=gachaPool(2).concat(gachaPool(1));
      if(pool.length){item=pool[Math.floor(r()*pool.length)];if(typeof grantItem==="function")grantItem(item.id);}
    }
    const n=6;if(typeof matGain==="function")matGain(n);
    const rn=(item&&typeof RAR!=="undefined"&&RAR[item.rar])?RAR[item.rar].n:"";
    return {type:item?"item":"mat",item:item||null,mat:n,rar:item?item.rar:0,big:true,
      label:item?("【"+rn+"】"+item.name+" +石"+n):("🪙強化石×"+n)};
  }
  /* 通常のレアドロップ: 強化石まとめ取り(たまに大量=虹演出)。tickets/coins は付けない
     (既存スモークの厳密アサートを揺らさない=決定性を守るため)。 */
  const big=r()<0.2;
  const n=big?(6+Math.floor(r()*3)):(3+Math.floor(r()*2));
  if(typeof matGain==="function")matGain(n);
  return {type:"mat",mat:n,big,label:(big?"✨大量ドロップ! ":"")+"🪙強化石×"+n};
}

/* ===== (B) ニアミス(達成直前の可視化) ===== */
/* あと1問でレベルアップ?(次レベルまで1問分のXP=約14以内) */
function lvNearMiss(){
  if(typeof ST==="undefined"||typeof xpForNext!=="function")return false;
  const need=xpForNext(ST.lv)-ST.xp;return need>0&&need<=14;
}
/* 次の撃破マイルストーン(セッション内 G.mobKills 基準)。あと◯体で節目報酬。 */
function milestoneNext(kills){
  kills=kills|0;
  if(typeof MOB_MILESTONES==="undefined")return null;
  for(const m of MOB_MILESTONES)if(m.n>kills)return Object.assign({toGo:m.n-kills},m);
  return null;
}

/* ===== (E) 段階的な強化実感(今日の成長) ===== */
/* 当日の開始時点(その日の最初の checkDaily)の 戦力/習得数 を基準に保存。
   以後 playerPower()/masteredCount() との差=「今日どれだけ強くなったか」。 */
function powSnap(ST,dayStr){
  if(!ST)return;
  if(typeof ST.pow!=="object"||ST.pow===null)ST.pow={d:"",p:0,m:0};
  ST.pow.d=String(dayStr||"");
  ST.pow.p=(typeof playerPower==="function")?playerPower():0;
  ST.pow.m=(typeof masteredCount==="function")?masteredCount():0;
}
function powDelta(ST){
  if(!ST||typeof ST.pow!=="object"||ST.pow===null)return {p:0,m:0};
  const p=((typeof playerPower==="function")?playerPower():0)-(ST.pow.p|0);
  const m=((typeof masteredCount==="function")?masteredCount():0)-(ST.pow.m|0);
  return {p:Math.max(0,p),m:Math.max(0,m)};
}

/* ===== (D) セッション締め(今日の戦果) ===== */
/* ページを開いてからの累計(非永続=1セッション)。バトル終了ごとに sessAdd で合流。 */
const SESS={kills:0,combo:0,coins:0,xp:0,drops:0,mast:[]};
function sessAdd(g){
  if(!g)return;
  SESS.kills+=((g.mobKills|0)||(g.kills|0)||0);
  SESS.combo=Math.max(SESS.combo,g.bestCombo|0);
  SESS.coins+=(g.coinsEarned|0);
  SESS.xp+=(g.xpEarned|0);
  SESS.drops+=(g.dropCount|0);
}
function sessMastered(text){
  if(!text)return;const s=String(text).slice(0,22);
  if(SESS.mast.indexOf(s)<0&&SESS.mast.length<8)SESS.mast.push(s);
}
function sessDrop(){SESS.drops++;}
function sessHas(){return SESS.kills>0||SESS.coins>0||SESS.xp>0||SESS.mast.length>0;}
function sessReset(){SESS.kills=0;SESS.combo=0;SESS.coins=0;SESS.xp=0;SESS.drops=0;SESS.mast.length=0;}
/* 結果画面の「今日の戦果 + 続きは次で」カード(HTML文字列・生値は esc)。 */
function sessSummaryHtml(){
  if(!sessHas())return "";
  const e=(typeof esc==="function")?esc:(s=>String(s));
  const mast=SESS.mast.length
    ?`<div class="sess-mast">🧠 定着した論点 <b>${SESS.mast.length}</b>件<br>${SESS.mast.map(x=>"・"+e(x)).join("<br>")}</div>`
    :`<div class="sess-mast dim">🧠 定着は別日にもう一度正解で確定(今日の正解が土台に)</div>`;
  return `<div class="sess-card">
    <div class="sess-h">📒 今日の戦果</div>
    <div class="sess-grid">
      <div><b>${SESS.kills}</b><span>撃破</span></div>
      <div><b>${SESS.combo}</b><span>最高コンボ</span></div>
      <div><b>${SESS.coins}</b><span>コイン</span></div>
      <div><b>${SESS.xp}</b><span>XP</span></div>
    </div>
    ${SESS.drops>0?`<div class="sess-drop">💎 ドロップ ${SESS.drops}回</div>`:""}
    ${mast}
    <div class="sess-next">▶ 続きは次で。1コースだけでも「昨日の自分」を超えていく</div>
  </div>`;
}

/* ===== 表示部品(ホーム用・HTML文字列) ===== */
/* ストリークカード: 連続◯日 + 次の節目まで + 途切れ注意の軽い表示 */
function streakCardHtml(){
  if(typeof ST==="undefined")return "";
  const info=streakInfo(ST.days),d=info.days;
  if(d<=0)return "";
  const hot=d>=3;
  const next=info.next;
  const nextLine=next
    ?`次の<b>${next.label}</b>報酬まで あと<b>${info.toNext}</b>日`
    :`最高段階に到達! この連続を守り抜け`;
  const risk=hot?`<span class="strk-risk">1日空くとリセット — 今日ももう来た、えらい!</span>`:"";
  return `<div class="strk-card${hot?" hot":""}">
    <span class="strk-flame">🔥</span>
    <span class="strk-body"><b>連続 ${d} 日</b>プレイ中!<br><small>${nextLine}</small>${risk}</span>
  </div>`;
}
/* 今日の成長バッジ(戦力/習得の伸び)。伸びが0なら控えめに促す */
function powDeltaHtml(){
  if(typeof ST==="undefined")return "";
  const dl=powDelta(ST);
  if(dl.p<=0&&dl.m<=0)return "";
  const parts=[];
  if(dl.p>0)parts.push(`戦力 <b>+${dl.p}</b>`);
  if(dl.m>0)parts.push(`習得 <b>+${dl.m}</b>`);
  return `<div class="grow-badge">📈 今日ここまでの成長 ｜ ${parts.join(" ・ ")} <small>昨日の自分を追い越し中</small></div>`;
}
/* 修行HUD用: レアドロップ天井メーター(あと◯体でレア確定) */
function dropMeterLine(){
  if(typeof ST==="undefined")return "";
  const d=dropMeterInfo(ST);
  return `<div class="drop-meter${d.near?" near":""}">💎 レアドロップまで あと<b>${d.toCap}</b>体 <i style="width:${Math.round(d.pity/d.cap*100)}%"></i></div>`;
}
/* 修行HUD用: 次の撃破マイルストーン(あと◯体で+報酬) */
function milestoneNearLine(kills){
  const m=milestoneNext(kills);
  if(!m)return "";
  const rw=(m.coin?"+"+m.coin+"コイン":"")+(m.ticket?" +チケ"+m.ticket:"");
  return `<div class="ms-near">🎁 あと<b>${m.toGo}</b>体で ${m.n}体撃破ボーナス(${rw})</div>`;
}

if(typeof window!=="undefined"){
  window.STREAK_MILES=STREAK_MILES;window.streakReward=streakReward;window.streakNext=streakNext;window.streakInfo=streakInfo;
  window.DROP_CAP=DROP_CAP;window.dropChance=dropChance;window.dropMeterInfo=dropMeterInfo;window.rareDropRoll=rareDropRoll;
  window.lvNearMiss=lvNearMiss;window.milestoneNext=milestoneNext;
  window.powSnap=powSnap;window.powDelta=powDelta;
  window.SESS=SESS;window.sessAdd=sessAdd;window.sessMastered=sessMastered;window.sessDrop=sessDrop;window.sessHas=sessHas;window.sessReset=sessReset;window.sessSummaryHtml=sessSummaryHtml;
  window.streakCardHtml=streakCardHtml;window.powDeltaHtml=powDeltaHtml;window.dropMeterLine=dropMeterLine;window.milestoneNearLine=milestoneNearLine;
}
