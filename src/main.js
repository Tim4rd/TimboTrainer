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
