"use strict";
/* ============================================================
   sfx.js — 効果音(Web Audio 合成・素材レス・完全オリジナル)
   audio-manager の SE バス経由で発音し、音量/ミュートは基盤側が統括する。
   グローバル名 SFX は既存呼び出し側との互換のため維持。
   ============================================================ */

/* 単発トーン。audio-manager の SE バスへ流し、非対応・ミュート時は no-op */
function tone(f,t,dur,type="square",vol=.1){
  const c=ac();if(!c||muted)return;
  const dest=(typeof AudioMgr!=="undefined"&&AudioMgr.seDest())||c.destination;
  try{
    const o=c.createOscillator(),g=c.createGain();
    o.type=type;o.frequency.value=f;
    g.gain.setValueAtTime(vol,c.currentTime+t);
    g.gain.exponentialRampToValueAtTime(.001,c.currentTime+t+dur);
    o.connect(g);g.connect(dest);
    o.start(c.currentTime+t);o.stop(c.currentTime+t+dur+.02);
  }catch(e){}
}
/* 連続的に音程が滑るスイープ音。"キュイン"のような上昇/下降グリッサンドを1発で作る。
   tone() と同じく SE バス経由・ミュート尊重・失敗しても無音で落ちない。 */
function sweep(f0,f1,t,dur,type="square",vol=.08){
  const c=ac();if(!c||muted)return;
  const dest=(typeof AudioMgr!=="undefined"&&AudioMgr.seDest())||c.destination;
  try{
    const o=c.createOscillator(),g=c.createGain(),t0=c.currentTime+t;
    o.type=type;
    o.frequency.setValueAtTime(Math.max(20,f0),t0);
    o.frequency.exponentialRampToValueAtTime(Math.max(20,f1),t0+dur);
    g.gain.setValueAtTime(vol,t0);
    g.gain.exponentialRampToValueAtTime(.001,t0+dur);
    o.connect(g);g.connect(dest);
    o.start(t0);o.stop(t0+dur+.02);
  }catch(e){}
}
const SFX={
  ok(){tone(720,0,.08);tone(960,.07,.1);},
  crit(){tone(720,0,.06);tone(960,.05,.06);tone(1440,.1,.16,"square",.13);},
  ng(){tone(200,0,.2,"sawtooth",.13);tone(130,.09,.26,"sawtooth",.13);},
  coin(){tone(1568,0,.06,"square",.08);tone(2093,.05,.1,"square",.08);},
  buy(){tone(880,0,.08);tone(1175,.07,.08);tone(1568,.14,.14);},
  win(){[523,659,784,1047].forEach((f,i)=>tone(f,i*.12,.2,"square",.11));tone(1319,.5,.45,"square",.1);},
  lose(){[392,330,262,196].forEach((f,i)=>tone(f,i*.16,.22,"sawtooth",.11));},
  levelup(){[523,659,784,1047,1319,1568].forEach((f,i)=>tone(f,i*.1,.18,"square",.11));},
  tick(){tone(1300,0,.03,"square",.04);},
  special(){[440,554,659,880,1109].forEach((f,i)=>tone(f,i*.06,.14,"sawtooth",.1));tone(1760,.35,.3,"square",.12);},
  chest(){tone(392,0,.1);tone(523,.1,.1);tone(659,.2,.1);tone(784,.3,.25,"square",.12);},
  gacha(){[262,330,392,523].forEach((f,i)=>tone(f,i*.09,.12,"triangle",.12));},
  ssr(){[523,659,784,1047,1319,1568,2093].forEach((f,i)=>tone(f,i*.09,.22,"square",.12));tone(2637,.7,.5,"square",.1);},
  /* LR(最上位)専用の壮大なファンファーレ。長めの分散和音+高音のきらめきで「震える」瞬間を作る */
  legend(){[523,784,1047,1319,1568,2093,2637,3136].forEach((f,i)=>tone(f,i*.1,.3,"square",.12));
    [1047,1319,1568].forEach((f,i)=>tone(f,.1+i*.1,.5,"triangle",.09));tone(3951,.95,.7,"square",.11);},
  /* レア確定の予兆音(上昇する緊張)。高レアが来る直前に鳴らして期待を煽る */
  omen(){tone(330,0,.14,"triangle",.09);tone(440,.12,.14,"triangle",.1);tone(587,.24,.18,"triangle",.11);tone(880,.4,.22,"square",.1);},
  /* カプセル/カードをめくる短いめくり音 */
  flip(){tone(880,0,.04,"square",.06);tone(1320,.03,.05,"square",.05);},
  /* ---- S5: 抽選中の"キュインキュイン"一式。lv(0..4)が上がるほど高く速く鳴る ---- */
  /* リール回転の1周分。lvで基準音程と速さが上がり、期待度が耳で分かる */
  kyuin(lv=0){
    const l=Math.max(0,Math.min(4,lv|0)),base=440*Math.pow(1.16,l),dur=.20-l*.028;
    sweep(base,base*2.6,0,dur,"square",.055+l*.012);
    sweep(base*1.5,base*3.4,dur*.55,dur*.7,"triangle",.03+l*.008);
  },
  /* 期待度が1段上がった瞬間の煽り音(段が上がるほど派手) */
  heat(lv=1){
    const l=Math.max(1,Math.min(4,lv|0));
    [0,1,2].forEach(i=>tone(523*Math.pow(1.26,l)*Math.pow(1.26,i),i*.05,.16,"square",.09));
    sweep(300,1800+l*400,.02,.28,"sawtooth",.05);
  },
  /* リール停止のカチッ(止まった瞬間の重み) */
  reelStop(lv=0){
    const l=Math.max(0,Math.min(4,lv|0));
    tone(180+l*40,0,.07,"square",.11);tone(90+l*20,.03,.14,"sawtooth",.09);
  },
  /* カットイン突入のホワッという走り音 */
  cutin(){sweep(1600,180,0,.34,"sawtooth",.09);sweep(220,1400,.06,.3,"triangle",.06);},
  /* 高レア確定の一撃。ここが鳴ったらもう当たり */
  confirmed(){
    sweep(600,3200,0,.26,"square",.11);
    [1568,2093,2637].forEach((f,i)=>tone(f,.22+i*.07,.3,"square",.1));
    tone(3136,.44,.5,"triangle",.08);
  },
  explode(){tone(90,0,.4,"sawtooth",.18);tone(60,.08,.5,"sawtooth",.16);tone(1200,0,.08,"square",.1);}
};
if(typeof window!=="undefined")window.SFX=SFX;
