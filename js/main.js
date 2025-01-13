// src/main.js
let totalDistance = 0;
let currentSpeed = 0;
let lastUpdateTime = Date.now();
const EFFICIENCY_FACTOR = 0.00029; // This can be tuned based on testing
const powerMeter = new BluetoothPowerMeter();
const workoutRecorder = new WorkoutRecorder();

// Wait for DOM to be fully loaded before initializing graph
document.addEventListener('DOMContentLoaded', () => {
    const powerMeter = new BluetoothPowerMeter();
    const powerGraph = new PowerGraph('powerGraph');
    const workoutRecorder = new WorkoutRecorder();

    // Add these variables to track current values
    let currentPower = 0;
    let currentHeartRate = 0;
    let currentCadence = 0;

    // Add these variables to track running totals
    let powerTotal = 0;
    let heartRateTotal = 0;
    let cadenceTotal = 0;
    let dataPoints = 0;
        // Replace the existing EFFICIENCY_FACTOR constant with these values
        const BASE_EFFICIENCY = 0.15;  // Tune this to get desired speed at reference power
        const REFERENCE_POWER = 180;   // Reference power (180W should give ~30km/h)

                // Set up power callback
                                powerMeter.onPowerUpdate = (power) => {
                    currentPower = power;
                    document.getElementById('currentPower').textContent = `${power}W`;
                    powerGraph.addPowerPoint(power);
                          if (currentSpeed > 0) {
                              document.querySelector('.fa-road').classList.add('connected');
                          } else {
                              document.querySelector('.fa-road').classList.remove('connected');
                          }
                    // Update running averages
                    powerTotal += power;
                    dataPoints++;
                    document.getElementById('avgPower').textContent = `${Math.round(powerTotal / dataPoints)}W`;

                    // Update averages display
                    updateAveragesDisplay(powerGraph.averages);

                    // Calculate distance and speed only when power is being produced
                    if (power > 0) {
                        const currentTime = Date.now();
                        const timeDelta = (currentTime - lastUpdateTime) / 1000;

                        // Calculate speed (will now give ~30 km/h at 180 watts)
                        currentSpeed = Math.sqrt(power / REFERENCE_POWER) * (REFERENCE_POWER * BASE_EFFICIENCY);

                        // Calculate distance increment
                        const distanceIncrement = (currentSpeed / 3600) * timeDelta;
                        totalDistance += distanceIncrement;

                        // Force display updates
                        requestAnimationFrame(() => {
                            document.getElementById('distance').textContent = `${totalDistance.toFixed(2)} km`;
                            document.getElementById('speed').textContent = `${currentSpeed.toFixed(1)} km/h`;
                        });

                        lastUpdateTime = currentTime;
                    } else {
                        currentSpeed = 0;
                        document.getElementById('speed').textContent = '0.0 km/h';
                    }

                    if (workoutRecorder.recording) {
                        workoutRecorder.addDataPoint(currentPower, currentHeartRate, currentCadence, currentSpeed, totalDistance);
                    }
};
    powerMeter.onHeartRateUpdate = (heartRate) => {
        currentHeartRate = heartRate;
        document.getElementById('heartRate').textContent = `${heartRate} BPM`;
        
        // Update running average
        heartRateTotal += heartRate;
        document.getElementById('avgHeartRate').textContent = 
            `${Math.round(heartRateTotal / dataPoints)} BPM`;
    };

    powerMeter.onCadenceUpdate = (cadence) => {
        currentCadence = cadence;
        document.getElementById('cadence').textContent = `${cadence} RPM`;
        
        // Update running average
        cadenceTotal += cadence;
        document.getElementById('avgCadence').textContent = 
            `${Math.round(cadenceTotal / dataPoints)} RPM`;
    };

    // Add recording controls
    const startRecordingBtn = document.getElementById('startRecordingBtn');
    const stopRecordingBtn = document.getElementById('stopRecordingBtn');

    startRecordingBtn.addEventListener('click', () => {
        workoutRecorder.startRecording();
        startRecordingBtn.disabled = true;
        stopRecordingBtn.disabled = false;
        startRecordingBtn.textContent = 'Recording...';
    });

    stopRecordingBtn.addEventListener('click', () => {
        const workout = workoutRecorder.stopRecording();
        startRecordingBtn.disabled = false;
        stopRecordingBtn.disabled = true;
        startRecordingBtn.textContent = 'Start Recording';
        console.log('Workout saved:', workout);
    });

    // Connect power meter
    document.getElementById('connectBtn').addEventListener('click', async () => {
        try {
            const success = await powerMeter.connect();
            if (success) {
                resetAverages();  // Reset when connecting
                document.querySelector('.fa-bolt').classList.add('connected');
                document.getElementById('connectBtn').classList.add('connected');
            }
        } catch (error) {
            console.error('Error connecting to power meter:', error);
        }
    });

    // Connect heart rate monitor
    document.getElementById('connectHRButton').addEventListener('click', async () => {
        try {
            const success = await powerMeter.connectHRM();
            if (success) {
                document.querySelector('.fa-heart').classList.add('connected');
                document.getElementById('connectHRButton').classList.add('connected');
            }
        } catch (error) {
            console.error('Error connecting to heart rate monitor:', error);
        }
    });

    // Connect speed/cadence sensor
    document.getElementById('connectCSCButton').addEventListener('click', async () => {
        try {
            const success = await powerMeter.connectCSC();
            if (success) {
                document.querySelector('.fa-bicycle').classList.add('connected');
                document.getElementById('connectCSCButton').classList.add('connected');
            }
        } catch (error) {
            console.error('Error connecting to CSC:', error);
        }
    });
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

// Reset function for when starting a new session
function resetAverages() {
    powerTotal = 0;
    heartRateTotal = 0;
    cadenceTotal = 0;
    dataPoints = 0;
    totalDistance = 0;
    currentSpeed = 0;
    lastUpdateTime = Date.now();
    document.getElementById('distance').textContent = '0.00 km';
    document.getElementById('speed').textContent = '0.0 km/h';
}

if (currentPower > 0 && currentCadence > 0) {
    document.querySelector('.fa-road').classList.add('connected');
}
