import { AWJinstance } from './index.js'
import * as dgram from 'dgram'
import * as net from 'net'
import ky from 'ky'
import URI from 'urijs'
import WebSocket from 'ws'
import { StateMachine } from './state.js'
import { mapOut } from './mappings.js'
import { InstanceStatus } from '@companion-module/base'

const fetchDefaultParameters = {
	retry: 2,
	timeout: 15000
}


class AWJconnection {
	instance: AWJinstance
	public state: StateMachine
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
	#messageHandler: (arg: string) => any = () => undefined

	constructor(instance: AWJinstance) {
		this.instance = instance
		this.hadError = false
		this.shouldBeConnected = false
	}

	/**
	 * Handle messages received from device
	 * @param callback function to call for received data. Data will be passed in Argument as string.
	 */
	onMessage(callback: (arg: string) => any) {
		if (callback === undefined) {
			this.#messageHandler = () => undefined
		} else {
			this.#messageHandler = callback
		}

		if (this.websocket){
			console.log('hooking websocket message ok')
			this.websocket.on('message', (data, isBinary) => {
				// console.log('debug', 'incoming WS message '+ data.toString().substring(0, 200))
				if (!isBinary) {
					this.#messageHandler(data.toString())
				}
			})
		} else {
			console.log('hooking websocket message fail')
		}
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
	async connect(addr: string | undefined): Promise<void> {
		this.addr = addr
		if (this.addr === undefined) return
		this.shouldBeConnected = true

		const urlObj = this.getURLobj(this.addr)
		if (urlObj === null) return

		this.instance.updateStatus(InstanceStatus.Connecting, `Init Connection`)

		try {
			const authResponse = await ky.get(`${urlObj.protocol()}://${urlObj.host()}/auth/status`, {
				...fetchDefaultParameters,
			}).json<{[name: string]: any}>()
			console.log('auth response', authResponse)
			const isAuth = authResponse.authentication?.isAuthenticationEnabled
			const deviceObj = authResponse.device || authResponse.devices?.leader || undefined
			if (isAuth !== undefined && deviceObj !== undefined) {
				// it seems we are speaking to an AWJ device
				const device     = deviceObj.reference?.enum
				const swVerMajor = deviceObj.version?.major
				// const swVerMinor = deviceObj.version?.minor
				// const swVerPatch = deviceObj.version?.patch

				// create a device according to the data of the auth page
				const createDevice = () => {	
					if (device.substring(0, 3) === 'NLC') {
						if (swVerMajor && swVerMajor == 4) {
							return this.instance.createDevice(`livepremier${swVerMajor}`)
						} else {
							return this.instance.createDevice(`livepremier`)
						}
					} else if (device.match(/^EIKOS/)) {
						return this.instance.createDevice('midra')
					} else if (device.match(/^PULSE/)) {
						return this.instance.createDevice('midra')
					} else if (device.match(/^QMX/)) {
						return this.instance.createDevice('midra')
					} else if (device.match(/^QVU/)) {
						return this.instance.createDevice('midra')
					} else if (device.match(/^ZEN/)) {
						return this.instance.createDevice('midra')
					} else if (device.match(/^DBG/)) {
						return this.instance.createDevice('midra')
					} else {
						return undefined
					}
				}

				const setupDevice = async () => {
					const _device = createDevice()

					const webSocketProtocol = urlObj.protocol() === 'https' ? 'wss://' : 'ws://'
					this.websocket = new WebSocket(`${webSocketProtocol}${urlObj.host()}`, { handshakeTimeout: 1234, maxRedirects: 1 })

					this.websocket.on('open', async () => {
						this.reconnectinterval = this.reconnectmin
						this.instance.log('debug', 'Websocket opened')
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

					this.onMessage(this.#messageHandler)

					// this.websocket.on('message', (data, isBinary) => {
					// 	//console.log('debug', 'incoming WS message '+ data.toString().substring(0, 200))
					// 	if (
					// 		isBinary != true &&
					// 		data.toString().match(/"op":"replace","path":"\/system\/status\/current(Device)?Time","value":/) === null &&
					// 		data.toString().match(/"op":"(add|remove)","path":"\/system\/temperature\/externalTempHistory\//) === null &&
					// 		data.toString().match(/"device","system",("deviceList","items","[1-4]",)?"temperature",/) === null
					// 	) {
					// 		// console.log('debug', 'incoming WS message '+ data.toString().substring(0, 200))
					// 		this.#messageHandler(data.toString())
					// 		this.state.apply(JSON.parse(data.toString()))
					// 	}
					// })

					const download = await this.downloadDevicestate(urlObj)
					const returnedState = this.instance.handleApiStateResponse(download)
					if (returnedState !== undefined) {
						this.state = returnedState			
					} else {
						this.instance.log('error', "Error setting up device")	
					}

				}

				if (authResponse?.authentication.isAuthenticationEnabled === true) {
					// Password required
					this.instance.updateStatus(InstanceStatus.Connecting, `Logging in`)
					try {
						let res = await ky(`${urlObj.protocol()}://${urlObj.host()}/auth/login`, {
							method: 'post',
							json: { password: urlObj.password() },
							retry: 2,
							redirect: 'error'
						})
						// Got succesful auth response
						if (res.headers['set-cookie']) {
							this.authcookie = res.headers['set-cookie']
							this.instance.log('info', 'Login to device is successful')

							await setupDevice()

						}
						
					} catch (error) {
						this.instance.log('error', 'Password failed ' + error)
						return Promise.reject(error)
					}
					
				} else {
					// no Password required
					await setupDevice()
				}
			} else {
				this.instance.updateStatus(InstanceStatus.ConnectionFailure, 'No AWJ device')
				this.instance.log('error', 'Connected to a device, but it is no compatible AWJ device, disconnecting now.')
				this.disconnect()
				return Promise.reject('No AWJ device')
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
	}

	async downloadDevicestate(urlObj) {
		let downloaded = 0
		this.instance.updateStatus(InstanceStatus.Connecting, `Syncing`)
		let response: any
		try {
			response = await ky.get(`${urlObj.protocol()}://${urlObj.host()}/api/stores/device`,{
				headers: {
					cookie: this.authcookie
				},
				...fetchDefaultParameters,
				onDownloadProgress: (progress, _chunk) => {
					const newDownloaded = Math.floor(progress.transferredBytes / 1024000)
					if (newDownloaded !== downloaded) {
						downloaded = newDownloaded
						this.instance.updateStatus(InstanceStatus.Connecting, `Syncing ${downloaded.toString().padStart(3,'0')}MB`)
					}
				}
			}).json<any>()
			return response
		} catch (err) {
			this.instance.updateStatus(InstanceStatus.ConnectionFailure)
			this.instance.log('error', "Can't retrieve state from device " + err)
			return Promise.reject(err)
		}
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
				...fetchDefaultParameters,
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
				...fetchDefaultParameters,
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
				...fetchDefaultParameters,
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
					...fetchDefaultParameters,
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

	/**
	 * Sends a raw text message to the device via websocket connection
	 * @param message the message string to send
	 */
	sendRawWSmessage(message: string): void {
		if (this.websocket?.readyState === 1) {
			this.websocket?.send(message)
			console.log('sendig WS message', this.websocket.url ,message)
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

export { AWJconnection }
