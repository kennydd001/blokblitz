import type { Game } from "../game/Game";
import { childFocusAction, childFocusTitle, childRepresentationName } from "../education/focusLabels";
import { availableRemediations } from "../education/literacy/minimalPairs";
import { weeklyDigest } from "../education/parentInsights";
import type { CurriculumCell } from "../education/types";
import { BaseScene, sceneHeader } from "./SceneUtils";

const DOMAIN_LABELS: Record<string, string> = {
  "literacy-phonemic": "Klanken horen",
  "literacy-reading": "Letters & woorden",
  "literacy-writing": "Letters schrijven",
  "listening-comprehension": "Luisteren",
  "math-number": "Getallen tot 20",
  "math-operations": "Plus & min tot 20",
  "math-geometry": "Vormen",
  "math-measurement": "Meten, geld & klok",
  "world-traffic": "Verkeer"
};

export class ParentDashboardScene extends BaseScene {
  constructor(game: Game) {
    super(game, "parent-dashboard");
  }

  mount(): void {
    super.mount();
    this.game.resetWorld("summary");
    this.game.audio.stopMusic();
    this.render();
  }

  private render(): void {
    this.root.replaceChildren();
    const tracker = this.game.mastery;
    const data = this.game.data();
    const dashboard = document.createElement("div");
    dashboard.className = "dashboard-grid";
    const focus = this.game.adaptive.recommendFocus();
    const guide = document.createElement("section");
    guide.className = "dashboard-guide";
    guide.innerHTML = `
      <p class="eyebrow">Dino Coach</p>
      <h2>${childFocusTitle(focus.skill)}</h2>
      <p>${childFocusAction(focus.skill)}</p>
      <span>${childRepresentationName(focus.representation)} - ${focus.range} - ${this.game.adaptive.suggestedNextFocus()}</span>
    `;

    dashboard.append(
      this.panel("Deze week", this.weekRows()),
      this.panel("Mastery per skill", tracker.masteryBySkill().map((item) => this.bar(childFocusTitle(item.skill), item.accuracy, `${item.exposures}x ${item.mastery}`))),
      this.panel("Per doel: wat kan je kind al?", this.curriculumMasteryRows()),
      this.panel("Splits (rekenbordje)", this.splitRows()),
      this.panel("Lezen (klanken)", this.readingRows()),
      this.panel("Schrijven", this.writingRows()),
      this.panel("Klankparen om te oefenen", this.klankparenRows()),
      this.panel("Rekenen tot 20", this.math20Rows()),
      this.panel("Vormen & meten", this.geomRows()),
      this.panel(
        "Mastery per representatie",
        tracker.masteryByRepresentation().map((item) => this.bar(childRepresentationName(item.representation), item.accuracy, `${item.exposures}x ${item.mastery}`))
      ),
      this.panel(
        "Zwakste hoeveelheden",
        tracker.weakestQuantities().map((item) => this.line(`${item.quantity}`, `${Math.round(item.accuracy * 100)}% uit ${item.exposures}`))
      ),
      this.panel(
        "Zwakste ranges",
        tracker.weakestRanges().map((item) => this.line(item.range, `${Math.round(item.accuracy * 100)}% uit ${item.exposures}`))
      ),
      this.panel("Misconcepties", tracker.misconceptionSummary().map((item) => this.line("Let op", item))),
      this.panel("Reactietijd trend", tracker.reactionTimeTrend().map((rt, index) => this.line(`#${index + 1}`, `${rt} ms`))),
      this.panel("Sessies", data.progress.sessions.slice(-6).map((session) => this.line(session.id.slice(0, 18), `${session.attempts} pogingen, ${session.starsEarned} sterren`))),
      this.panel(
        "Recente voortgang",
        tracker
          .recentProgress(6)
          .map((attempt) =>
            this.line(
              `${attempt.quantity} ${childRepresentationName(attempt.representation)}`,
              `${attempt.wasCorrect ? "goed" : "hulp"} - ${attempt.challengeType} - ${attempt.reactionTimeMs} ms`
            )
          )
      ),
      this.panel("Volgende focus", [this.line("Advies", childFocusAction(focus.skill)), this.line("Hint rate", `${Math.round(tracker.hintRate() * 100)}%`)])
    );

    const actions = document.createElement("div");
    actions.className = "scene-actions";
    actions.append(
      this.button("Export JSON", () => this.exportJson(), "secondary"),
      this.button("Reset voortgang", () => this.reset(), "danger"),
      this.button("Menu", () => this.game.showScene("mainMenu"), "ghost")
    );
    this.root.append(sceneHeader("Ouder dashboard", "Echte opgeslagen mastery data."), guide, dashboard, actions);
  }

