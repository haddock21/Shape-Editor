import React from 'react';
import { Link, useLocation, useNavigate } from "react-router-dom";

// Map each drawing tool to a tip message
const TOOL_TIPS = {
    select: "Use the select to select, drag, resize, or rotate shapes.",
    line: "Click and drag to draw a straight line.",
    square: "Click and drag to draw a square. Hold Shift for a perfect square.",
    circle: "Click and drag to draw an ellipse. Hold Shift for a perfect circle.",
    triangle: "Click and drag to draw a triangle.",
    polygon: "Click and drag to draw a polygon.",
    "poly-line": "Click to place polyline points; double-click to finish.",
    curve: "Click to place curve control points; double-click to finish.",
};

const TopBar = ({ activeTool }) => {
    // Get current URL path
    const location = useLocation();
    // Function to navigate
    const navigate = useNavigate();
    // Determine if on the /help page
    const isHelpPage = location.pathname === "/help";

    // Pick the tip text for the current active tool
    const tip = TOOL_TIPS[activeTool];

    return (
        <div className='topbar d-flex align-items-center justify-content-center'>
            {/* Left side: either blank on help page or show a tool tip */}
            <div className='tip text-white'>
                {isHelpPage
                    ? <span className='tip'></span>
                    : <div className='tip'>{tip}</div>
                }
            </div>
            {/* Right side: Help/Back link */}
            <div className='d-flex align-items-center justify-content-end'>
                {isHelpPage
                    // If on help page, show a Back link that navigates back
                    ? (
                        <Link
                            className="link d-flex justify-content-center align-items-center"
                            onClick={() => navigate(-1)}
                        >
                            Back
                        </Link>
                    )
                    // Otherwise show a Help link to /help
                    : (
                        <Link
                            className="link d-flex justify-content-center align-items-center"
                            to="/help"
                        >
                            Help
                        </Link>
                    )
                }
            </div>
        </div>
    );
};

export default TopBar;
