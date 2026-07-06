// hornof.org — minimal vanilla JS. No dependencies.
(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", function () {
    initTheme();
    initTardis();
    initScrollSpy();
  });

  // F7: dark/light toggle. The head script already resolved data-theme before
  // paint (localStorage → OS preference); here we just wire the button and keep
  // its label / aria-pressed in sync, persisting the user's choice.
  function initTheme() {
    var toggle = document.querySelector(".theme-toggle");
    if (!toggle) return;
    var root = document.documentElement;

    function current() {
      return root.getAttribute("data-theme") === "dark" ? "dark" : "light";
    }
    function sync() {
      var dark = current() === "dark";
      toggle.setAttribute("aria-pressed", dark ? "true" : "false");
      toggle.setAttribute(
        "aria-label",
        dark ? "Switch to light theme" : "Switch to dark theme"
      );
    }
    function set(theme) {
      root.setAttribute("data-theme", theme);
      try {
        localStorage.setItem("theme", theme);
      } catch (e) {
        /* private mode / storage disabled — the toggle still works in-session */
      }
      sync();
    }

    sync(); // reflect the pre-paint theme in the button on load
    toggle.addEventListener("click", function () {
      set(current() === "dark" ? "light" : "dark");
    });
  }

  // F4: Tardis time-machine — a subtle control revealing links to the archives.
  function initTardis() {
    var toggle = document.querySelector(".tardis-toggle");
    var panel = document.getElementById("tardis-panel");
    if (!toggle || !panel) return;

    function isOpen() {
      return toggle.getAttribute("aria-expanded") === "true";
    }
    function open() {
      panel.hidden = false;
      toggle.setAttribute("aria-expanded", "true");
    }
    function close(returnFocus) {
      panel.hidden = true;
      toggle.setAttribute("aria-expanded", "false");
      if (returnFocus) toggle.focus();
    }

    // Native <button> fires click on Enter/Space, so this covers keyboard too.
    toggle.addEventListener("click", function () {
      if (isOpen()) close(false);
      else open();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && isOpen()) close(true);
    });
    document.addEventListener("click", function (e) {
      if (isOpen() && !e.target.closest(".tardis")) close(false);
    });
  }

  // F5: scroll-spy — highlight the nav link for the section currently in view.
  function initScrollSpy() {
    var links = Array.prototype.slice.call(
      document.querySelectorAll(".section-nav a")
    );
    if (!links.length) return;

    var sections = links
      .map(function (a) {
        return document.querySelector(a.getAttribute("href"));
      })
      .filter(Boolean);
    if (!sections.length) return;

    function setActive(id) {
      links.forEach(function (a) {
        var on = a.getAttribute("href") === "#" + id;
        a.classList.toggle("active", on);
        if (on) a.setAttribute("aria-current", "true");
        else a.removeAttribute("aria-current");
      });
    }

    // A thin band a bit above the middle of the viewport is the "spy line": the
    // section crossing it is the active one.
    if ("IntersectionObserver" in window) {
      var observer = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) setActive(entry.target.id);
          });
        },
        { rootMargin: "-40% 0px -55% 0px", threshold: 0 }
      );
      sections.forEach(function (s) {
        observer.observe(s);
      });
    }

    // Guard the extremes so the first/last section win at the very top/bottom,
    // where the spy line may sit past the edge of the document.
    var last = sections[sections.length - 1];
    var first = sections[0];
    function edgeGuard() {
      var doc = document.documentElement;
      var atBottom =
        window.innerHeight + window.scrollY >= doc.scrollHeight - 2;
      if (atBottom) setActive(last.id);
      else if (window.scrollY <= 2) setActive(first.id);
    }
    window.addEventListener("scroll", edgeGuard, { passive: true });
    edgeGuard(); // set initial state on load
  }
})();
