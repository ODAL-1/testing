import { getUrlKeyByKey } from "./../../../constants/article-types.const";
// Actualizar la importación de las directivas estructurales para Angular 18
import {
  Component,
  type ElementRef,
  inject,
  ViewChild,
  HostListener,
} from "@angular/core";
import type { InventoryItem } from "../../../interfaces/inventory-item.interface";
import type { ArticleAttributes } from "../../../interfaces/article-attributes.interface";
import {
  type AbstractControl,
  FormBuilder,
  type FormGroup,
  ReactiveFormsModule,
  type ValidationErrors,
  Validators,
} from "@angular/forms";
import { InventoryService } from "../../../services/inventory.service";
import { Subject, takeUntil } from "rxjs";
import { RouterModule } from "@angular/router";
import { ToastService } from "../../../services/toast.service";
import { ConfirmModalComponent } from "../../../layout/modal/modal.component";
import { CheckboxComponent } from "../../../layout/checkbox/checkbox.component";
import { zoomIn, zoomInList } from "../../../animations/zoom-in.animation";
import { collapseAnimation } from "angular-animations";
import { FormItemComponent } from "../../../layout/form-item/form-item.component";
import { FormFieldComponent } from "../../../layout/form-field/form-field.component";
import {
  type ArticleTypeKey,
  ArticleTypes,
} from "../../../constants/article-types.const";
import { ModalComponent } from "../../orders/modal/modal.component";
import {
  NgIf,
  NgFor,
  NgSwitch,
  NgSwitchCase,
  NgSwitchDefault,
} from "@angular/common";

// Extendemos la interfaz InventoryItem para incluir las propiedades de detalles del armazón
interface InventoryItemWithDetails extends Partial<InventoryItem> {
  frameDetails?: {
    caliber: number;
    bridge: number;
    majorDiagonal: number;
    ringHeight: number;
  };
}

// Actualizar el decorador Component para incluir las importaciones necesarias para Angular 18
@Component({
  selector: "app-add-article",
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterModule,
    ConfirmModalComponent,
    CheckboxComponent,
    FormItemComponent,
    FormFieldComponent,
    ModalComponent,
  ],
  animations: [zoomIn, zoomInList, collapseAnimation()],
  templateUrl: "./add-article.component.html",
  styleUrls: ["./add-article.component.scss"],
})
export class AddArticleComponent {
  @ViewChild("family") private familySelect!: ElementRef;
  private inventoryService = inject(InventoryService);
  private toastService = inject(ToastService);
  private fb = inject(FormBuilder);
  private destroy$ = new Subject<void>();

  protected isChecked = false;
  protected isAllSelected = false;
  protected familySelected = false;
  protected showModal = false;
  protected showAddGroup = false;
  protected isDropdownOpen = false;
  protected selectedArticleType: ArticleTypeKey | null = null;
  protected articleAttributes: ArticleAttributes[] = [];
  protected newItems: InventoryItemWithDetails[] = [];
  protected itemToDelete: InventoryItemWithDetails | undefined;
  protected disabledStyle = {
    "background-color": "#bfbdbd",
    cursor: "not-allowed",
  };

  protected showFrameDetailsColumn = false;

  protected showNameModal = false;
  protected currentFrameAction: "frameType" | "material" | "shape" | null =
    null;
  protected nameForm: FormGroup = this.fb.group({
    name: this.fb.control("", Validators.required),
  });

  protected showDetailsModal = false;
  protected currentFrameItem: InventoryItemWithDetails | null = null;
  protected frameDetailsForm: FormGroup = this.fb.group({
    caliber: this.fb.control(0, [Validators.required, Validators.min(0)]),
    bridge: this.fb.control(0, [Validators.required, Validators.min(0)]),
    majorDiagonal: this.fb.control(0, [Validators.required, Validators.min(0)]),
    ringHeight: this.fb.control(0, [Validators.required, Validators.min(0)]),
  });

