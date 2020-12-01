const forms = document.getElementsByTagName("form");
for (let form of forms) {
    const input = form.querySelector('input');
    input.value = '';
    const span = form.querySelector('span');
    input.addEventListener('input', function (event) {
        span.innerHTML = this.value.replace(/\s/g, '&nbsp;');
        this.style.width = span.clientWidth + 'px';
        this.parentElement.classList.remove("filled");
        if(span.innerHTML.trim() !== ""){
            this.parentElement.classList.add("filled");
        }
    });

    input.addEventListener('focusout', (event) => {
        if(allFilled()){
            document.body.classList.add("complete");
            trimWidths();
        }else{
            document.body.classList.remove("complete");
        }
    });
}


let allFilled = () => {
    let r = false;
    let form = document.querySelectorAll('form');
    let filled = document.querySelectorAll('form.filled');
    console.log(form);
    console.log(filled);
    if(form.length == filled.length){
        r = true;
    }

    return r;
}

let trimWidths = () => {
    for (let form of forms) {
        const input = form.querySelector('input');
        const span = form.querySelector('span');
        span.style.minWidth = "auto"; 

        input.style.width = span.clientWidth + "px";
        input.disabled = true;
    }
}