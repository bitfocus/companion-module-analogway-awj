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

For a complete explanation see [HELP](companion/HELP.md)

## :warning: Attention

Starting with release 2.4.0 this module supports also software version 4.x of the LivePremier series. Analog Way did change many internal paths with v4.0. If you are upgrading this module from an earlier version and have programmed AWJ get or AWJ replace actions or custom feedbacks, make sure that the paths you are using are not affected from that change or change them accordingly. Otherwise these actions and feedbacks may stop working or give wrong results.  

## :rocket: Version history:

### 2.4.2 (2024-09-30)
* Bugfix: Set GPO action was missing on LivePremier and LivePremier v4. 
* Bugfix: GPO state feedback was not tracking updates on LivePremier v4

### 2.4.1 (2024-09-14)
* Bugfix: Timer colors could not be set to 0% opacity at LivePremier v4.
* Bugfix: Horizontal Greyscale Testpattern was not working for outputs of LivePremier v4.
* Bugfix: Could not establish connection to some Midra devices.
* Chore: bump webpack from 5.90.3 to 5.94.0

### 2.4.0 (2024-07-28)
* Feature: add compatibility with LivePremier software version 4.x
    Although this feature itself is not a breaking change, unfortunately many AWJ paths have been changed by Analog Way with LivePremier v4 and if you upgrade to firmware v4 from an earlier version and use such a path, you will have to adjust your actions or feedbacks. 
    Affected:
    - Send custom AWJ replace command
    - Send custom AWJ get command
    - Custom Feedback
* Feature: add input freeze action, feedback and presets for Midra 4K and Alta 4K devices
* Feature: add layer freeze action, feedback, variables and presets for Midra 4K and Alta 4K devices
* Feature: add screen freeze action, feedback, variables and presets for Midra 4K and Alta 4K devices
* Feature: supercharge the layer position and size action, it can now:
    - use variables
    - use an expression syntax
    - work absolute and incremental
    - adjust to a given anchor point
    - handle aspect ratios
    - grab parameters with learn button 
* Feature: add presets for new position and size action 
* Feature: add support for colors with alpha at Setup Timer action for LivePremier
* Feature: show more detailed status during connection and synchronization with download progress
* Feature: add "any screen" to the screen options of the layer selection feedback
* Feature: add CremaTTe 3D and Cut and Fill to the input key options for LivePremier v4
* Feature: add the product names Aquilon, Zenith and Pulse to the keywords so the connection can be found better from search
* Bugfix: input freeze presets were only generated for inputs with a name
* Bugfix: add default value for feedback showing preset selection
* Bugfix: add default value for feedback showing screen selection
* Bugfix: update options when still is renamed on Midra or Alta
* Bugfix: change several numbers to reflect correct values during initialisation, like number of inputs, number of multiviewer memories...
* Bugfix: time input field for timers now correctly parses a time where you enter seconds with a leading zero like e.g. :06 instead of :6
* Chore: update isVisible functions to newly available syntax avoiding additional code evaluation
* Chore: refactor from commonjs to ESM
* Chore: replace dependency superagent by ky
* Chore: bump @companion-module/base from 1.2.1 to 1.7.0
* Chore: bump @companion-module/tools from 1.2.0 to 1.5.0
* Chore: bump semver from 6.3.0 to 6.3.1
* Chore: bump word-wrap from 1.2.3 to 1.2.4
* Chore: bump eslint from 8.36.0 to 8.57.0
* Chore: bump @tsconfig/node18 from 1.0.1 to 1.0.3
* Chore: bump ws from 8.13.0 to 8.17.1
* Chore: bump braces from 3.0.2 to 3.0.3
* Chore: bump tar from 6.2.0 to 6.2.1

### 2.3.0 (2023-06-28)
* Feature: generate screen and aux memory recall presets additionally for each individual screen
* Feature: presets are now generating contrasting foreground color automatically according to background color 
* Bugfix: preset for selecting screen memories had no screen option selected 
* Bugfix: some feedbacks were generating errors when not connected to a device or to the wrong platform
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

