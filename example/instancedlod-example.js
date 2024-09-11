import * as THREE from "three";
import { FlyControls } from "three/examples/jsm/controls/FlyControls.js";
import { InstancedLOD } from "../lib/InstancedLOD";

let camera, scene, renderer, controls;
let instancedlod;
const clock = new THREE.Clock();

init();
animate();

function init() {
  camera = new THREE.PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    1,
    15000
  );
  camera.position.z = 1000;

  scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x000000, 1, 15000);

  const pointLight = new THREE.PointLight(0xff2200);
  pointLight.position.set(0, 0, 0);
  scene.add(pointLight);

  const dirLight = new THREE.DirectionalLight(0xffffff);
  dirLight.position.set(0, 0, 1).normalize();
  scene.add(dirLight);

  const geometry = [
    [new THREE.IcosahedronGeometry(40, 16), 200],
    [new THREE.IcosahedronGeometry(40, 8), 500],
    [new THREE.IcosahedronGeometry(40, 4), 1000],
    [new THREE.IcosahedronGeometry(40, 2), 2000],
    [new THREE.IcosahedronGeometry(40, 1), 8000],
  ];

  const material = new THREE.MeshLambertMaterial({
    color: 0xffffff,
    wireframe: true,
  });
  const total = 10000;

  /* InstancedLOD */
  instancedlod = new InstancedLOD(scene, camera, "test");
  const detail = [];
  for (let i = 0; i < geometry.length; i++) {
    detail.push({
      group: new THREE.Group().add(new THREE.Mesh(geometry[i][0], material)),
      level: `l${i}`,
      distance: geometry[i][1],
    });
  }

  instancedlod.setLevels(detail);
  instancedlod.setPopulation(total);
  for (let i = 0; i < total; i++) {
    let position = new THREE.Vector3(
      10000 * (0.5 - Math.random()),
      7500 * (0.5 - Math.random()),
      10000 * (0.5 - Math.random())
    );
    instancedlod.setTransform(i, new THREE.Matrix4().setPosition(position));
  }

  /* THREE.LOD */
  // for (let j = 0; j < total; j++) {
  //   const lod = new THREE.LOD();

  //   for (let i = 0; i < geometry.length; i++) {
  //     const mesh = new THREE.Mesh(geometry[i][0], material);
  //     mesh.updateMatrix();
  //     mesh.matrixAutoUpdate = false;
  //     lod.addLevel(mesh, geometry[i][1]);
  //   }

  //   lod.position.x = 10000 * (0.5 - Math.random());
  //   lod.position.y = 7500 * (0.5 - Math.random());
  //   lod.position.z = 10000 * (0.5 - Math.random());
  //   lod.updateMatrix();
  //   lod.matrixAutoUpdate = false;
  //   scene.add(lod);
  // }

  /* THREE.InstancedMesh */
  // const instancedMesh = new THREE.InstancedMesh(
  //   geometry[2][0],
  //   material,
  //   total
  // );
  // for (let i = 0; i < total; i++) {
  //   let position = new THREE.Vector3(
  //     10000 * (0.5 - Math.random()),
  //     7500 * (0.5 - Math.random()),
  //     10000 * (0.5 - Math.random())
  //   );
  //   instancedMesh.setMatrixAt(i, new THREE.Matrix4().setPosition(position));
  // }
  // scene.add(instancedMesh);

  const canvas = document.querySelector("#c");
  renderer = new THREE.WebGLRenderer({ antialias: true, canvas });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0xffffff, 1.0);

  //

  controls = new FlyControls(camera, renderer.domElement);
  controls.movementSpeed = 1000;
  controls.rollSpeed = Math.PI / 10;

  //

  window.addEventListener("resize", onWindowResize);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
  requestAnimationFrame(animate);
  render();
}

function render() {
  controls.update(clock.getDelta());
  instancedlod.render();
  renderer.render(scene, camera);
}
