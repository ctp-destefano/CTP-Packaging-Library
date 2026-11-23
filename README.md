# CTP Packaging Library — GitHub Pages starter

A static demo for presenting CTP’s packaging reference library. No real client files included.

## Publish without installations

1. Create a **public** repository named `CTP-Packaging-Library` under your GitHub account.
2. Upload the *contents* of this starter folder into the repository root (keep the `docs/` folder).
3. In repository **Settings → Pages**, select **Deploy from a branch**, branch `main`, folder `/docs`, and Save.
4. Once Pages publishes, open `https://ctp-destefano.github.io/CTP-Packaging-Library/`.
5. The example box URL is `https://ctp-destefano.github.io/CTP-Packaging-Library/boxes/CTP042/`. Only generate a permanent QR after verifying that link on a phone.

## What works

- Public GitHub Pages hosting with a sample box view.
- Standalone HTML demo with carousel and components (existing v11 prototype).
- Independent desktop Admin v5 **local prototype** stored under `admin-local/` (not served by GitHub Pages).

## What does not work yet

- Admin v5 does not publish or synchronize records to GitHub. Its local browser storage is not a shared database.
- The JSON in `data/` is a reference schema, not yet wired to the public demo.
- GLB, PDF and image uploads are not connected; the visuals in the template are placeholders.
- No authentication, real QR/PDF generator, or production storage backend is set up.

## Next build milestone

Connect the public template to a structured project record and files, then add a secure GitHub-backed editing workflow. Do **not** place real client artwork or confidential dielines in a public repository until CTP authorizes publication.

## Future hosting migration

`docs/` contains the public site and can later be deployed to company infrastructure with relative paths maintained. `admin-local/` is intentionally outside the published Pages root.
