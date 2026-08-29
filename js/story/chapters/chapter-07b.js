"use strict";
/* ============================================================
   story/chapters/chapter-07b.js — 第七章「積み上げた報酬の果てに」第4〜8話 + 章ボス戦
   docs/story-bible.md / ENDING-CANON 準拠。chapter-07.js の末尾(c7_ch07_done /
   c7_boss_next)から地続きの五話を、別 chapterId="ch07b" で綴じ込む。
   舞台=累層の帝都エオン(下層の街から法典広間の奥へ)／厚生年金保険法(subject 7)。
   ・第4話「削られる支え」…障害厚生年金。報酬比例が薄いという理由で、障害を負って働けなくなった者の
                     障害厚生年金を『報酬どおり』と削り断つ事件で。障害等級と障害手当金・最低保障を軸に。過去問(examFmt)混入。
   ・第5話「遺された名前」…遺族厚生年金・中高齢寡婦加算・加給年金/振替加算。中ボス 格差断ちのヴェイン 初登場
                     (自らの報酬記録の薄さゆえ、身内を遺族厚生年金・中高齢寡婦加算の要件一歩手前で支えられなかった過去。
                      『報酬の薄い者にまで手厚くすれば原資が持たぬ』側へ回った裁定長)。
   ・第6話「報酬どおりの裁定」…中ボス【格差断ちのヴェイン v_mid_kakusa】戦。障害・遺族厚生年金・
                     中高齢寡婦加算・加給年金/振替加算の総合。レオンとの絆深化(cp7)。
   ・第7話「決戦前夜」…仲間との会話で覚悟。戦う意味の総括(戦闘なし)。師匠ゼンの影を1本繋ぐ。
   ・第8話「決戦」…章ボス【コウネン皇帝 v_boss_s7】戦=【章末問題集】(厚年の過去問=examFmt中心の高難度セット)。
                 撃破後は断定的勝利にせず、「間を取り持つ/法典のかけらを取り戻す」テーマへ橋渡し。
   ・各話に必ず「経営者/行政/制度側の事情」ビートを置き、断定せず問いを残す(『報酬どおり』の格差)。
   ・chapter-01*.js〜chapter-06*.js / chapter-07.js のノード/quest/ID/証拠/分岐は
     一切改変しない(別ファイル・別章 "ch07b")。
   ・戦闘接続は既存の橋(story-encounter / story-battle-bridge)。encounter に villain と
     exam(examFmt 混入数)を持たせるだけで、採点・SRS・報酬・問題データには一切触れない。
     ボス戦も新規採点系を作らず、examFmt を多く混ぜた高難度 encounter として既存橋へ委譲する。
   ・eval/new Function ゼロ。全ノードはデータのみ(next は文字列 or {then,else} or null)。全出力は自前 esc2 経由。
   ・立てるフラグ: c7_ep4_done〜c7_ep8_done / c7_boss_cleared / c7_ch07b_done / c7_zen_ash7b / c7_shard7。
     q_ch07(前半)は無改変。ここは boss_cleared までを確定する。
   ・注: 仲間レオンの好感度キーは cp7(前半 c7_leon_join で加入・px は chapter-07.js が foreman に上書き済)。
     data-companions.js の cp7 とは別レイヤー(物語の関係値 getRel/setRel はパーティ・パッシブと独立)。
     本ファイルでも leon.px=foreman を防御的に再宣言する(輪郭線付きバスト徹底)。
   ============================================================ */
