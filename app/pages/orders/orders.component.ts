import { Component, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import {
  FormBuilder,
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { CdkDrag } from "@angular/cdk/drag-drop";
import {
  debounceTime,
  distinctUntilChanged,
  forkJoin,
  of,
  Subject,
  switchMap,
  takeUntil,
} from "rxjs";
import { InventoryService } from "../../services/inventory.service";
import { OrdersService } from "../../services/orders.service";
import { ToastService } from "../../services/toast.service";
import { Article } from "../../interfaces/article.interface";
import { BenefitClient } from "../../interfaces/benefit-client.interface";
import { Prescription } from "../../interfaces/prescription.interface";
import { CheckboxComponent } from "../../layout/checkbox/checkbox.component";
import { ConfirmModalComponent } from "../../layout/modal/modal.component";
import { FormFieldComponent } from "../../layout/form-field/form-field.component";
import { FormItemComponent } from "../../layout/form-item/form-item.component";
import { ModalComponent } from "./modal/modal.component";
import { PrescriptionComponent } from "./prescription/prescription.component";
import { AdministrateService } from "../../services/administrate.service";
import { OrderItem } from "../../interfaces/order.item.interface";
import { OrderArticle } from "../../interfaces/order.article.interface";
import { SearchSelectComponent } from "../../layout/search-select/search-select.component";
import { AuthService } from "../../services/auth.service";
import { BillerService } from "../../services/biller.service";

enum PaymentType {
  BankTransfer = "BANK_TRANSFER",
  Cash = "CASH",
  CreditCard = "CREDIT_CARD",
  DebitCard = "DEBIT_CARD",
}

interface ModalStates {
  showSaleModal: boolean;
  showBenefitModal: boolean;
  showDeleteModal: boolean;
  showDetailDrag: boolean;
  showPrintModal: boolean;
}

const clientFieldNames: Record<string, string> = {
  name: "Nombre",
  lastName: "Apellido",
  email: "Correo electrónico",
  phoneNumber: "Teléfono",
  address: "Dirección",
  document: "Documento",
};

const orderFieldNames: Record<string, string> = {
  paymentType: "Tipo de pago",
  balance: "Saldo",
  cost: "Costo",
  total: "Total",
};

@Component({
  selector: "app-orders",
  standalone: true,
  imports: [
    CdkDrag,
    CheckboxComponent,
    CommonModule,
    ConfirmModalComponent,
    FormFieldComponent,
    FormItemComponent,
    FormsModule,
    ModalComponent,
    PrescriptionComponent,
    ReactiveFormsModule,
    SearchSelectComponent,
  ],
  templateUrl: "./orders.component.html",
  styleUrls: ["./orders.component.scss"],
})
export class OrdersComponent {
  /**
   * Variable declaration
   */

  // 1. Services and Dependencies
  private fb = inject(FormBuilder);
  private toastService = inject(ToastService);
  private inventoryService = inject(InventoryService);
  private ordersService = inject(OrdersService);
  private adminService = inject(AdministrateService);
  private authService = inject(AuthService);
  private billingService = inject(BillerService);

  // 2. Subjects
  private destroy$: any = new Subject<void>();
  protected resetSubject$ = new Subject<void>();

  // 3. Constants
  protected pageSize: number = 100;
  protected receiptNumber: string = "";
  protected today: Date = new Date();
  protected categories: string[] = ["frame", "lens1", "lens2", "other"];
  protected paymentTypes: PaymentType[] = Object.values(PaymentType);
  protected paymentTypeToString: { [key in PaymentType]: string } = {
    [PaymentType.CreditCard]: "Tarjeta de Crédito",
    [PaymentType.DebitCard]: "Tarjeta de Débito",
    [PaymentType.BankTransfer]: "Transferencia Bancaria",
    [PaymentType.Cash]: "Efectivo",
  };
  protected windowLocation = window.location.origin;

  // 4. Flags
  protected isAllSelected: boolean = false;
  protected showSaleModal: boolean = false;
  protected showBenefitModal: boolean = false;
  protected showDeleteModal: boolean = false;
  protected showDetailDrag: boolean = false;
  protected showPrintModal: boolean = false;

  // 5. State variables
  protected toggleForm: "FAR" | "NEAR" = "FAR";
  protected selectedSale: string = "";
  protected selectedDoctor: string = "";
  protected addition!: FormControl;
  protected selectedBenefit!: FormControl;
  protected selectedLensType!: FormControl;
  protected clientForm!: FormGroup;
  protected orderForm!: FormGroup;
  protected prescriptionForm!: FormGroup;
  protected selectedArticlesForm!: FormGroup;
  protected detailsForm!: FormGroup;

  // 6. Data structures
  protected displayItems: Partial<OrderItem>[] = [];
  protected subOrders: {
    prescription: Prescription;
    articles: OrderArticle[];
  }[] = [];
  protected benefits: BenefitClient[] = [];
  protected appliedBenefits: BenefitClient[] = [];
  protected doctors: any[] = [];

  // 7. Styles
  protected disabledStyle = {
    "background-color": "#bfbdbd",
    cursor: "not-allowed",
  };

  // 8. Current user
  protected user: any | undefined;

  /**
   * Function declaration
   */

  // 1. Getters
  get isAnyItemSelected(): boolean {
    return this.displayItems.some((item) => item.selected);
  }

  get isFrameDisabled(): boolean {
    return (
      this.frameValue?.style?.toUpperCase() !== "TRAE" &&
      this.frameValue?.style?.toUpperCase() !== "TRAJO"
    );
  }

  get farAndNearForms(): { far: FormGroup; near: FormGroup } {
    return {
      far: this.prescriptionForm.get("far") as FormGroup,
      near: this.prescriptionForm.get("near") as FormGroup,
    };
  }

  get frameValue(): Article {
    return this.selectedArticlesForm.get("frame")?.value;
  }

  get control(): FormControl {
    return this.selectedArticlesForm.get("other") as FormControl;
  }

  // 2. Private
  private createEyeGroup(): FormGroup {
    return this.fb.group({
      spherical: [0.0, [Validators.required]],
      cylindrical: [0.0, [Validators.required]],
      axis: [
        0.0,
        [Validators.required, Validators.min(0.0), Validators.max(179.0)],
      ],
      pupilHeight: [0.0, [Validators.required]],
      pupilDistance: [0.0, [Validators.required]],
    });
  }

  private loadBenefits(): void {
    this.ordersService
      .getBenefits()
      .pipe(takeUntil(this.destroy$))
      .subscribe((response) => {
        if (response.length > 0) {
          this.benefits = response.map((benefit: BenefitClient) => ({
            _id: benefit._id,
            name: benefit.name,
            discountedValue: benefit.discountedValue,
            isActive: benefit.isActive,
          }));
        }
      });
  }

  private loadDoctors(): void {
    this.ordersService.getDoctors().subscribe((response) => {
      this.doctors = response;
    });
  }

  private initializeForms(): void {
    this.selectedBenefit = this.fb.control("");
    this.orderForm = this.fb.group({
      paymentAmount: [0, Validators.min(0)],
      deposit: [0, Validators.min(0)],
      paymentType: ["", Validators.required],
      depositType: [""],
      balance: [0, [Validators.required, Validators.min(0)]],
      cost: [0, [Validators.required, Validators.min(0)]],
      total: [0, [Validators.required, Validators.min(0)]],
      discount: [0, Validators.min(0)],
      doctor: [""],
      articles: [[]],
    });

    this.clientForm = this.fb.group({
      email: ["", [Validators.required, Validators.email]],
      name: ["", [Validators.required]],
      lastName: ["", [Validators.required]],
      document: ["", { validators: [Validators.required], updateOn: "change" }],
      phoneNumber: ["", [Validators.required]],
      address: ["", [Validators.required]],
    });

    this.prescriptionForm = this.fb.group({
      near: this.fb.group({
        leftEye: this.createEyeGroup(),
        rightEye: this.createEyeGroup(),
      }),
      far: this.fb.group({
        leftEye: this.createEyeGroup(),
        rightEye: this.createEyeGroup(),
      }),
      observations: [""],
    });

    this.detailsForm = this.fb.group({
      material: [""],
      shape: [""],
      frameType: [""],
      caliber: [""],
      bridge: [""],
      majorDiagonal: [""],
      arcHeight: [""],
    });

    const controls: any = {};

    this.categories.forEach((category) => {
      controls[category] = ["", Validators.required];
    });

    this.selectedArticlesForm = this.fb.group(controls);

    this.selectedLensType = this.fb.control("");

    this.addition = this.fb.control(0.0, [
      Validators.min(0.0),
      Validators.max(8.0),
    ]);
  }

  private generateOrderNumber(): string {
    const letter = String.fromCharCode(65 + Math.floor(Math.random() * 26));

    const minDigits = 4;
    const maxDigits = 8;
    const digitCount =
      Math.floor(Math.random() * (maxDigits - minDigits + 1)) + minDigits;

    const max = Math.pow(10, digitCount);
    const number = Math.floor(Math.random() * max);
    const paddedNumber = number.toString().padStart(digitCount, "0");

    return `${letter}${paddedNumber}`;
  }

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

  // 3. Public
  public getHasArticleType(articleType: string): boolean {
    const articles = this.orderForm.get("articles")?.value?.articles;
    return (
      Array.isArray(articles) &&
      articles.some((article) => article.type === articleType)
    );
  }

  public getControl(name: string): FormControl {
    return this.selectedArticlesForm.get(name) as FormControl;
  }

  public getTotalDiscountedValue(benefits: BenefitClient[]): number {
    return benefits.reduce(
      (total, benefit) => total + benefit.discountedValue,
      0,
    );
  }

  public getLens(order: any, eye: "OD" | "OI"): string {
    const article = order.articles.find((a: any) => a.lensPosition === eye);
    return article
      ? `${article.lensType ?? ""} ${article.name ?? ""}`.trim()
      : "N/A";
  }

  public toBoolean(value: boolean | string | undefined): boolean {
    return value === "true" || value === true;
  }

  public formatBenefits(benefits: BenefitClient[]): string {
    return benefits.map((b) => b.name).join(" + ");
  }

  public updateCost(): void {
    const selectedArticles: OrderArticle[] =
      this.orderForm.get("articles")?.value || [];

    const baseCost = selectedArticles.reduce((total, { article, quantity }) => {
      const price = article?.price ?? 0;
      return total + price * (quantity ?? 1);
    }, 0);

    const subOrdersCost = Array.isArray(this.subOrders)
      ? this.subOrders.reduce((total, subOrder) => {
          const articles = subOrder.articles || [];
          return (
            total +
            articles.reduce((subTotal, { article, quantity }) => {
              const price = article?.price ?? 0;
              return subTotal + price * (quantity ?? 1);
            }, 0)
          );
        }, 0)
      : 0;

    const newCost = baseCost + subOrdersCost;

    this.orderForm.patchValue({ cost: newCost }, { emitEvent: true });
  }

  public resetOrder(): void {
    this.isAllSelected = false;
    this.selectedSale = "";
    this.toggleForm = "FAR";
    this.displayItems = [];
    this.subOrders = [];
    this.appliedBenefits = [];

    this.clientForm.reset({
      email: "",
      name: "",
      lastName: "",
      document: "",
      phoneNumber: "",
      address: "",
    });

    this.orderForm.reset({
      paymentAmount: 0,
      deposit: 0,
      paymentType: "",
      depositType: "",
      balance: 0,
      cost: 0,
      total: 0,
      discount: 0,
      articles: [],
      doctor: "",
    });

    this.prescriptionForm.reset({
      near: {
        leftEye: {
          spherical: 0.0,
          cylindrical: 0.0,
          axis: 0.0,
          pupilHeight: 0.0,
          pupilDistance: 0.0,
        },
        rightEye: {
          spherical: 0.0,
          cylindrical: 0.0,
          axis: 0.0,
          pupilHeight: 0.0,
          pupilDistance: 0.0,
        },
      },
      far: {
        leftEye: {
          spherical: 0.0,
          cylindrical: 0.0,
          axis: 0.0,
          pupilHeight: 0.0,
          pupilDistance: 0.0,
        },
        rightEye: {
          spherical: 0.0,
          cylindrical: 0.0,
          axis: 0.0,
          pupilHeight: 0.0,
          pupilDistance: 0.0,
        },
      },
      observations: "",
    });

    this.detailsForm.reset({
      material: "",
      shape: "",
      frameType: "",
      caliber: "",
      bridge: "",
      majorDiagonal: "",
      arcHeight: "",
    });

    this.selectedArticlesForm.reset({
      frame: "",
      lens1: "",
      lens2: "",
      other: "",
    });

    this.selectedLensType.reset("");

    this.updateCost();
  }

  public filterArticles(articles: Article[], articleType: string) {
    return articles.filter((article) => article.type === articleType);
  }

  public ngOnInit(): void {
    this.initializeForms();
    this.loadBenefits();
    this.loadDoctors();

    this.receiptNumber = this.generateOrderNumber();
    const documentControl = this.clientForm.get("document");
    let lastAddition = this.addition.value || 0;

    if (documentControl) {
      documentControl.valueChanges
        .pipe(
          debounceTime(150),
          distinctUntilChanged(),
          takeUntil(this.destroy$),
        )
        .subscribe((document: string) => {
          if (document === "") {
            this.clientForm.patchValue({
              document: "",
              email: "",
              name: "",
              lastName: "",
              phoneNumber: "",
              address: "",
            });

            this.clientForm.get("document")?.updateValueAndValidity();
            return;
          }

          if (!document) return;

          this.ordersService.getClient(document).subscribe({
            next: (client: any) => {
              if (client) {
                this.clientForm.patchValue({
                  document,
                  email: client.email || "",
                  name: client.name || "",
                  lastName: client.lastName || "",
                  phoneNumber: client.phoneNumber || "",
                  address: client.address || "",
                });
              } else {
                this.clientForm.patchValue({
                  email: "",
                  name: "",
                  lastName: "",
                  phoneNumber: "",
                  address: "",
                });
              }

              this.clientForm.updateValueAndValidity();
            },
            error: (err) => {
              console.error("Error al obtener el cliente", err);
            },
          });
        });
    }

    this.orderForm.valueChanges.subscribe(
      ({ cost, deposit, discount, paymentAmount }) => {
        let adjustedTotal = (cost || 0) - (deposit || 0);

        if (this.appliedBenefits && Array.isArray(this.appliedBenefits)) {
          this.appliedBenefits.forEach((benefit) => {
            if (benefit.isActive && benefit.discountedValue) {
              adjustedTotal -= benefit.discountedValue;
            }
          });
        }

        this.orderForm.patchValue(
          { total: Math.max(0, adjustedTotal) },
          { emitEvent: false },
        );

        this.orderForm.patchValue(
          {
            balance: adjustedTotal - (paymentAmount || 0) - (discount || 0),
          },
          { emitEvent: false },
        );
      },
    );

    this.prescriptionForm.get("far")?.valueChanges.subscribe((farValues) => {
      const nearGroup = this.prescriptionForm.get("near") as FormGroup;

      ["leftEye", "rightEye"].forEach((eye) => {
        const farEyeGroup = farValues[eye];
        const nearEyeGroup = nearGroup.get(eye) as FormGroup;
        Object.keys(farEyeGroup).forEach((key) => {
          nearEyeGroup
            .get(key)
            ?.setValue(farEyeGroup[key], { emitEvent: false });
        });
      });

      const leftEyeControl = this.prescriptionForm.get(
        "near.leftEye.spherical",
      );
      const rightEyeControl = this.prescriptionForm.get(
        "near.rightEye.spherical",
      );
      if (leftEyeControl) {
        leftEyeControl.setValue((leftEyeControl.value || 0) + lastAddition, {
          emitEvent: false,
        });
      }
      if (rightEyeControl) {
        rightEyeControl.setValue((rightEyeControl.value || 0) + lastAddition, {
          emitEvent: false,
        });
      }
    });

    this.addition.valueChanges.subscribe((newAddition: number) => {
      const leftEyeControl = this.prescriptionForm.get(
        "near.leftEye.spherical",
      );
      const rightEyeControl = this.prescriptionForm.get(
        "near.rightEye.spherical",
      );

      if (leftEyeControl) {
        const currentLeft = leftEyeControl.value || 0;
        leftEyeControl.setValue(currentLeft - lastAddition + newAddition, {
          emitEvent: false,
        });
      }
      if (rightEyeControl) {
        const currentRight = rightEyeControl.value || 0;
        rightEyeControl.setValue(currentRight - lastAddition + newAddition, {
          emitEvent: false,
        });
      }
      lastAddition = newAddition;
    });

    this.prescriptionForm
      .get("near.leftEye.spherical")
      ?.valueChanges.subscribe((leftEyeValue) => {
        const leftEyeControl = this.prescriptionForm.get(
          "near.leftEye.spherical",
        );

        if (leftEyeValue !== undefined) {
          const updatedLeftValue = leftEyeValue + lastAddition;
          leftEyeControl!.setValue(updatedLeftValue, { emitEvent: false });
        }
      });

    this.prescriptionForm
      .get("near.rightEye.spherical")
      ?.valueChanges.subscribe((rightEyeValue) => {
        const rightEyeControl = this.prescriptionForm.get(
          "near.rightEye.spherical",
        );

        if (rightEyeValue !== undefined) {
          const updatedRightValue = rightEyeValue + lastAddition;
          rightEyeControl!.setValue(updatedRightValue, { emitEvent: false });
        }
      });

    this.authService.user$.pipe(takeUntil(this.destroy$)).subscribe((user) => {
      this.user = user || {};
    });
  }

  public ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  public handleModal(modal: keyof ModalStates): void {
    this[modal] = !this[modal];
  }

  public handlePrintModal(): void {
    if (this.clientForm.invalid || this.orderForm.invalid) {
      Object.entries(this.clientForm.controls).forEach(([key, control]) => {
        if (control.invalid) {
          const fieldName = clientFieldNames[key] || key;
          this.toastService.showToast({
            message: `${fieldName} no puede estar vacío`,
            type: "warning",
            showIcon: true,
          });
        }
      });

      Object.entries(this.orderForm.controls).forEach(([key, control]) => {
        if (control.invalid) {
          const fieldName = orderFieldNames[key] || key;
          this.toastService.showToast({
            message: `${fieldName} no puede estar vacío`,
            type: "warning",
            showIcon: true,
          });
        }
      });
    }

    if (this.clientForm.valid && this.orderForm.valid) {
      this.showPrintModal = !this.showPrintModal;

      if (this.showPrintModal) {
        this.onSendPrescriptions();
      } else {
        this.resetOrder();
      }
    }
  }

  public handleDeleteModal(result: boolean): void {
    if (result) {
      this.onDeleteAllSelected();
    }
    this.showDeleteModal = false;
  }

  public onSelect(option: string) {
    this.selectedSale = option;

    this.selectedArticlesForm.reset({
      frame: "",
      lens1: "",
      lens2: "",
      other: "",
    });

    this.detailsForm.reset({
      material: "",
      shape: "",
      frameType: "",
      caliber: "",
      bridge: "",
      majorDiagonal: "",
      arcHeight: "",
    });

    this.prescriptionForm.reset({
      near: {
        leftEye: {
          spherical: 0.0,
          cylindrical: 0.0,
          axis: 0.0,
          pupilHeight: 0.0,
          pupilDistance: 0.0,
        },
        rightEye: {
          spherical: 0.0,
          cylindrical: 0.0,
          axis: 0.0,
          pupilHeight: 0.0,
          pupilDistance: 0.0,
        },
      },
      far: {
        leftEye: {
          spherical: 0.0,
          cylindrical: 0.0,
          axis: 0.0,
          pupilHeight: 0.0,
          pupilDistance: 0.0,
        },
        rightEye: {
          spherical: 0.0,
          cylindrical: 0.0,
          axis: 0.0,
          pupilHeight: 0.0,
          pupilDistance: 0.0,
        },
      },
      observations: "",
    });
  }

  public onSelectAll(): void {
    this.isAllSelected = !this.isAllSelected;
    this.displayItems.forEach((item) => (item.selected = this.isAllSelected));
  }

  public onAdd(): void {
    const selectedArticles: Article[] = Object.values(
      this.selectedArticlesForm.controls,
    )
      .map((control) => control.value)
      .filter(Boolean);

    if (selectedArticles.length === 0) {
      this.toastService.showToast({
        message: "Debes de seleccionar al menos un articulo",
        type: "warning",
        showIcon: true,
      });
      return;
    }

    const quantityMap = (articles: Article[]): OrderArticle[] => {
      const map = articles.reduce<{ [key: string]: OrderArticle }>(
        (acc, article) => {
          const id = article._id;
          if (!id) return acc;

          if (acc[id]) {
            acc[id].quantity += 1;
          } else {
            acc[id] = { article, quantity: 1 };
          }

          return acc;
        },
        {},
      );

      return Object.values(map);
    };

    if (this.selectedSale !== "LENSES") {
      const previousArticles: OrderArticle[] =
        this.orderForm.get("articles")?.value || [];

      const combined = [...previousArticles, ...quantityMap(selectedArticles)];

      const processedIds = new Set<string>();
      const newDisplayItems: OrderItem[] = combined.reduce<OrderItem[]>(
        (acc, item, index) => {
          const article = item.article;
          const id = article._id;
          if (!id) return acc;

          if (processedIds.has(id)) {
            return acc;
          }

          const existingItem = this.displayItems.find(
            (displayItem) => displayItem.objectId === id,
          );
          if (existingItem) {
            const available = article.stock;

            const increment = Math.min(1, available - existingItem.quantity!);
            if (increment > 0) {
              existingItem.quantity! += increment;
              existingItem.price = article.price * existingItem.quantity!;
            }
            processedIds.add(id);
            return acc;
          }

          acc.push({
            id: index + 1,
            objectId: id,
            name: article.type !== "Frame" ? article.name : "-",
            brand: this.getDisplayValue(article, "brand"),
            model: this.getDisplayValue(article, "model"),
            style: this.getDisplayValue(article, "style"),
            price: article.price,
            stock: article.stock,
            quantity: item.quantity,
            selected: false,
          });
          processedIds.add(id);

          return acc;
        },
        [],
      );

      const updatedArticles = [...previousArticles];
      quantityMap(selectedArticles).forEach((newOrderArticle) => {
        const existingIndex = updatedArticles.findIndex(
          (article: OrderArticle) =>
            article.article._id === newOrderArticle.article._id,
        );

        if (existingIndex > -1) {
          updatedArticles[existingIndex].quantity += newOrderArticle.quantity;
        } else {
          updatedArticles.push(newOrderArticle);
        }
      });

      this.orderForm.get("articles")?.setValue(updatedArticles);
      this.displayItems.push(...newDisplayItems);
      this.updateCost();
      this.resetSubject$.next();
      return;
    }

    if (this.selectedLensType.value === "") {
      this.toastService.showToast({
        message: "Debes de seleccionar un tipo de lente",
        type: "warning",
        showIcon: true,
      });
      return;
    }

    const prescriptionData = {
      document: this.clientForm.get("document")?.value,
      ...(this.selectedLensType.value === "MONOFOCAL_CERCA" && {
        near: {
          leftEye: this.prescriptionForm.get("near.leftEye")?.value,
          rightEye: this.prescriptionForm.get("near.rightEye")?.value,
        },
      }),
      ...(this.selectedLensType.value === "MONOFOCAL_LEJOS" && {
        far: {
          leftEye: this.prescriptionForm.get("far.leftEye")?.value,
          rightEye: this.prescriptionForm.get("far.rightEye")?.value,
        },
      }),
      observation: this.prescriptionForm.get("observations")?.value,
    };

    const subOrderArticles: OrderArticle[] = quantityMap(selectedArticles);

    const newSubOrder = {
      prescription: prescriptionData,
      articles: subOrderArticles,
    };

    this.subOrders = this.subOrders || [];
    this.subOrders.push(newSubOrder);

    const mappedItems: Partial<OrderItem>[] = subOrderArticles.map(
      (orderArticle, index) => {
        const article = orderArticle.article;
        return {
          id: index + 1,
          objectId: article._id!,
          name: article.type !== "Frame" ? article.name : "-",
          brand: this.getDisplayValue(article, "brand"),
          model: this.getDisplayValue(article, "model"),
          style: this.getDisplayValue(article, "style"),
          price: article.price,
          stock: article.stock,
          quantity: orderArticle.quantity,
          selected: false,
        };
      },
    );

    mappedItems.forEach((mappedItem) => {
      const existingItem = this.displayItems.find(
        (displayItem) => displayItem.objectId === mappedItem.objectId,
      );
      if (existingItem && typeof existingItem.quantity === "number") {
        const available = mappedItem.stock;
        const newQuantity = existingItem.quantity + mappedItem.quantity!;

        existingItem.quantity =
          newQuantity > available! ? available : newQuantity;
        existingItem.price = mappedItem.price! * existingItem.quantity!;
      } else {
        mappedItem.quantity = Math.min(mappedItem.quantity!, mappedItem.stock!);
        mappedItem.price = mappedItem.price! * mappedItem.quantity;
        this.displayItems.push(mappedItem);
      }
    });

    this.resetSubject$.next();
    this.updateCost();

    this.selectedArticlesForm.reset({
      frame: "",
      lens1: "",
      lens2: "",
      other: "",
    });

    this.detailsForm.reset({
      material: "",
      shape: "",
      frameType: "",
      caliber: "",
      bridge: "",
      majorDiagonal: "",
      arcHeight: "",
    });

    this.prescriptionForm.get("observations")?.reset("");
  }

  public onAddBenefit(benefitNewValue: any, orderNumber: any): void {
    if (!this.selectedBenefit.value) {
      this.toastService.showToast({
        message: "Debes de seleccionar un beneficio",
        type: "warning",
        showIcon: true,
      });

      return;
    }

    const isBenefitApplied = this.appliedBenefits.some(
      (benefit) => benefit.name === this.selectedBenefit.value.name,
    );

    if (isBenefitApplied) {
      this.toastService.showToast({
        message: "Este beneficio ya esta aplicado",
        type: "warning",
        showIcon: true,
      });
      return;
    }

    this.appliedBenefits.push({
      ...this.selectedBenefit.value,
      discountedValue: benefitNewValue.value,
    });
    this.selectedBenefit.reset("");
    this.orderForm.get("total")?.updateValueAndValidity();
  }

  public onRemoveBenefit(benefitToRemove: BenefitClient) {
    this.appliedBenefits = this.appliedBenefits.filter(
      (benefit) => benefit.name !== benefitToRemove.name,
    );

    this.updateCost();
  }

  public onDeleteAllSelected(): void {
    const selectedIds = this.displayItems
      .filter((item) => item.selected)
      .map((item) => item.objectId);

    this.displayItems = this.displayItems.filter((item) => !item.selected);

    const currentArticles: OrderArticle[] =
      this.orderForm.get("articles")?.value || [];
    const filteredArticles = currentArticles.filter(
      (orderArticle) => !selectedIds.includes(orderArticle.article._id),
    );
    this.orderForm.get("articles")?.setValue(filteredArticles);

    this.subOrders = (this.subOrders || [])
      .map((subOrder) => {
        const filteredSubOrderArticles = subOrder.articles.filter(
          (orderArticle: OrderArticle) =>
            !selectedIds.includes(orderArticle.article._id),
        );
        return {
          ...subOrder,
          articles: filteredSubOrderArticles,
        };
      })
      .filter((subOrder) => subOrder.articles.length > 0);

    this.updateCost();
  }

  public onSendPrescriptions(): void {
    if (this.subOrders.length === 0) {
      this.onSendOrder([]);
      return;
    }

    const prescriptionUploads = this.subOrders.map((subOrder) =>
      this.ordersService.createPrescription({
        ...subOrder.prescription,
        document: this.clientForm.value.document,
      }),
    );

    forkJoin(prescriptionUploads)
      .pipe(takeUntil(this.destroy$))
      .subscribe((responses) => {
        const subOrders = responses.map((res: any, index: number) => ({
          prescription: res.id,
          articles: this.subOrders[index].articles,
        }));

        this.onSendOrder(subOrders);
      });
  }

  public onSendOrder(subOrders: any[]): void {
    const newClient = {
      email: this.clientForm.value.email,
      name: this.clientForm.value.name,
      lastName: this.clientForm.value.lastName,
      document: this.clientForm.value.document,
      phoneNumber: this.clientForm.value.phoneNumber,
      address: this.clientForm.value.address,
    };

    this.ordersService
      .getClient(newClient.document)
      .pipe(
        switchMap((client: any) => {
          if (client) {
            return of(client);
          } else {
            return this.adminService.createClient(newClient);
          }
        }),
        takeUntil(this.destroy$),
      )
      .subscribe((client: any) => {
        const sendData: any = {
          client: client._id,
          orderNumber: this.receiptNumber,
          state: "REGISTERED",
          billing: {
            total: this.orderForm.value.total,
            deposit: this.orderForm.value.deposit,
            paymentType: this.orderForm.value.paymentType,
            cost: this.orderForm.value.cost,
            benefits: this.appliedBenefits.map((benefit) => benefit._id),
            balance: this.orderForm.value.balance,
            discount: this.orderForm.value.discount,
            paymentAmount: this.orderForm.value.paymentAmount,
            ...(this.orderForm.value.depositType !== "" && {
              depositType: this.orderForm.value.depositType,
            }),
          },
          articles: this.orderForm.value.articles,
          owner: this.user.username,
          ...(subOrders.length > 0 && { subOrders: subOrders }),
          ...(this.selectedDoctor !== "" &&
            subOrders.length > 0 && { doctor: this.selectedDoctor }),
          ...(this.detailsForm.dirty && { details: this.detailsForm.value }),
        };

        this.ordersService
          .createOrder(sendData)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => {
              const allArticles = [
                ...sendData.articles,
                ...subOrders.flatMap((subOrder) => subOrder.articles || []),
              ];

              allArticles.forEach(({ article, quantity }) => {
                if (article && typeof article.stock === "number") {
                  article.stock -= quantity;
                }

                this.inventoryService
                  .updateArticle(article._id, article)
                  .subscribe();
              });

              this.billingService
                .emitirComprobante({
                  tipo_comprobante: 101,
                  sucursal: {
                    direccion: this.clientForm.value.address,
                    ciudad: "Montevideo",
                    departamento: "Montevideo",
                    pais: "Uruguay",
                    emails: [],
                  },
                  cliente: {
                    tipo_documento: 3,
                    documento: this.clientForm.value.document,
                    pais: "UY",
                    nombre_fantasia: `${this.clientForm.value.name} ${this.clientForm.value.lastName}`,
                  },
                  items: [],
                })
                .pipe(takeUntil(this.destroy$))
                .subscribe((response) => {
                  console.log(response);
                });

              this.toastService.showToast({
                message: "Orden creada con éxito",
                type: "success",
                showIcon: true,
              });
            },
            error: () => {
              this.toastService.showToast({
                message: "Error al crear orden",
                type: "error",
                showIcon: true,
              });
            },
          });
      });
  }
}
