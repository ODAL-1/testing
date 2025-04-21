import { Component, Input } from "@angular/core";

@Component({
  selector: "form-item",
  imports: [],
  templateUrl: "./form-item.component.html",
  styleUrl: "./form-item.component.scss",
})
export class FormItemComponent {
  @Input() properties: string[] = [];
}
