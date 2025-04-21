// sale-types.const.ts

// 1. Type Definitions =================================
export interface SaleTypeConfig {
  display: string;
  value: string;
}

export type SaleTypeKey = keyof typeof SaleTypes;

// 2. Main Configuration Object ========================
export const SaleTypes = {
  LENSES: {
    display: "Lentes",
    value: "LENSES",
  },
  SUNGLASSES: {
    display: "Lentes de sol",
    value: "SUNGLASSES",
  },
  CONTACT_LENSES: {
    display: "Lentes de contacto",
    value: "CONTACT_LENSES",
  },
  SERVICE: {
    display: "Servicio",
    value: "SERVICE",
  },
  HEARING_AID: {
    display: "Audífonos",
    value: "HEARING_AID",
  },
  ACCESSORY: {
    display: "Accesorio",
    value: "ACCESSORY",
  },
} as const satisfies Record<string, SaleTypeConfig>;

// 3. Type Utilities ===================================
export type SaleTypeValues = (typeof SaleTypes)[SaleTypeKey]["value"];
