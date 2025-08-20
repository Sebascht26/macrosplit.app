import { Link } from "react-router-dom";
import ToolCard from "../components/ToolCard";

export default function Home() {
  return (
    <div className="space-y-8">
      <section className="text-center">
        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">Your Fitness Calculators</h1>
        <p className="mt-2 text-neutral-400">Quick, accurate tools for nutrition and training.</p>
      </section>

      <section className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <ToolCard
          title="Macronutrient Calculator"
          to="/macro"
          description="Dial in protein, carbs, and fats for your goal."
          badge="Featured"
        />
        {/* Placeholder cards you can wire up later */}
        <ToolCard
          title="TDEE / Calorie Needs"
          to="#"
          disabled
          description="Estimate maintenance calories."
        />
        <ToolCard
          title="1‑Rep Max"
          to="#"
          disabled
          description="Calculate your estimated 1RM."
        />
      </section>
    </div>
  );
}
