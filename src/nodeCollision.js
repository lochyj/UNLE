"use strict"

// function applyCollisions() {
//     var tempContainer = [];
//     for (var i = 0; i < NodesContainer.children.length; i++){
//         const node = NodesContainer.children[i];
//         tempContainer.push([node.x,node.y,node.width])
//     }
//     //console.log(tempContainer)
//     collisionWorker.postMessage(tempContainer);
//     //console.log("Sent");
// }

// collisionWorker.onmessage = (e) => {
//     //console.log(e.data);
//     //console.log("Message received from worker");
    
//     // Now that the data is here, render it
//     const data = e.data;

//     for (let i = 0; i < NodesContainer.children.length; i++) {
//         const node = NodesContainer.children[i];
//         node.x += data[i][0]
//         node.y += data[i][1]
//     }
// };

onmessage = function (e) {
    //console.log("Received");
    const data = e.data;

    let movement = [];

    let i, j, a, b, delta_x, delta_y, dist, minDist, angle, tx, ty, ax, ay;

    for (i = 0; i < data.length; i++) {
       movement.push([0,0])
    };

    for (i = 0; i < data.length; i++) {
        for (j = 0; j < data.length; j++) {
            if (i == j) 
                continue;
            a = data[i]
            b = data[j]
            delta_x = b[0] - a[0]
            delta_y = b[1] - a[1]
            dist = Math.sqrt(delta_x * delta_x + delta_y * delta_y)
            minDist = (a[2] + b[2]) * 0.5
            if (dist < minDist) {
                angle = Math.atan2(delta_y, delta_x)
                tx = a[0] + Math.cos(angle) * minDist
                ty = a[1] + Math.sin(angle) * minDist
                ax = (tx - b[0]) * 0.5
                ay = (ty - b[1]) * 0.5

                movement[i][0] -= ax
                movement[i][1] -= ay
                movement[j][0] += ax
                movement[j][1] += ay
            }
        }
    }
    this.postMessage(movement)
};