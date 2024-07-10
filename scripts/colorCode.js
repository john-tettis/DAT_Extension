

const priorities = ['Achilles']


function getProjects(){
    const headers = document.querySelectorAll('h3')
    let projectHeader = null;

    for(let i=1; i<headers.length;i++){
        if(headers[i].innerText.startsWith("Projects")){
            projectHeader = headers[i]
        }
        
    }
    // console.log(projectHeader,qualHe)
    if(!projectHeader){
        console.log('Project Header not found')
        return

    }
    console.log("BANNSNSIFJBNSIFJBNGFESIJJBNEFIJnj")
    const projects  = projectHeader.parentNode.parentNode.querySelectorAll('tr')
    console.log(projects)
    console.log(projects.length)
    for(let j=0;j<projects.length;j++){
        const text = projects[j].innerText
        console.log(text)
    }
}
getProjects()
