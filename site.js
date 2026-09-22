"use strict";
const filters = document.querySelectorAll("[data-filter]");
const papers = document.querySelectorAll("[data-topics]");
filters.forEach((button) => {
  button.addEventListener("click", () => {
    const topic = button.dataset.filter;
    filters.forEach((item) => item.setAttribute("aria-pressed", String(item === button)));
    papers.forEach((paper) => {
      paper.hidden = topic !== "all" && !paper.dataset.topics.split(" ").includes(topic);
    });
    const status = document.getElementById("filter-status");
    if (status) status.textContent = `${[...papers].filter((paper) => !paper.hidden).length} projects shown`;
  });
});

const figures = document.querySelectorAll("[data-zoom]");
if (figures.length && typeof HTMLDialogElement !== "undefined") {
  const dialog = document.createElement("dialog");
  dialog.className = "image-dialog";
  dialog.setAttribute("aria-label", "Enlarged research figure");
  const close = document.createElement("button");
  close.className = "close-dialog";
  close.type = "button";
  close.setAttribute("aria-label", "Close enlarged figure");
  close.textContent = "×";
  const image = document.createElement("img");
  const caption = document.createElement("p");
  caption.className = "dialog-caption";
  dialog.append(close, image, caption);
  document.body.append(dialog);
  close.addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", (event) => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
  });
  figures.forEach((link) => link.addEventListener("click", (event) => {
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    image.src = link.href;
    image.alt = link.querySelector("img").alt;
    caption.textContent = image.alt;
    dialog.showModal();
  }));
}
