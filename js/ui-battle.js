"use strict";
/* ============================================================
   ui-battle.js — バトル画面・回答処理・勝敗
   ============================================================ */
const app=document.getElementById("app");
let G=null,timerH=null;
/* classic script の let/const は window に載らない。物語層(story-encounter.js 等)は
   window.G 越しに戦闘状態を読み書きするため、実体と同期する生アクセサを公開する。
   これが無いと applyStoryLoadout が即 return し、章ボス戦なのに雑魚敵が出て
   出題も物語用の選抜に差し替わらない(殿報告: グラウス戦なのに雑魚と戦う)。 */
if(typeof window!=="undefined"){
  try{ Object.defineProperty(window,"G",{get:function(){return G;},set:function(v){G=v;},configurable:true}); }
  catch(e){}
}

/* 演出簡素化: prefers-reduced-motion 尊重(酔わせない)。テスト環境(matchMedia無し)は false */
function prefersReduce(){try{return typeof matchMedia==="function"&&matchMedia("(prefers-reduced-motion: reduce)").matches;}catch(e){return false;}}
/* メタル敵パラメータ(雑魚ラッシュのレア出現) */
const METAL_HP=2,METAL_TURNS=3,METAL_CHANCE=0.02,MB_SPAWN_FIRST=2;
function stopTimer(){if(timerH){clearInterval(timerH);timerH=null;}}
/* 1コースの問題数(約3分)。course.js未ロードのテスト環境等では既定12にフォールバック */
function courseCapN(){return (typeof courseLen==="function")?courseLen():12;}
function isTimed(){return !!G&&(G.mode==="boss"||G.mode==="last"||G.mode==="true"||G.mode==="mock"||G.mode==="demon"||G.mode==="nendo"||G.mode==="sentaku");}
function isExam(){return !!G&&(G.mode==="last"||G.mode==="mock"||G.mode==="demon"||G.mode==="nendo"||G.mode==="sentaku");} /* 装備・回復無効の実力測定モード(裏面=年度別過去問・選択式演習も本試験形式) */
/* 五肢択一・選択式(3肢以上=読む量が多い)には本試験ペース寄りの長め制限。○×は従来の短め。
   本試験の択一は実際1問≒3分。ゲームとして緊張感を残しつつ「5肢を読めない12秒」を解消する。 */
const EXAM_CHOICE_T=75;
/* 選択式(sentaku)は長文＋20択で読む量が段違いに多い=本試験ペースでも余裕を持たせる。 */
const EXAM_SENTAKU_T=180;
function curQuestion(){return (typeof qById==="function"&&G&&G.ids&&G.ids.length)?qById(G.ids[G.idx]):null;}
function isMultiOptQ(q){return !!q&&(q.format==="choice"||q.format==="fill_blank"||q.examFmt===true||(q.choices&&q.choices.length>=3));}
function timeLimit(){
  const multi=isMultiOptQ(curQuestion());
  if(G&&G.mode==="sentaku")return EXAM_SENTAKU_T; /* 選択式: 1問=長文+空欄5+20択 */
  if(G&&G.mode==="mock")return multi?EXAM_CHOICE_T:20;
  if(G&&G.mode==="nendo")return multi?EXAM_CHOICE_T:20; /* 裏面: 年度別過去問は本試験ペース(五肢択一75秒) */
  if(G&&G.mode==="demon"){const base=(typeof DEMON_CFG!=="undefined"?DEMON_CFG.t:12);return multi?Math.max(EXAM_CHOICE_T,base):base;} /* 装備無効 */
  if(G&&G.mode==="last"){const base=LASTCFG().t;return multi?Math.max(EXAM_CHOICE_T,base):base;}
  const sett=(typeof setBonus==="function")?setBonus("t"):0; /* セット効果の時間+秒(M4・実力測定は上で除外済) */
  if(G&&G.mode==="true")return (multi?EXAM_CHOICE_T:10)+eqStat("t")+statTimeBonus()+cpBonus("t")+officeBonus("t")+sett;
  return (multi?EXAM_CHOICE_T:Math.max(7,13-ST.loop))+eqStat("t")+statTimeBonus()+cpBonus("t")+officeBonus("t")+sett;
}
function critWindow(){return (G&&(G.mode==="last"||G.mode==="demon"))?4:4+eqStat("crit");}
function bossHPMax(i){return 10+(i||0)*7+6*(ST.loop-1);} /* 章が進むほど強い=装備強化が攻略の前提 */
function startTick(){
  const TL=timeLimit();
  const tbar=document.getElementById("tbar");
  timerH=setInterval(()=>{
    G.t-=0.1;
    if(tbar){
      tbar.style.width=Math.max(0,G.t/TL*100)+"%";
      if(G.t<=4){tbar.classList.add("hurry");if(Math.abs(G.t-Math.round(G.t))<0.05)SFX.tick();}
    }
    if(G.t<=0){stopTimer();resolve(null);}
  },100);
}

/* ============ 中断されたバトルの復帰 ============
   アプリが落ちても進行中バトルを失わないよう、出題のたびに G を ST.bt へ保存する。

   復元するのは「それ単体で完結する」モードだけ。物語 encounter や事件簿の戦闘は
   G に関数(storyOnBattleEnd / storyResumeFromBattle 等)がぶら下がっており、
   JSON化すると失われて物語へ戻れなくなる。関数を持つ G は保存対象から外す。

   自動では再開しない。ホームに「再開する」を出してユーザーに選ばせる。
   ボス戦は時間制限つきなので、起動と同時に再開するとタイマーが走り出して
   何もしないうちにライフを失いかねない。 */
const BT_MODES = ["train","boss","review","reco","rev","bm","surv","last","mock"];
function btSave(){
  if(!G||BT_MODES.indexOf(G.mode)<0){ST.bt=null;return;}
  for(const k in G){if(typeof G[k]==="function"){ST.bt=null;return;}} /* 別エンジン管理下 */
  try{ST.bt={g:JSON.parse(JSON.stringify(G)),d:todayNum()};}catch(e){ST.bt=null;}
}
function btClear(){ if(ST.bt){ST.bt=null;saveST();} }
window.btClear=btClear;
/* ホームに出す再開バナー(中断バトルが無ければ空文字) */
function btResumeHtml(){
  if(!ST.bt||!ST.bt.g)return "";
  const g=ST.bt.g,n=(g.ids&&g.ids.length)||0,done=Math.min(n,Number(g.idx)||0);
  return `<div class="banner" style="background:linear-gradient(135deg,#FFF3C4,#FFE1EB);text-align:left">
    ⏸ <b>途中のバトルが残っています</b>（${done}/${n}問）
    <div style="margin-top:6px;display:flex;gap:6px">
      <button class="small-btn" onclick="btResume()">再開する</button>
      <button class="small-btn" onclick="btDiscard()">やめる</button>
    </div></div>`;
}
function btResume(){
  const b=ST.bt;if(!b||!b.g)return;
  G=b.g;
  /* 中断時に出題中だったなら、その問題からやり直す(回答待ちの状態は復元しない) */
  G.awaiting=false;G.answered=false;
  battle();
}
function btDiscard(){ btClear(); home(); }
window.btResumeHtml=btResumeHtml;window.btResume=btResume;window.btDiscard=btDiscard;

/* ============ 出撃 ============ */
function base(){const mx=3+cpBonus("heal");return {life:mx,lifeMax:mx,shield:playerShield(),combo:0,coinsEarned:0,xpEarned:0,wrong:[],awaiting:false,answered:false,chestDrop:false};}
/* 出題プールの既定(選抜層 js/game/battle-select.js が未ロードでも単体で動く形) */
function bossIdsBase(i){return shuffle(Q.filter(x=>x.s===i).map(x=>x.id));}
function trainIdsBase(i){ /* リーチ→未習得→習得済の順(習得が進む体感) */
  const qs=Q.filter(x=>x.s===i).map(x=>x.id);
  const un=shuffle(qs.filter(id=>(qstat(id).s||0)<2)).sort((a,b)=>(qstat(b).s||0)-(qstat(a).s||0));
  return un.concat(shuffle(qs.filter(id=>(qstat(id).s||0)>=2)));
}
function startBoss(i){
  ST.eSeen[i]=1;
  /* 戦力想定でHPをスケール(M4): 戦力十分なら素のHP(既存と一致)、不足なら最大+50%(苦戦だが正解で必勝) */
  const bhp=(typeof bossHPScaled==="function")?bossHPScaled(i):bossHPMax(i);
  G=Object.assign(base(),{mode:"boss",boss:i,ids:(typeof bossCourseIds==="function")?bossCourseIds(i):bossIdsBase(i),idx:0,bossHP:bhp,bossMax:bhp,gim:BOSS_GIMMICK[i],turn:0,encRank:"boss"});
  storyThen("boss"+i,STORY.boss[i],battle);
}
function startTrain(i){
  ST.eSeen[i]=1;
  G=Object.assign(base(),{mode:"train",boss:i,ids:(typeof trainCourseIds==="function")?trainCourseIds(i):trainIdsBase(i),idx:0,mobKills:0,foeIdx:0,metal:null,
    mbStage:(ST.midboss&&ST.midboss[i])||0,mb:null,nextMbAt:MB_SPAWN_FIRST,/* 敵HP3×コース12問=最大4体。5体条件だと中ボスが永久に出ない(殿報告2026-08-18)ため初回は2体 */
    mobHP:0,mobHPMax:0,contFoe:false, /* 悪徳者1体を複数問の問答で論破(HP制)。contFoe=同じ敵に問い続ける間は登場アニメを出さない */
    course:true,courseCap:courseCapN(),cAns:0}); /* 1コース=約3分で一区切り(A)。ids母数は保つが cAns で小分け */
  battle();
  if(typeof msqBeat==="function")setTimeout(()=>msqBeat("rush",i),260); /* M5: 砦へ突入の物語ビート(一度きり) */
}
/* 雑魚撃破の共通処理: セッション/累計カウンタ前進+節目報酬(演出のみ・学習判定は触らない) */
function rushKill(){
  G.foeIdx=(G.foeIdx||0)+1;
  G.mobKills=(G.mobKills||0)+1;
  ST.mobKills=(ST.mobKills||0)+1;
  /* 強化石ドロップ(M4): 雑魚を倒すと時々1個。派手演出はせず静かに貯め、ショップで使う=鍛える動線 */
  if(typeof matGain==="function"&&Math.random()<0.25){matGain(1);G.matDrop=(G.matDrop||0)+1;}
  /* M6(A): レアドロップ(射幸性・課金なし)。撃破ごとに天井メーターが進み、低確率でレア
     (強化石まとめ取り/天井で装備)。報酬はゲーム内資源のみ=学習の"当て"には無関与。 */
  if(typeof rareDropRoll==="function"){
    const drop=rareDropRoll(ST);
    if(drop){
      G.dropCount=(G.dropCount||0)+1;/* セッション集計は endBattle2 の sessAdd(G) で G.dropCount を合流(二重計上防止) */
      const col=drop.big?"#FF3D7E":"#C58900";
      const bf0=document.getElementById("bossface");
      setTimeout(()=>{
        bigBanner((drop.big?"✨レアドロップ!! ":"💎ドロップ! ")+drop.label,col,drop.big?24:18);
        drop.big?SFX.ssr():SFX.chest();
        if(!prefersReduce()){if(drop.big){confetti(28);flash("#FFE1EB",160);}if(bf0)coinBurst(bf0,drop.big?12:6);}
      },520);
    }
  }
  if(typeof mobMilestone!=="function")return;
  const ms=mobMilestone(G.mobKills);
  if(!ms)return;
  G.coinsEarned+=Math.round(ms.coin*coinMult());
  let msg="🎉"+ms.n+"体撃破! +"+ms.coin+"コイン";
  if(ms.ticket){ST.tickets+=ms.ticket;msg+=" +チケ"+ms.ticket;}
  setTimeout(()=>{bigBanner(msg,"#2B9E82",20);SFX.levelup();},450);
}
/* 雑魚を倒した時の「撃破感」: 敵スプライトを弾けさせて消し(foe-die)、粒子を散らす。
   次の敵は battle() 再描画で foe-in によりポップインする。音は既存の正解SFXに任せ重ねない。 */
