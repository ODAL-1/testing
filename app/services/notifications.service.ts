import { Injectable } from "@angular/core";
import { WhatsappService, WhatsappMessage } from "./whatsapp.service";
import { ToastService } from "./toast.service";
import { catchError, of } from "rxjs";
import type { OrderCard } from "../interfaces/order-card.interface";

@Injectable({
  providedIn: "root",
})
export class NotificationService {
  // constructor(
  //   private whatsappService: WhatsappService,
  //   private toastService: ToastService,
  // ) {}
  // /**
  //  * Sends a WhatsApp notification when an order status changes
  //  * @param order The order that changed status
  //  * @param newState The new state of the order
  //  */
  // sendOrderStatusNotification(order: OrderCard, newState: string): void {
  //   // This would come from your database in a real application
  //   const customerPhone = this.getCustomerPhone(order.clientName);
  //   if (!customerPhone) {
  //     this.toastService.showToast({
  //       message: `No se pudo enviar notificación: Teléfono no encontrado para ${order.clientName}`,
  //       type: "error",
  //       showIcon: true,
  //     });
  //     return;
  //   }
  //   let templateName = "";
  //   let templateData: Record<string, string> = {};
  //   switch (newState) {
  //     case "INCOURSE":
  //       templateName = "order_in_progress";
  //       templateData = {
  //         1: order.clientName.split(" ")[0], // First name
  //         2: order.id,
  //       };
  //       break;
  //     case "FINISHED":
  //       templateName = "order_ready";
  //       templateData = {
  //         1: order.clientName.split(" ")[0], // First name
  //         2: order.id,
  //       };
  //       break;
  //     case "DELIVERED":
  //       templateName = "order_delivered";
  //       templateData = {
  //         1: order.clientName.split(" ")[0], // First name
  //         2: order.id,
  //         3: new Date().toLocaleDateString("es-ES"),
  //       };
  //       break;
  //     default:
  //       return;
  //   }
  //   const message: WhatsappMessage = {
  //     to: customerPhone,
  //     templateName,
  //     templateData,
  //     language: "es",
  //   };
  //   this.whatsappService
  //     .sendTemplateMessage(message)
  //     .pipe(
  //       catchError((error) => {
  //         console.error("Error sending WhatsApp notification:", error);
  //         this.toastService.showToast({
  //           message: `Error al enviar notificación de WhatsApp: ${error.message}`,
  //           type: "error",
  //           showIcon: true,
  //         });
  //         return of(null);
  //       }),
  //     )
  //     .subscribe((response) => {
  //       if (response) {
  //         this.toastService.showToast({
  //           message: `Notificación de WhatsApp enviada a ${order.clientName}`,
  //           type: "success",
  //           showIcon: true,
  //         });
  //       }
  //     });
  // }
  // /**
  //  */
  // private getCustomerPhone(clientName: string): string | null {
  //   const mockPhoneNumbers: Record<string, string> = {
  //     "María González": "34600000001",
  //     "Carlos Rodríguez": "34600000002",
  //     "Ana Martínez": "34600000003",
  //     "Luis Pérez": "34600000004",
  //     "Elena Sánchez": "34600000005",
  //     "Javier López": "34600000006",
  //     "Carmen Díaz": "34600000007",
  //     "Roberto Fernández": "34600000008",
  //     "Sofía Ramírez": "34600000009",
  //     "Miguel Torres": "34600000010",
  //     "Laura Flores": "34600000011",
  //     "Pedro Gómez": "34600000012",
  //   };
  //   return mockPhoneNumbers[clientName]
  //     ? `+${mockPhoneNumbers[clientName]}`
  //     : null;
  // }
}