(function(){
  var G = (typeof window!=="undefined") ? window : globalThis;
  var S = G.SRStory;
  if(!S || typeof S.register!=="function") return;   /* エンジン未ロードでも安全 */

  /* 第4〜8話の話者を表示名テーブルへ追記(描画層があれば。無ければ素通し)。
     leon/teikan/kounen/kai/mina は既存(chapter-07.js が追記・上書き済み)。中ボスと新被害者のみ追記。
     leon の既定 px(king)は輪郭線バストでないため foreman を防御的に再上書きする。
     vein(中ボス)の px は輪郭線付き人物バスト e_kacho。 */
  if(S.SPEAKERS && typeof S.SPEAKERS==="object"){
    S.SPEAKERS.leon = { name:"レオン", px:"foreman" };                 /* 既定 king を foreman に再上書き */
    if(!S.SPEAKERS.vein)      S.SPEAKERS.vein      = { name:"格差断ちのヴェイン", px:"e_kacho" };
    if(!S.SPEAKERS.shogai7)   S.SPEAKERS.shogai7   = { name:"働けなくなった者", px:"ghost" };
    if(!S.SPEAKERS.izoku7)    S.SPEAKERS.izoku7    = { name:"遺された家族", px:"ghost" };
  }
  /* CAST_BY_ID.leon の px も念のため foreman に整合(chapter-07.js が未ロードでも輪郭線バストを担保)。 */
  if(S.CAST_BY_ID && S.CAST_BY_ID.leon && S.CAST_BY_ID.leon.px!=="foreman"){
    S.CAST_BY_ID.leon.px = "foreman";
  }

  var SHIMO = "累層の帝都エオン・下層の陰りの街";
  var REI   = "累層の帝都エオン・遺影の並ぶ街角";
  var SATEI = "累層の帝都エオン・年金裁定の館の街";
  var YADO  = "累層の帝都エオン・宵闇の宿の街";
  var DAIN  = "累層の帝都エオン・厚年法典の広間の奥";

  /* 演習 encounter。opts で相手(villain)と過去問混入数(exam=examFmt の本数)・出題数(n)を指定。
     kind:"train" のまま既存の橋(start*)へ委譲する。ボス戦は exam/n を大きくした高難度セット。subject=7。 */
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
       第4話「削られる支え」
       障害厚生年金。報酬比例が薄いという理由で、障害を負って働けなくなった者の支えを削り断つ事件。
       ============================================================ */
    { id:"c7_ep4_open", start:true, type:"dialogue", speaker:"narrator", location:SHIMO, bgmScene:"emotion",
      text:"帰り道、日の差さぬ下層の街へ下りた。石段の陰に、若い者が裁定通知を握りしめ座り込んでいた。障害厚生年金が、『報酬が薄い』の一言で削られていた。",
      next:"c7_ep4_intro", flags:{ c7_ep4_start:1 },
      questUpdate:{ qid:"q_ch07b", state:"active", step:0 } },
    { id:"c7_ep4_intro", type:"dialogue", speaker:"shogai7", location:SHIMO, portrait:"ghost", expression:"shock",
      text:"働けなくなって申請した。……なのに『報酬比例が低いから』と、雀の涙を突きつけられた。等級も、実際より軽く見積もられていた。もう、立ち上がる気力もない。", next:"c7_ep4_leon1" },
    { id:"c7_ep4_leon1", type:"dialogue", speaker:"leon", location:SHIMO, portrait:"foreman", expression:"shock",
      text:"……待ってくれ。障害厚生年金は、報酬比例だけで決まるものじゃない。まず等級が正しいか確かめる。三級には最低保障、軽ければ障害手当金の道もある。", next:"c7_ep4_leon2" },
    { id:"c7_ep4_leon2", type:"dialogue", speaker:"leon", location:SHIMO,
      text:"一級・二級には配偶者の加給年金も付く。三級には最低保障額があり、それに満たぬ軽さなら障害手当金だ。……『報酬が薄いから』で、底まで削らせはしない。", next:"c7_ep4_kai1" },
    { id:"c7_ep4_kai1", type:"dialogue", speaker:"kai", location:SHIMO, portrait:"helm", expression:"angry",
      text:"働けなくなった人間に、『報酬が薄い』の一言で支えごと削る。……その入口を、正しに行く。", next:"c7_ep4_mina1" },
    { id:"c7_ep4_mina1", type:"dialogue", speaker:"mina", location:SHIMO, portrait:"wiz",
      text:"障害厚生年金は、一級・二級なら報酬比例に一定率を乗じ、配偶者の加給年金が加わります。三級には最低保障額、それに満たぬ障害には障害手当金があります。", next:"c7_ep4_choice" },

    { id:"c7_ep4_choice", type:"choice", speaker:"hero", location:SHIMO, text:"この若者に、どう向き合う?",
      choices:[
        { text:"障害等級と障害厚生年金・最低保障の筋を、制度で正しく積み直す",
          ideologyChanges:{ law:1, mgmt:1 }, flags:{ c7_ep4_path_law:1 }, next:"c7_ep4_probe" },
        { text:"まず、報酬の薄さで支えまで削られた絶望を受け止める",
          ideologyChanges:{ human:1, relief:1 }, flags:{ c7_ep4_path_human:1 }, next:"c7_ep4_alt" }
      ]},
    { id:"c7_ep4_alt", type:"dialogue", speaker:"hero", location:SHIMO,
      text:"絶望して当然です。いちばん支えが要るときに、報酬の薄さを盾に削られた。……その上で。等級を正しく認定し直せば、最低保障も加給年金も届きます。", next:"c7_ep4_probe" },

    { id:"c7_ep4_probe", type:"dialogue", speaker:"narrator", location:SHIMO, bgmScene:"field",
      text:"『報酬が薄い以上、支えも薄い』――そう言い張って等級を軽く付け、最低保障も障害手当金も伏せる手先がいた。その筋を取り戻す。",
      next:"c7_ep4_enc1", questUpdate:{ qid:"q_ch07b", state:"active", step:1 } },
    { id:"c7_ep4_enc1", type:"encounter", speaker:"hero", location:SHIMO, bgmScene:"emotion",
      text:"報酬削りのレドが、軽く付け替えた等級の台帳を抱えて現れた。障害厚生年金の障害等級・最低保障額・障害手当金・配偶者の加給年金を、本試験の問いで確かめる。",
      encounter: enc(7, "過去問｜障害厚生年金・障害等級・最低保障・障害手当金を問う", { villain:"v_mob_s7", exam:2 }),
      evidence:"ev_ch7b_shogai", next:"c7_ep4_ev1" },
    { id:"c7_ep4_ev1", type:"dialogue", speaker:"leon", location:SHIMO,
      text:"障害厚生年金は報酬比例だけじゃない。一級・二級には加給年金、三級には最低保障、それに満たぬ軽さには障害手当金。……あとは、遺族の支えまで断つ張本人だ。", next:"c7_ep4_reason" },
    { id:"c7_ep4_reason", type:"reasoning", speaker:"hero", location:SHIMO, bgmScene:"emotion",
      text:"障害厚生年金、障害等級、最低保障額、障害手当金、加給年金。――報酬の薄さで見捨てず、底で受け止める条文だ。等級を軽く付けることが、削る細工だ。",
      reasoning:{ need:["ev_ch7b_shogai"] },
      flags:{ c7_ep4_reasoned:1 }, next:"c7_ep4_biz" },

    /* 【制度側の事情】断定せず提示 */
    { id:"c7_ep4_biz", type:"dialogue", speaker:"teikan", location:SHIMO,
      text:"……等級を正すのは正しい。だが給付はみな現役の報酬から賄う。報酬比例という秤があるから、多く納めた者も納め続ける。底を厚く積めば、その信頼が揺らぐ。", next:"c7_ep4_hero2" },
    { id:"c7_ep4_hero2", type:"dialogue", speaker:"hero", location:SHIMO,
      text:"（秤に信頼が乗るのは本当だ。……でも、等級を軽く付けて底を抜くのは線引きじゃない。ただの切り捨てだ。どちらかを捨てる話にはしたくない。）",
      next:"c7_ep4_end", ideologyChanges:{ fair:1, mgmt:1 }, flags:{ c7_ep4_saw_sides:1 } },
    { id:"c7_ep4_end", type:"dialogue", speaker:"narrator", location:SHIMO, bgmScene:"field",
      text:"若者は正された通知を胸に抱え、初めて陰りの街の空を見上げた。レオンはその傍らに膝をつき、認定し直された等級と加給年金の額を書き添えてやった。",
      next:"c7_ep4_hook", flags:{ c7_ep4_done:1 }, questUpdate:{ qid:"q_ch07b", state:"active", step:2 } },
    { id:"c7_ep4_hook", type:"dialogue", speaker:"leon", location:SHIMO, expression:"angry",
      text:"……だが調律師さん。障害の支えを直しても大元がいる。『報酬どおり』を口実に、遺族厚生年金も中高齢寡婦加算も断ってる裁定長。次は、そいつだ。", next:"c7_ep5_open" },

    /* ============================================================
       第5話「遺された名前」
       遺族厚生年金・中高齢寡婦加算・加給年金/振替加算。中ボス 格差断ちのヴェイン 初登場。
       ============================================================ */
    { id:"c7_ep5_open", type:"dialogue", speaker:"narrator", location:REI, bgmScene:"emotion",
      text:"遺影の並ぶ街角。伴侶を亡くした者、幼い子を抱えた遺族、報酬の薄い夫を看取った妻が、遺族厚生年金を断たれて列をなす。奥に、格差断ちのヴェインが立っていた。",
      next:"c7_ep5_intro", flags:{ c7_ep5_start:1 } },
    { id:"c7_ep5_intro", type:"dialogue", speaker:"vein", location:REI, portrait:"e_kacho", expression:"angry",
      text:"――報酬が薄いな。ならば遺族厚生年金も、これだけだ。中高齢寡婦加算? 薄い妻にまで加えろと? ……報酬どおりに分けるのが、多く納めた者への公正だ。", next:"c7_ep5_leon1" },
    { id:"c7_ep5_leon1", type:"dialogue", speaker:"leon", location:REI, portrait:"foreman", expression:"shock",
      text:"……ヴェイン。あなた、昔は誰より遺族の支えをつなごうとした人だろう。自分の記録の薄さで、身内を要件一歩手前で支えられなかった。……その人が、なぜ今、断つ。", next:"c7_ep5_vein2" },
    { id:"c7_ep5_vein2", type:"dialogue", speaker:"vein", location:REI, expression:"angry",
      text:"……痛みを知るからだ。私が支えを失ったのは、秤が甘くて原資が尽きたからだ。ならば報酬どおりに引く。引いて残す。次に多く納めた者のために。", next:"c7_ep5_mina1" },
    { id:"c7_ep5_mina1", type:"dialogue", speaker:"mina", location:REI, portrait:"wiz",
      text:"遺族厚生年金は、生計を維持されていた配偶者・子らに報酬比例の四分の三を支給します。中高齢寡婦加算は一定の妻に、振替加算はその後に配偶者自身の基礎年金へ。", next:"c7_ep5_choice" },

    { id:"c7_ep5_choice", type:"choice", speaker:"hero", location:REI, text:"断たれた遺族の支えの際に、どう立つ?",
      choices:[
        { text:"遺族厚生年金と中高齢寡婦加算・加給年金の要件で、際から一人ずつつなぎ直す",
          ideologyChanges:{ law:1, fair:1 }, flags:{ c7_ep5_path_law:1 }, next:"c7_ep5_probe" },
        { text:"原資を尽くす恐れから秤を厳しくした、ヴェインの痛みをまず聞く",
          ideologyChanges:{ human:1, mgmt:1 }, flags:{ c7_ep5_path_ask:1 }, next:"c7_ep5_alt" }
      ]},
    { id:"c7_ep5_alt", type:"dialogue", speaker:"hero", location:REI,
      text:"原資の底を怖れたのは分かります。金庫が痩せた月も確かにあった。……その上で。断つ前に、拾える加算があった。恐れの締め付けを、支える線へ引き直せます。", next:"c7_ep5_probe" },

    { id:"c7_ep5_probe", type:"dialogue", speaker:"narrator", location:REI, bgmScene:"field",
      text:"『報酬が薄い以上、支えも薄い』――手先が、遺族厚生年金の道と各種加算を却下の判で塞いでいた。その筋を一つずつ立て直す。",
      next:"c7_ep5_enc1", questUpdate:{ qid:"q_ch07b", state:"active", step:3 } },
    { id:"c7_ep5_enc1", type:"encounter", speaker:"hero", location:REI, bgmScene:"emotion",
      text:"報酬削りのレドが、却下の判の束を盾に立ちはだかった。遺族厚生年金の支給要件・遺族の範囲・報酬比例の四分の三、各種加算を、本試験の問いで数え直す。",
      encounter: enc(7, "過去問｜遺族厚生年金・中高齢寡婦加算・加給年金/振替加算を問う", { villain:"v_mob_s7", exam:2 }),
      evidence:"ev_ch7b_izoku", next:"c7_ep5_ev1" },
    { id:"c7_ep5_ev1", type:"dialogue", speaker:"leon", location:REI,
      text:"遺族厚生年金は、生計を維持されていた配偶者や子に報酬比例の四分の三。中高齢寡婦加算は一定の妻に、振替加算はその後に配偶者の基礎年金へ。……次は、ヴェイン本人だ。", next:"c7_ep5_reason" },
    { id:"c7_ep5_reason", type:"reasoning", speaker:"hero", location:REI, bgmScene:"emotion",
      text:"遺族厚生年金、遺族の範囲、四分の三、中高齢寡婦加算、加給年金、振替加算。――遺された一人を誰の顔を見て底で支えるかの条文だ。『薄い』は、道を塞いだ細工だ。",
      reasoning:{ need:["ev_ch7b_izoku"] },
      flags:{ c7_ep5_reasoned:1 }, next:"c7_ep5_biz" },

    /* 【裁定長/行政側の事情】断定せず、次話の壁として残す */
    { id:"c7_ep5_biz", type:"dialogue", speaker:"vein", location:REI, expression:"shock",
      text:"……報酬どおりに引くのを悪だと言い切れるか。薄い者まで加算で厚く支えれば、その原資を誰が納める。多く納めた者が信を失えば、秤ごと崩れる。", next:"c7_ep5_hero2" },
    { id:"c7_ep5_hero2", type:"dialogue", speaker:"hero", location:REI,
      text:"（原資を残す問いは本物だ。……でも、要件で引く線と、拾える加算を伏せて断つ締め付けは混ぜてはいけない。落とすことと、信頼を守ることは別の話だ。）",
      next:"c7_ep5_end", ideologyChanges:{ fair:1, mgmt:1 }, flags:{ c7_ep5_saw_sides:1 } },
    { id:"c7_ep5_end", type:"dialogue", speaker:"narrator", location:REI, bgmScene:"field",
      text:"ヴェインは却下の判を握ったまま動かなかった。冷たい面の奥で、自らの報酬の薄さゆえに身内を要件一歩手前で見送った頃の顔が、揺れていた。",
      next:"c7_ep5_hook", flags:{ c7_ep5_done:1 }, questUpdate:{ qid:"q_ch07b", state:"active", step:4 } },
    { id:"c7_ep5_hook", type:"dialogue", speaker:"kai", location:REI, portrait:"helm", expression:"angry",
      text:"……あいつはまだ判を手放しちゃいねえ。遺族厚生年金も加算も、全部まとめて『報酬どおり』で断ち落とすつもりだ。行くぞ、調律師。", next:"c7_ep6_open" },

    /* ============================================================
       第6話「報酬どおりの裁定」— 中ボス【格差断ちのヴェイン v_mid_kakusa】戦
       障害・遺族厚生年金・中高齢寡婦加算・加給年金/振替加算の総合。レオンとの関係深化。
       ============================================================ */
    { id:"c7_ep6_open", type:"dialogue", speaker:"narrator", location:SATEI, bgmScene:"emotion",
      text:"裁定の館の最奥。却下の判の山から、次々と支えが断たれていた。障害を負った者、つながるはずの家族、加算を待つ妻。その前に、ヴェインが立ちはだかった。",
      next:"c7_ep6_choice", flags:{ c7_ep6_start:1 } },
    { id:"c7_ep6_choice", type:"choice", speaker:"hero", location:SATEI, text:"ヴェインの締め付けを、どう解く?",
      choices:[
        { text:"障害・遺族厚生年金と各種加算の全体像で、際から一人をつなぎ直す",
          ideologyChanges:{ law:1, fair:1 }, flags:{ c7_ep6_path_law:1 }, next:"c7_ep6_probe" },
        { text:"同じく身近な報酬の薄さを見過ごした者として、まずヴェインに語りかける",
          ideologyChanges:{ human:1, relief:1 }, flags:{ c7_ep6_path_human:1 }, next:"c7_ep6_alt" }
      ]},
    { id:"c7_ep6_alt", type:"dialogue", speaker:"leon", location:SATEI, portrait:"foreman",
      text:"ヴェイン。私も、いちばん近くの記録を痩せさせた側だ。……あなたの締め付けは、私の悔いの裏返しだ。断っても恐れは埋まらない。一緒に、引き直そう。", next:"c7_ep6_probe" },

    { id:"c7_ep6_probe", type:"dialogue", speaker:"narrator", location:SATEI, bgmScene:"field",
      text:"判の山から断たれる寸前の支え。障害を負った者、つながるはずの遺族、加算を待つ妻。支えの骨組みで、一人ずつ拾い上げる。",
      next:"c7_ep6_enc1", questUpdate:{ qid:"q_ch07b", state:"active", step:5 } },
    { id:"c7_ep6_enc1", type:"encounter", speaker:"hero", location:SATEI,
      text:"まずは支えの骨組み。障害厚生年金・障害等級・障害手当金、遺族厚生年金・遺族の範囲、中高齢寡婦加算・加給年金・振替加算。断たれかけた一人の支えをつなぐ。",
      encounter: enc(7, "過去問｜障害・遺族厚生年金・各種加算を問う", { villain:"v_mob_s7", exam:2 }),
      evidence:"ev_ch7b_hone", next:"c7_ep6_ev1" },
    { id:"c7_ep6_ev1", type:"dialogue", speaker:"mina", location:SATEI, portrait:"wiz",
      text:"骨組み、通せました。……ですが、ヴェイン本人が却下の判を構えて前に出ます。『報酬どおり』に断ってきた歳月ごと、正面からぶつかることになります。", next:"c7_ep6_enc2" },
    { id:"c7_ep6_enc2", type:"encounter", speaker:"hero", location:SATEI, bgmScene:"emotion",
      text:"格差断ちのヴェインが却下の判を背に立ちはだかった。障害・遺族厚生年金、障害等級・障害手当金・最低保障、各種加算の全体像で、断たれた支えを解き直す。",
      encounter: enc(7, "過去問｜障害・遺族厚生年金・各種加算の総合(中ボス)", { villain:"v_mid_kakusa", exam:3 }),
      evidence:"ev_ch7b_vein", next:"c7_ep6_ev2" },
    { id:"c7_ep6_ev2", type:"dialogue", speaker:"vein", location:SATEI, expression:"shock",
      text:"……判が、解かれた。幾年も、この判で支えを断ってきた。原資を尽くすくらいならと。……私が怖れたものに、私自身がなっていたのか。", next:"c7_ep6_reason" },
    { id:"c7_ep6_reason", type:"reasoning", speaker:"hero", location:SATEI, bgmScene:"emotion",
      text:"障害・遺族の厚生年金、等級と最低保障、中高齢寡婦加算・加給年金・振替加算。――判で断った根拠は、そのどれもがつなぎ直せた。報酬どおりに引いた際も、抱えられる。",
      reasoning:{ need:["ev_ch7b_hone","ev_ch7b_vein"] },
      flags:{ c7_ep6_reasoned:1 }, next:"c7_ep6_biz" },

    /* 【裁定長側の事情】断定せず、問いを残す */
    { id:"c7_ep6_biz", type:"dialogue", speaker:"vein", location:SATEI,
      text:"……最後に問わせろ。私が報酬どおりに引かねば、秤が狂って潰れる帝都もあった。全部をつなぐことと、多く納めた者の信を保つこと。両方立てられるのか?", next:"c7_ep6_hero2" },
    { id:"c7_ep6_hero2", type:"dialogue", speaker:"hero", location:SATEI,
      text:"（両方を立てる。秤は正しい認定と正しい負担で守れる。だから、つなぐべき遺族まで断たなくていい。……あなた自身も、つながれるべきだった。）",
      next:"c7_ep6_bond", ideologyChanges:{ fair:1, mgmt:1 }, flags:{ c7_ep6_saw_sides:1 } },
    { id:"c7_ep6_bond", type:"dialogue", speaker:"leon", location:SATEI, bgmScene:"emotion", expression:"shock",
      text:"……調律師さん。私は報酬比例を数える腕だけを値打ちにしてきた。……でもあなたは、私が痩せさせた記録も、ヴェインが断った恐れも、両方拾おうとした。",
      next:"c7_ep6_end", relationshipChanges:{ cp7:1 }, flags:{ c7_ep6_bonded:1 } },
    { id:"c7_ep6_end", type:"dialogue", speaker:"narrator", location:SATEI, bgmScene:"field",
      text:"却下の判が解かれ、断たれかけた支えが一つまた一つと底から色を取り戻した。だが法典広間の最奥では、コウネン皇帝が影を人の形に立ち上げていた。",
      next:"c7_ep6_hook", flags:{ c7_ep6_done:1 }, questUpdate:{ qid:"q_ch07b", state:"active", step:6 } },
    { id:"c7_ep6_hook", type:"dialogue", speaker:"leon", location:SATEI, expression:"angry",
      text:"……あれが大元だ。『報酬どおり』という秤と有限の原資が、天秤のまま皇帝の形になっている。明日、法典広間の奥で決着だ。", next:"c7_ep7_open" },

    /* ============================================================
       第7話「決戦前夜」
       仲間との会話で覚悟。戦う意味の総括(戦闘なし)。師匠ゼンの影を1本繋ぐ。
       ============================================================ */
    { id:"c7_ep7_open", type:"dialogue", speaker:"narrator", location:YADO, bgmScene:"town",
      text:"宵闇の宿。灯りを囲み、一行は温かい湯を分け合った。明日、この帝都の格差そのものと戦う。その前の、静かな夜だった。",
      next:"c7_ep7_leon1", flags:{ c7_ep7_start:1 } },
    { id:"c7_ep7_leon1", type:"dialogue", speaker:"leon", location:YADO, portrait:"foreman",
      text:"私は報酬どおりに数える腕だけで自分を許してきた。……でも今は分かる。報酬の薄さで削られた人と、原資を怖れて断った人を、両方拾い直さなきゃならない。", next:"c7_ep7_kai1" },
    { id:"c7_ep7_kai1", type:"dialogue", speaker:"kai", location:YADO, expression:"angry",
      text:"悪いのは一人の悪人じゃねえ。『報酬どおり』を、みんなが底も見ずに口にしてた。……ヴェインも、底を怖れて断った側だった。地続きなんだよな。", next:"c7_ep7_mina1" },
    { id:"c7_ep7_mina1", type:"dialogue", speaker:"mina", location:YADO, portrait:"wiz",
      text:"報酬比例は積み上げを正しく映します。その一本の秤だけで裁けば、障害を負った者も、遺された者も、薄いまま老いた者もこぼれる。……明日突きつけるのは、その一点です。", next:"c7_ep7_hero1" },
    { id:"c7_ep7_hero1", type:"dialogue", speaker:"hero", location:YADO,
      text:"経営者も行政も悪じゃない。原資には限りがある。信頼を守りたい者も、秤の狂いを怖れる財政もある。……その全部を抱えて、こぼれる一人をつなぎ直す。", next:"c7_ep7_choice" },

    { id:"c7_ep7_choice", type:"choice", speaker:"hero", location:YADO, text:"覚悟を、言葉にする。",
      choices:[
        { text:"「報酬どおり」を「積み上げを報いつつ底を支える秤」に変える。その第一歩として戦う",
          ideologyChanges:{ fair:1, mgmt:1 }, flags:{ c7_ep7_vow_bridge:1 }, next:"c7_ep7_vow" },
        { text:"報酬の薄さで削られ、報酬どおりに断たれた一人ひとりを、支えへつなぎ直すために戦う",
          ideologyChanges:{ human:1, relief:1 }, flags:{ c7_ep7_vow_count:1 }, next:"c7_ep7_vow" }
      ]},
    { id:"c7_ep7_vow", type:"dialogue", speaker:"hero", location:YADO, bgmScene:"emotion",
      text:"皇帝を倒しに行くんじゃない。『報酬どおり』を『積み上げを報いつつ底を支える秤』に書き換えに行く。誰の顔も見落とさない線を――明日、法典広間で。", next:"c7_ep7_zen" },
    { id:"c7_ep7_zen", type:"dialogue", speaker:"narrator", location:YADO, bgmScene:"emotion",
      text:"レオンが持ち出した古い厚年台帳。一番下から紙片が滑り落ちた。『積み上げを報いよ。だが、積み上げの薄さで、支えまで薄くするな』――師匠ゼンの筆跡。",
      next:"c7_ep7_end", flags:{ c7_zen_ash7b:1 } },
    { id:"c7_ep7_end", type:"dialogue", speaker:"hero", location:YADO, bgmScene:"field",
      text:"（師匠。この帝都でも線を引き直そうとして、格差を背負いきれずに去ったんですね。……その宿題を、おれたちが引き受けます。明日、広間の奥で。）",
      next:"c7_ep7_hook", flags:{ c7_ep7_done:1 }, questUpdate:{ qid:"q_ch07b", state:"active", step:7 } },
    { id:"c7_ep7_hook", type:"dialogue", speaker:"narrator", location:YADO,
      text:"夜が明けた。一行は薄暗い下層の街を抜け、厚年法典の広間の最奥へと歩を進めた。『報酬どおり』の秤が、いっそう重く満ちていた。", next:"c7_ep8_open" },

    /* ============================================================
       第8話「決戦」— 章ボス【コウネン皇帝 v_boss_s7】戦
       【章末問題集】=これまでの厚年の過去問を集めた高難度セット(examFmt中心・タイト)。
       登場アニメ+『敵が問題を突きつける』枠組みは story-encounter が villain から自動生成する。
       撃破後は断定的勝利にせず「間を取り持つ/法典のかけらを取り戻す」テーマへ橋渡し(ENDING-CANON/introのかけら)。
       ============================================================ */
    { id:"c7_ep8_open", type:"dialogue", speaker:"narrator", location:DAIN, bgmScene:"emotion",
      text:"法典広間の最奥。『報酬どおり』の秤が、ゆっくりと人の形に立ち上がった。納めた報酬の記録どおりに、老後の厚みと薄さを分け続ける、その秩序そのもの。",
      next:"c7_ep8_appear", flags:{ c7_ep8_start:1 } },
    { id:"c7_ep8_appear", type:"dialogue", speaker:"narrator", location:DAIN,
      text:"皇帝が巨大な秤を広げると、底に沈んだ者が影から浮かび上がった。標準報酬を削られた者、記録を分けられなかった者、支えを削られた者、遺された家族。", next:"c7_ep8_kounen1" },
    { id:"c7_ep8_kounen1", type:"dialogue", speaker:"kounen", location:DAIN, portrait:"e_roukisai", expression:"angry",
      text:"よく来た、調律師。問おう。納めたか。積み上げたか。……多く働いた者が多く受け取る。当然の理だ。薄い者が薄く沈むのも、また理。覆せるとでも?", next:"c7_ep8_hero1" },
    { id:"c7_ep8_hero1", type:"dialogue", speaker:"hero", location:DAIN,
      text:"覆す。カイも、ミナも、レオンもいる。削られた者も、偽られた者も顔を上げた。……その秤を、今日、厚年の全体像で引き受ける。底を、支えるために。", next:"c7_ep8_leon1" },
    { id:"c7_ep8_leon1", type:"dialogue", speaker:"leon", location:DAIN, portrait:"foreman", expression:"angry",
      text:"御託はいい。積み上げた過去問の全部を、ここでぶつける。……私が痩せさせた記録も、ヴェインが断った恐れも、今日で終いにする。", next:"c7_ep8_brief" },
    { id:"c7_ep8_brief", type:"dialogue", speaker:"narrator", location:DAIN, bgmScene:"emotion",
      text:"これは総決算。標準報酬・報酬比例・経過的加算、在職老齢、繰上げ繰下げ・離婚分割、障害・遺族厚生年金と各種加算――そのすべてが【章末問題集】として襲いかかる。",
      next:"c7_ep8_enc1", questUpdate:{ qid:"q_ch07b", state:"active", step:8 } },
    { id:"c7_ep8_enc1", type:"encounter", speaker:"hero", location:DAIN, bgmScene:"emotion",
      text:"第一幕・報酬/受給編。標準報酬月額・標準賞与額・報酬比例部分・経過的加算、在職老齢年金の支給停止、繰上げ繰下げ・離婚分割を、高密度で叩き込む。",
      encounter: enc(7, "章末問題集｜標準報酬・在職老齢・繰上繰下・離婚分割編(高難度)", { villain:"v_boss_s7", n:12, exam:5 }),
      evidence:"ev_ch7b_boss1", next:"c7_ep8_mid" },
    { id:"c7_ep8_mid", type:"dialogue", speaker:"kounen", location:DAIN, expression:"shock",
      text:"……報酬と受給は越えたか。だが支えの底はそれだけではない。障害、遺族、そして底を支える加算――受給要件はどこまでも細かい。情がどこまで届く。", next:"c7_ep8_enc2" },
    { id:"c7_ep8_enc2", type:"encounter", speaker:"hero", location:DAIN, bgmScene:"emotion",
      text:"第二幕・障害/遺族/加算編。障害等級と障害手当金・最低保障、遺族の範囲と報酬比例の四分の三、中高齢寡婦加算・加給年金・振替加算を、同じ高密度で最後まで。",
      encounter: enc(7, "章末問題集｜障害・遺族厚生年金・各種加算編(高難度)", { villain:"v_boss_s7", n:12, exam:5 }),
      evidence:"ev_ch7b_boss2", next:"c7_ep8_broke" },
    { id:"c7_ep8_broke", type:"dialogue", speaker:"narrator", location:DAIN, bgmScene:"emotion",
      text:"最後の一問が置かれた瞬間、巨大な秤が初めて傾きを止めた。底に沈んでいた者たちが名を呼ばれ、支えの内へ色を取り戻していく。二つの皿が、同じ高さで釣り合い始めた。", next:"c7_ep8_reason" },
    { id:"c7_ep8_reason", type:"reasoning", speaker:"hero", location:DAIN, bgmScene:"emotion",
      text:"標準報酬・報酬比例、在職老齢・繰上繰下・離婚分割、障害・遺族厚生年金、各種加算――薄く削られた一人を、報いながら底で支え直すための条文だった。",
      reasoning:{ need:["ev_ch7b_boss1","ev_ch7b_boss2"] },
      flags:{ c7_ep8_reasoned:1 }, next:"c7_ep8_kounen2" },

    /* 断定的勝利にしない。皇帝/仲間の独白で「間を取り持つ/法典のかけらを取り戻す」テーマへ橋渡し。 */
    { id:"c7_ep8_kounen2", type:"dialogue", speaker:"kounen", location:DAIN, expression:"shock",
      text:"……私は間違っていたのか。だが問おう。底を厚く支えれば原資が尽きる。尽きれば、次に納め、次に老いる者から先に支えが消える。私はそう信じてきた。", next:"c7_ep8_leon2" },
    { id:"c7_ep8_leon2", type:"dialogue", speaker:"leon", location:DAIN, portrait:"foreman",
      text:"……皇帝。私はもう、あなたの『報酬どおり』にも、数えるだけだった昔の自分にも縋らない。だが問いは捨てられない。私が、その間に立つ。", next:"c7_ep8_zen" },
    { id:"c7_ep8_zen", type:"dialogue", speaker:"hero", location:DAIN, bgmScene:"emotion",
      text:"（師匠。あなたが背負いきれなかった問いが、ここにもあった。……厚年の法典のかけらが一つ、手のひらに戻ってきた。九つのうちの、七つめだ。）",
      next:"c7_ep8_hero_final", flags:{ c7_shard7:1 } },
    { id:"c7_ep8_hero_final", type:"dialogue", speaker:"hero", location:DAIN,
      text:"コウネン皇帝。あなたを裁きには来ていない。問いに答え続けに来た。……厚生年金は、切り捨てるためじゃなく、削られた一人の名を呼んでつなぎ直すためにある。", next:"c7_ep8_final" },
    { id:"c7_ep8_final", type:"dialogue", speaker:"narrator", location:DAIN, bgmScene:"field",
      text:"エオンで、『報酬どおり』の秤が初めて『こぼれる一人の格差』とともに釣り合い直された。だが胸には、勝利より重い問いが残った――報いと底の間を、どう取り持つのか。",
      next:null, flags:{ c7_ep8_done:1, c7_boss_cleared:1, c7_ch07b_done:1 },
      questUpdate:{ qid:"q_ch07b", state:"done", step:9 } }
  ];

  /* 第4〜8話クエスト定義(doneFlag で完了判定)。q_ch07(前半)は無改変の別クエスト。 */
  if(typeof S.registerQuest==="function"){
    S.registerQuest("q_ch07b", {
      title:"積み上げた報酬の果てに・決着",
      chapter:"ch07b",
      steps:["削られる支え","遺された名前","報酬どおりの裁定","決戦前夜","決戦"],
      doneFlag:"c7_ch07b_done"
    });
  }

  S.register("ch07b", NODES);
  S.CH07B_ID = "ch07b";

  /* メイン章の背骨(S.MAIN)へ、ch07(前半)の続きとして追記する。
     ・c7_ch07_done 後、ホームの「今日の冒険」が自動で本話へ進む導線になる。
     ・S.MAIN 未ロード/未定義でも安全(存在する時だけ push、重複登録も防ぐ)。 */
  if(Array.isArray(S.MAIN)){
    var exists = false;
    for(var i=0;i<S.MAIN.length;i++){ if(S.MAIN[i] && S.MAIN[i].id==="ch07b"){ exists = true; break; } }
    if(!exists){
      S.MAIN.push({ id:"ch07b", no:"第七章", title:"積み上げた報酬の果てに・決着", loc:"累層の帝都エオン・厚年法典の広間の奥",
        doneFlag:"c7_ch07b_done", startedFlag:"c7_ep4_start" });
    }
  }
})();
