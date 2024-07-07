

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