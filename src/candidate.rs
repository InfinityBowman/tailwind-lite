/// Parsed candidate representation — port of candidate.ts

#[derive(Debug, Clone)]
pub enum CandidateValue {
    Named { value: String, fraction: Option<String> },
    Arbitrary { value: String, data_type: Option<String> },
}

#[derive(Debug, Clone)]
pub enum CandidateModifier {
    Named(String),
    Arbitrary(String),
}

#[derive(Debug, Clone)]
pub enum Candidate {
    Static {
        root: String,
        variants: Vec<String>,
        important: bool,
        raw: String,
    },
    Functional {
        root: String,
        value: Option<CandidateValue>,
        modifier: Option<CandidateModifier>,
        variants: Vec<String>,
        important: bool,
        negative: bool,
        raw: String,
    },
    Arbitrary {
        property: String,
        value: String,
        modifier: Option<CandidateModifier>,
        variants: Vec<String>,
        important: bool,
        raw: String,
    },
}

impl Candidate {
    pub fn raw(&self) -> &str {
        match self {
            Candidate::Static { raw, .. } => raw,
            Candidate::Functional { raw, .. } => raw,
            Candidate::Arbitrary { raw, .. } => raw,
        }
    }

    pub fn variants(&self) -> &[String] {
        match self {
            Candidate::Static { variants, .. } => variants,
            Candidate::Functional { variants, .. } => variants,
            Candidate::Arbitrary { variants, .. } => variants,
        }
    }

    pub fn is_important(&self) -> bool {
        match self {
            Candidate::Static { important, .. } => *important,
            Candidate::Functional { important, .. } => *important,
            Candidate::Arbitrary { important, .. } => *important,
        }
    }
}

pub fn parse_candidate(input: &str, known_utilities: &dyn Fn(&str) -> bool, is_static: &dyn Fn(&str) -> bool) -> Option<Candidate> {
    let parts = segment_by_colon(input);
    if parts.is_empty() {
        return None;
    }

    let variant_parts = &parts[..parts.len() - 1];
    let mut base = parts.last().unwrap().to_string();

    let variants: Vec<String> = variant_parts.iter().rev().map(|s| s.to_string()).collect();

    // Handle important modifier
    let mut important = false;
    if base.ends_with('!') {
        important = true;
        base = base[..base.len() - 1].to_string();
    } else if base.starts_with('!') {
        important = true;
        base = base[1..].to_string();
    }

    if base.is_empty() {
        return None;
    }

    // Split base from modifier (the / separator)
    let (base_without_modifier, modifier_segment) = split_modifier(&base);

    let parsed_modifier = modifier_segment.and_then(|m| parse_modifier(m));

    // Arbitrary properties: [property:value]
    if base_without_modifier.starts_with('[') && base_without_modifier.ends_with(']') {
        let inner = &base_without_modifier[1..base_without_modifier.len() - 1];
        if let Some(colon) = inner.find(':') {
            if colon > 0 && colon < inner.len() - 1 {
                let property = inner[..colon].to_string();
                let value = decode_arbitrary(&inner[colon + 1..]);
                return Some(Candidate::Arbitrary {
                    property,
                    value,
                    modifier: parsed_modifier,
                    variants,
                    important,
                    raw: input.to_string(),
                });
            }
        }
        return None;
    }

    // Check for negative prefix
    let (effective_base, negative) = if base_without_modifier.starts_with('-') {
        (&base_without_modifier[1..], true)
    } else {
        (base_without_modifier, false)
    };

    // Check for exact static match (only if registered as a static utility, not just functional)
    if !negative && is_static(effective_base) && !effective_base.contains('[') && modifier_segment.is_none() {
        return Some(Candidate::Static {
            root: effective_base.to_string(),
            variants,
            important,
            raw: input.to_string(),
        });
    }
    // Check for negative static (e.g., -top-px registered directly as a static)
    if negative && is_static(base_without_modifier) && !base_without_modifier.contains('[') && modifier_segment.is_none() {
        return Some(Candidate::Static {
            root: base_without_modifier.to_string(),
            variants,
            important,
            raw: input.to_string(),
        });
    }

    // Try to find the utility root by peeling off value segments
    // E.g. bg-red-500 -> try "bg-red-500", "bg-red", "bg"
    let roots = find_roots(effective_base, known_utilities);

    for (root, value_str) in roots {
        let value = if let Some(v) = value_str {
            // Arbitrary value in brackets
            if v.ends_with(']') {
                if let Some(bracket_start) = v.find('[') {
                    let arb = decode_arbitrary(&v[bracket_start + 1..v.len() - 1]);
                    if arb.is_empty() {
                        continue;
                    }
                    // Check for data type hint
                    let (data_type, arb_value) = extract_data_type(&arb);
                    Some(CandidateValue::Arbitrary {
                        value: arb_value,
                        data_type,
                    })
                } else {
                    continue;
                }
            }
            // CSS variable shorthand: bg-(--my-var)
            else if v.starts_with("(") && v.ends_with(")") {
                let inner = &v[1..v.len() - 1];
                if inner.starts_with("--") {
                    Some(CandidateValue::Arbitrary {
                        value: format!("var({})", inner),
                        data_type: None,
                    })
                } else {
                    continue;
                }
            } else {
                // Named value — check for fraction
                let fraction = if modifier_segment.is_some() && !v.contains('[') {
                    modifier_segment.map(|m| format!("{}/{}", v, m))
                } else {
                    None
                };
                Some(CandidateValue::Named {
                    value: v.to_string(),
                    fraction,
                })
            }
        } else {
            None
        };

        return Some(Candidate::Functional {
            root: if negative { format!("-{}", root) } else { root.to_string() },
            value,
            modifier: parsed_modifier.clone(),
            variants,
            important,
            negative,
            raw: input.to_string(),
        });
    }

    // Also try as a static utility with the full base (for things like "inline-flex")
    if !negative && known_utilities(effective_base) && modifier_segment.is_none() {
        return Some(Candidate::Static {
            root: effective_base.to_string(),
            variants,
            important,
            raw: input.to_string(),
        });
    }

    None
}

