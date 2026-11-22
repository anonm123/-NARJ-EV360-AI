import type { OperatorAdapter } from './types';
import { SAMPLE_STATIONS } from '../data/stations';
import { SAMPLE_OPERATORS } from '../data/operators';

/** Örnek veri setini OperatorAdapter arayüzüyle sunan demo adaptör. Tüm çıktılar `simulated` işaretlidir. */
export function createMockAdapter(operatorId: string): OperatorAdapter {
  const op = SAMPLE_OPERATORS.find((o) => o.id === operatorId)!;
  const mine = SAMPLE_STATIONS.filter((s) => s.operatorId === operatorId);
  return {
    id: `mock-${operatorId}`,
    name: `${op.name} · demo adaptör`,
    protocol: 'MOCK',
    status: 'demo',
    async listLocations() {
      return mine.map((s) => ({ id: s.id, name: s.name, lat: s.lat, lng: s.lng, operatorId, evses: Array.from({ length: s.points }, (_, i) => ({ id: `${s.id}-${i + 1}`, connector: s.connectors[i % s.connectors.length], maxKw: s.maxKw })) }));
    },
    async getAvailability(evseId) {
      const st = mine.find((s) => evseId.startsWith(s.id));
      const map = { available: 'AVAILABLE', busy: 'CHARGING', offline: 'OUTOFORDER' } as const;
      return { evseId, status: st ? map[st.demoStatus] : 'UNKNOWN', source: 'simulated', at: new Date().toISOString() };
    },
    async reserve(req) {
      if (!mine.some((s) => req.evseId.startsWith(s.id))) return { ok: false, reason: 'EVSE bulunamadı', simulated: true };
      return { ok: true, reference: `SIM-${Date.now().toString(36).toUpperCase()}`, simulated: true };
    },
    async getTariffs() {
      return [
        { id: `${operatorId}-ac`, currency: 'TRY', pricePerKwh: op.acPrice, sessionFee: op.sessionFee, idleFeePerMin: op.idleFeePerMin },
        { id: `${operatorId}-dc`, currency: 'TRY', pricePerKwh: op.dcPrice, sessionFee: op.sessionFee, idleFeePerMin: op.idleFeePerMin },
      ];
    },
  };
}
