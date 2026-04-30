const DEFAULT_LOCALE = 'ru';
const SUPPORTED_LOCALES = ['ru', 'en'];
const STORAGE_KEY = 'devices.locale';

const dictionaries = {
    ru: {
        'app.title': 'BLE Devices',
        'heading.connectedDevices': 'Подключенные BLE устройства',
        'status.ready': 'Готово к подключению устройств',
        'status.disconnectedDevice': 'Устройство отключено: {deviceName}',
        'status.webBluetoothUnavailable': 'Web Bluetooth недоступен в этом браузере',
        'status.webBluetoothUnavailable.insecureContext': 'Web Bluetooth недоступен: откройте страницу по HTTPS (или localhost)',
        'status.webBluetoothUnavailable.apiMissing': 'Web Bluetooth недоступен: браузер не предоставляет Bluetooth API',
        'status.webBluetoothUnavailable.noNavigator': 'Web Bluetooth недоступен: среда браузера не обнаружена',
        'status.scanningSupported': 'Поиск устройства среди поддерживаемых типов...',
        'status.unknownDeviceType': 'Тип устройства не удалось определить',
        'status.connectedDevice': 'Подключено: {deviceType} ({deviceName})',
        'status.connectError': 'Ошибка подключения устройства',
        'status.disconnectedByUser': 'Отключено: {deviceName}',
        'diagnostics.title': 'Диагностика',
        'diagnostics.secureContext': 'Secure context',
        'diagnostics.bluetoothApi': 'Bluetooth API',
        'diagnostics.availability': 'Web BLE',
        'diagnostics.userAgent': 'User agent',
        'diagnostics.yes': 'да',
        'diagnostics.no': 'нет',
        'diagnostics.copied': 'Информация скопирована',
        'device.unknownName': 'Неизвестное устройство',
        'actions.connectAny': 'Найти поддерживаемое устройство',
        'actions.details': 'Детали',
        'actions.disconnect': 'Отключить',
        'actions.copyDiagnostics': 'Скопировать',
        'actions.close': 'Закрыть',
        'list.empty': 'Подключенных устройств пока нет',
        'meta.battery': 'Батарея',
        'details.dialogTitle': 'Детали: {deviceName}',
        'details.dialogTitleDefault': 'Детали устройства',
        'details.table.details': 'Детали',
        'details.table.metric': 'Параметр',
        'details.table.value': 'Значение',
        'details.profile': 'Профиль',
        'details.metrics': 'Метрики',
        'details.deviceType': 'Тип',
        'details.manufacturer': 'Производитель',
        'details.model': 'Модель',
        'details.firmware': 'Прошивка',
        'details.power': 'Мощность',
        'details.cadence': 'Каденс',
        'details.heartRate': 'Пульс (HR)',
        'details.rr': 'RR',
        'details.data': 'Данные',
        'details.noLiveMetrics': 'Нет live-метрик для этого типа устройства',
        'details.partialType': 'Тип устройства определен частично',
        'details.profile.controllable': 'FTMS / FE-C / Wahoo FM',
        'details.control': 'Управление',
        'details.control.controllable': 'ERG, Resistance, Simulation',
        'details.profile.powerMeter': 'Cycling Power',
        'details.metrics.powerMeter': 'Мощность, каденс (если поддерживается)',
        'details.profile.speedCadenceSensor': 'Cycling Speed and Cadence',
        'details.metrics.speedCadenceSensor': 'Скорость и/или каденс',
        'details.profile.heartRateMonitor': 'Heart Rate',
        'details.metrics.heartRateMonitor': 'ЧСС, RR-интервалы (если поддерживается)',
        'details.profile.smo2': 'SmO2 (Moxy)',
        'details.metrics.smo2': 'SmO2 и сопутствующие параметры оксигенации',
        'details.profile.coreTemp': 'CORE Temp / CORE Private',
        'details.metrics.coreTemp': 'Температура ядра и дополнительные метрики',
        'locale.label': 'Язык',
        'locale.option.ru': 'Русский',
        'locale.option.en': 'English',
        'theme.label': 'Тема',
        'theme.option.auto': 'Авто',
        'theme.option.dark': 'Темная',
        'theme.option.light': 'Светлая',
    },
    en: {
        'app.title': 'BLE Devices',
        'heading.connectedDevices': 'Connected BLE devices',
        'status.ready': 'Ready to connect devices',
        'status.disconnectedDevice': 'Device disconnected: {deviceName}',
        'status.webBluetoothUnavailable': 'Web Bluetooth is unavailable in this browser',
        'status.webBluetoothUnavailable.insecureContext': 'Web Bluetooth is unavailable: open this page over HTTPS (or localhost)',
        'status.webBluetoothUnavailable.apiMissing': 'Web Bluetooth is unavailable: browser Bluetooth API is missing',
        'status.webBluetoothUnavailable.noNavigator': 'Web Bluetooth is unavailable: browser environment not detected',
        'status.scanningSupported': 'Scanning supported device types...',
        'status.unknownDeviceType': 'Unable to determine device type',
        'status.connectedDevice': 'Connected: {deviceType} ({deviceName})',
        'status.connectError': 'Device connection error',
        'status.disconnectedByUser': 'Disconnected: {deviceName}',
        'diagnostics.title': 'Diagnostics',
        'diagnostics.secureContext': 'Secure context',
        'diagnostics.bluetoothApi': 'Bluetooth API',
        'diagnostics.availability': 'Web BLE',
        'diagnostics.userAgent': 'User agent',
        'diagnostics.yes': 'yes',
        'diagnostics.no': 'no',
        'diagnostics.copied': 'Diagnostics copied',
        'device.unknownName': 'Unknown device',
        'actions.connectAny': 'Find supported device',
        'actions.details': 'Details',
        'actions.disconnect': 'Disconnect',
        'actions.copyDiagnostics': 'Copy',
        'actions.close': 'Close',
        'list.empty': 'No connected devices yet',
        'meta.battery': 'Battery',
        'details.dialogTitle': 'Details: {deviceName}',
        'details.dialogTitleDefault': 'Device details',
        'details.table.details': 'Details',
        'details.table.metric': 'Metric',
        'details.table.value': 'Value',
        'details.profile': 'Profile',
        'details.metrics': 'Metrics',
        'details.deviceType': 'Type',
        'details.manufacturer': 'Manufacturer',
        'details.model': 'Model',
        'details.firmware': 'Firmware',
        'details.power': 'Power',
        'details.cadence': 'Cadence',
        'details.heartRate': 'Heart rate (HR)',
        'details.rr': 'RR',
        'details.data': 'Data',
        'details.noLiveMetrics': 'No live metrics for this device type',
        'details.partialType': 'Device type identified partially',
        'details.profile.controllable': 'FTMS / FE-C / Wahoo FM',
        'details.control': 'Control',
        'details.control.controllable': 'ERG, Resistance, Simulation',
        'details.profile.powerMeter': 'Cycling Power',
        'details.metrics.powerMeter': 'Power, cadence (if supported)',
        'details.profile.speedCadenceSensor': 'Cycling Speed and Cadence',
        'details.metrics.speedCadenceSensor': 'Speed and/or cadence',
        'details.profile.heartRateMonitor': 'Heart Rate',
        'details.metrics.heartRateMonitor': 'HR, RR intervals (if supported)',
        'details.profile.smo2': 'SmO2 (Moxy)',
        'details.metrics.smo2': 'SmO2 and oxygenation-related metrics',
        'details.profile.coreTemp': 'CORE Temp / CORE Private',
        'details.metrics.coreTemp': 'Core temperature and extra metrics',
        'locale.label': 'Language',
        'locale.option.ru': 'Русский',
        'locale.option.en': 'English',
        'theme.label': 'Theme',
        'theme.option.auto': 'Auto',
        'theme.option.dark': 'Dark',
        'theme.option.light': 'Light',
    },
};

let currentLocale = resolveInitialLocale();

function resolveInitialLocale() {
    if (typeof localStorage !== 'undefined') {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (SUPPORTED_LOCALES.includes(saved)) {
                return saved;
            }
        } catch {}
    }

    if (typeof navigator !== 'undefined') {
        const browserLocale = navigator.language?.slice(0, 2)?.toLowerCase();
        if (SUPPORTED_LOCALES.includes(browserLocale)) {
            return browserLocale;
        }
    }
    return DEFAULT_LOCALE;
}

export function getLocale() {
    return currentLocale;
}

export function getSupportedLocales() {
    return [...SUPPORTED_LOCALES];
}

export function setLocale(locale) {
    const normalized = SUPPORTED_LOCALES.includes(locale) ? locale : DEFAULT_LOCALE;
    currentLocale = normalized;
    if (typeof localStorage !== 'undefined') {
        try {
            localStorage.setItem(STORAGE_KEY, normalized);
        } catch {}
    }
}

export function t(key, params = {}) {
    const template = dictionaries[currentLocale]?.[key] ?? dictionaries[DEFAULT_LOCALE]?.[key] ?? key;
    return template.replace(/\{(\w+)\}/g, (_, token) => String(params[token] ?? `{${token}}`));
}
