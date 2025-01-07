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

        Object.entries(this.averages).forEach(([period, value]) => {
            const element = document.getElementById(`${period.replace('min', 'm')}-power`);
            if (element) {
                element.textContent = `${period} avg: ${Math.round(value)}W`;
                element.style.color = this.getPowerZoneColor(value);
            }
        });
    }

    getPowerZoneColor(power) {
        for (const zone of Object.values(this.powerZones)) {
            if (power >= zone.min && power <= zone.max) {
                return zone.color;
            }
        }
        return this.powerZones.max.color; // Default to max zone color if above range
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
        const width = this.canvas.width / window.devicePixelRatio;
        const height = this.canvas.height / window.devicePixelRatio;

        ctx.clearRect(0, 0, width * window.devicePixelRatio, height * window.devicePixelRatio);
        
        this.drawGrid(width, height);
        this.drawZoneLegend(width);

        if (this.data.length < 2) return;

        // Draw power segments with color zones
        const pointSpacing = width / (this.maxPoints - 1);
        
        ctx.lineWidth = 2;
        
        // Draw line segments with appropriate colors
        for (let i = 1; i < this.data.length; i++) {
            const x1 = (i - 1) * pointSpacing;
            const x2 = i * pointSpacing;
            const y1 = height - ((this.data[i - 1] / this.maxPower) * height);
            const y2 = height - ((this.data[i] / this.maxPower) * height);
            
            ctx.beginPath();
            ctx.strokeStyle = this.getPowerZoneColor(this.data[i]);
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
        }
    }

    drawGrid(width, height) {
        const ctx = this.ctx;
        const gridStep = 50;

        // Draw horizontal lines and labels
        ctx.strokeStyle = '#ddd';
        ctx.lineWidth = 0.5;
        ctx.fillStyle = '#666';
        ctx.font = '12px Arial';
        ctx.textAlign = 'right';

        for (let power = 0; power <= this.maxPower; power += gridStep) {
            const y = height - ((power / this.maxPower) * height);
            
            // Grid line
            ctx.beginPath();
            ctx.moveTo(30, y); // Start after labels
            ctx.lineTo(width, y);
            ctx.stroke();
            
            // Label
            ctx.fillText(`${power}W`, 25, y + 4);
        }
    }

    drawZoneLegend(width) {
        const ctx = this.ctx;
        const legendY = 20;
        const boxSize = 12;
        const textSpacing = 5;
        let xOffset = width - 460; // Start further left to give more room
        
        ctx.font = '11px Arial';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        
        // Draw background for entire legend
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.fillRect(xOffset - 5, legendY - boxSize, 465, boxSize * 2);
        
        Object.entries(this.powerZones).forEach(([zoneName, zone], index) => {
            // Draw color box
            ctx.fillStyle = zone.color;
            ctx.fillRect(xOffset, legendY - boxSize/2, boxSize, boxSize);
            
            // Draw text
            ctx.fillStyle = '#333';
            const label = `${zoneName} (${zone.min}-${zone.max}W)`;
            ctx.fillText(label, xOffset + boxSize + textSpacing, legendY);
            
            // Calculate next position based on text width
            const textWidth = ctx.measureText(label).width;
            xOffset += boxSize + textWidth + textSpacing + 20; // 20px gap between zones
        });
    }
}