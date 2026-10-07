# Tool-Master Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build Tool-Master, a local Next.js browser app with 47 document, data, image and dev/text tools behind one plug-in registry.

**Architecture:** There is a single Next.js App Router project. Each tool is a folder with a `meta.ts` and either a browser `client.ts` or a Node `server.ts`.
- A metadata-only registry drives the home grid, search and a generic `/tools/[slug]` page.
- Heavy tools POST one file per request to `/api/tools/[slug]`. That route runs the work through per-engine queues in throwaway temp dirs.
- External engines (MS Office via PowerShell COM, LibreOffice, Ghostscript) are auto-detected. BiRefNet runs through `@huggingface/transformers`.

**Tech Stack:** Next.js (latest, App Router, TypeScript), Tailwind CSS, `@mdi/js` + `@mdi/react`, pdf-lib, pdfjs-dist, xlsx, papaparse, jszip, qrcode, spark-md5, heic2any, react-image-crop, fast-xml-parser, yaml, marked, dompurify, diff, @huggingface/transformers, sharp, Vitest, Playwright.

**Spec:** [docs/specs/2026-10-07-tool-master-design.md](../specs/2026-10-07-tool-master-design.md)

## Global Constraints

- Project root is `C:\Users\ihs102\Desktop\converter`, and the package name is `tool-master`.
- Every route handler that touches the filesystem or child processes sets `export const runtime = 'nodejs'`.
- Icons: only `@mdi/js` paths rendered through `@mdi/react`. They are monochrome and use the icon color token. No emoji and no colored badges.
- Theme tokens are exactly the spec values:
  - Light: bg `#F8FAFC`, surface `#FFFFFF`, border `#E2E8F0`, text `#0F172A`, muted `#64748B`, icon `#334155`, icon tile `#F1F5F9`.
  - Dark: `#0B0F1A`, `#111827`, `#1F2937`, `#F1F5F9`, `#94A3B8`, `#CBD5E1`, `#1F2937`.
  - Accent gradient `#6366F1 → #22D3EE`, pink `#F472B6`, success `#10B981`, error `#EF4444`.
- `lib/config.ts`: `MAX_FILE_MB = 50`, `JOB_TIMEOUT_MS = 120000`, `MODEL_CACHE_DIR = '.cache/models'`.
- Error JSON shape is `{ error: string, code: string }`. Statuses are 400 bad input, 404 unknown tool, 413 too large, 503 `ENGINE_MISSING`, 500 `CONVERSION_FAILED` / `TIMEOUT`.
- Engine choice values are `'auto' | 'msoffice' | 'libreoffice'`, shown as "Auto / MS Office / LibreOffice".
- Server tool requests are one file per request; batch zipping happens in the browser.
- Temp dirs are prefixed `tool-master-` under `os.tmpdir()` and always removed in `finally`. On startup, leftovers older than 1 hour are swept.
- Copy: hero "Every tool you need. One place." and subtitle "Convert, edit and create — free, private, fast."
- Categories: `documents` "Documents", `data` "Data", `images` "Images", `dev` "Dev & Text".
- Tests that need Word/Excel/PowerPoint/LibreOffice/Ghostscript/models use `describe.skipIf(!available)`.

## Review Focus

1. **Filenames with spaces, apostrophes and non-ASCII characters** (`Q3 report — José's.docx`) must survive PowerShell quoting, the `soffice` arguments and `Content-Disposition` (RFC 5987 `filename*=`), and the user downloads `Q3 report — José's.pdf`. Tests are in Task 5 (header) and Task 7 (quoting).
2. **Corrupt, empty or password-protected input** (a `.docx` that is really a text file, an encrypted PDF) must give that file a "Failed" row with a short reason. It must never hang on a hidden Office dialog, and the batch continues. Tests are in Task 7 (msoffice script uses `PasswordDocument` dummy + `DisplayAlerts`), Task 9 (pdf-lib encrypted), Task 12 (garbage xlsx).
3. **A failed or timed-out job must not jam the engine queue.** The next queued job still runs, and the timed-out Office/soffice process is killed. Tests are in Task 5 (queue) and Task 7 (kill on timeout).
4. **Empty data** (an empty CSV, `[]`, an empty sheet, whitespace-only JSON) must give a friendly message rather than an exception stack or an empty download. Tests are in Task 12 and Task 13.
5. **Phone photos** (EXIF-rotated JPEG, transparent PNG to JPG) must come out upright, with a white background instead of black. Tests are in Task 14 (`decodeImage` uses `imageOrientation: 'from-image'`, and the JPG background fill is asserted through `encodeCanvas` options) and Task 16 (sharp `.rotate()`).

---

## File Structure

```
app/layout.tsx                      root layout: Inter font, ThemeScript, Nav
app/page.tsx                        home (client component HomeGrid inside)
app/globals.css                     Tailwind + theme CSS variables
app/tools/[slug]/page.tsx           server page → <ToolPage slug>
app/api/tools/[slug]/route.ts       POST → handleToolRequest
app/api/engines/route.ts            GET → detectEngines
app/api/tools/remove-background/status/route.ts   GET model status
instrumentation.ts                  startup temp sweep
components/  Logo, ThemeToggle, ThemeScript, Nav, Icon, SearchBox, CategoryTabs,
             ToolCard, HomeGrid, ToolPage, ToolHeader, Dropzone, OptionsForm,
             SegmentedControl, FileQueue, EngineNotice, TextToolLayout,
             PdfThumbnails, BeforeAfterSlider, CopyButton
lib/config.ts   lib/filter.ts   lib/validate.ts   lib/zip.ts   lib/download.ts
lib/run-client.ts   lib/run-server.ts   lib/use-tool-runner.ts
lib/server/handle-request.ts   lib/server/content-disposition.ts
lib/jobs/tempdir.ts   lib/engines/{queue,detect,msoffice,libreoffice,ghostscript,office,spawn}.ts
lib/image/{decode,encode,resize-math,ico}.ts   lib/pdf/{ranges,load}.ts
lib/bg/birefnet.ts
tools/types.ts   tools/registry.ts   tools/client-loaders.ts
tools/server-loaders.ts   tools/ui-loaders.ts   tools/<slug>/{meta.ts,client.ts|server.ts,ui.tsx?}
test/**  (mirrors source paths)   test/fixtures/**   e2e/smoke.spec.ts
```

---

### Task 1: Scaffold project, theme and tooling

**Files:**
- Create: the Next.js app (via create-next-app), `app/globals.css`, `lib/config.ts`, `vitest.config.ts`, `.gitignore` additions, `test/config.test.ts`

**Interfaces:**
- Produces: `MAX_FILE_MB`, `JOB_TIMEOUT_MS`, `MODEL_CACHE_DIR` from `lib/config.ts`. CSS variables `--bg --surface --border --text --muted --icon --icon-tile --accent-from --accent-to --pink --success --error`, exposed as Tailwind colors `bg`, `surface`, `border`, `text`, `muted`, `icon`, `icon-tile`. Dark mode uses class `dark` on `<html>`.

- [ ] **Step 1: Scaffold.**
  - Run in the project root: `npx create-next-app@latest . --ts --tailwind --eslint --app --no-src-dir --import-alias "@/*" --use-npm --yes`. The existing `docs/` and `.superpowers/` are kept.
  - Set `"name": "tool-master"`. Then run `git init`.
- [ ] **Step 2: Install test tooling.** Run `npm i -D vitest @vitest/coverage-v8 @playwright/test`. Add scripts `"test": "vitest run"` and `"test:e2e": "playwright test"`. In `vitest.config.ts`, set the `@` alias to the root, `environment: 'node'`, and `include: ['test/**/*.test.ts']`.
- [ ] **Step 3: Write the failing test** `test/config.test.ts`: `expect(MAX_FILE_MB).toBe(50); expect(JOB_TIMEOUT_MS).toBe(120000); expect(MODEL_CACHE_DIR).toBe('.cache/models')`.
- [ ] **Step 4:** Run `npm test` and expect it to FAIL (module not found).
- [ ] **Step 5:** Create `lib/config.ts` with the three constants, reading optional env overrides `MAX_FILE_MB` and `JOB_TIMEOUT_MS`.
- [ ] **Step 6:** Write the theme variables in `globals.css` (`:root` for light, `.dark` for dark, with the Global Constraints values) and map them as Tailwind theme colors. Add `.cache/`, `.superpowers/` and `test-results/` to `.gitignore`.
- [ ] **Step 7:** Run `npm test` (PASS) and `npm run build` (succeeds).
- [ ] **Step 8:** Commit with `git add -A && git commit -m "chore: scaffold tool-master"`.

