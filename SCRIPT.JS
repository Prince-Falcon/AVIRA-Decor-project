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

function translateMaterial(mat) {
    const map = {
        'economy': 'اقتصادی (Economy)',
        'normal': 'استاندارد (Normal)',
        'luxury': 'لوکس (Luxury)',
        'metal': 'فلزی / پلاک (Metal)'
    };
    return map[mat] || mat || 'استاندارد';
}

function formatDatePersian(dateStr) {
    if (!dateStr) return 'نامشخص';
    try {
        const date = new Date(dateStr);
        return new Intl.DateTimeFormat('fa-IR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    } catch (e) {
        return dateStr;
    }
}

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
    if (document.getElementById("user-orders-list")) loadUserOrders();
    if (document.getElementById("user-support-list")) loadUserSupportTickets();

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

    const menu = document.querySelector(".menu");
    const nav = document.querySelector("nav");
    if (menu && nav) {
        menu.addEventListener("click", () => {
            const isFlex = nav.style.display === "flex";
            nav.style.display = isFlex ? "none" : "flex";
            if (!isFlex) nav.style.flexDirection = "column";
        });
    }

    document.querySelectorAll('img').forEach(img => img.addEventListener('contextmenu', (e) => e.preventDefault()));

    initProductsGrid();
    renderCartPage();
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

    const sizeBtns = document.querySelectorAll(".size-btn");
    sizeBtns.forEach((btn, index) => {
        if (index === 0) {
            btn.classList.add("active");
            selectedSize = btn.textContent.trim();
        } else {
            btn.classList.remove("active");
        }
    });

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
            size: "اختصاصی",
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
    alert(`طرح "${currentSelectedProduct.title}" با جنس (${translateMaterial(chosenMaterial)}) به سبد خرید اضافه شد!`);
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
                    سایز: <span style="color:#fff;">${item.size || 'اختصاصی'}</span> | 
                    جنس: <span style="color: #d4af37;">${translateMaterial(item.material)}</span> | 
                    قیمت: <span style="color: #4ade80;">${item.price}</span>
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

    const descriptionText = cart.map(item => `${item.title} (سایز: ${item.size || 'اختصاصی'} - جنس: ${translateMaterial(item.material)})`).join('؛ ');

    const materialsList = [...new Set(cart.map(i => translateMaterial(i.material)))].join(', ');
    const sizesList = [...new Set(cart.map(i => i.size || 'اختصاصی'))].join(', ');

    const { error } = await supabaseClient
        .from('custom_orders')
        .insert([{
            order_code: orderCode,
            description: `سبد خرید (${cart.length} آیتم): ${descriptionText}`,
            image_url: imagesList,
            user_id: user.id,
            items: cart,
            material: materialsList,
            size: sizesList,
            status: 'در انتظار بررسی'
        }]);

    if (error) {
        alert("خطا در ثبت سفارش: " + error.message);
    } else {
        alert("سفارش شما ثبت شد! لطفاً پس از واریز بیعانه، عکس رسید را به پشتیبانی ارسال کنید.");
        localStorage.removeItem("avira_cart");
        window.location.href = "orders.html";
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
    if (btn && menu && !btn.contains(e.target) && !menu.contains(e.target)) {
        menu.classList.remove("show");
    }
});

