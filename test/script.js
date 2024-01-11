function abbreviateNumber(value) {
    var newValue = value;
    if (value >= 1000) {
        var suffixes = ["", "k", "m", "b","t"];
        var suffixNum = Math.floor( (""+value).length/3 );
        var shortValue = '';
        for (var precision = 2; precision >= 1; precision--) {
            shortValue = parseFloat( (suffixNum != 0 ? (value / Math.pow(1000,suffixNum) ) : value).toPrecision(precision));
            var dotLessShortValue = (shortValue + '').replace(/[^a-zA-Z 0-9]+/g,'');
            if (dotLessShortValue.length <= 2) { break; }
        }
        if (shortValue % 1 != 0)  shortValue = shortValue.toFixed(1);
        newValue = shortValue+suffixes[suffixNum];
    }
    return newValue;
}

let title = document.querySelector('h1');

gameoflife = new GameOfLife({
    speed: 0, size: 2, zoom: 5,
    mergeColor: true,
    
    rate: 0.5,

    pause: false,

    grid: true,
    gridColor: 'black',

    selfSpawning: true,
    selfSpawningRate: 0.000000000000001,
    
    enableRandomColor: true,
    randomColor: {
        red:   { min: 0, max: 255 },
        green: { min: 127, max: 255 },
        blue:  { min: 0, max: 255 },
    },
    
    enableBirthMutation: true,
    birthMutation: {
        red:   { rate: 0.8, min: -10, max: 10 },
        green: { rate: 0, min: 0, max: 0 },
        blue:  { rate: 0.8, min: -10, max: 10 },
    },
    
    enableSelfMutation: true,
    selfMutation: {
        red:   { rate: 0.25, min: -1, max: 1 },
        green: { rate: 0.25, min: -1, max: 1 },
        blue:  { rate: 0.25, min: -1, max: 1 },
    },

    onClick: function(event) {
        let rect = this.canvas.getBoundingClientRect();
        let x = Math.round((event.clientX - rect.x) / (this.cellSize * this.zoom));
        let y = Math.round((event.clientY - rect.y) / (this.cellSize * this.zoom));

        let radius = Math.round(GameOfLife.range(5,30));

        this.spawnCircle({x,y,radius}, false);
    },

    afterStep: function() {
        let radius = 5;

        let n = 5;
        let v = this.generations.slice(-n).reduce((acc, cu) => acc + cu.percent.stasis, 0) / n;

        if (this.lastStep.percent.stasis >= 99.8 || this.lastStep.percent.stasis == v) {
            for (let zz = 0; zz < 5; zz++) {
                this.spawnCircle({
                    x: Math.round(GameOfLife.range(radius, this.columns - radius)),
                    y: Math.round(GameOfLife.range(radius, this.rows - radius)),
                    radius,
                    color: { red: {min: 0, max: 255}, green: {min: 0, max: 255}, blue: {min: 0, max: 255} }
                }, false);
            }
        }

        title.innerText = `gen: ${abbreviateNumber(this.generation)}  Alive: ${abbreviateNumber(this.lastStep.alive)} (${Math.round( this.lastStep.percent.alive * 100 ) / 100}%)  Dead: ${abbreviateNumber(this.lastStep.dead)} (${Math.round( this.lastStep.percent.dead * 100 ) / 100}%)`;
    }
});

gameoflife.setup();