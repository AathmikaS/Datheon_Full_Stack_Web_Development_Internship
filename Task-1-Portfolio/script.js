// Project information drives the shared detail dialog.
const projects = {
  travelmate: { name: 'TravelMate', category: '01 / Travel', image: 'assets/images/travelmate.svg', description: 'A tourist travel guide application that helps users explore destinations and discover useful travel information.', technologies: ['Node.js', 'Express.js', 'MongoDB'] },
  school360: { name: 'School360', category: '02 / Education', image: 'assets/images/school360.svg', description: 'A school management system for student enrollment, teachers, staff, and administrative activities.', technologies: ['Java', 'Spring Boot', 'MySQL'] },
  toytopia: { name: 'ToyTopia', category: '03 / Commerce', image: 'assets/images/toytopia.svg', description: 'An e-commerce application with order management and review management functionality.', technologies: ['Java', 'Spring Boot', 'MySQL'] }
};

const body = document.body;
const themeToggle = document.querySelector('.theme-toggle');
const themeIcon = document.querySelector('.theme-icon');
const menuToggle = document.querySelector('.menu-toggle');
const navLinks = document.querySelector('.nav-links');
const toast = document.querySelector('#toast');
let toastTimer;

// Restore the visitor's last theme choice, defaulting to dark.
function applyTheme(theme) {
  const isLight = theme === 'light';
  body.classList.toggle('light-theme', isLight);
  themeIcon.textContent = isLight ? '☾' : '☼';
  themeToggle.setAttribute('aria-label', isLight ? 'Switch to dark theme' : 'Switch to light theme');
  document.querySelector('meta[name="theme-color"]').content = isLight ? '#f5f7fb' : '#0b1020';
}
let savedTheme = 'dark';
try { savedTheme = localStorage.getItem('portfolio-theme') || 'dark'; } catch { /* Storage may be disabled. */ }
applyTheme(savedTheme);
themeToggle.addEventListener('click', () => {
  const nextTheme = body.classList.contains('light-theme') ? 'dark' : 'light';
  applyTheme(nextTheme);
  try { localStorage.setItem('portfolio-theme', nextTheme); } catch { /* Theme still works for this visit. */ }
});

// Expand and collapse the small-screen navigation.
menuToggle.addEventListener('click', () => {
  const isOpen = navLinks.classList.toggle('open');
  menuToggle.setAttribute('aria-expanded', String(isOpen));
  menuToggle.setAttribute('aria-label', isOpen ? 'Close navigation menu' : 'Open navigation menu');
});
navLinks.addEventListener('click', event => {
  if (event.target.closest('a')) {
    navLinks.classList.remove('open');
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.setAttribute('aria-label', 'Open navigation menu');
  }
});

// Highlight the section currently in view.
const sections = [...document.querySelectorAll('main section[id]')];
if ('IntersectionObserver' in window) {
  const sectionObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      document.querySelectorAll('.nav-link').forEach(link => link.classList.toggle('active', link.hash === `#${entry.target.id}`));
    });
  }, { rootMargin: '-35% 0px -55% 0px' });
  sections.forEach(section => sectionObserver.observe(section));

  // Reveal cards as they enter the screen. Show them immediately when motion is reduced.
  const revealItems = document.querySelectorAll('[data-reveal]');
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) revealItems.forEach(item => item.classList.add('revealed'));
  else {
    const revealObserver = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('revealed'); revealObserver.unobserve(entry.target); }
    }), { threshold: 0.12 });
    revealItems.forEach(item => revealObserver.observe(item));
  }
} else document.querySelectorAll('[data-reveal]').forEach(item => item.classList.add('revealed'));

// Fill and open the accessible native dialog for each project.
const modal = document.querySelector('#project-modal');
function openProject(projectId) {
  const project = projects[projectId];
  if (!project) return;
  document.querySelector('#modal-image').src = project.image;
  document.querySelector('#modal-image').alt = `${project.name} project preview`;
  document.querySelector('#modal-kicker').textContent = project.category;
  document.querySelector('#modal-title').textContent = project.name;
  document.querySelector('#modal-description').textContent = project.description;
  const tech = document.querySelector('#modal-tech');
  tech.replaceChildren(...project.technologies.map(name => { const badge = document.createElement('span'); badge.textContent = name; return badge; }));
  modal.showModal();
}
document.querySelectorAll('[data-project]').forEach(control => control.addEventListener('click', event => {
  event.preventDefault();
  openProject(control.dataset.project);
}));
document.querySelector('.modal-close').addEventListener('click', () => modal.close());
modal.addEventListener('click', event => { if (event.target === modal) modal.close(); });

// Placeholder links give clear feedback instead of pretending a destination exists.
function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.remove('show'), 3200);
}
document.querySelectorAll('.placeholder-action').forEach(link => link.addEventListener('click', event => {
  event.preventDefault();
  showToast(`Add your ${link.dataset.placeholder.toLowerCase()} URL before publishing.`);
}));
document.querySelector('#resume-button').addEventListener('click', () => {
  showToast('Add your own PDF at assets/documents/resume.pdf, then link the button to it.');
});

// Validate all form fields locally. No message is sent without a backend/service.
const form = document.querySelector('#contact-form');
const formStatus = document.querySelector('#form-status');
const checks = {
  name: value => value.trim().length >= 2 ? '' : 'Please enter at least 2 characters.',
  email: value => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()) ? '' : 'Enter a valid email address.',
  subject: value => value.trim().length >= 3 ? '' : 'Please enter a subject (at least 3 characters).',
  message: value => value.trim().length >= 10 ? '' : 'Please enter at least 10 characters.'
};
function validateField(field) {
  const error = checks[field.name](field.value);
  const errorElement = field.parentElement.querySelector('.field-error');
  errorElement.textContent = error;
  field.setAttribute('aria-invalid', String(Boolean(error)));
  return !error;
}
Object.keys(checks).forEach(name => form.elements[name].addEventListener('blur', event => validateField(event.currentTarget)));
form.addEventListener('submit', event => {
  event.preventDefault();
  const valid = Object.keys(checks).map(name => validateField(form.elements[name])).every(Boolean);
  if (!valid) {
    formStatus.textContent = 'Please fix the highlighted fields and try again. This form does not send email.';
    formStatus.dataset.state = 'error';
    form.querySelector('[aria-invalid="true"]')?.focus();
    return;
  }
  formStatus.textContent = 'Your message passed validation. To deliver it, connect a backend or an email service.';
  formStatus.dataset.state = 'success';
  form.reset();
  Object.keys(checks).forEach(name => form.elements[name].removeAttribute('aria-invalid'));
});

// Keep the footer year current.
document.querySelector('#year').textContent = new Date().getFullYear();