function foeDefeatFx(bf,emoji,n,rank){
  if(bf)bf.classList.add("foe-die");
  if(typeof srqFoeFx==="function")srqFoeFx("defeat",rank||"mob"); /* S3(F): 格ごとの撃破アニメ */
  if(!prefersReduce()&&bf){
    if(typeof fxAt==="function"&&typeof burst==="function"){
      const p=fxAt(bf);burst(p.x,p.y,emoji||"💥",n||8,95);burst(p.x,p.y,"⭐",Math.ceil((n||8)/2),125);
    }
    /* 撃破の爽快感(2026-08-14): 衝撃波+撃破スタンプ+シェイク */
    if(typeof shockRing==="function")shockRing(bf);
    if(typeof killStamp==="function")killStamp(bf,rank==="mob"?"論破!!":"撃破!!");
    if(typeof shakeApp==="function")shakeApp();
  }
}
function startLast(){
  const cfg=LASTCFG();
  let pool=examPastIds(); /* 試験の神も本試験形式(五肢択一)を最優先→○×過去問で補う */
  if(pool.length<cfg.n){
    const have={};pool.forEach(id=>have[id]=1);
    pool=pool.concat(shuffle(Q.map(x=>x.id)).filter(id=>!have[id]));
  }
  pool=pool.slice(0,cfg.n);
  G=Object.assign(base(),{mode:"last",ids:pool,idx:0,hits:0,miss:0,need:cfg.need,allow:cfg.n-cfg.need,n:cfg.n});
  G.shield=0;G.life=3;G.lifeMax=3;
  storyThen("last",STORY.last,battle);
}
function startTrue(){
  let hp=TRUE_BOSS.hp+ST.trueWin*10;
  if(typeof trueHPScaled==="function")hp=trueHPScaled(hp); /* 戦力不足なら苦戦(M4) */
  G=Object.assign(base(),{mode:"true",ids:shuffle(Q.map(x=>x.id)),idx:0,bossHP:hp,bossMax:hp});
  storyThen("true",STORY.truePre,battle);
}
function startSurvival(){
  G=Object.assign(base(),{mode:"surv",ids:shuffle(Q.map(x=>x.id)),idx:0,kills:0});
  battle();
}
/* 復習/リベンジ/ブクマ/おすすめは1コース=courseCapN問に小分け。残りは次コースへ引き継ぐ(B)。
   母数(poolFull)は結果画面の『あと◯コース/◯問』に使う。学習判定は据え置き=retrievalは不変。 */
function startRevenge(){
  const full=shuffle(wrongIds());if(!full.length)return;
  const pool=full.slice(0,courseCapN());const hp=pool.length*playerDmg();
  G=Object.assign(base(),{mode:"rev",ids:pool,idx:0,bossHP:hp,bossMax:hp,course:true,courseCap:pool.length,poolFull:full.length});
  battle();
}
function startBookmark(){
  const full=shuffle(bmIds());if(!full.length)return;
  const pool=full.slice(0,courseCapN());const hp=pool.length*playerDmg();
  G=Object.assign(base(),{mode:"bm",ids:pool,idx:0,bossHP:hp,bossMax:hp,course:true,courseCap:pool.length,poolFull:full.length});
  battle();
}
function startReview(){
  const full=shuffle(dueIds());if(!full.length)return;
  const pool=full.slice(0,courseCapN());const hp=pool.length*playerDmg();
  G=Object.assign(base(),{mode:"review",ids:pool,idx:0,bossHP:hp,bossMax:hp,course:true,courseCap:pool.length,poolFull:full.length});
  battle();
}
function startReco(){
  const r=recommend20(courseCapN()+officeBonus("reco"));if(!r.ids.length)return; /* 事務所ボーナスの+枠は維持 */
  const hp=r.ids.length*playerDmg();
  G=Object.assign(base(),{mode:"reco",ids:r.ids,idx:0,bossHP:hp,bossMax:hp,reasons:r.reasons,course:true,courseCap:r.ids.length});
  battle();
}

/* ============ バトル描画 ============ */
function curQ(){
  if((G.mode==="surv"||G.mode==="true")&&G.idx>=G.ids.length){
    /* 無限プールの継ぎ目で直前と同じ問題を続けて出さない(暗記防止B) */
    const prev=G.ids.length?G.ids[G.ids.length-1]:null;
    G.ids=G.ids.concat(typeof shuffleNoRepeat==="function"?shuffleNoRepeat(Q.map(x=>x.id),prev):shuffle(Q.map(x=>x.id)));
  }
  return qById(G.ids[G.idx]);
}
function heartsHtml(){
  if(isExam())return '<span style="font-size:11px;font-weight:900;color:#8A8494">📝 装備・お守り・回復 無効</span>';
  let h="";
  for(let i=0;i<(G.lifeMax||3);i++)h+=i<G.life?px("heart",18):`<span style="opacity:.2">${px("heart",18)}</span>`;
  for(let i=0;i<G.shield;i++)h+=px("shield",16);
  return h;
}
/* 修行=道中エンカウント: そのボスの手下と街道で連戦し、習得を進めてボスへ迫る */
const TRAIN_FOES=[
 {sp:"skull",name:"サビ残の亡霊"},{sp:"ghost",name:"タイムカード番"},
 {sp:"bag",name:"みなし残業マン"},{sp:"daruma",name:"シフトの鬼"},
 {sp:"pill",name:"有休握りつぶし"},{sp:"medal",name:"名ばかり店長"}];
/* いま目の前の雑魚敵(メタル出現中はメタル)。enemies.js未ロード時はTRAIN_FOESにフォールバック */
function trainFoe(){
  if(G&&G.metal)return G.metal;
  /* 物語の演習: 名前付きヴィラン(js/data/villains.js)を相手として固定表示する。
     雑魚ロスター・図鑑記録(mobFoe/beKey)は従来どおりで無傷。 */
  if(G&&G.storyFoe&&!G.mb)return G.storyFoe;
  const si=(G&&G.boss)||0,fi=(G&&G.foeIdx)||0;
  if(typeof mobFoe==="function")return mobFoe(si,fi);
  const f=TRAIN_FOES[fi%TRAIN_FOES.length];return {sp:f.sp,n:f.name};
}
function bossOf(q){
  if(G.mode==="boss"){const g=BOSS_GIMMICK[G.boss];return {sp:BOSSES[G.boss].sp,name:BOSSES[G.boss].name,sub:g&&g.t==="regen"?"⚠態勢を立て直す(速攻せよ)":g&&g.t==="haste"?"⚠恫喝で時間を奪う":BOSSES[G.boss].sub};}
  if(G.mode==="train"){
    if(G.mb){const m=G.mb;return {sp:m.sp,name:"⚑"+m.n,sub:"弱点【"+m.weakLabel+"】で追撃"};}
    const f=trainFoe();
    if(G.metal)return {sp:f.sp,name:"✨"+f.n,sub:"メタル出現! あと"+G.metal.turns+"問で逃走 — 倒せば大当たり!"};
    if(G.storyFoe)return {sp:f.sp,name:f.n,sub:G.storyFoe.sub||""}; /* 物語の名前付きヴィラン(肩書きのみ) */
    return {sp:f.sp,name:f.n,sub:""}; /* 殿(2026-08-15): 敵の体力だけ。街道/撃破数は出さない */
  }
  if(G.mode==="easy")return {sp:"skull",name:"練習の的",sub:"はじまりの試練 ─ 落ち着いて○×で答えよう(制限時間なし)"};
  if(G.mode==="demon")return {sp:"mao",name:"👹 試験の悪魔",sub:"本試験の化身 ─ リアル過去問"+(typeof DEMON_CFG!=="undefined"?DEMON_CFG.n:7)+"問・"+(typeof DEMON_CFG!=="undefined"?DEMON_CFG.need:5)+"問正解で撃破"};
  if(G.mode==="last")return {sp:"god",name:"試験の神",sub:"過去問のみ・約7割で勝利"};
  if(G.mode==="mock")return {sp:"scroll",name:"簡易模試",sub:"9科目×4問・科目基準+総合基準を突破せよ"};
  if(G.mode==="nendo")return {sp:"scroll",name:"📜 "+(G.setLabel||"年度別過去問"),sub:"過去問道場(裏面)─ 本試験形式・本試験ペースでやり込む"};
  if(G.mode==="sentaku")return {sp:"scroll",name:"📝 選択式演習",sub:"本試験の選択式 ─ 長文の空欄【A〜E】に20択から語句を入れる(各1点)"};
  if(G.mode==="true")return TRUE_BOSS;
  if(G.mode==="rev")return {sp:"skull",name:"リベンジ軍団",sub:"過去に敗れた問題"};
  if(G.mode==="bm")return {sp:"star",name:"ブックマーク隊",sub:"要注意の問題たち"};
  if(G.mode==="review")return {sp:"ghost",name:"忘却の亡霊",sub:"今日が復習どき(XP2倍)"};
  if(G.mode==="reco")return {sp:"sage",name:G.topicName||"賢者の特訓",sub:G.topicName?"この論点を全問制覇せよ":"学習データが選んだ今日の20問"};
  if(G.mode==="case")return G.caseBoss||BOSSES[0];
  return BOSSES[q.s];
}
function comboText(){
  if(G.combo<2)return "";
  const t=comboTier(G.combo);
  return (t?`<span style="color:${t.color}">${t.name}</span> `:"")+"🔥"+G.combo+"コンボ";
}

