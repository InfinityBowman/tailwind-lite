use crate::candidate::{Candidate, CandidateModifier, CandidateValue};
use crate::theme::Theme;
use rustc_hash::FxHashMap;
use rustc_hash::FxHashSet;

pub type CssDeclarations = Vec<(String, String)>;

#[derive(Clone, Debug, PartialEq, Eq, Hash)]
pub struct CssProperty {
    pub name: String,
    pub syntax: String,
    pub initial_value: Option<String>,
}

#[derive(Clone, Debug)]
pub struct UtilityOutput {
    pub declarations: CssDeclarations,
    pub properties: Vec<CssProperty>,
}

const CSS_FILTER_VALUE: &str = "var(--tw-blur,) var(--tw-brightness,) var(--tw-contrast,) var(--tw-grayscale,) var(--tw-hue-rotate,) var(--tw-invert,) var(--tw-saturate,) var(--tw-sepia,) var(--tw-drop-shadow,)";
const CSS_BACKDROP_FILTER_VALUE: &str = "var(--tw-backdrop-blur,) var(--tw-backdrop-brightness,) var(--tw-backdrop-contrast,) var(--tw-backdrop-grayscale,) var(--tw-backdrop-hue-rotate,) var(--tw-backdrop-invert,) var(--tw-backdrop-opacity,) var(--tw-backdrop-saturate,) var(--tw-backdrop-sepia,)";

pub struct UtilityRegistry {
    statics: FxHashMap<String, UtilityOutput>,
    functionals: FxHashSet<String>,
}

impl UtilityRegistry {
    pub fn is_known(&self, name: &str) -> bool {
        self.statics.contains_key(name) || self.functionals.contains(name)
    }

    pub fn is_static(&self, name: &str) -> bool {
        self.statics.contains_key(name)
    }

    pub fn compile(&self, candidate: &Candidate, theme: &Theme) -> Option<CssDeclarations> {
        match candidate {
            Candidate::Static { root, .. } => {
                self.statics.get(root.as_str()).map(|o| o.declarations.clone())
            }
            Candidate::Functional {
                root,
                value,
                modifier,
                negative,
                ..
            } => compile_functional(root, value.as_ref(), modifier.as_ref(), *negative, theme),
            Candidate::Arbitrary {
                property,
                value,
                modifier,
                ..
            } => {
                let mut v = value.clone();
                if let Some(m) = modifier {
                    v = with_alpha(&v, &modifier_to_string(m));
                }
                Some(vec![(property.clone(), v)])
            }
        }
    }

    pub fn compile_with_properties(&self, candidate: &Candidate, theme: &Theme) -> Option<UtilityOutput> {
        match candidate {
            Candidate::Static { root, .. } => {
                let mut out = self.statics.get(root.as_str())?.clone();
                if out.properties.is_empty() {
                    out.properties = get_static_properties(root);
                }
                Some(out)
            }
            Candidate::Functional {
                root,
                value,
                modifier,
                negative,
                ..
            } => {
                let decls = compile_functional(root, value.as_ref(), modifier.as_ref(), *negative, theme)?;
                let mut props = get_functional_properties(root, value.as_ref());
                if props.is_empty() {
                    props = get_decl_implied_properties(&decls);
                }
                Some(UtilityOutput { declarations: decls, properties: props })
            }
            Candidate::Arbitrary {
                property,
                value,
                modifier,
                ..
            } => {
                let mut v = value.clone();
                if let Some(m) = modifier {
                    v = with_alpha(&v, &modifier_to_string(m));
                }
                Some(UtilityOutput {
                    declarations: vec![(property.clone(), v)],
                    properties: vec![],
                })
            }
        }
    }
}

fn get_decl_implied_properties(decls: &CssDeclarations) -> Vec<CssProperty> {
    let mut props = Vec::new();
    let mut has_border_style = false;
    let mut has_font_weight = false;
    for (name, value) in decls {
        if !has_border_style && value.contains("var(--tw-border-style)") {
            has_border_style = true;
        }
        if !has_font_weight && name == "--tw-font-weight" {
            has_font_weight = true;
        }
    }
    if has_border_style {
        props.push(prop("--tw-border-style", Some("solid"), None));
    }
    if has_font_weight {
        props.push(prop("--tw-font-weight", None, None));
    }
    props
}

fn prop(name: &str, initial_value: Option<&str>, syntax: Option<&str>) -> CssProperty {
    CssProperty {
        name: name.to_string(),
        syntax: syntax.unwrap_or("*").to_string(),
        initial_value: initial_value.map(|s| s.to_string()),
    }
}

fn translate_properties() -> Vec<CssProperty> {
    vec![
        prop("--tw-translate-x", Some("0"), None),
        prop("--tw-translate-y", Some("0"), None),
        prop("--tw-translate-z", Some("0"), None),
    ]
}

fn scale_properties() -> Vec<CssProperty> {
    vec![
        prop("--tw-scale-x", Some("1"), None),
        prop("--tw-scale-y", Some("1"), None),
        prop("--tw-scale-z", Some("1"), None),
    ]
}

fn rotate_skew_properties() -> Vec<CssProperty> {
    vec![
        prop("--tw-rotate-x", None, None),
        prop("--tw-rotate-y", None, None),
        prop("--tw-rotate-z", None, None),
        prop("--tw-skew-x", None, None),
        prop("--tw-skew-y", None, None),
    ]
}

fn border_spacing_properties() -> Vec<CssProperty> {
    vec![
        prop("--tw-border-spacing-x", Some("0"), Some("<length>")),
        prop("--tw-border-spacing-y", Some("0"), Some("<length>")),
    ]
}

fn gradient_properties() -> Vec<CssProperty> {
    vec![
        prop("--tw-gradient-position", None, None),
        prop("--tw-gradient-from", Some("#0000"), Some("<color>")),
        prop("--tw-gradient-via", Some("#0000"), Some("<color>")),
        prop("--tw-gradient-to", Some("#0000"), Some("<color>")),
        prop("--tw-gradient-stops", None, None),
        prop("--tw-gradient-via-stops", None, None),
        prop("--tw-gradient-from-position", Some("0%"), Some("<length-percentage>")),
        prop("--tw-gradient-via-position", Some("50%"), Some("<length-percentage>")),
        prop("--tw-gradient-to-position", Some("100%"), Some("<length-percentage>")),
    ]
}

fn shadow_properties() -> Vec<CssProperty> {
    vec![
        prop("--tw-shadow", Some("0 0 #0000"), None),
        prop("--tw-shadow-color", None, None),
        prop("--tw-shadow-alpha", Some("100%"), Some("<percentage>")),
        prop("--tw-inset-shadow", Some("0 0 #0000"), None),
        prop("--tw-inset-shadow-color", None, None),
        prop("--tw-inset-shadow-alpha", Some("100%"), Some("<percentage>")),
        prop("--tw-ring-color", None, None),
        prop("--tw-ring-shadow", Some("0 0 #0000"), None),
        prop("--tw-inset-ring-color", None, None),
        prop("--tw-inset-ring-shadow", Some("0 0 #0000"), None),
        prop("--tw-ring-inset", None, None),
        prop("--tw-ring-offset-width", Some("0px"), Some("<length>")),
        prop("--tw-ring-offset-color", Some("#fff"), None),
        prop("--tw-ring-offset-shadow", Some("0 0 #0000"), None),
    ]
}

fn filter_properties() -> Vec<CssProperty> {
    vec![
        prop("--tw-blur", None, None),
        prop("--tw-brightness", None, None),
        prop("--tw-contrast", None, None),
        prop("--tw-grayscale", None, None),
        prop("--tw-hue-rotate", None, None),
        prop("--tw-invert", None, None),
        prop("--tw-opacity", None, None),
        prop("--tw-saturate", None, None),
        prop("--tw-sepia", None, None),
        prop("--tw-drop-shadow", None, None),
        prop("--tw-drop-shadow-color", None, None),
        prop("--tw-drop-shadow-alpha", Some("100%"), Some("<percentage>")),
        prop("--tw-drop-shadow-size", None, None),
    ]
}

fn backdrop_filter_properties() -> Vec<CssProperty> {
    vec![
        prop("--tw-backdrop-blur", None, None),
        prop("--tw-backdrop-brightness", None, None),
        prop("--tw-backdrop-contrast", None, None),
        prop("--tw-backdrop-grayscale", None, None),
        prop("--tw-backdrop-hue-rotate", None, None),
        prop("--tw-backdrop-invert", None, None),
        prop("--tw-backdrop-opacity", None, None),
        prop("--tw-backdrop-saturate", None, None),
        prop("--tw-backdrop-sepia", None, None),
    ]
}

fn text_shadow_properties() -> Vec<CssProperty> {
    vec![
        prop("--tw-text-shadow-color", None, None),
        prop("--tw-text-shadow-alpha", Some("100%"), Some("<percentage>")),
    ]
}

fn mask_base_properties() -> Vec<CssProperty> {
    vec![
        prop("--tw-mask-linear", Some("linear-gradient(#fff, #fff)"), None),
        prop("--tw-mask-radial", Some("linear-gradient(#fff, #fff)"), None),
        prop("--tw-mask-conic", Some("linear-gradient(#fff, #fff)"), None),
    ]
}

fn mask_edge_base_properties() -> Vec<CssProperty> {
    vec![
        prop("--tw-mask-left", Some("linear-gradient(#fff, #fff)"), None),
        prop("--tw-mask-right", Some("linear-gradient(#fff, #fff)"), None),
        prop("--tw-mask-bottom", Some("linear-gradient(#fff, #fff)"), None),
        prop("--tw-mask-top", Some("linear-gradient(#fff, #fff)"), None),
    ]
}

fn mask_edge_properties(edges: &[&str]) -> Vec<CssProperty> {
    let mut p = mask_base_properties();
    p.extend(mask_edge_base_properties());
    for edge in edges {
        p.push(prop(&format!("--tw-mask-{}-from-position", edge), Some("0%"), None));
        p.push(prop(&format!("--tw-mask-{}-to-position", edge), Some("100%"), None));
        p.push(prop(&format!("--tw-mask-{}-from-color", edge), Some("black"), None));
        p.push(prop(&format!("--tw-mask-{}-to-color", edge), Some("transparent"), None));
    }
    p
}

fn mask_linear_properties() -> Vec<CssProperty> {
    vec![
        prop("--tw-mask-linear-position", Some("0deg"), None),
        prop("--tw-mask-linear-from-position", Some("0%"), None),
        prop("--tw-mask-linear-to-position", Some("100%"), None),
        prop("--tw-mask-linear-from-color", Some("black"), None),
        prop("--tw-mask-linear-to-color", Some("transparent"), None),
    ]
}

fn mask_radial_properties() -> Vec<CssProperty> {
    vec![
        prop("--tw-mask-radial-from-position", Some("0%"), None),
        prop("--tw-mask-radial-to-position", Some("100%"), None),
        prop("--tw-mask-radial-from-color", Some("black"), None),
        prop("--tw-mask-radial-to-color", Some("transparent"), None),
        prop("--tw-mask-radial-shape", Some("ellipse"), None),
        prop("--tw-mask-radial-size", Some("farthest-corner"), None),
        prop("--tw-mask-radial-position", Some("center"), None),
    ]
}

fn mask_conic_properties() -> Vec<CssProperty> {
    vec![
        prop("--tw-mask-conic-position", Some("0deg"), None),
        prop("--tw-mask-conic-from-position", Some("0%"), None),
        prop("--tw-mask-conic-to-position", Some("100%"), None),
        prop("--tw-mask-conic-from-color", Some("black"), None),
        prop("--tw-mask-conic-to-color", Some("transparent"), None),
    ]
}

fn scrollbar_properties() -> Vec<CssProperty> {
    vec![
        prop("--tw-scrollbar-thumb", Some("#0000"), Some("<color>")),
        prop("--tw-scrollbar-track", Some("#0000"), Some("<color>")),
    ]
}

/// Returns @property rules for a given functional utility root.
/// Matches the TS `atRoot([property(...)])` declarations per utility.
fn get_functional_properties(root: &str, _value: Option<&CandidateValue>) -> Vec<CssProperty> {
    match root.trim_start_matches('-') {
        // Transform
        "translate" | "translate-x" | "translate-y" | "translate-z" => translate_properties(),
        "scale" | "scale-x" | "scale-y" | "scale-z" => scale_properties(),
        "rotate" | "rotate-x" | "rotate-y" => rotate_skew_properties(),
        "skew" | "skew-x" | "skew-y" => rotate_skew_properties(),

        // Border spacing
        "border-spacing" | "border-spacing-x" | "border-spacing-y" => border_spacing_properties(),

        // Space
        "space-x" => vec![prop("--tw-space-x-reverse", Some("0"), None)],
        "space-y" => vec![prop("--tw-space-y-reverse", Some("0"), None)],

        // Divide
        "divide-x" => vec![
            prop("--tw-divide-x-reverse", Some("0"), None),
            prop("--tw-border-style", Some("solid"), None),
        ],
        "divide-y" => vec![
            prop("--tw-divide-y-reverse", Some("0"), None),
            prop("--tw-border-style", Some("solid"), None),
        ],

        // Gradient
        "from" | "via" | "to" | "bg-linear" | "bg-radial" | "bg-conic" => gradient_properties(),

        // Shadow / ring
        "shadow" | "inset-shadow" | "ring" | "inset-ring"
        | "ring-offset" => shadow_properties(),

        // Filter
        "blur" | "brightness" | "contrast" | "grayscale" | "hue-rotate"
        | "invert" | "saturate" | "sepia" | "drop-shadow" => filter_properties(),

        // Backdrop filter
        "backdrop-blur" | "backdrop-brightness" | "backdrop-contrast"
        | "backdrop-grayscale" | "backdrop-hue-rotate" | "backdrop-invert"
        | "backdrop-opacity" | "backdrop-saturate" | "backdrop-sepia" => backdrop_filter_properties(),

        // Outline
        "outline" => vec![prop("--tw-outline-style", Some("solid"), None)],

        // Duration / ease
        "duration" => vec![prop("--tw-duration", None, None)],
        "ease" => vec![prop("--tw-ease", None, None)],

        // Typography
        "leading" => vec![prop("--tw-leading", None, None)],
        "tracking" => vec![prop("--tw-tracking", None, None)],

        // Font weight: only when it resolves as weight, not family
        // Handled by get_decl_implied_properties checking for --tw-font-weight in declarations

        // Snap
        "snap" => vec![prop("--tw-scroll-snap-strictness", Some("proximity"), None)],

        // Content
        "content" => vec![prop("--tw-content", Some("\"\""), None)],

        // Text shadow
        "text-shadow" => text_shadow_properties(),

        // Mask
        "mask-linear" => {
            let mut p = mask_base_properties();
            p.extend(mask_linear_properties());
            p
        }
        "mask-radial" => {
            let mut p = mask_base_properties();
            p.extend(mask_radial_properties());
            p
        }
        "mask-conic" => {
            let mut p = mask_base_properties();
            p.extend(mask_conic_properties());
            p
        }
        "mask-linear-from" | "mask-linear-to" => {
            let mut p = mask_base_properties();
            p.extend(mask_linear_properties());
            p
        }
        "mask-radial-from" | "mask-radial-to" | "mask-radial-at" => {
            let mut p = mask_base_properties();
            p.extend(mask_radial_properties());
            p
        }
        "mask-conic-from" | "mask-conic-to" | "mask-conic-at" => {
            let mut p = mask_base_properties();
            p.extend(mask_conic_properties());
            p
        }
        "mask-t-from" | "mask-t-to" => mask_edge_properties(&["top"]),
        "mask-b-from" | "mask-b-to" => mask_edge_properties(&["bottom"]),
        "mask-l-from" | "mask-l-to" => mask_edge_properties(&["left"]),
        "mask-r-from" | "mask-r-to" => mask_edge_properties(&["right"]),
        "mask-x-from" | "mask-x-to" => mask_edge_properties(&["right", "left"]),
        "mask-y-from" | "mask-y-to" => mask_edge_properties(&["top", "bottom"]),

        // Scrollbar
        "scrollbar-color" => scrollbar_properties(),

        _ => vec![],
    }
}

/// Returns @property rules for static utilities that need them.
/// Called from compile_with_properties for statics not already annotated.
fn get_static_properties(name: &str) -> Vec<CssProperty> {
    match name {
        // Outline shorthand — uses var(--tw-outline-style)
        "outline" =>
            vec![prop("--tw-outline-style", Some("solid"), None)],
        // outline-none/solid/dashed/etc. are plain statics, no @property needed

        // border-solid/dashed/etc. and divide-solid/dashed/etc. are plain statics, no @property
        // Border shorthand (width) — these use var(--tw-border-style) so need the property
        "border" | "border-x" | "border-y" | "border-s" | "border-e"
        | "border-t" | "border-r" | "border-b" | "border-l"
        | "border-ss" | "border-se" | "border-bs" | "border-be" =>
            vec![prop("--tw-border-style", Some("solid"), None)],

        // transform/transform-cpu/transform-gpu are plain statics, no @property

        // Snap
        "snap-x" | "snap-y" | "snap-both" | "snap-mandatory" | "snap-proximity" =>
            vec![prop("--tw-scroll-snap-strictness", Some("proximity"), None)],

        // Divide reverse
        "divide-x-reverse" => vec![prop("--tw-divide-x-reverse", Some("0"), None)],
        "divide-y-reverse" => vec![prop("--tw-divide-y-reverse", Some("0"), None)],

        // Ring
        "ring-inset" => shadow_properties(),

        // Duration
        "duration-initial" => vec![prop("--tw-duration", None, None)],

        // content-none is a plain static, no @property needed

        _ => vec![],
    }
}

