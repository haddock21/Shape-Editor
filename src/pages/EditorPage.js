
import React, { useState, useRef } from "react";
import Canvas from "../components/Canvas";
import ToolBar from "../components/ToolBar";
import TopBar from "../components/TopBar";

const EditorPage = () => {
    const [activeTool, setActiveTool] = useState("select");    // currently selected drawing tool
    const [lineColor, setLineColor] = useState("#000000");     // stroke color for new shapes
    const [fillColor, setFillColor] = useState("#ffffff");     // fill color for new shapes
    const [strokeWidth, setStrokeWidth] = useState(1);         // stroke thickness
    const [showSaveModal, setShowSaveModal] = useState(false); // whether “save before clearing” modal is visible
    const [modalCount, setModalCount] = useState(0);           // how many shapes are present when clearing
    const [saveFormat, setSaveFormat] = useState("jpeg");      // selected format in save modal
    const [showGrid, setShowGrid] = useState(false);           // toggle grid display
    const [snapToGrid, setSnapToGrid] = useState(false);       // toggle grid snapping

    // reference to canvas
    const canvasRef = useRef();

    const handleExportJSON = () => canvasRef.current?.exportShapes();
    const handleDownloadJPEG = () => canvasRef.current?.downloadJPEG();
    const handleDownloadPDF = () => canvasRef.current?.downloadPDF();
    const handleLoad = (shapes) => canvasRef.current?.loadShapes(shapes);

    // if shapes exist, prompt to save first
    const handleClear = () => {
        const count = canvasRef.current?.getShapeCount() || 0;
        if (count > 0) {
            setModalCount(count);
            setShowSaveModal(true);
        } else {
            canvasRef.current.clearShapes();
        }
    };

    // modal button actions
    const clearWithoutSaving = () => {
        canvasRef.current.clearShapes();
        setShowSaveModal(false);
    };
    // save in selected format, then clear
    const saveAndClear = () => {
        switch (saveFormat) {
            case "json": canvasRef.current.exportShapes(); break;
            case "jpeg": canvasRef.current.downloadJPEG(); break;
            case "pdf": canvasRef.current.downloadPDF(); break;
            default: break;
        }
        canvasRef.current.clearShapes();
        setShowSaveModal(false);
    };

    return (
        <div className="h-100 m-0">
            <TopBar activeTool={activeTool}/>
            <div className="d-flex m-0" style={{ height: "95%" }}>
                <ToolBar
                    activeTool={activeTool}
                    setActiveTool={setActiveTool}
                    showGrid={showGrid}                   
                    setShowGrid={setShowGrid}
                    snapToGrid={snapToGrid}
                    setSnapToGrid={setSnapToGrid}

                    onExportJSON={handleExportJSON}
                    onDownloadJPEG={handleDownloadJPEG}
                    onDownloadPDF={handleDownloadPDF}
                    onLoad={handleLoad}
                    onClear={handleClear}
                    lineColor={lineColor}
                    fillColor={fillColor}
                    setLineColor={setLineColor}
                    setFillColor={setFillColor}
                    strokeWidth={strokeWidth}
                    setStrokeWidth={setStrokeWidth}
                />
                <div className="d-flex flex-column align-items-center justify-content-center w-100">
                    <Canvas
                        ref={canvasRef}
                        activeTool={activeTool}
                        lineColor={lineColor}
                        fillColor={fillColor}
                        strokeWidth={strokeWidth}
                        showGrid={showGrid}                
                        snapToGrid={snapToGrid}
                    />
                </div>
                {showSaveModal && (<>
                    <div className="modal show" tabIndex="-1" style={{ display: "block" }}>
                        <div className="modal-dialog">
                            <div className="modal-content" style={{ backgroundColor: "#979797" }}>
                                <div className="modal-header">
                                    <h5 className="modal-title">Save before clearing?</h5>
                                    <button
                                        type="button"
                                        className="btn-close"
                                        onClick={() => setShowSaveModal(false)}
                                    />
                                </div>
                                <div className="modal-body">
                                    <p>
                                        You have {modalCount} shape{modalCount > 1 ? "s" : ""}.
                                        Select format to save before clearing:
                                    </p>
                                    <select
                                        className="form-select"
                                        value={saveFormat}
                                        onChange={(e) => setSaveFormat(e.target.value)}
                                    >
                                        <option value="jpeg">JPEG Image</option>
                                        <option value="pdf">PDF Document</option>
                                        <option value="json">JSON File</option>
                                    </select>
                                </div>
                                <div className="modal-footer">
                                    <button
                                        type="button"
                                        className="btn btn-secondary"
                                        onClick={clearWithoutSaving}
                                    >
                                        Clear Without Saving
                                    </button>
                                    <button
                                        type="button"
                                        className="btn btn-primary"
                                        onClick={saveAndClear}
                                    >
                                        Save & Clear
                                    </button>
                                    <button
                                        type="button"
                                        className="btn text-white"
                                        style={{ backgroundColor: "#c41414" }}
                                        onClick={() => setShowSaveModal(false)}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="modal-backdrop show" /> </>
                )}
            </div>
        </div>
    );
};

export default EditorPage;
