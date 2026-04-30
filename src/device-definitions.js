export const DEVICE_INFORMATION_SERVICE_UUID = '0000180a-0000-1000-8000-00805f9b34fb';

export const deviceDefinitions = [
    { id: 'controllable', title: 'Смарт-тренажер', serviceKeys: ['fitnessMachine', 'fec', 'wahooFitnessMachine'] },
    { id: 'powerMeter', title: 'Измеритель мощности', serviceKeys: ['cyclingPower'] },
    { id: 'speedCadenceSensor', title: 'Датчик скорости/каденса', serviceKeys: ['speedCadence'] },
    { id: 'heartRateMonitor', title: 'Пульсометр', serviceKeys: ['heartRate'] },
    { id: 'smo2', title: 'SmO2 / Moxy', serviceKeys: ['smo2'] },
    { id: 'coreTemp', title: 'CORE Temperature', serviceKeys: ['coreTemp', 'corePrivate'] },
];
