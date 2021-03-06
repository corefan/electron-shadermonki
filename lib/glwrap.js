'use strict';

var glw = glw || {};

// const
glw.VERSION = '0.1';
glw.PI2  = 6.28318530717958647692528676655900576;
glw.PI   = 3.14159265358979323846264338327950288;
glw.PIH  = 1.57079632679489661923132169163975144;
glw.PIH2 = 0.78539816339744830961566084581987572;

glw.VERTEX_LAYOUT_P = 0;
glw.VERTEX_LAYOUT_N = 1;
glw.VERTEX_LAYOUT_T0 = 2;
glw.VERTEX_LAYOUT_T1 = 3;
glw.VERTEX_LAYOUT_C = 4;

// global member
glw.ready = false;
glw.canvas = null;
glw.gl = null;
glw.curr_program = null;

// public interface

// initialize webgl
glw.initGL = function(canvasId, options){
    this.ready = false;
    this.canvas = null;
    this.gl = null;

    if(Object.prototype.toString.call(canvasId) === '[object String]'){
        this.canvas = document.getElementById(canvasId);
    }else{
        if(Object.prototype.toString.call(canvasId) === '[object HTMLCanvasElement]'){
            this.canvas = canvasId;
        }
    }

    var opt = options || {};
    if(this.canvas == null){return false;}
    this.gl = this.canvas.getContext('webgl', opt)
           || this.canvas.getContext('experimental-webgl', opt);

    if(this.gl != null){
        this.ready = true;
    }

    return this.ready;
};

// glclear
glw.clear = function(color, depth, stencil){
    var gl = this.gl;
    var flg = gl.COLOR_BUFFER_BIT;
    gl.clearColor(color[0], color[1], color[2], color[3]);
    if(depth != null){
        gl.clearDepth(depth);
        flg = flg | gl.DEPTH_BUFFER_BIT;
    }
    if(stencil != null){
        gl.clearStencil(stencil);
        flg = flg | gl.STENCIL_BUFFER_BIT;
    }
    gl.clear(flg);
};

// glviewport
glw.viewport = function(x, y, width, height){
    var X = x || 0;
    var Y = y || 0;
    var w = width  || window.innerWidth;
    var h = height || window.innerHeight;
    this.gl.viewport(X, Y, w, h);
};

glw.set_uniform1f = function(name, fvalue)
{
    if(this.curr_program != null) {
        var loc = this.gl.getUniformLocation(this.curr_program, name);
        if (loc != -1) {
            this.gl.uniform1f(loc, fvalue);
        }
    }
};

glw.set_uniform4f = function (name, fvalue)
{
    if(this.curr_program != null)
    {
        var loc = this.gl.getUniformLocation(this.curr_program, name);
        if (loc != -1) {
            this.gl.uniform4f(loc, fvalue[0], fvalue[1], fvalue[2], fvalue[3]);
        }
    }
}

glw.set_uniform4x4fv = function(name, fvalue)
{
    if(this.curr_program != null) {
        var loc = this.gl.getUniformLocation(this.curr_program, name);
        if (loc != -1) {
            this.gl.uniformMatrix4fv(loc, false, fvalue);
        }
    }
};


/// mesh obj
glw.meshObject = function(webglContext){
    this.gl = webglContext;
};

// construct
glw.createMeshObject = function ( vertexStream, indexStream, vertexLayout ) {

    var newObj = new glw.meshObject(this.gl);
    newObj.vbo = glw._create_vbo(vertexStream);
    newObj.ibo = glw._create_ibo(indexStream);

    var size = 0;
    if(vertexLayout.indexOf(glw.VERTEX_LAYOUT_P) !== -1 )
    {
        size += 3 * 4;
    }

    if(vertexLayout.indexOf(glw.VERTEX_LAYOUT_N) !== -1 )
    {
        size += 3 * 4;
    }

    if(vertexLayout.indexOf(glw.VERTEX_LAYOUT_T0) !== -1 )
    {
        size += 2 * 4;
    }
    newObj.vertexSize = size;

    newObj.vertexLayout = vertexLayout;
    newObj.indexSize = indexStream.length;
    return newObj;
};

glw.meshObject.prototype.gl = null;
glw.meshObject.prototype.vbo = null;
glw.meshObject.prototype.ibo = null;
glw.meshObject.prototype.vertexSize = null;
glw.meshObject.prototype.vertexLayout = null;
glw.meshObject.prototype.indexSize = null;

