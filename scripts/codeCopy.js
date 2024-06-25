https://github.com/mirko-pace/copythatcode/blob/main/content.js

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

let tooltipTimeout;
document.addEventListener('mousemove', function (event) {
  const preElement = event.target.closest('pre');
  if (preElement) {  
    // Show the tooltip after a delay of 1 second using a timeout
    clearTimeout(tooltipTimeout);
    tooltipTimeout = setTimeout(() => {
      tooltip.style.display = 'block';
      tooltip.style.left = (event.clientX + 10) + 'px';
      tooltip.style.top = (event.clientY - 20) + 'px';
    }, 1000);
  } else {
    // Hide the tooltip if the cursor is not on a pre element
    clearTimeout(tooltipTimeout);
    tooltip.style.display = 'none';
  }
});
    
document.addEventListener('click', function (event) { 
   const preElement = event.target.closest('pre');
   if (preElement) {
     const code = preElement.innerText; // Change this line
     copyTextToClipboard(code); 
     tooltip.style.display = 'none';
   }
}); 

function copyTextToClipboard(text) { 
  navigator.clipboard.writeText(text).then(function () { 
    /* Nothing to do here */ 
  }, function (err) {    console.error('Error copying text: ', err); 
  }); 
}s