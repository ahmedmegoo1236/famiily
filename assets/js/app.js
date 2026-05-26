/**
 * محرك تشغيل المنصة والبوابة العائلية (Sharbas Family Application Engine)
 * -------------------------------------------------------------
 * إعداد المهندس/ أحمد مجاهد رجب
 */

// ==========================================
// التهيئة وإعدادات السمة العامة والتحقق (Init & Auth)
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
  const savedTheme = localStorage.getItem('sharbas_theme') || 'light'; // Default: Light Mode
  document.documentElement.setAttribute('data-theme', savedTheme);
  document.body.setAttribute('data-theme', savedTheme);
  if (savedTheme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
  updateThemeIcons(savedTheme);
  
  checkAuthentication();
  window.addEventListener('hashchange', router);
  initDefaultGalleries();
});

// التحقق من الدخول وحالة الجلسة
function checkAuthentication() {
  const isAuth = sessionStorage.getItem('sharbas_auth') === 'true' || localStorage.getItem('sharbas_auth_persist') === 'true';
  const loginScreen = document.getElementById('login-screen');
  const mainContent = document.getElementById('main-content');
  
  if (isAuth) {
    loginScreen.style.display = 'none';
    loginScreen.classList.add('hidden');
    mainContent.style.display = 'flex';
    mainContent.classList.remove('hidden');
    router();
    updateGlobalStats();
    renderBirthdayReminders();
  } else {
    loginScreen.style.display = 'flex';
    loginScreen.classList.remove('hidden');
    mainContent.style.display = 'none';
    mainContent.classList.add('hidden');
    window.location.hash = '';
  }
}

// معالجة تسجيل الدخول بكلمة المرور
function handleLogin(event) {
  event.preventDefault();
  const passwordInput = document.getElementById('password-input');
  const password = passwordInput.value.trim();
  
  if (password === '123456789') {
    sessionStorage.setItem('sharbas_auth', 'true');
    localStorage.setItem('sharbas_auth_persist', 'true');
    
    const loginScreen = document.getElementById('login-screen');
    loginScreen.classList.add('opacity-0');
    setTimeout(() => {
      checkAuthentication();
      loginScreen.classList.remove('opacity-0');
    }, 300);
  } else {
    alert('⚠️ كلمة المرور التي أدخلتها غير صحيحة. يرجى المحاولة مرة أخرى.');
    passwordInput.value = '';
    passwordInput.focus();
  }
}

// تسجيل الخروج
function handleLogout() {
  sessionStorage.removeItem('sharbas_auth');
  localStorage.removeItem('sharbas_auth_persist');
  
  const mainContent = document.getElementById('main-content');
  mainContent.style.opacity = '0';
  mainContent.style.transition = 'opacity 0.3s ease';
  setTimeout(() => {
    mainContent.style.opacity = '1';
    checkAuthentication();
  }, 300);
}

// عرض وإخفاء كلمة المرور بالأيقونة
function togglePasswordVisibility() {
  const passwordInput = document.getElementById('password-input');
  const toggleIcon = document.getElementById('password-toggle-icon');
  
  if (passwordInput.type === 'password') {
    passwordInput.type = 'text';
    toggleIcon.className = 'fa-solid fa-eye-slash text-md';
  } else {
    passwordInput.type = 'password';
    toggleIcon.className = 'fa-solid fa-eye text-md';
  }
}

// تبديل الوضع الليلي والمضيء مع تحديث الأيقونات
function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', newTheme);
  document.body.setAttribute('data-theme', newTheme);
  if (newTheme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
  localStorage.setItem('sharbas_theme', newTheme);
  updateThemeIcons(newTheme);
}

// تحديث أيقونات تبديل السمة في الهيدر وشاشة الدخول
function updateThemeIcons(theme) {
  const icon = theme === 'light' ? 'fa-solid fa-moon' : 'fa-solid fa-sun';
  const loginIcon = document.getElementById('login-theme-icon');
  const mainIcon = document.getElementById('main-theme-icon');
  if (loginIcon) loginIcon.className = icon;
  if (mainIcon) mainIcon.className = icon;
}

// ==========================================
// محرك التوجيه وإدارة العروض (SPA Router)
// ==========================================

function router() {
  const hash = window.location.hash || '#home';
  const views = ['view-home', 'view-directory', 'view-tree', 'view-branch', 'view-youth', 'view-quran', 'view-adhkar'];
  
  views.forEach(v => {
    const el = document.getElementById(v);
    if (el) el.classList.add('hidden');
  });
  
  if (hash === '#home') {
    document.getElementById('view-home').classList.remove('hidden');
    document.getElementById('view-home').classList.add('fade-in');
    renderHomepageMemories();
  } 
  else if (hash === '#directory') {
    document.getElementById('view-directory').classList.remove('hidden');
    document.getElementById('view-directory').classList.add('fade-in');
    renderDirectory();
  } 
  else if (hash === '#youth') {
    document.getElementById('view-youth').classList.remove('hidden');
    document.getElementById('view-youth').classList.add('fade-in');
    renderYouthSection();
  }
  else if (hash === '#tree') {
    document.getElementById('view-tree').classList.remove('hidden');
    document.getElementById('view-tree').classList.add('fade-in');
    if (typeof renderFamilyTree === 'function') {
      setTimeout(renderFamilyTree, 100);
    }
  } 
  else if (hash === '#quran') {
    document.getElementById('view-quran').classList.remove('hidden');
    document.getElementById('view-quran').classList.add('fade-in');
    initFullQuranModule();
  }
  else if (hash === '#adhkar') {
    document.getElementById('view-adhkar').classList.remove('hidden');
    document.getElementById('view-adhkar').classList.add('fade-in');
    initFullAdhkarModule();
  }
  else if (hash.startsWith('#branch-')) {
    const branchName = hash.replace('#branch-', '');
    document.getElementById('view-branch').classList.remove('hidden');
    document.getElementById('view-branch').classList.add('fade-in');
    setupBranchView(branchName);
  } 
  else {
    window.location.hash = '#home';
  }
  
  updateActiveBottomNav(hash);
  window.scrollTo(0, 0);
}

// دالة لتحديث الحالة النشطة للقائمة السفلية على الهواتف
function updateActiveBottomNav(hash) {
  const navMap = {
    '#home': 'nav-item-home',
    '#tree': 'nav-item-tree',
    '#directory': 'nav-item-directory',
    '#quran': 'nav-item-quran',
    '#adhkar': 'nav-item-adhkar'
  };
  
  document.querySelectorAll('.mobile-nav-item').forEach(item => {
    item.classList.remove('active');
  });
  
  const activeId = navMap[hash] || (hash.startsWith('#branch-') ? 'nav-item-home' : null);
  if (activeId) {
    const el = document.getElementById(activeId);
    if (el) el.classList.add('active');
  }
}

// ==========================================
// الإحصائيات وأعياد الميلاد (Widgets)
// ==========================================

function updateGlobalStats() {
  const total = FAMILY_DATA.filter(m => m.name).length;
  const el = document.getElementById('stat-total-members');
  if (el) el.innerText = total;
  
  const currentMonth = new Date().getMonth() + 1;
  const eventCount = FAMILY_DATA.filter(p => {
    if (!p.birthDate) return false;
    const m = parseInt(p.birthDate.split('-')[1]);
    return m === currentMonth;
  }).length;
  const evEl = document.getElementById('stat-upcoming-events');
  if (evEl) evEl.innerText = eventCount;
}

function renderBirthdayReminders() {
  const container = document.getElementById('announcements-list');
  if (!container) return;
  container.innerHTML = '';
  
  const currentMonthNum = new Date().getMonth() + 1;
  const currentYearNum = new Date().getFullYear();
  
  const birthdays = FAMILY_DATA.filter(p => {
    if (!p.birthDate) return false;
    const m = parseInt(p.birthDate.split('-')[1]);
    return m === currentMonthNum;
  }).map(p => {
    const parts = p.birthDate.split('-');
    const day = parseInt(parts[2]);
    const birthYear = parseInt(parts[0]);
    const age = currentYearNum - birthYear;
    return {
      id: p.id,
      name: p.name,
      surname: p.surname,
      day: day,
      age: age,
      phone: p.phone,
      gender: p.gender,
      avatar: p.avatar
    };
  });
  
  birthdays.sort((a, b) => a.day - b.day);
  
  if (birthdays.length === 0) {
    container.innerHTML = `
      <div class="h-full flex flex-col items-center justify-center text-center p-3 text-secondary">
        <i class="fa-solid fa-moon text-xl text-stone-700 mb-2"></i>
        <p class="text-[10px]">لا توجد مناسبات مسجلة هذا الشهر.</p>
      </div>
    `;
    return;
  }
  
  birthdays.forEach(b => {
    const card = document.createElement('div');
    card.className = 'flex items-center justify-between p-2.5 bg-secondary rounded-xl border border-subtle hover:border-luxury-gold transition-all duration-300';
    
    let avatarHTML = '';
    if (b.avatar) {
      avatarHTML = `<img src="${b.avatar}" class="w-8 h-8 rounded-full object-cover border border-color">`;
    } else {
      const icon = b.gender === 'female' ? 'fa-user-dress' : 'fa-user';
      avatarHTML = `
        <div class="w-8 h-8 rounded-full bg-accent-gold-light border border-color flex items-center justify-center text-luxury-gold text-xs">
          <i class="fa-solid ${icon}"></i>
        </div>
      `;
    }
    
    const monthsArabic = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
    const dateText = `${b.day} ${monthsArabic[currentMonthNum - 1]}`;
    
    card.innerHTML = `
      <div class="flex items-center gap-2">
        ${avatarHTML}
        <div>
          <h4 class="text-[11px] font-bold font-title hover:text-luxury-gold cursor-pointer transition-colors" onclick="openDetailsModal('${b.id}')">${b.name} ${b.surname}</h4>
          <p class="text-[9px] text-secondary mt-0.5">${dateText} • يكمل ${b.age} عاماً</p>
        </div>
      </div>
      <div class="flex items-center gap-1.5">
        ${b.phone ? `
          <a href="https://wa.me/${b.phone.startsWith('0') ? '2' + b.phone : b.phone}?text=${encodeURIComponent('🎉 كل عام وأنت بخير بمناسبة يوم ميلادك!')}" target="_blank" class="w-7 h-7 rounded-full bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-white flex items-center justify-center transition-all duration-200 text-[10px]" title="تهنئة واتساب">
            <i class="fa-brands fa-whatsapp"></i>
          </a>
        ` : ''}
        <button onclick="openDetailsModal('${b.id}')" class="w-7 h-7 rounded-full bg-accent-gold-light text-luxury-gold hover:bg-luxury-gold hover:text-white flex items-center justify-center transition-all duration-200 text-[10px]">
          <i class="fa-solid fa-chevron-left"></i>
        </button>
      </div>
    `;
    
    container.appendChild(card);
  });
}

