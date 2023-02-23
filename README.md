# companion-module-analogway-awj

Companion module for Analog Way products supporting the AWJ protocol (although this module actually is not using the AWJ protocol).

This module uses many features Companion provides:

- actions
- feedbacks
- presets
- variables
- dynamic options
- Learn function

For a complete explanation see [HELP](HELP.md)

# Version history:

## 1.0.0
* initial release  
## 1.0.1 
* Bugfix: TypeScript type errors don't block the build system  
## 1.0.2 
* Bugfix: Fix more TypeScript errors  
## 1.0.3 
* Bugfix: wake on lan for LivePremier was not working
## 1.0.4 
* Brush: Change dependency of tslib from 2.4.0 to ^2.4.1  
## 1.1.0 
* Feature: Provide variables for source tallies  
## 1.1.1 
* Bugfix: No global update was sent for LivePremier			
* Bugfix: Action Select Layer Source was using wrong source type for layers in aux screens at LivePremier				
* Bugfix: Audio Routing wouldn't work at LivePremier			
* Bugfix: some actions and feedbacks wouldn't work when using two or more connections for different platforms at the same time
* Brush: improved default colors for streamdeck buttons  
## 1.1.2 
* Bugfix: better generation of variable definitions at companion startup
* Bugfix: no more invalid calls to checkFeedbacks
## 2.0.0
* Major: Rewrite for Companion 3.0 compatibility
* Feature: added feedback and preset for Preset Toggle functionality  
* Feature: added variable for connection name
* Bugfix: Preset for Layer Source should use "don't change" for layer types where the input is not assignable			
* Bugfix: Websocket connection to device was not closed gracefully when disabling or deleting the connection			
* Bugfix: Preset Toggle functionality was set inverted at LivePremier
* Bugfix: Variable for selected preset was not updated when there was no feedback assigned to a button  
  

