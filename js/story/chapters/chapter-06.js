"use strict";
/* ============================================================
   story/chapters/chapter-06.js — 第六章「明日を捨てない」第1〜3話(前半)
   docs/story-bible.md / ENDING-CANON 準拠。舞台=黄昏の郷ノスタ／
   科目=国民年金法(subject 6)。テーマ=『今は要らない』という未納が、
   遠い老後の空白を生む。今日の暮らしと、見えない未来の板挟み。
   事件モチーフ=保険料/産前産後免除・法定免除/申請免除・納付猶予・学生納付特例・
   付加年金・老齢基礎年金/障害基礎年金/遺族基礎年金・合算対象期間・受給資格期間・任意加入被保険者。
   ・第1話「今は要らない、の街」…黄昏の郷ノスタ 導入。免除を伏せられ未納のまま放置され、
                        遠い老後の空白に沈みかけた者との出会い。新仲間ノア初登場(未納者を責めず
                        寄り添う若き年金案内人。免除・猶予・学生特例・受給資格期間の抜け道を知り尽くす)。
                        ○×演習(国年 s6)→過去問(examFmt)。小ボス=免除封じのガレン。
                        カイ/ミナが「なぜ戦うか」を明示。
   ・第2話「空白の期間」…ノアの過去(免除を知らず、身内の老後を空白にしかけた側)を掘り下げ加入。
                        受給資格期間・合算対象期間・付加年金・任意加入の論点。過去問(五肢択一・個数)混入。
                        小ボス=期間断ちのカラン。
   ・第3話「黄昏の天秤」…テーマの歪みそのものと対峙する引き。制度/行政/経営側の事情ビート
                        (有限の原資・世代間扶養・誰が今日と明日の線を引くか)を断定せず提示。
                        師匠ゼンの影を1本繋ぐ。章ボス【コクネン仙人 v_boss_s6】への引き。
   ・chapter-01*.js〜chapter-05*.js のノード/quest/ID/証拠/分岐は一切改変しない(別ファイル・別章 "ch06")。
   ・戦闘接続は既存の橋(story-encounter / story-battle-bridge)。encounter に villain と
     exam(examFmt 混入数)を持たせるだけ。採点・SRS・報酬・問題データには一切触れない。
   ・eval/new Function ゼロ。全ノードはデータのみ(next は文字列 or {then,else} or null)。全出力は自前 esc2 経由。
   ・立てるフラグ: c6_ep1_done〜c6_ep3_done / c6_noa_join / c6_boss_next / c6_ch06_done / c6_zen_ash6。
     章前半の完了フラグは c6_ch06_done(章ボス撃破は後続の章で確定する。ここは前半までを確定)。
   ・注: 仲間ノアの好感度キーは cp6(story-cast が noa.rel=cp6 と定義済)。data-companions.js の
     cp6(年金仙人・玄斎)とは別レイヤー(物語の関係値 getRel/setRel はパーティ・パッシブと独立)なので、
     既存テストを割らずに深化させる。ノアの立ち絵 px は既定 hero_app が主人公と被るため、本章の正典どおり
     sora(輪郭線付きバスト)に必ず上書きする。
   ============================================================ */
