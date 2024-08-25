import { Component } from "../core/Component.js";
import { changeUrl } from "../core/router.js";
import { getCookie } from "../core/jwt.js";

export class GameCore extends Component {
	constructor($el, props) {
		super($el, props);
	}

	initState() {
		this.keysPressed = {};
		this.gameSocket = this.gameSocket = new WebSocket(
			'wss://'
			+ "localhost:443"
			+ '/ws/game/'
			+  this.props.uid
			+ '/'
		);
		return {};
	}

	gameStart() {
		const COLOR = ["#f5f6fa", "#2f3640", "#f5f6fa"];
		const BALL_COLOR = ["#FF4C4C", "#FFF078"];
		const canvas = document.getElementById('game-canvas');
		const scoreCanvas = document.getElementById('game-score');
		canvas.setAttribute('tabindex', '0');
		const ctx = canvas.getContext('2d');
		const scoreCtx = scoreCanvas.getContext('2d');
		const sounds = {
			'collision': new Audio('../../img/key.mp3'),
		};
		let SCREEN_HEIGHT, SCREEN_WIDTH, BAR_HEIGHT, BAR_WIDTH, BAR_X_GAP,
		BALL_RADIUS, LEFT_BAR_X, LEFT_BAR_Y, RIGHT_BAR_X, RIGHT_BAR_Y,
		CELL_WIDTH, CELL_HEIGHT;
		let counter = 0;
		let leftBar, rightBar, leftBall, rightBall, map;
		
		console.log(canvas)
		function playSound(soundName) {
			var sound = sounds[soundName];
			if (sound) {
				sound.currentTime = 0;
				sound.play().catch(function (error) {
					console.log('Autoplay was prevented:', error);
				});
			}
		}

		class Bar {
			constructor(x, y, width, height, canvasHeight, id) {
				this.x = x;
				this.y = y;
				this.width = width;
				this.height = height;
				this.targetX = x;
				this.targetY = y;
				this.canvasHeight = canvasHeight;
				this.speed = 4;
				this.id = id;
			}

			draw() {
				ctx.fillStyle = COLOR[this.id + 1];
				Map.strokeRoundedRect(ctx, this.x, this.y, this.width, this.height, this.width / 2);
				ctx.fill();
				ctx.strokeStyle = COLOR[this.id];
				ctx.lineWidth = 2;
				Map.strokeRoundedRect(ctx, this.x, this.y, this.width, this.height, this.width / 2);
				ctx.stroke();
			}

			update() {
				if (Math.abs(this.targetY - this.y) < this.speed) {
					this.y = this.targetY;
				} else {
					if (this.targetY > this.y) {
						this.y += this.speed;
					} else {
						this.y -= this.speed;
					}
				}
				this.x = this.targetX;
			}
		}

		class Ball {
			constructor(x, y, radius, color) {
				this.x = x;
				this.y = y;
				this.targetX = x;
				this.targetY = y;
				this.radius = radius;
				this.color = color;
			}

			draw() {
				Map.strokeRoundedRect(ctx, this.x - this.radius, this.y - this.radius, this.radius * 2, this.radius * 2, 6);
				ctx.fillStyle = this.color;
				ctx.fill();
			}

			update() {
				this.x = this.targetX;
				this.y = this.targetY;
			}
		}

		class Map {
			constructor(map) {
				this.map = map;
				this.height = map.length;
				this.width = map[0].length;
				this.lintDash = [CELL_WIDTH / 5, CELL_WIDTH * 3 / 5];
			}

			update(mapDiff) {
				mapDiff.forEach(diff => {
					console.log(mapDiff)
					this.map[diff[0]][diff[1]] = diff[2];
					new Particles(diff[1], diff[0], diff[2]);
					playSound('collision');
				});
			}

			draw() {
				for (let i = 0; i < this.height; i++) {
					for (let j = 0; j < this.width; j++) {
						ctx.fillStyle = COLOR[this.map[i][j]];
						Map.strokeRoundedRect(
							ctx,
							j * CELL_WIDTH + 2,
							i * CELL_HEIGHT + 2,
							CELL_WIDTH - 4,
							CELL_HEIGHT - 4,
							5
						);
					}
				}
			}

			static strokeRoundedRect(ctx, x, y, width, height, radius) {
				ctx.beginPath();
				ctx.moveTo(x + radius, y);
				ctx.arcTo(x + width, y, x + width, y + height, radius);
				ctx.arcTo(x + width, y + height, x, y + height, radius);
				ctx.arcTo(x, y + height, x, y, radius);
				ctx.arcTo(x, y, x + width, y, radius);
				ctx.fill();
				ctx.closePath();
			}
		}

		class Particle {
			constructor(x, y, r, vx, vy, color) {
				this.x = x;
				this.y = y;
				this.r = r;
				this.vx = vx;
				this.vy = vy;
				this.color = color;
				this.opacity = 0.5;
				this.g = 0.05;
				this.friction = 0.99;
			}

			draw() {
				ctx.fillStyle = this.color + `${this.opacity})`;
				ctx.fillRect(this.x, this.y, this.r, this.r);
			}

			update() {
				this.vx *= this.friction;
				this.vy *= this.friction;
				this.vy += this.g;
				this.x += this.vx;
				this.y += this.vy;
				this.opacity -= 0.004;
				this.draw();
			}
		}

		class Particles {
			static array = [];

			constructor(x, y, blockId) {
				this.x = x * CELL_WIDTH + CELL_WIDTH / 2;
				this.y = y * CELL_HEIGHT + CELL_HEIGHT / 2;
				this.blockId = blockId;
				this.color = Particles.hexToRgba(COLOR[blockId + 1]);
				this.particles = [];
				const particleCount = 50;
				const power = 20;
				const radians = (Math.PI * 2) / particleCount;
				this.state = 1;

				for (let i = 0; i < particleCount; i++) {
					this.particles.push(
						new Particle(
							this.x,
							this.y,
							5,
							Math.cos(radians * i) * (Math.random() * power),
							Math.sin(radians * i) * (Math.random() * power),
							this.color
						)
					);
				}
				Particles.array.push(this);
			}

			draw() {
				for (let i = this.particles.length - 1; i >= 0; i--) {
					if (this.particles[i].opacity >= 0) {
						this.particles[i].update();
					} else {
						this.particles.splice(i, 1);
					}
				}
				if (this.particles.length <= 0) {
					this.state = -1;
				}
			}

			static hexToRgba(hex) {
				let cleanedHex = hex.replace('#', '');
				if (cleanedHex.length === 3)
					cleanedHex = cleanedHex.split('').map(hex => hex + hex).join('');
				const bigint = parseInt(cleanedHex, 16);
				const r = (bigint >> 16) & 255;
				const g = (bigint >> 8) & 255;
				const b = bigint & 255;

				return `rgba(${r}, ${g}, ${b},`;
			}

			static drawAll() {
				for (let i = Particles.array.length - 1; i >= 0; i--) {
					if (Particles.array[i].state == 1)
						Particles.array[i].draw();
					else
						Particles.array.splice(i, 1);
				}
			}
		}

		this.gameSocket.onopen = () => {
			const token = getCookie("jwt");
			this.gameSocket.send(JSON.stringify({ 'action': 'authenticate', 'token': token }));
		};

		this.gameSocket.onmessage = (e) => {
			const data = JSON.parse(e.data);
			if (data.type === 'initialize_game') {
				initializeGame(data);
				drawGame();
			} else if (data.type === 'update_game_state') {
				leftBar.targetX = data.left_bar_x;
				leftBar.targetY = data.left_bar_y;
				rightBar.targetX = data.right_bar_x;
				rightBar.targetY = data.right_bar_y;
				leftBall.targetX = data.left_ball_x;
				leftBall.targetY = data.left_ball_y;
				rightBall.targetX = data.right_ball_x;
				rightBall.targetY = data.right_ball_y;
				map.update(data.map_diff);
			}
		};

		let isPoolingLeft = false, isPoolingRight = false;
		const handleKeyPresses = () => {
			if (this.keysPressed['w']) {
				this.gameSocket.send(JSON.stringify({ 'action': 'move_up', 'bar': 'left' }));
				leftBar.targetY -= 5;
			}
			if (this.keysPressed['s']) {
				this.gameSocket.send(JSON.stringify({ 'action': 'move_down', 'bar': 'left' }));
				leftBar.targetY += 5;
			}
			if (this.keysPressed['a']) {
				this.gameSocket.send(JSON.stringify({ 'action': 'pull', 'bar': 'left' }));
				isPoolingLeft = true;
			} else if (isPoolingLeft) {
				this.gameSocket.send(JSON.stringify({ 'action': 'release', 'bar': 'left' }));
				isPoolingLeft = false;
			}

			if (this.keysPressed['ArrowUp']) {
				this.gameSocket.send(JSON.stringify({ 'action': 'move_up', 'bar': 'right' }));
				rightBar.targetY -= 5;
			}
			if (this.keysPressed['ArrowDown']) {
				this.gameSocket.send(JSON.stringify({ 'action': 'move_down', 'bar': 'right' }));
				rightBar.targetY += 5;
			}
			if (this.keysPressed['ArrowRight']) {
				this.gameSocket.send(JSON.stringify({ 'action': 'pull', 'bar': 'right' }));
				isPoolingRight = true;
			} else if (isPoolingRight) {
				this.gameSocket.send(JSON.stringify({ 'action': 'release', 'bar': 'right' }));
				isPoolingRight = false;
			}
		}

		function drawGame() {
			// ctx.clearRect(0, 0, canvas.width, canvas.height);
			ctx.fillStyle = "#92969D";
			ctx.fillRect(0, 0, canvas.width, canvas.height);
			map.draw();
			leftBar.draw();
			rightBar.draw();
			leftBall.draw();
			rightBall.draw();
			Particles.drawAll();
		}

		function initializeGame(data) {
			SCREEN_HEIGHT = data.screen_height;
			SCREEN_WIDTH = data.screen_width;
			LEFT_BAR_X = data.left_bar_x;
			LEFT_BAR_Y = data.left_bar_y;
			RIGHT_BAR_X = data.right_bar_x;
			RIGHT_BAR_Y = data.right_bar_y;
			BAR_HEIGHT = data.bar_height;
			BAR_WIDTH = data.bar_width;
			BAR_X_GAP = data.bar_x_gap;
			BALL_RADIUS = data.ball_radius;
			canvas.width = SCREEN_WIDTH;
			canvas.height = SCREEN_HEIGHT;
			scoreCanvas.width = 500;
			scoreCanvas.height = 150;
			var text = "2 : 3"
			// var blur = 10;
			// var width = scoreCtx.measureText(text).width + blur * 2;
			// scoreCtx.textBaseline = "top"
			// scoreCtx.shadowColor = "#000"
			// scoreCtx.shadowOffsetX = width;
			// scoreCtx.shadowOffsetY = 0;
			// scoreCtx.shadowBlur = blur;
			scoreCtx.fillText(text, -10, 0);
			CELL_WIDTH = canvas.width / data.map[0].length;
			CELL_HEIGHT = canvas.height / data.map.length;

			map = new Map(data.map, COLOR[0], COLOR[1]);
			leftBar = new Bar(LEFT_BAR_X, LEFT_BAR_Y, BAR_WIDTH, BAR_HEIGHT, SCREEN_HEIGHT, 0);
			rightBar = new Bar(RIGHT_BAR_X, RIGHT_BAR_Y, BAR_WIDTH, BAR_HEIGHT, SCREEN_HEIGHT, 1);
			leftBall = new Ball(data.left_ball_x, data.left_ball_y, BALL_RADIUS, BALL_COLOR[0]);
			rightBall = new Ball(data.right_ball_x, data.right_ball_y, BALL_RADIUS, BALL_COLOR[1]);

			console.log(SCREEN_HEIGHT, SCREEN_WIDTH, BAR_HEIGHT, BAR_WIDTH, BALL_RADIUS);
			setInterval(interpolate, 3);
		}

		function interpolate() {
			leftBar.update();
			rightBar.update();
			leftBall.update();
			rightBall.update();
			drawGame();

			if (counter % 6 === 0)
				handleKeyPresses();
			counter++;
		}
	}

	template() {
		return `
		<style>

		</style>
		<canvas id="game-score"></canvas>
		<canvas id="game-canvas"></canvas>
	`;
	}

	setEvent() {
		const handleKeyDown = (e) => {
			this.keysPressed[e.key] = true;
		}
		const handleKeyUp = (e) => {
			this.keysPressed[e.key] = false;
		}

		const handleSocketClose = (e) => {
			this.gameSocket.close();
			window.removeEventListener('popstate', handleSocketClose);
			document.removeEventListener('keydown', handleKeyDown);
			document.removeEventListener('keyup', handleKeyUp);
		}

		window.addEventListener('popstate', handleSocketClose);
		document.addEventListener('keydown', handleKeyDown);
		document.addEventListener('keyup', handleKeyUp);
	}

	mounted() {
		this.gameStart();
	}
}