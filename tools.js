// script.js

const backgroundCanvas = document.getElementById('backgroundCanvas');
const backgroundCtx = backgroundCanvas.getContext('2d');
const keplerCanvas = document.getElementById('keplerCanvas');
const ctx = keplerCanvas.getContext('2d');
const width = keplerCanvas.width;
const height = keplerCanvas.height;

// Center of the canvas
const sunX = width / 2;
const sunY = height / 2;

// Orbit parameters
const earthOrbitRadius = 200;
const marsSemiMajorAxis = earthOrbitRadius * 1.524;
const marsEccentricity = 0.0934;
const marsSemiMinorAxis = marsSemiMajorAxis * Math.sqrt(1 - Math.pow(marsEccentricity, 2));

// Sidereal periods in days (scaled to speeds for simulation)
const earthSiderealPeriod = 365.25;
const marsSiderealPeriod = 687;
const timeScale = 1; // Adjusted for correct animation speed

// Angular speeds based on sidereal periods (in radians per day, scaled)
const earthSpeed = (2 * Math.PI) / earthSiderealPeriod * timeScale;
let marsAngularSpeed = (2 * Math.PI) / marsSiderealPeriod * timeScale;

// Initial angles for Earth and Mars
let earthAngle = 0;
let marsAngle = 0;
let daysCounter = 0;  // Days counter for display
let experimentDays = 0; // Days passed since the first ray cast
let isPaused = false;  // Start in a running state
let hasDrawnRay = false; // Flag to check if the first ray has been drawn
let hasDrawnFinalRay = false; // Flag to check if the final ray has been drawn
let experimentBegun = false;

// Draw the orbits and the sun on the background canvas
function drawBackground() {
  // Clear the background canvas
  backgroundCtx.clearRect(0, 0, width, height);
  
  // Draw the Sun
  backgroundCtx.beginPath();
  backgroundCtx.arc(sunX, sunY, 10, 0, 2 * Math.PI);
  backgroundCtx.fillStyle = 'yellow';
  backgroundCtx.fill();
  backgroundCtx.stroke();

  // Draw Earth's orbit as a circle
  backgroundCtx.beginPath();
  backgroundCtx.arc(sunX, sunY, earthOrbitRadius, 0, 2 * Math.PI);
  backgroundCtx.strokeStyle = 'blue';
  backgroundCtx.stroke();

  // Draw Mars' orbit as an ellipse
  backgroundCtx.beginPath();
  const marsFocusOffset = marsSemiMajorAxis * marsEccentricity;
  backgroundCtx.ellipse(sunX - marsFocusOffset, sunY, marsSemiMajorAxis, marsSemiMinorAxis, 0, 0, 2 * Math.PI);
  backgroundCtx.strokeStyle = 'red';
  backgroundCtx.stroke();
}

// Calculate Earth's position on its orbit
function drawEarth() {
  const earthX = sunX + earthOrbitRadius * Math.cos(earthAngle);
  const earthY = sunY + earthOrbitRadius * Math.sin(earthAngle);
  
  ctx.beginPath();
  ctx.arc(earthX, earthY, 5, 0, 2 * Math.PI);
  ctx.fillStyle = 'blue';
  ctx.fill();
  
  return { x: earthX, y: earthY }; // Return Earth's position
}

// Calculate Mars' position on its orbit
function drawMars() {
  const marsFocusOffset = marsSemiMajorAxis * marsEccentricity;
  const marsX = sunX - marsFocusOffset + marsSemiMajorAxis * Math.cos(marsAngle);
  const marsY = sunY + marsSemiMinorAxis * Math.sin(marsAngle);
  
  ctx.beginPath();
  ctx.arc(marsX, marsY, 5, 0, 2 * Math.PI);
  ctx.fillStyle = 'red';
  ctx.fill();
  
  return { x: marsX, y: marsY }; // Return Mars' position
}

// Draw lines connecting Earth to Sun and Earth to Mars
function drawConnectingLines(earthPos, marsPos) {
  // Draw line from Earth to Sun
  ctx.beginPath();
  ctx.moveTo(earthPos.x, earthPos.y);
  ctx.lineTo(sunX, sunY); // To the Sun
  ctx.strokeStyle = 'blue';
  ctx.stroke();

  // Draw line from Earth to Mars
  ctx.beginPath();
  ctx.moveTo(earthPos.x, earthPos.y);
  ctx.lineTo(marsPos.x, marsPos.y); // To Mars
  ctx.strokeStyle = 'red';
  ctx.stroke();
}