fn find_roots<'a>(input: &'a str, known: &dyn Fn(&str) -> bool) -> Vec<(&'a str, Option<&'a str>)> {
    let mut results = Vec::new();

    // Exact match with no value
    if known(input) {
        results.push((input, None));
    }

    // Arbitrary value: root-[value]
    if input.ends_with(']') {
        if let Some(idx) = input.find("-[") {
            let root = &input[..idx];
            if known(root) {
                let value = &input[idx + 1..];
                results.push((root, Some(value)));
                return results;
            }
        }
    }

    // CSS variable shorthand: root-(--var)
    if input.ends_with(')') {
        if let Some(idx) = input.find("-(") {
            let root = &input[..idx];
            if known(root) {
                let value = &input[idx + 1..];
                results.push((root, Some(value)));
                return results;
            }
        }
    }

    // Walk backwards through dashes
    let mut idx = input.len();
    while let Some(dash) = input[..idx].rfind('-') {
        if dash == 0 {
            break;
        }
        let root = &input[..dash];
        if known(root) {
            let value = &input[dash + 1..];
            if !value.is_empty() {
                results.push((root, Some(value)));
            }
        }
        idx = dash;
    }

    results
}

fn split_modifier(base: &str) -> (&str, Option<&str>) {
    // Don't split inside brackets or parens
    let mut depth = 0;
    let bytes = base.as_bytes();

    for (i, &b) in bytes.iter().enumerate().rev() {
        match b {
            b']' | b')' => depth += 1,
            b'[' | b'(' => depth -= 1,
            b'/' if depth == 0 => {
                return (&base[..i], Some(&base[i + 1..]));
            }
            _ => {}
        }
    }

    (base, None)
}

