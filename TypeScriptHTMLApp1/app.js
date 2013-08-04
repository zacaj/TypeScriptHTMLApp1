var ctx;
var vec2 = (function () {
    function vec2(x, y) {
        this.x = x;
        this.y = y;
    }
    return vec2;
})();
var snap = false;
var Greeter = (function () {
    function Greeter(element) {
        this.element = element;
        this.element.innerHTML += "The time is: ";
        this.span = document.createElement('span');
        this.element.appendChild(this.span);
        this.span.innerText = new Date().toUTCString();
    }
    Greeter.prototype.start = function () {
        var _this = this;
        this.timerToken = setInterval(function () {
            return _this.span.innerHTML = new Date().toUTCString();
        }, 500);
    };

    Greeter.prototype.stop = function () {
        clearTimeout(this.timerToken);
    };
    return Greeter;
})();
window.onkeydown = function (e) {
    if (e.keyCode == 'S'.charCodeAt(0))
        snap = !snap;
};
window.onload = function () {
    var el = document.getElementById('content');
    var canvas = document.getElementById('canvas');
    ctx = canvas.getContext("2d");
    setInterval(update, 17);
};
function update() {
    drawRect(new vec2(0, 0), new vec2(1024, 768), "#FFFFFF");
    drawText(new vec2(0, 750), "Snap: " + (snap ? "on" : "off"));
}
function drawRect(a, b, color, outline) {
    if (typeof color === "undefined") { color = "#000000"; }
    if (typeof outline === "undefined") { outline = false; }
    ctx.fillStyle = color;
    if (outline)
        ctx.strokeRect(a.x, a.y, b.x - a.x, b.y - a.y); else
        ctx.fillRect(a.x, a.y, b.x - a.x, b.y - a.y);
}
function drawLine(a, b, color, dotted) {
    if (typeof color === "undefined") { color = "#000000"; }
    if (typeof dotted === "undefined") { dotted = false; }
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.fillStyle = color;
    ctx.stroke();
}
function drawImage(p, image) {
    ctx.drawImage(image, p.x, p.y);
}
function drawText(p, str, color) {
    if (typeof color === "undefined") { color = "#000000"; }
    ctx.fillStyle = color;
    ctx.font = "16px Arial";
    ctx.fillText(str, p.x, p.y);
}
//@ sourceMappingURL=app.js.map
