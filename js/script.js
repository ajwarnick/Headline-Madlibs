const forms = document.getElementsByTagName("form");
for (let form of forms) {
    const input = form.querySelector('input');
    const span = form.querySelector('span');
    input.addEventListener('input', function (event) {
        span.innerHTML = this.value.replace(/\s/g, '&nbsp;');
        this.style.width = span.offsetWidth + 'px';
    });
}