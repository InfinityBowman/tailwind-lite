/// CSS function substitution — ports css-functions.ts
/// Handles --spacing(), theme(), and --alpha() in CSS values.

use crate::theme::Theme;

pub fn substitute_functions(css: &str, spacing_multiplier: Option<&str>, theme: &Theme) -> String {
    let mut result = css.to_string();
    if let Some(multiplier) = spacing_multiplier {
        result = substitute_spacing(&result, multiplier);
    }
    result = substitute_theme(&result, theme);
    result
}

fn substitute_theme(css: &str, theme: &Theme) -> String {
    let mut result = String::with_capacity(css.len());
    let mut pos = 0;
    let bytes = css.as_bytes();

    while pos < bytes.len() {
        if let Some(idx) = css[pos..].find("theme(") {
            let fn_start = pos + idx;
            if fn_start > 0 && bytes[fn_start - 1] == b'-' {
                result.push_str(&css[pos..fn_start + 6]);
                pos = fn_start + 6;
                continue;
            }
            result.push_str(&css[pos..fn_start]);

            let args_start = fn_start + 6;
            if let Some(close) = find_matching_paren(bytes, args_start) {
                let arg = css[args_start..close].trim();
                if let Some(resolved) = resolve_theme_path(arg, theme) {
                    result.push_str(&resolved);
                } else {
                    result.push_str(&css[fn_start..=close]);
                }
                pos = close + 1;
            } else {
                result.push_str(&css[fn_start..fn_start + 6]);
                pos = args_start;
            }
        } else {
            result.push_str(&css[pos..]);
            break;
        }
    }

    result
}

pub fn resolve_theme_path(path: &str, theme: &Theme) -> Option<String> {
    let parts: Vec<&str> = path.split('.').collect();
    if parts.is_empty() {
        return None;
    }

    let namespace = match parts[0] {
        "colors" => "color",
        "screens" => "breakpoint",
        "fontFamily" => "font",
        "fontSize" => "text",
        "fontWeight" => "font-weight",
        "lineHeight" => "leading",
        "letterSpacing" => "tracking",
        "borderRadius" => "radius",
        "boxShadow" => "shadow",
        "spacing" => "spacing",
        other => other,
    };

    let key = if parts.len() == 1 {
        format!("--{}", namespace)
    } else {
        format!("--{}-{}", namespace, parts[1..].join("-"))
    };

    theme.resolve_with_key(&key)
}

fn substitute_spacing(css: &str, multiplier: &str) -> String {
    let mut result = String::with_capacity(css.len());
    let mut pos = 0;
    let bytes = css.as_bytes();

    while pos < bytes.len() {
        if let Some(idx) = css[pos..].find("--spacing(") {
            let fn_start = pos + idx;
            result.push_str(&css[pos..fn_start]);

            let args_start = fn_start + 10; // len of "--spacing("
            if let Some(close) = find_matching_paren(bytes, args_start) {
                let arg = css[args_start..close].trim();
                if !arg.is_empty() {
                    result.push_str(&format!("calc({} * {})", multiplier, arg));
                } else {
                    result.push_str(&css[fn_start..=close]);
                }
                pos = close + 1;
            } else {
                result.push_str(&css[fn_start..fn_start + 10]);
                pos = args_start;
            }
        } else {
            result.push_str(&css[pos..]);
            break;
        }
    }

    result
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

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_spacing_simple() {
        assert_eq!(
            substitute_spacing("calc(--spacing(8))", "0.25rem"),
            "calc(calc(0.25rem * 8))"
        );
    }

    #[test]
    fn test_spacing_fractional() {
        assert_eq!(
            substitute_spacing("calc(--spacing(5.5))", "0.25rem"),
            "calc(calc(0.25rem * 5.5))"
        );
    }

    #[test]
    fn test_spacing_arithmetic() {
        assert_eq!(
            substitute_spacing("calc(--spacing(72)---spacing(9))", "0.25rem"),
            "calc(calc(0.25rem * 72)--calc(0.25rem * 9))"
        );
    }

    #[test]
    fn test_spacing_with_var() {
        assert_eq!(
            substitute_spacing("min(calc(--spacing(72)---spacing(9)),calc(var(--available-height)---spacing(9)))", "0.25rem"),
            "min(calc(calc(0.25rem * 72)--calc(0.25rem * 9)),calc(var(--available-height)--calc(0.25rem * 9)))"
        );
    }

    #[test]
    fn test_no_spacing() {
        assert_eq!(
            substitute_spacing("var(--spacing) * 4", "0.25rem"),
            "var(--spacing) * 4"
        );
    }
}
