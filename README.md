# tailwind-lite

A standalone Tailwind CSS v4.3 compiler written in Rust. Produces a single binary with no runtime dependencies. No Node.js, no npm, no `node_modules` required. This is an extremely minimal fully native build for constrained environments (<5mb compared to standard ~130mb). It does not resolve any imports from node modules, it does not support plugins and there may be bugs around edge cases. If you run into any bugs then let me know so it can be fixed. This project was mostly developed by Claude with extensive guidance (it had a pretty hard time). This is not intended to be used in HMR during development.

The output is byte-for-byte identical to the official Tailwind CSS v4.3.0 CLI as far as I know.

## Install

Download a prebuilt binary from the [Releases](../../releases) page for your platform:

- `tailwind-lite-macos-aarch64` (Apple Silicon)
- `tailwind-lite-macos-x86_64` (Intel Mac)
- `tailwind-lite-linux-x86_64`
- `tailwind-lite-linux-aarch64`
- `tailwind-lite-windows-x86_64.exe`

## Build from source

```sh
cargo build --release
# Binary is at target/release/tailwind-lite
```

## Usage

```sh
tailwind-lite --input src/input.css --output dist/output.css
```

### Options

| Flag                  | Description                                    |
| --------------------- | ---------------------------------------------- |
| `-i, --input <FILE>`  | Path to your input CSS file                    |
| `-o, --output <FILE>` | Output file path (prints to stdout if omitted) |
| `--cwd <DIR>`         | Working directory for source scanning          |
| `--minify`            | Minify the output CSS                          |

### Input CSS

Your input CSS should work exactly like it does with the official Tailwind CLI:

```css
@import 'tailwindcss';

@theme {
  --color-primary: oklch(0.65 0.15 340);
}
```

You can use `@import` to pull in local CSS files:

```css
@import 'tailwindcss';
@import './custom.css';
```

Bare package imports (like `@import "tw-animate"`) are not supported since there is no Node module resolution. To use CSS from npm packages, copy the CSS file into your project and import it by path instead.

## What is supported

- `@import "tailwindcss"` (theme, preflight, and utilities are all embedded in the binary)
- `@theme` and `@theme inline` declarations
- `@layer base`, `@layer utilities`, `@layer components`
- `@apply` with full property-order sorting
- `@utility` (custom utilities)
- `@custom-variant`
- `@keyframes`
- `@source` directives
- All built-in utilities and variants from Tailwind CSS v4.3
- Automatic source scanning (HTML, JSX, TSX, Vue, Svelte, PHP, and more)
- Minification via `--minify`

## What is not supported

- Watch mode / file watching
- Bare package imports (`@import "some-package"`)
- `@plugin` directives
- PostCSS plugin mode

## How it works

The theme defaults and preflight CSS are compiled into the binary at build time. The class extractor comes from the official `tailwindcss-oxide` crate (the same Rust-based scanner that the real Tailwind CLI uses). Everything else is a direct port of the TypeScript compilation pipeline.

## License

MIT
