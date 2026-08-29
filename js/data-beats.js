"use strict";
/* ============================================================
   data-beats.js — M5「ストーリー爆速進行」の物語ビート
   章内の節目(突入/中ボス撃破/科目ボス撃破/事件解決)ごとに
   1行の短いビートを差し込み、章クリア時は次の砦を予告する。
   ・全て自作の固定文字列(XSS安全)。話者スプライトは既存 px() のみ。
   ・ST.story["beat_種別_章"] / ["town_章"] で一度きり(周回グラインドで再表示しない)。
   ・DOM無し(テスト)や data-beats 未ロード環境でも安全(呼び出し側は typeof ガード)。
   北極星: 「毎回開けば話が一歩動く」。長文にせず、次を見たくさせる。
   ============================================================ */
/* 章の敵幹部スプライト(MSQ_STORY と一致) */
const BEAT_VILLAIN=["oni","helm","fire","ghost","bag","pill","sage","king","wiz"];
/* rush=突入 / mid=中ボス撃破 / boss=科目ボス撃破 / cas=事件解決 / town=次の砦到着(前章クリア時) */
const MSQ_BEATS={
 0:{rush:{sp:"hero",n:"あなた",t:"タイムカードが溶ける砦へ突入。奥に監督官ロウキが待つ。"},
    mid:{sp:"oni",n:"監督官ロウキ",t:"幹部を倒すとはな。だが36協定を知らねばワシは落とせん。"},
    boss:{sp:"hero",n:"あなた",t:"ロウキ討伐。焼け跡から、消えた社員の伝票が出てきた…"},
    cas:{sp:"hero",n:"あなた",t:"残業村の失踪の真相を暴いた。次なる砦へ向かおう。"}},
 1:{town:{sp:"hero",n:"あなた",t:"第2の砦ノーヘル工業。安全を『気合』で代用する工場が待つ。"},
    rush:{sp:"hero",n:"あなた",t:"安全装置を外した工場へ。鉄鬼どもの奥に安全鬼アンエイ。"},
    mid:{sp:"helm",n:"安全鬼アンエイ",t:"ケガは根性不足じゃ!ワシの安全神話は崩れんぞ。"},
    boss:{sp:"hero",n:"あなた",t:"アンエイ撃破。だが闇に眠る健診記録の匂いがする…"},
    cas:{sp:"hero",n:"あなた",t:"労災隠しの証拠を掴んだ。帝国の奥へ、まだ進める。"}},
 2:{town:{sp:"hero",n:"あなた",t:"第3の砦モミケシ運輸。労災を握り潰す配送網が広がる。"},
    rush:{sp:"hero",n:"あなた",t:"伝票を燃やすセンターへ突入。炎の奥にロウサイ大王。"},
    mid:{sp:"fire",n:"ロウサイ大王",t:"労災は自己責任!燃やせば証拠も痛みも消えるわ!"},
    boss:{sp:"hero",n:"あなた",t:"大王を鎮火。だが握り潰された一件が、まだ残っている…"},
    cas:{sp:"hero",n:"あなた",t:"もみ消された事故を白日の下に。次なる砦が呼んでいる。"}},
 3:{town:{sp:"hero",n:"あなた",t:"第4の砦ツカイステ派遣。契約を刻んで人を捨てる館だ。"},
    rush:{sp:"hero",n:"あなた",t:"細切れ契約の館へ。使い捨ての亡霊の奥に失業魔人。"},
    mid:{sp:"ghost",n:"シツギョウ魔人",t:"雇用保険?入れねば払わずに済む…お前も切ってやろう。"},
    boss:{sp:"hero",n:"あなた",t:"魔人を祓った。失業手当と再出発が、皆に届き始めた。"}},
 4:{town:{sp:"hero",n:"あなた",t:"第5の砦スルヌケ商会。保険料の『経費削減』が得意技の問屋。"},
    rush:{sp:"hero",n:"あなた",t:"保険料を踏み倒す問屋へ。金袋どもの奥に取立番長。"},
    mid:{sp:"bag",n:"取立番長",t:"払わぬが勝ちよ!取れるもんなら取ってみな、社労士!"},
    boss:{sp:"hero",n:"あなた",t:"番長を打ち倒す。帝国の金庫が、初めて軋む音を立てた。"}},
 5:{town:{sp:"hero",n:"あなた",t:"第6の砦ジヒバラ製薬。保険証を『勤続のご褒美』にする会社。"},
    rush:{sp:"hero",n:"あなた",t:"保険証を出し渋る工場へ。薬兵の奥にケンポ将軍。"},
    mid:{sp:"pill",n:"ケンポ将軍",t:"健康は自己管理!保険はワシの気分次第よ、フハハ!"},
    boss:{sp:"hero",n:"あなた",t:"将軍を撃破。だが保険証を握られた実習生の声が聞こえる…"},
    cas:{sp:"hero",n:"あなた",t:"実習生に保険証が渡った。帝国の中枢へ近づいている。"}},
 6:{town:{sp:"hero",n:"あなた",t:"第7の砦ナイナイ興業。『年金は都市伝説』と社員を洗脳する。"},
    rush:{sp:"hero",n:"あなた",t:"年金を否定する会社へ。信者どもの奥にコクネン仙人。"},
    mid:{sp:"sage",n:"コクネン仙人",t:"未納こそ賢者の道!払う者は愚者よ、フォッフォッフォ!"},
    boss:{sp:"hero",n:"あなた",t:"仙人を論破。だが未納で年金を失いかけた社員がいる…"},
    cas:{sp:"hero",n:"あなた",t:"『知らない』が一番高くつくと証明した。次の砦へ。"}},
 7:{town:{sp:"hero",n:"あなた",t:"第8の砦モグリ建設。全員を『一人親方』にして厚年から逃げる。"},
    rush:{sp:"hero",n:"あなた",t:"偽装請負の城へ。一人親方にされた職人の奥にコウネン皇帝。"},
    mid:{sp:"king",n:"コウネン皇帝",t:"雇わねば払わずに済む!それが帝王学というものよ!"},
    boss:{sp:"hero",n:"あなた",t:"皇帝を討つ。だが遺族年金を絶たれた家族の件が残る…"},
    cas:{sp:"hero",n:"あなた",t:"偽装を暴き、職人に厚生年金が付いた。残るは参謀のみ。"}},
 8:{town:{sp:"hero",n:"あなた",t:"帝国最後の砦ゼングレー総研。『法律は全部グレー』と囁く参謀。"},
    rush:{sp:"hero",n:"あなた",t:"参謀の館へ。灰色の霧の奥に、統計老師が待ち構える。"},
    mid:{sp:"wiz",n:"統計老師",t:"白と黒の間には無限の灰色…お前に読み切れるかな?"},
    boss:{sp:"hero",n:"あなた",t:"老師を看破。参謀が去り、帝国の玉座が露わになった。"}}
};
/* ビート1枚を画面下部に短く表示(story-ovl の全画面寸劇とは別。タップ/数秒で消える)。
   prefers-reduced-motion では浮遊/フェードを止め、静かに出す。DOM未対応環境では何もしない。 */
