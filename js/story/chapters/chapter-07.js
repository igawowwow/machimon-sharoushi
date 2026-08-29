"use strict";
/* ============================================================
   story/chapters/chapter-07.js — 第七章「積み上げた報酬の果てに」第1〜3話(前半)
   docs/story-bible.md / ENDING-CANON 準拠。舞台=累層の帝都エオン／
   科目=厚生年金保険法(subject 7)。テーマ=積み上げた報酬が老後を決める。
   働き続ける者と、支えを削られる者の間に横たわる格差。
   事件モチーフ=報酬比例部分・経過的加算・加給年金/振替加算・在職老齢年金・
   繰上げ/繰下げ・障害厚生年金・遺族厚生年金/中高齢寡婦加算・標準報酬月額/標準賞与額・
   離婚分割(合意分割/3号分割)。
   ・第1話「報酬の大街」…累層の帝都エオン 導入。標準報酬を削られ、在職老齢年金を全額止まると
                    偽られて働く意欲ごと折られた者との出会い。新仲間レオン初登場(元・帝都の年金官吏。
                    報酬比例・在職老齢・繰上げ繰下げ・離婚分割に精通。格差の底に落ちた者を見て、
                    制度の内側から変えようとする)。○×演習(厚年 s7)→過去問(examFmt)。
                    小ボス=在職封じのドレイク。カイ/ミナが「なぜ戦うか」を明示。
   ・第2話「分けられなかった記録」…レオンの過去(自らの家の報酬記録を、繰上げの減額も離婚分割も
                    伏せられたまま痩せさせ、身内の老後を薄くした側)を掘り下げ加入。繰上げ繰下げ・
                    離婚分割の論点。過去問(五肢択一・個数)混入。小ボス=繰上げ惑わしのカサ。
   ・第3話「報酬どおりの秤」…テーマの歪みそのものと対峙する引き。制度/行政/経営側の事情ビート
                    (有限の原資・報酬比例という公正・誰が積み上げと支えの線を引くか)を断定せず提示。
                    師匠ゼンの影を1本繋ぐ。章ボス【コウネン皇帝 v_boss_s7】への引き。
   ・chapter-01*.js〜chapter-06*.js のノード/quest/ID/証拠/分岐は一切改変しない(別ファイル・別章 "ch07")。
   ・戦闘接続は既存の橋(story-encounter / story-battle-bridge)。encounter に villain と
     exam(examFmt 混入数)を持たせるだけ。採点・SRS・報酬・問題データには一切触れない。
   ・eval/new Function ゼロ。全ノードはデータのみ(next は文字列 or {then,else} or null)。全出力は自前 esc2 経由。
   ・立てるフラグ: c7_ep1_done〜c7_ep3_done / c7_leon_join / c7_boss_next / c7_ch07_done / c7_zen_ash7。
     章前半の完了フラグは c7_ch07_done(章ボス撃破は後続の章で確定。ここは前半までを確定)。
   ・注: 仲間レオンの好感度キーは cp7(story-cast が leon.rel=cp7 と定義済)。data-companions.js の
     cp7(厚年の重鎮・大黒)とは別レイヤー(物語の関係値 getRel/setRel はパーティ・パッシブと独立。
     第六章 noa.rel=cp6 と data-companions cp6=年金仙人・玄斎 が別レイヤーで両立するのと同じ規則)。
     レオンの既定 px(king)は輪郭線バストでないため、SPEAKERS と CAST の双方で必ず foreman に上書きし、
     CAST の役割/背景も docs/story-bible.md 第七章の正典(元・帝都の年金官吏)へ整合する(理由は issues に明記)。
   ============================================================ */
