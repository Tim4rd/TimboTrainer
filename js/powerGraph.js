class PowerGraph {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            console.error('Could not find canvas element with id:', canvasId);
            return;
        }

        // Set initial canvas size
        this.canvas.width = 800;
        this.canvas.height = 400;

        this.ctx = this.canvas.getContext('2d');
        this.data = [];
        this.powerHistory = [];
        this.maxPoints = 300; // 5 minutes at one point per second
        this.maxPower = 500;  // Maximum power to display
        this.averages = {
            '3s': 0,
            '5s': 0,
            '1min': 0,
            '5min': 0
        };

        // Define power zones with even darker colors
        this.powerZones = {
            easy: { min: 0, max: 150, color: '#0D47A1' },     // Very dark blue
            moderate: { min: 150, max: 250, color: '#1B5E20' }, // Very dark green
            hard: { min: 250, max: 350, color: '#E65100' },    // Very dark orange
            max: { min: 350, max: 500, color: '#B71C1C' }      // Very dark red
        };

        // Initial draw
        this.draw();

        // Handle window resize
        window.addEventListener('resize', () => {
            this.resizeCanvas();
            this.draw();
        });
    }

    resizeCanvas() {
        const container = this.canvas.parentElement;
        if (!container) return;

        // Get the container width, accounting for padding
        const rect = container.getBoundingClientRect();
        this.canvas.width = rect.width - 20;  // Subtract padding
        this.canvas.height = rect.height || 400;  // Use fixed height if container height is 0
    }

    addPowerPoint(power) {
        const now = Date.now();
        this.powerHistory.push({ time: now, power: power });
        this.data.push(power);
        
        // Remove old points
        while (this.data.length > this.maxPoints) {
            this.data.shift();
        }
        
        // Remove old power history entries (older than 5 minutes)
        const fiveMinutesAgo = now - (5 * 60 * 1000);
        this.powerHistory = this.powerHistory.filter(point => point.time >= fiveMinutesAgo);
        
        this.updateAverages();
        this.draw();
    }

    updateAverages() {
        const now = Date.now();
        
        this.averages = {
            '3s': this.calculateAverage(3),
            '5s': this.calculateAverage(5),
            '1min': this.calculateAverage(60),
            '5min': this.calculateAverage(300)
        };
    }

    calculateAverage(seconds) {
        const now = Date.now();
        const cutoff = now - (seconds * 1000);
        const relevantData = this.powerHistory.filter(point => point.time >= cutoff);
        
        if (relevantData.length === 0) return 0;
        
        const sum = relevantData.reduce((acc, point) => acc + point.power, 0);
        return sum / relevantData.length;
    }

    draw() {
        if (!this.ctx) return;

        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw power zones background
        for (const zone of Object.values(this.powerZones)) {
            const y1 = this.canvas.height - (zone.min / this.maxPower * this.canvas.height);
            const y2 = this.canvas.height - (zone.max / this.maxPower * this.canvas.height);
            
            this.ctx.fillStyle = zone.color;
            this.ctx.globalAlpha = 0.2;
            this.ctx.fillRect(0, y2, this.canvas.width, y1 - y2);
            this.ctx.globalAlpha = 1.0;
        }

        // Draw grid lines
        this.drawGrid();

        // Draw power data
        if (this.data.length > 1) {
            this.ctx.beginPath();
            this.ctx.strokeStyle = '#000';
            this.ctx.lineWidth = 2;

            const xStep = this.canvas.width / (this.maxPoints - 1);
            
            this.data.forEach((power, index) => {
                const x = index * xStep;
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
        this.drawYAxisLabels();
    }

    drawGrid() {
        this.ctx.strokeStyle = '#ddd';
        this.ctx.lineWidth = 1;

        // Draw horizontal grid lines
        for (let power = 0; power <= this.maxPower; power += 50) {
            const y = this.canvas.height - (power / this.maxPower * this.canvas.height);
            
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }
    }

    drawYAxisLabels() {
        this.ctx.fillStyle = '#000';
        this.ctx.font = '12px Arial';
        this.ctx.textAlign = 'right';
        this.ctx.textBaseline = 'middle';

        for (let power = 0; power <= this.maxPower; power += 50) {
            const y = this.canvas.height - (power / this.maxPower * this.canvas.height);
            this.ctx.fillText(`${power}W`, 30, y);
        }
    }
}