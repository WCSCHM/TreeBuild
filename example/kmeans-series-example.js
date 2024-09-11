import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { PCDLoader } from "three/examples/jsm/loaders/PCDLoader.js";
import {
  loadData,
  kMeans,
  bikMeans,
  DBSCAN,
  connectedComponent,
} from "../lib/Cluster";
import {
  randomRangeLinear,
  disturbedCurveNode,
  drawLine,
  lookAt,
} from "../utilities";
import { Octree } from "../lib/Octree";

const main = () => {
  const canvas = document.querySelector("#c");
  const renderer = new THREE.WebGLRenderer({ canvas: canvas });

  const scene = new THREE.Scene();

  const fov = 45;
  const aspect = 2;
  const near = 0.1;
  const far = 10000;
  const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
  camera.position.set(10, 10, 10);
  camera.lookAt(0, 0, 0);

  {
    const color = 0xffffff;
    const intensity = 1;
    const light = new THREE.AmbientLight(color, intensity);
    scene.add(light);
  }

  const controls = new OrbitControls(camera, canvas);
  controls.target.set(0, 0, 0);
  controls.update();

  scene.add(new THREE.AxesHelper(1000));

  const loader = new PCDLoader();
  loader.load("resources/urban3d/off-ground points-3.pcd", (pcd) => {
    pcd.geometry.center(); // Center the geometry based on the bounding box.
    pcd.geometry.rotateX(-Math.PI / 2);
    pcd.geometry.scale(10, 10, 10);

    let data = loadData(pcd);

    /* kmeans */
    // console.time("kmeans");
    // let { centroids } = kMeans(data, 13, "euclidean", "random", scene);
    // console.timeEnd("kmeans");
    // console.log(centroids.length / 3);

    /* kmeans++ */
    // console.time("kmeans++");
    // let { centroids } = kMeans(data, 13, "euclidean", "kmeans++", scene);
    // console.timeEnd("kmeans++");
    // console.log(centroids.length / 3);

    /* bikmeans */
    console.time("bikmeans++");
    let clusters = bikMeans(data, 8, "euclidean", "kmeans++", scene);
    console.timeEnd("bikmeans++");
    console.log(clusters.length);

    lookAt(pcd, camera, controls);
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
};

main();
