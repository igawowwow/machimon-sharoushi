"use strict";
/* ============================================================
   bgm.js — シーンBGM(Web Audio 合成・素材レス・完全オリジナル)
   audio-manager のクロスフェード用バス経由で発音。音量/フェード/休止は基盤側が統括。
   melo=主旋律 / harm=ハモリ / bass=低音 / arp=装飾(密度レイヤー)。
   各ノートは [midiノート(0=休符), 8分音符数]。ループ毎に arp を交互に出して
   2セクション感(密度の増減)を作る。集中モードは主旋律を弱める。
   グローバル名 BGM/BGM_TRACKS/setBgmScene/toggleBgm/bgmScene は互換維持。
   ============================================================ */
const BGM={on:false,timer:null,bus:"A",_sec:false,src:null,srcScene:null,back:null};
function nfq(n){return 440*Math.pow(2,(n-69)/12);}
const BGM_TRACKS={
 /* mmtown: MACHIMON 街のテーマ(Fメジャー・弾む・箱庭の朝)。社労士クエストとは別曲 */
 mmtown:{step:0.22,mv:.030,hv:.016,bv:.046,av:.012,
  melo:[[77,1],[77,1],[81,2],[84,2],[81,2],[79,1],[77,1],[79,2],[77,2],[0,2],
   [76,1],[76,1],[79,2],[84,2],[86,2],[84,1],[81,1],[79,2],[77,2],[0,2]],
  harm:[[72,1],[72,1],[77,2],[81,2],[77,2],[76,1],[72,1],[76,2],[72,2],[0,2],
   [72,1],[72,1],[76,2],[79,2],[81,2],[79,1],[77,1],[76,2],[72,2],[0,2]],
  bass:[[53,2],[60,2],[53,2],[60,2],[58,2],[65,2],[60,2],[55,2],
   [48,2],[55,2],[53,2],[60,2],[58,2],[65,2],[60,2],[53,2]],
  arp:[[89,1],[93,1],[96,1],[93,1],[89,1],[93,1],[96,1],[93,1],
   [88,1],[91,1],[96,1],[91,1],[86,1],[89,1],[93,1],[89,1]]},
 /* mmboss: MACHIMON ボス(Eマイナー・跳ねる緊張感・怖すぎない) */
 mmboss:{step:0.18,mv:.032,hv:.017,bv:.056,av:.012,
  melo:[[76,1],[76,1],[79,1],[83,1],[81,2],[79,1],[76,1],[74,2],[76,2],
   [71,1],[71,1],[74,1],[79,1],[78,2],[76,1],[74,1],[71,2],[0,2],
   [76,1],[79,1],[83,2],[81,1],[79,1],[76,2]],
  harm:[[71,1],[71,1],[76,1],[79,1],[76,2],[74,1],[71,1],[71,2],[71,2],
   [67,1],[67,1],[71,1],[74,1],[74,2],[71,1],[71,1],[67,2],[0,2],
   [71,1],[76,1],[79,2],[76,1],[74,1],[71,2]],
  bass:[[40,2],[40,2],[47,2],[40,2],[45,2],[45,2],[43,2],[43,2],
   [40,2],[40,2],[47,2],[40,2],[38,2],[38,2],[47,2],[47,2]],
  arp:[[88,1],[91,1],[95,1],[91,1],[86,1],[90,1],[93,1],[90,1],
   [88,1],[91,1],[95,1],[91,1],[83,1],[86,1],[90,1],[86,1]]},

 /* field: 冒険のテーマ(Dメジャー・堂々とした行進曲風) */
 field:{step:0.24,mv:.032,hv:.018,bv:.05,av:.013,
  melo:[[74,2],[81,2],[80,1],[78,1],[76,1],[74,1],[76,4],
   [74,2],[78,2],[76,1],[74,1],[73,1],[71,1],[74,4],
   [69,2],[74,2],[73,1],[71,1],[69,1],[67,1],[69,2],[71,2],
   [74,2],[76,2],[78,2],[81,2],[81,3],[0,1]],
  harm:[[69,2],[76,2],[76,1],[74,1],[72,1],[69,1],[72,4],
   [69,2],[73,2],[72,1],[69,1],[69,1],[67,1],[69,4],
   [65,2],[69,2],[69,1],[67,1],[64,1],[64,1],[65,2],[67,2],
   [69,2],[72,2],[74,2],[76,2],[76,3],[0,1]],
  bass:[[50,2],[57,2],[52,2],[50,2],[55,2],[47,2],[50,2],[50,2],
   [50,2],[54,2],[52,2],[50,2],[43,2],[43,2],[45,2],[47,2],
   [50,4],[52,4],[54,4],[55,4],[57,4],[50,4]],
  arp:[[86,1],[81,1],[78,1],[81,1],[86,1],[81,1],[78,1],[81,1],
   [85,1],[81,1],[78,1],[81,1],[83,1],[79,1],[76,1],[79,1]]},
 /* battle: 緊迫のテーマ(Dマイナー・速い) */
 battle:{step:0.17,mv:.03,hv:.016,bv:.05,av:.012,
  melo:[[74,1],[74,1],[81,2],[80,1],[81,1],[74,1],[72,1],
   [72,1],[72,1],[79,2],[77,1],[79,1],[72,1],[70,1],
   [69,1],[72,1],[74,1],[77,1],[74,1],[72,1],[70,2],
   [74,2],[73,1],[74,1],[76,4]],
  harm:[[65,1],[65,1],[72,2],[72,1],[72,1],[65,1],[65,1],
   [64,1],[64,1],[70,2],[70,1],[70,1],[64,1],[64,1],
   [60,1],[64,1],[65,1],[69,1],[65,1],[64,1],[62,2],
   [65,2],[65,1],[65,1],[67,4]],
  bass:[[50,1],[50,1],[50,1],[50,1],[45,1],[45,1],[45,1],[45,1],
   [48,1],[48,1],[48,1],[48,1],[43,1],[43,1],[43,1],[43,1],
   [46,1],[46,1],[46,1],[46,1],[45,1],[45,1],[45,1],[45,1],
   [50,1],[50,1],[57,1],[57,1],[50,2]],
  arp:[[86,1],[84,1],[81,1],[84,1],[85,1],[82,1],[79,1],[82,1],
   [84,1],[81,1],[77,1],[81,1],[86,1],[82,1],[79,1],[74,1]]},
 /* emotion: 感動の寸劇テーマ(Bマイナー・ゆったり切ないバラード) */
 emotion:{step:0.40,mv:.03,hv:.018,bv:.045,av:.011,
  melo:[[71,3],[74,1],[78,4],[76,2],[74,2],[71,4],
   [69,3],[71,1],[74,4],[73,2],[71,2],[69,4],
   [66,2],[69,2],[74,3],[73,1],[71,2],[69,2],[71,6],[0,2]],
  harm:[[66,3],[71,1],[74,4],[73,2],[71,2],[66,4],
   [66,3],[66,1],[71,4],[69,2],[66,2],[62,4],
   [62,2],[64,2],[71,3],[69,1],[66,2],[62,2],[66,6],[0,2]],
  bass:[[47,4],[42,4],[43,4],[47,4],
   [45,4],[38,4],[43,4],[42,4],
   [42,4],[45,4],[47,4],[43,4],[47,6],[0,2]],
  arp:[[83,2],[86,2],[90,2],[86,2],[81,2],[85,2],[88,2],[85,2]]},
 /* town: 拠点/事務所の常駐曲(Cメジャー・穏やかで温かい町のテーマ)。melo/harm/bass 各32・8分 */
 town:{step:0.30,mv:.028,hv:.016,bv:.045,av:.010,
  melo:[[72,2],[71,2],[69,2],[67,2],[65,2],[67,2],[69,4],
   [65,2],[64,2],[62,2],[60,2],[62,2],[64,2],[65,4]],
  harm:[[67,2],[65,2],[64,2],[64,2],[60,2],[62,2],[64,4],
   [60,2],[59,2],[57,2],[55,2],[57,2],[59,2],[60,4]],
  bass:[[48,4],[53,4],[52,4],[48,4],[41,4],[45,4],[43,4],[47,4]],
  arp:[[72,1],[76,1],[79,1],[76,1],[74,1],[77,1],[81,1],[77,1],
   [72,1],[76,1],[79,1],[76,1],[71,1],[74,1],[79,1],[74,1]]},
 /* boss: 科目ボス/中ボス/ラスボスの重い緊迫曲(Dマイナー・低音の圧)。各32・8分 */
 boss:{step:0.20,mv:.032,hv:.017,bv:.06,av:.012,
  melo:[[62,2],[65,2],[69,4],[68,2],[69,2],[62,4],
   [60,2],[62,2],[65,4],[64,2],[62,2],[57,4]],
  harm:[[57,2],[60,2],[62,4],[63,2],[64,2],[57,4],
   [55,2],[57,2],[60,4],[60,2],[57,2],[53,4]],
  bass:[[38,2],[38,2],[38,2],[38,2],[41,2],[41,2],[36,2],[36,2],
   [38,2],[38,2],[43,2],[43,2],[45,2],[45,2],[38,2],[38,2]],
  arp:[[74,1],[77,1],[74,1],[77,1],[73,1],[77,1],[73,1],[77,1],
   [74,1],[77,1],[74,1],[77,1],[72,1],[77,1],[72,1],[77,1]]},
 /* midboss: 中ボス戦の重圧行進曲(Gマイナー・中速・低音の圧)。殿要望2026-08-18=中ボス専用曲。
    boss(Dマイナー低速)より一段速く、battle(Dマイナー高速)より重い中間の緊迫。各レーン8分で32 */
 midboss:{step:0.19,mv:.032,hv:.017,bv:.058,av:.013,
  melo:[[67,2],[67,1],[70,1],[74,2],[73,2],[70,2],[67,2],[65,2],[67,2],
   [63,2],[63,1],[67,1],[70,2],[69,2],[67,2],[63,2],[62,2],[58,2]],
  harm:[[62,2],[62,1],[65,1],[70,2],[69,2],[65,2],[62,2],[60,2],[62,2],
   [58,2],[58,1],[63,1],[67,2],[65,2],[63,2],[58,2],[58,2],[55,2]],
  bass:[[43,2],[43,2],[43,1],[43,1],[46,2],[43,2],[41,2],[41,2],[41,1],[41,1],[38,2],[43,2],
   [43,2],[43,2],[46,2],[48,2]],
  arp:[[79,1],[82,1],[86,1],[82,1],[78,1],[82,1],[85,1],[82,1],
   [79,1],[82,1],[86,1],[82,1],[74,1],[77,1],[81,1],[77,1]]},
 /* victory: 撃破/クリアの短い勝利ジングル(Cメジャー・数秒・非ループ)。melo/harm/bass 各18 */
 victory:{step:0.16,mv:.038,hv:.020,bv:.05,av:.014,
  melo:[[60,2],[64,2],[67,2],[72,4],[71,2],[72,6]],
  harm:[[55,2],[60,2],[64,2],[67,4],[67,2],[64,6]],
  bass:[[48,4],[43,4],[48,4],[48,6]],
  arp:[[84,1],[88,1],[91,1],[96,3]]},
 /* metal: メタル敵出現の焦る高速チェイス短ループ(高音・超速)。全レーン16・8分で揃える */
 metal:{step:0.10,mv:.030,hv:.015,bv:.05,av:.013,
  melo:[[81,1],[83,1],[84,1],[86,1],[84,1],[83,1],[81,1],[79,1],
   [81,1],[83,1],[84,1],[86,1],[88,1],[86,1],[84,1],[81,1]],
  harm:[[77,1],[79,1],[81,1],[83,1],[81,1],[79,1],[77,1],[76,1],
   [77,1],[79,1],[81,1],[83,1],[84,1],[83,1],[81,1],[77,1]],
  bass:[[45,1],[45,1],[57,1],[45,1],[43,1],[43,1],[55,1],[43,1],
   [45,1],[45,1],[57,1],[45,1],[48,1],[48,1],[60,1],[48,1]],
  arp:[[93,1],[96,1],[93,1],[96,1],[91,1],[95,1],[91,1],[95,1],
   [93,1],[96,1],[93,1],[96,1],[89,1],[93,1],[89,1],[93,1]]}
};
let bgmScene=(typeof window!=="undefined"&&window.__MM_STANDALONE)?"mmtown":"field";

