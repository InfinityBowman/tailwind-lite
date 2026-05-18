use std::path::Path;

/// Parsed representation of the input CSS file.
/// Handles @import, @theme, @layer, @utility, @source, @custom-variant, @keyframes.
#[derive(Debug, Clone)]
pub enum PostUtilityBlock {
    UserBase(usize),
    Passthrough(usize),
}

#[derive(Debug, Default)]
pub struct ParsedInput {
    pub has_tailwind_import: bool,
    pub theme_entries: Vec<(String, String, bool)>,
    pub source_paths: Vec<String>,
    pub user_base: Vec<String>,
    pub user_utilities: Vec<String>,
    pub custom_utilities: Vec<CustomUtility>,
    pub custom_variants: Vec<CustomVariant>,
    pub keyframes: Vec<String>,
    pub passthrough: Vec<String>,
    pub post_utility_order: Vec<PostUtilityBlock>,
}

#[derive(Debug)]
pub struct CustomUtility {
    pub name: String,
    pub body: String,
}

#[derive(Debug, Clone)]
pub struct CustomVariant {
    pub name: String,
    pub selector: Option<String>,
    pub body: Option<String>,
}

pub fn parse_input(input: &str) -> ParsedInput {
    let mut result = ParsedInput::default();
    let mut pos = 0;
    let bytes = input.as_bytes();

    while pos < bytes.len() {
        skip_whitespace(bytes, &mut pos);
        if pos >= bytes.len() {
            break;
        }

        // @import 'tailwindcss'
        if input[pos..].starts_with("@import") {
            let line_end = find_semicolon_or_end(input, pos);
            let line = input[pos..line_end].trim();
            if line.contains("tailwindcss") || line.contains("'tailwindcss'") || line.contains("\"tailwindcss\"") {
                result.has_tailwind_import = true;
            } else {
                let idx = result.passthrough.len();
                result.passthrough.push(line.to_string());
                result.post_utility_order.push(PostUtilityBlock::Passthrough(idx));
            }
            pos = if line_end < input.len() { line_end + 1 } else { line_end };
            continue;
        }

        // @source "path"
        if input[pos..].starts_with("@source") {
            let line_end = find_semicolon_or_end(input, pos);
            let line = input[pos..line_end].trim();
            if let Some(path) = extract_quoted_string(line, "@source") {
                result.source_paths.push(path);
            }
            pos = if line_end < input.len() { line_end + 1 } else { line_end };
            continue;
        }

        // @theme inline { ... }
        if input[pos..].starts_with("@theme") {
            let params_start = pos + 6;
            let brace_pos = input[params_start..].find('{').map(|i| params_start + i);
            let is_inline = if let Some(bp) = brace_pos {
                input[params_start..bp].contains("inline")
            } else {
                false
            };
            if let Some((entries, keyframes, end)) = parse_theme_block(input, pos) {
                for (k, v) in entries {
                    result.theme_entries.push((k, v, is_inline));
                }
                for kf in keyframes {
                    result.keyframes.push(kf);
                }
                pos = end;
                continue;
            }
        }

        // @layer base { ... }
        if input[pos..].starts_with("@layer base") {
            if let Some((body, end)) = extract_braced_block(input, pos) {
                let idx = result.user_base.len();
                result.user_base.push(body);
                result.post_utility_order.push(PostUtilityBlock::UserBase(idx));
                pos = end;
                continue;
            }
        }

        // @layer utilities { ... }
        if input[pos..].starts_with("@layer utilities") {
            if let Some((body, end)) = extract_braced_block(input, pos) {
                result.user_utilities.push(body);
                pos = end;
                continue;
            }
        }

        // @custom-variant name (selector); — inline form
        // @custom-variant name { body } — block form
        if input[pos..].starts_with("@custom-variant ") {
            let after_keyword = pos + 16;
            let rest = &input[after_keyword..];
            if let Some(space_or_paren) = rest.find(|c: char| c == '(' || c == '{') {
                let name = rest[..space_or_paren].trim().to_string();
                if rest.as_bytes()[space_or_paren] == b'(' {
                    // Inline form: @custom-variant name (selector);
                    let paren_start = after_keyword + space_or_paren;
                    if let Some(close) = find_matching_paren(input.as_bytes(), paren_start + 1) {
                        let selector = input[paren_start + 1..close].trim().to_string();
                        result.custom_variants.push(CustomVariant {
                            name,
                            selector: Some(selector),
                            body: None,
                        });
                        let line_end = find_semicolon_or_end(input, close);
                        pos = if line_end < input.len() { line_end + 1 } else { line_end };
                        continue;
                    }
                } else {
                    // Block form: @custom-variant name { ... @slot ... }
                    let brace_start = after_keyword + space_or_paren;
                    if let Some((body, end)) = extract_braced_block_from(input, brace_start) {
                        result.custom_variants.push(CustomVariant {
                            name,
                            selector: None,
                            body: Some(body),
                        });
                        pos = end;
                        continue;
                    }
                }
            }
            let line_end = find_semicolon_or_end(input, pos);
            pos = if line_end < input.len() { line_end + 1 } else { line_end };
            continue;
        }

        // @variant — normalize to @custom-variant if top-level with body containing @slot
        if input[pos..].starts_with("@variant ") && !input[pos..].starts_with("@variant dark") {
            // Check for block form
            let after_keyword = pos + 9;
            let rest = &input[after_keyword..];
            if let Some(brace_idx) = rest.find('{') {
                let name = rest[..brace_idx].trim().to_string();
                let brace_start = after_keyword + brace_idx;
                if let Some((body, end)) = extract_braced_block_from(input, brace_start) {
                    let idx = result.passthrough.len();
                    result.passthrough.push(format!("@variant {} {{{}}}", name, body));
                    result.post_utility_order.push(PostUtilityBlock::Passthrough(idx));
                    pos = end;
                    continue;
                }
            }
            let line_end = find_semicolon_or_end(input, pos);
            pos = if line_end < input.len() { line_end + 1 } else { line_end };
            continue;
        }

        // @utility name { ... }
        if input[pos..].starts_with("@utility ") {
            let after_keyword = pos + 9;
            let name_end = input[after_keyword..].find('{').map(|i| after_keyword + i);
            if let Some(ne) = name_end {
                let name = input[after_keyword..ne].trim().to_string();
                if let Some((body, end)) = extract_braced_block_from(input, ne) {
                    result.custom_utilities.push(CustomUtility { name, body });
                    pos = end;
                    continue;
                }
            }
        }

        // @plugin — skip (not supported)
        if input[pos..].starts_with("@plugin") {
            let line_end = find_semicolon_or_end(input, pos);
            pos = if line_end < input.len() { line_end + 1 } else { line_end };
            continue;
        }

        // @keyframes — store in both keyframes (for var scanning) and passthrough (for ordered output)
        if input[pos..].starts_with("@keyframes ") {
            if let Some(brace_start) = input[pos..].find('{') {
                let name_part = input[pos..pos + brace_start].trim();
                if let Some((kf_body, kf_end)) = extract_braced_block_from(input, pos + brace_start) {
                    let kf_str = format!("{} {{{}}}", name_part, kf_body);
                    result.keyframes.push(kf_str.clone());
                    let idx = result.passthrough.len();
                    result.passthrough.push(kf_str);
                    result.post_utility_order.push(PostUtilityBlock::Passthrough(idx));
                    pos = kf_end;
                    continue;
                }
            }
        }

        // Passthrough: collect until next @ directive or end
        let block_end = find_next_directive_or_end(input, pos);
        let block = input[pos..block_end].trim();
        if !block.is_empty() {
            let idx = result.passthrough.len();
            result.passthrough.push(block.to_string());
            result.post_utility_order.push(PostUtilityBlock::Passthrough(idx));
        }
        pos = block_end;
    }

    result
}

