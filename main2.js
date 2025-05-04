import './style.css';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

// Initialize scene, camera, and renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({
    canvas: document.querySelector('#bg'),
    antialias: true,
});
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);

// Lighting setup
const dLight = new THREE.DirectionalLight(0xffffff, 1);
scene.add(dLight);
dLight.position.set(0, 10, 2);

const ambientLight = new THREE.AmbientLight(0xffffff, 1); // Soft white light
scene.add(ambientLight);

// Load the Earth model
let earthModel;
const loader = new GLTFLoader();
loader.load(
    './models/earth.glb',  // Ensure the path is correct
    (gltf) => {
        earthModel = gltf.scene;
        earthModel.scale.set(5, 5, 5);
        earthModel.position.set(0, -5, 0); // Position it below the origin
        scene.add(earthModel);
    },
    undefined,
    (error) => {
        console.error('Error loading Earth model:', error);
    }
);

// Load the rocket model
let rocketModel;
loader.load(
    './models/rocket_rotated_180X.glb',  // Update with your rocket model path
    (gltf) => {
        rocketModel = gltf.scene;
        rocketModel.scale.set(2, 2, 2); // Scale rocket appropriately
        rocketModel.position.set(0, -5, 10);  // Position the rocket to start from above the Earth
        scene.add(rocketModel);
    },
    undefined,
    (error) => {
        console.error('Error loading Rocket model:', error);
    }
);

// Define the path for the rocket to move along (spiral upwards)
const points = [];
const radius = 10;  // Radius of the circular path
const numPoints = 200;  // Number of points along the path
const heightIncrement = 0.05;  // Vertical speed

for (let i = 0; i <= numPoints; i++) {
    const angle = (i / numPoints) * Math.PI * 2;
    const x = radius * Math.cos(angle);
    const z = radius * Math.sin(angle);
    const y = heightIncrement * i;

    points.push(new THREE.Vector3(x, y, z));
}

const path = new THREE.CatmullRomCurve3(points);

// Create a geometry to visualize the path
const pathGeometry = new THREE.BufferGeometry().setFromPoints(path.getPoints(50));
const pathMaterial = new THREE.LineBasicMaterial({ color: 0xff0000 });
const pathObject = new THREE.Line(pathGeometry, pathMaterial);
scene.add(pathObject);

// Mouse controls
const controls = new OrbitControls(camera, renderer.domElement);

// Camera setup
camera.position.set(0, 10, 35); // Set camera to a good position to view both Earth and Rocket
camera.lookAt(0, 0, 0);

// Animation loop
function animate() {
    requestAnimationFrame(animate);

    const t = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)); // Scroll-based t value

    // Move the rocket along the path
    if (rocketModel) {
        const position = path.getPointAt(t); // Get rocket's position on the path
        rocketModel.position.copy(position);

        // Make the rocket face forward along the path
        const tangent = path.getTangentAt(t).normalize();
        rocketModel.lookAt(position.clone().add(tangent));
    }

    controls.update();
    renderer.render(scene, camera);
}

animate();
