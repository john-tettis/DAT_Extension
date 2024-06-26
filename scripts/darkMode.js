const bg = '#070F2B';
const txt = '#9290C3'
const acc = '#535C91';
const scrll = '#1B1A55';
const nav = '#04091a'
let isDark = false;
const style = document.createElement('style');
style.textContent = `
    /* Set background color and text color for all elements except pre, span and code inside pre, and textarea */
    *:not(pre):not(pre span):not(pre code):not(textarea) {
        background-color: ${bg}!important;
        color: ${txt} !important;
    }
    .navbar.navbar-dark.navbar-inverse.bg-primary.navbar-expand-sm{
        background-color: ${nav}!important;
        color: ${txt} !important;
        }
    .navbar.navbar-dark.navbar-inverse.bg-primary.navbar-expand-sm > *{
        background-color: ${nav}!important;
        color: ${txt} !important;
        }
    textarea {
        background-color:${acc} !important;
    }
    ::-webkit-scrollbar {
    background: ${scrll} !important; /* color of the scrollbar track on hover */
    }
    /* Change the color of the scrollbar handle */
    ::-webkit-scrollbar-thumb {
        background: ${acc} !important; /* color of the scrollbar handle */
    }
        ::-webkit-scrollbar-thumb:hover {
        background: ${txt} !important; /* color of the scrollbar handle */
    }
    
`;


function toggleDarkMode(bool){
    if(bool && !isDark){
        // Append the style element to the document's head to apply the styles
        document.head.appendChild(style);
        isDark = true;
    }
    else{
        style.parentNode.removeChild(style)
        isDark = false
    }


}
chrome.storage.sync.get(['darkMode'],(r)=>{
    toggleDarkMode(r.darkMode || false)
})

chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    const isDarkMode = message.darkMode || false;
    toggleDarkMode(isDarkMode)

});

