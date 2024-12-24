console.log('正在启动服务器...');
const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const app = express();

// 配置文件上传
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, 'uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // 获取文件扩展名
        const ext = path.extname(file.originalname);
        // 生成唯一的文件名
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + ext);
    }
});

const upload = multer({ storage: storage });

// 启用静态文件服务
app.use(express.static(path.join(__dirname)));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.json());

// 添加 CORS 中间件
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    
    // 处理 OPTIONS 请求
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

// 数据文件路径
const USERS_FILE = 'users.json';
const LIKES_FILE = 'likes.json';

// 初始化数据文件
function initDataFiles() {
    if (!fs.existsSync(USERS_FILE)) {
        fs.writeFileSync(USERS_FILE, JSON.stringify([]));
    }
    if (!fs.existsSync(LIKES_FILE)) {
        fs.writeFileSync(LIKES_FILE, JSON.stringify({ totalLikes: 0 }));
    }
}

// 初始化数据文件
initDataFiles();

// 用户注册
app.post('/api/register', upload.single('avatar'), (req, res) => {
    try {
        const { nickname, phone } = req.body;
        const users = JSON.parse(fs.readFileSync(USERS_FILE));
        
        // 检查手机号是否已注册
        if (users.some(user => user.phone === phone)) {
            return res.status(400).json({ error: '该手机号已注册' });
        }

        const newUser = {
            id: Date.now().toString(),
            nickname,
            phone,
            avatar: req.file ? `/uploads/${req.file.filename}` : null,
            likes: 0,
            createdAt: new Date().toISOString()
        };

        users.push(newUser);
        fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
        res.status(201).json(newUser);
    } catch (error) {
        console.error('注册失败:', error);
        res.status(500).json({ error: '注册失败' });
    }
});

// 用户登录
app.post('/api/login', (req, res) => {
    try {
        const { phone } = req.body;
        const users = JSON.parse(fs.readFileSync(USERS_FILE));
        const user = users.find(u => u.phone === phone);

        if (!user) {
            return res.status(404).json({ error: '用户不存在' });
        }

        // 确保头像URL正确
        if (user.avatar && !user.avatar.startsWith('http')) {
            user.avatar = `http://localhost:5000${user.avatar}`;
        }

        res.json(user);
    } catch (error) {
        console.error('登录失败:', error);
        res.status(500).json({ error: '登录失败' });
    }
});

// 获取点赞排行榜
app.get('/api/leaderboard', (req, res) => {
    try {
        const users = JSON.parse(fs.readFileSync(USERS_FILE));
        const leaderboard = users
            .sort((a, b) => b.likes - a.likes)
            .slice(0, 10)
            .map(({ nickname, likes, avatar }) => {
                // 确保头像URL是完整的
                const fullAvatarUrl = avatar && !avatar.startsWith('http') 
                    ? `http://localhost:5000${avatar}` 
                    : avatar;
                return { 
                    nickname, 
                    likes, 
                    avatar: fullAvatarUrl 
                };
            });
        res.json(leaderboard);
    } catch (error) {
        console.error('获取排行榜失败:', error);
        res.status(500).json({ error: '获取排行榜失败' });
    }
});

// 获取总点赞数
app.get('/api/likes', (req, res) => {
    try {
        const likesData = JSON.parse(fs.readFileSync(LIKES_FILE));
        res.json({ totalLikes: likesData.totalLikes });
    } catch (error) {
        console.error('获取总点赞数失败:', error);
        res.status(500).json({ error: '获取总点赞数失败' });
    }
});

// 更新用户点赞数
app.post('/api/like', (req, res) => {
    try {
        const { phone } = req.body;
        
        // 读取用户数据
        const users = JSON.parse(fs.readFileSync(USERS_FILE));
        const userIndex = users.findIndex(u => u.phone === phone);

        if (userIndex === -1) {
            return res.status(404).json({ error: '用户不存在' });
        }

        // 更新用户点赞数
        users[userIndex].likes += 1;
        fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
        
        // 计算总点赞数
        const totalLikes = users.reduce((sum, user) => sum + user.likes, 0);
        
        // 更新总点赞数文件
        const likesData = { totalLikes };
        fs.writeFileSync(LIKES_FILE, JSON.stringify(likesData, null, 2));

        // 返回更新后的数据
        res.json({ 
            userLikes: users[userIndex].likes,
            totalLikes: totalLikes
        });
    } catch (error) {
        console.error('更新点赞数失败:', error);
        res.status(500).json({ error: '更新点赞数失败' });
    }
});

// 更新头像的路由
app.post('/api/update-avatar', upload.single('avatar'), (req, res) => {
    console.log('收到更新头像请求:', { body: req.body, file: req.file });
    
    try {
        const { phone } = req.body;
        const avatarFile = req.file;

        if (!phone || !avatarFile) {
            console.log('缺少参数:', { phone, hasFile: !!avatarFile });
            return res.status(400).json({ error: '缺少必要参数' });
        }

        // 读取用户数据
        const usersData = JSON.parse(fs.readFileSync('users.json', 'utf8'));
        const user = usersData.find(u => u.phone === phone);

        if (!user) {
            console.log('用户不存在:', phone);
            return res.status(404).json({ error: '用户不存在' });
        }

        // 更新用户头像
        const avatarUrl = path.join('/uploads', avatarFile.filename).replace(/\\/g, '/');
        user.avatar = avatarUrl;
        fs.writeFileSync('users.json', JSON.stringify(usersData, null, 2));

        console.log('头像更新成功:', { phone, avatarUrl });
        
        // 返回完整的用户信息
        res.json({
            message: '头像更新成功',
            avatarUrl: avatarUrl,
            user: user
        });
    } catch (error) {
        console.error('更新头像时出错:', error);
        res.status(500).json({ error: '服务器错误' });
    }
});

// 添加根路由处理
app.get('/', (req, res) => {
    console.log('收到首页请求');
    res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = 5000;
app.listen(PORT, () => {
    console.log(`服务器启动成功，监听端口 ${PORT}`);
});