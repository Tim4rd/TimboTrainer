class StructuredWorkout {
    constructor() {
        this.segments = [];
        this.currentSegment = 0;
        this.timeInSegment = 0;
        this.isRunning = false;
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
        this.isRunning = true;
        this.startTime = Date.now();
        this.currentSegment = 0;
        this.timeInSegment = 0;
    }

    pause() {
        this.isRunning = false;
    }

    resume() {
        this.isRunning = true;
        this.startTime = Date.now() - this.totalElapsedTime * 1000;
    }

    getCurrentTarget() {
        if (!this.isRunning || this.currentSegment >= this.segments.length) {
            return null;
        }

        const segment = this.segments[this.currentSegment];
        
        if (segment.type === 'ramp') {
            const progress = this.timeInSegment / segment.duration;
            return segment.startPower + (segment.endPower - segment.startPower) * progress;
        }
        
        return segment.power;
    }

    update() {
        if (!this.isRunning) return;

        const now = Date.now();
        this.totalElapsedTime = (now - this.startTime) / 1000;
        this.timeInSegment = this.totalElapsedTime;

        // Calculate which segment we're in
        let accumulatedTime = 0;
        for (let i = 0; i < this.segments.length; i++) {
            if (this.totalElapsedTime < accumulatedTime + this.segments[i].duration) {
                this.currentSegment = i;
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
            segmentProgress: this.timeInSegment / this.segments[this.currentSegment].duration,
            currentSegment: this.currentSegment,
            segmentType: this.segments[this.currentSegment].type
        };
    }
}
