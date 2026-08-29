"use strict";
/* ============================================================
   engine.js — ゲームロジック(UI非依存)
   状態は gameState(ST)に一元管理。saveDataVersion で将来移行可能。
   ============================================================ */

const SAVE_VERSION=5;
const KEY="sr-quest-v3";
const OLD_KEY="sr-quest-v2";

/* ---------- 状態 ---------- */
function defaultState(){return {
  v:SAVE_VERSION,
  q:{},                       /* 問題別: {c,w,ng,s,bm, box,due,la} */
  coins:0,tickets:0,ssrT:0,potions:0,
  xp:0,lv:1,reb:0,            /* レベル・転生 */
  inv:{t1:1},eq:{w:"w0",a:null,c:null,t:"t1"},
  badges:{},loop:1,clears:0,cleared:false,trueWin:0,
  survBest:0,maxCombo:0,totalC:0,totalW:0,chests:0,
  mobKills:0,metalKills:0,midKills:0, /* 雑魚ラッシュ累計撃破(旧セーブは0初期化) */
  midboss:{},                     /* 中ボス階段の進捗 {科目i:撃破済み数}(旧セーブは{}) */
  bestiary:{},                    /* 敵図鑑の撃破記録 {key:{k撃破数,f初討伐日,s遭遇数}}(旧セーブは{}) */
  cnt:{crit:0,rev:0,chest:0,pull:0,sp:0},  /* ステータス素材カウンタ */
  lastDay:"",days:0,loginTotal:0,tsLast:0,
  dq:{d:"",cor:0,ans:0,cl:[false,false,false,false]},
  story:{},                   /* 見たストーリーid */
  zk:{},                      /* 法律図鑑解放キー */
  eSeen:{},eKill:{},          /* 敵図鑑 */
  gPity:0,gTotal:0,           /* ガチャ天井カウンタ・累計 */
  gGauge:0,gFreeDay:"",       /* ガチャゲージ(正解で蓄積→チケ化)・デイリー無料ガチャの消費日 */
  gLog:[],                    /* ガチャ排出履歴。新しい順、直近30件のみ保持。{rar,id?,coins?,potion?,isNew?} */
  hist:{},                    /* 日別プレイ履歴 {day:{a,c}} */
  cases:{},                   /* 事件簿進行 {caseId:{ph,ev:{},cleared}} */
  mock:{runs:0,best:0,clears:0}, /* 簡易模試の記録 */
  wq:{wk:0,a:0,c:0,d:0,ld:"",cl:[false,false,false]}, /* 週間チャレンジ */
  msq:{ch:0,step:0,tgt:null,done:0}, /* メインクエスト進行 */
  /* N2: 年度別過去問「裏面モード」の成績。{年キー(R6等):{best正解数,bestPct最高正答率,plays挑戦回数}}。
     メインクエストクリア後に解放。旧セーブは{}で安全初期化(nendoUnlockedはui-nendo.js)。 */
  nendo:{},
  /* 冒頭アーク(簡単クエスト→試験の悪魔に敗北→鍛えて挑む)。旧セーブは全0で安全初期化。
     easy=導入クエスト突破 / met=悪魔と対峙済 / win=悪魔撃破回数(合格の擬似体験) / best=7問中の最高正解数 */
  intro:{easy:0,met:0,win:0,best:0},
  /* #68 クイックスタート: on=この保存はタイトルの「すぐ冒険を始める」で始まった /
     run=いま3問セットの最中 / rounds=3問セットの消化数 / lv0=セット開始時のLv(報酬保証の判定用)。
     旧セーブは全0で安全初期化。 */
  qs:{on:0,run:0,rounds:0,lv0:1},
  /* #68 計測イベント(端末内のみ・外部送信なし) {イベント名:{t,n,v}} */
  ev:{},
  party:{}, /* 加入した仲間 {cpId:1} */
  office:{lv:0,fac:{},claim:0,trust:{}}, /* 事務所の発展 {lv,fac:{facId:段階},claim:最終顧問料受取日,trust:{cpId:信頼pt}}(旧セーブは穴埋め) */
  ach:{}, /* 解放済み実績 {achId:1} */
  enh:{}, /* 装備の強化レベル(+N) {itemId: 0..enhCap}。素材+コインで shop から上げる(M4) */
  toppa:{}, /* 限界突破(凸) {itemId: 0..TOPPA_MAX}。ガチャのダブりで上限拡張+代表stat+1(M4)。旧セーブは{} */
  mat:0, /* 強化石(強化の素材)。敵撃破ドロップ・ダブり凸で貯まる(M4)。旧セーブは0 */
  goldSeen:0, /* N3: ゴールドモード(本試験環境100%)の到達祝福を見せたか。旧セーブは0(未祝福)で安全 */
  dropPity:0, /* M6: レアドロップ天井カウンタ(撃破ごと+1・レア出現で0)。旧セーブは0 */
  pow:{d:"",p:0,m:0}, /* M6: 当日開始時点の戦力/習得(「今日の成長」基準)。旧セーブは空で安全初期化 */
  /* opt: mute=SE個別ON-OFF(既存) / bgm=BGM個別ON-OFF / bgmVol・seVol=音量(0..1)
     focus=集中モード(主旋律を弱める) / lowData=省データ(密度レイヤー省略) */
  opt:{mute:false,beginner:false,bgm:false,big:false,skk:true,bgmVol:0.7,seVol:0.8,focus:false,lowData:false,course:"normal",zf:true},
  /* S4(A): 直近に出した問題IDのリング(新しいものが末尾)。次の出題で"避ける"ためだけに使う。
     学習履歴(ST.q)とは完全に別物=採点/SRS/報酬には一切影響しない。旧セーブは[]で安全。 */
  rq:[],
  /* bt: 中断された進行中バトルのスナップショット。{g:戦闘状態, d:保存日} か null。
     ホームに「再開する」を出すためだけに使う。復元対象は単体で完結するモードのみで、
     物語 encounter や事件簿の戦闘は含めない(ui-battle.js の btSave を参照)。 */
  bt:null,
  /* mm: MACHIMON(街づくり×マチモン育成モード)の状態。js/machimon/core/state.js が持ち主。
     既存モードとは独立し、追加するセーブキーはこの1つだけ(既存の挙動・セーブを壊さない)。
     学習履歴 ST.q は両モードで共有する=どちらで解いても同じ記憶が育つ。
     読み込み順の都合で MM 未定義のことがあるため、その場合は null にして sanitize で補完する。 */
  mm:(typeof MM!=="undefined"&&MM.state)?MM.state.defaults():null,
  /* sq: 物語エンジン(js/story/*)の進行状態。旧セーブに無ければ既定で補完(起動不能にしない)。
     既存キーとは独立=本編物語は sq に閉じる。深い正規化は SRStory.sanitizeSq が担う */
  sq:{ideo:{},rel:{},ev:{},flags:{},quests:{},seen:{},ending:null,resume:null,chapter:"",ver:1}
};}
let ST=defaultState();
window.gameState=ST; /* 一元管理の公開名 */

