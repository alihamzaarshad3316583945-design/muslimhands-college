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
    homeKicker: 'LEARN · INNOVATE · EXCEL',
    homeTitle: 'Where Learning Becomes a Journey',
    homeDescription: 'At Aisha Cahn College of Computer Science & Design Technology, learning begins with a question, grows through exploration, and becomes meaningful when you build something with what you know.',
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
  const localPreview = window.location.protocol === 'file:';
  const adminPage = Boolean(document.querySelector('#adminStatus'));
  const adminStatus = document.querySelector('#adminStatus');
  const setAdminStatus = (message, isError = false) => {
    if (!adminStatus) return;
    adminStatus.textContent = message;
    adminStatus.classList.toggle('is-error', isError);
  };
  const apiRequest = async (path, options = {}) => {
    const { admin, ...requestOptions } = options;
    const headers = { Accept: 'application/json', ...(options.headers || {}) };
    if (options.body) headers['Content-Type'] = 'application/json';
    if (admin) headers['X-Admin-Request'] = '1';
    const response = await fetch(path, {
      ...requestOptions,
      headers,
      credentials: 'same-origin'
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error(result.error || `Request failed (${response.status}).`);
      error.status = response.status;
      throw error;
    }
    return result;
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
  const saveStoredValue = async (key, value) => {
    if (!localPreview) {
      try {
        const path = key === settingsKey ? '/api/content' : '/api/programs';
        const body = key === settingsKey ? value : { programs: value };
        await apiRequest(path, { method: 'PUT', body: JSON.stringify(body), admin: true });
        return true;
      } catch (error) {
        console.error('Unable to save website data to the server.', error);
        setAdminStatus(error.message || 'Could not save changes to the server.', true);
        return false;
      }
    }
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
  let siteSettings = localPreview ? readStoredValue(settingsKey, defaultSettings, isSettingsObject) : defaultSettings;
  let sitePrograms = localPreview ? readStoredValue(programsKey, defaultPrograms, isProgramList) : defaultPrograms;

  const renderSiteSettings = () => {
    document.querySelectorAll('[data-site-field]').forEach(element => {
      const key = element.dataset.siteField;
      if (typeof siteSettings[key] !== 'string') return;
      if (key === 'homeTitle') {
        const words = siteSettings[key].trim().split(/\s+/);
        const emphasizedWord = words.pop();
        if (words.length && emphasizedWord) {
          const emphasis = document.createElement('em');
          emphasis.textContent = emphasizedWord;
          element.replaceChildren(document.createTextNode(`${words.join(' ')} `), emphasis);
          return;
        }
      }
      element.textContent = siteSettings[key];
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
    document.querySelectorAll('[data-intermediate-count]').forEach(element => {
      element.textContent = String(sitePrograms.length);
    });
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
      form.addEventListener('submit', async event => {
        event.preventDefault();
        const values = new FormData(form);
        const updatedPrograms = sitePrograms.map((item, itemIndex) => itemIndex === index
          ? { ...item, name: String(values.get('name')).trim(), description: String(values.get('description')).trim(), details: String(values.get('description')).trim() }
          : item);
        if (updatedPrograms.some((item, itemIndex) => itemIndex !== index && item.name.toLocaleLowerCase() === updatedPrograms[index].name.toLocaleLowerCase())) {
          setAdminStatus('A program with that name already exists.', true);
          return;
        }
        if (await saveStoredValue(programsKey, updatedPrograms)) {
          sitePrograms = updatedPrograms;
          renderPrograms();
          renderAdminPrograms();
          setAdminStatus(localPreview ? 'Program changes saved in this browser.' : 'Program changes saved.');
        }
      });
      removeButton.addEventListener('click', async () => {
        const updatedPrograms = sitePrograms.filter((_, itemIndex) => itemIndex !== index);
        if (await saveStoredValue(programsKey, updatedPrograms)) {
          sitePrograms = updatedPrograms;
          renderPrograms();
          renderAdminPrograms();
          setAdminStatus(localPreview ? `${program.name} removed from this browser's website preview.` : `${program.name} removed.`);
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

  document.querySelector('#siteSettingsForm')?.addEventListener('submit', async event => {
    event.preventDefault();
    const form = event.currentTarget;
    const values = new FormData(form);
    const updatedSettings = { ...siteSettings };
    ['homeKicker', 'homeTitle', 'homeDescription', 'aboutTitle', 'aboutDescription', 'programsPageTitle', 'programsPageDescription', 'admissionsPageTitle', 'admissionsPageDescription', 'facultyPageTitle', 'facultyPageDescription', 'galleryPageTitle', 'galleryPageDescription', 'contactPageTitle', 'contactPageDescription', 'announcement'].forEach(key => {
      updatedSettings[key] = String(values.get(key)).trim();
    });
    if (await saveStoredValue(settingsKey, updatedSettings)) {
      siteSettings = updatedSettings;
      renderSiteSettings();
      setAdminStatus(localPreview ? 'Website content saved in this browser. Reload the public pages to preview it.' : 'Website content saved.');
    }
  });

  document.querySelector('#creatorProfileForm')?.addEventListener('submit', async event => {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    const updatedSettings = { ...siteSettings };
    ['creatorName', 'creatorLocation', 'creatorBio'].forEach(key => {
      updatedSettings[key] = String(values.get(key)).trim();
    });
    if (await saveStoredValue(settingsKey, updatedSettings)) {
      siteSettings = updatedSettings;
      renderSiteSettings();
      setAdminStatus(localPreview ? 'Creator profile saved in this browser.' : 'Creator profile saved.');
    }
  });

  document.querySelector('#addProgramForm')?.addEventListener('submit', async event => {
    event.preventDefault();
    const form = event.currentTarget;
    const values = new FormData(form);
    const name = String(values.get('name')).trim();
    const description = String(values.get('description')).trim();
    if (sitePrograms.some(program => program.name.toLocaleLowerCase() === name.toLocaleLowerCase())) {
      setAdminStatus('A program with that name already exists.', true);
      return;
    }
    const newProgram = { name, description, details: description, category: 'INTERMEDIATE PROGRAM', image: 'images/digital-student.jpg' };
    const updatedPrograms = [...sitePrograms, newProgram];
    if (await saveStoredValue(programsKey, updatedPrograms)) {
      sitePrograms = updatedPrograms;
      form.reset();
      renderPrograms();
      renderAdminPrograms();
      setAdminStatus(localPreview ? `${name} added to this browser's website preview.` : `${name} added.`);
    }
  });

  document.querySelector('#resetSiteSettings')?.addEventListener('click', async () => {
    const confirmation = localPreview
      ? 'Reset saved website content and programs in this browser?'
      : 'Reset the shared website content and program list for every visitor?';
    if (!window.confirm(confirmation)) return;
    try {
      if (localPreview) {
        window.localStorage.removeItem(settingsKey);
        window.localStorage.removeItem(programsKey);
        siteSettings = defaultSettings;
        sitePrograms = defaultPrograms;
      } else {
        const result = await apiRequest('/api/reset', { method: 'POST', admin: true, body: '{}' });
        siteSettings = result.settings;
        sitePrograms = result.programs;
      }
      renderSiteSettings();
      renderPrograms();
      renderAdminPrograms();
      setAdminStatus(localPreview ? 'Demo content and programs have been reset in this browser.' : 'Website content and programs have been reset.');
    } catch (error) {
      console.error('Unable to reset website content.', error);
      setAdminStatus(error.message || 'Could not reset website content.', true);
    }
  });

  window.addEventListener('storage', event => {
    if (!localPreview) return;
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

  document.querySelectorAll('[data-submission-kind]').forEach(form => {
    form.addEventListener('submit', async event => {
      event.preventDefault();
      const message = form.querySelector('.msg');
      if (localPreview) {
        if (message) message.textContent = 'The live enquiry form is available after deploying this site with its backend.';
        return;
      }
      const values = Object.fromEntries(new FormData(form).entries());
      values.kind = form.dataset.submissionKind;
      try {
        const result = await apiRequest('/api/submissions', { method: 'POST', body: JSON.stringify(values) });
        form.classList.add('is-submitted');
        form.reset();
        if (message) message.textContent = result.message;
      } catch (error) {
        console.error('Unable to submit enquiry.', error);
        if (message) message.textContent = error.message || 'Your enquiry could not be sent. Please try again later.';
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

  const renderSubmissions = submissions => {
    const list = document.querySelector('#submissionList');
    if (!list) return;
    list.replaceChildren();
    if (!submissions.length) {
      const empty = document.createElement('p');
      empty.textContent = 'No enquiries have been received yet.';
      list.append(empty);
      return;
    }
    submissions.forEach(submission => {
      const article = document.createElement('article');
      article.className = 'submission-row';
      const heading = document.createElement('h3');
      heading.textContent = submission.kind === 'admission' ? 'Admission enquiry' : 'Contact message';
      const date = document.createElement('time');
      date.dateTime = submission.createdAt;
      date.textContent = new Date(submission.createdAt).toLocaleString();
      const details = document.createElement('dl');
      Object.entries(submission.data).forEach(([key, value]) => {
        const term = document.createElement('dt');
        term.textContent = key.replace(/([A-Z])/g, ' $1').replace(/^./, letter => letter.toUpperCase());
        const description = document.createElement('dd');
        description.textContent = value || '—';
        details.append(term, description);
      });
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'btn program-remove-button';
      remove.textContent = 'Delete enquiry';
      remove.addEventListener('click', async () => {
        if (!window.confirm('Delete this enquiry permanently?')) return;
        try {
          await apiRequest('/api/submissions', { method: 'DELETE', body: JSON.stringify({ id: submission.id }), admin: true });
          article.remove();
          if (!list.querySelector('.submission-row')) renderSubmissions([]);
        } catch (error) {
          console.error('Unable to delete enquiry.', error);
          setAdminStatus(error.message || 'Could not delete the enquiry.', true);
        }
      });
      article.append(heading, date, details, remove);
      list.append(article);
    });
  };

  const loadBackendData = async () => {
    if (localPreview) {
      document.body.classList.add('admin-ready');
      return;
    }
    try {
      if (adminPage) {
        const session = await apiRequest('/api/admin_status', { admin: true });
        if (!session.authenticated) {
          window.location.replace('login.html?admin=1');
          return;
        }
        document.body.classList.add('admin-ready');
        const [content, programs, submissions] = await Promise.all([
          apiRequest('/api/content'),
          apiRequest('/api/programs'),
          apiRequest('/api/submissions', { admin: true })
        ]);
        if (!isSettingsObject(content.settings) || !isProgramList(programs.programs)) {
          throw new TypeError('The server returned invalid website content.');
        }
        siteSettings = content.settings;
        sitePrograms = programs.programs;
        renderSiteSettings();
        renderPrograms();
        renderAdminPrograms();
        renderSubmissions(submissions.submissions);
        return;
      }
      const [content, programs] = await Promise.all([
        apiRequest('/api/content'),
        apiRequest('/api/programs')
      ]);
      if (!isSettingsObject(content.settings) || !isProgramList(programs.programs)) {
        throw new TypeError('The server returned invalid website content.');
      }
      siteSettings = content.settings;
      sitePrograms = programs.programs;
      renderSiteSettings();
      renderPrograms();
    } catch (error) {
      console.error('Unable to load website data from the backend.', error);
      if (adminPage) {
        setAdminStatus(error.message || 'Website data could not be loaded.', true);
        document.body.classList.add('admin-ready');
      } else {
        const warning = document.createElement('aside');
        warning.className = 'site-announcement';
        warning.setAttribute('role', 'status');
        warning.textContent = 'Some website information could not be loaded. Please try again later.';
        document.querySelector('.header')?.insertAdjacentElement('afterend', warning);
      }
    }
  };

  document.querySelector('#adminLogout')?.addEventListener('click', async event => {
    event.preventDefault();
    try {
      await apiRequest('/api/logout', { method: 'POST', admin: true, body: '{}' });
      window.location.replace('login.html?admin=1');
    } catch (error) {
      console.error('Unable to sign out from the admin dashboard.', error);
      setAdminStatus(error.message || 'Could not sign out. Close this browser tab.', true);
    }
  });

  loadBackendData();

  const loginForm = document.querySelector('#loginForm');
  if (loginForm) {
    const query = new URLSearchParams(window.location.search);
    const roleSelect = document.querySelector('#role');
    const message = document.querySelector('#msg');
    if (query.get('admin') === '1' && roleSelect) {
      roleSelect.value = 'Admin';
      const description = loginForm.querySelector('form > p, p');
      if (description) description.textContent = 'Sign in with the administrator account configured for this website.';
    }
    loginForm.addEventListener('submit', async event => {
      event.preventDefault();
      const role = roleSelect.value;
      if (role.toLowerCase() === 'admin') {
        const values = new FormData(loginForm);
        message.textContent = 'Checking administrator sign-in…';
        try {
          await apiRequest('/api/login', {
            method: 'POST',
            body: JSON.stringify({
              email: String(values.get('email') || ''),
              password: String(values.get('password') || '')
            })
          });
          window.location.replace('admin-dashboard.html');
        } catch (error) {
          console.error('Administrator sign-in failed.', error);
          message.textContent = error.message || 'Administrator sign-in failed.';
        }
        return;
      }
      message.textContent = 'Opening demo portal…';
      window.setTimeout(() => {
        window.location.href = `${role.toLowerCase()}-dashboard.html`;
      }, 500);
    });
  }

  if (!reducedMotion.matches && 'IntersectionObserver' in window) {
    const revealElements = document.querySelectorAll(
      '.header, .hero > div, .pagehero, main > .section, main > .campus-feature, main > .campus-intro, ' +
      '.content > *, .content > * > *, .content > * > * > *, .portal > *, ' +
      '.portal > * > *, .card, .panel, .stat, .tile, .journey-tile, .login, .footer, ' +
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