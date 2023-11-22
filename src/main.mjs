import * as PIXI from "/lib/pixi.min.mjs"

import * as drawing from "./drawing.mjs"
import * as layout from "./layout.mjs"
import * as util from "./util.mjs"

// The interface class for everything in this library
class UNLE {

    // -----------------------------------|
    // Constant / Variable initialization |
    // -----------------------------------|

    static pixi_app;

    static graph;

    // ---------------|
    // Initialization |
    // ---------------|

    constructor(config) {

        // -----------|
        // App config |
        // -----------|

        UNLE.window_width = config.width || 800;
        UNLE.window_height = config.height || 600;

        // TODO add other config items with default values.

        // -----------|
        // Graph init |
        // -----------|

        UNLE.graph = {
            edges: {},
            nodes: {}
        }

        // -------|
        // Canvas |
        // -------|

        UNLE.canvas = config.canvas;

        UNLE.ctx = UNLE.canvas.getContext("webgl2",{
            antialias: true,
            alpha: true,
            stencil: true
        })

        UNLE.canvas.style.width = UNLE.window_width + "px";
        UNLE.canvas.style.height = UNLE.window_height + "px";

        // --------------|
        // PIXI settings |
        // --------------|

        UNLE.pixi_app = new PIXI.Application({
            width: UNLE.window_width,
            height: UNLE.window_height,
            backgroundColor: 0x0A0A0A,
            resolution: window.devicePixelRatio || 1,
            view: UNLE.canvas,
            context: UNLE.ctx,
            antialias: true
        });

        UNLE.pixi_app.stage.interactive = true;

        // ----------------|
        // Container setup |
        // ----------------|

        UNLE.Container = new PIXI.Container();

        UNLE.EdgeContainer = new PIXI.Container();
        UNLE.NodeContainer = new PIXI.Container();

        UNLE.EdgeContainer.interactive = true;
        UNLE.NodeContainer.interactive = true;

        UNLE.Container.addChild(UNLE.EdgeContainer);
        UNLE.Container.addChild(UNLE.NodeContainer);

        UNLE.pixi_app.stage.addChild(UNLE.Container);

        // ----------------|
        // Main loop start |
        // ----------------|

        UNLE.main_loop();

    }

    // -------------------|
    // Internal functions |
    // -------------------|

    static random_position() {
        return {
            x: Math.random() * UNLE.window_width,
            y: Math.random() * UNLE.window_height
        }
    }

    static update_nodes() {
        for (var i = 0; i < Object.keys(UNLE.graph.nodes).length; i++) {
            const key = Object.keys(UNLE.graph.nodes)[i];

            const node = UNLE.graph.nodes[key];

            UNLE.NodeContainer.children[node.index].x = UNLE.graph.nodes[key].x;
            UNLE.NodeContainer.children[node.index].y = UNLE.graph.nodes[key].y;

        }
    }

    static update_edges() {

        UNLE.EdgeContainer.removeChildren();

        for (var i = 0; i < Object.keys(UNLE.graph.edges).length; i++) {
            const key = Object.keys(UNLE.graph.edges)[i];

            const edge = UNLE.graph.edges[key];

            drawing.update_edge(UNLE.EdgeContainer, UNLE.graph.nodes[edge.node_a].x, UNLE.graph.nodes[edge.node_a].y, UNLE.graph.nodes[edge.node_b].x, UNLE.graph.nodes[edge.node_b].y, [])

        }
    }

    static async main_loop() {

        layout.layout_engine(UNLE.graph)

        console.log(UNLE.EdgeContainer.children.length)

        UNLE.update_nodes();
        UNLE.update_edges();

        UNLE.pixi_app.renderer.render(UNLE.pixi_app.stage);

        await util.sleep(1000);

        requestAnimationFrame(UNLE.main_loop);
    }

    // ----------------------|
    // User facing functions |
    // ----------------------|

    add_node(id) {
        UNLE.graph.nodes[id] = {
            id: id,
            x: UNLE.random_position().x,
            y: UNLE.random_position().y,
            attributes: {}
        }

        const index = drawing.draw_node(UNLE.NodeContainer, UNLE.graph.nodes[id].x, UNLE.graph.nodes[id].y, 10, [])

        UNLE.graph.nodes[id].index = index;

    }

    add_edge(id_a, id_b, directed = false) {

        const hash = util.hash(id_a, id_b);

        UNLE.graph.edges[hash] = {
            node_a: id_a,
            node_b: id_b,
            directed: directed,
            attributes: {}
        }

        const index = drawing.draw_edge(UNLE.EdgeContainer, UNLE.graph.nodes[id_a].x, UNLE.graph.nodes[id_a].y, UNLE.graph.nodes[id_b].x, UNLE.graph.nodes[id_b].y, [])

        UNLE.graph.edges[hash].index = index;
    }

}

export { UNLE }