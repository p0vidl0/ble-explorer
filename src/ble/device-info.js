import { DEVICE_INFORMATION_SERVICE_UUID, deviceDefinitions } from '../device-definitions.js';

export async function readOptionalInfo(server, uuids) {
    let battery = '--';
    let manufacturer = '--';
    let model = '--';
    let firmware = '--';

    try {
        const batteryService = await server.getPrimaryService(uuids.battery);
        const batteryChar = await batteryService.getCharacteristic(uuids.batteryLevel);
        const batteryValue = await batteryChar.readValue();
        battery = `${batteryValue.getUint8(0)}%`;
    } catch {}

    try {
        const dis = await server.getPrimaryService(DEVICE_INFORMATION_SERVICE_UUID);
        const decoder = new TextDecoder('utf-8');

        const decoded = await Promise.allSettled([
            dis.getCharacteristic(uuids.manufacturerNameString).then((ch) => ch.readValue()).then((v) => decoder.decode(v)),
            dis.getCharacteristic(uuids.modelNumberString).then((ch) => ch.readValue()).then((v) => decoder.decode(v)),
            dis.getCharacteristic(uuids.firmwareRevisionString).then((ch) => ch.readValue()).then((v) => decoder.decode(v)),
        ]);

        manufacturer = decoded[0].status === 'fulfilled' ? decoded[0].value : '--';
        model = decoded[1].status === 'fulfilled' ? decoded[1].value : '--';
        firmware = decoded[2].status === 'fulfilled' ? decoded[2].value : '--';
    } catch {}

    return {
        battery,
        manufacturer,
        model,
        firmware,
    };
}

export async function detectDeviceType(server, uuids) {
    for (const definition of deviceDefinitions) {
        for (const serviceKey of definition.serviceKeys) {
            try {
                await server.getPrimaryService(uuids[serviceKey]);
                return definition;
            } catch {}
        }
    }
    return null;
}