function bgmNote(f,t,dur,type,vol){
  const c=ac();if(!c)return;
  const bus=(typeof AudioMgr!=="undefined"&&AudioMgr.bgmBus(BGM.bus))||c.destination;
  try{
    const o=c.createOscillator(),g=c.createGain();
    o.type=type;o.frequency.value=f;
    g.gain.setValueAtTime(vol,c.currentTime+t);
    g.gain.exponentialRampToValueAtTime(.001,c.currentTime+t+dur);
    o.connect(g);g.connect(bus);
    o.start(c.currentTime+t);o.stop(c.currentTime+t+dur+.02);
    (BGM.voices||(BGM.voices=[])).push({o:o,g:g,end:c.currentTime+t+dur+.05}); /* 追跡=切替時に止めて音被り防止 */
  }catch(e){}
}
/* 予約済みの合成オシレーターを全停止(短フェード)。シーン切替時に前シーンの音が
   バス再利用で復活して重なる『音被り』を防ぐ。 */
function stopVoices(){
  const c=(typeof ac==="function")?ac():null;const vs=BGM.voices||[];BGM.voices=[];
  vs.forEach(v=>{
    try{if(c&&v.g&&v.g.gain){v.g.gain.cancelScheduledValues(c.currentTime);v.g.gain.setValueAtTime(v.g.gain.value||.001,c.currentTime);v.g.gain.linearRampToValueAtTime(.0001,c.currentTime+.06);}}catch(e){}
    try{v.o.stop((c?c.currentTime:0)+.09);}catch(e){}
  });
}
function bgmLane(lane,step,type,vol,mul){
  let t=0.05;
  lane.forEach(([n,d])=>{if(n)bgmNote(nfq(n),t,d*step*mul,type,vol);t+=d*step;});
  return t;
}
function bgmSchedule(){
  if(!BGM.on)return;
  const c=ac();if(!c){BGM.timer=null;return;}
  BGM.voices=(BGM.voices||[]).filter(v=>v.end>c.currentTime); /* 鳴り終わったオシレーター参照を掃除(蓄積防止) */
  if(typeof AudioMgr!=="undefined")AudioMgr.resume();
  const focus=(typeof AudioMgr!=="undefined")&&AudioMgr.isFocus();
  const low=(typeof AudioMgr!=="undefined")&&AudioMgr.isLowData();
  const tr=BGM_TRACKS[bgmScene]||BGM_TRACKS.field;
  const mtype=focus?"triangle":"square";      /* 集中モードは主張を弱める */
  /* 次ループの予約は「一番長いレーン」の終端で行う。melo長だけで予約すると
     bass等が melo より長い曲(field:melo48<bass56 等)で前ループの低音が次ループに
     食い込み『音被り』になる。全レーンの最長を loopEnd として揃える。 */
  let loopEnd=bgmLane(tr.melo,tr.step,mtype,tr.mv*(focus?0.55:1),0.92);
  if(tr.harm&&!low){const th=bgmLane(tr.harm,tr.step,"triangle",tr.hv*(focus?0.8:1),0.9);if(th>loopEnd)loopEnd=th;}
  const tb=bgmLane(tr.bass,tr.step,"triangle",tr.bv,0.85);if(tb>loopEnd)loopEnd=tb;
  /* 密度レイヤー: 通常時のみ1ループごとに交互(2セクション感) */
  if(tr.arp&&!low&&!focus&&BGM._sec){const ta=bgmLane(tr.arp,tr.step,"square",tr.av||.012,0.5);if(ta>loopEnd)loopEnd=ta;}
  BGM._sec=!BGM._sec;
  /* ワンショット(勝利ジングル等)は1回鳴らしたら元シーンへ戻す。通常は同シーンを再ループ */
  if(BGM.back!=null){const b=BGM.back;BGM.back=null;BGM.timer=setTimeout(()=>setBgmScene(b),Math.round(loopEnd*1000)-60);}
  else BGM.timer=setTimeout(bgmSchedule,Math.round(loopEnd*1000)-60);
}
/* 差し替え音源(殿の自作ファイル)を再生する源を止める */
function bgmStopSource(node){if(node){try{node.stop();}catch(e){}try{node.disconnect();}catch(e){}}}
/* 殿の自作音源があればループ再生に差し替え。取得失敗・非対応・シーン変化時は生成音へフォールバック。
   BGM.back(ワンショット)時は loop=false で1回鳴らし、長さぶん後に元シーンへ戻す。 */
