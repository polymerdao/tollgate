import * as React from "react";
import { ButtonSize, ButtonVariant, getButtonClass } from "@/components/ui/button-variants";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "md", ...props }, ref) => (
    <button
      ref={ref}
      className={getButtonClass(variant, size, className)}
      {...props}
    />
  )
);
Button.displayName = "Button";

export { Button };