/* ボス固有ギミック: regen=nターンごとHP回復 / haste=nターンごと次の1問だけ時間短縮 */
const BOSS_GIMMICK=[
 {t:"regen",n:3,v:2,msg:"残業マグマが燃え上がる! HP回復"},
 {t:"haste",n:3,msg:"安全鬼の恫喝! 次の1問は時間-3秒"},
 {t:"regen",n:4,v:2,msg:"ロウサイ大王がもみ消す! HP回復"},
 {t:"haste",n:3,msg:"シツギョウ魔人の焦らし! 時間-3秒"},
 {t:"regen",n:3,v:2,msg:"取立番長の粘り! HP回復"},
 {t:"haste",n:4,msg:"ケンポ将軍の圧! 時間-3秒"},
 {t:"regen",n:3,v:2,msg:"コクネン仙人の惑わし! HP回復"},
 {t:"haste",n:3,msg:"コウネン皇帝の威圧! 時間-3秒"},
 {t:"regen",n:4,v:3,msg:"統計老師の霧! HP回復"}];
function bossHpBar(){
  const bar=document.getElementById("bosshp");if(bar)bar.style.width=(G.bossHP/G.bossMax*100)+"%";
  const hb=document.getElementById("hpbig");if(hb)hb.innerHTML=`HP ${G.bossHP}<small>/${G.bossMax}</small>`;
}
/* コース進捗HUD(C): 常時「あと◯問」と進捗バーでゴールの近さを見せる。3分でも達成感。
   train は cAns(=このコースで答えた数)、プール系は idx を進捗に使う。G.course の時だけ表示。 */
function courseHud(){
  if(!G||!G.course)return "";
  const cap=G.courseCap||courseCapN();
  const done=Math.min(cap,(G.mode==="train"?(G.cAns||0):(G.idx||0)));
  const remain=Math.max(0,cap-done);
  const pct=cap?Math.min(100,Math.round(done/cap*100)):0;
  const tail=remain===0?"クリア!":remain<=3?"ゴール目前!":"";
  /* S4(E): 「◯/◯問」を常時見せる(いまどれだけ進んだかが一目で分かる)。あと◯問も残す。 */
  return `<div class="course-hud"><div class="course-bar" role="progressbar" aria-valuemin="0" aria-valuemax="${cap}" aria-valuenow="${done}"><i style="width:${pct}%"></i></div>
    <div class="course-lab">🎯 このコース <b>${done}/${cap}</b>問 (${pct}%) ｜ あと<b>${remain}</b>問${tail?" — "+tail:""}</div></div>`;
}
/* 進捗チップ(殿要望2026-08-21「何%進捗してるか分からん」)。
   上部バーに常時「n/N問 ・ x%」を出す。courseHud は画面下にあり戦闘中は視界に入らない、
   かつ course 系以外(模試/年度別/選択式/ボス)では何も出ていなかった。
   モードごとに「何をもって1セッションか」が違うので、ここで一本化して数える。 */
