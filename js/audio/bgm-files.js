"use strict";
/* ============================================================
   bgm-files.js — 殿の自作オリジナルBGM「差し込み口」(登録表)
   ------------------------------------------------------------
   ■ 使い方(殿が自作曲を鳴らす手順)
   1. リポジトリ内 assets/bgm/ フォルダに音源ファイルを置く。
      例: assets/bgm/boss.mp3
   2. 下の BGM_FILES に「シーン名: "相対パス"」を1行足す(先頭の // を外す)。
   3. sw.js の ASSETS 配列に同じ相対パスを追加する(オフライン再生用)。
      さらに C = "srq-vXXX" の番号を +1 する(キャッシュ更新)。
   ------------------------------------------------------------
   ■ シーン名(=登録キー)と用途
     field   … 冒険マップ/道中
     town    … 拠点ホーム・事務所(落ち着いた常駐曲)
     battle  … 雑魚ラッシュ戦
     boss    … 科目ボス/中ボス/ラスボス(重い緊迫曲)
     metal   … メタル敵出現中(焦る高速チェイス)
     victory … 撃破/クリアの勝利ジングル(数秒・ループ不要の単発)
     emotion … 感動の寸劇シーン
   ------------------------------------------------------------
   ■ ファイル形式・ループ目安
     対応: mp3 / ogg / m4a / wav(端末の decodeAudioData 対応形式なら可)
     ループ: victory 以外はシームレスにループする素材を推奨(先頭と末尾を繋ぐ)。
             victory は数秒の単発ジングルでOK(自動で1回だけ鳴り元シーンへ戻る)。
   ------------------------------------------------------------
   ※ 差し込み口は空でも良い。1つも登録が無ければ従来どおり内蔵の合成音で鳴る。
     登録が無いシーンは fetch も走らないので 404 は出ない(既存体験は不変)。
   ============================================================ */
const BGM_FILES = {
  /* field:   "assets/bgm/field.mp3",   */
  /* town:    "assets/bgm/town.mp3",    */
  /* battle:  "assets/bgm/battle.mp3",  */
  /* boss:    "assets/bgm/boss.mp3",    */
  /* metal:   "assets/bgm/metal.mp3",   */
  /* victory: "assets/bgm/victory.mp3", */
  /* emotion: "assets/bgm/emotion.mp3", */
};
/* 起動時(main.js)から呼ぶ。実体のあるパスだけ AudioMgr へ登録する。 */
function bgmRegisterFiles(){
  if(typeof AudioMgr==="undefined"||!AudioMgr.registerBgmFile)return 0;
  let n=0;
  for(const k in BGM_FILES){const u=BGM_FILES[k];if(u){AudioMgr.registerBgmFile(k,u);n++;}}
  return n;
}
if(typeof window!=="undefined"){window.BGM_FILES=BGM_FILES;window.bgmRegisterFiles=bgmRegisterFiles;}
