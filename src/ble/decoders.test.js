import { describe, expect, it } from 'vitest';
import { decodeCscMeasurement, decodeCyclingPowerMeasurement, decodeHeartRateMeasurement } from './decoders.js';

function dataViewFromBytes(bytes) {
    return new DataView(Uint8Array.from(bytes).buffer);
}

describe('decodeHeartRateMeasurement', () => {
    it('decodes 8-bit heart rate without RR interval', () => {
        const value = dataViewFromBytes([
            0b00000000,
            72,
        ]);

        const decoded = decodeHeartRateMeasurement(value);

        expect(decoded).toEqual({
            heartRate: 72,
            rrInterval: null,
        });
    });

    it('decodes 16-bit heart rate with RR intervals and returns last RR', () => {
        const value = dataViewFromBytes([
            0b00010001,
            0x2c, 0x01,
            0x00, 0x02,
            0x00, 0x03,
        ]);

        const decoded = decodeHeartRateMeasurement(value);

        expect(decoded.heartRate).toBe(300);
        expect(decoded.rrInterval).toBeCloseTo(0.75);
    });
});

describe('decodeCyclingPowerMeasurement', () => {
    it('decodes power and returns next previous crank state', () => {
        const value = dataViewFromBytes([
            0x20, 0x00,
            0xfa, 0x00,
            0x00, 0x00,
            0x64, 0x00,
            0x00, 0x04,
        ]);

        const decoded = decodeCyclingPowerMeasurement(value, null);

        expect(decoded.power).toBe(250);
        expect(decoded.cadence).toBe(null);
        expect(decoded.nextPrev).toEqual({
            cumulativeCrankRevolutions: 100,
            lastCrankEventTime: 1024,
        });
    });

    it('calculates cadence from crank deltas', () => {
        const value = dataViewFromBytes([
            0x20, 0x00,
            0x2c, 0x01,
            0x00, 0x00,
            0x6e, 0x00,
            0x00, 0x06,
        ]);
        const prev = {
            cumulativeCrankRevolutions: 100,
            lastCrankEventTime: 1024,
        };

        const decoded = decodeCyclingPowerMeasurement(value, prev);

        expect(decoded.power).toBe(300);
        expect(decoded.cadence).toBe(1200);
    });

    it('handles 16-bit rollover for crank and time counters', () => {
        const value = dataViewFromBytes([
            0x20, 0x00,
            0x90, 0x01,
            0x00, 0x00,
            0x02, 0x00,
            0x00, 0x01,
        ]);
        const prev = {
            cumulativeCrankRevolutions: 65534,
            lastCrankEventTime: 65280,
        };

        const decoded = decodeCyclingPowerMeasurement(value, prev);

        expect(decoded.power).toBe(400);
        expect(decoded.cadence).toBe(480);
    });
});

describe('decodeCscMeasurement', () => {
    it('decodes wheel and crank data with calculated speed/cadence', () => {
        const value = dataViewFromBytes([
            0x03,
            0x0a, 0x00, 0x00, 0x00,
            0x00, 0x08,
            0x6e, 0x00,
            0x00, 0x06,
        ]);
        const prev = {
            wheel: { cumulativeWheelRevolutions: 0, lastWheelEventTime: 0 },
            crank: { cumulativeCrankRevolutions: 100, lastCrankEventTime: 1024 },
        };

        const decoded = decodeCscMeasurement(value, prev);

        expect(decoded.speedKmh).toBeCloseTo(37.9, 1);
        expect(decoded.cadence).toBe(1200);
        expect(decoded.nextPrevWheel).toEqual({ cumulativeWheelRevolutions: 10, lastWheelEventTime: 2048 });
        expect(decoded.nextPrevCrank).toEqual({ cumulativeCrankRevolutions: 110, lastCrankEventTime: 1536 });
    });

    it('handles counter rollovers for wheel and crank data', () => {
        const value = dataViewFromBytes([
            0x03,
            0x01, 0x00, 0x00, 0x00,
            0x00, 0x01,
            0x02, 0x00,
            0x00, 0x01,
        ]);
        const prev = {
            wheel: { cumulativeWheelRevolutions: 0xffffffff, lastWheelEventTime: 65280 },
            crank: { cumulativeCrankRevolutions: 65534, lastCrankEventTime: 65280 },
        };

        const decoded = decodeCscMeasurement(value, prev);

        expect(decoded.speedKmh).toBeCloseTo(30.3, 1);
        expect(decoded.cadence).toBe(480);
    });
});
