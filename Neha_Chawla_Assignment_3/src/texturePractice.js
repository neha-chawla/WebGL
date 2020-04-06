var VSHADER_SOURCE =
  'attribute vec4 a_Position;\n' +
  'attribute vec4 a_Color;\n' +
  'attribute vec2 a_TexCoord;\n' +
  'varying vec2 v_TexCoord;\n' +
  'uniform mat4 u_MvpMatrix;\n' +
  'uniform mat4 u_GlobalRotation;' +
  'varying vec4 v_Color;\n' +
  'void main() {\n' +
  '  gl_Position = u_GlobalRotation * u_MvpMatrix * a_Position;\n' +
  '  v_Color = a_Color;\n' +
  '  v_TexCoord = a_TexCoord;\n' +
  '}\n';

var FSHADER_SOURCE =
  '#ifdef GL_ES\n' +
  'precision mediump float;\n' +
  '#endif\n' +
  'uniform sampler2D u_Sampler;\n' +
  'varying vec2 v_TexCoord;\n' +
  'varying vec4 v_Color;\n' +
  'uniform float u_ColorTexture;\n' +
  'void main() {\n' +
  '  if (u_ColorTexture == 0.0){\n' +
  '     gl_FragColor = texture2D(u_Sampler, v_TexCoord);\n' +
  '  }\n' +
  '  else if (u_ColorTexture == 1.0){\n' +
  '     gl_FragColor = v_Color;\n' +
  '  }\n' +
  '}\n';

var rotAngleSlider = document.getElementById("myRotAngle");
var ANGLE_STEP = 45.0;
var g_last_foot4 = Date.now();
var g_last_foot1 = Date.now();
var foot_direction = -1;
var change;

function main() {
  var canvas = document.getElementById('webgl');
  var gl = getWebGLContext(canvas);
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to intialize shaders.');
    return;
  }
  var n = initVertexBuffers(gl);
  if (n < 0) {
    console.log('Failed to set the vertex information');
    return;
  }

  var colorTexture = 0.0;
  var u_ColorTexture = gl.getUniformLocation(gl.program, 'u_ColorTexture');
  if (!u_ColorTexture) {
    console.log('Failed to get the storage location of u_ColorTexture');
    return;
  }
  gl.uniform1f(u_ColorTexture, colorTexture);

  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  // Set texture
  if (!initTextures(gl, n)) {
    console.log('Failed to intialize the texture.');
    return;
  }

  gl.enable(gl.DEPTH_TEST);
  var u_GlobalRotation = gl.getUniformLocation(gl.program, 'u_GlobalRotation');
  if (!u_GlobalRotation) {
    console.log('Failed to get the storage location of u_GlobalRotation');
    return;
  }
  var GlobalRotation = new Matrix4();
  GlobalRotation.setRotate(rotAngleSlider.value, 0.0, 0.0);
  var viewMatrix = new Matrix4();
  viewMatrix.setPerspective(20, 1, 1, 100);
  viewMatrix.lookAt(3, 3, 7, 0, 0, 0, 0, 1, 0);
  var u_MvpMatrix = gl.getUniformLocation(gl.program, 'u_MvpMatrix');
  if (!u_MvpMatrix) {
    console.log('Failed to get the storage location of u_MvpMatrix');
    return;
  }
  var currentFoot1Angle = 0.0;
  renderScene(gl, n, viewMatrix, u_MvpMatrix, GlobalRotation, u_GlobalRotation, currentFoot1Angle);
  myRotAngle.oninput = function(ev){
    renderScene(gl, n, viewMatrix, u_MvpMatrix, GlobalRotation, u_GlobalRotation, currentFoot1Angle);
  };
  var tick = function() {
    currentFoot1Angle = foot1Animate(currentFoot1Angle);
    renderScene(gl, n, viewMatrix, u_MvpMatrix, GlobalRotation, u_GlobalRotation, currentFoot1Angle);
    requestAnimationFrame(tick, canvas);
  };
  tick();
}

function foot1Animate(foot1Angle) {
  var now = Date.now();
  var elapsed = now - g_last_foot1;
  g_last_foot1 = now;
  var newFoot1Angle = foot1Angle + (ANGLE_STEP * elapsed) / 1000.0;
  if (foot1Angle > 0){
    foot_direction = -1;
  }
  else if (foot1Angle < -12) {
    foot_direction = 1;
  }
  return newFoot1Angle = foot1Angle + foot_direction;
}

function drawCube(gl, n, viewMatrix, modelMatrix, u_MvpMatrix, GlobalRotation, u_GlobalRotation){
  var mvpMatrix = new Matrix4(viewMatrix);
  mvpMatrix.multiply(modelMatrix);
  gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
  gl.uniformMatrix4fv(u_GlobalRotation, false, GlobalRotation.elements);
  gl.drawElements(gl.TRIANGLES, n, gl.UNSIGNED_BYTE, 0);
}

