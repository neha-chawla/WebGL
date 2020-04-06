var VSHADER_SOURCE =
    'attribute vec4 a_Position;'+
    'void main(){'+
    'gl_Position=a_Position;'+
    '}';

var FSHADER_SOURCE=
    'precision mediump float;'+
    'uniform vec4 u_FragColor;'+
    'void main(){'+
    'gl_FragColor = u_FragColor;'+
    '}';

var shape_xy = [];
var colors = [];
var shape_type = [];
var shape_size = [];
var segment_count = [];
var color_choice = 0;
var shape_choice = 1;
var size = 0.1;
var segment = 20;
var u_FragColor;
var gl;

var rslider = document.getElementById("myRedRange");
var gslider = document.getElementById("myGreenRange");
var bslider = document.getElementById("myBlueRange");
var transSlider = document.getElementById("myTransRange");
var sizeSlider = document.getElementById("mySizeRange");
var segmentSlider = document.getElementById("mySegments");
var undoButton = document.getElementById("undo");

var routput = document.getElementById("redDemo");
var goutput = document.getElementById("greenDemo");
var boutput = document.getElementById("blueDemo");
var transOutput = document.getElementById("transDemo");
var segmentOutput = document.getElementById("segmentDemo");

routput.innerHTML = 1.0;
goutput.innerHTML = 0.5;
boutput.innerHTML = 0.5;
transOutput.innerHTML = 100 + "%";
segmentOutput.innerHTML = 20;

function main() {
  rslider.oninput = function(){
    routput.innerHTML = this.value;
  }
  gslider.oninput = function(){
    goutput.innerHTML = this.value;
  }
  bslider.oninput = function(){
    boutput.innerHTML = this.value;
  }
  transSlider.oninput = function(){
    transOutput.innerHTML = parseInt(this.value*100) + "%";
  }
  segmentSlider.oninput = function(){
    segmentOutput.innerHTML = this.value;
  }
  var canvas = document.getElementById("webgl");
  if(!canvas){
      console.log("Failed to retrieve the <canvas> element");
      return;
  }
  gl = getWebGLContext(canvas);
  if(!gl){
      console.log("Failed to get the rendering context for WebGL");
      return;
  }
  if(!initShaders(gl,VSHADER_SOURCE,FSHADER_SOURCE)){
      console.log("Failed to initialize shaders.");
      return;
  }
  u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
  if(!u_FragColor){
      console.log('Failed to get the storage location of u_FragColor');
      return;
  }
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT);
  canvas.onmousedown = function(ev){
    dragging = true;
    click(ev, gl, canvas, u_FragColor);
  };
  canvas.onmouseup = function(ev){
    dragging = false;
  };
}

