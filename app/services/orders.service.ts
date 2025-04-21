import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { environment } from "../../environments/environment";
import { BenefitClient } from "../interfaces/benefit-client.interface";

@Injectable({
  providedIn: "root",
})
export class OrdersService {
  private backendUrl = environment.backendUrl;

  constructor(private http: HttpClient) {}

  getOrders() {
    return this.http.get<any[]>(`${this.backendUrl}/order/all`);
  }

  getOrder(orderId: string) {
    return this.http.get<any>(`${this.backendUrl}/order/id/${orderId}`);
  }

  getClient(document: string) {
    return this.http.get(`${this.backendUrl}/client/document/${document}`);
  }

  getBenefits() {
    return this.http.get<BenefitClient[]>(`${this.backendUrl}/client/benefit`);
  }

  getDoctors() {
    return this.http.get<any[]>(`${this.backendUrl}/user/doctor/all`);
  }

  createOrder(newOrder: any) {
    return this.http.post(`${this.backendUrl}/order/new`, newOrder);
  }

  createPrescription(newPrescription: any) {
    return this.http.post(
      `${this.backendUrl}/prescription/new`,
      newPrescription,
    );
  }

  updateOrderState(orderId: string, newState: any) {
    return this.http.put(`${this.backendUrl}/order/${orderId}/state`, {
      state: newState,
    });
  }

  updateOrderById(orderId: string, updatedOrder: any) {
    return this.http.put(
      `${this.backendUrl}/order/id/${orderId}`,
      updatedOrder,
    );
  }

  deleteOrder(orderId: string) {
    return this.http.delete(`${this.backendUrl}/order/id/${orderId}`);
  }
}
