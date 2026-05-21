use crate::candidate::{parse_candidate, Candidate};
use crate::input::ParsedInput;
use crate::theme::Theme;
use crate::utilities::{CssProperty, UtilityRegistry};
use crate::variants::VariantRegistry;
use rustc_hash::FxHashSet;

pub struct CompiledRule {
    pub selector: String,
    pub declarations: Vec<(String, String)>,
    pub at_rules: Vec<String>,
    pub important: bool,
    pub nested_rule: Option<NestedRule>,
    pub nested_at_rules: Vec<NestedAtRule>,
    pub variant_nesting: Vec<VariantNest>,
    pub property_order: Vec<usize>,
    pub property_count: usize,
    pub variant_order: u128,
    pub raw_candidate: String,
    pub raw_body: Option<String>,
    pub properties: Vec<CssProperty>,
}

pub struct NestedRule {
    pub selector: String,
    pub declarations: Vec<(String, String)>,
}

pub struct NestedAtRule {
    pub at_rule: String,
    pub declarations: Vec<(String, String)>,
}

pub struct VariantNest {
    pub selector: Option<String>,
    pub at_rule: Option<String>,
    pub extra_selectors: Vec<String>,
    pub prepend_declarations: Vec<(String, String)>,
}

pub fn compile(
    candidates: &[String],
    utilities: &UtilityRegistry,
    variants: &VariantRegistry,
    theme: &Theme,
    parsed: &ParsedInput,
) -> Vec<CompiledRule> {
    let mut rules = Vec::new();
    let mut seen = FxHashSet::default();

    let custom_names: FxHashSet<String> = parsed
        .custom_utilities
        .iter()
        .flat_map(|u| {
            let escaped = u.name.clone();
            let unescaped = escaped.replace('\\', "");
            if unescaped == escaped {
                vec![escaped]
            } else {
                vec![escaped, unescaped]
            }
        })
        .collect();

    let custom_variant_names: Vec<String> = parsed.custom_variants.iter().map(|cv| cv.name.clone()).collect();
    let variant_order_map = build_variant_order_map(candidates, utilities, &custom_names, &custom_variant_names, variants);

    let known = |name: &str| utilities.is_known(name) || custom_names.contains(name);
    let is_static = |name: &str| utilities.is_static(name) || custom_names.contains(name);

    for raw in candidates {
        if !seen.insert(raw.clone()) {
            continue;
        }

        let candidate = match parse_candidate(raw, &known, &is_static) {
            Some(c) => c,
            None => continue,
        };

        let mut custom_raw_body: Option<String> = None;
        let util_output = utilities.compile_with_properties(&candidate, theme).or_else(|| {
            match &candidate {
                Candidate::Static { root, .. } | Candidate::Functional { root, .. } => {
                    parsed.custom_utilities.iter().find(|u| u.name == *root || u.name.replace('\\', "") == *root).map(|u| {
                        if u.body.contains('{') {
                            custom_raw_body = Some(u.body.clone());
                        }
                        crate::utilities::UtilityOutput {
                            declarations: parse_declaration_block(&u.body),
                            properties: vec![],
                        }
                    })
                }
                _ => None,
            }
        });

        let util_output = match util_output {
            Some(o) if !o.declarations.is_empty() => o,
            Some(o) if custom_raw_body.is_some() => o,
            _ => continue,
        };
        let css_properties = util_output.properties;
        let decls = util_output.declarations;

        let decls = apply_color_mix_polyfill(decls, theme);

        let escaped = escape_selector(candidate.raw());
        let mut selector = format!(".{}", escaped);
        let mut at_rules = Vec::new();
        let mut nested_rule = None;

        if let Candidate::Functional { root, .. } = &candidate {
            let base = root.trim_start_matches('-');
            if matches!(base, "space-x" | "space-y") {
                let axis = if base == "space-y" { "block" } else { "inline" };
                let reverse_var = format!("--tw-space-{}-reverse", if base == "space-y" { "y" } else { "x" });
                let sort_val = if base == "space-x" { "row-gap" } else { "column-gap" };
                let val = decls.iter().find(|(p, _)| p == "__space_value__").map(|(_, v)| v.as_str()).unwrap_or("");
                nested_rule = Some(NestedRule {
                    selector: ":where(& > :not(:last-child))".into(),
                    declarations: vec![
                        ("--tw-sort".into(), sort_val.into()),
                        (reverse_var.clone(), "0".into()),
                        (format!("margin-{}-start", axis), format!("calc({} * var({}))", val, reverse_var)),
                        (format!("margin-{}-end", axis), format!("calc({} * calc(1 - var({})))", val, reverse_var)),
                    ],
                });
            } else if base == "placeholder" {
                let color = decls.iter().find(|(p, _)| p == "__placeholder_color__").map(|(_, v)| v.clone()).unwrap_or_default();
                nested_rule = Some(NestedRule {
                    selector: "&::placeholder".into(),
                    declarations: vec![
                        ("--tw-sort".into(), "placeholder-color".into()),
                        ("color".into(), color),
                    ],
                });
            } else if matches!(base, "divide-x" | "divide-y" | "divide") {
                nested_rule = Some(NestedRule {
                    selector: ":where(& > :not(:last-child))".into(),
                    declarations: decls.clone(),
                });
            }
        }

        // Divide style statics also need nested rules
        if let Candidate::Static { root, .. } = &candidate {
            if root.starts_with("divide-") {
                if matches!(root.as_str(), "divide-solid" | "divide-dashed" | "divide-dotted" | "divide-double"
                    | "divide-x-reverse" | "divide-y-reverse" | "divide-none") {
                    nested_rule = Some(NestedRule {
                        selector: ":where(& > :not(:last-child))".into(),
                        declarations: decls.clone(),
                    });
                }
            }
            if matches!(root.as_str(), "space-x-reverse" | "space-y-reverse") {
                nested_rule = Some(NestedRule {
                    selector: ":where(& > :not(:last-child))".into(),
                    declarations: decls.clone(),
                });
            }
        }

        let mut nested_at_rules = Vec::new();
        if let Candidate::Static { root, .. } = &candidate {
            if root == "container" {
                let mut bps = theme.get_breakpoints();
                bps.sort_by(|a, b| {
                    parse_rem_value(&a.1).partial_cmp(&parse_rem_value(&b.1)).unwrap_or(std::cmp::Ordering::Equal)
                });
                for (_name, value) in &bps {
                    nested_at_rules.push(NestedAtRule {
                        at_rule: format!("@media (width >= {})", value),
                        declarations: vec![("max-width".into(), value.clone())],
                    });
                }
            }
        }

        let mut variant_nesting = Vec::new();
        let mut variant_order: u128 = 0;
        let mut variant_failed = false;

        for variant_name in candidate.variants() {
            if let Some(effect) = variants.resolve(variant_name) {
                let vord = variant_order_map.get(variant_name)
                    .copied()
                    .unwrap_or(127);
                variant_order |= 1u128 << vord;
                variant_nesting.push(VariantNest {
                    selector: effect.selector.clone(),
                    at_rule: effect.at_rule.clone(),
                    extra_selectors: effect.extra_selectors.clone(),
                    prepend_declarations: effect.prepend_declarations.clone(),
                });
            } else {
                variant_failed = true;
                break;
            }
        }

        if variant_failed {
            continue;
        }

        variant_nesting.reverse();

        let sort_decls = if let Some(ref nested) = nested_rule {
            &nested.declarations
        } else {
            &decls
        };
        let mut prop_sort = get_property_sort(sort_decls);
        if let Some(ref body) = custom_raw_body {
            prop_sort.1 += count_css_declarations(body);
        }

        rules.push(CompiledRule {
            selector,
            declarations: if nested_rule.is_some() { vec![] } else { decls },
            at_rules,
            important: candidate.is_important(),
            nested_rule,
            nested_at_rules,
            variant_nesting,
            property_order: prop_sort.0,
            property_count: prop_sort.1,
            variant_order,
            raw_candidate: raw.clone(),
            raw_body: custom_raw_body,
            properties: css_properties,
        });
    }

    rules.sort_by(|a, b| {
        if a.variant_order != b.variant_order {
            return a.variant_order.cmp(&b.variant_order);
        }
        let mut offset = 0;
        while offset < a.property_order.len()
            && offset < b.property_order.len()
            && a.property_order[offset] == b.property_order[offset]
        {
            offset += 1;
        }
        let a_val = a.property_order.get(offset).copied().unwrap_or(usize::MAX);
        let b_val = b.property_order.get(offset).copied().unwrap_or(usize::MAX);
        a_val.cmp(&b_val)
            .then(b.property_count.cmp(&a.property_count))
            .then(natural_compare(&a.raw_candidate, &b.raw_candidate))
    });

    rules
}

