export interface Client {
  _id: string;
  email: string;
  name: string;
  lastName: string;
  document: string;
  phoneNumber: string;
  address: string;
  createdAt: Date;
  type?: string;
  isEdit?: boolean;
}
