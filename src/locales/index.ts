import enBundle from "./en.json";
import zhCNBundle from "./zh-CN.json";

/**
 * Locales the quick-actions micro-UI bundles. Every component-fixed UI string
 * is resolved from these bundles (statically imported, resolveJsonModule); the
 * component never hardcodes copy. Configuration-provided strings (an explicit
 * label override, …) stay composition-authored and are localized by the
 * composer.
 */
export type QuickActionsLocale = "en" | "zh-CN";

/**
 * The per-locale string table — the keys of the en bundle. Declared widened
 * (string values) so the zh-CN bundle is checked for exact key parity at
 * compile time while keeping literal JSON types out of the public surface.
 */
export type QuickActionsStrings = {
  readonly [K in keyof typeof enBundle["quick-actions"]]: string;
};

const bundles: Record<QuickActionsLocale, { readonly "quick-actions": QuickActionsStrings }> = {
  en: enBundle,
  "zh-CN": zhCNBundle,
};

/** Parsed en locale bundle (namespaced under the component id "quick-actions"). */
export const en = enBundle;

/** Parsed zh-CN locale bundle (namespaced under the component id "quick-actions"). */
export const zhCN = zhCNBundle;

/** All bundled locale bundles keyed by locale id — for downstream deep-merge. */
export const locales = bundles;

/** Resolves the string table for a locale. */
export function stringsForLocale(locale: QuickActionsLocale): QuickActionsStrings {
  return bundles[locale]["quick-actions"];
}

/**
 * Simple `{placeholder}` interpolation kept for bundle symmetry with sibling
 * Prism micro-UIs (this component's strings currently hold no placeholders).
 * Placeholder-for-value substitution only — no ICU, no regexes.
 */
export function formatMessage(
  template: string,
  values: Readonly<Record<string, string | number>>,
): string {
  let result = template;
  for (const [key, value] of Object.entries(values)) {
    result = result.replaceAll(`{${key}}`, String(value));
  }
  return result;
}
