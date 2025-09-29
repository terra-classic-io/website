import React from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "../contexts/ThemeContext";

type ThemeToggleVariant = "pill" | "minimal";
type ThemeToggleSize = "sm" | "md";

type ThemeToggleProps = {
  readonly variant?: ThemeToggleVariant;
  readonly size?: ThemeToggleSize;
};

const SIZE_PRESETS: Record<ThemeToggleSize, { readonly container: string; readonly gap: string; readonly button: string; readonly icon: number }> = {
  sm: { container: "p-1", gap: "gap-1.5", button: "p-1.5", icon: 16 },
  md: { container: "p-1.5", gap: "gap-2", button: "p-2", icon: 18 },
};

const VARIANT_PRESETS: Record<ThemeToggleVariant, string> = {
  pill: "rounded-full border border-slate-200/70 bg-white/80 shadow-sm backdrop-blur dark:border-slate-700/60 dark:bg-slate-900/70",
  minimal: "rounded-xl border border-slate-200/60 bg-white/70 shadow-sm backdrop-blur dark:border-slate-700/60 dark:bg-slate-900/70",
};

const INACTIVE_BUTTON_CLASS =
  "text-slate-600 transition hover:text-slate-900 focus:outline-none focus-visible:ring focus-visible:ring-sky-400 focus-visible:ring-offset-1 dark:text-slate-200 dark:hover:text-slate-50 dark:focus-visible:ring-sky-500";

const ThemeToggle: React.FC<ThemeToggleProps> = ({ variant = "pill", size = "md" }) => {
  const { theme, setTheme } = useTheme();
  const sizePreset = SIZE_PRESETS[size];
  const containerClassName = `flex items-center ${sizePreset.gap} ${sizePreset.container} ${VARIANT_PRESETS[variant]}`;

  const renderButton = (mode: "light" | "dark" | "system", label: string, icon: React.ReactNode, activeClass: string): JSX.Element => {
    const isActive = theme === mode;
    return (
      <button
        key={mode}
        type="button"
        onClick={() => setTheme(mode)}
        aria-label={label}
        className={`${sizePreset.button} rounded-full ${isActive ? activeClass : INACTIVE_BUTTON_CLASS}`}
      >
        {icon}
      </button>
    );
  };

  return (
    <div className={containerClassName}>
      {renderButton(
        "light",
        "Light theme",
        <Sun size={sizePreset.icon} />,
        "bg-white text-amber-500 shadow-inner dark:bg-white dark:text-amber-400"
      )}
      {renderButton(
        "dark",
        "Dark theme",
        <Moon size={sizePreset.icon} />,
        "bg-slate-900 text-sky-400 shadow-inner dark:bg-slate-800"
      )}
      {renderButton(
        "system",
        "System theme",
        <Monitor size={sizePreset.icon} />,
        "bg-slate-100 text-slate-800 shadow-inner dark:bg-slate-800 dark:text-slate-100"
      )}
    </div>
  );
};

export default ThemeToggle;
