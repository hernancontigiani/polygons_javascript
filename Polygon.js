var canvas = document.getElementById("canvasPolygon");

canvas.addEventListener("click", handle_click_mouse_event);
canvas.addEventListener("mousemove", update_current_position);
canvas.addEventListener("mousedown", handle_mouse_down_event);
canvas.addEventListener("mouseup", handle_mouse_up_event);
window.addEventListener("keydown", handle_key_down_event);

var canva_width = 960;
var canva_height = 540;
var ctx = canvas.getContext("2d");

var vertex_radius = 4;
var currentPosition = new Point(0, 0);
var img = new Image();
var imageReady = false;
var moving_poly_vertex = null;

function loadImage(image_path) {
	imageReady = false;
    img.src = image_path;
	img.onload = function() {
		imageReady = true;
		draw();
	};
}

function Point(x, y) {		
	this.x = x;
	this.y = y;
}

function Polygon(name, color) {
	this.name = name
	this.color = color
	this.points = [];
}

var polygons = [];

function update_current_position(event) {
	currentPosition.x = event.offsetX;
	currentPosition.y = event.offsetY;
	if (moving_poly_vertex !== null) {
		//console.log("x: " + currentPosition.x + " y: " + currentPosition.y + " vx: " + moving_poly_vertex.x + " vy: " + moving_poly_vertex.y);
		moving_poly_vertex.x = currentPosition.x;
		moving_poly_vertex.y = currentPosition.y;
		draw();
	}
}

function get_declared_vtx(points, polyvtx) {
	for (var i = 0; i < points.length; i++) {
		if (points[i].x < (polyvtx.x + 5) && points[i].x > (polyvtx.x - 5) && points[i].y < (polyvtx.y + 5) && points[i].y > (polyvtx.y - 5)) {
			return points[i];
		}
	}
	return null;
}

function get_declared_vtx_idx(points, polyvtx) {
	for (var i = 0; i < points.length; i++) {
		if (points[i].x < (polyvtx.x + 5) && points[i].x > (polyvtx.x - 5) && points[i].y < (polyvtx.y + 5) && points[i].y > (polyvtx.y - 5)) {
			return i;
		}
	}
	return -1;
}

function check_declared_points(points, polyvtx) {
	for (var i = 0; i < points.length; i++) {
		if (points[i].x < (polyvtx.x + 5) && points[i].x > (polyvtx.x - 5) && points[i].y < (polyvtx.y + 5) && points[i].y > (polyvtx.y - 5)) {
			return true;
		}
	}
	return false;
}

function handle_mouse_down_event(event) {
	var evt_point = new Point(event.offsetX, event.offsetY);
	for (var i = 0; i < polygons.length; i++) {
		if (check_declared_points(polygons[i].points, evt_point)) {
			moving_poly_vertex = get_declared_vtx(polygons[i].points, evt_point);
			break;
		}
	}
}

function handle_mouse_up_event(event) {
	moving_poly_vertex = null;
}

function handle_key_down_event(event) {
	if(event.keyCode == 46) {
		var evt_point = currentPosition;
		for (var i = 0; i < polygons.length; i++) {
			if (check_declared_points(polygons[i].points, evt_point)) {
				idx = get_declared_vtx_idx(polygons[i].points, evt_point);
				if(idx >= 0) {
					polygons[i].points.splice(idx,1);
					if(polygons[i].points.length <= 2) {
						polygons.splice(i, 1);
					}
					draw();
				}
			}
		}
	}
}



function createPolygon(name, color) {
	polygon = new Polygon(name, color);
	var p1 = new Point(100, 100);
	var p2 = new Point(100, 200);
	var p3 = new Point(200, 200);
	var p4 = new Point(200, 100);
	polygon.points.push(p1);
	polygon.points.push(p2);
	polygon.points.push(p3);
	polygon.points.push(p4);
	
	polygons.push(polygon);
	draw();
}

function savePolygon(url) {
	data = new Array();
	for (var i = 0; i < polygons.length; i++) {
		polygon_data = {
			"name": polygons[i].name,
			"points": polygons[i].points
		};
		data.push(polygon_data);
	}

	$.post(url, {data: JSON.stringify(data)}, function(data) {
			console.log("enviado", data)			
		}
	);

}

function handle_click_mouse_event(event){
	var tmp_vtx = new Point(event.offsetX, event.offsetY);
	for (var i = 0; i < polygons.length; i++) {
		vertex_idx = check_point_poly_intersects(polygons[i].points, tmp_vtx)
		if(vertex_idx >= 0) {
			polygons[i].points.splice(vertex_idx+1, 0, tmp_vtx);
			draw();
			break;
		}
	}
	//debug_mouse_event(event);
}

function debug_mouse_event(event){
	console.log("X: " + event.clientX + " Y: " + event.clientY);
	console.log("padding X: " + event.offsetX + " padding Y: " + event.offsetY);
}

