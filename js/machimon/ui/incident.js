"use strict";
/* ============================================================
   machimon/ui/incident.js — 事件(問題を解く画面)
   ★導入は1行だけ。問題文・解説は既存の教材をそのまま使い、改変しない。
   ★正解したら「次へ」を押させず、自動で街へ戻る(1タップでも減らす)。
     誤答時だけ解説を自動展開する(理解の機会を逃さない)。
   ============================================================ */
(function(){
  var G=(typeof window!=="undefined")?window:globalThis;
  var MM=G.MM=G.MM||{}; var UI=MM.ui;

  var t0=0;

  UI.screens.incident=function(p){
    var c=UI.ctx(), esc=UI.esc;
    var inc=MM.incident.find(c,p.id);
    if(!inc)return UI.screens.town();
    var qid=MM.incident.currentQid(inc);
    var q=(typeof G.qById==="function")?G.qById(qid):null;
    if(!q)return UI.screens.town();
    var k=MM.DATA.incKindById[inc.kind]||{badge:"",color:"#8A8494"};
    var a=MM.DATA.areaById[inc.area]||{name:""};
    t0=Date.now();
    var h='<div class="mm-wrap">'+UI.resBar(c)
      +'<div class="mm-h">'+esc(a.name)
      +' <span class="mm-badge" style="background:'+k.color+';color:#fff;font-size:10px;border-radius:8px;padding:1px 6px">'+esc(k.badge)+'</span></div>'
      +'<div class="mm-say">'+speaker(c,inc)+'「'+esc(inc.line)+'」</div>'
      +(inc.kind==="big"?'<div class="mm-bigbar">🔥 大事件 '+bigDots(inc.prog||0,inc.need)+' <span class="mm-sub">'+inc.need+'問連続正解で解決</span></div>':'')
      +'<div class="mm-q">'+esc(q.q||q.question||"")+'</div>';
    if(q.choices&&q.choices.length&&q.format!=="true_false"){
      h+='<div style="display:grid;gap:8px">';
      for(var i=0;i<q.choices.length;i++){
        h+='<button class="mm-slot" style="min-height:52px" onclick="MM.ui.answer(\''+esc(inc.id)+'\','+JSON.stringify(qid)+','+i+')">'
          +(i+1)+'. '+esc(typeof q.choices[i]==="string"?q.choices[i]:(q.choices[i].text||""))+'</button>';
      }
      h+='</div>';
    }else{
      h+='<div class="mm-ans">'
        +'<button onclick="MM.ui.answer(\''+esc(inc.id)+'\','+JSON.stringify(qid)+',true)" aria-label="まる">◯</button>'
        +'<button onclick="MM.ui.answer(\''+esc(inc.id)+'\','+JSON.stringify(qid)+',false)" aria-label="ばつ">✕</button>'
        +'</div>';
    }
    h+='<div class="mm-combo">'+(c.mm.combo?'🔥 '+c.mm.combo+'れんぞく':'')+'</div>';
    h+='</div>';
    return h;
  };

  /* 解答 → 学習の確定・報酬・演出。結果は本人が「つぎへ」を押すまで残す(勝手に消えない) */
  UI.answer=function(incId,qid,v){
    var c=UI.ctx();
    var q=(typeof G.qById==="function")?G.qById(qid):null;
    if(!q)return UI.go("town");
    var ok=judge(q,v);
    var ms=t0?(Date.now()-t0):0;
    var r=MM.game.answer({ST:c.ST},incId,qid,ok,ms);
    try{ if(MM.sfx){ if(ok){ MM.sfx.correct(r.combo); if(r.gain&&r.gain.g)setTimeout(function(){ MM.sfx.coins(3); },350); } else MM.sfx.wrong(); if(r.big&&r.big.cleared)setTimeout(function(){ MM.sfx.big(); },600); } }catch(e){}
    UI.play({haptic:ok?(r.combo>=5?"heavy":"light"):"medium"});
    try{ if(MM.zukan){ var got=MM.zukan.claim(r.c); if(got.length){ MM.game.save(); UI.pendingCele=got; } } }catch(e){}
    UI.result(r,q,ok,incId);
  };
  function judge(q,v){
    if(q.choices&&q.choices.length&&q.format!=="true_false"){
      var ci=(typeof q.answerIndex==="number")?q.answerIndex:(typeof q.correctIndex==="number"?q.correctIndex:-1);
      if(ci<0&&q.choices[0]&&typeof q.choices[0]==="object"){
        for(var i=0;i<q.choices.length;i++)if(q.choices[i].correct)ci=i;
      }
      return v===ci;
    }
    var ans=(typeof q.a==="boolean")?q.a:!!q.answer;
    return v===ans;
  }

  function bigDots(p,n){ var h=""; for(var i=0;i<n;i++)h+='<i class="mm-dot'+(i<p?" mm-on":"")+'"></i>'; return h; }
  /* 相談に来た住民: 事件ごとに決まった顔(inc.face)。無ければそのエリアのマチモン */
  function speaker(c,inc){
    if(inc.face)return MM.px(inc.face,30)+' ';
    var pick=null;
    for(var uid in c.mm.mons){
      var sp=MM.DATA.speciesById[c.mm.mons[uid].sp];
      if(!sp)continue;
      if(sp.sub===inc.sub){ pick=c.mm.mons[uid].sp; break; }
      if(!pick)pick=c.mm.mons[uid].sp;
    }
    return pick?(MM.px(pick,26)+' '):'';
  }

  /* 結果表示。正解=小さく短く / 誤答=解説を自動展開(責めずに、理解へ渡す) */
  UI.result=function(r,q,ok,incId){
    var box=G.document&&G.document.getElementById?G.document.getElementById("app"):null;
    if(!box)return;
    var esc=UI.esc, g=r.gain;
    var fx=UI.fxClass(r.audio);
    var combo=r.combo||0;
    var big=r.big, inc=MM.incident.find(r.c,incId);
    var h='<div class="mm-wrap '+fx+'">'+UI.resBar(r.c)
      +'<div class="mm-stamp '+(ok?"mm-stamp-ok":"mm-stamp-ng")+'">'+(ok?(big&&!big.cleared?"⭕ 正解！":"⭕ 解決！"):"❌ ざんねん")+'</div>';
    if(big){
      if(big.cleared)h+='<div class="mm-bigclear">🎉 大事件を解決！ '+big.need+'問連続正解！</div>';
      else if(big.failed)h+='<div class="mm-bigfail">💥 大事件は失敗… 連続正解が途切れたモン。最初からやり直し！</div>';
      else h+='<div class="mm-bigbar">🔥 大事件 '+bigDots(big.prog,big.need)+' <span class="mm-sub">あと'+(big.need-big.prog)+'問！</span></div>';
    }
    if(ok){
      h+='<div class="mm-reward">'
        +'<span class="mm-pop" style="animation-delay:.05s">🪙 +'+g.g+'</span>'
        +'<span class="mm-pop" style="animation-delay:.2s">📘 +'+g.xp+'</span>'
        +(g.ke?'<span class="mm-pop mm-pop-ke" style="animation-delay:.35s">✨ 知識 +'+g.ke+'</span>':'')
        +(g.mat?'<span class="mm-pop" style="animation-delay:.45s">🧩 +'+g.mat+'</span>':'')
        +(g.tama?'<span class="mm-pop mm-pop-ke" style="animation-delay:.5s">🥚 タマゴ +'+g.tama+'</span>':'')
        +'</div>'
        +(combo>=2?'<div class="mm-combo-big">🔥 '+combo+' れんぞく正解！</div>':'')
        +'<div class="mm-say-card">'+cheer(r.c)+'<span>'+esc(r.flavor||"やったモン！")+'</span></div>';
      var note=[];
      if(r.reward.novelty<1)note.push("今日すでに解いた問題(報酬ひかえめ)");
      if(r.reward.timing>=1.6)note.push("忘れかけてた問題を思い出せた！");
      if(r.reward.fluke)note.push("早すぎる解答。読んでから答えると身につく");
      if(note.length)h+='<div class="mm-sub" style="text-align:center">'+esc(note.join(" / "))+'</div>';
      /* 正解でも解説(短い版)を自動で出す。くわしい3層解説は「解説」ボタン */
      var e1=String(q.e||q.explanation||"");
      if(e1)h+='<div class="mm-q" style="font-size:13px;padding:10px">💡 '+esc(e1)+'</div>';
    }else{
      h+='<div class="mm-say-card">'+cheer(r.c)+'<span>だいじょうぶ、まちがえた問題ほど覚えるモン！</span></div>'
        +'<div class="mm-q">'+explain(q,false)+'</div>';
    }
    /* マイルストーン(Day1)は演出の中の1行だけで教える */
    for(var i=0;i<r.milestones.length;i++){
      h+='<div class="mm-q" style="padding:10px;background:linear-gradient(135deg,#FFF9E0,#FFF)">✨ '
        +esc(r.milestones[i].say)+'</div>';
      var ex=r.milestones[i].extra;
      if(ex&&ex.uid){ UI.pendingHatch=ex; }
      if(ex&&ex.build){ var bb=MM.DATA.bldById[ex.build]||{name:"建物"}; UI.pendingCele=[{title:bb.name+" が建った！",icon:MM.DATA.bldIcon[ex.build]||"🏠",sub:"最初の建物！ マチモンを配置しよう",sfx:"build"}]; }
    }
    if(r.lvUp&&r.lvUp.length)h+='<div class="mm-sub">👾 マチモンがレベルアップしました</div>';
    var hasMs=r.milestones.length>0, nextInc=MM.incident.pending(r.c)[0];
    h+='<div style="display:grid;gap:8px;margin-top:12px">';
    var detailBtn='<button class="small-btn" style="min-height:44px" onclick="MM.ui.detail('+JSON.stringify(q.id)+')">📖 くわしい解説</button>';
    if(big&&!big.cleared&&inc&&!inc.done)h+='<button class="mm-cta" onclick="MM.ui.go(\'incident\',{id:\''+esc(incId)+'\'})">'+(big.failed?"もう一度 挑戦する ▶":"つぎの問題へ ▶")+'</button>'
      +'<button class="small-btn" style="min-height:44px" onclick="MM.ui.after()">街へもどる</button>';
    else if(!ok&&inc&&!inc.done)h+='<button class="mm-cta" onclick="MM.ui.go(\'incident\',{id:\''+esc(incId)+'\'})">もう一度 チャレンジ ▶</button>'
      +'<button class="small-btn" style="min-height:44px" onclick="MM.ui.after()">街へもどる</button>';
    else if(hasMs||!nextInc)h+='<button class="mm-cta" onclick="MM.ui.after()">街へもどる ▶</button>';
    else h+='<button class="mm-cta" onclick="MM.ui.go(\'incident\',{id:\''+esc(nextInc.id)+'\'})">つぎの事件へ ▶</button>'
      +'<button class="small-btn" style="min-height:44px" onclick="MM.ui.after()">街へもどる</button>';
    h+=detailBtn+'</div></div>';
    box.innerHTML=h;
    try{ G.scrollTo(0,0); }catch(e){}
    var pc=UI.pendingCele; UI.pendingCele=null;
    if(pc&&pc.length&&UI.celebrate)setTimeout(function(){ UI.celebrate({icon:pc[0].icon||"📖",title:pc[0].title,sub:pc[0].sub||("🎫 ガチャチケット +"+pc.reduce(function(a,x){return a+(x.tix||0);},0)+"枚"),sfx:pc[0].sfx||"big"}); },500);
  };
  /* 解決を喜ぶ住民(所持マチモンから1体) */
  function cheer(c){
    var uids=Object.keys(c.mm.mons);
    if(!uids.length)return "";
    var m=c.mm.mons[uids[Math.floor(Math.random()*uids.length)]];
    return '<span class="mm-hop" style="display:inline-block;margin-right:4px">'+MM.px(m.sp,24)+'</span>';
  }

  UI.after=function(){
    clearTimeout(UI._t);
    if(UI.pendingHatch){ var p=UI.pendingHatch; UI.pendingHatch=null; return UI.go("hatch",{uid:p.uid,rare:p.rare}); }
    UI.go("town");
  };
  /* 解説は既存の3層解説(ui-explain.js)を使う。無ければ問題データの解説文へ落とす。
     理解チェック・自己評価・用語ポップアップが参照する共有状態(expQ/fbQid/fbGood)も
     ここで渡す=解説の対話部品がMACHIMON内で完全に動く(画面遷移は起きない) */
  function explain(q,ok){
    try{ expQ=q; fbQid=q.id; fbGood=!!ok; }catch(e){}
    try{ if(typeof G.explainHtml==="function")return G.explainHtml(q,!!ok); }catch(e){}
    return UI.esc(q.e||q.explanation||"");
  }
  UI.detail=function(qid){
    clearTimeout(UI._t);
    var q=(typeof G.qById==="function")?G.qById(qid):null;
    var box=G.document.getElementById("app");
    if(!box||!q)return;
    box.innerHTML='<div class="mm-wrap">'+UI.resBar(UI.ctx())+'<div class="mm-q">'+explain(q,true)+'</div>'
      +'<button class="small-btn" style="width:100%;min-height:48px;margin-top:12px" onclick="MM.ui.go(\'town\')">街へもどる</button></div>';
  };
})();