fn skip_whitespace(bytes: &[u8], pos: &mut usize) {
    while *pos < bytes.len() && (bytes[*pos] == b' ' || bytes[*pos] == b'\n' || bytes[*pos] == b'\r' || bytes[*pos] == b'\t') {
        *pos += 1;
    }
    // Skip CSS comments
    while *pos + 1 < bytes.len() && bytes[*pos] == b'/' && bytes[*pos + 1] == b'*' {
        if let Some(end) = find_comment_end(bytes, *pos) {
            *pos = end;
        } else {
            *pos = bytes.len();
        }
        while *pos < bytes.len() && (bytes[*pos] == b' ' || bytes[*pos] == b'\n' || bytes[*pos] == b'\r' || bytes[*pos] == b'\t') {
            *pos += 1;
        }
    }
}

fn find_comment_end(bytes: &[u8], start: usize) -> Option<usize> {
    let mut i = start + 2;
    while i + 1 < bytes.len() {
        if bytes[i] == b'*' && bytes[i + 1] == b'/' {
            return Some(i + 2);
        }
        i += 1;
    }
    None
}

fn find_semicolon_or_end(input: &str, start: usize) -> usize {
    input[start..].find(';').map(|i| start + i).unwrap_or(input.len())
}

fn find_next_directive_or_end(input: &str, start: usize) -> usize {
    let search = &input[start..];
    // Find next line starting with @
    for (i, _) in search.char_indices().skip(1) {
        if search.as_bytes()[i] == b'@' {
            // Check it's at start of line or after whitespace
            if i == 0 || search.as_bytes()[i - 1] == b'\n' {
                return start + i;
            }
        }
    }
    input.len()
}

