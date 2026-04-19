#!/bin/bash
# Demo: rebuild a single plugin and update its registry entry.
# Shows that one team can redeploy without touching other plugins or the shell.
#
# Usage: ./scripts/demo-deploy.sh <plugin-id>
# Example: ./scripts/demo-deploy.sh sms

set -e

PLUGIN=${1:?Usage: demo-deploy.sh <plugin-id>  (e.g. sms, qca, cms, mam)}

echo "Building $PLUGIN..."
pnpm --filter "$PLUGIN" build

echo "Notifying DevTools registry..."
curl -s -X POST "http://localhost:5001/api/snapshot" \
  -H "Content-Type: application/json" \
  -d "{\"appId\":\"$PLUGIN\"}" > /dev/null

echo ""
echo "✓ $PLUGIN redeployed successfully."
echo "  Other plugins ($(echo 'sms qca cms mam' | tr ' ' '\n' | grep -v "$PLUGIN" | tr '\n' ' ')) were NOT touched."
echo "  Shell will reload the new $PLUGIN build on next navigation."
