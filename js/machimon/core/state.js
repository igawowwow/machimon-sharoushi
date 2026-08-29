"use strict";
/* ============================================================
   machimon/core/state.js — MACHIMONのセーブ状態(既定値・正規化・注入コンテキスト)
   ★既存アプリを壊さない: 追加するセーブキーは ST.mm の1つだけ。
     欠損・NaN・不正値は安全側へ丸め、起動不能にしない(既存 sanitizeState と同じ思想)。
   ★ctx(注入コンテキスト): {ST, today, now, rand} を包む。core/* はグローバルに直接触らない
     = テストで任意の状態・任意の乱数を与えて検証できる。
   ============================================================ */
(function(){
  var G=(typeof window!=="undefined")?window:globalThis;
  var MM=G.MM=G.MM||{};

  var VER=1;
  var MON_CAP=200;   /* 所持マチモンの上限(セーブ肥大の防止) */

  function defaults(){
    return {
      on:0,
      res:{g:0,xp:0,tama:0,mat:0,ke:0},
      lv:1,
      gauge:0,
      pity:0,
      tier:0,
      areas:{rouki:1},
      slots:{},
      mons:{},
      uid:1,
      qx:{},
      inc:{d:"",list:[],done:0},
      idle:{t:0},
      w7:[0,0,0,0,0,0,0],
      day:{d:"",eff:0,ans:0,cor:0},
      combo:0,best:0,
      boss:{},
      ms:{},
      exam:{date:""},
      log:[],
      ver:VER
    };
  }

  function num(v,def,min,max){
    v=Number(v); if(!Number.isFinite(v))v=def;
    if(v<min)v=min; if(v>max)v=max;
    return v;
  }
  function int(v,def,min,max){ return Math.round(num(v,def,min,max)); }
  function obj(v){ return (v&&typeof v==="object"&&!Array.isArray(v))?v:null; }

  /* 既存セーブに mm が無ければ丸ごと補完し、あれば安全な値へ正規化して返す */
  function normalize(raw){
    var D=defaults();
    var s=obj(raw)?raw:{};
    var out=defaults();
    out.on=s.on?1:0;
    var r=obj(s.res)||{};
    out.res={ g:int(r.g,0,0,1e12), xp:int(r.xp,0,0,1e12), tama:int(r.tama,0,0,9999),
              mat:int(r.mat,0,0,1e9), ke:int(r.ke,0,0,1e9) };
    out.lv=int(s.lv,1,1,999);
    out.gauge=num(s.gauge,0,0,1000);
    out.pity=int(s.pity,0,0,999);
    out.tier=int(s.tier,0,0,12);
    /* エリア: 未知idは捨てる。rouki は常に解放 */
    out.areas={};
    var AD=(MM.DATA&&MM.DATA.areaById)||{};
    var sa=obj(s.areas)||{};
    for(var k in sa){ if(AD[k]&&sa[k])out.areas[k]=1; }
    out.areas.rouki=1;
    /* マチモン: 種族が存在するものだけ残す。上限を超えたら古い順に切る */
    out.mons={};
    var SP=(MM.DATA&&MM.DATA.speciesById)||{};
    var sm=obj(s.mons)||{}, keys=Object.keys(sm), n=0;
    for(var i=0;i<keys.length&&n<MON_CAP;i++){
      var m=obj(sm[keys[i]]); if(!m||!SP[m.sp])continue;
      out.mons[keys[i]]={ sp:m.sp, lv:int(m.lv,1,1,50), xp:int(m.xp,0,0,1e9),
                          born:int(m.born,0,0,1e7), place:(typeof m.place==="string")?m.place:"" };
      n++;
    }
    out.uid=int(s.uid,1,1,1e9);
    /* スロット: 既知の建物・既知エリアのみ */
    out.slots={};
    var BD=(MM.DATA&&MM.DATA.bldById)||{};
    var ss=obj(s.slots)||{};
    for(var sk in ss){
      var v=obj(ss[sk]); if(!v||!BD[v.b])continue;
      var aid=String(sk).split(":")[0]; if(!out.areas[aid])continue;
      out.slots[sk]={ b:v.b, lv:int(v.lv,1,1,(MM.DATA&&MM.DATA.BLD_LV_MAX)||5),
                      mon:(typeof v.mon==="string"&&out.mons[v.mon])?v.mon:"",
                      day:int(v.day,0,0,1e7), q:int(v.q,0,0,1e9) };
    }
    /* 配置の整合: mons.place と slots.mon の食い違いを slots 側に合わせる */
    for(var mk in out.mons){ out.mons[mk].place=""; }
    for(var sk2 in out.slots){ var mo=out.slots[sk2].mon; if(mo&&out.mons[mo])out.mons[mo].place=sk2; }
    /* 当日データ(日付が違えば捨てる=肥大防止) */
    out.qx={}; var sq=obj(s.qx)||{};
    for(var qk in sq){ var q=obj(sq[qk]); if(!q)continue;
      out.qx[qk]={ d:String(q.d||""), n:int(q.n,0,0,999), ms:int(q.ms,0,0,600000) }; }
    var si=obj(s.inc)||{};
    out.inc={ d:String(si.d||""), list:Array.isArray(si.list)?si.list.slice(0,60):[], done:int(si.done,0,0,999) };
    out.idle={ t:int((obj(s.idle)||{}).t,0,0,4e15) };
    out.w7=[]; var sw=Array.isArray(s.w7)?s.w7:[];
    for(var w=0;w<7;w++)out.w7.push(int(sw[w],0,0,100000));
    var sd=obj(s.day)||{};
    out.day={ d:String(sd.d||""), eff:int(sd.eff,0,0,100000), ans:int(sd.ans,0,0,100000), cor:int(sd.cor,0,0,100000) };
    out.combo=int(s.combo,0,0,100000); out.best=int(s.best,0,0,100000);
    out.boss={}; var sb=obj(s.boss)||{};
    var BO=(MM.DATA&&MM.DATA.bossById)||{};
    for(var bk in sb){ if(!BO[bk])continue; var b=obj(sb[bk])||{};
      out.boss[bk]={ clears:int(b.clears,0,0,99999), best:int(b.best,0,0,999) }; }
    out.ms={}; var sms=obj(s.ms)||{};
    for(var mk2 in sms){ if(sms[mk2])out.ms[String(mk2).slice(0,12)]=1; }
    var se=obj(s.exam)||{};
    out.exam={ date:(typeof se.date==="string"&&/^\d{4}-\d{2}-\d{2}$/.test(se.date))?se.date:"" };
    out.log=Array.isArray(s.log)?s.log.slice(-20):[];
    out.ver=VER;
    return out;
  }

  /* 注入コンテキスト。ST を渡さなければ window.gameState を使う */
  function ctx(o){
    o=o||{};
    var ST=o.ST||G.gameState||{};
    if(!ST.mm||typeof ST.mm!=="object")ST.mm=defaults();
    var day=(typeof o.today==="number")?o.today
      :((typeof G.todayNum==="function")?G.todayNum():Math.floor(Date.now()/864e5));
    return {
      ST:ST, mm:ST.mm,
      today:day,
      now:(typeof o.now==="number")?o.now:Date.now(),
      dstr:o.dstr||dayStr(o.nowDate),
      rand:(typeof o.rand==="function")?o.rand:Math.random
    };
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

  MM.state={ VER:VER, MON_CAP:MON_CAP, defaults:defaults, normalize:normalize,
             ctx:ctx, rollDay:rollDay, dayStr:dayStr, num:num, int:int };
})();
