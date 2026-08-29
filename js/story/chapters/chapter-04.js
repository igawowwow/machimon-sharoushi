"use strict";
/* ============================================================
   story/chapters/chapter-04.js — 第四章「払わぬが勝ち」第1〜3話(前半)
   docs/story-bible.md / ENDING-CANON 準拠。舞台=徴収路(火山イグニスから街道へ続く長い道)／
   題材=労働保険徴収法(subject 4)。テーマ=『払わぬが勝ち』という財源の逃避。
   保険料を納めぬ事業主と、痩せていく制度の原資。
   事件モチーフ=概算保険料/確定保険料・年度更新・延滞金/追徴金・メリット制・印紙保険料・
   一括有期・労働保険事務組合・督促。
   ・第1話「払わぬ街道」…徴収路 導入。年度更新を遅らされ、延滞金と追徴金に潰されかけた事業主との出会い。
                        新仲間トキ初登場(元・労働保険事務組合の徴収人。数字に厳格だが、取りっぱぐれた
                        事業主の裏側の困窮も見てきた)。○×演習(徴収 s4)→過去問(examFmt)。小ボス=概算のガザン。
                        カイ/ミナが「なぜ戦うか」を明示。
   ・第2話「取り立ての裏側」…トキの過去(事務組合で、払えぬ事業主から取り立て続けた側だった)を掘り下げ加入。
                        概算・確定・メリット制・印紙保険料の論点。過去問(五肢択一・個数)混入。小ボス=メリットのロズ。
   ・第3話「払わぬが勝ち」…テーマの歪みそのものと対峙する引き。制度/行政/経営側の事情ビート(原資・負担・
                        取りっぱぐれ)を断定せず提示。師匠ゼンの影を1本繋ぐ。章ボス【取立番長 v_boss_s4】への引き。
   ・各話に「経営者/行政/制度側の事情」ビートを置き、断定せず問いを残す。師匠ゼンの影を1本繋ぐ。
   ・chapter-01*.js / chapter-02*.js / chapter-03*.js のノード/quest/ID/証拠/分岐は一切改変しない(別ファイル・別章 "ch04")。
   ・戦闘接続は既存の橋(story-encounter / story-battle-bridge)。encounter に villain と
     exam(examFmt 混入数)を持たせるだけ。採点・SRS・報酬・問題データには一切触れない。
   ・eval/new Function ゼロ。全ノードはデータのみ(next は文字列 or {then,else} or null)。全出力は自前 esc2 経由。
   ・立てるフラグ: c4_ep1_done〜c4_ep3_done / c4_toki_join / c4_boss_next / c4_ch04_done / c4_zen_ash4。
     章前半の完了フラグは c4_ch04_done(章ボス撃破は後続の章で確定する。ここは前半までを確定)。
   ・注: 仲間トキの好感度キーは cp4(前半 c4_toki_join で加入)。data-companions.js の cp4(徴収の達人・銭形)とは
     別レイヤー(物語の関係値 getRel/setRel はパーティ・パッシブと独立)なので、既存テストを割らずに深化させる。
   ============================================================ */
