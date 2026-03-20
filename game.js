const canvas = document.getElementById("game");
let ctx = null;

const ui = {
  healthBar: document.getElementById("healthBar"),
  manaBar: document.getElementById("manaBar"),
  healthText: document.getElementById("healthText"),
  manaText: document.getElementById("manaText"),
  xpText: document.getElementById("xpText"),
  potionText: document.getElementById("potionText"),
  equipmentList: document.getElementById("equipmentList"),
  skillBar: document.getElementById("skillBar"),
  objectiveText: document.getElementById("objectiveText"),
  log: document.getElementById("log"),
  gameOverlay: document.getElementById("gameOverlay"),
  overlayEyebrow: document.getElementById("overlayEyebrow"),
  overlayTitle: document.getElementById("overlayTitle"),
  overlayText: document.getElementById("overlayText"),
  overlayButton: document.getElementById("overlayButton"),
  screenBlood: document.getElementById("screenBlood"),
  volumeSlider: document.getElementById("volumeSlider"),
  muteButton: document.getElementById("muteButton"),
  unmuteButton: document.getElementById("unmuteButton"),
};

const FIGMA_FILE_KEY = "uAE3qp0yu260EGhcS636h9";
const MAIN_THEME_URL = "./assets/main-theme.mp3";

const WORLD = {
  width: 2800,
  height: 2800,
  pickupRadius: 72,
};

const SLOT_ORDER = ["weapon", "helmet", "armor", "boots"];

const SLOT_META = {
  weapon: { label: "Weapon", key: "Q", icon: "⚔" },
  helmet: { label: "Helmet", key: "W", icon: "☠" },
  armor: { label: "Armor", key: "E", icon: "🛡" },
  boots: { label: "Boots", key: "R", icon: "🥾" },
};

const ITEM_POOLS = {
  weapon: [
    {
      name: "Rusty Fork",
      skill: { name: "Fork Flurry", manaCost: 10, cooldown: 200, color: "#ff9d57", execute: forkFlurry },
      bonus: { power: 3 },
      rarity: "common",
    },
    {
      name: "Vine-Cleaver",
      skill: { name: "Root Slice", manaCost: 10, cooldown: 100, color: "#8fdc59", execute: rootSlice },
      bonus: { power: 5 },
      rarity: "rare",
    },
    {
      name: "Rebar Guillotine",
      skill: { name: "Root Slice", manaCost: 10, cooldown: 100, color: "#d7ff72", execute: rootSlice },
      bonus: { power: 7 },
      rarity: "epic",
    },
  ],
  helmet: [
    {
      name: "Tin-Pot Helm",
      skill: { name: "Radar Pulse", manaCost: 16, cooldown: 1000, color: "#72d6ff", execute: radarPulse },
      bonus: { maxMana: 12 },
      rarity: "common",
    },
    {
      name: "Mold-Cork Hood",
      skill: { name: "Rotten Trap", manaCost: 15, cooldown: 2000, color: "#6fe7dd", execute: rottenTrap },
      bonus: { maxMana: 20 },
      rarity: "rare",
    },
    {
      name: "Spore Prophet Mask",
      skill: { name: "Rotten Trap", manaCost: 15, cooldown: 2000, color: "#72f0bb", execute: rottenTrap },
      bonus: { maxMana: 30 },
      rarity: "epic",
    },
  ],
  armor: [
    {
      name: "Pan Lid Plate",
      skill: { name: "Scrap Shield", manaCost: 20, cooldown: 2000, color: "#9fd356", execute: scrapShield },
      bonus: { maxHealth: 18 },
      rarity: "common",
    },
    {
      name: "Baraboiled Harness",
      skill: { name: "Baraboiled Speed", manaCost: 20, cooldown: 2000, color: "#ffb957", execute: baraboiledSpeed },
      bonus: { maxHealth: 28 },
      rarity: "rare",
    },
    {
      name: "Steamskin Cuirass",
      skill: { name: "Baraboiled Speed", manaCost: 20, cooldown: 2000, color: "#ffcf72", execute: baraboiledSpeed },
      bonus: { maxHealth: 40 },
      rarity: "epic",
    },
  ],
  boots: [
    {
      name: "Roller Skates",
      skill: { name: "Laser Attack", manaCost: 50, cooldown: 1000, color: "#ff77aa", execute: laserAttack },
      bonus: { speed: 0.5 },
      rarity: "common",
    },
    {
      name: "Pulper Treads",
      skill: { name: "Mash", manaCost: 100, cooldown: 1000, color: "#ffa4d1", execute: mash },
      bonus: { speed: 0.8 },
      rarity: "rare",
    },
    {
      name: "Catacomb Crushers",
      skill: { name: "Mash", manaCost: 100, cooldown: 1000, color: "#ffc3df", execute: mash },
      bonus: { speed: 1.1 },
      rarity: "epic",
    },
  ],
};

const ENEMY_TYPES = [
  { type: "rat", name: "Ash Rat", color: "#9f8e7c", hp: 30, speed: 1.4, damage: 8, xp: 16, size: 18 },
  { type: "rat", name: "Toxic Rat", color: "#7eb35d", hp: 42, speed: 1.6, damage: 12, xp: 22, size: 20 },
  { type: "insect", name: "Shard Beetle", color: "#6ec7df", hp: 34, speed: 1.8, damage: 10, xp: 18, size: 17 },
  { type: "insect", name: "Plasma Moth", color: "#d985c2", hp: 28, speed: 2.1, damage: 9, xp: 19, size: 16 },
];

const state = {
  keys: new Set(),
  projectiles: [],
  enemies: [],
  pickups: [],
  obstacles: [],
  traps: [],
  bloodPools: [],
  particles: [],
  effects: [],
  floatingTexts: [],
  time: 0,
  enemySpawnTimer: 0,
  lootTimer: 0,
  crowdBloodTimer: 0,
  currentLevel: 1,
  nextId: 1,
  levelKills: 0,
  levelKillGoal: 14,
  countdownRemaining: 3,
  mode: "start",
  bossSpawned: false,
  gameOver: false,
  victory: false,
  logEntries: [],
  screenBlood: [],
  screenShake: {
    intensity: 0,
    decay: 0.88,
    x: 0,
    y: 0,
  },
  camera: {
    x: WORLD.width / 2,
    y: WORLD.height / 2,
  },
  audio: {
    ctx: null,
    initialized: false,
    theme: null,
    lastStepAt: 0,
    musicVolume: 0.65,
    sfxVolume: 0.65,
    muted: false,
  },
  three: {
    enabled: false,
    renderer: null,
    scene: null,
    camera: null,
    ambient: null,
    sun: null,
    ground: [],
    decals: [],
    playerMesh: null,
    playerShield: null,
    playerMarker: null,
    flamePatches: [],
    meshes: {
      enemies: new Map(),
      pickups: new Map(),
      obstacles: new Map(),
      traps: new Map(),
      gore: new Map(),
      projectiles: new Map(),
      effects: new Map(),
    },
  },
  player: {
    x: WORLD.width / 2,
    y: WORLD.height / 2,
    radius: 24,
    speed: 2.6,
    baseSpeed: 2.6,
    health: 100,
    maxHealth: 100,
    mana: 100,
    maxMana: 100,
    attackPower: 10,
    level: 1,
    xp: 0,
    xpToNext: 50,
    healthPotions: 2,
    manaPotions: 2,
    basicCooldown: 0,
    hitFlash: 0,
    shieldUntil: 0,
    speedBoostUntil: 0,
    rollUntil: 0,
    rollVx: 0,
    rollVy: 0,
    facing: { x: -1, y: -1 },
    gear: { weapon: null, helmet: null, armor: null, boots: null },
    skillCooldowns: { weapon: 0, helmet: 0, armor: 0, boots: 0 },
  },
};

function bootGame() {
  initRenderer();
  resetPlayerForNewGame();
  clearWorldState();
  updateOverlay();
  renderHud();
  ui.overlayButton.addEventListener("click", handleOverlayAction);
  ui.volumeSlider.addEventListener("input", handleVolumeChange);
  ui.muteButton.addEventListener("click", muteAudio);
  ui.unmuteButton.addEventListener("click", unmuteAudio);
  requestAnimationFrame(loop);
}

function initRenderer() {
  if (window.THREE) {
    initThreeScene();
    return;
  }

  ctx = canvas.getContext("2d");
}

function createIndustrialGroundTexture(THREE) {
  const textureCanvas = document.createElement("canvas");
  textureCanvas.width = 1024;
  textureCanvas.height = 1024;
  const textureCtx = textureCanvas.getContext("2d");

  const base = textureCtx.createLinearGradient(0, 0, textureCanvas.width, textureCanvas.height);
  base.addColorStop(0, "#1a2128");
  base.addColorStop(0.5, "#202a33");
  base.addColorStop(1, "#131a20");
  textureCtx.fillStyle = base;
  textureCtx.fillRect(0, 0, textureCanvas.width, textureCanvas.height);

  for (let i = 0; i < 1800; i += 1) {
    const x = Math.random() * textureCanvas.width;
    const y = Math.random() * textureCanvas.height;
    const size = 1 + Math.random() * 3;
    textureCtx.fillStyle = `rgba(255,255,255,${0.012 + Math.random() * 0.03})`;
    textureCtx.fillRect(x, y, size, size);
  }

  const panelSize = 128;
  for (let y = 0; y < textureCanvas.height; y += panelSize) {
    for (let x = 0; x < textureCanvas.width; x += panelSize) {
      textureCtx.strokeStyle = "rgba(124, 150, 173, 0.18)";
      textureCtx.lineWidth = 4;
      textureCtx.strokeRect(x + 2, y + 2, panelSize - 4, panelSize - 4);

      textureCtx.strokeStyle = "rgba(16, 22, 28, 0.55)";
      textureCtx.lineWidth = 2;
      textureCtx.strokeRect(x + 10, y + 10, panelSize - 20, panelSize - 20);

      if ((x / panelSize + y / panelSize) % 3 === 0) {
        textureCtx.fillStyle = "rgba(255, 196, 84, 0.18)";
        textureCtx.fillRect(x + panelSize * 0.12, y + panelSize * 0.44, panelSize * 0.76, 10);
      }

      textureCtx.fillStyle = "rgba(0, 0, 0, 0.18)";
      textureCtx.beginPath();
      textureCtx.arc(x + 18, y + 18, 4, 0, Math.PI * 2);
      textureCtx.arc(x + panelSize - 18, y + 18, 4, 0, Math.PI * 2);
      textureCtx.arc(x + 18, y + panelSize - 18, 4, 0, Math.PI * 2);
      textureCtx.arc(x + panelSize - 18, y + panelSize - 18, 4, 0, Math.PI * 2);
      textureCtx.fill();
    }
  }

  for (let i = 0; i < 18; i += 1) {
    const x = 80 + Math.random() * (textureCanvas.width - 220);
    const y = 80 + Math.random() * (textureCanvas.height - 220);
    const w = 120 + Math.random() * 180;
    const h = 16 + Math.random() * 24;
    textureCtx.fillStyle = `rgba(150, 18, 18, ${0.05 + Math.random() * 0.07})`;
    textureCtx.fillRect(x, y, w, h);
    textureCtx.fillStyle = "rgba(255, 90, 90, 0.14)";
    textureCtx.fillRect(x, y, w * (0.2 + Math.random() * 0.6), 4);
  }

  const texture = new THREE.CanvasTexture(textureCanvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(8, 8);
  texture.anisotropy = 4;
  texture.needsUpdate = true;
  return texture;
}

function addIndustrialSetDressing(THREE, scene, groundTexture) {
  const decalMat = new THREE.MeshStandardMaterial({
    map: groundTexture,
    color: "#34404a",
    transparent: true,
    opacity: 0.18,
    roughness: 1,
    metalness: 0.1,
  });

  const decals = [];
  for (let i = 0; i < 14; i += 1) {
    const decal = new THREE.Mesh(new THREE.PlaneGeometry(3 + Math.random() * 3.5, 1.2 + Math.random() * 2), decalMat.clone());
    decal.rotation.x = -Math.PI / 2;
    decal.rotation.z = Math.random() * Math.PI;
    decal.position.set(rand(-20, 20), 0.03, rand(-20, 20));
    scene.add(decal);
    decals.push(decal);
  }

  const wallMat = new THREE.MeshStandardMaterial({ color: "#29313a", roughness: 0.92, metalness: 0.22 });
  const trimMat = new THREE.MeshStandardMaterial({ color: "#55606b", roughness: 0.6, metalness: 0.4 });
  const glowMat = new THREE.MeshBasicMaterial({ color: "#5dc7ff" });
  const wallSegments = [
    { x: 0, z: -27, w: 52, h: 4.6, d: 2.2 },
    { x: 0, z: 27, w: 52, h: 4.6, d: 2.2 },
    { x: -27, z: 0, w: 2.2, h: 4.6, d: 52 },
    { x: 27, z: 0, w: 2.2, h: 4.6, d: 52 },
  ];

  wallSegments.forEach((segment) => {
    const wall = new THREE.Mesh(new THREE.BoxGeometry(segment.w, segment.h, segment.d), wallMat);
    wall.position.set(segment.x, segment.h / 2 - 0.2, segment.z);
    wall.castShadow = true;
    wall.receiveShadow = true;
    scene.add(wall);

    const trim = new THREE.Mesh(new THREE.BoxGeometry(segment.w * 0.82, 0.18, Math.max(0.24, segment.d * 0.48)), trimMat);
    trim.position.set(segment.x, 1.4, segment.z + (segment.d > segment.w ? 0 : 0.02));
    scene.add(trim);

    if (segment.w > segment.d) {
      for (let i = -2; i <= 2; i += 1) {
        const lightBar = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.16, 0.08), glowMat);
        lightBar.position.set(segment.x + i * 7.5, 2.15, segment.z + (segment.z < 0 ? 1.08 : -1.08));
        scene.add(lightBar);
      }
    }
  });

  const beamMat = new THREE.MeshStandardMaterial({ color: "#171d23", roughness: 0.95, metalness: 0.2 });
  const cableMat = new THREE.MeshStandardMaterial({ color: "#4a2f2e", roughness: 0.9, metalness: 0.08 });

  for (let i = 0; i < 5; i += 1) {
    const support = new THREE.Group();
    const column = new THREE.Mesh(new THREE.BoxGeometry(1.2, 6.8, 1.2), beamMat);
    column.castShadow = true;
    column.receiveShadow = true;
    support.add(column);

    const brace = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.38, 0.8), trimMat);
    brace.position.y = 1.65;
    support.add(brace);

    const cable = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 4.5, 8), cableMat);
    cable.rotation.z = Math.PI / 2.8;
    cable.position.set(1.45, 1.2, 0);
    support.add(cable);

    support.position.set(i % 2 === 0 ? -18 : 18, 3, -15 + i * 8);
    scene.add(support);
  }

  const fogPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(60, 60),
    new THREE.MeshBasicMaterial({ color: "#8bb7d4", transparent: true, opacity: 0.055, depthWrite: false })
  );
  fogPlane.rotation.x = -Math.PI / 2;
  fogPlane.position.y = 0.18;
  scene.add(fogPlane);

  const flamePatches = [];
  for (let i = 0; i < 18; i += 1) {
    const patch = new THREE.Group();
    const glow = new THREE.Mesh(
      new THREE.CircleGeometry(0.7 + Math.random() * 0.45, 14),
      new THREE.MeshBasicMaterial({ color: "#ff5c2f", transparent: true, opacity: 0.26, side: THREE.DoubleSide })
    );
    glow.rotation.x = -Math.PI / 2;
    patch.add(glow);

    for (let j = 0; j < 3; j += 1) {
      const flame = new THREE.Mesh(
        new THREE.PlaneGeometry(0.42 + j * 0.14, 1.1 + j * 0.28),
        new THREE.MeshBasicMaterial({
          color: j === 0 ? "#fff0b8" : j === 1 ? "#ff9a3d" : "#d82818",
          transparent: true,
          opacity: 0.44 - j * 0.08,
          side: THREE.DoubleSide,
          depthWrite: false,
        })
      );
      flame.position.set((j - 1) * 0.22, 0.6 + j * 0.12, 0);
      patch.add(flame);
    }

    patch.position.set(rand(-22, 22), 0.03, rand(-22, 22));
    if (Math.hypot(patch.position.x, patch.position.z) < 5) {
      patch.position.x += 6;
      patch.position.z += 6;
    }
    scene.add(patch);
    flamePatches.push(patch);
  }

  return { decals, flamePatches };
}

