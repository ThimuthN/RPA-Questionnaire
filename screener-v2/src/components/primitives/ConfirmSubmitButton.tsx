"use client";

import type { MouseEvent } from "react";
import { Button, type ButtonProps } from "@/components/primitives/Button";

type ConfirmSubmitButtonProps = ButtonProps & {
  confirmMessage: string;
};

export function ConfirmSubmitButton({
  confirmMessage,
  onClick,
  type = "submit",
  ...props
}: ConfirmSubmitButtonProps) {
  function handleClick(event: MouseEvent<HTMLButtonElement>) {
    if (!window.confirm(confirmMessage)) {
      event.preventDefault();
      return;
    }

    onClick?.(event);
  }

  return <Button {...props} type={type} onClick={handleClick} />;
}
