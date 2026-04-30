export function decodeHeartRateMeasurement(dataview) {
    const flags = dataview.getUint8(0, true);
    const heartRateValueFormat = ((flags >> 0) & 1) === 1;
    const energyExpenditureStatus = ((flags >> 3) & 1) === 1;
    const rrIntervalPresent = ((flags >> 4) & 1) === 1;

    let i = 1;
    let heartRate = null;
    let rrInterval = null;

    if (heartRateValueFormat) {
        heartRate = dataview.getUint16(i, true);
        i += 2;
    } else {
        heartRate = dataview.getUint8(i, true);
        i += 1;
    }

    if (energyExpenditureStatus) {
        i += 2;
    }

    if (rrIntervalPresent) {
        const values = [];
        while (i <= dataview.byteLength - 2) {
            values.push(dataview.getUint16(i, true) / 1024);
            i += 2;
        }
        rrInterval = values.length > 0 ? values[values.length - 1] : null;
    }

    return {
        heartRate,
        rrInterval,
    };
}

export function decodeCyclingPowerMeasurement(dataview, prev) {
    const flags = dataview.getUint16(0, true);
    const power = dataview.getInt16(2, true);
    const crankDataPresent = ((flags >> 5) & 1) === 1;

    let cadence = null;
    let nextPrev = prev;

    if (crankDataPresent && dataview.byteLength >= 10) {
        const cumulativeCrankRevolutions = dataview.getUint16(6, true);
        const lastCrankEventTime = dataview.getUint16(8, true);

        if (prev) {
            let deltaRevs = cumulativeCrankRevolutions - prev.cumulativeCrankRevolutions;
            let deltaTime = lastCrankEventTime - prev.lastCrankEventTime;

            if (deltaRevs < 0) {
                deltaRevs += 2 ** 16;
            }
            if (deltaTime < 0) {
                deltaTime += 2 ** 16;
            }

            if (deltaTime > 0) {
                const revPerSec = deltaRevs / (deltaTime / 1024);
                cadence = Math.round(revPerSec * 60);
            }
        }

        nextPrev = {
            cumulativeCrankRevolutions,
            lastCrankEventTime,
        };
    }

    return {
        power,
        cadence,
        nextPrev,
    };
}