function initThreeScene() {
  const THREE = window.THREE;
  if (!THREE) {
    ctx = canvas.getContext("2d");
    return;
  }

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(canvas.width, canvas.height, false);
  renderer.shadowMap.enabled = true;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#0c1218");
  scene.fog = new THREE.Fog("#0c1218", 16, 60);

  const camera = new THREE.PerspectiveCamera(42, canvas.width / canvas.height, 0.1, 200);
  camera.position.set(16, 20, 16);
  camera.lookAt(0, 0, 0);

  const ambient = new THREE.HemisphereLight("#8fa8be", "#101010", 1.1);
  scene.add(ambient);

  const sun = new THREE.DirectionalLight("#dcecff", 1.2);
  sun.position.set(11, 18, 8);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  scene.add(sun);

  const rimLight = new THREE.PointLight("#ff6a3c", 8, 20, 2);
  rimLight.position.set(-8, 2.6, 10);
  scene.add(rimLight);

  const cyanAccent = new THREE.PointLight("#4ad6ff", 9, 26, 2);
  cyanAccent.position.set(10, 3.6, -10);
  scene.add(cyanAccent);

  const groundTexture = createIndustrialGroundTexture(THREE);
  const ground = new THREE.Mesh(
    new THREE.BoxGeometry(58, 0.6, 58),
    new THREE.MeshStandardMaterial({
      map: groundTexture,
      color: "#c1d2df",
      roughness: 0.9,
      metalness: 0.16,
    })
  );
  ground.position.y = -0.32;
  ground.receiveShadow = true;
  scene.add(ground);
  state.three.ground.push(ground);

  const centerPlate = new THREE.Mesh(
    new THREE.CylinderGeometry(3.2, 3.2, 0.16, 36),
    new THREE.MeshStandardMaterial({ color: "#2f3b45", roughness: 0.84, metalness: 0.32 })
  );
  centerPlate.position.set(0, -0.02, 0);
  centerPlate.receiveShadow = true;
  scene.add(centerPlate);
  state.three.ground.push(centerPlate);

  const ring = new THREE.Mesh(
    new THREE.RingGeometry(1.15, 1.38, 36),
    new THREE.MeshBasicMaterial({ color: "#d8db48", transparent: true, opacity: 0.88, side: THREE.DoubleSide })
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.05;
  scene.add(ring);

  const dressing = addIndustrialSetDressing(THREE, scene, groundTexture);
  state.three.decals = dressing.decals;
  state.three.flamePatches = dressing.flamePatches;

  const playerMesh = createPlayerGroup(THREE);
  scene.add(playerMesh);

  const shield = new THREE.Mesh(
    new THREE.SphereGeometry(0.95, 16, 12),
    new THREE.MeshBasicMaterial({ color: "#d7ff72", transparent: true, opacity: 0.18, wireframe: true })
  );
  shield.visible = false;
  playerMesh.add(shield);

  state.three.enabled = true;
  state.three.renderer = renderer;
  state.three.scene = scene;
  state.three.camera = camera;
  state.three.ambient = ambient;
  state.three.sun = sun;
  state.three.playerMesh = playerMesh;
  state.three.playerShield = shield;
  state.three.playerMarker = ring;

  window.addEventListener("resize", () => {
    const width = canvas.clientWidth || canvas.width;
    const height = Math.round(width * (canvas.height / canvas.width));
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  });
}

function ensureAudio() {
  if (state.audio.initialized) return;

  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) {
    state.audio.initialized = true;
    return;
  }

  state.audio.ctx = new AudioCtx();
  state.audio.initialized = true;

  const theme = new Audio(MAIN_THEME_URL);
  theme.loop = true;
  theme.volume = state.audio.musicVolume * 0.55;
  theme.preload = "auto";
  state.audio.theme = theme;
}

function resumeAudio() {
  ensureAudio();
  if (state.audio.ctx && state.audio.ctx.state === "suspended") state.audio.ctx.resume();
  if (state.audio.theme && state.audio.theme.paused) {
    state.audio.theme.play().catch(() => {});
  }
}

function playTone(type, frequency, duration, volume, options = {}) {
  ensureAudio();
  if (!state.audio.ctx) return;
  if (state.audio.muted || state.audio.sfxVolume <= 0) return;

  const now = state.audio.ctx.currentTime;
  const oscillator = state.audio.ctx.createOscillator();
  const gain = state.audio.ctx.createGain();
  const actualVolume = volume * state.audio.sfxVolume;

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, now);
  if (options.frequencyEnd) oscillator.frequency.exponentialRampToValueAtTime(options.frequencyEnd, now + duration);

  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(actualVolume, now + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  oscillator.connect(gain);
  gain.connect(state.audio.ctx.destination);
  oscillator.start(now);
  oscillator.stop(now + duration + 0.02);
}