### Task 2: Tool contract and registry

**Files:**
- Create: `tools/types.ts`, `tools/registry.ts`, `tools/client-loaders.ts`, `tools/server-loaders.ts`, `tools/ui-loaders.ts`, `test/tools/registry.test.ts`

**Interfaces:**
- Produces (`tools/types.ts`):
  ```ts
  type Category = 'documents' | 'data' | 'images' | 'dev';
  type EngineId = 'word' | 'excel' | 'powerpoint' | 'libreoffice' | 'ghostscript' | 'birefnet';
  type ToolOption =
    | { type: 'segmented'; key: string; label: string; choices: { value: string; label: string }[]; default: string }
    | { type: 'number'; key: string; label: string; min?: number; max?: number; step?: number; default: number }
    | { type: 'checkbox'; key: string; label: string; default: boolean }
    | { type: 'select'; key: string; label: string; choices: { value: string; label: string }[]; default: string }
    | { type: 'color'; key: string; label: string; default: string }
    | { type: 'range'; key: string; label: string; min: number; max: number; step: number; default: number }
    | { type: 'text'; key: string; label: string; default: string; placeholder?: string };
  interface ToolMeta {
    slug: string; name: string; description: string; icon: string; category: Category;
    runs: 'client' | 'server'; input: 'files' | 'text' | 'none';
    accept?: string[]; multiple?: boolean;
    mode?: 'each' | 'all';        // files: 'each' = one run per file (default), 'all' = one run with all files
    options?: ToolOption[];
    requires?: EngineId[];         // any-of
    engineFor?: 'word' | 'excel' | 'powerpoint'; // office tools: which MS Office app 'msoffice' means
    customUi?: boolean;
  }
  type Options = Record<string, string | number | boolean>;
  interface OutputFile { name: string; data: Blob }
  type ToolOutput = { kind: 'files'; files: OutputFile[] } | { kind: 'text'; text: string; filename?: string; mime?: string };
  type ToolInput = { files: File[] } | { text: string };
  interface ClientTool { run(input: ToolInput, options: Options): Promise<ToolOutput> }
  interface JobContext { dir: string; signal: AbortSignal }
  interface ServerResult { path: string; name: string; mime: string }
  interface ServerTool { run(inputPath: string, originalName: string, options: Options, job: JobContext): Promise<ServerResult> }
  class ToolError extends Error { constructor(message: string, public code = 'CONVERSION_FAILED', public status = 500) }
  ```
- Produces: `tools: ToolMeta[]` and `getTool(slug): ToolMeta | undefined` from `registry.ts`; `clientLoaders: Record<string, () => Promise<{ default: ClientTool }>>`; `serverLoaders: Record<string, () => Promise<{ default: ServerTool }>>`; `uiLoaders: Record<string, React.ComponentType<{ meta: ToolMeta }>>` (built with `next/dynamic`, `ssr: false`).
- `registry.ts` imports **only** `meta.ts` files, so the home page never pulls tool libraries.

- [ ] **Step 1: Write the failing test** `test/tools/registry.test.ts`, which iterates `tools` and asserts:
  - slugs are unique and match `/^[a-z0-9-]+$/`;
  - `runs==='client'` ⇒ `slug in clientLoaders`, and `runs==='server'` ⇒ `slug in serverLoaders`;
  - `customUi` ⇒ `slug in uiLoaders`;
  - `input==='files'` ⇒ `accept` is non-empty;
  - every `accept` entry starts with `.`;
  - every option `key` is unique within its tool.

  Add `it('has the v1 count')` with `expect(tools.length).toBe(EXPECTED_COUNT)`. Export `EXPECTED_COUNT` from the test file, starting at `0`. **Every later task that adds tools bumps it**, and Task 20 asserts 47.
- [ ] **Step 2:** Run `npm test -- registry` and expect FAIL.
- [ ] **Step 3:** Implement the types, an empty `tools` array, `getTool`, and empty loader maps.
- [ ] **Step 4:** Run `npm test` and expect PASS.
- [ ] **Step 5:** Commit: `feat: tool contract and registry`.

### Task 3: Shell, logo, theme and home page

**Files:**
- Create: `components/{Logo,ThemeScript,ThemeToggle,Nav,Icon,SearchBox,CategoryTabs,ToolCard,HomeGrid}.tsx`, `lib/filter.ts`, `app/icon.svg`, `test/lib/filter.test.ts`
- Modify: `app/layout.tsx`, `app/page.tsx`

**Interfaces:**
- Produces:
  - `filterTools(tools: ToolMeta[], query: string, category: Category | 'all'): ToolMeta[]`;
  - `<Logo size?: number withWordmark?: boolean />`;
  - `<Icon path: string size?: number className? />`, a wrapper over `@mdi/react` using `currentColor`;
  - `CATEGORY_LABELS: Record<Category, string>`, exported from `lib/filter.ts`.

- [ ] **Step 1: Write the failing test** `filter.test.ts` with fixture metas. Assert:
  - query `"json"` matches by name and by description, case-insensitively;
  - category `'data'` excludes `'dev'` tools;
  - an empty query with `'all'` returns everything in input order;
  - whitespace-only query = empty query;
  - `"pdf word"` (multiple words) matches tools containing **all** the words.
- [ ] **Step 2:** Run it and expect FAIL.
- [ ] **Step 3:** Implement `filterTools` and `CATEGORY_LABELS`.
- [ ] **Step 4:** Run it and expect PASS.
- [ ] **Step 5:** Build the UI.
  - **Logo:** the exact Tile Grid SVG from the approved mockup. It uses viewBox `0 0 64 64` and tiles at `(6,6)`, `(6,36)` (opacity .55) and `(36,36)` (opacity .85), each 22×22 with rx 6. They share a `userSpaceOnUse` gradient `#6366F1→#22D3EE`. The pink diamond is a 16×16 rect with rx 4 at `(39,9)`, `rotate(45 47 17)`.
  - **Wordmark:** `tool` + `master`, with `master` in the gradient text. Use a unique gradient id via `useId`. Also save it as `app/icon.svg`.
  - **ThemeScript:** an inline script in `<head>` that reads `localStorage['tm-theme']` (`'light'|'dark'`), falls back to `prefers-color-scheme`, and sets the `dark` class before paint. Wrap it in try/catch.
  - **ThemeToggle:** an `mdiWeatherNight`/`mdiWhiteBalanceSunny` button that writes `localStorage['tm-theme']`.
  - **HomeGrid** (client component): hero copy, SearchBox (Ctrl+K / Cmd+K focuses it; the placeholder shows `Search {tools.length} tools…`), CategoryTabs (All + 4 categories), and a grid of 4/3/2/1 columns at `lg/md/sm/base`.
  - **ToolCard:** a link to `/tools/{slug}` with a 36px rounded-10 `icon-tile` square holding a 20px icon, the name and the description. Hover/focus gives an indigo border plus a 3px `rgba(99,102,241,.12)` ring.
  - When nothing matches, show "No tools match “{query}”".
- [ ] **Step 6:** Run `npm run dev`, open `/`, and check light/dark and the empty state (the registry is empty, so the empty state shows). Run `npm test` and expect PASS.
- [ ] **Step 7:** Commit: `feat: app shell, logo, theme and home page`.

### Task 4: Generic tool page and client runner

**Files:**
- Create: `app/tools/[slug]/page.tsx`, `components/{ToolPage,ToolHeader,Dropzone,OptionsForm,SegmentedControl,FileQueue,TextToolLayout,CopyButton}.tsx`, `lib/{validate,zip,download,run-client,use-tool-runner}.ts`, `test/lib/{validate,zip,run-client}.test.ts`, `tools/dev-echo/` *(test-only, not registered)*

