class Vector2 {
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }
  set(x, y) {
    this.x = x;
    this.y = y;
    return this;
  }
  clone() {
    return new Vector2(this.x, this.y);
  }
  add(v) {
    this.x += v.x;
    this.y += v.y;
    return this;
  }
  sub(v) {
    this.x -= v.x;
    this.y -= v.y;
    return this;
  }
  times(num) {
    this.x *= num;
    this.y *= num;
    return this;
  }
  get pack() {
    return [this.x, this.y];
  }
  get inverse() {
    return this.clone().times(-1);
  }
  get magnitude() {
    const { x, y } = this;
    return Math.sqrt(x ** 2 + y ** 2);
  }
  get normalized() {
    const { x, y, magnitude } = this;
    return new Vector2(x / magnitude, y / magnitude);
  }
  static add(v1, v2) {
    return v1.clone().add(v2);
  }
  static sub(v1, v2) {
    return v1.clone().sub(v2);
  }
  static times(v1, num) {
    return v1.clone().times(num);
  }
  static dot(v1, v2) {
    return (v1.x * v2.x + v1.y * v2.y);
  }
  static cross(v1, v2) {
    return (v1.x * v2.y - v1.y * v2.x);
  }
  static distance(v1, v2) {
    return Vector2.sub(v1, v2).magnitude;
  }
  static isParallel(v1, v2) {
    return (Vector2.cross(v1, v2) === 0);
  }
  static isVertical(v1, v2) {
    return (Vector2.dot(v1, v2) === 0);
  }
  static get zero() {
    return new Vector2(0, 0);
  }
  static get one() {
    return new Vector2(1, 1);
  }
  static get right() {
    return new Vector2(1, 0);
  }
  static get left() {
    return new Vector2(-1, 0);
  }
  static get up() {
    return new Vector2(0, 1);
  }
  static get down() {
    return new Vector2(0, -1);
  }
}

class Player {
  constructor(args) {
    this.pos = args.pos;
    this.motion = args.motion;
    this.attribute = args.attribute;
  }
}


// setting canvas
const canvas = document.getElementById("game-canvas");
const ctx = canvas.getContext("2d");

// setting player marble
const player_attribute = {
  radius: 20
}
const player = new Player({
  pos: new Vector2(80, 80),
  motion: Vector2.zero,
  attribute: player_attribute
})

// setting terrain
var current_stage = "dev";
const stage_data = {
  "dev": [
    { "rect": [0, 0, 800, 50] },
    { "rect": [0, 0, 50, 600] },
    { "rect": [0, 550, 800, 50] },
    { "rect": [750, 0, 50, 600] },

    { "rect": [200, 200, 100, 50] },
    { "rect": [500, 200, 100, 50] },
  ]
}

// get mouse position
var flick = {
  start_point: Vector2.zero,
  end_point: Vector2.zero,
  motion: Vector2.zero,
  charging: false
}
var mouse_event = {
  down: false,
  up: false,
  pos: Vector2.zero,
}
document.addEventListener('mousedown', function (e) { mouse_event.down = true; });
document.addEventListener('mouseup', function (e) { mouse_event.up = true; });
document.addEventListener('mousemove', function (e) { mouse_event.pos = new Vector2(e.clientX - canvas.getBoundingClientRect().left, canvas.height - e.clientY + canvas.getBoundingClientRect().top).inverse; });

// get key event
var key_event = {};
document.addEventListener("keyup", function (e) { key_event[e.key] = { up: !0 };/*console.log(key_event)*/ });
document.addEventListener("keydown", function (e) { key_event[e.key] = { down: !0 };/*console.log(key_event)*/ });
// run per tick
function tick() {
  logic();
  render();
}

// set const
const FLICK_POWER = 0.1;
const RESISTANCE = 0.95;
const POWER_LIM_MIN = 10;
const POWER_LIM_MAX = 200;

