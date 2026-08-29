"use strict";
/* ============================================================
   story/chapters/chapter-05.js — 第五章「誰も見捨てない」第1〜3話(前半)
   docs/story-bible.md / ENDING-CANON 準拠。舞台=医療都市メディカ／
   科目=健康保険法(subject 5)。テーマ=『誰も見捨てない』という理想が、
   財政を崩壊寸前にする。医療の慈悲と、有限の原資の板挟み。
   事件モチーフ=標準報酬月額/標準賞与額・傷病手当金・出産手当金/出産育児一時金・
   高額療養費・任意継続被保険者・被扶養者・保険給付/埋葬料。
   ・第1話「見捨てない街」…医療都市メディカ 導入。標準報酬を下げられ傷病手当金を止められ、
                        療養の暮らしごと崩れかけた患者との出会い。新仲間セラ初登場(誰一人
                        見捨てない治療師。目の前の患者を全員救おうとするあまり、都市の医療財政を
                        崩壊寸前にしている)。○×演習(健保 s5)→過去問(examFmt)。小ボス=傷病手当のカルギ。
                        カイ/ミナが「なぜ戦うか」を明示。
   ・第2話「原資の底」…セラの過去(全員を救い、原資を空にしかけた側)を掘り下げ加入。
                        被扶養者・高額療養費・標準報酬の論点。過去問(五肢択一・個数)混入。
                        小ボス=高額のゾフィ。
   ・第3話「慈悲と天秤」…テーマの歪みそのものと対峙する引き。制度/行政/経営側の事情ビート
                        (有限の原資・負担・誰が線を引くか)を断定せず提示。師匠ゼンの影を1本繋ぐ。
                        章ボス【ケンポ将軍 v_boss_s5】への引き。
   ・chapter-01*.js〜chapter-04*.js のノード/quest/ID/証拠/分岐は一切改変しない(別ファイル・別章 "ch05")。
   ・戦闘接続は既存の橋(story-encounter / story-battle-bridge)。encounter に villain と
     exam(examFmt 混入数)を持たせるだけ。採点・SRS・報酬・問題データには一切触れない。
   ・eval/new Function ゼロ。全ノードはデータのみ(next は文字列 or {then,else} or null)。全出力は自前 esc2 経由。
   ・立てるフラグ: c5_ep1_done〜c5_ep3_done / c5_sera_join / c5_boss_next / c5_ch05_done / c5_zen_ash5。
     章前半の完了フラグは c5_ch05_done(章ボス撃破は後続の章で確定する。ここは前半までを確定)。
   ・注: 仲間セラの好感度キーは cp5(story-cast が sera.rel=cp5 と定義済)。data-companions.js の
     cp5(健保のナース・あおい)とは別レイヤー(物語の関係値 getRel/setRel はパーティ・パッシブと独立)なので、
     既存テストを割らずに深化させる。セラの立ち絵 px は本章の正典どおり mina(輪郭線付きバスト)に揃える。
   ============================================================ */
