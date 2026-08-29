"use strict";
/* ============================================================
   story/chapters/chapter-01b.js — 第一章「鐘の鳴らない工都」第4〜6話
   docs/story-bible.md 第1章（工都ベルガ・労基/安衛）の続き。話1-3(chapter-01.js)の
   末尾 c1_final / c1_ep3_done から地続きの三話を、別 chapterId="ch01b" で綴じ込む。
   ・第4話「名ばかりの札」…管理監督者性・割増（労基=subject0）／小ボス 名ばかり将軍ノクティス
   ・第5話「盗まれた時間」…労働時間の改ざん・36協定（労基=subject0）／小ボス 刻印のヴァルト
                            ＋過去問(examFmt=五肢択一/個数 労基)を必ず含む
   ・第6話「鳴らない警報」…安全衛生管理体制(産業医・衛生委員会・健診)と報告義務
     （安衛=subject1）／小ボス 無音の警鐘ヴェイル。レンの異変に誰も気づけなかった理由を暴く
   ・各話: 導入→事件→カイ(なぜ戦うか)→○×演習→過去問演習(examFmt)→証拠→小ボス戦(ブリーフィング)
           →【経営者の事情】→小結末→次話への引き。断定せず問いを残す(ENDING-CANON)。
   ・chapter-01.js の話1-3ノード/quest/ID/証拠/分岐は一切改変しない（別ファイル・別章）。
   ・戦闘接続は既存の橋（story-encounter / story-battle-bridge）。encounter に villain と
     exam(examFmt 混入数)を持たせるだけで、採点・SRS・報酬・問題データには一切触れない。
   ・eval/new Function ゼロ。全ノードはデータのみ（next は文字列 or {then,else} or null）。
   ============================================================ */
