# Asset licensing shortlist — clean-room Pixel Agents V1

Research date: 2026-07-30
Scope: character, furniture, environment tile, and supplemental pixel sources that can be bundled and commercially redistributed in a Hermes desktop plugin.

## Recommendation

Use a deliberately narrow asset stack:

- **Characters:** Kenney Pixel Platformer as the initial character-motion source, with project-original recolors/accessories and newly drawn role/state markers.
- **Furniture and interior tiles:** Kenney Roguelike/RPG Pack as the primary source.
- **UI:** use Hermes native controls, codicons/icons, and theme tokens—not pixel-pack panels/buttons.
- **Project identity:** draw original Hermes-specific desk props, status badges, agent role accessories, logo/wordmark elements, and any missing directional/animation frames.
- **Fallback environment pieces:** Tiny Dungeon or Tiny Town may be approved per-file only when Roguelike/RPG lacks a needed 16×16 class; do not bundle whole archives “just in case.”

All shortlisted third-party packs are from Kenney’s primary asset pages and explicitly marked Creative Commons CC0. CC0 permits copying, modification, distribution, and commercial use without permission or mandatory attribution. Keep voluntary credit and complete provenance anyway. A clear licence is necessary but not sufficient: assets enter the product only after per-file visual review, manifest approval, hashing, and reproducible transformation.

Do not use Pixel Agent Desk assets or assets from the legacy Hermes Pixel Agents repository. Their provenance/licence is not approved for bundled redistribution in this clean-room project.

## Licence interpretation used

