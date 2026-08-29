"use strict";
/* ============================================================
   core/normalize.js — 問題データの正規化(新旧スキーマ互換)
   旧: {id,s,q,a,e,sourceYear?,lawRevisionNote?}
   新: {id,subject,topic,format,difficulty,question,answer,
        easyExplanation,ruleExplanation,whyWrong,trap,example,
        comparison,mnemonic,errorPart,correction,segments,errorIndex,
        choices,source,examYear,lawAsOf,revisionStatus,reviewStatus,
        tags,relatedQuestionIds,caseOnly}
   どちらの形式でも読み込め、旧コード(q.q/q.a/q.e/q.s)も新コードも動く。
   id は恒久ID(数値=旧世代、文字列=新世代)。配列順序に意味を持たせない。
   ============================================================ */
const Q_FORMATS=["true_false","tap_error","choice","fill_blank","reorder","consult","sentaku"];
function normalizeQuestion(r){
  const n=r; /* 破壊的でOK(データファイル由来のオブジェクト) */
  n.s=(r.s!==undefined)?r.s:r.subject;
  n.subject=n.s;
  n.q=r.q||r.question||"";
  n.question=n.q;
  n.a=(r.a!==undefined)?r.a:r.answer;
  n.answer=n.a;
  n.ruleExplanation=r.ruleExplanation||r.e||"";
  n.e=r.e||n.ruleExplanation;
  n.format=Q_FORMATS.includes(r.format)?r.format:"true_false";
  n.difficulty=r.difficulty||2;
  n.topic=r.topic||"";
  n.easyExplanation=r.easyExplanation||"";
  n.whyWrong=r.whyWrong||"";
  n.trap=r.trap||"";
  n.example=r.example||"";
  n.mnemonic=r.mnemonic||"";
  n.comparison=Array.isArray(r.comparison)?r.comparison:null;
  n.errorPart=r.errorPart||"";
  n.correction=r.correction||"";
  n.segments=Array.isArray(r.segments)?r.segments:null;
  n.errorIndex=(typeof r.errorIndex==="number")?r.errorIndex:-1;
  n.choices=Array.isArray(r.choices)?r.choices:null;
  n.kosuu=!!r.kosuu; /* 個数問題(正しいものはいくつあるか): statements[]=ア〜オ、choices=一つ〜五つ */
  n.statements=Array.isArray(r.statements)?r.statements:null;
  n.premium=!!r.premium; /* 将来のペイウォール用タグのみ(課金ロジックはない=全機能アクセス可) */
  n.nendo=!!r.nendo; /* 年度別過去問(裏面モード)の問題。一般プール・悪魔/神プールへ混ぜない */
  n.tier=r.tier||""; /* 課金設計の下地: "paid"=有料想定の年度セット(gateは無効・全アクセス可) */
  n.reorder=Array.isArray(r.reorder)?r.reorder:null;
  n.reorderPrompt=r.reorderPrompt||"";
  /* 本試験の選択式(sentaku): 長文passageの空欄【A】〜【E】に、20の選択肢から語句を割り当てる形式。
     passage=本文(空欄は [[A]]〜[[E]] マーカー) / blanks=[{key,ok:optionsのindex}]×5 / options=語句20個。
     examFmt(五肢択一)とは別枠=悪魔/神プールへは混ぜない(sentakuIds が専用に集める)。 */
  n.sentaku=!!r.sentaku||r.format==="sentaku";
  n.passage=r.passage||"";
  n.blanks=Array.isArray(r.blanks)?r.blanks:null;
  n.options=Array.isArray(r.options)?r.options:null;
  n.source=r.source||"";
  n.examYear=r.examYear||(r.sourceYear?r.sourceYear+1:0);
  n.lawAsOf=r.lawAsOf||"";
  n.revisionStatus=r.revisionStatus||"";
  n.reviewStatus=r.reviewStatus||"verified";
  n.tags=Array.isArray(r.tags)?r.tags:[];
  n.relatedQuestionIds=Array.isArray(r.relatedQuestionIds)?r.relatedQuestionIds:[];
  n.caseOnly=!!r.caseOnly;
  return n;
}
/* 全問バンク構築。
   Q   = 一般出題プール(caseOnly・examFmt・未監修を除く。既存コードの Q.filter/Q.map はすべてこれ)
   QBY = 全問Map(事件専用問題・本試験形式問題を含む)。参照は必ず qById(id) 経由。
   examFmt(五肢択一・本試験形式)は caseOnly と同様に一般学習プール(修行・復習等)へ混ぜず、
   試験の悪魔/試験の神(本試験系モード)が専用に出題する(examFmtIds/examPastIds 経由)。 */
function buildBank(parts,enrich){
  const all=parts.flat().map(normalizeQuestion);
  if(enrich)for(const q of all){
    const p=enrich[String(q.id)];
    if(p){Object.assign(q,p);normalizeQuestion(q);}
  }
  const by=new Map();
  for(const q of all)by.set(String(q.id),q);
  const pool=all.filter(q=>!q.caseOnly&&!q.examFmt&&!q.nendo&&!q.sentaku&&q.format!=="sentaku"&&q.reviewStatus!=="unverified")
                .sort((a,b)=>(typeof a.id==="number"&&typeof b.id==="number")?a.id-b.id:String(a.id).localeCompare(String(b.id)));
  return {pool,by};
}