function playNoiseBurst(duration, volume, filterFrequency) {
  ensureAudio();
  if (!state.audio.ctx) return;
  if (state.audio.muted || state.audio.sfxVolume <= 0) return;

  const sampleRate = state.audio.ctx.sampleRate;
  const buffer = state.audio.ctx.createBuffer(1, sampleRate * duration, sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i += 1) data[i] = (Math.random() * 2 - 1) * 0.35;

  const source = state.audio.ctx.createBufferSource();
  const filter = state.audio.ctx.createBiquadFilter();
  const gain = state.audio.ctx.createGain();
  const now = state.audio.ctx.currentTime;

  source.buffer = buffer;
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(filterFrequency, now);
  gain.gain.setValueAtTime(volume * state.audio.sfxVolume, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  source.connect(filter);
  filter.connect(gain);
  gain.connect(state.audio.ctx.destination);
  source.start(now);
}

function playSound(name) {
  if (!state.audio.initialized) return;

  if (name === "step") playTone("triangle", 110, 0.07, 0.018, { frequencyEnd: 90 });
  if (name === "basic-hit") playTone("square", 170, 0.1, 0.04, { frequencyEnd: 110 });
  if (name === "fork-flurry") {
    playTone("square", 420, 0.08, 0.032, { frequencyEnd: 260 });
    playTone("square", 520, 0.08, 0.02, { frequencyEnd: 300 });
  }
  if (name === "radar-pulse") {
    playTone("sine", 260, 0.2, 0.035, { frequencyEnd: 640 });
    playTone("sine", 320, 0.22, 0.024, { frequencyEnd: 740 });
  }
  if (name === "root-slice") {
    playTone("square", 300, 0.08, 0.032, { frequencyEnd: 180 });
    playTone("triangle", 210, 0.1, 0.024, { frequencyEnd: 140 });
  }
  if (name === "rotten-trap") {
    playTone("sawtooth", 160, 0.22, 0.024, { frequencyEnd: 70 });
    playNoiseBurst(0.16, 0.012, 700);
  }
  if (name === "scrap-shield") playTone("sawtooth", 180, 0.24, 0.03, { frequencyEnd: 80 });
  if (name === "baraboiled-speed") {
    playTone("triangle", 240, 0.14, 0.03, { frequencyEnd: 520 });
    playTone("sine", 520, 0.12, 0.018, { frequencyEnd: 860 });
  }
  if (name === "laser-attack") {
    playTone("sawtooth", 760, 0.12, 0.05, { frequencyEnd: 320 });
    playTone("square", 980, 0.1, 0.028, { frequencyEnd: 440 });
  }
  if (name === "mash") {
    playTone("sawtooth", 110, 0.25, 0.05, { frequencyEnd: 45 });
    playNoiseBurst(0.24, 0.02, 500);
  }
  if (name === "enemy-hit") playTone("triangle", 140, 0.08, 0.018, { frequencyEnd: 96 });
  if (name === "enemy-attack") {
    playNoiseBurst(0.11, 0.018, 1200);
    playTone("square", 90, 0.08, 0.018, { frequencyEnd: 60 });
  }
  if (name === "pickup") playTone("sine", 620, 0.12, 0.028, { frequencyEnd: 930 });
  if (name === "potion") playTone("sine", 480, 0.14, 0.03, { frequencyEnd: 720 });
  if (name === "countdown") playTone("triangle", 330, 0.1, 0.024, { frequencyEnd: 250 });
  if (name === "start-run") playTone("sine", 520, 0.16, 0.03, { frequencyEnd: 820 });
}

function applyAudioLevels() {
  if (state.audio.theme) {
    state.audio.theme.volume = state.audio.muted ? 0 : state.audio.musicVolume * 0.55;
  }
}

function handleVolumeChange(event) {
  const value = Number(event.target.value) / 100;
  state.audio.musicVolume = value;
  state.audio.sfxVolume = value;
  state.audio.muted = value === 0;
  applyAudioLevels();
}

function muteAudio() {
  state.audio.muted = true;
  applyAudioLevels();
}

function unmuteAudio() {
  state.audio.muted = false;
  if (state.audio.musicVolume === 0 && state.audio.sfxVolume === 0) {
    state.audio.musicVolume = 0.65;
    state.audio.sfxVolume = 0.65;
    ui.volumeSlider.value = "65";
  }
  applyAudioLevels();
  resumeAudio();
}

function seedStarterGear() {
  equipItem("weapon", ITEM_POOLS.weapon[0]);
  equipItem("helmet", ITEM_POOLS.helmet[0]);
  equipItem("armor", ITEM_POOLS.armor[0]);
  equipItem("boots", ITEM_POOLS.boots[0]);
}

function spawnGuaranteedPotions() {
  const potionCount = 4 + Math.min(3, state.currentLevel - 1);
  for (let i = 0; i < potionCount; i += 1) {
    const position = randomOpenPosition(160);
    state.pickups.push(createPotionPickup(position.x, position.y, i % 2 === 0 ? "health" : "mana"));
  }
}

function resetPlayerForNewGame() {
  state.player.x = WORLD.width / 2;
  state.player.y = WORLD.height / 2;
  state.player.radius = 24;
  state.player.speed = 2.6;
  state.player.baseSpeed = 2.6;
  state.player.health = 100;
  state.player.maxHealth = 100;
  state.player.mana = 100;
  state.player.maxMana = 100;
  state.player.attackPower = 10;
  state.player.level = 1;
  state.player.xp = 0;
  state.player.xpToNext = 50;
  state.player.healthPotions = 2;
  state.player.manaPotions = 2;
  state.player.basicCooldown = 0;
  state.player.hitFlash = 0;
  state.player.shieldUntil = 0;
  state.player.speedBoostUntil = 0;
  state.player.rollUntil = 0;
  state.player.rollVx = 0;
  state.player.rollVy = 0;
  state.player.facing = { x: -1, y: -1 };
  state.player.gear = { weapon: null, helmet: null, armor: null, boots: null };
  state.player.skillCooldowns = { weapon: 0, helmet: 0, armor: 0, boots: 0 };
  seedStarterGear();
  state.player.health = state.player.maxHealth;
  state.player.mana = state.player.maxMana;
}

function clearWorldState() {
  state.keys.clear();
  state.projectiles = [];
  state.enemies = [];
  state.pickups = [];
  state.obstacles = [];
  state.traps = [];
  state.bloodPools = [];
  state.particles = [];
  state.effects = [];
  state.floatingTexts = [];
  state.screenBlood = [];
  state.screenShake.intensity = 0;
  state.screenShake.x = 0;
  state.screenShake.y = 0;
  state.enemySpawnTimer = 0;
  state.lootTimer = 0;
  state.crowdBloodTimer = 0;
  state.bossSpawned = false;
  state.gameOver = false;
  state.victory = false;
  state.logEntries = [];
  state.levelKills = 0;
  state.levelKillGoal = getLevelKillGoal();
}

function triggerScreenShake(intensity, decay = 0.88) {
  state.screenShake.intensity = Math.max(state.screenShake.intensity, intensity);
  state.screenShake.decay = decay;
}

function getLevelEnemyMultiplier() {
  return Math.pow(1.8, Math.max(0, state.currentLevel - 1));
}

function getLevelKillGoal() {
  return Math.round(20 * getLevelEnemyMultiplier());
}

function getLevelOpeningWaveCount() {
  return Math.round(8 * getLevelEnemyMultiplier());
}

function getLevelEnemyCap() {
  return Math.round(18 + 18 * getLevelEnemyMultiplier());
}

function getEnemySpawnCooldown() {
  const multiplier = getLevelEnemyMultiplier();
  return clamp(1700 / Math.max(1, multiplier), 240, 1700);
}

function beginCountdown(mode) {
  state.mode = "countdown";
  state.countdownRemaining = 3;
  if (mode === "restart") {
    state.currentLevel = 1;
    resetPlayerForNewGame();
  }
  if (mode === "start") {
    state.currentLevel = 1;
    resetPlayerForNewGame();
  }
  if (mode === "next") {
    state.currentLevel += 1;
    state.player.x = WORLD.width / 2;
    state.player.y = WORLD.height / 2;
    state.player.health = state.player.maxHealth;
    state.player.mana = state.player.maxMana;
    state.player.skillCooldowns = { weapon: 0, helmet: 0, armor: 0, boots: 0 };
  }
  clearWorldState();
  updateOverlay();
}

function beginLevel() {
  state.mode = "playing";
  state.player.x = WORLD.width / 2;
  state.player.y = WORLD.height / 2;
  state.camera.x = state.player.x;
  state.camera.y = state.player.y;
  generateObstacles();
  spawnRingOfEnemies(getLevelOpeningWaveCount());
  spawnGuaranteedPotions();
  playSound("start-run");
  addLog(`Level ${state.currentLevel} begins. Roll hard.`);
  updateOverlay();
}

function handleOverlayAction() {
  resumeAudio();
  if (state.mode === "start") beginCountdown("start");
  if (state.mode === "victory") beginCountdown("next");
  if (state.mode === "defeat") beginCountdown("restart");
}

function updateOverlay() {
  if (state.mode === "playing") {
    ui.gameOverlay.classList.add("hidden");
    return;
  }

  ui.gameOverlay.classList.remove("hidden");

  if (state.mode === "start") {
    ui.overlayEyebrow.textContent = "Potato Wasteland 2";
    ui.overlayTitle.textContent = "Start Run";
    ui.overlayText.textContent = "Click start, get a 3 second countdown, and prepare for the wasteland.";
    ui.overlayButton.hidden = false;
    ui.overlayButton.textContent = "Start Game";
  }

  if (state.mode === "countdown") {
    ui.overlayEyebrow.textContent = `Level ${state.currentLevel}`;
    ui.overlayTitle.textContent = `${Math.max(1, Math.ceil(state.countdownRemaining))}`;
    ui.overlayText.textContent = "Prepare yourself. Spud-42 rolls in when the countdown ends.";
    ui.overlayButton.hidden = true;
  }

  if (state.mode === "victory") {
    ui.overlayEyebrow.textContent = `Level ${state.currentLevel} Cleared`;
    ui.overlayTitle.textContent = "Next Level";
    ui.overlayText.textContent = "The next level throws more enemies into the wasteland. Click below when ready.";
    ui.overlayButton.hidden = false;
    ui.overlayButton.textContent = "Next Level";
  }

  if (state.mode === "defeat") {
    ui.overlayEyebrow.textContent = "Mashed";
    ui.overlayTitle.textContent = "Restart Game";
    ui.overlayText.textContent = "Spud-42 fell in battle. Restart to begin again from level 1.";
    ui.overlayButton.hidden = false;
    ui.overlayButton.textContent = "Restart Game";
  }
}

function loop(timestamp) {
  const delta = Math.min(32, timestamp - (state.time || timestamp));
  state.time = timestamp;

  update(delta);
  render();

  requestAnimationFrame(loop);
}

function update(delta) {
  if (state.mode === "countdown") {
    const previous = Math.ceil(state.countdownRemaining);
    state.countdownRemaining -= delta / 1000;
    const current = Math.ceil(Math.max(0, state.countdownRemaining));
    if (current > 0 && current < previous) playSound("countdown");
    if (state.countdownRemaining <= 0) beginLevel();
    updateFloatingTexts(delta);
    updateScreenBlood(delta);
    updateOverlay();
    renderHud();
    return;
  }

  if (state.mode !== "playing") {
    updateFloatingTexts(delta);
    updateScreenBlood(delta);
    updateOverlay();
    renderHud();
    return;
  }

  const player = state.player;
  player.basicCooldown = Math.max(0, player.basicCooldown - delta);
  player.hitFlash = Math.max(0, player.hitFlash - delta);

  if (player.speedBoostUntil && state.time > player.speedBoostUntil) {
    player.speed = player.baseSpeed + getBonus("speed");
    player.speedBoostUntil = 0;
  }

  regenerateMana(delta);
  movePlayer(delta);
  updateCamera();
  tickSpawns(delta);
  updateTraps(delta);
  updateEnemies(delta);
  updateProjectiles(delta);
  updatePickups(delta);
  updateParticles(delta);
  updateEffects(delta);
  updateFloatingTexts(delta);
  updateScreenBlood(delta);
  updateScreenShake();

  if (!state.bossSpawned && state.levelKills >= state.levelKillGoal) {
    spawnBoss();
  }

  if (player.health <= 0) {
    state.gameOver = true;
    state.mode = "defeat";
    addLog("Spud-42 was mashed.");
  }

  updateOverlay();
  renderHud();
}

function updateScreenShake() {
  if (state.screenShake.intensity <= 0.01) {
    state.screenShake.intensity = 0;
    state.screenShake.x = 0;
    state.screenShake.y = 0;
    return;
  }

  state.screenShake.x = rand(-state.screenShake.intensity, state.screenShake.intensity);
  state.screenShake.y = rand(-state.screenShake.intensity, state.screenShake.intensity);
  state.screenShake.intensity *= state.screenShake.decay;
}

function regenerateMana(delta) {
  const player = state.player;
  player.mana = clamp(player.mana + 0.012 * delta, 0, player.maxMana);
}

function movePlayer(delta) {
  const player = state.player;

  if (state.time < player.rollUntil) {
    const rollStep = delta / 16.67;
    moveEntityWithCollisions(player, player.x + player.rollVx * rollStep, player.y + player.rollVy * rollStep, player.radius);
    createSpeedTrailEffect(player.x, player.y, "#d9f6ff", 120);
    return;
  }

  let dx = 0;
  let dy = 0;

  // Map arrow keys to screen-space directions for the isometric camera.
  if (state.keys.has("arrowup")) {
    dx -= 1;
    dy -= 1;
  }
  if (state.keys.has("arrowdown")) {
    dx += 1;
    dy += 1;
  }
  if (state.keys.has("arrowleft")) {
    dx -= 1;
    dy += 1;
  }
  if (state.keys.has("arrowright")) {
    dx += 1;
    dy -= 1;
  }

  if (!dx && !dy) return;

  const length = Math.hypot(dx, dy) || 1;
  state.player.facing.x = dx / length;
  state.player.facing.y = dy / length;
  const speed = player.speed * (delta / 16.67);
  const nextX = player.x + (dx / length) * speed * 5;
  const nextY = player.y + (dy / length) * speed * 5;
  moveEntityWithCollisions(player, nextX, nextY, player.radius);

  if (state.audio.initialized && state.time - state.audio.lastStepAt > 220) {
    playSound("step");
    state.audio.lastStepAt = state.time;
  }
}

function updateCamera() {
  const deadZoneX = 220;
  const deadZoneY = 150;
  const dx = state.player.x - state.camera.x;
  const dy = state.player.y - state.camera.y;

  if (dx > deadZoneX) state.camera.x = state.player.x - deadZoneX;
  if (dx < -deadZoneX) state.camera.x = state.player.x + deadZoneX;
  if (dy > deadZoneY) state.camera.y = state.player.y - deadZoneY;
  if (dy < -deadZoneY) state.camera.y = state.player.y + deadZoneY;

  state.camera.x = clamp(state.camera.x, canvas.width * 0.45, WORLD.width - canvas.width * 0.45);
  state.camera.y = clamp(state.camera.y, canvas.height * 0.6, WORLD.height - canvas.height * 0.6);
}

function moveEntityWithCollisions(entity, targetX, targetY, radius) {
  const boundedX = clamp(targetX, radius, WORLD.width - radius);
  const boundedY = clamp(targetY, radius, WORLD.height - radius);

  if (!collidesWithObstacle(boundedX, entity.y, radius)) entity.x = boundedX;
  if (!collidesWithObstacle(entity.x, boundedY, radius)) entity.y = boundedY;
}

function collidesWithObstacle(x, y, radius) {
  for (const obstacle of state.obstacles) {
    const distance = Math.hypot(x - obstacle.x, y - obstacle.y);
    if (distance < radius + obstacle.radius) return true;
  }
  return false;
}

function tickSpawns(delta) {
  state.enemySpawnTimer -= delta;
  state.lootTimer -= delta;

  if (state.enemySpawnTimer <= 0 && state.enemies.length < getLevelEnemyCap()) {
    spawnEnemyNearPlayer();
    state.enemySpawnTimer = getEnemySpawnCooldown() + Math.random() * 500;
  }

  if (state.lootTimer <= 0 && state.pickups.length < 14) {
    const potionType = Math.random() > 0.5 ? "health" : "mana";
    const position = randomOpenPosition(120);
    state.pickups.push(createPotionPickup(position.x, position.y, potionType));
    state.lootTimer = 4200 + Math.random() * 2000;
  }
}

function updateEnemies(delta) {
  const player = state.player;

  state.enemies = state.enemies.filter((enemy) => {
    if (enemy.health <= 0) {
      onEnemyDefeated(enemy);
      return false;
    }

    const angle = Math.atan2(player.y - enemy.y, player.x - enemy.x);
    const distance = Math.hypot(player.x - enemy.x, player.y - enemy.y);
    const isSlowed = enemy.slowUntil && state.time < enemy.slowUntil;
    const slowFactor = isSlowed ? enemy.slowFactor || 0.45 : 1;
    const speedFactor = (delta / 16.67) * enemy.speed * 3.8 * slowFactor;

    if (distance > enemy.size + player.radius + 8) {
      moveEntityWithCollisions(
        enemy,
        enemy.x + Math.cos(angle) * speedFactor,
        enemy.y + Math.sin(angle) * speedFactor,
        enemy.size * 0.7
      );
    } else if (state.time > enemy.nextAttackAt) {
      playSound("enemy-attack");
      dealDamageToPlayer(enemy.damage, enemy.name);
      enemy.nextAttackAt = state.time + enemy.attackCooldown;
    }

    enemy.wobble += delta * 0.006;
    return true;
  });
}

function updateTraps(delta) {
  state.traps = state.traps.filter((trap) => {
    trap.life -= delta;
    trap.pulse += delta * 0.008;

    for (const enemy of state.enemies) {
      const distance = Math.hypot(enemy.x - trap.x, enemy.y - trap.y);
      if (distance < trap.radius) {
        enemy.slowUntil = Math.max(enemy.slowUntil || 0, state.time + 220);
        enemy.slowFactor = Math.min(enemy.slowFactor || 1, trap.slowFactor);
      }
    }

    return trap.life > 0;
  });
}

function generateObstacles() {
  const count = 14 + state.currentLevel * 2;
  let attempts = 0;

  while (state.obstacles.length < count && attempts < 400) {
    attempts += 1;
    const radius = 28 + Math.random() * 22;
    const candidate = {
      id: `obstacle-${state.nextId += 1}`,
      x: 180 + Math.random() * (WORLD.width - 360),
      y: 180 + Math.random() * (WORLD.height - 360),
      radius,
      kind: Math.random() > 0.5 ? "pillar" : "rock",
    };

    const farFromPlayer = Math.hypot(candidate.x - state.player.x, candidate.y - state.player.y) > 260;
    const apartFromOthers = state.obstacles.every((obstacle) => Math.hypot(candidate.x - obstacle.x, candidate.y - obstacle.y) > candidate.radius + obstacle.radius + 34);
    if (farFromPlayer && apartFromOthers) state.obstacles.push(candidate);
  }
}

function updateProjectiles(delta) {
  state.projectiles = state.projectiles.filter((projectile) => {
    projectile.life -= delta;
    projectile.x += projectile.vx * (delta / 16.67);
    projectile.y += projectile.vy * (delta / 16.67);

    if (projectile.life <= 0) return false;

    for (const enemy of state.enemies) {
      if (enemy.health <= 0) continue;
      const distance = Math.hypot(projectile.x - enemy.x, projectile.y - enemy.y);
      if (distance < projectile.radius + enemy.size) {
        damageEnemy(enemy, projectile.damage, projectile.color);
        if (projectile.effect) projectile.effect(enemy);
        if (!projectile.piercing) return false;
      }
    }

    return true;
  });
}

function updatePickups(delta) {
  const player = state.player;
  state.pickups = state.pickups.filter((pickup) => {
    pickup.pulse += delta * 0.005;
    const dx = player.x - pickup.x;
    const dy = player.y - pickup.y;
    const distance = Math.hypot(dx, dy);

    // Pull nearby loot toward the player so pickups remain reachable around obstacles.
    if (distance < 140 && distance > 6) {
      const pull = 2.4 * (delta / 16.67);
      pickup.x += (dx / distance) * pull;
      pickup.y += (dy / distance) * pull;
    }

    if (distance < WORLD.pickupRadius) {
      collectPickup(pickup);
      return false;
    }

    return true;
  });
}

function updateParticles(delta) {
  state.particles = state.particles.filter((particle) => {
    particle.life -= delta;
    particle.x += particle.vx * (delta / 16.67);
    particle.y += particle.vy * (delta / 16.67);
    return particle.life > 0;
  });
}

function updateEffects(delta) {
  state.effects = state.effects.filter((effect) => {
    effect.life -= delta;
    effect.age += delta;

    if (effect.type === "ring" || effect.type === "slash") {
      effect.radius += effect.growth * (delta / 16.67);
    }

    return effect.life > 0;
  });
}

function updateFloatingTexts(delta) {
  state.floatingTexts = state.floatingTexts.filter((text) => {
    text.life -= delta;
    text.y -= 0.03 * delta;
    return text.life > 0;
  });
}

function updateScreenBlood(delta) {
  state.screenBlood = state.screenBlood.filter((spot) => {
    spot.life -= delta;
    return spot.life > 0;
  });

  const pressure = Math.max(0, state.enemies.length - 6);
  if (state.mode === "playing" && pressure > 0) {
    state.crowdBloodTimer -= delta;
    if (state.crowdBloodTimer <= 0 && state.screenBlood.length < 18) {
      addScreenBloodSpot(clamp(0.35 + pressure * 0.06, 0.35, 1.1));
      state.crowdBloodTimer = clamp(2400 - pressure * 120, 650, 2400);
    }
  } else {
    state.crowdBloodTimer = 800;
  }
}

function onEnemyDefeated(enemy) {
  if (!enemy.boss) state.levelKills += 1;
  gainXp(enemy.xp);
  spawnBloodBurst(enemy.x, enemy.y, enemy.boss ? 28 : 18);
  spawnBloodPool(enemy.x, enemy.y, enemy.boss ? enemy.size * 2.2 : enemy.size * 1.5);
  addScreenBloodSpot(enemy.boss ? 1 : 0.38);
  if (Math.random() < 0.5) {
    const drop = findOpenDropPosition(enemy.x, enemy.y, 28);
    state.pickups.push(createGearPickup(drop.x, drop.y));
  }
  if (Math.random() < 0.3) {
    const drop = findOpenDropPosition(enemy.x + rand(-24, 24), enemy.y + rand(-24, 24), 24);
    state.pickups.push(createPotionPickup(drop.x, drop.y, Math.random() < 0.5 ? "health" : "mana"));
  }
  if (enemy.boss) {
    state.victory = true;
    state.gameOver = true;
    state.mode = "victory";
    addLog("The Atomic Rat King falls. The potato endures.");
  }
}

function gainXp(amount) {
  const player = state.player;
  player.xp += amount;
  addFloatingText(`+${amount} XP`, player.x, player.y - 30, "#b2d65e");

  while (player.xp >= player.xpToNext) {
    player.xp -= player.xpToNext;
    player.level += 1;
    player.xpToNext = Math.round(player.xpToNext * 1.35);
    player.maxHealth += 12;
    player.maxMana += 8;
    player.attackPower += 2;
    player.health = player.maxHealth;
    player.mana = player.maxMana;
    addLog(`Level ${player.level}! The potato hardens against the wastes.`);
  }
}

function dealDamageToPlayer(amount, source) {
  const player = state.player;
  if (state.time < player.shieldUntil) {
    addFloatingText("BLOCK", player.x + rand(-8, 8), player.y - 28, "#d4ff72");
    return;
  }
  player.health = clamp(player.health - amount, 0, player.maxHealth);
  player.hitFlash = 180;
  addScreenBloodSpot(clamp(amount / 20, 0.28, 0.95));
  addFloatingText(`-${amount}`, player.x + rand(-10, 10), player.y - 18, "#ff8d7a");
  if (player.health <= player.maxHealth * 0.35) addLog(`${source} broke through. Consider using a potion.`);
}

function damageEnemy(enemy, amount, color = "#ffd166") {
  playSound("enemy-hit");
  enemy.health -= amount;
  burst(enemy.x, enemy.y, color, 4);
  addFloatingText(`${Math.round(amount)}`, enemy.x, enemy.y - 18, color);
}

function collectPickup(pickup) {
  if (pickup.kind === "gear") {
    equipItem(pickup.slot, pickup.item);
    playSound("pickup");
    addLog(`${pickup.item.name} equipped. ${pickup.item.skill.name} is now active.`);
  } else {
    if (pickup.potionType === "health") state.player.healthPotions += 1;
    if (pickup.potionType === "mana") state.player.manaPotions += 1;
    playSound("pickup");
    addLog(`${capitalize(pickup.potionType)} potion collected.`);
  }
}

function equipItem(slot, item) {
  state.player.gear[slot] = item;
  recalculateStats();
}

function recalculateStats() {
  const player = state.player;
  player.maxHealth = 100 + getBonus("maxHealth");
  player.maxMana = 100 + getBonus("maxMana");
  player.baseSpeed = 2.6;
  player.speed = player.baseSpeed + getBonus("speed");
  player.attackPower = 10 + getBonus("power");
  player.health = clamp(player.health, 0, player.maxHealth);
  player.mana = clamp(player.mana, 0, player.maxMana);
}

function getBonus(stat) {
  return SLOT_ORDER.reduce((total, slot) => {
    const gear = state.player.gear[slot];
    const bonus = gear && gear.bonus ? gear.bonus[stat] || 0 : 0;
    return total + bonus;
  }, 0);
}

function createGearPickup(x, y) {
  const slot = SLOT_ORDER[Math.floor(Math.random() * SLOT_ORDER.length)];
  const pool = ITEM_POOLS[slot];
  const tierRoll = Math.random();
  const item = tierRoll > 0.88 ? pool[2] : tierRoll > 0.55 ? pool[1] : pool[0];

  return {
    id: `pickup-${state.nextId += 1}`,
    kind: "gear",
    slot,
    item,
    x,
    y,
    pulse: 0,
    color: item.skill.color,
  };
}

function createPotionPickup(x, y, potionType) {
  return {
    id: `pickup-${state.nextId += 1}`,
    kind: "potion",
    potionType,
    x,
    y,
    pulse: 0,
    color: potionType === "health" ? "#ff7b63" : "#64c7ff",
  };
}

function randomOpenPosition(minDistanceFromPlayer = 0) {
  for (let i = 0; i < 80; i += 1) {
    const x = 60 + Math.random() * (WORLD.width - 120);
    const y = 60 + Math.random() * (WORLD.height - 120);
    const farEnough = Math.hypot(x - state.player.x, y - state.player.y) >= minDistanceFromPlayer;
    if (farEnough && !collidesWithObstacle(x, y, 26)) return { x, y };
  }
  return { x: WORLD.width / 2, y: WORLD.height / 2 };
}

function findOpenDropPosition(originX, originY, radius) {
  for (let i = 0; i < 20; i += 1) {
    const angle = (Math.PI * 2 * i) / 20;
    const distance = 12 + i * 4;
    const x = clamp(originX + Math.cos(angle) * distance, radius, WORLD.width - radius);
    const y = clamp(originY + Math.sin(angle) * distance, radius, WORLD.height - radius);
    if (!collidesWithObstacle(x, y, radius)) return { x, y };
  }
  return { x: clamp(originX, radius, WORLD.width - radius), y: clamp(originY, radius, WORLD.height - radius) };
}

function spawnRingOfEnemies(count) {
  for (let i = 0; i < count; i += 1) {
    const angle = (Math.PI * 2 * i) / count;
    const distance = 320 + Math.random() * 140;
    const x = clamp(state.player.x + Math.cos(angle) * distance, 40, WORLD.width - 40);
    const y = clamp(state.player.y + Math.sin(angle) * distance, 40, WORLD.height - 40);
    if (!collidesWithObstacle(x, y, 20)) state.enemies.push(createEnemy(x, y));
  }
}

function spawnEnemyNearPlayer() {
  const angle = Math.random() * Math.PI * 2;
  const distance = 420 + Math.random() * 260;
  const x = clamp(state.player.x + Math.cos(angle) * distance, 40, WORLD.width - 40);
  const y = clamp(state.player.y + Math.sin(angle) * distance, 40, WORLD.height - 40);
  if (collidesWithObstacle(x, y, 20)) return;
  state.enemies.push(createEnemy(x, y));
}

function spawnBoss() {
  state.bossSpawned = true;
  const x = clamp(state.player.x + 540, 80, WORLD.width - 80);
  const y = clamp(state.player.y - 200, 80, WORLD.height - 80);
  const bossScale = 1 + (state.currentLevel - 1) * 0.3;
  state.enemies.push({
    id: `enemy-${state.nextId += 1}`,
    name: "Atomic Rat King",
    type: "boss",
    color: "#d6ff75",
    x,
    y,
    size: 42,
    health: Math.round(360 * bossScale),
    maxHealth: Math.round(360 * bossScale),
    speed: 1.2 + (state.currentLevel - 1) * 0.08,
    damage: Math.round(18 * bossScale),
    xp: Math.round(140 * bossScale),
    boss: true,
    attackCooldown: 1100,
    nextAttackAt: 0,
    wobble: 0,
  });
  addLog("The Atomic Rat King claws out of the crater. End it.");
}

function createEnemy(x, y) {
  const template = ENEMY_TYPES[Math.floor(Math.random() * ENEMY_TYPES.length)];
  const scale = 1 + state.player.level * 0.08 + (state.currentLevel - 1) * 0.18;
  return {
    id: `enemy-${state.nextId += 1}`,
    ...template,
    x,
    y,
    maxHealth: Math.round(template.hp * scale),
    health: Math.round(template.hp * scale),
    damage: Math.round(template.damage * scale),
    attackCooldown: 850 + Math.random() * 500,
    nextAttackAt: 0,
    slowUntil: 0,
    slowFactor: 1,
    wobble: Math.random() * Math.PI,
  };
}

function useBasicAttack() {
  const player = state.player;
  if (player.basicCooldown > 0 || state.mode !== "playing") return;
  const target = getNearestEnemy(160);
  if (!target) {
    addLog("No enemy close enough for a smack.");
    return;
  }

  player.basicCooldown = 550;
  playSound("basic-hit");
  const damage = player.attackPower + player.level * 1.5;
  createSlashEffect(target.x, target.y, "#ffd166");
  damageEnemy(target, damage, "#ffd166");
}

function useDodgeRoll() {
  const player = state.player;
  if (state.mode !== "playing" || player.basicCooldown > 0 || state.time < player.rollUntil) return;

  let dx = 0;
  let dy = 0;
  if (state.keys.has("arrowup")) {
    dx -= 1;
    dy -= 1;
  }
  if (state.keys.has("arrowdown")) {
    dx += 1;
    dy += 1;
  }
  if (state.keys.has("arrowleft")) {
    dx -= 1;
    dy += 1;
  }
  if (state.keys.has("arrowright")) {
    dx += 1;
    dy -= 1;
  }

  if (!dx && !dy) {
    dx = player.facing.x || -1;
    dy = player.facing.y || -1;
  }

  const length = Math.hypot(dx, dy) || 1;
  const dirX = dx / length;
  const dirY = dy / length;
  player.facing.x = dirX;
  player.facing.y = dirY;

  player.rollVx = dirX * 12.5;
  player.rollVy = dirY * 12.5;
  player.rollUntil = state.time + 260;
  player.basicCooldown = 900;
  player.shieldUntil = Math.max(player.shieldUntil, state.time + 320);
  triggerScreenShake(0.28, 0.86);
  createSpeedTrailEffect(player.x, player.y, "#d9f6ff", 320);
  createRingEffect(player.x, player.y, 18, 5, "#d9f6ff", 220, 3);
  addFloatingText("ROLL", player.x, player.y - 24, "#d9f6ff");
}

function usePotion(type) {
  const player = state.player;
  if (state.mode !== "playing") return;

  if (type === "health") {
    if (player.healthPotions <= 0) {
      addLog("No health potions left.");
      return;
    }
    if (player.health >= player.maxHealth) {
      addLog("Health is already full.");
      return;
    }
    player.healthPotions -= 1;
    player.health = clamp(player.health + 42, 0, player.maxHealth);
    playSound("potion");
    addLog("Health potion used.");
  }

  if (type === "mana") {
    if (player.manaPotions <= 0) {
      addLog("No mana potions left.");
      return;
    }
    if (player.mana >= player.maxMana) {
      addLog("Mana is already full.");
      return;
    }
    player.manaPotions -= 1;
    player.mana = clamp(player.mana + 48, 0, player.maxMana);
    playSound("potion");
    addLog("Mana potion used.");
  }
}

function useSkill(slot) {
  const player = state.player;
  const gear = player.gear[slot];
  if (!gear || state.mode !== "playing") return;

  const skill = gear.skill;
  if (state.time < player.skillCooldowns[slot]) {
    addLog(`${skill.name} is recharging.`);
    return;
  }

  if (player.mana < skill.manaCost) {
    addLog(`Not enough mana for ${skill.name}.`);
    return;
  }

  player.mana -= skill.manaCost;
  player.skillCooldowns[slot] = state.time + skill.cooldown;
  skill.execute(skill, slot);
}

function getNearestEnemy(range = Infinity) {
  let closest = null;
  let bestDistance = range;

  for (const enemy of state.enemies) {
    const distance = Math.hypot(enemy.x - state.player.x, enemy.y - state.player.y);
    if (distance < bestDistance) {
      bestDistance = distance;
      closest = enemy;
    }
  }

  return closest;
}

function forkFlurry(skill) {
  playSound("fork-flurry");
  const target = getNearestEnemy(760);
  if (!target) return addLog("Fork Flurry needs a target.");
  createRingEffect(state.player.x, state.player.y, 24, 7, skill.color, 280, 3);

  for (let i = 0; i < 4; i += 1) {
    const spread = rand(-0.12, 0.12);
    const angle = Math.atan2(target.y - state.player.y, target.x - state.player.x) + spread;
    spawnProjectile(angle, 9.5, 10 + state.player.attackPower * 0.75, skill.color, {
      trail: true,
      life: 1250,
    });
  }
}

function rootSlice(skill) {
  playSound("root-slice");
  let hits = 0;

  createRingEffect(
    state.player.x,
    state.player.y,
    26,
    10,
    skill.color,
    140,
    5
  );
  createFanEffect(state.player.x, state.player.y, 0, 110, skill.color, 120, Math.PI * 2);

  for (const enemy of state.enemies) {
    const dx = enemy.x - state.player.x;
    const dy = enemy.y - state.player.y;
    const distance = Math.hypot(dx, dy);
    if (distance > 120) continue;
    damageEnemy(enemy, 18 + state.player.attackPower * 0.9, skill.color);
    hits += 1;
  }

  if (!hits) addLog("Root Slice hit nothing nearby.");
}

function radarPulse(skill) {
  const color = skill ? skill.color : "#84f1ff";
  playSound("radar-pulse");
  createRingEffect(state.player.x, state.player.y, 30, 8, color, 420, 5);
  let hits = 0;
  for (const enemy of state.enemies) {
    if (Math.hypot(enemy.x - state.player.x, enemy.y - state.player.y) < 280) {
      damageEnemy(enemy, 12 + state.player.level * 1.6, color);
      enemy.slowUntil = state.time + 1800;
      enemy.slowFactor = 0.42;
      hits += 1;
    }
  }
  if (!hits) {
    const fallbackTarget = getNearestEnemy(520);
    if (fallbackTarget) {
      damageEnemy(fallbackTarget, 12 + state.player.level * 1.6, color);
      fallbackTarget.slowUntil = state.time + 1800;
      fallbackTarget.slowFactor = 0.42;
      createBeamEffect(state.player.x, state.player.y, fallbackTarget.x, fallbackTarget.y, color, 180, 4);
      addLog("Radar Pulse locked onto the nearest enemy.");
      return;
    }
  }
  addLog("Radar Pulse shocks and slows nearby enemies.");
}

function rottenTrap(skill) {
  playSound("rotten-trap");
  const facing = state.player.facing;
  const trapX = clamp(state.player.x + facing.x * 95, 40, WORLD.width - 40);
  const trapY = clamp(state.player.y + facing.y * 95, 40, WORLD.height - 40);

  state.traps.push({
    id: `trap-${state.nextId += 1}`,
    x: trapX,
    y: trapY,
    radius: 95,
    slowFactor: 0.28,
    life: 3000,
    pulse: 0,
    color: skill.color,
    bubbles: Array.from({ length: 6 }, () => ({
      angle: Math.random() * Math.PI * 2,
      distance: 10 + Math.random() * 30,
      size: 3 + Math.random() * 4,
    })),
  });
  createRingEffect(trapX, trapY, 24, 5, skill.color, 320, 4);
  addLog("Rotten Trap festers on the ground.");
}

function scrapShield(skill) {
  const color = skill ? skill.color : "#c5ff6e";
  playSound("scrap-shield");
  state.player.shieldUntil = state.time + 1600;
  createRingEffect(state.player.x, state.player.y, 34, 2, color, 500, 5);
  createRingEffect(state.player.x, state.player.y, 44, 1, color, 700, 2);
  addLog("Scrap Shield is active. You are invulnerable briefly.");
}

function baraboiledSpeed(skill) {
  playSound("baraboiled-speed");
  state.player.speed = (state.player.baseSpeed + getBonus("speed")) * 3;
  state.player.speedBoostUntil = state.time + 2000;
  createRingEffect(state.player.x, state.player.y, 26, 6, skill.color, 320, 5);
  createSpeedTrailEffect(state.player.x, state.player.y, skill.color, 420);
  addLog("Baraboiled Speed triples your movement.");
}

function laserAttack(skill) {
  const color = skill ? skill.color : "#ffc3df";
  playSound("laser-attack");
  triggerScreenShake(0.45, 0.84);
  createRingEffect(state.player.x, state.player.y, 22, 12, color, 420, 7);
  const shots = 14;
  for (let i = 0; i < shots; i += 1) {
    const angle = (Math.PI * 2 * i) / shots;
    spawnProjectile(angle, 9, 22 + state.player.attackPower * 0.85, color, {
      piercing: true,
      radius: 8,
      trail: true,
      life: 950,
    });
  }
  addLog("Laser Attack erupts in all directions.");
}

function mash(skill) {
  playSound("mash");
  triggerScreenShake(0.95, 0.82);
  createRingEffect(state.player.x, state.player.y, 40, 18, skill.color, 360, 10);
  createGroundCrackEffect(state.player.x, state.player.y, skill.color, 520);

  let kills = 0;
  for (const enemy of state.enemies) {
    const screen = worldToScreen(enemy.x, enemy.y, enemy.size);
    if (screen.x >= -60 && screen.x <= canvas.width + 60 && screen.y >= -60 && screen.y <= canvas.height + 60) {
      enemy.health = 0;
      burst(enemy.x, enemy.y, skill.color, 10);
      kills += 1;
    }
  }

  addLog(kills ? `Mash obliterated ${kills} visible enemies.` : "Mash shook the ground, but no enemy was visible.");
}

function spawnProjectile(angle, speed, damage, color, options = {}) {
  state.projectiles.push({
    id: `projectile-${state.nextId += 1}`,
    x: state.player.x,
    y: state.player.y,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    damage,
    life: options.life || 900,
    radius: options.radius || 8,
    color,
    piercing: options.piercing || false,
    effect: options.effect,
    trail: options.trail || false,
  });
}

function createRingEffect(x, y, radius, growth, color, life, lineWidth) {
  state.effects.push({
    id: `effect-${state.nextId += 1}`,
    type: "ring",
    x,
    y,
    radius,
    growth,
    color,
    life,
    maxLife: life,
    lineWidth,
    age: 0,
  });
}

function createBeamEffect(x1, y1, x2, y2, color, life, lineWidth) {
  state.effects.push({
    id: `effect-${state.nextId += 1}`,
    type: "line",
    x1,
    y1,
    x2,
    y2,
    color,
    life,
    maxLife: life,
    lineWidth,
    age: 0,
  });
}

function createSlashEffect(x, y, color) {
  state.effects.push({
    id: `effect-${state.nextId += 1}`,
    type: "slash",
    x,
    y,
    radius: 18,
    growth: 2.6,
    color,
    life: 170,
    maxLife: 170,
    lineWidth: 4,
    age: 0,
  });
}

function createFanEffect(x, y, angle, radius, color, life, spread) {
  state.effects.push({
    id: `effect-${state.nextId += 1}`,
    type: "fan",
    x,
    y,
    angle,
    radius,
    spread,
    color,
    life,
    maxLife: life,
    age: 0,
  });
}

function createSpeedTrailEffect(x, y, color, life) {
  state.effects.push({
    id: `effect-${state.nextId += 1}`,
    type: "speed",
    x,
    y,
    color,
    life,
    maxLife: life,
    age: 0,
  });
}

function createGroundCrackEffect(x, y, color, life) {
  state.effects.push({
    id: `effect-${state.nextId += 1}`,
    type: "crack",
    x,
    y,
    color,
    life,
    maxLife: life,
    age: 0,
  });
}

function burst(x, y, color, count) {
  for (let i = 0; i < count; i += 1) {
    state.particles.push({
      x,
      y,
      vx: rand(-2.3, 2.3),
      vy: rand(-2.3, 2.3),
      life: 350 + Math.random() * 300,
      color,
    });
  }
}

function spawnBloodBurst(x, y, count) {
  for (let i = 0; i < count; i += 1) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 1.5 + Math.random() * 4.8;
    state.particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 520 + Math.random() * 460,
      color: Math.random() > 0.45 ? "#a90d16" : "#5e0408",
      size: 4 + Math.random() * 8,
      kind: "blood",
    });
  }
}

