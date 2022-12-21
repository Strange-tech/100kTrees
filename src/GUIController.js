import * as THREE from "three";

/*************************************************************************************
 * CLASS NAME:  GUIController
 * DESCRIPTION: change the main camera to watch different scenes
 * NOTE:
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
    this.curve = new THREE.CatmullRomCurve3(points, true, "catmullrom", 0.1);
    this.endTime = endTime;
  }

  reachWanderEnd() {
    const { time, endTime } = this;
    return time === endTime;
  }

  moveCamera() {
    const { camera, curve } = this;
    let points = curve.getPoints(3000);
    this.time += 1;
    const index1 = this.time % 3000;
    const index2 = (this.time + 50) % 3000;
    let point = points[index1];
    let point1 = points[index2];
    if (point && point.x) {
      camera.position.set(point.x, point.y, point.z);
      camera.lookAt(point1.x, point1.y - 50, point1.z);
    }
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
