# AnalogSense.js

JavaScript API for analog keyboard input.

## Supported Devices

- Everything by Wooting
- Razer Huntsman V2 Analog*
- Razer Huntsman Mini Analog*
- Razer Huntsman V3 Pro*
- Razer Huntsman V3 Pro Mini*
- Razer Huntsman V3 Pro Tenkeyless*
- DrunkDeer A75
- DrunkDeer A75 Pro†
- DrunkDeer G75†
- DrunkDeer G65†
- DrunkDeer G60†

\* Razer Synapse needs to be installed and running for analogue inputs to be received from this keyboard.

† I don't own this keyboard, so I've not had a chance to test it, but it should work.

## Usage

You can download and vendor the AnalogSense.js yourself, but you can also just load it straight from this repo:
```html
<script src="https://analogsense.org/JavaScript-SDK/AnalogSense.js"></script>
```

Once loaded, the following global functions become available:
- `analogsense.getDevices(): Promise<Device[]>`
- `analogsense.requestDevice(): Promise<Device | undefined>`

A device instance has the following members:
- `startListening(handler: function<void({scancode: int, value: float}[])>)`
- `stopListening()`
- `getProductName(): string`
- `forget()`
- `dev: HIDDevice`

### Scancodes

The scancodes provided by this library are primarily HID scancodes; most keys are mapped as seen on usage page 0x07 (A = 0x04, B = 0x05, ...).

Control keys (usage page 0x0C) are mapped in the `0x3__` range, modulo 0x100:
- `0x3B5` = Next Track
- `0x3B6` = Previous Track 
- `0x3B7` = Stop Media
- `0x3CD` = Play/Pause
- `0x394` = Open File Explorer
- `0x323` = Open Browser Home Page

OEM-specific keys are mapped in the `0x4__` range:
- `0x401` = Brightness Up
- `0x402` = Brightness Down
- `0x403` = Profile 1
- `0x404` = Profile 2
- `0x405` = Profile 3
- `0x408` = Profile Switch
- `0x409` = Function Key (Fn)
