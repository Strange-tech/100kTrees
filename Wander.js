import * as THREE from "three";

class Wander {
  constructor(scene, camera) {
    this.camera = camera;
    this.points = []; // array of Vector3
    this.scene = scene;
  }

  setPoints(pointArray) {
    const curve = new THREE.CatmullRomCurve3(pointArray);
    this.points = curve.getPoints(3000);
    console.log(this.points);
    const geometry = new THREE.BufferGeometry().setFromPoints(this.points);

    const material = new THREE.LineBasicMaterial({ color: 0xff0000 });

    // Create the final object to add to the scene
    const curveObject = new THREE.Line(geometry, material);
    this.scene.add(curveObject);
  }

  moveCamera(render, endPont) {
    const { points, camera } = this;

    // 漫游结束
    if (camera.position === endPont) return;
    console.log(time);
    const index1 = time % 3000;
    const index2 = (time + 50) % 3000;
    let point = points[index1]; // 当前位置
    let point1 = points[index2]; // 朝向位置

    console.log(index1);
    if (point && point.x) {
      camera.position.set(point.x, point.y, point.z);
      camera.lookAt(point1.x, point1.y, point1.z);
      console.log(camera.position);
    }
  }
}

export { Wander };
