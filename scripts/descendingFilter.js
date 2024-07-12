/*Searches data annotation for pay filter on projects group
* Automatically clicks through elements to sort by highest paying or "descending"
*
*ISSUE #4 - Home Page not Loading
*
*/
function findPayFilter(){
    const headers = document.querySelectorAll('h3')
    let projectHeader = null;
    let qualHeader = null;

    for(let i=0; i<headers.length;i++){
        if(headers[i].innerText == "Projects"){
            projectHeader = headers[i]
        }
        if(headers[i].innerText == "Qualifications"){
            qualHeader = headers[i]
        }
    }
    console.log(projectHeader,qualHeader)
    if(!projectHeader){
        throw ValueError('Project Header not found')
    }
    if(!qualHeader){
        throw ValueError('Project Header not found')
    }
    const payFilter = projectHeader.parentNode.parentNode.querySelectorAll("button")[1]
    //select project container, then rows inside container, subtract 1 for the header, returns count
    const projectCount  = projectHeader.parentNode.parentNode.querySelectorAll('tr').length -1
    projectHeader.innerText = `Projects (${projectCount})`
    //same logic as above but for qualifications
    const qualCount  = qualHeader.parentNode.parentNode.parentNode.querySelectorAll('tr').length -1
    qualHeader.innerText = `Qualifications (${qualCount})`;
    return payFilter
}



//clicks the payfilter to display filter menu
function clickPayFilter(){
    PAY_FILTER.click()
}

//clicks descending filter option
function clickDescending(){
    const descending= document.getElementsByClassName('tw-flex tw-items-center tw-gap-2 tw-py-1 tw-px-4 tw-transition tw-w-full tw-bg-black-100 hover:tw-bg-white-5')
    descending[2].click()
    descending[2].parentNode.parentNode.style.display = 'none'
    // console.log(descending[2].parentNode.parentNode)
    return descending[2].parentNode.nextSibling
}
//clicks apply in filter menu
function clickApply(parent){
    let applyContainer = parent.children[1]
    let apply = applyContainer.children[0].children[1].children[1]
    apply.click()
}


//create global pay filter variable
const PAY_FILTER = findPayFilter()
function main(){
    clickPayFilter()
    setTimeout(function(){
        let applyParent = clickDescending()
        setTimeout(function(){
            clickApply(applyParent)
            setTimeout(function(){
                clickPayFilter()
            },300)
        },300)
    }, 500);
}
//here we are modifying the qualification container. Often, especially when there are a ton of quals,
//it gets in the way of looking at projects. We are resizing the container, and addind a resize style to it.
let qualContainer = document.querySelector(".sc-dcJsrY.kCfoZC.tw-max-w-full.tw-overflow-x-auto")
    qualContainer.style.height = '155px'
    qualContainer.style.resize ='vertical'

chrome.storage.sync.get(['sortPay'], (result) => {
    if(result.sortPay == undefined || result.sortPay == true)
    {
        main()
    }   
});

