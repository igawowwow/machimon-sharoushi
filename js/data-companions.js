"use strict";
/* ============================================================
   data-companions.js — 仲間(事務所メンバー)。章クリアで加入し、
   パッシブ効果でパーティを強化する。冒険RPGの成長の第2軸(装備とは別)。
   効果キー: dmg(攻撃+)/coin(コイン%)/xp(XP%)/t(制限時間+秒)/hint(誤答肢除外)/heal(初期ライフ+)
   加入条件: joinCh章をクリアで自動加入。 ============================================================ */
const COMPANIONS=[
 {id:"cp0",joinCh:0,sp:"medal",name:"新人補助・みどり",fx:{coin:10},
  join:"「私も事務所の一員です!コイン集め、任せてください!」",desc:"獲得コイン+10%"},
 {id:"cp1",joinCh:1,sp:"helm",name:"安全衛生の番人・鉄さん",fx:{heal:1},
  join:"「現場40年の勘、なめんなよ。お前のライフ、俺が1つ余分に守る」",desc:"バトル開始時ライフ+1"},
 {id:"cp2",joinCh:2,sp:"daruma",name:"労災専門・さくら先生",fx:{dmg:1},
  join:"「労災は人の人生そのもの。だから私は、全力で戦う」",desc:"攻撃力+1"},
 {id:"cp3",joinCh:3,sp:"scroll",name:"元派遣・タクミ",fx:{xp:15},
  join:"「使い捨てられた分、誰よりも学んだ。その知識、分けてやる」",desc:"獲得XP+15%"},
 {id:"cp4",joinCh:4,sp:"bag",name:"徴収の達人・銭形",fx:{coin:15},
  join:"「数字は嘘をつかん。取りこぼしは、わしが許さん」",desc:"獲得コイン+15%"},
 {id:"cp5",joinCh:5,sp:"pill",name:"健保のナース・あおい",fx:{t:3},
  join:"「あわてないで。深呼吸。時間なら、私が少し稼いであげる」",desc:"制限時間+3秒"},
 {id:"cp6",joinCh:6,sp:"sage",name:"年金仙人・玄斎",fx:{hint:1},
  join:"「未納で苦しむ者を、もう見とうない。迷える肢、一つ消してしんぜよう」",desc:"択一・穴埋めで誤答肢を1つ除外"},
 {id:"cp7",joinCh:7,sp:"king",name:"厚年の重鎮・大黒",fx:{dmg:1,coin:5},
  join:"「二階の年金は、働く者の誇りだ。ワシも前線に立とう」",desc:"攻撃力+1・コイン+5%"},
 {id:"cp8",joinCh:8,sp:"wiz",name:"統計博士・グレー改め白露",fx:{xp:10,t:2},
  join:"「灰色の霧は晴れた。これからは、君の合格のために統計を使う」",desc:"XP+10%・制限時間+2秒"}
];
const CP=Object.create(null);COMPANIONS.forEach(c=>CP[c.id]=c);
/* 加入済み仲間のパッシブ合計(効果キー別) */
function cpBonus(key){
  let v=0;
  for(const c of COMPANIONS){if(ST.party&&ST.party[c.id]&&c.fx[key])v+=c.fx[key];}
  return v;
}
/* 章クリア等で加入判定。新規加入した仲間の配列を返す */
function cpCheckJoin(){
  const got=[];
  for(const c of COMPANIONS){
    if(ST.party&&ST.party[c.id])continue;
    if(ST.msq&&(ST.msq.ch>c.joinCh||ST.msq.done)){ST.party[c.id]=1;got.push(c);}
  }
  return got;
}