/* ---------- 保存(localStorage / window.storage フォールバック) ---------- */
let saveBusy=false,saveQueued=false;
function lsOK(){try{localStorage.setItem("__t","1");localStorage.removeItem("__t");return true;}catch(e){return false;}}
const USE_LS=lsOK();
function safeParse(raw){
  /* prototype pollution 対策: 危険キーを reviver で落とす */
  return JSON.parse(raw,(k,v)=>(k==="__proto__"||k==="constructor"||k==="prototype")?undefined:v);
}
async function loadST(){
  try{
    let raw=null;
    if(USE_LS){raw=localStorage.getItem(KEY)||null;}
    /* window.storage はホスト側が用意する任意のフォールバック。未提供の環境が普通なので、
       存在確認なしに触ると localStorage 不可の端末で必ず例外になる(iOSプライベートブラウズ等)。 */
    else if(window.storage){const r=await window.storage.get(KEY,false);raw=r&&r.value||null;}
    if(raw){
      const parsed=safeParse(raw);
      /* v3→v4: 構造互換だが、万一に備え移行前の生データを一度だけバックアップ */
      if((parsed.v||0)<4&&USE_LS){try{if(!localStorage.getItem(KEY+"-bak"))localStorage.setItem(KEY+"-bak",raw);}catch(e){}}
      ST=Object.assign(defaultState(),parsed);
    }
    else{
      /* 旧バージョン(v2)からの移行 */
      let old=null;
      if(USE_LS){const o=localStorage.getItem(OLD_KEY);if(o)old=safeParse(o);}
      else{try{const r=await window.storage.get(OLD_KEY,false);if(r&&r.value)old=safeParse(r.value);}catch(e){}}
      if(old)ST=migrateV2(old);
    }
  }catch(e){console.warn("ロード失敗(初期状態で開始):",e);}
  if(ST.v!==SAVE_VERSION){ST.v=SAVE_VERSION;} /* 将来: v毎の migrate をここに追加 */
  sanitizeState();
  muted=!!(ST.opt&&ST.opt.mute);
  if(typeof AudioMgr!=="undefined")AudioMgr.applyFromState(); /* 音量/モードをセーブから反映 */
  window.gameState=ST;
}
/* ---------- セーブデータ検証(欠損・NaN・異常値を安全な値に補正) ---------- */
function numOr(v,def,min,max){
  v=Number(v);if(!Number.isFinite(v))v=def;
  return Math.min(max,Math.max(min,Math.round(v)));
}
/* 0〜1 の小数(音量など)を丸めずにクランプ。未定義・NaN は既定値 */
function fracOr(v,def){v=Number(v);if(!Number.isFinite(v))v=def;return v<0?0:(v>1?1:v);}
function sanitizeState(){
  const D=defaultState();
  for(const k of ["q","inv","eq","badges","cnt","dq","story","zk","eSeen","eKill","hist","cases","mock","wq","msq","party","office","ach","enh","toppa","opt","midboss","intro","bestiary","pow","nendo","sq","qs","ev"]){
    if(typeof ST[k]!=="object"||ST[k]===null||Array.isArray(ST[k]))ST[k]=D[k];
  }
  /* sq(物語進行)の深い正規化は SRStory へ委譲(未ロードなら object 保証のみで安全) */
  if(typeof SRStory!=="undefined"&&SRStory.sanitizeSq){ST.sq=SRStory.sanitizeSq(ST.sq);}
  for(const k in D.cnt)ST.cnt[k]=numOr(ST.cnt[k],0,0,1e9);
  for(const k in D.mock)ST.mock[k]=numOr(ST.mock[k],0,0,1e9);
  if(!Array.isArray(ST.wq.cl)||ST.wq.cl.length!==WEEKLY.length)ST.wq.cl=WEEKLY.map(()=>false);
  for(const k of ["wk","a","c","d"])ST.wq[k]=numOr(ST.wq[k],0,0,1e9);
  if(typeof ST.wq.ld!=="string")ST.wq.ld="";
  if(typeof ST.opt.bgm!=="boolean")ST.opt.bgm=false;
  if(typeof ST.opt.big!=="boolean")ST.opt.big=false;
  ST.msq.ch=numOr(ST.msq.ch,0,0,9);ST.msq.step=numOr(ST.msq.step,0,0,2);ST.msq.done=ST.msq.done?1:0;
  /* 冒頭アーク進行(旧セーブに欠けていれば全0で安全初期化) */
  ST.intro.easy=ST.intro.easy?1:0;ST.intro.met=ST.intro.met?1:0;
  ST.intro.win=numOr(ST.intro.win,0,0,99999);
  ST.intro.best=numOr(ST.intro.best,0,0,(typeof DEMON_CFG!=="undefined"?DEMON_CFG.n:7));
  for(const id in ST.party){if(!CP[id])delete ST.party[id];else ST.party[id]=1;}
  if(typeof ST.office.fac!=="object"||ST.office.fac===null)ST.office.fac={};
  for(const id in ST.office.fac){if(!FAC[id])delete ST.office.fac[id];else ST.office.fac[id]=numOr(ST.office.fac[id],0,0,3);}
  ST.office.lv=numOr(ST.office.lv,0,0,4);
  /* D2: 顧問料(放置収益)の最終受取日・仲間の信頼度。旧セーブは穴埋め(不正窓口・過大信頼を安全化)。
     claim は 0/未定義/未来 を「今日」に補正=旧セーブでも初回に過剰な放置収益が発生しない */
  if(typeof ST.office.trust!=="object"||ST.office.trust===null||Array.isArray(ST.office.trust))ST.office.trust={};
  for(const id in ST.office.trust){if(!CP[id])delete ST.office.trust[id];else ST.office.trust[id]=numOr(ST.office.trust[id],0,0,999999);}
  {const _tdn=todayNum();ST.office.claim=(ST.office.claim>0)?numOr(ST.office.claim,_tdn,0,_tdn):_tdn;}
  if(typeof ACHIEVEMENTS!=="undefined"){const aids=new Set(ACHIEVEMENTS.map(a=>a.id));for(const id in ST.ach)if(!aids.has(id))delete ST.ach[id];}
  /* ガチャ排出履歴: 型崩れ・存在しない装備idを落とし、直近30件にクランプ(旧セーブは[]で安全) */
  if(!Array.isArray(ST.gLog))ST.gLog=[];
  ST.gLog=ST.gLog.filter(e=>e&&typeof e==="object"&&Number.isInteger(e.rar)&&e.rar>=0&&e.rar<=5
    &&(e.id===undefined||(typeof ITEM!=="undefined"&&!!ITEM[e.id]))).slice(0,30);
  if(ST.msq.tgt!=null)ST.msq.tgt=numOr(ST.msq.tgt,0,0,999);
  /* N2: 年度別過去問の成績。壊れた型は捨て、各値をクランプ(旧セーブは{}のまま安全) */
  for(const y in ST.nendo){
    const e=ST.nendo[y];
    if(typeof e!=="object"||e===null||Array.isArray(e)){delete ST.nendo[y];continue;}
    e.best=numOr(e.best,0,0,999);e.bestPct=numOr(e.bestPct,0,0,100);e.plays=numOr(e.plays,0,0,1e7);
  }
  if(typeof ST.opt.skk!=="boolean")ST.opt.skk=true; /* 旧セーブ互換用に残置。解説の折りたたみには使わない(常にフル表示) */
  /* オーディオ設定(旧セーブに欠けていれば既定値へ移行。音量は0〜1) */
  ST.opt.bgmVol=fracOr(ST.opt.bgmVol,0.7);
  ST.opt.seVol=fracOr(ST.opt.seVol,0.8);
  if(typeof ST.opt.focus!=="boolean")ST.opt.focus=false;
  if(typeof ST.opt.lowData!=="boolean")ST.opt.lowData=false;
  /* 1コースの長さ(約3分基準)。旧セーブ・不正値は標準へ。COURSE_PRESETS未ロード時も安全に既定化 */
  /* コース長の設定は廃止(殿2026-08-29)。旧セーブの短め/長めも標準へ寄せる */
  ST.opt.course="normal";
  /* S4(C): 図解フラッシュのON/OFF(既定ON)。旧セーブは true で補完。 */
  if(typeof ST.opt.zf!=="boolean")ST.opt.zf=true;
  /* 中断バトルのスナップショット。形が違えば黙って捨てる(壊れた戦闘を復元しない)。
     ids/idx/mode が揃っていない、または保存から3日以上経ったものは復元対象にしない
     (何日も前の戦闘を「再開しますか」と出されても、もう文脈が失われている)。 */
  if(ST.bt!==null){
    const b=ST.bt,g=b&&b.g;
    const ok=b&&typeof b==="object"&&!Array.isArray(b)&&g&&typeof g==="object"&&!Array.isArray(g)
      &&typeof g.mode==="string"&&Array.isArray(g.ids)&&g.ids.length>0&&Number.isFinite(Number(g.idx))
      &&Number.isFinite(Number(b.d))&&(todayNum()-Number(b.d))<=3;
    if(!ok)ST.bt=null;
  }
  /* S4(A): 直近出題リング。壊れた値・過大長は安全に切り詰める(出題の"避け"にしか使わない)。 */
  if(!Array.isArray(ST.rq))ST.rq=[];
  else{
    const cap=(typeof SRLearning!=="undefined"&&SRLearning.selection)?SRLearning.selection.RECENT_CAP:80;
    ST.rq=ST.rq.filter(x=>typeof x==="string"||typeof x==="number").map(String).slice(-cap);
  }
  ST.coins=numOr(ST.coins,0,0,1e9);ST.tickets=numOr(ST.tickets,0,0,9999);
  ST.ssrT=numOr(ST.ssrT,0,0,999);ST.potions=numOr(ST.potions,0,0,999);
  ST.xp=numOr(ST.xp,0,0,1e9);ST.lv=numOr(ST.lv,1,1,9999);ST.reb=numOr(ST.reb,0,0,999);
  ST.loop=numOr(ST.loop,1,1,99);ST.clears=numOr(ST.clears,0,0,9999);
  ST.survBest=numOr(ST.survBest,0,0,99999);ST.maxCombo=numOr(ST.maxCombo,0,0,99999);
  ST.totalC=numOr(ST.totalC,0,0,1e9);ST.totalW=numOr(ST.totalW,0,0,1e9);
  ST.days=numOr(ST.days,0,0,99999);ST.loginTotal=numOr(ST.loginTotal,0,0,99999);
  ST.gPity=numOr(ST.gPity,0,0,GACHA.pity);ST.gTotal=numOr(ST.gTotal,0,0,1e9);
  ST.gGauge=numOr(ST.gGauge,0,0,GAUGE_NEED-1);ST.gFreeDay=(typeof ST.gFreeDay==="string")?ST.gFreeDay:"";
  ST.chests=numOr(ST.chests,0,0,99);ST.trueWin=numOr(ST.trueWin,0,0,9999);
  ST.mobKills=numOr(ST.mobKills,0,0,1e9);ST.metalKills=numOr(ST.metalKills,0,0,1e9);
  ST.midKills=numOr(ST.midKills,0,0,1e9);
  /* 中ボス階段の進捗: 科目0..8のみ・撃破数はロスター数でクランプ(未知科目は捨てる) */
  for(const k in ST.midboss){
    const si=+k;
    if(!(si>=0&&si<SUBJECTS.length)){delete ST.midboss[k];continue;}
    const max=(typeof midbossCount==="function")?midbossCount(si):3;
    ST.midboss[k]=numOr(ST.midboss[k],0,0,max);
  }
  /* 敵図鑑の撃破記録: 壊れた型の値は捨て、各カウンタをクランプ(旧セーブは{}のまま) */
  const tdnBe=todayNum();
  for(const k in ST.bestiary){
    const e=ST.bestiary[k];
    if(typeof e!=="object"||e===null||Array.isArray(e)){delete ST.bestiary[k];continue;}
    e.k=numOr(e.k,0,0,1e9);e.s=numOr(e.s,0,0,1e9);
    e.f=(e.f===undefined||e.f===null)?-1:numOr(e.f,-1,-1,tdnBe);
  }
  ST.tsLast=numOr(ST.tsLast,0,0,4102444800000);
  ST.cleared=!!ST.cleared;
  ST.goldSeen=ST.goldSeen?1:0; /* N3: 祝福フラグ。旧セーブ・不正値は0で安全初期化 */
  if(typeof ST.lastDay!=="string")ST.lastDay="";
  if(typeof ST.dq!=="object"||!Array.isArray(ST.dq.cl)||ST.dq.cl.length!==MISSIONS.length){
    ST.dq={d:"",cor:0,ans:0,cl:MISSIONS.map(()=>false)};
  }
  ST.dq.cor=numOr(ST.dq.cor,0,0,1e6);ST.dq.ans=numOr(ST.dq.ans,0,0,1e6);
  if(typeof ST.dq.d!=="string")ST.dq.d="";
  ST.dq.cl=ST.dq.cl.map(x=>!!x);
  if(typeof ST.opt.mute!=="boolean")ST.opt.mute=false;
  if(typeof ST.opt.beginner!=="boolean")ST.opt.beginner=false;
  /* 装備: 未所持・不明ID・スロット不一致は外す(武器は初期装備へ) */
  if(!ST.inv.t1)ST.inv.t1=1;
  for(const sl of ["w","a","c","t"]){
    const id=ST.eq[sl];
    if(id&&(!ITEM[id]||ITEM[id].slot!==sl||!ST.inv[id]))ST.eq[sl]=null;
  }
  if(!ST.eq.w){if(!ST.inv.w0)ST.inv.w0=1;ST.eq.w="w0";}
  for(const id in ST.inv){if(!ITEM[id])delete ST.inv[id];else ST.inv[id]=1;}
  /* 凸(限界突破): 未所持・不明IDは捨て、TOPPA_MAX でクランプ(旧セーブは{}=0)。enh の上限計算に先立って行う */
  const tmax=(typeof TOPPA_MAX!=="undefined")?TOPPA_MAX:5;
  for(const id in ST.toppa){if(!ITEM[id]||!ST.inv[id])delete ST.toppa[id];else ST.toppa[id]=numOr(ST.toppa[id],0,0,tmax);}
  /* 強化(+N): 未所持・不明IDは捨て、凸で拡張した enhCap でクランプ(旧セーブの+5はcap内で保全) */
  for(const id in ST.enh){if(!ITEM[id]||!ST.inv[id])delete ST.enh[id];else{
    const cap=(typeof enhCap==="function")?enhCap(id):ENH_MAX;ST.enh[id]=numOr(ST.enh[id],0,0,cap);}}
  ST.mat=numOr(ST.mat,0,0,1e9); /* 強化石(旧セーブは0) */
  ST.dropPity=numOr(ST.dropPity,0,0,1e9); /* M6: レアドロップ天井(旧セーブは0) */
  ST.pow.p=numOr(ST.pow.p,0,0,1e9);ST.pow.m=numOr(ST.pow.m,0,0,1e9); /* M6: 今日の成長スナップショット */
  if(typeof ST.pow.d!=="string")ST.pow.d="";
  /* 問題統計: 不正な値・未来の日付をクランプ。
     Qが空=新旧ファイル混在の異常ロード。学習履歴(ST.q)を誤って全削除しないよう触らず抜ける */
  if(!Q.length)return;
  const tdn=todayNum();
  for(const k in ST.q){
    const st=ST.q[k];
    if(typeof st!=="object"||st===null||!qById(k)){delete ST.q[k];continue;}
    st.c=numOr(st.c,0,0,1e6);st.w=numOr(st.w,0,0,1e6);st.s=numOr(st.s,0,0,1e6);
    st.box=numOr(st.box,0,0,SRS_IV.length-1);
    st.due=numOr(st.due,0,0,tdn+IV_MAX);
    st.la=numOr(st.la,-1,-1,tdn); /* 未来のlaは今日に補正(時計変更対策) */
    st.ng=!!st.ng;st.bm=!!st.bm;
    /* SM-2ライトのease: 旧セーブは未定義→既定値。範囲外はクランプ */
    if(st.ease!==undefined)st.ease=clampEase(st.ease);
    /* 誤答理由 mr: 旧=文字列(単一) / 新=集計オブジェクト{理由:回数}。壊れた型は捨てる */
    if(st.mr!==undefined&&typeof st.mr!=="string"&&(typeof st.mr!=="object"||st.mr===null||Array.isArray(st.mr)))delete st.mr;
    /* 自己評価 sa(最終申告 0/1/2) / sac(申告回数の集計)。旧セーブは未定義=そのまま(穴埋め不要) */
    if(st.sa!==undefined){const n=Number(st.sa);if(Number.isFinite(n)&&n>=0&&n<=2)st.sa=Math.round(n);else delete st.sa;}
    if(st.sac!==undefined&&(typeof st.sac!=="object"||st.sac===null||Array.isArray(st.sac)))delete st.sac;
  }
  /* MACHIMON: 欠損・不正値を安全側へ丸める(未ロードなら何もしない=起動不能にしない) */
  try{ if(typeof MM!=="undefined"&&MM.state)ST.mm=MM.state.normalize(ST.mm); }catch(e){ ST.mm=null; }
}
async function saveST(){
  if(saveBusy){saveQueued=true;return;}
  saveBusy=true;
  try{
    if(USE_LS){localStorage.setItem(KEY,JSON.stringify(ST));if(window.__srqMirror)window.__srqMirror(KEY);}
    else if(window.storage)await window.storage.set(KEY,JSON.stringify(ST),false);
  }catch(e){console.warn("保存失敗(メモリ上で継続):",e);}
  saveBusy=false;
  if(saveQueued){saveQueued=false;saveST();}
}

