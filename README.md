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
const graph = new UNLE(document.getElementById("<div where you want UNLE to place the canvas>"));
```

Adding nodes to the graph:

```js
// ID can be anything from an integer to a string
graph.addNode(<id>);
```

Adding edges to the graph:

```js
// INFO: length has been depreciated and will be removed in an upcoming version
graph.addEdge(<id of first node>, <id of second node>, <length of edge>);
```

Removing nodes from the graph:

```js
// This will also remove any connected edges
graph.removeNode(<id>);
```

## Images

![Node graph with a central node surrounded by 11 outer nodes connected with edges](./example.png)
