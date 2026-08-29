"use strict";
/* ============================================================
   native-features.js — iOSネイティブ機能(触覚・復習リマインド)

   Webでは全て何もしない no-op。呼び出し側は分岐を書かなくてよい。

   審査ガイドライン4.2(Webサイトの単純ラップ)対策の実体でもある。
   ただし「審査を通すための飾り」にはしない:
     ・触覚      = 正誤が画面を見なくても指に返る
     ・リマインド = SRSの次回期日そのものを通知にする(忘却曲線と連動)
   どちらも学習体験に紐付いた機能にしてある。

   Push(APNs)ではなく Local Notifications を使う理由:
   次回期日は端末内のSRSデータから計算できるため、サーバーも
   APNs鍵も不要で、オフラインでも鳴る。
   ============================================================ */
(function(){
  var C = window.Capacitor;
  var native = !!(C && typeof C.isNativePlatform === "function" && C.isNativePlatform());
  var P = native && C.Plugins ? C.Plugins : null;
  var Haptics = P && P.Haptics;
  var LN = P && P.LocalNotifications;

  /* ---------------- 触覚 ---------------- */
  window.__srqHaptic = function(kind){
    if(!Haptics) return;
    try{
      if(kind === "ok") Haptics.impact({ style: "LIGHT" });
      else Haptics.notification({ type: "WARNING" });
    }catch(e){ /* 触覚の失敗はプレイを妨げない */ }
  };

  /* ---------------- 復習リマインド ---------------- */
  var REMINDER_ID = 1;      /* 固定ID: 常に1件だけ。積み上がらない */
  var REMIND_HOUR = 20;     /* 20時 */
  var askedPermission = false;

  /* 学習済みの問題のうち、次に復習期日が来る日。今日ぶんがあれば今日を返す */
  function nextDueDay(){
    if(typeof ST === "undefined" || !ST || !ST.q) return null;
    if(typeof todayNum !== "function") return null;
    var tdn = todayNum(), best = null;
    for(var k in ST.q){
      var s = ST.q[k];
      if(!s || typeof s !== "object") continue;
      if(((s.c||0) + (s.w||0)) <= 0) continue;   /* 未学習は復習対象外 */
      var d = s.due || 0;
      if(d <= tdn) return tdn;                    /* 今日すでに期限切れがある */
      if(best === null || d < best) best = d;
    }
    return best;
  }

  function dueCountOn(day){
    var n = 0;
    for(var k in ST.q){
      var s = ST.q[k];
      if(!s || typeof s !== "object") continue;
      if(((s.c||0) + (s.w||0)) <= 0) continue;
      if((s.due || 0) <= day) n++;
    }
    return n;
  }

  window.__srqScheduleReview = function(){
    if(!LN) return;
    var day = nextDueDay();
    if(day === null) return;                      /* まだ1問も解いていない */

    var tdn = todayNum();
    var at = new Date();
    at.setDate(at.getDate() + (day - tdn));
    at.setHours(REMIND_HOUR, 0, 0, 0);
    /* 目標時刻を過ぎていたら翌日に送る(過去の日時は通知が発火しない) */
    if(at.getTime() <= Date.now()) at.setDate(at.getDate() + 1);

    var n = dueCountOn(day);
    var body = n > 0
      ? "復習の期日が来た問題が" + n + "問あります。5分だけでも進めましょう"
      : "今日の復習をしましょう";

    var run = function(granted){
      if(!granted) return;                        /* 拒否されたら黙って何もしない */
      LN.cancel({ notifications: [{ id: REMINDER_ID }] })
        .catch(function(){})
        .then(function(){
          return LN.schedule({ notifications: [{
            id: REMINDER_ID,
            title: "社労士クエスト",
            body: body,
            schedule: { at: at, allowWhileIdle: true }
          }]});
        })
        .catch(function(){ /* 通知の失敗はプレイを妨げない */ });
    };

    LN.checkPermissions().then(function(r){
      if(r && r.display === "granted") return run(true);
      if(r && r.display === "denied") return;
      /* 未確定: 初回だけ尋ねる。連打で何度もダイアログを出さない */
      if(askedPermission) return;
      askedPermission = true;
      return LN.requestPermissions().then(function(r2){
        run(!!(r2 && r2.display === "granted"));
      });
    }).catch(function(){});
  };

  if(!native){
    /* Webでは完全に無効。呼ばれても何も起きない */
    window.__srqHaptic = function(){};
    window.__srqScheduleReview = function(){};
    window.__srqHasBundledFonts = false;
    return;
  }

  /* ---------------- 同梱フォントのライセンス表示 ----------------
     SIL Open Font License 1.1 はライセンス全文の同梱を条件にしている。
     ネイティブ版だけがフォントを同梱するので、導線もネイティブ版だけに出す
     (Web版は Google Fonts CDN から読むため同梱に当たらない)。
     全文は tools/build-www.js が www/OFL-*.txt として配置する。 */
  window.__srqHasBundledFonts = true;

  var LICENSES = [
    { name: "DotGothic16",       file: "./OFL-dotgothic16.txt" },
    { name: "M PLUS Rounded 1c", file: "./OFL-mplusrounded1c.txt" }
  ];

  function escHtml(s){
    return String(s).replace(/[&<>"']/g, function(c){
      return {"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c];
    });
  }

  window.srqLicenses = function(){
    if(typeof showOvl !== "function") return;
    showOvl('<h3>📄 ライセンス表示</h3><div class="sub2">読み込み中…</div>');
    Promise.all(LICENSES.map(function(l){
      return fetch(l.file).then(function(r){
        if(!r.ok) throw new Error(String(r.status));
        return r.text();
      }).then(function(txt){ return { name: l.name, text: txt }; })
       .catch(function(){ return { name: l.name, text: null }; });
    })).then(function(rs){
      var body = rs.map(function(r){
        return '<div style="font-weight:900;margin:10px 0 4px">' + escHtml(r.name) + '</div>' +
          (r.text
            ? '<pre style="white-space:pre-wrap;word-break:break-word;font-size:10px;line-height:1.5;' +
              'text-align:left;background:#F7F5FB;border-radius:8px;padding:8px;margin:0">' +
              escHtml(r.text) + '</pre>'
            : '<div class="sub2">ライセンス全文を読み込めませんでした</div>');
      }).join("");
      showOvl('<h3>📄 ライセンス表示</h3>' +
        '<div class="sub2" style="text-align:left">本アプリは以下のフォントを同梱しています。' +
        'いずれも SIL Open Font License 1.1 で提供されています。</div>' +
        '<div style="max-height:52vh;overflow:auto;text-align:left">' + body + '</div>' +
        '<button class="btn go-btn" style="width:100%;margin-top:10px;padding:11px" onclick="hideOvl()">とじる</button>');
    });
  };

  /* アプリを離れる時に次回ぶんを予約し直す(学習直後の状態を反映できる) */
  document.addEventListener("visibilitychange", function(){
    if(document.visibilityState === "hidden"){
      try{ window.__srqScheduleReview(); }catch(e){}
    }
  });
})();
