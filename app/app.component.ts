import { Component, inject } from "@angular/core";
import { ActivatedRoute, RouterModule, RouterOutlet } from "@angular/router";
import { HeaderComponent } from "./layout/header/header.component";
import { SideBarComponent } from "./layout/side-bar/side-bar.component";
import { ToastComponent } from "./layout/toast/toast.component";
import { ToastService } from "./services/toast.service";
import { routeTransition } from "./animations/route-transition.animation";
import { Subject, takeUntil } from "rxjs";
@Component({
  selector: "app-root",
  imports: [
    RouterOutlet,
    RouterModule,
    HeaderComponent,
    SideBarComponent,
    ToastComponent,
  ],
  animations: [routeTransition],
  templateUrl: "./app.component.html",
  styleUrl: "./app.component.scss",
})
export class AppComponent {
  private toastService = inject(ToastService);
  private destroy$ = new Subject<void>();

  protected isToastActive: boolean = false;
  protected title: string = "Nueva Vision";
  protected route = inject(ActivatedRoute);

  ngOnInit(): void {
    this.toastService.toasts$
      .pipe(takeUntil(this.destroy$))
      .subscribe((toasts) => {
        this.isToastActive = toasts.length > 0;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
