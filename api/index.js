import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.log('WARNING: MONGODB_URI is not set. Server will start but database operations will fail.');
} else {
  // Connect to MongoDB
  mongoose.connect(MONGODB_URI)
    .then(() => {
      console.log('Connected to MongoDB Atlas');
      seedDatabase(); // Seed if database is empty
    })
    .catch(err => {
      console.error('MongoDB connection error:', err);
    });
}

// Define Schemas
const Wallet = mongoose.model('Wallet', new mongoose.Schema({
  id: { type: String, default: () => crypto.randomUUID(), unique: true },
  name: { type: String, required: true },
  type: { type: String, required: true },
  balance: { type: Number, required: true },
  color: { type: String, required: true },
  order: { type: Number, default: 0 }
}, { timestamps: true }));

const Transaction = mongoose.model('Transaction', new mongoose.Schema({
  id: { type: String, default: () => crypto.randomUUID(), unique: true },
  type: { type: String, required: true },
  amount: { type: Number, required: true },
  category: { type: String, required: true },
  walletId: { type: String, required: true },
  destinationWalletId: { type: String },
  date: { type: String, required: true },
  description: { type: String }
}, { timestamps: true }));

const Debt = mongoose.model('Debt', new mongoose.Schema({
  id: { type: String, default: () => crypto.randomUUID(), unique: true },
  borrower: { type: String, required: true },
  amount: { type: Number, required: true },
  originalAmount: { type: Number },
  walletId: { type: String, required: true },
  date: { type: String, required: true },
  description: { type: String },
  status: { type: String, default: 'pending' },
  type: { type: String, required: true, default: 'loan' },
  repayments: [{
    id: String,
    amount: Number,
    date: String,
    walletId: String
  }]
}, { timestamps: true }));

const Asset = mongoose.model('Asset', new mongoose.Schema({
  id: { type: String, default: () => crypto.randomUUID(), unique: true },
  name: { type: String, required: true },
  unit: { type: String, required: true },
  quantity: { type: Number, required: true },
  valuePerUnit: { type: Number, required: true },
  purchasePricePerUnit: { type: Number, required: true },
  date: { type: String, required: true },
  description: { type: String },
  color: { type: String, required: true }
}, { timestamps: true }));

const Category = mongoose.model('Category', new mongoose.Schema({
  id: { type: String, default: () => crypto.randomUUID(), unique: true },
  name: { type: String, required: true },
  type: { type: String, required: true },
  icon: { type: String }
}, { timestamps: true }));

// Seeding function (reads db.json and uploads data if MongoDB collection is empty)
async function seedDatabase() {
  try {
    const dbPath = path.resolve('db.json');
    if (!fs.existsSync(dbPath)) return;
    const rawData = fs.readFileSync(dbPath, 'utf8');
    const localData = JSON.parse(rawData);

    // Seed Wallets
    if ((await Wallet.countDocuments()) === 0 && localData.wallets) {
      console.log('Seeding wallets...');
      await Wallet.insertMany(localData.wallets);
    }
    // Seed Transactions
    if ((await Transaction.countDocuments()) === 0 && localData.transactions) {
      console.log('Seeding transactions...');
      await Transaction.insertMany(localData.transactions);
    }
    // Seed Debts
    if ((await Debt.countDocuments()) === 0 && localData.debts) {
      console.log('Seeding debts...');
      await Debt.insertMany(localData.debts);
    }
    // Seed Assets
    if ((await Asset.countDocuments()) === 0 && localData.assets) {
      console.log('Seeding assets...');
      await Asset.insertMany(localData.assets);
    }
    // Seed Categories
    if ((await Category.countDocuments()) === 0 && localData.categories) {
      console.log('Seeding categories...');
      await Category.insertMany(localData.categories);
    }
    console.log('Database seeding/migration check complete.');
  } catch (err) {
    console.error('Error seeding/migrating data from db.json:', err);
  }
}

