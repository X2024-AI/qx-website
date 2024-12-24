// 当前登录用户信息
let currentUser = null;

// 检查登录状态
function checkAuth() {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        try {
            currentUser = JSON.parse(savedUser);
            console.log('当前用户信息:', currentUser);
            if (currentUser.avatar) {
                console.log('用户头像URL:', currentUser.avatar);
            }
            localStorage.setItem('phone', currentUser.phone); // 确保 phone 也被保存
            showUserInfo();
        } catch (error) {
            console.error('解析用户信息失败:', error);
            localStorage.removeItem('currentUser');
            showAuthModal();
        }
    } else {
        showAuthModal();
    }
}

// 显示用户信息
function showUserInfo() {
    const userInfoElement = document.querySelector('.user-info');
    if (!userInfoElement) return; // 如果元素不存在，直接返回

    userInfoElement.style.display = 'flex';
    
    const avatarElement = document.getElementById('userAvatar');
    const nicknameElement = document.getElementById('userNickname');
    const likesElement = document.getElementById('userLikes');
    const modalElement = document.getElementById('authModal');
    
    if (avatarElement && currentUser.avatar) {
        const avatarUrl = currentUser.avatar.startsWith('http') 
            ? currentUser.avatar 
            : 'http://localhost:5000' + currentUser.avatar;
        avatarElement.src = avatarUrl;
        console.log('设置头像URL:', avatarUrl);
    }
    if (nicknameElement) nicknameElement.textContent = currentUser.nickname;
    if (likesElement) likesElement.textContent = `点赞数：${currentUser.likes}`;
    if (modalElement) modalElement.style.display = 'none';
}

// 显示认证模态框
function showAuthModal() {
    const authModalElement = document.getElementById('authModal');
    if (authModalElement) authModalElement.style.display = 'block';
    const loginFormElement = document.getElementById('loginForm');
    if (loginFormElement) loginFormElement.style.display = 'block';
    const registerFormElement = document.getElementById('registerForm');
    if (registerFormElement) registerFormElement.style.display = 'none';
}

// 显示注册表单
function showRegisterForm() {
    const loginFormElement = document.getElementById('loginForm');
    if (loginFormElement) loginFormElement.style.display = 'none';
    const registerFormElement = document.getElementById('registerForm');
    if (registerFormElement) registerFormElement.style.display = 'block';
}

// 显示登录表单
function showLoginForm() {
    const loginFormElement = document.getElementById('loginForm');
    if (loginFormElement) loginFormElement.style.display = 'block';
    const registerFormElement = document.getElementById('registerForm');
    if (registerFormElement) registerFormElement.style.display = 'none';
}

// 处理登录
async function handleLogin() {
    const phone = document.getElementById('loginPhone').value;
    
    try {
        const response = await fetch('http://localhost:5000/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ phone })
        });

        if (!response.ok) {
            throw new Error('登录失败');
        }

        const user = await response.json();
        currentUser = user;
        localStorage.setItem('currentUser', JSON.stringify(user));
        localStorage.setItem('phone', user.phone); // 同时保存电话号码
        showUserInfo();
        updateLeaderboard();
    } catch (error) {
        console.error('登录出错:', error);
    }
}

// 处理注册
async function handleRegister() {
    const nickname = document.getElementById('nickname').value;
    const phone = document.getElementById('phone').value;
    const avatarFile = document.getElementById('avatar').files[0];

    if (!nickname || !phone || !avatarFile) {
        alert('请填写所有必填信息');
        return;
    }

    const formData = new FormData();
    formData.append('nickname', nickname);
    formData.append('phone', phone);
    formData.append('avatar', avatarFile);

    try {
        const response = await fetch('http://localhost:5000/api/register', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error('注册失败');
        }

        const user = await response.json();
        currentUser = user;
        localStorage.setItem('currentUser', JSON.stringify(user));
        showUserInfo();
        updateLeaderboard();
    } catch (error) {
        console.error('注册出错:', error);
    }
}

// 头像预览
document.getElementById('avatar')?.addEventListener('change', function(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const preview = document.getElementById('avatarPreview');
            if (preview) {
                preview.src = e.target.result;
                preview.style.display = 'block';
            }
        };
        reader.readAsDataURL(file);
    }
});

// 处理点赞
async function handleLike() {
    if (!currentUser) {
        showAuthModal();
        return;
    }

    try {
        const response = await fetch('http://localhost:5000/api/like', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                phone: currentUser.phone
            })
        });

        if (!response.ok) {
            throw new Error('点赞失败');
        }

        const data = await response.json();
        
        // 更新当前用户的点赞数
        currentUser.likes = data.userLikes;
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        
        // 更新所有显示点赞数的地方
        updateAllLikesDisplay(data.userLikes, data.totalLikes);
        
        // 更新排行榜
        await updateLeaderboard();
    } catch (error) {
        console.error('点赞出错:', error);
    }
}

