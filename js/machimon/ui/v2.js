"use strict";
/* ============================================================
   machimon/ui/v2.js — 共通の部品・ホーム・なかま・個体の詳細・タマゴ
   ★ホームの真ん中に看板マチモン。その下に つよさ・番付の位置・次の相手まであといくつ。
     ボタンは4つ(けいこ／タマゴ／配合／品評会)、下のタブは4つ(ホーム／なかま／図鑑／きろく)。
   ★どの画面でも、マチモンの横に「つよさ」の数字を1つ。並びはいつも つよさ順。
   ★矢印(▲▼)は「いま この子を看板にしたら、つよさ が いくつ変わるか」。
     看板をゆずると Lv はそのまま・けいこ値は9割を引きつぐので、Lv1の新入りでもそのまま比べられる。
   ★番付の段が上がるほど、ホームの街の景色がにぎやかになる(建物と なかま が増える)。
   ============================================================ */
(function(){
  var G=(typeof window!=="undefined")?window:globalThis;
  var MM=G.MM=G.MM||{}; var UI=MM.ui;
  var M=function(){ return MM.mon; }, D=function(){ return MM.DATA; }, GD=function(){ return MM.DATA.garden; };
  var esc=function(s){ return UI.esc(s); };
  function fmt(n){ return String(Math.round(n||0)).replace(/\B(?=(\d{3})+(?!\d))/g,","); }
  function sfx(n,a){ try{ if(MM.sfx&&MM.sfx[n])MM.sfx[n](a); }catch(e){} }
  function save(){ MM.game.save(); }

  UI.v2ok.h2=1; UI.v2ok.n2=1; UI.v2ok.n2d=1; UI.v2ok.t2=1; UI.v2ok.t2r=1;
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
  /* 才能5つを ★の数字で1行に(ちから・ねばり・いきおい・ひらめき・かしこさ の順) */
  function talentRow(p){ return '<span class="mm-v2-trow">'+D().KSTATS.map(function(s){ var t=p.tl[M().KEYS.indexOf(s.k)]; return '<i class="'+(t>=8?'mm-v2-star-hi':'')+'">'+s.icon+'★'+t+'</i>'; }).join('')+'</span>'; }
  function natLine(p){ var n=M().natOf(p), K=D().kstat; return '性格 <b>'+esc(n.name)+'</b>'+(n.up?' <span class="mm-sub">('+K[n.up].name+'↑ '+K[n.dn].name+'↓)</span>':''); }
  function traits(p){ if(!p.tr.length)return ''; return p.tr.map(function(id){ var t=D().traitById[id]; return '<span class="mm-gtr mm-v2-tr">'+t.icon+esc(t.name)+'</span>'; }).join(''); }
  var CATN={a:"💪 能力",b:"🏆 品評会",k:"📚 けいこ",h:"💞 配合"};
  /* 特性を「名前＋ひとこと」で。そろった組み合わせ、あと1つでそろう組み合わせも出す(o.hint) */
  function traitBox(p,o){
    o=o||{}; var h='', C=D().COMBOS;
    p.tr.forEach(function(id){ var t=D().traitById[id]; h+='<div class="mm-v2-trl"><span class="mm-v2-tri">'+t.icon+'</span><span class="mm-v2-trb"><b>'+esc(t.name)+'</b><i>'+esc(t.desc)+'</i></span><span class="mm-v2-trc">'+CATN[t.cat]+'</span></div>'; });
    M().combosOf(p.tr).forEach(function(cb){ h+='<div class="mm-v2-combo">✨ 組み合わせ「<b>'+esc(cb.name)+'</b>」 '+esc(cb.desc)+'</div>'; });
    if(o.hint&&p.tr.length===1){ C.forEach(function(cb){ var other=cb.a===p.tr[0]?cb.b:(cb.b===p.tr[0]?cb.a:""); if(!other)return; var t=D().traitById[other];
      h+='<div class="mm-v2-hint mm-v2-cohint">🔗 「'+t.icon+esc(t.name)+'」も そろうと「<b>'+esc(cb.name)+'</b>」('+esc(cb.desc)+')</div>'; }); }
    if(!h&&!o.hint)return '';
    if(o.hint&&p.tr.length<2)h+='<div class="mm-v2-hint mm-v2-cohint">特性は2つまで。💎ひらめきの石 か 💞配合 で ふやせる</div>';
    return '<div class="mm-v2-trbox"><div class="mm-v2-trh">特性 '+p.tr.length+'/2'+(o.hint?' <button class="mm-v2-link" onclick="MM.ui.go(\'z2\',{tab:\'tr\'})">特性の一覧 ▶</button>':'')+'</div>'+h+'</div>';
  }
  function lvBar(c,p,cap){ cap=cap||M().lvCap(c,p); var full=p.lv>=cap; return '<span class="mm-v2-lv"><b>Lv'+p.lv+'</b><span class="mm-bar"><i style="width:'+(full?100:Math.min(100,Math.round(p.xp/M().need(p.lv)*100)))+'%"></i></span><i>'+(full?(cap>=D().LV_MAX?'さいこう':'いまの上限'):'上限 '+cap)+'</i></span>'; }
  function item(id,n){ var t=D().itemById[id]; return '<span class="mm-v2-item">'+t.icon+' '+esc(t.name)+(n>1?' ×'+n:'')+'</span>'; }
  /* もらった ごほうび(育成どうぐ・配合券)の1行 */
  function gifts(list){
    if(!list||!list.length)return '';
    return '<div class="mm-gbloom mm-v2-gift">🎁 ごほうび '+list.map(function(x){ return x.bt?'<span class="mm-v2-item">🎟 配合券'+(x.n>1?' ×'+x.n:'')+'</span>':item(x.item,x.n); }).join(' ')+'</div>';
  }
  UI.v2p={ sprite:sprite, rarB:rarB, pow:pow, arrow:arrow, talentLine:talentLine, talentRow:talentRow, natLine:natLine, traits:traits, traitBox:traitBox, lvBar:lvBar, item:item, gifts:gifts, fmt:fmt };
  UI.resBar2=function(c){
    var g=M().W(c);
    return '<div class="mm-logo">MACHIMON<span>社労士</span></div><div class="mm-res mm-v2-res"><span class="mm-chip">🪙 コイン <b>'+fmt(c.mm.res.g)+'</b></span><span class="mm-chip">🧩 かけら <b>'+fmt(g.shard)+'</b></span><span class="mm-chip">🎟 配合券 <b>'+g.bt+'</b></span></div>';
  };
  UI.tabs2=function(active){
    var T=[["h2","🏠","ホーム"],["n2","🐣","なかま"],["z2","📖","図鑑"],["r2","📊","きろく"]];
    var h='<nav class="mm-tabs mm-v2-tabs" aria-label="メニュー">';
    T.forEach(function(t){ if(!UI.screens[t[0]])return; h+='<button type="button" class="'+(t[0]===active?"mm-act":"")+'" onclick="MM.ui.go(\''+t[0]+'\')"><span aria-hidden="true">'+t[1]+'</span>'+t[2]+'</button>'; });
    return h+'</nav>';
  };
  function back(to,label){ return '<button class="small-btn mm-gback" onclick="MM.ui.go(\''+(to||"h2")+'\')">'+(label||"もどる")+'</button>'; }
  UI.back2=back;

  /* ---------- 街の景色(番付の段 0〜7 で にぎやかになる) ---------- */
  var TOWN=[
    {sky:"mm-v2-sky0",b:["⛺"],n:0},
    {sky:"mm-v2-sky0",b:["⛺","🏠"],n:1},
    {sky:"mm-sky-day",b:["🏠","🏪","🌳"],n:2},
    {sky:"mm-sky-day",b:["🏠","🏪","🏫","🌳"],n:3},
    {sky:"mm-sky-day",b:["🏠","🏪","🏫","🏢","🏮"],n:4},
    {sky:"mm-sky-day",b:["🏠","🏪","🏫","🏢","🏬","🎏"],n:5},
    {sky:"mm-sky-eve",b:["🏠","🏪","🏫","🏢","🏬","🏯","🎏"],n:6},
    {sky:"mm-sky-eve",b:["🏠","🏪","🏫","🏢","🏬","🏯","🎪","🎏"],n:6,fw:1}
  ];
  UI.scene2=function(c,g,k){
    var lv=MM.banzuke?MM.banzuke.townLevel(c):0, T=TOWN[Math.max(0,Math.min(TOWN.length-1,lv))], n=T.b.length, i;
    var h='<button class="mm-scene mm-v2-scene '+T.sky+'" onclick="MM.ui.go(\'n2d\',{id:\''+k.i+'\'})" aria-label="看板マチモンを見る">';
    h+='<span class="mm-sun">'+(T.fw?'🎆':(lv>=6?'🌇':(lv>=2?'☀️':'☁️')))+'</span>';
    if(T.fw)h+='<span class="mm-v2-fw" style="left:16%">🎇</span><span class="mm-v2-fw" style="left:70%;animation-delay:-1.2s">🎆</span>';
    h+='<span class="mm-cloud" style="left:10%;top:8px">☁️</span>';
    for(i=0;i<n;i++){ var x=n>1?(3+i*(84/(n-1))):6; h+='<span class="mm-bld mm-v2-bld" style="left:'+Math.round(x)+'%">'+T.b[i]+'</span>'; }
    /* なかまが街を歩く(段が上がるほど増える) */
    var others=M().sorted(g).filter(function(p){ return p!==k; }).slice(0,T.n);
    others.forEach(function(p,j){ h+='<span class="mm-walker" style="left:'+(4+(j*29)%62)+'%;--mm-dur:'+(9+j*2)+'s;animation-delay:-'+(j*2.7)+'s"><span class="mm-hop" style="animation-delay:-'+(j*0.31)+'s">'+MM.px(M().spId(p),26)+'</span></span>'; });
    h+='<span class="mm-townname">'+esc(c.mm.name||"わたしの街")+'</span>';
    h+='<span class="mm-v2-noren">'+(lv>=7?'🏮 のれん':'👑 看板')+'</span>';
    h+='<span class="mm-v2-kan mm-hop">'+sprite(k,104)+'</span>';
    return h+'<span class="mm-ground"></span></button>';
  };

  /* ---------- ホーム ---------- */
  UI.screens.h2=function(){
    var c=UI.ctx(), g=M().W(c), k=M().kanban(g), BZ=MM.banzuke, KE=MM.keiko;
    var h='<div class="mm-wrap mm-v2-home">'+UI.resBar2(c)+UI.scene2(c,g,k);
    h+='<button class="mm-v2-hero" onclick="MM.ui.go(\'n2d\',{id:\''+k.i+'\'})">'
      +'<span class="mm-v2-hero-name">'+esc(k.n)+' '+rarB(k)+'</span>'
      +'<span class="mm-pw mm-pw-big">つよさ <b>'+fmt(M().power(k))+'</b></span>'
      +lvBar(c,k)+'</button>';
    /* 1.x から来た人へ、1回だけ(とじるまで) */
    if(g.mig&&!g.mn)h+='<div class="mm-gbloom mm-v2-mig"><b>あたらしい遊びに なりました</b><br>なかま <b>'+g.mons.length+'体</b>は 引っ越しずみ。学習の記録は そのまま。<br>いちばん強い子が <b>看板</b>。けいこで育てて、番付の <b>横綱</b>へ。<button class="small-btn" onclick="MM.ui.h2MigOk()">わかった</button></div>';
    if(UI.storyHome)h+=UI.storyHome(c);
    if(UI.bzHome)h+=UI.bzHome(c);
    /* けいこ: きょうの配合券まで あといくつ */
    var t=KE.ticketState(c), sub;
    if(t.got)sub='きょうの配合券は もらった ✔';
    else if(t.done<t.need)sub='きょうの復習 あと<b>'+(t.need-t.done)+'</b>問で 🎟配合券';
    else sub='あと<b>'+Math.max(1,t.min-t.ans)+'</b>問とくと 🎟配合券';
    h+='<button class="mm-cta mm-gwater mm-v2-keiko" onclick="MM.ui.go(\'k2m\')">📚 けいこ ▶<span class="mm-sub">'+sub+'</span></button>';
    var st=BZ?BZ.state(c):null;
    h+='<div class="mm-gmenu mm-v2-menu">'
      +'<button onclick="MM.ui.go(\'t2\')"><span>🥚</span>タマゴ'+(M().freeReady(c)?'<i class="mm-gdot">無料</i>':'')+'</button>'
      +'<button onclick="MM.ui.b2Open()"><span>💞</span>配合'+(g.bt>0?'<i class="mm-gdot">券'+g.bt+'</i>':'')+'</button>'
      +'<button onclick="MM.ui.go(\'bz\')"><span>🏆</span>品評会'+(st&&st.left>0?'<i class="mm-gdot">あと'+st.left+'番</i>':'')+'</button></div>';
    return h+'</div>'+UI.tabs2("h2");
  };

  UI.h2MigOk=function(){ var c=UI.ctx(); M().W(c).mn=1; save(); UI.render(); };

  /* ---------- なかまの一覧(つよさ順) ---------- */
  UI.screens.n2=function(){
    var c=UI.ctx(), g=M().W(c), list=g.mons.slice().sort(function(a,b){ return M().pot(g,b).v-M().pot(g,a).v||(a.i<b.i?-1:1); });
    var h='<div class="mm-wrap">'+UI.resBar2(c)+'<div class="mm-h">🐣 なかま <span class="mm-sub">'+g.mons.length+'/'+D().RATE2.cap+'体 ・ つよい順</span></div>';
    h+='<div class="mm-v2-hint">▲▼ = いま看板にしたら つよさ が いくつ変わるか</div>';
    h+='<button class="small-btn mm-v2-shopbtn" onclick="MM.ui.go(\'z2\',{tab:\'kk\'})">🧩 かけら交換 <span class="mm-sub">手放すと かけら になる ・ いま <b>'+fmt(g.shard)+'</b></span></button>';
    list.forEach(function(p){
      var tag=g.kan===p.i?'<i class="mm-v2-tag mm-v2-tag-k">看板</i>':'';
      h+='<button class="mm-v2-row" style="border-left-color:'+M().rarInfo(p).color+'" onclick="MM.ui.go(\'n2d\',{id:\''+p.i+'\'})">'+sprite(p,44)
        +'<span class="mm-v2-row-b"><span class="mm-v2-row-n"><b>'+esc(p.n)+'</b> '+rarB(p)+tag+'</span><span class="mm-v2-row-s">才能 <b>'+M().talent(p)+'</b>/50'+(p.tr.length?' ・ '+p.tr.map(function(id){ return D().traitById[id].icon; }).join(''):'')+(p.sh?' ✨':'')+'</span></span>'
        +'<span class="mm-v2-row-p"><b>'+fmt(M().pot(g,p).v)+'</b>'+arrow(g,p)+'</span></button>';
    });
    return h+'</div>'+UI.tabs2("n2");
  };

  /* ---------- 個体の詳細: 絵・つよさ・番付での見込み・才能★・能力5本(看板の線つき)・特性 ---------- */
  UI.screens.n2d=function(pr){
    var c=UI.ctx(), g=M().W(c), p=M().byId(g,pr&&pr.id); if(!p)return UI.screens.n2();
    var k=M().kanban(g), kd=M().kindOf(p), fam=GD().families[kd.f], isK=(k===p), po=M().pot(g,p), BZ=MM.banzuke;
    /* 看板でない子は「看板にしたとき」の姿で見せる(Lvとけいこ値を引きついだ数字) */
    var hv=isK?p:(function(){ var x=M().handover(p,k); return {k:p.k,lv:x.lv,xp:x.xp,tl:p.tl,na:p.na,tr:p.tr,ef:x.ef,i:p.i,n:p.n}; })();
    var st=M().stats(hv), ks=M().stats(k), mx=1; D().KSTATS.forEach(function(s){ mx=Math.max(mx,st[s.k],ks[s.k]); });
    var h='<div class="mm-wrap">'+UI.resBar2(c)
      +'<div class="mm-gdetail mm-v2-detail" style="border-color:'+M().rarInfo(p).color+'">'+sprite(p,96)
      +'<div class="mm-v2-hero-name">'+esc(p.n)+' '+rarB(p)+'</div>'
      +'<div class="mm-sub mm-v2-kind">'+fam.icon+esc(fam.name)+(p.n!==kd.name?' ・ '+esc(kd.name):'')+(p.first?' ・ 初代':'')+(p.sh?' ・ ✨色ちがい':'')+'</div>';
    if(isK)h+='<div><span class="mm-pw mm-pw-big">つよさ <b>'+fmt(po.v)+'</b><i class="mm-pw-top">👑看板</i></span></div>'+lvBar(c,p);
    else h+='<div><span class="mm-pw mm-pw-big">看板にすると <b>'+fmt(po.v)+'</b></span></div>'
      +'<div class="mm-v2-verdict '+(po.d>0?'mm-v2-up':'mm-v2-dn')+'">'+(po.d>0?'▲ いまの看板より +'+fmt(po.d):(po.d<0?'▼ いまの看板のほうが つよい(−'+fmt(-po.d)+')':'＝ いまの看板と同じ'))+'</div>';
    if(BZ){ var bs=BZ.state(c), fc=BZ.forecast(c,bs.foe,hv), v=UI.bzVerdict(fc); h+='<div class="mm-v2-fc '+v[0]+'">つぎの相手('+esc(bs.foe.name)+')に: '+v[1]+'</div>'; }
    h+='</div>';
    h+='<div class="mm-q mm-v2-stats"><div class="mm-v2-talrow">'+talentLine(p)+'</div>';
    D().KSTATS.forEach(function(s){ var i=M().KEYS.indexOf(s.k), t=p.tl[i], e=Math.floor(hv.ef[i]||0);
      h+='<div class="mm-v2-stat"><span>'+s.icon+' '+s.name+'</span><span class="mm-gstat-bar"><i style="width:'+Math.round(st[s.k]/mx*100)+'%"></i>'+(isK?'':'<b class="mm-v2-kline" style="left:'+Math.min(99,Math.round(ks[s.k]/mx*100))+'%"></b>')+'</span><b>'+st[s.k]+'</b><i class="mm-v2-star'+(t>=8?' mm-v2-star-hi':'')+'">★'+t+'</i></div>'; });
    h+='<div class="mm-sub mm-v2-kind">★=才能(0〜10。生まれつき)'+(isK?'':' ／ たて線=いまの看板')+'</div>';
    if(isK){ h+='<div class="mm-v2-efrow">けいこ値 '+D().KSTATS.map(function(s){ return s.icon+'<b>'+Math.floor(p.ef[M().KEYS.indexOf(s.k)]||0)+'</b>'; }).join(' ')+' <span class="mm-sub">(1つ100・合計'+D().EF_TOTAL+'まで)</span></div>'; }
    h+='<div class="mm-v2-nat">'+natLine(p)+'</div></div>'+traitBox(p,{hint:1});
    h+='<div class="mm-gbtns mm-gbtns-col">';
    if(!isK)h+='<button class="mm-cta-s mm-v2-kanbtn" onclick="MM.ui.n2Kan(\''+p.i+'\')">👑 この子を看板にする<span class="mm-sub">つよさ '+fmt(M().power(k))+' → <b>'+fmt(po.v)+'</b> ・ Lvはそのまま、けいこ値は9割ひきつぐ</span></button>';
    /* なかまに使う どうぐ(持っているものだけ) */
    var its=D().ITEMS.filter(function(t){ return t.use==="m"&&g.items[t.id]>0; });
    if(its.length){ h+='<div class="mm-v2-usebox"><div class="mm-sub">🎒 この子に どうぐを使う</div>';
      its.forEach(function(t){ h+='<button class="small-btn mm-v2-use" onclick="MM.ui.n2Use(\''+p.i+'\',\''+t.id+'\')"><b>'+t.icon+' '+esc(t.name)+' ×'+g.items[t.id]+'</b><span class="mm-sub">'+esc(t.desc)+'</span></button>'; });
      h+='</div>'; }
    if(!isK&&g.mons.length>1)h+='<button class="small-btn" onclick="MM.ui.n2Rel(\''+p.i+'\')">手放す(🧩かけら +'+M().shardOf(p)+')</button>';
    return h+'</div>'+back("n2","なかまへ もどる")+'</div>';
  };
  UI.n2Kan=function(id){ var c=UI.ctx(), r=M().setKan(c,id); if(r){ save(); sfx("levelup"); UI.toast("👑 看板がかわった！ つよさ "+fmt(r.from)+" → "+fmt(r.to)); } UI.go("n2d",{id:id}); };
  UI.n2Use=function(id,it){
    var c=UI.ctx(), g=M().W(c), p=M().byId(g,id), t=D().itemById[it]; if(!p||!t)return;
    try{ if(G.confirm&&!G.confirm(p.n+" に "+t.name+" を使いますか？\n"+t.desc))return; }catch(e){}
    var r=MM.breed.useItem(c,it,id); save(); if(r.err){ UI.toast(r.err); return; }
    var K=D().kstat, msg=t.icon+" "+t.name+" を使った";
    if(it==="mi")msg=t.icon+" "+K[r.k].name+"の才能 ★"+r.from+" → ★"+r.to;
    else if(it==="ishi")msg=t.icon+" 特性「"+D().traitById[r.trait].name+"」が ついた"+(r.combo?"！ 組み合わせ「"+r.combo.name+"」":"");
    else if(it==="happa")msg=t.icon+" 性格が「"+D().natureById[r.to].name+"」に なった";
    else if(it==="wasure")msg=t.icon+" "+K[r.k].name+"の けいこ値を 0に もどした";
    sfx("levelup"); UI.toast(msg); UI.go("n2d",{id:id});
  };
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
    return h+back("h2","ホームへ")+'</div>'+UI.tabs2("");
  };
  UI.t2Pull=function(free){
    var c=UI.ctx(), r=M().pull(c,!!free); save();
    if(r.err){ UI.toast(r.err); return; }
    UI.v2.last=r; sfx("roll",6); UI.go("t2r");
  };
  /* 生まれた子の1枚(タマゴ・配合の結果で共通) */
  UI.bornCard=function(c,g,p,o){
    o=o||{}; var kd=M().kindOf(p), rk=kd.rar, d=M().pot(g,p), fam=GD().families[kd.f];
    return '<div class="mm-gdetail mm-v2-detail mm-gres-r'+rk+'" style="border-color:'+M().rarInfo(p).color+'">'
      +(o.only?'<div class="mm-v2-new">配合でしか生まれない種類！</div>':(o.isNew?'<div class="mm-v2-new">はじめての種類！</div>':''))
      +'<span class="mm-gi'+(p.sh?' mm-gi-shiny':'')+'">'+MM.px(p.k,96)+'</span>'
      +'<div class="mm-v2-hero-name">'+esc(kd.name)+' '+rarB(p)+'</div>'
      +'<div class="mm-sub mm-v2-kind">'+fam.icon+esc(fam.name)+(p.sh?' ・ ✨色ちがい':'')+(o.pity?' ・ 確定のタマゴ':'')+'</div>'
      +'<div class="mm-v2-talrow">'+talentLine(p)+'</div>'+talentRow(p)
      +'<div class="mm-v2-verdict '+(d.d>0?'mm-v2-up':'mm-v2-dn')+'">'+(d.d>0?'▲ 看板にすると つよさ +'+fmt(d.d)+'！':(d.d<0?'▼ いまの看板のほうが つよい(−'+fmt(-d.d)+')':'＝ いまの看板と同じつよさ'))+'</div>'
      +'<div class="mm-v2-nat">'+natLine(p)+'</div>'+traitBox(p)+'</div>'
      +(d.d>0?'<button class="mm-cta mm-v2-kanbtn" onclick="MM.ui.n2Kan(\''+p.i+'\')">👑 この子を看板にする<span class="mm-sub">つよさ '+fmt(M().power(M().kanban(g)))+' → <b>'+fmt(d.v)+'</b></span></button>':'');
  };
  UI.screens.t2r=function(){
    var c=UI.ctx(), g=M().W(c), L=UI.v2.last, p=L&&M().byId(g,L.mon.i); if(!p)return UI.screens.t2();
    var rk=M().kindOf(p).rar, R=D().RATE2;
    var h='<div class="mm-wrap">'+UI.resBar2(c)+'<div class="mm-h" style="justify-content:center">🐣 タマゴが われた！</div>'+UI.bornCard(c,g,p,L);
    h+='<div class="mm-gbtns mm-gbtns-col"><button class="mm-cta-s" '+(g.mons.length<R.cap&&c.mm.res.g>=R.cost?'':'disabled')+' onclick="MM.ui.t2Pull(0)">もう1つ 🪙'+R.cost+'</button>'
      +'<button class="small-btn" onclick="MM.ui.go(\'n2d\',{id:\''+p.i+'\'})">くわしく見る</button></div>'+back("h2","ホームへ")+'</div>';
    if(rk>=3)setTimeout(function(){ sfx("fanfare"); },400); else if(rk>=2)setTimeout(function(){ sfx("levelup"); },400);
    return h;
  };
})();
