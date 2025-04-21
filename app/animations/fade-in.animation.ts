import { trigger, style, transition, animate } from "@angular/animations";

export const fadeIn = trigger("fadeIn", [
  transition(":enter", [
    style({
      opacity: 0,
    }),
    animate(
      "250ms ease-out",
      style({
        opacity: 1,
      }),
    ),
  ]),
  transition(":leave", [
    style({
      opacity: 1,
    }),
    animate(
      "100ms ease-out",
      style({
        opacity: 0,
      }),
    ),
  ]),
]);
