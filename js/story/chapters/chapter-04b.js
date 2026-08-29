"use strict";
/* ============================================================
   story/chapters/chapter-04b.js — 第四章「払わぬが勝ち」第4〜8話 + 章ボス戦
   docs/story-bible.md / ENDING-CANON 準拠。chapter-04.js の末尾(c4_ch04_done /
   c4_boss_next)から地続きの五話を、別 chapterId="ch04b" で綴じ込む。
   舞台=徴収路(火山イグニスから街道へ続く長い道)／労働保険徴収法(subject 4)。
   ・第4話「印紙の一枚」…一括有期事業・印紙保険料(日雇労働者)を、印紙を貼られず現場から消された者の事件で。
                     過去問(examFmt)混入。制度側の事情(原資・元請の負担)を継続。トキ関係深化の芽。
   ・第5話「一括の現場」…確定保険料の精算・労働保険事務組合・一括有期の要件。中ボス 一括のクロガネ 初登場
                     (トキが事務組合時代に相対した元請。頼る側から、束ねて消す側へ回った過去)。
   ・第6話「束ねる元締」…中ボス【一括のクロガネ v_mid_ikkatsu】戦。印紙・一括・事務組合の総合。トキとの絆深化。
   ・第7話「決戦前夜」…仲間との会話で覚悟。戦う意味の総括(戦闘なし)。師匠ゼンの影を1本繋ぐ。
   ・第8話「決戦」…章ボス【取立番長 v_boss_s4】戦=【章末問題集】(徴収法の過去問=examFmt中心の高難度セット)。
                 撃破後は断定的勝利にせず、「間を取り持つ/法典のかけらを取り戻す」テーマへ橋渡し。
   ・各話に必ず「経営者/行政/制度側の事情」ビートを置き、断定せず問いを残す(『払わぬが勝ち』の空気)。
   ・chapter-01*.js / chapter-02*.js / chapter-03*.js / chapter-04.js のノード/quest/ID/証拠/分岐は
     一切改変しない(別ファイル・別章 "ch04b")。
   ・戦闘接続は既存の橋(story-encounter / story-battle-bridge)。encounter に villain と
     exam(examFmt 混入数)を持たせるだけで、採点・SRS・報酬・問題データには一切触れない。
     ボス戦も新規採点系を作らず、examFmt を多く混ぜた高難度 encounter として既存橋へ委譲する。
   ・eval/new Function ゼロ。全ノードはデータのみ(next は文字列 or {then,else} or null)。全出力は自前 esc2 経由。
   ・立てるフラグ: c4_ep4_done〜c4_ep8_done / c4_boss_cleared / c4_ch04b_done / c4_zen_ash4b / c4_shard4。
     q_ch04(前半)は無改変。ここは boss_cleared までを確定する。
   ・注: 仲間トキの好感度キーは cp4(前半 c4_toki_join で加入済)。data-companions.js の cp4 とは別レイヤー
     (物語の関係値 getRel/setRel はパーティ・パッシブと独立)なので、既存テストを割らずに深化させる。
   ============================================================ */
