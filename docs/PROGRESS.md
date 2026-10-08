# Tool-Master: build progress

**Last session:** 2026-10-08 (morning). Resume from **Task 8**.

- Plan: [plans/2026-10-07-tool-master.md](plans/2026-10-07-tool-master.md)
- Spec: [specs/2026-10-07-tool-master-design.md](specs/2026-10-07-tool-master-design.md)
- Branch: `feat/tool-master` (to be merged into `main` once all tasks and the final review are done)
- Execution mode: native (inline), with one whole-branch review at the end

## Done (Tasks 1–6 of 20): foundation

| # | Task | Result |
|---|---|---|
| 1 | Scaffold, theme tokens, Vitest | Next.js 16.4 + Tailwind 4 + Vitest 5 + Playwright |
| 2 | Tool contract and registry | `tools/types.ts`, `tools/registry.ts`, loader maps |
| 3 | Shell, logo, theme, home page | Tile Grid logo, light/dark toggle, search (Ctrl+K), category tabs |
| 4 | Generic tool page and client runner | Dropzone, options form, file queue, zip download, text-tool layout |
| 5 | Server job pipeline | `POST /api/tools/[slug]`, temp dirs, per-engine queues, timeouts, startup sweep |
| 6 | Engine detection | `GET /api/engines`, "not found, install from…" notice |
| 7 | Office conversions | **First 4 tools live:** PDF → Word, Word → PDF, Excel → PDF, PowerPoint → PDF (MS Office or LibreOffice) |

There are 49 unit tests plus 11 LibreOffice integration tests, all passing (5 MS Office tests are skipped because Office isn't installed). `npm run build` passes with 0 warnings.

**Performance note:** LibreOffice takes about 16–18 s per document on this PC, mostly startup time. A possible later improvement is to keep a warm LibreOffice process running.

**Engines on the dev PC:** LibreOffice ✅ · MS Word/Excel/PowerPoint ❌ · Ghostscript ❌.
- Office conversions will run through LibreOffice.
- MS Office integration tests will be skipped on this PC.
- Compress PDF needs Ghostscript installed to work here.

## Next up

- **Task 8:** Compress PDF.
- **Tasks 9–11:** PDF tools.
- **Tasks 12–13:** data tools.
- **Tasks 14–16:** image tools and the background remover.
- **Tasks 17–18:** Dev & Text tools.
- **Tasks 19–20:** README and end-to-end test.
- Then the final review.

## Decisions made during the build

- **Scaffold:** created through a temp folder (create-next-app refuses a non-empty folder). `@types/node` was bumped to `^24` for Vitest 5.
- **No `runtime` export in route files:** Next 16 rejects `export const runtime` when Cache Components is on, and Node.js is the default anyway.
- **Custom tool UIs** are registered as plain import functions and wrapped with `next/dynamic` on the tool page.
- **Browser-safe engine module:** engine install hints live in `lib/engines/hints.ts`, so browser code never bundles Node-only modules.
- **One shared LibreOffice profile** (`.cache/lo-profile`) instead of a fresh one per job. This saves about 10 s per conversion, and the profile is wiped automatically after a timeout.
- **Broken-file test** uses a truncated .docx. LibreOffice legitimately converts plain-text files, so a text file isn't a failure case.
- **Unknown tool pages** (`/tools/<bad-slug>`) show the 404 page but return HTTP 200, because of Cache Components streaming. This is flagged for the final review.
