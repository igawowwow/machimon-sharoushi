"use strict";
/* ============ ドット絵エンジン+スプライト ============ */
function makePx(rows,pal,scale=8,outline){
  const h=rows.length,w=rows[0].length;
  const c=document.createElement("canvas");c.width=w*scale;c.height=h*scale;
  const x=c.getContext("2d");
  /* outline=色 を渡すと、シルエット外周に暗い輪郭線を1px描く(勇者30風のクリーンな塊感)。
     既定(未指定)では従来どおり輪郭なし=他スプライトは無影響。 */
  if(outline){
    const F=[];for(let y=0;y<h;y++){F[y]=[];const r=rows[y];for(let i=0;i<w;i++){const ch=r[i];F[y][i]=!(ch==="."||!pal[ch]);}}
    x.fillStyle=outline;
    for(let y=0;y<h;y++)for(let i=0;i<w;i++){ if(F[y][i])continue;
      let adj=false;
      for(let dy=-1;dy<=1&&!adj;dy++)for(let dx=-1;dx<=1;dx++){ if(!dx&&!dy)continue; const ny=y+dy,nx=i+dx; if(ny>=0&&ny<h&&nx>=0&&nx<w&&F[ny][nx]){adj=true;break;} }
      if(adj)x.fillRect(i*scale,y*scale,scale,scale);
    }
  }
  rows.forEach((r,y)=>{for(let i=0;i<r.length;i++){const ch=r[i];
    if(ch==="."||!pal[ch])continue;x.fillStyle=pal[ch];x.fillRect(i*scale,y*scale,scale,scale);}});
  return c.toDataURL();
}
function px(key,size,cls=""){return `<img class="px ${cls}" src="${PX[key]}" style="width:${size}px;height:${size}px">`;}

const P={K:"#33303E",W:"#FFFFFF",R:"#E8484F",O:"#FF8A3D",Y:"#FFD34D",G:"#3E9B4F",B:"#5B8DFF",
 S:"#F5C89A",H:"#9AA0A8",P:"#8A6FD1",M:"#FF6B9D",T:"#3ED6C0",D:"#C58900",E:"#7A5040"};

