import './style.css';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

import { getModelDimensions, loadModel, genRocketPathPoints, createPathFromPoints, getScrollT } from './helper';

/** Globals **/
const radius = 30; // Define the radius of the circular path
const numPoints = 100; // Number of points for the path
var points = [];

// Ensure canvas readjusts to window size
window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
})

// Initialize scene, camera, and renderer
const scene = new THREE.Scene();
scene.background = new THREE.Color().setHex(0x000000);

const camera = new THREE.OrthographicCamera(
    window.innerWidth / -32, window.innerWidth / 32,
    window.innerHeight / 32, window.innerHeight / -32,
    1, 500
);
camera.position.set(0, 2, 20);

const renderer = new THREE.WebGLRenderer({
    canvas: document.querySelector('#bg'),
    antialias: true,
});
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.LinearSRGBColorSpace;

// Add lighting to the scene
const ambientLight = new THREE.AmbientLight(0xffffff, 2.5); // Soft white light
scene.add(ambientLight);

// Load the .glb model
const loader = new GLTFLoader();

// Function to run on successful loading of rocket model
const rocketOnLoad = (model, scene) => {
    // Shrink rocket slightly
    model.scale.set(0.75, 0.75, 0.75);

    // Generate an array of points along the rocket's path
    points = genRocketPathPoints(radius, numPoints, model);

    model.position.clone(points[0]);

    // Convert to visible line mesh (REMOVABLE)
    const pathObject = createPathFromPoints(points, 0xFF0000);
    scene.add(pathObject);

    // Add model to the scene
    scene.add(model);
}
const rocketModel = await loadModel(loader, "./models/rocket_model_dark.glb", scene, rocketOnLoad);

// Load texture, normal map, and specular map for the sphere to make Earth
const earthTexture = new THREE.TextureLoader().load("images/earth-texture-4.jpg");
const earthNormal = new THREE.TextureLoader().load("images/earth-normal-map.tif");
const earthSpecular = new THREE.TextureLoader().load("images/earth-specular-map-2k.tif");
const earth = new THREE.Mesh(
    new THREE.SphereGeometry(16),
    new THREE.MeshPhongMaterial({
        map: earthTexture,
        normalMap: earthNormal,
        specularMap: earthSpecular
    })
);

// Set initial position and rotation of the Earth then add to scene
earth.rotation.x += Math.PI / 16;
earth.rotation.y -= Math.PI;
earth.position.y -= getModelDimensions(earth).y / 3;

scene.add(earth);

// Add green glow behind planet
const glowMesh = new THREE.Mesh(
    new THREE.CircleGeometry(27, 32),
    new THREE.MeshBasicMaterial({
        alphaMap: new THREE.TextureLoader().load("images/radial-gradient.jpg"),
        color: 0x70D370,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending
    })
);

// Move glowMesh to be behind Earth, then add to scene
glowMesh.position.copy(earth.position).setZ(-30);
scene.add(glowMesh);

// Animation loop
function animate() {
    requestAnimationFrame(animate);

    // Skip frames until model is loaded
    if (!earth)
        return

    // Rotate loaded earth model every frame
    earth.rotation.y += 0.001;

    // Get scroll position
    const t = getScrollT();

    // If rocket model has been loaded
    if (rocketModel) {
        // Find the rocket's next position along the path
        // based on scroll percentage 't'
        const positionIndex = Math.floor(t * numPoints);
        let position = points[positionIndex];

        // Update rocket's position gradually to new position
        rocketModel.position.lerp(position, 0.1);

        // Update camera position to follow rocket around
        const camPosUpdate = position.clone().setZ(camera.position.z);
        camera.position.lerp(camPosUpdate, 0.1);

        // Make the rocket face the direction of motion
        const nextPoint = points[Math.min(positionIndex + 1, numPoints - 1)];
        const direction = new THREE.Vector3().subVectors(nextPoint, position).normalize();
        rocketModel.lookAt(position.clone().add(direction));
    }

    renderer.render(scene, camera);
}

animate();