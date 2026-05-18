/// @apply substitution — ports apply.ts
/// Replaces @apply directives with compiled utility declarations.

use crate::candidate::{parse_candidate, Candidate};
use crate::compiler::apply_color_mix_polyfill;
use crate::theme::Theme;
use crate::utilities::UtilityRegistry;
use crate::variants::VariantRegistry;

pub fn substitute_apply(
    css: &str,
    utility_registry: &UtilityRegistry,
    variant_registry: &VariantRegistry,
    theme: &Theme,
) -> String {
    let mut result = String::with_capacity(css.len());
    let mut pos = 0;

    while pos < css.len() {
        if let Some(apply_idx) = css[pos..].find("@apply ") {
            let apply_start = pos + apply_idx;
            result.push_str(&css[pos..apply_start]);

            let after_keyword = apply_start + 7;
            let line_end = css[after_keyword..]
                .find(';')
                .map(|i| after_keyword + i)
                .unwrap_or(css.len());
            let params = css[after_keyword..line_end].trim();

            if params.is_empty() || params.starts_with("--") {
                // CSS Mixins (@apply --mixin) — pass through
                result.push_str(&css[apply_start..line_end]);
                if line_end < css.len() {
                    result.push(';');
                }
                pos = line_end + 1;
                continue;
            }

            let indent = detect_indent(&css[..apply_start]);

            let candidates: Vec<&str> = params.split_whitespace().collect();
            let expanded = compile_apply_candidates(
                &candidates,
                utility_registry,
                variant_registry,
                theme,
                &indent,
            );

            result.push_str(expanded.trim_start());

            pos = if line_end < css.len() { line_end + 1 } else { line_end };
        } else {
            result.push_str(&css[pos..]);
            break;
        }
    }

    result
}

fn compile_apply_candidates(
    candidates: &[&str],
    utility_registry: &UtilityRegistry,
    variant_registry: &VariantRegistry,
    theme: &Theme,
    indent: &str,
) -> String {
    let known = |name: &str| utility_registry.is_known(name);
    let is_static = |name: &str| utility_registry.is_static(name);

    struct ApplyEntry {
        decls: Vec<(String, String)>,
        variants: Vec<String>,
        important: bool,
        sort_key: Vec<usize>,
    }

    let mut entries: Vec<ApplyEntry> = Vec::new();

    for raw in candidates {
        let cand = match parse_candidate(raw, &known, &is_static) {
            Some(c) => c,
            None => continue,
        };

        if let Some(decls) = utility_registry.compile(&cand, theme) {
            let decls = apply_color_mix_polyfill(decls, theme);
            let (sort_key, _) = crate::compiler::get_property_sort(&decls);
            entries.push(ApplyEntry {
                decls,
                variants: cand.variants().to_vec(),
                important: cand.is_important(),
                sort_key,
            });
        }
    }

    entries.sort_by(|a, b| a.sort_key.cmp(&b.sort_key));

    let mut declarations = String::new();
    for entry in &entries {
        if entry.variants.is_empty() {
            write_flat_declarations(
                &mut declarations,
                &entry.decls,
                entry.important,
                indent,
            );
        } else {
            let variant_refs: Vec<&str> = entry.variants.iter().map(|s| s.as_str()).collect();
            write_variant_declarations(
                &mut declarations,
                &entry.decls,
                &variant_refs,
                variant_registry,
                entry.important,
                indent,
            );
        }
    }

    declarations
}

fn write_flat_declarations(
    out: &mut String,
    decls: &[(String, String)],
    important: bool,
    indent: &str,
) {
    for (prop, val) in decls {
        if prop == "--tw-sort" || prop == "__supports_color_mix__" || prop == "__placeholder_color__" || prop == "__space_value__" {
            continue;
        }
        if let Some(real_prop) = prop.strip_prefix("@supports:") {
            out.push_str(indent);
            out.push_str("@supports (color: color-mix(in lab, red, red)) {\n");
            out.push_str(indent);
            out.push_str("  ");
            out.push_str(real_prop);
            out.push_str(": ");
            out.push_str(val);
            if important { out.push_str(" !important"); }
            out.push_str(";\n");
            out.push_str(indent);
            out.push_str("}\n");
            continue;
        }
        if let Some(real_prop) = prop.strip_prefix("@supports-gradient:") {
            out.push_str(indent);
            out.push_str("@supports (background-image: linear-gradient(in lab, red, red)) {\n");
            out.push_str(indent);
            out.push_str("  ");
            out.push_str(real_prop);
            out.push_str(": ");
            out.push_str(val);
            if important { out.push_str(" !important"); }
            out.push_str(";\n");
            out.push_str(indent);
            out.push_str("}\n");
            continue;
        }
        out.push_str(indent);
        out.push_str(prop);
        out.push_str(": ");
        out.push_str(val);
        if important { out.push_str(" !important"); }
        out.push_str(";\n");
    }
}

fn write_variant_declarations(
    out: &mut String,
    decls: &[(String, String)],
    variants: &[&str],
    variant_registry: &VariantRegistry,
    important: bool,
    indent: &str,
) {
    let mut nesting: Vec<(Option<String>, Option<String>)> = Vec::new();

    for variant_name in variants.iter().rev() {
        if let Some(effect) = variant_registry.resolve(variant_name) {
            nesting.push((effect.selector.clone(), effect.at_rule.clone()));
        }
    }

    let mut current_indent = indent.to_string();

    for (selector, at_rule) in &nesting {
        if let Some(at) = at_rule {
            out.push_str(&current_indent);
            out.push_str(at);
            out.push_str(" {\n");
            current_indent.push_str("  ");
        }
        if let Some(sel) = selector {
            out.push_str(&current_indent);
            out.push_str(sel);
            out.push_str(" {\n");
            current_indent.push_str("  ");
        }
    }

    write_flat_declarations(out, decls, important, &current_indent);

    for (selector, at_rule) in nesting.iter().rev() {
        if selector.is_some() {
            current_indent.truncate(current_indent.len().saturating_sub(2));
            out.push_str(&current_indent);
            out.push_str("}\n");
        }
        if at_rule.is_some() {
            current_indent.truncate(current_indent.len().saturating_sub(2));
            out.push_str(&current_indent);
            out.push_str("}\n");
        }
    }
}

fn detect_indent(before_apply: &str) -> String {
    let last_newline = before_apply.rfind('\n').unwrap_or(0);
    let after_newline = &before_apply[last_newline..];
    let indent: String = after_newline.chars().filter(|c| c.is_whitespace() && *c != '\n').collect();
    indent
}