const SPRITES={
oni:[ "..Y......Y..","..YY....YY..","...RRRRRR...","..RRRRRRRR..",".RRWWRRWWRR.",".RRKWRRKWRR.",".RRRRRRRRRR.",".RWWWWWWWWR.","..RRWKKWRR..","...RRRRRR...","..RR....RR..",".RR......RR."],
helm:["....YYYY....","..YYYYYYYY..",".YYYYYYYYYY.",".YYDYYYYDYY.","...SSSSSS...","..SWKSSKWS..","..SSSSSSSS..","..SSKKKKSS..","...SSSSSS...","..GGGGGGGG..",".GGYGGGGYGG.","..G......G.."],
fire:[".....R......","....RR..R...","...RRR.RR...","..RRRRRRRR..",".RROOOOOORR.",".ROOYYYYOOR.",".ROYKYYKYOR.",".ROYYYYYYOR.",".RROYWWYORR.","..ROOOOOOR..","...RROORR...","....RRRR...."],
ghost:["...BBBBBB...","..BBBBBBBB..",".BBBBBBBBBB.",".BBWWBBWWBB.",".BBKWBBKWBB.",".BBBBBBBBBB.",".BBBWWWWBBB.",".BBBBBBBBBB.",".BBBBBBBBBB.",".BB.BBB.BB..",".B...B...B..","............"],
bag:[".....GG.....","....G..G....","...GGGGGG...","..GGGGGGGG..",".GGGGGGGGGG.",".GGWWGGWWGG.",".GGKWGGKWGG.",".GGGGGGGGGG.",".GGGYYYYGGG.",".GGYYDDYYGG.",".GGGYYYYGGG.","..GGGGGGGG.."],
pill:["...RRRRRR...","..RRRRRRRR..",".RRRRRRRRRR.",".RRRRRRRRRR.",".WWWWWWWWWW.",".WWKWWWWKWW.",".WWWWWWWWWW.",".WWWKKKKWWW.",".WWWWWWWWWW.","..WWWWWWWW..","...WWWWWW...","............"],
sage:["....HHHH....","...HHHHHH...","..SSSSSSSS..","..SKSSSSKS..","..SSSSSSSS..",".WWWWWWWWWW.",".WWWWWWWWWW.","..WWWWWWWW..","...WWWWWW...","..PPPPPPPP..","..PPYPPYPP..","...P....P..."],
king:["..Y.YY.Y....","..YYYYYY....","..YRYYRY....","...SSSSSS...","..SSSSSSSS..","..SKSSSSKS..","..SSSSSSSS..","..SSKKKKSS..","...SSSSSS...",".PPPPPPPPPP.",".PPYPPPPYPP.",".PPPPPPPPPP."],
wiz:[".....PP.....","....PPPP....","...PPPPPP...","..PPPPPPPP..",".PPPPPPPPPP.","...SSSSSS...","..SRSSSSRS..","..SSSSSSSS..",".PPPPPPPPPP.",".PPWPPPPWPP.","..PPPPPPPP..","..PP.PP.PP.."],
god:["..Y.Y..Y.Y..","...YYYYYY...","...SSSSSS...","..SSSSSSSS..","..SRSSSSRS..","..SSSSSSSS..",".WWWWWWWWWW.",".WWWWWWWWWW.","..WWWWWWWW..",".YYYYYYYYYY.",".YYWYYYYWYY..","..YY.YY.YY.."],
hero:["....HHHH....","...HHHHHH...","...SSSSSS...","...SKSSKS...","...SSSSSS...","..BBBBBBBB..",".BBWBBBBWBB.","..BBBBBBBB..","..BB.BB.BB..","...B....B...","............","............"],
coin:["..YYYY..",".YYYYYY.","YYYDDYYY","YYDYYDYY","YYDYYDYY","YYYDDYYY",".YYYYYY.","..YYYY.."],
pen:["........RR..",".......RRRR.","......RRRR..",".....RRRR...","....RRRR....","...RRRR.....","..RRRR......",".YRRR.......","YYRR........","KY..........","............","............"],
pens:["....RR...BB.","...RRRR.BBBB","..RRRR.BBBB.",".RRRR.BBBB..","RRRR.BBBB...","RRR.BBBB....","YR.YBBB.....","KY.YBB......","...KY.......","............","............","............"],
marker:["........MM..",".......MMMM.","......MMMM..",".....MMMM...","....MMMM....","...MMMM.....","..MMMM......",".WMMM.......","WWMM........","KW..........","............","............"],
hammer:["..KKKKKKK...","..KDDDDDK...","..KDDDDDK...","..KKKKKKK...","......E.....","......EE....","......EE....","......EE....","......EE....","......EE....","......EE....","............"],
band:["............","WWWWWWWWWWWW","WRRWWWWWWRRW","WWWWWRRWWWWW","WWWWRRRRWWWW","WWWWWRRWWWWW","WWWWWWWWWWWW","..WW....WW..","...WW..WW...","............","............","............"],
brush:["........DD..",".......DDDD.","......DDDD..",".....DDDD...","....DDDD....","...DDDD.....","..KKKK......",".KKKK.......","KKK.........","RK..........","............","............"],
excal:[".....YY.....",".....YY.....","..Y..YY..Y..","..YYYYYYYY..",".....WW.....",".....WW.....",".....WW.....",".....WW.....",".....WW.....","....KWWK....",".....KK.....","............"],
omamori:["...KKKKK....","..K.....K...","..KYYYYYK...","..YYYYYYY...","..YRRRRRY...","..YRWWWRY...","..YRWWWRY...","..YRRRRRY...","..YYYYYYY...","...YYYYY....","....YYY.....","............"],
shield:["..KKKKKKK...",".KWWWWWWWK..",".KWBBBBBWK..",".KWBWWWBWK..",".KWBBBBBWK..",".KWBWWWBWK..",".KWBBBBBWK..","..KWBBBWK...","...KWBWK....","....KWK.....",".....K......","............"],
wing:["..M......M..",".MMM....MMM.","MMWMM..MMWMM","MMWWMMMMWWMM",".MWWWMMWWWM.","..MWWWWWWM..","...MWWWWM...","....MWWM....",".....MM.....","............","............","............"],
clock1:["...KKKKK....","..KYYYYYK...",".KYYYKYYYK..",".KYYYKYYYK..",".KYKKKYYYK..",".KYYYYYYYK..","..KYYYYYK...","...KKKKK....","............","............","............","............"],
clock2:["..KKKKKKK...","..KYYYYYK...","...KYYYK....","....KYK.....",".....K......","....KYK.....","...KYYYK....","..KYYYYYK...","..KKKKKKK...","............","............","............"],
scepter:[".....YY.....","....YDDY....","....YDDY....",".....YY.....",".....KK.....",".....KK.....",".....KK.....",".....KK.....",".....KK.....","....KKKK....","............","............"],
potion:["....KKK.....","....K.K.....","...KKKKK....","..KT...TK...",".KTTTTTTTK..",".KTTWTTTTK..",".KTTTTTTTK..",".KTTTTTTTK..","..KTTTTTK...","...KKKKK....","............","............"],
heart:["............",".MM....MM...","MMMM..MMMM..","MMMMMMMMMM..","MMMMMMMMMM..",".MMMMMMMM...","..MMMMMM....","...MMMM.....","....MM......","............","............","............"],
star:[".....Y......","....YYY.....","...YYYYY....","YYYYYYYYYYY.",".YYYYYYYYY..","..YYYYYYY...","..YYYYYYY...",".YYYY.YYYY..",".YY.....YY..","............","............","............"],
trophy:["..YYYYYYYY..","..YYYYYYYY..",".DYYYYYYYYD.",".DYYYYYYYYD.","..YYYYYYYY..","...YYYYYY...","....YYYY....",".....YY.....","....YYYY....","...YYYYYY...","..DDDDDDDD..","............"],
skull:["...WWWWWW...","..WWWWWWWW..",".WWWWWWWWWW.",".WWKKWWKKWW.",".WWKKWWKKWW.",".WWWWWWWWWW.","..WWWKKWWW..","..WWWWWWWW..","...W.WW.W...","...W.WW.W...","............","............"]
};
const PX={};for(const k in SPRITES)PX[k]=makePx(SPRITES[k],P);

