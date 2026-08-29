"use strict";
/* ============================================================
   story/chapters/chapter-01.js — 第一章「鐘の鳴らない工都」第1〜3話
   docs/story-bible.md 第1章（工都ベルガ・労基/安衛）に忠実。
   舞台=高賃金だが週八十時間。残業代で家族を養うため労働者自身が削減を拒む葛藤。
   芯は電通事件(最高裁 平成12年3月24日)の再現。入社2年目・24歳のレンが、
   過少申告された労働時間の下で働き続け、第3話で倒れる。
   各話に 導入/調査/問題演習/証拠/会話選択/小さな結末/次話への引き を配置。
   ・第1話「消えたタイムカード」…36協定/割増賃金/労働時間の隠蔽（労基＝subject0）
   ・第2話「名ばかりの監督者」…管理監督者性/休憩/年休（労基＝subject0）
   ・第3話「鳴らない鐘」…健診の異常所見放置/面接指導の欠落/報告義務（安衛＝subject1）
     ＋強いクリフハンガー
   ・eval/new Function ゼロ。全ノードはデータのみ（next は文字列 or {then,else}）。
   ・chapterId="ch01"。SRStory.register で登録。旧UIは無傷（自動起動しない・データ登録のみ）。
   ============================================================ */
(function(){
  var G = (typeof window!=="undefined") ? window : globalThis;
  var S = G.SRStory;
  if(!S || typeof S.register!=="function") return;   /* エンジン未ロードでも安全 */

  /* 第一章専用の話者を表示名テーブルへ追記（描画層があれば。無ければ素通し） */
  if(S.SPEAKERS && typeof S.SPEAKERS==="object"){
    if(!S.SPEAKERS.foreman) S.SPEAKERS.foreman = { name:"工場長 ゴードン", px:"foreman" };
    if(!S.SPEAKERS.hanna)   S.SPEAKERS.hanna   = { name:"主任 ハンナ",     px:"hanna" };
    if(!S.SPEAKERS.ren)     S.SPEAKERS.ren     = { name:"作業員 レン",     px:"ren" };
    if(!S.SPEAKERS.dockman) S.SPEAKERS.dockman = { name:"作業員",           px:"ren" };
  }

  var BERGA  = "工都ベルガ・第七工場";
  var SHUNIN = "第七工場・主任室";
  var LINE3  = "第七工場・第三ライン";

  /* 証拠集め＝既存の演習（労基=subject0 / 安衛=subject1）へ接続する encounter。
     kind/subject/label は描画側の橋が start* へ委譲する際に解釈。isExam:false=道具/回復有効。 */
  function enc(subject, label){ return { kind:"train", subject:subject, need:3, isExam:false, label:label }; }

  var NODES = [
    /* ============================================================
       第1話「消えたタイムカード」
       導入 → 事件 → 会話選択 → 調査(演習3) → 証拠 → 推理 → 経営者の事情 → 小結末 → 引き
       ============================================================ */

    /* ---- 導入：鐘が鳴っても止まらない工場 ---- */
    { id:"c1_open", start:true, type:"dialogue", speaker:"narrator", location:BERGA, bgmScene:"field",
      text:"工都ベルガ。煙突の影が、朝も夜も、街に落ちたままだった。",
      next:"c1_open2", flags:{ c1_ch01_started:1, c1_ep1_start:1 },
      questUpdate:{ qid:"q_ch01", state:"active", step:0 } },
    { id:"c1_open2", type:"dialogue", speaker:"narrator", location:BERGA,
      text:"午前二時。終業を告げる鐘が鳴った。", next:"c1_open3" },
    { id:"c1_open3", type:"dialogue", speaker:"narrator", location:BERGA, bgmScene:"emotion", expression:"shock",
      text:"誰ひとり、機械の前を離れなかった。", next:"c1_kai1" },
    { id:"c1_kai1", type:"dialogue", speaker:"kai", location:BERGA, portrait:"kai", expression:"angry",
      text:"鐘は鳴ったろ。なんで誰も帰らねぇんだ。", next:"c1_worker1" },
    { id:"c1_worker1", type:"dialogue", speaker:"dockman", location:BERGA,
      text:"帰れませんよ。帰ったら、娘の薬代が払えない。", next:"c1_worker2" },
    { id:"c1_worker2", type:"dialogue", speaker:"dockman", location:BERGA,
      text:"それでも、いちばん最後まで残るのはあの子です。レン。二年目の。", next:"c1_herothink1" },
    { id:"c1_herothink1", type:"dialogue", speaker:"hero", location:BERGA,
      text:"（週に八十時間。……法律は、とっくに超えている。）",
      next:"c1_kai2" },

    /* ---- 事件：消えたタイムカード ---- */
    { id:"c1_kai2", type:"dialogue", speaker:"kai", location:BERGA,
      text:"調律師。あんたの出番だ。", next:"c1_foreman1" },
    { id:"c1_foreman1", type:"dialogue", speaker:"foreman", location:BERGA, portrait:"foreman",
      text:"……工場長のゴードンだ。この工場を任されてる。", next:"c1_foreman2" },
    { id:"c1_foreman2", type:"dialogue", speaker:"foreman", location:BERGA,
      text:"帰れとは言ってる。本人が、帰らんのだ。", next:"c1_hero_ask1" },
    { id:"c1_hero_ask1", type:"dialogue", speaker:"hero", location:BERGA,
      text:"労働時間の記録を見せてください。タイムカードを。", next:"c1_foreman3" },
    { id:"c1_foreman3", type:"dialogue", speaker:"foreman", location:BERGA, expression:"shock",
      text:"……それが。先月分の打刻が、まるごと消えている。", next:"c1_kai3" },
    { id:"c1_kai3", type:"dialogue", speaker:"kai", location:BERGA, expression:"angry",
      text:"消えた? 誰かが消したんだろ。残業を、なかったことにするために。", next:"c1_choice1" },

    /* ---- 会話選択①：問い詰めるか、記録を洗うか ---- */
    { id:"c1_choice1", type:"choice", speaker:"hero", location:BERGA, text:"どう動く?",
      choices:[
        { text:"ゴードンを問い詰め、隠蔽を白状させる",
          ideologyChanges:{ human:1, mgmt:-1 }, flags:{ c1_path_press:1 }, next:"c1_press1" },
        { text:"証拠を、自分の手で洗い直す",
          ideologyChanges:{ law:1, indep:1 }, flags:{ c1_path_probe:1 }, next:"c1_probe1" }
      ]},
    { id:"c1_press1", type:"dialogue", speaker:"hero", location:BERGA,
      text:"あなたが消したんですか。人の時間を、なかったことにするために。", next:"c1_press2" },
    { id:"c1_press2", type:"dialogue", speaker:"foreman", location:BERGA, expression:"shock",
      text:"……消したのは私だ。だが、命じられてな。", next:"c1_press3" },
    { id:"c1_press3", type:"dialogue", speaker:"kai", location:BERGA,
      text:"命じられた? ……誰にだよ。", next:"c1_investigate1" },
    { id:"c1_probe1", type:"dialogue", speaker:"hero", location:BERGA,
      text:"消した時間は、必ずどこかに残る。台帳も協定も、全部洗います。", next:"c1_probe2" },
    { id:"c1_probe2", type:"dialogue", speaker:"foreman", location:BERGA,
      text:"……好きにしてくれ。もう、隠しきれん。", next:"c1_investigate1",
      relationshipChanges:{ cp0:1 } },

    /* ---- 調査（演習＝証拠獲得）---- */
    { id:"c1_investigate1", type:"dialogue", speaker:"narrator", location:BERGA, bgmScene:"field",
      text:"消えた時間の、行き先を追う。", next:"c1_enc_timecard",
      questUpdate:{ qid:"q_ch01", state:"active", step:1 } },
    { id:"c1_enc_timecard", type:"encounter", speaker:"hero", location:BERGA,
      text:"レンのタイムカード。残っていたのは、先々月の一枚だけだった。",
      encounter: enc(0, "タイムカードを読む"), evidence:"ev_ch1_timecard", next:"c1_ev_timecard" },
    { id:"c1_ev_timecard", type:"evidence", speaker:"narrator", location:BERGA, evidence:"ev_ch1_timecard",
      text:"打刻は消えても、機械は正直だった。午前四時まで、ラインは動いている。", next:"c1_enc_ledger" },
    { id:"c1_enc_ledger", type:"encounter", speaker:"hero", location:BERGA,
      text:"賃金台帳。払われた金と、働いた時間を突き合わせる。",
      encounter: enc(0, "賃金台帳を照合する"), evidence:"ev_ch1_ledger", next:"c1_ev_ledger" },
    { id:"c1_ev_ledger", type:"dialogue", speaker:"dockman", location:BERGA,
      text:"残業代は、出てます。……毎月きっかり四十五時間で止まって。それ以上はゼロ。", next:"c1_enc_agreement" },
    { id:"c1_enc_agreement", type:"encounter", speaker:"hero", location:BERGA,
      text:"そして三六協定。時間外労働の、上限の約束。",
      encounter: enc(0, "三六協定を確かめる"), evidence:"ev_ch1_agreement", next:"c1_ev_agreement" },
    { id:"c1_ev_agreement", type:"dialogue", speaker:"hero", location:BERGA,
      text:"（月四十五時間。……実際は、その倍を超えている。）", next:"c1_reason1" },

    /* ---- 推理：三つの証拠が一つの絵を描く ---- */
    { id:"c1_reason1", type:"reasoning", speaker:"hero", location:BERGA, bgmScene:"emotion",
      text:"機械は四時まで動き、賃金は四十五時間で止まり、協定はとうに超えている。――はみ出した分を、記録ごと消していた。",
      reasoning:{ need:["ev_ch1_timecard","ev_ch1_ledger","ev_ch1_agreement"] },
      flags:{ c1_reasoned1:1 }, next:"c1_foreman4",
      questUpdate:{ qid:"q_ch01", state:"active", step:2 } },

    /* ---- 経営者の事情（多面性）---- */
    { id:"c1_foreman4", type:"dialogue", speaker:"foreman", location:BERGA,
      text:"……その通りだ。上限を超えた分は、打刻ごと抜いた。", next:"c1_foreman5" },
    { id:"c1_foreman5", type:"dialogue", speaker:"foreman", location:BERGA,
      text:"私も昔は、あの機械の前にいた。ラインを止めれば、この街が干上がる。", next:"c1_herothink2" },
    { id:"c1_herothink2", type:"dialogue", speaker:"hero", location:BERGA,
      text:"（違法だ。それは動かない。……だがこの人も、追い詰められた一人だ。）",
      next:"c1_kai4", ideologyChanges:{ mgmt:1 }, flags:{ c1_saw_sides1:1 } },
    { id:"c1_kai4", type:"dialogue", speaker:"kai", location:BERGA, expression:"angry",
      text:"……分かってんだよ、そんなこと。おれの親父も、そうやって――", next:"c1_kai5" },
    { id:"c1_kai5", type:"dialogue", speaker:"kai", location:BERGA,
      text:"……いや。なんでもねぇ。先に進もう。", next:"c1_ep1end",
      relationshipChanges:{ cp0:1 }, flags:{ c1_kai_father_hint:1 } },

    /* ---- 小結末 → 次話への引き（管理監督者）---- */
    { id:"c1_ep1end", type:"dialogue", speaker:"narrator", location:BERGA, bgmScene:"field",
      text:"消えた時間の謎は解けた。だがレンは、いまも第三ラインに立っている。",
      next:"c1_foreman6", flags:{ c1_ep1_done:1 } },
    { id:"c1_foreman6", type:"dialogue", speaker:"foreman", location:BERGA,
      text:"言っておく。命じたのは上だ。上はこうも言った。『主任どもに、残業代は要らん』と。", next:"c1_hook1" },
    { id:"c1_hook1", type:"dialogue", speaker:"hero", location:BERGA,
      text:"（主任。……レンの、すぐ上に立つ人だ。）",
      next:"c1_ep2_open", flags:{ c1_hook_kantoku:1 } },

    /* ============================================================
       第2話「名ばかりの監督者」
       導入 → 会話選択 → 調査(演習) → 証拠 → 交渉 → 小結末 → 引き(事故警報)
       ============================================================ */

    /* ---- 導入：主任室のハンナ ---- */
    { id:"c1_ep2_open", type:"dialogue", speaker:"narrator", location:SHUNIN, bgmScene:"field",
      text:"二階の、机ひとつの部屋。札には『主任室』とあった。",
      next:"c1_hanna1", flags:{ c1_ep2_start:1 } },
    { id:"c1_hanna1", type:"dialogue", speaker:"hanna", location:SHUNIN, portrait:"hanna",
      text:"主任のハンナです。管理職ですから、残業代は出ません。", next:"c1_hanna2" },
    { id:"c1_hanna2", type:"dialogue", speaker:"hanna", location:SHUNIN,
      text:"……レンの、直属です。あの子の申告書に判を押しているのは、私。", next:"c1_kai6" },
    { id:"c1_kai6", type:"dialogue", speaker:"kai", location:SHUNIN, expression:"angry",
      text:"判を押した? 四十五時間っていう嘘に、あんたが?", next:"c1_hero_ask2" },
    { id:"c1_hero_ask2", type:"dialogue", speaker:"hero", location:SHUNIN,
      text:"ハンナさん。あなたに、人を採る権限は? 自分の出退勤を、決められますか?", next:"c1_hanna3" },
    { id:"c1_hanna3", type:"dialogue", speaker:"hanna", location:SHUNIN, expression:"shock",
      text:"……ありません。全部、上が決めます。私は、この札をもらっただけで。", next:"c1_choice2" },

    /* ---- 会話選択②：肩書きを断ずるか、実態を確かめるか ---- */
    { id:"c1_choice2", type:"choice", speaker:"hero", location:SHUNIN, text:"この『主任』を、どう見る?",
      choices:[
        { text:"肩書きは無効だと、その場で法を突きつける",
          ideologyChanges:{ law:1, human:-1 }, flags:{ c1_path_strict2:1 }, next:"c1_strict2" },
        { text:"実態を、一つずつ確かめる",
          ideologyChanges:{ indep:1, fair:1 }, flags:{ c1_path_real2:1 }, next:"c1_real2" }
      ]},
    { id:"c1_strict2", type:"dialogue", speaker:"hero", location:SHUNIN,
      text:"その札に、法的な意味はない。あなたは管理監督者じゃない。", next:"c1_hanna_strict" },
    { id:"c1_hanna_strict", type:"dialogue", speaker:"hanna", location:SHUNIN, expression:"shock",
      text:"……意味が、ない? 私が必死でしがみついた、これが?", next:"c1_investigate2" },
    { id:"c1_real2", type:"dialogue", speaker:"hero", location:SHUNIN,
      text:"実態を見せてください。権限も、待遇も、勤務も。一つずつ。", next:"c1_investigate2" },

    /* ---- 調査（演習＝管理監督者性の判定）---- */
    { id:"c1_investigate2", type:"dialogue", speaker:"narrator", location:SHUNIN, bgmScene:"field",
      text:"組織図、給与明細、勤務表。札の中身を、書類から拾う。", next:"c1_enc_role" },
    { id:"c1_enc_role", type:"encounter", speaker:"hero", location:SHUNIN,
      text:"管理監督者かどうかは、肩書きではなく実態で決まる。",
      encounter: enc(0, "管理監督者の実態を判定する"), evidence:"ev_ch1_orgchart", next:"c1_ev_role" },
    { id:"c1_ev_role", type:"dialogue", speaker:"hero", location:SHUNIN,
      text:"（人事権なし。出退勤は拘束。手当は月にわずか。……管理監督者じゃない。）",
      flags:{ c1_role_judged:1 }, next:"c1_negotiate2" },

    /* ---- 交渉：肩書きでなく実態で ---- */
    { id:"c1_negotiate2", type:"negotiation", speaker:"hero", location:SHUNIN, bgmScene:"emotion",
      text:"決めるのは実態だ。ハンナさんは管理監督者に当たらない。時間外には、割増賃金が支払われるべきだ。",
      negotiation:{ answer:"kantoku_gai", options:["管理監督者だから不要","kantoku_gai","本人が納得しているなら不要"] },
      next:"c1_hanna4" },
    { id:"c1_hanna4", type:"dialogue", speaker:"hanna", location:SHUNIN,
      text:"……私が、あの子に言ったんです。四十五時間で書いておけ、って。", next:"c1_hanna5" },
    { id:"c1_hanna5", type:"dialogue", speaker:"hanna", location:SHUNIN,
      text:"断れば、次はあの子が札を押しつけられる。……この札は、盾じゃなくて――鎖だった。",
      next:"c1_ep2end", flags:{ c1_ep2_done:1 }, ideologyChanges:{ human:1 } },

    /* ---- 小結末 → 引き（安全装置／事故警報）---- */
    { id:"c1_ep2end", type:"dialogue", speaker:"narrator", location:SHUNIN, bgmScene:"emotion",
      text:"名ばかりの札は剥がれた。だがハンナは、去り際にこう言った。", next:"c1_hanna6" },
    { id:"c1_hanna6", type:"dialogue", speaker:"hanna", location:SHUNIN, expression:"shock",
      text:"あの子、最近ずっと笑ってるんです。……前は、笑わない子だったのに。", next:"c1_kai7" },
    { id:"c1_kai7", type:"dialogue", speaker:"kai", location:SHUNIN, expression:"angry",
      text:"笑ってる? ……それの、何がやべぇんだよ。", next:"c1_siren" },
    { id:"c1_siren", type:"dialogue", speaker:"narrator", location:SHUNIN, bgmScene:"emotion", expression:"shock",
      text:"その時、工場じゅうに音が響いた。終業の鐘ではない。人を呼ぶ、悲鳴だった。",
      next:"c1_ep3_open", flags:{ c1_hook_anzen:1 } },

    /* ============================================================
       第3話「鳴らない鐘」
       導入(事故) → ミナ登場 → 証拠(診断書) → 調査(演習・安衛) → 会話選択 → 推理 → 交渉
       → 小結末 → 強いクリフハンガー（師匠ゼンの印・署名）
       ============================================================ */

    /* ---- 導入：事故 ---- */
    { id:"c1_ep3_open", type:"dialogue", speaker:"narrator", location:LINE3, bgmScene:"emotion", expression:"shock",
      text:"第三ライン。回り続ける機械の前で、レンが倒れていた。",
      next:"c1_ren1", flags:{ c1_ep3_start:1 } },
    { id:"c1_ren1", type:"dialogue", speaker:"ren", location:LINE3, portrait:"ren",
      text:"……すみません。ちょっと、目を、つむっただけで。……まだ、やれます……", next:"c1_kai8" },
    { id:"c1_kai8", type:"dialogue", speaker:"kai", location:LINE3, expression:"angry",
      text:"喋るな! 誰か、医者を呼べ! ――くそっ、なんでこんな……", next:"c1_mina1" },
    { id:"c1_mina1", type:"dialogue", speaker:"mina", location:LINE3, portrait:"mina",
      text:"意識はある。脈が速い。連続三十七時間、休憩なし。……過労です。", next:"c1_mina2" },
    { id:"c1_mina2", type:"dialogue", speaker:"mina", location:LINE3,
      text:"私はミナ。安全管理官です。この人が倒れることは、分かっていました。", next:"c1_hero_ask3" },
    { id:"c1_hero_ask3", type:"dialogue", speaker:"hero", location:LINE3,
      text:"分かっていて……止めなかった、ということですか。", next:"c1_mina3" },
    { id:"c1_mina3", type:"dialogue", speaker:"mina", location:LINE3,
      text:"止める権限がない。確率は、命令書には勝てません。……感情は後です。今は証拠を。", next:"c1_med" },

    /* ---- 証拠：診断書 ---- */
    { id:"c1_med", type:"evidence", speaker:"mina", location:LINE3, evidence:"ev_ch1_medical",
      text:"レンの診断書です。三か月前の健康診断で、異常の所見が出ている。……誰も、読んでいない。",
      next:"c1_investigate3" },

    /* ---- 調査（演習＝安衛：安全装置／事故記録）---- */
    { id:"c1_investigate3", type:"dialogue", speaker:"narrator", location:LINE3, bgmScene:"field",
      text:"隠される前に、事実を確保する。",
      next:"c1_enc_device", questUpdate:{ qid:"q_ch01", state:"active", step:3 } },
    { id:"c1_enc_device", type:"encounter", speaker:"hero", location:LINE3,
      text:"長い時間働いた人には、医師の面接指導が義務づけられている。その記録を探す。",
      encounter: enc(1, "面接指導の記録を洗う"), evidence:"ev_ch1_device", next:"c1_ev_device" },
    { id:"c1_ev_device", type:"dialogue", speaker:"mina", location:LINE3,
      text:"面接指導の記録は、一件もありません。申し出る窓口があることすら、伝えられていない。", next:"c1_enc_accident" },
    { id:"c1_enc_accident", type:"encounter", speaker:"hero", location:LINE3,
      text:"倒れた者の報告は、法の義務だ。あなたが何を抜き取っても、事実までは消せない。",
      encounter: enc(1, "倒れた報告の行方を追う"), evidence:"ev_ch1_accident", next:"c1_ev_accident" },
    { id:"c1_ev_accident", type:"dialogue", speaker:"hero", location:LINE3, expression:"shock",
      text:"（取り戻した綴り。……あの男は、レンが倒れたことごと、なかったことにする気だった。）",
      flags:{ c1_found_coverup:1 }, next:"c1_choice3" },

    /* ---- 会話選択③：人命は数字か、痛みか ---- */
    { id:"c1_choice3", type:"choice", speaker:"hero", location:LINE3, text:"レンは命をつないだ。だが会社は、倒れたこと自体を隠そうとしている。どうする?",
      choices:[
        { text:"人は数字じゃない。全てを表沙汰にし、工場を止める",
          ideologyChanges:{ human:1, relief:1 }, flags:{ c1_path_expose:1 }, next:"c1_expose" },
        { text:"感情を抑え、隠蔽の証拠を固めてから動く",
          ideologyChanges:{ law:1, fair:1 }, flags:{ c1_path_build:1 }, next:"c1_build" }
      ]},
    { id:"c1_expose", type:"dialogue", speaker:"hero", location:LINE3,
      text:"止めます、この工場を。人が壊れてからも回る機械に、価値なんかない。", next:"c1_mina4" },
    { id:"c1_build", type:"dialogue", speaker:"hero", location:LINE3,
      text:"証拠を固めます。放置も、隠蔽も、動かせない事実にしてから。", next:"c1_mina4" },
    { id:"c1_mina4", type:"dialogue", speaker:"mina", location:LINE3,
      text:"……あなたは感情で語る人ですね。私は確率で語る。どちらが正しいかは、まだ分かりません。",
      next:"c1_reason3", relationshipChanges:{ cp1:2 } },

    /* ---- 推理：これは事故じゃない、人災だ ---- */
    { id:"c1_reason3", type:"reasoning", speaker:"hero", location:LINE3, bgmScene:"emotion",
      text:"読まれなかった異常所見。行われなかった面接指導。消された報告。――これは事故じゃない。見ないと決めた者がいた、その結果だ。",
      reasoning:{ need:["ev_ch1_device","ev_ch1_accident","ev_ch1_medical"] },
      flags:{ c1_reasoned3:1 }, next:"c1_negotiate3" },

    /* ---- 交渉：安衛法違反＋報告義務 ---- */
    { id:"c1_negotiate3", type:"negotiation", speaker:"hero", location:LINE3,
      text:"争点はふたつ。危険と分かっていて働かせ続けた責任。そして、倒れたことを報告しなかった責任。",
      negotiation:{ answer:"anzen_hokoku", options:["労働者の不注意","anzen_hokoku","機械の老朽化"] },
      next:"c1_foreman7" },
    { id:"c1_foreman7", type:"dialogue", speaker:"foreman", location:LINE3, expression:"shock",
      text:"……出せなかったんだ。報告すれば監督署が来る。元請から切られる。だから『倒れても、出すな』と。私も、そう命じられていた。", next:"c1_hero_final1" },
    { id:"c1_hero_final1", type:"dialogue", speaker:"hero", location:LINE3,
      text:"誰が命じたんですか。打刻を消せと。鐘を、無視しろと。", next:"c1_foreman8" },

    /* ---- 小結末 ---- */
    { id:"c1_foreman8", type:"dialogue", speaker:"foreman", location:LINE3,
      text:"……一枚の通達だ。この工都じゅうの工場に、同じものが届いた。",
      next:"c1_doc", flags:{ c1_ep3_solved:1 } },

    /* ---- 強いクリフハンガー：中央法典の印と、師匠ゼンの署名 ---- */
    { id:"c1_doc", type:"evidence", speaker:"narrator", location:LINE3, bgmScene:"emotion", expression:"shock",
      text:"ゴードンが差し出したのは、古い通達。上部に、灰色の印章。――どこかで見た紋様だった。",
      evidence:"ev_ch1_directive", flags:{ c1_directive:1 }, next:"c1_doc2" },
    { id:"c1_doc2", type:"dialogue", speaker:"hero", location:LINE3,
      text:"（序章で見た、中央法典の欠片と同じ印だ。なぜ、こんな通達に――）", next:"c1_doc3" },
    { id:"c1_doc3", type:"dialogue", speaker:"narrator", location:LINE3,
      text:"通達の末尾。署名の欄に、掠れたインクで、一つの名が記されていた。", next:"c1_doc4" },
    { id:"c1_doc4", type:"dialogue", speaker:"hero", location:LINE3, expression:"shock",
      text:"（――ゼン・クロイツ。……師匠の、名前だ。）", next:"c1_kai9", flags:{ c1_zen_seal:1 } },
    { id:"c1_kai9", type:"dialogue", speaker:"kai", location:LINE3, expression:"angry",
      text:"……あんたの師匠って、消えたんだよな。この工場をこうしたのが、あんたの師匠か?", next:"c1_mina5" },
    { id:"c1_mina5", type:"dialogue", speaker:"mina", location:LINE3,
      text:"同名の別人という確率もあります。……ですが、この筆跡。ひとつだけ、確かなことがある。", next:"c1_mina6" },
    { id:"c1_mina6", type:"dialogue", speaker:"mina", location:LINE3,
      text:"この工都の歪みは、偶然じゃない。誰かが設計した。……その名を、あなたは知っている。", next:"c1_boss_setup" },

    /* ---- 科目ボスへの土台（工都の歪みの具象化）---- */
    { id:"c1_boss_setup", type:"dialogue", speaker:"narrator", location:BERGA, bgmScene:"emotion",
      text:"煙の向こうで、鉄の足音が遠ざかっていった。工都の統制官グラウス。――あの男を正さない限り、この街の鐘は鳴らない。",
      next:"c1_cliff1", flags:{ c1_boss_ready:1 } },
    { id:"c1_cliff1", type:"dialogue", speaker:"kai", location:BERGA,
      text:"信じねぇ。だから確かめる。真相を、殴ってでも。", next:"c1_cliff2" },
    { id:"c1_cliff2", type:"dialogue", speaker:"hero", location:BERGA,
      text:"（師匠。あなたは何を壊して、何を遺したんだ。）", next:"c1_final" },
    { id:"c1_final", type:"dialogue", speaker:"narrator", location:BERGA, bgmScene:"field",
      text:"鐘の鳴らない工都で、若い調律師は初めて師匠の影を疑った。――そしてレンは、まだ目を覚まさない。",
      next:null, flags:{ c1_ep3_done:1, c1_ch01_done:1 },
      questUpdate:{ qid:"q_ch01", state:"done", step:4 } }
  ];

  /* 第一章クエスト定義（doneFlag で完了判定） */
  if(typeof S.registerQuest==="function"){
    S.registerQuest("q_ch01", {
      title:"鐘の鳴らない工都",
      chapter:"ch01",
      steps:["消えたタイムカード","名ばかりの監督者","鳴らない鐘","歪みへの対峙"],
      doneFlag:"c1_ch01_done"
    });
  }

  S.register("ch01", NODES);
  S.CH01_ID = "ch01";
})();
