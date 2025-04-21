import { Component, inject } from "@angular/core";
import { ActivatedRoute, Router, RouterModule } from "@angular/router";
import { OrdersService } from "../../../services/orders.service";
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { FormItemComponent } from "../../../layout/form-item/form-item.component";
import { FormFieldComponent } from "../../../layout/form-field/form-field.component";
import { OrderItem } from "../../../interfaces/order.item.interface";
import { InventoryService } from "../../../services/inventory.service";
import { CheckboxComponent } from "../../../layout/checkbox/checkbox.component";
import { Article } from "../../../interfaces/article.interface";
import { Prescription } from "../../../interfaces/prescription.interface";
import { forkJoin, Subject, takeUntil } from "rxjs";
import { BenefitClient } from "../../../interfaces/benefit-client.interface";
import { ToastService } from "../../../services/toast.service";
import { ConfirmModalComponent } from "../../../layout/modal/modal.component";
import { AdministrateService } from "../../../services/administrate.service";
import { OrderArticle } from "../../../interfaces/order.article.interface";
import { ModalComponent } from "../modal/modal.component";
import { SearchSelectComponent } from "../../../layout/search-select/search-select.component";
import { PrescriptionComponent } from "../prescription/prescription.component";
import { CommonModule, DatePipe } from "@angular/common";
import { AuthService } from "../../../services/auth.service";

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

@Component({
  selector: "app-edit-order",
  imports: [
    ReactiveFormsModule,
    FormItemComponent,
    FormFieldComponent,
    CheckboxComponent,
    RouterModule,
    ConfirmModalComponent,
    ModalComponent,
    SearchSelectComponent,
    PrescriptionComponent,
    DatePipe,
    CommonModule,
  ],
  templateUrl: "./edit-order.component.html",
  styleUrl: "./edit-order.component.scss",
})
export class EditOrderComponent {
  /**
   * Variable declaration
   */

  // 1. Services and Dependencies
  private fb = inject(FormBuilder);
  private toastService = inject(ToastService);
  private ordersService = inject(OrdersService);
  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  // 2. Subjects
  private destroy$: any = new Subject<void>();
  protected resetSubject$ = new Subject<void>();

  // 3. Constants
  protected pageSize: number = 100;
  protected receiptNumber = Math.floor(1000 + Math.random() * 9000);
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
  protected order: any;

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

