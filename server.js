// Local development entry: `npm start`
const app = require('./app');
const connectDB = require('./db');

const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => {
    console.log('MongoDB connected');
    app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  });
