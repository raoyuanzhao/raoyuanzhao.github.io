# Third-party notices

This website combines code and design from the following projects. Both are distributed under the MIT License, whose terms require the copyright and permission notices below to be kept with copies or substantial portions of the software.

## PRISM

- Source: https://github.com/xyjoey/PRISM (imported at commit `f2748db`)
- Used for: application architecture (Next.js App Router, static export), TOML content loading, BibTeX publication system, theme and locale stores, page types, and deployment workflow. Many files under `src/` are modified versions of PRISM files.
- License: MIT, full text in [LICENSE](LICENSE).

```
Copyright (c) 2025 PRISM
```

## Luka Homepage Template

- Source: https://github.com/wzsyyh/luka-homepage-template
- Used for: visual design — colour palette, typography scale, profile sidebar layout, section heading style, publication card accent border, timeline, and the visitor map card. No files were copied verbatim; the design was re-implemented in Tailwind CSS (`src/app/globals.css` and components).
```
MIT License

Copyright (c) 2023-present George Cushen (https://georgecushen.com/)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## Fonts and icons

- **Inter** by Rasmus Andersson, SIL Open Font License 1.1. Downloaded at build time by `next/font` and self-hosted with the site.
- **Heroicons** by Tailwind Labs, MIT License (npm dependency `@heroicons/react`).
- Brand icons in `src/components/ui/icons.tsx` (GitHub, Hugging Face, LinkedIn, Google Scholar, Semantic Scholar, ORCID, X, Bluesky) are simplified marks used only to link to the respective profiles; the trademarks belong to their owners. The Semantic Scholar mark is from [Simple Icons](https://simpleicons.org/) 13.21.0 and the Hugging Face mark from Simple Icons 16.37.0 (both CC0-1.0).
- **Country flags** in the visitor map card: [flag-icons](https://github.com/lipis/flag-icons) 7.6.0 by Panayiotis Lipiridis, MIT License (npm dependency `flag-icons`; the needed SVGs are copied to `public/flags/` at build time).
- **Favicon** (`public/favicon.svg`, `favicon-32.png`, `apple-touch-icon.png`): the 🍧 shaved ice emoji from [Noto Emoji](https://github.com/googlefonts/noto-emoji) (`2D/svg/emoji_u1f367.svg`, commit `99701e0`), © Google, Apache License 2.0 (https://www.apache.org/licenses/LICENSE-2.0). Modified: Illustrator metadata removed, PNG versions rendered from it.

## Map data

`public/world-map.svg` (the static world map in the visitor map card) was generated from the 1:110m land dataset of [Natural Earth](https://www.naturalearthdata.com/), which is in the public domain, as packaged in [world-atlas](https://github.com/topojson/world-atlas) 2.0.2 (Miller projection, Antarctica omitted).

`src/lib/countryLabelPoints.json` (where each country's dot is placed on that map) contains the label points (`LABEL_X`/`LABEL_Y`) of the Natural Earth 1:10m Admin 0 countries dataset (public domain), keyed by ISO 3166-1 alpha-2 code, plus approximate points for French Guiana, Guadeloupe, Martinique, Réunion, Mayotte, Caribbean Netherlands, Christmas Island, Cocos Islands, Svalbard, Tokelau, and Bouvet Island, which that dataset includes in other countries.

```
Copyright 2013-2019 Michael Bostock

Permission to use, copy, modify, and/or distribute this software for any purpose
with or without fee is hereby granted, provided that the above copyright notice
and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND
FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS
OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER
TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF
THIS SOFTWARE.
```

## Institution logos

The logos in `public/logos/` (cropped and resized) identify the institutions listed on the Experience and CV pages. They are trademarks of their respective owners and are not covered by this repository's license.

- `lmu.png`: LMU Munich logo, [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:LMU_Muenchen_Logo.svg), public domain (simple geometry/text).
- `th-luebeck.png`: TH Lübeck logo, [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Logo_TH_Luebeck_new.svg), public domain (simple geometry/text).
- `tum.png`: Technical University of Munich logo, [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Logo_of_the_Technical_University_of_Munich.svg), public domain (simple geometry/text).
- `cohere.png`: Cohere logo mark, [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Cohere-Logo.png), CC0.
- `ecust.png`: East China University of Science and Technology emblem, from [English Wikipedia](https://en.wikipedia.org/wiki/File:ECUST_university_logo.png), where it is a non-free image used under fair use. Replace it with an official version if needed.

Other npm dependencies are listed in `package.json`; their licenses are included in their packages.