(function(){
  var G = (typeof window!=="undefined") ? window : globalThis;
  var S = G.SRStory;
  if(!S || typeof S.register!=="function") return;   /* エンジン未ロードでも安全 */

  /* 第五章の話者を表示名テーブルへ追記(描画層があれば)。新仲間セラ(px=mina=輪郭線付きバスト)。
     既存キー(narrator/hero/kai/mina 等)は無改変。sera は既定 px が暫定値のため本章の正典 px=mina に揃える。 */
  if(S.SPEAKERS && typeof S.SPEAKERS==="object"){
    S.SPEAKERS.sera = { name:"セラ", px:"mina" };                       /* 正典どおり mina に統一 */
    if(!S.SPEAKERS.kanja)   S.SPEAKERS.kanja   = { name:"見放されかけた患者", px:"ghost" };
    if(!S.SPEAKERS.kenriji) S.SPEAKERS.kenriji = { name:"健保組合の理事 ミハル", px:"foreman" };
    if(!S.SPEAKERS.karugi)  S.SPEAKERS.karugi  = { name:"傷病手当のカルギ", px:"e_sabizan" };
    if(!S.SPEAKERS.zofi)    S.SPEAKERS.zofi    = { name:"高額のゾフィ", px:"e_nabakari" };
    if(!S.SPEAKERS.kenpo)   S.SPEAKERS.kenpo   = { name:"ケンポ将軍", px:"e_graus" };
  }

  var MACHI = "医療都市メディカ・慈救の街";
  var MADO  = "医療都市メディカ・給付窓口の街角";
  var IRYO  = "医療都市メディカ・施療院の街";
  var DAIN  = "医療都市メディカ・法典広間";

  /* 演習 encounter。opts で相手(villain)と過去問混入数(exam=examFmt の本数)・出題数(n)を指定。
     kind:"train" のまま既存の橋(start*)へ委譲する。採点系は一切新設しない。subject=5。 */
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
       第1話「見捨てない街」
       医療都市メディカ 導入。標準報酬を下げられ傷病手当金を止められた患者。新仲間セラ初登場。
       ○×演習(健保 s5)→過去問(examFmt)。小ボス=傷病手当のカルギ。カイ/ミナが「なぜ戦うか」を明示。
       ============================================================ */
    { id:"c5_ep1_open", start:true, type:"dialogue", speaker:"narrator", location:MACHI, bgmScene:"emotion",
      text:"医療都市メディカ。『誰も見捨てない』を掲げた慈悲の都。だがその理想の裏で、街の金庫は静かに底をつきかけていた。",
      next:"c5_ep1_intro", flags:{ c5_ep1_start:1 },
      questUpdate:{ qid:"q_ch05", state:"active", step:0 } },
    { id:"c5_ep1_intro", type:"dialogue", speaker:"narrator", location:MACHI,
      text:"病める者は救われる。だが原資は無限ではない。傷病手当金は標準報酬という土台の上に立つ。一段ずらせば、給付は痩せ、暮らしは崩れる。", next:"c5_ep1_victim" },
    { id:"c5_ep1_victim", type:"dialogue", speaker:"kanja", location:MACHI, portrait:"ghost", expression:"shock",
      text:"病で三月、働けずにいる。傷病手当金で薬代と家賃を繋いできた。……なのに先月、『標準報酬が下がった』と半分にされた。療養しろと言うが、金がなきゃ療養もできねえ。", next:"c5_ep1_sera1" },
    { id:"c5_ep1_sera1", type:"dialogue", speaker:"sera", location:MACHI, portrait:"mina", expression:"shock",
      text:"……待って。まだ治療の途中でしょう。標準報酬月額は実際の報酬から等級で決まる。勝手には下げられない。待期は連続三日で完成。数え方が狂ってる。", next:"c5_ep1_sera2" },
    { id:"c5_ep1_sera2", type:"dialogue", speaker:"sera", location:MACHI,
      text:"わたしはセラ。この街の治療師。……目の前で倒れた人を、一人だって見捨てたことはない。誰も、お金を理由に治療を諦めなくていい。そう信じてきた。", next:"c5_ep1_kai1" },
    { id:"c5_ep1_kai1", type:"dialogue", speaker:"kai", location:MACHI, portrait:"helm", expression:"angry",
      text:"標準報酬を一段ずらしただけで、療養してる人間の暮らしが折れる。健保は、病んだ時に人を支える約束だろ。……その約束を、守りに行く。", next:"c5_ep1_mina1" },
    { id:"c5_ep1_mina1", type:"dialogue", speaker:"mina", location:MACHI, portrait:"wiz",
      text:"傷病手当金は、療養で働けない間の生活費です。標準報酬月額の三分の二相当を、待期を経て支給する。……等級を一段ずらすだけで、療養そのものが立ち行かなくなります。", next:"c5_ep1_choice" },

    { id:"c5_ep1_choice", type:"choice", speaker:"hero", location:MACHI, text:"この患者に、どう向き合う?",
      choices:[
        { text:"標準報酬と傷病手当金の筋を、制度で正しく積み直す",
          ideologyChanges:{ law:1, mgmt:1 }, flags:{ c5_ep1_path_law:1 }, next:"c5_ep1_probe" },
        { text:"まず、療養を諦めかけた患者の心細さを受け止める",
          ideologyChanges:{ human:1, relief:1 }, flags:{ c5_ep1_path_human:1 }, next:"c5_ep1_alt" }
      ]},
    { id:"c5_ep1_alt", type:"dialogue", speaker:"hero", location:MACHI,
      text:"不安で当然です。病んで働けず、支えまで細っていく。……その上で。標準報酬を正しい等級に戻し、待期を正しく数えれば、療養は続けられます。", next:"c5_ep1_probe" },

    { id:"c5_ep1_probe", type:"dialogue", speaker:"narrator", location:MADO, bgmScene:"field",
      text:"等級表を握り、実額より一段低い等級を勝手に当てはめる者がいた。土台が下がれば、傷病手当金も将来の年金も痩せる。",
      next:"c5_ep1_enc1", questUpdate:{ qid:"q_ch05", state:"active", step:1 } },
    { id:"c5_ep1_enc1", type:"encounter", speaker:"hero", location:MADO, bgmScene:"emotion",
      text:"等級ずらしのヒョウガが、書き換えた等級表を抱えて現れた。標準報酬月額の定時決定・随時改定・傷病手当金の待期と支給期間を、本試験の問いで確かめる。",
      encounter: enc(5, "過去問｜標準報酬月額・定時決定・傷病手当金を問う", { villain:"v_hyoho", exam:2 }),
      evidence:"ev_ch5_hyojun", next:"c5_ep1_ev1" },
    { id:"c5_ep1_ev1", type:"dialogue", speaker:"sera", location:MADO,
      text:"標準報酬は報酬の実額で決まる。勝手な一段下げは通らない。定時決定は毎年、随時改定は大きく変わった時だけ。……あとは、手当金を止めた張本人だ。", next:"c5_ep1_karugi1" },
    { id:"c5_ep1_karugi1", type:"dialogue", speaker:"karugi", location:MADO, portrait:"e_sabizan", expression:"angry",
      text:"――手当金? もう打ち切りだ。労務不能の証明が足りん。待期も完成していない。……原資は有限だ。疑わしきは、支給せず。それが正しい査定さ。", next:"c5_ep1_probe2" },
    { id:"c5_ep1_probe2", type:"dialogue", speaker:"narrator", location:MADO, bgmScene:"field",
      text:"傷病手当のカルギ。労務不能や待期の要件を偽り、療養中の生活費を不当に止める。支給要件・待期・支給期間を立て直す。",
      next:"c5_ep1_enc2" },
    { id:"c5_ep1_enc2", type:"encounter", speaker:"hero", location:MADO, bgmScene:"emotion",
      text:"傷病手当のカルギが打ち切りの決定通知を盾に立ちはだかった。傷病手当金の支給要件・待期・支給期間・報酬との調整を、高密度に崩す。",
      encounter: enc(5, "過去問｜傷病手当金の支給要件・待期・支給期間(小ボス)", { villain:"v_lt_shoubyo", exam:3 }),
      evidence:"ev_ch5_shoubyo", next:"c5_ep1_ev2" },
    { id:"c5_ep1_ev2", type:"dialogue", speaker:"mina", location:MADO,
      text:"打ち切りの手口、証拠に残せました。労務不能なら、待期三日の完成後、標準報酬の三分の二相当を支給する。報酬が手当金より少なければ差額も出ます。", next:"c5_ep1_reason" },
    { id:"c5_ep1_reason", type:"reasoning", speaker:"hero", location:MADO, bgmScene:"emotion",
      text:"標準報酬月額、定時決定と随時改定、傷病手当金の待期と支給期間。――療養する者の暮らしを、いくら・いつまで支えるかの条文だ。偽れば、療養が折れる。",
      reasoning:{ need:["ev_ch5_hyojun","ev_ch5_shoubyo"] },
      flags:{ c5_ep1_reasoned:1 }, next:"c5_ep1_biz" },

    /* 【制度側の事情】断定せず提示 */
    { id:"c5_ep1_biz", type:"dialogue", speaker:"kenriji", location:MADO,
      text:"……手当金を正すのは正しい。だがこの街は給付を惜しまずに来た。その結果、金庫は底をつきかけている。有限の原資を、誰にどこまで割くべきか。", next:"c5_ep1_hero2" },
    { id:"c5_ep1_hero2", type:"dialogue", speaker:"hero", location:MADO,
      text:"（原資が有限なのは本当だ。……でも、土台を偽って止めるのは線引きじゃない。ただの切り捨てだ。どちらかを捨てる話にはしたくない。）",
      next:"c5_ep1_end", ideologyChanges:{ fair:1, mgmt:1 }, flags:{ c5_ep1_saw_sides:1 } },
    { id:"c5_ep1_end", type:"dialogue", speaker:"narrator", location:MACHI, bgmScene:"field",
      text:"患者は正された決定通知を握りしめ、初めて肩の力を抜いた。セラはその手をもう一度握り、正しい支給日を書き添えてやった。",
      next:"c5_ep1_hook", flags:{ c5_ep1_done:1 }, questUpdate:{ qid:"q_ch05", state:"active", step:2 } },
    { id:"c5_ep1_hook", type:"dialogue", speaker:"sera", location:MACHI,
      text:"……ねえ調律師さん。本気でこの街の歪みを正す気? だったら、わたしの話も聞いてほしい。誰も見捨てないと誓ったわたしが、なぜ金庫を空にしかけたのか。", next:"c5_ep2_open" },

    /* ============================================================
       第2話「原資の底」
       セラの過去を掘り下げ加入。被扶養者・高額療養費・標準報酬。
       過去問(五肢択一・個数)混入。小ボス=高額のゾフィ。
       ============================================================ */
    { id:"c5_ep2_open", type:"dialogue", speaker:"narrator", location:IRYO, bgmScene:"emotion",
      text:"施療院の一室。セラは古い診療記録の束を広げた。一冊だけ、表紙に赤い判で『支給停止・原資不足』と記された記録が挟まっていた。",
      next:"c5_ep2_sera1", flags:{ c5_ep2_start:1 } },
    { id:"c5_ep2_sera1", type:"dialogue", speaker:"sera", location:IRYO, portrait:"mina", expression:"shock",
      text:"この一冊は、わたしが最後に無理を通した患者。……でも原資が尽きた。その月、別の病棟で支えを待つ人たちへの給付が遅れた。一人を救うたび、誰かが後回しにされていた。", next:"c5_ep2_sera2" },
    { id:"c5_ep2_sera2", type:"dialogue", speaker:"sera", location:IRYO,
      text:"だから給付の全部を覚え直した。高額療養費の限度額、標準報酬の区分、被扶養者の範囲、出産の給付。……誰かを後回しにしない線を、引くために。", next:"c5_ep2_mina1" },
    { id:"c5_ep2_mina1", type:"dialogue", speaker:"mina", location:IRYO, portrait:"wiz",
      text:"……セラ。あなたの悔いは、制度そのものの悩みです。全部を無条件に救えば、原資は尽きる。だから条文は、慈悲に線を引くのです。", next:"c5_ep2_join" },
    { id:"c5_ep2_join", type:"dialogue", speaker:"sera", location:IRYO, bgmScene:"emotion", expression:"angry",
      text:"……そうね。無条件の慈悲は、いつか誰かを踏む。それでも目の前の一人は見捨てられない。だから行く。条件は一つ――線の外に落ちる一人の顔を、忘れないこと。",
      next:"c5_ep2_kai1", relationshipChanges:{ cp5:1 }, flags:{ c5_sera_join:1 } },
    { id:"c5_ep2_kai1", type:"dialogue", speaker:"kai", location:IRYO,
      text:"上等だ。線の外を忘れるやつは、おれが一番嫌いなんでな。セラ、遠慮なく使わせてもらう。", next:"c5_ep2_choice" },

    { id:"c5_ep2_choice", type:"choice", speaker:"hero", location:IRYO, text:"セラの知識を、どう使う?",
      choices:[
        { text:"高額療養費と被扶養者の要件を、制度で一件ずつ確かめて回る",
          ideologyChanges:{ law:1, mgmt:1 }, flags:{ c5_ep2_path_law:1 }, next:"c5_ep2_probe" },
        { text:"限度額を超え、支えを後回しにされた側の声を先に集める",
          ideologyChanges:{ human:1, relief:1 }, flags:{ c5_ep2_path_human:1 }, next:"c5_ep2_alt" }
      ]},
    { id:"c5_ep2_alt", type:"dialogue", speaker:"hero", location:IRYO,
      text:"限度額や区分の前に、一人がいる。払いきれず治療を諦めた者、被扶養者から外された者。……セラ、あなたの赤い判の一冊から始めさせてください。", next:"c5_ep2_probe" },

    { id:"c5_ep2_probe", type:"dialogue", speaker:"narrator", location:IRYO, bgmScene:"field",
      text:"被扶養者の範囲と出産の給付を混同させ、受けられる給付を惑わす者がいた。数え違えれば、支えられるはずの家族が網の外へ落ちる。",
      next:"c5_ep2_enc1", questUpdate:{ qid:"q_ch05", state:"active", step:3 } },
    { id:"c5_ep2_enc1", type:"encounter", speaker:"hero", location:IRYO, bgmScene:"emotion",
      text:"等級ずらしのヒョウガが、被扶養者と出産の給付を霧の中で混ぜにきた。被扶養者の範囲・出産手当金・出産育児一時金を、本試験の問いで数え直す。",
      encounter: enc(5, "過去問｜被扶養者の範囲・出産手当金・出産育児一時金を問う", { villain:"v_hyoho", exam:2 }),
      evidence:"ev_ch5_futa", next:"c5_ep2_ev1" },
    { id:"c5_ep2_ev1", type:"dialogue", speaker:"sera", location:IRYO,
      text:"被扶養者は、生計維持と収入の要件を満たす親族。出産育児一時金は出産そのものに、出産手当金は産前産後の生活費に。……次は、限度額を操る査定人だ。", next:"c5_ep2_zofi1" },
    { id:"c5_ep2_zofi1", type:"dialogue", speaker:"zofi", location:IRYO, portrait:"e_nabakari", expression:"angry",
      text:"高額療養費? 限度額を超えていなければ一円も出ん。……その限度額は標準報酬の区分で決まる。区分を高く見せれば、超えぬことになる。", next:"c5_ep2_probe2" },
    { id:"c5_ep2_probe2", type:"dialogue", speaker:"narrator", location:MADO, bgmScene:"field",
      text:"高額のゾフィ。標準報酬の区分を偽って限度額を吊り上げ、払い戻しを諦めさせる。限度額の算定と区分の筋を立て直す。",
      next:"c5_ep2_enc2" },
    { id:"c5_ep2_enc2", type:"encounter", speaker:"hero", location:MADO, bgmScene:"emotion",
      text:"高額のゾフィが、吊り上げた限度額の表を盾に立ちはだかった。高額療養費の自己負担限度額・標準報酬区分・多数回該当を、高密度に崩す。",
      encounter: enc(5, "過去問｜高額療養費・自己負担限度額・標準報酬区分(小ボス)", { villain:"v_lt_kougaku", exam:3 }),
      evidence:"ev_ch5_kougaku", next:"c5_ep2_ev2" },
    { id:"c5_ep2_ev2", type:"dialogue", speaker:"mina", location:MADO,
      text:"筋、通しました。一月の自己負担が限度額を超えれば払い戻される。限度額は区分で変わり、多数回該当ならさらに下がる。……偽りの吊り上げでした。", next:"c5_ep2_reason" },
    { id:"c5_ep2_reason", type:"reasoning", speaker:"hero", location:MADO, bgmScene:"emotion",
      text:"被扶養者の範囲、出産の給付、高額療養費の限度額、標準報酬の区分。――誰を・どこまで・いくら支えるかの条文だ。偽れば、原資も一人も同時に痩せる。",
      reasoning:{ need:["ev_ch5_futa","ev_ch5_kougaku"] },
      flags:{ c5_ep2_reasoned:1 }, next:"c5_ep2_biz" },

    /* 【行政/制度側の事情】断定せず、次話の壁として残す */
    { id:"c5_ep2_biz", type:"dialogue", speaker:"kenriji", location:MADO, expression:"shock",
      text:"……区分を設けるのには理由もある。負担できる者には応分に、できぬ者は手厚く。誰かを無条件に厚く支えれば、原資は別の誰かの元で尽きる。", next:"c5_ep2_hero2" },
    { id:"c5_ep2_hero2", type:"dialogue", speaker:"hero", location:MADO,
      text:"（応分の負担と、限度額を吊り上げる細工。この人も混ぜている。線は引ける。吊り上げは弾ける。負担の名目で、一人を闇に葬ってはいけない。）",
      next:"c5_ep2_end", ideologyChanges:{ fair:1, mgmt:1 }, flags:{ c5_ep2_saw_sides:1 } },
    { id:"c5_ep2_end", type:"dialogue", speaker:"narrator", location:IRYO, bgmScene:"field",
      text:"セラは赤い判の一冊を、そっと束の一番上に戻した。『次は、誰も後回しにしない』――その横顔に、原資を空にしかけた悔いがあった。",
      next:"c5_ep2_hook", flags:{ c5_ep2_done:1 }, questUpdate:{ qid:"q_ch05", state:"active", step:4 } },
    { id:"c5_ep2_hook", type:"dialogue", speaker:"sera", location:IRYO, expression:"angry",
      text:"……でもね、小ボスを何人正しても板挟みは消えない。『誰も見捨てない』という理想そのものが、有限の原資と天秤にかかって立ってるの。次は、そいつ。", next:"c5_ep3_open" },

    /* ============================================================
       第3話「慈悲と天秤」
       テーマの歪みそのものと対峙する引き。制度/行政/経営側の事情ビートを断定せず提示。
       師匠ゼンの影を1本繋ぐ。章ボス【ケンポ将軍 v_boss_s5】への引き。
       ============================================================ */
    { id:"c5_ep3_open", type:"dialogue", speaker:"narrator", location:DAIN, bgmScene:"emotion",
      text:"街の中央、健保の法典を祀る大広間。無条件に給付を受けた者の名簿と、原資が尽きて後回しにされた者の列が、皮肉に並んでいた。",
      next:"c5_ep3_sera1", flags:{ c5_ep3_start:1 } },
    { id:"c5_ep3_sera1", type:"dialogue", speaker:"sera", location:DAIN, portrait:"mina",
      text:"見て。ここにいる人たち、みんな『見捨てなかった』側。……そのしわ寄せが隣の列に回る。優しさで一人を救うたび、その原資が別の誰かから抜かれていた。", next:"c5_ep3_mina1" },
    { id:"c5_ep3_mina1", type:"dialogue", speaker:"mina", location:DAIN, portrait:"wiz",
      text:"任意継続被保険者――退職後も二年を限度に健保を続けられる。埋葬料は、亡くなった者を弔う者への給付。……どこまで広げ、どこで区切るか。線がなければ原資は漏れます。", next:"c5_ep3_zen" },
    { id:"c5_ep3_zen", type:"dialogue", speaker:"narrator", location:DAIN, bgmScene:"emotion",
      text:"大広間の古い健保台帳。表紙の裏に掠れた字。『慈悲を配る者は、慈悲の原資が誰の肩に乗るかを、まず問え』――師匠ゼンの筆跡だった。",
      next:"c5_ep3_choice", flags:{ c5_zen_ash5:1 } },

    { id:"c5_ep3_choice", type:"choice", speaker:"hero", location:DAIN, text:"『誰も見捨てない』の歪みに、どう立つ?",
      choices:[
        { text:"任意継続や埋葬料まで、給付の網を条文で正しく張り直す",
          ideologyChanges:{ law:1, fair:1 }, flags:{ c5_ep3_path_law:1 }, next:"c5_ep3_probe" },
        { text:"無条件に救われた者、後回しにされた者、双方の理由をまず問う",
          ideologyChanges:{ human:1, mgmt:1 }, flags:{ c5_ep3_path_ask:1 }, next:"c5_ep3_alt" }
      ]},
    { id:"c5_ep3_alt", type:"dialogue", speaker:"hero", location:DAIN,
      text:"慈悲を責める前に、理由がある。無条件に救われた者。原資が尽きて後回しにされた者。……そこからしか、支える網も原資も張り直せない。", next:"c5_ep3_probe" },

    { id:"c5_ep3_probe", type:"dialogue", speaker:"narrator", location:DAIN, bgmScene:"field",
      text:"『誰も見捨てない』の判を無条件に押す手先が最後の抵抗に出た。任意継続の資格も埋葬料も、原資の底を理由に握り潰す手口を剥がす。",
      next:"c5_ep3_enc1", questUpdate:{ qid:"q_ch05", state:"active", step:5 } },
    { id:"c5_ep3_enc1", type:"encounter", speaker:"hero", location:DAIN, bgmScene:"emotion",
      text:"等級ずらしのヒョウガが再び現れた。任意継続被保険者・保険給付・埋葬料の筋を、本試験の問いで崩す。底に隠された給付を、網へ取り戻す。",
      encounter: enc(5, "過去問｜任意継続被保険者・保険給付・埋葬料を取り戻す", { villain:"v_hyoho", exam:2 }),
      evidence:"ev_ch5_ninkei", next:"c5_ep3_ev1" },
    { id:"c5_ep3_ev1", type:"dialogue", speaker:"sera", location:DAIN,
      text:"任意継続は、退職後も二年を限度に、届と保険料を守れば続けられる。埋葬料は、遺された者への最後の支え。……握り潰させはしない。", next:"c5_ep3_reason" },
    { id:"c5_ep3_reason", type:"reasoning", speaker:"hero", location:DAIN, bgmScene:"emotion",
      text:"標準報酬、傷病手当金、被扶養者、高額療養費、出産、任意継続、埋葬料。――誰から集めた原資で、どこまで支えるかの条文だ。線がなければ、理想は崩れる。",
      reasoning:{ need:["ev_ch5_ninkei"] },
      flags:{ c5_ep3_reasoned:1 }, next:"c5_ep3_biz" },

    /* 【制度/行政/経営側の事情】断定せず、章ボスへの問いとして残す */
    { id:"c5_ep3_biz", type:"dialogue", speaker:"kenriji", location:DAIN, expression:"shock",
      text:"……分かった。だが私の背後に立つものは大きい。慈悲を惜しむまいとする街と、原資の底を恐れる財政が、長く綱を引き合ってきた天秤だ。", next:"c5_ep3_boss_hook" },
    { id:"c5_ep3_boss_hook", type:"dialogue", speaker:"kenpo", location:DAIN, portrait:"e_graus", expression:"angry",
      text:"――救ったか? 原資は残ったか? 無条件に救えば金庫が尽き、線を引けば誰かがこぼれる。それが慈悲の道理だ。その天秤に、抗うか。",
      next:"c5_ep3_hero_final", flags:{ c5_boss_next:1 } },
    { id:"c5_ep3_hero_final", type:"dialogue", speaker:"hero", location:DAIN,
      text:"抗う。カイも、ミナも、セラもいる。後回しにされた者も、線の外へ落とされかけた者も顔を上げた。……その板挟みを、健保の全体像で引き受けに行く。", next:"c5_ep3_end" },
    { id:"c5_ep3_end", type:"dialogue", speaker:"narrator", location:DAIN, bgmScene:"field",
      text:"メディカで、慈悲の理想が初めて『原資の重さ』とともに言い返された。だが街の奥に立つ影――ケンポ将軍との対峙は、まだこれからだ。",
      next:null, flags:{ c5_ep3_done:1, c5_ch05_done:1 },
      questUpdate:{ qid:"q_ch05", state:"done", step:6 } }
  ];

  /* 第1〜3話(章前半)クエスト定義(doneFlag で完了判定)。第一〜四章の各クエストは無改変の別クエスト。 */
  if(typeof S.registerQuest==="function"){
    S.registerQuest("q_ch05", {
      title:"誰も見捨てない",
      chapter:"ch05",
      steps:["見捨てない街","原資の底","慈悲と天秤"],
      doneFlag:"c5_ch05_done"
    });
  }

  S.register("ch05", NODES);
  S.CH05_ID = "ch05";

  /* メイン章の背骨(S.MAIN)へ、第四章(ch04b)の続きとして追記する。
     ・第四章クリア(c4_ch04b_done)後、ホームの「今日の冒険」が自動で本章へ進む導線になる。
     ・章選択画面は前章 done まで locked=第四章クリアが解放ゲートとして機能する(既存規則に沿う)。
     ・S.MAIN 未ロード/未定義でも安全(存在する時だけ push、重複登録も防ぐ)。 */
  if(Array.isArray(S.MAIN)){
    var exists = false;
    for(var i=0;i<S.MAIN.length;i++){ if(S.MAIN[i] && S.MAIN[i].id==="ch05"){ exists = true; break; } }
    if(!exists){
      S.MAIN.push({ id:"ch05", no:"第五章", title:"誰も見捨てない", loc:"医療都市メディカ",
        doneFlag:"c5_ch05_done", startedFlag:"c5_ep1_start" });
    }
  }
})();