// Display elapsed days, heliocentric longitude, and geocentric longitude
function displayInfo(heliocentricLongitude, geocentricLongitude) {
  ctx.fillStyle = 'black';
  ctx.font = '16px Arial';
  ctx.fillText("Press Space to Begin", width - 180, 20); // Display prompt when paused
  ctx.fillText(`Days Between Observations: ${daysCounter}`, width - 250, 40); // Upper right corner
  ctx.fillText(`Experiment Years Elapsed: ${(experimentDays/365.25).toFixed(2)}`, 10, 20);
  ctx.fillText(`Heliocentric Longitude (Earth): ${heliocentricLongitude.toFixed(1)}°`, 10, 40); // One decimal place
  ctx.fillText(`Geocentric Longitude (Mars): ${geocentricLongitude.toFixed(1)}°`, 10, 60); // One decimal place
}

// Calculate the heliocentric longitude of Earth (ensuring it's always positive)
function calculateHeliocentricLongitude() {
  let heliocentricLongitude = (earthAngle * (180 / Math.PI)) % 360; // Convert radians to degrees
  return heliocentricLongitude < 0 ? heliocentricLongitude + 360 : heliocentricLongitude; // Ensure positive
}

// Calculate the geocentric longitude of Mars (ensuring it's between 0 and 360°)
function calculateGeocentricLongitude(earthPos, marsPos) {
  const dx = marsPos.x - earthPos.x;
  const dy = marsPos.y - earthPos.y;
  const angle = Math.atan2(dy, dx); // Angle between Mars and Earth in radians
  let geocentricLongitude = (angle * (180 / Math.PI)) % 360; // Convert radians to degrees
  return geocentricLongitude < 0 ? geocentricLongitude + 360 : geocentricLongitude; // Ensure 0 to 360°
}

// Draw a ray from Earth through Mars on the background canvas
function drawRayOnBackground(earthPos, marsPos, arrowLength) {
  // Draw line from Earth to Mars
  backgroundCtx.beginPath();
  backgroundCtx.moveTo(earthPos.x, earthPos.y);
  backgroundCtx.lineTo(marsPos.x, marsPos.y); // To Mars
  backgroundCtx.strokeStyle = 'black';
  backgroundCtx.lineWidth = 1;
  backgroundCtx.stroke();

  // Calculate direction vector from Earth to Mars
  const dx = marsPos.x - earthPos.x;
  const dy = marsPos.y - earthPos.y;
  const length = Math.sqrt(dx * dx + dy * dy); // Distance from Earth to Mars

  // Normalize the direction vector
  const unitX = dx / length;
  const unitY = dy / length;

  // Calculate the position for the arrowhead extending beyond Mars
  const arrowEndX = marsPos.x + unitX * arrowLength;
  const arrowEndY = marsPos.y + unitY * arrowLength;

  // Draw arrowhead
  backgroundCtx.beginPath();
  backgroundCtx.moveTo(marsPos.x, marsPos.y);
  backgroundCtx.lineTo(arrowEndX, arrowEndY); // Main arrow line

  // Calculate arrowhead sides
  const arrowheadSize = 5; // Size of the arrowhead
  const leftX = arrowEndX - unitY * arrowheadSize; // Left side of arrowhead
  const leftY = arrowEndY + unitX * arrowheadSize; // Left side of arrowhead
  const rightX = arrowEndX + unitY * arrowheadSize; // Right side of arrowhead
  const rightY = arrowEndY - unitX * arrowheadSize; // Right side of arrowhead

  // Draw arrowhead sides
  backgroundCtx.moveTo(arrowEndX, arrowEndY);
  backgroundCtx.lineTo(leftX, leftY);
  backgroundCtx.moveTo(arrowEndX, arrowEndY);
  backgroundCtx.lineTo(rightX, rightY);
  backgroundCtx.stroke();
}

let animationFrameId; // Variable to store the animation frame ID

// Animation loop
function animate() {
  if(!isPaused){
    ctx.clearRect(0, 0, width, height);
    
    // Draw the static background first
    backgroundCtx.drawImage(backgroundCanvas, 0, 0);
    
    const earthPos = drawEarth();
    const marsPos = drawMars();

    // Draw connecting lines
    drawConnectingLines(earthPos, marsPos);

    // Calculate longitudes
    const heliocentricLongitude = calculateHeliocentricLongitude();
    const geocentricLongitude = calculateGeocentricLongitude(earthPos, marsPos);
    
    // Display all information
    displayInfo(heliocentricLongitude, geocentricLongitude);

    // Update Earth's position
    earthAngle -= earthSpeed;  // Reverse direction for Earth
    marsAngle -= marsAngularSpeed;  // Reverse direction for Mars
    
    // Increment daysCounter if ray has been drawn
    if (hasDrawnRay && daysCounter < 687) {
      daysCounter += 1; // Increment the day counter
    }
    if(experimentBegun){
      experimentDays += 1;
    }

    // Check if daysCounter reaches 687 to pause the animation and draw final ray
    if (daysCounter >= 687) {
      if (!hasDrawnFinalRay) {
        drawRayOnBackground(earthPos, marsPos, 20); // Draw the final ray on the background
        hasDrawnFinalRay = true; // Set the flag to indicate the final ray has been drawn
        hasDrawnRay = false;
      }
    }
  }
  animationFrameId  = requestAnimationFrame(animate);
}
// Handle space bar for starting the ray
window.addEventListener('keydown', function (event) {
  if (event.code === 'Space') {
    drawInitialRay();
  }
});

