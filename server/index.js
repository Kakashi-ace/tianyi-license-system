const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

app.use('/api/public', require('./routes/public'));
app.use('/api/license', require('./routes/license'));
app.use('/api/admin', require('./routes/admin'));

app.get('/', (req, res) => {
  res.json({
    name: 'TianYi AI License System API',
    version: '2.0.0',
    status: 'running',
    time: new Date().toISOString()
  });
});

app.use((err, req, res, next) => {
  res.status(500).json({ success: false, message: '服务器内部错误: ' + err.message });
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
