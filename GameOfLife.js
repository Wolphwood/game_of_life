class GameOfLife {
    #pause;

    constructor(options = {}) {
        if (options.afterStep) this.afterStep = options.afterStep;
        if (options.beforeStep) this.beforeStep = options.beforeStep;
        if (options.onClick) this.onClick = options.onClick;

        this.historyLimit = options.historyLimit ?? 5000;
        this.historySaveBoard = options.historySaveBoard ?? false;

        this.container = options.container ?? document.body;

        this.canvas = document.createElement('canvas');
        this.canvas.classList.add('game-of-life');
        if (options.autoShow) this.canvas.classList.add('show');

        this.grid = options.grid ?? true;
        this.gridColor = options.gridColor ?? '#ddd';

        this.context = this.canvas.getContext('2d');

        this.enableDecay = options.enableDecay ?? options.decay ?? false; 
        this.decaySpeed = options.decay ?? options.decaySpeed ?? 0.1;

        this.enableDecayMutation = options.enableDecayMutation ?? !!options.decayMutation ?? false;
        this.decayMutation = this.#parseColor(options.decayMutation);

        this.backgroundColor = this.#parseColor(options.background ?? options.backgroundColor ?? 'transparent')

        this.cellVisibility = options.cellVisibility ?? options.visibility ?? false;
        this.cellVisibilityOpacity = options.cellVisibilityOpacity ?? options.visibilityOpacity ?? 0.5;
        this.cellVisibilityColor = this.#parseColor(options.cellVisibilityColor ?? options.visibilityColor);

        this.loopDelay = options.speed ?? 100;
        this.#pause = options.pause ?? false;

        this.zoom = options.zoom ?? 1;

        let containerRect = this.container.getBoundingClientRect();
        this.canvas.width = containerRect.width;
        this.canvas.height = containerRect.height;

        this.spawnRate = options.rate ?? options.spawnRate ?? 0.5;

        this.enableSelfSpawning = options.enableSelfSpawning ?? !!options.selfSpawning ?? false;
        this.selfSpawningRate = options.selfSpawning ?? 0;

        this.enableSelfMutation = options.enableSelfMutation ?? !!options.selfMutation ?? false;
        this.selfMutation = {
            red: Object.assign({ rate: 0.2, min: -10, max: 10 }, options.selfMutation?.red ?? {}),
            blue: Object.assign({ rate: 0.2, min: -10, max: 10 }, options.selfMutation?.blue ?? {}),
            green: Object.assign({ rate: 0.2, min: -10, max: 10 }, options.selfMutation?.green ?? {}),
        }
        
        this.enableBirthMutation = options.enableBirthMutation ?? !!options.enableBirthMutation ?? false;
        this.birthMutation = {
            red: Object.assign({ rate: 0.2, min: -10, max: 10 }, options.enableBirthMutation?.red ?? {}),
            blue: Object.assign({ rate: 0.2, min: -10, max: 10 }, options.enableBirthMutation?.blue ?? {}),
            green: Object.assign({ rate: 0.2, min: -10, max: 10 }, options.enableBirthMutation?.green ?? {}),
        }

        this.enableRandomColor = options.enableRandomColor ?? !!options.randomColor ?? false;
        
        this.randomColor = {
            red: Object.assign({ min: 127, max: 255 }, options.randomColor?.red ?? {}),
            blue: Object.assign({ min: 127, max: 255 }, options.randomColor?.blue ?? {}),
            green: Object.assign({ min: 127, max: 255 }, options.randomColor?.green ?? {}),
        }

        this.defaultColor = {
            red: Object.assign({ min: 0, max: 0 }, options.defaultColor?.red ?? {}),
            blue: Object.assign({ min: 0, max: 0 }, options.defaultColor?.blue ?? {}),
            green: Object.assign({ min: 0, max: 0 }, options.defaultColor?.green ?? {}),
        }

        this.mergeColor = options.mergeColor ?? options.merge ?? true;        

        this.cellSize = options.size ?? 5;

        this.columns = Math.round(this.canvas.width / (this.cellSize * this.zoom));
        this.rows = Math.round(this.canvas.height / (this.cellSize * this.zoom));

        this.interval = null;

        this.board = Array.from(Array(this.columns), () => Array(this.rows));

        this.generation = 0;
        this.generations = [];

        this.structures = new Map();
    }

    static range(min,max) {
        return Math.random() * (max - min) + min;
    }

    #testRate(rate) {
        return Math.random() > (1 - rate);
    }

    #getRandomRangeRound(min,max) {
        return Math.round(Math.random() * (max - min) + min);
    }

    #componentToHex(c) {
        let hex = c.toString(16);
        return hex.length == 1 ? "0" + hex : hex;
    }
      
    #rgbToHex(color) {
        if (this.#_isString(color)) return color;
        let {red, green, blue} = color;
        return "#" + this.#componentToHex(red) + this.#componentToHex(green) + this.#componentToHex(blue);
    }

    #parseColor(_color) {
        const ensureFormat = (c) => {
            if (this.#_isNumber(c, false, false)) return c;
            if (this.#_isObject(c) && ['min','max'].every(k => Object.keys(c).includes(k))) return c;
            if (this.#_isArray(c)) {
                if (c.length == 1) return c[0];
                if (c.length == 2) {
                    let [min, max] = c.sort();
                    return {min, max};
                }
                if (c.length == 3) {
                    let [min, max] = c.slice(0,2).sort();
                    let rate = c.slice(2);
                    return {min, max, rate};
                }
            }

            console.error(`Format Error : "${c}" must be a number between 0-255 or range-object {min: 0-255, max: min-255}`);
            
            return {min: 0, max: 255};
        }

        if (this.#_isString(_color)) return _color;
        if (this.#_isNumber(_color)) return _color;
        
        if (this.#_isObject(_color)) {
            let {r,g,b, a} = _color;
            let {red, green, blue, alpha, rate} = _color;

            let color = {
                red  : ensureFormat(red   ?? r),
                green: ensureFormat(green ?? g),
                blue : ensureFormat(blue  ?? b),
            };

            if (this.#_isNumber(alpha ?? a)) color.alpha = alpha ?? a;
            if (this.#_isNumber(rate)) color.rate = rate;

            return color;
        }

        if (this.#_isArray(_color)) {
            let [red, green, blue, alpha] = _color;

            let color = {
                red  : ensureFormat(red  ),
                green: ensureFormat(green),
                blue : ensureFormat(blue ),
            };

            if (this.#_isNumber(alpha ?? a)) color.alpha = alpha ?? a;
            if (this.#_isNumber(rate)) color.rate = rate;

            return color;
        }

        return {...this.defaultColor};
    }

    #getColor(color) {
        if (typeof color == 'string') return color;

        let {red, green, blue} = color;

        const component = ({min, max}) => this.#getRandomRangeRound(min ?? 127, max ?? 255);
        return {
            red  : !red   ? typeof this.defaultColor.red   == 'number' ? this.defaultColor.red   : component(this.defaultColor.red)   : typeof red   == 'number' ? red   : component(red),
            green: !green ? typeof this.defaultColor.green == 'number' ? this.defaultColor.green : component(this.defaultColor.green) : typeof green == 'number' ? green : component(green),
            blue : !blue  ? typeof this.defaultColor.blue  == 'number' ? this.defaultColor.blue  : component(this.defaultColor.blue)  : typeof blue  == 'number' ? blue  : component(blue),
        };
    }

    #createCellColor(alive) {
        return alive
            ? this.enableRandomColor
                ? this.#getColor(this.randomColor)
                : this.#getColor(this.defaultColor)
            : {red:0,green:0,blue:0};
    }

    setup() {
        this.init();
        this.container.appendChild(this.canvas);
        
        this.canvas.addEventListener('click', (event) => this.onClick(event));

        this.step();
        this.draw();
        
        this.play();
    }

    step() {
        this.beforeStep();
        this.calc();
        this.afterStep();
    }

    refresh() {
        if (!this.#pause) this.step();
        this.draw();
    }

    play() {
        clearTimeout(this.loop);
        this.loop = setTimeout(() => this.play(), this.loopDelay);
        this.refresh();
    }

    pause() {
        clearTimeout(this.loop);
        this.loop = setTimeout(() => this.play(), this.loopDelay);
    }

    delete() {
        clearInterval(this.interval);
        if (this.canvasListener) this.canvas.removeEventListener('click', this.canvasListener);
        this.canvas.remove();
    }

    spawnCircle({ x, y, radius, rate, color }, override = true) {
        const inRadius = (xc, yc, x, y, radius) => {
            let distance = Math.sqrt(Math.pow(x - xc, 2) + Math.pow(y - yc, 2));
            
            // Vérification si la distance est inférieure ou égale au rayon
            return distance <= radius;
        };
        
        

        for (let i = -radius; i <= radius; i++) {
            for (let j = -radius; j <= radius; j++) {
                
                if (!this.board[x+i]) continue;
                if (!this.board[x+i][y+j]) continue;
                
                if (this.board[x+i][y+j].alive && !override) continue;

                if (inRadius(x, y, x+i,y+j, radius)) {
                    let alive = this.#testRate(rate ?? this.spawnRate);
                    
                    let cellColor = color ? this.#getColor(color) : this.#createCellColor(alive);
                    
                    this.board[x+i][y+j] = {
                        alive, color: cellColor
                    };
                }
            }
        }
    }

    get structure() {
        return {
            load: (...args) => this.#loadStructure.apply(this, args),
            spawn: (...args) => this.#spawnStructure.apply(this, args),
        }
    }

    #loadStructure(name, data) {
        this.structures.set(name, data);
    }
    
    #spawnStructure(name, x, y) {
        let structure = this.structures.get(name);

        for (let sx = 0; sx < structure.length; sx++) {
            for (let sy = 0; sy < structure[sx].length; sy++) {
                this.board[x + sx][y + sy].alive = !!structure[sx][sy]
            }
        }
    }
    

    clear() {
        for (let x = 0; x < this.columns; x++) {
            for (let y = 0; y < this.rows; y++) {
                this.board[x][y] = {
                    alive: false,
                    color: this.#getColor(this.defaultColor)
                }
            }
        }
    }

    cell(x,y) {
        let cell = this.board[x][y];

        cell.setColor = ({red, green, blue} = {}) => {
            if (typeof red   !== 'undefined') cell.color.red   = red;
            if (typeof green !== 'undefined') cell.color.green = green;
            if (typeof blue  !== 'undefined') cell.color.blue  = blue;

            return cell;
        }

        cell.getColor = () => {
            return cell.color;
        }

        cell.spawn = () => {
            cell.alive = true;
            return cell;
        }

        cell.kill = () => {
            cell.alive = false;
            return cell;
        }

        return cell;
    }

    beforeStep() {}

    afterStep() {}
    
    onClick(event) {}

    #mergeColors(...colors) {
        let color = colors.reduce((cu,acc) => Object({ red: acc.red + cu.red, green: acc.green + cu.green, blue: acc.blue + cu.blue }), {red:0,green:0,blue:0});
        Object.keys(color).forEach(k => color[k] = Math.round(color[k] / colors.length));
        
        return color;
    }

    init() {
        this.generation = 0;
        this.generations = [];
        
        for (let i = 0; i < this.columns; i++) {
            for (let j = 0; j < this.rows; j++) {
                let alive = this.#testRate(this.spawnRate);
                let color = this.#createCellColor(alive);

                this.board[i][j] = {
                    alive, color, decay: 1
                };
            }
        }
    }

    calc() {
        let old = [...this.board.map(a => [...a])];

        let next = [...this.board.map(a => [...a])];

        let aliveCells = 0;
        let newCells = 0;
        let deadCells = 0;
        let stasisCells = 0;

        for (let x = 0; x < this.columns; x++) {
            for (let y = 0; y < this.rows; y++) {
                let neighbors = [];

                for (let i = -1; i <= 1; i++) {
                    for (let j = -1; j <= 1; j++) {
                        if (i == 0 && j == 0) continue;

                        if (!this.board[x + i]) continue;
                        if (!this.board[x + i][y + j]) continue;

                        if (this.board[x + i][y + j].alive) {
                            neighbors.push(this.board[x + i][y + j].color ?? this.#createCellColor(true));
                        }
                    }
                }

                // Self Spawn on edge (need to be improved)
                // if (this.options.selfSpawn ?? false) {
                //     let SpawningAreaSize = this.options.selfSpawnArea ?? 2;
                //     if ( (x <= SpawningAreaSize || x >= this.columns - SpawningAreaSize) || (y <= SpawningAreaSize || y >= this.rows - SpawningAreaSize) ) {
                //         if (Math.random() > (this.options.selfSpawnRate ?? 0.95)) {
                //             while (neighbors.length < 3) {
                //                 let color = this.enableRandomColor ? this.#getColor(this.randomColor) : this.#getColor(this.defaultColor);
                //                 neighbors.push(color);
                //             }
                //         };
                //     }
                // }

                if (this.board[x][y].alive) {
                    aliveCells++;
                } else {
                    next[x][y].decay = Math.min(1, next[x][y].decay + this.decaySpeed);

                    // Decay Mutation
                    if (this.enableDecayMutation) {
                        let mutation = this.#getColor(this.decayMutation);
                        
                        if (this.#testRate(this.decayMutation.red?.rate   ?? 0)) next[x][y].color.red   = Math.max(0, Math.min(next[x][y].color.red   + mutation.red,   255));
                        if (this.#testRate(this.decayMutation.green?.rate ?? 0)) next[x][y].color.green = Math.max(0, Math.min(next[x][y].color.green + mutation.green, 255));
                        if (this.#testRate(this.decayMutation.blue?.rate  ?? 0)) next[x][y].color.blue  = Math.max(0, Math.min(next[x][y].color.blue  + mutation.blue,  255));
                    }
                }

                // Rules of Life
                if (this.board[x][y].alive && neighbors.length < 2) { // Loneliness
                    next[x][y].alive = false;
                    deadCells++;
                } else
                if (this.board[x][y].alive && neighbors.length > 3) { // Overpopulation
                    next[x][y].alive = false;
                    deadCells++;
                } else
                if (!this.board[x][y].alive && neighbors.length == 3) { // Reproduction
                    newCells++;

                    let color;

                    // Define the birth color by merging all neighbors colors or by creating a new one
                    if (this.mergeColor) {
                        color = this.#mergeColors(...neighbors);
                    } else {
                        color = this.#createCellColor(true);
                    }

                    // Birth Mutation
                    if (this.enableBirthMutation) {
                        let mutation = this.#getColor(this.birthMutation);
                        
                        if (this.#testRate(this.birthMutation.red?.rate   ?? 0)) color.red   = Math.max(0, Math.min(color.red   + mutation.red,   255));
                        if (this.#testRate(this.birthMutation.green?.rate ?? 0)) color.green = Math.max(0, Math.min(color.green + mutation.green, 255));
                        if (this.#testRate(this.birthMutation.blue?.rate  ?? 0)) color.blue  = Math.max(0, Math.min(color.blue  + mutation.blue,  255));
                    }

                    next[x][y] = { alive: true, color, decay: 0 };
                } else { // Stasis
                    if (this.board[x][y].alive && this.enableSelfMutation) {
                        let {alive, color} = this.board[x][y];

                        let mutation = this.#getColor(this.selfMutation);
                        
                        if (this.#testRate(this.selfMutation.red?.rate   ?? 0)) color.red   = Math.max(0, Math.min(color.red   + mutation.red,   255));
                        if (this.#testRate(this.selfMutation.green?.rate ?? 0)) color.green = Math.max(0, Math.min(color.green + mutation.green, 255));
                        if (this.#testRate(this.selfMutation.blue?.rate  ?? 0)) color.blue  = Math.max(0, Math.min(color.blue  + mutation.blue,  255));

                        next[x][y] = { alive, color };
                    } else {
                        next[x][y] = this.board[x][y];
                    }
                    stasisCells++;
                }
            }
        }

        this.board = [...next.map(a => [...a])];

        
        let totalCells = newCells + deadCells + stasisCells;
        
        this.generation++;
        this.lastStep = {
            board: this.historySaveBoard ? old : null,
            new: newCells,
            dead: deadCells,
            stasis: stasisCells,
            total: totalCells,
            alive: aliveCells,
            dead: totalCells - aliveCells,
            percent : {
                new: (newCells * 100) / totalCells,
                dead: (deadCells * 100) / totalCells,
                stasis: (stasisCells * 100) / totalCells,
                alive: (aliveCells * 100) / totalCells,
                dead: ((totalCells - aliveCells) * 100) / totalCells,
            }
        };
        this.generations.push(this.lastStep);

        while (this.generations.length > this.historyLimit) {
            this.generations.shift();
        }
    }

    draw() {
        this.context.fillStyle = this.#getColor(this.backgroundColor);
        this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
        let w = this.cellSize * this.zoom;
        
        for (let i = 0; i < this.columns; i++) {
            for (let j = 0; j < this.rows; j++) {
                if (this.board[i][j].alive) {
                    this.context.fillStyle = this.#rgbToHex(this.board[i][j].color);
                } else
                
                if (this.enableDecay && this.board[i][j].decay < 1) {
                    this.context.fillStyle = this.#rgbToHex(this.board[i][j].color);
                } else
                
                {
                    this.context.fillStyle = this.#getColor(this.backgroundColor);
                }

                if (this.enableDecay) {
                    this.context.globalAlpha = 1 - this.board[i][j].decay;
                }
                
                this.context.fillRect(i * w, j * w, w, w);
                this.context.globalAlpha = 1;
                
                if (this.grid) {
                    this.context.strokeStyle = this.#rgbToHex(this.#getColor(this.gridColor));
                    this.context.strokeRect(i * w, j * w, w - 1, w - 1);   
                }

                if (this.cellVisibility && this.board[i][j].alive && (i + j) % 2) {
                    this.context.globalAlpha = this.cellVisibilityOpacity;
                    this.context.fillStyle = this.#rgbToHex(this.#getColor(this.cellVisibilityColor));
                    this.context.fillRect(i * w, j * w, w, w);
                    
                    this.context.globalAlpha = 1;
                }
            }
        }
    }

    /* Types Checkers */
    #_isString(n, empty = true) {
        return typeof (empty ? n : n || false) === 'string';
    }
    #_isNumber(n, nan = true, infinite = true) {
        if (isNaN(n) && !nan) return false;
        if (!isFinite(n) && !infinite) return false;
        return typeof n === 'number';
    }
    #_isObject(n, nul = true) {
        if (n === null && !nul) return false;
        return typeof n === 'object';
    }
    #_isArray(n) {
        return this.#_isObject(n, false) && Array.isArray(n);
    }
    #_isBoolean(n) {
        return typeof n === 'boolean';
    }
    

    /* Getters & Setters */
    get speed() {
        return this.loopDelay;
    }
    set speed(v) {
        if (this.#_isNumber(v)) {
            this.loopDelay = v;
            this.play();
        }
    }
    
    setGridColor(o) {
        this.gridColor = this.#parseColor(o);
    }

    
    setDecayMutationColor(o) {
        this.decayMutation = this.#parseColor(o);
    }
    setSelfSpawningColor(v) {
        this.selfSpawning = this.#parseColor(o);
    }
    setSelfMutationColor(o) {
        this.selfMutation = this.#parseColor(o);
    }
    setBirthMutationColor(o) {
        this.birthMutation = this.#parseColor(o);
    }
    setRandomColor(o) {
        this.randomColor = this.#parseColor(o);
    }
    setDefaultColor(o) {
        this.defaultColor = this.#parseColor(o);
    }
    setCellVisibilityColor(o) {
        this.cellVisibilityColor = this.#parseColor(o);
    }
}