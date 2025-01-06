class PowerGraph {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.data = [];
        this.maxPoints = 300;
        this.maxPower = 1000;
        this.powerHistory = [];
        this.averages = {
            '3s': 0,
            '5s': 0,
            '1min': 0,
            '5min': 0
        };
        
        // Set canvas size
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
    }

    resizeCanvas() {
        this.canvas.width = this.canvas.offsetWidth;
        this.canvas.height = this.canvas.offsetHeight;
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

        Object.entries(this.averages).forEach(([period, value]) => {
            document.getElementById(`${period.replace('min', 'm')}-power`).textContent = 
                `${period} avg: ${Math.round(value)}W`;
        });
    }

    calculateAverage(seconds) {
        const now = Date.now();
        const relevantData = this.powerHistory.filter(p => 
            now - p.timestamp <= seconds * 1000);
        if (relevantData.length === 0) return 0;
        return relevantData.reduce((acc, p) => acc + p.power, 0) / relevantData.length;
    }

    draw() {
        const ctx = this.ctx;
        const width = this.canvas.width;
        const height = this.canvas.height;

        // Clear canvas
        ctx.clearRect(0, 0, width, height);
        
        if (this.data.length < 2) return;

        // Draw grid
        this.drawGrid();

        // Draw power line
        ctx.beginPath();
        ctx.strokeStyle = '#2196F3';
        ctx.lineWidth = 2;

        const pointWidth = width / this.maxPoints;
        
        this.data.forEach((power, index) => {
            const x = index * pointWidth;
            const y = height - (power / this.maxPower * height);
            
            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });

        ctx.stroke();
    }

    drawGrid() {
        const ctx = this.ctx;
        const width = this.canvas.width;
        const height = this.canvas.height;

        ctx.strokeStyle = '#ddd';
        ctx.lineWidth = 0.5;

        // Draw horizontal lines every 100W
        for (let power = 0; power <= this.maxPower; power += 100) {
            const y = height - (power / this.maxPower * height);
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
            
            // Label power values
            ctx.fillStyle = '#666';
            ctx.font = '12px Arial';
            ctx.fillText(`${power}W`, 5, y - 5);
        }
    }
}