const PROPERTY_ORDER: &[&str] = &[
    // 0-14: position & inset
    "container-type",
    "pointer-events", "visibility", "position",
    "inset", "inset-inline", "inset-block",
    "inset-inline-start", "inset-inline-end", "inset-block-start", "inset-block-end",
    "top", "right", "bottom", "left",
    // 15-25: isolation through clear
    "isolation", "z-index", "order",
    "grid-column", "grid-column-start", "grid-column-end",
    "grid-row", "grid-row-start", "grid-row-end",
    "float", "clear",
    // 26: container sort sentinel
    "--tw-container-component",
    // 27-37: margin
    "margin", "margin-inline", "margin-block",
    "margin-inline-start", "margin-inline-end", "margin-block-start", "margin-block-end",
    "margin-top", "margin-right", "margin-bottom", "margin-left",
    // 38-47: box/display/sizing
    "box-sizing", "display",
    "field-sizing", "aspect-ratio",
    "height", "max-height", "min-height",
    "width", "max-width", "min-width",
    // 48-55: flex/table
    "flex", "flex-shrink", "flex-grow", "flex-basis",
    "table-layout", "caption-side", "border-collapse", "border-spacing",
    // 56-72: transform
    "transform-origin",
    "translate", "--tw-translate-x", "--tw-translate-y", "--tw-translate-z",
    "scale", "--tw-scale-x", "--tw-scale-y", "--tw-scale-z",
    "rotate", "--tw-rotate-x", "--tw-rotate-y", "--tw-rotate-z",
    "--tw-skew-x", "--tw-skew-y", "transform",
    "zoom",
    // 73-78: animation/cursor/touch
    "animation", "cursor",
    "touch-action", "--tw-pan-x", "--tw-pan-y", "--tw-pinch-zoom",
    // 79-108: resize/scroll
    "resize",
    "scroll-snap-type", "--tw-scroll-snap-strictness", "scroll-snap-align", "scroll-snap-stop",
    "scroll-margin", "scroll-margin-inline", "scroll-margin-block",
    "scroll-margin-inline-start", "scroll-margin-inline-end",
    "scroll-margin-block-start", "scroll-margin-block-end",
    "scroll-margin-top", "scroll-margin-right", "scroll-margin-bottom", "scroll-margin-left",
    "scroll-padding", "scroll-padding-inline", "scroll-padding-block",
    "scroll-padding-inline-start", "scroll-padding-inline-end",
    "scroll-padding-block-start", "scroll-padding-block-end",
    "scroll-padding-top", "scroll-padding-right", "scroll-padding-bottom", "scroll-padding-left",
    "scrollbar-width", "scrollbar-color", "scrollbar-gutter",
    // 109-116: list/appearance/columns/break
    "list-style-position", "list-style-type", "list-style-image",
    "appearance",
    "columns", "break-before", "break-inside", "break-after",
    // 117-132: grid/flex layout
    "grid-auto-columns", "grid-auto-flow", "grid-auto-rows",
    "grid-template-columns", "grid-template-rows",
    "flex-direction", "flex-wrap",
    "place-content", "place-items", "align-content", "align-items",
    "justify-content", "justify-items",
    "gap", "column-gap", "row-gap",
    // 133-139: space/divide sentinels
    "--tw-space-x-reverse", "--tw-space-y-reverse",
    "divide-x-width", "divide-y-width", "--tw-divide-y-reverse",
    "divide-style", "divide-color",
    // 140-149: self/overflow/overscroll/scroll-behavior
    "place-self", "align-self", "justify-self",
    "overflow", "overflow-x", "overflow-y",
    "overscroll-behavior", "overscroll-behavior-x", "overscroll-behavior-y",
    "scroll-behavior",
    // 150-164: border-radius
    "border-radius",
    "border-start-radius", "border-end-radius",
    "border-top-radius", "border-right-radius", "border-bottom-radius", "border-left-radius",
    "border-start-start-radius", "border-start-end-radius",
    "border-end-end-radius", "border-end-start-radius",
    "border-top-left-radius", "border-top-right-radius",
    "border-bottom-right-radius", "border-bottom-left-radius",
    // 165-197: border width/style/color
    "border-width", "border-inline-width", "border-block-width",
    "border-inline-start-width", "border-inline-end-width",
    "border-block-start-width", "border-block-end-width",
    "border-top-width", "border-right-width", "border-bottom-width", "border-left-width",
    "border-style", "border-inline-style", "border-block-style",
    "border-inline-start-style", "border-inline-end-style",
    "border-block-start-style", "border-block-end-style",
    "border-top-style", "border-right-style", "border-bottom-style", "border-left-style",
    "border-color", "border-inline-color", "border-block-color",
    "border-inline-start-color", "border-inline-end-color",
    "border-block-start-color", "border-block-end-color",
    "border-top-color", "border-right-color", "border-bottom-color", "border-left-color",
    // 198-208: background/gradient
    "background-color",
    "background-image",
    "--tw-gradient-position", "--tw-gradient-stops", "--tw-gradient-via-stops",
    "--tw-gradient-from", "--tw-gradient-from-position",
    "--tw-gradient-via", "--tw-gradient-via-position",
    "--tw-gradient-to", "--tw-gradient-to-position",
    // 209-249: mask
    "mask-image",
    "--tw-mask-top", "--tw-mask-top-from-color", "--tw-mask-top-from-position",
    "--tw-mask-top-to-color", "--tw-mask-top-to-position",
    "--tw-mask-right", "--tw-mask-right-from-color", "--tw-mask-right-from-position",
    "--tw-mask-right-to-color", "--tw-mask-right-to-position",
    "--tw-mask-bottom", "--tw-mask-bottom-from-color", "--tw-mask-bottom-from-position",
    "--tw-mask-bottom-to-color", "--tw-mask-bottom-to-position",
    "--tw-mask-left", "--tw-mask-left-from-color", "--tw-mask-left-from-position",
    "--tw-mask-left-to-color", "--tw-mask-left-to-position",
    "--tw-mask-linear", "--tw-mask-linear-position",
    "--tw-mask-linear-from-color", "--tw-mask-linear-from-position",
    "--tw-mask-linear-to-color", "--tw-mask-linear-to-position",
    "--tw-mask-radial", "--tw-mask-radial-shape", "--tw-mask-radial-size", "--tw-mask-radial-position",
    "--tw-mask-radial-from-color", "--tw-mask-radial-from-position",
    "--tw-mask-radial-to-color", "--tw-mask-radial-to-position",
    "--tw-mask-conic", "--tw-mask-conic-position",
    "--tw-mask-conic-from-color", "--tw-mask-conic-from-position",
    "--tw-mask-conic-to-color", "--tw-mask-conic-to-position",
    // 250-265: box-decoration, bg misc, mask misc, fill/stroke, object
    "box-decoration-break",
    "background-size", "background-attachment", "background-clip",
    "background-position", "background-repeat", "background-origin",
    "mask-composite", "mask-mode", "mask-type",
    "mask-size", "mask-clip", "mask-position", "mask-repeat", "mask-origin",
    "fill", "stroke", "stroke-width",
    "object-fit", "object-position",
    // 270-280: padding
    "padding", "padding-inline", "padding-block",
    "padding-inline-start", "padding-inline-end", "padding-block-start", "padding-block-end",
    "padding-top", "padding-right", "padding-bottom", "padding-left",
    // 281-296: text/font
    "text-align", "text-indent", "vertical-align",
    "font-family", "font-feature-settings", "font-size", "line-height",
    "font-weight", "letter-spacing",
    "text-wrap", "overflow-wrap", "word-break", "text-overflow",
    "hyphens", "white-space", "tab-size",
    // 297-311: color/font-style/decoration
    "color", "text-transform", "font-style", "font-stretch",
    "font-variant-numeric",
    "text-decoration-line", "text-decoration-color", "text-decoration-style",
    "text-decoration-thickness", "text-underline-offset",
    "-webkit-font-smoothing",
    "placeholder-color", "caret-color", "accent-color",
    "color-scheme", "opacity",
    // 313-325: blend/shadow/ring
    "background-blend-mode", "mix-blend-mode",
    "box-shadow",
    "--tw-shadow", "--tw-shadow-color",
    "--tw-ring-shadow", "--tw-ring-color",
    "--tw-inset-shadow", "--tw-inset-shadow-color",
    "--tw-inset-ring-shadow", "--tw-inset-ring-color",
    "--tw-ring-offset-width", "--tw-ring-offset-color",
    // 326-329: outline
    "outline", "outline-width", "outline-offset", "outline-color",
    // 330-339: filter
    "--tw-blur", "--tw-brightness", "--tw-contrast", "--tw-drop-shadow",
    "--tw-grayscale", "--tw-hue-rotate", "--tw-invert", "--tw-saturate", "--tw-sepia",
    "filter",
    // 340-349: backdrop-filter
    "--tw-backdrop-blur", "--tw-backdrop-brightness", "--tw-backdrop-contrast",
    "--tw-backdrop-grayscale", "--tw-backdrop-hue-rotate", "--tw-backdrop-invert",
    "--tw-backdrop-opacity", "--tw-backdrop-saturate", "--tw-backdrop-sepia",
    "backdrop-filter",
    // 350-358: transition/misc
    "transition-property", "transition-behavior",
    "transition-delay", "transition-duration", "transition-timing-function",
    "will-change", "contain", "content", "forced-color-adjust",
];

