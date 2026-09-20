import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MantineProvider } from "@mantine/core";
import { resetChannelsForTests, subscribeToEvent } from "@zephytiju/prism-react";
import { QuickActions, intentEventIdForAction } from "../src/index.js";
import type { QuickActionsProps } from "../src/index.js";
import { en, locales, zhCN } from "../src/index.js";
import type { QuickActionsStrings } from "../src/index.js";

(globalThis as { __PRISM_REACT_TEST__?: boolean }).__PRISM_REACT_TEST__ = true;
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

beforeEach(() => {
  resetChannelsForTests();
});

afterEach(() => {
  cleanup();
});

function renderActions(props: QuickActionsProps = {}): void {
  render(
    <MantineProvider>
      <QuickActions {...props} />
    </MantineProvider>,
  );
}

describe("QuickActions render", () => {
  it("renders the section label and the three per-prototype action buttons with arrows", () => {
    renderActions();
    expect(screen.getByTestId("quick-actions-label").textContent).toBe("QUICK ACTIONS");
    expect(screen.getByTestId("quick-action-create-dossier").textContent).toBe("CREATE DOSSIER→");
    expect(screen.getByTestId("quick-action-import-evidence").textContent).toBe("IMPORT EVIDENCE→");
    expect(screen.getByTestId("quick-action-open-shared").textContent).toBe("OPEN SHARED→");
    expect(screen.getByTestId("quick-action-create-dossier-arrow").textContent).toBe("→");
    expect(screen.getByTestId("quick-action-open-shared-arrow").textContent).toBe("→");
  });

  it("binds the fixed semantic tokens per action (accent / ok / warn)", () => {
    renderActions();
    expect(screen.getByTestId("quick-action-create-dossier").getAttribute("style")).toContain(
      "var(--mantine-color-accent-filled)",
    );
    expect(screen.getByTestId("quick-action-import-evidence").getAttribute("style")).toContain(
      "var(--mantine-color-ok-filled)",
    );
    expect(screen.getByTestId("quick-action-open-shared").getAttribute("style")).toContain(
      "var(--mantine-color-warn-filled)",
    );
  });
});

describe("QuickActions i18n", () => {
  it("renders the default en strings (no locale prop)", () => {
    renderActions();
    expect(screen.getByTestId("quick-actions-label").textContent).toBe("QUICK ACTIONS");
    expect(screen.getByTestId("quick-action-create-dossier").textContent).toBe("CREATE DOSSIER→");
  });

  it("renders Chinese strings with locale=\"zh-CN\"", () => {
    renderActions({ locale: "zh-CN" });
    expect(screen.getByTestId("quick-actions-label").textContent).toBe("快捷操作");
    expect(screen.getByTestId("quick-action-create-dossier").textContent).toBe("创建卷宗→");
    expect(screen.getByTestId("quick-action-import-evidence").textContent).toBe("导入证据→");
    expect(screen.getByTestId("quick-action-open-shared").textContent).toBe("打开共享→");
  });

  it("lets explicit label props override the locale strings", () => {
    renderActions({
      locale: "zh-CN",
      label: "MY ACTIONS",
      createDossierLabel: "NEW FILE",
      importEvidenceLabel: "NEW EVIDENCE",
      openSharedLabel: "SHARED",
    });
    expect(screen.getByTestId("quick-actions-label").textContent).toBe("MY ACTIONS");
    expect(screen.getByTestId("quick-action-create-dossier").textContent).toBe("NEW FILE→");
    expect(screen.getByTestId("quick-action-import-evidence").textContent).toBe("NEW EVIDENCE→");
    expect(screen.getByTestId("quick-action-open-shared").textContent).toBe("SHARED→");
  });

  it("exports namespaced locale bundles that deep-merge with other components' bundles without collision", () => {
    // Key parity between bundles is the mergeability precondition.
    expect(Object.keys(en["quick-actions"]).sort()).toEqual(
      Object.keys(zhCN["quick-actions"]).sort(),
    );

    const siblingEn = { "other-component": { retry: "RETRY", next: "MORE" } };
    const merge = (a: Record<string, unknown>, b: Record<string, unknown>): Record<string, unknown> => {
      const out: Record<string, unknown> = { ...a };
      for (const [key, value] of Object.entries(b)) {
        const existing = out[key];
        out[key] =
          existing !== undefined &&
          typeof existing === "object" &&
          existing !== null &&
          typeof value === "object" &&
          value !== null
            ? merge(existing as Record<string, unknown>, value as Record<string, unknown>)
            : value;
      }
      return out;
    };

    const merged = merge(locales.en, siblingEn) as {
      "quick-actions": QuickActionsStrings;
      "other-component": { retry: string; next: string };
    };
    expect(merged["quick-actions"].sectionLabel).toBe("QUICK ACTIONS");
    expect(merged["quick-actions"].createDossier).toBe("CREATE DOSSIER");
    expect(merged["other-component"]).toEqual({ retry: "RETRY", next: "MORE" });
    expect(Object.keys(merged).sort()).toEqual(["other-component", "quick-actions"]);
  });
});

describe("QuickActions intents", () => {
  it("requests each intent as a null-payload Prism event on button click", () => {
    const payloads: Record<string, unknown[]> = {
      "quick-actions.create-dossier": [],
      "quick-actions.import-evidence": [],
      "quick-actions.open-shared": [],
    };
    const unsubscribers = (Object.keys(payloads) as Array<string>).map((eventId) =>
      subscribeToEvent(eventId, (payload) => {
        payloads[eventId]?.push(payload);
      }),
    );
    renderActions();
    fireEvent.click(screen.getByTestId("quick-action-create-dossier"));
    fireEvent.click(screen.getByTestId("quick-action-import-evidence"));
    fireEvent.click(screen.getByTestId("quick-action-open-shared"));
    expect(payloads["quick-actions.create-dossier"]).toEqual([null]);
    expect(payloads["quick-actions.import-evidence"]).toEqual([null]);
    expect(payloads["quick-actions.open-shared"]).toEqual([null]);
    for (const unsubscribe of unsubscribers) {
      unsubscribe();
    }
  });

  it("requests the same intent repeatedly (one event per click)", () => {
    const payloads: unknown[] = [];
    const unsubscribe = subscribeToEvent(intentEventIdForAction("create-dossier"), (payload) => {
      payloads.push(payload);
    });
    renderActions();
    fireEvent.click(screen.getByTestId("quick-action-create-dossier"));
    fireEvent.click(screen.getByTestId("quick-action-create-dossier"));
    expect(payloads).toEqual([null, null]);
    unsubscribe();
  });
});
