// Global variables
let totalDistance = 0;
let currentSpeed = 0;
let lastUpdateTime = Date.now();
const EFFICIENCY_FACTOR = 0.046; // 180W * 0.046 * 3.6 ≈ 30 km/h

// Wait for DOM to be fully loaded before initializing
document.addEventListener('DOMContentLoaded', () => {
    // Create core objects
    const powerMeter = new BluetoothPowerMeter();
    const powerGraph = new PowerGraph('powerGraph');
    const workoutRecorder = new WorkoutRecorder();
    const workoutDisplay = new WorkoutDisplay('workoutCanvas');

    // Get workout dropdown reference
    const workoutDropdown = document.getElementById('workouts');
    
    // Initialize with default workout
    const defaultWorkout = new StructuredWorkout()

    

    
    workoutDisplay.setWorkout(defaultWorkout);
    let workout = defaultWorkout; // Keep track of current workout

    // Ensure the workoutCanvas is hidden initially
const workoutCanvas = document.getElementById('workoutCanvas');


    //Build function for library of workouts and drop down selector//
 // Define workout library
 const workoutLibrary = {
    'FreeRide': new StructuredWorkout()
        ,
    'SweetSpot': new StructuredWorkout()
        .warmup(10, 150)
        .interval(3, 250, 8, 150, 3)
        .cooldown(10, 150),
    'Ramp': new StructuredWorkout()
        .warmup(5, 150)
        .ramp(20, 150, 300)
        .cooldown(5, 150),
    'Endurance': new StructuredWorkout()
        .warmup(10, 120)
        .interval(1, 200, 40, 0, 0)
        .cooldown(10, 120),
'Test Workout': new StructuredWorkout()
        .warmup(5, 180)
        .interval(5, 230, 3, 150, 1)
        .ramp(5, 150, 250)
        .cooldown(10, 180),
};

// Populate the workout dropdown with options from the workoutLibrary
Object.keys(workoutLibrary).forEach(name => {
    const option = document.createElement('option');
    option.value = name;
    option.textContent = name;
    workoutDropdown.appendChild(option);
});

// Add a default empty option
const defaultOption = document.createElement('option');
defaultOption.value = '';
defaultOption.textContent = 'Select a workout';
defaultOption.selected = true;
defaultOption.disabled = true;
workoutDropdown.appendChild(defaultOption);

// Add change event listener to the workout dropdown
workoutDropdown.addEventListener('change', (event) => {
    const selectedWorkout = workoutLibrary[event.target.value];
    const workoutCanvas = document.getElementById('workoutCanvas');
    
    console.log('Selected workout:', event.target.value); // Debugging statement
    console.log('Selected workout object:', selectedWorkout); // Debugging statement
    
    if (selectedWorkout) {
        workoutDisplay.setWorkout(selectedWorkout);
        workout = selectedWorkout; // Update the current workout
        
        if (event.target.value === 'FreeRide') {
            workoutCanvas.classList.add('hidden'); // Hide the workout display
            console.log('Added hidden class'); // Debugging statement
        } else {
            workoutCanvas.classList.remove('hidden'); // Show the workout display
            console.log('Removed hidden class'); // Debugging statement
        }
        
        console.log('Hidden class status:', workoutCanvas.classList.contains('hidden')); // Log class status
    }
});

    
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

                const currentSegment = workout.getCurrentSegment();

                if (currentSegment && ['warmup', 'work', 'rest', 'ramp', 'cooldown'].includes(currentSegment.type)) {
                    const elapsed = workout.getCurrentSegmentElapsed();
                    const timeRemaining = Math.ceil(currentSegment.duration - elapsed);
                    const minutes = Math.floor(timeRemaining / 60);
                    const seconds = timeRemaining % 60;
                    const timeDisplay = `${minutes}:${seconds.toString().padStart(2, '0')}`;
                    document.getElementById('intTimeRemain').textContent = timeDisplay;
                } else {
                    document.getElementById('intTimeRemain').textContent = '--:--';
                }

                requestAnimationFrame(updateWorkout);
            }
        }
    }

    // Set up power callback
    powerMeter.onPowerUpdate = (power) => {
        document.getElementById('currentPower').textContent = `${power}W`;
        powerGraph.addPowerPoint(power);
        
        if (power > 0) {
            const currentTime = Date.now();
            const timeDelta = (currentTime - lastUpdateTime) / 1000;
            currentSpeed = (power * EFFICIENCY_FACTOR) * 3.6;
            const distanceIncrement = (currentSpeed / 3600) * timeDelta;
            totalDistance += distanceIncrement;

            document.getElementById('distance').textContent = `${totalDistance.toFixed(2)} km`;
            document.getElementById('speed').textContent = `${currentSpeed.toFixed(1)} km/h`;
            document.querySelector('.fa-road').classList.add('connected');

            lastUpdateTime = currentTime;
        } else {
            currentSpeed = 0;
            document.getElementById('speed').textContent = '0.0 km/h';
            document.querySelector('.fa-road').classList.remove('connected');
        }

        // Update averages display
        let currentPower = power;
        let powerTotal = 0;
        let dataPoints = 0;
        powerTotal += power;
        dataPoints++;
        document.getElementById('avgPower').textContent = `${Math.round(powerTotal / dataPoints)}W`;
        updateAveragesDisplay(powerGraph.averages);

        if (workoutRecorder.recording) {
            workoutRecorder.addDataPoint(currentPower, currentHeartRate, currentCadence, currentSpeed, totalDistance);
        }
    };

    // Heart rate updates
    let currentHeartRate = 0;
    let heartRateTotal = 0;
    powerMeter.onHeartRateUpdate = (heartRate) => {
        currentHeartRate = heartRate;
        document.getElementById('heartRate').textContent = `${heartRate} BPM`;
        heartRateTotal += heartRate;
        document.getElementById('avgHeartRate').textContent = 
            `${Math.round(heartRateTotal / dataPoints)} BPM`;
    };

    // Cadence updates
    let currentCadence = 0;
    let cadenceTotal = 0;
    powerMeter.onCadenceUpdate = (cadence) => {
        currentCadence = cadence;
        document.getElementById('cadence').textContent = `${cadence} RPM`;
        cadenceTotal += cadence;
        document.getElementById('avgCadence').textContent = 
            `${Math.round(cadenceTotal / dataPoints)} RPM`;
    };

    // Recording controls
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
                resetAverages();
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

