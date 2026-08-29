"use strict";
/* ============================================================
   ui-overlays.js — レベルアップ・宝箱・ストーリーのオーバーレイ演出
   ============================================================ */
/* ============ レベルアップ演出 ============ */
function lvUpShow(){
  const s=stats();
  SFX.levelup();confetti(30);flash("#FFF3C4",200);
  const bonus=ST.lv*20;ST.coins+=bonus;saveST();
  showOvl(`
    ${px("trophy",64,"floaty")}
    <h3 class="dot" style="color:var(--pink)">LEVEL UP!</h3>
    <div style="font-size:30px;font-weight:900">Lv.${ST.lv}</div>
    ${ST.reb?`<div style="font-size:11px;color:#C58900;font-weight:900">転生${ST.reb}回目(ボーナス+${ST.reb*5}%)</div>`:""}
    <div class="pstats" style="margin:10px 0">
      <span>知識<b>${s.kn}</b></span><span>暗記<b>${s.mem}</b></span><span>集中<b>${s.foc}</b></span><span>運<b>${s.luck}</b></span>
    </div>
    <div class="sub2">レベルアップ報酬 +${bonus}コイン!<br>知識が上がると攻撃力UP、集中で制限時間UP</div>
    <button class="btn go-btn" style="width:100%;margin-top:12px;padding:11px" onclick="hideOvl()">つづける ▶</button>
  `);
}

/* ============ 宝箱開封 ============ */
function openChest(){
  if(ST.chests<=0)return;
  ST.chests--;
  const r=chestRoll();saveST();
  SFX.chest();
  if(r.rar>=3){SFX.ssr();confetti(40);flash("#FFE9A8",250);}
  showOvl(`
    ${px("chest",60,"pop")}
    <h3 class="dot">宝箱オープン!</h3>
    <div style="margin:10px 0">${r.icon}</div>
    <div style="font-size:15px;font-weight:900" class="${r.rar!==undefined?RAR[r.rar]?.cls||"":""}">${r.label}</div>
    <button class="btn go-btn" style="width:100%;margin-top:12px;padding:11px" onclick="hideOvl()">${ST.chests>0?"次の宝箱へ ▶":"とじる"}</button>
  `,()=>{if(ST.chests>0)openChest();else if(document.querySelector(".end-wrap"))endRefreshChestBtn();});
}
function endRefreshChestBtn(){/* リザルト画面の宝箱ボタンを消す */
  const btns=document.querySelectorAll(".mode-btn");
  btns.forEach(b=>{if(b.textContent.includes("宝箱を開ける"))b.remove();});
}
window.openChest=openChest;

/* ============ ストーリー表示 ============ */
let storyQ=[],storyIdx=0,storyCb=null;
function storyThen(id,lines,cb){
  if(!lines||ST.story[id]){cb();return;}
  ST.story[id]=1;saveST();
  storyShow(lines,cb);
}
let storyPrevScene="field";
function storyShow(lines,cb){
  storyQ=lines;storyIdx=0;storyCb=cb;
  if(typeof setBgmScene==="function"){storyPrevScene=(typeof bgmScene!=="undefined"?bgmScene:"field");setBgmScene("emotion");}
  const d=document.createElement("div");d.className="story-ovl";d.id="storyOvl";
  d.onclick=()=>storyNext();
  document.body.appendChild(d);
  storyRender();
}
function storyRender(){
  const d=document.getElementById("storyOvl");if(!d)return;
  const L=storyQ[storyIdx];
  d.innerHTML=`
   <div class="story-face">${px(L.sp,90,"floaty")}</div>
   <div class="story-box">
     <div class="sn">${L.n}</div>
     <div class="st2">${L.t}</div>
     <div class="snext">タップで${storyIdx<storyQ.length-1?"次へ":"はじめる"} ▶</div>
   </div>`;
}
function storyNext(){
  storyIdx++;
  if(storyIdx<storyQ.length){storyRender();return;}
  const d=document.getElementById("storyOvl");if(d)d.remove();
  if(typeof setBgmScene==="function")setBgmScene(storyPrevScene||"field");
  const cb=storyCb;storyCb=null;
  if(cb)cb();
}
window.storyNext=storyNext;

/* ============ 撤退の誤タップ保護 ============
   バトル中の「← 撤退」は進行が消えるため、確認を挟む。制限時間は確認中だけ止める。 */