fn get_property_sort_with_hint(hint: &str) -> (Vec<usize>, usize) {
    if let Some(idx) = PROPERTY_ORDER.iter().position(|&p| p == hint) {
        (vec![idx], 1)
    } else {
        (vec![], 1)
    }
}

pub fn get_property_sort(decls: &[(String, String)]) -> (Vec<usize>, usize) {
    let mut indices = Vec::new();
    let mut count = 0;
    let mut seen_tw_sort = false;

    for (prop, val) in decls {
        if val.is_empty() {
            continue;
        }
        if prop.starts_with("@supports:") || prop == "__supports_color_mix__" || prop == "__placeholder_color__" {
            continue;
        }
        if prop.starts_with("@supports-gradient:") {
            count += 1;
            continue;
        }
        count += 1;

        if seen_tw_sort {
            continue;
        }

        if prop == "--tw-sort" {
            if let Some(idx) = PROPERTY_ORDER.iter().position(|&p| p == val.as_str()) {
                indices.clear();
                indices.push(idx);
                seen_tw_sort = true;
            }
            continue;
        }

        if let Some(idx) = PROPERTY_ORDER.iter().position(|&p| p == prop.as_str()) {
            if !indices.contains(&idx) {
                indices.push(idx);
            }
        }
    }
    indices.sort();
    (indices, count)
}

