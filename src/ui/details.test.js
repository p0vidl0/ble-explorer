import { beforeEach, describe, expect, it } from 'vitest';
import {
    buildLiveValuesRows,
    buildStaticDetailsRows,
    getTypeSpecificDetails,
    supportsHeartDetails,
} from './details.js';
import { setLocale } from '../i18n.js';

beforeEach(() => {
    setLocale('ru');
});

describe('getTypeSpecificDetails', () => {
    it('returns known profile details for power meter', () => {
        const rows = getTypeSpecificDetails('powerMeter');
        expect(rows).toEqual([
            { key: 'Профиль', value: 'Cycling Power' },
            { key: 'Метрики', value: 'Мощность, каденс (если поддерживается)' },
        ]);
    });

    it('returns fallback for unknown type', () => {
        const rows = getTypeSpecificDetails('unknown');
        expect(rows).toEqual([{ key: 'Профиль', value: 'Тип устройства определен частично' }]);
    });
});

describe('supportsHeartDetails', () => {
    it('returns true for HR monitor type', () => {
        expect(supportsHeartDetails({ typeId: 'heartRateMonitor', heartRate: '--', rrInterval: '--' })).toBe(true);
    });

    it('returns true if heart metrics are present', () => {
        expect(supportsHeartDetails({ typeId: 'powerMeter', heartRate: '140', rrInterval: '--' })).toBe(true);
    });

    it('returns false when no heart context exists', () => {
        expect(supportsHeartDetails({ typeId: 'powerMeter', heartRate: '--', rrInterval: '--' })).toBe(false);
    });
});

describe('buildStaticDetailsRows', () => {
    it('combines generic and type-specific rows', () => {
        const entry = {
            typeId: 'coreTemp',
            typeTitle: 'CORE Temperature',
            battery: '90%',
            manufacturer: 'CORE',
            model: 'Model X',
            firmware: '1.0.0',
        };

        const rows = buildStaticDetailsRows(entry);
        expect(rows.slice(0, 5)).toEqual([
            { key: 'Тип', value: 'CORE Temperature' },
            { key: 'Батарея', value: '90%' },
            { key: 'Производитель', value: 'CORE' },
            { key: 'Модель', value: 'Model X' },
            { key: 'Прошивка', value: '1.0.0' },
        ]);
        expect(rows.at(-1)).toEqual({ key: 'Метрики', value: 'Температура ядра и дополнительные метрики' });
    });
});

describe('buildLiveValuesRows', () => {
    it('shows fallback row when no live metrics', () => {
        const rows = buildLiveValuesRows({
            typeId: 'coreTemp',
            power: '--',
            cadence: '--',
            heartRate: '--',
            rrInterval: '--',
        });
        expect(rows).toEqual([{ key: 'Данные', value: 'Нет live-метрик для этого типа устройства' }]);
    });

    it('includes power metrics for power meter', () => {
        const rows = buildLiveValuesRows({
            typeId: 'powerMeter',
            power: '280 W',
            cadence: '92 rpm',
            heartRate: '--',
            rrInterval: '--',
        });

        expect(rows).toContainEqual({ key: 'Мощность', value: '280 W' });
        expect(rows).toContainEqual({ key: 'Каденс', value: '92 rpm' });
    });

    it('includes heart rows when metrics available', () => {
        const rows = buildLiveValuesRows({
            typeId: 'smo2',
            power: '--',
            cadence: '--',
            heartRate: '150',
            rrInterval: '800 ms',
        });

        expect(rows).toContainEqual({ key: 'Пульс (HR)', value: '150' });
        expect(rows).toContainEqual({ key: 'RR', value: '800 ms' });
    });

    it('returns localized labels after switching locale', () => {
        setLocale('en');
        const rows = buildLiveValuesRows({
            typeId: 'coreTemp',
            power: '--',
            cadence: '--',
            heartRate: '--',
            rrInterval: '--',
        });

        expect(rows).toEqual([{ key: 'Data', value: 'No live metrics for this device type' }]);
    });
});
