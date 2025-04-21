export interface BenefitClient {
  _id: string;
  name: string;
  discountedValue: number;
  isActive: boolean;
  createdAt?: Date;
  isEdit?: boolean;
}
