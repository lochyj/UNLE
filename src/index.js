class WCNL {
    constructor(data) {
        this.stage = data.stage;
        this.constrain = data.constrain || true;
    }

    init() {
        
    }

    applyConstraints() {

    }

    collisions() {

    }

    applyVelocity() {

    }

    loop() {
        // This needs to be as optimized as possible
        // This is the main loop
        this.collisions();
        this.applyVelocity();

        if (this.constrain) {
            this.stage.constrain();
        }
    }
}