Primary licence deed: [Creative Commons CC0 1.0 Universal](https://creativecommons.org/publicdomain/zero/1.0/).

The deed states that the affirmer waives copyright and related rights to the extent allowed by law, and that users may copy, modify, distribute, and perform the work, including commercially, without asking permission. It does not grant patent or trademark rights, does not remove privacy/publicity constraints, provides no warranty, and use must not imply creator endorsement.

Operational policy:

- attribution is not legally required for these CC0 packs, but ship a factual voluntary credit in `THIRD_PARTY_ASSETS.md`;
- never use Kenney’s name/logo as product branding or imply endorsement;
- preserve the source page, licence URL, archive hash, selected-file hashes, and transformation history;
- licence status is rechecked at ingestion time, not assumed from this research date.

This document records engineering provenance controls, not legal advice.

## Shortlist

| Candidate / primary source | Primary-source evidence | Provenance and obligations | Commercial bundled redistribution | Visual fit and decision |
|---|---|---|---|---|
| [Kenney Pixel Platformer](https://kenney.nl/assets/pixel-platformer) | Official page lists tile size **18×18**, 200+ files, licence **Creative Commons CC0**. | Publisher/source: Kenney official asset page. Modification and attribution are not required by CC0; retain voluntary credit, source/licence snapshot, hashes, and do not imply endorsement. | **Yes**, under CC0, subject to the general trademark/privacy caveats above. | **Recommended for character candidates.** Readable silhouettes and animation-oriented platformer sprites can support active agent avatars. Main risk is 18×18 versus the office’s preferred 16×16 grid; use native dimensions in a character layer or perform one documented nearest-neighbor crop/reframe—never resample inconsistently. Do not use platform terrain as office furniture. |
| [Kenney Roguelike/RPG Pack](https://kenney.nl/assets/roguelike-rpg-pack) | Official page lists **16×16**, 1,700+ files, tags including furniture, town, panel, tile, and licence **Creative Commons CC0**. | Publisher/source: Kenney official asset page. No mandatory modification notice or attribution; retain voluntary credit and complete manifest evidence. | **Yes**, under CC0. | **Primary and recommended for furniture/interior tiles.** Best breadth and grid match. Select only desks, chairs, shelves, plants, floor/wall pieces, and neutral props. Do not reuse its pixel panels/buttons for application UI; Hermes controls must remain native. |
| [Kenney Tiny Dungeon](https://kenney.nl/assets/tiny-dungeon) | Official page lists **16×16**, 130+ files, licence **Creative Commons CC0**. | Publisher/source: Kenney official asset page. No mandatory attribution/modification notice; retain voluntary credit and provenance. | **Yes**, under CC0. | **Approved fallback, not default.** Cohesive 16×16 architecture/props, but dungeon/sewer tone is too dark for the primary office. Permit only neutral masonry, storage, plant, or prop gaps after palette/fit review. |
| [Kenney Tiny Town](https://kenney.nl/assets/tiny-town) | Official page lists **16×16**, 130+ files, licence **Creative Commons CC0**. | Publisher/source: Kenney official asset page. No mandatory attribution/modification notice; retain voluntary credit and provenance. | **Yes**, under CC0. | **Approved fallback for bright environment accents.** Grid-compatible and friendlier than Tiny Dungeon, but overworld/building imagery is not naturally an interior office. Use only per-file decor or exterior-window accents when clearly needed. |

### Considered and rejected

| Source | Reason for rejection from V1 bundle |
|---|---|
| [Kenney 1-Bit Pack](https://kenney.nl/assets/1-bit-pack) | The official page clearly marks it 16×16 and CC0, so licensing is acceptable, but its monochrome 1-bit language conflicts with the intended readable, theme-responsive office. It would require extensive recoloring and increase visual inconsistency. Do not ingest for V1. |
| Pixel Agent Desk assets | Restrictive/uncleared for this redistribution target per project brief. No clean-room use, download, copying, tracing, palette extraction, or derivative work. |
| Legacy `/home/zoe/projects/hermes-pixel-agents` assets | Dirty reference repository with unapproved provenance. Do not inspect or ingest. Concepts are governed by the clean-room spec, not files from that repository. |
| [Arlan_TR — Free office pixel art](https://arlantr.itch.io/free-office-pixel-art) | **Promising, but on hold—not approved for bundling.** The primary author page says the pack contains office objects and an animated character and is “Free to use in personal and professional projects.” It does not state a named licence or clearly grant redistribution of the raw/derived assets inside a shipped desktop plugin. Seek written clarification from the author covering commercial redistribution, modification, attribution, and sublicensing, or use the CC0 stack instead. |
| Marketplace, Pinterest, search-result, repost, sprite-sheet aggregator, and “free pixel art” pages without a primary author licence | A download button or “free” label is not redistribution permission. Reject unless primary authorship, exact licence, and source archive can be verified. |

## Exact asset-class split

| Asset class | V1 source strategy | Constraints |
|---|---|---|
| Characters | Selected Pixel Platformer sprites plus original project-specific frames/accessories | Keep raw 18×18 source provenance. Prefer a dedicated character layer rather than forcing the entire office onto an 18×18 grid. Document crop/reframe coordinates. No facial/brand likenesses. |
| Furniture | Selected Roguelike/RPG 16×16 desks, chairs, shelves, plants, storage, lamps/neutral props | Per-file selection only; coherent palette; no whole-pack inclusion. Original draw for missing modern office/Hermes props. |
| Tiles/environment | Selected Roguelike/RPG 16×16 floors/walls; Tiny Dungeon/Tiny Town only as approved gap-fillers | Canonical office grid is 16×16. Nearest-neighbor integer scaling only at render. Avoid mixing outline/perspective languages in one scene. |
| Application UI | Hermes `@hermes/plugin-sdk` controls, codicons/icons, and `--ui-*` theme variables | No raster pixel buttons, panels, text, or status colors. Accessibility and theme behavior take precedence over game aesthetics. |
| State markers | Original vector/CSS/pixel indicators driven by verified normalized state | Must not imply unobserved activity. Color is never the sole signal; include shape/text/accessible label. |
| Branding/project-specific props | Original artwork | Hermes-specific logo/wordmark use requires existing project brand authorization; otherwise use generic original desk props and role accessories. Record creator/date/tool and project licence. |

## Source asset manifest

Canonical file: `src/assets/manifest.json`. One entry per source archive plus one output record per bundled file. JSON is recommended because the verification/build scripts can parse it without another runtime dependency.

```json
{
  "schemaVersion": 1,
  "generatedAt": "2026-07-30T00:00:00Z",
  "sources": [
    {
      "id": "kenney-roguelike-rpg-pack",
      "publisher": "Kenney",
      "title": "Roguelike/RPG Pack",
      "sourcePage": "https://kenney.nl/assets/roguelike-rpg-pack",
      "sourcePageRetrievedAt": "RFC3339 UTC",
      "sourcePageSnapshot": "provenance/kenney-roguelike-rpg-pack.html",
      "sourcePageSha256": "<64 lowercase hex>",
      "downloadUrl": "<final primary-source archive URL recorded at ingestion>",
      "archiveFile": "vendor/kenney-roguelike-rpg-pack.zip",
      "archiveSha256": "<64 lowercase hex>",
      "licenseSpdx": "CC0-1.0",
      "licenseUrl": "https://creativecommons.org/publicdomain/zero/1.0/",
      "licenseSnapshot": "provenance/CC0-1.0.html",
      "licenseSnapshotSha256": "<64 lowercase hex>",
      "attributionRequired": false,
      "modificationNoticeRequired": false,
      "commercialRedistribution": true,
      "credit": "Selected art from Kenney (CC0 1.0)",
      "approvedBy": "<reviewer>",
      "approvedAt": "RFC3339 UTC"
    }
  ],
  "outputs": [
    {
      "path": "generated/furniture/desk-a.png",
      "sha256": "<64 lowercase hex>",
      "sourceId": "kenney-roguelike-rpg-pack",
      "sourceFiles": ["<exact archive-relative path>"],
      "sourceFileSha256": ["<64 lowercase hex>"],
      "transform": {
        "tool": "scripts/build-assets.mjs",
        "toolVersion": "<git blob hash or package version>",
        "operations": ["crop:x,y,w,h", "palette-map:<named-map>"],
        "dimensions": [16, 16],
        "interpolation": "nearest"
      },
      "purpose": "Pixel Office desk variant A"
    }
  ]
}
```

For original assets use `sourceId: "pixel-agents-original"` and record creator, creation date, source project file hash, tool/version, declared project licence, and output hash. “AI generated” is not sufficient provenance; if generative tooling is used, record tool/model, input provenance, review for third-party marks/likenesses, and retain the editable original. Prefer human-drawn originals for the small project-specific V1 gap set.

## Provenance and ingestion checks

No download is approved merely because a source appears in the shortlist. The asset pull request must pass this sequence:

1. Open the primary publisher page directly; reject mirrors and reposts.
2. Capture retrieval time, final page URL, page snapshot, screenshot if licence text is rendered dynamically, and SHA-256.
3. Confirm the page names the exact pack and exact licence; follow the licence link and capture the legal/deed reference.
4. Download only from the primary page’s current link. Record the final resolved URL, HTTP metadata where available, archive filename/size, and SHA-256.
5. Scan archive paths for licence/readme files and conflicts. If archive terms contradict the page, quarantine and reject pending human/legal review.
6. Enumerate every selected source file and hash it before transformation. Do not ingest complete packs into the production tree.
7. Transform deterministically with a pinned script; reject lossy scaling, non-integer scaling baked into sprites, antialiasing, unexplained palette edits, metadata-bearing source files, and nondeterministic output.
8. Verify PNG signatures, dimensions, alpha mode, file size bounds, duplicate hashes, and absence of executable/polyglot content.
9. Ensure every production asset has exactly one manifest output record and every manifest output exists; reject orphaned files and path traversal.
10. Recompute all hashes in CI from a clean checkout. Generated output must be byte-identical or the build fails.
11. Generate `THIRD_PARTY_ASSETS.md` from the manifest and manually review credits, licence, modifications, and non-endorsement wording.
12. Render a contact sheet in light/dark/custom Hermes themes; review coherence, contrast, nearest-neighbor sharpness, and state-marker accessibility.
13. Independent reviewer reopens primary URLs and recomputes hashes before SHIP.

The source archives and page/licence snapshots may be retained in a provenance bundle outside the shipped plugin if package size or source-distribution policy requires it, but their hashes and durable review location must remain in the manifest/release evidence. Never rely on a live URL alone: pages and archives can change.

## Asset pipeline acceptance criteria

SHIP only when:

- every bundled raster has a manifest record, source-file hash, output hash, licence, purpose, and deterministic transform;
- all non-original third-party outputs trace to one of the approved primary-source CC0 entries above;
- `scripts/verify-assets.mjs` rejects missing, extra, changed, malformed, oversized, or path-escaping files;
- `scripts/build-assets.mjs` reproduces byte-identical outputs in a clean environment;
- no remote URL is loaded at plugin runtime;
- no Pixel Agent Desk or legacy repository material, palette trace, derivative, filename, or hidden metadata is present;
- UI chrome remains Hermes-native and all project-specific identity art is original;
- voluntary credit is accurate and does not imply Kenney endorsement;
- an independent reviewer confirms the current source pages still state CC0 and records the review date.

## Sources

- Kenney, Pixel Platformer: https://kenney.nl/assets/pixel-platformer
- Kenney, Roguelike/RPG Pack: https://kenney.nl/assets/roguelike-rpg-pack
- Kenney, Tiny Dungeon: https://kenney.nl/assets/tiny-dungeon
- Kenney, Tiny Town: https://kenney.nl/assets/tiny-town
- Kenney, 1-Bit Pack (considered/rejected for fit): https://kenney.nl/assets/1-bit-pack
- Creative Commons, CC0 1.0 Universal deed: https://creativecommons.org/publicdomain/zero/1.0/