**Interfaces:**
- Consumes: Task 2 types and loaders.
- Produces:
  - `validateFiles(files: File[], meta: ToolMeta, maxMb = MAX_FILE_MB): { ok: File[]; rejected: { file: File; reason: string }[] }`. Reasons are exactly ``Only ${accept.join(', ')} files`` and ``Larger than ${maxMb} MB``. When `!meta.multiple`, only the first file is kept.
  - `zipOutputs(files: OutputFile[]): Promise<Blob>`, which dedupes names as `name (2).ext`.
  - `defaultOptions(meta: ToolMeta): Options`.
  - `runClientTool(meta, tool: ClientTool, files: File[], options): AsyncGenerator<QueueEvent>`.
  - `type QueueItem = { id: string; label: string; size?: number; status: 'waiting'|'working'|'done'|'failed'; progress?: number; outputs?: OutputFile[]; error?: string; note?: string }`.
  - `type QueueEvent = { id: string } & Partial<QueueItem>`.
  - `useToolRunner(meta)` returns `{ items, options, setOptions, addFiles, runText(text), clear, downloadAll }`.
  - `downloadBlob(blob: Blob, name: string)`.
- The page returns `notFound()` for unknown slugs. It renders `uiLoaders[slug]` when `meta.customUi`, else the generic layout from the approved `tool-page.html` mockup.

- [ ] **Step 1: Write failing tests.**
  - `validate.test.ts`: `.DOCX` is accepted for accept `['.docx']` (case-insensitive); a `.txt` is rejected with `'Only .docx files'`; a 51 MB `new File([new Uint8Array(51*1024*1024)], 'a.docx')` is rejected with `'Larger than 50 MB'`; a non-multiple meta given 3 files keeps 1.
  - `zip.test.ts`: two outputs named `a.pdf` produce zip entries `a.pdf` and `a (2).pdf` (read back with jszip).
  - `run-client.test.ts`:
    - with a fake ClientTool for `mode:'each'` over 3 files where the 2nd throws `new Error('bad')`, the events end with statuses `done, failed('bad'), done`;
    - with `mode:'all'`, the tool is called once with all 3 files and yields a single item labelled `"3 files"`.
- [ ] **Step 2:** Run them and expect FAIL.
- [ ] **Step 3:** Run `npm i jszip`, then implement `validate`, `zip`, `download` and `run-client`.
- [ ] **Step 4:** Run them and expect PASS.
- [ ] **Step 5:** Build the components.
  - **Dropzone:** click or drag, using `accept` and `multiple`. Rejected files appear in the queue as `failed` with the reason. The caption reads `{accept} · up to 50 MB each`.
  - **OptionsForm:** renders every `ToolOption` type; `segmented` uses SegmentedControl.
  - **FileQueue:** rows show a status icon (`mdiCheckCircle` in success, `mdiAlertCircle` in error, a spinning `mdiLoading`, `mdiClockOutline`), name, size/note, a progress bar and a per-file download.
  - **Actions:** Clear, plus "Download all (.zip)" when there is more than one output.
  - **Text tools:** `input:'text'` tools use `TextToolLayout`, which is input textarea → options → output with a CopyButton and a download.
  - **`useToolRunner`:** picks `runClientTool` or `runServerTool` (Task 5) by `meta.runs`.
- [ ] **Step 6:** Run `npm test` and expect PASS. Commit: `feat: generic tool page and client runner`.

### Task 5: Server job pipeline

**Files:**
- Create: `lib/jobs/tempdir.ts`, `lib/engines/queue.ts`, `lib/engines/spawn.ts`, `lib/server/{handle-request,content-disposition}.ts`, `lib/run-server.ts`, `app/api/tools/[slug]/route.ts`, `instrumentation.ts`, tests `test/lib/{tempdir,queue,content-disposition,handle-request,spawn}.test.ts`

**Interfaces:**
- Produces:
  - `withTempDir<T>(fn: (dir: string) => Promise<T>): Promise<T>`;
  - `sweepTempDirs(maxAgeMs = 3_600_000): Promise<number>`;
  - `getQueue(name: string): { run<T>(fn: () => Promise<T>): Promise<T> }`, with concurrency 1 per name;
  - `runProcess(cmd: string, args: string[], opts: { cwd?: string; timeoutMs: number; signal?: AbortSignal }): Promise<{ stdout: string; stderr: string; code: number }>`, which spawns without a shell, kills the whole process tree on timeout (`taskkill /pid <pid> /T /F` on Windows), and rejects with `ToolError('Timed out', 'TIMEOUT', 500)`;
  - `contentDisposition(name: string): string`, which returns `attachment; filename="<ascii fallback>"; filename*=UTF-8''<pct-encoded>`;
  - `handleToolRequest(req: Request, slug: string, deps = { getTool, serverLoaders }): Promise<Response>`;
  - `runServerTool(meta, files, options): AsyncGenerator<QueueEvent>` (browser side: `fetch` one file at a time, reading `{error}` JSON on non-2xx).
- The route is a thin wrapper: `export const runtime='nodejs'`; `POST(req, { params }: { params: Promise<{ slug: string }> })` → `handleToolRequest(req, (await params).slug)`.

- [ ] **Step 1: Write failing tests.**
  - `tempdir`: the dir exists inside `fn`; it is removed after resolve **and** after `fn` throws (the error is rethrown); the name starts with `tool-master-`; `sweepTempDirs` removes a dir whose mtime is set 2 h back (via `utimes`) and keeps a fresh one.
  - `queue`:
    - two jobs on the same queue run sequentially (record start/end order);
    - jobs on different queues overlap;
    - **a rejected job does not block the next** (Review Focus 3).
  - `spawn`: `runProcess(process.execPath, ['-e','setTimeout(()=>{},10000)'], { timeoutMs: 200 })` rejects with code `'TIMEOUT'` within 2 s.
  - `content-disposition`: `contentDisposition("Q3 report — José's.pdf")` contains `filename*=UTF-8''Q3%20report%20%E2%80%94%20Jos%C3%A9%27s.pdf`, and its ASCII fallback has no non-ASCII characters and no `"` (Review Focus 1).
  - `handle-request` (with injected deps and a fake server tool that writes `out.txt`):
    - unknown slug → 404 `NOT_FOUND`;
    - a client tool slug → 404;
    - a missing `file` field → 400 `BAD_INPUT`;
    - a wrong extension → 400;
    - more than 50 MB → 413 `TOO_LARGE`;
    - success → 200 with the body bytes and the `Content-Disposition` header;
    - a tool throwing `ToolError('x','ENGINE_MISSING',503)` → 503 `{error:'x',code:'ENGINE_MISSING'}`;
    - a plain `Error` → 500 `CONVERSION_FAILED`.
- [ ] **Step 2:** Run them and expect FAIL.
- [ ] **Step 3:** Implement them.
  - In `handleToolRequest`, parse `formData()`, `JSON.parse(options ?? '{}')` (400 on bad JSON), and check size before writing.
  - Inside `withTempDir`, write `input<ext>`, call the tool with `AbortSignal.timeout(JOB_TIMEOUT_MS)`, then read the output and return a `Response`. Reading into a Buffer before the dir is deleted is acceptable at 50 MB.
  - `instrumentation.ts` calls `sweepTempDirs()` when `NEXT_RUNTIME === 'nodejs'`.
- [ ] **Step 4:** Run them and expect PASS. Commit: `feat: server job pipeline`.

### Task 6: Engine detection

**Files:**
- Create: `lib/engines/detect.ts`, `app/api/engines/route.ts`, `components/EngineNotice.tsx`, `test/lib/detect.test.ts`

**Interfaces:**
- Produces:
  - `type EngineStatus = Record<'word'|'excel'|'powerpoint'|'libreoffice'|'ghostscript', boolean>`;
  - `detectEngines(opts?: { refresh?: boolean }): Promise<EngineStatus>`, cached per process;
  - `findLibreOffice(): Promise<string | null>` and `findGhostscript(): Promise<string | null>`;
  - `ENGINE_HINTS: Record<EngineId, { label: string; url: string }>`. Values: LibreOffice → `https://www.libreoffice.org/download/`, Ghostscript → `https://ghostscript.com/releases/gsdnld.html`, word/excel/powerpoint → "Microsoft Office".
  - `GET /api/engines[?refresh=1]` → `EngineStatus`.
  - `<EngineNotice meta engines />` shows "{label} not found. Install it from {url}" when none of `meta.requires` is available.
