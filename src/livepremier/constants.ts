import Constants from "../awjdevice/constants.js"

/**
 * This class holds all the device specific constants.
 * Mainly these are paths where a feature is located in the AWJ device model.
 */
export default class ConstantsLivepremier extends Constants {
    constructor() {
        super()
    }

    static readonly maxScreens = 24
    static readonly maxAuxScreens = 96
    static readonly maxInputs = 32
    static override readonly maxLayers = 48 as const
    static override readonly maxStills = 47 as const

    static readonly presetTogglePath = ['device','screenGroupList','items','S1','control','pp','copyMode']
    static readonly presetToggleValueValid = false

    static readonly macAddressPath = 'DEVICE/device/system/network/adapter/pp/macAddress'

    static readonly xUpdatePath = '"device","screenGroupList","control","pp","xUpdate"' // livepremier

    static readonly screenGroupPath = ['device', 'screenGroupList']
    static readonly auxGroupPath = ['device', 'screenGroupList']

    static readonly screenPath = ['device', 'screenList']
    static readonly auxPath = ['device', 'screenList']

    static readonly subSyncselectionPat = 'system/network/websocketServer/clients'

    static readonly multiviewerWidgetSelectionPath = 'REMOTE/live/multiviewers/widgetSelection/widgetIds'
    
    
}