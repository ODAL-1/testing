import { Component, ElementRef, inject, ViewChild } from "@angular/core";
import { InventoryService } from "../../services/inventory.service";
import { InventoryItem } from "../../interfaces/inventory-item.interface";
import { PaginatorComponent } from "../../layout/paginator/paginator.component";
import { ConfirmModalComponent } from "../../layout/modal/modal.component";
import {
  FormArray,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  FormsModule,
} from "@angular/forms";
import { Article } from "../../interfaces/article.interface";
import { Router, RouterModule } from "@angular/router";
import { Subject, takeUntil } from "rxjs";
import { ToastService } from "../../services/toast.service";
import { CheckboxComponent } from "../../layout/checkbox/checkbox.component";
import { zoomInList, zoomIn } from "../../animations/zoom-in.animation";
import { fadeIn } from "../../animations/fade-in.animation";
import { AuthService } from "../../services/auth.service";
import { BreakpointObserver, Breakpoints } from "@angular/cdk/layout";
import {
  collapseAnimation,
  collapseOnLeaveAnimation,
  expandOnEnterAnimation,
} from "angular-animations";
import {
  ArticleTypes,
  getDisplayByUrlKey,
} from "../../constants/article-types.const";

@Component({
  selector: "app-inventory",
  imports: [
    PaginatorComponent,
    ConfirmModalComponent,
    CheckboxComponent,
    ReactiveFormsModule,
    FormsModule,
    RouterModule,
  ],
  providers: [InventoryService],
  animations: [
    zoomIn,
    zoomInList,
    fadeIn,
    collapseAnimation(),
    collapseOnLeaveAnimation(),
    expandOnEnterAnimation(),
  ],
  templateUrl: "./inventory.component.html",
  styleUrl: "./inventory.component.scss",
})
export class InventoryComponent {
  // Private variable declaration
  @ViewChild("searchInput") private searchInput!: ElementRef<HTMLInputElement>;
  private inventoryService = inject(InventoryService);
  private toastService = inject(ToastService);
  private authService = inject(AuthService);
  private route = inject(Router);
  private fb = inject(FormBuilder);
  private breakpointObserver = inject(BreakpointObserver);
  private destroy$ = new Subject<void>();
  private user: any | null;

  // Protected variable declaration
  protected screenWidth: number = window.innerWidth;
  protected page: number = 1;
  protected pageSize: number = 40;
  protected totalArticles: number = 0;
  protected newPrice: number | null = null;

  protected isAllSelected: boolean = false;
  protected isLoading: boolean = true;
  protected isFilter: boolean = false;
  protected showModal: boolean = false;
  protected showPricePanel: boolean = false;

  protected modelStyleBrand: string = "";

  protected items: InventoryItem[] = [];
  protected itemToDelete: InventoryItem | undefined;
  protected itemForEdit: InventoryItem | undefined;

  protected disabledStyle = {
    "background-color": "#bfbdbd",
    cursor: "not-allowed",
    transform: "unset",
  };

  protected editForm: FormGroup = this.fb.group({
    itemsForm: this.fb.array([]),
  });

  protected filtersForm: FormGroup = this.fb.group({
    lensType: this.fb.control(""),
    productOrigin: this.fb.control(""),
    currency: this.fb.control(""),
  });

  protected priceForm: FormGroup = this.fb.group({
    modelStyleBrand: this.fb.control(""),
    newPrice: this.fb.control(0),
  });

  protected currencies = ["USD", "UYU"];
  protected lensTypes = ["MONOFOCAL", "BIFOCAL", "MULTIFOCAL"];
  protected productsOrigin = ["LABORATORIO", "STOCK"];

  protected articleTypes = Object.values(ArticleTypes)
    .filter((type) => type !== ArticleTypes.TREATMENT)
    .map((type) => ({
      display: type.display,
      value: type.value,
      urlKey: type.urlKey,
    }));

  protected getDisplayByUrlKey = getDisplayByUrlKey;

  // Getters
  get selectedItems(): number {
    const selectedCount = this.items.filter((item) => item.selected).length;

    return selectedCount;
  }

  get itemsForm(): FormArray {
    return this.editForm!.get("itemsForm") as FormArray;
  }

  // Private functions
  private handleItemsSuccess(response: any): void {
    this.totalArticles = response.total;
    this.items = this.mapArticlesToItems(response.data);
    this.resetItemsForm();
  }

  private handleItemsError(): void {
    this.toastService.showToast({
      message: "Error al cargar inventario",
      type: "error",
      showIcon: true,
    });
  }

  // Public functions

