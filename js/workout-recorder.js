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

        // Create and download TCX file
        this.downloadTCX(workout);

        return workout;
    }

    downloadJSON(workout) {
        const blob = new Blob([JSON.stringify(workout, null, 2)], { type: 'application/json' });
        this.downloadFile(blob, `workout-${new Date(this.startTime).toISOString().split('.')[0].replace(/:/g, '-')}.json`);
    }

    downloadTCX(workout) {
        const tcx = this.generateTCX(workout);
        const blob = new Blob([tcx], { type: 'application/vnd.garmin.tcx+xml' });
        this.downloadFile(blob, `workout-${new Date(this.startTime).toISOString().split('.')[0].replace(/:/g, '-')}.tcx`);
    }

    downloadFile(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    generateTCX(workout) {
        // This is a basic TCX generation. You might need to adjust it based on your specific requirements.
        let tcx = `<?xml version="1.0" encoding="UTF-8"?>
<TrainingCenterDatabase xmlns="http://www.garmin.com/xmlschemas/TrainingCenterDatabase/v2">
  <Activities>
    <Activity Sport="Biking">
      <Id>${workout.startTime}</Id>
      <Lap StartTime="${workout.startTime}">
        <TotalTimeSeconds>${workout.duration / 1000}</TotalTimeSeconds>
        <Intensity>Active</Intensity>
        <TriggerMethod>Manual</TriggerMethod>
        <Track>`;

        for (let i = 0; i < workout.data.timestamps.length; i++) {
            tcx += `
          <Trackpoint>
            <Time>${new Date(this.startTime + workout.data.timestamps[i]).toISOString()}</Time>
            <HeartRateBpm>
              <Value>${workout.data.heartRate[i]}</Value>
            </HeartRateBpm>
            <Cadence>${workout.data.cadence[i]}</Cadence>
            <Extensions>
              <TPX xmlns="http://www.garmin.com/xmlschemas/ActivityExtension/v2">
                <Watts>${workout.data.power[i]}</Watts>
              </TPX>
            </Extensions>
          </Trackpoint>`;
        }

        tcx += `
        </Track>
      </Lap>
    </Activity>
  </Activities>
</TrainingCenterDatabase>`;

        return tcx;
    }

    isRecording() {
        return this.recording;
    }
}