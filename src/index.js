const express = require('express');
const app = express();
const db = require('./persistence');

const receiptProcess = require('./routes/receiptProcess');
const receiptPoints = require('./routes/receiptPoints');
  
app.use(express.json());
app.post('/receipts/process', receiptProcess);
app.get('/receipts/:id/points', receiptPoints);

db.init().then(() => {
    app.listen(3000, () => console.log('Listening on port 3000'));
}).catch((err) => {
    console.error(err);
    process.exit(1);
});

const gracefulShutdown = () => {
    db.teardown()
        .catch(() => {})
        .then(() => process.exit());
};

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);
process.on('SIGUSR2', gracefulShutdown); // Sent by nodemon
