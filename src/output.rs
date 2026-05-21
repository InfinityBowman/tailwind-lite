use crate::compiler::CompiledRule;
use crate::input::ParsedInput;
use crate::theme::Theme;

pub fn assemble(
    rules: &[CompiledRule],
    theme: &Theme,
    parsed: &ParsedInput,
    minify: bool,
    source_css_variables: &[String],
) -> String {
    let mut utilities_css = String::with_capacity(16 * 1024);
    for rule in rules {
        write_rule(&mut utilities_css, rule);
    }
    for user_util in &parsed.user_utilities {
        utilities_css.push_str(user_util);
        utilities_css.push('\n');
    }

    let utility_vars = collect_used_vars(&utilities_css);

    let mut all_css_for_scan = utilities_css.clone();
    if parsed.has_tailwind_import {
        let preflight = resolve_theme_refs(include_str!("css/preflight.css"));
        all_css_for_scan.push_str(&preflight);
    }
    let mut used_vars = collect_used_vars(&all_css_for_scan);

    for rule in rules {
        let c = &rule.raw_candidate;
        let base = c.split(':').last().unwrap_or(c).trim_end_matches('!');
        for prefix in &["drop-shadow-"] {
            if base.starts_with(prefix) {
                let key = format!("--{}", base);
                if theme.has_key(&key) {
                    used_vars.insert(key);
                }
            }
        }
    }

    // Only include --default-* vars that are referenced by utilities (not just preflight)
    // except for font family/mono family which are always needed when preflight is included
    let preflight_only_defaults: Vec<String> = used_vars.iter()
        .filter(|v| v.starts_with("--default-") && !utility_vars.contains(*v))
        .filter(|v| !matches!(v.as_str(), "--default-font-family" | "--default-mono-font-family"))
        .cloned()
        .collect();
    for v in preflight_only_defaults {
        used_vars.remove(&v);
    }

    for var_name in source_css_variables {
        if theme.is_user_defined(var_name) {
            used_vars.insert(var_name.clone());
        }
    }

    // Mark user-defined theme vars referenced in passthrough CSS, user base, and keyframes
    let mut user_css_scan = String::new();
    for p in &parsed.passthrough {
        user_css_scan.push_str(p);
    }
    for b in &parsed.user_base {
        user_css_scan.push_str(b);
    }
    for kf in &parsed.keyframes {
        user_css_scan.push_str(kf);
    }
    let user_css_vars = collect_used_vars(&user_css_scan);
    for var_name in &user_css_vars {
        if theme.is_user_defined(var_name) {
            theme.mark_used(var_name);
        }
    }

    let inline_origin_vars = theme.get_inline_referenced_vars();
    let inline_to_remove: Vec<String> = used_vars.iter()
        .filter(|v| inline_origin_vars.contains(v.as_str()) && !theme.is_user_defined(v))
        .cloned()
        .collect();
    for v in inline_to_remove {
        used_vars.remove(&v);
    }

    // Collect @property rules from compiled utilities, deduplicated in first-occurrence order
    // This matches the TS behavior: each utility declares its own @property via atRoot([property(...)])
    let mut seen_props = rustc_hash::FxHashSet::default();
    let mut used_props: Vec<crate::utilities::CssProperty> = Vec::new();
    for rule in rules {
        for p in &rule.properties {
            if seen_props.insert(p.name.clone()) {
                used_props.push(p.clone());
            }
        }
    }
    let has_properties = !used_props.is_empty();

    let mut out = String::with_capacity(64 * 1024);

    out.push_str("/*! tailwindcss v4.3.0 | MIT License | https://tailwindcss.com */\n");

    if has_properties {
        out.push_str("@layer properties;\n");
    }
    out.push_str("@layer theme, base, components, utilities;\n");

    // Theme variables — only emit used ones
    out.push_str("@layer theme {\n  :root, :host {\n");
    out.push_str(&theme.generate_used_css_variables(&used_vars, &user_css_vars));
    out.push_str("  }\n}\n");

    // Preflight / base (built-in only)
    if parsed.has_tailwind_import {
        out.push_str("@layer base {\n");
        let preflight = include_str!("css/preflight.css");
        let preflight = resolve_theme_refs(preflight);
        let preflight = normalize_preflight(&preflight);
        out.push_str(&preflight);
        out.push_str("}\n");
    }

    // Utilities
    out.push_str("@layer utilities {\n");
    out.push_str(&utilities_css);
    out.push_str("}\n");

    // Emit user @layer base and passthrough blocks in source order
    for block in &parsed.post_utility_order {
        match block {
            crate::input::PostUtilityBlock::Passthrough(idx) => {
                let p = &parsed.passthrough[*idx];
                if p.trim_start().starts_with("@keyframes ") {
                    let formatted = format_keyframes(p);
                    out.push_str(&formatted);
                    if !formatted.ends_with('\n') {
                        out.push('\n');
                    }
                } else {
                    out.push_str(&normalize_passthrough(p));
                }
            }
            crate::input::PostUtilityBlock::UserBase(idx) => {
                out.push_str("@layer base {\n");
                let normalized = normalize_user_css_block(&parsed.user_base[*idx]);
                out.push_str(&normalized);
                out.push_str("}\n");
            }
        }
    }

    // Emit @property rules
    for prop in &used_props {
        out.push_str(&format!("@property {} {{\n", prop.name));
        out.push_str(&format!("  syntax: \"{}\";\n", prop.syntax));
        out.push_str("  inherits: false;\n");
        if let Some(iv) = &prop.initial_value {
            out.push_str(&format!("  initial-value: {};\n", iv));
        }
        out.push_str("}\n");
    }

    // Default @keyframes after @property
    if parsed.has_tailwind_import {
        emit_default_keyframes(&mut out, &used_vars);
    }

    // @layer properties fallback for browsers without @property support
    if !used_props.is_empty() {
        out.push_str("@layer properties {\n");
        out.push_str("  @supports ((-webkit-hyphens: none) and (not (margin-trim: inline))) or ((-moz-orient: inline) and (not (color:rgb(from red r g b)))) {\n");
        out.push_str("    *, ::before, ::after, ::backdrop {\n");
        for prop in &used_props {
            let val = match &prop.initial_value {
                Some(v) => v.to_string(),
                None => "initial".to_string(),
            };
            out.push_str(&format!("      {}: {};\n", prop.name, val));
        }
        out.push_str("    }\n");
        out.push_str("  }\n");
        out.push_str("}\n");
    }

    if minify {
        minify_css(&out)
    } else {
        out
    }
}

