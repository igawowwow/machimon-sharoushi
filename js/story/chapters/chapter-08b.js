"use strict";
/* ============================================================
   story/chapters/chapter-08b.js — 第八章「一件の悲劇と、百万件の平均の間」第4〜8話 + 章ボス戦
   docs/story-bible.md / ENDING-CANON 準拠。chapter-08.js(第1〜3話)の末尾から地続きの五話を、
   別 chapterId="ch08b" で綴じ込む。舞台=行政都市アルケ(統計局の街から法典広間の最奥へ)／
   科目=労働・社会保険に関する一般常識(subject 8)。テーマ=目の前の一人の痛みと、統計が語る
   全体像の間で、制度をどう設計するか。※全9科目の最後の科目章＝以後は終章へ。
   ・第4話「平均の外の一人」…労働契約法・労働組合法・労働施策総合推進法(パワハラ防止)・最低賃金法。
                     『平均並みだ』の一語で最賃割れと不利益変更を当然に見せる手先を、条文で剥がす。過去問(examFmt)混入。
   ・第5話「畳まれた窓口」…社会保険労務士法・確定給付/確定拠出年金(企業年金)。中ボス 例外処理のカザン 初登場
                     (かつて自らも窓口で『例外』と畳まれ支えを失った過去。今は逆側で一人を平均の外へ畳む調停官)。
   ・第6話「例外処理の算術」…中ボス【例外処理のカザン v_mid_s8】戦。国民健康保険法・介護保険法・
                     高齢者医療確保法の総合。アリサとの絆深化(cp8)。
   ・第7話「決戦前夜」…仲間との会話で覚悟。戦う意味の総括(戦闘なし)。師匠ゼンの影を1本繋ぐ。
   ・第8話「決戦」…章ボス【統計老師 v_boss_s8】戦=【章末問題集】(労一・社一の過去問=examFmt中心の高難度)。
                 撃破後は断定的勝利にせず、「間を取り持つ/法典のかけらを取り戻す」テーマへ橋渡し(introの九つのかけら)。
   ・各話に必ず「経営者/行政/制度側の事情」ビートを置き、断定せず問いを残す(平均で全体を回す事情)。
   ・chapter-01*.js〜chapter-07*.js / chapter-08.js のノード/quest/ID/証拠/分岐は
     一切改変しない(別ファイル・別章 "ch08b")。
   ・戦闘接続は既存の橋(story-encounter / story-battle-bridge)。encounter に villain と
     exam(examFmt 混入数)を持たせるだけで、採点・SRS・報酬・問題データには一切触れない。
     ボス戦も新規採点系を作らず、examFmt を多く混ぜた高難度 encounter として既存橋へ委譲する。
   ・eval/new Function ゼロ。全ノードはデータのみ(next は文字列 or {then,else} or null)。全出力は自前 esc2 経由。
   ・立てるフラグ: c8_ep4_done〜c8_ep8_done / c8_boss_cleared / c8_ch08b_done / c8_zen_ash8b / c8_shard8。
   ・注: 仲間アリサの好感度キーは cp8(story-cast が arisa.rel=cp8 と定義済・px=mina=輪郭線バスト)。
     data-companions.js の cp8(統計博士・グレー改め白露)とは別レイヤー(物語の関係値 getRel/setRel は
     パーティ・パッシブと独立。第七章 leon.rel=cp7 と data-companions cp7 が別レイヤーで両立するのと同じ規則)。
     story-cast の arisa 既定 bio/why は「対立する行政側」だが、docs/story-bible.md 第八章の正典
     (統計官・本章で加入・平均の向こうの一人を見失わないと誓う)へ、本ファイルで CAST を上書き整合する
     (leon が chapter-07.js で正典へ上書きされたのと同じ規則。理由は issues に明記)。px は必ず mina。
   ============================================================ */
