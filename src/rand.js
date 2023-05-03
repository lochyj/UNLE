function randomX() {
    return Math.floor(Math.random() * app.screen.width);
}

function randomY() {
    return Math.floor(Math.random() * app.screen.height);
}

function randomColour() {
    return Math.floor(Math.random() * 0xFFFFFF);
}

function randomRadius() {
    return Math.floor(Math.random() * 20) + 10;
}

function randomEdgePower() {
    return Math.floor(Math.random() * 150) + 100;
}