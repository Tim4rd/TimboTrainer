// Add button reference
const connectCSCButton = document.getElementById('connectCSCButton');

// Add click handler
connectCSCButton.addEventListener('click', async () => {
    try {
        connectCSCButton.disabled = true;
        connectCSCButton.textContent = 'Connecting...';
        
        const success = await powerMeter.connectCSC();
        
        if (success) {
            connectCSCButton.textContent = 'Speed/Cadence Connected';
            connectCSCButton.classList.add('connected');
            
            // Set up callbacks for speed and cadence updates
            powerMeter.setCadenceCallback((cadence) => {
                // Update your UI with cadence value
                console.log('Cadence:', cadence);
            });
            
            powerMeter.setSpeedCallback((wheelRevs, wheelTime) => {
                // Update your UI with speed value
                console.log('Wheel Data:', { revs: wheelRevs, time: wheelTime });
            });
        } else {
            connectCSCButton.textContent = 'Connect Speed/Cadence';
            connectCSCButton.disabled = false;
        }
    } catch (error) {
        console.error('Error connecting to CSC:', error);
        connectCSCButton.textContent = 'Connect Speed/Cadence';
        connectCSCButton.disabled = false;
    }
}); 