// Ask before submitting any form marked data-confirm="Question?".
// (Kept in a file, not inline onsubmit="...", so the CMS's
// Content-Security-Policy can block all inline scripts.)
document.addEventListener("submit", function (event) {
  var form = event.target;
  var question = form && form.getAttribute && form.getAttribute("data-confirm");
  if (question && !window.confirm(question)) {
    event.preventDefault();
  }
});
