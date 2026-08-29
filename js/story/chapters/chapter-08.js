"use strict";
/* ============================================================
   story/chapters/chapter-08.js — 第八章「一件の悲劇と、百万件の平均の間」第1〜3話(前半)
   docs/story-bible.md / ENDING-CANON 準拠。舞台=行政都市アルケ／
   科目=労働・社会保険に関する一般常識(subject 8)。テーマ=一件の悲劇と、百万件の平均の間。
   目の前の一人の痛みと、統計が語る全体像の狭間で、制度をどう設計するか。※全9科目の最後の科目章。
   ・第1話「平均の掲示板」…行政都市アルケ 導入。統計(白書・労働経済)や一般常識の陰で、一件の痛みを
                     『平均並みだ』と均され消されかけた者との出会い。新仲間アリサ初登場(統計官・平均の
                     向こうの一人を見失わない)。○×演習(労一社一 s8)→過去問(examFmt)。
                     小ボス=下限崩しのグレン。カイ/ミナが「なぜ戦うか」を明示。
   ・第2話「書庫の告白」…アリサの過去(自らも窓口で『平均の外の例外』と畳まれかけ、平均の陰に消される
                     一人の痛みを知った)を掘り下げ加入。労働契約法・労働組合法・最低賃金法・社会保険労務士法
                     等の論点。過去問(五肢択一・個数)混入。小ボス=白書騙りのソラ。
   ・第3話「平均の秤」…『平均が個を消す』歪みそのものと対峙する引き。制度/行政側の事情ビート
                     (有限の原資・平均で全体を回す事情・誰が全体と一人の線を引くか)を断定せず提示。
                     師匠ゼンの影を1本繋ぐ。章ボス【統計老師 v_boss_s8】への引き。九つめ=最後のかけらに触れて幕。
   ・chapter-01*.js〜chapter-07*.js のノード/quest/ID/証拠/分岐は一切改変しない(別ファイル・別章 "ch08")。
   ・戦闘接続は既存の橋(story-encounter / story-battle-bridge)。encounter に villain と
     exam(examFmt 混入数)を持たせるだけ。採点・SRS・報酬・問題データには一切触れない。
   ・eval/new Function ゼロ。全ノードはデータのみ(next は文字列 or {then,else} or null)。全出力は自前 esc2 経由。
   ・立てるフラグ: c8_ep1_done〜c8_ep3_done / c8_arisa_join / c8_boss_next / c8_ch08_done / c8_zen_ash8。
     章前半の完了フラグは c8_ch08_done(章ボス撃破は後続の ch08b で確定。ここは前半までを確定)。
   ・注: 仲間アリサの好感度キーは cp8(story-cast が arisa.rel=cp8/px=mina と定義済)。data-companions.js の
     cp8 とは別レイヤー(物語の関係値 getRel/setRel はパーティ・パッシブと独立。第七章 leon.rel=cp7 と
     data-companions cp7 が別レイヤーで両立するのと同じ規則)。px は必ず mina(輪郭線バスト)。
     story-cast の arisa 既定を、docs/story-bible.md 第八章の正典へ本ファイルで整合する(chapter-08b.js の
     アリサ描写と一貫。理由は issues に明記)。story-cast 本体は無改変。
   ============================================================ */
