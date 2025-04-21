import {
  Component,
  ElementRef,
  HostListener,
  inject,
  Input,
} from "@angular/core";
import { FormControl, ReactiveFormsModule } from "@angular/forms";
import { InventoryService } from "../../services/inventory.service";
import { debounceTime, Observable, Subject, takeUntil } from "rxjs";
import { Article } from "../../interfaces/article.interface";

@Component({
  selector: "search-select",
  imports: [ReactiveFormsModule],
  templateUrl: "./search-select.component.html",
  styleUrl: "./search-select.component.scss",
})
export class SearchSelectComponent {
  @Input() control!: FormControl;
  @Input() filters?: any;
  @Input() reset$!: Observable<void>;

  private inventoryService = inject(InventoryService);
  private elRef = inject(ElementRef);
  public destroy$: any = new Subject<void>();

  protected page: number = 0;
  protected pageSize: number = 20;
  protected total: number = 0;
  protected isDropdownOpen: boolean = false;
  protected articles: Article[] = [];
  protected searchControl = new FormControl("");

  private loadMore(): void {
    const query = this.searchControl.value || "";

    this.inventoryService
      .searchItems(this.page, this.pageSize, query, this.filters)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          this.articles = [...this.articles, ...response.data];
          this.total = response.total;
        },
      });
  }

  selectOption(article: Article): void {
    this.handleDropdown();
    this.control.setValue(article);
    this.searchControl.reset("");
  }

  handleDropdown(): void {
    if (this.articles.length > 0) {
      this.isDropdownOpen = !this.isDropdownOpen;

      if (this.isDropdownOpen === true) {
        this.searchControl.markAsTouched();
      }
    }
  }

  getDisplayText(article: Article | null): string {
    if (!article) {
      return "";
    }
    if (article.type === "Frame") {
      return `${article.model} - ${article.brand} - ${article.style}`;
    } else {
      return article.name;
    }
  }

  onScroll(event: Event): void {
    const el = event.target as HTMLElement;

    const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 50;

    if (atBottom && this.articles.length < this.total) {
      this.page++;
      this.loadMore();
    }
  }

  reset() {
    this.control.reset("");
    this.searchControl.reset("");
    this.isDropdownOpen = false;
    this.page = 1;
    this.total = 0;
    this.articles = [];
  }

  ngOnInit(): void {
    this.reset$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.reset();
    });

    this.searchControl.valueChanges
      .pipe(takeUntil(this.destroy$), debounceTime(150))
      .subscribe(() => {
        this.page = 1;
        this.articles = [];
        this.loadMore();
      });

    this.loadMore();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  @HostListener("document:click", ["$event"])
  onClickOutside(event: MouseEvent): void {
    const path = event.composedPath ? event.composedPath() : [];
    if (this.isDropdownOpen && !path.includes(this.elRef.nativeElement)) {
      this.isDropdownOpen = false;
      this.searchControl.reset();
    }
  }
}
