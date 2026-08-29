"use strict";
/* ============================================================
   story/chapters/chapter-06b.js — 第六章「明日を捨てない」第4〜8話 + 章ボス戦
   docs/story-bible.md / ENDING-CANON 準拠。chapter-06.js の末尾(c6_ch06_done /
   c6_boss_next)から地続きの五話を、別 chapterId="ch06b" で綴じ込む。
   舞台=黄昏の郷ノスタ(郷道から法典広間の奥へ)／国民年金法(subject 6)。
   ・第4話「支えの空白」…障害基礎年金と保険料納付要件。学生の頃の未納で障害基礎年金を却下された者の事件で。
                     免除・納付猶予・学生納付特例の期間が納付要件に算入されることを軸に。過去問(examFmt)混入。
   ・第5話「遺された者へ」…遺族基礎年金・産前産後免除・学生特例。中ボス 給付断ちのハザマ 初登場
                     (自らの未納で障害基礎年金を受けられず、身内を遺族基礎の要件一歩手前で失った過去。
                      『納付要件を緩めれば原資が持たぬ』側へ回った)。
   ・第6話「線を引く者」…中ボス【給付断ちのハザマ v_mid_kuhaku】戦。老齢・障害・遺族基礎/納付要件の総合。
                     ノアとの絆深化(cp6)。
   ・第7話「決戦前夜」…仲間との会話で覚悟。戦う意味の総括(戦闘なし)。師匠ゼンの影を1本繋ぐ。
   ・第8話「決戦」…章ボス【コクネン仙人 v_boss_s6】戦=【章末問題集】(国年の過去問=examFmt中心の高難度セット)。
                 撃破後は断定的勝利にせず、「間を取り持つ/法典のかけらを取り戻す」テーマへ橋渡し。
   ・各話に必ず「経営者/行政/制度側の事情」ビートを置き、断定せず問いを残す(『今は要らない』の板挟み)。
   ・chapter-01*.js〜chapter-05*.js / chapter-06.js のノード/quest/ID/証拠/分岐は
     一切改変しない(別ファイル・別章 "ch06b")。
   ・戦闘接続は既存の橋(story-encounter / story-battle-bridge)。encounter に villain と
     exam(examFmt 混入数)を持たせるだけで、採点・SRS・報酬・問題データには一切触れない。
     ボス戦も新規採点系を作らず、examFmt を多く混ぜた高難度 encounter として既存橋へ委譲する。
   ・eval/new Function ゼロ。全ノードはデータのみ(next は文字列 or {then,else} or null)。全出力は自前 esc2 経由。
   ・立てるフラグ: c6_ep4_done〜c6_ep8_done / c6_boss_cleared / c6_ch06b_done / c6_zen_ash6b / c6_shard6。
     q_ch06(前半)は無改変。ここは boss_cleared までを確定する。
   ・注: 仲間ノアの好感度キーは cp6(前半 c6_noa_join で加入・px は chapter-06.js が sora に上書き済)。
     data-companions.js の cp6(年金仙人・玄斎)とは別レイヤー(物語の関係値 getRel/setRel はパーティ・パッシブと独立)。
   ============================================================ */
