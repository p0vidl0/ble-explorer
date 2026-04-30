import { t } from '../i18n.js';

export function getTypeSpecificDetails(typeId) {
    switch (typeId) {
    case 'controllable':
        return [
            { key: t('details.profile'), value: t('details.profile.controllable') },
            { key: t('details.control'), value: t('details.control.controllable') },
        ];
    case 'powerMeter':
        return [
            { key: t('details.profile'), value: t('details.profile.powerMeter') },
            { key: t('details.metrics'), value: t('details.metrics.powerMeter') },
        ];
    case 'speedCadenceSensor':
        return [
            { key: t('details.profile'), value: t('details.profile.speedCadenceSensor') },
            { key: t('details.metrics'), value: t('details.metrics.speedCadenceSensor') },
        ];
    case 'heartRateMonitor':
        return [
            { key: t('details.profile'), value: t('details.profile.heartRateMonitor') },
            { key: t('details.metrics'), value: t('details.metrics.heartRateMonitor') },
        ];
    case 'smo2':
        return [
            { key: t('details.profile'), value: t('details.profile.smo2') },
            { key: t('details.metrics'), value: t('details.metrics.smo2') },
        ];
    case 'coreTemp':
        return [
            { key: t('details.profile'), value: t('details.profile.coreTemp') },
            { key: t('details.metrics'), value: t('details.metrics.coreTemp') },
        ];
    default:
        return [{ key: t('details.profile'), value: t('details.partialType') }];
    }
}

export function supportsHeartDetails(entry) {
    return entry.typeId === 'heartRateMonitor' || entry.heartRate !== '--' || entry.rrInterval !== '--';
}

export function supportsSpeedCadenceDetails(entry) {
    return entry.typeId === 'speedCadenceSensor'
        || entry.speed !== '--'
        || (entry.typeId !== 'powerMeter' && entry.cadence !== '--');
}

export function buildStaticDetailsRows(entry) {
    return [
        { key: t('details.deviceType'), value: entry.typeTitle },
        { key: t('meta.battery'), value: entry.battery },
        { key: t('details.manufacturer'), value: entry.manufacturer },
        { key: t('details.model'), value: entry.model },
        { key: t('details.firmware'), value: entry.firmware },
        ...getTypeSpecificDetails(entry.typeId),
    ];
}

export function buildLiveValuesRows(entry) {
    const rows = [];

    if (entry.typeId === 'powerMeter' || entry.power !== '--') {
        rows.push(
            { key: t('details.power'), value: entry.power ?? '--' },
            { key: t('details.cadence'), value: entry.cadence ?? '--' },
        );
    }

    if (supportsSpeedCadenceDetails(entry)) {
        rows.push(
            { key: t('details.speed'), value: entry.speed ?? '--' },
            { key: t('details.cadence'), value: entry.cadence ?? '--' },
        );
    }

    if (supportsHeartDetails(entry)) {
        rows.push(
            { key: t('details.heartRate'), value: entry.heartRate ?? '--' },
            { key: t('details.rr'), value: entry.rrInterval ?? '--' },
        );
    }

    if (rows.length === 0) {
        rows.push({ key: t('details.data'), value: t('details.noLiveMetrics') });
    }

    return rows;
}
