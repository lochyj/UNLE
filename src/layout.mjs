
function layout_engine(graph) {

    for (var i = 0; i < Object.keys(graph.nodes).length; i++) {
        const key = Object.keys(graph.nodes)[i];

        graph.nodes[key].x = Math.random() * 300;
        graph.nodes[key].y = Math.random() * 300;
    }
}

export { layout_engine }