/* ---------- 中断時の取りこぼし防止(自動セーブ) ----------
   saveST() は 64 箇所から呼ばれていて通常は十分だが、書き込み中に次の保存が来ると
   saveQueued に回る。その状態で iOS にアプリを落とされると、その1回ぶんが消える。
   また「アプリを閉じる/バックグラウンドへ回す」時点で保存する経路が無かった。

   saveNow() は busy/queued のキューを迂回して即座に書く。localStorage は同期APIなので
   中断ハンドラの中でも確実に完了する(非同期の saveST は完了前に殺されうる)。 */
function saveNow(){
  try{
    if(USE_LS){
      localStorage.setItem(KEY,JSON.stringify(ST));
      saveQueued=false; /* 迂回して書いたので、積んであった予約は消化済み */
      if(window.__srqMirror)window.__srqMirror(KEY);
    }else if(window.storage){
      /* 非同期フォールバック。中断中に完了する保証は無いが、呼ぶだけ呼んでおく */
      window.storage.set(KEY,JSON.stringify(ST),false);
    }
  }catch(e){/* 保存できない環境ではメモリ上で継続(従来どおり) */}
  /* 新UI(Store)は独立したキーを持つので、そちらも同時に確定させる */
  try{ if(window.Store&&typeof window.Store.save==="function")window.Store.save(); }catch(e){}
}
window.saveNow=saveNow;

