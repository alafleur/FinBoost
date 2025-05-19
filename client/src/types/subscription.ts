export interface Subscriber {
  id: number;
  email: string;
  createdAt: string;
}

export interface SubscribeRequest {
  email: string;
}

export interface SubscribeResponse {
  success: boolean;
  message: string;
}
