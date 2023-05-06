"use strict"

onmessage = function (e) {
    //console.log("Received");
    const data = e.data;

    let lines = [];

    let i, dx, dy;

    for (i = 0; i < data.length; i++) {
        // x, y, height, width, angle
       lines.push([0,0,0,0,0])
    };

    for (i = 0; i < data.length; i++) {
        dx = data[i][2]-data[i][0];
        dy = data[i][3]-data[i][1];

        
        lines[i][0] = data[i][2]; // x
        lines[i][1] = data[i][3]; // y
        lines[i][2] = Math.sqrt((dx*dx) + (dy*dy)); // height
        lines[i][3] = data[i][4]; // width
        lines[i][4] = -(Math.atan2(dx, dy) * 180 / Math.PI) - 180; // angle
    }
    this.postMessage(lines)
};