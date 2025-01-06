class BluetoothPowerMeter {
    constructor() {
        this.device = null;
        this.characteristic = null;
        this.onPowerUpdate = null;
        this.isConnected = false;
        this.lastPower = 0;
        
        // Bluetooth Constants
        this.CYCLING_POWER_SERVICE = 'cycling_power';
        this.POWER_MEASUREMENT_CHARACTERISTIC = 'cycling_power_measurement';
        this.POWER_FEATURE_CHARACTERISTIC = 'cycling_power_feature';
    }

    async connect() {
        try {
            this.device = await navigator.bluetooth.requestDevice({
                filters: [{ services: [this.CYCLING_POWER_SERVICE] }],
                optionalServices: ['device_information']
            });

            console.log('Device selected:', this.device.name);
            
            this.device.addEventListener('gattserverdisconnected', this.handleDisconnection.bind(this));
            
            const server = await this.device.gatt.connect();
            console.log('Connected to GATT server');

            const service = await server.getPrimaryService(this.CYCLING_POWER_SERVICE);
            console.log('Got cycling power service');

            // Get power measurement characteristic
            this.characteristic = await service.getCharacteristic(this.POWER_MEASUREMENT_CHARACTERISTIC);
            console.log('Got power measurement characteristic');

            // Start notifications
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

    handlePowerData(event) {
        try {
            const value = event.target.value;
            
            // Parse flags (first 16 bits)
            const flags = value.getUint16(0, true);
            
            // Check data format based on flags
            const hasCreankRevData = flags & 0x01;
            const hasCrankData = flags & 0x02;
            const hasAccumulatedEnergy = flags & 0x04;
            
            // Power is typically in bytes 2-3 (after flags)
            let powerOffset = 2;
            
            // Adjust offset based on optional fields
            if (hasCreankRevData) powerOffset += 2;
            if (hasCrankData) powerOffset += 4;
            if (hasAccumulatedEnergy) powerOffset += 2;
            
            // Get power value
            const power = value.getUint16(powerOffset, true);
            
            // Validate power reading
            if (this.isValidPowerReading(power)) {
                this.lastPower = power;
                if (this.onPowerUpdate) {
                    this.onPowerUpdate(power);
                }
            }
            
        } catch (error) {
            console.error('Error parsing power data:', error);
        }
    }

    isValidPowerReading(power) {
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
