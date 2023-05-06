"use strict"

const canvas = document.createElement('canvas');
document.body.appendChild(canvas);
const offscreen = canvas.transferControlToOffscreen();

const app = new PIXI.Application({ offscreen,
    resolution: 2,
    antialias: true
});

const collisionWorker = new Worker("./src/nodeCollision.js");
const drawLinesWorker = new Worker("./src/drawLines.js");

function startup(){
    document.getElementById("canvas").appendChild(app.view);
}

//This is neccessary to reuse the same texture for a simple line
const lineG = new PIXI.Graphics();
lineG.beginFill(0xFFFFFF, 1);
lineG.drawRect(0,0,1,1);
lineG.endFill();
const lineT = app.renderer.generateTexture(lineG);

// TODO: rename all "node" to "vertex"

const textOptions = {
    font: "bold 64px Roboto", // Set  style, size and font
    fill: '#FFFFFF', // Set fill color to blue
    align: 'center', // Center align the text, since it's multiline
    stroke: '#000000', // Set stroke color to a dark blue gray color
    strokeThickness: 2, // Set stroke thickness to 20
    lineJoin: 'round' // Set the lineJoin to round
}



// This is supposed to be deprecated... Find a better way to do this.
app.stage.eventMode = 'dynamic'; // Changed interactive to eventMode
//
app.stage.hitArea = app.screen;
app.stage.on('pointerup', onDragEnd);
app.stage.on('pointerupoutside', onDragEnd);

// The containers are ordered as such that the lines are drawn underneath the nodes.
const LinesContainer = new PIXI.Container();
app.stage.addChild(LinesContainer);
const NodesContainer = new PIXI.Container();
app.stage.addChild(NodesContainer);

// TODO: Fix this later
let dragTarget = null;

const numNodes = 6;

const testEdges = [
    [0, 1, 0],
    [1, 2, 0],
    [2, 3, 0],
    [5, 1, 0],
    [5, 4, 0],
]

const nodesEdgeNum = [
    2,
    3,
    2,
    1,
    2,
    2,
]

/*This is equal to 10000000000^0.16
The reason it is in its own variable is to reduce the amount of processing in this function.
To change it just recalculate it.*/
const constant = 39.8107170553

function onDragMove(event) {
    if (!dragTarget) 
        return;
    
    dragTarget.parent.toLocal(event.global, null, dragTarget.position);
    locked.x = dragTarget.x;
    locked.y = dragTarget.y;
    applyEdgePower();
    spaceEdgesOnNode();
    constrainToBounds();
    // Commenting these lines out below will give more performance
    applyCollisions();
    drawLines();
    
}

function onDragStart() {
    
    noDiff = false;

    //this.alpha = 0.9;
    dragTarget = this;
    app.stage.on('pointermove', onDragMove);
    shouldLock = true;
    locked.x = dragTarget.x;
    locked.y = dragTarget.y;
}

function onDragEnd() {
    if (dragTarget) {
        app.stage.off('pointermove', onDragMove);
        //dragTarget.alpha = 1;
        // Testing:
        //console.log(dragTarget)
        dragTarget = null;

        shouldLock = false;
        if (!checkingDiff) {
            //console.log("Check diff")
            checkingDiff = true
            setTimeout(checkInitDiff,4500)
            setTimeout(checkDiff,5000)
        };
    }
}

let checkingDiff = false;
let noDiff = false;
var shouldLock = false;
var locked = {
    x: 0,
    y: 0,
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
    while (true) {
        if (noDiff){
            await sleep(32);
            //console.log("waiting!")
            continue;
        } else if (shouldLock) {
            dragTarget.x = locked.x;
            dragTarget.y = locked.y;
        }

        applyEdgePower();
        spaceEdgesOnNode();
        constrainToBounds();
        applyCollisions();
        drawLines();

        await sleep(16);
    }
}

// Determine if anything has changed. Run 5 seconds after 
let initCoords = [];
let finalCoords = [];

