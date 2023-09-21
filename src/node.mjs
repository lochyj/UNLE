
// This class is only used when the user calls graph.get_node().
// UNLE will make an instance of this class and return it to the user to allow for
// interesting interactions.
class Node {
    constructor(id, adjacency_list) {
        this.id = id
        this.adjacency_list = adjacency_list
    }

    has_neighbor(id) {
        for (var i = 0; i < this.adjacency_list.length; i++) {
            if (this.adjacency_list[i] == id) {
                return true;
            }
        }

        return false
    }
}

export { Node }
