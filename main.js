import './style.css';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

/** Globals **/
const radius = 30; // Define the radius of the circular path
const numPoints = 100; // Number of points for the path
var points = {};

// Ensure canvas readjusts to window size
window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
})

document.addEventListener('keydown', event => {
    console.log(event);
    keyDownHandler(event.key);
});

function keyDownHandler(key) {
    if (!camera)
        console.log('Camera object not initialised!');

    switch (key) {
        case 'w':
            camera.position.y += 1;
            // model.rotation.x += 0.01;
            break;
        case 's':
            camera.position.y -= 1;
            // model.rotation.x -= 0.01;
            break;
        case 'd':
            camera.position.x += 1;
            // model.rotation.y += 0.01;
            break;
        case 'a':
            camera.position.x -= 1;
            // model.rotation.y -= 0.01;
            break;
        case 'e':
            camera.position.z += 1;
            // model.rotation.z += 0.01;
            break;
        case 'q':
            camera.position.z -= 1;
            // model.rotation.z -= 0.01;
            break;
        default:
            console.log('Non-specific Key Press');
            break;
    }
    console.log(camera.position);
}

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
scene.add(dLight);
dLight.position.set(0, 10, 2);

// Add lighting to the scene
const ambientLight = new THREE.AmbientLight(0xffffff, 1); // Soft white light
scene.add(ambientLight);

// Load the earth
let model;
// Load the rocket
let rocket;
// Load the .glb model
const loader = new GLTFLoader();


loader.load(
    './models/earth.glb',  // Ensure this path is correct
    (gltf) => {
        model = gltf.scene;

        // Scale the model
        model.scale.set(5, 5, 5);

        const dimensions = getModelDimensions(model);

        // Set position to be below the ground
        const belowGround = -dimensions.y / 2 - 1; // Subtract 1 or adjust as necessary
        model.position.set(0, belowGround, 0); // Adjust the Y position to below the ground


        scene.add(model);
        console.log('Model loaded successfully');
    },
    undefined,
    (error) => {
        console.error('An error happened while loading the model:', error);
    }
);


loader.load(
    //'./models/simple_rocket_ship_or_missile.glb', // Update with your rocket model path
    "./models/rocket_rotated_180X.glb",
    (gltf) => {
        rocket = gltf.scene;

        // Adjust scale based on your scene dimensions
        rocket.scale.set(3, 3, 3); // Scale the rocket model

        points = genRocketPathPoints(radius, numPoints);
        const pathObject = createPathFromPoints(points, 0xFF0000);
        scene.add(pathObject);

        scene.add(rocket);
    },
    undefined,
    (error) => {
        console.error('An error happened while loading the model:', error);
    }
);

// Grid view perspective
const gridHelper = new THREE.GridHelper(200, 50);
scene.add(gridHelper);

// mouse controls
const controls = new OrbitControls(camera, renderer.domElement);

function genRocketPathPoints(radius, numPoints) {
    // Create a circular path on the x-z plane, with gradual downward movement on the y-axis
    const points = [];
    const z = 0; // y value is unchanging
    const rocketYOffset = getModelDimensions(rocket).y / 2;
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
camera.position.set(0, -1, 35);

// Animation loop
function animate() {
    requestAnimationFrame(animate);

    // Skip frames until model is loaded
    if (!model)
        return

    // model.rotation.y += 0.001; // Step 4: Rotate the model if it's loaded
    // model.rotation.x += 0.0001;
    // model.rotation.z += 0.0001;

    const t = getScrollT(); // Get t based on scroll position
    if (rocket) {
        // Find the rocket's position along the path based on scroll percentage 't'
        const positionIndex = Math.floor(t * numPoints);
        const position = points[positionIndex]; // Get the position at 't'

        rocket.position.lerp(position, 0.1); // Update rocket's position

        // Make the rocket face the direction of motion
        const nextPoint = points[Math.min(positionIndex + 1, numPoints - 1)];
        const direction = new THREE.Vector3().subVectors(nextPoint, position).normalize();
        rocket.lookAt(position.clone().add(direction)); // Make the rocket face forward
    }

    // Zoom out effect based on scroll
    const zoomFactor = Math.max(1, 1 + (scrollY * zoomSpeed)); // Ensure it doesn't zoom in
    // camera.position.set(0, 1 * zoomFactor, 35 * zoomFactor); // Adjust the camera position
    //camera.position.set(0, 1, 35); 

    camera.lookAt(camera.position.clone().setZ(0))
    controls.update();
    renderer.render(scene, camera);

}
animate();