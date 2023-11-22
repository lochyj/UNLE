import * as PIXI from "/lib/pixi.min.mjs"

function draw_edge(container, x1, y1, x2, y2, attributes) {
    // <attributes> should have some of these: {colour, thickness, directed}

    const edge = new PIXI.Graphics();

    edge.lineStyle(3, 0xFFFFFF, 0.8);
    edge.moveTo(x1, y1);
    edge.lineTo(x2, y2);

    container.addChild(edge);

    return container.children.length - 1;
}

function draw_node(container, x, y, radius, attributes) {
    // <attributes> should have some of these: {label, colour, show_border, border_colour, border_thickness, font_size, font_colour, font_family, font_weight}
    // TODO: Implement above...

    const node = new PIXI.Graphics();

    node.beginFill(0xFFFFFF, 1);
    node.drawCircle(0, 0, radius);
    node.endFill();

    node.x = x;
    node.y = y;

    container.addChild(node);

    return container.children.length - 1;

}

function update_edge(container, x1, y1, x2, y2, attributes) {
    // <attributes> should have some of these: {colour, thickness, directed}

    const edge = new PIXI.Graphics();

    edge.lineStyle(3, 0xFFFFFF, 0.8);
    edge.moveTo(x1, y1);
    edge.lineTo(x2, y2);

    container.addChild(edge);

}

export { draw_node, draw_edge, update_edge }
