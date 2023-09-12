"use strict"

onmessage = e => {

    const nodes = e.data[0]
    const nodesLength = nodes.length
    const edges = e.data[1]
    const edgesLength = edges.length
    const nodesEdgeNum = e.data[2]

    const k = 100 / Math.sqrt(nodesLength) // Actual edge length

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

        /*
        const a = Math.sqrt(nodesEdgeNum[i])

        //const force = Math.sqrt(distance * k)/ k;
        const x = a * dx + ((a*(dx)**3)/source[0]);
        const y = a * dy + ((a*(dy)**3)/source[1]);

        if (x == Infinity) console.log("Infinity at x")
        if (y == Infinity) console.log("Infinity at y")
        */

        const force = -(k / (distance + (k / accel))) + accel;
        const x = dx * force;
        const y = dy * force;


        movement[sourceIndex][0] -= x;
        movement[sourceIndex][1] -= y;

        movement[targetIndex][0] += x;
        movement[targetIndex][1] += y;
    }

/*
    for (var i = 0; i < edges.length; i++) {
            const e = edges[i];

            const ev = UNLE.NodesContainer.getChildByName(e[0]);
            const eu = UNLE.NodesContainer.getChildByName(e[1]);

            const dx = ev.x - eu.x;
            const dy = ev.y - eu.y;

            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance <= 0)
                continue;
            const force = distance * distance / K;
            const x = dx / distance * force;
            const y = dy / distance * force;

            ev.dx -= x;
            ev.dy -= y;

            eu.dx += x;
            eu.dy += y;
        }
*/
    postMessage(movement)
}
