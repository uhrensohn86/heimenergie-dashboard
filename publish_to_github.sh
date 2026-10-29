#!/usr/bin/env bash
set -euo pipefail

# Optional publishing helper for Termux. Publishes only after an explicit yes.
cd "$(dirname "$0")"
for cmd in git gh; do
  if ! command -v "$cmd" >/dev/null 2>&1; then
    printf '%s ist nicht installiert. Bitte über die offiziellen Termux-Pakete installieren.\n' "$cmd"
    exit 1
  fi
done

gh auth status >/dev/null || { echo 'Zuerst mit gh auth login anmelden.'; exit 1; }
OWNER="$(gh api user --jq .login)"
# Publish only the scrubbed files from this fresh folder; do not copy an old .git directory.
if [[ -d .git ]]; then
  echo 'Abbruch: Dieses Bereitstellungsverzeichnis muss ohne alte Git-Historie beginnen.'
  exit 1
fi
REPO='heimenergie-dashboard'
if gh repo view "$OWNER/$REPO" >/dev/null 2>&1; then
  echo "Abbruch: $OWNER/$REPO existiert bereits. Nichts überschrieben. Für bereinigte Neuveröffentlichung erst das alte Repository löschen."
  exit 1
fi
printf 'Repository %s/%s öffentlich auf GitHub erstellen? [ja/NEIN]: ' "$OWNER" "$REPO"
read -r answer
[[ "$answer" == 'ja' ]] || { echo 'Nicht veröffentlicht.'; exit 0; }

if [[ ! -d .git ]]; then git init -b main; fi
git add README.md PRIVACY.md LICENSE hacs.json .gitignore dist/ tests/ publish_to_github.sh
if ! git diff --cached --quiet; then
  git -c user.name="${OWNER}" -c user.email="${OWNER}@users.noreply.github.com" commit -m 'Initial HeimEnergie v0.1.1 prototype'
fi
gh repo create "$OWNER/$REPO" --public --description 'Modulares Energie-Dashboard für Home Assistant' --source=. --remote=origin --push
printf '\nGitHub-Repository erstellt: https://github.com/%s/%s\n' "$OWNER" "$REPO"
