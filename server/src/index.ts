import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
    res.json({ status: 'ok', message: 'Uposatha API server is running' });
});

app.listen(PORT as number, '0.0.0.0', () => {
    console.log(`Uposatha API Server running on port ${PORT}`);
});
