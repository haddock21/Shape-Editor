
import React, { useRef, useEffect } from 'react';
import { ReactComponent as PolylineIcon } from "../imgs/polyline-svgrepo-com.svg";
import { ReactComponent as CurveIcon } from "../imgs/vector-line-curve.svg";

const ToolBar = ({
    activeTool,      // currently selected drawing tool
    setActiveTool,   // function to change the active tool
    onExportJSON,    // handler for exporting shapes as JSON
    onDownloadJPEG,  // handler for downloading canvas as JPEG
    onDownloadPDF,   // handler for downloading canvas as PDF
    onLoad,          // handler for loading shapes from JSON
    onClear,         // handler to clear the canvas
    lineColor,       // current stroke color
    fillColor,       // current fill color
    setLineColor,    // setter for stroke color
    setFillColor,    // setter for fill color
    strokeWidth,     // current stroke width
    setStrokeWidth,  // setter for stroke width
    showGrid,        // whether the grid is shown
    setShowGrid,     // toggle for grid visibility
}) => {
    // ref to hidden file input for loading JSON
    const fileInputRef = useRef();
  
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
                const shapes = JSON.parse(ev.target.result);
                onLoad(shapes);
            } catch {
                console.error("Invalid JSON file");
            }
        };
        reader.readAsText(file);
        e.target.value = null;
    };

    // Create invisible <input type="color"> elements at mount to drive custom picker
    useEffect(() => {
        // line color picker
        const lineInput = document.createElement('input');
        lineInput.type = 'color';
        lineInput.value = lineColor;
        lineInput.style.display = 'none';
        lineInput.addEventListener('input', (e) => setLineColor(e.target.value));
        document.body.appendChild(lineInput);
        
        // fill color picker
        const fillInput = document.createElement('input');
        fillInput.type = 'color';
        fillInput.value = fillColor;
        fillInput.style.display = 'none';
        fillInput.addEventListener('input', (e) => setFillColor(e.target.value));
        document.body.appendChild(fillInput);

        return () => {
            lineInput.remove();
            fillInput.remove();
        };
    }, [fillColor, lineColor, setFillColor, setLineColor]);

    // Hotkey listener: pressing "v" switches to the select tool
    useEffect(() => {
        const onKeyDown = e => {
            if (e.key === "v") {
                setActiveTool("select");
            }
        };

        window.addEventListener("keydown", onKeyDown);
        return () => {
            window.removeEventListener("keydown", onKeyDown);
        };
    }, [setActiveTool]);

    // Update stroke color preview swatch whenever lineColor changes
    useEffect(() => {
        const previews = document.querySelectorAll('.draw-buttons .line-color-preview');
        if (previews[0]) previews[0].style.backgroundColor = lineColor;
    }, [lineColor]);
    // Update stroke color preview swatch whenever fillColor changes
    useEffect(() => {
        const previews = document.querySelectorAll('.draw-buttons .line-color-preview');
        if (previews[1]) previews[1].style.backgroundColor = fillColor;
    }, [fillColor]);

    return (
        <ul className='draw-buttons m-0 px-2 d-flex flex-column align-items-center justify-content-center'>
            {/* Select */}
            <button
                onClick={() => setActiveTool("select")}
                title='Select (v)'
                className={activeTool === "select" ? "tool bg-black text-white" : "tool"}
            >
                <span className="bi bi-cursor" style={{ transform: "scaleX(-1)" }}></span>
            </button>

            {/* Clear */}
            <button className='tool' onClick={onClear} title='New Page'>
                <span className="bi bi-plus-circle"></span>
            </button>

            {/* Load JSON */}
            <button className='tool' title='Upload' onClick={() => fileInputRef.current.click()}>
                <span className="bi bi-upload"></span>
            </button>

            {/* stroke‐color/thickness dropdown */}
            <div className="dropdown dropend">
                <button
                    className="tool d-flex flex-column align-items-center"
                    type="button"
                    title='Line Color/Thickness'
                    data-bs-toggle="dropdown"
                    aria-expanded="false"
                    style={{ height: "43px", fontSize: "22px" }}
                >
                    <span className="bi bi-pencil"></span>
                    <div className="line-color-preview"></div>
                </button>
                <div className="dropdown-menu p-2" style={{ minWidth: '175px', backgroundColor: '#979797' }}>
                    <label className="form-label mb-1">
                        Stroke width: {strokeWidth}px
                    </label>
                    <input
                        type="range"
                        className="form-range mb-2"
                        min="1"
                        max="20"
                        value={strokeWidth}
                        onChange={e => setStrokeWidth(Number(e.target.value))}
                    />
                    <input
                        type="color"
                        className="w-100"
                        value={lineColor}
                        onChange={e => setLineColor(e.target.value)}
                    />
                </div>
            </div>

            {/* Fill-color button */}
            <div className="dropdown dropend">
                <button
                    className="tool d-flex flex-column align-items-center justify-content-center"
                    title="Fill"
                    type="button"
                    data-bs-toggle="dropdown"
                    aria-expanded="false"
                    style={{ height: "43px", fontSize: "22px" }}
                >
                    <span className="bi bi-paint-bucket"></span>
                    <div className="line-color-preview" />
                </button>
                <div className="dropdown-menu p-2" style={{ minWidth: '175px', backgroundColor: '#979797' }} >
                    <input
                        type="color"
                        className="w-100"
                        value={fillColor}
                        onChange={e => setFillColor(e.target.value)}
                    />
                </div>
            </div>

            {/* Line */}
            <button
                onClick={() => setActiveTool("line")}
                title='Line'
                className={activeTool === "line" ? "tool bg-black text-white" : "tool"}
            >
                <span className="bi bi-slash-lg"></span>
            </button>
            {/* Poly-Line */}
            <button
                title='Poly-Line'
                onClick={() => setActiveTool("poly-line")}
                className={activeTool === "poly-line" ? "tool bg-black text-white" : "tool"}
            >
                <PolylineIcon width={35} height={35} />
            </button>
            {/* Curve */}
            <button
                title='Curve'
                onClick={() => setActiveTool("curve")}
                className={activeTool === "curve" ? "tool bg-black text-white" : "tool"}
            >
                <CurveIcon width={35} height={35} />
            </button>
            {/* Rectangle/Square */}
            <button
                title='Rectangle/Square'
                onClick={() => setActiveTool("square")}
                className={activeTool === "square" ? "tool bg-black text-white" : "tool"}
            >
                <span className="bi bi-square"></span>
            </button>
            {/* Ellipse/Circle */}
            <button
                title='Ellipse/Circle'
                onClick={() => setActiveTool("circle")}
                className={activeTool === "circle" ? "tool bg-black text-white" : "tool"}
            >
                <span className="bi bi-circle"></span>
            </button>
            {/* Triangle */}
            <button
                title='Triangle'
                onClick={() => setActiveTool("triangle")}
                className={activeTool === "triangle" ? "tool bg-black text-white" : "tool"}
            >
                <span className="bi bi-triangle"></span>
            </button>
            {/* Polygon */}
            <button
                title='Polygon'
                onClick={() => setActiveTool("polygon")}
                className={activeTool === "polygon" ? "tool bg-black text-white" : "tool"}
            >
                <span className="bi bi-pentagon"></span>
            </button>
            {/* Grid on/off */}
            <button
                onClick={() => setShowGrid(g => !g)}
                title="Toggle Grid"
                className={showGrid ? "tool bg-black text-white" : "tool"}
            >
                <span className="bi bi-grid-3x3" />
            </button>

            {/* Export Dropdown */}
            <div className="dropdown dropend">
                <button className='tool'
                    title='Download'
                    type="button"
                    data-bs-toggle="dropdown"
                    aria-expanded="false"
                >
                    <span className="bi bi-download"></span>
                </button>
                <ul className="dropdown-menu" style={{ backgroundColor: "#979797" }}>
                    <li>
                        <button
                            className="dropdown-item"
                            onClick={onDownloadJPEG}
                        >
                            JPEG Image (.jpg)
                        </button>
                    </li>
                    <li>
                        <button
                            className="dropdown-item"
                            onClick={onDownloadPDF}
                        >
                            PDF Document (.pdf)
                        </button>
                    </li>
                    <li>
                        <button
                            className="dropdown-item"
                            onClick={onExportJSON}
                        >
                            JSON File (.json)
                        </button>
                    </li>
                </ul>
            </div>

            {/* hidden file input */}
            <input
                type="file"
                accept=".json"
                ref={fileInputRef}
                style={{ display: "none" }}
                onChange={handleFileChange}
            />
        </ul>
    );
};

export default ToolBar;
