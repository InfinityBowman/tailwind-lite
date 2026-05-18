use crate::theme::Theme;
use rustc_hash::FxHashMap;

#[derive(Clone, Debug)]
pub struct VariantEffect {
    pub selector: Option<String>,
    pub at_rule: Option<String>,
    pub extra_selectors: Vec<String>,
    pub prepend_declarations: Vec<(String, String)>,
}

impl VariantEffect {
    fn simple(selector: Option<String>, at_rule: Option<String>) -> Self {
        Self {
            selector,
            at_rule,
            extra_selectors: vec![],
            prepend_declarations: vec![],
        }
    }
}

pub struct VariantRegistry {
    statics: FxHashMap<String, VariantEffect>,
    breakpoints: Vec<(String, String)>,
    container_widths: Vec<(String, String)>,
}

impl VariantRegistry {
    pub fn container_widths(&self) -> Vec<(String, String)> {
        self.container_widths.clone()
    }

    fn resolve_inner(&self, name: &str) -> Option<VariantEffect> {
        if let Some(v) = self.statics.get(name) {
            return Some(v.clone());
        }
        if name.starts_with('[') && name.ends_with(']') {
            let inner = &name[1..name.len() - 1];
            let selector = inner.replace('_', " ");
            if selector.contains('&') {
                return Some(VariantEffect::simple(Some(selector), None));
            } else {
                return Some(VariantEffect::simple(Some(format!("&:is({})", selector)), None));
            }
        }
        if let Some(rest) = name.strip_prefix("aria-") {
            if rest.starts_with('[') && rest.ends_with(']') {
                let inner = &rest[1..rest.len() - 1];
                let quoted = quote_attribute_value(inner);
                return Some(VariantEffect::simple(Some(format!("&[aria-{}]", quoted)), None));
            } else {
                return Some(VariantEffect::simple(Some(format!("&[aria-{}=\"true\"]", rest)), None));
            }
        }
        if let Some(rest) = name.strip_prefix("data-") {
            if rest.starts_with('[') && rest.ends_with(']') {
                let inner = &rest[1..rest.len() - 1];
                let quoted = quote_attribute_value(inner);
                return Some(VariantEffect::simple(Some(format!("&[data-{}]", quoted)), None));
            } else {
                return Some(VariantEffect::simple(Some(format!("&[data-{}]", rest)), None));
            }
        }
        None
    }

