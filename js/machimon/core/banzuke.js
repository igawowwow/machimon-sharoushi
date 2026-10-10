"use strict";
/* ============================================================
   machimon/core/banzuke.js — 番付と五番勝負(1対1・運なし)
   ★五番勝負: 能力5つを1つずつ比べる。1つの能力につき問題を1問。
       正解 → 自分の能力をそのまま出す(2〜8秒の正解は×1.1) / 不正解 → ×0.5
       品評会で効く特性(先手・土俵ぎわ など)は、ここの倍率にだけ かかる(traitMul)。
       相手 → 決まった能力×0.85(乱数なし)
     数字の大きいほうがその1本をとる。先に3本とったほうの勝ち。
     体力も、けずり合いも無い。「見せて比べる」だけ。
   ★だから「強さが足りないと全問正解でも勝てない」「強ければ1問落としても勝てる」がはっきり出る。
     始める前に、能力ごとの見込み(◎▲△▼)を出す。
   ★場所: 7番で1場所・1日2番まで(序ノ口・序二段のあいだは1日4番)。4勝+1枚 5勝+2 6勝+3 全勝+5 / 3勝以下は1枚さがる。
     段のいちばん上まで来たら「昇進の一番」(関門の相手に勝つと次の段へ・物語が1話ひらく)。
   ★乱数は出題(MM.learn.pick)にしか使わない。勝ち負けは 能力・正解・速さ だけで決まる。
   ★保存: g.bz = {pos, w, l, n, day:{d,n}, cur, hist, story, basho, tw, tl, best}
   ============================================================ */