(function(){
  var G = (typeof window!=="undefined") ? window : globalThis;
  var S = G.SRStory;
  if(!S || typeof S.register!=="function") return;   /* エンジン未ロードでも安全 */

  /* 第4〜6話の話者を表示名テーブルへ追記（描画層があれば。無ければ素通し） */
  if(S.SPEAKERS && typeof S.SPEAKERS==="object"){
    if(!S.SPEAKERS.foreman) S.SPEAKERS.foreman = { name:"工場長 ゴードン", px:"foreman" };
    if(!S.SPEAKERS.tobi)    S.SPEAKERS.tobi    = { name:"班長 トビ",       px:"ren" };
    if(!S.SPEAKERS.sora)    S.SPEAKERS.sora    = { name:"配札係 ソラ",     px:"sora" };
  }

  var BERGA  = "工都ベルガ・第七工場";
  var BADGE  = "第七工場・配札所";
  var REC    = "第七工場・記録棚";
  var LINE3  = "第七工場・第三ライン";

  /* 演習 encounter。opts で小ボス(villain)と過去問混入数(exam=examFmt の最低本数)を指定できる。
     kind/subject/label は既存の橋が start*（旧UIバトル）へ委譲する際に解釈。isExam:false=道具/回復有効。
     villain を渡すと story-encounter が「誰と・何の不正で・なぜ戦うか」のブリーフィングを出す。
     exam を渡すと applyStoryLoadout が examFmt（五肢択一/個数=過去問）を必ずその本数だけ混ぜる。 */
  function enc(subject, label, opts){
    var e = { kind:"train", subject:subject, need:3, isExam:false, label:label };
    if(opts){
      if(opts.villain) e.villain = opts.villain;
      if(typeof opts.exam==="number") e.exam = opts.exam;
      if(typeof opts.n==="number") e.n = opts.n;
    }
    return e;
  }

  var NODES = [
    /* ============================================================
       第4話「名ばかりの札」
       管理監督者の肩書だけ与え残業代を消す不正（労基）。小ボス=名ばかり将軍ノクティス。
       ============================================================ */
    { id:"c1_ep4_open", start:true, type:"dialogue", speaker:"narrator", location:BADGE, bgmScene:"field",
      text:"レンは、まだ目を覚まさない。夜が明けても、工場の煙は止まらなかった。",
      next:"c1_ep4_intro", flags:{ c1_ep4_start:1 },
      questUpdate:{ qid:"q_ch01b", state:"active", step:0 } },
    { id:"c1_ep4_intro", type:"dialogue", speaker:"narrator", location:BADGE,
      text:"『配札所』の壁一面に、真新しい木札。『第一ライン班長』『梱包主任』『夜間監督補佐』――働く者のほとんどが、何かの『長』だった。", next:"c1_ep4_sora" },
    { id:"c1_ep4_sora", type:"dialogue", speaker:"sora", location:BADGE, portrait:"sora",
      text:"配札係のソラです。みんなに役職を。誇らしいでしょう? ……役職者に、残業代は要りませんから。", next:"c1_ep4_tobi" },
    { id:"c1_ep4_tobi", type:"dialogue", speaker:"tobi", location:BADGE, portrait:"ren",
      text:"班長の札、もらいました。でも仕事は前と同じ。手当は月にわずかで、消えた残業代はその十倍。……給料は、減ったんです。", next:"c1_ep4_hero1" },
    { id:"c1_ep4_hero1", type:"dialogue", speaker:"hero", location:BADGE,
      text:"（残業代の要らない管理監督者。だがそれは、肩書きではなく実態で決まる。……札で、実態を覆い隠している。）", next:"c1_ep4_kai1" },
    { id:"c1_ep4_kai1", type:"dialogue", speaker:"kai", location:BADGE, expression:"angry",
      text:"札一枚で残業代を消すのか。トビたちは『長』じゃねぇ。ただの、働く人間だ。", next:"c1_ep4_choice" },

    { id:"c1_ep4_choice", type:"choice", speaker:"hero", location:BADGE, text:"どこから崩す?",
      choices:[
        { text:"配られた札の実態から、一枚ずつ剥がす",
          ideologyChanges:{ law:1, fair:1 }, flags:{ c1_ep4_path_real:1 }, next:"c1_ep4_probe" },
        { text:"札を配る仕組みそのものを断つ",
          ideologyChanges:{ human:1, indep:1 }, flags:{ c1_ep4_path_source:1 }, next:"c1_ep4_source" }
      ]},
    { id:"c1_ep4_source", type:"dialogue", speaker:"hero", location:BADGE,
      text:"札を配っているのは末端じゃない。上で誰かが設計している。……だがまず、目の前の一枚を崩す。", next:"c1_ep4_probe" },

    { id:"c1_ep4_probe", type:"dialogue", speaker:"narrator", location:BADGE, bgmScene:"field",
      text:"組織図、給与明細、勤務表。トビの『班長』が名ばかりかを、実態から確かめる。",
      next:"c1_ep4_enc1", questUpdate:{ qid:"q_ch01b", state:"active", step:1 } },
    { id:"c1_ep4_enc1", type:"encounter", speaker:"hero", location:BADGE,
      text:"人事権も、出退勤の自由も、待遇の優越もない。そのどれかが欠ければ、管理監督者ではない。",
      encounter: enc(0, "班長の実態を判定する", { villain:"v_baron", exam:1 }),
      evidence:"ev_ch1b_badges", next:"c1_ep4_ev1" },
    { id:"c1_ep4_ev1", type:"dialogue", speaker:"tobi", location:BADGE,
      text:"人を採る権限も、辞めさせる権限もない。手当は月に少し。……おれ、『長』じゃなかったんですね。", next:"c1_ep4_enc2" },
    { id:"c1_ep4_enc2", type:"encounter", speaker:"hero", location:BADGE, bgmScene:"emotion",
      text:"奥から、また勲章の音。主任室で札を剥がされた将――名ばかり将軍ノクティスが、本丸の配札所で待ち構えていた。今度は、版木ごと暴く。",
      encounter: enc(0, "過去問｜管理監督者性を五肢で問う", { villain:"v_lt_noct", exam:2 }),
      evidence:"ev_ch1b_noct", next:"c1_ep4_ev2" },
    { id:"c1_ep4_ev2", type:"dialogue", speaker:"narrator", location:BADGE,
      text:"ノクティスは札を一枚、また一枚と取り落とした。残ったのは、肩書きを剥がされた、ただの働く人々だった。", next:"c1_ep4_reason" },
    { id:"c1_ep4_reason", type:"reasoning", speaker:"hero", location:BADGE, bgmScene:"emotion",
      text:"人事権なし、出退勤は拘束、待遇はわずか。――トビは管理監督者に当たらない。消された割増賃金は、支払われるべきものだ。",
      reasoning:{ need:["ev_ch1b_badges","ev_ch1b_noct"] },
      flags:{ c1_ep4_reasoned:1 }, next:"c1_ep4_biz" },

    /* 【経営者の事情】断定せず、葛藤の芽を置く */
    { id:"c1_ep4_biz", type:"dialogue", speaker:"foreman", location:BADGE,
      text:"……札を配れと言ったのは私だ。残業代を全部払えば、来月には工場が畳まれる。この街の家族が、路頭に迷う。それでも間違いか?", next:"c1_ep4_hero2" },
    { id:"c1_ep4_hero2", type:"dialogue", speaker:"hero", location:BADGE,
      text:"（違法だ。それは動かない。……だが、この人が守ろうとしたものも嘘じゃない。正すことと潰すことは、同じじゃない。）",
      next:"c1_ep4_end", ideologyChanges:{ mgmt:1 }, flags:{ c1_ep4_saw_sides:1 } },
    { id:"c1_ep4_end", type:"dialogue", speaker:"narrator", location:BADGE, bgmScene:"field",
      text:"名ばかりの札は剥がれた。だが札を刷る版木は、まだどこかにある。歪みは、もっと上にあった。",
      next:"c1_ep4_hook", flags:{ c1_ep4_done:1 }, questUpdate:{ qid:"q_ch01b", state:"active", step:2 } },
    { id:"c1_ep4_hook", type:"dialogue", speaker:"tobi", location:BADGE,
      text:"……調律師さん。おれ、班長になってから、深夜にみんなの打刻を『直す』仕事を任されてて。……レンの分も、直しました。", next:"c1_ep5_open" },

    /* ============================================================
       第5話「盗まれた時間」
       タイムカード改ざんの黒幕。労働時間の把握・36協定（労基）。小ボス=刻印のヴァルト。
       過去問(examFmt=五肢択一 労基)を必ず1問以上出す。
       ============================================================ */
    { id:"c1_ep5_open", type:"dialogue", speaker:"narrator", location:REC, bgmScene:"field",
      text:"記録棚の最奥。夜ごと打刻を『直す』作業――その指示は、一枚の刻印つきの帳面から降りていた。",
      next:"c1_ep5_scene", flags:{ c1_ep5_start:1 } },
    { id:"c1_ep5_scene", type:"dialogue", speaker:"tobi", location:REC, portrait:"ren",
      text:"この帳面のとおりに、消したり、書き換えたり。書き換えが増えるのは、決まって監督署が来ると噂の月でした。……逆らえば、札を取り上げられる。", next:"c1_ep5_hero1" },
    { id:"c1_ep5_hero1", type:"dialogue", speaker:"hero", location:REC,
      text:"（労働時間を正しく把握するのは、使用者の義務だ。改ざんは、その真逆。……上限を超えた分を、記録ごと消して回っている。）", next:"c1_ep5_kai1" },
    { id:"c1_ep5_kai1", type:"dialogue", speaker:"kai", location:REC, expression:"angry",
      text:"時間を盗まれるのは、命を削られるのと同じだ。おれの親父もそうだった。……見過ごせねぇ。", next:"c1_ep5_choice" },

    { id:"c1_ep5_choice", type:"choice", speaker:"hero", location:REC, text:"改ざんに、どう挑む?",
      choices:[
        { text:"書き換えの痕跡を、機械の生ログと突き合わせる",
          ideologyChanges:{ law:1, indep:1 }, flags:{ c1_ep5_path_log:1 }, next:"c1_ep5_probe" },
        { text:"トビを守りながら、指示系統を上へ辿る",
          ideologyChanges:{ human:1, relief:1 }, flags:{ c1_ep5_path_protect:1 }, next:"c1_ep5_protect" }
      ]},
    { id:"c1_ep5_protect", type:"dialogue", speaker:"hero", location:REC,
      text:"命じられた者を、罪には問わせない。責めるべきは、手を汚さず数字だけ見て眠る元締めだ。", next:"c1_ep5_probe",
      relationshipChanges:{ cp0:1 } },

    { id:"c1_ep5_probe", type:"dialogue", speaker:"narrator", location:REC, bgmScene:"field",
      text:"書き換えられた打刻、機械の生ログ、そして三六協定。盗まれた時間の行き先を塞いでいく。",
      next:"c1_ep5_enc1", questUpdate:{ qid:"q_ch01b", state:"active", step:3 } },
    { id:"c1_ep5_enc1", type:"encounter", speaker:"hero", location:REC,
      text:"書き換えの筆跡と、機械が黙って刻んだ生の稼働時間。二つを並べれば、盗まれた時間が浮かび上がる。",
      encounter: enc(0, "改ざんの痕跡を照合する", { villain:"v_kaizanko", exam:1 }),
      evidence:"ev_ch1b_tamper", next:"c1_ep5_ev1" },
    { id:"c1_ep5_ev1", type:"dialogue", speaker:"tobi", location:REC,
      text:"生ログは、消せなかったんです。機械は正直で。……ほら、深夜三時まで、ずっと動いてる。", next:"c1_ep5_enc2" },
    { id:"c1_ep5_enc2", type:"encounter", speaker:"hero", location:REC, bgmScene:"emotion",
      text:"帳面の主は、あの刻印の男だった。三六協定の綴りから逃げた、刻印のヴァルト。今度は労働時間規制の核心で、退路を断つ。",
      encounter: enc(0, "過去問｜労働時間・36協定を五肢/個数で問う", { villain:"v_lt_valt", exam:2 }),
      evidence:"ev_ch1b_valt", next:"c1_ep5_ev2" },
    { id:"c1_ep5_ev2", type:"dialogue", speaker:"narrator", location:REC,
      text:"ヴァルトは刻印を握ったまま闇へ退いた。去り際、こう言い残して――『穴を掘らせたのは、私より上だ』と。", next:"c1_ep5_reason" },
    { id:"c1_ep5_reason", type:"reasoning", speaker:"hero", location:REC, bgmScene:"emotion",
      text:"書き換えの筆跡、消せなかった生ログ、超えた協定。三つが指すのは一つ――組織ぐるみの、労働時間の改ざんだ。",
      reasoning:{ need:["ev_ch1b_tamper","ev_ch1b_valt"] },
      flags:{ c1_ep5_reasoned:1 }, next:"c1_ep5_biz" },

    /* 【経営者の事情】 */
    { id:"c1_ep5_biz", type:"dialogue", speaker:"foreman", location:REC,
      text:"……時間を消せば、帳簿は合う。合わなければ取引先が離れる。離れれば給料が払えん。改ざんは、みんなを飢えさせないための、私の罪だ。", next:"c1_ep5_hero2" },
    { id:"c1_ep5_hero2", type:"dialogue", speaker:"hero", location:REC,
      text:"（罪と分かって、なお背負う。……裁くだけでは何も変わらない。時間を盗まなくても回る工場を、どう作る。）",
      next:"c1_ep5_end", ideologyChanges:{ fair:1 } },
    { id:"c1_ep5_end", type:"dialogue", speaker:"narrator", location:REC, bgmScene:"field",
      text:"盗まれた時間の在り処は暴かれた。刻印の紋様は――あの通達の印に、よく似ていた。",
      next:"c1_ep5_hook", flags:{ c1_ep5_done:1 }, questUpdate:{ qid:"q_ch01b", state:"active", step:4 } },
    { id:"c1_ep5_hook", type:"dialogue", speaker:"kai", location:REC, expression:"angry",
      text:"時間の次は、命だ。……レンが倒れるまで、誰も警報を鳴らさなかった。その理由を、まだ突き止めてねぇ。", next:"c1_ep6_open" },

    /* ============================================================
       第6話「鳴らない警報」
       安全装置・労災報告（安衛）。話3の事故隠しに接続。小ボス=無音の警鐘ヴェイル。
       ============================================================ */
    { id:"c1_ep6_open", type:"dialogue", speaker:"narrator", location:LINE3, bgmScene:"emotion",
      text:"レンが倒れた第三ライン。あの日まで、警報はひとつも鳴らなかった。健診も、面接指導も、労働時間の把握も――すべてが『鳴らないよう』に管理されていた。",
      next:"c1_ep6_mina1", flags:{ c1_ep6_start:1 } },
    { id:"c1_ep6_mina1", type:"dialogue", speaker:"mina", location:LINE3, portrait:"mina",
      text:"仕組みは、生きていました。切られていたのは、鳴らす側です。……誰かが、気づかない状態を保っていた。", next:"c1_ep6_hero1" },
    { id:"c1_ep6_hero1", type:"dialogue", speaker:"hero", location:LINE3,
      text:"（安全衛生管理体制。危険に気づく立場の者には、止める責任がある。……止められる者が止めないなら、それは仕組みの失敗だ。）", next:"c1_ep6_kai1" },
    { id:"c1_ep6_kai1", type:"dialogue", speaker:"kai", location:LINE3, expression:"angry",
      text:"レンは、まだ目を覚まさねぇ。同じことを次の誰かに繰り返させるわけにはいかねぇ。だから――鳴らない警報を、おれたちが鳴らす。", next:"c1_ep6_choice" },

    { id:"c1_ep6_choice", type:"choice", speaker:"hero", location:LINE3, text:"鳴らない警報を、どう暴く?",
      choices:[
        { text:"放置された健診結果と、握りつぶされた報告を突き合わせる",
          ideologyChanges:{ law:1, relief:1 }, flags:{ c1_ep6_path_trace:1 }, next:"c1_ep6_probe" },
        { text:"『止める権限』が誰にあったのかを、体制図から特定する",
          ideologyChanges:{ fair:1, indep:1 }, flags:{ c1_ep6_path_who:1 }, next:"c1_ep6_who" }
      ]},
    { id:"c1_ep6_who", type:"dialogue", speaker:"hero", location:LINE3,
      text:"産業医は誰か。衛生委員会は開かれていたか。止める権限は、どこにあったのか。……曖昧にされた責任の所在を、はっきりさせる。", next:"c1_ep6_probe" },

    { id:"c1_ep6_probe", type:"dialogue", speaker:"narrator", location:LINE3, bgmScene:"field",
      text:"読まれなかった健診結果、伝えられなかった窓口、空白の教育記録。鳴らなかった理由を、一つずつ証拠に変えていく。",
      next:"c1_ep6_enc1", questUpdate:{ qid:"q_ch01b", state:"active", step:5 } },
    { id:"c1_ep6_enc1", type:"encounter", speaker:"hero", location:LINE3,
      text:"産業医も、衛生委員会も、名前だけがあった。安衛法は、人の異変に気づくための仕組みを義務づけている――その穴を暴く。",
      encounter: enc(1, "名ばかりの管理体制を暴く", { villain:"v_garan", exam:1 }),
      evidence:"ev_ch1b_silence", next:"c1_ep6_ev1" },
    { id:"c1_ep6_ev1", type:"dialogue", speaker:"mina", location:LINE3,
      text:"産業医は三年前から不在。衛生委員会の議事録は白紙。健診の異常所見は、封も切られていない。……そして報告は、一度も出ていません。", next:"c1_ep6_enc2" },
    { id:"c1_ep6_enc2", type:"encounter", speaker:"hero", location:LINE3, bgmScene:"emotion",
      text:"体制図の頂に立つ者が現れた。無音の警鐘ヴェイル。本試験の問いで、安全衛生管理体制と報告義務を正面から問う。",
      encounter: enc(1, "過去問｜安全衛生体制・労災報告を問う", { villain:"v_lt_veil", exam:2 }),
      evidence:"ev_ch1b_veil", next:"c1_ep6_ev2" },
    { id:"c1_ep6_ev2", type:"dialogue", speaker:"narrator", location:LINE3,
      text:"ヴェイルは、鳴らすはずだった警報を、初めて自らの手で鳴らした。工場じゅうに、遅すぎた音が響き渡った。", next:"c1_ep6_reason" },
    { id:"c1_ep6_reason", type:"reasoning", speaker:"hero", location:LINE3, bgmScene:"emotion",
      text:"不在の産業医、白紙の議事録、封も切られない健診結果、消えた報告。――これは不運じゃない。鳴らないよう管理された人災だ。",
      reasoning:{ need:["ev_ch1b_silence","ev_ch1b_veil"] },
      flags:{ c1_ep6_reasoned:1 }, next:"c1_ep6_negotiate" },
    { id:"c1_ep6_negotiate", type:"negotiation", speaker:"hero", location:LINE3,
      text:"争点は、異変に気づく仕組みを置かなかった安衛法違反と、倒れたことを報告しなかった責任。本人の頑張りすぎで片づけさせはしない。",
      negotiation:{ answer:"anzen_hokoku", options:["労働者の不注意","anzen_hokoku","機械の寿命"] },
      next:"c1_ep6_biz" },

    /* 【経営者の事情】断定せず、伏線として濃くする */
    { id:"c1_ep6_biz", type:"dialogue", speaker:"foreman", location:LINE3,
      text:"……鳴らせば、ラインが止まる。止まれば、この街の家族が飢える。だから鳴らすなと、上から言われた。私は、その理屈に負けた。", next:"c1_ep6_hero2" },
    { id:"c1_ep6_hero2", type:"dialogue", speaker:"hero", location:LINE3,
      text:"（『街が飢える』――ノクティスも、ヴァルトも、同じ言葉を盾にした。誰かが、同じ台本を配ったみたいに。……版木は、やはり上だ。）",
      next:"c1_ep6_end", ideologyChanges:{ mgmt:1 }, flags:{ c1_ep6_saw_sides:1 } },
    { id:"c1_ep6_end", type:"dialogue", speaker:"mina", location:LINE3,
      text:"記録しました。不在の産業医、白紙の議事録、握りつぶした報告、そして――止めよと言えなかった理由まで。次は、防げます。",
      next:"c1_ep6_hook", flags:{ c1_ep6_done:1 }, relationshipChanges:{ cp1:1 } },

    /* 小結末 → 章ボス(鉄血監督官グラウス)への引き。断定せず問いを残す。 */
    { id:"c1_ep6_hook", type:"dialogue", speaker:"kai", location:BERGA, bgmScene:"emotion",
      text:"名ばかりの札、盗まれた時間、鳴らない警報。……全部、一枚の通達から降りてきてた。師匠の名前が書かれた、あの通達から。", next:"c1_ep6_graus" },
    { id:"c1_ep6_graus", type:"dialogue", speaker:"narrator", location:BERGA,
      text:"煙の奥、止まらぬ機械の唸りの中心に、あの男が立っていた。鉄血監督官グラウス――第三ラインでレンの報告を握りつぶそうとした、『止めるな』の張本人。", next:"c1_ep6_final" },
    { id:"c1_ep6_final", type:"dialogue", speaker:"hero", location:BERGA, bgmScene:"field",
      text:"（手下ではなく、仕組みそのものと向き合う時だ。……グラウスを正すことが、師匠へ辿り着く道になる。）",
      next:null, flags:{ c1_ep6_solved:1, c1_ch01b_done:1, c1_boss_next:1 },
      questUpdate:{ qid:"q_ch01b", state:"done", step:6 } }
  ];

  /* 第4〜6話クエスト定義（doneFlag で完了判定）。q_ch01（話1-3）は改変しない別クエスト。 */
  if(typeof S.registerQuest==="function"){
    S.registerQuest("q_ch01b", {
      title:"版木を追って",
      chapter:"ch01b",
      steps:["名ばかりの札","盗まれた時間","鳴らない警報","統制官への道"],
      doneFlag:"c1_ch01b_done"
    });
  }

  S.register("ch01b", NODES);
  S.CH01B_ID = "ch01b";

  /* メイン章の背骨（story-home.js の S.MAIN）へ、話1-3(ch01)の続きとして追記する。
     ・ch01 完了(c1_ch01_done)後、ホームの「今日の冒険」が自動で本話へ進む導線になる。
     ・S.MAIN 未ロード/未定義でも安全（存在する時だけ push、重複登録も防ぐ）。 */
  if(Array.isArray(S.MAIN)){
    var exists = false;
    for(var i=0;i<S.MAIN.length;i++){ if(S.MAIN[i] && S.MAIN[i].id==="ch01b"){ exists = true; break; } }
    if(!exists){
      S.MAIN.push({ id:"ch01b", no:"第一章", title:"版木を追って", loc:"工都ベルガ・第七工場",
        doneFlag:"c1_ch01b_done", startedFlag:"c1_ep4_start" });
    }
  }
})();