function drawInitialRay(){
  if(!experimentBegun){
    experimentBegun = true;
  }
  if (!hasDrawnRay) {
    const earthPos = drawEarth();
    const marsPos = drawMars();
    drawRayOnBackground(earthPos, marsPos, 40); // Draw the first ray on the background
    hasDrawnRay = true; // Set the flag to indicate the ray has been drawn
    hasDrawnFinalRay = false;
  }
  if (isPaused) {
    isPaused = false; // Resume animation if paused
  }
  // Start the day counter
  daysCounter = 0; // Reset days counter when space is pressed
}

function stopExperiment() {
  isPaused = true;  // Pause the animation
  hasDrawnRay = true;  // Disable the spacebar interaction
  hasDrawnFinalRay = true;  // Ensure no further final ray is drawn
  daysCounter = 0;  // Optionally reset the day counter or freeze it
  //ctx.clearRect(0, 0, keplerCanvas.width, keplerCanvas.height);  // Clear the dynamic canvas
  //ctx.fillText("Experiment Stopped", keplerCanvas.width / 2 - 50, keplerCanvas.height / 2);  // Display message

}

document.getElementById('stopButton').addEventListener('click', stopExperiment);

document.getElementById('drawRayButton').addEventListener('click', drawInitialRay);

let isEllipseMode = false;
let ellipse = {
  x: sunX, // Center the ellipse on the Sun initially
  y: sunY,
  rx: earthOrbitRadius, // Initial horizontal radius
  ry: earthOrbitRadius // Initial vertical radius
};

// Function to calculate eccentricity based on current rx and ry
function calculateEccentricity(rx, ry) {
  if (rx === 0 || ry === 0) return 0; // Prevent divide by zero errors
  return Math.sqrt(1 - (ry ** 2 / rx ** 2));
}

// Draw the ellipse with dynamically calculated eccentricity
function drawEllipse() {
  ctx.clearRect(0, 0, width, height); // Clear the entire canvas

  const eccentricity = calculateEccentricity(ellipse.rx, ellipse.ry);
  const offsetX = ellipse.rx * eccentricity; // Offset based on eccentricity

  ctx.beginPath();
  ctx.ellipse(
    ellipse.x - offsetX, // Adjust the center based on eccentricity
    ellipse.y, 
    Math.abs(ellipse.rx), // Ensure radius values are positive
    Math.abs(ellipse.ry),
    0, 
    0, 
    2 * Math.PI
  );
  ctx.strokeStyle = 'purple';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Calculate and display the eccentricity, perigee, and apogee
  ctx.fillStyle = 'black';
  ctx.font = '16px Arial';
  
  // Display eccentricity
  ctx.fillText(`Eccentricity: ${eccentricity.toFixed(3)}`, 10, 20);
  
  // Calculate perigee and apogee
  const perigee = ((ellipse.rx - (ellipse.rx * eccentricity))/200).toFixed(3);
  const apogee = ((ellipse.rx + (ellipse.rx * eccentricity))/200).toFixed(3);
  
  // Display perigee and apogee
  ctx.fillText(`Perigee: ${perigee} au`, width - 150, 20);
  ctx.fillText(`Apogee: ${apogee} au`, width - 150, 40);
}

// Toggle ellipse drawing mode
document.getElementById('drawEllipseBtn').addEventListener('click', () => {
  if (isPaused) { // Only enable if the animation is paused
    isEllipseMode = true;
    drawEllipse(); // Draw the initial ellipse
  }
});

// Handle key events to adjust ellipse size and eccentricity
window.addEventListener('keydown', function (event) {
  if (isEllipseMode) {
    switch (event.key) {
      case 'i': // Increase size (both rx and ry)
        ellipse.rx += 2;
        ellipse.ry += 2;
        break;
        
      case 'k': // Decrease size (both rx and ry)
        ellipse.rx = Math.max(1, ellipse.rx - 2);
        ellipse.ry = Math.max(1, ellipse.ry - 2);
        break;

      case 'j': // Increase eccentricity (decrease rx)
        if (ellipse.rx > ellipse.ry) {
          ellipse.rx = Math.max(ellipse.ry, ellipse.rx - 0.1); // Allow rx to match ry
        }
        break;

      case 'l': // Decrease eccentricity (increase rx)
        ellipse.rx += 0.1; // Allow rx to exceed ry
        break;
    }
    drawEllipse(); // Redraw with updated dimensions
  }
});
// Initialize the background canvas
drawBackground();
// Start animation
animate();