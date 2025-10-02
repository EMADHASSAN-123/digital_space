/* ===============================
   Canvas Particles Animation
   =============================== */
const canvas = document.getElementById("bgCanvas");
const ctx = canvas.getContext("2d");

let particlesArray = [];
const colors = [ "#FFFFFF", "#AAAAAA"];

// ضبط حجم الكانفاس حسب الشاشة
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

window.addEventListener("resize", () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  initParticles();
});

class Particle {
  constructor(x, y, dx, dy, size, color) {
    this.x = x;
    this.y = y;
    this.dx = dx;
    this.dy = dy;
    this.size = size;
    this.color = color;
  }
  draw() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2, false);
    ctx.fillStyle = this.color;
    ctx.fill();
  }
  update() {
    // عكس الاتجاه عند الحواف
    if (this.x + this.size > canvas.width || this.x - this.size < 0) {
      this.dx = -this.dx;
    }
    if (this.y + this.size > canvas.height || this.y - this.size < 0) {
      this.dy = -this.dy;
    }
    this.x += this.dx;
    this.y += this.dy;
    this.draw();
  }
}

// إنشاء الجسيمات
function initParticles() {
  particlesArray = [];
  for (let i = 0; i < 10; i++) {
    const size = Math.random() * 2 + 1;
    const x = Math.random() * (canvas.width - size * 2) + size;
    const y = Math.random() * (canvas.height - size * 2) + size;
    const dx = (Math.random() - 0.5) * 1.5;
    const dy = (Math.random() - 0.5) * 1.5;
    const color = colors[Math.floor(Math.random() * colors.length)];
    particlesArray.push(new Particle(x, y, dx, dy, size, color));
  }
}

// تشغيل الحركة
function animateParticles() {
  requestAnimationFrame(animateParticles);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  particlesArray.forEach((p) => p.update());
}

initParticles();
animateParticles();

/* ===============================
   Mobile Menu Toggle
   =============================== */
const hamburger = document.getElementById("hamburger");
const mobileMenu = document.getElementById("mobile-menu");

hamburger.addEventListener("click", () => {
  // toggle إظهار / إخفاء القائمة
  mobileMenu.classList.toggle("hidden");
  mobileMenu.classList.toggle("flex");

  // تغيير شكل زر القائمة (إضافة/إزالة active)
  hamburger.classList.toggle("active");

  // تحديث ARIA
  const expanded = hamburger.getAttribute("aria-expanded") === "true" || false;
  hamburger.setAttribute("aria-expanded", !expanded);
});