pub fn create_utilities() -> UtilityRegistry {
    let mut statics: FxHashMap<String, UtilityOutput> = FxHashMap::default();
    let mut functionals: FxHashSet<String> = FxHashSet::default();

    macro_rules! s {
        ($name:expr, $($prop:expr => $val:expr),+ $(,)?) => {
            statics.insert($name.into(), UtilityOutput {
                declarations: vec![$(($prop.into(), $val.into())),+],
                properties: vec![],
            });
        };
    }

    macro_rules! sp {
        ($name:expr, [$($prop:expr => $val:expr),+ $(,)?], [$($cprop:expr),* $(,)?]) => {
            statics.insert($name.into(), UtilityOutput {
                declarations: vec![$(($prop.into(), $val.into())),+],
                properties: vec![$($cprop),*],
            });
        };
    }

    // Container
    statics.insert("container".into(), UtilityOutput {
        declarations: vec![
            ("--tw-sort".into(), "--tw-container-component".into()),
            ("width".into(), "100%".into()),
        ],
        properties: vec![],
    });

    // @container (container-type utility)
    functionals.insert("@container".into());

    // Display
    s!("block", "display" => "block");
    s!("inline-block", "display" => "inline-block");
    s!("inline", "display" => "inline");
    s!("flex", "display" => "flex");
    s!("inline-flex", "display" => "inline-flex");
    s!("table", "display" => "table");
    s!("inline-table", "display" => "inline-table");
    s!("table-caption", "display" => "table-caption");
    s!("table-cell", "display" => "table-cell");
    s!("table-column", "display" => "table-column");
    s!("table-column-group", "display" => "table-column-group");
    s!("table-footer-group", "display" => "table-footer-group");
    s!("table-header-group", "display" => "table-header-group");
    s!("table-row-group", "display" => "table-row-group");
    s!("table-row", "display" => "table-row");
    s!("flow-root", "display" => "flow-root");
    s!("grid", "display" => "grid");
    s!("inline-grid", "display" => "inline-grid");
    s!("contents", "display" => "contents");
    s!("list-item", "display" => "list-item");
    s!("hidden", "display" => "none");

    // Position
    s!("static", "position" => "static");
    s!("fixed", "position" => "fixed");
    s!("absolute", "position" => "absolute");
    s!("relative", "position" => "relative");
    s!("sticky", "position" => "sticky");

    // Visibility
    s!("visible", "visibility" => "visible");
    s!("invisible", "visibility" => "hidden");
    s!("collapse", "visibility" => "collapse");

    // Pointer events
    s!("pointer-events-none", "pointer-events" => "none");
    s!("pointer-events-auto", "pointer-events" => "auto");

    // Isolation
    s!("isolate", "isolation" => "isolate");
    s!("isolation-auto", "isolation" => "auto");

    // Box sizing
    s!("box-border", "box-sizing" => "border-box");
    s!("box-content", "box-sizing" => "content-box");

    // Float
    s!("float-start", "float" => "inline-start");
    s!("float-end", "float" => "inline-end");
    s!("float-right", "float" => "right");
    s!("float-left", "float" => "left");
    s!("float-none", "float" => "none");

    // Clear
    s!("clear-start", "clear" => "inline-start");
    s!("clear-end", "clear" => "inline-end");
    s!("clear-right", "clear" => "right");
    s!("clear-left", "clear" => "left");
    s!("clear-both", "clear" => "both");
    s!("clear-none", "clear" => "none");

    // Overflow
    s!("overflow-auto", "overflow" => "auto");
    s!("overflow-hidden", "overflow" => "hidden");
    s!("overflow-clip", "overflow" => "clip");
    s!("overflow-visible", "overflow" => "visible");
    s!("overflow-scroll", "overflow" => "scroll");
    s!("overflow-x-auto", "overflow-x" => "auto");
    s!("overflow-x-hidden", "overflow-x" => "hidden");
    s!("overflow-x-clip", "overflow-x" => "clip");
    s!("overflow-x-visible", "overflow-x" => "visible");
    s!("overflow-x-scroll", "overflow-x" => "scroll");
    s!("overflow-y-auto", "overflow-y" => "auto");
    s!("overflow-y-hidden", "overflow-y" => "hidden");
    s!("overflow-y-clip", "overflow-y" => "clip");
    s!("overflow-y-visible", "overflow-y" => "visible");
    s!("overflow-y-scroll", "overflow-y" => "scroll");

    // Overscroll
    s!("overscroll-auto", "overscroll-behavior" => "auto");
    s!("overscroll-contain", "overscroll-behavior" => "contain");
    s!("overscroll-none", "overscroll-behavior" => "none");
    s!("overscroll-x-auto", "overscroll-behavior-x" => "auto");
    s!("overscroll-x-contain", "overscroll-behavior-x" => "contain");
    s!("overscroll-x-none", "overscroll-behavior-x" => "none");
    s!("overscroll-y-auto", "overscroll-behavior-y" => "auto");
    s!("overscroll-y-contain", "overscroll-behavior-y" => "contain");
    s!("overscroll-y-none", "overscroll-behavior-y" => "none");

    // Flex direction
    s!("flex-row", "flex-direction" => "row");
    s!("flex-row-reverse", "flex-direction" => "row-reverse");
    s!("flex-col", "flex-direction" => "column");
    s!("flex-col-reverse", "flex-direction" => "column-reverse");

    // Flex wrap
    s!("flex-wrap", "flex-wrap" => "wrap");
    s!("flex-wrap-reverse", "flex-wrap" => "wrap-reverse");
    s!("flex-nowrap", "flex-wrap" => "nowrap");

    // Flex grow/shrink
    s!("grow", "flex-grow" => "1");
    s!("grow-0", "flex-grow" => "0");
    s!("shrink", "flex-shrink" => "1");
    s!("shrink-0", "flex-shrink" => "0");
    s!("flex-shrink", "flex-shrink" => "1");
    s!("flex-shrink-0", "flex-shrink" => "0");

    // Flex
    s!("flex-1", "flex" => "1");
    s!("flex-auto", "flex" => "auto");
    s!("flex-initial", "flex" => "0 auto");
    s!("flex-none", "flex" => "none");

    // Flex basis statics
    s!("basis-auto", "flex-basis" => "auto");
    s!("basis-full", "flex-basis" => "100%");

    // Grid template
    s!("grid-cols-none", "grid-template-columns" => "none");
    s!("grid-cols-subgrid", "grid-template-columns" => "subgrid");
    s!("grid-rows-none", "grid-template-rows" => "none");
    s!("grid-rows-subgrid", "grid-template-rows" => "subgrid");

    // Grid auto flow
    s!("grid-flow-row", "grid-auto-flow" => "row");
    s!("grid-flow-col", "grid-auto-flow" => "column");
    s!("grid-flow-dense", "grid-auto-flow" => "dense");
    s!("grid-flow-row-dense", "grid-auto-flow" => "row dense");
    s!("grid-flow-col-dense", "grid-auto-flow" => "column dense");

    // Justify content
    s!("justify-normal", "justify-content" => "normal");
    s!("justify-start", "justify-content" => "flex-start");
    s!("justify-end", "justify-content" => "flex-end");
    s!("justify-center", "justify-content" => "center");
    s!("justify-between", "justify-content" => "space-between");
    s!("justify-around", "justify-content" => "space-around");
    s!("justify-evenly", "justify-content" => "space-evenly");
    s!("justify-stretch", "justify-content" => "stretch");
    s!("justify-baseline", "justify-content" => "baseline");
    s!("justify-center-safe", "justify-content" => "safe center");
    s!("justify-end-safe", "justify-content" => "safe flex-end");

    // Justify items
    s!("justify-items-start", "justify-items" => "start");
    s!("justify-items-end", "justify-items" => "end");
    s!("justify-items-center", "justify-items" => "center");
    s!("justify-items-stretch", "justify-items" => "stretch");
    s!("justify-items-normal", "justify-items" => "normal");
    s!("justify-items-center-safe", "justify-items" => "safe center");
    s!("justify-items-end-safe", "justify-items" => "safe end");

    // Justify self
    s!("justify-self-auto", "justify-self" => "auto");
    s!("justify-self-start", "justify-self" => "flex-start");
    s!("justify-self-end", "justify-self" => "flex-end");
    s!("justify-self-center", "justify-self" => "center");
    s!("justify-self-stretch", "justify-self" => "stretch");
    s!("justify-self-center-safe", "justify-self" => "safe center");
    s!("justify-self-end-safe", "justify-self" => "safe flex-end");

    // Align content
    s!("content-normal", "align-content" => "normal");
    s!("content-center", "align-content" => "center");
    s!("content-start", "align-content" => "flex-start");
    s!("content-end", "align-content" => "flex-end");
    s!("content-between", "align-content" => "space-between");
    s!("content-around", "align-content" => "space-around");
    s!("content-evenly", "align-content" => "space-evenly");
    s!("content-baseline", "align-content" => "baseline");
    s!("content-stretch", "align-content" => "stretch");
    s!("content-center-safe", "align-content" => "safe center");
    s!("content-end-safe", "align-content" => "safe flex-end");

    // Align items
    s!("items-start", "align-items" => "flex-start");
    s!("items-end", "align-items" => "flex-end");
    s!("items-center", "align-items" => "center");
    s!("items-baseline", "align-items" => "baseline");
    s!("items-baseline-last", "align-items" => "last baseline");
    s!("items-stretch", "align-items" => "stretch");
    s!("items-center-safe", "align-items" => "safe center");
    s!("items-end-safe", "align-items" => "safe flex-end");

    // Align self
    s!("self-auto", "align-self" => "auto");
    s!("self-start", "align-self" => "flex-start");
    s!("self-end", "align-self" => "flex-end");
    s!("self-center", "align-self" => "center");
    s!("self-stretch", "align-self" => "stretch");
    s!("self-baseline", "align-self" => "baseline");
    s!("self-baseline-last", "align-self" => "last baseline");
    s!("self-center-safe", "align-self" => "safe center");
    s!("self-end-safe", "align-self" => "safe flex-end");

    // Place content
    s!("place-content-center", "place-content" => "center");
    s!("place-content-start", "place-content" => "start");
    s!("place-content-end", "place-content" => "end");
    s!("place-content-between", "place-content" => "space-between");
    s!("place-content-around", "place-content" => "space-around");
    s!("place-content-evenly", "place-content" => "space-evenly");
    s!("place-content-baseline", "place-content" => "baseline");
    s!("place-content-stretch", "place-content" => "stretch");
    s!("place-content-center-safe", "place-content" => "safe center");
    s!("place-content-end-safe", "place-content" => "safe end");

    // Place items
    s!("place-items-start", "place-items" => "start");
    s!("place-items-end", "place-items" => "end");
    s!("place-items-center", "place-items" => "center");
    s!("place-items-baseline", "place-items" => "baseline");
    s!("place-items-stretch", "place-items" => "stretch");
    s!("place-items-center-safe", "place-items" => "safe center");
    s!("place-items-end-safe", "place-items" => "safe end");

    // Place self
    s!("place-self-auto", "place-self" => "auto");
    s!("place-self-start", "place-self" => "start");
    s!("place-self-end", "place-self" => "end");
    s!("place-self-center", "place-self" => "center");
    s!("place-self-stretch", "place-self" => "stretch");
    s!("place-self-center-safe", "place-self" => "safe center");
    s!("place-self-end-safe", "place-self" => "safe end");

    // Text alignment
    s!("text-left", "text-align" => "left");
    s!("text-center", "text-align" => "center");
    s!("text-right", "text-align" => "right");
    s!("text-justify", "text-align" => "justify");
    s!("text-start", "text-align" => "start");
    s!("text-end", "text-align" => "end");

    // Text decoration
    s!("underline", "text-decoration-line" => "underline");
    s!("overline", "text-decoration-line" => "overline");
    s!("line-through", "text-decoration-line" => "line-through");
    s!("no-underline", "text-decoration-line" => "none");

    // Text decoration style
    s!("decoration-solid", "text-decoration-style" => "solid");
    s!("decoration-double", "text-decoration-style" => "double");
    s!("decoration-dotted", "text-decoration-style" => "dotted");
    s!("decoration-dashed", "text-decoration-style" => "dashed");
    s!("decoration-wavy", "text-decoration-style" => "wavy");

    // Text transform
    s!("uppercase", "text-transform" => "uppercase");
    s!("lowercase", "text-transform" => "lowercase");
    s!("capitalize", "text-transform" => "capitalize");
    s!("normal-case", "text-transform" => "none");

    // Font style
    s!("italic", "font-style" => "italic");
    s!("not-italic", "font-style" => "normal");

    // Font smoothing
    s!("antialiased", "-webkit-font-smoothing" => "antialiased", "-moz-osx-font-smoothing" => "grayscale");
    s!("subpixel-antialiased", "-webkit-font-smoothing" => "auto", "-moz-osx-font-smoothing" => "auto");

    // Whitespace
    s!("whitespace-normal", "white-space" => "normal");
    s!("whitespace-nowrap", "white-space" => "nowrap");
    s!("whitespace-pre", "white-space" => "pre");
    s!("whitespace-pre-line", "white-space" => "pre-line");
    s!("whitespace-pre-wrap", "white-space" => "pre-wrap");
    s!("whitespace-break-spaces", "white-space" => "break-spaces");

    // Word break
    s!("break-normal", "overflow-wrap" => "normal", "word-break" => "normal");
    s!("break-words", "overflow-wrap" => "break-word");
    s!("break-all", "word-break" => "break-all");
    s!("break-keep", "word-break" => "keep-all");

    // Text overflow
    s!("truncate", "overflow" => "hidden", "text-overflow" => "ellipsis", "white-space" => "nowrap");
    s!("text-ellipsis", "text-overflow" => "ellipsis");
    s!("text-clip", "text-overflow" => "clip");

    // Text wrap
    s!("text-wrap", "text-wrap" => "wrap");
    s!("text-nowrap", "text-wrap" => "nowrap");
    s!("text-balance", "text-wrap" => "balance");
    s!("text-pretty", "text-wrap" => "pretty");

    // Vertical align
    s!("align-baseline", "vertical-align" => "baseline");
    s!("align-top", "vertical-align" => "top");
    s!("align-middle", "vertical-align" => "middle");
    s!("align-bottom", "vertical-align" => "bottom");
    s!("align-text-top", "vertical-align" => "text-top");
    s!("align-text-bottom", "vertical-align" => "text-bottom");
    s!("align-sub", "vertical-align" => "sub");
    s!("align-super", "vertical-align" => "super");

    // Cursor
    s!("cursor-auto", "cursor" => "auto");
    s!("cursor-default", "cursor" => "default");
    s!("cursor-pointer", "cursor" => "pointer");
    s!("cursor-wait", "cursor" => "wait");
    s!("cursor-text", "cursor" => "text");
    s!("cursor-move", "cursor" => "move");
    s!("cursor-help", "cursor" => "help");
    s!("cursor-not-allowed", "cursor" => "not-allowed");
    s!("cursor-none", "cursor" => "none");
    s!("cursor-context-menu", "cursor" => "context-menu");
    s!("cursor-progress", "cursor" => "progress");
    s!("cursor-cell", "cursor" => "cell");
    s!("cursor-crosshair", "cursor" => "crosshair");
    s!("cursor-vertical-text", "cursor" => "vertical-text");
    s!("cursor-alias", "cursor" => "alias");
    s!("cursor-copy", "cursor" => "copy");
    s!("cursor-no-drop", "cursor" => "no-drop");
    s!("cursor-grab", "cursor" => "grab");
    s!("cursor-grabbing", "cursor" => "grabbing");
    s!("cursor-all-scroll", "cursor" => "all-scroll");
    s!("cursor-col-resize", "cursor" => "col-resize");
    s!("cursor-row-resize", "cursor" => "row-resize");
    s!("cursor-n-resize", "cursor" => "n-resize");
    s!("cursor-e-resize", "cursor" => "e-resize");
    s!("cursor-s-resize", "cursor" => "s-resize");
    s!("cursor-w-resize", "cursor" => "w-resize");
    s!("cursor-ne-resize", "cursor" => "ne-resize");
    s!("cursor-nw-resize", "cursor" => "nw-resize");
    s!("cursor-se-resize", "cursor" => "se-resize");
    s!("cursor-sw-resize", "cursor" => "sw-resize");
    s!("cursor-ew-resize", "cursor" => "ew-resize");
    s!("cursor-ns-resize", "cursor" => "ns-resize");
    s!("cursor-nesw-resize", "cursor" => "nesw-resize");
    s!("cursor-nwse-resize", "cursor" => "nwse-resize");
    s!("cursor-zoom-in", "cursor" => "zoom-in");
    s!("cursor-zoom-out", "cursor" => "zoom-out");

    // User select
    s!("select-none", "-webkit-user-select" => "none", "user-select" => "none");
    s!("select-text", "-webkit-user-select" => "text", "user-select" => "text");
    s!("select-all", "-webkit-user-select" => "all", "user-select" => "all");
    s!("select-auto", "-webkit-user-select" => "auto", "user-select" => "auto");

    // Appearance
    s!("appearance-none", "appearance" => "none");
    s!("appearance-auto", "appearance" => "auto");

    // Resize
    s!("resize-none", "resize" => "none");
    s!("resize-x", "resize" => "horizontal");
    s!("resize-y", "resize" => "vertical");
    s!("resize", "resize" => "both");

    // List style
    s!("list-inside", "list-style-position" => "inside");
    s!("list-outside", "list-style-position" => "outside");
    s!("list-none", "list-style-type" => "none");
    s!("list-disc", "list-style-type" => "disc");
    s!("list-decimal", "list-style-type" => "decimal");
    s!("list-image-none", "list-style-image" => "none");

    // Object fit
    s!("object-contain", "object-fit" => "contain");
    s!("object-cover", "object-fit" => "cover");
    s!("object-fill", "object-fit" => "fill");
    s!("object-none", "object-fit" => "none");
    s!("object-scale-down", "object-fit" => "scale-down");

    // Object position
    s!("object-bottom", "object-position" => "bottom");
    s!("object-center", "object-position" => "center");
    s!("object-left", "object-position" => "left");
    s!("object-left-bottom", "object-position" => "left bottom");
    s!("object-left-top", "object-position" => "left top");
    s!("object-right", "object-position" => "right");
    s!("object-right-bottom", "object-position" => "right bottom");
    s!("object-right-top", "object-position" => "right top");
    s!("object-top", "object-position" => "top");

    // Border style
    s!("border-solid", "--tw-border-style" => "solid", "border-style" => "solid");
    s!("border-dashed", "--tw-border-style" => "dashed", "border-style" => "dashed");
    s!("border-dotted", "--tw-border-style" => "dotted", "border-style" => "dotted");
    s!("border-double", "--tw-border-style" => "double", "border-style" => "double");
    s!("border-hidden", "--tw-border-style" => "hidden", "border-style" => "hidden");
    s!("border-none", "--tw-border-style" => "none", "border-style" => "none");

    // Outline style
    s!("outline-none", "--tw-outline-style" => "none", "outline-style" => "none");
    s!("outline", "outline-style" => "var(--tw-outline-style)", "outline-width" => "1px");
    s!("outline-dashed", "--tw-outline-style" => "dashed", "outline-style" => "dashed");
    s!("outline-dotted", "--tw-outline-style" => "dotted", "outline-style" => "dotted");
    s!("outline-double", "--tw-outline-style" => "double", "outline-style" => "double");
    s!("outline-solid", "--tw-outline-style" => "solid", "outline-style" => "solid");
    s!("outline-hidden", "--tw-outline-style" => "none", "outline-style" => "none");

    // Transition
    s!("transition-none", "transition-property" => "none");
    s!("transition-all", "transition-property" => "all", "transition-timing-function" => "var(--tw-ease, var(--default-transition-timing-function))", "transition-duration" => "var(--tw-duration, var(--default-transition-duration))");
    s!("transition-colors", "transition-property" => "color, background-color, border-color, outline-color, text-decoration-color, fill, stroke, --tw-gradient-from, --tw-gradient-via, --tw-gradient-to", "transition-timing-function" => "var(--tw-ease, var(--default-transition-timing-function))", "transition-duration" => "var(--tw-duration, var(--default-transition-duration))");
    s!("transition-opacity", "transition-property" => "opacity", "transition-timing-function" => "var(--tw-ease, var(--default-transition-timing-function))", "transition-duration" => "var(--tw-duration, var(--default-transition-duration))");
    s!("transition-shadow", "transition-property" => "box-shadow", "transition-timing-function" => "var(--tw-ease, var(--default-transition-timing-function))", "transition-duration" => "var(--tw-duration, var(--default-transition-duration))");
    s!("transition-transform", "transition-property" => "transform, translate, scale, rotate", "transition-timing-function" => "var(--tw-ease, var(--default-transition-timing-function))", "transition-duration" => "var(--tw-duration, var(--default-transition-duration))");
    s!("transition", "transition-property" => "color, background-color, border-color, outline-color, text-decoration-color, fill, stroke, --tw-gradient-from, --tw-gradient-via, --tw-gradient-to, opacity, box-shadow, transform, translate, scale, rotate, filter, -webkit-backdrop-filter, backdrop-filter, display, content-visibility, overlay, pointer-events", "transition-timing-function" => "var(--tw-ease, var(--default-transition-timing-function))", "transition-duration" => "var(--tw-duration, var(--default-transition-duration))");
    s!("transition-discrete", "transition-behavior" => "allow-discrete");
    s!("transition-normal", "transition-behavior" => "normal");
    s!("duration-initial", "--tw-duration" => "initial");

    // Transform
    statics.insert("transform".into(), UtilityOutput {
        declarations: vec![("transform".into(), "var(--tw-rotate-x,) var(--tw-rotate-y,) var(--tw-rotate-z,) var(--tw-skew-x,) var(--tw-skew-y,)".into())],
        properties: rotate_skew_properties(),
    });
    s!("transform-none", "transform" => "none");
    s!("transform-cpu", "transform" => "var(--tw-rotate-x,) var(--tw-rotate-y,) var(--tw-rotate-z,) var(--tw-skew-x,) var(--tw-skew-y,)");
    s!("transform-gpu", "transform" => "translateZ(0) var(--tw-rotate-x,) var(--tw-rotate-y,) var(--tw-rotate-z,) var(--tw-skew-x,) var(--tw-skew-y,)");
    s!("transform-content", "transform-box" => "content-box");
    s!("transform-border", "transform-box" => "border-box");
    s!("transform-fill", "transform-box" => "fill-box");
    s!("transform-stroke", "transform-box" => "stroke-box");
    s!("transform-view", "transform-box" => "view-box");

    // Order
    s!("order-none", "order" => "0");

    // Scroll behavior
    s!("scroll-auto", "scroll-behavior" => "auto");
    s!("scroll-smooth", "scroll-behavior" => "smooth");

    // Snap
    s!("snap-start", "scroll-snap-align" => "start");
    s!("snap-end", "scroll-snap-align" => "end");
    s!("snap-center", "scroll-snap-align" => "center");
    s!("snap-align-none", "scroll-snap-align" => "none");
    s!("snap-none", "scroll-snap-type" => "none");
    s!("snap-x", "scroll-snap-type" => "x var(--tw-scroll-snap-strictness)");
    s!("snap-y", "scroll-snap-type" => "y var(--tw-scroll-snap-strictness)");
    s!("snap-both", "scroll-snap-type" => "both var(--tw-scroll-snap-strictness)");
    s!("snap-mandatory", "--tw-scroll-snap-strictness" => "mandatory");
    s!("snap-proximity", "--tw-scroll-snap-strictness" => "proximity");
    s!("snap-normal", "scroll-snap-stop" => "normal");
    s!("snap-always", "scroll-snap-stop" => "always");

    // Touch action
    s!("touch-auto", "touch-action" => "auto");
    s!("touch-none", "touch-action" => "none");
    s!("touch-manipulation", "touch-action" => "manipulation");

    // Touch action composite
    {
        let touch_val = "var(--tw-pan-x,) var(--tw-pan-y,) var(--tw-pinch-zoom,)";
        let touch_props = vec![
            prop("--tw-pan-x", None, None),
            prop("--tw-pan-y", None, None),
            prop("--tw-pinch-zoom", None, None),
        ];
        for v in ["x", "left", "right"] {
            statics.insert(format!("touch-pan-{v}"), UtilityOutput {
                declarations: vec![
                    ("--tw-pan-x".into(), format!("pan-{v}")),
                    ("touch-action".into(), touch_val.into()),
                ],
                properties: touch_props.clone(),
            });
        }
        for v in ["y", "up", "down"] {
            statics.insert(format!("touch-pan-{v}"), UtilityOutput {
                declarations: vec![
                    ("--tw-pan-y".into(), format!("pan-{v}")),
                    ("touch-action".into(), touch_val.into()),
                ],
                properties: touch_props.clone(),
            });
        }
        statics.insert("touch-pinch-zoom".into(), UtilityOutput {
            declarations: vec![
                ("--tw-pinch-zoom".into(), "pinch-zoom".into()),
                ("touch-action".into(), touch_val.into()),
            ],
            properties: touch_props.clone(),
        });
    }

    // Will change
    s!("will-change-auto", "will-change" => "auto");
    s!("will-change-scroll", "will-change" => "scroll-position");
    s!("will-change-contents", "will-change" => "contents");
    s!("will-change-transform", "will-change" => "transform");

    // Table
    s!("table-auto", "table-layout" => "auto");
    s!("table-fixed", "table-layout" => "fixed");
    s!("caption-top", "caption-side" => "top");
    s!("caption-bottom", "caption-side" => "bottom");
    s!("border-collapse", "border-collapse" => "collapse");
    s!("border-separate", "border-collapse" => "separate");

    // Font variant numeric (composite)
    {
        let fvn_val = "var(--tw-ordinal,) var(--tw-slashed-zero,) var(--tw-numeric-figure,) var(--tw-numeric-spacing,) var(--tw-numeric-fraction,)";
        let fvn_props = vec![
            prop("--tw-ordinal", None, None),
            prop("--tw-slashed-zero", None, None),
            prop("--tw-numeric-figure", None, None),
            prop("--tw-numeric-spacing", None, None),
            prop("--tw-numeric-fraction", None, None),
        ];
        s!("normal-nums", "font-variant-numeric" => "normal");
        for (name, css_prop, css_val) in [
            ("ordinal", "--tw-ordinal", "ordinal"),
            ("slashed-zero", "--tw-slashed-zero", "slashed-zero"),
            ("lining-nums", "--tw-numeric-figure", "lining-nums"),
            ("oldstyle-nums", "--tw-numeric-figure", "oldstyle-nums"),
            ("proportional-nums", "--tw-numeric-spacing", "proportional-nums"),
            ("tabular-nums", "--tw-numeric-spacing", "tabular-nums"),
            ("diagonal-fractions", "--tw-numeric-fraction", "diagonal-fractions"),
            ("stacked-fractions", "--tw-numeric-fraction", "stacked-fractions"),
        ] {
            statics.insert(name.into(), UtilityOutput {
                declarations: vec![(css_prop.into(), css_val.into()), ("font-variant-numeric".into(), fvn_val.into())],
                properties: fvn_props.clone(),
            });
        }
    }

    // Hyphens (with -webkit- prefix)
    s!("hyphens-none", "-webkit-hyphens" => "none", "hyphens" => "none");
    s!("hyphens-manual", "-webkit-hyphens" => "manual", "hyphens" => "manual");
    s!("hyphens-auto", "-webkit-hyphens" => "auto", "hyphens" => "auto");

    // Overflow wrap
    s!("wrap-normal", "overflow-wrap" => "normal");
    s!("wrap-break-word", "overflow-wrap" => "break-word");
    s!("wrap-anywhere", "overflow-wrap" => "anywhere");

    // Transform style
    s!("transform-3d", "transform-style" => "preserve-3d");
    s!("transform-flat", "transform-style" => "flat");
    s!("backface-visible", "backface-visibility" => "visible");
    s!("backface-hidden", "backface-visibility" => "hidden");

    // Box decoration
    s!("box-decoration-slice", "box-decoration-break" => "slice");
    s!("box-decoration-clone", "box-decoration-break" => "clone");

    // Mix blend mode
    s!("mix-blend-normal", "mix-blend-mode" => "normal");
    s!("mix-blend-multiply", "mix-blend-mode" => "multiply");
    s!("mix-blend-screen", "mix-blend-mode" => "screen");
    s!("mix-blend-overlay", "mix-blend-mode" => "overlay");
    s!("mix-blend-darken", "mix-blend-mode" => "darken");
    s!("mix-blend-lighten", "mix-blend-mode" => "lighten");
    s!("mix-blend-color-dodge", "mix-blend-mode" => "color-dodge");
    s!("mix-blend-color-burn", "mix-blend-mode" => "color-burn");
    s!("mix-blend-hard-light", "mix-blend-mode" => "hard-light");
    s!("mix-blend-soft-light", "mix-blend-mode" => "soft-light");
    s!("mix-blend-difference", "mix-blend-mode" => "difference");
    s!("mix-blend-exclusion", "mix-blend-mode" => "exclusion");
    s!("mix-blend-hue", "mix-blend-mode" => "hue");
    s!("mix-blend-saturation", "mix-blend-mode" => "saturation");
    s!("mix-blend-color", "mix-blend-mode" => "color");
    s!("mix-blend-luminosity", "mix-blend-mode" => "luminosity");
    s!("mix-blend-plus-darker", "mix-blend-mode" => "plus-darker");
    s!("mix-blend-plus-lighter", "mix-blend-mode" => "plus-lighter");

    // Background blend mode
    s!("bg-blend-normal", "background-blend-mode" => "normal");
    s!("bg-blend-multiply", "background-blend-mode" => "multiply");
    s!("bg-blend-screen", "background-blend-mode" => "screen");
    s!("bg-blend-overlay", "background-blend-mode" => "overlay");
    s!("bg-blend-darken", "background-blend-mode" => "darken");
    s!("bg-blend-lighten", "background-blend-mode" => "lighten");
    s!("bg-blend-color-dodge", "background-blend-mode" => "color-dodge");
    s!("bg-blend-color-burn", "background-blend-mode" => "color-burn");
    s!("bg-blend-hard-light", "background-blend-mode" => "hard-light");
    s!("bg-blend-soft-light", "background-blend-mode" => "soft-light");
    s!("bg-blend-difference", "background-blend-mode" => "difference");
    s!("bg-blend-exclusion", "background-blend-mode" => "exclusion");
    s!("bg-blend-hue", "background-blend-mode" => "hue");
    s!("bg-blend-saturation", "background-blend-mode" => "saturation");
    s!("bg-blend-color", "background-blend-mode" => "color");
    s!("bg-blend-luminosity", "background-blend-mode" => "luminosity");

    // Ring inset
    s!("ring-inset", "--tw-ring-inset" => "inset");

    // Content
    s!("content-none", "--tw-content" => "none", "content" => "none");

    // Color scheme
    s!("scheme-normal", "color-scheme" => "normal");
    s!("scheme-dark", "color-scheme" => "dark");
    s!("scheme-light", "color-scheme" => "light");
    s!("scheme-light-dark", "color-scheme" => "light dark");
    s!("scheme-only-dark", "color-scheme" => "only dark");
    s!("scheme-only-light", "color-scheme" => "only light");

    // Forced color adjust
    s!("forced-color-adjust-none", "forced-color-adjust" => "none");
    s!("forced-color-adjust-auto", "forced-color-adjust" => "auto");

    // Field sizing
    s!("field-sizing-content", "field-sizing" => "content");
    s!("field-sizing-fixed", "field-sizing" => "fixed");

    // Gradient direction
    s!("bg-gradient-to-t", "--tw-gradient-position" => "to top in oklab", "background-image" => "linear-gradient(var(--tw-gradient-stops))");
    s!("bg-gradient-to-tr", "--tw-gradient-position" => "to top right in oklab", "background-image" => "linear-gradient(var(--tw-gradient-stops))");
    s!("bg-gradient-to-r", "--tw-gradient-position" => "to right in oklab", "background-image" => "linear-gradient(var(--tw-gradient-stops))");
    s!("bg-gradient-to-br", "--tw-gradient-position" => "to bottom right in oklab", "background-image" => "linear-gradient(var(--tw-gradient-stops))");
    s!("bg-gradient-to-b", "--tw-gradient-position" => "to bottom in oklab", "background-image" => "linear-gradient(var(--tw-gradient-stops))");
    s!("bg-gradient-to-bl", "--tw-gradient-position" => "to bottom left in oklab", "background-image" => "linear-gradient(var(--tw-gradient-stops))");
    s!("bg-gradient-to-l", "--tw-gradient-position" => "to left in oklab", "background-image" => "linear-gradient(var(--tw-gradient-stops))");
    s!("bg-gradient-to-tl", "--tw-gradient-position" => "to top left in oklab", "background-image" => "linear-gradient(var(--tw-gradient-stops))");
    s!("bg-none", "background-image" => "none");
    s!("via-none", "--tw-gradient-via-stops" => "initial");

    // Background size/position/repeat/attachment/clip/origin
    s!("bg-cover", "background-size" => "cover");
    s!("bg-contain", "background-size" => "contain");
    s!("bg-auto", "background-size" => "auto");
    s!("bg-top", "background-position" => "top");
    s!("bg-bottom", "background-position" => "bottom");
    s!("bg-left", "background-position" => "left");
    s!("bg-left-bottom", "background-position" => "left bottom");
    s!("bg-left-top", "background-position" => "left top");
    s!("bg-right", "background-position" => "right");
    s!("bg-right-bottom", "background-position" => "right bottom");
    s!("bg-right-top", "background-position" => "right top");
    s!("bg-bottom-left", "background-position" => "left bottom");
    s!("bg-bottom-right", "background-position" => "right bottom");
    s!("bg-top-left", "background-position" => "left top");
    s!("bg-top-right", "background-position" => "right top");
    s!("bg-center", "background-position" => "center");
    s!("bg-no-repeat", "background-repeat" => "no-repeat");
    s!("bg-repeat", "background-repeat" => "repeat");
    s!("bg-repeat-x", "background-repeat" => "repeat-x");
    s!("bg-repeat-y", "background-repeat" => "repeat-y");
    s!("bg-repeat-round", "background-repeat" => "round");
    s!("bg-repeat-space", "background-repeat" => "space");
    s!("bg-fixed", "background-attachment" => "fixed");
    s!("bg-local", "background-attachment" => "local");
    s!("bg-scroll", "background-attachment" => "scroll");
    s!("bg-clip-text", "background-clip" => "text");
    s!("bg-clip-border", "background-clip" => "border-box");
    s!("bg-clip-padding", "background-clip" => "padding-box");
    s!("bg-clip-content", "background-clip" => "content-box");
    s!("bg-origin-border", "background-origin" => "border-box");
    s!("bg-origin-padding", "background-origin" => "padding-box");
    s!("bg-origin-content", "background-origin" => "content-box");

    // Box decoration break (decoration-clone/slice are aliases)
    s!("decoration-clone", "-webkit-box-decoration-break" => "clone", "box-decoration-break" => "clone");
    s!("decoration-slice", "-webkit-box-decoration-break" => "slice", "box-decoration-break" => "slice");

    // Break before/after/inside
    s!("break-before-auto", "break-before" => "auto");
    s!("break-before-avoid", "break-before" => "avoid");
    s!("break-before-all", "break-before" => "all");
    s!("break-before-avoid-page", "break-before" => "avoid-page");
    s!("break-before-page", "break-before" => "page");
    s!("break-before-left", "break-before" => "left");
    s!("break-before-right", "break-before" => "right");
    s!("break-before-column", "break-before" => "column");
    s!("break-after-auto", "break-after" => "auto");
    s!("break-after-avoid", "break-after" => "avoid");
    s!("break-after-all", "break-after" => "all");
    s!("break-after-avoid-page", "break-after" => "avoid-page");
    s!("break-after-page", "break-after" => "page");
    s!("break-after-left", "break-after" => "left");
    s!("break-after-right", "break-after" => "right");
    s!("break-after-column", "break-after" => "column");
    s!("break-inside-auto", "break-inside" => "auto");
    s!("break-inside-avoid", "break-inside" => "avoid");
    s!("break-inside-avoid-page", "break-inside" => "avoid-page");
    s!("break-inside-avoid-column", "break-inside" => "avoid-column");

    // Divide style (using nested selector in compiler.rs)
    s!("divide-solid", "--tw-sort" => "divide-style", "--tw-border-style" => "solid", "border-style" => "solid");
    s!("divide-dashed", "--tw-sort" => "divide-style", "--tw-border-style" => "dashed", "border-style" => "dashed");
    s!("divide-dotted", "--tw-sort" => "divide-style", "--tw-border-style" => "dotted", "border-style" => "dotted");
    s!("divide-double", "--tw-sort" => "divide-style", "--tw-border-style" => "double", "border-style" => "double");
    s!("divide-none", "--tw-sort" => "divide-style", "--tw-border-style" => "none", "border-style" => "none");

    // Divide reverse (nested selector in compiler.rs)
    s!("divide-x-reverse", "--tw-divide-x-reverse" => "1");
    s!("divide-y-reverse", "--tw-divide-y-reverse" => "1");

    // Space reverse (nested selector in compiler.rs)
    statics.insert("space-x-reverse".into(), UtilityOutput {
        declarations: vec![
            ("--tw-sort".into(), "row-gap".into()),
            ("--tw-space-x-reverse".into(), "1".into()),
        ],
        properties: vec![prop("--tw-space-x-reverse", Some("0"), None)],
    });
    statics.insert("space-y-reverse".into(), UtilityOutput {
        declarations: vec![
            ("--tw-sort".into(), "column-gap".into()),
            ("--tw-space-y-reverse".into(), "1".into()),
        ],
        properties: vec![prop("--tw-space-y-reverse", Some("0"), None)],
    });

    // Decoration thickness statics
    s!("decoration-auto", "text-decoration-thickness" => "auto");
    s!("decoration-from-font", "text-decoration-thickness" => "from-font");
    s!("underline-offset-auto", "text-underline-offset" => "auto");

    // Text color statics
    s!("text-current", "color" => "currentcolor");
    s!("text-transparent", "color" => "transparent");

    // Font stretch
    s!("font-stretch-normal", "font-stretch" => "normal");
    s!("font-stretch-ultra-condensed", "font-stretch" => "ultra-condensed");
    s!("font-stretch-extra-condensed", "font-stretch" => "extra-condensed");
    s!("font-stretch-condensed", "font-stretch" => "condensed");
    s!("font-stretch-semi-condensed", "font-stretch" => "semi-condensed");
    s!("font-stretch-semi-expanded", "font-stretch" => "semi-expanded");
    s!("font-stretch-expanded", "font-stretch" => "expanded");
    s!("font-stretch-extra-expanded", "font-stretch" => "extra-expanded");
    s!("font-stretch-ultra-expanded", "font-stretch" => "ultra-expanded");

    // Accent auto
    s!("accent-auto", "accent-color" => "auto");

    // Filter/backdrop static
    s!("filter", "filter" => CSS_FILTER_VALUE);
    s!("filter-none", "filter" => "none");
    statics.insert("blur-none".into(), UtilityOutput {
        declarations: vec![
            ("--tw-blur".into(), " ".into()),
            ("filter".into(), CSS_FILTER_VALUE.into()),
        ],
        properties: filter_properties(),
    });
    statics.insert("drop-shadow-none".into(), UtilityOutput {
        declarations: vec![
            ("--tw-drop-shadow".into(), " ".into()),
            ("filter".into(), CSS_FILTER_VALUE.into()),
        ],
        properties: filter_properties(),
    });
    statics.insert("backdrop-blur-none".into(), UtilityOutput {
        declarations: vec![
            ("--tw-backdrop-blur".into(), " ".into()),
            ("-webkit-backdrop-filter".into(), CSS_BACKDROP_FILTER_VALUE.into()),
            ("backdrop-filter".into(), CSS_BACKDROP_FILTER_VALUE.into()),
        ],
        properties: backdrop_filter_properties(),
    });
    s!("backdrop-filter", "-webkit-backdrop-filter" => CSS_BACKDROP_FILTER_VALUE, "backdrop-filter" => CSS_BACKDROP_FILTER_VALUE);
    s!("backdrop-filter-none", "-webkit-backdrop-filter" => "none", "backdrop-filter" => "none");

    // Shadow/inset-shadow/text-shadow initial
    s!("shadow-initial", "--tw-shadow-color" => "initial");
    s!("inset-shadow-initial", "--tw-inset-shadow-color" => "initial");
    statics.insert("text-shadow-initial".into(), UtilityOutput {
        declarations: vec![("--tw-text-shadow-color".into(), "initial".into())],
        properties: text_shadow_properties(),
    });

    // Fill/stroke none
    s!("fill-none", "fill" => "none");
    s!("stroke-none", "stroke" => "none");

    // Scrollbar
    s!("scrollbar-auto", "scrollbar-width" => "auto");
    s!("scrollbar-thin", "scrollbar-width" => "thin");
    s!("scrollbar-none", "scrollbar-width" => "none");
    s!("scrollbar-gutter-auto", "scrollbar-gutter" => "auto");
    s!("scrollbar-gutter-stable", "scrollbar-gutter" => "stable");
    s!("scrollbar-gutter-both", "scrollbar-gutter" => "stable both-edges");

    // Contain
    s!("contain-none", "contain" => "none");
    s!("contain-content", "contain" => "content");
    s!("contain-strict", "contain" => "strict");
    {
        let css_contain_value = "var(--tw-contain-size,) var(--tw-contain-layout,) var(--tw-contain-paint,) var(--tw-contain-style,)";
        let contain_props = vec![
            prop("--tw-contain-size", None, None),
            prop("--tw-contain-layout", None, None),
            prop("--tw-contain-paint", None, None),
            prop("--tw-contain-style", None, None),
        ];
        for (name, css_prop, css_val) in [
            ("contain-size", "--tw-contain-size", "size"),
            ("contain-inline-size", "--tw-contain-size", "inline-size"),
            ("contain-layout", "--tw-contain-layout", "layout"),
            ("contain-paint", "--tw-contain-paint", "paint"),
            ("contain-style", "--tw-contain-style", "style"),
        ] {
            statics.insert(name.into(), UtilityOutput {
                declarations: vec![(css_prop.into(), css_val.into()), ("contain".into(), css_contain_value.into())],
                properties: contain_props.clone(),
            });
        }
    }

    // Mask statics
    s!("mask-none", "mask-image" => "none");
    s!("mask-add", "mask-composite" => "add");
    s!("mask-subtract", "mask-composite" => "subtract");
    s!("mask-intersect", "mask-composite" => "intersect");
    s!("mask-exclude", "mask-composite" => "exclude");
    s!("mask-alpha", "mask-mode" => "alpha");
    s!("mask-luminance", "mask-mode" => "luminance");
    s!("mask-match", "mask-mode" => "match-source");
    s!("mask-type-alpha", "mask-type" => "alpha");
    s!("mask-type-luminance", "mask-type" => "luminance");
    s!("mask-auto", "mask-size" => "auto");
    s!("mask-cover", "mask-size" => "cover");
    s!("mask-contain", "mask-size" => "contain");
    s!("mask-center", "mask-position" => "center");
    s!("mask-top", "mask-position" => "top");
    s!("mask-top-left", "mask-position" => "left top");
    s!("mask-top-right", "mask-position" => "right top");
    s!("mask-bottom", "mask-position" => "bottom");
    s!("mask-bottom-left", "mask-position" => "left bottom");
    s!("mask-bottom-right", "mask-position" => "right bottom");
    s!("mask-left", "mask-position" => "left");
    s!("mask-right", "mask-position" => "right");
    s!("mask-repeat", "mask-repeat" => "repeat");
    s!("mask-no-repeat", "mask-repeat" => "no-repeat");
    s!("mask-repeat-x", "mask-repeat" => "repeat-x");
    s!("mask-repeat-y", "mask-repeat" => "repeat-y");
    s!("mask-repeat-round", "mask-repeat" => "round");
    s!("mask-repeat-space", "mask-repeat" => "space");
    s!("mask-clip-border", "mask-clip" => "border-box");
    s!("mask-clip-padding", "mask-clip" => "padding-box");
    s!("mask-clip-content", "mask-clip" => "content-box");
    s!("mask-clip-fill", "mask-clip" => "fill-box");
    s!("mask-clip-stroke", "mask-clip" => "stroke-box");
    s!("mask-clip-view", "mask-clip" => "view-box");
    s!("mask-no-clip", "mask-clip" => "no-clip");
    s!("mask-origin-border", "mask-origin" => "border-box");
    s!("mask-origin-padding", "mask-origin" => "padding-box");
    s!("mask-origin-content", "mask-origin" => "content-box");
    s!("mask-origin-fill", "mask-origin" => "fill-box");
    s!("mask-origin-stroke", "mask-origin" => "stroke-box");
    s!("mask-origin-view", "mask-origin" => "view-box");

    // Mask radial shape/size/position
    s!("mask-circle", "--tw-mask-radial-shape" => "circle");
    s!("mask-ellipse", "--tw-mask-radial-shape" => "ellipse");
    s!("mask-radial-closest-side", "--tw-mask-radial-size" => "closest-side");
    s!("mask-radial-farthest-side", "--tw-mask-radial-size" => "farthest-side");
    s!("mask-radial-closest-corner", "--tw-mask-radial-size" => "closest-corner");
    s!("mask-radial-farthest-corner", "--tw-mask-radial-size" => "farthest-corner");
    s!("mask-radial-at-top", "--tw-mask-radial-position" => "top");
    s!("mask-radial-at-top-left", "--tw-mask-radial-position" => "top left");
    s!("mask-radial-at-top-right", "--tw-mask-radial-position" => "top right");
    s!("mask-radial-at-bottom", "--tw-mask-radial-position" => "bottom");
    s!("mask-radial-at-bottom-left", "--tw-mask-radial-position" => "bottom left");
    s!("mask-radial-at-bottom-right", "--tw-mask-radial-position" => "bottom right");
    s!("mask-radial-at-left", "--tw-mask-radial-position" => "left");
    s!("mask-radial-at-right", "--tw-mask-radial-position" => "right");
    s!("mask-radial-at-center", "--tw-mask-radial-position" => "center");

    // Rotate/scale/translate statics
    s!("rotate-none", "rotate" => "none");
    s!("scale-none", "scale" => "none");
    statics.insert("scale-3d".into(), UtilityOutput {
        declarations: vec![
            ("scale".into(), "var(--tw-scale-x) var(--tw-scale-y) var(--tw-scale-z)".into()),
        ],
        properties: scale_properties(),
    });
    s!("translate-none", "translate" => "none");
    for (name, decls) in [
        ("translate-full", vec![("--tw-translate-x".into(), "100%".into()), ("--tw-translate-y".into(), "100%".into()), ("translate".into(), "var(--tw-translate-x) var(--tw-translate-y)".into())]),
        ("-translate-full", vec![("--tw-translate-x".into(), "-100%".into()), ("--tw-translate-y".into(), "-100%".into()), ("translate".into(), "var(--tw-translate-x) var(--tw-translate-y)".into())]),
        ("translate-x-full", vec![("--tw-translate-x".into(), "100%".into()), ("translate".into(), "var(--tw-translate-x) var(--tw-translate-y)".into())]),
        ("-translate-x-full", vec![("--tw-translate-x".into(), "-100%".into()), ("translate".into(), "var(--tw-translate-x) var(--tw-translate-y)".into())]),
        ("translate-y-full", vec![("--tw-translate-y".into(), "100%".into()), ("translate".into(), "var(--tw-translate-x) var(--tw-translate-y)".into())]),
        ("-translate-y-full", vec![("--tw-translate-y".into(), "-100%".into()), ("translate".into(), "var(--tw-translate-x) var(--tw-translate-y)".into())]),
    ] {
        statics.insert(name.into(), UtilityOutput {
            declarations: decls,
            properties: translate_properties(),
        });
    }
    statics.insert("translate-3d".into(), UtilityOutput {
        declarations: vec![
            ("translate".into(), "var(--tw-translate-x) var(--tw-translate-y) var(--tw-translate-z)".into()),
        ],
        properties: translate_properties(),
    });

    // SR only
    s!("sr-only", "position" => "absolute", "width" => "1px", "height" => "1px", "padding" => "0", "margin" => "-1px", "overflow" => "hidden", "clip-path" => "inset(50%)", "white-space" => "nowrap", "border-width" => "0");
    s!("not-sr-only", "position" => "static", "width" => "auto", "height" => "auto", "padding" => "0", "margin" => "0", "overflow" => "visible", "clip-path" => "none", "white-space" => "normal");

    // Size statics
    for (suffix, value) in [
        ("full", "100%"), ("svw", "100svw"), ("lvw", "100lvw"), ("dvw", "100dvw"),
        ("svh", "100svh"), ("lvh", "100lvh"), ("dvh", "100dvh"),
        ("min", "min-content"), ("max", "max-content"), ("fit", "fit-content"),
    ] {
        s!(format!("w-{suffix}"), "width" => value);
        s!(format!("h-{suffix}"), "height" => value);
        s!(format!("min-w-{suffix}"), "min-width" => value);
        s!(format!("min-h-{suffix}"), "min-height" => value);
        s!(format!("max-w-{suffix}"), "max-width" => value);
        s!(format!("max-h-{suffix}"), "max-height" => value);
        s!(format!("size-{suffix}"), "width" => value, "height" => value);
    }
    s!("w-auto", "width" => "auto");
    s!("h-auto", "height" => "auto");
    s!("min-w-auto", "min-width" => "auto");
    s!("min-h-auto", "min-height" => "auto");
    s!("size-auto", "width" => "auto", "height" => "auto");
    s!("w-screen", "width" => "100vw");
    s!("h-screen", "height" => "100vh");
    s!("min-w-screen", "min-width" => "100vw");
    s!("min-h-screen", "min-height" => "100vh");
    s!("max-w-screen", "max-width" => "100vw");
    s!("max-h-screen", "max-height" => "100vh");
    s!("max-w-none", "max-width" => "none");
    s!("max-w-prose", "max-width" => "65ch");
    s!("max-h-none", "max-height" => "none");
    s!("h-lh", "height" => "1lh");
    s!("min-h-lh", "min-height" => "1lh");
    s!("max-h-lh", "max-height" => "1lh");

    // Inline-size / block-size statics
    for (suffix, value) in [
        ("full", "100%"), ("min", "min-content"), ("max", "max-content"), ("fit", "fit-content"),
    ] {
        s!(format!("inline-{suffix}"), "inline-size" => value);
        s!(format!("block-{suffix}"), "block-size" => value);
        s!(format!("min-inline-{suffix}"), "min-inline-size" => value);
        s!(format!("min-block-{suffix}"), "min-block-size" => value);
        s!(format!("max-inline-{suffix}"), "max-inline-size" => value);
        s!(format!("max-block-{suffix}"), "max-block-size" => value);
    }
    for (suffix, value) in [("svw", "100svw"), ("lvw", "100lvw"), ("dvw", "100dvw")] {
        s!(format!("inline-{suffix}"), "inline-size" => value);
        s!(format!("min-inline-{suffix}"), "min-inline-size" => value);
        s!(format!("max-inline-{suffix}"), "max-inline-size" => value);
    }
    for (suffix, value) in [("svh", "100svh"), ("lvh", "100lvh"), ("dvh", "100dvh")] {
        s!(format!("block-{suffix}"), "block-size" => value);
        s!(format!("min-block-{suffix}"), "min-block-size" => value);
        s!(format!("max-block-{suffix}"), "max-block-size" => value);
    }
    s!("inline-auto", "inline-size" => "auto");
    s!("block-auto", "block-size" => "auto");
    s!("min-inline-auto", "min-inline-size" => "auto");
    s!("min-block-auto", "min-block-size" => "auto");
    s!("block-lh", "block-size" => "1lh");
    s!("min-block-lh", "min-block-size" => "1lh");
    s!("max-block-lh", "max-block-size" => "1lh");
    s!("inline-screen", "inline-size" => "100vw");
    s!("min-inline-screen", "min-inline-size" => "100vw");
    s!("max-inline-screen", "max-inline-size" => "100vw");
    s!("block-screen", "block-size" => "100vh");
    s!("min-block-screen", "min-block-size" => "100vh");
    s!("max-block-screen", "max-block-size" => "100vh");
    s!("max-inline-none", "max-inline-size" => "none");
    s!("max-block-none", "max-block-size" => "none");

    // Inset statics
    for (prefix, prop) in [
        ("inset", "inset"), ("inset-x", "inset-inline"), ("inset-y", "inset-block"),
        ("inset-s", "inset-inline-start"), ("inset-e", "inset-inline-end"),
        ("inset-bs", "inset-block-start"), ("inset-be", "inset-block-end"),
        ("top", "top"), ("right", "right"), ("bottom", "bottom"), ("left", "left"),
    ] {
        s!(format!("{prefix}-auto"), prop => "auto");
        s!(format!("{prefix}-full"), prop => "100%");
        s!(format!("-{prefix}-full"), prop => "-100%");
        s!(format!("{prefix}-px"), prop => "1px");
        s!(format!("-{prefix}-px"), prop => "-1px");
    }

    // px units for spacing utilities
    for (prefix, prop) in [
        ("m", "margin"), ("p", "padding"),
        ("gap", "gap"),
    ] {
        s!(format!("{prefix}-px"), prop => "1px");
    }
    s!("w-px", "width" => "1px");
    s!("h-px", "height" => "1px");

    // Margin statics
    for prefix in ["m", "mx", "my", "ms", "me", "mbs", "mbe", "mt", "mr", "mb", "ml"] {
        let prop = match prefix {
            "m" => "margin", "mx" => "margin-inline", "my" => "margin-block",
            "ms" => "margin-inline-start", "me" => "margin-inline-end",
            "mbs" => "margin-block-start", "mbe" => "margin-block-end",
            "mt" => "margin-top", "mr" => "margin-right",
            "mb" => "margin-bottom", "ml" => "margin-left",
            _ => unreachable!(),
        };
        s!(format!("{prefix}-auto"), prop => "auto");
        s!(format!("{prefix}-px"), prop => "1px");
        s!(format!("-{prefix}-px"), prop => "-1px");
    }

    // Border color statics
    s!("border-current", "border-color" => "currentcolor");
    s!("border-transparent", "border-color" => "transparent");

    // Border width statics
    s!("border", "border-style" => "var(--tw-border-style)", "border-width" => "1px");
    s!("border-x", "border-inline-style" => "var(--tw-border-style)", "border-inline-width" => "1px");
    s!("border-y", "border-block-style" => "var(--tw-border-style)", "border-block-width" => "1px");
    s!("border-s", "border-inline-start-style" => "var(--tw-border-style)", "border-inline-start-width" => "1px");
    s!("border-e", "border-inline-end-style" => "var(--tw-border-style)", "border-inline-end-width" => "1px");
    s!("border-t", "border-top-style" => "var(--tw-border-style)", "border-top-width" => "1px");
    s!("border-r", "border-right-style" => "var(--tw-border-style)", "border-right-width" => "1px");
    s!("border-b", "border-bottom-style" => "var(--tw-border-style)", "border-bottom-width" => "1px");
    s!("border-l", "border-left-style" => "var(--tw-border-style)", "border-left-width" => "1px");

    // Opacity 0/100
    s!("opacity-0", "opacity" => "0%");
    s!("opacity-100", "opacity" => "100%");

    // Functional utilities
    for name in [
        "p", "px", "py", "ps", "pe", "pt", "pr", "pb", "pl",
        "pbs", "pbe",
        "m", "mx", "my", "ms", "me", "mt", "mr", "mb", "ml",
        "mbs", "mbe",
        "w", "h", "min-w", "min-h", "max-w", "max-h", "size",
        "gap", "gap-x", "gap-y",
        "inset", "inset-x", "inset-y", "inset-s", "inset-e", "inset-bs", "inset-be",
        "top", "right", "bottom", "left",
        "text", "font", "tracking", "leading",
        "rounded", "rounded-t", "rounded-r", "rounded-b", "rounded-l",
        "rounded-tl", "rounded-tr", "rounded-br", "rounded-bl",
        "rounded-s", "rounded-e", "rounded-ss", "rounded-se", "rounded-es", "rounded-ee",
        "border", "border-x", "border-y", "border-s", "border-e",
        "border-t", "border-r", "border-b", "border-l",
        "opacity",
        "z",
        "order",
        "col-span", "col", "col-start", "col-end",
        "row-span", "row", "row-start", "row-end",
        "grid-cols", "grid-rows",
        "basis",
        "grow", "shrink",
        "bg", "from", "via", "to",
        "fill", "stroke",
        "shadow", "inset-shadow", "ring", "ring-offset", "inset-ring",
        "blur", "brightness", "contrast", "grayscale", "invert", "saturate", "sepia",
        "hue-rotate", "drop-shadow",
        "backdrop-blur", "backdrop-brightness", "backdrop-contrast",
        "backdrop-grayscale", "backdrop-hue-rotate", "backdrop-invert",
        "backdrop-saturate", "backdrop-sepia", "backdrop-opacity",
        "transition", "duration", "ease", "delay",
        "scale", "scale-x", "scale-y", "scale-z",
        "rotate", "rotate-x", "rotate-y", "rotate-z",
        "translate", "translate-x", "translate-y", "translate-z",
        "skew", "skew-x", "skew-y",
        "origin",
        "accent", "caret",
        "outline-offset",
        "decoration",
        "underline-offset",
        "columns", "aspect",
        "line-clamp",
        "scroll-m", "scroll-mx", "scroll-my", "scroll-ms", "scroll-me",
        "scroll-mt", "scroll-mr", "scroll-mb", "scroll-ml",
        "scroll-p", "scroll-px", "scroll-py", "scroll-ps", "scroll-pe",
        "scroll-pt", "scroll-pr", "scroll-pb", "scroll-pl",
        "indent",
        "divide-x", "divide-y", "divide",
        "space-x", "space-y", "text-indent",
        "content", "outline",
        "mix-blend", "bg-blend",
        "object", "flex",
        "border-spacing", "border-spacing-x", "border-spacing-y",
        "animate", "perspective", "perspective-origin",
        "auto-cols", "auto-rows",
        "list", "list-image",
        "tab", "font-stretch", "align",
        "will-change", "cursor", "contain",
        "zoom",
        "scrollbar-thumb", "scrollbar-track",
        "inline", "min-inline", "max-inline",
        "block", "min-block", "max-block",
        "bg-linear", "bg-conic", "bg-radial",
        "bg-size", "bg-position",
        "mask-size", "mask-position", "mask",
        "mask-linear", "mask-conic", "mask-radial", "mask-radial-at",
        "mask-t-from", "mask-t-to", "mask-b-from", "mask-b-to",
        "mask-l-from", "mask-l-to", "mask-r-from", "mask-r-to",
        "mask-conic-from",
        "from-position", "via-position", "to-position",
        "font-features", "placeholder", "text-shadow",
    ] {
        functionals.insert(name.into());
    }

    // Also register negative functional variants
    for name in [
        "m", "mx", "my", "ms", "me", "mbs", "mbe", "mt", "mr", "mb", "ml",
        "inset", "inset-x", "inset-y", "inset-s", "inset-e", "inset-bs", "inset-be",
        "top", "right", "bottom", "left",
        "z", "order", "col", "col-start", "col-end", "row", "row-start", "row-end",
        "translate", "translate-x", "translate-y", "translate-z",
        "rotate", "rotate-x", "rotate-y", "rotate-z",
        "skew", "skew-x", "skew-y",
        "scale-z",
        "scroll-m", "scroll-mx", "scroll-my", "scroll-ms", "scroll-me",
        "scroll-mt", "scroll-mr", "scroll-mb", "scroll-ml",
        "indent",
        "hue-rotate", "backdrop-hue-rotate",
        "bg-linear", "bg-conic",
    ] {
        functionals.insert(format!("-{name}"));
    }

    UtilityRegistry { statics, functionals }
}