async function updateUserSettings() {
    if (!supabaseClient) return alert("خطا در اتصال به دیتابیس!");

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) return alert("لطفاً ابتدا وارد شوید.");

    const fullName = document.getElementById("settings-fullname")?.value.trim() || "";
    const phone = document.getElementById("settings-phone")?.value.trim() || "";
    const address = document.getElementById("settings-address")?.value.trim() || "";

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
        alert("خطا در به روزرسانی اطلاعات: " + error.message);
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
        listContainer.innerHTML = `<p style="color: #aaa; text-align: center; padding: 30px;">لطفاً ابتدا وارد حساب کاربری شوید.</p>`;
        return;
    }

    const fetchAndRender = async () => {
        const { data: orders, error } = await supabaseClient
            .from('custom_orders')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (error) {
            listContainer.innerHTML = `<p style="color: #f87171; text-align: center;">خطا در دریافت سفارشات!</p>`;
            return;
        }

        if (!orders || orders.length === 0) {
            listContainer.innerHTML = `
                <div class="no-orders" style="text-align: center; padding: 40px 20px;">
                    <p style="color: #aaa; margin-bottom: 15px;">شما هنوز هیچ سفارشی ثبت نکرده‌اید.</p>
                    <a href="index.html#collection" class="btn-shop">مشاهده مجموعه‌ها</a>
                </div>
            `;
            return;
        }

        listContainer.innerHTML = orders.map(order => {
            let itemsHtml = '';
            if (order.items && Array.isArray(order.items) && order.items.length > 0) {
                itemsHtml = order.items.map(item => `
                    <div style="background: rgba(255,255,255,0.03); border-right: 3px solid #d4af37; padding: 8px 12px; margin: 6px 0; border-radius: 6px; font-size: 0.88rem;">
                        <div><strong style="color: #fff;">${item.title}</strong></div>
                        <div style="color: #aaa; font-size: 0.8rem; margin-top: 3px;">
                            سایز: <span style="color: #e0e0e0;">${item.size || 'اختصاصی'}</span> | 
                            جنس: <span style="color: #d4af37;">${translateMaterial(item.material)}</span> | 
                            قیمت: <span style="color: #4ade80;">${item.price || '---'}</span>
                        </div>
                    </div>
                `).join('');
            } else {
                itemsHtml = `<p style="color: #ccc; font-size: 0.9rem;">${order.description || 'توضیحات در دسترس نیست'}</p>`;
            }

            return `
                <div class="order-card" style="background: #1e1e1e; border: 1px solid rgba(212,175,55,0.3); border-radius: 12px; padding: 20px; margin-bottom: 18px; box-shadow: 0 4px 15px rgba(0,0,0,0.3);">
                    <div class="order-header" style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px dashed rgba(255,255,255,0.1); padding-bottom: 10px; margin-bottom: 12px;">
                        <div class="order-code-box">
                            <span class="order-label" style="color: #aaa; font-size: 0.85rem;">کد سفارش:</span>
                            <span class="order-code" style="color: #d4af37; font-weight: bold; font-size: 1.05rem;">${order.order_code || '---'}</span>
                        </div>
                        <div class="order-date" style="font-size: 0.82rem; color: #aaa; background: rgba(255,255,255,0.05); padding: 4px 10px; border-radius: 6px;">📅 ${formatDatePersian(order.created_at)}</div>
                    </div>
                    
                    <div class="order-body">
                        <div style="font-size: 0.85rem; color: #aaa; margin-bottom: 8px;">
                            🏷️ <b>متریال کلی:</b> <span style="color: #d4af37;">${order.material || 'استاندارد'}</span> &nbsp;|&nbsp; 
                            📏 <b>سایز کلی:</b> <span style="color: #fff;">${order.size || 'اختصاصی'}</span>
                        </div>
                        <div style="margin-top: 10px;">
                            <strong style="color: #fff; font-size: 0.9rem;">آیتم‌های خرید:</strong>
                            ${itemsHtml}
                        </div>
                    </div>

                    <div style="margin-top: 15px; display: flex; justify-content: space-between; align-items: center;">
                        <span class="order-status" style="display: inline-block; padding: 4px 12px; font-size: 0.8rem; border-radius: 20px; background: rgba(212,175,55,0.15); color: #d4af37; border: 1px solid rgba(212,175,55,0.3);">وضعیت: ${order.status || 'در انتظار بررسی'}</span>
                    </div>
                </div>
            `;
        }).join('');
    };

    await fetchAndRender();

    if (!userOrdersSubscription) {
        userOrdersSubscription = supabaseClient
            .channel('user-orders-changes-' + user.id)
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'custom_orders', filter: `user_id=eq.${user.id}` },
                () => { fetchAndRender(); }
            )
            .subscribe();
    }
}

