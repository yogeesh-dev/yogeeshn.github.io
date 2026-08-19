/* ---------------- nav background on scroll ---------------- */
const navEl = document.getElementById('nav');
if (navEl) {
    window.addEventListener('scroll', () => {
        navEl.classList.toggle('scrolled', window.scrollY > 40);
    });
}

/* ---------------- conference carousel (conferences.html only) ---------------- */
let currentSlideIndex = 0;
const totalSlides = 2;
function moveSlide(direction) {
    const track = document.getElementById('conference-track');
    if (!track) return;
    const dots = document.querySelectorAll('.carousel-dot');
    currentSlideIndex = (currentSlideIndex + direction + totalSlides) % totalSlides;
    track.style.transform = `translateX(-${currentSlideIndex * 100}%)`;
    dots.forEach((dot, i) => dot.classList.toggle('active', i === currentSlideIndex));
}
