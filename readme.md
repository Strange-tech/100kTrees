# 100k Trees

## Abstract

### Key Words

- ThreeJs, webGL
- Large-scale, lightweight, web app
- Computer Graphics

### How I Made It

1. Model simplification: Draco gltfpipeline
2. LOD: My version refering to THREE.LOD
3. Instantiation: THREE.InstancedMesh
4. Frustum culling
5. Space management: Quadtree

## 简介

最简单的场景往往蕴含丰富的优化算法 😎<br>

如题，此 Web 场景能容纳十万颗树木，并能以 60fps 的帧率在 PC 浏览器中流畅地运行。<br>

树木模型为 Unity 建模得到，转换为 glb-draco 格式作为前端资源文件。<br>

也许容纳一棵树木的场景很容易实现，你只需要调用 GLTFLoader 即可。但是随着数据规模的增加，很多方法都需要被容纳进来以满足“令人接受”的效果。否则，场景的帧率会非常低，网页甚至会崩溃 😢<br>

最广泛且直接的方法是使用 THREE.InstancedMesh，这能有效减少 drawcall 次数，充分发挥 GPU 的性能 💪<br>

更加有效的方法是为每棵树木模型添加层次化细节 LOD，远处的树木采用简化的模型替代。为了不太影响观感，你可以设置多层次细节，一般为远、中、近三层，因此你需要向美工索要三份不同精度的模型。<br>

另一种比较强力的方法是视锥剔除，这可以剔除掉所有当前视角看不到的树木，减轻 CPU 与 GPU 的负担，进一步提高帧率。但是请注意，这与 Threejs 提供的 camera 不同，camera 虽然内置类似的功能，但是我们要做的是在实例化阶段的剔除。更多细节请参考 LevelofDetail.js 中的代码。此外，仅仅是上述视锥剔除仍然存在一个问题：用户如果快速转动视角，会看到边缘因为来不及刷新而导致的短暂空白，这个问题可以用很精妙的方法解决，代码不超过 5 行 😝<br>

四叉树是空间管理中优良的数据结构，在这里它被用于生成树木的安放位置：树木随机化的位置不能距离彼此太近。通俗的比喻，每棵树木就像一个原子，彼此由于斥力无法靠的太近。<br>

综上，就是此项目用到的全部优化方法。也许你会疑问，THREE.LOD 不能与 THREE.InstancedMesh 完美地结合起来，在 Threejs 官网提供的源码中，二者似乎是不同的逻辑 🤔。确实如此，所以我尝试把二者结合起来了，虽然有些代码逻辑看起来有点蠢（也许你能很轻易地发现），但最终效果还不错 🤣

## 走马观花

![全局](/resources/images/md/00.22.52.png "optional title")
![局部1](/resources/images/md/00.23.10.png "optional title")
![局部2](/resources/images/md/00.23.31.png "optional title")
![局部3](/resources/images/md/00.24.08.png "optional title")
![局部4](/resources/images/md/00.24.27.png "optional title")
