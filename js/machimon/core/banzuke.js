"use strict";
/* ============================================================
   machimon/core/banzuke.js — 番付と五番勝負(1対1・運なし)
   ★五番勝負: 能力5つを1つずつ比べる。1つの能力につき問題を1問。
       正解 → 自分の能力をそのまま出す(2〜8秒の正解は×1.1) / 不正解 → ×0.5
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
  function foeShow(foe,k){ return Math.round(foe.stats[k]*R().foe); }
  /* 画面に出す相手のつよさ = 相手が実際に出してくる5つの数字の合計(自分の つよさ とそのまま比べられる) */
  function foePower(foe){ var s=0; R().order.forEach(function(k){ s+=foeShow(foe,k); }); return s; }
  function myShow(v,mult){ return Math.round(v*mult); }
  function forecast(c,foe,p){
    p=p||MM.mon.kanban(MM.mon.W(c)); var st=MM.mon.stats(p), rows=[], sure=0, can=0, fast=0, ratios=[];
    R().order.forEach(function(k){
      var me=st[k], fo=foeShow(foe,k), mark;
      if(myShow(me,R().miss)>fo){ mark="◎"; sure++; can++; }
      else if(myShow(me,R().hit)>fo){ mark="▲"; can++; }
      else if(myShow(me,R().fast)>fo){ mark="△"; fast++; }
      else mark="▼";
      ratios.push((fo+1)/Math.max(1,me));
      rows.push({k:k,me:me,foe:fo,mark:mark});
    });
    ratios.sort(function(a,b){ return a-b; });
    var pw=MM.mon.power(p), gap=Math.max(0,Math.ceil(pw*(ratios[R().need-1]-1)));     /* あとどれだけ つよさ が要るか */
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
    var ex=[]; try{ ex=MM.garden.pickExam(c,nEx)||[]; }catch(e){ ex=[]; }
    var qs=MM.learn.pick(n-ex.length,c,{subs:all,filter:function(q){ return ex.indexOf(q.id)<0; }}).concat(ex);
    if(qs.length<n)return {err:"問題が用意できなかった"};
    if(z.day.d!==c.dstr)z.day={d:c.dstr,n:0};
    z.day.n++; z.cur={foe:nf.foe.pos,promo:nf.promo?1:0};
    var st=MM.mon.stats(p);
    return { foe:nf.foe.pos, promo:nf.promo, pid:p.i, qids:qs, n:n, i:0, w:0, l:0, mine:st, rounds:[], fc:forecast(c,nf.foe,p) };
  }
  /* 1本ぶん。ok=正解したか ms=かかった時間。乱数は使わない */
  function round(c,s,ok,ms){
    if(s.i>=s.n||s.w>=R().need||s.l>=R().need)return null;
    var k=R().order[s.i], foe=D().bzAt(s.foe), qid=s.qids[s.i];
    var quick=!!(ok&&typeof ms==="number"&&ms>=MM.learn.FLUKE_MS&&ms<R().fastMs);
    var mult=ok?(quick?R().fast:R().hit):R().miss;
    var me=myShow(s.mine[k],mult), fo=foeShow(foe,k), win=me>fo;
    var rw=MM.learn.commit(qid,ok,ms,c), gain=MM.economy.grant(rw,c);       /* 学習の記録と ごほうび は ふだんの問題と同じ道を通す */
    if(win)s.w++; else s.l++;
    s.i++;
    var r={k:k,ok:!!ok,quick:quick,mult:mult,base:s.mine[k],me:me,foe:fo,win:win,qid:qid,gain:gain,over:(s.w>=R().need||s.l>=R().need||s.i>=s.n)};
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
    forecast:forecast, foePower:foePower, foeShow:foeShow, state:state, start:start, round:round, finish:finish, settleAbandoned:settleAbandoned, townLevel:townLevel };
})();
