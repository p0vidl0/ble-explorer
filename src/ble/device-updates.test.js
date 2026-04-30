import { describe, expect, it } from 'vitest';
import { applyHeartRateUpdate, applyPowerMeterUpdate, applySpeedCadenceUpdate } from './device-updates.js';

describe('applyHeartRateUpdate', () => {
    it('applies heart rate and rr interval values', () => {
        const current = { name: 'HRM', heartRate: '--', rrInterval: '--' };
        const decoded = { heartRate: 152, rrInterval: 0.8125 };

        const next = applyHeartRateUpdate(current, decoded);

        expect(next).toEqual({
            name: 'HRM',
            heartRate: 152,
            rrInterval: '813 ms',
        });
    });

    it('falls back to placeholders when decoded values are missing', () => {
        const next = applyHeartRateUpdate({ heartRate: 120, rrInterval: '900 ms' }, { heartRate: null, rrInterval: null });
        expect(next.heartRate).toBe('--');
        expect(next.rrInterval).toBe('--');
    });
});

describe('applyPowerMeterUpdate', () => {
    it('formats power/cadence and stores next prev state', () => {
        const current = { cadence: '--' };
        const decoded = {
            power: 278.8,
            cadence: 95,
            nextPrev: { cumulativeCrankRevolutions: 12, lastCrankEventTime: 1024 },
        };

        const next = applyPowerMeterUpdate(current, decoded);

        expect(next.power).toBe('279 W');
        expect(next.cadence).toBe('95 rpm');
        expect(next._prevCrank).toEqual(decoded.nextPrev);
    });

    it('keeps previous cadence if decoded cadence is not finite', () => {
        const current = { cadence: '88 rpm' };
        const decoded = { power: 220, cadence: null, nextPrev: null };

        const next = applyPowerMeterUpdate(current, decoded);

        expect(next.power).toBe('220 W');
        expect(next.cadence).toBe('88 rpm');
    });
});

describe('applySpeedCadenceUpdate', () => {
    it('formats speed/cadence and stores previous counters', () => {
        const current = { speed: '--', cadence: '--' };
        const decoded = {
            speedKmh: 32.27,
            cadence: 88,
            nextPrevWheel: { cumulativeWheelRevolutions: 1000, lastWheelEventTime: 2048 },
            nextPrevCrank: { cumulativeCrankRevolutions: 210, lastCrankEventTime: 4096 },
        };

        const next = applySpeedCadenceUpdate(current, decoded);

        expect(next.speed).toBe('32.3 km/h');
        expect(next.cadence).toBe('88 rpm');
        expect(next._prevWheel).toEqual(decoded.nextPrevWheel);
        expect(next._prevCscCrank).toEqual(decoded.nextPrevCrank);
    });

    it('keeps previous values when decoded metrics are missing', () => {
        const current = { speed: '30.0 km/h', cadence: '91 rpm' };
        const decoded = { speedKmh: null, cadence: null, nextPrevWheel: null, nextPrevCrank: null };

        const next = applySpeedCadenceUpdate(current, decoded);

        expect(next.speed).toBe('30.0 km/h');
        expect(next.cadence).toBe('91 rpm');
    });
});
