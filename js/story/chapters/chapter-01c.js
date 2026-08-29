"use strict";
/* ============================================================
   story/chapters/chapter-01c.js — 第一章「鐘の鳴らない工都」第7〜10話 + 章ボス戦
   docs/story-bible.md / ENDING-CANON 準拠。chapter-01b.js の末尾(c1_ch01b_done /
   c1_boss_next)から地続きの四話を、別 chapterId="ch01c" で綴じ込む。
   ・第7話「鋼鉄の記憶」…安全配慮・安全衛生管理体制(安衛=subject1)／中ボス 鋼鉄のフェロウ
                          =自社と従業員を守るための厳しさ(過去=自分は耐えた)を強めに描く。
   ・第8話「灰の設計図」…就業規則・周知/労働時間規制の全体像(労基=subject0)／小ボス 灰紙のグレイ
                          =師匠ゼン・クロイツの署名の連なり。師匠の影を濃く(c1_zen_*)。
   ・第9話「決戦前夜」…レンの死が告げられる。手帳の最後の一行(謝るのは働かされた側)を受け、
                        戦う意味を言葉にする。章クリア後の実話幕(電通事件)へ直結する山場。
   ・第10話「鐘を鳴らす者」…章ボス【鉄血監督官グラウス v_mid_graus】戦=【章末問題集】
                          (これまでの労基/安衛の過去問=examFmt中心の高難度セット)。
                          撃破後は断定的勝利にせず、「間を取り持つ」テーマへ橋渡し。
   ・各話に必ず「経営者の事情」ビートを置き、従業員側にも一部質の悪い者がいる課題の芽を混ぜる
     (断定せず提示)。過去問演習(examFmt=五肢択一/個数)を継続。
   ・chapter-01.js / chapter-01b.js のノード/quest/ID/証拠/分岐は一切改変しない(別ファイル・別章)。
   ・戦闘接続は既存の橋(story-encounter / story-battle-bridge)。encounter に villain と
     exam(examFmt 混入数)を持たせるだけで、採点・SRS・報酬・問題データには一切触れない。
     ボス戦も新規採点系を作らず、examFmt を多く混ぜた高難度 encounter として既存橋へ委譲する。
   ・eval/new Function ゼロ。全ノードはデータのみ(next は文字列 or {then,else} or null)。
   ・立てるフラグ: c1_ep7_done〜c1_ep10_done(gates と一致)/ c1_boss_cleared / c1_ch01c_done。
     q_ch01(本編クエスト)は無改変。章クリア演出は S3 側。ここは boss_cleared までを確定する。
   ============================================================ */