fn compile_functional(
    root: &str,
    value: Option<&CandidateValue>,
    modifier: Option<&CandidateModifier>,
    negative: bool,
    theme: &Theme,
) -> Option<CssDeclarations> {
    // @container has special value handling — doesn't use resolve_value
    if root == "@container" {
        let ct_value = match value {
            None => "inline-size".to_string(),
            Some(CandidateValue::Arbitrary { value: v, .. }) => v.clone(),
            Some(CandidateValue::Named { value: v, .. }) => {
                match v.as_str() {
                    "normal" => "normal".to_string(),
                    "size" => "size".to_string(),
                    _ => return None,
                }
            }
        };
        let mut decls = vec![("container-type".into(), ct_value)];
        if let Some(m) = modifier {
            decls.push(("container-name".into(), modifier_to_string(m)));
        }
        return Some(decls);
    }

    let resolved = resolve_value(root, value, negative, theme)?;

    match root.trim_start_matches('-') {
        // Padding
        "p" => Some(vec![("padding".into(), resolved)]),
        "px" => Some(vec![("padding-inline".into(), resolved)]),
        "py" => Some(vec![("padding-block".into(), resolved)]),
        "ps" => Some(vec![("padding-inline-start".into(), resolved)]),
        "pe" => Some(vec![("padding-inline-end".into(), resolved)]),
        "pbs" => Some(vec![("padding-block-start".into(), resolved)]),
        "pbe" => Some(vec![("padding-block-end".into(), resolved)]),
        "pt" => Some(vec![("padding-top".into(), resolved)]),
        "pr" => Some(vec![("padding-right".into(), resolved)]),
        "pb" => Some(vec![("padding-bottom".into(), resolved)]),
        "pl" => Some(vec![("padding-left".into(), resolved)]),

        // Margin
        "m" => Some(vec![("margin".into(), resolved)]),
        "mx" => Some(vec![("margin-inline".into(), resolved)]),
        "my" => Some(vec![("margin-block".into(), resolved)]),
        "ms" => Some(vec![("margin-inline-start".into(), resolved)]),
        "me" => Some(vec![("margin-inline-end".into(), resolved)]),
        "mbs" => Some(vec![("margin-block-start".into(), resolved)]),
        "mbe" => Some(vec![("margin-block-end".into(), resolved)]),
        "mt" => Some(vec![("margin-top".into(), resolved)]),
        "mr" => Some(vec![("margin-right".into(), resolved)]),
        "mb" => Some(vec![("margin-bottom".into(), resolved)]),
        "ml" => Some(vec![("margin-left".into(), resolved)]),

        // Width/Height/Size
        "w" => Some(vec![("width".into(), resolved)]),
        "h" => Some(vec![("height".into(), resolved)]),
        "min-w" => Some(vec![("min-width".into(), resolved)]),
        "min-h" => Some(vec![("min-height".into(), resolved)]),
        "max-w" => Some(vec![("max-width".into(), resolved)]),
        "max-h" => Some(vec![("max-height".into(), resolved)]),
        "size" => Some(vec![("width".into(), resolved.clone()), ("height".into(), resolved)]),

        // Inline-size / block-size
        "inline" => Some(vec![("inline-size".into(), resolved)]),
        "min-inline" => Some(vec![("min-inline-size".into(), resolved)]),
        "max-inline" => Some(vec![("max-inline-size".into(), resolved)]),
        "block" => Some(vec![("block-size".into(), resolved)]),
        "min-block" => Some(vec![("min-block-size".into(), resolved)]),
        "max-block" => Some(vec![("max-block-size".into(), resolved)]),

        // Gap
        "gap" => Some(vec![("gap".into(), resolved)]),
        "gap-x" => Some(vec![("column-gap".into(), resolved)]),
        "gap-y" => Some(vec![("row-gap".into(), resolved)]),

        // Inset
        "inset" => Some(vec![("inset".into(), resolved)]),
        "inset-x" => Some(vec![("inset-inline".into(), resolved)]),
        "inset-y" => Some(vec![("inset-block".into(), resolved)]),
        "inset-s" => Some(vec![("inset-inline-start".into(), resolved)]),
        "inset-e" => Some(vec![("inset-inline-end".into(), resolved)]),
        "inset-bs" => Some(vec![("inset-block-start".into(), resolved)]),
        "inset-be" => Some(vec![("inset-block-end".into(), resolved)]),
        "top" => Some(vec![("top".into(), resolved)]),
        "right" => Some(vec![("right".into(), resolved)]),
        "bottom" => Some(vec![("bottom".into(), resolved)]),
        "left" => Some(vec![("left".into(), resolved)]),

        // Typography
        "text" => compile_text(&resolved, value, modifier, theme),
        "font" => compile_font(&resolved, value, theme),
        "tracking" => Some(vec![
            ("--tw-tracking".into(), resolved.clone()),
            ("letter-spacing".into(), resolved),
        ]),
        "leading" => Some(vec![
            ("--tw-leading".into(), resolved.clone()),
            ("line-height".into(), resolved),
        ]),

        // Border radius
        "rounded" => Some(vec![("border-radius".into(), resolved)]),
        "rounded-t" => Some(vec![("border-top-left-radius".into(), resolved.clone()), ("border-top-right-radius".into(), resolved)]),
        "rounded-r" => Some(vec![("border-top-right-radius".into(), resolved.clone()), ("border-bottom-right-radius".into(), resolved)]),
        "rounded-b" => Some(vec![("border-bottom-right-radius".into(), resolved.clone()), ("border-bottom-left-radius".into(), resolved)]),
        "rounded-l" => Some(vec![("border-top-left-radius".into(), resolved.clone()), ("border-bottom-left-radius".into(), resolved)]),
        "rounded-tl" => Some(vec![("border-top-left-radius".into(), resolved)]),
        "rounded-tr" => Some(vec![("border-top-right-radius".into(), resolved)]),
        "rounded-br" => Some(vec![("border-bottom-right-radius".into(), resolved)]),
        "rounded-bl" => Some(vec![("border-bottom-left-radius".into(), resolved)]),
        "rounded-s" => Some(vec![("border-start-start-radius".into(), resolved.clone()), ("border-end-start-radius".into(), resolved)]),
        "rounded-e" => Some(vec![("border-start-end-radius".into(), resolved.clone()), ("border-end-end-radius".into(), resolved)]),
        "rounded-ss" => Some(vec![("border-start-start-radius".into(), resolved)]),
        "rounded-se" => Some(vec![("border-start-end-radius".into(), resolved)]),
        "rounded-es" => Some(vec![("border-end-start-radius".into(), resolved)]),
        "rounded-ee" => Some(vec![("border-end-end-radius".into(), resolved)]),

        // Border width / color
        "border" => compile_border("border-width", "border-color", &resolved, value, modifier, theme),
        "border-x" => compile_border("border-inline-width", "border-inline-color", &resolved, value, modifier, theme),
        "border-y" => compile_border("border-block-width", "border-block-color", &resolved, value, modifier, theme),
        "border-s" => compile_border("border-inline-start-width", "border-inline-start-color", &resolved, value, modifier, theme),
        "border-e" => compile_border("border-inline-end-width", "border-inline-end-color", &resolved, value, modifier, theme),
        "border-t" => compile_border("border-top-width", "border-top-color", &resolved, value, modifier, theme),
        "border-r" => compile_border("border-right-width", "border-right-color", &resolved, value, modifier, theme),
        "border-b" => compile_border("border-bottom-width", "border-bottom-color", &resolved, value, modifier, theme),
        "border-l" => compile_border("border-left-width", "border-left-color", &resolved, value, modifier, theme),

        // Opacity
        "opacity" => Some(vec![("opacity".into(), resolved)]),

        // Z-index
        "z" => Some(vec![("z-index".into(), resolved)]),

        // Order
        "order" => Some(vec![("order".into(), resolved)]),

        // Grid
        "col-span" => {
            if resolved.contains('/') {
                Some(vec![("grid-column".into(), resolved)])
            } else {
                Some(vec![("grid-column".into(), format!("span {} / span {}", resolved, resolved))])
            }
        }
        "col" => Some(vec![("grid-column".into(), resolved)]),
        "col-start" => Some(vec![("grid-column-start".into(), resolved)]),
        "col-end" => Some(vec![("grid-column-end".into(), resolved)]),
        "row-span" => {
            if resolved.contains('/') {
                Some(vec![("grid-row".into(), resolved)])
            } else {
                Some(vec![("grid-row".into(), format!("span {} / span {}", resolved, resolved))])
            }
        }
        "row" => Some(vec![("grid-row".into(), resolved)]),
        "row-start" => Some(vec![("grid-row-start".into(), resolved)]),
        "row-end" => Some(vec![("grid-row-end".into(), resolved)]),
        "grid-cols" => {
            if let Ok(n) = resolved.parse::<u32>() {
                Some(vec![("grid-template-columns".into(), format!("repeat({n}, minmax(0, 1fr))"))])
            } else {
                Some(vec![("grid-template-columns".into(), resolved)])
            }
        }
        "grid-rows" => {
            if let Ok(n) = resolved.parse::<u32>() {
                Some(vec![("grid-template-rows".into(), format!("repeat({n}, minmax(0, 1fr))"))])
            } else {
                Some(vec![("grid-template-rows".into(), resolved)])
            }
        }

        // Flex basis
        "basis" => Some(vec![("flex-basis".into(), resolved)]),
        "grow" => Some(vec![("flex-grow".into(), resolved)]),
        "shrink" => Some(vec![("flex-shrink".into(), resolved)]),

        // Colors
        "bg" => {
            if let Some(CandidateValue::Arbitrary { data_type: Some(dt), .. }) = value {
                match dt.as_str() {
                    "length" | "size" => return Some(vec![("background-size".into(), resolved)]),
                    "position" => return Some(vec![("background-position".into(), resolved)]),
                    "url" | "image" => return Some(vec![("background-image".into(), resolved)]),
                    "color" => return Some(vec![("background-color".into(), resolve_color_value(&resolved, modifier, theme))]),
                    _ => {}
                }
            }
            if is_color_like(&resolved) || resolved.starts_with("var(--") {
                Some(vec![("background-color".into(), resolve_color_value(&resolved, modifier, theme))])
            } else if resolved.contains("-gradient(") || resolved.starts_with("url(") || resolved.starts_with("image(") {
                Some(vec![("background-image".into(), resolved)])
            } else {
                Some(vec![("background-color".into(), resolve_color_value(&resolved, modifier, theme))])
            }
        }
        "from" => {
            if resolved.ends_with('%') && !is_color_like(&resolved) {
                return Some(vec![("--tw-gradient-from-position".into(), resolved)]);
            }
            let color = resolve_color_value(&resolved, modifier, theme);
            Some(vec![
                ("--tw-sort".into(), "--tw-gradient-from".into()),
                ("--tw-gradient-from".into(), color),
                ("--tw-gradient-stops".into(), "var(--tw-gradient-via-stops, var(--tw-gradient-position), var(--tw-gradient-from) var(--tw-gradient-from-position), var(--tw-gradient-to) var(--tw-gradient-to-position))".into()),
            ])
        }
        "via" => {
            if resolved.ends_with('%') && !is_color_like(&resolved) {
                return Some(vec![("--tw-gradient-via-position".into(), resolved)]);
            }
            let color = resolve_color_value(&resolved, modifier, theme);
            Some(vec![
                ("--tw-sort".into(), "--tw-gradient-via".into()),
                ("--tw-gradient-via".into(), color),
                ("--tw-gradient-via-stops".into(), "var(--tw-gradient-position), var(--tw-gradient-from) var(--tw-gradient-from-position), var(--tw-gradient-via) var(--tw-gradient-via-position), var(--tw-gradient-to) var(--tw-gradient-to-position)".into()),
                ("--tw-gradient-stops".into(), "var(--tw-gradient-via-stops)".into()),
            ])
        }
        "to" => {
            if resolved.ends_with('%') && !is_color_like(&resolved) {
                return Some(vec![("--tw-gradient-to-position".into(), resolved)]);
            }
            let color = resolve_color_value(&resolved, modifier, theme);
            Some(vec![
                ("--tw-sort".into(), "--tw-gradient-to".into()),
                ("--tw-gradient-to".into(), color),
                ("--tw-gradient-stops".into(), "var(--tw-gradient-via-stops, var(--tw-gradient-position), var(--tw-gradient-from) var(--tw-gradient-from-position), var(--tw-gradient-to) var(--tw-gradient-to-position))".into()),
            ])
        }
        "fill" => Some(vec![("fill".into(), resolve_color_value(&resolved, modifier, theme))]),
        "stroke" => {
            if is_color_like(&resolved) || named_value_is_color(value, theme) {
                Some(vec![("stroke".into(), resolve_color_value(&resolved, modifier, theme))])
            } else {
                Some(vec![("stroke-width".into(), resolved.clone())])
            }
        }
        "accent" => Some(vec![("accent-color".into(), resolve_color_value(&resolved, modifier, theme))]),
        "caret" => Some(vec![("caret-color".into(), resolve_color_value(&resolved, modifier, theme))]),
        "decoration" => {
            if is_color_like(&resolved) || named_value_is_color(value, theme) {
                Some(vec![("text-decoration-color".into(), resolve_color_value(&resolved, modifier, theme))])
            } else {
                let w = to_px_if_bare(&resolved);
                Some(vec![("text-decoration-thickness".into(), w)])
            }
        }

        // Shadow
        "shadow" => {
            if is_color_like(&resolved) || named_value_is_color(value, theme) {
                let color = resolve_color_value(&resolved, modifier, theme);
                Some(resolve_shadow_color(&color, "--tw-shadow-color", "--tw-shadow-alpha", theme))
            } else {
                let raw_val = resolve_shadow_raw(&resolved, "--shadow", theme);
                let shadow_val = if raw_val == "0 0 #0000" {
                    raw_val
                } else {
                    replace_shadow_colors(&raw_val, "var(--tw-shadow-color, ", ")")
                };
                Some(vec![
                    ("--tw-shadow".into(), shadow_val),
                    ("box-shadow".into(), "var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow)".into()),
                ])
            }
        }
        "inset-shadow" => {
            if is_color_like(&resolved) || named_value_is_color(value, theme) {
                let color = resolve_color_value(&resolved, modifier, theme);
                Some(resolve_shadow_color(&color, "--tw-inset-shadow-color", "--tw-inset-shadow-alpha", theme))
            } else {
                let raw_val = resolve_shadow_raw(&resolved, "--inset-shadow", theme);
                let shadow_val = if raw_val == "0 0 #0000" {
                    format!("inset {}", raw_val)
                } else {
                    let replaced = replace_shadow_colors(&raw_val, "var(--tw-inset-shadow-color, ", ")");
                    if replaced.starts_with("inset ") {
                        replaced
                    } else {
                        format!("inset {}", replaced)
                    }
                };
                Some(vec![
                    ("--tw-inset-shadow".into(), shadow_val),
                    ("box-shadow".into(), "var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow)".into()),
                ])
            }
        }
        "ring" => {
            if is_color_like(&resolved) || named_value_is_color(value, theme) {
                Some(vec![("--tw-ring-color".into(), resolve_color_value(&resolved, modifier, theme))])
            } else {
                let w = to_px_if_bare(&resolved);
                Some(vec![
                    ("--tw-ring-shadow".into(), format!("var(--tw-ring-inset,) 0 0 0 calc({} + var(--tw-ring-offset-width)) var(--tw-ring-color, currentcolor)", w)),
                    ("box-shadow".into(), "var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow)".into()),
                ])
            }
        }
        "ring-offset" => {
            if is_color_like(&resolved) || named_value_is_color(value, theme) {
                Some(vec![("--tw-ring-offset-color".into(), resolve_color_value(&resolved, modifier, theme))])
            } else {
                let w = to_px_if_bare(&resolved);
                Some(vec![
                    ("--tw-ring-offset-width".into(), w),
                    ("--tw-ring-offset-shadow".into(), "var(--tw-ring-inset,) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color)".into()),
                ])
            }
        }

        // Filters (composite system)
        "blur" => {
            let val = theme.resolve_with_key(&format!("--blur-{}", resolved))
                .map(|v| format!("blur({})", v))
                .unwrap_or_else(|| format!("blur({})", resolved));
            Some(vec![
                ("--tw-blur".into(), val),
                ("filter".into(), CSS_FILTER_VALUE.into()),
            ])
        }
        "brightness" => {
            let val = ensure_percent(&resolved);
            Some(vec![
                ("--tw-brightness".into(), format!("brightness({})", val)),
                ("filter".into(), CSS_FILTER_VALUE.into()),
            ])
        }
        "contrast" => {
            let val = ensure_percent(&resolved);
            Some(vec![
                ("--tw-contrast".into(), format!("contrast({})", val)),
                ("filter".into(), CSS_FILTER_VALUE.into()),
            ])
        }
        "grayscale" => {
            let val = ensure_percent(&resolved);
            Some(vec![
                ("--tw-grayscale".into(), format!("grayscale({})", val)),
                ("filter".into(), CSS_FILTER_VALUE.into()),
            ])
        }
        "invert" => {
            let val = ensure_percent(&resolved);
            Some(vec![
                ("--tw-invert".into(), format!("invert({})", val)),
                ("filter".into(), CSS_FILTER_VALUE.into()),
            ])
        }
        "saturate" => {
            let val = ensure_percent(&resolved);
            Some(vec![
                ("--tw-saturate".into(), format!("saturate({})", val)),
                ("filter".into(), CSS_FILTER_VALUE.into()),
            ])
        }
        "sepia" => {
            let val = ensure_percent(&resolved);
            Some(vec![
                ("--tw-sepia".into(), format!("sepia({})", val)),
                ("filter".into(), CSS_FILTER_VALUE.into()),
            ])
        }
        "hue-rotate" => {
            let val = ensure_deg(&resolved, negative);
            Some(vec![
                ("--tw-hue-rotate".into(), format!("hue-rotate({})", val)),
                ("filter".into(), CSS_FILTER_VALUE.into()),
            ])
        }
        "drop-shadow" => {
            if is_color_like(&resolved) {
                let color = resolve_color_value(&resolved, modifier, theme);
                Some(vec![("--tw-drop-shadow-color".into(), color)])
            } else {
                let raw_val = resolve_shadow_raw(&resolved, "--drop-shadow", theme);
                let size_val = replace_shadow_colors(&raw_val, "var(--tw-drop-shadow-color, ", ")");
                let drop_shadow_val = if resolved.starts_with("var(") {
                    format!("drop-shadow({})", resolved)
                } else if matches!(value, Some(CandidateValue::Arbitrary { .. })) {
                    "var(--tw-drop-shadow-size)".to_string()
                } else {
                    wrap_drop_shadow_layers_raw(&raw_val)
                };
                Some(vec![
                    ("--tw-drop-shadow-size".into(), wrap_drop_shadow_layers(&size_val)),
                    ("--tw-drop-shadow".into(), drop_shadow_val),
                    ("filter".into(), CSS_FILTER_VALUE.into()),
                ])
            }
        }

        // Backdrop filters (composite system)
        "backdrop-blur" => {
            let val = theme.resolve_with_key(&format!("--blur-{}", resolved))
                .map(|v| format!("blur({})", v))
                .unwrap_or_else(|| format!("blur({})", resolved));
            Some(vec![
                ("--tw-backdrop-blur".into(), val),
                ("-webkit-backdrop-filter".into(), CSS_BACKDROP_FILTER_VALUE.into()),
                ("backdrop-filter".into(), CSS_BACKDROP_FILTER_VALUE.into()),
            ])
        }
        "backdrop-brightness" => {
            let val = ensure_percent(&resolved);
            Some(vec![
                ("--tw-backdrop-brightness".into(), format!("brightness({})", val)),
                ("-webkit-backdrop-filter".into(), CSS_BACKDROP_FILTER_VALUE.into()),
                ("backdrop-filter".into(), CSS_BACKDROP_FILTER_VALUE.into()),
            ])
        }
        "backdrop-contrast" => {
            let val = ensure_percent(&resolved);
            Some(vec![
                ("--tw-backdrop-contrast".into(), format!("contrast({})", val)),
                ("-webkit-backdrop-filter".into(), CSS_BACKDROP_FILTER_VALUE.into()),
                ("backdrop-filter".into(), CSS_BACKDROP_FILTER_VALUE.into()),
            ])
        }
        "backdrop-grayscale" => {
            let val = ensure_percent(&resolved);
            Some(vec![
                ("--tw-backdrop-grayscale".into(), format!("grayscale({})", val)),
                ("-webkit-backdrop-filter".into(), CSS_BACKDROP_FILTER_VALUE.into()),
                ("backdrop-filter".into(), CSS_BACKDROP_FILTER_VALUE.into()),
            ])
        }
        "backdrop-invert" => {
            let val = ensure_percent(&resolved);
            Some(vec![
                ("--tw-backdrop-invert".into(), format!("invert({})", val)),
                ("-webkit-backdrop-filter".into(), CSS_BACKDROP_FILTER_VALUE.into()),
                ("backdrop-filter".into(), CSS_BACKDROP_FILTER_VALUE.into()),
            ])
        }
        "backdrop-saturate" => {
            let val = ensure_percent(&resolved);
            Some(vec![
                ("--tw-backdrop-saturate".into(), format!("saturate({})", val)),
                ("-webkit-backdrop-filter".into(), CSS_BACKDROP_FILTER_VALUE.into()),
                ("backdrop-filter".into(), CSS_BACKDROP_FILTER_VALUE.into()),
            ])
        }
        "backdrop-sepia" => {
            let val = ensure_percent(&resolved);
            Some(vec![
                ("--tw-backdrop-sepia".into(), format!("sepia({})", val)),
                ("-webkit-backdrop-filter".into(), CSS_BACKDROP_FILTER_VALUE.into()),
                ("backdrop-filter".into(), CSS_BACKDROP_FILTER_VALUE.into()),
            ])
        }
        "backdrop-opacity" => {
            let val = ensure_percent(&resolved);
            Some(vec![
                ("--tw-backdrop-opacity".into(), format!("opacity({})", val)),
                ("-webkit-backdrop-filter".into(), CSS_BACKDROP_FILTER_VALUE.into()),
                ("backdrop-filter".into(), CSS_BACKDROP_FILTER_VALUE.into()),
            ])
        }

        // Transition
        "transition" => {
            Some(vec![
                ("transition-property".into(), resolved),
                ("transition-timing-function".into(), "var(--tw-ease, var(--default-transition-timing-function))".into()),
                ("transition-duration".into(), "var(--tw-duration, var(--default-transition-duration))".into()),
            ])
        }
        "duration" => {
            let val = if resolved.ends_with("ms") || resolved.ends_with("s") || resolved.starts_with("var(") {
                resolved.clone()
            } else {
                format!("{}ms", resolved)
            };
            Some(vec![
                ("--tw-duration".into(), val.clone()),
                ("transition-duration".into(), val),
            ])
        }
        "delay" => {
            let val = if resolved.ends_with("ms") || resolved.ends_with("s") || resolved.starts_with("var(") {
                resolved.clone()
            } else {
                format!("{}ms", resolved)
            };
            Some(vec![("transition-delay".into(), val)])
        }
        "ease" => {
            let val = theme.resolve_with_key(&format!("--ease-{}", resolved)).unwrap_or(resolved);
            Some(vec![
                ("--tw-ease".into(), val.clone()),
                ("transition-timing-function".into(), val),
            ])
        }

        // Transform
        "scale" => {
            if matches!(value, Some(CandidateValue::Arbitrary { .. })) {
                return Some(vec![("scale".into(), resolved)]);
            }
            let pct = if resolved.ends_with('%') || resolved.starts_with("var(") || resolved.starts_with("calc(") {
                resolved.clone()
            } else {
                format!("{}%", resolved)
            };
            Some(vec![
                ("--tw-scale-x".into(), pct.clone()),
                ("--tw-scale-y".into(), pct.clone()),
                ("--tw-scale-z".into(), pct),
                ("scale".into(), "var(--tw-scale-x) var(--tw-scale-y)".into()),
            ])
        }
        "scale-x" => {
            let pct = ensure_percent_negatable(&resolved, negative);
            Some(vec![("--tw-scale-x".into(), pct), ("scale".into(), "var(--tw-scale-x) var(--tw-scale-y)".into())])
        }
        "scale-y" => {
            let pct = ensure_percent_negatable(&resolved, negative);
            Some(vec![("--tw-scale-y".into(), pct), ("scale".into(), "var(--tw-scale-x) var(--tw-scale-y)".into())])
        }
        "rotate" => {
            if negative {
                let base = resolved.strip_prefix("calc(").and_then(|s| s.strip_suffix(" * -1)"));
                if let Some(base) = base {
                    let val = if base.ends_with("deg") || base.ends_with("rad") || base.ends_with("turn") || base.ends_with("grad") || base.starts_with("var(") || base.starts_with("calc(") {
                        base.to_string()
                    } else {
                        format!("{}deg", base)
                    };
                    return Some(vec![("rotate".into(), format!("calc({} * -1)", val))]);
                }
            }
            let val = if resolved.ends_with("deg") || resolved.ends_with("rad") || resolved.ends_with("turn") || resolved.ends_with("grad") || resolved.starts_with("var(") || resolved.starts_with("calc(") {
                resolved.clone()
            } else {
                format!("{}deg", resolved)
            };
            Some(vec![("rotate".into(), val)])
        }
        "translate-x" => Some(vec![("--tw-translate-x".into(), resolved.clone()), ("translate".into(), "var(--tw-translate-x) var(--tw-translate-y)".into())]),
        "translate-y" => Some(vec![("--tw-translate-y".into(), resolved.clone()), ("translate".into(), "var(--tw-translate-x) var(--tw-translate-y)".into())]),
        "skew-x" => {
            let val = ensure_deg(&resolved, negative);
            Some(vec![
                ("--tw-skew-x".into(), format!("skewX({})", val)),
                ("transform".into(), "var(--tw-rotate-x,) var(--tw-rotate-y,) var(--tw-rotate-z,) var(--tw-skew-x,) var(--tw-skew-y,)".into()),
            ])
        }
        "skew-y" => {
            let val = ensure_deg(&resolved, negative);
            Some(vec![
                ("--tw-skew-y".into(), format!("skewY({})", val)),
                ("transform".into(), "var(--tw-rotate-x,) var(--tw-rotate-y,) var(--tw-rotate-z,) var(--tw-skew-x,) var(--tw-skew-y,)".into()),
            ])
        }

        // Outline
        "outline-offset" => Some(vec![("outline-offset".into(), to_px_if_bare(&resolved))]),

        // Underline offset
        "underline-offset" => Some(vec![("text-underline-offset".into(), to_px_if_bare(&resolved))]),

        // Columns
        "columns" => Some(vec![("columns".into(), resolved)]),
        "aspect" => Some(vec![("aspect-ratio".into(), resolved)]),
        "line-clamp" => {
            if resolved == "unset" {
                Some(vec![
                    ("overflow".into(), "visible".into()),
                    ("display".into(), "block".into()),
                    ("-webkit-box-orient".into(), "horizontal".into()),
                    ("-webkit-line-clamp".into(), "unset".into()),
                ])
            } else {
                Some(vec![
                    ("overflow".into(), "hidden".into()),
                    ("display".into(), "-webkit-box".into()),
                    ("-webkit-box-orient".into(), "vertical".into()),
                    ("-webkit-line-clamp".into(), resolved),
                ])
            }
        }

        // Scroll margin
        "scroll-m" => Some(vec![("scroll-margin".into(), resolved)]),
        "scroll-mx" => Some(vec![("scroll-margin-inline".into(), resolved)]),
        "scroll-my" => Some(vec![("scroll-margin-block".into(), resolved)]),
        "scroll-mt" => Some(vec![("scroll-margin-top".into(), resolved)]),
        "scroll-mr" => Some(vec![("scroll-margin-right".into(), resolved)]),
        "scroll-mb" => Some(vec![("scroll-margin-bottom".into(), resolved)]),
        "scroll-ml" => Some(vec![("scroll-margin-left".into(), resolved)]),

        // Scroll padding
        "scroll-p" => Some(vec![("scroll-padding".into(), resolved)]),
        "scroll-px" => Some(vec![("scroll-padding-inline".into(), resolved)]),
        "scroll-py" => Some(vec![("scroll-padding-block".into(), resolved)]),
        "scroll-pt" => Some(vec![("scroll-padding-top".into(), resolved)]),
        "scroll-pr" => Some(vec![("scroll-padding-right".into(), resolved)]),
        "scroll-pb" => Some(vec![("scroll-padding-bottom".into(), resolved)]),
        "scroll-pl" => Some(vec![("scroll-padding-left".into(), resolved)]),

        // Text indent
        "indent" => Some(vec![("text-indent".into(), resolved)]),
        "text-indent" => None,

        // Divide (width with nested selector in compiler.rs, or color)
        "divide-x" => {
            let w = to_px_if_bare(&resolved);
            Some(vec![
                ("--tw-sort".into(), "divide-x-width".into()),
                ("--tw-divide-x-reverse".into(), "0".into()),
                ("border-inline-style".into(), "var(--tw-border-style)".into()),
                ("border-inline-start-width".into(), format!("calc({} * var(--tw-divide-x-reverse))", w)),
                ("border-inline-end-width".into(), format!("calc({} * calc(1 - var(--tw-divide-x-reverse)))", w)),
            ])
        }
        "divide-y" => {
            let w = to_px_if_bare(&resolved);
            Some(vec![
                ("--tw-sort".into(), "divide-y-width".into()),
                ("--tw-divide-y-reverse".into(), "0".into()),
                ("border-bottom-style".into(), "var(--tw-border-style)".into()),
                ("border-top-style".into(), "var(--tw-border-style)".into()),
                ("border-top-width".into(), format!("calc({} * var(--tw-divide-y-reverse))", w)),
                ("border-bottom-width".into(), format!("calc({} * calc(1 - var(--tw-divide-y-reverse)))", w)),
            ])
        }
        "divide" => {
            if is_color_like(&resolved) {
                Some(vec![
                    ("--tw-sort".into(), "divide-color".into()),
                    ("border-color".into(), resolve_color_value(&resolved, modifier, theme)),
                ])
            } else {
                None
            }
        }

        // Space between (value passed to compiler for nested rule building)
        "space-x" => Some(vec![("__space_value__".into(), resolved)]),
        "space-y" => Some(vec![("__space_value__".into(), resolved)]),

        // Content
        "content" => Some(vec![
            ("--tw-content".into(), resolved),
            ("content".into(), "var(--tw-content)".into()),
        ]),

        // Outline width/color
        "outline" => {
            if is_color_like(&resolved) || named_value_is_color(value, theme) {
                Some(vec![("outline-color".into(), resolve_color_value(&resolved, modifier, theme))])
            } else {
                let w = to_px_if_bare(&resolved);
                Some(vec![
                    ("outline-style".into(), "var(--tw-outline-style)".into()),
                    ("outline-width".into(), w),
                ])
            }
        }

        // Mix blend mode
        "mix-blend" => Some(vec![("mix-blend-mode".into(), resolved)]),
        "bg-blend" => Some(vec![("background-blend-mode".into(), resolved)]),

        // Object position functional
        "object" => Some(vec![("object-position".into(), resolved)]),

        // Flex functional
        "flex" => Some(vec![("flex".into(), resolved)]),

        // Transform origin
        "origin" => Some(vec![("transform-origin".into(), resolved)]),

        // Grid auto columns/rows
        "auto-cols" => Some(vec![("grid-auto-columns".into(), resolved)]),
        "auto-rows" => Some(vec![("grid-auto-rows".into(), resolved)]),

        // Border spacing (using custom properties)
        "border-spacing" => Some(vec![
            ("--tw-border-spacing-x".into(), resolved.clone()),
            ("--tw-border-spacing-y".into(), resolved),
            ("border-spacing".into(), "var(--tw-border-spacing-x) var(--tw-border-spacing-y)".into()),
        ]),
        "border-spacing-x" => Some(vec![
            ("--tw-border-spacing-x".into(), resolved),
            ("border-spacing".into(), "var(--tw-border-spacing-x) var(--tw-border-spacing-y)".into()),
        ]),
        "border-spacing-y" => Some(vec![
            ("--tw-border-spacing-y".into(), resolved),
            ("border-spacing".into(), "var(--tw-border-spacing-x) var(--tw-border-spacing-y)".into()),
        ]),

        // Perspective
        "perspective" => {
            if resolved == "none" {
                Some(vec![("perspective".into(), "none".into())])
            } else {
                Some(vec![("perspective".into(), resolved)])
            }
        }

        // Animation
        "animate" => {
            let val = theme.resolve_for_utility(&format!("--animate-{}", resolved)).unwrap_or(resolved);
            Some(vec![("animation".into(), val)])
        }

        // Inset ring
        "inset-ring" => {
            if is_color_like(&resolved) || named_value_is_color(value, theme) {
                Some(vec![("--tw-inset-ring-color".into(), resolve_color_value(&resolved, modifier, theme))])
            } else {
                let w = to_px_if_bare(&resolved);
                Some(vec![
                    ("--tw-inset-ring-shadow".into(), format!("inset 0 0 0 {} var(--tw-inset-ring-color, currentcolor)", w)),
                    ("box-shadow".into(), "var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow)".into()),
                ])
            }
        }

        // Backdrop hue-rotate
        "backdrop-hue-rotate" => {
            let val = if resolved.ends_with("deg") { resolved.clone() } else { format!("{}deg", resolved) };
            Some(vec![
                ("--tw-backdrop-hue-rotate".into(), format!("hue-rotate({})", val)),
                ("-webkit-backdrop-filter".into(), CSS_BACKDROP_FILTER_VALUE.into()),
                ("backdrop-filter".into(), CSS_BACKDROP_FILTER_VALUE.into()),
            ])
        }

        // 3D transforms
        "translate" => {
            Some(vec![
                ("--tw-translate-x".into(), resolved.clone()),
                ("--tw-translate-y".into(), resolved),
                ("translate".into(), "var(--tw-translate-x) var(--tw-translate-y)".into()),
            ])
        }
        "translate-z" => Some(vec![
            ("--tw-translate-z".into(), resolved),
            ("translate".into(), "var(--tw-translate-x) var(--tw-translate-y) var(--tw-translate-z)".into()),
        ]),
        "rotate-x" => {
            let val = if resolved.ends_with("deg") || resolved.starts_with("var(") { resolved.clone() } else { format!("{}deg", resolved) };
            Some(vec![
                ("--tw-rotate-x".into(), format!("rotateX({})", val)),
                ("transform".into(), "var(--tw-rotate-x,) var(--tw-rotate-y,) var(--tw-rotate-z,) var(--tw-skew-x,) var(--tw-skew-y,)".into()),
            ])
        }
        "rotate-y" => {
            let val = if resolved.ends_with("deg") || resolved.starts_with("var(") { resolved.clone() } else { format!("{}deg", resolved) };
            Some(vec![
                ("--tw-rotate-y".into(), format!("rotateY({})", val)),
                ("transform".into(), "var(--tw-rotate-x,) var(--tw-rotate-y,) var(--tw-rotate-z,) var(--tw-skew-x,) var(--tw-skew-y,)".into()),
            ])
        }
        "rotate-z" => {
            let val = if resolved.ends_with("deg") || resolved.starts_with("var(") { resolved.clone() } else { format!("{}deg", resolved) };
            Some(vec![
                ("--tw-rotate-z".into(), format!("rotateZ({})", val)),
                ("transform".into(), "var(--tw-rotate-x,) var(--tw-rotate-y,) var(--tw-rotate-z,) var(--tw-skew-x,) var(--tw-skew-y,)".into()),
            ])
        }
        "scale-z" => {
            let pct = if resolved.ends_with('%') || resolved.starts_with("var(") { resolved.clone() } else { format!("{}%", resolved) };
            Some(vec![("--tw-scale-z".into(), pct), ("scale".into(), "var(--tw-scale-x) var(--tw-scale-y) var(--tw-scale-z)".into())])
        }
        "skew" => {
            let val = ensure_deg(&resolved, negative);
            Some(vec![
                ("--tw-skew-x".into(), format!("skewX({})", val.clone())),
                ("--tw-skew-y".into(), format!("skewY({})", val)),
                ("transform".into(), "var(--tw-rotate-x,) var(--tw-rotate-y,) var(--tw-rotate-z,) var(--tw-skew-x,) var(--tw-skew-y,)".into()),
            ])
        }

        // Zoom
        "zoom" => {
            let val = if resolved.ends_with('%') || resolved.starts_with("var(") { resolved.clone() } else { format!("{}%", resolved) };
            Some(vec![("zoom".into(), val)])
        }

        // Perspective origin
        "perspective-origin" => Some(vec![("perspective-origin".into(), resolved)]),

        // List style
        "list" => Some(vec![("list-style-type".into(), resolved)]),
        "list-image" => Some(vec![("list-style-image".into(), resolved)]),

        // Tab size
        "tab" => Some(vec![("tab-size".into(), resolved)]),

        // Font stretch functional
        "font-stretch" => Some(vec![("font-stretch".into(), resolved)]),

        // Vertical align functional
        "align" => Some(vec![("vertical-align".into(), resolved)]),

        // Will change functional
        "will-change" => Some(vec![("will-change".into(), resolved)]),

        // Cursor functional
        "cursor" => {
            let val = theme.resolve_with_key(&format!("--cursor-{}", resolved)).unwrap_or(resolved);
            Some(vec![("cursor".into(), val)])
        }

        // Contain functional
        "contain" => Some(vec![("contain".into(), resolved)]),

        // Scrollbar color
        "scrollbar-thumb" => {
            let color = resolve_color_value(&resolved, modifier, theme);
            Some(vec![
                ("--tw-scrollbar-thumb".into(), color),
                ("scrollbar-color".into(), "var(--tw-scrollbar-thumb) var(--tw-scrollbar-track)".into()),
            ])
        }
        "scrollbar-track" => {
            let color = resolve_color_value(&resolved, modifier, theme);
            Some(vec![
                ("--tw-scrollbar-track".into(), color),
                ("scrollbar-color".into(), "var(--tw-scrollbar-thumb) var(--tw-scrollbar-track)".into()),
            ])
        }

        // Scroll margin/padding logical
        "scroll-ms" => Some(vec![("scroll-margin-inline-start".into(), resolved)]),
        "scroll-me" => Some(vec![("scroll-margin-inline-end".into(), resolved)]),
        "scroll-ps" => Some(vec![("scroll-padding-inline-start".into(), resolved)]),
        "scroll-pe" => Some(vec![("scroll-padding-inline-end".into(), resolved)]),

        // Background size/position functional
        "bg-size" => Some(vec![("background-size".into(), resolved)]),
        "bg-position" => Some(vec![("background-position".into(), resolved)]),

        // Mask size/position functional
        "mask-size" => Some(vec![("mask-size".into(), resolved)]),
        "mask-position" => Some(vec![("mask-position".into(), resolved)]),

        // Gradient stop positions
        "from-position" => Some(vec![("--tw-gradient-from-position".into(), resolved)]),
        "via-position" => Some(vec![("--tw-gradient-via-position".into(), resolved)]),
        "to-position" => Some(vec![("--tw-gradient-to-position".into(), resolved)]),

        // Background gradients (linear, conic, radial)
        "bg-linear" => {
            if let Some(CandidateValue::Arbitrary { .. }) = value {
                Some(vec![
                    ("--tw-gradient-position".into(), resolved.clone()),
                    ("background-image".into(), format!("linear-gradient(var(--tw-gradient-stops,{}))", resolved)),
                ])
            } else {
                Some(vec![
                    ("--tw-gradient-position".into(), resolved.clone()),
                    ("@supports-gradient:--tw-gradient-position".into(), format!("{} in oklab", resolved)),
                    ("background-image".into(), "linear-gradient(var(--tw-gradient-stops))".into()),
                ])
            }
        }
        "bg-radial" => {
            if matches!(value, Some(CandidateValue::Arbitrary { .. })) {
                Some(vec![
                    ("--tw-gradient-position".into(), resolved.clone()),
                    ("background-image".into(), format!("radial-gradient(var(--tw-gradient-stops,{}))", resolved)),
                ])
            } else {
                Some(vec![
                    ("background-image".into(), "radial-gradient(in oklab, var(--tw-gradient-stops))".into()),
                ])
            }
        }
        "bg-conic" => {
            if matches!(value, Some(CandidateValue::Arbitrary { .. })) {
                Some(vec![
                    ("--tw-gradient-position".into(), resolved.clone()),
                    ("background-image".into(), format!("conic-gradient(var(--tw-gradient-stops,{}))", resolved)),
                ])
            } else {
                let angle = if resolved.ends_with("deg") || resolved.starts_with("var(") { resolved.clone() } else { format!("{}deg", resolved) };
                Some(vec![
                    ("background-image".into(), format!("conic-gradient(from {} in oklab, var(--tw-gradient-stops))", angle)),
                ])
            }
        }

        // Font feature settings
        "font-features" => Some(vec![("font-feature-settings".into(), resolved)]),

        // Placeholder color (nested ::placeholder rule handled in compiler)
        "placeholder" => {
            let color = resolve_color_value(&resolved, modifier, theme);
            Some(vec![
                ("__placeholder_color__".into(), color),
            ])
        }

        // Text shadow
        "text-shadow" => {
            if is_color_like(&resolved) {
                let color = resolve_color_value(&resolved, modifier, theme);
                Some(resolve_shadow_color(&color, "--tw-text-shadow-color", "--tw-text-shadow-alpha", theme))
            } else {
                let raw_val = resolve_shadow_raw(&resolved, "--text-shadow", theme);
                let shadow_val = replace_shadow_colors(&raw_val, "var(--tw-text-shadow-color, ", ")");
                Some(vec![("text-shadow".into(), shadow_val)])
            }
        }

        // Mask (arbitrary values only for now)
        "mask" => Some(vec![("mask-image".into(), resolved)]),

        // Mask gradient directions
        "mask-linear" => {
            let direction = if resolved.ends_with("deg") || resolved.starts_with("var(") || resolved.starts_with("calc(") {
                resolved.clone()
            } else {
                format!("to {}", resolved.replace('-', " "))
            };
            Some(vec![
                ("mask-image".into(), "var(--tw-mask-linear), var(--tw-mask-radial), var(--tw-mask-conic)".into()),
                ("mask-composite".into(), "intersect".into()),
                ("--tw-mask-linear".into(), "linear-gradient(var(--tw-mask-linear-stops, var(--tw-mask-linear-position)))".into()),
                ("--tw-mask-linear-position".into(), direction),
            ])
        }
        "mask-radial" => {
            Some(vec![
                ("mask-image".into(), "var(--tw-mask-linear), var(--tw-mask-radial), var(--tw-mask-conic)".into()),
                ("mask-composite".into(), "intersect".into()),
                ("--tw-mask-radial".into(), "radial-gradient(var(--tw-mask-radial-stops, var(--tw-mask-radial-size)))".into()),
                ("--tw-mask-radial-size".into(), resolved),
            ])
        }
        "mask-radial-at" => {
            Some(vec![
                ("--tw-mask-radial-position".into(), resolved),
            ])
        }
        "mask-conic" => {
            let angle = if resolved.ends_with("deg") || resolved.starts_with("var(") { resolved.clone() } else { format!("{}deg", resolved) };
            Some(vec![
                ("mask-image".into(), "var(--tw-mask-linear), var(--tw-mask-radial), var(--tw-mask-conic)".into()),
                ("mask-composite".into(), "intersect".into()),
                ("--tw-mask-conic".into(), format!("conic-gradient(var(--tw-mask-conic-stops, from {} var(--tw-mask-conic-position, )))", angle)),
            ])
        }
        "mask-conic-from" => {
            Some(vec![
                ("mask-image".into(), "var(--tw-mask-linear), var(--tw-mask-radial), var(--tw-mask-conic)".into()),
                ("mask-composite".into(), "intersect".into()),
                ("--tw-mask-conic-stops".into(), "from var(--tw-mask-conic-position), var(--tw-mask-conic-from-color) var(--tw-mask-conic-from-position), var(--tw-mask-conic-to-color) var(--tw-mask-conic-to-position)".into()),
                ("--tw-mask-conic".into(), "conic-gradient(var(--tw-mask-conic-stops))".into()),
                ("--tw-mask-conic-from-position".into(), format!("calc(var(--spacing) * {})", resolved)),
            ])
        }

        // Directional mask utilities
        "mask-t-from" | "mask-t-to" | "mask-b-from" | "mask-b-to"
        | "mask-l-from" | "mask-l-to" | "mask-r-from" | "mask-r-to" => {
            let (dir, prop_type) = if root.starts_with("mask-t-") {
                ("top", &root[7..])
            } else if root.starts_with("mask-b-") {
                ("bottom", &root[7..])
            } else if root.starts_with("mask-l-") {
                ("left", &root[7..])
            } else {
                ("right", &root[7..])
            };
            let color = if is_color_like(&resolved) {
                resolve_color_value(&resolved, modifier, theme)
            } else {
                resolved
            };
            let gradient_var = format!("--tw-mask-{}", dir);
            let gradient_val = format!(
                "linear-gradient(to {d}, var(--tw-mask-{d}-from-color) var(--tw-mask-{d}-from-position), var(--tw-mask-{d}-to-color) var(--tw-mask-{d}-to-position))",
                d = dir
            );
            let color_prop = format!("--tw-mask-{}-{}-color", dir, prop_type);
            Some(vec![
                ("mask-image".into(), "var(--tw-mask-linear), var(--tw-mask-radial), var(--tw-mask-conic)".into()),
                ("mask-composite".into(), "intersect".into()),
                ("--tw-mask-linear".into(), "var(--tw-mask-left), var(--tw-mask-right), var(--tw-mask-bottom), var(--tw-mask-top)".into()),
                (gradient_var, gradient_val),
                (color_prop, color),
            ])
        }

        _ => None,
    }
}