function drawPolyVertex(polygon) {
	for (var i = 0; i < polygon.points.length; i++) {
		ctx.beginPath();
		ctx.strokeStyle = 'black';		
		ctx.arc(polygon.points[i].x, polygon.points[i].y, vertex_radius, 0, 2 * Math.PI, false);
		ctx.fillStyle = polygon.color;
		ctx.fill();
		ctx.lineWidth = 1;		
		ctx.stroke();
		ctx.closePath();
	}
}

function drawPolyVertexIndex(polygon) {
	for (var i = 0; i < polygon.points.length; i++) {
		ctx.beginPath();
		ctx.fillStyle = "black";
		ctx.font = "32px";
		ctx.fillText(Number(i).toString(), polygon.points[i].x, polygon.points[i].y, 60);
		ctx.closePath();
	}
}

function drawPolyFigure(polygon) {
	ctx.beginPath();
	//ctx.strokeStyle = "black";
	ctx.strokeStyle = polygon.color;
	ctx.moveTo(polygon.points[0].x, polygon.points[0].y);
	for (var i = 1; i < polygon.points.length; i++) {
		ctx.lineTo(polygon.points[i].x, polygon.points[i].y);
	}
	ctx.lineTo(polygon.points[0].x, polygon.points[0].y);
	ctx.fillStyle = polygon.color + "33";
	ctx.fill();
	ctx.stroke();
	ctx.closePath();
}

function drawBounds() {
	ctx.beginPath();
	ctx.fillStyle = "#e2e2e2";
	ctx.fillRect(0, 0, 1280, 60);
	ctx.fill();
	ctx.fillStyle = "white";
	ctx.closePath();
}

function check_point_poly_intersects(points, point) {
	for (var i = 0; i < points.length; i++) {
		var p1 = points[i];
		if((i+1) < points.length) {
			var p2 = points[i+1];
		}
		else {
			var p2 = points[0];
		}
		d1 = dist2(point, p1);
		d2 = dist2(point, p2);
		if(d1 <= (vertex_radius/2.0)) {
			continue;
		}
		if(d2 <= (vertex_radius/2.0)) {
			continue;
		}

		var distance = distToSegment(point, p1, p2);
		//console.log("distance", distance);
		if(distance <= (vertex_radius/2.0)) {
			return i;
		}
	}
	return -1;
}

function sqr(x) { return x * x }
function dist2(v, w) { return sqr(v.x - w.x) + sqr(v.y - w.y) }
function distToSegmentSquared(p, v, w) {
  var l2 = dist2(v, w);
  if (l2 == 0) return dist2(p, v);
  var t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
  t = Math.max(0, Math.min(1, t));
  return dist2(p, { x: v.x + t * (w.x - v.x),
                    y: v.y + t * (w.y - v.y) });
}
function distToSegment(p, v, w) { return Math.sqrt(distToSegmentSquared(p, v, w)); }

function line_intersects(p0, p1, p2, p3) {
    var s1_x, s1_y, s2_x, s2_y;
    s1_x = p1['x'] - p0['x'];
    s1_y = p1['y'] - p0['y'];
    s2_x = p3['x'] - p2['x'];
    s2_y = p3['y'] - p2['y'];

    var s, t;
    s = (-s1_y * (p0['x'] - p2['x']) + s1_x * (p0['y'] - p2['y'])) / (-s2_x * s1_y + s1_x * s2_y);
    t = ( s2_x * (p0['y'] - p2['y']) - s2_y * (p0['x'] - p2['x'])) / (-s2_x * s1_y + s1_x * s2_y);

    if (s >= 0 && s <= 1 && t >= 0 && t <= 1)
    {
        // Collision detected
        return true;
    }
    return false; // No collision
}

function check_line_intersect(points, x,y){
    if(points.length < 4){
        return false;
    }
    var p0 = new Array();
    var p1 = new Array();
    var p2 = new Array();
    var p3 = new Array();

    p2['x'] = points[points.length-1]['x'];
    p2['y'] = points[points.length-1]['y'];
    p3['x'] = x;
    p3['y'] = y;

    for(var i=0; i<points.length-1; i++){
        p0['x'] = points[i]['x'];
        p0['y'] = points[i]['y'];
        p1['x'] = points[i+1]['x'];
        p1['y'] = points[i+1]['y'];
        if(p1['x'] == p2['x'] && p1['y'] == p2['y']){ continue; }
        if(p0['x'] == p3['x'] && p0['y'] == p3['y']){ continue; }
        if(line_intersects(p0,p1,p2,p3)==true){
            return true;
        }
    }
    return false;
}

function draw() {
	// Clear canvas	
	if(imageReady == true) {
		ctx.drawImage(img, 0, 0, canva_width, canva_height);
	}
	else {
		ctx.clearRect(0, 0, canva_width, canva_height);
		ctx.beginPath();
		ctx.fillStyle = "black";
		ctx.textBaseline = 'middle'; 
		ctx.textAlign = 'center'; 
		ctx.font = "50px sans-serif";
		ctx.fillText("IMAGE NO AVAILABLE", canva_width/2, canva_height/2);
		ctx.closePath();
	}

    // Draw polygons
	for (var i = 0; i < polygons.length; i++) {
		drawPolyFigure(polygons[i]);
		drawPolyVertex(polygons[i]);
	}
}

draw();