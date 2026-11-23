# CTP Packaging Library — demo publisher

This is a **temporary unauthenticated publishing service** for a handful of demo projects. Anyone who discovers the Worker endpoint can write allowed files to the public repository. **Do not use for confidential production content.** Disable or delete the Worker after the demo.

The Worker is designed for Cloudflare and keeps the GitHub token in the Worker environment, never in browser HTML. The token is still required by GitHub.

## Deploy through the browser (no installs)

1. Open https://dash.cloudflare.com/ and choose **Workers & Pages** → **Create** → **Worker**.
2. Name it `ctp-packaging-demo` and deploy the starter.
3. Edit Worker code, replace it with `worker/index.js` from this repository and deploy again.
4. Open **Settings → Variables and Secrets → Add**. Name: `GITHUB_TOKEN`. Type: **Secret**. Value: a fine-grained GitHub PAT with **Contents: Read and write** limited to the `ctp-destefano/CTP-Packaging-Library` repository. Save/deploy.
5. Open `https://YOUR-WORKER.workers.dev/health` and check `configured: true`.
6. Set the Worker URL into the Admin's constant `PUBLISH_API` (a code change to be done once after the real URL is known). Then any browser can publish without entering a token.

The Worker permits only GitHub Contents API writes to `docs/data/projects.json`, `docs/boxes/PROJECTID/index.html`, and `docs/assets/PROJECTID/COMPONENT/FILE`. Requests are size-limited and only cross-origin responses from the GitHub Pages origin are allowed (CORS is **not authentication**).

Disable the Worker or revoke its GitHub token once the demo is complete.
