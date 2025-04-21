// article-types.const.ts

// 1. Type Definitions =================================
export interface ArticleTypeConfig {
  display: string;
  value: string;
  urlKey: string;
  formattedType: string;
}

export type ArticleTypeKey = keyof typeof ArticleTypes;

// 2. Main Configuration Object ========================
export const ArticleTypes = {
  LENS: {
    display: "Cristal",
    value: "LENS",
    urlKey: "lenses",
    formattedType: "Lenses",
  },
  SERVICE: {
    display: "Servicio",
    value: "SERVICE",
    urlKey: "service",
    formattedType: "Service",
  },
  CONTACT_LENSES: {
    display: "Lentes de Contacto",
    value: "CONTACT_LENSES",
    urlKey: "contact-lenses",
    formattedType: "ContactLenses",
  },
  FRAME: {
    display: "Armazón",
    value: "FRAME",
    urlKey: "frame",
    formattedType: "Frame",
  },
  HEARING_AID: {
    display: "Audífono",
    value: "HEARING_AID",
    urlKey: "hearing-aid",
    formattedType: "HearingAid",
  },
  ACCESSORY: {
    display: "Accesorio",
    value: "ACCESSORY",
    urlKey: "accessory",
    formattedType: "Accessory",
  },
  TREATMENT: {
    display: "Tratamiento",
    value: "TREATMENT",
    urlKey: "treatment",
    formattedType: "Treatment",
  },
} as const satisfies Record<string, ArticleTypeConfig>;

// 3. Type Utilities ===================================
export type ArticleTypeValues = (typeof ArticleTypes)[ArticleTypeKey]["value"];
export type ArticleTypeUrlKeys =
  (typeof ArticleTypes)[ArticleTypeKey]["urlKey"];

// 4. Utility Function to Get urlKey by Display ========================
export const getUrlKeyByDisplay = (display: string): string | null => {
  const entry = Object.values(ArticleTypes).find(
    (item) => item.display === display,
  );
  return entry ? entry.urlKey : null;
};

export const getUrlKeyByKey = (key: ArticleTypeKey): string | null => {
  const entry = ArticleTypes[key];
  return entry ? entry.urlKey : null;
};

export const getFormattedTypeByKey = (key: ArticleTypeKey): string | null => {
  const entry = ArticleTypes[key];
  return entry ? entry.formattedType : null;
};

export const getDisplayByUrlKey = (urlKey: string): string | null => {
  const entry = Object.values(ArticleTypes).find(
    (item) => item.urlKey === urlKey,
  );

  return entry ? entry.display : null;
};
