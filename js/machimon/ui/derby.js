"use strict";
/* ============================================================
   machimon/ui/derby.js — 社労士ダービー(ウイニングポスト風)の画面
   ★画面は4つだけ: ダービー(暦+今週のレース+厩舎) / 出走(馬を選ぶ) / レース(解く) / 殿堂。
   ★おじいちゃんでも3秒で分かる: 「出走する ▶」か「休養して次の週へ ▶」の2択。
   ★UIは判断を持たない。すべて core/derby.js に委譲する。
   ============================================================ */
(function(){
  var G=(typeof window!=="undefined")?window:globalThis;
  var MM=G.MM=G.MM||{}; var UI=MM.ui;
  var g=null,t0=0;
  UI.racing=function(){ return !!g; };
  function esc(s){ return UI.esc(s); }
  function names(){ return G.SUBJECTS||[]; }
  function gradeBadge(gr){ var d=MM.DATA.raceGrade[gr]; return '<span class="mm-grade" style="background:'+d.color+'">'+d.label+'</span>'; }
  function subsText(c,def){
    var s=MM.derby.raceSubs(c,def), n=names();
    if(s.length>=9)return "全科目";
    if(s.length>3)return n[s[0]]+" ほか"+(s.length-1)+"科目";
    return s.map(function(x){ return n[x]||""; }).join("・");
  }
  function fmt(n){ return String(n).replace(/\B(?=(\d{3})+(?!\d))/g,","); }
  function head(c){
    var cal=MM.derby.cal(c), wp=MM.derby.W(c);
    return '<div class="mm-derby-head"><div><span class="mm-derby-cal">🏇 '+esc(cal.label)+'</span><span class="mm-sub">社労士ダービー</span></div>'
      +'<div class="mm-sub">通算 '+wp.total.run+'戦'+wp.total.win+'勝 / G1 '+wp.total.g1+'勝 / 賞金 🪙'+fmt(wp.total.prize)+'</div></div>';
  }

  /* ---------- ダービー(ハブ) ---------- */
  UI.screens.derby=function(){
    var c=UI.ctx(); if(g)return race(c);
    var wp=MM.derby.W(c), rs=MM.derby.weekRaces(c), st=MM.derby.stable(c);
    var h='<div class="mm-wrap">'+UI.resBar(c)+head(c);
    h+='<div class="mm-coach">'+MM.px("m01",44,"mm-hop")+'<div class="mm-coach-text">'+esc(MM.derby.secretary(c))+'</div></div>';
    h+='<div class="mm-h">📅 今週のレース</div>';
    if(wp.done&&wp.last){
      var l=wp.last;
      h+='<div class="mm-q" style="padding:10px;font-size:13px">'+gradeBadge(l.grade)+' '+esc(l.race)+' → <b>'+l.pos+'着</b>'+(l.prize?' 🪙'+fmt(l.prize):'')+' <span class="mm-sub">('+esc((MM.DATA.speciesById[l.sp]||{}).name||"")+' / 正解'+l.hits+'/'+l.n+')</span></div>';
    }
    for(var i=0;i<rs.length;i++){
      var d=rs[i].def, lock=rs[i].lock, gr=MM.DATA.raceGrade[d.grade];
      var dis=wp.done||lock||!st.some(function(x){ return x.can; });
      h+='<button class="mm-race'+(d.grade===1?" mm-race-g1":"")+(dis?" mm-race-off":"")+'" '+(dis?'':'onclick="MM.ui.go(\'derbyEntry\',{race:\''+esc(d.id)+'\'})"')+'>'
        +'<span class="mm-race-top">'+gradeBadge(d.grade)+'<b>'+esc(d.name)+'</b>'+(d.crown?'<span class="mm-crown">👑三冠'+d.crown+'</span>':'')+'</span>'
        +'<span class="mm-sub">'+esc(subsText(c,d))+' / '+d.n+'問 / 1着 🪙'+fmt(gr.prize[0])+(d.grade===1?' +🎫':'')+'</span>'
        +'<span class="mm-race-go">'+(lock?'🔒 街で「'+esc(lock)+'」を開くと出走できる':(wp.done?'今週は出走済み':(dis?'出走できるマチモンがいない':'出走する ▶')))+'</span></button>';
    }
    h+='<button class="mm-cta mm-cta-rest" onclick="MM.ui.derbyRest()">'+(wp.done?'つぎの週へ ▶':'💤 休養して つぎの週へ ▶')+'</button>';
    /* 厩舎 */
    h+='<div class="mm-h">🐴 厩舎 <span class="mm-sub">'+st.length+'頭</span></div>';
    if(!st.length)h+='<div class="mm-q" style="font-size:13px">マチモンがいません。街で事件を解くとタマゴが手に入ります。</div>';
    h+='<div class="mm-stable">';
    for(var j=0;j<st.length&&j<12;j++){
      var x=st[j];
      h+='<button class="mm-horse'+(x.can?'':' mm-horse-off')+'" onclick="MM.ui.go(\'horse\',{uid:\''+x.uid+'\'})">'
        +'<span class="mm-horse-face">'+MM.px(x.sp.id,40)+'</span><span class="mm-horse-info"><b>'+esc(x.sp.name)+' <span class="mm-sub">'+x.age+'歳</span></b>'
        +'<span class="mm-cond" style="color:'+x.cond.color+'">'+x.cond.mark+' '+esc(x.cond.name)+'</span>'
        +'<span class="mm-sub">'+x.rec.run+'戦'+x.rec.win+'勝'+(x.rec.g1?' G1'+x.rec.g1:'')+(x.rec.ret?' / 殿堂入り':(x.can?'':' / 引退'))+'</span>'
        +'<span class="mm-spd"><i style="width:'+Math.min(100,x.pw.total)+'%"></i></span></span></button>';
    }
    h+='</div>';
    h+='<div class="mm-quick"><button onclick="MM.ui.go(\'hall\')">🏛 殿堂・血統</button><button onclick="MM.ui.go(\'derbyHist\')">📜 レース結果</button></div>';
    return h+'</div>'+UI.tabs("derby");
  };
  UI.derbyRest=function(){
    var c=UI.ctx();
    var r=MM.derby.advance(c); MM.game.save();
    if(r.newYear){ UI.go("derbyYear",{awards:r.awards,y:r.y}); return; }
    UI.go("derby");
  };

  /* ---------- 馬の詳細(引退) ---------- */
  UI.screens.horse=function(p){
    var c=UI.ctx(), m=c.mm.mons[p.uid]; if(!m)return UI.screens.derby();
    var sp=MM.DATA.speciesById[m.sp]||{}, r=MM.derby.rec(c,p.uid), pw=MM.derby.power(c,p.uid,null), cd=MM.derby.cond(c,p.uid), age=MM.derby.age(c,p.uid);
    var h='<div class="mm-wrap">'+UI.resBar(c)
      +'<div style="text-align:center;margin:8px 0"><span class="mm-hop" style="display:inline-block">'+MM.px(m.sp,88)+'</span></div>'
      +'<div class="mm-h" style="justify-content:center">'+esc(sp.name)+' <span class="mm-sub">'+age+'歳 / Lv'+m.lv+'</span></div>'
      +'<div class="mm-q" style="font-size:13px">'
      +row("スピード(進化とLv)",pw.spd,60)+row("知識("+esc(sp.sub>=0?(names()[sp.sub]||""):"全科目")+"の習熟)",pw.know,20)
      +'<div class="mm-row"><span>調子</span><span style="color:'+cd.color+';font-weight:900">'+cd.mark+' '+esc(cd.name)+' ('+(cd.mod>=0?'+':'')+cd.mod+')</span></div>'
      +'<div class="mm-row"><span>血統ボーナス</span><span>+'+pw.legacy+'</span></div>'
      +'<div class="mm-row"><span>総合力</span><b>'+pw.total+'</b></div>'
      +'<div class="mm-row"><span>成績</span><span>'+r.run+'戦'+r.win+'勝 (G1 '+r.g1+'勝) / 賞金 🪙'+fmt(r.prize)+'</span></div>'
      +'</div>';
    h+='<div class="mm-q" style="font-size:12px;padding:10px">💡 スピードは進化とレベル、知識は'+esc(sp.sub>=0?(names()[sp.sub]||"")+"の事件":"事件")+'を解くほど上がる。調子は出走すると下がり、休養で戻る。</div>';
    if(r.ret)h+='<div class="mm-q" style="font-size:13px">🏛 殿堂入り。血統として次の世代に力を受け継いでいます。</div>';
    else if(age>=MM.derby.AGE_MAX)h+='<div class="mm-q" style="font-size:13px">'+MM.derby.AGE_MAX+'歳。もう出走できません。引退させて殿堂入りさせよう。</div>';
    if(MM.derby.canRetire(c,p.uid))h+='<button class="small-btn" style="width:100%;min-height:48px" onclick="MM.ui.retire(\''+p.uid+'\')">🏛 引退して殿堂入り(血統として受け継ぐ)</button>';
    else if(!r.ret)h+='<div class="mm-sub" style="text-align:center">'+MM.derby.AGE_RETIRE+'歳から引退できます</div>';
    if(sp.sub>=0)h+='<button class="small-btn" style="width:100%;min-height:48px;margin-top:8px" onclick="MM.ui.train('+sp.sub+')">🏋️ 調教する('+esc(names()[sp.sub]||"")+'の事件へ)</button>';
    h+='<button class="small-btn" style="width:100%;min-height:48px;margin-top:8px" onclick="MM.ui.go(\'derby\')">もどる</button>';
    return h+'</div>';
  };
  function row(label,now,max){ return '<div class="mm-row"><span>'+label+'</span><span>'+now+' / '+max+'</span></div>'+UI.bar(now,max); }
  UI.retire=function(uid){
    var c=UI.ctx(), h=MM.derby.retire(c,uid);
    MM.game.save();
    UI.go("hall");
    if(h&&UI.celebrate)UI.celebrate({icon:MM.px(h.sp,96),title:h.name+" 殿堂入り！",sub:h.run+"戦"+h.win+"勝 / 同じ科目の後輩に 血統+"+Math.min(15,h.g1*3+h.win),sfx:"big"});
  };

  /* ---------- 出走(馬を選ぶ) ---------- */
  UI.screens.derbyEntry=function(p){
    var c=UI.ctx(), def=MM.derby.raceDef(c,p.race); if(!def)return UI.screens.derby();
    var gr=MM.DATA.raceGrade[def.grade], st=MM.derby.stable(c).filter(function(x){ return x.can; });
    var h='<div class="mm-wrap">'+UI.resBar(c)+head(c)
      +'<div class="mm-q" style="padding:10px"><div>'+gradeBadge(def.grade)+' <b>'+esc(def.name)+'</b></div>'
      +'<div class="mm-sub">'+esc(subsText(c,def))+' / '+def.n+'問 / '+MM.DATA.RUNNERS+'頭立て / 賞金 1着🪙'+fmt(gr.prize[0])+' 2着🪙'+fmt(gr.prize[1])+' 3着🪙'+fmt(gr.prize[2])+'</div></div>'
      +'<div class="mm-h">🐴 出走させるマチモンを選ぶ</div>';
    for(var i=0;i<st.length;i++){
      var x=st[i], pw=MM.derby.power(c,x.uid,def), need=MM.derby.needCorrect(c,x.uid,def);
      var over=need>def.n, mark=over?"—":(need<=Math.ceil(def.n*0.55)?"◎":(need<=Math.ceil(def.n*0.7)?"○":(need<=Math.ceil(def.n*0.85)?"▲":"△")));
      h+='<button class="mm-horse" onclick="MM.ui.derbyStart(\''+esc(def.id)+'\',\''+x.uid+'\')">'
        +'<span class="mm-horse-face">'+MM.px(x.sp.id,40)+'<span class="mm-mark">'+mark+'</span></span><span class="mm-horse-info"><b>'+esc(x.sp.name)+' <span class="mm-sub">'+x.age+'歳</span></b>'
        +'<span class="mm-cond" style="color:'+x.cond.color+'">'+x.cond.mark+' '+esc(x.cond.name)+'</span>'
        +'<span class="mm-sub">総合力 '+pw.total+(pw.fit?' (適性+'+pw.fit+')':'')+' / '+(over?'<b style="color:#8A8494">まだ格上(経験を積もう)</b>':'1着の目安: <b>正解'+need+'問</b> / '+def.n+'問')+'</span>'
        +'<span class="mm-spd"><i style="width:'+Math.min(100,pw.total)+'%"></i></span></span></button>';
    }
    h+='<div class="mm-sub" style="text-align:center;margin-top:6px">◎○▲△ = 勝ちやすさ(— は格上)。「目安」はトップのライバルに届く正解数。出走すれば負けても経験と賞金が入る</div>';
    h+='<button class="small-btn" style="width:100%;min-height:48px;margin-top:8px" onclick="MM.ui.go(\'derby\')">もどる</button>';
    return h+'</div>';
  };
  UI.derbyStart=function(raceId,uid){
    var c=UI.ctx();
    g=MM.derby.enter(c,raceId,uid);
    if(!g)return UI.go("derby");
    MM.game.save();
    try{ if(MM.sfx)MM.sfx.roll(6); }catch(e){}
    UI.go("derby");
  };

  /* ---------- レース(解く) ---------- */
  function track(c,g,live){
    var run=[{name:(MM.DATA.speciesById[c.mm.mons[g.uid].sp]||{}).name||"",pos:g.me,me:true,sp:c.mm.mons[g.uid].sp}];
    for(var i=0;i<g.rivals.length;i++)run.push({name:g.rivals[i].name,pos:g.rivals[i].pos,me:false});
    var sorted=run.slice().sort(function(a,b){ return b.pos-a.pos; });
    var h='<div class="mm-track">';
    for(var j=0;j<run.length;j++){
      var r=run[j], left=Math.min(88,Math.round(r.pos/g.scale*100));
      var rk=sorted.indexOf(r)+1;
      h+='<div class="mm-lane'+(r.me?" mm-lane-me":"")+'"><span class="mm-lane-name">'+(r.me?'👤':'')+esc(r.name)+'</span>'
        +'<span class="mm-lane-run"><i class="mm-runner" style="left:'+left+'%">'+(r.me?MM.px(r.sp,26):'🐎')+'</i></span>'
        +'<span class="mm-lane-rank">'+rk+'</span></div>';
    }
    return h+'</div>';
  }
  function race(c){
    var qid=g.qids[g.i], q=(typeof G.qById==="function")?G.qById(qid):null;
    if(!q||g.i>=g.n)return finish(c);
    t0=Date.now();
    var last=(g.i===g.n-1);
    var h='<div class="mm-wrap">'+UI.resBar(c)
      +'<div class="mm-h">'+gradeBadge(g.grade)+' '+esc(g.name)+' <span class="mm-sub">'+(g.i+1)+' / '+g.n+'問'+(g.i?' ・ 現在 '+MM.derby.rank(g)+'番手':'')+'</span></div>'
      +track(c,g,true)
      +(last?'<div class="mm-last">🔥 最終直線！ この1問は1.5倍！</div>':'')
      +'<div class="mm-q">'+esc(q.q||q.question||"")+'</div>';
    if(q.choices&&q.choices.length&&q.format!=="true_false"){
      h+='<div style="display:grid;gap:8px">';
      for(var i=0;i<q.choices.length;i++)h+='<button class="mm-slot" style="min-height:52px" onclick="MM.ui.raceAnswer('+i+')">'+(i+1)+'. '+esc(typeof q.choices[i]==="string"?q.choices[i]:(q.choices[i].text||""))+'</button>';
      h+='</div>';
    }else{
      h+='<div class="mm-ans"><button onclick="MM.ui.raceAnswer(true)" aria-label="まる">◯</button><button onclick="MM.ui.raceAnswer(false)" aria-label="ばつ">✕</button></div>';
    }
    return h+'</div>';
  }
  function judge(q,v){
    if(q.choices&&q.choices.length&&q.format!=="true_false"){
      var ci=(typeof q.answerIndex==="number")?q.answerIndex:(typeof q.correctIndex==="number"?q.correctIndex:-1);
      if(ci<0&&q.choices[0]&&typeof q.choices[0]==="object"){ for(var i=0;i<q.choices.length;i++)if(q.choices[i].correct)ci=i; }
      return v===ci;
    }
    var ans=(typeof q.a==="boolean")?q.a:!!q.answer;
    return v===ans;
  }
  UI.raceAnswer=function(v){
    if(!g)return UI.go("derby");
    var c=UI.ctx(), qid=g.qids[g.i], q=(typeof G.qById==="function")?G.qById(qid):null;
    if(!q)return UI.go("derby");
    var ok=judge(q,v), ms=t0?Date.now()-t0:0;
    var r=MM.derby.step(c,g,ok,ms);
    MM.game.save();
    try{ if(MM.sfx){ if(ok)MM.sfx.correct(c.mm.combo); else MM.sfx.wrong(); } }catch(e){}
    UI.play({haptic:ok?"light":"medium"});
    var box=G.document.getElementById("app"); if(!box)return;
    var line=ok?(r.last?'🏁 ゴール前で伸びた！':(r.rank===1?'🚀 先頭に立った！':(r.tb>=15?'⚡ 速い！ぐんぐん伸びる':'🏃 正解！ 前へ！')))
              :(r.last?'💨 ゴール前でつまずいた…':'💦 つまずいた… 遅れる');
    box.innerHTML='<div class="mm-wrap '+(ok?"mm-fx1":"")+'">'+UI.resBar(c)
      +'<div class="mm-h">'+line+' <span class="mm-sub">'+r.rank+'番手</span></div>'
      +track(c,g,false)
      +'<div class="mm-reward"><span class="mm-pop">'+(ok?'+'+r.adv+'m':'+'+r.adv+'m…')+'</span>'+(r.gain.g?'<span class="mm-pop" style="animation-delay:.15s">🪙 +'+r.gain.g+'</span>':'')+(r.gain.ke?'<span class="mm-pop mm-pop-ke" style="animation-delay:.3s">✨ 知識 +'+r.gain.ke+'</span>':'')+'</div>'
      +'<div class="mm-q" style="font-size:13px;padding:10px">💡 '+esc(q.e||q.explanation||"")+'</div>'
      +'<button class="mm-cta" onclick="MM.ui.raceNext()">'+(r.over?'ゴール！ 結果を見る ▶':'つぎの問題へ ▶')+'</button></div>';
    try{ G.scrollTo(0,0); }catch(e){}
    if(ok&&!r.over)UI._t=setTimeout(function(){ UI.raceNext(); },1400);
  };
  UI.raceNext=function(){ clearTimeout(UI._t); if(!g)return UI.go("derby"); UI.render(); };

  function finish(c){
    var r=MM.derby.finish(c,g); var gg=g; g=null;
    MM.game.save();
    var won=r.pos===1;
    var h='<div class="mm-wrap '+(won?"mm-fx3":"")+'">'+UI.resBar(c)
      +'<div class="mm-stamp '+(won?"mm-stamp-ok":"")+'" style="font-size:22px">'+(won?'🏆 1着！ '+esc(r.name)+' 優勝！':(r.pos<=3?'🥉 '+r.pos+'着！ 入着！':r.pos+'着…'))+'</div>'
      +'<div class="mm-q" style="padding:10px"><div class="mm-sub">正解 '+r.hits+' / '+r.n+'問</div><div class="mm-board">';
    for(var i=0;i<r.board.length;i++){ var b=r.board[i]; h+='<div class="mm-board-row'+(b.me?' mm-board-me':'')+'"><b>'+(i+1)+'着</b><span>'+(b.me?MM.px(c.mm.mons[b.uid].sp,22)+' ':'🐎 ')+esc(b.name)+'</span></div>'; }
    h+='</div></div>';
    if(r.prize||r.tix||r.gain.tama||r.gain.mat){
      h+='<div class="mm-reward">'+(r.prize?'<span class="mm-pop">🪙 賞金 +'+fmt(r.prize)+'</span>':'')+(r.gain.tama?'<span class="mm-pop mm-pop-ke" style="animation-delay:.2s">🥚 +'+r.gain.tama+'</span>':'')
        +(r.gain.mat?'<span class="mm-pop" style="animation-delay:.3s">🧩 +'+r.gain.mat+'</span>':'')+(r.tix?'<span class="mm-pop mm-pop-ke" style="animation-delay:.4s">🎫 +'+r.tix+'</span>':'')+'</div>';
    }
    if(r.crown)h+='<div class="mm-bigclear">👑 三冠達成！！ 🎫+'+r.crown.tix+'</div>';
    if(!won)h+='<div class="mm-say-card">'+MM.px("m01",24)+'<span>'+(r.pos<=3?'惜しかったモン！ 正解が'+(r.hits<r.n?'あと少し':'')+'あれば勝てたモン':'間違えた問題は街の事件でまた出るモン。復習して次は勝つモン！')+'</span></div>';
    h+='<button class="mm-cta" onclick="MM.ui.go(\'derby\')">厩舎へもどる ▶</button></div>';
    if(won)setTimeout(function(){ try{ if(MM.sfx)MM.sfx.big(); }catch(e){} if(UI.celebrate)UI.celebrate({icon:MM.px(c.mm.mons[gg.uid].sp,96),title:esc(r.name)+" 優勝！",sub:(r.grade===1?"G1制覇！ 🎫+1":"賞金 🪙"+fmt(r.prize)),sfx:"fanfare"}); },300);
    else if(r.crown)setTimeout(function(){ if(UI.celebrate)UI.celebrate({icon:"👑",title:"三冠達成！",sub:"🎫+"+r.crown.tix,sfx:"big"}); },300);
    return h;
  }

  /* ---------- 年度表彰 ---------- */
  UI.screens.derbyYear=function(p){
    var c=UI.ctx(), aw=p.awards||[], y=(p.y||1)-1;
    var h='<div class="mm-wrap mm-fx3">'+UI.resBar(c)+'<div class="mm-h" style="justify-content:center;font-size:18px">🎊 第'+y+'年 年度表彰</div>';
    if(!aw.length)h+='<div class="mm-q" style="text-align:center">今年は出走がありませんでした。<div class="mm-sub">来年はレースに出て表彰を狙おう！</div></div>';
    var A={}; for(var i=0;i<MM.DATA.awards.length;i++)A[MM.DATA.awards[i].id]=MM.DATA.awards[i];
    for(var j=0;j<aw.length;j++){ var a=aw[j], d=A[a.id]||{icon:"🏅"};
      h+='<div class="mm-award"><span class="mm-award-icon">'+d.icon+'</span><span><b>'+esc(a.name)+'</b><br>'+MM.px(a.sp,22)+' '+esc((MM.DATA.speciesById[a.sp]||{}).name||"")+' <span class="mm-sub">'+esc(a.text||"")+'</span><br><span class="mm-sub">'+(a.tix?'🎫+'+a.tix:'')+(a.tama?' 🥚+'+a.tama:'')+'</span></span></div>'; }
    h+='<div class="mm-q" style="font-size:12px;padding:10px">みんな1歳 年をとりました。'+MM.derby.AGE_RETIRE+'歳以上は引退→殿堂入りで、血統として次の世代に力を残せます。</div>';
    h+='<button class="mm-cta" onclick="MM.ui.go(\'derby\')">第'+(y+1)+'年へ ▶</button></div>';
    setTimeout(function(){ try{ if(MM.sfx)MM.sfx.fanfare(); }catch(e){} },200);
    return h;
  };

  /* ---------- 殿堂・血統 ---------- */
  UI.screens.hall=function(){
    var c=UI.ctx(), wp=MM.derby.W(c), lin=MM.derby.lineage(c), n=names();
    var h='<div class="mm-wrap">'+UI.resBar(c)+head(c)+'<div class="mm-h">🏛 殿堂</div>';
    if(!wp.hall.length)h+='<div class="mm-q" style="font-size:13px">まだ殿堂入りはいません。'+MM.derby.AGE_RETIRE+'歳以上のマチモンを引退させると、ここに刻まれて血統になります。</div>';
    for(var i=wp.hall.length-1;i>=0;i--){ var x=wp.hall[i];
      h+='<div class="mm-horse" style="cursor:default"><span class="mm-horse-face">'+MM.px(x.sp,40)+'</span><span class="mm-horse-info"><b>'+esc(x.name)+'</b><span class="mm-sub">第'+x.y+'年引退 / '+x.run+'戦'+x.win+'勝 G1'+x.g1+'勝 / 🪙'+fmt(x.prize)+'</span><span class="mm-sub">血統ボーナス +'+Math.min(15,x.g1*3+x.win)+' → '+esc(x.sub>=0?(n[x.sub]||""):"全科目")+'</span></span></div>'; }
    h+='<div class="mm-h">🧬 血統(科目ごとの受け継ぎ)</div><div class="mm-q" style="font-size:12px">';
    for(var s=0;s<9;s++){ var b=MM.derby.legacy(c,s); h+='<div class="mm-row"><span>'+esc(n[s]||"")+(lin[s]?' <b style="color:#B58900">系統確立!</b>':'')+'</span><span>'+(b?'+'+b+(lin[s]?' (+5)':''):'—')+'</span></div>'; }
    h+='</div>';
    if(wp.awards.length){ h+='<div class="mm-h">🎊 受賞歴</div><div class="mm-q" style="font-size:12px">';
      for(var k=wp.awards.length-1;k>=0&&k>=wp.awards.length-12;k--){ var a=wp.awards[k]; h+='<div class="mm-row"><span>第'+a.y+'年 '+esc(a.name)+'</span><span>'+esc((MM.DATA.speciesById[a.sp]||{}).name||"")+'</span></div>'; }
      h+='</div>'; }
    h+='<button class="small-btn" style="width:100%;min-height:48px;margin-top:8px" onclick="MM.ui.go(\'derby\')">もどる</button>';
    return h+'</div>';
  };
  UI.screens.derbyHist=function(){
    var c=UI.ctx(), wp=MM.derby.W(c);
    var h='<div class="mm-wrap">'+UI.resBar(c)+head(c)+'<div class="mm-h">📜 レース結果</div><div class="mm-q" style="font-size:12px">';
    if(!wp.hist.length)h+='<div class="mm-sub">まだ出走していません</div>';
    for(var i=wp.hist.length-1;i>=0;i--){ var x=wp.hist[i];
      h+='<div class="mm-row"><span>第'+x.y+'年'+x.w+'週 '+gradeBadge(x.grade)+' '+esc(x.race)+'</span><span><b>'+x.pos+'着</b> '+esc((MM.DATA.speciesById[x.sp]||{}).name||"")+(x.prize?' 🪙'+fmt(x.prize):'')+'</span></div>'; }
    h+='</div><button class="small-btn" style="width:100%;min-height:48px;margin-top:8px" onclick="MM.ui.go(\'derby\')">もどる</button>';
    return h+'</div>';
  };
})();