function renderScene(gl, n, viewMatrix, u_MvpMatrix, GlobalRotation, u_GlobalRotation, currentFoot1Angle){
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  GlobalRotation.setRotate(rotAngleSlider.value, 0.0, 0.0);

  var leg1Matrix = new Matrix4();
  leg1Matrix.setTranslate(-0.40, -0.65, -0.05);
  leg1Matrix.rotate(-currentFoot1Angle, 0.0, 0.0, 1.0);
  foot1Matrix = new Matrix4(leg1Matrix)
  leg1Matrix.scale(0.2, 2.0, 0.15);

  foot1Matrix.translate(-0.02, -0.38, 0.002);
  foot1Matrix.scale(0.4, 0.2, 0.15);

  var leg2Matrix = new Matrix4();
  leg2Matrix.setTranslate(-0.36, -0.55, -0.12);
  leg2Matrix.rotate(currentFoot1Angle, 0.0, 0.0, 1.0);
  var foot2Matrix = new Matrix4(leg2Matrix)
  leg2Matrix.scale(0.2, 2.0, 0.2);

  foot2Matrix.translate(-0.02, -0.37, 0.002);
  foot2Matrix.scale(0.4, 0.2, 0.2);

  var leg3Matrix = new Matrix4();
  leg3Matrix.setTranslate(0.3, -0.65, 0.0);
  leg3Matrix.rotate(-currentFoot1Angle, 0.0, 0.0, 1.0);
  var foot3Matrix = new Matrix4(leg3Matrix)
  leg3Matrix.scale(0.2, 2.0, 0.2);

  foot3Matrix.translate(-0.02, -0.38, 0.002);
  foot3Matrix.scale(0.4, 0.2, 0.2);

  var leg4Matrix = new Matrix4();
  leg4Matrix.setTranslate(0.3, -0.65, -0.32);
  leg4Matrix.rotate(currentFoot1Angle, 0.0, 0.0, 1.0);
  var foot4Matrix = new Matrix4(leg4Matrix);
  leg4Matrix.scale(0.2, 2.0, 0.2);

  foot4Matrix.translate(-0.02, -0.37, 0.002);
  foot4Matrix.scale(0.4, 0.2, 0.2);

  var tailMatrix = new Matrix4();
  tailMatrix.setTranslate(0.6, 0.05, 0.05);
  tailMatrix.rotate(currentFoot1Angle, 0.0, 1.0, 0.0);
  tailMatrix.scale(0.7, 0.2, 0.2);

  var bodyMatrix = new Matrix4();
  bodyMatrix.scale(2.4, 1.0, 1.0);
  bodyMatrix.rotate(currentFoot1Angle/2, 0.0, 1.0, 0.0);

  var neckMatrix = new Matrix4();
  neckMatrix.setTranslate(-0.45, 0.5, 0.0);
  neckMatrix.rotate(20, 0.0, 0.0, 1.0);
  neckMatrix.scale(0.4, 2.0, 0.5);
  neckMatrix.rotate(currentFoot1Angle/2, 0.0, 1.0, 0.0);

  var headMatrix = new Matrix4();
  headMatrix.setTranslate(-0.65, 0.9, 0.01);
  headMatrix.scale(1.1, 0.5, 0.5);
  headMatrix.rotate(currentFoot1Angle/2, 0.0, 1.0, 0.0);

  drawCube(gl, n, viewMatrix, foot1Matrix, u_MvpMatrix, GlobalRotation, u_GlobalRotation);
  drawCube(gl, n, viewMatrix, foot2Matrix, u_MvpMatrix, GlobalRotation, u_GlobalRotation);
  drawCube(gl, n, viewMatrix, foot3Matrix, u_MvpMatrix, GlobalRotation, u_GlobalRotation);
  drawCube(gl, n, viewMatrix, foot4Matrix, u_MvpMatrix, GlobalRotation, u_GlobalRotation);
  drawCube(gl, n, viewMatrix, bodyMatrix, u_MvpMatrix, GlobalRotation, u_GlobalRotation);
  drawCube(gl, n, viewMatrix, neckMatrix, u_MvpMatrix, GlobalRotation, u_GlobalRotation);
  drawCube(gl, n, viewMatrix, headMatrix, u_MvpMatrix, GlobalRotation, u_GlobalRotation);
  drawCube(gl, n, viewMatrix, leg1Matrix, u_MvpMatrix, GlobalRotation, u_GlobalRotation);
  drawCube(gl, n, viewMatrix, leg2Matrix, u_MvpMatrix, GlobalRotation, u_GlobalRotation);
  drawCube(gl, n, viewMatrix, leg3Matrix, u_MvpMatrix, GlobalRotation, u_GlobalRotation);
  drawCube(gl, n, viewMatrix, leg4Matrix, u_MvpMatrix, GlobalRotation, u_GlobalRotation);
  drawCube(gl, n, viewMatrix, tailMatrix, u_MvpMatrix, GlobalRotation, u_GlobalRotation);
}