- **Detection:**
  - Office: on `win32`, run `reg query HKCR\Word.Application\CLSID`, and likewise for `Excel.Application` and `PowerPoint.Application`. Exit code 0 = available. Elsewhere it is `false`.
  - LibreOffice: check `LIBREOFFICE_PATH`, then `where soffice`, then `C:\Program Files\LibreOffice\program\soffice.exe` and `C:\Program Files (x86)\LibreOffice\program\soffice.exe`.
  - Ghostscript: check `GHOSTSCRIPT_PATH`, then `where gswin64c`, then the newest `C:\Program Files\gs\gs*\bin\gswin64c.exe` (sorted by version).

- [ ] **Step 1: Write failing tests.**
  - With `LIBREOFFICE_PATH` set to a temp file that exists, `findLibreOffice()` returns it.
  - With `LIBREOFFICE_PATH` pointing at a missing file, it falls through (no throw).
  - With fake dirs `gs9.56.1` and `gs10.03.0` under a temp root (pass the root as an optional second param `programFilesRoots: string[]`), `findGhostscript` picks `gs10.03.0`. This is a numeric version sort, not lexical.
  - `detectEngines()` returns all five keys as booleans and the second call doesn't re-run (spy).
- [ ] **Step 2:** Run them and expect FAIL. **Step 3:** Implement them. **Step 4:** Run them and expect PASS.
- [ ] **Step 5:** Run `curl localhost:3000/api/engines` against the dev server and record the real result for this PC in the commit message. Commit: `feat: engine detection`.

### Task 7: Office conversions (4 tools)

**Files:**
- Create: `lib/engines/{msoffice,libreoffice,office}.ts`, `lib/engines/msoffice.ps1`, `tools/{word-to-pdf,pdf-to-word,excel-to-pdf,powerpoint-to-pdf}/{meta.ts,server.ts}`, `test/lib/office.test.ts`, `test/tools/office-integration.test.ts`, fixtures `test/fixtures/{sample.docx,sample.xlsx,sample.pptx,sample.pdf,not-really.docx}`
- Modify: `tools/registry.ts`, `tools/server-loaders.ts`, `test/tools/registry.test.ts` (EXPECTED_COUNT += 4)

**Interfaces:**
- Consumes: `runProcess`, `getQueue`, `detectEngines`, `ToolError`.
- Produces:
  - `resolveEngine(choice: 'auto'|'msoffice'|'libreoffice', app: 'word'|'excel'|'powerpoint', status: EngineStatus): 'msoffice'|'libreoffice'`, which throws `ToolError(msg,'ENGINE_MISSING',503)`;
  - `msofficeConvert(app, input: string, output: string, target: 'pdf'|'docx', signal): Promise<void>` on queue `'msoffice'`;
  - `libreofficeConvert(input: string, outDir: string, target: 'pdf'|'docx', signal): Promise<string>` on queue `'libreoffice'`;
  - `officeTool(app, target, outExt): ServerTool`, a factory used by all 4 `server.ts` files.
- **Every one of the 4 metas** has: `runs:'server'`, `multiple:true`, `requires:[app,'libreoffice']`, `engineFor: app`, and option `{type:'segmented', key:'engine', label:'Engine', choices: Auto/MS Office/LibreOffice, default:'auto'}`.
- Accept lists: Word → `.doc,.docx,.rtf,.odt`; PDF → `.pdf`; Excel → `.xls,.xlsx,.ods,.csv`; PowerPoint → `.ppt,.pptx,.odp`.
- Icons: `mdiFilePdfBox`, `mdiFileWordOutline`, `mdiFileExcelOutline`, `mdiFilePowerpointOutline`.
- **msoffice.ps1** takes `-App -In -Out -Target` and works as follows:
  1. Create the COM object and record its PID (by diffing `Get-Process WINWORD/EXCEL/POWERPNT` before and after).
  2. Write `PID:<n>` to stdout first.
  3. Set `Visible=$false` and `DisplayAlerts` off.
  4. **Word:** `Documents.Open($In, $false, $true, $false, 'tm-wrong-pw')`. The dummy password makes encrypted docs fail fast instead of prompting (Review Focus 2). Then `SaveAs2($Out, 17|16)`.
  5. **Excel:** `Workbooks.Open($In, 0, $true, 5, 'tm-wrong-pw')` → `ExportAsFixedFormat(0, $Out)`.
  6. **PowerPoint:** `Presentations.Open("$In::tm-wrong-pw", -1, 0, 0)` → `SaveAs($Out, 32)`.
  7. Close and Quit in `finally`, plus `[Runtime.InteropServices.Marshal]::ReleaseComObject`.
  8. Exit 1 with the message on stderr on failure.

  Paths are passed as **arguments** (`powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File msoffice.ps1 -In <path>`), never interpolated into a command string (Review Focus 1). On timeout or abort, Node runs `taskkill /PID <captured> /T /F`.
- **libreoffice:** `soffice --headless --norestore -env:UserInstallation=file:///<jobdir>/lo-profile --convert-to pdf|docx:"MS Word 2007 XML" [--infilter=writer_pdf_import] --outdir <dir> <input>`. If the expected output file is missing afterwards, throw `ToolError('LibreOffice could not convert this file')`.
- **Output name** is the original basename with the new extension, e.g. `Q3 report — José's.pdf`.

- [ ] **Step 1: Write failing tests.**
  - `office.test.ts` (pure):
    - `resolveEngine('auto','word',{word:true,libreoffice:true…})` → `'msoffice'`;
    - `('auto','excel',{excel:false,libreoffice:true})` → `'libreoffice'`;
    - `('auto','word', all false)` throws with `status 503` and `code 'ENGINE_MISSING'`;
    - `('msoffice','powerpoint',{powerpoint:false,libreoffice:true})` throws 503. An explicit choice is never silently swapped.
  - `office-integration.test.ts`:
    - for each available engine (skipIf), converting `sample.docx` → PDF gives a file starting with `%PDF`;
    - a file named `Q3 report — José's.docx` (copied fixture) converts and its result name is `Q3 report — José's.pdf`;
    - `not-really.docx` (plain text bytes) rejects with a `ToolError` within 60 s, and no `WINWORD.EXE` started by the test remains (check by PID);
    - run xlsx → PDF and pptx → PDF the same way;
    - `sample.pdf` → docx gives a zip file (`PK` magic).
  - Fixtures: generate `sample.docx`, `sample.xlsx` and `sample.pptx` with a tiny one-off script using the `docx` / `xlsx` / `pptxgenjs` dev-deps, and commit the binaries.
- [ ] **Step 2:** Run them and expect FAIL.
- [ ] **Step 3:** Implement them, and register the 4 metas and server loaders.
- [ ] **Step 4:** Run `npm test` and expect PASS. Integration tests are skipped for engines this PC lacks; note which ones ran.
- [ ] **Step 5:** Run a manual check: batch 3 `.docx` files in the browser with Auto, then download the zip. Commit: `feat: office conversions`.

### Task 8: Compress PDF (Ghostscript)

**Files:**
- Create: `lib/engines/ghostscript.ts`, `tools/compress-pdf/{meta.ts,server.ts}`, `test/lib/ghostscript.test.ts`
- Modify: the registry, server loaders, and EXPECTED_COUNT += 1

**Interfaces:**
- Produces:
  - `gsArgs(level: 'strong'|'balanced'|'light', input: string, output: string): string[]`;
  - `ghostscriptCompress(input, output, level, signal)` on queue `'ghostscript'`.
- The meta has option `level` as segmented Strong/Balanced/Light (default `balanced`), `requires:['ghostscript']`, `multiple:true`, and icon `mdiFileDownloadOutline`.
- Response header `X-Original-Size` (bytes). The browser shows the note `"{before} → {after} (−{pct}%)"`, read by `runServerTool` from `X-Original-Size` and the blob size. If the output is larger than the input, return the original file with the note "Already optimized".

