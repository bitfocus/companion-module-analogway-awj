# companion-module-analogway-awj

Companion module for Analog Way products supporting the AWJ protocol (although this module actually is not using the AWJ protocol).

This module uses many features Companion provides:

- actions
- feedbacks
- presets
- variables
- dynamic options
- variables in options
- Learn function
- Action Recorder

For a complete explanation see [HELP](HELP.md)

## :rocket: Version history:

### 2.4.0 (2024 upcoming)
* Feature: add input freeze action, feedback and presets for Midra 4K and Alta 4K devices
* Feature: add layer freeze action, feedback, variables and presets for Midra 4K and Alta 4K devices
* Feature: add screen freeze action, feedback, variables and presets for Midra 4K and Alta 4K devices
* Bugfix: Fix input freeze presets only generated for inputs with a name

### 2.3.0 (2023-06-28)
* Feature: generate screen and aux memory recall presets additionally for each individual screen
* Feature: presets are now generating contrasting foreground color automatically according to background color 
* Bugfix: preset for selecting screen memories had no screen option selected 
* Bugfix: some feedbacks was generating errors when not connected to a device or to the wrong platform
* Brush: improved typing for feedbacks

### 2.2.1 (2023-05-16)
* Bugfix: corrected routing of Dante audio channels at Midra and Alta platforms
* Bugfix: corrected block routing of audio channels where sometimes not all channels of the block had been processed
* Brush: improved stability of the global update command
* Brush: updated dependency yaml from 2.2.1 to 2.2.2

### 2.2.0 (2023-04-13)
* Feature: Added configuration option to also show disabled inputs for programming
* Bugfix: corrected typo in presets

### 2.1.0 (2023-03-24)
* Feature: Added action Send custom AWJ get command

### 2.0.1 (2023-03-20)
* Bugfix: Send custom AWJ replace command was only working when value type was text

### 2.0.0 (2023-03-13)
* Major: Rewrite for Companion 3.0 compatibility
* Feature: new action for setting T-Bar position (works also with X-Keys T-Bar)
* Feature: new feedback for customizable AWJ path, will also provide variable
* Feature: timer value can be set by variables
* Feature: custom replace command can use variables for path, text entry and object entry
* Feature: Action Recorder is now available with this module
* Feature: added feedback and preset for Preset Toggle functionality  
* Feature: added variable for connection name
* Bugfix: Preset for Layer Source should use "don't change" for layer types where the input is not assignable			
* Bugfix: Websocket connection to device was not closed gracefully when disabling or deleting the connection			
* Bugfix: Preset Toggle functionality was set inverted at LivePremier
* Bugfix: Variable for selected preset was not updated when there was no feedback assigned to a button  

### 1.1.2 (2022-12-09)
* Bugfix: better generation of variable definitions at companion startup
* Bugfix: no more invalid calls to checkFeedbacks

### 1.1.1 (2022-12-09)
* Bugfix: No global update was sent for LivePremier			
* Bugfix: Action Select Layer Source was using wrong source type for layers in aux screens at LivePremier				
* Bugfix: Audio Routing wouldn't work at LivePremier			
* Bugfix: some actions and feedbacks wouldn't work when using two or more connections for different platforms at the same time
* Brush: improved default colors for streamdeck buttons  

### 1.1.0 (2022-12-02)
* Feature: Provide variables for source tallies  

### 1.0.4 (2022-11-23)
* Brush: Change dependency of tslib from 2.4.0 to ^2.4.1  

### 1.0.3 (2022-11-23)
* Bugfix: wake on lan for LivePremier was not working

### 1.0.2 (2022-11-22)
* Bugfix: Fix more TypeScript errors  

### 1.0.1 (2022-11-21)
* Bugfix: TypeScript type errors don't block the build system  

### 1.0.0 (2022-11-21)
* initial release  

