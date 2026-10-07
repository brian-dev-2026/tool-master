# Tool-Master — Design Spec

**Date:** 2026-10-07
**Status:** Draft, awaiting review

## 1. Goal

Tool-Master is one browser app that holds many everyday tools: document converters, data converters, image tools and developer utilities. It runs locally on the user's Windows PC, is free, keeps files private, and is easy to extend with new tools. Deployment target is undecided, so nothing in the design may block deploying it to a server later.

**Success criteria**
- All 47 v1 tools listed in §4 work end to end from the browser.
- Adding a new tool takes one folder plus one registry line, with no changes to routing, home page or API code.
- The UI matches the approved "Clean Light" mockup: MDI icons on soft gray tiles, Tile Grid logo, light/dark toggle.
- A missing external engine (Word, LibreOffice, Ghostscript) never crashes the app. Affected tools show what to install.

**Non-goals (v1)**
- User accounts, history, databases, cloud storage.
- Paid or online APIs.
- OCR for scanned PDFs.
- Mobile-specific layouts (the layout must still be responsive and usable on narrow screens).

## 2. Tech stack

| Concern | Choice |
|---|---|
| Framework | Next.js (latest stable, App Router), TypeScript |
| Styling | Tailwind CSS, CSS variables for light/dark theme tokens |
| Font | Inter via `next/font` |
| Icons | `@mdi/js` + `@mdi/react` (Material Design Icons) |
| Server runtime | Next.js Route Handlers on the Node.js runtime |
| PDF (browser) | `pdf-lib`, `pdfjs-dist` |
| Spreadsheets (browser) | `xlsx` (SheetJS), `papaparse` |
| Zip (browser) | `jszip` |
| QR | `qrcode` |
| MD5 | `spark-md5` (SHA hashes use Web Crypto) |
| HEIC decoding (browser) | `heic2any` |
| Image cropping UI | `react-image-crop` |
| XML / YAML | `fast-xml-parser`, `yaml` |
| Markdown | `marked` + `dompurify` (sanitized preview) |
| Text diff | `diff` |
| Background removal | `@huggingface/transformers` (ONNX Runtime for Node) with BiRefNet models; `sharp` for image resize/compositing |
| Office conversion | MS Office (Word, Excel, PowerPoint) through PowerShell COM automation; LibreOffice `soffice --headless` |
| PDF compression | Ghostscript (`gswin64c`) |
| Tests | Vitest (unit + server), Playwright (one smoke test) |

The project lives at the root of `C:\Users\ihs102\Desktop\converter` with package name `tool-master`.

## 3. Architecture

Single Next.js app (approach A). Light tools run in the browser. Heavy tools run in Node route handlers. Both kinds share one registry.

```
app/
  layout.tsx                    # fonts, theme provider, top nav
  page.tsx                      # home: hero, search, category tabs, tool grid
  tools/[slug]/page.tsx         # renders any tool from the registry
  api/tools/[slug]/route.ts     # POST endpoint for server tools
  api/engines/route.ts          # GET: which external engines are installed
components/
  Logo.tsx  ThemeToggle.tsx  SearchBox.tsx  CategoryTabs.tsx
  ToolCard.tsx  ToolHeader.tsx  Dropzone.tsx  FileQueue.tsx
  SegmentedControl.tsx  BeforeAfterSlider.tsx  DownloadButton.tsx
tools/
  registry.ts                   # array of every tool's meta, the single source of truth
  types.ts                      # ToolMeta, ClientTool, ServerTool interfaces
  <slug>/meta.ts                # name, description, icon, category, runs, accept, options
  <slug>/client.ts | server.ts  # implementation
  <slug>/ui.tsx                 # optional custom UI (text tools, before/after, etc.)
lib/
  engines/msoffice.ts           # PowerShell COM: Word (docx↔pdf), Excel (xlsx→pdf), PowerPoint (pptx→pdf)
  engines/libreoffice.ts        # soffice headless
  engines/ghostscript.ts        # gswin64c
  engines/office.ts             # engine selection: requested → auto → error
  engines/detect.ts             # locate executables / check Word COM, cached
  engines/queue.ts              # one job at a time per engine
  jobs/tempdir.ts               # per-job temp folder with guaranteed cleanup
  bg/birefnet.ts                # model loading (cached singleton) + inference
  config.ts                     # max file size, timeouts, model cache dir
test/
  fixtures/                     # tiny sample .docx, .pdf, .xlsx, .png, etc.
```

