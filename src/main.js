"use strict";

import * as THREE from "three";
import { LevelofDetail } from "./LevelofDetail.js";
import { Terrain } from "./Terrain.js";
import { GUIController } from "./GUIController.js";
import { Forest } from "./Forest.js";
import { GetBufferAttributes } from "../tools/GetBufferAttributes.js";
// import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
// import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
// import { GUI } from "three/examples/jsm/libs/lil-gui.module.min.js";
// import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";

import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { GUI } from "three/addons/libs/lil-gui.module.min.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";

function main() {
  // global variables
  const canvas = document.querySelector("#c");
  const bar = document.querySelector("#bar");
  const container = document.querySelector(".container");

  const renderer = new THREE.WebGLRenderer({ canvas });
  // renderer.setClearColor(0x87cefa, 1);
  // renderer.outputEncoding = THREE.sRGBEncoding;

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
  const vertexNumber = 2000;
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
      num: 8000,
      detail: [],
    },
    {
      url: "resources/models/trees/tree2",
      species: "Broadleaf",
      num: 8000,
      detail: [],
    },
    {
      url: "resources/models/trees/tree3",
      species: "Bamboo",
      num: 8000,
      detail: [],
    },
    {
      url: "resources/models/trees/tree4",
      species: "bullshit",
      num: 6000,
      detail: [],
    },
    {
      url: "resources/models/trees/tree7",
      species: "fuck",
      num: 8000,
      detail: [],
    },
    {
      url: "resources/models/trees/tree8",
      species: "idiot",
      num: 8000,
      detail: [],
    },
    // {
    //   url: "resources/models/trees/tree9",
    //   species: "nerd",
    //   num: 1,
    //   detail: [],
    // },
    {
      url: "resources/models/trees/tree10",
      species: "coward",
      num: 8000,
      detail: [],
    },
    {
      url: "resources/models/trees/tree11",
      species: "fool",
      num: 8000,
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

  let loadCount = 0;
  const loader = new GLTFLoader();
  const dracoLoader = new DRACOLoader();

  const promiseController = function (url, species, level, distance) {
    return new Promise((resolve) => {
      dracoLoader.setDecoderPath("resources/draco/");
      dracoLoader.preload();
      loader.setDRACOLoader(dracoLoader);
      loader.load(url, (gltf) => {
        resolve({
          // 以下代码是为了妥协傻逼模型
          group: gltf.scene.children[0].isMesh
            ? gltf.scene.children
            : gltf.scene.children[0].children,
          species: species,
          level: level,
          distance: distance,
        });
      });
    }).then((res) => {
      loadCount++;
      bar.style.width = bar.innerHTML =
        Math.floor((100 * loadCount) / 21) + "%";
      // console.log(loadCount);
      if (loadCount === 19) {
        container.style.display = "none";
        canvas.style.opacity = 1;
        render();
      }
      return res;
    });
  };

  const loadModel = async function (forest) {
    const array = [];
    forest.content.forEach((obj, index) => {
      const { url, species } = obj;
      let high, middle, low;

      if (index < 3) {
        high = promiseController(`${url}/highDraco.glb`, species, "high", 800);
        low = promiseController(`${url}/low.glb`, species, "low", 3000);
        middle = promiseController(
          `${url}/middle.glb`,
          species,
          "middle",
          2000
        );
        array.push(high, middle, low);
      } else {
        high = promiseController(`${url}/highDraco.glb`, species, "high", 1200);
        low = promiseController(`${url}/low.glb`, species, "low", 2000);
        array.push(high, low);
      }
    });

    const res = await Promise.all(array);
    // console.log(res);

    const content = forest.content;
    res.forEach((obj) => {
      // 统计模型信息，打印在控制台
      console.log(`${obj.species}-${obj.level}: `);
      new GetBufferAttributes(obj.group).getSceneModelFaceNum();

      // 后续操作...
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
    render();
  }

  /////////////////////////////////////////////////////////////////////////////////
  // WANDER
  const points = [
    new THREE.Vector3(2000, 200, 2000),
    new THREE.Vector3(2000, 200, -2000),
    new THREE.Vector3(-2000, 200, -2000),
    new THREE.Vector3(-2000, 200, 2000),
  ];
  const endTime = 3000; // 划分为3000个点

  function renderForWander() {
    guiController.moveCamera();
    render();
    let id = requestAnimationFrame(renderForWander);
    if (guiController.reachWanderEnd()) cancelAnimationFrame(id);
  }

  /////////////////////////////////////////////////////////////////////////////////
  // GUI
  const obj = {
    reset: function () {
      camera.position.set(-455, 148, -464);
      camera.lookAt(0, 0, 0);
      controls.target.set(0, 0, 0);
      render();
    },
    wander: function () {
      guiController.setWander(points, endTime);
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
    watchGiantTree: function () {
      renderForWatch("nerd");
    },
  };
  const gui = new GUI();
  gui.add(obj, "reset");
  gui.add(obj, "wander");
  const folder = gui.addFolder("watch");
  folder.add(obj, "watchTree1");
  folder.add(obj, "watchTree2");
  folder.add(obj, "watchTree3");
  folder.add(obj, "watchTree4");
  folder.add(obj, "watchTree5");
  folder.add(obj, "watchTree6");

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