fn to_px_if_bare(value: &str) -> String {
    if value.parse::<f64>().is_ok() && !value.contains(|c: char| c.is_alphabetic() || c == '%') {
        format!("{}px", value)
    } else {
        value.to_string()
    }
}

fn ensure_deg(value: &str, negative: bool) -> String {
    if value.ends_with("deg") || value.ends_with("rad") || value.ends_with("turn") || value.ends_with("grad") || value.starts_with("var(") {
        return value.to_string();
    }
    if negative {
        if let Some(inner) = value.strip_prefix("calc(").and_then(|s| s.strip_suffix(" * -1)")) {
            return format!("calc({}deg * -1)", inner);
        }
    }
    format!("{}deg", value)
}

fn ensure_percent_negatable(value: &str, negative: bool) -> String {
    if value.ends_with('%') || value.starts_with("var(") || value.starts_with("calc(") {
        if negative {
            if let Some(inner) = value.strip_prefix("calc(").and_then(|s| s.strip_suffix(" * -1)")) {
                return format!("calc({}% * -1)", inner);
            }
        }
        return value.to_string();
    }
    if negative {
        if let Some(inner) = value.strip_prefix("calc(").and_then(|s| s.strip_suffix(" * -1)")) {
            return format!("calc({}% * -1)", inner);
        }
    }
    format!("{}%", value)
}

