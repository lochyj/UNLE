"use strict"

onmessage = e => {

    const nodes = e.data[0]
    const nodesLength = nodes.length
    const edges = e.data[1]
    const edgesLength = edges.length
    const nodesEdgeNum = e.data[2]

    const k = 1000 / (nodesLength - 1) // Actual edge length

    const accel = 2

    let i = 0;

    let movement = Array(nodesLength)
    for (i = 0; i < nodesLength; i++) movement[i] = [0, 0]

    // Calculate attractive forces along edges
    for (i = 0; i < edgesLength; i++) {
        const edge = edges[i]
        const sourceIndex = edge[0]
        const source = nodes[sourceIndex]
        const targetIndex = edge[1]
        const target = nodes[targetIndex]

        const dx = source[0] - target[0]
        const dy = source[1] - target[1]

        const distance = Math.sqrt(Math.abs(dx * dx + dy * dy))
        if (distance == 0)
            continue

        const force = -(k / (distance + (k / accel))) + accel;
        const x = dx * force;
        const y = dy * force;


        movement[sourceIndex][0] -= x;
        movement[sourceIndex][1] -= y;

        movement[targetIndex][0] += x;
        movement[targetIndex][1] += y;
    }

    postMessage(movement)
}
