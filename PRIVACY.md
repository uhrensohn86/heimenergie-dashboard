# Privacy and public repositories

The public source contains no personal Home Assistant device mapping, private entity IDs, household metrics, credentials or local IP addresses. Devices and tariff helper(s) are selected locally in the Home Assistant configuration UI.

Do not commit exports of dashboards, sensor entity mappings, Home Assistant configuration.yaml, `.storage` files, screenshots with private content, tokens or service credentials. The `.gitignore` file protects only a few common local paths; always review `git status` and `git diff --cached` before publishing.

If personal information was committed in an earlier revision, a later commit does not erase prior commits. See GitHub's instructions on removing sensitive data from repository history: https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository
