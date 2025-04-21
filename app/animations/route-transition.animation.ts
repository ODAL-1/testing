import {
  trigger,
  style,
  transition,
  animate,
  query,
} from "@angular/animations";

export const routeTransition = trigger("routeTransition", [
  transition("* => *", [
    query(":enter", [style({ opacity: 0 })], { optional: true }),
    query(":leave", [animate("250ms ease-out", style({ opacity: 0 }))], {
      optional: true,
    }),
    query(":enter", [animate("250ms ease-out", style({ opacity: 1 }))], {
      optional: true,
    }),
  ]),
]);
