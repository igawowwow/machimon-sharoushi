/* 自動プレイ(つり合わせ用)。けいこ3択・配合・どうぐ・番付をふつうの人の手順で回す。
   使い方: node tools/sim-v2.js            (env: ACC=0.75 PER=60 DAYS=180 SEED=42)
           require("./sim-v2.js").run({...}) でテストからも使う(tools/test-v2.js)。
   手順(1日): 無料タマゴ → 取組(勝てる見込みがあるときだけ) → けいこ(復習をやりきる → 苦手 → あたらしい問題)
              → 配合券があれば いちばん良さそうな組で配合 → コインでタマゴ → かけら交換(SSR以上がいなければSSR・あとはURまで ためる)
              → 看板の見直し。人が遊ぶより手ぎわが良いので、到達の速さは上限寄り。 */
const load=require("./lib-load.js");
function run(o){
  o=Object.assign({acc:0.75,per:60,days:180,seed:42,quick:0.5,marks:[7,30,90,180],log:false},o||{});
  const {win,MM}=load(); const D=MM.DATA, M=MM.mon, BZ=MM.banzuke, KE=MM.keiko, BR=MM.breed;
  let seed=o.seed; const rand=()=>{ seed=(seed*16807)%2147483647; return (seed-1)/2147483646; };
  const ST={q:{},rq:[],mm:null}; const c=MM.state.ctx({ST,today:23000,now:1.7e12,rand,dstr:"s0"}); MM.game.finishIntro(c,"じどうの街"); win.gameState=ST;
  const g=M.W(c); M.starter(c,0); const z=BZ.Z(c);
  const RAR=["N","R","SR","SSR","UR","LG"], at={}, firstDan={}, subAns=[0,0,0,0,0,0,0,0,0]; let yoko=0, eggSSR=0, t40=0, t45=0, t50=0, gifts=0, tickets=0, efFull=0, bought=0, lastPos=61, lastMove=0, maxStall=0;
  const tal=(p)=>M.talent(p);
  /* 親としての値打ち: 「看板と同じLv・けいこ値」まで育てたつよさ */
  /* 五番勝負は「5本中3本」なので、合計だけでなく 3番目・4番目に高い能力 も見る(1つだけ飛びぬけた子は勝てない。4本とれる形なら1問落とせる) */
  const shape=(q)=>{ const st=Object.values(M.stats(q)).sort((a,b)=>b-a); return 0.4*M.power(q)+0.3*5*st[2]+0.3*5*st[3]; };
  const asKan=(p)=>{ const k=M.kanban(g); if(p===k)return p; const h=M.handover(p,k); return {k:p.k,lv:h.lv,tl:p.tl,na:p.na,tr:p.tr,ef:h.ef}; };
  const val=(p)=>shape(asKan(p));
  function manage(){
    const k=M.kanban(g), kv=val(k); let best=null; g.mons.forEach(p=>{ if(p===k)return; const d=val(p)-kv; if(!best||d>best.d)best={p,d}; });
    if(best&&best.d>0)M.setKan(c,best.p.i);
    const cap=D.RATE2.cap-4;
    if(g.mons.length>cap){ const keep=new Set([g.kan]); g.mons.forEach(p=>{ if(M.rarOf(p)>=3)keep.add(p.i); }); g.mons.slice().sort((a,b)=>val(b)-val(a)).slice(0,8).forEach(p=>keep.add(p.i)); g.mons.slice().sort((a,b)=>tal(b)-tal(a)).slice(0,8).forEach(p=>keep.add(p.i));
      const rest=g.mons.filter(p=>!keep.has(p.i)).sort((a,b)=>val(a)-val(b)); while(g.mons.length>cap&&rest.length)M.release(c,rest.shift().i); }
  }
  function answer(qid){ const q=win.qById(qid); subAns[q.s]++; return MM.economy.grant(MM.learn.commit(qid,rand()<o.acc,5000,c),c); }
  function session(kind,left){ const s=KE.start(c,kind); if(s.err)return 0; let n=0;
    while(s.qid!=null&&n<left){ const ok0=c.mm.day.cor; const gain=answer(s.qid); n++; KE.advance(c,s,c.mm.day.cor>ok0,gain); if(gain.mon){ gifts+=gain.mon.gifts.length; if(gain.mon.ticket)tickets++; } }
    return n; }
  function useItems(){ const k=M.kanban(g); ["cho","mochi"].forEach(id=>{ while(g.items[id]>0)BR.useItem(c,id,k.i); });
    while(g.items.ishi>0&&k.tr.length<2){ if(BR.useItem(c,"ishi",k.i).err)break; }
    while(g.items.mi>0&&Math.min(...k.tl)<=3)BR.useItem(c,"mi",k.i); }
  function doBreed(){
    while(g.bt>0&&g.mons.length>=2){
      const k=M.kanban(g), bestV=Math.max(...g.mons.map(val));
      const As=new Set(); g.mons.slice().sort((a,b)=>val(b)-val(a)).slice(0,5).forEach(p=>As.add(p)); g.mons.slice().sort((a,b)=>tal(b)-tal(a)).slice(0,5).forEach(p=>As.add(p));
      let best=null;
      for(const A of As)for(const B of g.mons){ if(A===B||B===k)continue; const vb=val(B);
        const items=[g.items.ito>0?"ito":(g.items.futago>0?"futago":"")]; if(g.items.utsushi>0&&M.rarOf(B)>M.rarOf(A))items.push("utsushi");
        for(const item of items){ const cp=BR.compat(g,A,B), dist=BR.kindDist(A,B,item), r=BR.lcg(1+g.brd*7919+g.nid); let sc=0;
          for(let i=0;i<24;i++){ const p=BR.make(r,g,A,B,item,dist,cp); p.i="x"; const v=val(p); sc+=Math.max(0,v-bestV)+0.05*(v-vb); }
          if(!best||sc>best.sc)best={A,B,sc,item}; } }
      if(!best)break; const res=BR.breed(c,best.A.i,best.B.i,{item:best.item}); if(res.err)break;
      res.kids.forEach(x=>{ const t=tal(x.mon); if(t>=40&&!t40)t40=g.brd; if(t>=45&&!t45)t45=g.brd; if(t>=50&&!t50)t50=g.brd; });
      manage();
    }
  }
  for(let day=1;day<=o.days;day++){
    c.dstr="s"+day; c.today=23000+day; MM.state.rollDay(c); let left=o.per;
    if(M.freeReady(c)){ const r=M.pull(c,true); if(r.mon&&M.rarOf(r.mon)>=3)eggSSR++; } manage(); useItems();
    while(BZ.leftToday(c)>0&&left>=5){ const st=BZ.state(c), fc=BZ.forecast(c,st.foe); if(fc.verdict==="no")break;
      const s=BZ.start(c); if(s.err)break; let r; do{ const q=win.qById(s.qids[s.i]); subAns[q.s]++; r=BZ.round(c,s,rand()<o.acc,rand()<o.quick?4000:12000); left--; }while(r&&!r.over); const res=BZ.finish(c,s); gifts+=res.gifts.length; }
    let guard=0;
    while(left>0&&guard++<30){ const m=KE.menu(c), n=(id)=>m.list.find(x=>x.id===id).left; let kind;
      if(!m.ticket.got&&m.ticket.done<m.ticket.need&&n("rev")>0)kind="rev"; else if(n("nig")>=5)kind="nig"; else if(n("rev")>=10&&guard%2===0)kind="rev"; else if(n("new")>0)kind="new"; else kind=n("rev")>0?"rev":(n("nig")>0?"nig":"");
      if(!kind)break; const d=session(kind,left); if(!d)break; left-=d; }
    useItems(); doBreed();
    while(c.mm.res.g>=D.RATE2.cost&&g.mons.length<D.RATE2.cap){ const r=M.pull(c,false); if(r.err)break; if(M.rarOf(r.mon)>=3)eggSSR++; }
    manage();
    /* かけら交換: SSR以上が1体もいなければ SSR(300)。いれば UR(1,000)まで ためる。能力のかたよりが小さい種類をえらぶ */
    { const flat=(kd)=>Object.values(kd.base).sort((a,b)=>b-a)[2], has3=g.mons.some(p=>M.rarOf(p)>=3), want=has3?4:3, cost=want===4?D.SHARD_COST.ur:D.SHARD_COST.ssr;
      if(g.shard>=cost&&g.mons.length<D.RATE2.cap){ const kd=D.kindsByRar[want].slice().sort((a,b)=>flat(b)-flat(a))[0]; if(!BR.buyKind(c,kd.id).err)bought++; } }
    manage();
    if(!efFull&&M.kanban(g).ef.reduce((a,b)=>a+b,0)>=D.EF_TOTAL-0.5)efFull=day;
    if(z.pos!==lastPos){ lastPos=z.pos; lastMove=day; } maxStall=Math.max(maxStall,day-lastMove);
    const dn=BZ.danOf(z.pos).id; if(firstDan[dn]==null)firstDan[dn]=day; if(z.pos===1&&!yoko)yoko=day;
    if(o.marks.includes(day)){ const k=M.kanban(g), m=MM.learn.masteryBySub(c), cnt=[0,0,0,0,0,0]; g.mons.forEach(p=>cnt[M.rarOf(p)]++); const tot=subAns.reduce((a,b)=>a+b,0);
      const cs=KE.census(c);
      at[day]={ day, pos:z.pos, dan:BZ.danOf(z.pos).name, pw:M.power(k), rar:RAR[M.rarOf(k)], kind:M.kindOf(k).name, tal:tal(k), lv:k.lv, cap:KE.lvCap(c,m).cap, ef:Math.round(k.ef.reduce((a,b)=>a+b,0)),
        pulls:g.pulls, breeds:g.brd, dex:Object.keys(g.dex).length, ssr:cnt[3]+cnt[4]+cnt[5], eggSSR, ssrKinds:new Set(g.mons.filter(p=>M.rarOf(p)>=3).map(p=>p.k)).size, cnt:cnt.join("/"),
        lg:cnt[5], shard:g.shard, bt:g.bt, items:BR.itemCount(g), gifts, tickets, bought, w:z.tw, l:z.tl, story:z.story, stamps:Object.values(g.dex).reduce((a,b)=>a+((b&1)?1:0)+((b&2)?1:0)+((b&4)?1:0),0), tr:k.tr.join('+'),
        mast:[0,1,2,3,4,5,6,7,8].map(s=>Math.round((m[s]||0)*100)), seen:cs.per.map(p=>Math.round(p.seen/p.n*100)), share:subAns.map(v=>Math.round(v/tot*100)), bestTal:Math.max(...g.mons.map(tal)) }; }
  }
  return { at, firstDan, yoko, t40, t45, t50, efFull, maxStall, g, c, ST, MM, win, subAns };
}
module.exports={run};
if(require.main===module){
  const E=process.env, days=Number(E.DAYS||180), marks=[1,3,7,14,30,45,60,90,120,150,180,240,300,365].filter(d=>d<=days);
  const r=run({acc:Number(E.ACC||0.75),per:Number(E.PER||60),days,seed:Number(E.SEED||42),marks});
  marks.forEach(d=>{ const a=r.at[d]; console.log(`${d}日 ${a.dan}${a.pos}枚目 ${a.w}勝${a.l}敗 | 看板 ${a.rar} ${a.kind} つよさ${a.pw} Lv${a.lv}/${a.cap} 才能${a.tal} けいこ値${a.ef} | タマゴ${a.pulls} 配合${a.breeds} 図鑑${a.dex} SSR以上${a.ssr}体(タマゴから${a.eggSSR}・${a.ssrKinds}種) 持ち${a.cnt} かけら${a.shard}(交換${a.bought}) 券${a.bt} どうぐ${a.items} 最高才能${a.bestTal} 特性[${a.tr}] 物語${a.story}話 はんこ${a.stamps}\n      習熟% ${a.mast.join(",")} / 解いた% ${a.seen.join(",")} / 出題の割合% ${a.share.join(",")}`); });
  console.log("段に入った日",JSON.stringify(r.firstDan),"横綱",r.yoko||"—","| けいこ値が満ちた日",r.efFull||"—","| 番付が動かなかった最長",r.maxStall,"日 | 才能40以上まで配合",r.t40||"—","回 / 45以上",r.t45||"—","回 / 50",r.t50||"—","回");
}
