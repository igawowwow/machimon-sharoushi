"use strict";
/* ============================================================
   story/chapters/chapter-02b.js — 第二章「灰の降る街」第4〜8話 + 章ボス戦
   docs/story-bible.md / ENDING-CANON 準拠。chapter-02.js の末尾(c2_ch02_done /
   c2_boss_next)から地続きの五話を、別 chapterId="ch02b" で綴じ込む。舞台=火山イグニス／労災(subject 2)。
   ・第4話「給付という命綱」…給付の種類(療養/休業/障害/遺族/傷病(補償)年金)を、遺された家族の事件で。
                            ガルドと主人公の関係深化。過去問(examFmt)混入。行政の事情(財源有限)を継続。
   ・第5話「他人の火」…第三者行為災害・求償・示談の論点。中ボス 灼傷のヴォルガ=自らも他人の過失で
                      焼かれ償われなかった審査長(過去=火傷)。一部不正請求の芽を断定せず提示。
   ・第6話「灼傷の審査官」…認定・通勤の全体像。中ボス【灼傷のヴォルガ v_mid_volga】戦。関係さらに深化。
   ・第7話「決戦前夜」…ガルド/カイ/ミナとの会話で覚悟。戦う意味の総括(戦闘なし)。師匠ゼンの影を1本。
   ・第8話「灰を払う者」…章ボス【ロウサイ大王 v_boss_s2】戦=【章末問題集】(労災の過去問=examFmt中心の
                      高難度セット)。撃破後は断定的勝利にせず、「支え合う制度へ/間を取り持つ」テーマへ橋渡し。
   ・各話に必ず「経営者/行政の事情」ビートを置き、一部の不正請求という課題の芽も混ぜる(断定せず問いを残す)。
   ・chapter-01*.js / chapter-02.js のノード/quest/ID/証拠/分岐は一切改変しない(別ファイル・別章)。
   ・戦闘接続は既存の橋(story-encounter / story-battle-bridge)。encounter に villain と
     exam(examFmt 混入数)を持たせるだけで、採点・SRS・報酬・問題データには一切触れない。
     ボス戦も新規採点系を作らず、examFmt を多く混ぜた高難度 encounter として既存橋へ委譲する。
   ・eval/new Function ゼロ。全ノードはデータのみ(next は文字列 or {then,else} or null)。全出力は自前 esc2 経由。
   ・立てるフラグ: c2_ep4_done〜c2_ep8_done / c2_boss_cleared / c2_ch02b_done / c2_zen_ash2。
     q_ch02(前半)は無改変。章クリア演出は S3 側。ここは boss_cleared までを確定する。
   ============================================================ */