/* pagehide は iOS Safari/WKWebView で「アプリが背面に回る/破棄される」時に最も確実に来る。
   visibilitychange(hidden) も併せて拾う(ホームに戻す・アプリスイッチャ経由)。
   どちらも複数回来うるが、saveNow は冪等なので実害がない。 */
if(typeof window!=="undefined"&&window.addEventListener){
  window.addEventListener("pagehide",saveNow);
  document.addEventListener("visibilitychange",()=>{ if(document.visibilityState==="hidden")saveNow(); });
}

function migrateV2(old){
  const s=defaultState();
  s.coins=old.coins||0;s.potions=old.potions||0;
  s.badges=old.badges||{};s.loop=old.loop||1;s.clears=old.clears||0;s.cleared=!!old.cleared;
  s.survBest=old.survBest||0;s.totalC=old.totalC||0;s.totalW=old.totalW||0;
  s.lastDay=old.lastDay||"";s.days=old.days||0;s.loginTotal=old.days||0;
  for(const k in (old.q||{}))s.q[k]=Object.assign({box:0,due:0,la:-1},old.q[k]);
  /* 旧装備(段階インデックス)→アイテム所持へ */
  const wmap=["w0","w1","w2","w3","w4","w5","w6"],amap=[null,"a1","a2","a4"],cmap=[null,"c1","c2","c6"];
  for(let i=0;i<=(old.weapon||0);i++)s.inv[wmap[i]]=1;
  s.eq.w=wmap[Math.min(old.weapon||0,6)];
  for(let i=1;i<=(old.charm||0);i++)if(amap[i])s.inv[amap[i]]=1;
  s.eq.a=amap[old.charm||0]||null;
  for(let i=1;i<=(old.clock||0);i++)if(cmap[i])s.inv[cmap[i]]=1;
  s.eq.c=cmap[old.clock||0]||null;
  /* 過去の学習量をレベルに反映 */
  addXpRaw(s,(old.totalC||0)*8);
  /* 討伐済みボスは図鑑に反映 */
  for(const b in s.badges){s.eSeen[b]=1;s.eKill[b]=1;}
  return s;
}

