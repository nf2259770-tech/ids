document.documentElement.classList.add('js-ready');

const prefersLessMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const slideObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) entry.target.classList.add('is-entered');
  });
}, { threshold: 0.12 });
document.querySelectorAll('.slide').forEach((slide) => slideObserver.observe(slide));

const caseSlides = Array.from(document.querySelectorAll('.case-slide'));
const syncCaseSlide = () => {
  const previousOpen = document.body.classList.contains('case-open');
  const routeId = decodeURIComponent(window.location.hash.slice(1));
  const activeCase = caseSlides.find((slide) => slide.id === routeId);
  caseSlides.forEach((slide) => slide.classList.toggle('is-open', slide === activeCase));
  document.body.classList.toggle('case-open', Boolean(activeCase));
  if (!activeCase && previousOpen && (routeId === 'cases' || routeId === 'works')) {
    document.getElementById(routeId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
};
document.addEventListener('click', (event) => {
  const link = event.target.closest('a[href^="#"]');
  if (!link) return;
  const targetId = link.getAttribute('href').slice(1);
  const opensCase = caseSlides.some((slide) => slide.id === targetId);
  const closesCase = Boolean(link.closest('.case-slide')) && !opensCase;
  if (!opensCase && !closesCase) return;
  event.preventDefault();
  if (window.location.hash !== link.hash) history.pushState(null, '', link.hash);
  syncCaseSlide();
});
window.addEventListener('hashchange', syncCaseSlide);
window.addEventListener('popstate', syncCaseSlide);
syncCaseSlide();

const progressFill = document.querySelector('.scroll-progress span');
const updatePageProgress = () => {
  const scrollable = document.documentElement.scrollHeight - window.innerHeight;
  const progress = scrollable > 0 ? (window.scrollY / scrollable) * 100 : 0;
  if (progressFill) progressFill.style.width = progress + '%';
};
window.addEventListener('scroll', updatePageProgress, { passive: true });
updatePageProgress();

const carousel = document.querySelector('.carousel-track');
const videoCards = Array.from(document.querySelectorAll('[data-video-card]'));
const currentLabel = document.querySelector('[data-current-slide]');
const totalLabel = document.querySelector('[data-total-slides]');
const carouselProgress = document.querySelector('.carousel-progress span');
if (totalLabel) totalLabel.textContent = String(videoCards.length).padStart(2, '0');

const updateCarouselPosition = () => {
  if (!carousel || !videoCards.length) return;
  const firstCard = videoCards[0];
  const style = window.getComputedStyle(carousel);
  const gap = parseFloat(style.columnGap || style.gap || '0') || 0;
  const step = firstCard.getBoundingClientRect().width + gap;
  const active = Math.min(videoCards.length, Math.max(1, Math.round(carousel.scrollLeft / step) + 1));
  if (currentLabel) currentLabel.textContent = String(active).padStart(2, '0');
  if (carouselProgress) {
    const percent = Math.max(8.3, Math.min(100, (active / videoCards.length) * 100));
    carouselProgress.style.width = percent + '%';
  }
};
carousel?.addEventListener('scroll', updateCarouselPosition, { passive: true });
window.addEventListener('resize', updateCarouselPosition);
document.querySelectorAll('.carousel-arrow').forEach((arrow) => {
  arrow.addEventListener('click', () => {
    if (!carousel || !videoCards.length) return;
    const style = window.getComputedStyle(carousel);
    const gap = parseFloat(style.columnGap || style.gap || '0') || 0;
    const step = videoCards[0].getBoundingClientRect().width + gap;
    carousel.scrollBy({ left: Number(arrow.dataset.direction) * step, behavior: 'smooth' });
  });
});

let pointerStartX = 0;
let scrollStart = 0;
let pointerDown = false;
let draggedFar = false;
let suppressCardClick = false;
carousel?.addEventListener('pointerdown', (event) => {
  if (event.pointerType === 'touch' || event.button !== 0) return;
  pointerDown = true;
  draggedFar = false;
  pointerStartX = event.clientX;
  scrollStart = carousel.scrollLeft;
});
window.addEventListener('pointermove', (event) => {
  if (!pointerDown || !carousel) return;
  const delta = event.clientX - pointerStartX;
  if (Math.abs(delta) > 7) {
    draggedFar = true;
    carousel.classList.add('is-dragging');
    carousel.scrollLeft = scrollStart - delta;
    event.preventDefault();
  }
}, { passive: false });
const stopCarouselDrag = () => {
  if (!pointerDown) return;
  pointerDown = false;
  carousel?.classList.remove('is-dragging');
  if (draggedFar) {
    suppressCardClick = true;
    window.setTimeout(() => { suppressCardClick = false; }, 80);
  }
};
window.addEventListener('pointerup', stopCarouselDrag);
window.addEventListener('pointercancel', stopCarouselDrag);
carousel?.addEventListener('click', (event) => {
  if (!suppressCardClick) return;
  event.preventDefault();
  event.stopPropagation();
}, true);
carousel?.addEventListener('keydown', (event) => {
  if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
  event.preventDefault();
  const style = window.getComputedStyle(carousel);
  const gap = parseFloat(style.columnGap || style.gap || '0') || 0;
  carousel.scrollBy({ left: (event.key === 'ArrowRight' ? 1 : -1) * (videoCards[0].getBoundingClientRect().width + gap), behavior: 'smooth' });
});

const mediaDialog = document.querySelector('.media-dialog');
const modalVideo = document.querySelector('.modal-video');
const mediaTitle = mediaDialog?.querySelector('.modal-title');
const closeMediaDialog = () => {
  if (!modalVideo) return;
  modalVideo.pause();
  modalVideo.autoplay = false;
  modalVideo.removeAttribute('src');
  modalVideo.removeAttribute('poster');
  modalVideo.load();
};
document.querySelectorAll('[data-video]').forEach((trigger) => {
  trigger.addEventListener('click', () => {
    if (!mediaDialog || !modalVideo) return;
    modalVideo.pause();
    modalVideo.removeAttribute('poster');
    modalVideo.autoplay = true;
    modalVideo.preload = 'auto';
    modalVideo.src = trigger.dataset.video;
    if (mediaTitle) mediaTitle.textContent = trigger.dataset.title || 'Видео';
    mediaDialog.showModal();
    modalVideo.load();
    const playAttempt = modalVideo.play();
    if (playAttempt && typeof playAttempt.catch === 'function') playAttempt.catch(() => {});
  });
});
mediaDialog?.querySelector('.modal-close')?.addEventListener('click', () => mediaDialog.close());
mediaDialog?.addEventListener('click', (event) => {
  if (event.target === mediaDialog) mediaDialog.close();
});
mediaDialog?.addEventListener('close', closeMediaDialog);

const posterDialog = document.querySelector('.poster-dialog');
const posterImage = posterDialog?.querySelector('.poster-modal-image');
const posterTitle = posterDialog?.querySelector('.poster-modal-title');
document.querySelectorAll('[data-poster]:not([data-video])').forEach((trigger) => {
  trigger.addEventListener('click', () => {
    if (!posterDialog || !posterImage) return;
    posterImage.src = trigger.dataset.poster;
    posterImage.alt = trigger.dataset.title || 'Постер из проекта Figma';
    if (posterTitle) posterTitle.textContent = trigger.dataset.title || 'Poster';
    posterDialog.showModal();
  });
});
posterDialog?.querySelector('.poster-close')?.addEventListener('click', () => posterDialog.close());
posterDialog?.addEventListener('click', (event) => {
  if (event.target === posterDialog) posterDialog.close();
});
posterDialog?.addEventListener('close', () => {
  if (posterImage) posterImage.removeAttribute('src');
});

const copyStatus = document.querySelector('.copy-status');
const copyText = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const temporaryInput = document.createElement('textarea');
    temporaryInput.value = text;
    temporaryInput.style.position = 'fixed';
    temporaryInput.style.opacity = '0';
    document.body.append(temporaryInput);
    temporaryInput.select();
    document.execCommand('copy');
    temporaryInput.remove();
  }
};
document.querySelectorAll('[data-copy]').forEach((button) => {
  button.addEventListener('click', async () => {
    await copyText(button.dataset.copy);
    if (copyStatus) copyStatus.textContent = 'Почта скопирована — можно писать!';
    window.setTimeout(() => { if (copyStatus) copyStatus.textContent = ''; }, 2500);
  });
});

if (!prefersLessMotion) {
  document.querySelectorAll('.decor-star, .contact-star, .pacman, .intro-orbit').forEach((shape, index) => {
    shape.style.animationDelay = (index % 7) * -2.7 + 's, ' + (index % 5) * -1.4 + 's';
  });
}
updateCarouselPosition();
