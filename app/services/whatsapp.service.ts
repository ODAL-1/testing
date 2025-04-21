import { Injectable } from "@angular/core";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Observable } from "rxjs";
import { environment } from "../../environments/environment";

export interface WhatsappMessage {
  to: string;
  templateName: string;
  templateData: Record<string, string>;
  language?: string;
}

@Injectable({
  providedIn: "root",
})
export class WhatsappService {
  // private apiUrl = "https://graph.facebook.com/v17.0";
  // private phoneNumberId = environment.WHATSAPP_PHONE_NUMBER_ID;
  // private accessToken = environment.WHATSAPP_ACCESS_TOKEN;
  // private businessAccountId = environment.WHATSAPP_BUSINESS_ACCOUNT_ID;
  // constructor(private http: HttpClient) {}
  // /**
  // * @param message
  //  * @returns
  //  */
  // sendTemplateMessage(message: WhatsappMessage): Observable<any> {
  //   const headers = new HttpHeaders({
  //     "Content-Type": "application/json",
  //     Authorization: `Bearer ${this.accessToken}`,
  //   });
  //   const components = this.buildTemplateComponents(message.templateData);
  //   const body = {
  //     messaging_product: "whatsapp",
  //     to: message.to,
  //     type: "template",
  //     template: {
  //       name: message.templateName,
  //       language: {
  //         code: message.language || "es",
  //       },
  //       components,
  //     },
  //   };
  //   return this.http.post(
  //     `${this.apiUrl}/${this.phoneNumberId}/messages`,
  //     body,
  //     { headers },
  //   );
  // }
  // /**@param data;
  // @returns
  // */
  // private buildTemplateComponents(data: Record<string, string>): any[] {
  //   const components = [];
  //   if (Object.keys(data).length > 0) {
  //     const parameters = Object.entries(data).map(([_, value]) => ({
  //       type: "text",
  //       text: value,
  //     }));
  //     components.push({
  //       type: "body",
  //       parameters,
  //     });
  //   }
  //   return components;
  // }
}
