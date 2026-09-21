import { Box, UnstyledButton } from "@mantine/core";
import { CARD_DARK_BG, MONO, SANS } from "./tokens.js";

export interface ActionButtonProps {
  /** Resolved button copy (configuration override or locale default). */
  readonly label: string;
  /** Semantic color token driving the button's border and text color. */
  readonly token: string;
  /** Stable test id for the button element. */
  readonly testid: string;
  /** Invoked when the button is clicked (the section emits the intent event). */
  readonly onClick: () => void;
}

/**
 * One quick-action button (VAULT v9 prototype): a bordered mono button on the
 * card-dark surface, colored by its action's semantic token, with the sans
 * → affordance arrow pinned at the right edge. Purely presentational — the
 * intent-event request is wired by the owning QuickActions section through
 * the onClick prop.
 *
 * Sub-component of the quick-actions axiom (D5); internal to this repo.
 */
export function ActionButton({ label, token, testid, onClick }: ActionButtonProps) {
  const color = `var(--mantine-color-${token}-filled)`;
  return (
    <UnstyledButton
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
      data-testid={testid}
      onClick={onClick}
    >
      {label}
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
        data-testid={`${testid}-arrow`}
      >
        →
      </Box>
    </UnstyledButton>
  );
}
