const { chromium } = require("playwright");
const assert = require("node:assert/strict");

const themes = [
  { slug: "karsa", marker: "#open-btn", open: "#open-btn", cover: "#cover" },
  { slug: "royal-vintage", marker: ".invitation-container", open: null, cover: null },
  { slug: "sirein", marker: ".sirein-cover", open: "#open-invitation-btn", cover: "#cover-section" },
  { slug: "groom", marker: ".sirein-cover", open: "#open-invitation-btn", cover: "#cover-section" },
  { slug: "aksara-signature", marker: ".invite-shell", open: "#open-invitation-btn", cover: "#cover-section" },
  { slug: "botanical-garden", marker: ".invite-shell", open: "#open-invitation-btn", cover: "#cover-section" },
  { slug: "velvet-romance", marker: ".invite-shell", open: "#open-invitation-btn", cover: "#cover-section" },
  { slug: "romantic-floral", marker: ".invite-shell", open: "#open-invitation-btn", cover: "#cover-section" },
  { slug: "elegance", marker: ".invite-shell", open: "#open-invitation-btn", cover: "#cover-section" },
  { slug: "aurelia-noir", marker: ".invite-shell", open: "#open-invitation-btn", cover: "#cover-section" },
  { slug: "lumiere-bloom", marker: ".invite-shell", open: "#open-invitation-btn", cover: "#cover-section" },
  { slug: "aksara-nocturne", marker: ".nocturne", open: "#open-btn", cover: "#cover" }
];