function btProgressCount(){
  if(!G)return null;
  /* 物語戦: 進捗=敵HPをどれだけ削ったか(殿2026-08-28「問題ではなく敵を倒せば進む」) */
  if(G.storyVid&&G.storyHPMax){
    const hp=(G.storyHP!=null)?G.storyHP:G.storyHPMax;
    return {done:Math.max(0,G.storyHPMax-hp),total:G.storyHPMax,hp:true};
  }
  /* 解答済みで「次へ」待ちの1問は、カウンタが進む前でも進捗に数える
     (答えた瞬間にバーが動かないと、進んでいる実感が出ない) */
  const adv=(G.answered&&!G.awaiting)?1:0;
  /* コース制(修行・復習・ブクマ・リベンジ・おすすめ): 答えた数 / 1コースの問数 */
  if(G.course){
    const cap=G.courseCap||courseCapN();
    if(cap>0)return {done:Math.min(cap,(G.mode==="train"?(G.cAns||0):(G.idx||0))+adv),total:cap};
  }
  /* 出題数が決まっているモード(悪魔・試験の神・模試・年度別・選択式など) */
  if(typeof G.n==="number"&&G.n>0)return {done:Math.min(G.n,(G.idx||0)+adv),total:G.n};
  /* 科目ボス等はHPの削り具合が進捗そのもの */
  if(typeof G.bossMax==="number"&&G.bossMax>0&&typeof G.bossHP==="number")
    return {done:Math.max(0,G.bossMax-G.bossHP),total:G.bossMax,hp:true};
  if(Array.isArray(G.ids)&&G.ids.length)return {done:Math.min(G.ids.length,(G.idx||0)+adv),total:G.ids.length};
  return null;
}
function btProgressPct(){
  const c=btProgressCount();
  if(!c||!c.total)return null;
  return Math.max(0,Math.min(100,Math.round(c.done/c.total*100)));
}
function btProgressChip(){
  const c=btProgressCount(),pct=btProgressPct();
  if(pct==null)return "";
  const lab=c.hp?`敵HP${c.total-c.done}/${c.total}`:`${c.done}/${c.total}問 ${pct}%`;
  return `<span class="prog-chip" id="progChip" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct}"
    aria-label="このバトルの進捗"><i style="width:${pct}%"></i><b>${lab}</b></span>`;
}
/* 解答のたびに数字だけ差し替える(再描画を待たずに進捗が動く) */
function btProgressSync(){
  const el=document.getElementById("progChip");
  if(!el||typeof el.querySelector!=="function")return;   /* 最小DOM(テスト)では何もしない */
  const c=btProgressCount(),pct=btProgressPct();
  if(pct==null){if(el.style)el.style.display="none";return;}
  const bar=el.querySelector("i"),lab=el.querySelector("b");
  if(bar&&bar.style)bar.style.width=pct+"%";
  if(lab)lab.textContent=c.hp?`敵HP${c.total-c.done}/${c.total}`:`${c.done}/${c.total}問 ${pct}%`;
  if(typeof el.setAttribute==="function")el.setAttribute("aria-valuenow",String(pct));
}
/* 戦況に応じたBGMシーン: メタル出現中=metal / ボス・中ボス=boss / 雑魚ラッシュ等=battle */
function battleScene(){
  if(!G)return "battle";
  if(G.metal)return "metal";
  if(G.mb)return "midboss";
  if(G.mode==="boss"||G.mode==="last"||G.mode==="true"||G.mode==="demon"||G.mode==="mock"||G.mode==="nendo"||G.mode==="sentaku")return "boss";
  if(G.storyVid&&(G.encRank==="lt"||G.encRank==="mid"||G.encRank==="boss"))return "boss"; /* 物語のボス格はボス曲 */
  return "battle";
}
/* 敵の煽り吹き出し(foePoseHtml)は削除(殿: このコメントいらない 2026-08-14)。 */
function battle(){
  stopTimer();hideOvlSilent();
  if(typeof zFlashClear==="function")zFlashClear(); /* S4(C): 前問の図解フラッシュを持ち越さない */
  const q=curQ();
  if(typeof recentQPush==="function"&&q)recentQPush([q.id]); /* S4(A): 出した問題を"避けリスト"へ */
  if(typeof quizPrepShuffle==="function")quizPrepShuffle(q); /* 暗記防止(A): この問題の選択肢表示順を確定 */
  /* 中ボス出現: 雑魚を一定数(MB_SPAWN_KILLS)倒すと次の中ボスが登場。撃破で階段を1段のぼる。
     メタル・中ボスは重ねない(bossOf前に判定して即反映) */
  if(G.mode==="train"&&!G.storyVid&&!G.metal&&!G.mb&&typeof midbossNext==="function"){
    const nx=midbossNext(G.boss,G.mbStage||0);
    if(nx&&(G.mobKills||0)>=(G.nextMbAt||0)){
      const mhp=(typeof mbHPScaled==="function")?mbHPScaled(nx.hp,G.boss):nx.hp; /* 戦力不足なら+最大2(M4) */
      G.mb=Object.assign({hp:mhp,hpMax:mhp},nx);
      const mn=G.mb.n,tt=G.mb.taunt;
      /* S3(F): 名前を大きく見せる登場バナー＋登場アニメ(格=中ボス)。演出層が無ければ従来通り */
      const shown=(typeof srqFoeBanner==="function")&&srqFoeBanner({n:mn,ttl:tt||"",rank:"mid"});
      if(typeof srqFoeFx==="function")setTimeout(()=>srqFoeFx("enter","mid"),120);
      if(!shown){setTimeout(()=>{bigBanner("⚑中ボス出現! "+mn,"#7A3BC9",22);},250);
        if(tt)setTimeout(()=>bigBanner("👹 "+tt,"#7A3BC9",14),700);}
      setTimeout(()=>SFX.special(),250);
    }
  }
  /* 雑魚ラッシュ: 2体目以降でごく低確率にメタル敵が湧く(中ボス戦中は湧かない)。
     メタルは種別ごとに硬さ(hp)・逃走猶予(turns)・大当たり報酬(coin/xp)が違う=遭遇自体が特別。
     旧コード互換のため hp/turns 未指定時は既定(METAL_HP/METAL_TURNS)へフォールバック。 */
  if(G.mode==="train"&&!G.storyVid&&!G.metal&&!G.mb&&(G.mobKills||0)>0&&typeof metalPick==="function"&&Math.random()<METAL_CHANCE){
    const mp=metalPick(G.mobKills),mh=mp.hp||METAL_HP,mt=mp.turns||METAL_TURNS;
    G.metal=Object.assign({},mp,{hp:mh,hpMax:mh,turns:mt});
    if(typeof bestiaryHit==="function")bestiaryHit(ST,"M"+(mp.mi||0),todayNum(),false); /* 遭遇を記録(逃走含む) */
    const mn=G.metal.n,king=(mp.rank==="虹");
    setTimeout(()=>{
      bigBanner((king?"✨✨":"✨")+(mp.rank?mp.rank+" ":"")+mn+"が現れた!",king?"#FF3D7E":"#C58900",king?26:22);
      king?SFX.ssr():SFX.chest();
      if(!prefersReduce())flash(king?"#FFE1EB":"#FFF3C4",king?200:120);
    },250);
  }
  /* BGMは中ボス/メタルの出現判定を終えた後に確定させる(出現した戦況を即反映) */
  if(typeof setBgmScene==="function")setBgmScene(battleScene());
  const b=bossOf(q);
  if(G.mode==="case"&&G.taunts&&G.taunts[q.id]&&!G.tauntDone?.[q.id]){
    (G.tauntDone=G.tauntDone||{})[q.id]=1;
    setTimeout(()=>bigBanner("👹 "+G.taunts[q.id],"#7A3BC9",15),350);
  }
  G.awaiting=true;G.answered=false;G.awaitCounter=null;G.counterDone=false;
  let hpHtml="";
  if(G.mode==="surv"){
    hpHtml=`<div class="hp-label">討伐 <b style="color:var(--pink)">${G.kills}</b>体 ｜ +${G.coinsEarned}コイン</div>`;
  }else if(G.mode==="train"){
    const mp=Math.round(masteryPct(G.boss)*100),nd=unlockNeed();
    if(typeof trainHud==="function"){hpHtml=trainHud(G,mp,nd);}
    else{
      const metal=G.metal;
      hpHtml=`<div class="hp-big" id="hpbig">⚔ 撃破 <b style="color:var(--pink)">${G.mobKills||0}</b>体</div>
        <div class="hpbar"><i style="width:${Math.min(100,mp/nd*100)}%;background:linear-gradient(90deg,var(--mint),var(--yellow))"></i></div>
        <div class="hp-label">🛣 ${SUBJECTS[G.boss]}街道 ｜ 制圧 <b style="color:#2B9E82">${mp}%</b>/${nd}%で${BOSSES[G.boss].name}出現${metal?` ｜ <b style="color:#C58900">✨メタル! 残りHP${metal.hp}・あと${metal.turns}問</b>`:""}</div>`;
    }
  }else if(G.mode==="mock"){
    hpHtml=mockHud();
  }else if(G.mode==="nendo"&&typeof nendoHud==="function"){
    hpHtml=nendoHud();
  }else if(G.mode==="sentaku"&&typeof sentakuHud==="function"){
    hpHtml=sentakuHud();
  }else if(G.mode==="last"||G.mode==="demon"){
    const tail=G.mode==="demon"?"👹試験の悪魔・本試験さながら":"本番同様モード";
    hpHtml=`<div class="hp-big" id="hpbig">正解 ${G.hits}<small>/${G.need}</small></div>
      <div class="hpbar"><i id="bosshp" style="width:${Math.min(100,G.hits/G.need*100)}%;background:linear-gradient(90deg,var(--mint),var(--yellow))"></i></div>
      <div class="hp-label">第${G.idx+1}/${G.n}問 ｜ ミスできる残り <b style="color:var(--red)">${G.allow-G.miss}</b> ｜ ${tail}</div>`;
  }else{
    hpHtml=`<div class="hp-big" id="hpbig">HP ${G.bossHP}<small>/${G.bossMax}</small></div>
      <div class="hpbar"><i id="bosshp" style="width:${G.bossHP/G.bossMax*100}%"></i></div>
      <div class="hp-label">${ST.loop}周目 ｜ +${G.coinsEarned}コイン ｜ +${G.xpEarned}XP</div>`;
  }
  app.innerHTML=`
  <div class="topbar">
    <button class="small-btn" onclick="retreat()">← 撤退</button>
    <span class="coin-chip">${px("coin",15)} ${ST.coins+G.coinsEarned}</span>
    ${btProgressChip()}
  </div>
  <div class="arena ${G.mode==="true"?"dark":""}" id="arena">
    <div class="boss-name">${b.name}<small>${b.sub}</small></div>
    <div id="bossface" class="${((G.mode==="train"&&!G.contFoe)||G.mode==="surv")?"foe-in ":""}${G.mode==="train"&&G.metal?"metal-aura"+(G.metal.rank==="虹"?" metal-top":""):""}" style="display:inline-block">${px(b.sp,84,"floaty")}</div>
    ${hpHtml}
    <div class="dmg-pop" id="dmg"></div>
  </div>
  <div class="player-row">
    <span class="hearts" id="hearts">${heartsHtml()}</span>
    ${ST.potions>0&&G.life<(G.lifeMax||3)&&!isExam()?`<button class="btn potion-btn" onclick="usePotion()">${px("potion",14)}回復×${ST.potions}</button>`:""}
    <span class="combo-disp" id="combo">${comboText()}</span>
  </div>
  ${isTimed()?'<div class="timerbar"><i id="tbar" style="width:100%"></i></div>':'<div class="notimer">⏱ 時間制限なし ─ じっくり考えてOK(本番同様の時間制限はボス戦のみ)</div>'}
  <span class="q-tag">${SUBJECTS[q.s]} ｜ 攻撃力${playerDmg()}</span>${typeof gearBattleChip==="function"?gearBattleChip():""}
  ${(qstat(q.id).s||0)===1&&qstat(q.id).la!==todayNum()?'<span class="q-tag reach-tag">★あと1問正解で習得!</span>':""}
  ${typeof lvNearMiss==="function"&&lvNearMiss()?'<span class="q-tag reach-tag">⚡あと1問でレベルアップ!</span>':""}
  ${typeof battleStratHtml==="function"?battleStratHtml():""}
  ${G.reasons&&G.reasons[q.id]?`<div class="reco-why">💡 ${G.reasons[q.id]}</div>`:""}
  ${(((typeof beginnerAuto==="function"&&beginnerAuto()))||isLeech(q.id))&&q.topicIntro?`<div class="reco-why" style="background:#FFFBEB;color:#7A5B00">🔰 ${esc(q.topicIntro)}</div>`:""}
  ${quizQuestionCard(q)}
  ${quizAnswerArea(q)}
  <div class="fb" id="fb">
    <div class="v" id="fbv"></div><div class="e" id="fbe"></div>
    <div class="fb-actions">
      <button class="btn bm-btn" id="bmBtn" onclick="bmToggleBattle()">☆ブクマ</button>
      <button class="btn bm-btn" id="zBtn" onclick="zToggle()" style="display:none">📊図解</button>
      <button class="btn go-btn" onclick="nextTurn()">次へ ▶</button>
    </div>
    <div class="zwrap" id="zwrap"></div>
  </div>`;
  if(isTimed()){G.t=timeLimit();if(G.hasteNext){G.t=Math.max(4,G.t-3);G.hasteNext=0;}startTick();}else{G.t=0;}
  btSave(); /* 出題のたびに中断復帰用のスナップショットを更新 */
}
function usePotion(){
  if(ST.potions<=0||G.life>=(G.lifeMax||3))return;
  ST.potions--;G.life++;SFX.buy();saveST();
  const h=document.getElementById("hearts");if(h){h.innerHTML=heartsHtml();h.classList.add("pop");}
  const d=document.getElementById("dmg");if(d){d.textContent="回復!";d.className="dmg-pop show heal";}
  const pb=document.querySelector(".potion-btn");
  if(pb&&(ST.potions<=0||G.life>=(G.lifeMax||3)))pb.remove();
  else if(pb)pb.innerHTML=px("potion",14)+"回復×"+ST.potions;
}
window.usePotion=usePotion;

