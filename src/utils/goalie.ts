import * as THREE from 'three';

// ═══════════════════════════════════════════════════════════════
//  GOALIE.TS — High-Fidelity 2D Goalkeeper · Three.js Billboard
//  Pure Canvas 2D · No SVG · No external assets
// ═══════════════════════════════════════════════════════════════

const CW = 256;
const CH = 256;

// ─── Palette ─────────────────────────────────────────────────────
const P = {
  skin:        '#f4c08a',
  skinDark:    '#c87840',
  hair:        '#1c0f08',
  jersey:      '#f5a623',       // amber goalkeeper jersey
  jerseyDark:  '#b8741a',
  shorts:      '#0e1a30',       // deep navy
  shortsDark:  '#07101f',
  glove:       '#2ecc71',       // bright green
  gloveDark:   '#239a55',
  gloveStitch: '#1a7a40',
  boot:        '#111111',
  bootSole:    '#e8e8e8',
  bootLace:    '#f5a623',
  eyeWhite:    '#f5f5ee',
  iris:        '#1e3d8f',
  pupil:       '#05050f',
  brow:        '#1c0f08',
  mouth:       '#7a2e15',
  shinGuard:   '#cce0ff',
  shin:        '#e0b07a',
  shadow:      'rgba(0,0,0,0.22)',
} as const;

// ─── Types ───────────────────────────────────────────────────────
export type GoalieState = 'idle' | 'warmup' | 'ready' | 'anticipate' | 'diving';

// ─── Helpers ─────────────────────────────────────────────────────
const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;
const clamp = (v: number, lo: number, hi: number): number =>
  Math.max(lo, Math.min(hi, v));
const ease = (t: number): number =>
  t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

// ─── Drawing Primitives ──────────────────────────────────────────

function drawGlove(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r = 11
) {
  // Main glove
  ctx.fillStyle = P.glove;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();

  // Grip lines
  ctx.strokeStyle = P.gloveStitch;
  ctx.lineWidth = 1.2;
  for (let i = -1; i <= 1; i++) {
    ctx.beginPath();
    ctx.moveTo(x + i * 4, y - r * 0.55);
    ctx.lineTo(x + i * 4, y + r * 0.55);
    ctx.stroke();
  }

  // Wrist strap
  ctx.fillStyle = P.jerseyDark;
  ctx.fillRect(x - r * 0.7, y + r * 0.45, r * 1.4, r * 0.55);

  // Sheen
  ctx.fillStyle = 'rgba(255,255,255,0.28)';
  ctx.beginPath();
  ctx.ellipse(x - r * 0.25, y - r * 0.3, r * 0.45, r * 0.3, -0.3, 0, Math.PI * 2);
  ctx.fill();
}

