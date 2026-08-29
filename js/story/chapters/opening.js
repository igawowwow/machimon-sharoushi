"use strict";
/* ============================================================
   story/chapters/opening.js — E2(B): オープニング映像（データ駆動ノードグラフ）
   docs/story-bible.md 準拠。12年前「灰色革命」を会話と映像で見せる（説明しすぎない）。
   ・巨大な中央法典 → 老人ゼンと総裁ユリウスの対峙 → 二つの台詞 → 法典破壊 →
     九つの欠片が飛散 → 暗転 → 「十二年後」→ 辺境の小さな労務事務所で主人公が床を掃除。
   ・スキップ可（描画層の「閉じる」）／回想から再閲覧可（srqReplayOpening）。
   ・eval/new Function ゼロ。全ノードはデータのみ（next は文字列 or null）。
   ・主人公名は SPEAKERS.hero.name（applyChar 反映）で話者名に出る＝台詞へ名前を直接埋めない。
   ・chapterId="opening"。SRStory.register で登録。旧UIは無傷（自動起動しない・データ登録のみ）。
   ============================================================ */
(function(){
  var G = (typeof window!=="undefined") ? window : globalThis;
  var S = G.SRStory;
  if(!S || typeof S.register!=="function") return;   /* エンジン未ロードでも安全 */

  var SKY   = "中央神殿・十二年前";
  var OFFICE = "辺境ロウム・調律事務所";

  var NODES = [
    /* ---- A. 十二年前・浮かぶ中央法典 ---- */
    { id:"o_open", start:true, type:"cutscene", speaker:"narrator", location:SKY, bgmScene:"emotion",
      expression:"shock",
      text:"十二年前。", next:"o_2", flags:{ opening_started:1 } },
    { id:"o_2", type:"cutscene", speaker:"narrator", location:SKY,
      text:"国の中央に、一冊の書が浮かんでいた。すべての言葉を束ねる――中央法典。", next:"o_3" },
    { id:"o_3", type:"cutscene", speaker:"narrator", location:SKY,
      text:"その前で、二人が対峙している。老いた調律師と、若き総裁。", next:"o_yur1" },

    /* ---- B. ゼン vs ユリウス（主題の二つの台詞） ---- */
    { id:"o_yur1", type:"dialogue", speaker:"yurius", location:SKY, portrait:"yurius",
      text:"例外を認めれば、法は法でなくなる。", next:"o_zen1" },
    { id:"o_zen1", type:"dialogue", speaker:"zen", location:SKY, portrait:"zen",
      text:"例外を認めなければ、人は人でなくなる。", next:"o_yur2" },
    { id:"o_yur2", type:"dialogue", speaker:"yurius", location:SKY, expression:"angry",
      text:"……ゼン。その手を、法典から離せ。何をするつもりだ。", next:"o_zen2" },
    { id:"o_zen2", type:"dialogue", speaker:"zen", location:SKY, expression:"wry",
      text:"悪いな、ユリウス。こいつは一度、砕けた方がいい。……そうしなきゃ、みんな読むのをやめちまう。", next:"o_break1" },

    /* ---- C. 法典破壊 → 九つの欠片 → 暗転 ---- */
    { id:"o_break1", type:"cutscene", speaker:"narrator", location:SKY, bgmScene:"boss",
      expression:"shock",
      text:"ゼンの手が、法典に触れた。", next:"o_break2" },
    { id:"o_break2", type:"cutscene", speaker:"narrator", location:SKY, expression:"shake",
      text:"光が弾けた。中央法典は砕け、九つの欠片となって、九つの領域へ飛び散っていった。", next:"o_break3",
      flags:{ opening_shatter:1 } },
    { id:"o_break3", type:"cutscene", speaker:"yurius", location:SKY, expression:"shock",
      text:"――なんてことを。この国は、言葉を、失った。", next:"o_gray" },
    { id:"o_gray", type:"cutscene", speaker:"narrator", location:SKY,
      text:"その日から、この国の空は、灰色になった。人はそれを「灰色革命」と呼んだ。", next:"o_black" },
    { id:"o_black", type:"cutscene", speaker:"narrator", location:SKY, bgmScene:"field",
      text:"――暗転。", next:"o_after1" },

    /* ---- D. 十二年後・辺境の小さな事務所（床を掃く主人公） ---- */
    { id:"o_after1", type:"cutscene", speaker:"narrator", location:OFFICE, bgmScene:"field",
      text:"十二年後。", next:"o_after2" },
    { id:"o_after2", type:"cutscene", speaker:"narrator", location:OFFICE,
      text:"辺境の、小さな労務事務所。ほうきの音だけが、乾いた床に響いている。", next:"o_hero1" },
    { id:"o_hero1", type:"dialogue", speaker:"hero", location:OFFICE,
      text:"（灰色の朝だ。……相変わらず、なんにも始まらない。）", next:"o_hero2" },
    { id:"o_hero2", type:"dialogue", speaker:"hero", location:OFFICE,
      text:"（でも今日から、おれは労務調律師になる。……なれるかは、知らないけど。）", next:"o_end" },

    /* ---- E. 終端 → 既読フラグ。onChapterEnd で序章へ接続（JS 側） ---- */
    { id:"o_end", type:"cutscene", speaker:"narrator", location:OFFICE, bgmScene:"emotion",
      text:"その時、事務所の扉が、開く音がした。――旅が、始まる。",
      next:null, flags:{ opening_seen:1 } }
  ];

  S.register("opening", NODES);
  S.OPENING_ID = "opening";
})();
