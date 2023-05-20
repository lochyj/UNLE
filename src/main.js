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

    static textOptions = {
        font: "bold 64px Roboto", // Set  style, size and font
        fill: '#FFFFFF', // Set fill color to blue
        align: 'center', // Center align the text, since it's multiline
        stroke: '#000000', // Set stroke color to a dark blue gray color
        strokeThickness: 2, // Set stroke thickness to 20
        lineJoin: 'round' // Set the lineJoin to round
    }

    static shouldLock = false;
    static locked = { x: 0, y: 0 };

    static LinesContainer;
    static NodesContainer;

    static dragTarget = null;

    static edgesList = [];

    static nodesEdgeNum = {};

    static edgeLengthDiv = 3;

    constructor(data) {
        data.canvas.appendChild(UNLE.app.view);

        // get the coordinates of the centre of the screen
        UNLE.xC = UNLE.app.renderer.width / 2;
        UNLE.yC = UNLE.app.renderer.height / 2;

        UNLE.canvas = data.canvas;

        if (data.debug) {
            UNLE.DebugDiv = data.debug;
            UNLE.DisplayDebug = UNLE.debug;
            UNLE.initDebug();
        }

        if (data.show_id != null) UNLE.showID = data.show_id; else UNLE.showID = true;
        if (data.node_radius != null) UNLE.nodeRadius = data.node_radius; else UNLE.nodeRadius = 20;
        if (data.node_color != null) UNLE.nodeColor = data.node_color; else UNLE.nodeColor = 0x808080;
        if (data.edge_length != null) UNLE.edgeLength = data.edge_length / 10; else UNLE.edgeLength = 100 / 10;

        UNLE.LayoutAlgorithm = UNLE.fruchtermanReingold;

        UNLE.init();

        // Main loop
        UNLE.main();
    }

    static init() {
        UNLE.lineG.beginFill(0xFFFFFF, 1);
        UNLE.lineG.drawRect(0, 0, 1, 1);
        UNLE.lineG.endFill();

        UNLE.lineT = UNLE.app.renderer.generateTexture(UNLE.lineG, { resolution: 1, scaleMode: PIXI.SCALE_MODES.LINEAR });

        UNLE.app.stage.eventMode = 'dynamic';

        UNLE.app.stage.hitArea = UNLE.app.screen;
        UNLE.app.stage.on('pointerup', UNLE.onDragEnd);
        UNLE.app.stage.on('pointerupoutside', UNLE.onDragEnd);

        UNLE.Container = new PIXI.Container();
        UNLE.LinesContainer = new PIXI.Container();
        UNLE.NodesContainer = new PIXI.Container();

        UNLE.Container.addChild(UNLE.LinesContainer);
        UNLE.Container.addChild(UNLE.NodesContainer);

        UNLE.Container.scale = {x: 0.75, y: 0.75}

        UNLE.app.stage.addChild(UNLE.Container);

        UNLE.client = {
            "cursor": {
                "x": 0, "y": 0
            }
        };

        UNLE.app.view.addEventListener("wheel", (event) => {
            if (event.deltaY < 0) {
                UNLE.zoom(1);
            } else if (event.deltaY > 0) {
                UNLE.zoom(-1);
            } else {
                return;
            }
        });

        UNLE.app.view.addEventListener("touchmove", (event) => {
            UNLE.client.cursor.x = event.touches[0].clientX;
            UNLE.client.cursor.y = event.touches[0].clientY;
        });

        UNLE.app.view.addEventListener("mousemove", (event) => {
            UNLE.client.cursor.x = event.clientX;
            UNLE.client.cursor.y = event.clientY;
        });

        // Get middle click down
        UNLE.app.view.addEventListener("mousedown", (event) => {
            if (event.button === 1) {
                UNLE.shouldLock = true;
            }
        });

        // Get middle click up
        UNLE.app.view.addEventListener("mouseup", (event) => {
            if (event.button === 1) {
                UNLE.shouldLock = false;
            }
        });

    }

    // Empty function to override in the constructor if needed that gets called within the main loop
    static DisplayDebug(){}

    //! INFO: If you zoom out too far the graph inverts...
    static zoom(direction) {
        
        // get the position of the mouse
        //const mousePosition = UNLE.app.renderer.plugins.interaction.mouse.global;

        // convert the mouse position to world space
        //const point = UNLE.app.stage.toLocal(mousePosition);

        // Get cursor position
        UNLE.Container.scale.x += direction * 0.05;
        UNLE.Container.scale.y += direction * 0.05;

        UNLE.Container.pivot.x = UNLE.client.cursor.x;
        UNLE.Container.pivot.y = UNLE.client.cursor.y;
    }

    static initDebug() {
        const debugDiv = UNLE.DebugDiv;

        const NodesDetails = document.createElement('details');
        const NodeTitle = document.createElement('summary');
        NodeTitle.innerText = 'Nodes'
        NodesDetails.appendChild(NodeTitle);

        const NodesInfo = document.createElement('div');
        NodesDetails.appendChild(NodesInfo);

        const EdgesDetails = document.createElement('details');
        const EdgeTitle = document.createElement('summary');
        EdgeTitle.innerText = 'Edges'
        EdgesDetails.appendChild(EdgeTitle);
        const EdgesInfo = document.createElement('div');
        EdgesDetails.appendChild(EdgesInfo);

        debugDiv.appendChild(NodesDetails);
        debugDiv.appendChild(EdgesDetails);

        UNLE.EdgesInfo = EdgesInfo;
        UNLE.NodesInfo = NodesInfo;
    }

    static debug() {
        UNLE.NodesInfo.innerHTML = '';
        UNLE.EdgesInfo.innerHTML = '';

        UNLE.NodesContainer.children.forEach(node => {
            const nodeInfo = document.createElement('div');
            nodeInfo.style = 'border: 1px solid #000000; padding: 5px; margin: 5px; border-radius: 5px;';
            nodeInfo.innerHTML = `Node ${node.name} <br> x: ${node.x} <br> y: ${node.y} <br> edges: ${UNLE.nodesEdgeNum[node.name]}`;
            UNLE.NodesInfo.appendChild(nodeInfo);
        });
        
        UNLE.edgesList.forEach(edge => {
            const edgeInfo = document.createElement('div');
            edgeInfo.style = 'border: 1px solid #000000; padding: 5px; margin: 5px; border-radius: 5px;';
            edgeInfo.innerHTML = `Edge ${edge[0]} -> ${edge[1]} <br> length: ${edge[2]}`;
            UNLE.EdgesInfo.appendChild(edgeInfo);
        });
    }

    static onDragMove(event) {
        if (!UNLE.dragTarget)
            return;

        UNLE.dragTarget.parent.toLocal(event.global, null, UNLE.dragTarget.position);
        
        // Lock the dragged node to the cursor / finger
        UNLE.locked.x = UNLE.dragTarget.x;
        UNLE.locked.y = UNLE.dragTarget.y;

        UNLE.drawLines();
    }

    static onDragStart() {
        UNLE.dragTarget = this;
        UNLE.app.stage.on('pointermove', UNLE.onDragMove);

        // Lock the dragged node to the cursor / finger
        UNLE.locked.x = UNLE.dragTarget.x;
        UNLE.locked.y = UNLE.dragTarget.y;
    }

    static onDragEnd() {
        if (UNLE.dragTarget) {
            UNLE.app.stage.off('pointermove', UNLE.onDragMove);
            UNLE.dragTarget = null;
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
        line.height = Math.sqrt((dx * dx) + (dy * dy));
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
        line.height = Math.sqrt((dx * dx) + (dy * dy));
        line.width = width;

        line.angle = -(Math.atan2(dx, dy) * 180 / Math.PI) - 180;

        UNLE.LinesContainer.addChild(line);
    }

    // Implement this fully later -> directed edges and weighted edges to go...
    static drawLines() {
        UNLE.LinesContainer.removeChildren();

        UNLE.edgesList.forEach(edge => {
            UNLE.drawLine(
                UNLE.NodesContainer.getChildByName(edge[0]).x,
                UNLE.NodesContainer.getChildByName(edge[0]).y,
                UNLE.NodesContainer.getChildByName(edge[1]).x,
                UNLE.NodesContainer.getChildByName(edge[1]).y,
                2,
                edge[2]
            )
        });
    }

    static randomX() {
        return Math.floor(Math.random() * UNLE.app.stage.width);
    }

    static randomY() {
        return Math.floor(Math.random() * UNLE.app.stage.height);
    }

    static randomColour() {
        return Math.floor(Math.random() * 0xFFFFFF);
    }

    //TODO: experiment with not using sprite for higher quality
    static createNode(xC, yC, id, text = id) {

        // Replaced graphics with sprite for faster rendering
        const nodeG = new PIXI.Graphics();
        nodeG.lineStyle(1, 0xffffff, 1);
        nodeG.beginFill(UNLE.nodeColor, 1);
        nodeG.drawCircle(0, 0, UNLE.nodeRadius);
        nodeG.endFill();

        const nodeContainer = new PIXI.Container();
        nodeContainer.addChild(nodeG);

        if (UNLE.showID) {
            const annotation = new PIXI.Text(text, UNLE.textOptions);
            annotation.anchor.set(0.5);
            nodeContainer.addChild(annotation);
        }

        const nodeT = UNLE.app.renderer.generateTexture(nodeContainer);
        const node = new PIXI.Sprite(nodeT);
        node.anchor.set(0.5);
        node.name = id;

        node.eventMode = 'dynamic'; // Changed interactive to eventMode
        node.on('pointerdown', UNLE.onDragStart, node);

        // Place in center of screen
        node.x = xC + UNLE.app.renderer.width / 2;
        node.y = yC + UNLE.app.renderer.height / 2;
        UNLE.NodesContainer.addChild(node);
    }

    static fruchtermanReingold() {
        const nodes = UNLE.NodesContainer.children;
        const edges = UNLE.edgesList;

        //TODO: Move this to a global variable that is updated every now and then
        const width = UNLE.app.renderer.width;
        const height = UNLE.app.renderer.height;
        //

        //TODO: add UNLE.edgeLength
        const k = Math.sqrt(((width * height) / 160)); // Optimal distance between nodes

        // Leave this at 2 for the moment. This is the optimal speed...
        const accel = 2

        // Calculate repulsive forces between nodes
        nodes.forEach(node1 => {
            // Initialize forces
            node1.dx = 0;
            node1.dy = 0;
            nodes.forEach(node2 => {
                if (node1 !== node2) {
                    const dx = node1.x - node2.x;
                    const dy = node1.y - node2.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    if (distance <= 0)
                        return;
                    const force = k * k / distance;
                    node1.dx += dx / distance * force;
                    node1.dy += dy / distance * force;
                }
            })
        })

        // Calculate attractive forces along edges
        edges.forEach(edge => {
            const source = UNLE.NodesContainer.getChildByName(edge[0]);
            const target = UNLE.NodesContainer.getChildByName(edge[1]);

            const dx = target.x - source.x;
            const dy = target.y - source.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance <= 0)
                return;
            const force = distance * distance / k;
            const x = dx / distance * force;
            const y = dy / distance * force;
            source.dx += x;
            source.dy += y;
            target.dx -= x;
            target.dy -= y;

        });

        // Move each node
        nodes.forEach(node => {
            // TODO: rename this to something more cohesive...
            const EdgeLength = nodes.length * UNLE.nodesEdgeNum[node.name];
            node.x += accel * (node.dx / EdgeLength);
            node.y += accel * (node.dy / EdgeLength);
            // TODO: fix the constraints
            //node.x = Math.min(Math.max(node.x, 0), width);
            //node.y = Math.min(Math.max(node.y, 0), height);
        })
    }

    static kamadaKawai() {
        //TODO: implement
    }

    static cool(t) {
        return t - 0.1;
    }

    static sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    static async main() {
        // This might slow us down even when we don't need to debug...
        UNLE.DisplayDebug();
        // -

        //console.log(window.scrollX)

        if (UNLE.edgesList != []) {
            UNLE.LayoutAlgorithm();
        }

        if (UNLE.dragTarget != null) {
            UNLE.dragTarget.x = UNLE.locked.x;
            UNLE.dragTarget.y = UNLE.locked.y;
        }

        if (UNLE.shouldLock) {
            // get centre of screen


            UNLE.Container.position.x = UNLE.client.cursor.x - UNLE.app.renderer.width / 2;
            UNLE.Container.position.y = UNLE.client.cursor.y - UNLE.app.renderer.height / 2;
        }

        UNLE.drawLines();

        requestAnimationFrame(UNLE.main);
    }

    // |-------------------------|
    // | Public Facing Functions |
    // |-------------------------|

    add_node(id = None, value = id) {
        UNLE.createNode(UNLE.randomX(), UNLE.randomY(), id, value)
        UNLE.nodesEdgeNum[id] = 0
    }

    add_edge(nodeID1, nodeID2, length = 100) {
        UNLE.edgesList.push([nodeID1, nodeID2, length])
        UNLE.nodesEdgeNum[nodeID1] += 1
        UNLE.nodesEdgeNum[nodeID2] += 1
    }

    //TODO: make this more user friendly...
    nodes() {
        return UNLE.NodesContainer.children
    }

    remove_node(nodeID) {
        const Node = UNLE.NodesContainer.getChildByName(nodeID);

        const edgesConnectedToNode = UNLE.edgesList.filter(edge => edge[0] === Node.name || edge[1] === Node.name);

        edgesConnectedToNode.forEach(edge => {
            UNLE.edgesList.splice(UNLE.edgesList.indexOf(edge), 1);
        });

        UNLE.NodesContainer.removeChild(Node);
    }

    remove_edge(node1, node2) {
        if (UNLE.edgesList.findIndex(edge => edge[0] === node1 && edge[1] === node2) !== -1)
            UNLE.edgesList.splice(UNLE.edgesList.findIndex(edge => edge[0] === node1 && edge[1] === node2), 1);
        else if (UNLE.edgesList.findIndex(edge => edge[1] === node1 && edge[0] === node2) !== -1)
            UNLE.edgesList.splice(UNLE.edgesList.findIndex(edge => edge[1] === node1 && edge[0] === node2), 1);
        else
            return;

        UNLE.nodesEdgeNum[node1] -= 1;
        UNLE.nodesEdgeNum[node2] -= 1;
    }

    traverse_nodes(node1, node2) {
        //TODO: implement animations before this...
    }
}

export default UNLE;
