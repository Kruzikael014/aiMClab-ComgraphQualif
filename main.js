import * as THREE from "./three.js/build/three.module.js";
import { OrbitControls } from "./three.js/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "./three.js/examples/jsm/loaders/GLTFLoader.js";
import { FontLoader } from "./three.js/examples/jsm/loaders/FontLoader.js";
import { TextGeometry } from "./three.js/examples/jsm/geometries/TextGeometry.js";

const FOV = 45;
const RATIO = window.innerWidth / window.innerHeight;
const NEAR = 1;
const FAR = 1000;
const VIEWSIZE = 10;
const MAXITEMS = 3;

// Game stat
let score = 0;
let shotsFired = 0;
let hits = 0;
let accuracy = 0;

// Sound system
const listener = new THREE.AudioListener();
const audioLoader = new THREE.AudioLoader();
let vandal = "./Assets/vandal.mp3";
let primeVandal = "./Assets/primeVandal.mp3";
let currVandal = vandal;

var scene, renderer, mainCamera, secondaryCamera, currentCamera, controls;
var [posX, posY, posZ] = [0, 0, 0];
var itemCount = 0;

function renderRenderer() {
  if (itemCount < MAXITEMS) {
    getRandomShape();
  }
  renderer.render(scene, currentCamera);
  controls.update();
  requestAnimationFrame(renderRenderer);
}

function loadSkyBox() {
  let textureLoader = new THREE.TextureLoader();
  let boxMaterialArr = [
    new THREE.MeshBasicMaterial({
      map: textureLoader.load("./Assets/daylight_box_right.jpg"),
      side: THREE.DoubleSide,
    }),
    new THREE.MeshBasicMaterial({
      map: textureLoader.load("./Assets/daylight_box_left.jpg"),
      side: THREE.DoubleSide,
    }),
    new THREE.MeshBasicMaterial({
      map: textureLoader.load("./Assets/daylight_box_top.jpg"),
      side: THREE.DoubleSide,
    }),
    new THREE.MeshBasicMaterial({
      map: textureLoader.load("./Assets/daylight_box_bottom.jpg"),
      side: THREE.DoubleSide,
    }),
    new THREE.MeshBasicMaterial({
      map: textureLoader.load("./Assets/daylight_box_front.jpg"),
      side: THREE.DoubleSide,
    }),
    new THREE.MeshBasicMaterial({
      map: textureLoader.load("./Assets/daylight_box_back.jpg"),
      side: THREE.DoubleSide,
    }),
  ];
  let boxGeo = new THREE.BoxGeometry(1000, 1000, 1000);
  let boxMesh = new THREE.Mesh(boxGeo, boxMaterialArr);
  scene.add(boxMesh);
}

function getRandomShape() {
  if (itemCount < MAXITEMS) {
    let shape = new THREE.Mesh(
      new THREE.SphereGeometry(0.65, 64, 64),
      new THREE.MeshPhongMaterial({ color: 0x00f7f7 })
    );

    shape.position.set(
      Math.random() * 18 - 10, // random x position between -10 and 10
      Math.random() * 3 + 1, // random y position between -5 and 5
      -10 // z position in front of the camera
    );
    shape.castShadow = true;
    scene.add(shape);
    itemCount++;
  }
}

function updateScore() {
  const scoreEl = document.getElementById("score");
  scoreEl.textContent = `Score: ${score}`;
}

function updateAccuracy() {
  const accuracyEl = document.getElementById("accuracy");
  accuracyEl.textContent = `Accuracy: ${(accuracy * 100).toFixed(2)}%`;
}

function onShoot(event) {
  const mouse = new THREE.Vector2(
    (event.clientX / window.innerWidth) * 2 - 1,
    -(event.clientY / window.innerHeight) * 2 + 1
  );

  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(mouse, currentCamera);

  const intersects = raycaster.intersectObjects(scene.children);

  if (intersects.length > 0) {
    const hitObject = intersects[0].object;

    if (hitObject.geometry.type == "CylinderGeometry") {
      currVandal = vandal;
      return;
    } else if (hitObject.geometry.type == "ConeGeometry") {
      currVandal = primeVandal;
      return;
    }

    if (hitObject.geometry.type === "SphereGeometry") {
      scene.remove(hitObject);
      itemCount--;
      score += 10;
      hits++;
    } else {
      score -= 5;
    }

    shotsFired++;
    accuracy = hits / shotsFired;
    const hitSound = new THREE.Audio(listener);
    audioLoader.load(currVandal, function (buffer) {
      hitSound.setBuffer(buffer);
      hitSound.setLoop(false);
      hitSound.setVolume(0.5);
      hitSound.play();
    });
    updateScore();
    updateAccuracy();
  }
}

