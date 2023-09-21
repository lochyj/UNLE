function draw_edge(x1, y1, x2, y2) {
    // TODO
}

function draw_node(id, radius, attributes) {
    // attributes has {should_draw_id, border, border_colour, border_thickness}
    // TODO
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