function bgmPlayFile(scene,bus,tok){
  const back=BGM.back;
  AudioMgr.fetchBuffer(scene).then(buf=>{
    const c=ac();
    /* 世代チェック: 読み込み中に bgmBegin が再度走っていたらこの結果は捨てる。
       これが無いと復帰イベントが連続した時に音源が二重に鳴る/互いに止め合って無音になる */
    if(tok!=null&&tok!==BGM._load)return;
    if(!buf||!c||!BGM.on||bgmScene!==scene){
      if(BGM.on&&bgmScene===scene&&!BGM.src&&!BGM.timer)bgmSchedule(); /* 取得できず→合成音 */
      return;
    }
    bgmStopSource(BGM.src);
    let src;try{src=c.createBufferSource();}catch(e){bgmSchedule();return;}
    src.buffer=buf;src.loop=!back;
    src.connect((typeof AudioMgr!=="undefined"&&AudioMgr.bgmBus(bus))||c.destination);
    try{src.start();}catch(e){}
    BGM.src=src;BGM.srcScene=scene;
    if(back!=null){BGM.back=null;const d=Math.max(300,Math.round((buf.duration||3)*1000));
      setTimeout(()=>{if(BGM.on&&bgmScene===scene)setBgmScene(back);},d);}
  }).catch(()=>{if(BGM.on&&bgmScene===scene&&!BGM.src&&!BGM.timer)bgmSchedule();});
}
/* 現シーン・現バスで発音を開始: 自作ファイルがあればそれを、無ければ合成音を鳴らす */
/* 冪等: 何度呼ばれても「今のシーンが1本だけ鳴っている」状態に収束する。
   復帰イベント(pageshow/focus/visibilitychange/Capacitor resume)は束で飛んでくるため、
   ここが冪等でないと同じ曲が多重に走って音が濁る/互いに止め合って無音になる。 */
