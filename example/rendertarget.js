import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GUI } from "three/examples/jsm/libs/lil-gui.module.min.js";
import { TreeBuilder } from "../TreeBuilder";
import { CustomizeTree } from "../CustomizeTree";
import { drawLine, drawPoints, lookAt } from "../utilities";

async function main() {
  const canvas = document.querySelector("#c");
  const renderer = new THREE.WebGLRenderer({ canvas: canvas });
  renderer.shadowMap.enabled = true;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xffffff);

  const fov = 45;
  const aspect = 2;
  const near = 0.1;
  const far = 10000;
  const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
  camera.position.set(200, 70, 0);

  const controls = new OrbitControls(camera, canvas);
  controls.target.set(0, 10, 0);
  controls.update();

  const amLight = new THREE.AmbientLight(0xffffff, 0.1);
  scene.add(amLight);
  const dirlight = new THREE.DirectionalLight(0xffffff, 0.5);
  dirlight.position.set(5, 15, 5);
  dirlight.castShadow = true;
  dirlight.shadow.camera.top = 20;
  dirlight.shadow.camera.right = 20;
  dirlight.shadow.camera.bottom = -20;
  dirlight.shadow.camera.left = -20;
  dirlight.shadow.camera.near = 1;
  dirlight.shadow.camera.far = 100;
  scene.add(dirlight);

  const axesHelper = new THREE.AxesHelper(5);
  // scene.add(axesHelper);

  const planeSize = 20;
  const plainGeometry = new THREE.PlaneGeometry(planeSize, planeSize, 10, 10);
  plainGeometry.rotateX(-Math.PI / 2);
  const plain = new THREE.Mesh(
    plainGeometry,
    new THREE.MeshLambertMaterial({
      // color: "white",
      side: THREE.DoubleSide,
    })
  );
  // plain.castShadow = true;
  plain.receiveShadow = true;
  // scene.add(plain);

  const builder = new TreeBuilder();

  const buildInstancedMeshGroup = function (singleTree, matrices) {
    const instancedMeshGroup = new THREE.Group();
    const instancedMeshes = [];
    // singleTree is a THREE.Group
    singleTree.children.forEach((child) => {
      instancedMeshes.push(
        new THREE.InstancedMesh(child.geometry, child.material, matrices.length)
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
  let singleTree = builder.buildTree(skeleton);
  singleTree.children.forEach((child) => {
    child.castShadow = true;
    child.receiveShadow = true;
  });
  scene.add(singleTree);
  lookAt(singleTree, camera, controls);
  console.log(singleTree);

  function buildtree(species) {
    scene.remove(singleTree);
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

  function capture() {
    // 图像不随屏幕拉伸改变
    if (resizeRendererToDisplaySize(renderer)) {
      const canvas = renderer.domElement;
      camera.aspect = canvas.clientWidth / canvas.clientHeight;
      camera.updateProjectionMatrix();
    }
    renderer.render(scene, camera);
    const imageURL = renderer.domElement.toDataURL("image/png");
    var anchor = document.createElement("a");
    anchor.href = imageURL;
    anchor.download = "preview.png";
    anchor.click();
  }

  function animate() {
    requestAnimationFrame(animate);
    render();
  }

  setTimeout(() => {
    capture();
  }, 2000);
  // animate();
}

main();
