
// Toloni Pescarias - Main JavaScript

// Notification System
function showNotification(message, type = 'info', duration = 5000) {
    const container = document.getElementById('notification-container');
    if (!container) return;
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="d-flex justify-content-between align-items-center">
            <span>${message}</span>
            <button type="button" class="btn-close btn-close-white ms-2" onclick="this.parentElement.parentElement.remove()"></button>
        </div>
    `;
    
    container.appendChild(notification);
    
    // Show notification
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    // Auto remove
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 300);
    }, duration);
}

// Form Validation
function validateForm(form) {
    const inputs = form.querySelectorAll('input[required], textarea[required], select[required]');
    let isValid = true;
    
    inputs.forEach(input => {
        const value = input.value.trim();
        const parent = input.closest('.mb-3') || input.parentElement;
        
        // Remove existing error messages
        const existingError = parent.querySelector('.invalid-feedback');
        if (existingError) {
            existingError.remove();
        }
        
        input.classList.remove('is-invalid');
        
        if (!value) {
            input.classList.add('is-invalid');
            const errorDiv = document.createElement('div');
            errorDiv.className = 'invalid-feedback';
            errorDiv.textContent = 'Este campo é obrigatório';
            parent.appendChild(errorDiv);
            isValid = false;
        } else if (input.type === 'email' && !isValidEmail(value)) {
            input.classList.add('is-invalid');
            const errorDiv = document.createElement('div');
            errorDiv.className = 'invalid-feedback';
            errorDiv.textContent = 'Email inválido';
            parent.appendChild(errorDiv);
            isValid = false;
        }
    });
    
    return isValid;
}

function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// Image Upload Preview
function setupImagePreview(inputId, previewId) {
    const input = document.getElementById(inputId);
    const preview = document.getElementById(previewId);
    
    if (!input || !preview) return;
    
    input.addEventListener('change', function(e) {
        const files = e.target.files;
        preview.innerHTML = '';
        
        if (files.length === 0) return;
        
        Array.from(files).forEach(file => {
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    const img = document.createElement('img');
                    img.src = e.target.result;
                    img.className = 'img-thumbnail me-2 mb-2';
                    img.style.maxWidth = '150px';
                    img.style.maxHeight = '150px';
                    preview.appendChild(img);
                };
                reader.readAsDataURL(file);
            }
        });
    });
}

// Lazy Loading for Images
function setupLazyLoading() {
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.classList.remove('lazy');
                    imageObserver.unobserve(img);
                }
            });
        });
        
        document.querySelectorAll('img[data-src]').forEach(img => {
            imageObserver.observe(img);
        });
    }
}

// Search functionality
function setupSearch(inputId, resultsId, searchUrl) {
    const input = document.getElementById(inputId);
    const results = document.getElementById(resultsId);
    
    if (!input || !results) return;
    
    let searchTimeout;
    
    input.addEventListener('input', function() {
        clearTimeout(searchTimeout);
        const query = this.value.trim();
        
        if (query.length < 2) {
            results.innerHTML = '';
            return;
        }
        
        searchTimeout = setTimeout(() => {
            fetch(`${searchUrl}?q=${encodeURIComponent(query)}`)
                .then(response => response.json())
                .then(data => {
                    displaySearchResults(data, results);
                })
                .catch(error => {
                    console.error('Search error:', error);
                    results.innerHTML = '<div class="alert alert-danger">Erro na busca</div>';
                });
        }, 300);
    });
}

function displaySearchResults(data, container) {
    if (!data || data.length === 0) {
        container.innerHTML = '<div class="alert alert-info">Nenhum resultado encontrado</div>';
        return;
    }
    
    let html = '<div class="list-group">';
    data.forEach(item => {
        html += `
            <a href="${item.url}" class="list-group-item list-group-item-action">
                <div class="d-flex w-100 justify-content-between">
                    <h6 class="mb-1">${item.title}</h6>
                    <small>${item.type}</small>
                </div>
                <p class="mb-1">${item.description}</p>
            </a>
        `;
    });
    html += '</div>';
    
    container.innerHTML = html;
}

// Auto-save functionality for forms
function setupAutoSave(formId, saveUrl, interval = 30000) {
    const form = document.getElementById(formId);
    if (!form) return;
    
    setInterval(() => {
        const formData = new FormData(form);
        formData.append('auto_save', '1');
        
        fetch(saveUrl, {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                console.log('Auto-save successful');
            }
        })
        .catch(error => {
            console.error('Auto-save error:', error);
        });
    }, interval);
}

// Infinite scroll
function setupInfiniteScroll(containerId, loadUrl, page = 1) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    let loading = false;
    let currentPage = page;
    
    function loadMore() {
        if (loading) return;
        loading = true;
        
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'text-center py-3';
        loadingDiv.innerHTML = '<div class="loading"></div> Carregando...';
        container.appendChild(loadingDiv);
        
        fetch(`${loadUrl}?page=${currentPage + 1}`)
            .then(response => response.json())
            .then(data => {
                loadingDiv.remove();
                
                if (data.html) {
                    container.insertAdjacentHTML('beforeend', data.html);
                    currentPage++;
                }
                
                loading = false;
                
                if (!data.hasMore) {
                    window.removeEventListener('scroll', checkScroll);
                }
            })
            .catch(error => {
                console.error('Load more error:', error);
                loadingDiv.remove();
                loading = false;
            });
    }
    
    function checkScroll() {
        if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 1000) {
            loadMore();
        }
    }
    
    window.addEventListener('scroll', checkScroll);
}

// Dark mode toggle
function setupDarkMode() {
    const toggle = document.getElementById('darkModeToggle');
    if (!toggle) return;
    
    const isDark = localStorage.getItem('darkMode') === 'true';
    
    if (isDark) {
        document.body.classList.add('dark-mode');
        toggle.checked = true;
    }
    
    toggle.addEventListener('change', function() {
        if (this.checked) {
            document.body.classList.add('dark-mode');
            localStorage.setItem('darkMode', 'true');
        } else {
            document.body.classList.remove('dark-mode');
            localStorage.setItem('darkMode', 'false');
        }
    });
}

// Initialize everything when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Setup lazy loading
    setupLazyLoading();
    
    // Setup dark mode
    setupDarkMode();
    
    // Form validation on submit
    document.querySelectorAll('form').forEach(form => {
        form.addEventListener('submit', function(e) {
            if (!validateForm(this)) {
                e.preventDefault();
                showNotification('Por favor, corrija os erros no formulário', 'error');
            }
        });
    });
    
    // Setup image previews
    setupImagePreview('images', 'imagePreview');
    setupImagePreview('profileImage', 'profileImagePreview');
    
    // Tooltip initialization
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
    
    // Popover initialization
    const popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'));
    popoverTriggerList.map(function (popoverTriggerEl) {
        return new bootstrap.Popover(popoverTriggerEl);
    });
    
    // Auto-hide alerts after 5 seconds
    document.querySelectorAll('.alert:not(.alert-permanent)').forEach(alert => {
        setTimeout(() => {
            const bsAlert = new bootstrap.Alert(alert);
            bsAlert.close();
        }, 5000);
    });
    
    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });
});

// Service Worker registration for PWA support
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        navigator.serviceWorker.register('/sw.js')
            .then(function(registration) {
                console.log('ServiceWorker registration successful');
            })
            .catch(function(err) {
                console.log('ServiceWorker registration failed: ', err);
            });
    });
}

// Export functions for use in other scripts
window.ToloniUtils = {
    showNotification,
    validateForm,
    setupImagePreview,
    setupSearch,
    setupAutoSave,
    setupInfiniteScroll
};
