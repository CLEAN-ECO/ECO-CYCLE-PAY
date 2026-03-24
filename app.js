let index = 0;

function startSlideshow() {
  const slides = document.querySelectorAll(".slide");

  function showSlides() {
    slides.forEach(s => s.classList.remove("active"));
    index = (index + 1) % slides.length;
    slides[index].classList.add("active");
  }

  if (slides.length > 0) {
    slides[0].classList.add("active");
    setInterval(showSlides, 3000);
  }
}

function go(page) {
  window.location.href = page;
}