- [ ] **Step 1: Write failing tests.**
  - `gsArgs('strong',…)` contains `-dPDFSETTINGS=/screen`; `balanced` gives `/ebook`; `light` gives `/printer`.
  - The args always include `-sDEVICE=pdfwrite`, `-dNOPAUSE`, `-dBATCH`, `-dQUIET` and `-sOutputFile=<output>` as a single arg.
  - Integration (skipIf no gs): `sample.pdf` compresses to a valid `%PDF` file.
- [ ] **Step 2–4:** Watch them FAIL, implement, watch them PASS. **Step 5:** Commit: `feat: compress pdf`.

### Task 9: PDF tools: merge, split, images → PDF

**Files:**
- Create: `lib/pdf/{ranges,load}.ts`, `tools/{merge-pdf,split-pdf,images-to-pdf}/{meta.ts,client.ts}`, `components/SortableFileList.tsx`, tests `test/lib/ranges.test.ts`, `test/tools/pdf-basic.test.ts`
- Modify: the registry, client loaders, and EXPECTED_COUNT += 3

**Interfaces:**
- Produces:
  - `parseRanges(spec: string, pageCount: number): number[][]` (0-based groups). It throws `ToolError('Invalid page range: "<token>"', 'BAD_INPUT', 400)`.
  - `loadPdf(file: File | Blob): Promise<PDFDocument>`. It catches pdf-lib's encrypted/invalid errors and rethrows `ToolError` with `'This PDF is password-protected'` or `'Not a valid PDF'`.
- **merge-pdf:** `mode:'all'`, `multiple:true`. Uses `SortableFileList` (drag to reorder, HTML5 DnD) before Run. Output `merged.pdf`. Icon `mdiFileDocumentMultipleOutline`.
- **split-pdf:** option `split` segmented Every page / Ranges (default `ranges`), plus text option `ranges` (placeholder `1-3, 5, 8-10`). Outputs are named `<base>-p1.pdf` or `<base>-p1-3.pdf`. Icon `mdiCallSplit`.
- **images-to-pdf:** `mode:'all'`, accept `.jpg,.jpeg,.png,.webp`, option `pageSize` segmented Fit/A4/Letter (default `fit`), option `margin` number (default 0). WebP is converted to PNG through `createImageBitmap` + `OffscreenCanvas` first. Output `images.pdf`. Icon `mdiImageMultipleOutline`.

- [ ] **Step 1: Write failing tests.**
  - `ranges`:
    - `parseRanges('1-3, 5', 10)` → `[[0,1,2],[4]]`;
    - `'8-'` → pages 8 to the end;
    - `' 2 '` → `[[1]]`;
    - `'0'`, `'5-2'`, `'11'` and `'abc'` each throw with the token in the message;
    - `''` throws `'Enter at least one page range'`.
  - `pdf-basic` (build PDFs in-test with pdf-lib in Node):
    - merging a 2-page and a 3-page PDF gives 5 pages;
    - splitting a 5-page PDF with 'Every page' gives 5 files;
    - splitting with ranges `'1-2,4'` gives 2 files with 2 and 1 pages;
    - images-to-pdf with 2 PNG fixtures and `fit` gives 2 pages sized to the images, and with `a4` gives 595.28×841.89 pages;
    - `loadPdf` on an encrypted PDF fixture (`test/fixtures/encrypted.pdf`, generated once by `scripts/make-encrypted-pdf.py` using `pypdf` with user password `secret`, then committed) rejects with `'This PDF is password-protected'` (Review Focus 2);
    - `loadPdf` on random bytes rejects with `'Not a valid PDF'`.
- [ ] **Step 2–4:** Run `npm i pdf-lib`, watch them FAIL, implement, watch them PASS. **Step 5:** Commit: `feat: merge, split, images to pdf`.

### Task 10: PDF tools: rotate, organize, page numbers, watermark, PDF → images

**Files:**
- Create: `components/PdfThumbnails.tsx`, `lib/pdf/pdfjs.ts`, `tools/{rotate-pdf,organize-pdf,page-numbers,watermark-pdf,pdf-to-images}/…`, `tools/{rotate-pdf,organize-pdf}/ui.tsx`, `test/tools/pdf-edit.test.ts`
- Modify: the registry, client and UI loaders, and EXPECTED_COUNT += 5

**Interfaces:**
- Produces:
  - `getPdfjs()`, which lazy-imports `pdfjs-dist` with `GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url)`;
  - `renderPage(pdf, index, scale): Promise<Blob>`;
  - `<PdfThumbnails file selected onToggle? onReorder? onRotate? />`.
- Pure functions, each exported from its tool's `client.ts` so Node tests can call them:
  - `rotatePages(bytes: ArrayBuffer, angle: 90|180|270, pages: number[] | 'all'): Promise<Uint8Array>`;
  - `reorderPages(bytes, order: number[]): Promise<Uint8Array>` (pages left out of `order` are deleted; an empty order throws `'Keep at least one page'`);
  - `addPageNumbers(bytes, { position: 'top-left'|'top-center'|'top-right'|'bottom-left'|'bottom-center'|'bottom-right', start: number, format: 'n'|'page-n'|'n-of-total', fontSize: number }): Promise<Uint8Array>`;
  - `addWatermark(bytes, { text, fontSize, opacity, rotation, color }): Promise<Uint8Array>`.
- **Options:**
  - page-numbers: position default `bottom-center`, start 1, format `n`, fontSize 12;
  - watermark: text default `CONFIDENTIAL`, fontSize 48, opacity range 0.05–1 default 0.2, rotation number default 45, color default `#EF4444`;
  - pdf-to-images: format PNG/JPG default PNG, scale 1×/2×/3× default 2. Outputs are `<base>-1.png` and so on.
- **Custom UIs:** rotate-pdf and organize-pdf use thumbnails (click to select, drag to reorder, delete button).
- **Icons:** `mdiRotateRight`, `mdiViewGridOutline`, `mdiNumeric`, `mdiWatermark`, `mdiFileImageOutline`.

- [ ] **Step 1: Write failing tests** (`pdf-edit.test.ts`, in Node with pdf-lib):
  - `rotatePages(…,90,[0])` leaves page 1 at rotation 90 and page 2 at 0, and a second call with 270 brings page 1 back to 0 (rotation is added mod 360);
  - `reorderPages(5-page,[4,0])` gives 2 pages, and the first page's original size marker (use distinct page sizes per page to identify them) matches the old page 5;
  - `reorderPages(…,[])` throws;
  - `addPageNumbers` with format `n-of-total` on 3 pages keeps the page count at 3 and returns bytes that differ from the input and reload as a valid PDF;
  - the label helper `pageLabel(format: 'n'|'page-n'|'n-of-total', index: number, start: number, total: number): string`, exported from the same file: `('n-of-total', 1, 1, 3)` → `'2 of 3'`, `('page-n', 0, 5, 3)` → `'Page 5'`, `('n', 2, 1, 3)` → `'3'`;
  - `addWatermark` keeps the page count and produces a larger byte size.
- [ ] **Step 2–4:** Run `npm i pdfjs-dist`, watch them FAIL, implement, watch them PASS.
- [ ] **Step 5:** Manual check in the browser: thumbnails render, PDF → Images produces a zip of PNGs, and reorder/rotate downloads open correctly. Commit: `feat: pdf editing tools`.

### Task 11: Home page polish checkpoint

**Files:** none new (verification only)

- [ ] **Step 1:** Run `npm run build && npm start`. Check that the home page shows 13 Documents tools, the search "pdf word" finds PDF → Word, the light/dark toggle persists across reload with no flash, and the layout works at 375px wide.
- [ ] **Step 2:** Fix anything that fails and commit: `fix: documents phase polish`.

### Task 12: Spreadsheet data tools (6)

**Files:**
- Create: `lib/data/{sheets,flatten}.ts`, `tools/{excel-to-json,json-to-excel,csv-to-excel,excel-to-csv,csv-to-json,json-to-csv}/…`, `test/tools/data-sheets.test.ts`, fixtures `test/fixtures/{two-sheets.xlsx,people.csv,semicolon.csv,empty.csv,garbage.xlsx}`
- Modify: the registry, client loaders, and EXPECTED_COUNT += 6

