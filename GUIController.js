import * as THREE from "three";

class GUIController {
  constructor(scene) {
    this.scene = scene;
    this.cameras = {}; // set many camera stands
    this.curve = undefined;
    this.endTime = 0;
    this.time = 0; // timer
  }

  setWander(points, endTime) {
    const wanderCamera = new THREE.PerspectiveCamera(45, 2, 0.1, 5000);
    this.cameras.wanderCamera = wanderCamera;
    this.curve = new THREE.CatmullRomCurve3(points, true, "catmullrom", 0.1);
    this.endTime = endTime;
  }

  getWanderCamera() {
    return this.cameras.wanderCamera;
  }

  reachWanderEnd() {
    const { time, endTime } = this;
    return time === endTime;
  }

  moveCamera() {
    const { cameras, curve } = this;
    const wanderCamera = cameras.wanderCamera;
    let points = curve.getPoints(3000);
    this.time += 3;
    const index1 = this.time % 3000;
    const index2 = (this.time + 50) % 3000;
    let point = points[index1];
    let point1 = points[index2];
    if (point && point.x) {
      wanderCamera.position.set(point.x, point.y, point.z);
      wanderCamera.lookAt(point1.x, point1.y, point1.z);
    }
  }

  setWatch(treeSpecies, watchPos) {
    const watchCamera = new THREE.PerspectiveCamera(45, 2, 0.1, 50000);
    this.cameras.watchCamera = watchCamera;

    let pos;
    switch (treeSpecies) {
      case "Macrophanerophytes":
        pos = watchPos.Macrophanerophytes;
        break;
      case "Broadleaf":
        pos = watchPos.Broadleaf;
        break;
      case "Bamboo":
        pos = watchPos.Bamboo;
        break;
      default:
        break;
    }
    watchCamera.position.set(pos.x + 70, pos.y + 70, pos.z + 70);
    watchCamera.lookAt(pos);
  }

  getWatchCamera() {
    return this.cameras.watchCamera;
  }
}

export { GUIController };
