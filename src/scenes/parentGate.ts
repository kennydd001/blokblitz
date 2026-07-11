// A light "for grown-ups" gate in front of the parent dashboard and settings, so
// a 4-7 year old playing alone doesn't wander into them. A simple sum a young
// child can't solve yet — not real security, just a friendly speed bump.

export interface ParentGateOptions {
  holdToConfirm?: boolean;
  holdMs?: number;
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
    question.textContent = "Houd vast om te wisselen";
    const hold = document.createElement("button");
    hold.type = "button";
    hold.className = "btn primary parent-gate-hold";
    hold.textContent = "Ingedrukt houden";
    const holdMs = Math.max(700, options.holdMs ?? 1200);
    let timer: number | undefined;

    const cancelHold = (): void => {
      if (timer !== undefined) window.clearTimeout(timer);
      timer = undefined;
      hold.classList.remove("holding");
    };
    const beginHold = (): void => {
      if (timer !== undefined) return;
      hold.classList.add("holding");
      timer = window.setTimeout(() => {
        timer = undefined;
        overlay.remove();
        onPass();
      }, holdMs);
    };

    hold.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      beginHold();
    });
    hold.addEventListener("pointerup", cancelHold);
    hold.addEventListener("pointercancel", cancelHold);
    hold.addEventListener("pointerleave", cancelHold);
    hold.addEventListener("keydown", (event) => {
      if ((event.key === "Enter" || event.key === " ") && !event.repeat) beginHold();
    });
    hold.addEventListener("keyup", cancelHold);
    row.replaceChildren(hold);
  }
}

function shuffle<T>(items: T[]): T[] {
  return [...items].sort(() => Math.random() - 0.5);
}