function bgmBegin(){
  if(BGM.timer){clearTimeout(BGM.timer);BGM.timer=null;}
  bgmStopSource(BGM.src);BGM.src=null;
  stopVoices();
  BGM._load=(BGM._load||0)+1;   /* 進行中のファイル読み込みを無効化する世代印 */
  if(typeof AudioMgr!=="undefined"&&AudioMgr.hasFile(bgmScene))bgmPlayFile(bgmScene,BGM.bus,BGM._load);
  else bgmSchedule();
}
function bgmStart(){
  if(BGM.on)return;BGM.on=true;
  if(typeof AudioMgr!=="undefined"){
    AudioMgr.resume();
    AudioMgr.fade(AudioMgr.bgmBus(BGM.bus),AudioMgr.getBgmVol(),0.4);
  }
  bgmBegin();
}
function bgmStop(){
  BGM.on=false;
  if(BGM.timer){clearTimeout(BGM.timer);BGM.timer=null;}
  bgmStopSource(BGM.src);BGM.src=null;stopVoices();
  if(typeof AudioMgr!=="undefined")AudioMgr.fade(AudioMgr.bgmBus(BGM.bus),0,0.3);
}
/* タブ非表示での休止/復帰(BGM.on は保持し、発音だけ止める) */
function bgmSuspend(){
  BGM._load=(BGM._load||0)+1;   /* 背面へ回ったので進行中の読み込み結果は捨てる */
  if(BGM.timer){clearTimeout(BGM.timer);BGM.timer=null;}
  bgmStopSource(BGM.src);BGM.src=null;stopVoices();
}
function bgmWake(){if(BGM.on&&!BGM.timer&&!BGM.src)bgmBegin();}
/* シーン切替は 2 バスのクロスフェードで音を途切れさせない。
   returnTo を渡すと「1回鳴らして returnTo シーンへ戻す」ワンショット(勝利ジングル用)。 */
