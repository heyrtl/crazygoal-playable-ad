import * as THREE from 'three';

export type GoalieState = 'idle' | 'ready' | 'coverLeft' | 'coverRight' | 'saveLeft' | 'saveRight';

export const createGoalie = () => {
  const color = '#e74c3c';
  const group = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.4, metalness: 0.1 });

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

  // Target rotations
  const target = {
    lArmZ:  Math.PI / 4,
    rArmZ: -Math.PI / 4,
    lLegZ:  Math.PI / 8,
    rLegZ: -Math.PI / 8,
    groupX: 0,
  };

  const POSES: Record<GoalieState, typeof target> = {
    idle: {
      lArmZ:  0.3,  rArmZ: -0.3,
      lLegZ:  0.1,  rLegZ: -0.1,
      groupX: 0,
    },
    ready: {
      lArmZ:  Math.PI / 4,  rArmZ: -Math.PI / 4,
      lLegZ:  Math.PI / 8,  rLegZ: -Math.PI / 8,
      groupX: 0,
    },
    coverLeft: {
      lArmZ:  1.4,  rArmZ: -0.3,
      lLegZ:  0.5,  rLegZ: -0.2,
      groupX: 0,
    },
    coverRight: {
      lArmZ:  0.3,  rArmZ: -1.4,
      lLegZ:  0.2,  rLegZ: -0.5,
      groupX: 0,
    },
    saveLeft: {
      lArmZ:  2.0,  rArmZ: -0.2,
      lLegZ:  0.7,  rLegZ: -0.15,
      groupX: 0,
    },
    saveRight: {
      lArmZ:  0.2,  rArmZ: -2.0,
      lLegZ:  0.15, rLegZ: -0.7,
      groupX: 0,
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
    target.lArmZ = lerp(target.lArmZ, pose.lArmZ, t);
    target.rArmZ = lerp(target.rArmZ, pose.rArmZ, t);
    target.lLegZ = lerp(target.lLegZ, pose.lLegZ, t);
    target.rLegZ = lerp(target.rLegZ, pose.rLegZ, t);

    leftArm.rotation.z  = target.lArmZ;
    rightArm.rotation.z = target.rArmZ;
    leftLeg.rotation.z  = target.lLegZ;
    rightLeg.rotation.z = target.rLegZ;

    // Idle bob
    if (state === 'idle' || state === 'ready') {
      group.position.y = -0.1 + Math.sin(elapsed * 2.5) * 0.04;
    }
  };

  return { group, head, torso, leftArm, rightArm, leftLeg, rightLeg, update };
};