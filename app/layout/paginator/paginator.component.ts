import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  Output,
  ViewChild,
} from "@angular/core";

@Component({
  selector: "paginator",
  imports: [],
  templateUrl: "./paginator.component.html",
  styleUrl: "./paginator.component.scss",
})
export class PaginatorComponent {
  @Input() totalItems: number = 0;
  @Input() pageSize: number = 10;
  @Input() currentPage: number = 1;
  @Output() pageChange = new EventEmitter<number>();
  @ViewChild("input") inputElement!: ElementRef;

  get totalPages(): number {
    return Math.ceil(this.totalItems / this.pageSize);
  }

  get inputValue(): number {
    return (this.inputElement.nativeElement as HTMLInputElement).valueAsNumber;
  }

  onInput() {
    const input = this.inputElement.nativeElement as HTMLInputElement;

    if (input.valueAsNumber > this.totalPages) {
      input.valueAsNumber = this.totalPages;
    } else if (input.valueAsNumber < 1) {
      input.valueAsNumber = 1;
    }
  }

  onPageChange(page: number): void {
    if (page < 1 || page > this.totalPages || isNaN(page)) {
      return;
    }
    this.pageChange.emit(page);
  }
}
