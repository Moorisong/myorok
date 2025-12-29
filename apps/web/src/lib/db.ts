import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), '.data');
const PIN_FILE = path.join(DATA_DIR, 'pin-settings.json');

export interface PinSettings {
    [deviceId: string]: {
        pinHash: string;
        failedAttempts: number;
        lockedUntil: string | null;
        createdAt: string;
        updatedAt: string;
    };
}

function ensureDataDir() {
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }
}

export function getPinSettings(): PinSettings {
    ensureDataDir();
    if (!fs.existsSync(PIN_FILE)) {
        return {};
    }
    try {
        const data = fs.readFileSync(PIN_FILE, 'utf-8');
        return JSON.parse(data);
    } catch {
        return {};
    }
}

export function savePinSettings(settings: PinSettings): void {
    ensureDataDir();
    fs.writeFileSync(PIN_FILE, JSON.stringify(settings, null, 2));
}

export function getDevicePinSettings(deviceId: string) {
    const settings = getPinSettings();
    return settings[deviceId] || null;
}

export function setDevicePinSettings(
    deviceId: string,
    data: Partial<PinSettings[string]>
): void {
    const settings = getPinSettings();
    const now = new Date().toISOString();

    if (settings[deviceId]) {
        settings[deviceId] = {
            ...settings[deviceId],
            ...data,
            updatedAt: now,
        };
    } else {
        settings[deviceId] = {
            pinHash: data.pinHash || '',
            failedAttempts: data.failedAttempts || 0,
            lockedUntil: data.lockedUntil || null,
            createdAt: now,
            updatedAt: now,
        };
    }

    savePinSettings(settings);
}

export function deleteDevicePinSettings(deviceId: string): boolean {
    const settings = getPinSettings();
    if (settings[deviceId]) {
        delete settings[deviceId];
        savePinSettings(settings);
        return true;
    }
    return false;
}