### 3.1 Tool contract

```ts
type Category = 'documents' | 'data' | 'images' | 'dev';

interface ToolMeta {
  slug: string;                 // URL: /tools/<slug>
  name: string;                 // "PDF → Word"
  description: string;
  icon: string;                 // an @mdi/js path
  category: Category;
  runs: 'client' | 'server';
  input: 'files' | 'text' | 'none';
  accept?: string[];            // e.g. ['.doc', '.docx']
  multiple?: boolean;           // batch support
  options?: ToolOption[];       // rendered by the generic tool page
  requires?: EngineId[];        // e.g. ['word', 'libreoffice'] (any of)
}

interface ClientTool { run(input: File | string, options: Record<string, unknown>): Promise<ToolOutput>; }
interface ServerTool { run(inputPath: string, options: Record<string, unknown>, job: JobContext): Promise<string /* output path */>; }
```

- `ToolOption` covers: segmented choice, number, checkbox, select, color, range slider.
- The generic tool page renders header, dropzone or text input, options and results from `meta`. A tool needs a custom `ui.tsx` only when the generic layout doesn't fit (JSON formatter, color converter, background remover).

### 3.2 Data flow

**Client tool:** the user picks files or types text → `client.ts` runs in the browser → result Blob → download. Nothing leaves the machine's browser.

**Server tool:**
1. The browser sends **one request per file**: `POST /api/tools/<slug>`, multipart with `file` + `options` (JSON). This gives per-file progress and per-file errors.
2. The route validates the slug, `runs === 'server'`, extension and size.
3. It creates a temp dir under the OS temp folder, writes the input there and calls `server.run()` through the engine queue, with a timeout.
4. It streams the output back with `Content-Disposition: attachment; filename=...`.
5. It deletes the temp dir in `finally`.

Batch "Download all" zips the completed results in the browser with `jszip`.

**Errors** return JSON `{ error: string, code: string }` with status 400 (bad input), 413 (too large), 503 (engine missing) or 500 (conversion failed).

### 3.3 Engines

`GET /api/engines` returns e.g. `{ word: true, excel: true, powerpoint: false, libreoffice: false, ghostscript: true }`, detected once and cached for the process lifetime. A `?refresh=1` query re-detects.

- **MS Office detection:** for each of Word, Excel and PowerPoint, check through the registry (`HKCR\<App>.Application\CLSID`) that the COM class is registered. This avoids launching the apps.
- **LibreOffice detection:** look for `soffice.exe` in `PATH`, `C:\Program Files\LibreOffice\program\` and `C:\Program Files (x86)\LibreOffice\program\`. An env override is `LIBREOFFICE_PATH`.
- **Ghostscript detection:** `gswin64c` in `PATH`, or the newest `C:\Program Files\gs\gs*\bin\gswin64c.exe`. An env override is `GHOSTSCRIPT_PATH`.

**Engine selection** (`office.ts`): the user's choice is `auto | msoffice | libreoffice`, shown in the UI as "Auto / MS Office / LibreOffice".
- `auto` → the MS Office app the tool needs if available, else LibreOffice, else 503.
- An explicitly chosen but missing engine → 503 with an install hint.

**MS Office automation** runs a PowerShell script per job.

For every app:
- Setup: `Visible=false`, `DisplayAlerts` off.
- Teardown: close without saving and `Quit()` in a `finally`.
- If a job times out, the specific Office process started for that job is killed. The process ID is captured by the script.

Per app:
- **Word:**
  - docx→pdf: `Documents.Open(path, ConfirmConversions=false, ReadOnly=true)` then `SaveAs2(out, 17)`.
  - pdf→docx: the same open, then `SaveAs2(out, 16)`.
- **Excel:** `Workbooks.Open(path, ReadOnly=true)` then `ExportAsFixedFormat(0, out)` for the whole workbook.
- **PowerPoint:** `Presentations.Open(path, ReadOnly, Untitled, WithWindow=false)` then `SaveAs(out, 32)`.

**LibreOffice:**
- doc/docx/xls/xlsx/ppt/pptx→pdf: `soffice --headless --norestore --convert-to pdf --outdir <dir> <file>`.
- pdf→docx: `--infilter=writer_pdf_import --convert-to docx:"MS Word 2007 XML"`.
- Each job uses `-env:UserInstallation=file:///<jobdir>/lo-profile` so a stuck profile can't break later jobs.

