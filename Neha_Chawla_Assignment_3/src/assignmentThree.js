  var VSHADER_SOURCE =
    'attribute vec4 a_Position;\n' +
    'attribute vec4 a_Color;\n' +
    'attribute vec2 a_TexCoord;\n' +
    'varying vec2 v_TexCoord;\n' +
    'uniform mat4 u_ModelMatrix;\n' +
    'uniform mat4 u_ViewMatrix;\n' +
    'uniform mat4 u_Perspective;\n' +
    'varying vec4 v_Color;\n' +
    'void main() {\n' +
    '  gl_Position = u_Perspective * u_ViewMatrix * u_ModelMatrix * a_Position;\n' +
    '  v_Color = a_Color;\n' +
    '  v_TexCoord = a_TexCoord;\n' +
    '}\n';

  var FSHADER_SOURCE =
    '#ifdef GL_ES\n' +
    'precision mediump float;\n' +
    '#endif\n' +
    'uniform sampler2D u_Sampler;\n' +
    'uniform sampler2D u_Sampler2;\n' +
    'uniform sampler2D u_Sampler3;\n' +
    'varying vec2 v_TexCoord;\n' +
    'varying vec4 v_Color;\n' +
    'uniform float u_ColorTexture;\n' +
    'uniform vec4 u_FragColor;\n' +
    'uniform vec4 u_FragColorTwo;\n' +
    'void main() {\n' +
    '  if (u_ColorTexture == 0.0){\n' +
    '     gl_FragColor = texture2D(u_Sampler, v_TexCoord);\n' +
    '  }\n' +
    '  else if (u_ColorTexture == 1.0){\n' +
    '     gl_FragColor = v_Color;\n' +
    '  }\n' +
    '  else if (u_ColorTexture == 2.0){\n' +
    '     gl_FragColor = u_FragColor;\n' +
    '  }\n' +
    '  else if (u_ColorTexture == 3.0){\n' +
    '     gl_FragColor = u_FragColorTwo;\n' +
    '  }\n' +
    '  else if (u_ColorTexture == 4.0){\n' +
    '     gl_FragColor = texture2D(u_Sampler2, v_TexCoord);\n' +
    '  }\n' +
    '  else if (u_ColorTexture == 5.0){\n' +
    '     gl_FragColor = texture2D(u_Sampler3, v_TexCoord);\n' +
    '  }\n' +
    '}\n';

  var ANGLE_STEP = 45.0;
  var g_last_foot4 = Date.now();
  var g_last_foot1 = Date.now();
  var foot_direction = -1;
  var change;
  var colorTexture = 0.0;
  var turning;

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

    var u_ColorTexture = gl.getUniformLocation(gl.program, 'u_ColorTexture');
    if (!u_ColorTexture) {
      console.log('Failed to get the storage location of u_ColorTexture');
      return;
    }
    gl.uniform1f(u_ColorTexture, colorTexture);

    var u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
    if(!u_FragColor){
        console.log('Failed to get the storage location of u_FragColor');
        return;
    }

    var u_FragColorTwo = gl.getUniformLocation(gl.program, 'u_FragColorTwo');
    if(!u_FragColorTwo){
        console.log('Failed to get the storage location of u_FragColorTwo');
        return;
    }

    gl.uniform4f(u_FragColor, (50/256)*1.0, (150/256) * 1.0 , 1.0, 1.0);
    gl.uniform4f(u_FragColorTwo, 0.5, 0.5, 0.5, 0.8);
    gl.clearColor(0, 0, 0, 1.0);

    if (!initTextures(gl, n)) {
      console.log('Failed to intialize the texture.');
      return;
    }

    gl.enable(gl.DEPTH_TEST);

    var u_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
    if (!u_ViewMatrix) {
      console.log('Failed to get the storage location of u_ViewMatrix');
      return;
    }

    var u_Perspective = gl.getUniformLocation(gl.program, 'u_Perspective');
    if (!u_Perspective) {
      console.log('Failed to get the storage location of u_Perspective');
      return;
    }

    var u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
    if (!u_ModelMatrix) {
      console.log('Failed to get the storage location of u_ModelMatrix');
      return;
    }

    var viewMatrix = new Matrix4();

    var currentFoot1Angle = 0.0;
    renderScene(gl, n, u_ViewMatrix, viewMatrix, u_Perspective, u_ModelMatrix, currentFoot1Angle, u_ColorTexture);
    canvas.onmouseenter = function(ev, gl, canvas){
      mouseMoved(ev, gl, canvas);
    };
    canvas.onmouseleave = function(ev, gl, canvas){
      mouseLeft(ev, gl, canvas);
    }
    document.onkeydown = function(ev){ keydown(ev, gl, n, u_ViewMatrix, viewMatrix, u_Perspective, u_ModelMatrix, currentFoot1Angle, u_ColorTexture); };
    var tick = function() {
      currentFoot1Angle = foot1Animate(currentFoot1Angle);
      renderScene(gl, n, u_ViewMatrix, viewMatrix, u_Perspective, u_ModelMatrix, currentFoot1Angle, u_ColorTexture);
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

  var eyeX = -3, eyeY = 1, eyeZ = 10;
  var atX = 0, atY = 0, atZ = 0;
  var upX = 0, upY = 1, upZ = 0;
  var angle;
  var xd = 0.0;
  var zd = 0.0;

  function mouseMoved(ev, gl, canvas){
    var x = ev.clientX;
    if(x <= 200){
      xd = atX - eyeX;
      zd = atZ - eyeZ;
      var distFormula = Math.sqrt(Math.pow(xd, 2) + Math.pow(zd, 2));
      if(xd == 0){
          degrees = (zd > 0 ? 90 : 270);
      }
      else if(xd > 0 && zd > 0){
          degrees = (180/Math.PI) * Math.atan(zd/xd);
      }
      else if(xd < 0 && zd > 0){
          degrees = 180 + ((180/Math.PI) * Math.atan(zd/xd));
      }
      else if(xd < 0 && zd < 0){
          degrees = 180 + ((180/Math.PI) * Math.atan(zd/xd));
      }
      else{
          degrees = 360 + ((180/Math.PI) * Math.atan(zd/xd));
      }
      var updatedDegrees = degrees - 0.5;
      xd = Math.cos((Math.PI/180) * (degrees - 0.5)) * distFormula;
      zd = Math.sin((Math.PI/180)* (degrees - 0.5)) * distFormula;
      atX = eyeX + xd;
      atZ = eyeZ + zd;
    }
    else if(x > 200){
      xd = atX - eyeX;
      zd = atZ - eyeZ;
      var distFormula = Math.sqrt(Math.pow(xd, 2) + Math.pow(zd, 2));
      if(xd == 0){
          degrees = (zd > 0 ? 90 : 270);
      }
      else if(xd > 0 && zd > 0){
          degrees = (180/Math.PI) * Math.atan(zd/xd);
      }
      else if(xd < 0 && zd > 0){
          degrees = 180 + ((180/Math.PI) * Math.atan(zd/xd));
      }
      else if(xd < 0 && zd < 0){
          degrees = 180 + ((180/Math.PI) * Math.atan(zd/xd));
      }
      else{
          degrees = 360 + ((180/Math.PI) * Math.atan(zd/xd));
      }
      var updatedDegrees = degrees + 0.5;
      xd = Math.cos((Math.PI/180)* (degrees + 0.5)) * distFormula;
      zd = Math.sin((Math.PI/180)* (degrees + 0.5)) * distFormula;
      atX = eyeX + xd;
      atZ = eyeZ + zd;
    }
    turning = setInterval(function(){if(x <= 200){
                                        xd = atX - eyeX;
                                        zd = atZ - eyeZ;
                                        var distFormula = Math.sqrt(Math.pow(xd, 2) + Math.pow(zd, 2));
                                        if(xd == 0){
                                            degrees = (zd > 0 ? 90 : 270) - 0.5;
                                        }
                                        else if(xd > 0 && zd > 0){
                                            degrees = ((180/Math.PI) * Math.atan(zd/xd)) - 0.5;
                                        }
                                        else if(xd < 0 && zd > 0){
                                            degrees = (180 + ((180/Math.PI) * Math.atan(zd/xd))) - 0.5;
                                        }
                                        else if(xd < 0 && zd < 0){
                                            degrees = (180 + ((180/Math.PI) * Math.atan(zd/xd))) - 0.5;
                                        }
                                        else{
                                            degrees = (360 + ((180/Math.PI) * Math.atan(zd/xd))) - 0.5;
                                        }
                                        xd = Math.cos((Math.PI/180) * degrees) * distFormula;
                                        zd = Math.sin((Math.PI/180) * degrees) * distFormula;
                                        atX = eyeX + xd;
                                        atZ = eyeZ + zd;
                                      } else if(x > 200){
                                        xd = atX - eyeX;
                                        zd = atZ - eyeZ;
                                        var distFormula = Math.sqrt(Math.pow(xd, 2) + Math.pow(zd, 2));
                                        if(xd == 0){
                                            degrees = (zd > 0 ? 90 : 270) + 0.5;
                                        }
                                        else if(xd > 0 && zd > 0){
                                            degrees = ((180/Math.PI) * Math.atan(zd/xd)) + 0.5;
                                        }
                                        else if(xd < 0 && zd > 0){
                                            degrees = (180 + ((180/Math.PI) * Math.atan(zd/xd))) + 0.5;
                                        }
                                        else if(xd < 0 && zd < 0){
                                            degrees = (180 + ((180/Math.PI) * Math.atan(zd/xd))) + 0.5;
                                        }
                                        else{
                                            degrees = (360 + ((180/Math.PI) * Math.atan(zd/xd))) + 0.5;
                                        }
                                        xd = Math.cos((Math.PI/180) * degrees) * distFormula;
                                        zd = Math.sin((Math.PI/180) * degrees) * distFormula;
                                        atX = eyeX + xd;
                                        atZ = eyeZ + zd;
                                      }
                                    }, 1);
  }

  function mouseLeft(ev, gl, canvas){
    clearInterval(turning);
  }

  function keydown(ev, gl, n, u_ViewMatrix, viewMatrix, u_Perspective, u_ModelMatrix, currentFoot1Angle, u_ColorTexture) {
      if(ev.keyCode == 87) {
        xd = atX - eyeX;
        zd = atZ - eyeZ;
        x = xd;
        z = zd;
        divisor = Math.sqrt(Math.pow(x, 2) + Math.pow(z, 2));
        xd = x/divisor * 0.5;
        zd = z/divisor * 0.5;
        eyeX += xd;
        eyeZ += zd;
        atX += xd;
        atZ += zd;
      } else
      if (ev.keyCode == 83) {
        xd = 0 - (atX - eyeX);
        zd = 0 - (atZ - eyeZ);
        x = xd;
        z = zd;
        divisor = Math.sqrt(Math.pow(xd, 2) + Math.pow(zd, 2));
        xd = x/divisor*0.5;
        zd = z/divisor*0.5;
        eyeX += xd;
        eyeZ += zd;
        atX += xd;
        atZ += zd;
      } else
      if (ev.keyCode == 65) {
        xd = atX - eyeX;
        zd = atZ - eyeZ;
        var distFormula = Math.sqrt(Math.pow(xd, 2) + Math.pow(zd, 2));
        if(xd == 0){
            degrees = (zd > 0 ? 90 : 270) - 90;
        }
        else if(xd > 0 && zd > 0){
            degrees = ((180/Math.PI) * Math.atan(zd/xd)) - 90;
        }
        else if(xd < 0 && zd > 0){
            degrees = (180 + ((180/Math.PI) * Math.atan(zd/xd))) - 90;
        }
        else if(xd < 0 && zd < 0){
            degrees = (180 + ((180/Math.PI) * Math.atan(zd/xd))) - 90;
        }
        else{
            degrees = (360 + ((180/Math.PI) * Math.atan(zd/xd))) - 90;
        }
        xd = Math.cos((Math.PI/180) * degrees) * distFormula;
        zd = Math.sin((Math.PI/180) * degrees) * distFormula;
        x = xd;
        z = zd;
        divisor = Math.sqrt(Math.pow(xd, 2) + Math.pow(zd, 2));
        xd = x/divisor * 0.5;
        zd = z/divisor * 0.5;
        eyeX += xd;
        eyeZ += zd;
        atX += xd;
        atZ += zd;
      } else
      if (ev.keyCode == 68) {
        xd = atX - eyeX;
        zd = atZ - eyeZ;
        var distFormula = Math.sqrt(Math.pow(xd, 2) + Math.pow(zd, 2));
        if(xd == 0){
            degrees = (zd > 0 ? 90 : 270) + 90;
        }
        else if(xd > 0 && zd > 0){
            degrees = ((180/Math.PI) * Math.atan(zd/xd)) + 90;
        }
        else if(xd < 0 && zd > 0){
            degrees = (180 + ((180/Math.PI) * Math.atan(zd/xd))) + 90;
        }
        else if(xd < 0 && zd < 0){
            degrees = (180 + ((180/Math.PI) * Math.atan(zd/xd))) + 90;
        }
        else{
            degrees = (360 + ((180/Math.PI) * Math.atan(zd/xd))) + 90;
        }
        xd = Math.cos((Math.PI/180) * degrees) * distFormula;
        zd = Math.sin((Math.PI/180) * degrees) * distFormula;
        x = xd;
        z = zd;
        divisor = Math.sqrt(Math.pow(xd, 2) + Math.pow(zd, 2));
        xd = x/divisor * 0.5;
        zd = z/divisor * 0.5;
        eyeX += xd;
        eyeZ += zd;
        atX += xd;
        atZ += zd;
      } else
      if (ev.keyCode == 81) {
        xd = atX - eyeX;
        zd = atZ - eyeZ;
        var distFormula = Math.sqrt(Math.pow(xd, 2) + Math.pow(zd, 2));
        if(xd == 0){
            degrees = (zd > 0 ? 90 : 270) - 0.25;
        }
        else if(xd > 0 && zd > 0){
            degrees = ((180/Math.PI) * Math.atan(zd/xd)) - 0.25;
        }
        else if(xd < 0 && zd > 0){
            degrees = (180 + ((180/Math.PI) * Math.atan(zd/xd))) - 0.25;
        }
        else if(xd < 0 && zd < 0){
            degrees = (180 + ((180/Math.PI) * Math.atan(zd/xd))) - 0.25;
        }
        else{
            degrees = (360 + ((180/Math.PI) * Math.atan(zd/xd))) - 0.25;
        }
        xd = Math.cos((Math.PI/180) * degrees) * distFormula;
        zd = Math.sin((Math.PI/180) * degrees) * distFormula;
        atX = eyeX + xd;
        atZ = eyeZ + zd;
      } else
      if (ev.keyCode == 69) {
        xd = atX - eyeX;
        zd = atZ - eyeZ;
        var distFormula = Math.sqrt(Math.pow(xd, 2) + Math.pow(zd, 2));
        if(xd == 0){
            degrees = (zd > 0 ? 90 : 270) + 0.25;
        }
        else if(xd > 0 && zd > 0){
            degrees = ((180/Math.PI) * Math.atan(zd/xd)) + 0.25;
        }
        else if(xd < 0 && zd > 0){
            degrees = (180 + ((180/Math.PI) * Math.atan(zd/xd))) + 0.25;
        }
        else if(xd < 0 && zd < 0){
            degrees = (180 + ((180/Math.PI) * Math.atan(zd/xd))) + 0.25;
        }
        else{
            degrees = (360 + ((180/Math.PI) * Math.atan(zd/xd))) + 0.25;
        }
        xd = Math.cos((Math.PI/180) * degrees) * distFormula;
        zd = Math.sin((Math.PI/180) * degrees) * distFormula;
        atX = eyeX + xd;
        atZ = eyeZ + zd;
      }
      else { return; }
  }

  function drawCube(gl, n, u_ViewMatrix, viewMatrix, u_Perspective, u_ModelMatrix, modelMatrix){
    var perspectiveMatrix = new Matrix4();
    perspectiveMatrix.setPerspective(20, 1, 1, 100);
    viewMatrix.setTranslate(0, 0, 0, 0);
    viewMatrix.lookAt(eyeX, eyeY, eyeZ, atX, atY, atZ, upX, upY, upZ);
    gl.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements);
    gl.uniformMatrix4fv(u_Perspective, false, perspectiveMatrix.elements);
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
    gl.drawElements(gl.TRIANGLES, n, gl.UNSIGNED_BYTE, 0);
  }

  function renderScene(gl, n, u_ViewMatrix, viewMatrix, u_Perspective, u_ModelMatrix, currentFoot1Angle, u_ColorTexture){
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    var skyMatrix = new Matrix4();
    skyMatrix.setTranslate(0, 0, -7);
    skyMatrix.scale(100, 100, 100);
    colorTexture = 2.0;
    gl.uniform1f(u_ColorTexture, colorTexture);
    drawCube(gl, n, u_ViewMatrix, viewMatrix, u_Perspective, u_ModelMatrix, skyMatrix);

    var leg1Matrix = new Matrix4();
    leg1Matrix.setTranslate(-0.40, -0.65, 0.0);
    leg1Matrix.rotate(-currentFoot1Angle, 0.0, 0.0, 1.0);
    foot1Matrix = new Matrix4(leg1Matrix)
    leg1Matrix.scale(0.2, 2.0, 0.15);

    foot1Matrix.translate(-0.02, -0.38, 0.002);
    foot1Matrix.scale(0.4, 0.2, 0.15);

    var leg2Matrix = new Matrix4();
    leg2Matrix.setTranslate(-0.36, -0.65, -0.25);
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
    leg4Matrix.setTranslate(0.3, -0.65, -0.25);
    leg4Matrix.rotate(currentFoot1Angle, 0.0, 0.0, 1.0);
    var foot4Matrix = new Matrix4(leg4Matrix);
    leg4Matrix.scale(0.2, 2.0, 0.2);

    foot4Matrix.translate(-0.02, -0.37, 0.002);
    foot4Matrix.scale(0.4, 0.2, 0.2);

    var tailMatrix = new Matrix4();
    tailMatrix.setTranslate(0.6, 0.05, -0.1);
    tailMatrix.rotate(currentFoot1Angle, 0.0, 1.0, 0.0);
    tailMatrix.scale(0.7, 0.2, 0.2);

    var bodyMatrix = new Matrix4();
    bodyMatrix.setTranslate(0, -0.1, -0.1);
    bodyMatrix.scale(2.6, 1.0, 1.0);
    bodyMatrix.rotate(currentFoot1Angle/2, 0.0, 1.0, 0.0);

    var neckMatrix = new Matrix4();
    neckMatrix.setTranslate(-0.45, 0.4, -0.1);
    neckMatrix.rotate(20, 0.0, 0.0, 1.0);
    neckMatrix.scale(0.4, 2.0, 0.5);
    neckMatrix.rotate(currentFoot1Angle/2, 0.0, 1.0, 0.0);

    var headMatrix = new Matrix4();
    headMatrix.setTranslate(-0.65, 0.8, -0.1);
    headMatrix.scale(1.1, 0.5, 0.5);
    headMatrix.rotate(currentFoot1Angle/2, 0.0, 1.0, 0.0);

    var worldArray = [
      [4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 5, 5, 5, 5, 5, 5, 5, 4, 3, 3, 3, 3, 3, 4, 4, 4, 4],
      [4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4],
      [3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3],
      [3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3],
      [3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3],
      [3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3],
      [3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5],
      [3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5],
      [4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5],
      [4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5],
      [5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5],
      [5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4],
      [5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4],
      [5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4],
      [5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4],
      [4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4],
      [4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3],
      [4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3],
      [4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4],
      [4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4],
      [4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4],
      [4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4],
      [4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4],
      [3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4],
      [3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3],
      [4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3],
      [4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3],
      [4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3],
      [4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3],
      [4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3],
      [4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4],
      [4, 4, 5, 5, 5, 5, 5, 4, 4, 4, 4, 4, 4, 4, 4, 3, 3, 3, 3, 3, 4, 4, 4, 5, 5, 5, 5, 4, 4, 4, 4, 4],
    ];

    var stoneArray = [
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 3, 3, 3, 3, 3, 3, 3, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 3, 3, 3, 3, 3, 3, 3, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 3, 3, 3, 3, 3, 3, 3, 3, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 3, 3, 3, 3, 3, 3, 3, 3, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    ];
    colorTexture = 0.0;
    gl.uniform1f(u_ColorTexture, colorTexture);
    var worldMatrixWall = new Matrix4();
    var width = 1
    var length = 1
    var height = 1
    worldMatrixWall.setTranslate(-4, -1, 8);
    worldMatrixWall.scale(width, height, length);

    for(var x = 0; x < 32; x++){
      for(var z = 0; z < 32; z++){
        for (var y = 0; y < worldArray[x][z]; y++)
        {
          var worldMatrixWallCopy = new Matrix4(worldMatrixWall);
          worldMatrixWallCopy.translate(x * width * 0.4, y * height * 0.4, z * -length * 0.4);
          drawCube(gl, n, u_ViewMatrix, viewMatrix, u_Perspective, u_ModelMatrix, worldMatrixWallCopy);
        }
      }
    }

    colorTexture = 5.0;
    gl.uniform1f(u_ColorTexture, colorTexture);
    var stoneMatrixWall = new Matrix4();
    var width = 1
    var length = 1
    var height = 1
    stoneMatrixWall.setTranslate(-4, -1, 8);
    stoneMatrixWall.scale(width, height, length);

    for(var x = 0; x < 32; x++){
      for(var z = 0; z < 32; z++){
        for (var y = 0; y < stoneArray[x][z]; y++)
        {
          if(x == 31 || z == 32){
            colorTexture = 0.5;
          }
          var stoneMatrixWallCopy = new Matrix4(stoneMatrixWall);
          stoneMatrixWallCopy.translate(x*width * 0.4, y*height * 0.4, z * -length * 0.4);
          drawCube(gl, n, u_ViewMatrix, viewMatrix, u_Perspective, u_ModelMatrix, stoneMatrixWallCopy);
        }
      }
    }

    colorTexture = 4.0;
    gl.uniform1f(u_ColorTexture, colorTexture);

    drawCube(gl, n, u_ViewMatrix, viewMatrix, u_Perspective, u_ModelMatrix, foot1Matrix);
    drawCube(gl, n, u_ViewMatrix, viewMatrix, u_Perspective, u_ModelMatrix, foot2Matrix);
    drawCube(gl, n, u_ViewMatrix, viewMatrix, u_Perspective, u_ModelMatrix, foot3Matrix);
    drawCube(gl, n, u_ViewMatrix, viewMatrix, u_Perspective, u_ModelMatrix, foot4Matrix);
    drawCube(gl, n, u_ViewMatrix, viewMatrix, u_Perspective, u_ModelMatrix, bodyMatrix);
    drawCube(gl, n, u_ViewMatrix, viewMatrix, u_Perspective, u_ModelMatrix, neckMatrix);
    drawCube(gl, n, u_ViewMatrix, viewMatrix, u_Perspective, u_ModelMatrix, headMatrix);
    drawCube(gl, n, u_ViewMatrix, viewMatrix, u_Perspective, u_ModelMatrix, leg1Matrix);
    drawCube(gl, n, u_ViewMatrix, viewMatrix, u_Perspective, u_ModelMatrix, leg2Matrix);
    drawCube(gl, n, u_ViewMatrix, viewMatrix, u_Perspective, u_ModelMatrix, leg3Matrix);
    drawCube(gl, n, u_ViewMatrix, viewMatrix, u_Perspective, u_ModelMatrix, leg4Matrix);
    drawCube(gl, n, u_ViewMatrix, viewMatrix, u_Perspective, u_ModelMatrix, tailMatrix);

    var groundMatrix = new Matrix4();
    groundMatrix.setTranslate(3, -3, -2);
    groundMatrix.scale(50, 10, 50);
    colorTexture = 3.0;
    gl.uniform1f(u_ColorTexture, colorTexture);
    drawCube(gl, n, u_ViewMatrix, viewMatrix, u_Perspective, u_ModelMatrix, groundMatrix);
  }

  function initVertexBuffers(gl) {
    var vertices = new Float32Array([
       0.2, 0.2, 0.2,  -0.2, 0.2, 0.2,  -0.2,-0.2, 0.2,   0.2,-0.2, 0.2,
       0.2, 0.2, 0.2,   0.2,-0.2, 0.2,   0.2,-0.2,-0.2,   0.2, 0.2,-0.2,
       0.2, 0.2, 0.2,   0.2, 0.2,-0.2,  -0.2, 0.2,-0.2,  -0.2, 0.2, 0.2,
      -0.2, 0.2, 0.2,  -0.2, 0.2,-0.2,  -0.2,-0.2,-0.2,  -0.2,-0.2, 0.2,
      -0.2,-0.2,-0.2,   0.2,-0.2,-0.2,   0.2,-0.2, 0.2,  -0.2,-0.2, 0.2,
       0.2,-0.2,-0.2,  -0.2,-0.2,-0.2,  -0.2, 0.2,-0.2,   0.2, 0.2,-0.2
    ]);

    var colors = new Float32Array([
      0.631, 0.369, 0.102,  0.631, 0.369, 0.102,  0.631, 0.369, 0.102,  0.631, 0.369, 0.102,
      0.878, 0.62, 0.357,  0.878, 0.62, 0.357,  0.878, 0.62, 0.357,  0.878, 0.62, 0.357,
      0.769, 0.49, 0.208,  0.769, 0.49, 0.208,  0.769, 0.49, 0.208,  0.769, 0.49, 0.208,
      0.631, 0.369, 0.102,  0.631, 0.369, 0.102,  0.631, 0.369, 0.102,  0.631, 0.369, 0.102,
      0.878, 0.62, 0.357,  0.878, 0.62, 0.357,  0.878, 0.62, 0.357,  0.878, 0.62, 0.357,
      0.631, 0.369, 0.102,  0.631, 0.369, 0.102,  0.631, 0.369, 0.102,  0.631, 0.369, 0.102
    ]);

    var verticesTexCoords = new Float32Array([
      1.0,  1.0,    0.0,  1.0,    0.0,  0.0,    1.0,  0.0,
      1.0,  1.0,    0.0,  1.0,    0.0,  0.0,    1.0,  0.0,
      1.0,  1.0,    0.0,  1.0,    0.0,  0.0,    1.0,  0.0,
      1.0,  1.0,    0.0,  1.0,    0.0,  0.0,    1.0,  0.0,
      1.0,  1.0,    0.0,  1.0,    0.0,  0.0,    1.0,  0.0,
      1.0,  1.0,    0.0,  1.0,    0.0,  0.0,    1.0,  0.0,
    ]);

    var indices = new Uint8Array([
       0, 1, 2,   0, 2, 3,
       4, 5, 6,   4, 6, 7,
       8, 9,10,   8,10,11,
      12,13,14,  12,14,15,
      16,17,18,  16,18,19,
      20,21,22,  20,22,23
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
    var texture = gl.createTexture();
    if (!texture) {
      console.log('Failed to create the texture object');
      return false;
    }

    var u_Sampler = gl.getUniformLocation(gl.program, 'u_Sampler');
    if (!u_Sampler) {
      console.log('Failed to get the storage location of u_Sampler');
      return false;
    }
    var image = new Image();
    if (!image) {
      console.log('Failed to create the image object');
      return false;
    }
    image.onload = function(){ loadTexture(gl, n, texture, u_Sampler, image, 0); };
    image.src = 'brick.png';

    var texture2 = gl.createTexture();
    if (!texture2) {
      console.log('Failed to create the texture object');
      return false;
    }

    var u_Sampler2 = gl.getUniformLocation(gl.program, 'u_Sampler2');
    if (!u_Sampler2) {
      console.log('Failed to get the storage location of u_Sampler2');
      return false;
    }
    var image2 = new Image();
    if (!image2) {
      console.log('Failed to create the image object');
      return false;
    }
    image2.onload = function(){ loadTexture(gl, n, texture2, u_Sampler2, image2, 1); };
    image2.src = 'giraffe.png';

    var texture3 = gl.createTexture();
    if (!texture3) {
      console.log('Failed to create the texture object');
      return false;
    }

    var u_Sampler3 = gl.getUniformLocation(gl.program, 'u_Sampler3');
    if (!u_Sampler3) {
      console.log('Failed to get the storage location of u_Sampler3');
      return false;
    }
    var image3 = new Image();
    if (!image3) {
      console.log('Failed to create the image object');
      return false;
    }
    image3.onload = function(){ loadTexture(gl, n, texture3, u_Sampler3, image3, 2); };
    image3.src = 'stone.jpg';
    return true;
  }

  function loadTexture(gl, n, texture, u_Sampler, image, textureUnit) {
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
    if (textureUnit == 0){
      gl.activeTexture(gl.TEXTURE0);
    }
    else if (textureUnit == 1){
      gl.activeTexture(gl.TEXTURE1);
    }
    else if (textureUnit == 2){
      gl.activeTexture(gl.TEXTURE2);
    }
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
    gl.uniform1i(u_Sampler, textureUnit);
  }
