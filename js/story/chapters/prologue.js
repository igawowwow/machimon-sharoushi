"use strict";
/* ============================================================
   story/chapters/prologue.js — 序章「灰色の朝」（データ駆動ノードグラフ）
   docs/story-bible.md 序章 / R4 スライス要件に忠実。台詞・対立で世界を見せる。
   ・eval/new Function ゼロ。全ノードはデータのみ（next は文字列 or {then,else}）。
   ・辺境の事務所→登録試験→初めての労務相談→パン工房の残業問題
     →証拠集め(=既存演習 encounter)→経営者にも事情→最初の選択(思想値)
     →カイ加入→師匠ゼン失踪→中央法典の欠片発見、まで一本で到達可能。
   ・証拠 ev_*、思想値 ideologyChanges、フラグ flags、好感度 relationshipChanges を実データで。
   ・chapterId="prologue"。SRStory.register で登録。旧UIは無傷（自動起動しない・データ登録のみ）。
   ============================================================ */
(function(){
  var G = (typeof window!=="undefined") ? window : globalThis;
  var S = G.SRStory;
  if(!S || typeof S.register!=="function") return;   /* エンジン未ロードでも安全 */

  /* 序章専用の話者を表示名テーブルへ追記（描画層があれば。無ければ素通し） */
  if(S.SPEAKERS && typeof S.SPEAKERS==="object"){
    if(!S.SPEAKERS.baker)     S.SPEAKERS.baker     = { name:"店主 ダン", px:"foreman" };
    if(!S.SPEAKERS.worker)    S.SPEAKERS.worker    = { name:"従業員 ハル", px:"ren" };
    if(!S.SPEAKERS.registrar) S.SPEAKERS.registrar = { name:"登録官", px:"zen" };
  }

  var OFFICE = "辺境ロウム・調律事務所";
  var BAKERY = "パン工房「灰かぶりの窯」";

  /* 登録試験・証拠集めは既存の演習（労基の基礎○×等）へ接続する encounter。
     kind/subject/label は描画側の橋（R5）が start* へ委譲する際に解釈。isExam:false=道具/回復有効。 */
  function enc(subject, label){ return { kind:"train", subject:subject, need:3, isExam:false, label:label }; }

  var NODES = [
    /* ---- A. 辺境の事務所（灰色の朝／師匠ゼン／主人公の初期思想） ---- */
    { id:"p_open", start:true, type:"dialogue", speaker:"narrator", location:OFFICE, bgmScene:"field",
      text:"灰色の朝だった。", next:"p_open2" },
    { id:"p_open2", type:"dialogue", speaker:"narrator", location:OFFICE,
      text:"十二年前、中央法典が砕けた「灰色革命」の日から、この国の空の色は戻っていない。", next:"p_zen1" },
    { id:"p_zen1", type:"dialogue", speaker:"zen", location:OFFICE, portrait:"zen",
      text:"よう、見習い。まだ寝ぼけた顔してんな。", next:"p_zen2" },
    { id:"p_zen2", type:"dialogue", speaker:"zen", location:OFFICE,
      text:"今日でお前は「労務調律師」だ。……なれるかは、知らねぇけど。", next:"p_hero1" },
    { id:"p_hero1", type:"dialogue", speaker:"hero", location:OFFICE,
      text:"（法律違反は、すべて悪だ。守れば、みんな救える。おれはそう信じてる。）",
      next:"p_zen3", flags:{ p_prologue_started:1 }, questUpdate:{ qid:"q_prologue", state:"active", step:0 } },
    { id:"p_zen3", type:"dialogue", speaker:"zen", location:OFFICE, expression:"wry",
      text:"条文を読むな。条文が、誰の痛みから生まれたかを読め。……まあ、そのうち分かる。飲むか?", next:"p_hero2" },
    { id:"p_hero2", type:"dialogue", speaker:"hero", location:OFFICE,
      text:"朝から飲まないでください、師匠。", next:"p_reg1" },

    /* ---- B. 登録試験（＝最初の演習。すぐ本題へ） ---- */
    { id:"p_reg1", type:"dialogue", speaker:"registrar", location:OFFICE, bgmScene:"emotion",
      text:"調律師登録試験を始めます。労働基準法の基礎から。落ち着いて答えなさい。", next:"p_exam" },
    { id:"p_exam", type:"encounter", speaker:"registrar", location:OFFICE,
      text:"最初の問い。おれの知識を、試験が試す。",
      encounter: enc(0, "調律師登録試験"), reward:{ xp:20 }, flags:{ p_exam_done:1 }, next:"p_reg2" },
    { id:"p_reg2", type:"dialogue", speaker:"registrar", location:OFFICE,
      text:"――登録を認めます。あなたは今日から、調律師だ。", next:"p_zen4", flags:{ p_registered:1 } },
    { id:"p_zen4", type:"dialogue", speaker:"zen", location:OFFICE,
      text:"登録おめでとう、とは言わねぇ。試験は暗記だ。仕事は……暗記じゃねぇからな。", next:"p_case1" },

    /* ---- C. 事件発生（開始まもなく）：パン工房の残業問題 ---- */
    { id:"p_case1", type:"dialogue", speaker:"narrator", location:OFFICE, bgmScene:"emotion", expression:"shock",
      text:"事務所のドアが、蹴破られるように開いた。", next:"p_kai1" },
    { id:"p_kai1", type:"dialogue", speaker:"kai", location:OFFICE, portrait:"kai", expression:"angry",
      text:"調律師だな。頼む、来てくれ。あの店、毎晩灯りが消えねぇ。……昨日、店の裏で、ハルさんが立ったまま気を失ってたんだ。", next:"p_heroask" },
    { id:"p_heroask", type:"dialogue", speaker:"hero", location:OFFICE,
      text:"落ち着いて。……何があった?", next:"p_worker1" },
    { id:"p_worker1", type:"dialogue", speaker:"worker", location:OFFICE,
      text:"……わたしのことです。パン工房のパートです。すみません、大ごとに、したくなかったんですけど。", next:"p_worker2" },
    { id:"p_worker2", type:"dialogue", speaker:"worker", location:OFFICE,
      text:"タイムカードを押してから、また作業場に戻るんです。閉店のあと二時間、三時間。仕込みの持ち帰りもあって……でも明細には、一分も、ついていなくて。", next:"p_kai2" },
    { id:"p_kai2", type:"dialogue", speaker:"kai", location:OFFICE, expression:"angry",
      text:"打刻させた後に働かせて、時間ごと消してるんだ。立派な未払いだろ。社長を、突き出せばいい。",
      next:"p_herothink", relationshipChanges:{ cp0:1 } },
    { id:"p_herothink", type:"dialogue", speaker:"hero", location:OFFICE,
      text:"（経営者は、全員悪だ。カイの言う通りだ。……本当に、そうか?）", next:"p_choice1" },

    /* ---- D. 最初の分かれ道（労働者側の主張だけ信じると誤る） ---- */
    { id:"p_choice1", type:"choice", speaker:"hero", location:OFFICE, text:"どうする?",
      choices:[
        { text:"カイに同意し、店主をその場で糾弾する",
          ideologyChanges:{ human:1, mgmt:-1 }, flags:{ p_path_accuse:1 }, next:"p_accuse" },
        { text:"断じる前に、事実と証拠を確かめる",
          ideologyChanges:{ law:1, indep:1 }, flags:{ p_path_check:1 }, next:"p_check" }
      ]},
    { id:"p_accuse", type:"dialogue", speaker:"hero", location:OFFICE,
      text:"店主さん。あなたは法律違反だ。未払いの残業代を、今すぐ全額払うべきだ。", next:"p_accuse2" },
    { id:"p_accuse2", type:"dialogue", speaker:"baker", location:OFFICE, expression:"shock",
      text:"証拠は? タイムカードも、契約書も見ずに……あなたは何を根拠に、私を裁くんですか。", next:"p_accuse3" },
    { id:"p_accuse3", type:"dialogue", speaker:"zen", location:OFFICE, expression:"angry",
      text:"――そこまでだ、見習い。正しさで人を殴るな。お前はまだ、何が起きたかを一つも知らねぇ。",
      next:"p_lesson", ideologyChanges:{ law:-1 } },
    { id:"p_check", type:"dialogue", speaker:"hero", location:OFFICE,
      text:"断じる前に、確かめます。タイムカード、契約、本人の話――全部。", next:"p_check2" },
    { id:"p_check2", type:"dialogue", speaker:"zen", location:OFFICE,
      text:"……ほう。いい判断だ。正義ってやつは、証拠の上にしか立てねぇ。",
      next:"p_lesson", relationshipChanges:{ cp0:1 } },

    /* ---- E. 師匠の教え → 証拠集め（＝演習で証拠獲得） ---- */
    { id:"p_lesson", type:"dialogue", speaker:"zen", location:OFFICE,
      text:"調律師の仕事は、暗記した条文をぶつけることじゃねぇ。歪みを見つけ、事実を並べ、法を読み、間に立つことだ。", next:"p_lesson2" },
    { id:"p_lesson2", type:"dialogue", speaker:"zen", location:OFFICE,
      text:"行け。証拠を集めてこい。……おれは、留守番だ。", next:"p_evintro",
      questUpdate:{ qid:"q_prologue", state:"active", step:1 } },
    { id:"p_evintro", type:"dialogue", speaker:"narrator", location:BAKERY, bgmScene:"field",
      text:"パン工房「灰かぶりの窯」。午前四時、店の窓だけが白く灯っていた。粉の匂いに、汗と焦げた砂糖の匂いが混じる。", next:"p_enc_time" },

    { id:"p_enc_time", type:"encounter", speaker:"hero", location:BAKERY,
      text:"まずはタイムカード。ただし、打刻が真実とは限らない。「使用者の指揮命令下にある時間」が労働時間だ。記録の外の時間を、読み解く。",
      encounter: enc(0, "タイムカードを読む"), evidence:"ev_timecard", next:"p_ev_time2" },
    { id:"p_ev_time2", type:"evidence", speaker:"narrator", location:BAKERY, evidence:"ev_timecard",
      text:"打刻は綺麗に定時で並んでいた。――だがゴミ箱の奥から、書き直される前の日報が出てきた。本当の退勤は、毎晩二時間あと。記録は、作られていた。", next:"p_enc_contract" },

    { id:"p_enc_contract", type:"encounter", speaker:"hero", location:BAKERY,
      text:"次は雇用契約書。約束された条件を確かめる。",
      encounter: enc(0, "雇用契約書を確かめる"), evidence:"ev_contract", next:"p_ev_contract2" },
    { id:"p_ev_contract2", type:"dialogue", speaker:"worker", location:BAKERY,
      text:"契約書は、一日六時間。実際は倍近く。……残業が月八十時間を超えた月も、あったと思います。途中から、数えるのを、やめました。", next:"p_enc_testimony" },

    { id:"p_enc_testimony", type:"encounter", speaker:"hero", location:BAKERY,
      text:"最後は、本人の証言。記録から消された時間は、本人の体だけが覚えている。",
      encounter: enc(0, "本人の証言を聞く"), evidence:"ev_testimony", next:"p_reason" },

    /* ---- F. 推理（三つの証拠を組み合わせて仮説） ---- */
    { id:"p_reason", type:"reasoning", speaker:"hero", location:BAKERY, bgmScene:"emotion",
      text:"三つの証拠が、一つの絵を描く。作り直された打刻、破られた契約、擦り切れた本人。――残業は事実で、賃金は未払い。そして体は、とっくに限界だった。",
      reasoning:{ need:["ev_timecard","ev_contract","ev_testimony"] },
      flags:{ p_reasoned:1 }, next:"p_baker2",
      questUpdate:{ qid:"q_prologue", state:"active", step:2 } },

    /* ---- G. 経営者にも事情がある（多面性） ---- */
    { id:"p_baker2", type:"dialogue", speaker:"baker", location:BAKERY,
      text:"……全部、本当です。払っていない。でも、聞いてください。", next:"p_baker3" },
    { id:"p_baker3", type:"dialogue", speaker:"baker", location:BAKERY,
      text:"この工房、来月には畳むかもしれない。大手のパンに押されて、注文が半分になった。", next:"p_baker4" },
    { id:"p_baker4", type:"dialogue", speaker:"baker", location:BAKERY,
      text:"私も昔は、雇われの職人だった。この子たちを路頭に迷わせたくない一心で……気づけば、無理をさせていた。", next:"p_worker3" },
    { id:"p_worker3", type:"dialogue", speaker:"worker", location:BAKERY,
      text:"店長を責めたいわけじゃ、ないんです。ただ、時給のままじゃ家賃が払えなくて。……言えば、シフトを減らされる気がして。倒れるまで、言い出せませんでした。", next:"p_heroshift" },
    { id:"p_heroshift", type:"dialogue", speaker:"hero", location:BAKERY,
      text:"（経営者は全員悪――そう思っていた。でも、この人も、追い詰められた一人だ。）",
      next:"p_kai3", ideologyChanges:{ mgmt:1 }, flags:{ p_saw_both_sides:1 } },
    { id:"p_kai3", type:"dialogue", speaker:"kai", location:BAKERY,
      text:"……だからって、未払いが許されるわけじゃねぇ。けど……そうか。単純な、悪じゃ、ねぇのか。",
      next:"p_negotiate", relationshipChanges:{ cp0:1 } },

    /* ---- H. 交渉（正しい法的論点＝割増賃金の支払義務） ---- */
    { id:"p_negotiate", type:"negotiation", speaker:"hero", location:BAKERY,
      text:"未払いの残業代は、支払う。労基法は、時間外労働に割増賃金の支払いを義務づけている。その上で、工房を潰さない道を探す。",
      negotiation:{ answer:"warimashi", options:["無給でよい","warimashi","時間外は自由"] },
      next:"p_choice2" },

    /* ---- I. 最初の選択（思想値に効く本選択） ---- */
    { id:"p_choice2", type:"choice", speaker:"hero", location:BAKERY, text:"どう、間に立つ?",
      choices:[
        { text:"法に厳格に。未払い分を即時、全額請求する",
          ideologyChanges:{ law:1, mgmt:-1 }, flags:{ p_chose_strict:1 }, next:"p_resolve" },
        { text:"支払いを約束させ、分割と是正計画で工房も守る",
          ideologyChanges:{ mgmt:1, fair:1, indep:1 }, flags:{ p_chose_balance:1 }, next:"p_resolve" },
        { text:"労働者を最優先。会社の都合は、考えない",
          ideologyChanges:{ human:1, relief:1 }, flags:{ p_chose_relief:1 }, next:"p_resolve" }
      ]},

    /* ---- J. 解決 → カイ加入 ---- */
    { id:"p_resolve", type:"dialogue", speaker:"narrator", location:BAKERY, bgmScene:"field",
      text:"店主は帳簿を開き、書き直す前の日報から時間を復元して、未払い分を支払うことに同意した。カイの肩の力が、少しだけ抜けた。",
      next:"p_worker4", flags:{ p_case_resolved:1 } },
    { id:"p_worker4", type:"dialogue", speaker:"worker", location:BAKERY,
      text:"ありがとう、ございます。……『言ったら、ここに居られなくなる』って、ずっと思ってました。", next:"p_kaijoin" },
    { id:"p_kaijoin", type:"dialogue", speaker:"kai", location:BAKERY,
      text:"なあ、調律師。あんた、労働者の味方かと思ったら、社長の話まで聞きやがった。", next:"p_kaijoin2" },
    { id:"p_kaijoin2", type:"dialogue", speaker:"kai", location:BAKERY,
      text:"……気に入らねぇ。けど、そういう奴の隣にいた方が、何かが見えそうだ。おれも行く。",
      next:"p_herojoin", flags:{ p_join_kai:1 }, relationshipChanges:{ cp0:5 },
      questUpdate:{ qid:"q_prologue", state:"active", step:3 } },
    { id:"p_herojoin", type:"dialogue", speaker:"hero", location:BAKERY,
      text:"カイ。……よろしく。", next:"p_return" },

    /* ---- K. 師匠ゼン失踪 ---- */
    { id:"p_return", type:"dialogue", speaker:"narrator", location:OFFICE, bgmScene:"emotion",
      text:"事務所に戻ると、灯りは消えていた。ゼンが、いない。", next:"p_note" },
    { id:"p_note", type:"dialogue", speaker:"zen", location:OFFICE,
      text:"机に、走り書きの紙。「先に行く。留守は任せた。――ゼン」",
      next:"p_note2", flags:{ p_zen_missing:1 } },
    { id:"p_note2", type:"dialogue", speaker:"zen", location:OFFICE,
      text:"「条文が、誰の痛みから生まれたか。お前はもう、読み始めてる。」", next:"p_kaireturn" },
    { id:"p_kaireturn", type:"dialogue", speaker:"kai", location:OFFICE,
      text:"あんたの師匠、変わり者だな。……どこ行った?", next:"p_shard" },

    /* ---- L. 中央法典の欠片発見 ---- */
    { id:"p_shard", type:"evidence", speaker:"narrator", location:OFFICE, expression:"shock",
      text:"ゼンの机の引き出しに、灰色の石片が一つ。触れると、微かに脈打つように熱を持っていた。",
      evidence:"ev_codex_shard", flags:{ p_codex_shard:1 }, next:"p_shard2" },
    { id:"p_shard2", type:"dialogue", speaker:"hero", location:OFFICE,
      text:"（これは……中央法典の、欠片? 十二年前に砕けた、あの法典の。）", next:"p_kaishard" },
    { id:"p_kaishard", type:"dialogue", speaker:"kai", location:OFFICE,
      text:"なんだよ、それ。……嫌な感じがする。持ってくのか?", next:"p_final" },
    { id:"p_final", type:"dialogue", speaker:"narrator", location:OFFICE, bgmScene:"field",
      text:"灰色の朝が、明けていく。労務調律師の旅は、まだ始まったばかりだ。",
      next:null, flags:{ p_prologue_done:1 },
      questUpdate:{ qid:"q_prologue", state:"done", step:4 } }
  ];

  /* 序章クエスト定義（doneFlag で完了判定） */
  if(typeof S.registerQuest==="function"){
    S.registerQuest("q_prologue", {
      title:"灰かぶりの窯",
      chapter:"prologue",
      steps:["登録試験","証拠を集める","真相を推理","解決とカイ加入","中央法典の欠片"],
      doneFlag:"p_prologue_done"
    });
  }

  S.register("prologue", NODES);
  S.PROLOGUE_ID = "prologue";
})();
