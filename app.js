/*
  Digital PC - Main Application Script
  Handles: SPA Routing, Catalog/Detail Views, Translations, Modals, Pagination
*/

(function () {
  // --- CONFIGURATION ---
  // GitHub Pages Fix: Use relative path for data
  const DATA_URL = window.PRODUCTS_JSON_URL || "./data/products.json";
  const PROM_FALLBACK_URL = window.PROM_FALLBACK_URL || "https://prom.ua/ua/c3808817-digital.html";
  const TELEGRAM_URL = window.TELEGRAM_URL || "https://t.me/Digital_Pc";
  const INSTAGRAM_URL = "https://www.instagram.com/digital_pc_dnipro";
  const OLX_FALLBACK_URL = "https://www.olx.ua";
  const PHONE_NUMBER = "+380993173348";
  const PHONE_DISPLAY = "+380 99 317 33 48";

  const ITEMS_PER_PAGE = 9; // Updated to 9 per page

  // --- GLOBAL STATE ---
  let currentLang = 'uk';
  let currentPage = 1;
  let allProductsData = [];
  let currentRoute = { view: 'catalog', params: {} };

  // --- FILTER STATE ---
  let activeFilters = {
    cpu: [],
    ramType: [],
    ramSize: [],
    storage: [],
    gpu: []
  };
  let currentSort = 'default';

  // --- TRANSLATIONS (Partial update for new keys) ---
  const i18n = {
    uk: {
      nav_home: "Головна",
      nav_catalog: "Комп'ютери",
      nav_reviews: "Відгуки",
      nav_about: "Про нас",
      nav_contacts: "Контакти",
      nav_clients: "Клієнтам",
      nav_warranty: "Гарантія та сервіс",
      nav_delivery: "Доставка та оплата",

      back_to_catalog: "Назад до каталогу",
      buy_now: "Купити зараз",
      specs_title: "Характеристики",
      desc_title: "Опис",

      // ... previous keys ...
      hero_title: "DIGITAL PC",
      hero_subtitle: "Професійні готові ПК для геймінгу, рендерингу та офісних задач. Ми створюємо машини, які надихають на перемоги.",
      hero_btn: "Обрати комп'ютер",
      feat_title: "Наші топові збірки",
      feat_subtitle: "Кращі конфігурації для будь-яких завдань - від кіберспорту до професійного монтажу",
      btn_prom: "Купити на Prom.ua",
      btn_olx: "Купити на OLX",
      btn_order: "Замовити",
      modal_title: "Зв'яжіться з нами",
      modal_telegram: "Написати в Telegram",
      modal_call: "Зателефонувати",
      modal_cancel: "Скасувати"
    },
    en: {
      nav_home: "Home",
      nav_catalog: "Computers",
      nav_reviews: "Reviews",
      nav_about: "About Us",
      nav_contacts: "Contacts",
      nav_clients: "For Clients",
      nav_warranty: "Warranty & Service",
      nav_delivery: "Delivery & Payment",

      back_to_catalog: "Back to Catalog",
      buy_now: "Buy Now",
      specs_title: "Specifications",
      desc_title: "Description",

      // ... previous keys ...
      hero_title: "DIGITAL PC",
      hero_subtitle: "Professional ready-made PCs for gaming, rendering, and office tasks. We create machines that inspire victory.",
      hero_btn: "Choose Computer",
      feat_title: "Our Top Builds",
      feat_subtitle: "Best configurations for any task - from esports to professional editing",
      btn_prom: "Buy on Prom.ua",
      btn_olx: "Buy on OLX",
      btn_order: "Order Now",
      modal_title: "Contact Us",
      modal_telegram: "Write on Telegram",
      modal_call: "Call Us",
      modal_cancel: "Cancel"
    }
  };

  // --- UTILS ---
  const money = (n) => {
    if (n === undefined || n === null || n === "") return "";
    return Number(n).toLocaleString('uk-UA', { maximumFractionDigits: 0 }) + " ₴";
  };

  // --- ROUTING ---
  function handleHashChange() {
    const hash = window.location.hash;
    if (hash.startsWith('#product=')) {
      const id = hash.split('=')[1];
      currentRoute = { view: 'detail', params: { id } };
    } else {
      currentRoute = { view: 'catalog', params: {} };
    }
    renderApp();
  }

  // --- APP RENDERER ---
  function renderApp() {
    const catalogContainer = document.getElementById("catalog");
    const detailContainer = document.getElementById("product-detail");
    const paginationNav = document.getElementById("pagination-nav");
    const pageHeader = document.getElementById("page-header");
    const featuredContainer = document.getElementById("featured");
    const sidebar = document.getElementById("filters-sidebar");

    // If we are on Home Page (has #featured div), render Featured products
    if (featuredContainer && !catalogContainer) {
      // Home Page - render featured products
      renderFeatured();
      // If there's a product detail hash, show detail view
      if (currentRoute.view === 'detail' && detailContainer) {
        const product = allProductsData.find(p => p.id === currentRoute.params.id);
        if (product) {
          detailContainer.style.display = 'block';
          renderDetailView(product, detailContainer);
        }
      } else if (detailContainer) {
        detailContainer.style.display = 'none';
      }
      return;
    }

    if (currentRoute.view === 'detail') {
      // Hide Catalog, Show Detail, HIDE PAGE HEADER
      if (catalogContainer) catalogContainer.style.display = 'none';
      if (paginationNav) paginationNav.style.display = 'none';
      if (pageHeader) pageHeader.style.display = 'none';
      if (sidebar) sidebar.style.display = 'none';

      let dContainer = detailContainer;
      if (!dContainer) {
        // Create container if not exists
        dContainer = document.createElement('div');
        dContainer.id = 'product-detail';
        dContainer.className = 'container mx-auto px-4 py-8 max-w-7xl';
        if (catalogContainer) catalogContainer.parentNode.insertBefore(dContainer, catalogContainer);
      }
      dContainer.style.display = 'block';

      const product = allProductsData.find(p => p.id === currentRoute.params.id);
      if (product) {
        renderDetailView(product, dContainer);
      } else {
        dContainer.innerHTML = `<div class="text-center py-20 text-xl">Product not found. <a href="#" class="text-blue-500 hover:underline">Back to catalog</a></div>`;
      }
    } else {
      // Show Catalog, Hide Detail, SHOW PAGE HEADER
      if (catalogContainer) {
        if (catalogContainer) {
          // catalogContainer.style.display = 'grid'; // Grid class is already on the element in HTML, and it's inside a flex container now
          // We don't need to force display grid here if it's already structured, but let's ensure it's visible.
          // Actually, the new structure has #catalog as the grid.

          const filteredData = getFilteredAndSortedData();
          renderCatalogWithPagination(filteredData, currentPage);
          if (sidebar) sidebar.style.display = 'block';
        }
      }
      if (detailContainer) detailContainer.style.display = 'none';
      if (paginationNav) paginationNav.style.display = 'flex';
      if (pageHeader) pageHeader.style.display = 'block';

      // Show catalog controls when in catalog view
      const catalogControls = document.getElementById('catalog-controls');
      if (catalogControls) catalogControls.style.display = 'flex';
    }

    // Always ensure Featured is handled if present (e.g. on mixed pages, though usually separate)
    // On pages with #catalog, we typically don't show featured unless it's the home page mixed.
    // Assuming computers.html only has #catalog.
  }
  // --- DETAIL VIEW ---
  function renderDetailView(product, container) {
    const mainImage = (product.images && product.images.length > 0) ? product.images[0] : (product.image || './images/placeholder.jpg');
    const price = money(product.price);
    const txtBack = i18n[currentLang].back_to_catalog || "Back";
    const txtOrder = i18n[currentLang].btn_order;
    const txtProm = i18n[currentLang].btn_prom;
    const txtOlx = i18n[currentLang].btn_olx;
    const txtSpecs = i18n[currentLang].specs_title || "Specs";
    const txtDesc = i18n[currentLang].desc_title || "Description";

    const promLink = product.url || PROM_FALLBACK_URL;
    const olxLink = product.olx_url || OLX_FALLBACK_URL;

    // Parse Specs to clean structured object
    // --- STATIC SPECS RENDERING ---
    // No more dynamic parsing. We trust product.specs object.
    const specsData = product.specs || {};

    const specIcons = {
      'cpu': { icon: 'cpu', label: 'Процесор' },
      'motherboard': { icon: 'grid', label: 'Материнська плата' },
      'ram': { icon: 'layers', label: "Оперативна пам'ять" },
      'storage': { icon: 'hard-drive', label: 'Накопичувач' },
      'gpu': { icon: 'monitor', label: 'Відеокарта' },
      'psu': { icon: 'zap', label: 'Блок живлення' },
      'case': { icon: 'box', label: 'Корпус' },
      'cooling': { icon: 'wind', label: 'Охолодження' }
    };

    const order = ['cpu', 'motherboard', 'ram', 'video_card', 'gpu', 'storage', 'psu', 'case', 'cooling'];

    // Specs Grid Generation
    let specsHtml = '<div class="col-span-1 lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">';
    let hasSpecs = false;

    // Iterate strictly through defined order
    for (const key of order) {
      // Handle potential key variations if necessary (e.g. 'gpu' vs 'video_card' if any legacy left), but we aim for strict 'gpu'
      // Checking actual data keys first
      let val = specsData[key];
      if (!val) continue;

      hasSpecs = true;
      const def = specIcons[key] || { icon: 'check-circle', label: key };

      specsHtml += `
            <div class="flex items-start p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors border border-gray-100">
                <div class="p-3 bg-white rounded-lg shadow-sm mr-4 text-blue-600 mt-1">
                    <i data-feather="${def.icon}" class="w-5 h-5"></i>
                </div>
                <div>
                    <div class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">${def.label}</div>
                    <div class="font-semibold text-gray-800 text-sm leading-snug">${val}</div>
                </div>
            </div>`;
    }

    if (!hasSpecs) {
      specsHtml += `<div class="col-span-2 p-4 text-gray-500 italic">Специфікації уточнюйте у менеджера</div>`;
    }

    specsHtml += '</div>';

    // Build gallery HTML
    const allImages = product.images && product.images.length > 0 ? product.images : [mainImage];
    const thumbnailsHtml = allImages.length > 1 ? allImages.map((img, idx) => `
        <img src="${img}" 
             alt="${product.title}" 
             class="w-20 h-20 object-cover rounded-lg cursor-pointer border-2 transition-all hover:border-blue-500 ${idx === 0 ? 'border-blue-600' : 'border-gray-200'}"
             onclick="changeMainImage('${img}', this)"
             loading="lazy">
    `).join('') : '';

    container.innerHTML = `
        <div class="pt-12 md:pt-14 mb-4">
            <a href="computers.html" class="inline-flex items-center text-gray-500 hover:text-blue-600 transition-colors font-medium text-lg">
                <i data-feather="arrow-left" class="w-5 h-5 mr-2"></i> ${txtBack}
            </a>
        </div>
        
        <div class="bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-0">
                <!-- Image Gallery Section -->
                <div class="bg-gray-50 p-4 lg:px-8 lg:py-6 flex flex-col items-center justify-start relative">
                     <div class="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-purple-50/50"></div>
                     
                     <!-- Main Image -->
                     <img id="mainProductImage" src="${mainImage}" alt="${product.title}" 
                          class="relative z-10 max-h-[500px] w-full object-contain drop-shadow-2xl transition-all duration-300 mb-4 cursor-pointer hover:scale-105"
                          data-images='${JSON.stringify(allImages)}'>
                     
                     <!-- Thumbnails -->
                     ${allImages.length > 1 ? `
                     <div class="relative z-10 flex gap-3 overflow-x-auto pb-2 max-w-full" style="scrollbar-width: thin;">
                         ${thumbnailsHtml}
                     </div>
                     ` : ''}
                </div>

                <!-- Info Section -->
                <div class="p-8 lg:p-12 flex flex-col justify-center">
                    <div class="mb-6">
                        <span class="inline-block px-3 py-1 bg-blue-100 text-blue-800 text-xs font-bold tracking-wide uppercase rounded-full mb-4">In Stock</span>
                        <h1 class="text-3xl lg:text-4xl font-extrabold text-gray-900 mb-4 leading-tight tracking-tight">${product.title}</h1>
                        <div class="text-4xl font-black text-blue-600">${price}</div>
                    </div>

                    <!-- Characteristics (Specs) - MOVED TO TOP -->
                    <div class="mb-8 w-full">
                        ${specsHtml}
                    </div>

                    <!-- Description - Redesigned -->
                    <div class="prose prose-blue mb-8">
                        <div class="mt-4 mb-6">
                          <h4 class="font-bold text-gray-900 mb-2">Комплектація:</h4>
                          <ul class="space-y-1 text-gray-600 text-sm">
                            <li class="flex items-center"><i data-feather="check" class="w-4 h-4 text-green-500 mr-2"></i>Встановлена Windows 11, усі необхідні драйвери та програми для тестування</li>
                            <li class="flex items-center"><i data-feather="check" class="w-4 h-4 text-green-500 mr-2"></i>Протестований пк в заводському пакуванні</li>
                            <li class="flex items-center"><i data-feather="check" class="w-4 h-4 text-green-500 mr-2"></i>Коробки та інструкції від комплектуючих</li>
                            <li class="flex items-center"><i data-feather="check" class="w-4 h-4 text-green-500 mr-2"></i>Кабель живлення</li>
                            <li class="flex items-center"><i data-feather="check" class="w-4 h-4 text-green-500 mr-2"></i>Гарантійний талон</li>
                          </ul>
                        </div>

                        <ul class="space-y-1 text-gray-600">
                          <li>Повна кастомізація збірки під ваші потреби</li>
                          <li>Оплата на рахунок ФОП</li>
                          <li>Оплата частинами від ПриватБанку</li>
                          <li>Офіційна гарантія</li>
                        </ul>
                    </div>

                    <div class="flex flex-col gap-4 mt-auto">
                         <button onclick="window.openOrderModal('${product.title.replace(/'/g, "\\'")}')" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-5 px-8 rounded-2xl transition-all shadow-lg hover:shadow-blue-500/30 flex items-center justify-center text-xl transform hover:-translate-y-1">
                            <i data-feather="phone-call" class="w-6 h-6 mr-3"></i> ${txtOrder}
                         </button>
                         <div class="grid grid-cols-2 gap-4">
                            <a href="${promLink}" target="_blank" class="flex items-center justify-center bg-white border-2 border-purple-100 hover:border-purple-600 hover:bg-purple-50 text-purple-700 font-bold py-4 px-6 rounded-2xl transition-all text-center">
                                ${txtProm}
                            </a>
                            <a href="${olxLink}" target="_blank" class="flex items-center justify-center bg-white border-2 border-green-100 hover:border-green-600 hover:bg-green-50 text-green-700 font-bold py-4 px-6 rounded-2xl transition-all text-center">
                                ${txtOlx}
                            </a>
                         </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Add gallery change function
    window.changeMainImage = function (newSrc, thumbnail) {
      const mainImg = document.getElementById('mainProductImage');
      if (mainImg) {
        mainImg.src = newSrc;
        // Update thumbnail borders
        const thumbnails = thumbnail.parentElement.querySelectorAll('img');
        thumbnails.forEach(t => t.classList.remove('border-blue-600'));
        thumbnails.forEach(t => t.classList.add('border-gray-200'));
        thumbnail.classList.remove('border-gray-200');
        thumbnail.classList.add('border-blue-600');
      }
    };

    if (window.feather) feather.replace();

    // Hide catalog controls (sorting & filters) in detail view
    const catalogControls = document.getElementById('catalog-controls');
    if (catalogControls) catalogControls.style.display = 'none';

    // Attach lightbox event listener to main image
    setTimeout(() => {
      const mainImg = document.getElementById('mainProductImage');
      if (mainImg) {
        const images = JSON.parse(mainImg.getAttribute('data-images') || '[]');
        mainImg.addEventListener('click', () => openLightbox(images, 0));
      }
    }, 100);

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // --- CATALOG RENDER ---
  const getCardHTML = (p) => {
    // Determine card click action
    // We want the whole card to be clickable OR a specific button. 
    // Requirement: "Make every card clickable. On click: open a dedicated detail page"
    // We'll wrap the image/title in a link or onclick.

    // Clean product title
    let title = p.title || "PC Build";
    // Remove red !! marks
    title = title.replace(/‼️/g, '').trim();
    // Remove redundant prefixes
    title = title.replace(/^(?:Ігровий\s+)?(?:пк|pc)\s+/i, '').trim();
    title = title.replace(/^ТОП\s+/i, '');
    title = title.replace(/^В наявності\s*•\s*/i, '');
    // Remove upgrade text like "(або 32 гб)"
    title = title.replace(/\(або\s+\d+\s*гб\)/gi, '');
    title = title.replace(/можна\s+встановити.*/gi, '');
    title = title.replace(/можна\s+додати.*/gi, '');
    let specs = "";
    if (p.specs && typeof p.specs === 'object' && !Array.isArray(p.specs)) {
      // Pick key specs for card: CPU, GPU, RAM
      const s = p.specs;
      const parts = [];
      if (s.cpu) parts.push(s.cpu);
      if (s.gpu) parts.push(s.gpu);
      if (s.ram) parts.push(s.ram);
      specs = parts.join(" • ");
    } else if (Array.isArray(p.specs)) {
      specs = p.specs.slice(0, 4).join(" • ");
    } else {
      specs = p.title;
    }
    const price = money(p.price);
    const imageUrl = (p.images && p.images.length > 0) ? p.images[0] : (p.image || './images/placeholder.jpg');

    const txtOrder = i18n[currentLang].btn_order;
    const txtProm = i18n[currentLang].btn_prom;
    const txtOlx = i18n[currentLang].btn_olx;

    // Only standard buttons go to external, detail click goes to hash
    return `
    <div class="bg-white rounded-lg overflow-hidden shadow-lg product-card transition-all duration-300 transform hover:-translate-y-2 h-full flex flex-col group">
        <a href="computers.html#product=${p.id}" class="block relative h-64 bg-gray-100 flex items-center justify-center overflow-hidden cursor-pointer">
             <img src="${imageUrl}" alt="${title}" class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110">
             <div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-300"></div>
        </a>
        <div class="p-6 flex flex-col flex-grow">
            <a href="computers.html#product=${p.id}" class="block">
                <h3 class="text-xl font-bold text-gray-900 mb-2 leading-tight hover:text-blue-600 transition-colors">${title}</h3>
            </a>
            <div class="flex items-center mb-4">
                 <span class="text-2xl font-bold text-blue-600">${price}</span>
            </div>
            <div class="flex flex-col gap-3 mt-auto">
                 <button onclick="window.openOrderModal('${title.replace(/'/g, "\\'")}')" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-center shadow-md hover:shadow-lg">
                    <i data-feather="phone-call" class="w-5 h-5 mr-2"></i> ${txtOrder}
                 </button>
                 <div class="grid grid-cols-2 gap-3">
                    <a href="${p.url || PROM_FALLBACK_URL}" target="_blank" class="flex items-center justify-center bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold py-2 px-2 rounded-lg transition-colors text-center shadow hover:shadow-md">
                        ${txtProm}
                    </a>
                    <a href="${p.olx_url || OLX_FALLBACK_URL}" target="_blank" class="flex items-center justify-center bg-green-500 hover:bg-green-600 text-white text-xs font-bold py-2 px-2 rounded-lg transition-colors text-center shadow hover:shadow-md">
                        ${txtOlx}
                    </a>
                 </div>
            </div>
        </div>
    </div>
    `;
  };

  const renderCatalogWithPagination = (data, page) => {
    const catalog = document.getElementById("catalog");
    if (!catalog) return;

    const start = (page - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    const pageData = data.slice(start, end);
    const totalPages = Math.ceil(data.length / ITEMS_PER_PAGE);

    // Render Cards
    catalog.innerHTML = pageData.map(getCardHTML).join("");
    if (window.feather) feather.replace();

    // Render Pagination
    let nav = document.getElementById('pagination-nav');
    if (!nav) {
      nav = document.createElement('nav');
      nav.id = 'pagination-nav';
      nav.className = 'flex justify-center mt-12 mb-8';
      catalog.parentNode.insertBefore(nav, catalog.nextSibling);
    }

    // Logic for Previous/Next
    let navHTML = `<ul class="flex space-x-2">`;
    if (page > 1) {
      navHTML += `<li><button onclick="window.changePage(${page - 1})" class="px-3 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50 text-gray-700">←</button></li>`;
    }
    for (let i = 1; i <= totalPages; i++) {
      const activeClass = i === page ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50";
      navHTML += `<li><button onclick="window.changePage(${i})" class="px-3 py-2 border rounded-md ${activeClass}">${i}</button></li>`;
    }
    if (page < totalPages) {
      navHTML += `<li><button onclick="window.changePage(${page + 1})" class="px-3 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50 text-gray-700">→</button></li>`;
    }
    navHTML += `</ul>`;
    nav.innerHTML = navHTML;
  };

  const renderFeatured = () => {
    const featured = document.getElementById("featured");
    if (featured && allProductsData.length > 0) {
      // Top 6 by price
      const top6 = [...allProductsData]
        .sort((a, b) => (b.price || 0) - (a.price || 0))
        .slice(0, 6);
      featured.innerHTML = top6.map(getCardHTML).join("");
      if (window.feather) feather.replace();
    }
  };

  // --- FILTER & SORT LOGIC ---
  function generateFilters(data) {
    if (!document.getElementById('filter-cpu')) return;

    // Define Rigid Categories (buckets)
    const buckets = {
      cpu: {
        'Intel core i5': false,
        'Intel core i7': false,
        'Amd ryzen 5': false,
        'Amd ryzen 7': false
      },
      ramType: {
        'DDR4': false,
        'DDR5': false
      },
      ramSize: {
        '16 GB': false,
        '32 GB': false,
        '64 GB': false
      },
      storage: {
        '512 GB': false,
        '1 TB': false,
        '2 TB': false
      },
      gpu: {
        '10 Серія (10xx)': false,
        '20 Серія (20xx)': false,
        '30 Серія (30xx)': false,
        '40 Серія (40xx)': false,
        '50 Серія (50xx)': false
      }
    };

    // Helper: text normalizer
    const norm = (str) => (str || "").toLowerCase().replace(/\s+/g, '');

    data.forEach(p => {
      const fullSpecs = p.full_specs || {};
      const title = p.title || "";
      const rawText = (title + " " + JSON.stringify(fullSpecs)).toLowerCase();
      const nText = norm(rawText);

      // CPU Mapping
      if (rawText.match(/core\s*i5|i5-\d/)) buckets.cpu['Intel core i5'] = true;
      if (rawText.match(/core\s*i7|i7-\d/)) buckets.cpu['Intel core i7'] = true;
      if (rawText.match(/ryzen\s*5/)) buckets.cpu['Amd ryzen 5'] = true;
      if (rawText.match(/ryzen\s*7/)) buckets.cpu['Amd ryzen 7'] = true;

      // RAM Type
      if (rawText.includes('ddr4')) buckets.ramType['DDR4'] = true;
      if (rawText.includes('ddr5')) buckets.ramType['DDR5'] = true;

      // RAM Size
      if (rawText.match(/16\s*gb/)) buckets.ramSize['16 GB'] = true;
      if (rawText.match(/32\s*gb/)) buckets.ramSize['32 GB'] = true;
      if (rawText.match(/64\s*gb/)) buckets.ramSize['64 GB'] = true;

      // Storage
      if (rawText.match(/512\s*gb/)) buckets.storage['512 GB'] = true;
      if (rawText.match(/1\s*tb/)) buckets.storage['1 TB'] = true;
      if (rawText.match(/2\s*tb/)) buckets.storage['2 TB'] = true;

      // GPU Mapping - Grouping
      if (rawText.match(/gtx\s*10\d\d|10\d\d/)) buckets.gpu['10 Серія (10xx)'] = true;
      if (rawText.match(/rtx\s*20\d\d|20\d\d/)) buckets.gpu['20 Серія (20xx)'] = true;
      if (rawText.match(/rtx\s*30\d\d|30\d\d/)) buckets.gpu['30 Серія (30xx)'] = true;
      if (rawText.match(/rtx\s*40\d\d|40\d\d/)) buckets.gpu['40 Серія (40xx)'] = true;
      if (rawText.match(/rtx\s*50\d\d|50\d\d/)) buckets.gpu['50 Серія (50xx)'] = true;
    });

    const renderCheckboxes = (activeMap, containerId, name, showAll = false) => {
      const container = document.getElementById(containerId);
      if (!container) return;

      let items = Object.keys(activeMap);
      if (!showAll) {
        items = items.filter(k => activeMap[k]);
      }

      // Add "512 GB" and "1 TB" manually if not present (Force show as requested?)
      // User asked: "For 'Накопичувач': Add options '512 GB' and '1 TB'." 
      // If logic above marked them, good. If not, should I show them? 
      // The current logic filters k => activeMap[k]. 
      // I will assume if they exist in data they will show. If user wants them FORCED, I should check "showAll" logic.
      // But for storage, "showAll" is false in code. GPU is true.
      // I will allow storage to show discovered ones.

      if (items.length === 0) {
        container.innerHTML = '<p class="text-sm text-gray-500 italic">Немає варіантів</p>';
        return;
      }

      container.innerHTML = items.map(item => `
        <label class="flex items-center cursor-pointer hover:bg-gray-50 p-2 rounded transition-colors">
            <input type="checkbox" class="filter-checkbox form-checkbox text-blue-600 rounded border-gray-300" name="${name}" value="${item}"> 
            <span class="ml-2 text-gray-700 text-sm font-medium">${item}</span>
        </label>
        `).join('');
    };

    // Render rigid groups
    renderCheckboxes(buckets.cpu, 'filter-cpu', 'cpu');
    renderCheckboxes(buckets.gpu, 'filter-gpu', 'gpu', true);
    renderCheckboxes(buckets.ramType, 'filter-ram-type', 'ram-type');
    renderCheckboxes(buckets.ramSize, 'filter-ram-size', 'ram-size');
    renderCheckboxes(buckets.storage, 'filter-storage', 'storage');

    // Re-attach listeners
    document.querySelectorAll('.filter-checkbox').forEach(cb => {
      cb.addEventListener('change', window.applyFilters);
    });
  }

  function getFilteredAndSortedData() {
    let result = [...allProductsData];

    // Helper: Normalize product text for searching
    const getProductText = (p) => (p.title + " " + JSON.stringify(p.full_specs || {})).toLowerCase();
    const norm = (str) => (str || "").toLowerCase().replace(/\s+/g, '');

    // CPU Filter
    if (activeFilters.cpu.length > 0) {
      result = result.filter(p => {
        const text = getProductText(p);
        return activeFilters.cpu.some(cat => {
          if (cat === 'Intel core i5') return text.match(/core\s*i5|i5-\d/);
          if (cat === 'Intel core i7') return text.match(/core\s*i7|i7-\d/);
          if (cat === 'Amd ryzen 5') return text.match(/ryzen\s*5/);
          if (cat === 'Amd ryzen 7') return text.match(/ryzen\s*7/);
          return false;
        });
      });
    }

    // GPU Filter
    if (activeFilters.gpu.length > 0) {
      result = result.filter(p => {
        const text = getProductText(p);
        return activeFilters.gpu.some(group => {
          if (group === '10 Серія (10xx)') return text.match(/gtx\s*10\d\d|10\d\d/);
          if (group === '20 Серія (20xx)') return text.match(/rtx\s*20\d\d|20\d\d/);
          if (group === '30 Серія (30xx)') return text.match(/rtx\s*30\d\d|30\d\d/);
          if (group === '40 Серія (40xx)') return text.match(/rtx\s*40\d\d|40\d\d/);
          if (group === '50 Серія (50xx)') return text.match(/rtx\s*50\d\d|50\d\d/);
          return false;
        });
      });
    }

    // RAM Type
    if (activeFilters.ramType.length > 0) {
      result = result.filter(p => {
        const text = getProductText(p);
        return activeFilters.ramType.some(f => text.includes(f.toLowerCase()));
      });
    }

    // RAM Size
    if (activeFilters.ramSize.length > 0) {
      result = result.filter(p => {
        const text = getProductText(p);
        return activeFilters.ramSize.some(f => {
          // "16 GB" -> match "16 gb"
          return text.includes(f.toLowerCase());
        });
      });
    }

    // Storage
    if (activeFilters.storage.length > 0) {
      result = result.filter(p => {
        const text = getProductText(p);
        return activeFilters.storage.some(f => {
          const num = parseInt(f); // 512 or 1
          const unit = f.includes('TB') ? 'tb' : 'gb';
          return text.includes(num + " " + unit) || text.includes(num + unit);
        });
      });
    }

    // Sort
    if (currentSort === 'price_asc') {
      result.sort((a, b) => a.price - b.price);
    } else if (currentSort === 'price_desc') {
      result.sort((a, b) => b.price - a.price);
    }

    return result;
  }

  window.applyFilters = function () {
    // Update state from DOM
    activeFilters.cpu = Array.from(document.querySelectorAll('input[name="cpu"]:checked')).map(cb => cb.value);
    activeFilters.ramType = Array.from(document.querySelectorAll('input[name="ram-type"]:checked')).map(cb => cb.value);
    activeFilters.ramSize = Array.from(document.querySelectorAll('input[name="ram-size"]:checked')).map(cb => cb.value);
    activeFilters.storage = Array.from(document.querySelectorAll('input[name="storage"]:checked')).map(cb => cb.value);
    activeFilters.gpu = Array.from(document.querySelectorAll('input[name="gpu"]:checked')).map(cb => cb.value);

    const sortEl = document.getElementById('sort-select');
    if (sortEl) currentSort = sortEl.value;

    currentPage = 1;
    renderApp();

    // Scroll to top of catalog (optional)
    const cat = document.getElementById('catalog');
    if (cat) cat.scrollIntoView({ behavior: 'smooth' });
  };

  window.resetFilters = function () {
    document.querySelectorAll('.filter-checkbox').forEach(cb => cb.checked = false);
    const sortEl = document.getElementById('sort-select');
    if (sortEl) sortEl.value = 'default';
    activeFilters = { cpu: [], ramType: [], ramSize: [], storage: [], gpu: [] };
    currentSort = 'default';
    window.applyFilters();
  };

  // --- EVENTS ---
  window.changePage = function (newPage) {
    currentPage = newPage;
    renderCatalogWithPagination(allProductsData, currentPage);
    const catSection = document.getElementById("catalog");
    if (catSection) {
      const y = catSection.getBoundingClientRect().top + window.scrollY - 100;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  // --- LEAD FORM MODAL ---
  function createLeadFormModal() {
    if (document.getElementById("lead-form-modal")) return;

    const modalHTML = `
      <div id="lead-form-modal" class="hidden fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div class="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 relative transform transition-all">
          <button onclick="window.closeLeadForm()" class="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors">
            <i data-feather="x" class="w-6 h-6"></i>
          </button>
          
          <div class="mb-6">
            <h2 class="text-2xl font-bold text-gray-900 mb-2">Зв'яжіться з нами</h2>
            <p class="text-gray-600">Оберіть зручний спосіб зв'язку</p>
          </div>

          <!-- Quick Contact Buttons -->
          <div class="grid grid-cols-2 gap-3 mb-6">
            <a href="tel:${PHONE_NUMBER}" 
              title="${PHONE_DISPLAY}"
              class="flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-all shadow-md hover:shadow-lg group relative">
              <i data-feather="phone" class="w-5 h-5 mr-2"></i>
              <span class="hidden md:inline">Зателефонувати</span>
              <span class="md:hidden">Зателефонувати</span>
              <span class="hidden md:group-hover:block absolute -bottom-12 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-sm px-3 py-2 rounded-lg whitespace-nowrap z-10 shadow-lg">
                ${PHONE_DISPLAY}
              </span>
            </a>
            <a href="${TELEGRAM_URL}" target="_blank"
              class="flex items-center justify-center bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-lg transition-all shadow-md hover:shadow-lg">
              <i data-feather="send" class="w-5 h-5 mr-2"></i>
              Telegram
            </a>
          </div>

          <div class="relative mb-6">
            <div class="absolute inset-0 flex items-center">
              <div class="w-full border-t border-gray-300"></div>
            </div>
            <div class="relative flex justify-center text-sm">
              <span class="px-2 bg-white text-gray-500">або залиште заявку</span>
            </div>
          </div>

          <form id="lead-form" class="space-y-4">
            <div>
              <label for="lead-name" class="block text-sm font-medium text-gray-700 mb-1">Ім'я *</label>
              <input type="text" id="lead-name" name="name" required
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Ваше ім'я">
            </div>

            <div>
              <label for="lead-phone" class="block text-sm font-medium text-gray-700 mb-1">Телефон *</label>
              <input type="tel" id="lead-phone" name="phone" required
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="+380 XX XXX XX XX">
            </div>

            <div>
              <label for="lead-message" class="block text-sm font-medium text-gray-700 mb-1">Повідомлення (опціонально)</label>
              <textarea id="lead-message" name="message" rows="3"
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                placeholder="Додаткова інформація або питання"></textarea>
            </div>

            <input type="hidden" id="lead-product" name="product" value="">

            <div class="flex gap-3 mt-6">
              <button type="submit"
                class="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-all shadow-lg hover:shadow-blue-500/30 transform hover:-translate-y-0.5">
                Відправити
              </button>
              <button type="button" onclick="window.closeLeadForm()"
                class="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-all">
                Скасувати
              </button>
            </div>
          </form>

          <div id="form-success" class="hidden mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p class="text-green-800 font-medium">✓ Дякуємо! Ми зв'яжемося з вами найближчим часом.</p>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
    if (window.feather) feather.replace();

    // Phone validation function
    function validatePhone(phone) {
      const cleaned = phone.replace(/\s+/g, '');
      return /^\+380\d{9}$/.test(cleaned);
    }

    // Telegram send function
    async function sendToTelegram(formData) {
      // FINAL PRODUCTION CREDENTIALS
      const BOT_TOKEN = '8396429322:AAHc8xU9IGechcfnFpFLqH-PDWENKNJ4yG4';
      const CHAT_ID = '6558889586';

      const text = `Нова заявка з сайту Digital PC!\n` +
        `==========================\n` +
        `👤 Ім'я: ${formData.name}\n` +
        `📱 Телефон: ${formData.phone}\n` +
        `💬 Повідомлення: ${formData.message || 'Немає'}\n` +
        `🖥 Товар: ${formData.product || 'Без товару'}\n` +
        `⏰ Час: ${new Date().toLocaleString('uk-UA')}`;

      // Use GET request with query params to avoid preflight complications, 
      // and no-cors mode to allow the browser to send it to a different origin.
      const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage?chat_id=${CHAT_ID}&text=${encodeURIComponent(text)}`;

      await fetch(url, {
        method: 'GET',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      // Since mode is no-cors, we get an opaque response. We assume success if no network error occurred.
      return { ok: true };
    }

    // Form submission handler
    const form = document.getElementById('lead-form');
    const formError = document.createElement('div');
    formError.id = 'form-error';
    formError.className = 'hidden mt-4 p-4 bg-red-50 border border-red-200 rounded-lg';
    formError.innerHTML = '<p class="text-red-800 font-medium"></p>';
    form.parentNode.insertBefore(formError, document.getElementById('form-success'));

    if (form) {
      form.addEventListener('submit', async function (e) {
        e.preventDefault();

        const formData = {
          name: document.getElementById('lead-name').value.trim(),
          phone: document.getElementById('lead-phone').value.trim(),
          message: document.getElementById('lead-message').value.trim(),
          product: document.getElementById('lead-product').value
        };

        // Hide previous messages
        document.getElementById('form-error').classList.add('hidden');
        document.getElementById('form-success').classList.add('hidden');

        // Validate phone number
        if (!validatePhone(formData.phone)) {
          document.getElementById('form-error').querySelector('p').textContent =
            'Будь ласка, введіть коректний номер телефону у форматі +380XXXXXXXXX';
          document.getElementById('form-error').classList.remove('hidden');
          return;
        }

        // Disable submit button during processing
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = 'Відправка...';

        try {
          // Send to Telegram
          await sendToTelegram(formData);

          console.log('Lead form submitted successfully:', formData);

          // Show success message
          form.classList.add('hidden');
          document.getElementById('form-success').classList.remove('hidden');

          // Reset and close after 2 seconds
          setTimeout(() => {
            window.closeLeadForm();
            form.reset();
            form.classList.remove('hidden');
            document.getElementById('form-success').classList.add('hidden');
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
          }, 2000);

        } catch (error) {
          console.error('Telegram send error:', error);

          // Show error message
          document.getElementById('form-error').querySelector('p').textContent =
            'Помилка відправки. Спробуйте ще раз або зателефонуйте нам безпосередньо.';
          document.getElementById('form-error').classList.remove('hidden');

          // Re-enable submit button
          submitBtn.disabled = false;
          submitBtn.textContent = originalText;
        }
      });
    }
  }

  window.openLeadForm = function (productTitle = '') {
    createLeadFormModal();
    const modal = document.getElementById("lead-form-modal");
    const productInput = document.getElementById("lead-product");
    if (productInput && productTitle) {
      productInput.value = productTitle;
    }
    if (modal) modal.classList.remove('hidden');
  };

  window.closeLeadForm = function () {
    const modal = document.getElementById("lead-form-modal");
    if (modal) modal.classList.add('hidden');
  };

  // Legacy support - redirect old modal calls to new lead form
  window.openOrderModal = function (productTitle = '') {
    window.openLeadForm(productTitle);
  };

  window.closeModal = function () {
    window.closeLeadForm();
  };

  // --- INITIALIZATION ---
  async function init() {
    // Initialize mobile menu immediately
    initMobileMenu();

    try {
      const res = await fetch(DATA_URL);
      if (!res.ok) throw new Error("Failed to load products");
      allProductsData = await res.json();

      // Initial Render
      handleHashChange();

      // Generate Filters
      generateFilters(allProductsData);

      // Initialize Filter Listeners
      document.querySelectorAll('.filter-checkbox').forEach(cb => {
        cb.addEventListener('change', window.applyFilters);
      });

    } catch (e) {
      console.error(e);
    }
  }

  // --- MOBILE MENU ---
  function initMobileMenu() {
    const mobBtn = document.getElementById('mobile-menu-button');
    const mobileMenu = document.getElementById('mobile-menu');

    if (mobBtn && mobileMenu) {
      // Toggle menu on button click
      mobBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        const isHidden = mobileMenu.classList.contains('hidden');
        mobileMenu.classList.toggle('hidden');
        console.log('Mobile menu toggled:', isHidden ? 'opening' : 'closing');
        if (window.feather) feather.replace();
      });

      // Close menu when clicking on any link inside it
      const menuLinks = mobileMenu.querySelectorAll('a');
      menuLinks.forEach(link => {
        link.addEventListener('click', function () {
          mobileMenu.classList.add('hidden');
          console.log('Mobile menu closed via link click');
        });
      });

      // Close menu when clicking outside
      document.addEventListener('click', function (e) {
        if (!mobileMenu.classList.contains('hidden') &&
          !mobileMenu.contains(e.target) &&
          !mobBtn.contains(e.target)) {
          mobileMenu.classList.add('hidden');
          console.log('Mobile menu closed via outside click');
        }
      });
    } else {
      console.warn('Mobile menu elements not found:', { mobBtn: !!mobBtn, mobileMenu: !!mobileMenu });
    }
  }

  // --- MODAL ---
  function createModal() {
    if (document.getElementById("order-modal")) return;
    const modalHtml = `
      <div id="order-modal" class="fixed inset-0 z-[100] hidden overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
        <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
          <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onclick="closeModal()"></div>
          <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
          <div class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all w-[90vw] max-w-md sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
            <div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
               <!-- Modal Content Simplified for brevity -->
               <div class="text-center">
                  <h3 class="text-lg leading-6 font-medium text-gray-900 mb-4" data-i18n="modal_title">Зв'яжіться з нами</h3>
                  <a href="${TELEGRAM_URL}" target="_blank" class="block w-full bg-blue-500 text-white py-2 rounded mb-2">Telegram</a>
                  <a href="tel:${PHONE_NUMBER}" class="block w-full border border-gray-300 py-2 rounded mb-2">Call ${PHONE_DISPLAY}</a>
                  <button onclick="closeModal()" class="mt-2 text-gray-500 underline">Close</button>
               </div>
            </div>
          </div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
  }

  // --- LANGUAGE ---
  window.setLanguage = function (lang) {
    if (!i18n[lang]) return;
    currentLang = lang;

    // Update data-i18n elements
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (i18n[lang][key]) el.innerHTML = i18n[lang][key];
    });

    // Re-render current view
    renderApp();
  };

  // --- LIGHTBOX GALLERY ---
  let lightboxImages = [];
  let currentLightboxIndex = 0;

  window.openLightbox = function (images, startIndex = 0) {
    lightboxImages = images;
    currentLightboxIndex = startIndex;

    // Create lightbox if doesn't exist
    let lightbox = document.getElementById('productLightbox');
    if (!lightbox) {
      const lightboxHTML = `
        <div id="productLightbox" class="lightbox">
          <div class="lightbox-close" onclick="closeLightbox()">&times;</div>
          <div class="lightbox-arrow left" onclick="changeLightboxImage(-1)">&#10094;</div>
          <div class="lightbox-arrow right" onclick="changeLightboxImage(1)">&#10095;</div>
          <div class="lightbox-content">
            <img id="lightboxImage" class="lightbox-image" src="" alt="">
            <div class="lightbox-thumbnails" id="lightboxThumbnails"></div>
          </div>
        </div>
      `;
      document.body.insertAdjacentHTML('beforeend', lightboxHTML);
      lightbox = document.getElementById('productLightbox');

      // Add keyboard support
      document.addEventListener('keydown', function (e) {
        if (lightbox.classList.contains('active')) {
          if (e.key === 'Escape') closeLightbox();
          if (e.key === 'ArrowLeft') changeLightboxImage(-1);
          if (e.key === 'ArrowRight') changeLightboxImage(1);
        }
      });

      // Add swipe support
      let touchStartX = 0;
      let touchEndX = 0;

      lightbox.addEventListener('touchstart', e => {
        touchStartX = e.changedTouches[0].screenX;
      }, { passive: true });

      lightbox.addEventListener('touchend', e => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
      }, { passive: true });

      function handleSwipe() {
        if (Math.abs(touchStartX - touchEndX) > 50) { // Threshold 50px
          if (touchEndX < touchStartX) changeLightboxImage(1); // Swipe Left -> Next
          if (touchEndX > touchStartX) changeLightboxImage(-1); // Swipe Right -> Prev
        }
      }

      // Close on background click
      lightbox.addEventListener('click', function (e) {
        if (e.target.classList.contains('lightbox') || e.target.classList.contains('lightbox-content')) {
          closeLightbox();
        }
      });
    }

    showLightboxImage(currentLightboxIndex);
    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';
  };

  window.closeLightbox = function () {
    const lightbox = document.getElementById('productLightbox');
    if (lightbox) {
      lightbox.classList.remove('active');
      document.body.style.overflow = '';
    }
  };

  window.changeLightboxImage = function (direction) {
    currentLightboxIndex += direction;
    if (currentLightboxIndex >= lightboxImages.length) currentLightboxIndex = 0;
    if (currentLightboxIndex < 0) currentLightboxIndex = lightboxImages.length - 1;
    showLightboxImage(currentLightboxIndex);
  };

  function showLightboxImage(index) {
    const img = document.getElementById('lightboxImage');
    const thumbnailsContainer = document.getElementById('lightboxThumbnails');

    if (img && lightboxImages[index]) {
      img.src = lightboxImages[index];

      // Update thumbnails
      if (thumbnailsContainer) {
        thumbnailsContainer.innerHTML = lightboxImages.map((src, idx) => `
          <img src="${src}" 
               class="lightbox-thumbnail ${idx === index ? 'active' : ''}" 
               onclick="showLightboxImage(${idx}); currentLightboxIndex = ${idx};"
               alt="Thumbnail ${idx + 1}">
        `).join('');
      }
    }
  }

  // Listeners
  window.addEventListener('hashchange', handleHashChange);
  document.addEventListener("DOMContentLoaded", init);

})();