  // This week at a glance — the parent's weekly digest: how much the child
  // practised, how it went, the most-played domain, and which specific targets
  // are strong or still need a visit. Pure summary from the logged attempts.
  private weekRows(): HTMLElement[] {
    const digest = weeklyDigest(this.game.mastery.getAttempts(), Date.now());
    const rows: HTMLElement[] = [this.line("Samenvatting", digest.headline)];
    if (digest.attempts === 0) return rows;
    rows.push(
      this.line("Opdrachten", `${digest.attempts} op ${digest.activeDays} ${digest.activeDays === 1 ? "dag" : "dagen"}`),
      this.line("Juist", `${Math.round(digest.accuracy * 100)}%`),
      this.line("Oefentijd", `± ${digest.minutesPracticed} min`)
    );
    const top = digest.domains[0];
    if (top) rows.push(this.line("Meest gespeeld", `${top.label} · ${top.attempts}x`));
    if (digest.mastered.length) rows.push(this.line("Sterk", digest.mastered.slice(0, 3).map((t) => this.humanTarget(t.targetKey)).join(", ")));
    if (digest.needsPractice.length) rows.push(this.line("Oefen nog", digest.needsPractice.slice(0, 3).map((t) => this.humanTarget(t.targetKey)).join(", ")));
    rows.push(this.line("Tip", digest.encouragement));
    return rows;
  }

  // Minimal-pair home practice: once the child has read a bit, suggest concrete
  // "hear the difference" word pairs (vis/vos, bal/bel) for the sound contrasts
  // that trip up beginners — the strongest remediation a parent can do at home.
  private klankparenRows(): HTMLElement[] {
    const hasReading = this.game.mastery.getAttempts().some((a) => a.domain?.startsWith("literacy"));
    if (!hasReading) return [];
    return availableRemediations().map(({ contrast, pairs }) => {
      const p = pairs[0];
      return this.line(`Hoor ${contrast[0]} / ${contrast[1]}`, `${p.a.emoji} ${p.a.word} – ${p.b.emoji} ${p.b.word}`);
    });
  }

  // Splitbord progress: the part-whole splits logged via the Splitbord mode.
  private splitRows(): HTMLElement[] {
    const splits = this.game.mastery.getAttempts().filter((a) => a.challengeType.startsWith("splitbord-"));
    if (splits.length === 0) return [];
    const correct = splits.filter((a) => a.wasCorrect).length;
    const acc = Math.round((correct / splits.length) * 100);
    const rts = splits.filter((a) => a.wasCorrect && a.reactionTimeMs > 0).map((a) => a.reactionTimeMs).sort((x, y) => x - y);
    const medRT = rts.length ? rts[Math.floor(rts.length / 2)] : 0;
    return [
      this.line("Pogingen", String(splits.length)),
      this.line("Juist", `${acc}%`),
      this.line("Mediane reactietijd", `${medRT} ms`)
    ];
  }

  // Reading progress: phonemic-awareness (Klankgrot) attempts, by domain.
  private readingRows(): HTMLElement[] {
    const reading = this.game.mastery.getAttempts().filter((a) => a.domain === "literacy-phonemic" || a.domain === "literacy-reading");
    if (reading.length === 0) return [];
    const pct = (xs: typeof reading): number => (xs.length ? Math.round((xs.filter((a) => a.wasCorrect).length / xs.length) * 100) : 0);
    const discriminate = reading.filter((a) => a.skill === "soundDiscriminate");
    const blend = reading.filter((a) => a.skill === "soundBlend");
    const letters = reading.filter((a) => a.skill === "letterSound");
    const rows = [
      this.line("Pogingen", String(reading.length)),
      this.line("Juist", `${pct(reading)}%`),
      this.line("Klank herkennen", `${pct(discriminate)}% uit ${discriminate.length}`),
      this.line("Samenvoegen", `${pct(blend)}% uit ${blend.length}`)
    ];
    if (letters.length) rows.push(this.line("Letter & klank", `${pct(letters)}% uit ${letters.length}`));
    return rows;
  }

  private writingRows(): HTMLElement[] {
    const writing = this.game.mastery.getAttempts().filter((attempt) => attempt.domain === "literacy-writing");
    if (writing.length === 0) return [];
    const correct = writing.filter((attempt) => attempt.wasCorrect).length;
    const clean = writing.filter((attempt) => attempt.wasCorrect && !attempt.hintUsed).length;
    const formed = new Set(writing.filter((attempt) => attempt.wasCorrect).map((attempt) => attempt.targetKey)).size;
    return [
      this.line("Pogingen", String(writing.length)),
      this.line("Spoor gevolgd", `${Math.round((correct / writing.length) * 100)}%`),
      this.line("Zonder hulp", `${Math.round((clean / writing.length) * 100)}%`),
      this.line("Lettertekens gelukt", String(formed))
    ];
  }