function click(ev, gl, canvas, u_FragColor){
  if(dragging == true){
    var x = ev.clientX;
    var y = ev.clientY;
    var rect = ev.target.getBoundingClientRect();
    x = ((x - rect.left) - canvas.width / 2) / (canvas.width / 2);
    y = (canvas.height / 2 - (y - rect.top)) / (canvas.height / 2);
    shape_xy.push([x, y]);
    rslider.oninput = function(){
      routput.innerHTML = this.value;
    }
    gslider.oninput = function(){
      goutput.innerHTML = this.value;
    }
    bslider.oninput = function(){
      boutput.innerHTML = this.value;
    }
    transSlider.oninput = function(){
      transOutput.innerHTML = parseInt(this.value*100) + "%";
    }
    segmentSlider.oninput = function(){
      segmentOutput.innerHTML = this.value;
    }
    size = parseFloat(sizeSlider.value);
    segment = parseFloat(segmentSlider.value);
    shape_size.push(size);
    segment_count.push(segment);
    colors.push([rslider.value, gslider.value, bslider.value, transSlider.value]);
    if (shape_choice == 0){
      shape_type.push(0);
      shape_choice = 0;
    }
    else if (shape_choice == 1){
      shape_type.push(1);
      shape_choice = 1;
    }
    else if (shape_choice == 2){
      shape_type.push(2);
      shape_choice = 2;
    }
    drawNow();
  }
  if(canvas.onmouseup){
    onmousemove = null;
  }
  canvas.onmousemove = function(ev){
    click(ev, gl, canvas, u_FragColor);
  };
}
function drawNow(){
  gl.clear(gl.COLOR_BUFFER_BIT);
  for (i = 0; i < shape_xy.length; i++){
    var vertices;
    if (shape_type[i] == 0){
      vertices = createTriangleVertices(shape_xy[i][0], shape_xy[i][1], shape_size[i]);
    }
    else if (shape_type[i] == 1){
      vertices = createSquareVertices(shape_xy[i][0], shape_xy[i][1], shape_size[i]);
    }
    else if (shape_type[i] == 2){
      vertices = createCircleVertices(shape_xy[i][0], shape_xy[i][1], shape_size[i], segment_count[i]);
    }
    var n = initVertexBuffers(gl, vertices);
    if (n < 0) {
      console.log('Failed to set the positions of the vertices');
      return;
    }
    gl.uniform4f(u_FragColor, colors[i][0], colors[i][1], colors[i][2], colors[i][3]);
    if (shape_type[i] == 0){
      gl.drawArrays(gl.TRIANGLES, 0, n);
    }
    else if (shape_type[i] == 1){
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, n);
    }
    else if (shape_type[i] == 2){
      gl.drawArrays(gl.TRIANGLE_FAN, 0, n);
    }
  }
}

function createTriangleVertices(x, y, size){
  var vertices = new Float32Array([
    x + 0.0, y + size, x - size, y - size, x + size, y - size
  ]);
  return vertices;
}

function createSquareVertices(x, y, size){
  var vertices = new Float32Array([
    x - size, y - size, x + size, y - size,
    x + size, y + size, x - size, y + size, x - size, y - size
  ]);
  return vertices;
}

function createCircleVertices(x, y, size, segmentCount){
  var j = 0;
  var radius = size;
  var radian = 2.0*Math.PI/segmentCount;
  var new_vertices = [];
  new_vertices.push(new Float32Array([x+radius,y]));
  for(k = 0; k <= 2.0*Math.PI; k += radian){
    new_vertices.push(new Float32Array([x+radius*Math.cos(k), y+radius*Math.sin(k)]));
    j++;
  }
  var vertices = new Float32Array(new_vertices.length*2);
  for(l = 0; l < new_vertices.length; l++){
    vertices.set(new_vertices[l], l*2);
  }
  return vertices;
}

function initVertexBuffers(gl, vertices) {
  var vertexBuffer = gl.createBuffer();
  if(!vertexBuffer){
    console.log("Failed to create thie buffer object");
    return -1;
  }
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
  var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if(a_Position < 0){
    console.log("Failed to get the storage location of a_Position");
    return -1;
  }
  gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_Position);
  return vertices.length/2;
}

function clearCanvas() {
  shape_type = [];
  colors = [];
  shape_xy = [];
  shape_size = [];
  segment_count = [];
  var canvas = document.getElementById('webgl');
  var gl = getWebGLContext(canvas);
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT);
}

function randomizeCanvas() {
  shape_type = [];
  colors = [];
  shape_xy = [];
  shape_size = [];
  segment_count = [];
  var canvas = document.getElementById('webgl');
  var gl = getWebGLContext(canvas);
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }
  gl.clearColor(Math.random(), Math.random(), Math.random(), 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT);
}

undo.onclick = function(ev){
  shape_type.pop();
  colors.pop();
  shape_xy.pop();
  shape_size.pop();
  segment_count.pop();
  drawNow();
};

function triangles(){
  shape_choice = 0;
}

function squares(){
  shape_choice = 1;
}

function circles(){
  shape_choice = 2;
}

function randomShape(){
  shape_choice = Math.floor(Math.random()*3);
}

function randomize(){
  rslider.value = Math.random();
  gslider.value = Math.random();
  bslider.value = Math.random();
  routput.innerHTML = rslider.value;
  goutput.innerHTML = gslider.value;
  boutput.innerHTML = bslider.value;
}
