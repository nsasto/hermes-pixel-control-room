# Third-party assets

The source repository bundles no third-party binary assets. A local build can
prepare the user-supplied **Modern Corporate Office Pixel Art Asset Pack v1.0**
from [LennoxStudio](https://lennoxstudio.itch.io/luxury-office-pixel-art-asset-pack).

The build selects only:

- `Modern_Corporate_Office_Empty.png`;
- eight individual seated character PNGs.

The source files and generated `dist/themes/` directory are ignored by Git and
must not be included in a public release archive or redistributed as an asset
collection. The build checks the supplied English licence, exact source hashes,
PNG format, scene dimensions, required identities/stations, and generated output
hashes. Canonical paths and SHA-256 values live in
`src/themes/modern-corporate-v1.json`; local output provenance is recorded in
`dist/theme-catalog.json`.

The asset-free `Simple office` fallback remains original DOM/CSS geometry using
Hermes theme variables.
