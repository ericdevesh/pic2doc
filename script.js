// ============================================================
// Pic2Doc — App logic
// Upload images -> build a PDF client-side with jsPDF -> download.
// ============================================================
(function () {
  "use strict";

  var dropzone = document.getElementById("dropzone");
  var fileInput = document.getElementById("fileInput");
  var listEl = document.getElementById("list");
  var listSummary = document.getElementById("listSummary");
  var imageCountEl = document.getElementById("imageCount");
  var clearAllBtn = document.getElementById("clearAllBtn");
  var convertBtn = document.getElementById("convertBtn");
  var downloadBtn = document.getElementById("downloadBtn");
  var statusEl = document.getElementById("status");
  var steps = document.querySelectorAll(".steps .step");

  var images = []; // { id, file, url, name }
  var pdfBlob = null;
  var pdfUrl = null;

  var SUPPORTED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
  var MAX_FILE_SIZE = 25 * 1024 * 1024;

  function setStatus(message, type) {
    statusEl.textContent = message || "";
    statusEl.className = type || "";
  }

  function setStep(activeIndex) {
    steps.forEach(function (el, i) {
      el.classList.toggle("is-active", i <= activeIndex);
    });
  }

  function makeId() {
    return "img_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 8);
  }

  function resetDownload() {
    if (pdfUrl) {
      URL.revokeObjectURL(pdfUrl);
      pdfUrl = null;
    }
    pdfBlob = null;
    downloadBtn.style.display = "none";
  }

  function renderList() {
    listEl.innerHTML = "";

    images.forEach(function (img, index) {
      var li = document.createElement("li");
      li.className = "thumb";
      li.setAttribute("data-id", img.id);

      var thumbImg = document.createElement("img");
      thumbImg.src = img.url;
      thumbImg.alt = img.name;
      li.appendChild(thumbImg);

      var badge = document.createElement("span");
      badge.className = "thumb__badge";
      badge.textContent = String(index + 1);
      li.appendChild(badge);

      var removeBtn = document.createElement("button");
      removeBtn.type = "button";
      removeBtn.className = "thumb__remove";
      removeBtn.setAttribute("aria-label", "Remove " + img.name);
      removeBtn.innerHTML = "&#10005;";
      removeBtn.addEventListener("click", function (e) {
        e.stopPropagation();
        URL.revokeObjectURL(img.url);
        images = images.filter(function (i) { return i.id !== img.id; });
        renderList();
      });
      li.appendChild(removeBtn);

      var nameTag = document.createElement("span");
      nameTag.className = "thumb__name";
      nameTag.textContent = img.name;
      li.appendChild(nameTag);

      listEl.appendChild(li);
    });

    var hasImages = images.length > 0;

    dropzone.classList.toggle("has-images", hasImages);
    listSummary.style.display = hasImages ? "flex" : "none";
    imageCountEl.textContent = images.length + (images.length === 1 ? " image" : " images");
    convertBtn.disabled = !hasImages;

    setStep(hasImages ? 1 : 0);
    resetDownload();
    setStatus("");
  }

  function handleFiles(fileList) {
    var files = Array.prototype.slice.call(fileList || []);
    if (files.length === 0) return;

    var errors = [];

    files.forEach(function (file) {
      if (SUPPORTED_TYPES.indexOf(file.type) === -1) {
        errors.push('"' + file.name + '" is not a supported image type.');
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        errors.push('"' + file.name + '" is too large (max 25 MB).');
        return;
      }
      try {
        var url = URL.createObjectURL(file);
        images.push({ id: makeId(), file: file, url: url, name: file.name });
      } catch (err) {
        errors.push('Could not read "' + file.name + '".');
      }
    });

    renderList();

    if (errors.length > 0) {
      setStatus(
        errors[0] +
          (errors.length > 1
            ? " (" + (errors.length - 1) + " more issue" + (errors.length - 1 === 1 ? "" : "s") + ")"
            : ""),
        "error"
      );
    }
  }

  dropzone.addEventListener("click", function () {
    fileInput.click();
  });

  dropzone.addEventListener("keydown", function (e) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      fileInput.click();
    }
  });

  fileInput.addEventListener("change", function (e) {
    handleFiles(e.target.files);
    fileInput.value = "";
  });

  ["dragenter", "dragover"].forEach(function (evt) {
    dropzone.addEventListener(evt, function (e) {
      e.preventDefault();
      dropzone.classList.add("drag");
    });
  });

  ["dragleave", "dragend"].forEach(function (evt) {
    dropzone.addEventListener(evt, function (e) {
      e.preventDefault();
      dropzone.classList.remove("drag");
    });
  });

  dropzone.addEventListener("drop", function (e) {
    e.preventDefault();
    dropzone.classList.remove("drag");
    if (e.dataTransfer && e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files);
    }
  });

  ["dragover", "drop"].forEach(function (evt) {
    window.addEventListener(evt, function (e) {
      e.preventDefault();
    });
  });

  clearAllBtn.addEventListener("click", function () {
    images.forEach(function (img) { URL.revokeObjectURL(img.url); });
    images = [];
    renderList();
  });

  function loadImageEl(url) {
    return new Promise(function (resolve, reject) {
      var img = new Image();
      img.onload = function () {
        resolve(img);
      };
      img.onerror = function () {
        reject(new Error("load failed"));
      };
      img.src = url;
    });
  }

  function buildPdf() {
    if (!window.jspdf || !window.jspdf.jsPDF) {
      return Promise.reject(new Error("PDF engine failed to load. Check your connection and try again."));
    }
    if (images.length === 0) {
      return Promise.reject(new Error("Add at least one image first."));
    }

    var jsPDF = window.jspdf.jsPDF;
    var doc = null;
    var A4_W = 595.28;
    var A4_H = 841.89;
    var MARGIN = 24;

    var chain = Promise.resolve();

    images.forEach(function (record, index) {
      chain = chain.then(function () {
        return loadImageEl(record.url).then(function (imgEl) {
          var isLandscape = imgEl.naturalWidth > imgEl.naturalHeight;
          var pageW = isLandscape ? A4_H : A4_W;
          var pageH = isLandscape ? A4_W : A4_H;
          var orientation = isLandscape ? "l" : "p";

          if (!doc) {
            doc = new jsPDF({ unit: "pt", format: [pageW, pageH], orientation: orientation });
          } else {
            doc.addPage([pageW, pageH], orientation);
          }

          var usableW = pageW - MARGIN * 2;
          var usableH = pageH - MARGIN * 2;
          var scale = Math.min(usableW / imgEl.naturalWidth, usableH / imgEl.naturalHeight);
          var drawW = imgEl.naturalWidth * scale;
          var drawH = imgEl.naturalHeight * scale;
          var x = (pageW - drawW) / 2;
          var y = (pageH - drawH) / 2;

          doc.setFillColor(255, 255, 255);
          doc.rect(0, 0, pageW, pageH, "F");

          var format = record.file.type === "image/png" ? "PNG" : "JPEG";
          doc.addImage(imgEl, format, x, y, drawW, drawH, undefined, "FAST");

          setStatus("Preparing your PDF\u2026 (" + (index + 1) + "/" + images.length + ")");
        });
      });
    });

    return chain.then(function () {
      return doc.output("blob");
    });
  }

  function fireConfetti() {
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    var colors = ["#7C5CFC", "#4FD1C5", "#22C55E", "#F5F7FA", "#6847E8"];
    var count = 28;
    for (var i = 0; i < count; i += 1) {
      (function () {
        var piece = document.createElement("span");
        piece.className = "confetti-piece";
        piece.style.left = Math.random() * 100 + "vw";
        piece.style.background = colors[Math.floor(Math.random() * colors.length)];
        piece.style.animationDuration = 1.6 + Math.random() * 1.2 + "s";
        piece.style.animationDelay = Math.random() * 0.25 + "s";
        piece.style.opacity = String(0.7 + Math.random() * 0.3);
        document.body.appendChild(piece);
        setTimeout(function () {
          piece.remove();
        }, 3200);
      })();
    }
  }

  convertBtn.addEventListener("click", function () {
    if (images.length === 0) {
      setStatus("Upload at least one image first.", "error");
      return;
    }

    convertBtn.disabled = true;
    convertBtn.classList.add("is-loading");
    resetDownload();
    setStatus("Preparing your PDF\u2026");

    buildPdf()
      .then(function (blob) {
        pdfBlob = blob;
        pdfUrl = URL.createObjectURL(blob);
        downloadBtn.style.display = "inline-flex";
        setStatus("Your PDF is ready.", "success");
        setStep(2);
        fireConfetti();
      })
      .catch(function (err) {
        setStatus(err && err.message ? err.message : "Something went wrong. Please try again.", "error");
      })
      .finally(function () {
        convertBtn.disabled = images.length === 0;
        convertBtn.classList.remove("is-loading");
      });
  });

  downloadBtn.addEventListener("click", function () {
    if (!pdfBlob || !pdfUrl) return;
    var a = document.createElement("a");
    a.href = pdfUrl;
    a.download = "pic2doc-export.pdf";
    document.body.appendChild(a);
    a.click();
    a.remove();
  });

  renderList();
})();
