(function () {
  var section = document.querySelector(".publication-citation");
  if (!section) return;

  var feedback = section.querySelector(".publication-citation__feedback");
  var feedbackTimer;

  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text);
    }
    return new Promise(function (resolve, reject) {
      var ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy") ? resolve() : reject();
      } catch (e) {
        reject(e);
      } finally {
        document.body.removeChild(ta);
      }
    });
  }

  function showFeedback(btn, message) {
    if (feedback) {
      feedback.textContent = message;
      feedback.hidden = false;
      clearTimeout(feedbackTimer);
      feedbackTimer = setTimeout(function () {
        feedback.hidden = true;
      }, 2000);
    }
    if (btn) {
      btn.classList.add("is-copied");
      setTimeout(function () {
        btn.classList.remove("is-copied");
      }, 2000);
    }
  }

  section.addEventListener("click", function (e) {
    var btn = e.target.closest(".publication-citation__btn");
    if (!btn) return;

    var kind = btn.getAttribute("data-copy");
    var sourceId = kind === "bibtex" ? "bibtex-copy-source" : "citation-copy-source";
    var source = document.getElementById(sourceId);
    if (!source || !source.value) return;

    copyText(source.value)
      .then(function () {
        showFeedback(btn, "Copied!");
      })
      .catch(function () {
        showFeedback(btn, "Copy failed");
      });
  });
})();
