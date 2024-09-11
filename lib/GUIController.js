import * as THREE from "three";

/*************************************************************************************
 * CLASS NAME:  GUIController
 * DESCRIPTION: Change the main camera to watch different scenes
 * NOTE:        There are only one camera
 *
 *************************************************************************************/
class GUIController {
  constructor(camera, controls) {
    this.camera = camera;
    this.curve;
    this.divisions = 0;
    this.endTime = 0;
    this.time = 0; // timer
    this.controls = controls;
  }

  setWander(points, divisions, endTime) {
    this.time = 0;
    this.curve = new THREE.CatmullRomCurve3(points);
    this.divisions = divisions;
    this.endTime = endTime;
  }

  reachWanderEnd() {
    const { time, endTime } = this;
    return time >= endTime;
  }

  moveCamera() {
    const { camera, curve, divisions } = this;
    let points = curve.getPoints(divisions);
    // this.time++;
    // let index = this.time % divisions;
    let point = points[this.time++];
    camera.position.set(point.x, point.y, point.z);
  }

  setWatch(treeSpecies, watchPos) {
    const { camera, controls } = this;
    const pos = watchPos[treeSpecies];

    camera.position.set(pos.x + 120, pos.y + 120, pos.z + 120);
    camera.lookAt(pos);
    controls.target.set(pos.x, pos.y, pos.z);
    // console.log(camera);
  }
}

export { GUIController };
