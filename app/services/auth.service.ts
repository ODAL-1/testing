import { environment } from "./../../environments/environment";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Inject, Injectable, PLATFORM_ID } from "@angular/core";
import { Router } from "@angular/router";
import { BehaviorSubject, Subject, takeUntil } from "rxjs";
import { ToastService } from "./toast.service";
import { jwtDecode } from "jwt-decode";

import { isPlatformBrowser } from "@angular/common";

@Injectable({
  providedIn: "root",
})
export class AuthService {
  private readonly TOKEN_KEY = "authToken";
  private backendUrl = environment.backendUrl;
  private userSubject = new BehaviorSubject<any | null>(this.getUserInfo());
  private destroy$ = new Subject<void>();

  constructor(
    private http: HttpClient,
    private router: Router,
    private toastService: ToastService,
    @Inject(PLATFORM_ID) private platformId: Object,
  ) {
    this.ifExpiredDoLogout();
  }

  private setToken(token: string) {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(this.TOKEN_KEY, token);
    }
  }

  getToken(): string | null {
    if (isPlatformBrowser(this.platformId)) {
      return localStorage.getItem(this.TOKEN_KEY);
    }
    return null;
  }

  getAuthHeaders(): HttpHeaders {
    const token = this.getToken();
    return new HttpHeaders({
      Authorization: token ? `Bearer ${token}` : "",
    });
  }

  getUserInfo(): any | null {
    const token = this.getToken();
    if (!token) return null;

    try {
      const decodedToken: any = jwtDecode(token);
      if (this.isTokenExpired(decodedToken)) {
        this.doLogout();
        return null;
      }
      return decodedToken;
    } catch (error) {
      console.error("Invalid JWT token:", error);
      return null;
    }
  }

  isTokenExpired(decodedToken: any): boolean {
    const currentTime = Math.floor(Date.now() / 1000);
    return decodedToken.exp <= currentTime;
  }

  get user$() {
    return this.userSubject.asObservable();
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    return !!token && !this.isTokenExpired(jwtDecode(token));
  }

  doLogin(identifier: string, password: string) {
    return this.http
      .post<{ token: string }>(`${this.backendUrl}/auth/login`, {
        identifier,
        password,
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.setToken(response.token);
          this.userSubject.next(this.getUserInfo());
          this.router.navigateByUrl("/home");
        },
        error: (error) => {
          if (error.status === 500) {
            this.toastService.showToast({
              message: "Usuario o contraseña incorrectos",
              type: "warning",
              showIcon: true,
            });
          }

          if (error.status === 0) {
            this.toastService.showToast({
              message: "Error al iniciar sesión",
              type: "error",
              showIcon: true,
            });
          }
        },
      });
  }

  doLogout() {
    this.deleteToken();
    this.userSubject.next(null);
    this.router.navigateByUrl("/auth");
  }

  ifExpiredDoLogout() {
    const token = this.getToken();
    if (token && this.isTokenExpired(token)) {
      this.doLogout();
    }
  }

  private deleteToken() {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem(this.TOKEN_KEY);
    }
  }
}
