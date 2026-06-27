/* Arcwell Systems — minimal progressive-enhancement script.
   No third-party libraries, no analytics, no network calls. */
(function () {
  "use strict";

  // Mobile navigation toggle
  var toggle = document.querySelector(".nav-toggle");
  var links = document.getElementById("nav-links");
  if (toggle && links) {
    toggle.addEventListener("click", function () {
      var open = links.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    links.addEventListener("click", function (e) {
      if (e.target.tagName === "A") {
        links.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  // Current year in footers
  var years = document.querySelectorAll("[data-year]");
  var y = String(new Date().getFullYear());
  for (var i = 0; i < years.length; i++) { years[i].textContent = y; }

  // Lightweight reveal-on-scroll (respects reduced-motion via CSS)
  var revealEls = document.querySelectorAll(".reveal");
  if (revealEls.length && "IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: "0px 0px -10% 0px", threshold: 0.1 });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    for (var j = 0; j < revealEls.length; j++) { revealEls[j].classList.add("is-visible"); }
  }

  // Contact form: client-side only confirmation (static site, no backend)
  var form = document.getElementById("contact-form");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }
      var status = document.getElementById("form-status");
      if (status) {
        status.textContent = "Thank you — your message has been prepared. " +
          "Please send it to hello@arcwellsystems.com and we'll reply within one business day.";
        status.classList.add("show", "ok");
        status.setAttribute("role", "status");
      }
      form.reset();
    });
  }
})();
