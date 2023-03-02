
// Wait until the page loads
window.addEventListener("load", function() {

    // Wait until the user clicks the start button
    const startButton = document.getElementById("start");
    startButton.addEventListener("click", function() {
        
        /** @type {HTMLCanvasElement} **/ // Suggests canvas methods

        // Handle canvas
        const canvas = document.getElementById("game-canvas");
        const context = canvas.getContext("2d");
        canvas.width = 1392;
        canvas.height = 1000;
        // Put layers from game.html into an array
        const backgroundLayers = [];
        backgroundLayers[0] = document.getElementById("layer-0");
        backgroundLayers[1] = document.getElementById("layer-1");
        backgroundLayers[2] = document.getElementById("layer-2");
        backgroundLayers[3] = document.getElementById("layer-3");
        backgroundLayers[4] = document.getElementById("layer-4");
        backgroundLayers[5] = document.getElementById("layer-5");
        backgroundLayers[6] = document.getElementById("layer-6");
        backgroundLayers[7] = document.getElementById("layer-7");
        backgroundLayers[8] = document.getElementById("layer-8");
        backgroundLayers[9] = document.getElementById("layer-9");
        backgroundLayers[10] = document.getElementById("layer-10");
        const layers = [];
        // Variable to control general game speed
        let gameSpeedMod = 1.5;
        // Game state trackers
        let gameOver = false;
        let score = 0;
        // Array for active dragons
        let dragons = [];
        // Player attacks trackers
        let attackGround = false;
        let attackJump = false;
        // Array for triggered explosions
        let explosions = [];

        // Class for parallax background layers
        class Background {
            constructor(gameWidth, gameHeight, image, speed) {
                // Size and placement
                this.gameWidth = gameWidth;
                this.gameHeight = gameHeight;
                this.width = 1392;
                this.height = 1000;
                this.x = 0;
                this.y = 0;
                // Get the layer file from game.html
                this.image = image;
                // Layer speed
                this.speed = speed;
            }
            // Displays the layer
            draw(context) {
                // Draw the image twice, one next to the other
                context.drawImage(this.image, this.x, this.y, this.width, this.height);
                // Place the 2nd image immediately behind the 1st one, accounting for the layer's speed
                context.drawImage(this.image, this.x + this.width - this.speed, this.y, this.width, this.height);
            }
            // Animates the layer
            update() {
                // Check if the player is attacking
                if (attackGround == false) {
                    // Animate the background if not
                    this.x -= this.speed;
                    if (this.x <= -this.width) {
                        this.x = 0;
                    }
                }
            }
        }

        // Class to handle user input
        class InputHandler {
            constructor() {
                // Array to store information about currently pressed keys
                this.keys = [];
                // Listen for the user pressing keys
                window.addEventListener("keydown", event => {
                    // Check if any key is pressed and whether it's not in the array yet
                    if ((event.key == " " ||
                         event.key == "ArrowUp" ||
                         event.key == "ArrowLeft" ||
                         event.key == "ArrowRight")
                         && this.keys.indexOf(event.key) == -1) {
                        // Add the currently pressed key to the array if so
                        this.keys.push(event.key);
                    }
                });
                // Listen for the user releasing keys
                window.addEventListener("keyup", event => {
                    // Check if any key is released
                    if (event.key == " " ||
                        event.key == "ArrowUp" ||
                        event.key == "ArrowLeft" ||
                        event.key == "ArrowRight") {
                        // Remove the currently released key from the array if so
                        this.keys.splice(this.keys.indexOf(event.key), 1);
                    }
                });
            }
        }

        // Class for the player character
        class Player {
            constructor(gameWidth, gameHeight) {
                // Size and placement
                this.gameWidth = gameWidth;
                this.gameHeight = gameHeight;
                this.width = 256;
                this.height = 128;
                this.x = -60; // Put the player as close to the right border as possible
                this.y = this.gameHeight - (this.height + 120); // Put the player on the grass
                // Get the sprite image from game.html
                this.image = document.getElementById("player");
                // Properites to navigate through the sprite sheet
                this.frameX = 0;
                this.frameY = 0;
                this.maxFrame = 7; // How many horizontal character frames there are on the sprite sheet
                this.fps = 12; // How quickly to switch between character frames on the sprite sheet horizontally
                this.frameInterval = 1000 / this.fps; // How long should a single character frame on the sprite sheet last
                this.frameTimer = 0; // Counter to keep track of game frames (from 0 to frameInterval)
                // Set player's horizontal speed
                this.speed = 0;
                // Properites to handle jumping
                this.jumpSpeed = 0; // Vertical speed
                this.gravity = 1; // Gravitational force to pull the player back to the ground
            }
            // Displays the player
            draw(context) {

                // HIT BOXES
                context.strokeStyle = "white";
                context.beginPath();
                context.arc(this.x + this.width / 2.5, this.y + this.height / 2, this.width / 4, 0, Math.PI * 2);
                context.stroke();


                // Draw the image, using frameX and frameY to crop it / switch between character frames on the sprite sheet
                context.drawImage(this.image, this.frameX * this.width, this.frameY * this.height, this.width, this.height, this.x, this.y, this.width, this.height);
            }
            // Animates the player
            update(userInput, deltaTime, dragons) {
                
                // COLLISSION DETECTION
                
                // Player hit
                // Iterate over all active dragons
                dragons.forEach(dragon => {
                    // Calculate the horizontal distance between centers of circles around actors
                    const dx = (dragon.x + dragon.width / 2) - (this.x + this.width / 2.5);
                    // Calculate the vertical distance between centers of circles around actors
                    const dy = (dragon.y + dragon.height / 2) - (this.y + this.height / 2);
                    // Calculate diagonal distance using Pithagoren theorem
                    const distance = Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2));
                    // Check if hit boxes (circles) overlap
                    if (distance < (dragon.width / 3 + this.width / 4)) {
                        gameOver = true;
                    }
                });

                // Player ground attack
                // Iterate over all active dragons
                if (attackGround == true || attackJump == true){
                    dragons.forEach(dragon => {
                        
                        let dragonTop = dragon.y; // Dragon's hit box top
                        let dragonBottom = dragon.y + dragon.height; // Dragon's hit box bottom
                        let playerFront = this.x + this.width / 2.5 + this.width / 4; // Player's hit box front
                        let groundAttackTop = this.y + this.height / 4; // Top range of the ground attack
                        let groundAttackBottom = this.y + this.height / 2; // Bottom range of the ground attack
                        let groundAttackRange = this.x + this.width / 2.5 + this.width / 2.5; // Horizontal range of the ground attack
                        let jumpAttackTop = this.y; // Top range of the jump attack
                        let jumpAttackBottom = this.y + this.height / 2; // Bottom range of the jump attack
                        let jumpAttackRange = this.x + this.width / 2.5 + this.width / 3.5; // Horizontal range of the ground attack
                        
                        // Check if player attacks from the ground
                        if (attackGround == true) {
                            // Check if dragon's in range
                             if (dragonBottom > groundAttackTop && dragonTop < groundAttackBottom && (dragon.x < groundAttackRange && dragon.x > playerFront)) {
                                // Kill the dragon, trigger explosion and increase score if so
                                explosions.push(new Explosion(dragon.x, dragon.y));                                
                                dragon.killed = true;
                                score++;
                             }
                        }
                        // Check if player attacks while jumping
                        if (attackJump == true) {
                            // Check if dragon's in range
                            if (dragonBottom > jumpAttackTop && dragonTop < jumpAttackBottom && (dragon.x < jumpAttackRange && dragon.x > playerFront)) {
                                // Kill the dragon, trigger explosion and increase score if so
                                explosions.push(new Explosion(dragon.x, dragon.y));
                                dragon.killed = true;
                                score++;
                            }
                        }
                    });
                }

                // PLAYER ANIMATION

                // Check if current character frame should finish
                if (this.frameTimer > this.frameInterval) {
                    // Check if it's the last character frame (horizontally) on the sprite sheet
                    if (this.frameX >= this.maxFrame) {
                        // Switch to the first character frame on the sprite sheet if so
                        this.frameX = 0;
                        // Check if the player is attacking
                        if (attackGround == true) {
                            // Finish the attack if so
                            attackGround = false;
                        }
                        if (attackJump == true) {
                            // Finish the attack if so
                            attackJump = false;
                        }
                    }
                    else {
                        // Otherwise, keep switching character frames on the sprite sheet
                        this.frameX++;
                    }
                    // Reset the game frame counter
                    this.frameTimer = 0;
                }
                else {
                    // Otherwise keep increasing the game frame counter
                    this.frameTimer += deltaTime;
                }
                
                // PLAYER CONTROLS

                // Check if user pressed the right arrow key
                if (userInput.keys.indexOf("ArrowRight") != -1 && attackGround == false) {
                    // Increase horizontal speed if so
                    this.speed = 5;
                }
                // Check if user pressed the left arrow key
                else if (userInput.keys.indexOf("ArrowLeft") != -1 && attackGround == false) {
                    // Decrease horizontal speed if so
                    this.speed = -5;
                }
                // Check if user pressed the spacebar key while on the ground
                else if (userInput.keys.indexOf(" ") != -1 && this.onGround() == true) {
                    // Initiate the appropriate attack
                    attackGround = true;
                }
                else {
                    // Otherwise, don't move
                    this.speed = 0;
                }
                
                // The two conditions below have to be independent from those above to allow simultaneous jumping and moving horizontally
                // Check if user pressed the up arrow key being on the ground
                if (userInput.keys.indexOf("ArrowUp") != -1 && this.onGround() == true) {
                    // Jump if so
                    this.jumpSpeed -= 32;
                }
                // Check if user pressed the spacebar key while jumping
                if (userInput.keys.indexOf(" ") != -1 && this.onGround() == false) {
                    // Initiate the appropriate attack
                    attackJump = true;
                }
                
                // HORIZONTAL MOVEMENT

                // Keep moving horizontally if not attacking on the ground
                if (attackGround == false) {
                    this.x += this.speed;
                }
                // Make sure player doesn't go beyond canvas borders horizontally
                if (this.x < -60) { // Left border
                    this.x = -60;
                }
                else if (this.x > this.gameWidth - this.width + 120) { // Right border
                    this.x = this.gameWidth - this.width + 120;
                }
                
                // VERTICAL MOVEMENT

                // Keep moving vertically
                this.y += this.jumpSpeed;
                // Make sure player comes back to the ground if jumping
                if (this.onGround() == false) {
                    this.jumpSpeed += this.gravity; // Keep pulling the player back down
                    this.maxFrame = 5; // Set the number of character frames for jumping on the sprite sheer
                    this.frameY = 1; // Switch to the row with jumping animation on the sprite sheet
                    // Check if the player is attacking while jumping
                    if (attackJump == true) {
                        // Switch to attack character frames on the sprite sheet if so
                        this.maxFrame = 7;
                        this.frameY = 3;
                    }
                }
                else {
                    // Otherwise switch to horizontal movement character frames on the sprite sheet
                    this.jumpSpeed = 0;
                    this.maxFrame = 7;
                    this.frameY = 0;
                    // Check if the player is attacking on the ground
                    if (attackGround == true) {
                        // Switch to attack character frames on the sprite sheet if so
                        this.maxFrame = 7;
                        this.frameY = 2;
                    }
                }
                // Make sure player lands on the ground after a jump
                if (this.y > this.gameHeight - (this.height + 120)) {
                    this.y = this.gameHeight - (this.height + 120);
                }
            }
            // Determines if player's on the ground
            onGround() {
                // Check if player's jumping
                if (this.y >= this.gameHeight - (this.height + 120)) {
                    return true;
                }
                else {
                    return false;
                }
            }
        }

        // Class for the dragons
        class Dragon {
            constructor(gameWidth, gameHeight) {
                // Size and placement
                this.gameWidth = gameWidth;
                this.gameHeight = gameHeight;
                this.width = 191;
                this.height = 161;
                this.x = this.gameWidth;
                this.y = this.gameHeight - (this.height + 120) - (Math.random() * 300); // Randomize vertical position
                // Get the sprite image from game.html
                this.image = document.getElementById("dragon");
                // Properites to navigate through the sprite sheet
                this.frameX = 0;
                this.frameY = 0;
                this.maxFrame = 2; // How many horizontal character frames there are on the sprite sheet
                this.fps = 10; // How quickly to switch between character frames on the sprite sheet horizontally
                this.frameInterval = 1000 / this.fps; // How long should a single character frame on the sprite sheet last
                this.frameTimer = 0; // Counter to keep track of game frames (from 0 to frameInterval)
                // Set dragon's horizontal speed
                this.speed = Math.random() * 6 + 6; //Randomize speed
                // Trackers for dragons to be deleted
                this.markedForDeletion = false;
                this.killed = false;
            }
            // Displays the dragon
            draw(context) {

                // HIT BOXES
                context.strokeStyle = "white";
                context.beginPath();
                context.arc(this.x + this.width / 2, this.y + this.height / 2, this.width / 3, 0, Math.PI * 2);
                context.stroke();

                // Draw the image, using frameX and frameY to crop it / switch between character frames on the sprite sheet
                context.drawImage(this.image, this.frameX * this.width, this.frameY * this.height, this.width, this.height, this.x, this.y, this.width, this.height);
            }
            // Animates the dragon
            update(deltaTime) {
                // Check if current character frame should finish
                if (this.frameTimer > this.frameInterval) {
                    // Check if it's the last character frame (horizontally) on the sprite sheet
                    if (this.frameX >= this.maxFrame) {
                        // Switch to the first character frame on the sprite sheet if so
                        this.frameX = 0;
                    }
                    else {
                        // Otherwise, keep switching character frames on the sprite sheet
                        this.frameX++;
                    }
                    // Reset the game frame counter
                    this.frameTimer = 0;
                }
                else {
                    // Otherwise keep increasing the game frame counter
                    this.frameTimer += deltaTime;
                }
                // Move dragon from right to left
                this.x -= this.speed;
                // Check if dragon off screen
                if (this.x < 0 - this.width) {
                    // Mark it for deletion if so
                    this.markedForDeletion = true;
                }
            }
        }

        // Class for explosions
        class Explosion {
            constructor(x, y) { // Gets coordinates of the dragon
                // Size and placement
                this.imageWidth = 96;
                this.imageHeight = 88;
                this.width = this.imageWidth * 2;
                this.height = this.imageHeight * 2;
                this.x = x;
                this.y = y + 7;
                // Get the sprite image from game.html
                this.image = document.getElementById("explosion");
                // Properites to navigate through the sprite sheet
                this.frame = 0;
                this.maxFrame = 4; // How many horizontal character frames there are on the sprite sheet
                this.fps = 10; // How quickly to switch between character frames on the sprite sheet horizontally
                this.frameInterval = 1000 / this.fps; // How long should a single character frame on the sprite sheet last
                this.frameTimer = 0; // Counter to keep track of game frames (from 0 to frameInterval)
                // Tracker for explosions to be deleted
                this.markedForDeletion = false;
            }
            // Displays the explosion
            draw(context) {
                context.drawImage(this.image, this.imageWidth * this.frame, 0, this.imageWidth, this.imageHeight, this.x, this.y, this.width, this.height);
            }
            // Animates the explosion
            update(deltaTime) {
                // Check if current character frame should finish
                if (this.frameTimer >= this.frameInterval) {
                    // Check if it's the last character frame (horizontally) on the sprite sheet
                    if (this.frame >= this.maxFrame) {
                        this.markedForDeletion = true;                   
                    }
                    else {
                        // Otherwise, keep switching character frames on the sprite sheet
                        this.frame++;
                    }
                    // Reset the game frame counter
                    this.frameTimer = 0;
                }
                else {
                    // Otherwise keep increasing the game frame counter
                    this.frameTimer += deltaTime;
                }
            }
        }

        // Handles explosions
        function triggerExplosions(deltaTime) {
            // Iterate over all active explosions
            explosions.forEach(explosion => {
                explosion.draw(context); // Display explosions
                explosion.update(deltaTime) // Animate explosions
            });
            // Update the explosions array by filtering out explosions marked for deletion
            explosions = explosions.filter(explosion => {
                // Keep only explosions not marked for deletion
                if (explosion.markedForDeletion == false) {
                    return explosion;
                }
                else {
                    return null;
                }
            });
        }

        // Handles dragons
        function handleDragons(deltaTime) {
            // Variable to randomize dragon spawning
            let randomDragonInterval = Math.random() * 100000 + 100;
            // Check if enough time has passed to spawn a new dragon
            if (dragonTimer > (dragonInterval + randomDragonInterval)) {
                // Spawn a new dragon if so and add it to the active dragons array
                dragons.push(new Dragon(canvas.width, canvas.height));
                // Reset the timer
                dragonTimer = 0;
            }
            else {
                // Keep tracking game time otherwise
                dragonTimer += deltaTime;
            }
            // Iterate all active dragons
            dragons.forEach(dragon => {
                dragon.draw(context); // Display dragons
                dragon.update(deltaTime); // Animate dragons
            });
            // Update the dragons array by filtering out dragons marked for deletion
            dragons = dragons.filter(dragon => {
                // Keep only dragons not marked for deletion
                if (dragon.markedForDeletion == false && dragon.killed == false) {
                    return dragon;
                }
                else {
                    return null;
                }
            });
        }

        // Create new objects for all background layers and put them into a new array
        for (let i = 0; i < backgroundLayers.length; i++) {
            layers[i] = new Background(canvas.width, canvas.height, backgroundLayers[i], (i / 10 + gameSpeedMod));
        }
        // Create an instance of the InputHandler class to register user input
        const userInput = new InputHandler();
        // Create an instance of the Player class to display the player character
        const player = new Player(canvas.width, canvas.height);
        // Variable to keep track of game frames duration
        let lastTime = 0;
        // Variable to time dragon spawning
        let dragonTimer = 0;
        // Variable to control dragon spawning frequency
        let dragonInterval = 500;

        // Animation loop
        function animate(timeStamp) {
            // Declare deltaTime to keep track of how many ms 1 game frame takes on the user machine
            const deltaTime = timeStamp - lastTime;
            // Update the lastTime stamp to the current timeStamp
            lastTime = timeStamp;
            // Clear previous animations
            context.clearRect(0, 0, canvas.width, canvas.height);
            // Loop through background layers
            for (let i = 0; i < layers.length; i++) {
                layers[i].draw(context); // Display layer
                layers[i].update(); // Animate layer
            }
            player.draw(context); // Display player
            player.update(userInput, deltaTime, dragons); // Animate player
            handleDragons(deltaTime); // Display and animate dragons
            triggerExplosions(deltaTime); // Display and animate explosions
            // Check if game over
            if (gameOver == false) {
                // Keep playing otherwise
                requestAnimationFrame(animate);
            }
        }
        animate(0); // Call the animation loop, passing a non-significant argument for the first time (no timeStamp yet)
    });
});