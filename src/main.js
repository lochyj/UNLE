"use strict"

class UNLE {
    static app = new PIXI.Application({
        resolution: 1,
        autoDensity: true,
        antialias: true,
        backgroundColor: 0x0A0A0A
    });

    //This is neccessary to reuse the same texture for a simple line
    static lineG = new PIXI.Graphics();
    static lineT;
    static activeLineT;

    static textOptions = {
        font: "bold 64px Roboto", // Set  style, size and font
        fill: '#FFFFFF', // Set fill color to blue
        align: 'center', // Center align the text, since it's multiline
        stroke: '#000000', // Set stroke color to a dark blue gray color
        strokeThickness: 2, // Set stroke thickness to 20
        lineJoin: 'round' // Set the lineJoin to round
    }

    static constant = 20;

    static shouldLock = false;
    static locked = {x: 0, y: 0};

    static LinesContainer;
    static NodesContainer;

    static dragTarget = null;

    static edgesList = [];

    static activeEdges = [];

    static nodesEdgeNum = {};

    constructor(data){
        UNLE.constrainBounds = data.constrainBounds || [];

        document.body.appendChild(UNLE.app.view);

        UNLE.lineG.beginFill(0xFFFFFF, 1);
        UNLE.lineG.drawRect(0, 0, 1, 1);
        UNLE.lineG.endFill();

        UNLE.lineT = UNLE.app.renderer.generateTexture(UNLE.lineG, {resolution: 1, scaleMode: PIXI.SCALE_MODES.LINEAR});

        UNLE.lineG.beginFill(0x00FF00, 1);
        UNLE.lineG.drawRect(0, 0, 1, 1);
        UNLE.lineG.endFill();

        UNLE.activeLineT = UNLE.app.renderer.generateTexture(UNLE.lineG, {resolution: 1, scaleMode: PIXI.SCALE_MODES.LINEAR});


        UNLE.app.stage.eventMode = 'dynamic'; // Changed interactive to eventMode

        UNLE.app.stage.hitArea = UNLE.app.screen;
        UNLE.app.stage.on('pointerup', UNLE.onDragEnd);
        UNLE.app.stage.on('pointerupoutside', UNLE.onDragEnd);


        UNLE.LinesContainer = new PIXI.Container();
        UNLE.NodesContainer = new PIXI.Container();

        UNLE.app.stage.addChild(UNLE.LinesContainer);
        UNLE.app.stage.addChild(UNLE.NodesContainer);

        UNLE.main();
    }

    static onDragMove(event) {
        if (!UNLE.dragTarget)
            return;
        
        UNLE.dragTarget.parent.toLocal(event.global, null, UNLE.dragTarget.position);
        UNLE.locked.x = UNLE.dragTarget.x;
        UNLE.locked.y = UNLE.dragTarget.y;
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
    
    static drawLine(x1, y1, x2, y2, width, value) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        const line = new PIXI.Sprite(UNLE.lineT);
        line.x = x2;
        line.y = y2;
        line.height = Math.sqrt((dx*dx) + (dy*dy));
        line.width = width;
    
        line.angle = -(Math.atan2(dx, dy) * 180 / Math.PI) - 180;
    
        UNLE.LinesContainer.addChild(line);
    }

    static drawActiveLine(x1, y1, x2, y2, width) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        const line = new PIXI.Sprite(UNLE.activeLineT);
        line.x = x2;
        line.y = y2;
        line.height = Math.sqrt((dx*dx) + (dy*dy));
        line.width = width;
    
        line.angle = -(Math.atan2(dx, dy) * 180 / Math.PI) - 180;
    
