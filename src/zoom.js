/* Code originally from
 * https://embed.plnkr.co/II6lgj511fsQ7l0QCoRi/
 * Modified to fit the needs of this project
 * */

"use strict"
export default class zoom {

    constructor(container, app) {
        this.Container = container;
        this.app = app;

        // This is required...
        this.handler = this.handler.bind(this);
        this.zoom = this.zoom.bind(this);

        this.handler()

        this.pan = true;
    }

    handler() {

        this.lastPos = null;

        const canvas = this.app.view

        canvas.onwheel = this.zoom

        canvas.onpointerdown = event => {
            this.lastPos = {x: event.offsetX, y: event.offsetY};
        }

        canvas.onpointerup = event => {
            this.lastPos = null;
        }

        canvas.onpointerleave = event => {
            this.lastPos = null;
        }

        canvas.onpointermove = event => {
            if (this.lastPos && this.pan) {
                this.Container.x += (event.offsetX - this.lastPos.x);
                this.Container.y += (event.offsetY - this.lastPos.y);
                this.lastPos = {x: event.offsetX, y: event.offsetY};
            }
        }
    }

    zoom(e) {
        e.preventDefault() // Prevents window from scrolling when zooming in UNLE

        const accel = .8
        const event = window.event

        let s = -e.deltaY * accel
        const x = event.offsetX
        const y = event.offsetY
        const stage = this.Container;
        s = (s > 0 ? 1.5 : 0.75) ** accel;
        var worldPos = {x: (x - stage.x) / stage.scale.x, y: (y - stage.y)/stage.scale.y};
        // Limit minimum and maximum size
        const minSize = 100
        const maxSize = .02
        var newScale = {x: Math.max(Math.min(stage.scale.x * s, minSize), maxSize), y: Math.max(Math.min(stage.scale.y * s, minSize), maxSize)};

        var newScreenPos = {x: (worldPos.x ) * newScale.x + stage.x, y: (worldPos.y) * newScale.y + stage.y};

        stage.x -= (newScreenPos.x-x) ;
        stage.y -= (newScreenPos.y-y) ;
        stage.scale.x = newScale.x;
        stage.scale.y = newScale.y;
    }

    enable_pan() {
        this.pan = true;
    }

    disable_pan() {
        this.pan = false;
    }
}
