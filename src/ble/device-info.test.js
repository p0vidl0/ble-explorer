import { describe, expect, it } from 'vitest';
import { DEVICE_INFORMATION_SERVICE_UUID } from '../device-definitions.js';
import { detectDeviceType, readOptionalInfo } from './device-info.js';

function makeCharacteristicFromText(text) {
    const encoder = new TextEncoder();
    const bytes = encoder.encode(text);
    return {
        readValue: async () => new DataView(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength)),
    };
}

describe('detectDeviceType', () => {
    it('returns matching definition for available service', async () => {
        const uuids = {
            fitnessMachine: 'fm',
            fec: 'fec',
            wahooFitnessMachine: 'wahoo',
            cyclingPower: 'cp',
            speedCadence: 'sc',
            heartRate: 'hr',
            smo2: 'smo2',
            coreTemp: 'core',
            corePrivate: 'corep',
        };

        const server = {
            getPrimaryService: async (uuid) => {
                if (uuid === 'cp') return { ok: true };
                throw new Error('not found');
            },
        };

        const definition = await detectDeviceType(server, uuids);
        expect(definition?.id).toBe('powerMeter');
    });

    it('returns null when none of known services are available', async () => {
        const uuids = {
            fitnessMachine: 'fm',
            fec: 'fec',
            wahooFitnessMachine: 'wahoo',
            cyclingPower: 'cp',
            speedCadence: 'sc',
            heartRate: 'hr',
            smo2: 'smo2',
            coreTemp: 'core',
            corePrivate: 'corep',
        };
        const server = {
            getPrimaryService: async () => {
                throw new Error('not found');
            },
        };

        const definition = await detectDeviceType(server, uuids);
        expect(definition).toBeNull();
    });
});

describe('readOptionalInfo', () => {
    it('reads battery and DIS fields when services are available', async () => {
        const uuids = {
            battery: 'battery-service',
            batteryLevel: 'battery-level',
            manufacturerNameString: 'manufacturer',
            modelNumberString: 'model',
            firmwareRevisionString: 'firmware',
        };

        const batteryService = {
            getCharacteristic: async (uuid) => {
                if (uuid !== 'battery-level') throw new Error('wrong uuid');
                return {
                    readValue: async () => new DataView(Uint8Array.from([88]).buffer),
                };
            },
        };
        const disService = {
            getCharacteristic: async (uuid) => {
                if (uuid === 'manufacturer') return makeCharacteristicFromText('Wahoo');
                if (uuid === 'model') return makeCharacteristicFromText('KICKR');
                if (uuid === 'firmware') return makeCharacteristicFromText('1.2.3');
                throw new Error('unknown char');
            },
        };
        const server = {
            getPrimaryService: async (uuid) => {
                if (uuid === 'battery-service') return batteryService;
                if (uuid === DEVICE_INFORMATION_SERVICE_UUID) return disService;
                throw new Error('missing service');
            },
        };

        const info = await readOptionalInfo(server, uuids);
        expect(info).toEqual({
            battery: '88%',
            manufacturer: 'Wahoo',
            model: 'KICKR',
            firmware: '1.2.3',
        });
    });

    it('falls back to placeholders when reads fail', async () => {
        const uuids = {
            battery: 'battery-service',
            batteryLevel: 'battery-level',
            manufacturerNameString: 'manufacturer',
            modelNumberString: 'model',
            firmwareRevisionString: 'firmware',
        };
        const server = {
            getPrimaryService: async () => {
                throw new Error('unavailable');
            },
        };

        const info = await readOptionalInfo(server, uuids);
        expect(info).toEqual({
            battery: '--',
            manufacturer: '--',
            model: '--',
            firmware: '--',
        });
    });
});