**Interfaces:**
- Produces pure functions:
  - `excelToJson(bytes: ArrayBuffer, { sheet: string | '__all__', header: boolean }): unknown`;
  - `jsonToWorkbook(data: unknown): ArrayBuffer`;
  - `csvToRows(text): unknown[][]`;
  - `rowsToCsv(rows: unknown[][]): string`;
  - `csvToJson(text, { header: boolean }): unknown[]`;
  - `jsonToCsv(data: unknown): string`;
  - `flatten(obj, prefix = ''): Record<string, unknown>` (dot keys; arrays are JSON-stringified);
  - `listSheets(bytes): string[]`.
- **Input:** JSON tools take a file or pasted text: `input:'files'` with accept `.json`, plus a "Paste instead" toggle in the generic page that is driven by meta flag `pasteable: true`. Add `pasteable?: boolean` to `ToolMeta` in this task.
- **excel-to-json:** the sheet select is populated after the file loads (via `listSheets`; the generic OptionsForm accepts `dynamicChoices` from a tool-exported `getChoices(file)`; add optional `getChoices?(files: File[]): Promise<Record<string, {value,label}[]>>` to `ClientTool`). Its output view is a JSON preview + copy + download.
- **Empty or garbage input** must throw a `ToolError` with exactly these messages (Review Focus 4):
  - `'This file has no rows'` (empty CSV or sheet);
  - `'JSON is empty'` (whitespace-only, `[]` or `{}`);
  - `'JSON must be an array of objects or an object of arrays'`;
  - `'Could not read this spreadsheet'`.
- **Icons:** `mdiTableArrowRight`, `mdiCodeJson`, `mdiFileExcelOutline`, `mdiFileDelimitedOutline`.

- [ ] **Step 1: Write failing tests:**
  - `excelToJson(two-sheets.xlsx, {sheet:'People', header:true})` → `[{name:'Ana', age:30}, …]`;
  - `header:false` → array of arrays;
  - `'__all__'` → `{People:[…], Cities:[…]}`;
  - `jsonToWorkbook([{a:1}])` round-trips through `excelToJson` to `[{a:1}]`;
  - `jsonToWorkbook({S1:[{a:1}],S2:[{b:2}]})` gives sheets S1 and S2;
  - `csvToJson(semicolon.csv,{header:true})` auto-detects `;` and returns numbers as numbers;
  - `jsonToCsv([{a:{b:1},c:[1,2]}])` === `'a.b,c\r\n1,"[1,2]"'`;
  - empty.csv, `'   '`, `'[]'`, `'{}'`, `'"str"'` and garbage.xlsx each throw the exact message above.
- [ ] **Step 2–4:** Run `npm i xlsx papaparse`, watch them FAIL, implement, watch them PASS. **Step 5:** Commit: `feat: spreadsheet data tools`.

### Task 13: Data format tools (6)

**Files:**
- Create: `lib/data/ts-infer.ts`, `tools/{xml-to-json,json-to-xml,yaml-to-json,json-to-yaml,json-to-typescript,markdown-to-html}/…`, `tools/markdown-to-html/ui.tsx`, `test/tools/data-formats.test.ts`, `test/lib/ts-infer.test.ts`
- Modify: the registry, loaders, and EXPECTED_COUNT += 6

**Interfaces:**
- Produces:
  - `inferTypescript(json: unknown, rootName = 'Root'): string`;
  - `xmlToJson(text, { attributes: boolean }): unknown`;
  - `jsonToXml(data, { root: string }): string`;
  - `yamlToJson(text): unknown` (multi-document → array);
  - `jsonToYaml(data, { indent: 2|4 }): string`;
  - `markdownToHtml(md): string`, which is sanitized with DOMPurify. In tests, use `isomorphic-dompurify` or run DOMPurify with jsdom only in the test via `// @vitest-environment jsdom`.
- These are all `input:'text'` tools with `pasteable` file upload too. Outputs are text with filename/mime.
- **markdown-to-html:** a custom side-by-side editor and live preview, with copy HTML and download `.html` (a full document using a minimal readable style).
- **Parse errors** surface as `ToolError('Invalid XML: …')`, `('Invalid YAML: line N …')` or `('Invalid JSON: line L, column C')`. Add a shared `parseJsonStrict(text): unknown` in `lib/data/json.ts` that computes the line/column from the error position. It is reused by Tasks 12 and 18.
- **Icons:** `mdiXml`, `mdiCodeBraces`, `mdiLanguageTypescript`, `mdiLanguageMarkdownOutline`.

- [ ] **Step 1: Write failing tests:**
  - `inferTypescript({id:1,tags:['a'],owner:{name:'x'},items:[{a:1},{a:2,b:true}]})` contains `export interface Root {`, `id: number;`, `tags: string[];`, `owner: Owner;`, `items: Item[];`, `export interface Item {` and `b?: boolean;`;
  - an empty array gives `unknown[]`;
  - a mixed array `[1,'a']` gives `(number | string)[]`;
  - `null` gives `null`;
  - keys that aren't identifiers get quoted (`"first-name": string;`);
  - `xmlToJson('<a x="1"><b>2</b></a>',{attributes:true})` deep-equals `{a:{'@_x':'1', b:2}}`;
  - `jsonToXml({b:2},{root:'a'})` contains `<a>` and `<b>2</b>`;
  - `yamlToJson('a: 1\n---\nb: 2')` → `[{a:1},{b:2}]`;
  - `yamlToJson('a: [')` throws a message starting with `Invalid YAML`;
  - `parseJsonStrict('{\n "a": 1,\n}')` throws `'Invalid JSON: line 3, column 1'`;
  - `parseJsonStrict('  ')` throws `'JSON is empty'`;
  - `markdownToHtml('# Hi\n<script>alert(1)</script>')` contains `<h1>Hi</h1>` and not `<script`.
- [ ] **Step 2–4:** Run `npm i fast-xml-parser yaml marked dompurify` and `npm i -D jsdom`, watch them FAIL, implement, watch them PASS. **Step 5:** Commit: `feat: data format tools`.

### Task 14: Image tools: convert, resize, compress, rotate, image → Base64

**Files:**
- Create: `lib/image/{decode,encode,resize-math}.ts`, `tools/{convert-image,resize-image,compress-image,rotate-image,image-to-base64}/…`, `tools/image-to-base64/ui.tsx`, `test/lib/resize-math.test.ts`, `test/lib/encode.test.ts`
- Modify: the registry, loaders, and EXPECTED_COUNT += 5

**Interfaces:**
- Produces:
  - `decodeImage(file: Blob): Promise<ImageBitmap>`, which **must** call `createImageBitmap(file, { imageOrientation: 'from-image' })` (Review Focus 5);
  - `encodeCanvas(source: ImageBitmap | OffscreenCanvas, { type: 'image/png'|'image/jpeg'|'image/webp', quality?: number, width?: number, height?: number, background?: string }): Promise<Blob>`. When `type==='image/jpeg'` and no background is given, it fills `#FFFFFF` before drawing;
  - `jpegBackground(type, background?)`, a pure helper that returns the fill colour or null;
  - `fitSize(src: {w,h}, target: { width?: number; height?: number; percent?: number; keepAspect: boolean; maxDim?: number }): {w,h}` (rounded integers, min 1);
  - `rotatedSize({w,h}, angle): {w,h}`;
  - `renameExt(name, ext): string`;
  - `formatBytes(n): string` (`'1.2 MB'`).
- **Options:**
  - convert: format PNG/JPG/WebP (default `webp`), quality range 0.1–1 default 0.9;
  - resize: width, height, percent, keepAspect default true;
  - compress: quality default 0.75, maxDim number default 0 (= off); output keeps the input format, but PNG becomes WebP when the user turns on "Allow WebP" (default off); note `"{before} → {after}"`;
  - rotate: angle 90/180/270, flip none/horizontal/vertical.
- **image-to-base64:** a custom UI showing the data URL, the raw base64, an `<img src="…">` snippet and a CSS `background-image: url(…)` snippet, each with a CopyButton.
- **Icons:** `mdiImageSyncOutline`, `mdiResize`, `mdiImageSizeSelectSmall`, `mdiRotateRight`, `mdiImageText`.

