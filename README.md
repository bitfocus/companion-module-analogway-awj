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

* 1.0.0 initial release  
* 1.0.1 Bugfix: TypeScript type errors don't block the build system  
* 1.0.2 Bugfix: Fix more TypeScript errors  
* 1.0.3 Bugfix: wake on lan for LivePremier  
* 1.0.4 Brush: Change dependency of tslib from 2.4.0 to ^2.4.1  
* 1.1.0 Feature: Provide variables for source tallies  
* 1.1.1 Bugfix: No global update was sent for LivePremier; Action Select Layer Source was using wrong source type for layers in aux screens at LivePremier; Audio Routing wouldn't work at LivePremier, some actions and feedbacks wouldn't work when using two or more connections for different platforms at the same time; Brush: improved default colors for streamdeck buttons  
* 1.1.2 Bugfix: better generation of variable definitions at companion startup; no more invalid calls to checkFeedbacks 
