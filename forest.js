"use strict";

import * as THREE from "three";
import { LevelofDetail } from "./LevelofDetail.js";
import { Terrain } from "./Terrain.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

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
  const planeSize = 10000;
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
            distance: 1000,
            group: gltf.scene.children,
          });
          loader.load(`${url}/0.glb`, (gltf) => {
            array.push({
              distance: 2000,
              group: gltf.scene.children,
            });
            lod.setLevels(array);
            lod.setPopulation(num);
            for (let i = 0; i < num; i++) {
              lod.setTransform(i, matrixArray[startIndex + i]);
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
