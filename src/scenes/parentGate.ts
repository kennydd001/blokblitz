// A light "for grown-ups" gate in front of the parent dashboard and settings, so
// a 4-7 year old playing alone doesn't wander into them. A simple sum a young
// child can't solve yet — not real security, just a friendly speed bump.

export interface ParentGateOptions {
  holdToConfirm?: boolean;
  holdMs?: number;
  holdPrompt?: string;
}

export function openParentGate(onPass: () => void, options: ParentGateOptions = {}): void {
  const a = 4 + Math.floor(Math.random() * 6); // 4..9
  const b = 5 + Math.floor(Math.random() * 5); // 5..9
  const answer = a + b;
  const answerOptions = shuffle([answer, answer + 1, answer - 2]);

  const overlay = document.createElement("div");
  overlay.className = "parent-gate-overlay";
  overlay.dataset.parentGate = "true";

  const card = document.createElement("div");
  card.className = "parent-gate-card";
  card.setAttribute("role", "dialog");
  card.setAttribute("aria-modal", "true");
  card.setAttribute("aria-label", "Controle voor volwassenen");
  const title = document.createElement("p");
  title.className = "parent-gate-title";
  title.textContent = "Voor volwassenen";
  const question = document.createElement("strong");
  question.className = "parent-gate-question";
  question.textContent = `${a} + ${b} = ?`;

  const row = document.createElement("div");
  row.className = "parent-gate-options";
  answerOptions.forEach((value) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "btn parent-gate-option";
    button.dataset.correct = String(value === answer);
    button.textContent = String(value);
    button.addEventListener("click", () => {
      if (value === answer) {
        if (options.holdToConfirm) {
          showHoldStep();
        } else {
          overlay.remove();
          onPass();
        }
      } else {
        card.classList.remove("shake");
        void card.offsetWidth;
        card.classList.add("shake");
      }
    });
    row.appendChild(button);
  });

  const cancel = document.createElement("button");
  cancel.type = "button";
  cancel.className = "btn ghost parent-gate-cancel";
  cancel.textContent = "Terug";
  cancel.addEventListener("click", () => overlay.remove());

  card.append(title, question, row, cancel);
  overlay.appendChild(card);
  document.body.appendChild(overlay);

  function showHoldStep(): void {
    question.textContent = options.holdPrompt ?? "Houd vast om te wisselen";
    const hold = document.createElement("button");
    hold.type = "button";
    hold.className = "btn primary parent-gate-hold";
    hold.textContent = "Ingedrukt houden";
    const holdMs = Math.max(700, options.holdMs ?? 1200);
    let timer: number | undefined;
    let ready = false;
    let finishing = false;

    const cancelHold = (): void => {
      if (timer !== undefined) window.clearTimeout(timer);
      timer = undefined;
      ready = false;
      hold.classList.remove("holding", "complete");
      hold.textContent = "Ingedrukt houden";
    };
    const beginHold = (): void => {
      if (timer !== undefined || finishing) return;
      ready = false;
      hold.classList.add("holding");
      timer = window.setTimeout(() => {
        timer = undefined;
        ready = true;
        hold.classList.add("complete");
        hold.textContent = "Loslaten om te bevestigen";
      }, holdMs);
    };
    const finishHold = (event: Event): void => {
      event.preventDefault();
      if (!ready || finishing) {
        cancelHold();
        return;
      }
      finishing = true;
      hold.classList.remove("holding");
      // Keep the modal above the destination until this pointer event is fully
      // finished. Otherwise touchend can become a ghost click on the new scene.
      window.setTimeout(() => {
        overlay.remove();
        onPass();
      }, 0);
    };

    hold.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      try {
        hold.setPointerCapture?.(event.pointerId);
      } catch {
        // Pointer capture is optional in older WebViews.
      }
      beginHold();
    });
    hold.addEventListener("pointerup", finishHold);
    hold.addEventListener("pointercancel", cancelHold);
    hold.addEventListener("pointerleave", cancelHold);
    hold.addEventListener("keydown", (event) => {
      if ((event.key === "Enter" || event.key === " ") && !event.repeat) beginHold();
    });
    hold.addEventListener("keyup", finishHold);
    row.replaceChildren(hold);
  }
}

function shuffle<T>(items: T[]): T[] {
  return [...items].sort(() => Math.random() - 0.5);
}
