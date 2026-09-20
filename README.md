# PrismQuickActionsMicroUI

Platform Prism quick-actions micro-UI. Component id: `quick-actions`.
Published to npm as [`@zephytiju/prism-quick-actions`](https://www.npmjs.com/package/@zephytiju/prism-quick-actions).

The VAULT side panel's quick-actions section (independent axiom component — the panel container
itself is composed in the platform prism, never in code): the QUICK ACTIONS label plus the three
per-prototype action buttons — CREATE DOSSIER (accent), IMPORT EVIDENCE (ok), OPEN SHARED (warn) —
each a bordered mono button with a → affordance arrow. Clicking a button REQUESTS its intent,
emitted as a Prism event that the host runtime or navigation targets interpret; intents never
grant authorization (design decision D8). The divider above the section in the prototype is
composition-level panel chrome and does not belong to this component. Composed applications (for
example Guanlan) consume it as-is; the component is platform-owned.

## Configuration keys

| Prop | Meaning |
| --- | --- |
| `locale` | UI locale for the component-fixed strings: `"en" \| "zh-CN"` (default `"en"`) — see [i18n](#internationalization-i18n) |
| `label` | Section label above the buttons (defaults to the locale's `sectionLabel`) |
| `createDossierLabel` | Copy for the CREATE DOSSIER button (defaults to the locale's `createDossier`) |
| `importEvidenceLabel` | Copy for the IMPORT EVIDENCE button (defaults to the locale's `importEvidence`) |
| `openSharedLabel` | Copy for the OPEN SHARED button (defaults to the locale's `openShared`) |

The action set itself (which three actions exist, their semantic tokens, and their intent ids) is
the component's fixed contract and is not configuration.

## Channel contract

| Direction | Kind | Id | Payload |
| --- | --- | --- | --- |
| emits | event (intent) | `quick-actions.create-dossier` | `null` — requests creating a new dossier |
| emits | event (intent) | `quick-actions.import-evidence` | `null` — requests importing evidence |
| emits | event (intent) | `quick-actions.open-shared` | `null` — requests opening shared files |

Event ids are string literals at every call-site (derived from the exported
`intentEventIdForAction`) so the build-time channel-graph scanner can derive the graph. The
component consumes nothing, publishes no state, and makes NO Lattice calls — quick-action intents
are navigation/action requests that receivers interpret; they never grant authorization.

## Audit rule

Requesting a quick action is not itself an observable domain action. This component emits NO audit
event and NO `IAuditRefAppend` call; the realized actions (a dossier actually created, evidence
actually imported) are audited by whatever component performs them through Lattice, not here.

## Internationalization (i18n)

The component ships `en` and `zh-CN` locale bundles — `src/locales/en.json` / `src/locales/zh-CN.json` —
and every component-fixed UI string is resolved from them (the section label and the three button
labels). The component renders no hardcoded copy.

```json
{
  "quick-actions": {
    "sectionLabel": "QUICK ACTIONS",
    "createDossier": "CREATE DOSSIER",
    "importEvidence": "IMPORT EVIDENCE",
    "openShared": "OPEN SHARED"
  }
}
```

- `locale?: "en" | "zh-CN"` prop (default `"en"`) selects the string table per instance.
- Explicit `label` / `createDossierLabel` / `importEvidenceLabel` / `openSharedLabel` props
  override the locale strings.
- **Composition-authored strings are localized by the composer; component-fixed strings live in the
  locale JSONs.** An explicit `label` override is configuration-authored: a host with a localized
  label passes its own string per locale.
- Locale bundles are namespaced under the component id (`"quick-actions"`) so a composer can
  deep-merge every component's bundle into ONE UI language bundle without collisions:

```ts
import { locales as quickActionsLocales } from "@zephytiju/prism-quick-actions";
// quickActionsLocales["zh-CN"] -> { "quick-actions": { … } }
const uiBundle = deepMerge(hostStrings, quickActionsLocales["zh-CN"]);
```

The parsed bundles are exported from the package entry (`locales`, `en`, `zhCN`,
`stringsForLocale`), and the raw JSONs are also served by the `./locales/*` exports subpath
(e.g. `@zephytiju/prism-quick-actions/locales/zh-CN.json`); `files` ships both `dist` and `locales`.

## Theme

No palette is hardcoded. Every color resolves to SEMANTIC theme tokens (`accent`, `ok`, `warn`,
`card-dark`, `muted`, plus the surrounding panel tokens) consumed as CSS variables, and
`--mantine-font-family-monospace` / `--mantine-font-family` for the mono/sans split — the palette
is supplied entirely by the host's `MantineProvider`. The local demo ships TWO themes, both
defined in `src/demo.tsx`: `vaultTheme` (dark), mapping each semantic token onto the exact
`:root` variables of the VAULT v9 prototype, and the contrasting `latticeLightTheme` (light),
mapping the SAME semantic token keys onto a different palette — the component is skinned purely
through the surrounding `MantineProvider`.

## Source layout

`src/` is strictly two parts:

- Component source (what the package compiles): `QuickActions.tsx` (the section axiom, including
  the fixed action table) and `index.ts` (public entry), plus `src/locales/` (`en.json`,
  `zh-CN.json`, `index.ts` — the i18n string bundles and their resolver).
- Demo: exactly ONE file, `src/demo.tsx` — the two host themes (VAULT v9 + Lattice Light) and the
  demo page rendering TWO `QuickActions` instances side by side behind a global EN | 中文 language
  switcher (plus per-instance switches) with an intent monitor that logs every requested
  `quick-actions.*` event from both instances.

The npm package ships `dist` (compiled component + type declarations + locale JSONs) and the
top-level `locales/` directory (the raw JSON bundles, served by the `./locales/*` exports
subpath); no demo code is published. `scripts/copy-locales.mjs` copies the JSON bundles into
both locations during `npm run build`.

## Local development

```sh
npm install
npm run typecheck
npm test
npm run dev
npm run shot-demo
```

`npm install` pulls the platform peers (`@zephytiju/prism-react`) from the npm registry, along
with the host-side peer dependencies (`react`, `react-dom`, `@mantine/core`). When consuming the
published package, install it directly (`npm install @zephytiju/prism-quick-actions`) and provide
those peer dependencies in the host application.

The demo (`npm run dev`, entry `src/demo.tsx`) renders TWO `QuickActions` instances side by side,
each inside its own `MantineProvider` with a different theme (VAULT v9 dark left, Lattice Light
right). A global EN | 中文 segmented control switches the `locale` prop of BOTH instances at once,
and each instance carries its own per-instance control so the two hosts can render DIFFERING
locales simultaneously. Clicking a button in EITHER instance requests its intent as a Prism
event; the intent monitor below logs every requested intent from both hosts. `npm run shot-demo`
boots the vite dev server, drives the demo in headless Chrome (LEFT instance `en`, RIGHT instance
`zh-CN`), requests CREATE DOSSIER from the left instance and IMPORT EVIDENCE from the right one,
and captures the language switcher, both themed instances, and the intent monitor with both
publications in one shot at 2x to `/tmp/guanlan-review/demo-quick-actions.png`.

## Design record

Page design: https://qcnwge0wy4s0.feishu.cn/wiki/TLFtwgBgpiW8iWkXT7rcOyKgnAd — decisions D6/D8
(independent side-panel axiom components; intents for navigation or action requests, which never
grant authorization) and the QUICK ACTIONS block of the v9 interactive HTML prototype
(authoritative implementation source). Grouping doc:
https://qcnwge0wy4s0.feishu.cn/wiki/MQfXweoMvirMEykeHuDcCwkhnw9 — `quick-actions` (axiom)
CREATE DOSSIER / IMPORT EVIDENCE / OPEN SHARED. Visual reference: `vault-standalone.html`
`.sidebar` `.qa` block.
