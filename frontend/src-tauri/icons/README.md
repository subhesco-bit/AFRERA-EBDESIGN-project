# Icons needed here

`tauri.conf.json`'s `tauri.bundle.icon` and `tauri.systemTray.iconPath` reference
5 files that must exist in this directory before `npm run tauri:build` (or a
system-tray-enabled `npm run tauri:dev`) will work:

- `32x32.png`
- `128x128.png`
- `128x128@2x.png` (256x256 px)
- `icon.icns` (macOS bundle icon)
- `icon.ico` (Windows bundle icon)
- `icon.png` (used by `systemTray.iconPath`; a plain square PNG, ideally a
  simple monochrome/alpha silhouette since `iconAsTemplate: true` tells macOS
  to treat it as a template image that adapts to light/dark menu bars)

None of these exist yet — no real app icon/logo asset was available to generate
them from in this task, so no placeholder binaries were fabricated here.

## How to generate them

Tauri ships a CLI subcommand that generates all of the above (plus a few
Android/iOS variants) from a single source image:

```bash
cd frontend
npx tauri icon <path-to-source-image.png>
```

The source image should be a square PNG, at least 1024x1024, ideally with a
transparent background. Output defaults to `src-tauri/icons/` (this
directory), matching what `tauri.conf.json` already expects — no config
changes needed after running it.

## Candidate source image

`frontend/public/icons/` already has PWA icons that could serve as a source
for `tauri icon` until a dedicated desktop icon exists:

- `frontend/public/icons/icon-512.png` (512x512, best candidate — closest to
  the recommended 1024x1024 minimum)
- `frontend/public/icons/icon-maskable-512.png` (512x512, has safe-zone
  padding baked in for maskable PWA icons — probably not ideal for `tauri
  icon`, which expects a full-bleed square source)
- `frontend/public/icons/icon-192.png` (192x192, too small to be a good
  source; would upscale visibly)

`icon-512.png` is the best available candidate, but it was generated for PWA
use (Android home-screen/app-shortcut icons), not a native desktop icon set —
someone should confirm it looks right at 32x32/128x128 before treating it as
final, and ideally replace it with a purpose-made desktop icon later.