function logic() {
  // calculate flick power and direction
  if (mouse_event.down) { flick.start_point = mouse_event.pos; flick.charging = true; }
  if (mouse_event.up && flick.charging) {
    // calc
    flick.end_point = mouse_event.pos;
    flick.motion = Vector2.sub(flick.end_point, flick.start_point);
    flick.charging = false;
    // cancel
    if (flick.motion.magnitude < POWER_LIM_MIN) {
      //console.log("error : too small power");
    }
    // clamp power
    else if (POWER_LIM_MAX < flick.motion.magnitude) {
      //console.log("info : too max power / power was clamped");
      player.motion = Vector2.times(Vector2.times(flick.motion.normalized, POWER_LIM_MAX), FLICK_POWER);
    }
    // correct
    else {
      player.motion = Vector2.times(flick.motion, FLICK_POWER);
    }
  }
  // cancel flick by C key
  if (key_event.c && flick.charging) {
    if (key_event.c.down) {
      flick.charging = false;
    }
  }

  // reset mouse and key event
  if (mouse_event.down) { mouse_event.down = false; }
  if (mouse_event.up) { mouse_event.up = false; }
  key_event = {};

  // move player marble
  move();

}

function move() {
  if (is_colliding(player.pos.x + player.motion.x, player.pos.y)) {
    let length = Math.floor(Math.abs(player.motion.x)) + 1;
    for (let i = 0; i <= length; i++) {
      if (0 < player.motion.x) {
        if (is_colliding(player.pos.x + i, player.pos.y)) {
          player.pos.x += i;
          player.pos.x--;
          break;
        }
      } else {
        if (is_colliding(player.pos.x - i, player.pos.y)) {
          player.pos.x -= i;
          player.pos.x++;
          break;
        }
      }
    }
    player.motion.x = 0 - player.motion.x;
  } else {
    player.pos.x += player.motion.x;
  }
  if (is_colliding(player.pos.x, player.pos.y + player.motion.y)) {
    let length = Math.floor(Math.abs(player.motion.y)) + 1;
    for (let i = 0; i <= length; i++) {
      if (0 < player.motion.y) {
        if (is_colliding(player.pos.x, player.pos.y + i)) {
          player.pos.y += i;
          player.pos.y--;
          break;
        }
      } else {
        if (is_colliding(player.pos.x, player.pos.y - i)) {
          player.pos.y -= i;
          player.pos.y++;
          break;
        }
      }
    }
    player.motion.y = 0 - player.motion.y;
  } else {
    player.pos.y += player.motion.y;
  }
  player.motion.times(RESISTANCE);
}

function clamp(num, low_lim, high_lim) {
  let result = num;
  if (num < low_lim) {
    result = low_lim;
  } else if (high_lim < num) {
    result = high_lim;
  }
  return result;
}

function intersect_rect_circle(circle_x, circle_y, radius, rect_x, rect_y, rect_size_x, rect_size_y) {
  if (rect_x <= circle_x && circle_x <= (rect_x + rect_size_x) && rect_y <= circle_y && circle_y <= (rect_y + rect_size_y)) {
    return true;
  }
  let clamp_x = clamp(circle_x, rect_x, rect_x + rect_size_x);
  let clamp_y = clamp(circle_y, rect_y, rect_y + rect_size_y);
  if (((clamp_x - circle_x) ** 2 + (clamp_y - circle_y) ** 2) < radius ** 2) {
    return true;
  }
  return false;
}

function is_colliding(x, y) {
  let result = false;
  for (const wall_data of stage_data[current_stage]) {
    if (intersect_rect_circle(x, y, player.attribute.radius, ...wall_data.rect)) {
      result = true;
      break;
    }
  }
  return result;
}

function render() {
  // init
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // background
  ctx.fillStyle = "#fefefe";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // stage
  for (let wall_data of stage_data[current_stage]) {
    ctx.fillStyle = "#ddd";
    ctx.fillRect(...wall_data.rect);
  }

  // player
  ctx.fillStyle = "#4287f5";
  ctx.moveTo(...player.pos.pack);
  ctx.beginPath();
  ctx.arc(...player.pos.pack, player.attribute.radius, 0, 2 * Math.PI);
  ctx.fill();
}

function create_round_rect_line_path(ctx, x, y, w, h, r) {
  let theta = Math.atan(h / w);
  ctx.beginPath();
  ctx.arc(x, y, r, theta + Math.PI * 0.5, theta + Math.PI * 1.5, false);
  ctx.lineTo(x + w + r * Math.sin(theta), y + h - r * Math.cos(theta));
  ctx.arc(x + w, y + h, r, theta - Math.PI * 0.5, theta + Math.PI * 0.5, false);
  ctx.closePath();
}

setInterval(tick, 1000 / 60);