fn extract_quoted_string(line: &str, prefix: &str) -> Option<String> {
    let after = line.strip_prefix(prefix)?.trim();
    if (after.starts_with('"') && after.ends_with('"')) || (after.starts_with('\'') && after.ends_with('\'')) {
        Some(after[1..after.len() - 1].to_string())
    } else {
        None
    }
}

fn parse_theme_block(input: &str, start: usize) -> Option<(Vec<(String, String)>, Vec<String>, usize)> {
    let (body, end) = extract_braced_block(input, start)?;
    let mut entries = Vec::new();
    let mut keyframes = Vec::new();

    let mut pos = 0;
    let body_bytes = body.as_bytes();
    while pos < body_bytes.len() {
        // Skip whitespace
        while pos < body_bytes.len() && body_bytes[pos].is_ascii_whitespace() {
            pos += 1;
        }
        if pos >= body_bytes.len() {
            break;
        }

        // Skip comments
        if pos + 1 < body_bytes.len() && body_bytes[pos] == b'/' && body_bytes[pos + 1] == b'*' {
            if let Some(end) = find_comment_end(body_bytes, pos) {
                pos = end;
                continue;
            }
        }

        // @keyframes block
        if body[pos..].starts_with("@keyframes") {
            if let Some(brace_start) = body[pos..].find('{') {
                let name_part = body[pos..pos + brace_start].trim();
                if let Some((kf_body, kf_end)) = extract_braced_block_from(&body, pos + brace_start) {
                    keyframes.push(format!("{} {{{}}}", name_part, kf_body));
                    pos = kf_end;
                    continue;
                }
            }
            pos += 1;
            continue;
        }

        // CSS declaration: --key: value;
        let line_end = body[pos..].find(';').map(|i| pos + i).unwrap_or(body.len());
        let line = body[pos..line_end].trim();
        if !line.is_empty() {
            if let Some(colon_pos) = line.find(':') {
                let key = line[..colon_pos].trim();
                let value = line[colon_pos + 1..].trim();
                if key.starts_with("--") {
                    entries.push((key.to_string(), value.to_string()));
                }
            }
        }
        pos = if line_end < body.len() { line_end + 1 } else { line_end };
    }

    Some((entries, keyframes, end))
}

