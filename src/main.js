"use strict"

import zoom from './zoom.js'

class UNLE {
    static app = new PIXI.Application({
        resolution: 1,
        autoDensity: true,
        antialias: true,
        backgroundColor: 0x0A0A0A
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
    static edgesListIndexes = [];

    static nodesEdgeNum = {};

    static nodeNames = [];

    static k = Math.sqrt(((UNLE.app.renderer.width * UNLE.app.renderer.height) / 160));

    static gpu;

    static fruchtermanReingoldGPUCompute = 0;

    static buildForces() {
        UNLE.fruchtermanReingoldGPUCompute.destroy()

        UNLE.fruchtermanReingoldGPUCompute = UNLE.gpu.createKernel(function(nodes, movement) {
            const result = movement[this.thread.y][this.thread.x];
            for (let i = 0; i < (this.constants.length); i++) {
                if (i != this.thread.y) {
                    const dx = nodes[this.thread.y][0] - nodes[i][0];
                    const dy = nodes[this.thread.y][1] - nodes[i][1];
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    if (distance <= 0){
                        result = 0;
                    }
                    
                    else {
                        const force = this.constants.k * this.constants.k / distance;
                        if (this.thread.x == 0) {
                            result += (dx / distance * force)
                        }
                        if (this.thread.x == 1) {
                            result += dy / distance * force
                        }
                    }
                }
            }
            return result;
        }, {
            constants: {length: UNLE.NodesContainer.children.length , k: UNLE.k},
            output: [2, UNLE.NodesContainer.children.length],
            tactic: 'speed'
        })
    }

    static generateNodePositionMatrix() {
        const nodes = UNLE.NodesContainer.children;
        const length = nodes.length;
        const matrices = Array(length);
        for (let i = 0; i < length; i++) {
            matrices[i] = [nodes[i].x,nodes[i].y]
        };
        return matrices;
    }

    constructor(data) {
        data.canvas.appendChild(UNLE.app.view);

        UNLE.isDebug = false;

        if (data.debug) {
            UNLE.DebugDiv = data.debug;
            UNLE.DisplayDebug = UNLE.debug;
            UNLE.initDebug();
            UNLE.isDebug = true;
        }

        if (data.show_id != null) UNLE.showID = data.show_id; else UNLE.showID = true;
        if (data.node_radius != null) UNLE.nodeRadius = data.node_radius; else UNLE.nodeRadius = 20;
        if (data.node_color != null) UNLE.nodeColor = data.node_color; else UNLE.nodeColor = 0x808080;
        if (data.edge_length != null) UNLE.edgeLength = data.edge_length / 10; else UNLE.edgeLength = 100 / 10;
        if (data.edge_width != null) UNLE.edgeWidth = data.edge_width; else UNLE.edgeWidth = 3;

        UNLE.init();

        // Main loop
        if (!UNLE.isDebug)
            UNLE.main();
        else
            UNLE.debugMain();
    }

    static init() {
        UNLE.lineG.beginFill(0xFFFFFF);
        UNLE.lineG.drawRect(0, 0, 1, 1);
        UNLE.lineG.endFill();

        UNLE.lineT = UNLE.app.renderer.generateTexture(UNLE.lineG, {resolution: 1, scaleMode: PIXI.SCALE_MODES.LINEAR});

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

        UNLE.zoom = new zoom(UNLE.Container, UNLE.app);

        // Probably a v8 browser
        if (navigator.javaEnabled.toString() == 'function javaEnabled() { [native code] }') {
            UNLE.gpu = new GPU.GPU({canvas: UNLE.app.canvas});
            UNLE.fruchtermanReingoldGPUCompute = UNLE.gpu.createKernel(function(nodes, movement) {return 0},{output: [2, 2]});
            UNLE.LayoutAlgorithm = UNLE.fruchtermanReingoldHybrid;
        }
        // Probably not a v8 browser
        else {
            UNLE.LayoutAlgorithm = UNLE.fruchtermanReingold;
        }
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

        const stepButton = document.createElement('button');
        stepButton.innerText = 'Step';
        stepButton.onclick = UNLE.debugMain;
        debugDiv.appendChild(stepButton);

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

    // Implement this fully later -> directed edges and weighted edges to go...
    static drawLines() {
        const nodes = UNLE.NodesContainer.children;
        const edges = UNLE.edgesListIndexes;
        const lines = UNLE.LinesContainer.children;

        for (let i = 0; i < edges.length; i++) {
            const edge = edges[i]
            
            const x1 = nodes[edge[0]].x;
            const y1 = nodes[edge[0]].y;
            const x2 = nodes[edge[1]].x;
            const y2 = nodes[edge[1]].y;

            const line = lines[i];

            const dx = x2 - x1;
            const dy = y2 - y1;
            line.x = x2;
            line.y = y2;
            line.height = Math.sqrt((dx * dx) + (dy * dy));
            line.width = UNLE.edgeWidth;

            line.angle = -(Math.atan2(dx, dy) * 180 / Math.PI) - 180;            
        };
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
    static createNode(xC, yC, id, text = id, colour) {
        if (colour == null)
            colour = UNLE.nodeColor;
        // Replaced graphics with sprite for faster rendering
        const nodeG = new PIXI.Graphics();
        nodeG.lineStyle(1, 0xffffff, 1);
        nodeG.beginFill(colour, 1);
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
        const nodesLength = nodes.length;
        const edges = UNLE.edgesListIndexes;

        //TODO: add UNLE.edgeLength

        // Change based on the number of nodes...
        const accel = 3;

        let movement = Array(nodesLength);
        for (let i = 0; i < nodesLength; i++) movement[i] = [0, 0];

        // Calculate repulsive forces between nodes
        for (let i = 0; i < nodesLength; i++) {
            const node1 = nodes[i];
            for (var j = 0; j < nodesLength; j++) {
                const node2 = nodes[j];
                const dx = node1.x - node2.x;
                const dy = node1.y - node2.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                if (distance <= 0)
                    continue;
                const force = UNLE.k * UNLE.k / distance;
                movement[i][0] += dx / distance * force;
                movement[i][1] += dy / distance * force;
            }
        }

        // Calculate attractive forces along edges
        for (let i = 0; i < edges.length; i++) {
            const edge = edges[i];
            const sourceIndex = edge[0];
            const source = UNLE.NodesContainer.children[sourceIndex];
            const targetIndex = edge[1];
            const target = UNLE.NodesContainer.children[targetIndex];

            const dx = target.x - source.x;
            const dy = target.y - source.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance <= 0)
                continue;
            const force = distance * distance / UNLE.k;
            const x = dx / distance * force;
            const y = dy / distance * force;
            movement[sourceIndex][0] += x;
            movement[sourceIndex][1] += y;
            movement[targetIndex][0] -= x;
            movement[targetIndex][1] -= y;
        }

        // Move each node
        for (let i = 0; i < nodesLength; i++) {
            const node = nodes[i];
            const EdgeLength = nodesLength * UNLE.nodesEdgeNum[node.name];
            node.x += accel * (movement[i][0] / EdgeLength);
            node.y += accel * (movement[i][1] / EdgeLength);
        }
    }

    static fruchtermanReingoldHybrid() {
        const nodes = UNLE.NodesContainer.children;
        const nodesLength = nodes.length;
        const edges = UNLE.edgesListIndexes;

        const accel = 3;

        let movement = Array(nodesLength);
        for (let i = 0; i < nodesLength; i++) movement[i] = [0, 0];

        // Calculate attractive forces along edges
        for (let i = 0; i < edges.length; i++) {
            const edge = edges[i];
            const sourceIndex = edge[0];
            const source = UNLE.NodesContainer.children[sourceIndex];
            const targetIndex = edge[1];
            const target = UNLE.NodesContainer.children[targetIndex];

            const dx = target.x - source.x;
            const dy = target.y - source.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance <= 0)
                continue;
            const force = distance * distance / UNLE.k;
            const x = dx / distance * force;
            const y = dy / distance * force;
            movement[sourceIndex][0] += x;
            movement[sourceIndex][1] += y;
            movement[targetIndex][0] -= x;
            movement[targetIndex][1] -= y;
        }

        const forces = UNLE.fruchtermanReingoldGPUCompute(UNLE.generateNodePositionMatrix(), movement);

        // Move each node
        for (let i = 0; i < nodes.length; i++) {
            const node = nodes[i];
            const EdgeLength = nodes.length * UNLE.nodesEdgeNum[node.name];
            nodes[i].x += accel * (forces[i][0] / EdgeLength);
            nodes[i].y += accel * (forces[i][1] / EdgeLength);
        }
    }

    generateRandomGraph(graph, numEdges, numNodes) {

        // Add nodes to the graph
        for (var i = 1; i <= numNodes; i++) {
            graph.add_node(i);
        }

        // Connect the nodes randomly
        var connectedNodes = new Set();
        for (var i = 1; i <= numNodes; i++) {
            var nodeId = i;

            // Connect the current node with a random previously connected node
            if (connectedNodes.size > 0) {
                var randomNodeId = Array.from(connectedNodes)[Math.floor(Math.random() * connectedNodes.size)];
                graph.add_edge(nodeId, randomNodeId);
            }

            connectedNodes.add(nodeId);
        }

        // Add additional random edges if required
        var remainingEdges = numEdges - numNodes + 1;
        while (remainingEdges > 0) {
            var sourceNodeId = Math.floor(Math.random() * numNodes) + 1;
            var targetNodeId = Math.floor(Math.random() * numNodes) + 1;

            // Avoid self-loops and duplicate edges
            if (sourceNodeId !== targetNodeId && !edgeExists(graph.edges, sourceNodeId, targetNodeId)) {
                graph.add_edge(sourceNodeId, targetNodeId);
                remainingEdges--;
            }
        }
    }

    static edgeExists(edges, source, target) {
        for (var i = 0; i < edges.length; i++) {
            var edge = edges[i];
            if ((edge[0] === source && edge[1] === target) || (edge[0] === target && edge[1] === source)) {
                return true;
            }
        }
        return false;
    }

    static kamadaKawai() {
        //TODO: implement
    }

    static forceAtlas2() {
        // TODO: implement
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

        if (UNLE.edgesList != [] && UNLE.NodesContainer.children.length != 0) {
            UNLE.LayoutAlgorithm();
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

    static async debugMain() {
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

        UNLE.drawLines();
    }

    // |-------------------------|
    // | Public Facing Functions |
    // |-------------------------|

    add_node(id = None, value = id, colour) {
        UNLE.createNode(UNLE.randomX(), UNLE.randomY(), id, value, colour)
        UNLE.nodesEdgeNum[id] = 0
    }

    // TODO: if node1 and node2 are the same then the edge should be implemented in a special way... add this.
    // TODO: also support multiple edges to and from the same nodes e.g: node 1 -> node 2, node 1 -> node 2
    add_edge(nodeID1, nodeID2, length = 100) {
        const nodeNames = []
        UNLE.NodesContainer.children.forEach(node => {
            nodeNames.push(node.name)
        }) // 3 lines and 1 line below is important for fruchtermanReingoldGPU
        UNLE.nodeNames = nodeNames;
        UNLE.edgesListIndexes.push([nodeNames.indexOf(nodeID1), nodeNames.indexOf(nodeID2)])

        UNLE.edgesList.push([nodeID1, nodeID2, length])
        UNLE.nodesEdgeNum[nodeID1] += 1
        UNLE.nodesEdgeNum[nodeID2] += 1
        
        // Run this if v8 is used, otherwise do not run this line
        if (UNLE.fruchtermanReingoldGPUCompute != 0) UNLE.buildForces()

        const line = new PIXI.Sprite(UNLE.lineT);
        UNLE.LinesContainer.addChild(line);
    }

    //TODO: make this more user friendly...
    nodes() {
        /* This should return a list of all the nodes in the graph...
         * It should look like
         * graph.nodes -> {
         *     "id": {
         *         "value": <value>,
         *         "x": <x value>,
         *         "y": <y value>
         *         "edges": <number of edges>
         *     },
         *     ...
         * }
         * */
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

    from_node_language(input) {
        // TODO: check if the input is valid and if the nodes and edges are valid
        /* E.G:
         * nodes: <nodes> // Define all of the nodes
         * <node1> -> <node2> // Edges are defined like this

         * For example:
         * nodes: node1, node2, node3
         * node1 -> node2
         * node1 -> node3
         * node2 -> node3
         * */

        var lines = input.split('\n');

        var nodes = [];
        var edges = [];

        for (var i = 0; i < lines.length; i++) {
            if (lines[i].trim().startsWith("nodes:")) {
                lines[i].split("nodes:")[1].split(",").forEach(node => nodes.push(node.trim()));
            } else {
                if (lines[i] === '')
                    continue;
                edges.push(lines[i].split("->").map(node => node.trim()));
            }
        }

        nodes.forEach((node) => {
            UNLE.createNode(UNLE.randomX(), UNLE.randomY(), node, node);
            UNLE.nodesEdgeNum[node] = 0;
        });

        edges.forEach((edge) => {
            if (edge.length !== 2)
                return;
            UNLE.edgesList.push([edge[0], edge[1], 100])
            UNLE.nodesEdgeNum[edge[0]] += 1
            UNLE.nodesEdgeNum[edge[1]] += 1
        });
    }
}

export default UNLE;
