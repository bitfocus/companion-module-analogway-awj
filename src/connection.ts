import { AWJinstance } from './index.js'
import * as dgram from 'dgram'
import * as net from 'net'
import URI from 'urijs'
import ky from 'ky'
import WebSocket from 'ws'
import { State } from './state.js'
import { checkSubscriptions, initSubscriptions } from './subscriptions.js'
import { mapOut, updateMappings } from './mappings.js'
import { InstanceStatus } from '@companion-module/base'


class AWJdevice {
	instance: AWJinstance
	public state: State
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

	constructor(instance: AWJinstance) {
		this.instance = instance
		this.state = instance.state
		//this.tcpsocket = new net.Socket()
		this.hadError = false
		this.shouldBeConnected = false
		//this.tcpsocket.setNoDelay(true)
		//this.tcpsocket.setKeepAlive(true, 2500)
		//this.tcpsocket.setEncoding('utf8')
		//this.tcpsocket.on('ready', () => {
		//	this.instance.updateStatus(this.instance.STATUS_OK)
		//})

		// this.tcpsocket.on('close', () => {
		// 	console.log('AWJ Client closed')
		// 	if (this.shouldBeConnected) {
		// 		this.instance.updateStatus(this.instance.STATUS_ERROR)
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

	/**
	 * Connect to a AWJ device
	 * @param addr the complete base url of the device to connect to, can contain protocol, credentials, host and port
	 * @returns void
	 */
	connect(addr: string | undefined): void {
		this.addr = addr
		if (this.addr === undefined) return
		this.shouldBeConnected = true

		const urlObj = this.getURLobj(this.addr)
		if (urlObj === null) return

		this.instance.updateStatus(InstanceStatus.Connecting, `Init Connection`)

		const handleApiStateResponse = (res: {[name: string]: any}) => {
			if (res.device) {
				this.state.setUnmapped('DEVICE', res)
				//console.log('rest get API device state result')

				const system = this.state.getUnmapped('DEVICE/device/system')
				const device = system.pp?.dev ?? system.deviceList?.items?.['1']?.pp?.dev ?? null
				const fwVersion = this.state.getUnmapped('DEVICE/device/system/version/pp/updater') ?? this.state.getUnmapped('DEVICE/device/system/deviceList/items/1/version/pp/updater') ?? '0.0.0'

				const serialAndFirmware = (): string => {
					// const sn = this.state.getUnmapped('DEVICE/device/system/serial/pp/serialNumber')
					const sn = system.serial?.pp?.serialNumber ?? system.deviceList?.items?.['1']?.serial?.pp?.serialNumber ?? 'unknown'
					if (sn.startsWith('ZZ99')) return ` Simulator, fw ${fwVersion}`
					else return `, S/N: ${sn}, fw ${fwVersion}`
				}

				if (device) {
					if (device.substring(0, 3) === 'NLC') {
						this.instance.updateStatus(InstanceStatus.Ok)
						this.instance.log(
							'info',
							'Connected to ' +
							device.replace('NLC_', 'Aquilon ') + serialAndFirmware()
						)
						const major = parseInt(fwVersion.split('.')[0])
						if (!isNaN(major) && major >= 0) {
							this.state.setUnmapped('LOCAL/platform', `livepremier${major}`)
						} else {
							this.state.setUnmapped('LOCAL/platform', 'livepremier')
						}
					} else if (device.match(/^EIKOS/)) {
						this.instance.updateStatus(InstanceStatus.Ok)
						this.instance.log(
							'info',
							'Connected to Eikos 4k' + serialAndFirmware()
						)
						this.state.setUnmapped('LOCAL/platform', 'midra')
					} else if (device.match(/^PULSE/)) {
						this.instance.updateStatus(InstanceStatus.Ok)
						this.instance.log(
							'info',
							'Connected to Pulse 4k' + serialAndFirmware()
						)
						this.state.setUnmapped('LOCAL/platform', 'midra')
					} else if (device.match(/^QMX/)) {
						this.instance.updateStatus(InstanceStatus.Ok)
						this.instance.log(
							'info',
							'Connected to QuikMatrix 4k' + serialAndFirmware()
						)
						this.state.setUnmapped('LOCAL/platform', 'midra')
					} else if (device.match(/^QVU/)) {
						this.instance.updateStatus(InstanceStatus.Ok)
						this.instance.log(
							'info',
							'Connected to QuickVu 4k' + serialAndFirmware()
						)
						this.state.setUnmapped('LOCAL/platform', 'midra')
					} else if (device.match(/^ZEN100/)) {
						this.instance.updateStatus(InstanceStatus.Ok)
						this.instance.log(
							'info',
							'Connected to Zenith 100' + serialAndFirmware()
						)
						this.state.setUnmapped('LOCAL/platform', 'midra')
					} else if (device.match(/^ZEN200/)) {
						this.instance.updateStatus(InstanceStatus.Ok)
						this.instance.log(
							'info',
							'Connected to Zenith 200' + serialAndFirmware()
						)
						this.state.setUnmapped('LOCAL/platform', 'midra')
					} else if (device.match(/^DBG/)) {
						this.instance.updateStatus(InstanceStatus.Ok)
						this.instance.log(
							'info',
							'Connected to MNG_DEBUG' + serialAndFirmware()
						)
						this.state.setUnmapped('LOCAL/platform', 'midra')
					} else {
						this.instance.updateStatus(InstanceStatus.ConnectionFailure)
						this.instance.log('error', `Connected to an AWJ device of type '${device}', firmware '${fwVersion}'. Device type or firmware can not be determined or is not compatible with this module`)
						return
					}
					try {
						updateMappings(this.instance)
					} catch (error) {
						this.instance.log('error', 'update Mappings failed ' + error)
					}
					try {
						initSubscriptions(this)
					} catch (error) {
						this.instance.log('error', 'init Subscriptions failed ' + error)
					}

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
					try {
						checkSubscriptions(this.instance)
					} catch (error: any) {
						this.instance.log('error', 'initializing subscriptions failed ' + error + ' ' + error.trace)
					}
					try {
						this.instance.getMACfromDevice()
					} catch (error) {
						this.instance.log('error', 'getting MAC address from device failed ' + error)
					}
					try {
						void this.instance.updateInstance()
					} catch (error) {
						this.instance.log('error', 'initializing Instance failed ' + error)
					}
				} else {
					this.instance.updateStatus(InstanceStatus.ConnectionFailure)
					this.instance.log('error', 'Connected to an Analog Way device but device type is not compatible with this module')
				}
			} else {
				this.instance.log('error', 'Got malformed state from device ' + res)
			}
		}

		const webSocketProtocol = urlObj.protocol() === 'https' ? 'wss://' : 'ws://'

		this.websocket = new WebSocket(`${webSocketProtocol}${urlObj.host()}`, { handshakeTimeout: 1234, maxRedirects: 1 })

		this.websocket.on('open', async () => {
			this.reconnectinterval = this.reconnectmin
			let downloaded = 0

			const getState = async (msg?: string | undefined) => {
				this.instance.updateStatus(InstanceStatus.Connecting, `Syncing`)
				msg = msg ? ' '+msg : ''
				try {
					const response = await ky.get(`${urlObj.protocol()}://${urlObj.host()}/api/stores/device`,{
						headers: {
							cookie: this.authcookie
						},
						retry: 2,
						onDownloadProgress: (progress, _chunk) => {
							const newDownloaded = Math.floor(progress.transferredBytes / 1024000)
							if (newDownloaded !== downloaded) {
								downloaded = newDownloaded
								this.instance.updateStatus(InstanceStatus.Connecting, `Syncing ${downloaded.toString().padStart(3,'0')}MB`)
							}
						}
					}).json<any>()
					handleApiStateResponse(response)
				} catch (err) {
					this.instance.updateStatus(InstanceStatus.ConnectionFailure)
					this.instance.log('error', "Can't retrieve state from device"+ msg + ' ' + err)
				}

			}

			try {
				const authResponse = await ky.get(`${urlObj.protocol()}://${urlObj.host()}/auth/status`, {
					retry: 2	
				}).json<{[name: string]: any}>()
				const isAuth = authResponse.authentication?.isAuthenticationEnabled
				const device = authResponse.devices?.leader?.reference?.enum ?? authResponse.devices?.leader?.reference?.enum
				const swVerMajor = authResponse.devices?.leader?.version?.major ?? authResponse.devices?.leader?.version?.major
				const swVerMinor = authResponse.devices?.leader?.version?.minor ?? authResponse.devices?.leader?.version?.minor
				const swVerPatch = authResponse.devices?.leader?.version?.patch ?? authResponse.devices?.leader?.version?.patch
				if (isAuth !== undefined && device !== undefined && swVerMajor !== undefined && swVerMinor !== undefined && swVerPatch !== undefined) {
					// it seems we are speaking to an AWJ device

					if (authResponse?.authentication.isAuthenticationEnabled === true) {
						// Password required
						this.instance.updateStatus(InstanceStatus.Connecting, `Logging in`)
						ky(`${urlObj.protocol()}://${urlObj.host()}/auth/login`, {
							method: 'post',
							json: { password: urlObj.password() },
							retry: 2,
							redirect: 'error'
						}).then((res) => {
							// Got succesful auth response
							if (res.headers['set-cookie']) {
								this.authcookie = res.headers['set-cookie']
								this.instance.log('info', 'Login to device is successful')
							}
							getState()
						})
						.catch((err) => {
							this.instance.log('error', 'Password failed ' + err)
						})

					} else {
						// no Password required
						getState()
					}
				}
			} catch (error) {
				console.log(`Can't connect to device webserver.`, error)
				// console.log('ws close and retry in', this.reconnectinterval)
				this.disconnect()
				if (this.wsTimeout) clearTimeout(this.wsTimeout)
				this.wsTimeout = setTimeout(() => {
					this.connect(this.addr)
				}, this.reconnectinterval)
				this.reconnectinterval *= 1.2
				if (this.reconnectinterval > this.reconnectmax) this.reconnectinterval = this.reconnectmax
			}
		})

		this.websocket.on('close', () => {
			// console.log('ws closed', ev.toString(), this.shouldBeConnected ? 'should be connected' : 'should not be connected')
			if (this.shouldBeConnected) {
				this.instance.updateStatus(InstanceStatus.Disconnected)
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
			this.instance.updateStatus(InstanceStatus.ConnectionFailure)
			if (error.toString().match(/Error: Opening handshake has timed out/)) {
				this.instance.log(
					'error',
					'Connection attempt to device has timed out, will retry in ' + Math.round(this.reconnectinterval/100)/10 + 's'
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
			//console.log('debug', 'incoming WS message '+ data.toString().substring(0, 200))
			if (
				isBinary != true &&
				data.toString().match(/"op":"replace","path":"\/system\/status\/current(Device)?Time","value":/) === null &&
				data.toString().match(/"op":"(add|remove)","path":"\/system\/temperature\/externalTempHistory\//) === null &&
				data.toString().match(/"device","system",("deviceList","items","[1-4]",)?"temperature",/) === null
			) {
				// console.log('debug', 'incoming WS message '+ data.toString().substring(0, 200))
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
			ky.post(`${urlObj.protocol()}://${urlObj.host()}${urlObj.resource()}`,{
				body: message,
				headers: {
					'Content-Type': 'application/json'
				},
				retry: 2,
				redirect: 'error'
			})
				//.ok((res) => res.status < 400)
			.then((res) => {
				this.instance.log('debug', 'http POST successfull ' + res.status)
			})
			.catch((err) => {
				this.instance.log('debug', 'http POST failed ' + err)
			})
		} else if (this.authcookie.length > 0) { 
			ky.post(`${urlObj.protocol()}://${urlObj.host()}${urlObj.resource()}`,{
				body: message,
				headers: {
					'Content-Type': 'application/json',
					'Cookie': this.authcookie
				},
				retry: 2,
				redirect: 'error'
			})
				//.ok((res) => res.status < 400)
			.then((res) => {
				this.instance.log('debug', 'http POST successfull ' + res.status)
			})
			.catch((err) => {
				this.instance.log('debug', 'http POST failed ' + err)
			})
		} else if (urlObj.username() === 'Admin' && this.authcookie.length === 0) {
			ky.post(`${urlObj.protocol()}://${urlObj.host()}/auth/login`,{
				body: JSON.stringify({ password: urlObj.password() }),
				headers: {
					'Content-Type': 'application/json',
				},
				retry: 2,
				redirect: 'error'
			})
				//.ok((res) => res.status < 400)
			.then((res) => {
				// Got succesful auth response
				if (res.headers['set-cookie']) {
					this.authcookie = res.headers['set-cookie']
					this.instance.log('info', 'Login to device is successful')
				}
				ky.post(`${urlObj.protocol()}://${urlObj.host()}${urlObj.resource()}`,{
					body: message,
					headers: {
						'Content-Type': 'application/json',
						'Cookie': this.authcookie
					},
					retry: 2,
					redirect: 'error'
					})
					.then((res) => {
						this.instance.log('debug', 'http POST successfull ' + res.status)
					})
					.catch((err) => {
						this.instance.log('debug', 'http POST failed ' + err)
					})
			})
			.catch((err) => {
				this.instance.log('debug', 'http POST failed ' + err)
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
	// 			this.instance.updateStatus(this.instance.STATUS_ERROR)
	// 		})
	// 	})
	// }

	/**
	 * Sends a raw text message to the device via websocket connection
	 * @param message the message string to send
	 */
	sendRawWSmessage(message: string): void {
		if (this.websocket?.readyState === 1) {
			this.websocket?.send(message)
			// console.log('sendig WS message', this.websocket.url ,message)
		}
	}

	/**
	 * Sends an AW message to the device via websocket
	 * @param path a path in the device object, can be a string with slashes as delimiters or an array of strings. The path will be mapped according to mappings.
	 * @param value the value to send
	 */
	sendWSmessage(
		path: string | string[],
		value: string | string[] | number | boolean
	): void {
		const mapped = mapOut(this.state.mappings, path, value)
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
	 * @param path the path in the channel object. Path will be mapped according to mappings.
	 * @param value
	 */
	sendWSpatch(channel: string, op: string, path: string | string[], value: string | number | boolean | object): void {
		const mapped = mapOut(this.state.mappings, path, value)
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
	 * @param path the path in the channel object. Path will be mapped according to mappings.
	 * @param value
	 */
	sendWSdata(channel: string, name: string, path: string | string[], args: unknown[]): void {
		let obj = {}
		if (args.length === 0) {
			const mapped = mapOut(this.state.mappings, path, [])
			obj = {
				channel,
				data: {
					name,
					path: '/' + mapped.path,
					args: []
				}
			}
		} else {
			const mapped = mapOut(this.state.mappings, path, args[0])
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

	/**
	 * Sends a global update command
	 * @param platform 
	 */
	sendXupdate(platform?: string): void {
		if (!platform) platform = this.state.platform
		const updates: Record<string, string> = {
			livepremier: '{"channel":"DEVICE","data":{"path":["device","screenGroupList","control","pp","xUpdate"],"value":',
			midra: '{"channel":"DEVICE","data":{"path":["device","preset","control","pp","xUpdate"],"value":'
		}
		const xUpdate = updates[platform]
		if (xUpdate) {
			this.sendRawWSmessage(xUpdate + 'false}}')
			this.sendRawWSmessage(xUpdate + 'true}}')
		}

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
