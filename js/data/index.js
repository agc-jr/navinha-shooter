import { SHIPS, getShipById } from './ships.js';
import { WEAPONS, getWeaponById } from './weapons.js';
import { PHASES, getPhaseById } from './phases.js';

export function getShips() {
    return SHIPS;
}

export function getWeapons() {
    return WEAPONS;
}

export function getPhases() {
    return PHASES;
}

export { getShipById, getWeaponById, getPhaseById };
