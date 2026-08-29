"use strict";
/* ============================================================
   story/chapters/chapter-03.js — 第三章「入れなければ払わずに済む」第1〜3話(前半)
   docs/story-bible.md / ENDING-CANON 準拠。舞台=失業街オブロ／題材=雇用保険法(subject 3)。
   テーマ=「入れなければ払わずに済む」制度の穴。失業と再就職の狭間で切られる人々。
   事件モチーフ=離職理由の偽装(自己都合/会社都合)・受給資格・給付制限・待期7日・
   所定給付日数・特定受給資格者。
   ・第1話「切られた街」…失業街オブロ導入。会社都合を自己都合に書き換えられ、離職票も渡されず
                        給付制限で足止めされた男との出会い。新仲間リオ初登場(制度の穴を知り尽くし、
                        その穴で人を救う少女)。○×演習(雇用 s3)→過去問(examFmt)。小ボス=偽装のカルデ。
                        カイ/ミナが「なぜ戦うか」を明示。
   ・第2話「穴を知る少女」…リオの過去(自らも網からこぼれ、穴に落ちた側だった)を掘り下げ加入。
                        受給資格・被保険者期間・待期・給付制限の論点。過去問(五肢択一・個数)混入。
                        小ボス=門前のガロ(新規lt)。
   ・第3話「入れなければ払わずに済む」…穴の歪みそのものと対峙する引き。制度/行政/経営側の事情ビート
                        (適用の網・財源・原資)を断定せず提示。章ボス【シツギョウ魔人 v_boss_s3】への引き。
   ・各話に「経営者/行政/制度側の事情」ビートを置き、断定せず問いを残す。師匠ゼンの影を1本繋ぐ。
   ・chapter-01*.js / chapter-02*.js のノード/quest/ID/証拠/分岐は一切改変しない(別ファイル・別章 "ch03")。
   ・戦闘接続は既存の橋(story-encounter / story-battle-bridge)。encounter に villain と
     exam(examFmt 混入数)を持たせるだけ。採点・SRS・報酬・問題データには一切触れない。
   ・eval/new Function ゼロ。全ノードはデータのみ(next は文字列 or {then,else} or null)。全出力は自前 esc2 経由。
   ・立てるフラグ: c3_ep1_done〜c3_ep3_done / c3_rio_join / c3_boss_next / c3_ch03_done / c3_zen_ash3。
     章前半の完了フラグは c3_ch03_done(章ボス撃破は後続の章で確定する。ここは前半までを確定)。
   ============================================================ */
