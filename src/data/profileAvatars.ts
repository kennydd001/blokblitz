export interface ProfileAvatar {
  id: string;
  label: string;
  mark: string;
  color: string;
  accent: string;
  ink: string;
}

/** Child identity signs are deliberately separate from unlockable hero skins. */
export const PROFILE_AVATARS: ProfileAvatar[] = [
  { id: "blitz", label: "Gele ster", mark: "★", color: "#ffd54a", accent: "#f97316", ink: "#172033" },
  { id: "aqua", label: "Blauwe golf", mark: "≋", color: "#35a7f0", accent: "#0f5fae", ink: "#ffffff" },
  { id: "web", label: "Roze vonk", mark: "✦", color: "#ef476f", accent: "#7c2fd0", ink: "#ffffff" },
  { id: "ember", label: "Oranje berg", mark: "▲", color: "#ff7a2f", accent: "#b42318", ink: "#ffffff" },
  { id: "shadow", label: "Paarse maan", mark: "☾", color: "#7c5ce0", accent: "#34256f", ink: "#ffffff" },
  { id: "gold", label: "Groene ruit", mark: "◆", color: "#23b26d", accent: "#0f6b45", ink: "#ffffff" }
];

export const PROFILE_AVATAR_IDS = PROFILE_AVATARS.map((avatar) => avatar.id);

export function profileAvatarById(id: string | undefined): ProfileAvatar {
  return PROFILE_AVATARS.find((avatar) => avatar.id === id) ?? PROFILE_AVATARS[0];
}
