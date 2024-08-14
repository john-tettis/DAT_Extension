

// Global array to store selected images
let selectedImages = [];

// Function to handle the image change event
function handleImageChange() {
  const fileInput = document.getElementById('imageInput');
  const imageContainer = document.getElementById('image-container');
  imageContainer.innerHTML = ''; // Clear the container

  for (let i = 0; i < fileInput.files.length; i++) {
    const file = fileInput.files[i];
    const img = new Image();
    img.onload = () => {
      // Create a thumbnail of the image
      const thumbnail = document.createElement('div');
      thumbnail.classList.add('thumbnail');
      thumbnail.appendChild(img);
      // Add a delete button for each thumbnail
      const deleteBtn = document.createElement('button');
      deleteBtn.textContent = 'X';
      deleteBtn.addEventListener('click', () => {
        selectedImages = selectedImages.filter((i) => i !== img);
        thumbnail.remove();
      });
      thumbnail.appendChild(deleteBtn);
      imageContainer.appendChild(thumbnail);
      selectedImages.push(img);
    };
    img.src = URL.createObjectURL(file);
  }
}

// Function to load images
async function loadImages(images) {
  return Promise.all(images.map((img) => new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    ctx.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight);
    canvas.toBlob((blob) => {
      resolve(URL.createObjectURL(blob));
    }, 'image/png');
  })));
}

// Function to draw images on the canvas
function drawImagesOnCanvas(imageURLs) {
  const canvas = document.getElementById('outputCanvas');
  const ctx = canvas.getContext('2d');

  // Get the total width and height of the collage
  let totalWidth = 0;
  let maxHeight = 0;

  imageURLs.forEach((url, index) => {
    const img = new Image();
    img.onload = () => {
      totalWidth += img.naturalWidth;
      if (img.naturalHeight > maxHeight) {
        maxHeight = img.naturalHeight;
      }

      // Check if all images are loaded, then draw on canvas
      if (index === imageURLs.length - 1) {
        canvas.width = totalWidth;
        canvas.height = maxHeight;
        let currentX = 0;
        imageURLs.forEach((url) => {
          const img = new Image();
          img.onload = () => {
            ctx.drawImage(img, currentX, 0, img.naturalWidth, img.naturalHeight);
            currentX += img.naturalWidth;
            // Remove image URL from memory
            URL.revokeObjectURL(url);
          };
          img.src = url;
        });
      }
    };
    img.src = url;
  });
}

// Function to handle the concatenation and download
async function handleConcatenation() {
  try {
    const spinner = document.getElementById('loading-spinner')
    spinner.style.display = 'block';  // Show the spinner
    const imageURLs = await loadImages(selectedImages);
    drawImagesOnCanvas(imageURLs);

    const canvas = document.getElementById('outputCanvas');
    const imageURL = canvas.toDataURL('image/png');
    const downloadLink = document.createElement('a');
    downloadLink.href = imageURL;
    downloadLink.setAttribute('download', 'concatenated_image.png');
    document.body.appendChild(downloadLink);
    downloadLink.click();
    spinner.style.display = 'none';  // Show the spinner
    // Remove the link after downloading
    document.body.removeChild(downloadLink); 
  } catch (error) { 
    console.error('Error occurred:', error);
  }
}

const concatenateBtn = document.getElementById('concatenateBtn');  
concatenateBtn.addEventListener('click', handleConcatenation);