(function(){
  var G = (typeof window!=="undefined") ? window : globalThis;
  var S = G.SRStory;
  if(!S || typeof S.register!=="function") return;   /* エンジン未ロードでも安全 */

  /* 第七章の話者を表示名テーブルへ追記(描画層があれば)。新仲間レオン(px=foreman=輪郭線付きバスト)。
     既存キー(narrator/hero/kai/mina 等)は無改変。leon は既定 px=king が輪郭線バストでないため、
     本章の正典 px=foreman に必ず上書きする(if ガードなし=上書き徹底)。 */
  if(S.SPEAKERS && typeof S.SPEAKERS==="object"){
    S.SPEAKERS.leon = { name:"レオン", px:"foreman" };                 /* 既定 king を foreman に上書き */
    if(!S.SPEAKERS.hisha7)  S.SPEAKERS.hisha7  = { name:"格差の底に沈んだ人", px:"ghost" };
    if(!S.SPEAKERS.teikan)  S.SPEAKERS.teikan  = { name:"帝都年金局の官吏 セイラ", px:"e_graus" };
    if(!S.SPEAKERS.drake)   S.SPEAKERS.drake   = { name:"在職封じのドレイク", px:"e_sabizan" };
    if(!S.SPEAKERS.kasa)    S.SPEAKERS.kasa    = { name:"繰上げ惑わしのカサ", px:"e_nabakari" };
    if(!S.SPEAKERS.kounen)  S.SPEAKERS.kounen  = { name:"コウネン皇帝", px:"e_roukisai" };
  }
  /* CAST の leon 既定(px:king・王子canン)を、docs/story-bible.md 第七章の正典へ整合する。
     px は必ず foreman(輪郭線バスト)。役割/背景も帝都エオンの元・年金官吏へ揃える。
     CAST_BY_ID.leon は CAST 配列と同一オブジェクト参照のため、これで人物録の表示も揃う。 */
  if(S.CAST_BY_ID && S.CAST_BY_ID.leon){
    var _leon = S.CAST_BY_ID.leon;
    _leon.px = "foreman";
    _leon.role = "元・帝都の年金官吏(厚年)";
    _leon.bio = "累層の帝都エオンで、報酬比例部分・在職老齢年金・繰上げ繰下げ・離婚分割の記録を扱ってきた元・年金官吏。積み上げた報酬が老後の厚みを決める秩序の内側にいて、格差の底に落ちた者を数えきれぬほど見送った。かつて自らの家の報酬記録も、減額も分割も知らぬまま痩せさせ、身内の老後を薄くした悔いを抱える。だから制度の外から壊すのではなく、内側から線を引き直そうとしている。";
    _leon.why = "累層の帝都エオンで主人公と出会い加入する仲間。『報酬どおり』という公正と、その公正がこぼす一人の格差の間に立ち、積み上げを報いることと、削られた老後を底で支えることの両立を、条文の内側から探し続ける側へ回る人物。";
  }

  var TAIRO = "累層の帝都エオン・報酬の大街";
  var MADO  = "累層の帝都エオン・年金台帳の街角";
  var KIROKU= "累層の帝都エオン・積み上げの記録街";
  var DAIN  = "累層の帝都エオン・厚年法典の広間";

  /* 演習 encounter。opts で相手(villain)と過去問混入数(exam=examFmt の本数)・出題数(n)を指定。
     kind:"train" のまま既存の橋(start*)へ委譲する。採点系は一切新設しない。subject=7。 */
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
       第1話「報酬の大街」
       累層の帝都エオン 導入。標準報酬を削られ、在職老齢年金を偽られた者。新仲間レオン初登場。
       ○×演習(厚年 s7)→過去問(examFmt)。小ボス=在職封じのドレイク。カイ/ミナが「なぜ戦うか」を明示。
       ============================================================ */
    { id:"c7_ep1_open", start:true, type:"dialogue", speaker:"narrator", location:TAIRO, bgmScene:"emotion",
      text:"累層の帝都エオン。長く多く働いた者の家は高い層に厚く積み上がり、報酬の薄かった者の家は下層へ沈む。一本の秤が、静かに人を上下へ振り分けていた。",
      next:"c7_ep1_intro", flags:{ c7_ep1_start:1 },
      questUpdate:{ qid:"q_ch07", state:"active", step:0 } },
    { id:"c7_ep1_intro", type:"dialogue", speaker:"narrator", location:TAIRO,
      text:"厚生年金は、納めた報酬に比例して老後を積み上げる約束だ。だが標準報酬を一段削られ、在職老齢年金を『働けば全部止まる』と偽られれば、積み上げも意欲も折れる。", next:"c7_ep1_victim" },
    { id:"c7_ep1_victim", type:"dialogue", speaker:"hisha7", location:TAIRO, portrait:"ghost", expression:"shock",
      text:"四十年、この手で働いてきた。……なのに、届いた年金は思っていた半分もない。おまけに『働き続けるなら全額止まる』と言われて、仕事も辞めた。", next:"c7_ep1_leon1" },
    { id:"c7_ep1_leon1", type:"dialogue", speaker:"leon", location:TAIRO, portrait:"foreman", expression:"shock",
      text:"……待ってくれ。まず、辞める必要はなかった。在職老齢年金は、報酬と年金の合計が一定を超えたとき、報酬比例部分の一部が止まるだけだ。基礎年金は止まらない。", next:"c7_ep1_leon2" },
    { id:"c7_ep1_leon2", type:"dialogue", speaker:"leon", location:TAIRO,
      text:"私はレオン。元は、この帝都で年金の記録を扱っていた官吏だ。……数えるほどに、積み上げの薄い者が下層へ沈むのを内側から見てきた。だから今、線を引き直しに来た。", next:"c7_ep1_kai1" },
    { id:"c7_ep1_kai1", type:"dialogue", speaker:"kai", location:TAIRO, portrait:"helm", expression:"angry",
      text:"四十年働いた人間の標準報酬をこっそり削って、嘘をついて仕事まで奪った。……その積み上げを、取り戻しに行く。", next:"c7_ep1_mina1" },
    { id:"c7_ep1_mina1", type:"dialogue", speaker:"mina", location:TAIRO, portrait:"wiz",
      text:"老齢厚生年金は、報酬比例部分を軸に経過的加算や加給年金が積み上がります。在職老齢年金は総報酬月額相当額と基本月額で停止額が決まり、基礎年金は対象外です。", next:"c7_ep1_choice" },

    { id:"c7_ep1_choice", type:"choice", speaker:"hero", location:TAIRO, text:"この人に、どう向き合う?",
      choices:[
        { text:"標準報酬と在職老齢年金の筋を、制度で正しく積み直す",
          ideologyChanges:{ law:1, mgmt:1 }, flags:{ c7_ep1_path_law:1 }, next:"c7_ep1_probe" },
        { text:"まず、四十年の積み上げを削られた無念を受け止める",
          ideologyChanges:{ human:1, relief:1 }, flags:{ c7_ep1_path_human:1 }, next:"c7_ep1_alt" }
      ]},
    { id:"c7_ep1_alt", type:"dialogue", speaker:"hero", location:TAIRO,
      text:"諦めたくもなる。四十年の積み上げを勝手に削られていた。……その上で。標準報酬は記録をたどれば戻せる。止まるのは報酬比例の一部だけです。", next:"c7_ep1_probe" },

    { id:"c7_ep1_probe", type:"dialogue", speaker:"narrator", location:MADO, bgmScene:"field",
      text:"標準報酬の等級を低く付け替え、『働けば全額停止』と刷り込む者がいた。削り、偽れば、積み上げも働く意欲も痩せる。",
      next:"c7_ep1_enc1", questUpdate:{ qid:"q_ch07", state:"active", step:1 } },
    { id:"c7_ep1_enc1", type:"encounter", speaker:"hero", location:MADO, bgmScene:"emotion",
      text:"報酬削りのレドが、付け替えた標準報酬の台帳を抱えて現れた。標準報酬月額・標準賞与額と報酬比例部分、経過的加算を、本試験の問いで確かめる。",
      encounter: enc(7, "過去問｜標準報酬月額・標準賞与額・報酬比例部分を問う", { villain:"v_mob_s7", exam:2 }),
      evidence:"ev_ch7_hoshu", next:"c7_ep1_ev1" },
    { id:"c7_ep1_ev1", type:"dialogue", speaker:"leon", location:MADO,
      text:"標準報酬は勝手に痩せさせていいものじゃない。報酬に応じて等級が決まり、報酬比例部分の土台になる。……あとは、『全額止まる』と偽った張本人だ。", next:"c7_ep1_drake1" },
    { id:"c7_ep1_drake1", type:"dialogue", speaker:"drake", location:MADO, portrait:"e_sabizan", expression:"angry",
      text:"――働きながら年金を受け取ろうなど、虫がよすぎる。働くなら止まる。全額だ。……止まると言い切って静かに退いてもらうのが、金庫を守るやり方さ。", next:"c7_ep1_probe2" },
    { id:"c7_ep1_probe2", type:"dialogue", speaker:"narrator", location:MADO, bgmScene:"field",
      text:"在職封じのドレイク。報酬比例の一部停止を『全額停止』と偽り、加給年金や経過的加算まで消えると脅す。停止額の算定を立て直す。",
      next:"c7_ep1_enc2" },
    { id:"c7_ep1_enc2", type:"encounter", speaker:"hero", location:MADO, bgmScene:"emotion",
      text:"在職封じのドレイクが偽りの停止通知を盾に立ちはだかった。在職老齢年金の支給停止、基本月額と総報酬月額相当額、各加算の扱いを、高密度に崩す。",
      encounter: enc(7, "過去問｜在職老齢年金・支給停止・加給年金(小ボス)", { villain:"v_lt_s7a", exam:3 }),
      evidence:"ev_ch7_zaishoku", next:"c7_ep1_ev2" },
    { id:"c7_ep1_ev2", type:"dialogue", speaker:"mina", location:MADO,
      text:"偽りの停止、証拠に残せました。合計が支給停止調整額を超えた分の半分が、報酬比例部分から止まるだけ。基礎年金は止まりません。……脅しでした。", next:"c7_ep1_reason" },
    { id:"c7_ep1_reason", type:"reasoning", speaker:"hero", location:MADO, bgmScene:"emotion",
      text:"標準報酬、報酬比例部分、経過的加算、在職老齢年金の停止。――積み上げた報酬を老後の厚みへ換える条文だ。削り、偽ることが、老後を痩せさせる細工だ。",
      reasoning:{ need:["ev_ch7_hoshu","ev_ch7_zaishoku"] },
      flags:{ c7_ep1_reasoned:1 }, next:"c7_ep1_biz" },

    /* 【制度側の事情】断定せず提示 */
    { id:"c7_ep1_biz", type:"dialogue", speaker:"teikan", location:MADO,
      text:"……標準報酬を正すのは正しい。だが厚生年金は、今日の現役の報酬で今の高齢者を賄っている。働く高齢者にも満額を配れば、現役の肩に負担が乗る。", next:"c7_ep1_hero2" },
    { id:"c7_ep1_hero2", type:"dialogue", speaker:"hero", location:MADO,
      text:"（原資が世代で回っているのは本当だ。……でも、削って偽るのは線引きじゃない。ただの切り捨てだ。どちらかを捨てる話にはしたくない。）",
      next:"c7_ep1_end", ideologyChanges:{ fair:1, mgmt:1 }, flags:{ c7_ep1_saw_sides:1 } },
    { id:"c7_ep1_end", type:"dialogue", speaker:"narrator", location:TAIRO, bgmScene:"field",
      text:"人は戻された記録を握りしめ、翌日にはまた仕事へ向かった。レオンはその手に、働きながら受け取れる額を、慣れた筆致で書き添えてやった。",
      next:"c7_ep1_hook", flags:{ c7_ep1_done:1 }, questUpdate:{ qid:"q_ch07", state:"active", step:2 } },
    { id:"c7_ep1_hook", type:"dialogue", speaker:"leon", location:TAIRO,
      text:"……なあ調律師さん。本気でこの帝都の秤を引き直す気か? だったら、私の話も聞いてほしい。いちばん近くの記録を、痩せるに任せてしまった話を。", next:"c7_ep2_open" },

    /* ============================================================
       第2話「分けられなかった記録」
       レオンの過去を掘り下げ加入。繰上げ繰下げ・離婚分割の論点。
       過去問(五肢択一・個数)混入。小ボス=繰上げ惑わしのカサ。
       ============================================================ */
    { id:"c7_ep2_open", type:"dialogue", speaker:"narrator", location:KIROKU, bgmScene:"emotion",
      text:"積み上げの記録街。レオンは色あせた年金記録を開いた。別れた伴侶のものだった。婚姻期間の報酬記録は分けられぬまま、繰上げの減額印だけが赤く押されていた。",
      next:"c7_ep2_leon1", flags:{ c7_ep2_start:1 } },
    { id:"c7_ep2_leon1", type:"dialogue", speaker:"leon", location:KIROKU, portrait:"foreman", expression:"shock",
      text:"この一枚は、別れた家のものだ。暮らしに追われて繰上げを選ばせた。減額が一生続くとは伝えなかった。……離婚のとき記録を分ける制度も、私は告げなかった。", next:"c7_ep2_leon2" },
    { id:"c7_ep2_leon2", type:"dialogue", speaker:"leon", location:KIROKU,
      text:"だから受け取り方を全部覚え直した。繰上げの減額率、繰下げの増額率、合意分割、3号分割。……もう二度と、近くの老後を無知のまま薄くしないために。", next:"c7_ep2_mina1" },
    { id:"c7_ep2_mina1", type:"dialogue", speaker:"mina", location:KIROKU, portrait:"wiz",
      text:"……レオン。あなたの悔いは、制度の複雑さそのものです。繰上げは一月ごとに減額され生涯続く。合意分割は上限二分の一、3号分割は請求で相手方の記録の半分を分けます。", next:"c7_ep2_join" },
    { id:"c7_ep2_join", type:"dialogue", speaker:"leon", location:KIROKU, bgmScene:"emotion", expression:"angry",
      text:"……そうだ。知らないままの減額は一生ついて回る。それでも目の前の一人は諦めさせたくない。条件は一つ――間に合わなかった一人の老後を、忘れないこと。",
      next:"c7_ep2_kai1", relationshipChanges:{ cp7:1 }, flags:{ c7_leon_join:1 } },
    { id:"c7_ep2_kai1", type:"dialogue", speaker:"kai", location:KIROKU,
      text:"上等だ。間に合わなかった一人を忘れるやつは、おれが一番嫌いなんでな。レオン、遠慮なく使わせてもらう。", next:"c7_ep2_choice" },

    { id:"c7_ep2_choice", type:"choice", speaker:"hero", location:KIROKU, text:"レオンの知識を、どう使う?",
      choices:[
        { text:"繰上げ繰下げと離婚分割を、制度で一件ずつ選び直して回る",
          ideologyChanges:{ law:1, mgmt:1 }, flags:{ c7_ep2_path_law:1 }, next:"c7_ep2_probe" },
        { text:"減額を押し付けられ、記録を分けられず諦めた側の声を、先に集める",
          ideologyChanges:{ human:1, relief:1 }, flags:{ c7_ep2_path_human:1 }, next:"c7_ep2_alt" }
      ]},
    { id:"c7_ep2_alt", type:"dialogue", speaker:"hero", location:KIROKU,
      text:"率の計算の前に、一人がいる。急かされて繰上げを選ばされた者、分割を知らされなかった者。……レオン、あなたの別れた家の一枚から始めさせてください。", next:"c7_ep2_probe" },

    { id:"c7_ep2_probe", type:"dialogue", speaker:"narrator", location:KIROKU, bgmScene:"field",
      text:"繰上げの減額を伏せ、繰下げの増額も離婚分割も『無かったこと』にする者がいた。選び違えれば、増やせたはずの年金がそのまま薄い老後になる。",
      next:"c7_ep2_enc1", questUpdate:{ qid:"q_ch07", state:"active", step:3 } },
    { id:"c7_ep2_enc1", type:"encounter", speaker:"hero", location:KIROKU, bgmScene:"emotion",
      text:"報酬削りのレドが、繰上げと繰下げの帳簿を霧の中で混ぜにきた。繰上げの減額・繰下げの増額・支給開始年齢を、本試験の問いで数え直す。",
      encounter: enc(7, "過去問｜繰上げ・繰下げ受給・支給開始を問う", { villain:"v_mob_s7", exam:2 }),
      evidence:"ev_ch7_kuriage", next:"c7_ep2_ev1" },
    { id:"c7_ep2_ev1", type:"dialogue", speaker:"leon", location:KIROKU,
      text:"繰上げは一月ごとに減り、その減額は生涯続く。繰下げは一月ごとに増える。どちらを選ぶかは本人が決めるべきことだ。……次は、記録を分けさせない査定人だ。", next:"c7_ep2_kasa1" },
    { id:"c7_ep2_kasa1", type:"dialogue", speaker:"kasa", location:KIROKU, portrait:"e_nabakari", expression:"angry",
      text:"早く受け取れば得だろう? 減額が生涯続く? ……はて、そんな細かい話は聞かなんだかな。離婚分割? そんな抜け道があったかな。", next:"c7_ep2_probe2" },
    { id:"c7_ep2_probe2", type:"dialogue", speaker:"narrator", location:MADO, bgmScene:"field",
      text:"繰上げ惑わしのカサ。減額を伏せ、増額も離婚分割も『無かったこと』にして諦めさせる。減額率・増額率と分割の筋を立て直す。",
      next:"c7_ep2_enc2" },
    { id:"c7_ep2_enc2", type:"encounter", speaker:"hero", location:MADO, bgmScene:"emotion",
      text:"繰上げ惑わしのカサが、伏せた分割請求書を盾に立ちはだかった。繰上げ繰下げの減額と増額、離婚時の年金分割を、高密度に崩す。レオンの一枚の記録だ。",
      encounter: enc(7, "過去問｜繰上げ繰下げ・離婚分割(合意・3号)(小ボス)", { villain:"v_lt_s7b", exam:3 }),
      evidence:"ev_ch7_bunkatsu", next:"c7_ep2_ev2" },
    { id:"c7_ep2_ev2", type:"dialogue", speaker:"mina", location:MADO,
      text:"分割の筋、通しました。合意分割は当事者の合意や裁判所の決定で上限二分の一。3号分割は請求で相手方の記録の二分の一を、合意なしに分けられます。", next:"c7_ep2_reason" },
    { id:"c7_ep2_reason", type:"reasoning", speaker:"hero", location:MADO, bgmScene:"emotion",
      text:"繰上げの減額、繰下げの増額、合意分割、3号分割。――いつ・誰と分けて受け取るかを本人が選び直す条文だ。伏せれば、薄い老後へ落ちる。",
      reasoning:{ need:["ev_ch7_kuriage","ev_ch7_bunkatsu"] },
      flags:{ c7_ep2_reasoned:1 }, next:"c7_ep2_biz" },

    /* 【行政/制度側の事情】断定せず、次話の壁として残す */
    { id:"c7_ep2_biz", type:"dialogue", speaker:"teikan", location:MADO, expression:"shock",
      text:"……道を用意するのにも理由はある。選べる道が増えるほど、原資の見通しは揺れる。報酬に比例するという一本の秤があるから、多く納めた者も納め続けられる。", next:"c7_ep2_hero2" },
    { id:"c7_ep2_hero2", type:"dialogue", speaker:"hero", location:MADO,
      text:"（報酬比例という秤に信頼が乗っているのは本当だ。……でも、秤を守ることと、受け取りの道を伏せることは別だ。選択を奪うのは、ただの切り捨てだ。）",
      next:"c7_ep2_end", ideologyChanges:{ fair:1, mgmt:1 }, flags:{ c7_ep2_saw_sides:1 } },
    { id:"c7_ep2_end", type:"dialogue", speaker:"narrator", location:KIROKU, bgmScene:"field",
      text:"レオンは別れた家の一枚を、そっと台帳の一番上に戻した。『次は、誰の記録も分け損なわない』――その横顔に、薄くした悔いがあった。",
      next:"c7_ep2_hook", flags:{ c7_ep2_done:1 }, questUpdate:{ qid:"q_ch07", state:"active", step:4 } },
    { id:"c7_ep2_hook", type:"dialogue", speaker:"leon", location:KIROKU, expression:"angry",
      text:"……だが調律師さん。小ボスを何人正しても格差は消えない。『報酬どおり』という一本の秤そのものが、帝都の中枢に立っている。次は、そいつだ。", next:"c7_ep3_open" },

    /* ============================================================
       第3話「報酬どおりの秤」
       テーマの歪みそのものと対峙する引き。制度/行政/経営側の事情ビートを断定せず提示。
       師匠ゼンの影を1本繋ぐ。章ボス【コウネン皇帝 v_boss_s7】への引き。
       ============================================================ */
    { id:"c7_ep3_open", type:"dialogue", speaker:"narrator", location:DAIN, bgmScene:"emotion",
      text:"帝都の中枢、法典の広間。天井まで届く巨大な秤。その両端で、厚く積み上げた者の列と、報酬を削られ薄く沈んだ者の列が、皮肉に向かい合っていた。",
      next:"c7_ep3_leon1", flags:{ c7_ep3_start:1 } },
    { id:"c7_ep3_leon1", type:"dialogue", speaker:"leon", location:DAIN, portrait:"foreman",
      text:"厚く積み上がった側は、長く働き多く納めた人たち。報酬比例は、それを正しく映している。……問題は向かいの列だ。積み上げが薄いというだけで、支えまで薄く裁かれる。", next:"c7_ep3_mina1" },
    { id:"c7_ep3_mina1", type:"dialogue", speaker:"mina", location:DAIN, portrait:"wiz",
      text:"障害厚生年金は障害を負ったときに。遺族厚生年金は遺した家族に、報酬比例の四分の三を。中高齢寡婦加算や加給年金・振替加算は、薄い側を底で支えます。", next:"c7_ep3_zen" },
    { id:"c7_ep3_zen", type:"dialogue", speaker:"narrator", location:DAIN, bgmScene:"emotion",
      text:"広間の古い厚年台帳。表紙の裏に掠れた字。『積み上げを報いよ。だが、積み上げの薄さで、支えまで薄くするな』――師匠ゼンの筆跡だった。",
      next:"c7_ep3_choice", flags:{ c7_zen_ash7:1 } },

    { id:"c7_ep3_choice", type:"choice", speaker:"hero", location:DAIN, text:"『報酬どおり』の秤に、どう立つ?",
      choices:[
        { text:"障害・遺族厚生年金と中高齢寡婦加算・振替加算まで、条文で正しく張り直す",
          ideologyChanges:{ law:1, fair:1 }, flags:{ c7_ep3_path_law:1 }, next:"c7_ep3_probe" },
        { text:"厚く積み上げた者、薄く沈んだ者、双方の理由をまず問う",
          ideologyChanges:{ human:1, mgmt:1 }, flags:{ c7_ep3_path_ask:1 }, next:"c7_ep3_alt" }
      ]},
    { id:"c7_ep3_alt", type:"dialogue", speaker:"hero", location:DAIN,
      text:"秤を責める前に、理由がある。長く働いた者の誇り。報酬の薄いまま老いた者の無念。……そこからしか、報いながら底を支える線は張り直せない。", next:"c7_ep3_probe" },

    { id:"c7_ep3_probe", type:"dialogue", speaker:"narrator", location:DAIN, bgmScene:"field",
      text:"『積み上げが薄い』を理由に、障害も遺族も加算も握り潰す手先が最後の抵抗に出た。その一枚を剥がす。",
      next:"c7_ep3_enc1", questUpdate:{ qid:"q_ch07", state:"active", step:5 } },
    { id:"c7_ep3_enc1", type:"encounter", speaker:"hero", location:DAIN, bgmScene:"emotion",
      text:"報酬削りのレドが再び現れた。障害厚生年金・遺族厚生年金・中高齢寡婦加算・加給年金と振替加算を、本試験の問いで崩す。底の支えを取り戻す。",
      encounter: enc(7, "過去問｜障害・遺族厚生年金・中高齢寡婦加算・加給年金を取り戻す", { villain:"v_mob_s7", exam:2 }),
      evidence:"ev_ch7_zentai", next:"c7_ep3_ev1" },
    { id:"c7_ep3_ev1", type:"dialogue", speaker:"leon", location:DAIN,
      text:"障害厚生年金は等級に応じて。遺族厚生年金は報酬比例の四分の三を。中高齢寡婦加算は一定の妻に、振替加算はその後に配偶者自身の基礎年金へ。……握り潰させはしない。", next:"c7_ep3_reason" },
    { id:"c7_ep3_reason", type:"reasoning", speaker:"hero", location:DAIN, bgmScene:"emotion",
      text:"標準報酬、報酬比例、在職老齢、繰上げ繰下げ、離婚分割、障害・遺族厚生年金、各加算。――積み上げを厚みへ換え、こぼれる一人を底で拾う条文だった。",
      reasoning:{ need:["ev_ch7_zentai"] },
      flags:{ c7_ep3_reasoned:1 }, next:"c7_ep3_biz" },

    /* 【制度/行政/経営側の事情】断定せず、章ボスへの問いとして残す */
    { id:"c7_ep3_biz", type:"dialogue", speaker:"teikan", location:DAIN, expression:"shock",
      text:"……分かった。だが私の背後に立つものは大きい。多く納めた者に報い、その信頼で原資を回そうとする者と、薄く沈む底を恐れる制度が、長く綱を引き合ってきた秤だ。", next:"c7_ep3_boss_hook" },
    { id:"c7_ep3_boss_hook", type:"dialogue", speaker:"kounen", location:DAIN, portrait:"e_roukisai", expression:"angry",
      text:"――納めたか? 積み上げたか? 多く働いた者が多く受け取る。当然の理だ。薄い者が薄く沈むのも、また理。……その秤に、お前たちで抗うか。",
      next:"c7_ep3_hero_final", flags:{ c7_boss_next:1 } },
    { id:"c7_ep3_hero_final", type:"dialogue", speaker:"hero", location:DAIN,
      text:"抗う。カイも、ミナも、レオンもいる。厚く積み上げた者も、薄く沈んだ者も顔を上げた。……その秤を、厚年の全体像で引き受けに行く。底を、支えるために。", next:"c7_ep3_end" },
    { id:"c7_ep3_end", type:"dialogue", speaker:"narrator", location:DAIN, bgmScene:"field",
      text:"エオンで、『報酬どおり』の秤が初めて『こぼれる一人の格差』とともに問い返された。だが帝都の中枢に立つ影――コウネン皇帝との対峙は、まだこれからだ。",
      next:null, flags:{ c7_ep3_done:1, c7_ch07_done:1 },
      questUpdate:{ qid:"q_ch07", state:"done", step:6 } }
  ];

  /* 第1〜3話(章前半)クエスト定義(doneFlag で完了判定)。第一〜六章の各クエストは無改変の別クエスト。 */
  if(typeof S.registerQuest==="function"){
    S.registerQuest("q_ch07", {
      title:"積み上げた報酬の果てに",
      chapter:"ch07",
      steps:["報酬の大街","分けられなかった記録","報酬どおりの秤"],
      doneFlag:"c7_ch07_done"
    });
  }

  S.register("ch07", NODES);
  S.CH07_ID = "ch07";

  /* メイン章の背骨(S.MAIN)へ、第六章(ch06b)の続きとして追記する。
     ・第六章クリア(c6_ch06b_done)後、ホームの「今日の冒険」が自動で本章へ進む導線になる。
     ・章選択画面は前章 done まで locked=第六章クリアが解放ゲートとして機能する(既存規則に沿う)。
     ・S.MAIN 未ロード/未定義でも安全(存在する時だけ push、重複登録も防ぐ)。 */
  if(Array.isArray(S.MAIN)){
    var exists = false;
    for(var i=0;i<S.MAIN.length;i++){ if(S.MAIN[i] && S.MAIN[i].id==="ch07"){ exists = true; break; } }
    if(!exists){
      S.MAIN.push({ id:"ch07", no:"第七章", title:"積み上げた報酬の果てに", loc:"累層の帝都エオン",
        doneFlag:"c7_ch07_done", startedFlag:"c7_ep1_start" });
    }
  }
})();
