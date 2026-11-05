document.addEventListener('DOMContentLoaded', () => {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const menu = document.querySelector('.menu');
  const nav = document.querySelector('.nav');

  if (menu && nav) {
    menu.setAttribute('aria-expanded', 'false');
    const currentPage = location.pathname.split('/').pop() || 'index.html';
    nav.querySelectorAll('a[href]').forEach(link => {
      if (link.pathname.split('/').pop() === currentPage) {
        link.setAttribute('aria-current', 'page');
      }
    });

    menu.addEventListener('click', () => {
      const isOpen = nav.classList.toggle('open');
      menu.setAttribute('aria-expanded', String(isOpen));
    });

    nav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        nav.classList.remove('open');
        menu.setAttribute('aria-expanded', 'false');
      });
    });

    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && nav.classList.contains('open')) {
        nav.classList.remove('open');
        menu.setAttribute('aria-expanded', 'false');
        menu.focus();
      }
    });
  }

  document.querySelectorAll('.year').forEach(element => {
    element.textContent = new Date().getFullYear();
  });

  const intro = document.querySelector('#cinematicIntro');
  if (intro && !reducedMotion.matches) {
    let introSeen = false;
    let introStorage = null;
    try {
      introStorage = window.localStorage;
      introSeen = introStorage.getItem('aisha-cinematic-intro-seen') === 'true';
    } catch (error) {
      console.warn('Persistent intro preference is unavailable; using session storage.', error);
      try {
        introStorage = window.sessionStorage;
        introSeen = introStorage.getItem('aisha-cinematic-intro-seen') === 'true';
      } catch (sessionError) {
        console.warn('Session intro preference is unavailable.', sessionError);
      }
    }

    if (!introSeen) {
      const skipButton = document.querySelector('#skipIntro');
      const canvas = document.querySelector('#introParticles');
      const context = canvas?.getContext('2d');
      const points = [];
      let particleFrame = 0;
      let introTimer = 0;
      let particleWidth = 0;
      let particleHeight = 0;
      let introFinished = false;

      const resizeParticles = () => {
        if (!canvas || !context) return;
        const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
        particleWidth = window.innerWidth;
        particleHeight = window.innerHeight;
        canvas.width = Math.round(particleWidth * ratio);
        canvas.height = Math.round(particleHeight * ratio);
        context.setTransform(ratio, 0, 0, ratio, 0, 0);
        points.length = 0;
        const count = Math.min(72, Math.round(particleWidth / 17));
        for (let index = 0; index < count; index += 1) {
          points.push({
            x: Math.random() * particleWidth,
            y: Math.random() * particleHeight,
            vx: (Math.random() - 0.5) * 0.2,
            vy: (Math.random() - 0.5) * 0.2,
            radius: Math.random() * 1.4 + 0.4
          });
        }
      };

      const drawParticles = () => {
        if (!context) return;
        context.clearRect(0, 0, particleWidth, particleHeight);
        points.forEach((point, index) => {
          point.x += point.vx;
          point.y += point.vy;
          if (point.x < 0 || point.x > particleWidth) point.vx *= -1;
          if (point.y < 0 || point.y > particleHeight) point.vy *= -1;
          context.beginPath();
          context.arc(point.x, point.y, point.radius, 0, Math.PI * 2);
          context.fillStyle = 'rgba(190, 213, 248, .7)';
          context.fill();

          for (let otherIndex = index + 1; otherIndex < points.length; otherIndex += 1) {
            const other = points[otherIndex];
            const distance = Math.hypot(point.x - other.x, point.y - other.y);
            if (distance < 92) {
              context.beginPath();
              context.moveTo(point.x, point.y);
              context.lineTo(other.x, other.y);
              context.strokeStyle = `rgba(110, 169, 255, ${0.13 * (1 - distance / 92)})`;
              context.stroke();
            }
          }
        });
        particleFrame = window.requestAnimationFrame(drawParticles);
      };

      const finishIntro = () => {
        if (introFinished) return;
        introFinished = true;
        window.clearTimeout(introTimer);
        window.cancelAnimationFrame(particleFrame);
        window.removeEventListener('resize', resizeParticles);
        intro.classList.remove('is-active');
        intro.classList.add('is-leaving');
        intro.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('intro-active');
        if (introStorage) {
          try {
            introStorage.setItem('aisha-cinematic-intro-seen', 'true');
          } catch (error) {
            console.warn('The intro will replay because its preference could not be stored.', error);
          }
        }
        window.setTimeout(() => {
          intro.classList.remove('is-leaving');
          document.body.classList.add('intro-dismissed');
          document.querySelector('.hero h1')?.focus();
        }, 850);
      };

      resizeParticles();
      intro.classList.add('is-active');
      intro.setAttribute('aria-hidden', 'false');
      document.body.classList.add('intro-active');
      skipButton?.focus();
      intro.addEventListener('keydown', event => {
        if (event.key === 'Escape') {
          finishIntro();
        } else if (event.key === 'Tab') {
          event.preventDefault();
          skipButton?.focus();
        }
      });
      drawParticles();
      window.addEventListener('resize', resizeParticles);
      skipButton?.addEventListener('click', finishIntro, { once: true });
      introTimer = window.setTimeout(finishIntro, 3000);
    } else {
      document.body.classList.add('intro-dismissed');
    }
  } else if (intro) {
    document.body.classList.add('intro-dismissed');
  }

  document.querySelectorAll('[data-demo]').forEach(form => {
    form.addEventListener('submit', event => {
      event.preventDefault();
      form.classList.add('is-submitted');
      const message = form.querySelector('.msg');
      if (message) {
        message.setAttribute('role', 'status');
        message.textContent = 'Demo only: your enquiry was not sent or saved. A secure backend is needed for real submissions.';
      }
    });
  });

  const courseList = document.querySelector('#courseList');
  if (courseList) {
    const search = document.querySelector('#courseSearch');
    const category = document.querySelector('#courseCategory');
    const count = document.querySelector('#courseCount');
    const empty = document.querySelector('#courseEmpty');
    if (!search || !category || !count || !empty) return;
    const courses = Array.from(courseList.querySelectorAll('.course-card'));

    const filterCourses = () => {
      const query = search.value.trim().toLocaleLowerCase();
      const selectedCategory = category.value;
      let visibleCount = 0;

      courses.forEach(course => {
        const matchesQuery = course.textContent.toLocaleLowerCase().includes(query);
        const matchesCategory = selectedCategory === 'all' ||
          course.dataset.courseCategory === selectedCategory;
        const isVisible = matchesQuery && matchesCategory;
        course.hidden = !isVisible;
        if (isVisible) visibleCount += 1;
      });

      count.textContent = `Showing ${visibleCount} of ${courses.length} courses`;
      empty.hidden = visibleCount > 0;
    };

    search.addEventListener('input', filterCourses);
    category.addEventListener('change', filterCourses);
    filterCourses();
  }

  const courseSelect = document.querySelector('#course');
  if (courseSelect) {
    const requestedCourse = new URLSearchParams(window.location.search).get('course');
    const matchingOption = Array.from(courseSelect.options)
      .find(option => option.value === requestedCourse || option.textContent === requestedCourse);
    if (matchingOption) {
      courseSelect.value = matchingOption.value;
      courseSelect.focus({ preventScroll: true });
    }
  }

  const loginForm = document.querySelector('#loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', event => {
      event.preventDefault();
      const role = document.querySelector('#role').value;
      document.querySelector('#msg').textContent = 'Opening demo portal…';
      setTimeout(() => {
        location.href = `${role.toLowerCase()}-dashboard.html`;
      }, 500);
    });
  }

  if (!reducedMotion.matches && 'IntersectionObserver' in window) {
    const revealElements = document.querySelectorAll(
      '.header, .hero > div, .pagehero, main > .section, main > .campus-feature, ' +
      '.content > *, .content > * > *, .content > * > * > *, .portal > *, ' +
      '.portal > * > *, .card, .panel, .stat, .tile, .login, .footer, ' +
      '.table, .form, .field, .faculty-feature, .experience-image, ' +
      '.experience-copy, .gallery-preview__image, .admissions-callout'
    );
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -24px 0px' });

    revealElements.forEach(element => {
      element.classList.add('reveal');
      revealObserver.observe(element);
    });
    document.body.classList.add('motion-ready');
  }

  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  if (finePointer.matches && !reducedMotion.matches) {
    const cursorGlow = document.createElement('span');
    cursorGlow.className = 'cursor-glow';
    cursorGlow.setAttribute('aria-hidden', 'true');
    document.body.appendChild(cursorGlow);
    let cursorFrame = 0;

    document.addEventListener('pointermove', event => {
      window.cancelAnimationFrame(cursorFrame);
      cursorFrame = window.requestAnimationFrame(() => {
        cursorGlow.style.setProperty('--cursor-x', `${event.clientX}px`);
        cursorGlow.style.setProperty('--cursor-y', `${event.clientY}px`);
        cursorGlow.classList.add('is-visible');
      });
    }, { passive: true });

    document.addEventListener('pointerover', event => {
      cursorGlow.classList.toggle('is-interactive', Boolean(event.target.closest('a, button, summary, input, select, textarea')));
    }, { passive: true });

    document.addEventListener('pointerleave', () => cursorGlow.classList.remove('is-visible'));

    document.querySelectorAll('.card, .panel, .stat, .tile').forEach(element => {
      element.addEventListener('pointermove', event => {
        const bounds = element.getBoundingClientRect();
        const x = (event.clientX - bounds.left) / bounds.width - 0.5;
        const y = (event.clientY - bounds.top) / bounds.height - 0.5;
        element.style.setProperty('--tilt-x', `${-y * 5}deg`);
        element.style.setProperty('--tilt-y', `${x * 5}deg`);
      });

      element.addEventListener('pointerleave', () => {
        element.style.setProperty('--tilt-x', '0deg');
        element.style.setProperty('--tilt-y', '0deg');
      });
    });
  }
});