- [ ] **Step 1: Write failing tests:**
  - `fitSize({w:4000,h:3000},{width:800,keepAspect:true})` → `{w:800,h:600}`;
  - `{width:800,height:800,keepAspect:true}` → `{w:800,h:600}` (fit inside);
  - `keepAspect:false` → `800×800`;
  - `{percent:50}` → `2000×1500`;
  - `{maxDim:1000}` → `1000×750`;
  - `{maxDim:0}` → unchanged;
  - `{width:0}` → unchanged (0 or empty means "not set");
  - `rotatedSize({w:4,h:3},90)` → `{w:3,h:4}`;
  - `renameExt('photo.final.PNG','jpg')` → `'photo.final.jpg'`;
  - `formatBytes(1258291)` → `'1.2 MB'`;
  - `jpegBackground('image/jpeg')` → `'#FFFFFF'` and `jpegBackground('image/png')` → `null`.
- [ ] **Step 2–4:** Watch them FAIL, implement, watch them PASS.
- [ ] **Step 5:** Manual check with a portrait iPhone JPEG (EXIF orientation 6): it converts upright, and a transparent PNG → JPG has a white background. Commit: `feat: core image tools`.

### Task 15: Image tools: crop, HEIC → JPG, favicon generator

**Files:**
- Create: `lib/image/ico.ts`, `tools/{crop-image,heic-to-jpg,favicon-generator}/…`, `tools/crop-image/ui.tsx`, `test/lib/ico.test.ts`
- Modify: the registry, loaders, and EXPECTED_COUNT += 3

**Interfaces:**
- Produces:
  - `encodeIco(images: { size: number; png: Uint8Array }[]): Uint8Array`. It writes the ICONDIR (reserved 0, type 1, count) and one 16-byte ICONDIRENTRY per image (a width/height byte of 0 means 256; planes 1; bpp 32; bytes; offset), followed by the PNG payloads in order.
  - **favicon-generator** outputs `favicon.ico` (16/32/48), `apple-touch-icon.png` (180), `icon-192.png`, `icon-512.png` and `snippet.html` containing the `<link>` tags. All are zipped as `favicon.zip`. Input is a square crop centred on the image.
  - **heic-to-jpg** uses `heic2any` (lazy import), with format JPG/PNG (default JPG) and quality 0.9. Multi-image HEIC uses the first image.
  - **crop-image** is a custom UI with `react-image-crop`: aspect segmented Free/1:1/4:3/16:9 and output in the same format.
- **Icons:** `mdiCrop`, `mdiFileImageOutline`, `mdiWeb`.

- [ ] **Step 1: Write failing tests:**
  - `encodeIco` with two fake PNGs (lengths 10 and 20, sizes 16 and 256): byte 0–1 = 0, 2–3 = 1, 4–5 = 2;
  - entry 1 width byte = 16, entry 2 width byte = 0;
  - entry 1 offset = 6 + 2·16 = 38, entry 2 offset = 48;
  - the payload bytes appear at those offsets;
  - the total length is 68.
- [ ] **Step 2–4:** Run `npm i heic2any react-image-crop`, watch them FAIL, implement, watch them PASS.
- [ ] **Step 5:** Manual check: the generated `favicon.ico` opens in a browser tab, and a sample HEIC converts. Commit: `feat: crop, heic, favicon tools`.

### Task 16: Background remover (BiRefNet)

**Files:**
- Create: `lib/bg/birefnet.ts`, `tools/remove-background/{meta.ts,server.ts,ui.tsx}`, `app/api/tools/remove-background/status/route.ts`, `components/BeforeAfterSlider.tsx`, `scripts/bg-spike.mjs`, `test/tools/remove-background.test.ts`, fixture `test/fixtures/portrait.jpg` (a small CC0 photo of a person)
- Modify: the registry, server/UI loaders, EXPECTED_COUNT += 1, and `next.config.ts` (`serverExternalPackages: ['@huggingface/transformers', 'onnxruntime-node', 'sharp']`)

**Interfaces:**
- Produces:
  - `MODELS = { best: 'onnx-community/BiRefNet-ONNX', fast: 'onnx-community/BiRefNet_lite-ONNX' } as const`;
  - `getModel(q: 'best'|'fast')`, a lazy singleton with `env.cacheDir = MODEL_CACHE_DIR`. It tracks `status: { state: 'idle'|'downloading'|'ready'|'error'; progress: number; quality?: string; error?: string }` through the transformers `progress_callback`;
  - `getStatus()`;
  - `removeBackground(inputPath, q, signal): Promise<Buffer /* PNG with alpha, original size */>` on queue `'birefnet'`;
  - `GET /api/tools/remove-background/status` → `getStatus()`.
- **Pipeline:**
  1. `sharp(input).rotate()` (EXIF orientation fix, Review Focus 5).
  2. Get the raw RGB at 1024×1024 using `fit: 'fill'`.
  3. Normalize per the model's `preprocessor_config.json` (load the processor with `AutoProcessor`).
  4. Run inference, apply sigmoid to the output logits, and scale to 0–255.
  5. `sharp(mask, {raw:{width:1024,height:1024,channels:1}}).resize(origW, origH, { kernel: 'lanczos3' })`.
  6. `joinChannel` onto the upright original, then output PNG.
- **The meta has:** `runs:'server'`, `multiple:true`, accept `.jpg,.jpeg,.png,.webp`, `requires:['birefnet']`, `customUi:true`, option `quality` Best/Fast (default `best`), and icon `mdiImageRemoveOutline`. `detectEngines` does not include birefnet; `EngineNotice` treats `birefnet` as always available.
- **ui.tsx:** dropzone → per image, poll the status endpoint every 1 s while `downloading` and show "Downloading AI model… {pct}% (first time only)". Then show the result: a `BeforeAfterSlider` (pointer-drag the handle; the "after" side sits on a checkerboard), background segmented Transparent/Color/Image (a color input with swatches `#FFFFFF #0F172A #6366F1`; an image upload drawn `cover`). Compositing happens on canvas in the browser. Actions: Download PNG and "Download all (.zip)" for batches.

- [ ] **Step 1: Spike first (the spec §5 risk).**
  - Run `npm i @huggingface/transformers sharp`.
  - Write `scripts/bg-spike.mjs`, which loads each model, runs `portrait.jpg` and logs load time, inference time and `process.memoryUsage().rss`.
  - Run `node scripts/bg-spike.mjs` and record the numbers in the commit message.
  - **If `best` fails to load, or its RSS is above 3 GB, or inference takes more than 30 s:** set the meta default to `fast`, keep `best` selectable, and note it in the README. If the ONNX model ids or the input/output tensor names differ from the assumption, adapt `birefnet.ts` to what the spike shows.
- [ ] **Step 2: Write failing tests** (skipIf when `process.env.SKIP_MODEL_TESTS`). `removeBackground(portrait.jpg,'fast')`:
  - returns a PNG whose `sharp().metadata()` has `channels: 4` and the same width/height as the input;
  - the top-left corner pixel alpha is below 32 (background removed);
  - the centre pixel alpha is above 200 (subject kept).
  - Status goes `idle` → `ready` after the first call.
- [ ] **Step 3:** Run it and expect FAIL. **Step 4:** Implement it. **Step 5:** Run it and expect PASS.
- [ ] **Step 6:** Manual check in the browser: the first-run progress bar shows, the slider drags, a color background downloads correctly, and a batch of 3 produces a zip. Commit: `feat: background remover`.

### Task 17: Dev & Text tools, part 1: QR, Base64, JSON formatter, color, hash

**Files:**
- Create: `tools/{qr-code,base64,json-formatter,color-converter,hash-generator}/{meta.ts,client.ts,ui.tsx}`, `lib/color.ts`, `test/tools/dev1.test.ts`
- Modify: the registry, loaders, and EXPECTED_COUNT += 5

