import { toast as toastManager } from "@/components/ui/toast";

type ToastType = "success" | "info" | "warning" | "error";

function show(type: ToastType, title: string, description?: string) {
  return toastManager.add({
    type,
    title,
    description,
  });
}

function messageFromUnknown(error: unknown, fallback: string) {
  return error instanceof Error && error.message.trim()
    ? error.message
    : fallback;
}

export const toast = {
  success(title: string, description?: string) {
    return show("success", title, description);
  },
  info(title: string, description?: string) {
    return show("info", title, description);
  },
  warning(title: string, description?: string) {
    return show("warning", title, description);
  },
  error(title: string, description?: string) {
    return show("error", title, description);
  },
  fromError(error: unknown, fallback: string) {
    return show("error", messageFromUnknown(error, fallback));
  },
};
