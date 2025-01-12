class WorkoutRecorder {
    constructor() {
        this.recording = false;
        this.startTime = null;
        this.data = {
            power: [],
            heartRate: [],
            cadence: [],
            timestamps: [],
            speed: [],
            distance: []
        };
    }

    startRecording() {
        this.recording = true;
        this.startTime = Date.now();
        this.data = {
            timestamps: [],
            power: [],
            heartRate: [],
            cadence: [],
            speed: [],
            distance: []
        };
        console.log('Started recording workout');
    }

    addDataPoint(power, heartRate, cadence, speed, distance) {
        if (!this.recording) return;
        
        const timestamp = Date.now() - this.startTime;
        this.data.timestamps.push(timestamp);
        this.data.power.push(power);
        this.data.heartRate.push(heartRate);
        this.data.cadence.push(cadence);
        this.data.speed.push(speed);
        this.data.distance.push(distance);
    }

    stopRecording() {
        if (!this.recording) return;
        
        this.recording = false;
        console.log('Stopped recording workout');
        
        const workout = {
            startTime: new Date(this.startTime).toISOString(),
            duration: this.data.timestamps[this.data.timestamps.length - 1],
            data: this.data
        };

        // Create and download TCX file
        downloadTCX(workout);

        return workout;
    }

    isRecording() {
        return this.recording;
    }
}