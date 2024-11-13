// script.js

const backgroundCanvas = document.getElementById('backgroundCanvas');
const backgroundCtx = backgroundCanvas.getContext('2d');
const keplerCanvas = document.getElementById('keplerCanvas');
const ctx = keplerCanvas.getContext('2d');
const width = keplerCanvas.width;
const height = keplerCanvas.height;
const beyond = 80;

// Center of the canvas
const sunX = width / 2;
const sunY = height / 2;

// Orbit parameters
const scaleRad = 0.75;
const earthOrbitRadius = 200 * scaleRad;
const marsSemiMajorAxis = earthOrbitRadius * 1.524;
const marsEccentricity = 0.0934;
const marsSemiMinorAxis = marsSemiMajorAxis * Math.sqrt(1 - Math.pow(marsEccentricity, 2));

// Sidereal periods in days (scaled to speeds for simulation)
const earthSiderealPeriod = 365.25;
const marsSiderealPeriod = 687;
const timeScale = 1; // Adjusted for correct animation speed
const angleShift = 0;

// Angular speeds based on sidereal periods (in radians per day, scaled)
const earthSpeed = (2 * Math.PI) / earthSiderealPeriod * timeScale;
let marsAngularSpeed = (2 * Math.PI) / marsSiderealPeriod * timeScale;

// Initial angles for Earth and Mars
let earthAngle = 0;
let marsAngle = 0;
let daysCounter = 0;  // Days counter for display
let experimentDays = 0; // Days passed since the first ray cast
let isPaused = true;  // Start in a running state
let hasDrawnRay = false; // Flag to check if the first ray has been drawn
let hasDrawnFinalRay = false; // Flag to check if the final ray has been drawn
let experimentBegun = false;

const overlay = document.getElementById('overlay');
const beginButton = document.getElementById('beginButton');

beginButton.addEventListener('click', startAnimation);
const startNewExperimentButton = document.createElement('button');
startNewExperimentButton.innerText = 'Start New Experiment';
startNewExperimentButton.id = 'startNewExperimentButton';
startNewExperimentButton.style.display = 'none'; // Hidden initially
document.getElementById("buttonContainer").appendChild(startNewExperimentButton); // Add button to the body


let isTouching = false;
let touchStartX = 0;
let touchStartY = 0;

function handleTouchMove(event) {
  if(isEllipseMode){
    if (!isTouching) return;

    // Prevent default behavior to avoid scrolling on touch screens
    event.preventDefault();

    const touch = event.touches[0];
    const dx = touch.clientX - touchStartX;
    const dy = touch.clientY - touchStartY;

    // Up/Down drag controls size (like I and K keys)
    if (Math.abs(dy) > Math.abs(dx)) {
      if (dy < 0) {
        ellipse.rx += 2;
        ellipse.ry += 2;
      } else {
        ellipse.rx = Math.max(1, ellipse.rx - 2);
        ellipse.ry = Math.max(1, ellipse.ry - 2);
      }
    }
    // Left/Right drag controls eccentricity (like J and L keys)
    else {
      if (dx > 0) {
        if (ellipse.rx > ellipse.ry) {
          ellipse.rx = Math.max(ellipse.ry, ellipse.rx - 0.1); // Allow rx to match ry
        }
      } else {
        ellipse.rx += 0.1; // Allow rx to exceed ry
      }
    }

    // Adjust rx based on eccentricity to simulate a "shift" of the center
   // ellipse.rx = ellipse.ry / Math.sqrt(1 - Math.pow(eccentricity, 2));

    // Redraw ellipse
    drawEllipse();

    // Update touch start positions
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
  }
}

keplerCanvas.addEventListener('touchstart', (event) => {
  isTouching = true;
  const touch = event.touches[0];
  touchStartX = touch.clientX;
  touchStartY = touch.clientY;
});

keplerCanvas.addEventListener('touchmove', handleTouchMove);

