"use strict";

import * as THREE from "three";
import { LevelofDetail } from "./LevelofDetail.js";
import { Terrain } from "./Terrain.js";
import { GUIController } from "./GUIController.js";
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

  const guiController = new GUIController();

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

      quaternion.setFromEuler(rotation);

      matrix.compose(position, quaternion, scale);

      matrixArray.push(matrix);
    });
    return matrixArray;
  };

  const forestDistribute = function (forest, matrixArray) {
    const forestMatrix = {};
    let startIndex = 0;
    forest.forEach((tree) => {
      forestMatrix[tree.species] = matrixArray.slice(
        startIndex,
        startIndex + tree.num
      );
      startIndex += tree.num;
    });
    return forestMatrix;
  };

  const matrixArray = randomMatrix(vertices, totalNum);
  const forestMatrix = forestDistribute(forest, matrixArray);

  // 随便选三种树的坐标
  const watchPos = {
    Macrophanerophytes: new THREE.Vector3(
      forestMatrix["Macrophanerophytes"][0].elements[12],
      forestMatrix["Macrophanerophytes"][0].elements[13],
      forestMatrix["Macrophanerophytes"][0].elements[14]
    ),
    Broadleaf: new THREE.Vector3(
      forestMatrix["Broadleaf"][0].elements[12],
      forestMatrix["Broadleaf"][0].elements[13],
      forestMatrix["Broadleaf"][0].elements[14]
    ),
    Bamboo: new THREE.Vector3(
      forestMatrix["Bamboo"][0].elements[12],
      forestMatrix["Bamboo"][0].elements[13],
      forestMatrix["Bamboo"][0].elements[14]
    ),
  };

  const loadTree = function (treeObjectArray) {
    const loader = new GLTFLoader();

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
              let matrix = forestMatrix[species][i];
              lod.setTransform(i, matrix);
            }
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
  function renderForWatch(treeSpecies) {
    guiController.setWatch(treeSpecies, watchPos);
    const watchCamera = guiController.getWatchCamera();
    lods.forEach((lod) => {
      lod.update(watchCamera);
    });
    renderer.render(scene, watchCamera);
  }

  /////////////////////////////////////////////////////////////////////////////////
  // WANDER
  const points = [
    new THREE.Vector3(8000, 200, 8000),
    new THREE.Vector3(8000, 200, -8000),
    new THREE.Vector3(-8000, 200, -8000),
    new THREE.Vector3(-8000, 200, 8000),
  ];
  const endTime = 3000;

  guiController.setWander(points, endTime);
  const wanderCamera = guiController.getWanderCamera();

  function renderForWander() {
    guiController.moveCamera();
    let id = requestAnimationFrame(renderForWander);
    if (guiController.reachWanderEnd()) cancelAnimationFrame(id);
    renderer.render(scene, wanderCamera);
  }

  /////////////////////////////////////////////////////////////////////////////////
  // GUI
  const obj = {
    wander: function () {
      renderForWander();
    },
    watchTree1: function () {
      renderForWatch("Macrophanerophytes");
    },
    watchTree2: function () {
      renderForWatch("Broadleaf");
    },
    watchTree3: function () {
      renderForWatch("Bamboo");
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
