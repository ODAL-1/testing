import { Component, Input } from "@angular/core";
import { FormItemComponent } from "../../../layout/form-item/form-item.component";
import { FormFieldComponent } from "../../../layout/form-field/form-field.component";
import { FormGroup, ReactiveFormsModule } from "@angular/forms";

@Component({
  selector: "prescription",
  imports: [FormItemComponent, FormFieldComponent, ReactiveFormsModule],
  templateUrl: "./prescription.component.html",
  styleUrl: "./prescription.component.scss",
})
export class PrescriptionComponent {
  @Input() formGroup!: FormGroup;
  @Input() type: "NEAR" | "FAR" = "FAR";
}
