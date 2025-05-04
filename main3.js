import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.165.0/build/three.module.min.js";
import { OrbitControls } from "//cdn.skypack.dev/three@0.134/examples/jsm/controls/OrbitControls?min";
import { GLTFLoader } from "//cdn.skypack.dev/three@0.134/examples/jsm/loaders/GLTFLoader.js"; 

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Sets the color of the background.
renderer.setClearColor(0xfefefe);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  45,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

// Sets orbit control to move the camera around.
const orbit = new OrbitControls(camera, renderer.domElement);

// Camera positioning.
camera.position.set(6, 4, 20);
// Has to be done every time we update the camera position.
orbit.update();

const dLight = new THREE.DirectionalLight(0xffffff, 1);
scene.add(dLight);
dLight.position.set(0, 10, 2);

let rocket; // Variable to hold the rocket model

// Load the rocket model
const loader = new GLTFLoader();
loader.load(
  "./models/rocket_rotated_180X.glb",
  (gltf) => {
    rocket = gltf.scene;
    rocket.scale.set(0.5, 0.5, 0.5); // Adjust the scale as needed
    scene.add(rocket);
  },
  undefined,
  function (error) {
    console.error("Error loading rocket model:", error);
  }
);

// Path for the rocket to follow
const points = [
  new THREE.Vector3(-10, 0, 10),
  new THREE.Vector3(-5, 5, 5),
  new THREE.Vector3(0, 0, 0),
  new THREE.Vector3(5, -5, 5),
  new THREE.Vector3(10, 0, 10),
];

const path = new THREE.CatmullRomCurve3(points, true);

const pathGeometry = new THREE.BufferGeometry().setFromPoints(
  path.getPoints(50)
);
const pathMaterial = new THREE.LineBasicMaterial({ color: 0xff0000 });
const pathObject = new THREE.Line(pathGeometry, pathMaterial);
scene.add(pathObject);

function animate() {
  if (rocket) {
    // Update the position of the rocket along the path
    const time = Date.now();
    const t = ((time / 2000) % 6) / 6; 
    const position = path.getPointAt(t);
    rocket.position.copy(position);

    const tangent = path.getTangentAt(t).normalize();
    rocket.lookAt(position.clone().add(tangent));
  }


  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
animate();

window.addEventListener("resize", function () {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
