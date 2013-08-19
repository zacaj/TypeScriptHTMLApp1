var Triangle = (function () {
    function Triangle() {
    }
    return Triangle;
})();

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
var drawFloors = true;
var drawCeilings = false;
var Wall = (function () {
    function Wall() {
        this.s = null;
        this.textureName = "LB_Wall01.png";
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
        this.p = new vec2(0, 0);
        var usedWalls = new Array();
        usedWalls = usedWalls.concat(this.walls);
        var pts = new Array();
        for (var i = 0; i < this.pts.length; i++)
            pts.push(copyvec2(this.pts[i]));
        var sctx = new poly2tri.SweepContext(pts, { cloneArrays: true });

        if (this.holes)
            for (var i = 0; i < this.holes.length; i++) {
                sctx.addHole(this.holes[i]);
            }

        poly2tri.triangulate(sctx);
        this.tris = sctx.getTriangles();
        for (var i = 0; i < this.walls.length; i++) {
            this.walls[i].s = this;
            if (this.walls[i].isPortal) {
                for (var j = 0; j < walls.length; j++) {
                    if (walls[j] == this.walls[i])
                        continue;
                    if (walls[j].a.dist(this.walls[i].a) < .1 && walls[j].b.dist(this.walls[i].b) < .1) {
                        this.walls[i].portal = walls[j].s;
                        walls[j].portal = this;
                        break;
                    }
                }
            }
        }
        for (var i = 0; i < this.pts.length; i++)
            this.p = new vec2(this.p.x + this.pts[i].x, this.p.y + this.pts[i].y);
        this.p.x /= this.pts.length;
        this.p.y /= this.pts.length;
    };
    return Sector;
})();
var sectors = new Array();
var Entity = (function () {
    function Entity() {
        this.str = "";
    }
    return Entity;
})();
var ch = null, cv = null;
var nextSector = null;
function makeSector() {
    var s = new Sector();
    s.walls = [];
    nextSector = s;
    for (var i = 0; i < wallList.length; i++) {
        if (wallList[i].s != null) {
            var r = new Wall();
            r.a = wallList[i].a;
            r.b = wallList[i].b;
            r.textureName = wallList[i].textureName;
            r.isPortal = true;
            r.portal = wallList[i].s;
            wallList[i].isPortal = true;
            wallList[i].portal = s;
            s.walls.push(r);
            walls.push(r);
        } else {
            s.walls.push(wallList[i]);
        }
    }
    var wall = s.walls[0];
    var w = [wall];
    var lastWall = wall;
    var pt = wall.b;
    var ps = [pt];
    while (true) {
        var wa = otherWallWithPoint(lastWall, pt, s.walls);
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
        ps.push(pt);
        lastWall = wa;
    }

    s.pts = ps;
    s.extPts = ps.slice(0);
    s.bottom = 0;
    s.top = 10;
    s.floorColor = "#1d2630";
    s.ceilingColor = "#983e68";
}
window.onkeydown = function (e) {
    if (e.keyCode == 'S'.charCodeAt(0))
        snap = !snap;
    if (e.keyCode == 27) {
        if (currentWall != null) {
            walls.splice(walls.indexOf(currentWall), 1);
            currentWall = null;
        }
    }
    if (e.keyCode == 'F'.charCodeAt(0))
        drawFloors = !drawFloors;
    if (e.keyCode == 'C'.charCodeAt(0))
        drawCeilings = !drawCeilings;
    if (e.keyCode == 'H'.charCodeAt(0))
        ch = snapPosition != null ? snapPosition.y : lastMousePos.y;
    if (e.keyCode == 'V'.charCodeAt(0))
        cv = snapPosition != null ? snapPosition.x : lastMousePos.x;
    if (e.altKey) {
        if (e.keyCode == 'A'.charCodeAt(0)) {
            if (!nextSector) {
                alert("make a sector first!");
            } else {
                if (!nextSector.holes)
                    nextSector.holes = new Array();
                var wall = wallList[0];
                var w = [wall];
                var lastWall = wall;
                var pt = wall.b;
                var ps = [pt];
                while (true) {
                    var wa = otherWallWithPoint(lastWall, pt, wallList, true);
                    if (wa == null) {
                        alert("no closed loop!");
                        return;
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
                    ps.push(pt);
                    lastWall = wa;
                }
                nextSector.holes.push(ps);
                nextSector.extPts = nextSector.extPts.concat(ps);
                wallList = null;
            }
        }
        if (e.keyCode == 'T'.charCodeAt(0)) {
            if (!nextSector) {
                makeSector();
            }
            wallList = null;
        }
        if (e.keyCode == 'S'.charCodeAt(0)) {
            var s = nextSector;
            if (!nextSector) {
                makeSector();
                s = nextSector;
                nextSector = null;
            }
            s.triangulate();
            sectors.push(s);
            wallList = null;
            nextSector = null;
        }
    }
};
window.onkeyup = function (e) {
    if (e.keyCode == 'H'.charCodeAt(0))
        ch = null;
    if (e.keyCode == 'V'.charCodeAt(0))
        cv = null;
};
function triangulateAll() {
    for (var i = 0; i < sectors.length; i++)
        sectors[i].triangulate();
}
var currentWall = null;
var snapPosition = null;
var camera = new vec2(0, 0);
var entities = new Array();
function saveSectorSettings(i) {
    var s = sectors[i];
    sectors[i].ceilingColor = (document.getElementById("cc")).value;
    sectors[i].floorColor = (document.getElementById("fc")).value;
    sectors[i].bottom = (document.getElementById("fh")).value;
    sectors[i].top = (document.getElementById("ch")).value;
    document.getElementById("props").innerHTML = "";
}
function saveEntitySettings(i) {
    var e = entities[i];
    e.str = (document.getElementById("entity")).value;
    document.getElementById("props").innerHTML = "";
}
function saveWallSettings(i) {
    var w = walls[i];
    w.textureName = (document.getElementById("wall" + i + "")).value;
    var p = parseInt((document.getElementById("portal" + i)).value);
    if (p != -1) {
        w.isPortal = true;
        w.portal = sectors[p];
    } else {
        w.isPortal = false;
        w.portal = null;
    }
    document.getElementById("props").innerHTML = "";
}
function moncontextmenu(e) {
    var p;
    if (snapPosition != null)
        p = snapPosition; else
        p = new vec2(e.offsetX - camera.x, e.offsetY - camera.y);
    if (ch != null)
        p.y = ch;
    if (cv != null)
        p.x = cv;
    e.preventDefault();
    for (var i = 0; i < sectors.length; i++) {
        if (p.dist(sectors[i].p) < 15) {
            var str = "";
            var s = sectors[i];
            str += i + "<br>";
            str += 'floor color: <input type="text" id="fc" value="' + s.floorColor + '"><br>';
            str += 'ceiling color: <input type="text" id="cc" value="' + s.ceilingColor + '"><br>';
            str += 'floor height: <input type="text" id="fh" value="' + s.bottom + '"><br>';
            str += 'ceiling height: <input type="text" id="ch" value="' + s.top + '"><br>';

            str += '<input type="button" value="Save" onclick="saveSectorSettings(' + i + ')">';
            document.getElementById("props").innerHTML = str;
            return;
        }
    }
    if (e.altKey) {
        var found = false;
        document.getElementById("props").innerHTML = "";
        for (var i = 0; i < walls.length; i++) {
            var d = distToSegmentSquared(p, walls[i].a, walls[i].b);
            if (d < 15 * 15) {
                var w = walls[i];
                var str = "" + i + ": " + w.a.x + ", " + w.a.y + " -> " + w.b.x + ", " + w.b.y + "<br>";
                str += 'texture: <input type="text" id="wall' + i + '" value="' + w.textureName + '"><br>';
                str += 'portal: <input type="text" id="portal' + i + '" value="' + sectors.indexOf(w.portal) + '"><br>';
                str += '<input type="button" value="Save" onclick="saveWallSettings(' + i + ')"><br>';
                document.getElementById("props").innerHTML += str;
                found = true;
            }
        }
        if (found == true)
            return;
        var entity = null;
        var i = -1;
        for (var i = 0; i < entities.length; i++) {
            if (p.dist(entities[i].p) < 15)
                entity = entities[i];
        }
        if (entity == null) {
            entity = new Entity();
            entity.p = copyvec2(p);
            entities.push(entity);
            i = entities.length - 1;
        }
        document.getElementById("props").innerHTML = '<textarea id="entity"></textarea><input type="button" value="Save" onclick="saveEntitySettings(' + i + ')">';
        return;
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
        if (snapPosition == null)
            for (var i = 0; i < walls.length; i++) {
                var d = distToSegmentSquared(p, walls[i].a, walls[i].b);
                if (d < 15 * 15) {
                    var w = walls[i];
                    if (w.s != null) {
                        var oldb = w.b;
                        var bi = w.s.pts.indexOf(w.b);
                        w.b = p;
                        w.s.pts[bi] = p;
                        w.s.pts.splice(bi + 1, 0, oldb);
                        var wi = w.s.walls.indexOf(w);
                        var neww = new Wall();
                        neww.a = w.b;
                        neww.b = oldb;
                        neww.textureName = w.textureName;
                        neww.s = w.s;
                        neww.isPortal = false;
                        walls.push(neww);
                        w.s.walls.splice(wi, 0, neww);
                        w.s.triangulate();
                    } else {
                        var oldb = w.b;
                        w.b = p;
                        var neww = new Wall();
                        neww.a = w.b;
                        neww.b = oldb;
                        neww.textureName = w.textureName;
                        neww.s = w.s;
                        neww.isPortal = false;
                        walls.push(neww);
                    }
                    return;
                }
            }

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
    if (ch != null)
        p.y = ch;
    if (cv != null)
        p.x = cv;
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
function otherWallWithPoint(wall, p, list, inSector) {
    if (!list)
        list = walls;
    if (!inSector)
        inSector = false;
    for (var i = 0; i < list.length; i++) {
        if (list[i] == wall)
            continue;
        if (list[i].s != null && !inSector)
            continue;
        if (list[i].a.dist(p) < .1 || list[i].b.dist(p) < .1)
            return list[i];
    }
    return null;
}
var wallList = null;
function monmousedown(e) {
    if (e.button != 0)
        return;
    mousedown = true;
    e.preventDefault();
    var p;
    if (snapPosition != null)
        p = snapPosition; else
        p = new vec2(e.offsetX - camera.x, e.offsetY - camera.y);
    if (ch != null)
        p.y = ch;
    if (cv != null)
        p.x = cv;
    if (e.ctrlKey && e.altKey) {
        if (snapPosition != null) {
            var ws = getWallsUsingPoint(snapPosition);
            while (ws.length > 0) {
                var wa = ws[0];
                if (wa.s != null) {
                    var wal = otherWallWithPoint(wa, snapPosition, wa.s.walls, true);
                    if (wa.a.dist(snapPosition) < .1) {
                        wa.a = wal.a;
                    } else
                        wa.b = wal.b;
                    for (var i = 0; i < wa.s.pts.length; i++) {
                        if (wa.s.pts[i].dist(snapPosition) < .1)
                            wa.s.pts.splice(i, 1);
                    }
                    wa.s.triangulate();
                    walls.splice(walls.indexOf(wal), 1);
                } else
                    walls.splice(walls.indexOf(wa), 1);
                ws = getWallsUsingPoint(snapPosition);
            }
        } else {
            for (var i = 0; i < sectors.length; i++) {
                if (p.dist(sectors[i].p) < 15) {
                    var s = sectors[i];
                    for (var j = 0; j < s.walls.length; j++)
                        walls.splice(walls.indexOf(s.walls[j]), 1);
                    sectors.splice(i, 1);
                }
            }
        }
        return;
    }
    if (snapPosition != null) {
        var w = getWallsUsingPoint(snapPosition);
        var i = 0;
        for (; i < w.length; i++) {
            if (w[i].a.dist(snapPosition) < .1 && selectedPoints.indexOf(w[i].a) == -1)
                selectedPoints.push(w[i].a);
            if (w[i].b.dist(snapPosition) < .1 && selectedPoints.indexOf(w[i].b) == -1)
                selectedPoints.push(w[i].b);
        }
    }
    for (var i = 0; i < entities.length; i++) {
        if (p.dist(entities[i].p) < 15)
            selectedPoints.push(entities[i].p);
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
        if (!wallList)
            wallList = [];
        wallList = wallList.concat(w);
    }
    if (e.altKey) {
        var sd = 30;
        var sw = null;
        for (var i = 0; i < walls.length; i++) {
            var d = distToSegmentSquared(p, walls[i].a, walls[i].b);
            if (d < sd) {
                sd = d;
                sw = walls[i];
            }
        }
        if (sw) {
            if (!wallList)
                wallList = [];
            if (wallList.indexOf(sw) != -1)
                wallList.splice(wallList.indexOf(sw), 1); else
                wallList.push(sw);
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
        drawText(new vec2(sectors[i].p.x + camera.x, sectors[i].p.y + camera.y), "S" + i);
    }
    for (var i = 0; i < walls.length; i++) {
        var wall = walls[i];
        if (wall.isPortal == true && wall.s == null)
            continue;
        var color = "#000000";
        if (wallList)
            if (wallList.indexOf(wall) != -1)
                color = "#FF0000";

        drawLine(new vec2(wall.a.x + camera.x, wall.a.y + camera.y), new vec2(wall.b.x + camera.x, wall.b.y + camera.y), color, wall.isPortal);
    }
    for (var i = 0; i < entities.length; i++) {
        drawText(new vec2(entities[i].p.x + camera.x, entities[i].p.y + camera.y), entities[i].str.split('\n')[0]);
        drawRect(new vec2(entities[i].p.x + camera.x, entities[i].p.y + camera.y), new vec2(entities[i].p.x + camera.x + 1, entities[i].p.y + camera.y + 1), "#00FF00");
    }
    if (snapPosition)
        drawRect(new vec2(snapPosition.x + camera.x - 5, snapPosition.y + camera.y - 5), new vec2(snapPosition.x + camera.x + 5, snapPosition.y + camera.y + 5), "#333333", true);
    drawText(new vec2(0, 750), "Snap: " + (snap ? "on" : "off"));
    if (lastMousePos)
        drawText(new vec2(500, 750), "" + lastMousePos.x + ", " + lastMousePos.y);
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
        (ctx).setLineDash([3, 7]);
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.strokeStyle = color;
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
function pointInList(p, l) {
    for (var i = 0; i < l.length; i++)
        if (l[i].dist(p) < .1)
            return i;
    return -1;
}
function save() {
    triangulateAll();
    var fixed = [];
    for (var i = 0; i < walls.length; i++) {
        if (!walls[i].s) {
            for (var j = 0; j < sectors.length; j++) {
                var s = sectors[j];
                if (s.holes)
                    for (var k = 0; k < s.holes.length; k++)
                        for (var l = 0; l < s.holes[k].length; l++) {
                            if (walls[i].a.dist(s.holes[k][l]) < .1 || walls[i].b.dist(s.holes[k][l]) < .1) {
                                s.walls.push(walls[i]);
                                walls[i].s = s;
                                fixed.push(walls[i]);
                            }
                        }
            }
            if (!walls[i].s) {
                walls.splice(i, 1);
                i--;
            }
        }
    }
    for (var i = 0; i < walls.length; i++) {
        if (walls[i].isPortal == true)
            continue;
        for (var j = 0; j < sectors.length; j++) {
            if (sectors[j].walls.indexOf(walls[i]) != -1)
                continue;
            if (pointInPolygon(walls[i].a, sectors[j].pts) && pointInPolygon(walls[i].b, sectors[j].pts) && pointInList(walls[i].a, sectors[j].extPts) < sectors[j].pts.length) {
                var r = new Wall();
                r.a = walls[i].a;
                r.b = walls[i].b;
                r.textureName = walls[i].textureName;
                r.isPortal = true;
                r.portal = walls[i].s;
                r.s = sectors[j];
                walls[i].isPortal = true;
                walls[i].portal = sectors[j];
                sectors[j].walls.push(r);
                walls.push(r);
            }
        }
    }
    var str = "";
    str += walls.length;
    str += "\n";
    for (var i = 0; i < walls.length; i++) {
        str += walls[i].a.x + "," + walls[i].a.y + "\n";
        str += walls[i].b.x + "," + walls[i].b.y + "\n";
        str += sectors.indexOf(walls[i].s) + "," + sectors.indexOf(walls[i].portal) + "\n";
        str += walls[i].textureName.length + "," + walls[i].textureName + "\n";
    }
    str += sectors.length + "\n";
    for (var i = 0; i < sectors.length; i++) {
        var s = sectors[i];
        str += s.walls.length + "\n";
        for (var j = 0; j < s.walls.length; j++)
            str += walls.indexOf(s.walls[j]) + "\n";
        str += s.bottom + "," + s.top + "\n";
        str += s.floorColor + "," + s.ceilingColor + "\n";
        str += s.pts.length + "\n";
        for (var j = 0; j < s.pts.length; j++)
            str += s.pts[j].x + "," + s.pts[j].y + "\n";
        str += s.extPts.length + "\n";
        for (var j = 0; j < s.extPts.length; j++)
            str += s.extPts[j].x + "," + s.extPts[j].y + "\n";
        if (!s.holes)
            str += "0\n"; else {
            str += s.holes.length + "\n";
            for (var j = 0; j < s.holes.length; j++) {
                str += s.holes[j].length + "\n";
                for (var k = 0; k < s.holes[j].length; k++)
                    str += s.holes[j][k].x + "," + s.holes[j][k].y + "\n";
            }
        }
        str += s.tris.length + "\n";
        for (var j = 0; j < s.tris.length; j++)
            str += pointInList(s.tris[j].points_[0], s.extPts) + "," + pointInList(s.tris[j].points_[1], s.extPts) + "," + pointInList(s.tris[j].points_[2], s.extPts) + "\n";
        str += s.p.x + "," + s.p.y + "\n";
    }
    str += entities.length + "\n";
    for (var i = 0; i < entities.length; i++) {
        str += entities[i].str.length + "," + entities[i].str + "\n";
        str += entities[i].p.x + "," + entities[i].p.y + "\n";
    }
    (document.getElementById("out")).value = str;
}
var lpts;
function getVec2(str) {
    var strs = str.split(',');
    var v = new vec2(parseFloat(strs[0]), parseFloat(strs[1]));
    for (var i = 0; i < lpts.length; i++)
        if (lpts[i].dist(v) < .1)
            return lpts[i];
    lpts.push(v);
    return v;
}
function makeTri(a, b, c) {
    var r = new Triangle();
    (r).points_ = new Array();
    (r).points_.push(a);
    (r).points_.push(b);
    (r).points_.push(c);
    return r;
}
function load() {
    walls.splice(0, walls.length);
    sectors.splice(0, sectors.length);
    wallList = null;
    lpts = new Array();
    var str = (document.getElementById("out")).value;
    var lines = str.split('\n');
    var nWall = parseInt(lines[0]);
    for (var i = 0; i < nWall; i++) {
        var wall = new Wall();
        wall.a = getVec2(lines[i * 4 + 0 + 1]);
        wall.b = getVec2(lines[i * 4 + 1 + 1]);
        (wall).t = getVec2(lines[i * 4 + 2 + 1]);
        wall.textureName = lines[i * 4 + 3 + 1].split(',')[1];
        walls.push(wall);
    }
    var at = nWall * 4 + 1;
    var nSector = parseInt(lines[at]);
    at++;
    for (var i = 0; i < nSector; i++) {
        var s = new Sector();
        s.walls = new Array();
        nWall = parseInt(lines[at++]);
        for (var j = 0; j < nWall; j++)
            s.walls.push(walls[lines[at + j]]);
        at += nWall;
        var t = getVec2(lines[at++]);
        s.bottom = t.x;
        s.top = t.y;
        t = lines[at++].split(',');
        s.floorColor = t[0];
        s.ceilingColor = t[1];
        var nP = parseInt(lines[at++]);
        s.pts = new Array();
        for (var j = 0; j < nP; j++) {
            s.pts.push(getVec2(lines[at++]));
        }
        nP = parseInt(lines[at++]);
        s.extPts = new Array();
        for (var j = 0; j < nP; j++) {
            s.extPts.push(getVec2(lines[at++]));
        }
        var nH = parseInt(lines[at++]);
        if (nH > 0)
            s.holes = new Array();
        for (var j = 0; j < nH; j++) {
            nP = parseInt(lines[at++]);
            var r = new Array();
            for (var k = 0; k < nP; k++) {
                r.push(getVec2(lines[at++]));
            }
            s.holes.push(r);
        }

        var nT = parseInt(lines[at++]);
        s.tris = new Array();
        for (var j = 0; j < nT; j++) {
            var t = lines[at++].split(',');
            s.tris.push(makeTri(s.extPts[parseInt(t[0])], s.extPts[parseInt(t[1])], s.extPts[parseInt(t[2])]));
        }
        s.p = getVec2(lines[at++]);
        sectors.push(s);
    }
    for (var i = 0; i < walls.length; i++) {
        var t = (walls[i]).t;
        walls[i].s = sectors[t.x];
        if (t.y != -1) {
            walls[i].portal = sectors[t.y];
            walls[i].isPortal = true;
        }
    }
    var nEntity = parseInt(lines[at++]);
    for (var i = 0; i < nEntity; i++) {
        var e = new Entity();

        var strln = lines[at++];
        var str = strln.split(',')[1];
        var l = parseInt(strln.split(',')[0]);
        while (l > str.length) {
            str = str + "\n" + lines[at++];
        }
        e.p = getVec2(lines[at++]);
        e.str = str;
        entities.push(e);
    }
}
