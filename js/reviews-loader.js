// Load and display all reviews dynamically
(function () {
    async function loadReviews() {
        try {
            const response = await fetch('/data/reviews.json');
            const reviews = await response.json();
            const container = document.getElementById('reviews-grid');

            if (!container) return;

            container.innerHTML = reviews.map(review => {
                const initials = review.author.split(' ').map(n => n[0]).join('');
                const stars = '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating);

                return `
          <div class="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
            <div class="flex items-center justify-between mb-4">
              <div class="flex items-center space-x-4">
                <div class="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-xl">
                  ${initials}
                </div>
                <div>
                  <h3 class="font-bold text-gray-900">${review.author}</h3>
                  <p class="text-xs text-gray-500">${review.date}</p>
                </div>
              </div>
              <i data-feather="quote" class="w-8 h-8 text-blue-200"></i>
            </div>
            <div class="flex mb-3 text-yellow-500 text-lg">
              ${stars}
            </div>
            <p class="text-gray-700 leading-relaxed italic">"${review.text}"</p>
          </div>
        `;
            }).join('');

            // Replace feather icons
            if (window.feather) feather.replace();
        } catch (error) {
            console.error('Error loading reviews:', error);
            const container = document.getElementById('reviews-grid');
            if (container) {
                container.innerHTML = '<p class="text-center text-gray-600 col-span-full">Помилка завантаження відгуків. Будь ласка, оновіть сторінку.</p>';
            }
        }
    }

    // Load reviews when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadReviews);
    } else {
        loadReviews();
    }
})();
