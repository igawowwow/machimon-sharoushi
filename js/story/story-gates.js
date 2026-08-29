"use strict";
/* ============================================================
   story/story-gates.js — E3: 機能の段階解放（ストーリー進行で少しずつ）
   ・新規プレイヤーは最初から全機能を見せない。物語(sq.flags)の進行に応じて解放。
   ・既存プレイヤー/進行済みセーブは「解放済み」にフォールバック=いきなりロックしない。
     判定は sq/進行から導出（自動セーブ）。旧UIの到達性は壊さない。
   ・データ駆動の unlock テーブル。未実装話に紐づく解放は「未解放」表示のまま
     将来 flag を立てれば自動で開く構造。
   ・eval/new Function 禁止・DOM 非依存の純ロジック（表示ラッパのみ末尾）。
   docs/story-bible.md §9 / story-architecture.md §6 準拠。
   ============================================================ */
(function(){
  var G = (typeof window!=="undefined") ? window : globalThis;
  var S = G.SRStory = G.SRStory || {};

  function esc2(s){
    return String(s==null?"":s)
      .replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
      .replace(/"/g,"&quot;").replace(/'/g,"&#39;");
  }

  /* ---- 解放テーブル（章/話→flag）。flag は章データが立てる進行フラグと一致 ----
     実装済み範囲（〜第一章 第3話）: 序章=今日の冒険/事務所、第1話=地図/図鑑、
     第2話=装備、第3話=仲間。第4話以降は未実装＝flag 未到達＝「未解放」表示のまま。 */
  S.UNLOCKS = S.UNLOCKS || [
    { key:"today",  flag:"p_prologue_done", ch:"序章クリア" },
    { key:"office", flag:"p_prologue_done", ch:"序章クリア" },
    { key:"map",    flag:"c1_ep1_done",     ch:"第一章 第1話" },
    { key:"zukan",  flag:"c1_ep1_done",     ch:"第一章 第1話" },
    { key:"gear",   flag:"c1_ep2_done",     ch:"第一章 第2話" },
    { key:"party",  flag:"c1_ep3_done",     ch:"第一章 第3話" },
    { key:"gacha",  flag:"c1_ep4_done",     ch:"第一章 第4話" },
    { key:"cases",  flag:"c1_ep5_done",     ch:"第一章 第5話" },
    { key:"trials", flag:"c1_ep5_done",     ch:"第一章 第5話" },
    { key:"review", flag:"c1_ep6_done",     ch:"第一章 第6話" },
    { key:"train",  flag:"c1_ep7_done",     ch:"第一章 第7話" },
    { key:"boss",   flag:"c1_ep8_done",     ch:"第一章 第8話" }
  ];
  S.UNLOCK_BY_KEY = (function(){
    var m={}; for(var i=0;i<S.UNLOCKS.length;i++){ m[S.UNLOCKS[i].key]=S.UNLOCKS[i]; } return m;
  })();

  /* ---- 既存/進行済みプレイヤーの判定（＝段階解放の対象外＝全解放） ----
     新物語エンジンは sq に閉じており、これらの旧・冒険/メタ進行フラグには触れない。
     つまり「新しい物語だけを遊ぶ新規プレイヤー」ではこれらが立たない＝段階解放が効く。
     いずれかが立つ＝旧UIの冒険を進めた既存プレイヤー＝退行させない（全解放）。 */
  S.isVeteran = function(){
    var st = G.gameState;
    if(!st || typeof st!=="object") return false;
    try{
      if(st.msq && ((st.msq.ch|0) > 0 || st.msq.done)) return true;   /* 悪魔への道を進めた */
      if((st.clears|0) > 0) return true;                               /* 周回クリア済み */
      if((st.loop|0) > 1) return true;
      if((st.reb|0) > 0) return true;                                  /* 転生済み */
      if((st.trueWin|0) > 0) return true;
      if((st.gTotal|0) > 0) return true;                              /* ガチャ履歴（新規はロック中） */
      if(st.intro && st.intro.met) return true;                       /* 旧・冒頭アークを見た */
      if(st.cases){ for(var k in st.cases){ var c=st.cases[k]; if(c && c.cleared) return true; } }
    }catch(e){}
    return false;
  };

  /* この保存に段階解放を適用するか。charcreate で新規に始めた者だけ true。 */
  S.gatingActive = function(){
    if(!(typeof S.hasFlag==="function")) return false;
    if(!S.hasFlag("sq_journey_gated")) return false; /* 本機能導入後に新規開始した者のみ */
    if(S.isVeteran()) return false;                  /* 途中から既存化したら解放 */
    return true;
  };

  /* charcreate（物語の真の起点）で呼ぶ。まっさら新規のみ段階解放の対象に印を付ける。 */
  S.markFreshJourney = function(){
    if(!(typeof S.setFlag==="function")) return;
    if(S.isVeteran()) return;                        /* 既存進行があれば印を付けない＝全解放のまま */
    if(typeof S.hasFlag==="function" && S.hasFlag("sq_journey_gated")) return;
    S.setFlag("sq_journey_gated", 1);
    if(typeof S.save==="function") S.save();
  };

  /* key の機能が解放済みか。段階解放が非対象なら常に true（旧UIの到達性を壊さない）。 */
  S.gateUnlocked = function(key){
    if(!S.gatingActive()) return true;
    var u = S.UNLOCK_BY_KEY[key];
    if(!u) return true;                               /* 未知キーは安全側で解放 */
    return (typeof S.hasFlag==="function") ? S.hasFlag(u.flag) : true;
  };

  /* ロック理由（小さく表示する定型文）。仕様どおり「物語を進めると解放」。 */
  S.gateHint = function(){ return "物語を進めると解放"; };

  /* どこで解放されるか（タップ時の説明用）。 */
  S.gateWhere = function(key){
    var u = S.UNLOCK_BY_KEY[key];
    return u ? u.ch : "物語の先";
  };

  /* ============================================================
     表示ラッパ（旧UIの ui-home.js から呼ぶ薄いグローバル）
     ・未ロード時に呼ばれても安全なように typeof ガードして使うこと。
     ============================================================ */
  /* 解放済みか（fallback=true）。ui-home.js は typeof sqGate で参照。 */
  G.sqGate = function(key){ try{ return S.gateUnlocked(key); }catch(e){ return true; } };
  /* 小さなロック理由テキスト */
  G.sqGateHint = function(){ try{ return S.gateHint(); }catch(e){ return "物語を進めると解放"; } };
  /* ロックしたボタンをタップした時の説明オーバーレイ */
  G.sqLockTap = function(key, label){
    var where = "";
    try{ where = S.gateWhere(key); }catch(e){}
    var msg = "「"+String(label||"この機能")+"」はまだ解放されていない。"+
              (where?("《"+where+"》で解放される。"):"")+"まずは今日の冒険を進めよう。";
    var html =
      '<div style="text-align:center;font-size:34px">🔒</div>'+
      '<h3 style="text-align:center">まだ解放されていない</h3>'+
      '<div class="sub2" style="text-align:center">'+esc2(msg)+'</div>'+
      '<button class="btn go-btn" style="width:100%;margin-top:12px;padding:11px" '+
        'onclick="'+(typeof G.hideOvl==="function"?"hideOvl()":"")+'">とじる</button>';
    if(typeof G.showOvl==="function"){ G.showOvl(html); }
  };
})();