(function(){
  var G = (typeof window!=="undefined") ? window : globalThis;
  var S = G.SRStory;
  if(!S || typeof S.register!=="function") return;   /* エンジン未ロードでも安全 */

  /* 第六章の話者を表示名テーブルへ追記(描画層があれば)。新仲間ノア(px=sora=輪郭線付きバスト)。
     既存キー(narrator/hero/kai/mina 等)は無改変。noa は既定 px=hero_app が主人公と被るため、
     本章の正典 px=sora に必ず上書きする(if ガードなし=上書き徹底)。 */
  if(S.SPEAKERS && typeof S.SPEAKERS==="object"){
    S.SPEAKERS.noa = { name:"ノア", px:"sora" };                       /* 既定 hero_app を sora に上書き */
    if(!S.SPEAKERS.hisha)   S.SPEAKERS.hisha   = { name:"空白を抱えた人", px:"ghost" };
    if(!S.SPEAKERS.nenkinji) S.SPEAKERS.nenkinji = { name:"年金機構の担当 ミオ", px:"foreman" };
    if(!S.SPEAKERS.garen)   S.SPEAKERS.garen   = { name:"免除封じのガレン", px:"e_sabizan" };
    if(!S.SPEAKERS.karan)   S.SPEAKERS.karan   = { name:"期間断ちのカラン", px:"e_nabakari" };
    if(!S.SPEAKERS.kokunen) S.SPEAKERS.kokunen = { name:"コクネン仙人", px:"e_gizo" };
  }

  var MACHI = "黄昏の郷ノスタ・宵の街";
  var MADO  = "黄昏の郷ノスタ・年金窓口の街角";
  var DAICHO= "黄昏の郷ノスタ・古い台帳の街並み";
  var DAIN  = "黄昏の郷ノスタ・法典広間";

  /* 演習 encounter。opts で相手(villain)と過去問混入数(exam=examFmt の本数)・出題数(n)を指定。
     kind:"train" のまま既存の橋(start*)へ委譲する。採点系は一切新設しない。subject=6。 */
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
       第1話「今は要らない、の街」
       黄昏の郷ノスタ 導入。免除を伏せられ未納のまま放置された者。新仲間ノア初登場。
       ○×演習(国年 s6)→過去問(examFmt)。小ボス=免除封じのガレン。カイ/ミナが「なぜ戦うか」を明示。
       ============================================================ */
    { id:"c6_ep1_open", start:true, type:"dialogue", speaker:"narrator", location:MACHI, bgmScene:"emotion",
      text:"黄昏の郷ノスタ。街には奇妙な口癖が満ちていた。『今は要らない』――保険料も、免除の申請も、遠い老後も、みな明日へ先送りにされていた。",
      next:"c6_ep1_intro", flags:{ c6_ep1_start:1 },
      questUpdate:{ qid:"q_ch06", state:"active", step:0 } },
    { id:"c6_ep1_intro", type:"dialogue", speaker:"narrator", location:MACHI,
      text:"国民年金は、今日の若い肩が老いた明日を支える約束だ。だが一月納めそびれ、免除も知らされず放っておけば、その空白は遠い老後から静かに削られる。", next:"c6_ep1_victim" },
    { id:"c6_ep1_victim", type:"dialogue", speaker:"hisha", location:MACHI, portrait:"ghost", expression:"shock",
      text:"若い頃、暮らしが苦しくてな。窓口で『払えないなら放っておけばいい』と言われて、そのまま未納にした。……今になって、老後の年金がほとんど空白だと知った。", next:"c6_ep1_noa1" },
    { id:"c6_ep1_noa1", type:"dialogue", speaker:"noa", location:MACHI, portrait:"sora", expression:"shock",
      text:"……待って。責めに来たんじゃない。悪いのは、免除申請を伏せた窓口。払えないなら申請免除や納付猶予がある。免除された期間は、受給資格につながる。", next:"c6_ep1_noa2" },
    { id:"c6_ep1_noa2", type:"dialogue", speaker:"noa", location:MACHI,
      text:"わたしはノア。この郷の年金の案内人。……未納の人を一度も責めたことはない。責めても空白は埋まらないから。誰の老後も、空白のまま見捨てない。", next:"c6_ep1_kai1" },
    { id:"c6_ep1_kai1", type:"dialogue", speaker:"kai", location:MACHI, portrait:"helm", expression:"angry",
      text:"『払えないなら放っておけ』の一言で、免除の道を隠して、この人の老後を空白にした。……その約束の入口を、守りに行く。", next:"c6_ep1_mina1" },
    { id:"c6_ep1_mina1", type:"dialogue", speaker:"mina", location:MACHI, portrait:"wiz",
      text:"納められない事情があるなら、申請免除・法定免除・納付猶予・学生納付特例という道があります。免除された期間は受給資格期間に算入されます。", next:"c6_ep1_choice" },

    { id:"c6_ep1_choice", type:"choice", speaker:"hero", location:MACHI, text:"この人に、どう向き合う?",
      choices:[
        { text:"免除と受給資格期間の筋を、制度で正しく積み直す",
          ideologyChanges:{ law:1, mgmt:1 }, flags:{ c6_ep1_path_law:1 }, next:"c6_ep1_probe" },
        { text:"まず、空白を今さらと諦めかけた心細さを受け止める",
          ideologyChanges:{ human:1, relief:1 }, flags:{ c6_ep1_path_human:1 }, next:"c6_ep1_alt" }
      ]},
    { id:"c6_ep1_alt", type:"dialogue", speaker:"hero", location:MACHI,
      text:"今さらと思うのは当然です。ずっと空白だと信じ込まされてきた。……その上で。申請免除や納付猶予を正しくたどれば、空白は受給資格へつなぎ直せます。", next:"c6_ep1_probe" },

    { id:"c6_ep1_probe", type:"dialogue", speaker:"narrator", location:MADO, bgmScene:"field",
      text:"免除の申請書を引き出しの奥に隠し、『未納は未納』と言い張る者がいた。免除を伏せれば、暮らしも遠い老後も痩せる。",
      next:"c6_ep1_enc1", questUpdate:{ qid:"q_ch06", state:"active", step:1 } },
    { id:"c6_ep1_enc1", type:"encounter", speaker:"hero", location:MADO, bgmScene:"emotion",
      text:"未納のミノウが、伏せた免除申請の束を抱えて現れた。申請免除・法定免除・納付猶予・学生納付特例と、受給資格への算入を、本試験の問いで確かめる。",
      encounter: enc(6, "過去問｜保険料の免除・納付猶予・学生納付特例を問う", { villain:"v_mino", exam:2 }),
      evidence:"ev_ch6_menjo", next:"c6_ep1_ev1" },
    { id:"c6_ep1_ev1", type:"dialogue", speaker:"noa", location:MADO,
      text:"免除は伏せていい制度じゃない。払えないなら申請免除、猶予、学生なら学生特例。産前産後も免除される。……あとは、握り潰した張本人だ。", next:"c6_ep1_garen1" },
    { id:"c6_ep1_garen1", type:"dialogue", speaker:"garen", location:MADO, portrait:"e_sabizan", expression:"angry",
      text:"――免除? 猶予? そんな面倒な制度、教えてやる義理があるかね。払えぬ者は未納。未納は未納だ。……数えぬのが、金庫を守るやり方さ。", next:"c6_ep1_probe2" },
    { id:"c6_ep1_probe2", type:"dialogue", speaker:"narrator", location:MADO, bgmScene:"field",
      text:"免除封じのガレン。免除や猶予の存在を伏せ、払えぬ者を未納のまま放置する。免除の種類・要件・受給資格期間への算入を立て直す。",
      next:"c6_ep1_enc2" },
    { id:"c6_ep1_enc2", type:"encounter", speaker:"hero", location:MADO, bgmScene:"emotion",
      text:"免除封じのガレンが、伏せた申請書を盾に立ちはだかった。申請免除・法定免除・納付猶予・学生特例・産前産後免除の要件を、高密度に崩す。",
      encounter: enc(6, "過去問｜免除の種類・要件・受給資格への算入(小ボス)", { villain:"v_lt_menjo", exam:3 }),
      evidence:"ev_ch6_garen", next:"c6_ep1_ev2" },
    { id:"c6_ep1_ev2", type:"dialogue", speaker:"mina", location:MADO,
      text:"伏せの手口、証拠に残せました。法定免除は障害基礎年金の受給者など、申請免除は所得に応じ全額または一部に。猶予や学生特例は後から追納もできます。", next:"c6_ep1_reason" },
    { id:"c6_ep1_reason", type:"reasoning", speaker:"hero", location:MADO, bgmScene:"emotion",
      text:"申請免除、法定免除、納付猶予、学生特例、産前産後免除。――払えない一月を空白にせず受給資格へつなぐ条文だ。伏せることが、老後を削る細工だ。",
      reasoning:{ need:["ev_ch6_menjo","ev_ch6_garen"] },
      flags:{ c6_ep1_reasoned:1 }, next:"c6_ep1_biz" },

    /* 【制度側の事情】断定せず提示 */
    { id:"c6_ep1_biz", type:"dialogue", speaker:"nenkinji", location:MADO,
      text:"……免除を正すのは正しい。だが納める者が減れば、支える原資も痩せる。免除を広げれば、その分が誰かの肩に乗る。どちらも有限の原資の上に立っている。", next:"c6_ep1_hero2" },
    { id:"c6_ep1_hero2", type:"dialogue", speaker:"hero", location:MADO,
      text:"（原資が世代で回っているのは本当だ。……でも、免除を伏せて未納にするのは線引きじゃない。ただの切り捨てだ。）",
      next:"c6_ep1_end", ideologyChanges:{ fair:1, mgmt:1 }, flags:{ c6_ep1_saw_sides:1 } },
    { id:"c6_ep1_end", type:"dialogue", speaker:"narrator", location:MACHI, bgmScene:"field",
      text:"人は取り戻した免除の記録を握りしめ、初めて遠い明日に目を向けた。ノアは、追納できる期限と埋め直せる月を、慣れた手つきで書き添えてやった。",
      next:"c6_ep1_hook", flags:{ c6_ep1_done:1 }, questUpdate:{ qid:"q_ch06", state:"active", step:2 } },
    { id:"c6_ep1_hook", type:"dialogue", speaker:"noa", location:MACHI,
      text:"……ねえ調律師さん。本気でこの郷の『今は要らない』を正す気? だったら、わたしの話も聞いてほしい。いちばん近くの空白を、見過ごしかけた話を。", next:"c6_ep2_open" },

    /* ============================================================
       第2話「空白の期間」
       ノアの過去を掘り下げ加入。受給資格期間・合算対象期間・付加年金・任意加入。
       過去問(五肢択一・個数)混入。小ボス=期間断ちのカラン。
       ============================================================ */
    { id:"c6_ep2_open", type:"dialogue", speaker:"narrator", location:DAICHO, bgmScene:"emotion",
      text:"古い台帳の街並み。ノアは色あせた納付記録を開いた。育ての親のものだった。数え切れない空白の月の端に、『受給資格期間 不足』と記されていた。",
      next:"c6_ep2_noa1", flags:{ c6_ep2_start:1 } },
    { id:"c6_ep2_noa1", type:"dialogue", speaker:"noa", location:DAICHO, portrait:"sora", expression:"shock",
      text:"この一冊は、わたしを育ててくれた人。若い頃の未納が積もって、受給資格期間が足りないと言われた。……わたしは当時、制度を何も知らなかった。", next:"c6_ep2_noa2" },
    { id:"c6_ep2_noa2", type:"dialogue", speaker:"noa", location:DAICHO,
      text:"だから年金の全部を覚え直した。受給資格期間の数え方、合算対象期間、付加年金、任意加入。……もう二度と、無知のまま見過ごさないために。", next:"c6_ep2_mina1" },
    { id:"c6_ep2_mina1", type:"dialogue", speaker:"mina", location:DAICHO, portrait:"wiz",
      text:"……ノア。あなたの悔いは、制度そのものの難しさです。受給資格期間は、納付済・免除に合算対象期間を加えて数える。任意加入で後から満たす道もあります。", next:"c6_ep2_join" },
    { id:"c6_ep2_join", type:"dialogue", speaker:"noa", location:DAICHO, bgmScene:"emotion", expression:"angry",
      text:"……そうね。知らないままの空白は、いつか誰かの老後を潰す。それでも目の前の一人は諦めたくない。条件は一つ――間に合わなかった一人の顔を、忘れないこと。",
      next:"c6_ep2_kai1", relationshipChanges:{ cp6:1 }, flags:{ c6_noa_join:1 } },
    { id:"c6_ep2_kai1", type:"dialogue", speaker:"kai", location:DAICHO,
      text:"上等だ。間に合わなかった一人を忘れるやつは、おれが一番嫌いなんでな。ノア、遠慮なく使わせてもらう。", next:"c6_ep2_choice" },

    { id:"c6_ep2_choice", type:"choice", speaker:"hero", location:DAICHO, text:"ノアの知識を、どう使う?",
      choices:[
        { text:"受給資格期間と合算対象期間を、制度で一件ずつ数え直して回る",
          ideologyChanges:{ law:1, mgmt:1 }, flags:{ c6_ep2_path_law:1 }, next:"c6_ep2_probe" },
        { text:"空白が足りず受給を諦めさせられた側の声を、先に集める",
          ideologyChanges:{ human:1, relief:1 }, flags:{ c6_ep2_path_human:1 }, next:"c6_ep2_alt" }
      ]},
    { id:"c6_ep2_alt", type:"dialogue", speaker:"hero", location:DAICHO,
      text:"期間の数え方の前に、一人がいる。足りないと言われ諦めた者、任意加入を知らされなかった者。……ノア、あなたの育ての親の一冊から始めさせてください。", next:"c6_ep2_probe" },

    { id:"c6_ep2_probe", type:"dialogue", speaker:"narrator", location:DAICHO, bgmScene:"field",
      text:"受給資格期間と合算対象期間を混同させ、拾えるはずの月を数えぬ者がいた。数え違えれば、埋め直せる空白がそのまま老後の穴になる。",
      next:"c6_ep2_enc1", questUpdate:{ qid:"q_ch06", state:"active", step:3 } },
    { id:"c6_ep2_enc1", type:"encounter", speaker:"hero", location:DAICHO, bgmScene:"emotion",
      text:"未納のミノウが、受給資格期間の帳簿を霧の中で混ぜにきた。受給資格期間・合算対象期間・付加年金・任意加入被保険者を、本試験の問いで数え直す。",
      encounter: enc(6, "過去問｜受給資格期間・合算対象期間・付加年金を問う", { villain:"v_mino", exam:2 }),
      evidence:"ev_ch6_kikan", next:"c6_ep2_ev1" },
    { id:"c6_ep2_ev1", type:"dialogue", speaker:"noa", location:DAICHO,
      text:"受給資格期間は、納めた月と免除された月に合算対象期間を足して数える。任意加入で足りない期間を後から満たせる。……次は、期間そのものを断つ査定人だ。", next:"c6_ep2_karan1" },
    { id:"c6_ep2_karan1", type:"dialogue", speaker:"karan", location:DAICHO, portrait:"e_nabakari", expression:"angry",
      text:"受給資格期間? 足りておらんな。その未納の月は、もう数えられん。……合算対象期間? 任意加入? はて、そんな抜け道があったかな。", next:"c6_ep2_probe2" },
    { id:"c6_ep2_probe2", type:"dialogue", speaker:"narrator", location:MADO, bgmScene:"field",
      text:"期間断ちのカラン。合算対象期間や任意加入を伏せ、受給資格期間を欠かして老齢基礎年金を諦めさせる。算定の筋を立て直す。",
      next:"c6_ep2_enc2" },
    { id:"c6_ep2_enc2", type:"encounter", speaker:"hero", location:MADO, bgmScene:"emotion",
      text:"期間断ちのカランが、欠かした期間の帳簿を盾に立ちはだかった。受給資格期間・合算対象期間・付加年金・任意加入を、高密度に崩す。ノアの一冊の空白だ。",
      encounter: enc(6, "過去問｜受給資格期間・合算対象・任意加入(小ボス)", { villain:"v_lt_kikan", exam:3 }),
      evidence:"ev_ch6_karan", next:"c6_ep2_ev2" },
    { id:"c6_ep2_ev2", type:"dialogue", speaker:"mina", location:MADO,
      text:"期間の筋、通しました。合算対象期間は年金額には反映されませんが、受給資格期間には算入される。……『もう数えられん』は、拾える月を伏せた欠かしでした。", next:"c6_ep2_reason" },
    { id:"c6_ep2_reason", type:"reasoning", speaker:"hero", location:MADO, bgmScene:"emotion",
      text:"受給資格期間、合算対象期間、付加年金、任意加入。――空白の月を老後の受給へつなぎ直す条文だ。伏せて欠かせば、一人の老後が空白へ落ちる。",
      reasoning:{ need:["ev_ch6_kikan","ev_ch6_karan"] },
      flags:{ c6_ep2_reasoned:1 }, next:"c6_ep2_biz" },

    /* 【行政/制度側の事情】断定せず、次話の壁として残す */
    { id:"c6_ep2_biz", type:"dialogue", speaker:"nenkinji", location:MADO, expression:"shock",
      text:"……期間に線を引くのにも理由はある。無条件に埋め直せば、真面目に納め続けた者との釣り合いが崩れる。私は、世代の均衡を守っているつもりだった。", next:"c6_ep2_hero2" },
    { id:"c6_ep2_hero2", type:"dialogue", speaker:"hero", location:MADO,
      text:"（世代のたすきと、期間を欠かす細工。この人も混ぜている。線は引ける。欠かしは弾ける。均衡の名目で、一人の老後を葬ってはいけない。）",
      next:"c6_ep2_end", ideologyChanges:{ fair:1, mgmt:1 }, flags:{ c6_ep2_saw_sides:1 } },
    { id:"c6_ep2_end", type:"dialogue", speaker:"narrator", location:DAICHO, bgmScene:"field",
      text:"ノアは育ての親の一冊を、そっと台帳の一番上に戻した。『次は、誰の空白も見過ごさない』――その横顔に、見過ごしかけた悔いがあった。",
      next:"c6_ep2_hook", flags:{ c6_ep2_done:1 }, questUpdate:{ qid:"q_ch06", state:"active", step:4 } },
    { id:"c6_ep2_hook", type:"dialogue", speaker:"noa", location:DAICHO, expression:"angry",
      text:"……でもね、小ボスを何人正しても板挟みは消えない。『今は要らない』という先送りそのものが、今日と見えない老後を天秤にかけて立ってるの。", next:"c6_ep3_open" },

    /* ============================================================
       第3話「黄昏の天秤」
       テーマの歪みそのものと対峙する引き。制度/行政/経営側の事情ビートを断定せず提示。
       師匠ゼンの影を1本繋ぐ。章ボス【コクネン仙人 v_boss_s6】への引き。
       ============================================================ */
    { id:"c6_ep3_open", type:"dialogue", speaker:"narrator", location:DAIN, bgmScene:"emotion",
      text:"郷の中央、法典広間。今日を選んで未納を重ねた者の列と、老後に空白を抱えて立ち尽くす者の列が、皮肉に向かい合っていた。",
      next:"c6_ep3_noa1", flags:{ c6_ep3_start:1 } },
    { id:"c6_ep3_noa1", type:"dialogue", speaker:"noa", location:DAIN, portrait:"sora",
      text:"見て。ここにいる人たち、みんな『今は要らない』を選んだ側。……そのしわ寄せが向かいの列に回る。今日を選ぶたび、明日の原資が未来の自分から抜かれていた。", next:"c6_ep3_mina1" },
    { id:"c6_ep3_mina1", type:"dialogue", speaker:"mina", location:DAIN, portrait:"wiz",
      text:"老齢基礎年金は老後の支え。障害基礎年金は障害を負ったときに。遺族基礎年金は遺された子や配偶者に。……今日を先送りすれば、届くはずの明日が空白になります。", next:"c6_ep3_zen" },
    { id:"c6_ep3_zen", type:"dialogue", speaker:"narrator", location:DAIN, bgmScene:"emotion",
      text:"広間の古い国年台帳。表紙の裏に掠れた字。『今日を生きる者に、見えぬ明日の値札を突きつけるな。だが、その明日を黙って削らせるな』――師匠ゼンの筆跡。",
      next:"c6_ep3_choice", flags:{ c6_zen_ash6:1 } },

    { id:"c6_ep3_choice", type:"choice", speaker:"hero", location:DAIN, text:"『今は要らない』の歪みに、どう立つ?",
      choices:[
        { text:"老齢・障害・遺族の基礎年金と任意加入まで、条文で正しく張り直す",
          ideologyChanges:{ law:1, fair:1 }, flags:{ c6_ep3_path_law:1 }, next:"c6_ep3_probe" },
        { text:"今日を選んだ者、老後に空白を抱えた者、双方の理由をまず問う",
          ideologyChanges:{ human:1, mgmt:1 }, flags:{ c6_ep3_path_ask:1 }, next:"c6_ep3_alt" }
      ]},
    { id:"c6_ep3_alt", type:"dialogue", speaker:"hero", location:DAIN,
      text:"先送りを責める前に、理由がある。今日の暮らしを選ぶしかなかった者。老いて初めて空白に気づいた者。……そこからしか、今日と明日はつなぎ直せない。", next:"c6_ep3_probe" },

    { id:"c6_ep3_probe", type:"dialogue", speaker:"narrator", location:DAIN, bgmScene:"field",
      text:"『先の話だ』を理由に、老齢も障害も遺族も任意加入も握り潰す手先が最後の抵抗に出た。その一枚を剥がす。",
      next:"c6_ep3_enc1", questUpdate:{ qid:"q_ch06", state:"active", step:5 } },
    { id:"c6_ep3_enc1", type:"encounter", speaker:"hero", location:DAIN, bgmScene:"emotion",
      text:"未納のミノウが再び現れた。老齢基礎年金・障害基礎年金・遺族基礎年金・任意加入の筋を、本試験の問いで崩す。隠された明日の支えを取り戻す。",
      encounter: enc(6, "過去問｜老齢・障害・遺族基礎年金・任意加入を取り戻す", { villain:"v_mino", exam:2 }),
      evidence:"ev_ch6_kiso", next:"c6_ep3_ev1" },
    { id:"c6_ep3_ev1", type:"dialogue", speaker:"noa", location:DAIN,
      text:"老齢基礎年金は受給資格期間を満たせば老後に。障害基礎年金は要件を満たす者に。遺族基礎年金は子のある配偶者や子に。……握り潰させはしない。", next:"c6_ep3_reason" },
    { id:"c6_ep3_reason", type:"reasoning", speaker:"hero", location:DAIN, bgmScene:"emotion",
      text:"免除、猶予、学生特例、受給資格期間、合算対象、付加年金、任意加入、老齢・障害・遺族。――今日の一月を明日へ届ける条文だ。先送りが、明日ごと削る。",
      reasoning:{ need:["ev_ch6_kiso"] },
      flags:{ c6_ep3_reasoned:1 }, next:"c6_ep3_biz" },

    /* 【制度/行政/経営側の事情】断定せず、章ボスへの問いとして残す */
    { id:"c6_ep3_biz", type:"dialogue", speaker:"nenkinji", location:DAIN, expression:"shock",
      text:"……分かった。だが私の背後に立つものは大きい。今日の暮らしを守ろうとする者と、明日の空白を恐れる制度が、長く綱を引き合ってきた天秤だ。", next:"c6_ep3_boss_hook" },
    { id:"c6_ep3_boss_hook", type:"dialogue", speaker:"kokunen", location:DAIN, portrait:"e_gizo", expression:"angry",
      text:"――納めたか? 明日は残ったか? 今は要らぬだろう。老いは遠い。……その『後で』の先に残るのは空白だ。困るのは、ずっと先の老いたお前だけさ。",
      next:"c6_ep3_hero_final", flags:{ c6_boss_next:1 } },
    { id:"c6_ep3_hero_final", type:"dialogue", speaker:"hero", location:DAIN,
      text:"抗う。カイも、ミナも、ノアもいる。今日を選ぶしかなかった者も、空白を抱えた者も顔を上げた。……その板挟みを、国年の全体像で引き受けに行く。", next:"c6_ep3_end" },
    { id:"c6_ep3_end", type:"dialogue", speaker:"narrator", location:DAIN, bgmScene:"field",
      text:"ノスタで、先送りの口癖が初めて『見えない明日の重さ』とともに言い返された。だが郷の奥に立つ影――コクネン仙人との対峙は、まだこれからだ。",
      next:null, flags:{ c6_ep3_done:1, c6_ch06_done:1 },
      questUpdate:{ qid:"q_ch06", state:"done", step:6 } }
  ];

  /* 第1〜3話(章前半)クエスト定義(doneFlag で完了判定)。第一〜五章の各クエストは無改変の別クエスト。 */
  if(typeof S.registerQuest==="function"){
    S.registerQuest("q_ch06", {
      title:"明日を捨てない",
      chapter:"ch06",
      steps:["今は要らない、の街","空白の期間","黄昏の天秤"],
      doneFlag:"c6_ch06_done"
    });
  }

  S.register("ch06", NODES);
  S.CH06_ID = "ch06";

  /* メイン章の背骨(S.MAIN)へ、第五章(ch05b)の続きとして追記する。
     ・第五章クリア(c5_ch05b_done)後、ホームの「今日の冒険」が自動で本章へ進む導線になる。
     ・章選択画面は前章 done まで locked=第五章クリアが解放ゲートとして機能する(既存規則に沿う)。
     ・S.MAIN 未ロード/未定義でも安全(存在する時だけ push、重複登録も防ぐ)。 */
  if(Array.isArray(S.MAIN)){
    var exists = false;
    for(var i=0;i<S.MAIN.length;i++){ if(S.MAIN[i] && S.MAIN[i].id==="ch06"){ exists = true; break; } }
    if(!exists){
      S.MAIN.push({ id:"ch06", no:"第六章", title:"明日を捨てない", loc:"黄昏の郷ノスタ",
        doneFlag:"c6_ch06_done", startedFlag:"c6_ep1_start" });
    }
  }
})();