(function(){
  var G = (typeof window!=="undefined") ? window : globalThis;
  var S = G.SRStory;
  if(!S || typeof S.register!=="function") return;   /* エンジン未ロードでも安全 */

  /* 第4〜8話の話者を表示名テーブルへ追記(描画層があれば。無ければ素通し)。
     noa/nenkinji/kokunen/kai/mina は既存(chapter-06.js が追記・上書き済み)。中ボスと新被害者のみ追記。
     hazama(中ボス)の px は輪郭線付き人物バスト e_kacho。 */
  if(S.SPEAKERS && typeof S.SPEAKERS==="object"){
    if(!S.SPEAKERS.hazama)   S.SPEAKERS.hazama   = { name:"給付断ちのハザマ", px:"e_kacho" };
    if(!S.SPEAKERS.shogaisha) S.SPEAKERS.shogaisha = { name:"障害を負った若者", px:"ghost" };
    if(!S.SPEAKERS.izoku)    S.SPEAKERS.izoku    = { name:"遺された家族", px:"ghost" };
  }

  var SATO  = "黄昏の郷ノスタ・暮れ方の郷道";
  var MADO  = "黄昏の郷ノスタ・年金窓口の街角";
  var SATEI = "黄昏の郷ノスタ・給付査定の館";
  var YADO  = "黄昏の郷ノスタ・宵の灯りの宿";
  var DAIN  = "黄昏の郷ノスタ・法典広間の奥";

  /* 演習 encounter。opts で相手(villain)と過去問混入数(exam=examFmt の本数)・出題数(n)を指定。
     kind:"train" のまま既存の橋(start*)へ委譲する。ボス戦は exam/n を大きくした高難度セット。subject=6。 */
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
       第4話「支えの空白」
       障害基礎年金と保険料納付要件。学生の頃の未納で障害基礎年金を却下された者の事件で。
       ============================================================ */
    { id:"c6_ep4_open", start:true, type:"dialogue", speaker:"narrator", location:SATO, bgmScene:"emotion",
      text:"帰り道、灯りの消えた一軒家に立ち寄った。若い者が通知を握りしめ、床に座り込んでいた。事故で働けなくなった体を支えるはずの障害基礎年金が、却下されていた。",
      next:"c6_ep4_intro", flags:{ c6_ep4_start:1 },
      questUpdate:{ qid:"q_ch06b", state:"active", step:0 } },
    { id:"c6_ep4_intro", type:"dialogue", speaker:"shogaisha", location:SATO, portrait:"ghost", expression:"shock",
      text:"働けなくなって、障害基礎年金を申請した。……なのに『未納の期間があるから』と却下された。学生の頃、金がなくて未納にした。特例があるなんて知らなかった。", next:"c6_ep4_noa1" },
    { id:"c6_ep4_noa1", type:"dialogue", speaker:"noa", location:SATO, portrait:"sora", expression:"shock",
      text:"……待って。学生だったなら――学生納付特例の対象だったかもしれない。特例や免除の期間は、ただの未納とは違う。納付要件に、ちゃんと算入される。", next:"c6_ep4_noa2" },
    { id:"c6_ep4_noa2", type:"dialogue", speaker:"noa", location:SATO,
      text:"障害基礎年金は、初診日の前に納付要件を満たしていれば受けられる。納めた期間だけじゃない。免除も、猶予も、学生特例の期間も、要件に数える。", next:"c6_ep4_kai1" },
    { id:"c6_ep4_kai1", type:"dialogue", speaker:"kai", location:SATO, portrait:"helm", expression:"angry",
      text:"働けなくなった人間に、『昔の未納だ』の一言で支えごと断つ。……その一枚を、数え直しに行く。", next:"c6_ep4_mina1" },
    { id:"c6_ep4_mina1", type:"dialogue", speaker:"mina", location:SATO, portrait:"wiz",
      text:"障害基礎年金の納付要件は、初診日の前日で、納付済と免除の期間が一定以上あること。または直近一年に未納がないこと。……学生特例も免除も、算入されます。", next:"c6_ep4_choice" },

    { id:"c6_ep4_choice", type:"choice", speaker:"hero", location:SATO, text:"この若者に、どう向き合う?",
      choices:[
        { text:"納付要件と障害基礎年金の筋を、制度で正しく積み直す",
          ideologyChanges:{ law:1, mgmt:1 }, flags:{ c6_ep4_path_law:1 }, next:"c6_ep4_probe" },
        { text:"まず、昔の空白で支えまで断たれた絶望を受け止める",
          ideologyChanges:{ human:1, relief:1 }, flags:{ c6_ep4_path_human:1 }, next:"c6_ep4_alt" }
      ]},
    { id:"c6_ep4_alt", type:"dialogue", speaker:"hero", location:SATO,
      text:"絶望して当然です。いちばん支えが要るときに、昔の空白を盾に断たれた。……その上で。特例や免除の期間を正しく数えれば、納付要件は満たせます。", next:"c6_ep4_probe" },

    { id:"c6_ep4_probe", type:"dialogue", speaker:"narrator", location:MADO, bgmScene:"field",
      text:"『未納がある以上、要件は満たさない』――そう言い張って却下する手先がいた。学生特例も免除も算入されるのに、それを伏せる。",
      next:"c6_ep4_enc1", questUpdate:{ qid:"q_ch06b", state:"active", step:1 } },
    { id:"c6_ep4_enc1", type:"encounter", speaker:"hero", location:MADO, bgmScene:"emotion",
      text:"未納のミノウが、抜き取った学生特例の記録を隠して現れた。障害基礎年金の納付要件・保険料納付済期間・免除と学生特例の算入を、本試験の問いで確かめる。",
      encounter: enc(6, "過去問｜障害基礎年金・納付要件・学生特例の算入を問う", { villain:"v_mino", exam:2 }),
      evidence:"ev_ch6b_shogai", next:"c6_ep4_ev1" },
    { id:"c6_ep4_ev1", type:"dialogue", speaker:"noa", location:MADO,
      text:"学生特例も免除も、納付要件にちゃんと算入される。直近一年に未納がなければ、それでも要件は満たせる。……あとは、握り潰した張本人だ。", next:"c6_ep4_reason" },
    { id:"c6_ep4_reason", type:"reasoning", speaker:"hero", location:MADO, bgmScene:"emotion",
      text:"障害基礎年金、納付要件、免除、猶予、学生特例。――働けなくなった一人を支えへつなぐ条文だ。伏せて『未納は未納』と数えぬこと。それが断つ細工だ。",
      reasoning:{ need:["ev_ch6b_shogai"] },
      flags:{ c6_ep4_reasoned:1 }, next:"c6_ep4_biz" },

    /* 【制度側の事情】断定せず提示 */
    { id:"c6_ep4_biz", type:"dialogue", speaker:"nenkinji", location:MADO,
      text:"……要件を正すのは正しい。だが給付はみな、納めた者の原資から出ていく。誰の未納をどこまで救い上げるか。線ひとつで、原資も給付も揺れる。", next:"c6_ep4_hero2" },
    { id:"c6_ep4_hero2", type:"dialogue", speaker:"hero", location:MADO,
      text:"（原資が納めた者の肩に立つのは本当だ。……でも、要件を偽って支えを抜くのは線引きじゃない。ただの切り捨てだ。）",
      next:"c6_ep4_end", ideologyChanges:{ fair:1, mgmt:1 }, flags:{ c6_ep4_saw_sides:1 } },
    { id:"c6_ep4_end", type:"dialogue", speaker:"narrator", location:SATO, bgmScene:"field",
      text:"若者は正された通知を胸に抱え、初めて明日に目を向けた。ノアはその傍らに膝をつき、算入される特例の月を、慣れた手つきで数えてやった。",
      next:"c6_ep4_hook", flags:{ c6_ep4_done:1 }, questUpdate:{ qid:"q_ch06b", state:"active", step:2 } },
    { id:"c6_ep4_hook", type:"dialogue", speaker:"noa", location:SATO, expression:"angry",
      text:"……でもね、障害の支えを直しても大元がいる。納付要件を口実に、遺族基礎年金も産前産後免除の道も、根こそぎ断ってる査定長。次は、そいつよ。", next:"c6_ep5_open" },

    /* ============================================================
       第5話「遺された者へ」
       遺族基礎年金・産前産後免除・学生特例。中ボス 給付断ちのハザマ 初登場。
       ============================================================ */
    { id:"c6_ep5_open", type:"dialogue", speaker:"narrator", location:SATEI, bgmScene:"emotion",
      text:"給付査定の館。伴侶を亡くした者、子を抱えた遺族、産前産後の母が、遺族基礎年金を断たれて列をなす。奥に、給付断ちのハザマが立っていた。",
      next:"c6_ep5_intro", flags:{ c6_ep5_start:1 } },
    { id:"c6_ep5_intro", type:"dialogue", speaker:"hazama", location:SATEI, portrait:"e_kacho", expression:"angry",
      text:"――納付要件を満たしておらんな。ならば遺族基礎年金は出しようがない。産前産後免除? 申請がなければ知らぬ。……線は、厳しく引くほど長持ちする。", next:"c6_ep5_noa1" },
    { id:"c6_ep5_noa1", type:"dialogue", speaker:"noa", location:SATEI, portrait:"sora", expression:"shock",
      text:"……ハザマ。あなた、昔は誰より給付をつなごうとした人でしょう。自分の未納で支えを受けられず、身内も要件一歩手前で失った。……その人が、なぜ今、断つの。", next:"c6_ep5_hazama2" },
    { id:"c6_ep5_hazama2", type:"dialogue", speaker:"hazama", location:SATEI, expression:"angry",
      text:"……痛みを知るからだ。私が支えを失ったのは、線が甘くて原資が尽きたからだ。ならば厳しく引く。引いて残す。次に本当に遺される者のために。", next:"c6_ep5_mina1" },
    { id:"c6_ep5_mina1", type:"dialogue", speaker:"mina", location:SATEI, portrait:"wiz",
      text:"遺族基礎年金は、死亡した者が納付要件を満たし、遺族が子のある配偶者または子であれば支給されます。産前産後の免除は、納めたものとみなされ要件に算入されます。", next:"c6_ep5_choice" },

    { id:"c6_ep5_choice", type:"choice", speaker:"hero", location:SATEI, text:"断たれた給付の際に、どう立つ?",
      choices:[
        { text:"遺族基礎年金と産前産後免除の要件で、際から一人ずつつなぎ直す",
          ideologyChanges:{ law:1, fair:1 }, flags:{ c6_ep5_path_law:1 }, next:"c6_ep5_probe" },
        { text:"原資を尽くす恐れから線を厳しくした、ハザマの痛みをまず聞く",
          ideologyChanges:{ human:1, mgmt:1 }, flags:{ c6_ep5_path_ask:1 }, next:"c6_ep5_alt" }
      ]},
    { id:"c6_ep5_alt", type:"dialogue", speaker:"hero", location:SATEI,
      text:"原資の底を怖れたのは分かります。金庫が空いた月も確かにあった。……その上で。断つ前に、拾える期間があった。恐れの締め付けを、支える線へ引き直せます。", next:"c6_ep5_probe" },

    { id:"c6_ep5_probe", type:"dialogue", speaker:"narrator", location:SATEI, bgmScene:"field",
      text:"『要件を満たさぬ以上、給付は出せぬ』――手先が、遺族基礎年金の道と産前産後免除の算入を却下の判で塞いでいた。要件を立て直す。",
      next:"c6_ep5_enc1", questUpdate:{ qid:"q_ch06b", state:"active", step:3 } },
    { id:"c6_ep5_enc1", type:"encounter", speaker:"hero", location:SATEI, bgmScene:"emotion",
      text:"未納のミノウが、却下の判の束を盾に立ちはだかった。遺族基礎年金の支給要件・遺族の範囲・産前産後免除の算入・学生特例を、本試験の問いで数え直す。",
      encounter: enc(6, "過去問｜遺族基礎年金・産前産後免除・納付要件を問う", { villain:"v_mino", exam:2 }),
      evidence:"ev_ch6b_izoku", next:"c6_ep5_ev1" },
    { id:"c6_ep5_ev1", type:"dialogue", speaker:"noa", location:SATEI,
      text:"遺族基礎年金は、子のある配偶者や子に支給される。産前産後の免除期間は、納めたものとみなして要件に算入される。……次は、ハザマ本人だ。", next:"c6_ep5_reason" },
    { id:"c6_ep5_reason", type:"reasoning", speaker:"hero", location:SATEI, bgmScene:"emotion",
      text:"遺族基礎年金、遺族の範囲、産前産後免除、学生特例、納付要件。――遺された一人を誰の顔を見て支えるかの条文だ。『満たさぬ』は、道を塞いだ細工だ。",
      reasoning:{ need:["ev_ch6b_izoku"] },
      flags:{ c6_ep5_reasoned:1 }, next:"c6_ep5_biz" },

    /* 【査定長/行政側の事情】断定せず、次話の壁として残す */
    { id:"c6_ep5_biz", type:"dialogue", speaker:"hazama", location:SATEI, expression:"shock",
      text:"……厳しく引くのを悪だと言い切れるか。無条件に埋め、網を広げれば、その原資を誰が納める。私は、次に遺される者のために残そうとしただけだ。", next:"c6_ep5_hero2" },
    { id:"c6_ep5_hero2", type:"dialogue", speaker:"hero", location:SATEI,
      text:"（原資を残す問いは本物だ。……でも、要件で引く線と、拾える期間を伏せて断つ締め付けは混ぜてはいけない。落とすことと守ることは、別の話だ。）",
      next:"c6_ep5_end", ideologyChanges:{ fair:1, mgmt:1 }, flags:{ c6_ep5_saw_sides:1 } },
    { id:"c6_ep5_end", type:"dialogue", speaker:"narrator", location:SATEI, bgmScene:"field",
      text:"ハザマは却下の判を握ったまま動かなかった。鉄の面の奥で、自らの未納で支えを失い、身内を要件一歩手前で見送った頃の顔が、揺れていた。",
      next:"c6_ep5_hook", flags:{ c6_ep5_done:1 }, questUpdate:{ qid:"q_ch06b", state:"active", step:4 } },
    { id:"c6_ep5_hook", type:"dialogue", speaker:"kai", location:SATEI, portrait:"helm", expression:"angry",
      text:"……あいつはまだ判を手放しちゃいねえ。遺族基礎も産前産後免除も学生特例も、全部まとめて要件で断ち落とすつもりだ。行くぞ、調律師。", next:"c6_ep6_open" },

    /* ============================================================
       第6話「線を引く者」— 中ボス【給付断ちのハザマ v_mid_kuhaku】戦
       老齢・障害・遺族基礎/納付要件の総合。ノアとの関係深化。
       ============================================================ */
    { id:"c6_ep6_open", type:"dialogue", speaker:"narrator", location:SATEI, bgmScene:"emotion",
      text:"給付査定の最奥。却下の判の山から、次々と給付が断たれていた。障害基礎を待つ者、つながるはずの家族、産前産後の母。その前に、ハザマが立ちはだかった。",
      next:"c6_ep6_choice", flags:{ c6_ep6_start:1 } },
    { id:"c6_ep6_choice", type:"choice", speaker:"hero", location:SATEI, text:"ハザマの締め付けを、どう解く?",
      choices:[
        { text:"老齢・障害・遺族基礎と納付要件の全体像で、際から一人をつなぎ直す",
          ideologyChanges:{ law:1, fair:1 }, flags:{ c6_ep6_path_law:1 }, next:"c6_ep6_probe" },
        { text:"同じく身近な空白を見過ごした者として、まずハザマに語りかける",
          ideologyChanges:{ human:1, relief:1 }, flags:{ c6_ep6_path_human:1 }, next:"c6_ep6_alt" }
      ]},
    { id:"c6_ep6_alt", type:"dialogue", speaker:"noa", location:SATEI, portrait:"sora",
      text:"ハザマ。わたしも、いちばん近くの空白を見過ごした側よ。……あなたの締め付けは、わたしの後悔の裏返し。断っても恐れは埋まらない。一緒に、引き直そう。", next:"c6_ep6_probe" },

    { id:"c6_ep6_probe", type:"dialogue", speaker:"narrator", location:SATEI, bgmScene:"field",
      text:"判の山から断たれる寸前の給付。障害基礎を待つ者、つながるはずの遺族、産む母。給付の骨組みで、一人ずつ拾い上げる。",
      next:"c6_ep6_enc1", questUpdate:{ qid:"q_ch06b", state:"active", step:5 } },
    { id:"c6_ep6_enc1", type:"encounter", speaker:"hero", location:SATEI,
      text:"まずは給付の骨組み。老齢・障害・遺族の基礎年金、納付要件、免除・猶予・学生特例の算入。断たれかけた一人の給付をつなぐ。",
      encounter: enc(6, "過去問｜老齢・障害・遺族基礎年金・納付要件を問う", { villain:"v_mino", exam:2 }),
      evidence:"ev_ch6b_hone", next:"c6_ep6_ev1" },
    { id:"c6_ep6_ev1", type:"dialogue", speaker:"mina", location:SATEI, portrait:"wiz",
      text:"骨組み、通せました。……ですが、ハザマ本人が却下の判を構えて前に出ます。厳しく断ってきた歳月ごと、正面からぶつかることになります。", next:"c6_ep6_enc2" },
    { id:"c6_ep6_enc2", type:"encounter", speaker:"hero", location:SATEI, bgmScene:"emotion",
      text:"給付断ちのハザマが却下の判を背に立ちはだかった。老齢・障害・遺族の基礎年金、納付要件、免除・猶予・学生特例・産前産後免除の全体像で、給付を解き直す。",
      encounter: enc(6, "過去問｜基礎年金・納付要件の総合(中ボス)", { villain:"v_mid_kuhaku", exam:3 }),
      evidence:"ev_ch6b_hazama", next:"c6_ep6_ev2" },
    { id:"c6_ep6_ev2", type:"dialogue", speaker:"hazama", location:SATEI, expression:"shock",
      text:"……判が、解かれた。幾年も、この判で給付を断ってきた。原資を尽くすくらいならと。……私が怖れたものに、私自身がなっていたのか。", next:"c6_ep6_reason" },
    { id:"c6_ep6_reason", type:"reasoning", speaker:"hero", location:SATEI, bgmScene:"emotion",
      text:"老齢・障害・遺族の基礎年金、納付要件、免除・猶予・学生特例の算入。――判で断った根拠は、そのどれもがつなぎ直せた。厳しく引いた際も、抱えられる。",
      reasoning:{ need:["ev_ch6b_hone","ev_ch6b_hazama"] },
      flags:{ c6_ep6_reasoned:1 }, next:"c6_ep6_biz" },

    /* 【査定長側の事情】断定せず、問いを残す */
    { id:"c6_ep6_biz", type:"dialogue", speaker:"hazama", location:SATEI,
      text:"……最後に問わせろ。私が厳しく引かねば、原資に潰れる郷もあった。全部をつなぐことと、金庫を空にしないこと。両方立てられるのか?", next:"c6_ep6_hero2" },
    { id:"c6_ep6_hero2", type:"dialogue", speaker:"hero", location:SATEI,
      text:"（両方を立てる。原資の重さは要件と正しい負担で支えられる。だからつなぐべき一人まで断たなくていい。……あなた自身も、つながれるべきだった。）",
      next:"c6_ep6_bond", ideologyChanges:{ fair:1, mgmt:1 }, flags:{ c6_ep6_saw_sides:1 } },
    { id:"c6_ep6_bond", type:"dialogue", speaker:"noa", location:SATEI, bgmScene:"emotion", expression:"shock",
      text:"……調律師さん。わたしは拾う速さだけを誇りにしてきた。……でもあなたは、わたしが見過ごしかけた空白も、ハザマが断った恐れも、両方拾おうとした。",
      next:"c6_ep6_end", relationshipChanges:{ cp6:1 }, flags:{ c6_ep6_bonded:1 } },
    { id:"c6_ep6_end", type:"dialogue", speaker:"narrator", location:SATEI, bgmScene:"field",
      text:"却下の判が解かれ、断たれかけた給付が一つまた一つと支えの内へ色を取り戻した。だが法典広間の最奥では、コクネン仙人が影を人の形に立ち上げていた。",
      next:"c6_ep6_hook", flags:{ c6_ep6_done:1 }, questUpdate:{ qid:"q_ch06b", state:"active", step:6 } },
    { id:"c6_ep6_hook", type:"dialogue", speaker:"noa", location:SATEI, expression:"angry",
      text:"……あれが大元。『今は要らない』って先送りと有限の原資が、天秤のまま仙人の形になってる。明日、法典広間の奥で決着。", next:"c6_ep7_open" },

    /* ============================================================
       第7話「決戦前夜」
       仲間との会話で覚悟。戦う意味の総括(戦闘なし)。師匠ゼンの影を1本繋ぐ。
       ============================================================ */
    { id:"c6_ep7_open", type:"dialogue", speaker:"narrator", location:YADO, bgmScene:"town",
      text:"宵の灯りの宿。灯りを囲み、一行は温かい湯を分け合った。明日、この郷の板挟みそのものと戦う。その前の、静かな夜だった。",
      next:"c6_ep7_noa1", flags:{ c6_ep7_start:1 } },
    { id:"c6_ep7_noa1", type:"dialogue", speaker:"noa", location:YADO, portrait:"sora",
      text:"わたしは拾った空白の数だけで自分を許してきた。……でも今は分かる。無知のまま見過ごされた人と、要件で厳しく断たれた人を、両方数え直さなきゃ。", next:"c6_ep7_kai1" },
    { id:"c6_ep7_kai1", type:"dialogue", speaker:"kai", location:YADO, expression:"angry",
      text:"悪いのは一人の悪人じゃねえ。『今は要らない』を、みんなが明日も見ずに口にしてた。……ハザマも、底を怖れて断った側だった。地続きなんだよな。", next:"c6_ep7_mina1" },
    { id:"c6_ep7_mina1", type:"dialogue", speaker:"mina", location:YADO, portrait:"wiz",
      text:"『今は要らない』の未納は、いつか必ず老後の空白になる。その恐れで要件を厳しくすれば、つながるはずの一人がこぼれる。……明日突きつけるのは、その一点です。", next:"c6_ep7_hero1" },
    { id:"c6_ep7_hero1", type:"dialogue", speaker:"hero", location:YADO,
      text:"経営者も行政も悪じゃない。原資には限りがある。今日の暮らしを守りたい者も、底を怖れる財政もある。……その全部を抱えて、こぼれる一人をつなぎ直す。", next:"c6_ep7_choice" },

    { id:"c6_ep7_choice", type:"choice", speaker:"hero", location:YADO, text:"覚悟を、言葉にする。",
      choices:[
        { text:"「今は要らない」を「続く支え合いの原資」に変える。その第一歩として戦う",
          ideologyChanges:{ fair:1, mgmt:1 }, flags:{ c6_ep7_vow_bridge:1 }, next:"c6_ep7_vow" },
        { text:"無知で断たれ、要件で落とされた一人ひとりを、支えへつなぎ直すために戦う",
          ideologyChanges:{ human:1, relief:1 }, flags:{ c6_ep7_vow_count:1 }, next:"c6_ep7_vow" }
      ]},
    { id:"c6_ep7_vow", type:"dialogue", speaker:"hero", location:YADO, bgmScene:"emotion",
      text:"仙人を倒しに行くんじゃない。『今は要らない』を『続く支え合いの原資』に書き換えに行く。誰の顔も見落とさない線を――明日、法典広間で。", next:"c6_ep7_zen" },
    { id:"c6_ep7_zen", type:"dialogue", speaker:"narrator", location:YADO, bgmScene:"emotion",
      text:"ノアが持ち出した古い国年台帳。一番下から紙片が滑り落ちた。『今日を生きる者に明日の値札を突きつけるな。だが、その明日を黙って削らせるな』――師匠ゼンの筆跡。",
      next:"c6_ep7_end", flags:{ c6_zen_ash6b:1 } },
    { id:"c6_ep7_end", type:"dialogue", speaker:"hero", location:YADO, bgmScene:"field",
      text:"（師匠。この郷でも線を引き直そうとして、板挟みを背負いきれずに去ったんですね。……その宿題を、おれたちが引き受けます。明日、広間の奥で。）",
      next:"c6_ep7_hook", flags:{ c6_ep7_done:1 }, questUpdate:{ qid:"q_ch06b", state:"active", step:7 } },
    { id:"c6_ep7_hook", type:"dialogue", speaker:"narrator", location:YADO,
      text:"夜が明けた。一行は薄暗い郷道を抜け、法典広間の最奥へと歩を進めた。今日と明日の板挟みが、いっそう濃く満ちていた。", next:"c6_ep8_open" },

    /* ============================================================
       第8話「決戦」— 章ボス【コクネン仙人 v_boss_s6】戦
       【章末問題集】=これまでの国年の過去問を集めた高難度セット(examFmt中心・タイト)。
       登場アニメ+『敵が問題を突きつける』枠組みは story-encounter が villain から自動生成する。
       撃破後は断定的勝利にせず「間を取り持つ/法典のかけらを取り戻す」テーマへ橋渡し(ENDING-CANON/introのかけら)。
       ============================================================ */
    { id:"c6_ep8_open", type:"dialogue", speaker:"narrator", location:DAIN, bgmScene:"emotion",
      text:"法典広間の最奥。今日と明日の板挟みが、ゆっくりと人の形に立ち上がった。納めぬ一月ごとに、見えない未来へ小さな空白を積み上げる、その先送りそのもの。",
      next:"c6_ep8_appear", flags:{ c6_ep8_start:1 } },
    { id:"c6_ep8_appear", type:"dialogue", speaker:"narrator", location:DAIN,
      text:"仙人が台帳の山を広げると、空白に沈んだ者が影から浮かび上がった。免除を伏せられた者、支えを断たれた者、遺された家族、産前産後の母、先送りを重ねた者の列。", next:"c6_ep8_kokunen1" },
    { id:"c6_ep8_kokunen1", type:"dialogue", speaker:"kokunen", location:DAIN, portrait:"e_gizo", expression:"angry",
      text:"よく来た、調律師。問おう。納めたか。明日は残ったか。……その『後で』を積み上げた先の空白を、誰が数える? 数えぬのが、世の習いだ。", next:"c6_ep8_hero1" },
    { id:"c6_ep8_hero1", type:"dialogue", speaker:"hero", location:DAIN,
      text:"覆す。カイも、ミナも、ノアもいる。伏せられた者も、断たれた者も顔を上げた。……その板挟みを、今日、国年の全体像で引き受ける。明日を、捨てさせないために。", next:"c6_ep8_noa1" },
    { id:"c6_ep8_noa1", type:"dialogue", speaker:"noa", location:DAIN, portrait:"sora", expression:"angry",
      text:"御託はいい。積み上げた過去問の全部を、ここでぶつける。……わたしが見過ごしかけた空白も、ハザマが断った恐れも、今日で終いにする。", next:"c6_ep8_brief" },
    { id:"c6_ep8_brief", type:"dialogue", speaker:"narrator", location:DAIN, bgmScene:"emotion",
      text:"これは総決算。免除・猶予・学生特例・産前産後免除、受給資格期間・合算対象、付加年金・任意加入、老齢・障害・遺族――そのすべてが【章末問題集】として襲いかかる。",
      next:"c6_ep8_enc1", questUpdate:{ qid:"q_ch06b", state:"active", step:8 } },
    { id:"c6_ep8_enc1", type:"encounter", speaker:"hero", location:DAIN, bgmScene:"emotion",
      text:"第一幕・免除/期間編。申請免除・法定免除・納付猶予・学生特例・産前産後免除、受給資格期間・合算対象期間、付加年金・任意加入を、高密度で叩き込む。",
      encounter: enc(6, "章末問題集｜免除・受給資格期間・付加年金・任意加入編(高難度)", { villain:"v_boss_s6", n:12, exam:5 }),
      evidence:"ev_ch6b_boss1", next:"c6_ep8_mid" },
    { id:"c6_ep8_mid", type:"dialogue", speaker:"kokunen", location:DAIN, expression:"shock",
      text:"……免除と期間は越えたか。だが明日の支えはそれだけではない。老齢、障害、遺族――受給要件はどこまでも細かい。その細かさに、情がどこまで届く。", next:"c6_ep8_enc2" },
    { id:"c6_ep8_enc2", type:"encounter", speaker:"hero", location:DAIN, bgmScene:"emotion",
      text:"第二幕・基礎年金編。老齢基礎年金の受給資格期間と年金額、障害基礎年金の納付要件と等級、遺族基礎年金の遺族の範囲、任意加入を、同じ高密度で最後まで。",
      encounter: enc(6, "章末問題集｜老齢・障害・遺族基礎年金・任意加入編(高難度)", { villain:"v_boss_s6", n:12, exam:5 }),
      evidence:"ev_ch6b_boss2", next:"c6_ep8_broke" },
    { id:"c6_ep8_broke", type:"dialogue", speaker:"narrator", location:DAIN, bgmScene:"emotion",
      text:"最後の一問が置かれた瞬間、台帳の山が内側から崩れ始めた。空白に沈んでいた者たちが名を呼ばれ、支えの内へ色を取り戻していく。", next:"c6_ep8_reason" },
    { id:"c6_ep8_reason", type:"reasoning", speaker:"hero", location:DAIN, bgmScene:"emotion",
      text:"免除・猶予・学生特例・産前産後免除、受給資格期間・合算対象、付加年金・任意加入、老齢・障害・遺族。――空白に沈んだ一人を支え直すための条文だった。",
      reasoning:{ need:["ev_ch6b_boss1","ev_ch6b_boss2"] },
      flags:{ c6_ep8_reasoned:1 }, next:"c6_ep8_kokunen2" },

    /* 断定的勝利にしない。仙人/仲間の独白で「間を取り持つ/法典のかけらを取り戻す」テーマへ橋渡し。 */
    { id:"c6_ep8_kokunen2", type:"dialogue", speaker:"kokunen", location:DAIN, expression:"shock",
      text:"……私は間違っていたのか。だが問おう。要件を緩めれば原資が尽きる。尽きれば、次に老いる者から先に支えが消える。私はそう信じてきた。", next:"c6_ep8_noa2" },
    { id:"c6_ep8_noa2", type:"dialogue", speaker:"noa", location:DAIN, portrait:"sora",
      text:"……仙人。わたしはもう、あなたの世の習いにも、昔の自分の無知にも縋らない。だが問いは捨てられない。わたしが、その間に立つ。", next:"c6_ep8_zen" },
    { id:"c6_ep8_zen", type:"dialogue", speaker:"hero", location:DAIN, bgmScene:"emotion",
      text:"（師匠。あなたが背負いきれなかった問いが、ここにもあった。……国年の法典のかけらが一つ、手のひらに戻ってきた。九つのうちの、六つめだ。）",
      next:"c6_ep8_hero_final", flags:{ c6_shard6:1 } },
    { id:"c6_ep8_hero_final", type:"dialogue", speaker:"hero", location:DAIN,
      text:"コクネン仙人。あなたを裁きには来ていない。問いに答え続けに来た。……国民年金は、切り捨てるためじゃなく、明日を削られた一人の名を呼んでつなぎ直すためにある。", next:"c6_ep8_final" },
    { id:"c6_ep8_final", type:"dialogue", speaker:"narrator", location:DAIN, bgmScene:"field",
      text:"ノスタで、先送りが初めて『見えない明日の重さ』とともに立て直された。だが胸には、勝利より重い問いが残った――今日と明日の間を、どう取り持つのか。",
      next:null, flags:{ c6_ep8_done:1, c6_boss_cleared:1, c6_ch06b_done:1 },
      questUpdate:{ qid:"q_ch06b", state:"done", step:9 } }
  ];

  /* 第4〜8話クエスト定義(doneFlag で完了判定)。q_ch06(前半)は無改変の別クエスト。 */
  if(typeof S.registerQuest==="function"){
    S.registerQuest("q_ch06b", {
      title:"明日を捨てない・決着",
      chapter:"ch06b",
      steps:["支えの空白","遺された者へ","線を引く者","決戦前夜","決戦"],
      doneFlag:"c6_ch06b_done"
    });
  }

  S.register("ch06b", NODES);
  S.CH06B_ID = "ch06b";

  /* メイン章の背骨(S.MAIN)へ、ch06(前半)の続きとして追記する。
     ・c6_ch06_done 後、ホームの「今日の冒険」が自動で本話へ進む導線になる。
     ・S.MAIN 未ロード/未定義でも安全(存在する時だけ push、重複登録も防ぐ)。 */
  if(Array.isArray(S.MAIN)){
    var exists = false;
    for(var i=0;i<S.MAIN.length;i++){ if(S.MAIN[i] && S.MAIN[i].id==="ch06b"){ exists = true; break; } }
    if(!exists){
      S.MAIN.push({ id:"ch06b", no:"第六章", title:"明日を捨てない・決着", loc:"黄昏の郷ノスタ・法典広間の奥",
        doneFlag:"c6_ch06b_done", startedFlag:"c6_ep4_start" });
    }
  }
})();
