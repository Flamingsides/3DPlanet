import './style.css';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

/** Globals **/
const radius = 30; // Define the radius of the circular path
const numPoints = 100; // Number of points for the path
var points = [];

// Ensure canvas readjusts to window size
window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
})

function getModelDimensions(model) {
    // Compute the bounding box to determine its height
    const box = new THREE.Box3().setFromObject(model);
    const dimensions = new THREE.Vector3();
    box.getSize(dimensions);

    return dimensions;
}

// Initialize scene, camera, and renderer
const scene = new THREE.Scene();
scene.background = new THREE.Color().setHex(0x87CEEB);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({
    canvas: document.querySelector('#bg'),
    antialias: true,
});
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);

const dLight = new THREE.DirectionalLight(0xffffff, 1);
dLight.position.set(0, 10, 2);
scene.add(dLight);

// Add lighting to the scene
const ambientLight = new THREE.AmbientLight(0xffffff, 1); // Soft white light
scene.add(ambientLight);

const defaultOnLoad = (model, scene) => { scene.add(model); };
const defaultOnErr = (path, err) => console.log("An error occured while loading " + path + ": " + err);

async function loadModel(loader, path, scene, onLoad = defaultOnLoad, onErr = defaultOnErr) {
    try {
        const gltf = await loader.loadAsync(path);
        const model = gltf.scene;
        onLoad(model, scene);
        return model;
    } catch (err) {
        onErr(path, err);
    }

}

// Load the .glb model
const loader = new GLTFLoader();

const earthOnLoad = (earthModel, scene) => {
    // Scale the model
    console.log(earthModel);
    earthModel.scale.set(5, 5, 5);

    const dimensions = getModelDimensions(earthModel);

    // Set position to be below the ground
    const belowGround = -dimensions.y / 2 - 3; // Subtract 1 or adjust as necessary
    earthModel.position.set(0, belowGround, 0); // Adjust the Y position to below the ground

    scene.add(earthModel);
    console.log('Earth model loaded successfully');
}
const earthModel = await loadModel(loader, './models/earth.glb', scene, earthOnLoad);

const rocketOnLoad = (model, scene) => {
    // Adjust scale based on your scene dimensions
    model.scale.set(2, 2, 2); // Scale the rocket model

    points = genRocketPathPoints(radius, numPoints, model);
    const pathObject = createPathFromPoints(points, 0xFF0000);
    scene.add(pathObject);

    scene.add(model);
}
const rocketModel = await loadModel(loader, "./models/rocket_model.glb", scene, rocketOnLoad);

// Grid view perspective
// const gridHelper = new THREE.GridHelper(200, 50);
// scene.add(gridHelper);

function genRocketPathPoints(radius, numPoints, rocketModel) {
    // Create a circular path on the x-z plane, with gradual downward movement on the y-axis
    const points = [];
    const z = 0; // y value is unchanging
    const rocketYOffset = getModelDimensions(rocketModel).y / 2 - 2;
    var xStretch = 1.5, zStretch = 4;
    for (let i = 0; i <= numPoints; i++) {
        const angle = (i / numPoints) * Math.PI * 2; // Angle for the circle
        const x = -radius * (Math.cos(angle) - 1) * xStretch; // X coordinate of the point on the circle (left-right)
        const y = radius * Math.sin(angle) * zStretch + rocketYOffset;; // Y coordinate of the point on the circle (up-down)
        points.push(new THREE.Vector3(x, y, z)); // Store each point on the path
    }

    return points;
}

function createPathFromPoints(points, color) {
    // Create the curve from the rotated points
    const pathGeometry = new THREE.BufferGeometry().setFromPoints(points);
    const pathMaterial = new THREE.LineBasicMaterial({ color: color });
    const pathObject = new THREE.Line(pathGeometry, pathMaterial);

    return pathObject;
}

// Function to calculate it based on scroll position
function getScrollT() {
    // current vertical scroll position in pixels from the top of the page
    const scrollY = window.scrollY;
    //  Get the total scrollable height of the page
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;

    // Calculate 't' as a percentage (between 0 and 1)
    return scrollY / Math.max(window.innerHeight, maxScroll);
}

const zoomSpeed = 0.0007; // Define the zoom out speed
camera.position.set(0, 2, 35);
// controls.update();

// Animation loop
function animate() {
    requestAnimationFrame(animate);

    // Skip frames until model is loaded
    if (!earthModel)
        return

    // earthModel.rotation.y += 0.001; // Step 4: Rotate the model if it's loaded
    // earthModel.rotation.x += 0.0001;
    // earthModel.rotation.z += 0.0001;

    const t = getScrollT(); // Get t based on scroll position
    if (rocketModel) {
        // Find the rocket's position along the path based on scroll percentage 't'
        const positionIndex = Math.floor(t * numPoints);
        const position = points[positionIndex]; // Get the position at 't'

        rocketModel.position.lerp(position, 0.1); // Update rocket's position

        // Make the rocket face the direction of motion
        const nextPoint = points[Math.min(positionIndex + 1, numPoints - 1)];
        const direction = new THREE.Vector3().subVectors(nextPoint, position).normalize();
        rocketModel.lookAt(position.clone().add(direction)); // Make the rocket face forward
    }

    // Zoom out effect based on scroll
    const zoomFactor = Math.max(1, 1 + (scrollY * zoomSpeed)); // Ensure it doesn't zoom in
    camera.position.set(0, 1 * zoomFactor, 35 * zoomFactor); // Adjust the camera position
    // camera.position.set(0, 1, 35); 

    camera.lookAt(camera.position.clone().setZ(0))
    // controls.update();
    renderer.render(scene, camera);

}
animate();