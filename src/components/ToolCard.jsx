import { Link } from "react-router-dom";

export default function ToolCard({ title, description, to, badge, disabled }) {
  const Wrapper = disabled ? "div" : Link;
  return (
    <Wrapper
      to={disabled ? undefined : to}
      className={`group rounded-2xl border border-white/10 p-5 transition
        ${disabled ? "opacity-50 cursor-not-allowed" : "hover:border-white/20 hover:bg-white/5"}`}
    >
      <div className="flex items-start justify-between">
        <h3 className="text-lg font-medium">{title}</h3>
        {badge && (
          <span className="text-[10px] px-2 py-1 rounded-full border border-white/15">
            {badge}
          </span>
        )}
      </div>
      <p className="mt-2 text-sm text-neutral-400">{description}</p>
      {!disabled && (
        <div className="mt-4 text-sm underline underline-offset-4 opacity-80 group-hover:opacity-100">
          Open →
        </div>
      )}
    </Wrapper>
  );
}
