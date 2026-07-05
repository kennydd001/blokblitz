import * as THREE from "three";

// The WebGL layer, split out of Game so Three.js (~475 kB) loads lazily.
// The map/mini-modes are pure DOM and boot without it; Game kicks off the
// dynamic import in start() so the chunk is usually ready before the child
// reaches the runner. Everything 3D-only lives here: renderer, scene, camera,
// the ambient menu backdrop and the per-frame render.
export class Stage3D {
  readonly renderer: THREE.WebGLRenderer;
  readonly world: THREE.Scene;
  readonly camera: THREE.PerspectiveCamera;
  private readonly animatedObjects: THREE.Object3D[] = [];

  constructor(stage: HTMLElement) {
    this.world = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(55, 1, 0.1, 100);
    this.camera.position.set(0, 4.2, 8.5);
    this.camera.lookAt(0, 0.6, 0);
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.08;
    stage.appendChild(this.renderer.domElement);
  }

  resize(width: number, height: number): void {
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
  }

  resetWorld(theme: "menu" | "summary" = "menu"): void {
    this.world.clear();
    this.animatedObjects.length = 0;
    this.camera.position.set(0, 4.2, 8.5);
    this.camera.lookAt(0, 0.6, 0);
    const palette = {
      menu: { sky: 0xb9e8ff, ground: 0x6ee7b7, accent: 0xf6c453 },
      summary: { sky: 0xfffbeb, ground: 0xa7f3d0, accent: 0xf6c453 }
    }[theme];
    this.world.background = new THREE.Color(palette.sky);

    const ambient = new THREE.HemisphereLight(0xffffff, 0x335533, 2.4);
    this.world.add(ambient);
    const sun = new THREE.DirectionalLight(0xffffff, 1.9);
    sun.position.set(3, 7, 5);
    sun.castShadow = true;
    this.world.add(sun);

    const ground = new THREE.Mesh(
      new THREE.BoxGeometry(18, 0.3, 20),
      new THREE.MeshStandardMaterial({ color: palette.ground, roughness: 0.85 })
    );
    ground.position.set(0, -0.24, -2);
    ground.receiveShadow = true;
    this.world.add(ground);

    this.addMenuWorld(palette.accent);
  }

  update(dt: number, elapsed: number): void {
    for (const object of this.animatedObjects) {
      object.rotation.y += dt * 0.35;
      object.position.y += Math.sin(elapsed * 1.5 + object.position.x) * 0.002;
    }
    this.renderer.render(this.world, this.camera);
  }

  private addMenuWorld(accent: number): void {
    const base = new THREE.Mesh(new THREE.DodecahedronGeometry(1.25, 0), new THREE.MeshStandardMaterial({ color: accent, roughness: 0.5 }));
    base.position.set(0, 1.4, -2.7);
    this.world.add(base);
    this.animatedObjects.push(base);
    for (let i = 0; i < 10; i += 1) {
      const star = new THREE.Mesh(new THREE.TetrahedronGeometry(0.18, 0), new THREE.MeshStandardMaterial({ color: 0xfef08a, roughness: 0.4 }));
      star.position.set(Math.cos(i) * 4, 1.2 + (i % 3) * 0.5, -3 + Math.sin(i) * 2);
      this.world.add(star);
      this.animatedObjects.push(star);
    }
  }
}
