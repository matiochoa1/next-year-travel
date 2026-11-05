#!/usr/bin/env bash
# Builds the API bundle and uploads it to an existing Function App.
#
#   ./infra/publish-api.sh <resource-group> <function-app-name>
set -euo pipefail

if [ $# -ne 2 ]; then
  echo "Usage: $0 <resource-group> <function-app-name>" >&2
  exit 1
fi

root=$(cd "$(dirname "$0")/.." && pwd)
pnpm --dir "$root" --filter @nsa/api build
archive=$(mktemp -d)/api.zip
(cd "$root/apps/api/deploy" && zip -qr "$archive" .)
az functionapp deployment source config-zip --resource-group "$1" --name "$2" --src "$archive"
echo "Published. Verify with: curl https://$2.azurewebsites.net/api/groups/<group-id>/me"