/* ============ 回答処理 ============ */
function answer(v){if(!G.awaiting)return;stopTimer();resolve(v);}
function resolve(userAns){
  if(!G.awaiting)return;G.awaiting=false;G.answered=true;
  const q=curQ(),st=qstat(q.id);
  const timeout=(userAns===null);
  const ext=(userAns!==null&&typeof userAns==="object"); /* tap_error/choice からの結果 */
  const ok=!timeout&&(ext?userAns.ok:userAns===q.a);
  const extLabel=ext?userAns.label:"";
  const repeat=(st.la===todayNum())&&(st.c+st.w)>0; /* 今日すでに解いた問題 */
  quizDisableAll();
  const crit=ok&&isTimed()&&G.t>=timeLimit()-critWindow();
  const bf=document.getElementById("bossface"),dmg=document.getElementById("dmg"),arena=document.getElementById("arena");
  const bO=document.getElementById("btnO"),bX=document.getElementById("btnX");
  if(bO)bO.disabled=true;if(bX)bX.disabled=true;
  /* 法律図鑑: 出題された論点は解放 */
  const zk0=zkey(q);if(zk0&&!ST.zk[zk0])ST.zk[zk0]=1;
  ST.dq.ans++;histTick(ok);
  if(window.__srqHaptic)window.__srqHaptic(ok?"ok":"ng"); /* ネイティブのみ。Webはno-op */

  if(ok){
    const wasSeen=(st.c+st.w)>0;
    const hadWrong=(st.w>0)||!!st.ng; /* 過去に誤答した「苦手」か(st.ng更新前に判定) */
    const memMult=memBonusMult(st,wasSeen); /* la更新前に判定 */
    st.c++;st.ng=false;
    if(!repeat)st.s=(st.s||0)+1; /* 同日連打では習得ストリークは進まない */
    if(!repeat&&st.s===2){setTimeout(()=>{bigBanner("★習得! 全"+masteredCount()+"問目","#C58900",24);SFX.chest();},500);
      if(typeof sessMastered==="function")sessMastered(q.q);} /* M6(D): 今日の戦果「定着した論点」に記録 */
    ST.totalC++;ST.dq.cor++;
    if(gaugeOnCorrect())setTimeout(()=>{bigBanner("🎰ゲージMAX! ガチャチケ+1","#FF3D7E",22);SFX.chest();},900);
    const wasDue=srsOnCorrect(st,wasSeen);
    /* 正解の質で攻撃を差別化(速度=critは種別に関与させない) */
    const ak=ATK[attackKind(q,{wasDue,repeat,hadWrong,format:quizFormat(q)})];
    if(crit)ST.cnt.crit++;
    G.combo++;if(G.combo>ST.maxCombo)ST.maxCombo=G.combo;
    if(G.combo>(G.bestCombo||0))G.bestCombo=G.combo;
    /* コンボ段階・必殺技 */
    const tier=comboTier(G.combo);
    const sp=SPECIALS.find(x=>x.at===G.combo);
    const tierHit=TIERS.find(x=>x.n===G.combo);
    let spDmg=0;
    if(sp){
      spDmg=sp.dmg;ST.cnt.sp++;
      bigBanner("⚡"+sp.name+"!",sp.flash,30);flash(sp.flash,160);SFX.special();
      if(sp.heal&&G.life<(G.lifeMax||3)&&!isExam()){G.life++;}
    }else if(tierHit){
      bigBanner(tierHit.name,tierHit.color,36);SFX.special();
    }
    /* ダメージ・コイン・XP(速度=critの報酬は控えめに。熟読が本質) */
    /* セット効果のボス追撃(M4): ボス/真ボス戦のみ。装備無効モードは setBossDmg 側で0 */
    const setb=((G.mode==="boss"||G.mode==="true")&&typeof setBossDmg==="function")?setBossDmg():0;
    const d=playerDmg()+(crit?1:0)+(tier?tier.dmg:0)+spDmg+setb;
    let coin=(10+(crit?2:0)+Math.min(G.combo,10)*2)*ST.loop;
    coin*=(tier?tier.mult:1)*coinMult()*(1+statCoinBonus());
    if(G.mode==="rev")coin*=2;
    if(repeat)coin*=0.25; /* 同日周回は報酬減(丸暗記周回を最適解にしない) */
    coin*=memMult;
    coin*=ak.mult; /* 正解の質で控えめに色付け */
    coin=Math.round(coin);
    G.coinsEarned+=coin;
    let xp=12+(crit?2:0)+(tier?tier.dmg*2:0);
    if(G.mode==="review"||wasDue)xp*=2;
    if(repeat)xp*=0.25;
    xp*=memMult;
    xp*=ak.mult;
    if(memMult>1)setTimeout(()=>{bigBanner(memMult===2?"🧠✨完全記憶ボーナス ×2!":"🧠長期記憶ボーナス ×1.5!","#7A6FB0",20);},350);
    xp=Math.round(xp);
    const ups=gainXp(xp);G.xpEarned+=xp;
    if(bf){bf.classList.add("hit");floatXp(bf,`+${xp}XP`);}
    if(typeof weaponSwingFx==="function")weaponSwingFx(bf,crit); /* 装備中の武器ごとに違う振り味(見た目のみ) */
    /* 攻撃の手応え(2026-08-14): 正解=斬撃が走る。会心/高コンボは太い二連斬+画面シェイク */
    if(typeof slashFx==="function")slashFx(bf,crit||G.combo>=10);
    if((crit||G.combo>=5)&&!prefersReduce()&&typeof shakeApp==="function")shakeApp();
    /* コンボ即時反映+パンチ演出(次の問題を待たずに数字が跳ねる) */
    {const cEl=document.getElementById("combo");
     if(cEl){cEl.innerHTML=comboText();cEl.classList.remove("punch");void cEl.offsetWidth;cEl.classList.add("punch");}}
    if(crit||ak.fx>=2)coinBurst(bf,6);
    if(dmg){
      if(G.mode==="train"){/* 撃破テキストは下のラッシュ処理で設定 */}
      else if(G.mode==="last"||G.mode==="demon")dmg.textContent=crit?"会心の的中!":"的中!";
      else dmg.textContent=ak.name+"! -"+d; /* 通常/精密/弱点/記憶会心 で名前が変わる */
      dmg.className="dmg-pop show "+((crit||ak.fx>=2)?"crit":"");}
    /* 演出は階層化: 重要区分(fx3)だけ派手に。長期記憶バナーと二重表示は避ける */
    if(ak.fx>=3&&memMult<=1)setTimeout(()=>bigBanner("⚡"+ak.name+"! "+ak.word,"#7A6FB0",20),350);
    crit?SFX.crit():SFX.ok();SFX.coin();
    if(G.mode==="surv")G.kills++;
    else if(G.mode==="train"){
      /* 雑魚ラッシュ: 1問正解=目の前の敵1体撃破→次が即湧く。学習判定(mastery/box/SRS)は上で据え置き。 */
      const foeName=bossOf(q).name; /* メタル中は "✨…" */
      if(G.metal){
        G.metal.hp--;
        if(G.metal.hp<=0){
          /* 種別ごとの大当たり報酬(未指定は旧既定 200/80)。上位ほど桁違い=倒せたら震える */
          const king=(G.metal.rank==="虹"),mi=G.metal.mi||0;
          const mc=Math.round((G.metal.coin||200)*ST.loop*coinMult()),mx=Math.round((G.metal.xp||80)*xpMult());
          G.coinsEarned+=mc;G.xpEarned+=mx;const mups=addXpRaw(ST,mx);
          ST.metalKills=(ST.metalKills||0)+1;
          if(typeof matGain==="function")matGain(king?4:2); /* メタル討伐=強化石まとめ取り(M4) */
          if(typeof bestiaryHit==="function")bestiaryHit(ST,"M"+mi,todayNum(),true); /* 図鑑に討伐記録 */
          rushKill(); /* メタルも1体としてカウント+節目判定 */
          if(bf){bf.classList.add("foe-die");coinBurst(bf,king?16:10);
            if(!prefersReduce()){if(typeof shockRing==="function")shockRing(bf,king?"#FF3D7E":"#C58900");if(typeof killStamp==="function")killStamp(bf,"✨撃破!!");if(typeof shakeApp==="function")shakeApp();}}
          if(typeof srqFoeFx==="function")srqFoeFx("defeat","lt"); /* S3(F): メタル撃破アニメ */
          if(!prefersReduce()){confetti(king?60:40);flash(king?"#FFD1E8":"#FFE9A8",king?260:180);}
          setTimeout(()=>{bigBanner((king?"✨✨超大当たり!! ":"✨大当たり! ")+foeName+" 撃破 +"+mc+"コイン",king?"#FF3D7E":"#C58900",king?28:22);king?SFX.ssr():SFX.chest();},200);
          if(dmg){dmg.textContent="✨メタル撃破!! +"+mc+"コイン +"+mx+"XP";dmg.className="dmg-pop show crit";}
          G.metal=null;
          if(mups>0)setTimeout(()=>lvUpShow(),380);
        }else{
          if(dmg){dmg.textContent="✨メタルに命中! 残りHP"+G.metal.hp+" — トドメを!";dmg.className="dmg-pop show crit";}
        }
      }else if(G.mb){
        /* 中ボス戦: 1問正解=1ダメージ。弱点(苦手克服/記憶会心/誤り看破)に合致で追撃+1。
           学習判定(mastery/box/SRS)は上で据え置き。撃破で階段を1段のぼる。 */
        const weak=(typeof mbWeakHit==="function")&&mbWeakHit(G.mb,{ak});
        const hit=1+(weak?1:0);
        G.mb.hp=Math.max(0,G.mb.hp-hit);
        if(G.mb.hp<=0){
          const mbName=G.mb.n;
          const rw=(typeof midbossReward==="function")?midbossReward(G.mb,ST.loop):{coin:120,xp:45,chest:1,ticket:0};
          const mc=Math.round(rw.coin*coinMult()),mx=Math.round(rw.xp*xpMult());
          G.coinsEarned+=mc;G.xpEarned+=mx;const mups=addXpRaw(ST,mx);
          if(rw.chest)ST.chests+=rw.chest;if(rw.ticket)ST.tickets+=rw.ticket;
          if(typeof matGain==="function")matGain(3); /* 中ボス討伐=強化石(M4) */
          ST.midboss[G.boss]=Math.min((ST.midboss[G.boss]||0)+1,(typeof midbossCount==="function")?midbossCount(G.boss):(G.mbStage+1));
          G.mbStage=ST.midboss[G.boss];
          ST.midKills=(ST.midKills||0)+1;
          rushKill(); /* 中ボスも1体としてカウント(節目報酬も進む) */
          G.nextMbAt=(G.mobKills||0)+(typeof MB_SPAWN_KILLS!=="undefined"?MB_SPAWN_KILLS:5);
          G.mb=null;G.contFoe=false; /* 次は新しい悪徳者→登場アニメを出す */
          if(bf){bf.classList.add("foe-die");coinBurst(bf,8);
            if(!prefersReduce()){if(typeof shockRing==="function")shockRing(bf,"#8A6FD1");if(typeof killStamp==="function")killStamp(bf,"⚑撃破!!");if(typeof shakeApp==="function")shakeApp();}}
          if(typeof srqFoeFx==="function")srqFoeFx("defeat","mid"); /* S3(F): 中ボス撃破アニメ */
          if(!prefersReduce())confetti(30);
          let bmsg="⚑中ボス撃破! "+mbName+" +"+mc+"コイン 🪙石+3";
          if(rw.ticket)bmsg+=" +チケ"+rw.ticket;
          setTimeout(()=>{bigBanner(bmsg,"#C58900",22);SFX.chest();},200);
          if(dmg){dmg.textContent="⚑ "+mbName+" 撃破!! +"+mc+"コイン +"+mx+"XP";dmg.className="dmg-pop show crit";}
          if(mups>0)setTimeout(()=>lvUpShow(),380);
          if(typeof msqBeat==="function"){const _bch=G.boss;setTimeout(()=>msqBeat("mid",_bch),1000);} /* M5: 中ボス撃破の物語ビート(一度きり) */
        }else{
          G.contFoe=true; /* 同じ中ボスに挑み続ける間は登場アニメを出さない */
          if(typeof srqFoeFx==="function")srqFoeFx("hit","mid"); /* S3(F): 中ボス被弾アニメ */
          if(dmg){dmg.textContent=(weak?"⚡弱点直撃! ":"⚔ ")+foeName+"に命中! 残りHP"+G.mb.hp;dmg.className="dmg-pop show"+(weak?" crit":"");}
        }
      }else if(G.storyVid&&G.storyHPMax){
        /* 物語戦(殿2026-08-28): 敵はヴィラン1体。正解=1ダメージ、HPを削り切れば撃破=物語が進む。
           問数の消化では終わらない。学習判定(mastery/box/SRS)は上で据え置き。 */
        const nm=(G.storyFoe&&G.storyFoe.n)||foeName;
        G.storyHP=Math.max(0,(G.storyHP!=null?G.storyHP:G.storyHPMax)-1);
        if(G.storyHP>0){
          G.contFoe=true; /* 同じ敵に問い続ける=登場アニメを出さない */
          if(typeof srqFoeFx==="function")srqFoeFx("hit",G.encRank||"mob");
          const bar=document.getElementById("bosshp");if(bar)bar.style.width=(G.storyHP/G.storyHPMax*100)+"%";
          const hb=document.getElementById("hpbig");if(hb)hb.innerHTML=`⚔ ${esc(nm)} <b style="color:var(--pink)">HP${G.storyHP}</b><small>/${G.storyHPMax}</small>`;
          if(dmg){dmg.textContent="⚔ "+nm+"に命中! 残りHP"+G.storyHP;dmg.className="dmg-pop show";}
        }else{
          /* 撃破。勝利確定は nextTurn(解説を読んで「次へ」を押した後)で行う */
          G.contFoe=false;
          rushKill(); /* 1体としてカウント(ミッション/節目報酬も進む) */
          const rk=(G.encRank==="mid"||G.encRank==="boss")?"mid":(G.encRank==="lt"?"lt":"mob");
          foeDefeatFx(bf,"💥",rk==="mob"?8:12,rk);
          if(typeof srqFoeFx==="function")srqFoeFx("defeat",rk);
          if(!prefersReduce())confetti(rk==="mob"?18:30);
          const bar=document.getElementById("bosshp");if(bar)bar.style.width="0%";
          const hb=document.getElementById("hpbig");if(hb)hb.innerHTML=`⚔ ${esc(nm)} <b style="color:var(--pink)">撃破!!</b>`;
          setTimeout(()=>{bigBanner("⚔ "+nm+" 撃破!!","#C58900",22);SFX.chest();},250);
          if(dmg){dmg.textContent="⚔ "+nm+" 撃破!!";dmg.className="dmg-pop show crit";}
        }
      }else{
        /* 悪徳者1体を「複数問の問答」で論破する持続戦(殿: 1戦を長くHP多め)。
           HP=通常3/強敵4/宝2。学習判定(mastery/box/SRS)は上で据え置き。 */
        const foe=(typeof mobFoe==="function")?mobFoe(G.boss,G.foeIdx):null;
        if(!G.mobHP||G.mobHP<=0){ G.mobHPMax=(foe&&foe.el)?4:((foe&&foe.gd)?2:3); G.mobHP=G.mobHPMax; }
        G.mobHP=Math.max(0,G.mobHP-1);
        if(G.mobHP>0){
          /* まだ論破しきれない=同じ悪徳者が次の問いを突きつけてくる(敵は据え置き) */
          G.contFoe=true;
          if(typeof srqFoeFx==="function")srqFoeFx("hit","mob");
          const bar=document.getElementById("bosshp");if(bar)bar.style.width=(G.mobHP/G.mobHPMax*100)+"%";
          const hb=document.getElementById("hpbig");if(hb)hb.innerHTML=`⚔ ${esc(foe?foe.n:foeName)} <b style="color:var(--pink)">HP${G.mobHP}</b><small>/${G.mobHPMax}</small>`;
          if(dmg){dmg.textContent="⚔ "+foeName+"に的中! 残りHP"+G.mobHP;dmg.className="dmg-pop show";}
        }else{
          /* 論破=撃破 → 次の悪徳者へ。図鑑記録は foeIdx が rushKill で進む前に取得。 */
          const bk=(typeof beKey==="function")?beKey(G.boss,G.foeIdx):null;
          G.contFoe=false;
          rushKill();
          if(bk&&typeof bestiaryHit==="function")bestiaryHit(ST,bk,todayNum(),true);
          let extra="";
          if(foe&&foe.gd){const gb=Math.round(60*ST.loop*coinMult());G.coinsEarned+=gb;extra=" 💰+"+gb;
            setTimeout(()=>{bigBanner("💰宝を落とした! +"+gb+"コイン","#C58900",16);SFX.coin();},300);}
          else if(foe&&foe.el){extra=" ⚔強敵!";if(!prefersReduce())flash("#FFE9A8",90);}
          foeDefeatFx(bf,"💥",foe&&foe.el?11:8,foe&&foe.el?"lt":"mob"); /* 強敵は格を一段上げて見せる */
          if(dmg){dmg.textContent="⚔ "+foeName+" 論破!"+extra;dmg.className="dmg-pop show";}
        }
      }
    }
    else if(isExam()){
      G.hits++;
      const bar=document.getElementById("bosshp");if(bar)bar.style.width=Math.min(100,G.hits/G.need*100)+"%";
      const hb=document.getElementById("hpbig");if(hb)hb.innerHTML=`正解 ${G.hits}<small>/${G.need}</small>`;
    }
    else if(G.mode!=="train"){
      G.bossHP=Math.max(0,G.bossHP-d);
      const bar=document.getElementById("bosshp");if(bar)bar.style.width=(G.bossHP/G.bossMax*100)+"%";
      const hb=document.getElementById("hpbig");if(hb)hb.innerHTML=`HP ${G.bossHP}<small>/${G.bossMax}</small>`;
    }
    /* 宝箱ドロップ(1バトル1回まで) */
    if(!G.chestDrop&&Math.random()<chestChance()){
      G.chestDrop=true;ST.chests++;
      setTimeout(()=>{bigBanner("🎁宝箱を見つけた!","#C58900",24);SFX.chest();},650);
    }
    /* デイリーミッション */
    const doneMsgs=missionTick();
    if(doneMsgs.length)setTimeout(()=>{bigBanner("🎯"+doneMsgs[0],"#2B9E82",18);SFX.levelup();},1000);
    const akTag=ak.key!=="normal"?"【"+ak.name+"】":"";
    showFb(true,akTag+(crit?"会心 ":"")+(extLabel||("正解「"+(q.a?"○":"×")+"」"))+" +"+coin+"コイン +"+xp+"XP"+(repeat?" (復習済につき減)":"")+(memMult>1?" 🧠長期記憶!":""),q,q.id);
    btProgressSync();
    /* 正解時の図解フラッシュは廃止(殿: 正解時は普通に解説だけで良い)。解説内の📊図解ボタンから手動では開ける。 */
    G.zflashed=false;
    if(ups>0)setTimeout(()=>lvUpShow(),350);
  }else{
    st.w++;st.ng=true;st.s=0;ST.totalW++;G.combo=0;G.wrong.push(q.id);
    srsOnWrong(st);
    missionTick();
    /* 罰しすぎない: 実力測定以外は「1戦1回」だけHP減なし=弱点を解析中。
       正しい論点は下の解説で即提示し、解説を読む/理解チェック通過で反撃(小報酬)できる */
    let blocked=false,grazed=false;
    if(isExam()){G.miss++;}
    else if(G.shield>0){G.shield--;blocked=true;}
    else if(!G.analyzed&&G.mode!=="surv"){G.analyzed=true;grazed=true;} /* サバイバルは耐久勝負なので対象外 */
    else G.life--;
    if(bf)bf.classList.add("pop");if(arena)arena.classList.add("shake");
    if(typeof srqFoeFx==="function")srqFoeFx("attack",G.mb?"mid":(G.mode==="boss"||G.mode==="last"||G.mode==="true")?"boss":"mob"); /* S3(F): 敵の攻撃アニメ */
    if(blocked&&typeof guardFx==="function")guardFx(bf); /* 防具/装飾ごとのガード発動演出(見た目のみ) */
    if(!blocked&&!grazed)flash("#FF5A5A",120);
    if(dmg){dmg.textContent=blocked?"ガード!":grazed?"弱点を解析中…":(timeout?"時間切れ!":"痛恨!");dmg.className="dmg-pop show "+(grazed?"":"bad");}
    G.awaitCounter=q.id; /* この問題を理解し直せば反撃できる(ui-explain の battleCounter) */
    SFX.ng();
    const h=document.getElementById("hearts");if(h)h.innerHTML=heartsHtml();
    const tail=blocked?"(防具が守った!)":grazed?"(HPは減っていない。下の解説で弱点を突けば反撃だ)":"(下の解説で弱点を突けば反撃できる)";
    showFb(false,(timeout?"時間切れ":"不正解")+" — "+(extLabel||("正解は「"+(q.a?"○":"×")+"」"))+tail,q,q.id);
    btProgressSync();
  }
  const c=document.getElementById("combo");if(c)c.innerHTML=comboText();
  /* ボス固有ギミック(mode:boss。トドメ後の再生はしない) */
  if(G.mode==="boss"&&G.gim){
    G.turn=(G.turn||0)+1;
    if(G.turn%G.gim.n===0){
      if(G.gim.t==="regen"&&G.bossHP>0){G.bossHP=Math.min(G.bossMax,G.bossHP+G.gim.v);bossHpBar();setTimeout(()=>bigBanner("👹 "+G.gim.msg,"#7A3BC9",14),700);}
      else if(G.gim.t==="haste"){G.hasteNext=1;setTimeout(()=>bigBanner("👹 "+G.gim.msg,"#7A3BC9",14),700);}
    }
  }
  /* メタル敵の逃走判定: このターンで倒せなかったらカウントダウン。0で逃走(損失なし=非懲罰) */
  if(G.mode==="train"&&G.metal){
    G.metal.turns--;
    if(G.metal.turns<=0){
      const fn=bossOf(q).name;G.metal=null;
      setTimeout(()=>bigBanner("💨"+fn+"は逃げ出した…(損失なし)","#8A8494",18),250);
    }
  }
  /* 正解時の自動送りは廃止(殿2026-08-17: 毎回解説で止まり、自分で「次へ」を押して進みたい)。
     誤答時と同様、正解時も解説を読み終えるまで画面は動かさない。 */
  saveST();
}

