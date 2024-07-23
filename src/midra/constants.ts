import Constants from "../awjdevice/constants.js"

/**
 * This class holds all the device specific constants.
 * Mainly these are paths where a feature is located in the AWJ device model.
 */
export default class ConstantsMidra extends Constants {
    constructor() {
        super()
    }

    static override readonly maxScreens = 4
    static override readonly maxAuxScreens = 4
    static override readonly maxInputs = 16
    static override readonly maxLayers = 8 as const
    static override readonly maxScreenMemories = 199 as const
    static override readonly maxStills = 49 as const
    
    static override readonly presetTogglePath = ['DEVICE','device','screenGroupList','items','S1','control','pp','copyMode']
    static override readonly presetToggleValueValid = false

    static override readonly lockPrefixScreen = 'SCREEN_'
    static override readonly lockPrefixAux = 'AUX_'

    static override readonly macAddressPath = 'DEVICE/device/system/network/adapter/pp/macAddress'

    // static override readonly xUpdatePath = '"device","screenGroupList","control","pp","xUpdate"' // livepremier + livepremier4
    static override readonly xUpdatePath = '"device","preset","control","pp","xUpdate"' // midra

    static override readonly screenGroupPath = ['device', 'transition', 'screenList']
    static override readonly auxGroupPath = ['device', 'transition', 'auxiliaryScreenList']

    static override readonly screenPath = ['device', 'screenList']
    static override readonly auxPath = ['device', 'auxiliaryScreenList']

    static override readonly lastUsedMasterPresetPath = ['device', 'preset', 'masterBank', 'status', 'lastUsed'] 

    static override readonly screenMemoryPath = ['device','preset','bank','slotList']
    static override readonly activeScreenMemoryIdPath = ['status','pp','memoryId']
    static override readonly activeScreenMemoryIsModifiedPath = ['status','pp','isModified']
    static override readonly activeScreenMemoryValueValid = false

    static override readonly screenSizePath = ['canvas', 'status', 'size', 'pp']
    static override readonly propsSizePath = ['size', 'pp']
    static override readonly propsPositionPath = ['position', 'pp']
    static override readonly propsCroppingPath = ['crop', 'pp']
    static override readonly propsMaskPath = ['mask', 'pp']

    static override readonly screenLayerList = ['liveLayerList', 'items']

    static override readonly subSyncselectionPat = 'system/network/websocketServer/clients'

    static override readonly multiviewerWidgetSelectionPath = 'REMOTE/live/multiviewer/widgetSelection/widgetKeys' as const
    static override readonly multiviewerWidgetSelectionMap = (key: string) => {return {mocOutputLogicKey: '1', widgetKey: key}}
    static override readonly multiviewerMemoryPath = 'DEVICE/device/multiviewer/bankList'
    
    
}