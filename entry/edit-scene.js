import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { GUI } from "three/examples/jsm/libs/lil-gui.module.min.js";
import { TreeBuilder } from "../TreeBuilder";
import { CustomizeTree } from "../CustomizeTree";
import { randomRangeLinear } from "../utilities";
import { getTrees, createTree } from "../AxiosApi";

const buildInstancedMeshGroup = function (singleTree, matricesArr) {
  const instancedMeshGroup = new THREE.Group();
  const instancedMeshes = [];
  // singleTree is a THREE.Group
  singleTree.children.forEach((child) => {
    instancedMeshes.push(
      new THREE.InstancedMesh(
        child.geometry,
        child.material,
        matricesArr.length
      )
    );
  });
  matricesArr.forEach((matrixArr, index) => {
    instancedMeshes.forEach((instancedMesh) => {
      instancedMesh.setMatrixAt(
        index,
        new THREE.Matrix4().fromArray(matrixArr)
      );
    });
  });
  instancedMeshGroup.add(...instancedMeshes);
  return instancedMeshGroup;
};

const main = async () => {
  const canvas = document.querySelector("#c");
  const renderer = new THREE.WebGLRenderer({ canvas: canvas });
  renderer.setClearColor(0xffffff, 1.0);

  /* 基本场景 */
  const scene = new THREE.Scene();

  const fov = 45;
  const aspect = 2;
  const near = 0.1;
  const far = 5000;
  const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
  camera.position.set(50, 50, 50);
  camera.lookAt(0, 10, 0);

  {
    const color = 0xffffff;
    const intensity = 1;
    const light = new THREE.AmbientLight(color, intensity);
    scene.add(light);
    const dirlight = new THREE.DirectionalLight(color, intensity);
    dirlight.position.set(0, 100, 0);
    scene.add(dirlight);
  }

  const controls = new OrbitControls(camera, canvas);
  controls.target.set(0, 10, 0);
  controls.update();

  const size = 2000;
  const segment = 400;
  const unit = size / segment;
  const circle_radius = 5;

  scene.add(new THREE.AxesHelper(size));

  // const gridHelper = new THREE.GridHelper(size, segment);
  // scene.add(gridHelper);

  const geometry = new THREE.PlaneGeometry(size, size);
  geometry.rotateX(-Math.PI / 2);
  const plane = new THREE.Mesh(
    geometry,
    new THREE.MeshBasicMaterial({ visible: false })
  );
  scene.add(plane);

  const loader = new GLTFLoader();
  loader.load("resources/upload/model3.glb", (glb) => {
    scene.add(glb.scene);
  });

  const customizeTree = new CustomizeTree();
  let treeObj = customizeTree.getTree("普通乔木");
  const builder = new TreeBuilder(treeObj, true);

  // fetch("resources/upload/hkusts.json")
  //   .then((response) => response.json())
  //   .then((jsonarray) => {
  //     jsonarray.forEach((tree) => {
  //       tree.skeleton = JSON.parse(tree.skeleton);
  //       builder.init(tree.skeleton.treeObj, true);
  //       let singleTree = builder.buildTree(tree.skeleton);
  //       if (!singleTree) return;

  //       if (tree.isInstanced) {
  //         let instancedTree = buildInstancedMeshGroup(
  //           singleTree,
  //           tree.matrices
  //         );
  //         scene.add(instancedTree);
  //       } else {
  //         singleTree.applyMatrix4(new THREE.Matrix4().fromArray(tree.matrix));
  //         scene.add(singleTree);
  //       }
  //       builder.clearMesh();
  //     });
  //   });

  console.time("fetch database");
  const trees = await getTrees();
  console.log(trees);
  trees.forEach((tree) => {
    builder.init(tree.skeleton.treeObj, true);
    let singleTree = builder.buildTree(tree.skeleton);
    if (!singleTree) return;

    if (tree.isInstanced) {
      let instancedTree = buildInstancedMeshGroup(singleTree, tree.matrices);
      scene.add(instancedTree);
    } else {
      singleTree.applyMatrix4(new THREE.Matrix4().fromArray(tree.matrix));
      scene.add(singleTree);
    }
    builder.clearMesh();
  });
  console.timeEnd("fetch database");

  /* 系统全局变量 */
  const raycaster = new THREE.Raycaster();
  let pointer = new THREE.Vector2();
  let points = [];
  let cells = [];
  const cellgeo = new THREE.SphereGeometry(unit / 2);
  const cellmat = new THREE.MeshBasicMaterial({
    color: "red",
    transparent: true,
    opacity: 0.5,
  });
  const cellmesh = new THREE.Mesh(cellgeo, cellmat);
  const pointergeo = new THREE.CircleGeometry(circle_radius, 32);
  pointergeo.rotateX(Math.PI / 2);
  const pointermat = new THREE.MeshBasicMaterial({
    color: 0xffff00,
    side: THREE.DoubleSide,
  });
  const circle = new THREE.Mesh(pointergeo, pointermat);
  const curve = new THREE.CatmullRomCurve3();
  const curvegeo = new THREE.BufferGeometry();
  const curvemat = new THREE.LineBasicMaterial({ color: "brown" });
  const curvemesh = new THREE.Line(curvegeo, curvemat);
  const line_group = new THREE.Group();
  const linemat = new THREE.LineBasicMaterial({ color: "brown" });

  const assistance_group = new THREE.Group(); // 存储辅助模型
  const treegroup = new THREE.Group(); // 存储当前场景的模型
  const tree_species = [
    "Ordinary tree",
    "Chinese huai",
    "Gui flower",
    "Mu furong",
    "Sweet zhang",
  ];
  let current_mode = "view"; // ["view", "edit"]
  let current_edit_way = "place_a_tree"; // ["place_a_tree", "draw_a_line", "spread_an_area", "delineate_an_area"]
  let place_statement = "placing"; // ["placing", "placed"]
  let scene_meta_data = [];

  const base_height = 5.5;

  scene.add(assistance_group);
  scene.add(treegroup);

  /* GUI */
  const guiobj = {
    "sample number": 0,
    "is closed": false,
    "total number": 0,
    size: 1,
    "size volatility": 0,
    "random orientation": true,
    "mesh instanced": true,
    "place a tree": function () {
      assistance_group.add(cellmesh);
      switch_mode_to_edit_("place_a_tree");
    },
    "draw a line": function () {
      assistance_group.add(cellmesh);
      assistance_group.add(curvemesh);
      switch_mode_to_edit_("draw_a_line");
    },
    "spread an area": function () {},
    "delineate an area": function () {
      assistance_group.add(cellmesh);
      assistance_group.add(line_group);
      switch_mode_to_edit_("delineate_an_area");
    },
    view: function () {
      switch_mode_to_view();
    },
    "delete all": function () {
      scene.remove(treegroup);
      scene.remove(pointgroup);
    },
    save: function () {
      scene_meta_data.forEach((metadata) => {
        let { skeleton, isInstanced, matrixArr, matricesArr } = metadata;
        createTree(skeleton, isInstanced, matrixArr, matricesArr);
      });
      scene_meta_data = [];
    },
    "Ordinary tree": function () {
      activate_tree("Ordinary tree");
      treeObj = customizeTree.getTree("普通乔木");
      builder.init(treeObj, true);
    },
    "Chinese huai": function () {
      activate_tree("Chinese huai");
      treeObj = customizeTree.getTree("国槐");
      builder.init(treeObj, true);
    },
    "Gui flower": function () {
      activate_tree("Gui flower");
      treeObj = customizeTree.getTree("桂花");
      builder.init(treeObj, true);
    },
    "Mu furong": function () {
      activate_tree("Mu furong");
      treeObj = customizeTree.getTree("木芙蓉");
      builder.init(treeObj, true);
    },
    "Sweet zhang": function () {
      activate_tree("Sweet zhang");
      treeObj = customizeTree.getTree("香樟");
      builder.init(treeObj, true);
    },
    generate: function () {
      let tree_skeleton = builder.buildSkeleton();
      let tree = builder.buildTree(tree_skeleton);
      let volatility = this["size volatility"] * this["size"];
      let random_matrices_array = [];
      if (current_mode === "edit") {
        if (current_edit_way === "place_a_tree") {
          let { metadata, modified_tree } = modifyATree(
            tree_skeleton,
            tree,
            this["size"],
            volatility,
            cellmesh.position
          );
          scene_meta_data.push(metadata);
          treegroup.add(modified_tree);
        } else if (current_edit_way === "draw_a_line") {
          curve.closed = this["is closed"];
          let sample_points = curve.getPoints(this["sample number"] - 1);
          if (this["mesh instanced"]) {
            sample_points.forEach((p) => {
              let size = new THREE.Vector3()
                .setScalar(this["size"])
                .addScalar(randomRangeLinear(-volatility, volatility));
              let matrix = new THREE.Matrix4()
                .multiply(new THREE.Matrix4().makeTranslation(p.x, p.y, p.z))
                .multiply(
                  new THREE.Matrix4().makeScale(size.x, size.y, size.z)
                );
              random_matrices_array.push(matrix.elements);
            });
            scene_meta_data.push({
              skeleton: tree_skeleton,
              isInstanced: true,
              matrixArr: [],
              matricesArr: random_matrices_array,
            });
            treegroup.add(buildInstancedMeshGroup(tree, random_matrices_array));
          } else {
            sample_points.forEach((p) => {
              let { metadata, eachtree } = modifyATree(
                tree_skeleton,
                tree,
                this["size"],
                volatility,
                p
              );
              scene_meta_data.push(metadata);
              treegroup.add(eachtree);
            });
          }
        } else if (current_edit_way === "delineate_an_area") {
          let vector2s = [];
          let triangles = [];
          points.forEach((point, index) => {
            vector2s.push(new THREE.Vector2(point.x, point.z));
            if (index >= 2) {
              triangles.push(
                new THREE.Triangle(point, points[index - 1], points[0])
              );
            }
          });
          let box2 = new THREE.Box2().setFromPoints(vector2s);
          let cnt = 0;
          while (cnt < this["total number"]) {
            let size = new THREE.Vector3()
              .setScalar(this["size"])
              .addScalar(randomRangeLinear(-volatility, volatility));
            let random_point = new THREE.Vector3(
              randomRangeLinear(box2.min.x, box2.max.x),
              base_height,
              randomRangeLinear(box2.min.y, box2.max.y)
            );
            let matrix = new THREE.Matrix4()
              .multiply(
                new THREE.Matrix4().makeTranslation(
                  random_point.x,
                  random_point.y,
                  random_point.z
                )
              )
              .multiply(new THREE.Matrix4().makeScale(size.x, size.y, size.z));
            if (is_in_polygon(random_point, triangles)) {
              random_matrices_array.push(matrix.elements);
              cnt++;
            }
          }
          scene_meta_data.push({
            skeleton: tree_skeleton,
            isInstanced: true,
            matrixArr: [],
            matricesArr: random_matrices_array,
          });
          treegroup.add(buildInstancedMeshGroup(tree, random_matrices_array));
        }
      }
      terminate_edit_mode();
      builder.clearMesh();
    },
  };
  const gui = new GUI();

  const mode_folder = gui.addFolder("MODE");
  mode_folder.add(guiobj, "view");
  mode_folder.add(guiobj, "delete all");
  mode_folder.add(guiobj, "save");

  const tree_folder = gui.addFolder("TREE");
  const tree_folder_controller = [];
  tree_species.forEach((tree) => {
    tree_folder_controller.push(tree_folder.add(guiobj, tree));
  });

  const generate_folder = gui.addFolder("GENERATOR");
  generate_folder.add(guiobj, "size", 0, 5, 0.1);
  generate_folder.add(guiobj, "size volatility", 0, 1, 0.1);
  generate_folder.add(guiobj, "random orientation", true);
  const mesh_instanced_block = generate_folder.add(
    guiobj,
    "mesh instanced",
    true
  );
  const generate_block = generate_folder.add(guiobj, "generate").disable();

  const edit_folder = mode_folder.addFolder("edit");
  edit_folder.add(guiobj, "place a tree");
  const draw_line_folder = edit_folder.addFolder("draw a line");
  draw_line_folder.add(guiobj, "draw a line");
  draw_line_folder.add(guiobj, "sample number", 2, 100, 1).onChange((v) => {
    if (current_mode === "edit" && current_edit_way === "draw_a_line" && v > 0)
      generate_block.enable();
    else generate_block.disable();
  });

  draw_line_folder.add(guiobj, "is closed");
  const delineate_area_folder = edit_folder.addFolder("delineate an area");
  delineate_area_folder.add(guiobj, "delineate an area");
  delineate_area_folder.add(guiobj, "total number", 1, 100, 1).onChange((v) => {
    if (
      current_mode === "edit" &&
      current_edit_way === "delineate_an_area" &&
      v > 0
    )
      generate_block.enable();
    else generate_block.disable();
  });

  /* 系统函数 */
  const activate_tree = function (species) {
    tree_species.forEach((v, i) => {
      if (v === species)
        tree_folder_controller[i].domElement.classList.add("control-active");
      else
        tree_folder_controller[i].domElement.classList.remove("control-active");
    });
  };

  const modifyATree = function (
    tree_skeleton,
    tree,
    size,
    volatility,
    position
  ) {
    let scale = new THREE.Vector3()
      .setScalar(size)
      .addScalar(randomRangeLinear(-volatility, volatility));
    let matrix = new THREE.Matrix4()
      .multiply(new THREE.Matrix4().makeScale(scale.x, scale.y, scale.z))
      .multiply(
        new THREE.Matrix4().makeTranslation(position.x, position.y, position.z)
      );
    tree.applyMatrix4(matrix);
    let ret = {
      metadata: {
        skeleton: tree_skeleton,
        isInstanced: false,
        matrixArr: matrix.elements,
        matricesArr: [],
      },
      modified_tree: tree,
    };
    return ret;
  };

  const intersecting = (event, object) => {
    pointer.set(
      (event.clientX / window.innerWidth) * 2 - 1,
      -(event.clientY / window.innerHeight) * 2 + 1
    );
    raycaster.setFromCamera(pointer, camera);
    const intersects = raycaster.intersectObject(object, false);
    if (intersects.length > 0) return intersects[0].point.setY(base_height);
    return;
  };

  const onMouseMove = (event) => {
    // console on screen
    // console.log("mouse move");
    if (current_mode === "edit") {
      if (
        (current_edit_way === "place_a_tree" &&
          place_statement === "placing") ||
        current_edit_way === "draw_a_line" ||
        current_edit_way === "delineate_an_area"
      ) {
        // update UI
        move_the_ball(event);
      } else if (current_edit_way === "spread_an_area") {
        // update UI
        show_mouse_circle(event); // to be completed
      }
    }

    function move_the_ball(event) {
      let point = intersecting(event, plane);
      cellmesh.material.opacity = 0.5;
      if (point) cellmesh.position.set(point.x, base_height, point.z);
    }
  };

  const onClick = (event) => {
    // console on screen
    // console.log("mouse click");
    if (current_mode === "edit") {
      if (current_edit_way === "place_a_tree") {
        place_the_ball(event);
        place_statement = "placed";
        generate_block.enable();
      } else if (current_edit_way === "draw_a_line") {
        let point = multiplace_the_ball(event);
        points.push(point);
        curve.points = points;
        curve.closed = guiobj["is closed"];
        if (points.length >= 2)
          curvemesh.geometry.setFromPoints(curve.getPoints(50));
      } else if (current_edit_way === "delineate_an_area") {
        let point = multiplace_the_ball(event);
        points.push(point);
        if (points.length >= 2) {
          let linemesh = new THREE.Line(
            new THREE.BufferGeometry().setFromPoints([
              points.at(-2),
              points.at(-1),
            ]),
            linemat
          );
          line_group.add(linemesh);
          let linemesh_ = new THREE.Line(
            new THREE.BufferGeometry().setFromPoints([
              points.at(0),
              points.at(-1),
            ]),
            linemat
          );
          line_group.add(linemesh_);
          line_group.remove(line_group.children.at(-3));
        }
      }
    }

    function place_the_ball(event) {
      let point = intersecting(event, plane);
      if (point) {
        cellmesh.material.opacity = 1;
        cellmesh.position.set(point.x, base_height, point.z);
      }
    }

    function multiplace_the_ball(event) {
      let point = intersecting(event, plane);
      if (point) {
        cellmesh.position.set(point.x, base_height, point.z);
        assistance_group.add(cellmesh.clone(false));
      }
      return point;
    }
  };

  function switch_mode_to_view() {
    current_mode = "view";
    controls.enabled = true;
  }

  function terminate_edit_mode() {
    current_mode = "view";
    assistance_group.children.forEach((child) => {
      child.clear();
    });
    assistance_group.clear();
    cellmesh.material.opacity = 0.5;
    points = [];
    curve.points = [];
    controls.enabled = true;
    generate_block.disable();
  }

  function switch_mode_to_edit_(edit_way) {
    current_mode = "edit";
    current_edit_way = edit_way;
    place_statement = "placing";
    controls.enabled = false;
  }

  function is_in_polygon(point, triangles) {
    let res = false;
    triangles.forEach((triangle) => {
      if (triangle.containsPoint(point)) {
        res = true;
        return;
      }
    });
    return res;
  }

  const listeners = new Map([
    ["mousemove", onMouseMove],
    ["click", onClick],
  ]);
  listeners.forEach((listener, eventname) => {
    canvas.addEventListener(eventname, listener);
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
};

main();
