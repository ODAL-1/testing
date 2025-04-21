import {
  trigger,
  state,
  style,
  transition,
  animate,
} from "@angular/animations";

export const checkBoxGrow = trigger("checkboxGrow", [
  state(
    "false",
    style({
      opacity: 0,
      transform: "translate(-50%,-50%) scale(0)",
    }),
  ),
  state(
    "true",
    style({
      opacity: 1,
      transform: "translate(-50%,-50%) scale(1) ",
    }),
  ),
  transition("false <=> true", [animate("250ms ease-in-out")]),
]);

export const altCheckBoxGrow = trigger("altCheckBoxGrow", [
  state(
    "false",
    style({
      opacity: 0,
      transform: "translate(-50%,-50%) rotate(45deg) scale(0)",
    }),
  ),
  state(
    "true",
    style({
      opacity: 1,
      transform: "translate(-50%,-50%) rotate(45deg) scale(1) ",
    }),
  ),
  transition("false <=> true", [animate("250ms ease-in-out")]),
]);