fn emit_default_keyframes(out: &mut String, used_vars: &rustc_hash::FxHashSet<String>) {
    if used_vars.contains("--animate-spin") {
        out.push_str("@keyframes spin {\n  to {\n    transform: rotate(360deg);\n  }\n}\n");
    }
    if used_vars.contains("--animate-ping") {
        out.push_str("@keyframes ping {\n  75%, 100% {\n    transform: scale(2);\n    opacity: 0;\n  }\n}\n");
    }
    if used_vars.contains("--animate-pulse") {
        out.push_str("@keyframes pulse {\n  50% {\n    opacity: 0.5;\n  }\n}\n");
    }
    if used_vars.contains("--animate-bounce") {
        out.push_str("@keyframes bounce {\n  0%, 100% {\n    transform: translateY(-25%);\n    animation-timing-function: cubic-bezier(0.8, 0, 1, 1);\n  }\n  50% {\n    transform: none;\n    animation-timing-function: cubic-bezier(0, 0, 0.2, 1);\n  }\n}\n");
    }
}

fn collect_used_vars(css: &str) -> rustc_hash::FxHashSet<String> {
    let mut vars = rustc_hash::FxHashSet::default();
    let mut pos = 0;
    while let Some(idx) = css[pos..].find("var(") {
        let after_paren = pos + idx + 4;
        // Skip whitespace after var(
        let start = css[after_paren..].find(|c: char| !c.is_whitespace())
            .map_or(css.len(), |i| after_paren + i);
        if start < css.len() && css[start..].starts_with("--") {
            let end = css[start..].find(|c: char| c == ')' || c == ',').map_or(css.len(), |i| start + i);
            let var_name = css[start..end].trim();
            if !var_name.starts_with("--tw-") {
                vars.insert(var_name.to_string());
            }
            pos = end;
        } else {
            pos = after_paren;
        }
    }
    vars
}