keplerCanvas.addEventListener('touchend', () => {
  isTouching = false;
});

function startAnimation() {
  isPaused = false;
  overlay.style.visibility = 'hidden'; // Hide the overlay
  overlay.style.opacity = 0; // Fade it out
  // Begin animation code here (you can call your animation function here)
  document.getElementById("drawEllipseBtn").display = "none";
  requestAnimationFrame(animate);
}

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
  if(!hasDrawnFinalRay && hasDrawnRay){
    ctx.fillText("Wait 687 days for Mars to reach the same place again.", width - 400, 20);
  }
  else if(hasDrawnFinalRay || !hasDrawnRay){
    ctx.fillText("Click Begin Observation to start your observation of Mars", width - 435, 20); // Display prompt when paused
  }
  ctx.fillText(`Days Between Observations: ${daysCounter}`, width - 250, 40); // Upper right corner
  ctx.fillText(`Experiment Years Elapsed: ${(experimentDays/365.25).toFixed(2)}`, 10, 20);
  ctx.fillStyle = "blue";
  ctx.fillText(`Heliocentric Longitude (Earth): ${(360 - heliocentricLongitude).toFixed(1)}°`, 10, 40); // One decimal place
  ctx.fillStyle = "red";
  ctx.fillText(`Geocentric Longitude (Mars): ${(360 - geocentricLongitude).toFixed(1)}°`, 10, 60); // One decimal place
}

// Calculate the heliocentric longitude of Earth (ensuring it's always positive)
function calculateHeliocentricLongitude() {
  let heliocentricLongitude = ((earthAngle + angleShift) * (180 / Math.PI)) % 360; // Convert radians to degrees
  return heliocentricLongitude < 0 ? heliocentricLongitude + 360 : heliocentricLongitude; // Ensure positive
}

// Calculate the geocentric longitude of Mars (ensuring it's between 0 and 360°)
function calculateGeocentricLongitude(earthPos, marsPos) {
  const dx = marsPos.x - earthPos.x;
  const dy = marsPos.y - earthPos.y;
  const angle = Math.atan2(dy, dx) + angleShift; // Angle between Mars and Earth in radians
  let geocentricLongitude = (angle * (180 / Math.PI)) % 360; // Convert radians to degrees
  return geocentricLongitude < 0 ? geocentricLongitude + 360 : geocentricLongitude; // Ensure 0 to 360°
}

// Draw a ray from Earth through Mars on the background canvas
function drawRayOnBackground(earthPos, marsPos, arrowLength) {
  // Draw line from Earth to Mars
  // backgroundCtx.beginPath();
  // backgroundCtx.moveTo(earthPos.x, earthPos.y);
  // backgroundCtx.lineTo(marsPos.x, marsPos.y); // To Mars
  backgroundCtx.strokeStyle = 'black';
  backgroundCtx.lineWidth = 1;
  // backgroundCtx.stroke();

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
  backgroundCtx.moveTo(earthPos.x, earthPos.y);
  backgroundCtx.lineTo(arrowEndX, arrowEndY); // Main arrow line
  backgroundCtx.stroke();
  // Calculate arrowhead sides
  const arrowheadSize = 7; // Size of the arrowhead
  const leftX = arrowEndX - unitX * arrowheadSize - unitY * arrowheadSize;
  const leftY = arrowEndY - unitY * arrowheadSize + unitX * arrowheadSize;
  const rightX = arrowEndX - unitX * arrowheadSize + unitY * arrowheadSize;
  const rightY = arrowEndY - unitY * arrowheadSize - unitX * arrowheadSize;

  // Draw arrowhead sides
  backgroundCtx.beginPath();
  backgroundCtx.moveTo(arrowEndX, arrowEndY);
  backgroundCtx.lineTo(leftX, leftY);
  backgroundCtx.stroke();
  backgroundCtx.moveTo(rightX, rightY);
  backgroundCtx.lineTo(arrowEndX, arrowEndY); // Close the arrowhead shape
  backgroundCtx.stroke();
  backgroundCtx.closePath();
  
}

