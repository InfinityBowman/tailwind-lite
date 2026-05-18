use rustc_hash::FxHashMap;
use std::cell::Cell;

struct ThemeValue {
    value: String,
    inline: bool,
    user_defined: bool,
    used: Cell<bool>,
}

pub struct Theme {
    values: FxHashMap<String, ThemeValue>,
    insertion_order: Vec<String>,
}

impl Theme {
    pub fn new() -> Self {
        Self {
            values: FxHashMap::default(),
            insertion_order: Vec::new(),
        }
    }

    fn insert(&mut self, key: String, value: String, inline: bool, user_defined: bool) {
        if !self.values.contains_key(&key) {
            self.insertion_order.push(key.clone());
        }
        self.values.insert(key, ThemeValue { value, inline, user_defined, used: Cell::new(false) });
    }

    pub fn load_defaults(&mut self) {
        let theme_css = include_str!("css/theme.css");
        let mut current_key: Option<String> = None;
        let mut current_val = String::new();

        for line in theme_css.lines() {
            let trimmed = line.trim();

            if trimmed.starts_with("--") {
                if let Some(colon) = trimmed.find(':') {
                    if let Some(key) = current_key.take() {
                        let val = current_val.trim().trim_end_matches(';').trim().to_string();
                        let resolved = resolve_theme_ref(&val);
                        self.insert(key, resolved, false, false);
                    }
                    current_key = Some(trimmed[..colon].trim().to_string());
                    current_val = trimmed[colon + 1..].trim().to_string();
                    if current_val.ends_with(';') {
                        let key = current_key.take().unwrap();
                        let val = current_val.trim_end_matches(';').trim().to_string();
                        let resolved = resolve_theme_ref(&val);
                        self.insert(key, resolved, false, false);
                        current_val.clear();
                    }
                    continue;
                }
            }

            if current_key.is_some() {
                current_val.push(' ');
                current_val.push_str(trimmed);
                if trimmed.ends_with(';') {
                    let key = current_key.take().unwrap();
                    let val = current_val.trim().trim_end_matches(';').trim().to_string();
                    let resolved = resolve_theme_ref(&val);
                    self.insert(key, resolved, false, false);
                    current_val.clear();
                }
            }
        }

        if let Some(key) = current_key {
            let val = current_val.trim().trim_end_matches(';').trim().to_string();
            let resolved = resolve_theme_ref(&val);
            self.insert(key, resolved, false, false);
        }

        // Mark built-in inline defaults (@theme default inline reference)
        for key in &["--blur", "--shadow", "--shadow-inner", "--drop-shadow", "--radius", "--max-width-prose"] {
            if let Some(tv) = self.values.get_mut(*key) {
                tv.inline = true;
            }
        }
    }

    pub fn set(&mut self, key: &str, value: &str, inline: bool) {
        self.insert(key.to_string(), value.to_string(), inline, true);
    }

    pub fn resolve(&self, value: &str, namespace_prefixes: &[&str]) -> Option<String> {
        for prefix in namespace_prefixes {
            let key = format!("{}-{}", prefix, value);
            if let Some(v) = self.values.get(&key) {
                return Some(v.value.clone());
            }
        }
        let direct_key = if value.starts_with("--") {
            value.to_string()
        } else {
            format!("--{}", value)
        };
        self.values.get(&direct_key).map(|v| v.value.clone())
    }

    pub fn resolve_with_key(&self, key: &str) -> Option<String> {
        self.values.get(key).map(|v| v.value.clone())
    }

    pub fn mark_used(&self, key: &str) {
        if let Some(tv) = self.values.get(key) {
            tv.used.set(true);
        }
    }

    /// Resolve for utility output: returns the actual value if inline, var() if not.
    /// Ports TS theme.resolve() with INLINE flag check. Marks the variable as used.
    pub fn resolve_for_utility(&self, key: &str) -> Option<String> {
        let v = self.values.get(key)?;
        v.used.set(true);
        if v.inline {
            Some(v.value.clone())
        } else {
            Some(format!("var({})", key))
        }
    }

    fn resolve_inline_refs(&self, value: &str) -> String {
        let mut result = value.to_string();
        for (key, tv) in &self.values {
            if !tv.inline { continue; }
            let var_ref = format!("var({})", key);
            if result.contains(&var_ref) {
                result = result.replace(&var_ref, &tv.value);
            }
        }
        result
    }

    /// Substitute inline theme variables in the final CSS output.
    /// Replaces var(--key) with the actual value for inline theme entries.
    pub fn substitute_inline_vars(&self, css: &str) -> String {
        let mut result = css.to_string();
        for (key, tv) in &self.values {
            if !tv.inline {
                continue;
            }
            let var_ref = format!("var({})", key);
            if result.contains(&var_ref) {
                result = result.replace(&var_ref, &tv.value);
            }
        }
        result
    }

    pub fn has_key(&self, key: &str) -> bool {
        self.values.contains_key(key)
    }

    pub fn is_user_defined(&self, key: &str) -> bool {
        self.values.get(key).map_or(false, |v| v.user_defined)
    }

    pub fn is_inline(&self, key: &str) -> bool {
        self.values.get(key).map_or(false, |v| v.inline)
    }

    pub fn get_inline_referenced_vars(&self) -> rustc_hash::FxHashSet<String> {
        let mut vars = rustc_hash::FxHashSet::default();
        for (_key, tv) in &self.values {
            if tv.inline && tv.user_defined {
                let mut pos = 0;
                while let Some(idx) = tv.value[pos..].find("var(--") {
                    let start = pos + idx + 4;
                    let end = tv.value[start..].find(|c: char| c == ')' || c == ',').map_or(tv.value.len(), |i| start + i);
                    let inner = tv.value[start..end].trim();
                    if inner.starts_with("--") {
                        vars.insert(inner.to_string());
                    }
                    pos = end;
                }
            }
        }
        vars
    }