fn ensure_percent(value: &str) -> String {
    if value.ends_with('%') || value.starts_with("var(") {
        value.to_string()
    } else {
        format!("{}%", value)
    }
}

fn resolve_value(
    root: &str,
    value: Option<&CandidateValue>,
    negative: bool,
    theme: &Theme,
) -> Option<String> {
    let val = match value {
        Some(CandidateValue::Arbitrary { value, .. }) => resolve_theme_in_value(value, theme),
        Some(CandidateValue::Named { value, fraction, .. }) => {
            let base_root = root.trim_start_matches('-');

            // Try theme resolution with appropriate namespace — return var() reference
            let namespaces = get_theme_namespaces(base_root);
            let mut resolved = None;

            for ns in &namespaces {
                let key = format!("{}-{}", ns, value);
                if let Some(val) = theme.resolve_for_utility(&key) {
                    resolved = Some(val);
                    break;
                }
            }

            // Try fraction for sizing utilities (before spacing, so w-1/2 = 50%)
            if resolved.is_none() && supports_fraction(base_root) {
                if let Some(f) = fraction {
                    let parts: Vec<&str> = f.split('/').collect();
                    if parts.len() == 2 {
                        if let (Ok(num), Ok(den)) = (parts[0].parse::<f64>(), parts[1].parse::<f64>()) {
                            if den > 0.0 {
                                resolved = Some(format!("calc({} / {} * 100%)", num, den));
                            }
                        }
                    }
                }
            }

            // Try spacing multiplier for spacing-based utilities — use var(--spacing) reference
            if resolved.is_none() && is_spacing_utility(base_root) {
                if theme.get_spacing_multiplier().is_some() {
                    if is_valid_spacing_value(value) {
                        resolved = Some(format!("calc(var(--spacing) * {})", value));
                    }
                }
            }

            // Try direct bare integer value
            if resolved.is_none() && is_bare_value_utility(base_root) {
                if value.parse::<f64>().is_ok() {
                    resolved = Some(value.clone());
                }
            }

            // Percentage passthrough (e.g., from-10% → "10%")
            if resolved.is_none() && value.ends_with('%') {
                let num_part = &value[..value.len() - 1];
                if num_part.parse::<f64>().is_ok() {
                    resolved = Some(value.clone());
                }
            }

            // Static value fallbacks
            if resolved.is_none() {
                resolved = get_static_value(base_root, value);
            }

            resolved?
        }
        None => {
            // Default value for utilities like `rounded` (no value segment)
            let base_root = root.trim_start_matches('-');
            get_default_value(base_root, theme)?
        }
    };

    if negative {
        Some(negate_value(&val))
    } else {
        Some(val)
    }
}