fn extract_braced_block(input: &str, start: usize) -> Option<(String, usize)> {
    let open = input[start..].find('{').map(|i| start + i)?;
    extract_braced_block_from(input, open)
}

fn extract_braced_block_from(input: &str, open_brace: usize) -> Option<(String, usize)> {
    let mut depth = 0;
    let bytes = input.as_bytes();
    let mut i = open_brace;

    while i < bytes.len() {
        match bytes[i] {
            b'{' => depth += 1,
            b'}' => {
                depth -= 1;
                if depth == 0 {
                    let body = &input[open_brace + 1..i];
                    return Some((body.to_string(), i + 1));
                }
            }
            _ => {}
        }
        i += 1;
    }
    None
}

fn find_matching_paren(bytes: &[u8], start: usize) -> Option<usize> {
    let mut depth = 1;
    let mut i = start;
    while i < bytes.len() {
        match bytes[i] {
            b'(' => depth += 1,
            b')' => {
                depth -= 1;
                if depth == 0 {
                    return Some(i);
                }
            }
            _ => {}
        }
        i += 1;
    }
    None
}

/// Resolve @import directives by loading referenced CSS files.
/// Follows the TS at-import.ts pattern: recursively resolves imports up to depth 100.
pub fn resolve_imports(input: &str, base_dir: &Path, depth: usize) -> String {
    if depth > 100 {
        return input.to_string();
    }

    let mut result = String::with_capacity(input.len());
    let mut pos = 0;

    while pos < input.len() {
        if input[pos..].starts_with("@import") {
            let line_end = find_semicolon_or_end(input, pos);
            let line = input[pos..line_end].trim();

            // Extract the path from @import "path" or @import 'path'
            if let Some(path) = extract_import_path(line) {
                // Skip tailwindcss and remote URLs
                if path == "tailwindcss"
                    || path.starts_with("http://")
                    || path.starts_with("https://")
                    || path.starts_with("data:")
                {
                    result.push_str(line);
                    result.push(';');
                    result.push('\n');
                } else {
                    // Extract optional layer() modifier
                    let layer = extract_layer_modifier(line);

                    let file_path = base_dir.join(&path);
                    if let Ok(contents) = std::fs::read_to_string(&file_path) {
                        let import_dir = file_path
                            .parent()
                            .unwrap_or(base_dir)
                            .to_path_buf();
                        let resolved = resolve_imports(&contents, &import_dir, depth + 1);

                        if let Some(layer_name) = layer {
                            result.push_str(&format!("@layer {} {{\n{}\n}}\n", layer_name, resolved));
                        } else {
                            result.push_str(&resolved);
                            result.push('\n');
                        }
                    } else {
                        // File not found — pass through as-is
                        result.push_str(line);
                        result.push(';');
                        result.push('\n');
                    }
                }
            } else {
                result.push_str(line);
                result.push(';');
                result.push('\n');
            }
            pos = if line_end < input.len() { line_end + 1 } else { line_end };
        } else {
            // Copy non-import content
            let next_import = input[pos..].find("@import");
            let chunk_end = next_import.map(|i| pos + i).unwrap_or(input.len());
            result.push_str(&input[pos..chunk_end]);
            pos = chunk_end;
        }
    }

    result
}

fn extract_import_path(line: &str) -> Option<String> {
    let after = line.strip_prefix("@import")?.trim();
    // Handle @import "path" or @import 'path'
    let (quote_char, start) = if after.starts_with('"') {
        ('"', 1)
    } else if after.starts_with('\'') {
        ('\'', 1)
    } else {
        return None;
    };

    let rest = &after[start..];
    let end = rest.find(quote_char)?;
    Some(rest[..end].to_string())
}

fn extract_layer_modifier(line: &str) -> Option<String> {
    // Match @import "path" layer(name)
    if let Some(idx) = line.find("layer(") {
        let start = idx + 6;
        let rest = &line[start..];
        let end = rest.find(')')?;
        Some(rest[..end].trim().to_string())
    } else {
        None
    }
}
