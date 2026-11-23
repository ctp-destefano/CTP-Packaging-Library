# CTP Packaging Library

GitHub Pages application for displaying packaging references via QR, with a browser-based publishing editor.

## Pages

- Library: https://ctp-destefano.github.io/CTP-Packaging-Library/
- Admin: https://ctp-destefano.github.io/CTP-Packaging-Library/admin/
- Dynamic viewer: https://ctp-destefano.github.io/CTP-Packaging-Library/viewer.html?id=CTP042
- Existing CTP042 demo: https://ctp-destefano.github.io/CTP-Packaging-Library/boxes/CTP042/

GitHub Pages publishes from `main:/docs`. Pushing commits under `docs/` triggers deployment.

## Admin: initial authorization (one-time GitHub setup)

The app is static. There is no backend server or secret stored in the repository.

To publish from the Admin, create a **fine-grained personal access token** at https://github.com/settings/personal-access-tokens/new :

- Resource owner: `ctp-destefano`
- Repository access: **Only select repositories**, `CTP-Packaging-Library`
- Repository permissions: **Contents: Read and write**
- Use a short expiration and revoke the token if compromised.

Paste the token into **Admin → Connect GitHub**. The token lives only in page memory and must be entered again when the page is refreshed or closed. Do not put the token in GitHub files, query strings or browser bookmarks.

Once connected, you can create projects, edit the technical specifications, add components, select photos / PDFs / GLBs and publish. The editor uses GitHub Contents API. Files are uploaded first, then `docs/data/projects.json`, and then `docs/boxes/PROJECT_ID/index.html` is created or updated.

GitHub Pages deployment is **not instantaneous**. Refresh public pages after deployment completes. New boxes use stable `/boxes/PROJECT_ID/` addresses and can be used in QR codes.

## Important limitations

- **Do not publish confidential client files** without CTP's authorization. All media in the public GitHub repository and Pages site are downloadable in principle, regardless of UI.
- Maximum upload supported by this editor: **20 MB per file**, to reduce browser memory use and avoid hosting limits. GitHub Pages also has an overall site size limit.
- This app is a working **pilot**, not a company-authenticated multi-user database.
- Publishing is sequential, not transactional; if a network failure occurs mid-upload, retry after checking GitHub.
- Old uploaded assets are not automatically deleted when removed from a gallery. Periodic repository cleanup may be needed.
- The QR print page currently uses an external QR-image service. The generated QR contains only the public project URL.
- PDF embedding is browser-dependent; image preview and GLB rendering use browser capabilities. The GLB viewer loads `<model-viewer>` from a CDN.
- `CTP042` contains demonstration metadata. Its existing static page stays intact until the first time the Admin publishes that project; after that it uses the data-driven viewer. Upload real, authorized visual files before publishing that change.

## Storage format

`docs/data/projects.json`: project records (ID, title, dimensions, materials, descriptions, components).

`docs/assets/ID/COMPONENT/`: uploaded images, GLB and PDF files.

`docs/boxes/ID/index.html`: simple entry route for each project.

`docs/viewer.html`: shared public viewer for all new boxes.

## Future migration to CTP infrastructure

The Pages site uses static JSON and relative asset URLs. Moving to CTP hosting is possible without redesigning the content model; the Admin publishing layer would require a replacement company authentication and storage API.
