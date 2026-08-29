"use strict";
/* ============================================================
   audio-manager.js — オーディオ基盤の単一窓口
   ・音量(BGM/SE) ・個別ON-OFF ・フェード ・visibilitychange
   ・将来の音源ファイル取得失敗時の生成音フォールバック統括
   実発音は sfx.js / bgm.js が本モジュール経由で行う。
   Web Audio 非対応・不在環境でも全APIは例外を投げず no-op になる。
   ============================================================ */

let AC=null;                 /* 共有 AudioContext(遅延生成) */
let muted=false;             /* SE ミュート。engine/ui が参照する既存互換の名前 */
let _bgmVol=0.7,_seVol=0.8;  /* 0..1 */
let _focus=false,_lowData=false;
let _mBgm=null,_busA=null,_busB=null,_mSe=null;   /* master/クロスフェード用バス */
const _files={};             /* {scene:url} 将来の差し替え音源登録先(空=常に生成音) */

function _clamp01(v){v=Number(v);if(!Number.isFinite(v))return 0;return v<0?0:v>1?1:v;}
function ac(){
  if(AC)return AC;
  try{
    const Ctor=(typeof window!=="undefined")&&(window.AudioContext||window.webkitAudioContext);
    if(!Ctor)return null;
    AC=new Ctor();
    _buildGraph();
  }catch(e){AC=null;}
  return AC;
}
function _buildGraph(){
  if(!AC||_mBgm)return;
  try{
    _mSe=AC.createGain();_mSe.gain.value=_seVol;_mSe.connect(AC.destination);
    _mBgm=AC.createGain();_mBgm.gain.value=1;_mBgm.connect(AC.destination);
    _busA=AC.createGain();_busA.gain.value=0;_busA.connect(_mBgm);
    _busB=AC.createGain();_busB.gain.value=0;_busB.connect(_mBgm);
  }catch(e){_mSe=_mBgm=_busA=_busB=null;}
}
/* ゲイン値のフェード(端末非対応メソッドは即値に退避) */
function rampGain(node,target,dur){
  if(!node||!node.gain)return;
  const c=AC,g=node.gain;
  try{
    if(c&&g.cancelScheduledValues)g.cancelScheduledValues(c.currentTime);
    if(c&&g.setValueAtTime)g.setValueAtTime(g.value||0,c.currentTime);
    if(c&&g.linearRampToValueAtTime&&dur>0)g.linearRampToValueAtTime(target,c.currentTime+dur);
    else g.value=target;
  }catch(e){try{g.value=target;}catch(_e){}}
}
function _persist(key,val){
  if(typeof ST!=="undefined"&&ST&&ST.opt){ST.opt[key]=val;if(typeof saveST==="function")saveST();}
}
function _applySeVol(){if(_mSe)rampGain(_mSe,_seVol,0.05);}
function _applyBgmVol(){
  /* 再生中のアクティブバスへ即反映 */
  if(typeof BGM!=="undefined"&&BGM&&BGM.on){const b=AudioMgr.bgmBus(BGM.bus);if(b)rampGain(b,_bgmVol,0.15);}
}

