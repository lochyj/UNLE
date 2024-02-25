"use strict"

import zoom from './zoom.js'

class UNLE {
    static app

    static forcesWorker = new Worker('../src/forces.js')
    static isForcesWorkerReady = true

    //This is necessary to reuse the same texture for a simple line
    static lineG = new PIXI.Graphics()
    
    static Triangle_Graphics = new PIXI.Graphics()
    static Triangle_Texture

    static Node_Graphics = new PIXI.Graphics()
    static nodeT

    static LinesContainer
    static Triangles_Container
    static NodesContainer

    static dragTarget = null
    static DragTargetPosition = [0, 0]

    static edgesList = []
    static edgesListIndexes = []

    static Nodes_Weight = {}

    static nodeNames = []

    static generateNodePositionMatrix() {
        const nodes = UNLE.NodesContainer.children;
        const length = nodes.length;
        const matrices = Array(length)

        for (let i = 0; i < length; i++) {
            matrices[i] = [nodes[i].x,nodes[i].y]
        }
        return [matrices, UNLE.edgesListIndexes]
    }

    constructor(data) {

        UNLE.isDebug = false;

        if (data.debug) {
            UNLE.DebugDiv = data.debug;
            UNLE.DisplayDebug = UNLE.debug;
            UNLE.initDebug();
            UNLE.isDebug = true;
        }

        if (data.width != null) UNLE.width = data.width; else UNLE.width = 800;
        if (data.height != null) UNLE.height = data.height; else UNLE.height = 600;
        if (data.show_id != null) UNLE.showID = data.show_id; else UNLE.showID = true;
        if (data.directed_edges != null) UNLE.directedEdges = data.directed_edges; else UNLE.directedEdges = false;
        if (data.node_radius != null) UNLE.nodeRadius = data.node_radius; else UNLE.nodeRadius = 10;
        if (data.node_color != null) UNLE.nodeColor = data.node_color; else UNLE.nodeColor = 0x808080;
        if (data.edge_length != null) UNLE.edgeLength = data.edge_length / 10; else UNLE.edgeLength = 100 / 10;
        if (data.edge_width != null) UNLE.edgeWidth = data.edge_width; else UNLE.edgeWidth = 2;        
        
        /////////////////
        // Colour schemes
        /////////////////
        
        // Dark mode

        document.bgColor = "black"
        UNLE.outlineColour = 0xffffff
        UNLE.nodeColour = 0x000000
        UNLE.textColour = 0xffffff
        UNLE.textStrokeColour = 0x000000
        UNLE.backgroundColour = 0x000000
        
        
        // Light mode
        /*
        document.bgColor = "white"
        UNLE.outlineColour = 0x000000
        UNLE.nodeColour = 0xffffff
        UNLE.textColour = 0x000000
        UNLE.textStrokeColour = 0xffffff
        UNLE.backgroundColour = 0xffffff
        */
        
        
        // HyprMonkey mode
        /*
        document.bgColor = "black"
        UNLE.outlineColour = 0x64727d
        UNLE.nodeColour = 0xffd83c
        UNLE.textColour = 0x000000
        UNLE.textStrokeColour = 0xffffff
        UNLE.backgroundColour = 0x000000
        */
        
		UNLE.textOptions = {
			font: "bold 64px Roboto", // Set  style, size and font
			fontSize: 112, // 8x resolution
			fill: UNLE.textColour, // Set fill color to white
			align: 'center', // Center align the text
			stroke: UNLE.textStrokeColour, // Set stroke color to a dark blue gray color
			strokeThickness: 4,
			lineJoin: 'round' // Set the lineJoin to round
		}
		
		
		UNLE.app = new PIXI.Application({
            width: UNLE.width,
            height: UNLE.height,
            resolution: 1,
            autoDensity: true,
            antialias: true,
            clearBeforeRender: false, // set to true for screenshots or white backgrounds, false for performance or black backgrounds
            backgroundColor: UNLE.backgroundColour,
            preserveDrawingBuffer: false // set to true for screenshots, false for performance
        })

        data.canvas.appendChild(UNLE.app.view)

        document.getElementsByTagName(data.canvas.id)[0].style.border = "1rem solid white" // Dark Or HyprMonkey mode
        //document.getElementsByTagName(data.canvas.id)[0].style.border = "1rem solid black" // Light mode
		
		

        UNLE.init()
    }

