const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resize();
window.addEventListener("resize", resize);

const GRAVITY = 0.5;
const GROUND_HEIGHT = 40;

function groundY() {
  return canvas.height - GROUND_HEIGHT;
}

// blcok pics are unique :)
// temps are plain white boxes
const imagePaths = ["assets/block.jpg", "assets/block2.jpg", "assets/block3.jpg", "assets/block4.jpg", "assets/block5.jpg"];

// file path to pic to drawable for canvas!
function loadImage(path){
  const img = new Image();
  img.src = path;
  return img;
}

// load every path in the list
const blockImages = imagePaths.map(loadImage);

class Block{
  constructor(x, y, width, height, image){
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.image = image;
    this.velocityY = 0;
    this.onGround = false;
  }

  // is the point (px, py) inside this block?
  containsPoint(px, py){
    return (px >= this.x) && ( px <= this.x +this.width) && (py >= this.y ) && (py <= this.y + this.height);
  }

  // do this block and the other one share any horizontal space?
  overlapsHorizontally(other){
    return (this.x< other.x + other.width)  && (this.x + this.width > other.x);
  }

  update(blocksBelow){
    this.velocityY += GRAVITY;
    this.y += this.velocityY;

    const newBottom = this.y + this.height;

    // find the highest surface reached: the ground or the top of a block below us.
    // if a block below has moved up into us (ex. the window got shorter), this pushes us back on top
    let landingY = groundY();
    for(const other of blocksBelow){
      if(!this.overlapsHorizontally(other)){ continue; }
      if(other.y <= newBottom && other.y < landingY){
        landingY = other.y;
      }
    }

    if(newBottom>= landingY){
      this.y = landingY - this.height;
      this.velocityY = 0;
      this.onGround = true;
    } 
    else{
      this.onGround = false;
    }
  }

  draw(ctx, isSelected){
    const imageReady = this.image && this.image.complete && this.image.naturalWidth > 0;

    if(imageReady){
      // stretch the pic to fill the block
      ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
      if(isSelected){
        // selection colour
        ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
        ctx.fillRect(this.x, this.y, this.width, this.height);
      }
    } 
    else{
      // case for no img
      this.drawPlainBox(ctx, isSelected);
    }
  }

  // white box with a dark outline, dark gray when selected
  drawPlainBox(ctx, isSelected){
    if(isSelected){
      ctx.fillStyle = "#555555";
    } else {
      ctx.fillStyle = "#ffffff";
    }
    ctx.fillRect(this.x, this.y, this.width, this.height);

    // outlinee
    ctx.strokeStyle = "#333333";
    ctx.lineWidth = 2;
    ctx.strokeRect(this.x, this.y, this.width, this.height);
  }
}

// make a block at the given x position with its pic
function stackBlock(x, width, height, y, image){
  return new Block(x, y, width, height, image);
}

// the block stack
const blocks = [
  stackBlock(randomX(100, 50), 400, 100, 0, blockImages[0]),
  stackBlock(randomX(100, 50), 400, 100, -200, blockImages[1]),
  stackBlock(randomX(100, 50), 400, 100, -400, blockImages[2]),
  stackBlock(randomX(100, 50), 400, 100, -500, blockImages[3]),
  stackBlock(randomX(100, 50), 400, 100, -600, blockImages[4])
];

// generate a rand number for tange of x position for bl;ock stakc
function randomX(position, maxRange){
    const sign = Math.floor(Math.random()*2);
    if(sign == 1){
        return position + 2*(Math.floor(Math.random()*Math.floor(maxRange / 2)));
    }
    else{
        return position - 2*(Math.floor(Math.random()*Math.floor(maxRange / 2)));
    }
}

// the block on top of the drawing order that's under the point, or null
function blockAt(x, y){
  for(let i = blocks.length - 1; i >= 0; i--){
    if(blocks[i].containsPoint(x, y)){ return blocks[i]; }
  }
  return null;
}

// selection let, click to select/unselect
let selected = null;
function selectBlock(e){
  const clickedBlock = blockAt(e.clientX, e.clientY);

  if(clickedBlock === selected){
    // clicked the block that's already selected: unselect it
    selected = null;
  } 
  else{
    // clicked a different block (or null): select that
    selected = clickedBlock;
  }
}
canvas.addEventListener("click", selectBlock);

// clicky pointer
function updateCursor(e){
  if(blockAt(e.clientX, e.clientY)){
    canvas.style.cursor = "pointer";
  } 
  else{
    canvas.style.cursor = "default";
  }
}
canvas.addEventListener("pointermove", updateCursor);

function update(){
  // update lowest blocks first so ones on top land on their new positions :D
  const lowestFirst = blocks.slice(); // copy the list so the drawing order isn't changed
  lowestFirst.sort(lowerBlockFirst);

  const done = [];
  for(const block of lowestFirst){
    block.update(done); //only check against blocks lwoer on the stakc
    done.push(block);
  }
}

// sort() helper, tells it which of two blocks goes first
function lowerBlockFirst(a, b){
  const aBottom = a.y + a.height;
  const bBottom = b.y + b.height;
  return bBottom - aBottom;
}

// draw tthe ground + the blocks :)
function draw(){
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // ground
  ctx.fillStyle = "#888888";
  ctx.fillRect(0, groundY(), canvas.width, GROUND_HEIGHT);

  // blocks
  for(const block of blocks){
    block.draw(ctx, block == selected);
  }
}

// so gravity works
function loop(){
  update();
  draw();
  requestAnimationFrame(loop);
}
loop();