/* ============ ターン進行・勝敗 ============ */
function nextTurn(){
  if(G.awaiting||!G.answered)return;
  stopTimer();
  /* 冒頭アーク: 簡単クエスト(easy)と試験の悪魔(demon)は専用のリザルトへ(ui-intro.js)。
     関数未ロード時は素通りさせて既存の汎用処理に委ねる(白画面にしない) */
  if(G.mode==="easy"&&typeof easyClear==="function"){
    if(G.life<=0)return endBattle(false); /* 殿: HP0なのに進む/勝てるのをなくす(easyも例外にしない) */
    if(G.bossHP<=0)return easyClear();
    G.idx++;
    if(G.idx>=G.ids.length)return easyClear(); /* 問題を出し切ったら突破(HPが残っていれば) */
    battle();return;
  }
  if(G.mode==="demon"&&typeof demonEnd==="function"){
    if(G.hits>=G.need)return demonEnd(true);
    if(G.miss>G.allow)return demonEnd(false);
    G.idx++;
    if(G.idx>=G.ids.length)return demonEnd(G.hits>=G.need);
    battle();return;
  }
  if(G.mode==="mock"){
    G.idx++;
    if(G.idx>=G.ids.length)return mockEnd();
    battle();return;
  }
  /* 裏面: 年度別過去問。全問通しで解き、最後に年度別成績(nendoEnd)へ。早期終了はしない(やり込み)。 */
  if(G.mode==="nendo"&&typeof nendoEnd==="function"){
    G.idx++;
    if(G.idx>=G.ids.length)return nendoEnd();
    battle();return;
  }
  /* 選択式演習: 全問通しで解き、最後に選択式の結果(sentakuEnd)へ。 */
  if(G.mode==="sentaku"&&typeof sentakuEnd==="function"){
    G.idx++;
    if(G.idx>=G.ids.length)return sentakuEnd();
    battle();return;
  }
  if(G.mode==="last"){
    if(G.hits>=G.need)return endBattle(true);
    if(G.miss>G.allow)return endBattle(false);
    G.idx++;
    if(G.idx>=G.ids.length)return endBattle(G.hits>=G.need);
    battle();return;
  }
  if(G.life<=0)return endBattle(false);
  /* 修行(雑魚ラッシュ)の3分区切り(A): 1コース=courseCap問。ただしメタル/中ボス戦の途中では
     切らず、切れ目(雑魚に戻った瞬間)で一区切りにする=演出を分断しない。続きは次コースへ(B)。 */
  if(G.mode==="train"){
    G.cAns=(G.cAns||0)+1;
    if(G.storyVid&&G.storyHPMax){
      /* 物語戦は「敵を倒したか」だけが終了条件(殿2026-08-28)。問数では切らない */
      if((G.storyHP|0)<=0)return endBattle(true);
    }
    else if(G.cAns>=(G.courseCap||courseCapN())&&!G.metal&&!G.mb)return endBattle(true);
  }
  if(G.mode!=="surv"&&G.mode!=="train"&&G.bossHP<=0)return endBattle(true);
  G.idx++;
  if(G.mode==="boss"&&G.idx>=G.ids.length){const last=G.ids[G.ids.length-1];G.idx=0;G.ids=(typeof shuffleNoRepeat==="function")?shuffleNoRepeat(G.ids,last):shuffle(G.ids);} /* 周回の継ぎ目で直前問題の連続出題を避ける(B) */
  if(G.mode==="train"&&G.storyVid&&G.storyHPMax&&G.idx>=G.ids.length){
    /* 誤答ぶん問題が尽きた=敵はまだ立っている。同科目から補充して戦いを続ける(進行不能にしない) */
    const more=storyRefillIds();
    if(more.length)G.ids=G.ids.concat(more);
    else{const last=G.ids[G.ids.length-1];G.idx=0;G.ids=(typeof shuffleNoRepeat==="function")?shuffleNoRepeat(G.ids,last):shuffle(G.ids);}
  }
  if((G.mode==="rev"||G.mode==="bm"||G.mode==="train"||G.mode==="review"||G.mode==="reco"||G.mode==="case")&&G.idx>=G.ids.length)return endBattle(true);
  battle();
}