function setBgmScene(name,returnTo){
  if(typeof window!=="undefined"&&window.__MM_STANDALONE&&!/^mm|^victory$/.test(name))name="mmtown"; /* MACHIMON単体: 他ゲームの曲を鳴らさない */
  if(!BGM_TRACKS[name]||bgmScene===name)return;
  bgmScene=name;
  if(!BGM.on)return;                 /* 停止中はシーンだけ記録 */
  if(typeof AudioMgr==="undefined"){bgmSuspend();BGM.back=(returnTo!=null?returnTo:null);bgmBegin();return;}
  const dur=0.55,oldBus=BGM.bus,newBus=oldBus==="A"?"B":"A";
  if(BGM.timer){clearTimeout(BGM.timer);BGM.timer=null;}
  stopVoices(); /* 前シーンの合成音を止める=高速切替でのバス再利用による音被りを防ぐ */
  const oldSrc=BGM.src;BGM.src=null;
  AudioMgr.fade(AudioMgr.bgmBus(oldBus),0,dur);     /* 旧シーンを減衰 */
  BGM.bus=newBus;
  AudioMgr.fade(AudioMgr.bgmBus(newBus),AudioMgr.getBgmVol(),dur); /* 新シーンを立ち上げ */
  BGM.back=(returnTo!=null?returnTo:null);   /* bgmBegin より前に確定: victory等は予約、通常切替は保留ワンショットを解除 */
  bgmBegin();
  if(oldSrc)setTimeout(()=>bgmStopSource(oldSrc),Math.round(dur*1000)+40); /* 旧ファイル源をフェード後に停止 */
}
/* 撃破/クリアの勝利ジングルを一発鳴らし、元のシーンへ戻す */
function bgmVictory(){
  if(!BGM.on||!BGM_TRACKS.victory||bgmScene==="victory")return;
  setBgmScene("victory",bgmScene);
}
function toggleBgm(el){
  if(typeof ST!=="undefined"&&ST.opt)ST.opt.bgmTouched=true; /* 以後は殿の明示選択を尊重 */
  if(BGM.on){bgmStop();if(typeof ST!=="undefined"&&ST.opt)ST.opt.bgm=false;}
  else{if(typeof ST!=="undefined"&&ST.opt)ST.opt.bgm=true;bgmStart();}
  if(typeof saveST==="function")saveST();
  if(typeof SFX!=="undefined")SFX.coin();
  if(el)el.textContent=BGM.on?"🎶":"🎼";
}
if(typeof window!=="undefined"){window.setBgmScene=setBgmScene;window.toggleBgm=toggleBgm;window.bgmVictory=bgmVictory;}
/* 標準でBGMを鳴らす: 最初の許可されたユーザー操作(タップ)で開始。
   殿が一度も切り替えていなければ(bgmTouched未設定)初回は自動ON。
   一度でも自分でOFFにしたら(bgmTouched=true & bgm=false)自動ONしない。
   BGM.on なのに鳴っていない時(iOSの通話/Siri割り込みで AudioContext が
   interrupted になった後など)はタップで自己修復する=「いつの間にか無音」を残さない。 */
