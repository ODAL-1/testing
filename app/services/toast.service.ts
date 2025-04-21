import { Injectable } from "@angular/core";
import { ToastData } from "../interfaces/toast-data.interface";
import { BehaviorSubject } from "rxjs";

@Injectable({
  providedIn: "root",
})
export class ToastService {
  toasts$ = new BehaviorSubject<ToastData[]>([]);
  private toastTimeouts = new Map<number, any>();

  constructor() {}

  private setToastInfo(toast: ToastData): ToastData {
    return {
      id: Date.now(),
      duration: toast.duration && !toast.canClose ? toast.duration : 2500,
      type: toast.type || "success",
      message: toast.message,
      canClose: toast.canClose || false,
      showIcon: toast.showIcon || false,
    };
  }

  private closeToastByTime(toastId: number, duration: number) {
    const timeout = setTimeout(() => {
      this.close(toastId);
    }, duration);
    this.toastTimeouts.set(toastId, timeout);
  }

  showToast(toast: ToastData) {
    const newToast = this.setToastInfo(toast);
    const currentToasts = this.toasts$.value;

    const delay = newToast.duration! + currentToasts.length * 500;

    newToast.duration = delay;

    this.toasts$.next([newToast, ...currentToasts]);

    if (!newToast.canClose && newToast.duration) {
      this.closeToastByTime(newToast.id!, newToast.duration);
    }
  }

  close(toastId: number) {
    this.toasts$.next(
      this.toasts$.value.filter((toast) => toast.id !== toastId),
    );

    if (this.toastTimeouts.has(toastId)) {
      clearTimeout(this.toastTimeouts.get(toastId));
      this.toastTimeouts.delete(toastId);
    }
  }
}
