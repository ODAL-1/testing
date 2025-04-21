import { Component, inject } from "@angular/core";
import { ToastService } from "../../services/toast.service";
import { AsyncPipe } from "@angular/common";
import { slide } from "../../animations/slide.animation";

@Component({
  selector: "toasts",
  imports: [AsyncPipe],
  animations: [slide],
  templateUrl: "./toast.component.html",
  styleUrl: "./toast.component.scss",
})
export class ToastComponent {
  public toastService = inject(ToastService);

  toTitledCase(str: string) {
    return str
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  }

  trackById(index: number, item: any): number {
    return item.id;
  }
}