    pub fn resolve(&self, name: &str) -> Option<VariantEffect> {
        if let Some(v) = self.statics.get(name) {
            return Some(v.clone());
        }

        // Compound variants
        if let Some(rest) = name.strip_prefix("group-") {
            return self.resolve_compound("group", rest, None);
        }
        if let Some(rest) = name.strip_prefix("peer-") {
            return self.resolve_compound("peer", rest, None);
        }
        if let Some(rest) = name.strip_prefix("in-") {
            return self.resolve_compound("in", rest, None);
        }
        if let Some(rest) = name.strip_prefix("has-") {
            if let Some(inner) = self.resolve_inner(rest) {
                if let Some(ref sel) = inner.selector {
                    let transformed = sel.replace("&", "*");
                    return Some(VariantEffect::simple(
                        Some(format!("&:has({})", transformed)),
                        inner.at_rule.clone(),
                    ));
                }
            }
            return None;
        }
        if let Some(rest) = name.strip_prefix("not-") {
            if let Some(inner) = self.resolve_inner(rest) {
                if let Some(ref sel) = inner.selector {
                    let transformed = sel.replace("&", "*");
                    let negated_at = inner.at_rule.as_deref().and_then(negate_at_rule);
                    return Some(VariantEffect::simple(
                        Some(format!("&:not({})", transformed)),
                        negated_at,
                    ));
                }
                if let Some(ref at) = inner.at_rule {
                    return Some(VariantEffect::simple(None, negate_at_rule(at)));
                }
            }
            return None;
        }

        // Functional variants: nth-*, nth-last-*, nth-of-type-*, nth-last-of-type-*
        if let Some(rest) = name.strip_prefix("nth-last-of-type-") {
            let val = parse_nth_value(rest)?;
            return Some(VariantEffect::simple(Some(format!("&:nth-last-of-type({})", val)), None));
        }
        if let Some(rest) = name.strip_prefix("nth-last-") {
            let val = parse_nth_value(rest)?;
            return Some(VariantEffect::simple(Some(format!("&:nth-last-child({})", val)), None));
        }
        if let Some(rest) = name.strip_prefix("nth-of-type-") {
            let val = parse_nth_value(rest)?;
            return Some(VariantEffect::simple(Some(format!("&:nth-of-type({})", val)), None));
        }
        if let Some(rest) = name.strip_prefix("nth-") {
            let val = parse_nth_value(rest)?;
            return Some(VariantEffect::simple(Some(format!("&:nth-child({})", val)), None));
        }

        // aria-* / data-*
        if let Some(rest) = name.strip_prefix("aria-") {
            if rest.starts_with('[') && rest.ends_with(']') {
                let inner = &rest[1..rest.len() - 1];
                let quoted = quote_attribute_value(inner);
                return Some(VariantEffect::simple(Some(format!("&[aria-{}]", quoted)), None));
            } else {
                return Some(VariantEffect::simple(Some(format!("&[aria-{}=\"true\"]", rest)), None));
            }
        }
        if let Some(rest) = name.strip_prefix("data-") {
            if rest.starts_with('[') && rest.ends_with(']') {
                let inner = &rest[1..rest.len() - 1];
                let quoted = quote_attribute_value(inner);
                return Some(VariantEffect::simple(Some(format!("&[data-{}]", quoted)), None));
            } else {
                return Some(VariantEffect::simple(Some(format!("&[data-{}]", rest)), None));
            }
        }

        // supports-*
        if let Some(rest) = name.strip_prefix("supports-") {
            let condition = if rest.starts_with('[') && rest.ends_with(']') {
                let inner = &rest[1..rest.len() - 1];
                let decoded = inner.replace('_', " ");
                if decoded.contains('(') || decoded.contains(':') {
                    if decoded.starts_with('(') {
                        decoded
                    } else {
                        format!("({})", decoded)
                    }
                } else {
                    format!("({}: var(--tw))", decoded)
                }
            } else {
                format!("({}: var(--tw))", rest)
            };
            return Some(VariantEffect::simple(None, Some(format!("@supports {}", condition))));
        }

        // min-*/max-* responsive variants
        if let Some(rest) = name.strip_prefix("max-") {
            let value = self.resolve_breakpoint_value(rest)?;
            return Some(VariantEffect::simple(None, Some(format!("@media (width < {})", value))));
        }
        if let Some(rest) = name.strip_prefix("min-") {
            let value = self.resolve_breakpoint_value(rest)?;
            return Some(VariantEffect::simple(None, Some(format!("@media (width >= {})", value))));
        }

        // Container query variants: @sm, @md, @min-lg, @max-sm, @sm/sidebar
        if let Some(rest) = name.strip_prefix('@') {
            return self.resolve_container_variant(rest);
        }

        // Arbitrary variant
        if name.starts_with('[') && name.ends_with(']') {
            let inner = &name[1..name.len() - 1];
            let selector = inner.replace('_', " ");
            if selector.starts_with('@') {
                let at_rule = if let Some(paren_pos) = selector.find('(') {
                    let before = &selector[..paren_pos];
                    if before.ends_with(' ') {
                        selector.clone()
                    } else {
                        format!("{} {}", before, &selector[paren_pos..])
                    }
                } else {
                    selector
                };
                return Some(VariantEffect::simple(None, Some(at_rule)));
            } else if selector.contains('&') {
                return Some(VariantEffect::simple(Some(selector), None));
            } else {
                return Some(VariantEffect::simple(Some(format!("& {}", selector)), None));
            }
        }

        None
    }

    fn resolve_container_variant(&self, rest: &str) -> Option<VariantEffect> {
        // Split modifier: @sm/sidebar -> value_part="sm", modifier="sidebar"
        let (value_part, modifier) = if let Some(slash) = rest.find('/') {
            (&rest[..slash], Some(&rest[slash + 1..]))
        } else {
            (rest, None)
        };

        // @max-sm -> @container (width < value)
        if let Some(inner) = value_part.strip_prefix("max-") {
            let width = self.resolve_container_value(inner)?;
            let condition = match modifier {
                Some(name) => format!("{} (width < {})", name, width),
                None => format!("(width < {})", width),
            };
            return Some(VariantEffect::simple(None, Some(format!("@container {}", condition))));
        }

        // @min-lg -> @container (width >= value)
        if let Some(inner) = value_part.strip_prefix("min-") {
            let width = self.resolve_container_value(inner)?;
            let condition = match modifier {
                Some(name) => format!("{} (width >= {})", name, width),
                None => format!("(width >= {})", width),
            };
            return Some(VariantEffect::simple(None, Some(format!("@container {}", condition))));
        }

        // @sm, @md, etc -> @container (width >= value)
        let width = self.resolve_container_value(value_part)?;
        let condition = match modifier {
            Some(name) => format!("{} (width >= {})", name, width),
            None => format!("(width >= {})", width),
        };
        Some(VariantEffect::simple(None, Some(format!("@container {}", condition))))
    }

