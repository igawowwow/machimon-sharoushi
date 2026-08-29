"use strict";
/* ============================================================
   pwa-install.js — 「📲 アプリとして使う(ホーム画面に追加)」
   ------------------------------------------------------------
   ・Android/Chrome 等: beforeinstallprompt を捕捉(index.html のインラインで
     早期に window.__pwaPrompt へ保存)し、ボタン押下で OS ネイティブの
     インストールダイアログを起動する。
   ・iOS Safari: beforeinstallprompt 非対応 → 押下で「共有 → ホーム画面に追加」
     の手順を showOvl モーダルで案内する。
   ・既に standalone 起動中(navigator.standalone / display-mode:standalone)なら
     ボタンは出さない(= pwaCanInstall() が false)。
   XSS: モーダルは静的文言のみ。動的値を差し込む場合は esc() を通すこと。
   ============================================================ */

/* standalone(ホーム画面から全画面起動)判定 */
function pwaIsStandalone(){
  try{
    return (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches)
      || window.navigator.standalone === true;
  }catch(e){ return false; }
}
/* iOS(iPhone/iPad/iPod)判定。iPadOS13+ は Mac 偽装するため touch も見る */
function pwaIsIOS(){
  var ua = navigator.userAgent || "";
  if(/iPad|iPhone|iPod/.test(ua)) return true;
  return /Macintosh/.test(ua) && "ontouchend" in document; /* iPadOS */
}
/* ネイティブアプリ(Capacitor)内か。App Store版の中で「アプリとして登録」を出すのは無意味 */
function pwaIsNativeApp(){
  try{
    if(window.Capacitor && typeof window.Capacitor.isNativePlatform==="function" && window.Capacitor.isNativePlatform()) return true;
    return location.protocol==="capacitor:";
  }catch(e){ return false; }
}
/* ボタンを出してよいか: ネイティブアプリ内/全画面起動中は不要。捕捉済みプロンプトが有る or iOS なら可 */
function pwaCanInstall(){
  if(pwaIsNativeApp()) return false;
  if(pwaIsStandalone()) return false;
  if(window.__pwaPrompt) return true;
  return pwaIsIOS();
}
/* ホーム/設定に差し込むボタン HTML。出せない時は空文字(既存レイアウトを崩さない) */
function pwaInstallBtnHtml(){
  var show = pwaCanInstall();
  return '<button class="btn mode-btn js-pwa-install" style="width:100%;margin-top:8px;'
    + 'background:linear-gradient(135deg,#E7F6FF,#EFE1FF)'
    + (show?"":";display:none") + '" onclick="pwaInstall()">'
    + '<span style="font-size:26px">📲</span>'
    + '<span>アプリとして使う<span class="d">ホーム画面に追加して全画面で起動(オフライン対応)</span></span>'
    + '</button>';
}
/* DOM 上の全インストールボタンの表示/非表示を切り替える(遅延発火・完了時に使う) */
function pwaSyncButtons(show){
  var v = show ? "" : "none";
  var els = document.querySelectorAll(".js-pwa-install");
  for(var i=0;i<els.length;i++){ els[i].style.display = v; }
}
window.pwaSyncButtons = pwaSyncButtons;

/* 押下: ネイティブプロンプト or iOS 手順モーダル */
function pwaInstall(){
  if(window.__pwaPrompt){
    var p = window.__pwaPrompt;
    window.__pwaPrompt = null; /* prompt は 1 回きり。再利用不可 */
    try{ p.prompt(); }catch(e){}
    var uc = p.userChoice;
    if(uc && uc.then){
      uc.then(function(c){
        var accepted = c && c.outcome === "accepted";
        pwaSyncButtons(false); /* 承諾でも辞退でもこのイベントは消費済み */
        if(accepted && typeof SFX !== "undefined" && SFX.coin) SFX.coin();
      }).catch(function(){});
    }else{
      pwaSyncButtons(false);
    }
    return;
  }
  pwaGuide();
}
window.pwaInstall = pwaInstall;

/* iOS / 手動ブラウザ向けの追加手順モーダル(静的文言・esc 不要) */
function pwaGuide(){
  var ios = pwaIsIOS();
  var steps = ios
    ? '<div style="text-align:left;font-size:13px;line-height:1.9;margin:6px 2px">'
      + '<div>1. 画面下の <b>共有ボタン</b> <span style="font-size:16px">⬆️</span>(□に↑）を押す</div>'
      + '<div>2. メニューを下にスクロール</div>'
      + '<div>3. <b>「ホーム画面に追加」</b> を選ぶ</div>'
      + '<div>4. 右上の <b>「追加」</b> を押す</div>'
      + '</div>'
      + '<div class="sub2" style="margin-top:6px">※ Safari で開いてね(他アプリ内ブラウザだと出ないことがあるよ)</div>'
    : '<div style="text-align:left;font-size:13px;line-height:1.9;margin:6px 2px">'
      + '<div>1. ブラウザ右上の <b>メニュー</b>(⋮ / ⋯）を開く</div>'
      + '<div>2. <b>「アプリをインストール」</b> または <b>「ホーム画面に追加」</b> を選ぶ</div>'
      + '</div>';
  if(typeof showOvl === "function"){
    showOvl(
      '<div style="font-size:46px">📲</div>'
      + '<h3>アプリとして使う</h3>'
      + '<div class="sub2" style="margin-bottom:4px">ホーム画面に置くと、本物のアプリみたいに<br>全画面&オフラインで起動できるよ。</div>'
      + steps
      + '<button class="btn go-btn" style="width:100%;margin-top:12px;padding:11px" onclick="hideOvl()">とじる</button>'
    );
  }
}
window.pwaGuide = pwaGuide;

/* 遅延発火した beforeinstallprompt / インストール完了を UI へ反映。
   index.html のインラインが window.__pwaPrompt を更新した後にここを呼ぶ */
window.addEventListener("srq:pwa", function(e){
  if(e && e.detail === "installed"){ pwaSyncButtons(false); return; }
  pwaSyncButtons(pwaCanInstall());
});
