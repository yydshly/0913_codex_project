/** Local-only adapter; no account SDK, relay, or external requests. */
import type { DuelSimulation, DuelOptions, DuelHit } from './physics';
import type { Action } from './net-state';
import { OFFLINE_STATUS } from './network-status';
export { OFFLINE_STATUS, type NetworkStatus } from './network-status';
export function createDuelNetwork(_sim: DuelSimulation, _callbacks: {
  reset(options: Partial<DuelOptions>): void; hit(hit: DuelHit): void;
  changed(): void; canStartBot(): boolean;
}) {
  return {
    active: false, status: OFFLINE_STATUS,
    action(_name: Action) {}, hit(_hit: DuelHit) {}, render() {}, leave() {}, dispose() {},
    join() { throw new Error('本地研究版仅提供离线对战。'); },
  };
}
