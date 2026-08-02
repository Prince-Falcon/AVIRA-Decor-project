// ==========================================
// ۱. تنظیمات و اتصال به Supabase
// ==========================================
const SUPABASE_URL = "https://zlajslqgoqtyvfgazrkg.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_9kA33UJxntsCvvrs93dBfQ_NCvLyXFk";

let supabaseClient = null;
if (typeof window.supabase !== 'undefined' && window.supabase.createClient) {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

// ==========================================
// ۲. ضرایب قیمتی و توابع کمکی محاسبات
// ==========================================
const sizeMultipliers = {
    '۲۰×۲۰ سانتی‌متر': 1.0,
    '۲۰×۳۰ سانتی‌متر': 1.25,
    '۳۰×۳۰ سانتی‌متر': 1.45,
    '۳۰×۴۰ سانتی‌متر': 1.7,
    '۴۰×۴۰ سانتی‌متر': 2.0
};

const materialMultipliers = {
    'economy': 0.85, // اقتصادی (-۱۵٪)
    'normal': 1.0,   // استاندارد
    'luxury': 1.35,  // لوکس (+۳۵٪)
    'metal': 1.70    // فلزی (+۷۰٪)
};

function parsePriceToNumber(priceStr) {
    if (!priceStr) return 0;
    const faToEnDigits = priceStr.replace(/[۰-۹]/g, d => "۰۱۲۳۴۵۶۷۸۹".indexOf(d));
    const cleanNum = faToEnDigits.replace(/[^0-9]/g, '');
    return parseInt(cleanNum, 10) || 0;
}

function formatToPersianPrice(num) {
    return Math.round(num).toLocaleString('fa-IR') + " تومان";
}

function getSelectedMaterial() {
    const selected = document.querySelector('input[name="material"]:checked');
    return selected ? selected.value : 'normal';
}

// ==========================================
// ۳. راه‌اندازی و رویدادهای عمومی DOM
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    // بارگذاری داده‌های کاربر در صورت وجود عناصر مرتبط
    if (document.getElementById("user-orders-list")) loadUserOrders();
    if (document.getElementById("user-support-list")) loadUserSupportTickets();

    // انیمیشن ظهور بخش‌ها هنگام اسکرول
    const sections = document.querySelectorAll("section");
    if (sections.length > 0) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = "1";
                    entry.target.style.transform = "translateY(0)";
                }
            });
        }, { threshold: 0.15 });

        sections.forEach(section => {
            section.style.opacity = "0";
            section.style.transform = "translateY(40px)";
            section.style.transition = "0.8s ease";
            observer.observe(section);
        });
    }

    // منوی موبایل
    const menu = document.querySelector(".menu");
    const nav = document.querySelector("nav");
    if (menu && nav) {
        menu.addEventListener("click", () => {
            const isFlex = nav.style.display === "flex";
            nav.style.display = isFlex ? "none" : "flex";
            if (!isFlex) nav.style.flexDirection = "column";
        });
    }

    // جلوگیری از راست‌کلیک روی تصاویر
    document.querySelectorAll('img').forEach(img => img.addEventListener('contextmenu', (e) => e.preventDefault()));

    // رندر محصولات صفحه کالکشن
    initProductsGrid();

    // رندر سبد خرید
    renderCartPage();

    // مدیریت وضعیت احراز هویت
    initAuthListener();
});

document.addEventListener("mousemove", (e) => {
    document.documentElement.style.setProperty("--x", e.clientX + "px");
    document.documentElement.style.setProperty("--y", e.clientY + "px");
});

