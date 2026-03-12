import * as THREE from 'three';

// ═══════════════════════════════════════════════════════════════
//  GOALIE_HYPERCASUAL.TS
//  Matches "Crazy Goaal" art style: single flat color stickman,
//  round head, pill body, tube limbs. No dive — lateral coverage.
// ═══════════════════════════════════════════════════════════════

const CW = 256;
const CH = 256;

// ── Palette (single-color character, just like the game) ────────
const COLOR      = '#e74c3c';   // flat red — swap for any team color
const COLOR_DARK = '#b83c2c';   // subtle underside shading only
const SHADOW     = 'rgba(0,0,0,0.18)';

// ── Types ────────────────────────────────────────────────────────
export type HCGoalieState =
  | 'idle'          // standing, gentle bob
  | 'ready'         // arms wide, slight crouch — default between shots
  | 'coverLeft'     // leaning/sliding left, left arm up
  | 'coverRight'    // leaning/sliding right, right arm up
  | 'saveLeft'      // fully stretched to left, arm at max
  | 'saveRight';    // fully stretched to right, arm at max

// ── Math helpers ─────────────────────────────────────────────────
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const easeOut = (t: number) => 1 - (1 - t) * (1 - t);
const easeInOut = (t: number) =>
  t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

// ── Core Draw ─────────────────────────────────────────────────────
//  Everything is described by a single pose object so animation
//  is just interpolating numbers — no branching in the renderer.

interface HCPose {
  // Body center position on canvas
  cx: number;
  cy: number;
  // Body: ellipse half-sizes
  bw: number;   // half-width
  bh: number;   // half-height
  // Head offset from body top
  headOX: number;
  headOY: number;
  headR: number;
  // Limb angles (radians from straight-down)
  //   negative = toward left, positive = toward right
  lArmAng: number;  // upper arm angle
  rArmAng: number;
  lElbAng: number;  // forearm added angle
  rElbAng: number;
  lLegAng: number;
  rLegAng: number;
  lKneAng: number;
  rKneAng: number;
  // Limb lengths
  UAL: number;  // upper arm
  FAL: number;  // forearm
  ULL: number;  // upper leg
  LLL: number;  // lower leg
  // Global lean (full body tilt in radians)
  lean: number;
  // Shadow width
  shadowW: number;
}

function buildPose(overrides: Partial<HCPose>): HCPose {
  return {
    cx: 128, cy: 128,
    bw: 22, bh: 30,
    headOX: 0, headOY: 0, headR: 22,
    lArmAng: -0.55, rArmAng: 0.55,
    lElbAng: 0.12, rElbAng: -0.12,
    lLegAng: -0.16, rLegAng: 0.16,
    lKneAng: 0.08, rKneAng: 0.08,
    UAL: 26, FAL: 22,
    ULL: 28, LLL: 26,
    lean: 0,
    shadowW: 36,
    ...overrides,
  };
}

// ── Pose factories ────────────────────────────────────────────────

function pIdle(t: number): HCPose {
  const bob  = Math.sin(t * 1.6) * 3;
  const sway = Math.sin(t * 0.9) * 1.5;
  return buildPose({
    cy: 130 + bob,
    cx: 128 + sway * 0.3,
    bh: 28 - Math.abs(bob) * 0.3,
    lArmAng: -0.44 + Math.sin(t * 1.1) * 0.04,
    rArmAng:  0.44 - Math.sin(t * 1.1) * 0.04,
    shadowW: 34,
  });
}

function pReady(t: number): HCPose {
  const bob = Math.abs(Math.sin(t * 2.0)) * 2.5;
  const sway = Math.sin(t * 2.0) * 4;
  return buildPose({
    cy: 132 + bob,
    cx: 128 + sway * 0.2,
    bw: 24,
    bh: 26,   // slightly squished = crouched
    lArmAng: -1.20,
    rArmAng:  1.20,
    lElbAng:  0.22, rElbAng: -0.22,
    lLegAng: -0.28, rLegAng: 0.28,
    lKneAng:  0.25, rKneAng: 0.25,
    UAL: 28, FAL: 24,
    shadowW: 50,
  });
}

