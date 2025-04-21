export interface ToastData {
  id?: number;
  duration?: number;
  type?: "warning" | "success" | "error";
  message: string;
  canClose?: boolean;
  showIcon?: boolean;
  isFading?: boolean;
}
