import { Component, EventEmitter, Input, Output } from "@angular/core";
import { zoomOut } from "../../animations/zoom-out.animation";

@Component({
  selector: "confirm-modal",
  imports: [],
  animations: [zoomOut],
  templateUrl: "./modal.component.html",
  styleUrl: "./modal.component.scss",
})
export class ConfirmModalComponent {
  @Input() title: string = "";
  @Input() message: string = "";
  @Input() confirmText: string = "";
  @Input() cancelText: string = "";
  @Input() showModal: boolean = false;
  @Output() closeModal: EventEmitter<boolean> = new EventEmitter();

  confirm() {
    this.closeModal.emit(true);
    this.showModal = false;
  }

  cancel() {
    this.closeModal.emit(false);
    this.showModal = false;
  }
}
