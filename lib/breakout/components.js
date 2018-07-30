// general helper
(function(obj){

	function Vector(x, y){
		this.x = x;
		this.y = y;

		this.add = (other)=>{
			this.x += other.x;
			this.y += other.y;
		}

		this.clone = () =>{
			return new Vector(this.x, this.y)
		}
	}

	function randColor(){
		return "#" + Math.floor(Math.random()*999);
	}

	function show(ele){
		if(ele.className.match(" hidden") != null){
			ele.className = ele.className.replace(" hidden", "");
		}
	}

	function hide(ele){
		if(ele.className.match(" hidden") == null){
			ele.className += " hidden";
		}
	}

	var $$ = (s)=>document.querySelector(s);

	function highlight(el, container){
		var old = container.querySelector('.selected');
		if( old != el){
			if(old)
				old.className = old.className.replace("selected", "");
			el.className += " selected";
		}
	}

Object.assign(obj, {Vector, show, hide, highlight, $$})
})(window);

/******************************************************
=======================================================
Ball
=======================================================
******************************************************/

(function(obj){
	Object.assign(obj, {Ball})

	function Ball(pos, speed, {color="#00f", radius=10}={}){
		this.pos = pos;
		this.speed = speed;
		this.radius = radius;
		this.color = color;
	}

	Ball.prototype.draw = function (canvas) {
		var ctx = canvas.getContext('2d');
		ctx.beginPath();
		ctx.fillStyle = this.color;
		ctx.arc(this.pos.x, this.pos.y, this.radius, 0, 2*Math.PI);
		ctx.fill();
	}

	Ball.prototype.move = function () {
		this.pos.add(this.speed);
	}

	Ball.prototype.detectCollision = function (width, height) { // with top, left & right walls
		var collisions = [];
		if(this.pos.x - this.radius <= 0 || this.pos.x + this.radius >= width)collisions.push([-1, 1]);
		if(this.pos.y - this.radius <= 0)collisions.push([1, -1]);

		return collisions;
	}

	Ball.prototype.rebound = function ([mx, my]) {
		this.speed.x *= mx;
		this.speed.y *= my;
	}

})(window);

/******************************************************
=======================================================
Paddle
=======================================================
******************************************************/

(function(obj){
	Object.assign(obj,{Paddle})

function Paddle(pos, {color="#f00", width=50, height=10, total_width, total_height}={}){
	this.init = pos.clone();
	this.pos = pos;
	this.dir = 0;

	this.total_width = total_width;
	this.total_height = total_height;
	this.width = width;
	this.height = height;
	this.color= color;
}

Paddle.prototype.draw = function (canvas) {
	var ctx = canvas.getContext('2d');
	ctx.fillStyle = this.color;
	ctx.fillRect(this.pos.x, this.pos.y, this.width, this.height);
}

Paddle.prototype.move = function () {
	this.pos.add(new Vector(this.dir*10, 0));
	if(this.pos.x < 0)this.pos.x = 0;
	else if(this.pos.x + this.width > this.total_width) this.pos.x = this.total_width - this.width;
}

Paddle.prototype.detectCollision = function(ball){
	if(ball.pos.x + ball.radius >= this.pos.x && ball.pos.y + ball.radius >= this.pos.y && ball.pos.x - ball.radius <= this.pos.x + this.width && ball.pos.y <= this.pos.y + this.height){
		return this
	}
	return null
}

Paddle.prototype.setDirection = function (d) {this.dir = d;}

Paddle.prototype.rebound = function (ball) {
	var diff = this.pos.x + this.width/2 - ball.pos.x;
	ball.rebound([-1, 1]);
	ball.speed.y = Math.max(-1 - Math.abs(ball.speed.y), -8);
	ball.speed.x = ball.speed.y*2*diff/this.width;
}

Paddle.prototype.reset = function() {
	this.pos = this.init.clone();
};


})(window);

/******************************************************
=======================================================
Components
=======================================================
******************************************************/

function Brick(pos, active, {color="#0f0", width=50, height=10}={}){
	this.pos = pos;
	this.active = active;

	this.draw = (canvas)=>{
		var ctx = canvas.getContext('2d');
		if(this.active){
			ctx.fillStyle = color;
			ctx.fillRect(this.pos.x, this.pos.y, width, height);
			// ctx.strokeStyle="#fff";
			// ctx.strokeRect(this.pos.x, this.pos.y, width, height);
		}
	}

	this.detectCollision = (ball)=>{
		if(!this.active)return null

		if((ball.pos.x > this.pos.x && ball.pos.x < this.pos.x + width)
		&& (ball.pos.y > this.pos.y && ball.pos.y < this.pos.y + height)){
			return this
		}

		return null
	}

	this.deactivate = ()=>{
		this.active = false;
	}

	this.activate = ()=>{
		this.active = true;
	}
}