(function(){
  var G = (typeof window!=="undefined") ? window : globalThis;
  var S = G.SRStory;
  if(!S || typeof S.register!=="function") return;   /* エンジン未ロードでも安全 */

  /* 第4〜8話の話者を表示名テーブルへ追記(描画層があれば。無ければ素通し)。
     gard/victim/assessor/rousai は既存(chapter-02.js が追記済み)。volga のみ追記する。 */
  if(S.SPEAKERS && typeof S.SPEAKERS==="object"){
    if(!S.SPEAKERS.volga)    S.SPEAKERS.volga    = { name:"灼傷のヴォルガ", px:"e_roukisai" };
    if(!S.SPEAKERS.victim)   S.SPEAKERS.victim   = { name:"灰まみれの工夫", px:"ghost" };
    if(!S.SPEAKERS.rousai)   S.SPEAKERS.rousai   = { name:"ロウサイ大王", px:"fire" };
  }

  var WARD  = "イグニス・療養の仮小屋";
  var SLOPE = "イグニス・第三坑道跡";
  var TRIB  = "イグニス・労災審査炉";
  var CAMP2 = "イグニス・火口前の宿営";
  var CRATER= "イグニス・火口";

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
       第4話「給付という命綱」
       給付の種類(療養/休業/障害/遺族/傷病(補償)年金)を、遺された家族の事件で。
       ガルドと主人公の関係深化。過去問(examFmt)混入。行政の事情(財源有限)を継続。
       ============================================================ */
    { id:"c2_ep4_open", start:true, type:"dialogue", speaker:"narrator", location:WARD, bgmScene:"emotion",
      text:"火口へ向かう前に、療養の仮小屋に立ち寄った。坑で夫を亡くした女と、まだ小さな子が、身を寄せ合っていた。",
      next:"c2_ep4_intro", flags:{ c2_ep4_start:1 },
      questUpdate:{ qid:"q_ch02b", state:"active", step:0 } },
    { id:"c2_ep4_intro", type:"dialogue", speaker:"victim", location:WARD, portrait:"ghost", expression:"shock",
      text:"人は言うんです。『注意が足りなかったから』と。会社の人には『騒ぐと皆に迷惑が掛かる』とだけ。……葬式に、誰も来ませんでした。", next:"c2_ep4_gard1" },
    { id:"c2_ep4_gard1", type:"dialogue", speaker:"gard", location:WARD, portrait:"oni", expression:"angry",
      text:"泣くな……いや、泣いていい。今は泣け。だがな、覚えとけ。仕事で人が死んだら、遺された家族が受け取れるものがある。施しじゃねえ。権利だ。", next:"c2_ep4_mina1" },
    { id:"c2_ep4_mina1", type:"dialogue", speaker:"mina", location:WARD, portrait:"wiz",
      text:"労災には幾つもの命綱があります。療養、休業、障害、遺族。長引けば傷病の年金も。……崩れた暮らしを、もう一度つなぐための制度です。", next:"c2_ep4_kai1" },
    { id:"c2_ep4_kai1", type:"dialogue", speaker:"kai", location:WARD, expression:"angry",
      text:"おれの親父が死んだ時、誰も教えてくれなかった。……知らないってだけで、受け取れるはずのものが消える。それが一番くやしい。", next:"c2_ep4_choice" },

    { id:"c2_ep4_choice", type:"choice", speaker:"hero", location:WARD, text:"この母子に、どう向き合う?",
      choices:[
        { text:"受け取れる給付の全体を、制度で正しく示す",
          ideologyChanges:{ law:1, relief:1 }, flags:{ c2_ep4_path_law:1 }, next:"c2_ep4_probe" },
        { text:"まず、遺された二人の明日への不安を受け止める",
          ideologyChanges:{ human:1, relief:1 }, flags:{ c2_ep4_path_human:1 }, next:"c2_ep4_alt" }
      ]},
    { id:"c2_ep4_alt", type:"dialogue", speaker:"hero", location:WARD,
      text:"不安で当然です。あなたは何も間違っていない。……その上で聞いてください。あなたと子を支える給付が、ちゃんとある。", next:"c2_ep4_probe" },

    { id:"c2_ep4_probe", type:"dialogue", speaker:"narrator", location:WARD, bgmScene:"field",
      text:"給付の種類を混同させ、受け取れるものを一つに絞らせる者がいた。療養だけ、休業だけと数えさせて、遺族の分を消す。",
      next:"c2_ep4_enc1", questUpdate:{ qid:"q_ch02b", state:"active", step:1 } },
    { id:"c2_ep4_enc1", type:"encounter", speaker:"hero", location:WARD, bgmScene:"emotion",
      text:"日額削りのダルガが給付の帳簿を握って現れた。療養・休業・障害・遺族・傷病年金――給付の種類と関係を、本試験の問いで確かめる。",
      encounter: enc(2, "過去問｜給付の種類(療養・休業・障害・遺族)を問う", { villain:"v_nichigaku", exam:2 }),
      evidence:"ev_ch2b_kyufu", next:"c2_ep4_ev1" },
    { id:"c2_ep4_ev1", type:"dialogue", speaker:"mina", location:WARD,
      text:"給付の全体像、証拠に残せました。この母子は遺族給付を受け取れます。子が育つまでの命綱が、法の中に用意されていた。", next:"c2_ep4_reason" },
    { id:"c2_ep4_reason", type:"reasoning", speaker:"hero", location:WARD, bgmScene:"emotion",
      text:"療養、休業、障害、遺族、傷病の年金。――どれも崩れた暮らしを別々の角度から支える命綱だ。一本に見せて他を消す。それが細工だ。",
      reasoning:{ need:["ev_ch2b_kyufu"] },
      flags:{ c2_ep4_reasoned:1 }, next:"c2_ep4_biz" },

    /* 【行政の事情】断定せず提示 */
    { id:"c2_ep4_biz", type:"dialogue", speaker:"assessor", location:WARD,
      text:"……給付を並べて見せるのは簡単だ。だが原資は保険料と、限りある財源だ。十年後に枯れたら、次に遺された家族は誰が支える?", next:"c2_ep4_hero2" },
    { id:"c2_ep4_hero2", type:"dialogue", speaker:"hero", location:WARD,
      text:"（財源が有限なのは本当だ。……でも、使う時に使えない命綱は、命綱じゃない。線の引き方を、間違えたくない。）",
      next:"c2_ep4_end", ideologyChanges:{ mgmt:1, fair:1 }, flags:{ c2_ep4_saw_sides:1 } },
    { id:"c2_ep4_end", type:"dialogue", speaker:"narrator", location:WARD, bgmScene:"field",
      text:"母は初めて、子の頭をなでながら顔を上げた。ガルドは何も言わず、鉄の義手でその子に小さな石の駒を握らせた。",
      next:"c2_ep4_hook", flags:{ c2_ep4_done:1 }, questUpdate:{ qid:"q_ch02b", state:"active", step:2 } },
    { id:"c2_ep4_hook", type:"dialogue", speaker:"gard", location:WARD, expression:"angry",
      text:"……次の坑道跡には、厄介なのがいる。灼傷のヴォルガ。おれと同じ火傷を負ってるくせに、逆の道を選んだ男さ。", next:"c2_ep5_open" },

    /* ============================================================
       第5話「他人の火」
       第三者行為災害・求償・示談。中ボス 灼傷のヴォルガ 初登場(過去=他人の過失で焼かれ償われなかった)。
       一部不正請求の芽を断定せず提示。
       ============================================================ */
    { id:"c2_ep5_open", type:"dialogue", speaker:"narrator", location:SLOPE, bgmScene:"emotion",
      text:"崩れた第三坑道跡。焼け落ちた支柱の間に、片頬に古い火傷を負った男が立っていた。灼傷のヴォルガ。書類を火にくべていた。",
      next:"c2_ep5_volga1", flags:{ c2_ep5_start:1 } },
    { id:"c2_ep5_volga1", type:"dialogue", speaker:"volga", location:SLOPE, portrait:"e_roukisai", expression:"angry",
      text:"この頬を見ろ。隣の坑の火が回って焼かれた。隣の親方の不始末だ。……だが誰も償っちゃくれなかった。他人の火の落とし前は、他人が付けろ。", next:"c2_ep5_volga2" },
    { id:"c2_ep5_volga2", type:"dialogue", speaker:"volga", location:SLOPE,
      text:"だから私は必ず問う。『その火をつけたのは誰だ』と。他人のせいなら、そいつから取れ。……労災の金を、安易に開けさせはせん。", next:"c2_ep5_hero1" },
    { id:"c2_ep5_hero1", type:"dialogue", speaker:"hero", location:SLOPE,
      text:"（他人の過失で傷ついた――第三者行為災害。まず給付し、後で国が加害者へ求償する。……この人は、順番を逆にしている。）", next:"c2_ep5_gard1" },
    { id:"c2_ep5_gard1", type:"dialogue", speaker:"gard", location:SLOPE, expression:"angry",
      text:"ヴォルガ。お前の火傷は、おれも痛いほど分かる。……だがな、その痛みを次の誰かに配ってどうする。お前を焼いた奴と、同じことをしてる。", next:"c2_ep5_mina1" },
    { id:"c2_ep5_mina1", type:"dialogue", speaker:"mina", location:SLOPE, portrait:"wiz",
      text:"第三者行為災害でも、労働者はまず労災給付を受けられます。国は後から加害者へ求償する。……給付そのものを止める理由には、なりません。", next:"c2_ep5_kai1" },
    { id:"c2_ep5_kai1", type:"dialogue", speaker:"kai", location:SLOPE,
      text:"正直に言えば、示談金を隠して労災も満額取ろうとする奴もいなくはねえ。……だが、疑いと門前払いは違う。", next:"c2_ep5_choice" },

    { id:"c2_ep5_choice", type:"choice", speaker:"hero", location:SLOPE, text:"ヴォルガの審査に、どう挑む?",
      choices:[
        { text:"求償は国の仕事、給付は先。順番を制度で正す",
          ideologyChanges:{ law:1, fair:1 }, flags:{ c2_ep5_path_law:1 }, next:"c2_ep5_probe" },
        { text:"償われなかったヴォルガの歳月を、まず認める",
          ideologyChanges:{ human:1, mgmt:1 }, flags:{ c2_ep5_path_human:1 }, next:"c2_ep5_alt" }
      ]},
    { id:"c2_ep5_alt", type:"dialogue", speaker:"hero", location:SLOPE,
      text:"償われなかった痛みは、なかったことにはしません。……その上で。火の落とし前は、傷ついた側にではなく、つけた側に付けさせるべきだ。", next:"c2_ep5_probe" },

    { id:"c2_ep5_probe", type:"dialogue", speaker:"narrator", location:SLOPE, bgmScene:"field",
      text:"『他人の火だから労災は使えない』――そう言い張って負傷を弾く手下がいた。第三者行為災害の筋道を、一つずつ立て直す。",
      next:"c2_ep5_enc1", questUpdate:{ qid:"q_ch02b", state:"active", step:3 } },
    { id:"c2_ep5_enc1", type:"encounter", speaker:"hero", location:SLOPE, bgmScene:"emotion",
      text:"寄り道のヨリムが再び道を曲げにきた。第三者行為災害・求償・示談との調整を、本試験の問いで正面から。",
      encounter: enc(2, "過去問｜第三者行為災害・求償と示談調整を問う", { villain:"v_yorimichi", exam:2 }),
      evidence:"ev_ch2b_third", next:"c2_ep5_ev1" },
    { id:"c2_ep5_ev1", type:"dialogue", speaker:"mina", location:SLOPE,
      text:"筋道、立ちました。他人の火でも、まず給付。求償は国が後から。……『他人の火は払わん』は、順番の取り違えでした。", next:"c2_ep5_reason" },
    { id:"c2_ep5_reason", type:"reasoning", speaker:"hero", location:SLOPE, bgmScene:"emotion",
      text:"他人の過失で焼かれても、労働者の命綱は先に開く。求償はその後で国が担う。――痛みの精算を、傷ついた本人に待たせない。",
      reasoning:{ need:["ev_ch2b_third"] },
      flags:{ c2_ep5_reasoned:1 }, next:"c2_ep5_biz" },

    /* 【行政/審査の事情】断定せず、次話の壁として残す */
    { id:"c2_ep5_biz", type:"dialogue", speaker:"volga", location:SLOPE, expression:"shock",
      text:"……順番が逆だと。分かっている。分かった上で渋ってきた。一度でも安易に払えば、示談金を隠す者が群がる。私はそう思っていた。", next:"c2_ep5_hero2" },
    { id:"c2_ep5_hero2", type:"dialogue", speaker:"hero", location:SLOPE,
      text:"（一部の悪意を防ぐことと、全部を疑って渋ること。この人は、その二つを混ぜてしまった。線は引ける。悪意は後で弾ける。）",
      next:"c2_ep5_end", ideologyChanges:{ fair:1, mgmt:1 }, flags:{ c2_ep5_saw_sides:1 } },
    { id:"c2_ep5_end", type:"dialogue", speaker:"narrator", location:SLOPE, bgmScene:"field",
      text:"ヴォルガは書類を火にくべる手を止めた。だが頬の火傷をなぞりながら、審査炉の奥へ退がっていった。『次は炉の前で待つ』と。",
      next:"c2_ep5_hook", flags:{ c2_ep5_done:1 }, questUpdate:{ qid:"q_ch02b", state:"active", step:4 } },
    { id:"c2_ep5_hook", type:"dialogue", speaker:"gard", location:SLOPE, expression:"angry",
      text:"……あいつはまだ折れちゃいねえ。審査炉の前で、全部の認定をまとめて焼くつもりだ。行くぞ、調律師。", next:"c2_ep6_open" },

    /* ============================================================
       第6話「灼傷の審査官」— 中ボス【灼傷のヴォルガ v_mid_volga】戦
       認定・通勤の全体像。関係さらに深化(ガルド)。
       ============================================================ */
    { id:"c2_ep6_open", type:"dialogue", speaker:"narrator", location:TRIB, bgmScene:"emotion",
      text:"労災審査炉。壁の窯では、認定を待つ申請書が次々と灰に変えられていた。その前に、ヴォルガが火掻き棒を手に立ちはだかった。",
      next:"c2_ep6_choice", flags:{ c2_ep6_start:1 } },
    { id:"c2_ep6_choice", type:"choice", speaker:"hero", location:TRIB, text:"ヴォルガの炉を、どう止める?",
      choices:[
        { text:"認定基準の全体像で、焼かれる前の一枚を立証する",
          ideologyChanges:{ law:1, fair:1 }, flags:{ c2_ep6_path_law:1 }, next:"c2_ep6_probe" },
        { text:"同じ火傷を負った者として、まずヴォルガに語りかける",
          ideologyChanges:{ human:1, relief:1 }, flags:{ c2_ep6_path_human:1 }, next:"c2_ep6_alt" }
      ]},
    { id:"c2_ep6_alt", type:"dialogue", speaker:"gard", location:TRIB, portrait:"oni",
      text:"ヴォルガ。おれの腕も、お前の頬も、火が奪った。だがおれは拾われた。お前も拾われていい。焼く手を止めろ。……今なら間に合う。", next:"c2_ep6_probe" },

    { id:"c2_ep6_probe", type:"dialogue", speaker:"narrator", location:TRIB, bgmScene:"field",
      text:"炉に投じられる寸前の申請書。通勤の途中で倒れた者、因果が曖昧とされた者。認定の線引きで、一枚ずつ火から拾い上げる。",
      next:"c2_ep6_enc1", questUpdate:{ qid:"q_ch02b", state:"active", step:5 } },
    { id:"c2_ep6_enc1", type:"encounter", speaker:"hero", location:TRIB,
      text:"まずは認定の骨組み。通勤災害の要件、業務上外の判断、複数事業労働者の扱い。焼かれかけた一枚の筋を通す。",
      encounter: enc(2, "過去問｜業務上外の認定・通勤の全体を問う", { villain:"v_nichigaku", exam:2 }),
      evidence:"ev_ch2b_nintei", next:"c2_ep6_ev1" },
    { id:"c2_ep6_ev1", type:"dialogue", speaker:"mina", location:TRIB,
      text:"認定の筋、通せました。……ですが、ヴォルガ本人が火掻き棒を構えて前に出ます。焼かれた歳月ごと、正面からぶつかることになります。", next:"c2_ep6_enc2" },
    { id:"c2_ep6_enc2", type:"encounter", speaker:"hero", location:TRIB, bgmScene:"emotion",
      text:"灼傷のヴォルガが炉を背に立ちはだかった。第三者行為災害・求償・給付調整・認定の全体像。焼かれかけた補償を、炉から掻き出す。",
      encounter: enc(2, "過去問｜第三者行為・求償・認定の総合(中ボス)", { villain:"v_mid_volga", exam:3 }),
      evidence:"ev_ch2b_volga", next:"c2_ep6_ev2" },
    { id:"c2_ep6_ev2", type:"dialogue", speaker:"volga", location:TRIB, expression:"shock",
      text:"……火が、消えた。四十年、私はこの火で他人の火傷を焼き直してきた。誰も私を拾わなかったから、私も拾わないと決めた。……ただの意趣返しだったのか。", next:"c2_ep6_reason" },
    { id:"c2_ep6_reason", type:"reasoning", speaker:"hero", location:TRIB, bgmScene:"emotion",
      text:"認定の線、第三者への求償、給付の調整。――炉にくべた根拠は、そのどれもが拾い直せた。他人の火で焼かれた者も、この制度は抱える。",
      reasoning:{ need:["ev_ch2b_nintei","ev_ch2b_volga"] },
      flags:{ c2_ep6_reasoned:1 }, next:"c2_ep6_biz" },

    /* 【審査側の事情】断定せず、問いを残す */
    { id:"c2_ep6_biz", type:"dialogue", speaker:"volga", location:TRIB,
      text:"……最後に問わせろ。私が疑わなければ、示談金を隠す者も通り放題になる。全部を拾うことと、悪意を弾くこと。両方を立てられるのか?", next:"c2_ep6_hero2" },
    { id:"c2_ep6_hero2", type:"dialogue", speaker:"hero", location:TRIB,
      text:"（両方を立てる。悪意は証拠と調整で後から弾ける。だから入口で本物まで焼かなくていい。……疑う仕事を、拾う仕事の後ろに置く。）",
      next:"c2_ep6_bond", ideologyChanges:{ fair:1, mgmt:1 }, flags:{ c2_ep6_saw_sides:1 } },
    { id:"c2_ep6_bond", type:"dialogue", speaker:"gard", location:TRIB, bgmScene:"emotion", expression:"shock",
      text:"……調律師。おれはお前を疑ってた。条文ばっかりで痛みを分かっちゃいねえ、とな。……取り消す。おれの腕の分も、お前に賭ける。",
      next:"c2_ep6_end", relationshipChanges:{ cp2:1 }, flags:{ c2_ep6_bonded:1 } },
    { id:"c2_ep6_end", type:"dialogue", speaker:"narrator", location:TRIB, bgmScene:"field",
      text:"審査炉の火が鎮まり、灰の中から拾われるべき申請書が次々と現れた。だが火口の奥では、ロウサイ大王が灰の柱として立ち上がっていた。",
      next:"c2_ep6_hook", flags:{ c2_ep6_done:1 }, questUpdate:{ qid:"q_ch02b", state:"active", step:6 } },
    { id:"c2_ep6_hook", type:"dialogue", speaker:"gard", location:TRIB, expression:"angry",
      text:"……あれが大元だ。この街の『自己責任』って空気そのものが、王の形になってやがる。明日、火口で決着だ。", next:"c2_ep7_open" },

    /* ============================================================
       第7話「決戦前夜」
       ガルド/カイ/ミナとの会話で覚悟。戦う意味の総括(戦闘なし)。師匠ゼンの影を1本繋ぐ。
       ============================================================ */
    { id:"c2_ep7_open", type:"dialogue", speaker:"narrator", location:CAMP2, bgmScene:"town",
      text:"火口前の宿営。灰混じりの湯を沸かし、四人は火を囲んだ。明日、この山の空気そのものと戦う。その前の、静かな夜だった。",
      next:"c2_ep7_gard1", flags:{ c2_ep7_start:1 } },
    { id:"c2_ep7_gard1", type:"dialogue", speaker:"gard", location:CAMP2, portrait:"oni",
      text:"おれは三年、自分の腕を『仕事のせい』と言えなかった。言えば負けた気がしたからだ。……だが今は分かる。助けを求めるのは、負けじゃねえ。", next:"c2_ep7_kai1" },
    { id:"c2_ep7_kai1", type:"dialogue", speaker:"kai", location:CAMP2, expression:"angry",
      text:"悪いのは一人の悪人じゃねえ。『事故は自己責任』って空気を、みんなが少しずつ吸ってた。……ヴォルガも、その空気に焼かれた側だ。", next:"c2_ep7_mina1" },
    { id:"c2_ep7_mina1", type:"dialogue", speaker:"mina", location:CAMP2, portrait:"wiz",
      text:"不正請求はごくわずか。その僅かを恐れて全体を締めれば、救われるはずの多数が灰に消える。……明日突きつけるのは、その一点です。", next:"c2_ep7_hero1" },
    { id:"c2_ep7_hero1", type:"dialogue", speaker:"hero", location:CAMP2,
      text:"経営者も行政も悪じゃない。財源にも限りがある。労働者にもずるをする者はいる。……その全部を抱えた上で、痛んだ一人を拾う線を引く。", next:"c2_ep7_choice" },

    { id:"c2_ep7_choice", type:"choice", speaker:"hero", location:CAMP2, text:"覚悟を、言葉にする。",
      choices:[
        { text:"「切り捨て」を「支え合い」に変える。その第一歩として戦う",
          ideologyChanges:{ fair:1, mgmt:1 }, flags:{ c2_ep7_vow_bridge:1 }, next:"c2_ep7_vow" },
        { text:"灰に消えた一人ひとりを、数え直すために戦う",
          ideologyChanges:{ human:1, relief:1 }, flags:{ c2_ep7_vow_count:1 }, next:"c2_ep7_vow" }
      ]},
    { id:"c2_ep7_vow", type:"dialogue", speaker:"hero", location:CAMP2, bgmScene:"emotion",
      text:"王を倒しに行くんじゃない。『自己責任』を『支え合い』に書き換えに行く。誰も灰にしない仕組みを――そのために、明日、火口に立つ。", next:"c2_ep7_zen" },
    { id:"c2_ep7_zen", type:"dialogue", speaker:"narrator", location:CAMP2, bgmScene:"emotion",
      text:"ガルドが差し出した古い労災の手引き。裏表紙に掠れた字。『線を引く者は、線の外の痛みも背負え』――師匠ゼンの筆跡だった。",
      next:"c2_ep7_end", flags:{ c2_zen_ash2:1 } },
    { id:"c2_ep7_end", type:"dialogue", speaker:"hero", location:CAMP2, bgmScene:"field",
      text:"（師匠。この山でも線を引こうとして、背負いきれずに去ったんですね。……その宿題を、おれが引き受けます。明日、火口で。）",
      next:"c2_ep7_hook", flags:{ c2_ep7_done:1 }, questUpdate:{ qid:"q_ch02b", state:"active", step:7 } },
    { id:"c2_ep7_hook", type:"dialogue", speaker:"narrator", location:CAMP2,
      text:"夜が明けた。四人は灰の斜面を登り、火口の縁へと歩を進めた。降る灰が、いっそう濃くなっていた。", next:"c2_ep8_open" },

    /* ============================================================
       第8話「灰を払う者」— 章ボス【ロウサイ大王 v_boss_s2】戦
       【章末問題集】=これまでの労災の過去問を集めた高難度セット(examFmt中心・タイト)。
       登場アニメ+ブリーフィングは story-encounter が villain から自動生成する。
       撃破後は断定的勝利にせず「支え合う制度へ/間を取り持つ」テーマへ橋渡し(ENDING-CANON)。
       ============================================================ */
    { id:"c2_ep8_open", type:"dialogue", speaker:"narrator", location:CRATER, bgmScene:"emotion",
      text:"火口の縁。降り積もった灰が、ゆっくりと人の形に立ち上がった。憎しみもなく、怒りもなく――『事故は自己責任』という空気そのもの。",
      next:"c2_ep8_appear", flags:{ c2_ep8_start:1 } },
    { id:"c2_ep8_appear", type:"dialogue", speaker:"narrator", location:CRATER,
      text:"王が手を広げると、灰の中から無数の申請書が舞い上がった。落盤の工夫、片腕のガルド、遺された母子。皆、一度は灰にされた者たちだ。", next:"c2_ep8_rousai1" },
    { id:"c2_ep8_rousai1", type:"dialogue", speaker:"rousai", location:CRATER, portrait:"fire", expression:"angry",
      text:"よく来た、調律師。問おう。業務災害か、通勤災害か。その線の外に落ちた者は誰が拾う? ……拾わぬのが、世の習いだ。", next:"c2_ep8_hero1" },
    { id:"c2_ep8_hero1", type:"dialogue", speaker:"hero", location:CRATER,
      text:"一人じゃない。カイも、ミナも、ガルドもいる。灰にされた者たちも顔を上げた。……その習いを、今日、労災の全体像で覆す。", next:"c2_ep8_gard1" },
    { id:"c2_ep8_gard1", type:"dialogue", speaker:"gard", location:CRATER, expression:"angry",
      text:"御託はいい。積み上げた過去問の全部を、ここでぶつける。……おれの腕を灰にした習いを、今日で終いにする。", next:"c2_ep8_brief" },
    { id:"c2_ep8_brief", type:"dialogue", speaker:"narrator", location:CRATER, bgmScene:"emotion",
      text:"これは総決算。給付、認定、通勤、第三者――火山イグニスで暴いた歪みのすべてが【章末問題集】として襲いかかる。当てずっぽうは通らない。",
      next:"c2_ep8_enc1", questUpdate:{ qid:"q_ch02b", state:"active", step:8 } },
    { id:"c2_ep8_enc1", type:"encounter", speaker:"hero", location:CRATER, bgmScene:"emotion",
      text:"第一幕・給付/認定編。療養・休業・障害・遺族・傷病の年金、業務上外の認定を、高密度の五肢択一・個数で叩き込む。",
      encounter: enc(2, "章末問題集｜給付・認定編(高難度)", { villain:"v_boss_s2", n:12, exam:5 }),
      evidence:"ev_ch2b_boss1", next:"c2_ep8_mid" },
    { id:"c2_ep8_mid", type:"dialogue", speaker:"rousai", location:CRATER, expression:"shock",
      text:"……給付と認定は越えたか。だが通勤と、他人の火は別だ。線の外はどこまでも広い。その広さに、お前の情がどこまで届く。", next:"c2_ep8_enc2" },
    { id:"c2_ep8_enc2", type:"encounter", speaker:"hero", location:CRATER, bgmScene:"emotion",
      text:"第二幕・通勤/第三者編。通勤の逸脱と中断、第三者行為災害と求償、給付基礎日額を、同じ高密度で最後まで。",
      encounter: enc(2, "章末問題集｜通勤・第三者編(高難度)", { villain:"v_boss_s2", n:12, exam:5 }),
      evidence:"ev_ch2b_boss2", next:"c2_ep8_broke" },
    { id:"c2_ep8_broke", type:"dialogue", speaker:"narrator", location:CRATER, bgmScene:"emotion",
      text:"最後の一問が置かれた瞬間、灰の柱が内側から崩れ始めた。舞っていた申請書が一枚また一枚と拾い上げられ、色を取り戻していく。", next:"c2_ep8_reason" },
    { id:"c2_ep8_reason", type:"reasoning", speaker:"hero", location:CRATER, bgmScene:"emotion",
      text:"給付、認定、通勤、第三者――そのどれもが、線の外に落ちた一人を数え直すための条文だった。習いは、支え合いへと解かれた。",
      reasoning:{ need:["ev_ch2b_boss1","ev_ch2b_boss2"] },
      flags:{ c2_ep8_reasoned:1 }, next:"c2_ep8_rousai2" },

    /* 断定的勝利にしない。王/行政の独白で「支え合う制度へ/間を取り持つ」テーマへ橋渡し。 */
    { id:"c2_ep8_rousai2", type:"dialogue", speaker:"rousai", location:CRATER, expression:"shock",
      text:"……私は間違っていたのか。だが問おう。全部を拾えば財源は尽きる。尽きれば、次に倒れた者を誰も拾えなくなる。", next:"c2_ep8_assessor" },
    { id:"c2_ep8_assessor", type:"dialogue", speaker:"assessor", location:CRATER,
      text:"……大王。私はもう、あなたの習いに縋らない。だが問いは捨てられん。財源を残すことと、目の前の一人を拾うこと。その両立を。", next:"c2_ep8_zen" },
    { id:"c2_ep8_zen", type:"dialogue", speaker:"hero", location:CRATER, bgmScene:"emotion",
      text:"（師匠。あなたが背負いきれなかった問いが、ここにもあった。……切り捨てを支え合いに変える線を、引き続ける。それが宿題だ。）",
      next:"c2_ep8_hero_final", flags:{ c2_zen_ash_final:1 } },
    { id:"c2_ep8_hero_final", type:"dialogue", speaker:"hero", location:CRATER,
      text:"ロウサイ大王。あなたを裁きには来ていない。問いに答え続けに来た。……灰は、誰かを埋めるためじゃなく、払って顔を見つけるためにある。", next:"c2_ep8_final" },
    { id:"c2_ep8_final", type:"dialogue", speaker:"narrator", location:CRATER, bgmScene:"field",
      text:"灰の降る街で、切り捨ての習いが初めて支え合いへ書き換えられた。だが胸には、勝利より重い問いが残った――財源と痛みの間を、どう取り持つのか。",
      next:null, flags:{ c2_ep8_done:1, c2_boss_cleared:1, c2_ch02b_done:1 },
      questUpdate:{ qid:"q_ch02b", state:"done", step:9 } }
  ];

  /* 第4〜8話クエスト定義(doneFlag で完了判定)。q_ch02(前半)は無改変の別クエスト。 */
  if(typeof S.registerQuest==="function"){
    S.registerQuest("q_ch02b", {
      title:"灰を払う者",
      chapter:"ch02b",
      steps:["給付という命綱","他人の火","灼傷の審査官","決戦前夜","灰を払う"],
      doneFlag:"c2_ch02b_done"
    });
  }

  S.register("ch02b", NODES);
  S.CH02B_ID = "ch02b";

  /* メイン章の背骨(S.MAIN)へ、ch02(前半)の続きとして追記する。
     ・c2_ch02_done 後、ホームの「今日の冒険」が自動で本話へ進む導線になる。
     ・S.MAIN 未ロード/未定義でも安全(存在する時だけ push、重複登録も防ぐ)。 */
  if(Array.isArray(S.MAIN)){
    var exists = false;
    for(var i=0;i<S.MAIN.length;i++){ if(S.MAIN[i] && S.MAIN[i].id==="ch02b"){ exists = true; break; } }
    if(!exists){
      S.MAIN.push({ id:"ch02b", no:"第二章", title:"灰を払う者", loc:"火山イグニス・火口",
        doneFlag:"c2_ch02b_done", startedFlag:"c2_ep4_start" });
    }
  }
})();