  // 2. Private
  private createEyeGroup(): FormGroup {
    return this.fb.group({
      spherical: [0, [Validators.required]],
      cylindrical: [0, [Validators.required]],
      axis: [0, [Validators.required, Validators.min(0), Validators.max(179)]],
      pupilHeight: [0, [Validators.required]],
      pupilDistance: [0, [Validators.required]],
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

    this.clientForm.disable();

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

    this.addition = this.fb.control(0, [Validators.min(0), Validators.max(8)]);
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
          spherical: 0,
          cylindrical: 0,
          axis: 0,
          pupilHeight: 0,
          pupilDistance: 0,
        },
        rightEye: {
          spherical: 0,
          cylindrical: 0,
          axis: 0,
          pupilHeight: 0,
          pupilDistance: 0,
        },
      },
      far: {
        leftEye: {
          spherical: 0,
          cylindrical: 0,
          axis: 0,
          pupilHeight: 0,
          pupilDistance: 0,
        },
        rightEye: {
          spherical: 0,
          cylindrical: 0,
          axis: 0,
          pupilHeight: 0,
          pupilDistance: 0,
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

    this.route.paramMap.subscribe((params) => {
      const id = params.get("id")!;

      this.ordersService.getOrder(id).subscribe((response) => {
        this.order = response;

        const allArticles = [
          ...this.order.articles,
          ...this.order.subOrders.flatMap((order: any) => order.articles),
        ];

        const mappedItems: Partial<OrderItem>[] = allArticles.map(
          (entry: any, index: number) => {
            const article = entry.article;
            const objectId = article._id;

            return {
              id: index + 1,
              objectId: objectId,
              brand: this.getDisplayValue(article, "brand"),
              model: this.getDisplayValue(article, "model"),
              style: this.getDisplayValue(article, "style"),
              name: article.type !== "Frame" ? article.name : "-",
              price: article.price,
              stock: article.stock,
              quantity: entry.quantity,
              selected: false,
            };
          },
        );

        this.displayItems.push(...mappedItems);

        this.clientForm.setValue({
          email: this.order.client.email,
          name: this.order.client.name,
          lastName: this.order.client.lastName,
          document: this.order.client.document,
          phoneNumber: this.order.client.phoneNumber,
          address: this.order.client.address,
        });

        this.orderForm.setValue({
          paymentAmount: this.order.billing.paymentAmount || 0,
          deposit: this.order.billing.deposit || 0,
          paymentType: this.order.billing.paymentType,
          depositType: this.order.billing.depositType,
          balance: this.order.billing.balance || 0,
          cost: this.order.billing.cost,
          total: this.order.billing.total,
          discount: this.order.billing.discount || 0,
          articles: [...this.order.articles],
          doctor: "",
        });

        this.subOrders = this.order.subOrders;

        this.appliedBenefits = this.order.billing.benefits;
      });
    });

    let lastAddition = this.addition.value || 0;

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

  public handleDeleteModal(result: boolean): void {
    if (result) {
      this.onDeleteAllSelected();
    }
    this.showDeleteModal = false;
  }

  public handlePrint(): void {
    if (!this.showPrintModal) {
      this.showPrintModal = true;
    } else {
      this.showPrintModal = false;
    }
  }

  public onSelect(option: string) {
    this.selectedSale = option;
  }

  public onSelectAll(): void {
    this.isAllSelected = !this.isAllSelected;
    this.displayItems.forEach((item) => (item.selected = this.isAllSelected));
  }

  public onAddBenefit() {
    if (this.selectedBenefit.value) {
      const isBenefitExist = this.appliedBenefits.some(
        (benefit) => benefit.name === this.selectedBenefit.value.name,
      );

      if (!isBenefitExist) {
        this.appliedBenefits.push(this.selectedBenefit.value);
        this.selectedBenefit.reset("");
        this.orderForm.get("total")?.updateValueAndValidity();
      } else {
        this.toastService.showToast({
          message: "Este beneficio ya esta aplicado",
          type: "warning",
          showIcon: true,
        });
      }
    }
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

  onDeleteOrder() {
    this.ordersService.deleteOrder(this.order._id).subscribe({
      next: () => {
        this.router.navigateByUrl("/home");

        this.toastService.showToast({
          message: `Orden ${this.order._id} eliminada con éxito`,
          type: "success",
          showIcon: true,
        });
      },

      error: () => {
        this.toastService.showToast({
          message: `Error al eliminar orden con ID: ${this.order._id}`,
          type: "error",
          showIcon: true,
        });
      },
    });
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

      // Combine the previous articles with the new ones and update quantities

      // Step 1: Update articles with new quantities
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

      // Step 2: Generate display items based on updated articles
      const processedIds = new Set<string>();
      const newDisplayItems: OrderItem[] = updatedArticles.reduce<OrderItem[]>(
        (acc, item, index) => {
          const article = item.article;
          const id = article._id;
          if (!id || processedIds.has(id)) return acc;

          acc.push({
            id: index + 1,
            objectId: id,
            name: article.type !== "Frame" ? article.name : "-",
            brand: this.getDisplayValue(article, "brand"),
            model: this.getDisplayValue(article, "model"),
            style: this.getDisplayValue(article, "style"),
            price: article.price * item.quantity,
            stock: article.stock,
            quantity: item.quantity,
            selected: false,
          });

          processedIds.add(id);
          return acc;
        },
        [],
      );

      this.displayItems = newDisplayItems;
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

  public onSendPrescriptions(): void {
    if (this.subOrders.length === 0) {
      this.onUpdateOrder([]);
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

        this.onUpdateOrder(subOrders);
      });
  }

  onUpdateOrder(subOrders: any[]) {
    const sendData: any = {
      client: this.order.client._id,
      orderNumber: this.order.orderNumber,
      state: this.order.state,
      billing: {
        total: this.orderForm.value.total,
        deposit: this.orderForm.value.deposit,
        paymentType: this.orderForm.value.paymentType,
        depositType: this.orderForm.value.depositType,
        cost: this.orderForm.value.cost,
        benefits: this.appliedBenefits.map((benefit) => benefit._id),
        balance: this.orderForm.value.balance,
        discount: this.orderForm.value.discount,
        paymentAmount: this.orderForm.value.paymentAmount,
      },
      articles: this.orderForm.value.articles,
      owner: this.order.owner,
      subOrders: subOrders.length > 0 ? subOrders : [],
    };

    this.ordersService
      .updateOrderById(this.order._id, sendData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.toastService.showToast({
            message: "Orden actualizada con éxito",
            type: "success",
            showIcon: true,
          });
        },
      });
  }
}
