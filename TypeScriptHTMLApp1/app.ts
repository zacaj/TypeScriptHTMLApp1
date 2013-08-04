
var ctx: CanvasRenderingContext2D;
class vec2 {
    x: number;
    y: number;
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
}
var snap: bool = false;
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
        walls.splice(walls.indexOf(currentWall));
        currentWall = null;
    }
}
var currentWall:Wall=null;
window.oncontextmenu = (e) =>
{
    e.preventDefault();
    if (currentWall == null)
    {
        currentWall = new Wall();
        currentWall.a = new vec2(e.offsetX, e.offsetY);
        currentWall.b = new vec2(e.offsetX, e.offsetY);
        walls.push(currentWall);
    }
    else
    {
        currentWall.b = new vec2(e.offsetX, e.offsetY);
        currentWall = null;
    }
}
window.onmousemove = (e) => {
    if (currentWall != null)
    {
        currentWall.b.x = e.offsetX;
        currentWall.b.y = e.offsetY;
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