/* 物語戦の補充: 誤答で選抜が尽きても敵が残っていれば、同科目の未出題から足す */
function storyRefillIds(){
  try{
    const subj=(G&&typeof G.boss==="number")?G.boss:0;
    const have={};(G.ids||[]).forEach(id=>have[id]=1);
    const pool=(typeof Q!=="undefined"?Q:[]).filter(q=>q&&q.s===subj&&!have[q.id]);
    return shuffle(pool).slice(0,4).map(q=>q.id);
  }catch(e){return [];}
}
function endBattle(win){
  stopTimer();
  const bf=document.getElementById("bossface");
  if(win&&bf&&(G.mode==="boss"||G.mode==="last"||G.mode==="true"||G.mode==="rev"||G.mode==="bm"||G.mode==="review"||G.mode==="reco")){
    if(typeof srqFoeFx==="function")srqFoeFx("defeat","boss"); /* S3(F): ボス撃破アニメ(格=最大) */
    explodeBoss(bf);
    setTimeout(()=>endBattle2(win),620);
    return;
  }
  endBattle2(win);
}
function endBattle2(win){
  btClear(); /* 決着がついた=中断復帰の対象ではなくなった */
  if(typeof zFlashClear==="function")zFlashClear(); /* S4(C): 結果画面に図解を持ち越さない */
  /* 物語 encounter からの戦闘なら、リザルトを挟まず物語へ復帰させる（R6・橋渡し） */
  if(typeof storyOnBattleEnd==="function"&&storyOnBattleEnd(win,G))return;
  if(G.mode==="case"){saveST();return window.caseBattleEnd(win,G);} /* 事件モードは事件簿側で結果処理 */
  let bonus=0,newRec=false,loopCleared=false,trueCleared=false;
  if(win&&G.mode==="boss"){
    if(!ST.badges[G.boss])bonus+=100*ST.loop;else bonus+=30*ST.loop;
    ST.badges[G.boss]=true;ST.eKill[G.boss]=1;
    if(typeof msqBeat==="function"){const _bc=G.boss;setTimeout(()=>msqBeat("boss",_bc),760);} /* M5: 科目ボス撃破の物語ビート(一度きり) */
  }
  if(win&&G.mode==="last"){
    loopCleared=true;bonus+=500*ST.loop;
    ST.clears++;ST.loop++;ST.badges={};
  }
  if(win&&G.mode==="true"){trueCleared=true;ST.trueWin++;bonus+=1000;}
  if(win&&G.mode==="train")bonus+=30;
  if(win&&(G.mode==="rev"||G.mode==="bm"))bonus+=50;
  if(win&&G.mode==="review")bonus+=80;
  if(win&&G.mode==="reco")bonus+=100;
  if(G.mode==="surv"){bonus+=G.kills*3;if(G.kills>ST.survBest){ST.survBest=G.kills;newRec=true;bonus+=100;}}
  bonus=Math.round(bonus*coinMult());
  const total=G.coinsEarned+bonus;
  ST.coins+=total;
  /* 勝利時ボーナス宝箱チャンス */
  if(win&&Math.random()<0.35+Math.min(0.15,stats().luck*0.0005))ST.chests++;
  /* ゲームクリア判定・実績称号 */
  let justCleared=false;
  if(!ST.cleared&&masteredCount()>=Q.length&&ST.clears>=3){ST.cleared=true;justCleared=true;}
  const newTitles=grantAchTitles();
  const newAch=(typeof achCheckUnlock==="function")?achCheckUnlock():[];
  if(typeof sessAdd==="function")sessAdd(G); /* M6(D): このバトルの戦果をセッション累計へ合流 */
  saveST();
  if(newAch.length)newAch.forEach((a,i)=>setTimeout(()=>{bigBanner("\ud83c\udfc5実績解放!「"+a.name+"」","#C58900",16);SFX.chest();},1200+i*700));
  (win||newRec)?(loopCleared||justCleared||trueCleared?SFX.levelup():SFX.win()):SFX.lose();
  if(win&&typeof bgmVictory==="function")bgmVictory(); /* 勝利ジングルを一発→元シーンへ戻る */
  if(loopCleared||justCleared||trueCleared)confetti(50);

  const b=(G.mode==="boss"||G.mode==="train")?BOSSES[G.boss]:null;
  const allNine=badgeCount()>=9;
  /* コース区切りの「戦果→続きへ」(B)。G.course の時だけ。母数が残っていれば同モードをワンタップ再開。 */
  const cm=win&&!!G.course&&typeof courseUnitsLeft==="function";
  const cl=cm?courseUnitsLeft(G.mode,G.boss):null;
  const contClick=cm?(cl.q>0
    ?(G.mode==="train"?`startTrain(${G.boss})`:G.mode==="review"?"startReview()":G.mode==="reco"?"startReco()":G.mode==="rev"?"startRevenge()":"startBookmark()")
    :"home()"):"";
  const contLabel=cm?(cl.q>0?"続きへ ▶ もう1コース":"ホームへ"):"";
  const contD=cm?(cl.q>0?`このエリア あと${cl.courses}コース / ${cl.q}問`:"このプールは空!よくやった"):"";
  const areaName=cm?courseAreaName(G.mode,G.boss):"";
  const face=trueCleared?"mao":justCleared?"trophy":G.mode==="true"?(win?"mao":"mao"):G.mode==="last"?(win?"trophy":"god"):win?(b?b.sp:"trophy"):"skull";
  const title=trueCleared?"厚生労働神 撃破!!":
    justCleared?"🏆ゲームクリア!!":
    loopCleared?`試験の神 撃破!! ${ST.clears}周目クリア`:
    win?(G.mode==="boss"?b.name+" 討伐!!":G.mode==="train"?"修行完了!":G.mode==="rev"?"リベンジ完遂!":G.mode==="bm"?"ブックマーク制覇!":G.mode==="review"?"復習完了!忘却の亡霊を浄化":G.mode==="reco"?"特訓完了!":"生還"):
    (G.mode==="true"?"厚生労働神に敗北…":G.mode==="last"?"試験の神に敗北…":G.mode==="surv"?"力尽きた…":"敗北…");
  const sub=trueCleared?"ブラック企業帝国は崩壊した。あとは本試験で勝つだけだ!":
    justCleared?"全問習得+3周クリア。本試験レベルの論点を完全制覇した":
    loopCleared?`敵が強化された(解放条件${unlockNeed()}%・神は${LASTCFG().n}問)`:
    G.mode==="last"?`正解 ${G.hits}/${G.need}(${G.n}問中)。ミス問題を復習ノートで潰して再挑戦だ`:
    G.mode==="boss"&&win&&allNine?"⚡全9ボス討伐! ホームにラスボス【試験の神】が出現した":
    G.mode==="train"?`このセッション${G.mobKills||0}体撃破! 習得${Math.round(masteryPct(G.boss)*100)}%(解放条件${unlockNeed()}%)。${masteryPct(G.boss)*100>=unlockNeed()?"⚔ボス解放!挑め!":"もう一周でグッと上がる"}`:
    G.mode==="surv"?"討伐数 "+G.kills+"体":
    G.mode==="review"?"忘却曲線に勝った!明日もまた来い":
    G.mode==="easy"&&!win?"敗因は下に。読んでからもう一度挑めば勝てる!":
    (win?"報酬を獲得!":"敗因は下に。リベンジで借りを返せ(コイン2倍)");
  const wl=[...new Set(G.wrong)].map(id=>{const q=qById(id);
    return `<div class="note-item"><b>✕ ${esc(q.q)}</b><span class="ans">正解:${q.a?"○":"×"}</span><span class="ex">${esc(q.e)}</span></div>`;}).join("");
  app.innerHTML=`
  <div class="topbar"><span></span><span class="coin-chip">${px("coin",16)} ${ST.coins}</span><span></span></div>
  <div class="end-wrap">
    ${px(face,90,"floaty")}
    <div class="end-title dot ${win||justCleared?"win":"lose"}">${title}</div>
    <div class="end-sub">${sub}</div>
    <div class="reward-box">${px("coin",20)} +${total}</div>
    <div style="font-size:12px;font-weight:900;color:#2B9E82;margin-top:4px">+${G.xpEarned}XP ｜ 最大${G.bestCombo||0}コンボ</div>
    ${newRec?'<br><span class="newrec">NEW RECORD!</span>':""}
    ${newTitles.map(id=>`<br><span class="newrec" style="background:#C58900">称号獲得【${ITEM[id].name}】</span>`).join("")}
  </div>
  ${cm?`<div class="banner course-result">${cl.q>0
      ?`🗺 <b>${esc(areaName)}</b> ─ あと <b>${cl.courses}</b>コース / <b>${cl.q}</b>問。続きはワンタップ(気軽にもう1コース、やめてもOK)`
      :`🎉 <b>${esc(areaName)}</b> このプールを制圧! 見事だ`}</div>`:""}
  ${typeof sessSummaryHtml==="function"?sessSummaryHtml():""}
  ${ST.chests>0?`<button class="btn mode-btn yellowbg" onclick="openChest()">${px("chest",34)}<span>宝箱を開ける!<span class="d">${ST.chests}個ゲットした</span></span><span class="cnt">×${ST.chests}</span></button>`:""}
  ${wl?`<div class="sec">敗因メモ(自動で復習ノートに保存済み)</div>${wl}`:""}
  <button class="btn mode-btn yellowbg" onclick="${cm?contClick:G.mode==="surv"?"startSurvival()":G.mode==="boss"?(allNine?"home()":"startBoss("+G.boss+")"):G.mode==="train"?"startTrain("+G.boss+")":G.mode==="last"?(win?"home()":"startLast()"):G.mode==="true"?(win?"home()":"startTrue()"):G.mode==="bm"?"startBookmark()":G.mode==="review"?"home()":G.mode==="reco"?"home()":G.mode==="easy"?(G.qs?"quickNext()":"startEasyQuest()"):"startRevenge()"}">
    ${px("excal",30)}<span>${cm?contLabel:loopCleared?"次の周回へ":trueCleared?"ホームへ":G.mode==="last"&&!win?"神に再挑戦":G.mode==="true"&&!win?"再挑戦":G.mode==="boss"&&allNine?"ラスボスへ(ホーム)":G.mode==="review"||G.mode==="reco"?"ホームへ":"もう一戦"}${cm&&contD?`<span class="d">${esc(contD)}</span>`:""}</span></button>
  <button class="btn mode-btn mintbg" onclick="shop()">${px("hammer",30)}<span>装備を鍛える<span class="d">⚔戦力${typeof playerPower==="function"?playerPower():""} ｜ 🪙強化石×${ST.mat||0}で+強化</span></span></button>
  <button class="btn mode-btn" style="background:linear-gradient(135deg,#FFF3C4,#FFE1EB)" onclick="gacha()">${px("gachaball",30)}<span>ガチャで装備を引く<span class="d">${ST.tickets>0?"チケット×"+ST.tickets+"あり!":"あと"+(GAUGE_NEED-(ST.gGauge||0))+"問正解でチケ+1"}</span></span></button>
  ${wrongIds().length?`<button class="btn mode-btn pinkbg" onclick="startRevenge()">${px("skull",30)}<span>リベンジ<span class="d">コイン2倍</span></span><span class="cnt">${wrongIds().length}問</span></button>`:""}
  <button class="btn mode-btn" onclick="home()">🏠<span>ホームへ</span></button>`;
  if(trueCleared)storyShow(STORY.trueWin,null);
}

