mod apply;
mod candidate;
mod compiler;
mod css_functions;
mod input;
mod output;
mod scanner;
mod theme;
mod utilities;
mod variants;

use clap::Parser;
use std::path::{Path, PathBuf};

#[derive(Parser)]
#[command(name = "tailwind-lite", about = "Minimal Tailwind CSS compiler — no JS runtime")]
struct Cli {
    #[arg(short, long)]
    input: PathBuf,

    #[arg(short, long)]
    output: Option<PathBuf>,

    #[arg(long)]
    cwd: Option<PathBuf>,

    #[arg(long, default_value_t = false)]
    minify: bool,
}

fn main() {
    let cli = Cli::parse();

    let cwd = cli.cwd.map(|p| {
        if p.is_absolute() { p } else { std::env::current_dir().unwrap().join(p) }
    }).unwrap_or_else(|| std::env::current_dir().unwrap());

    let raw_input_css = std::fs::read_to_string(&cli.input).unwrap_or_else(|e| {
        eprintln!("Error reading {}: {e}", cli.input.display());
        std::process::exit(1);
    });

    let abs_input_early = if cli.input.is_absolute() {
        cli.input.clone()
    } else {
        std::env::current_dir().unwrap().join(&cli.input)
    };
    let input_dir_early = abs_input_early.parent().unwrap_or(Path::new(".")).to_path_buf();

    let input_css = input::resolve_imports(&raw_input_css, &input_dir_early, 0);

    let parsed = input::parse_input(&input_css);

    let mut theme = theme::Theme::new();
    theme.load_defaults();
    for (key, value, inline) in &parsed.theme_entries {
        theme.set(key, value, *inline);
    }

    let abs_input = if cli.input.is_absolute() {
        cli.input.clone()
    } else {
        std::env::current_dir().unwrap().join(&cli.input)
    };
    let input_dir = abs_input.parent().unwrap_or(Path::new(".")).to_path_buf();

    let mut source_globs = Vec::new();
    for p in &parsed.source_paths {
        let path = Path::new(p);
        let resolved = if path.is_absolute() {
            p.clone()
        } else {
            input_dir.join(p).to_string_lossy().to_string()
        };
        if !source_globs.contains(&resolved) {
            source_globs.push(resolved);
        }
    }
    if source_globs.is_empty() {
        source_globs.push(input_dir.to_string_lossy().to_string());
    }

    let candidates = scanner::scan_sources(&source_globs, &cwd);

    let utility_registry = utilities::create_utilities();
    let mut variant_registry = variants::create_variants(&theme);
    variants::register_custom_variants(&mut variant_registry, &parsed.custom_variants);

    // Substitute @apply in user CSS blocks
    let mut parsed = parsed;
    for base in &mut parsed.user_base {
        *base = apply::substitute_apply(base, &utility_registry, &variant_registry, &theme);
    }
    for util in &mut parsed.user_utilities {
        *util = apply::substitute_apply(util, &utility_registry, &variant_registry, &theme);
    }
    for cu in &mut parsed.custom_utilities {
        cu.body = apply::substitute_apply(&cu.body, &utility_registry, &variant_registry, &theme);
    }
    for pt in &mut parsed.passthrough {
        if pt.contains("@apply ") {
            *pt = apply::substitute_apply(pt, &utility_registry, &variant_registry, &theme);
        }
    }

    let compiled = compiler::compile(
        &candidates,
        &utility_registry,
        &variant_registry,
        &theme,
        &parsed,
    );

    let spacing_multiplier = theme.get_spacing_multiplier();
    let css = output::assemble(
        &compiled,
        &theme,
        &parsed,
        cli.minify,
    );
    let css = css_functions::substitute_functions(
        &css,
        spacing_multiplier.as_deref(),
        &theme,
    );
    match cli.output {
        Some(path) => {
            if let Some(parent) = path.parent() {
                std::fs::create_dir_all(parent).ok();
            }
            std::fs::write(&path, &css).unwrap_or_else(|e| {
                eprintln!("Error writing {}: {e}", path.display());
                std::process::exit(1);
            });
            eprintln!("Done. Wrote {} bytes to {}", css.len(), path.display());
        }
        None => print!("{css}"),
    }
}