function spawnBloodPool(x, y, radius) {
  state.bloodPools.push({
    id: `gore-${state.nextId += 1}`,
    x: clamp(x + rand(-12, 12), 20, WORLD.width - 20),
    y: clamp(y + rand(-12, 12), 20, WORLD.height - 20),
    radius,
    rotation: Math.random() * Math.PI,
    opacity: 0.3 + Math.random() * 0.2,
  });

  if (state.bloodPools.length > 60) {
    state.bloodPools.shift();
  }
}

function addScreenBloodSpot(intensity = 0.5) {
  const edgeBias = Math.random();
  const spot = {
    id: `screen-blood-${state.nextId += 1}`,
    x: edgeBias < 0.33 ? rand(-8, 18) : edgeBias < 0.66 ? rand(76, 104) : rand(10, 90),
    y: Math.random() > 0.5 ? rand(-6, 20) : rand(72, 104),
    size: 38 + intensity * 78 + Math.random() * 52,
    opacity: clamp(0.18 + intensity * 0.22, 0.18, 0.5),
    life: 12000 + intensity * 9000 + Math.random() * 5000,
  };
  state.screenBlood.push(spot);
  if (state.screenBlood.length > 18) state.screenBlood.shift();
}

function addFloatingText(text, x, y, color) {
  state.floatingTexts.push({ text, x, y, color, life: 900 });
}