  protected articleForm: FormGroup = this.fb.group({
    name: this.fb.control("", Validators.required),
    model: this.fb.control(""),
    brand: this.fb.control(""),
    style: this.fb.control(""),
    isSunglasses: this.fb.control(false),
    price: this.fb.control(0, [Validators.required, Validators.min(0)]),
    currency: this.fb.control(""),
    stock: this.fb.control(0, [Validators.required, Validators.min(0)]),
    lensType: this.fb.control(""),
    productOrigin: this.fb.control(""),
    appliesTo: this.fb.control(""),
  });

  protected groupForm: FormGroup = this.fb.group({
    name: this.fb.control("", Validators.required),
    lensType: this.fb.control("", Validators.required),
    frame: this.fb.control(""),
    material: this.fb.control(""),
    shape: this.fb.control(""),
    sphericalRange: this.fb.group(
      {
        x: this.fb.control(0.0, Validators.required),
        y: this.fb.control(0.0, Validators.required),
      },
      { validators: this.rangeValidator },
    ),
    cylindricalRange: this.fb.group(
      {
        x: this.fb.control(0.0, Validators.required),
        y: this.fb.control(0.0, Validators.required),
      },
      { validators: this.rangeValidator },
    ),
    additionRange: this.fb.group(
      {
        x: this.fb.control(0.0, Validators.required),
        y: this.fb.control(0.0, Validators.required),
      },
      { validators: this.rangeValidator },
    ),
  });

  protected groupControl = this.fb.control("");

  protected articleTypes = Object.values(ArticleTypes).map((type) => ({
    display: type.display,
    value: type.value,
    urlKey: type.urlKey,
  }));

  protected currencies = ["USD", "UYU"];
  protected lensTypes = ["MONOFOCAL", "BIFOCAL", "MULTIFOCAL"];
  protected productsOrigin = ["LABORATORIO", "STOCK"];

  protected commonAttributes = [
    { label: "Nombre", type: "text" },
    { label: "Precio", type: "number" },
    { label: "Moneda", type: "select" },
    { label: "Stock", type: "number" },
  ];

  protected articleAttributesByType: Record<
    ArticleTypeKey,
    ArticleAttributes[]
  > = {
    ["LENS"]: [
      ...this.commonAttributes,
      { label: "Tipo de cristal", type: "select" },
      { label: "Origen", type: "select" },
      { label: "Grupo", type: "select" },
    ],
    ["SERVICE"]: [...this.commonAttributes],
    ["CONTACT_LENSES"]: [...this.commonAttributes],
    ["FRAME"]: [
      { label: "Precio", type: "number" },
      { label: "Moneda", type: "select" },
      { label: "Stock", type: "number" },
      { label: "Modelo", type: "text" },
      { label: "Marca", type: "text" },
      { label: "Estilo", type: "text" },
      { label: "Lentes de sol", type: "checkbox" },
      { label: "Detalles", type: "button" },
    ],
    ["HEARING_AID"]: [...this.commonAttributes],
    ["ACCESSORY"]: [...this.commonAttributes],
    ["TREATMENT"]: [
      ...this.commonAttributes,
      { label: "Aplica a", type: "select" },
    ],
  };

  protected groups: any[] = [];

  protected filteredGroups: any[] = [];

  @HostListener("document:click", ["$event"])
  onDocumentClick(event: MouseEvent): void {
    const dropdown = document.querySelector(".dropdown");
    if (
      dropdown &&
      !dropdown.contains(event.target as Node) &&
      this.isDropdownOpen
    ) {
      this.isDropdownOpen = false;
    }
  }