// ==========================================
// ۹. چت آنلاین و پشتیبانی (پشتیبانی Realtime)
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
        chatBox.innerHTML = `<p style="color: #f87171; text-align: center;">خطا در دریافت پیام‌ها!</p>`;
        return;
    }

    if (!messages || messages.length === 0) {
        chatBox.innerHTML = `<p style="color: #666; text-align: center; margin: auto; font-size: 0.85rem;">سلام! چطور می‌توانیم کمکتان کنیم؟ پیام خود را بنویسید.</p>`;
        return;
    }

    chatBox.innerHTML = messages.map(msg => `
        <div style="display: flex; flex-direction: column; align-items: flex-end;">
            <div style="background: #d4af37; color: #121212; padding: 8px 12px; border-radius: 12px 12px 0 12px; max-width: 80%; font-size: 0.9rem;">
                ${msg.message}
            </div>
            <span style="font-size: 0.7rem; color: #666; margin-top: 2px;">${formatDatePersian(msg.created_at)}</span>
        </div>
        ${msg.admin_reply ? `
            <div style="display: flex; flex-direction: column; align-items: flex-start;">
                <div style="background: #2a2a2a; border: 1px solid rgba(212,175,55,0.3); color: #fff; padding: 8px 12px; border-radius: 12px 12px 12px 0; max-width: 80%; font-size: 0.9rem;">
                    <small style="color: #d4af37; display: block; font-size: 0.75rem; margin-bottom: 2px;">پشتیبانی آویرا:</small>
                    ${msg.admin_reply}
                </div>
            </div>
        ` : ''}
    `).join('');

    chatBox.scrollTop = chatBox.scrollHeight;
}

async function sendSupportMessage() {
    if (!supabaseClient) return alert("خطا در اتصال به دیتابیس!");

    const { data: { user } } = await supabaseClient.auth.getUser();

    if (!user) {
        alert("لطفاً ابتدا وارد حساب کاربری خود شوید.");
        window.location.href = "login.html";
        return;
    }

    const msgElem = document.getElementById("sup-msg");
    const messageText = msgElem ? msgElem.value.trim() : "";

    if (!messageText) return alert("لطفاً پیام خود را بنویسید.");

    const { error } = await supabaseClient
        .from('support_messages')
        .insert([{
            user_id: user.id,
            user_email: user.email,
            message: messageText,
            status: 'pending'
        }]);

    if (error) {
        alert("خطا در ارسال پیام: " + error.message);
    } else {
        if (msgElem) msgElem.value = "";
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
            .order('created_at', { ascending: false });

        if (error) throw error;

        if (!messages || messages.length === 0) {
            listContainer.innerHTML = "<p style='color:#aaa; text-align:center;'>پیامی ثبت نشده است.</p>";
            return;
        }

        listContainer.innerHTML = messages.map(msg => `
            <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(212,175,55,0.2); border-radius: 10px; padding: 12px; margin-bottom: 10px;">
                <div style="display: flex; justify-content: space-between; font-size: 0.8rem; color: #aaa; margin-bottom: 6px;">
                    <span>📅 ${formatDatePersian(msg.created_at)}</span>
                    <span style="color: ${msg.status === 'replied' ? '#4ade80' : '#f59e0b'};">${msg.status === 'replied' ? 'پاسخ داده شده' : 'در انتظار پاسخ'}</span>
                </div>
                <p style="color: #fff; font-size: 0.9rem; margin-bottom: 6px;"><strong>پیام شما:</strong> ${msg.message}</p>
                ${msg.admin_reply ? `<p style="color: #d4af37; font-size: 0.88rem; background: rgba(212,175,55,0.08); padding: 8px; border-radius: 6px; border-right: 3px solid #d4af37;"><strong>پاسخ پشتیبانی:</strong> ${msg.admin_reply}</p>` : ''}
            </div>
        `).join('');

    } catch (err) {
        console.error("خطا در بارگذاری تیکت‌های پشتیبانی:", err);
        listContainer.innerHTML = "<p style='color:#f87171; text-align:center;'>خطا در دریافت تیکت‌ها!</p>";
    }
}

