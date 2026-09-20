/**
 * Single-file demo host for the quick-actions micro-UI (vite dev entry, see
 * index.html).
 *
 * Everything demo-related lives here:
 *  - the two host themes (VAULT dark + Lattice Light) mapping the SAME
 *    semantic token keys onto different palettes, proving the component ships
 *    no palette of its own;
 *  - the demo page: TWO QuickActions instances side by side, each inside its
 *    own MantineProvider with a different theme, plus an EN | 中文 language
 *    switcher — one GLOBAL control that drives every instance, and a
 *    per-instance control proving locale is a per-instance prop (the two
 *    themed hosts can render differing locales at once). The component makes
 *    NO Lattice calls, so no mock executor is needed; clicking a button in
 *    EITHER instance requests its intent as a Prism event, and the intent
 *    monitor below logs every requested intent with a timestamp so the
 *    publications are inspectable in both themes and both languages.
 */
import { useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Box,
  createTheme,
  Divider,
  Group,
  MantineProvider,
  SegmentedControl,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import type { MantineThemeOverride } from "@mantine/core";
import { usePrismEvent } from "@zephytiju/prism-react";
import { QuickActions, intentEventIdForAction } from "./QuickActions.js";
import type { QuickActionsLocale } from "./locales/index.js";
import "@mantine/core/styles.css";

// ---------------------------------------------------------------------------
// Themes — the HOST side of the theme contract.
//
// The component uses only semantic color tokens (ok / accent / warn /
// card-dark / muted / text / border / line / deep / panel); each theme maps
// every token onto a concrete palette. Every shade of every token is the same
// design color so any Mantine shade index resolves to the exact hex.
// ---------------------------------------------------------------------------

type ColorShades = [string, string, string, string, string, string, string, string, string, string];

const shades = (hex: string): ColorShades => [
  hex,
  hex,
  hex,
  hex,
  hex,
  hex,
  hex,
  hex,
  hex,
  hex,
];

/** VAULT (dark) — the exact :root variables of the v9 prototype. */
export const vaultTheme = createTheme({
  colors: {
    // v9 :root neutrals
    deep: shades("#07100F"), // --bg
    panel: shades("#000000"), // --panel
    card: shades("#111F1C"), // --card
    "card-dark": shades("#0B1514"), // --cdark
    input: shades("#162823"), // --inp
    border: shades("#29463E"), // --border
    line: shades("#44685B"), // --grid2
    text: shades("#E8F2ED"), // --text
    muted: shades("#86A098"), // --muted
    // v9 :root signal palette, exposed under semantic tokens
    ok: shades("#6FEEB3"), // --mint
    accent: shades("#62B3FF"), // --blue
    threat: shades("#FF6B5F"), // --red
    warn: shades("#E8B84B"), // --amber
    signal: shades("#A88BFF"), // --purple
  },
  primaryColor: "ok",
  fontFamily: "'Inter',-apple-system,BlinkMacSystemFont,sans-serif",
  fontFamilyMonospace: "'IBM Plex Mono',ui-monospace,SFMono-Regular,monospace",
  defaultRadius: 4,
});

/**
 * Lattice Light (contrasting second host) — the SAME semantic token keys mapped
 * onto a light palette with system typography, proving a completely different
 * host can skin the component purely through MantineProvider.
 */
export const latticeLightTheme = createTheme({
  colors: {
    deep: shades("#EAF0EE"),
    panel: shades("#FFFFFF"),
    card: shades("#F2F6F4"),
    "card-dark": shades("#E7EEEB"),
    input: shades("#FBFDFC"),
    border: shades("#C3D2CC"),
    line: shades("#9DB4AB"),
    text: shades("#172925"),
    muted: shades("#5A6E67"),
    ok: shades("#0E7A52"),
    accent: shades("#1F6FE0"),
    threat: shades("#CE3F35"),
    warn: shades("#9A6E10"),
    signal: shades("#6E4FD8"),
  },
  primaryColor: "ok",
  fontFamily: "system-ui,-apple-system,'Segoe UI',Roboto,sans-serif",
  fontFamilyMonospace: "ui-monospace,SFMono-Regular,Menlo,Consolas,monospace",
  defaultRadius: 4,
});

// ---------------------------------------------------------------------------
// Demo page — two themed QuickActions instances + the intent monitor.
// ---------------------------------------------------------------------------

const MONO = "var(--mantine-font-family-monospace)";

/** Segmented-control options shared by the global and per-instance switchers. */
const localeOptions = [
  { value: "en", label: "EN" },
  { value: "zh-CN", label: "中文" },
];

type IntentLogEntry = { readonly id: string; readonly at: string };

/**
 * Logs every requested quick-action intent. Intents are Prism events, so the
 * monitor subscribes to all three intent ids and appends to a bounded log.
 */
function IntentMonitor() {
  const [log, setLog] = useState<readonly IntentLogEntry[]>([]);
  const append = (id: string): void => {
    setLog((entries) =>
      [
        { id, at: new Date().toISOString().slice(11, 19) },
        ...entries,
      ].slice(0, 6),
    );
  };
  usePrismEvent(intentEventIdForAction("create-dossier"), () => {
    append("quick-actions.create-dossier");
  });
  usePrismEvent(intentEventIdForAction("import-evidence"), () => {
    append("quick-actions.import-evidence");
  });
  usePrismEvent(intentEventIdForAction("open-shared"), () => {
    append("quick-actions.open-shared");
  });
  return (
    <Stack gap={4} miw={0}>
      <Text size="sm" fw={600} c="var(--mantine-color-text-filled)">
        requested intents (quick-actions.* events)
      </Text>
      <Stack gap={2} data-testid="demo-intent-log">
        {log.length === 0 ? (
          <Text size="sm" c="var(--mantine-color-muted-filled)" data-testid="demo-intent-log-empty">
            none requested yet — click an action button in either instance
          </Text>
        ) : (
          log.map((entry, index) => (
            <Text
              key={`${entry.id}-${entry.at}-${String(index)}`}
              ff={MONO}
              fz={10}
              c="var(--mantine-color-muted-filled)"
              data-testid={`demo-intent-entry-${String(index)}`}
            >
              {`${entry.at}  ${entry.id}`}
            </Text>
          ))
        )}
      </Stack>
    </Stack>
  );
}

/**
 * One quick-actions instance inside its OWN scoped MantineProvider.
 *
 * Mantine emits theme CSS variables as `cssVariablesSelector { … }` style tags
 * (default selector ":root", i.e. global), so two nested providers would fight:
 * the last-mounted theme would win document-wide. Each instance provider is
 * therefore scoped to a wrapper class (cssVariablesSelector) and its
 * forceColorScheme attribute is written to that same wrapper (getRootElement),
 * keeping both palettes live side by side.
 */
interface ThemedInstanceProps {
  readonly theme: MantineThemeOverride;
  readonly colorScheme: "dark" | "light";
  readonly scopeClass: string;
  readonly label: string;
  readonly panelTestid: string;
  readonly locale: QuickActionsLocale;
  readonly onLocaleChange: (locale: QuickActionsLocale) => void;
  readonly localeTestid: string;
}

function ThemedQuickActionsInstance({
  theme,
  colorScheme,
  scopeClass,
  label,
  panelTestid,
  locale,
  onLocaleChange,
  localeTestid,
}: ThemedInstanceProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  return (
    <MantineProvider
      theme={theme}
      forceColorScheme={colorScheme}
      cssVariablesSelector={`.${scopeClass}`}
      getRootElement={() => hostRef.current ?? document.documentElement}
    >
      <Stack
        gap={8}
        miw={0}
        className={scopeClass}
        data-mantine-color-scheme={colorScheme}
        ref={hostRef}
      >
        <Group gap={10} wrap="nowrap" align="center">
          <Text ff={MONO} fz={9} fw={600} c="var(--mantine-color-signal-filled)">
            {label}
          </Text>
          {/* Per-instance language control — locale is a per-instance prop, so
              the two themed hosts may render DIFFERING locales at once. */}
          <SegmentedControl
            size="xs"
            data-testid={localeTestid}
            value={locale}
            onChange={(value) => {
              onLocaleChange(value as QuickActionsLocale);
            }}
            data={localeOptions}
          />
        </Group>
        <Box
          p={16}
          style={{
            width: 300,
            background: "var(--mantine-color-panel-filled)",
            border: "1px solid var(--mantine-color-line-filled)",
          }}
          data-testid={panelTestid}
        >
          <QuickActions locale={locale} />
        </Box>
      </Stack>
    </MantineProvider>
  );
}

function DemoPage() {
  // The GLOBAL switch drives both instances at once; each instance also has
  // its own control, so the two themed hosts can render differing locales.
  const [globalLocale, setGlobalLocale] = useState<QuickActionsLocale>("en");
  const [leftOverride, setLeftOverride] = useState<QuickActionsLocale | null>(null);
  const [rightOverride, setRightOverride] = useState<QuickActionsLocale | null>(null);
  const leftLocale = leftOverride ?? globalLocale;
  const rightLocale = rightOverride ?? globalLocale;
  const applyGlobalLocale = (locale: QuickActionsLocale): void => {
    setGlobalLocale(locale);
    setLeftOverride(null);
    setRightOverride(null);
  };

  return (
    <MantineProvider theme={vaultTheme} forceColorScheme="dark">
      <Box mih="100vh" p={24} style={{ background: "var(--mantine-color-deep-filled)" }} data-testid="demo-page">
        <Stack gap={16} maw={960}>
          <Title order={3} c="var(--mantine-color-text-filled)">
            Prism quick-actions demo — theme swap × locale swap × intent requests
          </Title>
          <Text size="sm" c="var(--mantine-color-muted-filled)" data-testid="demo-caption">
            Two hosts, two palettes, one component: the same semantic tokens mapped onto the VAULT
            v9 dark theme (left) and Lattice Light (right). The component makes NO Lattice calls —
            clicking CREATE DOSSIER / IMPORT EVIDENCE / OPEN SHARED requests the matching intent as
            a Prism event (null payload; intents never grant authorization), and the monitor below
            logs every requested intent from BOTH instances. The LANGUAGE switch drives both
            instances; each host also carries its own EN/中文 control, so the two instances can
            render differing locales at once.
          </Text>
          <Stack gap={20} data-testid="demo-locale-stage">
            <Group gap={10} wrap="nowrap" align="center" data-testid="demo-locale-bar">
              <Text ff={MONO} fz={9} fw={600} c="var(--mantine-color-muted-filled)">
                LANGUAGE
              </Text>
              <SegmentedControl
                data-testid="demo-locale-switcher"
                value={globalLocale}
                onChange={(value) => {
                  applyGlobalLocale(value as QuickActionsLocale);
                }}
                data={localeOptions}
              />
            </Group>
            <Group align="flex-start" gap={20} wrap="wrap" data-testid="demo-instances">
              <ThemedQuickActionsInstance
                theme={vaultTheme}
                colorScheme="dark"
                scopeClass="demo-scope-vault"
                label="HOST A · VAULT V9"
                panelTestid="demo-panel-a"
                locale={leftLocale}
                onLocaleChange={setLeftOverride}
                localeTestid="demo-instance-locale-a"
              />
              <ThemedQuickActionsInstance
                theme={latticeLightTheme}
                colorScheme="light"
                scopeClass="demo-scope-light"
                label="HOST B · LATTICE LIGHT"
                panelTestid="demo-panel-b"
                locale={rightLocale}
                onLocaleChange={setRightOverride}
                localeTestid="demo-instance-locale-b"
              />
            </Group>
          </Stack>
          <Divider
            color="var(--mantine-color-border-filled)"
            label={
              <Text ff={MONO} fz={9} c="var(--mantine-color-muted-filled)">
                HOST DEMO AFFORDANCES
              </Text>
            }
          />
          <IntentMonitor />
        </Stack>
      </Box>
    </MantineProvider>
  );
}

createRoot(document.getElementById("root")!).render(<DemoPage />);
