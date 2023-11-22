import * as PIXI from "/lib/pixi.min.mjs"

import * as drawing from "./drawing.mjs"

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

        // TODO: add default values for these...
        UNLE.window_width = config.width || 800;
        UNLE.window_height = config.height || 600;

        // TODO add other config items with default values.

        // -----------|
        // Graph init |
        // -----------|

        UNLE.graph = {
            edges: {},
            vertices: {}
        }

        console.log(config.canvas)

        UNLE.canvas = config.canvas;

        UNLE.ctx = UNLE.canvas.getContext("webgl2",{
            antialias:true,
            alpha:true,
            stencil:true,
            powerPreference: 'high-performance'
        })

        UNLE.canvas.style.width = UNLE.window_width + "px";
        UNLE.canvas.style.height = UNLE.window_height + "px";

        UNLE.canvas.style.border = "1px solid black";

        UNLE.pixi_app = new PIXI.Application({
            width: UNLE.window_width,
            height: UNLE.window_height,
            backgroundColor: 0x0A0A0A,
            resolution: window.devicePixelRatio || 1,
            view: UNLE.canvas,
            context: UNLE.ctx,
            antialias: true
        });


        UNLE.pixi_app.stage.eventMode = 'static';

        UNLE.pixi_app.stage.hitArea = UNLE.pixi_app.screen;

        UNLE.canvas.appendChild(UNLE.app.view);

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

    static main_loop() {
        UNLE.pixi_app.renderer.render(UNLE.pixi_app.stage);

        UNLE.pixi_app.ticker.add(() => {
            console.log("tick")
        });

        UNLE.pixi_app.ticker.start();

        requestAnimationFrame(UNLE.main_loop);
    }

    // ----------------------|
    // User facing functions |
    // ----------------------|

    add_node(id) {
        UNLE.graph.vertices[id] = {
            id: id,
            attributes: {},
            x: UNLE.random_position().x,
            y: UNLE.random_position().y
        }

        drawing.draw_node(UNLE.pixi_app, UNLE.graph.vertices[id].x, UNLE.graph.vertices[id].y, [])
    }

    add_edge(id_a, id_b, directed = false) {
        UNLE.graph.edges[id_a + id_b] = {
            node_a: id_a,
            node_b: id_b,
            directed: directed,
            attributes: {}
        }

        drawing.draw_edge(UNLE.pixi_app, UNLE.graph.vertices[id_a].x, UNLE.graph.vertices[id_a].y, UNLE.graph.vertices[id_b].x, UNLE.graph.vertices[id_b].y, [])
    }

}

export { UNLE }