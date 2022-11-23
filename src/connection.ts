import AWJinstance from './index'
import {
	CompanionSystem
} from '../../../instance_skel_types'
//import { DeviceType } from '../types/Device'
import dgram = require("dgram")
import net = require('net')
import URI = require('urijs')
import superagent = require('superagent')
import { WebSocket } from 'ws'
import { State } from './state'
import { checkSubscriptions, updateSubscriptions } from './subscriptions'
import { mapOut, updateMappings } from './mappings'


class AWJdevice {
	instance: AWJinstance
	public state: State
	system: CompanionSystem
	tcpsocket: net.Socket | undefined
	websocket: WebSocket | undefined | null
	wsTimeout: NodeJS.Timeout | undefined
	port: number | undefined
	host: string | undefined
	addr: string | undefined
	authcookie = ''
	reconnectmin = 100
	reconnectmax = 16_500
	reconnectinterval = this.reconnectmin
	readonly delimiter = '!' // '\x04'
	readonly bufferMaxLength = 64_000
	buffer = ''
	shouldBeConnected: boolean
	hadError: boolean

	constructor(instance: AWJinstance, system: CompanionSystem) {
		this.instance = instance
		this.state = instance.state
		this.system = system
		//this.tcpsocket = new net.Socket()
		this.hadError = false
		this.shouldBeConnected = false
		//this.tcpsocket.setNoDelay(true)
		//this.tcpsocket.setKeepAlive(true, 2500)
		//this.tcpsocket.setEncoding('utf8')
		//this.tcpsocket.on('ready', () => {
		//	this.instance.status(this.instance.STATUS_OK)
		//})

		// this.tcpsocket.on('close', () => {
		// 	console.log('AWJ Client closed')
		// 	if (this.shouldBeConnected) {
		// 		this.instance.status(this.instance.STATUS_ERROR)
		// 		console.log('Retry AWJ connection in 2s')
		// 		// setTimeout(() => this.connect(this.host, this.port), 2000)
		// 	}
		// })

	// 	this.tcpsocket.on('data', (data: string) => {
	// 		this.bufferFragment(data)
	// 		let message: string | null = null
	// 		// eslint-disable-next-line no-cond-assign
	// 		while ((message = this.getNextMessage())) {
	// 			// check if there is data followed by a delimiter
	// 			console.log('AWJ received ', message)
	// 			let obj = {}
	// 			try {
	// 				obj = JSON.parse(message) // check if the data is a valid json, could be only a fragment
	// 			} catch (error) {
	// 				console.log('Received data is no valid JSON')
	// 				continue
	// 			}
	// 			if (Object.prototype.hasOwnProperty.call(obj, 'path') && Object.prototype.hasOwnProperty.call(obj, 'value')) {
	// 				// check if json has the properties of AWJ
	// 				console.log('Received valid:', obj)
	// 			} else {
	// 				console.log('Received data does not contain required properties', obj)
	// 			}
	// 		}
	// 	})
	}

	bufferFragment(data: string): void {
		this.buffer += data
		if (this.buffer.length > this.bufferMaxLength) {
			console.log('Incoming Data Buffer overflow, flushing...', this.buffer.length)
			this.buffer = ''
		}
	}
	getNextMessage(): string | null {
		const delimiterIndex = this.buffer.indexOf(this.delimiter)
		if (delimiterIndex !== -1) {
			const message = this.buffer.slice(0, delimiterIndex)
			this.buffer = this.buffer.slice(delimiterIndex + this.delimiter.length)
			return message
		}
		return null
	}