function BrickCollection(layers, {width, brick_width, height, brick_height, padding, colors}){
	var max_blocks = Math.floor(width/brick_width);

	this.contents =  (new Array(layers*max_blocks)).fill(0).map((_, i)=> {
		var color = colors[Math.floor(i/max_blocks)];
		var x = Math.floor((i% max_blocks)*brick_width);
		var y = Math.floor(i/max_blocks)*brick_height + padding;

		return new Brick(
			new Vector(x, y),
			true, {width: brick_width, height: brick_height, color})
	});

	this.draw = (canvas)=> { this.contents.forEach(e=>e.draw(canvas)); };

	this.detectCollision = (ball)=>{
		if( ball.pos.y - ball.radius > layers*height + padding) return null;

		for (var brick of this.contents){
			if(brick.detectCollision(ball))
				return brick;
		}

		return null;
	}

	this.allHit = ()=>{
		for (var brick of this.contents){
			if(brick.active)return false;
		}
		return true;
	}

	this.activateAll = ()=>{
		this.contents.forEach(brick => brick.activate())
	}
}


/******************************************************
=======================================================
Breakout Game
=======================================================
******************************************************/

function Breakout(canvas,{width=500, height=400, brick_height=20, brick_width=50, paddle_width=70, paddle_height=10, ball_radius=5}={}){
	var score = 0;

	var screen = document.createElement('canvas');
	var background = document.createElement('canvas');

	var x = [background, screen]

	x.forEach(e =>{
		e.width = width;
		e.style.width = width + "px";
		e.height = height;
		e.style.height = height + "px";
		playground.appendChild(e)
	})

	var components = {
		paddle: new Paddle(new Vector(Math.floor(width/2), background.height - paddle_height), {
			width:paddle_width,
			height:paddle_height,
			total_width: width
		}),
		bricks: new BrickCollection(6, {width, brick_width, height, brick_height, padding: 40, colors: ["#c84848", "#c66c3a", "#b47a30", "#a2a22a", "#48a048","#4248c8"]}),
		ball: new Ball(new Vector(Math.floor(width/2), Math.floor(height/2)), new Vector(0, 5), {radius:ball_radius})
	}

	this.draw = ()=>{
		var ctx = background.getContext('2d');
		//background
		ctx.fillStyle = "#000";
		ctx.fillRect(0, 0, background.width, background.height);

		screen.getContext('2d').clearRect(0, 0, screen.width, screen.height)
		for( var c in components){
			components[c].draw(screen);
		}
		ctx.font = '18px arial';
		ctx.fillStyle = "#fff";
		ctx.textAlign = "right";
		ctx.textBaseline = "top"
		ctx.fillText('Score: '+ score, background.width - 10, 10);
	}


	this.play = ()=>{
		this.step();
		if(!this.done())
			requestAnimationFrame(this.play);
	}

	this.step = (dir)=>{
		components.ball.move();

		this.action(dir);
		this.movePaddle();

		var reward = this.collisionDetector();
		score += reward;
		this.draw();
		return reward;
	}

	this.collisionDetector = function(){
		var ball = components.ball;
		var brickHit = components.bricks.detectCollision(ball); // collision with bricks
		var reward = 0;
		if(brickHit){
			brickHit.deactivate();
			reward = 1;
			ball.rebound([1, -1]);
		}
		var paddleHit = components.paddle.detectCollision(ball); // collision with paddle
		if(paddleHit){
			// ball.rebound([1, -1]);
			paddleHit.rebound(ball)
		}
		var wallHit = components.ball.detectCollision(width, height); // collision with walls
		wallHit.forEach(w=> ball.rebound(w));

		if(this.done()) reward = -1;

		return reward;
	}

	this.done = function(){
		return components.bricks.allHit() || components.ball.pos.y > height;
	}

	this.movePaddle = ()=> components.paddle.move();

	this.action = (dir)=>{
		components.paddle.setDirection(dir);
	}

	this.reset = function(){
		components.ball.pos = new Vector(Math.floor(width/2), Math.floor(height/2));
		components.ball.speed = new Vector(0, 5);
		components.bricks.activateAll();
		score = 0;
	}


	this.render = this.draw;
	this.config = ()=>{
		return {state: this.state()}
	}

	this.state = function(){
		var n = 80;
		var hidden = document.createElement('canvas');
		hidden.width = n;
		hidden.height = n;
		hidden.getContext('2d').drawImage(screen, 0, 0, hidden.width, hidden.height);
		var imgData = hidden.getContext('2d').getImageData(0, 0, hidden.width, hidden.height);
		var d = [];
		for(var i = 0; i< n*n; i++){
			d.push(imgData.data[i*4 + 3] == 255 ? 1 : 0);
		}
		return d
	}
}

/******************************************************
=======================================================
Board
=======================================================
******************************************************/

function Board(container, {env}={}){
	this.container = container
	this.render	= ()=>{
		env.render();
	};
}



/******************************************************
=======================================================
__init__
=======================================================
******************************************************/

var __init__ = (function(obj){

	var env = new Breakout(document.querySelector("#playground"));
	var board = new Board(document.querySelector(".board"), {env});

	board.render();

	function play(x){
		if(x["reset"])env.reset();
		var a = x["action"] == 3? -1 : x["action"] == 2? 1: 0
		var r = env.step(a);
		board.render()
		var res = {"state": env.state(), "reward": r, "done": env.done()};
		setResult(res)
	}


	Object.assign(obj, {play, env, board})
})
