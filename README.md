# GameOfLife Class

The `GameOfLife` class represents an implementation of Conway's Game of Life, a cellular automaton simulation. It provides a visual representation of cells evolving over generations based on certain rules.

## Constructor

```javascript
const options = {
  // Configuration options (optional)
};
const game = new GameOfLife(options);
```

- `options` (Object, optional): Configuration options for the Game of Life simulation. See the "Options" section below for details.

## Options

| Name                  | Type     | Description                                                                                       | Default |
|-----------------------|----------|---------------------------------------------------------------------------------------------------|---------|
| `afterStep`           | Function | Callback function to execute after each simulation step.                                          |         |
| `beforeStep`          | Function | Callback function to execute before each simulation step.                                         |         |
| `onClick`             | Function | Callback function to handle click events on the canvas.                                            |         |
| `container`           | HTMLElement | Container element to append the canvas.                                                           | `document.body` |
| `autoShow`            | Boolean  | Automatically show the canvas on initialization.                                                  | `false` |
| `grid`                | Boolean  | Display grid lines.                                                                              | `true`  |
| `gridColor`           | String   | Color of the grid lines.                                                                         | `'#ddd'` |
| `speed`               | Number   | Delay between simulation steps in milliseconds.                                                   | `100`   |
| `pause`               | Boolean  | Initial state of the simulation (paused or running).                                               | `false` |
| `zoom`                | Number   | Zoom factor for cell size.                                                                       | `1`     |
| `rate` or `spawnRate` | Number   | Initial spawn rate of live cells.                                                                 | `0.5`   |
| `enableSelfSpawning`  | Boolean  | Enable self-spawning cells.                                                                      | `false` |
| `selfSpawningRate`    | Number   | Rate of self-spawning cells.                                                                     | `0`     |
| `enableSelfMutation`  | Boolean  | Enable self-mutation of cell colors.                                                              | `false` |
| `selfMutation`        | Object   | Configuration for self-mutation of cell colors.                                                   | `{ red: { rate: 0.2, min: -10, max: 10 }, blue: { rate: 0.2, min: -10, max: 10 }, green: { rate: 0.2, min: -10, max: 10 } }` |
| `enableBirthMutation` | Boolean  | Enable mutation of colors for newly born cells.                                                   | `false` |
| `birthMutation`       | Object   | Configuration for color mutation of newly born cells.                                             | `{ red: { rate: 0.2, min: -10, max: 10 }, blue: { rate: 0.2, min: -10, max: 10 }, green: { rate: 0.2, min: -10, max: 10 } }` |
| `enableRandomColor`   | Boolean  | Enable random colors for cells.                                                                  | `false` |
| `randomColor`         | Object   | Configuration for random colors.                                                                 | `{ red: { min: 127, max: 255 }, blue: { min: 127, max: 255 }, green: { min: 127, max: 255 } }` |
| `defaultColor`        | Object   | Default color configuration for cells.                                                           | `{ red: { min: 0, max: 0 }, blue: { min: 0, max: 0 }, green: { min: 0, max: 0 } }` |
| `mergeColor`          | Boolean  | Merge colors of neighboring cells.                                                               | `true`  |
| `size`                | Number   | Initial size of each cell.                                                                       | `5`     |

### Color Configuration Options

For properties like `selfMutation`, `birthMutation`, `randomColor`, and `defaultColor`, the following sub-properties are available for each color channel (`red`, `green`, and `blue`):

| Sub-Property | Type   | Description                                 |
|--------------|--------|---------------------------------------------|
| `rate`       | Number | Mutation rate for the color channel.        |
| `min`        | Number | Minimum value for the color channel.        |
| `max`        | Number | Maximum value for the color channel.        |

## Methods

### `setup()`

Initializes and sets up the Game of Life simulation. This method should be called after creating a `GameOfLife` instance.

```javascript
game.setup();
```

### `delete()`

Deletes the Game of Life simulation, clearing intervals and removing event listeners.

```javascript
game.delete();
```

### `spawnCircle(options)`

Spawns cells in a circular pattern based on the specified options.

- `options` (Object): Configuration for the circular spawn.
  - `x`, `y` (Number): Coordinates of the center of the circle.
  - `radius` (Number): Radius of the circle.
  - `rate` (Number, optional): Spawn rate for cells in the circle.

```javascript
game.spawnCircle({ x: 10, y: 10, radius: 5, rate: 0.7 });
```

### `beforeStep()`

Callback method executed before each simulation step.

### `afterStep()`

Callback method executed after each simulation step.

### `onClick(event)`

Callback method executed when a click event occurs on the canvas.

### `step()`

Performs a step in the simulation, calculating the next generation and updating the canvas.



# Example of use

```javascript
// Create an instance of the GameOfLife with desired options
const game = new GameOfLife({
  container: document.getElementById('game-container'), // Specify the container element
  autoShow: true, // Automatically show the canvas
  speed: 100, // Set the simulation speed to 100 milliseconds between steps
  size: 10, // Set the size of each cell to 10 pixels
  spawnRate: 0.5, // Set the initial spawn rate of live cells
  enableRandomColor: true, // Enable random colors for cells
});

// Set up the GameOfLife simulation
game.setup();

// Optionally, you can define callback functions for specific events
game.onClick = (event) => {
  // Handle click events on the canvas
  console.log('Canvas clicked at:', event.clientX, event.clientY);
};

// You can also define functions to be executed before and after each step
game.beforeStep = () => {
  console.log('Before Step');
};

game.afterStep = () => {
  console.log('After Step');
};

// Optionally, you can spawn cells in a circular pattern
game.spawnCircle({
  x: 20,
  y: 20,
  radius: 5,
  rate: 0.7,
});

// Perform steps in the simulation
game.step();
```