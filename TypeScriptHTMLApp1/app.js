﻿var ctx;
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
var drawFloors = true;
var drawCeilings = false;
var Wall = (function () {
    function Wall() {
        this.s = null;
        this.textureName = "";
        this.portal = null;
        this.isPortal = false;
        this.left = null;
        this.right = null;
    }
    return Wall;
})();
var walls = new Array();
function getWallsUsingPoint(p) {
    var ret = new Array();
    for (var i = 0; i < walls.length; i++) {
        if (walls[i].a.dist(p) < .1 || walls[i].b.dist(p) < .1)
            ret.push(walls[i]);
    }
    return ret;
}
var Sector = (function () {
    function Sector() {
    }
    Sector.prototype.triangulate = function () {
        var sctx = new poly2tri.SweepContext(this.pts, { cloneArrays: true });
        for (var i = 0; i < sectors.length; i++) {
            if (sectors[i] == this)
                continue;
            if (pointInPolygon(sectors[i].p, this.pts))
                sctx.addHole(sectors[i].pts);
        }
        poly2tri.triangulate(sctx);
        this.tris = sctx.getTriangles();
    };
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
    if (e.keyCode == 'F'.charCodeAt(0))
        drawFloors = !drawFloors;
    if (e.keyCode == 'C'.charCodeAt(0))
        drawCeilings = !drawCeilings;
};
var currentWall = null;
var snapPosition = null;
var camera = new vec2(0, 0);
function saveSectorSettings(i) {
    var s = sectors[i];
    sectors[i].ceilingColor = (document.getElementById("cc")).value;
    sectors[i].floorColor = (document.getElementById("fc")).value;
}
function moncontextmenu(e) {
    var p;
    if (snapPosition != null)
        p = snapPosition; else
        p = new vec2(e.offsetX - camera.x, e.offsetY - camera.y);
    e.preventDefault();
    for (var i = 0; i < sectors.length; i++) {
        if (p.dist(sectors[i].p) < 15) {
            var str = "";
            var s = sectors[i];
            str += 'ceiling color: <input type="text" id="cc" value="' + s.ceilingColor + '"><br>';
            str += 'floor color: <input type="text" id="fc" value="' + s.floorColor + '"><br>';
            str += '<input type="button" value="Save" onclick="saveSectorSettings(' + i + ')">';
            document.getElementById("props").innerHTML = str;
            return;
        }
    }
    if (currentWall != null) {
        currentWall.b = copyvec2(p);
        currentWall = null;
        if (snapPosition == null) {
            currentWall = new Wall();
            currentWall.a = copyvec2(p);
            currentWall.b = copyvec2(p);
            walls.push(currentWall);
        }
    } else {
        currentWall = new Wall();
        currentWall.a = copyvec2(p);
        currentWall.b = copyvec2(p);
        walls.push(currentWall);
    }
}
var mousedown = false;
var selectedPoints = new Array();
var lastMousePos = null;
function monmousemove(e) {
    var p = new vec2(e.offsetX - camera.x, e.offsetY - camera.y);
    if (currentWall != null) {
        currentWall.b.x = p.x;
        currentWall.b.y = p.y;
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
    if (lastMousePos) {
        var d = new vec2(p.x - lastMousePos.x, p.y - lastMousePos.y);
        if (selectedPoints.length > 0) {
            for (var i = 0; i < selectedPoints.length; i++) {
                selectedPoints[i].x += d.x;
                selectedPoints[i].y += d.y;
            }
        } else if (mousedown == true) {
            camera.x += d.x;
            camera.y += d.y;
        }
    }
    lastMousePos = p;
    e.preventDefault();
}
function otherWallWithPoint(wall, p) {
    for (var i = 0; i < walls.length; i++) {
        if (walls[i] == wall)
            continue;
        if (walls[i].s != null)
            continue;
        if (walls[i].a.dist(p) < .1 || walls[i].b.dist(p) < .1)
            return walls[i];
    }
    return null;
}
function monmousedown(e) {
    mousedown = true;
    e.preventDefault();
    var p;
    if (snapPosition != null)
        p = snapPosition; else
        p = new vec2(e.offsetX - camera.x, e.offsetY - camera.y);
    if (snapPosition != null) {
        var w = getWallsUsingPoint(snapPosition);
        var i = 0;
        for (; i < w.length; i++) {
            if (w[i].a.dist(snapPosition) < .1)
                selectedPoints.push(w[i].a);
            if (w[i].b.dist(snapPosition) < .1)
                selectedPoints.push(w[i].b);
        }
    }
    if (e.ctrlKey) {
        for (var i = 0; i < sectors.length; i++) {
            if (p.dist(sectors[i].p) < 15) {
                sectors[i].triangulate();
                return;
            }
        }
        var wall;
        var w = new Array();
        var pts = new Array();
        for (var i = 0; i < walls.length; i++) {
            var d = distToSegmentSquared(p, walls[i].a, walls[i].b);
            if (d < 15 * 15) {
                wall = walls[i];
                break;
            }
        }
        if (wall == null) {
            alert("No nearby wall");
            return;
        }
        w.push(wall);
        var lastWall = wall;
        var pt = wall.b;
        pts.push(pt);
        while (true) {
            var wa = otherWallWithPoint(lastWall, pt);
            if (wa == null) {
                alert("no closed loop!");
                break;
            }
            if (wa == wall)
                break;
            if (w.indexOf(wa) != -1) {
                alert("stuck in a loop!");
                return;
            }
            if (wa.a.dist(pt) < .1)
                pt = wa.b; else
                pt = wa.a;
            w.push(wa);
            pts.push(pt);
            lastWall = wa;
        }
        var s = new Sector();
        s.pts = pts;
        s.walls = w;
        s.triangulate();
        s.p = p;
        s.floorColor = "#AAAAAA";
        s.ceilingColor = "#555555";
        for (var i = 0; i < w.length; i++)
            w[i].s = s;
        sectors.push(s);
    }
    if (e.altKey) {
        for (var i = 0; i < walls.length; i++) {
            var d = distToSegmentSquared(p, walls[i].a, walls[i].b);
            if (walls[i].s == null) {
                alert("please make a sector first");
                break;
            }
            if (walls[i].isPortal == null) {
                alert("already a portal");
                break;
            }
            if (d < 15 * 15) {
                walls[i].isPortal = true;
                var wall = new Wall();
                wall.a = walls[i].a;
                wall.b = walls[i].b;
                wall.isPortal = true;
                walls.push(wall);
                break;
            }
        }
    }
}
function monmouseup(e) {
    mousedown = false;
    selectedPoints.splice(0, selectedPoints.length);
    e.preventDefault();
}
window.onload = function () {
    var el = document.getElementById('content');
    var canvas = document.getElementById('canvas');
    canvas.onmousemove = monmousemove;
    canvas.oncontextmenu = moncontextmenu;
    canvas.onmousedown = monmousedown;
    canvas.onmouseup = monmouseup;
    ctx = canvas.getContext("2d");
    setInterval(update, 17);
};
function update() {
    drawRect(new vec2(0, 0), new vec2(1024, 768), "#FFFFFF");
    for (var y = 0; y < 768; y += 32)
        for (var x = 0; x < 1024; x += 32) {
            drawRect(new vec2(x, y), new vec2(x + 1, y + 1), "#333333");
        }
    for (var i = 0; i < sectors.length; i++) {
        var color;
        if (drawCeilings)
            color = sectors[i].ceilingColor; else if (drawFloors)
            color = sectors[i].floorColor;
        (ctx).setLineDash([1, 9]);
        for (var j = 0; j < sectors[i].tris.length; j++) {
            ctx.beginPath();
            ctx.moveTo(sectors[i].tris[j].points_[0].x + camera.x, sectors[i].tris[j].points_[0].y + camera.y);
            ctx.lineTo(sectors[i].tris[j].points_[1].x + camera.x, sectors[i].tris[j].points_[1].y + camera.y);
            ctx.lineTo(sectors[i].tris[j].points_[2].x + camera.x, sectors[i].tris[j].points_[2].y + camera.y);
            ctx.closePath();
            if (color)
                ctx.fillStyle = color;
            ctx.fill();
            ctx.fillStyle = "#777777";
            ctx.stroke();
        }
        (ctx).setLineDash([1, 0]);
        drawText(new vec2(sectors[i].p.x + camera.x, sectors[i].p.y + camera.y), "S");
    }
    for (var i = 0; i < walls.length; i++) {
        var wall = walls[i];
        if (wall.isPortal == true && wall.s == null)
            continue;
        drawLine(new vec2(wall.a.x + camera.x, wall.a.y + camera.y), new vec2(wall.b.x + camera.x, wall.b.y + camera.y), "#000000", wall.isPortal);
    }
    if (snapPosition)
        drawRect(new vec2(snapPosition.x + camera.x - 5, snapPosition.y + camera.y - 5), new vec2(snapPosition.x + camera.x + 5, snapPosition.y + camera.y + 5), "#333333", true);
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
    if (dotted == true)
        (ctx).setLineDash([5]);
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.fillStyle = color;
    ctx.closePath();
    ctx.stroke();
    if (dotted == true)
        (ctx).setLineDash([1, 0]);
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
function lineLine(a, b, c, d) {
    var r = ((a.y - c.y) * (d.x - c.x) - (a.x - c.x) * (d.y - c.y)) / ((b.x - a.x) * (d.y - c.y) - (b.y - a.y) * (d.x - c.x));
    var s = ((a.y - c.y) * (b.x - a.x) - (a.x - c.x) * (b.y - a.y)) / ((b.x - a.x) * (d.y - c.y) - (b.y - a.y) * (d.x - c.x));
    if (r >= 0 && r <= 1 && s >= 0 && s <= 1)
        return true; else
        return false;
}

function PolygonIsConvex(Points) {
    // For each set of three adjacent points A, B, C,
    // find the dot product AB � BC. If the sign of
    // all the dot products is the same, the angles
    // are all positive or negative (depending on the
    // order in which we visit them) so the polygon
    // is convex.
    var got_negative = false;
    var got_positive = false;
    var num_points = Points.length;
    var B, C;
    for (var A = 0; A < num_points; A++) {
        B = (A + 1) % num_points;
        C = (B + 1) % num_points;

        var cross_product = (Points[A].x - Points[B].x) * (Points[C].x - Points[B].x) + (Points[A].y - Points[B].y) * (Points[C].y - Points[B].y);
        if (cross_product < 0) {
            got_negative = true;
        } else if (cross_product > 0) {
            got_positive = true;
        }
        if (got_negative && got_positive)
            return false;
    }

    // If we got this far, the polygon is convex.
    return true;
}
function sqr(x) {
    return x * x;
}
function dist2(v, w) {
    return sqr(v.x - w.x) + sqr(v.y - w.y);
}
function distToSegmentSquared(p, v, w) {
    var l2 = dist2(v, w);
    if (l2 == 0)
        return dist2(p, v);
    var t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
    if (t < 0)
        return dist2(p, v);
    if (t > 1)
        return dist2(p, w);
    return dist2(p, {
        x: v.x + t * (w.x - v.x),
        y: v.y + t * (w.y - v.y)
    });
}
function distToSegment(p, v, w) {
    return Math.sqrt(distToSegmentSquared(p, v, w));
}
function pointInPolygon(p, pts) {
    var i, j = pts.length - 1;
    var oddNodes = false;

    for (i = 0; i < pts.length; i++) {
        if (pts[i].y < p.y && pts[j].y >= p.y || pts[j].y < p.y && pts[i].y >= p.y) {
            if (pts[i].x + (p.y - pts[i].y) / (pts[j].y - pts[i].y) * (pts[j].x - pts[i].x) < p.x) {
                oddNodes = !oddNodes;
            }
        }
        j = i;
    }

    return oddNodes;
}
//@ sourceMappingURL=app.js.map
