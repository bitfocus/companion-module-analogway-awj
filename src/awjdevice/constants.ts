/**
 * This class holds all the device specific constants.
 * Mainly these are paths where a feature is located in the AWJ device model.
 */
export default class Constants {
    constructor() {}

    static readonly maxScreens: number = 24
    static readonly maxAuxScreens: number = 96
    static readonly maxInputs: number = 256
    static readonly maxLayers: number = 128
    static readonly maxScreenMemories: number = 1000
    static readonly maxMasterMemories: number = 500
    static readonly maxMultiviewerMemories: number = 50
    static readonly maxStills: number = 192
    static readonly maxTimers: number = 4

    static readonly presetTogglePath = ['device','screenGroupList','items','S1','control','pp','copyMode']
    static readonly presetToggleValueValid: boolean = false

    static readonly lockPrefixScreen: string = 'S'
    static readonly lockPrefixAux: string = 'A'

    static readonly macAddressPath = 'DEVICE/device/system/network/adapter/pp/macAddress'

    static readonly xUpdatePath: string = '"device","screenGroupList","control","pp","xUpdate"' // livepremier + livepremier4
    // static readonly xUpdatePath = '""device","preset","control","pp","xUpdate"' // midra

    static readonly screenGroupPath = ['device', 'screenAuxGroupList']
    static readonly auxGroupPath = ['device', 'screenAuxGroupList']

    static readonly screenPath = ['device', 'screenList']
    static readonly auxPath = ['device', 'auxiliaryList']

    static readonly lastUsedMasterPresetPath = ['device', 'masterPresetBank', 'status', 'lastUsed']

    static readonly screenMemoryPath = ['device','presetBank','bankList']
    static readonly activeScreenMemoryIdPath = ['presetId','status','pp','id']
    static readonly activeScreenMemoryIsModifiedPath = ['presetId','status','pp','isNotModified']
    static readonly activeScreenMemoryValueValid: boolean = true

    static readonly screenSizePath = ['status', 'size', 'pp']
    static readonly propsSizePath = ['position', 'pp']
    static readonly propsPositionPath = ['position', 'pp']
    static readonly propsCroppingPath = ['cropping', 'classic', 'pp']
    static readonly propsMaskPath = ['cropping', 'mask', 'pp']

    static readonly screenLayerList = ['layerList', 'items']

    static readonly subSyncselectionPat = 'system/network/websocketServer/clients'

    static readonly multiviewerWidgetSelectionPath: string = 'REMOTE/live/multiviewers/widgetSelection/widgetIds'
    static readonly multiviewerWidgetSelectionMap = (key: any) => key
    static readonly multiviewerMemoryPath: string = 'DEVICE/device/monitoringBank/bankList'

    
    
    
}