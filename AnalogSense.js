class AsProvider
{
    constructor(dev)
    {
        this.dev = dev;
    }

    getProductName()
    {
        return this.dev.productName;
    }

    forget()
    {
        this.dev.forget();
    }
}

class AsProviderWooting extends AsProvider
{
    static populateFilters(filters)
    {
        filters.push({ usagePage: 0xFF54, vendorId: 0x31E3 });
        filters.push({ usagePage: 0xFF54, vendorId: 0x03EB, productId: 0xFF01 }); // Wooting One with old firmware
        filters.push({ usagePage: 0xFF54, vendorId: 0x03EB, productId: 0xFF02 }); // Wooting Two with old firmware
    }

    startListening(handler)
    {
        this.dev.oninputreport = function(event)
        {
            const active_keys = [];
            for (let i = 0; i < event.data.byteLength; )
            {
                const scancode = (event.data.getUint8(i++) << 8) | event.data.getUint8(i++);
                if (scancode == 0)
                {
                    break;
                }
                const value = event.data.getUint8(i++);
                active_keys.push({ scancode, value: value / 255 });
            }
            handler(active_keys);
        };
    }

    stopListening()
    {
        this.dev.oninputreport = undefined;
    }
}

class AsProviderRazerHuntsmanV3 extends AsProvider
{
    static populateFilters(filters)
    {
        filters.push({ vendorId: 0x1532, productId: 0x02a6, reportId: 11 }); // Razer Huntsman V3 Pro
        filters.push({ vendorId: 0x1532, productId: 0x02a7, reportId: 11 }); // Razer Huntsman V3 Pro Tenkeyless
        filters.push({ vendorId: 0x1532, productId: 0x02b0, reportId: 11 }); // Razer Huntsman V3 Pro Mini
    }

    startListening(handler)
    {
        this.dev.oninputreport = function(event)
        {
            if (event.reportId == 11)
            {
                const active_keys = [];
                for (let i = 0; i < event.data.byteLength; )
                {
                    const scancode = event.data.getUint8(i++);
                    if (scancode == 0)
                    {
                        break;
                    }
                    const value = event.data.getUint8(i++);
                    i++; // unclear, might be something like "priority."
                    active_keys.push({
                        scancode: analogsense.razerScancodeToHidScancode(scancode),
                        value: value / 255
                    });
                }
                handler(active_keys);
            }
        };
    }

    stopListening()
    {
        this.dev.oninputreport = undefined;
    }
}