// ==========================================
// ۴. داده‌های کالکشن‌ها و مودال محصول
// ==========================================
const collectionsProducts = {
    astronomic: {
        title: "مجموعه Astronomic",
        items: [
            { id: 101, title: "طرح آندرومدا", price: "۳۱۰,۰۰۰ تومان", img: "assets/images/collection1.png" },
            { id: 102, title: "طرح سامانه خورشیدی", price: "۳۳۰,۰۰۰ تومان", img: "assets/images/collection6.png" },
            { id: 103, title: "طرح مریخ", price: "۲۸۰,۰۰۰ تومان", img: "assets/images/collection7.png" },
            { id: 104, title: "طرح خورشید", price: "۳۳۰,۰۰۰ تومان", img: "assets/images/collection8.png" },
            { id: 105, title: "طرح ایستگاه فضایی بین المللی", price: "۳۹۰,۰۰۰ تومان", img: "assets/images/collection9.png" }
        ]
    },
    scientific: {
        title: "مجموعه Scientific",
        items: [
            { id: 201, title: "طرح آلبرت انیشتین", price: "۴۷۰,۰۰۰ تومان", img: "assets/images/collection4.png" },
            { id: 202, title: "طرح نیکولا تسلا", price: "۴۲۰,۰۰۰ تومان", img: "assets/images/collection5.png" },
            { id: 203, title: "طرح مریم میرزا خانی", price: "۳۹۰,۰۰۰ تومان", img: "assets/images/collection10.png" },
            { id: 204, title: "طرح ورنر هایزنبرگ", price: "۴۲۰,۰۰۰ تومان", img: "assets/images/collection11.png" },
            { id: 205, title: "طرح ماری کوری", price: "۳۸۰,۰۰۰ تومان", img: "assets/images/collection12.png" }
        ]
    },
    historical: {
        title: "مجموعه Historical",
        items: [
            { id: 301, title: "طرح امیر کبیر", price: "۳۵۰,۰۰۰ تومان", img: "assets/images/collection13.png" },
            { id: 302, title: "طرح نادرشاه", price: "۴۰۰,۰۰۰ تومان", img: "assets/images/collection2.png" },
            { id: 303, title: "طرح کوروش کبیر", price: "۴۴۰,۰۰۰ تومان", img: "assets/images/collection14.png" },
            { id: 304, title: "طرح ناپلئون", price: "۳۹۰,۰۰۰ تومان", img: "assets/images/collection15.png" },
            { id: 305, title: "طرح کریم خان زند", price: "۳۷۰,۰۰۰ تومان", img: "assets/images/collection16.png" }
        ]
    },
    car: {
        title: "مجموعه Car",
        items: [
            { id: 401, title: "Mercedes-Benz CLS 63", price: "۴۶۰,۰۰۰ تومان", img: "assets/images/collection3.png" },
            { id: 402, title: "BMW M8", price: "۴۹۰,۰۰۰ تومان", img: "assets/images/collection17.png" },
            { id: 403, title: "Nissan GTR", price: "۴۶۰,۰۰۰ تومان", img: "assets/images/collection18.png" },
            { id: 404, title: "Lamborghini Aventador", price: "۴۸۰,۰۰۰ تومان", img: "assets/images/collection19.png" },
            { id: 405, title: "Bugatti Chiron", price: "۵۶۰,۰۰۰ تومان", img: "assets/images/collection20.png" }
        ]
    }
};

let currentSelectedProduct = null;
let selectedSize = '۲۰×۲۰ سانتی‌متر';
let basePriceValue = 0;
let currentCalculatedPrice = "";

function initProductsGrid() {
    const grid = document.getElementById("products-grid");
    const titleElement = document.getElementById("collection-title");

    if (grid && titleElement) {
        const urlParams = new URLSearchParams(window.location.search);
        const catKey = urlParams.get("category") || "astronomic";
        const categoryData = collectionsProducts[catKey];

        if (categoryData) {
            titleElement.textContent = categoryData.title;
            grid.innerHTML = categoryData.items.map(item => `
                <div class="product-card" onclick="openProductModal(${item.id}, '${catKey}')">
                    <img src="${item.img}" alt="${item.title}">
                    <h3>${item.title}</h3>
                    <span class="price">${item.price}</span>
                </div>
            `).join('');
        }
    }
}

function openProductModal(productId, catKey) {
    const modal = document.getElementById("product-modal");
    const categoryData = collectionsProducts[catKey];
    if (!categoryData) return;

    const product = categoryData.items.find(p => p.id === productId);
    if (!product) return;

    currentSelectedProduct = product;
    basePriceValue = parsePriceToNumber(product.price);

    const imgElem = document.getElementById("modal-product-img");
    const titleElem = document.getElementById("modal-product-title");

    if (imgElem) imgElem.src = product.img;
    if (titleElem) titleElem.textContent = product.title;

    // ریست حالت گزینه‌های سایز
    const sizeBtns = document.querySelectorAll(".size-btn");
    sizeBtns.forEach((btn, index) => {
        if (index === 0) {
            btn.classList.add("active");
            selectedSize = btn.textContent.trim();
        } else {
            btn.classList.remove("active");
        }
    });

    // ریست جنس به حالت normal
    const defaultMaterialRadio = document.querySelector('input[name="material"][value="normal"]');
    if (defaultMaterialRadio) defaultMaterialRadio.checked = true;

    updatePriceView();
    if (modal) modal.style.display = "flex";
}

function closeProductModal() {
    const modal = document.getElementById("product-modal");
    if (modal) modal.style.display = "none";
}

