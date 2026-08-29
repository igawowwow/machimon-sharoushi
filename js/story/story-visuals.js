"use strict";
/* ============================================================
   story/story-visuals.js — S2: 立ち絵・背景・表情（ビジュアルノベル化）の描画部品
   ・純粋関数の集合。DOM を触らず HTML 文字列を返すだけ（テストは戻り値で検証）。
   ・外部画像/フォント/ライブラリを一切使わない。背景は CSS レイヤー、
     感情エフェクトはインライン SVG、立ち絵は既存 px スプライトの拡大。
   ・物語データ（ノード内容）は読むだけで書き換えない。演出メタはこの層が持つ。
   ・全ての動的文字列は自前 esc2 で無害化。色は自前テーブル＋#RRGGBB 検証のみ通す。
   ・eval / new Function 禁止。480px / min44px / reduced-motion は CSS 側で担保。
   docs/story-architecture.md §1/§4 準拠。
   ============================================================ */
(function(){
  var G = (typeof window!=="undefined") ? window : globalThis;
  var S = G.SRStory = G.SRStory || {};

  function esc2(s){
    return String(s==null?"":s)
      .replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
      .replace(/"/g,"&quot;").replace(/'/g,"&#39;");
  }

  /* ============================================================
     1. 背景（location → シーンキー）
        章データの location 文字列を書き換えず、キーワードで背景を選ぶ。
        判定順が重要:「第七工場・主任室」は工場ではなく主任室。
     ============================================================ */
  var SCENES = ["office","bakery","factory","room","line","temple","field"];
  S.SV_SCENES = SCENES;

  S.sceneKeyOf = function(location){
    var s = (typeof location==="string") ? location : "";
    if(!s) return "field";
    if(s.indexOf("主任室")>=0 || s.indexOf("執務")>=0) return "room";
    if(s.indexOf("ライン")>=0 || s.indexOf("作業場")>=0) return "line";
    if(s.indexOf("工房")>=0 || s.indexOf("窯")>=0 || s.indexOf("パン")>=0) return "bakery";
    if(s.indexOf("神殿")>=0 || s.indexOf("法典")>=0 || s.indexOf("中央")>=0) return "temple";
    if(s.indexOf("事務所")>=0) return "office";
    if(s.indexOf("工場")>=0 || s.indexOf("工都")>=0 || s.indexOf("ベルガ")>=0) return "factory";
    if(s.indexOf("ロウム")>=0 || s.indexOf("辺境")>=0 || s.indexOf("街")>=0 || s.indexOf("町")>=0) return "town";
    return "field";
  };

  /* 背景レイヤー（空/遠景/近景/効果）。中身は CSS が描く＝画像ファイル無し */
  S.bgHtml = function(location){
    var k = S.sceneKeyOf(location);
    /* 場所が一目で分かるシルエット背景（canvas 画像）。無ければ従来のCSSレイヤーに退避。 */
    var img = (typeof G.sceneBg==="function") ? G.sceneBg(k) : "";
    if(img) return '<div class="sv-bg sv-scimg" style="background-image:url('+img+')" aria-hidden="true"></div>';
    return '<div class="sv-bg sv-sc-'+k+'" aria-hidden="true">'+
      '<i class="sv-l1"></i><i class="sv-l2"></i><i class="sv-l3"></i><i class="sv-l4"></i></div>';
  };

  /* 場所プレート（既存 .story-loc を継承。表示文字はそのまま esc） */
  S.locHtml = function(location){
    var s = (typeof location==="string") ? location : "";
    if(!s) return "";
    return '<div class="story-loc sv-loc"><span>'+esc2(s)+'</span></div>';
  };

  /* ============================================================
     2. キャラ色（話者名プレート/立ち絵の縁取り）
     ============================================================ */
  var COLORS = {
    narrator:"#6B6478", hero:"#5B8DFF", zen:"#8A6FD1", kai:"#E8484F",
    mina:"#2FB6A4", gard:"#C58900", rio:"#6E86A8", sera:"#FF8A3D",
    noa:"#3E9B4F", leon:"#B98A17", arisa:"#B06FD1", el:"#C9A227",
    yurius:"#6F7BD1", foreman:"#A45A2A", hanna:"#A05BD9", ren:"#4F8FBF",
    baker:"#C07A3A", worker:"#C05C86", dockman:"#5E7C8A", registrar:"#7E8A5E"
  };
  S.SV_COLORS = COLORS;
  var HEX = /^#[0-9A-Fa-f]{6}$/;
  S.speakerColor = function(id){
    var c = (id && Object.prototype.hasOwnProperty.call(COLORS, id)) ? COLORS[id] : "#6B6478";
    return HEX.test(c) ? c : "#6B6478";
  };

  /* ============================================================
     3. 表情（expression → クラス + インライン SVG のエフェクト）
     ============================================================ */
  var EX_MAP = {
    angry:"angry", rage:"angry", furious:"angry",
    shock:"shock", shake:"shock", surprise:"shock", surprised:"shock",
    sad:"sad", cry:"sad", grief:"sad",
    joy:"joy", smile:"joy", laugh:"joy", happy:"joy",
    wry:"wry", awkward:"wry", sweat:"wry",
    calm:"", normal:"", "":""
  };
  S.expressionKey = function(ex){
    var k = (typeof ex==="string") ? ex : "";
    return Object.prototype.hasOwnProperty.call(EX_MAP, k) ? EX_MAP[k] : "";
  };
  S.expressionClass = function(ex){
    var k = S.expressionKey(ex);
    return k ? ("sv-ex-"+k) : "";
  };

  function svg(inner){
    return '<svg class="sv-emo-svg" viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" focusable="false">'+inner+'</svg>';
  }
  var EMOTES = {
    /* 怒りマーク */
    angry: svg('<path d="M4 8 L10 4.5 L10 9.5 L16 5 L14 11 L20.5 9 L15 13 L20 17.5 L14 15.5 L16 21 L10 17 L10 22 L4.5 18 L7.5 13 Z" '+
      'fill="#E8484F" stroke="#7A1B20" stroke-width="1.3" stroke-linejoin="round"/>'),
    /* おどろき（！） */
    shock: svg('<path d="M12 1.8 L16 4 L14 14 L10 14 L8 4 Z" fill="#FFD34D" stroke="#5A4300" stroke-width="1.3" stroke-linejoin="round"/>'+
      '<circle cx="12" cy="19.2" r="2.7" fill="#FFD34D" stroke="#5A4300" stroke-width="1.3"/>'),
    /* 涙 */
    sad: svg('<path d="M12 2.5 C 17 10, 19 13, 19 16 A 7 7 0 0 1 5 16 C 5 13, 7 10, 12 2.5 Z" '+
      'fill="#9AC8FF" stroke="#1E5A7A" stroke-width="1.3"/>'),
    /* 汗 */
    wry: svg('<path d="M12 2.5 C 17 10, 19 13, 19 16 A 7 7 0 0 1 5 16 C 5 13, 7 10, 12 2.5 Z" '+
      'fill="#BEEBFF" stroke="#2C6C88" stroke-width="1.3"/>'),
    /* よろこび */
    joy: svg('<path d="M12 1.8 L14.6 9.2 L22.2 12 L14.6 14.8 L12 22.2 L9.4 14.8 L1.8 12 L9.4 9.2 Z" '+
      'fill="#FFE58A" stroke="#8A6B00" stroke-width="1.2" stroke-linejoin="round"/>')
  };
  S.emoteHtml = function(ex){
    var k = S.expressionKey(ex);
    if(!k || !EMOTES[k]) return "";
    return '<span class="sv-emote sv-emo-'+k+'">'+EMOTES[k]+'</span>';
  };

  /* ============================================================
     4. 立ち位置（roster）— 同じ場所にいる直近の登場人物を保持する純粋関数
        roster = { loc:"場所", ids:["kai","mina",…] }（先頭ほど直近）
        場所が変われば総入れ替え＝別の場面に前の人物が残らない。
     ============================================================ */
  S.SV_ROSTER_MAX = 3;
  S.emptyRoster = function(){ return { loc:"", ids:[] }; };
  S.pushRoster = function(roster, node){
    var loc = (node && typeof node.location==="string") ? node.location : "";
    var same = !!(roster && roster.loc===loc && Object.prototype.toString.call(roster.ids)==="[object Array]");
    var ids = same ? roster.ids.slice(0) : [];
    var sp = node && node.speaker;
    if(sp && sp!=="narrator" && typeof sp==="string"){
      var i = ids.indexOf(sp);
      if(i>=0) ids.splice(i,1);
      ids.unshift(sp);
    }
    if(ids.length > S.SV_ROSTER_MAX) ids.length = S.SV_ROSTER_MAX;
    return { loc:loc, ids:ids };
  };

  /* ============================================================
     5. 立ち絵ステージ
        faceOf(speakerId, size) は呼び出し側（renderer）が渡す描画関数。
        （px スプライトの有無/主人公の見た目差し替えは renderer 側の責務）
     ============================================================ */
  function figHtml(id, active, ex, faceOf, nameOf){
    var cls = "sv-fig " + (active ? "sv-active" : "sv-side");
    var exc = active ? S.expressionClass(ex) : "";
    if(exc) cls += " " + exc;
    var size = active ? 118 : 62;
    var body = "";
    try{ body = faceOf(id, size) || ""; }catch(e){ body = ""; }
    var nm = "";
    try{ nm = nameOf ? (nameOf(id)||"") : ""; }catch(e2){ nm = ""; }
    return '<div class="'+cls+'" data-sp="'+esc2(id)+'" style="--sv-c:'+S.speakerColor(id)+'"'+
      (nm ? ' title="'+esc2(nm)+'"' : '')+'>'+
      '<span class="sv-glow" aria-hidden="true"></span>'+
      '<span class="sv-body">'+body+'</span>'+
      (active ? S.emoteHtml(ex) : '')+
      '<span class="sv-stand" aria-hidden="true"></span>'+
      '</div>';
  }

  /* node: 現在のノード / roster: pushRoster の戻り / faceOf,nameOf: 描画・名前解決 */
  S.stageHtml = function(node, roster, faceOf, nameOf){
    var sp = (node && typeof node.speaker==="string") ? node.speaker : "";
    var active = (sp && sp!=="narrator") ? sp : "";
    var ex = node && node.expression;
    var ids = (roster && Object.prototype.toString.call(roster.ids)==="[object Array]") ? roster.ids : [];
    var sides = [], i;
    for(i=0;i<ids.length && sides.length<2;i++){ if(ids[i]!==active) sides.push(ids[i]); }
    var out = ['<div class="sv-stage'+(active?"":" sv-narration")+'" aria-hidden="true">'];
    out.push('<div class="sv-slot sv-slot-l">'+(sides[0]?figHtml(sides[0],false,"",faceOf,nameOf):"")+'</div>');
    out.push('<div class="sv-slot sv-slot-c">'+(active?figHtml(active,true,ex,faceOf,nameOf):"")+'</div>');
    out.push('<div class="sv-slot sv-slot-r">'+(sides[1]?figHtml(sides[1],false,"",faceOf,nameOf):"")+'</div>');
    out.push('</div>');
    return out.join("");
  };

  /* ============================================================
     6. 話者名プレート（キャラ色の枠。台詞ボックスとは分離して見せる）
     ============================================================ */
  S.plateHtml = function(name, speakerId){
    if(!name) return '<div class="sn" aria-hidden="true"></div>';
    return '<div class="sn sv-plate" style="--sv-c:'+S.speakerColor(speakerId)+'">'+esc2(name)+'</div>';
  };

  /* 名前空間まとめ（テスト/他レイヤーからの参照用） */
  S.visuals = {
    sceneKeyOf:S.sceneKeyOf, bgHtml:S.bgHtml, locHtml:S.locHtml,
    speakerColor:S.speakerColor, expressionKey:S.expressionKey,
    expressionClass:S.expressionClass, emoteHtml:S.emoteHtml,
    emptyRoster:S.emptyRoster, pushRoster:S.pushRoster,
    stageHtml:S.stageHtml, plateHtml:S.plateHtml
  };
})();
