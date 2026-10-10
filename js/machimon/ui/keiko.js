"use strict";
/* ============================================================
   machimon/ui/keiko.js — けいこ(3つから選ぶ・1回10問)と、その結果
   ★えらぶ画面は 大きいボタン3つ。それぞれ「何が出て・何がのびるか・あと何問か」が1行で分かる。
   ★問題の上に、いま伸びている能力の けいこ値 を出す(正解するたびに棒がのびて、満ちると +1)。
   ★判断は core/keiko.js。ここは表示だけ。
   ============================================================ */
(function(){
  var G=(typeof window!=="undefined")?window:globalThis;
  var MM=G.MM=G.MM||{}; var UI=MM.ui;
  var M=function(){ return MM.mon; }, D=function(){ return MM.DATA; }, KE=function(){ return MM.keiko; };
  var esc=function(s){ return UI.esc(s); };
  function fmt(n){ return UI.v2p.fmt(n); }
  function sfx(n,a){ try{ if(MM.sfx&&MM.sfx[n])MM.sfx[n](a); }catch(e){} }
  function save(){ MM.game.save(); }
  UI.v2ok.k2m=1; UI.v2ok.k2=1; UI.v2ok.k2r=1;

  /* ---------- けいこを えらぶ ---------- */
  UI.screens.k2m=function(){
    var c=UI.ctx(), g=M().W(c), m=KE().menu(c), K=D().kstat, t=m.ticket;
    var h='<div class="mm-wrap">'+UI.resBar2(c)+'<div class="mm-h">📚 けいこを えらぶ <span class="mm-sub">1回10問</span></div>';
    m.list.forEach(function(x){
      var off=x.left<=0, s=K[x.stat], line;
      if(off)line=x.none;
      else if(x.id==="new")line='きょうは「'+esc(x.subName)+'」 ・ のこり '+fmt(x.left)+'問';
      else if(x.id==="rev")line='きょうの分 のこり <b>'+fmt(x.left)+'</b>問'+(t.got?'':(t.done<t.need?' ・ あと'+(t.need-t.done)+'問で 🎟配合券':''));
      else line='のこり <b>'+fmt(x.left)+'</b>問';
      h+='<button class="mm-v2-kbtn mm-v2-k-'+x.id+'" '+(off?'disabled':'')+' onclick="MM.ui.k2Go(\''+x.id+'\')">'
        +'<span class="mm-v2-kicon">'+x.icon+'</span>'
        +'<span class="mm-v2-kbody"><b>'+x.name+'</b><span class="mm-v2-kdesc">'+line+'</span></span>'
        +'<span class="mm-v2-kstat">'+s.icon+'<i>'+s.name+'</i></span></button>';
    });
    h+='<div class="mm-v2-hint mm-v2-khint">右の印 = その けいこ で のびる能力。連続正解で 🔥いきおい、本試験形式の正解で 📘かしこさ も のびる。</div>';
    /* 配合券まで */
    h+='<div class="mm-q mm-v2-tk">🎟 きょうの配合券 '+(t.got?'<b>もらった ✔</b>':(t.need>0?'復習 <b>'+t.done+'/'+t.need+'</b>問'+(t.done>=t.need?' ✔':''):'')+((t.need<=0||t.done>=t.need)&&t.ans<t.min?' あと<b>'+(t.min-t.ans)+'</b>問とく':''))+'</div>';
    /* けいこに使う どうぐ */
    var b=g.boost||{xp:0,ef:0}, its=D().ITEMS.filter(function(x){ return x.use==="k"&&g.items[x.id]>0; });
    if(b.ef>0||b.xp>0)h+='<div class="mm-v2-hint">'+(b.ef>0?'📒 けいこ値2倍 のこり'+b.ef+'問 ':'')+(b.xp>0?'🍡 けいけん2倍 のこり'+b.xp+'問':'')+'</div>';
    its.forEach(function(x){ h+='<button class="small-btn mm-v2-use" onclick="MM.ui.k2Use(\''+x.id+'\')"><b>'+x.icon+' '+esc(x.name)+' ×'+g.items[x.id]+' を使う</b><span class="mm-sub">'+esc(x.desc)+'</span></button>'; });
    return h+UI.back2("h2","ホームへ")+'</div>'+UI.tabs2("");
  };
  UI.k2Use=function(id){ var c=UI.ctx(), r=MM.breed.useItem(c,id,""); save(); if(r.err)UI.toast(r.err); else { sfx("levelup"); UI.toast(D().itemById[id].icon+" "+D().itemById[id].name+" を使った"); } UI.go("k2m"); };
  UI.k2Go=function(kind){
    var c=UI.ctx(), s=KE().start(c,kind);
    if(s.err){ UI.toast(s.err); UI.go("k2m"); return; }
    s.t0=Date.now(); s.fb=null; s.sen={picks:[]}; UI.v2.quiz=s; UI.go("k2");
  };

  function strip(c,s){
    var g=M().W(c), k=M().kanban(g), kd=D().keikoById[s.kind], st=D().kstat[kd.stat], e=k.ef[M().KEYS.indexOf(kd.stat)]||0, full=e>=D().EF_MAX;
    return '<div class="mm-v2-strip">'+UI.v2p.sprite(k,40)
      +'<span class="mm-v2-strip-b"><span><b>'+kd.icon+' '+kd.name+'</b> <span class="mm-v2-strip-n">'+Math.min(s.n+(s.fb?0:1),s.size)+'/'+s.size+'問目</span></span>'
      +'<span class="mm-v2-efbar">'+st.icon+' '+st.name+' <b>'+Math.floor(e)+'</b><span class="mm-bar"><i style="width:'+(full?100:Math.round((e-Math.floor(e))*100))+'%"></i></span></span></span>'
      +'<span class="mm-pw mm-pw-col">つよさ<b>'+fmt(M().power(k))+'</b></span></div>';
  }
  UI.screens.k2=function(){
    var c=UI.ctx(), s=UI.v2.quiz; if(!s)return UI.screens.h2();
    var q=(typeof G.qById==="function"&&s.qid!=null)?G.qById(s.qid):null;
    if(!q&&!s.fb){ return UI.screens.k2r(); }
    var h='<div class="mm-wrap">'+UI.resBar2(c)+strip(c,s);
    h+=s.fb?s.fb:UI.qz.qHtml(q,"MM.ui.k2Ans",s.sen);
    return h+'<button class="small-btn mm-gback" onclick="MM.ui.k2End()">けいこを やめる</button></div>';
  };
  UI.k2Ans=function(v){
    var c=UI.ctx(), s=UI.v2.quiz; if(!s||s.fb)return;
    var q=G.qById(s.qid), ms=Date.now()-(s.t0||Date.now()), ok;
    if(q.sentaku){ var sp=UI.qz.senPick(q,s.sen,v); if(!sp.done){ UI.render(); return; } ok=sp.ok; } else ok=UI.qz.judgeQ(q,v);
    var g=M().W(c), k0=M().kanban(g), before=M().power(k0), ef0=k0.ef.map(Math.floor);
    var rw=MM.learn.commit(s.qid,ok,ms,c), gain=MM.economy.grant(rw,c);
    KE().advance(c,s,ok,gain); save();
    var mo=gain.mon||{coin:0,xp:0,ups:[],ef:{}}, K=D().kstat;
    sfx(ok?"correct":"wrong",c.mm.combo); UI.play({haptic:ok?"light":"medium"});
    var fl=(ok&&rw.fluke)?'<div class="mm-v2-hint" style="text-align:center">はやすぎて ごほうびなし(読んでから答えよう)</div>':'';
    var pops=(mo.coin?'<span class="mm-pop">🪙 +'+mo.coin+'</span><span class="mm-pop" style="animation-delay:.1s">けいけん +'+mo.xp+'</span>':'');
    /* けいこ値は、数字が1つ上がった瞬間だけ知らせる(ふだんは上の棒がのびる) */
    M().KEYS.forEach(function(key,i){ var d=Math.floor(k0.ef[i])-ef0[i]; if(d>0)pops+='<span class="mm-pop mm-pop-ke" style="animation-delay:.2s">'+K[key].icon+K[key].name+' +'+d+'</span>'; });
    var extra="";
    (mo.ups||[]).forEach(function(u){ extra+='<div class="mm-gbloom">'+UI.v2p.sprite(u.p,36)+' <b>'+esc(u.p.n)+'</b> Lv'+u.p.lv+' に！'+(u.grown?' おとなの姿になった！':'')+' つよさ '+fmt(before)+' → <b>'+fmt(M().power(u.p))+'</b></div>'; });
    extra+=UI.v2p.gifts(mo.gifts);
    if(mo.ticket){ s.tkMsg=mo.rvNeed>0?'きょうの復習を やりきった！':'きょうは 10問 といた！'; extra+='<div class="mm-gbloom mm-v2-gift">🎟 '+s.tkMsg+' <b>配合券を1枚</b> もらった</div>'; }
    s.fb='<div class="mm-stamp '+(ok?'mm-stamp-ok':'')+'">'+(ok?'⭕ 正解！':'❌ ざんねん')+'</div><div class="mm-reward">'+pops+'</div>'+fl+extra
      +UI.qz.explainHtml(q,v,s.sen)+'<button class="mm-cta" onclick="MM.ui.k2Next()">'+(s.over?'けいこ おわり ▶':'つぎの問題 ▶')+'</button>';
    if(extra)sfx("big");
    UI.render();
    if(ok&&!extra&&!s.over&&!MM.exam.isExam(q)){ clearTimeout(UI._gt); UI._gt=setTimeout(function(){ if(UI.v2.quiz&&UI.v2.quiz.fb&&UI.route.screen==="k2")UI.k2Next(); },1300); }
  };
  UI.k2Next=function(){
    clearTimeout(UI._gt); var s=UI.v2.quiz; if(!s)return UI.go("h2");
    if(s.over){ UI.go("k2r"); return; }
    s.fb=null; s.sen={picks:[]}; s.t0=Date.now(); UI.render(); try{ G.scrollTo(0,0); }catch(e){}
  };
  UI.k2End=function(){ clearTimeout(UI._gt); var s=UI.v2.quiz; if(s&&s.n>0){ UI.go("k2r"); return; } UI.v2.quiz=null; UI.go("h2"); };

  /* ---------- けいこの結果 ---------- */
  UI.screens.k2r=function(){
    var c=UI.ctx(), s=UI.v2.quiz; if(!s)return UI.screens.h2();
    var g=M().W(c), k=M().kanban(g), kd=D().keikoById[s.kind], K=D().kstat, pw=M().power(k), same=(k.i===s.pid);
    var h='<div class="mm-wrap">'+UI.resBar2(c)+'<div class="mm-stamp mm-stamp-ok" style="font-size:24px">'+kd.icon+' けいこ おわり！</div>'
      +'<div class="mm-gdetail mm-v2-detail">'+UI.v2p.sprite(k,80)
      +'<div class="mm-v2-hero-name">正解 <b style="font-size:26px">'+s.hits+'</b> / '+s.n+'問</div>'
      +(same?'<div class="mm-pw mm-pw-big">つよさ '+fmt(s.pw0)+' → <b>'+fmt(pw)+'</b>'+(pw>s.pw0?'<i class="mm-pw-up">▲+'+(pw-s.pw0)+'</i>':'')+'</div>':'')
      +(same&&k.lv>s.lv0?'<div class="mm-v2-nat">Lv'+s.lv0+' → <b>Lv'+k.lv+'</b></div>':'')
      +'<div class="mm-reward"><span class="mm-pop">🪙 +'+fmt(s.coin)+'</span><span class="mm-pop">けいけん +'+fmt(s.xp)+'</span></div>';
    var efs=Object.keys(s.ef).filter(function(x){ return s.ef[x]>0; });
    if(efs.length)h+='<div class="mm-v2-nat">けいこ値 '+efs.map(function(x){ return K[x].icon+K[x].name+' <b>+'+(Math.round(s.ef[x]*10)/10)+'</b>'; }).join(' ・ ')+'</div>';
    h+=UI.v2p.lvBar(c,k)+'</div>';
    h+=UI.v2p.gifts(s.gifts);
    if(s.ticket)h+='<div class="mm-gbloom mm-v2-gift">🎟 '+(s.tkMsg||'きょうの復習を やりきった！')+' <b>配合券を1枚</b> もらった</div>'
      +'<button class="mm-cta mm-gfree" onclick="MM.ui.v2.quiz=null;MM.ui.b2Open()">💞 配合へ ▶</button>';
    h+='<button class="mm-cta mm-gwater" onclick="MM.ui.v2.quiz=null;MM.ui.go(\'k2m\')">📚 もう1回 けいこ ▶</button>'
      +'<button class="small-btn mm-gback" onclick="MM.ui.v2.quiz=null;MM.ui.go(\'h2\')">ホームへ</button></div>';
    return h;
  };
})();