fn get_theme_namespaces(root: &str) -> Vec<&'static str> {
    match root {
        "p" | "px" | "py" | "ps" | "pe" | "pbs" | "pbe" | "pt" | "pr" | "pb" | "pl" => vec!["--padding", "--spacing"],
        "m" | "mx" | "my" | "ms" | "me" | "mbs" | "mbe" | "mt" | "mr" | "mb" | "ml" => vec!["--margin", "--spacing"],
        "w" | "min-w" | "max-w" => vec!["--width", "--container", "--spacing"],
        "h" | "min-h" | "max-h" => vec!["--height", "--spacing"],
        "size" => vec!["--size", "--spacing"],
        "inline" | "min-inline" | "max-inline" => vec!["--spacing", "--container"],
        "block" | "min-block" | "max-block" => vec!["--spacing"],
        "gap" | "gap-x" | "gap-y" => vec!["--gap", "--spacing"],
        "inset" | "inset-x" | "inset-y" | "inset-s" | "inset-e" | "inset-bs" | "inset-be"
        | "top" | "right" | "bottom" | "left" => vec!["--inset", "--spacing"],
        "text" => vec!["--text", "--color", "--font-size"],
        "font" => vec!["--font-weight", "--font"],
        "tracking" => vec!["--tracking"],
        "leading" => vec!["--leading"],
        "rounded" | "rounded-t" | "rounded-r" | "rounded-b" | "rounded-l"
        | "rounded-tl" | "rounded-tr" | "rounded-br" | "rounded-bl"
        | "rounded-s" | "rounded-e" | "rounded-ss" | "rounded-se" | "rounded-es" | "rounded-ee" => vec!["--radius"],
        "border" | "border-x" | "border-y" | "border-s" | "border-e"
        | "border-t" | "border-r" | "border-b" | "border-l" => vec!["--border-width", "--color-border", "--color"],
        "opacity" => vec!["--opacity"],
        "z" => vec!["--z-index"],
        "order" => vec!["--order"],
        "basis" => vec!["--basis", "--spacing"],
        "bg" => vec!["--color", "--background-color"],
        "from" | "via" | "to" => vec!["--color"],
        "fill" => vec!["--fill", "--color"],
        "shadow" => vec!["--shadow", "--box-shadow-color", "--color"],
        "inset-shadow" => vec!["--inset-shadow", "--color"],
        "inset-ring" => vec!["--ring-color", "--color"],
        "blur" => vec!["--blur"],
        "duration" => vec!["--duration"],
        "delay" => vec!["--delay"],
        "ease" => vec!["--ease"],
        "scale" | "scale-x" | "scale-y" | "scale-z" => vec!["--scale"],
        "rotate" | "rotate-x" | "rotate-y" | "rotate-z" => vec!["--rotate"],
        "translate" | "translate-x" | "translate-y" | "translate-z" => vec!["--translate", "--spacing"],
        "skew" | "skew-x" | "skew-y" => vec!["--skew"],
        "accent" => vec!["--accent-color", "--color"],
        "caret" => vec!["--caret-color", "--color"],
        "decoration" => vec!["--text-decoration-color", "--color"],
        "columns" => vec!["--columns", "--container"],
        "aspect" => vec!["--aspect"],
        "line-clamp" => vec!["--line-clamp"],
        "indent" => vec!["--indent", "--spacing"],
        "outline-offset" => vec!["--outline-offset"],
        "underline-offset" => vec!["--underline-offset"],
        "grid-cols" => vec!["--grid-template-columns"],
        "grid-rows" => vec!["--grid-template-rows"],
        "col-span" | "col" | "col-start" | "col-end" => vec!["--grid-column"],
        "row-span" | "row" | "row-start" | "row-end" => vec!["--grid-row"],
        "scroll-m" | "scroll-mx" | "scroll-my" | "scroll-ms" | "scroll-me"
        | "scroll-mt" | "scroll-mr" | "scroll-mb" | "scroll-ml" => vec!["--scroll-margin", "--spacing"],
        "scroll-p" | "scroll-px" | "scroll-py" | "scroll-ps" | "scroll-pe"
        | "scroll-pt" | "scroll-pr" | "scroll-pb" | "scroll-pl" => vec!["--scroll-padding", "--spacing"],
        "divide-x" | "divide-y" => vec!["--divide-width", "--border-width"],
        "divide" => vec!["--divide-color", "--border-color", "--color"],
        "space-x" | "space-y" => vec!["--space", "--spacing"],
        "grow" => vec!["--flex-grow"],
        "shrink" => vec!["--flex-shrink"],
        "auto-cols" => vec!["--grid-auto-columns"],
        "auto-rows" => vec!["--grid-auto-rows"],
        "origin" => vec!["--transform-origin"],
        "animate" => vec!["--animate"],
        "border-spacing" | "border-spacing-x" | "border-spacing-y" => vec!["--border-spacing", "--spacing"],
        "content" => vec!["--content"],
        "outline" => vec!["--outline-width", "--outline-color", "--color"],
        "mix-blend" => vec!["--mix-blend-mode"],
        "bg-blend" => vec!["--background-blend-mode"],
        "perspective" => vec!["--perspective"],
        "perspective-origin" => vec!["--perspective-origin"],
        "hue-rotate" => vec!["--hue-rotate"],
        "backdrop-hue-rotate" => vec!["--backdrop-hue-rotate"],
        "drop-shadow" => vec!["--drop-shadow"],
        "brightness" => vec!["--brightness"],
        "contrast" => vec!["--contrast"],
        "grayscale" | "invert" | "saturate" | "sepia" => vec![],
        "backdrop-blur" => vec!["--backdrop-blur", "--blur"],
        "backdrop-brightness" | "backdrop-contrast" | "backdrop-grayscale"
        | "backdrop-invert" | "backdrop-saturate" | "backdrop-sepia" | "backdrop-opacity" => vec![],
        "flex" => vec!["--flex"],
        "list" => vec!["--list-style-type"],
        "list-image" => vec!["--list-style-image"],
        "object" => vec!["--object-position"],
        "stroke" => vec!["--stroke-width", "--color"],
        "ring" => vec!["--ring-width", "--color"],
        "ring-offset" => vec!["--ring-offset-width", "--ring-offset-color", "--color"],
        "tab" => vec!["--tab-size"],
        "font-stretch" => vec!["--font-stretch"],
        "align" => vec!["--vertical-align"],
        "will-change" => vec![],
        "cursor" => vec!["--cursor"],
        "contain" => vec![],
        "zoom" => vec!["--zoom"],
        "scrollbar-thumb" | "scrollbar-track" => vec!["--color"],
        "bg-linear" => vec!["--gradient-direction"],
        "bg-conic" | "bg-radial" => vec![],
        "bg-size" => vec!["--background-size"],
        "bg-position" => vec!["--background-position"],
        "mask-size" => vec!["--mask-size"],
        "mask-position" => vec!["--mask-position"],
        "from-position" | "via-position" | "to-position" => vec![],
        "font-features" => vec![],
        "placeholder" => vec!["--placeholder-color", "--color"],
        "text-shadow" => vec!["--text-shadow", "--text-shadow-color", "--color"],
        "mask" => vec![],
        "mask-linear" => vec![],
        "mask-conic" => vec![],
        "mask-radial" => vec![],
        "mask-radial-at" => vec!["--mask-radial-position"],
        "mask-t-from" | "mask-t-to" | "mask-b-from" | "mask-b-to"
        | "mask-l-from" | "mask-l-to" | "mask-r-from" | "mask-r-to" => vec!["--color"],
        "mask-conic-from" => vec![],
        _ => vec![],
    }
}

