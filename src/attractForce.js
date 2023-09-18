"use strict"

onmessage = e => {

    const nodes = e.data[0]
    const nodesLength = nodes.length
    const edges = e.data[1]
    const edgesLength = edges.length

    const k = 1 / (nodesLength - 1)

    const a = nodesLength < 500 ? 2 : 4

    let i = 0;

    let movement = new Float32Array(nodesLength)
    for (i = 0; i < movement.length; i++) {
		movement[i] = 0
	}

    // Calculate attractive forces along edges
    for (i = 0; i < edgesLength; i++) {
        const edge = edges[i]

        const sourceIndex = edge[0] * 2
        const targetIndex = edge[1] * 2

        const dx = nodes[sourceIndex] - nodes[targetIndex]
        const dy = nodes[sourceIndex + 1] - nodes[targetIndex + 1]

        const d = Math.sqrt(dx * dx + dy * dy)

        const force = (a * a * d) / (a * d + k);
        const x = dx * force;
        const y = dy * force;


        movement[sourceIndex] += x;
        movement[sourceIndex+1] += y;

        movement[targetIndex] -= x;
        movement[targetIndex+1] -= y;
    }

    postMessage(movement)
}
