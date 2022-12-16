"use strict";

import * as THREE from "three";
import { LevelofDetail } from "./LevelofDetail.js";
import { Terrain } from "./Terrain.js";
import { GUIController } from "./GUIController.js";
import { Forest } from "./Forest.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { GUI } from "three/examples/jsm/libs/lil-gui.module.min.js";

// import { OrbitControls } from "three/addons/controls/OrbitControls.js";
// import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
// import { GUI } from "three/addons/libs/lil-gui.module.min.js";

function main() {
  // global variables
  const canvas = document.querySelector("#c");
  const renderer = new THREE.WebGLRenderer({ canvas });
  renderer.setClearColor(0x87cefa, 1);
  // renderer.shadowMap.enabled = true;

  const scene = new THREE.Scene();

  const fov = 45;
  const aspect = 2;
  const near = 0.1;
  const far = 50000;
  const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
  camera.position.set(-455, 148, -464);
  camera.lookAt(0, 0, 0);

  {
    const color = 0xffffff;
    const intensity = 1.5;
    const light = new THREE.AmbientLight(color, intensity);
    scene.add(light);
  }

  const controls = new OrbitControls(camera, canvas);
  controls.target.set(0, 5, 0);
  // controls.autoRotate = true;

  const guiController = new GUIController(camera, controls);

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

  const forestArray = [
    {
      url: "resources/models/trees/tree1",
      species: "Macrophanerophytes",
      num: 10000,
      detail: [],
    },
    {
      url: "resources/models/trees/tree2",
      species: "Broadleaf",
      num: 10000,
      detail: [],
    },
    {
      url: "resources/models/trees/tree3",
      species: "Bamboo",
      num: 10000,
      detail: [],
    },
    {
      url: "resources/models/trees/tree4",
      species: "bullshit",
      num: 10000,
      detail: [],
    },
    {
      url: "resources/models/trees/tree7",
      species: "fuck",
      num: 10000,
      detail: [],
    },
    {
      url: "resources/models/trees/tree8",
      species: "idiot",
      num: 10000,
      detail: [],
    },
    {
      url: "resources/models/trees/tree9",
      species: "nerd",
      num: 1,
      detail: [],
    },
    {
      url: "resources/models/trees/tree10",
      species: "coward",
      num: 10000,
      detail: [],
    },
    {
      url: "resources/models/trees/tree11",
      species: "fool",
      num: 10000,
      detail: [],
    },
  ];
  const forest = new Forest(forestArray);

  const totalNum = forest.getTotalNum(); // 十万级别的森林

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

      // rotation.y = Math.random() * 2 * Math.PI;

      quaternion.setFromEuler(rotation);

      matrix.compose(position, quaternion, scale);

      matrixArray.push(matrix);
    });
    return matrixArray;
  };

  const forestDistribute = function (forest, matrixArray) {
    const forestMatrix = {};
    let startIndex = 0;
    forest.content.forEach((tree) => {
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

  const watchPos = {};
  forest.content.forEach((tree) => {
    let sp = tree.species;
    watchPos[sp] = new THREE.Vector3(
      forestMatrix[sp][0].elements[12],
      forestMatrix[sp][0].elements[13],
      forestMatrix[sp][0].elements[14]
    );
  });

  const loadModel = async function (forest) {
    const loader = new GLTFLoader();
    const array = [];
    forest.content.forEach((obj, index) => {
      const { url, species } = obj;
      let high, middle, low;
      // 以下代码是为了妥协傻逼模型
      if (index < 3) {
        high = new Promise((resolve) => {
          loader.load(`${url}/high.glb`, (gltf) => {
            resolve({
              group: gltf.scene.children,
              species: species,
              level: "high",
              distance: 500,
            });
          });
        });
        low = new Promise((resolve) => {
          loader.load(`${url}/low.glb`, (gltf) => {
            resolve({
              group: gltf.scene.children,
              species: species,
              level: "low",
              distance: 3000,
            });
          });
        });
        middle = new Promise((resolve) => {
          loader.load(`${url}/middle.glb`, (gltf) => {
            resolve({
              group: gltf.scene.children,
              species: species,
              level: "middle",
              distance: 1000,
            });
          });
        });
        array.push(high, middle, low);
      } else {
        high = new Promise((resolve) => {
          loader.load(`${url}/high.glb`, (gltf) => {
            resolve({
              group: gltf.scene.children[0].children,
              species: species,
              level: "high",
              distance: 1000,
            });
          });
        });
        low = new Promise((resolve) => {
          loader.load(`${url}/low.glb`, (gltf) => {
            resolve({
              group: gltf.scene.children,
              species: species,
              level: "low",
              distance: 2000,
            });
          });
        });
        array.push(high, low);
      }
    });

    const res = await Promise.all(array);
    const content = forest.content;
    res.forEach((obj) => {
      const { group, species, level, distance } = obj;
      const id = forest.getIdBySpecies(species);
      content[id].detail.push({
        group: group,
        level: level,
        distance: distance,
      });
    });
    // console.log(forest);

    content.forEach((treeObj) => {
      const { detail, species, num } = treeObj;
      const lod = new LevelofDetail(scene, camera, species);
      lod.setLevels(detail);
      lod.setPopulation(num);
      for (let i = 0; i < num; i++) {
        let matrix = forestMatrix[species][i];
        lod.setTransform(i, matrix);
      }
      lods.push(lod);
    });
    render();
  };
  loadModel(forest);

  /////////////////////////////////////////////////////////////////////////////////
  // WATCH
  function renderForWatch(treeSpecies) {
    guiController.setWatch(treeSpecies, watchPos);
    lods.forEach((lod) => {
      lod.update(camera);
    });
    renderer.render(scene, camera);
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

  function renderForWander() {
    guiController.moveCamera();
    let id = requestAnimationFrame(renderForWander);
    if (guiController.reachWanderEnd()) cancelAnimationFrame(id);
    renderer.render(scene, camera);
  }

  /////////////////////////////////////////////////////////////////////////////////
  // GUI
  const obj = {
    reset: function () {
      camera.position.set(-455, 148, -464);
      camera.lookAt(0, 0, 0);
      controls.target.set(0, 0, 0);
      renderer.render(scene, camera);
    },
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
    watchTree4: function () {
      renderForWatch("bullshit");
    },
    watchTree5: function () {
      renderForWatch("fuck");
    },
    watchTree6: function () {
      renderForWatch("idiot");
    },
    watchTree7: function () {
      renderForWatch("nerd");
    },
  };
  const gui = new GUI();
  gui.add(obj, "reset");
  gui.add(obj, "wander");
  gui.add(obj, "watchTree1");
  gui.add(obj, "watchTree2");
  gui.add(obj, "watchTree3");
  gui.add(obj, "watchTree4");
  gui.add(obj, "watchTree5");
  gui.add(obj, "watchTree6");
  gui.add(obj, "watchTree7");

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

    // controls.update();
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