**Ghostscript:** `-sDEVICE=pdfwrite -dPDFSETTINGS=/screen|/ebook|/printer -dNOPAUSE -dBATCH -dQUIET`, mapped from the user-facing levels Strong / Balanced / Light.

**Queue:** each engine has a FIFO queue with concurrency 1. Background removal has its own queue with concurrency 1.

## 4. v1 tools

### Documents
| Slug | Name | Runs | Implementation |
|---|---|---|---|
| `pdf-to-word` | PDF → Word | server | Word or LibreOffice, Engine option (Auto/MS Office/LibreOffice), batch |
| `word-to-pdf` | Word → PDF | server | Word or LibreOffice, Engine option, batch |
| `excel-to-pdf` | Excel → PDF | server | Excel or LibreOffice, Engine option, batch |
| `powerpoint-to-pdf` | PowerPoint → PDF | server | PowerPoint or LibreOffice, Engine option, batch |
| `merge-pdf` | Merge PDFs | client | pdf-lib; drag to reorder files |
| `split-pdf` | Split PDF | client | pdf-lib; modes: every page / page ranges (e.g. `1-3,5`); multiple outputs zipped |
| `images-to-pdf` | Images → PDF | client | pdf-lib; JPG/PNG (WebP converted via canvas first); page size Fit/A4/Letter; reorderable |
| `pdf-to-images` | PDF → Images | client | pdfjs-dist; PNG or JPG; scale 1×/2×/3×; zipped |
| `compress-pdf` | Compress PDF | server | Ghostscript; Strong/Balanced/Light; shows before/after size; batch |
| `rotate-pdf` | Rotate PDF | client | pdf-lib; rotate all pages or selected pages 90°/180°/270°; page thumbnails via pdfjs |
| `organize-pdf` | Organize Pages | client | pdf-lib + pdfjs thumbnails; drag to reorder, click to delete; save as new PDF |
| `page-numbers` | Add Page Numbers | client | pdf-lib; position (6 spots), start number, format (`1` / `Page 1` / `1 of N`), font size |
| `watermark-pdf` | Add Watermark | client | pdf-lib; text watermark, font size, opacity, rotation, color; all pages |

### Data (all client)
| Slug | Name | Notes |
|---|---|---|
| `excel-to-json` | Excel → JSON | Options: sheet (one or all → object keyed by sheet), first row is header (on → array of objects, off → array of arrays). Preview + copy + download |
| `json-to-excel` | JSON → Excel | Accepts an array of objects (one sheet) or an object of arrays (one sheet per key). File or pasted text |
| `csv-to-excel` | CSV → Excel | Delimiter auto-detect (papaparse) |
| `excel-to-csv` | Excel → CSV | Sheet selector; multiple sheets zipped |
| `csv-to-json` | CSV → JSON | Header toggle, numbers auto-typed |
| `json-to-csv` | JSON → CSV | Array of objects; nested objects flattened with dot keys |
| `xml-to-json` | XML → JSON | fast-xml-parser; option to keep attributes (`@_` prefix) |
| `json-to-xml` | JSON → XML | fast-xml-parser builder; root element name option; pretty-printed |
| `yaml-to-json` | YAML → JSON | `yaml`; multi-document YAML → array |
| `json-to-yaml` | JSON → YAML | `yaml`; indent option |
| `json-to-typescript` | JSON → TypeScript | Own small type inferrer: nested interfaces, arrays, optional fields when keys are missing in some array items, root name option |
| `markdown-to-html` | Markdown → HTML | `marked`; side-by-side editor + live sanitized preview; copy HTML or download `.html` |