/* ===== v3 追加スプライト ===== */
const SPRITES2={
chest:["............","..EEEEEEEE..",".EDDDDDDDDE.",".EDYYYYYYDE.",".EEEEEEEEEE.",".EDDDYYDDDE.",".EDDDYDDDDE.",".EDDDDDDDDE.",".EDDDDDDDDE.",".EEEEEEEEEE.","............","............"],
gachaball:["....Y.......","...PPPP..Y..","..PPPPPPP...",".PPWWPPPPPP.",".PPWPPPPPPP.",".PPPPPPPPPP.",".PPPPPPPPPP.","..PPPPPPPP..","...PPPPPP...","....DDDD....","...DDDDDD...","............"],
armor:["............",".BB......BB.",".BBBBBBBBBB.",".BBWBBBBWBB.",".BBBBBBBBBB.","..BBBBBBBB..","..BBWWWWBB..","..BBBBBBBB..","...BBBBBB...","...BBBBBB...","............","............"],
suit:["............",".KK......KK.",".KKKKKKKKKK.",".KKKWWWWKKK.",".KKKWRRWKKK.","..KKWRRWKK..","..KKWRRWKK..","..KKKKKKKK..","...KKKKKK...","...KKKKKK...","............","............"],
megami:["....YYYY....","...Y....Y...","...SSSSSS...","..SKSSSSKS..","...SSSSSS...",".MMWWWWWWMM.","MMMWWWWWWMMM",".MMWWWWWWMM.","..WWWWWWWW..","...WWWWWW...","............","............"],
daruma:["...RRRRRR...","..RRRRRRRR..",".RRWWWWWWRR.",".RWWKWWKWWR.",".RWWWWWWWWR.",".RRWWKKWWRR.",".RRRWWWWRRR.",".RRRRRRRRRR.",".RRRRRRRRRR.","..RRRRRRRR..","............","............"],
scroll:["............",".WWWWWWWWW..",".WKKKKKKKW..",".WWWWWWWWW..",".WKKKKKWWW..",".WWWWWWWWW..",".WKKKKKKKW..",".WWWWWWWWW..",".WWWWWWWWW..",".DDDDDDDDD..","............","............"],
medal:["....RRRR....","....RBBR....","....RBBR....","...YYYYYY...","..YYYYYYYY..",".YYYDDDDYYY.",".YYDYYYYDYY.",".YYDYYYYDYY.",".YYYDDDDYYY.","..YYYYYYYY..","...YYYYYY...","............"],
crown2:["............",".Y...YY...Y.",".YY..YY..YY.",".YYY.YY.YYY.",".YYYYYYYYYY.",".YYYYYYYYYY.",".YDYYDDYYDY.",".YYYYYYYYYY.","............","............","............","............"],
ticket:["............","............",".YYYYYYYYYY.",".YWWWWWWWWY.",".YWKWKWKWWY.",".YWWWWWWWWY.",".YWKWKWKWWY.",".YWWWWWWWWY.",".YYYYYYYYYY.","............","............","............"]
};
for(const k in SPRITES2){SPRITES[k]=SPRITES2[k];PX[k]=makePx(SPRITES2[k],P);}
/* 厚生労働神(真ラスボス): 神スプライトのダーク配色 */
PX.mao=makePx(SPRITES.god,Object.assign({},P,{W:"#4A3F73",Y:"#FFD34D",S:"#B49CE8",R:"#FF5A5A"}));
SPRITES.mao=SPRITES.god;

/* ===== D1: 装備大増量(コレクション)向け 追加スプライト =====
   新形状は SPRITES3、同形状の色違い(シリーズの色分け)は SP_RECOLOR で生成。
   すべて px() で描画=ゼロ依存・幅480px。既存キーは一切変更しない(末尾追加のみ)。 */
