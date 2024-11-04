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
const marsSemiMajorAxis = 300;
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
let isPaused = false;  // Start in a running state
let hasDrawnRay = false; // Flag to check if the first ray has been drawn
let hasDrawnFinalRay = false; // Flag to check if the final ray has been drawn

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
  ctx.fillText("Press Space to Begin", width - 150, 20); // Display prompt when paused
  ctx.fillText(`Days Counter: ${daysCounter}`, width - 150, 40); // Upper right corner
  ctx.fillText(`Heliocentric Longitude (Earth): ${heliocentricLongitude.toFixed(1)}°`, 10, 60); // One decimal place
  ctx.fillText(`Geocentric Longitude (Mars): ${geocentricLongitude.toFixed(1)}°`, 10, 80); // One decimal place
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
  backgroundCtx.strokeStyle = 'red';
  backgroundCtx.lineWidth = 2;
  backgroundCtx.stroke();

  // Draw arrowhead
  const arrowPointX = marsPos.x + (marsPos.x - earthPos.x) / 20; // Extend the ray
  const arrowPointY = marsPos.y + (marsPos.y - earthPos.y) / 20;
  backgroundCtx.beginPath();
  backgroundCtx.moveTo(marsPos.x, marsPos.y);
  backgroundCtx.lineTo(arrowPointX, arrowPointY);
  backgroundCtx.moveTo(marsPos.x, marsPos.y);
  backgroundCtx.lineTo(marsPos.x - (marsPos.x - earthPos.x) / 20, marsPos.y - (marsPos.y - earthPos.y) / 20);
  backgroundCtx.stroke();
}

// Animation loop
function animate() {
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

  // Check if daysCounter reaches 687 to pause the animation and draw final ray
  if (daysCounter >= 687) {
    if (!hasDrawnFinalRay) {
      drawRayOnBackground(earthPos, marsPos, 20); // Draw the final ray on the background
      hasDrawnFinalRay = true; // Set the flag to indicate the final ray has been drawn
      hasDrawnRay = false;
    }
  }

  requestAnimationFrame(animate);
}
// Handle space bar for starting the ray
window.addEventListener('keydown', function (event) {
  if (event.code === 'Space') {
    if (!hasDrawnRay) {
      const earthPos = drawEarth();
      const marsPos = drawMars();
      drawRayOnBackground(earthPos, marsPos, 20); // Draw the first ray on the background
      hasDrawnRay = true; // Set the flag to indicate the ray has been drawn
      hasDrawnFinalRay = false;
    }
    if (isPaused) {
      isPaused = false; // Resume animation if paused
    }
    // Start the day counter
    daysCounter = 0; // Reset days counter when space is pressed
  }
});

// Initialize the background canvas
drawBackground();
// Start animation
animate();