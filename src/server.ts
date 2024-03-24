import dotenv from 'dotenv';
import app from './app';
dotenv.config();

const PORT = (process.env.PORT && parseInt(process.env.PORT)) || 4000;
const HOST = process.env.HOST || 'localhost';

app.listen(PORT, HOST, () => {
    console.log(`Server is running on ${HOST}:${PORT}`);
});
