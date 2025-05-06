import React, { forwardRef, useImperativeHandle, useRef, useEffect, useState, useCallback } from "react";
import { jsPDF } from "jspdf";
import "../css/canvas.css";


// Draws a grid background for the canvas
function drawGrid(ctx, width, height, cell) {
    ctx.save();
    ctx.beginPath();
    ctx.strokeStyle = "#ffffff3a";    
    ctx.lineWidth = 1;
    
    // draw vertical grid lines
    for (let x = 0; x <= width; x += cell) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
    }

    // draw horizontal grid lines
    for (let y = 0; y <= height; y += cell) {
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
    }
    ctx.stroke();
    ctx.restore();
}

// Computes the bounding box for any shape
function getBBox(shape) {
    if (shape.points) {
        // poly-line or curve: use all points
        const xs = shape.points.map(p => p.x);
        const ys = shape.points.map(p => p.y);
        return {
            xMin: Math.min(...xs),
            yMin: Math.min(...ys),
            xMax: Math.max(...xs),
            yMax: Math.max(...ys)
        };
    }
    // circle or ellipse: calculate extents from center and radii
    if (shape.tool === "circle") {
        const cx = shape.x0, cy = shape.y0;
        if (shape.isCircle) {
            const r = Math.hypot(shape.x1 - shape.x0, shape.y1 - shape.y0);
            return { xMin: cx - r, yMin: cy - r, xMax: cx + r, yMax: cy + r };
        } else {
            const rx = Math.abs(shape.x1 - shape.x0);
            const ry = Math.abs(shape.y1 - shape.y0);
            return { xMin: cx - rx, yMin: cy - ry, xMax: cx + rx, yMax: cy + ry };
        }
    }
    // regular pentagon: approximate by computing all vertices
    if (shape.tool === "polygon") {
        const cx = shape.x0;
        const cy = shape.y0;
        const radius = Math.hypot(shape.x1 - shape.x0, shape.y1 - shape.y0);
        const sides = 5;  
        const xs = [];
        const ys = [];
        for (let i = 0; i < sides; i++) {
            const ang = i * (2 * Math.PI / sides) - Math.PI / 2;
            xs.push(cx + radius * Math.cos(ang));
            ys.push(cy + radius * Math.sin(ang));
        }
        return {
            xMin: Math.min(...xs),
            yMin: Math.min(...ys),
            xMax: Math.max(...xs),
            yMax: Math.max(...ys)
        };
    }
    // square: enforce equal width/height then compute corners
    if (shape.tool === "square" && shape.isSquare) {
        const dx = shape.x1 - shape.x0;
        const dy = shape.y1 - shape.y0;
        const side = Math.min(Math.abs(dx), Math.abs(dy));
        const w = dx < 0 ? -side : side;
        const h = dy < 0 ? -side : side;

        const xA = shape.x0;
        const yA = shape.y0;
        const xB = shape.x0 + w;
        const yB = shape.y0 + h;

        return {
            xMin: Math.min(xA, xB),
            yMin: Math.min(yA, yB),
            xMax: Math.max(xA, xB),
            yMax: Math.max(yA, yB)
        };
    }
    // default rectangle: two corner points
    return {
        xMin: Math.min(shape.x0, shape.x1),
        yMin: Math.min(shape.y0, shape.y1),
        xMax: Math.max(shape.x0, shape.x1),
        yMax: Math.max(shape.y0, shape.y1)
    };
}

// Hit-testing: checks if point (x,y) hits the shape stroke or interior
function hitTest(ctx, shape, x, y, defaultStroke) {
    const path = new Path2D();
    ctx.lineWidth = (shape.strokeWidth || defaultStroke) + 15;
    switch (shape.tool) {
        case "line":
            path.moveTo(shape.x0, shape.y0);
            path.lineTo(shape.x1, shape.y1);
            return ctx.isPointInStroke(path, x, y);
        default:
            const { xMin, yMin, xMax, yMax } = getBBox(shape);
            return x >= xMin && x <= xMax && y >= yMin && y <= yMax;
    }
}

