import { Link } from "react-router-dom";

export default function ToolCard({ title, description, to, badge, disabled }) {
  const Wrapper = disabled ? "div" : Link;
  return (
    <Wrapper
      to={disabled ? undefined : to}
      className={`group rounded-2xl border p-5 transition bg-white
        border-slate-200 hover:border-slate-300 hover:bg-slate-50
        ${disabled ? "opacity-60 cursor-not-allowed hover:bg-white hover:border-slate-200" : ""}`}
    >
      <div className="flex items-start justify-between">
        <h3 className="text-lg font-medium text-slate-900">{title}</h3>
        {badge && (
          <span className="text-[10px] px-2 py-1 rounded-full border border-slate-200 bg-slate-50 text-slate-700">
            {badge}
          </span>
        )}
      </div>
      <p className="mt-2 text-sm text-slate-600">{description}</p>
      {!disabled && (
        <div className="mt-4 text-sm underline underline-offset-4 text-slate-700 opacity-80 group-hover:opacity-100">
          Open →
        </div>
      )}
    </Wrapper>
  );
}