const SPRITES3={
katana:["..........HH",".........HH.","........HH..",".......HH...","......HH....",".....HH.....","....HH......","...HH.......","..DDD.......",".EE.........","EE..........","............"],
axe:["....HHHHH...","...HHHHHHH..","..HHHHHHHHH.","..HHH...HHH.",".....EE.....",".....EE.....",".....EE.....",".....EE.....",".....EE.....",".....EE.....",".....EE.....","............"],
spear:[".....H......","....HHH.....","....HHH.....","....HHH.....",".....H......",".....E......",".....E......",".....E......",".....E......",".....E......",".....E......",".....E......"],
gavel:["..DDDDD.....",".DDDDDDD....",".DDDDDDD....","..DDDDD.....","....EE......","....EE......","....EE......","...EEEE.....",".DDDDDDDD...",".DDDDDDDD...","............","............"],
helmet2:[".Y......Y...",".YY....YY...","..KKKKKKKK..",".KKKKKKKKKK.",".KKRRRRRRKK.",".KKKKKKKKKK.","..KKKKKKKK..","...KKKKKK...","..KK.KK.KK..","..K..KK..K..","............","............"],
cloak:["..R....R....",".RRR..RRR...",".RRRRRRRR...",".RRWWWWRR...",".RRWWWWRR...",".RRRRRRRR...",".RRRRRRRR...","..RRRRRR....","..RR..RR....","..R....R....","............","............"],
glasses:["............","............","..KKK.KKK...",".K...K...K..",".K.B.K.B.K..",".K...K...K..","..KKK.KKK...","............","............","............","............","............"],
ring:["............","....TT......","...D..D.....","..D....D....","..D....D....","...D..D.....","....DD......","............","............","............","............","............"],
gem:["...WW.......","..MMMM......",".MMMMMM.....","MMMMMMMM....",".MMMMMM.....","..MMMM......","...MM.......","............","............","............","............","............"],
abacus:[".EEEEEEEE...",".EDDDDDDE...",".EYDYDYDE...",".EDDDDDDE...",".EDYDYDYE...",".EDDDDDDE...",".EEEEEEEE...","............","............","............","............","............"],
bell:["....DD......","...DDDD.....","..DDDDDD....","..DDDDDD....",".DDDDDDDD...",".DDDDDDDD...","DDDDDDDDDD..",".KKKKKKKK...","....DD......","............","............","............"],
fan:[".RRRRRRR....","RRRRRRRRR...","RRWRRRWRR...","RRRRRRRRR...",".RRRRRRR....","....E.......","....E.......","....E.......","...EEE......","............","............","............"]
};
for(const k in SPRITES3){SPRITES[k]=SPRITES3[k];PX[k]=makePx(SPRITES3[k],P);}
/* パレット替え=同形状・別配色(シリーズごとの色分け・色違いコレクション) */
const SP_RECOLOR=[
 ["pen_b","pen",{R:"#5B8DFF"}],["pen_h","pen",{R:"#9AA0A8"}],
 ["katana_r","katana",{H:"#8A6FD1",D:"#FFD34D"}],
 ["scepter_t","scepter",{Y:"#3ED6C0",D:"#2AA894"}],["scepter_p","scepter",{Y:"#FFD34D",D:"#8A6FD1"}],
 ["excal_g","excal",{W:"#FFD34D",Y:"#FF8A3D"}],
 ["armor_p","armor",{B:"#8A6FD1"}],["armor_g","armor",{B:"#C58900"}],
 ["suit_b","suit",{W:"#5B8DFF"}],["shield_t","shield",{B:"#3ED6C0"}],
 ["omamori_t","omamori",{R:"#2AA894",Y:"#3ED6C0"}],["band_g","band",{R:"#3E9B4F"}],
 ["wing_g","wing",{M:"#C58900"}],["gem_t","gem",{M:"#3ED6C0"}],
 ["trophy_p","trophy",{Y:"#8A6FD1",D:"#5B3D9E"}],["trophy_t","trophy",{Y:"#3ED6C0",D:"#2AA894"}],
 ["medal_g","medal",{R:"#C58900"}],["medal_b","medal",{R:"#5B8DFF"}],
 ["crown_c","crown2",{Y:"#FF6B9D",D:"#C58900"}],["star_p","star",{Y:"#8A6FD1"}],
 ["brush_g","brush",{D:"#3E9B4F"}],["helmet_r","helmet2",{K:"#7A2020",R:"#FFD34D"}]
];
for(const rc of SP_RECOLOR){const k=rc[0],base=rc[1],over=rc[2];if(SPRITES[base]){SPRITES[k]=SPRITES[base];PX[k]=makePx(SPRITES[base],Object.assign({},P,over));}}
/* ===== 物語用 立ち絵（バスト型 18x18・人物として描く）=====
   これまで物語の話者/敵は item/monster アイコン(medal/oni等)を流用しており「人に見えない」
   と指摘。ここで役割の分かる人物バストを用意し、SPEAKERS/敵の px をこれに差し替える。 */
const BPAL={".":null,K:"#20161f",o:"#3a2a33",W:"#ffffff",S:"#f4c9a0",s:"#d99f77",
 R:"#e8484f",r:"#a82d34",O:"#ff8a3d",Y:"#ffd34d",y:"#c8981f",G:"#4cb35a",g:"#2f7d3c",
 B:"#5b8dff",b:"#33518f",P:"#8a6fd1",p:"#5b4590",M:"#ff6b9d",T:"#3ed6c0",D:"#c58900",
 d:"#8a5e00",E:"#7a5040",e:"#4a2f24",H:"#c9cdd6",h:"#8f95a1",N:"#2a2f3a",n:"#171a22",F:"#f2e4c8"};