// ==========================================
// دليل الأفراد والبحث التفاعلي (Directory & Search)
// ==========================================

function renderDirectory() {
  const container = document.getElementById('directory-cards-container');
  container.innerHTML = '';
  
  if (FAMILY_DATA.length === 0) {
    container.innerHTML = `
      <div class="col-span-full py-12 text-center text-secondary">
        <i class="fa-solid fa-users-slash text-2xl mb-2"></i>
        <p>لا يوجد أفراد مسجلين في قاعدة البيانات حالياً.</p>
      </div>
    `;
    return;
  }
  
  FAMILY_DATA.forEach(member => {
    if (!member.name) return;
    const card = createMemberCard(member);
    container.appendChild(card);
  });
}

const YOUTH_IDS = ['ahmed_megahed', 'mahmoud_metwally', 'seyed_abdelgawad', 'mohamed_khaled', 'ahmed_magdy', 'mohamed_abdelgawad'];

function getMemberAge(member) {
  // Check if edited values exist in localStorage
  const savedEdits = localStorage.getItem(`sharbas_member_edits_${member.id}`);
  if (savedEdits) {
    try {
      const edits = JSON.parse(savedEdits);
      if (edits.age) return edits.age;
    } catch(e) {}
  }
  
  if (YOUTH_IDS.includes(member.id)) {
    const defaultAges = {
      'ahmed_megahed': '19 عاماً',
      'mahmoud_metwally': '21 عاماً',
      'seyed_abdelgawad': '20 عاماً',
      'mohamed_khaled': '16 عاماً',
      'ahmed_magdy': '18 عاماً',
      'mohamed_abdelgawad': '17 عاماً'
    };
    return defaultAges[member.id] || 'غير متوفر';
  }
  return 'غير متوفر';
}

function getMemberBirthDate(member) {
  const savedEdits = localStorage.getItem(`sharbas_member_edits_${member.id}`);
  if (savedEdits) {
    try {
      const edits = JSON.parse(savedEdits);
      if (edits.birthDate) return edits.birthDate;
    } catch(e) {}
  }
  
  if (YOUTH_IDS.includes(member.id)) {
    return member.birthDate || 'غير متوفر';
  }
  return 'غير متوفر';
}

function createMemberCard(member) {
  const card = document.createElement('div');
  card.className = 'group p-5 bg-card border border-color rounded-2xl shadow-lux hover:border-luxury-gold hover:scale-[1.01] transition-all duration-200 flex flex-col justify-between h-[190px] text-right';
  card.setAttribute('data-member-name', `${member.name} ${member.surname}`);
  
  let avatarHTML = '';
  if (member.avatar) {
    avatarHTML = `<img src="${member.avatar}" class="w-12 h-12 rounded-full object-cover border border-color shadow-sm">`;
  } else {
    const icon = member.gender === 'female' ? 'fa-user-dress' : 'fa-user';
    avatarHTML = `
      <div class="w-12 h-12 rounded-full bg-accent-gold-light border border-color flex items-center justify-center text-luxury-gold text-xl shadow-sm">
        <i class="fa-solid ${icon}"></i>
      </div>
    `;
  }
  
  // إزالة كلمة "فرع" من المسميات للامتثال لطلب المستخدم
  const branchNamesArabic = {
    metwally: 'عائلة متولي',
    zainab: 'عائلة زينب',
    gamila: 'عائلة جميلة',
    sona: 'عائلة سونه',
    basma: 'عائلة بسمة',
    megahed: 'عائلة مجاهد',
    gamal: 'عائلة جمال'
  };
  const branchLabel = branchNamesArabic[member.branch] || 'الجذور العائلية';
  const branchColor = member.branch ? 'text-luxury-gold bg-accent-gold-light border-color' : 'text-stone-400 bg-stone-900 border-transparent';
  
  const dobDisplay = getMemberBirthDate(member);
  
  card.innerHTML = `
    <div class="flex items-start justify-between gap-3">
      <div class="flex items-center gap-3">
        ${avatarHTML}
        <div>
          <h4 class="font-bold text-md font-title tracking-wide leading-snug group-hover:text-luxury-gold transition-colors duration-200">${member.name} ${member.surname}</h4>
          <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[9px] font-semibold mt-1.5 ${branchColor}">
            <i class="fa-solid fa-users text-[8px]"></i> ${branchLabel}
          </span>
        </div>
      </div>
    </div>
    
    <div class="flex items-center justify-between pt-3 border-t border-subtle mt-3">
      <div>
        <span class="block text-[8px] text-secondary">تاريخ الميلاد</span>
        <span class="text-[10px] font-semibold font-sans tracking-wide">${dobDisplay}</span>
      </div>
      
      <div class="flex items-center gap-1.5">
        <button onclick="openDetailsModal('${member.id}')" class="px-2.5 py-1.5 rounded-xl bg-secondary hover:bg-luxury-gold hover:text-white text-[10px] font-bold text-luxury-gold transition-all duration-200 flex items-center gap-1">
          <span>التفاصيل</span>
          <i class="fa-solid fa-chevron-left text-[8px]"></i>
        </button>
        <button onclick="openEditModal('${member.id}')" class="px-2.5 py-1.5 rounded-xl bg-secondary hover:bg-luxury-gold hover:text-white text-[10px] font-bold text-luxury-gold transition-all duration-200 flex items-center gap-1">
          <i class="fa-solid fa-pen-to-square text-[8px]"></i>
          <span>تعديل</span>
        </button>
      </div>
    </div>
  `;
  
  return card;
}

function filterDirectory() {
  const searchInput = document.getElementById('directory-search-input');
  const query = searchInput.value.trim().toLowerCase();
  const cards = document.querySelectorAll('#directory-cards-container > div');
  
  cards.forEach(card => {
    const name = (card.getAttribute('data-member-name') || '').toLowerCase();
    // starts-with logic: match beginning of first name or full name
    const firstWord = name.split(' ')[0];
    const match = query === '' || firstWord.startsWith(query) || name.startsWith(query);
    if (match) {
      card.classList.remove('hidden');
    } else {
      card.classList.add('hidden');
    }
  });
}

// ==========================================
// ألبومات العائلات الفردية (Branches)
// ==========================================

function setupBranchView(branchName) {
  // تصفية وحذف كلمة "فرع" بالكامل
  const branchDetails = {
    metwally: { title: 'عائلة متولي رجب شرباص', desc: 'سجل الصور التذكارية والبيانات لعائلة متولي رجب شرباص وأبنائهم', icon: 'fa-users' },
    zainab: { title: 'عائلة زينب رجب شرباص', desc: 'سجل الصور التذكارية والبيانات لعائلة زينب رجب شرباص وأبنائهم', icon: 'fa-users' },
    gamila: { title: 'عائلة جميلة رجب شرباص', desc: 'سجل الصور التذكارية والبيانات لعائلة جميلة رجب شرباص وأبنائهم', icon: 'fa-users' },
    sona: { title: 'عائلة سونه رجب شرباص', desc: 'سجل الصور التذكارية والبيانات لعائلة سونه رجب شرباص وأبنائهم', icon: 'fa-users' },
    basma: { title: 'عائلة بسمة رجب شرباص', desc: 'سجل الصور التذكارية والبيانات لعائلة بسمة رجب شرباص وأبنائهم', icon: 'fa-users' },
    megahed: { title: 'عائلة مجاهد رجب شرباص', desc: 'سجل الصور التذكارية والبيانات لعائلة مجاهد رجب شرباص وأبنائهم', icon: 'fa-users' },
    gamal: { title: 'عائلة جمال رجب شرباص', desc: 'سجل الصور التذكارية والبيانات لعائلة جمال رجب شرباص وأبنائهم', icon: 'fa-users' }
  };
  
  const details = branchDetails[branchName];
  if (!details) {
    window.location.hash = '#home';
    return;
  }
  
  document.getElementById('branch-title-placeholder').innerText = details.title;
  document.getElementById('branch-desc-placeholder').innerText = details.desc;
  document.getElementById('branch-icon-placeholder').innerHTML = `<i class="fa-solid ${details.icon}"></i>`;
  
  const membersContainer = document.getElementById('branch-members-container');
  membersContainer.innerHTML = '';
  
  const branchMembers = FAMILY_DATA.filter(m => m.branch === branchName);
  
  branchMembers.forEach(member => {
    if (!member.name) return;
    const card = createMemberCard(member);
    membersContainer.appendChild(card);
  });
  
  renderBranchGallery(branchName);
}

