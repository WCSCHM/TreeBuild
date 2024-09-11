import * as THREE from "three";
import { toSeePoint } from "../utilities";

/*************************************************************************************
 * CLASS NAME:  InstancedLOD
 * DESCRIPTION: Combine instancedMesh with lod instead of using THREE.LOD
 * NOTE:        Each class of InstancedLOD represents one single kind of tree,
 *              check 'treeSpecies' for detail
 *
 *************************************************************************************/
class InstancedLOD {
  constructor(scene, camera) {
    this.scene = scene;
    this.camera = camera;

    this.renderbuffer = {};

    // this.numOfLevel = 0;
    // this.levels;
    // this.instancedMeshOfAllLevel;
    // this.groupOfInstances;

    this.frustum = new THREE.Frustum();
    this.worldProjectionMatrix = new THREE.Matrix4();
    this.obj_position = new THREE.Vector3();
    this.cur_dist = 0;
    this.cur_level = 0;
  }

  setOctree(octree) {
    this.octree = octree;
  }

  extractMeshes(group) {
    let meshes = [];
    function extract_recursive(group) {
      if (group.children.length == 0) {
        meshes.push(group);
      } else {
        for (let i = 0; i < group.children.length; i++) {
          extract_recursive(group.children[i]);
        }
      }
    }
    extract_recursive(group);
    // console.log(meshes);
    return meshes;
  }

  setLevels(details, number) {
    let l = details.array.length;
    let lls = new Array(l);
    let instMAL = new Array(l);
    let groupInst = new Array(l);
    for (let i = 0; i < l; i++) {
      lls[i] = details.array[i].distance;
      instMAL[i] = {
        meshes: this.extractMeshes(details.array[i].group),
        count: 0,
        matrix4: [],
      };
    }

    // this.numOfLevel = array.length;
    // this.levels = new Array(this.numOfLevel);
    // this.instancedMeshOfAllLevel = new Array(this.numOfLevel); // array of { mesh:[], count, matrix4:[] }
    // this.groupOfInstances = new Array(this.numOfLevel); // array of THREE.Group(), each Group -> tree meshes in each level
    // for (let i = 0; i < this.numOfLevel; i++) {
    //   this.levels[i] = array[i].distance;
    //   this.instancedMeshOfAllLevel[i] = {
    //     meshes: this.extractMeshes(array[i].group),
    //     count: 0,
    //     matrix4: [],
    //   };
    // }

    for (let i = 0; i < l; i++) {
      const group = new THREE.Group();
      instMAL[i].meshes.forEach((m) => {
        const instancedMesh = new THREE.InstancedMesh(
          m.geometry,
          m.material,
          number,
        );
        instancedMesh.castShadow = true;
        instancedMesh.receiveShadow = true;
        group.add(instancedMesh);
      });
      groupInst[i] = group;
      this.scene.add(group);
    }

    this.renderbuffer[details.id] = {
      numOfLevel: l,
      levels: lls,
      instancedMeshOfAllLevel: instMAL,
      groupOfInstances: groupInst,
    };
  }

  // setPopulation(number) {
  //   for (let i = 0; i < this.numOfLevel; i++) {
  //     const group = new THREE.Group();
  //     this.instancedMeshOfAllLevel[i].meshes.forEach((m) => {
  //       const instancedMesh = new THREE.InstancedMesh(
  //         m.geometry,
  //         m.material,
  //         number,
  //       );
  //       instancedMesh.castShadow = true;
  //       instancedMesh.receiveShadow = true;
  //       // instancedMesh.instanceMatrix.needsUpdate = true;
  //       group.add(instancedMesh);
  //     });
  //     this.groupOfInstances[i] = group;
  //     this.scene.add(group);
  //   }
  // }

  getDistanceLevel(id, dist) {
    const { renderbuffer } = this;
    const lls = renderbuffer[id].levels;
    for (let i = 0; i < lls.length; i++) {
      if (dist <= lls[i]) {
        return i;
      }
    }
    return lls.length - 1;
  }

  // getLastLevel() {
  //   return this.levels.length - 1;
  // }

  // getSpecies() {
  //   return this.treeSpecies;
  // }

  expandFrustum(frustum, offset) {
    frustum.planes.forEach((plane) => {
      plane.constant += offset;
    });
  }

  /* render函数每帧都要进行,内存交换越少越好,计算时间越短越好 */
  render() {
    let {
      // instancedMeshOfAllLevel,
      // groupOfInstances,
      // numOfLevel,
      renderbuffer,
      camera,
      frustum,
      octree,
      worldProjectionMatrix,
      obj_position,
      cur_dist,
      cur_level,
    } = this;
    // clear
    for (let id in renderbuffer) {
      let bf = renderbuffer[id];
      for (let i = 0; i < bf.numOfLevel; i++) {
        bf.instancedMeshOfAllLevel[i].count = 0;
        bf.instancedMeshOfAllLevel[i].matrix4 = [];
      }
    }

    // for (let i = 0; i < numOfLevel; i++) {
    //   instancedMeshOfAllLevel[i].count = 0;
    //   instancedMeshOfAllLevel[i].matrix4 = [];
    // }

    // update camera frustum
    worldProjectionMatrix.identity(); // reset as identity matrix
    frustum.setFromProjectionMatrix(
      worldProjectionMatrix.multiplyMatrices(
        camera.projectionMatrix,
        camera.matrixWorldInverse,
      ),
    );

    this.expandFrustum(frustum, 25);
    let found = octree.queryByFrustum(frustum); // [{id, transform}, ... , {}]
    found.forEach((el) => {
      obj_position.setFromMatrixPosition(el.transform);
      cur_dist = obj_position.distanceTo(camera.position);
      cur_level = this.getDistanceLevel(el.id, cur_dist);
      // console.log(cur_level);
      renderbuffer[el.id].instancedMeshOfAllLevel[cur_level].count++;
      renderbuffer[el.id].instancedMeshOfAllLevel[cur_level].matrix4.push(
        el.transform,
      ); // column-major list of a matrix
    });

    // console.log("instancedMeshOfAllLevel:", instancedMeshOfAllLevel);

    for (let id in renderbuffer) {
      let bf = renderbuffer[id];
      for (let i = 0; i < bf.numOfLevel; i++) {
        const obj = bf.instancedMeshOfAllLevel[i]; // obj: { meshes:[], count, matrix4:[] }
        for (let j = 0; j < bf.groupOfInstances[i].children.length; j++) {
          let instancedMesh = bf.groupOfInstances[i].children[j];

          if (instancedMesh.count >= obj.count) {
            instancedMesh.count = obj.count;
            for (let k = 0; k < obj.count; k++) {
              instancedMesh.instanceMatrix.needsUpdate = true;
              instancedMesh.setMatrixAt(k, obj.matrix4[k]);
            }
          } else {
            let new_instancedMesh = new THREE.InstancedMesh(
              obj.meshes[j].geometry,
              obj.meshes[j].material,
              obj.count,
            );
            for (let k = 0; k < obj.count; k++) {
              new_instancedMesh.setMatrixAt(k, obj.matrix4[k]);
            }
            new_instancedMesh.castShadow = true;
            new_instancedMesh.receiveShadow = true;
            bf.groupOfInstances[i].children[j] = new_instancedMesh;
          }
        }
      }
      // console.log("groupOfInstances:", groupOfInstances);
    }
  }
}

export { InstancedLOD };
