// hornof.org — minimal vanilla JS.
// F4: Tardis time-machine — a subtle control that reveals links to the archives.
(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", function () {
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

    // Escape closes and returns focus to the control.
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && isOpen()) close(true);
    });

    // Clicking away closes it.
    document.addEventListener("click", function (e) {
      if (isOpen() && !e.target.closest(".tardis")) close(false);
    });
  });
})();
