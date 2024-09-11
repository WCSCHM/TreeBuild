import * as THREE from "three";
// import WebGPU from "three/examples/jsm/capabilities/WebGPU.js";
// import WebGPURenderer from "three/examples/jsm/renderers/webgpu/WebGPURenderer.js";
import { MapControls } from "three/examples/jsm/controls/MapControls.js";
import { CSM } from "three/examples/jsm/csm/CSM.js";
import { CSMHelper } from "three/examples/jsm/csm/CSMHelper.js";
import { GUI } from "three/examples/jsm/libs/lil-gui.module.min.js";
import { TreeBuilder } from "../TreeBuilder";
import { CustomizeTree } from "../CustomizeTree";
import { InstancedLOD } from "../lib/InstancedLOD";
import { LeafGeometry } from "../leaf_flower_fruit/LeafGeometry";
import { FlowerGeometry } from "../leaf_flower_fruit/FlowerGeometry";
import { Terrain } from "../lib/Terrain";
import { Octree } from "../lib/Octree";
import { GUIController } from "../lib/GUIController";
import { toSeePoint } from "../utilities";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import Stats from "three/examples/jsm/libs/stats.module.js";
import { FlowerBuilder } from "../FlowerBuilder";

function main() {
  // if (WebGPU.isAvailable() === false) {
  //   document.body.appendChild(WebGPU.getErrorMessage());
  //   throw new Error("No WebGPU support");
  // }
  const canvas = document.querySelector("#c");
  const stats = new Stats();
  document.body.appendChild(stats.domElement);
  const renderer = new THREE.WebGLRenderer({ canvas });
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();

  const fov = 45;
  const aspect = 2;
  const near = 0.1;
  const far = 4000;
  const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
  camera.position.set(0, 200, 200);
  camera.lookAt(0, 0, 0);
  // const camerahelper = new THREE.CameraHelper(camera);
  // scene.add(camerahelper);
  // const another_camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
  // another_camera.position.set(400, 400, 0);
  // another_camera.lookAt(0, 0, 0);

  // const controls = new OrbitControls(camera, renderer.domElement);
  const controls = new MapControls(camera, renderer.domElement);
  controls.minDistance = 100;
  controls.maxDistance = 1000;
  // controls.enableDamping = true;

  const guiController = new GUIController(camera);

  const amLight = new THREE.AmbientLight(0xffffff, 0.2);
  scene.add(amLight);

  const csm = new CSM({
    maxFar: 1000,
    cascades: 3,
    mode: "practical",
    parent: scene,
    shadowMapSize: 512,
    lightDirection: new THREE.Vector3(-1, -1, -1).normalize(),
    lightColor: new THREE.Color(0x000020),
    lightIntensity: 0.5,
    camera: camera,
  });

  const textureLoader = new THREE.TextureLoader();

  function TREE_DETAILS(treebuilder, treeObj, dist0, dist1) {
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
    let material = new THREE.MeshBasicMaterial({
      map: texture,
      side: THREE.DoubleSide,
      color: 0xb3b3b3,
      // transparent: true,
      alphaTest: 0.9,
    });
    let lod1 = new THREE.Mesh(geometry, material);

    let details = {
      id: treeObj.name,
      array: [
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
      ],
    };
    return details;
  }

  const planeSize = 30000;
  const vertexNumber = 1600;

  // const axesHelper = new THREE.AxesHelper(1000);
  // scene.add(axesHelper);
  const terrain = new Terrain(planeSize, planeSize, vertexNumber, vertexNumber);
  const vertices = terrain.setImprovedNoise(0.3);

  const customizeTree = new CustomizeTree();
  const treebuilder = new TreeBuilder();

  let l = vertices.array.length / 3;
  const y_axis = new THREE.Vector3(0, 1, 0);
  let position = new THREE.Vector3();
  let quaterion = new THREE.Quaternion();
  let scale = new THREE.Vector3();
  let idx_x, size;

  const boundary = terrain.getBoundingBox();
  const octree = new Octree(boundary, 5, 0);
  const instancedlod = new InstancedLOD(scene, camera);
  instancedlod.setOctree(octree);

  const species = Array.from(customizeTree.indices.keys());
  species.forEach((name, index) => {
    let treeObj = customizeTree.getTree(name);
    let details = TREE_DETAILS(treebuilder, treeObj, 400, 2000);

    let total = 100000;
    if (index === 0) total = 150000;
    else if (index === 2) total = 50000;
    instancedlod.setLevels(details, total);

    let cnt = 0;
    while (cnt < total) {
      let x, y, z;
      idx_x = 3 * Math.floor(Math.random() * l);
      x = vertices.array[idx_x];
      y = vertices.array[idx_x + 1];
      z = vertices.array[idx_x + 2];

      if (index != 0 && index != 2) size = Math.random() + 2;
      else size = Math.random() + 0.5;
      scale.set(size, size, size);
      position.set(x, y, z);
      quaterion.setFromAxisAngle(y_axis, Math.random() * Math.PI * 2);
      octree.insert(
        details.id,
        new THREE.Matrix4().compose(position, quaterion, scale),
      );
      cnt++;
    }
  });

  //-----------------------------------------------------------------------------
  // SKY BOX
  {
    const skyboxLoader = new THREE.CubeTextureLoader();
    const skyboxTexture = skyboxLoader.load([
      "resources/images/sky box/right.jpg",
      "resources/images/sky box/left.jpg",
      "resources/images/sky box/top.jpg",
      "resources/images/sky box/bottom.jpg",
      "resources/images/sky box/front.jpg",
      "resources/images/sky box/back.jpg",
    ]);
    scene.background = skyboxTexture;
  }

  //-----------------------------------------------------------------------------
  // TERRAIN
  terrain.loadTexture(
    "resources/images/terrain/terrain_base.png",
    "resources/images/terrain/terrain_normal.png",
  );
  csm.setupMaterial(terrain.planeMaterial);
  const terrainMesh = terrain.getMesh();
  terrainMesh.castShadow = true;
  terrainMesh.receiveShadow = true;
  scene.add(terrainMesh);

  //-----------------------------------------------------------------------------
  // GRASS & FLOWER

  {
    let position = new THREE.Vector3();
    let quaterion = new THREE.Quaternion();
    let scale = new THREE.Vector3();

    function GRASS_FLOWER_DETAIL(flowerType, dist0, dist1) {
      let grass_texture = textureLoader.load("resources/images/grass.png");
      let flower_texture = textureLoader.load(
        `resources/images/${flowerType}/flower_base.png`,
      );
      let grass_geometry = new LeafGeometry("cross", 3, 3).generate();
      let flower_geometry = new FlowerGeometry()
        .generate()
        .scale(0.3, 0.3, 0.3)
        .translate(0, 1.5, 0);

      let grass_material = new THREE.MeshBasicMaterial({
        map: grass_texture,
        side: THREE.DoubleSide,
        color: 0x646464,
        alphaTest: 0.1,
      });
      let flower_material = new THREE.MeshBasicMaterial({
        map: flower_texture,
        side: THREE.DoubleSide,
        color: 0x646464,
        alphaTest: 0.1,
      });
      let grass_lod0 = new THREE.Mesh(grass_geometry, grass_material);
      let flower_lod0 = new THREE.Mesh(flower_geometry, flower_material);
      let lod0 = new THREE.Group().add(grass_lod0);
      if (flowerType != "none") lod0.add(flower_lod0);

      let details = {
        id: flowerType,
        array: [
          {
            group: lod0,
            level: "l0",
            distance: dist0,
          },
          {
            group: new THREE.Group(), // empty group
            level: "l1",
            distance: dist1,
          },
        ],
      };
      return details;
    }

    let flowerTypes = ["none", "dingxiang", "8leng"];
    flowerTypes.forEach((f) => {
      let details = GRASS_FLOWER_DETAIL(f, 400, 2000);
      let total = 300000;
      instancedlod.setLevels(details, total);

      let cnt = 0;
      while (cnt < total) {
        let x, y, z;
        let idx_x = 3 * Math.floor(Math.random() * l);
        x = vertices.array[idx_x];
        y = vertices.array[idx_x + 1];
        z = vertices.array[idx_x + 2];
        let size = Math.random() * 2 + 2;
        scale.set(size, size, size);
        position.set(x, y, z);
        quaterion.setFromAxisAngle(y_axis, Math.random() * Math.PI * 2);
        octree.insert(
          details.id,
          new THREE.Matrix4().compose(position, quaterion, scale),
        );
        cnt++;
      }
    });
  }

  //-----------------------------------------------------------------------------
  // WANDERER
  const keypoints = [
    new THREE.Vector3(700, 500, 0),
    new THREE.Vector3(700, 200, 0),
    new THREE.Vector3(200, 140, 0),
  ];
  const curve = new THREE.CatmullRomCurve3(keypoints);
  const points = curve.getPoints(500);
  let cnt = 0;

  function resizeRendererToDisplaySize(renderer) {
    const canvas = renderer.domElement;
    const pixelRatio = window.devicePixelRatio;
    const width = (canvas.clientWidth * pixelRatio) | 0;
    const height = (canvas.clientHeight * pixelRatio) | 0;
    // const width = canvas.clientWidth | 0;
    // const height = canvas.clientHeight | 0;
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
    if (cnt < points.length) camera.position.copy(points[cnt++]);
    controls.update();

    instancedlod.render();

    csm.update();
    stats.update();
    renderer.render(scene, camera);
  }

  function animate() {
    requestAnimationFrame(animate);
    render();
  }
  animate();
}

main();
