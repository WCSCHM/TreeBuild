import * as THREE from "three";

function random(value) {
  return value * Math.random() * 2 - value;
}

class FlowerBuilder {
  constructor() {
    this.flower = new THREE.Group();
  }

  createLeaf() {
    let colors = [];

    const indices = [];
    const start = new THREE.Vector3(0, 0, 0);
    const end = new THREE.Vector3(0, 2, 0);
    const p1 = new THREE.Vector3(-0.5, 1, 0.5);
    const p2 = new THREE.Vector3(0.5, 1, 0.5);

    const curve = new THREE.CatmullRomCurve3([start, end]);
    const curve1 = new THREE.QuadraticBezierCurve3(start, p1, end);
    const curve2 = new THREE.QuadraticBezierCurve3(start, p2, end);

    const curvePath = new THREE.CurvePath();
    curvePath.curves.push(curve1, curve, curve2);
    const pointsArr = curvePath.getPoints(8);

    const segment = 8;
    for (let i = 0; i < segment; i++) {
      const v0 = i + 1;
      const v1 = i + (segment + 1);
      const v2 = i + (segment + 1) * 2 + 1;
      indices.push(v1, v1 + 1, v0);
      indices.push(v0 + 1, v0, v1 + 1);
      indices.push(v1, v2, v1 + 1);
      indices.push(v2, v2 + 1, v1 + 1);
    }

    for (let j = 0; j < 3; j++) {
      for (let i = 0; i < segment + 1; i++) {
        const r = 43 + ((89 - 43) * pointsArr[i + j * (segment + 1)].y) / 2;
        const g = 111 + ((133 - 111) * pointsArr[i + j * (segment + 1)].y) / 2;
        const b = 18 + ((93 - 18) * pointsArr[i + j * (segment + 1)].y) / 2;
        colors.push(r / 255, g / 255, b / 255);
      }
    }

    const geometry = new THREE.BufferGeometry().setFromPoints(pointsArr);
    geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
    geometry.setIndex(indices);
    const material = new THREE.MeshBasicMaterial({
      vertexColors: true,
      //   color: "green",
      side: THREE.DoubleSide,
    });
    return new THREE.Mesh(geometry, material);
  }

  createStem() {
    const start = new THREE.Vector3(0, 0, 0);
    const end = new THREE.Vector3(0, 2, 0);
    const p1 = new THREE.Vector3(0, 0.5, 0);
    const p2 = new THREE.Vector3(0, 1.5, 0);

    const offset = 0.5;
    p1.x = random(offset);
    p1.z = random(offset);
    p2.x = random(offset);
    p2.z = random(offset);

    const curve = new THREE.CubicBezierCurve3(start, p1, p2, end);

    const leaf1 = this.createLeaf();
    const leaf2 = this.createLeaf();
    const leaf3 = this.createLeaf();
    const points = curve.getPoints(8);
    const base1 = points[2];
    const base2 = points[4];
    const base3 = points[6];

    const translation1 = new THREE.Vector3().subVectors(base1, start);
    const translation2 = new THREE.Vector3().subVectors(base2, start);
    const translation3 = new THREE.Vector3().subVectors(base3, start);

    leaf1.position.copy(translation1);
    leaf2.position.copy(translation2);
    leaf3.position.copy(translation3);

    const scaleSize = 0.5;
    leaf1.scale.set(scaleSize + 0.1, scaleSize + 0.1, scaleSize + 0.1);
    leaf2.scale.set(scaleSize, scaleSize, scaleSize);
    leaf3.scale.set(scaleSize - 0.1, scaleSize - 0.1, scaleSize - 0.1);

    leaf1.rotateY((Math.PI / 3) * 2);
    leaf3.rotateY((-Math.PI / 3) * 2);

    const angle = (Math.PI / 180) * 60 + random((Math.PI / 180) * 15);
    leaf1.rotateX(-angle + (Math.PI / 180) * 15);
    leaf2.rotateX(-angle);
    leaf3.rotateX(-angle - (Math.PI / 180) * 15);

    this.flower.add(leaf1, leaf2, leaf3);

    const radius_noisy = 0.01;
    const radius = 0.1 + random(radius_noisy);
    const tubegeometry = new THREE.TubeGeometry(curve, 8, radius, 8, false);
    const material = new THREE.MeshBasicMaterial({
      side: THREE.DoubleSide,
      color: 0x234010,
    });
    const stem = new THREE.Mesh(tubegeometry, material);
    this.flower.add(stem);
  }