function selectSize(btn) {
    if (!btn) return;
    document.querySelectorAll(".size-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    selectedSize = btn.textContent.trim();
    updatePriceView();
}

function updatePriceView() {
    const priceElem = document.getElementById("modal-product-price");
    if (!priceElem || !basePriceValue) return;

    const currentMaterial = getSelectedMaterial();
    const sizeMult = sizeMultipliers[selectedSize] || 1.0;
    const materialMult = materialMultipliers[currentMaterial] || 1.0;

    const calculatedNum = basePriceValue * sizeMult * materialMult;

    currentCalculatedPrice = formatToPersianPrice(calculatedNum);
    priceElem.textContent = currentCalculatedPrice;
}

// ==========================================
// ۵. ثبت سفارش اختصاصی
// ==========================================
function showPayment() {
    const imageInput = document.getElementById("design-image");
    const descriptionInput = document.getElementById("design-description");

    if (!imageInput || imageInput.files.length === 0) {
        alert("لطفاً عکس طرح را آپلود کنید.");
        return;
    }

    if (!descriptionInput || descriptionInput.value.trim() === "") {
        alert("لطفاً توضیحات طرح را وارد کنید.");
        return;
    }

    const file = imageInput.files[0];
    const reader = new FileReader();

    reader.onload = function (e) {
        const base64Image = e.target.result;
        const selectedMat = getSelectedMaterial();
        let cart = getCart();

        cart.push({
            type: "custom",
            title: "سفارش اختصاصی تابلو",
            price: "بیعانه ۲۵۰,۰۰۰ تومان",
            material: selectedMat,
            description: descriptionInput.value.trim(),
            img: base64Image
        });

        localStorage.setItem("avira_cart", JSON.stringify(cart));
        alert("سفارش اختصاصی شما به سبد خرید اضافه شد!");
        window.location.href = "cart.html";
    };

    reader.readAsDataURL(file);
}

// ==========================================
// ۶. مدیریت سبد خرید و فاکتور
// ==========================================
function getCart() {
    return JSON.parse(localStorage.getItem("avira_cart") || "[]");
}

function addToCart() {
    if (!currentSelectedProduct) return;

    const chosenMaterial = getSelectedMaterial();
    let cart = getCart();

    cart.push({
        type: "collection",
        id: currentSelectedProduct.id,
        title: currentSelectedProduct.title,
        price: currentCalculatedPrice,
        size: selectedSize,
        material: chosenMaterial,
        img: currentSelectedProduct.img
    });

    localStorage.setItem("avira_cart", JSON.stringify(cart));
    alert(`طرح "${currentSelectedProduct.title}" با جنس (${chosenMaterial}) به سبد خرید اضافه شد!`);
    closeProductModal();
}

function renderCartPage() {
    const container = document.getElementById("cart-items-container");
    const checkoutBox = document.getElementById("cart-checkout-box");
    const codeElem = document.getElementById("checkout-order-code");

    if (!container) return;

    let cart = getCart();

    if (cart.length === 0) {
        container.innerHTML = `<p style="color: #aaa; text-align: center; padding: 30px;">سبد خرید شما خالی است.</p>`;
        if (checkoutBox) checkoutBox.style.display = "none";
        return;
    }

    container.innerHTML = cart.map((item, index) => `
        <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(212,175,55,0.2); border-radius: 12px; padding: 15px; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center;">
            <div>
                <h4 style="color: #fff; margin-bottom: 5px;">${item.title}</h4>
                <p style="font-size: 0.85rem; color: #aaa;">
                    سایز: ${item.size || 'اختصاصی'} | 
                    جنس: <span style="color: #d4af37; text-transform: uppercase;">${item.material || 'normal'}</span> | 
                    قیمت: ${item.price}
                </p>
            </div>
            <button onclick="removeFromCart(${index})" style="background: #ef4444; color: #fff; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 0.8rem;">حذف</button>
        </div>
    `).join('');

    if (checkoutBox && codeElem) {
        checkoutBox.style.display = "block";
        if (codeElem.textContent === "---" || !codeElem.textContent) {
            codeElem.textContent = "AVR-" + Math.floor(100000 + Math.random() * 900000);
        }
    }
}

function removeFromCart(index) {
    let cart = getCart();
    cart.splice(index, 1);
    localStorage.setItem("avira_cart", JSON.stringify(cart));
    renderCartPage();
}

async function submitFinalOrder() {
    if (!supabaseClient) return alert("خطا در اتصال به دیتابیس!");

    const { data: { user } } = await supabaseClient.auth.getUser();

    if (!user) {
        alert("لطفاً ابتدا وارد حساب کاربری خود شوید.");
        window.location.href = "login.html";
        return;
    }

    let cart = getCart();
    const codeElem = document.getElementById("checkout-order-code");
    let orderCode = codeElem ? codeElem.textContent : ("AVR-" + Math.floor(100000 + Math.random() * 900000));

    if (cart.length === 0) return alert("سبد خرید شما خالی است!");

    const imagesList = cart.map(item => {
        if (item.img && item.img.startsWith("data:image")) {
            return "[تصویر فایل اختصاصی کاربر]";
        }
        return item.img;
    }).join(' | ');

    const descriptionText = cart.map(item => `${item.title} (سایز: ${item.size || 'اختصاصی'} - جنس: ${item.material || 'normal'})`).join('؛ ');

    const { error } = await supabaseClient
        .from('custom_orders')
        .insert([{
            order_code: orderCode,
            description: `سبد خرید (${cart.length} آیتم): ${descriptionText}`,
            image_url: imagesList,
            user_id: user.id
        }]);

    if (error) {
        alert("خطا در ثبت سفارش: " + error.message);
    } else {
        alert("سفارش شما ثبت شد! لطفاً پس از واریز بیعانه، عکس رسید را به پشتیبانی ارسال کنید.");
        localStorage.removeItem("avira_cart");
        window.location.href = "index.html";
    }
}

// ==========================================
// ۷. مدیریت حساب کاربری و پروفایل
// ==========================================
function initAuthListener() {
    if (!supabaseClient) return;

    const loggedOutView = document.getElementById("logged-out-view");
    const loggedInView = document.getElementById("logged-in-view");
    const userEmailElem = document.getElementById("user-display-email");

    supabaseClient.auth.onAuthStateChange((event, session) => {
        const user = session ? session.user : null;

        if (user) {
            if (loggedOutView) loggedOutView.style.display = "none";
            if (loggedInView) loggedInView.style.display = "block";
            
            if (userEmailElem) {
                const displayName = user.user_metadata?.full_name || user.email.split('@')[0];
                userEmailElem.textContent = displayName;
            }
        } else {
            if (loggedOutView) loggedOutView.style.display = "block";
            if (loggedInView) loggedInView.style.display = "none";
        }
    });
}

async function registerUser(email, password, fullName = '') {
    if (!supabaseClient) return alert("خطا در اتصال به دیتابیس!");
    
    const { data, error } = await supabaseClient.auth.signUp({
        email: email,
        password: password,
        options: { data: { full_name: fullName } }
    });

    if (error) {
        alert("خطا در ثبت‌نام: " + error.message);
        return;
    }

    if (data && data.user) {
        await supabaseClient.from('profiles').upsert({
            id: data.user.id,
            full_name: fullName,
            updated_at: new Date().toISOString()
        });
    }

    alert("ثبت‌نام با موفقیت انجام شد!");
    window.location.href = "index.html";
}

async function loginUser(email, password) {
    if (!supabaseClient) return alert("خطا در اتصال به دیتابیس!");
    const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
    if (error) {
        alert("خطا در ورود: " + error.message);
    } else {
        alert("با موفقیت وارد شدید!");
        window.location.href = "index.html";
    }
}

async function logoutUser() {
    if (!supabaseClient) return;
    await supabaseClient.auth.signOut();
    alert("از حساب کاربری خارج شدید.");
    window.location.reload();
}

function toggleUserDropdown() {
    const menu = document.getElementById("user-dropdown-menu");
    if (menu) menu.classList.toggle("show");
}

window.addEventListener("click", (e) => {
    const btn = document.querySelector(".user-dropdown-btn");
    const menu = document.getElementById("user-dropdown-menu");
    if (menu && btn && !btn.contains(e.target) && !menu.contains(e.target)) {
        menu.classList.remove("show");
    }
});

async function loadUserSettings() {
    if (!supabaseClient) return;

    const { data: { user } } = await supabaseClient.auth.getUser();

    if (!user) {
        alert("لطفاً ابتدا وارد حساب کاربری خود شوید.");
        window.location.href = "login.html";
        return;
    }

    const emailElem = document.getElementById("settings-email");
    if (emailElem) emailElem.value = user.email || "";

    const { data } = await supabaseClient
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

    if (data) {
        if (document.getElementById("settings-fullname")) document.getElementById("settings-fullname").value = data.full_name || "";
        if (document.getElementById("settings-phone")) document.getElementById("settings-phone").value = data.phone || "";
        if (document.getElementById("settings-address")) document.getElementById("settings-address").value = data.address || "";
    } else if (user.user_metadata?.full_name) {
        if (document.getElementById("settings-fullname")) document.getElementById("settings-fullname").value = user.user_metadata.full_name;
    }
}

async function updateProfile() {
    if (!supabaseClient) return alert("خطا در اتصال به دیتابیس!");

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
        alert("لطفاً ابتدا وارد حساب کاربری خود شوید.");
        return;
    }

    const fullName = document.getElementById("settings-fullname")?.value.trim() || "";
    const phone = document.getElementById("settings-phone")?.value.trim() || "";
    const address = document.getElementById("settings-address")?.value.trim() || "";

    if (!fullName || !phone || !address) {
        alert("لطفاً تمامی فیلدهای نام، شماره تماس و آدرس را تکمیل کنید.");
        return;
    }

    const { error } = await supabaseClient
        .from('profiles')
        .upsert({
            id: user.id,
            full_name: fullName,
            phone: phone,
            address: address,
            updated_at: new Date().toISOString()
        });

    if (error) {
        alert("خطا در ذخیره اطلاعات: " + error.message);
    } else {
        alert("اطلاعات حساب شما با موفقیت ذخیره شد!");
    }
}

