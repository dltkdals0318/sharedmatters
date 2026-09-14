const HOME_INDEX = 0;

const page = document.getElementById("page");
const leftPanel = document.getElementById("leftPanel");
const toc = document.getElementById("toc");
const defaultMenu = document.getElementById("defaultMenu");
const caption = document.getElementById("caption");
const selectedDetail = document.getElementById("selectedDetail");
const lightbox = document.getElementById("lightbox");
const lightboxImage = document.getElementById("lightboxImage");
const detailColumns = [...document.querySelectorAll(".detail-column")];
const workIndexByColumn = [0, 0, 0];
const promptKeys = ["promptA", "promptB", "promptC"];
const promptLabels = ["Prompt A", "Prompt B", "Prompt C"];

function setPageColor(color, textColor = "#111111") {
  document.documentElement.style.setProperty("--page-color", color);
  document.body.style.color = textColor;
  leftPanel.style.color = textColor;
}

function syncTocHighlight() {
  const activeIndexes = new Set(workIndexByColumn);
  [...toc.children].forEach((item, i) => {
    item.setAttribute("aria-pressed", String(activeIndexes.has(i)));
  });
}

function applyColumnColor(colIndex, work) {
  const column = detailColumns[colIndex];
  column.style.setProperty("--column-color", work.bg);
  column.style.color = work.ink;
}

function renderColumn(colIndex) {
  const work = works[workIndexByColumn[colIndex]];
  const column = detailColumns[colIndex];
  const blocks = work.content[promptKeys[colIndex]];
  const label = promptLabels[colIndex];
  const imageCount = blocks.filter((block) => block.type === "image").length;
  let imageIndex = 0;

  applyColumnColor(colIndex, work);
  column.querySelector(".column-title").textContent = work.title;
  column.querySelector(".column-author").textContent = work.author ?? "";

  const blocksContainer = column.querySelector(".detail-blocks");
  blocksContainer.replaceChildren(
    ...blocks.map((block) => {
      if (block.type === "text") {
        const p = document.createElement("p");
        p.className = "detail-text";
        p.textContent = block.text;
        return p;
      }

      if (block.type === "video") {
        const video = document.createElement("video");
        video.className = "detail-video";
        video.src = block.src;
        video.controls = true;
        video.preload = "metadata";
        return video;
      }

      imageIndex += 1;
      const img = document.createElement("img");
      img.className = "detail-image";
      img.src = block.src;
      img.alt =
        imageCount > 1 ? `${work.title} ${label} ${imageIndex}` : `${work.title} ${label}`;
      img.loading = "lazy";
      img.decoding = "async";
      return img;
    }),
  );
}

function selectWork(index) {
  const work = works[index];

  closeLightbox();
  workIndexByColumn.fill(index);

  setPageColor(work.bg, work.ink);
  detailColumns.forEach((_, colIndex) => renderColumn(colIndex));

  selectedDetail.classList.add("is-visible");
  defaultMenu.classList.add("is-hidden");
  caption.style.display = "none";
  page.classList.add("is-selected");

  detailColumns.forEach((column) => {
    column.scrollTop = 0;
  });

  syncTocHighlight();

  history.replaceState(null, "", `#work-${index + 1}`);
}

function nextWorkIndex(current) {
  const next = (current + 1) % works.length;
  return next === HOME_INDEX ? (next + 1) % works.length : next;
}

function advanceColumn(column) {
  if (!page.classList.contains("is-selected")) return;

  closeLightbox();
  const colIndex = detailColumns.indexOf(column);

  workIndexByColumn[colIndex] = nextWorkIndex(workIndexByColumn[colIndex]);
  renderColumn(colIndex);
  syncTocHighlight();

  if (colIndex === 0) {
    const headerWork = works[workIndexByColumn[0]];
    setPageColor(headerWork.bg, headerWork.ink);
    history.replaceState(null, "", `#work-${workIndexByColumn[0] + 1}`);
  }

  column.scrollTop = 0;
}

detailColumns.forEach((column) => {
  const nextButton = column.querySelector(".scroll-next");
  nextButton.addEventListener("click", () => advanceColumn(column));
});

function openLightbox(src, alt) {
  lightboxImage.src = src;
  lightboxImage.alt = alt;
  lightbox.classList.add("is-visible");
}

function closeLightbox() {
  lightbox.classList.remove("is-visible");
  lightboxImage.removeAttribute("src");
}

selectedDetail.addEventListener("click", (event) => {
  const image = event.target.closest(".detail-image");
  if (image) openLightbox(image.src, image.alt);
});

lightbox.addEventListener("click", closeLightbox);

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && lightbox.classList.contains("is-visible")) {
    closeLightbox();
  }
});

function resetPage() {
  if (!page.classList.contains("is-selected")) return;

  closeLightbox();
  selectedDetail.classList.remove("is-visible");

  setPageColor("#FFFFFF", "#111111");

  defaultMenu.classList.remove("is-hidden");
  caption.style.display = "block";
  page.classList.remove("is-selected");

  [...toc.children].forEach((item) => {
    item.setAttribute("aria-pressed", "false");
  });

  history.replaceState(null, "", location.pathname + location.search);
}

works.forEach((work, index) => {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "toc-item";
  button.style.backgroundColor = work.bg;
  button.style.color = work.ink;
  button.setAttribute("aria-pressed", "false");

  const title = document.createElement("span");
  title.className = "work-title";
  title.textContent = work.title;

  button.append(title);
  button.addEventListener("click", () => {
    if (index === HOME_INDEX) {
      resetPage();
    } else {
      selectWork(index);
    }
  });
  toc.appendChild(button);
});

const match = location.hash.match(/^#work-(\d+)$/);
if (match) {
  const index = Number(match[1]) - 1;
  if (works[index] && index !== HOME_INDEX) selectWork(index);
}
