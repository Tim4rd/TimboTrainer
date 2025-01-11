function generateTCX(workout) {
    const startTime = new Date(workout.startTime);
    const duration = workout.duration / 1000; // Convert milliseconds to seconds

    const tcxHeader = `<?xml version="1.0" encoding="UTF-8"?>
<TrainingCenterDatabase xmlns="http://www.garmin.com/xmlschemas/TrainingCenterDatabase/v2">
  <Activities>
    <Activity Sport="Cycling">
      <Id>${startTime.toISOString()}</Id>
      <Lap StartTime="${startTime.toISOString()}">
        <TotalTimeSeconds>${duration}</TotalTimeSeconds>
        <Intensity>Active</Intensity>
        <TriggerMethod>Manual</TriggerMethod>
        <Track>`;

    const trackpoints = workout.data.timestamps.map((timestamp, index) => `
          <Trackpoint>
            <Time>${new Date(startTime.getTime() + timestamp).toISOString()}</Time>
            <HeartRateBpm>${workout.data.heartRate[index]}</HeartRateBpm>
            <Extensions>
              <TPX xmlns="http://www.garmin.com/xmlschemas/ActivityExtension/v2">
                <Watts>${workout.data.power[index]}</Watts>
                <Cadence>${workout.data.cadence[index]}</Cadence>
              </TPX>
            </Extensions>
          </Trackpoint>`).join('');

    const tcxFooter = `
        </Track>
      </Lap>
    </Activity>
  </Activities>
</TrainingCenterDatabase>`;

    return tcxHeader + trackpoints + tcxFooter;
}

function downloadTCX(workout) {
    const tcxContent = generateTCX(workout);
    const blob = new Blob([tcxContent], { type: 'application/tcx+xml' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `workout-${new Date(workout.startTime).toISOString().split('.')[0].replace(/:/g, '-')}.tcx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Example usage in WorkoutRecorder class
class WorkoutRecorder {
    // ... existing methods ...

    stopRecording() {
        if (!this.recording) return;
        
        this.recording = false;
        console.log('Stopped recording workout');
        
        const workout = {
            startTime: new Date(this.startTime).toISOString(),
            duration: this.data.timestamps[this.data.timestamps.length - 1],
            data: this.data
        };

        // Original JSON download
        const jsonBlob = new Blob([JSON.stringify(workout, null, 2)], { type: 'application/json' });
        const jsonUrl = URL.createObjectURL(jsonBlob);
        
        const jsonA = document.createElement('a');
        jsonA.href = jsonUrl;
        jsonA.download = `workout-${new Date(this.startTime).toISOString().split('.')[0].replace(/:/g, '-')}.json`;
        document.body.appendChild(jsonA);
        jsonA.click();
        document.body.removeChild(jsonA);
        URL.revokeObjectURL(jsonUrl);

        // New TCX download
        downloadTCX(workout);

        return workout;
    }
}
