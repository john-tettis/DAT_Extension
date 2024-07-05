//
//Original code credit to mirko-pace on github. Thanks for the awesome code.
//
//
//https://github.com/mirko-pace/copythatcode/blob/main/content.js
//

// Create the tooltip element and style it
let tooltip = document.createElement('div');
tooltip.id = 'copy-tooltip';
tooltip.textContent = 'Click to copy';
tooltip.style.position = 'fixed';
tooltip.style.display = 'none';
tooltip.style.backgroundColor = '#333';
tooltip.style.color = '#fff';
tooltip.style.padding = '5px';
tooltip.style.borderRadius = '5px';
tooltip.style.fontSize = '12px';
document.body.appendChild(tooltip);

// Variable to hold timeout reference for tooltip
let tooltipTimeout;

// Event listener for mousemove to show tooltip near <pre> elements
document.addEventListener('mousemove', function (event) {
    const preElement = event.target.closest('pre');
    if (preElement) {  
       
        clearTimeout(tooltipTimeout); // Clear any existing timeout
        
        tooltipTimeout = setTimeout(() => { // Show the tooltip after a delay of 100 millliseconds using a timeout
          tooltip.style.display = 'block';
          tooltip.style.left = (event.clientX + 10) + 'px';
          tooltip.style.top = (event.clientY - 20) + 'px';
        }, 100);
    } else {
        // Hide the tooltip if the cursor is not on a pre element
        clearTimeout(tooltipTimeout); // Clear timeout if cursor moved away
        tooltip.style.display = 'none';
    }
});

// Event listener for click to copy code from <pre> element
document.addEventListener('click', function (event) { 
    const preElement = event.target.closest('pre');
    if (preElement) {
        const code = preElement.innerText; // Get code text from <pre> element
        tooltip.textContent = 'Code Copied!'; // Update tooltip message
        copyTextToClipboard(code); // Copy code to clipboard
        setTimeout(() => {
          //reset tooltip text and display after 1 second
          tooltip.textContent = 'Click to Copy'
          tooltip.style.display = 'none'; // Hide tooltip after 1 second
        }, 1000);
    }
}); 

// Event listener for mouseover (hover in) on the document
// document.addEventListener('mouseover', function(event) {
//     const preElement = event.target.closest('pre');
//     if (preElement) {
//         const rgb = window.getComputedStyle(preElement).backgroundColor;
//         preElement.style.backgroundColor = increaseBrightness(rgb, 20); // Brighten background color
//         preElement.style.cursor = 'pointer'; // Change cursor on hover
//         // Additional styles or actions can be added here for hover in
//     }
// });

// // Event listener for mouseout (hover out) on the document
// document.addEventListener('mouseout', function(event) {
//     const preElement = event.target.closest('pre');
//     if (preElement) {
//         preElement.style.backgroundColor = ''; // Reset background color on hover out
//         preElement.style.cursor = 'auto'; // Reset cursor on hover out
//         // Additional reset styles or actions can be added here if needed
//     }
// });
 // Event listener for mouseover (hover in) on the document   
 //model A      
//  document.addEventListener('mouseover', function(event)         {  
//     const preElement = event.target.closest('pre');                 
//           if (preElement) {
//         //commented previous line
//         preElement.style.boxShadow = '0 0 20px rgba(0, 0, 0, 0.2)';
//         preElement.style.transform = 'scale(1.01)';
//         preElement.style.transition = 'transform 0.2s ease, box-shadow 0.2s ease';
//          // Additional styles or actions can be added here for hover in                
//     }                 
// });                 
//   // Event listener for mouseout (hover out) on the document                  
//  document.addEventListener('mouseout', function(event) {         const preElement = event.target.closest('pre');                  
//     if (preElement) {                    
//         preElement.style.boxShadow = 'none';
//         preElement.style.transform = 'scale(1)';
//         preElement.style.transition = 'transform 0.2s ease, box-shadow 0s ease';                   
//       // Reset styles for hover out                
//     }                
// });
//modelb
 // Event listener for mouseover (hover in) on the document         
 document.addEventListener('mouseover', function(event)         {  
    const preElement = event.target.closest('pre');                 
          if (preElement) {
        //commented previous line
        preElement.style.boxShadow = '0 0 20px rgba(0, 0, 0, 0.2)';
        preElement.style.transform = 'scale(1.01)';
        preElement.style.transition = 'transform 0.2s ease, box-shadow 0.2s ease';
         // Additional styles or actions can be added here for hover in                
    }                 
});                 
  // Event listener for mouseout (hover out) on the document                  
 document.addEventListener('mouseout', function(event) {         const preElement = event.target.closest('pre');                  
    if (preElement) {                    
        preElement.style.boxShadow = 'none';
        preElement.style.transform = 'scale(1)';
        preElement.style.transition = 'transform 0.2s ease, box-shadow 0s ease';                   
      // Reset styles for hover out                
    }                
});

// Function to copy text to clipboard
function copyTextToClipboard(text) { 
    navigator.clipboard.writeText(text).then(function () { 
        // Success message can be added here if needed
    }, function (err) {   
        tooltip.innerText = 'Error copying Code'; // Display error in tooltip
        console.error('Error copying text: ', err); // Log error to console
    }); 
}

// Function to increase brightness of an RGB color
function increaseBrightness(rgb, percentIncrease) {
    // Function to convert RGB string to array of integers
    function rgbStringToArray(rgbString) {
        var numbers = rgbString.match(/\d+/g); // Extract numbers using regex
        var rgbArray = numbers.map(function(num) {
            return parseInt(num, 10); // Convert string numbers to integers
        });
        return rgbArray;
    }

    // Ensure percentIncrease is a number between 0 and 100
    percentIncrease = Math.max(0, Math.min(100, percentIncrease));

    // Convert RGB string to array of integers
    const rgbArray = rgbStringToArray(rgb);

    // Extract RGB components
    let r = rgbArray[0];
    let g = rgbArray[1];
    let b = rgbArray[2];

    // Calculate increase amount for each component
    let delta = 255 * (percentIncrease / 100);

    // Increase brightness without exceeding 255
    r = Math.min(r + delta, 255);
    g = Math.min(g + delta, 255);
    b = Math.min(b + delta, 255);

    // Return adjusted RGB values as an RGBA string
    return `rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}, 1)`;
}