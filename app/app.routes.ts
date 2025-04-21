import { Routes } from "@angular/router";
import { authGuard } from "./guards/auth.guard";

export const routes: Routes = [
  {
    path: "",
    redirectTo: "/home",
    pathMatch: "full",
  },
  {
    path: "auth",
    loadComponent: () =>
      import("./pages/authentication/authentication.component").then(
        (m) => m.AuthenticationComponent,
      ),
  },
  {
    path: "home",
    loadComponent: () =>
      import("./pages/home/home.component").then((m) => m.HomeComponent),
    canActivate: [authGuard],
  },
  {
    path: "orders",
    loadComponent: () =>
      import("./pages/orders/orders.component").then((m) => m.OrdersComponent),
    canActivate: [authGuard],
  },
  {
    path: "orders/edit/:id",
    loadComponent: () =>
      import("./pages/orders/edit-order/edit-order.component").then(
        (m) => m.EditOrderComponent,
      ),
    canActivate: [authGuard],
  },
  {
    path: "inventory",
    loadComponent: () =>
      import("./pages/inventory/inventory.component").then(
        (m) => m.InventoryComponent,
      ),
    canActivate: [authGuard],
  },
  {
    path: "inventory/new",
    loadComponent: () =>
      import("./pages/inventory/add-article/add-article.component").then(
        (m) => m.AddArticleComponent,
      ),
    canActivate: [authGuard],
  },
  {
    path: "administrate",
    loadComponent: () =>
      import("./pages/administrate/administrate.component").then(
        (m) => m.AdministrateComponent,
      ),
    canActivate: [authGuard],
  },
  {
    path: "statistics",
    loadComponent: () =>
      import("./pages/statistics/statistics.component").then(
        (m) => m.StatisticsComponent,
      ),
    canActivate: [authGuard],
  },
  {
    path: "billing",
    loadComponent: () =>
      import("./pages/billing/billing.component").then(
        (m) => m.BillingComponent,
      ),
    canActivate: [authGuard],
  },
  {
    path: "404",
    loadComponent: () =>
      import("./pages/not-found/not-found.component").then(
        (m) => m.NotFoundComponent,
      ),
  },
  {
    path: "**",
    redirectTo: "/404",
  },
];
