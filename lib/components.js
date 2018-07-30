// general helper
(function(obj){

function Vector(x, y){
	this.x = x;
	this.y = y;

	this.add = (other)=>{
		this.x += other.x;
		this.y += other.y;
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

	function Paddle(pos, {color="#f00", width=50, height=10, total_width, total_height, speed=10}={}){
		this.pos = pos;
		this.dir = 0;
		this.speed = speed;
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
		this.pos.add(new Vector(this.dir*this.speed, 0));
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
		ball.speed.y += Math.sign(ball.speed.y);
		ball.speed.x = ball.speed.y*diff/this.width;

	}

})(window);
