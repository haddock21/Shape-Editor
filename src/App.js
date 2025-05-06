import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
} from "react-router-dom";
import './App.css';
import EditorPage from './pages/EditorPage.js';
import HelpPage from './pages/HelpPage.js';

function App() {
  return (
    <div className="App">
      <Router>
        <Routes>
          <Route path="/Shape-Editor" element={<EditorPage />} />
          <Route path="/help" element={<HelpPage />} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;