(function(){
  var G = (typeof window!=="undefined") ? window : globalThis;
  var S = G.SRStory;
  if(!S || typeof S.register!=="function") return;   /* エンジン未ロードでも安全 */

  /* 第4〜8話の話者を表示名テーブルへ追記(描画層があれば。無ければ素通し)。
     kai/mina は既存。新仲間アリサ(px=mina=輪郭線バスト)を防御的に宣言・上書き。
     中ボス カザン(px=e_kacho)/章ボス 統計老師(px=e_roukisai)/新被害者のみ追記。 */
  if(S.SPEAKERS && typeof S.SPEAKERS==="object"){
    S.SPEAKERS.arisa = { name:"アリサ", px:"mina" };                    /* 統計官・輪郭線バスト徹底 */
    if(!S.SPEAKERS.gyosei8)  S.SPEAKERS.gyosei8  = { name:"アルケ統計院の官吏 ノルド", px:"e_graus" };
    if(!S.SPEAKERS.kazan)    S.SPEAKERS.kazan    = { name:"例外処理のカザン", px:"e_kacho" };
    if(!S.SPEAKERS.toukei)   S.SPEAKERS.toukei   = { name:"統計老師", px:"e_roukisai" };
    if(!S.SPEAKERS.hisaisha8) S.SPEAKERS.hisaisha8 = { name:"平均の外へ畳まれた人", px:"ghost" };
  }
  /* CAST の arisa 既定(対立する行政側)を、docs/story-bible.md 第八章の正典へ整合する。
     px は必ず mina(輪郭線バスト)。役割/背景も『統計官・本章で加入・平均の向こうの一人を
     見失わない』へ揃える。CAST_BY_ID.arisa は CAST 配列と同一オブジェクト参照＝人物録も揃う。 */
  if(S.CAST_BY_ID && S.CAST_BY_ID.arisa){
    var _ar = S.CAST_BY_ID.arisa;
    _ar.px = "mina";
    _ar.role = "統計官(労一・社一)";
    _ar.bio = "行政都市アルケで白書と労働統計、社会保険の沿革を扱ってきた統計官。労働経済・労務管理の用語、確定給付/確定拠出年金・国民健康保険・介護保険・高齢者医療の制度と統計に精通し、百万件の平均から国の形を読み取れる。かつて自らも制度の窓口で一度は『例外』として畳まれかけ、平均の陰に消される一人の痛みを知った。だから数字を操りながら、平均の向こうの『一人』を決して見失わないと誓う。";
    _ar.why = "行政都市アルケで主人公と出会い加入する仲間。一件の悲劇と百万件の平均、その両方を人間として抱え、統計で全体を設計しながら、平均の外へ畳まれた一人を制度の縁から拾い戻す側へ立つ人物。";
  }

  var TOU  = "行政都市アルケ・統計局の街";
  var MADO = "行政都市アルケ・社会保険の窓口街";
  var CHO  = "行政都市アルケ・調停院の街";
  var YADO = "行政都市アルケ・宵の宿の街";
  var DAIN = "行政都市アルケ・法典広間の最奥";

  /* 演習 encounter。opts で相手(villain)と過去問混入数(exam=examFmt の本数)・出題数(n)を指定。
     kind:"train" のまま既存の橋(start*)へ委譲する。ボス戦は exam/n を大きくした高難度セット。subject=8。 */
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
       第4話「平均の外の一人」
       労働契約法・労働組合法・労働施策総合推進法(パワハラ防止)・最低賃金法。
       ============================================================ */
    { id:"c8_ep4_open", start:true, type:"dialogue", speaker:"narrator", location:TOU, bgmScene:"emotion",
      text:"統計局の街。掲示板に『平均賃金』の折れ線。その真下で、一人の労働者が薄い賃金明細を握りしめていた。最低賃金を下回る額を、『世間並みだ』と押しつけられていた。",
      next:"c8_ep4_intro", flags:{ c8_ep4_start:1 },
      questUpdate:{ qid:"q_ch08b", state:"active", step:0 } },
    { id:"c8_ep4_intro", type:"dialogue", speaker:"hisaisha8", location:TOU, portrait:"ghost", expression:"shock",
      text:"『平均以下だが、皆この条件で働いている』と言われた。最低賃金? 『平均を見ろ』と。声を上げたら『個人の資質の問題だ』と。……平均の外にいる私は、いないことになるのか。", next:"c8_ep4_arisa1" },
    { id:"c8_ep4_arisa1", type:"dialogue", speaker:"arisa", location:TOU, portrait:"mina", expression:"shock",
      text:"……待ってください。平均賃金と地域別最低賃金は、まったくの別物です。最低賃金法の下限は、平均で薄めてよいものではない。あなたの額は、その下限を割っている。", next:"c8_ep4_arisa2" },
    { id:"c8_ep4_arisa2", type:"dialogue", speaker:"arisa", location:TOU,
      text:"最低賃金法は、下限を割る定めを無効とし、下限額まで引き上げます。労働契約法は不利益変更に合理性と周知を求める。労働施策総合推進法はパワハラ防止の措置を義務づけている。", next:"c8_ep4_kai1" },
    { id:"c8_ep4_kai1", type:"dialogue", speaker:"kai", location:TOU, portrait:"kai", expression:"angry",
      text:"『皆その条件だ』『平均以下のお前が甘い』。その言い方、工都でも失業街でも聞いた。……最低賃金は、平均で薄める下限じゃねえ。", next:"c8_ep4_mina1" },
    { id:"c8_ep4_mina1", type:"dialogue", speaker:"mina", location:TOU, portrait:"mina",
      text:"労働組合法は、団結し、団体交渉し、争議する権利を保障します。一人では平均に沈められても、団結すれば交渉の卓に乗せられる。……『個人の資質』で畳むのも義務違反です。", next:"c8_ep4_choice" },

    { id:"c8_ep4_choice", type:"choice", speaker:"hero", location:TOU, text:"この労働者に、どう向き合う?",
      choices:[
        { text:"最低賃金・労働契約・パワハラ防止の筋を、条文で正しく積み直す",
          ideologyChanges:{ law:1, mgmt:1 }, flags:{ c8_ep4_path_law:1 }, next:"c8_ep4_probe" },
        { text:"まず、平均を盾に『いないこと』にされた痛みを受け止める",
          ideologyChanges:{ human:1, relief:1 }, flags:{ c8_ep4_path_human:1 }, next:"c8_ep4_alt" }
      ]},
    { id:"c8_ep4_alt", type:"dialogue", speaker:"hero", location:TOU,
      text:"平均の外に落とされて、いないことにされた。苦しくて当然です。……その上で。あなたの賃金は下限を割っている。契約の変更にも合意が要る。取り戻せます。", next:"c8_ep4_probe" },

    { id:"c8_ep4_probe", type:"dialogue", speaker:"narrator", location:TOU, bgmScene:"field",
      text:"『平均並みだ、皆そうしている』――そう言い張って、最低賃金割れと不利益変更を世間の平均に隠す手先がいた。その筋を剥がしていく。",
      next:"c8_ep4_enc1", questUpdate:{ qid:"q_ch08b", state:"active", step:1 } },
    { id:"c8_ep4_enc1", type:"encounter", speaker:"hero", location:TOU, bgmScene:"emotion",
      text:"平均隠れのノルが、折れ線を盾に立ちはだかった。地域別最低賃金の効力、労働契約の不利益変更、労働組合法の団結、パワハラ防止の措置義務を、正面から確かめる。",
      encounter: enc(8, "過去問｜最低賃金・労働契約・労働組合・パワハラ防止を問う", { villain:"v_mob_s8", exam:2 }),
      evidence:"ev_ch8b_rodo", next:"c8_ep4_ev1" },
    { id:"c8_ep4_ev1", type:"dialogue", speaker:"arisa", location:TOU,
      text:"最低賃金は平均では薄められない。下限を割れば、その差額まで引き上げられる。契約の変更には合意と合理性、ハラスメントには措置義務。……次は、束ねる者が奥に。", next:"c8_ep4_reason" },
    { id:"c8_ep4_reason", type:"reasoning", speaker:"hero", location:TOU, bgmScene:"emotion",
      text:"最低賃金の下限、不利益変更の歯止め、団結権、パワハラ防止の措置義務。――平均の陰に沈められた一人を、『世間並み』で切り捨てさせないための条文だった。",
      reasoning:{ need:["ev_ch8b_rodo"] },
      flags:{ c8_ep4_reasoned:1 }, next:"c8_ep4_biz" },

    /* 【行政/制度側の事情】断定せず提示 */
    { id:"c8_ep4_biz", type:"dialogue", speaker:"gyosei8", location:TOU,
      text:"……下限を正すのは正しい。だが我々は百万人の労働市場を平均で見て、最低賃金も雇用施策も設計する。一人ずつ個別最適で応えていては、制度が立ちゆかぬ。", next:"c8_ep4_hero2" },
    { id:"c8_ep4_hero2", type:"dialogue", speaker:"hero", location:TOU,
      text:"（平均で全体を設計する必要は本当だ。……でも、足場にすることと、外の一人を『例外』として落とすことは別だ。どちらかを捨てる話にはしたくない。）",
      next:"c8_ep4_end", ideologyChanges:{ fair:1, mgmt:1 }, flags:{ c8_ep4_saw_sides:1 } },
    { id:"c8_ep4_end", type:"dialogue", speaker:"narrator", location:TOU, bgmScene:"field",
      text:"労働者は引き上げられた明細と正された契約を胸に、平均の折れ線を初めて正面から見上げた。アリサは、下限と団体交渉の道筋を几帳面な数字で書き添えてやった。",
      next:"c8_ep4_hook", flags:{ c8_ep4_done:1 }, questUpdate:{ qid:"q_ch08b", state:"active", step:2 } },
    { id:"c8_ep4_hook", type:"dialogue", speaker:"arisa", location:TOU, expression:"shock",
      text:"……でも調律師さん。この平均隠しには大元がいます。社労士法の代理も、企業年金も、国保も介護も、『あなたは例外だ』の一語で畳んでいる調停官――例外処理のカザン。", next:"c8_ep5_open" },

    /* ============================================================
       第5話「畳まれた窓口」
       社会保険労務士法・確定給付/確定拠出年金(企業年金)。中ボス 例外処理のカザン 初登場。
       ============================================================ */
    { id:"c8_ep5_open", type:"dialogue", speaker:"narrator", location:MADO, bgmScene:"emotion",
      text:"社会保険の窓口街。長い列の先で、企業年金の受給を求める者が次々と『例外です』の判で押し返されていた。奥に、例外処理のカザンが分布図を背に立っていた。",
      next:"c8_ep5_intro", flags:{ c8_ep5_start:1 } },
    { id:"c8_ep5_intro", type:"dialogue", speaker:"kazan", location:MADO, portrait:"e_kacho", expression:"angry",
      text:"――あなたは平均から外れている。例外だ。企業年金の受け取り? 社労士に代理を頼む? ……一人ずつ拾っていては、百万人分の窓口が回らん。縁の一人は畳ませてもらう。", next:"c8_ep5_arisa1" },
    { id:"c8_ep5_arisa1", type:"dialogue", speaker:"arisa", location:MADO, portrait:"mina", expression:"shock",
      text:"……カザン。あなた、昔は誰より窓口の一人に寄り添った人でしょう。自分が『例外です』と畳まれ、支えを取りこぼした。……その人が、なぜ今、同じ言葉で畳む。", next:"c8_ep5_kazan2" },
    { id:"c8_ep5_kazan2", type:"dialogue", speaker:"kazan", location:MADO, expression:"angry",
      text:"……痛みを知るからだ。私が畳まれたのは、窓口が一人ずつに構い過ぎて回らなくなったからだ。ならば縁を畳んで、中心を守る。次に平均の内側で待つ大勢のために。", next:"c8_ep5_mina1" },
    { id:"c8_ep5_mina1", type:"dialogue", speaker:"mina", location:MADO, portrait:"mina",
      text:"社会保険労務士法は、手続の代理・帳簿書類の作成・相談を社労士の業とします。確定給付企業年金は事業主が給付を約し、確定拠出年金は拠出を積んで運用の結果を受け取ります。", next:"c8_ep5_choice" },

    { id:"c8_ep5_choice", type:"choice", speaker:"hero", location:MADO, text:"畳まれた窓口の際に、どう立つ?",
      choices:[
        { text:"社労士法と企業年金(確定給付/確定拠出)の要件で、際から一人ずつつなぎ直す",
          ideologyChanges:{ law:1, fair:1 }, flags:{ c8_ep5_path_law:1 }, next:"c8_ep5_probe" },
        { text:"全体の破綻を怖れて縁を畳んだ、カザンの痛みをまず聞く",
          ideologyChanges:{ human:1, mgmt:1 }, flags:{ c8_ep5_path_ask:1 }, next:"c8_ep5_alt" }
      ]},
    { id:"c8_ep5_alt", type:"dialogue", speaker:"hero", location:MADO,
      text:"全体が破綻する恐れは分かります。窓口が回らなくなった月もあったのでしょう。……その上で。畳む前に、つなげる道があった。道を示せば、全体も守れます。", next:"c8_ep5_probe" },

    { id:"c8_ep5_probe", type:"dialogue", speaker:"narrator", location:MADO, bgmScene:"field",
      text:"『あなたは例外だ』――手先が、社労士法の代理と企業年金の受給を『例外』の判で塞いでいた。その筋道を一つずつ立て直す。",
      next:"c8_ep5_enc1", questUpdate:{ qid:"q_ch08b", state:"active", step:3 } },
    { id:"c8_ep5_enc1", type:"encounter", speaker:"hero", location:MADO, bgmScene:"emotion",
      text:"平均隠れのノルが、『例外』の判の束を盾に立ちはだかった。社会保険労務士法の業務と義務、確定給付企業年金と確定拠出年金の仕組みを、本試験の問いで数え直す。",
      encounter: enc(8, "過去問｜社会保険労務士法・確定給付/確定拠出年金を問う", { villain:"v_mob_s8", exam:2 }),
      evidence:"ev_ch8b_shakai", next:"c8_ep5_ev1" },
    { id:"c8_ep5_ev1", type:"dialogue", speaker:"arisa", location:MADO,
      text:"社労士法は手続の代理・相談で一人を制度につなぎ、企業年金には確定給付・確定拠出という受給の道がある。……次に立つのは、カザン本人です。", next:"c8_ep5_reason" },
    { id:"c8_ep5_reason", type:"reasoning", speaker:"hero", location:MADO, bgmScene:"emotion",
      text:"社労士法の代理と相談、確定給付企業年金、確定拠出年金。――平均の外へ畳まれた一人を、制度の縁から拾い戻す道だった。『例外だ』は、道を塞いだ細工だ。",
      reasoning:{ need:["ev_ch8b_shakai"] },
      flags:{ c8_ep5_reasoned:1 }, next:"c8_ep5_biz" },

    /* 【調停官/行政側の事情】断定せず、次話の壁として残す */
    { id:"c8_ep5_biz", type:"dialogue", speaker:"kazan", location:MADO, expression:"shock",
      text:"……縁を畳むのを悪だと言い切れるか。例外を拾い続ければ、その手間を誰が支える。窓口が回らなくなれば、平均の内側の大勢がまとめて支えを失う。", next:"c8_ep5_hero2" },
    { id:"c8_ep5_hero2", type:"dialogue", speaker:"hero", location:MADO,
      text:"（全体を残す問いは本物だ。……でも、要件でつなぐ線と、道を伏せて『例外』と畳む締め付けは混ぜてはいけない。落とすことと、回すことは別の話だ。）",
      next:"c8_ep5_end", ideologyChanges:{ fair:1, mgmt:1 }, flags:{ c8_ep5_saw_sides:1 } },
    { id:"c8_ep5_end", type:"dialogue", speaker:"narrator", location:MADO, bgmScene:"field",
      text:"カザンは『例外』の判を握ったまま動かなかった。静かな面の奥で、かつて自らが窓口で畳まれ、支えを取りこぼした頃の顔が、消せずに揺れていた。",
      next:"c8_ep5_hook", flags:{ c8_ep5_done:1 }, questUpdate:{ qid:"q_ch08b", state:"active", step:4 } },
    { id:"c8_ep5_hook", type:"dialogue", speaker:"kai", location:MADO, portrait:"kai", expression:"angry",
      text:"……あいつはまだ判を手放しちゃいねえ。調停院の奥で、国保も介護も高齢者医療も、まとめて『例外』で畳み落とすつもりだ。行くぞ、調律師。", next:"c8_ep6_open" },

    /* ============================================================
       第6話「例外処理の算術」— 中ボス【例外処理のカザン v_mid_s8】戦
       国民健康保険法・介護保険法・高齢者医療確保法の総合。アリサとの関係深化(cp8)。
       ============================================================ */
    { id:"c8_ep6_open", type:"dialogue", speaker:"narrator", location:CHO, bgmScene:"emotion",
      text:"調停院の最奥。『例外』の判の山から、次々と給付が畳まれていた。国保の減免を求める者、要介護認定を待つ者、後期高齢者医療の窓口に立つ老いた者。",
      next:"c8_ep6_choice", flags:{ c8_ep6_start:1 } },
    { id:"c8_ep6_choice", type:"choice", speaker:"hero", location:CHO, text:"カザンの『例外処理』を、どう解く?",
      choices:[
        { text:"国保・介護・高齢者医療の全体像で、縁から一人をつなぎ直す",
          ideologyChanges:{ law:1, fair:1 }, flags:{ c8_ep6_path_law:1 }, next:"c8_ep6_probe" },
        { text:"同じく窓口で畳まれた者として、まずカザンに語りかける",
          ideologyChanges:{ human:1, relief:1 }, flags:{ c8_ep6_path_human:1 }, next:"c8_ep6_alt" }
      ]},
    { id:"c8_ep6_alt", type:"dialogue", speaker:"arisa", location:CHO, portrait:"mina",
      text:"カザン。私も統計の内側にいた人間だ。数えるほど、外れ値の一人を『誤差』と丸めそうになる。……あなたの締め付けは、私が踏みとどまった一歩、先だ。手を、止めて。", next:"c8_ep6_probe" },

    { id:"c8_ep6_probe", type:"dialogue", speaker:"narrator", location:CHO, bgmScene:"field",
      text:"判の山から畳まれる寸前の給付。国保の減免、要介護認定、後期高齢者医療。縁の骨組みで、一人ずつ拾い上げる。",
      next:"c8_ep6_enc1", questUpdate:{ qid:"q_ch08b", state:"active", step:5 } },
    { id:"c8_ep6_enc1", type:"encounter", speaker:"hero", location:CHO,
      text:"まずは縁の骨組み。国民健康保険の被保険者と保険料・減免、介護保険の被保険者と要介護認定、高齢者医療確保法の後期高齢者医療制度。畳まれかけた一人をつなぐ。",
      encounter: enc(8, "過去問｜国民健康保険・介護保険・高齢者医療を問う", { villain:"v_mob_s8", exam:2 }),
      evidence:"ev_ch8b_kaigo", next:"c8_ep6_ev1" },
    { id:"c8_ep6_ev1", type:"dialogue", speaker:"mina", location:CHO, portrait:"mina",
      text:"骨組み、通せました。……ですが、カザン本人が『例外』の判を構えて前に出ます。畳んできた歳月ごと、正面からぶつかることになります。", next:"c8_ep6_enc2" },
    { id:"c8_ep6_enc2", type:"encounter", speaker:"hero", location:CHO, bgmScene:"emotion",
      text:"例外処理のカザンが『例外』の判を背に立ちはだかった。社労士法、確定給付/確定拠出年金、国民健康保険法・介護保険法・高齢者医療確保法の全体像で、縁を解き直す。",
      encounter: enc(8, "過去問｜社労士法・企業年金・国保・介護・高医の総合(中ボス)", { villain:"v_mid_s8", exam:3 }),
      evidence:"ev_ch8b_kazan", next:"c8_ep6_ev2" },
    { id:"c8_ep6_ev2", type:"dialogue", speaker:"kazan", location:CHO, expression:"shock",
      text:"……判が、解かれた。幾年も、この判で縁を畳んできた。全体を破綻させるくらいならと。……私が怖れたものに、私自身がなっていたのか。", next:"c8_ep6_reason" },
    { id:"c8_ep6_reason", type:"reasoning", speaker:"hero", location:CHO, bgmScene:"emotion",
      text:"社労士法、企業年金、国保・介護・高齢者医療。――判で畳んだ根拠は、そのどれもがつなぎ直せた。破綻を怖れて畳んだ縁も、この筋は一人ずつ抱えられる。",
      reasoning:{ need:["ev_ch8b_kaigo","ev_ch8b_kazan"] },
      flags:{ c8_ep6_reasoned:1 }, next:"c8_ep6_biz" },

    /* 【調停官側の事情】断定せず、問いを残す */
    { id:"c8_ep6_biz", type:"dialogue", speaker:"kazan", location:CHO,
      text:"……最後に問わせろ。私が畳まねば、窓口が溢れて潰れる制度もあった。全部をつなぐことと、百万人の窓口を回すこと。両方立てられるのか?", next:"c8_ep6_hero2" },
    { id:"c8_ep6_hero2", type:"dialogue", speaker:"hero", location:CHO,
      text:"（両方を立てる。平均で全体を設計するのは正しい。だから、つなぐべき一人まで畳まなくていい。……あなた自身も、つながれるべきだった。）",
      next:"c8_ep6_bond", ideologyChanges:{ fair:1, mgmt:1 }, flags:{ c8_ep6_saw_sides:1 } },
    { id:"c8_ep6_bond", type:"dialogue", speaker:"arisa", location:CHO, bgmScene:"emotion", expression:"shock",
      text:"……調律師さん。私は平均を読み解く腕だけを値打ちにしてきた。……でもあなたは、私が丸めかけた一人も、カザンが畳んだ恐れも、両方拾おうとした。",
      next:"c8_ep6_end", relationshipChanges:{ cp8:1 }, flags:{ c8_ep6_bonded:1 } },
    { id:"c8_ep6_end", type:"dialogue", speaker:"narrator", location:CHO, bgmScene:"field",
      text:"『例外』の判が解かれ、畳まれかけた給付が一つまた一つと縁から色を取り戻した。だが法典広間の最奥では、統計老師が影を人の形に立ち上げていた。",
      next:"c8_ep6_hook", flags:{ c8_ep6_done:1 }, questUpdate:{ qid:"q_ch08b", state:"active", step:6 } },
    { id:"c8_ep6_hook", type:"dialogue", speaker:"arisa", location:CHO, expression:"angry",
      text:"……あれが大元です。『百万件の平均』と『全体最適』が、天秤のまま統計そのものの形になっている。明日、法典広間の最奥で決着です。", next:"c8_ep7_open" },

    /* ============================================================
       第7話「決戦前夜」
       仲間との会話で覚悟。戦う意味の総括(戦闘なし)。師匠ゼンの影を1本繋ぐ。
       ============================================================ */
    { id:"c8_ep7_open", type:"dialogue", speaker:"narrator", location:YADO, bgmScene:"town",
      text:"宵の宿。灯りを囲み、一行は温かい湯を分け合った。明日、この国の平均そのものと戦う。最後の法典のかけらを賭けた、静かな夜だった。",
      next:"c8_ep7_arisa1", flags:{ c8_ep7_start:1 } },
    { id:"c8_ep7_arisa1", type:"dialogue", speaker:"arisa", location:YADO, portrait:"mina",
      text:"私は平均を読み解く腕だけで自分を許してきた。……でも今は分かる。平均の外へ落とされた一人と、破綻を怖れて畳んだ一人を、両方拾い直さなきゃならない。", next:"c8_ep7_kai1" },
    { id:"c8_ep7_kai1", type:"dialogue", speaker:"kai", location:YADO, portrait:"kai", expression:"angry",
      text:"悪いのは一人の悪人じゃねえ。『平均』『全体最適』を、みんなが外れ値も見ずに口にしてた。……カザンも、破綻を怖れて畳んだ側だった。地続きなんだよな。", next:"c8_ep7_mina1" },
    { id:"c8_ep7_mina1", type:"dialogue", speaker:"mina", location:YADO, portrait:"mina",
      text:"平均は全体の傾きを正しく映します。その一本の線だけで裁けば、最低賃金を割った者も、企業年金を畳まれた者も、縁に立つ者もこぼれる。……明日突きつけるのは、その一点です。", next:"c8_ep7_hero1" },
    { id:"c8_ep7_hero1", type:"dialogue", speaker:"hero", location:YADO,
      text:"経営者も行政も悪じゃない。原資には限りがある。平均で回したい者も、破綻を怖れる制度もある。……その全部を抱えて、こぼれる一人を縁でつなぎ直す。", next:"c8_ep7_choice" },

    { id:"c8_ep7_choice", type:"choice", speaker:"hero", location:YADO, text:"覚悟を、言葉にする。",
      choices:[
        { text:"「平均で全体を回す」を「平均で設計しつつ縁の一人を支える」に変える。その第一歩として戦う",
          ideologyChanges:{ fair:1, mgmt:1 }, flags:{ c8_ep7_vow_bridge:1 }, next:"c8_ep7_vow" },
        { text:"平均の外へ落とされ、『例外』と畳まれた一人ひとりを、制度の縁につなぎ直すために戦う",
          ideologyChanges:{ human:1, relief:1 }, flags:{ c8_ep7_vow_count:1 }, next:"c8_ep7_vow" }
      ]},
    { id:"c8_ep7_vow", type:"dialogue", speaker:"hero", location:YADO, bgmScene:"emotion",
      text:"統計を倒しに行くんじゃない。『百万件の平均』を、『全体を設計しつつ一件を縁で支える物差し』に書き換えに行く。誰の顔も誤差にしない線を――明日、法典広間で。", next:"c8_ep7_zen" },
    { id:"c8_ep7_zen", type:"dialogue", speaker:"narrator", location:YADO, bgmScene:"emotion",
      text:"アリサが持ち出した古い白書の束。一番下から紙片が滑り落ちた。『平均で全体を設計せよ。だが、平均の外へ落ちた一件を、誤差と呼ぶな』――師匠ゼンの筆跡。",
      next:"c8_ep7_end", flags:{ c8_zen_ash8b:1 } },
    { id:"c8_ep7_end", type:"dialogue", speaker:"hero", location:YADO, bgmScene:"field",
      text:"（師匠。この都市でも線を引き直そうとして、一件と百万件の重さを背負いきれずに去ったんですね。……その宿題を、おれたちが引き受けます。明日、最奥で。）",
      next:"c8_ep7_hook", flags:{ c8_ep7_done:1 }, questUpdate:{ qid:"q_ch08b", state:"active", step:7 } },
    { id:"c8_ep7_hook", type:"dialogue", speaker:"narrator", location:YADO,
      text:"夜が明けた。一行は薄暗い統計局の街を抜け、法典広間の最奥へと歩を進めた。『百万件の平均』の物差しが、いっそう重く満ちていた。", next:"c8_ep8_open" },

    /* ============================================================
       第8話「決戦」— 章ボス【統計老師 v_boss_s8】戦
       【章末問題集】=これまでの労一・社一の過去問を集めた高難度セット(examFmt中心・タイト)。
       登場アニメ+『敵が問題を突きつける』枠組みは story-encounter が villain から自動生成する。
       撃破後は断定的勝利にせず「間を取り持つ/法典のかけらを取り戻す」テーマへ橋渡し(introの九つのかけら)。
       ============================================================ */
    { id:"c8_ep8_open", type:"dialogue", speaker:"narrator", location:DAIN, bgmScene:"emotion",
      text:"法典広間の最奥。『百万件の平均』の物差しが、ゆっくりと人の形に立ち上がった。一件の悲劇を平均に均し、こぼれた一人を誤差として脇へ置き続ける、その秩序そのもの。",
      next:"c8_ep8_appear", flags:{ c8_ep8_start:1 } },
    { id:"c8_ep8_appear", type:"dialogue", speaker:"narrator", location:DAIN,
      text:"老師が分布図を広げると、畳まれた者たちが誤差の帯から浮かび上がった。最低賃金を割られた者、企業年金を畳まれた者、国保・介護・高齢者医療の縁に立つ者。", next:"c8_ep8_toukei1" },
    { id:"c8_ep8_toukei1", type:"dialogue", speaker:"toukei", location:DAIN, portrait:"e_roukisai", expression:"angry",
      text:"よく来た、調律師。問おう。一件の悲劇か。痛ましいな。……だが百万件の平均の前では、それは例外だ。平均を取るか、一人を取るか――答えてみせよ。", next:"c8_ep8_hero1" },
    { id:"c8_ep8_hero1", type:"dialogue", speaker:"hero", location:DAIN,
      text:"どちらも取る。カイも、ミナも、アリサもいる。割られた者も、畳まれた者も顔を上げた。……その物差しを、今日、労一・社一の全体像で引き受ける。一人を、誤差にしないために。", next:"c8_ep8_arisa1" },
    { id:"c8_ep8_arisa1", type:"dialogue", speaker:"arisa", location:DAIN, portrait:"mina", expression:"angry",
      text:"御託はいい。積み上げた過去問の全部を、ここでぶつける。……私が丸めかけた一人も、カザンが畳んだ恐れも、今日で終いにする。", next:"c8_ep8_brief" },
    { id:"c8_ep8_brief", type:"dialogue", speaker:"narrator", location:DAIN, bgmScene:"emotion",
      text:"これは総決算。労働契約法・労働組合法・労働施策総合推進法・最低賃金法・白書、社労士法・企業年金・国保・介護・高齢者医療――そのすべてが【章末問題集】として襲いかかる。",
      next:"c8_ep8_enc1", questUpdate:{ qid:"q_ch08b", state:"active", step:8 } },
    { id:"c8_ep8_enc1", type:"encounter", speaker:"hero", location:DAIN, bgmScene:"emotion",
      text:"第一幕・労一編。労働契約法の不利益変更、労働組合法の団結と不当労働行為、パワハラ防止、最低賃金法の下限、労働経済・白書・労務管理を、高密度で叩き込む。",
      encounter: enc(8, "章末問題集｜労働契約・労働組合・パワハラ・最賃・白書編(高難度)", { villain:"v_boss_s8", n:12, exam:5 }),
      evidence:"ev_ch8b_boss1", next:"c8_ep8_mid" },
    { id:"c8_ep8_mid", type:"dialogue", speaker:"toukei", location:DAIN, expression:"shock",
      text:"……労働の一般常識は越えたか。だが社会保障の縁はそれだけではない。社労士法、企業年金、国保、介護、高齢者医療、沿革と統計――制度はどこまでも広く、細かい。", next:"c8_ep8_enc2" },
    { id:"c8_ep8_enc2", type:"encounter", speaker:"hero", location:DAIN, bgmScene:"emotion",
      text:"第二幕・社一編。社会保険労務士法の業務と義務、確定給付/確定拠出年金、国民健康保険法、介護保険法、高齢者医療確保法、社会保険の沿革を、同じ高密度で最後まで。",
      encounter: enc(8, "章末問題集｜社労士法・企業年金・国保・介護・高医・社会保険史編(高難度)", { villain:"v_boss_s8", n:12, exam:5 }),
      evidence:"ev_ch8b_boss2", next:"c8_ep8_broke" },
    { id:"c8_ep8_broke", type:"dialogue", speaker:"narrator", location:DAIN, bgmScene:"emotion",
      text:"最後の一問が置かれた瞬間、巨大な分布図が初めて平均の線を止めた。誤差の帯に沈んでいた者たちが名を呼ばれ、制度の縁へ色を取り戻していく。", next:"c8_ep8_reason" },
    { id:"c8_ep8_reason", type:"reasoning", speaker:"hero", location:DAIN, bgmScene:"emotion",
      text:"労働契約・労働組合・パワハラ防止・最低賃金・労働経済、社労士法・企業年金・国保・介護・高齢者医療。――『例外』と畳まれた一件を、縁で支え直すための条文だった。",
      reasoning:{ need:["ev_ch8b_boss1","ev_ch8b_boss2"] },
      flags:{ c8_ep8_reasoned:1 }, next:"c8_ep8_toukei2" },

    /* 断定的勝利にしない。老師/仲間の独白で「間を取り持つ/法典のかけらを取り戻す」テーマへ橋渡し。 */
    { id:"c8_ep8_toukei2", type:"dialogue", speaker:"toukei", location:DAIN, expression:"shock",
      text:"……私は間違っていたのか。だが問おう。一件ずつ縁を支え続ければ、百万件を回す原資が尽きる。尽きれば、平均の内側で待つ者から先に支えが消える。", next:"c8_ep8_arisa2" },
    { id:"c8_ep8_arisa2", type:"dialogue", speaker:"arisa", location:DAIN, portrait:"mina",
      text:"……老師。私はもう、あなたの『百万件の平均』にも、外れ値を丸めかけた昔の自分にも縋らない。だが問いは捨てられない。私が、その間に立つ。統計を、一人のために。", next:"c8_ep8_zen" },
    { id:"c8_ep8_zen", type:"dialogue", speaker:"hero", location:DAIN, bgmScene:"emotion",
      text:"（師匠。あなたが背負いきれなかった問いが、ここにもあった。……労一・社一の法典のかけらが一つ、手のひらに戻ってきた。九つのうちの、最後の一つだ。）",
      next:"c8_ep8_hero_final", flags:{ c8_shard8:1 } },
    { id:"c8_ep8_hero_final", type:"dialogue", speaker:"hero", location:DAIN,
      text:"統計老師。あなたを裁きには来ていない。問いに答え続けに来た。……平均の外の一人を切り捨てるためじゃなく、こぼれた一件の名を呼んで縁へつなぎ直すためにある。", next:"c8_ep8_final" },
    { id:"c8_ep8_final", type:"dialogue", speaker:"narrator", location:DAIN, bgmScene:"field",
      text:"アルケで、『百万件の平均』が初めて『こぼれる一件の悲劇』とともに結び直された。九つのかけらが、ついに一つに集い始める。旅は、終章へと続いていく。",
      next:null, flags:{ c8_ep8_done:1, c8_boss_cleared:1, c8_ch08b_done:1 },
      questUpdate:{ qid:"q_ch08b", state:"done", step:9 } }
  ];

  /* 第4〜8話クエスト定義(doneFlag で完了判定)。q_ch08(前半)は無改変の別クエスト。 */
  if(typeof S.registerQuest==="function"){
    S.registerQuest("q_ch08b", {
      title:"一件の悲劇と、百万件の平均の間・決着",
      chapter:"ch08b",
      steps:["平均の外の一人","畳まれた窓口","例外処理の算術","決戦前夜","決戦"],
      doneFlag:"c8_ch08b_done"
    });
  }

  S.register("ch08b", NODES);
  S.CH08B_ID = "ch08b";

  /* メイン章の背骨(S.MAIN)へ、ch08(前半)の続きとして追記する。
     ・c8_ch08_done 後、ホームの「今日の冒険」が自動で本話へ進む導線になる。
     ・S.MAIN 未ロード/未定義でも安全(存在する時だけ push、重複登録も防ぐ)。 */
  if(Array.isArray(S.MAIN)){
    var exists = false;
    for(var i=0;i<S.MAIN.length;i++){ if(S.MAIN[i] && S.MAIN[i].id==="ch08b"){ exists = true; break; } }
    if(!exists){
      S.MAIN.push({ id:"ch08b", no:"第八章", title:"一件の悲劇と、百万件の平均の間・決着", loc:"行政都市アルケ・法典広間の最奥",
        doneFlag:"c8_ch08b_done", startedFlag:"c8_ep4_start" });
    }
  }
})();