  toggleDropdown(event?: MouseEvent): void {
    if (event) {
      event.stopPropagation();
    }
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  get isAnyItemSelected(): boolean {
    return this.newItems.some((item) => item.selected);
  }

  get sphericalForm(): FormGroup {
    return this.groupForm.get("sphericalRange") as FormGroup;
  }

  get cylindricalForm(): FormGroup {
    return this.groupForm.get("cylindricalRange") as FormGroup;
  }

  get additionForm(): FormGroup {
    return this.groupForm.get("additionRange") as FormGroup;
  }

  private rangeValidator(group: AbstractControl): ValidationErrors | null {
    const x = group.get("x")?.value;
    const y = group.get("y")?.value;

    return y >= x ? null : { invalidRange: true };
  }

  toBoolean(value: boolean | string | undefined): boolean {
    return value === "true" || value === true;
  }

  private updateFrameDetailsColumn(): void {
    this.showFrameDetailsColumn = this.newItems.some(
      (item) => item.type === "FRAME",
    );
  }

  ngOnInit(): void {
    this.articleForm.get("lensType")?.valueChanges.subscribe((value) => {
      this.filteredGroups = this.groups.filter(
        (group) => group.lensType === value,
      );
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onArticleTypeChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.selectedArticleType = target.value as ArticleTypeKey;

    if (this.selectedArticleType) {
      if (this.selectedArticleType === "LENS") {
        this.inventoryService
          .getGroups()
          .pipe(takeUntil(this.destroy$))
          .subscribe((response) => {
            this.groups = response;

            this.filteredGroups = this.groups.filter(
              (group) =>
                group.lensType === this.articleForm.get("lensType")?.value,
            );
          });
      }

      this.articleAttributes =
        this.articleAttributesByType[this.selectedArticleType] || [];

      this.familySelected = true;
    } else {
      this.articleAttributes = [];
      this.familySelected = false;
    }

    this.resetForm();
  }

  onCheckboxChange(checked: boolean): void {
    this.isChecked = checked;
    this.articleForm.get("isSunglasses")?.setValue(checked);
  }

  openFrameDetailsForm(): void {
    const tempItem: InventoryItemWithDetails = {
      type: "FRAME",
      frameDetails: {
        caliber: 0,
        bridge: 0,
        majorDiagonal: 0,
        ringHeight: 0,
      },
    };

    this.openDetailsModal(tempItem);
  }

  onItemAdd(): void {
    if (this.newItems.length < 10) {
      const formData = this.articleForm.value;

      if (!this.selectedArticleType) {
        this.toastService.showToast({
          message: "Debe seleccionar un tipo de artículo",
          type: "warning",
          showIcon: true,
        });
        return;
      }

      const isArmazonInvalid =
        formData.brand !== "" || formData.model !== "" || formData.style !== "";

      const isItemValid = this.articleForm.valid;

      if (!isItemValid && this.selectedArticleType !== "FRAME") {
        this.toastService.showToast({
          message: "No pueden haber campos vacíos",
          type: "warning",
          showIcon: true,
        });
        return;
      } else if (this.selectedArticleType === "FRAME" && !isArmazonInvalid) {
        this.toastService.showToast({
          message: "Los campos de Armazón no deben estar vacíos",
          type: "warning",
          showIcon: true,
        });
        return;
      }

      const item: InventoryItemWithDetails = {
        name: this.selectedArticleType !== "FRAME" ? formData.name : "-",
        brand: this.selectedArticleType === "FRAME" ? formData.brand : "-",
        model: this.selectedArticleType === "FRAME" ? formData.model : "-",
        style: this.selectedArticleType === "FRAME" ? formData.style : "-",
        isSunglasses:
          this.selectedArticleType === "FRAME" ? formData.isSunglasses : "-",
        lensType: this.selectedArticleType === "LENS" ? formData.lensType : "-",
        origin:
          this.selectedArticleType === "LENS" ? formData.productOrigin : "-",
        price: formData.price,
        currency: formData.currency,
        appliesTo:
          this.selectedArticleType === "TREATMENT" ? formData.appliesTo : "-",
        stock: formData.stock,
        selected: false,
        type: this.selectedArticleType,
      };

      if (this.selectedArticleType === "FRAME") {
        console.log(this.currentFrameItem);
        if (this.currentFrameItem && this.currentFrameItem.frameDetails) {
          item.frameDetails = {
            caliber: this.currentFrameItem?.frameDetails?.caliber,
            bridge: this.currentFrameItem?.frameDetails?.bridge,
            majorDiagonal: this.currentFrameItem?.frameDetails?.majorDiagonal,
            ringHeight: this.currentFrameItem?.frameDetails?.ringHeight,
          };
        }
      }

      this.newItems.push(item);
      this.updateFrameDetailsColumn();
      this.resetForm();
    } else {
      this.toastService.showToast({
        message: "Solo se pueden agregar hasta 10 items a la vez",
        type: "warning",
        showIcon: true,
      });
    }
  }

  onAllItemsCreated(): void {
    const familySelect = this.familySelect.nativeElement as HTMLSelectElement;

    this.familySelected = false;
    this.articleAttributes = [];
    this.newItems = [];
    this.showFrameDetailsColumn = false;
    familySelect.value = "";
    this.resetForm();
    this.toastService.showToast({
      message: "Todos los ítems fueron creados con éxito",
      type: "success",
      showIcon: true,
    });
  }

  onItemsUpload(): void {
    const successfulCreations: any[] = [];

    this.newItems.forEach((item) => {
      const sendData = {
        ...(item.name && { name: item.name }),
        price: item.price,
        currency: item.currency,
        stock: item.stock,
        ...(item.lensType !== "-" && { lensType: item.lensType }),
        ...(item.origin !== "-" && { productOrigin: item.origin }),
        ...(item.model !== "-" && { model: item.model }),
        ...(item.brand !== "-" && { brand: item.brand }),
        ...(item.style !== "-" && { style: item.style }),
        ...(item.isSunglasses !== "-" && { isSunglasses: item.isSunglasses }),
        ...(item.appliesTo !== "-" && { appliesTo: item.appliesTo }),
        ...(item.type === "FRAME" &&
          item.frameDetails && {
            details: {
              caliber: item.frameDetails.caliber,
              bridge: item.frameDetails.bridge,
              majorDiagonal: item.frameDetails.majorDiagonal,
              ringHeight: item.frameDetails.ringHeight,
            },
          }),
      };

      const articleType =
        item.type && getUrlKeyByKey(item.type as ArticleTypeKey);

      if (articleType) {
        this.inventoryService
          .createItem(sendData, articleType)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (result: any) => {
              successfulCreations.push(item);
              if (successfulCreations.length === this.newItems.length) {
                if (this.groupControl.value !== "") {
                  this.inventoryService
                    .addLensToGroup(this.groupControl.value!, result._id)
                    .pipe(takeUntil(this.destroy$))
                    .subscribe();
                }
                this.onAllItemsCreated();
              }
            },
            error: () => {
              this.toastService.showToast({
                message: "Error al agregar item",
                type: "error",
                showIcon: true,
              });
            },
          });
      }
    });
  }

  onGroupAdd(): void {
    if (this.groupForm.valid) {
      this.inventoryService
        .createGroup({
          groupName: this.groupForm.value.name,
          lensType: this.groupForm.value.lensType,
          frame: this.groupForm.value.frame,
          material: this.groupForm.value.material,
          shape: this.groupForm.value.shape,
          sphericalRange: this.sphericalForm.value,
          cylindricalRange: this.cylindricalForm.value,
          additionRange: this.additionForm.value,
        })
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.groupForm.reset({
              name: "",
              lensType: "",
              frame: "",
              material: "",
              shape: "",
              sphericalRange: {
                x: 0,
                y: 0,
              },
              cylindricalRange: {
                x: 0,
                y: 0,
              },
              additionRange: {
                x: 0,
                y: 0,
              },
            });

            this.toastService.showToast({
              message: "Grupo creado con éxito",
              type: "success",
              showIcon: true,
            });
          },
          error: () => {
            this.toastService.showToast({
              message: "Error al crear grupo",
              type: "error",
              showIcon: true,
            });
          },
        });
    } else {
      this.toastService.showToast({
        message: "El formulario contiene errores. Revisa los campos.",
        type: "warning",
        showIcon: true,
      });
    }
  }

  onSelect(item: InventoryItemWithDetails): void {
    item.selected = !item.selected;
  }

  onSelectAll(): void {
    this.isAllSelected = !this.isAllSelected;
    this.newItems.forEach((newItem) => (newItem.selected = this.isAllSelected));
  }

  onDeleteItem(itemToRemove: InventoryItemWithDetails): void {
    this.newItems = this.newItems.filter((item) => item !== itemToRemove);
    this.updateFrameDetailsColumn();
  }

  onDeleteAllSelected(): void {
    this.newItems = this.newItems.filter((item) => !item.selected);
    this.updateFrameDetailsColumn();
  }

  handleDelete(action: "single" | "multiple", item?: any): void {
    if (action === "single" && item) {
      this.itemToDelete = item;
    } else if (action === "multiple") {
      this.itemToDelete = undefined;
    }
    this.showModal = true;
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

  handleAddGroup() {
    this.showAddGroup = !this.showAddGroup;
  }

  handleAddFrameType(): void {
    this.isDropdownOpen = false;
    this.currentFrameAction = "frameType";
    this.showNameModal = true;
  }

  handleAddMaterial(): void {
    this.isDropdownOpen = false;
    this.currentFrameAction = "material";
    this.showNameModal = true;
  }

  handleAddShape(): void {
    this.isDropdownOpen = false;
    this.currentFrameAction = "shape";
    this.showNameModal = true;
  }

  handleNameSubmit(): void {
    if (this.nameForm.valid) {
      const name = this.nameForm.get("name")?.value;

      switch (this.currentFrameAction) {
        case "frameType":
          this.toastService.showToast({
            message: `Tipo de armazón "${name}" agregado`,
            type: "success",
            showIcon: true,
          });
          break;
        case "material":
          this.toastService.showToast({
            message: `Material "${name}" agregado`,
            type: "success",
            showIcon: true,
          });
          break;
        case "shape":
          this.toastService.showToast({
            message: `Forma "${name}" agregado`,
            type: "success",
            showIcon: true,
          });
          break;
      }

      this.nameForm.reset();
      this.showNameModal = false;
      this.currentFrameAction = null;
    } else {
      this.toastService.showToast({
        message: "El nombre es requerido",
        type: "warning",
        showIcon: true,
      });
    }
  }

  closeNameModal(): void {
    this.showNameModal = false;
    this.currentFrameAction = null;
    this.nameForm.reset();
  }

  openDetailsModal(item: InventoryItemWithDetails): void {
    this.currentFrameItem = item;

    this.frameDetailsForm.patchValue({
      caliber: item.frameDetails?.caliber || 0,
      bridge: item.frameDetails?.bridge || 0,
      majorDiagonal: item.frameDetails?.majorDiagonal || 0,
      ringHeight: item.frameDetails?.ringHeight || 0,
    });

    this.showDetailsModal = true;
  }

  closeDetailsModal(): void {
    this.showDetailsModal = false;
    this.frameDetailsForm.reset({
      caliber: 0,
      bridge: 0,
      majorDiagonal: 0,
      ringHeight: 0,
    });
  }

  saveFrameDetails(): void {
    if (this.frameDetailsForm.valid) {
      const formValues = this.frameDetailsForm.value;

      if (this.currentFrameItem) {
        if (!this.currentFrameItem.frameDetails) {
          this.currentFrameItem.frameDetails = {
            caliber: 0,
            bridge: 0,
            majorDiagonal: 0,
            ringHeight: 0,
          };
        }

        this.currentFrameItem.frameDetails.caliber = formValues.caliber;
        this.currentFrameItem.frameDetails.bridge = formValues.bridge;
        this.currentFrameItem.frameDetails.majorDiagonal =
          formValues.majorDiagonal;
        this.currentFrameItem.frameDetails.ringHeight = formValues.ringHeight;

        this.toastService.showToast({
          message: "Detalles guardados correctamente",
          type: "success",
          showIcon: true,
        });
      } else {
        this.toastService.showToast({
          message: "Detalles configurados correctamente",
          type: "success",
          showIcon: true,
        });
      }

      this.closeDetailsModal();
    } else {
      this.toastService.showToast({
        message: "Por favor complete todos los campos correctamente",
        type: "warning",
        showIcon: true,
      });
    }
  }

  resetForm(): void {
    this.isChecked = false;
    this.articleForm.reset({
      name: "",
      model: "",
      brand: "",
      style: "",
      isSunglasses: false,
      price: 0,
      currency: "UYU",
      stock: 0,
      lensType: "MONOFOCAL",
      productOrigin: "STOCK",
    });
  }
}
