import { Injectable } from "@angular/core";
import { HttpClient, HttpParams } from "@angular/common/http";
import { Observable } from "rxjs";
import { environment } from "../../environments/environment";

@Injectable({
  providedIn: "root",
})
export class BillerService {
  private backendUrl = environment.backendUrl;

  constructor(private readonly http: HttpClient) {}

  emitirComprobante(payload: any): Observable<any> {
    return this.http.post(
      `${this.backendUrl}/biller/comprobantes/crear`,
      payload,
    );
  }

  anularComprobante(payload: any): Observable<any> {
    return this.http.post(
      `${this.backendUrl}/biller/comprobantes/anular`,
      payload,
    );
  }

  emitirRecibo(payload: any): Observable<any> {
    return this.http.post(`${this.backendUrl}/biller/recibos/crear`, payload);
  }

  crearCliente(payload: any): Observable<any> {
    return this.http.post(`${this.backendUrl}/biller/clientes/crear`, payload);
  }

  obtenerComprobantes(params: any): Observable<any> {
    return this.http.get(`${this.backendUrl}/biller/comprobantes/obtener`, {
      params: params,
    });
  }

  obtenerPdf(id: number): Observable<any> {
    return this.http.get(`${this.backendUrl}/biller/comprobantes/pdf`, {
      params: { id: id },
    });
  }

  obtenerComprobantesRecibidosDGI(
    desde: string,
    hasta: string,
  ): Observable<any> {
    const params = new HttpParams()
      .set("fecha_desde", desde)
      .set("fecha_hasta", hasta);

    return this.http.get(
      `${this.backendUrl}/biller/comprobantes/recibidos/obtener`,
      {
        params: params,
      },
    );
  }
}
