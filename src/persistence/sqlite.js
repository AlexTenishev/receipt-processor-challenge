const sqlite3 = require('sqlite3').verbose();
// const fs = require('fs');
const location = ":memory:"; // process.env.SQLITE_DB_LOCATION || '/etc/todos/todo.db';
let db;

function init() {
    return new Promise((resolve, reject) => {
        const createTables = [
`CREATE TABLE IF NOT EXISTS receipts (
    id varchar(36) NOT NULL PRIMARY KEY,
    retailer varchar(1024),
    purchaseDate DATE NOT NULL,
    items_count INTEGER NOT NULL,
    total FLOAT NOT NULL,
    points INTEGER DEFAULT NULL
);`,
`CREATE TABLE IF NOT EXISTS receipt_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    receipt_id varchar(36) NOT NULL,
    shortDescription varchar(1024) NOT NULL,
    price FLOAT NOT NULL,
    UNIQUE(id,receipt_id)
);`
        ];
        db = new sqlite3.Database(location, err => {
            if (err) { return reject(err); }

            let resolved = 0;
            for( const sqlCreate of createTables ) {
                db.run(sqlCreate, (err, result) => {
                    if (err) {
                        return reject(err);
                    }
                    ++resolved;
                    if( createTables.length == resolved ) {
                        resolve(result);
                    }
                });
            }
        });
    });
}

async function teardown() {
    return new Promise((resolve, reject) => {
        db.close(err => {
            if (err) {
                reject(err);
            }
            else {
                resolve();
            }
        });
    });
}

async function storeReceipt(item) {
    return new Promise(async (resolve, reject) => {
        const valueTemplate = '(?, ?, ?)';
        let sql_buffer = [`INSERT INTO receipt_items (receipt_id, shortDescription, price) VALUES `];
        let values = [], is_first = true;
        for( const receipt_item of item.items) {
            if( is_first ) {
                is_first = false;
            } else {
                sql_buffer.push(',');
            }
            sql_buffer.push(` ${valueTemplate}`);
            values.push(item.id);
            values.push(receipt_item.shortDescription);
            values.push(receipt_item.price);
        }
        const sql = sql_buffer.join('');
        // callback hell goes here
        db.run('BEGIN TRANSACTION',()=> {
            db.run(
                'INSERT INTO receipts (id, retailer, purchaseDate, items_count, total, points) VALUES (?, ?, ?, ?, ?, null)',
                    [item.id, item.retailer, item.purchaseDate, item.items.length, item.total],
                    err => {
                        if (err) { return reject(err); }
                    }
                , () => {
                    db.run(sql, values, err => { if (err) { return reject(err); } }, () => {
                        db.run('COMMIT', () => { 
                            resolve(item); 
                        });
                    });
                });
        });
    });

}

async function getReceipt(receiptId) {
    return new Promise(async(resolve, rej) => {
        const item = await getReceiptInner(receiptId);
        const items = await getReceiptItemsInner(item.id);
        resolve(Object.assign(item, items));
    });
}

async function getReceiptInner(receiptId) {
    return new Promise((resolve, reject) => {
        db.get('SELECT * FROM receipts WHERE id=?', [receiptId], (err, row) => {
            if (err) {
                return reject(err);
            }
            if( row == null || row.length == 0 ) {
                return reject(new Error(`Empty record for id: ${receiptId}`));
            }
            const localizedDate = new Date(row.purchaseDate).toLocaleDateString('en-US', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                hour12: false,
            });
            const localizedDateParts = localizedDate.split(',')[0].split('/');
            const item = Object.assign({}, row, { purchaseDate: 
                `${localizedDateParts[2]}-${localizedDateParts[0]}-${localizedDateParts[1]}`, purchaseTime: localizedDate.slice(12), total: ""+row.total });
            resolve(item);
        });
    });
}

async function getReceiptItemsInner(receiptId) {
    return new Promise((resolve, reject) => {
        db.all('SELECT * FROM receipt_items WHERE receipt_id=?', [receiptId], (err, rows) => {
            if (err) {
                return reject(err);
            }
            const item = { items: rows.map((row) => 
                Object.assign({shortDescription: row.shortDescription, price: row.price.toFixed(2)})) 
            };
            resolve(item);
        });
    });
}

async function updateReceiptPoints(id, points) {
    return new Promise((resolve, reject) => {
        db.run(
            'UPDATE receipts SET points=? WHERE id=?',
            [points, id],
            err => {
                if (err) { return reject(err); }
                resolve();
            },
        );
    });
} 

module.exports = {
    init,
    teardown,
    storeReceipt,
    getReceipt,
    updateReceiptPoints,
};
