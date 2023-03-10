"use strict";

import * as THREE from "three";
import { LevelofDetail } from "./LevelofDetail.js";
import { Terrain } from "./Terrain.js";
import { GUIController } from "./GUIController.js";
import { Forest } from "./Forest.js";
import { QuadTree, Rectangle, Point } from "./QuadTree.js";
// import { GetBufferAttributes } from "../tools/GetBufferAttributes.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { GUI } from "three/examples/jsm/libs/lil-gui.module.min.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";

function main() {
  // global variables
  const canvas = document.querySelector("#c");
  const renderer = new THREE.WebGLRenderer({ canvas: canvas });
  // renderer.outputEncoding = THREE.sRGBEncoding;

  const scene = new THREE.Scene();

  const fov = 45;
  const aspect = 2;
  const near = 1;
  const far = 30000;
  const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
  camera.position.set(-450, 300, -450);
  camera.lookAt(0, 0, 0);
  {
    const color = 0xffffff;
    const intensity = 2;
    const light = new THREE.AmbientLight(color, intensity);
    scene.add(light);
  }
  const controls = new OrbitControls(camera, canvas);
  controls.target.set(0, 5, 0);
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
      num: 10000,
    },
    {
      url: "resources/models/trees/tree2",
      species: "Broadleaf",
      num: 12000,
    },
    {
      url: "resources/models/trees/tree3",
      species: "Bamboo",
      num: 20000,
    },
    {
      url: "resources/models/trees/tree4",
      species: "bullshit",
      num: 8000,
    },
    {
      url: "resources/models/trees/tree5",
      species: "fuck",
      num: 10000,
    },
    {
      url: "resources/models/trees/tree6",
      species: "idiot",
      num: 10000,
    },
    // {
    //   url: "resources/models/trees/tree7",
    //   species: "nerd",
    //   num: 1,
    // },
    {
      url: "resources/models/trees/tree8",
      species: "coward",
      num: 10000,
    },
    {
      url: "resources/models/trees/tree9",
      species: "fool",
      num: 10000,
    },
  ];
  const forest = new Forest(forestArray);

  const totalNum = forest.getTotalNum(); // ?????????????????????

  const randomMatrix = function (vertices, num) {
    const trans = new THREE.Matrix4();
    const rot = new THREE.Matrix4();
    const scl = new THREE.Matrix4();

    const matrixArray = [];
    const array = vertices.array;
    const l = vertices.array.length / 3;

    const boundary = new Rectangle(0, 0, planeSize / 2, planeSize / 2);
    const quadtree = new QuadTree(boundary, 10);
    let cnt = 0;
    while (cnt < num) {
      let idx = 3 * Math.floor(Math.random() * l);
      let x, y, z;
      let r = 40;
      let found; // ?????????point??????
      do {
        found = [];
        idx = 3 * Math.floor(Math.random() * l);
        x = array[idx];
        z = array[idx + 2];
        let range = new Rectangle(x, z, r, r);
        quadtree.query(range, found);
      } while (found.length > 0);

      let point = new Point(x, z, r);
      quadtree.insert(point);

      const matrix = new THREE.Matrix4();

      y = array[idx + 1];
      trans.makeTranslation(x, y, z);

      rot.makeRotationY(Math.random() * 2 * Math.PI);

      scl.makeScale(1, 1, 1);

      matrix.multiply(trans).multiply(rot).multiply(scl);

      matrixArray.push(matrix);

      cnt++;
    }
    // console.log(quadtree);
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

  /////////////////////////////////////////////////////////////////////////////////
  // RENDER MODE
  const loader = new GLTFLoader();
  const dracoLoader = new DRACOLoader();
  // 1. renderWhileLoading
  const promiseController1 = function (url, species, level, distance) {
    return new Promise((resolve) => {
      dracoLoader.setDecoderPath("resources/draco/");
      dracoLoader.preload();
      loader.setDRACOLoader(dracoLoader);
      loader.load(url, (gltf) => {
        resolve({
          group: gltf.scene,
          species: species,
          level: level,
          distance: distance,
        });
      });
    });
  };
  const renderWhileLoading = function (forest) {
    // canvas.style.opacity = 1;
    forest.content.forEach(async (obj, index) => {
      const { url, species, num } = obj;
      let high, middle, low;
      let res,
        detail = [];
      if (index < 3) {
        high = promiseController1(
          `${url}/highDraco.glb`,
          species,
          "high",
          1200
        );
        low = promiseController1(`${url}/low.glb`, species, "low", 4000);
        middle = promiseController1(
          `${url}/middle.glb`,
          species,
          "middle",
          3000
        );
        res = await Promise.all([high, middle, low]);
      } else {
        high = promiseController1(
          `${url}/highDraco.glb`,
          species,
          "high",
          2000
        );
        low = promiseController1(`${url}/low.glb`, species, "low", 3000);
        res = await Promise.all([high, low]);
      }
      res.forEach((obj) => {
        const { group, level, distance } = obj;
        detail.push({
          group: group,
          level: level,
          distance: distance,
        });
      });
      // console.log(detail);
      const lod = new LevelofDetail(scene, species);
      lod.setLevels(detail);
      lod.setPopulation(num);
      for (let i = 0; i < num; i++) {
        let matrix = forestMatrix[species][i];
        lod.setTransform(i, matrix);
      }
      lods.push(lod);
      render();
    });
  };
  renderWhileLoading(forest); // choose one to carry out.

  // // 2. renderAfterLoading
  // const promiseController2 = function (url, species, level, distance) {
  //   const totalCount = 19;
  //   return new Promise((resolve) => {
  //     dracoLoader.setDecoderPath("resources/draco/");
  //     dracoLoader.preload();
  //     loader.setDRACOLoader(dracoLoader);
  //     loader.load(url, (gltf) => {
  //       resolve({
  //         group: gltf.scene,
  //         species: species,
  //         level: level,
  //         distance: distance,
  //       });
  //     });
  //   }).then((res) => {
  //     loadCount++;
  //     bar.style.width = bar.innerHTML =
  //       Math.floor((100 * loadCount) / totalCount) + "%";
  //     // console.log(loadCount);
  //     if (loadCount === totalCount) {
  //       container.style.display = "none";
  //       canvas.style.opacity = 1;
  //       render();
  //     }
  //     return res;
  //   });
  // };
  // const renderAfterLoading = async function (forest) {
  //   const array = [];
  //   forest.content.forEach((obj, index) => {
  //     const { url, species } = obj;
  //     let high, middle, low;

  //     if (index < 3) {
  //       high = promiseController2(`${url}/highDraco.glb`, species, "high", 800);
  //       low = promiseController2(`${url}/low.glb`, species, "low", 3000);
  //       middle = promiseController2(
  //         `${url}/middle.glb`,
  //         species,
  //         "middle",
  //         2000
  //       );
  //       array.push(high, middle, low);
  //     } else {
  //       high = promiseController2(
  //         `${url}/highDraco.glb`,
  //         species,
  //         "high",
  //         1200
  //       );
  //       low = promiseController2(`${url}/low.glb`, species, "low", 2000);
  //       array.push(high, low);
  //     }
  //   });
  //   const res = await Promise.all(array);
  //   // console.log(res);
  //   const content = forest.content;
  //   res.forEach((obj) => {
  //     // ???????????????????????????????????????
  //     console.log(`${obj.species}-${obj.level}: `);
  //     new GetBufferAttributes(obj.group).getSceneModelFaceNum();
  //     // ????????????...
  //     const { group, species, level, distance } = obj;
  //     const id = forest.getIdBySpecies(species);
  //     content[id].detail.push({
  //       group: group,
  //       level: level,
  //       distance: distance,
  //     });
  //   });
  //   // console.log(forest);
  //   content.forEach((treeObj) => {
  //     const { detail, species, num } = treeObj;
  //     const lod = new LevelofDetail(scene, species);
  //     lod.setLevels(detail);
  //     lod.setPopulation(num);
  //     for (let i = 0; i < num; i++) {
  //       let matrix = forestMatrix[species][i];
  //       lod.setTransform(i, matrix);
  //     }
  //     lods.push(lod);
  //   });
  //   render();
  // };
  // // renderAfterLoading(forest); // choose one to carry out.

  /////////////////////////////////////////////////////////////////////////////////
  // WATCH
  const watchPos = {};
  forest.content.forEach((tree) => {
    let sp = tree.species;
    watchPos[sp] = new THREE.Vector3(
      forestMatrix[sp][0].elements[12],
      forestMatrix[sp][0].elements[13],
      forestMatrix[sp][0].elements[14]
    );
  });
  function renderForWatch(treeSpecies) {
    guiController.setWatch(treeSpecies, watchPos);
    render();
  }

  /////////////////////////////////////////////////////////////////////////////////
  // WANDER
  const points = [
    new THREE.Vector3(4000, 3000, 0),
    new THREE.Vector3(4000, 300, 0),
    new THREE.Vector3(2000, 180, 0),
    new THREE.Vector3(600, 180, 0),
  ];
  const endTime = 990; // ?????????1000??????

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
    watchTree7: function () {
      renderForWatch("coward");
    },
    watchTree8: function () {
      renderForWatch("fool");
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
  folder.add(obj, "watchTree7");
  folder.add(obj, "watchTree8");

  /////////////////////////////////////////////////////////////////////////////////
  // RENDER
  function resizeRendererToDisplaySize(renderer) {
    const canvas = renderer.domElement;
    const pixelRatio = window.devicePixelRatio;
    const width = (canvas.clientWidth * pixelRatio) | 0;
    const height = (canvas.clientHeight * pixelRatio) | 0;
    const needResize = canvas.width !== width || canvas.height !== height;
    if (needResize) {
      renderer.setSize(width, height, false);
    }
    return needResize;
  }

  let renderRequested = false;
  function render() {
    renderRequested = false;
    // ??????????????????????????????
    if (resizeRendererToDisplaySize(renderer)) {
      const canvas = renderer.domElement;
      camera.aspect = canvas.clientWidth / canvas.clientHeight;
      camera.updateProjectionMatrix();
    }
    lods.forEach((lod) => {
      lod.update(camera);
    });
    renderer.render(scene, camera);
  }

  function requestRenderIfNotRequested() {
    if (!renderRequested) {
      renderRequested = true;
      requestAnimationFrame(render);
    }
  }

  controls.addEventListener("change", requestRenderIfNotRequested);
  window.addEventListener("resize", requestRenderIfNotRequested);
}

main();
