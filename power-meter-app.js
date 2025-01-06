// File structure:
/*
/cycling-power-app
  ├── index.html
  ├── style.css
  ├── src/
  │   ├── main.js
  │   ├── bluetooth.js
  │   └── powerGraph.js
*/

// index.html
<!DOCTYPE html>
<html>
<head>
    <title>Cycling Power Meter</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <div class="container">
        <button id="connectBtn">Connect Power Meter</button>
        <div id="status"></div>
        <canvas id="powerGraph"></canvas>
        <div id="currentPower">Current Power: -- W</div>
    </div>
    <script src="src/bluetooth.js"></script>
    <script src="src/powerGraph.js"></script>
    <script src="src/main.js"></script>
</body>
</html>

// style.css
.container {
    max-width: 800px;
    margin: 20px auto;
    padding: 20px;
}

#powerGraph {
    width: 100%;
    height: 400px;
    border: 1px solid #ccc;
}

#status {
    margin: 10px 0;
    color: #666;
}

// src/bluetooth.js
class BluetoothPowerMeter {
    constructor() {
        this.device = null;
        this.characteristic = null;
        this.onPowerUpdate = null;
    }

    async connect() {
        try {
            this.device = await navigator.bluetooth.requestDevice({
                filters: [{ services: ['cycling_power'] }]
            });

            const server = await this.device.gatt.connect();
            const service = await server.getPrimaryService('cycling_power');
            this.characteristic = await service.getCharacteristic('cycling_power_measurement');
            
            await this.characteristic.startNotifications();
            this.characteristic.addEventListener('characteristicvaluechanged',
                this.handlePowerData.bind(this));
            
            return true;
        } catch (error) {
            console.error('Bluetooth Error:', error);
            return false;
        }
    }

    handlePowerData(event) {
        const value = event.target.value;
        // Power is in the first 2 bytes, little-endian
        const power = value.getUint16(0, true);
        
        if (this.onPowerUpdate) {
            this.onPowerUpdate(power);
        }
    }

    disconnect() {
        if (this.device && this.device.gatt.connected) {
            this.device.gatt.disconnect();
        }
    }
}

// src/powerGraph.js
class PowerGraph {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.data = [];
        this.maxPoints = 100;
        this.maxPower = 1000;
    }

    addPowerPoint(power) {
        this.data.push(power);
        if (this.data.length > this.maxPoints) {
            this.data.shift();
        }
        this.draw();
    }

    draw() {
        const ctx = this.ctx;
        const width = this.canvas.width;
        const height = this.canvas.height;

        ctx.clearRect(0, 0, width, height);
        
        ctx.beginPath();
        ctx.strokeStyle = '#2196F3';
        ctx.lineWidth = 2;

        const pointWidth = width / this.maxPoints;
        
        this.data.forEach((power, index) => {
            const x = index * pointWidth;
            const y = height - (power / this.maxPower * height);
            
            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });

        ctx.stroke();
    }
}

// src/main.js
const powerMeter = new BluetoothPowerMeter();
const graph = new PowerGraph('powerGraph');
const statusDiv = document.getElementById('status');
const currentPowerDiv = document.getElementById('currentPower');
const connectBtn = document.getElementById('connectBtn');

connectBtn.addEventListener('click', async () => {
    statusDiv.textContent = 'Connecting...';
    const connected = await powerMeter.connect();
    
    if (connected) {
        statusDiv.textContent = 'Connected';
        powerMeter.onPowerUpdate = (power) => {
            currentPowerDiv.textContent = `Current Power: ${power}W`;
            graph.addPowerPoint(power);
        };
    } else {
        statusDiv.textContent = 'Connection failed';
    }
});

window.addEventListener('unload', () => {
    powerMeter.disconnect();
});
