var ctx;
var vec2 = (function () {
    function vec2(x, y) {
        this.x = x;
        this.y = y;
    }
    vec2.prototype.dist = function (p) {
        var d = new vec2(p.x - this.x, p.y - this.y);
        return Math.sqrt(d.x * d.x + d.y * d.y);
    };
    return vec2;
})();
function copyvec2(p) {
    return new vec2(p.x, p.y);
}
var snap = true;
var Wall = (function () {
    function Wall() {
        this.s = null;
        this.textureName = "";
        this.portal = null;
        this.left = null;
        this.right = null;
    }
    return Wall;
})();
var walls = new Array();
var Sector = (function () {
    function Sector() {
    }
    return Sector;
})();
var sectors = new Array();
window.onkeydown = function (e) {
    if (e.keyCode == 'S'.charCodeAt(0))
        snap = !snap;
    if (e.keyCode == 27) {
        if (currentWall != null) {
            walls.splice(walls.indexOf(currentWall));
            currentWall = null;
        }
    }
};
var currentWall = null;
var snapPosition = null;
window.oncontextmenu = function (e) {
    var p;
    if (snapPosition != null)
        p = snapPosition; else
        p = new vec2(e.offsetX, e.offsetY);
    e.preventDefault();
    if (currentWall != null) {
        currentWall.b = copyvec2(p);
        currentWall = null;
    }
    if (snapPosition != null) {
    } else {
        currentWall = new Wall();
        currentWall.a = copyvec2(p);
        currentWall.b = copyvec2(p);
        walls.push(currentWall);
    }
};
window.onmousemove = function (e) {
    var p = new vec2(e.offsetX, e.offsetY);
    if (currentWall != null) {
        currentWall.b.x = e.offsetX;
        currentWall.b.y = e.offsetY;
    }
    snapPosition = null;
    if (snap)
        for (var i = 0; i < walls.length; i++) {
            if (walls[i] == currentWall)
                continue;
            if (walls[i].a.dist(p) < 5) {
                snapPosition = copyvec2(walls[i].a);
                break;
            }
            if (walls[i].b.dist(p) < 5) {
                snapPosition = copyvec2(walls[i].b);
                break;
            }
        }
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
    for (var i = 0; i < walls.length; i++) {
        var wall = walls[i];
        drawLine(wall.a, wall.b);
    }
    if (snapPosition)
        drawRect(new vec2(snapPosition.x - 5, snapPosition.y - 5), new vec2(snapPosition.x + 5, snapPosition.y + 5), "#333333", true);
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
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.fillStyle = color;
    ctx.closePath();
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
