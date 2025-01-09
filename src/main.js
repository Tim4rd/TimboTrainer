// src/main.js
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

    // Set up power callback
    powerMeter.onPowerUpdate = (power) => {
        currentPower = power;
        document.getElementById('currentPower').textContent = `Current Power: ${power}W`;
        powerGraph.addPowerPoint(power);
        updateAveragesDisplay(powerGraph.averages);
        if (workoutRecorder.recording) {
            workoutRecorder.addDataPoint(currentPower, currentHeartRate, currentCadence);
        }
    };

    powerMeter.onHeartRateUpdate = (heartRate) => {
        currentHeartRate = heartRate;
        document.getElementById('heartRate').textContent = `Heart Rate: ${heartRate} BPM`;
    };

    powerMeter.onCadenceUpdate = (cadence) => {
        console.log('Cadence update received:', cadence); // Debug log
        currentCadence = cadence;
        const cadenceElement = document.getElementById('cadence');
        if (cadenceElement) {
            cadenceElement.textContent = `Cadence: ${cadence} RPM`;
        } else {
            console.error('Cadence element not found');
        }
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
