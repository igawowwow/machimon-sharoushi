"use strict";
/* ============================================================
   machimon/ui/zukan2.js — 図鑑(種類・色ちがい・特性)と かけら交換
   ★種類105 × はんこ3つ(見つけた／おとなにした／才能40以上)。種類をタップすると、はんこの条件と生まれ方が出る。
   ★色ちがいは別のページ(見つけた種類だけ色ちがいの絵になる)。
   ★特性36と組み合わせ10は、最初から ぜんぶ見せる(何をねらえばいいかが分かる)。
   ★かけら交換: 好きなSSR 300・好きなUR 1,000・育成どうぐ 各30〜100。かけらは「手放す」からしか増えない。
   ============================================================ */
(function(){
  var G=(typeof window!=="undefined")?window:globalThis;
  var MM=G.MM=G.MM||{}; var UI=MM.ui;
  var M=function(){ return MM.mon; }, D=function(){ return MM.DATA; }, GD=function(){ return MM.DATA.garden; }, BR=function(){ return MM.breed; };
  var esc=function(s){ return UI.esc(s); };
  function fmt(n){ return UI.v2p.fmt(n); }
  function sfx(n,a){ try{ if(MM.sfx&&MM.sfx[n])MM.sfx[n](a); }catch(e){} }
  function save(){ MM.game.save(); }
  UI.v2ok.z2=1; UI.v2ok.z2d=1; UI.v2ok.kkr=1;

  var TABS=[["k","種類"],["s","✨色ちがい"],["tr","特性"],["kk","🧩交換"]];
  function seg(act){ return '<div class="mm-v2-seg">'+TABS.map(function(t){ return '<button class="'+(t[0]===act?'mm-act':'')+'" onclick="MM.ui.go(\'z2\',{tab:\''+t[0]+'\'})">'+t[1]+'</button>'; }).join('')+'</div>'; }
  function stamps(b){ return '<span class="mm-v2-st">'+[1,2,4].map(function(x){ return '<i class="'+((b&x)?'mm-on':'')+'">●</i>'; }).join('')+'</span>'; }
  function rar(k){ var r=GD().RARITY[k.rar]; return '<span class="mm-grar" style="background:'+r.color+'">'+r.name+'</span>'; }
  var TYPE={a:"バランス",o:"💪 ちから",j:"🛡 ねばり",h:"🔥 いきおい",s:"💡 ひらめき",m:"📘 かしこさ"};

  UI.screens.z2=function(pr){
    var c=UI.ctx(), g=M().W(c), tab=(pr&&pr.tab)||"k";
    var h='<div class="mm-wrap">'+UI.resBar2(c)+'<div class="mm-h">📖 図鑑</div>'+seg(tab);
    if(tab==="s")h+=shiny(c,g); else if(tab==="tr")h+=traitList(c,g); else if(tab==="kk")h+=shop(c,g); else h+=kinds(c,g);
    return h+'</div>'+UI.tabs2("z2");
  };

  /* ---------- 種類 ---------- */
  function kinds(c,g){
    var K=D().kinds, found=0, st=0;
    K.forEach(function(k){ var b=g.dex[k.id]||0; if(b&1)found++; [1,2,4].forEach(function(x){ if(b&x)st++; }); });
    var h='<div class="mm-v2-zsum">見つけた <b>'+found+'</b>/'+K.length+' ・ はんこ <b>'+st+'</b>/'+(K.length*3)+'</div>'+UI.bar(found,K.length)
      +'<div class="mm-v2-hint">はんこ ●●● = 見つけた ／ おとなにした ／ 才能40以上を出した。<b>タップで くわしく</b></div>';
    function cell(k){ var b=g.dex[k.id]||0, has=!!(b&1);
      return '<button class="mm-dex mm-v2-dex'+(has?'':' mm-unk')+'" onclick="MM.ui.go(\'z2d\',{id:\''+k.id+'\'})">'+MM.px(k.id,40)+'<b>'+(has?esc(k.name):'？？？')+'</b>'+rar(k)+stamps(b)+'</button>'; }
    GD().families.forEach(function(f){
      var list=K.filter(function(k){ return !k.only&&k.f===f.id; }), n=list.filter(function(k){ return (g.dex[k.id]||0)&1; }).length;
      h+='<div class="mm-dex-line"><div class="mm-goal-row"><b>'+f.icon+' '+esc(f.name)+'</b> <span class="mm-sub">'+esc((G.SUBJECTS||[])[f.sub]||"")+' ・ '+n+'/'+list.length+'</span></div><div class="mm-v2-dexrow">'+list.map(cell).join('')+'</div></div>';
    });
    var on=K.filter(function(k){ return k.only; }), n2=on.filter(function(k){ return (g.dex[k.id]||0)&1; }).length;
    h+='<div class="mm-dex-line"><div class="mm-goal-row"><b>💞 配合でしか生まれない種類</b> <span class="mm-sub">'+n2+'/'+on.length+'</span></div><div class="mm-v2-hint">2つの族を かけ合わせると、まれに生まれる。タップで 組み合わせが分かる。</div><div class="mm-v2-dexrow">'+on.map(cell).join('')+'</div></div>';
    return h;
  }
  /* 種類の1ページ: はんこ3つの条件・得意・生まれ方 */
  UI.screens.z2d=function(pr){
    var c=UI.ctx(), g=M().W(c), k=D().kindById[pr&&pr.id]; if(!k)return UI.screens.z2({});
    var b=g.dex[k.id]||0, has=!!(b&1), fam=GD().families[k.f], R=GD().RARITY[k.rar], mine=g.mons.filter(function(p){ return p.k===k.id; }), best=0;
    mine.forEach(function(p){ best=Math.max(best,M().talent(p)); });
    var h='<div class="mm-wrap">'+UI.resBar2(c)
      +'<div class="mm-gdetail mm-v2-detail" style="border-color:'+R.color+'"><span class="mm-gi'+(has?'':' mm-v2-sil')+'">'+MM.px(k.id,96)+'</span>'
      +'<div class="mm-v2-hero-name">'+(has?esc(k.name):'？？？')+' '+rar(k)+'</div>'
      +'<div class="mm-sub mm-v2-kind">'+fam.icon+esc(fam.name)+' ・ '+esc((G.SUBJECTS||[])[fam.sub]||"")+'</div>'
      +'<div class="mm-v2-nat">とくい <b>'+TYPE[k.type]+'</b></div>'
      +(mine.length?'<div class="mm-sub mm-v2-kind">いま '+mine.length+'体 ・ いちばん高い才能 '+best+'/50</div>':'')+'</div>';
    /* はんこ3つ */
    var N=D().ADULT_NEED, kc=0; mine.forEach(function(p){ if(g.kan===p.i)kc=p.kc||0; });
    var rows=[[1,"見つけた",k.only?"配合で 生まれる":"タマゴから 生まれる"],[2,"おとなにした","看板にして 正解"+N+"問(Lv"+D().LV_ADULT+"以上で)"+(kc&&!(b&2)?" いま "+kc+"/"+N:"")],[4,"才能40以上を出した","才能の合計が 40/50 以上の子を 手に入れる"]];
    h+='<div class="mm-q mm-v2-stbox">';
    rows.forEach(function(r){ var on=!!(b&r[0]); h+='<div class="mm-v2-strow'+(on?' mm-on':'')+'"><span class="mm-v2-stmark">'+(on?'●':'○')+'</span><span><b>'+r[1]+'</b><i>'+esc(r[2])+'</i></span><span class="mm-v2-stok">'+(on?'✔':'')+'</span></div>'; });
    h+='</div>';
    /* 生まれ方 */
    h+='<div class="mm-q mm-v2-note">';
    if(k.only){ var fa=GD().families[k.only.fams[0]], fb=GD().families[k.only.fams[1]], need=GD().RARITY[k.only.need].name;
      h+='<b>💞 生まれ方</b><br>'+fa.icon+esc(fa.name)+' × '+fb.icon+esc(fb.name)+'<br>おや2体とも <b>'+need+'以上</b> のとき、'+Math.round(D().BREED.only[k.rar]*100)+'% で生まれる。'; }
    else { var rt=D().RATE2.rate[k.rar], n=D().kindsByRar[k.rar].length;
      h+='<b>🥚 生まれ方</b><br>タマゴ('+R.name+' は '+(Math.round(rt*1000)/10)+'%。その中の '+n+'種類の どれか)。<br>配合では、おや の種類を 子が継ぐ。'; }
    h+='</div>';
    if(!k.only&&k.rar>=3){ var cost=k.rar===4?D().SHARD_COST.ur:D().SHARD_COST.ssr, ok=g.shard>=cost;
      h+='<button class="mm-cta-s mm-v2-kanbtn" '+(ok?'':'disabled')+' onclick="MM.ui.kkKind(\''+k.id+'\')">🧩 かけら '+fmt(cost)+' で むかえる<span class="mm-sub">'+(ok?'いま '+fmt(g.shard)+' もっている':'あと '+fmt(cost-g.shard)+' たりない(いま '+fmt(g.shard)+')')+'</span></button>'; }
    return h+UI.back2("z2","図鑑へ もどる")+'</div>';
  };

  /* ---------- 色ちがい ---------- */
  function shiny(c,g){
    var K=D().kinds, n=0; K.forEach(function(k){ if(g.sdex[k.id])n++; });
    var h='<div class="mm-v2-zsum">色ちがい <b>'+n+'</b>/'+K.length+'</div>'+UI.bar(n,K.length)
      +'<div class="mm-v2-hint">タマゴから 1/'+Math.round(1/D().RATE2.shiny)+'。色ちがいの おや から配合すると 1/'+Math.round(1/D().RATE2.shinyBred)+'。つよさは同じ。</div><div class="mm-v2-dexrow mm-v2-shrow">';
    K.forEach(function(k){ var has=!!g.sdex[k.id];
      h+='<div class="mm-dex mm-v2-dex'+(has?'':' mm-unk')+'"><span class="'+(has?'mm-gi mm-gi-shiny':'')+'">'+MM.px(k.id,40)+'</span><b>'+(has?esc(k.name):'？？？')+'</b></div>'; });
    return h+'</div>';
  }

  /* ---------- 特性36と組み合わせ10 ---------- */
  function traitList(c,g){
    var have={}; g.mons.forEach(function(p){ p.tr.forEach(function(t){ have[t]=1; }); });
    var n=Object.keys(have).length;
    var h='<div class="mm-v2-zsum">特性 <b>'+D().TRAITS.length+'</b>種 ・ いま もっている <b>'+n+'</b>種</div>'
      +'<div class="mm-v2-hint">1体に 2つまで。生まれつき か、💎ひらめきの石・💞配合 で つく。</div>';
    D().TRAIT_CATS.forEach(function(ct){
      var L=D().TRAITS.filter(function(t){ return t.cat===ct.id; });
      h+='<div class="mm-h" style="font-size:14px">'+ct.icon+' '+ct.name+' <span class="mm-sub">'+L.length+'種</span></div><div class="mm-q mm-v2-trlist">';
      L.forEach(function(t){ h+='<div class="mm-v2-trl'+(have[t.id]?' mm-on':'')+'"><span class="mm-v2-tri">'+t.icon+'</span><span class="mm-v2-trb"><b>'+esc(t.name)+'</b><i>'+esc(t.desc)+'</i></span><span class="mm-v2-trc">'+(have[t.id]?'✔ いる':'')+'</span></div>'; });
      h+='</div>';
    });
    h+='<div class="mm-h" style="font-size:14px">✨ 組み合わせ <span class="mm-sub">2つ そろうと さらに強い ・ '+D().COMBOS.length+'組</span></div><div class="mm-q mm-v2-trlist">';
    D().COMBOS.forEach(function(cb){ var a=D().traitById[cb.a], b=D().traitById[cb.b], on=g.mons.some(function(p){ return p.tr.indexOf(cb.a)>=0&&p.tr.indexOf(cb.b)>=0; });
      h+='<div class="mm-v2-trl'+(on?' mm-on':'')+'"><span class="mm-v2-trb"><b>'+esc(cb.name)+'</b><i>'+a.icon+esc(a.name)+' ＋ '+b.icon+esc(b.name)+'</i><i>'+esc(cb.desc)+'</i></span><span class="mm-v2-trc">'+(on?'✔ そろった':'')+'</span></div>'; });
    return h+'</div>';
  }

  /* ---------- かけら交換 ---------- */
  function shop(c,g){
    var S=BR().shop(c);
    var h='<div class="mm-v2-zsum">🧩 かけら <b>'+fmt(S.shard)+'</b></div>'
      +'<div class="mm-v2-hint">かけらは、なかまを <b>手放す</b>と もらえる(N1・R3・SR10・SSR40・UR150)。お金では買えない。</div>';
    if(S.full)h+='<div class="mm-q mm-v2-note">なかまがいっぱい。だれかを手放すと、むかえられる。</div>';
    function krow(x){ var k=x.kind, ok=S.shard>=x.cost&&!S.full;
      return '<button class="mm-v2-row mm-v2-kkrow" style="border-left-color:'+GD().RARITY[k.rar].color+'" '+(ok?'':'disabled')+' onclick="MM.ui.kkKind(\''+k.id+'\')">'+MM.px(k.id,40)
        +'<span class="mm-v2-row-b"><span class="mm-v2-row-n"><b>'+esc(k.name)+'</b> '+rar(k)+'</span><span class="mm-v2-row-s">'+GD().families[k.f].icon+esc(GD().families[k.f].name)+' ・ とくい '+TYPE[k.type]+(x.has?'':' ・ まだ見つけていない')+'</span></span>'
        +'<span class="mm-v2-row-p"><b>🧩'+fmt(x.cost)+'</b></span></button>'; }
    h+='<div class="mm-h" style="font-size:14px">👑 好きなUR を むかえる <span class="mm-sub">🧩'+fmt(D().SHARD_COST.ur)+'</span></div>'+S.ur.map(krow).join('');
    h+='<div class="mm-h" style="font-size:14px">🌟 好きなSSR を むかえる <span class="mm-sub">🧩'+fmt(D().SHARD_COST.ssr)+'</span></div>'+S.ssr.map(krow).join('');
    h+='<div class="mm-h" style="font-size:14px">🎒 育成どうぐ</div>';
    S.items.forEach(function(x){ var t=x.item, ok=S.shard>=x.cost;
      h+='<button class="mm-v2-row mm-v2-kkrow" '+(ok?'':'disabled')+' onclick="MM.ui.kkItem(\''+t.id+'\')"><span class="mm-v2-bagi">'+t.icon+'</span>'
        +'<span class="mm-v2-row-b"><span class="mm-v2-row-n"><b>'+esc(t.name)+'</b> <i class="mm-v2-tag">×'+x.n+'</i></span><span class="mm-v2-row-s">'+esc(t.desc)+'</span></span>'
        +'<span class="mm-v2-row-p"><b>🧩'+x.cost+'</b></span></button>'; });
    return h;
  }
  UI.kkKind=function(id){
    var c=UI.ctx(), k=D().kindById[id]; if(!k)return;
    var cost=k.rar===4?D().SHARD_COST.ur:D().SHARD_COST.ssr;
    try{ if(G.confirm&&!G.confirm("かけら "+cost+" で "+k.name+" を むかえますか？\n(才能は 生まれてみるまで分からない)"))return; }catch(e){}
    var r=BR().buyKind(c,id); save(); if(r.err){ UI.toast(r.err); return; }
    UI.kkLast=r; sfx("roll",6); UI.go("kkr");
  };
  UI.kkItem=function(id){
    var c=UI.ctx(), t=D().itemById[id]; if(!t)return;
    var r=BR().buyItem(c,id); save(); if(r.err){ UI.toast(r.err); return; }
    sfx("coin"); UI.toast(t.icon+" "+t.name+" を もらった(🧩−"+r.cost+")"); UI.render();
  };
  UI.screens.kkr=function(){
    var c=UI.ctx(), g=M().W(c), L=UI.kkLast, p=L&&M().byId(g,L.mon.i); if(!p)return UI.screens.z2({tab:"kk"});
    var h='<div class="mm-wrap">'+UI.resBar2(c)+'<div class="mm-h" style="justify-content:center">🧩 なかまに なった！</div>'+UI.bornCard(c,g,p,L);
    h+='<div class="mm-gbtns mm-gbtns-col"><button class="small-btn" onclick="MM.ui.go(\'n2d\',{id:\''+p.i+'\'})">くわしく見る</button></div>'
      +'<button class="small-btn mm-gback" onclick="MM.ui.go(\'z2\',{tab:\'kk\'})">交換へ もどる</button></div>';
    setTimeout(function(){ sfx("fanfare"); },400);
    return h;
  };
})();