fn is_spacing_utility(root: &str) -> bool {
    matches!(root,
        "p" | "px" | "py" | "ps" | "pe" | "pt" | "pr" | "pb" | "pl" |
        "pbs" | "pbe" |
        "m" | "mx" | "my" | "ms" | "me" | "mt" | "mr" | "mb" | "ml" |
        "mbs" | "mbe" |
        "w" | "h" | "min-w" | "min-h" | "max-w" | "max-h" | "size" |
        "inline" | "min-inline" | "max-inline" |
        "block" | "min-block" | "max-block" |
        "gap" | "gap-x" | "gap-y" |
        "inset" | "inset-x" | "inset-y" | "inset-s" | "inset-e" | "inset-bs" | "inset-be" |
        "top" | "right" | "bottom" | "left" |
        "basis" | "translate" | "translate-x" | "translate-y" | "translate-z" |
        "scroll-m" | "scroll-mx" | "scroll-my" | "scroll-ms" | "scroll-me" |
        "scroll-mt" | "scroll-mr" | "scroll-mb" | "scroll-ml" |
        "scroll-p" | "scroll-px" | "scroll-py" | "scroll-ps" | "scroll-pe" |
        "scroll-pt" | "scroll-pr" | "scroll-pb" | "scroll-pl" |
        "leading" |
        "indent" | "space-x" | "space-y" |
        "border-spacing" | "border-spacing-x" | "border-spacing-y"
    )
}

fn supports_fraction(root: &str) -> bool {
    matches!(root,
        "w" | "h" | "size" | "min-w" | "min-h" | "max-w" | "max-h" |
        "inline" | "min-inline" | "max-inline" |
        "block" | "min-block" | "max-block" |
        "basis" |
        "inset" | "inset-x" | "inset-y" | "inset-s" | "inset-e" | "inset-bs" | "inset-be" |
        "top" | "right" | "bottom" | "left" |
        "translate" | "translate-x" | "translate-y"
    )
}

fn is_valid_spacing_value(value: &str) -> bool {
    // Accept integers and decimals like "0.5", "1.5", "2.5", "3.5"
    if let Ok(_) = value.parse::<f64>() {
        return !value.starts_with('-');
    }
    false
}

fn is_bare_value_utility(root: &str) -> bool {
    matches!(root,
        "z" | "order" | "col-span" | "col" | "col-start" | "col-end" |
        "row-span" | "row" | "row-start" | "row-end" |
        "grid-cols" | "grid-rows" |
        "grow" | "shrink" |
        "scale" | "scale-x" | "scale-y" | "scale-z" |
        "rotate" | "rotate-x" | "rotate-y" | "rotate-z" |
        "skew" | "skew-x" | "skew-y" |
        "zoom" | "tab" |
        "columns" | "line-clamp" |
        "duration" | "delay" |
        "border" | "border-x" | "border-y" | "border-s" | "border-e" |
        "border-t" | "border-r" | "border-b" | "border-l" |
        "ring" | "ring-offset" | "inset-ring" | "outline-offset" | "underline-offset" |
        "brightness" | "contrast" | "grayscale" | "invert" | "saturate" | "sepia" | "hue-rotate" |
        "backdrop-brightness" | "backdrop-contrast" | "backdrop-grayscale" |
        "backdrop-invert" | "backdrop-saturate" | "backdrop-sepia" | "backdrop-opacity" |
        "backdrop-hue-rotate" |
        "divide-x" | "divide-y" |
        "outline" | "stroke" | "decoration" |
        "border-spacing" | "border-spacing-x" | "border-spacing-y" |
        "mask-conic-from"
    )
}

