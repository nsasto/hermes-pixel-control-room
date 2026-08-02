# Hermes Pixel Control Room

A planned view-only plugin for the browser-based Hermes web dashboard. It presents configured Hermes profiles as persistent pixel characters in a live office control room.

The project is currently in the planning phase. See:

- [`DECISION-MAP.md`](./DECISION-MAP.md) for settled decisions and remaining investigation
- [`CONTEXT.md`](./CONTEXT.md) for the project's domain language
- [`PROVISIONAL-PLAN.md`](./PROVISIONAL-PLAN.md) for a concrete implementation direction and validation risks
- [`docs/specs/control-room-ui-and-themes.md`](./docs/specs/control-room-ui-and-themes.md) for the UI, theme selector, and local pixel-pack contract

## Pixel art assets

The pixel artwork is commercially licensed and is not included in this repository.

Purchase or download the required **Luxury Office – Pixel Art Asset Pack** from:

https://lennoxstudio.itch.io/luxury-office-pixel-art-asset-pack

After obtaining the pack, place its contents locally under:

```text
assets/pixel_art/
```

That directory is excluded from Git and must not be committed or redistributed. Keep the pack's original licence file with your local copy.

For the Modern Corporate Office theme, keep the pack directory named
`Modern_Corporate_Office_Pixel_Art_Asset_Pack_v1.0`. Running `npm run build`
validates the licensed source and converts the empty room scene and eight
individual characters into lossless WebP project assets. The native output is
written under ignored `dist/themes/`; browser-dashboard output is written under
ignored `dashboard/dist/themes/`. Keep the matching ignored theme directory with
the plugin installation, then restart/reload Hermes after adding or changing
local assets. Original source PNGs are never copied into browser-served output.
The build uses Python and Pillow (`python -m pip install Pillow`) for this local
lossless conversion step.
