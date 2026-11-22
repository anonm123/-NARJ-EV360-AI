/** Operatör API adaptör sözleşmesi (OCPI 2.2.1 kavramlarıyla hizalı, sadeleştirilmiş). */
export interface Location {
  id: string;
  name: string;
  lat: number;
  lng: number;
  operatorId: string;
  evses: { id: string; connector: string; maxKw: number }[];
}
export type EvseStatus = { evseId: string; status: 'AVAILABLE' | 'CHARGING' | 'OUTOFORDER' | 'UNKNOWN'; source: 'live' | 'simulated'; at: string };
export interface Tariff { id: string; currency: 'TRY'; pricePerKwh: number; sessionFee: number; idleFeePerMin: number }
export interface ReservationRequest { evseId: string; startsAt: string; durationMin: number; token: string }
export interface ReservationResult { ok: boolean; reference?: string; reason?: string; simulated: boolean }

export interface OperatorAdapter {
  id: string;
  name: string;
  protocol: 'OCPI-2.2.1' | 'REST' | 'MOCK';
  status: 'demo' | 'planned' | 'live';
  listLocations(): Promise<Location[]>;
  getAvailability(evseId: string): Promise<EvseStatus>;
  reserve(req: ReservationRequest): Promise<ReservationResult>;
  getTariffs(): Promise<Tariff[]>;
}
