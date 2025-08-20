import { Routes, Route, Navigate } from "react-router-dom";
import Shell from "./components/Shell";
import Home from "./pages/Home";
import MacroCalculator from "./pages/MacroCalculator";
import BmiCalculator from "./pages/BmiCalculator"; // <-- add this

export default function App() {
  return (
    <Shell>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/macro" element={<MacroCalculator />} />
        <Route path="/bmi" element={<BmiCalculator />} /> {/* <-- and this */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Shell>
  );
}