function render() {
  if (state.three.enabled) {
    renderThreeScene();
    return;
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  renderWorld();
  renderEffects();
  renderPickups();
  renderProjectiles();
  renderEnemies();
  renderPlayer();
  renderParticles();
  renderFloatingTexts();
  renderOverlay();
}

function worldToThree(x, y) {
  return {
    x: (x - WORLD.width / 2) / 48,
    z: (y - WORLD.height / 2) / 48,
  };
}

function createPlayerGroup(THREE) {
  const group = new THREE.Group();
  const potatoMat = new THREE.MeshStandardMaterial({ color: "#a36a2a", roughness: 0.92, metalness: 0.04 });
  const metalMat = new THREE.MeshStandardMaterial({ color: "#2a3138", roughness: 0.52, metalness: 0.46 });
  const trimMat = new THREE.MeshStandardMaterial({ color: "#7c8a96", roughness: 0.34, metalness: 0.72 });

  const body = new THREE.Mesh(new THREE.SphereGeometry(0.8, 18, 16), potatoMat);
  body.scale.set(1, 1.2, 1);
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  const chestPlate = new THREE.Mesh(new THREE.CapsuleGeometry(0.5, 0.82, 5, 9), metalMat);
  chestPlate.scale.set(1.02, 0.78, 0.9);
  chestPlate.position.set(0, -0.05, 0.08);
  chestPlate.castShadow = true;
  group.add(chestPlate);

  const helmet = new THREE.Mesh(new THREE.BoxGeometry(1.08, 0.86, 1.02), metalMat);
  helmet.position.set(0, 0.55, 0.02);
  helmet.castShadow = true;
  group.add(helmet);

  const crest = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.84, 0.14), trimMat);
  crest.position.set(0, 0.58, 0.54);
  crest.castShadow = true;
  group.add(crest);

  const eyeMat = new THREE.MeshBasicMaterial({ color: "#58b7ff" });
  const eyeL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.08, 0.08), eyeMat);
  const eyeR = eyeL.clone();
  eyeL.position.set(-0.2, 0.58, 0.53);
  eyeR.position.set(0.2, 0.58, 0.53);
  group.add(eyeL, eyeR);

  const armGeo = new THREE.BoxGeometry(0.22, 0.9, 0.22);
  const limbMat = new THREE.MeshStandardMaterial({ color: "#252a2f", roughness: 0.56, metalness: 0.35 });
  const armL = new THREE.Mesh(armGeo, limbMat);
  const armR = new THREE.Mesh(armGeo, limbMat);
  armL.position.set(-0.78, -0.08, 0);
  armR.position.set(0.78, -0.08, 0);
  armL.castShadow = armR.castShadow = true;
  group.add(armL, armR);

  const fork = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.56, 0.08), trimMat);
  fork.position.set(0.12, -0.36, 0.12);
  armR.add(fork);
  for (let i = -1; i <= 1; i += 1) {
    const tine = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.18, 0.03), trimMat);
    tine.position.set(i * 0.045, 0.32, 0);
    fork.add(tine);
  }

  const legGeo = new THREE.BoxGeometry(0.24, 0.72, 0.24);
  const legL = new THREE.Mesh(legGeo, limbMat);
  const legR = new THREE.Mesh(legGeo, limbMat);
  legL.position.set(-0.28, -1.0, 0);
  legR.position.set(0.28, -1.0, 0);
  legL.castShadow = legR.castShadow = true;
  group.add(legL, legR);

  const ember = new THREE.Mesh(
    new THREE.CylinderGeometry(0.42, 0.7, 0.2, 16),
    new THREE.MeshBasicMaterial({ color: "#ff6a33", transparent: true, opacity: 0.58 })
  );
  ember.position.set(0, -1.18, 0);
  group.add(ember);

  return group;
}

function createEnemyMesh(THREE, enemy) {
  const group = new THREE.Group();
  const isInsect = enemy.type === "insect";
  const scale = enemy.boss ? 1.35 : 1;
  const shellMat = new THREE.MeshStandardMaterial({
    color: isInsect ? "#461f1d" : "#2b2d2f",
    roughness: isInsect ? 0.62 : 0.88,
    metalness: isInsect ? 0.14 : 0.06,
  });
  const limbMat = new THREE.MeshStandardMaterial({ color: "#171a1d", roughness: 0.95, metalness: 0.05 });

  const body = new THREE.Mesh(new THREE.SphereGeometry((isInsect ? 0.5 : 0.58) * scale, 16, 12), shellMat);
  body.scale.set(isInsect ? 1.15 : 1.45, isInsect ? 0.7 : 0.78, isInsect ? 1.2 : 0.95);
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  const head = new THREE.Mesh(new THREE.SphereGeometry((isInsect ? 0.24 : 0.28) * scale, 12, 10), shellMat);
  head.position.set((isInsect ? -0.48 : -0.64) * scale, 0.04, 0);
  head.castShadow = true;
  group.add(head);

  const eyeMat = new THREE.MeshBasicMaterial({ color: isInsect ? "#ff4b37" : "#ff7a4e" });
  const eyeL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.05, 0.05), eyeMat);
  const eyeR = eyeL.clone();
  eyeL.position.set(head.position.x - 0.1 * scale, 0.11 * scale, 0.12 * scale);
  eyeR.position.set(head.position.x - 0.1 * scale, 0.11 * scale, -0.12 * scale);
  group.add(eyeL, eyeR);

  const legCount = isInsect ? 6 : 4;
  for (let i = 0; i < legCount; i += 1) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.02 * scale, 0.04 * scale, 0.8 * scale, 6), limbMat);
    const side = i % 2 === 0 ? -1 : 1;
    const row = Math.floor(i / 2);
    leg.rotation.z = side * (0.9 + row * 0.12);
    leg.rotation.x = row === 1 ? 0.45 : -0.2;
    leg.position.set((row - 0.7) * 0.3 * scale, -0.15 * scale, side * (isInsect ? 0.4 : 0.34) * scale);
    group.add(leg);
  }

  if (!isInsect) {
    const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.02 * scale, 0.04 * scale, enemy.boss ? 1.2 : 0.86, 6), limbMat);
    tail.rotation.z = Math.PI / 2.35;
    tail.position.set(0.85 * scale, 0.02, 0);
    group.add(tail);
  }

  return group;
}

function createPickupMesh(THREE, pickup) {
  const group = new THREE.Group();
  if (pickup.kind === "potion") {
    const glass = new THREE.Mesh(
      new THREE.CylinderGeometry(0.16, 0.24, 0.48, 8),
      new THREE.MeshStandardMaterial({ color: "#d9e6ff", transparent: true, opacity: 0.7, roughness: 0.1 })
    );
    const liquid = new THREE.Mesh(
      new THREE.CylinderGeometry(0.13, 0.2, 0.22, 8),
      new THREE.MeshStandardMaterial({ color: pickup.potionType === "health" ? "#c83d33" : "#3d71d3", emissive: pickup.potionType === "health" ? "#652018" : "#1c3165" })
    );
    liquid.position.y = -0.08;
    const cork = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.1, 0.14), new THREE.MeshStandardMaterial({ color: "#6b5744" }));
    cork.position.y = 0.3;
    const glow = new THREE.Mesh(
      new THREE.SphereGeometry(0.3, 12, 10),
      new THREE.MeshBasicMaterial({ color: pickup.potionType === "health" ? "#ff6d61" : "#52a8ff", transparent: true, opacity: 0.22 })
    );
    group.add(glass, liquid, cork, glow);
  } else {
    const crate = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.44, 0.65), new THREE.MeshStandardMaterial({ color: "#4e5861", roughness: 0.8, metalness: 0.28 }));
    const lid = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.08, 0.68), new THREE.MeshStandardMaterial({ color: "#83919c", roughness: 0.45, metalness: 0.58 }));
    lid.position.y = 0.18;
    const strap = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.5, 0.72), new THREE.MeshStandardMaterial({ color: "#f1c76a", roughness: 0.55, metalness: 0.42 }));
    const strapCross = strap.clone();
    strapCross.rotation.y = Math.PI / 2;
    group.add(crate, lid, strap, strapCross);
  }
  return group;
}