    fn resolve_container_value(&self, name: &str) -> Option<String> {
        if name.starts_with('[') && name.ends_with(']') {
            let inner = &name[1..name.len() - 1];
            let value = inner.replace('_', " ");
            if value.contains("var(") { return None; }
            return Some(value);
        }
        for (cname, cvalue) in &self.container_widths {
            if cname == name {
                if cvalue.contains("var(") { return None; }
                return Some(cvalue.clone());
            }
        }
        None
    }

    fn resolve_breakpoint_value(&self, name: &str) -> Option<String> {
        if name.starts_with('[') && name.ends_with(']') {
            let inner = &name[1..name.len() - 1];
            return Some(inner.replace('_', " "));
        }
        for (bp_name, bp_value) in &self.breakpoints {
            if bp_name == name {
                return Some(bp_value.clone());
            }
        }
        None
    }

    fn resolve_compound(&self, kind: &str, sub_variant: &str, modifier: Option<&str>) -> Option<VariantEffect> {
        let inner = self.resolve_inner(sub_variant)?;
        let inner_selector = inner.selector.as_deref()?;

        match kind {
            "group" => {
                let group_class = match modifier {
                    Some(m) => format!(":where(.group\\/{})", m),
                    None => ":where(.group)".into(),
                };
                let transformed = inner_selector.replace("&", &group_class);
                Some(VariantEffect::simple(
                    Some(format!("&:is({} *)", transformed)),
                    inner.at_rule.clone(),
                ))
            }
            "peer" => {
                let peer_class = match modifier {
                    Some(m) => format!(":where(.peer\\/{})", m),
                    None => ":where(.peer)".into(),
                };
                let transformed = inner_selector.replace("&", &peer_class);
                Some(VariantEffect::simple(
                    Some(format!("&:is({} ~ *)", transformed)),
                    inner.at_rule.clone(),
                ))
            }
            "in" => {
                let transformed = inner_selector.replace("&", "*");
                Some(VariantEffect::simple(
                    Some(format!(":where({}) &", transformed)),
                    inner.at_rule.clone(),
                ))
            }
            _ => None,
        }
    }
}

fn parse_nth_value(rest: &str) -> Option<String> {
    if rest.starts_with('[') && rest.ends_with(']') {
        let inner = &rest[1..rest.len() - 1];
        return Some(inner.replace('_', " "));
    }
    if rest.parse::<u32>().is_ok() {
        return Some(rest.to_string());
    }
    None
}

fn negate_at_rule(at_rule: &str) -> Option<String> {
    if let Some(rest) = at_rule.strip_prefix("@media ") {
        if let Some(inner) = rest.strip_prefix("not ") {
            Some(format!("@media {}", inner))
        } else {
            Some(format!("@media not {}", rest))
        }
    } else if let Some(rest) = at_rule.strip_prefix("@supports ") {
        if let Some(inner) = rest.strip_prefix("not ") {
            Some(format!("@supports {}", inner))
        } else {
            Some(format!("@supports not {}", rest))
        }
    } else if let Some(rest) = at_rule.strip_prefix("@container ") {
        let trimmed = rest.trim();
        if trimmed.starts_with('(') {
            // @container (query) -> @container not (query)
            Some(format!("@container not {}", trimmed))
        } else if trimmed.starts_with("not ") {
            // @container not (query) -> @container (query)
            Some(format!("@container {}", trimmed.strip_prefix("not ").unwrap().trim()))
        } else {
            // @container name (query) or @container name not (query)
            if let Some(space_idx) = trimmed.find(' ') {
                let name = &trimmed[..space_idx];
                let after_name = trimmed[space_idx..].trim();
                if after_name.starts_with("not ") {
                    let query = after_name.strip_prefix("not ").unwrap().trim();
                    Some(format!("@container {} {}", name, query))
                } else {
                    Some(format!("@container {} not {}", name, after_name))
                }
            } else {
                Some(format!("@container not {}", trimmed))
            }
        }
    } else {
        None
    }
}

