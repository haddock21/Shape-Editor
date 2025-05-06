import React, { useState, useMemo } from "react";
import TopBar from "../components/TopBar";
import { ReactComponent as PolylineIcon } from "../imgs/polyline-svgrepo-com.svg";
import { ReactComponent as CurveIcon } from "../imgs/vector-line-curve.svg";

// Configuration for each button: id, display icon, name, and description
const BUTTONS = [
    {
        id: "select",
        icon: <i className="bi bi-cursor" style={{ color: "#ff7300", fontSize: "30px", transform: "scaleX(-1)" }} />,
        name: "Select",
        desc: "Press 'v' for hotkey. Select, move, resize, or rotate existing shapes. Click on a shape to select it; drag to move; corner handles to resize; top handle to rotate."
    },
    {
        id: "clear",
        icon: <i className="bi bi-plus-circle" style={{ color:"#ff7300", fontSize: "30px" }} />,
        name: "New Page",
        desc: "Clears the canvas. If there are shapes present, you'll be prompted to save before wiping."
    },
    {
        id: "upload",
        icon: <i className="bi bi-upload" style={{ color: "#ff7300", fontSize: "30px" }} />,
        name: "Upload (Load JSON)",
        desc: "Opens your file picker to load a previously exported JSON file of shapes onto the canvas."
    },
    {
        id: "stroke",
        icon: <i className="bi bi-pencil" style={{ color: "#ff7300", fontSize: "30px" }} />,
        name: "Line Color & Thickness",
        desc: "Use the slider to set stroke width, and the color picker to choose your line color."
    },
    {
        id: "fill",
        icon: <i className="bi bi-paint-bucket" style={{ color: "#ff7300", fontSize: "30px" }} />,
        name: "Fill Color",
        desc: "Use the color picker to choose the fill color of the selected shape or before you draw a shape."
    },
    {
        id: "line",
        icon: <i className="bi bi-slash-lg" style={{ color: "#ff7300", fontSize: "30px" }} />,
        name: "Line",
        desc: "Draw single straight segments. Click to start, drag to end, release to finish each line."
    },
    {
        id: "poly-line",
        icon: <PolylineIcon width={35} height={35} style={{ color: "#ff7300" }} />,
        name: "Poly-Line",
        desc: "Click to place each vertex. Double-click to close out the multi-segment line."
    },
    {
        id: "curve",
        icon: <CurveIcon width={35} height={35} style={{ color: "#ff7300" }} />,
        name: "Curve",
        desc: "Click to place each vertex. The curve will be shown as you move your mouse. Double-click to close out the multi-segment line."
    },
    {
        id: "square",
        icon: <i className="bi bi-square" style={{ color: "#ff7300", fontSize: "30px" }} />,
        name: "Rectangle / Square",
        desc: "Click and drag to create a rectangle. Hold Shift while dragging to constrain proportions to a square."
    },
    {
        id: "circle",
        icon: <i className="bi bi-circle" style={{ color: "#ff7300", fontSize: "30px" }} />,
        name: "Ellipse / Circle",
        desc: "Click and drag to create an ellipse. Hold Shift to make a perfect circle."
    },
    {
        id: "triangle",
        icon: <i className="bi bi-triangle" style={{ color: "#ff7300", fontSize: "30px" }} />,
        name: "Triangle",
        desc: "Click and drag to create a triangle."
    },
    {
        id: "polygon",
        icon: <i className="bi bi-pentagon" style={{ color: "#ff7300", fontSize: "30px" }} />,
        name: "Polygon",
        desc: "Click and drag to create a polygon (pentagon specifically)."
    },
    {
        id: "toggle-grid",
        icon: <i className="bi bi-grid-3x3" style={{ color: "#ff7300", fontSize: "30px" }} />,
        name: "Toggle Grid",
        desc: `Toggles 100x100 pixel grid. Hold Shift while moving shape to snap to grid.`
    },
    {
        id: "export",
        icon: <i className="bi bi-download" style={{ color: "#ff7300", fontSize: "30px" }} />,
        name: "Export / Download",
        desc: "JPEG (.jpg) – download canvas as an image | PDF (.pdf) – download canvas as a PDF | JSON (.json) – download the raw shapes data."
    },
    {
        id: "copy/paste",
        icon: <i className="bi bi-clipboard" style={{ color: "#ff7300", fontSize: "30px" }} />,
        name: "Copy / Paste",
        desc: `While a shape is selected, press CTRL+C to copy and CTRL+V to paste.`
    },
    {
        id: "undo/redo",
        icon: <i className="bi bi-arrow-counterclockwise" style={{ color: "#ff7300", fontSize: "30px" }} />,
        name: "Undo / Redo",
        desc: `Press CTRL+Z to undo an operation and CTRL+SHIFT+Z to redo. Undo and redo only work for undoing or redoing the drawing or deleting of shapes.`
    },
    {
        id: "delete",
        icon: <i className="bi bi-trash" style={{ color: "#ff7300", fontSize: "30px" }} />,
        name: "Delete",
        desc: `Press the Delete key to delete a selected shape.`
    }
];

const HelpPage = () => {
    // search state for filtering the BUTTONS list
    const [search, setSearch] = useState("");

    // useMemo to only recompute filtered array when `search` changes
    const filtered = useMemo(() => {
        const term = search.toLowerCase();
        return BUTTONS.filter(
            ({ name, desc }) =>
                name.toLowerCase().includes(term) ||
                desc.toLowerCase().includes(term)
        );
    }, [search]);

    return (
        <div className="h-100 m-0" style={{ overflowY: "auto" }}>
            <TopBar />
            {/* Centered container for the help content */}
            <div className="d-flex justify-content-center">
                <div style={{ margin: "50px", maxWidth: "750px" }}>
                    {/* Search input */}
                    <input
                        type="text"
                        className="form-control mb-3"
                        placeholder="Search..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    {/* Render a card for each matching button */}
                    {filtered.map((btn) => (
                        <div
                            key={btn.id}
                            className="d-flex align-items-center bg-black text-white rounded p-3 mb-2 shadow-sm"
                        >
                            <div className="me-3">{btn.icon}</div>
                            <div className="w-100 d-flex flex-column justify-content-center alig-items-center">
                                <h5 className="mb-1">{btn.name}</h5>
                                <p className="mb-0" style={{ fontSize: "0.9rem" }}>
                                    {btn.desc}
                                </p>
                            </div>
                        </div>
                    ))}
                    {/* Message when no items match the search */}
                    {filtered.length === 0 && (
                        <p className="text-white">No buttons match your search.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default HelpPage;
