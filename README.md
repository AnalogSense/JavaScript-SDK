# AnalogSense.js

JavaScript API for analog keyboard input.

## Supported Devices

- Everything by Wooting
- Razer Huntsman V2 Analog
- Razer Huntsman Mini Analog
- Razer Huntsman V3 Pro
- Razer Huntsman V3 Pro Tenkeyless
- Razer Huntsman V3 Pro Mini

## Scancodes

The scancodes provided by this library are HID scancodes; OEM-specific keys are mapped beyond this single-byte range:
- `0x3B5` = Next Track
- `0x3B6` = Previous Track 
- `0x3B7` = Stop Media
- `0x3CD` = Play/Pause
- `0x403` = Profile 1
- `0x404` = Profile 2
- `0x405` = Profile 3
- `0x408` = Profile Switch
- `0x409` = Function Key (Fn)