/* ---------- 日付 ---------- */
function today(){const d=new Date();return d.getFullYear()+"-"+(d.getMonth()+1)+"-"+d.getDate();}
function todayNum(){const d=new Date();return Math.floor((d.getTime()-d.getTimezoneOffset()*60000)/864e5);}

/* ---------- 問題統計・SRS(間隔反復 + SM-2ライト) ---------- */
const SRS_IV=[1,3,7,16,35,70]; /* 初期梯子(Leitner)。box上位ではeaseで伸縮 */
const EASE_DEF=2.3,EASE_MIN=1.3,EASE_MAX=3.0; /* 記憶しやすさ係数 */
const EASE_FROM=3;             /* box>=EASE_FROM から ease で間隔を伸縮 */
const IV_MAX=365;              /* 次回間隔の上限(保守) */
const LEECH_W=5;               /* 誤答がこの回数を超えたら「沼問題」 */
function clampEase(e){e=Number(e);if(!Number.isFinite(e))e=EASE_DEF;return e<EASE_MIN?EASE_MIN:(e>EASE_MAX?EASE_MAX:e);}
function qstat(id){return ST.q[id]||(ST.q[id]={c:0,w:0,ng:false,s:0,bm:false,box:0,due:0,la:-1,ease:EASE_DEF});}
function srsOnCorrect(st,wasSeen){
  /* wasSeen: この回答より前に解いたことがあるか(呼び出し側で st.c++ 前に判定) */
  const tdn=todayNum();
  if(st.la===tdn)return false; /* 同日重複はSRS前進なし */
  const wasDue=!!wasSeen&&(st.due||0)<=tdn;
  const prevLa=st.la;
  st.ease=clampEase(st.ease);
  st.box=Math.min((st.box||0)+1,SRS_IV.length-1);
  /* 前回解答からの実経過日数=どれだけ長く覚えていたか */
  const gap=(wasSeen&&prevLa>0)?(tdn-prevLa):0;
  let iv=SRS_IV[st.box];
  if(st.box>=EASE_FROM){
    /* 間隔をあけて正解できた事実ほど強い記憶→easeを上げ次回間隔を伸ばす */
    if(gap>=SRS_IV[st.box])st.ease=clampEase(st.ease+0.15); /* 予定より長く覚えていた */
    else if(gap>=7)st.ease=clampEase(st.ease+0.08);
    else if(wasDue)st.ease=clampEase(st.ease+0.04);
    iv=Math.round(SRS_IV[st.box]*(st.ease/EASE_DEF));
    if(st.box===SRS_IV.length-1){
      /* 最上位は固定梯子で頭打ちにせず、実際に覚えていた期間×easeで伸ばし続ける */
      iv=Math.max(iv,Math.round(Math.max(gap,SRS_IV[st.box])*st.ease/EASE_DEF));
    }
    iv=Math.min(iv,IV_MAX);
  }
  iv=Math.max(1,iv);
  st.due=tdn+iv;st.la=tdn;
  if(wasDue)ST.cnt.rev++;
  return wasDue;
}
function srsOnWrong(st){
  const tdn=todayNum();
  st.ease=clampEase(clampEase(st.ease)-0.2); /* 誤答でeaseを下げる(下限EASE_MIN) */
  st.box=Math.max(0,(st.box||0)-1); /* 1段階だけ降格(0全リセットしない=育てた分は守る) */
  st.due=tdn+1;st.la=tdn;
}
/* 沼問題(何度も誤答)判定。id か st を受ける */
function isLeech(x){const st=(x&&typeof x==="object")?x:ST.q[x];return !!st&&(st.w||0)>=LEECH_W;}
/* 定着ベースの習得判定: box>=3(別日に複数回正解)かつ直近が正解(未誤答状態) */
function isMastered(x){const st=(x&&typeof x==="object")?x:ST.q[x];return !!st&&(st.box||0)>=3&&!st.ng&&(st.c||0)>0;}
/* 沼問題のうち未習得(救済が必要)なものを出題候補に */
function leechIds(){return Q.filter(x=>{const st=ST.q[x.id];return st&&isLeech(st)&&!isMastered(st);}).map(x=>x.id);}
/* 長期記憶ボーナス: 前回解答から7日以上あけて正解=本物の記憶。srsOnCorrectがlaを
   更新する前に呼ぶこと。30日以上=×2 / 7日以上=×1.5 / それ未満=×1 */
function memBonusMult(st,wasSeen){
  if(!wasSeen||!(st.la>0))return 1;
  const gap=todayNum()-st.la;
  return gap>=30?2:gap>=7?1.5:1;
}
function dueIds(){const tdn=todayNum();return Q.filter(x=>{const st=ST.q[x.id];return st&&(st.c+st.w>0)&&(st.due||0)<=tdn;}).map(x=>x.id);}
function wrongIds(){return Q.filter(x=>qstat(x.id).ng).map(x=>x.id);}
function bmIds(){return Q.filter(x=>qstat(x.id).bm).map(x=>x.id);}
function masteredCount(){return Q.filter(x=>isMastered(x.id)).length;}
/* 演出/解放ゲート用: ストリーク(別日2正解)ベースのまま(同日中でも到達でき学習ループを止めない) */
function masteryPct(si){const qs=Q.filter(x=>x.s===si);const m=qs.filter(x=>(qstat(x.id).s||0)>=2).length;return qs.length?m/qs.length:0;}
/* ボス解放ライン(M5でテンポ優先に緩和: 初周40%。学習は雑魚ラッシュで自然に積む前提)。周回で締める。 */
function unlockNeed(){return Math.min(80,40+(ST.loop-1)*15);}
function LASTCFG(){return LASTCFG_BASE(ST.loop);}
function pastQIds(){return Q.filter(x=>x.e.includes("本試験")).map(x=>x.id);}
/* 本試験形式(五肢択一・examFmt)の全ID。一般プールQには含まれないためQBYから収集。 */
function examFmtIds(){const r=[];QBY.forEach(q=>{if(q.examFmt)r.push(q.id);});return r;}
/* 本試験の選択式(sentaku=長文+空欄【A〜E】+20択)の全ID。一般プール・悪魔/神(examFmt)プールとは
   別枠で、選択式演習モードが専用に出題する。QBYから format:"sentaku" を収集。 */
