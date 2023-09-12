"use strict"

onmessage = e => {

    const nodes = e.data
    const nodesLength = nodes.length

    const k = 200 / Math.sqrt(nodesLength) // Actual edge length

    const accel = 2
    console.log(accel)

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

            //const force = (k) / (distance);
            //if (force != Infinity) movement[i][0] += dx * force;
            //if (force != Infinity) movement[i][1] += dy * force;

			const force = k / (distance + (k / accel));
			const x = dx * force;
			const y = dy * force;

			movement[i][0] += x
			movement[i][1] += y
        }
    }

/*
    for (var i = 0; i < nodes.length; i++) {
		const v = nodes[i];

		for (var j = 0; j < nodes.length; j++) {
			if (i == j)
				continue;

			const u = nodes[j];

			const dx = v.x - u.x;
			const dy = v.y - u.y;
			const distance = Math.sqrt(dx * dx + dy * dy);
			if (distance <= 0)
				continue;

			const force = K * K / distance;
			const x = dx / distance * force;
			const y = dy / distance * force;

			v.dx += x;
			v.dy += y;
		}
	}
*/
    postMessage(movement)
}
