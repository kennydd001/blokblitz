export interface ProfileAvatar {
  id: string;
  label: string;
  mark: string;
  color: string;
  accent: string;
  ink: string;
}

/** Profile identity is deliberately separate from star-unlocked hero skins. */
export const PROFILE_AVATARS: ProfileAvatar[] = [
  { id: "blitz", label: "Gele ster", mark: "★", color: "#ffd54a", accent: "#f97316", ink: "#172033" },
  { id: "aqua", label: "Blauwe golf", mark: "≋", color: "#35a7f0", accent: "#0f5fae", ink: "#ffffff" },
  { id: "web", label: "Roze vonk", mark: "✦", color: "#ef476f", accent: "#7c2fd0", ink: "#ffffff" },
  { id: "ember", label: "Oranje berg", mark: "▲", color: "#ff7a2f", accent: "#b42318", ink: "#ffffff" },
  { id: "shadow", label: "Paarse maan", mark: "☾", color: "#7c5ce0", accent: "#34256f", ink: "#ffffff" },
  { id: "gold", label: "Groene ruit", mark: "◆", color: "#23b26d", accent: "#0f6b45", ink: "#ffffff" }
];

export function profileAvatarById(id: string | undefined): ProfileAvatar {
  return PROFILE_AVATARS.find((avatar) => avatar.id === id) ?? PROFILE_AVATARS[0];
}

export function createProfileAvatar(id: string | undefined): HTMLElement {
  const avatar = profileAvatarById(id);
  const token = document.createElement("span");
  token.className = "profile-token";
  token.dataset.avatar = avatar.id;
  token.style.setProperty("--profile-color", avatar.color);
  token.style.setProperty("--profile-accent", avatar.accent);
  token.style.setProperty("--profile-ink", avatar.ink);
  token.setAttribute("aria-hidden", "true");
  const mark = document.createElement("span");
  mark.className = "profile-token-mark";
  mark.textContent = avatar.mark;
  token.appendChild(mark);
  return token;
}
