"use strict";
/* ============================================================
   story/story-engine.js — オーケストレータ（ノード解決→分岐→効果→前進→復帰）
   ・データ駆動・eval禁止。UI 描画は handlers（R3 で会話/選択レンダラを注入）。
   ・存在しない sceneId は安全フォールバック（起動不能にしない）。
   ・encounter は resume トークンを置いて戦闘へ委譲、勝敗後 onBattleEnd で物語復帰。
   docs/story-architecture.md §1/§5 準拠。DOM 非依存（handlers 経由で描画層と接続）。
   ============================================================ */
(function(){
  var G = (typeof window!=="undefined") ? window : globalThis;
  var S = G.SRStory = G.SRStory || {};

  S._chapters = S._chapters || {};
  S._activeHandlers = S._activeHandlers || {};

  /* 章登録: 配列 or {id:node} を {id:node} に正規化 */
  S.register = function(chapterId, nodes){
    var map = {};
    if(Array.isArray(nodes)){
      nodes.forEach(function(n){ if(n && n.id) map[n.id] = n; });
    } else if(nodes && typeof nodes==="object"){
      for(var k in nodes){ var n = nodes[k]; if(n){ if(!n.id) n.id = k; map[n.id] = n; } }
    }
    S._chapters[chapterId] = map;
    return map;
  };

  S.node = function(chapterId, nodeId){
    var m = S._chapters[chapterId];
    return (m && m[nodeId]) ? m[nodeId] : null;
  };

  /* 章の先頭ノード（start:true 優先、無ければ最初の登録キー） */
  S._firstNode = function(chapterId){
    var m = S._chapters[chapterId]; if(!m) return null;
    for(var k in m){ if(m[k] && m[k].start) return k; }
    var ks = Object.keys(m); return ks.length ? ks[0] : null;
  };

  /* next（string | {then,else} | null）→ 既定遷移先 */
  S._resolveNext = function(next){
    if(next==null) return null;
    if(typeof next==="string") return next;
    if(typeof next==="object") return next.then || next.else || null;
    return null;
  };
  function branchThen(node){ var n = node.next; return (typeof n==="string") ? n : (n && typeof n==="object" ? (n.then||null) : null); }
  function branchElse(node){ var n = node.next; return (n && typeof n==="object") ? (n.else||null) : null; }

  /* 章開始/再開。nodeId 省略時は resume（同章）or 先頭。 */
  S.run = function(chapterId, nodeId, handlers){
    handlers = handlers || {};
    S._activeHandlers = handlers;
    S.setChapter(chapterId);
    var start = nodeId;
    if(start==null){
      var rt = S.resume();
      start = (rt && rt.chapterId===chapterId) ? rt.nodeId : S._firstNode(chapterId);
    }
    return S._enter(chapterId, start, handlers);
  };

  /* ノード入場: 自動遷移（branch/gate）を辿り、対話系/終端/欠損で停止して handler を呼ぶ */
  S._enter = function(chapterId, nodeId, handlers){
    handlers = handlers || S._activeHandlers || {};
    S._activeHandlers = handlers;
    var curId = nodeId, guard = 0;
    while(guard++ < 1000){
      var node = S.node(chapterId, curId);
      if(!node){                                  /* 存在しない sceneId = 安全フォールバック */
        S.clearResume();
        if(typeof handlers.onMissing==="function"){ try{ handlers.onMissing(chapterId, curId); }catch(e){} }
        return { status:"missing", chapterId:chapterId, nodeId:curId };
      }
      var pass = (node.conditions==null) || S.evalConditions(node.conditions);

      if(node.type==="branch"){
        S.applyEffects(node);
        var bn = pass ? branchThen(node) : branchElse(node);
        if(bn==null) return S._finish(chapterId, node, handlers);
        curId = bn; continue;
      }
      if(!pass){                                  /* ゲート未達: else へ迂回、無ければ停止 */
        var el = (node.next && typeof node.next==="object") ? node.next.else : null;
        if(el){ curId = el; continue; }
        return { status:"gated", chapterId:chapterId, nodeId:curId };
      }
      if(node.type==="encounter"){                /* 戦闘は報酬を勝利まで保留 */
        S.markSeen(node.id);
        S.setResume(chapterId, curId);
        S.save();
        if(typeof handlers.onEncounter==="function"){ try{ handlers.onEncounter(node, S._api(chapterId, node, handlers)); }catch(e){} }
        return { status:"encounter", chapterId:chapterId, node:node };
      }
      S.applyEffects(node);                        /* 到達時に効果適用（flags/ideo/rel/evidence/quest/reward） */
      S.setResume(chapterId, curId);
      return S._present(chapterId, node, handlers);
    }
    return { status:"loopguard", chapterId:chapterId, nodeId:curId };
  };

  /* 対話系/終端ノードの提示（描画は handler。ここでは effects を再適用しない） */
  S._present = function(chapterId, node, handlers){
    var api = S._api(chapterId, node, handlers);
    switch(node.type){
      case "choice":
        var choices = S.visibleChoices(node);
        call(handlers.onChoice, node, choices, api);
        return { status:"choice", chapterId:chapterId, node:node, choices:choices };
      case "end":
        S.setEnding(node.ending); S.clearResume();
        call(handlers.onEnd, node, api);
        return { status:"end", chapterId:chapterId, node:node, ending:node.ending };
      case "evidence":     call(handlers.onEvidence, node, api);     return { status:"evidence", chapterId:chapterId, node:node };
      case "reasoning":    call(handlers.onReasoning, node, api);    return { status:"reasoning", chapterId:chapterId, node:node };
      case "negotiation":  call(handlers.onNegotiation, node, api);  return { status:"negotiation", chapterId:chapterId, node:node };
      case "cutscene":     call(handlers.onCutscene, node, api);     return { status:"cutscene", chapterId:chapterId, node:node };
      case "dialogue":
      default:             call(handlers.onDialogue, node, api);     return { status:"dialogue", chapterId:chapterId, node:node };
    }
  };
  function call(fn){ if(typeof fn==="function"){ try{ fn.apply(null, Array.prototype.slice.call(arguments,1)); }catch(e){} } }

  /* handler へ渡す前進 API */
  S._api = function(chapterId, node, handlers){
    return {
      node: node,
      next: function(){ return S._advance(chapterId, node, handlers); },
      pick: function(idx){
        var nx = S.pickChoice(node, idx);
        if(nx==null) nx = S._resolveNext(node.next);
        if(nx==null) return S._finish(chapterId, node, handlers);
        return S._enter(chapterId, nx, handlers);
      },
      win:  function(g){ return S.onBattleEnd(true, g, chapterId, node, handlers); },
      lose: function(g){ return S.onBattleEnd(false, g, chapterId, node, handlers); }
    };
  };

  S._advance = function(chapterId, node, handlers){
    var nx = S._resolveNext(node.next);
    if(nx==null) return S._finish(chapterId, node, handlers);
    return S._enter(chapterId, nx, handlers);
  };

  /* 章末（前進先が無いノード） */
  S._finish = function(chapterId, node, handlers){
    S.clearResume();
    if(typeof handlers.onChapterEnd==="function"){ try{ handlers.onChapterEnd(chapterId, node); }catch(e){} }
    return { status:"chapterEnd", chapterId:chapterId, node:node };
  };

  /* 戦闘終了フック: 引数省略時は resume トークンから復元（既存戦闘終了フックから呼べる） */
  S.onBattleEnd = function(win, g, chapterId, node, handlers){
    if(chapterId==null){
      var rt = S.resume();
      if(!rt) return { status:"noresume" };
      chapterId = rt.chapterId;
      node = S.node(chapterId, rt.nodeId);
      handlers = S._activeHandlers || {};
    }
    if(!node){                                    /* resume 先が消えていても安全に停止 */
      S.clearResume();
      return { status:"missing", chapterId:chapterId };
    }
    if(win){
      S.applyEffects(node);                        /* 勝利で報酬/証拠/フラグを付与 */
      var nx = S._resolveNext(node.next);
      if(nx==null) return S._finish(chapterId, node, handlers);
      return S._enter(chapterId, nx, handlers);
    }
    var el = (node.next && typeof node.next==="object") ? node.next.else : null;
    if(el) return S._enter(chapterId, el, handlers);
    return { status:"retry", chapterId:chapterId, node:node };
  };
})();
