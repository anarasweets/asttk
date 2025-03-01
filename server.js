const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Подключение к MongoDB
mongoose.connect('mongodb://localhost:27017/productionDB', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

// Модель для сырья
const RawMaterialSchema = new mongoose.Schema({
    name: String,
    unit: String,
    price: Number,
});

const RawMaterial = mongoose.model('RawMaterial', RawMaterialSchema);

// API для работы с сырьем

// Получить все сырье
app.get('/api/raw-materials', async (req, res) => {
    try {
        const materials = await RawMaterial.find();
        res.json(materials);
    } catch (error) {
        res.status(500).json({ message: 'Ошибка при получении данных' });
    }
});

// Добавить новое сырье
app.post('/api/raw-materials', async (req, res) => {
    const { name, unit, price } = req.body;
    const newMaterial = new RawMaterial({ name, unit, price });

    try {
        await newMaterial.save();
        res.status(201).json(newMaterial);
    } catch (error) {
        res.status(500).json({ message: 'Ошибка при сохранении данных' });
    }
});

// Удалить сырье
app.delete('/api/raw-materials/:id', async (req, res) => {
    try {
        await RawMaterial.findByIdAndDelete(req.params.id);
        res.json({ message: 'Сырье удалено' });
    } catch (error) {
        res.status(500).json({ message: 'Ошибка при удалении данных' });
    }
});

// Запуск сервера
app.listen(PORT, () => {
    console.log(`Сервер запущен на http://localhost:${PORT}`);
});