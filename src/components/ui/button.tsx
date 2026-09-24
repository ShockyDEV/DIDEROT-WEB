import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-diderot-violet focus-visible:ring-offset-2 focus-visible:ring-offset-surface-page disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default: "bg-diderot-indigo text-white shadow-sm hover:bg-brand-700/90",
        primary: "bg-diderot-amber text-white shadow-sm hover:bg-diderot-amber-dark",
        secondary:
          "bg-surface-card text-gray-700 border border-gray-200 shadow-sm hover:bg-gray-50 hover:border-gray-300",
        ghost: "text-gray-700 hover:bg-gray-100",
        link: "text-diderot-violet underline-offset-4 hover:underline",
        success: "bg-success-500 text-white shadow-sm hover:bg-success-700",
        danger: "bg-danger-500 text-white shadow-sm hover:bg-danger-700",
        outline:
          "border border-diderot-violet text-diderot-violet bg-transparent hover:bg-diderot-pale",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-12 rounded-lg px-6 text-base",
        icon: "h-10 w-10",
        "icon-sm": "h-8 w-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, type = "button", ...props }, ref) => (
    <button
      type={type}
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props}
    />
  ),
);
Button.displayName = "Button";

/**
 * Helper para enlaces con apariencia de botón. Útil para descargas y
 * navegaciones externas donde queremos un anchor (`<a>`) con los estilos
 * del botón sin recurrir al patrón `asChild`.
 */
type ButtonVariantsParams = Parameters<typeof buttonVariants>[0];
export const buttonClassName = (options: ButtonVariantsParams = {}) =>
  buttonVariants(options);

export { Button, buttonVariants };