function checkInitDiff() {
    for(i=0; i < NodesContainer.children.length; i++){
        const node = NodesContainer.children[i];
        initCoords.push([node.x,node.y])
    };
}

function checkDiff() {
    const diff = (finalCoords.flat().reduce((partialSum, a) => partialSum + a, 0)) - (initCoords.flat().reduce((partialSum, a) => partialSum + a, 0));

    if (diff < 10) {
        noDiff = true
    }

    initCoords, finalCoords = [];

    for(let i=0; i < NodesContainer.children.length; i++){
        const node = NodesContainer.children[i];
        finalCoords.push([node.x,node.y])
    }
    checkingDiff = false;
}


function toDegrees(angle) {
    return angle * (180 / Math.PI);
}

function toRadians(angle) {
    return angle * (Math.PI / 180);
}

function applyCollisions() {
    let tempContainer = [];
    for(let i=0; i < NodesContainer.children.length; i++){
        const node = NodesContainer.children[i];
        tempContainer.push([node.x,node.y,node.width])
    }
    //console.log(tempContainer)
    collisionWorker.postMessage(tempContainer);
    //console.log("Sent");
}

collisionWorker.onmessage = (e) => {
    //console.log(e.data);
    //console.log("Message received from worker");
    
    // Now that the data is here, render it
    const data = e.data;

    for (let i = 0; i < NodesContainer.children.length; i++) {
        const node = NodesContainer.children[i];
        node.x += data[i][0]
        node.y += data[i][1]
    }
};


function drawLines() {
    let tempContainer = [];
    for (let i = 0; i < testEdges.length; i++) {
        tempContainer.push([
            app.stage.children[1].children[testEdges[i][0]].x,
            app.stage.children[1].children[testEdges[i][0]].y,
            app.stage.children[1].children[testEdges[i][1]].x,
            app.stage.children[1].children[testEdges[i][1]].y,
            3
        ])
    };
    //console.log(tempContainer)
    drawLinesWorker.postMessage(tempContainer);
};

drawLinesWorker.onmessage = (e) => {
    // Now that the data is here, render it
    const data = e.data;

    LinesContainer.removeChildren();

    for (let i = 0; i < data.length; i++) {

        const line = new PIXI.Sprite(lineT);
        line.x = data[i][0];
        line.y = data[i][1];
        line.height = data[i][2];
        line.width = data[i][3];
        line.angle = data[i][4];

        LinesContainer.addChild(line);
    }
};



