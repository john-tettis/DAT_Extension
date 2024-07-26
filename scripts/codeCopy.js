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
//new event listeners for glow effect. less intrusive.
document.addEventListener('mouseover', function(event)         {  
    const preElement = event.target.closest('pre');                 
          if (preElement) {
        preElement.style.boxShadow = '0 0 20px rgba(0, 0, 0, 0.2)';
        preElement.style.transform = 'scale(1.02)';
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


//code to remove non breaking whitespace rendered 
 
//ugly and invalid in VS Code
function removeNoBreakSpace(str) {
    return str.replace(/\u00A0/g, ' ');
}
// //test
// let NoBreakSpaces = "    nonbreaking    ";
// let StandardSpaces = removeNoBreakSpace(codeWithNoBreakSpaces);
// console.log(StandardSpaces == "    nonbreaking    ");
//issue #12
// Function to copy text to clipboard
function copyTextToClipboard(text) { 
    //remove non breaking spaces that render improperly in VS code
    text = removeNoBreakSpace(text);
    navigator.clipboard.writeText(text).then(function () { 
        // Success message can be added here if needed
    }, function (err) {   
        tooltip.innerText = 'Error copying Code'; // Display error in tooltip
        console.error('Error copying text: ', err); // Log error to console
    }); 
}

