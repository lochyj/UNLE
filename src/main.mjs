import PIXI from "../lib/pixi.mjs"

import math_helper from "./math.js"

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
        this.window_width = config.width;
        this.window_height = config.height;

        // TODO add other config items with default values.

        // -----------|
        // Graph init |
        // -----------|

        UNLE.graph = {
            edges: {},
            vertices: {}
        }

    }

    // -------------------|
    // Internal functions |
    // -------------------|

    // ----------------------|
    // User facing functions |
    // ----------------------|

}

export { UNLE }