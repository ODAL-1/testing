// order-state.const.ts

// 1. Type Definitions =================================
export interface OrderStateConfig {
  display: string;
  value: string;
}

export type OrderStateKey = keyof typeof OrderStates;

// 2. Main Configuration Object ========================
export const OrderStates = {
  REGISTERED: {
    display: "Registrado",
    value: "REGISTERED",
  },
  INCOURSE: {
    display: "En curso",
    value: "INCOURSE",
  },
  FINISHED: {
    display: "Finalizado",
    value: "FINISHED",
  },
  DELIVERED: {
    display: "Entregado",
    value: "DELIVERED",
  },
} as const satisfies Record<string, OrderStateConfig>;

// 3. Type Utilities ===================================
export type OrderStateValues = (typeof OrderStates)[OrderStateKey]["value"];