fn write_rule(out: &mut String, rule: &CompiledRule) {
    let indent_base = "  ";
    let indent = String::from(indent_base);

    out.push_str(&indent);
    out.push_str(&rule.selector);
    out.push_str(" {\n");

    if let Some(ref body) = rule.raw_body {
        let min_indent = body.lines()
            .filter(|l| !l.trim().is_empty())
            .map(|l| l.len() - l.trim_start().len())
            .min()
            .unwrap_or(0);
        for line in body.lines() {
            let trimmed = line.trim();
            if trimmed.is_empty() {
                continue;
            }
            let line_indent = line.len() - line.trim_start().len();
            let relative = line_indent.saturating_sub(min_indent);
            out.push_str("    ");
            for _ in 0..relative {
                out.push(' ');
            }
            out.push_str(trimmed);
            out.push('\n');
        }
    } else if rule.variant_nesting.is_empty() {
        write_declarations(out, &rule.declarations, rule.important, &indent, 1);
        if let Some(nested) = &rule.nested_rule {
            write_nested_rule(out, nested, &indent, 1);
        }
        for nar in &rule.nested_at_rules {
            let inner_indent = make_indent(&indent, 1);
            out.push_str(&inner_indent);
            out.push_str(&nar.at_rule);
            out.push_str(" {\n");
            write_declarations(out, &nar.declarations, rule.important, &indent, 2);
            out.push_str(&inner_indent);
            out.push_str("}\n");
        }
    } else {
        write_variant_nesting(out, &rule.variant_nesting, 0, &rule.declarations, &rule.nested_rule, rule.important, &indent, 1);
    }

    out.push_str(&indent);
    out.push_str("}\n");
}

fn write_variant_nesting(
    out: &mut String,
    nests: &[crate::compiler::VariantNest],
    idx: usize,
    declarations: &[(String, String)],
    nested_rule: &Option<crate::compiler::NestedRule>,
    important: bool,
    base_indent: &str,
    depth: usize,
) {
    if idx >= nests.len() {
        write_declarations(out, declarations, important, base_indent, depth);
        if let Some(nested) = nested_rule {
            write_nested_rule(out, nested, base_indent, depth);
        }
        return;
    }

    let nest = &nests[idx];
    let indent = make_indent(base_indent, depth);

    let all_selectors: Vec<&str> = {
        let mut v = Vec::new();
        if let Some(ref sel) = nest.selector {
            v.push(sel.as_str());
        }
        for s in &nest.extra_selectors {
            v.push(s.as_str());
        }
        v
    };

    let prepend = &nest.prepend_declarations;

    if !all_selectors.is_empty() {
        for sel in &all_selectors {
            out.push_str(&indent);
            out.push_str(sel);
            out.push_str(" {\n");

            let filtered_prepend: Vec<_> = prepend.iter()
                .filter(|(p, _)| !declarations.iter().any(|(dp, _)| dp == p))
                .cloned()
                .collect();

            if let Some(at_rule) = &nest.at_rule {
                let inner_indent = make_indent(base_indent, depth + 1);
                out.push_str(&inner_indent);
                out.push_str(at_rule);
                out.push_str(" {\n");
                write_declarations(out, &filtered_prepend, false, base_indent, depth + 2);
                write_variant_nesting(out, nests, idx + 1, declarations, nested_rule, important, base_indent, depth + 2);
                out.push_str(&inner_indent);
                out.push_str("}\n");
            } else {
                write_declarations(out, &filtered_prepend, false, base_indent, depth + 1);
                write_variant_nesting(out, nests, idx + 1, declarations, nested_rule, important, base_indent, depth + 1);
            }

            out.push_str(&indent);
            out.push_str("}\n");
        }
    } else if let Some(at_rule) = &nest.at_rule {
        out.push_str(&indent);
        out.push_str(at_rule);
        out.push_str(" {\n");
        write_declarations(out, prepend, false, base_indent, depth + 1);
        write_variant_nesting(out, nests, idx + 1, declarations, nested_rule, important, base_indent, depth + 1);
        out.push_str(&indent);
        out.push_str("}\n");
    }
}

