import React from "react";
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast";
import { useToast } from "@/hooks/use-toast";
import type { ToasterToast } from "@/hooks/use-toast";

export function Toaster() {
  let toasts: ToasterToast[] = [];

  try {
    const toastData = useToast();
    toasts = toastData?.toasts || [];
  } catch (e) {
    console.warn("Toaster hook failed", e);
  }

  return (
    <ToastProvider>
      {toasts.map(({ id, title, description, action, ...props }) => (
        <Toast key={id} {...props}>
          <div className="grid gap-1">
            {title && <ToastTitle>{title}</ToastTitle>}
            {description && <ToastDescription>{description}</ToastDescription>}
          </div>
          {action}
          <ToastClose />
        </Toast>
      ))}
      <ToastViewport />
    </ToastProvider>
  );
}
