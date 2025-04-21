import {
  trigger,
  transition,
  style,
  animate,
  query,
  stagger,
} from "@angular/animations";

export const zoomInList = trigger("zoomInList", [
  transition("* => *", [
    query(
      ":enter",
      [
        style({ opacity: 0, transform: "scale(0.5)" }),
        stagger("100ms", [
          animate(
            "200ms ease-out",
            style({ opacity: 1, transform: "scale(1)" }),
          ),
        ]),
      ],
      { optional: true },
    ),
  ]),
]);

export const zoomIn = trigger("zoomIn", [
  transition(
    ":enter",
    [
      style({
        opacity: 0,
        transform: "scale(0.5)",
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