fn write_declarations(out: &mut String, declarations: &[(String, String)], important: bool, base_indent: &str, depth: usize) {
    let indent = make_indent(base_indent, depth);
    let inner_indent = make_indent(base_indent, depth + 1);
    for (prop, val) in declarations {
        if prop == "--tw-sort" || prop == "__supports_color_mix__" {
            continue;
        }
        if let Some(real_prop) = prop.strip_prefix("@supports:") {
            out.push_str(&indent);
            out.push_str("@supports (color: color-mix(in lab, red, red)) {\n");
            out.push_str(&inner_indent);
            out.push_str(real_prop);
            out.push_str(": ");
            out.push_str(val);
            if important {
                out.push_str(" !important");
            }
            out.push_str(";\n");
            out.push_str(&indent);
            out.push_str("}\n");
            continue;
        }
        if let Some(real_prop) = prop.strip_prefix("@supports-gradient:") {
            out.push_str(&indent);
            out.push_str("@supports (background-image: linear-gradient(in lab, red, red)) {\n");
            out.push_str(&inner_indent);
            out.push_str(real_prop);
            out.push_str(": ");
            out.push_str(val);
            if important {
                out.push_str(" !important");
            }
            out.push_str(";\n");
            out.push_str(&indent);
            out.push_str("}\n");
            continue;
        }
        out.push_str(&indent);
        out.push_str(prop);
        out.push_str(": ");
        out.push_str(val);
        if important {
            out.push_str(" !important");
        }
        out.push_str(";\n");
    }
}

fn write_nested_rule(out: &mut String, nested: &crate::compiler::NestedRule, base_indent: &str, depth: usize) {
    let indent = make_indent(base_indent, depth);
    out.push_str(&indent);
    out.push_str(&nested.selector);
    out.push_str(" {\n");
    write_declarations(out, &nested.declarations, false, base_indent, depth + 1);
    out.push_str(&indent);
    out.push_str("}\n");
}

fn make_indent(base: &str, depth: usize) -> String {
    let mut s = String::from(base);
    for _ in 0..depth {
        s.push_str("  ");
    }
    s
}

fn normalize_preflight(css: &str) -> String {
    let stripped = strip_comments(css);
    let joined = join_continuation_lines(&stripped);
    let mut result = String::new();
    let mut lines = joined.lines().peekable();
    let mut depth: usize = 0;

    while let Some(line) = lines.next() {
        let trimmed = line.trim();
        if trimmed.is_empty() {
            continue;
        }

        if trimmed.starts_with("@supports") && trimmed.contains("-apple-pay-button") {
            result.push_str("  @supports (not (-webkit-appearance: -apple-pay-button))  or (contain-intrinsic-size: 1px) {\n");
            result.push_str("    ::placeholder {\n");
            result.push_str("      color: currentcolor;\n");
            result.push_str("      @supports (color: color-mix(in lab, red, red)) {\n");
            result.push_str("        color: color-mix(in oklab, currentcolor 50%, transparent);\n");
            result.push_str("      }\n");
            result.push_str("    }\n");
            result.push_str("  }\n");
            skip_block_lines(&mut lines);
            continue;
        }

        let trimmed = normalize_quotes_str(trimmed);

        if trimmed.ends_with('{') {
            let indent = "  ".repeat(depth + 1);
            result.push_str(&indent);
            result.push_str(&trimmed);
            result.push('\n');
            depth += 1;
        } else if trimmed.trim() == "}" {
            if depth > 0 { depth -= 1; }
            let indent = "  ".repeat(depth + 1);
            result.push_str(&indent);
            result.push_str("}\n");
        } else {
            let indent = "  ".repeat(depth + 1);
            result.push_str(&indent);
            result.push_str(&trimmed);
            result.push('\n');
        }
    }
    result
}

