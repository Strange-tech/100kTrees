import * as THREE from "three";

/*************************************************************************************
 * CLASS NAME:  LevelofDetail
 * DESCRIPTION: Combine instancedMesh with lod instead of using THREE.LOD
 * NOTE:        Each class of LevelofDetail represents one single kind of tree,
 *              check 'treeSpecies' for detail
 *
 *************************************************************************************/
class LevelofDetail {
  constructor(scene, camera, treeSpecies) {
    this.treeSpecies = treeSpecies;
    this.numOfLevel = 0;
    this.scene = scene;
    this.camera = camera;
    this.levels = undefined;
    this.instancedMeshOfAllLevel = undefined;
    this.groupOfInstances = undefined;
    this.transformation = undefined; // 存储所有模型的变换（Matrix4），不随 update() 而改变
  }

  setLevels(array) {
    const { scene } = this;
    this.numOfLevel = array.length;
    this.levels = new Array(this.numOfLevel);
    for (let i = 0; i < this.numOfLevel; i++) {
      this.levels[i] = {
        distance: array[i].distance,
        group: array[i].group,
      };
    }
    this.instancedMeshOfAllLevel = new Array(this.numOfLevel); // array of { mesh:[], count, matrix4:[] }
    for (let i = 0; i < this.numOfLevel; i++) {
      this.instancedMeshOfAllLevel[i] = {
        meshes: [...array[i].group],
        count: 0,
        matrix4: [],
      };
    }
    this.groupOfInstances = new Array(this.numOfLevel); // array of THREE.Group(), each Group -> tree meshes in each level
    for (let i = 0; i < this.numOfLevel; i++) {
      const group = new THREE.Group();
      this.instancedMeshOfAllLevel[i].meshes.forEach((m) => {
        const instancedMesh = new THREE.InstancedMesh(
          m.geometry,
          m.material,
          0 // 暂时先使用0，只是为了占位
        );
        group.add(instancedMesh);
      });
      this.groupOfInstances[i] = group;
      scene.add(group);
    }
  }

  setPopulation(number) {
    this.transformation = new Array(number);
  }

  setTransform(index, matrix4) {
    const { transformation, treeSpecies } = this;
    const k = 0.02; // 有些glb模型本身太大，乘以缩小系数
    let scale = k;
    switch (treeSpecies) {
      case "Macrophanerophytes":
        scale = Math.random() * 0.5 + 1.5; // (1.5, 2)
        break;
      case "Broadleaf":
        scale = Math.random() * 0.5 + 1; // (1, 1.5)
        break;
      case "Bamboo":
        scale = Math.random() * 0.3 + 0.5; // (0.5, 0.8)
        break;
      case "bullshit":
        scale = k * (Math.random() * 1 + 1.5); // (1.5, 2.5)
        break;
      case "fuckyou":
        scale = k * (Math.random() * 1 + 1); // (1, 2)
        break;
      case "idiot":
        scale = k * (Math.random() * 1 + 1); // (1, 2)
        break;
      case "nerd":
        scale = k * (Math.random() * 5 + 10); // (10, 15)
        break;
      case "coward":
        scale = k * (Math.random() * 1 + 1); // (1, 2)
        break;
      case "fool":
        scale = k * (Math.random() * 1 + 1); // (1, 2)
        break;
      default:
        break;
    }
    matrix4.elements[0] = scale;
    matrix4.elements[5] = scale;
    matrix4.elements[10] = scale;
    transformation[index] = matrix4;
  }

  getDistanceLevel(dist) {
    const { levels } = this;
    const length = levels.length;
    for (let i = 0; i < length; i++) {
      if (dist <= levels[i].distance) {
        return i;
      }
    }
    return length - 1;
  }

  getSpecies() {
    return this.treeSpecies;
  }

  update(camera) {
    this.camera = camera;

    const {
      instancedMeshOfAllLevel,
      groupOfInstances,
      transformation,
      numOfLevel,
    } = this;

    //clear
    for (let i = 0; i < numOfLevel; i++) {
      instancedMeshOfAllLevel[i].count = 0;
      instancedMeshOfAllLevel[i].matrix4 = [];
    }

    let obj_position, cur_dist, cur_level;
    const cam_position = camera.position;
    transformation?.forEach((t) => {
      obj_position = new THREE.Vector3(
        t.elements[12],
        t.elements[13],
        t.elements[14]
      );
      cur_dist = obj_position.distanceTo(cam_position);
      cur_level = this.getDistanceLevel(cur_dist);
      // console.log(cur_dist, cur_level);
      instancedMeshOfAllLevel[cur_level].count++;
      instancedMeshOfAllLevel[cur_level].matrix4.push(t);
    });

    // console.log("instancedMeshOfAllLevel:", instancedMeshOfAllLevel);
    for (let i = 0; i < numOfLevel; i++) {
      const obj = instancedMeshOfAllLevel[i]; // obj: { meshes:[], count, matrix4:[] }
      for (let j = 0; j < groupOfInstances[i].children.length; j++) {
        const instancedMesh = new THREE.InstancedMesh(
          obj.meshes[j].geometry,
          obj.meshes[j].material,
          obj.count
        );
        // instancedMesh.castShadow = true;
        // instancedMesh.receiveShadow = true;
        for (let k = 0; k < obj.count; k++) {
          instancedMesh.setMatrixAt(k, obj.matrix4[k]);
        }
        groupOfInstances[i].children[j] = instancedMesh;
      }
    }
    // console.log("groupOfInstances:", groupOfInstances);
  }
}

export { LevelofDetail };
