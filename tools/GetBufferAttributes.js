import * as THREE from "three";
/*************************************************************************************
 * CLASS NAME:  Forest
 * DESCRIPTION:
 * NOTE:
 *
 *************************************************************************************/
class GetBufferAttributes {
  constructor(view) {
    this.group = view;
  }

  getSceneModelFaceNum() {
    const { group } = this;
    let objects = 0; // 场景模型对象
    let vertices = 0; // 模型顶点
    let triangles = 0; // 模型面片

    group.forEach((object) => {
      objects++;
      if (object.isMesh) {
        let geometry = object.geometry;
        if (geometry.isBufferGeometry && geometry.attributes.position) {
          vertices += geometry.attributes.position.count;
          if (geometry.index !== null) {
            triangles += geometry.index.count / 3;
          } else {
            triangles += geometry.attributes.position.count / 3;
          }
        }
      }
    });

    console.log(
      "模型对象数量: " + objects,
      "模型顶点数: " + vertices,
      "模型面片数: " + triangles
    );
  }
}

export { GetBufferAttributes };