// ==========================================
// ۱۰. پنل مدیریت (Admin Panel)
// ==========================================
let adminRealtimeChannel = null;

function checkAdminLogin() {
    const userElem = document.getElementById("admin-user");
    const passElem = document.getElementById("admin-pass");

    const username = userElem ? userElem.value.trim() : "";
    const password = passElem ? passElem.value.trim() : "";

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
        loadAdminDashboard();
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

    ordersList.innerHTML = `<p style="color: #aaa; text-align: center; padding: 30px;">در حال دریافت سفارشات از دیتابیس...</p>`;

    try {
        const { data: orders, error } = await supabaseClient
            .from('custom_orders')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        if (!orders || orders.length === 0) {
            ordersList.innerHTML = `<p style="color: #aaa; text-align: center; padding: 30px;">هیچ سفارشی در دیتابیس ثبت نشده است.</p>`;
            return;
        }

        ordersList.innerHTML = orders.map(order => {
            let itemsHtml = '';
            if (order.items && Array.isArray(order.items) && order.items.length > 0) {
                itemsHtml = order.items.map(item => `
                    <div style="background: rgba(255,255,255,0.03); border-right: 3px solid #d4af37; padding: 8px 12px; margin: 6px 0; border-radius: 6px; font-size: 0.88rem;">
                        <div><strong style="color: #fff;">${item.title}</strong></div>
                        <div style="color: #aaa; font-size: 0.8rem; margin-top: 3px;">
                            سایز: <span style="color: #fff;">${item.size || 'اختصاصی'}</span> | 
                            جنس: <span style="color: #d4af37;">${translateMaterial(item.material)}</span> | 
                            قیمت: <span style="color: #4ade80;">${item.price || 'نامشخص'}</span>
                        </div>
                    </div>
                `).join('');
            } else {
                itemsHtml = `<p style="color: #ccc; font-size: 0.9rem;">${order.description || 'توضیحات موجود نیست'}</p>`;
            }

            const materialDisplay = order.material ? order.material : 'استاندارد';
            const sizeDisplay = order.size ? order.size : 'اختصاصی';

            return `
                <div class="order-card" style="background: #1e1e1e; border: 1px solid rgba(212,175,55,0.35); border-radius: 14px; padding: 20px; margin-bottom: 20px; box-shadow: 0 6px 20px rgba(0,0,0,0.4);">
                    <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 12px; margin-bottom: 14px;">
                        <div>
                            <span style="color: #d4af37; font-weight: bold; font-size: 1.15rem;">🛍️ کد سفارش: ${order.order_code || 'بدون کد'}</span>
                            <span style="display: block; color: #888; font-size: 0.8rem; margin-top: 4px;">📅 تاریخ ثبت: ${formatDatePersian(order.created_at)}</span>
                        </div>
                        <div>
                            <select onchange="updateOrderStatus('${order.order_code}', this.value)" style="background: #242424; color: #d4af37; border: 1px solid #d4af37; padding: 8px 14px; border-radius: 8px; font-weight: bold; cursor: pointer; outline: none;">
                                <option value="در انتظار بررسی" ${order.status === 'در انتظار بررسی' ? 'selected' : ''}>⏳ در انتظار بررسی</option>
                                <option value="تایید شده" ${order.status === 'تایید شده' ? 'selected' : ''}>✅ تایید شده</option>
                                <option value="در حال ساخت" ${order.status === 'در حال ساخت' ? 'selected' : ''}>🛠️ در حال ساخت</option>
                                <option value="ارسال شده" ${order.status === 'ارسال شده' ? 'selected' : ''}>🚚 ارسال شده</option>
                                <option value="لغو شده" ${order.status === 'لغو شده' ? 'selected' : ''}>❌ لغو شده</option>
                            </select>
                        </div>
                    </div>

                    <div style="margin-bottom: 12px;">
                        <div style="font-size: 0.88rem; color: #aaa; margin-bottom: 8px;">
                            🏷️ <b>متریال سفارش:</b> <span class="material-badge" style="background: rgba(212,175,55,0.15); color: #d4af37; padding: 3px 10px; border-radius: 6px; font-weight: bold; border: 1px solid rgba(212,175,55,0.3);">${materialDisplay}</span>
                            &nbsp;|&nbsp;
                            📏 <b>سایز سفارش:</b> <span style="color: #fff; font-weight: bold;">${sizeDisplay}</span>
                        </div>
                        <div style="margin-top: 12px;">
                            <strong style="color: #fff; font-size: 0.95rem;">📦 لیست اقلام سفارش:</strong>
                            ${itemsHtml}
                        </div>
                    </div>

                    ${order.image_url && order.image_url !== '[تصویر فایل اختصاصی کاربر]' ? `
                        <div style="margin-top: 12px; padding-top: 10px; border-top: 1px dashed rgba(255,255,255,0.08); font-size: 0.82rem; color: #aaa;">
                            🖼️ <b>تصاویر / فایل‌ها:</b> <a href="${order.image_url}" target="_blank" style="color: #60a5fa; text-decoration: underline; margin-right: 5px;">مشاهده یا دانلود فایل</a>
                        </div>
                    ` : ''}
                </div>
            `;
        }).join('');

    } catch (err) {
        console.error("خطا در دریافت سفارشات ادمین:", err);
        ordersList.innerHTML = `<p style="color: #f87171; text-align: center; padding: 20px;">خطا در دریافت اطلاعات سفارشات از دیتابیس!</p>`;
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
        alert("وضعیت سفارش با موفقیت به روزرسانی شد.");
        loadAdminDashboard();
    }
}

