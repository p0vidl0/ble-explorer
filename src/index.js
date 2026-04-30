import { webBle, uuids } from './lib/web-ble.js';
import { decodeCyclingPowerMeasurement, decodeHeartRateMeasurement } from './ble/decoders.js';
import { detectDeviceType, readOptionalInfo } from './ble/device-info.js';
import { applyHeartRateUpdate, applyPowerMeterUpdate } from './ble/device-updates.js';
import { buildLiveValuesRows, buildStaticDetailsRows } from './ui/details.js';
import { getLocale, getSupportedLocales, setLocale, t } from './i18n.js';

const connectedDevices = new Map();

const $pageStatus = document.querySelector('#page-status');
const $connectAnyBtn = document.querySelector('#connect-any-btn');
const $devicesList = document.querySelector('#devices-list');
const $emptyRow = document.querySelector('#devices-empty-row');
const $detailsDialog = document.querySelector('#device-details-dialog');
const $detailsTitle = document.querySelector('#details-title');
const $detailsKeysTbody = document.querySelector('#details-keys-tbody');
const $detailsValuesTbody = document.querySelector('#details-values-tbody');
const $detailsCloseBtn = document.querySelector('#details-close-btn');
const $localeMenuTrigger = document.querySelector('#locale-menu-trigger');
const $localeMenu = document.querySelector('#locale-menu');
const $themeMenuTrigger = document.querySelector('#theme-menu-trigger');
const $themeMenu = document.querySelector('#theme-menu');
let activeDetailsDeviceId = null;
const THEME_STORAGE_KEY = 'devices.theme';
const SUPPORTED_THEMES = ['auto', 'dark', 'light'];
const systemThemeQuery = typeof window !== 'undefined' ? window.matchMedia?.('(prefers-color-scheme: light)') : null;
let currentThemeMode = 'auto';

function setPageStatus(text, cls = 'status-idle') {
    $pageStatus.textContent = text;
    $pageStatus.className = `devices-status ${cls}`;
}

function applyStaticTranslations() {
    document.querySelectorAll('[data-i18n]').forEach((element) => {
        const key = element.getAttribute('data-i18n');
        if (!key) return;
        element.textContent = t(key);
    });
}

function renderLocaleOptions() {
    if (!$localeMenu) return;
    $localeMenu.innerHTML = getSupportedLocales()
        .map((locale) => `<button class="popup-menu-item" role="menuitemradio" data-menu="locale" data-value="${locale}">${t(`locale.option.${locale}`)}</button>`)
        .join('');
}

function renderThemeOptions() {
    if (!$themeMenu) return;
    $themeMenu.innerHTML = SUPPORTED_THEMES
        .map((theme) => `<button class="popup-menu-item" role="menuitemradio" data-menu="theme" data-value="${theme}">${t(`theme.option.${theme}`)}</button>`)
        .join('');
}

function closeAllMenus() {
    $localeMenu?.classList.remove('open');
    $themeMenu?.classList.remove('open');
    $localeMenuTrigger?.setAttribute('aria-expanded', 'false');
    $themeMenuTrigger?.setAttribute('aria-expanded', 'false');
}

function syncMenuState() {
    if ($localeMenuTrigger) {
        const localeLabel = t(`locale.option.${getLocale()}`);
        $localeMenuTrigger.setAttribute('aria-label', `${t('locale.label')}: ${localeLabel}`);
        $localeMenuTrigger.setAttribute('title', localeLabel);
    }
    $localeMenu?.querySelectorAll('.popup-menu-item').forEach((item) => {
        item.setAttribute('aria-current', item.getAttribute('data-value') === getLocale() ? 'true' : 'false');
    });
    if ($themeMenuTrigger) {
        const themeLabel = t(`theme.option.${currentThemeMode}`);
        $themeMenuTrigger.setAttribute('aria-label', `${t('theme.label')}: ${themeLabel}`);
        $themeMenuTrigger.setAttribute('title', themeLabel);
    }
    $themeMenu?.querySelectorAll('.popup-menu-item').forEach((item) => {
        item.setAttribute('aria-current', item.getAttribute('data-value') === currentThemeMode ? 'true' : 'false');
    });
}

function resolveInitialTheme() {
    if (typeof localStorage !== 'undefined') {
        try {
            const saved = localStorage.getItem(THEME_STORAGE_KEY);
            if (SUPPORTED_THEMES.includes(saved)) {
                return saved;
            }
        } catch {}
    }
    return 'auto';
}

function getSystemTheme() {
    return systemThemeQuery?.matches ? 'light' : 'dark';
}

function applyTheme(mode) {
    const normalized = SUPPORTED_THEMES.includes(mode) ? mode : 'auto';
    currentThemeMode = normalized;
    const theme = normalized === 'auto' ? getSystemTheme() : normalized;
    document.documentElement.setAttribute('data-theme', theme);
    if (typeof localStorage !== 'undefined') {
        try {
            localStorage.setItem(THEME_STORAGE_KEY, normalized);
        } catch {}
    }
    syncMenuState();
}

