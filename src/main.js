"use strict"

import zoom from './zoom.js'

class UNLE {
    static app = new PIXI.Application({
        resolution: 1,
        autoDensity: true,
        antialias: false,
        backgroundColor: 0xFFFFFF
    });

    //This is necessary to reuse the same texture for a simple line
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

    constructor(data) {
        data.canvas.appendChild(UNLE.app.view);

        if (data.debug) {
            UNLE.DebugDiv = data.debug;
            UNLE.DisplayDebug = UNLE.debug;
            UNLE.initDebug();
        }

        if (data.show_id != null) UNLE.showID = data.show_id; else UNLE.showID = true;
        if (data.node_radius != null) UNLE.nodeRadius = data.node_radius; else UNLE.nodeRadius = 20;
        if (data.node_color != null) UNLE.nodeColor = data.node_color; else UNLE.nodeColor = 0x808080;
        if (data.edge_length != null) UNLE.edgeLength = data.edge_length / 10; else UNLE.edgeLength = 100 / 10;

        UNLE.init();

        // Main loop
        UNLE.main();
    }

    static init() {
        UNLE.lineG.beginFill(0x000000);
        UNLE.lineG.drawRect(0, 0, 1, 1);
        UNLE.lineG.endFill();

        UNLE.lineT = UNLE.app.renderer.generateTexture(UNLE.lineG, {resolution: 1, scaleMode: PIXI.SCALE_MODES.LINEAR});

        UNLE.app.stage.eventMode = 'dynamic';

        UNLE.app.stage.hitArea = UNLE.app.screen;
        UNLE.app.stage.on('pointerup', UNLE.onDragEnd);
        UNLE.app.stage.on('pointerupoutside', UNLE.onDragEnd);

        // Make the stage white


        UNLE.Container = new PIXI.Container();
        UNLE.LinesContainer = new PIXI.Container();
        UNLE.NodesContainer = new PIXI.Container();

        UNLE.Container.addChild(UNLE.LinesContainer);
        UNLE.Container.addChild(UNLE.NodesContainer);

        UNLE.Container.scale = {x: 0.75, y: 0.75}

        UNLE.app.stage.addChild(UNLE.Container);

        UNLE.zoom = new zoom(UNLE.Container, UNLE.app);
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

        UNLE.zoom.disable_pan();
    }

    static onDragEnd() {
        if (UNLE.dragTarget) {
            UNLE.app.stage.off('pointermove', UNLE.onDragMove);
            UNLE.dragTarget = null;
            UNLE.zoom.enable_pan();
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
        return Math.floor(Math.random() * 0x000000);
    }

    static createNode(xC, yC, id, text = id) {

        // Replaced graphics with sprite for faster rendering
        const nodeG = new PIXI.Graphics();
        nodeG.lineStyle(1, 0x000000, 1);
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

    static fa(x, K) {
        return (x * x) / K;
    }

    static fr(x, K) {
        return (K * K) / x;
    }

    static t = 100;

    static cool() {
        UNLE.t = UNLE.t * 0.99;
    }

    static layoutEngine() {
        const nodes = UNLE.NodesContainer.children;
        const edges = UNLE.edgesList;

        const width = UNLE.app.renderer.width;
        const height = UNLE.app.renderer.height;

        const attraction_index = UNLE.nodesEdgeNum;

        const area = width * height;
        const K = Math.sqrt(area / Math.abs(nodes.length));

        const fa = UNLE.fa;
        const fr = UNLE.fr;

        for (var i = 0; i < nodes.length; i++) {
            const v = nodes[i];

            v.dx = 0;
            v.dy = 0;

            for (var j = 0; j < nodes.length; j++) {
                if (i == j)
                    continue;

                const u = nodes[j];

                const dx = v.x - u.x;
                const dy = v.y - u.y;

                const d = Math.sqrt(dx * dx + dy * dy);

                const f = fr(d, K) / d;

                v.dx += dx * f;
                v.dy += dy * f;
            }
        }

        for (var i = 0; i < edges.length; i++) {
            const e = edges[i];

            const ev = UNLE.NodesContainer.getChildByName(e[0]);
            const eu = UNLE.NodesContainer.getChildByName(e[1]);

            const delta = {
                x: ev.x - eu.x,
                y: ev.y - eu.y
            }


            ev.dx = ev.dx - (delta.x / Math.abs(delta.x)) * fa(Math.abs(delta.x), K);
            ev.dy = ev.dy - (delta.y / Math.abs(delta.y)) * fa(Math.abs(delta.y), K);

            eu.dx = eu.dx + (delta.x / Math.abs(delta.x)) * fa(Math.abs(delta.x), K);
            eu.dy = eu.dy + (delta.y / Math.abs(delta.y)) * fa(Math.abs(delta.y), K);

        }

        for (var i = 0; i < nodes.length; i++) {
            const v = nodes[i];

            v.x = v.x + (v.dx * Math.abs(v.dx)) * Math.min(v.dx, UNLE.t);
            v.y = v.y + (v.dy * Math.abs(v.dy)) * Math.min(v.dy, UNLE.t);

            v.x = Math.min(width / 2, Math.max(-width / 2, v.x));
            v.y = Math.min(height / 2, Math.max(-height / 2, v.y));

        }

        UNLE.cool();

    }

    static sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    static async main() {

        if (UNLE.edgesList != []) {
            UNLE.layoutEngine();
        }

        if (UNLE.dragTarget != null) {
            UNLE.dragTarget.x = UNLE.locked.x;
            UNLE.dragTarget.y = UNLE.locked.y;
        }

        if (UNLE.shouldLock) {
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