// Draws the shape itself, applying any rotation and offset
function drawShape(ctx, shape, offsetX = 0, offsetY = 0) {
    const x0 = shape.x0 + offsetX;
    const y0 = shape.y0 + offsetY;
    const x1 = shape.x1 + offsetX;
    const y1 = shape.y1 + offsetY;
    // compute center of bounding box for rotation
    const { xMin, yMin, xMax, yMax } = getBBox(shape);
    const cx = (xMin + xMax) / 2 + offsetX;
    const cy = (yMin + yMax) / 2 + offsetY;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(shape.rotation || 0);
    ctx.translate(-cx, -cy);

    switch (shape.tool) {
        case "square": {
            const dx = shape.x1 - shape.x0;
            const dy = shape.y1 - shape.y0;
            let w, h;
            if (shape.isSquare) {
                const side = Math.min(Math.abs(dx), Math.abs(dy));
                w = dx < 0 ? -side : side;
                h = dy < 0 ? -side : side;
            } else {
                w = dx;
                h = dy;
            }
            ctx.fillRect(shape.x0 + offsetX, shape.y0 + offsetY, w, h);
            ctx.strokeRect(shape.x0 + offsetX, shape.y0 + offsetY, w, h);
            return;
        }
        case "line":
            ctx.beginPath();
            ctx.moveTo(x0, y0);
            ctx.lineTo(x1, y1);
            ctx.stroke();
            return;
        case "circle":
            ctx.beginPath();
            if (shape.isCircle) {
                const r = Math.hypot(shape.x1 - shape.x0, shape.y1 - shape.y0);
                ctx.arc(x0, y0, r, 0, 2 * Math.PI);
            } else {
                ctx.ellipse(x0, y0, Math.abs(shape.x1 - shape.x0), Math.abs(shape.y1 - shape.y0), 0, 0, 2 * Math.PI);
            }
            ctx.fill();
            ctx.stroke();
            return;
        case "triangle":
            ctx.beginPath();
            ctx.moveTo(x0, y0);
            ctx.lineTo(x1, y0);
            ctx.lineTo((x0 + x1) / 2, y1);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            return;
        case "polygon":
            ctx.beginPath();
            const sides = 5;
            const radius = Math.hypot(shape.x1 - shape.x0, shape.y1 - shape.y0);
            for (let i = 0; i < sides; i++) {
                const ang = i * (2 * Math.PI / sides) - Math.PI / 2;
                const px = shape.x0 + offsetX + radius * Math.cos(ang);
                const py = shape.y0 + offsetY + radius * Math.sin(ang);
                if (i === 0) ctx.moveTo(px, py);
                else ctx.lineTo(px, py);
            }
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            return;
        case "poly-line":
            if (shape.points && shape.points.length) {
                ctx.beginPath();
                ctx.moveTo(shape.points[0].x + offsetX, shape.points[0].y + offsetY);
                for (let p of shape.points.slice(1)) ctx.lineTo(p.x + offsetX, p.y + offsetY);
                ctx.stroke();
            }
            return;
        case "curve":
            if (shape.points && shape.points.length) {
                ctx.beginPath();
                const pts = shape.points;
                ctx.moveTo(pts[0].x + offsetX, pts[0].y + offsetY);
                for (let i = 1; i < pts.length; i++) {
                    const prev = pts[i - 1];
                    const curr = pts[i];
                    const mx = (prev.x + curr.x) / 2 + offsetX;
                    const my = (prev.y + curr.y) / 2 + offsetY;
                    ctx.quadraticCurveTo(prev.x + offsetX, prev.y + offsetY, mx, my);
                }

                const last = pts[pts.length - 1];
                ctx.lineTo(last.x + offsetX, last.y + offsetY);

                ctx.stroke();
            }
            return;
        default:
            ctx.save();
            ctx.translate(cx, cy);
            ctx.rotate(shape.rotation || 0);
            ctx.translate(-cx, -cy);

    }
}

// Draws selection handles & rotation grip around the shape
function drawSelection(ctx, shape, offsetX = 0, offsetY = 0) {
    const R = 5;
    if (shape.tool === "line") {
        // line endpoints as handles
        const p0 = { x: shape.x0 + offsetX, y: shape.y0 + offsetY };
        const p1 = { x: shape.x1 + offsetX, y: shape.y1 + offsetY };
        ctx.fillStyle = "white";
        ctx.fill();
        ctx.beginPath(); ctx.moveTo(p0.x, p0.y); ctx.lineTo(p1.x, p1.y); ctx.stroke();
        [p0, p1].forEach(pt => {
            ctx.beginPath(); ctx.arc(pt.x, pt.y, R, 0, 2 * Math.PI); ctx.fill(); ctx.stroke();
        });
        return;
    }
    const { xMin, yMin, xMax, yMax } = getBBox(shape);
    const midX = (xMin + xMax) / 2;
    const rotY = yMin - 20;
    ctx.beginPath();
    ctx.moveTo(midX, yMin);
    ctx.lineTo(midX, rotY);
    ctx.stroke();

    // draw rotate handle line + circle
    ctx.beginPath();
    ctx.arc(midX, rotY, R, 0, 2 * Math.PI);

    ctx.stroke();

    // draw bounding rect
    ctx.strokeRect(xMin, yMin, xMax - xMin, yMax - yMin);

    // draw corner handles
    ctx.fillStyle = "white";
    ctx.fill();
    [
        { x: xMin, y: yMin },
        { x: xMax, y: yMin },
        { x: xMax, y: yMax },
        { x: xMin, y: yMax }
    ].forEach(pt => {
        ctx.beginPath(); ctx.arc(pt.x, pt.y, R, 0, 2 * Math.PI); ctx.fill(); ctx.stroke();
    });
}

