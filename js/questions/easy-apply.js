"use strict";
/* やさしい解説(QEASY)を問題データに載せる。問題ファイルと easy0〜8.js の後、data-questions.js(問題バンクの組み立て)の前に読む。
   すでに easyExplanation を持つ問題(手書きの詳しい解説がある問題)は上書きしない。 */
(function(){
  var G=(typeof window!=="undefined")?window:globalThis;
  var E=G.QEASY, P=G.QPARTS;
  if(!E||!P)return;
  for(var i=0;i<P.length;i++){
    var q=P[i];
    if(!q||q.id===undefined||q.easyExplanation)continue;
    var t=E[String(q.id)];
    if(t)q.easyExplanation=t;
  }
})();