  // Math-to-20 progress (Tientalhuis teen structure, later bridge/number-line).
  private math20Rows(): HTMLElement[] {
    const attempts = this.game.mastery.getAttempts().filter((a) => a.domain === "math-number" || a.domain === "math-operations");
    if (attempts.length === 0) return [];
    const pct = (xs: typeof attempts): number => (xs.length ? Math.round((xs.filter((a) => a.wasCorrect).length / xs.length) * 100) : 0);
    const teen = attempts.filter((a) => a.skill === "teenNumber");
    const line = attempts.filter((a) => a.skill === "numberLine20");
    const addsub = attempts.filter((a) => a.skill === "addSub20" || a.skill === "bridge10");
    const rows = [this.line("Pogingen", String(attempts.length)), this.line("Juist", `${pct(attempts)}%`)];
    if (teen.length) rows.push(this.line("Tienerstructuur", `${pct(teen)}% uit ${teen.length}`));
    if (line.length) rows.push(this.line("Getallenlijn", `${pct(line)}% uit ${line.length}`));
    if (addsub.length) rows.push(this.line("Plus & min tot 20", `${pct(addsub)}% uit ${addsub.length}`));
    return rows;
  }

  // Measurement + geometry (shapes / patterns / measure / money / time).
  private geomRows(): HTMLElement[] {
    const attempts = this.game.mastery.getAttempts().filter((a) => a.domain === "math-geometry" || a.domain === "math-measurement");
    if (attempts.length === 0) return [];
    const pct = (xs: typeof attempts): number => (xs.length ? Math.round((xs.filter((a) => a.wasCorrect).length / xs.length) * 100) : 0);
    const shapes = attempts.filter((a) => a.skill === "shapeRecognize");
    const patterns = attempts.filter((a) => a.skill === "patternContinue");
    const rows = [this.line("Pogingen", String(attempts.length)), this.line("Juist", `${pct(attempts)}%`)];
    if (shapes.length) rows.push(this.line("Vormen", `${pct(shapes)}% uit ${shapes.length}`));
    if (patterns.length) rows.push(this.line("Patronen", `${pct(patterns)}% uit ${patterns.length}`));
    return rows;
  }

  // Per-target curriculum mastery: for each learning domain, how many specific
  // targets (a sound, a word, a split, a teen) are secure/fluent vs still
  // emerging, and which one to practise next. The payoff of the mastery model.
  private curriculumMasteryRows(): HTMLElement[] {
    const cells = this.game.mastery.curriculumCells();
    if (cells.length === 0) return [];
    const byDomain = new Map<string, CurriculumCell[]>();
    for (const cell of cells) {
      const list = byDomain.get(cell.domain) ?? [];
      list.push(cell);
      byDomain.set(cell.domain, list);
    }
    const rows: HTMLElement[] = [];
    for (const [domain, list] of byDomain) {
      const solid = list.filter((c) => c.mastery !== "emerging").length;
      const weakest = [...list].sort((a, b) => a.accuracy - b.accuracy)[0];
      const label = DOMAIN_LABELS[domain] ?? domain;
      const detail =
        weakest && weakest.mastery === "emerging" && weakest.exposures >= 3
          ? `${solid}/${list.length} beheerst · oefen: ${this.humanTarget(weakest.targetKey)}`
          : `${solid}/${list.length} beheerst`;
      rows.push(this.line(label, detail));
    }
    return rows;
  }

  /** A friendly name for a target key ("letter-s" -> "letter s", "line-13" -> "getal 13"). */
  private humanTarget(key: string): string {
    const [head, ...rest] = key.split("-");
    const tail = rest.join("-");
    if (head === "letter") return `letter ${tail}`;
    if (head === "write") return `schrijf ${tail}`;
    if (head === "line") return `getal ${tail}`;
    if (head === "begin" || head === "end" || head === "blend") return tail;
    return tail || key;
  }

  private panel(title: string, rows: HTMLElement[]): HTMLElement {
    const panel = document.createElement("section");
    panel.className = "dashboard-panel";
    panel.innerHTML = `<h2>${title}</h2>`;
    const body = document.createElement("div");
    body.className = "panel-list";
    if (rows.length === 0) body.appendChild(this.line("Nog geen data", "Speel een paar opdrachten."));
    else rows.forEach((row) => body.appendChild(row));
    panel.appendChild(body);
    return panel;
  }

  private bar(label: string, value: number, detail: string): HTMLElement {
    const row = document.createElement("div");
    row.className = "dash-row";
    const pct = Math.round(value * 100);
    row.innerHTML = `<div><strong>${label}</strong><span>${detail}</span></div><div class="mini-track"><div style="width:${pct}%"></div></div><b>${pct}%</b>`;
    return row;
  }

  private line(label: string, detail: string): HTMLElement {
    const row = document.createElement("div");
    row.className = "dash-line";
    row.innerHTML = `<strong>${label}</strong><span>${detail}</span>`;
    return row;
  }

  private exportJson(): void {
    const blob = new Blob([this.game.save.exportJson()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "blokblitz-progress.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  private reset(): void {
    if (!window.confirm("Alle voortgang wissen?")) return;
    this.game.save.reset();
    this.game.mastery.setAttempts([]);
    this.render();
  }
}