const angleDiameter = 25;

function drawArcs(heliocentricLongitude, geocentricLongitude, earthPs){
    // Calculate Earth-Sun angle (heliocentric longitude)
    let helioLongitude = (heliocentricLongitude * Math.PI) / 180;
  
    // Calculate Earth-Mars angle relative to Earth (geocentric longitude)
    let geoLongitude = (geocentricLongitude  * Math.PI) / 180;

    // Draw Heliocentric Longitude Arc (from 0° to current heliocentric longitude)

    let heliocentricGradient = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, 50);
    heliocentricGradient.addColorStop(0, 'rgba(0, 0, 255, 0.1)'); // Starting color, mostly transparent
    heliocentricGradient.addColorStop(1, 'rgba(0, 0, 255, 0.5)'); // Ending color, more opaque

    ctx.beginPath();
    ctx.moveTo(sunX, sunY);
    ctx.arc(sunX, sunY, angleDiameter, helioLongitude - angleShift,  0 - angleShift);  
    ctx.strokeStyle = 'blue';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.closePath();
    ctx.fillStyle = heliocentricGradient;
    ctx.fill();

    // Draw Geocentric Longitude Arc (from 0° to current geocentric longitude)
    let geocentricGradient = ctx.createRadialGradient(earthPs.x, earthPs.y, 0, earthPs.x, earthPs.y, 50);
    geocentricGradient.addColorStop(0, 'rgba(255, 0, 0, 0.1)'); // Starting color, mostly transparent
    geocentricGradient.addColorStop(1, 'rgba(255, 0, 0, 0.5)'); // Ending color, more opaque

    ctx.beginPath();
    ctx.moveTo(earthPs.x, earthPs.y);
    ctx.arc(earthPs.x, earthPs.y, angleDiameter, geoLongitude - angleShift , 0 - angleShift ); 
    ctx.strokeStyle = 'red';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.closePath();
    ctx.fillStyle = geocentricGradient;
    ctx.fill();

}

let animationFrameId; // Variable to store the animation frame ID

// Animation loop
function animate() {
  if(!isPaused){
    ctx.clearRect(0, 0, width, height);
    
    // Draw the static background first
    backgroundCtx.drawImage(backgroundCanvas, 0, 0);
    
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

    const earthPos = drawEarth();
    const marsPos = drawMars();

    // Check if daysCounter reaches 687 to draw final ray
    if (daysCounter >= 687) {
      if (!hasDrawnFinalRay) {
        sixHundredEightySeven = true;
        drawRayOnBackground(earthPos, marsPos, beyond); // Draw the final ray on the background
        hasDrawnFinalRay = true; // Set the flag to indicate the final ray has been drawn
        hasDrawnRay = false;
      }
    }

    // Draw connecting lines
    drawConnectingLines(earthPos, marsPos);
   
    // Calculate longitudes
    const heliocentricLongitude = calculateHeliocentricLongitude();
    const geocentricLongitude = calculateGeocentricLongitude(earthPos, marsPos);
    
    drawArcs(heliocentricLongitude, geocentricLongitude, earthPos);

    // Display all information
    displayInfo(heliocentricLongitude, geocentricLongitude);
  }
  else if(isPaused) return;
  animationFrameId  = requestAnimationFrame(animate);
}


// Handle space bar for starting the ray
window.addEventListener('keydown', function (event) {
  if (event.code === 'Space') {
    if(!sixHundredEightySeven) { drawInitialRay(); }
  }
});

let sixHundredEightySeven = false;

