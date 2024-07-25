

export class ScreenString extends String {

    get prefix() {
        if (this.startsWith('S')) return 'S'
        else if (this.startsWith('A')) return 'A'
        else return ''
    }

    get number() {
        const num = Number(this.replace(/^\D*/, ''))
        if (isNaN(num)) return undefined
        else return num
    }

    get numstr() {
        return this.replace(/^\D*/, '')
    }

    isScreen() {
        if (this.startsWith('S')) return true
        else return false
    }

    isAux() {
        if (this.startsWith('A')) return true
        else return false
    }

    get prefixAux() {
        if (this.startsWith('A')) return 'Aux'
        else return ''
    }

    get prefixAuxiliary() {
        if (this.startsWith('A')) return 'Auxiliary'
        else return ''
    }

    get prefixverylong() {
        if (this.startsWith('A')) return 'auxiliaryScreen'
        else return 'screen'
    }

    get details() {
        const prefix = this.prefix
        const prefixlong = prefix == 'A' ? 'Aux' : 'Screen'
        const prefixverylong = prefix == 'A' ? 'auxiliaryScreen' : 'screen'
        const prefixAux = prefix == 'A' ? 'Aux' : ''
        const prefixAuxiliary = prefix == 'A' ? 'Auxiliary' : ''

        return {
            id: this,
            index: this.number,
            number: this.number,
            numstr: this.numstr,
            isScreen: this.isScreen,
            isAux: this.isAux,
            prefix,
            prefixlong,
            prefixverylong,
            prefixAux,
            prefixAuxiliary
        }
    }

}

/**
 * Process a string with a time
 * @param timestring string containing the time, can be format like 1:23:45 or 01:23:45 or 12:34 or 5:05..., can be negative like -5:50
 * @returns numbers of seconds, e.g. 1234 or -42
 */
export const timeToSeconds = (timestring: string): number => {
    let hours = 0
    let minutes = 0
    let seconds = 0
    let direction = 1
    let result = timestring.match(/(?:^|\D)(-?)(\d|1\d|2[0-3])\D(\d|[0-5]\d)\D(\d|[0-5]\d)(?:\D|$)/)
    if (result) {
        direction = result[1] === '-' ? -1 : 1
        hours = parseInt(result[2])
        minutes = parseInt(result[3])
        seconds = parseInt(result[4])
        return (hours * 3600 + minutes * 60 + seconds) * direction
    }
    result = timestring.match(/(?:^|\D)(-?)(\d{0,3})\D(\d|[0-5]\d)(?:\D|$)/)
    if (result) {
        direction = result[1] === '-' ? -1 : 1
        minutes = parseInt(result[2])
        seconds = parseInt(result[3])
        return (hours * 3600 + minutes * 60 + seconds) * direction
    }
    result = timestring.match(/(?:^|\D)(-?)(\d{0,5})(?:\D|$)/)
    if (result) {
        direction = result[1] === '-' ? -1 : 1
        seconds = parseInt(result[2])
        return (hours * 3600 + minutes * 60 + seconds) * direction
    }
    return 0
}

/**
 * process times
 * @param time as number of deciseconds 
 * @returns timestring in format M:SS.S
 */
export const deciSceondsToString = (time: number): string => {
    return (
        Math.floor(time / 600)
            .toString()
            .padStart(2, '0') +
        ':' +
        ((time % 600) / 10).toFixed(2).padStart(5, '0')
    )
}