import { Box, Stack, Text, UnstyledButton } from "@mantine/core";
import { emitPrismEvent } from "@zephytiju/prism-react";
import { stringsForLocale } from "./locales/index.js";
import type { QuickActionsLocale } from "./locales/index.js";

export interface QuickActionsProps {
  /** Section label above the buttons (defaults to the locale's `sectionLabel`). */
  readonly label?: string;
  /** Copy for the CREATE DOSSIER button (defaults to the locale's `createDossier`). */
  readonly createDossierLabel?: string;
  /** Copy for the IMPORT EVIDENCE button (defaults to the locale's `importEvidence`). */
  readonly importEvidenceLabel?: string;
  /** Copy for the OPEN SHARED button (defaults to the locale's `openShared`). */
  readonly openSharedLabel?: string;
  /** UI locale for the component-fixed strings (default "en"). */
  readonly locale?: QuickActionsLocale;
}

const MONO = "var(--mantine-font-family-monospace)";
const SANS = "var(--mantine-font-family)";
const MUTED = "var(--mantine-color-muted-filled)";
const CARD_DARK_BG = "var(--mantine-color-card-dark-filled)";

/** The section's fixed action set — id, semantic color token, intent event id. */
const ACTIONS = [
  { id: "create-dossier", token: "accent", testid: "quick-action-create-dossier" },
  { id: "import-evidence", token: "ok", testid: "quick-action-import-evidence" },
  { id: "open-shared", token: "warn", testid: "quick-action-open-shared" },
] as const;

type ActionId = (typeof ACTIONS)[number]["id"];

/** Intent event id requested when an action button is clicked. */
export function intentEventIdForAction(action: ActionId): string {
  return `quick-actions.${action}`;
}

/**
 * Platform Prism quick-actions micro-UI (component id "quick-actions"), the
 * VAULT side panel's quick-actions section: the QUICK ACTIONS label plus the
 * three per-prototype action buttons — CREATE DOSSIER (accent),
 * IMPORT EVIDENCE (ok), OPEN SHARED (warn) — each a bordered mono button with
 * a → affordance arrow. The divider above the section in the prototype is
 * composition-level panel chrome and does not belong to this component.
 *
 * Clicking a button REQUESTS its intent — emitted as a Prism event
 * (`quick-actions.create-dossier` / `quick-actions.import-evidence` /
 * `quick-actions.open-shared`, null payload) that receivers (the host runtime,
 * navigation targets) interpret. Intents never grant authorization (D8); this
 * component makes NO Lattice calls and emits NO audit event — requesting a
 * quick action is not itself an observable domain action.
 *
 * No palette is hardcoded: every color resolves to semantic theme tokens
 * (accent / ok / warn / card-dark / muted …) supplied by the host's
 * MantineProvider.
 */
export function QuickActions({
  label,
  createDossierLabel,
  importEvidenceLabel,
  openSharedLabel,
  locale = "en",
}: QuickActionsProps) {
  // Every component-fixed UI string comes from the bundled locale JSONs;
  // configuration-provided strings (an explicit label override, …) stay
  // composition-authored.
  const strings = stringsForLocale(locale);
  const resolvedLabel = label ?? strings.sectionLabel;
  const labels: Record<ActionId, string> = {
    "create-dossier": createDossierLabel ?? strings.createDossier,
    "import-evidence": importEvidenceLabel ?? strings.importEvidence,
    "open-shared": openSharedLabel ?? strings.openShared,
  };

  return (
    <Stack gap={10} data-testid="quick-actions-section">
      <Text
        ff={MONO}
        fz={8}
        fw={500}
        style={{ color: MUTED, letterSpacing: "0.08em" }}
        data-testid="quick-actions-label"
      >
        {resolvedLabel}
      </Text>
      {ACTIONS.map((action) => {
        const color = `var(--mantine-color-${action.token}-filled)`;
        return (
          <UnstyledButton
            key={action.id}
            type="button"
            px={12}
            style={{
              height: 38,
              background: CARD_DARK_BG,
              border: `1px solid ${color}`,
              borderRadius: 4,
              color,
              fontFamily: MONO,
              fontSize: 8,
              fontWeight: 500,
              letterSpacing: "0.05em",
              position: "relative",
              width: "100%",
              textAlign: "left",
            }}
            data-testid={action.testid}
            onClick={() => {
              emitPrismEvent(intentEventIdForAction(action.id), null);
            }}
          >
            {labels[action.id]}
            <Box
              component="span"
              style={{
                position: "absolute",
                right: 12,
                top: 0,
                bottom: 0,
                display: "flex",
                alignItems: "center",
                fontFamily: SANS,
                fontSize: 12,
                fontWeight: 500,
              }}
              data-testid={`${action.testid}-arrow`}
            >
              →
            </Box>
          </UnstyledButton>
        );
      })}
    </Stack>
  );
}
