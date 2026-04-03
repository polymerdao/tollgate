import { useEffect, useState } from "react";

export type ToastVariant = "default" | "success" | "error";

export type ToastMessage = {
  id: string;
  title: string;
  description?: string;
  variant?: ToastVariant;
};

type ToastState = ToastMessage[];

type Listener = (state: ToastState) => void;

let toastState: ToastState = [];
const listeners = new Set<Listener>();

function notify() {
  listeners.forEach((listener) => listener(toastState));
}

export function toast(message: Omit<ToastMessage, "id">) {
  const id = Math.random().toString(36).slice(2);
  toastState = [{ id, ...message }, ...toastState].slice(0, 5);
  notify();
  return id;
}

export function dismissToast(id: string) {
  toastState = toastState.filter((toast) => toast.id !== id);
  notify();
}

export function useToast() {
  const [toasts, setToasts] = useState<ToastState>(toastState);

  useEffect(() => {
    listeners.add(setToasts);
    return () => {
      listeners.delete(setToasts);
    };
  }, []);

  return { toasts, toast, dismissToast };
}
