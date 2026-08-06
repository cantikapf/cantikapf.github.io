# Project: CMS Image Loading Performance Optimization

## Architecture
The CMS editor (`admin.html`) and public portfolio website operate on static HTML, CSS, and client-side JavaScript.

### Image Path & Data Boundary (Requirement R2 Safeguard)
- **Canonical Image Paths**: `./assets/images/<filename>` (e.g. `./assets/images/japan.jpg`).
- **Data Stores**: `assets/js/data.js` (`portfolioData` and `cardData`) and `knownImages` array in `media-manager.js`.
- **Public Site Rendering**: Public pages (`index.html`, `works.html`, `experience.html`, `certification.html`, `projects.html`, `detail.html`) continue reading canonical paths and displaying original high-resolution images without modification.
- **CMS Preview Display Layer**: CMS scripts (`media-manager.js`, `card-manager.js`, `editor.js`) use a display-layer URL optimization helper (`getPreviewUrl(filename)`) that resolves thumbnail paths (`./assets/images/thumbs/<filename>`) with `loading="lazy"` and `decoding="async"` for CMS preview `<img>` elements.
- **Image Picker Callback**: `MediaManager.openPicker(callback)` returns canonical paths (`./assets/images/<filename>`) to ensure saved items point to original high-quality assets.

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Static Thumbnail Generation | Generate lightweight static thumbnails (~300px max dim) in `assets/images/thumbs/` for all 31 existing image assets | M1 | Survey (Explorer 3) |
| 2 | CMS Preview URL Helper & Lazy Loading | Implement `getPreviewUrl(path)` in `media-manager.js` and add `loading="lazy"` / `decoding="async"` across `media-manager.js`, `card-manager.js`, and `editor.js` | M1 | Survey (Explorer 1 & 3) |
| 3 | Media Manager & Picker Modal Grid Optimization | Optimize `renderGrid()` in `media-manager.js` to render thumbnail URLs and lazy-load preview grid items in Media Manager and picker modals | M1 | Survey (Explorer 1) |
| 4 | Upload Thumbnail & Export Integration | Update `media-manager.js` and `github-api.js` to generate client-side canvas thumbnails for new uploads and export both original and thumbnail assets | M1 | Survey (Explorer 3) |
| 5 | Canonical Path Assignment & Data Model Integrity | Ensure `MediaManager.openPicker` and CMS form saves strictly write canonical paths (`./assets/images/<filename>`) to `data.js` | M2 | Survey (Explorer 2) |
| 6 | Public Site Quality & E2E Verification | Verify public pages (`detail.html`, `projects.html`, `works.html`, etc.) continue displaying full-resolution original assets with zero quality loss | M2 | Survey (Explorer 2) |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | M1: CMS Low-Res Preview & Thumbnail Engine | Static thumbnail generation, CMS preview URL helper, `loading="lazy"` / `decoding="async"`, `renderGrid()` optimization, upload thumbnail export | None | DONE |
| 2 | M2: Canonical Path Assignment & Public Site Preservation | Verification of `openPicker` original path assignment, `data.js` serialization integrity, and public site E2E quality check | M1 | DONE |

## Interface Contracts
### `CMS.MediaManager` API
- `getPreviewUrl(path: string): string`
  - Takes a canonical path (e.g. `./assets/images/japan.jpg` or `japan.jpg` or data URL).
  - Returns thumbnail URL `./assets/images/thumbs/japan.jpg` if thumbnail exists; falls back to original path or data URL.
- `openPicker(callback: (selectedPath: string) => void): void`
  - Renders grid using `getPreviewUrl(img.path)` for `<img>` preview tags.
  - On image selection click, invokes `callback(img.path)` with the CANONICAL path (`./assets/images/${filename}`).

## Code Layout
- `assets/images/` — Original high-resolution image assets.
- `assets/images/thumbs/` — Pre-generated low-resolution preview thumbnails (max 300px width/height, ~15–20 KB each).
- `assets/cms/media-manager.js` — CMS Media Manager grid, picker modal, preview URL helper, thumbnail upload logic.
- `assets/cms/card-manager.js` — Section manager carousel card list previews (`getPreviewUrl(card.thumb)`).
- `assets/cms/editor.js` — CMS item editor image picker integration & preview tab (`getPreviewUrl(...)`).
- `assets/cms/github-api.js` — CMS state exporter (`data.js` and HTML generator).
- `assets/js/data.js` — Canonical portfolio item content and carousel card metadata.
