/* Code originally from
 * https://embed.plnkr.co/II6lgj511fsQ7l0QCoRi/
 * Modified to fit the needs of this project
 * */

"use strict"
export default class zoom {

    // Global vars to cache event state
    static evCache = new Array();
    static prevDiff = -1;

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

        canvas.onwheel = event => {
            
            if (event.deltaY > 0) {
                this.zoom(event, 0.75)
            }
            else {
                this.zoom(event, 1.5)
            }
        }

        canvas.onpointerdown = event => {
            this.lastPos = {x: event.offsetX, y: event.offsetY};
            zoom.evCache.push(event);
        }

        canvas.onpointerup = event => {
            this.lastPos = null;
            zoom.remove_event(event);
            
        }

        canvas.onpointerleave = event => {
            this.lastPos = null;
            zoom.remove_event(event);
        }

        canvas.onpointermove = event => {

            // Find this event in the cache and update its record with this event
            for (var i = 0; i < zoom.evCache.length; i++) {
                if (event.pointerId == zoom.evCache[i].pointerId) {
                    zoom.evCache[i] = event;
                break;
                }
            }


            // If two pointers are down, check for pinch gestures
            if (zoom.evCache.length == 2) {
                // Calculate the distance between the two pointers
                var curDiff = Math.sqrt(Math.pow(zoom.evCache[1].clientX - zoom.evCache[0].clientX, 2) + Math.pow(zoom.evCache[1].clientY - zoom.evCache[0].clientY, 2));

                if (zoom.prevDiff > 0) {
                    if (curDiff > zoom.prevDiff) {
                        // The distance between the two pointers has increased
                        this.zoom(event, 1.08)
                    }
                    if (curDiff < zoom.prevDiff) {
                        // The distance between the two pointers has decreased
                        this.zoom(event, 0.92)
                    }
                }

                // Cache the distance for the next move event 
                zoom.prevDiff = curDiff;
            }

            // If not two pointer gesture, more like normal
            else {
                if (this.lastPos && this.pan) {
                    this.Container.x += (event.offsetX - this.lastPos.x);
                    this.Container.y += (event.offsetY - this.lastPos.y);
                    this.lastPos = {x: event.offsetX, y: event.offsetY};
                }
            }
        }
    }

    zoom(e, sens) {
        e.preventDefault() // Prevents window from scrolling when zooming in UNLE

        const acccanvas = .8
        const event = window.event

        const x = event.offsetX
        const y = event.offsetY
        const stage = this.Container;
        const s = sens ** acccanvas;
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

    static remove_event(ev) {
    // Remove this event from the target's cache
    for (var i = 0; i < zoom.evCache.length; i++) {
        if (zoom.evCache[i].pointerId == ev.pointerId) {
            zoom.evCache.splice(i, 1);
            break;
        }
    }
    }
}
