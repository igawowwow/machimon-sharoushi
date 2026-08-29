"use strict";
/* ============================================================
   story/story-interlude.js — S1(B)(C)(D): 幕・章話タイトルカード・区切り・紹介プレート
   ・「全然わからないタイミングで話が入る」を解消する“幕”の層。
     ①話/章の頭に全画面タイトルカード（第一章／第1話 消えたタイムカード／場所）
     ②話の終わりに「― 第1話 完 ―」の締め（次の話の頭で提示）
     ③演習（バトル）から戻った直後に、いきなり台詞でなく場所の幕をひとつ挟む
     ④初登場キャラの紹介プレート（story-cast.js の台帳を使用）
   ・物語データ（ノード内容）は一切書き換えない。演出メタはこの層だけが持つ。
   ・スキップ中（ui.skip）は幕を出さない＝テンポ優先。タップ/数秒で送れる。
   ・reduced-motion では自動送りもアニメも出さない（タップのみで進む）。
   ・全ての動的文字列は自前 esc2 で無害化。eval/new Function 禁止。
   docs/story-architecture.md §1/§4 準拠。480px / Safe Area / min44px。
   ============================================================ */
(function(){
  var G = (typeof window!=="undefined") ? window : globalThis;
  var S = G.SRStory = G.SRStory || {};
  var _win = G;

  function esc2(s){
    return String(s==null?"":s)
      .replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
      .replace(/"/g,"&quot;").replace(/'/g,"&#39;");
  }
  function reduced(){
    try{ return _win.matchMedia ? !!_win.matchMedia("(prefers-reduced-motion: reduce)").matches : true; }
    catch(e){ return true; }
  }

  /* ============================================================
     1. 話（エピソード）のメタ ─ 章データの開始ノードIDに紐づけるだけ。
        startId  : この話が始まるノードID（章データの id と一致）
        prevKey  : この話の直前に“完”を出す話（＝前話の締め）
        chapEnd  : この話の終わりが章の終わりでもある
     ============================================================ */
  S.EPISODES = S.EPISODES || [
    { key:"op", chapterId:"opening", startId:"o_open",
      chapNo:"", epNo:"オープニング", epTitle:"灰色革命",
      sub:"十二年前、この国は言葉を失った。", loc:"中央神殿・十二年前" },

    { key:"pr", chapterId:"prologue", startId:"p_open",
      chapNo:"序章", chapTitle:"灰色の朝", epNo:"序章", epTitle:"灰色の朝",
      sub:"なんでもない朝から、旅は始まる。", loc:"辺境ロウム・調律事務所", showChapter:1, chapEnd:1 },

    { key:"c1e1", chapterId:"ch01", startId:"c1_open",
      chapNo:"第一章", chapTitle:"鐘の鳴らない工都", epNo:"第1話", epTitle:"消えたタイムカード",
      sub:"鐘は鳴った。だが、誰も帰らなかった。", loc:"工都ベルガ・第七工場", showChapter:1 },

    { key:"c1e2", chapterId:"ch01", startId:"c1_ep2_open", prevKey:"c1e1",
      chapNo:"第一章", chapTitle:"鐘の鳴らない工都", epNo:"第2話", epTitle:"名ばかりの監督者",
      sub:"その札は、盾か。それとも鎖か。", loc:"第七工場・主任室" },

    { key:"c1e3", chapterId:"ch01", startId:"c1_ep3_open", prevKey:"c1e2",
      chapNo:"第一章", chapTitle:"鐘の鳴らない工都", epNo:"第3話", epTitle:"鳴らない鐘",
      sub:"それは事故ではなく、起こされた人災だった。", loc:"第七工場・第三ライン", chapEnd:1 }
  ];

  S.EP_BY_START = (function(){
    var m={}, i;
    for(i=0;i<S.EPISODES.length;i++){ m[S.EPISODES[i].startId] = S.EPISODES[i]; }
    return m;
  })();
  S.EP_BY_KEY = (function(){
    var m={}, i;
    for(i=0;i<S.EPISODES.length;i++){ m[S.EPISODES[i].key] = S.EPISODES[i]; }
    return m;
  })();
  /* 章の最後の話（finale で「第一章 完」を出すため） */
  S.lastEpisodeOf = function(chapterId){
    var last=null, i;
    for(i=0;i<S.EPISODES.length;i++){ if(S.EPISODES[i].chapterId===chapterId) last=S.EPISODES[i]; }
    return last;
  };

  /* ============================================================
     2. 提示済みの記録（1プレイ内。戦闘復帰で二重に出さないため）
     ============================================================ */
  var shown = {};
  S.resetInterludes = function(){ shown = {}; };
  S.interludeShown = function(k){ return !!shown[k]; };

  /* ============================================================
     3. 次に挟むべき幕を1つ返す（純ロジック）。無ければ null。
        呼び出し側は consume→再問い合わせで、複数の幕を順に消化できる。
     ============================================================ */
  S.interludeFor = function(node, ui){
    if(!node || typeof node.id!=="string") return null;

    /* ③ 演習から物語へ戻った直後: いきなり台詞にせず、場所の幕をひとつ挟む */
    if(ui && ui._backFromBattle){
      return { kind:"resume", token:"resume", ui:ui, hold:1800,
               eyebrow:"演習おわり ─ 物語にもどる", title:"物語パート",
               loc:(typeof node.location==="string" ? node.location : "") };
    }

    var ep = S.EP_BY_START[node.id];
    if(ep){
      /* ② 前話の締め（この話の頭で「― 第1話 完 ―」を出してから新しい話へ） */
      var prev = ep.prevKey ? S.EP_BY_KEY[ep.prevKey] : null;
      if(prev && !shown["end:"+prev.key]){
        return { kind:"epEnd", token:"end:"+prev.key, hold:2200,
                 eyebrow:prev.chapNo||"", title:"― "+prev.epNo+" 完 ―", sub:prev.epTitle, next:"次の話へ" };
      }
      /* ① 話（章）のタイトルカード */
      if(!shown["ttl:"+ep.key]){
        return { kind:"title", token:"ttl:"+ep.key, hold:3200,
                 chap:(ep.showChapter ? (ep.chapNo||"") : ""), chapTitle:(ep.showChapter?(ep.chapTitle||""):""),
                 eyebrow:ep.epNo||"", title:ep.epTitle||"", sub:ep.sub||"", loc:ep.loc||"" };
      }
    }

    /* ④ 初登場キャラの紹介プレート */
    if(typeof S.needsIntro==="function" && node.speaker && S.needsIntro(node.speaker)){
      var c = S.CAST_BY_ID[node.speaker];
      if(c && !shown["char:"+c.id]) return { kind:"char", token:"char:"+c.id, charId:c.id, hold:3600, char:c };
    }
    return null;
  };

  /* 幕を消化済みにする（提示が終わった時に必ず呼ぶ） */
  S.consumeInterlude = function(spec){
    if(!spec) return;
    if(spec.kind==="resume"){ if(spec.ui) spec.ui._backFromBattle = false; return; }
    if(spec.kind==="char"){
      if(typeof S.markMet==="function") try{ S.markMet(spec.charId); }catch(e){}
      /* 永続フラグが書けない環境でも同一再生中は再提示しない（_show の再問い合わせが無限化しない保険） */
      if(spec.token) shown[spec.token] = 1;
      return;
    }
    if(spec.token) shown[spec.token] = 1;
  };

  /* 章の最後に出す「― 第3話 完 ―／第一章 完 ―」（onChapterEnd から） */
  S.finaleFor = function(chapterId){
    var ep = S.lastEpisodeOf(chapterId);
    if(!ep) return null;
    if(shown["fin:"+ep.key]) return null;
    var chapLine = (ep.chapEnd && ep.chapNo) ? (ep.chapNo+" "+(ep.chapTitle||"")+" 読了") : "";
    return { kind:"finale", token:"fin:"+ep.key, hold:3200,
             eyebrow:ep.chapNo||"", title:"― "+ep.epNo+" 完 ―", sub:ep.epTitle||"",
             note:chapLine, next:"拠点にもどる" };
  };

  /* ============================================================
     3.5 章クリア演出 ─ 章ボス撃破で一度だけ出す「章 完」の大幕＋次章予告。
        ・データ駆動（chapterId → {clear, preview}）。定義の無い章では [] を返す
          ＝従来どおり finaleFor へフォールバックする（既存章を壊さない）。
        ・clear 幕は勝利ジングル（bgm:"victory"）。reduced-motion でも音は鳴らして良い
          （自動送りだけが止まる＝タップで進む）。全文字列は generic 幕として esc される。
        ・第二章予告はネタバレを避け、docs/story-bible.md §「第2章 安衛区」の芯だけを引く
          （予測された事故／止められなかった停止命令／確率か痛みか＝ミナの問い）。
     ============================================================ */
  S.CHAPTER_CLEAR = S.CHAPTER_CLEAR || {
    ch01c: {
      clear: {
        chapNo:"第一章", chapTitle:"鐘の鳴らない工都",
        title:"― 第一章 完 ―",
        sub:"鐘の鳴らなかった工都で、初めて鐘が正しく鳴った。",
        note:"労基と安衛――時間も、賃金も、安全も。歪みの設計図は、法の一つひとつで解かれた。" },
      preview: {
        eyebrow:"次章予告",
        title:"第二章 灰の降る街",
        sub:"事故は、自己責任か。",
        note:"火山イグニス。片腕を失った男が、会社にも国にも切り捨てられていた。痛みは、誰が引き受けるのか。",
        loc:"火山イグニスへ" }
    },
    /* 第二章クリア＝章ボス【ロウサイ大王 v_boss_s2】撃破で一度だけ。
       clear は「第二章 完」の大幕(勝利ジングル)。preview は docs/story-bible.md
       §「第3章 失業街／雇用保険法／リオ」の芯だけを引く＝ネタバレしすぎない。
       chapterId は chapter-02b.js の登録名(ch02b)＝onChapterEnd に渡る id と一致。 */
    ch02b: {
      clear: {
        chapNo:"第二章", chapTitle:"灰の降る街",
        title:"― 第二章 完 ―",
        sub:"灰の降る街で、切り捨ての習いが、初めて支え合いへと書き換えられた。",
        note:"給付、認定、通勤、第三者――労災の条文の一つひとつが、線の外に落ちた一人を、もう一度数え直した。" },
      preview: {
        eyebrow:"次章予告",
        title:"第三章 失業街",
        sub:"職を失うことは、罪なのか。",
        note:"雇用保険。『入れなければ払わずに済む』という制度の穴。その穴を逆手に、人を救う少女がいた。違法と救済の境で、はじめて心が揺れる。",
        loc:"失業街へ" }
    },
    /* 第三章クリア＝章ボス【シツギョウ魔人 v_boss_s3】撃破で一度だけ。
       clear は「第三章 完」の大幕(勝利ジングル)＝『三つめの法典のかけらを取り戻した』含意を1枚。
       preview は docs/story-bible.md §「第4章 徴収路／労働保険徴収法」の芯だけを引く＝ネタバレしすぎない。
       chapterId は chapter-03b.js の登録名(ch03b)＝onChapterEnd に渡る id と一致。 */
    ch03b: {
      clear: {
        chapNo:"第三章", chapTitle:"入れなければ払わずに済む",
        title:"― 第三章 完 ―",
        sub:"失業街オブロで、切り捨ての合言葉が、初めて支え合いへと書き換えられた。",
        note:"適用、離職理由、受給資格、給付、雇用継続――雇用保険の条文の一つひとつが、網からこぼれた一人の名を呼び戻した。三つめの雇用の法典のかけらが、静かに光を宿す。" },
      preview: {
        eyebrow:"次章予告",
        title:"第四章 徴収路",
        sub:"支え合いの原資は、どこから来るのか。",
        note:"労働保険の保険料。網を編む糸そのものを、誰が、どれだけ納めるのか。集める者と、集められる者の間で、はじめて『負担』の重さと向き合う。",
        loc:"徴収路へ" }
    },
    /* 第四章クリア＝章ボス【取立番長 v_boss_s4】撃破で一度だけ。
       clear は「第四章 完」の大幕(勝利ジングル)＝『四つめの法典のかけらを取り戻した』含意を1枚。
       preview は docs/story-bible.md §「第5章 医療都市／健康保険法／セラ」の芯だけを引く＝ネタバレしすぎない。
       (章ボス名ケンポ将軍・仲間セラの名は伏せ、善意と持続の相克という問いだけを置く)。
       chapterId は chapter-04b.js の登録名(ch04b)＝onChapterEnd に渡る id と一致。 */
    ch04b: {
      clear: {
        chapNo:"第四章", chapTitle:"払わぬが勝ち",
        title:"― 第四章 完 ―",
        sub:"徴収路で、逃れ合いの空気が、初めて支え合いへと数え直された。",
        note:"概算と確定、年度更新、印紙、一括、事務組合、督促――労働保険徴収法の条文の一つひとつが、束の下に消された一人ひとりを、原資として呼び戻した。四つめの法典のかけらが、静かに光を宿す。" },
      preview: {
        eyebrow:"次章予告",
        title:"第五章 医療都市",
        sub:"善意だけで、命は救い続けられるのか。",
        note:"健康保険。誰も見捨てまいとする治療師の手が、いつしか制度の財政を崖際へ追い込んでいた。守ることと、守り続けること。優しさが揺らぐ街で、はじめて主人公の理想そのものが試される。",
        loc:"医療都市へ" }
    },
    /* 第五章クリア＝章ボス【ケンポ将軍 v_boss_s5】撃破で一度だけ。
       clear は「第五章 完」の大幕(勝利ジングル)＝『五つめの法典のかけらを取り戻した』含意を1枚。
       preview は docs/story-bible.md §「第6章 砂漠／国民年金法／ノア」の芯だけを引く＝ネタバレしすぎない。
       (章ボス名コクネン仙人・仲間ノアの名は伏せ、記録から漏れた個という問いだけを置く)。
       chapterId は chapter-05b.js の登録名(ch05b)＝onChapterEnd に渡る id と一致。 */
    ch05b: {
      clear: {
        chapNo:"第五章", chapTitle:"誰も見捨てない",
        title:"― 第五章 完 ―",
        sub:"医療都市メディカで、慈悲の理想が、初めて『続く原資の重さ』とともに立て直された。",
        note:"標準報酬・標準賞与、傷病手当金、高額療養費、被扶養者、出産の給付、任意継続、埋葬料、資格の得喪――健康保険法の条文の一つひとつが、板挟みの下でこぼれた一人ひとりを、続く支え合いの原資へと呼び戻した。五つめの法典のかけらが、静かに光を宿す。" },
      preview: {
        eyebrow:"次章予告",
        title:"第六章 砂漠",
        sub:"記録がないだけで、その人は、いなかったことになるのか。",
        note:"国民年金。『納めぬ者こそ賢い』という囁きが砂に染み、免除も追納も知らぬまま、老いの支えから静かに滑り落ちていく人々がいた。制度の網の、いちばん外側。数字にも書類にも残らなかった一生に、はじめて手が届くのか。",
        loc:"砂漠へ" }
    },
    /* 第六章クリア＝章ボス【コクネン仙人 v_boss_s6】撃破で一度だけ。
       clear は「第六章 完」の大幕(勝利ジングル)＝『六つめの法典のかけらを取り戻した』含意を1枚。
       preview は docs/story-bible.md §「第7章 年金王国／厚生年金保険法／レオン」の芯だけを引く＝ネタバレしすぎない。
       (章ボス名コウネン皇帝・仲間レオンの名は伏せ、世代間で誰に負担を寄せるかという問いだけを置く)。
       chapterId は chapter-06b.js の登録名(ch06b)＝onChapterEnd に渡る id と一致。 */
    ch06b: {
      clear: {
        chapNo:"第六章", chapTitle:"明日を捨てない",
        title:"― 第六章 完 ―",
        sub:"黄昏の郷ノスタで、『今は要らない』の先送りが、初めて『見えない明日の重さ』とともに立て直された。",
        note:"保険料の免除・納付猶予・学生納付特例・産前産後免除、受給資格期間・合算対象期間、付加年金・任意加入、老齢・障害・遺族の基礎年金――国民年金法の条文の一つひとつが、板挟みの下で明日を削られた一人ひとりを、続く支え合いの原資へと呼び戻した。六つめの法典のかけらが、静かに光を宿す。" },
      preview: {
        eyebrow:"次章予告",
        title:"第七章 年金王国",
        sub:"支えるための負担は、いつも誰かの肩に寄る。",
        note:"厚生年金保険。老いた者の暮らしを守るその原資は、今を生きる若い肩から少しずつ集められていた。守る者と、担う者。悪人のいない世代の綱引きの只中で、はじめて『誰に、どれだけ負わせるのか』という問いそのものと向き合う。",
        loc:"年金王国へ" }
    },
    /* 第七章クリア＝章ボス【コウネン皇帝 v_boss_s7】撃破で一度だけ。
       clear は「第七章 完」の大幕(勝利ジングル)＝『七つめの法典のかけらを取り戻した』含意を1枚。
       preview は docs/story-bible.md §「第8章 行政都市／労一・社一（白書/統計）」の芯だけを引く＝ネタバレしすぎない。
       (章ボス名『統計老師』・仲間名『アリサ/白露』は伏せ、一件の悲劇と百万件の平均という問いだけを置く)。
       chapterId は chapter-07b.js の登録名(ch07b)＝onChapterEnd に渡る id と一致。 */
    ch07b: {
      clear: {
        chapNo:"第七章", chapTitle:"積み上げた報酬の果てに",
        title:"― 第七章 完 ―",
        sub:"累層の帝都エオンで、『報酬どおり』の秤が、初めて『こぼれる一人の格差』とともに釣り合い直された。",
        note:"標準報酬月額・標準賞与額・報酬比例部分・経過的加算、在職老齢年金・繰上げ繰下げ・離婚分割、障害厚生年金・遺族厚生年金・中高齢寡婦加算・加給年金・振替加算――厚生年金保険法の条文の一つひとつが、積み上げの秤の下で薄く削られた一人ひとりを、積み上げを報いながらもう一度底で支え直した。七つめの法典のかけらが、静かに光を宿す。" },
      preview: {
        eyebrow:"次章予告",
        title:"第八章 行政都市",
        sub:"一件の悲劇と、百万件の平均。数える手は、どちらも見捨てられるのか。",
        note:"労働一般・社会保険一般。白書と統計が国の形を決める行政都市で、一人ひとりの痛みが『例外処理』の一語に畳まれていく。冷たさの裏にも、百万人を支えるための事情がある。個の顔と、全体の平均。そのどちらも人間だと、はじめて統計そのものと向き合う。",
        loc:"行政都市へ" }
    },
    /* 第八章クリア＝章ボス【統計老師 v_boss_s8】撃破で一度だけ。労一・社一は全9科目の最後＝以後は終章へ。
       clear は「第八章 完」＝『九つめ(最後)の法典のかけらを取り戻し九つが揃った』含意を1枚。preview は
       終章への引き＝九つのかけらを携え試験の悪魔(本試験の化身)へ再び挑む一枚(エル/ユリウスの正体には踏み込まない)。 */
    ch08b: {
      clear: { chapNo:"第八章", chapTitle:"一件の悲劇と、百万件の平均の間", title:"― 第八章 完 ―",
        sub:"行政都市アルケで、『百万件の平均』の物差しが、初めて『こぼれる一件の悲劇』とともに結び直された。",
        note:"労働契約・労働組合・パワハラ防止・最低賃金・労働経済、社労士法・企業年金・国保・介護・高齢者医療・社会保険の沿革――労一と社一の条文の一つひとつが、平均の外へ『例外』と畳まれた一人ひとりを、全体を設計しながら縁で支え直した。九つめの、最後の法典のかけらが光を宿し、散り散りだった九つが、ついに一つに揃う。" },
      preview: { eyebrow:"次章予告", title:"終章 ─ 揃いし九つのかけら", sub:"暗記では、あの日は越えられなかった。",
        note:"取り戻した九つの法典のかけらを携え、調律師はもう一度、あの試験の悪魔――本試験の化身の前に立つ。だが挑むのは、暗記で勝つためではない。旅で出会った一人ひとりの顔と、経営者と労働者と行政の間で問い続けた答えを胸に。九つのかけらは、そのとき何を映し出すのか。",
        loc:"中央神殿へ" }
    }
  };

  /* 章クリアで順に出す幕の配列（無ければ空配列＝呼び出し側が finaleFor へ退く）。 */
  S.chapterClearSpecs = function(chapterId){
    var def = S.CHAPTER_CLEAR[chapterId];
    if(!def) return [];
    var out = [], c = def.clear, p = def.preview;
    if(c && !shown["clr:"+chapterId]){
      out.push({ kind:"clear", token:"clr:"+chapterId, hold:4400, bgm:"victory",
        eyebrow:c.chapTitle||"", title:c.title||"", sub:c.sub||"", note:c.note||"", next:"次へ" });
    }
    if(p && !shown["nx:"+chapterId]){
      out.push({ kind:"preview", token:"nx:"+chapterId, hold:4800,
        eyebrow:p.eyebrow||"次章予告", title:p.title||"", sub:p.sub||"", note:p.note||"",
        loc:p.loc||"", next:"拠点にもどる" });
    }
    return out;
  };

  /* ============================================================
     4. HTML 生成（純関数・全 esc）
     ============================================================ */
  function line(cls, txt){ return txt ? '<div class="'+cls+'">'+esc2(txt)+'</div>' : ""; }

  S.interludeHtml = function(spec){
    if(!spec) return "";
    var body;
    if(spec.kind==="char"){
      var c = spec.char || {};
      var face = (typeof S.castFaceHtml==="function") ? S.castFaceHtml(c, 76) : "";
      body =
        '<div class="il-face">'+face+'</div>'+
        line("il-eyebrow","はじめて出会う人物")+
        line("il-title", c.name)+
        line("il-role", c.role)+
        (c.bio ? '<p class="il-bio">'+esc2(c.bio)+'</p>' : "")+
        (c.why ? '<p class="il-why"><b>主人公との関わり</b><br>'+esc2(c.why)+'</p>' : "");
    } else {
      body =
        (spec.chap ? '<div class="il-chap">'+esc2(spec.chap)+
          (spec.chapTitle? '<span class="il-chap-t">'+esc2(spec.chapTitle)+'</span>' : '')+'</div>' : "")+
        line("il-eyebrow", spec.eyebrow)+
        line("il-title", spec.title)+
        line("il-sub", spec.sub)+
        line("il-note", spec.note)+
        (spec.loc ? '<div class="il-loc">📍 '+esc2(spec.loc)+'</div>' : "");
    }
    var hint = spec.next || "タップで進む";
    return '<div class="story-il il-'+esc2(spec.kind)+'" role="note" aria-label="幕">'+
      '<div class="il-in">'+ body +
        '<div class="il-next" aria-hidden="true">'+esc2(hint)+' ▶</div>'+
      '</div></div>';
  };

  /* ============================================================
     5. 描画層（S.ui）への機能追加。renderer は薄いフックだけを持ち、
        実体はここに置く＝renderer を肥大化させない。
     ============================================================ */
  var ui = S.ui;
  if(!ui) return;

  /* 幕を1枚出す。done は幕が閉じた後に呼ばれる。 */
  ui._interlude = function(spec, done){
    this._clearType(); this._clearAuto();
    this.mode = "interlude"; this.choices = null;
    this._ilSpec = spec; this._ilDone = (typeof done==="function") ? done : null;
    this._ensureEl();
    var el = this._el;
    if(el) el.innerHTML = S.interludeHtml(spec);
    if(spec && spec.bgm){                 /* 章クリアの勝利ジングル等（音は reduced-motion でも可） */
      try{
        if(spec.bgm==="victory" && typeof _win.bgmVictory==="function") _win.bgmVictory();
        else if(typeof _win.setBgmScene==="function") _win.setBgmScene(spec.bgm);
      }catch(e){}
    }
    if(!reduced()){                      /* reduced-motion では自動送りしない（タップのみ） */
      var self = this, ms = spec && spec.hold ? spec.hold : 2600;
      this._autoTimer = _win.setTimeout(function(){ self._ilNext(); }, ms);
    }
  };

  /* 幕を閉じて次へ（タップ/自動送り/キー操作の共通出口） */
  ui._ilNext = function(){
    this._clearAuto();
    var spec = this._ilSpec, done = this._ilDone;
    this._ilSpec = null; this._ilDone = null;
    this.mode = "";
    try{ S.consumeInterlude(spec); }catch(e){}
    if(done) done();
  };

  /* 章末（前進先が無いノードの後）: 章クリア大幕＋次章予告 → 締め → 通常の終了処理。
     ・章クリア定義があれば、その幕列を順に出す（章ボス撃破の締めくくり）。
     ・無ければ従来どおり finaleFor の締め幕を1枚。スキップ中は幕を出さず即終了。 */
  ui._chapterEnd = function(chapterId){
    var self = this;
    if(this.skip){ this._finish("chapterEnd"); return; }
    var specs = [];
    try{ if(typeof S.chapterClearSpecs==="function") specs = S.chapterClearSpecs(chapterId) || []; }
    catch(e){ specs = []; }
    if(!specs.length){
      var f = null;
      try{ f = S.finaleFor(chapterId); }catch(e2){}
      if(f) specs = [f];
    }
    if(!specs.length){ this._finish("chapterEnd"); return; }
    var i = 0;
    (function step(){
      if(i >= specs.length){ self._finish("chapterEnd"); return; }
      self._interlude(specs[i++], step);
    })();
  };

  /* 戦闘復帰の目印（bridge → resumeAfterBattle が立て、resume の幕で降ろす） */
  ui._markBackFromBattle = function(){ this._backFromBattle = true; };
})();
