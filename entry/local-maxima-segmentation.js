import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { PCDLoader } from "three/examples/jsm/loaders/PCDLoader.js";
import { CustomizeTree } from "../CustomizeTree";
import { clusterByCentroids, loadData } from "../lib/Cluster";
import { createTree } from "../AxiosApi";
import { drawLine, lookAt } from "../utilities";
import { TreeBuilder } from "../TreeBuilder";

const main = async () => {
  const canvas = document.querySelector("#c");
  const renderer = new THREE.WebGLRenderer({ canvas: canvas });
  // renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.setClearColor(0xffffff, 1.0);

  const scene = new THREE.Scene();

  const fov = 45;
  const aspect = 2;
  const near = 0.1;
  const far = 50000;
  const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
  camera.position.set(1000, 1000, 1000);
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

  const prefix = "/resources/urban3d/cambridge_block_3/";
  const ids = [0, 1, 2, 3, 4, 5];

  const request = [];

  const worker_number = 10;
  const tasks = new Array(worker_number);
  for (let i = 0; i < worker_number; i++) tasks[i] = [];

  const load_json = async (url) => {
    let data = await fetch(url).then((res) => res.json());
    return data;
  };

  for (let i = 0; i < ids.length; i++) {
    let id = ids[i];
    const loader = new PCDLoader();
    const local_maxima_points = await load_json(
      `${prefix}local_maxima_points/local_maxima_points_${id}.json`,
    );

    loader.load(`${prefix}CC/CC${id}.pcd`, (pcd) => {
      // scene.add(pcd);
      lookAt(pcd, camera, controls);

      const data = loadData(pcd);
      console.time("clustering");
      const clusters = clusterByCentroids(data, local_maxima_points);
      console.timeEnd("clustering");
      let each_worker_task_number = Math.ceil(clusters.size / worker_number);
      let cluster_array = [...clusters.values()];
      cluster_array.forEach((cluster, idx) => {
        let i_th = Math.floor(idx / each_worker_task_number);
        tasks[i_th].push(cluster);
      });
      // console.log(tasks);
      // console.log(clusters);

      // 展示极值点
      {
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute(
          "position",
          new THREE.BufferAttribute(
            new Float32Array(local_maxima_points.flat()),
            3,
          ),
        );
        const material = new THREE.PointsMaterial({
          color: "black",
          size: 5,
          sizeAttenuation: false,
        });
        const p = new THREE.Points(geometry, material);

        scene.add(p);
      }

      // 展示分割点云
      clusters.forEach((v) => {
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute(
          "position",
          new THREE.BufferAttribute(new Float32Array(v), 3),
        );
        let r = Math.floor(Math.random() * 256);
        let g = Math.floor(Math.random() * 256);
        let b = Math.floor(Math.random() * 256);
        const material = new THREE.PointsMaterial({
          color: `rgb(${r},${g},${b})`,
          // size: 1,
          sizeAttenuation: false,
        });
        const p = new THREE.Points(geometry, material);

        scene.add(p);
      });
    });
  }

  const customizeTree = new CustomizeTree();
  const treeObj = customizeTree.getTree("普通乔木");
  const builder = new TreeBuilder();
  builder.init(treeObj, true);

  // worker重建树木
  let left = worker_number;
  for (let i = 0; i < worker_number; i++) {
    const worker = new Worker(new URL("./worker.js", import.meta.url), {
      type: "module",
    });
    worker.onmessage = (event) => {
      const skeletons = event.data;
      const matrixArr = new THREE.Matrix4().elements;
      skeletons.forEach((skeleton) => {
        // createTree(skeleton, false, matrixArr, []);
        // const rootLine = new THREE.Group();
        // if (skeleton.children.length > 0)
        //   drawLine(skeleton.children[0], rootLine);
        // scene.add(rootLine);
        singleTree = builder.buildTree(skeleton);
        scene.add(singleTree);
      });
      worker.terminate();
      console.log(`tasks of worker ${i} is done`);
      left--;
      if (left === 0) console.log(`all clear!`);
    };
    worker.postMessage({ input: tasks[i] });
  }

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
