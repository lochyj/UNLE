
const degrees_to_radians = (angle_in_degrees)  => {
    return angle_in_degrees * (Math.PI / 180);
}

const radians_to_degrees = (angle_in_radians) => {
    return angle_in_radians * (180 / Math.PI);
}

function uuidv4() {
    return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, c =>
        (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    );
}

String.prototype.hashCode = function() {
    var hash = 0,
        i, chr;
    if (this.length === 0) return hash;
    for (i = 0; i < this.length; i++) {
        chr = this.charCodeAt(i);
        hash = ((hash << 5) - hash) + chr;
        hash |= 0; // Convert to 32bit integer
    }
    return hash;
}

function hash(id_a, id_b) {
    // TODO: Actually create this
    // TODO: use this to make edges uniquely identifiable

    const hash1 = JSON.stringify({id_a: id_a});

    const hash2 = JSON.stringify({id_b: id_b});

    return JSON.stringify({hash1: hash1, hash2: hash2}).hashCode();

}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export { degrees_to_radians, radians_to_degrees, uuidv4, hash, sleep };
