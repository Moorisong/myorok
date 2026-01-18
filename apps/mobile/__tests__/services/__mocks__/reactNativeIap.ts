export const initConnection = jest.fn(() => Promise.resolve());
export const endConnection = jest.fn(() => Promise.resolve());
export const requestPurchase = jest.fn(() => Promise.resolve());
export const getAvailablePurchases = jest.fn(() => Promise.resolve([]));
export const purchaseUpdatedListener = jest.fn(() => ({ remove: jest.fn() }));
export const purchaseErrorListener = jest.fn(() => ({ remove: jest.fn() }));
export const finishTransaction = jest.fn(() => Promise.resolve());

export type Product = {
  productId: string;
  price: string;
  currency: string;
  title: string;
  description: string;
};

export type Purchase = {
  productId: string;
  transactionId?: string;
  transactionDate?: number;
  transactionReceipt?: string;
  purchaseToken?: string;
  autoRenewingAndroid?: boolean;
  dataAndroid?: string;
  purchaseStateAndroid?: number;
};

export type PurchaseError = {
  code: string;
  message: string;
};