// REST API Endpoints

// Wallets
app.get('/wallets', async (req, res) => {
  try { res.json(await Wallet.find()); } catch (err) { res.status(500).json({ error: err.message }); }
});
app.post('/wallets', async (req, res) => {
  try { res.status(201).json(await Wallet.create(req.body)); } catch (err) { res.status(500).json({ error: err.message }); }
});
app.patch('/wallets/:id', async (req, res) => {
  try { res.json(await Wallet.findOneAndUpdate({ id: req.params.id }, req.body, { new: true })); } catch (err) { res.status(500).json({ error: err.message }); }
});
app.delete('/wallets/:id', async (req, res) => {
  try { await Wallet.deleteOne({ id: req.params.id }); res.sendStatus(204); } catch (err) { res.status(500).json({ error: err.message }); }
});

// Transactions
app.get('/transactions', async (req, res) => {
  try { res.json(await Transaction.find()); } catch (err) { res.status(500).json({ error: err.message }); }
});
app.post('/transactions', async (req, res) => {
  try { res.status(201).json(await Transaction.create(req.body)); } catch (err) { res.status(500).json({ error: err.message }); }
});
app.put('/transactions/:id', async (req, res) => {
  try { res.json(await Transaction.findOneAndUpdate({ id: req.params.id }, req.body, { new: true })); } catch (err) { res.status(500).json({ error: err.message }); }
});
app.delete('/transactions/:id', async (req, res) => {
  try { await Transaction.deleteOne({ id: req.params.id }); res.sendStatus(204); } catch (err) { res.status(500).json({ error: err.message }); }
});

// Debts
app.get('/debts', async (req, res) => {
  try { res.json(await Debt.find()); } catch (err) { res.status(500).json({ error: err.message }); }
});
app.post('/debts', async (req, res) => {
  try { res.status(201).json(await Debt.create(req.body)); } catch (err) { res.status(500).json({ error: err.message }); }
});
app.patch('/debts/:id', async (req, res) => {
  try { res.json(await Debt.findOneAndUpdate({ id: req.params.id }, req.body, { new: true })); } catch (err) { res.status(500).json({ error: err.message }); }
});
app.delete('/debts/:id', async (req, res) => {
  try { await Debt.deleteOne({ id: req.params.id }); res.sendStatus(204); } catch (err) { res.status(500).json({ error: err.message }); }
});

// Assets
app.get('/assets', async (req, res) => {
  try { res.json(await Asset.find()); } catch (err) { res.status(500).json({ error: err.message }); }
});
app.post('/assets', async (req, res) => {
  try { res.status(201).json(await Asset.create(req.body)); } catch (err) { res.status(500).json({ error: err.message }); }
});
app.patch('/assets/:id', async (req, res) => {
  try { res.json(await Asset.findOneAndUpdate({ id: req.params.id }, req.body, { new: true })); } catch (err) { res.status(500).json({ error: err.message }); }
});
app.delete('/assets/:id', async (req, res) => {
  try { await Asset.deleteOne({ id: req.params.id }); res.sendStatus(204); } catch (err) { res.status(500).json({ error: err.message }); }
});

// Categories
app.get('/categories', async (req, res) => {
  try { res.json(await Category.find()); } catch (err) { res.status(500).json({ error: err.message }); }
});
app.post('/categories', async (req, res) => {
  try { res.status(201).json(await Category.create(req.body)); } catch (err) { res.status(500).json({ error: err.message }); }
});
app.patch('/categories/:id', async (req, res) => {
  try { res.json(await Category.findOneAndUpdate({ id: req.params.id }, req.body, { new: true })); } catch (err) { res.status(500).json({ error: err.message }); }
});
app.delete('/categories/:id', async (req, res) => {
  try { await Category.deleteOne({ id: req.params.id }); res.sendStatus(204); } catch (err) { res.status(500).json({ error: err.message }); }
});

