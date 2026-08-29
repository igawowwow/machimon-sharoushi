"use strict";
/* ============================================================
   story/chapters/chapter-02.js — 第二章「灰の降る街」第1〜3話（前半）
   docs/story-bible.md / ENDING-CANON 準拠。舞台=火山イグニス／題材=労災保険法(subject 2)。
   テーマ=「事故は自己責任」という切り捨て。事件モチーフ=case-rousai（診断書/労災記録/業務起因性）。
   ・第1話「灰の降る街」…火山イグニス導入。業務災害で切り捨てられた労働者との出会い。
                        新仲間ガルド初登場（荒いが弱者に優しい）。○×演習(労災)→過去問(examFmt)。
                        小ボスは調査mob（寄り道のヨリム/日額削りのダルガ）。カイ/ミナが「なぜ戦うか」を明示。
   ・第2話「片腕の兵士」…ガルドの過去（会社にも国にも見捨てられた）を掘り下げ加入。
                        通勤災害/業務起因性の論点。過去問（五肢択一・個数）混入。小ボス=切り捨てのガデス(新規lt)。
   ・第3話「自己責任という呪い」…「事故は自己責任」の空気そのものと対峙する引き。
                        行政/経営側の事情ビート（財源有限・一部不正請求）を断定せず提示。
                        章ボス【ロウサイ大王 v_boss_s2】への引き。
   ・各話に「経営者/行政の事情」ビートを置き、断定せず問いを残す。師匠ゼン・クロイツの影を1本繋ぐ。
   ・chapter-01*.js のノード/quest/ID/証拠/分岐は一切改変しない（別ファイル・別章 chapterId="ch02"）。
   ・戦闘接続は既存の橋（story-encounter / story-battle-bridge）。encounter に villain と
     exam(examFmt 混入数)を持たせるだけ。採点・SRS・報酬・問題データには一切触れない。
   ・eval/new Function ゼロ。全ノードはデータのみ（next は文字列 or {then,else} or null）。全出力は自前 esc2 経由。
   ・立てるフラグ: c2_ep1_done〜c2_ep3_done / c2_gard_join / c2_boss_next / c2_ch02_done / c2_zen_ash。
     章前半の完了フラグは c2_ch02_done（章ボス撃破は後続の章で確定する。ここは前半までを確定）。
   ============================================================ */
