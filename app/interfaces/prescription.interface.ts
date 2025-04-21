import { EyePrescription } from "./eye-prescription.interface";

export interface Prescription {
  _id?: string;
  document: string;
  near?: EyePrescription;
  far?: EyePrescription;
  observations?: string;
  doctor?: string;
  createdAt?: Date;
}
