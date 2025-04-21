import { trigger, style, transition, animate } from "@angular/animations";

export const zoomOut = trigger("zoomOut", [
  transition(
    ":enter",
    [
      style({
        opacity: 0,
        transform: "scale(1.2)",
      }),
      animate(
        "{{duration}}ms ease-out",
        style({
          opacity: 1,
          transform: "scale(1)",
        }),
      ),
    ],
    { params: { duration: 500 } },
  ),
  transition(":leave", [
    style({
      opacity: 1,
    }),
    animate(
      "150ms ease-out",
      style({
        opacity: 0,
      }),
    ),
  ]),
]);