function drawBoot(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  dir: 1 | -1   // 1 = toe right, -1 = toe left
) {
  ctx.save();
  ctx.translate(x, y);

  ctx.fillStyle = P.bootSole;
  ctx.beginPath();
  ctx.ellipse(dir * 6, 4, 14, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = P.boot;
  ctx.beginPath();
  ctx.moveTo(-dir * 8, 0);
  ctx.lineTo(dir * 14, 0);
  ctx.quadraticCurveTo(dir * 18, -2, dir * 16, -10);
  ctx.lineTo(dir * 2, -14);
  ctx.lineTo(-dir * 10, -12);
  ctx.lineTo(-dir * 10, 0);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = P.bootLace;
  ctx.lineWidth = 1.5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(dir * 4, -12);
  ctx.lineTo(dir * 12, -12);
  ctx.stroke();

  ctx.fillStyle = 'rgba(255,255,255,0.12)';
  ctx.beginPath();
  ctx.ellipse(dir * 8, -7, 5, 3, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawShin(
  ctx: CanvasRenderingContext2D,
  kx: number, ky: number,
  ax: number, ay: number,
  dir: 1 | -1
) {
  // Shin skin
  ctx.strokeStyle = P.shin;
  ctx.lineWidth = 13;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(kx, ky);
  ctx.lineTo(ax, ay);
  ctx.stroke();

  // Shin guard overlay
  const mx = kx + (ax - kx) * 0.2;
  const my = ky + (ay - ky) * 0.2;
  const ex = kx + (ax - kx) * 0.72;
  const ey = ky + (ay - ky) * 0.72;
  ctx.strokeStyle = P.shinGuard;
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.moveTo(mx, my);
  ctx.lineTo(ex, ey);
  ctx.stroke();

  drawBoot(ctx, ax, ay, dir);
}

function drawThigh(
  ctx: CanvasRenderingContext2D,
  hx: number, hy: number,
  kx: number, ky: number
) {
  ctx.strokeStyle = P.shorts;
  ctx.lineWidth = 17;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(hx, hy);
  ctx.lineTo(kx, ky);
  ctx.stroke();

  // Kneecap
  ctx.fillStyle = P.skin;
  ctx.strokeStyle = P.shinGuard;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(kx, ky, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
}

function drawUpperArm(
  ctx: CanvasRenderingContext2D,
  sx: number, sy: number,
  ex: number, ey: number
) {
  ctx.strokeStyle = P.jersey;
  ctx.lineWidth = 13;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(sx, sy);
  ctx.lineTo(ex, ey);
  ctx.stroke();

  // Shadow strip along underside
  const ox = (ey - sy) / 13;
  const oy = -(ex - sx) / 13;
  ctx.strokeStyle = P.jerseyDark;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(sx + ox, sy + oy);
  ctx.lineTo(ex + ox, ey + oy);
  ctx.stroke();
}

function drawForearm(
  ctx: CanvasRenderingContext2D,
  ex: number, ey: number,
  wx: number, wy: number
) {
  ctx.strokeStyle = P.jersey;
  ctx.lineWidth = 11;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(ex, ey);
  ctx.lineTo(wx, wy);
  ctx.stroke();
}

interface HeadExpr { brow: 'neutral' | 'focused' | 'intense'; }

function drawHead(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  expr: HeadExpr
) {
  const r = 24;

  // Neck
  ctx.fillStyle = P.skin;
  ctx.beginPath();
  ctx.ellipse(cx, cy + r - 2, 10, 13, 0, 0, Math.PI);
  ctx.fill();

  // Head base
  ctx.fillStyle = P.skin;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();

  // Radial shading
  const skinGrad = ctx.createRadialGradient(cx - 6, cy - 8, 4, cx, cy, r * 1.1);
  skinGrad.addColorStop(0, 'rgba(255,255,255,0)');
  skinGrad.addColorStop(1, 'rgba(120,60,10,0.28)');
  ctx.fillStyle = skinGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();

  // Cheek blush
  ctx.fillStyle = 'rgba(220,100,60,0.08)';
  for (const [bx, ba] of [[cx - 14, 0.3], [cx + 14, -0.3]] as [number, number][]) {
    ctx.beginPath();
    ctx.ellipse(bx, cy + 6, 8, 5.5, ba, 0, Math.PI * 2);
    ctx.fill();
  }

  // Hair (upper half)
  ctx.fillStyle = P.hair;
  ctx.beginPath();
  ctx.arc(cx, cy, r, Math.PI, 0);
  ctx.lineTo(cx + r * 0.55, cy - r * 0.04);
  ctx.quadraticCurveTo(cx, cy - r * 0.22, cx - r * 0.55, cy - r * 0.04);
  ctx.closePath();
  ctx.fill();

  // Hair sheen
  ctx.fillStyle = 'rgba(255,255,255,0.09)';
  ctx.beginPath();
  ctx.ellipse(cx - 5, cy - r * 0.55, 9, 5, -0.4, 0, Math.PI * 2);
  ctx.fill();

  // Ears
  for (const ex of [cx - r + 2, cx + r - 2]) {
    ctx.fillStyle = P.skin;
    ctx.strokeStyle = P.skinDark;
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.ellipse(ex, cy + 3, 5, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  // Eye whites
  const eyeY = cy + 3;
  const eyeOX = 9;
  for (const ex of [cx - eyeOX, cx + eyeOX]) {
    ctx.fillStyle = P.eyeWhite;
    ctx.beginPath();
    ctx.ellipse(ex, eyeY, 6.5, 5, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Irises + pupils + catchlight
  const lookX = expr.brow === 'intense' ? 1.5 : 0.5;
  for (const ex of [cx - eyeOX, cx + eyeOX]) {
    ctx.fillStyle = P.iris;
    ctx.beginPath();
    ctx.arc(ex + lookX, eyeY, 3.8, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = P.pupil;
    ctx.beginPath();
    ctx.arc(ex + lookX + 0.3, eyeY, 2.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.beginPath();
    ctx.arc(ex + lookX - 0.8, eyeY - 1.2, 1.3, 0, Math.PI * 2);
    ctx.fill();
  }

  // Upper eyelid lines
  ctx.strokeStyle = P.hair;
  ctx.lineWidth = 1.2;
  for (const ex of [cx - eyeOX, cx + eyeOX]) {
    ctx.beginPath();
    ctx.ellipse(ex, eyeY, 6.5, 5, 0, Math.PI, 0);
    ctx.stroke();
  }

  // Eyebrows
  ctx.strokeStyle = P.brow;
  ctx.lineWidth = 2.8;
  ctx.lineCap = 'round';
  if (expr.brow === 'intense') {
    ctx.beginPath(); ctx.moveTo(cx - eyeOX - 7, eyeY - 10); ctx.lineTo(cx - eyeOX + 5, eyeY - 7); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx + eyeOX + 7, eyeY - 10); ctx.lineTo(cx + eyeOX - 5, eyeY - 7); ctx.stroke();
  } else if (expr.brow === 'focused') {
    ctx.beginPath(); ctx.moveTo(cx - eyeOX - 7, eyeY - 9); ctx.lineTo(cx - eyeOX + 4, eyeY - 7.5); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx + eyeOX + 7, eyeY - 9); ctx.lineTo(cx + eyeOX - 4, eyeY - 7.5); ctx.stroke();
  } else {
    ctx.beginPath(); ctx.moveTo(cx - eyeOX - 6, eyeY - 9); ctx.lineTo(cx - eyeOX + 5, eyeY - 9); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx + eyeOX - 5, eyeY - 9); ctx.lineTo(cx + eyeOX + 6, eyeY - 9); ctx.stroke();
  }

  // Nose
  ctx.strokeStyle = P.skinDark;
  ctx.lineWidth = 1.5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(cx + 2, eyeY + 4);
  ctx.quadraticCurveTo(cx + 6, eyeY + 10, cx + 3, eyeY + 12);
  ctx.stroke();
  ctx.fillStyle = P.skinDark;
  ctx.beginPath(); ctx.arc(cx - 1, eyeY + 12, 1.5, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx + 5,  eyeY + 12, 1.5, 0, Math.PI * 2); ctx.fill();

  // Mouth
  ctx.strokeStyle = P.mouth;
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  if (expr.brow === 'intense') {
    ctx.beginPath(); ctx.moveTo(cx - 7, eyeY + 17); ctx.lineTo(cx + 7, eyeY + 17); ctx.stroke();
    ctx.strokeStyle = 'rgba(160,80,20,0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(cx - 10, eyeY + 20); ctx.quadraticCurveTo(cx, eyeY + 24, cx + 10, eyeY + 20); ctx.stroke();
  } else {
    ctx.beginPath(); ctx.moveTo(cx - 7, eyeY + 17); ctx.quadraticCurveTo(cx, eyeY + 19, cx + 7, eyeY + 17); ctx.stroke();
  }
}

// ─── Upright Pose ────────────────────────────────────────────────

interface UprightPose {
  headX: number;        // canvas center X
  headY: number;        // canvas center Y of head
  crouchFactor: number; // 0 = standing, 1 = deep crouch
  lArmAngle: number;    // radians from straight-down; negative = outward left
  rArmAngle: number;    // positive = outward right
  lElbowBend: number;   // added to arm angle at elbow
  rElbowBend: number;
  lLegAngle: number;    // negative = outward left
  rLegAngle: number;
  lKneeBend: number;
  rKneeBend: number;
  shadowW: number;
}

function drawUprightGoalie(ctx: CanvasRenderingContext2D, pose: UprightPose) {
  const { headX: cx, headY, crouchFactor } = pose;

  const headR = 24;
  const shoulderY = headY + headR + 11;
  const shoulderHW = lerp(40, 48, crouchFactor); // half-width

  const torsoH = lerp(65, 48, crouchFactor);
  const waistY = shoulderY + torsoH;
  const shortsH = lerp(20, 15, crouchFactor);
  const hipsY = waistY + shortsH;

  const thighLen = lerp(40, 28, crouchFactor * 0.5);
  const shinLen = 36;

  const lShX = cx - shoulderHW;
  const rShX = cx + shoulderHW;
  const lHipX = cx - lerp(16, 22, crouchFactor);
  const rHipX = cx + lerp(16, 22, crouchFactor);

  const UAL = 28, FAL = 26;

  function armJoints(sx: number, angle: number, elbowBend: number) {
    const ex = sx + Math.sin(angle) * UAL;
    const ey = shoulderY + Math.cos(angle) * UAL;
    const fa = angle + elbowBend;
    return {
      ex, ey,
      wx: ex + Math.sin(fa) * FAL,
      wy: ey + Math.cos(fa) * FAL,
    };
  }

  function legJoints(hx: number, legAngle: number, kneeBend: number) {
    const kx = hx + Math.sin(legAngle) * thighLen;
    const ky = hipsY + Math.cos(legAngle) * thighLen;
    const sa = legAngle + kneeBend;
    return {
      kx, ky,
      ax: kx + Math.sin(sa) * shinLen,
      ay: ky + Math.cos(sa) * shinLen,
    };
  }

  const lA = armJoints(lShX, pose.lArmAngle, pose.lElbowBend);
  const rA = armJoints(rShX, pose.rArmAngle, pose.rElbowBend);
  const lL = legJoints(lHipX, pose.lLegAngle, pose.lKneeBend);
  const rL = legJoints(rHipX, pose.rLegAngle, pose.rKneeBend);

  // Shadow
  ctx.fillStyle = P.shadow;
  ctx.beginPath();
  ctx.ellipse(cx, 248, pose.shadowW, 7, 0, 0, Math.PI * 2);
  ctx.fill();

  // ── Back leg (left)
  drawThigh(ctx, lHipX, hipsY, lL.kx, lL.ky);
  drawShin(ctx, lL.kx, lL.ky, lL.ax, lL.ay, -1);

  // ── Back arm (right) — drawn before torso
  drawUpperArm(ctx, rShX, shoulderY, rA.ex, rA.ey);
  drawForearm(ctx, rA.ex, rA.ey, rA.wx, rA.wy);
  drawGlove(ctx, rA.wx, rA.wy);

  // ── Jersey torso
  const waistHW = lerp(22, 28, crouchFactor);
  ctx.fillStyle = P.jersey;
  ctx.beginPath();
  ctx.moveTo(lShX - 4, shoulderY);
  ctx.lineTo(rShX + 4, shoulderY);
  ctx.quadraticCurveTo(rShX + 6, shoulderY + torsoH * 0.5, cx + waistHW, waistY);
  ctx.lineTo(cx - waistHW, waistY);
  ctx.quadraticCurveTo(lShX - 6, shoulderY + torsoH * 0.5, lShX - 4, shoulderY);
  ctx.closePath();
  ctx.fill();

  // Jersey right-side shadow
  ctx.fillStyle = P.jerseyDark;
  ctx.beginPath();
  ctx.moveTo(rShX, shoulderY + 4);
  ctx.quadraticCurveTo(rShX + 8, shoulderY + torsoH * 0.5, cx + waistHW - 2, waistY - 2);
  ctx.lineTo(cx + waistHW - 20, waistY - 2);
  ctx.quadraticCurveTo(rShX - 12, shoulderY + torsoH * 0.5, rShX - 12, shoulderY + 4);
  ctx.closePath();
  ctx.fill();

  // Chest highlight
  ctx.fillStyle = 'rgba(255,255,255,0.17)';
  ctx.beginPath();
  ctx.ellipse(cx - 6, shoulderY + torsoH * 0.3, 15, 10, -0.2, 0, Math.PI * 2);
  ctx.fill();

  // Jersey number "1"
  ctx.fillStyle = 'rgba(255,255,255,0.88)';
  ctx.font = `bold ${Math.round(torsoH * 0.38)}px monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('1', cx + 5, shoulderY + torsoH * 0.43);

  // ── Shorts
  ctx.fillStyle = P.shorts;
  ctx.beginPath();
  ctx.moveTo(cx - waistHW, waistY);
  ctx.lineTo(cx + waistHW, waistY);
  ctx.lineTo(rHipX + 4, hipsY);
  ctx.lineTo(lHipX - 4, hipsY);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = P.shortsDark;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(cx, waistY + 2);
  ctx.lineTo(cx, hipsY - 2);
  ctx.stroke();

  // Shoulder pad glints
  ctx.strokeStyle = 'rgba(255,255,255,0.22)';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  for (const [px, sign] of [[lShX, 1], [rShX, -1]] as [number, 1|-1][]) {
    ctx.beginPath();
    ctx.moveTo(px + sign * 4,  shoulderY - 1);
    ctx.lineTo(px + sign * 16, shoulderY - 1);
    ctx.stroke();
  }

  // ── Front leg (right)
  drawThigh(ctx, rHipX, hipsY, rL.kx, rL.ky);
  drawShin(ctx, rL.kx, rL.ky, rL.ax, rL.ay, 1);

  // ── Front arm (left)
  drawUpperArm(ctx, lShX, shoulderY, lA.ex, lA.ey);
  drawForearm(ctx, lA.ex, lA.ey, lA.wx, lA.wy);
  drawGlove(ctx, lA.wx, lA.wy);

  // ── Head
  const exprLevel =
    crouchFactor > 0.6 ? 'intense' :
    crouchFactor > 0.2 ? 'focused' : 'neutral';
  drawHead(ctx, cx, headY, { brow: exprLevel });
}

// ─── Dive Draw ───────────────────────────────────────────────────

function drawDiveGoalie(
  ctx: CanvasRenderingContext2D,
  dir: 'left' | 'right',
  t: number
) {
  const s: 1 | -1 = dir === 'right' ? 1 : -1;
  const p = ease(clamp(t, 0, 1));

  // Ground shadow (pre-transform)
  ctx.fillStyle = P.shadow;
  ctx.beginPath();
  ctx.ellipse(128 + s * p * 55, 248, lerp(32, 60, p), 7, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.save();
  ctx.translate(128 + s * p * 60, 128 - Math.sin(p * Math.PI) * 45);
  ctx.rotate(s * p * 1.15);

  // Local origin = torso center
  const TT = -24; // torso top
  const TB =  24; // torso bottom
  const SY = TT + 10; // shoulder Y

  // Lead side joints (direction of dive)
  const leadAX = s * 26;
  const leadE = { x: leadAX + s * 28, y: SY - 6 };
  const leadW = { x: leadAX + s * 54, y: SY - 10 };

  // Trail side joints
  const trailAX = -s * 26;
  const trailE = { x: trailAX - s * 18, y: SY + 12 };
  const trailW = { x: trailAX - s * 34, y: SY + 22 };

  // Lead leg — bent (upper)
  const llH = { x: s * 14, y: TB + 6 };
  const llK = { x: s * 32, y: TB + 38 };
  const llA = { x: s * 18, y: TB + 68 };

  // Trail leg — extended (lower)
  const tlH = { x: -s * 14, y: TB + 6 };
  const tlK = { x: -s * 40, y: TB + 20 };
  const tlA = { x: -s * 68, y: TB + 14 };

  // ── Draw order: trail elements → torso → lead elements → head

  // Trail leg
  drawThigh(ctx, tlH.x, tlH.y, tlK.x, tlK.y);
  drawShin(ctx, tlK.x, tlK.y, tlA.x, tlA.y, s === 1 ? -1 : 1);

  // Trail arm
  drawUpperArm(ctx, trailAX, SY, trailE.x, trailE.y);
  drawForearm(ctx, trailE.x, trailE.y, trailW.x, trailW.y);
  drawGlove(ctx, trailW.x, trailW.y, 10);

  // Torso
  ctx.fillStyle = P.jersey;
  ctx.beginPath();
  ctx.moveTo(-30, TT); ctx.lineTo(30, TT);
  ctx.quadraticCurveTo(35, 0, 28, TB);
  ctx.lineTo(-28, TB);
  ctx.quadraticCurveTo(-35, 0, -30, TT);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = P.jerseyDark;
  ctx.beginPath();
  ctx.moveTo(16, TT + 2);
  ctx.quadraticCurveTo(34, 0, 28, TB - 5);
  ctx.lineTo(8, TB - 5);
  ctx.quadraticCurveTo(16, 0, 16, TT + 2);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = 'rgba(255,255,255,0.88)';
  ctx.font = 'bold 18px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('1', 0, 1);

  // Shorts
  ctx.fillStyle = P.shorts;
  ctx.beginPath();
  ctx.moveTo(-22, TB - 4); ctx.lineTo(22, TB - 4);
  ctx.lineTo(tlH.x + 4, tlH.y + 2);
  ctx.lineTo(llH.x - 4, llH.y + 2);
  ctx.closePath();
  ctx.fill();

  // Lead leg (on top)
  drawThigh(ctx, llH.x, llH.y, llK.x, llK.y);
  drawShin(ctx, llK.x, llK.y, llA.x, llA.y, s);

  // Lead arm (on top) — larger glove = more eye-catching
  drawUpperArm(ctx, leadAX, SY, leadE.x, leadE.y);
  drawForearm(ctx, leadE.x, leadE.y, leadW.x, leadW.y);
  drawGlove(ctx, leadW.x, leadW.y, 14);

  // Neck connector
  ctx.fillStyle = P.skin;
  ctx.beginPath();
  ctx.ellipse(s * 20, TT - 4, 9, 13, s * 0.5, 0, Math.PI * 2);
  ctx.fill();

  // Head
  drawHead(ctx, s * 36, TT - 22, { brow: 'intense' });

  ctx.restore();
}

// ─── Pose Generators ─────────────────────────────────────────────

function poseIdle(t: number): UprightPose {
  const breath = Math.sin(t * 1.4) * 0.03;
  const bob    = Math.sin(t * 1.4) * 2.2;
  const sway   = Math.sin(t * 0.7) * 1.5;
  return {
    headX: 128 + sway * 0.35,
    headY: 32 + bob,
    crouchFactor: 0.04 + breath,
    lArmAngle: -0.42 + Math.sin(t * 1.1) * 0.03,
    rArmAngle:  0.42 - Math.sin(t * 1.1) * 0.03,
    lElbowBend:  0.15, rElbowBend: -0.15,
    lLegAngle: -0.07, rLegAngle: 0.07,
    lKneeBend: 0.04,  rKneeBend: 0.04,
    shadowW: 38,
  };
}

function poseWarmup(t: number): UprightPose {
  const phase = Math.floor(t / 1.8) % 4;
  const pt    = (t % 1.8) / 1.8;

  let headX = 128, headY = 32, crouchFactor = 0.08;
  let lArmAngle = -0.42, rArmAngle = 0.42;
  let lElbowBend = 0.15, rElbowBend = -0.15;
  let lLegAngle = -0.07, rLegAngle = 0.07;
  let lKneeBend = 0.04,  rKneeBend = 0.04;
  let shadowW = 40;

  if (phase === 0) {
    // Bounce
    const b = Math.pow(Math.abs(Math.sin(t * Math.PI * 2.8)), 0.7);
    headY = 32 - b * 18;
    crouchFactor = lerp(0.45, 0.02, b);
    lKneeBend = rKneeBend = lerp(0.52, 0.04, b);
    lArmAngle = -0.55 - b * 0.45;
    rArmAngle =  0.55 + b * 0.45;
    shadowW = lerp(38, 50, b);
  } else if (phase === 1) {
    // Arm circles
    const ca = pt * Math.PI * 2;
    lArmAngle = -(Math.PI / 2) + Math.cos(ca) * 1.3;
    rArmAngle =  (Math.PI / 2) + Math.cos(ca + Math.PI) * 1.3;
    lElbowBend =  0.15 + Math.sin(ca) * 0.38;
    rElbowBend = -0.15 - Math.sin(ca) * 0.38;
    crouchFactor = 0.12;
    shadowW = 44;
  } else if (phase === 2) {
    // Shuffle left
    const st = Math.sin(pt * Math.PI * 2);
    headX = lerp(128, 106, ease(pt));
    lLegAngle = -0.18 - st * 0.28;
    rLegAngle =  0.08 - st * 0.1;
    lKneeBend = 0.15 + st * 0.22;
    lArmAngle = -0.72;
    rArmAngle =  0.38;
    shadowW = 46;
  } else {
    // Shuffle right (return)
    const st = Math.sin(pt * Math.PI * 2);
    headX = lerp(106, 128, ease(pt));
    lLegAngle = -0.10 + st * 0.1;
    rLegAngle =  0.18 + st * 0.28;
    rKneeBend = 0.15 + st * 0.22;
    lArmAngle = -0.38;
    rArmAngle =  0.72;
    shadowW = 46;
  }

  return {
    headX, headY, crouchFactor,
    lArmAngle, rArmAngle, lElbowBend, rElbowBend,
    lLegAngle, rLegAngle, lKneeBend, rKneeBend,
    shadowW,
  };
}

function poseReady(t: number): UprightPose {
  const sway = Math.sin(t * 2.4) * 5;
  const bob  = Math.abs(Math.sin(t * 2.4)) * 2.5;
  return {
    headX: 128 + sway * 0.25,
    headY: 38 + bob,
    crouchFactor: 0.58,
    lArmAngle: -1.38 + sway * 0.014,
    rArmAngle:  1.38 + sway * 0.014,
    lElbowBend:  0.28, rElbowBend: -0.28,
    lLegAngle: -0.34, rLegAngle: 0.34,
    lKneeBend: 0.36,  rKneeBend: 0.36,
    shadowW: 64,
  };
}

function poseAnticipate(t: number): UprightPose {
  const sway = Math.sin(t * 4.0) * 9;
  const bob  = Math.abs(Math.sin(t * 4.0)) * 3;
  return {
    headX: 128 + sway * 0.5,
    headY: 42 + bob,
    crouchFactor: 0.78,
    lArmAngle: -1.5 + sway * 0.018,
    rArmAngle:  1.5 + sway * 0.018,
    lElbowBend:  0.38, rElbowBend: -0.38,
    lLegAngle: -0.42, rLegAngle: 0.42,
    lKneeBend: 0.48,  rKneeBend: 0.48,
    shadowW: 72,
  };
}

// ─── Render ───────────────────────────────────────────────────────

function render(
  ctx: CanvasRenderingContext2D,
  state: GoalieState,
  time: number,
  diveDir: 'left' | 'right',
  diveT: number
) {
  ctx.clearRect(0, 0, CW, CH);

  if (state === 'diving') {
    drawDiveGoalie(ctx, diveDir, diveT);
    return;
  }

  const pose =
    state === 'warmup'     ? poseWarmup(time)    :
    state === 'ready'      ? poseReady(time)      :
    state === 'anticipate' ? poseAnticipate(time) :
    poseIdle(time);

  drawUprightGoalie(ctx, pose);
}

// ─── Three.js Export ─────────────────────────────────────────────

export const createGoalie = () => {
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

  // 1.8 × 2.2 scene units → real goalkeeper scale.
  // plane.position.y = 1.1 so the feet land exactly at y = 0.
  const plane = new THREE.Mesh(
    new THREE.PlaneGeometry(1.8, 2.2),
    material
  );
  plane.position.y = 1.1;

  const group = new THREE.Group();
  group.add(plane);

  let elapsed  = 0;
  let diveDir: 'left' | 'right' = 'left';
  let diveT    = 0;
  const DIVE_DUR = 0.55; // seconds for full arc

  /**
   * Call once per frame inside your Three.js animation loop.
   * @param dt           Delta-time in seconds.
   * @param state        Current animation state.
   * @param diveDirOverride  Pass 'left'|'right' on the first frame of a dive.
   */
  const update = (
    dt: number,
    state: GoalieState,
    diveDirOverride?: 'left' | 'right'
  ) => {
    elapsed += dt;

    if (state === 'diving') {
      if (diveDirOverride) diveDir = diveDirOverride;
      diveT = Math.min(diveT + dt / DIVE_DUR, 1);
    } else {
      diveT = 0; // reset so next dive starts fresh
    }

    render(ctx, state, elapsed, diveDir, diveT);
    texture.needsUpdate = true;
  };

  // First frame so the canvas isn't blank before the loop starts
  render(ctx, 'idle', 0, 'left', 0);
  texture.needsUpdate = true;

  return { group, update };
};