// src/main.js
const powerMeter = new BluetoothPowerMeter();

const graph = new PowerGraph('powerGraph');

document.addEventListener('DOMContentLoaded', () => {
    const powerMeter = new BluetoothPowerMeter();
    const powerGraph = new PowerGraph('powerGraph');

    document.getElementById('connectPowerBtn').addEventListener('click', async () => {
        const success = await powerMeter.connect();
        document.getElementById('status').textContent = 
            success ? 'Power meter connected!' : 'Connection failed';
    });

    document.getElementById('connectHRMBtn').addEventListener('click', async () => {
        const success = await powerMeter.connectHRM();
        document.getElementById('status').textContent = 
            success ? 'Heart rate monitor connected!' : 'HRM connection failed';
    });

    // Single onPowerUpdate handler
    powerMeter.onPowerUpdate = (power) => {
        document.getElementById('currentPower').textContent = `Current Power: ${power}W`;
        powerGraph.addPowerPoint(power);
        updateAveragesDisplay(powerGraph.averages);
    };

    powerMeter.onHeartRateUpdate = (heartRate) => {
        document.getElementById('heartRate').textContent = `Heart Rate: ${heartRate} BPM`;
    };

    // Add to existing code
    const cadenceDisplay = document.createElement('div');
    cadenceDisplay.id = 'cadence';
    document.querySelector('.container').appendChild(cadenceDisplay);

    powerMeter.onCadenceUpdate = (cadence) => {
        document.getElementById('cadence').textContent = `Cadence: ${cadence} RPM`;
    };
});
function updateAveragesDisplay(averages) {
    const avgContainer = document.getElementById('averages');
    if (!avgContainer) return;
    
    avgContainer.innerHTML = `
        <div class="average-box">3s: ${Math.round(averages['3s'])}W</div>
        <div class="average-box">5s: ${Math.round(averages['5s'])}W</div>
        <div class="average-box">1min: ${Math.round(averages['1min'])}W</div>
        <div class="average-box">5min: ${Math.round(averages['5min'])}W</div>
    `;
}
