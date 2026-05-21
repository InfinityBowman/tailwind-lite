# tailwind-lite

Minimal Tailwind CSS v4 compiler written in Rust. Single binary, no JS runtime. Goal is byte-for-byte CSS output parity with the official `tailwindcss` CLI (v4.3.0).

## Build

```bash
cargo build --release
# Binary at: target/release/tailwind-lite
```

## Run

```bash
./target/release/tailwind-lite -i <input.css> --cwd <project-dir> -o <output.css>
```

## Testing against the official CLI

The official CLI lives at `test/node_modules/.bin/tailwindcss` (installed via `test/package.json`).

### Critical: use `source(none)` for fair comparisons

`@import 'tailwindcss'` auto-scans the entire project tree including `node_modules/`. This inflates the official output from ~2,400 lines to ~26,000 lines of utilities extracted from tailwindcss's own source. To get an apples-to-apples comparison, the input.css must use:

```css
@import "tailwindcss" source(none);
@source "./src";
```

tailwind-lite does NOT auto-scan node_modules, so without `source(none)` the outputs will never match.

### Running a comparison

```bash
# 1. Build
cargo build --release

# 2. Run official CLI
(cd test && node_modules/.bin/tailwindcss -i input.css -o /tmp/official.css)

# 3. Run tailwind-lite
./target/release/tailwind-lite -i test/input.css --cwd test -o /tmp/lite.css

# 4. Compare
diff /tmp/lite.css /tmp/official.css
```

For sub-tests (e.g. `test/stress/`, `test/shadcn/`):
```bash
(cd test/stress && ../node_modules/.bin/tailwindcss -i input.css -o /tmp/official.css)
./target/release/tailwind-lite -i test/stress/input.css --cwd test/stress -o /tmp/lite.css
diff /tmp/lite.css /tmp/official.css
```

### Test structure

Each test has a directory under `test/` with:
- `input.css` — Tailwind input (imports, @source, @theme, etc.)
- `src/` — HTML/TSX files scanned for utility classes
- `expected.css` — reference output (may be stale; regenerate from official CLI to verify)
- `output.css` — tailwind-lite's last output

Main test: `test/` (input.css + src/index.html + src/complex.html)

Sub-tests: `container/`, `dnd-world/`, `globe-app/`, `idle-game/`, `paleo-editor/`, `shadcn/`, `stress/`

### Current status (main test)

~99% match. Remaining gaps (~20 lines on a 2,450-line file):
- Missing utilities: `bg-top-left`, `bg-top-right`, `bg-bottom-left`, `bg-bottom-right`
- Missing `@property` declarations: `--tw-text-shadow-color`, `--tw-text-shadow-alpha`
- Missing base reset vars for text-shadow
- `@property --tw-content` missing `inherits: false`

## Architecture

- `src/main.rs` — CLI entry, orchestrates the pipeline
- `src/input.rs` — Parses input CSS (@import, @source, @theme, @utility, @variant, @apply)
- `src/scanner.rs` — Extracts utility class candidates from source files
- `src/theme.rs` — Theme variable registry and resolution
- `src/utilities.rs` — Maps utility class names to CSS declarations
- `src/variants.rs` — Wraps utilities with variant selectors (hover:, sm:, dark:, etc.)
- `src/compiler.rs` — Matches candidates to utilities+variants, produces compiled rules
- `src/output.rs` — Assembles final CSS with layers, @property, base reset
- `src/apply.rs` — Handles @apply substitution
- `src/css_functions.rs` — Post-processing for theme(), --spacing calc, etc.

## Dependencies

- `tailwindcss-oxide` — Used for candidate extraction (same scanner as official CLI)
- `lightningcss` — CSS parsing/minification
- `clap` — CLI argument parsing
