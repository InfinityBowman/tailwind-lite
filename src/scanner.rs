use std::collections::HashSet;
use std::path::Path;
use tailwindcss_oxide::extractor::{Extracted, Extractor};
use walkdir::WalkDir;

const EXTENSIONS: &[&str] = &[
    "html", "pug", "gjs", "gts", "astro", "cjs", "cts", "jade",
    "js", "jsx", "mjs", "mts", "svelte", "ts", "tsx", "vue",
    "md", "mdx", "aspx", "razor", "handlebars", "hbs", "mustache",
    "php", "twig", "erb", "haml", "liquid", "rb", "rhtml", "slim",
    "eex", "heex", "njk", "nunjucks", "py", "tpl", "rs",
    "htm", "go", "ex",
];

const IGNORED_DIRS: &[&str] = &[
    ".git", ".hg", ".jj", ".next", ".parcel-cache", ".pnpm-store",
    ".svelte-kit", ".svn", ".turbo", ".venv", ".vercel", ".yarn",
    "__pycache__", "node_modules", "venv",
];

const IGNORED_EXTENSIONS: &[&str] = &[
    "less", "lock", "sass", "scss", "styl", "log",
];

const IGNORED_FILES: &[&str] = &[
    "package-lock.json", "pnpm-lock.yaml", "bun.lockb",
    ".gitignore", ".env",
];

pub fn scan_sources(source_paths: &[String], cwd: &Path) -> Vec<String> {
    let mut candidates = HashSet::new();

    for source in source_paths {
        let dir = if Path::new(source).is_absolute() {
            source.into()
        } else {
            cwd.join(source).to_string_lossy().to_string()
        };

        for entry in WalkDir::new(&dir)
            .follow_links(true)
            .into_iter()
            .filter_entry(|e| {
                if e.file_type().is_dir() {
                    let name = e.file_name().to_string_lossy();
                    return !IGNORED_DIRS.iter().any(|d| name == *d);
                }
                true
            })
            .filter_map(|e| e.ok())
        {
            if !entry.file_type().is_file() {
                continue;
            }

            let path = entry.path();
            let filename = path.file_name().and_then(|f| f.to_str()).unwrap_or("");
            if IGNORED_FILES.iter().any(|f| filename == *f) || filename.starts_with(".env") {
                continue;
            }

            let ext = path.extension().and_then(|e| e.to_str()).unwrap_or("");
            if IGNORED_EXTENSIONS.iter().any(|e| ext == *e) {
                continue;
            }
            if !EXTENSIONS.iter().any(|e| ext == *e || path.to_string_lossy().ends_with(e)) {
                continue;
            }

            if let Ok(content) = std::fs::read(path) {
                let extension = path.extension().and_then(|e| e.to_str()).unwrap_or("");
                let content = tailwindcss_oxide::scanner::pre_process_input(content, extension);
                let mut extractor = Extractor::new(&content);
                for extracted in extractor.extract() {
                    match extracted {
                        Extracted::Candidate(bytes) => {
                            if let Ok(s) = std::str::from_utf8(bytes) {
                                candidates.insert(s.to_string());
                            }
                        }
                        Extracted::CssVariable(_) => {}
                    }
                }
            }
        }
    }

    let mut result: Vec<String> = candidates.into_iter().collect();
    result.sort();
    result
}
