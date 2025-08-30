import * as THREE from 'three';

export function getModelDimensions(model) {
    // Compute the bounding box to determine its height
    const box = new THREE.Box3().setFromObject(model);
    const dimensions = new THREE.Vector3();
    box.getSize(dimensions);

    return dimensions;
}