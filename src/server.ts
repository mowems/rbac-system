import app from './app';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 5002;

// app.listen(PORT, () => {
//   console.log(`Server running on http://localhost:${PORT}`);
// });

app.listen(5002, '0.0.0.0', () => console.log("Server running on http://0.0.0.0:5002"));


