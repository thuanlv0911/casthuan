import { createApp } from 'json-server/lib/app.js';
import { Observer } from 'json-server/lib/observer.js';
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import path from 'path';
import fs from 'fs';

// Set up database
const file = 'db.json';
const adapter = new JSONFile(file);
const observer = new Observer(adapter);
const db = new Low(observer, {});
await db.read();

// Create app
const app = createApp(db, { logger: false });

// Custom endpoint to scrape and update gold prices
app.post('/api/update-gold-prices', async (req, res) => {
  try {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    
    console.log('Fetching gold prices from Bao Tin Manh Hai...');
    const fetchRes = await fetch('https://baotinmanhhai.vn/vi/bang-gia-vang');
    if (!fetchRes.ok) {
      throw new Error(`HTTP error! status: ${fetchRes.status}`);
    }
    const html = await fetchRes.text();
    
    // Split and parse rows
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
    
    console.log(`Parsed ${scrapedPrices.length} gold prices from website.`);
    
    // Reload lowdb database to get fresh state (in case user made changes in app)
    await db.read();
    
    let updatedCount = 0;
    const details = [];
    
    // Update assets in db.data
    if (db.data.assets && Array.isArray(db.data.assets)) {
      db.data.assets = db.data.assets.map(asset => {
        let matchedPrice = null;
        const nameUpper = asset.name.toUpperCase();
        
        // Find best match in scrapedPrices
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
              updatedCount++;
              details.push(`${asset.name}: ${oldVal.toLocaleString('vi-VN')}đ -> ${val.toLocaleString('vi-VN')}đ (theo ${matchedPrice.name})`);
            }
          }
        }
        return asset;
      });
      
      // Save changes to database via lowdb
      await db.write();
      console.log(`Updated ${updatedCount} assets in database.`);
    }
    
    res.json({ success: true, assets: db.data.assets, updatedCount, details });
  } catch (err) {
    console.error('Error updating gold prices:', err);
    res.status(500).json({ error: err.message });
  }
});

const PORT = 3001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`JSON Server with custom API is running on http://0.0.0.0:${PORT}`);
});
