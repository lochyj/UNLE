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

    // TODO: this has been made redundant by requestAnimationFrame...
    static simulationSpeed = 0;

    constructor(DomElement, DebugDiv) {
        DomElement.appendChild(UNLE.app.view);

        if (DebugDiv) {
            UNLE.DebugDiv = DebugDiv;
            UNLE.DisplayDebug = UNLE.debug;
            UNLE.initDebug();
        }

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
    }

    // Empty function to override in the constructor if needed that gets called within the main loop
    static DisplayDebug(){}

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

        const SimulationSpeed = document.createElement('input');
        const SimulationSpeedLabel = document.createElement('p');
        SimulationSpeed.type = 'range';
        SimulationSpeed.min = 1;
        SimulationSpeed.max = 100;
        SimulationSpeed.value = 16;
        SimulationSpeedLabel.innerText = "Speed: 16";
        SimulationSpeed.oninput = (e) => {
            UNLE.simulationSpeed = e.target.value;
            SimulationSpeedLabel.innerText = `Speed: ${e.target.value}`;
        }
        debugDiv.appendChild(SimulationSpeed);
        debugDiv.appendChild(SimulationSpeedLabel);

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

        if (UNLE.edgesList != []) {
            UNLE.LayoutAlgorithm();
        }

        if (UNLE.dragTarget != null) {
            UNLE.dragTarget.x = UNLE.locked.x;
            UNLE.dragTarget.y = UNLE.locked.y;
        }

        UNLE.drawLines();

        // TODO: remove this...
        await UNLE.sleep(UNLE.simulationSpeed);
        //

        requestAnimationFrame(UNLE.main);
    }

    // |-------------------------|
    // | Public Facing Functions |
    // |-------------------------|

    add_node(id = None, value = id) {
        UNLE.createNode(UNLE.randomX(), UNLE.randomY(), 20, 0x808080 /*UNLE.randomColour()*/, id, value)
        UNLE.nodesEdgeNum[id] = 0
    }

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

    add_edge(id1, id2, len = 100) {
        UNLE.edgesList.push([id1, id2, len])
        UNLE.nodesEdgeNum[id1] += 1
        UNLE.nodesEdgeNum[id2] += 1
    }
}

export default UNLE;