let beatTO=null;
function beatShow(sp,n,t){
  if(typeof document==="undefined"||!document.body||typeof document.body.appendChild!=="function")return;
  const old=document.getElementById("beatOvl");if(old&&old.remove)old.remove();
  if(beatTO){clearTimeout(beatTO);beatTO=null;}
  const red=(typeof prefersReduce==="function"&&prefersReduce());
  const d=document.createElement("div");
  d.id="beatOvl";d.className="beat-ovl"+(red?"":" beat-pop");
  d.setAttribute("style","position:fixed;left:50%;bottom:80px;transform:translateX(-50%);z-index:72;width:min(430px,92vw);display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:14px;background:linear-gradient(135deg,rgba(51,48,62,.97),rgba(110,95,160,.97));box-shadow:0 10px 28px rgba(0,0,0,.36);border:1px solid rgba(255,217,138,.55)"+(red?"":";animation:beatPop .32s ease"));
  const face=(typeof px==="function")?px(sp,42,red?"":"floaty"):"";
  const esq=(typeof esc==="function")?esc:(x=>String(x));
  d.innerHTML=`<span style="flex:0 0 auto">${face}</span>
    <span style="flex:1;color:#fff;min-width:0">
      <span style="display:block;font-size:10px;font-weight:900;color:#FFD98A">${esq(n)}</span>
      <span style="display:block;font-size:12px;line-height:1.45;margin-top:2px">${esq(t)}</span>
    </span>
    <span style="flex:0 0 auto;font-size:9px;color:#CFCBDE">タップ▶</span>`;
  d.onclick=()=>{if(d.remove)d.remove();if(beatTO){clearTimeout(beatTO);beatTO=null;}};
  document.body.appendChild(d);
  beatTO=setTimeout(()=>{const e=document.getElementById("beatOvl");if(e&&e.remove)e.remove();beatTO=null;},4400);
}
/* 章の節目ビート。一度きり。表示できたら true。 */
function msqBeat(kind,ch){
  if(typeof ST==="undefined"||!ST.story)return false;
  if(ch==null||ch<0||ch>8)return false;
  const row=MSQ_BEATS[ch];if(!row)return false;
  const b=row[kind];if(!b)return false;
  const key="beat_"+kind+"_"+ch;
  if(ST.story[key])return false;
  ST.story[key]=1;if(typeof saveST==="function")saveST();
  beatShow(b.sp,b.n,b.t);
  return true;
}
/* 次の砦の予告(前章クリア時)。一度きり。 */
function townTeaser(ch){
  if(typeof ST==="undefined"||!ST.story)return false;
  if(ch==null||ch<1||ch>8)return false;
  const row=MSQ_BEATS[ch];if(!row||!row.town)return false;
  const key="town_"+ch;
  if(ST.story[key])return false;
  ST.story[key]=1;if(typeof saveST==="function")saveST();
  beatShow(row.town.sp,row.town.n,row.town.t);
  return true;
}
if(typeof window!=="undefined"){
  window.MSQ_BEATS=MSQ_BEATS;window.beatShow=beatShow;window.msqBeat=msqBeat;window.townTeaser=townTeaser;
}