        UNLE.LinesContainer.addChild(line);
    }
    
    // Implement this fully later
    static drawLines() {
        UNLE.LinesContainer.removeChildren();

        UNLE.edgesList.forEach(edge => {
            UNLE.drawLine(
                UNLE.NodesContainer.getChildByName(edge[0]).x,
                UNLE.NodesContainer.getChildByName(edge[0]).y,
                UNLE.NodesContainer.getChildByName(edge[1]).x,
                UNLE.NodesContainer.getChildByName(edge[1]).y,
                3,
                edge[2]
            )
        });

        UNLE.activeEdges.forEach(edge => {
            UNLE.drawActiveLine(
                UNLE.NodesContainer.getChildByName(edge[0]).x,
                UNLE.NodesContainer.getChildByName(edge[0]).y,
                UNLE.NodesContainer.getChildByName(edge[1]).x,
                UNLE.NodesContainer.getChildByName(edge[1]).y,
                2
            )
        });
    }

    static move_largest_node_to_center() {
        let largest_node = UNLE.NodesContainer.children[0];
        UNLE.NodesContainer.children.forEach(node => {
            if (node.width > largest_node.width) {
                largest_node = node;
            }
        });

        largest_node.x = UNLE.app.stage.width / 2;
        largest_node.y = UNLE.app.stage.height / 2;
    }
    
    // get a random value between stage.width and 0
    static randomX() {
        return Math.floor(Math.random() * UNLE.app.stage.width);
    }
    
    static randomY() {
        return Math.floor(Math.random() * UNLE.app.stage.height);
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

    static getDistance(p1, p2) {
        const dx = p1.x - p2.x;
        const dy = p1.y - p2.y;
        return Math.sqrt(dx * dx + dy * dy);
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
    
    static createNode(xC, yC, rad, colour, id, text = id) {
    
        // Replaced graphics with sprite for faster rendering
        const nodeG = new PIXI.Graphics();
        nodeG.lineStyle(1, 0xffffff, 1);
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

        // Place in center of screen
        node.x = xC + UNLE.app.renderer.width/2;
        node.y = yC + UNLE.app.renderer.height/2;
        UNLE.NodesContainer.addChild(node)
    }
    
    static constrainToBounds() {
        const width = UNLE.app.screen.width;
        const height = UNLE.app.screen.height;
        // ensure all nodes are within the bounds of the canvas
        for (let i = 0; i < UNLE.NodesContainer.children.length; i++) {
            let node = UNLE.NodesContainer.children[i];
            node.x = Math.min(Math.max(node.x, 0), width);
            node.y = Math.min(Math.max(node.y, 0), height);
        }
    }
    
    static fruchtermanReingold() {
        
        const nodes = UNLE.NodesContainer.children;
        const edges = UNLE.edgesList;

        // Initialize forces
        nodes.forEach(node => {
            node.dx = 0;
            node.dy = 0;
        })

        // Calculate repulsive forces between nodes
        nodes.forEach(node1 => {
            nodes.forEach(node2 => {
                if (node1 !== node2) {
                    const delta_x = node1.x - node2.x;
                    const delta_y = node1.y - node2.y;
                    const distance = Math.sqrt(delta_x * delta_x + delta_y * delta_y);
                    const force = ((UNLE.constant * distance * distance) ** 0.3) / distance; // I guessed this part to be the solution to fixing the physics engine
                    node1.dx += (delta_x / distance) * force;
                    node1.dy += (delta_y / distance) * force;
                }
            })
        })

        // Calculate attractive forces along edges
        edges.forEach(edge => {
            const source = UNLE.NodesContainer.getChildByName(edge[0]);
            const target = UNLE.NodesContainer.getChildByName(edge[1]);
            const delta_x = target.x - source.x;
            const delta_y = target.y - source.y;
            const distance = Math.sqrt(delta_x * delta_x + delta_y * delta_y);
            const force = (distance * distance) / (UNLE.constant * edge[2]);
            source.dx += (delta_x / distance) * force;
            source.dy += (delta_y / distance) * force;
            target.dx -= (delta_x / distance) * force;
            target.dy -= (delta_y / distance) * force;
        });

        // Move each node
        nodes.forEach(node => {
            //if (Math.abs(node.dx) > 0.001)
                node.x += node.dx;
            
            //if (Math.abs(node.dy) > 0.001)
                node.y += node.dy;
        })
    }

    static sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    static async main() {

        while (true) {

            if (UNLE.edgesList != []) {
                UNLE.applyCollisions() // This line is absolutely necessary or nodes made wipe themselves into the shadow realm if they overlap
                UNLE.fruchtermanReingold();
            }
            UNLE.move_largest_node_to_center() 
            UNLE.constrainToBounds();
    
            if (UNLE.shouldLock) {
                UNLE.dragTarget.x = UNLE.locked.x;
                UNLE.dragTarget.y = UNLE.locked.y;
            }
    
            UNLE.drawLines();
            await UNLE.sleep(16);
        }
        
    }

    //  ----------------|
    //  Public Functions|
    //  ----------------|

    add_node(id = None, value = id) {
        UNLE.createNode(UNLE.randomX(), UNLE.randomY(), 20, UNLE.randomColour(), id, value)
        UNLE.nodesEdgeNum[id] = 0
    }

    nodes(){
        //console.log(UNLE.NodesContainer.getChildByName("No"))
        return UNLE.NodesContainer.children
    }

    remove_node(node) {
        //console.log(node.name)
        let tempNodeContainer = new PIXI.Container()
        let tempedgesList = []

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
        for (let i = 0; i < UNLE.edgesList.length; i++){

            if (!UNLE.edgesList[i].includes(node.name)) {
                //console.log("Please do it")
                tempedgesList.push(UNLE.edgesList[i])
            }
        }

        
        //console.log(tempContainer)

        UNLE.NodesContainer = tempNodeContainer
        UNLE.edgesList = tempedgesList
        */
    }

    add_edge(id1, id2, len = 100) {
        UNLE.edgesList.push([id1, id2, len])
        UNLE.nodesEdgeNum[id1] += 1
        UNLE.nodesEdgeNum[id2] += 1
    }

    add_active_edge(id1, id2) {
        UNLE.activeEdges.push([id1, id2])
    }

    remove_active_edge(id1, id2) {
        if (UNLE.activeEdges.includes([id1, id2])) {
            UNLE.activeEdges.splice(UNLE.activeEdges.indexOf([id1, id2]), 1)
        }
    }




}


















export default UNLE;