// Auto-update Gold Prices Scraper Endpoint
app.post('/api/update-gold-prices', async (req, res) => {
  try {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    console.log('Fetching gold prices from Bao Tin Manh Hai...');
    const fetchRes = await fetch('https://baotinmanhhai.vn/vi/bang-gia-vang');
    if (!fetchRes.ok) throw new Error(`HTTP error! status: ${fetchRes.status}`);
    const html = await fetchRes.text();
    
    const rows = html.split('grid items-center gap-1.5 lg:gap-4 odd:bg-white even:bg-soft-almond');
    const scrapedPrices = [];
    
    for (let i = 1; i < rows.length; i++) {
      const block = rows[i];
      const nameMatch = block.match(/<h3[^>]*>[\s\S]*?<span[^>]*>([^<]+)<\/span>/);
      if (!nameMatch) continue;
      const name = nameMatch[1].trim();
      const cellRegex = /<div class="flex items-center justify-center lg:justify-end">[\s\S]*?<span[^>]*>([\s\S]*?)<\/span>/g;
      const cells = [];
      let cellMatch;
      while ((cellMatch = cellRegex.exec(block)) !== null) {
        cells.push(cellMatch[1].trim());
      }
      const sellVal = cells[0] ? cells[0].replace(/&nbsp;|\s/g, '') : '';
      const buyVal = cells[1] ? cells[1].replace(/&nbsp;|\s/g, '') : '';
      scrapedPrices.push({ name, sell: sellVal, buy: buyVal });
    }
    
    console.log(`Parsed ${scrapedPrices.length} gold prices.`);

    const assets = await Asset.find();
    let updatedCount = 0;
    const details = [];

    for (let asset of assets) {
      let matchedPrice = null;
      const nameUpper = asset.name.toUpperCase();
      
      if (nameUpper.includes('SJC')) {
        matchedPrice = scrapedPrices.find(p => p.name.toUpperCase().includes('SJC'));
      } else if (nameUpper.includes('NHẪN TRÒN') || nameUpper.includes('NHAN TRON') || nameUpper.includes('9999') || nameUpper.includes('24K')) {
        matchedPrice = scrapedPrices.find(p => p.name.toUpperCase().includes('NHẪN TRÒN') || p.name.toUpperCase().includes('9999') || p.name.toUpperCase().includes('24K'));
      } else if (nameUpper.includes('TRANG SỨC') || nameUpper.includes('TRANG SUC')) {
        matchedPrice = scrapedPrices.find(p => p.name.toUpperCase().includes('TRANG SỨC'));
      } else if (nameUpper.includes('BẠC') || nameUpper.includes('BAC')) {
        matchedPrice = scrapedPrices.find(p => p.name.toUpperCase().includes('BẠC TỨ QUÝ') || p.name.toUpperCase().includes('BẠC'));
      }

      if (matchedPrice) {
        const rawPriceStr = matchedPrice.buy || matchedPrice.sell;
        if (rawPriceStr) {
          const val = parseInt(rawPriceStr.replace(/\./g, ''), 10);
          if (!isNaN(val) && val > 0) {
            const oldVal = asset.valuePerUnit;
            asset.valuePerUnit = val;
            await asset.save();
            updatedCount++;
            details.push(`${asset.name}: ${oldVal.toLocaleString('vi-VN')}đ -> ${val.toLocaleString('vi-VN')}đ (theo ${matchedPrice.name})`);
          }
        }
      }
    }
    
    const updatedAssets = await Asset.find();
    res.json({ success: true, assets: updatedAssets, updatedCount, details });
  } catch (err) {
    console.error('Error updating gold prices:', err);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3001;

// Only listen on port if not running in production Vercel serverless environment
if (process.env.NODE_ENV !== 'production' || process.env.LOCAL_DEV === 'true') {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Express MongoDB Server is running on port ${PORT}`);
  });
}

export default app;
