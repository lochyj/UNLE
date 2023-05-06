"use strict"

// function drawLines() {
//     let tempContainer = [];
//     for (let i = 0; i < testEdges.length; i++) {
//         tempContainer.push([
//             app.stage.children[1].children[testEdges[i][0]].x,
//             app.stage.children[1].children[testEdges[i][0]].y,
//             app.stage.children[1].children[testEdges[i][1]].x,
//             app.stage.children[1].children[testEdges[i][1]].y,
//             3
//         ])
//     };
//     //console.log(tempContainer)
//     drawLinesWorker.postMessage(tempContainer);
// };

// drawLinesWorker.onmessage = (e) => {
//     // Now that the data is here, render it
//     const data = e.data;

//     LinesContainer.removeChildren();

//     for (let i = 0; i < data.length; i++) {

//         const line = new PIXI.Sprite(lineT);
//         line.x = data[i][0];
//         line.y = data[i][1];
//         line.height = data[i][2];
//         line.width = data[i][3];
//         line.angle = data[i][4];

//         LinesContainer.addChild(line);
//     }
// };

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