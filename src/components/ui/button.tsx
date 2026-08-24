import { type ButtonHTMLAttributes, forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 font-medium transition-[transform,background-color,opacity,box-shadow] duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70 disabled:pointer-events-none disabled:opacity-40 active:not-disabled:scale-[0.96]",
  {
    variants: {
      variant: {
        solid:
          "bg-fg text-accent-fg shadow-[var(--shadow-border)] hover:opacity-90",
        ghost:
          "bg-transparent text-fg hover:bg-fg/8",
        muted:
          "bg-surface-2 text-fg shadow-[var(--shadow-border)] hover:bg-surface",
        hang: "bg-hang text-hang-fg hover:brightness-110",
      },
      size: {
        md: "h-11 rounded-lg px-4 text-sm",
        lg: "h-12 rounded-xl px-5 text-base",
        icon: "size-14 rounded-full",
        iconSm: "size-11 rounded-full",
      },
    },
    defaultVariants: { variant: "solid", size: "md" },
  },
);

export const Button = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonVariants>
>(function Button({ className, variant, size, type = "button", ...props }, ref) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
});