if(typeof document!=="undefined"&&document.addEventListener){
  document.addEventListener("pointerdown",()=>{
    if(typeof ST==="undefined"||!ST.opt)return;
    if(typeof AudioMgr!=="undefined")AudioMgr.resume();
    if(BGM.on){
      if(!BGM.timer&&!BGM.src)bgmBegin();   /* スケジューラが死んでいたら再開 */
      return;
    }
    if(ST.opt.bgm){bgmStart();return;}
    if(!ST.opt.bgmTouched){ST.opt.bgm=true;if(typeof saveST==="function")saveST();bgmStart();}
  });
}
/* アプリ再起動・バックグラウンド復帰でBGMを消えたままにしない(殿2026-08-17)。
   殿がONにしている限り(ST.opt.bgm)、pageshow/focus/復帰/Capacitorのresumeで自分から立ち上がる。
   ジェスチャ前は AudioContext が suspended のままでも、スケジューラは走らせておき
   最初のタップ(既存の pointerdown 自己修復)で音が出る。OFFにした人は起こさない。

   復帰イベントは束で飛ぶ(pageshow→visibilitychange→focus→Capacitor resume が数ms内に
   連続する)。以前はそのぶんだけ再開処理が走り、同じ曲が多重に鳴ったり互いに止め合って
   無音になったりしていた=殿報告「閉じて開くと音が出たり出なかったり」。
   ここでは (1)短窓デデュープ (2)bgmBegin 自体の冪等化 の二段で1本に収束させる。 */
let _wakeAt=0;
function bgmAutoRestart(force){
  if(typeof ST==="undefined"||!ST.opt)return;
  /* 同一の復帰を表す連続イベントは1回に畳む(0は Date 非依存の初回を必ず通す) */
  const now=(typeof Date!=="undefined"&&Date.now)?Date.now():0;
  if(!force&&now&&_wakeAt&&(now-_wakeAt)<400)return;
  _wakeAt=now;
  if(typeof AudioMgr!=="undefined")AudioMgr.resume();
  if(ST.opt.bgm&&!BGM.on){bgmStart();return;}
  if(BGM.on&&!BGM.timer&&!BGM.src)bgmBegin();
}
if(typeof window!=="undefined"){
  window.bgmAutoRestart=bgmAutoRestart;
  if(window.addEventListener){
    window.addEventListener("pageshow",()=>bgmAutoRestart());
    window.addEventListener("focus",()=>bgmAutoRestart());
    /* visibilitychange は audio-manager の AudioMgr.wake() が一括で面倒を見る
       (マスタゲインの復旧と順序を揃えるため、ここでは購読しない)。 */
    if(typeof document!=="undefined"&&document.addEventListener){
      document.addEventListener("resume",()=>bgmAutoRestart()); /* Capacitor(ネイティブ)の復帰 */
    }
  }
}