    static init() {
		///////////////////////////////////
		// Initialise line and node sprites
		///////////////////////////////////
        UNLE.lineG.beginFill(UNLE.outlineColour);
        UNLE.lineG.drawRect(0, 0, 1, 1);
        UNLE.lineG.endFill();
        
        if (UNLE.directedEdges) {
			UNLE.Triangle_Graphics.beginFill(0xff0000);
			UNLE.Triangle_Graphics.moveTo(0, 10);
			UNLE.Triangle_Graphics.lineTo(10, 10);
			UNLE.Triangle_Graphics.lineTo(5, 0);
			UNLE.Triangle_Graphics.lineTo(0, 10);
			UNLE.Triangle_Graphics.endFill();
			UNLE.Triangle_Texture = UNLE.app.renderer.generateTexture(UNLE.Triangle_Graphics, {resolution: 8, scaleMode: PIXI.SCALE_MODES.LINEAR})
		}

        UNLE.Node_Graphics.lineStyle(1, UNLE.outlineColour, 1)
        UNLE.Node_Graphics.beginFill(UNLE.nodeColour, 1);
        UNLE.Node_Graphics.drawCircle(0, 0, UNLE.nodeRadius)
        UNLE.Node_Graphics.endFill();
        UNLE.Node_Texture = UNLE.app.renderer.generateTexture(UNLE.Node_Graphics, {resolution: 8});

        UNLE.app.stage.eventMode = 'static';

        UNLE.app.stage.hitArea = UNLE.app.screen;
        UNLE.app.stage.on('pointerup', UNLE.onDragEnd);
        UNLE.app.stage.on('pointerupoutside', UNLE.onDragEnd);

        UNLE.Container = new PIXI.Container();
        UNLE.LinesContainer = new PIXI.Container();
        UNLE.Triangles_Container = new PIXI.Container();
        UNLE.NodesContainer = new PIXI.Container();

        UNLE.Container.addChild(UNLE.LinesContainer);
        UNLE.Container.addChild(UNLE.Triangles_Container);
        UNLE.Container.addChild(UNLE.NodesContainer);

        UNLE.Container.scale = {x: 0.75, y: 0.75}

        UNLE.app.stage.addChild(UNLE.Container);

        UNLE.zoom = new zoom(UNLE.Container, UNLE.app);

        UNLE.LayoutAlgorithm = UNLE.fruchtermanReingoldWebWorker;

        UNLE.LinesContainer.interactiveChildren = false;
        UNLE.LinesContainer.eventMode = 'none';

        UNLE.Triangles_Container.interactiveChildren = false;
        UNLE.Triangles_Container.eventMode = 'none';
        
        UNLE.NodesContainer.renderable = true;
        UNLE.Triangles_Container.renderable = true;
    }

    static onDragMove(event) {
        if (!UNLE.dragTarget)
            return;
 
        UNLE.dragTarget.x = UNLE.Container.toLocal(event).x - UNLE.Drag_Offset_X
        UNLE.dragTarget.y = UNLE.Container.toLocal(event).y - UNLE.Drag_Offset_Y
        
        UNLE.drawLines() // Can reduce performance but makes lines follow dragged node
    }

    static onDragStart() {
        UNLE.dragTarget = this
        
        UNLE.app.stage.on('pointermove', UNLE.onDragMove)
        
        UNLE.Drag_Offset_X = UNLE.Container.toLocal(event).x - this.x
        UNLE.Drag_Offset_Y = UNLE.Container.toLocal(event).y - this.y
        
        UNLE.zoom.disable_pan()
    }

    static onDragEnd() {
        if (UNLE.dragTarget) {
            UNLE.app.stage.off('pointermove', UNLE.onDragMove)
            UNLE.dragTarget = null
            UNLE.zoom.enable_pan()
        }
    }

    static toDegrees(angle) {
        return angle * (180 / Math.PI)
    }

    static toRadians(angle) {
        return angle * (Math.PI / 180)
    }

    // Implement this fully later -> directed edges and weighted edges to go...
    static drawLines() {
        const nodes = UNLE.NodesContainer.children
        const edges = UNLE.edgesListIndexes
        const lines = UNLE.LinesContainer.children

        for (let i = 0; i < edges.length; i++) {
            const edge = edges[i]

            const x1 = nodes[edge[0]].x
            const y1 = nodes[edge[0]].y
            const x2 = nodes[edge[1]].x
            const y2 = nodes[edge[1]].y

            const line = lines[i]

            const dx = x2 - x1
            const dy = y2 - y1
            
            const distance = Math.sqrt((dx * dx) + (dy * dy))
            const angle = -(Math.atan2(dx, dy) * 180 / Math.PI) - 180
            
            line.x = x2
            line.y = y2
            line.height = distance
            line.width = UNLE.edgeWidth
            line.angle = angle
            
            if (UNLE.directedEdges) {
				const triangle = UNLE.Triangles_Container.children[i]
				
				const angleRad = angle * Math.PI / 180
				const distance_offset = distance - UNLE.nodeRadius * 1.3
				
				triangle.x = x1 + (distance_offset * Math.sin(angleRad))
				triangle.y = y1 - (distance_offset * Math.cos(angleRad))
				triangle.angle = angle
			}
        };
    }

