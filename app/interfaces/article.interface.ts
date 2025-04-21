export interface Article {
  _id?: string;
  name: string;
  model: string;
  brand: string;
  style: string;
  currency: string;
  type?: string;
  appliesTo?: string;
  price: number;
  stock: number;
  isSunglasses: boolean;
  lensType: "MONOFOCAL" | "BIFOCAL" | "MULTIFOCAL";
  lensPosition?: "OD" | "OI";
  productOrigin: "LABORATORIO" | "STOCK";
}