function initVertexBuffers(gl) {
  var vertices = new Float32Array([
     0.2, 0.2, 0.2,  -0.2, 0.2, 0.2,  -0.2,-0.2, 0.2,   0.2,-0.2, 0.2, // v0-v1-v2-v3 front
     0.2, 0.2, 0.2,   0.2,-0.2, 0.2,   0.2,-0.2,-0.2,   0.2, 0.2,-0.2, // v0-v3-v4-v5 right
     0.2, 0.2, 0.2,   0.2, 0.2,-0.2,  -0.2, 0.2,-0.2,  -0.2, 0.2, 0.2, // v0-v5-v6-v1 up
    -0.2, 0.2, 0.2,  -0.2, 0.2,-0.2,  -0.2,-0.2,-0.2,  -0.2,-0.2, 0.2, // v1-v6-v7-v2 left
    -0.2,-0.2,-0.2,   0.2,-0.2,-0.2,   0.2,-0.2, 0.2,  -0.2,-0.2, 0.2, // v7-v4-v3-v2 down
     0.2,-0.2,-0.2,  -0.2,-0.2,-0.2,  -0.2, 0.2,-0.2,   0.2, 0.2,-0.2 // v4-v7-v6-v5 back
  ]);

  var colors = new Float32Array([
    1, 0, 0,    1, 0, 0,    1, 0, 0,    1, 0, 0, // front
    1, 1, 0,    1, 1, 0,    1, 1, 0,    1, 1, 0, // right
    0, 1, 1,    0, 1, 1,    0, 1, 1,    0, 1, 1, // up
    1, 0, 1,    1, 0, 1,    1, 0, 1,    1, 0, 1, // left
    0, 1, 0,    0, 1, 0,    0, 1, 0,    0, 1, 0, // down
    0, 0, 1,    0, 0, 1,    0, 0, 1,    0, 0, 1 // back
  ]);

  var verticesTexCoords = new Float32Array([
    // Front
    1.0,  1.0,    0.0,  1.0,    0.0,  0.0,    1.0,  0.0,
    // Back
    1.0,  1.0,    0.0,  1.0,    0.0,  0.0,    1.0,  0.0,
    // Top
    1.0,  1.0,    0.0,  1.0,    0.0,  0.0,    1.0,  0.0,
    // Bottom
    1.0,  1.0,    0.0,  1.0,    0.0,  0.0,    1.0,  0.0,
    // Right
    1.0,  1.0,    0.0,  1.0,    0.0,  0.0,    1.0,  0.0,
    // Left
    1.0,  1.0,    0.0,  1.0,    0.0,  0.0,    1.0,  0.0,
  ]);

  var indices = new Uint8Array([
     0, 1, 2,   0, 2, 3, // front
     4, 5, 6,   4, 6, 7, // right
     8, 9,10,   8,10,11, // up
    12,13,14,  12,14,15, // left
    16,17,18,  16,18,19, // down
    20,21,22,  20,22,23 // back
  ]);

  var indexBuffer = gl.createBuffer();
  if (!indexBuffer)
    return -1;
  if (!initArrayBuffer(gl, vertices, 3, gl.FLOAT, 'a_Position'))
    return -1;
  if (!initArrayBuffer(gl, colors, 3, gl.FLOAT, 'a_Color'))
    return -1;
  if (!initArrayBuffer(gl, verticesTexCoords, 2, gl.FLOAT, 'a_TexCoord'))
    return -1;

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
  return indices.length;
}

function initArrayBuffer(gl, data, num, type, attribute) {
  var buffer = gl.createBuffer();
  if (!buffer) {
    console.log('Failed to create the buffer object');
    return false;
  }
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);

  FSIZE = data.BYTES_PER_ELEMENT;

  var a_attribute = gl.getAttribLocation(gl.program, attribute);
  if (a_attribute < 0) {
    console.log('Failed to get the storage location of ' + attribute);
    return false;
  }
  gl.vertexAttribPointer(a_attribute, num, type, false, FSIZE*num, 0);
  gl.enableVertexAttribArray(a_attribute);
  return true;
}

function initTextures(gl, n) {
  var texture = gl.createTexture();   // Create a texture object
  if (!texture) {
    console.log('Failed to create the texture object');
    return false;
  }

  // Get the storage location of u_Sampler
  var u_Sampler = gl.getUniformLocation(gl.program, 'u_Sampler');
  if (!u_Sampler) {
    console.log('Failed to get the storage location of u_Sampler');
    return false;
  }
  var image = new Image();  // Create the image object
  if (!image) {
    console.log('Failed to create the image object');
    return false;
  }
  // Register the event handler to be called on loading an image
  image.onload = function(){ loadTexture(gl, n, texture, u_Sampler, image); };
  // Tell the browser to load an image
  image.src = 'sky.jpg';
  return true;
}

function loadTexture(gl, n, texture, u_Sampler, image) {
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1); // Flip the image's y axis
  // Enable texture unit0
  gl.activeTexture(gl.TEXTURE0);
  // Bind the texture object to the target
  gl.bindTexture(gl.TEXTURE_2D, texture);
  // Set the texture parameters
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  // Set the texture image
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
  // Set the texture unit 0 to the sampler
  gl.uniform1i(u_Sampler, 0);
  gl.clear(gl.COLOR_BUFFER_BIT);   // Clear <canvas>
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, n); // Draw the rectangle
}
