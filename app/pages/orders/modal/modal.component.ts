import { Component, EventEmitter, Input, Output } from "@angular/core";
import { zoomOut } from "../../../animations/zoom-out.animation";
import { SaleTypes } from "../../../constants/sale-types.const";
import { NgxPrintModule } from "ngx-print";

@Component({
  selector: "modal",
  imports: [NgxPrintModule],
  animations: [zoomOut],
  templateUrl: "./modal.component.html",
  styleUrl: "./modal.component.scss",
})
export class ModalComponent {
  // TODO: Estandarizar modal como componente único en layout/
  @Input() showModal: boolean = false;
  @Input() printableOrder: boolean = false;
  @Input() benefitModal: boolean = false;
  @Output() closeModal: EventEmitter<boolean> = new EventEmitter();
  @Output() selectedOption: EventEmitter<string> = new EventEmitter();

  protected saleTypes = Object.values(SaleTypes).map((type) => ({
    display: type.display,
    value: type.value,
  }));

  confirm() {
    this.closeModal.emit(true);
    this.showModal = false;
  }

  cancel() {
    this.closeModal.emit(false);
    this.showModal = false;
  }

  onChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    this.selectedOption.emit(select.value);
  }
}
