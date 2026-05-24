(function () {
  var body = document.querySelector(".page__content-body");
  var list = document.getElementById("blog-toc-list");
  if (!body || !list) return;

  var headings = body.querySelectorAll("h2, h3");
  headings.forEach(function (heading) {
    if (!heading.id) {
      heading.id = heading.textContent
        .trim()
        .toLowerCase()
        .replace(/[^\w\u4e00-\u9fff]+/g, "-")
        .replace(/^-+|-+$/g, "");
    }

    var item = document.createElement("li");
    if (heading.tagName === "H3") {
      item.className = "toc__h3";
    }

    var link = document.createElement("a");
    link.href = "#" + heading.id;
    link.textContent = heading.textContent.trim();
    item.appendChild(link);
    list.appendChild(item);
  });

  var aside = list.closest(".sidebar__right");
  if (aside && !list.children.length) {
    aside.style.display = "none";
  }
})();
