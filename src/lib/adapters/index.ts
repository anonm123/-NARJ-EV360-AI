import type { OperatorAdapter } from './types';
import { createMockAdapter } from './mock-adapter';

export type { OperatorAdapter } from './types';

/** Kayıtlı adaptörler. Gerçek OCPI adaptörleri ortaklık anlaşmaları sonrası eklenecektir. */
export const ADAPTERS: Pick<OperatorAdapter, 'id' | 'name' | 'protocol' | 'status'>[] = [
  ...['op-a', 'op-b'].map((id) => {
    const a = createMockAdapter(id);
    return { id: a.id, name: a.name, protocol: a.protocol, status: a.status };
  }),
  { id: 'ocpi-generic', name: 'Genel OCPI 2.2.1 istemcisi', protocol: 'OCPI-2.2.1', status: 'planned' },
  { id: 'rest-generic', name: 'Özel REST adaptör şablonu', protocol: 'REST', status: 'planned' },
];

export { createMockAdapter };