(function(){
  var G = (typeof window!=="undefined") ? window : globalThis;
  var S = G.SRStory;
  if(!S || typeof S.register!=="function") return;   /* エンジン未ロードでも安全 */

  /* 第四章の話者を表示名テーブルへ追記(描画層があれば。無ければ素通し)。
     新仲間トキ(px=foreman=輪郭線付きバスト)。被害者/制度側/小ボス/章ボスの声も追記。
     既存キー(narrator/hero/kai/mina/gard/rio 等)は無改変。 */
  if(S.SPEAKERS && typeof S.SPEAKERS==="object"){
    if(!S.SPEAKERS.toki)    S.SPEAKERS.toki    = { name:"トキ", px:"foreman" };
    if(!S.SPEAKERS.onushi)  S.SPEAKERS.onushi  = { name:"潰れかけの事業主", px:"ghost" };
    if(!S.SPEAKERS.hcho)    S.SPEAKERS.hcho    = { name:"徴収の相談員 カネミ", px:"foreman" };
    if(!S.SPEAKERS.gaisan)  S.SPEAKERS.gaisan  = { name:"概算のガザン", px:"e_gizo" };
    if(!S.SPEAKERS.merit)   S.SPEAKERS.merit   = { name:"メリットのロズ", px:"e_nabakari" };
    if(!S.SPEAKERS.toritate)S.SPEAKERS.toritate= { name:"取立番長", px:"e_kacho" };
  }

  var ROAD  = "徴収路・火口の関所";
  var YADO  = "徴収路・年度更新の宿場";
  var TSUME = "徴収路・事務組合の詰所";
  var SEKI  = "徴収路・督促の関所";

  /* 演習 encounter。opts で相手(villain)と過去問混入数(exam=examFmt の本数)・出題数(n)を指定。
     kind:"train" のまま既存の橋(start*)へ委譲する。採点系は一切新設しない。subject=4。 */
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
       第1話「払わぬ街道」
       徴収路 導入。年度更新を遅らされ、延滞金と追徴金に潰されかけた事業主。新仲間トキ初登場。
       ○×演習(徴収 s4)→過去問(examFmt)。小ボス=概算のガザン。カイ/ミナが「なぜ戦うか」を明示。
       ============================================================ */
    { id:"c4_ep1_open", start:true, type:"dialogue", speaker:"narrator", location:ROAD, bgmScene:"emotion",
      text:"徴収路。労災も雇用も、給付の原資はすべてこの道を通って集められる。だが道の脇には、潰れた荷車のように座り込む事業主が並んでいた。",
      next:"c4_ep1_intro", flags:{ c4_ep1_start:1 },
      questUpdate:{ qid:"q_ch04", state:"active", step:0 } },
    { id:"c4_ep1_intro", type:"dialogue", speaker:"narrator", location:ROAD,
      text:"この道の合言葉はひとつ。『払わぬが勝ち』。納めぬ者は逃げ延び、律儀に納めた者ほど取り立てを重ねられる。原資が、静かに漏れていた。", next:"c4_ep1_victim" },
    { id:"c4_ep1_victim", type:"dialogue", speaker:"onushi", location:ROAD, portrait:"ghost", expression:"shock",
      text:"小さな工場をやってた。年度更新を『来年でいい』と言われて、そのままにした。……気づいたら延滞金と追徴金で、元の倍だ。隣の親方は、最初から入ってすらいねえ。", next:"c4_ep1_toki1" },
    { id:"c4_ep1_toki1", type:"dialogue", speaker:"toki", location:ROAD, portrait:"foreman",
      text:"……待ちな。その延滞金、額がおかしい。期限も割合も法で決まってる。誰かが『来年でいい』と言って、わざと遅らせたね。", next:"c4_ep1_toki2" },
    { id:"c4_ep1_toki2", type:"dialogue", speaker:"toki", location:ROAD, expression:"angry",
      text:"あたしはトキ。昔、労働保険事務組合で徴収人をやってた。……概算で前払いして、確定で精算する。その全部を、この手で扱ってきた。", next:"c4_ep1_kai1" },
    { id:"c4_ep1_kai1", type:"dialogue", speaker:"kai", location:ROAD, portrait:"helm", expression:"angry",
      text:"申告を一年遅らせただけで、保険料が倍に膨れて、人が仕事場を失う。……入口が壊れてたら、出口も涸れる。だから、漏れを止める。", next:"c4_ep1_mina1" },
    { id:"c4_ep1_mina1", type:"dialogue", speaker:"mina", location:ROAD, portrait:"wiz",
      text:"労働保険料は、労災と雇用の給付を支える原資です。まず概算で前払いし、年度末に確定で精算する。これが年度更新。……一年の遅れが、原資も同時に痩せさせます。", next:"c4_ep1_choice" },

    { id:"c4_ep1_choice", type:"choice", speaker:"hero", location:ROAD, text:"この事業主に、どう向き合う?",
      choices:[
        { text:"年度更新と延滞金の筋を、制度で正しく積み直す",
          ideologyChanges:{ law:1, mgmt:1 }, flags:{ c4_ep1_path_law:1 }, next:"c4_ep1_probe" },
        { text:"まず、店をたたむ瀬戸際に立つ事業主の焦りを受け止める",
          ideologyChanges:{ human:1, relief:1 }, flags:{ c4_ep1_path_human:1 }, next:"c4_ep1_alt" }
      ]},
    { id:"c4_ep1_alt", type:"dialogue", speaker:"hero", location:ROAD,
      text:"焦って当然です。人を雇い、道を支えてきたのはあなただ。……その上で。延滞金は額が狂っている。正しく積み直せば、まだ間に合う。", next:"c4_ep1_probe" },

    { id:"c4_ep1_probe", type:"dialogue", speaker:"narrator", location:YADO, bgmScene:"field",
      text:"年度更新の申告書を握って、わざと期限を過ぎさせる者がいた。過ぎれば延滞金、慌てさせて誤らせれば追徴金。",
      next:"c4_ep1_enc1", questUpdate:{ qid:"q_ch04", state:"active", step:1 } },
    { id:"c4_ep1_enc1", type:"encounter", speaker:"hero", location:YADO, bgmScene:"emotion",
      text:"督促のトクガが督促状の束を抱えて現れた。概算保険料・確定保険料・年度更新の期限・延滞金を、本試験の問いで確かめる。",
      encounter: enc(4, "過去問｜概算・確定保険料・年度更新・延滞金を問う", { villain:"v_tokusoku", exam:2 }),
      evidence:"ev_ch4_nendo", next:"c4_ep1_ev1" },
    { id:"c4_ep1_ev1", type:"dialogue", speaker:"toki", location:YADO,
      text:"概算はあくまで前払い。年度末の確定で、多けりゃ返る、足りなきゃ足す。……これで延滞金の起算も数え直せる。あとは、膨らませた張本人だ。", next:"c4_ep1_gaisan1" },
    { id:"c4_ep1_gaisan1", type:"dialogue", speaker:"gaisan", location:YADO, portrait:"e_gizo", expression:"angry",
      text:"――延滞金? 正当な取り立てだよ。期限を過ぎたのはこの事業主だろう。概算か確定か迷ったのは、そちらの落ち度。迷った分だけ、延滞金は育つ。", next:"c4_ep1_probe2" },
    { id:"c4_ep1_probe2", type:"dialogue", speaker:"narrator", location:YADO, bgmScene:"field",
      text:"概算のガザン。概算と確定を混同させ、年度更新を遅らせて延滞金・追徴金を膨らませる。精算の筋を立て直す。",
      next:"c4_ep1_enc2" },
    { id:"c4_ep1_enc2", type:"encounter", speaker:"hero", location:YADO, bgmScene:"emotion",
      text:"概算のガザンが、水増しした督促状を盾に立ちはだかった。概算・確定の精算、年度更新の期限、延滞金と追徴金を高密度に崩す。",
      encounter: enc(4, "過去問｜概算・確定の精算・年度更新・延滞金/追徴金(小ボス)", { villain:"v_lt_gaisan", exam:3 }),
      evidence:"ev_ch4_gaisan", next:"c4_ep1_ev2" },
    { id:"c4_ep1_ev2", type:"dialogue", speaker:"mina", location:YADO,
      text:"水増しの手口、証拠に残せました。確定で精算すれば払い過ぎは還付される。延滞金は正しい起算日から。……本来の額へ戻せました。", next:"c4_ep1_reason" },
    { id:"c4_ep1_reason", type:"reasoning", speaker:"hero", location:YADO, bgmScene:"emotion",
      text:"概算、確定、年度更新の期限、延滞金と追徴金。――原資をいつ・いくら集めるかを決める条文だ。遅らせて膨らませる。それが漏らす細工だ。",
      reasoning:{ need:["ev_ch4_nendo","ev_ch4_gaisan"] },
      flags:{ c4_ep1_reasoned:1 }, next:"c4_ep1_biz" },

    /* 【制度側の事情】断定せず提示 */
    { id:"c4_ep1_biz", type:"dialogue", speaker:"hcho", location:YADO,
      text:"……延滞金を正すのは正しい。だが期限を緩めれば、払える者まで先延ばしにする。延滞金は、律儀に納めた者との公平を保つ鞭でもあるのだ。", next:"c4_ep1_hero2" },
    { id:"c4_ep1_hero2", type:"dialogue", speaker:"hero", location:YADO,
      text:"（期限を守らせる意味は本当だ。……でも、わざと遅らされた者まで同じ鞭で倍を負わせるのは違う。振るう相手を、間違えたくない。）",
      next:"c4_ep1_end", ideologyChanges:{ fair:1, mgmt:1 }, flags:{ c4_ep1_saw_sides:1 } },
    { id:"c4_ep1_end", type:"dialogue", speaker:"narrator", location:ROAD, bgmScene:"field",
      text:"事業主は正された申告書を握りしめ、初めて背筋を伸ばした。トキは欄外に、本来の延滞金の額を慣れた手つきで書き足してやった。",
      next:"c4_ep1_hook", flags:{ c4_ep1_done:1 }, questUpdate:{ qid:"q_ch04", state:"active", step:2 } },
    { id:"c4_ep1_hook", type:"dialogue", speaker:"toki", location:ROAD,
      text:"……ねえ調律師さん。本気でこの道の漏れを止める気? だったら、あたしの話も聞いてもらおうかね。取り立てる側にいた、あたし自身の話さ。", next:"c4_ep2_open" },

    /* ============================================================
       第2話「取り立ての裏側」
       トキの過去を掘り下げ加入。概算・確定・メリット制・印紙保険料。
       過去問(五肢択一・個数)混入。小ボス=メリットのロズ。
       ============================================================ */
    { id:"c4_ep2_open", type:"dialogue", speaker:"narrator", location:TSUME, bgmScene:"emotion",
      text:"事務組合の詰所。トキは古い徴収台帳を広げた。一冊だけ、表紙が黒く焦げ、判が滲んで読めないものが混じっていた。",
      next:"c4_ep2_toki1", flags:{ c4_ep2_start:1 } },
    { id:"c4_ep2_toki1", type:"dialogue", speaker:"toki", location:TSUME, portrait:"foreman", expression:"shock",
      text:"この一冊、あたしが最後に取り立てた工場のだ。……延滞金まできっちり取った。その工場は次の月に火を出して、たたんだ。払えば人を切るしかなかったんだ。", next:"c4_ep2_toki2" },
    { id:"c4_ep2_toki2", type:"dialogue", speaker:"toki", location:TSUME,
      text:"だから徴収の全部を覚え直した。概算と確定、メリット制の収支率、印紙保険料、一括有期。……取りすぎずに済む線を、引くために。", next:"c4_ep2_gard1" },
    { id:"c4_ep2_gard1", type:"dialogue", speaker:"gard", location:TSUME, portrait:"oni",
      text:"……姐さん。おれも上の命令で守れなかった者がいる。だがあんたは、その悔いで取り立ての地図を裏返した。……大したもんだよ。", next:"c4_ep2_join" },
    { id:"c4_ep2_join", type:"dialogue", speaker:"toki", location:TSUME, bgmScene:"emotion", expression:"angry",
      text:"……ふん、世辞が下手だね。いいよ、乗った。あたしの地図、貸してやる。条件は一つ――取り立てる相手の裏側の顔を、見ないふりしないこと。",
      next:"c4_ep2_kai1", relationshipChanges:{ cp4:1 }, flags:{ c4_toki_join:1 } },
    { id:"c4_ep2_kai1", type:"dialogue", speaker:"kai", location:TSUME,
      text:"上等だ。見ないふりは、おれが一番嫌いなやつだからな。トキ、遠慮なく使わせてもらう。", next:"c4_ep2_choice" },

    { id:"c4_ep2_choice", type:"choice", speaker:"hero", location:TSUME, text:"トキの地図を、どう使う?",
      choices:[
        { text:"メリット制と印紙保険料を、制度で一件ずつ確かめて回る",
          ideologyChanges:{ law:1, mgmt:1 }, flags:{ c4_ep2_path_law:1 }, next:"c4_ep2_probe" },
        { text:"取り立てられ、火を出した側の声を先に集める",
          ideologyChanges:{ human:1, relief:1 }, flags:{ c4_ep2_path_human:1 }, next:"c4_ep2_alt" }
      ]},
    { id:"c4_ep2_alt", type:"dialogue", speaker:"hero", location:TSUME,
      text:"収支率や割合の前に、一人がいる。払えずに火を出した者、事故を隠させられた者。……トキ、あなたの焦げた一冊から始めさせてください。", next:"c4_ep2_probe" },

    { id:"c4_ep2_probe", type:"dialogue", speaker:"narrator", location:TSUME, bgmScene:"field",
      text:"概算の額と印紙保険料の枚数を混同させ、納める額を惑わす者がいた。数え違えれば、払い過ぎも納め漏れも生まれる。",
      next:"c4_ep2_enc1", questUpdate:{ qid:"q_ch04", state:"active", step:3 } },
    { id:"c4_ep2_enc1", type:"encounter", speaker:"hero", location:TSUME, bgmScene:"emotion",
      text:"督促のトクガが、印紙と概算を霧の中で混ぜにきた。印紙保険料・概算保険料の算定・一括有期事業を、本試験の問いで数え直す。",
      encounter: enc(4, "過去問｜印紙保険料・概算保険料・一括有期を問う", { villain:"v_tokusoku", exam:2 }),
      evidence:"ev_ch4_inshi", next:"c4_ep2_ev1" },
    { id:"c4_ep2_ev1", type:"dialogue", speaker:"toki", location:TSUME,
      text:"印紙保険料は日雇労働被保険者の分を印紙で日ごとに納める。概算の年額とは別勘定だ。……次は、収支率を操って事故を隠させる査定人だ。", next:"c4_ep2_merit1" },
    { id:"c4_ep2_merit1", type:"dialogue", speaker:"merit", location:TSUME, portrait:"e_nabakari", expression:"angry",
      text:"事故を届ける? 収支率が上がるぞ。率が上がれば来年の保険料も上がる。……ならば、届けなければいい。損得は、私が計算してやる。", next:"c4_ep2_probe2" },
    { id:"c4_ep2_probe2", type:"dialogue", speaker:"narrator", location:TSUME, bgmScene:"field",
      text:"メリットのロズ。収支率を盾に、保険料を下げる名目で労災の不申告を唆す。メリット制の増減の筋を立て直す。",
      next:"c4_ep2_enc2" },
    { id:"c4_ep2_enc2", type:"encounter", speaker:"hero", location:TSUME, bgmScene:"emotion",
      text:"メリットのロズが収支率の表を盾に立ちはだかった。メリット制・収支率・労災保険率・印紙保険料を高密度に崩す。トキの工場が呑まれた霧だ。",
      encounter: enc(4, "過去問｜メリット制・収支率・労災保険率(小ボス)", { villain:"v_lt_merit", exam:3 }),
      evidence:"ev_ch4_merit", next:"c4_ep2_ev2" },
    { id:"c4_ep2_ev2", type:"dialogue", speaker:"mina", location:TSUME,
      text:"メリット制の筋、通しました。収支率に応じて率が増減するのは、安全に取り組んだ事業主に報いる仕組みです。事故を隠す口実ではありません。", next:"c4_ep2_reason" },
    { id:"c4_ep2_reason", type:"reasoning", speaker:"hero", location:TSUME, bgmScene:"emotion",
      text:"印紙保険料、概算の算定、一括有期、メリット制、労災保険率。――誰から・いくら集めるかの条文だ。事故を隠させれば、原資も補償も同時に痩せる。",
      reasoning:{ need:["ev_ch4_inshi","ev_ch4_merit"] },
      flags:{ c4_ep2_reasoned:1 }, next:"c4_ep2_biz" },

    /* 【行政/制度側の事情】断定せず、次話の壁として残す */
    { id:"c4_ep2_biz", type:"dialogue", speaker:"hcho", location:TSUME, expression:"shock",
      text:"……率を下げるのには理由もある。事故を減らした事業主に報いなければ、誰も安全に金をかけん。私は、その均衡を守っているつもりだった。", next:"c4_ep2_hero2" },
    { id:"c4_ep2_hero2", type:"dialogue", speaker:"hero", location:TSUME,
      text:"（安全に報いる仕組みと、事故を隠す口実。この人も混ぜている。線は引ける。隠蔽は後で弾ける。傷ついた一人を、闇に葬ってはいけない。）",
      next:"c4_ep2_end", ideologyChanges:{ fair:1, mgmt:1 }, flags:{ c4_ep2_saw_sides:1 } },
    { id:"c4_ep2_end", type:"dialogue", speaker:"narrator", location:TSUME, bgmScene:"field",
      text:"トキは焦げた台帳を、そっと束の一番上に戻した。『次は、火の中に置き去りにしない』――その横顔に、償いきれぬ悔いがあった。",
      next:"c4_ep2_hook", flags:{ c4_ep2_done:1 }, questUpdate:{ qid:"q_ch04", state:"active", step:4 } },
    { id:"c4_ep2_hook", type:"dialogue", speaker:"toki", location:TSUME, expression:"angry",
      text:"……でもね、小ボスを何人倒しても道の空気は変わらない。納めぬ者が得をして、納めた者が損をする。その考えが、道の果てに立ってるんだ。", next:"c4_ep3_open" },

    /* ============================================================
       第3話「払わぬが勝ち」
       テーマの歪みそのものと対峙する引き。制度/行政/経営側の事情ビートを断定せず提示。
       師匠ゼンの影を1本繋ぐ。章ボス【取立番長 v_boss_s4】への引き。
       ============================================================ */
    { id:"c4_ep3_open", type:"dialogue", speaker:"narrator", location:SEKI, bgmScene:"emotion",
      text:"督促の関所。うずたかく積まれた督促状の山。逃げ延びた者の名簿と、納め続けて潰れた者の列が、皮肉に並んでいた。",
      next:"c4_ep3_toki1", flags:{ c4_ep3_start:1 } },
    { id:"c4_ep3_toki1", type:"dialogue", speaker:"toki", location:SEKI, portrait:"foreman",
      text:"見て。ここに名を連ねてる事業主、みんな逃げ切った側。成立届も出さず、保険関係すらなかったことにして消えた。……しわ寄せは、律儀な者に回る。", next:"c4_ep3_mina1" },
    { id:"c4_ep3_mina1", type:"dialogue", speaker:"mina", location:SEKI, portrait:"wiz",
      text:"保険関係の成立を、そもそも届け出ない。年度更新もしない。……積もれば道の原資が丸ごと漏れます。給付を支える金だけが、静かに消えていく。", next:"c4_ep3_zen" },
    { id:"c4_ep3_zen", type:"dialogue", speaker:"narrator", location:SEKI, bgmScene:"emotion",
      text:"関所の古い徴収台帳。表紙の裏に掠れた字。『原資を集める者は、集められぬ者の理由を、まず問え』――師匠ゼンの筆跡だった。",
      next:"c4_ep3_choice", flags:{ c4_zen_ash4:1 } },

    { id:"c4_ep3_choice", type:"choice", speaker:"hero", location:SEKI, text:"『払わぬが勝ち』に、どう立つ?",
      choices:[
        { text:"保険関係の成立と徴収の網を、条文で正しく張り直す",
          ideologyChanges:{ law:1, fair:1 }, flags:{ c4_ep3_path_law:1 }, next:"c4_ep3_probe" },
        { text:"払えずに逃げた者、払って潰れた者、双方の理由をまず問う",
          ideologyChanges:{ human:1, mgmt:1 }, flags:{ c4_ep3_path_ask:1 }, next:"c4_ep3_alt" }
      ]},
    { id:"c4_ep3_alt", type:"dialogue", speaker:"hero", location:SEKI,
      text:"逃げ得を責める前に、理由がある。払えずに逃げた者。払って潰れた者。トキが火の中に残した工場。……そこからしか、網は張り直せない。", next:"c4_ep3_probe" },

    { id:"c4_ep3_probe", type:"dialogue", speaker:"narrator", location:SEKI, bgmScene:"field",
      text:"『払わぬが勝ち』の判を押す手先が最後の抵抗に出た。保険関係の成立も、事務組合という道も、事業主に届かせない手口を剥がす。",
      next:"c4_ep3_enc1", questUpdate:{ qid:"q_ch04", state:"active", step:5 } },
    { id:"c4_ep3_enc1", type:"encounter", speaker:"hero", location:SEKI, bgmScene:"emotion",
      text:"督促のトクガが再び現れた。保険関係の成立・消滅・労働保険事務組合・督促の筋を、本試験の問いで崩す。原資を、網へ取り戻す。",
      encounter: enc(4, "過去問｜保険関係の成立・事務組合・督促を取り戻す", { villain:"v_tokusoku", exam:2 }),
      evidence:"ev_ch4_seiritsu", next:"c4_ep3_ev1" },
    { id:"c4_ep3_ev1", type:"dialogue", speaker:"toki", location:SEKI,
      text:"労働保険事務組合――小さな事業主に代わって申告も納付も引き受ける仕組みがある。……逃げ得の裏には、頼る先を知らなかった者もいるんだ。", next:"c4_ep3_reason" },
    { id:"c4_ep3_reason", type:"reasoning", speaker:"hero", location:SEKI, bgmScene:"emotion",
      text:"概算と確定、年度更新、延滞金、メリット制、印紙保険料、成立、事務組合。――全部、原資を集め支える条文だ。『払わぬが勝ち』は、入口ごと隠す細工だ。",
      reasoning:{ need:["ev_ch4_seiritsu"] },
      flags:{ c4_ep3_reasoned:1 }, next:"c4_ep3_biz" },

    /* 【制度/行政/経営側の事情】断定せず、章ボスへの問いとして残す */
    { id:"c4_ep3_biz", type:"dialogue", speaker:"hcho", location:SEKI, expression:"shock",
      text:"……分かった。だが私の背後に立つものは大きい。負担を惜しむ事業主と、取りっぱぐれを恐れる徴収側が、長く吸い続けた空気だ。覆せるか。", next:"c4_ep3_boss_hook" },
    { id:"c4_ep3_boss_hook", type:"dialogue", speaker:"toritate", location:SEKI, portrait:"e_kacho", expression:"angry",
      text:"――払ったか? 期限は守ったか? 納めぬ者が逃げ、納めた者が潰れる。それが徴収の道理だ。その道理に、お前たちで抗うか。",
      next:"c4_ep3_hero_final", flags:{ c4_boss_next:1 } },
    { id:"c4_ep3_hero_final", type:"dialogue", speaker:"hero", location:SEKI,
      text:"抗う。カイも、ミナも、ガルドも、リオも、トキもいる。潰された者も、逃げるしかなかった者も顔を上げた。……徴収の全体像で覆しに行く。", next:"c4_ep3_end" },
    { id:"c4_ep3_end", type:"dialogue", speaker:"narrator", location:SEKI, bgmScene:"field",
      text:"徴収路で、逃避の合言葉が初めて言い返された。だが道の果てに立つ影――取立番長との対峙は、まだこれからだ。",
      next:null, flags:{ c4_ep3_done:1, c4_ch04_done:1 },
      questUpdate:{ qid:"q_ch04", state:"done", step:6 } }
  ];

  /* 第1〜3話(章前半)クエスト定義(doneFlag で完了判定)。第一〜三章の各クエストは無改変の別クエスト。 */
  if(typeof S.registerQuest==="function"){
    S.registerQuest("q_ch04", {
      title:"払わぬが勝ち",
      chapter:"ch04",
      steps:["払わぬ街道","取り立ての裏側","払わぬが勝ち"],
      doneFlag:"c4_ch04_done"
    });
  }

  S.register("ch04", NODES);
  S.CH04_ID = "ch04";

  /* メイン章の背骨(S.MAIN)へ、第三章(ch03b)の続きとして追記する。
     ・第三章クリア(c3_ch03b_done)後、ホームの「今日の冒険」が自動で本章へ進む導線になる。
     ・章選択画面は前章 done まで locked=第三章クリアが解放ゲートとして機能する(既存規則に沿う)。
     ・S.MAIN 未ロード/未定義でも安全(存在する時だけ push、重複登録も防ぐ)。 */
  if(Array.isArray(S.MAIN)){
    var exists = false;
    for(var i=0;i<S.MAIN.length;i++){ if(S.MAIN[i] && S.MAIN[i].id==="ch04"){ exists = true; break; } }
    if(!exists){
      S.MAIN.push({ id:"ch04", no:"第四章", title:"払わぬが勝ち", loc:"徴収路",
        doneFlag:"c4_ch04_done", startedFlag:"c4_ep1_start" });
    }
  }
})();