const AudioMgr={
  ctx:ac,
  seDest(){ac();return _mSe;},
  bgmBus(which){ac();return which==="B"?_busB:_busA;},
  bgmMaster(){ac();return _mBgm;},
  fade:rampGain,
  isFocus(){return _focus;},
  isLowData(){return _lowData;},
  getBgmVol(){return _bgmVol;},
  getSeVol(){return _seVol;},
  setBgmVol(v){_bgmVol=_clamp01(v);_persist("bgmVol",_bgmVol);_applyBgmVol();},
  setSeVol(v){_seVol=_clamp01(v);_persist("seVol",_seVol);_applySeVol();},
  setFocus(b){_focus=!!b;_persist("focus",_focus);},
  setLowData(b){_lowData=!!b;_persist("lowData",_lowData);},
  setSeOn(b){muted=!b;if(typeof ST!=="undefined"&&ST&&ST.opt){ST.opt.mute=!b;if(typeof saveST==="function")saveST();}},
  isSeOn(){return !muted;},
  setBgmOn(b){
    if(b){if(typeof bgmStart==="function")bgmStart();}
    else{if(typeof bgmStop==="function")bgmStop();}
    if(typeof ST!=="undefined"&&ST&&ST.opt){ST.opt.bgm=!!b;if(typeof saveST==="function")saveST();}
  },
  /* iOSは通話/Siri割り込みで state が非標準の "interrupted" になる。
     "suspended" 限定だと復帰できず無音が続くので running 以外は全て resume を試みる。
     戻り値は「running になったか」の Promise。復帰処理は AudioContext が実際に走り出した
     後にもう一度ゲインを戻す必要がある(停止中は currentTime が凍り、フェード予約が
     そのまま残って無音のままになるため)。 */
  resume(){
    const c=ac();
    if(!c)return Promise.resolve(false);
    if(c.state==="running")return Promise.resolve(true);
    if(!c.resume)return Promise.resolve(false);
    try{
      const p=c.resume();
      return (p&&typeof p.then==="function")
        ? p.then(()=>c.state==="running",()=>false)
        : Promise.resolve(c.state==="running");
    }catch(e){return Promise.resolve(false);}
  },
  /* 背面へ回るとき: BGMマスタを落として発音を止める(SEは発呼が無いので自然に無音) */
  sleep(){
    if(_mBgm)rampGain(_mBgm,0,0.25);
    if(typeof bgmSuspend==="function"){try{bgmSuspend();}catch(e){}}
  },
  /* 前面へ戻るとき: マスタゲインを「予約ごと捨てて即値で」1へ戻し、BGMを立て直す。
     ・ramp ではなく即値なのが要点。背面では currentTime が凍るため、hide 時に積んだ
       0へのフェード予約が残り続け、ramp で戻そうとしても打ち消されて無音が続く。
     ・resume() は非同期。先に一度戻し、running になってからもう一度戻す(取りこぼし防止)。
     殿報告(アプリを閉じて開くと音が出たり出なかったり)の本体。 */
  wake(){
    const restore=()=>{
      if(_mBgm&&_mBgm.gain){
        try{if(AC&&_mBgm.gain.cancelScheduledValues)_mBgm.gain.cancelScheduledValues(AC.currentTime);}catch(e){}
        try{_mBgm.gain.value=1;}catch(e2){}
      }
      _applySeVol();
      if(typeof bgmAutoRestart==="function"){try{bgmAutoRestart();}catch(e3){}}
      else if(typeof bgmWake==="function"){try{bgmWake();}catch(e4){}}
    };
    const p=this.resume();
    restore();
    if(p&&typeof p.then==="function")p.then(restore,restore);
  },
  /* セーブ(ST.opt)から設定を取り込み反映。engine.loadST 後に呼ぶ */
  applyFromState(){
    if(typeof ST==="undefined"||!ST||!ST.opt)return;
    const o=ST.opt;
    if(typeof o.bgmVol==="number")_bgmVol=_clamp01(o.bgmVol);
    if(typeof o.seVol==="number")_seVol=_clamp01(o.seVol);
    _focus=!!o.focus;_lowData=!!o.lowData;muted=!!o.mute;
    _applySeVol();
  },
  /* 音量・モードを初期値へ戻す(ON-OFF自体は保持) */
  reset(){
    _bgmVol=0.7;_seVol=0.8;_focus=false;_lowData=false;
    if(typeof ST!=="undefined"&&ST&&ST.opt){Object.assign(ST.opt,{bgmVol:_bgmVol,seVol:_seVol,focus:false,lowData:false});if(typeof saveST==="function")saveST();}
    _applySeVol();_applyBgmVol();
  },
  /* ---- 差し替え音源(将来のファイル)基盤 ---- */
  registerBgmFile(scene,url){_files[scene]=url;},
  hasFile(scene){return !_lowData&&!!_files[scene];},
  /* 音源取得。非対応・失敗時は null を返し、呼び出し側は生成音へフォールバック */
  fetchBuffer(scene){
    const url=_files[scene],c=ac();
    if(!url||!c||typeof fetch!=="function"||!c.decodeAudioData)return Promise.resolve(null);
    return fetch(url).then(r=>{if(!r||!r.ok)return null;return r.arrayBuffer();})
      .then(buf=>buf?c.decodeAudioData(buf):null)
      .catch(()=>null);
  }
};
if(typeof window!=="undefined")window.AudioMgr=AudioMgr;

/* タブ非表示中は BGM を休止し、復帰で戻す。復帰の窓口は AudioMgr.wake() 一本に統一する
   (bgm.js 側にも復帰リスナがあり、二重に bgmBegin が走って音が重なる/消えることがあった)。 */
if(typeof document!=="undefined"&&document.addEventListener){
  document.addEventListener("visibilitychange",()=>{
    if(document.hidden)AudioMgr.sleep();
    else AudioMgr.wake();
  });
}
