import "./style.css";
import { Game } from "./game/Game";

const root = document.querySelector<HTMLElement>("#app");
if (!root) throw new Error("Missing #app root");

const game = new Game(root);
document.body.classList.toggle("high-contrast", game.data().settings.highContrast);
if (new URLSearchParams(window.location.search).has("qa")) {
  (window as Window & { __blokblitzGame?: Game }).__blokblitzGame = game;
}
game.start();

const isProductionBuild = Boolean((import.meta as ImportMeta & { env?: { PROD?: boolean } }).env?.PROD);
if (isProductionBuild && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => undefined);
  });
}

window.addEventListener("beforeunload", () => game.stop());