window.analogsense = {
    providers: [
        AsProviderWooting,
        AsProviderRazerHuntsmanV3,
    ],
    findProviderForDevice: function(dev)
    {
        for (const provider of analogsense.providers)
        {
            const filters = [];
            provider.populateFilters(filters);
            for (const filter of filters)
            {
                if ("vendorId" in filter && dev.vendorId != filter.vendorId)
                {
                    continue;
                }
                if ("productId" in filter && dev.productId != filter.productId)
                {
                    continue;
                }
                if ("usagePage" in filter)
                {
                    let found = false;
                    for (const collection of dev.collections)
                    {
                        if (collection.usagePage == filter.usagePage)
                        {
                            found = true;
                            break;
                        }
                    }
                    if (!found)
                    {
                        continue;
                    }
                }
                if ("reportId" in filter)
                {
                    let found = false;
                    loop1: for (const collection of dev.collections)
                    {
                        for (const inputReport of collection.inputReports)
                        {
                            if (inputReport.reportId == filter.reportId)
                            {
                                found = true;
                                break loop1;
                            }
                        }
                    }
                    if (!found)
                    {
                        continue;
                    }
                }
                return provider;
            }
        }
    },
    getDevices: async function()
    {
        const result = [];

        const devices = await navigator.hid.getDevices();
        for (const dev of devices)
        {
            const provider = analogsense.findProviderForDevice(dev);
            if (provider)
            {
                if (!dev.opened)
                {
                    await dev.open();
                }
                result.push(new provider(dev));
            }
        }

        return result;
    },
    requestDevice: async function()
    {
        const filters = [];
        for (const provider of analogsense.providers)
        {
            provider.populateFilters(filters);
        }
        const devices = await navigator.hid.requestDevice({ filters });
        for (const dev of devices)
        {
            const provider = analogsense.findProviderForDevice(dev);
            if (provider)
            {
                if (!dev.opened)
                {
                    await dev.open();
                }
                return new provider(dev);
            }
        }
        return null;
    },
    razerScancodeToHidScancode: function(scancode)
    {
        switch (scancode)
        {
        case 0x6E: return 0x29; // Escape
        case 0x70: return 0x3A; // F1
        case 0x71: return 0x3B; // F2
        case 0x72: return 0x3C; // F3
        case 0x73: return 0x3D; // F4
        case 0x74: return 0x3E; // F5
        case 0x75: return 0x3F; // F6
        case 0x76: return 0x40; // F7
        case 0x77: return 0x41; // F8
        case 0x78: return 0x42; // F9
        case 0x79: return 0x43; // F10
        case 0x7A: return 0x44; // F11
        case 0x7B: return 0x45; // F12

        case 0x01: return 0x35; // `
        case 0x02: return 0x1E; // 1
        case 0x03: return 0x1F; // 2
        case 0x04: return 0x20; // 3
        case 0x05: return 0x21; // 4
        case 0x06: return 0x22; // 5
        case 0x07: return 0x23; // 6
        case 0x08: return 0x24; // 7
        case 0x09: return 0x25; // 8
        case 0x0A: return 0x26; // 9
        case 0x0B: return 0x27; // 0
        case 0x0C: return 0x2D; // -
        case 0x0D: return 0x2E; // =
        case 0x0F: return 0x2A; // Backspace
        case 0x10: return 0x2B; // Tab
        case 0x11: return 0x14; // Q
        case 0x12: return 0x1A; // W
        case 0x13: return 0x08; // E
        case 0x14: return 0x15; // R
        case 0x15: return 0x17; // T
        case 0x16: return 0x1C; // Y
        case 0x17: return 0x18; // U
        case 0x18: return 0x0C; // I
        case 0x19: return 0x12; // O
        case 0x1A: return 0x13; // P
        case 0x1B: return 0x2F; // [
        case 0x1C: return 0x30; // ]
        case 0x2B: return 0x28; // Enter
        case 0x1E: return 0x39; // Caps Lock
        case 0x1F: return 0x04; // A
        case 0x20: return 0x16; // S
        case 0x21: return 0x07; // D
        case 0x22: return 0x09; // F
        case 0x23: return 0x0A; // G
        case 0x24: return 0x0B; // H
        case 0x25: return 0x0D; // J
        case 0x26: return 0x0E; // K
        case 0x27: return 0x0F; // L
        case 0x28: return 0x33; // ;
        case 0x29: return 0x34; // '
        case 0x2A: return 0x31; // Backslash
        case 0x2C: return 0xE1; // Left Shift
        case 0x2D: return 0x64; // Intl Backslash
        case 0x2E: return 0x1D; // Z
        case 0x2F: return 0x1B; // X
        case 0x30: return 0x06; // C
        case 0x31: return 0x19; // V
        case 0x32: return 0x05; // B
        case 0x33: return 0x11; // N
        case 0x34: return 0x10; // M
        case 0x35: return 0x36; // ,
        case 0x36: return 0x37; // .
        case 0x37: return 0x38; // /
        case 0x39: return 0xE5; // Right Shift
        case 0x3A: return 0xE0; // Left Ctrl
        case 0x7F: return 0xE3; // Left Meta
        case 0x3C: return 0xE2; // Left Alt
        case 0x3D: return 0x2C; // Space
        case 0x3E: return 0xE6; // Right Alt
        case 0x3B: return 0x409; // Fn (Custom mapping)
        case 0x81: return 0x65; // Context Menu
        case 0x40: return 0xE4; // Right Ctrl

        case 0x7C: return 0x46; // Print Screen
        case 0x7D: return 0x48; // Pause
        case 0x7E: return 0x47; // Scroll Lock

        case 0x4B: return 0x49; // Insert
        case 0x50: return 0x4A; // Home
        case 0x55: return 0x4B; // Page Up
        case 0x4C: return 0x4C; // Delete
        case 0x51: return 0x4D; // End
        case 0x56: return 0x4E; // Page Down

        case 0x53: return 0x52; // Up Arrow
        case 0x4F: return 0x50; // Left Arrow
        case 0x54: return 0x51; // Down Arrow
        case 0x59: return 0x4F; // Right Arrow

        case 0x5A: return 0x53; // Num Lock
        case 0x5F: return 0x54; // Numpad /
        case 0x64: return 0x55; // Numpad *
        case 0x69: return 0x56; // Numpad -
        case 0x5B: return 0x5F; // Numpad 7
        case 0x60: return 0x60; // Numpad 8
        case 0x65: return 0x61; // Numpad 9
        case 0x6A: return 0x57; // Numpad +
        case 0x5C: return 0x5C; // Numpad 4
        case 0x61: return 0x5D; // Numpad 5
        case 0x66: return 0x5E; // Numpad 6
        case 0x5D: return 0x59; // Numpad 1
        case 0x62: return 0x5A; // Numpad 2
        case 0x67: return 0x5B; // Numpad 3
        case 0x6C: return 0x58; // Numpad Enter
        case 0x63: return 0x62; // Numpad 0
        case 0x68: return 0x63; // Numpad .
        }
        console.warn("Failed to map Razer scancode to HID scancode:", scancode);
        return 0;
    },
};