  /**
   *
   * @param articles - An array of articles that are retrieved from the database.
   * @returns The articles mapped to InventoryItem format.
   */
  private mapArticlesToItems(articles: Article[]): any[] {
    return articles.map((article: Article, index) => ({
      id: index + 1,
      objectId: article._id!,
      brand: this.getDisplayValue(article, "brand"),
      model: this.getDisplayValue(article, "model"),
      style: this.getDisplayValue(article, "style"),
      isSunglasses: this.getDisplayValue(article, "isSunglasses"),
      lensType: this.getDisplayValue(article, "lensType"),
      origin: this.getDisplayValue(article, "productOrigin"),
      appliesTo: this.getDisplayValue(article, "appliesTo"),
      name: article.type !== "Frame" ? article.name : "-",
      price: article.price,
      currency: article.currency,
      stock: article.stock,
      type: article.type || "",
      isEdit: false,
      selected: false,
    }));
  }

  /**
   *
   * @param article - The article object containing various properties.
   * @param field - The name of the field to retrieve from the article.
   * @returns The value of the field if it exists and is valid; otherwise, returns `"-"`.
   */
  private getDisplayValue(article: Article, field: string): any {
    if (
      article.type === "Frame" &&
      ["brand", "model", "style", "isSunglasses"].includes(field)
    ) {
      return article[field as keyof Article] ?? "-";
    }
    if (
      article.type === "Lenses" &&
      ["lensType", "productOrigin"].includes(field)
    ) {
      return article[field as keyof Article] ?? "-";
    }
    if (article.type === "Treatment" && ["appliesTo"].includes(field)) {
      return article[field as keyof Article] ?? "-";
    }
    return "-";
  }

  private resetItemsForm(): void {
    this.itemsForm.clear();
    this.initializeItemsForm();
  }

  /**
   *
   * @param value - The value that is gonna converted to strict boolean.
   * @returns - The boolean value of the parameter.
   */
  toBoolean(value: boolean | string | undefined): boolean {
    return value === "true" || value === true;
  }

  /**
   *
   * @param object - The object containing various properties.
   * @param newValues - The values that are being compared against the object values.
   * @returns True if the new values are different to the values in object, false otherwise.
   */
  hasChanged<T extends Record<string, any>>(
    object: T,
    newValues: Partial<T>,
  ): boolean {
    return (Object.keys(newValues) as Array<keyof T>).some(
      (key) => object[key] !== newValues[key],
    );
  }

  initializeItemsForm(): void {
    this.items.forEach((item) => {
      const itemGroup = this.fb.group({
        model: [item.model],
        name: [item.name],
        brand: [item.brand],
        style: [item.style],
        isSunglasses: [item.isSunglasses],
        appliesTo: [item.appliesTo],
        lensType: [item.lensType],
        origin: [item.origin],
        price: [item.price],
        currency: [item.currency],
        stock: [item.stock],
      });
      this.itemsForm.push(itemGroup);
    });
  }

