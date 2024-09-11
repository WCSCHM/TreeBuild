import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { PCDLoader } from "three/examples/jsm/loaders/PCDLoader.js";
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

  const loader = new PCDLoader();
  let isLoaded = false;
  let pointcloud;
  let radius = 2;
  let octree;
  loader.load("resources/Zaghetto.pcd", (pcd) => {
    isLoaded = true;
    pointcloud = pcd;
    pcd.geometry.center();
    pcd.geometry.rotateX(Math.PI);
    pcd.geometry.scale(100, 100, 100);

    scene.add(pcd);

    octree = new Octree(pcd.geometry.boundingBox, radius, 0);
    console.time("build octree");
    octree.buildFromPointCloud(pcd);
    console.timeEnd("build octree");
  });

  const pointer = new THREE.Vector2();
  const raycaster = new THREE.Raycaster();
  const pointerIndicator = new THREE.Mesh(
    new THREE.SphereGeometry(radius),
    new THREE.MeshBasicMaterial({ color: "green", wireframe: true })
  );
  let sphere = new THREE.Sphere(pointerIndicator.position, radius);
  const geometry = new THREE.BufferGeometry();
  const material = new THREE.PointsMaterial({ color: "red", size: 0.2 });
  const selectedPts = new THREE.Points(geometry, material);

  scene.add(pointerIndicator);
  scene.add(selectedPts);

  function onPointerMove(event) {
    pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
    pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    if (isLoaded) {
      let intersects = raycaster.intersectObject(pointcloud, false);
      if (intersects.length > 0) {
        pointerIndicator.position.copy(intersects[0].point);
        sphere.center.copy(pointerIndicator.position);
        let found = octree.queryBySphere(sphere);
        let vertices = [];
        found.forEach((p) => {
          vertices.push(p.x, p.y, p.z);
        });
        geometry.setAttribute(
          "position",
          new THREE.Float32BufferAttribute(vertices, 3)
        );
      }
    }
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
  document.addEventListener("mousemove", onPointerMove);
};

main();
