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

  const defaultSettings = {
    homeKicker: 'LEARN · CREATE · LEAD',
    homeTitle: 'Aisha Cahn College',
    homeDescription: 'Build your future with intermediate programs in arts, computer science and sciences, alongside practical creative and digital skills.',
    aboutTitle: 'Education with a creative edge',
    aboutDescription: 'Aisha Cahn College of Computer Science & Design Technology brings together academic pathways and practical learning. Students can explore intermediate programs and creative and digital skills courses.',
    programsPageTitle: 'Find the right path for you',
    programsPageDescription: 'Intermediate study programs and practical skills courses.',
    admissionsPageTitle: 'Admissions & Enrolment',
    admissionsPageDescription: 'Tell us what you would like to study and ask about the current admission process.',
    facultyPageTitle: 'Faculty & Instructors',
    facultyPageDescription: 'Course areas and illustrative learning photos. Official staff names and portraits can be added when confirmed.',
    galleryPageTitle: 'College Gallery',
    galleryPageDescription: 'Illustrative learning and creative-work photos. Replace these with approved campus photos when available.',
    contactPageTitle: 'Contact the College',
    contactPageDescription: 'Send a question about programs, admissions or student support.',
    announcement: '',
    creatorName: 'ALI HAMZA',
    creatorLocation: 'Azad Kashmir',
    creatorBio: 'Designed and built this website with care for the college community.'
  };
  const defaultPrograms = [
    { name: 'FA', description: 'Humanities and arts studies. Elective subjects are selected according to the available college and board combinations.', details: 'A humanities-focused intermediate program. Students choose elective subjects from the combinations offered by the college and permitted by the relevant board.', category: 'HUMANITIES & ARTS', image: 'images/study-notes.jpg' },
    { name: 'FA-IT', description: 'Intermediate arts studies with an information technology focus. Ask the college about available subjects and board-approved combinations.', details: 'An arts-focused intermediate program with an information technology focus. Ask the college about current IT subjects and board-approved combinations.', category: 'INFORMATION TECHNOLOGY', image: 'images/computer-learning.jpg' },
    { name: 'ICS', description: 'Computer science with mathematics and a supporting science or elective subject, depending on the approved combination.', details: 'Intermediate study combining computer science with mathematics and supporting subjects. Confirm available combinations with the college.', category: 'COMPUTER SCIENCE', image: 'images/computer-learning.jpg' },
    { name: 'FSc Pre-Medical', description: 'Biology, Chemistry and Physics for students interested in life sciences and related further studies.', details: 'Science preparation for students interested in biological and health-related fields. Core subjects: Biology, Chemistry and Physics.', category: 'LIFE SCIENCES', image: 'images/classroom.jpg' },
    { name: 'FSc Pre-Engineering', description: 'Mathematics, Chemistry and Physics for students interested in engineering and other quantitative fields.', details: 'Science preparation for students interested in engineering and other mathematics-based fields. Core subjects: Mathematics, Chemistry and Physics.', category: 'ENGINEERING & PHYSICAL SCIENCES', image: 'images/digital-student.jpg' }
  ];
  const settingsKey = 'aisha-college-site-settings-v1';
  const programsKey = 'aisha-college-site-programs-v1';
  const adminStatus = document.querySelector('#adminStatus');
  const setAdminStatus = (message, isError = false) => {
    if (!adminStatus) return;
    adminStatus.textContent = message;
    adminStatus.classList.toggle('is-error', isError);
  };
  const readStoredValue = (key, fallback, isValid) => {
    try {
      const saved = window.localStorage.getItem(key);
      if (saved === null) return fallback;
      const parsed = JSON.parse(saved);
      if (!isValid(parsed)) throw new TypeError(`Saved website data in ${key} is invalid.`);
      return parsed;
    } catch (error) {
      console.error(`Unable to read website settings from browser storage (${key}).`, error);
      setAdminStatus('Saved website data could not be read. Check browser storage or reset the demo content.', true);
      return fallback;
    }
  };
  const saveStoredValue = (key, value) => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`Unable to save website settings to browser storage (${key}).`, error);
      setAdminStatus('Could not save changes in this browser. Check storage permissions and available space.', true);
      return false;
    }
  };
  const isSettingsObject = value => value && typeof value === 'object' &&
    Object.keys(defaultSettings).every(key => typeof value[key] === 'string');
  const isProgramList = value => Array.isArray(value) &&
    value.every(program => program && typeof program.name === 'string' && typeof program.description === 'string');
  let siteSettings = readStoredValue(settingsKey, defaultSettings, isSettingsObject);
  let sitePrograms = readStoredValue(programsKey, defaultPrograms, isProgramList);

  const renderSiteSettings = () => {
    document.querySelectorAll('[data-site-field]').forEach(element => {
      const key = element.dataset.siteField;
      if (typeof siteSettings[key] === 'string') element.textContent = siteSettings[key];
    });

    if (siteSettings.announcement) {
      let announcement = document.querySelector('#siteAnnouncement');
      if (!announcement && !document.querySelector('#siteSettingsForm')) {
        announcement = document.createElement('aside');
        announcement.id = 'siteAnnouncement';
        announcement.className = 'site-announcement';
        announcement.setAttribute('role', 'status');
        const header = document.querySelector('.header');
        if (header) header.insertAdjacentElement('afterend', announcement);
      }
      if (announcement) announcement.textContent = siteSettings.announcement;
    } else {
      document.querySelector('#siteAnnouncement')?.remove();
    }

    const form = document.querySelector('#siteSettingsForm');
    if (form) {
      Object.entries(siteSettings).forEach(([key, value]) => {
        const field = form.elements.namedItem(key);
        if (field) field.value = value;
      });
    }
    const profileForm = document.querySelector('#creatorProfileForm');
    if (profileForm) {
      ['creatorName', 'creatorLocation', 'creatorBio'].forEach(key => {
        profileForm.elements.namedItem(key).value = siteSettings[key];
      });
    }
  };

  const symbolForProgram = name => name.toLocaleLowerCase().includes('science') ? '⌘' :
    name.toLocaleLowerCase().includes('medical') ? '✚' : '✦';
  const renderPrograms = () => {
    const programNames = sitePrograms.map(program => program.name).join(' / ');
    document.querySelectorAll('[data-program-names]').forEach(element => {
      element.textContent = `INTERMEDIATE · ${programNames}`;
    });
    document.querySelectorAll('[data-program-list]').forEach(list => {
      const detailsView = list.dataset.programList === 'details';
      list.replaceChildren();
      sitePrograms.forEach(program => {
        const article = document.createElement('article');
        article.className = 'card';
        const image = document.createElement('img');
        image.className = 'card__image';
        image.src = program.image || 'images/digital-student.jpg';
        image.alt = `${program.name} program`;
        image.loading = 'lazy';
        article.append(image);
        if (detailsView) {
          const eyebrow = document.createElement('span');
          eyebrow.className = 'eyebrow';
          eyebrow.textContent = program.category || 'INTERMEDIATE PROGRAM';
          article.append(eyebrow);
        } else {
          const symbol = document.createElement('div');
          symbol.className = 'symbol';
          symbol.textContent = symbolForProgram(program.name);
          article.append(symbol);
        }
        const heading = document.createElement('h3');
        heading.textContent = program.name;
        const description = document.createElement('p');
        description.textContent = detailsView ? program.details || program.description : program.description;
        article.append(heading, description);
        if (detailsView) {
          const subjects = document.createElement('p');
          subjects.innerHTML = '<b>Subjects:</b> Ask the college about current subject combinations.';
          const duration = document.createElement('p');
          duration.innerHTML = '<b>Typical duration:</b> Two years for intermediate study; confirm the current academic plan.';
          article.append(subjects, duration);
        }
        const link = document.createElement('a');
        link.href = detailsView ? `admissions.html?course=${encodeURIComponent(program.name)}#course` : 'programs.html';
        link.textContent = detailsView ? 'Ask about this program →' : 'Program details →';
        article.append(link);
        list.append(article);
      });
    });

    document.querySelectorAll('[data-program-select]').forEach(select => {
      const selectedValue = select.value;
      let group = select.querySelector('optgroup[label="Intermediate"]');
      if (!group) {
        group = document.createElement('optgroup');
        group.label = 'Intermediate';
        select.insertBefore(group, select.querySelector('optgroup'));
      }
      group.replaceChildren();
      sitePrograms.forEach(program => {
        const option = document.createElement('option');
        option.value = program.name;
        option.textContent = program.name;
        group.append(option);
      });
      if (Array.from(select.options).some(option => option.value === selectedValue)) select.value = selectedValue;
    });
  };

  const renderAdminPrograms = () => {
    const list = document.querySelector('#programAdminList');
    if (!list) return;
    list.replaceChildren();
    sitePrograms.forEach((program, index) => {
      const form = document.createElement('form');
      form.className = 'program-admin-row';
      form.dataset.programIndex = String(index);
      const nameField = document.createElement('div');
      nameField.className = 'field';
      const nameLabel = document.createElement('label');
      nameLabel.textContent = 'Program name';
      const nameInput = document.createElement('input');
      nameInput.name = 'name';
      nameInput.value = program.name;
      nameInput.required = true;
      nameInput.maxLength = 60;
      nameLabel.append(nameInput);
      nameField.append(nameLabel);
      const descriptionField = document.createElement('div');
      descriptionField.className = 'field';
      const descriptionLabel = document.createElement('label');
      descriptionLabel.textContent = 'Short description';
      const descriptionInput = document.createElement('textarea');
      descriptionInput.name = 'description';
      descriptionInput.value = program.description;
      descriptionInput.required = true;
      descriptionInput.maxLength = 240;
      descriptionLabel.append(descriptionInput);
      descriptionField.append(descriptionLabel);
      const actions = document.createElement('div');
      actions.className = 'program-admin-actions';
      const saveButton = document.createElement('button');
      saveButton.type = 'submit';
      saveButton.className = 'btn';
      saveButton.textContent = 'Save';
      const removeButton = document.createElement('button');
      removeButton.type = 'button';
      removeButton.className = 'btn program-remove-button';
      removeButton.textContent = 'Remove';
      removeButton.setAttribute('aria-label', `Remove ${program.name}`);
      actions.append(saveButton, removeButton);
      form.append(nameField, descriptionField, actions);
      form.addEventListener('submit', event => {
        event.preventDefault();
        const values = new FormData(form);
        const updatedPrograms = sitePrograms.map((item, itemIndex) => itemIndex === index
          ? { ...item, name: String(values.get('name')).trim(), description: String(values.get('description')).trim(), details: String(values.get('description')).trim() }
          : item);
        if (updatedPrograms.some((item, itemIndex) => itemIndex !== index && item.name.toLocaleLowerCase() === updatedPrograms[index].name.toLocaleLowerCase())) {
          setAdminStatus('A program with that name already exists.', true);
          return;
        }
        if (saveStoredValue(programsKey, updatedPrograms)) {
          sitePrograms = updatedPrograms;
          renderPrograms();
          renderAdminPrograms();
          setAdminStatus('Program changes saved in this browser.');
        }
      });
      removeButton.addEventListener('click', () => {
        const updatedPrograms = sitePrograms.filter((_, itemIndex) => itemIndex !== index);
        if (saveStoredValue(programsKey, updatedPrograms)) {
          sitePrograms = updatedPrograms;
          renderPrograms();
          renderAdminPrograms();
          setAdminStatus(`${program.name} removed from this browser's website preview.`);
        }
      });
      list.append(form);
    });
    const total = document.querySelector('#programTotal');
    if (total) total.textContent = String(sitePrograms.length).padStart(2, '0');
  };

  renderSiteSettings();
  renderPrograms();
  renderAdminPrograms();

  document.querySelector('#siteSettingsForm')?.addEventListener('submit', event => {
    event.preventDefault();
    const form = event.currentTarget;
    const values = new FormData(form);
    const updatedSettings = { ...siteSettings };
    ['homeKicker', 'homeTitle', 'homeDescription', 'aboutTitle', 'aboutDescription', 'programsPageTitle', 'programsPageDescription', 'admissionsPageTitle', 'admissionsPageDescription', 'facultyPageTitle', 'facultyPageDescription', 'galleryPageTitle', 'galleryPageDescription', 'contactPageTitle', 'contactPageDescription', 'announcement'].forEach(key => {
      updatedSettings[key] = String(values.get(key)).trim();
    });
    if (saveStoredValue(settingsKey, updatedSettings)) {
      siteSettings = updatedSettings;
      renderSiteSettings();
      setAdminStatus('Website content saved in this browser. Reload the public pages to preview it.');
    }
  });

  document.querySelector('#creatorProfileForm')?.addEventListener('submit', event => {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    const updatedSettings = { ...siteSettings };
    ['creatorName', 'creatorLocation', 'creatorBio'].forEach(key => {
      updatedSettings[key] = String(values.get(key)).trim();
    });
    if (saveStoredValue(settingsKey, updatedSettings)) {
      siteSettings = updatedSettings;
      renderSiteSettings();
      setAdminStatus('Creator profile saved in this browser.');
    }
  });

  document.querySelector('#addProgramForm')?.addEventListener('submit', event => {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    const name = String(values.get('name')).trim();
    const description = String(values.get('description')).trim();
    if (sitePrograms.some(program => program.name.toLocaleLowerCase() === name.toLocaleLowerCase())) {
      setAdminStatus('A program with that name already exists.', true);
      return;
    }
    const newProgram = { name, description, details: description, category: 'INTERMEDIATE PROGRAM', image: 'images/digital-student.jpg' };
    const updatedPrograms = [...sitePrograms, newProgram];
    if (saveStoredValue(programsKey, updatedPrograms)) {
      sitePrograms = updatedPrograms;
      event.currentTarget.reset();
      renderPrograms();
      renderAdminPrograms();
      setAdminStatus(`${name} added to this browser's website preview.`);
    }
  });

  document.querySelector('#resetSiteSettings')?.addEventListener('click', () => {
    if (!window.confirm('Reset saved website content and programs in this browser?')) return;
    try {
      window.localStorage.removeItem(settingsKey);
      window.localStorage.removeItem(programsKey);
      siteSettings = defaultSettings;
      sitePrograms = defaultPrograms;
      renderSiteSettings();
      renderPrograms();
      renderAdminPrograms();
      setAdminStatus('Demo content and programs have been reset in this browser.');
    } catch (error) {
      console.error('Unable to reset website settings in browser storage.', error);
      setAdminStatus('Could not reset browser storage. Check browser storage permissions.', true);
    }
  });

  window.addEventListener('storage', event => {
    if (event.key === settingsKey) {
      siteSettings = readStoredValue(settingsKey, defaultSettings, isSettingsObject);
      renderSiteSettings();
    }
    if (event.key === programsKey) {
      sitePrograms = readStoredValue(programsKey, defaultPrograms, isProgramList);
      renderPrograms();
      renderAdminPrograms();
    }
  });

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