fn build_variant_order_map(
    candidates: &[String],
    utilities: &UtilityRegistry,
    custom_utility_names: &FxHashSet<String>,
    custom_variant_names: &[String],
    variants: &VariantRegistry,
) -> rustc_hash::FxHashMap<String, u32> {
    use crate::candidate::parse_candidate;

    let known = |name: &str| utilities.is_known(name) || custom_utility_names.contains(name);
    let is_static = |name: &str| utilities.is_static(name) || custom_utility_names.contains(name);

    let mut all_variants: FxHashSet<String> = FxHashSet::default();
    for raw in candidates {
        if let Some(candidate) = parse_candidate(raw, &known, &is_static) {
            for v in candidate.variants() {
                if variants.resolve(v).is_some() {
                    all_variants.insert(v.to_string());
                }
            }
        }
    }

    let container_widths = variants.container_widths();
    let mut variant_list: Vec<String> = all_variants.into_iter().collect();
    variant_list.sort_by(|a, b| variant_compare(a, b, custom_variant_names, &container_widths));

    let mut map = rustc_hash::FxHashMap::default();
    let mut index: u32 = 0;
    for (i, v) in variant_list.iter().enumerate() {
        if i > 0 && variant_compare(&variant_list[i-1], v, custom_variant_names, &container_widths) != std::cmp::Ordering::Equal {
            index += 1;
        }
        map.insert(v.clone(), index);
    }
    map
}