function retreat(){
  if(typeof zFlashClear==="function")zFlashClear(); /* S4(C): 撤退時に図解フラッシュを残さない */
  if(!G){home();return;}
  if(G.awaiting&&timerH){stopTimer();G._paused=true;}
  showOvl(`${px("skull",48)}<h3>バトルをやめる?</h3>
    <div class="sub2">いま撤退すると、このバトルの進行は保存されません。</div>
    <button class="btn mode-btn pinkbg" style="margin-top:10px" onclick="retreatGo()">🏠<span>やめてホームへ戻る</span></button>
    <button class="btn go-btn" style="width:100%;margin-top:6px;padding:11px" onclick="retreatStay()">つづける</button>`);
}
/* 自分から撤退したなら中断ではない。スナップショットを消してホームに再開バナーを出さない
   (「進行は保存されません」と伝えたうえで選ばせているので、残すと表示と矛盾する) */
function retreatGo(){
  hideOvlSilent();if(typeof btClear==="function")btClear();
  /* 物語戦の途中で自分から撤退したら、物語⇔戦闘の橋(pending)も破棄する。
     残すと次に終わった無関係なバトルの勝敗が物語へ誤って接続され、
     放置したはずの encounter の報酬付与や物語誤復帰が起きる。
     物語の現在地(resume)は無傷なので「続きから」で同じ場面に戻れる。 */
  try{const S=window.SRStory;if(S&&S.bridge&&typeof S.bridge.isPending==="function"&&S.bridge.isPending())S.bridge.cancel();}catch(e){}
  home();
}
function retreatStay(){
  hideOvlSilent();
  if(G&&G._paused){G._paused=false;if(isTimed())startTick();}
}
window.retreat=retreat;window.retreatGo=retreatGo;window.retreatStay=retreatStay;

/* ============ 引っ越しコード(セーブの書き出し/取り込み) ============
   ドメイン移転(専用リポジトリ/新URL/iOSアプリ)に備え、セーブを文字列で持ち運べるようにする。
   形式: "SRQ1:" + base64(UTF-8 JSON)。取り込み時は既存セーブを sr-quest-premigrate に退避。 */
function saveExportCode(){
  return "SRQ1:"+btoa(unescape(encodeURIComponent(JSON.stringify(ST))));
}
function saveExport(){
  const code=saveExportCode();
  showOvl(`<h3>📦 引っ越しコード</h3>
    <div class="sub2" style="text-align:left">このコードを新しいアプリの「取り込む」に貼り付けると、学習データがまるごと移ります。</div>
    <textarea id="expCode" readonly style="width:100%;height:110px;margin-top:8px;font-size:10px;border:2px solid var(--ink);border-radius:10px;padding:8px">${code}</textarea>
    <button class="btn mode-btn mintbg" style="margin-top:8px" onclick="saveCopyCode()">📋<span>コードをコピー</span></button>
    <button class="btn go-btn" style="width:100%;margin-top:6px;padding:11px" onclick="hideOvl()">とじる</button>`);
}
function saveCopyCode(){
  const ta=document.getElementById("expCode");if(!ta)return;
  ta.select();ta.setSelectionRange(0,999999);
  const done=()=>{bigBanner("📋 コピーした!","#2B9E82",18);SFX.coin();};
  if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(ta.value).then(done).catch(()=>{document.execCommand("copy");done();});}
  else{document.execCommand("copy");done();}
}
function saveImport(){
  showOvl(`<h3>📥 引っ越しコードを取り込む</h3>
    <div class="sub2" style="text-align:left">前のアプリで書き出したコードを貼り付けてください。<b>今のデータは上書きされます</b>(直前の状態は自動バックアップ)。</div>
    <textarea id="impCode" style="width:100%;height:110px;margin-top:8px;font-size:10px;border:2px solid var(--ink);border-radius:10px;padding:8px" placeholder="SRQ1:..."></textarea>
    <button class="btn mode-btn yellowbg" style="margin-top:8px" onclick="saveImportDo()">📥<span>取り込んで再起動</span></button>
    <button class="btn go-btn" style="width:100%;margin-top:6px;padding:11px" onclick="hideOvl()">やめる</button>`);
}
function saveImportDo(){
  const ta=document.getElementById("impCode");if(!ta)return;
  const raw=(ta.value||"").trim();
  if(!raw.startsWith("SRQ1:")){bigBanner("コードの形式が違うようです","#C2274B",14);return;}
  try{
    const json=decodeURIComponent(escape(atob(raw.slice(5))));
    const parsed=safeParse(json);
    if(!parsed||typeof parsed!=="object"||typeof parsed.v!=="number"||typeof parsed.q!=="object")throw new Error("bad save");
    try{const cur=localStorage.getItem(KEY);if(cur)localStorage.setItem("sr-quest-premigrate",cur);}catch(e){}
    localStorage.setItem(KEY,json);
    bigBanner("📥 取り込み成功!再起動します","#2B9E82",16);
    setTimeout(()=>location.reload(),800);
  }catch(e){bigBanner("取り込みに失敗(コードを確認してください)","#C2274B",13);}
}
window.saveExport=saveExport;window.saveImport=saveImport;
window.saveCopyCode=saveCopyCode;window.saveImportDo=saveImportDo;