(function(){
  var G = (typeof window!=="undefined") ? window : globalThis;
  var S = G.SRStory;
  if(!S || typeof S.register!=="function") return;   /* エンジン未ロードでも安全 */

  /* 第三章の話者を表示名テーブルへ追記(描画層があれば。無ければ素通し)。
     新仲間リオ(px=hanna=輪郭線付きバスト)。被害者/制度側/小ボス/章ボスの声も追記。
     既存キー(narrator/hero/kai/mina/gard 等)は無改変。 */
  if(S.SPEAKERS && typeof S.SPEAKERS==="object"){
    if(!S.SPEAKERS.rio)    S.SPEAKERS.rio    = { name:"リオ", px:"hanna" };
    if(!S.SPEAKERS.ojob)   S.SPEAKERS.ojob   = { name:"職を切られた男", px:"ghost" };
    if(!S.SPEAKERS.hwork)  S.SPEAKERS.hwork  = { name:"雇用の相談員 コーゲン", px:"foreman" };
    if(!S.SPEAKERS.gisou)  S.SPEAKERS.gisou  = { name:"偽装のカルデ", px:"e_kacho" };
    if(!S.SPEAKERS.gato)   S.SPEAKERS.gato   = { name:"門前のガロ", px:"e_sabizan" };
    if(!S.SPEAKERS.shitsu) S.SPEAKERS.shitsu = { name:"シツギョウ魔人", px:"e_roukisai" };
  }

  var OBRO  = "失業街オブロ・職安通り";
  var HALL  = "失業街オブロ・雇用の相談所";
  var ALLEY = "失業街オブロ・裏路地";
  var SQUARE= "失業街オブロ・中央広場";

  /* 演習 encounter。opts で相手(villain)と過去問混入数(exam=examFmt の本数)・出題数(n)を指定。
     kind:"train" のまま既存の橋(start*)へ委譲する。採点系は一切新設しない。subject=3。 */
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
       第1話「切られた街」
       失業街オブロ導入。会社都合を自己都合に書き換えられ、離職票も渡されず、給付制限で足止めされた男。
       新仲間リオ初登場。○×演習(雇用 s3)→過去問(examFmt)。小ボス=偽装のカルデ。カイ/ミナが「なぜ戦うか」を明示。
       ============================================================ */
    { id:"c3_ep1_open", start:true, type:"dialogue", speaker:"narrator", location:OBRO, bgmScene:"emotion",
      text:"失業街オブロ。契約を切られた日に会社の寮も追われる。職と住まいが、一枚の紙で同時に消える街だった。",
      next:"c3_ep1_intro", flags:{ c3_ep1_start:1 },
      questUpdate:{ qid:"q_ch03", state:"active", step:0 } },
    { id:"c3_ep1_intro", type:"dialogue", speaker:"narrator", location:OBRO,
      text:"この街の合言葉はひとつ。『入れなければ、払わずに済む』。網に入れない者を作れば、失業しても誰も払わなくていい。", next:"c3_ep1_victim" },
    { id:"c3_ep1_victim", type:"dialogue", speaker:"ojob", location:OBRO, portrait:"ghost", expression:"shock",
      text:"会社の都合で切られた。なのに離職票には『自己都合』と書かれた。……給付は三か月お預けだ。次の仕事までの橋が、落とされてる。", next:"c3_ep1_rio1" },
    { id:"c3_ep1_rio1", type:"dialogue", speaker:"rio", location:OBRO, portrait:"hanna",
      text:"はいはい、そこまで。――離職理由、書き換えられてるね。会社都合を自己都合に。よくある手。でも異議は出せる。ひっくり返せるんだ。", next:"c3_ep1_rio2" },
    { id:"c3_ep1_rio2", type:"dialogue", speaker:"rio", location:OBRO, expression:"angry",
      text:"あたしはリオ。この街で、制度の穴に落ちた人を拾ってる。……穴の場所なら誰より知ってる。あたし自身が、そこから這い上がったから。", next:"c3_ep1_kai1" },
    { id:"c3_ep1_kai1", type:"dialogue", speaker:"kai", location:OBRO, portrait:"helm", expression:"angry",
      text:"離職理由の一文字で、暮らしが三か月止まる。制度は、知らねえ奴を平気で置いていく。……この橋を、落とさせねえ。", next:"c3_ep1_mina1" },
    { id:"c3_ep1_mina1", type:"dialogue", speaker:"mina", location:OBRO, portrait:"wiz",
      text:"雇用保険は、失業と再就職の間の谷を渡す橋です。会社都合か自己都合かで、給付制限も所定給付日数も変わる。一文字が、橋の長さを縮める。", next:"c3_ep1_choice" },

    { id:"c3_ep1_choice", type:"choice", speaker:"hero", location:OBRO, text:"この男に、どう向き合う?",
      choices:[
        { text:"離職理由を正す道筋を、制度で正しく示す",
          ideologyChanges:{ law:1, relief:1 }, flags:{ c3_ep1_path_law:1 }, next:"c3_ep1_probe" },
        { text:"まず、橋を落とされた男の明日への不安を受け止める",
          ideologyChanges:{ human:1, relief:1 }, flags:{ c3_ep1_path_human:1 }, next:"c3_ep1_alt" }
      ]},
    { id:"c3_ep1_alt", type:"dialogue", speaker:"hero", location:OBRO,
      text:"不安で当然です。あなたは何も間違っていない。……その上で聞いてください。離職理由は正せる。橋は、まだ架け直せます。", next:"c3_ep1_probe" },

    { id:"c3_ep1_probe", type:"dialogue", speaker:"narrator", location:HALL, bgmScene:"field",
      text:"離職票を握って渡さない者がいた。渡さなければ手続きは始まらない。始まらなければ、給付も無い。",
      next:"c3_ep1_enc1", questUpdate:{ qid:"q_ch03", state:"active", step:1 } },
    { id:"c3_ep1_enc1", type:"encounter", speaker:"hero", location:HALL, bgmScene:"emotion",
      text:"離職票のヌケガラが書類の束を抱えて現れた。被保険者資格の喪失、離職票の交付、離職理由の区分を、本試験の問いで確かめる。",
      encounter: enc(3, "過去問｜被保険者資格の喪失・離職票・離職理由を問う", { villain:"v_rishoku", exam:2 }),
      evidence:"ev_ch3_riyu", next:"c3_ep1_ev1" },
    { id:"c3_ep1_ev1", type:"dialogue", speaker:"rio", location:HALL,
      text:"ほら、離職票は『速やかに交付』が原則。抱え込んでいい書類じゃない。……これで手続きの入口には立てる。あとは中身だね。", next:"c3_ep1_gisou1" },
    { id:"c3_ep1_gisou1", type:"dialogue", speaker:"gisou", location:HALL, portrait:"e_kacho", expression:"angry",
      text:"――離職理由? 円満退職だろう。会社都合? そんな判子はどこにも押していない。私は書類を整えているだけだ。", next:"c3_ep1_probe2" },
    { id:"c3_ep1_probe2", type:"dialogue", speaker:"narrator", location:HALL, bgmScene:"field",
      text:"偽装のカルデ。離職理由を自己都合に書き換え、給付制限と所定給付日数を不利にする。会社都合との線引きを立て直す。",
      next:"c3_ep1_enc2" },
    { id:"c3_ep1_enc2", type:"encounter", speaker:"hero", location:HALL, bgmScene:"emotion",
      text:"偽装のカルデが、書き換えた離職票を盾に立ちはだかった。離職理由・特定受給資格者・給付制限を、高密度に崩す。",
      encounter: enc(3, "過去問｜離職理由・特定受給資格者・給付制限(小ボス)", { villain:"v_lt_gisou", exam:3 }),
      evidence:"ev_ch3_gisou", next:"c3_ep1_ev2" },
    { id:"c3_ep1_ev2", type:"dialogue", speaker:"mina", location:HALL,
      text:"書き換えの手口、証拠に残せました。会社都合なら給付制限は付かず、日数も手厚い。……一文字を、正しい一文字へ戻せました。", next:"c3_ep1_reason" },
    { id:"c3_ep1_reason", type:"reasoning", speaker:"hero", location:HALL, bgmScene:"emotion",
      text:"離職票の交付、離職理由の区分、特定受給資格者の枠。――どれも、谷に架ける橋の長さを決める条文だ。一文字で橋を縮める。それが細工だ。",
      reasoning:{ need:["ev_ch3_riyu","ev_ch3_gisou"] },
      flags:{ c3_ep1_reasoned:1 }, next:"c3_ep1_biz" },

    /* 【制度側の事情】断定せず提示 */
    { id:"c3_ep1_biz", type:"dialogue", speaker:"hwork", location:HALL,
      text:"……離職理由を正すのは正しい。だが会社都合が増えれば、事業主の保険料率は上がる。助成金も止まる。その圧を、誰が引き受ける?", next:"c3_ep1_hero2" },
    { id:"c3_ep1_hero2", type:"dialogue", speaker:"hero", location:HALL,
      text:"（会社が寄せる理由は本当だ。……でも、その付けを切られた本人の給付で払わせるのは違う。圧を、一番弱い一人に流さない。）",
      next:"c3_ep1_end", ideologyChanges:{ mgmt:1, fair:1 }, flags:{ c3_ep1_saw_sides:1 } },
    { id:"c3_ep1_end", type:"dialogue", speaker:"narrator", location:OBRO, bgmScene:"field",
      text:"男は正された離職票を握りしめ、初めて背筋を伸ばした。リオは子どもに飴を配りながら、四人を横目で見ていた。",
      next:"c3_ep1_hook", flags:{ c3_ep1_done:1 }, questUpdate:{ qid:"q_ch03", state:"active", step:2 } },
    { id:"c3_ep1_hook", type:"dialogue", speaker:"rio", location:OBRO,
      text:"……ねえ調律師さん。本気で穴を塞ぐ気? だったら、あたしの話も聞いてもらおうかな。いちばん深く落ちたのが、誰だったか。", next:"c3_ep2_open" },

    /* ============================================================
       第2話「穴を知る少女」
       リオの過去を掘り下げ加入。受給資格・被保険者期間・待期・給付制限。
       過去問(五肢択一・個数)混入。小ボス=門前のガロ(新規lt)。
       ============================================================ */
    { id:"c3_ep2_open", type:"dialogue", speaker:"narrator", location:ALLEY, bgmScene:"emotion",
      text:"裏路地の古い長屋。リオは色あせた離職票の束を広げた。一枚だけ、宛名が擦り切れて読めない古いものが混じっていた。",
      next:"c3_ep2_rio1", flags:{ c3_ep2_start:1 } },
    { id:"c3_ep2_rio1", type:"dialogue", speaker:"rio", location:ALLEY, portrait:"hanna", expression:"shock",
      text:"この一枚、あたしの母さんの。……あと一月、被保険者期間が足りなくて資格が取れなかった。会社が、加入をわざと遅らせてたんだ。", next:"c3_ep2_rio2" },
    { id:"c3_ep2_rio2", type:"dialogue", speaker:"rio", location:ALLEY,
      text:"だから制度を丸ごと覚えた。受給資格、被保険者期間、待期の七日、給付制限、所定給付日数。……次の誰かが、母さんみたいに落ちないように。", next:"c3_ep2_gard1" },
    { id:"c3_ep2_gard1", type:"dialogue", speaker:"gard", location:ALLEY, portrait:"oni",
      text:"……嬢ちゃん。おれも国に見捨てられた側だ。その悔しさで人を恨むこともできた。だがお前は、穴の地図を描いた。……大したもんだよ。", next:"c3_ep2_join" },
    { id:"c3_ep2_join", type:"dialogue", speaker:"rio", location:ALLEY, bgmScene:"emotion", expression:"angry",
      text:"……ふん、口説くのが下手だね。いいよ、乗った。あたしの地図、貸してやる。条件は一つ――誰ひとり、穴に置き去りにしないこと。",
      next:"c3_ep2_kai1", relationshipChanges:{ cp3:1 }, flags:{ c3_rio_join:1 } },
    { id:"c3_ep2_kai1", type:"dialogue", speaker:"kai", location:ALLEY,
      text:"上等だ。置き去りは、おれが一番嫌いなやつだからな。リオ、遠慮なく使わせてもらう。", next:"c3_ep2_choice" },

    { id:"c3_ep2_choice", type:"choice", speaker:"hero", location:ALLEY, text:"リオの地図を、どう使う?",
      choices:[
        { text:"受給資格と被保険者期間を、制度で一人ずつ確かめて回る",
          ideologyChanges:{ law:1, fair:1 }, flags:{ c3_ep2_path_law:1 }, next:"c3_ep2_probe" },
        { text:"落ちた者の声を先に集め、そこから穴を塞ぐ",
          ideologyChanges:{ human:1, relief:1 }, flags:{ c3_ep2_path_human:1 }, next:"c3_ep2_alt" }
      ]},
    { id:"c3_ep2_alt", type:"dialogue", speaker:"hero", location:ALLEY,
      text:"数字の前に、一人がいる。加入を遅らされた者、待期を数え違えさせられた者。……リオ、あなたの母さんの一枚から始めさせてください。", next:"c3_ep2_probe" },

    { id:"c3_ep2_probe", type:"dialogue", speaker:"narrator", location:HALL, bgmScene:"field",
      text:"待期の七日と給付制限を混同させ、動ける日を惑わす者がいた。数え違えれば、受け取れる日も、動くべき日もずれてゆく。",
      next:"c3_ep2_enc1", questUpdate:{ qid:"q_ch03", state:"active", step:3 } },
    { id:"c3_ep2_enc1", type:"encounter", speaker:"hero", location:HALL, bgmScene:"emotion",
      text:"待期のマドロミが、七日と給付制限を霧の中で混ぜにきた。待期・給付制限・所定給付日数を、本試験の問いで数え直す。",
      encounter: enc(3, "過去問｜待期・給付制限・所定給付日数を問う", { villain:"v_taiki", exam:2 }),
      evidence:"ev_ch3_seigen", next:"c3_ep2_ev1" },
    { id:"c3_ep2_ev1", type:"dialogue", speaker:"rio", location:HALL,
      text:"待期は七日、まず誰でも共通。給付制限はその後、自己都合なら原則付く。……霧は晴れた。次は、受給資格そのものを渋る番人だ。", next:"c3_ep2_gato1" },
    { id:"c3_ep2_gato1", type:"dialogue", speaker:"gato", location:HALL, portrait:"e_sabizan", expression:"angry",
      text:"受給資格だと? 通算の被保険者期間が足りんな。……足りんと言えば、足りんのだ。数え方は、こちらが決める。", next:"c3_ep2_probe2" },
    { id:"c3_ep2_probe2", type:"dialogue", speaker:"narrator", location:HALL, bgmScene:"field",
      text:"門前のガロ。被保険者期間の数え方を偽り、資格ありの者を『資格なし』と追い返す。算定対象期間と通算を、立て直す。",
      next:"c3_ep2_enc2" },
    { id:"c3_ep2_enc2", type:"encounter", speaker:"hero", location:HALL, bgmScene:"emotion",
      text:"門前のガロが窓口を塞いで立ちはだかった。受給資格・被保険者期間の通算・算定対象期間。リオの母さんが、あと一月で落ちた穴だ。",
      encounter: enc(3, "過去問｜受給資格・被保険者期間の通算(小ボス)", { villain:"v_lt_gato", exam:3 }),
      evidence:"ev_ch3_shikaku", next:"c3_ep2_ev2" },
    { id:"c3_ep2_ev2", type:"dialogue", speaker:"mina", location:HALL,
      text:"通算の筋、通しました。正しく数えれば――資格は、あります。ガロの『足りん』は偽りでした。リオさん……お母さまの一月も、本当は。", next:"c3_ep2_reason" },
    { id:"c3_ep2_reason", type:"reasoning", speaker:"hero", location:HALL, bgmScene:"emotion",
      text:"待期の七日、給付制限、受給資格、被保険者期間の通算。――どれも、渡る資格と渡り始める日を決める条文だ。偽れば、渡れる者まで網の外にされる。",
      reasoning:{ need:["ev_ch3_seigen","ev_ch3_shikaku"] },
      flags:{ c3_ep2_reasoned:1 }, next:"c3_ep2_biz" },

    /* 【行政/制度側の事情】断定せず、次話の壁として残す */
    { id:"c3_ep2_biz", type:"dialogue", speaker:"hwork", location:HALL, expression:"shock",
      text:"……厳しく数えるのには理由もある。緩めれば、短く働いては辞めて受け取る者が群がりかねん。私は、その悪用から網を守っていたつもりだった。", next:"c3_ep2_hero2" },
    { id:"c3_ep2_hero2", type:"dialogue", speaker:"hero", location:HALL,
      text:"（一部の悪用を防ぐことと、全部を疑って締めること。この人も混ぜている。線は引ける。悪用は後で弾ける。）",
      next:"c3_ep2_end", ideologyChanges:{ fair:1, mgmt:1 }, flags:{ c3_ep2_saw_sides:1 } },
    { id:"c3_ep2_end", type:"dialogue", speaker:"narrator", location:ALLEY, bgmScene:"field",
      text:"リオは母の擦り切れた離職票を、そっと束の一番上に戻した。『次は、置き去りにしない』――その横顔に、確かな芯があった。",
      next:"c3_ep2_hook", flags:{ c3_ep2_done:1 }, questUpdate:{ qid:"q_ch03", state:"active", step:4 } },
    { id:"c3_ep2_hook", type:"dialogue", speaker:"rio", location:ALLEY, expression:"angry",
      text:"……でもね、小ボスを何人倒しても街の空気は変わらない。『入れなければ払わずに済む』が、真ん中にでかい影で立ってる。次は、そいつだよ。", next:"c3_ep3_open" },

    /* ============================================================
       第3話「入れなければ払わずに済む」
       穴の歪みそのものと対峙する引き。制度/行政/経営側の事情ビートを断定せず提示。
       師匠ゼンの影を1本繋ぐ。章ボス【シツギョウ魔人 v_boss_s3】への引き。
       ============================================================ */
    { id:"c3_ep3_open", type:"dialogue", speaker:"narrator", location:SQUARE, bgmScene:"emotion",
      text:"中央広場。掲示板に無数の求人。だがその前に、加入名簿から名を消された者たちが、列すら作れずに座り込んでいた。",
      next:"c3_ep3_rio1", flags:{ c3_ep3_start:1 } },
    { id:"c3_ep3_rio1", type:"dialogue", speaker:"rio", location:SQUARE, portrait:"hanna",
      text:"見て。みんな『雇用保険に入っていなかったことにされた』人。週の労働時間を少し削られて、条件から外された。……街ぐるみの手口だよ。", next:"c3_ep3_mina1" },
    { id:"c3_ep3_mina1", type:"dialogue", speaker:"mina", location:SQUARE, portrait:"wiz",
      text:"適用の要件を、ぎりぎり満たさせない。加入を遅らせる。時間を削る。……積もれば、街の半分が網の外に置かれます。数字の上では、失業者は居なかったことになる。", next:"c3_ep3_zen" },
    { id:"c3_ep3_zen", type:"dialogue", speaker:"narrator", location:SQUARE, bgmScene:"emotion",
      text:"広場の古い適用台帳。表紙の裏に掠れた字。『網の目を決める者は、目からこぼれる者の顔を見よ』――師匠ゼンの筆跡だった。",
      next:"c3_ep3_choice", flags:{ c3_zen_ash3:1 } },

    { id:"c3_ep3_choice", type:"choice", speaker:"hero", location:SQUARE, text:"『入れなければ払わずに済む』に、どう立つ?",
      choices:[
        { text:"適用の網を、条文で正しく広げ直す",
          ideologyChanges:{ law:1, fair:1 }, flags:{ c3_ep3_path_law:1 }, next:"c3_ep3_probe" },
        { text:"網からこぼれた一人ひとりを、まず数え直す",
          ideologyChanges:{ human:1, relief:1 }, flags:{ c3_ep3_path_count:1 }, next:"c3_ep3_alt" }
      ]},
    { id:"c3_ep3_alt", type:"dialogue", speaker:"hero", location:SQUARE,
      text:"平均や統計の前に、一人がいる。加入を遅らされた者。時間を削られた者。リオの母さん。……そこからしか、網は編み直せない。", next:"c3_ep3_probe" },

    { id:"c3_ep3_probe", type:"dialogue", speaker:"narrator", location:SQUARE, bgmScene:"field",
      text:"『対象外』の判を押し続ける手先が、最後の抵抗に出た。特定受給資格者にも、手厚い日数にも手を届かせない手口を剥がす。",
      next:"c3_ep3_enc1", questUpdate:{ qid:"q_ch03", state:"active", step:5 } },
    { id:"c3_ep3_enc1", type:"encounter", speaker:"hero", location:SQUARE, bgmScene:"emotion",
      text:"離職票のヌケガラが再び現れた。特定受給資格者・特定理由離職者・所定給付日数を、本試験の問いで崩す。本来の日数を取り戻す。",
      encounter: enc(3, "過去問｜特定受給資格者・所定給付日数を取り戻す", { villain:"v_rishoku", exam:2 }),
      evidence:"ev_ch3_tokutei", next:"c3_ep3_ev1" },
    { id:"c3_ep3_ev1", type:"dialogue", speaker:"rio", location:SQUARE,
      text:"倒産や解雇で急に切られた人は、給付日数が手厚くなる。……網の外に落とされた人ほど、本当は手厚く支えられるはずだったんだ。", next:"c3_ep3_reason" },
    { id:"c3_ep3_reason", type:"reasoning", speaker:"hero", location:SQUARE, bgmScene:"emotion",
      text:"離職理由、受給資格、待期と給付制限、所定給付日数。――全部、谷に橋を架ける条文だった。『入れなければ払わずに済む』は、橋の入口ごと隠す細工だ。",
      reasoning:{ need:["ev_ch3_tokutei"] },
      flags:{ c3_ep3_reasoned:1 }, next:"c3_ep3_biz" },

    /* 【制度/行政/経営側の事情】断定せず、章ボスへの問いとして残す */
    { id:"c3_ep3_biz", type:"dialogue", speaker:"hwork", location:SQUARE, expression:"shock",
      text:"……分かった。だが私の背後に立つものは大きい。原資を惜しむ事業主と、財源を案じる行政が、長く吸い続けた空気だ。覆せるか。", next:"c3_ep3_boss_hook" },
    { id:"c3_ep3_boss_hook", type:"dialogue", speaker:"shitsu", location:SQUARE, portrait:"e_roukisai", expression:"angry",
      text:"――加入していたか? 資格は満たしたか? 満たさぬ者を誰が拾う? こぼれたのは、そいつの落ち度だ。その習いに、抗うか。",
      next:"c3_ep3_hero_final", flags:{ c3_boss_next:1 } },
    { id:"c3_ep3_hero_final", type:"dialogue", speaker:"hero", location:SQUARE,
      text:"抗う。カイも、ミナも、ガルドも、リオもいる。こぼされた者たちも顔を上げた。……その合言葉を、雇用の全体像で覆しに行く。", next:"c3_ep3_end" },
    { id:"c3_ep3_end", type:"dialogue", speaker:"narrator", location:SQUARE, bgmScene:"field",
      text:"失業街オブロで、切り捨ての合言葉が初めて言い返された。だが街の中心に立つ影――シツギョウ魔人との対峙は、まだこれからだ。",
      next:null, flags:{ c3_ep3_done:1, c3_ch03_done:1 },
      questUpdate:{ qid:"q_ch03", state:"done", step:6 } }
  ];

  /* 第1〜3話(章前半)クエスト定義(doneFlag で完了判定)。第一/二章の各クエストは無改変の別クエスト。 */
  if(typeof S.registerQuest==="function"){
    S.registerQuest("q_ch03", {
      title:"入れなければ払わずに済む",
      chapter:"ch03",
      steps:["切られた街","穴を知る少女","入れなければ払わずに済む"],
      doneFlag:"c3_ch03_done"
    });
  }

  S.register("ch03", NODES);
  S.CH03_ID = "ch03";

  /* メイン章の背骨(S.MAIN)へ、第二章(ch02b)の続きとして追記する。
     ・第二章クリア(c2_ch02b_done)後、ホームの「今日の冒険」が自動で本章へ進む導線になる。
     ・章選択画面は前章 done まで locked=第二章クリアが解放ゲートとして機能する(既存規則に沿う)。
     ・S.MAIN 未ロード/未定義でも安全(存在する時だけ push、重複登録も防ぐ)。 */
  if(Array.isArray(S.MAIN)){
    var exists = false;
    for(var i=0;i<S.MAIN.length;i++){ if(S.MAIN[i] && S.MAIN[i].id==="ch03"){ exists = true; break; } }
    if(!exists){
      S.MAIN.push({ id:"ch03", no:"第三章", title:"入れなければ払わずに済む", loc:"失業街オブロ",
        doneFlag:"c3_ch03_done", startedFlag:"c3_ep1_start" });
    }
  }
})();
