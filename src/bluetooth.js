class BluetoothPowerMeter {
    constructor() {
        this.device = null;
        this.server = null;
        this.service = null;
        this.powerCharacteristic = null;
        this.heartRateCharacteristic = null;
        this.cscCharacteristic = null;
        this.powerCallback = null;
        this.heartRateCallback = null;
        this.cadenceCallback = null;
        this.lastCrankRevolutions = undefined;
        this.lastCrankEventTime = undefined;
        this.onPowerUpdate = null;
        this.isConnected = false;
        this.lastPower = 0;
        this.hrDevice = null;
        this.hrCharacteristic = null;
        this.onHeartRateUpdate = null;
        this.lastHeartRate = 0;
        this.cscDevice = null;
        this.cscCharacteristic = null;
        this.onCadenceUpdate = null;
        this.lastCadence = 0;
        this.CYCLING_POWER_SERVICE = 'cycling_power';
        this.POWER_MEASUREMENT_CHARACTERISTIC = 'cycling_power_measurement';
        this.CYCLING_SPEED_CADENCE_SERVICE = 0x1816;
        this.CSC_MEASUREMENT_CHARACTERISTIC = '00002a5b-0000-1000-8000-00805f9b34fb';
    }

    async connect() {
        try {
            this.device = await navigator.bluetooth.requestDevice({
                filters: [{ services: [this.CYCLING_POWER_SERVICE] }],
                optionalServices: ['device_information']
            });

            console.log('Device selected:', this.device.name);
            
            this.device.addEventListener('gattserverdisconnected', () => {
                console.log('Device disconnected');
                this.isConnected = false;
                this.handleDisconnection();
            });
            
            const server = await this.device.gatt.connect();
            const service = await server.getPrimaryService(this.CYCLING_POWER_SERVICE);
            this.characteristic = await service.getCharacteristic(this.POWER_MEASUREMENT_CHARACTERISTIC);
            
            await this.characteristic.startNotifications();
            this.characteristic.addEventListener('characteristicvaluechanged',
                (event) => this.handlePowerData(event));
            
            this.isConnected = true;
            return true;
        } catch (error) {
            console.error('Bluetooth connection error:', error);
            this.isConnected = false;
            return false;
        }
    }

    async connectHRM() {
        try {
            this.hrDevice = await navigator.bluetooth.requestDevice({
                filters: [{ services: ['heart_rate'] }]
            });
            
            const server = await this.hrDevice.gatt.connect();
            const service = await server.getPrimaryService('heart_rate');
            this.hrCharacteristic = await service.getCharacteristic('heart_rate_measurement');
            
            await this.hrCharacteristic.startNotifications();
            this.hrCharacteristic.addEventListener('characteristicvaluechanged',
                (event) => {
                    const value = event.target.value;
                    const heartRate = value.getUint8(1);
                    console.log('Heart rate received:', heartRate);
                    if (this.onHeartRateUpdate) {
                        this.onHeartRateUpdate(heartRate);
                    }
                });

            return true;
        } catch (error) {
            console.error('Error connecting to heart rate monitor:', error);
            return false;
        }
    }

    async connectCSC() {
        try {
            this.cscDevice = await navigator.bluetooth.requestDevice({
                filters: [{ services: [this.CYCLING_SPEED_CADENCE_SERVICE] }]
            });
            
            const server = await this.cscDevice.gatt.connect();
            const service = await server.getPrimaryService(this.CYCLING_SPEED_CADENCE_SERVICE);
            this.cscCharacteristic = await service.getCharacteristic(this.CSC_MEASUREMENT_CHARACTERISTIC);
            
            this.cscDevice.addEventListener('gattserverdisconnected', () => {
                console.log('CSC device disconnected');
                this.handleCSCDisconnection();
            });
            
            await this.cscCharacteristic.startNotifications();
            this.cscCharacteristic.addEventListener('characteristicvaluechanged',
                (event) => {
                    console.log('CSC data received');
                    this.handleCSCData(event);
                });
            
            return true;
        } catch (error) {
            console.error('Error connecting to speed/cadence sensor:', error);
            return false;
        }
    }

    handleCSCData(event) {
        try {
            const value = event.target.value;
            const flags = value.getUint8(0);
            
            const hasWheelData = flags & 0x01;
            const hasCrankData = flags & 0x02;
            
            let offset = 1;
            
            // Handle wheel data first if present
            if (hasWheelData) {
                const wheelRevolutions = value.getUint32(offset, true);
                offset += 4;
                const wheelEventTime = value.getUint16(offset, true);
                offset += 2;
                
                if (this.onSpeedUpdate) {
                    this.onSpeedUpdate(wheelRevolutions, wheelEventTime);
                }
            }
            
            // Handle crank data
            if (hasCrankData) {
                const crankRevolutions = value.getUint16(offset, true);
                offset += 2;
                const crankEventTime = value.getUint16(offset, true);
                
                if (this.lastCrankRevolutions !== undefined) {
                    const revDiff = crankRevolutions - this.lastCrankRevolutions;
                    const timeDiff = crankEventTime - this.lastCrankEventTime;
                    
                    // Handle rollover
                    const adjustedTimeDiff = timeDiff > 0 ? timeDiff : 65536 + timeDiff;
                    
                    if (adjustedTimeDiff > 0) {
                        // Calculate cadence in RPM
                        const cadence = Math.round((revDiff * 60 * 1024) / adjustedTimeDiff);
                        
                        if (this.onCadenceUpdate) {
                            this.onCadenceUpdate(cadence);
                        }
                    }
                }
                
                this.lastCrankRevolutions = crankRevolutions;
                this.lastCrankEventTime = crankEventTime;
            }
        } catch (error) {
            console.error('Error parsing CSC data:', error);
        }
    }

    handlePowerData(event) {
        try {
            const value = event.target.value;
            console.log('Raw data received:', value);
            
            const bytes = new Uint8Array(value.buffer);
            console.log('Data bytes:', Array.from(bytes));
            
            const flags = value.getUint16(0, true);
            console.log('Flags:', flags.toString(2));
            
            const power = value.getUint16(2, true);
            console.log('Parsed power:', power);
            
            if (this.onPowerUpdate) {
                console.log('Calling power update with:', power);
                this.onPowerUpdate(power);
            } else {
                console.warn('No power update callback set');
            }
        } catch (error) {
            console.error('Error parsing power data:', error, error.stack);
        }
    }

    disconnect() {
        if (this.device && this.device.gatt.connected) {
            this.device.gatt.disconnect();
            this.isConnected = false;
        }
    }

    handleDisconnection() {
        console.log('Handling disconnection');
        this.isConnected = false;
        this.characteristic = null;
        
        // Attempt to reconnect
        this.reconnect();
    }

    async reconnect() {
        try {
            if (this.device && !this.isConnected) {
                await this.device.gatt.connect();
                this.isConnected = true;
                console.log('Reconnected successfully');
            }
        } catch (error) {
            console.error('Reconnection failed:', error);
        }
    }

    async handleCSCDisconnection() {
        try {
            if (this.cscDevice && !this.cscDevice.gatt.connected) {
                await this.cscDevice.gatt.connect();
                const service = await this.cscDevice.gatt.getPrimaryService(this.CYCLING_SPEED_CADENCE_SERVICE);
                this.cscCharacteristic = await service.getCharacteristic(this.CSC_MEASUREMENT_CHARACTERISTIC);
                await this.cscCharacteristic.startNotifications();
                this.cscCharacteristic.addEventListener('characteristicvaluechanged',
                    (event) => this.handleCSCData(event));
                console.log('CSC device reconnected');
            }
        } catch (error) {
            console.error('CSC reconnection failed:', error);
        }
    }
}
