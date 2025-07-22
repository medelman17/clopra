import { Municipality, Ordinance, Custodian } from '@prisma/client';

export { RequestStatus } from '@prisma/client';

export interface ScrapeResult {
  municipality: Municipality;
  ordinance: Ordinance | null;
  custodian: Custodian | null;
}