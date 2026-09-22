#!/bin/bash
# マチモン社労士 iOS リリース一発スクリプト(ローカルMac用)。
#   npm run ios:release            … アーカイブ→書き出し→アップロード→(処理完了を待って)審査提出
#   SUBMIT=0 npm run ios:release   … アップロードまで(審査提出しない)
# ビルド番号・バージョンは ASC に問い合わせて決める(tools/asc-release.mjs plan)。
# リリースノートは docs/whatsnew.txt(初版=1.0 では ASC 側で whatsNew は無視される)。
set -euo pipefail
cd "$(dirname "$0")/.."

export DEVELOPER_DIR="${DEVELOPER_DIR:-/Applications/Xcode.app/Contents/Developer}"
export BUNDLE_ID="com.ville.machimon"
KEY_ID="${ASC_KEY_ID:-G794N7QMD9}"; export ASC_KEY_ID="$KEY_ID"
KEY_PATH="$HOME/.appstoreconnect/private_keys/AuthKey_${KEY_ID}.p8"
ARCHIVE="build/App.xcarchive"
IPA_DIR="build/ipa"
SUBMIT="${SUBMIT:-1}"

step(){ printf "\n\033[1;36m▶ %s\033[0m\n" "$1"; }
[ -n "${ASC_ISSUER_ID:-}" ] || { echo "❌ ASC_ISSUER_ID が未設定(~/.zshrc で export)"; exit 1; }
[ -f "$KEY_PATH" ] || { echo "❌ APIキーが無い: $KEY_PATH"; exit 1; }
export ASC_PRIVATE_KEY="$(cat "$KEY_PATH")"

step "1/6 テスト"
npm test

step "2/6 ビルド番号・バージョンを決める"
PLAN=$(node tools/asc-release.mjs plan)
BUILD=$(echo "$PLAN" | sed -n 's/^build_number=//p')
VER=$(echo "$PLAN" | sed -n 's/^version_string=//p')
VID=$(echo "$PLAN" | sed -n 's/^version_id=//p')
echo "  ビルド ${BUILD} / バージョン ${VER}"

step "3/6 www 組み立て + Capacitor 同期"
npm run ios:sync

step "4/6 アーカイブ(署名は書き出し時にクラウド署名)"
rm -rf "$ARCHIVE" "$IPA_DIR"
xcodebuild -project ios/App/App.xcodeproj -scheme App -configuration Release \
  -destination 'generic/platform=iOS' -archivePath "$ARCHIVE" archive \
  CODE_SIGN_IDENTITY="" MARKETING_VERSION="$VER" CURRENT_PROJECT_VERSION="$BUILD" \
  -allowProvisioningUpdates \
  -authenticationKeyPath "$KEY_PATH" -authenticationKeyID "$KEY_ID" -authenticationKeyIssuerID "$ASC_ISSUER_ID" \
  | grep -Ev '^\s*$' | tail -20
[ -d "$ARCHIVE" ] || { echo "❌ アーカイブ失敗"; exit 1; }

step "5/6 ipa 書き出し → アップロード"
xcodebuild -exportArchive -archivePath "$ARCHIVE" \
  -exportOptionsPlist tools/ExportOptions.plist -exportPath "$IPA_DIR" \
  -allowProvisioningUpdates \
  -authenticationKeyPath "$KEY_PATH" -authenticationKeyID "$KEY_ID" -authenticationKeyIssuerID "$ASC_ISSUER_ID" \
  | tail -10
IPA=$(ls "$IPA_DIR"/*.ipa | head -1)
xcrun altool --upload-app -f "$IPA" -t ios --apiKey "$KEY_ID" --apiIssuer "$ASC_ISSUER_ID"

if [ "$SUBMIT" = "1" ]; then
  step "6/6 審査提出(処理完了を待つ)"
  NOTES=""; [ "$VER" != "1.0" ] && NOTES="--notes docs/whatsnew.txt"   # 初回版はリリースノートを設定できない
  node tools/asc-release.mjs submit --build "$BUILD" --version "$VER" --version-id "$VID" $NOTES
else
  echo "SUBMIT=0 のため審査提出は省略。状況: npm run ios:status"
fi
