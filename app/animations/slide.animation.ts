import {
  trigger,
  transition,
  style,
  animate,
  query,
  stagger,
} from "@angular/animations";

export const slide = trigger("slide", [
  transition("* <=> *", [
    query(
      ":enter",
      [
        style({ opacity: 0, transform: "translateY(-100px)" }),
        stagger(100, [
          animate(
            "500ms ease-out",
            style({ opacity: 1, transform: "translateY(0px)" }),
          ),
        ]),
      ],
      { optional: true },
    ),
    query(
      ":leave",
      [
        style({ opacity: 1, transform: "translateY(0)" }),
        stagger(-100, [
          animate(
            "500ms ease-out",
            style({ opacity: 0, transform: "translateY(-100px)" }),
          ),
        ]),
      ],
      { optional: true },
    ),
  ]),
]);