function createObstacleMesh(THREE, obstacle) {
  if (obstacle.kind === "pillar") {
    const group = new THREE.Group();
    const shaft = new THREE.Mesh(new THREE.BoxGeometry(obstacle.radius / 20, obstacle.radius / 11, obstacle.radius / 18), new THREE.MeshStandardMaterial({ color: "#2b333b", roughness: 0.84, metalness: 0.24 }));
    shaft.castShadow = true;
    shaft.receiveShadow = true;
    const top = new THREE.Mesh(new THREE.BoxGeometry(obstacle.radius / 14, obstacle.radius / 24, obstacle.radius / 14), new THREE.MeshStandardMaterial({ color: "#60707e", roughness: 0.52, metalness: 0.58 }));
    top.position.y = obstacle.radius / 20;
    const screen = new THREE.Mesh(new THREE.BoxGeometry(obstacle.radius / 26, obstacle.radius / 22, 0.08), new THREE.MeshBasicMaterial({ color: "#6fd6ff" }));
    screen.position.set(0, 0.12, obstacle.radius / 36);
    group.add(shaft, top, screen);
    return group;
  }

  const group = new THREE.Group();
  const barrier = new THREE.Mesh(new THREE.BoxGeometry(obstacle.radius / 12, obstacle.radius / 24, obstacle.radius / 24), new THREE.MeshStandardMaterial({ color: "#3b434b", roughness: 0.82, metalness: 0.22 }));
  barrier.castShadow = true;
  barrier.receiveShadow = true;
  const cap = new THREE.Mesh(new THREE.BoxGeometry(obstacle.radius / 12 + 0.2, obstacle.radius / 36, obstacle.radius / 24 + 0.12), new THREE.MeshStandardMaterial({ color: "#8f7762", roughness: 0.7, metalness: 0.12 }));
  cap.position.y = obstacle.radius / 48 + 0.12;
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(obstacle.radius / 16, 0.08, 0.04), new THREE.MeshBasicMaterial({ color: "#ffca52" }));
  stripe.position.set(0, 0.08, obstacle.radius / 48 + 0.08);
  group.add(barrier, cap, stripe);
  return group;
}

function createTrapMesh(THREE, trap) {
  const group = new THREE.Group();
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(trap.radius / 55, trap.radius / 38, 24),
    new THREE.MeshBasicMaterial({ color: trap.color, transparent: true, opacity: 0.55, side: THREE.DoubleSide })
  );
  ring.rotation.x = -Math.PI / 2;
  const pool = new THREE.Mesh(
    new THREE.CircleGeometry(trap.radius / 48, 24),
    new THREE.MeshBasicMaterial({ color: "#6b9d42", transparent: true, opacity: 0.22, side: THREE.DoubleSide })
  );
  pool.rotation.x = -Math.PI / 2;
  pool.position.y = 0.01;
  group.add(ring, pool);

  for (let i = 0; i < 4; i += 1) {
    const bubble = new THREE.Mesh(
      new THREE.SphereGeometry(0.08 + i * 0.015, 8, 8),
      new THREE.MeshBasicMaterial({ color: "#b1f76a", transparent: true, opacity: 0.45 })
    );
    bubble.position.set(Math.cos(i * 1.7) * 0.42, 0.08 + i * 0.03, Math.sin(i * 1.7) * 0.34);
    group.add(bubble);
  }
  return group;
}

function createEffectMesh(THREE, effect) {
  if (effect.type === "line") {
    const length = Math.max(0.2, Math.hypot(effect.x2 - effect.x1, effect.y2 - effect.y1) / 48);
    const group = new THREE.Group();
    const core = new THREE.Mesh(
      new THREE.BoxGeometry(0.09, 0.09, length),
      new THREE.MeshBasicMaterial({ color: "#ffffff", transparent: true, opacity: 0.88 })
    );
    const glow = new THREE.Mesh(
      new THREE.BoxGeometry(0.22, 0.04, length * 0.98),
      new THREE.MeshBasicMaterial({ color: effect.color, transparent: true, opacity: 0.5 })
    );
    group.add(core, glow);
    return group;
  }

  if (effect.type === "ring") {
    const group = new THREE.Group();
    const outer = new THREE.Mesh(
      new THREE.RingGeometry(Math.max(0.2, effect.radius / 62), Math.max(0.24, effect.radius / 46), 40),
      new THREE.MeshBasicMaterial({ color: effect.color, transparent: true, opacity: 0.44, side: THREE.DoubleSide })
    );
    const inner = new THREE.Mesh(
      new THREE.RingGeometry(Math.max(0.08, effect.radius / 90), Math.max(0.1, effect.radius / 70), 40),
      new THREE.MeshBasicMaterial({ color: "#ffffff", transparent: true, opacity: 0.65, side: THREE.DoubleSide })
    );
    outer.rotation.x = -Math.PI / 2;
    inner.rotation.x = -Math.PI / 2;
    inner.position.y = 0.02;
    group.add(outer, inner);
    return group;
  }

  if (effect.type === "fan") {
    const group = new THREE.Group();
    const cone = new THREE.Mesh(
      new THREE.CircleGeometry(effect.radius / 48, 36, -effect.spread / 2, effect.spread),
      new THREE.MeshBasicMaterial({ color: effect.color, transparent: true, opacity: 0.24, side: THREE.DoubleSide })
    );
    const edge = new THREE.Mesh(
      new THREE.RingGeometry(effect.radius / 56, effect.radius / 47, 36, 1, -effect.spread / 2, effect.spread),
      new THREE.MeshBasicMaterial({ color: "#fff4c2", transparent: true, opacity: 0.58, side: THREE.DoubleSide })
    );
    cone.rotation.x = -Math.PI / 2;
    edge.rotation.x = -Math.PI / 2;
    edge.position.y = 0.02;
    group.add(cone, edge);
    return group;
  }

  if (effect.type === "crack") {
    const group = new THREE.Group();
    for (let i = 0; i < 5; i += 1) {
      const shard = new THREE.Mesh(
        new THREE.BoxGeometry(0.12 + i * 0.04, 0.02, 1.1 - i * 0.12),
        new THREE.MeshBasicMaterial({ color: i % 2 === 0 ? effect.color : "#ffffff", transparent: true, opacity: 0.34 })
      );
      shard.rotation.y = -0.6 + i * 0.3;
      shard.position.set((i - 2) * 0.22, 0.01, (i % 2 === 0 ? -0.12 : 0.12) * i);
      group.add(shard);
    }
    return group;
  }

  if (effect.type === "speed") {
    const group = new THREE.Group();
    for (let i = 0; i < 6; i += 1) {
      const streak = new THREE.Mesh(
        new THREE.PlaneGeometry(0.14, 0.95 + i * 0.08),
        new THREE.MeshBasicMaterial({ color: i % 2 === 0 ? effect.color : "#ffffff", transparent: true, opacity: 0.3, side: THREE.DoubleSide })
      );
      streak.position.set(Math.cos((Math.PI * 2 * i) / 6) * 0.6, 0.55, Math.sin((Math.PI * 2 * i) / 6) * 0.6);
      streak.lookAt(0, 0.55, 0);
      group.add(streak);
    }
    return group;
  }

  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(0.18, 8, 8),
    new THREE.MeshBasicMaterial({ color: effect.color, transparent: true, opacity: 0.45 })
  );
  return mesh;
}

function createProjectileMesh(THREE, projectile) {
  const group = new THREE.Group();
  const core = new THREE.Mesh(
    new THREE.SphereGeometry(projectile.radius / 30, 10, 10),
    new THREE.MeshBasicMaterial({ color: "#ffffff" })
  );
  const glow = new THREE.Mesh(
    new THREE.SphereGeometry(projectile.radius / 18, 12, 12),
    new THREE.MeshBasicMaterial({ color: projectile.color, transparent: true, opacity: 0.42 })
  );
  const trail = new THREE.Mesh(
    new THREE.CylinderGeometry(projectile.radius / 55, projectile.radius / 16, 0.85, 8),
    new THREE.MeshBasicMaterial({ color: projectile.color, transparent: true, opacity: 0.4 })
  );
  trail.rotation.z = Math.PI / 2;
  trail.position.z = -0.4;
  group.add(core, glow, trail);
  return group;
}

function createBloodPoolMesh(THREE, pool) {
  const group = new THREE.Group();
  const outer = new THREE.Mesh(
    new THREE.CircleGeometry(pool.radius / 44, 18),
    new THREE.MeshBasicMaterial({ color: "#4b0208", transparent: true, opacity: pool.opacity, side: THREE.DoubleSide })
  );
  outer.rotation.x = -Math.PI / 2;
  const inner = new THREE.Mesh(
    new THREE.CircleGeometry(pool.radius / 72, 16),
    new THREE.MeshBasicMaterial({ color: "#9b0f17", transparent: true, opacity: pool.opacity * 0.85, side: THREE.DoubleSide })
  );
  inner.rotation.x = -Math.PI / 2;
  inner.position.y = 0.01;
  inner.position.x = 0.08;
  inner.position.z = -0.04;
  group.add(outer, inner);
  return group;
}

function syncMeshMap(source, map, createFn, updateFn) {
  const THREE = window.THREE;
  const alive = new Set();

  source.forEach((item, index) => {
    const id = item.id || `${index}:${item.x.toFixed(1)}:${item.y.toFixed(1)}`;
    alive.add(id);
    let mesh = map.get(id);
    if (!mesh) {
      mesh = createFn(THREE, item);
      state.three.scene.add(mesh);
      map.set(id, mesh);
    }
    updateFn(mesh, item);
  });

  for (const [id, mesh] of map.entries()) {
    if (!alive.has(id)) {
      state.three.scene.remove(mesh);
      map.delete(id);
    }
  }
}

function renderThreeScene() {
  const THREE = window.THREE;
  if (!THREE) return;

  const playerPos = worldToThree(state.player.x, state.player.y);
  const playerMesh = state.three.playerMesh;
  const walkBob = state.keys.size ? Math.sin(state.time * 0.02) * 0.08 : 0;
  const isRolling = state.time < state.player.rollUntil;
  playerMesh.position.set(playerPos.x, 1.15 + walkBob, playerPos.z);
  playerMesh.rotation.y = Math.atan2(state.player.facing.x, state.player.facing.y);
  playerMesh.rotation.z = isRolling ? Math.sin(state.time * 0.09) * 1.25 : 0;
  playerMesh.rotation.x = isRolling ? Math.cos(state.time * 0.09) * 0.32 : 0;
  playerMesh.scale.set(1, isRolling ? 0.9 : 1, isRolling ? 1.08 : 1);
  state.three.playerShield.visible = state.time < state.player.shieldUntil;
  state.three.playerShield.material.opacity = state.time < state.player.shieldUntil ? 0.2 + Math.sin(state.time * 0.02) * 0.05 : 0.18;
  state.three.playerMarker.position.set(playerPos.x, 0.05, playerPos.z);

  const camTargetX = playerPos.x;
  const camTargetZ = playerPos.z;
  const shakeX = state.screenShake.x * 0.06;
  const shakeY = state.screenShake.y * 0.06;
  state.three.camera.position.set(camTargetX + 12.5 + shakeX, 15.5 + Math.abs(shakeY) * 0.3, camTargetZ + 10.5 + shakeY);
  state.three.camera.lookAt(camTargetX, 0.8, camTargetZ);

  syncMeshMap(
    state.enemies,
    state.three.meshes.enemies,
    createEnemyMesh,
    (mesh, enemy) => {
      const pos = worldToThree(enemy.x, enemy.y);
      mesh.position.set(pos.x, (enemy.boss ? 0.85 : 0.45) + Math.sin(enemy.wobble) * 0.04, pos.z);
      mesh.rotation.y = Math.atan2(state.player.x - enemy.x, state.player.y - enemy.y);
      mesh.scale.setScalar(enemy.boss ? 1.6 : 1);
    }
  );

  syncMeshMap(
    state.pickups,
    state.three.meshes.pickups,
    createPickupMesh,
    (mesh, pickup) => {
      const pos = worldToThree(pickup.x, pickup.y);
      mesh.position.set(pos.x, 0.45 + Math.sin(pickup.pulse) * 0.08, pos.z);
      mesh.rotation.y += 0.01;
    }
  );

  syncMeshMap(
    state.obstacles,
    state.three.meshes.obstacles,
    createObstacleMesh,
    (mesh, obstacle) => {
      const pos = worldToThree(obstacle.x, obstacle.y);
      mesh.position.set(pos.x, obstacle.kind === "pillar" ? obstacle.radius / 44 : obstacle.radius / 90, pos.z);
    }
  );

  syncMeshMap(
    state.traps,
    state.three.meshes.traps,
    createTrapMesh,
    (mesh, trap) => {
      const pos = worldToThree(trap.x, trap.y);
      mesh.position.set(pos.x, 0.03, pos.z);
      mesh.rotation.z += 0.02;
    }
  );

  syncMeshMap(
    state.bloodPools,
    state.three.meshes.gore,
    createBloodPoolMesh,
    (mesh, pool) => {
      const pos = worldToThree(pool.x, pool.y);
      mesh.position.set(pos.x, 0.02, pos.z);
      mesh.rotation.z = pool.rotation;
    }
  );

  syncMeshMap(
    state.projectiles,
    state.three.meshes.projectiles,
    createProjectileMesh,
    (mesh, projectile) => {
      const pos = worldToThree(projectile.x, projectile.y);
      mesh.position.set(pos.x, 0.42, pos.z);
      mesh.rotation.y = Math.atan2(projectile.vx, projectile.vy);
      mesh.scale.setScalar(1 + Math.sin(state.time * 0.03) * 0.08);
    }
  );

  syncMeshMap(
    state.effects,
    state.three.meshes.effects,
    createEffectMesh,
    (mesh, effect) => {
      const pos = worldToThree(effect.x || state.player.x, effect.y || state.player.y);
      mesh.position.set(pos.x, effect.type === "speed" ? 1.35 : 0.04, pos.z);
      if (effect.type === "fan") mesh.rotation.z = -effect.angle;
      if (effect.type === "speed") {
        const pulse = 1.2 + Math.sin(effect.age * 0.025) * 0.18;
        mesh.scale.set(pulse, pulse, pulse);
        mesh.rotation.y += 0.03;
      }
      if (effect.type === "ring") {
        const scale = Math.max(0.2, effect.radius / 28);
        mesh.scale.set(scale, scale, scale);
        mesh.rotation.y += 0.015;
      }
      if (effect.type === "line") {
        const start = worldToThree(effect.x1, effect.y1);
        const end = worldToThree(effect.x2, effect.y2);
        mesh.position.set((start.x + end.x) / 2, 0.42, (start.z + end.z) / 2);
        mesh.rotation.y = Math.atan2(end.x - start.x, end.z - start.z);
      }
      if (effect.type === "crack") {
        mesh.rotation.z = Math.sin(effect.age * 0.01) * 0.08;
      }
    }
  );

  state.three.decals.forEach((decal, index) => {
    decal.material.opacity = 0.12 + Math.sin(state.time * 0.0015 + index) * 0.03;
  });

  state.three.flamePatches.forEach((patch, index) => {
    patch.children.forEach((child, childIndex) => {
      if (child.geometry && child.geometry.type === "PlaneGeometry") {
        child.lookAt(state.three.camera.position);
        child.position.y = 0.55 + childIndex * 0.12 + Math.sin(state.time * 0.01 + index + childIndex) * 0.08;
        child.scale.setScalar(1 + Math.sin(state.time * 0.015 + index * 0.5 + childIndex) * 0.12);
      }
      if (child.geometry && child.geometry.type === "CircleGeometry") {
        child.material.opacity = 0.18 + Math.sin(state.time * 0.01 + index) * 0.06;
      }
    });
  });

  state.three.renderer.render(state.three.scene, state.three.camera);
}

