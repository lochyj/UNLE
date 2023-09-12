"use strict"

onmessage = e => {

    const nodes = e.data
    const nodesLength = nodes.length

    const k = 1000 / (nodesLength - 1) // Actual edge length

    const accel = 2

    let i = 0;

    let movement = Array(nodesLength);
    for (i = 0; i < nodesLength; i++) movement[i] = [0, 0];

    // Calculate repulsive forces between nodes
    for (i = 0; i < nodesLength; i++) {
        const node1 = nodes[i];
        for (let j = 0; j < nodesLength; j++) {

            const node2 = nodes[j];

            const dx = node1[0] - node2[0];
            const dy = node1[1] - node2[1];
            const distance = Math.sqrt(Math.abs(dx * dx + dy * dy));
            if (distance <= 0)
				continue;

			const force = k / (distance + (k / accel));
			const x = dx * force;
			const y = dy * force;

			movement[i][0] += x
			movement[i][1] += y
        }
    }
    postMessage(movement)
}
