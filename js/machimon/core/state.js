"use strict";
/* ============================================================
   machimon/core/state.js — セーブ状態(既定値・正規化・注入コンテキスト)
   ★ゲームのセーブは ST.mm の1キー。その中身は 財布(res.g)・その日の記録・遊びの本体(g2)。
     学習の記録(ST.q / ST.rq)は別のキーで、ここでは一切さわらない。
   ★欠損・NaN・不正値は安全側へ丸め、起動不能にしない。
   ★1.x のセーブ(gd と tix)は、引っ越し(core/mon.js)が読むまで そのまま持ち越す。引っ越しが済んだら手放す。
     1.x のそれ以外の項目(街・建物・旧い図鑑 など)は 2.0 では使わないので、読みこむときに落とす
     (落とす前に boot.js がセーブ全体を別のキーへ写している)。
   ★ctx(注入コンテキスト): {ST, today, now, rand} を包む。core/* はグローバルに直接触らない
     = テストで任意の状態・任意の乱数を与えて検証できる。
   ============================================================ */
(function(){
  var G=(typeof window!=="undefined")?window:globalThis;
  var MM=G.MM=G.MM||{};
  var VER=2;

  function defaults(){
    return { on:0, name:"", res:{g:0}, qx:{}, w7:[0,0,0,0,0,0,0], day:{d:"",eff:0,ans:0,cor:0}, combo:0, best:0, ms:{}, g2:null, gd:null, tix:0, ver:VER };
  }
  function num(v,def,min,max){ v=Number(v); if(!Number.isFinite(v))v=def; if(v<min)v=min; if(v>max)v=max; return v; }
  function int(v,def,min,max){ return Math.round(num(v,def,min,max)); }
  function obj(v){ return (v&&typeof v==="object"&&!Array.isArray(v))?v:null; }

  function normalize(raw){
    var s=obj(raw)?raw:{}, out=defaults();
    out.on=s.on?1:0;
    out.name=(typeof s.name==="string")?s.name.replace(/[<>"]/g,"").slice(0,12):"";
    out.res={ g:int((obj(s.res)||{}).g,0,0,1e12) };
    /* その日のデータ(日付が変われば rollDay が捨てる) */
    var sq=obj(s.qx)||{};
    for(var qk in sq){ var q=obj(sq[qk]); if(!q)continue; out.qx[qk]={ d:String(q.d||""), n:int(q.n,0,0,999), ms:int(q.ms,0,0,600000) }; }
    out.w7=[]; var sw=Array.isArray(s.w7)?s.w7:[]; for(var w=0;w<7;w++)out.w7.push(int(sw[w],0,0,100000));
    var sd=obj(s.day)||{};
    out.day={ d:String(sd.d||""), eff:int(sd.eff,0,0,100000), ans:int(sd.ans,0,0,100000), cor:int(sd.cor,0,0,100000) };
    out.combo=int(s.combo,0,0,100000); out.best=int(s.best,0,0,100000);
    var sms=obj(s.ms)||{}; if(sms.intro)out.ms.intro=1;
    /* 遊びの本体(core/mon.js)。未ロードなら生のまま持ち越す */
    try{ out.g2=(MM.mon&&MM.mon.normalize&&obj(s.g2))?MM.mon.normalize(s.g2):(obj(s.g2)||null); }catch(e){ out.g2=obj(s.g2)||null; }
    /* 1.x のセーブ: 引っ越しが読むまで そのまま(中身の点検は core/legacy.js) */
    out.gd=obj(s.gd)||null; out.tix=int(s.tix,0,0,9999);
    out.ver=VER;
    return out;
  }

  /* 注入コンテキスト。ST を渡さなければ window.gameState を使う */
  function ctx(o){
    o=o||{};
    var ST=o.ST||G.gameState||{};
    if(!ST.mm||typeof ST.mm!=="object")ST.mm=defaults();
    var day=(typeof o.today==="number")?o.today:((typeof G.todayNum==="function")?G.todayNum():Math.floor(Date.now()/864e5));
    return { ST:ST, mm:ST.mm, today:day, now:(typeof o.now==="number")?o.now:Date.now(), dstr:o.dstr||dayStr(o.nowDate), rand:(typeof o.rand==="function")?o.rand:Math.random };
  }
  function dayStr(d){ d=d||new Date(); return d.getFullYear()+"-"+(d.getMonth()+1)+"-"+d.getDate(); }

  /* 日付が変わったら当日データをリセット(w7 を1日ぶんシフト) */
  function rollDay(c){
    var mm=c.mm;
    if(mm.day.d===c.dstr)return false;
    if(mm.day.d){ mm.w7.push(mm.day.eff); while(mm.w7.length>7)mm.w7.shift(); }
    mm.day={d:c.dstr,eff:0,ans:0,cor:0};
    mm.qx={};
    mm.combo=0;
    return true;
  }

  MM.state={ VER:VER, defaults:defaults, normalize:normalize, ctx:ctx, rollDay:rollDay, dayStr:dayStr, num:num, int:int };
})();