const _p18=a=>a.map(r=>(r+"..................").slice(0,18));
const BUSTS={
 hero_app:["......eeeee",".....eeEEEee","....eESSSSSEe","....eSSSSSSSs","....eSKSSKSSs","....eSSSSSSSs",".....sSSMSss",".....ssSSSss",".....FFFFFFF","....GGFFWFFGG","...GGGFFWFFGGG","..GGGGFFdFFGGGG","..GGGGFFFFFFGGGG","..GGgGFFFFFFGgGG","..gggGFFFFFFGggg","...ggGFFFFFFGgg","....gGFFFFFFGg","....gg......gg"],
 kai:["...r.rRr.r","..rRrRRRrRr",".rRRRRRRRRRr","..RWWWWWWWR","..sSSSSSSSs","..sSKSSKSSs","..sSSSSSSSs","...sSrrSss","...ssSSSss","...EEEEEEEE","..EEeeEEeeEE",".EEeRRWRReeEE",".EEeeRRRReeEE",".EeEERRRREEeE",".EeEEEEEEEEeE",".EeeEEEEEEeeE","..EEEEEEEEEE","...EE....EE"],
 mina:["...bbbbbbbb","..bbBBBBBBbb",".bbBSSSSSSBbb",".bBSSSSSSSSBb",".bBWKWSWKWSBb",".bBSSSSSSSSBb",".bbSSSTTSSSb","..bSSSSSSSb","..bFFFFFFFb",".FFFFFWWFFFFF","FFFFFFWWFFFFFF","FFFFFTTTTFFFFF","FFFFFFFFFFFFFF",".FFFFFFFFFFFF",".FbFFFFFFFFbF","..bFFFFFFFFb","..bFFFFFFFFb","...bb....bb"],
 zen:["...hhhhhhhh","..hhHHHHHHhh",".hhHSSSSSSHhh",".hHSSSSSSSSHh",".hHSSKSSKSSHh",".hHSSSSSSSSHh",".hhHSSSSSSHhh","..hhhHWWHhhh","...hhhhhhhh","..FFFFFFFFFF",".FFFdddddddFF",".FFdDDDDDDDdFF",".FFFdddddddFF",".FFFFFFFFFFFF",".FFFFFFFFFFFF","..FFFFFFFFFF","..FFFFFFFFFF","...FF....FF"],
 yurius:["....dDYYYYDd","...yYYYYYYYYy","..yYSSSSSSSSYy","..YSSSSSSSSSSy","..YSSKSSKSSSy","..YSSSSSSSSSy","...YSSWWSSSy","...yySSSSyy","..WWWWWWWWWW",".WWWddddddWWW","WWWdDDDDDDdWWW","WWdDDWWWWDDdWW","WWdDDWWWWDDdWW","WWWdDDDDDDdWWW","WWWWddddddWWWW",".WWWWWWWWWWWW","..WWWWWWWWWW","...WWW..WWW"],
 gard:["...nnnnnnnn","..nnnnnnnnnn","..nsSSSSSSsn","..sSSSSSSSSs","..sSKSSKSrSs","..sSSSSSSSSs","...sSSrrSss","...ssSSSss","..NNNNNNNNNN",".NNNnNNNNnNNN","NNNNnNNNNnNNNN","NNdDNnNNNnNNNN","NNDDNNNNNNNNNN","NNdDNNNNNNNNNN","NNNNNNNNNNNNNN",".NNNNNNNNNNNN","..NNNNNNNNNN","...NN....NN"],
 foreman:["....hhhhhh","...hsssssssh","..hsSSSSSSSsh","..sSSSSSSSSSs","..sSrKSSKrSSs","..sSSSSSSSSSs","..ssSSrrrSSs","...sssSSSss","..EEEEEEEEEE",".EEEEEsEEsEEEE","EEEEEsSSSSsEEEE","EEEEEEddEEEEEE","EEEEEEEEEEEEEE","EEEEEEEEEEEEEE","EEeEEEEEEEEeEE",".EEEEEEEEEEEE","..EEEEEEEEEE","..EEE....EEE"],
 sora:["...HHHHHHHH","..HHHHHHHHHH","..HHHHHHHHHH","...eSSSSSSe","...sSKSSKSs","...sSSSSSSs","....sSssSs","....ssSSss","....hhhhhh","...hhhWWhhh","..hhhhWWhhhh","..hhhhbbhhhh","..hhhhhhhhhh","..hhhhhhhhhh","..hhhhhhhhhh","...hhhhhhhh","...hhhhhhhh","....hh..hh"],
 hanna:["....PPPP","...pPPPPp","..PPPPPPPP",".PpSSSSSSpP",".PSSKSSKSSP",".PSSSSSSSSP",".pSSSMMSSSp","..sSSSSSSs","..rrrrrrrr",".rrrrWWrrrr","rrrrrWWrrrrr","rrrrrWWrrrrr","rrrrrrrrrrrr","rrrrrrrrrrrr",".rrrrrrrrrr",".rrrrrrrrrr","..rrrrrrrr","..rr....rr"],
 ren:["...eeeeeeee","..eeeeeeeeee","..esSSSSSSse","..sSSSSSSSSs","..sShKShKSSs","..sSSSSSSSSs","...sSSooSss","...ssSSSss","..hhhhhhhhhh",".hhhhhbbhhhh","hhhhhhbbhhhhh","hhhhhhhhhhhhh","hhhhdhhhhdhhh","hhhhhhhhhhhhh","hhhhhhhhhhhhh",".hhhhhhhhhh","..hhhhhhhh","..hh....hh"],
 e_boss:["..hhhhhhhhhh","..nnnnnnnnnn","..nsSSSSSSsn","..sSSSSSSSSs","..sSRKSSKRSs","..sSSSSSSSSs","...sSssssSs","...ssSMMSs","..NNNNNNNNNN",".NNNWWRRWWNNN","NNNNWWRRWWNNNN","NNNNNWRRWNNNNN","NNdNNWRRWNNdNN","NNNNNNRRNNNNNN","NNNNNNRRNNNNNN",".NNNNNRRNNNNN","..NNNNNNNNNN","...NNN..NNN"],
 e_kacho:["...eeeeeeee","..eeeeeeeeee","..eRRRRRRRRe","..RRRRRRRRRR","..RrKRRRKrRR","..RRRRRRRRRR","..RRWWWWWWRR","...RWKKKKWR","..NNNNNNNNNN",".NNNWWYYWWNNN","NNNNWWYYWWNNNN","NNNNNWYYWNNNNN","NNNNNWYYWNNNNN","NNNNNNYYNNNNNN","NNNNNNYYNNNNNN",".NNNNNYYNNNNN","..NNNNNNNNNN","...NNN..NNN"],
 e_sabizan:["...nnnnnnnn","..nnnnnnnnnn","..nHHHHHHHHn","..HHHHHHHHHH","..HHKHHHKHHH","..HHHHHHHHHH","..HHHTTTTHHH","...HHHHHHHH","..hhhhhhhhhh",".hhhhWWWWhhhh","hhhhWFFFFWhhhh","hhhhWFKKFWhhhh","hhhhWFFFFWhhhh","hhhhWWWWWWhhhh","hhhhhhhhhhhhh",".hhhhhhhhhh","..hhhhhhhh","..hh....hh"],
 e_nabakari:["...eeeeeeee","..eeeeeeeeee","..esSSSSSSse","..sSSSSSSSSs","..sSKSSKSSSs","..sSSSSSSSSs","..ssSWWWWSs","...sSWKKWSs","..bbbbbbbbbb",".bbbdDDdbbbbb","bbbbdDDdbbbbbb","bbbbbWWbbbbbbb","bbbbbWWbbbbbbb","bbbbbbbbbbbbbb","bbbbbbbbbbbbbb",".bbbbbbbbbbb","..bbbbbbbbb","..bbb..bbb"],
 e_gizo:["...nnnnnnnn","..nnnnnnnnnn","..nsSSSSSSsn","..sSSSSSSSSs","..sSyKSSKySs","..sSSSSSSSSs","..sSnnnnnnSs","...sSooooSs","..NNNNNNNNNN",".NNNdddddNNN","NNNdDDDDDdNNN","NNNdDnnnDdNNN","NNNdDDDDDdNNN","NNNNdddddNNNN","NNNNNNNNNNNN",".NNNNNNNNNN","..NNNNNNNN","..NNN..NNN"],
 e_ferro:["...HHHHHHHH","..HHhhhhhhHH","..hsSSSSSSsh","..sSSrSSrSSs","..sSKSSSSKSs","..sSSSSSSSSs","..ssSrrrrSs","...sHHHHHss","..HHHHHHHHHH",".HHHhhHHhhHHH","HHHhRRHHRRhHHH","HHHhhHHHHhhHHH","HHHHHHHHHHHHHH","HHhHHHHHHHHhHH","HHHHHHHHHHHHHH",".HHHHHHHHHHHH","..HHHHHHHHHH","..HHH..HHH"],
 e_graus:["..HHHHHHHHHH",".HHHHHHHHHHHH",".HHhhhhhhhhHH",".HhKKKKKKKKhH",".HhKRRKKRRKhH",".HhKKKKKKKKhH",".HHhhhhhhhhHH","..HHHHHHHHHH",".hhHHHHHHHhh","HHHHHHHHHHHHH","HHHhhHHhhHHHH","HHhRRHHRRhHHH","HHHhhHHhhHHHH","HHHHHHHHHHHHH","HHhHHHHHHHhHH",".HHHHHHHHHHH","..HHHHHHHHH",".HHH....HHH"],
 e_roukisai:[".O.OO.OO.O","OrO.OrO.OrO",".rRRRRRRRRr","rRRRRRRRRRRr","rRRKRRRRKRRr","rRRRRRRRRRRr","rRRRWWWWRRRr","rRRRWKKWRRRr",".rRRRWWRRRr","..nnRRRRnn",".nNNRRRRNNn","nNNNNRRNNNNn","nNdNNRRNNdNn","nNNNNRRNNNNn","nNNNORRONNNn",".nNNNRRNNNn","..nNNNNNNn","..nnN..Nnn"]};
