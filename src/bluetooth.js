class BluetoothPowerMeter {
    constructor() {
        // Original working power meter properties
        this.device = null;
        this.characteristic = null;
        this.onPowerUpdate = null;
        this.isConnected = false;
        this.lastPower = 0;
        
        // Add HR properties
        this.hrDevice = null;
        this.hrCharacteristic = null;
        this.onHeartRateUpdate = null;
        this.lastHeartRate = 0;
        
        // Original working constants
        this.CYCLING_POWER_SERVICE = 'cycling_power';
        this.POWER_MEASUREMENT_CHARACTERISTIC = 'cycling_power_measurement';
        this.POWER_FEATURE_CHARACTERISTIC = 'cycling_power_feature';
    }

    // Keep the original working power meter connect method
    async connect() {
        try {
            this.device = await navigator.bluetooth.requestDevice({
                filters: [{ services: [this.CYCLING_POWER_SERVICE] }],
                optionalServices: ['device_information']
            });

            console.log('Device selected:', this.device.name);
            
            this.device.addEventListener('gattserverdisconnected', this.handleDisconnection.bind(this));
            
            const server = await this.device.gatt.connect();
            const service = await server.getPrimaryService(this.CYCLING_POWER_SERVICE);
            this.characteristic = await service.getCharacteristic(this.POWER_MEASUREMENT_CHARACTERISTIC);
            
            await this.characteristic.startNotifications();
            this.characteristic.addEventListener('characteristicvaluechanged',
                this.handlePowerData.bind(this));
            
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
                this.handleHeartRateData.bind(this));
            
            return true;
        } catch (error) {
            console.error('HRM connection error:', error);
            return false;
        }
    }

    handleHeartRateData(event) {
        const value = event.target.value;
        const heartRate = value.getUint8(1);
        if (this.onHeartRateUpdate) {
            this.onHeartRateUpdate(heartRate);
        }
    }

    handlePowerData(event) {
        try {
            const value = event.target.value;
            const flags = value.getUint16(0, true);
            
            // Add console log to check flags
            console.log('Power Data Flags:', flags.toString(2));
            
            // Check for crank data flag (bit 1)
            const hasCrankData = flags & 0x02;
            console.log('Has Crank Data:', hasCrankData);
            
            // Get power value
            const power = value.getUint16(2, true);
            
            if (this.isValidPowerReading(power)) {
                this.lastPower = power;
                if (this.onPowerUpdate) {
                    this.onPowerUpdate(power);
                }
            }
            
            // Enhanced cadence parsing
            if (hasCrankData) {
                const crankRevs = value.getUint16(4, true);
                const crankTime = value.getUint16(6, true);
                console.log('Crank Data:', { revs: crankRevs, time: crankTime });
                
                const cadence = this.calculateCadence(crankRevs, crankTime);
                console.log('Calculated Cadence:', cadence);
                
                if (cadence > 0) {
                    this.lastCadence = cadence;
                    if (this.onCadenceUpdate) {
                        this.onCadenceUpdate(cadence);
                    }
                }
            }
        } catch (error) {
            console.error('Error parsing power/cadence data:', error);
        }
    }

    calculateCadence(revs, time) {
        // Basic cadence calculation
        // Note: This is a simplified version, you might need to adjust based on your specific power meter
        return revs > 0 ? Math.round((revs / time) * 60) : 0;
    }    isValidPowerReading(power) {
        // Basic validation rules
        const MAX_POWER = 3000; // Reasonable maximum human power output
        const MAX_POWER_CHANGE = 500; // Max reasonable power change between readings
        
        if (power < 0 || power > MAX_POWER) {
            return false;
        }
        
        // Check for unrealistic jumps in power
        if (this.lastPower > 0) {
            const powerChange = Math.abs(power - this.lastPower);
            if (powerChange > MAX_POWER_CHANGE) {
                return false;
            }
        }
        
        return true;
    }

    isValidHeartRate(heartRate) {
        const MAX_HEART_RATE = 250;
        const MIN_HEART_RATE = 30;
        return heartRate >= MIN_HEART_RATE && heartRate <= MAX_HEART_RATE;
    }

    setHeartRateCallback(callback) {
        this.onHeartRateUpdate = callback;
    }

    getLastHeartRate() {
        return this.lastHeartRate;
    }

    handleDisconnection() {
        console.log('Device disconnected');
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

    disconnect() {
        if (this.device && this.device.gatt.connected) {
            this.device.gatt.disconnect();
            this.isConnected = false;
        }
    }

    getConnectionStatus() {
        return this.isConnected;
    }
}