  loadItems(): void {
    const filters = Object.fromEntries(
      Object.entries(this.filtersForm.value).filter(
        ([, value]) => value !== "" && value !== null && value !== undefined,
      ),
    );
    this.inventoryService
      .getItems(this.page, this.pageSize, filters)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => this.handleItemsSuccess(response),
        error: () => this.handleItemsError(),
      });
  }

  searchItems(): void {
    const input = this.searchInput.nativeElement;
    const searchTerm = input.value.trim();
    const filters = Object.fromEntries(
      Object.entries(this.filtersForm.value).filter(
        ([value]) => value !== "" && value !== null && value !== undefined,
      ),
    );

    if (searchTerm) {
      this.inventoryService
        .searchItems(this.page, this.pageSize, searchTerm, filters)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => this.handleItemsSuccess(response),
          error: () => this.handleItemsError(),
        });
    } else {
      this.loadItems();
    }
  }

  ngOnInit(): void {
    this.breakpointObserver
      .observe([
        Breakpoints.XSmall,
        Breakpoints.Small,
        Breakpoints.Medium,
        Breakpoints.Large,
      ])
      .subscribe(() => {
        this.screenWidth = window.innerWidth;
      });

    this.loadItems();

    this.authService.user$.pipe(takeUntil(this.destroy$)).subscribe((user) => {
      this.user = user || {};
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onPageChange(newPage: number): void {
    this.page = newPage;
    if (this.searchInput.nativeElement.value) {
      this.searchItems();
    } else {
      this.loadItems();
    }
  }

  onSearch(): void {
    this.page = 1;
    this.searchItems();
  }

  onLoad(): void {
    this.page = 1;
    this.loadItems();
  }

  onSelect(item: InventoryItem): void {
    item.selected = !item.selected;
  }

  onSelectAll(): void {
    this.isAllSelected = !this.isAllSelected;
    this.items.forEach((item) => (item.selected = this.isAllSelected));
  }

  onCheckedEdit(index: number, value: boolean): void {
    const itemsFormArray = this.editForm.get("itemsForm") as FormArray;
    const itemControl = itemsFormArray.at(index).get("isSunglasses");
    itemControl?.setValue(value);
  }

  onDeleteItem(itemToRemove: InventoryItem): void {
    this.inventoryService
      .removeItem(itemToRemove.objectId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.items = this.items.filter((item) => item !== itemToRemove);
          this.toastService.showToast({
            message: "Articulo eliminado con éxito",
            type: "success",
            showIcon: true,
          });

          if (this.searchInput && this.searchInput.nativeElement.value !== "") {
            this.searchItems();
          } else {
            this.loadItems();
          }
        },
        error: () => {
          this.toastService.showToast({
            message: "Error al eliminar articulo",
            type: "error",
            showIcon: true,
          });
        },
      });
  }

  onToggleEditItem(item: InventoryItem): void {
    item.isEdit = !item.isEdit;
  }

  onToggleFilters(): void {
    this.isFilter = !this.isFilter;
  }

  togglePricePanel(): void {
    this.showPricePanel = !this.showPricePanel;
    if (!this.showPricePanel) {
      this.modelStyleBrand = "";
      this.newPrice = null;
    }
  }

  updatePrices(): void {}

  onDeleteAllSelected(): void {
    const itemsIds: string[] = this.items
      .filter((item) => item.selected)
      .map((item) => item.objectId);

    this.inventoryService
      .removeMultipleItems(itemsIds)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.items = this.items.filter((item) => !item.selected);
          this.isAllSelected = false;
          this.toastService.showToast({
            message: "Articulo/s eliminado con éxito",
            type: "success",
            showIcon: true,
          });

          if (this.searchInput && this.searchInput.nativeElement.value !== "") {
            this.searchItems();
          } else {
            this.loadItems();
          }
        },
        error: () => {
          this.toastService.showToast({
            message: "Error al eliminar articulo/s",
            type: "error",
            showIcon: true,
          });
        },
      });
  }

  onFilterChange(): void {
    if (this.searchInput && this.searchInput.nativeElement.value === "") {
      this.onLoad();
    } else {
      this.onSearch();
    }
  }

  onUpdateItem(item: InventoryItem, index: number): void {
    const updatedData = this.itemsForm.at(index).value;

    const {
      brand,
      model,
      style,
      name,
      lensType,
      origin,
      price,
      currency,
      stock,
      isSunglasses,
      appliesTo,
    } = updatedData;

    if (!this.hasChanged(item, updatedData)) {
      item.isEdit = false;
      return;
    }

    const sendData = {
      ...(name && { name: name }),
      ...(model &&
        brand &&
        style && { model: model, brand: brand, style: style }),
      ...(isSunglasses !== "-" && { isSunglasses: isSunglasses }),
      ...(lensType && origin && { lensType: lensType, productOrigin: origin }),
      ...(appliesTo !== "-" && { appliesTo: appliesTo }),
      price: price,
      currency: currency,
      stock: stock,
    };

    this.inventoryService.updateItem(item.objectId, sendData).subscribe({
      next: () => {
        item.brand = brand;
        item.model = model;
        item.style = style;
        item.isSunglasses = isSunglasses;
        item.appliesTo = appliesTo;
        item.name = name;
        item.lensType = lensType;
        item.origin = origin;
        item.price = price;
        item.currency = currency;
        item.stock = stock;
        item.isEdit = false;

        this.toastService.showToast({
          message: "Articulo actualizado con éxito",
          type: "success",
          showIcon: true,
        });
      },
      error: () => {
        this.toastService.showToast({
          message: "Error al actualizar articulo",
          type: "error",
          showIcon: true,
        });
      },
    });
  }

  handleDelete(action: "single" | "multiple", item?: any): void {
    if (this.user.privilege !== "ADMINISTRADOR") {
      this.toastService.showToast({
        message: "Solo un admin. puede eliminar artículos",
        type: "warning",
        showIcon: true,
      });
    } else {
      if (action === "single" && item) {
        this.itemToDelete = item;
      } else if (action === "multiple") {
        this.itemToDelete = undefined;
      }
      this.showModal = true;
    }
  }

  handleCloseModal(result: boolean): void {
    if (result) {
      if (this.itemToDelete) {
        this.onDeleteItem(this.itemToDelete);
      } else {
        this.onDeleteAllSelected();
      }
    }

    this.showModal = false;
  }

  handleNewArticle(): void {
    if (this.user.privilege !== "ADMINISTRADOR") {
      this.toastService.showToast({
        message: "Solo un admin. puede agregar artículos",
        type: "warning",
        showIcon: true,
      });
    } else {
      this.route.navigateByUrl("/inventory/new");
    }
  }

  handleAddition(): void {
    if (this.user.privilege !== "ADMINISTRADOR") {
      this.toastService.showToast({
        message: "Solo un admin. puede realizar adiciones",
        type: "warning",
        showIcon: true,
      });
    } else {
      this.route.navigateByUrl("/inventory/addition");
    }
  }

  handleMaterial(): void {
    if (this.user.privilege !== "ADMINISTRADOR") {
      this.toastService.showToast({
        message: "Solo un admin. puede gestionar materiales",
        type: "warning",
        showIcon: true,
      });
    } else {
      this.route.navigateByUrl("/inventory/material");
    }
  }
}
