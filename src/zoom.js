/* Code originally from
 * https://embed.plnkr.co/II6lgj511fsQ7l0QCoRi/
 * Modified to fit the needs of this project
 * */

//! TODO: BUG -> If you release pan off the canvas, it will continue to pan and requires you to click to stop it
export default class zoom {
    constructor(container, app) {
        this.Container = container;
        this.app = app;

        // This is required...
        this.handler = this.handler.bind(this);
        this.zoom = this.zoom.bind(this);

        this.pan = true;

        this.handler();
    }

    handler() {
        // TODO: Remove jquery dependency

        this.lastPos = null;

        $(this.app.view).mousewheel((e) => {
            this.zoom(e.deltaY, e.offsetX, e.offsetY);
        })
        .mousedown((event) => {
            this.lastPos = {x: event.offsetX, y: event.offsetY};
        })
        .mouseup((event) => {
            this.lastPos = null;
        })
        .mousemove((event) => {
            if (this.lastPos && this.pan) {
                this.Container.x += (event.offsetX - this.lastPos.x);
                this.Container.y += (event.offsetY - this.lastPos.y);
                this.lastPos = {x: event.offsetX, y: event.offsetY};
            }
        });
    }

    // TODO: Give s, x and y more cohesive names
    zoom(s, x, y) {
        const stage = this.Container;
        s = s > 0 ? 2 : 0.5;
        var worldPos = {x: (x - stage.x) / stage.scale.x, y: (y - stage.y)/stage.scale.y};
        var newScale = {x: stage.scale.x * s, y: stage.scale.y * s};

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