/* 反撃: 不正解のあと解説で理解し直したら小報酬。読む/理解チェック突破を「前進」として演出。
   strong=理解チェック突破(奥義級)/ false=誤答理由を選び解説を読んだ(弱点解析)。
   1問の解説につき1回だけ。バトル外(G無し)では何もしない。 */
function battleCounter(strong){
  if(typeof G==="undefined"||!G||G.counterDone)return;
  if(!G.awaitCounter||G.awaitCounter!==fbQid)return; /* いま表示中の不正解問題のみ */
  G.counterDone=true;
  const coin=Math.round((strong?12:6)*ST.loop*coinMult());
  G.coinsEarned+=coin;
  /* 学習モードの敵にはダメージも通す(理解=前進の可視化) */
  if(G.bossMax&&G.bossHP>0&&G.mode!=="train"&&!isExam()){
    G.bossHP=Math.max(0,G.bossHP-playerDmg());
    const bar=document.getElementById("bosshp");if(bar)bar.style.width=(G.bossHP/G.bossMax*100)+"%";
    const hb=document.getElementById("hpbig");if(hb)hb.innerHTML=`HP ${G.bossHP}<small>/${G.bossMax}</small>`;
  }
  else if(G.storyVid&&G.storyHPMax&&(G.storyHP|0)>0&&G.mode==="train"){
    /* 物語戦でも反撃は敵に通す(理解=前進。誤答が続いても詰まない) */
    G.storyHP=Math.max(0,G.storyHP-1);
    const nm=(G.storyFoe&&G.storyFoe.n)||"敵";
    const bar=document.getElementById("bosshp");if(bar)bar.style.width=(G.storyHP/G.storyHPMax*100)+"%";
    const hb=document.getElementById("hpbig");if(hb)hb.innerHTML=(G.storyHP>0)
      ?`⚔ ${esc(nm)} <b style="color:var(--pink)">HP${G.storyHP}</b><small>/${G.storyHPMax}</small>`
      :`⚔ ${esc(nm)} <b style="color:var(--pink)">撃破!!</b>`;
    if(typeof btProgressSync==="function")btProgressSync();
  }
  saveST();
  bigBanner((strong?"⚔ 弱点を突く反撃!":"🔎 敵の弱点を解析した!")+" +"+coin+"コイン","#2B9E82",16);
  SFX.coin();
}
window.battleCounter=battleCounter;
window.startBoss=startBoss;window.startSurvival=startSurvival;window.startRevenge=startRevenge;window.startTrain=startTrain;window.startLast=startLast;
window.startBookmark=startBookmark;window.startReview=startReview;window.startReco=startReco;window.startTrue=startTrue;
window.answer=answer;window.nextTurn=nextTurn;