fn variant_compare(a: &str, b: &str, custom_variant_names: &[String], container_widths: &[(String, String)]) -> std::cmp::Ordering {
    let a_group = variant_group_order(a, custom_variant_names);
    let b_group = variant_group_order(b, custom_variant_names);
    if a_group != b_group {
        return a_group.cmp(&b_group);
    }
    // Same group — for compound variants (not-*, group-*, peer-*, in-*, has-*)
    // sort by the inner variant's order, matching TS compare() behavior
    for prefix in &["not-", "group-", "peer-", "in-", "has-"] {
        if let (Some(a_inner), Some(b_inner)) = (a.strip_prefix(prefix), b.strip_prefix(prefix)) {
            let a_inner_ord = variant_sort_order(a_inner);
            let b_inner_ord = variant_sort_order(b_inner);
            if a_inner_ord != b_inner_ord {
                return a_inner_ord.cmp(&b_inner_ord);
            }
            return a_inner.cmp(b_inner);
        }
    }
    // Container query variants: sort by resolved width value
    // Variants with the same resolved width get the same order (Equal),
    // so they share a bit position — tiebreaking is done by property/candidate sort.
    if let (Some(a_rest), Some(b_rest)) = (a.strip_prefix('@'), b.strip_prefix('@')) {
        let a_is_max = a_rest.starts_with("max-");
        let b_is_max = b_rest.starts_with("max-");
        if a_is_max && b_is_max {
            let a_val = resolve_container_width(a_rest.strip_prefix("max-").unwrap(), container_widths);
            let b_val = resolve_container_width(b_rest.strip_prefix("max-").unwrap(), container_widths);
            return compare_breakpoint_values(&a_val, &b_val, true);
        }
        if !a_is_max && !b_is_max {
            let a_name = a_rest.strip_prefix("min-").unwrap_or(a_rest);
            let b_name = b_rest.strip_prefix("min-").unwrap_or(b_rest);
            let a_name = a_name.split('/').next().unwrap_or(a_name);
            let b_name = b_name.split('/').next().unwrap_or(b_name);
            let a_val = resolve_container_width(a_name, container_widths);
            let b_val = resolve_container_width(b_name, container_widths);
            return compare_breakpoint_values(&a_val, &b_val, false);
        }
    }
    // For functional variants like aria-*, data-*: non-bracket args sort before bracket args
    for prefix in &["aria-", "data-"] {
        if let (Some(a_rest), Some(b_rest)) = (a.strip_prefix(prefix), b.strip_prefix(prefix)) {
            let a_is_bracket = a_rest.starts_with('[');
            let b_is_bracket = b_rest.starts_with('[');
            if a_is_bracket != b_is_bracket {
                return if a_is_bracket { std::cmp::Ordering::Greater } else { std::cmp::Ordering::Less };
            }
            return a_rest.cmp(b_rest);
        }
    }

    // For nth-* variants: sort named values (odd, even) before bracket values, then numerically
    for prefix in &["nth-last-of-type-", "nth-of-type-", "nth-last-", "nth-"] {
        if let (Some(a_rest), Some(b_rest)) = (a.strip_prefix(prefix), b.strip_prefix(prefix)) {
            let a_is_bracket = a_rest.starts_with('[');
            let b_is_bracket = b_rest.starts_with('[');
            if a_is_bracket != b_is_bracket {
                return if a_is_bracket { std::cmp::Ordering::Greater } else { std::cmp::Ordering::Less };
            }
            return a_rest.cmp(b_rest);
        }
    }

    // Responsive breakpoint variants: sort by width ascending
    let a_is_bp = is_responsive_breakpoint(a);
    let b_is_bp = is_responsive_breakpoint(b);
    if a_is_bp && b_is_bp {
        let a_is_max = a.starts_with("max-");
        let b_is_max = b.starts_with("max-");
        if a_is_max && b_is_max {
            let a_val = breakpoint_rem_value(a.strip_prefix("max-").unwrap());
            let b_val = breakpoint_rem_value(b.strip_prefix("max-").unwrap());
            return b_val.partial_cmp(&a_val).unwrap_or(std::cmp::Ordering::Equal);
        }
        if !a_is_max && !b_is_max {
            let a_name = a.strip_prefix("min-").unwrap_or(a);
            let b_name = b.strip_prefix("min-").unwrap_or(b);
            let a_val = breakpoint_rem_value(a_name);
            let b_val = breakpoint_rem_value(b_name);
            return a_val.partial_cmp(&b_val).unwrap_or(std::cmp::Ordering::Equal);
        }
    }
    // For arbitrary variants, compare decoded (underscores as spaces) to match TS ordering
    if a.starts_with('[') && b.starts_with('[') {
        let a_decoded = a.replace('_', " ");
        let b_decoded = b.replace('_', " ");
        return a_decoded.cmp(&b_decoded);
    }
    a.cmp(b)
}

