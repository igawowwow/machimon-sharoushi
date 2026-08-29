"use strict";
/* ============================================================
   story/story-battle-bridge.js — 物語 encounter ⇄ 旧UIバトルの橋（R6）
   ・物語の encounter ノードは当面「旧UIの start*」へ委譲する（architecture §5）。
     戦闘に入る前に engine が resume トークンを置くので、勝敗確定時に
     この橋が resume から物語へ復帰させる（onBattleEnd）。
   ・pending フラグ1本だけの薄い状態。旧UIバトル（train/boss等）は無傷で回り、
     終了時に storyOnBattleEnd() が「物語戦だったか」を判定して物語へ返すだけ。
   ・eval/new Function 禁止・DOM 非依存（描画は S.ui へ委譲）。
   docs/story-architecture.md §5 準拠。
   ============================================================ */
(function(){
  var G = (typeof window!=="undefined") ? window : globalThis;
  var S = G.SRStory = G.SRStory || {};

  var bridge = S.bridge = S.bridge || {
    _pending:false, _node:null,

    /* 戦闘開始: この戦闘は物語 encounter からのものだと記録する */
    begin:function(node){ this._pending = true; this._node = node || null; },
    isPending:function(){ return !!this._pending; },
    pendingNode:function(){ return this._node; },
    cancel:function(){ this._pending = false; this._node = null; },

    /* 戦闘終了: 物語へ復帰（勝敗で報酬/分岐を engine が処理）。処理したら true 相当の結果を返す */
    resolve:function(win, g){
      if(!this._pending) return { status:"noresume" };
      this._pending = false; this._node = null;
      /* overlay を持つ描画層があれば再開（本番）。無ければ engine の復帰のみ（テスト/最小） */
      if(S.ui && typeof S.ui.resumeAfterBattle==="function") return S.ui.resumeAfterBattle(!!win, g);
      if(typeof S.onBattleEnd==="function") return S.onBattleEnd(!!win, g);
      return { status:"noengine" };
    }
  };

  /* encounter ノード → 旧UIの start*（データ→関数マップ。コード文字列は持たない=eval排除）。
     戦闘系が未ロード（テスト環境）でも throw せず false を返す。 */
  S.dispatchEncounter = function(node){
    var e = node && node.encounter;
    if(!e || typeof e!=="object") return false;
    var kind = e.kind, subj = (typeof e.subject==="number") ? e.subject : 0;
    try{
      if(kind==="boss" && typeof G.startBoss==="function"){ G.startBoss(subj); return true; }
      if((kind==="exam"||kind==="last") && typeof G.startLast==="function"){ G.startLast(); return true; }
      if(kind==="true" && typeof G.startTrue==="function"){ G.startTrue(); return true; }
      if(typeof G.startTrain==="function"){ G.startTrain(subj); return true; }  /* train/case/既定 */
    }catch(err){}
    return false;
  };

  /* 描画層の onEncounter に渡すハンドラ: pending 記録 → 旧UIバトルへ委譲 */
  S.onStoryEncounter = function(node){
    bridge.begin(node);
    S.dispatchEncounter(node);   /* 戦闘系が無い環境では pending のまま（呼び側が resolve） */
  };

  /* 旧UIバトル終了フックから呼ぶ（endBattle2 冒頭）。物語戦だったら物語へ返し true を返す。
     物語戦でなければ false=通常のリザルト処理を続行させる。 */
  G.storyOnBattleEnd = function(win, g){
    if(!bridge.isPending()) return false;
    bridge.resolve(win, g);
    return true;
  };
  /* リザルト画面の「物語に戻る」ボタン用（保険。通常は storyOnBattleEnd で自動復帰） */
  G.storyResumeFromBattle = function(win){
    return bridge.resolve(!!win, (typeof G.G!=="undefined") ? G.G : null);
  };
})();
