class WorkoutDisplay {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.workout = null;
    }

    setWorkout(workout) {
        this.workout = workout;
        this.drawWorkoutPlan();
  }
    drawWorkoutPlan() {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        if (!this.workout) return;

        const totalDuration = this.workout.getTotalDuration();
        const pixelsPerSecond = this.canvas.width / totalDuration;
        const maxPower = Math.max(...this.workout.segments.map(s => s.power || s.endPower || 0));
        const pixelsPerWatt = this.canvas.height / maxPower;

        let x = 0;
        this.workout.segments.forEach(segment => {
            const width = segment.duration * pixelsPerSecond;
              
            switch(segment.type) {
                case 'warmup':
                case 'cooldown':
                case 'work':
                case 'rest':
                    ctx.fillStyle = this.getSegmentColor(segment.type);
                    const height = segment.power * pixelsPerWatt;
                    ctx.fillRect(x, this.canvas.height - height, width, height);
                    
                    
                    
                    // Add power and time labels inside the bar
                    ctx.fillStyle = '#fff';
                    ctx.font = '14px Arial';
                    ctx.textAlign = 'center';
                    ctx.fillText(`${segment.power}W`, x + width/2, this.canvas.height - height/2 - 10);
                    ctx.fillText(`${Math.round(segment.duration/60)}min`, x + width/2, this.canvas.height - height/2 + 10);
                    break;
                      
                case 'ramp':
                    this.drawRamp(x, width, segment.startPower, segment.endPower, pixelsPerWatt);
                    ctx.fillStyle = '#fff';
                    ctx.font = '14px Arial';
                    ctx.textAlign = 'center';
                    const avgHeight = ((segment.startPower + segment.endPower)/2) * pixelsPerWatt;
                    ctx.fillText(`${segment.startPower}W → ${segment.endPower}W`, x + width/2, this.canvas.height - avgHeight/2 - 10);
                    ctx.fillText(`${Math.round(segment.duration/60)}min`, x + width/2, this.canvas.height - avgHeight/2 + 10);
                    break;
            }
            x += width;
        });
    }    getSegmentColor(type) {
        const colors = {
            warmup: '#4CAF50',
            work: '#F44336',
            rest: '#2196F3',
            cooldown: '#9C27B0',
            ramp: '#FF9800'
        };
        return colors[type] || '#666666';
    }

    drawRamp(x, width, startPower, endPower, pixelsPerWatt) {
        const ctx = this.ctx;
        ctx.beginPath();
        ctx.moveTo(x, this.canvas.height - startPower * pixelsPerWatt);
        ctx.lineTo(x + width, this.canvas.height - endPower * pixelsPerWatt);
        ctx.strokeStyle = this.getSegmentColor('ramp');
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    updateProgress() {
        if (!this.workout || !this.workout.isRunning) return;
        
        const progress = this.workout.getProgress();
        // Draw progress indicator
        const x = this.canvas.width * progress.totalProgress;
        this.ctx.beginPath();
        this.ctx.moveTo(x, 0);
        this.ctx.lineTo(x, this.canvas.height);
        this.ctx.strokeStyle = '#FFFFFF';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
    }
}
