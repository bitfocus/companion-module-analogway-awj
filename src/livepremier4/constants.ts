import Constants from "../awjdevice/constants.js"

/**
 * This class holds all the device specific constants.
 * Mainly these are paths where a feature is located in the AWJ device model.
 */
export default class ConstantsLivepremier4 extends Constants {
    constructor() {
        super()
    }

    static readonly maxScreens = 24
    static readonly maxAuxScreens = 96
    static readonly maxInputs = 256
    static override readonly maxLayers = 128 as const
    
    static readonly presetTogglePath = ['device','screenAuxGroupList','items','S1','control','pp','copyMode']
    static readonly presetToggleValueValid = false

    static readonly macAddressPath = 'DEVICE/device/system/network/adapter/pp/macAddress'

    static readonly xUpdatePath = '"device","screenAuxGroupList","control","pp","xUpdate"' // livepremier4

    static readonly screenGroupPath = ['device', 'screenAuxGroupList']
    static readonly auxGroupPath = ['device', 'screenAuxGroupList']

    static readonly screenPath = ['device', 'screenList']
    static readonly auxPath = ['device', 'auxiliaryList']

    static readonly subSyncselectionPat = 'system/network/websocketServer/clients'

    static readonly multiviewerWidgetSelectionPath = 'REMOTE/live/multiviewers/widgetSelection/widgetIds'
    
    
}