async function updatePassword() {
    if (!supabaseClient) return alert("خطا در اتصال به دیتابیس!");

    const passElem = document.getElementById("settings-new-pass");
    const newPassword = passElem ? passElem.value.trim() : "";

    if (!newPassword || newPassword.length < 6) {
        alert("رمز عبور باید حداقل ۶ کاراکتر باشد.");
        return;
    }

    const { error } = await supabaseClient.auth.updateUser({ password: newPassword });

    if (error) {
        alert("خطا در تغییر رمز عبور: " + error.message);
    } else {
        alert("رمز عبور جدید ثبت شد.");
        if (passElem) passElem.value = "";
    }
}

// ==========================================
// ۸. سفارشات کاربر (با پشتیبانی Realtime)
// ==========================================
let userOrdersSubscription = null;

async function loadUserOrders() {
    const listContainer = document.getElementById("user-orders-list");
    if (!listContainer || !supabaseClient) return;

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
        listContainer.innerHTML = `<p style="color: #aaa; text-align: center;">لطفاً وارد حساب کاربری شوید.</p>`;
        return;
    }

    const fetchAndRender = async () => {
        const { data: orders, error } = await supabaseClient
            .from('custom_orders')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (error || !orders || orders.length === 0) {
            listContainer.innerHTML = `<p style="color: #aaa; text-align: center;">سفارشی یافت نشد.</p>`;
            return;
        }

        const statusMap = {
            'pending': { text: 'در حال بررسی', color: '#d4af37', bg: 'rgba(212,175,55,0.15)' },
            'processing': { text: 'در حال ساخت', color: '#60a5fa', bg: 'rgba(96,165,250,0.15)' },
            'completed': { text: 'تکمیل شده', color: '#4ade80', bg: 'rgba(74,222,128,0.15)' },
            'cancelled': { text: 'لغو شده', color: '#f87171', bg: 'rgba(248,113,113,0.15)' }
        };

        listContainer.innerHTML = orders.map(ord => {
            const statusInfo = statusMap[ord.status || 'pending'] || statusMap['pending'];
            return `
                <div class="order-card" style="background: rgba(255,255,255,0.03); border: 1px solid rgba(212,175,55,0.2); border-radius: 12px; padding: 18px; margin-bottom: 15px;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                        <span style="color:#d4af37; font-weight:bold;">کد: ${ord.order_code}</span>
                        <span style="background: ${statusInfo.bg}; color: ${statusInfo.color}; padding: 4px 12px; border-radius: 20px; font-size: 0.8rem; border: 1px solid ${statusInfo.color};">${statusInfo.text}</span>
                    </div>
                    <p style="color:#fff; margin:0;">${ord.description || ''}</p>
                </div>
            `;
        }).join('');
    };

    await fetchAndRender();

    if (userOrdersSubscription) supabaseClient.removeChannel(userOrdersSubscription);

    userOrdersSubscription = supabaseClient
        .channel('user-orders-realtime')
        .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'custom_orders', filter: `user_id=eq.${user.id}` },
            () => { fetchAndRender(); }
        )
        .subscribe();
}