fn quote_attribute_value(input: &str) -> String {
    if let Some(eq_pos) = input.find('=') {
        let attribute = &input[..eq_pos];
        let value = input[eq_pos + 1..].trim();
        if value.starts_with('"') || value.starts_with('\'') {
            return input.to_string();
        }
        if value.len() > 1 {
            let bytes = value.as_bytes();
            let trailing = bytes[bytes.len() - 1];
            if bytes.len() >= 2
                && bytes[bytes.len() - 2] == b' '
                && matches!(trailing, b'i' | b'I' | b's' | b'S')
            {
                let val_part = &value[..value.len() - 2];
                return format!("{}=\"{}\" {}", attribute, val_part, trailing as char);
            }
        }
        format!("{}=\"{}\"", attribute, value)
    } else {
        input.to_string()
    }
}

pub fn create_variants(theme: &Theme) -> VariantRegistry {
    let mut statics = FxHashMap::default();

    macro_rules! v {
        ($name:expr, selector: $sel:expr) => {
            statics.insert($name.into(), VariantEffect::simple(Some($sel.into()), None));
        };
        ($name:expr, at_rule: $at:expr) => {
            statics.insert($name.into(), VariantEffect::simple(None, Some($at.into())));
        };
        ($name:expr, selector: $sel:expr, at_rule: $at:expr) => {
            statics.insert($name.into(), VariantEffect::simple(Some($sel.into()), Some($at.into())));
        };
    }

    // Pseudo-classes
    v!("hover", selector: "&:hover", at_rule: "@media (hover: hover)");
    v!("focus", selector: "&:focus");
    v!("focus-within", selector: "&:focus-within");
    v!("focus-visible", selector: "&:focus-visible");
    v!("active", selector: "&:active");
    v!("visited", selector: "&:visited");
    v!("target", selector: "&:target");
    v!("checked", selector: "&:checked");
    v!("indeterminate", selector: "&:indeterminate");
    v!("default", selector: "&:default");
    v!("required", selector: "&:required");
    v!("optional", selector: "&:optional");
    v!("valid", selector: "&:valid");
    v!("invalid", selector: "&:invalid");
    v!("user-valid", selector: "&:user-valid");
    v!("user-invalid", selector: "&:user-invalid");
    v!("in-range", selector: "&:in-range");
    v!("out-of-range", selector: "&:out-of-range");
    v!("placeholder-shown", selector: "&:placeholder-shown");
    v!("autofill", selector: "&:autofill");
    v!("read-only", selector: "&:read-only");
    v!("disabled", selector: "&:disabled");
    v!("enabled", selector: "&:enabled");
    v!("empty", selector: "&:empty");
    v!("open", selector: "&:is([open], :popover-open, :open)");
    v!("inert", selector: "&:is([inert], [inert] *)");

    // Positional
    v!("first", selector: "&:first-child");
    v!("last", selector: "&:last-child");
    v!("only", selector: "&:only-child");
    v!("odd", selector: "&:nth-child(odd)");
    v!("even", selector: "&:nth-child(even)");
    v!("first-of-type", selector: "&:first-of-type");
    v!("last-of-type", selector: "&:last-of-type");
    v!("only-of-type", selector: "&:only-of-type");

    // Pseudo-elements with content injection
    statics.insert("before".into(), VariantEffect {
        selector: Some("&::before".into()),
        at_rule: None,
        extra_selectors: vec![],
        prepend_declarations: vec![("content".into(), "var(--tw-content)".into())],
    });
    statics.insert("after".into(), VariantEffect {
        selector: Some("&::after".into()),
        at_rule: None,
        extra_selectors: vec![],
        prepend_declarations: vec![("content".into(), "var(--tw-content)".into())],
    });

    v!("placeholder", selector: "&::placeholder");
    v!("details-content", selector: "&::details-content");

    // Marker: multiple selectors (descendant + self + webkit variants)
    statics.insert("marker".into(), VariantEffect {
        selector: Some("& *::marker".into()),
        at_rule: None,
        extra_selectors: vec![
            "&::marker".into(),
            "& *::-webkit-details-marker".into(),
            "&::-webkit-details-marker".into(),
        ],
        prepend_declarations: vec![],
    });

    // Selection: descendant + self
    statics.insert("selection".into(), VariantEffect {
        selector: Some("& *::selection".into()),
        at_rule: None,
        extra_selectors: vec!["&::selection".into()],
        prepend_declarations: vec![],
    });

    v!("first-line", selector: "&::first-line");
    v!("first-letter", selector: "&::first-letter");
    v!("backdrop", selector: "&::backdrop");
    v!("file", selector: "&::file-selector-button");

    // Children — wrapped in :is() per TS
    v!("*", selector: ":is(& > *)");
    v!("**", selector: ":is(& *)");

    // Media queries
    v!("dark", at_rule: "@media (prefers-color-scheme: dark)");
    v!("print", at_rule: "@media print");
    v!("portrait", at_rule: "@media (orientation: portrait)");
    v!("landscape", at_rule: "@media (orientation: landscape)");
    v!("motion-safe", at_rule: "@media (prefers-reduced-motion: no-preference)");
    v!("motion-reduce", at_rule: "@media (prefers-reduced-motion: reduce)");
    v!("contrast-more", at_rule: "@media (prefers-contrast: more)");
    v!("contrast-less", at_rule: "@media (prefers-contrast: less)");
    v!("forced-colors", at_rule: "@media (forced-colors: active)");
    v!("inverted-colors", at_rule: "@media (inverted-colors: inverted)");

    // Pointer
    v!("pointer-none", at_rule: "@media (pointer: none)");
    v!("pointer-coarse", at_rule: "@media (pointer: coarse)");
    v!("pointer-fine", at_rule: "@media (pointer: fine)");
    v!("any-pointer-none", at_rule: "@media (any-pointer: none)");
    v!("any-pointer-coarse", at_rule: "@media (any-pointer: coarse)");
    v!("any-pointer-fine", at_rule: "@media (any-pointer: fine)");

    // Scripting
    v!("noscript", at_rule: "@media (scripting: none)");

    // Starting style
    v!("starting", at_rule: "@starting-style");

    // Direction
    v!("rtl", selector: "&:where(:dir(rtl), [dir=\"rtl\"], [dir=\"rtl\"] *)");
    v!("ltr", selector: "&:where(:dir(ltr), [dir=\"ltr\"], [dir=\"ltr\"] *)");

    // Responsive breakpoints from theme
    let breakpoints = theme.get_breakpoints();
    for (name, value) in &breakpoints {
        statics.insert(name.clone(), VariantEffect::simple(None, Some(format!("@media (width >= {})", value))));
    }

    let container_widths = theme.get_container_widths();

    VariantRegistry { statics, breakpoints, container_widths }
}