(function(){
  var G = (typeof window!=="undefined") ? window : globalThis;
  var S = G.SRStory;
  if(!S || typeof S.register!=="function") return;   /* エンジン未ロードでも安全 */

  /* 第二章の話者を表示名テーブルへ追記（描画層があれば。無ければ素通し）。
     gard（ガルド）は既存（story-dialogue-renderer.js の SPEAKERS）。victim/assessor/rousai のみ追記。 */
  if(S.SPEAKERS && typeof S.SPEAKERS==="object"){
    if(!S.SPEAKERS.victim)   S.SPEAKERS.victim   = { name:"灰まみれの工夫", px:"ghost" };
    if(!S.SPEAKERS.assessor) S.SPEAKERS.assessor = { name:"査定官 ガデス", px:"skull" };
    if(!S.SPEAKERS.rousai)   S.SPEAKERS.rousai   = { name:"ロウサイ大王", px:"fire" };
  }

  var ASH  = "火山イグニス・灰降る鉱区";
  var CAMP = "イグニス・廃坑の宿営";
  var GATE = "イグニス・労災査定所";

  /* 演習 encounter。opts で相手(villain)と過去問混入数(exam=examFmt の本数)・出題数(n)を指定。
     kind:"train" のまま既存の橋（start*）へ委譲する。採点系は一切新設しない。 */
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
       第1話「灰の降る街」
       火山イグニス導入。業務災害で切り捨てられた労働者との出会い。ガルド初登場。
       ○×演習(労災 s2)→過去問(examFmt)。小ボス=調査mob。カイ/ミナが「なぜ戦うか」を明示。
       ============================================================ */
    { id:"c2_ep1_open", start:true, type:"dialogue", speaker:"narrator", location:ASH, bgmScene:"emotion",
      text:"火の山イグニス。空から絶えず灰が降り、鉱夫たちは咳き込みながら、それでも坑へ吸い込まれていく。",
      next:"c2_ep1_intro", flags:{ c2_ep1_start:1 },
      questUpdate:{ qid:"q_ch02", state:"active", step:0 } },
    { id:"c2_ep1_intro", type:"dialogue", speaker:"narrator", location:ASH,
      text:"坑口の脇に、足を引きずる者、腕を吊った者が並んで座っていた。ここでは事故は日常で、日常は――自己責任、とされていた。", next:"c2_ep1_victim" },
    { id:"c2_ep1_victim", type:"dialogue", speaker:"victim", location:ASH, portrait:"ghost", expression:"shock",
      text:"落盤で足をやられた。……なのに『気をつけなかったお前が悪い』で終わりだ。治療の金も、休む間の飯も、誰も出しちゃくれねえ。", next:"c2_ep1_gard1" },
    { id:"c2_ep1_gard1", type:"dialogue", speaker:"gard", location:ASH, portrait:"oni",
      text:"泣くな。まず座れ。話はそれからだ。……腕はもう戻らねえ。だがな、お前の明日は、まだ書ける。書き方を知らねえだけだ。", next:"c2_ep1_gard2" },
    { id:"c2_ep1_gard2", type:"dialogue", speaker:"gard", location:ASH, expression:"angry",
      text:"仕事で壊れた体だ。なら面倒を見る仕組みが、この国にはある。……それを『無い』と言い張る奴らを、おれは許さねえ。", next:"c2_ep1_kai1" },
    { id:"c2_ep1_kai1", type:"dialogue", speaker:"kai", location:ASH, portrait:"helm", expression:"angry",
      text:"おれの親父も、時間を削られて死んだ。『自己責任』の一言で片づけられた。……もう、あの言葉で誰かが消えるのは見たくねえ。", next:"c2_ep1_mina1" },
    { id:"c2_ep1_mina1", type:"dialogue", speaker:"mina", location:ASH, portrait:"wiz",
      text:"この鉱区の事故は、偶然ではなく必然の頻度で起きています。労災の補償は、その一件一件を数え直すための制度です。", next:"c2_ep1_choice" },

    { id:"c2_ep1_choice", type:"choice", speaker:"hero", location:ASH, text:"この人たちと、どう向き合う?",
      choices:[
        { text:"仕事が原因だと、証拠と条文で立証する",
          ideologyChanges:{ law:1, fair:1 }, flags:{ c2_ep1_path_law:1 }, next:"c2_ep1_probe" },
        { text:"まず、切り捨てられた本人の痛みを受け止める",
          ideologyChanges:{ human:1, relief:1 }, flags:{ c2_ep1_path_human:1 }, next:"c2_ep1_alt" }
      ]},
    { id:"c2_ep1_alt", type:"dialogue", speaker:"hero", location:ASH,
      text:"つらかったですね。あなたは、何も悪くない。……その上で聞かせてください。どこで、どう倒れたのか。", next:"c2_ep1_probe" },

    { id:"c2_ep1_probe", type:"dialogue", speaker:"narrator", location:ASH, bgmScene:"field",
      text:"通勤路を『寄り道』と決めつける者、補償の土台の日額をこっそり痩せさせる者。まずは、その手口を証拠で暴く。",
      next:"c2_ep1_enc1", questUpdate:{ qid:"q_ch02", state:"active", step:1 } },
    { id:"c2_ep1_enc1", type:"encounter", speaker:"hero", location:ASH,
      text:"最初の相手は、日額削りのダルガ。給付の土台=給付基礎日額を低く見せ、補償を痩せさせている。",
      encounter: enc(2, "給付基礎日額のごまかしを検証する", { villain:"v_nichigaku", exam:1 }),
      evidence:"ev_ch2_commute", next:"c2_ep1_ev1" },
    { id:"c2_ep1_ev1", type:"dialogue", speaker:"mina", location:ASH,
      text:"日額の算定、確かにごまかされていました。……次は、通勤路を『私的な寄り道』と決めつける者です。", next:"c2_ep1_enc2" },
    { id:"c2_ep1_enc2", type:"encounter", speaker:"hero", location:ASH, bgmScene:"emotion",
      text:"寄り道のヨリムが道を曲げにきた。通勤災害の逸脱と中断の線引きを、本試験の問いで断つ。",
      encounter: enc(2, "過去問｜通勤災害・逸脱と中断を問う", { villain:"v_yorimichi", exam:2 }),
      evidence:"ev_ch2_record", next:"c2_ep1_ev2" },
    { id:"c2_ep1_ev2", type:"dialogue", speaker:"narrator", location:ASH,
      text:"ヨリムは道を戻した。『……日用品の買い物程度なら、通勤は途切れない、か』と、灰の中へ消えていった。", next:"c2_ep1_reason" },
    { id:"c2_ep1_reason", type:"reasoning", speaker:"hero", location:ASH, bgmScene:"emotion",
      text:"痩せさせた日額、曲げた通勤路。――どちらも補償を諦めさせる細工だ。剥がせば、守るための条文がそこにある。",
      reasoning:{ need:["ev_ch2_commute","ev_ch2_record"] },
      flags:{ c2_ep1_reasoned:1 }, next:"c2_ep1_biz" },

    /* 【行政/経営の事情】断定せず提示 */
    { id:"c2_ep1_biz", type:"dialogue", speaker:"assessor", location:ASH,
      text:"……勘違いするな。財源は無限ではない。全部を認めれば、いずれ制度そのものが枯れる。中には、仕事と無関係の怪我を労災に化けさせる者もいる。", next:"c2_ep1_hero2" },
    { id:"c2_ep1_hero2", type:"dialogue", speaker:"hero", location:ASH,
      text:"（財源が有限なのも、悪用する者がいるのも本当だ。……だが、それを盾に本物の痛みまで切り捨てていいのか。）",
      next:"c2_ep1_end", ideologyChanges:{ mgmt:1, fair:1 }, flags:{ c2_ep1_saw_sides:1 } },
    { id:"c2_ep1_end", type:"dialogue", speaker:"narrator", location:ASH, bgmScene:"field",
      text:"灰の降る街で、切り捨てられた者たちが初めて顔を上げた。だが元兵士ガルドだけは、拳を握ったまま火口を睨んでいた。",
      next:"c2_ep1_hook", flags:{ c2_ep1_done:1 }, questUpdate:{ qid:"q_ch02", state:"active", step:2 } },
    { id:"c2_ep1_hook", type:"dialogue", speaker:"kai", location:ASH,
      text:"あのおっさん、ガルドか。他人のためには火みてえに怒るのに、自分の腕のことは一言も話さねえ。……何か抱えてる目だ。", next:"c2_ep2_open" },

    /* ============================================================
       第2話「片腕の兵士」
       ガルドの過去（会社にも国にも見捨てられた）を掘り下げ加入。通勤災害/業務起因性。
       過去問（五肢択一・個数）混入。小ボス=切り捨てのガデス(v_lt_kirisute)。
       ============================================================ */
    { id:"c2_ep2_open", type:"dialogue", speaker:"narrator", location:CAMP, bgmScene:"emotion",
      text:"廃坑の宿営。焚き火の灰が舞う中、ガルドは吊った腕を火にかざした。焼け残った鉄の義手が、鈍く光る。",
      next:"c2_ep2_past1", flags:{ c2_ep2_start:1 } },
    { id:"c2_ep2_past1", type:"dialogue", speaker:"gard", location:CAMP, portrait:"oni", expression:"shock",
      text:"昔は兵隊だった。除隊して坑夫になった。……ある朝、支保が抜けて腕を持っていかれた。仕事そのものの、事故だ。", next:"c2_ep2_past2" },
    { id:"c2_ep2_past2", type:"dialogue", speaker:"gard", location:CAMP, expression:"angry",
      text:"会社は言った。『労災は使うな。健康保険で自分の怪我として治せ』。次に『退職金は出した。もう社員じゃない』。国の窓口は『仕事が原因だと証明できるのか』。……いっぺんに、見捨てられた。", next:"c2_ep2_hero1" },
    { id:"c2_ep2_hero1", type:"dialogue", speaker:"hero", location:CAMP,
      text:"……辞めたら権利まで消えると、思わされたんですね。違う。仕事で壊れた体の補償は、辞めた後でも請求できます。", next:"c2_ep2_mina1" },
    { id:"c2_ep2_mina1", type:"dialogue", speaker:"mina", location:CAMP, portrait:"wiz",
      text:"論点は二つ。その怪我が仕事を原因とするか。そして、退職しても受給権は失われないこと。……どちらも満たしています。", next:"c2_ep2_bad" },
    { id:"c2_ep2_bad", type:"dialogue", speaker:"mina", location:CAMP,
      text:"ただ、正直に言えば。仕事と無関係の持病を労災に見せかける者も、ごく一部にはいます。査定官が疑り深くなる理由も、そこに。", next:"c2_ep2_kai1" },
    { id:"c2_ep2_kai1", type:"dialogue", speaker:"kai", location:CAMP, expression:"angry",
      text:"ずるい奴がいるのも本当だ。……だがな、一部の悪さで本物まで疑うのは順番が違う。まず線を引け。それから外れた奴を弾け。", next:"c2_ep2_choice" },

    { id:"c2_ep2_choice", type:"choice", speaker:"hero", location:CAMP, text:"ガルドの件に、どう踏み込む?",
      choices:[
        { text:"退職しても権利は消えないと、制度で示す",
          ideologyChanges:{ law:1, indep:1 }, flags:{ c2_ep2_path_right:1 }, next:"c2_ep2_probe" },
        { text:"国にも会社にも見捨てられた歳月を、まず認める",
          ideologyChanges:{ human:1, mgmt:1 }, flags:{ c2_ep2_path_human:1 }, next:"c2_ep2_alt" }
      ]},
    { id:"c2_ep2_alt", type:"dialogue", speaker:"hero", location:CAMP,
      text:"一人で耐えてきた年月を、なかったことにはしません。……腕は戻らない。でも権利は、まだ生きています。", next:"c2_ep2_probe" },

    { id:"c2_ep2_probe", type:"dialogue", speaker:"narrator", location:CAMP, bgmScene:"field",
      text:"査定所の記録には、ガルドの申請が『却下』の判で埋もれていた。握り潰したのは――切り捨てのガデス。",
      next:"c2_ep2_enc1", questUpdate:{ qid:"q_ch02", state:"active", step:3 } },
    { id:"c2_ep2_enc1", type:"encounter", speaker:"hero", location:CAMP,
      text:"まずは業務起因性。支保が抜けた朝の記録、作業の指示、負傷の場所。仕事と怪我を結ぶ線を、条文で立てる。",
      encounter: enc(2, "過去問｜業務起因性・業務遂行性を問う", { villain:"v_nichigaku", exam:2 }),
      evidence:"ev_ch2_cause", next:"c2_ep2_ev1" },
    { id:"c2_ep2_ev1", type:"dialogue", speaker:"mina", location:CAMP,
      text:"因果の線、結べました。業務遂行中・業務起因の負傷――労災に該当します。……ガデス本人が、判を握って現れます。", next:"c2_ep2_enc2" },
    { id:"c2_ep2_enc2", type:"encounter", speaker:"hero", location:CAMP, bgmScene:"emotion",
      text:"切り捨てのガデスが立ちはだかった。療養・休業補償給付と、退職後も消えない受給権。握り潰された補償を掘り起こす。",
      encounter: enc(2, "過去問｜療養・休業補償と退職後の受給権", { villain:"v_lt_kirisute", exam:3 }),
      evidence:"ev_ch2_shinsa", next:"c2_ep2_ev2" },
    { id:"c2_ep2_ev2", type:"dialogue", speaker:"assessor", location:CAMP, expression:"shock",
      text:"……却下の判を覆すというのか。私は財源を守っていただけだ。……だが、この男の腕は確かに、仕事が奪った。それは認めよう。", next:"c2_ep2_reason" },
    { id:"c2_ep2_reason", type:"reasoning", speaker:"hero", location:CAMP, bgmScene:"emotion",
      text:"業務起因性、退職後の受給権、療養と休業の補償。――切り捨ての根拠は、そのどれもが崩れた。制度は、辞めた者の手にも届く。",
      reasoning:{ need:["ev_ch2_cause","ev_ch2_shinsa"] },
      flags:{ c2_ep2_reasoned:1 }, next:"c2_ep2_join" },
    { id:"c2_ep2_join", type:"dialogue", speaker:"gard", location:CAMP, bgmScene:"emotion", expression:"shock",
      text:"……三年だ。三年、誰も、おれの腕を『仕事のせいだ』と言ってくれなかった。……お前が初めてだ。連れて行け、調律師。",
      next:"c2_ep2_biz", relationshipChanges:{ cp2:1 }, flags:{ c2_gard_join:1 } },

    /* 【行政の事情】断定せず、問いを残す */
    { id:"c2_ep2_biz", type:"dialogue", speaker:"assessor", location:CAMP,
      text:"……一つだけ言わせろ。判を渋るのは意地悪じゃない。財源が尽きれば、次に倒れた者を誰も救えなくなる。その両立を、お前は示せるのか?", next:"c2_ep2_hero2" },
    { id:"c2_ep2_hero2", type:"dialogue", speaker:"hero", location:CAMP,
      text:"（財源を守ることと、目の前の一人を救うこと。どちらかじゃない。両方を立てる線を、引き続ける。）",
      next:"c2_ep2_end", ideologyChanges:{ fair:1, mgmt:1 }, flags:{ c2_ep2_saw_sides:1 } },
    { id:"c2_ep2_end", type:"dialogue", speaker:"narrator", location:CAMP, bgmScene:"field",
      text:"鉄の義手で、ガルドは初めて笑った。仲間が一人、増えた。だが火口の奥では、切り捨ての空気が王の形を取り始めていた。",
      next:"c2_ep2_hook", flags:{ c2_ep2_done:1 }, questUpdate:{ qid:"q_ch02", state:"active", step:4 } },
    { id:"c2_ep2_hook", type:"dialogue", speaker:"gard", location:CAMP, expression:"angry",
      text:"火口の縁に、査定所の本丸がある。おれを切り捨てた判を、何千枚も刷ってる場所だ。……行くぞ、呪いの大元へ。", next:"c2_ep3_open" },

    /* ============================================================
       第3話「自己責任という呪い」
       「事故は自己責任」の空気そのものと対峙する引き。行政/経営側の事情ビート（財源有限・一部不正請求）を
       断定せず提示。師匠ゼンの影を1本繋ぐ。章ボス【ロウサイ大王 v_boss_s2】への引き。
       ============================================================ */
    { id:"c2_ep3_open", type:"dialogue", speaker:"narrator", location:GATE, bgmScene:"emotion",
      text:"火口の縁に立つ労災査定所。壁という壁に、『却下』の判で埋もれた申請書。一枚一枚が、顔を上げられなかった誰かの明日だった。",
      next:"c2_ep3_air", flags:{ c2_ep3_start:1 } },
    { id:"c2_ep3_air", type:"dialogue", speaker:"narrator", location:GATE,
      text:"ここに憎むべき一人の悪人はいなかった。あるのは『事故は自己責任』という空気。誰もが少しずつそれを吸い、誰かを切り捨てていた。", next:"c2_ep3_assessor" },
    { id:"c2_ep3_assessor", type:"dialogue", speaker:"assessor", location:GATE, portrait:"skull",
      text:"呪いだと? 我々は現実を見ているだけだ。財源には底がある。不正請求もゼロにはならない。……間違っているか?", next:"c2_ep3_hero1" },
    { id:"c2_ep3_hero1", type:"dialogue", speaker:"hero", location:GATE,
      text:"間違ってはいない。でも足りない。……疑うことと、切り捨てることは違う。その線を、痛みの側に一ミリ寄せてほしいんです。", next:"c2_ep3_gard1" },
    { id:"c2_ep3_gard1", type:"dialogue", speaker:"gard", location:GATE, expression:"angry",
      text:"きれいごとに聞こえるか? おれは三年、その一ミリが無いせいで飯も食えなかった。……なら、財源を守りながら拾う道を、一緒に探せ。", next:"c2_ep3_mina1" },
    { id:"c2_ep3_mina1", type:"dialogue", speaker:"mina", location:GATE, portrait:"wiz",
      text:"不正請求は全体のごくわずかです。その僅かを恐れて全体を締めれば、救われるはずの多数が漏れる。確率は、痛みの側に立てと言っています。", next:"c2_ep3_zen" },
    { id:"c2_ep3_zen", type:"dialogue", speaker:"narrator", location:GATE, bgmScene:"emotion",
      text:"却下の判の版木に、見覚えのある字の追記があった。『線を引く者は、線の外の痛みも背負え』――師匠ゼンの筆跡だった。",
      next:"c2_ep3_choice", flags:{ c2_zen_ash:1 } },

    { id:"c2_ep3_choice", type:"choice", speaker:"hero", location:GATE, text:"『自己責任』の空気に、どう立つ?",
      choices:[
        { text:"財源の有限も一部の不正も直視した上で、線を引き直す",
          ideologyChanges:{ fair:1, mgmt:1 }, flags:{ c2_ep3_path_bridge:1 }, next:"c2_ep3_probe" },
        { text:"呪いに削られた一人を、まず数え直す",
          ideologyChanges:{ human:1, relief:1 }, flags:{ c2_ep3_path_count:1 }, next:"c2_ep3_alt" }
      ]},
    { id:"c2_ep3_alt", type:"dialogue", speaker:"hero", location:GATE,
      text:"平均や統計の前に、一人がいる。足を折った工夫。腕を失ったガルド。……その一人を数え直すことからしか、正しい線は引けない。", next:"c2_ep3_probe" },

    { id:"c2_ep3_probe", type:"dialogue", speaker:"narrator", location:GATE, bgmScene:"field",
      text:"版木の番人が最後の抵抗に出た。誰の落ち度でもない事故まで、本人の不注意に付け替える手口。その一枚を剥がす。",
      next:"c2_ep3_enc1", questUpdate:{ qid:"q_ch02", state:"active", step:5 } },
    { id:"c2_ep3_enc1", type:"encounter", speaker:"hero", location:GATE, bgmScene:"emotion",
      text:"寄り道のヨリムが、再び道を曲げにきた。業務起因性と『自己責任』への付け替えを、本試験の問いで崩す。",
      encounter: enc(2, "過去問｜自己責任への付け替えを崩す", { villain:"v_yorimichi", exam:2 }),
      evidence:"ev_ch2_selfblame", next:"c2_ep3_ev1" },
    { id:"c2_ep3_ev1", type:"dialogue", speaker:"mina", location:GATE,
      text:"付け替えの手口、証拠に残しました。誰の落ち度でもない事故を、本人の不注意に化けさせる。この街の呪いの正体です。", next:"c2_ep3_reason" },
    { id:"c2_ep3_reason", type:"reasoning", speaker:"hero", location:GATE, bgmScene:"emotion",
      text:"痩せた日額、曲げた通勤路、握り潰した判、自己責任への付け替え。――全部、切り捨てを当たり前に見せるための細工だった。",
      reasoning:{ need:["ev_ch2_selfblame"] },
      flags:{ c2_ep3_reasoned:1 }, next:"c2_ep3_biz" },

    /* 【経営/行政の事情】断定せず、章ボスへの問いとして残す */
    { id:"c2_ep3_biz", type:"dialogue", speaker:"assessor", location:GATE, expression:"shock",
      text:"……お前の言うことは分かった。だが私の背後に立つ方は、私よりずっと大きい。『事故は自己責任』は、この国が長く吸い続けた空気だ。", next:"c2_ep3_boss_hook" },
    { id:"c2_ep3_boss_hook", type:"dialogue", speaker:"rousai", location:GATE, portrait:"fire", expression:"angry",
      text:"――業務災害か、通勤災害か。その線の外に落ちた者は、誰が拾う? 拾わぬのが世の習いだ。調律師よ、お前一人で抗うか。",
      next:"c2_ep3_hero_final", flags:{ c2_boss_next:1 } },
    { id:"c2_ep3_hero_final", type:"dialogue", speaker:"hero", location:GATE,
      text:"一人じゃない。カイも、ミナも、ガルドもいる。切り捨てられた工夫たちも、もう顔を上げた。……その習いを、法で覆しに行く。", next:"c2_ep3_end" },
    { id:"c2_ep3_end", type:"dialogue", speaker:"narrator", location:GATE, bgmScene:"field",
      text:"灰の降る街で、切り捨ての呪いが初めて言い返された。だが火口の王――ロウサイ大王との対峙は、まだこれからだ。",
      next:null, flags:{ c2_ep3_done:1, c2_ch02_done:1 },
      questUpdate:{ qid:"q_ch02", state:"done", step:6 } }
  ];

  /* 第1〜3話（章前半）クエスト定義（doneFlag で完了判定）。第一章の各クエストは無改変の別クエスト。 */
  if(typeof S.registerQuest==="function"){
    S.registerQuest("q_ch02", {
      title:"灰の降る街",
      chapter:"ch02",
      steps:["灰の降る街","片腕の兵士","自己責任という呪い"],
      doneFlag:"c2_ch02_done"
    });
  }

  S.register("ch02", NODES);
  S.CH02_ID = "ch02";

  /* メイン章の背骨（S.MAIN）へ、第一章（ch01c）の続きとして追記する。
     ・第一章クリア（c1_ch01c_done）後、ホームの「今日の冒険」が自動で本章へ進む導線になる。
     ・章選択画面は前章 done まで locked＝第一章クリアが解放ゲートとして機能する（既存規則に沿う）。
     ・S.MAIN 未ロード/未定義でも安全（存在する時だけ push、重複登録も防ぐ）。 */
  if(Array.isArray(S.MAIN)){
    var exists = false;
    for(var i=0;i<S.MAIN.length;i++){ if(S.MAIN[i] && S.MAIN[i].id==="ch02"){ exists = true; break; } }
    if(!exists){
      S.MAIN.push({ id:"ch02", no:"第二章", title:"灰の降る街", loc:"火山イグニス",
        doneFlag:"c2_ch02_done", startedFlag:"c2_ep1_start" });
    }
  }
})();
