"use strict";
/* ============================================================
   core/weekly.js — 週間チャレンジ(月曜リセット)
   定義(WEEKLY)は game-data.js、状態は ST.wq(engine.js)。
   engine.js の histTick から wqTick、missionTick から wqCheck が呼ばれる。
   ============================================================ */
/* 週番号(月曜はじまり)。日付順の比較にしか使わないので基準日は任意 */
function weekIdx(){return Math.floor((todayNum()+3)/7);}
function wqReset(){ST.wq={wk:weekIdx(),a:0,c:0,d:0,ld:"",cl:WEEKLY.map(()=>false)};}
function wqTick(ok){/* 回答毎: 解答数a・正解数c・プレイ日数dを積む */
  if(ST.wq.wk!==weekIdx())wqReset();
  ST.wq.a++;if(ok)ST.wq.c++;
  const t=today();
  if(ST.wq.ld!==t){ST.wq.ld=t;ST.wq.d++;}
}
function wqCheck(done){/* 達成判定+報酬付与。メッセージをdoneに積む */
  WEEKLY.forEach((m,i)=>{
    if(ST.wq.cl[i])return;
    if((ST.wq[m.key]||0)>=m.need){
      ST.wq.cl[i]=true;
      if(m.rw.coins)ST.coins+=m.rw.coins;
      if(m.rw.tickets)ST.tickets+=m.rw.tickets;
      if(m.rw.chest)ST.chests++;
      done.push(`週間チャレンジ達成!「${m.txt}」`);
    }
  });
}