// get a random value between stage.width and 0
        function randomX() {
            return Math.floor(Math.random() * app.screen.width);
        }

        function randomY() {
            return Math.floor(Math.random() * app.screen.height);
        }

        function randomColour() {
            return Math.floor(Math.random() * 0xFFFFFF);
        }

        function randomRadius() {
            return Math.floor(Math.random() * 25) + 15;
        }

        function randomEdgePower() {
            return Math.floor(Math.random() * 150) + 70;
        }


        for(var i = 0; i < numNodes; i++) {
            createNode(randomX(), randomY(), 20, 0x3A3A3A, i)
        }

        for(var i = 0; i < testEdges.length; i++) {
            testEdges[i][2] = 100;
        }

        main();

        function createNode(x, y, rad, colour, text) {

            // Replaced graphics with sprite for faster rendering
            const nodeG = new PIXI.Graphics();
            //nodeG.lineStyle(2, 0xa0a0a0 | colour, 1);
            nodeG.beginFill(colour, 1);
            nodeG.drawCircle(0, 0, rad);
            nodeG.endFill();

            // Moved text into texture
            const annotation = new PIXI.Text(text, textOptions);
            annotation.anchor.set(0.5);


            const nodeContainer = new PIXI.Container();
            nodeContainer.addChild(nodeG);
            nodeContainer.addChild(annotation);

            const nodeT = app.renderer.generateTexture(nodeContainer);
            const node = new PIXI.Sprite(nodeT);
            node.anchor.set(0.5);

            node.eventMode = 'dynamic'; // Changed interactive to eventMode
            node.on('pointerdown', onDragStart, node);
            node.x = x;
            node.y = y;
            NodesContainer.addChild(node);
            return node;
        }

        // testEdges

        function applyEdgePower() {
            var difference = false;
            for (var x = 0; x < 2; x++) {
                // Apply a force to each node based on the edges
                for (var i = 0; i < testEdges.length; i++) {
                    NodesContainer.children[testEdges[i][0]]
                    // get the difference between the target node and the current node
                    var dx = NodesContainer.children[testEdges[i][1]].x - NodesContainer.children[testEdges[i][0]].x
                    var dy = NodesContainer.children[testEdges[i][1]].y - NodesContainer.children[testEdges[i][0]].y

                    var edgeLen = testEdges[i][2]

                    var dist = Math.sqrt(dx * dx + dy * dy)

                    // if the distance is within 10% + or - of the edge length, don't apply a force
                    if (dist > edgeLen * 0.95 && dist < edgeLen * 1.05) 
                        continue;

                    difference = true;

                    var diff = edgeLen - dist

                    var percent = diff / (dist * constant)

                    var offsetX = dx * percent
                    var offsetY = dy * percent

                    NodesContainer.children[testEdges[i][0]].x -= offsetX
                    NodesContainer.children[testEdges[i][0]].y -= offsetY
                    NodesContainer.children[testEdges[i][1]].x += offsetX
                    NodesContainer.children[testEdges[i][1]].y += offsetY


                }
            }
        }

        function constrainToBounds() {
            // ensure all nodes are within the bounds of the canvas
            for (var i = 0; i < NodesContainer.children.length; i++) {
                var node = NodesContainer.children[i]
                if (node.x < 0) node.x = 0
                if (node.y < 0) node.y = 0
                if (node.x > app.screen.width) node.x = app.screen.width
                if (node.y > app.screen.height) node.y = app.screen.height
            }
        }

        function spaceEdgesOnNode() {
            for (var i = 0; i < nodesEdgeNum.length; i++) {
                if (nodesEdgeNum[i] == 0) {
                    var angle = 360;
                } else {
                    var angle = 360 / nodesEdgeNum[i];
                }
                var connectedNodes = []
                for (var k = 0; k < testEdges.length; k++) {
                    if (testEdges[k][0] == i && testEdges[k][1] != i) {
                        connectedNodes.push([testEdges[k][1], testEdges[k][2]])
                    } else if (testEdges[k][1] == i && testEdges[k][0] != i) {
                        connectedNodes.push([testEdges[k][0], testEdges[k][2]])
                    }
                }

                // Initialize the angles array to house all of the possible angles for degrees of the vertex / node.
                var angles = Array(nodesEdgeNum[i]);

                for (var j = 0; j < nodesEdgeNum[i]; j++) {
                    angles[j] = angle * j;
                }

                for (var j = 0; j < connectedNodes.length; j++) {

                    var dx = NodesContainer.children[i].x - NodesContainer.children[connectedNodes[j][0]].x;
                    var dy = NodesContainer.children[i].y - NodesContainer.children[connectedNodes[j][0]].y;
                    var dist = connectedNodes[j][1];

                    //var currentAngle = toDegrees(Math.atan2(dy, dx));

                    //var closestAngle = Math.abs(Math.round(currentAngle / angle) * angle)

                    // find the index of the closest angle in angles to the current angle
                    
                    var offsetX = (dist) * Math.sin(toRadians(angles[j])) / constant;
                    var offsetY = (dist) * Math.cos(toRadians(angles[j])) / constant;

                    // move the node towards the position
                    NodesContainer.children[connectedNodes[j][0]].x += offsetX;
                    NodesContainer.children[connectedNodes[j][0]].y += offsetY;

                    // now move the current node in the opposite angle to the position
                    NodesContainer.children[i].x -= offsetX;
                    NodesContainer.children[i].y -= offsetY;
                    
                }
            }
        }