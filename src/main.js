"use strict"

class UNLE {
    static app = new PIXI.Application({antialias: true, backgroundColor: 0x000000});

    //This is neccessary to reuse the same texture for a simple line
    static lineG = new PIXI.Graphics();
    static lineT;

    static textOptions = {
        font: "bold 64px Roboto", // Set  style, size and font
        fill: '#FFFFFF', // Set fill color to blue
        align: 'center', // Center align the text, since it's multiline
        stroke: '#000000', // Set stroke color to a dark blue gray color
        strokeThickness: 2, // Set stroke thickness to 20
        lineJoin: 'round' // Set the lineJoin to round
    }

    static constant = 4;

    static shouldLock = false;
    static locked = {x: 0,y: 0};

    static LinesContainer;
    static NodesContainer;

    static dragTarget = null;

    static testEdges = [];

    static nodesEdgeNum = [1];

    constructor(){
        document.body.appendChild(UNLE.app.view);

        UNLE.lineG.beginFill(0xFFFFFF, 1);
        UNLE.lineG.drawRect(0,0,1,1);
        UNLE.lineG.endFill();

        UNLE.lineT = UNLE.app.renderer.generateTexture(UNLE.lineG);

        UNLE.app.stage.eventMode = 'dynamic'; // Changed interactive to eventMode

        UNLE.app.stage.hitArea = UNLE.app.screen;
        UNLE.app.stage.on('pointerup', UNLE.onDragEnd);
        UNLE.app.stage.on('pointerupoutside', UNLE.onDragEnd);

        UNLE.LinesContainer = new PIXI.Container();
        UNLE.app.stage.addChild(UNLE.LinesContainer);
        UNLE.NodesContainer = new PIXI.Container();
        UNLE.app.stage.addChild(UNLE.NodesContainer);
        
        UNLE.main();
    }

    static onDragMove(event) {
        if (!UNLE.dragTarget)
            return;
        
        UNLE.dragTarget.parent.toLocal(event.global, null, UNLE.dragTarget.position);
        UNLE.locked.x = UNLE.dragTarget.x;
        UNLE.locked.y = UNLE.dragTarget.y;
        UNLE.applyCollisions();
        UNLE.drawLines();   
    }
    
    static onDragStart() {
        UNLE.dragTarget = this;
        UNLE.app.stage.on('pointermove', UNLE.onDragMove);
        UNLE.shouldLock = true;
        UNLE.locked.x = UNLE.dragTarget.x;
        UNLE.locked.y = UNLE.dragTarget.y;
    }
    
    static onDragEnd() {
        if (UNLE.dragTarget) {
            UNLE.app.stage.off('pointermove', UNLE.onDragMove);
            UNLE.dragTarget = null;
    
            UNLE.shouldLock = false;
        }
    }

    static toDegrees(angle) {
        return angle * (180 / Math.PI);
    }
    
    static toRadians(angle) {
        return angle * (Math.PI / 180);
    }
    