(function initDefault() {
  posX = 0;
  posY = 0;
  posZ = 10;
  scene = new THREE.Scene();
  renderer = new THREE.WebGLRenderer({
    antialias: true,
  });
  mainCamera = new THREE.OrthographicCamera(
    (VIEWSIZE * RATIO) / -2,
    (VIEWSIZE * RATIO) / 2,
    VIEWSIZE / 2,
    VIEWSIZE / -2,
    NEAR,
    FAR
  );
  secondaryCamera = new THREE.PerspectiveCamera(FOV, RATIO, NEAR, FAR);

  currentCamera = mainCamera;
  currentCamera.position.set(posX, posY, posZ);
  currentCamera.lookAt(0, 0, 0);

  secondaryCamera.position.set(posX, posY, posZ);

  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  document.body.appendChild(renderer.domElement);
  controls = new OrbitControls(secondaryCamera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
})();

(function setWindowAction() {
  window.addEventListener("keyup", (e) => {
    if (e.key == " ") {
      currentCamera =
        currentCamera == mainCamera ? secondaryCamera : mainCamera;
    }
  });
  window.addEventListener("click", onShoot);
})();

function loadPlane() {
  const plane = new THREE.Mesh(
    new THREE.PlaneGeometry(50, 50),
    new THREE.MeshPhongMaterial({
      color: 0x9b7653,
      side: THREE.DoubleSide,
    })
  );
  plane.rotation.x = -Math.PI / 2;
  plane.position.y = -1;
  plane.receiveShadow = true;
  console.log("PLane receive shadow :", plane.receiveShadow);
  scene.add(plane);
}

function loadModel() {
  var gltfLoader = new GLTFLoader().load(
    "./Assets/tr_guerilla/scene.gltf",
    (obj) => {
      let model = obj.scene;
      model.scale.set(0.06, 0.06, 0.06);
      model.position.set(0, -1, 10);
      model.rotation.set(0, Math.PI, 0);
      model.castShadow = true;
      scene.add(model);
    }
  );
}

function loadOption() {
  new FontLoader().load(
    "./three.js/examples/fonts/gentilis_bold.typeface.json",
    (font) => {
      let fontGeo = new TextGeometry("Vandal or Prime Vandal", {
        font: font,
        size: 0.5,
        height: 0.5,
      });
      let fontMaterial = new THREE.MeshNormalMaterial();
      let fontMesh = new THREE.Mesh(fontGeo, fontMaterial);
      fontMesh.position.set(4, 5, 10);
      fontMesh.rotation.set(0, Math.PI / 1, 0);
      scene.add(fontMesh);
    }
  );
  let cylinder = new THREE.Mesh(
    new THREE.CylinderGeometry(1, 1, 2.5, 64),
    new THREE.MeshNormalMaterial()
  );
  cylinder.position.set(4, 1, 10);
  cylinder.castShadow = true;
  scene.add(cylinder);
  let cone = new THREE.Mesh(
    new THREE.ConeGeometry(1.5, 2, 64),
    new THREE.MeshNormalMaterial()
  );
  cone.position.set(-4, 1, 10);
  cone.castShadow = true;
  scene.add(cone);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.4);
  directionalLight.position.x = 4;
  directionalLight.position.y = 3;
  directionalLight.position.z = 11;

  directionalLight.target = cylinder;
  directionalLight.castShadow = true;
  console.log("cylinder castShadow :", cylinder.castShadow);
  console.log("directionalLight castShadow :", directionalLight.castShadow);
  console.log("renderer shadowmap :", renderer.shadowMap.enabled);
  // const dirLightHelper = new THREE.DirectionalLightHelper(directionalLight);

  scene.add(directionalLight);
  // scene.add(dirLightHelper);
}

// Start here
controls.update();
// Set plane for the floor
loadPlane();
// set the skybox
loadSkyBox();
// Load the 3d model
loadModel();
// set first light
const ambientLight = new THREE.AmbientLight(0xffffff, 0.1);
// scene.add(ambientLight);
// load option
loadOption();

// set second light
const spotLight = new THREE.SpotLight(0xffffff, 5, 100, 45);
spotLight.position.z = 30;
spotLight.position.y = 15;
spotLight.castShadow = true;
scene.add(spotLight);

// End here

renderRenderer();

window.onresize = () => {
  let width = window.innerWidth;
  let height = window.innerHeight;
  renderer.setSize(width, height);
  currentCamera.aspect = width / height;
  currentCamera.updateProjectionMatrix();
  renderRenderer();
};
/*
Criteria
 1.	Bikin environment (tema bebas, sebisa mungkin berbeda tiap orang) V
 2.	Minimal ada 5 jenis geometry
  - SphereGeometry V
  - PlaneGeometry  V
  - TextGeometry V
  - CylinderGeometry V
  - ConeGeometry V
 3.	Minimal ada 3 jenis property material
  - MeshPhong material V
  - MeshBasic material V
  - MeshNormal material V
 4.	Minimal ada 2 jenis light V
  - Ambient light V
  - Spot light V
 5.	Ada shadow V
 6.	Minimal dua camera (bisa switch camera) V
 7.	Ada raycast V
 8.	Ada 3D model V
 9.	Ada skybox V
 */
