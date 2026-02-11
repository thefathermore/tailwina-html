// Mobile menu functionality
document.addEventListener('DOMContentLoaded', () => {
  const mobileMenuElement = document.getElementById('header-mobile');
  const toggleButton = document.getElementById('btn-toggle-menu-mobile');
  const closeButton = document.querySelector('.btn-close');

  if (!mobileMenuElement || !toggleButton || !closeButton) {
    return;
  }

  // Function to open mobile menu
  const openMobileMenu = (e) => {
    if (e) {
      e.preventDefault();
    }
    mobileMenuElement.classList.remove('translate-x-full');
    toggleButton.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  };

  // Function to close mobile menu
  const closeMobileMenu = (e) => {
    if (e) {
      e.preventDefault();
    }
    mobileMenuElement.classList.add('translate-x-full');
    toggleButton.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  };

  // Event listeners
  toggleButton.addEventListener('click', openMobileMenu);
  closeButton.addEventListener('click', closeMobileMenu);

  // Close menu when clicking on a link (but allow navigation)
  const mobileMenuLinks = mobileMenuElement.querySelectorAll('a');
  mobileMenuLinks.forEach((link) => {
    link.addEventListener('click', () => {
      // Close menu without preventing default navigation
      mobileMenuElement.classList.add('translate-x-full');
      toggleButton.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    });
  });

  // Close menu on escape key press
  document.addEventListener('keydown', (event) => {
    if (
      event.key === 'Escape' &&
      !mobileMenuElement.classList.contains('translate-x-full')
    ) {
      closeMobileMenu();
    }
  });
});
