export interface DeviceMap {
  [key: string | number]: DeviceMapItem;
}

interface DeviceMapItem {
  sub: string;
  reg: string;
  rep: string;
  fun?: any;
  items?: any[];
}

export interface DeviceMAppingFunction {
  (targetpath: string, receivedpath: string, screen: number): string
}
