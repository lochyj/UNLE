"use strict"

const canvas = document.createElement('canvas');
document.body.appendChild(canvas);
const offscreen = canvas.transferControlToOffscreen();

const app = new PIXI.Application({ offscreen,
    resolution: 2,
    antialias: true
});

//const collisionWorker = new Worker("./src/nodeCollision.js");
//const drawLinesWorker = new Worker("./src/drawLines.js");

function startup(){
    document.getElementById("canvas").appendChild(app.view);
}

//This is neccessary to reuse the same texture for a simple line
const lineG = new PIXI.Graphics();
lineG.beginFill(0xFFFFFF, 1);
lineG.drawRect(0, 0, 1, 1);
lineG.endFill();
const lineT = app.renderer.generateTexture(lineG);

// TODO: rename all "node" to "vertex"

const textOptions = {
    font: "bold 64px Roboto",
    fill: '#FFFFFF',
    align: 'center',
    stroke: '#000000',
    strokeThickness: 2,
    lineJoin: 'round'
}

app.stage.eventMode = 'dynamic';
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
const acceptableStress = 0.05;

const numNodes = 5;

var testEdges = [
    [0, 1, 0],
    [1, 2, 0],
    [2, 3, 0],
    [3, 4, 0],
]

var nodesEdgeNum = [
    1,
    2,
    2,
    2,
    1,
]

/*This is equal to 10000000000^0.14
The reason it is in its own variable is to reduce the amount of processing in this function.
To change it just recalculate it.*/
const constant = 25.1188643151

function onDragMove(event) {
    if (!dragTarget)
        return;
    
    dragTarget.parent.toLocal(event.global, null, dragTarget.position);
    noDiff = false;
    locked.x = dragTarget.x;
    locked.y = dragTarget.y;
    drawLines();
    applyStress();
    applyCollisions();

    previousStress = 999;
}

function onDragStart() {
    noDiff = false;
    dragTarget = this;
    app.stage.on('pointermove', onDragMove);
    shouldLock = true;
    noDiff = false;
    locked.x = dragTarget.x;
    locked.y = dragTarget.y;
    previousStress = 999;
}

function onDragEnd() {
    if (dragTarget) {
        app.stage.off('pointermove', onDragMove);
        dragTarget = null;
        previousStress = 999;

        shouldLock = false;
        // if (!checkingDiff) {
        //     checkingDiff = true
        //     setTimeout(checkInitDiff,5000 - (Math.PI/5))
        //     setTimeout(checkDiff,5000)
        // };
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
        if (noDiff) {
            await sleep(64);
            console.log("waiting!")
            continue;
        }
        
        drawLines();
        applyStress();
        constrainToBounds();
        applyCollisions();

        if (shouldLock) {
            dragTarget.x = locked.x;
            dragTarget.y = locked.y;
        }

        //drawLines();
        await sleep(16);
    }
    
}

// Determine if anything has changed. Run 5 seconds after 
let initCoords = [];
let finalCoords = [];

function checkInitDiff() {
    for(i = 0; i < NodesContainer.children.length; i++){
        const node = NodesContainer.children[i];
        initCoords.push([node.x,node.y])
    };
}

