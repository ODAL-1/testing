import { Component, inject } from "@angular/core";
import { NavigationEnd, Router, RouterModule } from "@angular/router";
import { AuthService } from "../../services/auth.service";
import { Subject, takeUntil } from "rxjs";
import { BreakpointObserver, Breakpoints } from "@angular/cdk/layout";
@Component({
  selector: "main-header",
  imports: [RouterModule],
  templateUrl: "./header.component.html",
  styleUrl: "./header.component.scss",
})
export class HeaderComponent {
  private router = inject(Router);
  private authService = inject(AuthService);
  private destroy$ = new Subject<void>();
  private breakpointObserver: BreakpointObserver = inject(BreakpointObserver);

  protected logoSrc: string = "../../../assets/images/nueva-vision-logo.webp";
  protected isHidden: boolean = false;
  protected isLogin: boolean = false;
  protected hiddenRoutes: string[] = ["/404"];
  protected user: any | undefined;

  toTitleCase(str: any) {
    return str
      .toLowerCase()
      .split(" ")
      .map((word: any) => {
        return word.charAt(0).toUpperCase() + word.slice(1);
      })
      .join(" ");
  }

  doLogout() {
    this.authService.doLogout();
  }

  ngOnInit() {
    this.breakpointObserver
      .observe([Breakpoints.XSmall])
      .subscribe((result) => {
        this.logoSrc = result.matches
          ? "../../../assets/images/nueva-vision-logo-alt.webp"
          : "../../../assets/images/nueva-vision-logo.webp";
      });

    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.isHidden =
          this.hiddenRoutes.length > 0 && this.hiddenRoutes.includes(event.url);
        this.isLogin = event.url == "/auth";
      }
    });

    this.authService.user$.pipe(takeUntil(this.destroy$)).subscribe((user) => {
      this.user = user || {};
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
