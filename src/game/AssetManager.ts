export class AssetManager {
  readonly runtimePolicy = "local-first procedural assets";

  describe(): string {
    return "All runtime visuals are generated from local SVG, CSS, Three.js primitives, and Web Audio.";
  }
}

