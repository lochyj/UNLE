import * as PIXI from "/lib/pixi.min.mjs"

function draw_edge(context, x1, y1, x2, y2) {
    //...
}

function draw_node(context, x, y, radius, attributes) {
    // attributes has {should_draw_id, border, border_colour, border_thickness}

    const node = new PIXI.Graphics();

    node.beginFill(0xDE3249, 1);
    node.circle(x, y, radius);
    node.endFill();

    context.stage.addChild(node);

}

function draw_graph(graph) {
    const nodes = graph.nodes;
    const edges = graph.edges;

    for (var i = 0; i < nodes.length; i++) {
        const node = nodes[i]
        draw_node(node.id, node.radius, node.attributes)
    }

    for (var i = 0; i < edges.length; i++) {
        const edge = edges[i]
        // Figure out a good way to do this...
        // draw_edge()
    }
}

export { draw_graph, draw_node, draw_edge }
