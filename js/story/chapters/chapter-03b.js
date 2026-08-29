"use strict";
/* ============================================================
   story/chapters/chapter-03b.js — 第三章「入れなければ払わずに済む」第4〜8話 + 章ボス戦
   docs/story-bible.md / ENDING-CANON 準拠。chapter-03.js の末尾(c3_ch03_done /
   c3_boss_next)から地続きの五話を、別 chapterId="ch03b" で綴じ込む。舞台=失業街オブロ／雇用保険(subject 3)。
   ・第4話「網の目」…適用要件(週20時間・31日雇用見込み)・被保険者の種類・適用除外を、時間を削られ
                     適用外にされた者の事件で。過去問(examFmt)混入。制度側の事情(適用拡大の原資)を継続。
   ・第5話「就職への橋」…基本手当の受給・受給期間・所定給付日数・就職促進給付(再就職手当)・教育訓練給付。
                     中ボス 網切りのゾルド 初登場(自らも時間を削られ被保険者になれなかった過去)。
   ・第6話「網の目を刻む監理官」…雇用継続給付(高年齢・育児休業・介護休業)・教育訓練の全体像。
                     中ボス【網切りのゾルド v_mid_amikiri】戦。リオとの関係深化。
   ・第7話「決戦前夜」…仲間との会話で覚悟。戦う意味の総括(戦闘なし)。師匠ゼンの影を1本繋ぐ。
   ・第8話「決戦」…章ボス【シツギョウ魔人 v_boss_s3】戦=【章末問題集】(雇用保険の過去問=examFmt中心の
                 高難度セット)。撃破後は断定的勝利にせず、「間を取り持つ/法典のかけらを取り戻す」テーマへ橋渡し。
   ・各話に必ず「経営者/行政/制度側の事情」ビートを置き、断定せず問いを残す(『入れなければ払わずに済む』の空気)。
   ・chapter-01*.js / chapter-02*.js / chapter-03.js のノード/quest/ID/証拠/分岐は一切改変しない(別ファイル・別章)。
   ・戦闘接続は既存の橋(story-encounter / story-battle-bridge)。encounter に villain と
     exam(examFmt 混入数)を持たせるだけで、採点・SRS・報酬・問題データには一切触れない。
     ボス戦も新規採点系を作らず、examFmt を多く混ぜた高難度 encounter として既存橋へ委譲する。
   ・eval/new Function ゼロ。全ノードはデータのみ(next は文字列 or {then,else} or null)。全出力は自前 esc2 経由。
   ・立てるフラグ: c3_ep4_done〜c3_ep8_done / c3_boss_cleared / c3_ch03b_done / c3_zen_ash3b。
     q_ch03(前半)は無改変。ここは boss_cleared までを確定する。
   ・注: 仲間リオの好感度キーは cp3(前半 c3_rio_join で加入済)。data-companions.js の cp3 とは別レイヤー
     (物語の関係値 getRel/setRel はパーティ・パッシブと独立)なので、既存テストを割らずに深化させる。
   ============================================================ */