    static applyCollisions() {
        for (let x = 0; x < 3; x++) {
            for (let i = 0; i < UNLE.NodesContainer.children.length; i++) {
                for (let j = 0; j < UNLE.NodesContainer.children.length; j++) {
                    if (i != j) {
                        const a = UNLE.NodesContainer.children[i]
                        const b = UNLE.NodesContainer.children[j]
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
    
    static drawLine(x1, y1, x2, y2, width, value) {
        const dx = x2-x1;
        const dy = y2-y1;
        const line = new PIXI.Sprite(UNLE.lineT);
        line.x = x2;
        line.y = y2;
        line.height = Math.sqrt((dx*dx) + (dy*dy));
        line.width = width;
    
        line.angle = -(Math.atan2(dx, dy) * 180 / Math.PI) - 180;
        const angle = -(Math.atan2(dx, dy) * 180 / Math.PI) - 180;
    
        line.angle = angle;
    
        UNLE.LinesContainer.addChild(line);
    }
    
    // Implement this fully later
    static drawLines() {
        UNLE.LinesContainer.removeChildren();
        //console.log(UNLE.app.stage.children[1].parent.children[0])
        for (var i = 0; i < UNLE.testEdges.length; i++) {
            UNLE.drawLine(
                UNLE.NodesContainer.getChildByName(UNLE.testEdges[i][0]).x,
                UNLE.NodesContainer.getChildByName(UNLE.testEdges[i][0]).y,
                UNLE.NodesContainer.getChildByName(UNLE.testEdges[i][1]).x,
                UNLE.NodesContainer.getChildByName(UNLE.testEdges[i][1]).y,
                3,
                UNLE.testEdges[i][2]
            )
        }
    }
    
    // get a random value between stage.width and 0
    static randomX() {
        return Math.floor(Math.random() * UNLE.app.screen.width);
    }
    
    static randomY() {
        return Math.floor(Math.random() * UNLE.app.screen.height);
    }
    
    static randomColour() {
        return Math.floor(Math.random() * 0xFFFFFF);
    }
    
    static randomRadius() {
        return Math.floor(Math.random() * 25) + 15;
    }
    
    static randomEdgePower() {
        return Math.floor(Math.random() * 150) + 70;
    }
    
    static createNode(x, y, rad, colour, id, text = id) {
    
        // Replaced graphics with sprite for faster rendering
        const nodeG = new PIXI.Graphics();
        //nodeG.lineStyle(2, 0xa0a0a0 | colour, 1);
        nodeG.beginFill(colour, 1);
        nodeG.drawCircle(0, 0, rad);
        nodeG.endFill();
    
        // Moved text into texture
        const annotation = new PIXI.Text(text, UNLE.textOptions);
        annotation.anchor.set(0.5);
    
    
        const nodeContainer = new PIXI.Container();
        nodeContainer.addChild(nodeG);
        nodeContainer.addChild(annotation);
    
        const nodeT = UNLE.app.renderer.generateTexture(nodeContainer);
        const node = new PIXI.Sprite(nodeT);
        node.anchor.set(0.5);
        node.name = id;
    
        node.eventMode = 'dynamic'; // Changed interactive to eventMode
        node.on('pointerdown', UNLE.onDragStart, node);
        node.x = x;
        node.y = y;
        UNLE.NodesContainer.addChild(node)
    }
    
    static applyEdgePower() {
        for (let i = 0; i < UNLE.testEdges.length; i++) {
            //UNLE.NodesContainer.children[testEdges[i][0]]
            // get the difference between the target node and the current node

            //console.log(UNLE.NodesContainer)
            //console.log(UNLE.testEdges)

            //console.log(UNLE.NodesContainer.children[UNLE.testEdges[i][1]].x)
            //console.log(UNLE.NodesContainer.getChildByName(UNLE.testEdges[i][1]))

  
            const dx = UNLE.NodesContainer.getChildByName(UNLE.testEdges[i][1]).x - UNLE.NodesContainer.getChildByName(UNLE.testEdges[i][0]).x
            const dy = UNLE.NodesContainer.getChildByName(UNLE.testEdges[i][1]).y - UNLE.NodesContainer.getChildByName(UNLE.testEdges[i][0]).y
    
            const edgeLen = UNLE.testEdges[i][2]
    
            const dist = Math.sqrt(dx * dx + dy * dy)
    
            // if the distance is within 10% + or - of the edge length, don't apply a force
            if ((edgeLen * 0.95) < dist && dist < (edgeLen * 1.05)) {
                //console.log("Too Small")
            }
    
            else {
    
            const diff = edgeLen - dist
    
            const percent = diff / (dist * UNLE.constant)
    
            const offsetX = dx * percent
            const offsetY = dy * percent
    
            UNLE.NodesContainer.getChildByName(UNLE.testEdges[i][0]).x -= offsetX
            UNLE.NodesContainer.getChildByName(UNLE.testEdges[i][0]).y -= offsetY
            UNLE.NodesContainer.getChildByName(UNLE.testEdges[i][1]).x += offsetX
            UNLE.NodesContainer.getChildByName(UNLE.testEdges[i][1]).y += offsetY 
            }
    
        }
    }
    
    static constrainToBounds() {
        // ensure all nodes are within the bounds of the canvas
        for (let i = 0; i < UNLE.NodesContainer.children.length; i++) {
            let node = UNLE.NodesContainer.children[i];
            node.x = Math.min(Math.max(node.x, 0), UNLE.app.screen.width);
            node.y = Math.min(Math.max(node.y, 0), UNLE.app.screen.height);
        }
    }
    
    static spaceEdgesOnNode() {
        // UNLE.NodesContainer
        // testEdges 
        // nodesEdgeNum
    
        for (let i = 0; i < UNLE.nodesEdgeNum.length; i++) {
            let edges = UNLE.nodesEdgeNum[i];
    
            if (edges <= 1)
                continue;
    
            let angleDiv = 360 / (edges);
    
            let connectedNodes = UNLE.testEdges.filter(function (edge) {
                return edge[0] == i || edge[1] == i;
            });
    
            if (connectedNodes.length != edges) {
                console.log("PANIC, connected nodes doesn't equal the number of edges of vertex " + i)
                continue;
            }
    
            let connectedAngles = [];
            for (let x = 0; x < edges; x++) {
                const dx = UNLE.NodesContainer.children[i].x - UNLE.NodesContainer.children[connectedNodes[x][0]].x;
                const dy = UNLE.NodesContainer.children[i].y - UNLE.NodesContainer.children[connectedNodes[x][0]].y;
                connectedAngles[x] = (Math.atan2(dx, dy) * (180 / Math.PI) + 360) % 360;
            }
    
            let takenAngles = [];
    
            console.log(takenAngles)
    
            for (let j = 0; j < edges; j++) {
                let angle = connectedAngles[j];
    
                let closestAngle = Math.round(angle / angleDiv) * angleDiv;
    
                while (takenAngles.includes(closestAngle) && closestAngle + angleDiv <= 360) {
                    closestAngle += angleDiv;
                }
    
                takenAngles.push(closestAngle);
    
                const dx = Math.sin(closestAngle * (Math.PI / 180));
                const dy = Math.cos(closestAngle * (Math.PI / 180));
    
                UNLE.NodesContainer.children[connectedNodes[j][0]].x -= dx;
                UNLE.NodesContainer.children[connectedNodes[j][0]].y -= dy;
    
            }
        }
    }

    static sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    static async main() {

        while (true) {

            if (UNLE.testEdges != []) {
                UNLE.applyEdgePower();
            }
            UNLE.spaceEdgesOnNode();
            UNLE.constrainToBounds();
            UNLE.applyCollisions();
    
            if (UNLE.shouldLock) {
                UNLE.dragTarget.x = UNLE.locked.x;
                UNLE.dragTarget.y = UNLE.locked.y;
            }
    
            UNLE.drawLines();
            await UNLE.sleep(16);
        }
        
    }






















    add_node(id = None, value = id) {
        UNLE.createNode(UNLE.randomX(), UNLE.randomY(), 20, 0x3A3A3A, id, value)
    }

    nodes(){
        //console.log(UNLE.NodesContainer.getChildByName("No"))
        return UNLE.NodesContainer.children
    }

    remove_node(node) {
        //console.log(node.name)
        let tempNodeContainer = new PIXI.Container()
        let tempTestEdges = []

        //console.log(UNLE.NodesContainer.children)
/*
        // Iterate over each child in nodes container
        for (let i = 0; i <= UNLE.NodesContainer.children.length; i++){
            const testNode = UNLE.NodesContainer.children[i]
            console.log(testNode)
            //console.log("Something is happening")
            if (node.name != testNode.name) {
                //console.log("Please do it")
                tempNodeContainer.addChild(testNode)
            }
        }

        // Iterate over each child in test edge
        for (let i = 0; i < UNLE.testEdges.length; i++){

            if (!UNLE.testEdges[i].includes(node.name)) {
                //console.log("Please do it")
                tempTestEdges.push(UNLE.testEdges[i])
            }
        }

        
        //console.log(tempContainer)

        UNLE.NodesContainer = tempNodeContainer
        UNLE.testEdges = tempTestEdges
        */
    }

    add_edge(id1, id2, len = 100) {
        UNLE.testEdges.push([id1, id2, len])
    }
}