    pub fn get_spacing_multiplier(&self) -> Option<String> {
        self.values.get("--spacing").map(|v| v.value.clone())
    }

    pub fn get_breakpoints(&self) -> Vec<(String, String)> {
        let mut breakpoints = Vec::new();
        for (k, v) in &self.values {
            if k.starts_with("--breakpoint-") {
                let name = k.strip_prefix("--breakpoint-").unwrap().to_string();
                breakpoints.push((name, v.value.clone()));
            }
        }
        breakpoints.sort_by(|a, b| a.0.cmp(&b.0));
        breakpoints
    }

    pub fn get_container_widths(&self) -> Vec<(String, String)> {
        let mut widths = Vec::new();
        for (k, v) in &self.values {
            if k.starts_with("--container-") {
                let name = k.strip_prefix("--container-").unwrap().to_string();
                widths.push((name, v.value.clone()));
            }
        }
        widths.sort_by(|a, b| a.0.cmp(&b.0));
        widths
    }

    pub fn generate_css_variables(&self) -> String {
        let mut vars: Vec<(&String, &ThemeValue)> = self.values.iter().collect();
        vars.sort_by_key(|(k, _)| (*k).clone());

        let mut out = String::new();
        for (key, tv) in &vars {
            if tv.value.contains("--theme(") {
                continue;
            }
            if key.starts_with("--default-") || key.starts_with("--animate-") {
                continue;
            }
            out.push_str(&format!("  {}: {};\n", key, tv.value));
        }
        out
    }

    pub fn generate_used_css_variables(&self, used_vars: &rustc_hash::FxHashSet<String>, user_css_vars: &rustc_hash::FxHashSet<String>) -> String {
        let mut expanded = used_vars.clone();
        let mut changed = true;
        while changed {
            changed = false;
            let current: Vec<String> = expanded.iter().cloned().collect();
            for var_name in &current {
                if let Some(tv) = self.values.get(var_name) {
                    if tv.inline && tv.user_defined {
                        continue;
                    }
                    let mut pos = 0;
                    while let Some(idx) = tv.value[pos..].find("var(--") {
                        let start = pos + idx + 4;
                        let end = tv.value[start..].find(|c: char| c == ')' || c == ',').map_or(tv.value.len(), |i| start + i);
                        let inner = tv.value[start..end].trim();
                        if inner.starts_with("--") && expanded.insert(inner.to_string()) {
                            changed = true;
                        }
                        pos = end;
                    }
                }
            }
        }

        let mut out = String::new();
        for key in &self.insertion_order {
            if let Some(tv) = self.values.get(key) {
                if tv.user_defined {
                    if tv.inline {
                        if !user_css_vars.contains(key.as_str()) { continue; }
                    } else if !tv.used.get() {
                        continue;
                    }
                } else {
                    if !expanded.contains(key.as_str()) { continue; }
                }
                let resolved = self.resolve_inline_refs(&tv.value);
                let normalized = if tv.user_defined || resolved != tv.value {
                    resolved.clone()
                } else {
                    resolved.replace('\'', "\"")
                };
                if key.starts_with("--font-") && !key.contains("weight") && normalized.contains('"') {
                    // Break after the second-to-last quoted item on first line
                    // to match official Tailwind output formatting
                    let items: Vec<&str> = normalized.split(", ").collect();
                    let mut first_line = String::new();
                    let mut second_line = String::new();
                    let mut past_break = false;
                    let target_len = 80;
                    for (i, item) in items.iter().enumerate() {
                        let candidate = if first_line.is_empty() {
                            item.to_string()
                        } else {
                            format!("{}, {}", first_line, item)
                        };
                        if !past_break && format!("    {}: {},", key, candidate).len() <= target_len + 10 {
                            first_line = candidate;
                        } else {
                            past_break = true;
                            if second_line.is_empty() {
                                second_line = item.to_string();
                            } else {
                                second_line = format!("{}, {}", second_line, item);
                            }
                        }
                        let _ = i;
                    }
                    if second_line.is_empty() {
                        out.push_str(&format!("    {}: {};\n", key, first_line));
                    } else {
                        out.push_str(&format!("    {}: {},\n      {};\n", key, first_line, second_line));
                    }
                } else {
                    out.push_str(&format!("    {}: {};\n", key, normalized));
                }
            }
        }
        out
    }
}

fn resolve_theme_ref(val: &str) -> String {
    if let Some(start) = val.find("--theme(") {
        let inner_start = start + 8;
        let mut depth = 1;
        let mut end = inner_start;
        for (i, c) in val[inner_start..].char_indices() {
            match c {
                '(' => depth += 1,
                ')' => { depth -= 1; if depth == 0 { end = inner_start + i; break; } }
                _ => {}
            }
        }
        let inner = &val[inner_start..end];
        // Split on first comma to get the var name and remove fallback if it's "initial"
        let parts: Vec<&str> = inner.splitn(2, ',').collect();
        let var_name = parts[0].trim();
        let fallback = parts.get(1).map(|s| s.trim());

        let var_expr = if fallback == Some("initial") || fallback.is_none() {
            format!("var({})", var_name)
        } else {
            format!("var({}, {})", var_name, fallback.unwrap())
        };

        format!("{}{}{}", &val[..start], var_expr, &val[end+1..])
    } else {
        val.to_string()
    }
}