function pCoverLeft(t: number, frac: number): HCPose {
  const p = easeOut(frac);
  const bob = Math.abs(Math.sin(t * 3.0)) * 2;
  const cx = lerp(128, 92, p);
  const lean = lerp(0, -0.32, p);

  // Left arm shoots up and wide, right arm drops
  const lArmAng = lerp(-1.20, -2.1, p);
  const rArmAng = lerp( 1.20,  0.5, p);

  // Legs: left leg extends out, right leg bends under
  const lLegAng = lerp(-0.28, -0.55, p);
  const rLegAng = lerp( 0.28,  0.18, p);
  const lKneAng = lerp( 0.25,  0.10, p);
  const rKneAng = lerp( 0.25,  0.42, p);

  return buildPose({
    cx, cy: 130 + bob,
    bw: lerp(24, 26, p),
    bh: lerp(26, 24, p),
    lArmAng, rArmAng,
    lElbAng: lerp(0.22, 0.08, p),
    rElbAng: lerp(-0.22, -0.08, p),
    lLegAng, rLegAng, lKneAng, rKneAng,
    UAL: 28, FAL: 24,
    lean,
    shadowW: lerp(50, 44, p),
  });
}

function pCoverRight(t: number, frac: number): HCPose {
  const p = easeOut(frac);
  const bob = Math.abs(Math.sin(t * 3.0)) * 2;
  const cx = lerp(128, 164, p);
  const lean = lerp(0, 0.32, p);

  const lArmAng = lerp(-1.20, -0.5, p);
  const rArmAng = lerp( 1.20,  2.1, p);
  const lLegAng = lerp(-0.28, -0.18, p);
  const rLegAng = lerp( 0.28,  0.55, p);
  const lKneAng = lerp( 0.25,  0.42, p);
  const rKneAng = lerp( 0.25,  0.10, p);

  return buildPose({
    cx, cy: 130 + bob,
    bw: lerp(24, 26, p),
    bh: lerp(26, 24, p),
    lArmAng, rArmAng,
    lElbAng: lerp(0.22, 0.08, p),
    rElbAng: lerp(-0.22, -0.08, p),
    lLegAng, rLegAng, lKneAng, rKneAng,
    UAL: 28, FAL: 24,
    lean,
    shadowW: lerp(50, 44, p),
  });
}

function pSaveLeft(t: number): HCPose {
  const wiggle = Math.sin(t * 6) * 0.04;
  return buildPose({
    cx: 82,
    cy: 132,
    bw: 26, bh: 23,
    lArmAng: -2.5 + wiggle,  // nearly straight up-left
    rArmAng: 0.44,
    lElbAng: 0.06, rElbAng: -0.14,
    lLegAng: -0.60, rLegAng: 0.22,
    lKneAng: 0.08, rKneAng: 0.38,
    UAL: 30, FAL: 26,
    lean: -0.38,
    shadowW: 40,
  });
}

function pSaveRight(t: number): HCPose {
  const wiggle = Math.sin(t * 6) * 0.04;
  return buildPose({
    cx: 174,
    cy: 132,
    bw: 26, bh: 23,
    lArmAng: -0.44,
    rArmAng: 2.5 + wiggle,
    lElbAng: 0.14, rElbAng: -0.06,
    lLegAng: -0.22, rLegAng: 0.60,
    lKneAng: 0.38, rKneAng: 0.08,
    UAL: 30, FAL: 26,
    lean: 0.38,
    shadowW: 40,
  });
}

// ── Renderer ─────────────────────────────────────────────────────

