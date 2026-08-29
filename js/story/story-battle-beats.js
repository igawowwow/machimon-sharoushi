"use strict";
/* ============================================================
   story/story-battle-beats.js — 物語→戦闘の「前振りビート」（S0-C）
   ・話からいきなり戦闘に飛ばさない。各 encounter の直前に
     「状況の緊迫 → 悪役の登場と悪事 → 事実と知識で立ち向かえ」のビートを差し込む。
   ・戦闘後は必ず「悪役が退く／真相が一歩進む」ビートで結果を物語に反映する。
   ・既存の章データ（prologue / chapter-01）は書き換えず、"追加ノードを綴じ込む"だけ。
     encounter の数・ID・報酬・証拠・分岐は一切変えない（既存テストの前提を保つ）。
   ・ヴィラン（js/data/villains.js）の vid と出題の形（n/exam）を encounter へ演出メタとして付与。
   ・データのみ。eval/new Function 禁止。DOM 非依存。
   ============================================================ */
(function(){
  var W = (typeof window!=="undefined") ? window : globalThis;
  var S = W.SRStory;
  if(!S || !S._chapters) return;   /* エンジン未ロードでも安全 */

  /* 小ボスが台詞を持つための話者登録。章側(ch01b/c)より先に読まれるため defensive に。
     殿指摘(2026-08-28)「ボスがいつまで経っても出ない」対応の一部:
     第1〜3話の締めをボス戦に前倒しし、ボスに顔と声を与える。 */
  if(S.SPEAKERS && typeof S.SPEAKERS==="object"){
    if(!S.SPEAKERS.valt)  S.SPEAKERS.valt  = { name:"刻印のヴァルト", px:"e_boss" };
    if(!S.SPEAKERS.noct)  S.SPEAKERS.noct  = { name:"名ばかり将軍ノクティス", px:"e_nabakari" };
    if(!S.SPEAKERS.graus) S.SPEAKERS.graus = { name:"監督官 グラウス", px:"e_graus" };
  }

  /* ---- 綴じ込み（純データ操作）: pre→encounter→post に鎖を張り替える ---- */
  function redirect(map, from, to, skip){
    for(var k in map){
      if(skip[k] || k===from) continue;
      var n = map[k];
      if(!n) continue;
      if(n.next===from) n.next = to;
      else if(n.next && typeof n.next==="object"){
        if(n.next.then===from) n.next.then = to;
        if(n.next.else===from) n.next.else = to;
      }
      if(Array.isArray(n.choices)){
        n.choices.forEach(function(c){
          if(!c) return;
          if(c.next===from) c.next = to;
          else if(c.next && typeof c.next==="object"){
            if(c.next.then===from) c.next.then = to;
            if(c.next.else===from) c.next.else = to;
          }
        });
      }
    }
  }
  S.spliceBeats = function(chapterId, spec){
    var map = S._chapters[chapterId];
    if(!map || !Array.isArray(spec)) return 0;
    var done = 0;
    spec.forEach(function(b){
      var enc = b && map[b.at];
      if(!enc || enc.type!=="encounter") return;
      if(enc.encounter && typeof enc.encounter==="object"){
        if(b.villain) enc.encounter.villain = b.villain;
        if(typeof b.n==="number") enc.encounter.n = b.n;
        if(typeof b.exam==="number") enc.encounter.exam = b.exam;
      }
      if(b.villain && b.villain!=="none" && !enc.villain) enc.villain = b.villain;
      if(Array.isArray(b.pre) && b.pre.length){
        var skip = {};
        b.pre.forEach(function(n,i){
          n.next = (i+1<b.pre.length) ? b.pre[i+1].id : b.at;
          map[n.id] = n; skip[n.id] = 1;
        });
        redirect(map, b.at, b.pre[0].id, skip);
      }
      if(Array.isArray(b.post) && b.post.length){
        var orig = enc.next;
        b.post.forEach(function(n,i){
          n.next = (i+1<b.post.length) ? b.post[i+1].id : orig;
          map[n.id] = n;
        });
        enc.next = b.post[0].id;
      }
      done++;
    });
    return done;
  };

  function d(id, speaker, loc, text, extra){
    var n = { id:id, type:"dialogue", speaker:speaker, location:loc, text:text, next:null };
    if(extra){ for(var k in extra) n[k] = extra[k]; }
    return n;
  }

  var BERGA="工都ベルガ・第七工場", SHUNIN="第七工場・主任室", LINE3="第七工場・第三ライン";
  var BAKERY="パン工房「灰かぶりの窯」";

  /* ============================================================
     序章: 初戦はやさしく（登録試験は相手なし／最初の一戦は本試験形式を混ぜない）
     ============================================================ */
  S.spliceBeats("prologue", [
    { at:"p_exam", villain:"none", n:6, exam:0 },

    { at:"p_enc_time", villain:"v_fuyajo", n:6, exam:0,
      pre:[
        d("p_pre_time1","narrator",BAKERY,"閉店の札が下がっても、窯の火は落ちていなかった。灯りの下に、痩せた影が座っている。",{bgmScene:"emotion",expression:"shock"}),
        d("p_pre_time2","hero",BAKERY,"（灯りが点いている限り、帰らせない。……その理屈を、崩す。打刻を、読む。）")
      ],
      post:[ d("p_post_time","worker",BAKERY,"……打刻、残ってたんですね。わたし、気のせいかと思ってました。") ] },

    { at:"p_enc_contract", villain:"v_grim", n:7, exam:1,
      pre:[
        d("p_pre_ctr1","narrator",BAKERY,"契約書の控えは、粉だらけの引き出しの底にあった。金額の欄に、書き直された跡がある。"),
        d("p_pre_ctr2","kai",BAKERY,"制服代? ミス代? ……そんな名目で、給料から引いていいのかよ。",{expression:"angry"})
      ],
      post:[ d("p_post_ctr","hero",BAKERY,"賃金は全額、直接、本人に。……削られていたのは、金額じゃない。約束だ。") ] },

    { at:"p_enc_testimony", villain:"v_rakel", n:7, exam:1,
      pre:[
        d("p_pre_tst1","narrator",BAKERY,"ハルは、休みの話になると口をつぐんだ。「みんな取っていないので」と、それだけ言った。"),
        d("p_pre_tst2","hero",BAKERY,"（年休に、理由はいらない。……そう言える人が、そばに一人もいなかっただけだ。）")
      ],
      post:[ d("p_post_tst","worker",BAKERY,"休んで、いいんですか。……理由、聞かれないんですか。") ] }
  ]);

  /* ============================================================
     第一章: 六つの演習それぞれに、名前を持つ悪役と「戦う意味」を置く
     ============================================================ */
  S.spliceBeats("ch01", [
    { at:"c1_enc_timecard", villain:"v_kaizanko", n:8, exam:1,
      pre:[
        d("c1_pre_tc1","narrator",BERGA,"記録棚の前。打刻の束が、ひとりでに薄くなっていく。棚の陰で、細い影が紙をめくっていた。",{bgmScene:"emotion",expression:"shock"}),
        d("c1_pre_tc2","kai",BERGA,"あいつだ。あいつが、工場じゅうの時間を食って回ってやがる。……調律師、やれるか。",{expression:"angry"})
      ],
      post:[ d("c1_post_tc","narrator",BERGA,"影は札を取り落とし、記録棚の奥へ消えた。残された束は――消される前の、生の時間だった。") ] },

    { at:"c1_enc_ledger", villain:"v_fuyajo", n:6, exam:1,
      pre:[
        d("c1_pre_lg1","narrator",BERGA,"賃金台帳のある事務室は、夜通し灯りが点いていた。扉の前に、痩せた番人が立っている。"),
        d("c1_pre_lg2","hero",BERGA,"働いた時間には、値段がつく。それが法の約束だ。……あなたは、その約束を握りつぶしている。")
      ],
      post:[ d("c1_post_lg","narrator",BERGA,"番人は灯りを落とし、黙って道を空けた。台帳は、四十五時間で止まったまま開かれていた。") ] },

    /* 第1話の締め=小ボス初登場。偽判の元締ヴァルトが顔を見せ、敗れて逃げる(第5話で再戦) */
    { at:"c1_enc_agreement", villain:"v_lt_valt", n:8, exam:1,
      pre:[
        d("c1_pre_ag1","narrator",BERGA,"協定書の綴りの底から、真新しい朱肉の匂いがした。"),
        d("c1_pre_ag2","kai",BERGA,"判子だけが、やたら綺麗だな。……誰が押した、これ。",{expression:"angry"}),
        d("c1_pre_ag3","narrator",BERGA,"綴りの陰で、刻印が鳴った。時間泥棒の元締――刻印のヴァルト。偽の判で、残業の『入れ物』ごと偽造してきた男だ。",{bgmScene:"emotion",expression:"shock"})
      ],
      post:[
        d("c1_post_ag0","valt",BERGA,"……ほう、偽判を見抜いたか。だがこの判を彫らせたのは、私より上だ。……また会おう、調律師。"),
        d("c1_post_ag","hero",BERGA,"（逃がした。だが分かったことがある。偽の判子は、上限を作らない。この工場の残業には、そもそも入れ物が無かった。）")
      ] },

    /* 第2話の締め=小ボス初登場。札を刷る将ノクティスが現れ、敗れて逃げる(第4話で再戦) */
    { at:"c1_enc_role", villain:"v_lt_noct", n:10, exam:2,
      pre:[
        d("c1_pre_rl1","narrator",SHUNIN,"主任室の壁には、同じ書式の札が何十枚も掛かっていた。違うのは、名前だけだ。"),
        d("c1_pre_rl2","hero",SHUNIN,"（肩書きは盾じゃない。実態で判断する――それが法だ。この札を、剥がす。）"),
        d("c1_pre_rl3","narrator",SHUNIN,"札の奥から、勲章の音が鳴った。工都じゅうに『長』の札を刷り、配って回る将――名ばかり将軍ノクティス。",{bgmScene:"emotion",expression:"shock"})
      ],
      post:[
        d("c1_post_rl0","noct",SHUNIN,"その札はくれてやる。だが版木は、上にある。私を剥がしても、明日また同じ札が刷られるぞ。"),
        d("c1_post_rl","hanna",SHUNIN,"……この札、外してもいいんですね。ずっと、外しちゃいけないものだと思ってました。")
      ] },

    { at:"c1_enc_device", villain:"v_danma", n:6, exam:1,
      pre:[
        d("c1_pre_dv1","narrator",LINE3,"休憩室の掲示板に、剥がされた跡がひとつ。『面接指導の申出はこちらへ』――その紙だけが、無い。",{bgmScene:"emotion",expression:"shock"}),
        d("c1_pre_dv2","mina",LINE3,"剥がしたのは今日ではありません。ずっと、知らせずにきた。……止めるなら、記録が要ります。")
      ],
      post:[ d("c1_post_dv","mina",LINE3,"記録しました。読まれなかった健診、伝えられなかった窓口、行われなかった面談。……次は、防げます。") ] },

    /* 第3話の締め=章ボス グラウス本人が初登場・直接対決。勝つと撤退し、第10話の決戦へ因縁が繋がる */
    { at:"c1_enc_accident", villain:"v_mid_graus", n:10, exam:2,
      pre:[
        d("c1_pre_ac1","narrator",LINE3,"鉄の足音が、第三ラインに響いた。統制局の監督官――グラウス。その手には、棚から抜き取られた報告書の綴りがあった。",{bgmScene:"emotion",expression:"shock"}),
        d("c1_pre_ac2","graus",LINE3,"報告は不要だ。人が一人倒れた程度で、工都の機械は止められん。……ほう。お前が、例の調律師か。"),
        d("c1_pre_ac3","kai",LINE3,"レンが倒れたのは、今日だぞ。なのに、なんで先に紙が消えてやがる!",{expression:"angry"})
      ],
      post:[
        d("c1_post_ac0","graus",LINE3,"……紙一枚は、守り切ったか。だがこの工都の工場は、すべて同じ理屈で回っている。全部、正して回るつもりか? ……励め、調律師。"),
        d("c1_post_ac","hero",LINE3,"（グラウス。あの男が、この工都の歪みの中心にいる。……まずは、レンの痛みを、記録に戻した。）")
      ] }
  ]);

  S.BEATS_READY = true;
})();
