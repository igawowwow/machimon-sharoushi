"use strict";
/* ============================================================
   learning/selection.js — 出題の「選び方」レイヤー(純・DOM/Store非依存)
   S4(A)(B): 「まじで同じ内容ばかり/出題範囲が狭い/ヌルゲー」への回答。
   ・(A) 直近に出した問題IDのリング(recent)を持ち、毎回そこを避けて科目の全プールから
     広く抽出する。600問超の資産を毎回まわす=同じ問題の連続再会を止める。
   ・(A) 同じ論点が連続しないようインターリーブして並べる(論点は別の問題で反復)。
   ・(B) 難易度ランプ: 初戦は○×で慣らし、経験に応じて本試験形式(examFmt=五肢択一/個数)を
     段階的に混ぜる。ボスは examFmt 中心=過去問と同難易度。
   【不変】問題データ・問題ID・採点・SRS・報酬には一切触れない。選抜の順序と割合だけを決める。
   eval/new Function 不使用。乱数は引数 rand で差し替え可(テストで決定的にできる)。
   ============================================================ */
(function(){
  var G = (typeof window!=="undefined") ? window : globalThis;
  var L = G.SRLearning = G.SRLearning || {};

  /* 直近リングの既定長。科目1つ分の1セッション(=12問)を数回ぶん覚えておく大きさ。 */
  var RECENT_CAP = 80;

  function idOf(q){ return (q && typeof q==="object") ? q.id : q; }
  function shuf(a, rand){
    rand = (typeof rand==="function") ? rand : Math.random;
    a = (a||[]).slice();
    for(var i=a.length-1;i>0;i--){ var j=Math.floor(rand()*(i+1)), t=a[i]; a[i]=a[j]; a[j]=t; }
    return a;
  }

  /* ------------------------------------------------------------
     1. 直近出題リング(新しいものが末尾。重複は最新の位置へ畳む)
     ------------------------------------------------------------ */
  function pushRecent(ring, ids, cap){
    cap = (cap>0) ? (cap|0) : RECENT_CAP;
    var all = (ring||[]).map(String).concat((ids||[]).map(function(x){ return String(idOf(x)); }));
    var seen = {}, res = [];
    for(var i=all.length-1;i>=0;i--){
      var k = all[i];
      if(seen[k]) continue;
      seen[k] = 1; res.unshift(k);
    }
    if(res.length > cap) res = res.slice(res.length - cap);
    return res;
  }
  /* id -> 新しさ順位(1=最古 … n=最新)。未出題は undefined。 */
  function recentRank(ring){
    var m = {};
    (ring||[]).forEach(function(id, i){ m[String(id)] = i + 1; });
    return m;
  }

  /* ------------------------------------------------------------
     2. (A) 広く選ぶ: 直近に出していないものを優先。足りなければ「古く出したもの」から補う。
        pool は問題オブジェクト配列でもID配列でもよい(要素の型のまま返す)。
     ------------------------------------------------------------ */
  function pickWide(pool, ring, n, rand){
    n = Math.max(0, n|0);
    if(!n) return [];
    var rank = recentRank(ring), fresh = [], stale = [];
    (pool||[]).forEach(function(q){
      if(q==null) return;
      (rank[String(idOf(q))] ? stale : fresh).push(q);
    });
    var out = shuf(fresh, rand).slice(0, n);
    if(out.length < n){
      /* 古く出したものほど先に復帰させる(=直近の再会を最後まで避ける) */
      stale.sort(function(a,b){ return rank[String(idOf(a))] - rank[String(idOf(b))]; });
      out = out.concat(stale.slice(0, n - out.length));
    }
    return out;
  }

  /* ------------------------------------------------------------
     3. (A) インターリーブ: 同じ論点(既定キー = 科目+図解キー/論点)が連続しないよう並べ替える。
        並べ替えるだけで、問題そのものは差し替えない。
     ------------------------------------------------------------ */
  function defaultKey(q){
    if(!q || typeof q!=="object") return String(q);
    return String(q.s) + "/" + String(q.z || q.topic || q.topicIntro || q.id);
  }
  function interleave(qs, keyOf){
    keyOf = (typeof keyOf==="function") ? keyOf : defaultKey;
    var rest = (qs||[]).slice(), out = [], prev = null;
    while(rest.length){
      var pick = -1;
      for(var i=0;i<rest.length;i++){ if(keyOf(rest[i])!==prev){ pick = i; break; } }
      if(pick < 0) pick = 0;              /* 全部同じ論点なら諦めてそのまま並べる */
      var q = rest.splice(pick,1)[0];
      out.push(q); prev = keyOf(q);
    }
    return out;
  }

  /* ------------------------------------------------------------
     4. (B) 難易度ランプ
        stageOf: その科目で解いた累計問題数 → 段階(0=初見 …3=手練れ)
        examQuota: n問中いくつを本試験形式(examFmt)にするか
     ------------------------------------------------------------ */
  function stageOf(seenCount){
    seenCount = Math.max(0, seenCount|0);
    if(seenCount < 6)  return 0;   /* 初戦〜: まず○×で論点の形をつかむ */
    if(seenCount < 20) return 1;   /* 慣らし終わり: 本試験形式が顔を出す */
    if(seenCount < 45) return 2;
    return 3;                      /* 実戦: 過去問寄りが常時混ざる */
  }
  var MOB_RAMP = [0, 1, 2];        /* mob の stage 0/1/2 での examFmt 本数 */
  function examQuota(n, stage, rank){
    n = Math.max(1, n|0); stage = Math.max(0, stage|0);
    var r;
    if(rank==="boss")      r = Math.ceil(n * 0.75); /* ボス=過去問と同難易度(examFmt中心) */
    else if(rank==="mid")  r = Math.ceil(n * 0.5);
    else if(rank==="lt")   r = Math.ceil(n * 0.35);
    else r = (stage < MOB_RAMP.length) ? MOB_RAMP[stage] : Math.ceil(n * 0.3);
    if(r > n) r = n;
    return r < 0 ? 0 : r;
  }
  /* 段階の呼び名(UIの見出し用・短く) */
  function rampLabel(quota, n, rank){
    if(rank==="boss") return "本試験級";
    if(!quota) return "ならし(○×)";
    return (quota / Math.max(1,n) >= 0.5) ? "本試験級" : "実戦";
  }
  /* 難易度★(1..5)。本試験形式の割合と格で決める。 */
  function stars(quota, n, rank){
    var base = (rank==="boss") ? 4 : (rank==="mid") ? 3 : (rank==="lt") ? 2 : 1;
    var ratio = quota / Math.max(1, n|0);
    var s = base + (ratio >= 0.5 ? 1 : ratio > 0 ? 0 : -1);
    return Math.min(5, Math.max(1, s));
  }
  /* 想定時間(分)。○×≒15秒 / 本試験形式≒60秒(五肢を読む)。 */
  function estMinutes(n, quota){
    n = Math.max(0, n|0); quota = Math.min(n, Math.max(0, quota|0));
    return Math.max(1, Math.ceil(((n - quota) * 15 + quota * 60) / 60));
  }

  /* ------------------------------------------------------------
     5. 出題セットの組成(A+B の合流)
        o = { tfPool, examPool, ring, n, exam, rand }
        ・examPool から exam 本(広く)/ 残りを tfPool から「正解が○/×ほぼ同数」で(広く)
        ・最後にシャッフル→論点インターリーブ
        ※○/×の均衡は S0 の「○連打では勝てない」を維持するための不変条件。
     ------------------------------------------------------------ */
  function buildSet(o){
    o = o || {};
    var rand = (typeof o.rand==="function") ? o.rand : Math.random;
    var n = Math.max(1, o.n|0);
    var quota = Math.min(n, Math.max(0, o.exam|0));
    var ex = pickWide(o.examPool || [], o.ring, quota, rand);
    var need = n - ex.length;
    /* ○/×の均衡に余裕を持たせるため候補は多めに拾う */
    var cand = pickWide(o.tfPool || [], o.ring, Math.max(need * 3, need), rand);
    var tt = [], ff = [];
    cand.forEach(function(q){ if(q) (q.a===true ? tt : ff).push(q); });
    var tf = [], useT = rand() < 0.5;
    while(tf.length < need && (tt.length || ff.length)){
      var src = useT ? tt : ff;
      if(!src.length) src = useT ? ff : tt;
      tf.push(src.shift());
      useT = !useT;
    }
    return interleave(shuf(tf.concat(ex), rand));
  }

  /* 選抜結果の健全性(テスト/監査用)。○連打で取れる点=maruOnly。 */
  function audit(qs){
    var t=0, f=0, exam=0;
    (qs||[]).forEach(function(q){
      if(!q) return;
      if(q.examFmt || (q.format && q.format!=="true_false")){ exam++; return; }
      if(q.a===true) t++; else f++;
    });
    return { t:t, f:f, exam:exam, total:t+f+exam, skew:Math.abs(t-f), maruOnly:t };
  }

  L.selection = {
    RECENT_CAP:RECENT_CAP, MOB_RAMP:MOB_RAMP,
    pushRecent:pushRecent, recentRank:recentRank, pickWide:pickWide,
    interleave:interleave, defaultKey:defaultKey,
    stageOf:stageOf, examQuota:examQuota, rampLabel:rampLabel, stars:stars,
    estMinutes:estMinutes, buildSet:buildSet, audit:audit
  };
})();
