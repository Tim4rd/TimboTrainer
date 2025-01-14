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

    drawWorkoutPlan(progressPosition = null) {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        if (!this.workout) return;

        const totalDuration = this.workout.getTotalDuration();
        const pixelsPerSecond = this.canvas.width / totalDuration;
        const maxPower = Math.max(...this.workout.segments.map(s => s.power || s.endPower || 0));
        const pixelsPerWatt = this.canvas.height / maxPower;

  // Draw workout segments first
let x = 0;
this.workout.segments.forEach(segment => {
    const width = segment.duration * pixelsPerSecond;
    const threshold = 50; // Adjust this threshold as needed

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
            ctx.textBaseline = 'middle';
            

            if (width < threshold) {
                // Rotate text for narrow bars
                ctx.save();
                ctx.translate(x + width / 2, this.canvas.height - height / 2);
                ctx.rotate(-Math.PI / 2);
                ctx.fillText(`${segment.power}W`, 0, -5); // Reduced gap
                ctx.fillText(`${Math.round(segment.duration / 60)}min`, 0, 5); // Reduced gap
                ctx.restore();
            } else {
                ctx.fillText(`${segment.power}W`, x + width / 2, this.canvas.height - height / 2 - 10); // Reduced gap
                ctx.fillText(`${Math.round(segment.duration / 60)}min`, x + width / 2, this.canvas.height - height / 2 + 5); // Reduced gap
                
            }
            break;
              
        case 'ramp':
            this.drawRamp(x, width, segment.startPower, segment.endPower, pixelsPerWatt);
            ctx.fillStyle = '#fff';
            ctx.font = '14px Arial';
            ctx.textAlign = 'center';
            
            const avgHeight = ((segment.startPower + segment.endPower) / 2) * pixelsPerWatt;

            if (width < threshold) {
                // Rotate text for narrow bars
                ctx.save();
                ctx.translate(x + width / 2, this.canvas.height - avgHeight / 2);
                ctx.rotate(-Math.PI / 2);
                ctx.fillText(`${segment.startPower}W -> ${segment.endPower}W`, 0, -7); // Adjusted for vertical centering
                ctx.fillText(`${Math.round(segment.duration / 60)}min`, 0, 7); // Adjusted for vertical centering
                ctx.restore();
            } else {
                ctx.fillText(`${segment.startPower}W -> ${segment.endPower}W`, x + width / 2, this.canvas.height - avgHeight / 2 - 8); // Adjusted for vertical centering
                ctx.fillText(`${Math.round(segment.duration / 60)}min`, x + width / 2, this.canvas.height - avgHeight / 2 + 8); // Adjusted for vertical centering
            }
            break;
    }
    x += width;
});

        // Draw progress overlay last, so it appears on top
        if (progressPosition !== null) {
            const progressWidth = this.canvas.width * progressPosition;
            ctx.fillStyle = 'rgba(0, 0, 139, 0.3)';  // Dark blue with opacity
            ctx.fillRect(0, 0, progressWidth, this.canvas.height);
        }
    }

    getSegmentColor(type) {
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
        const startY = this.canvas.height - startPower * pixelsPerWatt;
        const endY = this.canvas.height - endPower * pixelsPerWatt;
    
        // Create a gradient from startPower to endPower
        const gradient = ctx.createLinearGradient(x, startY, x, endY);
        gradient.addColorStop(0, '#FF9800'); // Start color (orange)
        gradient.addColorStop(1, '#FF9800'); // End color (orange)
    
        // Fill the ramp area with the gradient
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.moveTo(x, startY);
        ctx.lineTo(x + width, endY);
        ctx.lineTo(x + width, this.canvas.height);
        ctx.lineTo(x, this.canvas.height);
        ctx.closePath();
        ctx.fill();
    
        // Draw the outline of the ramp
        ctx.strokeStyle = this.getSegmentColor('ramp');
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    updateProgress() {
        if (!this.workout || !this.workout.isRunning) return;
        
        const progress = this.workout.getProgress();
        // Redraw entire workout plan with progress overlay
        this.drawWorkoutPlan(progress.totalProgress);
    }
}