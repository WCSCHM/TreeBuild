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

async function main() {
  const canvas = document.querySelector("#c");
  const renderer = new THREE.WebGLRenderer({ canvas: canvas });
  renderer.shadowMap.enabled = true;

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

  const scene = new THREE.Scene();
  // scene.background = new THREE.Color(0xcccccc);
  scene.background = new THREE.Color(0xffffff);
  const fov = 45;
  const aspect = 2;
  const near = 0.1;
  const far = 10000;
  const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
  camera.position.set(100, 70, 0);

  const controls = new OrbitControls(camera, canvas);
  controls.target.set(0, 10, 0);
  controls.update();

  const amLight = new THREE.AmbientLight(0xffffff, 0.1);
  scene.add(amLight);

  const csm = new CSM({
    maxFar: params.far,
    cascades: 4,
    mode: params.mode,
    parent: scene,
    shadowMapSize: 2048,
    lightDirection: new THREE.Vector3(
      params.lightX,
      params.lightY,
      params.lightZ,
    ).normalize(),
    lightColor: new THREE.Color(0x000020),
    lightIntensity: 0.5,
    camera: camera,
  });

  const axesHelper = new THREE.AxesHelper(5);
  // scene.add(axesHelper);

  const planeSize = 50;
  const plainGeometry = new THREE.PlaneGeometry(planeSize, planeSize, 10, 10);
  plainGeometry.rotateX(-Math.PI / 2);
  const planeMaterial = new THREE.MeshPhongMaterial({
    color: "white",
    side: THREE.DoubleSide,
  });
  const plain = new THREE.Mesh(plainGeometry, planeMaterial);
  csm.setupMaterial(planeMaterial);
  plain.receiveShadow = true;
  // scene.add(plain);

  const builder = new TreeBuilder();

  const buildInstancedMeshGroup = function (singleTree, matrices) {
    const instancedMeshGroup = new THREE.Group();
    const instancedMeshes = [];
    // singleTree is a THREE.Group
    singleTree.children.forEach((child) => {
      instancedMeshes.push(
        new THREE.InstancedMesh(
          child.geometry,
          child.material,
          matrices.length,
        ),
      );
    });
    matrices.forEach((matrix, index) => {
      instancedMeshes.forEach((instancedMesh) => {
        instancedMesh.setMatrixAt(index, new THREE.Matrix4().fromArray(matrix));
      });
    });
    instancedMeshGroup.add(...instancedMeshes);
    return instancedMeshGroup;
  };

  const customizeTree = new CustomizeTree();
  let treeObj = customizeTree.getTree("普通乔木");

  builder.init(treeObj, true, "y-axis");
  let skeleton = builder.buildSkeleton();

  // skeleton line
  // const curve = new THREE.Group();
  // const pointGroup = new THREE.Group();
  // drawLine(skeleton.children[0], curve, pointGroup);
  // scene.add(curve);
  // scene.add(pointGroup);

  let lod1;
  let singleTree = builder.buildTree(skeleton);
  singleTree.children.forEach((child) => {
    child.castShadow = true;
  });
  scene.add(singleTree);
  lookAt(singleTree, camera, controls);
  console.log(singleTree);

  function buildtree(species) {
    scene.remove(singleTree);
    scene.remove(lod1);
    builder.clearMesh();
    treeObj = customizeTree.getTree(species);
    builder.init(treeObj, true);
    skeleton = builder.buildSkeleton();
    singleTree = builder.buildTree(skeleton);
    singleTree.children.forEach((child) => {
      child.castShadow = true;
    });
    scene.add(singleTree);
    console.log(singleTree);
    let loader = new THREE.TextureLoader();
    let texture1 = loader.load(`${treeObj.path}texture.png`);
    texture1.colorSpace = THREE.SRGBColorSpace;
    let geometry = new LeafGeometry("cross", 10, 10).generate();
    let material = new THREE.MeshBasicMaterial({
      map: texture1,
      side: THREE.DoubleSide,
      alphaTest: 0.5,
    });
    lod1 = new THREE.Mesh(geometry, material);
    lod1.position.set(20, 0, 0);
    lod1.castShadow = true;
    scene.add(lod1);
  }

  const species = Array.from(customizeTree.indices.keys());
  const guiobj = {
    普通乔木: function () {
      buildtree(species[0]);
    },
    桂花: function () {
      buildtree(species[1]);
    },
    国槐: function () {
      buildtree(species[2]);
    },
    木芙蓉: function () {
      buildtree(species[3]);
    },
    八棱海棠: function () {
      buildtree(species[4]);
    },
    红枫: function () {
      buildtree(species[5]);
    },
    桃树: function () {
      buildtree(species[6]);
    },
    垂丝海棠: function () {
      buildtree(species[7]);
    },
    丁香: function () {
      buildtree(species[8]);
    },
    // 香樟: function () {
    //   buildtree(species[9]);
    // },
    凤凰木: function () {
      buildtree(species[9]);
    },
    水杉: function () {
      buildtree(species[10]);
    },
    落叶松: function () {
      buildtree(species[11]);
    },
    // 海棠: function () {
    //   buildtree(species[11]);
    // },
    // 红果冬青: function () {
    //   buildtree(species[12]);
    // },
  };
  const gui = new GUI();
  const tree_selector = gui.addFolder("tree");
  species.forEach((s) => {
    tree_selector.add(guiobj, s);
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
    csm.update();
    renderer.render(scene, camera);
  }

  function animate() {
    requestAnimationFrame(animate);
    render();
  }
  animate();
}

main();
