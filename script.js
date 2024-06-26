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
  static clamp(vector2, min, max) {
    let length = vector2.magnitude;
    length = clamp(length, min, max);
    return Vector2.times(vector2.normalized, length);
  }
  static rotate(vector2, theta) {
    return new Vector2(vector2.x * Math.cos(theta) - vector2.y * Math.sin(theta), vector2.x * Math.sin(theta) + vector2.y * Math.cos(theta));
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

class Camera {
  constructor(args) {
    this.pos = args.pos;
    this.focus_pos = Vector2.zero;
    this.smoothness = args.smoothness;
  }
  calc_pos() {
    this.pos = Vector2.times(Vector2.add(Vector2.times(this.pos, this.smoothness), this.focus_pos), 1 / (1 + this.smoothness));
  }
}


// ----------------------------------------------------------------------------------------------------
// DEFINE
// ----------------------------------------------------------------------------------------------------

// setting canvas
const canvas = document.getElementById("game-canvas");
//const ctx = canvas.getContext("2d");
const ctx = canvas.getContext("2d");
//CanvasRenderingContext2D.prototype.

// setting player marble
const player_attribute = {
  radius: 20
}
const player = new Player({
  pos: new Vector2(80, 80),
  motion: Vector2.zero,
  attribute: player_attribute
})

// setting camera object
const camera = new Camera({
  pos: new Vector2(80, 80),
  smoothness: 3
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



// ----------------------------------------------------------------------------------------------------
// LOGIC
// ----------------------------------------------------------------------------------------------------

function logic() {
  // calculate flick power and direction
  if (mouse_event.down && player.motion.magnitude < 0.1) { flick.start_point = mouse_event.pos; flick.charging = true; }
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
  if (flick.charging) {
    flick.end_point = mouse_event.pos;
    flick.motion = Vector2.sub(flick.end_point, flick.start_point);
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


// ----------------------------------------------------------------------------------------------------
// RENDER
// ----------------------------------------------------------------------------------------------------

const BACKGROUND_COLOR = "#fefefe";
const STAGE_COLOR = "#ddd";
const GUIDE_COLOR = "#abc8f5";

function render() {
  // calc camera position
  if (flick.charging) {
    camera.focus_pos = Vector2.add(player.pos, flick.motion);
  }
  camera.calc_pos();

  // init
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // background
  ctx.fillStyle =BACKGROUND_COLOR;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // stage
  for (let wall_data of stage_data[current_stage]) {
    ctx.fillStyle = STAGE_COLOR;
    ctx.fillRect(...wall_data.rect);
  }

  // display charge guide
  ctx.fillStyle = GUIDE_COLOR;
  if (flick.charging && POWER_LIM_MIN < flick.motion.magnitude) {
    let arrow_base = Vector2.add(player.pos, Vector2.times(flick.motion.normalized, player.attribute.radius));
    let arrow_vector = Vector2.clamp(flick.motion, POWER_LIM_MIN, POWER_LIM_MAX)
    fill_round_rect_line_path(ctx, ...arrow_base.pack, ...arrow_vector.pack, 3);
    ctx.fill();
    fill_round_rect_line_path(ctx, ...(Vector2.add(arrow_base, arrow_vector)).pack, ...Vector2.times(Vector2.rotate(arrow_vector.normalized.inverse, Math.PI / 4), 20).pack, 3);
    ctx.fill();
    fill_round_rect_line_path(ctx, ...(Vector2.add(arrow_base, arrow_vector)).pack, ...Vector2.times(Vector2.rotate(arrow_vector.normalized.inverse, - Math.PI / 4), 20).pack, 3);
    ctx.fill();
  }

  if (flick.charging) {
    ctx.fillStyle = "#abc8f5";
    ctx.moveTo(...flick.start_point.inverse.pack);
    ctx.beginPath();
    ctx.arc(...flick.start_point.inverse.pack, 10, 0, Math.PI * 2)
    ctx.fill();
  }

  // player
  ctx.fillStyle = "#629df5";
  ctx.moveTo(...player.pos.pack);
  ctx.beginPath();
  ctx.arc(...player.pos.pack, player.attribute.radius, 0, Math.PI * 2);
  ctx.fill();
}

function fill_round_rect_line_path(ctx, x, y, w, h, r) {
  let theta = Math.atan(h / w);
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x + w, y + h, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x + r * Math.cos(theta - Math.PI * 0.5), y + r * Math.sin(theta - Math.PI * 0.5));
  ctx.lineTo(x + w + r * Math.cos(theta - Math.PI * 0.5), y + h + r * Math.sin(theta - Math.PI * 0.5));
  ctx.lineTo(x + w + r * Math.cos(theta + Math.PI * 0.5), y + h + r * Math.sin(theta + Math.PI * 0.5));
  ctx.lineTo(x + r * Math.cos(theta + Math.PI * 0.5), y + r * Math.sin(theta + Math.PI * 0.5));
  ctx.closePath();
}


setInterval(tick, 1000 / 60);
