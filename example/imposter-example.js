import * as THREE from "three";

import Stats from "three/examples/jsm/libs/stats.module.js";
import { GUI } from "three/examples/jsm/libs/lil-gui.module.min.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";

import { Impostor } from "three/examples/jsm/objects/Impostor.js";

let camera, scene, raycaster, renderer, controls, stats;

const cars = [];
const impostors = [];
const carsNumber = 700;
const sceneWidth = 400;

init();
animate();

function init() {
  // basic setup

  camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    sceneWidth * 10,
  );
  camera.position.set(15, 5, 15);

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf0f0f0);
  scene.fog = new THREE.Fog(
    new THREE.Color(0xf0f0f0),
    sceneWidth / 4,
    sceneWidth,
  );

  const canvas = document.querySelector("#c");

  renderer = new THREE.WebGLRenderer({ antialias: true, canvas });
  renderer.setSize(window.innerWidth, window.innerHeight);

  controls = new OrbitControls(camera, renderer.domElement);

  stats = new Stats();
  document.body.appendChild(stats.dom);

  window.addEventListener("resize", onWindowResize);

  // lights

  const hemLight = new THREE.HemisphereLight(0xffffbb, 0x080820, 1);
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
  directionalLight.position.set(-1, 1.75, -1);

  scene.add(hemLight, directionalLight);

  // we will need to pass the list of lights to the impostors
  const lights = [hemLight, directionalLight];

  // ground plane

  const groundGeometry = new THREE.PlaneGeometry(
    sceneWidth * 2,
    sceneWidth * 2,
  );
  const groundMaterial = new THREE.MeshStandardMaterial({ color: "grey" });
  const groundMesh = new THREE.Mesh(groundGeometry, groundMaterial);
  groundMesh.rotation.x = -Math.PI / 2;
  scene.add(groundMesh);

  // cars and impostors setup

  const dracoLoader = new DRACOLoader().setDecoderPath("resources/gltf/");
  const loader = new GLTFLoader().setDRACOLoader(dracoLoader);

  loader.load("resources/models/ferrari.glb", (gltf) => {
    for (let i = 0; i < carsNumber; i++) {
      const car = gltf.scene.clone();

      car.position.set(
        Math.random() * sceneWidth * 2 - sceneWidth,
        0,
        Math.random() * sceneWidth * 2 - sceneWidth,
      );

      car.rotation.y = -Math.PI / 2;
      car.direction = Math.random() * 0.1 + 0.15;

      scene.add(car);
      cars.push(car);

      /* IMPOSTOR CODE */

      const impostor = new Impostor(car, camera, renderer, scene);

      impostors.push(impostor);

      // impostor options

      impostor.lights = lights;

      impostor.impostureDistance = 90;

      impostor.setSize(128);

      impostor.maxAngle = 0.3;
    }
  });

  // interactive GUI

  const normalMaterial = new THREE.MeshNormalMaterial();

  const params = {
    enable: true,
    show: false,
    dist: 90,
  };

  const gui = new GUI();

  gui
    .add(params, "enable")
    .name("enable impostors")
    .onChange((bool) => {
      if (bool) {
        impostors.forEach((impostor) => (impostor.enabled = true));
      } else {
        impostors.forEach((impostor) => (impostor.enabled = false));
      }
    });

  gui
    .add(params, "show")
    .name("show impostors")
    .onChange((bool) => {
      if (bool) {
        impostors.forEach((impostor) => {
          impostor.userData.oldMaterial = impostor.material;
          impostor.material = normalMaterial;
        });
      } else {
        impostors.forEach((impostor) => {
          impostor.material = impostor.userData.oldMaterial;
        });
      }
    });

  gui
    .add(params, "dist", 20, 500)
    .step(1)
    .name("min distance")
    .onChange((val) => {
      impostors.forEach((impostor) => {
        impostor.impostureDistance = val;
      });
    });
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
  requestAnimationFrame(animate, renderer.domElement);

  cars.forEach((car) => {
    car.position.x += car.direction;

    if (car.position.x > sceneWidth) {
      car.position.x = -sceneWidth;
    }
  });

  Impostor.updateAll();
  renderer.render(scene, camera);
  stats.update();
}
