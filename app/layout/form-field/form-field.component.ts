import { Component, Input } from "@angular/core";

@Component({
  selector: "form-field",
  imports: [],
  templateUrl: "./form-field.component.html",
  styleUrl: "./form-field.component.scss",
})
export class FormFieldComponent {
  @Input() properties: string[] = [];
  @Input() name: string = "";
}
