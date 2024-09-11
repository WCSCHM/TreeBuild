import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { CSM } from "three/examples/jsm/csm/CSM.js";
import { CSMHelper } from "three/examples/jsm/csm/CSMHelper.js";
import { GUI } from "three/examples/jsm/libs/lil-gui.module.min.js";
import { TreeBuilder } from "../TreeBuilder";
import { getTrees } from "../AxiosApi";
import { CustomizeTree } from "../CustomizeTree";
import { drawLine, drawPoints, lookAt } from "../utilities";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils";
import { LeafGeometry } from "../leaf_flower_fruit/LeafGeometry";
import { InstancedLOD } from "../lib/InstancedLOD";

let renderer, scene, camera, orthoCamera, controls, csm, csmHelper;

const params = {
  orthographic: false,
  fade: false,
  far: 1000,
  mode: "practical",
  lightX: -1,
  lightY: -1,
  lightZ: -1,
  margin: 100,
  lightFar: 5000,
  lightNear: 1,
  autoUpdateHelper: true,
  updateHelper: function () {
    csmHelper.update();
  },
};
scene = new THREE.Scene();
scene.background = new THREE.Color("#454e61");
camera = new THREE.PerspectiveCamera(
  70,
  window.innerWidth / window.innerHeight,
  0.1,
  5000
);
orthoCamera = new THREE.OrthographicCamera();

const canvas = document.querySelector("#c");
renderer = new THREE.WebGLRenderer({ antialias: true, canvas: canvas });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

controls = new OrbitControls(camera, renderer.domElement);
controls.maxPolarAngle = Math.PI / 2;
camera.position.set(60, 60, 0);
controls.target = new THREE.Vector3(-100, 10, 0);
controls.update();

const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
scene.add(ambientLight);

csm = new CSM({
  maxFar: params.far,
  cascades: 5,
  mode: params.mode,
  parent: scene,
  shadowMapSize: 1024,
  lightDirection: new THREE.Vector3(
    params.lightX,
    params.lightY,
    params.lightZ
  ).normalize(),
  lightColor: new THREE.Color(0x000020),
  lightIntensity: 0.2,
  camera: camera,
});

const floorMaterial = new THREE.MeshPhongMaterial({ color: 0xffffff });
csm.setupMaterial(floorMaterial);

const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(10000, 10000, 8, 8),
  floorMaterial
);
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
scene.add(floor);

const textureLoader = new THREE.TextureLoader();

function 原神启动(treebuilder, treeObj, dist0, dist1) {
  treebuilder.clearMesh();
  treebuilder.init(treeObj);
  let lod0 = treebuilder.buildTree(treebuilder.buildSkeleton());
  let texture = textureLoader.load(`${treeObj.path}texture.png`);
  let box = new THREE.Box3().setFromObject(lod0);
  let boxSize = box.getSize(new THREE.Vector3());
  let size = Math.max(...boxSize.toArray());

  let geometry = new LeafGeometry("cross", 1, 1)
    .generate()
    .scale(size, size, size);

  let material = new THREE.MeshLambertMaterial({
    map: texture,
    side: THREE.DoubleSide,
    // transparent: true,
    alphaTest: 0.5,
  });
  let lod1 = new THREE.Mesh(geometry, material);

  let details = [
    {
      group: lod0,
      level: "l0",
      distance: dist0,
    },
    {
      group: new THREE.Group().add(lod1),
      level: "l1",
      distance: dist1,
    },
  ];
  return details;
}

const customizeTree = new CustomizeTree();
const treeBuilder = new TreeBuilder();

const instancedLODs = [];
customizeTree.content.forEach((treeObj) => {
  let details = 原神启动(treeBuilder, treeObj, 700, 2000);
  let instancedlod = new InstancedLOD(scene, camera, treeObj.name);
  let total = 100;
  instancedlod.setLevels(details);
  instancedlod.setPopulation(total);
  for (let i = 0; i < total; i++) {
    let x = Math.random() * 4000 - 2000;
    let y = 0;
    let z = Math.random() * 4000 - 2000;
    instancedlod.setTransform(i, new THREE.Matrix4().makeTranslation(x, y, z));
  }
  instancedLODs.push(instancedlod);
});

function resizeRendererToDisplaySize(renderer) {
  const canvas = renderer.domElement;
  const pixelRatio = window.devicePixelRatio;
  const width = (canvas.clientWidth * pixelRatio) | 0;
  const height = (canvas.clientHeight * pixelRatio) | 0;
  const needResize = canvas.width !== width || canvas.height !== height;
  if (needResize) {
    renderer.setSize(width, height, false);
  }
  return needResize;
}

function render() {
  // 图像不随屏幕拉伸改变
  if (resizeRendererToDisplaySize(renderer)) {
    const canvas = renderer.domElement;
    camera.aspect = canvas.clientWidth / canvas.clientHeight;
    camera.updateProjectionMatrix();
  }
  instancedLODs.forEach((instance) => {
    instance.render();
  });
  csm.update();
  controls.update();
  renderer.render(scene, camera);
}

function animate() {
  requestAnimationFrame(animate);
  render();
}

animate();
