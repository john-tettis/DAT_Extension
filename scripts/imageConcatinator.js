// Global array to store selected images
let selectedImages = [];

// Select the file input element from the DOM
const fileInput = document.getElementById('imageInput');
//submit button
const concatenateBtn = document.getElementById('concatenateBtn');

// Function to handle the image change event when users select new images
function handleImageChange() {
  const imageContainer = document.getElementById('image-container'); // Get the container for image thumbnails
  imageContainer.innerHTML = ''; // Clear the container to remove any existing thumbnails

  // Loop through all files selected by the user
  for (let i = 0; i < fileInput.files.length; i++) {
    const file = fileInput.files[i]; // Get each file from the input
    const img = new Image(); // Create a new image element

    img.onload = () => {
      // Once the image is loaded, create a thumbnail
      const thumbnail = document.createElement('div'); // Create a div for the thumbnail
      thumbnail.classList.add('thumbnail'); // Add a class for styling purposes
      thumbnail.appendChild(img); // Append the image to the thumbnail div

      // Create a delete button for each thumbnail to allow removal of images
      const deleteBtn = document.createElement('button');
      deleteBtn.textContent = 'X'; // Set the button text to 'X'
      deleteBtn.addEventListener('click', () => {
        selectedImages = selectedImages.filter((i) => i !== img); // Remove the image from the selectedImages array
        //hide concat button if no images selected
        if(selectedImages.length === 0){
          concatenateBtn.style.display="none"
        }
        thumbnail.remove(); // Remove the thumbnail element from the DOM
      });
      thumbnail.appendChild(deleteBtn); // Append the delete button to the thumbnail

      imageContainer.appendChild(thumbnail); // Append the thumbnail to the image container
      selectedImages.push(img); // Add the image to the selectedImages array
    };

    img.src = URL.createObjectURL(file); // Create a temporary URL for the image file to display it
  }
  //make concat button visible when files are added!
  concatenateBtn.style.display="flex"
}

// Add an event listener to the file input to handle image selection
fileInput.addEventListener("change", handleImageChange);

// Function to load images asynchronously
async function loadImages(images) {
  // Return a Promise that resolves when all images are loaded and converted to Blob URLs
  return Promise.all(images.map((img) => new Promise((resolve) => {
    const canvas = document.createElement('canvas'); // Create a temporary canvas element
    const ctx = canvas.getContext('2d'); // Get the 2D drawing context
    canvas.width = img.naturalWidth; // Set canvas width to the natural width of the image
    canvas.height = img.naturalHeight; // Set canvas height to the natural height of the image
    ctx.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight); // Draw the image onto the canvas

    // Convert the canvas image to a Blob and create a URL from it
    canvas.toBlob((blob) => {
      resolve(URL.createObjectURL(blob)); // Resolve the Promise with the Blob URL
    }, 'image/png'); // Specify the image format as PNG
  })));
}

// Function to combine selected images into one image on a canvas
function combineImages(images) {
  const canvas = document.getElementById('outputCanvas'); // Get the output canvas element
  const context = canvas.getContext('2d'); // Get the 2D drawing context for the canvas

  // Calculate the total width and height needed for the combined image
  let width = 0;
  let height = 0;

  images.forEach(img => {
    width = Math.max(width, img.naturalWidth);  // Set width to the maximum natural width of the images
    height += img.naturalHeight;  // Sum the natural heights of all images for the total height
  });

  canvas.width = width; // Set the canvas width
  canvas.height = height; // Set the canvas height

  // Draw each image onto the canvas in sequence, maintaining their original quality
  let offsetY = 0; // Y-offset to position images vertically
  images.forEach(img => {
    context.drawImage(img, 0, offsetY, img.naturalWidth, img.naturalHeight); // Draw the image at the current offset
    offsetY += img.naturalHeight; // Update the offset for the next image
  });

  return canvas.toDataURL('image/png'); // Convert the final combined canvas to a data URL and return it
}

// Function to download the combined image
function downloadImage(dataUrl) {
  const downloadLink = document.createElement('a'); // Create an anchor element
  downloadLink.href = dataUrl; // Set the href attribute to the data URL of the combined image
  downloadLink.setAttribute('download', 'combined_image.png'); // Set the download attribute with a file name
  document.body.appendChild(downloadLink); // Append the link to the document body
  downloadLink.click(); // Trigger a click event to initiate the download
  document.body.removeChild(downloadLink); // Remove the link element from the DOM after the download
}



// Function to load an image from a file
function loadImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader(); // Create a new FileReader to read the file
    reader.onload = function(event) {
      const img = new Image(); // Create a new Image object
      img.onload = () => resolve(img); // Resolve the Promise with the image once loaded
      img.src = event.target.result; // Set the image source to the file data
    };
    reader.onerror = reject; // Reject the Promise if there's an error
    reader.readAsDataURL(file); // Read the file as a data URL
  });
}


//listener for submission
concatenateBtn.addEventListener('click', async () => {
  if (selectedImages.length === 0) {
    alert('Please upload at least one image.'); // Alert if no images are selected
    return;
  }

  const combinedImage = combineImages(selectedImages); // Combine the images into one
  downloadImage(combinedImage); // Download the combined image

  // Clear the selected images and remove thumbnails from the DOM after download
  selectedImages = [];
  //hide submit button again :)
  concatenateBtn.style.display="none"
  document.getElementById('image-container').innerHTML = ''; // Clear the image container
});