  createFlower(petalNum) {
    let colors = [];
    const indices = [];

    const start = new THREE.Vector3(0, 0, 0);
    const end = new THREE.Vector3(0, 2, 0.7);
    const p1 = new THREE.Vector3(-0.5, 2, 0.6);
    const p2 = new THREE.Vector3(0.5, 2, 0.6);
    const p3 = new THREE.Vector3(0, 2, 0);

    const geometry = new THREE.BufferGeometry();
    setAttribute();

    function setAttribute() {
      const curve1 = new THREE.QuadraticBezierCurve3(start, p1, end);
      const curve2 = new THREE.QuadraticBezierCurve3(start, p2, end);
      const curve3 = new THREE.QuadraticBezierCurve3(start, p3, end);

      const curvePath = new THREE.CurvePath();
      curvePath.curves.push(curve1, curve3, curve2);

      const segment = 8;
      const pointsArr = curvePath.getPoints(segment);

      for (let j = 0; j < 3; j++) {
        for (let i = 0; i < segment + 1; i++) {
          const percent = 155 / 233;
          if (i >= 2) {
            const r =
              100 + (233 * percent * pointsArr[i + j * (segment + 1)].y) / 2;
            const g =
              100 + (233 * percent * pointsArr[i + j * (segment + 1)].y) / 2;
            const b =
              100 + (233 * percent * pointsArr[i + j * (segment + 1)].y) / 2;
            colors.push(r / 255, g / 255, b / 255);
          } else {
            const r =
              188 + ((255 - 188) * pointsArr[i + j * (segment + 1)].y) / 2;
            const g =
              161 + ((199 - 161) * pointsArr[i + j * (segment + 1)].y) / 2;
            const b = 6 + ((58 - 6) * pointsArr[i + j * (segment + 1)].y) / 2;
            colors.push(r / 255, g / 255, b / 255);
          }
        }
      }

      for (let i = 0; i < segment; i++) {
        const v0 = i + 1;
        const v1 = i + (segment + 1);
        const v2 = i + (segment + 1) * 2 + 1;
        indices.push(v1, v1 + 1, v0);
        indices.push(v0 + 1, v0, v1 + 1);
        indices.push(v1, v2, v1 + 1);
        indices.push(v2, v2 + 1, v1 + 1);
      }

      geometry.setFromPoints(pointsArr);
      geometry.setIndex(indices);
      geometry.setAttribute(
        "color",
        new THREE.Float32BufferAttribute(colors, 3),
      );
    }

    const material = new THREE.MeshBasicMaterial({
      vertexColors: true,
      side: THREE.DoubleSide,
    });
    const petal = new THREE.Mesh(geometry, material);
    const petals = new THREE.Group();
    petalNum = 16;
    for (let i = 0; i < Math.PI * 2; i += (Math.PI * 2) / petalNum) {
      const object = petal.clone();
      const waveAngle = (Math.PI / 180) * 5;
      object.rotateY(random(waveAngle));
      const scaleY = 0.05;
      object.scale.set(10, 1 + random(scaleY), 1);
      object.rotateZ(i);
      petals.add(object);
    }
    petals.translateY(2);
    const scaleSize = 0.5 + random(0.1);
    petals.scale.set(scaleSize, scaleSize, scaleSize);
    const angle = (Math.PI / 180) * 30;
    petals.rotateZ(random(angle));
    petals.rotateX(-Math.PI / 2 + random(angle));
    this.flower.add(petals);
  }

  buildFlower() {
    this.createStem();
    this.createFlower(16);
    return this.flower;
  }
}

export { FlowerBuilder };