fn parse_modifier(m: &str) -> Option<CandidateModifier> {
    if m.is_empty() {
        return None;
    }
    if m.starts_with('[') && m.ends_with(']') {
        let inner = decode_arbitrary(&m[1..m.len() - 1]);
        if inner.is_empty() {
            return None;
        }
        return Some(CandidateModifier::Arbitrary(inner));
    }
    if m.starts_with('(') && m.ends_with(')') {
        let inner = &m[1..m.len() - 1];
        if inner.starts_with("--") {
            return Some(CandidateModifier::Arbitrary(format!("var({})", inner)));
        }
        return None;
    }
    Some(CandidateModifier::Named(m.to_string()))
}

fn decode_arbitrary(value: &str) -> String {
    let mut output = String::with_capacity(value.len());
    let mut chars = value.chars().peekable();
    while let Some(c) = chars.next() {
        if c == '\\' && chars.peek() == Some(&'_') {
            output.push('_');
            chars.next();
        } else if c == '_' {
            output.push(' ');
        } else {
            output.push(c);
        }
    }
    add_whitespace_around_math_operators(&output)
}

fn add_whitespace_around_math_operators(input: &str) -> String {
    let bytes = input.as_bytes();
    let len = bytes.len();
    let mut result = String::with_capacity(len + 16);
    let mut depth = 0i32;
    let mut i = 0;
    while i < len {
        if !bytes[i].is_ascii() {
            let ch_len = utf8_char_len(bytes[i]);
            result.push_str(&input[i..i + ch_len]);
            i += ch_len;
            continue;
        }
        match bytes[i] {
            b'(' => { depth += 1; result.push('('); i += 1; }
            b')' => { depth -= 1; result.push(')'); i += 1; }
            op @ (b'+' | b'*') if depth > 0 => {
                let before = if !result.is_empty() { result.as_bytes()[result.len() - 1] } else { b' ' };
                if before != b' ' && before != b'(' { result.push(' '); }
                result.push(op as char);
                if i + 1 < len && bytes[i + 1] != b' ' { result.push(' '); }
                i += 1;
            }
            b'-' if depth > 0 => {
                let before = if !result.is_empty() { result.as_bytes()[result.len() - 1] } else { b' ' };
                let after = if i + 1 < len { bytes[i + 1] } else { b' ' };
                let is_identifier_dash = matches!(before, b'a'..=b'z' | b'A'..=b'Z' | b'-' | b'_')
                    && matches!(after, b'a'..=b'z' | b'A'..=b'Z' | b'-' | b'_');
                if is_identifier_dash || before == b' ' || before == b'(' {
                    result.push('-');
                    i += 1;
                } else {
                    result.push(' ');
                    result.push('-');
                    if i + 1 < len && bytes[i + 1] != b' ' { result.push(' '); }
                    i += 1;
                }
            }
            _ => { result.push(bytes[i] as char); i += 1; }
        }
    }
    result
}

fn utf8_char_len(first_byte: u8) -> usize {
    if first_byte & 0x80 == 0 { 1 }
    else if first_byte & 0xE0 == 0xC0 { 2 }
    else if first_byte & 0xF0 == 0xE0 { 3 }
    else { 4 }
}

fn extract_data_type(value: &str) -> (Option<String>, String) {
    for (i, b) in value.bytes().enumerate() {
        if b == b':' {
            let prefix = &value[..i];
            if prefix.bytes().all(|b| matches!(b, b'a'..=b'z' | b'-')) && !prefix.is_empty() {
                return (Some(prefix.to_string()), value[i + 1..].to_string());
            }
            break;
        }
        if !matches!(b, b'a'..=b'z' | b'-') {
            break;
        }
    }
    (None, value.to_string())
}

fn segment_by_colon(input: &str) -> Vec<&str> {
    let mut parts = Vec::new();
    let mut start = 0;
    let mut depth_bracket = 0;
    let mut depth_paren = 0;
    let bytes = input.as_bytes();

    for (i, &b) in bytes.iter().enumerate() {
        match b {
            b'[' => depth_bracket += 1,
            b']' => depth_bracket -= 1,
            b'(' => depth_paren += 1,
            b')' => depth_paren -= 1,
            b':' if depth_bracket == 0 && depth_paren == 0 => {
                parts.push(&input[start..i]);
                start = i + 1;
            }
            _ => {}
        }
    }
    parts.push(&input[start..]);
    parts
}