async function loadAdminSupportTickets() {
    const supportList = document.getElementById("admin-support-list") || document.getElementById("support-list");
    if (!supportList || !supabaseClient) return;

    listenToAdminRealtime();
    supportList.innerHTML = `<p style="color: #aaa; text-align: center; padding: 20px;">در حال دریافت پیام‌های پشتیبانی...</p>`;

    try {
        const { data: messages, error } = await supabaseClient
            .from('support_messages')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        if (!messages || messages.length === 0) {
            supportList.innerHTML = `<p style="color: #aaa; text-align: center; padding: 20px;">هیچ پیام پشتیبانی دریافت نشده است.</p>`;
            return;
        }

        supportList.innerHTML = messages.map(msg => `
            <div style="background: #1e1e1e; border: 1px solid rgba(212,175,55,0.3); border-radius: 12px; padding: 16px; margin-bottom: 14px; box-shadow: 0 4px 15px rgba(0,0,0,0.3);">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; font-size: 0.85rem; color: #aaa;">
                    <span>👤 کاربر: <strong style="color: #fff;">${msg.user_email || msg.user_id}</strong></span>
                    <span>📅 ${formatDatePersian(msg.created_at)}</span>
                </div>
                <div style="background: rgba(255,255,255,0.03); padding: 10px; border-radius: 8px; color: #fff; margin-bottom: 10px; font-size: 0.95rem;">
                    💬 <strong>متن پیام:</strong> ${msg.message}
                </div>
                ${msg.admin_reply ? `
                    <div style="background: rgba(212,175,55,0.1); border-right: 3px solid #d4af37; padding: 10px; border-radius: 6px; color: #d4af37; font-size: 0.9rem; margin-bottom: 10px;">
                        <strong>پاسخ ثبت‌شده ادمین:</strong> ${msg.admin_reply}
                    </div>
                ` : ''}
                <div style="display: flex; gap: 8px; margin-top: 8px;">
                    <input type="text" id="reply-input-${msg.id}" placeholder="پاسخ خود را بنویسید..." style="flex: 1; background: #2a2a2a; border: 1px solid #444; color: #fff; padding: 8px 12px; border-radius: 6px; font-size: 0.88rem; outline: none;">
                    <button onclick="sendAdminReply('${msg.id}')" style="background: #d4af37; color: #121212; border: none; padding: 8px 16px; border-radius: 6px; font-weight: bold; cursor: pointer; font-size: 0.85rem;">ارسال پاسخ</button>
                </div>
            </div>
        `).join('');

    } catch (err) {
        console.error("خطا در دریافت پیام‌ها توسط ادمین:", err);
        supportList.innerHTML = `<p style="color: #f87171; text-align: center; padding: 20px;">خطا در دریافت اطلاعات پشتیبانی!</p>`;
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
        .channel('admin-support-channel')
        .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'support_messages' },
            () => {
                const sound = document.getElementById("notification-sound");
                if (sound) sound.play().catch(() => {});
                loadAdminSupportTickets();
            }
        )
        .subscribe();
}


