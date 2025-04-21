import { Component, EventEmitter, Input, Output } from "@angular/core";
import {
  altCheckBoxGrow,
  checkBoxGrow,
} from "../../animations/checkbox-grow.animation";

@Component({
  selector: "checkbox",
  imports: [],
  animations: [checkBoxGrow, altCheckBoxGrow],
  templateUrl: "./checkbox.component.html",
  styleUrl: "./checkbox.component.scss",
})
export class CheckboxComponent {
  @Input() checked = false;
  @Input() disabled = false;
  @Input() alt = false;
  @Output() checkedChange = new EventEmitter<boolean>();

  toggleChecked() {
    this.checked = !this.checked;
    this.checkedChange.emit(this.checked);
  }
}
