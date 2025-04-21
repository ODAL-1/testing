export interface User {
  _id: string;
  email: string;
  username: string;
  password: string;
  privilege?: "ADMINISTRADOR" | "USUARIO";
  profilePicture?: string;
  createdAt: Date;
  isEdit?: boolean;
}