function refreshUiTexts() {
    applyStaticTranslations();
    renderLocaleOptions();
    renderThemeOptions();
    syncMenuState();
    if ($detailsDialog?.open && activeDetailsDeviceId) {
        renderDetailsDialog(activeDetailsDeviceId);
    }
    renderConnectedDevicesTable();
}

function renderConnectedDevicesTable() {
    const entries = Array.from(connectedDevices.values());
    $devicesList.innerHTML = '';

    if (entries.length === 0) {
        $devicesList.appendChild($emptyRow);
        return;
    }

    entries.forEach((entry) => {
        const card = document.createElement('article');
        card.className = 'device-card';
        card.setAttribute('data-device-id', entry.deviceId);
        card.innerHTML = `
            <h3 class="device-card-name">${entry.name}</h3>
            <p class="device-card-type">${entry.typeTitle}</p>
            <div class="device-card-meta">
                <div class="device-card-meta-key">${t('meta.battery')}</div>
                <div>${entry.battery}</div>
            </div>
            <div class="row-actions">
                <button class="btn secondary" data-action="details" data-device-id="${entry.deviceId}">${t('actions.details')}</button>
                <button class="btn danger" data-action="disconnect" data-device-id="${entry.deviceId}">${t('actions.disconnect')}</button>
            </div>
        `;
        $devicesList.appendChild(card);
    });
}

async function subscribeHeartRateUpdates(entry, server) {
    try {
        const hrService = await server.getPrimaryService(uuids.heartRate);
        const hrCharacteristic = await hrService.getCharacteristic(uuids.heartRateMeasurement);
        await hrCharacteristic.startNotifications();

        hrCharacteristic.addEventListener('characteristicvaluechanged', (event) => {
            const value = event.target?.value;
            if (!value) return;

            const decoded = decodeHeartRateMeasurement(value);
            const current = connectedDevices.get(entry.deviceId);
            if (!current) return;

            connectedDevices.set(entry.deviceId, applyHeartRateUpdate(current, decoded));
            renderConnectedDevicesTable();
            if (activeDetailsDeviceId === entry.deviceId) {
                renderDetailsDialog(entry.deviceId);
            }
        });
    } catch (err) {
        console.warn('HR notifications are not available:', err);
    }
}

async function subscribePowerMeterUpdates(entry, server) {
    try {
        const cpsService = await server.getPrimaryService(uuids.cyclingPower);
        const cpsCharacteristic = await cpsService.getCharacteristic(uuids.cyclingPowerMeasurement);
        await cpsCharacteristic.startNotifications();

        cpsCharacteristic.addEventListener('characteristicvaluechanged', (event) => {
            const value = event.target?.value;
            if (!value) return;

            const current = connectedDevices.get(entry.deviceId);
            if (!current) return;

            const decoded = decodeCyclingPowerMeasurement(value, current._prevCrank);
            connectedDevices.set(entry.deviceId, applyPowerMeterUpdate(current, decoded));

            renderConnectedDevicesTable();
            if (activeDetailsDeviceId === entry.deviceId) {
                renderDetailsDialog(entry.deviceId);
            }
        });
    } catch (err) {
        console.warn('Power meter notifications are not available:', err);
    }
}

function removeConnectedDevice(deviceId) {
    if (activeDetailsDeviceId === deviceId) {
        activeDetailsDeviceId = null;
        $detailsDialog?.close();
    }
    connectedDevices.delete(deviceId);
    renderConnectedDevicesTable();
}

function attachDisconnectHandler(device, fallbackTitle) {
    device.addEventListener('gattserverdisconnected', () => {
        removeConnectedDevice(device.id);
        setPageStatus(t('status.disconnectedDevice', { deviceName: device.name ?? fallbackTitle }), 'status-error');
    });
}

async function connectAnySupportedDevice() {
    if (!webBle.isAvailable()) {
        setPageStatus(t('status.webBluetoothUnavailable'), 'status-error');
        return;
    }

    try {
        $connectAnyBtn.disabled = true;
        setPageStatus(t('status.scanningSupported'), 'status-connecting');

        const requestArgs = await webBle.filters.generic();
        const device = await navigator.bluetooth.requestDevice(requestArgs);
        const server = await device.gatt.connect();
        const definition = await detectDeviceType(server, uuids);

        if (!definition) {
            try {
                device.gatt.disconnect();
            } catch {}
            setPageStatus(t('status.unknownDeviceType'), 'status-error');
            return;
        }

        attachDisconnectHandler(device, definition.title);
        const info = await readOptionalInfo(server, uuids);

        connectedDevices.set(device.id, {
            deviceId: device.id,
            name: device.name ?? t('device.unknownName'),
            typeId: definition.id,
            typeTitle: definition.title,
            battery: info.battery,
            heartRate: '--',
            rrInterval: '--',
            power: '--',
            cadence: '--',
            manufacturer: info.manufacturer,
            model: info.model,
            firmware: info.firmware,
            _prevCrank: null,
            device,
        });
        if (definition.id === 'heartRateMonitor') {
            await subscribeHeartRateUpdates({ deviceId: device.id }, server);
        }
        if (definition.id === 'powerMeter') {
            await subscribePowerMeterUpdates({ deviceId: device.id }, server);
        }
        renderConnectedDevicesTable();
        setPageStatus(
            t('status.connectedDevice', { deviceType: definition.title, deviceName: device.name ?? t('device.unknownName') }),
            'status-ok',
        );
    } catch (err) {
        setPageStatus(t('status.connectError'), 'status-error');
        console.error('Generic device connect error:', err);
    } finally {
        $connectAnyBtn.disabled = false;
    }
}

