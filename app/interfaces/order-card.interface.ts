import { OrderStateKey } from "../constants/order-states.const";

export interface OrderCard {
  id: string;
  orderNumber?: string;
  clientName: string;
  document: string;
  date: Date;
  orderState: OrderStateKey;
}