	getURLobj(address: string) {
		if (address.match(/^https?:\/\//) == null) {
			address = 'http://' + address
		}
		const urlObj = new URI(address)
		if (urlObj.is('domain')) {
			//console.log('URL Domain', urlObj)
		} else if (urlObj.is('ipv4')) {
			//console.log('URL ipv4', urlObj)
		} else if (urlObj.is('ipv6')) {
			//console.log('URL ipv6', urlObj)
		} else {
			this.instance.log('warn', 'URL seems invalid')
		}
		if (urlObj.protocol() === 'http' && urlObj.port === null) {
			urlObj.port('80')
		}
		if (urlObj.protocol() === 'https' && urlObj.port === null) {
			urlObj.port('443')
		}
		if (urlObj.protocol() !== 'http' && urlObj.protocol() !== 'https') {
			this.instance.log('error', 'Protocol needs to be either http or https but is ' + urlObj.protocol())
			return null
		}
		return urlObj
	}

	connect(addr: string | undefined): void {
		this.addr = addr
		if (this.addr === undefined) return
		this.shouldBeConnected = true

		const urlObj = this.getURLobj(this.addr)
		if (urlObj === null) return

		const handleAPIresponse = (res: superagent.Response) => {
			if (res.body.device) {
				this.state.setUnmapped('DEVICE', res.body)
				//console.log('rest get API result')
				const serialNumber = (): string => {
					const sn = this.state.getUnmapped('DEVICE/device/system/serial/pp/serialNumber')
					if (sn === 'ZZ9999') return ' Simulator'
					else return ', S/N: ' + sn
				}
				if (this.state.getUnmapped('DEVICE/device/system/pp/dev')) {
					if (this.state.getUnmapped('DEVICE/device/system/pp/dev').substring(0, 3) === 'NLC') {
						this.instance.status(this.instance.STATUS_OK)
						this.instance.log(
							'info',
							'Connected to ' +
							this.state.getUnmapped('DEVICE/device/system/pp/dev').replace('NLC_', 'Aquilon ') +
							(this.state.getUnmapped('DEVICE/device/system/pp/isSimulated')
								? ' Simulator'
								: ', S/N:' + this.state.getUnmapped('DEVICE/device/system/serial/pp/serialNumber'))
						)
						this.state.setUnmapped('LOCAL/platform', 'livepremier')
					} else if (this.state.getUnmapped('DEVICE/device/system/pp/dev').match(/^EIKOS/)) {
						this.instance.status(this.instance.STATUS_OK)
						this.instance.log(
							'info',
							'Connected to Eikos 4k' + serialNumber()
						)
						this.state.setUnmapped('LOCAL/platform', 'midra')
					} else if (this.state.getUnmapped('DEVICE/device/system/pp/dev').match(/^PULSE/)) {
						this.instance.status(this.instance.STATUS_OK)
						this.instance.log(
							'info',
							'Connected to Pulse 4k' + serialNumber()
						)
						this.state.setUnmapped('LOCAL/platform', 'midra')
					} else if (this.state.getUnmapped('DEVICE/device/system/pp/dev').match(/^QMX/)) {
						this.instance.status(this.instance.STATUS_OK)
						this.instance.log(
							'info',
							'Connected to QuikMatrix 4k' + serialNumber()
						)
						this.state.setUnmapped('LOCAL/platform', 'midra')
					} else if (this.state.getUnmapped('DEVICE/device/system/pp/dev').match(/^QVU/)) {
						this.instance.status(this.instance.STATUS_OK)
						this.instance.log(
							'info',
							'Connected to QuickVu 4k' + serialNumber()
						)
						this.state.setUnmapped('LOCAL/platform', 'midra')
					} else if (this.state.getUnmapped('DEVICE/device/system/pp/dev').match(/^ZEN100/)) {
						this.instance.status(this.instance.STATUS_OK)
						this.instance.log(
							'info',
							'Connected to Zenith 100' + serialNumber()
						)
						this.state.setUnmapped('LOCAL/platform', 'midra')
					} else if (this.state.getUnmapped('DEVICE/device/system/pp/dev').match(/^ZEN200/)) {
						this.instance.status(this.instance.STATUS_OK)
						this.instance.log(
							'info',
							'Connected to Zenith 200' + serialNumber()
						)
						this.state.setUnmapped('LOCAL/platform', 'midra')
					} else if (this.state.getUnmapped('DEVICE/device/system/pp/dev').match(/^DBG/)) {
						this.instance.status(this.instance.STATUS_OK)
						this.instance.log(
							'info',
							'Connected to MNG_DEBUG' + serialNumber()
						)
						this.state.setUnmapped('LOCAL/platform', 'midra')
					} else {
						this.instance.status(this.instance.STATUS_ERROR)
						this.instance.log('error', 'Connected to an AWJ device but device type is not compatible with this module')
						return
					}
					updateMappings(this.state.platform)
					updateSubscriptions(this.state.platform)

					if (this.instance.config.sync === true && this.hadError === false) {
						console.log('switching sync on because of config')
						this.instance.switchSync(1)
					} else if (this.hadError === true) {
						this.instance.switchSync(3)
						console.log('setting sync again after reconnection')
					} else {
						this.instance.switchSync(0)
						console.log('setting sync off by default')
					}
					this.hadError = false
					checkSubscriptions(this.instance)
					this.instance.getMACfromDevice()
					void this.instance.updateInstance()
				} else {
					this.instance.status(this.instance.STATUS_ERROR)
					this.instance.log('error', 'Connected to an Analog Way device but device type is not compatible with this module')
				}
			} else {
				this.instance.log('error', 'Got malformed state from device ' + res)
			}
		}

		const webSocketProtocol = urlObj.protocol() === 'https' ? 'wss://' : 'ws://'

		this.websocket = new WebSocket(`${webSocketProtocol}${urlObj.host()}`, { handshakeTimeout: 1234, maxRedirects: 1 })

		this.websocket.on('open', () => {
			this.reconnectinterval = this.reconnectmin

			superagent
				.get(`${urlObj.protocol()}://${urlObj.host()}/auth/status`)
				.retry(2)
				.then((res) => {
					if (res.body?.authentication?.isAuthenticationEnabled !== undefined) {
						// it seems we are speaking to an AWJ device
						if (res.body?.authentication.isAuthenticationEnabled === true) {
							// Password required
							superagent
								.post(`${urlObj.protocol()}://${urlObj.host()}/auth/login`)
								.set('Content-Type', 'application/json')
								.redirects(0)
								.ok((res) => res.status < 400)
								.send(JSON.stringify({ password: urlObj.password() }))
								.then((res) => {
									// Got succesful auth response
									if (res.header['set-cookie']) {
										this.authcookie = res.header['set-cookie']
										this.instance.log('info', 'Login to device is successful')
									}
									superagent
										.get(`${urlObj.protocol()}://${urlObj.host()}/api/stores/device`)
										.set('Cookie', this.authcookie)
										.then(handleAPIresponse)
										.catch((err) => {
											this.instance.status(this.instance.STATUS_ERROR)
											this.instance.log('error', "Can't retrieve state from device " + err)
										})
								})
								.catch((err) => {
									this.instance.log('error', 'Password failed ' + err)
								})
						} else {
							// no Password required
							superagent
								.get(`${urlObj.protocol()}://${urlObj.host()}/api/stores/device`)
								.then(handleAPIresponse)
								.catch((err) => {
									this.instance.status(this.instance.STATUS_ERROR)
									this.instance.log('error', "Can't retrieve state from device " + err)
								})
						}
					}
				})
				.catch(() => {
					// console.log('superagent down', err)
					// console.log('ws close and retry in', this.reconnectinterval)
					this.disconnect()
					if (this.wsTimeout) clearTimeout(this.wsTimeout)
					this.wsTimeout = setTimeout(() => {
						this.connect(this.addr)
					}, this.reconnectinterval)
					this.reconnectinterval *= 1.2
					if (this.reconnectinterval > this.reconnectmax) this.reconnectinterval = this.reconnectmax
				})
		})

		this.websocket.on('close', () => {
			// console.log('ws closed', ev.toString(), this.shouldBeConnected ? 'should be connected' : 'should not be connected')
			if (this.shouldBeConnected) {
				this.instance.status(this.instance.STATUS_ERROR)
				this.hadError = true
				// console.log('ws retry in', this.reconnectinterval)
				if (this.wsTimeout) clearTimeout(this.wsTimeout)
				this.wsTimeout = setTimeout(() => {
					this.connect(this.addr)
				}, this.reconnectinterval)
				this.reconnectinterval *= 1.2
				if (this.reconnectinterval > this.reconnectmax) this.reconnectinterval = this.reconnectmax
			}
		})
		this.websocket.on('error', (error) => {
			this.hadError = true
			console.log('ws error', error.toString())
			this.instance.status(this.instance.STATUS_ERROR)
			if (error.toString().match(/Error: Opening handshake has timed out/)) {
				this.instance.log(
					'error',
					'Connection attempt to device has timed out, will retry in ' + this.reconnectinterval/1000 + 's'
				)
			}
			else if (error.toString().match(/Error: self signed certificate/)) {
				this.instance.log(
					'error',
					'Device is presenting a self signed certificate and is considered insecure. No more automatic connection retries.'
				)
				this.shouldBeConnected = false
			} else {
				this.instance.log('error', 'Socket ' + error)
			}
		})

		this.websocket.on('message', (data, isBinary) => {
			if (
				isBinary != true &&
				data.toString().match(/"op":"replace","path":"\/system\/status\/current(Device)?Time","value":/) === null &&
				data.toString().match(/"op":"(add|remove)","path":"\/system\/temperature\/externalTempHistory\//) === null &&
				data.toString().match(/"device","system","temperature",/) === null
			) {
				// console.log('\n\nincoming WS message', data.toString().substring(0, 200))
				this.state.apply(JSON.parse(data.toString()))
			}
		})
		
	}

	resetReconnectInterval(): void {
		this.reconnectinterval = this.reconnectmin
	}

	restPOST(href: string, message: string): void {
		const urlObj = this.getURLobj(href)
		if (urlObj === null) return
		if (urlObj.username() !== 'Admin' && this.authcookie.length === 0) {
			superagent
				.post(`${urlObj.protocol()}://${urlObj.host()}${urlObj.resource()}`)
				.retry(2)
				.set('Content-Type', 'application/json')
				.redirects(0)
				.ok((res) => res.status < 400)
				.send(message)
				.then((res) => {
					this.instance.log('debug', 'http POST successfull ' + res.statusCode)
				})
				.catch((err) => {
					this.instance.log('debug', 'http POST failed ' + err)
				})
		} else if (this.authcookie.length > 0) { 
			superagent
				.post(`${urlObj.protocol()}://${urlObj.host()}${urlObj.resource()}`)
				.retry(2)
				.set('Content-Type', 'application/json')
				.set('Cookie', this.authcookie)
				.redirects(0)
				.ok((res) => res.status < 400)
				.send(message)
				.then((res) => {
					this.instance.log('debug', 'http POST successfull ' + res.statusCode)
				})
				.catch((err) => {
					this.instance.log('debug', 'http POST failed ' + err)
				})
		} else if (urlObj.username() === 'Admin' && this.authcookie.length === 0) {
			superagent
				.post(`${urlObj.protocol()}://${urlObj.host()}/auth/login`)
				.set('Content-Type', 'application/json')
				.redirects(0)
				.ok((res) => res.status < 400)
				.send(JSON.stringify({ password: urlObj.password() }))
				.then((res) => {
					// Got succesful auth response
					if (res.header['set-cookie']) {
						this.authcookie = res.header['set-cookie']
						this.instance.log('info', 'Login to device is successful')
					}
					superagent
						.post(`${urlObj.protocol()}://${urlObj.host()}${urlObj.resource()}`)
						.retry(2)
						.set('Content-Type', 'application/json')
						.set('Cookie', this.authcookie)
						.redirects(0)
						.ok((res) => res.status < 400)
						.send(message)
						.then((res) => {
							this.instance.log('debug', 'http POST successfull ' + res.statusCode)
						})
						.catch((err) => {
							this.instance.log('debug', 'http POST failed ' + err)
						})
				})
				.catch((err) => {
					this.instance.log('error', 'Password failed ' + err)
				})
		}
	} 

	disconnect(): void {
		clearTimeout(this.wsTimeout)
		this.shouldBeConnected = false
		this.hadError = false
		this.websocket?.close()
		//this.websocket = null
		// this.tcpsocket.destroy()
		this.buffer = ''
	}

	destroy(): void {
		clearTimeout(this.wsTimeout)
		this.shouldBeConnected = false
		this.hadError = false
		this.websocket = null
		//this.tcpsocket.destroy()
		this.buffer = ''
		this.authcookie = ''
		this.instance.log('debug', 'Connection has been destroyed due to removal or disable by user')
	}

	// async sendRawTCPmessage(message: string): Promise<void> {
	// 	// if (this.tcpsocket.readyState === 'open')
	// 	return new Promise((resolve, reject) => {
	// 		this.tcpsocket?.write(message)

	// 		this.tcpsocket?.on('data', (data: void | PromiseLike<void>): void => {
	// 			resolve(data)
	// 		})

	// 		this.tcpsocket?.on('error', (err: unknown) => {
	// 			reject(err)
	// 			this.instance.status(this.instance.STATUS_ERROR)
	// 		})
	// 	})
	// }

	sendRawWSmessage(message: string): void {
		if (this.websocket?.readyState === 1) {
			this.websocket?.send(message)
			// console.log('sendig WS message', message)
		}
	}

	sendWSmessage(
		path: string | string[],
		value: string | string[] | number | boolean
	): void {
		const mapped = mapOut(path, value)
		const obj = {
			channel: 'DEVICE',
			data: {
				path: mapped.path.split('/'),
				value: mapped.value
			}
		}
		this.sendRawWSmessage(JSON.stringify(obj))
	}

	/**
	 * Sends a patch via websocket
	 * @param channel
	 * @param op
	 * @param path
	 * @param value
	 */
	sendWSpatch(channel: string, op: string, path: string | string[], value: string | number | boolean | object): void {
		const mapped = mapOut(path, value)
		const obj = {
			channel,
			data: {
				channel: 'PATCH',
				patch: {
					op: op,
					path: '/'+mapped.path,
					value: mapped.value
				}
			}
		}
		this.sendRawWSmessage(JSON.stringify(obj))
	}

	/**
	 * Sends a patch via websocket
	 * @param channel
	 * @param op
	 * @param path
	 * @param value
	 */
	sendWSdata(channel: string, name: string, path: string | string[], args: unknown[]): void {
		let obj = {}
		if (args.length === 0) {
			const mapped = mapOut(path, [])
			obj = {
				channel,
				data: {
					name,
					path: '/' + mapped.path,
					args: []
				}
			}
		} else {
			const mapped = mapOut(path, args[0])
			if (args.length === 1) {
				obj = {
					channel,
					data: {
						name,
						path: '/' + mapped.path,
						args: [mapped.value]
					}
				}
			} else {
				obj = {
					channel,
					data: {
						name,
						path: '/' + mapped.path,
						args: [mapped.value, ...args.splice(1)]
					}
				}
			}
		}
		this.sendRawWSmessage(JSON.stringify(obj))
	}

	// sendAWJmessage(_op: string, _path: string, _value: string): void
	// sendAWJmessage(_op: string, _path: string, _value: number): void
	// sendAWJmessage(_op: string, _path: string, _value: boolean): void
	// sendAWJmessage(op: string, path: string, value: string | number | boolean): void {
	// 	if (typeof value === 'string')
	// 		return void this.sendRawTCPmessage(`{"op":"${op}, "path":"${path}", "value":"${value}"}${this.delimiter}`)
	// 	if (typeof value === 'number' || typeof value === 'boolean')
	// 		return void this.sendRawTCPmessage(
	// 			`{"op":"${op}, "path":"${path}", "value":${value.toString()}}${this.delimiter}`
	// 		)
	// }

	sendXupdate(platform?: string): void {
		if (!platform) platform = this.state.platform
		const updates: Record<string, string> = {
			livecore: '{"channel":"DEVICE","data":{"path":"device/screenGroupList/control/pp/xUpdate","value":true}}',
			midra: '{"channel":"DEVICE","data":{"path":"device/preset/control/pp/xUpdate","value":true}}'
		}
		const xUpdate = updates[platform]
		if (xUpdate) this.sendRawWSmessage(xUpdate)

	}

	/**
	 * createMagicPacket
	 */
	createMagicPacket(mac: string): Buffer {
		const MAC_REPEAT = 16
		const MAC_LENGTH = 0x06
		const PACKET_HEADER = 0x06
		const parts = mac.match(/[0-9a-fA-F]{2}/g)
		if (!parts || parts.length != MAC_LENGTH) throw new Error(`malformed MAC address "${mac}"`)
		let buffer = Buffer.alloc(PACKET_HEADER)
		const bufMac = Buffer.from(parts.map((p) => parseInt(p, 16)))
		buffer.fill(0xff)
		for (let i = 0; i < MAC_REPEAT; i++) {
			buffer = Buffer.concat([buffer, bufMac])
		}
		return buffer
	}
	/**
	 * wake on lan
	 */
	wake(mac: string): void {
		// create magic packet
		const magicPacket = this.createMagicPacket(mac)
		const socket = dgram.createSocket("udp4")
		socket.bind(() => {
			socket.setBroadcast(true)
			socket.send(magicPacket, 9, '255.255.255.255', (err) => {
					if (err) {
						this.instance.log('error', 'Could not send wake on lan packet. '+ err)
					}
					else this.instance.log('info', 'wake on lan packet sent')
					socket.close()
				})
		})
	}
}

export { AWJdevice }