const BUST_OL="#1a1119"; /* 立ち絵の輪郭線色(勇者30風のクリーンな塊感) */
for(const k in BUSTS){ PX[k]=makePx(_p18(BUSTS[k]),BPAL,8,BUST_OL); }
/* 主人公の見た目バリエーション（hero_app を髪/服色で振り替え） */
[["hero_app_r",{E:"#a82d34",e:"#6a1c20",G:"#5b8dff",g:"#33518f"}],
 ["hero_app_g",{E:"#2f7d3c",e:"#1c4a24",G:"#c58900",g:"#8a5e00"}],
 ["hero_app_p",{E:"#5b4590",e:"#2e2148",G:"#3ed6c0",g:"#2a9c8c"}]]
 .forEach(v=>{ PX[v[0]]=makePx(_p18(BUSTS.hero_app),Object.assign({},BPAL,v[1]),8,BUST_OL); });

/* ===== 背景（場所が一目で分かるようシルエットを canvas で描く。画像ファイル無し）===== */
const _bgCache={};
function sceneBg(key){
  if(_bgCache[key]) return _bgCache[key];
  /* 縦長(384x608)で描く＝縦長の物語画面に cover しても情景が見切れない。空を大きく取り空気感を出す。 */
  const W=384,H=608,c=document.createElement("canvas");c.width=W;c.height=H;const x=c.getContext("2d");
  const grad=(stops)=>{const g=x.createLinearGradient(0,0,0,H);stops.forEach(s=>g.addColorStop(s[0],s[1]));x.fillStyle=g;x.fillRect(0,0,W,H);};
  const cloud=(cx,cy,w,h,col)=>{x.fillStyle=col;x.beginPath();x.ellipse(cx,cy,w,h,0,0,7);x.ellipse(cx-w*0.6,cy+h*0.2,w*0.6,h*0.7,0,0,7);x.ellipse(cx+w*0.6,cy+h*0.2,w*0.6,h*0.7,0,0,7);x.fill();};
  const star=(n,col)=>{x.fillStyle=col;for(let i=0;i<n;i++){const sx=(i*97)%W,sy=(i*53)%(H*0.4);x.fillRect(sx,sy,2,2);}};
  if(key==="town"||key==="field"){ /* 灰色の朝＝レイバーリアの象徴。曇天＋灰色の街並み */
    grad([[0,"#8a8b93"],[0.35,"#9a9aa0"],[0.55,"#ababb0"],[0.7,"#7d7a80"],[1,"#4a4750"]]);
    cloud(120,90,90,34,"rgba(200,200,206,.55)");cloud(280,150,110,40,"rgba(215,215,220,.5)");cloud(70,210,80,30,"rgba(190,190,198,.5)");
    x.fillStyle="#5c5962";for(let i=0;i<9;i++){const bh=60+((i*47)%90);x.fillRect(i*44-6,H*0.62-bh,40,bh);}
    x.fillStyle="#46434c";for(let i=0;i<7;i++){const bh=40+((i*61)%70);x.fillRect(i*58+10,H*0.62-bh,46,bh);}
    x.fillStyle="#3a3740";x.fillRect(0,H*0.62,W,H*0.4);
    x.fillStyle="#2e2b34";for(let i=0;i<6;i++)x.fillRect(i*70,H*0.72,50,6);
  } else if(key==="temple"){ grad([[0,"#171634"],[0.4,"#26224a"],[0.7,"#3a3260"],[1,"#241f42"]]);star(40,"rgba(255,255,255,.5)");
    x.fillStyle="rgba(255,224,150,.55)";x.beginPath();x.arc(W/2,H*0.2,64,0,7);x.fill();
    x.fillStyle="rgba(255,224,150,.25)";x.beginPath();x.arc(W/2,H*0.2,100,0,7);x.fill();
    x.fillStyle="#151230";x.beginPath();x.moveTo(20,H*0.42);x.lineTo(W/2,H*0.24);x.lineTo(W-20,H*0.42);x.fill();
    x.fillStyle="#0e0c22";x.fillRect(0,H*0.4,W,26);
    x.fillStyle="#1a1638";for(let i=0;i<6;i++)x.fillRect(20+i*62,H*0.44,30,H*0.5);
    x.fillStyle="#0c0a1e";x.fillRect(0,H*0.9,W,H*0.1);
  } else if(key==="factory"){ grad([[0,"#3a3340"],[0.4,"#5a4340"],[0.7,"#7c5038"],[1,"#2a2028"]]);
    cloud(110,80,100,30,"rgba(90,80,86,.6)");cloud(300,120,90,26,"rgba(80,72,80,.6)");
    x.fillStyle="#0d0a12";for(let i=0;i<6;i++)x.fillRect(30+i*62,H*0.28,26,H*0.4);
    x.fillStyle="rgba(120,110,110,.5)";for(let i=0;i<6;i++){x.beginPath();x.arc(43+i*62,H*0.28,20,0,7);x.fill();}
    x.fillStyle="#17131e";x.fillRect(0,H*0.6,W,H*0.4);
    x.fillStyle="#ffcf6a";for(let r=0;r<3;r++)for(let i=0;i<8;i++)x.fillRect(20+i*44,H*0.66+r*40,16,16);
    x.fillStyle="#3a2f22";x.fillRect(0,H*0.94,W,H*0.06);
  } else if(key==="office"||key==="room"){ grad([[0,"#2a3040"],[0.5,"#333c52"],[1,"#20242f"]]);
    /* 大きな窓＝辺境ロウムの灰色の空をはっきり見せる（序章の情景） */
    x.fillStyle="#9a9aa0";x.fillRect(0,0,W,H*0.5);
    x.fillStyle="#8a8b93";x.fillRect(0,0,W,H*0.22);
    cloud(W*0.28,H*0.16,70,22,"rgba(200,200,206,.6)");cloud(W*0.74,H*0.3,80,24,"rgba(210,210,216,.55)");
    x.fillStyle="#5c5962";for(let i=0;i<7;i++){const bh=40+((i*53)%70);x.fillRect(i*58-4,H*0.5-bh,50,bh);} // 窓外の灰色の街
    x.fillStyle="#2a3140";x.fillRect(0,H*0.5,W,H*0.5); // 室内壁(窓の下)
    x.fillStyle="#1c2230";x.fillRect(0,H*0.5,W,10); // 窓枠(下辺)
    x.fillStyle="#1c2230";for(let i=1;i<4;i++)x.fillRect(i*W/4-3,0,6,H*0.5); // 窓の桟(縦)
    x.fillStyle="#1c2230";x.fillRect(0,H*0.24,W,6); // 窓の桟(横)
    x.fillStyle="#5a4632";x.fillRect(W*0.08,H*0.66,W*0.5,H*0.34);x.fillStyle="#7a6040";x.fillRect(W*0.04,H*0.62,W*0.58,12); // 机
    x.fillStyle="#c9cdd6";x.fillRect(W*0.14,H*0.55,W*0.14,28); // 書類
  } else if(key==="bakery"){ grad([[0,"#3a2a22"],[0.5,"#54382a"],[1,"#221812"]]);
    x.fillStyle="#2a1c14";x.fillRect(0,H*0.6,W,H*0.4);
    x.fillStyle="#5a3a24";x.fillRect(W*0.55,H*0.42,W*0.4,H*0.5);
    x.fillStyle="#ff8a3d";x.beginPath();x.arc(W*0.75,H*0.68,42,0,7);x.fill();
    x.fillStyle="#ffd34d";x.beginPath();x.arc(W*0.75,H*0.68,22,0,7);x.fill();
    x.fillStyle="rgba(255,160,80,.25)";x.fillRect(0,H*0.55,W,H*0.45);
    x.fillStyle="#3a2a1a";x.fillRect(W*0.04,H*0.6,W*0.44,10);
    x.fillStyle="#c58900";for(let i=0;i<4;i++){x.beginPath();x.ellipse(W*0.1+i*W*0.11,H*0.57,15,10,0,0,7);x.fill();}
  } else if(key==="volcano"){ grad([[0,"#2a1420"],[0.4,"#5a1c1a"],[0.7,"#7a2016"],[1,"#1a0c0e"]]);
    cloud(120,70,90,26,"rgba(60,30,30,.6)");cloud(300,110,80,22,"rgba(70,30,26,.6)");
    x.fillStyle="#160a0c";x.beginPath();x.moveTo(W*0.15,H*0.9);x.lineTo(W/2,H*0.32);x.lineTo(W*0.85,H*0.9);x.fill();
    x.fillStyle="#ff6b2a";x.beginPath();x.moveTo(W*0.42,H*0.4);x.lineTo(W/2,H*0.32);x.lineTo(W*0.58,H*0.4);x.lineTo(W*0.54,H*0.56);x.lineTo(W*0.46,H*0.56);x.fill();
    x.fillStyle="#ffd34d";x.fillRect(W*0.45,H*0.36,W*0.1,12);
    x.fillStyle="rgba(255,110,50,.3)";x.fillRect(0,H*0.78,W,H*0.22);
    x.fillStyle="#c53018";for(let i=0;i<7;i++)x.fillRect(i*54,H*0.9,44,H*0.1);
  } else if(key==="line"){ grad([[0,"#241d2e"],[0.5,"#3a2a30"],[1,"#160f16"]]);
    x.fillStyle="#0c0912";for(let i=0;i<9;i++)x.fillRect(i*44,H*0.3,24,H*0.7);
    x.fillStyle="#15111c";x.fillRect(0,H*0.55,W,H*0.45);
    x.fillStyle="#8f95a1";for(let i=0;i<7;i++)x.fillRect(14+i*54,H*0.6,44,14);
    x.fillStyle="#ffcf6a";for(let i=0;i<9;i++)x.fillRect(20+i*40,H*0.5,8,8);
    x.fillStyle="#3a2f22";x.fillRect(0,H*0.92,W,H*0.08);
  } else { grad([[0,"#8a8b93"],[0.6,"#7d7a80"],[1,"#4a4750"]]); }
  return (_bgCache[key]=c.toDataURL());
}

/* PX/px を window に公開（const は自動で window に載らない）。
   これが無いと renderer/charcreate/cast の G.PX 参照が undefined になり、
   立ち絵が全て頭文字プレースホルダに落ちる（主人公・ユリウス含む全キャラ）。 */
if(typeof window!=="undefined"){ window.PX=PX; window.px=px; window.SPRITES=SPRITES; window.makePx=makePx; window.sceneBg=sceneBg; }