fn get_static_value(root: &str, value: &str) -> Option<String> {
    // rounded-*-none → 0 for all radius variants
    if root.starts_with("rounded") && value == "none" {
        return Some("0".into());
    }
    // rounded-*-full → calc(infinity * 1px) for all variants
    if root.starts_with("rounded") && value == "full" {
        return Some("calc(infinity * 1px)".into());
    }
    match (root, value) {
        ("border", "0") => Some("0px".into()),
        ("opacity", v) => {
            if let Ok(n) = v.parse::<u32>() {
                if n <= 100 {
                    return Some(format!("{}%", n));
                }
            }
            None
        }
        ("z", "auto") => Some("auto".into()),
        ("order", "first") => Some("-9999".into()),
        ("order", "last") => Some("9999".into()),
        ("col", "auto") => Some("auto".into()),
        ("col-start", "auto") => Some("auto".into()),
        ("col-end", "auto") => Some("auto".into()),
        ("col-span", "full") => Some("1 / -1".into()),
        ("row", "auto") => Some("auto".into()),
        ("row-start", "auto") => Some("auto".into()),
        ("row-end", "auto") => Some("auto".into()),
        ("row-span", "full") => Some("1 / -1".into()),
        ("basis", "auto") => Some("auto".into()),
        ("basis", "full") => Some("100%".into()),
        // Font weight named values
        ("font", "thin") => Some("100".into()),
        ("font", "extralight") => Some("200".into()),
        ("font", "light") => Some("300".into()),
        ("font", "normal") => Some("400".into()),
        ("font", "medium") => Some("500".into()),
        ("font", "semibold") => Some("600".into()),
        ("font", "bold") => Some("700".into()),
        ("font", "extrabold") => Some("800".into()),
        ("font", "black") => Some("900".into()),
        // Text colors
        ("text" | "bg" | "from" | "via" | "to" | "fill" | "stroke" | "accent" | "caret" | "decoration"
        | "border" | "border-x" | "border-y" | "border-s" | "border-e"
        | "border-t" | "border-r" | "border-b" | "border-l"
        | "ring" | "inset-ring" | "outline" | "shadow" | "inset-shadow"
        | "mask-t-from" | "mask-t-to" | "mask-b-from" | "mask-b-to"
        | "mask-l-from" | "mask-l-to" | "mask-r-from" | "mask-r-to", "inherit") => Some("inherit".into()),
        ("text" | "bg" | "from" | "via" | "to" | "fill" | "stroke" | "accent" | "caret" | "decoration"
        | "border" | "border-x" | "border-y" | "border-s" | "border-e"
        | "border-t" | "border-r" | "border-b" | "border-l"
        | "ring" | "inset-ring" | "outline" | "shadow" | "inset-shadow"
        | "mask-t-from" | "mask-t-to" | "mask-b-from" | "mask-b-to"
        | "mask-l-from" | "mask-l-to" | "mask-r-from" | "mask-r-to", "transparent") => Some("transparent".into()),
        ("text" | "bg" | "from" | "via" | "to" | "fill" | "stroke" | "accent" | "caret" | "decoration"
        | "border" | "border-x" | "border-y" | "border-s" | "border-e"
        | "border-t" | "border-r" | "border-b" | "border-l"
        | "ring" | "inset-ring" | "outline" | "shadow" | "inset-shadow"
        | "mask-t-from" | "mask-t-to" | "mask-b-from" | "mask-b-to"
        | "mask-l-from" | "mask-l-to" | "mask-r-from" | "mask-r-to", "current") => Some("currentcolor".into()),
        ("text" | "bg" | "from" | "via" | "to" | "fill" | "stroke" | "accent" | "caret" | "decoration"
        | "border" | "border-x" | "border-y" | "border-s" | "border-e"
        | "border-t" | "border-r" | "border-b" | "border-l"
        | "ring" | "inset-ring" | "outline" | "shadow" | "inset-shadow"
        | "mask-t-from" | "mask-t-to" | "mask-b-from" | "mask-b-to"
        | "mask-l-from" | "mask-l-to" | "mask-r-from" | "mask-r-to", "black") => Some("#000".into()),
        ("text" | "bg" | "from" | "via" | "to" | "fill" | "stroke" | "accent" | "caret" | "decoration"
        | "border" | "border-x" | "border-y" | "border-s" | "border-e"
        | "border-t" | "border-r" | "border-b" | "border-l"
        | "ring" | "inset-ring" | "outline" | "shadow" | "inset-shadow"
        | "mask-t-from" | "mask-t-to" | "mask-b-from" | "mask-b-to"
        | "mask-l-from" | "mask-l-to" | "mask-r-from" | "mask-r-to", "white") => Some("#fff".into()),
        ("shadow", "none") => Some("0 0 #0000".into()),
        ("text-shadow", "none") => Some("none".into()),
        ("text-shadow", "inherit") => Some("inherit".into()),
        ("ring", "inset") => Some("inset".into()),
        ("aspect", "auto") => Some("auto".into()),
        ("aspect", "square") => Some("1 / 1".into()),
        ("aspect", "video") => Some("16 / 9".into()),
        ("line-clamp", "none") => Some("unset".into()),
        ("auto-cols", "auto") => Some("auto".into()),
        ("auto-cols", "min") => Some("min-content".into()),
        ("auto-cols", "max") => Some("max-content".into()),
        ("auto-cols", "fr") => Some("minmax(0, 1fr)".into()),
        ("auto-rows", "auto") => Some("auto".into()),
        ("auto-rows", "min") => Some("min-content".into()),
        ("auto-rows", "max") => Some("max-content".into()),
        ("auto-rows", "fr") => Some("minmax(0, 1fr)".into()),
        ("origin", "center") => Some("center".into()),
        ("origin", "top") => Some("top".into()),
        ("origin", "top-right") => Some("100% 0".into()),
        ("origin", "right") => Some("100%".into()),
        ("origin", "bottom-right") => Some("100% 100%".into()),
        ("origin", "bottom") => Some("bottom".into()),
        ("origin", "bottom-left") => Some("0 100%".into()),
        ("origin", "left") => Some("0".into()),
        ("origin", "top-left") => Some("0 0".into()),
        ("content", "none") => Some("none".into()),
        ("perspective", "none") => Some("none".into()),
        ("animate", "none") => Some("none".into()),
        ("ease", "linear") => Some("linear".into()),
        ("ease", "in") => Some("cubic-bezier(0.4, 0, 1, 1)".into()),
        ("ease", "out") => Some("cubic-bezier(0, 0, 0.2, 1)".into()),
        ("ease", "in-out") => Some("cubic-bezier(0.4, 0, 0.2, 1)".into()),
        ("leading", "none") => Some("1".into()),
        ("columns", "auto") => Some("auto".into()),
        // bg-linear direction names
        ("bg-linear", "to-t") => Some("to top".into()),
        ("bg-linear", "to-tr") => Some("to top right".into()),
        ("bg-linear", "to-r") => Some("to right".into()),
        ("bg-linear", "to-br") => Some("to bottom right".into()),
        ("bg-linear", "to-b") => Some("to bottom".into()),
        ("bg-linear", "to-bl") => Some("to bottom left".into()),
        ("bg-linear", "to-l") => Some("to left".into()),
        ("bg-linear", "to-tl") => Some("to top left".into()),
        // perspective-origin position names
        ("perspective-origin", "center") => Some("center".into()),
        ("perspective-origin", "top") => Some("top".into()),
        ("perspective-origin", "top-right") => Some("top right".into()),
        ("perspective-origin", "right") => Some("right".into()),
        ("perspective-origin", "bottom-right") => Some("bottom right".into()),
        ("perspective-origin", "bottom") => Some("bottom".into()),
        ("perspective-origin", "bottom-left") => Some("bottom left".into()),
        ("perspective-origin", "left") => Some("left".into()),
        ("perspective-origin", "top-left") => Some("top left".into()),
        _ => None,
    }
}

fn get_default_value(root: &str, theme: &Theme) -> Option<String> {
    match root {
        "rounded" | "rounded-t" | "rounded-r" | "rounded-b" | "rounded-l"
        | "rounded-tl" | "rounded-tr" | "rounded-br" | "rounded-bl"
        | "rounded-s" | "rounded-e" | "rounded-ss" | "rounded-se" | "rounded-es" | "rounded-ee" => {
            theme.resolve_for_utility("--radius").or(Some("0.25rem".into()))
        }
        "shadow" => theme.resolve_with_key("--shadow"),
        "blur" => theme.resolve_with_key("--blur").or(Some("8px".into())),
        "drop-shadow" => theme.resolve_with_key("--drop-shadow"),
        "backdrop-blur" => theme.resolve_with_key("--backdrop-blur").or(Some("8px".into())),
        "grayscale" | "backdrop-grayscale" => Some("100%".into()),
        "invert" | "backdrop-invert" => Some("100%".into()),
        "sepia" | "backdrop-sepia" => Some("100%".into()),
        "ring" => theme.resolve_with_key("--default-ring-width").or(Some("1px".into())),
        "divide-x" | "divide-y" => Some("1px".into()),
        "outline" => Some("1px".into()),
        "inset-ring" => Some("1px".into()),
        "text-shadow" => theme.resolve_with_key("--text-shadow"),
        _ => None,
    }
}

fn compile_text(
    resolved: &str,
    value: Option<&CandidateValue>,
    modifier: Option<&CandidateModifier>,
    theme: &Theme,
) -> Option<CssDeclarations> {
    if let Some(CandidateValue::Named { value: name, .. }) = value {
        let size_key = format!("--text-{}", name);
        if theme.resolve_with_key(&size_key).is_some() {
            let lh_key = format!("--text-{}--line-height", name);
            let has_lh = theme.resolve_with_key(&lh_key).is_some();
            let mut decls = vec![("font-size".into(), format!("var({})", size_key))];
            if has_lh {
                decls.push(("line-height".into(), format!("var(--tw-leading, var({}))", lh_key)));
            }
            return Some(decls);
        }

        let color = resolve_theme_color(name, theme);
        if let Some(c) = color {
            let final_color = resolve_color_value(&c, modifier, theme);
            return Some(vec![("color".into(), final_color)]);
        }
    }

    if let Some(CandidateValue::Arbitrary { value: arb_val, data_type }) = value {
        if let Some(dt) = data_type {
            match dt.as_str() {
                "length" | "percentage" | "absolute-size" | "relative-size" => {
                    return Some(vec![("font-size".into(), resolved.to_string())]);
                }
                "color" => {
                    return Some(vec![("color".into(), resolve_color_value(resolved, modifier, theme))]);
                }
                _ => {}
            }
        }
        if is_length_value(arb_val) {
            return Some(vec![("font-size".into(), resolved.to_string())]);
        }
        return Some(vec![("color".into(), resolve_color_value(resolved, modifier, theme))]);
    }

    None
}

fn compile_font(
    resolved: &str,
    value: Option<&CandidateValue>,
    theme: &Theme,
) -> Option<CssDeclarations> {
    if let Some(CandidateValue::Named { value: name, .. }) = value {
        let weight_key = format!("--font-weight-{}", name);
        if theme.resolve_with_key(&weight_key).is_some() {
            let var_ref = format!("var({})", weight_key);
            return Some(vec![
                ("--tw-font-weight".into(), var_ref.clone()),
                ("font-weight".into(), var_ref),
            ]);
        }
        let family_key = format!("--font-{}", name);
        if let Some(f) = theme.resolve_for_utility(&family_key) {
            return Some(vec![("font-family".into(), f)]);
        }
        return get_static_value("font", name).map(|v| vec![("font-weight".into(), v)]);
    }
    if let Some(CandidateValue::Arbitrary { .. }) = value {
        return Some(vec![
            ("--tw-font-weight".into(), resolved.to_string()),
            ("font-weight".into(), resolved.to_string()),
        ]);
    }
    None
}

fn is_color_like(value: &str) -> bool {
    value.starts_with("oklch(")
        || value.starts_with("oklab(")
        || value.starts_with("rgb(")
        || value.starts_with("rgba(")
        || value.starts_with("hsl(")
        || value.starts_with("hsla(")
        || value.starts_with('#')
        || value.starts_with("var(--color-")
        || matches!(value, "inherit" | "transparent" | "currentColor" | "currentcolor")
}

fn named_value_is_color(value: Option<&CandidateValue>, theme: &Theme) -> bool {
    if let Some(CandidateValue::Named { value: name, .. }) = value {
        let key = format!("--color-{}", name);
        theme.has_key(&key)
    } else {
        false
    }
}

fn compile_border(
    width_prop: &str,
    color_prop: &str,
    resolved: &str,
    value: Option<&CandidateValue>,
    modifier: Option<&CandidateModifier>,
    theme: &Theme,
) -> Option<CssDeclarations> {
    if is_color_like(resolved) || named_value_is_color(value, theme) {
        Some(vec![(color_prop.into(), resolve_color_value(resolved, modifier, theme))])
    } else {
        let w = to_px_if_bare(resolved);
        let mut decls = Vec::new();
        if width_prop == "border-width" {
            decls.push(("border-style".into(), "var(--tw-border-style)".into()));
        } else {
            let side = width_prop.replace("-width", "-style");
            decls.push((side, "var(--tw-border-style)".into()));
        }
        decls.push((width_prop.into(), w));
        Some(decls)
    }
}

fn resolve_theme_color(name: &str, theme: &Theme) -> Option<String> {
    let key = format!("--color-{}", name);
    theme.resolve_for_utility(&key)
}

fn resolve_color_value(value: &str, modifier: Option<&CandidateModifier>, _theme: &Theme) -> String {
    match modifier {
        Some(m) => with_alpha(value, &modifier_to_string(m)),
        None => value.to_string(),
    }
}

fn with_alpha(value: &str, alpha: &str) -> String {
    if let Ok(n) = alpha.parse::<f64>() {
        // Bare number like 0.5 → 50%
        if n <= 1.0 && n >= 0.0 && alpha.contains('.') {
            let pct = n * 100.0;
            if (pct - 100.0).abs() < 0.001 {
                return value.to_string();
            }
            return format!("color-mix(in oklab, {} {}%, transparent)", value, pct);
        }
        // Bare integer like 50 → 50%
        if (n - 100.0).abs() < 0.001 {
            return value.to_string();
        }
        return format!("color-mix(in oklab, {} {}%, transparent)", value, alpha);
    }
    if alpha.ends_with('%') {
        if alpha == "100%" {
            return value.to_string();
        }
        return format!("color-mix(in oklab, {} {}, transparent)", value, alpha);
    }
    format!("color-mix(in oklab, {} {}%, transparent)", value, alpha)
}

fn modifier_to_string(m: &CandidateModifier) -> String {
    match m {
        CandidateModifier::Named(v) => v.clone(),
        CandidateModifier::Arbitrary(v) => v.clone(),
    }
}

fn is_length_value(value: &str) -> bool {
    let units = ["px", "em", "rem", "ch", "vw", "vh", "cm", "mm", "in", "pt", "pc",
                 "ex", "lh", "rlh", "cqw", "cqh", "cqi", "cqb", "cqmin", "cqmax",
                 "svw", "svh", "lvw", "lvh", "dvw", "dvh", "%"];
    for unit in &units {
        if value.ends_with(unit) {
            let prefix = &value[..value.len() - unit.len()];
            if prefix.parse::<f64>().is_ok() || prefix.is_empty() {
                return true;
            }
        }
    }
    value.starts_with("calc(") || value.starts_with("min(") || value.starts_with("max(") || value.starts_with("clamp(")
}

fn negate_value(val: &str) -> String {
    if val.starts_with("calc(") && val.ends_with(')') {
        let inner = &val[5..val.len() - 1];
        if let Some(stripped) = inner.strip_prefix("var(--spacing) * ") {
            return format!("calc(var(--spacing) * -{})", stripped);
        }
    }
    format!("calc({} * -1)", val)
}

fn add_whitespace_around_math_operators(input: &str) -> String {
    let bytes = input.as_bytes();
    let mut result = String::with_capacity(input.len() + 16);
    let mut i = 0;
    let mut depth = 0i32;
    while i < bytes.len() {
        match bytes[i] {
            b'(' => { depth += 1; result.push('('); i += 1; }
            b')' => { depth -= 1; result.push(')'); i += 1; }
            b'+' | b'-' | b'*' if depth > 0 => {
                let c = bytes[i] as char;
                let needs_space_before = i > 0 && bytes[i - 1] != b' ' && bytes[i - 1] != b'(';
                let needs_space_after = i + 1 < bytes.len() && bytes[i + 1] != b' ' && bytes[i + 1] != b')';
                if c == '-' && i > 0 && (bytes[i - 1] == b'(' || bytes[i - 1] == b' ') {
                    result.push(c);
                    i += 1;
                    continue;
                }
                if needs_space_before { result.push(' '); }
                result.push(c);
                if needs_space_after { result.push(' '); }
                i += 1;
            }
            _ => { result.push(bytes[i] as char); i += 1; }
        }
    }
    result
}

fn resolve_shadow_raw(resolved: &str, theme_prefix: &str, theme: &Theme) -> String {
    if resolved.starts_with("var(") {
        let key = &resolved[4..resolved.len() - 1];
        if let Some(raw) = theme.resolve_with_key(key) {
            return raw;
        }
    }
    if let Some(raw) = theme.resolve_with_key(&format!("{}-{}", theme_prefix, resolved)) {
        return raw;
    }
    resolved.to_string()
}

fn resolve_shadow_color(color: &str, prop: &str, alpha_prop: &str, theme: &Theme) -> CssDeclarations {
    let has_var = color.starts_with("var(--") || color.contains("var(--color-") || color.contains("var(--");
    if has_var {
        let fallback = if color.starts_with("var(") && !color.contains("color-mix") {
            resolve_oklch_fallback(color, theme)
        } else if color.starts_with("color-mix(") && color.contains("var(--color-") {
            resolve_color_mix_fallback(color, theme)
        } else {
            None
        };
        let mut decls = Vec::new();
        if let Some(fb) = &fallback {
            decls.push((prop.into(), fb.clone()));
        }
        decls.push((prop.into(), format!("color-mix(in oklab, {} var({}), transparent)", color, alpha_prop)));
        if fallback.is_some() || color.contains("var(--color-") {
            decls.push(("__supports_color_mix__".into(), "true".into()));
        }
        decls
    } else {
        vec![(prop.into(), color.to_string())]
    }
}

fn resolve_color_mix_fallback(color_mix: &str, theme: &Theme) -> Option<String> {
    let mut resolved = color_mix.to_string();
    let mut pos = 0;
    while let Some(idx) = resolved[pos..].find("var(--color-") {
        let start = pos + idx;
        let after = start + 4;
        let mut depth = 1;
        let mut end = after;
        for (i, c) in resolved[after..].char_indices() {
            match c {
                '(' => depth += 1,
                ')' => {
                    depth -= 1;
                    if depth == 0 {
                        end = after + i;
                        break;
                    }
                }
                _ => {}
            }
        }
        let var_name = &resolved[after..end];
        if let Some(raw) = theme.resolve_with_key(var_name) {
            let full = format!("var({})", var_name);
            resolved = resolved.replacen(&full, &raw, 1);
            pos = start + raw.len();
        } else {
            pos = end;
        }
    }
    if resolved != color_mix {
        Some(resolved.replacen("in oklab,", "in srgb,", 1))
    } else {
        None
    }
}

fn resolve_oklch_fallback(color_var: &str, theme: &Theme) -> Option<String> {
    if color_var.starts_with("var(") && color_var.ends_with(')') {
        let key = &color_var[4..color_var.len() - 1];
        if let Some(raw) = theme.resolve_with_key(key) {
            return Some(raw);
        }
    }
    None
}

fn replace_shadow_colors(shadow: &str, prefix: &str, suffix: &str) -> String {
    let mut result = String::new();
    let mut i = 0;
    let bytes = shadow.as_bytes();
    while i < bytes.len() {
        if shadow[i..].starts_with("rgb(") || shadow[i..].starts_with("rgba(") || shadow[i..].starts_with("hsl(") || shadow[i..].starts_with("oklch(") {
            let start = i;
            let mut depth = 0;
            while i < bytes.len() {
                if bytes[i] == b'(' { depth += 1; }
                if bytes[i] == b')' { depth -= 1; if depth == 0 { i += 1; break; } }
                i += 1;
            }
            result.push_str(prefix);
            result.push_str(&shadow[start..i]);
            result.push_str(suffix);
        } else if bytes[i] == b'#' {
            let start = i;
            i += 1;
            while i < bytes.len() && bytes[i].is_ascii_hexdigit() { i += 1; }
            result.push_str(prefix);
            result.push_str(&shadow[start..i]);
            result.push_str(suffix);
        } else {
            result.push(bytes[i] as char);
            i += 1;
        }
    }
    result
}

fn split_shadow_layers(shadow: &str) -> Vec<&str> {
    let mut layers = Vec::new();
    let mut depth = 0;
    let mut start = 0;
    for (i, c) in shadow.char_indices() {
        match c {
            '(' => depth += 1,
            ')' => depth -= 1,
            ',' if depth == 0 => {
                layers.push(&shadow[start..i]);
                start = i + 1;
            }
            _ => {}
        }
    }
    let last = &shadow[start..];
    if !last.is_empty() {
        layers.push(last);
    }
    layers
}

fn wrap_drop_shadow_layers(shadow: &str) -> String {
    let layers = split_shadow_layers(shadow);
    layers.iter()
        .map(|l| format!("drop-shadow({})", l.trim()))
        .collect::<Vec<_>>()
        .join(" ")
}

fn wrap_drop_shadow_layers_raw(shadow: &str) -> String {
    let layers = split_shadow_layers(shadow);
    layers.iter()
        .map(|l| format!("drop-shadow({})", l))
        .collect::<Vec<_>>()
        .join(" ")
}

fn resolve_theme_in_value(value: &str, theme: &Theme) -> String {
    let mut result = String::with_capacity(value.len());
    let mut pos = 0;
    let bytes = value.as_bytes();

    while pos < bytes.len() {
        if let Some(idx) = value[pos..].find("theme(") {
            let fn_start = pos + idx;
            result.push_str(&value[pos..fn_start]);

            let args_start = fn_start + 6;
            let mut depth = 1;
            let mut close = None;
            let mut i = args_start;
            while i < bytes.len() {
                match bytes[i] {
                    b'(' => depth += 1,
                    b')' => { depth -= 1; if depth == 0 { close = Some(i); break; } }
                    _ => {}
                }
                i += 1;
            }
            if let Some(close_pos) = close {
                let arg = value[args_start..close_pos].trim();
                if let Some(resolved) = crate::css_functions::resolve_theme_path(arg, theme) {
                    result.push_str(&resolved);
                } else {
                    result.push_str(&value[fn_start..=close_pos]);
                }
                pos = close_pos + 1;
            } else {
                result.push_str(&value[fn_start..fn_start + 6]);
                pos = args_start;
            }
        } else {
            result.push_str(&value[pos..]);
            break;
        }
    }

    result
}
