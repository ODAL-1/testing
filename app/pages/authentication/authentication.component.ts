import { Component, inject } from "@angular/core";
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { AuthService } from "../../services/auth.service";
import { ToastService } from "../../services/toast.service";

@Component({
  selector: "app-authentication",
  imports: [ReactiveFormsModule],
  templateUrl: "./authentication.component.html",
  styleUrl: "./authentication.component.scss",
})
export class AuthenticationComponent {
  // Private variables declaration
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);

  // Protected variables declaration
  protected showPassword: boolean = false;

  protected loginForm: FormGroup = this.fb.group({
    identifier: new FormControl("", [Validators.required]),
    password: new FormControl("", [Validators.required]),
  });

  // Public functions
  doLogin(): void {
    if (this.loginForm.valid) {
      this.authService.doLogin(
        this.loginForm.value.identifier,
        this.loginForm.value.password,
      );
    } else {
      if (!this.loginForm.get("identifier")?.value) {
        this.toastService.showToast({
          message: "El identificador no puede estar vacío",
          type: "warning",
          showIcon: true,
        });
      }

      if (!this.loginForm.get("password")?.value) {
        this.toastService.showToast({
          message: "La contraseña no puede estar vacía",
          type: "warning",
          showIcon: true,
        });
      }
    }
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }
}
