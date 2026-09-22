#!/usr/bin/env node
/* App Store Connect の審査ステータスを CLI から見る。
 *   npm run ios:status
 *
 * 「審査通った?」を確認するのに毎回ブラウザで App Store Connect を開くのは無駄なので、
 * API から直接引く。メールの有無で推測するより確実(メールは遅延・迷惑メール送りがある)。
 *
 * 必要なもの:
 *   ~/.appstoreconnect/private_keys/AuthKey_<KEY_ID>.p8   (App Store Connect の APIキー)
 *   ASC_ISSUER_ID 環境変数                                (同ページの Issuer ID)
 * 依存パッケージなし(Node 標準の crypto と fetch だけで JWT を作る)。
 */
const fs = require("fs");
const os = require("os");
const path = require("path");
const crypto = require("crypto");

const KEY_ID = process.env.ASC_KEY_ID || "G794N7QMD9";
const ISSUER_ID = process.env.ASC_ISSUER_ID;
const BUNDLE_ID = process.env.ASC_BUNDLE_ID || "com.ville.machimon";
const KEY_PATH = path.join(os.homedir(), ".appstoreconnect", "private_keys", `AuthKey_${KEY_ID}.p8`);

if (!ISSUER_ID) {
  console.error(`❌ ASC_ISSUER_ID が未設定です。

  1. https://appstoreconnect.apple.com/access/integrations/api を開く
  2. 「チーム」タブ上部の「Issuer ID」をコピー
  3. ~/.zshrc に足す:
       export ASC_ISSUER_ID="コピーした値"`);
  process.exit(1);
}
if (!fs.existsSync(KEY_PATH)) {
  console.error(`❌ APIキーが無い: ${KEY_PATH}`);
  process.exit(1);
}

/* ES256 の JWT を手作りする。crypto.sign の dsaEncoding:"ieee-p1363" が
   JOSE の要求する r||s 形式そのものなので、DER からの変換は要らない。 */
function token() {
  const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
  const iat = Math.floor(Date.now() / 1000);
  const head = b64({ alg: "ES256", kid: KEY_ID, typ: "JWT" });
  const body = b64({ iss: ISSUER_ID, iat, exp: iat + 1200, aud: "appstoreconnect-v1" });
  const sig = crypto.sign(null, Buffer.from(`${head}.${body}`), {
    key: fs.readFileSync(KEY_PATH),
    dsaEncoding: "ieee-p1363",
  });
  return `${head}.${body}.${sig.toString("base64url")}`;
}

const JWT = token();
async function api(pathname) {
  const res = await fetch(`https://api.appstoreconnect.apple.com${pathname}`, {
    headers: { Authorization: `Bearer ${JWT}` },
  });
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`${res.status} ${pathname}\n${detail.slice(0, 400)}`);
  }
  return res.json();
}

/* Appleの状態名は英語のままだと読み違えるので日本語にする。
   「通った/通ってない」が一目で分かることを優先。 */
const STATE = {
  READY_FOR_DISTRIBUTION: "✅ 審査通過・配信可能",
  READY_FOR_SALE: "✅ 審査通過・公開中",
  PENDING_DEVELOPER_RELEASE: "✅ 審査通過・あなたの公開操作待ち",
  IN_REVIEW: "🔍 審査中",
  WAITING_FOR_REVIEW: "⏳ 審査待ち(まだ着手されていない)",
  PENDING_APPLE_RELEASE: "✅ 審査通過・Appleの公開待ち",
  PREPARE_FOR_SUBMISSION: "📝 提出前(まだ出していない)",
  REJECTED: "❌ 却下",
  METADATA_REJECTED: "❌ 却下(説明文・スクショなどメタデータ)",
  DEVELOPER_REJECTED: "↩️ 自分で取り下げた",
  INVALID_BINARY: "❌ ビルドが不正",
  PROCESSING_FOR_DISTRIBUTION: "⚙️ 配信処理中",
};
const label = (s) => STATE[s] || s;

(async () => {
  const apps = await api(`/v1/apps?filter[bundleId]=${encodeURIComponent(BUNDLE_ID)}`);
  const app = apps.data[0];
  if (!app) {
    console.error(`❌ ${BUNDLE_ID} が見つからない。ASC_BUNDLE_ID を確認してください。`);
    process.exit(1);
  }
  console.log(`\n📱 ${app.attributes.name}  (${BUNDLE_ID})\n`);

  const vers = await api(`/v1/apps/${app.id}/appStoreVersions?limit=5`);
  console.log("── バージョンの審査状況 ──");
  for (const v of vers.data) {
    const a = v.attributes;
    console.log(`  v${a.versionString}  ${label(a.appStoreState || a.appVersionState)}`);
    /* 却下されていれば理由が読める場所を出す(APIからは本文を取れない) */
    if (/REJECTED/.test(a.appStoreState || a.appVersionState || "")) {
      console.log("    → 理由: https://appstoreconnect.apple.com/apps → App レビュー → 「解決センター」");
    }
  }

  const builds = await api(`/v1/builds?filter[app]=${app.id}&limit=5&sort=-version`);
  console.log("\n── アップロード済みビルド ──");
  for (const b of builds.data) {
    const a = b.attributes;
    const exp = a.expirationDate ? ` / 期限 ${a.expirationDate.slice(0, 10)}` : "";
    console.log(`  ビルド ${a.version}  ${label(a.processingState)}  (${a.uploadedDate.slice(0, 16).replace("T", " ")})${exp}`);
  }
  console.log("");
})().catch((e) => {
  console.error("❌ App Store Connect API 呼び出しに失敗:\n" + e.message);
  process.exit(1);
});