/// Register custom variants parsed from @custom-variant directives.
pub fn register_custom_variants(
    registry: &mut VariantRegistry,
    custom_variants: &[crate::input::CustomVariant],
) {
    for cv in custom_variants {
        if let Some(ref selector) = cv.selector {
            // Inline form: @custom-variant name (selector)
            // The selector uses & as placeholder for the element
            registry.statics.insert(
                cv.name.clone(),
                VariantEffect::simple(Some(selector.clone()), None),
            );
        } else if let Some(ref body) = cv.body {
            // Block form: @custom-variant name { &:where(...) { @slot; } }
            // Parse the body to extract the selector(s)
            if let Some(selector) = extract_variant_selector_from_body(body) {
                registry.statics.insert(
                    cv.name.clone(),
                    VariantEffect::simple(Some(selector), None),
                );
            }
        }
    }
}

fn extract_variant_selector_from_body(body: &str) -> Option<String> {
    // Parse block form: contains selectors with { @slot; } inside
    // Collect all selectors (lines containing { or comma-separated before {)
    let mut selectors = Vec::new();
    let mut current = String::new();

    for line in body.lines() {
        let trimmed = line.trim();
        if trimmed == "@slot;" || trimmed == "@slot" || trimmed.is_empty() || trimmed == "}" {
            continue;
        }
        if trimmed.ends_with('{') {
            // This line has a selector
            let sel = trimmed.trim_end_matches('{').trim();
            if !sel.is_empty() {
                // Could be comma-separated: "&:where([data-state=\"open\"]),\n&:where([data-open]...)"
                for part in sel.split(',') {
                    let part = part.trim();
                    if !part.is_empty() {
                        selectors.push(part.to_string());
                    }
                }
            }
        } else if trimmed.ends_with(',') {
            // Continuation of a selector list
            current.push_str(trimmed.trim_end_matches(',').trim());
            selectors.push(current.clone());
            current.clear();
        }
    }

    if selectors.is_empty() {
        return None;
    }

    if selectors.len() == 1 {
        Some(selectors.into_iter().next().unwrap())
    } else {
        Some(selectors.join(", "))
    }
}
