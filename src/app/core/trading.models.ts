export interface Portfolio {
  ID: string;
  name?: string | null;
  holdingIds: string[];
  type: PortfolioType;
}

export interface Holding {
  holdingId: string;
  dateCreated: string;
  instrumentId: string;
  instrumentSymbol: string;
  instrumentName: string;
  instrumentType: InstrumentType;
  orderId: string;
  purchasedPrice: number;
  quantity: number;
}

export const PORTFOLIO_TYPES = ['RETIREMENT', 'BROKERAGE'] as const;
export const INSTRUMENT_TYPES = ['EQUITY', 'CASH', 'CRYPTO'] as const;
export const NON_DEPOSIT_ORDER_TYPES = [
  { value: 'US_EQUITY', label: 'US Equity' },
  { value: 'INDIA_EQUITY', label: 'India Equity' },
  { value: 'CRYPTO', label: 'Cryptocurrency' },
  { value: 'FOREX', label: 'Foreign Exchange' },
] as const;
export const ORDER_TYPES = [
  ...NON_DEPOSIT_ORDER_TYPES,
  { value: 'DEPOSIT', label: 'Deposit' },
] as const;
export const ORDER_STATUSES = ['PENDING', 'ACCEPTED', 'REJECTED', 'FULFILLED', 'CANCELLED'] as const;
export const SIDES = ['BUY', 'SELL', 'DEPOSIT'] as const;

export type PortfolioType = typeof PORTFOLIO_TYPES[number];
export type InstrumentType = typeof INSTRUMENT_TYPES[number];
export type NonDepositOrderType = typeof NON_DEPOSIT_ORDER_TYPES[number]["value"];
export type OrderType = typeof ORDER_TYPES[number]["value"];
export type OrderStatus = typeof ORDER_STATUSES[number];
export type Side = typeof SIDES[number];


export function isInstrumentType(value: string | null): value is InstrumentType {
  return value !== null && INSTRUMENT_TYPES.some(type => type === value);
}
export function isPortfolioType(value: string | null): value is PortfolioType {
  return value !== null && PORTFOLIO_TYPES.some(type => type === value);
}
export function isOrderType(value: string | null): value is OrderType {
  return value !== null && ORDER_TYPES.some(type => type.value === value);
}
export function isNonDepositOrderType(value: string | null): value is NonDepositOrderType {
  return value !== null && NON_DEPOSIT_ORDER_TYPES.some(type => type.value === value);
}


export interface OrderRequest {
  clientId: string;
  clientName: string;
  portfolioId: string;
  addInstrumentSymbol: string;
  addInstrumentType: string;
  subtractInstrumentSymbol: string;
  subtractInstrumentType: string;
  quantity: number;
  quotedPrice: number;
  side: Side;
  changeThreshold: number;
  market: string;
}

export interface OrderResponse {
  orderId: string;
  clientId: string;
  portfolioId: string;
  addInstrumentSymbol: string;
  addInstrumentType: InstrumentType;
  addInstrumentFullName: string;
  subtractInstrumentSymbol: string;
  subtractInstrumentType: InstrumentType;
  subtractInstrumentFullName: string;
  quantity: number;
  quotedPrice: number;
  side: Side;
  changeThreshold: number;
  createdDate: string;
  resolvedDate: string;
  currentStatus: OrderStatus;
}

// pushed by the backend on /topic/orders/{orderId} (STOMP over WebSocket)
export interface OrderStatusUpdate {
  orderId: string;
  status: OrderStatus;
  message: string;
  timestamp: string;
  terminal: boolean;
}
