"use strict"

import zoom from './zoom.js'

class UNLE {
    static app

    static forcesWorker = new Worker('../src/forces.js')
    static isForcesWorkerReady = true

    //This is necessary to reuse the same texture for a simple line
    static lineG = new PIXI.Graphics()
    static lineT

    static nodeG = new PIXI.Graphics()
    static nodeT

    static LinesContainer
    static NodesContainer

    static dragTarget = null

    static edgesList = []
    static edgesListIndexes = []

    static nodesEdgeNum = {}

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
        if (data.node_radius != null) UNLE.nodeRadius = data.node_radius; else UNLE.nodeRadius = 20;
        if (data.node_color != null) UNLE.nodeColor = data.node_color; else UNLE.nodeColor = 0x808080;
        if (data.edge_length != null) UNLE.edgeLength = data.edge_length / 10; else UNLE.edgeLength = 100 / 10;
        if (data.edge_width != null) UNLE.edgeWidth = data.edge_width; else UNLE.edgeWidth = 2;      

        // Extremely janky line that should be fixed
        //document.getElementsByTagName(data.canvas.id)[0].style.border = "1rem solid white"
        
        
        
        
        /////////////////
        // Colour schemes
        /////////////////
        
        // Dark mode
/*
        document.bgColor = "black"
        UNLE.outlineColour = 0xffffff
        UNLE.nodeColour = 0x000000
        UNLE.textColour = 0xffffff
        UNLE.textStrokeColour = 0x000000
        UNLE.backgroundColour = 0x000000
*/
        
        
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
        document.bgColor = "black"
        UNLE.outlineColour = 0x64727d
        UNLE.nodeColour = 0xffd83c
        UNLE.textColour = 0x000000
        UNLE.textStrokeColour = 0xffffff
        UNLE.backgroundColour = 0x000000
        
        
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
            antialias: false,
            clearBeforeRender: true, // set to true for screenshots or white backgrounds, false for performance
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
        UNLE.lineT = UNLE.app.renderer.generateTexture(UNLE.lineG, {resolution: 1, scaleMode: PIXI.SCALE_MODES.LINEAR});

        UNLE.nodeG.lineStyle(1, UNLE.outlineColour, 1)
        UNLE.nodeG.beginFill(UNLE.nodeColour, 1);
        UNLE.nodeG.drawCircle(0, 0, UNLE.nodeRadius * 1)
        UNLE.nodeG.endFill();
        UNLE.nodeT = UNLE.app.renderer.generateTexture(UNLE.nodeG, {resolution: 8});

        UNLE.app.stage.eventMode = 'static';

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

        UNLE.LayoutAlgorithm = UNLE.fruchtermanReingoldWebWorker;