### Images
| Slug | Name | Runs | Notes |
|---|---|---|---|
| `remove-background` | Remove Background | server | BiRefNet. Quality: Best (`onnx-community/BiRefNet-ONNX`) / Fast (`onnx-community/BiRefNet_lite-ONNX`). Full-resolution mask. Before/after slider. Background: transparent / color / image (compositing done in the browser on canvas). Batch → zip |
| `convert-image` | Convert Image | client | PNG/JPG/WebP via canvas; JPG/WebP quality slider; JPG gets a white background for transparency; batch |
| `resize-image` | Resize Image | client | Width/height px or %, keep aspect ratio; batch |
| `compress-image` | Compress Image | client | Quality slider, optional max dimension, shows before/after size; batch |
| `crop-image` | Crop Image | client | `react-image-crop`; free or fixed aspect (1:1, 4:3, 16:9, custom) |
| `rotate-image` | Rotate & Flip | client | Canvas; rotate 90°/180°/270°, flip horizontal/vertical; batch |
| `heic-to-jpg` | HEIC → JPG | client | `heic2any`; JPG or PNG output, quality slider; batch |
| `favicon-generator` | Favicon Generator | client | Canvas; outputs `favicon.ico` (16/32/48 PNG-in-ICO, encoded by our own small ICO writer), PNG 180/192/512, plus an HTML `<link>` snippet; zipped |
| `image-to-base64` | Image → Base64 | client | Data URL + raw base64; copy buttons; ready-made `<img>` and CSS snippets |

### Dev & Text (all client, text-based custom UIs)
| Slug | Name | Notes |
|---|---|---|
| `qr-code` | QR Code Generator | Text/URL input, size, foreground/background color, error correction level; PNG + SVG download |
| `base64` | Base64 Encode/Decode | Text mode and file mode (file → data URL / base64 → file download) |
| `json-formatter` | JSON Formatter | Format (2/4 spaces, tabs), minify, validate with line/column error |
| `color-converter` | Color Converter | HEX ↔ RGB ↔ HSL with live swatch and native color picker |
| `hash-generator` | Hash Generator | MD5, SHA-1, SHA-256, SHA-512 of text or file; copy buttons |
| `uuid-generator` | UUID Generator | v4 (`crypto.randomUUID`) and v7 (time-ordered); count 1–1000; uppercase / no-hyphens options |
| `password-generator` | Password Generator | `crypto.getRandomValues`; length, character sets, exclude look-alikes; strength meter (entropy bits) |
| `url-encoder` | URL Encode/Decode | Component vs full-URL mode; plus a URL parser showing parts and query params |
| `jwt-decoder` | JWT Decoder | Decodes header and payload (no signature verification, clearly labeled); shows `exp`/`iat` as dates and an expired badge |
| `timestamp-converter` | Timestamp Converter | Unix seconds/ms ↔ date; local time, UTC and ISO 8601; "now" button |
| `case-converter` | Text Case Converter | UPPER, lower, Title, Sentence, camelCase, PascalCase, snake_case, kebab-case, CONSTANT_CASE |
| `word-counter` | Word & Character Counter | Words, characters (with/without spaces), sentences, paragraphs, reading time; live |
| `text-diff` | Text Diff | `diff`; two text boxes; side-by-side or inline view; line or word mode |

Total: 13 Documents + 12 Data + 9 Images + 13 Dev & Text = **47 tools**. This list is the authoritative v1 set.

## 5. Background removal details

- `lib/bg/birefnet.ts` keeps one loaded model per quality level as a lazy singleton.
- Model files cache in `./.cache/models` (gitignored).
- Pipeline:
  1. Read the image with `sharp` and apply EXIF rotation.
  2. Resize to 1024×1024 and normalize per the model's preprocessor config.
  3. Run inference to get a 1024×1024 mask.
  4. Resize the mask to the original size with `sharp` (Lanczos).
  5. Join it as the alpha channel and output a PNG.