function disconnectDeviceById(deviceId) {
    const entry = connectedDevices.get(deviceId);
    if (!entry) return;

    try {
        if (entry.device?.gatt?.connected) {
            entry.device.gatt.disconnect();
        }
    } catch (err) {
        console.error('Disconnect error:', err);
    }

    removeConnectedDevice(deviceId);
    setPageStatus(t('status.disconnectedByUser', { deviceName: entry.name }), 'status-idle');
}

function renderDetailsDialog(deviceId) {
    const entry = connectedDevices.get(deviceId);
    if (!entry || !$detailsDialog) return;

    $detailsTitle.textContent = t('details.dialogTitle', { deviceName: entry.name });
    const detailRows = buildStaticDetailsRows(entry);
    const valueRows = buildLiveValuesRows(entry);

    $detailsKeysTbody.innerHTML = detailRows
        .map((row) => `<tr><td class="details-key">${row.key}</td><td>${row.value}</td></tr>`)
        .join('');

    $detailsValuesTbody.innerHTML = valueRows
        .map((row) => `<tr><td class="details-key">${row.key}</td><td>${row.value}</td></tr>`)
        .join('');
}

function openDetailsDialog(deviceId) {
    activeDetailsDeviceId = deviceId;
    renderDetailsDialog(deviceId);
    $detailsDialog.showModal();
}

function init() {
    applyTheme(resolveInitialTheme());
    applyStaticTranslations();
    setPageStatus(t('status.ready'), 'status-idle');
    renderLocaleOptions();
    renderThemeOptions();
    syncMenuState();
    $localeMenuTrigger?.addEventListener('click', (event) => {
        event.stopPropagation();
        const nextState = !$localeMenu.classList.contains('open');
        closeAllMenus();
        if (nextState) {
            $localeMenu.classList.add('open');
            $localeMenuTrigger.setAttribute('aria-expanded', 'true');
        }
    });
    $themeMenuTrigger?.addEventListener('click', (event) => {
        event.stopPropagation();
        const nextState = !$themeMenu.classList.contains('open');
        closeAllMenus();
        if (nextState) {
            $themeMenu.classList.add('open');
            $themeMenuTrigger.setAttribute('aria-expanded', 'true');
        }
    });
    $localeMenu?.addEventListener('click', (event) => {
        const button = event.target.closest('.popup-menu-item');
        if (!button) return;
        const locale = button.getAttribute('data-value');
        if (!locale) return;
        if (locale !== getLocale()) {
            setLocale(locale);
            refreshUiTexts();
        }
        closeAllMenus();
    });
    $themeMenu?.addEventListener('click', (event) => {
        const button = event.target.closest('.popup-menu-item');
        if (!button) return;
        const theme = button.getAttribute('data-value');
        if (!theme) return;
        applyTheme(theme);
        closeAllMenus();
    });
    document.addEventListener('click', () => {
        closeAllMenus();
    });
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            closeAllMenus();
        }
    });
    systemThemeQuery?.addEventListener('change', () => {
        if (currentThemeMode === 'auto') {
            document.documentElement.setAttribute('data-theme', getSystemTheme());
        }
    });
    renderConnectedDevicesTable();
    $connectAnyBtn?.addEventListener('click', connectAnySupportedDevice);
    $devicesList?.addEventListener('click', (event) => {
        const button = event.target.closest('[data-action]');
        if (!button) return;
        const deviceId = button.getAttribute('data-device-id');
        if (!deviceId) return;

        const action = button.getAttribute('data-action');
        if (action === 'disconnect') {
            disconnectDeviceById(deviceId);
            return;
        }
        if (action === 'details') {
            openDetailsDialog(deviceId);
        }
    });
    $detailsCloseBtn?.addEventListener('click', () => {
        activeDetailsDeviceId = null;
        $detailsDialog?.close();
    });
    $detailsDialog?.addEventListener('close', () => {
        activeDetailsDeviceId = null;
    });
    $detailsDialog?.addEventListener('click', (event) => {
        const rect = $detailsDialog.getBoundingClientRect();
        const clickedInside = event.clientX >= rect.left
            && event.clientX <= rect.right
            && event.clientY >= rect.top
            && event.clientY <= rect.bottom;
        if (!clickedInside) {
            $detailsDialog.close();
        }
    });
}

init();
