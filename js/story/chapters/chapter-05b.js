"use strict";
/* ============================================================
   story/chapters/chapter-05b.js — 第五章「誰も見捨てない」第4〜8話 + 章ボス戦
   docs/story-bible.md / ENDING-CANON 準拠。chapter-05.js の末尾(c5_ch05_done /
   c5_boss_next)から地続きの五話を、別 chapterId="ch05b" で綴じ込む。
   舞台=医療都市メディカ（慈救の街から法典広間の奥へ）／健康保険法(subject 5)。
   ・第4話「産む者の支え」…標準賞与額・出産手当金・出産育児一時金を、産休で支えを断たれた者の事件で。
                     過去問(examFmt)混入。制度側の事情(有限の原資・誰が線を引くか)を継続。セラ関係深化の芽。
   ・第5話「資格の際」…資格の得喪・任意継続被保険者・被扶養者。中ボス 資格断ちのレヴィ 初登場
                     (自らも退職で健保を失い家族を潰された過去。『網を締めねば原資が持たぬ』側へ回った)。
   ・第6話「網を締める者」…中ボス【資格断ちのレヴィ v_mid_shikaku】戦。標準賞与・任意継続・被扶養者・出産の総合。
                     セラとの絆深化(cp5)。
   ・第7話「決戦前夜」…仲間との会話で覚悟。戦う意味の総括(戦闘なし)。師匠ゼンの影を1本繋ぐ。
   ・第8話「決戦」…章ボス【ケンポ将軍 v_boss_s5】戦=【章末問題集】(健保の過去問=examFmt中心の高難度セット)。
                 撃破後は断定的勝利にせず、「間を取り持つ/法典のかけらを取り戻す」テーマへ橋渡し。
   ・各話に必ず「経営者/行政/制度側の事情」ビートを置き、断定せず問いを残す(『誰も見捨てない』の板挟み)。
   ・chapter-01*.js〜chapter-04*.js / chapter-05.js のノード/quest/ID/証拠/分岐は
     一切改変しない(別ファイル・別章 "ch05b")。
   ・戦闘接続は既存の橋(story-encounter / story-battle-bridge)。encounter に villain と
     exam(examFmt 混入数)を持たせるだけで、採点・SRS・報酬・問題データには一切触れない。
     ボス戦も新規採点系を作らず、examFmt を多く混ぜた高難度 encounter として既存橋へ委譲する。
   ・eval/new Function ゼロ。全ノードはデータのみ(next は文字列 or {then,else} or null)。全出力は自前 esc2 経由。
   ・立てるフラグ: c5_ep4_done〜c5_ep8_done / c5_boss_cleared / c5_ch05b_done / c5_zen_ash5b / c5_shard5。
     q_ch05(前半)は無改変。ここは boss_cleared までを確定する。
   ・注: 仲間セラの好感度キーは cp5(前半 c5_sera_join で加入済)。data-companions.js の cp5(健保のナース・あおい)
     とは別レイヤー(物語の関係値 getRel/setRel はパーティ・パッシブと独立)なので、既存テストを割らずに深化させる。
   ============================================================ */