    static randomX() {
        return Math.floor(Math.random() * UNLE.width) - 300;
    }

    static randomY() {
        return Math.floor(Math.random() * UNLE.height) - 300;
    }

    static randomColour() {
        return Math.floor(Math.random() * 0xFFFFFF);
    }

    //TODO: experiment with not using sprite for higher quality
    static createNode(xC, yC, id, text = id, colour) {
        if (colour == null)
            colour = UNLE.nodeColor;


        let node

        if (UNLE.showID) {
            const nodeContainer = new PIXI.Container();
            nodeContainer.addChild(UNLE.Node_Graphics);

            const annotation = new PIXI.Text(text, UNLE.textOptions)
            annotation.anchor.set(0.5)
            annotation.scale.set(.125)
            nodeContainer.addChild(annotation)
            const node_texture = UNLE.app.renderer.generateTexture(nodeContainer, {resolution: 8})
            node = new PIXI.Sprite(node_texture)
        }

        else {
            node = new PIXI.Sprite(UNLE.Node_Texture)
        }

        node.anchor.set(0.5);
        node.name = id;

        node.eventMode = 'static'; // Changed interactive to eventMode
        node.on('pointerdown', UNLE.onDragStart, node);

        // Place in center of screen
        node.x = xC + UNLE.width / 2;
        node.y = yC + UNLE.height / 2;
        UNLE.NodesContainer.addChild(node);
    }

    static fruchtermanReingoldWebWorker() {

        // Move each node
        UNLE.forcesWorker.onmessage = e => {
		
            const NODES = UNLE.NodesContainer.children
            
            // Remove dragged node's movement
            
			for (let i = 0; i < NODES.length; i++) {
				
				// Lock node that is being held down by the mice
				if (NODES[i] == UNLE.dragTarget) {
					continue
				}
				
				const node = NODES[i]
				const weight = UNLE.Nodes_Weight[node.name]

				node.x += e.data[i][0] / weight
				node.y += e.data[i][1] / weight
			}

            UNLE.drawLines()

            UNLE.isForcesWorkerReady = true
        }

        // Dispatch calculations
		if (UNLE.edgesList != [] && UNLE.NodesContainer.children.length != 0 && UNLE.isForcesWorkerReady) {

			UNLE.forcesWorker.postMessage(UNLE.generateNodePositionMatrix())
			UNLE.isForcesWorkerReady = false

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

    static cool(t) {
        return t - 0.1;
    }

    static sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    static main() {
        UNLE.LayoutAlgorithm();

        requestAnimationFrame(UNLE.main);
    }

    // |-------------------------|
    // | Public Facing Functions |
    // |-------------------------|

    add_node(id = None, value = id, colour) {
        const x = UNLE.randomX()
        const y = UNLE.randomY()
        UNLE.createNode(x, y, id, value, colour)
        UNLE.Nodes_Weight[id] = 0
        UNLE.k = Math.sqrt((UNLE.width * UNLE.height) / UNLE.Nodes_Weight.length)
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
        UNLE.Nodes_Weight[nodeID1] += 1
        UNLE.Nodes_Weight[nodeID2] += 1
        
        // Add edge to rendering
        const line = UNLE.lineG.clone()
        line.pivot.set(0.5, 0)
        UNLE.LinesContainer.addChild(line);
        
        
        // Add triangles to node
        if (UNLE.directedEdges) {
			const sprite = new PIXI.Sprite(UNLE.Triangle_Texture)
			sprite.anchor.set(.5);
			UNLE.Triangles_Container.addChild(sprite);
		}
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

        UNLE.Nodes_Weight[node1] -= 1;
        UNLE.Nodes_Weight[node2] -= 1;
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
            UNLE.Nodes_Weight[node] = 0;
        });

        edges.forEach((edge) => {
            if (edge.length !== 2)
                return;
            UNLE.edgesList.push([edge[0], edge[1], 100])
            UNLE.Nodes_Weight[edge[0]] += 1
            UNLE.Nodes_Weight[edge[1]] += 1
        });
    }

    showTime() {
        UNLE.main()
    }
}

export default UNLE;