function sentakuIds(){const r=[];QBY.forEach(q=>{if(q.format==="sentaku"||q.sentaku)r.push(q.id);});return r;}
/* 本試験系モード(悪魔/神)の出題プール: 五肢択一(examFmt)を最優先し、
   足りなければ○×の本試験改題(pastQIds)で補う拡張版の過去問プール。 */
function examPastIds(){
  const ex=shuffle(examFmtIds());const have={};ex.forEach(id=>have[id]=1);
  const past=shuffle(pastQIds()).filter(id=>!have[id]);
  return ex.concat(past);
}
/* ---- S4(A): 直近出題リング(出題範囲を広げるための"避けリスト") ----
   学習判定には一切関与しない。ST.rq に「最近出した問題ID」を溜め、次の選抜で避ける。 */
function recentQRing(){return Array.isArray(ST.rq)?ST.rq:[];}
function recentQPush(ids){
  const SEL=(typeof SRLearning!=="undefined")&&SRLearning.selection;
  if(!SEL||!ids||!ids.length)return recentQRing();
  ST.rq=SEL.pushRecent(recentQRing(),ids,SEL.RECENT_CAP);
  return ST.rq;
}
/* その科目でこれまでに解答した問題数(難易度ランプの段階判定に使う。履歴は読むだけ)。 */
function subjectSeenCount(si){
  return Q.filter(x=>{const st=ST.q[x.id];return x.s===si&&st&&((st.c||0)+(st.w||0))>0;}).length;
}
/* その科目の examFmt(五肢択一・個数)問題オブジェクト一覧。通常プールQには入っていない。 */
function subjectExamQs(si){
  const out=[];
  QBY.forEach(q=>{if(q&&q.examFmt&&q.s===si)out.push(q);});
  return out;
}
function shuffle(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
/* 暗記防止(V1-B): 直近に出した問題を「連続で」出さない。プールに余裕がある限り、
   シャッフル後の先頭が avoidId と一致したら別位置と入れ替える(周回・無限プールの継ぎ目対策)。
   入力配列は破壊しない(slice)。要素1個以下や該当なしは素の shuffle と同じ。 */
function shuffleNoRepeat(ids,avoidId){
  const a=shuffle(ids.slice());
  if(a.length>1&&avoidId!=null&&a[0]===avoidId){
    const j=1+Math.floor(Math.random()*(a.length-1));[a[0],a[j]]=[a[j],a[0]];
  }
  return a;
}
function esc(s){return s.replace(/&/g,"&amp;").replace(/</g,"&lt;");}

/* ---------- 学習進捗分析 ---------- */
function subjectPower(si){
  const qs=Q.filter(x=>x.s===si);if(!qs.length)return 0;
  let m=0,box=0;
  qs.forEach(x=>{const st=ST.q[x.id];if(st){if(isMastered(st))m++;box+=Math.min(st.box||0,5);}});
  return Math.round((m/qs.length*60+box/(qs.length*5)*40));
}
function passPct(){
  const m=masteredCount()/Q.length*50;
  let box=0;Q.forEach(x=>{const st=ST.q[x.id];if(st)box+=Math.min(st.box||0,5);});
  const srs=box/(Q.length*5)*30;
  const l=Math.min(ST.clears,3)/3*20;
  return Math.round(m+srs+l);
}
function weakestSubjects(n=2){
  return SUBJECTS.map((_,i)=>({i,p:subjectPower(i)})).sort((a,b)=>a.p-b.p).slice(0,n).map(x=>x.i);
}
/* 推奨問題は core/recommend.js の recommend20()(理由付き)に移設 */
function rankTitle(){
  const p=passPct();
  if(ST.trueWin)return "🏆厚生労働神を超えし者";
  if(ST.cleared)return "🏆合格圏マスター";
  if(p>=80)return "合格圏目前";
  if(p>=50)return "実力者";
  if(p>=20)return "受験生";
  return "見習い";
}

/* ---------- レベル・XP・転生 ---------- */
function xpForNext(lv){return 60+(lv-1)*30;}
function addXpRaw(s,n){/* fx無しでXP加算(移行・内部用) */
  s.xp+=n;let ups=0;
  while(s.xp>=xpForNext(s.lv)){s.xp-=xpForNext(s.lv);s.lv++;ups++;}
  return ups;
}
function setPct(k){return (typeof setBonus==="function")?setBonus(k):0;} /* セット効果の%(M4) */
function collPct(k){return (typeof collectPct==="function")?collectPct(k):0;} /* 収集(コレクション)恒久ボーナス%(D1) */
function xpMult(){return (1+ST.reb*0.05)*(1+(eqStat("xp")+cpBonus("xp")+officeBonus("xp")+setPct("xp")+collPct("xp"))/100);}
function coinMult(){return (1+ST.reb*0.05)*(1+(eqStat("coin")+cpBonus("coin")+officeBonus("coin")+setPct("coin")+collPct("coin"))/100);}
function gainXp(n){/* 戦闘中のXP加算。レベルアップ数を返す */
  const ups=addXpRaw(ST,Math.round(n*xpMult()));
  return ups;
}
const REBIRTH_LV=30;
function canRebirth(){return ST.lv>=REBIRTH_LV;}
function doRebirth(){
  if(!canRebirth())return false;
  ST.reb++;ST.lv=1;ST.xp=0;
  saveST();return true;
}

/* ---------- ステータス(知識・暗記・集中・運) ---------- */
function stats(){
  return {
    kn:masteredCount()+ST.lv*2+ST.reb*20,
    mem:ST.cnt.rev+Math.floor(ST.totalC/10),
    foc:ST.cnt.crit,
    luck:ST.cnt.chest*2+ST.cnt.pull+eqStat("luck")
  };
}
/* ステータスの実効果 */
function statDmgBonus(){return Math.floor(stats().kn/60);}
function statTimeBonus(){return Math.min(3,Math.floor(stats().foc/80));}
function statCoinBonus(){return Math.min(0.3,stats().mem/1500);} /* 最大+30% */

/* ---------- 装備 ---------- */
function eqItem(slot){const id=ST.eq[slot];return id?ITEM[id]:null;}
function itemMainKey(it){/* 強化(+N)が乗る代表ステータス */
  if(it.slot==="w")return "dmg";
  if(it.slot==="a")return "sh";
  return Object.keys(it.st)[0]||null;
}
function enhLv(id){return (ST.enh&&ST.enh[id])||0;}
const ENH_MAX=5;
/* 限界突破(凸)の総数=全所持装備の凸レベル合計。ガチャ画面のコレクション価値表示用(M4で toppa 集計に移行) */
function totalToppa(){let n=0;for(const id in (ST.toppa||{}))n+=(ST.toppa[id]||0);return n;}
function eqStat(key){
  let v=0;
  for(const s of ["w","a","c","t"]){const it=eqItem(s);if(!it)continue;
    if(it.st[key])v+=it.st[key];
    /* 代表statに 強化+N と 凸(toppa) を上乗せ(M4)。gear-power未ロード時はenhLvのみ */
    if(itemMainKey(it)===key)v+=(typeof enhStatBonus==="function")?enhStatBonus(it.id):enhLv(it.id);
  }
  return v;
}
function playerDmg(){return (eqStat("dmg")||1)+statDmgBonus()+cpBonus("dmg")+((typeof setBonus==="function")?setBonus("dmg"):0);}
function playerShield(){return eqStat("sh");}
function ownedOf(slot){return ITEMS.filter(x=>x.slot===slot&&ST.inv[x.id]);}
function grantItem(id){/* true=新規, false=ダブり(限界突破+素材 or コイン変換) */
  if(ST.inv[id]){const it=ITEM[id];
    const tmax=(typeof TOPPA_MAX!=="undefined")?TOPPA_MAX:5;
    const tp=(typeof toppaLv==="function")?toppaLv(id):((ST.toppa&&ST.toppa[id])||0);
    if(tp<tmax){ /* ダブり=限界突破(凸): 強化上限UP+代表stat+1、さらに強化石を付与 */
      ST.toppa[id]=tp+1;ST.mat=(ST.mat||0)+2;return false;
    }
    ST.coins+=RAR[it.rar].dupe;return false; /* 凸上限後はコイン */
  }
  ST.inv[id]=1;return true;
}
function grantAchTitles(){/* 実績称号の自動付与。新規獲得idの配列を返す */
  const got=[];
  const cond={badges9:badgeCount()>=9,clear1:ST.clears>=1,zukan:zukanLawPct()>=100,truewin:ST.trueWin>0};
  /* D1: 収集報酬称号(col15 や col_series)の条件を data-gear からマージ(未ロードでも安全) */
  if(typeof collectConds==="function")Object.assign(cond,collectConds());
  ITEMS.filter(x=>x.ach&&cond[x.ach]&&!ST.inv[x.id]).forEach(x=>{ST.inv[x.id]=1;got.push(x.id);});
  return got;
}
function badgeCount(){return Object.keys(ST.badges).length;}

/* ---------- 図鑑 ---------- */
function zukanLawPct(){
  const all=Object.keys(ZUKAI).length;
  return Math.round(Object.keys(ST.zk).length/all*100);
}
function zukanEnemyPct(){
  const total=BOSSES.length+2; /* +試験の神+厚生労働神 */
  let n=0;for(let i=0;i<BOSSES.length;i++)if(ST.eKill[i])n++;
  if(ST.clears>=1)n++;if(ST.trueWin)n++;
  return Math.round(n/total*100);
}
function zukanItemPct(){
  return Math.round(ITEMS.filter(x=>ST.inv[x.id]).length/ITEMS.length*100);
}

/* ---------- デイリー・ログイン ---------- */
let dailyMsg="",loginRw=null,streakMsg="";
function checkDaily(){
  const t=today(),now=Date.now();
  /* 時計巻き戻し検知(1時間の猶予): ログボ・ミッションリセットの再付与を抑止 */
  const rolledBack=ST.tsLast>0&&now<ST.tsLast-3600000;
  if(ST.lastDay!==t&&!rolledBack){
    const y=new Date();y.setDate(y.getDate()-1);
    const yst=y.getFullYear()+"-"+(y.getMonth()+1)+"-"+y.getDate();
    ST.days=(ST.lastDay===yst)?ST.days+1:1;
    ST.lastDay=t;ST.loginTotal++;
    const rw=loginReward(ST.loginTotal);
    if(rw.coins)ST.coins+=Math.round(rw.coins*(1+Math.min(ST.days,7)*0.05));
    if(rw.tickets)ST.tickets+=rw.tickets;
    if(rw.ssrT)ST.ssrT+=rw.ssrT;
    loginRw=rw;
    dailyMsg=`ログインボーナス ${rw.label}(連続${ST.days}日/通算${ST.loginTotal}日)`;
    /* M6(C): 連続日数ストリークの節目報酬(ログボとは別枠・継続そのものへの報酬)。
       途切れて再挑戦したら同じ節目を再獲得できる=非懲罰(exact-matchで1回だけ付与) */
    if(typeof streakReward==="function"){
      const srw=streakReward(ST.days);
      if(srw){
        if(srw.coins)ST.coins+=srw.coins;if(srw.tickets)ST.tickets+=srw.tickets;
        if(srw.ssrT)ST.ssrT+=srw.ssrT;if(srw.chest)ST.chests+=srw.chest;
        streakMsg=`🔥連続${ST.days}日ストリーク達成! `+
          (srw.coins?`+${srw.coins}コイン`:"")+(srw.tickets?` +チケ${srw.tickets}`:"")+
          (srw.ssrT?` +SSR確定チケ${srw.ssrT}`:"")+(srw.chest?` +宝箱${srw.chest}`:"");
      }
    }
    /* M6(E): その日の開始時点の戦力/習得を記録=以後の差分が「今日の成長」 */
    if(typeof powSnap==="function")powSnap(ST,t);
  }
  if(ST.dq.d!==t&&!rolledBack){ST.dq={d:t,cor:0,ans:0,cl:MISSIONS.map(()=>false)};}
  if(ST.wq.wk!==weekIdx()&&!rolledBack)wqReset(); /* 週明けはホーム表示時点でリセット */
  ST.tsLast=Math.max(ST.tsLast||0,now);
  saveST();
}
function missionProgress(m){return ST.dq[m.key]||0;}
function missionTick(){/* 回答毎に呼ぶ。達成した報酬メッセージ配列を返す */
  const done=[];
  MISSIONS.forEach((m,i)=>{
    if(ST.dq.cl[i])return;
    if(missionProgress(m)>=m.need){
      ST.dq.cl[i]=true;
      if(m.rw.coins)ST.coins+=m.rw.coins;
      if(m.rw.tickets)ST.tickets+=m.rw.tickets;
      if(m.rw.chest)ST.chests++;
      done.push(`ミッション達成!「${m.txt}」報酬GET`);
    }
  });
  wqCheck(done); /* 週間チャレンジの判定は core/weekly.js */
  return done;
}
function histTick(ok){
  wqTick(ok);
  const t=today();
  const h=ST.hist[t]||(ST.hist[t]={a:0,c:0});
  h.a++;if(ok)h.c++;
  /* 90日より古い履歴は捨てる(肥大防止) */
  const keys=Object.keys(ST.hist);
  if(keys.length>90){keys.sort();delete ST.hist[keys[0]];}
}

/* ---------- 宝箱 ---------- */
function chestChance(){return 0.05+Math.min(0.10,stats().luck*0.0004);}
function chestRoll(){
  ST.cnt.chest++;
  const total=CHEST_TABLE.reduce((s,x)=>s+x.w,0);
  let r=Math.random()*total;
  for(const row of CHEST_TABLE){
    r-=row.w;if(r>0)continue;
    if(row.type==="coins"){const n=Math.round((row.min+Math.random()*(row.max-row.min))*ST.loop*coinMult());ST.coins+=n;return {icon:px("coin",40),label:`+${n}コイン`};}
    if(row.type==="potion"){ST.potions++;return {icon:px("potion",40),label:"回復ドリンク×1"};}
    if(row.type==="xp"){const n=Math.round(row.min+Math.random()*(row.max-row.min));gainXp(n);return {icon:px("star",40),label:`+${n}XP`};}
    if(row.type==="tickets"){ST.tickets+=row.n;return {icon:px("ticket",40),label:`ガチャチケット×${row.n}`};}
    if(row.type==="item"){
      const pool=gachaPool(row.rar);
      if(!pool.length){ST.coins+=200;return {icon:px("coin",40),label:"+200コイン"};}
      const it=pool[Math.floor(Math.random()*pool.length)];
      const isNew=grantItem(it.id);
      return {icon:px(it.sp,40),label:`【${RAR[it.rar].n}】${it.name}${isNew?"":"(ダブり→+"+RAR[it.rar].dupe+"コイン)"}`,rar:it.rar};
    }
  }
  ST.coins+=100;return {icon:px("coin",40),label:"+100コイン"};
}

/* ---------- ガチャ ---------- */
/* ガチャゲージ: 正解が積み上がるとチケットに変わる(勉強→ガチャの直結ループ)。
   GAUGE_NEED 問正解ごとにチケット1枚。付与までここで完結させ、UI側は演出だけを担う。
   デイリーミッション(20問正解=チケ1)より速い蓄積だが、確率・天井は据え置きなので
   「引ける回数が増える」だけでレア感(SSR以上3%)は薄まらない。 */
const GAUGE_NEED=10;
function gaugeOnCorrect(){
  ST.gGauge=(ST.gGauge||0)+1;
  if(ST.gGauge<GAUGE_NEED)return false;
  ST.gGauge=0;ST.tickets=Math.min(9999,(ST.tickets||0)+1);
  return true;
}
/* デイリー無料ガチャ: 1日1回、コストなしで1回引ける(毎日開く理由を作る)。
   消費の記録は「使った日」の文字列だけ=旧セーブは空文字で当日から使える。 */
function gachaFreeAvail(){return ST.gFreeDay!==today();}
/* SSR以上(rar>=3)の基本確率合計。運ブーストを基本比率のまま配分する分母 */
const GACHA_HI_SUM=GACHA.rates.filter(r=>r[0]>=3).reduce((s,r)=>s+r[1],0);
function gachaRollRarity(forceMin){
  ST.gPity++;ST.gTotal++;ST.cnt.pull++;
  const luckBoost=Math.min(0.01,stats().luck*0.00002);
  /* 天井: SSR以上確定(稀にUR/LRへ昇格)。S5で昇格枠も絞り、天井のUR/LRを"事件"に戻した */
  if(ST.gPity>=GACHA.pity){ST.gPity=0;const x=Math.random();return x<0.002?5:x<0.10?4:3;}
  /* 運はSSR以上を「基本比率のまま」底上げ(削るのはNの取り分)。
     こうすると最上位ほど希少という順序が運の値に関わらず絶対に崩れない(LR<UR<SSR不変)。 */
  let r=Math.random(),acc=0,rar=0;
  for(let i=GACHA.rates.length-1;i>=0;i--){
    let p=GACHA.rates[i][1];
    if(GACHA.rates[i][0]>=3&&GACHA_HI_SUM>0)p+=luckBoost*(GACHA.rates[i][1]/GACHA_HI_SUM);
    acc+=p;
    if(r<acc){rar=GACHA.rates[i][0];break;}
  }
  if(forceMin!==undefined&&rar<forceMin)rar=forceMin;
  if(rar>=3)ST.gPity=0;
  return rar;
}
function gachaRoll(forceMin){/* 1回分の結果 {rar,item?,coins?,potion?,isNew} */
  const rar=gachaRollRarity(forceMin);
  const pool=gachaPool(rar);
  let res;
  if(rar===0||!pool.length){
    if(Math.random()<0.3){ST.potions++;res={rar:0,potion:1};}
    else{const n=Math.round((30+Math.random()*70)*coinMult());ST.coins+=n;res={rar:0,coins:n};}
  }else{
    const it=pool[Math.floor(Math.random()*pool.length)];
    const isNew=grantItem(it.id);
    res={rar,item:it,isNew};
  }
  gachaLogPush(res);
  return res;
}
/* 排出履歴に1件追加(新しい順・直近30件)。item はidだけ保持し、表示時に ITEM[id] から引く */
function gachaLogPush(r){
  const e=r.item?{rar:r.rar,id:r.item.id,isNew:!!r.isNew}:(r.potion?{rar:0,potion:1}:{rar:0,coins:r.coins});
  ST.gLog.unshift(e);
  if(ST.gLog.length>30)ST.gLog.length=30;
}
function gachaTen(){
  const out=[];let hasSR=false;
  for(let i=0;i<9;i++){const r=gachaRoll();if(r.rar>=2)hasSR=true;out.push(r);}
  out.push(gachaRoll(hasSR?undefined:2)); /* 10連はSR以上1枠確定 */
  return out;
}

/* 初学者の自動判定(殿2026-08-29: 設定トグルは廃止)。
   解答100問までは入門の補助(出題前の制度の目的・つまずき解説の展開)を自動で有効にする。
   以降は苦手株(isLeech)の問題でだけ個別に効く。 */
function beginnerAuto(){
  if(typeof ST==="undefined"||!ST)return false;
  return ((ST.totalC||0)+(ST.totalW||0))<100;
}
