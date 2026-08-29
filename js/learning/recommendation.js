"use strict";
/* ============================================================
   learning/recommendation.js — 「システムが選ぶ」出題の芯(純)
   ・recommend20(env,n): 理由付きおすすめ(core/recommend.js の純移植)。
   ・buildSession(env,size,mix): 単一CTA「今日の冒険」の実体。復習60/新規30/挑戦10で
     3〜10問を自動配合。ユーザーにモードを選ばせない。
   【最重要】buildSession の候補は全て env.study(=一般プールQ)からのみ。
     study は examFmt/nendo/caseOnly/未監修を含まない(pools.isStudyQ ゲート)ため、
     本試験形式は【型として絶対に混入しない】(挑戦=study内の難問フロンティア)。
   DOM/Store非依存: env アクセサ経由。ランダムは env.rng(既定 Math.random)。
   ============================================================ */
(function(){
  var G = (typeof window!=="undefined") ? window : globalThis;
  var L = G.SRLearning = G.SRLearning || {};

  function rngOf(env){ return (env && env.rng) || Math.random; }
  function shuffle(a, rng){
    a = a.slice();
    for(var i=a.length-1;i>0;i--){ var j=Math.floor(rng()*(i+1)); var t=a[i];a[i]=a[j];a[j]=t; }
    return a;
  }
  function statOf(env, id){ return env.statOf ? env.statOf(id) : undefined; }
  function clamp(v,min,max){ return v<min?min:(v>max?max:v); }

  /* ---------- recommend20: 理由付きおすすめ(core/recommend.js の純移植) ---------- */
  function recommend20(env, n){
    n = n || 20;
    var pools=L.pools, mastery=L.mastery, byId=env.byId;
    var rng=rngOf(env), today=env.today;
    var ids=[], reasons={}, perSub={};
    var cap=Math.max(4, Math.ceil(n/3));
    function q(id){ return byId ? byId(id) : null; }
    function push(id, reason){
      id=String(id);
      if(ids.length>=n || reasons[id]!==undefined) return false;
      var qo=q(id); if(!qo) return false;
      var s=qo.s;
      if((perSub[s]||0)>=cap) return false;
      ids.push(id); reasons[id]=reason; perSub[s]=(perSub[s]||0)+1; return true;
    }
    /* ① 期限超過(超過日数が大きい順) */
    var due=pools.dueIds(env).map(function(id){ var st=statOf(env,id); return { id:id, over:today-((st&&st.due)||0) }; })
                             .sort(function(a,b){ return b.over-a.over; });
    for(var i=0;i<due.length;i++){ if(ids.length>=Math.min(12,n)) break;
      push(due[i].id, due[i].over>=2 ? ("復習期限を"+due[i].over+"日過ぎています") : "今日が復習どきです(忘却曲線)"); }
    /* ①.5 沼問題の救済 */
    var le=shuffle(pools.leechIds(env), rng);
    for(i=0;i<le.length;i++){ if(ids.length>=Math.min(14,n)) break; push(le[i], "何度も間違えている要注意問題です"); }
    /* ② 誤答したまま */
    var wr=shuffle(pools.wrongIds(env), rng);
    for(i=0;i<wr.length;i++){ if(ids.length>=Math.min(15,n)) break; push(wr[i], "前回間違えた問題です"); }
    /* ③ 弱点科目の未習得 */
    var weak=mastery.weakestSubjects(env, 2);
    for(var w=0;w<weak.length;w++){
      var sub=weak[w], poolW=[];
      for(i=0;i<env.study.length;i++){ var x=env.study[i]; if(x.s===sub && !mastery.isMastered(statOf(env,x.id))) poolW.push(x.id); }
      poolW=shuffle(poolW, rng);
      for(i=0;i<poolW.length;i++){ if(ids.length>=n-3) break; push(poolW[i], (env.subjects[sub]||"この科目")+"が弱点です(定着度最下位)"); }
    }
    /* ④ 未挑戦の新問 */
    var uns=shuffle(pools.unseenIds(env), rng);
    for(i=0;i<uns.length;i++){ if(ids.length>=n) break; push(uns[i], "まだ解いたことのない新問です"); }
    /* ⑤ 残り: 本試験ベース→全体 */
    var past=shuffle(pools.pastQIds(env), rng);
    for(i=0;i<past.length;i++){ if(ids.length>=n) break; push(past[i], "本試験の出題実績がある論点です"); }
    var all=shuffle(env.study.map(function(x){ return x.id; }), rng);
    for(i=0;i<all.length;i++){ if(ids.length>=n) break; push(all[i], "総仕上げの1問です"); }
    return { ids:ids, reasons:reasons };
  }

  /* ---------- buildSession: 単一CTAの自動配合(復習60/新規30/挑戦10・3〜10問) ---------- */
  function buildSession(env, size, mix){
    var pools=L.pools, mastery=L.mastery, rng=rngOf(env);
    mix = mix || { review:0.6, "new":0.3, challenge:0.1 };
    /* 3〜10問にクランプ(単一CTAの短単位) */
    size = clamp(Math.round(size || 5), 3, 10);

    var nReview = Math.round(size*mix.review);
    var nNew    = Math.round(size*mix["new"]);
    var nChal   = size - nReview - nNew;                 /* 残りを挑戦(10%相当) */
    if(nChal<0){ nChal=0; nNew=size-nReview; }

    /* --- 候補プール(すべて study からのみ = 本試験形式は型として混入不可) --- */
    /* 復習/苦手: leech(最優先) → due(超過大きい順) → wrong */
    var dueSorted = pools.dueIds(env).map(function(id){ var st=statOf(env,id); return { id:id, over:env.today-((st&&st.due)||0) }; })
                                     .sort(function(a,b){ return b.over-a.over; }).map(function(x){ return x.id; });
    var reviewCand = pools.leechIds(env).concat(dueSorted).concat(pools.wrongIds(env));
    /* 挑戦: 未習得で難度の高い study 問題(未挑戦含む)= 本試験へ向けたストレッチ */
    var unseen = pools.unseenIds(env);
    var difOf = {}; for(var d=0;d<env.study.length;d++){ difOf[String(env.study[d].id)] = env.study[d].difficulty||2; }
    var challengeCand = unseen.slice().sort(function(a,b){ return (difOf[String(b)]||0)-(difOf[String(a)]||0); });
    /* 新規: 未挑戦(シャッフル) */
    var newCand = shuffle(unseen, rng);

    var picked=[], seen={}, reasons={}, buckets={ review:[], "new":[], challenge:[] };
    function take(id, bucket, reason){
      id=String(id);
      if(seen[id] || picked.length>=size) return false;
      seen[id]=1; picked.push(id); buckets[bucket].push(id); reasons[id]=reason; return true;
    }
    function fillFrom(list, bucket, limit, reason){
      for(var i=0;i<list.length && buckets[bucket].length<limit;i++) take(list[i], bucket, reason);
    }
    fillFrom(reviewCand,    "review",    nReview, "復習(定着を固める)");
    fillFrom(challengeCand, "challenge", nChal,   "挑戦(本試験に向けた難問)");
    fillFrom(newCand,       "new",       nNew,    "新規(未挑戦の論点)");
    /* 不足分は残り候補→全 study で size まで埋める(短単位を必ず成立させる) */
    var backfill = reviewCand.concat(newCand).concat(challengeCand)
                    .concat(env.study.map(function(x){ return x.id; }));
    for(var b=0;b<backfill.length && picked.length<size;b++) take(backfill[b], "review", "総仕上げの1問");

    return { ids:picked, buckets:buckets, reasons:reasons,
             target:{ review:nReview, "new":nNew, challenge:nChal }, size:size };
  }

  L.recommendation = { recommend20:recommend20, buildSession:buildSession };
})();
