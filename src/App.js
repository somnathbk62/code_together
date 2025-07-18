import React from "react";
import "./styles/global.css";
import "./styles/colors.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext";
import { Toaster } from "react-hot-toast";
import Home from "./pages/Home";
import EditorPage from "./pages/EditorPage";

function App() {
  return (
    <ThemeProvider>
      <div className="app-container">
        <Toaster
          position="top-right"
          toastOptions={{
            success: {
              theme: {
                primary: "#2563EB",
              },
            },
            style: {
              background: "var(--bg-secondary)",
              color: "var(--text-primary)",
              border: "1px solid var(--border-color)",
              borderRadius: "8px",
              boxShadow: "var(--shadow-lg)",
            },
          }}
        />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home />}></Route>
            <Route path="/editor/:roomId" element={<EditorPage />}></Route>
          </Routes>
        </BrowserRouter>
      </div>
    </ThemeProvider>
  );
}

export default App;
