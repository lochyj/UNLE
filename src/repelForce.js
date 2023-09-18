"use strict"

onmessage = e => {

    const nodes = e.data
    const nodesLength = nodes.length

    const k = 1000 / (nodesLength - 1) // Actual edge length

    const a = 2

    let i, j = 0;

    let movement = new Float32Array(nodesLength)
    for (i = 0; i < movement.length; i++) {
		movement[i] = 0
	}

    // Calculate repulsive forces between nodes
    for (i = 0; i < nodesLength; i+=2) {

        for (j = 0; j < nodesLength; j+=2) {

			if (i == j) continue;

            const dx = nodes[i] - nodes[j];
            const dy = nodes[i + 1] - nodes[j + 1];

            const d = Math.sqrt(dx * dx + dy * dy);

			const force = a * k / (a * d + k);

			const x = dx * force;
			const y = dy * force

			movement[i] += x;
            movement[i + 1] += y;
        }
    }
    postMessage(movement)
}
