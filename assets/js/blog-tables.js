(function () {
  var body = document.querySelector(".page__content-body");
  if (!body) return;

  body.querySelectorAll(":scope > table").forEach(function (table) {
    var wrap = document.createElement("div");
    wrap.className = "table-wrap";
    table.parentNode.insertBefore(wrap, table);
    wrap.appendChild(table);
  });
})();
