class StructuredWorkout {
    constructor() {
        this.segments = [];
        this.currentSegmentIndex = 0;
        this.timeInSegment = 0;
        this.isRunning = false;
        this.startTime = null;
        this.segmentStartTime = null;
        this.totalElapsedTime = 0;
    }

    warmup(minutes, watts) {
        this.segments.push({
            type: 'warmup',
            duration: minutes * 60,
            power: watts
        });
        return this;
    }

    interval(repeats, workPower, workMinutes, restPower, restMinutes) {
        for (let i = 0; i < repeats; i++) {
            this.segments.push({
                type: 'work',
                duration: workMinutes * 60,
                power: workPower
            });
            this.segments.push({
                type: 'rest',
                duration: restMinutes * 60,
                power: restPower
            });
        }
        return this;
    }

    ramp(minutes, startWatts, endWatts) {
        this.segments.push({
            type: 'ramp',
            duration: minutes * 60,
            startPower: startWatts,
            endPower: endWatts
        });
        return this;
    }

    cooldown(minutes, watts) {
        this.segments.push({
            type: 'cooldown',
            duration: minutes * 60,
            power: watts
        });
        return this;
    }

    start() {
        if (this.segments.length === 0) {
            console.log('No segments to start');
            return;
        }
        this.isRunning = true;
        this.startTime = Date.now();
        this.segmentStartTime = this.startTime;
        this.currentSegmentIndex = 0;
        this.totalElapsedTime = 0;
        this.timeInSegment = 0;
        console.log('Workout started');
    }

    pause() {
        if (!this.isRunning) return;
        this.isRunning = false;
        const now = Date.now();
        this.totalElapsedTime += (now - this.startTime) / 1000;
        this.timeInSegment += (now - this.segmentStartTime) / 1000;
        console.log('Workout paused');
    }
    
    resume() {
        if (this.isRunning) return;
        this.isRunning = true;
        const now = Date.now();
        this.startTime = now; // Reset start time to now
        this.segmentStartTime = now - this.timeInSegment * 1000; // Adjust segment start time
        console.log('Workout resumed');
    }

    getCurrentTarget() {
        if (!this.isRunning || this.currentSegmentIndex >= this.segments.length) {
            return null;
        }
    
        const segment = this.segments[this.currentSegmentIndex];
        return segment.power;
    }

    update() {
        if (!this.isRunning) return;
    
        const now = Date.now();
        this.totalElapsedTime = (now - this.startTime) / 1000;
    
        // Calculate which segment we're in
        let accumulatedTime = 0;
        for (let i = 0; i < this.segments.length; i++) {
            if (this.totalElapsedTime < accumulatedTime + this.segments[i].duration) {
                if (this.currentSegmentIndex !== i) {
                    this.currentSegmentIndex = i;
                    this.segmentStartTime = now - (this.totalElapsedTime - accumulatedTime) * 1000; // Update segment start time
                }
                this.timeInSegment = this.totalElapsedTime - accumulatedTime;
                break;
            }
            accumulatedTime += this.segments[i].duration;
        }
    
        return this.getCurrentTarget();
    }

    getTotalDuration() {
        return this.segments.reduce((total, segment) => total + segment.duration, 0);
    }

    getProgress() {
        return {
            totalProgress: this.totalElapsedTime / this.getTotalDuration(),
            segmentProgress: this.timeInSegment / this.segments[this.currentSegmentIndex].duration,
            currentSegment: this.currentSegmentIndex,
            segmentType: this.segments[this.currentSegmentIndex].type
        };
    }


    getCurrentSegment() {
        if (!this.isRunning || this.segments.length === 0) {
            
            return null;
        }
      
        return this.segments[this.currentSegmentIndex];
    }

    getCurrentSegmentElapsed() {
        if (!this.isRunning) return 0;
        return (Date.now() - this.segmentStartTime) / 1000;
    }
    getCurrentTarget() {
        const currentSegment = this.getCurrentSegment();
        if (currentSegment) {
            return currentSegment.power;
        }
        return null;
    }

}
