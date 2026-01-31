import React, { useState } from "react";
import { Monitor, Sun, Moon } from "lucide-react";
import { useTheme } from "@/hooks/use-theme";
import { useAdminTheme } from "@/hooks/use-admin-theme";

interface ThemeSelectorProps {
  scope?: "global" | "admin";
  compact?: boolean;
}

export const ThemeSelector: React.FC<ThemeSelectorProps> = ({
  scope = "global",
  compact = false,
}) => {
  const adminTheme = useAdminTheme();
  const globalTheme = useTheme();
  const { preference, setTheme } = scope === "admin" ? adminTheme : globalTheme;
  const [open, setOpen] = useState(false);

  const Icon =
    preference === "dark" ? Moon : preference === "light" ? Sun : Monitor;

  return (
    <div className="relative">
      <button
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={
          compact
            ? "p-1 rounded-md hover:bg-muted transition-colors duration-200"
            : "p-2 rounded-lg hover:bg-muted transition-colors duration-200"
        }
        title="Toggle theme"
      >
        <Icon
          className={
            compact
              ? "h-4 w-4 text-muted-foreground"
              : "h-5 w-5 text-muted-foreground"
          }
        />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-44 bg-card border border-border rounded-lg shadow-lg z-50 overflow-hidden">
          <div className="p-1 flex flex-col">
            <button
              className={`text-sm text-left px-3 py-2.5 rounded-md transition-colors duration-150 flex items-center gap-2 ${
                preference === "system"
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
              onClick={() => {
                setTheme("system");
                setOpen(false);
              }}
            >
              <Monitor className="h-4 w-4" />
              <span>System</span>
            </button>

            <button
              className={`text-sm text-left px-3 py-2.5 rounded-md transition-colors duration-150 flex items-center gap-2 ${
                preference === "light"
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
              onClick={() => {
                setTheme("light");
                setOpen(false);
              }}
            >
              <Sun className="h-4 w-4" />
              <span>Light</span>
            </button>

            <button
              className={`text-sm text-left px-3 py-2.5 rounded-md transition-colors duration-150 flex items-center gap-2 ${
                preference === "dark"
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
              onClick={() => {
                setTheme("dark");
                setOpen(false);
              }}
            >
              <Moon className="h-4 w-4" />
              <span>Dark</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ThemeSelector;
