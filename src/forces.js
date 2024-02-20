"use strict"

onmessage = e => {

    const NODES = e.data[0]
    const EDGES = e.data[1]

    const k = 100 / Math.sqrt(NODES.length) // Actual edge length
	const min = 2 // Minimum value

    let i = 0
    let j = 1

    let movement = Array(NODES.length)
    for (i = 0; i < NODES.length; i++) movement[i] = [0, 0]



    // Calculate repel forces for all nodes
    for (i = 0; i < NODES.length; i++) {
		const node1 = NODES[i];
		for (j = i+1; j < NODES.length; j++) {
			const node2 = NODES[j];
			
			const dx = node1[0] - node2[0]
			const dy = node1[1] - node2[1]

			const distance = Math.sqrt(dx * dx + dy * dy)
			//if (distance <= 0) continue // Possibly unnecessary safety check

			const force = k / (distance + (k / min))
			const x = dx * force;
			const y = dy * force;

			movement[i][0] += x
			movement[i][1] += y
			
			movement[j][0] -= x
			movement[j][1] -= y
		}
	}


	// Calculate attractive forces along edges  
    for (i = 0; i < EDGES.length; i++) {
		const edge = EDGES[i]
		const sourceIndex = edge[0]
		const source = NODES[sourceIndex]
		const targetIndex = edge[1]
		const target = NODES[targetIndex]

		const dx = source[0] - target[0]
		const dy = source[1] - target[1]
		
		const distance = Math.sqrt(dx * dx + dy * dy)
		//if (distance <= 0) continue // Possibly unnecessary safety check

		const force = (-(k / (distance + (k / min))) + min) / 2;
		const x = dx * force;
		const y = dy * force;

		movement[sourceIndex][0] -= x
		movement[sourceIndex][1] -= y

		movement[targetIndex][0] += x
		movement[targetIndex][1] += y
	}

    postMessage(movement)
}