// ==========================================
// ۹. سیستم پشتیبانی و چت آنلاین کاربر
// ==========================================
let chatRealtimeChannel = null;

async function openSupportModal() {
    const modal = document.getElementById("support-modal");
    if (modal) {
        modal.style.display = "flex";
        await loadLiveChatMessages();
        listenToChatRealtime();
    }
}

function closeSupportModal() {
    const modal = document.getElementById("support-modal");
    if (modal) modal.style.display = "none";
    if (chatRealtimeChannel && supabaseClient) {
        supabaseClient.removeChannel(chatRealtimeChannel);
        chatRealtimeChannel = null;
    }
}

async function loadLiveChatMessages() {
    const chatBox = document.getElementById("live-chat-messages");
    if (!chatBox || !supabaseClient) return;

    const { data: { user } } = await supabaseClient.auth.getUser();

    if (!user) {
        chatBox.innerHTML = `
            <div style="text-align: center; margin: auto; padding: 20px;">
                <p style="color: #aaa; margin-bottom: 15px; font-size: 0.9rem;">برای استفاده از چت آنلاین ابتدا وارد حساب خود شوید.</p>
                <a href="login.html" style="background: #d4af37; color: #121212; padding: 8px 16px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 0.85rem;">ورود به حساب</a>
            </div>
        `;
        return;
    }

    const { data: messages, error } = await supabaseClient
        .from('support_messages')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

    if (error) {
        chatBox.innerHTML = `<p style="color: #f87171; text-align: center;">خطا در دریافت پیام‌ها</p>`;
        return;
    }

    if (!messages || messages.length === 0) {
        chatBox.innerHTML = `<p style="color: #666; text-align: center; margin: auto; font-size: 0.85rem;">سلام! چطور می‌توانیم کمکتان کنیم؟ پیام بگذارید.</p>`;
        return;
    }

    chatBox.innerHTML = messages.map(msg => {
        const userText = msg.message || msg.text || '';
        let html = '';

        if (userText) {
            html += `
                <div style="align-self: flex-start; max-width: 80%; background: #262626; color: #fff; padding: 10px 14px; border-radius: 12px 12px 12px 2px; font-size: 0.9rem; line-height: 1.4; border: 1px solid rgba(255,255,255,0.05); margin-bottom: 8px;">
                    ${userText}
                </div>
            `;
        }

        if (msg.admin_reply) {
            html += `
                <div style="align-self: flex-end; max-width: 80%; background: rgba(212, 175, 55, 0.15); color: #d4af37; padding: 10px 14px; border-radius: 12px 12px 2px 12px; font-size: 0.9rem; line-height: 1.4; border: 1px solid rgba(212, 175, 55, 0.3); margin-bottom: 8px;">
                    <strong style="display:block; font-size:0.75rem; margin-bottom: 3px; color:#fff;">پشتیبانی آویرا:</strong>
                    ${msg.admin_reply}
                </div>
            `;
        }

        return html;
    }).join('');

    chatBox.scrollTop = chatBox.scrollHeight;
}

