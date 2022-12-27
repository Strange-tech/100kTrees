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
    this.curve = undefined;
    this.endTime = 0;
    this.time = 0; // timer
    this.controls = controls;
  }

  setWander(points, endTime) {
    this.time = 0;
    this.curve = new THREE.CatmullRomCurve3(points);
    this.endTime = endTime;
  }

  reachWanderEnd() {
    const { time, endTime } = this;
    return time === endTime;
  }

  moveCamera() {
    const { camera, curve } = this;
    let points = curve.getPoints(1000);
    this.time += 2;
    const index = this.time % 1000;
    let point = points[index];

    camera.position.set(point.x, point.y, point.z);
    camera.lookAt(0, 0, 0);
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
