
var ctx: CanvasRenderingContext2D;
class vec2 {
    x: number;
    y: number;
    constructor(x, y)
    {
            this.x = x;
            this.y = y;
    }
    dist(p: vec2):number
    {
        var d: vec2 = new vec2(p.x - this.x, p.y - this.y);
        return Math.sqrt(d.x * d.x + d.y * d.y);
    }
}
function copyvec2(p: vec2)
{
    return new vec2(p.x, p.y);
}
var snap: bool = true;
class Wall
{
    a: vec2;
    b: vec2;
    s: Sector=null;
    textureName: string = "";
    portal: Sector = null;
    left: Wall = null;
    right: Wall = null;
}
var walls:Wall[]=new Array<Wall>();
class Sector
{
    walls: Wall[];
    floor: number;
    ceiling: number;
}
var sectors: Sector[]=new Array<Sector>();
window.onkeydown = (e) => 
{
    if (e.keyCode == 'S'.charCodeAt(0))
        snap = !snap;
    if (e.keyCode == 27)
    {
        if (currentWall != null)
        { 
            walls.splice(walls.indexOf(currentWall));
            currentWall = null;
        }
    }
}
var currentWall: Wall = null;
var snapPosition: vec2 = null;
window.oncontextmenu = (e) =>
{
    var p;
    if (snapPosition != null)
        p = snapPosition;
    else
        p = new vec2(e.offsetX, e.offsetY);
    e.preventDefault();
    if (currentWall != null)
    {
        currentWall.b = copyvec2(p);
        currentWall = null;
    }
    if (snapPosition != null)
    {

    }
    else
    { 
        currentWall = new Wall();
        currentWall.a = copyvec2(p);
        currentWall.b = copyvec2(p);
        walls.push(currentWall);
    }
}
window.onmousemove = (e) => {
    var p = new vec2(e.offsetX, e.offsetY);
    if (currentWall != null)
    {
        currentWall.b.x = e.offsetX;
        currentWall.b.y = e.offsetY;
    }
    snapPosition = null;
    if(snap)
    for (var i = 0; i < walls.length; i++)
    {
        if (walls[i] == currentWall)
            continue;
        if(walls[i].a.dist(p) < 5)
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
}
window.onload = () => {
    var el = document.getElementById('content');
    var canvas: HTMLCanvasElement =<HTMLCanvasElement> document.getElementById('canvas');
    ctx = canvas.getContext("2d");
    setInterval(update, 17);
};
function update() {
    drawRect(new vec2(0, 0), new vec2(1024, 768), "#FFFFFF");
    drawText(new vec2(0, 750), "Snap: " + (snap ? "on" : "off"));
    for (var i = 0; i < walls.length;i++)
    {
        var wall:Wall = walls[i];
        drawLine(wall.a, wall.b);
    }
    if (snapPosition)
        drawRect(new vec2(snapPosition.x - 5, snapPosition.y - 5),new vec2( snapPosition.x + 5, snapPosition.y + 5), "#333333", true);
}
function drawRect(a: vec2, b: vec2, color: string= "#000000", outline=false) {
    ctx.fillStyle = color;
    if(outline)
        ctx.strokeRect(a.x, a.y, b.x - a.x, b.y - a.y);
    else
        ctx.fillRect(a.x, a.y, b.x - a.x, b.y - a.y);
    
}
function drawLine(a: vec2, b: vec2, color:string = "#000000", dotted = false) {
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.fillStyle = color;
    ctx.closePath();
    ctx.stroke();
}
function drawImage(p: vec2, image: HTMLImageElement) {
    ctx.drawImage(image, p.x, p.y);
}
function drawText(p: vec2, str: string, color: string= "#000000") {
    ctx.fillStyle = color;
    ctx.font = "16px Arial";
    ctx.fillText(str, p.x, p.y);
}