(function(){
  var G = (typeof window!=="undefined") ? window : globalThis;
  var S = G.SRStory;
  if(!S || typeof S.register!=="function") return;   /* エンジン未ロードでも安全 */

  /* 第4〜8話の話者を表示名テーブルへ追記(描画層があれば。無ければ素通し)。
     sera/kanja/kenriji/karugi/zofi/kenpo/kai/mina は既存(chapter-05.js が追記済み)。中ボスと新被害者のみ追記。
     revi(中ボス)の px は輪郭線付き人物バスト e_roukisai。 */
  if(S.SPEAKERS && typeof S.SPEAKERS==="object"){
    if(!S.SPEAKERS.revi)  S.SPEAKERS.revi  = { name:"資格断ちのレヴィ", px:"e_roukisai" };
    if(!S.SPEAKERS.sanpu) S.SPEAKERS.sanpu = { name:"支えを断たれた産休の母", px:"ghost" };
  }

  var SANJO = "医療都市メディカ・産所の街角";
  var MADO  = "医療都市メディカ・給付窓口の街角";
  var SAIGO = "医療都市メディカ・資格審査の際";
  var YAEI  = "医療都市メディカ・施療院の灯り";
  var DAIN  = "医療都市メディカ・法典広間の奥";

  /* 演習 encounter。opts で相手(villain)と過去問混入数(exam=examFmt の本数)・出題数(n)を指定。
     kind:"train" のまま既存の橋(start*)へ委譲する。ボス戦は exam/n を大きくした高難度セット。subject=5。 */
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
       第4話「産む者の支え」
       標準賞与額・出産手当金・出産育児一時金を、産休で支えを断たれた者の事件で。
       ============================================================ */
    { id:"c5_ep4_open", start:true, type:"dialogue", speaker:"narrator", location:SANJO, bgmScene:"emotion",
      text:"帰り道、六人は産所の街角に立ち寄った。その軒下で、身重の母が一枚の通知を手に青ざめていた。産休の間の支えが、根こそぎ止められていた。",
      next:"c5_ep4_intro", flags:{ c5_ep4_start:1 },
      questUpdate:{ qid:"q_ch05b", state:"active", step:0 } },
    { id:"c5_ep4_intro", type:"dialogue", speaker:"sanpu", location:SANJO, portrait:"ghost", expression:"shock",
      text:"産前産後は働けない。だから出産手当金で繋げるはずだった。……なのに『賞与を入れ忘れていた』『一時金は出せない』と。子を迎える支度が、何もできない。", next:"c5_ep4_sera1" },
    { id:"c5_ep4_sera1", type:"dialogue", speaker:"sera", location:SANJO, portrait:"mina", expression:"shock",
      text:"……大丈夫。あなたの支えは止めさせない。出産手当金は産前産後の生活費。標準賞与額を落とせば土台が痩せる。一時金は出産そのものへの給付。別々に、ちゃんと出る。", next:"c5_ep4_sera2" },
    { id:"c5_ep4_sera2", type:"dialogue", speaker:"sera", location:SANJO,
      text:"……昔のわたしなら、自分の蓄えを崩してでも立て替えてた。でもそれで原資を空にした。だから今は、あなたが本来受け取れるものを、あなたの手に戻す。", next:"c5_ep4_kai1" },
    { id:"c5_ep4_kai1", type:"dialogue", speaker:"kai", location:SANJO, portrait:"helm", expression:"angry",
      text:"賞与を一回数え忘れたことにするだけで、産む人間の支度が消える。健保は、いちばん無防備なときに人を支える約束だろ。……その一枚を、数え直す。", next:"c5_ep4_mina1" },
    { id:"c5_ep4_mina1", type:"dialogue", speaker:"mina", location:SANJO, portrait:"wiz",
      text:"標準賞与額は賞与から算定され、標準報酬とは別に給付の土台になります。出産手当金は生活費、一時金は出産費用への給付。目的も算定も別です。", next:"c5_ep4_choice" },

    { id:"c5_ep4_choice", type:"choice", speaker:"hero", location:SANJO, text:"この母に、どう向き合う?",
      choices:[
        { text:"標準賞与額と出産の給付の筋を、制度で正しく積み直す",
          ideologyChanges:{ law:1, fair:1 }, flags:{ c5_ep4_path_law:1 }, next:"c5_ep4_probe" },
        { text:"まず、命を迎える支度を奪われた不安を受け止める",
          ideologyChanges:{ human:1, relief:1 }, flags:{ c5_ep4_path_human:1 }, next:"c5_ep4_alt" }
      ]},
    { id:"c5_ep4_alt", type:"dialogue", speaker:"hero", location:SANJO,
      text:"不安で当然です。いちばん守られるべきときに支えを抜かれた。……その上で。賞与を正しく数え、給付を分けて立て直せば、産休の暮らしは支えられます。", next:"c5_ep4_probe" },

    { id:"c5_ep4_probe", type:"dialogue", speaker:"narrator", location:MADO, bgmScene:"field",
      text:"『賞与は入れ忘れた』『一時金は対象外だ』――そう言い張って産む者の支えを痩せさせる手先がいた。標準賞与額と出産の給付を立て直す。",
      next:"c5_ep4_enc1", questUpdate:{ qid:"q_ch05b", state:"active", step:1 } },
    { id:"c5_ep4_enc1", type:"encounter", speaker:"hero", location:MADO, bgmScene:"emotion",
      text:"等級ずらしのヒョウガが、抜き取った賞与の帳簿を隠して現れた。標準賞与額の算定・出産手当金・出産育児一時金を、本試験の問いで確かめる。",
      encounter: enc(5, "過去問｜標準賞与額・出産手当金・出産育児一時金を問う", { villain:"v_hyoho", exam:2 }),
      evidence:"ev_ch5b_shoyo", next:"c5_ep4_ev1" },
    { id:"c5_ep4_ev1", type:"dialogue", speaker:"mina", location:MADO, portrait:"wiz",
      text:"筋、証拠に残せました。標準賞与額は賞与から算定され、標準報酬とは別に土台を作る。出産手当金と一時金は別々に、ちゃんと出ます。", next:"c5_ep4_reason" },
    { id:"c5_ep4_reason", type:"reasoning", speaker:"hero", location:MADO, bgmScene:"emotion",
      text:"標準賞与額、出産手当金、出産育児一時金。――命を迎える者を、いくら・どの給付で支えるかの条文だ。賞与を落とし、給付を混ぜる。それが細工だ。",
      reasoning:{ need:["ev_ch5b_shoyo"] },
      flags:{ c5_ep4_reasoned:1 }, next:"c5_ep4_biz" },

    /* 【制度側の事情】断定せず提示 */
    { id:"c5_ep4_biz", type:"dialogue", speaker:"kenriji", location:MADO,
      text:"……支えを正すのは正しい。だが給付はみな、標準報酬と標準賞与の土台から出ていく。誰の賞与をどこまで算入するか。線ひとつで、原資も給付も揺れる。", next:"c5_ep4_hero2" },
    { id:"c5_ep4_hero2", type:"dialogue", speaker:"hero", location:MADO,
      text:"（原資が土台の上に立つのは本当だ。……でも、土台を偽って産む者の支えを抜くのは線引きじゃない。ただの切り捨てだ。）",
      next:"c5_ep4_end", ideologyChanges:{ fair:1, mgmt:1 }, flags:{ c5_ep4_saw_sides:1 } },
    { id:"c5_ep4_end", type:"dialogue", speaker:"narrator", location:SANJO, bgmScene:"field",
      text:"母は正された通知を胸に抱え、初めて子の名を口にした。セラはその傍らに膝をつき、支給される日と額を、支度の一つひとつに重ねて数えてやった。",
      next:"c5_ep4_hook", flags:{ c5_ep4_done:1 }, questUpdate:{ qid:"q_ch05b", state:"active", step:2 } },
    { id:"c5_ep4_hook", type:"dialogue", speaker:"sera", location:SANJO, expression:"angry",
      text:"……でもね、産む者の支えを直しても大元がいる。退職や資格喪失を口実に、任意継続の道も被扶養者の網も、根こそぎ締めてる審査長。次は、そいつよ。", next:"c5_ep5_open" },

    /* ============================================================
       第5話「資格の際」
       資格の得喪・任意継続被保険者・被扶養者。中ボス 資格断ちのレヴィ 初登場。
       ============================================================ */
    { id:"c5_ep5_open", type:"dialogue", speaker:"narrator", location:SAIGO, bgmScene:"emotion",
      text:"資格審査の際。健保の網の内と外を分ける境目。退職者、外された家族、産前産後の者が資格を断たれて列をなす。奥に、資格断ちのレヴィが立っていた。",
      next:"c5_ep5_intro", flags:{ c5_ep5_start:1 } },
    { id:"c5_ep5_intro", type:"dialogue", speaker:"revi", location:SAIGO, portrait:"e_roukisai", expression:"angry",
      text:"――退職したのだろう。ならば資格はその日で終いだ。任意継続? 期限は過ぎた。被扶養者? 収入が一円でも多ければ、網の外。……締めるのが慈悲さ。", next:"c5_ep5_sera1" },
    { id:"c5_ep5_sera1", type:"dialogue", speaker:"sera", location:SAIGO, portrait:"mina", expression:"shock",
      text:"……レヴィ。あなた、昔は誰より資格を繋ごうとしてた人でしょう。無保険で、家族の医療費に潰された。……その痛みを知る人が、なぜ今、断つの。", next:"c5_ep5_revi2" },
    { id:"c5_ep5_revi2", type:"dialogue", speaker:"revi", location:SAIGO, expression:"angry",
      text:"……痛みを知るからだ。私が潰れたのは、網が広すぎて原資が尽きたからだ。ならば締める。締めて残す。次に本当に病む者のために。", next:"c5_ep5_mina1" },
    { id:"c5_ep5_mina1", type:"dialogue", speaker:"mina", location:SAIGO, portrait:"wiz",
      text:"任意継続被保険者は、期間内に申し出れば二年を限度に続けられます。被扶養者は生計維持と収入の要件を満たす親族。……締めるのと、要件で線を引くのは違います。", next:"c5_ep5_choice" },

    { id:"c5_ep5_choice", type:"choice", speaker:"hero", location:SAIGO, text:"締められた資格の際に、どう立つ?",
      choices:[
        { text:"任意継続と被扶養者の要件で、際から一人ずつ繋ぎ直す",
          ideologyChanges:{ law:1, fair:1 }, flags:{ c5_ep5_path_law:1 }, next:"c5_ep5_probe" },
        { text:"原資を尽くす恐れから網を締める側に回った、レヴィの痛みをまず聞く",
          ideologyChanges:{ human:1, mgmt:1 }, flags:{ c5_ep5_path_ask:1 }, next:"c5_ep5_alt" }
      ]},
    { id:"c5_ep5_alt", type:"dialogue", speaker:"hero", location:SAIGO,
      text:"原資の底を怖れたのは分かります。金庫が空いた月も確かにあった。……その上で。締めて落とす前に、任意継続という道があった。恐れを、支える線へ引き直せます。", next:"c5_ep5_probe" },

    { id:"c5_ep5_probe", type:"dialogue", speaker:"narrator", location:SAIGO, bgmScene:"field",
      text:"『資格はその日で終いだ』――手先が、任意継続の道と被扶養者の網を喪失の判で塞いでいた。資格の得喪と要件を立て直す。",
      next:"c5_ep5_enc1", questUpdate:{ qid:"q_ch05b", state:"active", step:3 } },
    { id:"c5_ep5_enc1", type:"encounter", speaker:"hero", location:SAIGO, bgmScene:"emotion",
      text:"等級ずらしのヒョウガが、喪失の判の束を盾に立ちはだかった。資格の取得と喪失・任意継続の要件と期限・被扶養者の範囲を、本試験の問いで数え直す。",
      encounter: enc(5, "過去問｜資格の得喪・任意継続・被扶養者を問う", { villain:"v_hyoho", exam:2 }),
      evidence:"ev_ch5b_shikaku", next:"c5_ep5_ev1" },
    { id:"c5_ep5_ev1", type:"dialogue", speaker:"sera", location:SAIGO,
      text:"任意継続は、喪失の日から定められた期間内に申し出れば二年を限度に続けられる。被扶養者は要件を満たせば網の内。……次は、レヴィ本人だ。", next:"c5_ep5_reason" },
    { id:"c5_ep5_reason", type:"reasoning", speaker:"hero", location:SAIGO, bgmScene:"emotion",
      text:"資格の得喪、任意継続、被扶養者の範囲。――網の内と外を、誰の顔を見て分けるかの条文だ。『その日で終い』は、道と網を塞いだ細工だ。",
      reasoning:{ need:["ev_ch5b_shikaku"] },
      flags:{ c5_ep5_reasoned:1 }, next:"c5_ep5_biz" },

    /* 【審査長/行政側の事情】断定せず、次話の壁として残す */
    { id:"c5_ep5_biz", type:"dialogue", speaker:"revi", location:SAIGO, expression:"shock",
      text:"……締めるのを悪だと言い切れるか。誰も彼も繋ぎ、家族の網を広げれば、保険料を誰が納める。私は、次に病む者のために原資を残そうとしただけだ。", next:"c5_ep5_hero2" },
    { id:"c5_ep5_hero2", type:"dialogue", speaker:"hero", location:SAIGO,
      text:"（原資を残す問いは本物だ。……でも、要件で引く線と、その日で断つ締め付けは混ぜてはいけない。繋ぐべき一人を落とすことと、原資を守ることは別の話だ。）",
      next:"c5_ep5_end", ideologyChanges:{ fair:1, mgmt:1 }, flags:{ c5_ep5_saw_sides:1 } },
    { id:"c5_ep5_end", type:"dialogue", speaker:"narrator", location:SAIGO, bgmScene:"field",
      text:"レヴィは喪失の判を握ったまま、動かなかった。鉄の面の奥で、無保険で家族を看取れなかった頃の顔が、消せずに揺れていた。",
      next:"c5_ep5_hook", flags:{ c5_ep5_done:1 }, questUpdate:{ qid:"q_ch05b", state:"active", step:4 } },
    { id:"c5_ep5_hook", type:"dialogue", speaker:"kai", location:SAIGO, portrait:"helm", expression:"angry",
      text:"……あいつはまだ判を手放しちゃいねえ。任意継続も被扶養者も出産の支えも、全部まとめて締め落とすつもりだ。行くぞ、調律師。", next:"c5_ep6_open" },

    /* ============================================================
       第6話「網を締める者」— 中ボス【資格断ちのレヴィ v_mid_shikaku】戦
       標準賞与・任意継続・被扶養者・出産の総合。セラとの関係深化。
       ============================================================ */
    { id:"c5_ep6_open", type:"dialogue", speaker:"narrator", location:SAIGO, bgmScene:"emotion",
      text:"資格審査の最奥。喪失の判の山から、次々と資格が断たれていた。任意継続を待つ退職者、繋がるはずの家族、産む母。その前に、レヴィが立ちはだかった。",
      next:"c5_ep6_choice", flags:{ c5_ep6_start:1 } },
    { id:"c5_ep6_choice", type:"choice", speaker:"hero", location:SAIGO, text:"レヴィの締め付けを、どう解く?",
      choices:[
        { text:"標準賞与・任意継続・被扶養者・出産の全体像で、際から一人を繋ぎ直す",
          ideologyChanges:{ law:1, fair:1 }, flags:{ c5_ep6_path_law:1 }, next:"c5_ep6_probe" },
        { text:"同じく原資の底を怖れた者として、まずレヴィに語りかける",
          ideologyChanges:{ human:1, relief:1 }, flags:{ c5_ep6_path_human:1 }, next:"c5_ep6_alt" }
      ]},
    { id:"c5_ep6_alt", type:"dialogue", speaker:"sera", location:SAIGO, portrait:"mina",
      text:"レヴィ。わたしも原資を空にした側よ。無条件に救って、別の病棟の給付を遅らせた。……あなたの締め付けは、わたしの後悔の裏返し。一緒に、引き直そう。", next:"c5_ep6_probe" },

    { id:"c5_ep6_probe", type:"dialogue", speaker:"narrator", location:SAIGO, bgmScene:"field",
      text:"判の山から断たれる寸前の資格。任意継続を待つ退職者、繋がるはずの家族、産む母。給付の骨組みで、一人ずつ拾い上げる。",
      next:"c5_ep6_enc1", questUpdate:{ qid:"q_ch05b", state:"active", step:5 } },
    { id:"c5_ep6_enc1", type:"encounter", speaker:"hero", location:SAIGO,
      text:"まずは給付の骨組み。標準報酬・標準賞与額、傷病手当金、高額療養費、被扶養者、任意継続。断たれかけた一人の資格を繋ぐ。",
      encounter: enc(5, "過去問｜標準報酬・給付・任意継続・被扶養者を問う", { villain:"v_hyoho", exam:2 }),
      evidence:"ev_ch5b_hone", next:"c5_ep6_ev1" },
    { id:"c5_ep6_ev1", type:"dialogue", speaker:"mina", location:SAIGO, portrait:"wiz",
      text:"骨組み、通せました。……ですが、レヴィ本人が喪失の判を構えて前に出ます。締めてきた歳月ごと、正面からぶつかることになります。", next:"c5_ep6_enc2" },
    { id:"c5_ep6_enc2", type:"encounter", speaker:"hero", location:SAIGO, bgmScene:"emotion",
      text:"資格断ちのレヴィが喪失の判を背に立ちはだかった。標準報酬・標準賞与、資格の得喪、任意継続、被扶養者、傷病手当金・高額療養費・出産の全体像で、網を解き直す。",
      encounter: enc(5, "過去問｜健保給付の総合(中ボス)", { villain:"v_mid_shikaku", exam:3 }),
      evidence:"ev_ch5b_revi", next:"c5_ep6_ev2" },
    { id:"c5_ep6_ev2", type:"dialogue", speaker:"revi", location:SAIGO, expression:"shock",
      text:"……網が、解かれた。幾年も、この判で資格を断ってきた。無条件に繋いで潰れるくらいならと。……私が怖れたものに、私自身がなっていたのか。", next:"c5_ep6_reason" },
    { id:"c5_ep6_reason", type:"reasoning", speaker:"hero", location:SAIGO, bgmScene:"emotion",
      text:"標準報酬・標準賞与、資格の得喪、任意継続、被扶養者、給付の全体。――判で断った根拠は、そのどれもが繋ぎ直せた。怖れて締めた際も、抱えられる。",
      reasoning:{ need:["ev_ch5b_hone","ev_ch5b_revi"] },
      flags:{ c5_ep6_reasoned:1 }, next:"c5_ep6_biz" },

    /* 【審査長側の事情】断定せず、問いを残す */
    { id:"c5_ep6_biz", type:"dialogue", speaker:"revi", location:SAIGO,
      text:"……最後に問わせろ。私が締めなければ、原資に潰れる街もあった。全部を繋ぐことと、金庫を空にしないこと。両方立てられるのか?", next:"c5_ep6_hero2" },
    { id:"c5_ep6_hero2", type:"dialogue", speaker:"hero", location:SAIGO,
      text:"（両方を立てる。原資の重さは要件と正しい負担で支えられる。だから繋ぐべき一人まで落とさなくていい。……あなた自身も、繋がれるべきだった。）",
      next:"c5_ep6_bond", ideologyChanges:{ fair:1, mgmt:1 }, flags:{ c5_ep6_saw_sides:1 } },
    { id:"c5_ep6_bond", type:"dialogue", speaker:"sera", location:SAIGO, bgmScene:"emotion", expression:"shock",
      text:"……調律師さん。わたしは救う手の速さだけを誇りにしてきた。……でもあなたは、わたしが空にした原資も、レヴィが締めた恐れも、両方拾おうとした。",
      next:"c5_ep6_end", relationshipChanges:{ cp5:1 }, flags:{ c5_ep6_bonded:1 } },
    { id:"c5_ep6_end", type:"dialogue", speaker:"narrator", location:SAIGO, bgmScene:"field",
      text:"喪失の判が解かれ、断たれかけた資格が一つまた一つと網の内へ色を取り戻した。だが法典広間の最奥では、ケンポ将軍が影を人の形に立ち上げていた。",
      next:"c5_ep6_hook", flags:{ c5_ep6_done:1 }, questUpdate:{ qid:"q_ch05b", state:"active", step:6 } },
    { id:"c5_ep6_hook", type:"dialogue", speaker:"sera", location:SAIGO, expression:"angry",
      text:"……あれが大元。『誰も見捨てない』って理想と有限の原資が、天秤のまま将軍の形になってる。明日、法典広間の奥で決着。", next:"c5_ep7_open" },

    /* ============================================================
       第7話「決戦前夜」
       仲間との会話で覚悟。戦う意味の総括(戦闘なし)。師匠ゼンの影を1本繋ぐ。
       ============================================================ */
    { id:"c5_ep7_open", type:"dialogue", speaker:"narrator", location:YAEI, bgmScene:"town",
      text:"施療院の一室。灯りを囲み、六人は温かい湯を分け合った。明日、この街の板挟みそのものと戦う。その前の、静かな夜だった。",
      next:"c5_ep7_sera1", flags:{ c5_ep7_start:1 } },
    { id:"c5_ep7_sera1", type:"dialogue", speaker:"sera", location:YAEI, portrait:"mina",
      text:"わたしは救った数の多さだけで自分を許してきた。……でも今は分かる。空にした原資の先で後回しにされた人と、締められて落ちた人を、両方数え直さなきゃ。", next:"c5_ep7_kai1" },
    { id:"c5_ep7_kai1", type:"dialogue", speaker:"kai", location:YAEI, expression:"angry",
      text:"悪いのは一人の悪人じゃねえ。『誰も見捨てない』を、みんなが原資も見ずに掲げてた。……レヴィも、底を怖れて締めた側だった。地続きなんだよな。", next:"c5_ep7_mina1" },
    { id:"c5_ep7_mina1", type:"dialogue", speaker:"mina", location:YAEI, portrait:"wiz",
      text:"無条件の慈悲は、いつか必ず原資を尽くす。その恐れで網を締めれば、繋がるはずの一人がこぼれる。……明日突きつけるのは、その一点です。", next:"c5_ep7_hero1" },
    { id:"c5_ep7_hero1", type:"dialogue", speaker:"hero", location:YAEI,
      text:"経営者も行政も悪じゃない。原資には限りがある。慈悲を惜しむまいとする街も、底を怖れる財政もある。……その全部を抱えて、こぼれる一人を繋ぎ直す。", next:"c5_ep7_choice" },

    { id:"c5_ep7_choice", type:"choice", speaker:"hero", location:YAEI, text:"覚悟を、言葉にする。",
      choices:[
        { text:"「無条件の慈悲」を「続く支え合いの原資」に変える。その第一歩として戦う",
          ideologyChanges:{ fair:1, mgmt:1 }, flags:{ c5_ep7_vow_bridge:1 }, next:"c5_ep7_vow" },
        { text:"締められ、後回しにされた一人ひとりを、網へ繋ぎ直すために戦う",
          ideologyChanges:{ human:1, relief:1 }, flags:{ c5_ep7_vow_count:1 }, next:"c5_ep7_vow" }
      ]},
    { id:"c5_ep7_vow", type:"dialogue", speaker:"hero", location:YAEI, bgmScene:"emotion",
      text:"将軍を倒しに行くんじゃない。『誰も見捨てない』を『続く支え合いの原資』に書き換えに行く。誰の顔も見落とさない線を――明日、法典広間で。", next:"c5_ep7_zen" },
    { id:"c5_ep7_zen", type:"dialogue", speaker:"narrator", location:YAEI, bgmScene:"emotion",
      text:"セラが持ち出した古い健保台帳。一番下から紙片が滑り落ちた。『慈悲を配る者は、慈悲の原資が誰の肩に乗るかを、まず問え』――師匠ゼンの筆跡。",
      next:"c5_ep7_end", flags:{ c5_zen_ash5b:1 } },
    { id:"c5_ep7_end", type:"dialogue", speaker:"hero", location:YAEI, bgmScene:"field",
      text:"（師匠。この街でも編み直そうとして、原資の底を背負いきれずに去ったんですね。……その宿題を、おれたちが引き受けます。明日、広間の奥で。）",
      next:"c5_ep7_hook", flags:{ c5_ep7_done:1 }, questUpdate:{ qid:"q_ch05b", state:"active", step:7 } },
    { id:"c5_ep7_hook", type:"dialogue", speaker:"narrator", location:YAEI,
      text:"夜が明けた。六人は薄暗い街路を抜け、法典広間の最奥へと歩を進めた。慈悲と原資の板挟みが、いっそう濃く満ちていた。", next:"c5_ep8_open" },

    /* ============================================================
       第8話「決戦」— 章ボス【ケンポ将軍 v_boss_s5】戦
       【章末問題集】=これまでの健保の過去問を集めた高難度セット(examFmt中心・タイト)。
       登場アニメ+『敵が問題を突きつける』枠組みは story-encounter が villain から自動生成する。
       撃破後は断定的勝利にせず「間を取り持つ/法典のかけらを取り戻す」テーマへ橋渡し(ENDING-CANON/introのかけら)。
       ============================================================ */
    { id:"c5_ep8_open", type:"dialogue", speaker:"narrator", location:DAIN, bgmScene:"emotion",
      text:"法典広間の最奥。慈悲と原資の板挟みが、ゆっくりと人の形に立ち上がった。救うたびに原資を減らし、線を引くたびに誰かをこぼす、その天秤そのもの。",
      next:"c5_ep8_appear", flags:{ c5_ep8_start:1 } },
    { id:"c5_ep8_appear", type:"dialogue", speaker:"narrator", location:DAIN,
      text:"将軍が記録の山を広げると、天秤の両側に消えた者が影から浮かび上がった。等級を下げられた療養者、資格を断たれた退職者、支えを抜かれた母、後回しにされた病棟。", next:"c5_ep8_kenpo1" },
    { id:"c5_ep8_kenpo1", type:"dialogue", speaker:"kenpo", location:DAIN, portrait:"e_graus", expression:"angry",
      text:"よく来た、調律師。問おう。救ったか。原資は残ったか。……天秤の外に落ちた者は誰が数える? 数えぬのが、慈悲の道理だ。", next:"c5_ep8_hero1" },
    { id:"c5_ep8_hero1", type:"dialogue", speaker:"hero", location:DAIN,
      text:"覆す。カイも、ミナも、セラもいる。断たれた者も、後回しにされた者も顔を上げた。……その板挟みを、今日、健保の全体像で引き受ける。", next:"c5_ep8_sera1" },
    { id:"c5_ep8_sera1", type:"dialogue", speaker:"sera", location:DAIN, portrait:"mina", expression:"angry",
      text:"御託はいい。積み上げた過去問の全部を、ここでぶつける。……わたしが空にした原資も、レヴィが締めた恐れも、今日で終いにする。", next:"c5_ep8_brief" },
    { id:"c5_ep8_brief", type:"dialogue", speaker:"narrator", location:DAIN, bgmScene:"emotion",
      text:"これは総決算。標準報酬・標準賞与、傷病手当金、高額療養費、被扶養者、出産、任意継続、埋葬料、資格の得喪――そのすべてが【章末問題集】として襲いかかる。",
      next:"c5_ep8_enc1", questUpdate:{ qid:"q_ch05b", state:"active", step:8 } },
    { id:"c5_ep8_enc1", type:"encounter", speaker:"hero", location:DAIN, bgmScene:"emotion",
      text:"第一幕・標準報酬/給付編。標準報酬月額・標準賞与額、傷病手当金の待期と支給期間、高額療養費の限度額と多数回該当を、高密度の五肢択一・個数で叩き込む。",
      encounter: enc(5, "章末問題集｜標準報酬・傷病手当金・高額療養費編(高難度)", { villain:"v_boss_s5", n:12, exam:5 }),
      evidence:"ev_ch5b_boss1", next:"c5_ep8_mid" },
    { id:"c5_ep8_mid", type:"dialogue", speaker:"kenpo", location:DAIN, expression:"shock",
      text:"……標準報酬と給付は越えたか。だが慈悲の網はそれだけではない。被扶養者、出産、任意継続、埋葬料、資格の得喪――こぼれる縁はどこまでも広い。", next:"c5_ep8_enc2" },
    { id:"c5_ep8_enc2", type:"encounter", speaker:"hero", location:DAIN, bgmScene:"emotion",
      text:"第二幕・被扶養者/資格編。被扶養者の範囲、出産手当金と一時金、任意継続被保険者、埋葬料、資格の取得と喪失を、同じ高密度で最後まで。",
      encounter: enc(5, "章末問題集｜被扶養者・出産・任意継続・資格編(高難度)", { villain:"v_boss_s5", n:12, exam:5 }),
      evidence:"ev_ch5b_boss2", next:"c5_ep8_broke" },
    { id:"c5_ep8_broke", type:"dialogue", speaker:"narrator", location:DAIN, bgmScene:"emotion",
      text:"最後の一問が置かれた瞬間、記録の山が内側から崩れ始めた。天秤の両側に消えていた者たちが名を呼ばれ、網の内へ色を取り戻していく。", next:"c5_ep8_reason" },
    { id:"c5_ep8_reason", type:"reasoning", speaker:"hero", location:DAIN, bgmScene:"emotion",
      text:"標準報酬・標準賞与、傷病手当金、高額療養費、被扶養者、出産、任意継続、埋葬料、資格。――こぼれた一人を、続く原資で支え直すための条文だった。",
      reasoning:{ need:["ev_ch5b_boss1","ev_ch5b_boss2"] },
      flags:{ c5_ep8_reasoned:1 }, next:"c5_ep8_kenpo2" },

    /* 断定的勝利にしない。将軍/仲間の独白で「間を取り持つ/法典のかけらを取り戻す」テーマへ橋渡し。 */
    { id:"c5_ep8_kenpo2", type:"dialogue", speaker:"kenpo", location:DAIN, expression:"shock",
      text:"……私は間違っていたのか。だが問おう。線を緩めれば原資が尽きる。尽きれば、次に病む者から先に支えが消える。私はそう信じてきた。", next:"c5_ep8_sera2" },
    { id:"c5_ep8_sera2", type:"dialogue", speaker:"sera", location:DAIN,
      text:"……将軍。わたしはもう、あなたの道理にも、昔の自分の無条件の慈悲にも縋らない。だが問いは捨てられない。わたしが、その間に立つ。", next:"c5_ep8_zen" },
    { id:"c5_ep8_zen", type:"dialogue", speaker:"hero", location:DAIN, bgmScene:"emotion",
      text:"（師匠。あなたが背負いきれなかった問いが、ここにもあった。……健保の法典のかけらが一つ、手のひらに戻ってきた。九つのうちの、五つめだ。）",
      next:"c5_ep8_hero_final", flags:{ c5_shard5:1 } },
    { id:"c5_ep8_hero_final", type:"dialogue", speaker:"hero", location:DAIN,
      text:"ケンポ将軍。あなたを裁きには来ていない。問いに答え続けに来た。……健保は、切り捨てるためじゃなく、こぼれた一人の名を呼んで繋ぎ直すためにある。", next:"c5_ep8_final" },
    { id:"c5_ep8_final", type:"dialogue", speaker:"narrator", location:DAIN, bgmScene:"field",
      text:"メディカで、慈悲の理想が初めて『続く原資の重さ』とともに立て直された。だが胸には、勝利より重い問いが残った――慈悲と原資の間を、どう取り持つのか。",
      next:null, flags:{ c5_ep8_done:1, c5_boss_cleared:1, c5_ch05b_done:1 },
      questUpdate:{ qid:"q_ch05b", state:"done", step:9 } }
  ];

  /* 第4〜8話クエスト定義(doneFlag で完了判定)。q_ch05(前半)は無改変の別クエスト。 */
  if(typeof S.registerQuest==="function"){
    S.registerQuest("q_ch05b", {
      title:"誰も見捨てない・決着",
      chapter:"ch05b",
      steps:["産む者の支え","資格の際","網を締める者","決戦前夜","決戦"],
      doneFlag:"c5_ch05b_done"
    });
  }

  S.register("ch05b", NODES);
  S.CH05B_ID = "ch05b";

  /* メイン章の背骨(S.MAIN)へ、ch05(前半)の続きとして追記する。
     ・c5_ch05_done 後、ホームの「今日の冒険」が自動で本話へ進む導線になる。
     ・S.MAIN 未ロード/未定義でも安全(存在する時だけ push、重複登録も防ぐ)。 */
  if(Array.isArray(S.MAIN)){
    var exists = false;
    for(var i=0;i<S.MAIN.length;i++){ if(S.MAIN[i] && S.MAIN[i].id==="ch05b"){ exists = true; break; } }
    if(!exists){
      S.MAIN.push({ id:"ch05b", no:"第五章", title:"誰も見捨てない・決着", loc:"医療都市メディカ・法典広間の奥",
        doneFlag:"c5_ch05b_done", startedFlag:"c5_ep4_start" });
    }
  }
})();