function drawInitialRay(){
  if(!experimentBegun){
    experimentBegun = true;
  }
  if (!hasDrawnRay) {
    const earthPos = drawEarth();
    const marsPos = drawMars();
    drawRayOnBackground(earthPos, marsPos, beyond); 
    console.log(earthPos.x + " x" + earthPos.y + " y");
    hasDrawnRay = true; 
    hasDrawnFinalRay = false;
    console.log(earthPos.x + " x" + earthPos.y + " y");
  }
  if (isPaused) {
    isPaused = false;
  }
  // Start the day counter
  if(sixHundredEightySeven){
    daysCounter = 0; // Reset days counter when space is pressed
    sixHundredEightySeven = false;
  }
}

function stopExperiment() {
  if(!isPaused){
    document.getElementById("stopButton").innerHTML = "Resume Experiment";
    document.getElementById("drawEllipseBtn").style.display = 'flex';
    isPaused = true;
  }
  else if(isPaused){
    document.getElementById("stopButton").innerHTML = "Pause Experiment";
    startAnimation();
    isPaused = false;
  }
  console.log(isPaused + " isPaused");
  // hasDrawnRay = true;  // Disable the spacebar interaction
  // hasDrawnFinalRay = true;  // Ensure no further final ray is drawn
  // daysCounter = 0;  // Optionally reset the day counter or freeze it
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
  const perigee = ((ellipse.rx - (ellipse.rx * eccentricity))/200/scaleRad).toFixed(3);
  const apogee = ((ellipse.rx + (ellipse.rx * eccentricity))/200/scaleRad).toFixed(3);
  
  // Display perigee and apogee
  ctx.fillText(`Perigee: ${perigee} au`, width - 150, 20);
  ctx.fillText(`Apogee: ${apogee} au`, width - 150, 40);
}

// Toggle ellipse drawing mode
document.getElementById('drawEllipseBtn').addEventListener('click', () => {
  if (isPaused) { // Only enable if the animation is paused
    document.getElementById("drawRayButton").style.display = 'none';
    document.getElementById("stopButton").style.display = 'none';
    document.getElementById("drawEllipseBtn").style.display = 'none';
    // Show the Start New Experiment button
    startNewExperimentButton.style.display = 'flex';
    isEllipseMode = true;
    drawEllipse(); // Draw the initial ellipse
  }
});

// Handle key events to adjust ellipse size and eccentricity
window.addEventListener('keydown', function (event) {
  if (isEllipseMode) {
    switch (event.key) {
      case 'w': // Increase size (both rx and ry)
        ellipse.rx += 2;
        ellipse.ry += 2;
        break;
        
      case 's': // Decrease size (both rx and ry)
        ellipse.rx = Math.max(1, ellipse.rx - 2);
        ellipse.ry = Math.max(1, ellipse.ry - 2);
        break;

      case 'd': // Increase eccentricity (decrease rx)
        if (ellipse.rx > ellipse.ry) {
          ellipse.rx = Math.max(ellipse.ry, ellipse.rx - 0.1); // Allow rx to match ry
        }
        break;

      case 'a': // Decrease eccentricity (increase rx)
        ellipse.rx += 0.1; // Allow rx to exceed ry
        break;
    }
    drawEllipse(); // Redraw with updated dimensions
  }
});

startNewExperimentButton.addEventListener('click', () => {
  // Hide the Start New Experiment button
  startNewExperimentButton.style.display = 'none';
  //document.getElementById("drawEllipseBtn").style.display = 'flex';
  // Show the Begin Observation and Stop Experiment buttons again
  document.getElementById("drawRayButton").style.display = 'flex';
  document.getElementById("stopButton").style.display = 'flex';

  // Reset any relevant states or start a new experiment (custom logic here)
  resetExperiment();
});

function resetExperiment() {
  earthAngle = 0;
  marsAngle = 0;
  console.log("Resetting experiment");
  document.getElementById("stopButton").innerHTML = "Pause Experiment";
  document.getElementById("drawEllipseBtn").display = "none";
  hasDrawnFinalRay = false;
  hasDrawnRay = false;
  experimentDays = 0;
  daysCounter = 0;
  drawBackground();
  startAnimation();
}


// Initialize the background canvas
drawBackground();
// Start animation
animate();