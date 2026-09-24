var VSHADER_SOURCE =
    '#version 300 es\n' +
    'in vec2 a_Position;\n' +
    'uniform float u_PointSize;\n' +
    'void main() {\n' +
    '    gl_Position = vec4(a_Position, 0.0, 1.0);\n' +
    '    gl_PointSize = u_PointSize;\n' +
    '}\n';

var FSHADER_SOURCE =
    '#version 300 es\n' +
    'precision mediump float;\n' +
    'uniform vec4 u_Color;\n' +
    'out vec4 outColor;\n' +
    'void main() {\n' +
    '    outColor = u_Color;\n' +
    '}\n';

function main() {
    var canvas = document.getElementById('webgl-myname');
    var gl = canvas.getContext('webgl2');

    if (!gl) {
        alert("WebGL2 isn't available");
        return;
    }

    var program = createProgram(gl, VSHADER_SOURCE, FSHADER_SOURCE);

    if (!program) {
        return;
    }

    gl.useProgram(program);

    var a_Position = gl.getAttribLocation(program, 'a_Position');
    var u_PointSize = gl.getUniformLocation(program, 'u_PointSize');
    var u_Color = gl.getUniformLocation(program, 'u_Color');
    var vertexBuffer = gl.createBuffer();
    var startPoint = null;
    var endPoint = null;
    var isFixed = false;
    var pointCountInput = document.getElementById('pointCount');
    var pointColorInput = document.getElementById('pointColor');

    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Position);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.uniform1f(u_PointSize, 8.0);

    function getCanvasPoint(event) {
        var rect = canvas.getBoundingClientRect();
        var x = (event.clientX - rect.left) * canvas.width / rect.width;
        var y = (event.clientY - rect.top) * canvas.height / rect.height;

        return [
            x / canvas.width * 2.0 - 1.0,
            1.0 - y / canvas.height * 2.0
        ];
    }

    function getPointCount() {
        var count = parseInt(pointCountInput.value, 10);

        if (isNaN(count) || count < 2) {
            count = 2;
            pointCountInput.value = count;
        }

        return Math.min(count, 1000);
    }

    function getColor() {
        var color = pointColorInput.value;

        return [
            parseInt(color.substring(1, 3), 16) / 255.0,
            parseInt(color.substring(3, 5), 16) / 255.0,
            parseInt(color.substring(5, 7), 16) / 255.0,
            1.0
        ];
    }

    function updateCoordinateText() {
        document.getElementById('startPoint').textContent = formatPoint(startPoint);
        document.getElementById('endPoint').textContent = formatPoint(endPoint);
    }

    function formatPoint(point) {
        if (!point) {
            return '未设置';
        }

        return '(' + point[0].toFixed(3) + ', ' + point[1].toFixed(3) + ')';
    }

    function drawLine() {
        gl.clear(gl.COLOR_BUFFER_BIT);

        if (!startPoint || !endPoint) {
            return;
        }

        var count = getPointCount();
        var points = [];

        for (var i = 0; i < count; i++) {
            var t = i / (count - 1);
            var x = startPoint[0] + t * (endPoint[0] - startPoint[0]);
            var y = startPoint[1] + t * (endPoint[1] - startPoint[1]);

            points.push(x);
            points.push(y);
        }

        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(points), gl.DYNAMIC_DRAW);
        gl.uniform4fv(u_Color, getColor());
        gl.drawArrays(gl.POINTS, 0, count);
    }

    canvas.addEventListener('mousedown', function(event) {
        var point = getCanvasPoint(event);

        if (isFixed) {
            startPoint = point;
            endPoint = null;
            isFixed = false;
        } else if (!startPoint) {
            startPoint = point;
            endPoint = null;
        } else {
            endPoint = point;
            isFixed = true;
        }

        updateCoordinateText();
        drawLine();
    });

    canvas.addEventListener('mousemove', function(event) {
        if (startPoint && !isFixed) {
            endPoint = getCanvasPoint(event);
            updateCoordinateText();
            drawLine();
        }
    });

    pointCountInput.addEventListener('input', drawLine);
    pointColorInput.addEventListener('input', drawLine);
    updateCoordinateText();
    drawLine();
}

function createProgram(gl, vshader, fshader) {
    var vertexShader = loadShader(gl, gl.VERTEX_SHADER, vshader);
    var fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fshader);

    if (!vertexShader || !fragmentShader) {
        return null;
    }

    var program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.log(gl.getProgramInfoLog(program));
        return null;
    }

    return program;
}

function loadShader(gl, type, source) {
    var shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.log(gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }

    return shader;
}