async function submitSupportMessage() {
    if (!supabaseClient) return alert("خطا در اتصال به دیتابیس!");

    const msgElem = document.getElementById("sup-msg");
    if (!msgElem) return;

    const msg = msgElem.value.trim();
    if (!msg) return;

    const { data: { user } } = await supabaseClient.auth.getUser();

    if (!user) {
        alert("لطفاً ابتدا وارد حساب کاربری خود شوید.");
        window.location.href = "login.html";
        return;
    }

    const displayName = user.user_metadata?.full_name || user.email;

    const { error } = await supabaseClient
        .from('support_messages')
        .insert([{ 
            sender_name: displayName, 
            contact_info: user.email, 
            message: msg, 
            status: 'pending', 
            user_id: user.id 
        }]);

    if (error) {
        alert("خطا در ارسال: " + error.message);
    } else {
        msgElem.value = "";
        await loadLiveChatMessages();
        loadUserSupportTickets();
    }
}

async function listenToChatRealtime() {
    if (!supabaseClient) return;
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) return;

    if (chatRealtimeChannel) supabaseClient.removeChannel(chatRealtimeChannel);

    chatRealtimeChannel = supabaseClient
        .channel('chat-room-' + user.id)
        .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'support_messages', filter: `user_id=eq.${user.id}` },
            () => { loadLiveChatMessages(); }
        )
        .subscribe();
}

async function loadUserSupportTickets() {
    const listContainer = document.getElementById("user-support-list") || document.getElementById("user-support-tickets-list");
    if (!listContainer || !supabaseClient) return;

    try {
        const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
        if (authError || !user) {
            listContainer.innerHTML = "<p style='color:#aaa; text-align:center;'>لطفاً ابتدا وارد حساب کاربری خود شوید.</p>";
            return;
        }

        const { data: messages, error } = await supabaseClient
            .from('support_messages')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: true });

        if (error) throw error;

        if (!messages || messages.length === 0) {
            listContainer.innerHTML = "<p style='color:#aaa; text-align:center;'>شما هنوز هیچ پیامی ثبت نکرده‌اید.</p>";
            return;
        }

        listContainer.innerHTML = messages.map(msg => {
            const userText = msg.message || msg.text || '';
            let html = '';

            if (userText) {
                html += `
                    <div style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; padding: 12px; margin-bottom: 8px;">
                        <p style="color: #fff; margin: 0 0 5px 0;"><strong>شما:</strong> ${userText}</p>
                        <span style="font-size: 0.7rem; color: #888;">${msg.created_at ? new Date(msg.created_at).toLocaleString('fa-IR') : ''}</span>
                    </div>
                `;
            }

            if (msg.admin_reply) {
                html += `
                    <div style="background: rgba(212, 175, 55, 0.1); border: 1px solid rgba(212, 175, 55, 0.3); border-radius: 10px; padding: 12px; margin-bottom: 12px; margin-right: 20px;">
                        <p style="color: #d4af37; margin: 0 0 5px 0;"><strong>پاسخ پشتیبانی:</strong> ${msg.admin_reply}</p>
                    </div>
                `;
            }

            return html;
        }).join('');

        listContainer.scrollTop = listContainer.scrollHeight;

    } catch (err) {
        console.error("خطا در دریافت تیکت‌های کاربر:", err);
        listContainer.innerHTML = "<p style='color:#f87171; text-align:center;'>خطا در دریافت اطلاعات پیام‌ها.</p>";
    }
}

// ==========================================
// ۱۰. پنل مدیریت (Admin Dashboard)
// ==========================================
let adminRealtimeChannel = null;

function checkAdminLogin() {
    const userInput = document.getElementById("admin-user");
    const passInput = document.getElementById("admin-pass");

    const username = userInput ? userInput.value.trim() : "";
    const password = passInput ? passInput.value.trim() : "";

    if (username === "amir" && password === "Amir1390") {
        const loginBox = document.getElementById("login-box");
        const adminDashboard = document.getElementById("admin-dashboard");

        if (loginBox) loginBox.style.display = "none";
        if (adminDashboard) adminDashboard.style.display = "block";

        loadAdminDashboard();
    } else {
        alert("نام کاربری یا رمز عبور اشتباه است!");
    }
}

function logoutAdmin() {
    const loginBox = document.getElementById("login-box");
    const adminDashboard = document.getElementById("admin-dashboard");

    if (loginBox) loginBox.style.display = "block";
    if (adminDashboard) adminDashboard.style.display = "none";
    
    if (document.getElementById("admin-user")) document.getElementById("admin-user").value = "";
    if (document.getElementById("admin-pass")) document.getElementById("admin-pass").value = "";
}

