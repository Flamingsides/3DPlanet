import * as THREE from 'three';

export function getModelDimensions(model) {
    // Compute the bounding box to determine its height
    const box = new THREE.Box3().setFromObject(model);
    const dimensions = new THREE.Vector3();
    box.getSize(dimensions);

    return dimensions;
}

// Default functions for successful and erroneous loading of models
const defaultOnLoad = (model, scene) => { scene.add(model); };
const defaultOnErr = (path, err) => console.log("An error occured while loading " + path + ": " + err);

export async function loadModel(loader, path, scene, onLoad = defaultOnLoad, onErr = defaultOnErr) {
    try {
        const gltf = await loader.loadAsync(path);
        const model = gltf.scene;
        onLoad(model, scene);
        return model;
    } catch (err) {
        onErr(path, err);
    }
}

export function genRocketPathPoints(radius, numPoints, rocketModel) {
    // Create a circular path on the x-z plane, with gradual downward movement on the y-axis
    const points = [];
    const z = 0; // z value is unchanging
    const rocketYOffset = getModelDimensions(rocketModel).y / 2 + 4;
    var xStretch = 1.5, zStretch = 4;
    for (let i = 0; i <= numPoints; i++) {
        const angle = (i / numPoints) * Math.PI * 2; // Angle for the circle
        const x = -radius * (Math.cos(angle) - 1) * xStretch; // X coordinate of the point on the circle (left-right)
        const y = radius * Math.sin(angle) * zStretch + rocketYOffset;; // Y coordinate of the point on the circle (up-down)
        points.push(new THREE.Vector3(x, y, z)); // Store each point on the path
    }

    // const lastPoint = points.pop();

    // for (let i = 0; i < numPoints; i++)
    //     points.push(lastPoint.setY(lastPoint.y - i * 3));

    return points;
}

export function createPathFromPoints(points, color) {
    // Create the curve from the rotated points
    const pathGeometry = new THREE.BufferGeometry().setFromPoints(points);
    const pathMaterial = new THREE.LineBasicMaterial({ color: color });
    const pathObject = new THREE.Line(pathGeometry, pathMaterial);

    return pathObject;
}

// Function to calculate it based on scroll position
export function getScrollT() {
    // current vertical scroll position in pixels from the top of the page
    const scrollY = window.scrollY;
    //  Get the total scrollable height of the page
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;

    // Calculate 't' as a percentage (between 0 and 1)
    return scrollY / Math.max(window.innerHeight, maxScroll);
}

var curScrollY = window.scrollY;
function scroll(scrollSpeed, event) {
    // Prevent default scroll behaviour
    event.preventDefault()

    const delta = Math.abs(window.scrollY - curScrollY);
    curScrollY = window.scrollY;

    var targetScrollY = curScrollY + (delta * scrollSpeed);
    console.log(targetScrollY);

    // Ensure scrolling remains within document bounds
    targetScrollY = Math.max(0, targetScrollY);
    targetScrollY = Math.min(targetScrollY, document.documentElement.scrollHeight);

    window.scrollTo({
        top: targetScrollY
    });

}

export function customScrollLogic() {
    const scrollSpeed = 0.1;

    window.addEventListener("scroll", event => {
        scroll(scrollSpeed, event);
    }, { passive: false })

}