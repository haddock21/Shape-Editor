// Compute bounding box for any shape
function getBBox(shape) {
    if (shape.points) {
        const xs = shape.points.map(p => p.x);
        const ys = shape.points.map(p => p.y);
        return {
            xMin: Math.min(...xs),
            yMin: Math.min(...ys),
            xMax: Math.max(...xs),
            yMax: Math.max(...ys)
        };
    }
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
    if (shape.tool === "polygon") {
        const cx = shape.x0;
        const cy = shape.y0;
        const radius = Math.hypot(shape.x1 - shape.x0, shape.y1 - shape.y0);
        const sides = 5;  // match your drawShape logic
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
    return {
        xMin: Math.min(shape.x0, shape.x1),
        yMin: Math.min(shape.y0, shape.y1),
        xMax: Math.max(shape.x0, shape.x1),
        yMax: Math.max(shape.y0, shape.y1)
    };
}