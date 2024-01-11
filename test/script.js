gameoflife = new GameOfLife({
    speed: 100, size: 2, zoom: 5,
    mergeColor: true,
    
    rate: 0.25,

    grid: false,
    gridColor: 'red',

    selfSpawning: true,
    selfSpawningRate: 0.000000000000001,
    
    enableRandomColor: true,
    randomColor: {
        red: { min: 0, max: 255 },
        green: { min: 0, max: 255 },
        blue: { min: 0, max: 255 },
    },
    
    enableBirthMutation: true,
    birthMutation: {
        red: { rate: 0.8, min: -10, max: 10 },
        green: { rate: 0.8, min: -10, max: 10 },
        blue: { rate: 0.8, min: -10, max: 10 },
    },
    
    enableSelfMutation: true,
    selfMutation: {
        red: { rate: .25, min: -10, max: 10 },
        green: { rate: .25, min: -10, max: 10 },
        blue: { rate: .25, min: -10, max: 10 },
    },

    onClick: function() {
        console.log(this);
    },

    afterStep: function() {
        let radius = 20;

        let n = 10;
        let v = this.generations.slice(-n).reduce((acc, cu) => acc + cu.percent.stasis, 0) / n;

        if (this.lastStep.percent.stasis >= 99.8 || this.lastStep.percent.stasis == v) {
            this.spawnCircle({
                x: Math.round(GameOfLife.range(radius, this.columns - radius)),
                y: Math.round(GameOfLife.range(radius, this.rows - radius)),
                radius,
            });
        }
    }
});
gameoflife.setup();