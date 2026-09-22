"use strict";
/* ============================================================
   machimon/ui/garden.js — ガーデン(タネ配合 × 植物街 × 品評会 × 街評議会)の画面
   ★おじいちゃんでも迷わない: ハブの主ボタンは常に「💧 クイズで水やり」1つ。
     ほかは全部おまけ(ガチャ・配合・品評会・評議会)。
   ★UIは判断を持たない。すべて core/garden.js に委譲する。
   ============================================================ */
(function(){
  var G=(typeof window!=="undefined")?window:globalThis;
  var MM=G.MM=G.MM||{}; var UI=MM.ui;
  var GA=function(){ return MM.garden; }, GD=function(){ return MM.DATA.garden; };
  var esc=function(s){ return UI.esc(s); };
  function fmt(n){ return String(Math.round(n||0)).replace(/\B(?=(\d{3})+(?!\d))/g,","); }
  function sfx(n,a){ try{ if(MM.sfx&&MM.sfx[n])MM.sfx[n](a); }catch(e){} }
  function save(){ MM.game.save(); }
  UI.gd={ sel:{a:null,b:null}, quiz:null, contest:null, last:null, tab:"all" };

  /* ---------- 見た目の部品 ---------- */
  function icon(p,size){
    var gd=GA().W(UI.ctx()), st=GA().stage(p), fam=GD().families[p.f];
    var e=["🌰","🌱","🌿",fam.icon,fam.icon,fam.icon,"🥀"][st];
    var cls="mm-gi"+(st===3?" mm-gi-bud":"")+(p.sh?" mm-gi-shiny":"")+(st>=4&&st<6?" mm-gi-bloom":"");
    var sz=size||34; if(st>=4&&st<6){ var o=GA().cur(gd,p,"o"); sz=Math.round(sz*(0.9+Math.min(0.5,o/200))); }
    return '<span class="'+cls+'" style="font-size:'+sz+'px">'+e+'</span>';
  }
  function rarBadge(p){ var r=GA().rarInfo(p); return '<span class="mm-grar" style="background:'+r.color+'">'+r.name+'</span>'; }
  function traitBadge(p){ if(!p.tr)return ""; var t=GD().traitById[p.tr]; return '<span class="mm-gtr" title="'+esc(t.desc)+'">'+t.icon+esc(t.name)+'</span>'; }
  function shinyBadge(p){ return p.sh?'<span class="mm-gtr mm-gtr-sh">✨色違い</span>':''; }
  function famName(p){ return GD().families[p.f].name; }
  function lineName(p){ return GA().lineById(GA().W(UI.ctx()),p.l).name; }
  function statRows(p,live){
    var gd=GA().W(UI.ctx()), h="";
    GD().STATS.forEach(function(s){ var v=p[s.k], cv=live?GA().cur(gd,p,s.k):v;
      h+='<div class="mm-gstat"><span>'+s.icon+' '+s.name+'</span><span class="mm-gstat-bar"><i style="width:'+Math.min(100,v)+'%;opacity:.35"></i><i style="width:'+Math.min(100,cv)+'%"></i></span><b>'+GA().grade(v)+'</b></div>'; });
    return h;
  }
  function head(c){
    var cal=GA().cal(c), gd=GA().W(c), rk=GA().rankOf(c);
    return '<div class="mm-ghead"><div class="mm-ghead-top"><b>'+cal.sIcon+' '+esc(cal.label)+'</b><span class="mm-sub">名声 '+fmt(gd.fame)+' / 🏅'+gd.medal+(gd.statue?' / 🗿黄金像'+gd.statue:'')+'</span></div>'
      +'<div class="mm-gweek"><span>次の週まで 正解 <b>'+cal.qc+'</b>/'+cal.need+'</span>'+UI.bar(cal.qc,cal.need)+'</div>'
      +'<button class="mm-grank" onclick="MM.ui.go(\'gCouncil\')"><span>'+rk.cur.icon+' 植物街ランク <b>'+esc(rk.cur.name)+'</b></span><span class="mm-sub">'+(rk.next?'次「'+esc(rk.next.name)+'」まで '+fmt(rk.next.need-rk.score):'最終段')+'</span>'+(rk.next?UI.bar(rk.score-rk.cur.need,rk.next.need-rk.cur.need):'')+'</button></div>';
  }
  function back(to,label){ return '<button class="small-btn mm-gback" onclick="MM.ui.go(\''+(to||"garden")+'\')">'+(label||"もどる")+'</button>'; }

  /* ---------- ハブ ---------- */
  UI.screens.garden=function(){
    var c=UI.ctx(), gd=GA().W(c);
    var pend=GA().takePend(c); if(pend){ save(); return pend.t==="year"?yearView(c,pend):councilView(c,pend.res); }
    var h='<div class="mm-wrap">'+UI.resBar(c)+head(c);
    h+='<div class="mm-coach">'+MM.px("m01",44,"mm-hop")+'<div class="mm-coach-text">'+esc(GA().advice(c))+'</div></div>';
    h+='<button class="mm-cta mm-gwater" onclick="MM.ui.gQuizStart()">💧 クイズで水やり ▶<span class="mm-sub">正解で 植物が育つ・コイン・10問で1週すすむ</span></button>';
    var cs=GA().contestsOf(c,gd.w).filter(function(d){ return !GA().isDone(c,d.id); });
    var g1=cs.filter(function(d){ return d.g===1; })[0];
    h+='<div class="mm-gmenu">'
      +'<button onclick="MM.ui.go(\'gGacha\')"><span>🌰</span>タネガチャ'+(GA().freeReady(c)?'<i class="mm-gdot">無料</i>':'')+'</button>'
      +'<button onclick="MM.ui.go(\'gBreed\')"><span>🧬</span>配合</button>'
      +'<button onclick="MM.ui.go(\'gContest\')"><span>🏆</span>品評会'+(g1?'<i class="mm-gdot">G1</i>':'')+'</button>'
      +'<button onclick="MM.ui.go(\'gCouncil\')"><span>🏛</span>街評議会</button></div>';
    /* 花壇 */
    h+='<div class="mm-h">🪴 花壇 <span class="mm-sub">'+gd.plots.filter(Boolean).length+'/'+gd.plots.length+' ・ タネ '+gd.seeds.length+'/'+GA().seedCap(gd)+'</span></div><div class="mm-gplots">';
    for(var i=0;i<gd.plots.length;i++){ var p=gd.plots[i];
      if(!p){ h+='<button class="mm-gplot mm-gplot-empty" onclick="MM.ui.go(\'gSeeds\',{plot:'+i+'})"><span class="mm-gi" style="font-size:26px;opacity:.5">🟫</span><span class="mm-sub">＋ 植える</span></button>'; continue; }
      var st=GA().stage(p), r=GA().rarInfo(p);
      h+='<button class="mm-gplot'+(st===6?' mm-gplot-dead':'')+'" style="border-color:'+r.color+'" onclick="MM.ui.go(\'gPlant\',{plot:'+i+'})">'
        +icon(p,30)+'<span class="mm-gplot-name">'+esc(p.n)+'</span><span class="mm-gplot-st">'+esc(GA().statusText(gd,p))+'</span>'
        +(st<4?'<span class="mm-bar mm-bar-thin"><i style="width:'+Math.min(100,Math.round((p.g||0)/GA().needOf(p)*100))+'%"></i></span>':'')
        +'<span class="mm-gplot-tags">'+rarBadge(p)+(p.tr?GD().traitById[p.tr].icon:'')+(p.sh?'✨':'')+(p.mon?MM.px(c.mm.mons[p.mon]?c.mm.mons[p.mon].sp:"m01",14):'')+'</span></button>'; }
    h+='</div>';
    var yb=GA().yieldBonus(gd); if(yb>0||gd.statue)h+='<div class="mm-sub" style="text-align:center">🍎 実りボーナス: 正解コイン +'+Math.round(yb*100)+'%'+(gd.statue?' / 🗿黄金像 +'+gd.statue*10+'%':'')+'</div>';
    /* お知らせ */
    if(gd.ev.length){ h+='<div class="mm-h">📣 お知らせ</div><div class="mm-q mm-gev">'; for(var k=gd.ev.length-1;k>=0&&k>=gd.ev.length-4;k--){ var e=gd.ev[k]; h+='<div>'+e.i+' '+esc(e.t)+'</div>'; } h+='</div>'; }
    h+='<div class="mm-quick"><button onclick="MM.ui.go(\'gSeeds\',{})">🌰 タネ袋</button><button onclick="MM.ui.go(\'gMb\')">🌳 名木</button><button onclick="MM.ui.go(\'gFac\')">🔨 施設</button><button onclick="MM.ui.go(\'gRec\')">🎖 記録</button></div>';
    return h+'</div>'+UI.tabs("garden");
  };

  /* ---------- タネ袋(植える) ---------- */
  UI.screens.gSeeds=function(p){
    var c=UI.ctx(), gd=GA().W(c), plot=(p&&typeof p.plot==="number")?p.plot:-1;
    var h='<div class="mm-wrap">'+UI.resBar(c)+'<div class="mm-h">🌰 タネ袋 <span class="mm-sub">'+gd.seeds.length+'/'+GA().seedCap(gd)+(plot>=0?' ・ 花壇'+(plot+1)+'に植える':'')+'</span></div>';
    if(!gd.seeds.length)h+='<div class="mm-q" style="font-size:13px">タネがありません。🌰タネガチャで手に入れるか、咲いた植物どうしを🧬配合しよう。</div><button class="mm-cta" onclick="MM.ui.go(\'gGacha\')">🌰 タネガチャへ ▶</button>';
    var order=gd.seeds.map(function(s,i){ return i; }).sort(function(a,b){ return GA().sum(gd.seeds[b])-GA().sum(gd.seeds[a]); });
    order.forEach(function(i){ var s=gd.seeds[i];
      h+='<div class="mm-gcard" style="border-color:'+GA().rarInfo(s).color+'"><div class="mm-gcard-top">'+icon({f:s.f,g:999,bw:0,sh:s.sh,o:s.o,t:s.t,j:s.j,s:s.s},30)
        +'<div><b>'+esc(s.n)+'</b> '+rarBadge(s)+traitBadge(s)+shinyBadge(s)+'<br><span class="mm-sub">'+esc(famName(s))+'・'+esc(lineName(s))+'・'+GD().TYPES[s.t].name+'・'+GD().SEASONS[s.se]+' / 素質 '+GA().sum(s)+'</span></div></div>'
        +'<div class="mm-gmini">'+GD().STATS.map(function(st){ return st.icon+GA().grade(s[st.k]); }).join(' ')+'</div>'
        +'<div class="mm-gbtns">'+(plot>=0?'<button class="mm-cta-s" onclick="MM.ui.gPlantSeed('+i+','+plot+')">ここに植える ▶</button>':'<button class="mm-cta-s" onclick="MM.ui.gPlantSeed('+i+',-1)">植える ▶</button>')
        +'<button class="small-btn" onclick="MM.ui.gDrop('+i+')">手放す(🧩)</button></div></div>'; });
    return h+back("garden")+'</div>';
  };
  UI.gPlantSeed=function(i,plot){
    var c=UI.ctx(), gd=GA().W(c);
    if(plot<0){ for(var k=0;k<gd.plots.length;k++)if(!gd.plots[k]){ plot=k; break; } }
    if(plot<0){ UI.toast("空いている花壇がないモン。🔨施設で花壇を増やすか、枯れた植物を片付けよう"); return; }
    var s=GA().plant(c,i,plot); save(); sfx("tap");
    if(s)UI.toast("🌱 "+s.n+" を植えた！ クイズに正解すると育つモン");
    UI.go("garden");
  };
  UI.gDrop=function(i){ var c=UI.ctx(), r=GA().dropSeed(c,i); save(); if(r)UI.toast("🧩 +"+r.mat); UI.go("gSeeds",{}); };
  UI.toast=function(t){
    try{ var d=G.document.createElement("div"); d.className="mm-gtoast"; d.textContent=t; G.document.body.appendChild(d); setTimeout(function(){ try{ d.remove(); }catch(e){} },2600); }catch(e){}
  };

  /* ---------- 植物の詳細 ---------- */
  UI.screens.gPlant=function(p){
    var c=UI.ctx(), gd=GA().W(c), i=p.plot, pl=gd.plots[i]; if(!pl)return UI.screens.garden();
    var st=GA().stage(pl), tt=GD().TYPES[pl.t];
    var h='<div class="mm-wrap">'+UI.resBar(c)
      +'<div class="mm-gdetail" style="border-color:'+GA().rarInfo(pl).color+'">'+icon(pl,72)+'<div class="mm-h" style="justify-content:center">'+esc(pl.n)+'</div>'
      +'<div>'+rarBadge(pl)+traitBadge(pl)+shinyBadge(pl)+'</div><div class="mm-sub">'+esc(famName(pl))+'・'+esc(lineName(pl))+' / '+tt.name+'('+esc(tt.desc)+') / '+GD().SEASONS[pl.se]+'が得意</div>'
      +'<div class="mm-sub"><b>'+esc(GA().statusText(gd,pl))+'</b>'+(st>=4&&st<6?' ・ 寿命あと'+Math.max(0,GA().lifeOf(gd,pl)-GA().age(gd,pl))+'週':'')+'</div></div>';
    h+='<div class="mm-q" style="font-size:13px">'+statRows(pl,true)+'<div class="mm-sub" style="margin-top:4px">うすい棒=素質 / 濃い棒=いまの力(咲き具合で変わる)</div></div>';
    if(pl.tr)h+='<div class="mm-q" style="font-size:12px;padding:8px">'+GD().traitById[pl.tr].icon+' <b>'+esc(GD().traitById[pl.tr].name)+'</b>: '+esc(GD().traitById[pl.tr].desc)+'</div>';
    h+='<div class="mm-q" style="font-size:12px;padding:8px"><b>🧬 血統</b><br>'+pedigree(gd,pl)+'</div>';
    h+='<div class="mm-q" style="font-size:12px;padding:8px">🏆 '+pl.r.run+'回出品 '+pl.r.w+'勝(重賞'+pl.r.gr+' G1 '+pl.r.g1+') / 賞金 🪙'+fmt(pl.r.pz)+'</div>';
    /* 庭師マチモン */
    var mons=Object.keys(c.mm.mons);
    if(mons.length&&st<6){
      h+='<div class="mm-q" style="font-size:12px;padding:8px"><b>👾 庭師マチモン</b> <span class="mm-sub">(成長が速くなる。同じ科目のマチモンなら特に)</span><div class="mm-gmons">';
      mons.slice(0,24).forEach(function(u){ var m=c.mm.mons[u], sp=MM.DATA.speciesById[m.sp]||{}; h+='<button class="'+(pl.mon===u?'mm-act':'')+'" onclick="MM.ui.gMon('+i+',\''+u+'\')">'+MM.px(m.sp,26)+'<span>'+esc(sp.name||"")+'</span></button>'; });
      h+='</div></div>';
    }
    h+='<div class="mm-gbtns mm-gbtns-col">';
    if(st>=4&&st<6){
      h+='<button class="mm-cta-s" onclick="MM.ui.gd.sel.a={k:\'p\',i:'+i+'};MM.ui.go(\'gBreed\')">🧬 この植物で配合する</button>';
      h+='<button class="mm-cta-s" onclick="MM.ui.go(\'gContest\',{plot:'+i+'})">🏆 品評会に出す</button>';
    }
    if(GA().canMeiboku(pl))h+='<button class="small-btn" onclick="MM.ui.gToMb('+i+')">🌳 名木にする(花壇を空けて、毎週 花粉料が入る)</button>';
    else if(st>=4)h+='<div class="mm-sub" style="text-align:center">名木になれるのは 重賞2勝・G1勝ち・SSR以上 のどれか</div>';
    h+='<button class="small-btn" onclick="MM.ui.gCompost('+i+')">'+(st===6?'🥀 堆肥にする(🧩)':'引き抜く(🧩)')+'</button>';
    h+='</div>'+back("garden")+'</div>';
    return h;
  };
  function pedigree(gd,p){
    var n=function(id){ return id?esc(GA().nameOfId(gd,id)):"—"; };
    return '<div class="mm-gped"><div>父 <b>'+n(p.a[0])+'</b></div><div class="mm-sub">　父父 '+n(p.a[2])+' / 父母 '+n(p.a[3])+'</div>'
      +'<div>母 <b>'+n(p.a[1])+'</b></div><div class="mm-sub">　母父 '+n(p.a[4])+' / 母母 '+n(p.a[5])+'</div></div>';
  }
  UI.gMon=function(i,u){ var c=UI.ctx(), gd=GA().W(c); GA().setMon(c,i,gd.plots[i]&&gd.plots[i].mon===u?"":u); save(); UI.go("gPlant",{plot:i}); };
  UI.gToMb=function(i){ var c=UI.ctx(), m=GA().toMeiboku(c,i); save(); if(m&&UI.celebrate)UI.celebrate({icon:"🌳",title:m.n+" が名木に！",sub:"ほかの庭から花粉を求められ、毎週 花粉料が入る",sfx:"big"}); UI.go("gMb"); };
  UI.gCompost=function(i){ var c=UI.ctx(), r=GA().compost(c,i); save(); if(r)UI.toast("🧩 +"+r.mat); UI.go("garden"); };

  /* ---------- 💧 水やりクイズ(無限) ---------- */
  UI.gQuizStart=function(){ UI.gd.quiz={n:0,hits:0,grow:0,coin:0,qid:null}; nextQ(); UI.go("gQuiz"); };
  function nextQ(){ var c=UI.ctx(), subs=GA().openSubs(c), ids=MM.learn.pick(1,c,{subs:subs}); UI.gd.quiz.qid=ids[0]; UI.gd.quiz.t0=Date.now(); UI.gd.quiz.fb=null; }
  function qText(q){ return q.q||q.question||""; }
  function choicesHtml(q,fn){
    var h="";
    if(q.choices&&q.choices.length&&q.format!=="true_false"){
      h+='<div style="display:grid;gap:8px">';
      for(var i=0;i<q.choices.length;i++)h+='<button class="mm-slot" style="min-height:52px;text-align:left" onclick="'+fn+'('+i+')">'+(i+1)+'. '+esc(typeof q.choices[i]==="string"?q.choices[i]:(q.choices[i].text||""))+'</button>';
      return h+'</div>';
    }
    return '<div class="mm-ans"><button onclick="'+fn+'(true)" aria-label="まる">◯</button><button onclick="'+fn+'(false)" aria-label="ばつ">✕</button></div>';
  }
  function judgeQ(q,v){
    if(q.choices&&q.choices.length&&q.format!=="true_false"){
      var ci=(typeof q.answerIndex==="number")?q.answerIndex:(typeof q.correctIndex==="number"?q.correctIndex:-1);
      if(ci<0&&q.choices[0]&&typeof q.choices[0]==="object"){ for(var i=0;i<q.choices.length;i++)if(q.choices[i].correct)ci=i; }
      return v===ci;
    }
    var ans=(typeof q.a==="boolean")?q.a:!!q.answer; return v===ans;
  }
  UI.screens.gQuiz=function(){
    var c=UI.ctx(), s=UI.gd.quiz; if(!s)return UI.screens.garden();
    var q=(typeof G.qById==="function"&&s.qid!=null)?G.qById(s.qid):null;
    if(!q){ UI.gd.quiz=null; return UI.screens.garden(); }
    var gd=GA().W(c), cal=GA().cal(c);
    var h='<div class="mm-wrap">'+UI.resBar(c)
      +'<div class="mm-gqhead"><span>💧 水やり '+s.n+'問 / 正解 '+s.hits+'</span><span>'+cal.sIcon+' 次の週まで '+cal.qc+'/'+cal.need+'</span></div>'+UI.bar(cal.qc,cal.need)
      +'<div class="mm-gstrip">'+gd.plots.map(function(p){ return p?icon(p,22):'<span class="mm-gi" style="font-size:18px;opacity:.3">🟫</span>'; }).join("")+'</div>';
    if(s.fb)h+=s.fb;
    else h+='<div class="mm-q">'+esc(qText(q))+'</div>'+choicesHtml(q,"MM.ui.gQuizAns");
    h+='<button class="small-btn mm-gback" onclick="MM.ui.gQuizEnd()">ガーデンにもどる</button>';
    return h+'</div>';
  };
  UI.gQuizAns=function(v){
    var c=UI.ctx(), s=UI.gd.quiz; if(!s||s.fb)return;
    var q=G.qById(s.qid), ok=judgeQ(q,v), ms=Date.now()-(s.t0||Date.now());
    var rw=MM.learn.commit(s.qid,ok,ms,c), gain=MM.economy.grant(rw,c);
    try{ MM.evolve.gainXp(c,q.s||0,ok); }catch(e){}
    save();
    s.n++; if(ok)s.hits++;
    var gdn=gain.garden||{};
    sfx(ok?"correct":"wrong",c.mm.combo); UI.play({haptic:ok?"light":"medium"});
    var pops=(ok?'<span class="mm-pop">🪙 +'+gain.g+'</span>':'')+(gdn.grow?'<span class="mm-pop" style="animation-delay:.1s">💧 成長 +'+Math.round(gdn.grow)+'</span>':'')
      +(gain.ke?'<span class="mm-pop mm-pop-ke" style="animation-delay:.2s">✨ 知識 +'+gain.ke+'</span>':'')+(gdn.yield?'<span class="mm-pop" style="animation-delay:.3s">🍎 実り +'+gdn.yield+'</span>':'');
    var extra="";
    (gdn.bloom||[]).forEach(function(p){ extra+='<div class="mm-gbloom">'+icon(p,40)+' <b>'+esc(p.n)+'</b> が咲いた！ '+rarBadge(p)+'</div>'; });
    if(gdn.drop)extra+='<div class="mm-gbloom mm-gdrop">🎁 落としダネ！ <b>'+esc(gdn.drop.n)+'</b> '+rarBadge(gdn.drop)+traitBadge(gdn.drop)+shinyBadge(gdn.drop)+'</div>';
    if(gdn.week)extra+='<div class="mm-gbloom">📅 1週すすんだ！ '+esc(GA().cal(c).label)+(gdn.week.council?' ・ 🏛街評議会の結果が出た！':'')+(gdn.week.year?' ・ 🎊年度表彰！':'')+'</div>';
    s.fb='<div class="mm-stamp '+(ok?'mm-stamp-ok':'')+'">'+(ok?'⭕ 正解！':'❌ ざんねん')+'</div><div class="mm-reward">'+pops+'</div>'+extra
      +'<div class="mm-q" style="font-size:13px;padding:10px">💡 '+esc(q.e||q.explanation||"")+'</div>'
      +'<button class="mm-cta" onclick="MM.ui.gQuizNext()">'+(gdn.week&&(gdn.week.council||gdn.week.year)?'結果を見る ▶':'つぎの問題 ▶')+'</button>';
    if(gdn.bloom&&gdn.bloom.length){ sfx("big"); }
    if(gdn.drop&&GA().rarity(gdn.drop)>=3&&UI.celebrate)UI.celebrate({icon:"🎁",title:"落としダネ "+GA().rarInfo(gdn.drop).name+"！",sub:gdn.drop.n,sfx:"fanfare"});
    UI.render();
    if(ok&&!extra){ clearTimeout(UI._gt); UI._gt=setTimeout(function(){ if(UI.gd.quiz&&UI.gd.quiz.fb&&UI.route.screen==="gQuiz")UI.gQuizNext(); },1300); }
  };
  UI.gQuizNext=function(){ clearTimeout(UI._gt); var c=UI.ctx(), gd=GA().W(c); if(gd.pend.length){ UI.gd.quiz=null; UI.go("garden"); return; } nextQ(); UI.render(); };
  UI.gQuizEnd=function(){ clearTimeout(UI._gt); UI.gd.quiz=null; UI.go("garden"); };

  /* ---------- 🌰 タネガチャ ---------- */
  UI.screens.gGacha=function(){
    var c=UI.ctx(), gd=GA().W(c), pf=GD().families[GA().pickupFam(gd)], stt=GD().traitById[GA().seasonTrait(gd)];
    var h='<div class="mm-wrap">'+UI.resBar(c)+'<div class="mm-h">🌰 タネガチャ <span class="mm-sub">タネ '+gd.seeds.length+'/'+GA().seedCap(gd)+' ・ 天井まで '+Math.max(0,GD().GACHA.pity-gd.pity)+'回 ・ 🏅'+gd.medal+'</span></div>';
    if(GA().freeReady(c))h+='<button class="mm-cta mm-gfree" onclick="MM.ui.gPull(\'normal\',1,1)">🎁 きょうの無料ガチャ ▶</button>';
    GD().BANNERS.forEach(function(b){
      var cur=b.currency==="medal"?"🏅":"🪙";
      var desc=b.id==="pickup"?'今週は <b>'+pf.icon+pf.name+'</b> が70%':(b.id==="season"?'今の季節は <b>'+stt.icon+stt.name+'</b> が出やすい・特性3倍':esc(b.desc));
      h+='<div class="mm-gbanner mm-gbanner-'+b.id+'"><div class="mm-gbanner-t"><span>'+b.icon+'</span><b>'+esc(b.name)+'</b></div><div class="mm-sub">'+desc+'</div>'
        +'<div class="mm-gbtns"><button class="mm-cta-s" '+(GA().canPull(c,1,b.id)?'':'disabled')+' onclick="MM.ui.gPull(\''+b.id+'\',1)">1回 '+cur+fmt(b.cost1)+'</button>'
        +'<button class="mm-cta-s" '+(GA().canPull(c,10,b.id)?'':'disabled')+' onclick="MM.ui.gPull(\''+b.id+'\',10)">'+(b.id==="council"?'UR確定 ':'10連 ')+cur+fmt(b.cost10)+'</button></div></div>';
    });
    h+='<div class="mm-q" style="font-size:11px;padding:8px">排出率: N55% / R28% / SR13% / SSR3.5% / UR0.5%。天井'+GD().GACHA.pity+'回でSR以上。特性つき・✨色違い(1/64)はどのガチャでも出る。伝説(LG)は配合でしか生まれない。コインはクイズの正解で貯まる。</div>';
    return h+back("garden")+'</div>';
  };
  UI.gPull=function(bid,n,free){
    var c=UI.ctx(), r=GA().pull(c,n,bid,!!free); save();
    if(r.err){ UI.toast(r.err); return; }
    UI.gd.last={seeds:r.seeds,from:"gacha"}; sfx("roll",6); UI.go("gReveal");
  };
  /* カプセル演出: 最高レアの色で予告 → 1つずつ開く。SSR以上は虹の確定演出 */
  UI.screens.gReveal=function(){
    var c=UI.ctx(), L=UI.gd.last; if(!L)return UI.screens.garden();
    var best=0; L.seeds.forEach(function(s){ best=Math.max(best,GA().rarity(s)+(s.tr?0.5:0)+(s.sh?1:0)); });
    var cls=best>=3?"mm-gcap-rainbow":best>=2?"mm-gcap-gold":"";
    var h='<div class="mm-wrap"><div class="mm-h" style="justify-content:center">'+(L.from==="breed"?'🧬 配合の結果':'🌰 ガチャの結果')+'</div>'
      +'<div class="mm-gcapwrap '+cls+'"><div class="mm-gcap">'+(best>=3?'🌈':best>=2?'✨':'🥚')+'</div><div class="mm-sub">'+(best>=3?'確定演出！！':best>=2?'キラッ…！':'')+'</div></div><div class="mm-greveal">';
    L.seeds.forEach(function(s,i){ var ri=GA().rarInfo(s);
      h+='<div class="mm-gres" style="animation-delay:'+(0.9+i*0.18)+'s;border-color:'+ri.color+'">'+icon({f:s.f,g:999,bw:0,sh:s.sh,o:s.o,t:s.t,j:s.j,s:s.s},28)
        +'<span class="mm-grar" style="background:'+ri.color+'">'+ri.name+'</span><span class="mm-gres-n">'+esc(s.n)+'</span>'+(s.tr?'<span class="mm-gres-t">'+GD().traitById[s.tr].icon+esc(GD().traitById[s.tr].name)+'</span>':'')+(s.sh?'<span class="mm-gres-t">✨色違い</span>':'')+(s.mut?'<span class="mm-gres-t">🧬突然変異</span>':'')+'</div>'; });
    h+='</div>';
    if(L.found)h+='<div class="mm-gbloom">💡 隠しニックス発見！ この組み合わせはこれから「黄金配合」として表示されるモン</div>';
    h+='<div class="mm-gbtns"><button class="mm-cta-s" onclick="MM.ui.go(\'gSeeds\',{})">🌰 タネ袋へ(植える)</button>'
      +(L.from==="breed"?'<button class="mm-cta-s" onclick="MM.ui.go(\'gBreed\')">🧬 もう一度配合</button>':'<button class="mm-cta-s" onclick="MM.ui.go(\'gGacha\')">🌰 もう一度</button>')+'</div>'+back("garden")+'</div>';
    if(best>=3)setTimeout(function(){ sfx("fanfare"); },900); else if(best>=2)setTimeout(function(){ sfx("levelup"); },900);
    return h;
  };

  /* ---------- 🧬 配合シミュレーション ---------- */
  UI.screens.gBreed=function(){
    var c=UI.ctx(), gd=GA().W(c), S=UI.gd.sel, A=GA().ref(c,S.a), B=GA().ref(c,S.b);
    if(!A)S.a=null; if(!B)S.b=null;
    var h='<div class="mm-wrap">'+UI.resBar(c)+'<div class="mm-h">🧬 配合シミュレーション <span class="mm-sub">何回でも試せる・決定でタネができる</span></div>';
    h+='<div class="mm-gpair">'+slot("a","父(系統を継ぐ)",A)+'<span class="mm-gx">×</span>'+slot("b","母",B)+'</div>';
    if(A&&B){
      var pv=GA().preview(c,S.a,S.b);
      if(pv&&pv.err)h+='<div class="mm-q" style="font-size:13px">'+esc(pv.err)+'</div>';
      else if(pv){
        var th=pv.th, gc={S:"#FF4D6D",A:"#F2A516",B:"#2F6BFF",C:"#3E9B4F",D:"#8A8494"}[th.grade];
        h+='<div class="mm-gpv"><div class="mm-gpv-grade" style="background:'+gc+'">配合評価 '+th.grade+'<small>爆発力 '+th.burst+'</small></div>';
        if(!th.list.length)h+='<div class="mm-sub">理論のボーナスなし。ニックス・インブリード・系統をねらおう</div>';
        th.list.forEach(function(t){ h+='<div class="mm-gth"><span>'+esc(t.name)+' <b>+'+t.pt+'</b></span><span class="mm-sub">'+esc(t.note)+'</span></div>'; });
        h+='<div class="mm-h" style="font-size:13px">予想される子の素質</div>';
        GD().STATS.forEach(function(s){ var x=pv.stats[s.k];
          h+='<div class="mm-gstat"><span>'+s.icon+' '+s.name+'</span><span class="mm-gstat-bar mm-gstat-range"><i style="left:'+x.lo+'%;width:'+Math.max(2,x.hi-x.lo)+'%"></i><b style="left:'+x.mean+'%"></b></span><b>'+GA().grade(x.mean)+'</b></div>'; });
        var pct=function(v){ return v>=0.1?Math.round(v*100)+"%":(v>0?(Math.round(v*1000)/10)+"%":"0%"); };
        h+='<div class="mm-gprob"><span>SSR以上 <b>'+pct(pv.pSSR)+'</b></span><span>UR以上 <b>'+pct(pv.pUR)+'</b></span><span style="color:#FF4D6D">伝説 <b>'+pct(pv.pLG)+'</b></span></div>'
          +'<div class="mm-gprob"><span>特性の遺伝 '+(pv.traits.length?pv.traits.map(function(t){ return GD().traitById[t].icon; }).join("")+' 35%':'—')+'</span><span>新特性 '+pct(pv.pNewTrait)+'</span><span>✨色違い '+pct(pv.pShiny)+'</span></div>'
          +(pv.mutation?'<div class="mm-sub" style="text-align:center;color:#B35CFF">🧬 爆発力10以上: 突然変異のチャンス！</div>':'')
          +(th.inbreed?'<div class="mm-sub" style="text-align:center;color:#D8534F">⚠ インブリード: 丈夫さが下がりやすい・まれに虚弱</div>':'')+'</div>';
        h+='<button class="mm-cta" '+(pv.used?'disabled':'')+' onclick="MM.ui.gBreedGo()">'+(pv.used?'今週はもう配合した(来週またできる)':'🧬 配合する(🪙'+fmt(pv.cost)+')')+'</button>';
      }
    }else h+='<div class="mm-q" style="font-size:13px">下のリストから<b>父</b>と<b>母</b>を選ぶモン。咲いている自分の植物か、🌳名木(花粉を借りる)が選べる。</div>';
    /* 候補 */
    var mine=[]; gd.plots.forEach(function(p,i){ if(p&&p.bw!=null&&!p.dead)mine.push({ref:{k:"p",i:i},p:p}); });
    h+='<div class="mm-h" style="font-size:14px">🪴 自分の植物(咲いているもの)</div>';
    if(!mine.length)h+='<div class="mm-sub">まだ咲いている植物がないモン。💧水やりで咲かせよう</div>';
    mine.forEach(function(x){ h+=cand(x.ref,x.p,S); });
    var tab=UI.gd.tab||"all";
    h+='<div class="mm-h" style="font-size:14px">🌳 名木(花粉を借りる)</div><div class="mm-gtabs">'+['all'].concat(GD().families.map(function(f){ return String(f.id); })).map(function(t){
      return '<button class="'+(t===tab?'mm-act':'')+'" onclick="MM.ui.gd.tab=\''+t+'\';MM.ui.render()">'+(t==="all"?"すべて":GD().families[+t].icon)+'</button>'; }).join("")+'</div>';
    var mbs=gd.mb.slice().filter(function(m){ return tab==="all"||String(m.f)===tab; }).sort(function(a,b){ return GA().mbScore(b)-GA().mbScore(a); });
    var lim=UI.gd.mbMore?120:20; mbs.slice(0,lim).forEach(function(m){ h+=cand({k:"m",i:m.i},m,S); });
    if(mbs.length>lim)h+='<button class="mm-more" onclick="MM.ui.gd.mbMore=1;MM.ui.render()">ほか '+(mbs.length-lim)+' 本を見る ▼</button>';
    return h+back("garden")+'</div>';
  };
  function slot(which,label,p){
    if(!p)return '<div class="mm-gslot mm-gslot-empty"><span class="mm-sub">'+label+'</span><span style="font-size:30px;opacity:.4">❔</span></div>';
    return '<button class="mm-gslot" style="border-color:'+GA().rarInfo(p).color+'" onclick="MM.ui.gd.sel.'+which+'=null;MM.ui.render()"><span class="mm-sub">'+label+'</span><span style="font-size:30px">'+GD().families[p.f].icon+'</span><b>'+esc(p.n)+'</b><span class="mm-sub">'+esc(lineName(p))+'</span>'+rarBadge(p)+(p.tr?GD().traitById[p.tr].icon:'')+'</button>';
  }
  function cand(ref,p,S){
    var on=(S.a&&S.a.k===ref.k&&S.a.i===ref.i)?"父":(S.b&&S.b.k===ref.k&&S.b.i===ref.i)?"母":"";
    var r=JSON.stringify(ref).replace(/"/g,"'");
    return '<button class="mm-gcand'+(on?' mm-gcand-on':'')+'" style="border-left-color:'+GA().rarInfo(p).color+'" onclick="MM.ui.gPick('+r+')">'
      +'<span style="font-size:24px">'+GD().families[p.f].icon+'</span><span class="mm-gcand-b"><b>'+esc(p.n)+'</b> '+rarBadge(p)+(p.tr?GD().traitById[p.tr].icon:'')+(p.sh?'✨':'')+(p.own?' <span class="mm-gtr">自家</span>':'')
      +'<span class="mm-sub">'+esc(lineName(p))+' / '+GD().STATS.map(function(s){ return s.icon+GA().grade(p[s.k]); }).join(' ')+(p.fee?' / 花粉料🪙'+fmt(p.fee):'')+(p.r&&p.r.g1?' / G1 '+p.r.g1+'勝':'')+'</span></span>'
      +(on?'<i class="mm-gdot">'+on+'</i>':'')+'</button>';
  }
  UI.gPick=function(ref){
    var S=UI.gd.sel;
    if(S.a&&S.a.k===ref.k&&S.a.i===ref.i){ S.a=null; }
    else if(S.b&&S.b.k===ref.k&&S.b.i===ref.i){ S.b=null; }
    else if(!S.a)S.a=ref; else if(!S.b)S.b=ref; else S.b=ref;
    sfx("tap"); UI.render(); try{ G.scrollTo(0,0); }catch(e){}
  };
  UI.gBreedGo=function(){
    var c=UI.ctx(), S=UI.gd.sel, r=GA().breed(c,S.a,S.b); save();
    if(r.err){ UI.toast(r.err); return; }
    UI.gd.last={seeds:r.seeds,from:"breed",found:r.found}; sfx("roll",6); UI.go("gReveal");
  };

  /* ---------- 🌳 名木 ---------- */
  UI.screens.gMb=function(){
    var c=UI.ctx(), gd=GA().W(c);
    var h='<div class="mm-wrap">'+UI.resBar(c)+'<div class="mm-h">🌳 名木 <span class="mm-sub">'+gd.mb.length+'本 ・ 配合の父/母として花粉を借りられる</span></div>';
    var mine=gd.mb.filter(function(m){ return m.own; });
    if(mine.length){ h+='<div class="mm-h" style="font-size:14px">自家の名木(毎週 花粉料が入る)</div>'; mine.forEach(function(m){ h+=mbRow(gd,m); }); }
    var hot=GA().hotLines(gd); if(hot.length)h+='<div class="mm-q" style="font-size:12px;padding:8px">🔥 勢いのある系統(昨年のリーディング): '+hot.map(function(id){ return esc(GA().lineById(gd,id).name); }).join(" / ")+'</div>';
    gd.mb.filter(function(m){ return !m.own; }).sort(function(a,b){ return GA().mbScore(b)-GA().mbScore(a); }).slice(0,60).forEach(function(m){ h+=mbRow(gd,m); });
    return h+back("garden")+'</div>';
  };
  function mbRow(gd,m){
    var r=JSON.stringify({k:"m",i:m.i}).replace(/"/g,"'");
    return '<button class="mm-gcand" style="border-left-color:'+GA().rarInfo(m).color+'" onclick="MM.ui.gd.sel.b='+r+';MM.ui.go(\'gBreed\')"><span style="font-size:24px">'+GD().families[m.f].icon+'</span><span class="mm-gcand-b"><b>'+esc(m.n)+'</b> '+rarBadge(m)+(m.tr?GD().traitById[m.tr].icon:'')+(m.own?' <span class="mm-gtr">自家</span>':'')
      +'<span class="mm-sub">'+esc(GA().lineById(gd,m.l).name)+' / '+GD().STATS.map(function(s){ return s.icon+GA().grade(m[s.k]); }).join(' ')+' / 花粉料🪙'+fmt(m.fee)+' / 重賞'+m.r.gr+' G1 '+m.r.g1+'</span></span></button>';
  }

  /* ---------- 🔨 施設 ---------- */
  UI.screens.gFac=function(){
    var c=UI.ctx(), gd=GA().W(c), F=GD().FACILITY;
    var h='<div class="mm-wrap">'+UI.resBar(c)+'<div class="mm-h">🔨 ガーデン施設</div>';
    Object.keys(F).forEach(function(k){ var f=F[k], lv=gd.fac[k]||0, cost=GA().facCost(gd,k);
      h+='<div class="mm-gcard"><div class="mm-gcard-top"><span style="font-size:30px">'+f.icon+'</span><div><b>'+esc(f.name)+' Lv'+lv+'</b> <span class="mm-sub">/ 最大'+f.max+'</span><br><span class="mm-sub">'+esc(f.desc)+'</span></div></div>'
        +'<div class="mm-gbtns">'+(cost==null?'<span class="mm-sub">最大レベル</span>':'<button class="mm-cta-s" '+(c.mm.res.g>=cost?'':'disabled')+' onclick="MM.ui.gUp(\''+k+'\')">強化 🪙'+fmt(cost)+'</button>')+'</div></div>'; });
    return h+back("garden")+'</div>';
  };
  UI.gUp=function(k){ var c=UI.ctx(), r=GA().upgrade(c,k); save(); if(r.err)UI.toast(r.err); else { sfx("levelup"); UI.toast(GD().FACILITY[k].name+" Lv"+r.lv+"！"); } UI.go("gFac"); };

  /* ---------- 🏆 品評会 ---------- */
  UI.screens.gContest=function(p){
    var c=UI.ctx(), gd=GA().W(c); if(UI.gd.contest)return contestQ(c);
    var cs=GA().contestsOf(c,gd.w), bloom=[]; gd.plots.forEach(function(x,i){ if(x&&x.bw!=null&&!x.dead)bloom.push(i); });
    var h='<div class="mm-wrap">'+UI.resBar(c)+head(c)+'<div class="mm-h">🏆 今週の品評会</div>';
    if(!bloom.length)h+='<div class="mm-q" style="font-size:13px">咲いている植物がいないと出品できないモン。💧水やりで咲かせよう</div>';
    cs.forEach(function(d){
      var GR=GD().GRADE[d.g], done=GA().isDone(c,d.id);
      h+='<div class="mm-gcont'+(d.g===1?' mm-gcont-g1':'')+(done?' mm-gcont-done':'')+'"><div><span class="mm-grade" style="background:'+GR.color+'">'+GR.label+'</span> <b>'+esc(d.name)+'</b>'+(d.world?' <span class="mm-gtr">🌏'+esc(d.world)+'</span>':'')+'</div>'
        +'<div class="mm-sub">'+GD().CAT_NAME[d.cat]+' / 1着 🪙'+fmt(GR.prize[0])+(d.g===1?' 🎫':'')+' / 条件: '+esc(d.g===5?"未勝利":GR.req)+' / プレゼン'+GR.n+'問</div>';
      if(done)h+='<div class="mm-sub">✔ 終了</div>';
      else bloom.forEach(function(i){ var pl=gd.plots[i], el=GA().eligible(c,pl,d), sc=Math.round(GA().catScore(gd,pl,d.cat,d.w));
        h+='<button class="mm-gentry" '+(el?'disabled':'')+' onclick="MM.ui.gEnter(\''+d.id+'\','+i+')">'+icon(pl,20)+' '+esc(pl.n)+' <span class="mm-sub">'+(el?esc(el):'部門点 '+sc+' ▶ 出品')+'</span></button>'; });
      h+='</div>';
    });
    /* ライバルの有力株 */
    var top=GA().rivalAlive(gd).filter(function(x){ return x.r.g1>0||x.r.gr>1; }).sort(function(a,b){ return b.r.pz-a.r.pz; }).slice(0,5);
    if(top.length){ h+='<div class="mm-h" style="font-size:14px">👀 ライバルの有力株</div><div class="mm-q" style="font-size:12px;padding:8px">';
      top.forEach(function(x){ var rv=GD().rivalById[x.ow]||{}; h+='<div class="mm-row"><span>'+GD().families[x.f].icon+' '+esc(x.n)+' <span class="mm-sub">('+esc(rv.name||"")+')</span></span><span>重賞'+x.r.gr+' G1 '+x.r.g1+'</span></div>'; }); h+='</div>'; }
    return h+back("garden")+'</div>';
  };
  UI.gEnter=function(cid,i){
    var c=UI.ctx(), s=GA().start(c,cid,i); if(!s){ UI.toast("出品できないモン"); return; }
    var gd=GA().W(c), r0=null; for(var k=0;k<gd.rp.length;k++)if(gd.rp[k].i===s.rivals[0])r0=gd.rp[k];
    var rv=r0?GD().rivalById[r0.ow]:null; s.taunt=rv?{boss:rv.boss,name:rv.name,text:rv.taunt}:null;
    UI.gd.contest=s; s.t0=Date.now(); save(); sfx("roll",4); UI.go("gContest");
  };
  function contestQ(c){
    var s=UI.gd.contest, q=G.qById(s.qids[s.i]), GR=GD().GRADE[s.def.g];
    if(!q||s.i>=s.n)return contestResult(c);
    var h='<div class="mm-wrap">'+UI.resBar(c)+'<div class="mm-h"><span class="mm-grade" style="background:'+GR.color+'">'+GR.label+'</span> '+esc(s.def.name)+' <span class="mm-sub">プレゼン '+(s.i+1)+'/'+s.n+' ・ 正解 '+s.hits+'</span></div>';
    if(s.i===0&&s.taunt)h+='<div class="mm-live mm-live-taunt">🗣 '+esc(s.taunt.boss)+'('+esc(s.taunt.name)+')「'+esc(s.taunt.text)+'」</div>';
    h+='<div class="mm-sub" style="text-align:center">審査員に植物の良さを説明しよう！ 正解が多いほど高得点</div>';
    if(s.fb)h+=s.fb; else h+='<div class="mm-q">'+esc(qText(q))+'</div>'+choicesHtml(q,"MM.ui.gConAns");
    return h+'</div>';
  }
  UI.gConAns=function(v){
    var c=UI.ctx(), s=UI.gd.contest; if(!s||s.fb)return;
    var q=G.qById(s.qids[s.i]), ok=judgeQ(q,v), ms=Date.now()-(s.t0||Date.now());
    var r=GA().step(c,s,ok,ms); save();
    sfx(ok?"correct":"wrong",c.mm.combo); UI.play({haptic:ok?"light":"medium"});
    s.fb='<div class="mm-stamp '+(ok?'mm-stamp-ok':'')+'">'+(ok?'⭕ 審査員がうなずいた！':'❌ 審査員が首をかしげた…')+'</div>'
      +'<div class="mm-q" style="font-size:13px;padding:10px">💡 '+esc(q.e||q.explanation||"")+'</div><button class="mm-cta" onclick="MM.ui.gConNext()">'+(r.over?'審査結果へ ▶':'つぎ ▶')+'</button>';
    UI.render();
    if(ok&&!r.over){ clearTimeout(UI._gt); UI._gt=setTimeout(function(){ if(UI.gd.contest&&UI.gd.contest.fb)UI.gConNext(); },1200); }
  };
  UI.gConNext=function(){ clearTimeout(UI._gt); var s=UI.gd.contest; if(!s)return UI.go("garden"); s.fb=null; s.t0=Date.now(); UI.render(); };
  function contestResult(c){
    var s=UI.gd.contest; UI.gd.contest=null;
    var r=GA().finish(c,s); save();
    if(!r)return UI.screens.garden();
    var won=r.pos===1, GR=GD().GRADE[r.def.g];
    var h='<div class="mm-wrap '+(won?'mm-fx3':'')+'">'+UI.resBar(c)
      +'<div class="mm-stamp '+(won?'mm-stamp-ok':'')+'" style="font-size:22px">'+(won?'🏆 優勝！ '+esc(r.def.name):(r.pos<=3?'🎖 '+r.pos+'位 入賞！':r.pos+'位…'))+'</div>'
      +'<div class="mm-sub" style="text-align:center">プレゼン '+(r.pres>=0?'+':'')+(Math.round(r.pres*10)/10)+'点(正解 '+s.hits+'/'+s.n+')</div><div class="mm-q" style="padding:8px">';
    r.board.forEach(function(b,i){ var rv=GD().rivalById[b.ow]||{};
      h+='<div class="mm-board-row'+(b.me?' mm-board-me':'')+'"><b>'+(i+1)+'位</b><span>'+GD().families[b.p.f].icon+' '+esc(b.name)+' <span class="mm-sub">'+(b.me?'あなた':esc(rv.name||""))+'</span></span><span class="mm-sub">'+b.score+'</span></div>'; });
    h+='</div><div class="mm-reward">'+(r.prize?'<span class="mm-pop">🪙 賞金 +'+fmt(r.prize)+'</span>':'')+(r.fame?'<span class="mm-pop" style="animation-delay:.2s">名声 +'+r.fame+'</span>':'')+(r.tix?'<span class="mm-pop mm-pop-ke" style="animation-delay:.3s">🎫 +'+r.tix+'</span>':'')+'</div>';
    if(r.owners.length){ h+='<div class="mm-q" style="font-size:12px;padding:8px">'; r.owners.slice(0,4).forEach(function(o){ h+='<div>'+(o.beat?'✅':'❌')+' <b>'+esc(o.name)+'</b> 通算'+o.w+'勝'+o.l+'敗 <span class="mm-sub">'+esc(o.boss)+'「'+esc(o.text)+'」</span></div>'; }); h+='</div>'; }
    if(!won)h+='<div class="mm-say-card">'+MM.px("m01",24)+'<span>'+(s.hits<s.n?'プレゼンの正解が増えれば順位が上がるモン。':'植物の素質で負けたモン。配合でもっと強いタネを作ろう！')+'</span></div>';
    h+='<button class="mm-cta" onclick="MM.ui.go(\'garden\')">ガーデンへもどる ▶</button></div>';
    if(won)setTimeout(function(){ sfx("fanfare"); if(UI.celebrate)UI.celebrate({icon:GD().families[r.plant.f].icon,title:r.def.name+" 優勝！",sub:GR.label+(r.tix?" 🎫+"+r.tix:"")+" 🪙+"+fmt(r.prize),sfx:"fanfare"}); },300);
    return h;
  }

  /* ---------- 🏛 街評議会 ---------- */
  UI.screens.gCouncil=function(){
    var c=UI.ctx(), gd=GA().W(c), pv=GA().councilPreview(c), me=pv.me;
    var h='<div class="mm-wrap">'+UI.resBar(c)+head(c)+'<div class="mm-h">🏛 街評議会 <span class="mm-sub">次の審査まで あと'+pv.weeksLeft+'週(正解 約'+(pv.weeksLeft*GD().WEEK_NEED+GD().WEEK_NEED-gd.qc)+'問)</span></div>';
    h+='<div class="mm-q" style="font-size:13px">季節の終わりごとに、全国25の街から審査員が見に来るモン。いまの予想は <b>'+pv.pos+'位</b> / '+pv.board.length+'</div>';
    h+='<div class="mm-q" style="font-size:12px;padding:8px"><b>あなたの街 '+fmt(me.total)+'点</b><div class="mm-row"><span>🌸 景観(咲いた花・名声・名木・称号・黄金像)</span><span>'+fmt(me.scenery)+'</span></div><div class="mm-row"><span>🌈 咲いている科 '+me.fams+'/9 ×40</span><span>'+me.fams*40+'</span></div><div class="mm-row"><span>✨ 特性 '+me.traits+'株×30 / 色違い '+me.shiny+'株×50</span><span>'+(me.traits*30+me.shiny*50)+'</span></div></div>';
    h+='<div class="mm-h" style="font-size:14px">🎁 表彰の特典</div><div class="mm-q" style="font-size:12px;padding:8px">';
    GD().COUNCIL_PRIZE.forEach(function(p){ h+='<div class="mm-row"><span>'+p.icon+' <b>'+p.name+'</b>'+(p.upto<99?'('+p.upto+'位以内)':'')+'</span><span class="mm-sub">'+esc(p.desc)+(p.tix?' 🎫'+p.tix:'')+'</span></div>'; });
    h+='<div class="mm-sub" style="margin-top:4px">🗿黄金像: 1体ごとに正解コイン+10%・景観+120(最大'+GD().STATUE_MAX+'体)。🏅メダルはガチャの「評議会メダル交換」で限定の確定タネに。</div></div>';
    h+='<div class="mm-h" style="font-size:14px">📊 いまの順位予想</div><div class="mm-q" style="font-size:12px;padding:8px">';
    pv.board.slice(0,12).forEach(function(x,i){ h+='<div class="mm-board-row'+(x.me?' mm-board-me':'')+'"><b>'+(i+1)+'位</b><span>'+esc(x.name)+'</span><span class="mm-sub">'+fmt(x.score)+'</span></div>'; });
    if(pv.pos>12)h+='<div class="mm-board-row mm-board-me"><b>'+pv.pos+'位</b><span>'+esc(c.mm.name||"あなたの街")+'</span><span class="mm-sub">'+fmt(me.total)+'</span></div>';
    h+='</div>';
    if(gd.council.length){ h+='<div class="mm-h" style="font-size:14px">📜 これまでの審査</div><div class="mm-q" style="font-size:12px;padding:8px">'; gd.council.slice(-8).reverse().forEach(function(x){ h+='<div class="mm-row"><span>第'+x.y+'年 '+GD().SEASONS[x.s]+'</span><span>'+x.pos+'位 '+esc(x.p)+'</span></div>'; }); h+='</div>'; }
    h+='<button class="mm-cta" onclick="MM.ui.gShare()">📣 街をみんなに見せる(共有)</button>';
    return h+back("garden")+'</div>';
  };
  UI.gShare=function(){
    var c=UI.ctx(), t=GA().shareText(c);
    try{ if(G.navigator&&G.navigator.share){ G.navigator.share({text:t}).catch(function(){}); return; } }catch(e){}
    try{ G.navigator.clipboard.writeText(t); UI.toast("街の紹介文をコピーしたモン！ SNSに貼ってね"); }catch(e){ UI.toast(t); }
  };
  function councilView(c,res){
    var won=res.pos<=3;
    var h='<div class="mm-wrap '+(won?'mm-fx3':'')+'">'+UI.resBar(c)+'<div class="mm-h" style="justify-content:center;font-size:18px">🏛 街評議会 '+GD().SEASONS[res.season]+'の審査</div>'
      +'<div class="mm-stamp '+(res.pos<=12?'mm-stamp-ok':'')+'" style="font-size:24px">'+res.icon+' '+res.pos+'位 '+esc(res.prize)+'</div>'
      +'<div class="mm-sub" style="text-align:center">あなたの街 '+fmt(res.score)+'点 / '+res.n+'の街</div><div class="mm-q" style="padding:8px">';
    res.board.forEach(function(x,i){ h+='<div class="mm-board-row'+(x.me?' mm-board-me':'')+'"><b>'+(i+1)+'位</b><span>'+esc(x.name)+'</span><span class="mm-sub">'+fmt(x.score)+'</span></div>'; });
    h+='</div>';
    var g=res.got;
    if(g.medal||g.tix||g.seeds.length||g.statue){
      h+='<div class="mm-reward">'+(g.statue?'<span class="mm-pop mm-pop-ke">🗿 黄金像 +1(コイン永続+10%)</span>':'')+(g.medal?'<span class="mm-pop">🏅 +'+g.medal+'</span>':'')+(g.tix?'<span class="mm-pop">🎫 +'+g.tix+'</span>':'')+'</div>';
      if(g.hint)h+='<div class="mm-gbloom mm-gdrop">💡 審査員のヒント: <b>'+esc(g.hint)+'</b> は黄金配合らしい…(配合で爆発力+5)</div>';
      g.seeds.forEach(function(s){ h+='<div class="mm-gbloom">🎁 '+GD().families[s.f].icon+' <b>'+esc(s.n)+'</b> '+rarBadge(s)+traitBadge(s)+shinyBadge(s)+'</div>'; });
    }else h+='<div class="mm-say-card">'+MM.px("m01",24)+'<span>咲いている花を増やして、いろんな科をそろえると点が上がるモン！</span></div>';
    h+='<button class="mm-cta" onclick="MM.ui.go(\'garden\')">つづける ▶</button></div>';
    if(won)setTimeout(function(){ sfx("fanfare"); if(UI.celebrate)UI.celebrate({icon:res.icon,title:"街評議会 "+res.prize+"！",sub:g.statue?"黄金像が建った！":"🏅+"+g.medal,sfx:"fanfare"}); },300);
    return h;
  }
  function yearView(c,p){
    var h='<div class="mm-wrap mm-fx3">'+UI.resBar(c)+'<div class="mm-h" style="justify-content:center;font-size:18px">🎊 第'+p.y+'年 年度表彰</div>';
    var A={}; GD().AWARDS.forEach(function(a){ A[a.id]=a; });
    (p.awards||[]).forEach(function(a){ var d=A[a.id]||{icon:"🏅"}; h+='<div class="mm-award'+(a.me?' mm-award-me':'')+'"><span class="mm-award-icon">'+d.icon+'</span><span><b>'+esc(a.name)+'</b><br>'+esc(a.who)+(a.me?' <b style="color:#D8534F">← あなた！ 🎫+'+(d.tix||0)+' 🪙+'+fmt(d.coin)+'</b>':'')+'</span></div>'; });
    if(!(p.awards||[]).length)h+='<div class="mm-q">今年は該当なし</div>';
    h+='<div class="mm-q" style="font-size:12px;padding:8px">新しい年のはじまり。昨年のリーディング系統は配合で「系統の勢い」ボーナスがつくモン。</div>';
    h+='<button class="mm-cta" onclick="MM.ui.go(\'garden\')">第'+(p.y+1)+'年へ ▶</button></div>';
    setTimeout(function(){ sfx("fanfare"); },200);
    return h;
  }

  /* ---------- 🎖 記録 ---------- */
  UI.screens.gRec=function(){
    var c=UI.ctx(), gd=GA().W(c), T=GD().TITLES, got=T.filter(function(t){ return gd.titles[t.id]; }).length;
    var h='<div class="mm-wrap">'+UI.resBar(c)+'<div class="mm-h">🎖 記録</div>'
      +'<div class="mm-q" style="font-size:12px;padding:8px"><div class="mm-row"><span>品評会</span><span>'+gd.total.run+'回 '+gd.total.win+'勝 / 重賞'+gd.total.gr+' / G1 '+gd.total.g1+'</span></div>'
      +'<div class="mm-row"><span>獲得賞金</span><span>🪙'+fmt(gd.total.pz)+'</span></div><div class="mm-row"><span>配合</span><span>'+gd.breeds+'回 / 隠しニックス '+Object.keys(gd.hnf).filter(function(k){ return gd.hnf[k]===1; }).length+'/'+gd.hn.length+'</span></div>'
      +'<div class="mm-row"><span>ガチャ</span><span>'+gd.pulls+'回 / 落としダネ '+gd.drops+' / 色違い '+gd.shiny+'</span></div><div class="mm-row"><span>水やり</span><span>'+fmt(gd.water)+'問</span></div>'
      +'<div class="mm-row"><span>特性図鑑</span><span>'+GD().TRAITS.map(function(t){ return gd.trSeen[t.id]?t.icon:'❔'; }).join("")+'</span></div></div>';
    h+='<div class="mm-h" style="font-size:14px">🏅 称号 '+got+'/'+T.length+'</div><div class="mm-gtitles">';
    T.forEach(function(t){ var on=gd.titles[t.id]; h+='<div class="'+(on?'mm-gt-on':'')+'"><b>'+(on?'🎖 ':'🔒 ')+esc(t.name)+'</b><span class="mm-sub">'+esc(t.desc)+' 🎫'+t.tix+'</span></div>'; });
    h+='</div>';
    var fam=Object.keys(gd.hnf); if(fam.length){ h+='<div class="mm-h" style="font-size:14px">💡 黄金配合(隠しニックス)</div><div class="mm-q" style="font-size:12px;padding:8px">'; fam.forEach(function(k){ var ab=k.split("|"); h+='<div>'+esc(GA().lineById(gd,ab[0]).name)+' × '+esc(GA().lineById(gd,ab[1]).name)+(gd.hnf[k]===2?' <span class="mm-sub">(ヒント・未配合)</span>':' ✅')+'</div>'; }); h+='</div>'; }
    var ids=Object.keys(gd.rec); if(ids.length){ h+='<div class="mm-h" style="font-size:14px">📜 G1年表(直近の勝者)</div><div class="mm-q" style="font-size:12px;padding:8px">';
      ids.slice(0,40).forEach(function(id){ var d=GD().contestById[id], a=gd.rec[id], e=a[a.length-1]; if(!d||!e)return; h+='<div class="mm-row"><span>'+esc(d.name)+'</span><span>'+(e.ow==="me"?'<b>':'')+GD().families[e.f].icon+esc(e.n)+(e.ow==="me"?'</b>':'')+' <span class="mm-sub">第'+e.y+'年</span></span></div>'; }); h+='</div>'; }
    if(gd.awards.length){ h+='<div class="mm-h" style="font-size:14px">🎊 年度表彰</div><div class="mm-q" style="font-size:12px;padding:8px">'; gd.awards.slice(-16).reverse().forEach(function(a){ h+='<div class="mm-row"><span>第'+a.y+'年 '+esc(a.name)+'</span><span>'+(a.me?'<b>':'')+esc(a.who)+(a.me?'</b>':'')+'</span></div>'; }); h+='</div>'; }
    var rv=Object.keys(gd.rv); if(rv.length){ h+='<div class="mm-h" style="font-size:14px">🗣 ライバル園芸家</div><div class="mm-q" style="font-size:12px;padding:8px">'; rv.forEach(function(id){ var d=GD().rivalById[id]; if(d)h+='<div class="mm-row"><span>'+esc(d.name)+'</span><span>'+gd.rv[id].w+'勝'+gd.rv[id].l+'敗</span></div>'; }); h+='</div>'; }
    if(gd.hall.length){ h+='<div class="mm-h" style="font-size:14px">🏛 殿堂</div><div class="mm-q" style="font-size:12px;padding:8px">'; gd.hall.slice(-20).reverse().forEach(function(x){ h+='<div class="mm-row"><span>'+GD().families[x.f].icon+' '+esc(x.n)+(x.mb?' 🌳':'')+'</span><span>'+x.r.w+'勝 G1 '+x.r.g1+'</span></div>'; }); h+='</div>'; }
    return h+back("garden")+'</div>';
  };
})();
