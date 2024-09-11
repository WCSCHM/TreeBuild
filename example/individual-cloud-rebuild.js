import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { PCDLoader } from "three/examples/jsm/loaders/PCDLoader.js";
import { GUI } from "three/examples/jsm/libs/lil-gui.module.min.js";
import { TreeBuilder } from "../TreeBuilder";
import { CustomizeTree } from "../CustomizeTree";
import { drawLine, lookAt } from "../utilities";
import { kMeans, loadData } from "../lib/Cluster";

async function main() {
  const canvas = document.querySelector("#c");
  const renderer = new THREE.WebGLRenderer({ canvas: canvas });
  // renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.setClearColor(0xffffff, 1.0);

  const scene = new THREE.Scene();

  const fov = 45;
  const aspect = 2;
  const near = 0.1;
  const far = 10000;
  const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
  camera.position.set(100, 70, 0);

  const controls = new OrbitControls(camera, canvas);
  controls.target.set(0, 10, 0);
  controls.update();

  const color = 0xffffff;
  const intensity = 1;
  const amLight = new THREE.AmbientLight(color, intensity);
  scene.add(amLight);

  const planeSize = 16000;

  const axesHelper = new THREE.AxesHelper(1000);
  scene.add(axesHelper);

  const plainGeometry = new THREE.PlaneGeometry(planeSize, planeSize, 10, 10);
  plainGeometry.rotateX(-Math.PI / 2);
  const plain = new THREE.Mesh(
    plainGeometry,
    new THREE.MeshLambertMaterial({
      wireframe: true,
      color: "black",
    })
  );

  // scene.add(plain);
  const treeObj = new CustomizeTree().getTree("普通乔木");
  const builder = new TreeBuilder(treeObj, true, scene);
  const loader = new PCDLoader();
  loader.load(`resources/urban3d/individualpoint.pcd`, (pcd) => {
    pcd.material.size = 0.3;
    pcd.geometry.rotateX(-Math.PI / 2);
    pcd.geometry.translate(0, 0, 0);
    scene.add(pcd);
    lookAt(pcd, camera, controls);
    const data = loadData(pcd);
    const skeleton = builder.buildKmeansSkeleton(data, 32);

    const line = new THREE.Group();
    const pointGroup = new THREE.Group();
    drawLine(skeleton.children[0], line, pointGroup);
    scene.add(line);
    scene.add(pointGroup);

    // const tree = builder.buildTree(skeleton);
    // tree.position.set(20, 0, 0);
    // scene.add(tree);
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
    renderer.render(scene, camera);
  }

  function animate() {
    requestAnimationFrame(animate);
    render();
  }
  animate();
}

main();
