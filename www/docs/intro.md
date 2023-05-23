---
sidebar_position: 1
---

# Quick start

## Getting Started

Create a new HTML file and include the UNLE dependencies like below

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>UNLE</title>
    <link rel="stylesheet" href="unle.css">
    <!-- These libraries are necessary to running UNLE.js at the moment -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/pixi.js/7.2.4/pixi.min.js" integrity="sha512-Ch/O6kL8BqUwAfCF7Ie5SX1Hin+BJgYH4pNjRqXdTEqMsis1TUYg+j6nnI9uduPjGaj7DN4UKCZgpvoExt6dkw==" crossorigin="anonymous" referrerpolicy="no-referrer"></script>
    <script data-require="jquery@*" data-semver="2.1.4" src="https://code.jquery.com/jquery-2.1.4.min.js"></script>
    <script data-require="jquery-mousewheel@*" data-semver="3.1.13" src="//cdnjs.cloudflare.com/ajax/libs/jquery-mousewheel/3.1.13/jquery.mousewheel.min.js"></script>
</head>
<body>
    <!-- We will use this later on -->
    <div id="canvas"></div>
</body>
```

Now create a script tag and initialize UNLE

```html
<script>
  import UNLE from '<Path To UNLE.js File>'

  let graph = new UNLE({
    "canvas": document.getElementById("canvas"),
    "show_id": true,
    "node_radius": 20,
    "node_color": 0x000000,
  });
</script>
```

The options for the UNLE constructor are as follows:

```js
let graph = new UNLE({
  // The HTML DOM element to place the canvas element used to render UNLE in
  "canvas": document.getElementById("canvas"),

  // Wether or not to show the ID of each node on the canvas
  "show_id": false,

  "node_radius": 20,

  "node_color": 0x00FF00,

  // The width of the edges drawn to the canvas
  "edge_width": 3,
});
```

## Adding Nodes

To add a node to the graph, use the `addNode` method

```js
graph.add_node("<node id>");
```

The id of the nodes can be either a string or a number.

## Adding Edges

Adding edges is really simple:

```js
graph.add_edge("<node id 1>", "<node id 2>");
```

## Removing Nodes

Removing nodes is the same as adding nodes, just removing instead of adding for example:

```js
graph.remove_node("<node id>");
```

## Removing Edges

Same goes for edges:

```js
graph.remove_edge("<node id 1>", "<node id 2>");
```

## Node Language Input

UNLE.js supports a simple language to add nodes and edges to the graph. The language is as follows:

```js

var input = `
  nodes: 1, 2, central node, node, hello graph world!

  1 -> 2
  central node -> 2
  node -> central node
`

graph.from_node_language(input);
```
