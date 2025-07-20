import './style.css';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

// Ensure canvas readjusts to window size
window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
})

// Initialize scene, camera, and renderer
const scene = new THREE.Scene();
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

        // Compute the bounding box to determine its height
        const box = new THREE.Box3().setFromObject(model);
        const size = new THREE.Vector3();
        box.getSize(size);

        // Set position to be below the ground
        const belowGround = -size.y / 2 - 1; // Subtract 1 or adjust as necessary
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

// // Define the path using CatmullRomCurve3 for a smooth curve
// const points = new THREE.CatmullRomCurve3([
//   new THREE.Vector3(10, 0, 10),
//   new THREE.Vector3(10, 1, 10),
// ]);

// const pathGeometry = new THREE.BufferGeometry().setFromPoints(
//   points.getPoints(50)
// );
// const pathMaterial = new THREE.LineBasicMaterial({ color: 0xff0000 });
// const pathObject = new THREE.Line(pathGeometry, pathMaterial);
// scene.add(pathObject);

const radius = 30; // Define the radius of the circular path
const numPoints = 100; // Number of points for the path

// Create a circular path on the x-z plane, with gradual downward movement on the y-axis
const points = [];
const y = 0; // y value is unchanging
for (let i = 0; i <= numPoints; i++) {
    const angle = (i / numPoints) * Math.PI * 2; // Angle for the circle
    const x = radius * (Math.cos(angle) - 1) * 1.5; // X coordinate of the point on the circle (left-right)
    const z = radius * Math.sin(angle) * 4; // Z coordinate of the point on the circle (up-down)
    points.push(new THREE.Vector3(x, y, z)); // Store each point on the path
}

// Apply rotation directly to the path points
const rotationMatrix = new THREE.Matrix4(); // Create a matrix to rotate the path

// Rotating the path by 45 degrees on the x-axis and y-axis
rotationMatrix.makeRotationX(Math.PI / 2); // Rotate around the X-axis
rotationMatrix.multiply(new THREE.Matrix4().makeRotationY(Math.PI)); // Rotate around the Y-axis

// Apply the rotation to each point in the path
points.forEach(point => point.applyMatrix4(rotationMatrix));

// Create the curve from the rotated points
const pathGeometry = new THREE.BufferGeometry().setFromPoints(points);
const pathMaterial = new THREE.LineBasicMaterial({ color: 0xff0000 });
const pathObject = new THREE.Line(pathGeometry, pathMaterial);

// Add the path to the scene
scene.add(pathObject);

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

// Animation loop
function animate() {
    requestAnimationFrame(animate);

    // Skip frames until model is loaded
    if (!model)
        return

    model.rotation.y += 0.001; // Step 4: Rotate the model if it's loaded
    model.rotation.x += 0.0001;
    model.rotation.z += 0.0001;

    const t = getScrollT(); // Get t based on scroll position
    // console.log(t);
    if (rocket) {
        // const position = points.getPointAt(t); // Position along the path
        // rocket.position.copy(position); // Update rocket's position

        // // Make the rocket face the path direction
        // // Get tangent for rotation
        // const tangent = points.getTangentAt(t).normalize(); 
        // // gives the rocket a forward-looking target based on the path’s direction at that point
        // rocket.lookAt(position.clone().add(tangent));


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
    camera.position.set(0, 1 * zoomFactor, 35 * zoomFactor); // Adjust the camera position
    //camera.position.set(0, 1, 35); 

    controls.update();
    renderer.render(scene, camera);

}
animate();