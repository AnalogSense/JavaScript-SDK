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

window.analogsense = {
    providers: [
        AsProviderWooting
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
};