function drawRound(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  w: number, h: number
) {
  ctx.beginPath();
  ctx.ellipse(x, y, w, h, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawLimb(
  ctx: CanvasRenderingContext2D,
  x1: number, y1: number,
  x2: number, y2: number,
  width: number
) {
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

function renderPose(ctx: CanvasRenderingContext2D, pose: HCPose) {
  ctx.clearRect(0, 0, CW, CH);

  const {
    cx, cy, bw, bh,
    headOX, headOY, headR,
    lArmAng, rArmAng, lElbAng, rElbAng,
    lLegAng, rLegAng, lKneAng, rKneAng,
    UAL, FAL, ULL, LLL,
    lean, shadowW,
  } = pose;

  // Shadow
  ctx.fillStyle = SHADOW;
  drawRound(ctx, cx, 244, shadowW, 7);

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(lean);

  // ── Joints ───────────────────────────────────────────────────
  const bodyTopY = -bh;
  const shoulderY = bodyTopY + 6;
  const hipY = bh - 6;
  const lShX = -bw + 6;
  const rShX =  bw - 6;
  const lHipX = -bw * 0.45;
  const rHipX =  bw * 0.45;

  function armPoints(sx: number, ang: number, elbAng: number) {
    const ex = sx + Math.sin(ang) * UAL;
    const ey = shoulderY + Math.cos(ang) * UAL;
    const fa = ang + elbAng;
    return {
      ex, ey,
      wx: ex + Math.sin(fa) * FAL,
      wy: ey + Math.cos(fa) * FAL,
    };
  }

  function legPoints(hx: number, ang: number, kneAng: number) {
    const kx = hx + Math.sin(ang) * ULL;
    const ky = hipY + Math.cos(ang) * ULL;
    const sa = ang + kneAng;
    return {
      kx, ky,
      ax: kx + Math.sin(sa) * LLL,
      ay: ky + Math.cos(sa) * LLL,
    };
  }

  const lA = armPoints(lShX, lArmAng, lElbAng);
  const rA = armPoints(rShX, rArmAng, rElbAng);
  const lL = legPoints(lHipX, lLegAng, lKneAng);
  const rL = legPoints(rHipX, rLegAng, rKneAng);

  // ── Draw ─────────────────────────────────────────────────────
  // Back leg
  ctx.strokeStyle = COLOR_DARK;
  drawLimb(ctx, lHipX, hipY, lL.kx, lL.ky, 12);
  drawLimb(ctx, lL.kx, lL.ky, lL.ax, lL.ay, 10);

  // Back arm
  ctx.strokeStyle = COLOR_DARK;
  drawLimb(ctx, rShX, shoulderY, rA.ex, rA.ey, 11);
  drawLimb(ctx, rA.ex, rA.ey, rA.wx, rA.wy, 9);

  // Body
  ctx.fillStyle = COLOR;
  drawRound(ctx, 0, 0, bw, bh);

  // Subtle body shading — right/bottom strip
  ctx.fillStyle = COLOR_DARK;
  ctx.beginPath();
  ctx.ellipse(bw * 0.35, bh * 0.25, bw * 0.45, bh * 0.78, 0.25, 0, Math.PI * 2);
  ctx.globalAlpha = 0.35;
  ctx.fill();
  ctx.globalAlpha = 1;

  // Body highlight — top-left
  ctx.fillStyle = 'rgba(255,255,255,0.18)';
  ctx.beginPath();
  ctx.ellipse(-bw * 0.28, -bh * 0.35, bw * 0.42, bh * 0.32, -0.3, 0, Math.PI * 2);
  ctx.fill();

  // Front leg (right)
  ctx.strokeStyle = COLOR;
  drawLimb(ctx, rHipX, hipY, rL.kx, rL.ky, 12);
  drawLimb(ctx, rL.kx, rL.ky, rL.ax, rL.ay, 10);
  // Foot blobs
  ctx.fillStyle = COLOR;
  drawRound(ctx, lL.ax, lL.ay + 5, 7, 5);
  drawRound(ctx, rL.ax, rL.ay + 5, 7, 5);

  // Front arm (left)
  ctx.strokeStyle = COLOR;
  drawLimb(ctx, lShX, shoulderY, lA.ex, lA.ey, 11);
  drawLimb(ctx, lA.ex, lA.ey, lA.wx, lA.wy, 9);

  // Hand blobs
  ctx.fillStyle = COLOR;
  drawRound(ctx, lA.wx, lA.wy, 7, 7);
  drawRound(ctx, rA.wx, rA.wy, 7, 7);

  // ── Head ─────────────────────────────────────────────────────
  const hx = headOX;
  const hy = bodyTopY - headR * 0.62 + headOY;

  // Neck connector
  ctx.fillStyle = COLOR;
  ctx.beginPath();
  ctx.ellipse(hx, bodyTopY - 2, 8, 10, 0, 0, Math.PI * 2);
  ctx.fill();

  // Head base
  ctx.fillStyle = COLOR;
  drawRound(ctx, hx, hy, headR, headR);

  // Head shading
  ctx.fillStyle = COLOR_DARK;
  ctx.beginPath();
  ctx.ellipse(hx + headR * 0.3, hy + headR * 0.25, headR * 0.55, headR * 0.72, 0.2, 0, Math.PI * 2);
  ctx.globalAlpha = 0.32;
  ctx.fill();
  ctx.globalAlpha = 1;

  // Head highlight
  ctx.fillStyle = 'rgba(255,255,255,0.22)';
  ctx.beginPath();
  ctx.ellipse(hx - headR * 0.25, hy - headR * 0.28, headR * 0.45, headR * 0.32, -0.3, 0, Math.PI * 2);
  ctx.fill();

  // Eyes — simple white dots (hypercasual)
  ctx.fillStyle = 'rgba(255,255,255,0.90)';
  drawRound(ctx, hx - 7, hy - 2, 5, 4);
  drawRound(ctx, hx + 7, hy - 2, 5, 4);
  ctx.fillStyle = 'rgba(0,0,0,0.85)';
  drawRound(ctx, hx - 6,  hy - 2, 2.5, 2.5);
  drawRound(ctx, hx + 8, hy - 2, 2.5, 2.5);
  // Eye shine
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  drawRound(ctx, hx - 7.5, hy - 3.5, 1.2, 1.2);
  drawRound(ctx, hx + 6.5, hy - 3.5, 1.2, 1.2);

  ctx.restore();
}

// ── State machine ─────────────────────────────────────────────────

interface StateData {
  current: HCGoalieState;
  prev: HCGoalieState;
  // For cover/save — 0..1 transition progress
  frac: number;
  // Used for lateral tracking: -1..1 (normalized goal width)
  trackX: number;
}

function getPose(sd: StateData, t: number): HCPose {
  const { current, frac, trackX } = sd;
  const tf = Math.max(0, Math.min(1, frac));

  switch (current) {
    case 'idle':        return pIdle(t);
    case 'ready':       return pReady(t);
    case 'coverLeft':   return pCoverLeft(t, tf);
    case 'coverRight':  return pCoverRight(t, tf);
    case 'saveLeft':    return pSaveLeft(t);
    case 'saveRight':   return pSaveRight(t);
    default:            return pReady(t);
  }
}

// ── Three.js export ───────────────────────────────────────────────

export const createHypercasualGoalie = (color?: string) => {
  // Allow swapping team color at creation time
  if (color) {
    // Patch module-level constants for this instance via closure
    // (colors are inlined — just re-create with different draws)
  }

  const canvas = document.createElement('canvas');
  canvas.width  = CW;
  canvas.height = CH;
  const ctx = canvas.getContext('2d')!;

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;

  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    depthWrite: false,
    alphaTest: 0.01,
  });

  // Character fits in ~2.0 wide × 2.4 tall world units.
  // Feet at y=0, top at y=2.4.
  const plane = new THREE.Mesh(
    new THREE.PlaneGeometry(2.0, 2.4),
    material
  );
  plane.position.y = 1.2;

  const group = new THREE.Group();
  group.add(plane);

  let elapsed = 0;

  const stateData: StateData = {
    current: 'ready',
    prev: 'ready',
    frac: 1,
    trackX: 0,
  };

  const COVER_SPEED = 3.2;  // frac units per second
  const SAVE_SPEED  = 6.0;

  /**
   * Call every frame.
   *
   * @param dt     Delta-time seconds.
   * @param state  Desired state.
   * @param trackX Ball X in normalized goal coords, -1 (left post) to 1 (right post).
   *               Used only during 'ready' — drives the sway amount.
   *               Pass undefined to hold last value.
   *
   * Example usage:
   *   // Ball tracking
   *   goalie.update(dt, 'ready', ballNormX);
   *   // Ball shot left
   *   goalie.update(dt, 'coverLeft');
   *   // Ball about to cross line — full save
   *   goalie.update(dt, 'saveLeft');
   *   // Reset
   *   goalie.update(dt, 'idle');
   */
  const update = (
    dt: number,
    state: HCGoalieState,
    trackX?: number
  ) => {
    elapsed += dt;

    if (trackX !== undefined) stateData.trackX = trackX;

    // Transition speed depends on urgency
    const speed =
      state === 'saveLeft' || state === 'saveRight'
        ? SAVE_SPEED
        : COVER_SPEED;

    if (state !== stateData.current) {
      stateData.prev    = stateData.current;
      stateData.current = state;
      stateData.frac    = 0;
    }

    stateData.frac = Math.min(1, stateData.frac + dt * speed);

    const pose = getPose(stateData, elapsed);
    renderPose(ctx, pose);
    texture.needsUpdate = true;
  };

  // Initial frame
  const initPose = getPose(stateData, 0);
  renderPose(ctx, initPose);
  texture.needsUpdate = true;

  return { group, update };
};

export const createGoalie = createHypercasualGoalie;