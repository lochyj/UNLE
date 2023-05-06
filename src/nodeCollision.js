"use strict"

onmessage = function (e) {
    //console.log("Received");
    const data = e.data;

    let movement = [];

    let i, j, a, b, dx, dy, dist, minDist, angle, tx, ty, ax, ay;

    for (i = 0; i < data.length; i++) {
       movement.push([0,0])
    };

    for (i = 0; i < data.length; i++) {
        for (j = 0; j < data.length; j++) {
            if (i != j) {
                a = data[i]
                b = data[j]
                dx = b[0] - a[0]
                dy = b[1] - a[1]
                dist = Math.sqrt(dx * dx + dy * dy)
                minDist = (a[2] + b[2]) * 0.5
                if (dist < minDist) {
                    angle = Math.atan2(dy, dx)
                    tx = a[0] + Math.cos(angle) * minDist
                    ty = a[1] + Math.sin(angle) * minDist
                    ax = (tx - b[0]) * 0.5
                    ay = (ty - b[1]) * 0.5

                    movement[i][0] -=  ax
                    movement[i][1] -= ay
                    movement[j][0] +=  ax
                    movement[j][1] += ay
                }
            }
        }
    }
    this.postMessage(movement)
};