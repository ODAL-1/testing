import { Component, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import {
  FormArray,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { ConfirmModalComponent } from "../../layout/modal/modal.component";
import { forkJoin, Subject, takeUntil } from "rxjs";
import { AdministrateService } from "../../services/administrate.service";
import { Client } from "../../interfaces/client.interface";
import { Doctor } from "../../interfaces/doctor.interface";
import { User } from "../../interfaces/user.interface";
import { ToastService } from "../../services/toast.service";
import { BenefitClient } from "../../interfaces/benefit-client.interface";
import { CheckboxComponent } from "../../layout/checkbox/checkbox.component";
import { OrdersService } from "../../services/orders.service";

@Component({
  selector: "app-admin",
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ConfirmModalComponent,
    CheckboxComponent,
  ],
  templateUrl: "./administrate.component.html",
  styleUrl: "./administrate.component.scss",
})
export class AdministrateComponent {
  private fb = inject(FormBuilder);
  private adminService = inject(AdministrateService);
  private ordersService = inject(OrdersService);
  private toastService = inject(ToastService);

  private destroy$ = new Subject<void>();

  protected showUserModal = false;
  protected showClientModal = false;
  protected showDoctorModal = false;
  protected showBenefitModal = false;
  protected showConfirmModal = false;
  protected showFilterMenu = false;
  protected activeView: "users" | "clients" | "doctors" | "benefits" = "users";
  protected deleteId: string = "";
  protected deleteType: string = "";

  protected searchForm!: FormGroup;
  protected newUserForm!: FormGroup;
  protected newClientForm!: FormGroup;
  protected newDoctorForm!: FormGroup;
  protected newBenefitForm!: FormGroup;
  protected editUserForm!: FormGroup;
  protected editClientForm!: FormGroup;
  protected editDoctorForm!: FormGroup;
  protected editBenefitForm!: FormGroup;

  protected users: User[] = [];
  protected clients: Client[] = [];
  protected doctors: Doctor[] = [];
  protected benefits: BenefitClient[] = [];
  protected filteredUsers: User[] = [];
  protected filteredClients: Client[] = [];
  protected filteredDoctors: Doctor[] = [];
  protected filteredBenefits: BenefitClient[] = [];

  loadData(): void {
    forkJoin({
      users: this.adminService.getUsers(),
      clients: this.adminService.getClients(),
      doctors: this.adminService.getDoctors(),
      benefits: this.ordersService.getBenefits(),
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe(({ users, clients, doctors, benefits }) => {
        this.users = users.map((u) => ({ ...u, isEdit: false }));

        this.clients = clients
          .filter((client) => client.type !== "BenefitClient")
          .map((c) => ({ ...c, isEdit: false }));

        this.doctors = doctors.map((d) => ({ ...d, isEdit: false }));

        this.benefits = benefits.map((b) => ({ ...b, isEdit: false }));

        this.applyFilters();
        this.initializeItemsForms();
      });
  }

  initializeForms(): void {
    this.searchForm = this.fb.group({
      sortBy: this.fb.control("date-desc"),
      searchTerm: this.fb.control(""),
    });

    this.newUserForm = this.fb.group({
      username: this.fb.control("", Validators.required),
      email: this.fb.control("", [Validators.required, Validators.email]),
      privilege: this.fb.control("USUARIO", Validators.required),
      password: this.fb.control("", Validators.required),
    });

    this.newDoctorForm = this.fb.group({
      name: this.fb.control(""),
    });

    this.newClientForm = this.fb.group({
      name: this.fb.control("", Validators.required),
      lastName: this.fb.control("", Validators.required),
      email: this.fb.control("", [Validators.required, Validators.email]),
      phoneNumber: this.fb.control("", Validators.required),
      address: this.fb.control("", Validators.required),
    });

    this.newBenefitForm = this.fb.group({
      name: this.fb.control("", Validators.required),
      discountedValue: this.fb.control(0.0, Validators.required),
      isActive: this.fb.control(false),
    });

    this.editUserForm = this.fb.group({
      itemsForm: this.fb.array([]),
    });

    this.editClientForm = this.fb.group({
      itemsForm: this.fb.array([]),
    });

    this.editDoctorForm = this.fb.group({
      itemsForm: this.fb.array([]),
    });

    this.editBenefitForm = this.fb.group({
      itemsForm: this.fb.array([]),
    });
  }

  initializeItemsForms(): void {
    this.users.forEach((user) => {
      const itemGroup = this.fb.group({
        username: [user.username],
        email: [user.email],
        privilege: [user.privilege],
      });

      this.userItemsForm.push(itemGroup);
    });

    this.clients.forEach((client) => {
      const itemGroup = this.fb.group({
        document: [client.document],
        name: [client.name],
        lastName: [client.lastName],
        email: [client.email],
        phoneNumber: [client.phoneNumber],
        address: [client.address],
      });

      this.clientItemsForm.push(itemGroup);
    });

    this.doctors.forEach((doctor) => {
      const itemGroup = this.fb.group({
        name: [doctor.name],
      });

      this.doctorItemsForm.push(itemGroup);
    });

    this.benefits.forEach((benefit) => {
      const itemGroup = this.fb.group({
        name: benefit.name,
        discountedValue: benefit.discountedValue,
        isActive: benefit.isActive,
      });

      this.benefitItemsForm.push(itemGroup);
    });
  }

  hasChanged<T extends Record<string, any>>(
    object: T,
    newValues: Partial<T>,
  ): boolean {
    return (Object.keys(newValues) as Array<keyof T>).some(
      (key) => object[key] !== newValues[key],
    );
  }

  get userItemsForm(): FormArray {
    return this.editUserForm!.get("itemsForm") as FormArray;
  }

  get clientItemsForm(): FormArray {
    return this.editClientForm!.get("itemsForm") as FormArray;
  }

  get doctorItemsForm(): FormArray {
    return this.editDoctorForm!.get("itemsForm") as FormArray;
  }

  get benefitItemsForm(): FormArray {
    return this.editBenefitForm!.get("itemsForm") as FormArray;
  }

  ngOnInit(): void {
    this.loadData();
    this.initializeForms();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  applyFilters(): void {
    if (this.activeView === "users") {
      this.filteredUsers = this.filterAndSortItems(this.users);
    } else if (this.activeView === "clients") {
      this.filteredClients = this.filterAndSortItems(this.clients);
    } else if (this.activeView === "doctors") {
      this.filteredDoctors = this.filterAndSortItems(this.doctors);
    } else {
      this.filteredBenefits = this.filterAndSortItems(this.benefits);
    }
  }

  resetFilters(): void {
    this.searchForm.reset();
    this.applyFilters();
  }

  toggleFilterMenu(): void {
    this.showFilterMenu = !this.showFilterMenu;
  }

  toggleEdit(item: any) {
    item.isEdit = !item.isEdit;
  }

  formatDate(date: string | Date | undefined): string {
    if (!date) {
      return "-";
    }

    const parsedDate = new Date(Date.parse(date.toString()));

    if (isNaN(parsedDate.getTime())) {
      return "-";
    }

    return parsedDate.toLocaleDateString();
  }

  filterAndSortItems<T extends User | Client | Doctor | BenefitClient>(
    items: T[],
  ): T[] {
    let filtered = items;
    const searchTerm = this.searchForm.get("searchTerm")!.value;

    if (searchTerm && searchTerm.trim() !== "") {
      const term = searchTerm.toLowerCase().trim();
      filtered = filtered.filter((item) => {
        const nameOrUsername = "name" in item ? item.name : item.username;
        const email = "email" in item ? item.email : "";

        return (
          nameOrUsername.toLowerCase().includes(term) ||
          item._id.toLowerCase().includes(term) ||
          email.toLowerCase().includes(term)
        );
      });
    }

    return this.sortItems(filtered);
  }

  setActiveView(view: "users" | "clients" | "doctors" | "benefits"): void {
    this.activeView = view;
    this.resetForms();
    this.resetFilters();
  }

  resetForms(): void {
    this.newClientForm.reset({
      name: "",
      lastName: "",
      email: "",
      address: "",
      phoneNumber: "",
    });
    this.newDoctorForm.reset({
      name: "",
    });
    this.newUserForm.reset({
      username: "",
      email: "",
      password: "",
      privilege: "USUARIO",
    });

    this.initializeItemsForms();
  }

  sortItems<T extends User | Client | Doctor | BenefitClient>(items: T[]): T[] {
    const sortBy = this.searchForm.get("sortBy")!.value;

    switch (sortBy) {
      case "date-desc":
        return [...items].sort((a, b) => {
          const dateA = new Date(a.createdAt!);
          const dateB = new Date(b.createdAt!);
          return dateB.getTime() - dateA.getTime();
        });
      case "date-asc":
        return [...items].sort((a, b) => {
          const dateA = new Date(a.createdAt!);
          const dateB = new Date(b.createdAt!);
          return dateA.getTime() - dateB.getTime();
        });
      case "name-asc":
        return [...items].sort((a, b) => {
          const nameA = "name" in a ? a.name : a.username;
          const nameB = "name" in b ? b.name : b.username;
          return nameA.localeCompare(nameB);
        });
      case "name-desc":
        return [...items].sort((a, b) => {
          const nameA = "name" in a ? a.name : a.username;
          const nameB = "name" in b ? b.name : b.username;
          return nameB.localeCompare(nameA);
        });
      default:
        return items;
    }
  }

  openConfirmModal(id: string, type: string): void {
    this.deleteType = type;
    this.deleteId = id;
    this.showConfirmModal = true;
  }

  openUserModal(): void {
    this.showUserModal = true;
  }

  openClientModal(): void {
    this.showClientModal = true;
  }

  openDoctorModal(): void {
    this.showDoctorModal = true;
  }

  openBenefitModal(): void {
    this.showBenefitModal = true;
  }

  closeUserModal(): void {
    this.showUserModal = false;
    this.resetForms();
  }

  closeDoctorModal(): void {
    this.showDoctorModal = false;
    this.resetForms();
  }

  closeClientModal(): void {
    this.showClientModal = false;
    this.resetForms();
  }

  closeBenefitModal(): void {
    this.showBenefitModal = false;
    this.resetForms();
  }

  addUser(): void {
    if (this.newUserForm.valid) {
      const newUser = this.newUserForm.value;

      this.adminService
        .createUser(newUser)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response: any) => {
            this.users.push({
              _id: response._id,
              email: response.email,
              username: response.username,
              password: response.password,
              createdAt: response.createdAt,
            });

            this.toastService.showToast({
              message: "Usuario creado con éxito",
              type: "success",
              showIcon: true,
            });

            this.applyFilters();
            this.closeUserModal();
          },
          error: () => {
            this.toastService.showToast({
              message: "Error al crear usuario",
              type: "error",
              showIcon: true,
            });
          },
        });
    } else {
      this.toastService.showToast({
        message: "No pueden haber campos vacíos",
        type: "warning",
        showIcon: true,
      });
    }
  }

  addDoctor(): void {
    if (this.newDoctorForm.valid) {
      const newDoctor = this.newDoctorForm.value;
      this.adminService.createDoctor(newDoctor).subscribe({
        next: (response: any) => {
          this.doctors.push({
            _id: response._id,
            name: response.name,
            createdAt: response.createdAt,
          });

          this.toastService.showToast({
            message: "Doctor creado con éxito",
            type: "success",
            showIcon: true,
          });

          this.applyFilters();
          this.closeDoctorModal();
        },
        error: () => {
          this.toastService.showToast({
            message: "Error al crear doctor",
            type: "error",
            showIcon: true,
          });
        },
      });
    } else {
      this.toastService.showToast({
        message: "Nombre no puede estar vacío",
        type: "warning",
        showIcon: true,
      });
    }
  }

  addClient() {
    if (this.newClientForm.valid) {
      const newClient = this.newClientForm.value;

      this.adminService.createClient(newClient).subscribe({
        next: (response: any) => {
          this.clients.push({
            _id: response.id,
            name: response.name,
            lastName: response.lastName,
            email: response.email,
            document: response.document,
            phoneNumber: response.phoneNumber,
            address: response.address,
            createdAt: response.createdAt,
          });

          this.toastService.showToast({
            message: "Cliente creado con éxito",
            type: "success",
            showIcon: true,
          });

          this.applyFilters();
          this.closeClientModal();
        },
        error: () => {
          this.toastService.showToast({
            message: "Error al crear cliente",
            type: "error",
            showIcon: true,
          });
        },
      });
    } else {
      this.toastService.showToast({
        message: "No pueden haber campos vacíos",
        type: "warning",
        showIcon: true,
      });
    }
  }

  addBenefit(): void {
    if (this.newBenefitForm.valid) {
      const newBenefit = this.newBenefitForm.value;

      this.adminService.createBenefit(newBenefit).subscribe({
        next: (response: any) => {
          this.benefits.push({
            _id: response._id,
            name: response.name,
            discountedValue: response.discountedValue,
            isActive: response.isActive,
            createdAt: response.createdAt,
          });

          this.toastService.showToast({
            message: "Beneficio creado con éxito",
            type: "success",
            showIcon: true,
          });

          this.applyFilters();
          this.closeBenefitModal();
        },
        error: () => {
          this.toastService.showToast({
            message: "Error al crear beneficio",
            type: "error",
            showIcon: true,
          });
        },
      });
    } else {
      this.toastService.showToast({
        message: "No pueden haber campos vacíos",
        type: "warning",
        showIcon: true,
      });
    }
  }

  onUpdateItem(item: any, type: string, index: number) {
    switch (type) {
      case "user": {
        const updatedData = this.userItemsForm.at(index).value;

        const { document, email, privilege } = updatedData;

        if (!this.hasChanged(item, updatedData)) {
          item.isEdit = false;
          return;
        }

        const sendData = {};

        break;
      }

      case "client": {
        const updatedData = this.clientItemsForm.at(index).value;

        const { name, lastName, email, address, phoneNumber, document } =
          updatedData;

        if (!this.hasChanged(item, updatedData)) {
          item.isEdit = false;
          return;
        }

        const sendData = {};

        break;
      }

      case "doctor": {
        const updatedData = this.doctorItemsForm.at(index).value;

        const { name } = updatedData;

        if (!this.hasChanged(item, updatedData)) {
          item.isEdit = false;
          return;
        }

        const sendData = {};

        break;
      }

      case "benefit": {
        const updatedData = this.benefitItemsForm.at(index).value;

        const { name, discountedValue, isActive } = updatedData;

        if (!this.hasChanged(item, updatedData)) {
          item.isEdit = false;
          return;
        }

        const sendData = {};

        break;
      }

      default:
        break;
    }
  }

  deleteUser(userId: string) {
    this.adminService.deleteUser(userId).subscribe({
      next: () => {
        this.users = this.users.filter((user) => user._id !== userId);
        this.applyFilters();
        this.toastService.showToast({
          message: "Usuario eliminado con éxito",
          type: "success",
          showIcon: true,
        });
      },
      error: () => {
        this.toastService.showToast({
          message: "Error al eliminar usuario",
          type: "error",
          showIcon: true,
        });
      },
    });
  }

  deleteDoctor(doctorId: string) {
    this.adminService.deleteDoctor(doctorId).subscribe({
      next: () => {
        this.doctors = this.doctors.filter((doctor) => doctor._id !== doctorId);
        this.applyFilters();
        this.toastService.showToast({
          message: "Doctor eliminado con éxito",
          type: "success",
          showIcon: true,
        });
      },
      error: () => {
        this.toastService.showToast({
          message: "Error al eliminar doctor",
          type: "error",
          showIcon: true,
        });
      },
    });
  }

  deleteClient(clientId: string) {
    this.adminService.deleteClient(clientId).subscribe({
      next: () => {
        this.clients = this.clients.filter((client) => client._id !== clientId);
        this.applyFilters();

        this.toastService.showToast({
          message: "Cliente eliminado con éxito",
          type: "success",
          showIcon: true,
        });
      },
      error: () => {
        this.toastService.showToast({
          message: "Error al eliminar cliente",
          type: "error",
          showIcon: true,
        });
      },
    });
  }

  deleteBenefit(benefitId: string) {
    this.adminService.deleteBenefit(benefitId).subscribe({
      next: () => {
        this.benefits = this.benefits.filter(
          (benefit) => benefit._id !== benefitId,
        );
        this.applyFilters();

        this.toastService.showToast({
          message: "Beneficio eliminado con éxito",
          type: "success",
          showIcon: true,
        });
      },
      error: () => {
        this.toastService.showToast({
          message: "Error al eliminar beneficio",
          type: "error",
          showIcon: true,
        });
      },
    });
  }

  handleCloseModal(result: boolean) {
    if (result) {
      switch (this.deleteType) {
        case "user":
          this.deleteUser(this.deleteId);
          break;

        case "doctor":
          this.deleteDoctor(this.deleteId);
          break;

        case "client":
          this.deleteClient(this.deleteId);
          break;

        case "benefit":
          this.deleteBenefit(this.deleteId);
          break;

        default:
          break;
      }

      this.showConfirmModal = false;
    }

    this.showConfirmModal = false;
  }
}