// 更新所有显示点赞数的地方
function updateAllLikesDisplay(userLikes, totalLikes) {
    // 更新用户信息中的点赞数
    const userLikesElement = document.getElementById('userLikes');
    if (userLikesElement) {
        userLikesElement.textContent = `点赞数：${userLikes}`;
    }

    // 更新中间的总点赞数
    const likeCountElement = document.getElementById('likeCount');
    if (likeCountElement) {
        likeCountElement.textContent = totalLikes;
    }

    // 更新右上角的点赞数显示
    const headerLikesElement = document.querySelector('.user-likes');
    if (headerLikesElement) {
        headerLikesElement.textContent = `点赞数：${userLikes}`;
    }
}

// 更新排行榜
async function updateLeaderboard() {
    try {
        const response = await fetch('http://localhost:5000/api/leaderboard');
        const leaderboard = await response.json();
        
        const leaderboardElement = document.getElementById('leaderboardList');
        if (!leaderboardElement) {
            console.error('找不到排行榜元素');
            return;
        }

        leaderboardElement.innerHTML = leaderboard.map((user, index) => `
            <div class="leaderboard-item">
                <span class="rank">${index + 1}</span>
                <img class="leaderboard-avatar" src="${user.avatar || '/uploads/default-avatar.png'}" alt="头像">
                <span class="nickname">${user.nickname}</span>
                <span class="likes">${user.likes} 赞</span>
            </div>
        `).join('');

        // 同时更新总点赞数
        await updateTotalLikes();
    } catch (error) {
        console.error('更新排行榜失败:', error);
    }
}

// 初始化
document.addEventListener('DOMContentLoaded', async () => {
    checkAuth();
    updateLeaderboard();
    await updateTotalLikes();
});

// 更新总点赞数
async function updateTotalLikes() {
    try {
        const response = await fetch('http://localhost:5000/api/likes');
        const data = await response.json();
        const likeCountElement = document.getElementById('likeCount');
        if (likeCountElement) {
            likeCountElement.textContent = data.totalLikes;
        }
    } catch (error) {
        console.error('获取总点赞数失败:', error);
    }
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
    const carousels = document.querySelectorAll('.carousel');
    carousels.forEach(carousel => new Carousel(carousel));
});

// 添加评论功能
async function addComment(imageId, content) {
    try {
        const response = await fetch('/api/comments', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ imageId, content })
        });
        const data = await response.json();
        updateCommentsList(data);
    } catch (error) {
        console.error('评论出错:', error);
    }
}

// 图片上传功能
async function uploadImage(formData) {
    try {
        const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData
        });
        const data = await response.json();
        updateGallery(data);
    } catch (error) {
        console.error('上传出错:', error);
    }
}

// 头像更新相关函数
function showAvatarModal() {
    document.getElementById('avatarUpdateModal').style.display = 'block';
    document.getElementById('newAvatarPreview').style.display = 'none';
}

function closeAvatarModal() {
    document.getElementById('avatarUpdateModal').style.display = 'none';
}

// 为头像添加点击事件
document.getElementById('userAvatar').addEventListener('click', showAvatarModal);

// 预览新头像
document.getElementById('newAvatar').addEventListener('change', function(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const preview = document.getElementById('newAvatarPreview');
            preview.src = e.target.result;
            preview.style.display = 'block';
        };
        reader.readAsDataURL(file);
    }
});

// 处理头像更新
async function handleAvatarUpdate() {
    const fileInput = document.getElementById('newAvatar');
    const file = fileInput.files[0];
    
    if (!file) {
        alert('请选择一张图片');
        return;
    }

    const phone = localStorage.getItem('phone');
    if (!phone) {
        alert('请先登录');
        return;
    }

    const formData = new FormData();
    formData.append('avatar', file);
    formData.append('phone', phone);

    try {
        const response = await fetch('http://localhost:5000/api/update-avatar', {
            method: 'POST',
            body: formData
        });

        if (response.ok) {
            const result = await response.json();
            console.log('头像更新响应:', result);
            
            // 更新页面上的头像
            const userAvatar = document.getElementById('userAvatar');
            if (userAvatar) {
                const newAvatarUrl = 'http://localhost:5000' + result.avatarUrl;
                userAvatar.src = newAvatarUrl + '?t=' + new Date().getTime();
                console.log('设置新头像URL:', newAvatarUrl);
            }

            // 更新本地存储的用户信息
            if (result.user) {
                currentUser = result.user;
                localStorage.setItem('currentUser', JSON.stringify(result.user));
                console.log('更新本地用户信息:', result.user);
            }

            closeAvatarModal();
            alert('头像更新成功！');
        } else {
            const errorData = await response.json();
            alert(errorData.error || '头像更新失败，请重试');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('发生错误，请重试');
    }
}
