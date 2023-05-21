# UNLE.js
 An unconstrained node layout engine for those who really care about performance.

UNLE stands for Unconstrained Node Layout Engine.

Click [here](https://lochyj.github.io/UNLE/) for a demo.

## Documentation

### Installation

Installing UNLE from npm:

```sh
npm install unle
```

### Usage

Importing UNLE into your project:

```js
import UNLE from 'unle';
```

Creating a new UNLE instance:

```js
// Options are:
// "canvas" << required,
// "show_id" -> either true or false,
// "node_radius" -> any positive integer,
// "node_color" -> any HEX colour expressed such as 0x000000 for example,
// "edge_length" -> any positive integer
let graph = new UNLE({
    "canvas": document.getElementById("<div where you want UNLE to place the canvas>"),
    "node_color": 0xA0A0A0,
});
```

Adding nodes to the graph:

```js
// ID can be anything from an integer to a string
graph.add_node(<id>);
```

Adding edges to the graph:

```js
// INFO: length has been depreciated and will be removed in an upcoming version
graph.add_edge(<id of first node>, <id of second node>, <length of edge>);
```

Removing nodes from the graph:

```js
// This will also remove any connected edges
graph.remove_node(<id>);
```

Removing edges from the graph:

```js
graph.remove_edge(<id of first node>, <id of second node>);
```

Using the node language:

```js
let graph = new UNLE({
    "canvas": document.getElementById("canvas"),
    "show_id": false,
    "node_radius": 7,
    "node_color": 0x000000,
    "edge_length": 100
});

// The node language is a way of describing a graph in a string
input = `
    nodes: 1, 2, 3, 4, 5, 6, 7, 8, 9, 10
    1 -> 2
    2 -> 3
    3 -> 4
    4 -> 5
    5 -> 6
    6 -> 7
    7 -> 8
    8 -> 9
    9 -> 10
    10 -> 1
    5 -> 1
    5 -> 2
    5 -> 3
    5 -> 4
    5 -> 6
`
// Note this is a simple wrapper and has its limitations. Beware of bugs.
graph.from_node_language(input);
```

*The above code will produce the following graph:*

![Node graph from above node language](./example2.png)

## Images

![Node graph with a central node surrounded by 11 outer nodes connected with edges](./example.png)

![Node graph from node language example](./example2.png)
