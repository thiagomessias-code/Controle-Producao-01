import { InputHTMLAttributes, ReactNode } from "react";
import { clsx } from "clsx";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: ReactNode;
  helperText?: string;
}

const Input = ({
  label,
  error,
  icon,
  helperText,
  className,
  ...props
}: InputProps) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-foreground mb-2">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && <div className="absolute left-3 top-1/2 -translate-y-1/2">{icon}</div>}
        <input
          className={clsx(
            "w-full px-4 py-3 rounded-xl border-2 border-orange-100 bg-white text-foreground shadow-sm shadow-orange-50/20",
            "placeholder:text-muted-foreground transition-all duration-300",
            "focus:outline-none focus:ring-4 focus:ring-orange-100 focus:border-orange-500",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            error && "border-destructive focus:ring-red-100",
            icon && "pl-11",
            className
          )}
          {...props}
        />
      </div>
      {error && <p className="mt-1 text-sm text-destructive">{error}</p>}
      {helperText && !error && (
        <p className="mt-1 text-sm text-muted-foreground">{helperText}</p>
      )}
    </div>
  );
};

export default Input;
