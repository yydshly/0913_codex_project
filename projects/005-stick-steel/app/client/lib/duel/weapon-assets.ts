import type { WeaponKind } from './weapons';

export const WEAPON_ASSETS: Record<WeaponKind, string> = {
  sword: (import.meta.env?.BASE_URL ?? './') + 'assets/sword.glb',
  greatsword: (import.meta.env?.BASE_URL ?? './') + 'assets/greatsword.glb',
  mace: (import.meta.env?.BASE_URL ?? './') + 'assets/mace.glb',
};
// Retained on disk alongside the untouched provider original for easy restoration.
export const PREVIOUS_SWORD_ASSET = (import.meta.env?.BASE_URL ?? './') + 'assets/sword.glb';
export const BRASS_SWORD_ASSET = (import.meta.env?.BASE_URL ?? './') + 'assets/sword-forged-cmtvnboe9001y2poagte9orpv.glb';
export const RAVENBLADE_ASSET = (import.meta.env?.BASE_URL ?? './') + 'assets/ravenblade-cmtvp6o7m00002bmxz9mp6bpm.glb';
export const ALL_WEAPON_ASSETS = { ...WEAPON_ASSETS, ravenblade: RAVENBLADE_ASSET };