fn strip_comments(css: &str) -> String {
    let mut result = String::with_capacity(css.len());
    let bytes = css.as_bytes();
    let mut i = 0;
    while i < bytes.len() {
        if i + 1 < bytes.len() && bytes[i] == b'/' && bytes[i + 1] == b'*' {
            let mut j = i + 2;
            while j + 1 < bytes.len() && !(bytes[j] == b'*' && bytes[j + 1] == b'/') {
                j += 1;
            }
            i = if j + 1 < bytes.len() { j + 2 } else { bytes.len() };
        } else {
            result.push(bytes[i] as char);
            i += 1;
        }
    }
    result
}

fn join_continuation_lines(css: &str) -> String {
    let mut result = String::new();
    let mut current_line = String::new();
    let mut paren_depth: i32 = 0;

    for line in css.lines() {
        let trimmed = line.trim();
        if trimmed.is_empty() && paren_depth == 0 {
            if !current_line.is_empty() {
                result.push_str(&current_line);
                result.push('\n');
                current_line.clear();
            }
            continue;
        }

        if current_line.is_empty() {
            current_line = trimmed.to_string();
        } else {
            current_line.push(' ');
            current_line.push_str(trimmed);
        }

        for c in trimmed.chars() {
            if c == '(' { paren_depth += 1; }
            if c == ')' { paren_depth -= 1; }
        }

        if paren_depth <= 0 && (trimmed.ends_with(';') || trimmed.ends_with('{') || trimmed.ends_with('}')) {
            let collapsed = collapse_whitespace(&current_line);
            result.push_str(&collapsed);
            result.push('\n');
            current_line.clear();
            paren_depth = 0;
        }
    }
    if !current_line.is_empty() {
        result.push_str(&collapse_whitespace(&current_line));
        result.push('\n');
    }
    result
}

fn collapse_whitespace(s: &str) -> String {
    let mut result = String::with_capacity(s.len());
    let mut prev_space = false;
    for c in s.chars() {
        if c.is_whitespace() {
            if !prev_space {
                result.push(' ');
            }
            prev_space = true;
        } else {
            prev_space = false;
            result.push(c);
        }
    }
    result.replace("( ", "(").replace(" )", ")")
}

fn skip_block_lines(lines: &mut std::iter::Peekable<std::str::Lines>) {
    let mut depth = 1i32;
    while let Some(line) = lines.next() {
        for c in line.chars() {
            if c == '{' { depth += 1; }
            if c == '}' { depth -= 1; if depth <= 0 { return; } }
        }
    }
}

fn normalize_quotes_str(s: &str) -> String {
    s.replace('\'', "\"")
}

fn normalize_user_css_block(css: &str) -> String {
    let mut out = String::new();
    let mut depth: usize = 0;
    let mut pending_selector = String::new();

    for line in css.lines() {
        let trimmed = line.trim();
        if trimmed.is_empty() {
            continue;
        }

        if trimmed == "}" {
            if depth > 0 { depth -= 1; }
            out.push_str(&"  ".repeat(depth + 1));
            out.push_str("}\n");
            continue;
        }

        if trimmed.ends_with('{') {
            let sel_part = trimmed.trim_end_matches('{').trim();
            let full_selector = if pending_selector.is_empty() {
                sel_part.to_string()
            } else {
                format!("{} {}", pending_selector, sel_part)
            };
            pending_selector.clear();
            out.push_str(&"  ".repeat(depth + 1));
            out.push_str(&full_selector);
            out.push_str(" {\n");
            depth += 1;
            continue;
        }

        if trimmed.ends_with(',') {
            if pending_selector.is_empty() {
                pending_selector = trimmed.to_string();
            } else {
                pending_selector = format!("{} {}", pending_selector, trimmed);
            }
            continue;
        }

        out.push_str(&"  ".repeat(depth + 1));
        out.push_str(trimmed);
        out.push('\n');
    }
    out
}