(function(){
  var G = (typeof window!=="undefined") ? window : globalThis;
  var S = G.SRStory;
  if(!S || typeof S.register!=="function") return;   /* エンジン未ロードでも安全 */

  /* 第1〜3話の話者を表示名テーブルへ追記(描画層があれば)。新仲間アリサ(px=mina=輪郭線バスト)を
     防御的に宣言・上書き。既存キー(narrator/hero/kai/mina 等)は無改変。小ボス グレン(e_sabizan)/
     ソラ(e_nabakari)、章ボス 統計老師(e_roukisai)、行政官吏・新被害者のみ追記(chapter-08b.js と整合)。 */
  if(S.SPEAKERS && typeof S.SPEAKERS==="object"){
    S.SPEAKERS.arisa = { name:"アリサ", px:"mina" };                    /* 統計官・輪郭線バスト徹底 */
    if(!S.SPEAKERS.gyosei8)   S.SPEAKERS.gyosei8   = { name:"アルケ統計院の官吏 ノルド", px:"e_graus" };
    if(!S.SPEAKERS.guren)     S.SPEAKERS.guren     = { name:"下限崩しのグレン", px:"e_sabizan" };
    if(!S.SPEAKERS.sora8)     S.SPEAKERS.sora8     = { name:"白書騙りのソラ", px:"e_nabakari" };
    if(!S.SPEAKERS.toukei)    S.SPEAKERS.toukei    = { name:"統計老師", px:"e_roukisai" };
    if(!S.SPEAKERS.hisaisha8) S.SPEAKERS.hisaisha8 = { name:"平均の外へ畳まれた人", px:"ghost" };
  }
  /* CAST の arisa 既定を、docs/story-bible.md 第八章の正典へ整合する。px は必ず mina(輪郭線バスト)。
     役割/背景も『統計官・本章で加入・平均の向こうの一人を見失わない』へ揃える。CAST_BY_ID.arisa は
     CAST 配列と同一オブジェクト参照＝人物録も揃う。chapter-08b.js のアリサ描写と一貫させる。 */
  if(S.CAST_BY_ID && S.CAST_BY_ID.arisa){
    var _ar = S.CAST_BY_ID.arisa;
    _ar.px = "mina";
    _ar.role = "統計官(労一・社一)";
    _ar.bio = "行政都市アルケで白書と労働統計、社会保険の沿革を扱ってきた統計官。労働経済・労務管理の用語、確定給付/確定拠出年金・国民健康保険・介護保険・高齢者医療の制度と統計に精通し、百万件の平均から国の形を読み取れる。かつて自らも制度の窓口で一度は『例外』として畳まれかけ、平均の陰に消される一人の痛みを知った。だから数字を操りながら、平均の向こうの『一人』を決して見失わないと誓う。";
    _ar.why = "行政都市アルケで主人公と出会い加入する仲間。一件の悲劇と百万件の平均、その両方を人間として抱え、統計で全体を設計しながら、平均の外へ畳まれた一人を制度の縁から拾い戻す側へ立つ人物。";
  }

  var HIRO  = "行政都市アルケ・平均の掲示板の広場";
  var SHOKO = "行政都市アルケ・統計院の書庫街";
  var HAKU  = "行政都市アルケ・白書論壇の街角";
  var HAKARI= "行政都市アルケ・平均の秤の広間";

  /* 演習 encounter。opts で相手(villain)と過去問混入数(exam=examFmt の本数)・出題数(n)を指定。
     kind:"train" のまま既存の橋(start*)へ委譲する。採点系は一切新設しない。subject=8。 */
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
       第1話「平均の掲示板」
       行政都市アルケ 導入。統計・一般常識の陰で一件の痛みを均された者。新仲間アリサ初登場。
       ○×演習(労一社一 s8)→過去問(examFmt)。小ボス=下限崩しのグレン。カイ/ミナが「なぜ戦うか」を明示。
       ============================================================ */
    { id:"c8_ep1_open", start:true, type:"dialogue", speaker:"narrator", location:HIRO, bgmScene:"emotion",
      text:"行政都市アルケ。広場の掲示板に、『平均賃金』『平均労働時間』の折れ線が誇らしげに並ぶ。だがその裏で、平均から外れた一件の痛みが、静かに『誤差』へ寄せられていた。",
      next:"c8_ep1_intro", flags:{ c8_ep1_start:1 },
      questUpdate:{ qid:"q_ch08", state:"active", step:0 } },
    { id:"c8_ep1_intro", type:"dialogue", speaker:"narrator", location:HIRO,
      text:"労働・社会保険の一般常識は、白書や統計で国の全体像を映す。だがその平均が『世間並みだ』と刃に変わるとき、平均を割った一人は、数字の海に沈められる。", next:"c8_ep1_victim" },
    { id:"c8_ep1_victim", type:"dialogue", speaker:"hisaisha8", location:HIRO, portrait:"ghost", expression:"shock",
      text:"『あなたの待遇は平均の範囲内だ』と言われた。……でも私の手取りは、その折れ線のずっと下だ。去年、同じ班の男が倒れて死んだ。報告書には『平均的な範囲内』と。", next:"c8_ep1_arisa1" },
    { id:"c8_ep1_arisa1", type:"dialogue", speaker:"arisa", location:HIRO, portrait:"mina", expression:"shock",
      text:"……待ってください。その『平均の範囲内』は、分布の裾を切り落とした見せ方です。平均は全体を映す道具で、割った一人を無かったことにする呪文じゃない。", next:"c8_ep1_arisa2" },
    { id:"c8_ep1_arisa2", type:"dialogue", speaker:"arisa", location:HIRO,
      text:"私は統計官です。平均を誰より数えてきた。だからこそ、平均の外へ落とされた一件を見過ごせない。一件の悲劇は、百万件に均しても消えて無くなりはしない。", next:"c8_ep1_kai1" },
    { id:"c8_ep1_kai1", type:"dialogue", speaker:"kai", location:HIRO, portrait:"kai", expression:"angry",
      text:"『平均並みだ』『世間じゃ普通だ』。その言い方、工都でも失業街でも聞いた。……一般常識は、一人を数字で殴るための棍棒じゃねえ。", next:"c8_ep1_mina1" },
    { id:"c8_ep1_mina1", type:"dialogue", speaker:"mina", location:HIRO, portrait:"mina",
      text:"一般常識は、白書や統計で全体の傾きを示し、労務管理や沿革でその成り立ちを伝えます。……でも下限を『世間並み』と言い換えれば、一件が誤差に消えます。", next:"c8_ep1_choice" },

    { id:"c8_ep1_choice", type:"choice", speaker:"hero", location:HIRO, text:"この人に、どう向き合う?",
      choices:[
        { text:"平均と個の違いを、白書・統計と一般常識の筋で正しく積み直す",
          ideologyChanges:{ law:1, mgmt:1 }, flags:{ c8_ep1_path_law:1 }, next:"c8_ep1_probe" },
        { text:"まず、平均を盾に『いないこと』にされた痛みを受け止める",
          ideologyChanges:{ human:1, relief:1 }, flags:{ c8_ep1_path_human:1 }, next:"c8_ep1_alt" }
      ]},
    { id:"c8_ep1_alt", type:"dialogue", speaker:"hero", location:HIRO,
      text:"平均の下に落とされて、いないことにされた。苦しくて当然です。……その上で。統計は全体を映す道具で、あなた一件を消す証明書じゃない。", next:"c8_ep1_probe" },

    { id:"c8_ep1_probe", type:"dialogue", speaker:"narrator", location:HIRO, bgmScene:"field",
      text:"広場の一角に、平均を口実に下限を薄める査定官がいた。『平均並みだ』と言い張って、割った一件を統計の裾へ隠す手口を剥がす。",
      next:"c8_ep1_enc1", questUpdate:{ qid:"q_ch08", state:"active", step:1 } },
    { id:"c8_ep1_enc1", type:"encounter", speaker:"hero", location:HIRO, bgmScene:"emotion",
      text:"平均隠れのノルが、『平均賃金』の折れ線を盾に立ちはだかった。労働経済・白書の読み方、労務管理の用語、社会保険の沿革を、正面から確かめる。",
      encounter: enc(8, "演習・過去問｜労働経済・白書・労務管理・社会保険史を問う", { villain:"v_mob_s8", exam:2 }),
      evidence:"ev_ch8_toukei", next:"c8_ep1_ev1" },
    { id:"c8_ep1_ev1", type:"dialogue", speaker:"arisa", location:HIRO,
      text:"白書も統計も、全体の傾きを読むためのもの。平均は個を裁く物差しじゃない。……あとは、下限そのものを薄めて回る査定官――下限崩しのグレンが、奥に。", next:"c8_ep1_guren1" },
    { id:"c8_ep1_guren1", type:"dialogue", speaker:"guren", location:HIRO, portrait:"e_sabizan", expression:"angry",
      text:"――平均より下? それがどうした。下限など、平均で薄めてやればいい。裾に一件や二件沈もうと、折れ線はびくともせん。丸めてよい端数というものさ。", next:"c8_ep1_probe2" },
    { id:"c8_ep1_probe2", type:"dialogue", speaker:"narrator", location:HIRO, bgmScene:"field",
      text:"下限崩しのグレン。平均の名のもとに統計の読み方を誤らせ、下限を『薄めてよい端数』と刷り込む。指標の読み方と一件の重みを立て直す。",
      next:"c8_ep1_enc2" },
    { id:"c8_ep1_enc2", type:"encounter", speaker:"hero", location:HIRO, bgmScene:"emotion",
      text:"下限崩しのグレンが、裾を切り落とした分布図を盾に立ちはだかった。白書の指標の読み方、労務管理の用語、社会保険の沿革を、高密度に崩す。",
      encounter: enc(8, "過去問｜労働経済・白書・労務管理・社会保険史(小ボス)", { villain:"v_lt_s8a", exam:3 }),
      evidence:"ev_ch8_kagen", next:"c8_ep1_ev2" },
    { id:"c8_ep1_ev2", type:"dialogue", speaker:"mina", location:HIRO, portrait:"mina",
      text:"平均の細工、証拠に残せました。平均や中央値、分布の裾を正しく読めば、下限を割った一件はちゃんと見えてくる。……沈められた一件を、光の下へ戻せました。", next:"c8_ep1_reason" },
    { id:"c8_ep1_reason", type:"reasoning", speaker:"hero", location:HIRO, bgmScene:"emotion",
      text:"労働経済、白書の統計、労務管理、社会保険の沿革。――全体像を掴みつつ、下限を割った一人を『世間並み』で切り捨てさせないための知恵だった。",
      reasoning:{ need:["ev_ch8_toukei","ev_ch8_kagen"] },
      flags:{ c8_ep1_reasoned:1 }, next:"c8_ep1_biz" },

    /* 【行政/制度側の事情】断定せず提示 */
    { id:"c8_ep1_biz", type:"dialogue", speaker:"gyosei8", location:HIRO,
      text:"……下限を正すのは正しい。だが我々は百万人の暮らしを平均で見て、政策も予算も設計する。一件ずつ個別最適で応えていては、制度が立ちゆかぬ。", next:"c8_ep1_hero2" },
    { id:"c8_ep1_hero2", type:"dialogue", speaker:"hero", location:HIRO,
      text:"（平均で全体を設計する必要は本当だ。……でも、足場にすることと、外の一件を誤差として消すことは別だ。どちらかを捨てる話にはしたくない。）",
      next:"c8_ep1_end", ideologyChanges:{ fair:1, mgmt:1 }, flags:{ c8_ep1_saw_sides:1 } },
    { id:"c8_ep1_end", type:"dialogue", speaker:"narrator", location:HIRO, bgmScene:"field",
      text:"人は拾い直された自分の数字を握りしめ、平均の折れ線を初めて正面から見上げた。アリサはその傍らで、支えを組み直す道筋を几帳面な数字で書き添えた。",
      next:"c8_ep1_hook", flags:{ c8_ep1_done:1 }, questUpdate:{ qid:"q_ch08", state:"active", step:2 } },
    { id:"c8_ep1_hook", type:"dialogue", speaker:"arisa", location:HIRO, expression:"shock",
      text:"……なあ調律師さん。本気でこの街の物差しを引き直す気か? だったら私の話も聞いてほしい。私自身が、一度、平均の外へ畳まれかけた人間だからだ。", next:"c8_ep2_open" },

    /* ============================================================
       第2話「書庫の告白」
       アリサの過去を掘り下げ加入。労契法・労組法・最賃法・社労士法 等の論点。
       過去問(五肢択一・個数)混入。小ボス=白書騙りのソラ。
       ============================================================ */
    { id:"c8_ep2_open", type:"dialogue", speaker:"narrator", location:SHOKO, bgmScene:"emotion",
      text:"統計院の書庫街。古い白書の背表紙が天井まで積み上がる。アリサは一番奥の棚から、色あせた相談記録を抜き取った。統計官になる前の、彼女自身の記録だった。",
      next:"c8_ep2_arisa1", flags:{ c8_ep2_start:1 } },
    { id:"c8_ep2_arisa1", type:"dialogue", speaker:"arisa", location:SHOKO, portrait:"mina", expression:"shock",
      text:"この一枚は、昔の私だ。最低賃金を割った額で働かされ、契約も不利に書き換えられていた。窓口では『平均的には稀で……』と押し返された。誰も、道を教えてくれなかった。", next:"c8_ep2_arisa2" },
    { id:"c8_ep2_arisa2", type:"dialogue", speaker:"arisa", location:SHOKO,
      text:"だから統計を学び直した。二度と『平均的には稀』の一語で一件を畳ませないために。労働契約法も、労働組合法も、最低賃金法も、社労士法も、全部覚えた。", next:"c8_ep2_mina1" },
    { id:"c8_ep2_mina1", type:"dialogue", speaker:"mina", location:SHOKO, portrait:"mina",
      text:"……アリサ。あなたの悔いは、平均が個を裁く危うさそのものです。最低賃金法は下限を無効の壁で守り、労働契約法は不利益変更に合意と合理性を求めます。", next:"c8_ep2_join" },
    { id:"c8_ep2_join", type:"dialogue", speaker:"arisa", location:SHOKO, bgmScene:"emotion", expression:"angry",
      text:"……そうだ。知らないままなら、平均の外の一件は稀な誤差のまま消える。だから行く。条件は一つ――平均の向こうにいる一人の顔を、忘れないこと。",
      next:"c8_ep2_kai1", relationshipChanges:{ cp8:1 }, flags:{ c8_arisa_join:1 } },
    { id:"c8_ep2_kai1", type:"dialogue", speaker:"kai", location:SHOKO, portrait:"kai",
      text:"上等だ。平均の向こうの一人を忘れるやつは、おれが一番嫌いなんでな。アリサ、遠慮なく使わせてもらう。", next:"c8_ep2_choice" },

    { id:"c8_ep2_choice", type:"choice", speaker:"hero", location:SHOKO, text:"アリサの統計を、どう使う?",
      choices:[
        { text:"最低賃金・労働契約・労働組合・社労士法の筋を、一件ずつ制度でつなぎ直して回る",
          ideologyChanges:{ law:1, mgmt:1 }, flags:{ c8_ep2_path_law:1 }, next:"c8_ep2_probe" },
        { text:"『平均的には稀』の一語で畳まれ、諦めた側の声を、先に集める",
          ideologyChanges:{ human:1, relief:1 }, flags:{ c8_ep2_path_human:1 }, next:"c8_ep2_alt" }
      ]},
    { id:"c8_ep2_alt", type:"dialogue", speaker:"hero", location:SHOKO,
      text:"条文の前に、一人がいる。最低賃金を割られた者、契約を書き換えられた者、『稀な例だ』と押し返された者。……アリサ、あなたのあの一枚から始めさせてください。", next:"c8_ep2_probe" },

    { id:"c8_ep2_probe", type:"dialogue", speaker:"narrator", location:HAKU, bgmScene:"field",
      text:"白書の数字を切り貼りして『平均的には問題ない』と言いくるめる論客がいた。最低賃金も、団結の権利も、『統計上は稀だ』の一語で塞いでいく。",
      next:"c8_ep2_enc1", questUpdate:{ qid:"q_ch08", state:"active", step:3 } },
    { id:"c8_ep2_enc1", type:"encounter", speaker:"hero", location:HAKU, bgmScene:"emotion",
      text:"平均隠れのノルが、切り貼りした白書の束を抱えて現れた。最低賃金法の下限、労働契約法の不利益変更、労働組合法の団結、社労士法の業務を、数え直す。",
      encounter: enc(8, "過去問｜最低賃金・労働契約・労働組合・社労士法を問う", { villain:"v_mob_s8", exam:2 }),
      evidence:"ev_ch8_roso", next:"c8_ep2_ev1" },
    { id:"c8_ep2_ev1", type:"dialogue", speaker:"arisa", location:HAKU,
      text:"最低賃金は下限を無効の壁で守り、契約の不利益変更には合意と合理性が要る。団結し団体交渉する権利もある。……次は、白書騙りのソラです。", next:"c8_ep2_sora1" },
    { id:"c8_ep2_sora1", type:"dialogue", speaker:"sora8", location:HAKU, portrait:"e_nabakari", expression:"angry",
      text:"白書によれば、労働環境は年々改善しております。数字がそう申しております。あなた一人が苦しい? それは統計上、極めて稀な例。全体は良くなっている。", next:"c8_ep2_probe2" },
    { id:"c8_ep2_probe2", type:"dialogue", speaker:"narrator", location:HAKU, bgmScene:"field",
      text:"白書騙りのソラ。数字を都合よく切り取り、平均の改善を盾に一件を『稀な例』として黙らせる。白書の正しい読み方と労働法規の筋を立て直す。",
      next:"c8_ep2_enc2" },
    { id:"c8_ep2_enc2", type:"encounter", speaker:"hero", location:HAKU, bgmScene:"emotion",
      text:"白書騙りのソラが、切り取った折れ線を盾に立ちはだかった。白書の指標の読み方、最低賃金法・労働契約法・労働組合法・社労士法を、高密度に崩す。",
      encounter: enc(8, "過去問｜白書の読み方・労働法規・社労士法(小ボス)", { villain:"v_lt_s8b", exam:3 }),
      evidence:"ev_ch8_hakusho", next:"c8_ep2_ev2" },
    { id:"c8_ep2_ev2", type:"dialogue", speaker:"mina", location:HAKU, portrait:"mina",
      text:"白書の騙り、証拠に残せました。全体が平均で改善していても、平均を割った一件は消えて無くなりはしません。……次に立つのは、この街の平均そのものです。", next:"c8_ep2_reason" },
    { id:"c8_ep2_reason", type:"reasoning", speaker:"hero", location:HAKU, bgmScene:"emotion",
      text:"最低賃金、労働契約、労働組合、社労士法、そして白書の読み方。――平均が改善したという一語で、外へ落とされた一件を黙らせないための条文と知恵だった。",
      reasoning:{ need:["ev_ch8_roso","ev_ch8_hakusho"] },
      flags:{ c8_ep2_reasoned:1 }, next:"c8_ep2_biz" },

    /* 【行政/制度側の事情】断定せず、次話の壁として残す */
    { id:"c8_ep2_biz", type:"dialogue", speaker:"gyosei8", location:HAKU, expression:"shock",
      text:"……白書で改善を示すのを悪だと言い切れるか。平均が良くなったと示せなければ、次の政策も予算も根拠を失う。私は、次の百万人のために物差しを守っただけだ。", next:"c8_ep2_hero2" },
    { id:"c8_ep2_hero2", type:"dialogue", speaker:"hero", location:HAKU,
      text:"（平均で全体を判断する必要は本物だ。……でも、全体を映すことと、外の一件を『稀』と切り捨てることは混ぜてはいけない。全体も一件も守れる位置に、線を引く。）",
      next:"c8_ep2_end", ideologyChanges:{ fair:1, mgmt:1 }, flags:{ c8_ep2_saw_sides:1 } },
    { id:"c8_ep2_end", type:"dialogue", speaker:"narrator", location:SHOKO, bgmScene:"field",
      text:"アリサは昔の自分の記録を、そっと書庫の一番上に戻した。『次は、誰の一件も、稀な誤差にしない』――その横顔に、畳まれかけた痛みがあった。",
      next:"c8_ep2_hook", flags:{ c8_ep2_done:1 }, questUpdate:{ qid:"q_ch08", state:"active", step:4 } },
    { id:"c8_ep2_hook", type:"dialogue", speaker:"arisa", location:SHOKO, expression:"angry",
      text:"……だが調律師さん。小ボスを何人正しても歪みは消えない。『百万件の平均』という物差しそのものが、最奥に立っている。次は、そいつだ。", next:"c8_ep3_open" },

    /* ============================================================
       第3話「平均の秤」
       『平均が個を消す』歪みそのものと対峙する引き。制度/行政側の事情ビートを断定せず提示。
       師匠ゼンの影を1本繋ぐ。章ボス【統計老師 v_boss_s8】への引き。九つめ=最後のかけらに触れて幕。
       ============================================================ */
    { id:"c8_ep3_open", type:"dialogue", speaker:"narrator", location:HAKARI, bgmScene:"emotion",
      text:"行政都市の中枢、平均の秤の広間。一方の皿に百万件の平均の折れ線。もう一方に、平均を割って沈んだ無数の一件。『平均どおり』が、こぼれた一件を誤差へ均していた。",
      next:"c8_ep3_arisa1", flags:{ c8_ep3_start:1 } },
    { id:"c8_ep3_arisa1", type:"dialogue", speaker:"arisa", location:HAKARI, portrait:"mina",
      text:"平均の皿は、この国の全体像を正しく映している。大きな傾きは間違っていない。……問題は向かいの皿だ。平均が個を裁くとき、一件の悲劇が誤差として均される。", next:"c8_ep3_mina1" },
    { id:"c8_ep3_mina1", type:"dialogue", speaker:"mina", location:HAKARI, portrait:"mina",
      text:"一般常識は、白書と統計で全体を映し、労働法規と社会保険の制度でその全体を支える骨組み。……でも平均を裁きに使えば、支えられるはずの個が数字の海に沈みます。", next:"c8_ep3_zen" },
    { id:"c8_ep3_zen", type:"dialogue", speaker:"narrator", location:HAKARI, bgmScene:"emotion",
      text:"広間の古い白書台帳。表紙の裏に掠れた字。『平均で全体を設計せよ。だが、平均の外へ落ちた一件を、誤差と呼ぶな』――師匠ゼンの筆跡だった。",
      next:"c8_ep3_choice", flags:{ c8_zen_ash8:1 } },

    { id:"c8_ep3_choice", type:"choice", speaker:"hero", location:HAKARI, text:"『平均どおり』の秤に、どう立つ?",
      choices:[
        { text:"労働法規と白書・統計の読み方まで、条文と知恵で正しく張り直す",
          ideologyChanges:{ law:1, fair:1 }, flags:{ c8_ep3_path_law:1 }, next:"c8_ep3_probe" },
        { text:"平均で全体を回す側、平均に沈んだ側、双方の理由をまず問う",
          ideologyChanges:{ human:1, mgmt:1 }, flags:{ c8_ep3_path_ask:1 }, next:"c8_ep3_alt" }
      ]},
    { id:"c8_ep3_alt", type:"dialogue", speaker:"hero", location:HAKARI,
      text:"秤を責める前に、理由がある。平均で百万人を回さねばならぬ行政の事情。誤差にされた者の無念。……そこからしか、全体を設計しつつ一件を支える線は引けない。", next:"c8_ep3_probe" },

    { id:"c8_ep3_probe", type:"dialogue", speaker:"narrator", location:HAKARI, bgmScene:"field",
      text:"『平均から外れた稀な例』を理由に、労働法規の支えも白書の読み方も握り潰す手先が、最後の抵抗に出た。その一枚を剥がす。",
      next:"c8_ep3_enc1", questUpdate:{ qid:"q_ch08", state:"active", step:5 } },
    { id:"c8_ep3_enc1", type:"encounter", speaker:"hero", location:HAKARI, bgmScene:"emotion",
      text:"平均隠れのノルが再び現れた。労働経済・白書・労務管理、最低賃金法・労働契約法・労働組合法・社労士法、社会保険の沿革を、本試験の問いで崩す。",
      encounter: enc(8, "過去問｜労働法規・白書・社会保険一般常識の全体を取り戻す", { villain:"v_mob_s8", exam:2 }),
      evidence:"ev_ch8_zentai", next:"c8_ep3_ev1" },
    { id:"c8_ep3_ev1", type:"dialogue", speaker:"arisa", location:HAKARI,
      text:"労働経済も白書も、全体を映すためのもの。最低賃金・労働契約・労働組合・社労士法は、外の一件を制度へつなぐためのもの。……握り潰させはしない。", next:"c8_ep3_reason" },
    { id:"c8_ep3_reason", type:"reasoning", speaker:"hero", location:HAKARI, bgmScene:"emotion",
      text:"労働経済、白書、労務管理、最低賃金、労働契約、労働組合、社労士法、沿革。――全体像を平均で掴みつつ、こぼす一件を誤差にせず拾うための知恵と条文だった。",
      reasoning:{ need:["ev_ch8_zentai"] },
      flags:{ c8_ep3_reasoned:1 }, next:"c8_ep3_biz" },

    /* 【制度/行政側の事情】断定せず、章ボスへの問いとして残す */
    { id:"c8_ep3_biz", type:"dialogue", speaker:"gyosei8", location:HAKARI, expression:"shock",
      text:"……分かった。だが私の背後に立つものは大きい。百万人を一本の物差しで回そうとする者と、こぼれる一件を恐れる情けが、長く綱を引き合ってきた秤だ。", next:"c8_ep3_boss_hook" },
    { id:"c8_ep3_boss_hook", type:"dialogue", speaker:"toukei", location:HAKARI, portrait:"e_roukisai", expression:"angry",
      text:"――数えたか? 平均を取ったか? 百万件を一本に均すのが、全体を最適に設計する理だ。外の一件が誤差に沈むのも、また理。……その秤に、抗うか。",
      next:"c8_ep3_hero_final", flags:{ c8_boss_next:1 } },
    { id:"c8_ep3_hero_final", type:"dialogue", speaker:"hero", location:HAKARI,
      text:"抗う。カイも、ミナも、アリサもいる。平均を割った者も、稀な例と畳まれた者も顔を上げた。……その秤を、労一・社一の全体像で引き受けに行く。一件を、誤差にしないために。", next:"c8_ep3_end" },
    { id:"c8_ep3_end", type:"dialogue", speaker:"narrator", location:HAKARI, bgmScene:"field",
      text:"アルケで、『平均どおり』の秤が初めて『こぼれる一件の悲劇』とともに問い返された。だが最奥に立つ影――統計老師との対峙は、まだこれからだ。",
      next:null, flags:{ c8_ep3_done:1, c8_ch08_done:1 },
      questUpdate:{ qid:"q_ch08", state:"done", step:6 } }
  ];

  /* 第1〜3話(章前半)クエスト定義(doneFlag で完了判定)。第一〜七章の各クエストは無改変の別クエスト。 */
  if(typeof S.registerQuest==="function"){
    S.registerQuest("q_ch08", {
      title:"一件の悲劇と、百万件の平均の間",
      chapter:"ch08",
      steps:["平均の掲示板","書庫の告白","平均の秤"],
      doneFlag:"c8_ch08_done"
    });
  }

  S.register("ch08", NODES);
  S.CH08_ID = "ch08";

  /* メイン章の背骨(S.MAIN)へ、第七章(ch07b)の続きとして追記する。
     ・第七章クリア(c7_ch07b_done)後、ホームの「今日の冒険」が自動で本章へ進む導線になる。
     ・S.MAIN の並びは登録(push)順＝本ファイルは chapter-08b.js より前に読み込むため、ch08 が ch08b の
       直前に入り、順序は ...→ch07b→ch08→ch08b→... となる(index.html/sw.js の読込順で担保)。
     ・章選択画面は前章 done まで locked=第七章クリアが解放ゲートとして機能する(既存規則に沿う)。
     ・S.MAIN 未ロード/未定義でも安全(存在する時だけ push、重複登録も防ぐ)。 */
  if(Array.isArray(S.MAIN)){
    var exists = false;
    for(var i=0;i<S.MAIN.length;i++){ if(S.MAIN[i] && S.MAIN[i].id==="ch08"){ exists = true; break; } }
    if(!exists){
      S.MAIN.push({ id:"ch08", no:"第八章", title:"一件の悲劇と、百万件の平均の間", loc:"行政都市アルケ",
        doneFlag:"c8_ch08_done", startedFlag:"c8_ep1_start" });
    }
  }
})();