// ==========================================
// إدارة الصور التذكارية بذاكرة المتصفح (LocalStorage)
// ==========================================

const DEFAULT_GALLERY_IMAGES = {
  metwally: [
    { src: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?q=80&w=600&auto=format&fit=crop', caption: 'تجمع عائلة متولي رجب شرباص' }
  ],
  zainab: [
    { src: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=600&auto=format&fit=crop', caption: 'تجمع عائلة زينب رجب شرباص ومناسباتهم' }
  ],
  gamila: [
    { src: 'https://images.unsplash.com/photo-1543269865-cbf427effbad?q=80&w=600&auto=format&fit=crop', caption: 'تجمع عائلة جميلة رجب شرباص' }
  ],
  sona: [
    { src: 'https://images.unsplash.com/photo-1516627145497-ae6968895b74?q=80&w=600&auto=format&fit=crop', caption: 'ذكريات عائلة سونه رجب شرباص' }
  ],
  basma: [
    { src: 'https://images.unsplash.com/photo-1473643085228-59fcc45ce820?q=80&w=600&auto=format&fit=crop', caption: 'تجمع عائلة بسمة رجب شرباص' }
  ],
  megahed: [
    { src: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?q=80&w=600&auto=format&fit=crop', caption: 'تجمع عائلة مجاهد رجب شرباص وأبنائهم' }
  ],
  gamal: [
    { src: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=600&auto=format&fit=crop', caption: 'ذكريات عائلة جمال رجب شرباص في الصيف' }
  ]
};

function initDefaultGalleries() {
  const keys = Object.keys(DEFAULT_GALLERY_IMAGES);
  keys.forEach(key => {
    const storageKey = `sharbas_gallery_${key}`;
    if (!localStorage.getItem(storageKey)) {
      localStorage.setItem(storageKey, JSON.stringify(DEFAULT_GALLERY_IMAGES[key]));
    }
  });
}

function renderBranchGallery(branchName) {
  const container = document.getElementById('branch-gallery-container');
  container.innerHTML = '';
  
  const storageKey = `sharbas_gallery_${branchName}`;
  const images = JSON.parse(localStorage.getItem(storageKey)) || [];
  
  if (images.length === 0) {
    container.innerHTML = `
      <div class="col-span-full py-8 text-center text-secondary border border-dashed border-color rounded-xl bg-secondary">
        <i class="fa-solid fa-images text-xl mb-1"></i>
        <p class="text-[10px]">لا توجد صور تذكارية مرفوعة حالياً.</p>
      </div>
    `;
    return;
  }
  
  images.forEach(img => {
    const card = document.createElement('div');
    card.className = 'gallery-card group';
    card.innerHTML = `
      <img src="${img.src}" alt="${img.caption}" loading="lazy">
      <div class="gallery-overlay">
        <h5 class="font-bold text-xs leading-snug">${img.caption}</h5>
      </div>
    `;
    container.appendChild(card);
  });
}

function openUploadModal() {
  const modal = document.getElementById('upload-modal');
  modal.classList.remove('pointer-events-none');
  modal.classList.add('modal-active');
  modal.style.opacity = '1';
  
  document.getElementById('upload-file-input').value = '';
  document.getElementById('upload-caption-input').value = '';
  document.getElementById('upload-preview-container').classList.add('hidden');
  document.getElementById('upload-preview-img').src = '';
}

function closeUploadModal() {
  const modal = document.getElementById('upload-modal');
  modal.classList.remove('modal-active');
  modal.style.opacity = '0';
  setTimeout(() => {
    modal.classList.add('pointer-events-none');
  }, 200);
}

let uploadedBase64Image = '';
function previewUploadImage(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = function(e) {
    uploadedBase64Image = e.target.result;
    document.getElementById('upload-preview-img').src = uploadedBase64Image;
    document.getElementById('upload-preview-container').classList.remove('hidden');
  };
  reader.readAsDataURL(file);
}

function handleGalleryUpload(event) {
  event.preventDefault();
  
  const captionInput = document.getElementById('upload-caption-input');
  const caption = captionInput.value.trim();
  const hash = window.location.hash;
  
  if (!hash.startsWith('#branch-')) return;
  const branchName = hash.replace('#branch-', '');
  
  if (!uploadedBase64Image) {
    alert('⚠️ يرجى اختيار ملف صورة للرفع.');
    return;
  }
  
  const storageKey = `sharbas_gallery_${branchName}`;
  const currentImages = JSON.parse(localStorage.getItem(storageKey)) || [];
  
  currentImages.unshift({
    src: uploadedBase64Image,
    caption: caption
  });
  
  localStorage.setItem(storageKey, JSON.stringify(currentImages));
  renderBranchGallery(branchName);
  closeUploadModal();
  uploadedBase64Image = '';
}

// ==========================================
// النافذة المنبثقة التفصيلية للأعضاء (Details Modal)
// ==========================================

let activeModalMember = null;

function openDetailsModal(memberId) {
  const member = FAMILY_DATA.find(m => m.id === memberId);
  if (!member) return;
  
  activeModalMember = member;
  
  const readWrapper = document.getElementById('modal-read-wrapper');
  const editWrapper = document.getElementById('modal-edit-wrapper');
  if (readWrapper) readWrapper.classList.remove('hidden');
  if (editWrapper) editWrapper.classList.add('hidden');
  
  document.getElementById('modal-name').innerText = `${member.name} ${member.surname}`;
  
  const branchNamesArabic = {
    metwally: 'عائلة متولي',
    zainab: 'عائلة زينب',
    gamila: 'عائلة جميلة',
    sona: 'عائلة سونه',
    basma: 'عائلة بسمة',
    megahed: 'عائلة مجاهد',
    gamal: 'عائلة جمال'
  };
  const branchName = branchNamesArabic[member.branch] || 'الأجداد والجذور الأولى';
  document.getElementById('modal-branch-name').innerText = branchName;
  
  // Show/hide residence tag
  const residenceTag = document.getElementById('modal-residence-tag');
  const residenceName = document.getElementById('modal-residence-name');
  if (residenceTag && residenceName) {
    if (member.residence) {
      residenceName.textContent = `مقيم في: ${member.residence}`;
      residenceTag.classList.remove('hidden');
    } else {
      residenceTag.classList.add('hidden');
    }
  }
  
  const avatarImg = document.getElementById('modal-avatar');
  const avatarPlaceholder = document.getElementById('modal-avatar-placeholder');
  
  if (member.avatar) {
    avatarImg.src = member.avatar;
    avatarImg.classList.remove('hidden');
    avatarPlaceholder.classList.add('hidden');
  } else {
    avatarImg.src = '';
    avatarImg.classList.add('hidden');
    avatarPlaceholder.classList.remove('hidden');
    const icon = member.gender === 'female' ? 'fa-user-dress' : 'fa-user';
    avatarPlaceholder.innerHTML = `<i class="fa-solid ${icon}"></i>`;
  }
  
  const dobDisplay = getMemberBirthDate(member);
  const ageDisplay = getMemberAge(member);
  
  document.getElementById('modal-dob').innerText = dobDisplay;
  const ageEl = document.getElementById('modal-age');
  if (ageEl) ageEl.innerText = ageDisplay;
  
  document.getElementById('modal-phone').innerText = member.phone || 'غير متوفر';
  
  const socialsContainer = document.getElementById('modal-socials-container');
  socialsContainer.innerHTML = '';
  
  const socials = member.socials || {};
  const socialIcons = {
    facebook: { icon: 'fa-brands fa-facebook', name: 'فيسبوك', color: 'hover:bg-[#1877F2]' },
    whatsapp: { icon: 'fa-brands fa-whatsapp', name: 'واتساب', color: 'hover:bg-[#25D366]' },
    telegram: { icon: 'fa-brands fa-telegram', name: 'تيليجرام', color: 'hover:bg-[#0088cc]' },
    instagram: { icon: 'fa-brands fa-instagram', name: 'إنستغرام', color: 'hover:bg-gradient-to-tr hover:from-[#f9ce34] hover:to-[#ee2a7b]' },
    tiktok: { icon: 'fa-brands fa-tiktok', name: 'تيك توك', color: 'hover:bg-black hover:text-white' }
  };
  
  let hasSocial = false;
  Object.keys(socialIcons).forEach(key => {
    let url = socials[key];
    if (url) {
      hasSocial = true;
      if (key === 'whatsapp' && !url.startsWith('http')) {
        url = `https://wa.me/${url}`;
      }
      
      const link = document.createElement('a');
      link.href = url;
      link.target = '_blank';
      link.className = `w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-secondary border border-subtle transition-all duration-200 hover:text-white hover:scale-105 shadow-sm ${socialIcons[key].color}`;
      link.title = socialIcons[key].name;
      link.innerHTML = `<i class="${socialIcons[key].icon} text-sm"></i>`;
      socialsContainer.appendChild(link);
    }
  });
  
  if (!hasSocial) {
    socialsContainer.innerHTML = `<span class="text-[10px] text-secondary italic font-light">لا توجد وسائل تواصل مسجلة</span>`;
  }
  
  const childrenContainer = document.getElementById('modal-children-list');
  const childrenSection = document.getElementById('modal-children-section');
  childrenContainer.innerHTML = '';
  
  const rawChildren = FAMILY_DATA.filter(p => p.fatherId === member.id || p.motherId === member.id);
  
  if (rawChildren.length > 0) {
    childrenSection.classList.remove('hidden');
    rawChildren.forEach(child => {
      const childBtn = document.createElement('button');
      childBtn.onclick = () => {
        closeDetailsModal();
        setTimeout(() => openDetailsModal(child.id), 200);
      };
      childBtn.className = 'px-3 py-1 rounded-lg border border-color bg-secondary text-[10px] hover:border-luxury-gold hover:text-luxury-gold transition-colors shadow-sm flex items-center gap-1';
      
      const genderIcon = child.gender === 'female' ? 'fa-circle-dot text-rose-400' : 'fa-circle-dot text-blue-400';
      childBtn.innerHTML = `<i class="fa-solid ${genderIcon} text-[7px]"></i> <span>${child.name}</span>`;
      childrenContainer.appendChild(childBtn);
    });
  } else {
    childrenSection.classList.add('hidden');
  }
  
  const whatsappBtn = document.getElementById('modal-update-btn');
  const adminPhone = '201099887755'; // المهندس أحمد مجاهد رجب
  const messageText = `السلام عليكم يا باشمهندس أحمد، أود طلب تحديث معلومات التابعة لعائلة شرباص:\nالاسم الكامل: ${member.name} ${member.surname}\nالتصنيف: ${branchName}\nالمعرف الرقمي: ${member.id}\nالبيانات المراد تحديثها:`;
  whatsappBtn.href = `https://wa.me/${adminPhone}?text=${encodeURIComponent(messageText)}`;
  
  const modal = document.getElementById('details-modal');
  modal.classList.remove('pointer-events-none');
  modal.classList.add('modal-active');
  modal.style.opacity = '1';
}

function closeDetailsModal() {
  const modal = document.getElementById('details-modal');
  modal.classList.remove('modal-active');
  modal.style.opacity = '0';
  setTimeout(() => {
    modal.classList.add('pointer-events-none');
    activeModalMember = null;
  }, 200);
}

// دالة النسخ المباشر لرقم الهاتف
function copyModalPhone() {
  if (!activeModalMember || !activeModalMember.phone) return;
  
  navigator.clipboard.writeText(activeModalMember.phone).then(() => {
    const toast = document.getElementById('modal-copy-toast');
    toast.classList.remove('opacity-0');
    toast.classList.add('opacity-100', 'translate-y-[-3px]');
    
    setTimeout(() => {
      toast.classList.add('opacity-0');
      toast.classList.remove('opacity-100', 'translate-y-[-3px]');
    }, 1200);
  });
}

// ==========================================
// تبديل وضع التعديل في النافذة المنبثقة (Modal Edit Mode)
// ==========================================

let editedBase64Avatar = '';

function previewModalAvatar(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  const filenameEl = document.getElementById('edit-avatar-filename');
  if (filenameEl) filenameEl.textContent = file.name;
  
  const reader = new FileReader();
  reader.onload = function(e) {
    // Compress base64 profile image for localStorage
    const img = new Image();
    img.onload = function() {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const maxW = 150;
      const maxH = 150;
      let w = img.width;
      let h = img.height;
      if (w > h) {
        if (w > maxW) { h *= maxW / w; w = maxW; }
      } else {
        if (h > maxH) { w *= maxH / h; h = maxH; }
      }
      canvas.width = w;
      canvas.height = h;
      ctx.drawImage(img, 0, 0, w, h);
      editedBase64Avatar = canvas.toDataURL('image/jpeg', 0.7);
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

// دالة لفتح المودال مباشرة في وضع التعديل
function openEditModal(memberId) {
  openDetailsModal(memberId);
  const editWrapper = document.getElementById('modal-edit-wrapper');
  if (editWrapper && editWrapper.classList.contains('hidden')) {
    toggleModalEditMode();
  }
}

// دالة الانتقال السلس للنصوص لمحاكاة الأنيميشن الفاخرة
function transitionTextContent(elementId, newText, duration = 1000) {
  const el = document.getElementById(elementId);
  if (!el) return;
  const half = duration / 2;
  el.style.transition = `opacity ${half}ms ease-in-out, transform ${half}ms ease-in-out`;
  el.style.opacity = '0';
  el.style.transform = 'translateY(6px)';
  setTimeout(() => {
    el.textContent = newText;
    el.style.opacity = '1';
    el.style.transform = 'translateY(0)';
  }, half);
}

// دالة جاهزة للربط بقاعدة البيانات والـ API في المستقبل
async function saveMemberEditsToDatabase(memberId, edits) {
  /*
  try {
    const response = await fetch(`/api/members/${memberId}/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(edits)
    });
    return await response.json();
  } catch (error) {
    console.error('Error saving member edits to database:', error);
  }
  */
  
  // الحفظ المحلي حالياً في LocalStorage لضمان التشغيل الفوري واستمرارية البيانات
  const key = `sharbas_member_edits_${memberId}`;
  localStorage.setItem(key, JSON.stringify(edits));
  return { status: 'success', data: edits };
}

function toggleModalEditMode() {
  const readWrapper = document.getElementById('modal-read-wrapper');
  const editWrapper = document.getElementById('modal-edit-wrapper');
  if (!readWrapper || !editWrapper) return;
  
  const isEditing = !editWrapper.classList.contains('hidden');
  
  if (isEditing) {
    editWrapper.classList.add('hidden');
    readWrapper.classList.remove('hidden');
  } else {
    editedBase64Avatar = '';
    const filenameEl = document.getElementById('edit-avatar-filename');
    if (filenameEl) filenameEl.textContent = 'لم يتم اختيار ملف';
    
    if (activeModalMember) {
      const socials = activeModalMember.socials || {};
      const firstnameEl = document.getElementById('edit-firstname-input');
      const surnameEl = document.getElementById('edit-surname-input');
      const phoneEl = document.getElementById('edit-phone-input');
      const dobEl = document.getElementById('edit-dob-input');
      const ageEl = document.getElementById('edit-age-input');
      const fbEl = document.getElementById('edit-facebook-input');
      const igEl = document.getElementById('edit-instagram-input');
      const waEl = document.getElementById('edit-whatsapp-input');
      const ttEl = document.getElementById('edit-tiktok-input');
      const tgEl = document.getElementById('edit-telegram-input');
      
      if (firstnameEl) firstnameEl.value = activeModalMember.name || '';
      if (surnameEl) surnameEl.value = activeModalMember.surname || '';
      if (phoneEl) phoneEl.value = activeModalMember.phone || '';
      if (dobEl) dobEl.value = activeModalMember.birthDate || '';
      if (ageEl) ageEl.value = activeModalMember.age || '';
      if (fbEl) fbEl.value = socials.facebook || '';
      if (igEl) igEl.value = socials.instagram || '';
      if (waEl) waEl.value = socials.whatsapp || '';
      if (ttEl) ttEl.value = socials.tiktok || '';
      if (tgEl) tgEl.value = socials.telegram || '';
    }
    editWrapper.classList.remove('hidden');
    readWrapper.classList.add('hidden');
  }
}

async function saveModalChanges() {
  if (!activeModalMember) return;
  
  const name = document.getElementById('edit-firstname-input')?.value.trim() || '';
  const surname = document.getElementById('edit-surname-input')?.value.trim() || '';
  const phone = document.getElementById('edit-phone-input')?.value.trim() || '';
  const dob = document.getElementById('edit-dob-input')?.value.trim() || '';
  const age = document.getElementById('edit-age-input')?.value.trim() || '';
  const facebook = document.getElementById('edit-facebook-input')?.value.trim() || '';
  const instagram = document.getElementById('edit-instagram-input')?.value.trim() || '';
  const whatsapp = document.getElementById('edit-whatsapp-input')?.value.trim() || '';
  const tiktok = document.getElementById('edit-tiktok-input')?.value.trim() || '';
  const telegram = document.getElementById('edit-telegram-input')?.value.trim() || '';
  
  // Save to localStorage / simulate DB write
  const key = `sharbas_member_edits_${activeModalMember.id}`;
  const edits = JSON.parse(localStorage.getItem(key)) || { phone: '', socials: {} };
  
  edits.name = name;
  edits.surname = surname;
  edits.phone = phone;
  edits.birthDate = dob;
  edits.age = age;
  edits.socials = { facebook, instagram, whatsapp, tiktok, telegram };
  if (editedBase64Avatar) {
    edits.avatar = editedBase64Avatar;
  }
  
  await saveMemberEditsToDatabase(activeModalMember.id, edits);
  
  // Apply edits to memory immediately
  activeModalMember.name = name;
  activeModalMember.surname = surname;
  activeModalMember.phone = phone;
  activeModalMember.birthDate = dob;
  activeModalMember.age = age;
  activeModalMember.socials = Object.assign(activeModalMember.socials || {}, edits.socials);
  if (editedBase64Avatar) {
    activeModalMember.avatar = editedBase64Avatar;
  }
  
  // Update reference inside FAMILY_DATA
  const dbMember = FAMILY_DATA.find(m => m.id === activeModalMember.id);
  if (dbMember) {
    dbMember.name = name;
    dbMember.surname = surname;
    if (editedBase64Avatar) dbMember.avatar = editedBase64Avatar;
  }
  
  // Refresh views
  toggleModalEditMode();
  openDetailsModal(activeModalMember.id);
  renderDirectory();
  renderYouthSection();
  
  // Toast confirmation
  const toast = document.getElementById('modal-copy-toast');
  if (toast) {
    toast.textContent = 'تم حفظ التعديلات ✓';
    toast.classList.remove('opacity-0');
    toast.classList.add('opacity-100');
    setTimeout(() => {
      toast.classList.add('opacity-0');
      toast.classList.remove('opacity-100');
      toast.textContent = 'تم نسخ الرقم';
    }, 1500);
  }
}

// ==========================================
// قسم شباب العيلة (Youth Section Renderer)
// ==========================================

const YOUTH_AGE_MIN = 15;
const YOUTH_AGE_MAX = 40;

function renderYouthSection() {
  const container = document.getElementById('youth-cards-container');
  if (!container) return;
  container.innerHTML = '';
  
  // Specific 6 youth members requested by the user
  const youthIds = ['ahmed_megahed', 'mahmoud_metwally', 'seyed_abdelgawad', 'mohamed_khaled', 'ahmed_magdy', 'mohamed_abdelgawad'];
  
  const branchNamesArabic = {
    metwally: 'عائلة متولي', zainab: 'عائلة زينب', gamila: 'عائلة جميلة',
    sona: 'عائلة سونه', basma: 'عائلة بسمة', megahed: 'عائلة مجاهد', gamal: 'عائلة جمال'
  };

  youthIds.forEach(id => {
    const m = FAMILY_DATA.find(member => member.id === id);
    if (!m) return;
    
    // Exact requested/custom ages with helper
    const age = getMemberAge(m);
    
    const branchLabel = branchNamesArabic[m.branch] || 'الجذور الأولى';
    const genderIcon = m.gender === 'female' ? 'fa-user-dress' : 'fa-user';
    const socials = m.socials || {};
    
    let avatarHTML = m.avatar
      ? `<img src="${m.avatar}" class="w-14 h-14 rounded-full object-cover border border-color shadow-sm">`
      : `<div class="w-14 h-14 rounded-full bg-accent-gold-light border border-color flex items-center justify-center text-luxury-gold text-2xl shadow-sm"><i class="fa-solid ${genderIcon}"></i></div>`;
    
    // Professional contact icons for TikTok, Telegram, WhatsApp, Facebook (always 4 icons)
    const fbLink = socials.facebook || 'https://www.facebook.com';
    const waLink = socials.whatsapp ? (socials.whatsapp.startsWith('http') ? socials.whatsapp : `https://wa.me/${socials.whatsapp}`) : `https://wa.me/${m.phone || '201030040715'}`;
    const tgLink = socials.telegram || 'https://t.me';
    const ttLink = socials.tiktok || 'https://www.tiktok.com';
    
    const socialLinks = `
      <a href="${waLink}" target="_blank" class="w-8 h-8 rounded-xl bg-secondary flex items-center justify-center text-[#25D366] hover:bg-[#25D366] hover:text-white transition-all text-base border border-subtle" title="واتساب"><i class="fa-brands fa-whatsapp"></i></a>
      <a href="${fbLink}" target="_blank" class="w-8 h-8 rounded-xl bg-secondary flex items-center justify-center text-[#1877F2] hover:bg-[#1877F2] hover:text-white transition-all text-base border border-subtle" title="فيسبوك"><i class="fa-brands fa-facebook-f"></i></a>
      <a href="${tgLink}" target="_blank" class="w-8 h-8 rounded-xl bg-secondary flex items-center justify-center text-[#0088cc] hover:bg-[#0088cc] hover:text-white transition-all text-base border border-subtle" title="تيليجرام"><i class="fa-brands fa-telegram"></i></a>
      <a href="${ttLink}" target="_blank" class="w-8 h-8 rounded-xl bg-secondary flex items-center justify-center text-primary hover:bg-black hover:text-white transition-all text-base border border-subtle" title="تيك توك"><i class="fa-brands fa-tiktok"></i></a>
      <button onclick="event.stopPropagation(); openEditModal('${m.id}')" class="w-8 h-8 rounded-xl bg-secondary flex items-center justify-center text-luxury-gold hover:bg-luxury-gold hover:text-white transition-all text-base border border-subtle" style="margin-right: auto;" title="تعديل"><i class="fa-solid fa-pen-to-square"></i></button>
    `;
    
    const card = document.createElement('div');
    card.className = 'group p-5 bg-card border border-color rounded-2xl shadow-lux hover:border-luxury-gold hover:scale-[1.01] transition-all duration-200 text-right cursor-pointer flex flex-col justify-between h-[180px]';
    
    card.onclick = (e) => {
      if (!e.target.closest('a') && !e.target.closest('button')) {
        openDetailsModal(m.id);
      }
    };
    
    card.innerHTML = `
      <div class="flex items-center gap-3">
        ${avatarHTML}
        <div class="flex-grow min-w-0">
          <h4 class="font-bold text-sm font-title group-hover:text-luxury-gold transition-colors truncate">${m.name} ${m.surname}</h4>
          <p class="text-[9px] text-secondary mt-0.5">${branchLabel}</p>
          <span class="inline-block mt-1 px-2.5 py-0.5 rounded-full bg-accent-gold-light text-luxury-gold text-[9px] font-bold border border-color">${age}</span>
        </div>
      </div>
      <div class="flex items-center gap-1.5 pt-2.5 border-t border-subtle mt-3 w-full">
        ${socialLinks}
      </div>
    `;
    container.appendChild(card);
  });
}


// ==========================================
// دوّار الدعاء للمتوفين (Deceased Dua Cycler)
// ==========================================

const DECEASED_DUAS = [
  'اللهم اغفر لهم وارحمهم وعافهم واعف عنهم، وأكرم نزلهم واجعل قبورهم روضة من رياض الجنة.',
  'اللهم اجعل قبورهم روضةً من رياض الجنة، ولا تجعلها حفرةً من حفر النيران.',
  'اللهم ألبسهم من نور الجنة، وأعلِ درجتهم في المهديين، واخلفهم في عقبهم في الغابرين.',
  'ربنا اغفر لنا ولإخواننا الذين سبقونا بالإيمان ولا تجعل في قلوبنا غلاً للذين آمنوا.',
  'اللهم نوّر لهم في قبورهم، ووسّع عليهم فيها، وآنس وحشتهم وارفع درجتهم.'
];
let currentDuaIndex = 0;

function cycleDeceasedDua() {
  currentDuaIndex = (currentDuaIndex + 1) % DECEASED_DUAS.length;
  transitionTextContent('deceased-dua-text', `"${DECEASED_DUAS[currentDuaIndex]}"`, 1000);
}

// ==========================================
// الأذكار الصباحية والمسائية (Adhkar System)
// ==========================================

const ADHKAR_DATA = {
  sabah: [
    'أصبحنا وأصبح الملك لله، والحمد لله، لا إله إلا الله وحده لا شريك له.',
    'اللهم بك أصبحنا وبك أمسينا وبك نحيا وبك نموت وإليك النشور.',
    'اللهم أنت ربي لا إله إلا أنت، خلقتني وأنا عبدك، وأنا على عهدك ووعدك ما استطعت.',
    'رضيتُ بالله ربًا، وبالإسلام دينًا، وبمحمد ﷺ نبيًا ورسولًا.',
    'أعوذ بكلمات الله التامات من شر ما خلق. (ثلاث مرات)'
  ],
  masa: [
    'أمسينا وأمسى الملك لله، والحمد لله، لا إله إلا الله وحده لا شريك له.',
    'اللهم بك أمسينا وبك أصبحنا وبك نحيا وبك نموت وإليك المصير.',
    'اللهم إني أسألك العافية في الدنيا والآخرة.',
    'اللهم اجعل أول هذا الليل صلاحاً، وأوسطه فلاحاً، وآخره نجاحاً.',
    'أعوذ بكلمات الله التامات من شر ما خلق. (ثلاث مرات)'
  ]
};
let currentAdhkarType = 'sabah';
let currentAdhkarIndex = 0;

function switchAdhkarType(type) {
  currentAdhkarType = type;
  currentAdhkarIndex = 0;
  updateAdhkarDisplay();
  
  document.getElementById('adhkar-sabah-btn')?.classList.toggle('bg-luxury-gold', type === 'sabah');
  document.getElementById('adhkar-sabah-btn')?.classList.toggle('text-white', type === 'sabah');
  document.getElementById('adhkar-sabah-btn')?.classList.toggle('text-secondary', type !== 'sabah');
  document.getElementById('adhkar-masa-btn')?.classList.toggle('bg-luxury-gold', type === 'masa');
  document.getElementById('adhkar-masa-btn')?.classList.toggle('text-white', type === 'masa');
  document.getElementById('adhkar-masa-btn')?.classList.toggle('text-secondary', type !== 'masa');
}

function updateAdhkarDisplay() {
  const el = document.getElementById('adhkar-content-text');
  if (!el) return;
  const list = ADHKAR_DATA[currentAdhkarType] || [];
  el.textContent = list[currentAdhkarIndex] || '';
}

// ==========================================
// التسبيح الإلكتروني (Electronic Tasbeeh)
// ==========================================

const TASBEEH_PHRASES = ['سبحان الله', 'الحمد لله', 'لا إله إلا الله', 'الله أكبر', 'لا حول ولا قوة إلا بالله'];
let tasbeehCount = 0;
let tasbeehPhraseIndex = 0;
const TASBEEH_AUTO_CYCLE = 30;

function incrementTasbeeh() {
  tasbeehCount++;
  
  // Update counts and phrases in all widgets in real-time
  updateTasbeehWidgets();
  
  // Cycle automatically every 30 counts
  if (tasbeehCount >= TASBEEH_AUTO_CYCLE) {
    setTimeout(() => {
      tasbeehCount = 0;
      tasbeehPhraseIndex = (tasbeehPhraseIndex + 1) % TASBEEH_PHRASES.length;
      updateTasbeehWidgets();
    }, 400); // 400ms delay to let user see "30" count
  }
}

function updateTasbeehWidgets() {
  const countString = tasbeehCount.toString();
  const phraseText = TASBEEH_PHRASES[tasbeehPhraseIndex];
  
  // 1. Homepage card
  const hCount = document.getElementById('tasbeeh-count');
  const hPhrase = document.getElementById('tasbeeh-phrase');
  if (hCount) {
    hCount.textContent = countString;
    hCount.classList.add('scale-125');
    setTimeout(() => hCount.classList.remove('scale-125'), 150);
  }
  if (hPhrase) hPhrase.textContent = phraseText;
  
  // 2. Top bar
  const tCount = document.getElementById('top-tasbeeh-count');
  const tPhrase = document.getElementById('top-tasbeeh-phrase');
  if (tCount) tCount.textContent = countString;
  if (tPhrase) tPhrase.textContent = phraseText;
  
  // 3. Dedicated page circular counter
  const fCount = document.getElementById('full-tasbeeh-count');
  const fPhrase = document.getElementById('full-tasbeeh-phrase');
  if (fCount) {
    fCount.textContent = countString;
    fCount.classList.add('scale-110');
    setTimeout(() => fCount.classList.remove('scale-110'), 150);
  }
  if (fPhrase) fPhrase.textContent = phraseText;
}

// ==========================================
// القرآن الكريم الكامل (Full Page Quran Module)
// ==========================================

let quranFullFontSize = 20;

async function initFullQuranModule() {
  const surahSelect = document.getElementById('quran-full-surah-select');
  if (!surahSelect) return;
  
  if (surahSelect.children.length > 0) return; // Already initialized
  
  surahSelect.innerHTML = '<option value="">اختر سورة</option>';
  
  try {
    const res = await fetch('https://api.alquran.cloud/v1/surah');
    const data = await res.json();
    if (data.status === 'OK') {
      data.data.forEach(surah => {
        const opt = document.createElement('option');
        opt.value = surah.number;
        opt.textContent = `${surah.number}. ${surah.name}`;
        surahSelect.appendChild(opt);
      });
    }
  } catch (e) {
    surahSelect.innerHTML = '<option value="">تعذر التحميل</option>';
  }
  
  const juzSelect = document.getElementById('quran-full-juz-select');
  if (juzSelect && juzSelect.children.length <= 1) {
    juzSelect.innerHTML = '<option value="">اختر جزءاً</option>';
    for (let i = 1; i <= 30; i++) {
      const opt = document.createElement('option');
      opt.value = i;
      opt.textContent = `الجزء ${i}`;
      juzSelect.appendChild(opt);
    }
  }
}

async function loadFullQuranSurah() {
  const select = document.getElementById('quran-full-surah-select');
  const viewer = document.getElementById('quran-full-text');
  const title = document.getElementById('quran-full-title');
  if (!select || !viewer || !select.value) return;
  
  viewer.textContent = 'جارٍ التحميل والتهيئة...';
  
  try {
    const res = await fetch(`https://api.alquran.cloud/v1/surah/${select.value}/ar.alafasy`);
    const data = await res.json();
    if (data.status === 'OK') {
      const verses = data.data.ayahs.map(a => a.text).join('  ۝  ');
      viewer.textContent = verses;
      viewer.style.fontSize = quranFullFontSize + 'px';
      if (title) title.textContent = `سُورَةُ ${data.data.name}`;
      
      // Reset juz select
      const juzSelect = document.getElementById('quran-full-juz-select');
      if (juzSelect) juzSelect.value = '';

      // التمرير السلس للمصحف على الهاتف
      if (window.innerWidth < 768) {
        viewer.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  } catch(e) {
    viewer.textContent = 'تعذر تحميل السورة الكريمة. يرجى التحقق من اتصال الإنترنت الخاص بك.';
  }
}

async function loadFullQuranJuz() {
  const select = document.getElementById('quran-full-juz-select');
  const viewer = document.getElementById('quran-full-text');
  const title = document.getElementById('quran-full-title');
  if (!select || !viewer || !select.value) return;
  
  viewer.textContent = 'جارٍ التحميل والتهيئة...';
  
  try {
    const res = await fetch(`https://api.alquran.cloud/v1/juz/${select.value}/ar.alafasy`);
    const data = await res.json();
    if (data.status === 'OK') {
      const verses = data.data.ayahs.map(a => a.text).join('  ۝  ');
      viewer.textContent = verses;
      viewer.style.fontSize = quranFullFontSize + 'px';
      if (title) title.textContent = `الجزء المبارك ${select.value}`;
      
      // Reset surah select
      const surahSelect = document.getElementById('quran-full-surah-select');
      if (surahSelect) surahSelect.value = '';

      // التمرير السلس للمصحف على الهاتف
      if (window.innerWidth < 768) {
        viewer.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  } catch(e) {
    viewer.textContent = 'تعذر تحميل الجزء المبارك. يرجى التحقق من اتصال الإنترنت الخاص بك.';
  }
}

function changeFullQuranFontSize(delta) {
  quranFullFontSize = Math.max(12, Math.min(36, quranFullFontSize + delta));
  const viewer = document.getElementById('quran-full-text');
  if (viewer) viewer.style.fontSize = quranFullFontSize + 'px';
}

// ==========================================
// الأذكار الكاملة والسبحة الكبرى (Full Page Adhkar)
// ==========================================

const FULL_ADHKAR_DATA = {
  sabah: [
    { text: 'أصبحنا وأصبح الملك لله، والحمد لله، لا إله إلا الله وحده لا شريك له له الملك وله الحمد وهو على كل شيء قدير.', count: 1 },
    { text: 'اللهم بك أصبحنا، وبك أمسينا، وبك نحيا، وبك نموت، وإليك النشور.', count: 1 },
    { text: 'اللهم أنت ربي لا إله إلا أنت، خلقتني وأنا عبدك، وأنا على عهدك ووعدك ما استطعت، أعوذ بك من شر ما صنعت، أبوء لك بنعمتك علي، وأبوء بذنبي فاغفر لي فإنه لا يغفر الذنوب إلا أنت.', count: 1 },
    { text: 'رضيت بالله رباً، وبالإسلام ديناً، وبمحمد ﷺ نبياً ورسولاً. (ثلاث مرات)', count: 3 },
    { text: 'بسم الله الذي لا يضر مع اسمه شيء في الأرض ولا في السماء وهو السميع العليم. (ثلاث مرات)', count: 3 },
    { text: 'أعوذ بكلمات الله التامات من شر ما خلق. (ثلاث مرات)', count: 3 },
    { text: 'يا حي يا قيوم برحمتك أستغيث أصلح لي شأني كله ولا تكلني إلى نفسي طرفة عين.', count: 1 },
    { text: 'سبحان الله وبحمده: عدد خلقه، ورضا نفسه، وزنة عرشه، ومداد كلماته. (ثلاث مرات)', count: 3 }
  ],
  masa: [
    { text: 'أمسينا وأمسى الملك لله، والحمد لله، لا إله إلا الله وحده لا شريك له له الملك وله الحمد وهو على كل شيء قدير.', count: 1 },
    { text: 'اللهم بك أمسينا، وبك أصبحنا، وبك نحيا، وبك نموت، وإليك المصير.', count: 1 },
    { text: 'اللهم أنت ربي لا إله إلا أنت، خلقتني وأنا عبدك، وأنا على عهدك ووعدك ما استطعت، أعوذ بك من شر ما صنعت، أبوء لك بنعمتك علي، وأبوء بذنبي فاغفر لي فإنه لا يغفر الذنوب إلا أنت.', count: 1 },
    { text: 'رضيت بالله رباً، وبالإسلام ديناً، وبمحمد ﷺ نبياً ورسولاً. (ثلاث مرات)', count: 3 },
    { text: 'بسم الله الذي لا يضر مع اسمه شيء في الأرض ولا في السماء وهو السميع العليم. (ثلاث مرات)', count: 3 },
    { text: 'أعوذ بكلمات الله التامات من شر ما خلق. (ثلاث مرات)', count: 3 },
    { text: 'يا حي يا قيوم برحمتك أستغيث أصلح لي شأني كله ولا تكلني إلى نفسي طرفة عين.', count: 1 },
    { text: 'اللهم عافني في بدني، اللهم عافني في سمعي، اللهم عافني في بصري، لا إله إلا أنت. (ثلاث مرات)', count: 3 }
  ],
  general: [
    { text: 'لا إله إلا الله وحده لا شريك له، له الملك وله الحمد، وهو على كل شيء قدير. (عشر مرات)', count: 10 },
    { text: 'سبحان الله وبحمده، سبحان الله العظيم. (ثلاث وثلاثين مرة)', count: 33 },
    { text: 'أستغفر الله وأتوب إليه. (مائة مرة)', count: 100 },
    { text: 'اللهم صل وسلم وبارك على نبينا محمد. (عشر مرات)', count: 10 },
    { text: 'لا حول ولا قوة إلا بالله العلي العظيم. (ثلاث وثلاثين مرة)', count: 33 }
  ],
  arafah: [
    { text: 'لا إله إلا الله وحده لا شريك له، له الملك وله الحمد، وهو على كل شيء قدير. (خير الدعاء دعاء يوم عرفة - مائة مرة)', count: 100 },
    { text: 'لبيك اللهم لبيك، لبيك لا شريك لك لبيك، إن الحمد والنعمة لك والملك، لا شريك لك. (تلبية الحج - ثلاث وثلاثين مرة)', count: 33 },
    { text: 'اللهم إنك عفو كريم تحب العفو فاعفُ عني. (طلب العفو والعتق - ثلاث وثلاثين مرة)', count: 33 },
    { text: 'اللهم إني أسألك الهدى والتقى والعفاف والغنى. (صلاح النفس - عشر مرات)', count: 10 },
    { text: 'ربنا آتنا في الدنيا حسنة وفي الآخرة حسنة وقنا عذاب النار. (جوامع الدعاء - عشر مرات)', count: 10 },
    { text: 'لا إله إلا أنت سبحانك إني كنت من الظالمين. (دعاء ذي النون - ثلاث وثلاثين مرة)', count: 33 },
    { text: 'اللهم إني ظلمت نفسي ظلماً كثيراً ولا يغفر الذنوب إلا أنت، فاغفر لي مغفرة من عندك وارحمني، إنك أنت الغفور الرحيم. (طلب الرحمة والمغفرة - ثلاث مرات)', count: 3 },
    { text: 'أستغفر الله العظيم الذي لا إله إلا هو الحي القيوم وأتوب إليه. (توبة واستغفار - مائة مرة)', count: 100 },
    { text: 'اللهم ارزقنا الوقوف بعرفة، وعتق رقابنا من النار، وغفران ذنوبنا، ودخول الجنة مع الأبرار. (دعاء يوم عرفة المبارك - سبع مرات)', count: 7 },
    { text: 'اللهم صلِّ وسلِّم وبارِك على نبيِّنا محمد وعلى آله وصحبه أجمعين. (مائة مرة)', count: 100 }
  ]
};

let currentFullAdhkarType = 'sabah';
let fullAdhkarCounts = {};

function initFullAdhkarModule() {
  renderFullAdhkarList();
  
  // Set phrase on giant tasbeeh
  const phraseEl = document.getElementById('full-tasbeeh-phrase');
  if (phraseEl) phraseEl.textContent = TASBEEH_PHRASES[tasbeehPhraseIndex];
}

function switchFullAdhkarType(type) {
  currentFullAdhkarType = type;
  
  // Update tabs UI
  const sabahBtn = document.getElementById('full-adhkar-sabah-btn');
  const masaBtn = document.getElementById('full-adhkar-masa-btn');
  const generalBtn = document.getElementById('full-adhkar-general-btn');
  const arafahBtn = document.getElementById('full-adhkar-arafah-btn');
  
  if (sabahBtn) {
    sabahBtn.className = type === 'sabah' 
      ? 'px-3 py-1.5 text-[11px] sm:text-xs font-bold rounded-lg bg-luxury-gold text-white transition-all shadow-sm' 
      : 'px-3 py-1.5 text-[11px] sm:text-xs font-bold rounded-lg text-secondary transition-all';
  }
  if (masaBtn) {
    masaBtn.className = type === 'masa' 
      ? 'px-3 py-1.5 text-[11px] sm:text-xs font-bold rounded-lg bg-luxury-gold text-white transition-all shadow-sm' 
      : 'px-3 py-1.5 text-[11px] sm:text-xs font-bold rounded-lg text-secondary transition-all';
  }
  if (generalBtn) {
    generalBtn.className = type === 'general' 
      ? 'px-3 py-1.5 text-[11px] sm:text-xs font-bold rounded-lg bg-luxury-gold text-white transition-all shadow-sm' 
      : 'px-3 py-1.5 text-[11px] sm:text-xs font-bold rounded-lg text-secondary transition-all';
  }
  if (arafahBtn) {
    arafahBtn.className = type === 'arafah' 
      ? 'px-3 py-1.5 text-[11px] sm:text-xs font-bold rounded-lg bg-luxury-gold text-white transition-all shadow-sm' 
      : 'px-3 py-1.5 text-[11px] sm:text-xs font-bold rounded-lg text-secondary transition-all';
  }
  
  renderFullAdhkarList();
}

function renderFullAdhkarList() {
  const container = document.getElementById('full-adhkar-list-container');
  if (!container) return;
  container.innerHTML = '';
  
  const list = FULL_ADHKAR_DATA[currentFullAdhkarType] || [];
  
  list.forEach((item, index) => {
    const key = `full_adhkar_${currentFullAdhkarType}_${index}`;
    if (fullAdhkarCounts[key] === undefined) {
      fullAdhkarCounts[key] = item.count;
    }
    
    const count = fullAdhkarCounts[key];
    const isCompleted = count === 0;
    
    const card = document.createElement('div');
    card.className = `p-4 rounded-2xl border transition-all duration-300 ${
      isCompleted 
        ? 'bg-green-500/5 border-green-500/20 opacity-70' 
        : 'bg-secondary border-color hover:border-luxury-gold/30'
    }`;
    
    card.innerHTML = `
      <div class="flex items-center justify-between gap-4">
        <p class="text-xs sm:text-sm md:text-[15px] leading-relaxed text-primary font-semibold flex-grow text-right">${item.text}</p>
        
        <button onclick="decrementFullAdhkar('${key}')" 
          ${isCompleted ? 'disabled' : ''}
          class="shrink-0 w-12 h-12 rounded-xl flex flex-col items-center justify-center font-bold transition-all duration-200 ${
            isCompleted 
              ? 'bg-green-500/20 text-green-500 cursor-default' 
              : 'bg-card border border-color hover:border-luxury-gold text-luxury-gold hover:bg-accent-gold-light active:scale-95'
          }">
          <span class="text-lg font-sans leading-none">${count}</span>
          <span class="text-[8px] mt-0.5 font-light">${isCompleted ? 'تم' : 'تكرار'}</span>
        </button>
      </div>
    `;
    container.appendChild(card);
  });
}

function decrementFullAdhkar(key) {
  if (fullAdhkarCounts[key] && fullAdhkarCounts[key] > 0) {
    fullAdhkarCounts[key]--;
    renderFullAdhkarList();
  }
}

// ---------------------
// السبحة الإلكترونية الكبرى
// ---------------------

let fullTasbeehCount = 0;
let fullTasbeehPhraseIndex = 0;

function incrementFullTasbeeh() {
  fullTasbeehCount++;
  const countEl = document.getElementById('full-tasbeeh-count');
  const phraseEl = document.getElementById('full-tasbeeh-phrase');
  
  if (countEl) countEl.textContent = fullTasbeehCount;
  
  // Cycle automatically every 33 times
  if (fullTasbeehCount % 33 === 0) {
    cycleFullTasbeehPhrase();
  }
  
  // Pulsing animation
  if (countEl) {
    countEl.classList.add('scale-110');
    setTimeout(() => countEl.classList.remove('scale-110'), 150);
  }
}

function resetFullTasbeeh() {
  fullTasbeehCount = 0;
  const countEl = document.getElementById('full-tasbeeh-count');
  if (countEl) countEl.textContent = '0';
}

function cycleFullTasbeehPhrase() {
  fullTasbeehPhraseIndex = (fullTasbeehPhraseIndex + 1) % TASBEEH_PHRASES.length;
  const phraseEl = document.getElementById('full-tasbeeh-phrase');
  if (phraseEl) {
    phraseEl.style.opacity = '0';
    setTimeout(() => {
      phraseEl.textContent = TASBEEH_PHRASES[fullTasbeehPhraseIndex];
      phraseEl.style.opacity = '1';
    }, 200);
  }
}

// ==========================================
// ذكريات العيلة التشاركية (Family Memories Module)
// ==========================================

const DEFAULT_MEMORIES = [
  { id: 1, type: 'image', src: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?q=80&w=600&auto=format&fit=crop', caption: 'التجمع العائلي الأكبر ليلة العيد', uploader: 'أحمد مجاهد', timestamp: '2026-05-20' },
  { id: 2, type: 'image', src: 'https://images.unsplash.com/photo-1543269865-cbf427effbad?q=80&w=600&auto=format&fit=crop', caption: 'ذكريات الصيف المبارك في المصيف العائلي', uploader: 'محمود متولي', timestamp: '2025-08-12' }
];

function renderHomepageMemories() {
  const container = document.getElementById('memories-media-container');
  if (!container) return;
  container.innerHTML = '';
  
  const memories = JSON.parse(localStorage.getItem('sharbas_memories')) || [];
  if (memories.length === 0) {
    localStorage.setItem('sharbas_memories', JSON.stringify(DEFAULT_MEMORIES));
    renderHomepageMemories();
    return;
  }
  
  memories.forEach(m => {
    const card = document.createElement('div');
    card.className = 'gallery-card group';
    
    let mediaHTML = '';
    if (m.type === 'video') {
      mediaHTML = `<video src="${m.src}" controls class="w-full h-[220px] object-cover bg-black"></video>`;
    } else {
      mediaHTML = `<img src="${m.src}" alt="${m.caption}" class="w-full h-[220px] object-cover" loading="lazy">`;
    }
    
    card.innerHTML = `
      <div class="relative overflow-hidden rounded-t-xl bg-black">
        ${mediaHTML}
      </div>
      <div class="p-4 bg-card border-t border-subtle">
        <h5 class="font-bold text-xs leading-relaxed text-primary mb-1">${m.caption}</h5>
        <div class="flex items-center justify-between text-[8px] text-secondary mt-2">
          <span>رافع الذكرى: ${m.uploader}</span>
          <span>${m.timestamp}</span>
        </div>
      </div>
    `;
    container.appendChild(card);
  });
}

function openMemoryUploadModal() {
  const modal = document.getElementById('memory-upload-modal');
  if (!modal) return;
  modal.classList.remove('pointer-events-none');
  modal.classList.add('modal-active');
  modal.style.opacity = '1';
  
  // Reset form
  document.getElementById('memory-upload-form').reset();
  selectMemoryType('image');
  document.getElementById('memory-preview-container').classList.add('hidden');
  uploadedMemoryBase64 = '';
}

function closeMemoryUploadModal() {
  const modal = document.getElementById('memory-upload-modal');
  if (!modal) return;
  modal.classList.remove('modal-active');
  modal.style.opacity = '0';
  setTimeout(() => {
    modal.classList.add('pointer-events-none');
  }, 200);
}

let selectedMemoryType = 'image';
let uploadedMemoryBase64 = '';

function selectMemoryType(type) {
  selectedMemoryType = type;
  const imageBtn = document.getElementById('memory-type-image-btn');
  const videoBtn = document.getElementById('memory-type-video-btn');
  const fileInput = document.getElementById('memory-file-input');
  const uploadText = document.getElementById('memory-upload-text');
  
  if (type === 'image') {
    imageBtn.className = 'flex-grow py-2 text-xs font-bold rounded-lg bg-luxury-gold text-white transition-all shadow-sm flex items-center justify-center gap-1';
    videoBtn.className = 'flex-grow py-2 text-xs font-bold rounded-lg text-secondary transition-all flex items-center justify-center gap-1';
    fileInput.accept = 'image/*';
    uploadText.textContent = 'اضغط هنا أو قم بسحب وإفلات صورة لرفعها';
  } else {
    imageBtn.className = 'flex-grow py-2 text-xs font-bold rounded-lg text-secondary transition-all flex items-center justify-center gap-1';
    videoBtn.className = 'flex-grow py-2 text-xs font-bold rounded-lg bg-luxury-gold text-white transition-all shadow-sm flex items-center justify-center gap-1';
    fileInput.accept = 'video/*';
    uploadText.textContent = 'اضغط هنا أو قم بسحب وإفلات فيديو لرفعه';
  }
  
  // Clear preview
  document.getElementById('memory-preview-container').classList.add('hidden');
  uploadedMemoryBase64 = '';
}

function previewMemoryFile(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = function(e) {
    uploadedMemoryBase64 = e.target.result;
    
    const previewContainer = document.getElementById('memory-preview-container');
    const previewImg = document.getElementById('memory-preview-img');
    const previewVid = document.getElementById('memory-preview-video');
    
    previewContainer.classList.remove('hidden');
    
    if (selectedMemoryType === 'image') {
      previewImg.src = uploadedMemoryBase64;
      previewImg.classList.remove('hidden');
      previewVid.classList.add('hidden');
      previewVid.src = '';
    } else {
      previewVid.src = uploadedMemoryBase64;
      previewVid.classList.remove('hidden');
      previewImg.classList.add('hidden');
      previewImg.src = '';
    }
  };
  reader.readAsDataURL(file);
}

// دالة المحاكاة المجهزة للربط بالسيرفر مباشرة
async function saveMemoryToDatabase(memoryData) {
  // --- هيكل الربط بالباك-اند والـ API المطور في المستقبل ---
  /*
  try {
    const response = await fetch('/api/memories/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(memoryData)
    });
    return await response.json();
  } catch (error) {
    console.error('Error saving memory to database:', error);
  }
  */
  
  // الحفظ المحلي حالياً لضمان الفخامة والجاهزية الفورية
  const memories = JSON.parse(localStorage.getItem('sharbas_memories')) || [];
  memories.unshift(memoryData);
  localStorage.setItem('sharbas_memories', JSON.stringify(memories));
  return { status: 'success', data: memoryData };
}

async function handleMemoryUpload(event) {
  event.preventDefault();
  
  const caption = document.getElementById('memory-caption-input').value.trim();
  const uploader = document.getElementById('memory-uploader-input').value.trim();
  
  if (!uploadedMemoryBase64) {
    alert('⚠️ الرجاء اختيار ملف الميديا أولاً.');
    return;
  }
  
  const today = new Date().toISOString().split('T')[0];
  
  const newMemory = {
    id: Date.now(),
    type: selectedMemoryType,
    src: uploadedMemoryBase64,
    caption: caption,
    uploader: uploader,
    timestamp: today
  };
  
  await saveMemoryToDatabase(newMemory);
  
  renderHomepageMemories();
  closeMemoryUploadModal();
}

// ---------------------
// الأتمتة والدوران التلقائي بالرئيسية
// ---------------------

function startHomepageAutomation() {
  // دوران الدعاء التلقائي للمتوفين كل 8 ثوانٍ
  setInterval(cycleDeceasedDua, 8000);
  
  // دوران الأذكار الصباحية والمسائية تلقائياً كل 6 ثوانٍ بالرئيسية
  setInterval(() => {
    const list = ADHKAR_DATA[currentAdhkarType] || [];
    if (list.length === 0) return;
    currentAdhkarIndex = (currentAdhkarIndex + 1) % list.length;
    transitionTextContent('adhkar-content-text', list[currentAdhkarIndex] || '', 1000);
  }, 6000);
}

// تطبيق بيانات التعديلات المحفوظة في LocalStorage
function applyLocalEdits() {
  FAMILY_DATA.forEach(member => {
    const key = `sharbas_member_edits_${member.id}`;
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        const edits = JSON.parse(saved);
        if (edits.name) member.name = edits.name;
        if (edits.surname) member.surname = edits.surname;
        if (edits.birthDate) member.birthDate = edits.birthDate;
        if (edits.age) member.age = edits.age;
        if (edits.phone) member.phone = edits.phone;
        if (edits.socials) member.socials = Object.assign(member.socials || {}, edits.socials);
        if (edits.avatar) member.avatar = edits.avatar;
      } catch(e) {}
    }
  });
}

// دالة أنيميشن إعداد المطور في الهيدر كلمة بكلمة
function initHeaderRevealAnimation() {
  const container = document.getElementById('header-credit-bubble');
  if (!container) return;

  // الاسم ظاهر دائماً في HTML - نضيف فقط تأثير النبضة على الاسم المميز
  const highlightSpan = container.querySelector('.highlight-name');
  if (highlightSpan) {
    // إضافة تأثير shimmer على اسم المهندس فقط
    highlightSpan.style.animation = 'shimmer 4s linear infinite';
    highlightSpan.style.background = 'linear-gradient(90deg, var(--gold), var(--gold-light), var(--gold))';
    highlightSpan.style.backgroundSize = '200% auto';
    highlightSpan.style.webkitBackgroundClip = 'text';
    highlightSpan.style.webkitTextFillColor = 'transparent';
    highlightSpan.style.backgroundClip = 'text';
  }
}

// التهيئة العامة للتطبيقات عند بدء التشغيل
document.addEventListener('DOMContentLoaded', () => {
  applyLocalEdits();
  initQuranModule();
  updateAdhkarDisplay();
  
  // تشغيل الأتمتة المزدوجة بالرئيسية
  startHomepageAutomation();
  initHeaderRevealAnimation();
  
  const phraseEl = document.getElementById('tasbeeh-phrase');
  if (phraseEl) phraseEl.textContent = TASBEEH_PHRASES[0];
});
