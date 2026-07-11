import { PROFILE_AVATARS, profileAvatarById } from "../data/profileAvatars";

export { PROFILE_AVATARS, profileAvatarById } from "../data/profileAvatars";
export type { ProfileAvatar } from "../data/profileAvatars";

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
