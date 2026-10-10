"use strict";
/* ============================================================
   machimon/ui/v2.js — 新しい遊び(GD.V2)の画面: ホーム・なかま・個体の詳細・タマゴ・けいこ
   ★どの画面でも、マチモンの横に「つよさ」の数字を1つ。並びはいつも つよさ順。
   ★矢印(▲▼)は「看板と同じLvまで育てたら、看板より上か下か」。Lv1の新入りでも比べられる。
   ★ホームの作りはスライス6で仕上げる前提の仮の形(看板・つよさ・番付・ボタン3つ)。
   ============================================================ */
(function(){
  var G=(typeof window!=="undefined")?window:globalThis;
  var MM=G.MM=G.MM||{}; var UI=MM.ui;
  var M=function(){ return MM.mon; }, D=function(){ return MM.DATA; }, GD=function(){ return MM.DATA.garden; };
  var esc=function(s){ return UI.esc(s); };
  function fmt(n){ return String(Math.round(n||0)).replace(/\B(?=(\d{3})+(?!\d))/g,","); }
  function sfx(n,a){ try{ if(MM.sfx&&MM.sfx[n])MM.sfx[n](a); }catch(e){} }
  function save(){ MM.game.save(); }

  UI.v2on=function(){ return !!(GD().V2&&MM.mon); };
  UI.v2ok={intro:1,h2:1,n2:1,n2d:1,t2:1,t2r:1,k2:1};
  UI.v2={quiz:null,last:null};

  /* ---------- 部品 ---------- */
  function sprite(p,size){
    var sz=M().adult(p)?size:Math.round(size*0.78);
    return '<span class="mm-gi'+(p.sh?' mm-gi-shiny':'')+(p.lv>=D().LV_MAX?' mm-v2-max':'')+'" style="min-width:'+size+'px;min-height:'+size+'px">'+MM.px(M().spId(p),sz)+'</span>';
  }
  function rarB(p){ var r=M().rarInfo(p); return '<span class="mm-grar mm-v2-rar" style="background:'+r.color+'">'+r.name+'</span>'; }
  function arrow(g,p){
    var d=M().pot(g,p);
    if(d.none)return ''; if(d.top)return '<i class="mm-pw-top">👑看板</i>';
    return d.d>0?'<i class="mm-pw-up">▲+'+d.d+'</i>':(d.d<0?'<i class="mm-pw-dn">▼−'+(-d.d)+'</i>':'<i class="mm-pw-dn">＝</i>');
  }
  function pow(g,p,cls){ return '<span class="mm-pw '+(cls||'')+'">つよさ <b>'+fmt(M().power(p))+'</b>'+arrow(g,p)+'</span>'; }
  function talentLine(p){ var r=M().rank(p); return '<span class="mm-v2-tal">才能 <b>'+r.sum+'</b>/'+r.max+' <i>上位'+r.top+'%</i></span>'; }
  function natLine(p){ var n=M().natOf(p), K=D().kstat; return '性格 <b>'+esc(n.name)+'</b>'+(n.up?' <span class="mm-sub">('+K[n.up].name+'↑ '+K[n.dn].name+'↓)</span>':''); }
  function traits(p){ if(!p.tr.length)return ''; return p.tr.map(function(id){ var t=GD().traitById[id]; return '<span class="mm-gtr mm-v2-tr">'+t.icon+esc(t.name)+'</span>'; }).join(''); }
  function lvBar(c,p){ var cap=M().lvCap(c,p), full=p.lv>=cap; return '<span class="mm-v2-lv"><b>Lv'+p.lv+'</b>'+(full?'<i>(いまの上限)</i>':'')+'<span class="mm-bar"><i style="width:'+(full?100:Math.min(100,Math.round(p.xp/M().need(p.lv)*100)))+'%"></i></span></span>'; }
  UI.v2p={ sprite:sprite, rarB:rarB, pow:pow, arrow:arrow, talentLine:talentLine, fmt:fmt };
  UI.resBar2=function(c){
    var g=M().W(c);
    return '<div class="mm-logo">MACHIMON<span>社労士</span></div><div class="mm-res mm-v2-res"><span class="mm-chip">🪙 コイン <b>'+fmt(c.mm.res.g)+'</b></span><span class="mm-chip">🧩 かけら <b>'+fmt(g.shard)+'</b></span></div>';
  };
  UI.tabs2=function(active){
    var T=[["h2","🏠","ホーム"],["n2","🐣","なかま"]]; if(UI.screens.bz)T.push(["bz","🏆","番付"]); T.push(["t2","🥚","タマゴ"]);
    var h='<nav class="mm-tabs mm-v2-tabs" aria-label="メニュー">';
    T.forEach(function(t){ h+='<button type="button" class="'+(t[0]===active?"mm-act":"")+'" onclick="MM.ui.go(\''+t[0]+'\')"><span aria-hidden="true">'+t[1]+'</span>'+t[2]+'</button>'; });
    return h+'</nav>';
  };
  function back(to,label){ return '<button class="small-btn mm-gback" onclick="MM.ui.go(\''+(to||"h2")+'\')">'+(label||"もどる")+'</button>'; }

  /* ---------- ホーム ---------- */
  UI.screens.h2=function(){
    var c=UI.ctx(), g=M().W(c), k=M().kanban(g), fam=GD().families[M().kindOf(k).f];
    var h='<div class="mm-wrap">'+UI.resBar2(c);
    h+='<button class="mm-v2-hero" style="border-color:'+M().rarInfo(k).color+'" onclick="MM.ui.go(\'n2d\',{id:\''+k.i+'\'})">'
      +'<span class="mm-v2-hero-tag">👑 '+esc(c.mm.name||"わたしの街")+' の看板</span>'
      +'<span class="mm-hop">'+sprite(k,112)+'</span>'
      +'<span class="mm-v2-hero-name">'+esc(k.n)+' '+rarB(k)+'</span>'
      +'<span class="mm-pw mm-pw-big">つよさ <b>'+fmt(M().power(k))+'</b></span>'
      +lvBar(c,k)+'</button>';
    if(UI.bzHome)h+=UI.bzHome(c);
    h+='<button class="mm-cta mm-gwater" onclick="MM.ui.k2Start()">📚 けいこ ▶<span class="mm-sub">問題に正解すると 看板が育つ</span></button>';
    h+='<div class="mm-gmenu mm-v2-menu"><button onclick="MM.ui.go(\'t2\')"><span>🥚</span>タマゴ'+(M().freeReady(c)?'<i class="mm-gdot">無料</i>':'')+'</button>'
      +(UI.screens.bz?'<button onclick="MM.ui.go(\'bz\')"><span>🏆</span>品評会</button>':'')
      +'<button onclick="MM.ui.go(\'n2\')"><span>🐣</span>なかま</button></div>';
    if(UI.passCard)h+=UI.passCard(c);
    return h+'</div>'+UI.tabs2("h2");
  };

  /* ---------- なかまの一覧(つよさ順) ---------- */
  UI.screens.n2=function(){
    var c=UI.ctx(), g=M().W(c), list=M().sorted(g);
    var h='<div class="mm-wrap">'+UI.resBar2(c)+'<div class="mm-h">🐣 なかま <span class="mm-sub">'+g.mons.length+'/'+D().RATE2.cap+'体 ・ つよい順</span></div>';
    h+='<div class="mm-v2-hint">▲▼ は「看板と同じLvまで育てたら」の差</div>';
    list.forEach(function(p){
      var tag=g.kan===p.i?'<i class="mm-v2-tag mm-v2-tag-k">看板</i>':(g.sub.indexOf(p.i)>=0?'<i class="mm-v2-tag">ひかえ</i>':'');
      h+='<button class="mm-v2-row" style="border-left-color:'+M().rarInfo(p).color+'" onclick="MM.ui.go(\'n2d\',{id:\''+p.i+'\'})">'+sprite(p,44)
        +'<span class="mm-v2-row-b"><span class="mm-v2-row-n"><b>'+esc(p.n)+'</b> '+rarB(p)+tag+'</span><span class="mm-v2-row-s">Lv'+p.lv+' ・ 才能 '+M().talent(p)+'/50'+(p.tr.length?' ・ '+p.tr.map(function(id){ return GD().traitById[id].icon; }).join(''):'')+(p.sh?' ✨':'')+'</span></span>'
        +'<span class="mm-v2-row-p"><b>'+fmt(M().power(p))+'</b>'+arrow(g,p)+'</span></button>';
    });
    return h+'</div>'+UI.tabs2("n2");
  };

  /* ---------- 個体の詳細: 絵・つよさ・才能・能力5本(看板の線つき)・特性 ---------- */
  UI.screens.n2d=function(pr){
    var c=UI.ctx(), g=M().W(c), p=M().byId(g,pr&&pr.id); if(!p)return UI.screens.n2();
    var k=M().kanban(g), kd=M().kindOf(p), fam=GD().families[kd.f], isK=(k===p), isS=g.sub.indexOf(p.i)>=0;
    var st=M().stats(p), ks=M().stats(k), mx=1; D().KSTATS.forEach(function(s){ mx=Math.max(mx,st[s.k],ks[s.k]); });
    var h='<div class="mm-wrap">'+UI.resBar2(c)
      +'<div class="mm-gdetail mm-v2-detail" style="border-color:'+M().rarInfo(p).color+'">'+sprite(p,96)
      +'<div class="mm-v2-hero-name">'+esc(p.n)+' '+rarB(p)+'</div>'
      +'<div class="mm-sub mm-v2-kind">'+fam.icon+esc(fam.name)+(p.n!==kd.name?' ・ '+esc(kd.name):'')+(p.first?' ・ 初代':'')+(p.sh?' ・ ✨色ちがい':'')+'</div>'
      +'<div>'+pow(g,p,"mm-pw-big")+'</div>'
      +(isK?'':'<div class="mm-sub mm-v2-kind">▲▼ = 看板と同じLvまで育てたときの差</div>')
      +lvBar(c,p)+'</div>';
    h+='<div class="mm-q mm-v2-stats"><div class="mm-v2-talrow">'+talentLine(p)+'</div>';
    D().KSTATS.forEach(function(s){ var i=M().KEYS.indexOf(s.k), t=p.tl[i];
      h+='<div class="mm-v2-stat"><span>'+s.icon+' '+s.name+'</span><span class="mm-gstat-bar"><i style="width:'+Math.round(st[s.k]/mx*100)+'%"></i>'+(isK?'':'<b class="mm-v2-kline" style="left:'+Math.min(99,Math.round(ks[s.k]/mx*100))+'%"></b>')+'</span><b>'+st[s.k]+'</b><i class="mm-v2-star'+(t>=8?' mm-v2-star-hi':'')+'">★'+t+'</i></div>'; });
    h+='<div class="mm-sub mm-v2-kind">★=才能(0〜10。生まれつきで変わらない)'+(isK?'':' ／ たて線=いまの看板')+'</div>';
    h+='<div class="mm-v2-nat">'+natLine(p)+'</div>'+(p.tr.length?'<div class="mm-v2-nat">特性 '+traits(p)+'</div>':'')+'</div>';
    h+='<div class="mm-gbtns mm-gbtns-col">';
    if(!isK)h+='<button class="mm-cta-s" onclick="MM.ui.n2Kan(\''+p.i+'\')">👑 この子を看板にする</button>';
    if(!isK)h+='<button class="small-btn" onclick="MM.ui.n2Sub(\''+p.i+'\')">'+(isS?'ひかえから はずす':'ひかえにする(けいこの経験が半分入る・2体まで)')+'</button>';
    if(!isK&&g.mons.length>1)h+='<button class="small-btn" onclick="MM.ui.n2Rel(\''+p.i+'\')">手放す(🧩かけら +'+D().SHARD[kd.rar]+')</button>';
    return h+'</div>'+back("n2","なかまへ もどる")+'</div>';
  };
  UI.n2Kan=function(id){ var c=UI.ctx(); if(M().setKan(c,id)){ save(); sfx("levelup"); UI.toast("👑 看板がかわった！"); } UI.go("n2d",{id:id}); };
  UI.n2Sub=function(id){ var c=UI.ctx(), r=M().toggleSub(c,id); save(); if(r.err)UI.toast(r.err); UI.go("n2d",{id:id}); };
  UI.n2Rel=function(id){
    var c=UI.ctx(), p=M().byId(M().W(c),id); if(!p)return;
    try{ if(G.confirm&&!G.confirm(p.n+" を手放しますか？(もどせません)"))return; }catch(e){}
    var r=M().release(c,id); save(); if(r.err){ UI.toast(r.err); return; } UI.toast("🧩 かけら +"+r.shard); UI.go("n2");
  };

  /* ---------- タマゴ ---------- */
  UI.screens.t2=function(){
    var c=UI.ctx(), g=M().W(c), R=D().RATE2, full=g.mons.length>=R.cap;
    var h='<div class="mm-wrap">'+UI.resBar2(c)+'<div class="mm-h">🥚 タマゴ <span class="mm-sub">なかま '+g.mons.length+'/'+R.cap+'体</span></div>';
    h+='<div class="mm-v2-egg">🥚</div>';
    if(full)h+='<div class="mm-q mm-v2-note">なかまがいっぱい。だれかを手放すと、またタマゴをもらえる。</div>';
    if(M().freeReady(c))h+='<button class="mm-cta mm-gfree" '+(full?'disabled':'')+' onclick="MM.ui.t2Pull(1)">🎁 きょうの無料タマゴ ▶</button>';
    h+='<button class="mm-cta" '+(!full&&c.mm.res.g>=R.cost?'':'disabled')+' onclick="MM.ui.t2Pull(0)">タマゴを1つ 🪙'+R.cost+'</button>';
    h+='<div class="mm-q mm-v2-note"><b>あと'+M().pityLeft(g)+'回</b> で SSR以上が かならず1つ出る。<br>出やすさ: N 60% ／ R 30% ／ SR 8.5% ／ SSR 1.3% ／ UR 0.2%<br>コインは けいこ(問題の正解)でだけ たまる。</div>';
    return h+'</div>'+UI.tabs2("t2");
  };
  UI.t2Pull=function(free){
    var c=UI.ctx(), r=M().pull(c,!!free); save();
    if(r.err){ UI.toast(r.err); return; }
    UI.v2.last=r; sfx("roll",6); UI.go("t2r");
  };
  UI.screens.t2r=function(){
    var c=UI.ctx(), g=M().W(c), L=UI.v2.last, p=L&&M().byId(g,L.mon.i); if(!p)return UI.screens.t2();
    var kd=M().kindOf(p), rk=kd.rar, R=D().RATE2, d=M().pot(g,p), fam=GD().families[kd.f];
    var h='<div class="mm-wrap">'+UI.resBar2(c)+'<div class="mm-h" style="justify-content:center">🐣 タマゴが われた！</div>'
      +'<div class="mm-gdetail mm-v2-detail mm-gres-r'+rk+'" style="border-color:'+M().rarInfo(p).color+'">'
      +(L.isNew?'<div class="mm-v2-new">はじめての種類！</div>':'')
      +'<span class="mm-gi'+(p.sh?' mm-gi-shiny':'')+'">'+MM.px(p.k,96)+'</span>'
      +'<div class="mm-v2-hero-name">'+esc(kd.name)+' '+rarB(p)+'</div>'
      +'<div class="mm-sub mm-v2-kind">'+fam.icon+esc(fam.name)+(p.sh?' ・ ✨色ちがい':'')+(L.pity?' ・ 確定のタマゴ':'')+'</div>'
      +'<div class="mm-v2-talrow">'+talentLine(p)+'</div>'
      +'<div class="mm-v2-verdict '+(d.d>0?'mm-v2-up':'mm-v2-dn')+'">'+(d.d>0?'▲ 育てれば いまの看板をこえる！(+'+d.d+')':(d.d<0?'▼ いまの看板のほうが つよい(−'+(-d.d)+')':'＝ いまの看板と同じつよさ'))+'</div>'
      +'<div class="mm-v2-nat">'+natLine(p)+'</div>'+(p.tr.length?'<div class="mm-v2-nat">特性 '+traits(p)+'</div>':'')+'</div>';
    h+='<div class="mm-gbtns mm-gbtns-col"><button class="mm-cta-s" onclick="MM.ui.go(\'n2d\',{id:\''+p.i+'\'})">くわしく見る</button>'
      +'<button class="mm-cta-s" '+(g.mons.length<R.cap&&c.mm.res.g>=R.cost?'':'disabled')+' onclick="MM.ui.t2Pull(0)">もう1つ 🪙'+R.cost+'</button></div>'+back("h2","ホームへ")+'</div>';
    if(rk>=3)setTimeout(function(){ sfx("fanfare"); },400); else if(rk>=2)setTimeout(function(){ sfx("levelup"); },400);
    return h;
  };

  /* ---------- 📚 けいこ(問題。仮の形: 出題はおまかせ・4問に1問は本試験形式) ---------- */
  UI.k2Start=function(){ UI.v2.quiz={n:0,hits:0,qid:null}; nextQ(); UI.go("k2"); };
  function nextQ(){ var c=UI.ctx(), s=UI.v2.quiz, ids=null; if(s.n%4===3)ids=MM.garden.pickExam(c,1); if(!ids||!ids.length)ids=MM.learn.pick(1,c,{subs:[0,1,2,3,4,5,6,7,8]}); s.qid=ids[0]; s.t0=Date.now(); s.fb=null; s.sen={picks:[]}; }
  UI.screens.k2=function(){
    var c=UI.ctx(), s=UI.v2.quiz; if(!s)return UI.screens.h2();
    var q=(typeof G.qById==="function"&&s.qid!=null)?G.qById(s.qid):null; if(!q){ UI.v2.quiz=null; return UI.screens.h2(); }
    var g=M().W(c), k=M().kanban(g);
    var h='<div class="mm-wrap">'+UI.resBar2(c)
      +'<div class="mm-v2-strip">'+sprite(k,40)+'<span class="mm-v2-strip-b"><span><b>'+esc(k.n)+'</b> <span class="mm-pw">つよさ <b>'+fmt(M().power(k))+'</b></span></span>'+lvBar(c,k)+'</span><span class="mm-v2-strip-n">'+s.hits+'/'+s.n+'問</span></div>';
    h+=s.fb?s.fb:UI.qz.qHtml(q,"MM.ui.k2Ans",s.sen);
    return h+'<button class="small-btn mm-gback" onclick="MM.ui.k2End()">ホームに もどる</button></div>';
  };
  UI.k2Ans=function(v){
    var c=UI.ctx(), s=UI.v2.quiz; if(!s||s.fb)return;
    var q=G.qById(s.qid), ms=Date.now()-(s.t0||Date.now()), ok;
    if(q.sentaku){ var sp=UI.qz.senPick(q,s.sen,v); if(!sp.done){ UI.render(); return; } ok=sp.ok; } else ok=UI.qz.judgeQ(q,v);
    var g=M().W(c), k0=M().kanban(g), before=M().power(k0);
    var rw=MM.learn.commit(s.qid,ok,ms,c), gain=MM.economy.grant(rw,c); save();
    s.n++; if(ok)s.hits++;
    var mo=gain.mon||{coin:0,xp:0,ups:[],ef:{}}, K=D().kstat;
    sfx(ok?"correct":"wrong",c.mm.combo); UI.play({haptic:ok?"light":"medium"});
    var fl=(ok&&rw.fluke)?'<div class="mm-v2-hint" style="text-align:center">はやすぎて ごほうびなし(2秒より長く、読んでから答えよう)</div>':'';
    var pops=(mo.coin?'<span class="mm-pop">🪙 +'+mo.coin+'</span><span class="mm-pop" style="animation-delay:.1s">けいけん +'+mo.xp+'</span>':'');
    Object.keys(mo.ef||{}).forEach(function(key,i){ pops+='<span class="mm-pop mm-pop-ke" style="animation-delay:'+(0.2+i*0.1)+'s">'+K[key].icon+K[key].name+' +'+mo.ef[key]+'</span>'; });
    var extra="";
    (mo.ups||[]).forEach(function(u){ extra+='<div class="mm-gbloom">'+sprite(u.p,36)+' <b>'+esc(u.p.n)+'</b> Lv'+u.p.lv+' に！'+(u.grown?' おとなの姿になった！':'')+(u.p===k0?' つよさ '+fmt(before)+' → <b>'+fmt(M().power(u.p))+'</b>':'')+'</div>'; });
    s.fb='<div class="mm-stamp '+(ok?'mm-stamp-ok':'')+'">'+(ok?'⭕ 正解！':'❌ ざんねん')+'</div><div class="mm-reward">'+pops+'</div>'+extra
      +UI.qz.explainHtml(q,v,s.sen)+'<button class="mm-cta" onclick="MM.ui.k2Next()">つぎの問題 ▶</button>';
    if(extra)sfx("big");
    UI.render();
    if(ok&&!extra&&!MM.garden.isExam(q)){ clearTimeout(UI._gt); UI._gt=setTimeout(function(){ if(UI.v2.quiz&&UI.v2.quiz.fb&&UI.route.screen==="k2")UI.k2Next(); },1300); }
  };
  UI.k2Next=function(){ clearTimeout(UI._gt); nextQ(); UI.render(); };
  UI.k2End=function(){ clearTimeout(UI._gt); UI.v2.quiz=null; UI.go("h2"); };
})();
