const services = {
    fitnessMachine: '00001826-0000-1000-8000-00805f9b34fb',
    cyclingPower: '00001818-0000-1000-8000-00805f9b34fb',
    heartRate: '0000180d-0000-1000-8000-00805f9b34fb',
    speedCadence: '00001816-0000-1000-8000-00805f9b34fb',
    battery: '0000180f-0000-1000-8000-00805f9b34fb',
    deviceInformation: '0000180a-0000-1000-8000-00805f9b34fb',
    fec: '6e40fec1-b5a3-f393-e0a9-e50e24dcca9e',
    wahooFitnessMachine: 'a026ee0b-0a7d-4ab3-97fa-f1500f9feb8b',
    raceController: '00000001-19ca-4651-86e5-fa29dcdd09d1',
    smo2: '6404d801-4cb9-11e8-b566-0800200c9a66',
    coreTemp: '00002100-5b1e-4347-b07c-97b514dae121',
    corePrivate: '00004200-f366-40b2-ac37-70cce0aa83b1',
};

const characteristics = {
    batteryLevel: '00002a19-0000-1000-8000-00805f9b34fb',
    heartRateMeasurement: '00002a37-0000-1000-8000-00805f9b34fb',
    cyclingPowerMeasurement: '00002a63-0000-1000-8000-00805f9b34fb',
    manufacturerNameString: '00002a29-0000-1000-8000-00805f9b34fb',
    modelNumberString: '00002a24-0000-1000-8000-00805f9b34fb',
    firmwareRevisionString: '00002a26-0000-1000-8000-00805f9b34fb',
};

const uuids = { ...services, ...characteristics };

function genericFilters() {
    return [
        { services: [uuids.fitnessMachine] },
        { services: [uuids.fec] },
        { services: [uuids.wahooFitnessMachine] },
        { services: [uuids.cyclingPower] },
        { services: [uuids.speedCadence] },
        { services: [uuids.raceController] },
        { services: [uuids.smo2] },
        { services: [uuids.heartRate] },
        { services: [uuids.coreTemp] },
    ];
}

function genericOptionalServices() {
    return [
        uuids.battery,
        uuids.deviceInformation,
        uuids.heartRate,
        uuids.speedCadence,
        uuids.cyclingPower,
        uuids.coreTemp,
        uuids.corePrivate,
    ];
}

async function generic() {
    if (!navigator?.bluetooth?.getDevices) {
        return {
            filters: genericFilters(),
            optionalServices: genericOptionalServices(),
        };
    }

    const knownDevices = await navigator.bluetooth.getDevices();
    const exclusionFilters = knownDevices
        .filter((device) => device?.gatt?.connected)
        .map((device) => ({ name: device?.name ?? 'unknown' }));

    return {
        filters: genericFilters(),
        optionalServices: genericOptionalServices(),
        exclusionFilters: exclusionFilters.length > 0 ? exclusionFilters : undefined,
    };
}

const webBle = Object.freeze({
    isAvailable() {
        return typeof navigator !== 'undefined' && 'bluetooth' in navigator;
    },
    filters: Object.freeze({
        generic,
    }),
});

export {
    webBle,
    uuids,
};