function checkDiff() {
    const diff = (finalCoords.flat().reduce((partialSum, a) => partialSum + a, 0)) - (initCoords.flat().reduce((partialSum, a) => partialSum + a, 0));

    if (diff < 5) {
        noDiff = true
    }

    initCoords, finalCoords = [];

    for (var i = 0; i < NodesContainer.children.length; i++){
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
    for (let x = 0; x < 3; x++) {
        for (let i = 0; i < NodesContainer.children.length; i++) {
            for (let j = 0; j < NodesContainer.children.length; j++) {
                if (i != j) {
                    const a = NodesContainer.children[i]
                    const b = NodesContainer.children[j]
                    const dx = b.x - a.x
                    const dy = b.y - a.y
                    const dist = Math.sqrt(dx * dx + dy * dy)
                    const minDist = (a.width + b.width) * 0.5
                    if (dist < minDist) {
                        const angle = Math.atan2(dy, dx)
                        const tx = a.x + Math.cos(angle) * minDist
                        const ty = a.y + Math.sin(angle) * minDist
                        const ax = (tx - b.x) * 0.5
                        const ay = (ty - b.y) * 0.5
                        a.x -= ax
                        a.y -= ay
                        b.x += ax
                        b.y += ay
                    }
                }
            }
        }
    }
}

function drawLine(x1, y1, x2, y2, width, value) {
    const dx = x2-x1;
    const dy = y2-y1;
    const line = new PIXI.Sprite(lineT);
    line.x = x2;
    line.y = y2;
    line.height = Math.sqrt((dx*dx) + (dy*dy));
    line.width = width;

    line.angle = -(Math.atan2(dx, dy) * 180 / Math.PI) - 180;
    const angle = -(Math.atan2(dx, dy) * 180 / Math.PI) - 180;

    line.angle = angle;

    LinesContainer.addChild(line);
}

// Implement this fully later
function drawLines() {
    LinesContainer.removeChildren();
    for (var i = 0; i < testEdges.length; i++) {
        drawLine(
            app.stage.children[1].children[testEdges[i][0]].x,
            app.stage.children[1].children[testEdges[i][0]].y,
            app.stage.children[1].children[testEdges[i][1]].x,
            app.stage.children[1].children[testEdges[i][1]].y,
            3,
            testEdges[i][2]
        )
    }
}

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

function constrainToBounds() {
    // ensure all nodes are within the bounds of the canvas
    for (var i = 0; i < NodesContainer.children.length; i++) {
        var node = NodesContainer.children[i];
        node.x = Math.min(Math.max(node.x, 0), app.screen.width);
        node.y = Math.min(Math.max(node.y, 0), app.screen.height);
    }
}

var previousStress = 999;
function applyStress() {
    if (previousStress < 0.1) {
        return;
    }
    var stress = applyEdgeStress();
    stress += applyNodeStress();
    previousStress = stress;
}

function applyEdgeStress() {
    var stress = 0;
    for (var i = 0; i < testEdges.length; i++) {
        var expectedLength = testEdges[i][2];
        var dx = NodesContainer.children[testEdges[i][1]].x - NodesContainer.children[testEdges[i][0]].x;
        var dy = NodesContainer.children[testEdges[i][1]].y - NodesContainer.children[testEdges[i][0]].y;
        var length = Math.sqrt(dx * dx + dy * dy);
        var difference = length - expectedLength;
        var percent = difference / length / 2;

        stress += Math.abs(difference);

        var offsetX = dx * percent;
        var offsetY = dy * percent;

        NodesContainer.children[testEdges[i][0]].x += offsetX;
        NodesContainer.children[testEdges[i][0]].y += offsetY;
        NodesContainer.children[testEdges[i][1]].x -= offsetX;
        NodesContainer.children[testEdges[i][1]].y -= offsetY;
    }
    return stress;
}

//TODO: this function requires to SERIOUS optimization and a refactor to make it readable...
function applyNodeStress() {
    var stress = 0;
    for (var i = 0; i < nodesEdgeNum.length; i++) {
        if (nodesEdgeNum[i] <= 1)
            continue;
            
        var currentNode = NodesContainer.children[i];
        var edges = nodesEdgeNum[i];
        var Angles = [];

        var connectedNodes = testEdges.filter(function (edge) {
            return edge[0] == i || edge[1] == i;
        });

        for (var x = 0; x < edges; x++) {
            var dx = NodesContainer.children[i].x - NodesContainer.children[connectedNodes[x][0]].x;
            var dy = NodesContainer.children[i].y - NodesContainer.children[connectedNodes[x][0]].y;
            Angles[x] = (Math.atan2(dx, dy) * (180 / Math.PI) + 360) % 360;
        }

        // order the nodes in connectedNodes by angle
        connectedNodes.sort(function (a, b) {
            var aAngle = Angles[a[0] == i ? a[1] : a[0]];
            var bAngle = Angles[b[0] == i ? b[1] : b[0]];
            return aAngle - bAngle;
        });

        const differenceBetweenConnectedNodes = 360 / (connectedNodes.length - 1);

        // get the other nodes that are connected to this node
        for (var j = 1; j < connectedNodes.length - 1; j++) {

            //TODO: move this to a function to prevent repeat

            var connectedNode = connectedNodes[j][0] == i ? connectedNodes[j][1] : connectedNodes[j][0];
            var nextConnectedNode = connectedNodes[j+1][0] == i ? connectedNodes[j+1][1] : connectedNodes[j+1][0];

            // get the length of edge currentNode to connectedNode from testEdges
            var a_length = testEdges.filter(function (edge) {
                return edge[0] == connectedNode && edge[1] == i || edge[1] == connectedNode && edge[0] == i;
            })[0][2];

            // get the length of edge currentNode to nextConnectedNode from testEdges
            var b_length = testEdges.filter(function (edge) {
                return edge[0] == nextConnectedNode && edge[1] == i || edge[1] == nextConnectedNode && edge[0] == i;
            })[0][2];

            // var a_dx = currentNode.x - NodesContainer.children[connectedNode].x;
            // var a_dy = currentNode.y - NodesContainer.children[connectedNode].y;
            // var a_length = Math.sqrt(a_dx * a_dx + a_dy * a_dy);


            // var b_dx = currentNode.x - NodesContainer.children[nextConnectedNode].x;
            // var b_dy = currentNode.y - NodesContainer.children[nextConnectedNode].y;
            // var b_length = Math.sqrt(b_dx * b_dx + b_dy * b_dy);
        
            // Cosine rule to determine the length of the "invisible" edge to be added between the two nodes connectedNode and nextConnectedNode to space them evenly
            var constraintLength = Math.sqrt(a_length * a_length + b_length * b_length - 2 * a_length * b_length * Math.cos(toRadians(differenceBetweenConnectedNodes)));
            console.log(constraintLength)
            stress += applyEdgeStressToNodes(NodesContainer.children[connectedNode], NodesContainer.children[nextConnectedNode], constraintLength);
        }

        // get the first and last nodes
        var connectedNode = connectedNodes[0][0] == i ? connectedNodes[0][1] : connectedNodes[0][0];
        var nextConnectedNode = connectedNodes[connectedNodes.length - 1][0] == i ? connectedNodes[connectedNodes.length - 1][1] : connectedNodes[connectedNodes.length - 1][0];

        var a_length = testEdges.filter(function (edge) {
            return edge[0] == connectedNode && edge[1] == i || edge[1] == connectedNode && edge[0] == i;
        })[0][2];

        // get the length of edge currentNode to nextConnectedNode from testEdges
        var b_length = testEdges.filter(function (edge) {
            return edge[0] == nextConnectedNode && edge[1] == i || edge[1] == nextConnectedNode && edge[0] == i;
        })[0][2];

        // var a_dx = currentNode.x - NodesContainer.children[connectedNode].x;
        // var a_dy = currentNode.y - NodesContainer.children[connectedNode].y;
        // var a_length = Math.sqrt(a_dx * a_dx + a_dy * a_dy);


        // var b_dx = currentNode.x - NodesContainer.children[nextConnectedNode].x;
        // var b_dy = currentNode.y - NodesContainer.children[nextConnectedNode].y;
        // var b_length = Math.sqrt(b_dx * b_dx + b_dy * b_dy);
    
        // Cosine rule to determine the length of the "invisible" edge to be added between the two nodes connectedNode and nextConnectedNode to space them evenly
        var constraintLength = Math.sqrt(a_length * a_length + b_length * b_length - 2 * a_length * b_length * Math.cos(toRadians(differenceBetweenConnectedNodes)));
        console.log(constraintLength)
        if (constraintLength < 0.1)
            constraintLength = a_length + b_length;
        stress += applyEdgeStressToNodes(NodesContainer.children[connectedNode], NodesContainer.children[nextConnectedNode], constraintLength);
    }
    return stress;
}

function applyEdgeStressToNodes(node1, node2, expectedLength) {
    var stress = 0;
    var dx = node2.x - node1.x;
    var dy = node2.y - node1.y;
    var length = Math.sqrt(dx * dx + dy * dy);
    var difference = length - expectedLength;
    var percent = difference / length / 2;

    stress += Math.abs(difference);

    var offsetX = dx * percent;
    var offsetY = dy * percent;

    drawLine(node1.x, node1.y, node2.x, node2.y, 1);

    node1.x += offsetX;
    node1.y += offsetY;
    node2.x -= offsetX;
    node2.y -= offsetY;

    return stress;
}