- **First-use download:** model download progress is exposed through `GET /api/tools/remove-background/status`, which returns `{ state: 'idle'|'downloading'|'ready', progress }`. The UI polls this and shows a progress bar on first use.
- **Implementation risk:** confirm early that both BiRefNet ONNX models load and run under `@huggingface/transformers` on Node with acceptable memory. If the full model is too heavy for the machine, Fast becomes the default. This is checked as the first task of the background-remover work.

## 6. UI design

Per the approved mockups (`.superpowers/brainstorm/…/home-v2.html`, `tool-page.html`).

- **Logo:** Tile Grid. Four rounded tiles sharing one indigo→cyan gradient (`#6366F1 → #22D3EE`); the top-right tile is a tilted pink diamond (`#F472B6`). Wordmark is "tool" plus "master", with "master" in the gradient. It is a React SVG component and is also exported as the favicon/app icon.
- **Theme tokens:** light uses bg `#F8FAFC`, surface `#FFFFFF`, border `#E2E8F0`, text `#0F172A`, muted `#64748B`, icon `#334155`, icon tile `#F1F5F9`. Dark uses `#0B0F1A`, `#111827`, `#1F2937`, `#F1F5F9`, `#94A3B8`, `#CBD5E1`, `#1F2937`. Accent: the indigo→cyan gradient and `#6366F1` for focus rings. Success `#10B981`, error `#EF4444`.
- **Theme behavior:** default follows the system; the toggle in the nav overrides it and is saved in `localStorage`. No flash on load (inline script sets the class before paint).
- **Home:** nav (logo, theme toggle) → hero "Every tool you need. One place." + subtitle → search box (Ctrl+K focuses it, filters by name/description) → category pills (All, Documents, Data, Images, Dev & Text) → responsive grid (4/3/2/1 columns). Tool cards show an MDI icon on a soft gray tile, the name and a one-line description. Hover/focus adds an indigo border + soft ring.
- **Tool page:** "← All tools" link → header (icon tile, name, description) → dropzone or text input → options (segmented controls) → file queue (status icon, name, size/state, progress bar, per-file download) → actions (Clear, Download all .zip). Engine-dependent tools show an inline notice when the chosen engine is unavailable.
- **Icons:** only `@mdi/js` icons, monochrome, using the icon color token. No colored badges or emoji.

## 7. Errors and limits

- `lib/config.ts`: `MAX_FILE_MB = 50`, `JOB_TIMEOUT_MS = 120000`, `MODEL_CACHE_DIR = '.cache/models'`.
- Client-side validation (type, size) happens before upload. The server re-validates.
- Per-file failure shows red "Failed" + message; other files continue.
- Engine missing → 503 with `code: 'ENGINE_MISSING'` and a human message with an install link.
- Temp dirs are always removed in `finally`. On startup, leftover `tool-master-*` temp dirs older than 1 hour are deleted.
- Client tools catch errors and show them in the same per-file / inline error style (e.g. invalid JSON shows line and column).

## 8. Testing

- **Unit (Vitest):** pure logic for every client tool, against known inputs and outputs: Excel/CSV/JSON conversions with fixture files, hash outputs against known digests, base64 round-trip, color conversions, JSON formatter errors, split-range parsing, PDF merge page counts.
- **Server (Vitest):** each server tool against `test/fixtures` files. Tests needing Word/LibreOffice/Ghostscript/models use `describe.skipIf(!engineAvailable)`.
- **Registry test:** every registry entry has a valid meta and the matching `client.ts`/`server.ts`, and slugs are unique.
- **E2E (Playwright, one smoke test):** load home → search "json" → open JSON → Excel → upload fixture → result downloads.

## 9. Extending

To add a tool:
1. Create `tools/<slug>/meta.ts` and either `client.ts` or `server.ts` (plus `ui.tsx` if needed).
2. Add it to `tools/registry.ts`.

The home grid, search, `/tools/<slug>` page and `/api/tools/<slug>` endpoint work automatically.

## 10. Deployment notes (for later)

- Client tools work anywhere.
- Server tools need Node, plus LibreOffice/Ghostscript installed on the host. MS Office engines only work on a Windows host with Office installed.
- Background removal needs about 1–2 GB of RAM headroom.
- Nothing in the code assumes Windows except `engines/msoffice.ts`, which is skipped by detection on other platforms.
