/**
 * Summary.
 * A translation of the code we learned in Graphics class,
 * from OpenGL to WebGL for a mouse-driven rotating cube.
 * 
 * Description.
 * This script is an attempt at translating what we learned
 * in OpenGL to WebGL. This program creates a 3D colored cube that rotates on
 * mouse-click and mouse-drag. Because our original program was a gradient
 * colored cube, I opted out of coloring each face of the cube differently
 * on purpose to preserve the look of the original program.              
 * 
 * @file This file defines the MouseCube.js
 * @author Valerio Marcelli
 * @since 12.20.2018
 */

var main = function() {
    var CANVAS = document.getElementById("glcanvas"); //Get Canvas by ID
    CANVAS.width = window.innerWidth; //Set width
    CANVAS.height = window.innerHeight; //Set Height
    
    /*== Mouse Events ==*/
    var drag = false;
    var AMORTIZATION = 0.95;
    var oldX, oldY; //Placeholders for old X, Y axis
    var dX = 0, dY = 0;

    //If mouse click
    var MouseDown = function(event) {
        drag = true;
        oldX = event.pageX, oldY = event.pageY;
        event.preventDefault();
        return false;
    };

    //If mouse un-click
    var MouseUp = function(event) {
        drag = false;
    };

    //Mouse movement
    var MouseMove=function(event) {
        if (!drag) {return false};
        dX = (event.pageX-oldX)*2*Math.PI/CANVAS.width,
        dY = (event.pageY-oldY)*2*Math.PI/CANVAS.height;
        THETA += dX;
        PHI += dY;
        oldX=event.pageX, oldY=event.pageY;
        event.preventDefault();
    };

    //Add Event Listeners
    CANVAS.addEventListener("mousedown", MouseDown, false);
    CANVAS.addEventListener("mouseup", MouseUp, false);
    CANVAS.addEventListener("mouseout", MouseUp, false);
    CANVAS.addEventListener("mousemove", MouseMove, false);

    /*== WEBGL CONTEXT == */
    var GL;
    try {
        GL = CANVAS.getContext("experimental-webgl", {antialias: true});
    } catch (event) {
        alert("You are not webgl compatible :(") ;
        return false;
    }

    /*== Shaders ==*/
    var vertexShader="                                  \n\
        attribute vec3 position;                        \n\
        uniform mat4 Pmatrix;                           \n\
        uniform mat4 Vmatrix;                           \n\
        uniform mat4 Mmatrix;                           \n\
        attribute vec3 color; //the color of the point  \n\
        varying vec3 vColor;                            \n\
        void main(void) { //pre-built function          \n\
            gl_Position = Pmatrix*Vmatrix*Mmatrix*vec4(position, 1.);   \n\
            vColor=color;                               \n\
        }";

    var fragmentShader="                        \n\
        precision mediump float;                \n\
        varying vec3 vColor;                    \n\
        void main(void) {                       \n\
            gl_FragColor = vec4(vColor, 1.);    \n\
        }";

    var getShader = function(source, type, typeString) {
        var shader = GL.createShader(type);
        GL.shaderSource(shader, source);
        GL.compileShader(shader);
        if (!GL.getShaderParameter(shader, GL.COMPILE_STATUS)) {
            alert("ERROR IN "+typeString+ " SHADER : " + GL.getShaderInfoLog(shader));
            return false;
        }
        return shader;
    };

    //Get Shaders
    var shaderVertex = getShader(vertexShader, GL.VERTEX_SHADER, "VERTEX");
    var shaderFragment=getShader(fragmentShader, GL.FRAGMENT_SHADER, "FRAGMENT");

    //Attach shaders to GL context
    var SHADER_PROGRAM = GL.createProgram();
    GL.attachShader(SHADER_PROGRAM, shaderVertex);
    GL.attachShader(SHADER_PROGRAM, shaderFragment);

    GL.linkProgram(SHADER_PROGRAM);

    var projMatrix = GL.getUniformLocation(SHADER_PROGRAM, "Pmatrix");
    var viewMatrix = GL.getUniformLocation(SHADER_PROGRAM, "Vmatrix");
    var moveMatrix = GL.getUniformLocation(SHADER_PROGRAM, "Mmatrix");

    var shadeColor = GL.getAttribLocation(SHADER_PROGRAM, "color");
    var shadePos = GL.getAttribLocation(SHADER_PROGRAM, "position");

    GL.enableVertexAttribArray(shadeColor);
    GL.enableVertexAttribArray(shadePos);

    GL.useProgram(SHADER_PROGRAM);

    /* ==The Cube == */
    //left, right, bottom, top, near, far
    const l = -1, r = 1, b = -1, t = 1, n = -1, f = 1; 
    //Array of each cube face,
    //Each face is split into two triangles
    var cubeFaces = [
        0,1,2,
        0,2,3, 
    
        4,5,6,
        4,6,7,
    
        0,3,7,
        0,4,7,
    
        1,2,6,
        1,5,6,
    
        2,3,6,
        3,7,6,
    
        0,1,5,
        0,4,5      
    ];

    //This array contains the vertices for each
    //point on the cube. On the left are the
    //points and on the right is the color for each
    //corresponding color
    var cubeVertex=[
        l,b,n, 0,0,0,
        r,b,n, 1,0,0,
        r,t,n, 1,1,0,
        l,t,n, 0,1,0,
        l,b,f, 0,0,1,
        r,b,f, 1,0,1,
        r,t,f, 1,1,1,
        l,t,f, 0,1,1
    ];

    var CUBE_VERTEX= GL.createBuffer ();
    GL.bindBuffer(GL.ARRAY_BUFFER, CUBE_VERTEX);
    GL.bufferData(GL.ARRAY_BUFFER,
        new Float32Array(cubeVertex),
        GL.STATIC_DRAW);
      
    var CUBE_FACES= GL.createBuffer ();
    GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, CUBE_FACES);
    GL.bufferData(GL.ELEMENT_ARRAY_BUFFER,
        new Uint16Array(cubeFaces),
        GL.STATIC_DRAW);

    /*== MATRIX == */
  
    var PROJMATRIX=LIBS.get_projection(40, CANVAS.width/CANVAS.height, 1, 100);
    var MOVEMATRIX=LIBS.get_I4();
    var VIEWMATRIX=LIBS.get_I4();
    
    LIBS.translateZ(VIEWMATRIX, -6);
    var THETA=0,
        PHI=0;
    
    /*== DRAWING == */
    GL.enable(GL.DEPTH_TEST);
    GL.depthFunc(GL.LEQUAL);
    GL.clearColor(0.5, 0.5, 0.5, 0.0); //Sets background to Gray
    GL.clearDepth(1.0);
    
    var time_old=0;
    var animate=function(time) {
        var dt=time-time_old;
        if (!drag) {
            dX*=AMORTIZATION, dY*=AMORTIZATION;
            THETA+=dX, PHI+=dY;
        }
        LIBS.set_I4(MOVEMATRIX);
        LIBS.rotateY(MOVEMATRIX, THETA);
        LIBS.rotateX(MOVEMATRIX, PHI);     
        time_old=time;
        
        //Viewport
        GL.viewport(0.0, 0.0, CANVAS.width, CANVAS.height);
        GL.clear(GL.COLOR_BUFFER_BIT | GL.DEPTH_BUFFER_BIT);
        
        GL.uniformMatrix4fv(projMatrix, false, PROJMATRIX);
        GL.uniformMatrix4fv(viewMatrix, false, VIEWMATRIX);
        GL.uniformMatrix4fv(moveMatrix, false, MOVEMATRIX);
        
        GL.bindBuffer(GL.ARRAY_BUFFER, CUBE_VERTEX);    
        GL.vertexAttribPointer(shadePos, 3, GL.FLOAT, false,4*(3+3),0) ;
        GL.vertexAttribPointer(shadeColor, 3, GL.FLOAT, false,4*(3+3),3*4) ;
        
        GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, CUBE_FACES);
        GL.drawElements(GL.TRIANGLES, 6*2*3, GL.UNSIGNED_SHORT, 0);
        
        GL.flush();
        
        window.requestAnimationFrame(animate);
  };
  animate(0);
}