fn normalize_passthrough(css: &str) -> String {
    let stripped = strip_comments(css);
    let mut out = String::new();
    let mut chars = stripped.chars().peekable();
    let mut depth = 0;

    while chars.peek().is_some() {
        skip_ws(&mut chars);
        if chars.peek().is_none() { break; }

        if depth == 0 {
            let selector = collect_until(&mut chars, '{');
            let sel = collapse_whitespace(selector.trim());
            if sel.is_empty() { continue; }
            out.push_str(&sel);
            out.push_str(" {\n");
            depth += 1;
            chars.next(); // skip '{'
        } else {
            // Inside a block
            let token_start = collect_token(&mut chars, depth);
            let trimmed = token_start.trim().to_string();
            if trimmed.is_empty() { continue; }

            if trimmed == "}" {
                depth -= 1;
                if depth == 0 {
                    out.push_str("}\n");
                } else {
                    out.push_str(&"  ".repeat(depth));
                    out.push_str("}\n");
                }
            } else if trimmed.ends_with('{') {
                // Nested block (e.g., @media)
                let header = trimmed.trim_end_matches('{').trim();
                let header = collapse_whitespace(header);
                out.push_str(&"  ".repeat(depth));
                out.push_str(&header);
                out.push_str(" {\n");
                depth += 1;
            } else if trimmed.ends_with(';') {
                let decl = collapse_whitespace(&trimmed);
                out.push_str(&"  ".repeat(depth));
                out.push_str(&decl);
                out.push('\n');
            } else {
                out.push_str(&"  ".repeat(depth));
                out.push_str(&collapse_whitespace(&trimmed));
                out.push('\n');
            }
        }
    }

    out
}

fn skip_ws(chars: &mut std::iter::Peekable<std::str::Chars>) {
    while let Some(&c) = chars.peek() {
        if c.is_whitespace() { chars.next(); } else { break; }
    }
}

fn collect_until(chars: &mut std::iter::Peekable<std::str::Chars>, stop: char) -> String {
    let mut s = String::new();
    while let Some(&c) = chars.peek() {
        if c == stop { break; }
        s.push(c);
        chars.next();
    }
    s
}

fn collect_token(chars: &mut std::iter::Peekable<std::str::Chars>, _depth: usize) -> String {
    let mut s = String::new();
    skip_ws(chars);
    while let Some(&c) = chars.peek() {
        s.push(c);
        chars.next();
        if c == ';' || c == '}' { break; }
        if c == '{' { break; }
    }
    s
}

fn format_keyframes(kf: &str) -> String {
    if let Some(brace_start) = kf.find('{') {
        let header = kf[..brace_start].trim();
        let inner = kf[brace_start+1..].trim().trim_end_matches('}');
        let mut out = format!("{} {{\n", header);
        let mut pos = 0;
        let bytes = inner.as_bytes();
        while pos < bytes.len() {
            while pos < bytes.len() && bytes[pos].is_ascii_whitespace() {
                pos += 1;
            }
            if pos >= bytes.len() { break; }
            let selector_start = pos;
            while pos < bytes.len() && bytes[pos] != b'{' {
                pos += 1;
            }
            if pos >= bytes.len() { break; }
            let selector = collapse_whitespace(inner[selector_start..pos].trim());
            pos += 1; // skip '{'
            let body_start = pos;
            let mut depth = 1;
            while pos < bytes.len() && depth > 0 {
                if bytes[pos] == b'{' { depth += 1; }
                if bytes[pos] == b'}' { depth -= 1; }
                if depth > 0 { pos += 1; }
            }
            let body = inner[body_start..pos].trim();
            pos += 1; // skip '}'
            out.push_str(&format!("  {} {{\n", selector));
            for decl in body.split(';') {
                let decl = collapse_whitespace(decl.trim());
                if !decl.is_empty() {
                    out.push_str(&format!("    {};\n", decl));
                }
            }
            out.push_str("  }\n");
        }
        out.push('}');
        out
    } else {
        kf.to_string()
    }
}

fn resolve_theme_refs(css: &str) -> String {
    css.replace("--theme(", "var(")
}

fn minify_css(css: &str) -> String {
    use lightningcss::stylesheet::{ParserOptions, PrinterOptions, StyleSheet};

    let result = StyleSheet::parse(css, ParserOptions::default());
    match result {
        Ok(stylesheet) => {
            let printer = PrinterOptions {
                minify: true,
                ..Default::default()
            };
            match stylesheet.to_css(printer) {
                Ok(output) => output.code,
                Err(_) => css.to_string(),
            }
        }
        Err(_) => css.to_string(),
    }
}
