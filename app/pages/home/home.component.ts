import { Component, type ElementRef, ViewChild, inject } from "@angular/core";
import {
  type CdkDragDrop,
  DragDropModule,
  moveItemInArray,
  transferArrayItem,
} from "@angular/cdk/drag-drop";
import type { OrderCard } from "../../interfaces/order-card.interface";
import { Router, RouterModule } from "@angular/router";
import {
  Subject,
  debounceTime,
  distinctUntilChanged,
  fromEvent,
  takeUntil,
} from "rxjs";
import { AuthService } from "../../services/auth.service";
import { ToastService } from "../../services/toast.service";
import { CommonModule } from "@angular/common";
import { OrderStateKey, OrderStates } from "../../constants/order-states.const";
import { NotificationService } from "../../services/notifications.service";
import { OrdersService } from "../../services/orders.service";
import { NgZone } from "@angular/core";

@Component({
  selector: "app-home",
  imports: [DragDropModule, RouterModule, CommonModule],
  templateUrl: "./home.component.html",
  styleUrl: "./home.component.scss",
})
export class HomeComponent {
  @ViewChild("searchInput", { static: true }) searchInput!: ElementRef;

  private toastService = inject(ToastService);
  private authService = inject(AuthService);
  private ordersService = inject(OrdersService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);
  private zone = inject(NgZone);
  private destroy$ = new Subject<void>();
  private user: any | null;

  private allOrders: OrderCard[] = [];

  protected registered: OrderCard[] = [];
  protected inCourse: OrderCard[] = [];
  protected finished: OrderCard[] = [];
  protected delivered: OrderCard[] = [];

  protected searchTerm = "";
  protected filterStates = {
    registered: {
      showRecent: true,
      showOldest: false,
    },
    inCourse: {
      showRecent: true,
      showOldest: false,
    },
    finished: {
      showRecent: true,
      showOldest: false,
    },
    delivered: {
      showRecent: true,
      showOldest: false,
    },
  };

  formatTimeDifference(targetDate: Date): string {
    const currentDate = new Date();
    const differenceInSeconds = Math.floor(
      (currentDate.getTime() - targetDate.getTime()) / 1000,
    );
    const absoluteDifference = Math.abs(differenceInSeconds);

    if (absoluteDifference >= 86400) {
      const days = Math.floor(absoluteDifference / 86400);
      return `${days} días`;
    } else if (absoluteDifference >= 3600) {
      const hours = Math.floor(absoluteDifference / 3600);
      return `${hours} horas`;
    } else if (absoluteDifference >= 60) {
      const minutes = Math.floor(absoluteDifference / 60);
      return `${minutes} minutos`;
    } else {
      return `${absoluteDifference}seg`;
    }
  }

  drop(event: CdkDragDrop<OrderCard[]>): void {
    if (event.previousContainer === event.container) {
      moveItemInArray(
        event.container.data,
        event.previousIndex,
        event.currentIndex,
      );
    } else {
      this.zone.runOutsideAngular(() => {
        const item = { ...event.previousContainer.data[event.previousIndex] };
        const previousState = item.orderState;
        const newState = this.getContainerState(event.container.id);

        item.orderState = newState as OrderStateKey;

        this.ordersService
          .updateOrderState(item.id, newState)
          .pipe(takeUntil(this.destroy$))
          .subscribe();

        transferArrayItem(
          event.previousContainer.data,
          event.container.data,
          event.previousIndex,
          event.currentIndex,
        );

        this.zone.run(() => {
          setTimeout(() => {
            this.toastService.showToast({
              message: `Orden ${item.id} movida a ${OrderStates[newState as OrderStateKey].display.toLowerCase()}`,
              type: "success",
              showIcon: true,
            });

            // if (this.shouldSendNotification(previousState, newState)) {
            //   this.notificationService.sendOrderStatusNotification(item, newState);
            // }
          }, 0);
        });
      });
    }
  }

  private shouldSendNotification(
    previousState: string,
    newState: string,
  ): boolean {
    const notifiableTransitions = [
      { from: "REGISTERED", to: "INCOURSE" },

      { from: "INCOURSE", to: "FINISHED" },

      { from: "FINISHED", to: "DELIVERED" },
    ];

    return notifiableTransitions.some(
      (transition) =>
        transition.from === previousState && transition.to === newState,
    );
  }