**Interfaces:**
- Produces pure functions:
  - `makeQr(text, { size, fg, bg, ecl: 'L'|'M'|'Q'|'H' }): Promise<{ png: Blob; svg: string }>`;
  - `b64EncodeText(s): string` and `b64DecodeText(s): string` (UTF-8 safe; decode tolerates URL-safe and missing padding; invalid → `ToolError('Not valid Base64')`);
  - `formatJson(text, indent: 2|4|'tab'): string` and `minifyJson(text): string` (both use `parseJsonStrict`);
  - `parseColor(input): { hex, rgb: [r,g,b], hsl: [h,s,l] } | null`, accepting `#abc`, `#aabbcc`, `rgb(…)`, `hsl(…)`;
  - `hashText(alg: 'MD5'|'SHA-1'|'SHA-256'|'SHA-512', data: string | ArrayBuffer): Promise<string>` (lowercase hex).
- **Custom UIs:** each has inputs and outputs per spec §4. Hash and Base64 have Text/File modes.
- **Icons:** `mdiQrcode`, `mdiSwapHorizontal`, `mdiCodeJson`, `mdiPalette`, `mdiPound`.

- [ ] **Step 1: Write failing tests:**
  - `hashText('MD5','abc')` → `900150983cd24fb0d6963f7d28e17f72`;
  - `'SHA-256','abc'` → `ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad`;
  - `'SHA-1','abc'` → `a9993e364706816aba3e25717850c26c9cd0d89d`;
  - `b64EncodeText('José ✓')` round-trips;
  - `b64DecodeText('SGk')` → `'Hi'`;
  - `b64DecodeText('@@@')` throws;
  - `parseColor('#6366F1')` → rgb `[99,102,241]`, hsl `[239,84,67]`;
  - `parseColor('hsl(239, 84%, 67%)').hex` → `'#6366f1'` (lowercase; off-by-1 rounding tolerated → assert the components within ±1);
  - `parseColor('nope')` → `null`;
  - `formatJson('{"a":1}',2)` → `'{\n  "a": 1\n}'`;
  - `minifyJson('{ "a" : [1, 2] }')` → `'{"a":[1,2]}'`;
  - `makeQr('hello',{size:256,fg:'#000000',bg:'#FFFFFF',ecl:'M'})`: the svg starts with `<svg` and the png size is greater than 0.
- [ ] **Step 2–4:** Run `npm i qrcode spark-md5`, watch them FAIL, implement, watch them PASS. **Step 5:** Commit: `feat: dev tools part 1`.

### Task 18: Dev & Text tools, part 2: UUID, password, URL, JWT, timestamp, case, counter, diff

**Files:**
- Create: `tools/{uuid-generator,password-generator,url-encoder,jwt-decoder,timestamp-converter,case-converter,word-counter,text-diff}/{meta.ts,client.ts,ui.tsx}`, `test/tools/dev2.test.ts`
- Modify: the registry, loaders, and EXPECTED_COUNT += 8

**Interfaces:**
- Produces pure functions:
  - `uuidV4(): string`;
  - `uuidV7(now = Date.now()): string`;
  - `generatePassword({ length, upper, lower, digits, symbols, excludeSimilar }): string`, which guarantees at least one character from each chosen set and throws `'Pick at least one character set'`;
  - `entropyBits(length, poolSize): number`;
  - `strengthLabel(bits)`, which is `'Weak' <40`, `'Fair' <60`, `'Strong' <80`, else `'Very strong'`;
  - `encodeUrl(s, mode: 'component'|'full')` and `decodeUrl(s)` (bad escape → `ToolError('Malformed URL encoding')`);
  - `parseUrl(s): { protocol, host, pathname, params: [string,string][], hash } | null`;
  - `decodeJwt(token): { header, payload, expired: boolean | null }` (bad format → `ToolError('Not a valid JWT')`);
  - `fromTimestamp(input: string): { date: Date; unit: 's'|'ms' }` (more than 11 digits = ms) and `toTimestamp(date): { s: number; ms: number }`;
  - `convertCase(text, kind: 'upper'|'lower'|'title'|'sentence'|'camel'|'pascal'|'snake'|'kebab'|'constant'): string`;
  - `countText(text): { words, chars, charsNoSpaces, sentences, paragraphs, readingMinutes }` (200 wpm, rounded up, 0 for empty);
  - `diffTexts(a, b, mode: 'line'|'word')`, which returns the `diff` library change objects.
- **The JWT UI** shows the label "Decoded only — signature is not verified".
- **Icons:** `mdiIdentifier`, `mdiFormTextboxPassword`, `mdiLink`, `mdiKeyChain`, `mdiClockOutline`, `mdiFormatLetterCase`, `mdiCounter`, `mdiFileCompare`.

- [ ] **Step 1: Write failing tests:**
  - `uuidV4()` matches `/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/`;
  - `uuidV7(0x0190_0000_0000)` starts with `01900000-0000-7`, and two v7 ids with increasing `now` sort lexicographically;
  - `generatePassword({length:16, upper:true, lower:false, digits:true, symbols:false, excludeSimilar:true})` has length 16, contains an uppercase letter and a digit, and has no `O0Il1`;
  - all character sets off → throws;
  - `entropyBits(16, 62)` ≈ 95.27;
  - `encodeUrl('a b&c','component')` → `'a%20b%26c'`;
  - `decodeUrl('%E0%A4%A')` throws;
  - `parseUrl('https://x.com/p?a=1&b=2#h').params` → `[['a','1'],['b','2']]`;
  - `decodeJwt` on a token built in-test with header `{alg:'HS256'}` and payload `{exp: 1}` → `expired: true`; with no `exp` → `null`;
  - `decodeJwt('abc')` throws;
  - `fromTimestamp('1700000000').date.toISOString()` → `'2023-11-14T22:13:20.000Z'` with unit `s`, and `'1700000000000'` → unit `ms`;
  - `convertCase('hello world-foo_bar', 'camel')` → `'helloWorldFooBar'`, `'constant'` → `'HELLO_WORLD_FOO_BAR'`, `'title'` → `'Hello World-foo_bar'` (title only capitalizes space-separated words);
  - `countText('Hi there. Bye!\n\nNew para')` → words 5, sentences 3 (a non-empty trailing fragment counts as a sentence), paragraphs 2;
  - `countText('')` is all zeros.
- [ ] **Step 2–4:** Run `npm i diff`, watch them FAIL, implement, watch them PASS. **Step 5:** Commit: `feat: dev tools part 2`.

### Task 19: README

**Files:**
- Create: `README.md`

- [ ] **Step 1:** Write the README with these sections:
  - Run (`npm i`, `npm run dev`, then http://localhost:3000);
  - optional engines with download links (MS Office, LibreOffice, Ghostscript), with a note that `/api/engines` shows what was detected;
  - the background model (downloaded on first use to `.cache/models`, a few hundred MB);
  - how to add a tool (spec §9);
  - environment variables (`LIBREOFFICE_PATH`, `GHOSTSCRIPT_PATH`, `MAX_FILE_MB`, `JOB_TIMEOUT_MS`);
  - tests (`npm test`, `npm run test:e2e`).
- [ ] **Step 2:** Commit: `docs: readme`.

### Task 20: End-to-end smoke test and final verification

**Files:**
- Create: `playwright.config.ts`, `e2e/smoke.spec.ts`, fixture `test/fixtures/people.json`
- Modify: `test/tools/registry.test.ts` (assert `EXPECTED_COUNT === 47`)

- [ ] **Step 1: Write the smoke test.** It runs `webServer: npm run build && npm start` on port 3100, then:
  1. Opens `/` and expects the heading "Every tool you need. One place.".
  2. Presses Ctrl+K and types `json`, then expects the "JSON → Excel" card to be visible.
  3. Clicks it, uploads `people.json`, clicks Run, then waits for a download whose `suggestedFilename()` is `people.xlsx`.
  4. Toggles the theme and expects `html` to have class `dark`, then reloads and expects it to still have it.
- [ ] **Step 2:** Run `npx playwright install chromium && npm run test:e2e` and expect PASS.
- [ ] **Step 3:** Run `npm test` and expect all PASS, with the registry count at 47 and a list of the engine-dependent tests that were skipped. Run `npm run build` and expect success with no type errors.
- [ ] **Step 4:** Commit: `test: e2e smoke and final verification`.
