function findModelResponses(markdown){
    let responses =[];
    if(markdown.length <0){
      markdown.forEach(el=>{
        el.children.forEach((child)=>{
         if(child.nodeName == "CODE"){
           responses.append(child)
         }
        })
     })
    }
    return responses
  
  }
  
  let markdown = document.getElementsByClassName("rendered-markdown")
  console.log(markdown)
  let responses = findModelResponses(markdown)
  console.log(responses)

  var observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      mutation.addedNodes.forEach(function(addedNode) {
        if(addedNode.nodeName ==""){
          
        }
      });
    });
  });
  
  observer.observe(document.body, {childList: true, subtree: true});