function switchAdminTab(tab) {
    const tabOrders = document.getElementById("tab-orders");
    const tabSupport = document.getElementById("tab-support");
    const btnOrders = document.getElementById("btn-tab-orders");
    const btnSupport = document.getElementById("btn-tab-support");

    if (tab === 'orders') {
        if (tabOrders) tabOrders.style.display = "block";
        if (tabSupport) tabSupport.style.display = "none";
        if (btnOrders) btnOrders.style.opacity = "1";
        if (btnSupport) btnSupport.style.opacity = "0.5";
    } else {
        if (tabOrders) tabOrders.style.display = "none";
        if (tabSupport) tabSupport.style.display = "block";
        if (btnOrders) btnOrders.style.opacity = "0.5";
        if (btnSupport) btnSupport.style.opacity = "1";

        loadAdminSupportTickets();
    }
}

async function loadAdminDashboard() {
    const ordersList = document.getElementById("orders-list");
    if (!ordersList || !supabaseClient) return;

    ordersList.innerHTML = `<p style="color: #aaa; text-align: center;">در حال دریافت اطلاعات...</p>`;

    try {
        const { data, error } = await supabaseClient
            .from('custom_orders')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        if (!data || data.length === 0) {
            ordersList.innerHTML = `<p style="color: #aaa; text-align: center;">هنوز سفارشی ثبت نشده است.</p>`;
            return;
        }

        ordersList.innerHTML = data.map(order => {
            const currentStatus = order.status || 'pending';
            const code = order.order_code;
            const isBase64 = order.image_url && order.image_url.startsWith("data:image");
            
            return `
                <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(212, 175, 55, 0.2); border-radius: 12px; padding: 18px; margin-bottom: 15px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                        <p style="color: #d4af37; font-weight: bold; margin: 0;">کد سفارش: ${code || '---'}</p>
                        <select onchange="updateOrderStatus('${code}', this.value)" style="background: #1a1a1a; color: #fff; border: 1px solid #d4af37; padding: 6px 12px; border-radius: 8px; cursor: pointer; outline: none;">
                            <option value="pending" ${currentStatus === 'pending' ? 'selected' : ''}>در حال بررسی</option>
                            <option value="processing" ${currentStatus === 'processing' ? 'selected' : ''}>در حال ساخت</option>
                            <option value="completed" ${currentStatus === 'completed' ? 'selected' : ''}>تکمیل شده</option>
                            <option value="cancelled" ${currentStatus === 'cancelled' ? 'selected' : ''}>لغو شده</option>
                        </select>
                    </div>
                    <p style="margin-bottom: 8px; color: #ddd;"><strong>توضیحات:</strong> ${order.description || 'بدون توضیحات'}</p>
                    ${order.image_url ? (isBase64 ? `<p style="margin-bottom: 5px;"><img src="${order.image_url}" style="max-width:150px; border-radius:8px;"></p>` : `<p style="margin-bottom: 5px;"><a href="${order.image_url}" target="_blank" style="color: #60a5fa;">مشاهده تصویر</a></p>`) : ''}
                    <p style="font-size: 0.8rem; color: #888; margin-top: 10px;">تاریخ ثبت: ${order.created_at ? new Date(order.created_at).toLocaleString('fa-IR') : 'ثبت شده'}</p>
                </div>
            `;
        }).join('');

    } catch (err) {
        console.error("خطا در دریافت سفارشات:", err);
        ordersList.innerHTML = `<p style="color: #f87171; text-align: center;">خطا در دریافت اطلاعات!</p>`;
    }
}

async function updateOrderStatus(orderCode, newStatus) {
    if (!supabaseClient) return alert("خطا در اتصال به دیتابیس!");

    const { error } = await supabaseClient
        .from('custom_orders')
        .update({ status: newStatus })
        .eq('order_code', orderCode);

    if (error) {
        alert("خطا در تغییر وضعیت: " + error.message);
    } else {
        alert("وضعیت سفارش به روزرسانی شد.");
        loadAdminDashboard();
    }
}

