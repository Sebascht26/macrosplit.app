// src/App.jsx
import { Routes, Route, Navigate } from "react-router-dom";
import SiteLayout from "./layouts/SiteLayout.jsx";

import Home from "./pages/Home.jsx";
import MacroCalculator from "./pages/MacroCalculator.jsx";
import BmiCalculator from "./pages/BmiCalculator.jsx";
import FFMICalculator from "./pages/FFMICalculator.jsx";
import OneRepMaxCalculator from "./pages/OneRepMaxCalculator.jsx";

export default function App() {
  return (
    <Routes>
      <Route element={<SiteLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/macro" element={<MacroCalculator />} />
        <Route path="/bmi" element={<BmiCalculator />} />
        <Route path="/ffmi" element={<FFMICalculator />} />
        <Route path="/1rm" element={<OneRepMaxCalculator />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
