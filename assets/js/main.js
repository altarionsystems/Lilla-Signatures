/* ============================================================
   Lilla Signatures — interaction layer
   ============================================================ */
(function () {
  "use strict";
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- NAV: scrolled / at-top state ---------- */
  var nav = document.querySelector(".nav");
  var banner = document.querySelector(".hero") || document.querySelector(".page-header");
  function onScroll() {
    var y = window.scrollY || window.pageYOffset;
    nav.classList.toggle("scrolled", y > 40);
    // "at-top" = transparent look while the dark banner (hero or page header) is in view
    var bannerBottom = banner ? banner.offsetHeight - 90 : 0;
    nav.classList.toggle("at-top", y < bannerBottom);
  }
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* ---------- Mobile menu ---------- */
  var toggle = document.querySelector(".nav-toggle");
  var menu = document.querySelector(".mobile-menu");
  function setMenu(open) {
    menu.classList.toggle("open", open);
    document.body.classList.toggle("menu-open", open);
    toggle.setAttribute("aria-expanded", String(open));
  }
  if (toggle && menu) {
    toggle.addEventListener("click", function () {
      setMenu(!menu.classList.contains("open"));
    });
    menu.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () { setMenu(false); });
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") setMenu(false);
    });
  }

  /* ---------- Scroll reveal ---------- */
  var reveals = document.querySelectorAll(".reveal");
  if (reduceMotion || !("IntersectionObserver" in window)) {
    reveals.forEach(function (el) { el.classList.add("in-view"); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add("in-view");
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    reveals.forEach(function (el) { io.observe(el); });
  }

  /* ---------- Services: hover/focus preview crossfade ---------- */
  var svcItems = document.querySelectorAll(".svc-item");
  var pvImgs = document.querySelectorAll(".services-preview img");
  var pvCap = document.querySelector(".services-preview .pv-cap");
  function activateService(idx) {
    svcItems.forEach(function (it, i) { it.classList.toggle("active", i === idx); });
    pvImgs.forEach(function (im, i) { im.classList.toggle("active", i === idx); });
    if (pvCap && svcItems[idx]) pvCap.textContent = svcItems[idx].getAttribute("data-name") || "";
  }
  svcItems.forEach(function (it, i) {
    var btn = it.querySelector("button");
    btn.addEventListener("mouseenter", function () { activateService(i); });
    btn.addEventListener("focus", function () { activateService(i); });
  });
  if (svcItems.length) activateService(0);

  /* ---------- Portfolio filter with FLIP reflow ---------- */
  var filters = document.querySelectorAll(".filter");
  var mosaic = document.querySelector(".mosaic");
  var tiles = mosaic ? Array.prototype.slice.call(mosaic.querySelectorAll(".tile")) : [];
  var emptyMsg = document.querySelector(".pf-empty");

  // tile counts per category
  var counts = {};
  tiles.forEach(function (t) {
    var c = t.getAttribute("data-cat");
    counts[c] = (counts[c] || 0) + 1;
  });
  filters.forEach(function (f) {
    var cat = f.getAttribute("data-filter");
    var cntEl = f.querySelector(".cnt");
    if (cntEl) cntEl.textContent = cat === "all" ? tiles.length : (counts[cat] || 0);
  });

  function applyFilter(cat) {
    var visibleCount = 0;
    // FLIP: record first rects of tiles currently shown
    var first = {};
    tiles.forEach(function (t, i) {
      if (!t.classList.contains("is-hidden")) first[i] = t.getBoundingClientRect();
    });

    tiles.forEach(function (t) {
      var match = cat === "all" || t.getAttribute("data-cat") === cat;
      t.classList.toggle("is-hidden", !match);
      if (match) visibleCount++;
    });
    if (emptyMsg) emptyMsg.style.display = visibleCount ? "none" : "block";

    if (reduceMotion) return;

    // FLIP: read new rects, invert + play
    tiles.forEach(function (t, i) {
      if (t.classList.contains("is-hidden")) return;
      var last = t.getBoundingClientRect();
      if (first[i]) {
        var dx = first[i].left - last.left;
        var dy = first[i].top - last.top;
        if (dx || dy) {
          t.style.transition = "none";
          t.style.transform = "translate(" + dx + "px," + dy + "px)";
          requestAnimationFrame(function () {
            t.style.transition = "transform .55s cubic-bezier(.22,.61,.36,1)";
            t.style.transform = "";
          });
        }
      } else {
        // newly appearing
        t.classList.add("flip-fade");
        requestAnimationFrame(function () {
          t.style.transition = "opacity .5s ease, transform .5s cubic-bezier(.22,.61,.36,1)";
          t.classList.remove("flip-fade");
        });
      }
    });
  }

  filters.forEach(function (f) {
    f.addEventListener("click", function () {
      filters.forEach(function (x) { x.setAttribute("aria-pressed", "false"); });
      f.setAttribute("aria-pressed", "true");
      applyFilter(f.getAttribute("data-filter"));
    });
  });

  // Apply a filter from the URL (e.g. portfolio.html?cat=weddings or #weddings)
  if (filters.length) {
    var params = new URLSearchParams(window.location.search);
    var wanted = (params.get("cat") || window.location.hash.replace("#", "") || "").toLowerCase();
    if (wanted) {
      var target = Array.prototype.filter.call(filters, function (f) { return f.getAttribute("data-filter") === wanted; })[0];
      if (target) target.click();
    }
  }

  /* ---------- Lightbox ---------- */
  var lb = document.querySelector(".lightbox");
  if (lb) {
    var lbImg = lb.querySelector(".lb-stage img");
    var lbT = lb.querySelector(".lb-cap .t");
    var lbC = lb.querySelector(".lb-cap .c");
    var lbCount = lb.querySelector(".lb-count");
    var current = 0;

    function visibleTiles() {
      return tiles.filter(function (t) { return !t.classList.contains("is-hidden"); });
    }
    function show(idx) {
      var vis = visibleTiles();
      if (!vis.length) return;
      current = (idx + vis.length) % vis.length;
      var t = vis[current];
      var img = t.querySelector("img");
      lbImg.src = img.getAttribute("data-full") || img.src;
      lbImg.alt = img.alt;
      lbT.textContent = t.getAttribute("data-title") || "";
      lbC.textContent = t.getAttribute("data-cat-label") || "";
      lbCount.textContent = String(current + 1).padStart(2, "0") + " / " + String(vis.length).padStart(2, "0");
    }
    function openLb(t) {
      var vis = visibleTiles();
      var idx = vis.indexOf(t);
      if (idx < 0) return;
      show(idx);
      lb.classList.add("open");
      document.body.classList.add("menu-open");
      lb.querySelector(".lb-close").focus();
    }
    function closeLb() {
      lb.classList.remove("open");
      document.body.classList.remove("menu-open");
    }
    tiles.forEach(function (t) {
      t.addEventListener("click", function () { openLb(t); });
      t.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openLb(t); }
      });
    });
    lb.querySelector(".lb-close").addEventListener("click", closeLb);
    lb.querySelector(".lb-next").addEventListener("click", function () { show(current + 1); });
    lb.querySelector(".lb-prev").addEventListener("click", function () { show(current - 1); });
    lb.addEventListener("click", function (e) { if (e.target === lb) closeLb(); });
    document.addEventListener("keydown", function (e) {
      if (!lb.classList.contains("open")) return;
      if (e.key === "Escape") closeLb();
      if (e.key === "ArrowRight") show(current + 1);
      if (e.key === "ArrowLeft") show(current - 1);
    });
  }

  /* ---------- Contact form (UI-only validation + success) ---------- */
  var form = document.querySelector(".contact-form");
  if (form) {
    var success = form.querySelector(".form-success");
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var valid = true;
      form.querySelectorAll("[required]").forEach(function (input) {
        var field = input.closest(".field");
        var ok = input.value.trim() !== "";
        if (ok && input.type === "email") ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value.trim());
        field.classList.toggle("error", !ok);
        if (!ok) valid = false;
      });
      if (!valid) {
        var firstErr = form.querySelector(".field.error input, .field.error select, .field.error textarea");
        if (firstErr) firstErr.focus();
        return;
      }
      form.querySelectorAll(".field").forEach(function (f) { f.style.display = "none"; });
      form.querySelector(".form-foot").style.display = "none";
      if (success) success.classList.add("show");
    });
    form.querySelectorAll("input, select, textarea").forEach(function (input) {
      input.addEventListener("input", function () {
        var field = input.closest(".field");
        if (field) field.classList.remove("error");
      });
    });
  }

  /* ---------- Footer year ---------- */
  var yearEl = document.querySelector("[data-year]");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- Booking: preselect event type from URL ---------- */
  var typeSelect = document.querySelector("#f-type");
  if (typeSelect) {
    var bp = new URLSearchParams(window.location.search);
    var t = (bp.get("type") || window.location.hash.replace("#", "") || "").toLowerCase();
    if (t) {
      Array.prototype.forEach.call(typeSelect.options, function (opt) {
        var key = (opt.getAttribute("data-key") || opt.value).toLowerCase();
        if (key === t) {
          typeSelect.value = opt.value;
          var fld = typeSelect.closest(".field");
          if (fld) { fld.style.transition = "background .6s ease"; fld.style.background = "rgba(204,0,0,.06)"; setTimeout(function(){ fld.style.background=""; }, 1400); }
        }
      });
    }
  }
})();
