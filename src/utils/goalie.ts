import * as THREE from 'three';

export type GoalieState = 'idle' | 'ready' | 'coverLeft' | 'coverRight' | 'saveLeft' | 'saveRight';

export const createGoalie = () => {
  const color = '#ff1111';
  const group = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.3, metalness: 0.1, emissive: '#ff0000', emissiveIntensity: 0.2 });

  // Head
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.3, 32, 32), mat);
  head.position.y = 1.6;
  head.castShadow = true;
  group.add(head);

  // Eyes
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0x111111 });
  const eyeGeo = new THREE.SphereGeometry(0.05, 16, 16);
  [-0.1, 0.1].forEach(x => {
    const eye = new THREE.Mesh(eyeGeo, eyeMat);
    eye.position.set(x, 1.65, 0.25);
    group.add(eye);
  });

  // Torso
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.2, 0.5, 4, 16), mat);
  torso.position.y = 1.05;
  torso.castShadow = true;
  group.add(torso);

  // Arms
  const makeArm = (sx: number) => {
    const pivot = new THREE.Group();
    pivot.position.set(sx * 0.3, 1.25, 0);
    const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.08, 0.35, 4, 16), mat);
    arm.position.y = -0.175;
    arm.castShadow = true;
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 16), mat);
    hand.position.y = -0.4;
    pivot.add(arm, hand);
    group.add(pivot);
    return pivot;
  };

  // Legs
  const makeLeg = (sx: number) => {
    const pivot = new THREE.Group();
    pivot.position.set(sx * 0.15, 0.7, 0);
    const leg = new THREE.Mesh(new THREE.CapsuleGeometry(0.1, 0.4, 4, 16), mat);
    leg.position.y = -0.2;
    leg.castShadow = true;
    const foot = new THREE.Mesh(new THREE.CapsuleGeometry(0.1, 0.15, 4, 16), mat);
    foot.position.set(0, -0.45, 0.05);
    foot.rotation.x = Math.PI / 2;
    foot.castShadow = true;
    pivot.add(leg, foot);
    group.add(pivot);
    return pivot;
  };

  const leftArm  = makeArm(-1);
  const rightArm = makeArm(1);
  const leftLeg  = makeLeg(-1);
  const rightLeg = makeLeg(1);

  group.position.y = -0.1;

  // ── Animation ────────────────────────────────────────────────
  let elapsed = 0;
  let state: GoalieState = 'ready';

  // Current pose state for lerping
  const current = {
    lArmX: 0, lArmY: 0, lArmZ: Math.PI / 2.5,
    rArmX: 0, rArmY: 0, rArmZ: -Math.PI / 2.5,
    lLegX: 0, lLegY: 0, lLegZ: Math.PI / 6,
    rLegX: 0, rLegY: 0, rLegZ: -Math.PI / 6,
    torsoX: 0,
    posY: -0.1
  };

  const POSES: Record<GoalieState, any> = {
    idle: {
      lArmX: 0, lArmY: 0, lArmZ: 0.3,
      rArmX: 0, rArmY: 0, rArmZ: -0.3,
      lLegX: 0, lLegY: 0, lLegZ: 0.1,
      rLegX: 0, rLegY: 0, rLegZ: -0.1,
      torsoX: 0, posY: -0.1
    },
    ready: {
      lArmX: -0.1, lArmY: 0, lArmZ: 1.5, // Horizontal spread (Reference match)
      rArmX: -0.1, rArmY: 0, rArmZ: -1.5,
      lLegX: 0.8, lLegY: -0.2, lLegZ: 0.4, // Deep, wide squat
      rLegX: 0.8, rLegY: 0.2, rLegZ: -0.4,
      torsoX: 0.25, // Professional forward lean
      posY: -0.4    // Balanced center of gravity
    },
    coverLeft: {
      lArmX: -0.1, lArmY: 0, lArmZ: 1.6,
      rArmX: -0.1, rArmY: 0, rArmZ: -0.4,
      lLegX: 0.4, lLegY: -0.1, lLegZ: 0.5,
      rLegX: 0.4, rLegY: 0.1, rLegZ: -0.2,
      torsoX: 0.1, posY: -0.2
    },
    coverRight: {
      lArmX: -0.1, lArmY: 0, lArmZ: 0.4,
      rArmX: -0.1, rArmY: 0, rArmZ: -1.6,
      lLegX: 0.4, lLegY: -0.1, lLegZ: 0.2,
      rLegX: 0.4, rLegY: 0.1, rLegZ: -0.5,
      torsoX: 0.1, posY: -0.2
    },
    saveLeft: {
      lArmX: 0, lArmY: 0, lArmZ: 2.0,
      rArmX: 0, rArmY: 0, rArmZ: -0.2,
      lLegX: 0, lLegY: 0, lLegZ: 0.7,
      rLegX: 0, rLegY: 0, rLegZ: -0.15,
      torsoX: 0, posY: 0
    },
    saveRight: {
      lArmX: 0, lArmY: 0, lArmZ: 0.2,
      rArmX: 0, rArmY: 0, rArmZ: -2.0,
      lLegX: 0, lLegY: 0, lLegZ: 0.15,
      rLegX: 0, rLegY: 0, rLegZ: -0.7,
      torsoX: 0, posY: 0
    },
  };

  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

  const update = (dt: number, nextState: GoalieState) => {
    elapsed += dt;
    state = nextState;

    const speed = (state === 'saveLeft' || state === 'saveRight') ? 12 : 6;
    const t = Math.min(dt * speed, 1);
    const pose = POSES[state];

    // Lerp toward target pose
    current.lArmX = lerp(current.lArmX, pose.lArmX, t);
    current.lArmY = lerp(current.lArmY, pose.lArmY, t);
    current.lArmZ = lerp(current.lArmZ, pose.lArmZ, t);
    current.rArmX = lerp(current.rArmX, pose.rArmX, t);
    current.rArmY = lerp(current.rArmY, pose.rArmY, t);
    current.rArmZ = lerp(current.rArmZ, pose.rArmZ, t);
    current.lLegX = lerp(current.lLegX, pose.lLegX, t);
    current.lLegY = lerp(current.lLegY, pose.lLegY, t);
    current.lLegZ = lerp(current.lLegZ, pose.lLegZ, t);
    current.rLegX = lerp(current.rLegX, pose.rLegX, t);
    current.rLegY = lerp(current.rLegY, pose.rLegY, t);
    current.rLegZ = lerp(current.rLegZ, pose.rLegZ, t);
    current.torsoX = lerp(current.torsoX, pose.torsoX, t);
    current.posY = lerp(current.posY, pose.posY, t);

    leftArm.rotation.set(current.lArmX, current.lArmY, current.lArmZ);
    rightArm.rotation.set(current.rArmX, current.rArmY, current.rArmZ);
    leftLeg.rotation.set(current.lLegX, current.lLegY, current.lLegZ);
    rightLeg.rotation.set(current.rLegX, current.rLegY, current.rLegZ);
    torso.rotation.x = current.torsoX;
    group.position.y = current.posY;

    // Side-to-side shuffle logic
    if (state === 'idle' || state === 'ready') {
      const shuffleDist = state === 'ready' ? 1.6 : 1.2;
      const shuffleFreq = state === 'ready' ? 2.5 : 2; // Calibrated simple speed
      group.position.x = Math.sin(elapsed * shuffleFreq) * shuffleDist;
      
      // Add subtle bobbing while shuffling
      group.position.y += Math.abs(Math.cos(elapsed * shuffleFreq * 2)) * 0.04;
      
      // Look towards center or ball (simplified look-at) + lean into movement
      group.rotation.y = -group.position.x * 0.1;
      group.rotation.z = -Math.cos(elapsed * shuffleFreq) * 0.05; // Subtler lean
    }
  };

  return { group, head, torso, leftArm, rightArm, leftLeg, rightLeg, update };
};