// src/main.js
let totalDistance = 0;
let currentSpeed = 0;
let lastUpdateTime = Date.now();
const EFFICIENCY_FACTOR = 0.046; // 180W * 0.046 * 3.6 ≈ 30 km/hconst powerMeter = new BluetoothPowerMeter();
const workoutRecorder = new WorkoutRecorder();

// Wait for DOM to be fully loaded before initializing graph
document.addEventListener('DOMContentLoaded', () => {
    const powerMeter = new BluetoothPowerMeter();
    const powerGraph = new PowerGraph('powerGraph');
    const workoutRecorder = new WorkoutRecorder();
    const workoutDisplay = new WorkoutDisplay('workoutCanvas');

    // Create workout instance
    const workout = new StructuredWorkout()
        .warmup(10, 150)
        .interval(5, 200, 3, 150, 1)
        .cooldown(10, 130);

    workoutDisplay.setWorkout(workout);

    // Get button references
    const startWorkoutBtn = document.getElementById('startWorkoutBtn');
    const pauseWorkoutBtn = document.getElementById('pauseWorkoutBtn');

    // Add workout button handlers
    startWorkoutBtn.addEventListener('click', () => {
        workout.start();
        startWorkoutBtn.disabled = true;
        pauseWorkoutBtn.disabled = false;
        requestAnimationFrame(updateWorkout);
    });
   
    pauseWorkoutBtn.addEventListener('click', () => {
        if (workout.isRunning) {
            workout.pause();
            pauseWorkoutBtn.textContent = 'Resume Workout';
        } else {
            workout.resume();
            pauseWorkoutBtn.textContent = 'Pause Workout';
            requestAnimationFrame(updateWorkout);
        }
    });

    function updateWorkout() {
        if (workout.isRunning) {
            const targetPower = workout.update();
            if (targetPower !== null) {
                document.getElementById('targetPower').textContent = `Target: ${Math.round(targetPower)}W`;
                workoutDisplay.updateProgress();
                requestAnimationFrame(updateWorkout);
            }
        }
    }

    // Add these variables to track current values
    let currentPower = 0;
    let currentHeartRate = 0;
    let currentCadence = 0;

    // Add these variables to track running totals
    let powerTotal = 0;
    let heartRateTotal = 0;
    let cadenceTotal = 0;
    let dataPoints = 0;
        // Tune efficiency factor for 30 km/h at 180 watts
        const EFFICIENCY_FACTOR = 0.046; // 180W * 0.046 * 3.6 ≈ 30 km/h

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
                        currentSpeed = (power * EFFICIENCY_FACTOR) * 3.6;

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

// Create and set up workout
const workout = new StructuredWorkout()
    .warmup(10, 150)
    .interval(5, 200, 3, 150, 1)
    .cooldown(10, 130);

const workoutDisplay = new WorkoutDisplay('workoutCanvas');
workoutDisplay.setWorkout(workout);

// Make sure updateWorkout is called continuously
function updateWorkout() {
    if (workout.isRunning) {
        const targetPower = workout.update();
        if (targetPower !== null) {
            document.getElementById('targetPower').textContent = `Target: ${Math.round(targetPower)}W`;
            workoutDisplay.updateProgress();
            requestAnimationFrame(updateWorkout);
        }
    }
}
