class Triangle {
    points_: vec2[]
}
declare var poly2tri;
var ctx: CanvasRenderingContext2D;
class vec2 {
    x: number;
    y: number;
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
    dist(p: vec2): number {
        var d: vec2 = new vec2(p.x - this.x, p.y - this.y);
        return Math.sqrt(d.x * d.x + d.y * d.y);
    }
}
function copyvec2(p: vec2) {
    return new vec2(p.x, p.y);
}
var snap: bool = true;
var drawFloors: bool = true;
var drawCeilings: bool = false;
class Wall {
    a: vec2;
    b: vec2;
    s: Sector = null;
    textureName: string = "";
    portal: Sector = null;
    isPortal: bool = false;
    left: Wall = null;
    right: Wall = null;
}
var walls: Wall[] = new Array<Wall>();
function getWallsUsingPoint(p: vec2): Wall[] {
    var ret = new Array<Wall>();
    for (var i = 0; i < walls.length; i++)
    {
        if (walls[i].a.dist(p) < .1 || walls[i].b.dist(p) < .1)
            ret.push(walls[i]);
    }
    return ret;
}
class Sector {
    walls: Wall[];
    pts: vec2[];
    bottom: number;
    top: number;
    floorColor: string;
    ceilingColor: string;
    tris: Triangle[];
    p: vec2;
    triangulate() {
        var sctx = new poly2tri.SweepContext(this.pts, {cloneArrays:true});
        for (var i = 0; i < sectors.length; i++)
        {
            if (sectors[i] == this)
                continue;
            if (pointInPolygon(sectors[i].p, this.pts))
                sctx.addHole(sectors[i].pts);
        }
        poly2tri.triangulate(sctx);
        this.tris = sctx.getTriangles();
        for (var i = 0; i < this.walls.length; i++)
        {
            this.walls[i].s = this;
            if (this.walls[i].isPortal)
            {
                for (var j = 0; j < walls.length; j++)
                {
                    if (walls[j] == this.walls[i])
                        continue;
                    if (walls[j].a.dist(this.walls[i].a) < .1 && walls[j].b.dist(this.walls[i].b) < .1)
                    {
                        this.walls[i].portal = walls[j].s;
                        walls[j].portal = this;
                        break;
                    }
                }
            }
        }
    }
}
var sectors: Sector[] = new Array<Sector>();
class Entity {
    str: string="";
    p: vec2;
}
window.onkeydown = (e) => {
    if (e.keyCode == 'S'.charCodeAt(0))
        snap = !snap;
    if (e.keyCode == 27)
    {
        if (currentWall != null)
        {
            walls.splice(walls.indexOf(currentWall), 1);
            currentWall = null;
        }
    }
    if (e.keyCode == 'F'.charCodeAt(0))
        drawFloors = !drawFloors;
    if (e.keyCode == 'C'.charCodeAt(0))
        drawCeilings = !drawCeilings;
}
var currentWall: Wall = null;
var snapPosition: vec2 = null;
var camera: vec2 = new vec2(0, 0);
var entities: Entity[] = new Array<Entity>();
function saveSectorSettings(i: number) {
    var s = sectors[i];
    sectors[i].ceilingColor = (<any> document.getElementById("cc")).value;
    sectors[i].floorColor = (<any> document.getElementById("fc")).value;
    sectors[i].bottom = (<any> document.getElementById("fh")).value;
    sectors[i].top = (<any> document.getElementById("ch")).value;
}
function saveEntitySettings(i: number) {
    var e = entities[i];
    e.str = (<any> document.getElementById("entity")).value;
}
function moncontextmenu(e) {
    var p;
    if (snapPosition != null)
        p = snapPosition;
    else
        p = new vec2(e.offsetX-camera.x, e.offsetY-camera.y);
    e.preventDefault();
    for (var i = 0; i < sectors.length; i++)
    {
        if (p.dist(sectors[i].p) < 15)
        {
            var str = "";
            var s = sectors[i];
            str += 'floor color: <input type="text" id="fc" value="' + s.floorColor + '"><br>';
            str += 'ceiling color: <input type="text" id="cc" value="' + s.ceilingColor + '"><br>';
            str += 'floor height: <input type="text" id="fh" value="' + s.bottom + '"><br>';
            str += 'ceiling height: <input type="text" id="ch" value="' + s.top + '"><br>';
            str += '<input type="button" value="Save" onclick="saveSectorSettings(' + i + ')">';
            document.getElementById("props").innerHTML = str;
            return;
        }
    }
    if (e.altKey)
    {
        var entity = null;
        var i = -1;
        for (var i = 0; i < entities.length; i++)
        {
            if (p.dist(entities[i].p) < 15)
                entity = entities[i];
        }
        if (entity == null)
        {
            entity = new Entity();
            entity.p = copyvec2(p);
            entities.push(entity);
            i = entities.length - 1;
        }
        document.getElementById("props").innerHTML = '<textarea id="entity"></textarea><input type="button" value="Save" onclick="saveEntitySettings(' + i + ')">';
        return;
    }
    if (currentWall != null)
    {
        currentWall.b = copyvec2(p);
        currentWall = null;
        if (snapPosition == null)
        {
            currentWall = new Wall();
            currentWall.a = copyvec2(p);
            currentWall.b = copyvec2(p);
            walls.push(currentWall);
        }
    }
    else
    {
        for (var i = 0; i < walls.length; i++)
        {
            var d = distToSegmentSquared(p, walls[i].a, walls[i].b);
            if (d < 15 * 15)
            {
                var w = walls[i];
                if (w.s != null)
                {
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
                }
                else
                {
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
var selectedPoints: vec2[] = new Array<vec2>();
var lastMousePos: vec2 = null;
function monmousemove(e) {
    var p = new vec2(e.offsetX-camera.x, e.offsetY-camera.y);
    if (currentWall != null)
    {
        currentWall.b.x = p.x;
        currentWall.b.y = p.y;
    }
    snapPosition = null;
    if (snap)
        for (var i = 0; i < walls.length; i++)
        {
            if (walls[i] == currentWall)
                continue;
            if (walls[i].a.dist(p) < 5)
            {
                snapPosition = copyvec2(walls[i].a);
                break;
            }
            if (walls[i].b.dist(p) < 5)
            {
                snapPosition = copyvec2(walls[i].b);
                break;
            }
        }
    if (lastMousePos)
    {
        var d = new vec2(p.x - lastMousePos.x, p.y - lastMousePos.y);
        if (selectedPoints.length > 0)
        {
            for (var i = 0; i < selectedPoints.length; i++)
            {
                selectedPoints[i].x += d.x;
                selectedPoints[i].y += d.y;
            }
        }
        else if (mousedown==true)
        {
            camera.x += d.x;
            camera.y += d.y;
        }
    }
    lastMousePos = p;
    e.preventDefault();
}
function otherWallWithPoint(wall: Wall, p: vec2, list?: Wall[],inSector?): Wall {
    if (!list)
        list = walls;
    if (!inSector)
        inSector = false;
    for (var i = 0; i < list.length; i++)
    {
        if (list[i] == wall)
            continue;
        if (list[i].s != null && !inSector)
            continue;
        if (list[i].a.dist(p) < .1 || list[i].b.dist(p) < .1)
            return list[i];
    }
    return null;
}
function monmousedown(e) {
    mousedown = true;
    e.preventDefault();
    if (e.ctrlKey && e.altKey)
    {
        if (snapPosition != null)
        {
            var ws = getWallsUsingPoint(snapPosition);
            while (ws.length>0)
            {
                var wa = ws[0];
                if (wa.s != null)
                {
                    /* var ind = wa.s.walls.indexOf(wa);
                     wa.s.walls[(ind - 1) % wa.s.walls.length].b = wa.s.walls[(ind + 1) % wa.s.walls.length].a;
                     wa.s.walls[(ind + 1) % wa.s.walls.length].a = wa.s.walls[(ind - 1) % wa.s.walls.length].b;*/
                    var wal = otherWallWithPoint(wa, snapPosition,wa.s.walls,true);
                    if (wa.a.dist(snapPosition) < .1)
                    {
                        wa.a = wal.a;
                    }
                    else
                        wa.b = wal.b;
                    for (var i = 0; i < wa.s.pts.length; i++)
                    {
                        if (wa.s.pts[i].dist(snapPosition) < .1)
                            wa.s.pts.splice(i,1);
                    }
                    wa.s.triangulate();
                    walls.splice(walls.indexOf(wal),1);
                }
                else
                    walls.splice(walls.indexOf(wa),1);
                ws = getWallsUsingPoint(snapPosition);
            }
        }
        else
        {
            for (var i = 0; i < sectors.length; i++)
            {
                if (p.dist(sectors[i].p) < 15)
                {
                    var s = sectors[i];
                    for (var j = 0; j < s.walls.length; j++)
                        walls.splice(walls.indexOf(s.walls[j]), 1);
                    sectors.splice(i,1);
                }
            }
        }
        return;
    }
    var p;
    if (snapPosition != null)
        p = snapPosition;
    else
        p = new vec2(e.offsetX-camera.x, e.offsetY-camera.y);
    if (snapPosition != null)
    {
        var w: Wall[] = getWallsUsingPoint(snapPosition);
        var i = 0;
        for (; i < w.length; i++)
        {
            if (w[i].a.dist(snapPosition) < .1)
                selectedPoints.push(w[i].a);
            if (w[i].b.dist(snapPosition) < .1)
                selectedPoints.push(w[i].b);
        }
    }
    for (var i = 0; i < entities.length; i++)
    {
        if (p.dist(entities[i].p) < 15)
            selectedPoints.push(entities[i].p);
    }
    if (e.ctrlKey)
    {
        for (var i = 0; i < sectors.length; i++)
        {
            if (p.dist(sectors[i].p)<15)
            {
                sectors[i].triangulate();
                return;
            }
        }
        var wall: Wall;
        var w = new Array<Wall>();
        var pts = new Array<vec2>();
        for (var i = 0; i < walls.length; i++)
        {
            var d = distToSegmentSquared(p, walls[i].a, walls[i].b);
            if (d < 15 * 15)
            {
                wall = walls[i];
                break;
            }
        }
        if (wall == null)
        {
            alert("No nearby wall");
            return;
        }
        w.push(wall);
        var lastWall = wall;
        var pt = wall.b;
        pts.push(pt);
        while (true)
        {
            var wa = otherWallWithPoint(lastWall, pt);
            if (wa == null)
            {
                alert("no closed loop!");
                break;
            }
            if (wa == wall)
                break;
            if (w.indexOf(wa) != -1)
            {
                alert("stuck in a loop!");
                return;
            }
            if (wa.a.dist(pt) < .1)
                pt = wa.b;
            else
                pt = wa.a;
            w.push(wa);
            pts.push(pt);
            lastWall = wa;
        }
        var s = new Sector;
        s.pts = pts;
        s.walls = w;
        s.triangulate();
        s.p = p;
        s.bottom = 0;
        s.top = 10;
        s.floorColor = "#AAAAAA";
        s.ceilingColor = "#555555";
        sectors.push(s);
    }
    if (e.altKey)
    {
        for (var i = 0; i < walls.length; i++)
        {
            var d = distToSegmentSquared(p, walls[i].a, walls[i].b);
            if (walls[i].s == null)
            {
                alert("please make a sector first");
                break;
            }
            if (walls[i].isPortal == null)
            {
                alert("already a portal");
                break;
            }
            if (d < 15 * 15)
            {
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
window.onload = () => {
    var el = document.getElementById('content');
    var canvas: HTMLCanvasElement = <HTMLCanvasElement> document.getElementById('canvas');
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
        for (var x = 0; x < 1024; x += 32)
        {
            drawRect(new vec2(x, y), new vec2(x + 1, y + 1), "#333333");
        }
    for (var i = 0; i < sectors.length; i++)
    {
        var color;
        if (drawCeilings)
            color = sectors[i].ceilingColor;
        else if (drawFloors)
            color = sectors[i].floorColor;
        (<any>ctx).setLineDash([1,9]);
        for (var j = 0; j < sectors[i].tris.length; j++)
        {
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
        (<any>ctx).setLineDash([1, 0]);
        drawText(new vec2(sectors[i].p.x+camera.x,sectors[i].p.y+camera.y), "S"+i);
    }
    for (var i = 0; i < walls.length; i++)
    {
        var wall: Wall = walls[i];
        if (wall.isPortal == true && wall.s == null)
            continue;
        drawLine(new vec2(wall.a.x + camera.x, wall.a.y + camera.y), new vec2(wall.b.x + camera.x, wall.b.y + camera.y),"#000000",wall.isPortal);
    }
    for (var i = 0; i < entities.length; i++)
    {
        drawText(new vec2(entities[i].p.x + camera.x, entities[i].p.y + camera.y), entities[i].str.split('\n')[0]);
    }
    if (snapPosition)
        drawRect(new vec2(snapPosition.x + camera.x - 5, snapPosition.y + camera.y - 5), new vec2(snapPosition.x + camera.x + 5, snapPosition.y + camera.y + 5), "#333333", true);
    drawText(new vec2(0, 750), "Snap: " + (snap ? "on" : "off"));
}
function drawRect(a: vec2, b: vec2, color: string= "#000000", outline= false) {
    ctx.fillStyle = color;
    if (outline)
        ctx.strokeRect(a.x, a.y, b.x - a.x, b.y - a.y);
    else
        ctx.fillRect(a.x, a.y, b.x - a.x, b.y - a.y);

}
function drawLine(a: vec2, b: vec2, color: string = "#000000", dotted = false) {
    if (dotted == true)
        (<any>ctx).setLineDash([5]);
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.fillStyle = color;
    ctx.closePath();
    ctx.stroke();
    if (dotted == true)
        (<any>ctx).setLineDash([1,0]);
}
function drawImage(p: vec2, image: HTMLImageElement) {
    ctx.drawImage(image, p.x, p.y);
}
function drawText(p: vec2, str: string, color: string= "#000000") {
    ctx.fillStyle = color;
    ctx.font = "16px Arial";
    ctx.fillText(str, p.x, p.y);
}
function lineLine(a: vec2, b: vec2, c: vec2, d: vec2): bool {
    var r = ((a.y - c.y) * (d.x - c.x) - (a.x - c.x) * (d.y - c.y)) / ((b.x - a.x) * (d.y - c.y) - (b.y - a.y) * (d.x - c.x));
    var s = ((a.y - c.y) * (b.x - a.x) - (a.x - c.x) * (b.y - a.y)) / ((b.x - a.x) * (d.y - c.y) - (b.y - a.y) * (d.x - c.x));
    if (r >= 0 && r <= 1 && s >= 0 && s <= 1)
        return true;
    else
        return false;
}

function PolygonIsConvex(Points: vec2[]): bool {
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
    for (var A = 0; A < num_points; A++)
    {
        B = (A + 1) % num_points;
        C = (B + 1) % num_points;

        var cross_product = (Points[A].x - Points[B].x) * (Points[C].x - Points[B].x) + (Points[A].y - Points[B].y) * (Points[C].y - Points[B].y);
        if (cross_product < 0)
        {
            got_negative = true;
        }
        else if (cross_product > 0)
        {
            got_positive = true;
        }
        if (got_negative && got_positive) return false;
    }

    // If we got this far, the polygon is convex.
    return true;
}
function sqr(x) { return x * x }
function dist2(v, w) { return sqr(v.x - w.x) + sqr(v.y - w.y) }
function distToSegmentSquared(p, v, w) {
    var l2 = dist2(v, w);
    if (l2 == 0) return dist2(p, v);
    var t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
    if (t < 0) return dist2(p, v);
    if (t > 1) return dist2(p, w);
    return dist2(p, {
        x: v.x + t * (w.x - v.x),
        y: v.y + t * (w.y - v.y)
    });
}
function distToSegment(p, v, w) { return Math.sqrt(distToSegmentSquared(p, v, w)); }
function pointInPolygon(p: vec2, pts: vec2[]): bool {

var   i, j = pts.length - 1;
var  oddNodes = false;

    for (i = 0; i < pts.length; i++) {
        if (pts[i].y < p.y && pts[j].y >= p.y
            || pts[j].y < p.y && pts[i].y >= p.y) {
                if (pts[i].x + (p.y - pts[i].y) / (pts[j].y - pts[i].y) * (pts[j].x - pts[i].x) < p.x) {
                oddNodes = !oddNodes;
            }
        }
        j = i;
    }

    return oddNodes;
}
function save() {
    var str = "";
    str += walls.length;
    str += "\n";
    for (var i = 0; i < walls.length; i++)
    {
        str += walls[i].a.x + "," + walls[i].a.y + "\n";
        str += walls[i].b.x + "," + walls[i].b.y + "\n";
        str += sectors.indexOf(walls[i].s) + "," + sectors.indexOf(walls[i].portal) + "\n";
        str += walls[i].textureName.length + "," + walls[i].textureName + "\n";
    }
    str += sectors.length + "\n";
    for (var i = 0; i < sectors.length; i++)
    {
        var s = sectors[i];
        str += s.walls.length + "\n";
        for (var j = 0; j < s.walls.length; j++)
            str += walls.indexOf(s.walls[j]) + "\n";
        str += s.bottom + "," + s.top + "\n";
        str += s.floorColor + "," + s.ceilingColor + "\n";
        str += s.pts.length + "\n";
        for (var j = 0; j < s.pts.length; j++)
            str += s.pts[j].x + "," + s.pts[j].y + "\n";
        str += s.tris.length + "\n";
        for (var j = 0; j < s.tris.length; j++)
            str += s.pts.indexOf(s.tris[j].points_[0]) + "," + s.pts.indexOf(s.tris[j].points_[1]) + "," + s.pts.indexOf(s.tris[j].points_[2]) + "\n";
        str += s.p.x + "," + s.p.y + "\n";
    }
    str += entities.length + "\n";
    for (var i = 0; i < entities.length; i++)
    {
        str += entities[i].str.length + "," + str[i].str + "\n";
        str += entities[i].p.x + "," + entities[i].p.y + "\n";
    }
   ( <any>document.getElementById("out")).value = str;
}
var lpts;
function getVec2(str: string): vec2 {
    var strs = str.split(',');
    var v = new vec2(parseFloat(strs[0]), parseFloat(strs[1]));
    for (var i = 0; i < lpts.length; i++)
        if (lpts[i].dist(v) < .1)
            return lpts[i];
    lpts.push(v);
    return v;
}
function makeTri(a: vec2, b: vec2, c: vec2) {
    var r = new Triangle();
    (<any>r).points_ = new Array<vec2>();
    (<any>r).points_.push(a);
    (<any>r).points_.push(b);
    (<any>r).points_.push(c);
    return r;
}
function load() {
    walls.splice(0, walls.length);
    sectors.splice(0, sectors.length);
    lpts = new Array<vec2>();
    var str = (<any>document.getElementById("out")).value;
    var lines = str.split('\n');
    var nWall: number = parseInt(lines[0]);
    for (var i = 0; i < nWall; i++)
    {
        var wall = new Wall();
        wall.a = getVec2(lines[i * 4 + 0 + 1]);
        wall.b = getVec2(lines[i * 4 + 1 + 1]);
        (<any>wall).t = getVec2(lines[i * 4 + 2 + 1]);
        wall.textureName = lines[i * 4 + 3 + 1].split(',')[1];
        walls.push(wall);
    }
    var at = nWall * 4 + 1;
    var nSector = parseInt(lines[at]);
    at++;
    for (var i = 0; i < nSector; i++)
    {
        var s = new Sector();
        s.walls = new Array<Wall>();
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
        s.pts = new Array<vec2>();
        for (var j = 0; j < nP; j++)
        {
            s.pts.push(getVec2(lines[at++]));
        }
        var nT = parseInt(lines[at++]);
        s.tris = new Array<Triangle>();
        for (var j = 0; j < nT; j++)
        {
            var t = lines[at++].split(',');
            s.tris.push(makeTri(s.pts[t[0]], s.pts[t[1]], s.pts[t[2]]));
        }
        s.p = getVec2(lines[at++]);
        sectors.push(s);
    }
    for (var i = 0; i < walls.length; i++)
    {
        var t = (<any>walls[i]).t;
        walls[i].s = sectors[t.x];
        if (t.y != -1)
        {
            walls[i].portal = sectors[t.y];
            walls[i].isPortal = true;
        }
    }
    var nEntity = parseInt(lines[at++]);
    for (var i = 0; i < nEntity; i++)
    {
        var e = new Entity();
        e.str = lines[at++].split(',')[1];
        e.p = getVec2(lines[at++]);
    }
}