
var ctx: CanvasRenderingContext2D;
class vec2 {
    x: number;
    y: number;
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
}
var snap: bool=false;
class Greeter {
    element: HTMLElement;
    span: HTMLElement;
    timerToken: number;

    constructor(element: HTMLElement) {
        this.element = element;
        this.element.innerHTML += "The time is: ";
        this.span = document.createElement('span');
        this.element.appendChild(this.span);
        this.span.innerText = new Date().toUTCString();
    }

    start() {
        this.timerToken = setInterval(() => this.span.innerHTML = new Date().toUTCString(), 500);
    }

    stop() {
        clearTimeout(this.timerToken);
    }

}
window.onkeydown = (e) => 
{
    if (e.keyCode == 'S'.charCodeAt(0))
        snap = !snap;
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
}
function drawRect(a: vec2, b: vec2, color: string= "#000000", outline=false) {
    ctx.fillStyle = color;
    if(outline)
        ctx.strokeRect(a.x, a.y, b.x - a.x, b.y - a.y);
    else
        ctx.fillRect(a.x, a.y, b.x - a.x, b.y - a.y);
}
function drawLine(a: vec2, b: vec2, color:string = "#000000", dotted = false) {
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.fillStyle = color;
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