  private getContainerState(containerId: string): string {
    switch (containerId) {
      case "registered":
        return "REGISTERED";
      case "inCourse":
        return "INCOURSE";
      case "finalized":
        return "FINISHED";
      case "delivered":
        return "DELIVERED";
      default:
        return "REGISTERED";
    }
  }

  toggleFilter(
    column: "registered" | "inCourse" | "finished" | "delivered",
  ): void {
    this.filterStates[column].showRecent =
      !this.filterStates[column].showRecent;
    this.filterStates[column].showOldest =
      !this.filterStates[column].showOldest;
    this.applyFilters();
  }

  applyFilters(): void {
    const filteredOrders = this.searchTerm
      ? this.allOrders.filter((order) => {
          const normalizedSearchTerm = this.normalizeText(this.searchTerm);
          const normalizedClientName = this.normalizeText(order.clientName);
          const normalizedId = this.normalizeText(order.id);
          const normalizedDocument = this.normalizeText(order.document);
          const normalizedNumber = this.normalizeText(order.orderNumber!);

          return (
            normalizedClientName.includes(normalizedSearchTerm) ||
            normalizedId.includes(normalizedSearchTerm) ||
            normalizedDocument.includes(normalizedSearchTerm) ||
            normalizedNumber.includes(normalizedSearchTerm)
          );
        })
      : [...this.allOrders];

    this.registered = filteredOrders.filter(
      (order) => order.orderState === "REGISTERED",
    );
    this.inCourse = filteredOrders.filter(
      (order) => order.orderState === "INCOURSE",
    );
    this.finished = filteredOrders.filter(
      (order) => order.orderState === "FINISHED",
    );
    this.delivered = filteredOrders.filter(
      (order) => order.orderState === "DELIVERED",
    );

    this.applySorting();
  }

  private applySorting(): void {
    this.registered.sort((a, b) =>
      this.sortOrders(a, b, this.filterStates.registered.showRecent),
    );
    this.inCourse.sort((a, b) =>
      this.sortOrders(a, b, this.filterStates.inCourse.showRecent),
    );
    this.finished.sort((a, b) =>
      this.sortOrders(a, b, this.filterStates.finished.showRecent),
    );
    this.delivered.sort((a, b) =>
      this.sortOrders(a, b, this.filterStates.delivered.showRecent),
    );
  }

  private sortOrders(a: OrderCard, b: OrderCard, recent: boolean): number {
    return recent
      ? b.date.getTime() - a.date.getTime()
      : a.date.getTime() - b.date.getTime();
  }

  private normalizeText(text: string): string {
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  }

  ngOnInit(): void {
    this.authService.user$.pipe(takeUntil(this.destroy$)).subscribe((user) => {
      this.user = user || {};
    });

    this.ordersService
      .getOrders()
      .pipe(takeUntil(this.destroy$))
      .subscribe((response) => {
        this.allOrders = response.map((order) => {
          if (order.client) {
            return {
              id: order._id,
              orderNumber: order.orderNumber,
              clientName: `${order.client.name} ${order.client.lastName}`,
              document: order.client.document,
              date: new Date(order.createdAt),
              orderState: order.state,
            };
          }

          // Guard for old orders
          return {
            id: order._id,
            clientName: order.clientName,
            document: order.document,
            date: new Date(order.createdAt),
            orderState: order.state,
          };
        });

        this.applyFilters();
      });

    fromEvent(this.searchInput.nativeElement, "input")
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(() => {
        this.searchTerm = this.searchInput.nativeElement.value;
        this.applyFilters();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onEditOrder(id: string) {
    this.router.navigate(["orders/edit", id]);
  }

  onDeleteOrder(id: string, type: string) {
    this.ordersService.deleteOrder(id).subscribe({
      next: () => {
        switch (type) {
          case "registered":
            this.registered = this.registered.filter(
              (registered) => registered.id !== id,
            );
            break;

          case "in-course":
            this.inCourse = this.inCourse.filter(
              (inCourse) => inCourse.id !== id,
            );
            break;

          case "finished":
            this.finished = this.finished.filter(
              (finished) => finished.id !== id,
            );
            break;

          case "delivered":
            this.delivered = this.delivered.filter(
              (delivered) => delivered.id !== id,
            );
            break;
          default:
            break;
        }

        this.toastService.showToast({
          message: `Orden ${id} eliminada con éxito`,
          type: "success",
          showIcon: true,
        });
      },

      error: () => {
        this.toastService.showToast({
          message: `Error al eliminar orden con ID: ${id}`,
          type: "error",
          showIcon: true,
        });
      },
    });
  }
}