(function(){
  var G = (typeof window!=="undefined") ? window : globalThis;
  var S = G.SRStory;
  if(!S || typeof S.register!=="function") return;   /* エンジン未ロードでも安全 */

  /* 第4〜8話の話者を表示名テーブルへ追記(描画層があれば。無ければ素通し)。
     rio/kai/mina/gard/hwork/shitsu は既存(chapter-03.js が追記済み)。amikiri と新被害者のみ追記。
     amikiri(中ボス)の px は輪郭線付き人物バスト e_graus。 */
  if(S.SPEAKERS && typeof S.SPEAKERS==="object"){
    if(!S.SPEAKERS.amikiri) S.SPEAKERS.amikiri = { name:"網切りのゾルド", px:"e_graus" };
    if(!S.SPEAKERS.hazama)  S.SPEAKERS.hazama  = { name:"網の目の女", px:"ghost" };
  }

  var YOSE   = "失業街オブロ・寄せ場通り";
  var BRIDGE = "失業街オブロ・再就職の橋";
  var KANRI  = "失業街オブロ・適用監理所";
  var NIGHT  = "失業街オブロ・広場裏の宿";
  var SQ     = "失業街オブロ・中央広場";

  /* 演習 encounter。opts で相手(villain)と過去問混入数(exam=examFmt の本数)・出題数(n)を指定。
     kind:"train" のまま既存の橋(start*)へ委譲する。ボス戦は exam/n を大きくした高難度セット。subject=3。 */
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
       第4話「網の目」
       適用要件(週20時間・31日雇用見込み)・被保険者の種類・適用除外を、時間を削られ適用外にされた者の事件で。
       ============================================================ */
    { id:"c3_ep4_open", start:true, type:"dialogue", speaker:"narrator", location:YOSE, bgmScene:"emotion",
      text:"寄せ場通り。日ごとに人が集められ、日ごとに帰される。その列の隅で、勤めていたはずの女が俯いていた。",
      next:"c3_ep4_intro", flags:{ c3_ep4_start:1 },
      questUpdate:{ qid:"q_ch03b", state:"active", step:0 } },
    { id:"c3_ep4_intro", type:"dialogue", speaker:"hazama", location:YOSE, portrait:"ghost", expression:"shock",
      text:"三年、同じ店で働いた。なのに『雇用保険に入ってない』と。……去年から週の時間を少し削られてた。二十時間に、一時間だけ足りないように。", next:"c3_ep4_rio1" },
    { id:"c3_ep4_rio1", type:"dialogue", speaker:"rio", location:YOSE, portrait:"hanna", expression:"angry",
      text:"週の所定労働時間が二十時間以上、三十一日以上の雇用見込み。これが適用の入口。あんたは満たしてた。一時間削って外されたんだ。", next:"c3_ep4_rio2" },
    { id:"c3_ep4_rio2", type:"dialogue", speaker:"rio", location:YOSE,
      text:"被保険者にも種類がある。一般、高年齢、短期雇用特例、日雇。……どれに当たるかで届く給付が変わる。この網が、急所なんだよ。", next:"c3_ep4_kai1" },
    { id:"c3_ep4_kai1", type:"dialogue", speaker:"kai", location:YOSE, portrait:"helm", expression:"angry",
      text:"たった一時間で、三年ぶんの命綱が消える。おれの親父も『いなかったこと』にされた側だ。……その一時間を、取り戻す。", next:"c3_ep4_choice" },

    { id:"c3_ep4_choice", type:"choice", speaker:"hero", location:YOSE, text:"この女に、どう向き合う?",
      choices:[
        { text:"適用の要件を、制度で正しく示して網へ戻す",
          ideologyChanges:{ law:1, fair:1 }, flags:{ c3_ep4_path_law:1 }, next:"c3_ep4_probe" },
        { text:"まず、削られ続けた三年の不安を受け止める",
          ideologyChanges:{ human:1, relief:1 }, flags:{ c3_ep4_path_human:1 }, next:"c3_ep4_alt" }
      ]},
    { id:"c3_ep4_alt", type:"dialogue", speaker:"hero", location:YOSE,
      text:"不安で当然です。三年、あなたは確かに働いた。……その上で。あなたの労働時間は、本当は要件を満たしている。網の目は、戻せます。", next:"c3_ep4_probe" },

    { id:"c3_ep4_probe", type:"dialogue", speaker:"narrator", location:YOSE, bgmScene:"field",
      text:"『二十時間に一時間足りない』――そう言い張って人を弾く手先がいた。適用の要件と被保険者の種類を、立て直す。",
      next:"c3_ep4_enc1", questUpdate:{ qid:"q_ch03b", state:"active", step:1 } },
    { id:"c3_ep4_enc1", type:"encounter", speaker:"hero", location:YOSE, bgmScene:"emotion",
      text:"離職票のヌケガラが、削った勤務表を抱えて現れた。適用事業・被保険者の種類・適用除外・週二十時間の要件を、本試験の問いで確かめる。",
      encounter: enc(3, "過去問｜適用要件・被保険者の種類・適用除外を問う", { villain:"v_rishoku", exam:2 }),
      evidence:"ev_ch3b_tekiyo", next:"c3_ep4_ev1" },
    { id:"c3_ep4_ev1", type:"dialogue", speaker:"mina", location:YOSE, portrait:"wiz",
      text:"適用の筋、証拠に残せました。週二十時間以上・三十一日以上の見込み――この女は要件を満たしています。削られた一時間は、加入逃れの細工でした。", next:"c3_ep4_reason" },
    { id:"c3_ep4_reason", type:"reasoning", speaker:"hero", location:YOSE, bgmScene:"emotion",
      text:"適用事業、被保険者の種類、適用除外、週二十時間の線。――誰を網の内に置くかを決める条文だ。一時間削って初めから外だったことにする。それが細工だ。",
      reasoning:{ need:["ev_ch3b_tekiyo"] },
      flags:{ c3_ep4_reasoned:1 }, next:"c3_ep4_biz" },

    /* 【制度側の事情】断定せず提示 */
    { id:"c3_ep4_biz", type:"dialogue", speaker:"hwork", location:YOSE,
      text:"……適用を広げるのは正しい。だが網を広げれば、事業主の保険料も事務も増える。だから会社は線ぎりぎりで削りたがる。その圧を、誰が引き受ける?", next:"c3_ep4_hero2" },
    { id:"c3_ep4_hero2", type:"dialogue", speaker:"hero", location:YOSE,
      text:"（負担が増えるのは本当だ。……でも、その付けを一時間削られた本人の命綱で払わせるのは違う。一番弱い一人だけに背負わせない。）",
      next:"c3_ep4_end", ideologyChanges:{ mgmt:1, fair:1 }, flags:{ c3_ep4_saw_sides:1 } },
    { id:"c3_ep4_end", type:"dialogue", speaker:"narrator", location:YOSE, bgmScene:"field",
      text:"女は削られる前の勤務表を握りしめ、初めて顔を上げた。リオは欄外に、そっと本来の時間を書き足してやった。",
      next:"c3_ep4_hook", flags:{ c3_ep4_done:1 }, questUpdate:{ qid:"q_ch03b", state:"active", step:2 } },
    { id:"c3_ep4_hook", type:"dialogue", speaker:"rio", location:YOSE, expression:"angry",
      text:"……でもね、網へ戻しても、その先の橋を渡らせない奴がいる。再就職手当も教育訓練給付も、わざと教えない監理官さ。次は、そいつだ。", next:"c3_ep5_open" },

    /* ============================================================
       第5話「就職への橋」
       基本手当の受給・受給期間・所定給付日数・就職促進給付(再就職手当)・教育訓練給付。
       中ボス 網切りのゾルド 初登場(自らも時間を削られ被保険者になれなかった過去)。
       ============================================================ */
    { id:"c3_ep5_open", type:"dialogue", speaker:"narrator", location:BRIDGE, bgmScene:"emotion",
      text:"再就職の橋。渡り切れば次の仕事へ届く細い一本。だがその袂で、痩せた男が立ちすくんでいた。決まった職を、断ろうとしていた。",
      next:"c3_ep5_intro", flags:{ c3_ep5_start:1 } },
    { id:"c3_ep5_intro", type:"dialogue", speaker:"ojob", location:BRIDGE, portrait:"ghost", expression:"shock",
      text:"早く決まったら、残りの給付は全部パアだと言われた。……なら、ぎりぎりまで動かない方が得だ。次の橋が、目の前にあるのに。", next:"c3_ep5_rio1" },
    { id:"c3_ep5_rio1", type:"dialogue", speaker:"rio", location:BRIDGE, portrait:"hanna",
      text:"それ、逆に損させる嘘。早く再就職すれば再就職手当が出る。残り日数が多いほど手厚い。……早く渡った方が、得なんだよ。", next:"c3_ep5_mina1" },
    { id:"c3_ep5_mina1", type:"dialogue", speaker:"mina", location:BRIDGE, portrait:"wiz",
      text:"基本手当には受給期間があり、所定給付日数の範囲で受け取れます。途中で再就職すれば就職促進給付。学び直すなら教育訓練給付。渋る理由はありません。", next:"c3_ep5_amikiri1" },
    { id:"c3_ep5_amikiri1", type:"dialogue", speaker:"amikiri", location:BRIDGE, portrait:"e_graus", expression:"angry",
      text:"――再就職手当? 教育訓練? そんな橋を架けてやる義理はない。私は日雇いで、ついぞ被保険者になれなかった。……なぜ、こいつらにだけ架ける。", next:"c3_ep5_hero1" },
    { id:"c3_ep5_hero1", type:"dialogue", speaker:"hero", location:BRIDGE,
      text:"（網切りのゾルド。こぼれた側だから、こぼす側に回った。……架けてもらえなかった橋は確かにある。でも、次の誰かの橋を落として晴らすのは違う。）", next:"c3_ep5_gard1" },
    { id:"c3_ep5_gard1", type:"dialogue", speaker:"gard", location:BRIDGE, portrait:"oni", expression:"angry",
      text:"ゾルド。網からこぼれた悔しさは、おれにも分かる。……だがな、その痛みで橋を落として、それでお前の谷が埋まるのか? 埋まりゃしねえ。", next:"c3_ep5_choice" },

    { id:"c3_ep5_choice", type:"choice", speaker:"hero", location:BRIDGE, text:"落とされた橋を、どう架け直す?",
      choices:[
        { text:"就職促進給付と給付日数を、制度で正しく渡す",
          ideologyChanges:{ law:1, fair:1 }, flags:{ c3_ep5_path_law:1 }, next:"c3_ep5_probe" },
        { text:"橋を渡れずにいる本人の、明日への不安を先に解く",
          ideologyChanges:{ human:1, relief:1 }, flags:{ c3_ep5_path_human:1 }, next:"c3_ep5_alt" }
      ]},
    { id:"c3_ep5_alt", type:"dialogue", speaker:"hero", location:BRIDGE,
      text:"決まった仕事を、断らなくていい。早く渡れば、むしろ手当が付く。……あなたが恐れた損は、逆でした。橋は、渡るために架かっている。", next:"c3_ep5_probe" },

    { id:"c3_ep5_probe", type:"dialogue", speaker:"narrator", location:BRIDGE, bgmScene:"field",
      text:"『早く決まると損をする』――そう囁いて再就職を止める手先がいた。受給期間、所定給付日数、就職促進給付の筋道を立て直す。",
      next:"c3_ep5_enc1", questUpdate:{ qid:"q_ch03b", state:"active", step:3 } },
    { id:"c3_ep5_enc1", type:"encounter", speaker:"hero", location:BRIDGE, bgmScene:"emotion",
      text:"待期のマドロミが残り日数を霧で覆いにきた。基本手当・受給期間・所定給付日数・再就職手当・教育訓練給付を、本試験の問いで数え直す。",
      encounter: enc(3, "過去問｜基本手当・所定給付日数・就職促進給付を問う", { villain:"v_taiki", exam:2 }),
      evidence:"ev_ch3b_kyufu", next:"c3_ep5_ev1" },
    { id:"c3_ep5_ev1", type:"dialogue", speaker:"rio", location:BRIDGE,
      text:"残り日数が多いうちに再就職すれば、再就職手当は手厚い。渋る理由なんてない。……次に立つのは、監理官ゾルド本人だよ。", next:"c3_ep5_reason" },
    { id:"c3_ep5_reason", type:"reasoning", speaker:"hero", location:BRIDGE, bgmScene:"emotion",
      text:"基本手当、受給期間、所定給付日数、就職促進給付、教育訓練給付。――失業を長引かせず次の職へ渡す橋だ。『早く渡ると損』は、偽の看板だ。",
      reasoning:{ need:["ev_ch3b_kyufu"] },
      flags:{ c3_ep5_reasoned:1 }, next:"c3_ep5_biz" },

    /* 【行政/監理側の事情】断定せず、次話の壁として残す */
    { id:"c3_ep5_biz", type:"dialogue", speaker:"amikiri", location:BRIDGE, expression:"shock",
      text:"……渋るのには理由もある。手当だけ受け取り、すぐ辞めてまた受け取る者がいなくはない。私はその悪用から網を守っていたつもりだった。", next:"c3_ep5_hero2" },
    { id:"c3_ep5_hero2", type:"dialogue", speaker:"hero", location:BRIDGE,
      text:"（一部の悪用を防ぐことと、全部を疑って橋を落とすこと。この人も混ぜている。線は引ける。悪用は後で弾ける。）",
      next:"c3_ep5_end", ideologyChanges:{ fair:1, mgmt:1 }, flags:{ c3_ep5_saw_sides:1 } },
    { id:"c3_ep5_end", type:"dialogue", speaker:"narrator", location:BRIDGE, bgmScene:"field",
      text:"男は、決まった職へと橋を渡っていった。ゾルドはその背を見送りながら、片手で古い日雇いの札を握りしめていた。",
      next:"c3_ep5_hook", flags:{ c3_ep5_done:1 }, questUpdate:{ qid:"q_ch03b", state:"active", step:4 } },
    { id:"c3_ep5_hook", type:"dialogue", speaker:"gard", location:BRIDGE, expression:"angry",
      text:"……あいつはまだ折れちゃいねえ。適用監理所で、雇用継続の給付ごと全部の網を刻むつもりだ。行くぞ、調律師。", next:"c3_ep6_open" },

    /* ============================================================
       第6話「網の目を刻む監理官」— 中ボス【網切りのゾルド v_mid_amikiri】戦
       雇用継続給付(高年齢・育児休業・介護休業)・教育訓練の全体像。リオとの関係深化。
       ============================================================ */
    { id:"c3_ep6_open", type:"dialogue", speaker:"narrator", location:KANRI, bgmScene:"emotion",
      text:"適用監理所。壁一面の名簿から、次々と名が消されていた。高年齢で働き続ける者、育児や介護で休む者。その前に、ゾルドが鋏を手に立ちはだかった。",
      next:"c3_ep6_choice", flags:{ c3_ep6_start:1 } },
    { id:"c3_ep6_choice", type:"choice", speaker:"hero", location:KANRI, text:"ゾルドの鋏を、どう止める?",
      choices:[
        { text:"雇用継続給付の全体像で、刻まれる前の一名を立証する",
          ideologyChanges:{ law:1, fair:1 }, flags:{ c3_ep6_path_law:1 }, next:"c3_ep6_probe" },
        { text:"同じく網からこぼれた者として、まずゾルドに語りかける",
          ideologyChanges:{ human:1, relief:1 }, flags:{ c3_ep6_path_human:1 }, next:"c3_ep6_alt" }
      ]},
    { id:"c3_ep6_alt", type:"dialogue", speaker:"rio", location:KANRI, portrait:"hanna",
      text:"ゾルド。あたしの母さんも、あと一月でこぼれた。あんたと同じだ。……でも母さんは『次の誰かは落とすな』って言ってた。手を、止めて。", next:"c3_ep6_probe" },

    { id:"c3_ep6_probe", type:"dialogue", speaker:"narrator", location:KANRI, bgmScene:"field",
      text:"鋏に掛けられる寸前の名簿。定年後も働く者、育児で休む者、介護に就く者。継続給付の線引きで、一名ずつ拾い上げる。",
      next:"c3_ep6_enc1", questUpdate:{ qid:"q_ch03b", state:"active", step:5 } },
    { id:"c3_ep6_enc1", type:"encounter", speaker:"hero", location:KANRI,
      text:"まずは継続の給付の骨組み。高年齢雇用継続給付、育児休業給付、介護休業給付、教育訓練給付。刻まれかけた一名の筋を通す。",
      encounter: enc(3, "過去問｜雇用継続給付(高年齢・育児・介護)・教育訓練を問う", { villain:"v_rishoku", exam:2 }),
      evidence:"ev_ch3b_keizoku", next:"c3_ep6_ev1" },
    { id:"c3_ep6_ev1", type:"dialogue", speaker:"mina", location:KANRI, portrait:"wiz",
      text:"継続給付の筋、通せました。……ですが、ゾルド本人が鋏を構えて前に出ます。網からこぼされた歳月ごと、正面からぶつかることになります。", next:"c3_ep6_enc2" },
    { id:"c3_ep6_enc2", type:"encounter", speaker:"hero", location:KANRI, bgmScene:"emotion",
      text:"網切りのゾルドが名簿を背に立ちはだかった。適用要件・被保険者の種類・基本手当・就職促進給付・雇用継続給付の全体像。網の目を編み直す。",
      encounter: enc(3, "過去問｜適用・給付の総合(中ボス)", { villain:"v_mid_amikiri", exam:3 }),
      evidence:"ev_ch3b_amiki", next:"c3_ep6_ev2" },
    { id:"c3_ep6_ev2", type:"dialogue", speaker:"amikiri", location:KANRI, expression:"shock",
      text:"……鋏が止まった。四十年、この鋏で網の目を刻んできた。誰も私を入れなかったから、私も入れないと決めた。……ただの意趣返しだったのか。", next:"c3_ep6_reason" },
    { id:"c3_ep6_reason", type:"reasoning", speaker:"hero", location:KANRI, bgmScene:"emotion",
      text:"適用の要件、被保険者の種類、基本手当、就職促進、雇用継続。――鋏で刻んだ根拠は、そのどれもが編み直せた。こぼれた者も、この網は抱えられる。",
      reasoning:{ need:["ev_ch3b_keizoku","ev_ch3b_amiki"] },
      flags:{ c3_ep6_reasoned:1 }, next:"c3_ep6_biz" },

    /* 【監理側の事情】断定せず、問いを残す */
    { id:"c3_ep6_biz", type:"dialogue", speaker:"amikiri", location:KANRI,
      text:"……最後に問わせろ。私が刻まなければ、短く働いては受け取る者も群がる。全部を拾うことと、悪用を弾くこと。両方を立てられるのか?", next:"c3_ep6_hero2" },
    { id:"c3_ep6_hero2", type:"dialogue", speaker:"hero", location:KANRI,
      text:"（両方を立てる。悪用は要件で後から弾ける。だから入口で本物まで刻まなくていい。……網の外に置かれたあなた自身も、拾われるべきだった。）",
      next:"c3_ep6_bond", ideologyChanges:{ fair:1, mgmt:1 }, flags:{ c3_ep6_saw_sides:1 } },
    { id:"c3_ep6_bond", type:"dialogue", speaker:"rio", location:KANRI, bgmScene:"emotion", expression:"shock",
      text:"……調律師さん。あたしはずっと一人で穴の地図を描いてきた。意地だけで。……でもあんたは、あたしを刻んだゾルドまで拾おうとした。一緒に描こう。",
      next:"c3_ep6_end", relationshipChanges:{ cp3:1 }, flags:{ c3_ep6_bonded:1 } },
    { id:"c3_ep6_end", type:"dialogue", speaker:"narrator", location:KANRI, bgmScene:"field",
      text:"監理所の鋏が置かれ、刻まれかけた名簿から拾われるべき名が色を取り戻した。だが広場の中心で、シツギョウ魔人が影を人の形に立ち上げていた。",
      next:"c3_ep6_hook", flags:{ c3_ep6_done:1 }, questUpdate:{ qid:"q_ch03b", state:"active", step:6 } },
    { id:"c3_ep6_hook", type:"dialogue", speaker:"rio", location:KANRI, expression:"angry",
      text:"……あれが大元だ。『入れなければ払わずに済む』って空気が、魔人の形になってやがる。明日、広場で決着だ。", next:"c3_ep7_open" },

    /* ============================================================
       第7話「決戦前夜」
       仲間との会話で覚悟。戦う意味の総括(戦闘なし)。師匠ゼンの影を1本繋ぐ。
       ============================================================ */
    { id:"c3_ep7_open", type:"dialogue", speaker:"narrator", location:NIGHT, bgmScene:"town",
      text:"広場裏の宿。薄い粥をすすり、五人は小さな火を囲んだ。明日、この街の空気そのものと戦う。その前の、静かな夜だった。",
      next:"c3_ep7_rio1", flags:{ c3_ep7_start:1 } },
    { id:"c3_ep7_rio1", type:"dialogue", speaker:"rio", location:NIGHT, portrait:"hanna",
      text:"あたしは、穴の場所を覚えることでしか母さんの死に意味を持たせられなかった。……でも今は分かる。覚えるだけじゃ足りない。埋めなきゃ。", next:"c3_ep7_kai1" },
    { id:"c3_ep7_kai1", type:"dialogue", speaker:"kai", location:NIGHT, expression:"angry",
      text:"悪いのは一人の悪人じゃねえ。『入れなきゃ払わずに済む』って空気を、みんなが少しずつ吸ってた。……ゾルドも、弾かれた側だ。", next:"c3_ep7_mina1" },
    { id:"c3_ep7_mina1", type:"dialogue", speaker:"mina", location:NIGHT, portrait:"wiz",
      text:"給付の悪用はごくわずか。その僅かを恐れて網を締めれば、救われるはずの多数がこぼれ落ちる。……明日突きつけるのは、その一点です。", next:"c3_ep7_hero1" },
    { id:"c3_ep7_hero1", type:"dialogue", speaker:"hero", location:NIGHT,
      text:"経営者も行政も悪じゃない。原資にも限りがある。受け取る側にもずるをする者はいる。……その全部を抱えた上で、こぼれた一人を拾う線を引く。", next:"c3_ep7_choice" },

    { id:"c3_ep7_choice", type:"choice", speaker:"hero", location:NIGHT, text:"覚悟を、言葉にする。",
      choices:[
        { text:"「切り捨て」を「支え合い」に変える。その第一歩として戦う",
          ideologyChanges:{ fair:1, mgmt:1 }, flags:{ c3_ep7_vow_bridge:1 }, next:"c3_ep7_vow" },
        { text:"網からこぼれた一人ひとりを、数え直すために戦う",
          ideologyChanges:{ human:1, relief:1 }, flags:{ c3_ep7_vow_count:1 }, next:"c3_ep7_vow" }
      ]},
    { id:"c3_ep7_vow", type:"dialogue", speaker:"hero", location:NIGHT, bgmScene:"emotion",
      text:"魔人を倒しに行くんじゃない。『入れなければ払わずに済む』を『こぼさない網』に書き換えに行く。誰も外に置かない仕組みを、明日、広場で。", next:"c3_ep7_zen" },
    { id:"c3_ep7_zen", type:"dialogue", speaker:"narrator", location:NIGHT, bgmScene:"emotion",
      text:"リオが母から継いだ離職票の束。一番下から紙片が滑り落ちた。『網を編む者は、目からこぼれる一人の名を、必ず呼べ』――師匠ゼンの筆跡。",
      next:"c3_ep7_end", flags:{ c3_zen_ash3b:1 } },
    { id:"c3_ep7_end", type:"dialogue", speaker:"hero", location:NIGHT, bgmScene:"field",
      text:"（師匠。この街でも編み直そうとして、こぼれる一人を背負いきれずに去ったんですね。……その宿題を、おれたちが引き受けます。）",
      next:"c3_ep7_hook", flags:{ c3_ep7_done:1 }, questUpdate:{ qid:"q_ch03b", state:"active", step:7 } },
    { id:"c3_ep7_hook", type:"dialogue", speaker:"narrator", location:NIGHT,
      text:"夜が明けた。五人は薄暗い通りを抜け、中央広場の中心へと歩を進めた。灰色の空気が、いっそう濃く満ちていた。", next:"c3_ep8_open" },

    /* ============================================================
       第8話「決戦」— 章ボス【シツギョウ魔人 v_boss_s3】戦
       【章末問題集】=これまでの雇用保険の過去問を集めた高難度セット(examFmt中心・タイト)。
       登場アニメ+『敵が問題を突きつける』枠組みは story-encounter が villain から自動生成する。
       撃破後は断定的勝利にせず「間を取り持つ/法典のかけらを取り戻す」テーマへ橋渡し(ENDING-CANON/introのかけら)。
       ============================================================ */
    { id:"c3_ep8_open", type:"dialogue", speaker:"narrator", location:SQ, bgmScene:"emotion",
      text:"中央広場の中心。灰色の空気が、ゆっくりと人の形に立ち上がった。憎しみも怒りもなく――『入れなければ払わずに済む』という空気そのもの。",
      next:"c3_ep8_appear", flags:{ c3_ep8_start:1 } },
    { id:"c3_ep8_appear", type:"dialogue", speaker:"narrator", location:SQ,
      text:"魔人が手を広げると、こぼれた無数の者が影から浮かび上がった。書き換えられた男、一時間削られた女、リオの母。皆、一度は弾かれた者たちだ。", next:"c3_ep8_shitsu1" },
    { id:"c3_ep8_shitsu1", type:"dialogue", speaker:"shitsu", location:SQ, portrait:"e_roukisai", expression:"angry",
      text:"よく来た、調律師。問おう。加入していたか。資格は満たしたか。……こぼれた者は誰が拾う? 拾わぬのが、世の習いだ。", next:"c3_ep8_hero1" },
    { id:"c3_ep8_hero1", type:"dialogue", speaker:"hero", location:SQ,
      text:"覆す。カイも、ミナも、ガルドも、リオもいる。こぼされた者たちも顔を上げた。……その合言葉を、今日、雇用の全体像で覆す。", next:"c3_ep8_rio1" },
    { id:"c3_ep8_rio1", type:"dialogue", speaker:"rio", location:SQ, expression:"angry",
      text:"御託はいい。積み上げた過去問の全部を、ここでぶつける。……母さんをこぼしたこの空気を、今日で終いにする。", next:"c3_ep8_brief" },
    { id:"c3_ep8_brief", type:"dialogue", speaker:"narrator", location:SQ, bgmScene:"emotion",
      text:"これは総決算。適用、離職理由、受給資格、給付、雇用継続――オブロで暴いた穴のすべてが【章末問題集】として襲いかかる。",
      next:"c3_ep8_enc1", questUpdate:{ qid:"q_ch03b", state:"active", step:8 } },
    { id:"c3_ep8_enc1", type:"encounter", speaker:"hero", location:SQ, bgmScene:"emotion",
      text:"第一幕・適用/受給資格編。適用事業と被保険者の種類、離職理由、受給資格、待期と給付制限を、高密度の五肢択一・個数で叩き込む。",
      encounter: enc(3, "章末問題集｜適用・受給資格編(高難度)", { villain:"v_boss_s3", n:12, exam:5 }),
      evidence:"ev_ch3b_boss1", next:"c3_ep8_mid" },
    { id:"c3_ep8_mid", type:"dialogue", speaker:"shitsu", location:SQ, expression:"shock",
      text:"……適用と資格は越えたか。だが給付と、その先の継続は別だ。網の外はどこまでも広い。その広さに、お前たちの情がどこまで届く。", next:"c3_ep8_enc2" },
    { id:"c3_ep8_enc2", type:"encounter", speaker:"hero", location:SQ, bgmScene:"emotion",
      text:"第二幕・給付/雇用継続編。基本手当と所定給付日数、就職促進給付、教育訓練給付、高年齢・育児・介護の継続給付を、同じ高密度で最後まで。",
      encounter: enc(3, "章末問題集｜給付・雇用継続編(高難度)", { villain:"v_boss_s3", n:12, exam:5 }),
      evidence:"ev_ch3b_boss2", next:"c3_ep8_broke" },
    { id:"c3_ep8_broke", type:"dialogue", speaker:"narrator", location:SQ, bgmScene:"emotion",
      text:"最後の一問が置かれた瞬間、灰色の柱が内側から崩れ始めた。こぼれていた者たちが、一人また一人と名を呼ばれ、色を取り戻していく。", next:"c3_ep8_reason" },
    { id:"c3_ep8_reason", type:"reasoning", speaker:"hero", location:SQ, bgmScene:"emotion",
      text:"適用、離職理由、受給資格、給付、雇用継続――そのどれもが、網の外に落ちた一人を数え直すための条文だった。空気は、こぼさない網へ編み直された。",
      reasoning:{ need:["ev_ch3b_boss1","ev_ch3b_boss2"] },
      flags:{ c3_ep8_reasoned:1 }, next:"c3_ep8_shitsu2" },

    /* 断定的勝利にしない。魔人/行政の独白で「間を取り持つ/法典のかけらを取り戻す」テーマへ橋渡し。 */
    { id:"c3_ep8_shitsu2", type:"dialogue", speaker:"shitsu", location:SQ, expression:"shock",
      text:"……私は間違っていたのか。だが問おう。全部を網に入れれば原資は薄まる。薄まれば、次に失業した者へ満足に払えなくなる。", next:"c3_ep8_hwork" },
    { id:"c3_ep8_hwork", type:"dialogue", speaker:"hwork", location:SQ,
      text:"……魔人よ。私はもう、あなたの習いに縋らない。だが問いは捨てられん。原資を守ることと、目の前の一人を網へ戻すこと。その両立を。", next:"c3_ep8_zen" },
    { id:"c3_ep8_zen", type:"dialogue", speaker:"hero", location:SQ, bgmScene:"emotion",
      text:"（師匠。あなたが背負いきれなかった問いが、ここにもあった。……雇用の法典のかけらが一つ、手のひらに戻ってきた。九つのうちの、三つめだ。）",
      next:"c3_ep8_hero_final", flags:{ c3_shard3:1 } },
    { id:"c3_ep8_hero_final", type:"dialogue", speaker:"hero", location:SQ,
      text:"シツギョウ魔人。あなたを裁きには来ていない。問いに答え続けに来た。……網は、弾くためじゃなく、こぼれる一人の名を呼んで戻すためにある。", next:"c3_ep8_final" },
    { id:"c3_ep8_final", type:"dialogue", speaker:"narrator", location:SQ, bgmScene:"field",
      text:"オブロで、切り捨ての合言葉が初めて支え合いへ書き換えられた。だが胸には、勝利より重い問いが残った――原資と痛みの間を、どう取り持つのか。",
      next:null, flags:{ c3_ep8_done:1, c3_boss_cleared:1, c3_ch03b_done:1 },
      questUpdate:{ qid:"q_ch03b", state:"done", step:9 } }
  ];

  /* 第4〜8話クエスト定義(doneFlag で完了判定)。q_ch03(前半)は無改変の別クエスト。 */
  if(typeof S.registerQuest==="function"){
    S.registerQuest("q_ch03b", {
      title:"入れなければ払わずに済む・決着",
      chapter:"ch03b",
      steps:["網の目","就職への橋","網の目を刻む監理官","決戦前夜","決戦"],
      doneFlag:"c3_ch03b_done"
    });
  }

  S.register("ch03b", NODES);
  S.CH03B_ID = "ch03b";

  /* メイン章の背骨(S.MAIN)へ、ch03(前半)の続きとして追記する。
     ・c3_ch03_done 後、ホームの「今日の冒険」が自動で本話へ進む導線になる。
     ・S.MAIN 未ロード/未定義でも安全(存在する時だけ push、重複登録も防ぐ)。 */
  if(Array.isArray(S.MAIN)){
    var exists = false;
    for(var i=0;i<S.MAIN.length;i++){ if(S.MAIN[i] && S.MAIN[i].id==="ch03b"){ exists = true; break; } }
    if(!exists){
      S.MAIN.push({ id:"ch03b", no:"第三章", title:"入れなければ払わずに済む・決着", loc:"失業街オブロ・中央広場",
        doneFlag:"c3_ch03b_done", startedFlag:"c3_ep4_start" });
    }
  }
})();