function worldToScreen(x, y, elevation = 0) {
  const dx = x - state.camera.x;
  const dy = y - state.camera.y;
  return {
    x: canvas.width / 2 + (dx - dy) * 0.55,
    y: canvas.height / 2 + (dx + dy) * 0.28 - elevation,
  };
}

function drawIsoShadow(screenX, screenY, width, height, alpha) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = "#050404";
  ctx.beginPath();
  ctx.ellipse(screenX, screenY, width, height, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function renderWorld() {
  ctx.save();
  ctx.translate(state.screenShake.x * 5, state.screenShake.y * 5);
  const backgroundGlow = ctx.createLinearGradient(0, 0, 0, canvas.height);
  backgroundGlow.addColorStop(0, "#1a1f1a");
  backgroundGlow.addColorStop(0.45, "#171110");
  backgroundGlow.addColorStop(1, "#090707");
  ctx.fillStyle = backgroundGlow;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let i = 0; i < 6; i += 1) {
    const side = i % 2 === 0 ? 110 : canvas.width - 110;
    const top = 40 + i * 92;
    ctx.save();
    ctx.globalAlpha = 0.18;
    ctx.fillStyle = "#2c201d";
    ctx.beginPath();
    ctx.moveTo(side + (i % 2 === 0 ? -50 : 50), top);
    ctx.lineTo(side + (i % 2 === 0 ? 10 : -10), top - 12);
    ctx.lineTo(side + (i % 2 === 0 ? 34 : -34), top + 180);
    ctx.lineTo(side + (i % 2 === 0 ? -84 : 84), top + 180);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  ctx.save();
  ctx.strokeStyle = "rgba(90, 112, 96, 0.35)";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(canvas.width / 2, 86, 140, Math.PI, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  const baseGridX = Math.floor(state.camera.x / 92) * 92;
  const baseGridY = Math.floor(state.camera.y / 92) * 92;
  for (let gx = -12; gx <= 12; gx += 1) {
    for (let gy = -12; gy <= 12; gy += 1) {
      const worldX = baseGridX + gx * 92;
      const worldY = baseGridY + gy * 92;
      const screen = worldToScreen(worldX, worldY);
      const width = 108;
      const height = 54;
      const tileKey = Math.floor(worldX / 92) + Math.floor(worldY / 92) + state.currentLevel;
      const warmTone = tileKey % 2 === 0;

      ctx.beginPath();
      ctx.moveTo(screen.x, screen.y - height / 2);
      ctx.lineTo(screen.x + width / 2, screen.y);
      ctx.lineTo(screen.x, screen.y + height / 2);
      ctx.lineTo(screen.x - width / 2, screen.y);
      ctx.closePath();
      ctx.fillStyle = warmTone ? "rgba(78, 38, 28, 0.92)" : "rgba(47, 26, 23, 0.94)";
      ctx.fill();
      ctx.strokeStyle = "rgba(255, 133, 86, 0.08)";
      ctx.stroke();

      if (tileKey % 5 === 0) {
        ctx.strokeStyle = "rgba(255, 65, 37, 0.65)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(screen.x - 18, screen.y + 6);
        ctx.lineTo(screen.x - 4, screen.y + 2);
        ctx.lineTo(screen.x + 8, screen.y + 10);
        ctx.lineTo(screen.x + 20, screen.y + 6);
        ctx.stroke();
      }
    }
  }

  for (let i = 0; i < 18; i += 1) {
    const screen = worldToScreen((i * 271) % WORLD.width, (i * 389) % WORLD.height);
    ctx.save();
    ctx.translate(screen.x, screen.y + 18);
    ctx.fillStyle = "rgba(0, 0, 0, 0.18)";
    ctx.beginPath();
    ctx.ellipse(0, 0, 32 + (i % 4) * 7, 15 + (i % 3) * 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  const glow = ctx.createRadialGradient(canvas.width / 2, 160, 20, canvas.width / 2, 160, 380);
  glow.addColorStop(0, "rgba(156, 194, 170, 0.16)");
  glow.addColorStop(0.45, "rgba(198, 79, 51, 0.14)");
  glow.addColorStop(1, "rgba(198, 79, 51, 0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  renderHellFlames();
  renderBloodPools();
  renderTraps();
  renderObstacles();
  ctx.restore();
}

function renderHellFlames() {
  const baseGridX = Math.floor(state.camera.x / 260) * 260;
  const baseGridY = Math.floor(state.camera.y / 220) * 220;
  for (let gx = -4; gx <= 4; gx += 1) {
    for (let gy = -4; gy <= 4; gy += 1) {
      const worldX = baseGridX + gx * 260 + ((gy + gx) % 2) * 46;
      const worldY = baseGridY + gy * 220 + ((gx + state.currentLevel) % 3) * 38;
      const flameSeed = Math.abs(Math.floor(worldX / 40) + Math.floor(worldY / 40));
      if (flameSeed % 3 !== 0) continue;
      if (collidesWithObstacle(worldX, worldY, 36)) continue;

      const screen = worldToScreen(worldX, worldY, 18);
      const sway = Math.sin(state.time * 0.008 + flameSeed) * 4;
      const ember = ctx.createRadialGradient(screen.x, screen.y + 12, 2, screen.x, screen.y + 12, 26);
      ember.addColorStop(0, "rgba(255, 236, 160, 0.85)");
      ember.addColorStop(0.3, "rgba(255, 133, 46, 0.7)");
      ember.addColorStop(0.7, "rgba(205, 36, 17, 0.32)");
      ember.addColorStop(1, "rgba(205, 36, 17, 0)");
      ctx.fillStyle = ember;
      ctx.beginPath();
      ctx.ellipse(screen.x, screen.y + 16, 24, 10, 0, 0, Math.PI * 2);
      ctx.fill();

      for (let i = 0; i < 3; i += 1) {
        const flameHeight = 20 + i * 8 + Math.sin(state.time * 0.013 + flameSeed + i) * 5;
        ctx.fillStyle = i === 0 ? "rgba(255, 239, 171, 0.88)" : i === 1 ? "rgba(255, 132, 37, 0.7)" : "rgba(194, 28, 20, 0.5)";
        ctx.beginPath();
        ctx.moveTo(screen.x + sway * 0.18 * i, screen.y + 12);
        ctx.quadraticCurveTo(screen.x - 10 + sway, screen.y - flameHeight * 0.35, screen.x - 1 + sway * 0.4, screen.y - flameHeight);
        ctx.quadraticCurveTo(screen.x + 9 + sway * 0.6, screen.y - flameHeight * 0.3, screen.x + 2 + sway * 0.25, screen.y + 12);
        ctx.closePath();
        ctx.fill();
      }
    }
  }
}

function renderBloodPools() {
  for (const pool of state.bloodPools) {
    const screen = worldToScreen(pool.x, pool.y, 10);
    ctx.save();
    ctx.translate(screen.x, screen.y + 12);
    ctx.rotate(pool.rotation);
    ctx.globalAlpha = pool.opacity;
    ctx.fillStyle = "#4f0208";
    ctx.beginPath();
    ctx.ellipse(0, 0, pool.radius * 0.72, pool.radius * 0.28, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(173, 12, 21, 0.55)";
    ctx.beginPath();
    ctx.ellipse(pool.radius * 0.1, -1, pool.radius * 0.34, pool.radius * 0.14, 0.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function renderTraps() {
  for (const trap of state.traps) {
    const screen = worldToScreen(trap.x, trap.y, 8);
    const alpha = Math.max(0.18, trap.life / 3000);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = trap.color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(screen.x, screen.y + 18, trap.radius * 0.58, trap.radius * 0.28, 0, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = "rgba(87, 145, 60, 0.22)";
    ctx.beginPath();
    ctx.ellipse(screen.x, screen.y + 18, 20 + Math.sin(trap.pulse) * 5, 9 + Math.sin(trap.pulse) * 2, 0, 0, Math.PI * 2);
    ctx.fill();

    for (const bubble of trap.bubbles) {
      const bx = screen.x + Math.cos(bubble.angle + trap.pulse) * bubble.distance;
      const by = screen.y + 12 + Math.sin(bubble.angle + trap.pulse * 0.7) * bubble.distance * 0.35;
      ctx.fillStyle = "rgba(165, 227, 112, 0.34)";
      ctx.beginPath();
      ctx.arc(bx, by, bubble.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}

function renderObstacles() {
  const obstacles = state.obstacles.slice().sort((a, b) => (a.x + a.y) - (b.x + b.y));
  for (const obstacle of obstacles) {
    const screen = worldToScreen(obstacle.x, obstacle.y, obstacle.radius + 20);
    drawIsoShadow(screen.x, screen.y + obstacle.radius + 20, obstacle.radius, obstacle.radius * 0.36, 0.34);

    ctx.save();
    ctx.translate(screen.x, screen.y);

    if (obstacle.kind === "pillar") {
      ctx.fillStyle = "#2e2827";
      ctx.beginPath();
      ctx.moveTo(-obstacle.radius * 0.7, obstacle.radius * 0.9);
      ctx.lineTo(-obstacle.radius * 0.45, -obstacle.radius);
      ctx.lineTo(obstacle.radius * 0.45, -obstacle.radius);
      ctx.lineTo(obstacle.radius * 0.7, obstacle.radius * 0.9);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = "#453a36";
      ctx.fillRect(-obstacle.radius * 0.5, -obstacle.radius * 1.15, obstacle.radius, obstacle.radius * 0.28);
      ctx.fillStyle = "#6e281e";
      ctx.fillRect(-obstacle.radius * 0.08, -obstacle.radius * 0.8, obstacle.radius * 0.16, obstacle.radius * 1.4);
    } else {
      ctx.fillStyle = "#2b2422";
      ctx.beginPath();
      ctx.ellipse(0, obstacle.radius * 0.3, obstacle.radius * 0.95, obstacle.radius * 0.72, 0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#453635";
      ctx.beginPath();
      ctx.ellipse(-obstacle.radius * 0.18, 0, obstacle.radius * 0.45, obstacle.radius * 0.28, -0.2, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}

function renderPlayer() {
  const player = state.player;
  const screen = worldToScreen(player.x, player.y, 34);
  const x = screen.x;
  const y = screen.y;
  const isRolling = state.time < player.rollUntil;
  const rollSpin = isRolling ? state.time * 0.09 : 0;

  drawIsoShadow(screen.x, screen.y + 35, 30, 11, 0.36);
  ctx.save();
  ctx.translate(x, y);
  if (isRolling) {
    ctx.rotate(rollSpin);
    ctx.scale(1.08, 0.92);
  }
  if (player.hitFlash > 0) {
    ctx.shadowBlur = 25;
    ctx.shadowColor = "#ff7b63";
  }
  ctx.fillStyle = "#6a481f";
  ctx.beginPath();
  ctx.ellipse(0, 10, 22, 32, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#b97d2d";
  ctx.beginPath();
  ctx.ellipse(0, 2, 18, 20, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#2b2e33";
  ctx.beginPath();
  ctx.roundRect(-18, -12, 36, 34, 10);
  ctx.fill();

  ctx.fillStyle = "#d09b45";
  ctx.fillRect(-2.5, -12, 5, 34);

  ctx.fillStyle = "#111316";
  ctx.beginPath();
  ctx.moveTo(-10, -2);
  ctx.lineTo(-3, 6);
  ctx.lineTo(-12, 7);
  ctx.closePath();
  ctx.moveTo(10, -2);
  ctx.lineTo(3, 6);
  ctx.lineTo(12, 7);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#58b7ff";
  ctx.beginPath();
  ctx.arc(-7, -2, 2.2, 0, Math.PI * 2);
  ctx.arc(7, -2, 2.2, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "#0f1113";
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(-7, 11);
  ctx.lineTo(0, 16);
  ctx.lineTo(7, 11);
  ctx.stroke();

  ctx.fillStyle = "#292d32";
  ctx.fillRect(-26, 16, 10, 24);
  ctx.fillRect(16, 16, 10, 24);
  ctx.fillRect(-18, 38, 8, 19);
  ctx.fillRect(10, 38, 8, 19);

  ctx.fillStyle = "#15181b";
  ctx.fillRect(21, 32, 7, 18);
  ctx.fillRect(26, 46, 4, 18);

  const lavaGlow = ctx.createRadialGradient(0, 60, 5, 0, 60, 44);
  lavaGlow.addColorStop(0, "rgba(255, 170, 60, 0.95)");
  lavaGlow.addColorStop(0.5, "rgba(255, 82, 32, 0.6)");
  lavaGlow.addColorStop(1, "rgba(255, 82, 32, 0)");
  ctx.fillStyle = lavaGlow;
  ctx.beginPath();
  ctx.ellipse(0, 60, 36, 16, 0, 0, Math.PI * 2);
  ctx.fill();

  if (state.time < player.shieldUntil) {
    ctx.strokeStyle = "rgba(197, 255, 110, 0.8)";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(0, 0, 34, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

function renderEnemies() {
  const enemies = state.enemies.slice().sort((a, b) => (a.x + a.y) - (b.x + b.y));
  for (const enemy of enemies) {
    const screen = worldToScreen(enemy.x, enemy.y, enemy.size + 18);
    const x = screen.x;
    const y = screen.y;
    drawIsoShadow(screen.x, screen.y + enemy.size + 18, enemy.size * 0.9, enemy.size * 0.28, 0.32);
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(Math.sin(enemy.wobble) * 0.16);
    ctx.fillStyle = enemy.boss ? "#58504b" : "#2a2a2a";
    ctx.beginPath();
    ctx.ellipse(0, 6, enemy.size * 1.08, enemy.size * 0.72, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = enemy.boss ? "#41342f" : "#1d1d1d";
    ctx.beginPath();
    ctx.arc(-enemy.size * 0.4, 0, enemy.size * 0.35, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "rgba(30, 30, 30, 0.9)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(enemy.size * 0.2, 7);
    ctx.lineTo(enemy.size * 0.9, -4);
    ctx.moveTo(enemy.size * 0.2, 14);
    ctx.lineTo(enemy.size * 0.95, 8);
    ctx.stroke();

    ctx.strokeStyle = enemy.boss ? "#ff7b63" : "#393939";
    ctx.beginPath();
    ctx.moveTo(-enemy.size * 0.2, 12);
    ctx.lineTo(-enemy.size * 0.65, enemy.size * 0.75);
    ctx.moveTo(enemy.size * 0.1, 14);
    ctx.lineTo(-enemy.size * 0.3, enemy.size * 0.82);
    ctx.stroke();

    if (enemy.slowUntil && state.time < enemy.slowUntil) {
      ctx.strokeStyle = "rgba(114, 214, 255, 0.9)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, enemy.size + 5, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.fillStyle = enemy.boss ? "rgba(255, 85, 67, 0.95)" : "rgba(255, 130, 120, 0.85)";
    ctx.beginPath();
    ctx.arc(-enemy.size * 0.45, -1, 1.8, 0, Math.PI * 2);
    ctx.arc(-enemy.size * 0.18, 1, 1.8, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
    ctx.fillRect(-enemy.size, -enemy.size - 18, enemy.size * 2, 5);
    ctx.fillStyle = "#8df38d";
    ctx.fillRect(-enemy.size, -enemy.size - 18, (enemy.health / enemy.maxHealth) * enemy.size * 2, 5);
    ctx.restore();
  }
}

function renderPickups() {
  for (const pickup of state.pickups) {
    const screen = worldToScreen(pickup.x, pickup.y, 30);
    const x = screen.x;
    const y = screen.y;
    const bob = Math.sin(pickup.pulse) * 2;
    drawIsoShadow(screen.x, screen.y + 24, 16, 7, 0.3);
    ctx.save();
    ctx.translate(x, y + bob);

    if (pickup.kind === "potion") {
      const liquidColor = pickup.potionType === "health" ? "#d94b40" : "#4f88e4";
      const glowColor = pickup.potionType === "health" ? "rgba(217, 75, 64, 0.18)" : "rgba(79, 136, 228, 0.18)";

      ctx.fillStyle = glowColor;
      ctx.beginPath();
      ctx.ellipse(0, 6, 12, 9, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#201716";
      ctx.fillRect(-3.5, -13, 7, 7);
      ctx.fillStyle = "#79665e";
      ctx.fillRect(-2.5, -10, 5, 4);

      ctx.fillStyle = "rgba(220, 235, 255, 0.88)";
      ctx.beginPath();
      ctx.moveTo(-8, -8);
      ctx.quadraticCurveTo(-12, 0, -7, 8);
      ctx.quadraticCurveTo(0, 15, 7, 8);
      ctx.quadraticCurveTo(12, 0, 8, -8);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = liquidColor;
      ctx.beginPath();
      ctx.moveTo(-7, -1);
      ctx.quadraticCurveTo(-10, 4, -6, 8);
      ctx.quadraticCurveTo(0, 12, 6, 8);
      ctx.quadraticCurveTo(10, 4, 7, -1);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = "rgba(255,255,255,0.7)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-3, -4);
      ctx.lineTo(-1, 4);
      ctx.stroke();
    } else {
      ctx.fillStyle = "rgba(0, 0, 0, 0.22)";
      ctx.beginPath();
      ctx.ellipse(0, 8, 14, 9, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#5b4030";
      ctx.beginPath();
      ctx.moveTo(0, -12);
      ctx.lineTo(12, -5);
      ctx.lineTo(0, 2);
      ctx.lineTo(-12, -5);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = "#7a573f";
      ctx.beginPath();
      ctx.moveTo(-12, -5);
      ctx.lineTo(0, 2);
      ctx.lineTo(0, 16);
      ctx.lineTo(-12, 9);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = "#3f2d23";
      ctx.beginPath();
      ctx.moveTo(12, -5);
      ctx.lineTo(0, 2);
      ctx.lineTo(0, 16);
      ctx.lineTo(12, 9);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = "#b68a57";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, -11);
      ctx.lineTo(0, 16);
      ctx.moveTo(-6, -2);
      ctx.lineTo(6, 5);
      ctx.stroke();
    }

    ctx.restore();
  }
}

function renderProjectiles() {
  for (const projectile of state.projectiles) {
    const screen = worldToScreen(projectile.x, projectile.y, 34);
    if (projectile.trail) {
      const previous = worldToScreen(projectile.x - projectile.vx * 2.2, projectile.y - projectile.vy * 2.2, 34);
      ctx.globalAlpha = 0.35;
      ctx.fillStyle = projectile.color;
      ctx.beginPath();
      ctx.arc(previous.x, previous.y, projectile.radius + 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    ctx.fillStyle = projectile.color;
    ctx.beginPath();
    ctx.arc(screen.x, screen.y, projectile.radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

function renderEffects() {
  for (const effect of state.effects) {
    ctx.save();
    ctx.globalAlpha = effect.life / effect.maxLife;

    if (effect.type === "ring") {
      const screen = worldToScreen(effect.x, effect.y, 24);
      ctx.strokeStyle = effect.color;
      ctx.lineWidth = effect.lineWidth;
      ctx.beginPath();
      ctx.ellipse(screen.x, screen.y, effect.radius, effect.radius * 0.45, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    if (effect.type === "line") {
      const start = worldToScreen(effect.x1, effect.y1, 40);
      const end = worldToScreen(effect.x2, effect.y2, 40);
      ctx.strokeStyle = effect.color;
      ctx.lineWidth = effect.lineWidth;
      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
      ctx.stroke();
    }

    if (effect.type === "slash") {
      const screen = worldToScreen(effect.x, effect.y, 38);
      ctx.strokeStyle = effect.color;
      ctx.lineWidth = effect.lineWidth;
      ctx.beginPath();
      ctx.ellipse(screen.x, screen.y, effect.radius, effect.radius * 0.55, 0, -0.7, 1.1);
      ctx.stroke();
    }

    if (effect.type === "fan") {
      const screen = worldToScreen(effect.x, effect.y, 34);
      const angle = effect.angle;
      const spread = effect.spread;
      ctx.fillStyle = effect.color;
      ctx.globalAlpha = (effect.life / effect.maxLife) * 0.28;
      ctx.beginPath();
      ctx.moveTo(screen.x, screen.y);
      for (let i = 0; i <= 18; i += 1) {
        const t = -spread / 2 + (spread * i) / 18;
        const px = effect.x + Math.cos(angle + t) * effect.radius;
        const py = effect.y + Math.sin(angle + t) * effect.radius;
        const point = worldToScreen(px, py, 34);
        ctx.lineTo(point.x, point.y);
      }
      ctx.closePath();
      ctx.fill();
    }

    if (effect.type === "speed") {
      const screen = worldToScreen(effect.x, effect.y, 36);
      ctx.strokeStyle = effect.color;
      ctx.lineWidth = 3;
      for (let i = 0; i < 3; i += 1) {
        const offset = i * 8 - 8;
        ctx.beginPath();
        ctx.moveTo(screen.x - 26, screen.y + offset);
        ctx.lineTo(screen.x + 6, screen.y + offset - 10);
        ctx.stroke();
      }
    }

    if (effect.type === "crack") {
      const screen = worldToScreen(effect.x, effect.y, 10);
      ctx.strokeStyle = effect.color;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(screen.x - 52, screen.y + 8);
      ctx.lineTo(screen.x - 18, screen.y - 6);
      ctx.lineTo(screen.x + 4, screen.y + 10);
      ctx.lineTo(screen.x + 30, screen.y - 2);
      ctx.lineTo(screen.x + 62, screen.y + 14);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(screen.x - 10, screen.y + 6);
      ctx.lineTo(screen.x - 30, screen.y + 28);
      ctx.moveTo(screen.x + 12, screen.y + 8);
      ctx.lineTo(screen.x + 34, screen.y + 28);
      ctx.stroke();
    }

    ctx.restore();
  }
}

function renderParticles() {
  for (const particle of state.particles) {
    const screen = worldToScreen(particle.x, particle.y, 30);
    ctx.globalAlpha = particle.life / (particle.kind === "blood" ? 980 : 650);
    ctx.fillStyle = particle.color;
    if (particle.kind === "blood") {
      ctx.beginPath();
      ctx.ellipse(screen.x, screen.y, particle.size, particle.size * 0.58, 0, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillRect(screen.x, screen.y, 4, 4);
    }
    ctx.globalAlpha = 1;
  }
}

function renderFloatingTexts() {
  ctx.font = 'bold 15px "Space Mono"';
  for (const text of state.floatingTexts) {
    const screen = worldToScreen(text.x, text.y, 68);
    ctx.globalAlpha = text.life / 900;
    ctx.fillStyle = text.color;
    ctx.fillText(text.text, screen.x, screen.y);
    ctx.globalAlpha = 1;
  }
}

function renderOverlay() {
  ctx.fillStyle = "rgba(255,255,255,0.07)";
  ctx.fillRect(16, 16, 160, 10);
  ctx.fillStyle = "#ff7b63";
  ctx.fillRect(16, 16, (state.player.health / state.player.maxHealth) * 160, 10);

  ctx.fillStyle = "rgba(255,255,255,0.07)";
  ctx.fillRect(16, 32, 160, 10);
  ctx.fillStyle = "#64c7ff";
  ctx.fillRect(16, 32, (state.player.mana / state.player.maxMana) * 160, 10);

  ctx.fillStyle = "#f8ead4";
  ctx.font = '14px "Space Mono"';
  ctx.fillText(`Potions [1:${state.player.healthPotions}] [2:${state.player.manaPotions}]`, 16, 58);
}

function renderHud() {
  const player = state.player;
  ui.healthBar.max = player.maxHealth;
  ui.healthBar.value = player.health;
  ui.manaBar.max = player.maxMana;
  ui.manaBar.value = player.mana;
  ui.healthText.textContent = `${Math.round(player.health)} / ${player.maxHealth}`;
  ui.manaText.textContent = `${Math.round(player.mana)} / ${player.maxMana}`;
  ui.xpText.textContent = `Level ${player.level} • XP ${player.xp} / ${player.xpToNext}`;
  ui.potionText.textContent = "";
  ui.objectiveText.textContent = state.victory
    ? `Level ${state.currentLevel} cleared. Move on when ready.`
    : state.bossSpawned
      ? `Boss live. Finish the mutant monarch.`
      : `Level ${state.currentLevel}: defeat ${state.levelKillGoal - state.levelKills} more enemies to summon the boss.`;

  ui.equipmentList.innerHTML = SLOT_ORDER.map((slot) => {
    const item = player.gear[slot];
    return `
      <div class="equipment-slot">
        <div class="equipment-art">${getEquipmentArt(slot, item)}</div>
        <div class="slot-label">${SLOT_META[slot].label}</div>
        <div class="equipment-name">${item ? item.name : "Empty"}</div>
        <div class="equipment-skill">${item ? item.skill.name : "No skill"}</div>
      </div>
    `;
  }).join("");

  ui.skillBar.innerHTML = SLOT_ORDER.map((slot) => {
    const item = player.gear[slot];
    const skill = item ? item.skill : null;
    const iconColor = skill ? skill.color : "#5b4e45";
    return `
      <div class="skill-card">
        <div class="skill-top">
          <span class="skill-key">${SLOT_META[slot].key}</span>
          <div class="skill-icon" style="background:${iconColor}">${getEquipmentArt(slot, item)}</div>
          <div class="skill-name">${skill ? skill.name : "Empty"}</div>
        </div>
      </div>
    `;
  }).join("") + `
    <div class="skill-card potion-card">
      <div class="skill-top">
        <span class="potion-key">1</span>
        <div class="potion-icon" style="background:linear-gradient(180deg, rgba(204, 74, 52, 0.96), rgba(106, 19, 20, 0.96))">🧪</div>
        <div>
          <div class="skill-name">Health Potion</div>
          <div class="potion-count">x${player.healthPotions}</div>
        </div>
      </div>
    </div>
    <div class="skill-card potion-card">
      <div class="skill-top">
        <span class="potion-key">2</span>
        <div class="potion-icon" style="background:linear-gradient(180deg, rgba(90, 159, 208, 0.96), rgba(24, 53, 108, 0.96))">🧪</div>
        <div>
          <div class="skill-name">Mana Potion</div>
          <div class="potion-count">x${player.manaPotions}</div>
        </div>
      </div>
    </div>
  `;

  ui.log.innerHTML = state.logEntries
    .map((entry) => `<div class="log-entry">${entry}</div>`)
    .join("");
  renderScreenBlood();
}

function renderScreenBlood() {
  ui.screenBlood.innerHTML = state.screenBlood
    .map(
      (spot) =>
        `<div class="blood-spot" style="left:${spot.x}%;top:${spot.y}%;width:${spot.size}px;height:${spot.size}px;opacity:${spot.opacity * clamp(spot.life / 18000, 0, 1)}"></div>`
    )
    .join("");
}

function addLog(message) {
  state.logEntries.unshift(message);
  state.logEntries = state.logEntries.slice(0, 7);
}

function getCamera() {
  return {
    x: clamp(state.player.x - canvas.width / 2, 0, WORLD.width - canvas.width),
    y: clamp(state.player.y - canvas.height / 2, 0, WORLD.height - canvas.height),
  };
}

function randomWorldX() {
  return 60 + Math.random() * (WORLD.width - 120);
}

function randomWorldY() {
  return 60 + Math.random() * (WORLD.height - 120);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function rand(min, max) {
  return min + Math.random() * (max - min);
}

function capitalize(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function getEquipmentArt(slot, item) {
  if (!item) return "·";
  if (slot === "weapon") return item.skill.name === "Root Slice" ? "🌿" : "🗡";
  if (slot === "helmet") return item.skill.name === "Rotten Trap" ? "🧪" : "📡";
  if (slot === "armor") return item.skill.name === "Baraboiled Speed" ? "🔥" : "🛡";
  if (slot === "boots") return item.skill.name === "Mash" ? "💥" : "✨";
  return "•";
}

function openFigmaNode(nodeId) {
  const encodedNodeId = nodeId.replace(":", "-");
  const url = `https://www.figma.com/design/${FIGMA_FILE_KEY}/Potato-Wasteland-Localhost-Capture?node-id=${encodedNodeId}`;
  window.open(url, "_blank", "noopener,noreferrer");
}

document.addEventListener("click", (event) => {
  if (!event.shiftKey) return;

  const element = event.target instanceof Element ? event.target : null;
  if (!element) return;

  const target = element.closest(".figma-link-target");
  if (!target) return;

  const nodeId = target.getAttribute("data-figma-node");
  if (!nodeId) return;

  event.preventDefault();
  event.stopPropagation();
  openFigmaNode(nodeId);
});

window.addEventListener("keydown", (event) => {
  const key = event.key.toLowerCase();
  if (["arrowup", "arrowdown", "arrowleft", "arrowright", " ", "1", "2", "q", "w", "e", "r"].includes(key)) event.preventDefault();

  if (["arrowup", "arrowdown", "arrowleft", "arrowright"].includes(key)) state.keys.add(key);
  if (key === " ") useDodgeRoll();
  if (key === "q") useSkill("weapon");
  if (key === "w") useSkill("helmet");
  if (key === "e") useSkill("armor");
  if (key === "r") useSkill("boots");
  if (key === "1") usePotion("health");
  if (key === "2") usePotion("mana");
});

window.addEventListener("keyup", (event) => {
  const key = event.key.toLowerCase();
  state.keys.delete(key);
});

bootGame();
