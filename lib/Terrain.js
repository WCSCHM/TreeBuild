import * as THREE from "three";
import { ImprovedNoise } from "three/examples/jsm/math/ImprovedNoise.js";

/*************************************************************************************
 * CLASS NAME:  Terrain
 * DESCRIPTION: Generate terrain with rise and fall
 * NOTE:
 *
 *************************************************************************************/
class Terrain {
  constructor(length, width, lengthVertex, widthVertex) {
    this.length = length;
    this.width = width;
    this.lengthVertex = lengthVertex;
    this.widthVertex = widthVertex;
    this.quality = 1; // improved Perlin noise's quality, default is 1

    this.planeGeometry = new THREE.PlaneGeometry(
      length,
      width,
      lengthVertex - 1,
      widthVertex - 1
    );
    this.planeGeometry.rotateX(-Math.PI / 2);

    this.planeMaterial; // default material

    this.vertices = {
      length: lengthVertex,
      width: widthVertex,
      array: this.planeGeometry.attributes.position.array, // array of 3 * lengthVertex * widthVertex
    };
  }

  setImprovedNoise(quality) {
    this.quality = quality;

    const { lengthVertex, widthVertex, vertices } = this;
    const size = lengthVertex * widthVertex;
    const perlin = new ImprovedNoise();
    const data = new Uint8Array(size);

    let z = Math.random() * 100;
    for (let j = 0; j < 4; j++) {
      for (let i = 0; i < size; i++) {
        let x = i % widthVertex;
        let y = ~~(i / widthVertex);
        data[i] += Math.abs(
          perlin.noise(x / quality, y / quality, z) * quality * 1.75
        );
      }
      quality *= 5;
    }

    for (let i = 0, j = 0, l = vertices.array.length; i < l; i++, j += 3) {
      vertices.array[j + 1] = data[i] * 2;
    }

    return vertices;
  }

  loadTexture(base_url, normal_url) {
    const textureLoader = new THREE.TextureLoader();
    let base_texture = textureLoader.load(base_url);
    let normal_texture = textureLoader.load(normal_url);
    base_texture.colorSpace = THREE.SRGBColorSpace;
    base_texture.wrapS = normal_texture.wrapS = THREE.RepeatWrapping;
    base_texture.wrapT = normal_texture.wrapT = THREE.RepeatWrapping;
    let repeatsInwidth = 256,
      repeatsInlength = 256;
    base_texture.repeat.set(repeatsInlength, repeatsInwidth);
    normal_texture.repeat.set(repeatsInlength, repeatsInwidth);
    this.planeMaterial = new THREE.MeshPhongMaterial({
      // color: "white",
      map: base_texture,
      normalMap: normal_texture,
      // wireframe: true,
    });
  }

  getBoundingBox() {
    this.planeGeometry.computeBoundingBox();
    return this.planeGeometry.boundingBox;
  }

  getMesh() {
    return new THREE.Mesh(this.planeGeometry, this.planeMaterial);
  }
}

export { Terrain };
