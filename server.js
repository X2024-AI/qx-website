console.log('正在启动服务器...');
const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();

// 启用静态文件服务
app.use(express.static(__dirname));
app.use(express.json());

// 添加路由日志中间件
app.use((req, res, next) => {
    console.log(`收到请求: ${req.method} ${req.url}`);
    next();
});

// 添加根路由处理
app.get('/', (req, res) => {
    console.log('收到首页请求');
    res.sendFile(path.join(__dirname, 'index.html'));
});

// 存储点击数的文件路径
const LIKES_FILE = 'likes.json';

// 确保likes.json文件存在
if (!fs.existsSync(LIKES_FILE)) {
    fs.writeFileSync(LIKES_FILE, JSON.stringify({ likes: 0 }));
    console.log('创建了新的 likes.json 文件');
} else {
    console.log('likes.json 文件已存在');
}

// 获取当前点击数
app.get('/api/likes', (req, res) => {
    console.log('收到获取点击数请求');
    const data = JSON.parse(fs.readFileSync(LIKES_FILE));
    console.log('当前点击数:', data);
    res.json(data);
});

// 更新点击数
app.post('/api/likes', (req, res) => {
    console.log('收到更新点击数请求');
    const data = JSON.parse(fs.readFileSync(LIKES_FILE));
    data.likes += 1;
    fs.writeFileSync(LIKES_FILE, JSON.stringify(data));
    console.log('更新后的点击数:', data);
    res.json(data);
});

const PORT = 3001;
app.listen(PORT, () => {
    console.log(`服务器启动成功，监听端口 ${PORT}`);
    console.log(`请在浏览器中访问 http://localhost:${PORT}`);
});

// 添加错误处理
app.use((err, req, res, next) => {
    console.error('发生错误:', err);
    res.status(500).send('服务器错误');
}); 