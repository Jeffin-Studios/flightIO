var game;
var land;

var myPlayer;
var players = {};
var mybullets;
var bullets;

var explosions;

var cover;

var cursors;

var obstacles = {};
var obstaclesTotal = 0;
var obstaclesAlive = 0;

// var Bullet = function(x, y, target, )
// var Obstacle = function(type, )

// var Bullet = function(x, y, target, )
// var Obstacle = function(type, )

var Obstacle = function(index, game, type, x, y) {
  this.id = index;
  this.game = game;
  this.type = type;
  this.x = x;
  this.y = y

  this.object;
  this.skin;

  if (type == 'tree') {
    this.object = game.add.sprite(x, y, 'obstacle', 'hitbox');
    this.skin = game.add.sprite(x, y, 'tree');

    this.object.name = index.toString();

    this.object.anchor.set(0.5);
    this.skin.anchor.set(0.5, 0.8);
  }
  else if (type == 'boulder') {
    this.object = game.add.sprite(x, y, 'obstacle', 'hitbox1');
    this.skin = game.add.sprite(x, y, 'boulder');

    this.object.name = index.toString();

    this.object.anchor.set(0.5);
    this.skin.anchor.set(0.5);
  }

  game.physics.enable(this.object, Phaser.Physics.ARCADE);
  this.skin.bringToTop();
  this.object.body.immovable = true;
};


var Player = function(id, game, x, y) {
  this.id = id;
  //  The base of our plane
  this.plane = game.add.sprite(x, y, 'plane1');
  this.plane.anchor.setTo(0.5, 0.5);
  // this.plane.animations.add('move', ['plane1', 'plane2', 'plane3', 'plane4', 'plane5', 'plane6'], 20, true);

  //  This will force it to decelerate and limit its speed
  game.physics.enable(this.plane, Phaser.Physics.ARCADE);
  this.plane.body.drag.set(0.2);
  this.plane.body.maxVelocity.setTo(400, 400);
  this.plane.body.collideWorldBounds = true;
  this.plane.body.immovable = false;
  this.plane.body.allowGravity = true;

  this.plane.bringToTop();

  this.velocity = 0;
  this.targetVelocity = 0;
  this.acceleration = 10;
  this.health = 100;
  this.maxHealth = 100;
  this.fireRate = 100;
  this.nextFire = 0;
  this.lifetime = 0;
  this.alive = true;
  this.score = 0;

  this.bullets = mybullets;
  this.plane.rotation = game.physics.arcade.moveToPointer(this.plane, this.velocity, game.input.activePointer);
};

Player.prototype.update = function(local = true) {
  //  Position all the parts and align rotations
  if (local)  {
    this.plane.rotation = game.physics.arcade.angleToPointer(this.plane);
    if (this.plane.y < -1000) {

      this.plane.body.maxVelocity.setTo(100, 100);
      // this.plane.angle +=4;
      //Circle is bigger here
    }
    else {
      this.plane.body.maxVelocity.setTo(400, 400);
      this.targetVelocity = 0.5*game.physics.arcade.distanceToPointer(this.plane);
    }

    if (this.velocity < this.targetVelocity)  {
      this.velocity += this.acceleration;
    }
    else {
      this.velocity -= this.acceleration;
    }
  }
  else {
    game.physics.arcade.velocityFromRotation(myPlayer.plane.rotation, myPlayer.velocity, myPlayer.plane.body.velocity);
  }

  if (this.lifetime < 1000) {
    this.lifetime += 1;
  }
};

Player.prototype.damage = function(impact = 1) {
  if (this.lifetime > 200) {
    this.health -= impact;
    if (this.health <= 0) {
      this.alive = false;
      this.plane.kill();
      return true;
    }
  }
  return false;
};

Player.prototype.fire = function() {
  if (this.alive && game.time.now > this.nextFire && this.bullets.countDead() > 0) {
    this.nextFire = game.time.now + this.fireRate;
    var bullet = this.bullets.getFirstExists(false);
    bullet.reset(myPlayer.plane.x, myPlayer.plane.y);
    bullet.rotation = game.physics.arcade.moveToPointer(bullet, 500, game.input.activePointer);
    bullet.expire = setTimeout(function() {
        bullet.kill();
    },800);
  }
};


/*============================End of Declaration==============================*/
/*============================================================================*/
/*============================================================================*/
/*============================================================================*/


function init() {
  game = new Phaser.Game(window.innerWidth - 300, window.innerHeight, Phaser.AUTO, 'game', {
    preload: preload,
    create: create,
    update: update,
    render: render
  });
}

init();

function preload() {
  game.load.image('cover', 'assets/sprites/logo.png');
  game.load.image('bullet', 'assets/sprites/bullet.png');
  game.load.image('sky', 'assets/sprites/sky.jpeg');
  game.load.image('plane1', 'assets/sprites/plane1.png');
  game.load.spritesheet('kaboom', 'assets/sprites/explosion.png', 64, 64, 23);

}