        UNLE.LinesContainer.interactiveChildren = false;
        UNLE.LinesContainer.eventMode = 'none';
    }

    static onDragMove(event) {
        if (!UNLE.dragTarget)
            return;

        UNLE.dragTarget.parent.toLocal(event.global, null, UNLE.dragTarget.position);
        
        UNLE.drawLines() // Can reduce performance but makes lines follow dragged node
    }

    static onDragStart() {
        UNLE.dragTarget = this
        UNLE.app.stage.on('pointermove', UNLE.onDragMove)
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
            line.x = x2
            line.y = y2
            line.height = Math.sqrt((dx * dx) + (dy * dy))
            line.width = UNLE.edgeWidth

            line.angle = -(Math.atan2(dx, dy) * 180 / Math.PI) - 180
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
            nodeContainer.addChild(UNLE.nodeG);

            const annotation = new PIXI.Text(text, UNLE.textOptions)
            annotation.anchor.set(0.5)
            annotation.scale.set(.125)
            nodeContainer.addChild(annotation)
            const nodeT = UNLE.app.renderer.generateTexture(nodeContainer, {resolution: 8})
            node = new PIXI.Sprite(nodeT)
        }

        else {
            node = new PIXI.Sprite(UNLE.nodeT)
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
    
    static counter = 0
    static counterEND = Infinity
    
    
    static fruchtermanReingold() {
			
		if (UNLE.counter < UNLE.counterEND) {
			
			//console.log(UNLE.edgesList)
			//console.log(UNLE.edgesListIndexes)
			//console.log(UNLE.nodesEdgeNum)
			
			//////////////////////////
			// Initialise constants //
			//////////////////////////
			
			const NODES = UNLE.NodesContainer.children
			const NODES_LENGTH = NODES.length
			const k = 100 / Math.sqrt(NODES_LENGTH) // Actual edge length
			const accel = 2
			const EDGES = UNLE.edgesListIndexes
			const EDGES_LENGTH = EDGES.length
			const NODES_WEIGHT = UNLE.nodesEdgeNum
			let i = 0
			let j = 0
			
			/////////////////////////
			// Initialise movement //
			/////////////////////////
			
			//console.log(NODES_LENGTH) // DEBUG
			
			let movement = Array(NODES_LENGTH)
			for (i = 0; i < NODES_LENGTH; i++) movement[i] = [0, 0];
			
			/////////////////////////////////
			// Calculate repelling forces
			// 
			// Simulate electrons repelling each other
			/////////////////////////////////

			// Calculate repulsive forces between nodes
			
			for (i = 0; i < NODES_LENGTH; i++) {
				const node1 = NODES[i];
				//console.log(UNLE.counter) // DEBUG
				for (j = i+1; j < NODES_LENGTH; j++) {
					const node2 = NODES[j];
					
					const dx = node1.x - node2.x
					const dy = node1.y - node2.y
					
					const distance = Math.sqrt(dx * dx + dy * dy);
					if (distance <= 0)
						continue;

					const force = k / (distance + (k / accel));
					const x = dx * force;
					const y = dy * force;

					movement[i][0] += x
					movement[i][1] += y
					movement[j][0] -= x
					movement[j][1] -= y
				}
			}
			

			
			
			/////////////////////////////////
			// Calculate attraction forces
			// 
			// Simulate protons repelling each other?
			// Simulate springs keeping the electrons together
			/////////////////////////////////
			
			
			// Calculate attractive forces along edges
			
			
			for (i = 0; i < EDGES_LENGTH; i++) {
				const edge = EDGES[i]
				const sourceIndex = edge[0]
				const source = NODES[sourceIndex]
				const targetIndex = edge[1]
				const target = NODES[targetIndex]

				const dx = source.x - target.x
				const dy = source.y - target.y
				
				const distance = Math.sqrt(dx * dx + dy * dy)
				if (distance <= 0)
					continue

				const force = (-(k / (distance + (k / accel))) + accel) / 2;
				const x = dx * force;
				const y = dy * force;


				movement[sourceIndex][0] -= x;
				movement[sourceIndex][1] -= y;

				movement[targetIndex][0] += x;
				movement[targetIndex][1] += y;
			}
			
			

			// Move each node
			for (let i = 0; i < NODES_LENGTH; i++) {
				const node = NODES[i]
				const move = movement[i]
				const edge_num = NODES_WEIGHT[node.name]

				
				//console.log(move)
				
				const EDGE_LENGTH = edge_num;

				const x = movement[i][0] / EDGE_LENGTH
				const y = movement[i][1] / EDGE_LENGTH

				node.x += x
				node.y += y
			}
			
			UNLE.drawLines()
		}
		
		//UNLE.counter += 1
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
				const weight = UNLE.nodesEdgeNum[node.name]

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
        UNLE.nodesEdgeNum[id] = 0
        UNLE.k = Math.sqrt((UNLE.width * UNLE.height) / UNLE.nodesEdgeNum.length)
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

        // Create nodesEdgeNumList
        /*
        const nodesEdgeNumList = new Array(UNLE.NodesContainer.children.length)

        for (let i = 0; i < nodesEdgeNumList.length; i++) {
            nodesEdgeNumList[i] = UNLE.nodesEdgeNum[UNLE.NodesContainer.children[i].name]
        }
        */

        const line = new PIXI.Sprite(UNLE.lineT);
        line.width = UNLE.edgeWidth;
        line.anchor.set(0.5, 0) // Makes lines start and end from the center of nodes
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

    showTime() {
        UNLE.main()
    }
}

export default UNLE;
