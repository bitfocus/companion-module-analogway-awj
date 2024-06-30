/**
 * This class holds all the device specific constants.
 * Mainly these are paths where a feature is located in the AWJ device model.
 */
export default class Constants {
    constructor() {}

    static readonly maxScreens = 24
    static readonly maxAuxScreens = 96
    static readonly maxInputs = 256
    
    static readonly presetTogglePath = ['DEVICE','device','screenGroupList','items','S1','control','pp','copyMode']
    static readonly presetToggleValueValid = false

    static readonly macAddressPath = 'DEVICE/device/system/network/adapter/pp/macAddress'

    static readonly xUpdatePath = '"device","screenGroupList","control","pp","xUpdate"' // livepremier + livepremier4
    // static readonly xUpdatePath = '""device","preset","control","pp","xUpdate"' // midra

    static readonly subSyncselectionPat = 'system/network/websocketServer/clients'
    
    
}