function create() {
  //  Resize our game world to be a 4000 x 4000 square
  game.world.setBounds(-2000, -2000, 4000, 4000);
  game.physics.arcade.gravity.y = 400;
  //  Our tiled scrolling background
  land = game.add.tileSprite(0, 0, 4000, 4000, 'sky');
  land.fixedToCamera = true;

  //  Our bullet group. With multiplayer, this will come from server
  mybullets = game.add.group();
  mybullets.enableBody = true;
  mybullets.physicsBodyType = Phaser.Physics.ARCADE;
  mybullets.createMultiple(30, 'bullet', 0, false);
  mybullets.setAll('anchor.x', 0.5);
  mybullets.setAll('anchor.y', 0.5);
  mybullets.setAll('outOfBoundsKill', true);
  mybullets.setAll('checkWorldBounds', true);
  mybullets.setAll('expire', null);

  Client.makeObstacles();

  //  Explosion pool
  explosions = game.add.group();

  for (var i = 0; i < 10; i++) {
    var explosionAnimation = explosions.create(0, 0, 'kaboom', [0], false);
    explosionAnimation.anchor.setTo(0.5, 0.5);
    explosionAnimation.animations.add('kaboom');
  }

  cover = game.add.sprite(150, 250, 'cover');
  cover.fixedToCamera = true;

  // bind down input with function to remove cover
  game.input.onDown.add(removeCover, this);
  game.camera.focusOnXY(0, 0);

  // cursors = game.input.keyboard.createCursorKeys();

  setInterval(function() {
    if (myPlayer && myPlayer.alive && myPlayer.health < myPlayer.maxHealth) {
      myPlayer.health+=1;
    }
  },1000);
}


function update() {
  // detect if bullet hits player

  if (myPlayer) {
    game.physics.arcade.overlap(bullets, myPlayer.plane, bulletHitPlayer, null, this);



    if (myPlayer.velocity != 0) {
      game.physics.arcade.velocityFromRotation(myPlayer.plane.rotation, myPlayer.velocity, myPlayer.plane.body.velocity);
    }

    if (game.input.activePointer.isDown) {
      myPlayer.fire();
    }

    if (myPlayer) {
      myPlayer.update();
      // why not send the entire player object instead of justa few fields
      Client.sendMovement(Math.round(myPlayer.plane.x), Math.round(myPlayer.plane.y), myPlayer.velocity, myPlayer.plane.rotation);
    }
  }

  for (var i = 0; i < players.length; i++) {
    if (myPlayer) {
      game.physics.arcade.collide(myPlayer.plane, players[i].plane, didCollide, null, this);
    }
  }

  obstaclesAlive = 0;
  for (var id in obstacles) {
    if (obstacles[id]) {
      obstaclesAlive++;
      if (myPlayer) {
        game.physics.arcade.collide(myPlayer.plane, obstacles[id].object);
      }
      game.physics.arcade.overlap(mybullets, obstacles[id].object, bulletHitObstacle, null, this);
    }
  }

  land.tilePosition.x = -game.camera.x;
  land.tilePosition.y = -game.camera.y;
}


function render() {
  if (myPlayer) {
    game.debug.text("Player Health: " + myPlayer.health + " / " + myPlayer.maxHealth, 32, 64);
    game.debug.text("Player Score: " + myPlayer.score, 32, 96);
  }
}

function removeCover() {
  // unbind function and remove cover
  cover.kill();
  game.input.onDown.remove(removeCover, this);
  Client.makeNewPlayer();
  Client.makeObstacles();
}


function bulletHitPlayer(plane, bullet) {
  bullet.kill();
  var destroyed = myPlayer.damage(5);
  if (destroyed) {
    var explosionAnimation = explosions.getFirstExists(false);
    explosionAnimation.reset(plane.x, plane.y);
    explosionAnimation.play('kaboom', 30, false, true);
    Client.death();
  }
}


function bulletHitObstacle(obstacle, bullet)  {
  bullet.kill();
  clearTimeout(bullet.expire);
  Client.damage('obstacle', obstacle.name, 5);
}

function didCollide (player, enemy) {
    enemies[enemy.name].target = myPlayer.plane;
    enemies[enemy.name].follow = false;
    enemies[enemy.name].rebound = true;
    myPlayer.slow = true;
}


/*========================Client-Server Communication=========================*/
/*============================================================================*/
/*============================================================================*/


var addThisPlayer = function(id,x,y){
  myPlayer = addPlayer(id,x,y);
  game.camera.follow(myPlayer.plane);
  // game.camera.deadzone = new Phaser.Rectangle(150, 150, 500, 300);
  game.camera.focusOnXY(0, 0);
};

var addExistingPlayer = function(id,x,y){
 if (myPlayer.id == id)
     return;
 addPlayer(id,x,y);
};

var addPlayer = function(id,x,y){
 players[id] = new Player(id, game, x, y);
 return players[id];
};

var movePlayer = function(id,x,y,v,r){
    var player = players[id];
    if (id == myPlayer.id || !player)  {
      return;
    }
    if (player.alive) {
      player.plane.rotation = r;
      player.plane.x = x;
      player.plane.y = y;
      player.velocity = v;
      player.update(false);
    }
};

var removePlayer = function(id){
    if (players[id]) {
        players[id].plane.destroy();
        delete players[id];
    }
};

var addObstacle = function(id, type, x, y) {
  if (obstacles[id])  {
    obstacles[id].object.destroy();
    obstacles[id].skin.destroy();
    delete obstacles[id];
  }
  obstacles[id] = new Obstacle(id, game, type, x, y);
};

var removeObstacle = function(id)  {
  var explosionAnimation = explosions.getFirstExists(false);
  explosionAnimation.reset(obstacles[id].x, obstacles[id].y);
  explosionAnimation.play('kaboom', 30, false, true);
  obstacles[id].object.destroy();
  obstacles[id].skin.destroy();
  delete obstacles[id];
};
