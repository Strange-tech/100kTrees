"use strict";

import * as THREE from "three";
import { LevelofDetail } from "./LevelofDetail.js";
import { Terrain } from "./Terrain.js";
// import { Wander } from "./Wander.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { GUI } from "three/examples/jsm/libs/lil-gui.module.min.js";

function main() {
  // global variables
  const canvas = document.querySelector("#c");
  const renderer = new THREE.WebGLRenderer({ canvas });
  renderer.setClearColor(0x87cefa, 1);

  const scene = new THREE.Scene();

  const fov = 45;
  const aspect = 2;
  const near = 0.1;
  const far = 50000;
  const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
  camera.position.set(-455, 148, -464);
  camera.lookAt(0, 0, 0);

  const color = 0xffffff;
  const intensity = 1.5;
  const light = new THREE.AmbientLight(color, intensity);
  light.position.set(0, 100, 0);
  scene.add(light);

  const controls = new OrbitControls(camera, canvas);
  controls.target.set(0, 5, 0);
  // controls.autoRotate = true;
  controls.update();

  /////////////////////////////////////////////////////////////////////////////////
  // SKY BOX
  {
    const skyboxLoader = new THREE.CubeTextureLoader();
    const skyboxTexture = skyboxLoader.load([
      "resources/images/sky box/right.jpg",
      "resources/images/sky box/left.jpg",
      "resources/images/sky box/top.jpg",
      "resources/images/sky box/bottom.jpg",
      "resources/images/sky box/front.jpg",
      "resources/images/sky box/back.jpg",
    ]);
    scene.background = skyboxTexture;
  }

  /////////////////////////////////////////////////////////////////////////////////
  // TERRAIN
  const planeSize = 20000;
  const vertexNumber = 500;
  const terrain = new Terrain(
    scene,
    planeSize,
    planeSize,
    vertexNumber,
    vertexNumber
  );

  const vertices = terrain.setImprovedNoise(1);

  terrain.loadTexture("resources/images/terrain/terrain.png");

  terrain.addToScene();

  /////////////////////////////////////////////////////////////////////////////////
  // TREES
  const lods = []; // array of lod

  const forest = [
    {
      url: "resources/models/trees/tree1",
      species: "Macrophanerophytes",
      num: 30000,
    },
    { url: "resources/models/trees/tree2", species: "Broadleaf", num: 30000 },
    { url: "resources/models/trees/tree3", species: "Bamboo", num: 40000 },
  ];
  const totalNum = 100000; // 十万级别的森林

  const randomMatrix = function (vertices, num) {
    const position = new THREE.Vector3();
    const rotation = new THREE.Euler();
    const quaternion = new THREE.Quaternion();
    const scale = new THREE.Vector3(1, 1, 1); // default

    const matrixArray = [];
    const set = new Set();
    const array = vertices.array;
    const l = vertices.array.length / 3;

    let idx;
    while (set.size < num) {
      idx = 3 * Math.floor(Math.random() * l);
      set.add(idx);
    }

    set.forEach((idx) => {
      const matrix = new THREE.Matrix4();
      position.x = array[idx];
      position.y = array[idx + 1];
      position.z = array[idx + 2];

      // rotation.x = Math.random() * 2 * Math.PI;
      // rotation.y = Math.random() * 2 * Math.PI;
      // rotation.z = Math.random() * 2 * Math.PI;

      quaternion.setFromEuler(rotation);

      matrix.compose(position, quaternion, scale);

      matrixArray.push(matrix);
    });
    return matrixArray;
  };

  const matrixArray = randomMatrix(vertices, totalNum);

  const pos_Macrophanerophytes = new THREE.Vector3(
      matrixArray[0].elements[12],
      matrixArray[0].elements[13],
      matrixArray[0].elements[14]
    ),
    pos_Broadleaf = new THREE.Vector3(
      matrixArray[40001].elements[12],
      matrixArray[40001].elements[13],
      matrixArray[40001].elements[14]
    ),
    pos_Bamboo = new THREE.Vector3(
      matrixArray[99999].elements[12],
      matrixArray[99999].elements[13],
      matrixArray[99999].elements[14]
    );

  const loadTree = function (treeObjectArray) {
    const loader = new GLTFLoader();
    let startIndex = 0;

    treeObjectArray.forEach((obj) => {
      const { url, species, num } = obj;
      const lod = new LevelofDetail(scene, camera, species);
      lods.push(lod);

      const array = [];
      loader.load(`${url}/2.glb`, (gltf) => {
        array.push({
          distance: 500,
          group: gltf.scene.children,
        });
        loader.load(`${url}/1.glb`, (gltf) => {
          array.push({
            distance: 2000,
            group: gltf.scene.children,
          });
          loader.load(`${url}/0.glb`, (gltf) => {
            array.push({
              distance: 3000,
              group: gltf.scene.children,
            });
            lod.setLevels(array);
            lod.setPopulation(num);
            for (let i = 0; i < num; i++) {
              let matrix = matrixArray[startIndex + i];
              lod.setTransform(i, matrix);
              if (species === "Macrophanerophytes" && !pos_Macrophanerophytes) {
                pos_Macrophanerophytes = new THREE.Vector3(
                  matrix.elements[12],
                  matrix.elements[13],
                  matrix.elements[14]
                );
              } else if (species === "Broadleaf" && !pos_Broadleaf) {
                pos_Broadleaf = new THREE.Vector3(
                  matrix.elements[12],
                  matrix.elements[13],
                  matrix.elements[14]
                );
              } else if (species === "Bamboo" && !pos_Bamboo) {
                pos_Bamboo = new THREE.Vector3(
                  matrix.elements[12],
                  matrix.elements[13],
                  matrix.elements[14]
                );
              }
            }
            startIndex += num;
            render();
          });
        });
      });
      // end of load
    });
  };

  loadTree(forest);

  /////////////////////////////////////////////////////////////////////////////////
  // WATCH
  const watchTree = function (treeSpecies) {
    let pos;
    switch (treeSpecies) {
      case "Macrophanerophytes":
        pos = pos_Macrophanerophytes;
        break;
      case "Broadleaf":
        pos = pos_Broadleaf;
        break;
      case "Bamboo":
        pos = pos_Bamboo;
        break;
      default:
        break;
    }
    camera.position.set(pos.x + 70, pos.y + 70, pos.z + 70);
    camera.lookAt(pos);

    renderForWatch();
  };

  function renderForWatch() {
    lods.forEach((lod) => {
      lod.update(camera);
    });
    renderer.render(scene, camera);
  }

  /////////////////////////////////////////////////////////////////////////////////
  // WANDER
  // 点的坐标数据
  const points = [
    new THREE.Vector3(8000, 200, 8000),
    new THREE.Vector3(8000, 200, -8000),
    new THREE.Vector3(-8000, 200, -8000),
    new THREE.Vector3(-8000, 200, 8000),
  ];
  let id;
  // 创建曲线
  curve = new THREE.CatmullRomCurve3(points, true, "catmullrom", 0.1);
  let time = 0;
  function moveCamera() {
    // 把曲线分割成2999段， 可以得到3000个点
    let points = curve.getPoints(3000);
    // 更新取点索引
    time += 3;
    // 相机所在点索引
    const index1 = time % 3000;
    // 前方机器人所在位置点的索引
    const index2 = (time + 50) % 3000;
    // 根据索引取点
    let point = points[index1];
    let point1 = points[index2];
    // 修改相机和模型位置
    if (point && point.x) {
      camera.position.set(point.x, point.y, point.z);
      camera.lookAt(point1.x, point1.y, point1.z);
    }
  }

  function renderForWander() {
    moveCamera();
    id = requestAnimationFrame(renderForWander);
    if (time === 3000) cancelAnimationFrame(id);
    renderer.render(scene, camera);
  }

  /////////////////////////////////////////////////////////////////////////////////
  // GUI
  const obj = {
    wander: function () {
      renderForWander();
    },
    watchTree1: function () {
      watchTree("Macrophanerophytes");
    },
    watchTree2: function () {
      watchTree("Broadleaf");
    },
    watchTree3: function () {
      watchTree("Bamboo");
    },
  };
  const gui = new GUI();
  gui.add(obj, "wander");
  gui.add(obj, "watchTree1");
  gui.add(obj, "watchTree2");
  gui.add(obj, "watchTree3");

  /////////////////////////////////////////////////////////////////////////////////
  // RENDER
  function resizeRendererToDisplaySize(renderer) {
    const canvas = renderer.domElement;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const needResize = canvas.width !== width || canvas.height !== height;
    if (needResize) {
      renderer.setSize(width, height, false);
    }
    return needResize;
  }

  let renderRequested = false;
  function render() {
    renderRequested = false;
    // 图像不随屏幕拉伸改变
    if (resizeRendererToDisplaySize(renderer)) {
      const canvas = renderer.domElement;
      camera.aspect = canvas.clientWidth / canvas.clientHeight;
      camera.updateProjectionMatrix();
    }
    lods.forEach((lod) => {
      lod.update(camera);
    });

    controls.update();
    renderer.render(scene, camera);
  }

  function requestRenderIfNotRequested() {
    // console.log(renderRequested);
    if (!renderRequested) {
      renderRequested = true;
      requestAnimationFrame(render);
    }
  }

  controls.addEventListener("change", requestRenderIfNotRequested);
  window.addEventListener("resize", requestRenderIfNotRequested);
}

main();
