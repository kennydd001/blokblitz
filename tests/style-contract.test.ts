import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("responsive gameplay CSS contract", () => {
  const css = readFileSync("src/style.css", "utf8").replace(/\r\n/g, "\n");

  it("keeps live gameplay chrome compact on short desktop viewports", () => {
    expect(css).toContain("@media (max-height: 760px) and (min-width: 700px)");
    expect(css).toContain(".play-target {\n    min-height: 66px;");
    expect(css).toContain("padding: calc(94px + env(safe-area-inset-top)) 0 calc(62px + env(safe-area-inset-bottom)) !important;");
    expect(css).toContain(".scene-layer.gameplay-layer .action-pad-button,\n  .scene-layer.gameplay-layer .gameplay-actions .btn,\n  .city-build-live .action-pad-button,\n  .city-build-live .city-build-controls .btn {\n    min-height: 44px;");
    expect(css).toContain(".play-field-layer.mini .mini-objects {\n    padding: calc(150px + env(safe-area-inset-top)) 0 calc(62px + env(safe-area-inset-bottom));");
    expect(css).toContain(".city-build-live .build-choices {\n    padding: calc(104px + env(safe-area-inset-top)) 0 calc(62px + env(safe-area-inset-bottom));");
  });
});
