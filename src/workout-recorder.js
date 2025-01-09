class WorkoutRecorder {
    constructor() {
        this.recording = false;
        this.startTime = null;
        this.data = {
            power: [],
            heartRate: [],
            cadence: [],
            timestamps: []
        };
    }

    startRecording() {
        this.recording = true;
        this.startTime = Date.now();
        this.data = {
            power: [],
            heartRate: [],
            cadence: [],
            timestamps: []
        };
        console.log('Started recording workout');
    }

    addDataPoint(power, heartRate, cadence) {
        if (!this.recording) return;
        
        const timestamp = Date.now() - this.startTime;
        this.data.timestamps.push(timestamp);
        this.data.power.push(power || 0);
        this.data.heartRate.push(heartRate || 0);
        this.data.cadence.push(cadence || 0);
    }

    stopRecording() {
        if (!this.recording) return;
        
        this.recording = false;
        console.log('Stopped recording workout');
        
        // Create the workout summary
        const workout = {
            startTime: new Date(this.startTime).toISOString(),
            duration: this.data.timestamps[this.data.timestamps.length - 1],
            data: this.data
        };

        // Create and download the file
        const blob = new Blob([JSON.stringify(workout, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `workout-${new Date(this.startTime).toISOString().split('.')[0].replace(/:/g, '-')}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        return workout;
    }

    isRecording() {
        return this.recording;
    }
} 