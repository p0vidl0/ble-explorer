export function applyHeartRateUpdate(current, decoded) {
    return {
        ...current,
        heartRate: decoded.heartRate ?? '--',
        rrInterval: decoded.rrInterval != null ? `${(decoded.rrInterval * 1000).toFixed(0)} ms` : '--',
    };
}

export function applyPowerMeterUpdate(current, decoded) {
    return {
        ...current,
        power: Number.isFinite(decoded.power) ? `${Math.round(decoded.power)} W` : '--',
        cadence: Number.isFinite(decoded.cadence) ? `${decoded.cadence} rpm` : current.cadence,
        _prevCrank: decoded.nextPrev,
    };
}