const Canvas = forwardRef(({ activeTool, lineColor, fillColor, strokeWidth, showGrid, snapToGrid }, ref) => {
    // refs for DOM and data
    const containerRef = useRef(null);
    const c1Ref = useRef(null);        // background canvas
    const c2Ref = useRef(null);        // top canvas for interactions
    const shapesRef = useRef([]);      // all shapes data
    const undoStack = useRef([]);      // history for undo
    const redoStack = useRef([]);      // history for redo
    const polyRef = useRef([]);        // building polyline
    const clipboardRef = useRef([]);   // copy/paste buffer
    const curveRef = useRef([]);       // building curve
    const [isDrawing, setIsDrawing] = useState(false);
    const [startPos, setStartPos] = useState({ x: 0, y: 0 });
    const dragRef = useRef({       // drag state
        isDragging: false,
        isResizing: false,
        origShape: null,
        origRotation: 0,
        center: null,
        startAngle: 0
    });

    // draws all shapes
    const redrawAll = useCallback((context = c1Ref, offsetX = 0, offsetY = 0, backgroundColor = "#979797") => {
        const c = context.current;
        const ctx = c.getContext("2d");
        ctx.clearRect(0, 0, c.width, c.height);
        console.log("width:", c.width, "height:", c.height);

        
        ctx.fillStyle = backgroundColor;
        ctx.fillRect(0, 0, c.width, c.height);
        
        if (showGrid) drawGrid(ctx, c.width, c.height, 100);   
        shapesRef.current.forEach(s => {
            ctx.save();
            ctx.strokeStyle = s.lineColor || lineColor;
            ctx.fillStyle = s.fillColor || fillColor;
            ctx.lineWidth = s.strokeWidth || strokeWidth;
            drawShape(ctx, s, offsetX, offsetY);
            if (s.selected) {
                ctx.save(); ctx.strokeStyle = "#ff7300"; ctx.lineWidth = 2;
                drawSelection(ctx, s, offsetX, offsetY);
                ctx.restore();
            }
            ctx.restore();
        });
    }, [fillColor, lineColor, showGrid, strokeWidth]);

    const gridSize = 100; 
    const snap = ({ x, y }) => ({
        x: Math.round(x / gridSize) * gridSize,
        y: Math.round(y / gridSize) * gridSize
    });

    // useImperativeHandle lets parent components call these methods on our Canvas ref
    useImperativeHandle(ref, () => ({
        // exportShapes: clear any selection, serialize shapes to JSON and trigger a download
        exportShapes: () => {
            // Deselect all shapes
            shapesRef.current.forEach(s => (s.selected = false));
            // Turn shapes array into a JSON string
            const data = JSON.stringify(shapesRef.current, null, 2);
            // Create a Blob from the JSON
            const blob = new Blob([data], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url; a.download = "shapes.json"; a.click();
            URL.revokeObjectURL(url);
        },
        // downloadJPEG: render the shapes into an off-screen canvas, then save as JPEG
        downloadJPEG: () => {
            // Deselect
            shapesRef.current.forEach(s => s.selected = false);

            // Compute collective bounding box
            const pad = 20;
            let minX = Infinity, minY = Infinity;
            let maxX = -Infinity, maxY = -Infinity;

            shapesRef.current.forEach(s => {
                const bb = s.points
                    ? getBBox(s) // handles poly-line & curve
                    : (s.tool === "circle" || s.tool === "polygon")
                        ? (() => { // your existing circle/polygon logic
                            const r = Math.hypot(s.x1 - s.x0, s.y1 - s.y0);
                            return { xMin: s.x0 - r, yMin: s.y0 - r, xMax: s.x0 + r, yMax: s.y0 + r };
                        })()
                        : { // fallback for rectangles, lines, triangles…
                            xMin: Math.min(s.x0, s.x1),
                            yMin: Math.min(s.y0, s.y1),
                            xMax: Math.max(s.x0, s.x1),
                            yMax: Math.max(s.y0, s.y1),
                        };

                minX = Math.min(minX, bb.xMin);
                minY = Math.min(minY, bb.yMin);
                maxX = Math.max(maxX, bb.xMax);
                maxY = Math.max(maxY, bb.yMax);
            });

            if (minX === Infinity) {
                // empty canvas
                minX = 0; minY = 0;
                maxX = c1Ref.current.width;
                maxY = c1Ref.current.height;
            }

            // pad & size
            minX -= pad; minY -= pad;
            maxX += pad; maxY += pad;
            const sw = maxX - minX;
            const sh = maxY - minY;

            // offscreen canvas
            const tmp = document.createElement("canvas");
            tmp.width = sw; tmp.height = sh;
            const ctx1 = tmp.getContext("2d");
            const fakeRef = { current: Object.assign(tmp, { getContext: () => ctx1, width: sw, height: sh }) };

            // redraw and export
            redrawAll(fakeRef, -minX, -minY, "#ffffff");
            const dataURL = tmp.toDataURL("image/jpeg", 1.0);
            const link = document.createElement("a");
            link.href = dataURL;
            link.download = "shapes.jpg";
            link.click();
        },
        // downloadPDF: similar to JPEG but slices canvas into A4 pages with jsPDF
        downloadPDF: () => {
            // Deselect all
            shapesRef.current.forEach(s => (s.selected = false));

            // Compute collective bounding box
            const pad = 20;
            let minX = Infinity, minY = Infinity;
            let maxX = -Infinity, maxY = -Infinity;

            shapesRef.current.forEach(s => {
                // getBBox handles poly-line & curve
                const bb = s.points
                    ? getBBox(s)
                    : (s.tool === "circle" || s.tool === "polygon")
                        ? (() => {
                            const r = Math.hypot(s.x1 - s.x0, s.y1 - s.y0);
                            return {
                                xMin: s.x0 - r,
                                yMin: s.y0 - r,
                                xMax: s.x0 + r,
                                yMax: s.y0 + r
                            };
                        })()
                        : {
                            xMin: Math.min(s.x0, s.x1),
                            yMin: Math.min(s.y0, s.y1),
                            xMax: Math.max(s.x0, s.x1),
                            yMax: Math.max(s.y0, s.y1)
                        };

                minX = Math.min(minX, bb.xMin);
                minY = Math.min(minY, bb.yMin);
                maxX = Math.max(maxX, bb.xMax);
                maxY = Math.max(maxY, bb.yMax);
            });

            // if empty fall back to full canvas
            if (minX === Infinity) {
                minX = 0; minY = 0;
                maxX = c1Ref.current.width;
                maxY = c1Ref.current.height;
            }

            // pad & compute size
            minX -= pad; minY -= pad;
            maxX += pad; maxY += pad;
            const sw = maxX - minX;
            const sh = maxY - minY;

            // create off-screen canvas
            const tmp = document.createElement("canvas");
            tmp.width = sw;
            tmp.height = sh;
            const ctx1 = tmp.getContext("2d");

            // fake the ref interface so redrawAll sees width/height
            const fakeRef = {
                current: Object.assign(tmp, {
                    getContext: () => ctx1,
                    width: sw,
                    height: sh
                })
            };

            // redraw everything into tmp
            redrawAll(fakeRef, -minX, -minY, "#ffffff");

            // set up PDF
            const orientation = sw > sh ? "landscape" : "portrait";
            const pdf = new jsPDF({ orientation, unit: "px", format: "a4" });
            const pageW = pdf.internal.pageSize.getWidth();
            const pageH = pdf.internal.pageSize.getHeight();
            const scale = Math.min(pageW / sw, pageH / sh);

            // slice into pages
            let yOffset = 0;
            while (yOffset < sh) {
                const sliceH = Math.min(sh - yOffset, pageH / scale);
                const slice = document.createElement("canvas");
                slice.width = sw;
                slice.height = sliceH;
                slice.getContext("2d").drawImage(
                    tmp,
                    0, yOffset, sw, sliceH,
                    0, 0, sw, sliceH
                );

                const imgData = slice.toDataURL("image/jpeg", 1.0);
                const imgW = sw * scale;
                const imgH = sliceH * scale;
                const xPos = (pageW - imgW) / 2;

                pdf.addImage(imgData, "JPEG", xPos, 0, imgW, imgH);
                yOffset += sliceH;
                if (yOffset < sh) pdf.addPage();
            }

            // download
            pdf.save("shapes.pdf");
        },
        // loadShapes: replace the current shapes array and redraw
        loadShapes: (arr) => { shapesRef.current = arr.map(s => ({ ...s, selected: false })); redrawAll(); },
        // getShapeCount: returns how many shapes are currently stored
        getShapeCount: () => shapesRef.current.length,
        // clearShapes: empties all shapes and clears the canvas
        clearShapes: () => { shapesRef.current = []; redrawAll(); }
    }));

    useEffect(() => {
        // resizes both canvases to fill the container
        const resize = () => {
            const { width, height } = containerRef.current.getBoundingClientRect();
            // Update both canvas elements to match new dimension
            [c1Ref, c2Ref].forEach(r => { r.current.width = width; r.current.height = height; });
            // Redraw everything at the new size
            redrawAll();
        };
        // Call it once immediately so canvases start at correct size
        resize();
        // And re-run on every window resize
        window.addEventListener("resize", resize);
        // Clean up listener when component unmounts or redrawAll changes
        return () => window.removeEventListener("resize", resize);
    }, [redrawAll]);

    useEffect(() => {
        let dirty = false;
        // If any selected shape’s strokeWidth, lineColor, or fillColor
        // no longer matches the current props, update it and mark dirty
        shapesRef.current.forEach(s => {
            if (s.selected && (s.strokeWidth !== strokeWidth || s.lineColor !== lineColor || s.fillColor !== fillColor)) {
                s.strokeWidth = strokeWidth;
                s.lineColor = lineColor;
                s.fillColor = fillColor;
                dirty = true;
            }
        });
        // If we changed anything, trigger a redraw to apply the new styles
        if (dirty) redrawAll();
    }, [strokeWidth, lineColor, fillColor, redrawAll]);

    useEffect(() => {
        // Any time showGrid changes, redraw so the grid appears or disappears
        redrawAll();
    }, [showGrid, redrawAll]);

    useEffect(() => {
        // Grab the overlay canvas and its 2D context
        const c2 = c2Ref.current;
        const ctx2 = c2.getContext("2d");
        // convert a mouse event into coordinates relative to the canvas
        const getPos = e => {
            const r = c2.getBoundingClientRect();
            return { x: e.clientX - r.left, y: e.clientY - r.top };
        };
        // mousedown: either start a rotate/resize/drag or begin drawing a new shape
        const down = e => {
            let pos = getPos(e);
            if (activeTool === "select") {
                const ctx1 = c1Ref.current.getContext("2d");
                // clear any previous selection
                shapesRef.current.forEach(sh => sh.selected = false);

                // walk shapes top-down to see what was clicked
                for (let i = shapesRef.current.length - 1; i >= 0; i--) {
                    const s = shapesRef.current[i];

                    const { xMin, yMin, xMax, yMax } = getBBox(s);
                    const midX = (xMin + xMax) / 2;
                    const rotY = yMin - 20;

                    // checks if clicked on rotate handle
                    if (Math.hypot(pos.x - midX, pos.y - rotY) < 6) {
                        s.selected = true;
                        
                        dragRef.current = {
                            isRotating: true,
                            shapeIndex: i,
                            origRotation: s.rotation || 0,
                            
                            center: { x: midX, y: (yMin + yMax) / 2 },
                            startAngle: Math.atan2(
                                pos.y - ((yMin + yMax) / 2),
                                pos.x - midX
                            )
                        };

                        redrawAll();
                        return;    
                    }

                    // checks if clicked inside shape. If not, continue
                    if (!hitTest(ctx1, s, pos.x, pos.y, strokeWidth)) continue;

                    // if clicked on a corner handle. start resize
                    const corners = [
                        { x: xMin, y: yMin },
                        { x: xMax, y: yMin },
                        { x: xMax, y: yMax },
                        { x: xMin, y: yMax }
                    ];
                    for (let h = 0; h < corners.length; h++) {
                        const dx = pos.x - corners[h].x;
                        const dy = pos.y - corners[h].y;
                        if (Math.hypot(dx, dy) < 6) {        
                            s.selected = true;
                            dragRef.current = {
                                isResizing: true,
                                shapeIndex: i,
                                handleIndex: h,
                                origShape: JSON.parse(JSON.stringify(s))
                            };
                            redrawAll();
                            return;  
                        }
                    }

                    // else clicked inside shape body. start drag
                    s.selected = true;
                    dragRef.current = {
                        isDragging: true,
                        startPos: pos,                                
                        origShape: JSON.parse(JSON.stringify(s)),     
                        shapeIndex: i
                    };
                    redrawAll();
                    return;
                }

                // clicked empty space. clear selection
                redrawAll();
                return;
            }
            // polyline mode: accumulate points
            if (activeTool === "poly-line") { polyRef.current.push(pos); setIsDrawing(true); return; }
            // curve mode: accumulate points
            if (activeTool === "curve") { curveRef.current.push(pos); setIsDrawing(true); return; }
            // shape tools: record start and begin drawing preview
            if (!["square", "line", "circle", "triangle", "polygon"].includes(activeTool)) return;
            setStartPos(pos);
            setIsDrawing(true);
        };

        // mousemove: update rotate/resize/drag or draw preview
        const move = e => {
            let pos = getPos(e);
            // rotating
            if (dragRef.current.isRotating) {
                const { shapeIndex, origRotation, center, startAngle } = dragRef.current;
                const target = shapesRef.current[shapeIndex];
                const currPos = getPos(e);

                
                const currentAngle = Math.atan2(currPos.y - center.y, currPos.x - center.x);
                target.rotation = origRotation + (currentAngle - startAngle);

                redrawAll();
                return;
            }
            // resizing: compute scale factors, update shape dimensions
            if (dragRef.current.isResizing) {
                const { shapeIndex, handleIndex, origShape } = dragRef.current;
                const target = shapesRef.current[shapeIndex];
                const pos = getPos(e);             
                const { xMin, yMin, xMax, yMax } = getBBox(origShape);
                const corners = [
                    { x: xMin, y: yMin },
                    { x: xMax, y: yMin },
                    { x: xMax, y: yMax },
                    { x: xMin, y: yMax }
                ];
                const origHandle = corners[handleIndex];
                const opposite = corners[(handleIndex + 2) % 4];

                if (origShape.tool === "line") {
                    
                    if (handleIndex === 0) {
                        target.x0 = pos.x; target.y0 = pos.y;
                    } else {
                        target.x1 = pos.x; target.y1 = pos.y;
                    }
                } else if (origShape.tool === "circle" || origShape.tool === "polygon") {
                    
                    
                    target.x1 = pos.x;
                    target.y1 = pos.y;
                    redrawAll();
                    return;
                } else {
                    
                    const sx = (pos.x - opposite.x) / (origHandle.x - opposite.x);
                    const sy = (pos.y - opposite.y) / (origHandle.y - opposite.y);

                    if (origShape.points) {
                        
                        target.points = origShape.points.map(p => ({
                            x: opposite.x + (p.x - opposite.x) * sx,
                            y: opposite.y + (p.y - opposite.y) * sy
                        }));
                    } else {
                        
                        ["x0", "y0", "x1", "y1"].forEach(k => {
                            const coord = k.startsWith("x") ? "x" : "y";
                            const o = origShape[k];
                            const off = opposite[coord];
                            target[k] = off + (o - off) * (coord === "x" ? sx : sy);
                        });
                    }
                }

                redrawAll();
                return;
            }
            // dragging: compute dx, dy, move shape, optionally snap to grid
            if (activeTool === "select" && dragRef.current.isDragging) {
                const { startPos, origShape, shapeIndex } = dragRef.current;
                const target = shapesRef.current[shapeIndex];
                
                const dx = pos.x - startPos.x;
                const dy = pos.y - startPos.y;
                
                if (origShape.points) {
                    target.points = origShape.points.map(p => ({
                        x: p.x + dx,
                        y: p.y + dy
                    }));
                } else {
                    target.x0 = origShape.x0 + dx;
                    target.y0 = origShape.y0 + dy;
                    target.x1 = origShape.x1 + dx;
                    target.y1 = origShape.y1 + dy;
                }
                // snap to grid                
                if (showGrid && e.shiftKey) {
                    const { xMin, yMin } = getBBox(target);
                    const { x: snapX, y: snapY } = snap({ x: xMin, y: yMin });
                    const offX = snapX - xMin;
                    const offY = snapY - yMin;

                    if (target.points) {
                        target.points.forEach(p => {
                            p.x += offX;
                            p.y += offY;
                        });
                    } else {
                        target.x0 += offX; target.y0 += offY;
                        target.x1 += offX; target.y1 += offY;
                    }
                }

                redrawAll();
                return;
            }

            // computes preview of poly-line after each segment
            if (activeTool === "poly-line" && polyRef.current.length) {
                ctx2.clearRect(0, 0, c2.width, c2.height);
                ctx2.strokeStyle = lineColor; ctx2.lineWidth = strokeWidth;
                ctx2.beginPath(); ctx2.moveTo(polyRef.current[0].x, polyRef.current[0].y);
                for (let p of polyRef.current.slice(1)) ctx2.lineTo(p.x, p.y);
                ctx2.lineTo(pos.x, pos.y); ctx2.stroke(); return;
            }
            // computes preview of curve after each segment
            if (activeTool === "curve" && curveRef.current.length) {
                ctx2.clearRect(0, 0, c2.width, c2.height);
                const pts = [...curveRef.current, pos];
                const shape = {
                    tool: "curve",
                    points: pts,
                    strokeWidth,
                    lineColor,
                };
                ctx2.lineWidth = shape.strokeWidth;
                ctx2.strokeStyle = shape.lineColor;
                drawShape(ctx2, shape, 0, 0);
                return;
            }
            
            if (!isDrawing) return;
            // drawing a new shape: show live preview on overlay
            ctx2.clearRect(0, 0, c2.width, c2.height);
            const { x, y } = pos;

            const shape = {
                tool: activeTool,
                x0: startPos.x,
                y0: startPos.y,
                x1: x,
                y1: y,
                isSquare: e.shiftKey && activeTool === "square",
                isCircle: e.shiftKey && activeTool === "circle",
                strokeWidth: 1,
                lineColor: "black",
                fillColor: "transparent"
            }
            ctx2.fillStyle = shape.fillColor;
            ctx2.strokeStyle = shape.lineColor;
            ctx2.lineWidth = shape.strokeWidth;

            drawShape(ctx2, shape, 0, 0);
        };

        // mouseup: finalize rotate/resize/drag or commit new shape
        const up = e => {
            if (dragRef.current.isRotating) {
                dragRef.current.isRotating = false;

                redrawAll();
                return;
            }
            if (dragRef.current.isResizing) {
                dragRef.current.isResizing = false;
                dragRef.current.handleIndex = null;
                dragRef.current.origShape = null;
                return;
            }
            if (activeTool === "select" && dragRef.current.isDragging) {
                dragRef.current.isDragging = false;
                dragRef.current.shapeIndex = null;
                return;
            }
            if (["poly-line", "curve"].includes(activeTool)) return;
            if (!isDrawing) return;
            const pos = getPos(e);
            // commit new shape if mouse actually moved
            if (pos.x === startPos.x && pos.y === startPos.y) {
                ctx2.clearRect(0, 0, c2.width, c2.height);
                setIsDrawing(false);
                return;
            }
            const isCircle = activeTool === "circle" && e.shiftKey;
            const isSquare = activeTool === "square" && e.shiftKey;

            // construct newShape, push to shapesRef, record undo, select, redraw…
            const newShape = {
                tool: activeTool,
                x0: startPos.x, y0: startPos.y,
                x1: pos.x, y1: pos.y,
                lineColor, fillColor, strokeWidth,
                isCircle, isSquare,
                rotation: 0,
                selected: false
            };

            shapesRef.current.push(newShape);

            undoStack.current.push({ type: 'add', shapes: [newShape] });
            
            redoStack.current = [];

            shapesRef.current.forEach(s => (s.selected = false));
            shapesRef.current[shapesRef.current.length - 1].selected = true;
            redrawAll();
            ctx2.clearRect(0, 0, c2.width, c2.height);
            setIsDrawing(false);
        };

        // dblclick: finish polyline
        const finishPoly = e => {
            if (activeTool !== "poly-line" || polyRef.current.length < 2) return;
            const newShape = {
                tool: "poly-line",
                points: polyRef.current.slice(),
                lineColor, fillColor, strokeWidth,
                selected: false
            };
            shapesRef.current.push(newShape);

            undoStack.current.push({ type: 'add', shapes: [newShape] });
            
            redoStack.current = [];

            shapesRef.current.forEach(s => (s.selected = false));
            shapesRef.current[shapesRef.current.length - 1].selected = true;
            redrawAll();
            ctx2.clearRect(0, 0, c2.width, c2.height);
            polyRef.current = [];
        };

        // dblclick: finish curve
        const finishCurve = e => {
            if (activeTool !== "curve" || curveRef.current.length < 2) return;

            
            const pos = getPos(e);
            curveRef.current.push(pos);

            
            const newShape = {
                tool: "curve",
                points: curveRef.current.slice(),
                lineColor, fillColor, strokeWidth,
                selected: false
            };
            shapesRef.current.push(newShape);

            undoStack.current.push({ type: 'add', shapes: [newShape] });
            
            redoStack.current = [];

            
            shapesRef.current.forEach(s => (s.selected = false));
            shapesRef.current[shapesRef.current.length - 1].selected = true;
            redrawAll();
            ctx2.clearRect(0, 0, c2.width, c2.height);

            
            curveRef.current = [];
            setIsDrawing(false);
        };

        // 10) keydown: undo/redo/delete/copy/paste shortcuts
        const onKeyDown = e => {
            // undo
            if (e.ctrlKey && !e.shiftKey && e.key.toLowerCase() === 'z') {
                const action = undoStack.current.pop();
                if (!action) return;

                if (action.type === 'add') {
                    
                    shapesRef.current = shapesRef.current.filter(
                        s => !action.shapes.includes(s)
                    );
                } else if (action.type === 'delete') {
                    
                    action.shapes.forEach((shape, i) => {
                        const idx = action.indices[i];
                        shapesRef.current.splice(idx, 0, shape);
                    });
                }

                redoStack.current.push(action);
                redrawAll();
            }
            // redo
            else if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'z') {
                const action = redoStack.current.pop();
                if (!action) return;

                if (action.type === 'add') {
                    
                    shapesRef.current.push(...action.shapes);
                } else if (action.type === 'delete') {
                    
                    shapesRef.current = shapesRef.current.filter(
                        s => !action.shapes.includes(s)
                    );
                }

                undoStack.current.push(action);
                redrawAll();
            }
            // delete
            else if (e.key === "Delete") {
                const deleted = shapesRef.current.filter(s => s.selected);
                if (deleted.length) {
                    
                    const indices = deleted.map(s => shapesRef.current.indexOf(s));
                    shapesRef.current = shapesRef.current.filter(s => !s.selected);
                    undoStack.current.push({ type: 'delete', shapes: deleted, indices });
                    redoStack.current = [];
                    redrawAll();
                }
            }
            //copy
            else if (e.ctrlKey && e.key.toLowerCase() === "c") {
                clipboardRef.current = shapesRef.current
                    .filter(s => s.selected)
                    .map(s => JSON.parse(JSON.stringify(s)));
            }
            // paste
            else if (e.ctrlKey && e.key.toLowerCase() === "v") {
                const OFFSET = 10;
                const pasted = clipboardRef.current.map(orig => {
                    const copy = JSON.parse(JSON.stringify(orig));

                    if (copy.points) {
                        copy.points.forEach(p => {
                            p.x += OFFSET; p.y += OFFSET;
                        });
                    } else {
                        copy.x0 += OFFSET; copy.y0 += OFFSET;
                        copy.x1 += OFFSET; copy.y1 += OFFSET;
                    }

                    copy.selected = true;
                    copy.rotation = copy.rotation || 0;
                    return copy;
                });

                if (pasted.length) {

                    shapesRef.current.forEach(s => s.selected = false);
                    shapesRef.current.push(...pasted);


                    undoStack.current.push({ type: 'add', shapes: pasted });
                    redoStack.current = [];

                    redrawAll();
                }
            }
        };
        // attach all listener
        c2.addEventListener("mousedown", down);
        c2.addEventListener("mousemove", move);
        c2.addEventListener("mouseup", up);
        c2.addEventListener("dblclick", finishPoly);
        c2.addEventListener("dblclick", finishCurve);
        window.addEventListener("keydown", onKeyDown);

        // cleanup on unmount or deps change
        return () => {
            c2.removeEventListener("mousedown", down);
            c2.removeEventListener("mousemove", move);
            c2.removeEventListener("mouseup", up);
            c2.removeEventListener("dblclick", finishPoly);
            c2.removeEventListener("dblclick", finishCurve);
            window.removeEventListener("keydown", onKeyDown);
        };
    }, [activeTool, isDrawing, startPos, lineColor, fillColor, strokeWidth, showGrid, snapToGrid, redrawAll]);

    return (
        <div ref={containerRef} className="canvas-container">
            <canvas ref={c1Ref} />
            <canvas ref={c2Ref} style={{ backgroundColor: "transparent" }} />
        </div>
    );
});

export default Canvas;