(function(){
  var G = (typeof window!=="undefined") ? window : globalThis;
  var S = G.SRStory;
  if(!S || typeof S.register!=="function") return;   /* エンジン未ロードでも安全 */

  /* 第7〜10話の話者を表示名テーブルへ追記(描画層があれば。無ければ素通し)。
     zen は既存(story-dialogue-renderer.js の SPEAKERS)。ferro/graus のみ追記する。 */
  if(S.SPEAKERS && typeof S.SPEAKERS==="object"){
    if(!S.SPEAKERS.ferro) S.SPEAKERS.ferro = { name:"鋼鉄のフェロウ", px:"e_ferro" };
    if(!S.SPEAKERS.graus) S.SPEAKERS.graus = { name:"監督官 グラウス", px:"e_graus" };
  }

  var FORGE = "工都ベルガ・中央溶鉱炉";
  var ARCH  = "工都ベルガ・統制局書庫";
  var HEARTH= "第七工場・宿舎";
  var BELL  = "工都ベルガ・大鐘楼";

  /* 演習 encounter。opts で相手(villain)と過去問混入数(exam=examFmt の本数)・出題数(n)を指定。
     kind:"train" のまま既存の橋(start*)へ委譲する。ボス戦は exam/n を大きくした高難度セット。 */
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
       第7話「鋼鉄の記憶」
       安全配慮・安全衛生管理体制(安衛)。中ボス=鋼鉄のフェロウ。
       経営者の厳しさの由来(失った指)を強めに。従業員側の質の芽も提示。
       ============================================================ */
    { id:"c1_ep7_open", start:true, type:"dialogue", speaker:"narrator", location:FORGE, bgmScene:"emotion",
      text:"通達を辿った先は、工都の心臓――中央溶鉱炉。火の粉の舞う闇の奥に、古い鉄槌を提げた大男が立っていた。",
      next:"c1_ep7_intro", flags:{ c1_ep7_start:1 },
      questUpdate:{ qid:"q_ch01c", state:"active", step:0 } },
    { id:"c1_ep7_intro", type:"dialogue", speaker:"narrator", location:FORGE,
      text:"休憩も、交代も、健診もない。ここでは倒れることが日常で、日常は自己責任だった。この炉を回すのが、グラウス配下の――鋼鉄のフェロウ。", next:"c1_ep7_ferro1" },
    { id:"c1_ep7_ferro1", type:"dialogue", speaker:"ferro", location:FORGE, portrait:"e_ferro", expression:"angry",
      text:"俺は若い頃、三日、炉の前に立ち続けた。それでも生きている。……だから言うんだ。『それくらい、耐えろ』と。", next:"c1_ep7_ferro2" },
    { id:"c1_ep7_ferro2", type:"dialogue", speaker:"ferro", location:FORGE,
      text:"人を休ませれば、炉は止まる。炉が止まれば、工員三百人が明日食えない。俺は、そいつらを飢えさせないために、鬼になった。", next:"c1_ep7_hero1" },
    { id:"c1_ep7_hero1", type:"dialogue", speaker:"hero", location:FORGE,
      text:"（耐えた人が、耐えろと言う。……守るための厳しさは、嘘じゃない。だが、耐えられなかった人を数えない仕組みは、守ることじゃない。）", next:"c1_ep7_bad" },
    { id:"c1_ep7_bad", type:"dialogue", speaker:"mina", location:FORGE, portrait:"mina",
      text:"……一つ、気になる記録が。ベテランの何人かは、休憩を『要らない』と自分から返上していました。無理は、上だけが作るとは限らない――のかもしれません。", next:"c1_ep7_kai1" },
    { id:"c1_ep7_kai1", type:"dialogue", speaker:"kai", location:FORGE, expression:"angry",
      text:"返上する奴がいるのも本当だ。おれも現場にいたから分かる。……だがな、だから休ませなくていい理由にはならねぇ。仕組みで守る。まずそこからだ。", next:"c1_ep7_choice" },

    { id:"c1_ep7_choice", type:"choice", speaker:"hero", location:FORGE, text:"フェロウと、どう向き合う?",
      choices:[
        { text:"人は根性では守れないと、実態と法で示す",
          ideologyChanges:{ law:1, relief:1 }, flags:{ c1_ep7_path_law:1 }, next:"c1_ep7_probe" },
        { text:"まず、この人が守ろうとした三百人の暮らしを受け止める",
          ideologyChanges:{ human:1, mgmt:1 }, flags:{ c1_ep7_path_human:1 }, next:"c1_ep7_alt" }
      ]},
    { id:"c1_ep7_alt", type:"dialogue", speaker:"hero", location:FORGE,
      text:"あなたが背負ってきたものは分かります。……でも、その重さごと、もっといい形にできる。潰すためじゃない。続けるために、正すんです。", next:"c1_ep7_probe" },

    { id:"c1_ep7_probe", type:"dialogue", speaker:"narrator", location:FORGE, bgmScene:"field",
      text:"返上された休憩、途切れない交代表、白紙の健診台帳。フェロウの『鬼』が守ってきたものと、奪ってきたものを、証拠で分けていく。",
      next:"c1_ep7_enc1", questUpdate:{ qid:"q_ch01c", state:"active", step:1 } },
    { id:"c1_ep7_enc1", type:"encounter", speaker:"hero", location:FORGE,
      text:"まずは体制から。産業医も、衛生委員会も、健診の記録もない。安衛法は、人の異変に気づく仕組みを事業者に義務づけている。",
      encounter: enc(1, "炉の健診台帳を検める", { villain:"v_nord", exam:1 }),
      evidence:"ev_ch1c_scaffold", next:"c1_ep7_ev1" },
    { id:"c1_ep7_ev1", type:"dialogue", speaker:"mina", location:FORGE,
      text:"健診の未受診が三年分。面接指導の記録はゼロ。……そして安全衛生管理体制そのものが、この炉には敷かれていません。", next:"c1_ep7_enc2" },
    { id:"c1_ep7_enc2", type:"encounter", speaker:"hero", location:FORGE, bgmScene:"emotion",
      text:"フェロウが鉄槌を構えた。中ボス――鋼鉄のフェロウ。事業者の安全配慮と安全衛生管理体制を、本試験の問いで正面から問う。",
      encounter: enc(1, "過去問｜安全配慮義務・管理体制を問う", { villain:"v_mid_ferro", exam:2 }),
      evidence:"ev_ch1c_ferro", next:"c1_ep7_ev2" },
    { id:"c1_ep7_ev2", type:"dialogue", speaker:"narrator", location:FORGE,
      text:"フェロウは鉄槌を下ろした。振り上げた腕が、初めて震えていた。『……仕組みで守る、か。俺は、根性でしか守り方を知らなかった』と、絞り出すように。", next:"c1_ep7_reason" },
    { id:"c1_ep7_reason", type:"reasoning", speaker:"hero", location:FORGE, bgmScene:"emotion",
      text:"途切れない交代、空白の健診、体制の不在。――これは本人の頑張りすぎではない。人の限界を見る仕組みを置かなかった、事業者の責任だ。",
      reasoning:{ need:["ev_ch1c_scaffold","ev_ch1c_ferro"] },
      flags:{ c1_ep7_reasoned:1 }, next:"c1_ep7_biz" },

    /* 【経営者の事情】断定せず、伏線を濃くする */
    { id:"c1_ep7_biz", type:"dialogue", speaker:"ferro", location:FORGE,
      text:"……俺は間違っていたのか? だが人を休ませた工場は、みんな潰れた。潰れた工場の工員は、どこへ行った? 誰も、その先を教えてくれなかった。", next:"c1_ep7_hero2" },
    { id:"c1_ep7_hero2", type:"dialogue", speaker:"hero", location:FORGE,
      text:"（正しさだけでは、この人を納得させられない。人を守りながら回る炉を、まだ誰も見せられていない。……それを見つけるのが、おれの役目かもしれない。）",
      next:"c1_ep7_zen", ideologyChanges:{ mgmt:1 }, flags:{ c1_ep7_saw_sides:1 } },
    { id:"c1_ep7_zen", type:"evidence", speaker:"narrator", location:FORGE, bgmScene:"emotion", expression:"shock",
      text:"炉の隅に、煤まみれの図面が落ちていた。『交代基準・草案』――炉を止めずに人を休ませる設計。署名は掠れて、ゼ…ク…と読めた。師匠の、若い日の字だ。",
      evidence:"ev_ch1c_draft", flags:{ c1_zen_draft:1 }, next:"c1_ep7_end" },
    { id:"c1_ep7_end", type:"dialogue", speaker:"narrator", location:FORGE, bgmScene:"field",
      text:"かつて師匠は、人と炉の両立を設計していた。ならばなぜ、その同じ手が『止めるな』の通達を撒いたのか。矛盾が、霧のように立ち込めた。",
      next:"c1_ep7_hook", flags:{ c1_ep7_done:1 }, questUpdate:{ qid:"q_ch01c", state:"active", step:2 } },
    { id:"c1_ep7_hook", type:"dialogue", speaker:"kai", location:FORGE, expression:"angry",
      text:"あんたの師匠、昔は工員を守ろうとしてたのか。……なら、途中で何があった。おれは、その答えを見に行く。統制局の、書庫だ。", next:"c1_ep8_open" },

    /* ============================================================
       第8話「灰の設計図」
       就業規則・周知/労働時間規制の全体像(労基)。小ボス=灰紙のグレイ。師匠の影を濃く。
       ============================================================ */
    { id:"c1_ep8_open", type:"dialogue", speaker:"narrator", location:ARCH, bgmScene:"emotion",
      text:"統制局の書庫は、灰色の紙の海だった。工都じゅうへ配られた通達の版木が、棚という棚に並んでいる。すべての元凶が、ここで刷られていた。",
      next:"c1_ep8_scene", flags:{ c1_ep8_start:1 } },
    { id:"c1_ep8_scene", type:"dialogue", speaker:"mina", location:ARCH, portrait:"mina",
      text:"通達を古い順に並べました。……最初の一枚は、人を守る内容です。『鐘が鳴れば、機械を止めよ』。署名は――ゼン・クロイツ。", next:"c1_ep8_zen1" },
    { id:"c1_ep8_zen1", type:"dialogue", speaker:"zen", location:ARCH, portrait:"zen", expression:"shock",
      text:"（回想の声）……守れ。人を、まず守れ。法は、弱い者の側に立つ杖だ。鐘が鳴ったら、迷わず止めろ。", next:"c1_ep8_hero1", flags:{ c1_zen_voice:1 } },
    { id:"c1_ep8_hero1", type:"dialogue", speaker:"hero", location:ARCH,
      text:"（この字だ。間違いない。師匠は、人を守る通達を書いていた。……なのに、いつ『止めるな』に書き換わったんだ。）", next:"c1_ep8_bad" },
    { id:"c1_ep8_bad", type:"dialogue", speaker:"mina", location:ARCH,
      text:"変わり目に、一件の記録が挟まっていました。休みを悪用し、仲間の分まで手を抜いて工場を傾けた一団がいた、と。……師匠が何を見て筆を変えたのかは、断定できませんが。", next:"c1_ep8_kai1" },
    { id:"c1_ep8_kai1", type:"dialogue", speaker:"kai", location:ARCH, expression:"angry",
      text:"ずるい奴がいたのも、たぶん本当だ。それで師匠が人間に絶望したのも、あるかもしれねぇ。だがな、一部の悪さで全員を縛るのは、順番が違う。", next:"c1_ep8_choice" },

    { id:"c1_ep8_choice", type:"choice", speaker:"hero", location:ARCH, text:"変質の理由を、どう受け止める?",
      choices:[
        { text:"人への失望ではなく、制度の欠陥だったと考える",
          ideologyChanges:{ fair:1, law:1 }, flags:{ c1_ep8_path_system:1 }, next:"c1_ep8_probe" },
        { text:"師匠の弱さも人間のうちだと、まず受け止める",
          ideologyChanges:{ human:1, relief:1 }, flags:{ c1_ep8_path_human:1 }, next:"c1_ep8_alt" }
      ]},
    { id:"c1_ep8_alt", type:"dialogue", speaker:"hero", location:ARCH,
      text:"師匠も迷ったんだ。守りたかったのに、守られる側に裏切られて。……それでも、答えを間違えた。責めるより先に、なぜを確かめたい。", next:"c1_ep8_probe" },

    { id:"c1_ep8_probe", type:"dialogue", speaker:"narrator", location:ARCH, bgmScene:"field",
      text:"書き換えられた通達、貼られただけの就業規則、届出のない三六協定。灰の設計図を、一枚ずつ証拠へ変えていく。",
      next:"c1_ep8_enc1", questUpdate:{ qid:"q_ch01c", state:"active", step:3 } },
    { id:"c1_ep8_enc1", type:"encounter", speaker:"hero", location:ARCH,
      text:"棚の陰で判子を彫る者がいた。偽の労働者代表を仕立て、届出なき上限で働かせる――三六協定の根を、実態で断つ。",
      encounter: enc(0, "偽られた労使協定を検証する", { villain:"v_mog", exam:1 }),
      evidence:"ev_ch1c_woodblock", next:"c1_ep8_ev1" },
    { id:"c1_ep8_ev1", type:"dialogue", speaker:"mina", location:ARCH,
      text:"就業規則は作られていましたが、誰にも知らされていません。周知のない規則は、拘束力の土台を欠く。……版木の番人が、来ます。", next:"c1_ep8_enc2" },
    { id:"c1_ep8_enc2", type:"encounter", speaker:"hero", location:ARCH, bgmScene:"emotion",
      text:"通達を刷る番人が現れた。灰紙のグレイ。就業規則の作成・周知と労働時間規制の全体像を、本試験の問いで問い詰める。",
      encounter: enc(0, "過去問｜就業規則・周知/労働時間を問う", { villain:"v_lt_grey", exam:2 }),
      evidence:"ev_ch1c_grey", next:"c1_ep8_ev2" },
    { id:"c1_ep8_ev2", type:"dialogue", speaker:"narrator", location:ARCH,
      text:"グレイは刷りかけの版木を取り落とした。『……私はただ刷るだけ。命じたのは、上だ』。指さす先は、書庫の最奥――大鐘楼へ続く扉だった。", next:"c1_ep8_reason" },
    { id:"c1_ep8_reason", type:"reasoning", speaker:"hero", location:ARCH, bgmScene:"emotion",
      text:"偽の協定、知らされない規則、書き換えられた通達。――工都の消耗は、事故ではなく設計だ。その設計図の最初の一枚には、人を守る言葉が書かれていた。",
      reasoning:{ need:["ev_ch1c_woodblock","ev_ch1c_grey"] },
      flags:{ c1_ep8_reasoned:1 }, next:"c1_ep8_zen2" },
    { id:"c1_ep8_zen2", type:"dialogue", speaker:"narrator", location:ARCH, bgmScene:"emotion",
      text:"最後の通達の隅に、震える追記があった。『これは、あの子らを守るための、必要悪だ』。師匠の筆跡は、そこで途切れていた。守るための、悪。矛盾が、名を得た。",
      next:"c1_ep8_biz", flags:{ c1_zen_turn:1 } },

    /* 【経営者の事情】 */
    { id:"c1_ep8_biz", type:"dialogue", speaker:"foreman", location:ARCH,
      text:"……ゼン殿は言った。『炉を止めれば街が死ぬ。ならば人を、少しずつ削るしかない』と。私たちは、その理屈に縋った。楽だったからだ。考えなくて、済むから。", next:"c1_ep8_hero2" },
    { id:"c1_ep8_hero2", type:"dialogue", speaker:"hero", location:ARCH,
      text:"（守るための悪。……それは、悪だ。だが単純に断罪して、街の明日は来るのか。師匠が逃げた問いから、おれは逃げない。）",
      next:"c1_ep8_end", ideologyChanges:{ mgmt:1, fair:1 }, flags:{ c1_ep8_saw_sides:1 } },
    { id:"c1_ep8_end", type:"dialogue", speaker:"narrator", location:ARCH, bgmScene:"field",
      text:"設計図の全貌が見えた。工都の消耗を統べているのは、鐘楼に立つ一人――鉄血監督官グラウス。師匠の理屈を、最も忠実に実行した男だった。",
      next:"c1_ep8_hook", flags:{ c1_ep8_done:1 }, questUpdate:{ qid:"q_ch01c", state:"active", step:4 } },
    { id:"c1_ep8_hook", type:"dialogue", speaker:"kai", location:ARCH, expression:"angry",
      text:"……明日だ。明日、鐘楼へ乗り込む。その前に――今夜くらい、飯を食おう。何のために戦うのか、ちゃんと言葉にしてからな。", next:"c1_ep9_open" },

    /* ============================================================
       第9話「決戦前夜」
       仲間(カイ/ミナ)との会話で覚悟を固める。戦う意味の総括。戦闘なし。
       ============================================================ */
    { id:"c1_ep9_open", type:"dialogue", speaker:"narrator", location:HEARTH, bgmScene:"town",
      text:"第七工場の宿舎。粗末な鍋を囲んだところへ、カイが一枚の紙を握りしめて入ってきた。手が、止まっていた。",
      next:"c1_ep9_kai1", flags:{ c1_ep9_start:1 } },
    { id:"c1_ep9_kai1", type:"dialogue", speaker:"kai", location:HEARTH, portrait:"kai",
      text:"……レンが、死んだ。倒れてから、一度も目を覚まさずに。二十四歳だ。入って、二年目だった。", next:"c1_ep9_kai2" },
    { id:"c1_ep9_kai2", type:"dialogue", speaker:"kai", location:HEARTH,
      text:"枕元に、手帳があったってよ。最後の一行だけ、読ませてもらった。――『今日も、朝が来る前には帰れませんでした。ごめんなさい。』", next:"c1_ep9_hero1" },
    { id:"c1_ep9_hero1", type:"dialogue", speaker:"hero", location:HEARTH,
      text:"（謝ったのは、レンのほうだった。……働かせた側ではなく、働かされた側が。）", next:"c1_ep9_mina1" },
    { id:"c1_ep9_mina1", type:"dialogue", speaker:"mina", location:HEARTH, portrait:"mina",
      text:"数字で言えば、グラウスの統制で生産は伸び、賃金も上がりました。……その数字が本物だから、厄介なんです。レンが減ったことだけが、統計から抜け落ちている。", next:"c1_ep9_mina2" },
    { id:"c1_ep9_mina2", type:"dialogue", speaker:"mina", location:HEARTH,
      text:"わたしたちが突きつけるのは、正義の叫びじゃない。抜け落ちた一人を、もう一度数えること。……それが、明日の戦いの意味だと思います。", next:"c1_ep9_choice" },

    { id:"c1_ep9_choice", type:"choice", speaker:"hero", location:HEARTH, text:"覚悟を、言葉にする。",
      choices:[
        { text:"「倒す」ためでなく「正して、続けさせる」ために戦う",
          ideologyChanges:{ fair:1, mgmt:1 }, flags:{ c1_ep9_vow_bridge:1 }, next:"c1_ep9_vow" },
        { text:"抜け落ちた一人を数え直す、その一点のために戦う",
          ideologyChanges:{ human:1, relief:1 }, flags:{ c1_ep9_vow_count:1 }, next:"c1_ep9_vow" }
      ]},
    { id:"c1_ep9_vow", type:"dialogue", speaker:"hero", location:HEARTH, bgmScene:"emotion",
      text:"おれたちは、経営者を敵にしない。労働者を甘やかしもしない。両方の間に立って、この国の働き方を少しだけまともにする。……その第一歩が、明日だ。", next:"c1_ep9_zen" },
    { id:"c1_ep9_zen", type:"dialogue", speaker:"hero", location:HEARTH, bgmScene:"emotion",
      text:"（師匠。あなたが投げ出した問いを、おれが引き受けます。守るための悪じゃない。守るための、仕組みを。……それを、あなたに見せに行く。）",
      next:"c1_ep9_end", flags:{ c1_zen_resolve:1 } },
    { id:"c1_ep9_end", type:"dialogue", speaker:"narrator", location:HEARTH, bgmScene:"field",
      text:"鍋は冷めたまま、灯りが消えた。眠れぬ夜が明ければ、鐘楼の鐘が鳴る。今度こそ、誰かがその鐘を、正しく鳴らすために。",
      next:"c1_ep9_hook", flags:{ c1_ep9_done:1 }, questUpdate:{ qid:"q_ch01c", state:"active", step:5 } },
    { id:"c1_ep9_hook", type:"dialogue", speaker:"narrator", location:HEARTH,
      text:"夜明け。三人は、鐘楼へ続く長い階段を、無言で登り始めた。", next:"c1_ep10_open" },

    /* ============================================================
       第10話「鐘を鳴らす者」— 章ボス【鉄血監督官グラウス v_mid_graus】戦
       【章末問題集】=これまでの労基/安衛の過去問を集めた高難度セット(examFmt中心・タイト)。
       登場アニメ+ブリーフィングは story-encounter が villain から自動生成する。
       ============================================================ */
    { id:"c1_ep10_open", type:"dialogue", speaker:"narrator", location:BELL, bgmScene:"emotion",
      text:"大鐘楼の頂。止まらぬ歯車の中心で、あの男が待っていた。鉄血監督官グラウス――第三ラインの借りを、返しに来た。",
      next:"c1_ep10_appear", flags:{ c1_ep10_start:1 } },
    { id:"c1_ep10_graus1", type:"dialogue", speaker:"graus", location:BELL, portrait:"e_graus", expression:"angry",
      text:"よく来た、調律師。数字を見せてやろう。生産は伸び、賃金も伸びた。私は工都を豊かにした。……人が一人減った? それは、統計の誤差だ。", next:"c1_ep10_hero1" },
    { id:"c1_ep10_appear", type:"dialogue", speaker:"narrator", location:BELL,
      text:"グラウスが掲げた通達――最初の一枚は師匠の筆で『人を守れ』、最後の一枚は同じ筆で『止めるな』。彼は、その両方を掲げていた。", next:"c1_ep10_graus1" },
    { id:"c1_ep10_hero1", type:"dialogue", speaker:"hero", location:BELL,
      text:"誤差じゃない。レンには名前があった。二十四歳で、入って二年目で、最後まで謝っていた。……今日は、その誤差という言葉を、法で崩す。", next:"c1_ep10_kai1" },
    { id:"c1_ep10_kai1", type:"dialogue", speaker:"kai", location:BELL, expression:"angry",
      text:"御託はいい。おれたちが積み上げた過去問の全部を、ここでぶつける。……鐘を鳴らす番だ、調律師。", next:"c1_ep10_brief" },
    { id:"c1_ep10_brief", type:"dialogue", speaker:"narrator", location:BELL, bgmScene:"emotion",
      text:"これは総決算。労基と安衛――工都で暴いてきた歪みのすべてが、【章末問題集】として襲いかかる。読んで、判断しろ。当てずっぽうは、一問も通らない。",
      next:"c1_ep10_enc1", questUpdate:{ qid:"q_ch01c", state:"active", step:6 } },
    { id:"c1_ep10_enc1", type:"encounter", speaker:"hero", location:BELL, bgmScene:"emotion",
      text:"第一幕・労基編。労働時間、割増賃金、管理監督者、三六協定、解雇――これまでの労基の過去問を、高密度の五肢択一・個数で叩き込む。",
      encounter: enc(0, "章末問題集｜労基編(高難度)", { villain:"v_mid_graus", n:12, exam:8 }),
      evidence:"ev_ch1c_boss_rouki", next:"c1_ep10_mid" },
    { id:"c1_ep10_mid", type:"dialogue", speaker:"graus", location:BELL, expression:"shock",
      text:"……ほう。労基は越えたか。だが安全は別だ。人が保つかどうかは、本人の資質の問題だ。フェロウがそう証明した。……その『甘さ』を、次の一幕で思い知れ。", next:"c1_ep10_enc2" },
    { id:"c1_ep10_enc2", type:"encounter", speaker:"hero", location:BELL, bgmScene:"emotion",
      text:"第二幕・安衛編。健康診断、面接指導、安全衛生教育、労災報告、管理体制――これまでの安衛の過去問を、同じ高密度で最後まで。",
      encounter: enc(1, "章末問題集｜安衛編(高難度)", { villain:"v_mid_graus", n:12, exam:8 }),
      evidence:"ev_ch1c_boss_anei", next:"c1_ep10_broke" },
    { id:"c1_ep10_broke", type:"dialogue", speaker:"narrator", location:BELL, bgmScene:"emotion",
      text:"最後の一問が置かれた瞬間、鐘楼の歯車が、初めて軋みを上げて止まった。工都じゅうに、遅すぎた静寂が広がった。グラウスは、膝をついた。", next:"c1_ep10_reason" },
    { id:"c1_ep10_reason", type:"reasoning", speaker:"hero", location:BELL, bgmScene:"emotion",
      text:"時間も、賃金も、健康も――そのどれもが、抜け落ちた一人を数え直すための条文だった。歪みの設計図は、法の一つひとつで、解かれた。",
      reasoning:{ need:["ev_ch1c_boss_rouki","ev_ch1c_boss_anei"] },
      flags:{ c1_ep10_reasoned:1 }, next:"c1_ep10_graus2" },

    /* 断定的勝利にしない。グラウス/ゴードンの独白で「間を取り持つ」テーマへ橋渡し。 */
    { id:"c1_ep10_graus2", type:"dialogue", speaker:"graus", location:BELL, expression:"shock",
      text:"……私は、間違っていたのか。だが問おう。炉を止め、鐘を鳴らし、それで路頭に迷う三百人の飯は、誰が用意する? お前の正しさは、その答えを持っているのか。", next:"c1_ep10_foreman" },
    { id:"c1_ep10_foreman", type:"dialogue", speaker:"foreman", location:BELL,
      text:"……グラウス殿。私はもう、あなたの理屈に縋らない。だが、あなたの問いは捨てられない。人と、暮らし。その両方を立てる道を――誰かが、探さねばならん。", next:"c1_ep10_zen" },
    { id:"c1_ep10_zen", type:"dialogue", speaker:"hero", location:BELL, bgmScene:"emotion",
      text:"（師匠。あなたが逃げた問いが、ここにある。倒して終わりじゃない。経営者と労働者の間に立って、答えを作り続ける。……それが、あなたの遺した宿題だ。）",
      next:"c1_ep10_hero_final", flags:{ c1_zen_shadow:1 } },
    { id:"c1_ep10_hero_final", type:"dialogue", speaker:"hero", location:BELL,
      text:"グラウスさん。あなたを裁きには来ていない。あなたの問いに、これから答え続けに来た。……鐘は、止めるためじゃなく、正しく鳴らすためにある。", next:"c1_ep10_final" },
    { id:"c1_ep10_final", type:"dialogue", speaker:"narrator", location:BELL, bgmScene:"field",
      text:"鐘の鳴らなかった工都で、初めて鐘が正しく鳴った。レンには、もう聞こえない。――その事実だけが、この勝利より、ずっと重く残った。",
      next:null, flags:{ c1_ep10_done:1, c1_boss_cleared:1, c1_ch01c_done:1 },
      questUpdate:{ qid:"q_ch01c", state:"done", step:7 } }
  ];

  /* 第7〜10話クエスト定義(doneFlag で完了判定)。q_ch01/q_ch01b は無改変の別クエスト。 */
  if(typeof S.registerQuest==="function"){
    S.registerQuest("q_ch01c", {
      title:"鐘を鳴らす者",
      chapter:"ch01c",
      steps:["鋼鉄の記憶","灰の設計図","決戦前夜","章末問題集","鐘を鳴らす"],
      doneFlag:"c1_ch01c_done"
    });
  }

  S.register("ch01c", NODES);
  S.CH01C_ID = "ch01c";

  /* メイン章の背骨(S.MAIN)へ、ch01b の続きとして追記する。
     ・c1_ch01b_done 後、ホームの「今日の冒険」が自動で本話へ進む導線になる。
     ・S.MAIN 未ロード/未定義でも安全(存在する時だけ push、重複登録も防ぐ)。 */
  if(Array.isArray(S.MAIN)){
    var exists = false;
    for(var i=0;i<S.MAIN.length;i++){ if(S.MAIN[i] && S.MAIN[i].id==="ch01c"){ exists = true; break; } }
    if(!exists){
      S.MAIN.push({ id:"ch01c", no:"第一章", title:"鐘を鳴らす者", loc:"工都ベルガ・大鐘楼",
        doneFlag:"c1_ch01c_done", startedFlag:"c1_ep7_start" });
    }
  }
})();
