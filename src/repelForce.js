"use strict"

let k = 51.44

onmessage = e => {

    const nodes = e.data
    const nodesLength = nodes.length

    let i = 0;

    let movement = Array(nodesLength);
    for (i = 0; i < nodesLength; i++) movement[i] = [0, 0];

    // Calculate repulsive forces between nodes
    for (i = 0; i < nodesLength; i++) {
        const node1 = nodes[i];
        for (var j = 0; j < nodesLength; j++) {
            const node2 = nodes[j];
            const dx = node1[0] - node2[0];
            const dy = node1[1] - node2[1];
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance <= 0)
                continue;
            const force = k * k / distance;
            movement[i][0] += dx / distance * force;
            movement[i][1] += dy / distance * force;
        }
    }

    //console.log(movement)

    postMessage(movement)
}