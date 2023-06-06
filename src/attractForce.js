"use strict"

let k = 51.44

onmessage = e => {

    const nodes = e.data[0]
    const nodesLength = nodes.length
    const edges = e.data[1]
    const edgesLength = edges.length

    let i = 0;

    let movement = Array(nodesLength)
    for (let i = 0; i < nodesLength; i++) movement[i] = [0, 0]

    // Calculate attractive forces along edges
    for (i = 0; i < edgesLength; i++) {
        const edge = edges[i]
        const sourceIndex = edge[0]
        const source = nodes[sourceIndex]
        const targetIndex = edge[1]
        const target = nodes[targetIndex]

        const dx = target[0] - source[0]
        const dy = target[1] - source[1]
        const distance = Math.sqrt(dx * dx + dy * dy)
        if (distance <= 0)
            continue
        const force = distance * distance / k
        const x = dx / distance * force
        const y = dy / distance * force
        movement[sourceIndex][0] += x
        movement[sourceIndex][1] += y
        movement[targetIndex][0] -= x
        movement[targetIndex][1] -= y
    }

    postMessage(movement)
}