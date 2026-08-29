"use strict";
/* ============================================================
   ui-soundtest.js — サウンドテスト(設定から開く試聴画面)
   各BGMシーン・効果音を試聴でき、各BGMが「🎵自作(殿のファイル)」か
   「🎼合成(内蔵音)」かを表示する。自作音源を置いたら反映確認に使う。
   ============================================================ */
const SND_SCENES=[
  ["field","🗺 冒険マップ"],["town","🏢 拠点・事務所"],["battle","⚔ 雑魚ラッシュ"],
  ["boss","👹 ボス戦"],["metal","✨ メタル出現"],["victory","🎉 勝利ジングル"],
  ["emotion","💧 感動シーン"]
];
const SND_SFX=[
  ["ok","正解"],["crit","会心"],["ng","不正解"],["coin","コイン"],["buy","購入"],
  ["win","勝利"],["levelup","レベルUP"],["chest","宝箱"],["gacha","ガチャ"],
  ["ssr","SSR"],["legend","LR"],["explode","撃破"]
];
function sndSrcLabel(scene){
  return (typeof AudioMgr!=="undefined"&&AudioMgr.hasFile(scene))?"🎵自作":"🎼合成";
}
function soundTest(){
  const gs="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:4px";
  const bgmRows=SND_SCENES.map(([k,label])=>
    `<button class="small-btn" style="height:auto;padding:8px 4px;line-height:1.3" onclick="sndBgm('${k}')">${esc(label)}<br><small style="opacity:.8">${sndSrcLabel(k)}</small></button>`
  ).join("");
  const sfxRows=SND_SFX.map(([k,label])=>
    `<button class="small-btn" onclick="sndSfx('${k}')">${esc(label)}</button>`
  ).join("");
  const anyFile=SND_SCENES.some(([k])=>typeof AudioMgr!=="undefined"&&AudioMgr.hasFile(k));
  showOvl(`
    ${px("clock1",44,"floaty")}
    <h3>🔊 サウンドテスト</h3>
    <div class="sub2">タップで試聴。BGMの「🎵自作」は殿の音源、「🎼合成」は内蔵の合成音。${anyFile?"":"<br>自作音源は assets/bgm/ に置いて登録すると差し替わる。"}</div>
    <div style="font-weight:900;margin-top:10px;font-size:13px">🎶 BGMシーン</div>
    <div style="${gs}">${bgmRows}</div>
    <div style="font-weight:900;margin-top:12px;font-size:13px">🔔 効果音</div>
    <div style="${gs}">${sfxRows}</div>
    <button class="btn go-btn" style="width:100%;margin-top:14px;padding:11px" onclick="sndClose()">とじる</button>
  `);
}
/* BGMシーンを試聴。停止中なら鳴らして始める。victory は元シーンへ戻る単発。 */
window.sndBgm=(k)=>{
  if(typeof AudioMgr!=="undefined")AudioMgr.resume();
  if(typeof BGM!=="undefined"&&!BGM.on&&typeof bgmStart==="function"){
    if(typeof ST!=="undefined"&&ST.opt){ST.opt.bgm=true;ST.opt.bgmTouched=true;if(typeof saveST==="function")saveST();}
    bgmStart();
  }
  if(k==="victory"){
    const ret=(typeof bgmScene!=="undefined"&&bgmScene!=="victory")?bgmScene:"town";
    if(typeof setBgmScene==="function")setBgmScene("victory",ret);
  }else if(typeof setBgmScene==="function")setBgmScene(k);
  if(typeof SFX!=="undefined")SFX.tick();
};
window.sndSfx=(k)=>{if(typeof SFX!=="undefined"&&typeof SFX[k]==="function")SFX[k]();};
/* とじたら拠点BGMへ戻す(サウンドテストは設定=拠点から開くため) */
window.sndClose=()=>{if(typeof setBgmScene==="function")setBgmScene("town");hideOvl();};
if(typeof window!=="undefined")window.soundTest=soundTest;