fn is_responsive_breakpoint(name: &str) -> bool {
    matches!(name, "sm" | "md" | "lg" | "xl" | "2xl")
        || name.starts_with("min-")
        || name.starts_with("max-")
}

fn breakpoint_rem_value(name: &str) -> f64 {
    match name {
        "sm" => 40.0,
        "md" => 48.0,
        "lg" => 64.0,
        "xl" => 80.0,
        "2xl" => 96.0,
        _ => {
            if name.starts_with('[') && name.ends_with(']') {
                let inner = &name[1..name.len() - 1];
                parse_rem_value(inner)
            } else {
                0.0
            }
        }
    }
}

fn variant_group_order(name: &str, custom_variant_names: &[String]) -> u32 {
    // Check custom variants first — they get positions after all built-ins
    if let Some(idx) = custom_variant_names.iter().position(|n| n == name) {
        return 1000 + idx as u32;
    }
    variant_sort_order(name)
}

fn count_css_declarations(css: &str) -> usize {
    let mut count = 0;
    let mut depth = 0;
    for line in css.lines() {
        let trimmed = line.trim();
        for ch in trimmed.chars() {
            match ch {
                '{' => depth += 1,
                '}' => depth -= 1,
                _ => {}
            }
        }
        if trimmed.contains(':') && !trimmed.starts_with('@') && !trimmed.starts_with("//") {
            count += 1;
        }
    }
    count
}

fn variant_sort_order(name: &str) -> u32 {
    match name {
        "*" => 1,
        "**" => 2,
        "first-letter" => 6,
        "first-line" => 7,
        "marker" => 8,
        "selection" => 9,
        "file" => 10,
        "placeholder" => 11,
        "backdrop" => 12,
        "details-content" => 13,
        "before" => 14,
        "after" => 15,
        "first" => 16,
        "last" => 17,
        "only" => 18,
        "odd" => 19,
        "even" => 20,
        "first-of-type" => 21,
        "last-of-type" => 22,
        "only-of-type" => 23,
        "visited" => 24,
        "target" => 25,
        "open" => 26,
        "default" => 27,
        "checked" => 28,
        "indeterminate" => 29,
        "placeholder-shown" => 30,
        "autofill" => 31,
        "optional" => 32,
        "required" => 33,
        "valid" => 34,
        "invalid" => 35,
        "user-valid" => 36,
        "user-invalid" => 37,
        "in-range" => 38,
        "out-of-range" => 39,
        "read-only" => 40,
        "empty" => 41,
        "focus-within" => 42,
        "hover" => 43,
        "focus" => 44,
        "focus-visible" => 45,
        "active" => 46,
        "enabled" => 47,
        "disabled" => 48,
        "inert" => 49,
        "motion-safe" => 59,
        "motion-reduce" => 60,
        "contrast-more" => 61,
        "contrast-less" => 62,
        "sm" => 64,
        "md" => 64,
        "lg" => 64,
        "xl" => 64,
        "2xl" => 64,
        "portrait" => 67,
        "landscape" => 68,
        "ltr" => 69,
        "rtl" => 70,
        "dark" => 71,
        "starting" => 72,
        "print" => 73,
        "forced-colors" => 74,
        "inverted-colors" => 75,
        "pointer-none" => 76,
        "pointer-coarse" => 77,
        "pointer-fine" => 78,
        "any-pointer-none" => 79,
        "any-pointer-coarse" => 80,
        "any-pointer-fine" => 81,
        "noscript" => 82,
        _ => {
            if name.starts_with("not-") { return 3; }
            if name.starts_with("group-") { return 4; }
            if name.starts_with("peer-") { return 5; }
            if name.starts_with("in-") { return 50; }
            if name.starts_with("has-") { return 51; }
            if name.starts_with("aria-") { return 52; }
            if name.starts_with("data-") { return 53; }
            if name.starts_with("nth-last-of-type-") { return 57; }
            if name.starts_with("nth-of-type-") { return 56; }
            if name.starts_with("nth-last-") { return 55; }
            if name.starts_with("nth-") { return 54; }
            if name.starts_with("supports-") { return 58; }
            if name.starts_with("max-") { return 63; }
            if name.starts_with("min-") { return 63; }
            if name.starts_with("@max-") { return 65; }
            if name.starts_with("@min-") || name.starts_with('@') { return 66; }
            if name.starts_with('[') { return 83; }
            0
        }
    }
}