// ==========================================
// بارگذاری خودکار اطلاعات کاربر در صفحه تنظیمات
// ==========================================
async function loadUserProfileData() {
    if (!supabaseClient) return;

    const fullNameInput = document.getElementById('settings-fullname');
    if (!fullNameInput) return; // اگر در صفحه تنظیمات نیستیم اجرا نشود

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
        window.location.href = "login.html";
        return;
    }

    try {
        const { data, error } = await supabaseClient
            .from('profiles')
            .select('full_name, phone, address')
            .eq('id', user.id)
            .maybeSingle();

        if (data && !error) {
            document.getElementById('settings-fullname').value = data.full_name || '';
            document.getElementById('settings-phone').value = data.phone || '';
            document.getElementById('settings-address').value = data.address || '';
        }
    } catch (err) {
        console.error("خطا در بارگذاری اطلاعات پروفایل:", err);
    }
}

// ==========================================
// ذخیره و به‌روزرسانی اطلاعات شخصی
// ==========================================
async function updateProfileInfo() {
    if (!supabaseClient) return alert("خطا در اتصال به دیتابیس!");

    // بررسی لاگین بودن کاربر
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
        alert("لطفاً ابتدا وارد حساب کاربری خود شوید.");
        window.location.href = "login.html";
        return;
    }

    const fullName = document.getElementById('settings-fullname').value.trim();
    const phone = document.getElementById('settings-phone').value.trim();
    const address = document.getElementById('settings-address').value.trim();

    if (!fullName || !phone || !address) {
        alert("لطفاً تمامی فیلدها را پر کنید.");
        return;
    }

    try {
        // ثبت یا به‌روزرسانی در دیتابیس با کلید اصلی id
        const { error } = await supabaseClient
            .from('profiles')
            .upsert({
                id: user.id,
                full_name: fullName,
                phone: phone,
                address: address,
                updated_at: new Date().toISOString()
            }, { onConflict: 'id' });

        if (error) throw error;

        alert("اطلاعات شما با موفقیت ذخیره شد! ✅");
    } catch (err) {
        console.error("خطا در ثبت پروفایل:", err);
        alert("خطا در ذخیره اطلاعات: " + (err.message || "مشکلی پیش آمده است."));
    }
}

// ==========================================
// تغییر رمز عبور کاربر
// ==========================================
async function updatePassword() {
    if (!supabaseClient) return alert("خطا در اتصال به دیتابیس!");

    const newPassword = document.getElementById('settings-new-pass').value;
    if (!newPassword || newPassword.length < 6) {
        alert("رمز عبور باید حداقل ۶ کاراکتر باشد.");
        return;
    }

    try {
        const { error } = await supabaseClient.auth.updateUser({
            password: newPassword
        });

        if (error) throw error;

        alert("رمز عبور با موفقیت تغییر یافت! 🔒");
        document.getElementById('settings-new-pass').value = '';
    } catch (err) {
        console.error("خطا در تغییر رمز عبور:", err);
        alert("خطا در تغییر رمز عبور: " + err.message);
    }
}

// فراخوانی خودکار هنگام لود شدن صفحه
document.addEventListener('DOMContentLoaded', loadUserProfileData);
