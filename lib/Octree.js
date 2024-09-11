import * as THREE from "three";

class Octree {
  constructor(box3, n, depth) {
    this.box = box3;
    this.capacity = n;
    this.divided = false;
    this.elements = []; // [{id, transform}, ... , {}]
    this.children = [];
    this.depth = depth;
  }

  subdivide() {
    const { box, capacity, depth } = this;
    let size = new THREE.Vector3().subVectors(box.max, box.min).divideScalar(2);
    let arr = [
      [0, 0, 0],
      [size.x, 0, 0],
      [0, 0, size.z],
      [size.x, 0, size.z],
      [0, size.y, 0],
      [size.x, size.y, 0],
      [0, size.y, size.z],
      [size.x, size.y, size.z],
    ];
    for (let i = 0; i < 8; i++) {
      let min = new THREE.Vector3(
        box.min.x + arr[i][0],
        box.min.y + arr[i][1],
        box.min.z + arr[i][2],
      );
      let max = new THREE.Vector3().addVectors(min, size);
      let newbox = new THREE.Box3(min, max);
      this.children.push(new Octree(newbox, capacity, depth + 1));
    }
    this.divided = true;
  }

  insert(id, transform) {
    const { box, elements, capacity, divided, children } = this;
    if (
      !box.containsPoint(new THREE.Vector3().setFromMatrixPosition(transform))
    )
      return false;
    if (elements.length < capacity) {
      elements.push({ id: id, transform: transform });
      return true;
    } else {
      if (!divided) this.subdivide();
      for (let i = 0; i < children.length; i++) {
        if (children[i].insert(id, transform)) return true;
      }
    }
  }

  queryByBox(boxRange, found = []) {
    if (!this.box.intersectsBox(boxRange)) {
      return found;
    } else {
      for (let el of this.elements) {
        if (
          boxRange.containsPoint(
            new THREE.Vector3().setFromMatrixPosition(el.transform),
          )
        ) {
          found.push(el);
        }
      }
      if (this.divided) {
        this.children.forEach((child) => {
          child.queryByBox(boxRange, found);
        });
      }
      return found;
    }
  }

  queryBySphere(
    sphereRange,
    boundingBox = sphereRange.getBoundingBox(new THREE.Box3()),
    found = [],
  ) {
    if (!this.box.intersectsBox(boundingBox)) {
      return found;
    } else {
      for (let el of this.elements) {
        if (
          sphereRange.containsPoint(
            new THREE.Vector3().setFromMatrixPosition(el.transform),
          )
        ) {
          found.push(el);
        }
      }
      if (this.divided) {
        this.children.forEach((child) => {
          child.queryBySphere(sphereRange, boundingBox, found);
        });
      }
      return found;
    }
  }

  queryByFrustum(frustum, found = []) {
    if (!frustum.intersectsBox(this.box)) {
      return found;
    } else {
      for (let el of this.elements) {
        if (
          frustum.containsPoint(
            new THREE.Vector3().setFromMatrixPosition(el.transform),
          )
        ) {
          found.push(el);
        }
      }
      if (this.divided) {
        this.children.forEach((child) => {
          child.queryByFrustum(frustum, found);
        });
      }
      return found;
    }
  }

  display(scene) {
    // 叶子结点
    if (!this.divided && this.elements.length > 0) {
      scene.add(new THREE.Box3Helper(this.box, 0x00ff00));
      return;
    }
    this.children.forEach((child) => {
      child.display(scene);
    });
  }
}

export { Octree };