fn resolve_container_width(name: &str, container_widths: &[(String, String)]) -> Option<String> {
    if name.starts_with('[') && name.ends_with(']') {
        return Some(name[1..name.len() - 1].replace('_', " "));
    }
    for (cname, cvalue) in container_widths {
        if cname == name {
            return Some(cvalue.clone());
        }
    }
    None
}

fn compare_breakpoint_values(a: &Option<String>, b: &Option<String>, descending: bool) -> std::cmp::Ordering {
    match (a, b) {
        (None, None) => std::cmp::Ordering::Equal,
        (None, Some(_)) => if descending { std::cmp::Ordering::Greater } else { std::cmp::Ordering::Less },
        (Some(_), None) => if descending { std::cmp::Ordering::Less } else { std::cmp::Ordering::Greater },
        (Some(av), Some(bv)) => {
            let a_num = parse_rem_value(av);
            let b_num = parse_rem_value(bv);
            if descending {
                b_num.partial_cmp(&a_num).unwrap_or(std::cmp::Ordering::Equal)
            } else {
                a_num.partial_cmp(&b_num).unwrap_or(std::cmp::Ordering::Equal)
            }
        }
    }
}

fn natural_compare(a: &str, b: &str) -> std::cmp::Ordering {
    let a = a.as_bytes();
    let b = b.as_bytes();
    let mut ai = 0;
    let mut bi = 0;
    while ai < a.len() && bi < b.len() {
        if a[ai].is_ascii_digit() && b[bi].is_ascii_digit() {
            let a_start = ai;
            while ai < a.len() && a[ai].is_ascii_digit() { ai += 1; }
            let b_start = bi;
            while bi < b.len() && b[bi].is_ascii_digit() { bi += 1; }
            let a_num: u64 = std::str::from_utf8(&a[a_start..ai]).unwrap().parse().unwrap_or(0);
            let b_num: u64 = std::str::from_utf8(&b[b_start..bi]).unwrap().parse().unwrap_or(0);
            match a_num.cmp(&b_num) {
                std::cmp::Ordering::Equal => {
                    match (ai - a_start).cmp(&(bi - b_start)) {
                        std::cmp::Ordering::Equal => continue,
                        other => return other,
                    }
                }
                other => return other,
            }
        }
        if a[ai] != b[bi] {
            return a[ai].cmp(&b[bi]);
        }
        ai += 1;
        bi += 1;
    }
    a.len().cmp(&b.len())
}

fn parse_rem_value(s: &str) -> f64 {
    s.trim_end_matches("rem").parse().unwrap_or(0.0)
}

fn parse_declaration_block(body: &str) -> Vec<(String, String)> {
    let mut decls = Vec::new();
    let mut depth = 0;
    for line in body.lines() {
        let line = line.trim();
        if line.is_empty() || line.starts_with("/*") {
            continue;
        }
        if line.contains('{') {
            depth += line.matches('{').count();
            depth -= line.matches('}').count();
            continue;
        }
        if line.contains('}') {
            depth -= line.matches('}').count();
            continue;
        }
        if depth > 0 {
            continue;
        }
        if let Some(colon) = line.find(':') {
            let prop = line[..colon].trim();
            let mut val = line[colon + 1..].trim();
            if val.ends_with(';') {
                val = &val[..val.len() - 1];
            }
            let val = val.trim();
            if !prop.is_empty() && !val.is_empty() {
                decls.push((prop.to_string(), val.to_string()));
            }
        }
    }
    decls
}