(function(){
  var G = (typeof window!=="undefined") ? window : globalThis;
  var S = G.SRStory;
  if(!S || typeof S.register!=="function") return;   /* エンジン未ロードでも安全 */

  /* 第4〜8話の話者を表示名テーブルへ追記(描画層があれば。無ければ素通し)。
     toki/kai/mina/gard/rio/hcho/toritate は既存(chapter-04.js が追記済み)。中ボスと新被害者のみ追記。
     ikkatsu(中ボス)の px は輪郭線付き人物バスト e_ferro。 */
  if(S.SPEAKERS && typeof S.SPEAKERS==="object"){
    if(!S.SPEAKERS.ikkatsu) S.SPEAKERS.ikkatsu = { name:"一括のクロガネ", px:"e_ferro" };
    if(!S.SPEAKERS.hiyato)  S.SPEAKERS.hiyato  = { name:"印紙を消された日雇い", px:"ghost" };
  }

  var HANBA = "徴収路・印紙の飯場";
  var GENBA = "徴収路・一括の現場";
  var YAEI  = "徴収路・野営の焚き火";
  var TORIDE= "徴収路・徴収の砦";

  /* 演習 encounter。opts で相手(villain)と過去問混入数(exam=examFmt の本数)・出題数(n)を指定。
     kind:"train" のまま既存の橋(start*)へ委譲する。ボス戦は exam/n を大きくした高難度セット。subject=4。 */
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
       第4話「印紙の一枚」
       一括有期事業・印紙保険料(日雇労働者)を、印紙を貼られず現場から消された者の事件で。
       ============================================================ */
    { id:"c4_ep4_open", start:true, type:"dialogue", speaker:"narrator", location:HANBA, bgmScene:"emotion",
      text:"徴収路の飯場。日ごとに人が集められ、日ごとに散っていく。その隅で、日雇いの男が手帳を見つめて動けずにいた。印紙が、一枚もない。",
      next:"c4_ep4_intro", flags:{ c4_ep4_start:1 },
      questUpdate:{ qid:"q_ch04b", state:"active", step:0 } },
    { id:"c4_ep4_intro", type:"dialogue", speaker:"hiyato", location:HANBA, portrait:"ghost", expression:"shock",
      text:"半年、現場を渡り歩いた。働いた日ぶんの印紙を貼ってもらえるはずだった。……なのに一枚もない。元請は『一括でまとめた』と言う。", next:"c4_ep4_toki1" },
    { id:"c4_ep4_toki1", type:"dialogue", speaker:"toki", location:HANBA, portrait:"foreman",
      text:"……待ちな。それは印紙保険料の貼り漏れだ。日雇労働被保険者は、働いた日ごとに印紙を貼って納める。それが日雇いの命綱だよ。", next:"c4_ep4_toki2" },
    { id:"c4_ep4_toki2", type:"dialogue", speaker:"toki", location:HANBA, expression:"angry",
      text:"一括有期事業――要件を満たせば小さな工区を一つにまとめて申告できる。正しい仕組みだ。でも偽って束ねれば、中の一人ひとりが数字から消える。", next:"c4_ep4_kai1" },
    { id:"c4_ep4_kai1", type:"dialogue", speaker:"kai", location:HANBA, portrait:"helm", expression:"angry",
      text:"印紙一枚貼らねえだけで、半年働いた男が、怪我しても何も出ねえ側に落とされる。……その一枚を、貼り直しに行く。", next:"c4_ep4_mina1" },
    { id:"c4_ep4_mina1", type:"dialogue", speaker:"mina", location:HANBA, portrait:"wiz",
      text:"印紙保険料は、日雇労働被保険者のための日々の納付です。一括有期には事業の種類や規模の要件がある。……偽って束ねれば、命綱と原資が同時に消えます。", next:"c4_ep4_choice" },

    { id:"c4_ep4_choice", type:"choice", speaker:"hero", location:HANBA, text:"この日雇いに、どう向き合う?",
      choices:[
        { text:"印紙保険料と一括有期の要件を、制度で正しく示して貼り直す",
          ideologyChanges:{ law:1, fair:1 }, flags:{ c4_ep4_path_law:1 }, next:"c4_ep4_probe" },
        { text:"まず、命綱を一枚ずつ抜かれた半年の不安を受け止める",
          ideologyChanges:{ human:1, relief:1 }, flags:{ c4_ep4_path_human:1 }, next:"c4_ep4_alt" }
      ]},
    { id:"c4_ep4_alt", type:"dialogue", speaker:"hero", location:HANBA,
      text:"不安で当然です。半年、あなたは確かに現場に立った。……その上で。あなたの手帳には、本当は印紙が貼られるべきだった。まだ貼り直せます。", next:"c4_ep4_probe" },

    { id:"c4_ep4_probe", type:"dialogue", speaker:"narrator", location:HANBA, bgmScene:"field",
      text:"『一括でまとめた』――そう言い張って印紙を貼らず、日雇いを現場から消す手先がいた。印紙保険料と一括有期の要件を立て直す。",
      next:"c4_ep4_enc1", questUpdate:{ qid:"q_ch04b", state:"active", step:1 } },
    { id:"c4_ep4_enc1", type:"encounter", speaker:"hero", location:HANBA, bgmScene:"emotion",
      text:"督促のトクガが、貼られなかった印紙の束を隠して現れた。印紙保険料・日雇労働被保険者・一括有期事業の要件を、本試験の問いで確かめる。",
      encounter: enc(4, "過去問｜印紙保険料・日雇・一括有期の要件を問う", { villain:"v_tokusoku", exam:2 }),
      evidence:"ev_ch4b_inshi", next:"c4_ep4_ev1" },
    { id:"c4_ep4_ev1", type:"dialogue", speaker:"mina", location:HANBA, portrait:"wiz",
      text:"印紙の筋、証拠に残せました。一括有期は、要件を満たす有期事業だけを束ねられる。……この男は一人の被保険者。抜かれた印紙は、貼り直せます。", next:"c4_ep4_reason" },
    { id:"c4_ep4_reason", type:"reasoning", speaker:"hero", location:HANBA, bgmScene:"emotion",
      text:"印紙保険料、日雇労働被保険者、一括有期の要件。――誰の労働を原資として数えるかの条文だ。偽って束ね、印紙を省く。それが命綱を消す細工だ。",
      reasoning:{ need:["ev_ch4b_inshi"] },
      flags:{ c4_ep4_reasoned:1 }, next:"c4_ep4_biz" },

    /* 【制度/元請側の事情】断定せず提示 */
    { id:"c4_ep4_biz", type:"dialogue", speaker:"hcho", location:HANBA,
      text:"……印紙を貼るのは正しい。だが小さな有期事業ごとに届出も申告もとなれば、元請の事務は膨れる。だから一括がある。便利と逃げの線を、誰が引く?", next:"c4_ep4_hero2" },
    { id:"c4_ep4_hero2", type:"dialogue", speaker:"hero", location:HANBA,
      text:"（事務が膨れるのは本当だ。……でも、その付けを印紙を抜かれた本人の命綱で払わせるのは違う。便利さは残して、消す口実だけを弾く。）",
      next:"c4_ep4_end", ideologyChanges:{ mgmt:1, fair:1 }, flags:{ c4_ep4_saw_sides:1 } },
    { id:"c4_ep4_end", type:"dialogue", speaker:"narrator", location:HANBA, bgmScene:"field",
      text:"男は白紙だった手帳を握りしめ、初めて顔を上げた。トキはその空欄に、貼られるべきだった印紙の位置を、指先でそっとなぞってやった。",
      next:"c4_ep4_hook", flags:{ c4_ep4_done:1 }, questUpdate:{ qid:"q_ch04b", state:"active", step:2 } },
    { id:"c4_ep4_hook", type:"dialogue", speaker:"toki", location:HANBA, expression:"angry",
      text:"……でもね、印紙を貼り直しても大元がいる。要件を偽って現場を束ね、日雇いをまとめて消してる元請さ。……昔は、頼ってきた顔だよ。", next:"c4_ep5_open" },

    /* ============================================================
       第5話「一括の現場」
       確定保険料の精算・労働保険事務組合・一括有期の要件。中ボス 一括のクロガネ 初登場。
       ============================================================ */
    { id:"c4_ep5_open", type:"dialogue", speaker:"narrator", location:GENBA, bgmScene:"emotion",
      text:"一括の現場。いくつもの小さな工区が、一枚の申告書に束ねられていた。その束の下で、名も印紙も精算も抜け落ちた者が積み上がっていた。",
      next:"c4_ep5_intro", flags:{ c4_ep5_start:1 } },
    { id:"c4_ep5_intro", type:"dialogue", speaker:"ikkatsu", location:GENBA, portrait:"e_ferro", expression:"angry",
      text:"――一括だ。まとめて、一つにする。小さな工区をいちいち別々に届けていられるか。……一人ひとりの印紙など、まとめた瞬間に見えなくなる。", next:"c4_ep5_toki1" },
    { id:"c4_ep5_toki1", type:"dialogue", speaker:"toki", location:GENBA, portrait:"foreman", expression:"shock",
      text:"……クロガネ。あんた、昔は事務組合に頭を下げて、申告も納付も委ねてた側じゃないか。いつから、束ねて消す側に回った。", next:"c4_ep5_ikka2" },
    { id:"c4_ep5_ikka2", type:"dialogue", speaker:"ikkatsu", location:GENBA, expression:"angry",
      text:"……頭を下げても、原資は痩せる一方だった。真面目に精算するほど取り立てが重なって、現場が潰れた。ならば束ねて、見えなくする。", next:"c4_ep5_mina1" },
    { id:"c4_ep5_mina1", type:"dialogue", speaker:"mina", location:GENBA, portrait:"wiz",
      text:"労働保険事務組合は、小さな事業主に代わって申告も納付も引き受ける仕組みです。確定保険料は概算との差を精算するだけ。……束ねずに守る道は、条文の側にあります。", next:"c4_ep5_choice" },

    { id:"c4_ep5_choice", type:"choice", speaker:"hero", location:GENBA, text:"束ねられた現場に、どう立つ?",
      choices:[
        { text:"確定精算と事務組合の仕組みで、束から一人ずつ拾い直す",
          ideologyChanges:{ law:1, fair:1 }, flags:{ c4_ep5_path_law:1 }, next:"c4_ep5_probe" },
        { text:"取りっぱぐれを恐れて束ねる側に回った、クロガネの怖れをまず聞く",
          ideologyChanges:{ human:1, mgmt:1 }, flags:{ c4_ep5_path_ask:1 }, next:"c4_ep5_alt" }
      ]},
    { id:"c4_ep5_alt", type:"dialogue", speaker:"hero", location:GENBA,
      text:"原資の細りを怖れたのは分かります。真面目に納めるほど潰れた現場もあった。……その上で。事務組合という頼り先があった。怖れの逃げ道を、支える道へ引き直せます。", next:"c4_ep5_probe" },

    { id:"c4_ep5_probe", type:"dialogue", speaker:"narrator", location:GENBA, bgmScene:"field",
      text:"『まとめれば見えなくなる』――手先が、確定の精算と事務組合の道を束の下へ隠していた。要件と精算の筋を立て直す。",
      next:"c4_ep5_enc1", questUpdate:{ qid:"q_ch04b", state:"active", step:3 } },
    { id:"c4_ep5_enc1", type:"encounter", speaker:"hero", location:GENBA, bgmScene:"emotion",
      text:"督促のトクガが、束ねた総額の帳簿を盾に立ちはだかった。確定保険料の精算・事務組合の委託・一括有期の要件を、本試験の問いで数え直す。",
      encounter: enc(4, "過去問｜確定精算・事務組合・一括有期を問う", { villain:"v_tokusoku", exam:2 }),
      evidence:"ev_ch4b_ikkatsu", next:"c4_ep5_ev1" },
    { id:"c4_ep5_ev1", type:"dialogue", speaker:"toki", location:GENBA,
      text:"確定は概算との差を精算するだけ。多けりゃ還付、足りなきゃ追加。事務組合に委ねれば、この筋で回る。……次に立つのは、クロガネ本人だ。", next:"c4_ep5_reason" },
    { id:"c4_ep5_reason", type:"reasoning", speaker:"hero", location:GENBA, bgmScene:"emotion",
      text:"確定保険料の精算、労働保険事務組合、一括有期の要件。――束ねた現場から一人ずつ数え直すための条文だ。見えなくするのは、道を隠す細工だ。",
      reasoning:{ need:["ev_ch4b_ikkatsu"] },
      flags:{ c4_ep5_reasoned:1 }, next:"c4_ep5_biz" },

    /* 【元締/行政側の事情】断定せず、次話の壁として残す */
    { id:"c4_ep5_biz", type:"dialogue", speaker:"ikkatsu", location:GENBA, expression:"shock",
      text:"……束ねるのを悪だと言い切れるか。一つずつ届けさせれば、事務に潰れる元請もいる。私は、現場を生き延びさせるために束ねた。", next:"c4_ep5_hero2" },
    { id:"c4_ep5_hero2", type:"dialogue", speaker:"hero", location:GENBA,
      text:"（束ねる便利さは本物だ。……でも、束ねてよい要件と、消すための束ねは線が引ける。生き延びるための一括と、命綱を抜く一括を混ぜてはいけない。）",
      next:"c4_ep5_end", ideologyChanges:{ fair:1, mgmt:1 }, flags:{ c4_ep5_saw_sides:1 } },
    { id:"c4_ep5_end", type:"dialogue", speaker:"narrator", location:GENBA, bgmScene:"field",
      text:"クロガネは束ねた台帳の一枚に手を置いたまま、動かなかった。鉄の面の奥で、頼る側だった頃の顔が、消せずに揺れていた。",
      next:"c4_ep5_hook", flags:{ c4_ep5_done:1 }, questUpdate:{ qid:"q_ch04b", state:"active", step:4 } },
    { id:"c4_ep5_hook", type:"dialogue", speaker:"gard", location:GENBA, portrait:"oni", expression:"angry",
      text:"……あいつはまだ束を手放しちゃいねえ。現場の奥で、印紙も確定も一括も、全部まとめて闇に沈めるつもりだ。行くぞ、調律師。", next:"c4_ep6_open" },

    /* ============================================================
       第6話「束ねる元締」— 中ボス【一括のクロガネ v_mid_ikkatsu】戦
       印紙・一括・事務組合・確定精算の総合。トキとの関係深化。
       ============================================================ */
    { id:"c4_ep6_open", type:"dialogue", speaker:"narrator", location:GENBA, bgmScene:"emotion",
      text:"現場の最奥。束ねられた台帳の山から、次々と名が抜き取られていた。印紙を待つ日雇い、精算を待つ工区。その前に、クロガネが立ちはだかった。",
      next:"c4_ep6_choice", flags:{ c4_ep6_start:1 } },
    { id:"c4_ep6_choice", type:"choice", speaker:"hero", location:GENBA, text:"クロガネの束を、どう解く?",
      choices:[
        { text:"印紙・確定・一括・事務組合の全体像で、束から一名を立証する",
          ideologyChanges:{ law:1, fair:1 }, flags:{ c4_ep6_path_law:1 }, next:"c4_ep6_probe" },
        { text:"同じく取りっぱぐれを怖れた者として、まずクロガネに語りかける",
          ideologyChanges:{ human:1, relief:1 }, flags:{ c4_ep6_path_human:1 }, next:"c4_ep6_alt" }
      ]},
    { id:"c4_ep6_alt", type:"dialogue", speaker:"toki", location:GENBA, portrait:"foreman",
      text:"クロガネ。あたしも徴収人だった。真面目な事業主から取り立てて、潰した現場をこの手で見送った。……束ねたって、その怖れは埋まらない。", next:"c4_ep6_probe" },

    { id:"c4_ep6_probe", type:"dialogue", speaker:"narrator", location:GENBA, bgmScene:"field",
      text:"束から抜き取られる寸前の名。印紙を待つ日雇い、精算を待つ工区。徴収の骨組みで、一名ずつ拾い上げる。",
      next:"c4_ep6_enc1", questUpdate:{ qid:"q_ch04b", state:"active", step:5 } },
    { id:"c4_ep6_enc1", type:"encounter", speaker:"hero", location:GENBA,
      text:"まずは徴収の骨組み。概算・確定の精算、印紙保険料、一括有期、事務組合、督促。束から抜かれかけた一名の筋を通す。",
      encounter: enc(4, "過去問｜確定精算・印紙・一括・事務組合を問う", { villain:"v_tokusoku", exam:2 }),
      evidence:"ev_ch4b_hone", next:"c4_ep6_ev1" },
    { id:"c4_ep6_ev1", type:"dialogue", speaker:"mina", location:GENBA, portrait:"wiz",
      text:"骨組み、通せました。……ですが、クロガネ本人が束ねた台帳を構えて前に出ます。束ねてきた歳月ごと、正面からぶつかることになります。", next:"c4_ep6_enc2" },
    { id:"c4_ep6_enc2", type:"encounter", speaker:"hero", location:GENBA, bgmScene:"emotion",
      text:"一括のクロガネが束ねた台帳を背に立ちはだかった。概算・確定・年度更新・延滞金・メリット制・印紙・一括有期・事務組合の全体像で、束を解き直す。",
      encounter: enc(4, "過去問｜徴収の総合(中ボス)", { villain:"v_mid_ikkatsu", exam:3 }),
      evidence:"ev_ch4b_kuro", next:"c4_ep6_ev2" },
    { id:"c4_ep6_ev2", type:"dialogue", speaker:"ikkatsu", location:GENBA, expression:"shock",
      text:"……束が、解かれた。十年、この束で現場を沈めてきた。真面目に納めて潰れるくらいならと。……私が怖れたものに、私自身がなっていたのか。", next:"c4_ep6_reason" },
    { id:"c4_ep6_reason", type:"reasoning", speaker:"hero", location:GENBA, bgmScene:"emotion",
      text:"概算・確定、年度更新、延滞金、メリット制、印紙、一括有期、事務組合。――束で消した根拠は、そのどれもが解き直せた。怖れて束ねた現場も、抱えられる。",
      reasoning:{ need:["ev_ch4b_hone","ev_ch4b_kuro"] },
      flags:{ c4_ep6_reasoned:1 }, next:"c4_ep6_biz" },

    /* 【元締側の事情】断定せず、問いを残す */
    { id:"c4_ep6_biz", type:"dialogue", speaker:"ikkatsu", location:GENBA,
      text:"……最後に問わせろ。私が束ねなければ、事務に潰れる現場もあった。全部を一人ずつ数えることと、現場を生き延びさせること。両方立てられるのか?", next:"c4_ep6_hero2" },
    { id:"c4_ep6_hero2", type:"dialogue", speaker:"hero", location:GENBA,
      text:"（両方を立てる。事務の重さは事務組合や正しい一括で軽くできる。だから命綱まで束ねて消さなくていい。……あなた自身も、支えられるべきだった。）",
      next:"c4_ep6_bond", ideologyChanges:{ fair:1, mgmt:1 }, flags:{ c4_ep6_saw_sides:1 } },
    { id:"c4_ep6_bond", type:"dialogue", speaker:"toki", location:GENBA, bgmScene:"emotion", expression:"shock",
      text:"……調律師。あたしは取り立てた数字の正しさだけを盾に、潰した現場の顔から目を逸らしてきた。……あんたは、あたしが取り立てたクロガネまで拾おうとした。",
      next:"c4_ep6_end", relationshipChanges:{ cp4:1 }, flags:{ c4_ep6_bonded:1 } },
    { id:"c4_ep6_end", type:"dialogue", speaker:"narrator", location:GENBA, bgmScene:"field",
      text:"束ねられた台帳が解かれ、抜き取られかけた名が、一つまた一つと原資として色を取り戻した。だが砦では、取立番長が影を人の形に立ち上げていた。",
      next:"c4_ep6_hook", flags:{ c4_ep6_done:1 }, questUpdate:{ qid:"q_ch04b", state:"active", step:6 } },
    { id:"c4_ep6_hook", type:"dialogue", speaker:"toki", location:GENBA, expression:"angry",
      text:"……あれが大元だ。『払わぬが勝ち』って空気そのものが、番長の形になってやがる。明日、砦で決着だ。", next:"c4_ep7_open" },

    /* ============================================================
       第7話「決戦前夜」
       仲間との会話で覚悟。戦う意味の総括(戦闘なし)。師匠ゼンの影を1本繋ぐ。
       ============================================================ */
    { id:"c4_ep7_open", type:"dialogue", speaker:"narrator", location:YAEI, bgmScene:"town",
      text:"徴収路の野営。焚き火を囲み、六人は乾いた携行食をかじった。明日、この道の空気そのものと戦う。その前の、静かな夜だった。",
      next:"c4_ep7_toki1", flags:{ c4_ep7_start:1 } },
    { id:"c4_ep7_toki1", type:"dialogue", speaker:"toki", location:YAEI, portrait:"foreman",
      text:"あたしは取り立てた額の正しさだけで自分を許してきた。数字は嘘をつかないって。……でも今は分かる。潰した現場の顔も、数え直さなきゃ。", next:"c4_ep7_kai1" },
    { id:"c4_ep7_kai1", type:"dialogue", speaker:"kai", location:YAEI, expression:"angry",
      text:"悪いのは一人の悪人じゃねえ。『払わぬが勝ち』って空気を、みんなが少しずつ吸ってた。……クロガネも、取りっぱぐれを怖れた側だった。", next:"c4_ep7_mina1" },
    { id:"c4_ep7_mina1", type:"dialogue", speaker:"mina", location:YAEI, portrait:"wiz",
      text:"逃げ得の一件ずつは小さい。その小さな逃げを恐れて取り立てを締めれば、律儀に納めた者ほど潰れる。……明日突きつけるのは、その一点です。", next:"c4_ep7_hero1" },
    { id:"c4_ep7_hero1", type:"dialogue", speaker:"hero", location:YAEI,
      text:"経営者も行政も悪じゃない。原資にも限りがある。負担を惜しむ者も、取りっぱぐれを怖れる者もいる。……その全部を抱えて、消された一人を数え直す。", next:"c4_ep7_choice" },

    { id:"c4_ep7_choice", type:"choice", speaker:"hero", location:YAEI, text:"覚悟を、言葉にする。",
      choices:[
        { text:"「取りっぱぐれ」の恐れを「支え合いの原資」に変える。その第一歩として戦う",
          ideologyChanges:{ fair:1, mgmt:1 }, flags:{ c4_ep7_vow_bridge:1 }, next:"c4_ep7_vow" },
        { text:"束の下に消された一人ひとりを、原資として数え直すために戦う",
          ideologyChanges:{ human:1, relief:1 }, flags:{ c4_ep7_vow_count:1 }, next:"c4_ep7_vow" }
      ]},
    { id:"c4_ep7_vow", type:"dialogue", speaker:"hero", location:YAEI, bgmScene:"emotion",
      text:"番長を倒しに行くんじゃない。『払わぬが勝ち』を『支え合う原資』に書き換えに行く。誰の一枚も消さない仕組みを――明日、砦で。", next:"c4_ep7_zen" },
    { id:"c4_ep7_zen", type:"dialogue", speaker:"narrator", location:YAEI, bgmScene:"emotion",
      text:"トキが持ち出した古い徴収台帳。一番下から紙片が滑り落ちた。『原資を集める者は、集められぬ者の理由を、まず問え』――師匠ゼンの筆跡。",
      next:"c4_ep7_end", flags:{ c4_zen_ash4b:1 } },
    { id:"c4_ep7_end", type:"dialogue", speaker:"hero", location:YAEI, bgmScene:"field",
      text:"（師匠。この道でも編み直そうとして、集めきれぬ者の理由を背負いきれずに去ったんですね。……その宿題を、おれたちが引き受けます。）",
      next:"c4_ep7_hook", flags:{ c4_ep7_done:1 }, questUpdate:{ qid:"q_ch04b", state:"active", step:7 } },
    { id:"c4_ep7_hook", type:"dialogue", speaker:"narrator", location:YAEI,
      text:"夜が明けた。六人は薄暗い街道を抜け、徴収路の果て――徴収の砦へと歩を進めた。督促の空気が、いっそう濃く満ちていた。", next:"c4_ep8_open" },

    /* ============================================================
       第8話「決戦」— 章ボス【取立番長 v_boss_s4】戦
       【章末問題集】=これまでの徴収法の過去問を集めた高難度セット(examFmt中心・タイト)。
       登場アニメ+『敵が問題を突きつける』枠組みは story-encounter が villain から自動生成する。
       撃破後は断定的勝利にせず「間を取り持つ/法典のかけらを取り戻す」テーマへ橋渡し(ENDING-CANON/introのかけら)。
       ============================================================ */
    { id:"c4_ep8_open", type:"dialogue", speaker:"narrator", location:TORIDE, bgmScene:"emotion",
      text:"徴収の砦。督促の空気が、ゆっくりと人の形に立ち上がった。憎しみも怒りもなく――『払わぬが勝ち』という空気そのもの。取立番長。",
      next:"c4_ep8_appear", flags:{ c4_ep8_start:1 } },
    { id:"c4_ep8_appear", type:"dialogue", speaker:"narrator", location:TORIDE,
      text:"番長が督促状の山を広げると、束の下に消された者が影から浮かび上がった。印紙を抜かれた日雇い、潰れかけた事業主、束ねられた現場。", next:"c4_ep8_torit1" },
    { id:"c4_ep8_torit1", type:"dialogue", speaker:"toritate", location:TORIDE, portrait:"e_kacho", expression:"angry",
      text:"よく来た、調律師。問おう。払ったか。期限は守ったか。……束の下に消えた者は誰が数える? 数えぬのが、徴収の道理だ。", next:"c4_ep8_hero1" },
    { id:"c4_ep8_hero1", type:"dialogue", speaker:"hero", location:TORIDE,
      text:"覆す。カイも、ミナも、ガルドも、リオも、トキもいる。消された者たちも顔を上げた。……その道理を、今日、徴収の全体像で覆す。", next:"c4_ep8_toki1" },
    { id:"c4_ep8_toki1", type:"dialogue", speaker:"toki", location:TORIDE, expression:"angry",
      text:"御託はいい。積み上げた過去問の全部を、ここでぶつける。……あたしが潰した現場も、束ねられて消えた日雇いも、今日で終いにする。", next:"c4_ep8_brief" },
    { id:"c4_ep8_brief", type:"dialogue", speaker:"narrator", location:TORIDE, bgmScene:"emotion",
      text:"これは総決算。概算・確定、年度更新、延滞金、メリット制、印紙、一括有期、事務組合、督促――逃げ道のすべてが【章末問題集】として襲いかかる。",
      next:"c4_ep8_enc1", questUpdate:{ qid:"q_ch04b", state:"active", step:8 } },
    { id:"c4_ep8_enc1", type:"encounter", speaker:"hero", location:TORIDE, bgmScene:"emotion",
      text:"第一幕・保険料/年度更新編。概算・確定の精算、年度更新の期限、延滞金・追徴金、メリット制を、高密度の五肢択一・個数で叩き込む。",
      encounter: enc(4, "章末問題集｜保険料・年度更新編(高難度)", { villain:"v_boss_s4", n:12, exam:5 }),
      evidence:"ev_ch4b_boss1", next:"c4_ep8_mid" },
    { id:"c4_ep8_mid", type:"dialogue", speaker:"toritate", location:TORIDE, expression:"shock",
      text:"……保険料と年度更新は越えたか。だが集める入口はそれだけではない。印紙、一括、事務組合、督促――逃げ道はどこまでも広い。", next:"c4_ep8_enc2" },
    { id:"c4_ep8_enc2", type:"encounter", speaker:"hero", location:TORIDE, bgmScene:"emotion",
      text:"第二幕・印紙/一括/徴収編。印紙保険料、一括有期事業、事務組合、保険関係の成立と消滅、督促と滞納処分を、同じ高密度で最後まで。",
      encounter: enc(4, "章末問題集｜印紙・一括・徴収編(高難度)", { villain:"v_boss_s4", n:12, exam:5 }),
      evidence:"ev_ch4b_boss2", next:"c4_ep8_broke" },
    { id:"c4_ep8_broke", type:"dialogue", speaker:"narrator", location:TORIDE, bgmScene:"emotion",
      text:"最後の一問が置かれた瞬間、督促状の柱が内側から崩れ始めた。消えていた者たちが一人また一人と名を呼ばれ、原資として色を取り戻していく。", next:"c4_ep8_reason" },
    { id:"c4_ep8_reason", type:"reasoning", speaker:"hero", location:TORIDE, bgmScene:"emotion",
      text:"概算・確定、年度更新、延滞金、メリット制、印紙、一括、事務組合、督促――どれも、消された一人を原資として数え直す条文だった。",
      reasoning:{ need:["ev_ch4b_boss1","ev_ch4b_boss2"] },
      flags:{ c4_ep8_reasoned:1 }, next:"c4_ep8_torit2" },

    /* 断定的勝利にしない。番長/仲間の独白で「間を取り持つ/法典のかけらを取り戻す」テーマへ橋渡し。 */
    { id:"c4_ep8_torit2", type:"dialogue", speaker:"toritate", location:TORIDE, expression:"shock",
      text:"……私は間違っていたのか。だが問おう。取り立てを緩めれば逃げ得が増える。増えれば、律儀に納めた者の負担がいっそう重くなる。", next:"c4_ep8_toki2" },
    { id:"c4_ep8_toki2", type:"dialogue", speaker:"toki", location:TORIDE,
      text:"……番長。あたしはもう、あんたの道理に縋らない。だが問いは捨てられない。原資を守ることと、束から一人を拾うこと。あたしが、その間に立つ。", next:"c4_ep8_zen" },
    { id:"c4_ep8_zen", type:"dialogue", speaker:"hero", location:TORIDE, bgmScene:"emotion",
      text:"（師匠。あなたが背負いきれなかった問いが、ここにもあった。……徴収の法典のかけらが一つ、手のひらに戻ってきた。九つのうちの、四つめだ。）",
      next:"c4_ep8_hero_final", flags:{ c4_shard4:1 } },
    { id:"c4_ep8_hero_final", type:"dialogue", speaker:"hero", location:TORIDE,
      text:"取立番長。あなたを裁きには来ていない。問いに答え続けに来た。……徴収は、潰すためじゃなく、消えた一枚の名を呼んで数え直すためにある。", next:"c4_ep8_final" },
    { id:"c4_ep8_final", type:"dialogue", speaker:"narrator", location:TORIDE, bgmScene:"field",
      text:"徴収路で、逃避の合言葉が初めて支え合いへ書き換えられた。だが胸には、勝利より重い問いが残った――原資と負担の間を、どう取り持つのか。",
      next:null, flags:{ c4_ep8_done:1, c4_boss_cleared:1, c4_ch04b_done:1 },
      questUpdate:{ qid:"q_ch04b", state:"done", step:9 } }
  ];

  /* 第4〜8話クエスト定義(doneFlag で完了判定)。q_ch04(前半)は無改変の別クエスト。 */
  if(typeof S.registerQuest==="function"){
    S.registerQuest("q_ch04b", {
      title:"払わぬが勝ち・決着",
      chapter:"ch04b",
      steps:["印紙の一枚","一括の現場","束ねる元締","決戦前夜","決戦"],
      doneFlag:"c4_ch04b_done"
    });
  }

  S.register("ch04b", NODES);
  S.CH04B_ID = "ch04b";

  /* メイン章の背骨(S.MAIN)へ、ch04(前半)の続きとして追記する。
     ・c4_ch04_done 後、ホームの「今日の冒険」が自動で本話へ進む導線になる。
     ・S.MAIN 未ロード/未定義でも安全(存在する時だけ push、重複登録も防ぐ)。 */
  if(Array.isArray(S.MAIN)){
    var exists = false;
    for(var i=0;i<S.MAIN.length;i++){ if(S.MAIN[i] && S.MAIN[i].id==="ch04b"){ exists = true; break; } }
    if(!exists){
      S.MAIN.push({ id:"ch04b", no:"第四章", title:"払わぬが勝ち・決着", loc:"徴収路・徴収の砦",
        doneFlag:"c4_ch04b_done", startedFlag:"c4_ep4_start" });
    }
  }
})();