glw.meshObject.prototype.bind = function() {
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vbo);

    var offset = 0;

    if(this.vertexLayout.indexOf(glw.VERTEX_LAYOUT_P) !== -1 )
    {
        var location = this.gl.getAttribLocation(glw.curr_program, "position");
        this.gl.enableVertexAttribArray(location);
        this.gl.vertexAttribPointer(location,3,this.gl.FLOAT,false,this.vertexSize,offset);
        offset += 3 * 4;
    }

    if(this.vertexLayout.indexOf(glw.VERTEX_LAYOUT_N) !== -1 )
    {
        var location = this.gl.getAttribLocation(glw.curr_program, "normal");
        if(location !== -1) {
            this.gl.enableVertexAttribArray(location);
            this.gl.vertexAttribPointer(location, 3, this.gl.FLOAT, false, this.vertexSize, offset);
        }
        offset += 3 * 4;
    }

    if(this.vertexLayout.indexOf(glw.VERTEX_LAYOUT_T0) !== -1 )
    {
        var location = this.gl.getAttribLocation(glw.curr_program, "texcoord");
        if(location !== -1) {
            this.gl.enableVertexAttribArray(location);
            this.gl.vertexAttribPointer(location,2,this.gl.FLOAT,false,this.vertexSize,offset);
        }

        offset += 2 * 4;
    }

    if(this.ibo != null){this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.ibo);}
}

glw.meshObject.prototype.draw = function () {
    glw._draw_elements(this.gl.TRIANGLES, this.indexSize);
}
// mesh obj



/// program obj
glw.createProgramObject = function (vsSource, psSource) {

    var newObj = new glw.programObject(this.gl);
    newObj.glprogram = newObj.create(vsSource, psSource);

    // analyze uniforms from vs & fs source
    newObj.loc[0] = this.gl.getAttribLocation(newObj.glprogram, "position");
    newObj.loc[1] = this.gl.getAttribLocation(newObj.glprogram, "normal");
    newObj.loc[2] = this.gl.getAttribLocation(newObj.glprogram, "texcoord");


    return newObj;
};

glw.programObject = function(webglContext){
    this.gl = webglContext;
};

glw.programObject.prototype.gl   = null;
glw.programObject.prototype.glprogram   = null;
glw.programObject.prototype.loc = {};

glw.programObject.prototype.create = function (vsSource, fsSource) {
    var prg = null;
    var vs = glw._create_shader_from_source(vsSource, this.gl.VERTEX_SHADER);
    var fs = glw._create_shader_from_source(fsSource, this.gl.FRAGMENT_SHADER);
    prg = glw._create_program(vs, fs);

    return prg;
};

glw.programObject.prototype.set_uniform = function( uniform_name, uniform_value ) {

};

glw.programObject.prototype.use = function()
{
    glw._use_program( this.glprogram );
};
// program obj






/// internal interface

// create shader
glw._create_shader_from_source = function(source, type){
    var shader, msg;
    switch(type){
        case this.gl.VERTEX_SHADER:
            shader = this.gl.createShader(this.gl.VERTEX_SHADER);
            break;
        case this.gl.FRAGMENT_SHADER:
            shader = this.gl.createShader(this.gl.FRAGMENT_SHADER);
            break;
        default :
            return;
    }
    this.gl.shaderSource(shader, source);
    this.gl.compileShader(shader);
    if(this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)){
        return shader;
    }else{
        msg = this.gl.getShaderInfoLog(shader);

        // directly print to console

        //alert(msg);
        console.warn('compile failed of shader: ' + msg);
    }
};

// create program
glw._create_program = function(vs, fs){
    var program = this.gl.createProgram();
    this.gl.attachShader(program, vs);
    this.gl.attachShader(program, fs);
    this.gl.linkProgram(program);
    if(this.gl.getProgramParameter(program, this.gl.LINK_STATUS)){
        this.gl.useProgram(program);
        return program;
    }else{
        console.warn('link program failed: ' + this.gl.getProgramInfoLog(program));
        return null;
    }
};

// use program
glw._use_program = function(prg){
    this.gl.useProgram(prg);
    this.curr_program = prg;
};


// gen & bind vbo data
// TODO: managed later
glw._create_vbo = function(data){
    if(data == null){return;}
    var vbo = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, vbo);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(data), this.gl.STATIC_DRAW);
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null);
    return vbo;
};

// gen & bind ibo data
// TODO: managed later
glw._create_ibo = function(data){
    if(data == null){return;}
    var ibo = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, ibo);
    this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, new Int16Array(data), this.gl.STATIC_DRAW);
    this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, null);
    return ibo;
}

// dp
glw._draw_arrays = function(primitive, vertexCount){
    this.gl.drawArrays(primitive, 0, vertexCount);
};

// dip
glw._draw_elements = function(primitive, indexLength){
    this.gl.drawElements(primitive, indexLength, this.gl.UNSIGNED_SHORT, 0);
};
