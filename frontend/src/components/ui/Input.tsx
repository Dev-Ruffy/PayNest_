import { InputHTMLAttributes, LabelHTMLAttributes, forwardRef, SelectHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({ className, error, ...props }, ref) => (
  <div className="w-full">
    <input
      ref={ref}
      className={cn(
        "w-full rounded-xl border bg-white px-4 py-2.5 text-sm text-ink placeholder:text-slate-400 outline-none transition-colors",
        "focus:border-brass focus:ring-2 focus:ring-brass/20",
        error ? "border-brick" : "border-slate-200",
        className
      )}
      {...props}
    />
    {error && <p className="mt-1.5 text-xs text-brick">{error}</p>}
  </div>
));
Input.displayName = "Input";

export function Label({ className, ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn("mb-1.5 block text-sm font-medium text-ink", className)} {...props} />;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  error?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(({ className, error, children, ...props }, ref) => (
  <div className="w-full">
    <select
      ref={ref}
      className={cn(
        "w-full rounded-xl border bg-white px-4 py-2.5 text-sm text-ink outline-none transition-colors appearance-none",
        "focus:border-brass focus:ring-2 focus:ring-brass/20",
        error ? "border-brick" : "border-slate-200",
        className
      )}
      {...props}
    >
      {children}
    </select>
    {error && <p className="mt-1.5 text-xs text-brick">{error}</p>}
  </div>
));
Select.displayName = "Select";
