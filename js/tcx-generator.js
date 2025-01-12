function generateTCX(workout) {
      const startTime = new Date(workout.startTime);
      const duration = workout.duration / 1000;

      const tcxHeader = `<?xml version="1.0" encoding="UTF-8"?>
<TrainingCenterDatabase xmlns="http://www.garmin.com/xmlschemas/TrainingCenterDatabase/v2">
    <Activities>
      <Activity Sport="Biking">
        <Id>${startTime.toISOString()}</Id>
        <Notes>Virtual Cycling Session</Notes>
        <Lap StartTime="${startTime.toISOString()}">
          <TotalTimeSeconds>${duration}</TotalTimeSeconds>
          <DistanceMeters>${workout.data.distance[workout.data.distance.length - 1] * 1000}</DistanceMeters>
          <MaximumSpeed>${Math.max(...workout.data.speed) / 3.6}</MaximumSpeed>
          <Calories>0</Calories>
          <AverageHeartRateBpm>
              <Value>${Math.round(workout.data.heartRate.reduce((a, b) => a + b, 0) / workout.data.heartRate.length)}</Value>
          </AverageHeartRateBpm>
          <MaximumHeartRateBpm>
              <Value>${Math.max(...workout.data.heartRate)}</Value>
          </MaximumHeartRateBpm>
          <Intensity>Active</Intensity>
          <TriggerMethod>Manual</TriggerMethod>
          <Track>`;

      const trackpoints = workout.data.timestamps.map((timestamp, index) => `
            <Trackpoint>
              <Time>${new Date(startTime.getTime() + timestamp).toISOString()}</Time>
              <DistanceMeters>${workout.data.distance[index] * 1000}</DistanceMeters>
              <HeartRateBpm>
                  <Value>${workout.data.heartRate[index]}</Value>
              </HeartRateBpm>
              <Extensions>
                <TPX xmlns="http://www.garmin.com/xmlschemas/ActivityExtension/v2">
                  <Watts>${workout.data.power[index]}</Watts>
                  <Cadence>${workout.data.cadence[index]}</Cadence>
                  <Speed>${workout.data.speed[index] / 3.6}</Speed>
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


