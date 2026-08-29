"use strict";
/* ============ 問題バンク(頻出論点・本試験改題) ============ */
/* 実データは questions/s0.js〜s8.js(科目別)+ data/ の事件専用問題。
   id は恒久ID(数値=既存500問、文字列=新世代)。セーブデータ(ST.q)のキーであり、
   変更・振り直し・使い回しは禁止。配列の順序には一切意味を持たせない。
   参照は必ず qById(id) 経由(Q[添字] でのID参照は禁止)。 */
const __bank=buildBank(window.QPARTS||[],window.QENRICH||null);
const Q=__bank.pool;          /* 一般出題プール(学習進捗の分母) */
const QBY=__bank.by;          /* 全問Map(事件専用問題を含む) */
function qById(id){return QBY.get(String(id));}
/* 自己修復: Qが空=SW更新の一瞬だけ起こる新旧HTML/JS混在ロード(旧indexは科目別ファイルを
   読まない)。壊れたキャッシュとSWを捨てて1回だけ自動リロードする。2回目は素通し(無限ループ防止) */
if(typeof sessionStorage!=="undefined"){ /* Node実行の監査スクリプトでは何もしない */
  if(!Q.length&&!sessionStorage.getItem("srq-heal")){
    sessionStorage.setItem("srq-heal","1");
    Promise.resolve()
      .then(()=>typeof caches!=="undefined"?caches.keys().then(ks=>Promise.all(ks.map(k=>caches.delete(k)))):null)
      .then(()=>navigator.serviceWorker&&navigator.serviceWorker.getRegistrations?navigator.serviceWorker.getRegistrations():[])
      .then(rs=>Promise.all(Array.from(rs).map(r=>r.unregister())))
      .catch(()=>{})
      .then(()=>location.reload());
  }else if(Q.length){
    sessionStorage.removeItem("srq-heal");
  }
}

/* classic script の const は window に載らない。物語層(story-encounter.js)が
   window.Q 経由で出題プールを引くため明示公開する(未公開だと物語戦の選抜が空になり
   章ボスでも通常修行の出題のままになる)。 */
if(typeof window!=="undefined"){ window.Q=Q; window.QBY=QBY; }