async function loadAdminSupportTickets() {
    const supportList = document.getElementById("admin-support-list") || document.getElementById("support-list");
    if (!supportList || !supabaseClient) return;

    listenToAdminRealtime();
    supportList.innerHTML = `<p style="color: #aaa; text-align: center;">در حال دریافت تیکت‌ها...</p>`;

    try {
        const { data: messages, error } = await supabaseClient
            .from('support_messages')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        if (!messages || messages.length === 0) {
            supportList.innerHTML = `<p style="color: #aaa; text-align: center;">پیام پشتیبانی جدیدی وجود ندارد.</p>`;
            return;
        }

        supportList.innerHTML = messages.map(msg => `
            <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(212, 175, 55, 0.2); border-radius: 12px; padding: 15px; margin-bottom: 15px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                    <strong style="color: #d4af37;">فرستنده: ${msg.sender_name || msg.contact_info || 'ناشناس'}</strong>
                    <span style="font-size: 0.75rem; color: #888;">${msg.created_at ? new Date(msg.created_at).toLocaleString('fa-IR') : ''}</span>
                </div>
                <p style="color: #ddd; margin-bottom: 10px;"><strong>پیام:</strong> ${msg.message || msg.text || ''}</p>
                
                ${msg.admin_reply ? `
                    <div style="background: rgba(74, 222, 128, 0.1); border: 1px solid rgba(74, 222, 128, 0.3); padding: 8px 12px; border-radius: 8px; margin-bottom: 10px;">
                        <p style="color: #4ade80; margin: 0; font-size: 0.85rem;"><strong>پاسخ داده شده:</strong> ${msg.admin_reply}</p>
                    </div>
                ` : ''}

                <div style="display: flex; gap: 8px;">
                    <input type="text" id="reply-input-${msg.id}" placeholder="متن پاسخ ادمین..." style="flex: 1; background: #1a1a1a; border: 1px solid #333; color: #fff; padding: 8px 12px; border-radius: 6px; outline: none; font-size: 0.85rem;">
                    <button onclick="sendAdminReply('${msg.id}')" style="background: #d4af37; color: #121212; border: none; padding: 8px 16px; border-radius: 6px; font-weight: bold; cursor: pointer; font-size: 0.85rem;">ارسال پاسخ</button>
                </div>
            </div>
        `).join('');

    } catch (err) {
        console.error("خطا در دریافت پیام‌ها توسط ادمین:", err);
        supportList.innerHTML = `<p style="color: #f87171; text-align: center;">خطا در دریافت اطلاعات پشتیبانی!</p>`;
    }
}

async function sendAdminReply(messageId) {
    if (!supabaseClient) return alert("خطا در اتصال به دیتابیس!");

    const inputElem = document.getElementById(`reply-input-${messageId}`);
    if (!inputElem) return;

    const replyText = inputElem.value.trim();
    if (!replyText) return alert("لطفاً متن پاسخ را وارد کنید.");

    try {
        const { error } = await supabaseClient
            .from('support_messages')
            .update({ 
                admin_reply: replyText,
                status: 'replied'
            })
            .eq('id', messageId);

        if (error) throw error;

        alert("پاسخ شما با موفقیت ثبت شد.");
        loadAdminSupportTickets();

    } catch (err) {
        alert("خطا در ارسال پاسخ: " + err.message);
    }
}

function listenToAdminRealtime() {
    if (!supabaseClient || adminRealtimeChannel) return;

    adminRealtimeChannel = supabaseClient
        .channel('admin-chat-room')
        .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'support_messages' },
            () => { loadAdminSupportTickets(); }
        )
        .subscribe();
}

// متغیر برای ذخیره قیمت پایه محصول باز شده
let currentBasePrice = 0;

// تابع بروزرسانی قیمت نهایی بر اساس سایز و جنس انتخاب شده
function updateTotalPrice() {
    // 1. دریافت جنس انتخاب شده و ضریب آن
    const selectedMaterial = document.querySelector('input[name="material"]:checked');
    const materialMultiplier = selectedMaterial ? parseFloat(selectedMaterial.getAttribute('data-multiplier')) || 1.0 : 1.0;

    // 2. دریافت ضریب سایز (در صورت داشتن ضریب برای سایزها)
    // اگر سایزها قیمت پایه را تغییر می‌دهند، می‌توانید متغیر آن را اینجا اعمال کنید
    const activeSizeBtn = document.querySelector('.size-btn.active');
    
    // 3. محاسبه قیمت نهایی
    const finalPrice = Math.round(currentBasePrice * materialMultiplier);

    // 4. نمایش قیمت فرمت‌شده در مودال
    const priceElement = document.getElementById('modal-product-price');
    if (priceElement) {
        priceElement.textContent = finalPrice.toLocaleString('fa-IR') + ' تومان';
    }
}

// تابع انتخاب سایز (برای مدیریت کلاس active و بروزرسانی قیمت)
function selectSize(button) {
    // حذف کلاس active از همه دکمه‌های سایز
    document.querySelectorAll('.size-btn').forEach(btn => btn.classList.remove('active'));
    // افزودن کلاس active به دکمه کلیک شده
    button.classList.add('active');
    
    // بروزرسانی قیمت
    updateTotalPrice();
}

// هنگام باز شدن مودال محصول این تابع باید فراخوانی شود تا قیمت اولیه ست شود
function openProductModal(product) {
    currentBasePrice = product.price; // قیمت پایه محصول از دیتابیس یا آبجکت
    
    // تنظیم پیش‌فرض جنس روی Normal (ضریب 1.0)
    const defaultMaterial = document.querySelector('input[name="material"][value="normal"]');
    if (defaultMaterial) defaultMaterial.checked = true;

    // محاسبه اولیه قیمت
    updateTotalPrice();
    
    // نمایش مودال
    document.getElementById('product-modal').style.display = 'block';
}

