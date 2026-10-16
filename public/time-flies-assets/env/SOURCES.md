# Environment maps

All CC0 (public domain) from Poly Haven.

| File | Source | Author |
| --- | --- | --- |
| `hangar-1k.hdr` (lighting), `hangar.jpg` (backdrop) | [Empty Warehouse 01](https://polyhaven.com/a/empty_warehouse_01) | Sergej Majboroda |
| `sky-1k.hdr` (lighting), `sky.jpg` (backdrop) | [Kloofendal 48d Partly Cloudy (Pure Sky)](https://polyhaven.com/a/kloofendal_48d_partly_cloudy_puresky) | Greg Zaal, Jarod Guest |

The `.hdr` files are the 1k downloads, unchanged. The JPEGs come from the 4k downloads via
`npx tsx tools/env-backdrop.ts <in.hdr> <out.jpg> 4096 <exposure>`: exposure 1.6 for the hangar, 0.9 for the sky.
