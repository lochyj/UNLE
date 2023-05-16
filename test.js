function kamadaKawaiAlgorithm(edgesList, nodesEdgeNum, nodesContainer) {
    const maxIterations = 1000; // Maximum number of iterations
    const epsilon = 0.1; // Tolerance for convergence
    const k = 1; // Ideal edge length

    const n = nodesContainer.children.length; // Number of nodes
    const L = calculateDistanceMatrix(nodesContainer.children); // Calculate initial distance matrix

    // Initialize positions
    let positions = [];
    for (let i = 0; i < n; i++) {
        positions[i] = { x: 0, y: 0 };
    }

    let maxDisplacement = epsilon + 1;
    let iterations = 0;

    // Main loop
    while (maxDisplacement > epsilon && iterations < maxIterations) {
        let displacement = [];

        // Calculate pairwise distances and displacements
        for (let i = 0; i < n; i++) {
            displacement[i] = { dx: 0, dy: 0 };

            for (let j = 0; j < n; j++) {
                if (i !== j) {
                    const d = Math.max(0.01, calculateEuclideanDistance(positions[i], positions[j]));
                    const delta = (L[i][j] - d) / d;
                    const dx = (positions[i].x - positions[j].x) * delta;
                    const dy = (positions[i].y - positions[j].y) * delta;

                    displacement[i].dx += dx;
                    displacement[i].dy += dy;
                }
            }
        }

        // Update positions
        for (let i = 0; i < n; i++) {
            positions[i].x += displacement[i].dx;
            positions[i].y += displacement[i].dy;
        }

        // Calculate maximum displacement
        maxDisplacement = 0;
        for (let i = 0; i < n; i++) {
            const displacementMagnitude = calculateEuclideanDistance({ x: 0, y: 0 }, displacement[i]);

            if (displacementMagnitude > maxDisplacement) {
                maxDisplacement = displacementMagnitude;
            }
        }

        iterations++;
    }

    return positions;
}

// Helper function to calculate the distance matrix
function calculateDistanceMatrix(nodes) {
    const n = nodes.length;
    const distanceMatrix = [];

    for (let i = 0; i < n; i++) {
        distanceMatrix[i] = [];

        for (let j = 0; j < n; j++) {
            distanceMatrix[i][j] = Infinity;
        }

        distanceMatrix[i][i] = 0;
    }

    // This means that nodeIds are integers and this is most likely not the case... try to fix this in the future.
    for (const [nodeId1, nodeId2, edgeLength] of UNLE.edgesList) {
        const i = nodeId1 - 1;
        const j = nodeId2 - 1;

        distanceMatrix[i][j] = edgeLength;
        distanceMatrix[j][i] = edgeLength;
    }

    for (let k = 0; k < n; k++) {
        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
                if (distanceMatrix[i][j] > distanceMatrix[i][k] + distanceMatrix[k][j]) {
                    distanceMatrix[i][j] = distanceMatrix[i][k] + distanceMatrix[k][j];
                }
            }
        }
    }

    return distanceMatrix;
}

// Helper function to calculate the Euclidean distance between two points
function calculateEuclideanDistance(point1, point2) {
    const dx = point2.x - point1.x;
    const dy = point2.y - point1.y;
    return Math.sqrt(dx * dx + dy * dy);
}