import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { environment } from "../../environments/environment";
import { User } from "../interfaces/user.interface";
import { Client } from "../interfaces/client.interface";
import { Doctor } from "../interfaces/doctor.interface";

@Injectable({
  providedIn: "root",
})
export class AdministrateService {
  private backendUrl = environment.backendUrl;

  constructor(private http: HttpClient) {}

  createUser(newUser: any) {
    return this.http.post(`${this.backendUrl}/user/new`, newUser);
  }

  createDoctor(newDoctor: any) {
    return this.http.post(`${this.backendUrl}/user/doctor/new`, newDoctor);
  }

  createClient(newClient: any) {
    return this.http.post(`${this.backendUrl}/client/new`, newClient);
  }

  createBenefit(newBenefit: any) {
    return this.http.post(`${this.backendUrl}/client/benefit/new`, newBenefit);
  }

  getUsers() {
    return this.http.get<User[]>(`${this.backendUrl}/user/all`);
  }

  getClients() {
    return this.http.get<Client[]>(`${this.backendUrl}/client/all`);
  }

  getDoctors() {
    return this.http.get<Doctor[]>(`${this.backendUrl}/user/doctor/all`);
  }

  deleteUser(userId: string) {
    return this.http.delete(`${this.backendUrl}/user/id/${userId}`);
  }

  deleteDoctor(doctorId: string) {
    return this.http.delete(`${this.backendUrl}/user/doctor/id/${doctorId}`);
  }

  deleteClient(clientId: string) {
    return this.http.delete(`${this.backendUrl}/client/id/${clientId}`);
  }

  deleteBenefit(benefitId: string) {
    return this.http.delete(
      `${this.backendUrl}/client/benefit/id/${benefitId}`,
    );
  }
}