(function(){
  var G=(typeof window!=="undefined")?window:globalThis;
  var MM=G.MM=G.MM||{};
  function D(){ return MM.DATA; }
  function R(){ return MM.DATA.BASHO; }
  function obj(v){ return (v&&typeof v==="object"&&!Array.isArray(v))?v:null; }
  function int(v,d,lo,hi){ v=Number(v); if(!isFinite(v))v=d; return Math.round(Math.max(lo,Math.min(hi,v))); }

  function defaults(){ return { pos:R().start, w:0, l:0, n:0, day:{d:"",n:0}, cur:null, hist:[], story:0, basho:1, tw:0, tl:0, best:R().start }; }
  function norm(raw){
    var s=obj(raw); if(!s)return null; var o=defaults();
    o.pos=int(s.pos,R().start,1,R().start); o.w=int(s.w,0,0,R().bouts); o.l=int(s.l,0,0,R().bouts); o.n=int(s.n,0,0,R().bouts);
    if(o.w+o.l!==o.n){ o.n=Math.min(R().bouts,o.w+o.l); }
    var d=obj(s.day)||{}; o.day={d:typeof d.d==="string"?d.d.slice(0,12):"",n:int(d.n,0,0,99)};
    var cu=obj(s.cur); o.cur=cu?{foe:int(cu.foe,60,1,60),promo:cu.promo?1:0}:null;
    o.hist=(Array.isArray(s.hist)?s.hist:[]).filter(obj).slice(-30).map(function(h){ return {b:int(h.b,1,1,1e6),w:int(h.w,0,0,7),l:int(h.l,0,0,7),from:int(h.from,61,1,61),to:int(h.to,61,1,61)}; });
    o.story=int(s.story,0,0,8); o.basho=int(s.basho,1,1,1e6); o.tw=int(s.tw,0,0,1e7); o.tl=int(s.tl,0,0,1e7); o.best=int(s.best,o.pos,1,R().start);
    return o;
  }
  function Z(c){ var g=MM.mon.W(c); if(!g.bz)g.bz=defaults(); return g.bz; }

  /* 自分の段。番付の外(61)は序ノ口あつかい */
  function danOf(pos){ return D().danOf(Math.min(60,pos)); }
  function isPromo(z){ return z.pos>1&&z.pos===danOf(z.pos).top; }       /* 段のいちばん上=次は昇進の一番 */
  /* 1日に取れる番数。序ノ口・序二段(と番付の外)のあいだは4番、三段目からは2番(最初の1週間で手応えが出るように) */
  function perDay(c){ return Z(c).pos>=R().lowFrom?R().perDayLow:R().perDay; }
  function leftToday(c){ var z=Z(c); return Math.max(0,perDay(c)-(z.day.d===c.dstr?z.day.n:0)); }
  /* 今場所の相手7人(弱い順)。同じ段の上の相手 → 足りなければ下の相手 → それでも足りなければ上から繰り返し */
  function foes(z){
    var top=danOf(z.pos).top, A=[], B=[], p, n=R().bouts;
    for(p=z.pos-1;p>=top&&p>=1&&A.length<n;p--)A.push(p);
    for(p=Math.max(1,z.pos);p<=60&&A.length+B.length<n;p++)B.push(p);
    var out=A.concat(B), i=0;
    while(out.length<n&&A.length){ out.push(A[A.length-1-(i%A.length)]); i++; }
    while(out.length<n)out.push(60);
    return out.sort(function(a,b){ return b-a; });
  }
  function nextFoe(c){
    var z=Z(c);
    if(isPromo(z))return {foe:D().bzAt(z.pos-1),promo:true};
    return {foe:D().bzAt(foes(z)[Math.min(z.n,R().bouts-1)]),promo:false};
  }
  /* 見込み: ◎=まちがえてもとれる ▲=正解すればとれる △=はやく正解すればとれる ▼=正解してもとれない */
  function foeShow(foe,k,fx){ return Math.round(foe.stats[k]*R().foe*((fx&&fx.foe)||1)); }
  /* 品評会で効く特性の倍率(1本ぶん)。st={l:とられた本数, last:前の1本(1=とった −1=とられた 0=まだ), under:相手のほうが つよい}
     戻り値 {m:倍率, keys:[効いた効果]}。乱数なし。 */
  function traitMul(fx,i,st){
    var m=1, keys=[]; function use(k){ if(fx[k]){ m*=fx[k]; keys.push(k); } }
    use("r"+(i+1)); if(i>=R().rounds-R().exam)use("exam"); if(st.under)use("under");
    if(st.l>=2)use("behind2"); if(st.last<0)use("afterLoss"); if(st.last>0)use("afterWin");
    return {m:m,keys:keys};
  }
  function missMul(fx){ return Math.max(R().miss,fx.miss||0); }
  function fastMul(fx){ return Math.max(R().fast,fx.fast||0); }
  /* 画面に出す相手のつよさ = 相手が実際に出してくる5つの数字の合計(自分の つよさ とそのまま比べられる) */
  function foePower(foe){ var s=0; R().order.forEach(function(k){ s+=foeShow(foe,k); }); return s; }
  function myShow(v,mult){ return Math.round(v*mult); }
  function markOf(me,fo,fx){
    if(myShow(me,missMul(fx))>fo)return "◎";
    if(myShow(me,R().hit)>fo||(fx.slow&&myShow(me,fastMul(fx))>fo))return "▲";
    if(myShow(me,fastMul(fx))>fo)return "△";
    return "▼";
  }
  function forecast(c,foe,p){
    p=p||MM.mon.kanban(MM.mon.W(c)); var st=MM.mon.stats(p), rows=[], sure=0, can=0, fast=0, ratios=[];
    var fx=MM.mon.fxOf(p.tr), pw=MM.mon.power(p), under=foePower(foe)>pw;
    /* 見込みは「まだ1本も取っていない・取られていない」ときの数字(とった・とられた後に効く特性は、取組の中で足される) */
    R().order.forEach(function(k,i){
      var tm=traitMul(fx,i,{l:0,last:0,under:under}), me=st[k]*tm.m, fo=foeShow(foe,k,fx), mark=markOf(me,fo,fx);
      if(mark==="◎"){ sure++; can++; } else if(mark==="▲")can++; else if(mark==="△")fast++;
      ratios.push((fo+1)/Math.max(1,me));
      rows.push({k:k,me:Math.round(me),foe:fo,mark:mark,base:st[k],tm:tm.m,names:MM.mon.fxNames(p.tr,tm.keys.concat(fx.foe?["foe"]:[]))});
    });
    ratios.sort(function(a,b){ return a-b; });
    var gap=Math.max(0,Math.ceil(pw*(ratios[R().need-1]-1)));     /* あとどれだけ つよさ が要るか */
    var v=sure>=R().need?"sure":(can>=R().need?"can":(can+fast>=R().need?"fast":"no"));
    return { rows:rows, sure:sure, can:can, fast:fast, verdict:v, gap:v==="no"||v==="fast"?gap:0, mine:pw, foePower:foePower(foe) };
  }
  function state(c){
    var z=Z(c), dan=danOf(z.pos), nf=nextFoe(c);
    return { pos:z.pos, dan:dan, ranked:z.pos<=60, yokozuna:z.pos===1, w:z.w, l:z.l, n:z.n, bashoLeft:R().bouts-z.n, basho:z.basho,
             left:leftToday(c), perDay:perDay(c), promo:nf.promo, foe:nf.foe, foes:foes(z), story:z.story, tw:z.tw, tl:z.tl, hist:z.hist, best:z.best };
  }
  /* 途中でやめた取組は負け(不戦敗)にする = 負けそうなときに閉じて無かったことにできない */
  function settleAbandoned(c){ var z=Z(c); if(!z.cur)return null; var cu=z.cur; z.cur=null; return apply(c,cu,false,true); }

  /* 取組をはじめる: 5問を選ぶ(あとの2本は本試験形式) */
  function start(c){
    settleAbandoned(c);
    var z=Z(c); if(leftToday(c)<=0)return {err:"きょうの取組は おわり(1日"+perDay(c)+"番まで)。あした また来てね"};
    var nf=nextFoe(c), g=MM.mon.W(c), p=MM.mon.kanban(g), nEx=R().exam, n=R().rounds, all=[0,1,2,3,4,5,6,7,8];
    var ex=[]; try{ ex=MM.exam.pick(c,nEx)||[]; }catch(e){ ex=[]; }
    var qs=MM.learn.pick(n-ex.length,c,{subs:all,filter:function(q){ return ex.indexOf(q.id)<0; }}).concat(ex);
    if(qs.length<n)return {err:"問題が用意できなかった"};
    if(z.day.d!==c.dstr)z.day={d:c.dstr,n:0};
    z.day.n++; z.cur={foe:nf.foe.pos,promo:nf.promo?1:0};
    var st=MM.mon.stats(p);
    return { foe:nf.foe.pos, promo:nf.promo, pid:p.i, qids:qs, n:n, i:0, w:0, l:0, mine:st, rounds:[], fc:forecast(c,nf.foe,p),
             tr:p.tr.slice(), under:foePower(nf.foe)>MM.mon.power(p) };
  }
  /* つぎの1本の「いまの数字」(とった・とられた後に効く特性こみ)。画面はこれをそのまま出す */
  function peek(s){
    if(s.i>=s.n)return null;
    var k=R().order[s.i], foe=D().bzAt(s.foe), fx=MM.mon.fxOf(s.tr||[]), last=s.rounds.length?(s.rounds[s.rounds.length-1].win?1:-1):0;
    var tm=traitMul(fx,s.i,{l:s.l,last:last,under:!!s.under}), me=s.mine[k]*tm.m, fo=foeShow(foe,k,fx);
    return { k:k, base:s.mine[k], tm:tm.m, me:Math.round(me), raw:me, foe:fo, mark:markOf(me,fo,fx), fx:fx,
             names:MM.mon.fxNames(s.tr||[],tm.keys.concat(fx.foe?["foe"]:[])) };
  }
  /* 1本ぶん。ok=正解したか ms=かかった時間。乱数は使わない */
  function round(c,s,ok,ms){
    if(s.i>=s.n||s.w>=R().need||s.l>=R().need)return null;
    var pk=peek(s), k=pk.k, fx=pk.fx, qid=s.qids[s.i];
    var quick=!!(ok&&typeof ms==="number"&&ms>=MM.learn.FLUKE_MS&&(ms<R().fastMs||fx.slow));     /* マイペース: ゆっくりでも「はやい正解」あつかい */
    var mult=ok?(quick?fastMul(fx):R().hit):missMul(fx);
    var me=myShow(pk.raw,mult), fo=pk.foe, win=me>fo;
    var rw=MM.learn.commit(qid,ok,ms,c), gain=MM.economy.grant(rw,c);       /* 学習の記録と ごほうび は ふだんの問題と同じ道を通す */
    if(win)s.w++; else s.l++;
    s.i++;
    var r={k:k,ok:!!ok,quick:quick,mult:mult,base:s.mine[k],tm:pk.tm,names:pk.names.concat(MM.mon.fxNames(s.tr||[],ok?(quick?["fast","slow"]:[]):["miss"])),me:me,foe:fo,win:win,qid:qid,gain:gain,over:(s.w>=R().need||s.l>=R().need||s.i>=s.n)};
    s.rounds.push({k:k,ok:r.ok,me:me,foe:fo,win:win,mult:mult});
    return r;
  }
  /* 取組の結果を番付へ(勝ち負け・星取り・場所の締め・昇降・昇進の一番) */
  function apply(c,cu,won,forfeit){
    var z=Z(c), g=MM.mon.W(c), out={won:!!won,forfeit:!!forfeit,promo:null,basho:null,story:0,from:z.pos,to:z.pos,gifts:[]};
    if(won){ z.tw++; var p=MM.mon.kanban(g); if(p)p.w=(p.w||0)+1; if(z.story<1){ z.story=1; out.story=1; } } else z.tl++;
    if(cu.promo){
      out.promo={won:!!won};
      if(won){ z.pos=cu.foe; if(MM.breed)MM.breed.give(c,D().GIFT.promo,out.gifts,"昇進");
        if(z.story<8){ z.story=Math.min(8,Math.max(z.story,danOf(z.pos).id+1)); out.story=z.story; } }
    }else{
      if(won)z.w++; else z.l++; z.n++;
      if(z.n>=R().bouts){
        var up=R().up[z.w]||0, from=z.pos, to=from;
        if(up>0)to=Math.max(danOf(from).top,from-up);            /* 段をまたぐには昇進の一番が要る */
        else if(z.w<=3&&from<60)to=Math.min(60,from+R().down);    /* 負け越しは1枚さがる(最下位と番付の外ではさがらない) */
        if(from===1)to=1;                                        /* 横綱はさがらない */
        out.basho={w:z.w,l:z.l,from:from,to:to,delta:from-to,no:z.basho};
        if(MM.breed)MM.breed.give(c,D().GIFT.basho[z.w],out.gifts,z.w+"勝");          /* 勝ち越しのごほうび(育成どうぐ・配合券) */
        z.hist.push({b:z.basho,w:z.w,l:z.l,from:from,to:to}); while(z.hist.length>30)z.hist.shift();
        z.pos=to; z.w=0; z.l=0; z.n=0; z.basho++;
      }
    }
    if(z.pos<z.best)z.best=z.pos;
    out.to=z.pos;
    return out;
  }
  function finish(c,s){
    var z=Z(c), cu=z.cur||{foe:s.foe,promo:s.promo?1:0}; z.cur=null;
    var won=s.w>=R().need, out=apply(c,cu,won,false), foe=D().bzAt(s.foe), rv=D().bzRival(foe.rival);
    out.rounds=s.rounds; out.w=s.w; out.l=s.l; out.foe=foe; out.rival=rv; out.say=won?rv.lose:rv.win;
    return out;
  }
  /* 段が上がるほど街がにぎやかになる(ホームの景色用。スライス6で使う) */
  function townLevel(c){ return danOf(Z(c).pos).id; }

  MM.banzuke={ perDay:perDay, defaults:defaults, norm:norm, Z:Z, danOf:danOf, isPromo:isPromo, leftToday:leftToday, foes:foes, nextFoe:nextFoe,
    forecast:forecast, foePower:foePower, foeShow:foeShow, state:state, start:start, round:round, peek:peek, traitMul:traitMul, finish:finish, settleAbandoned:settleAbandoned, townLevel:townLevel };
})();
