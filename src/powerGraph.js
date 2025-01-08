class PowerGraph {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.data = [];
        this.maxPoints = 300;
        this.maxPower = 500;
        this.powerHistory = [];
        this.averages = {
            '3s': 0,
            '5s': 0,
            '1min': 0,
            '5min': 0
        };

        // Define power zones (in watts)
        this.powerZones = {
            easy: { min: 0, max: 150, color: '#2196F3' },      // Blue
            moderate: { min: 150, max: 250, color: '#4CAF50' }, // Green
            hard: { min: 250, max: 350, color: '#FF9800' },     // Orange
            max: { min: 350, max: 500, color: '#F44336' }       // Red
        };
        
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
    }
    
    resizeCanvas() {
        const scale = window.devicePixelRatio;
        this.canvas.width = this.canvas.offsetWidth * scale;
        this.canvas.height = this.canvas.offsetHeight * scale;
        this.ctx.scale(scale, scale);
        this.canvas.style.width = this.canvas.offsetWidth + 'px';
        this.canvas.style.height = this.canvas.offsetHeight + 'px';
    }

    addPowerPoint(power) {
        const timestamp = Date.now();
        this.data.push(power);
        this.powerHistory.push({ power, timestamp });
        
        if (this.data.length > this.maxPoints) {
            this.data.shift();
        }
        
        this.updateAverages();
        this.draw();
    }

    updateAverages() {
        const now = Date.now();
        this.powerHistory = this.powerHistory.filter(p => 
            now - p.timestamp <= 5 * 60 * 1000);
        
        this.averages = {
            '3s': this.calculateAverage(3),
            '5s': this.calculateAverage(5),
            '1min': this.calculateAverage(60),
            '5min': this.calculateAverage(300)
        };
        console.log('Averages:', this.averages); // Add this line
    }

    calculateAverage(seconds) {
        const now = Date.now();
        const cutoff = now - seconds * 1000;
        const relevantData = this.powerHistory.filter(p => p.timestamp >= cutoff);
        if (relevantData.length === 0) return 0;
        const sum = relevantData.reduce((acc, p) => acc + p.power, 0);
        return sum / relevantData.length;
    }

    addPowerPoint(power) {
        const timestamp = Date.now();
        this.data.push(power);
        this.powerHistory.push({ power, timestamp });
        
        if (this.data.length > this.maxPoints) {
            this.data.shift();
        }
        
        this.updateAverages();
        this.draw();
        console.log('Power History:', this.powerHistory); // Add this line
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw power zones
        for (const zoneName in this.powerZones) {
            const zone = this.powerZones[zoneName];
            const y1 = this.canvas.height - (zone.min / this.maxPower * this.canvas.height);
            const y2 = this.canvas.height - (zone.max / this.maxPower * this.canvas.height);
            this.ctx.fillStyle = zone.color;
            this.ctx.fillRect(0, y2, this.canvas.width, y1 - y2);
        }

        // Draw the power line graph
        this.ctx.beginPath();
        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 2;
        if (this.data.length > 0) {
            const xIncrement = this.canvas.width / (this.data.length - 1);
            this.data.forEach((power, index) => {
                const x = index * xIncrement;
                const y = this.canvas.height - (power / this.maxPower * this.canvas.height);
                if (index === 0) {
                    this.ctx.moveTo(x, y);
                } else {
                    this.ctx.lineTo(x, y);
                }
            });
            this.ctx.stroke();
        }
        
        // Draw y-axis labels
        this.ctx.fillStyle = '#000';
        this.ctx.textAlign = 'right';
        for (let i = 0; i <= this.maxPower; i += 50) {
            const y = this.canvas.height - (i / this.maxPower * this.canvas.height);
            this.ctx.fillText(`${i}W`, 25, y);
        }
    }
}