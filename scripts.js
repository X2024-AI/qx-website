let likeCount = 0;

function handleLike() {
    likeCount++;
    document.getElementById('likeCount').textContent = likeCount;
}

// 轮播图功能
class Carousel {
    constructor(element) {
        this.carousel = element;
        this.track = element.querySelector('.carousel-track');
        this.slides = Array.from(this.track.children);
        this.nextButton = element.querySelector('.carousel-button.next');
        this.prevButton = element.querySelector('.carousel-button.prev');
        this.dotsContainer = element.querySelector('.carousel-dots');
        this.currentSlide = 0;

        this.createDots();
        this.updateDots();
        this.addEventListeners();
        this.startAutoPlay();
    }

    createDots() {
        this.slides.forEach((_, index) => {
            const dot = document.createElement('div');
            dot.classList.add('carousel-dot');
            dot.addEventListener('click', () => this.goToSlide(index));
            this.dotsContainer.appendChild(dot);
        });
    }

    updateDots() {
        const dots = this.dotsContainer.children;
        Array.from(dots).forEach((dot, index) => {
            dot.classList.toggle('active', index === this.currentSlide);
        });
    }

    goToSlide(index) {
        this.currentSlide = index;
        this.track.style.transform = `translateX(-${index * 100}%)`;
        this.updateDots();
    }

    nextSlide() {
        this.currentSlide = (this.currentSlide + 1) % this.slides.length;
        this.goToSlide(this.currentSlide);
    }

    prevSlide() {
        this.currentSlide = (this.currentSlide - 1 + this.slides.length) % this.slides.length;
        this.goToSlide(this.currentSlide);
    }

    addEventListeners() {
        this.nextButton.addEventListener('click', () => this.nextSlide());
        this.prevButton.addEventListener('click', () => this.prevSlide());
    }

    startAutoPlay() {
        setInterval(() => this.nextSlide(), 5000);
    }
}

// 页面加载完成后初始化轮播图
document.addEventListener('DOMContentLoaded', () => {
    // 初始化所有轮播图
    const carousels = document.querySelectorAll('.carousel');
    carousels.forEach(carousel => new Carousel(carousel));
});