pub fn apply_color_mix_polyfill(decls: Vec<(String, String)>, theme: &Theme) -> Vec<(String, String)> {
    let has_supports_marker = decls.iter().any(|(p, _)| p == "__supports_color_mix__");
    let mut result = Vec::with_capacity(decls.len());
    for (prop, val) in &decls {
        if prop == "--tw-sort" || prop == "__supports_color_mix__" || prop.starts_with("@supports:") {
            result.push((prop.clone(), val.clone()));
            continue;
        }
        if val.contains("color-mix(") {
            let has_theme_var = val.contains("var(--color-");
            let has_any_var = val.contains("var(");
            if has_theme_var {
                if let Some(fallback) = resolve_color_mix_fallback(val, theme) {
                    if !has_supports_marker {
                        if fallback.contains("var(") {
                            let simple_fb = extract_color_mix_first_color(&fallback);
                            result.push((prop.clone(), simple_fb));
                        } else {
                            result.push((prop.clone(), fallback));
                        }
                    }
                    result.push((format!("@supports:{}", prop), val.clone()));
                    continue;
                }
            } else if has_any_var && !has_supports_marker {
                let simple_fb = extract_color_mix_first_color(val);
                result.push((prop.clone(), simple_fb));
                result.push((format!("@supports:{}", prop), val.clone()));
                continue;
            }
        }
        result.push((prop.clone(), val.clone()));
    }
    result
}

fn resolve_color_mix_fallback(val: &str, theme: &Theme) -> Option<String> {
    let mut result = val.to_string();
    let mut pos = 0;
    let mut had_var = false;
    while let Some(idx) = result[pos..].find("var(--color-") {
        let start = pos + idx;
        let var_start = start + 4;
        let mut depth = 1;
        let mut end = start + 5;
        let bytes = result.as_bytes();
        while end < bytes.len() && depth > 0 {
            if bytes[end] == b'(' { depth += 1; }
            if bytes[end] == b')' { depth -= 1; }
            end += 1;
        }
        let var_name = &result[var_start..end - 1];
        let key = if var_name.contains(',') {
            var_name.split(',').next().unwrap().trim()
        } else {
            var_name
        };
        if let Some(resolved) = theme.resolve_with_key(key) {
            let old = result[start..end].to_string();
            result = result.replace(&old, &resolved);
            had_var = true;
            pos = start + resolved.len();
        } else {
            pos = end;
        }
    }
    if !had_var {
        return None;
    }
    result = result.replace("in oklab,", "in srgb,")
        .replace("in oklch,", "in srgb,")
        .replace("in lab,", "in srgb,")
        .replace("in lch,", "in srgb,");
    Some(result)
}

fn extract_color_mix_first_color(val: &str) -> String {
    if let Some(cm_start) = val.find("color-mix(") {
        let inner_start = cm_start + 10;
        let mut depth = 1;
        let mut cm_end = inner_start;
        let bytes = val.as_bytes();
        while cm_end < bytes.len() && depth > 0 {
            if bytes[cm_end] == b'(' { depth += 1; }
            if bytes[cm_end] == b')' { depth -= 1; }
            cm_end += 1;
        }
        let inner = &val[inner_start..cm_end - 1];

        let first_comma = find_top_level_comma(inner);
        if let Some(comma_pos) = first_comma {
            let after_comma = inner[comma_pos + 1..].trim_start();
            let first_token = extract_first_css_token(after_comma);
            return format!("{}{}{}", &val[..cm_start], first_token, &val[cm_end..]);
        }
    }
    val.to_string()
}

fn find_top_level_comma(s: &str) -> Option<usize> {
    let mut depth = 0;
    for (i, b) in s.bytes().enumerate() {
        match b {
            b'(' => depth += 1,
            b')' => depth -= 1,
            b',' if depth == 0 => return Some(i),
            _ => {}
        }
    }
    None
}

fn extract_first_css_token(s: &str) -> &str {
    let s = s.trim();
    if s.is_empty() { return s; }
    let bytes = s.as_bytes();
    let mut i = 0;
    let mut depth = 0;
    let mut started = false;
    while i < bytes.len() {
        match bytes[i] {
            b'(' => { depth += 1; started = true; }
            b')' => {
                depth -= 1;
                if depth == 0 {
                    return &s[..i + 1];
                }
            }
            b' ' | b',' if depth == 0 && started => {
                return &s[..i];
            }
            b' ' | b',' if depth == 0 && !started => {
                return &s[..i];
            }
            _ => { started = true; }
        }
        i += 1;
    }
    s
}

fn escape_selector(s: &str) -> String {
    let mut out = String::with_capacity(s.len() * 2);
    let mut first = true;

    for c in s.chars() {
        if first && c.is_ascii_digit() {
            out.push_str(&format!("\\3{} ", c));
            first = false;
            continue;
        }
        first = false;
        if needs_escape(c) {
            out.push('\\');
        }
        out.push(c);
    }

    out
}

fn needs_escape(c: char) -> bool {
    matches!(
        c,
        ':' | '/'
            | '['
            | ']'
            | '('
            | ')'
            | '!'
            | '#'
            | '.'
            | '%'
            | '@'
            | '+'
            | '*'
            | ','
            | '\''
            | '"'
            | ' '
            | '{'
            | '}'
            | '&'
            | '\\'
            | '='
            | '>'
    )
}
