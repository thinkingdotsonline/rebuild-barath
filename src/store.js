import { DatabaseSync } from 'node:sqlite';
import { randomUUID, scryptSync, randomBytes, timingSafeEqual } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
export const id = () => randomUUID();
export const now = () => new Date().toISOString();
export function hashPassword(password) { const salt = randomBytes(16).toString('hex'); return `${salt}:${scryptSync(password,salt,64).toString('hex')}`; }
export function verifyPassword(password, hash) { try { const [salt,value]=hash.split(':'); return timingSafeEqual(scryptSync(password,salt,64),Buffer.from(value,'hex')); } catch { return false; } }
export function openStore(path) {
  if(path!==':memory:') mkdirSync(dirname(path),{recursive:true,mode:0o700});
  const db = new DatabaseSync(path);
  db.exec(`PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;
CREATE TABLE IF NOT EXISTS companies(id TEXT PRIMARY KEY,name TEXT NOT NULL,verified INTEGER NOT NULL DEFAULT 0,created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS users(id TEXT PRIMARY KEY,name TEXT NOT NULL,email TEXT UNIQUE NOT NULL,password TEXT NOT NULL,role TEXT NOT NULL DEFAULT 'customer',company_id TEXT REFERENCES companies(id),active INTEGER NOT NULL DEFAULT 1,created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS memberships(user_id TEXT REFERENCES users(id),company_id TEXT REFERENCES companies(id),PRIMARY KEY(user_id,company_id));
CREATE TABLE IF NOT EXISTS sessions(token TEXT PRIMARY KEY,user_id TEXT REFERENCES users(id),expires INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS categories(id TEXT PRIMARY KEY,name TEXT NOT NULL,slug TEXT UNIQUE NOT NULL,parent_id TEXT REFERENCES categories(id),active INTEGER NOT NULL DEFAULT 0,position INTEGER NOT NULL DEFAULT 0,icon TEXT NOT NULL DEFAULT 'factory',attributes TEXT NOT NULL DEFAULT '[]',brands TEXT NOT NULL DEFAULT '[]',version INTEGER NOT NULL DEFAULT 1,archived INTEGER NOT NULL DEFAULT 0);
CREATE TABLE IF NOT EXISTS category_versions(category_id TEXT REFERENCES categories(id),version INTEGER NOT NULL,attributes TEXT NOT NULL,created_at TEXT NOT NULL,PRIMARY KEY(category_id,version));
CREATE TABLE IF NOT EXISTS assets(id TEXT PRIMARY KEY,company_id TEXT NOT NULL REFERENCES companies(id),owner_id TEXT NOT NULL REFERENCES users(id),category_id TEXT NOT NULL REFERENCES categories(id),title TEXT NOT NULL,description TEXT NOT NULL,location TEXT NOT NULL,brand TEXT NOT NULL DEFAULT '',model TEXT NOT NULL DEFAULT '',year INTEGER,condition TEXT NOT NULL DEFAULT 'Used',price INTEGER NOT NULL DEFAULT 0,currency TEXT NOT NULL DEFAULT 'INR',specs TEXT NOT NULL DEFAULT '{}',taxonomy_version INTEGER NOT NULL,review_status TEXT NOT NULL DEFAULT 'Draft',ownership_status TEXT NOT NULL DEFAULT 'Not reviewed',created_at TEXT NOT NULL,updated_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS listings(id TEXT PRIMARY KEY,asset_id TEXT UNIQUE NOT NULL REFERENCES assets(id),status TEXT NOT NULL DEFAULT 'Draft',created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS certificates(id TEXT PRIMARY KEY,report_id TEXT UNIQUE NOT NULL REFERENCES records(id),public_summary TEXT NOT NULL,scope TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'Valid',issued_by TEXT NOT NULL REFERENCES users(id),issued_at TEXT NOT NULL,revocation_reason TEXT);
CREATE TABLE IF NOT EXISTS asset_photos(id TEXT PRIMARY KEY,asset_id TEXT NOT NULL REFERENCES assets(id),mime TEXT NOT NULL,created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS favourites(user_id TEXT REFERENCES users(id),asset_id TEXT REFERENCES assets(id),PRIMARY KEY(user_id,asset_id));
CREATE TABLE IF NOT EXISTS enquiries(id TEXT PRIMARY KEY,asset_id TEXT NOT NULL REFERENCES assets(id),buyer_id TEXT NOT NULL REFERENCES users(id),message TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'New',created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS offers(id TEXT PRIMARY KEY,enquiry_id TEXT NOT NULL REFERENCES enquiries(id),actor_id TEXT NOT NULL REFERENCES users(id),amount INTEGER NOT NULL,terms TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'Pending',created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS records(id TEXT PRIMARY KEY,kind TEXT NOT NULL,company_id TEXT REFERENCES companies(id),owner_id TEXT NOT NULL REFERENCES users(id),assigned_to TEXT REFERENCES users(id),asset_id TEXT REFERENCES assets(id),title TEXT NOT NULL,status TEXT NOT NULL,data TEXT NOT NULL DEFAULT '{}',created_at TEXT NOT NULL,updated_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS documents(id TEXT PRIMARY KEY,company_id TEXT NOT NULL REFERENCES companies(id),owner_id TEXT NOT NULL REFERENCES users(id),name TEXT NOT NULL,mime TEXT NOT NULL,filename TEXT NOT NULL,created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS notifications(id TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id),message TEXT NOT NULL,read INTEGER NOT NULL DEFAULT 0,created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS audit(id INTEGER PRIMARY KEY AUTOINCREMENT,actor_id TEXT,action TEXT NOT NULL,entity_type TEXT NOT NULL,entity_id TEXT NOT NULL,details TEXT NOT NULL,created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS settings(key TEXT PRIMARY KEY,value TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS auctions(id TEXT PRIMARY KEY,asset_id TEXT NOT NULL REFERENCES assets(id),title TEXT NOT NULL,starts_at TEXT NOT NULL,ends_at TEXT NOT NULL,start_price INTEGER NOT NULL,reserve INTEGER NOT NULL,increment INTEGER NOT NULL,status TEXT NOT NULL DEFAULT 'Scheduled',anti_sniping INTEGER NOT NULL DEFAULT 1,created_by TEXT NOT NULL REFERENCES users(id),created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS auction_participants(auction_id TEXT REFERENCES auctions(id),user_id TEXT REFERENCES users(id),status TEXT NOT NULL DEFAULT 'Pending',PRIMARY KEY(auction_id,user_id));
CREATE TABLE IF NOT EXISTS bids(id TEXT PRIMARY KEY,auction_id TEXT NOT NULL REFERENCES auctions(id),user_id TEXT NOT NULL REFERENCES users(id),amount INTEGER NOT NULL,created_at TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS bids_auction ON bids(auction_id,amount DESC);
CREATE TABLE IF NOT EXISTS rentals(id TEXT PRIMARY KEY,asset_id TEXT UNIQUE NOT NULL REFERENCES assets(id),daily_rate INTEGER NOT NULL,deposit INTEGER NOT NULL,terms TEXT NOT NULL,active INTEGER NOT NULL DEFAULT 1,created_by TEXT NOT NULL REFERENCES users(id),created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS bookings(id TEXT PRIMARY KEY,rental_id TEXT NOT NULL REFERENCES rentals(id),user_id TEXT NOT NULL REFERENCES users(id),start_date TEXT NOT NULL,end_date TEXT NOT NULL,total INTEGER NOT NULL,status TEXT NOT NULL DEFAULT 'Requested',created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS data_grants(id TEXT PRIMARY KEY,mandate_id TEXT NOT NULL REFERENCES records(id),user_id TEXT NOT NULL REFERENCES users(id),granted_by TEXT NOT NULL REFERENCES users(id),expires_at TEXT NOT NULL,nda_reference TEXT NOT NULL,created_at TEXT NOT NULL,revoked INTEGER NOT NULL DEFAULT 0);
CREATE TABLE IF NOT EXISTS mandate_documents(mandate_id TEXT REFERENCES records(id),document_id TEXT REFERENCES documents(id),PRIMARY KEY(mandate_id,document_id));
CREATE INDEX IF NOT EXISTS assets_category ON assets(category_id); CREATE INDEX IF NOT EXISTS assets_company ON assets(company_id); CREATE INDEX IF NOT EXISTS records_kind ON records(kind); CREATE INDEX IF NOT EXISTS enquiries_asset ON enquiries(asset_id);
CREATE TRIGGER IF NOT EXISTS audit_no_update BEFORE UPDATE ON audit BEGIN SELECT RAISE(ABORT,'Audit events are immutable'); END;
CREATE TRIGGER IF NOT EXISTS audit_no_delete BEFORE DELETE ON audit BEGIN SELECT RAISE(ABORT,'Audit events are immutable'); END;`);
  if(!db.prepare('PRAGMA table_info(categories)').all().some(c=>c.name==='models'))db.exec("ALTER TABLE categories ADD COLUMN models TEXT NOT NULL DEFAULT '[]'");
  const get=(sql,...p)=>db.prepare(sql).get(...p), all=(sql,...p)=>db.prepare(sql).all(...p), run=(sql,...p)=>db.prepare(sql).run(...p);
  function transaction(fn) { db.exec('BEGIN IMMEDIATE');try {const result=fn();db.exec('COMMIT');return result;}catch(e){db.exec('ROLLBACK');throw e;} }
  const audit=(actor,action,type,entity,details={})=>run('INSERT INTO audit(actor_id,action,entity_type,entity_id,details,created_at) VALUES(?,?,?,?,?,?)',actor??null,action,type,entity,JSON.stringify(details),now());
  const notify=(user,message)=>run('INSERT INTO notifications VALUES(?,?,?,?,?)',id(),user,message,0,now());
  if(!get('SELECT id FROM categories LIMIT 1')) {
    const categories=[['Industrial Machinery','factory',[['CNC & VMC Machines','cnc'],['Lathes & Milling','cnc'],['Pumps & Compressors','generator']]],['Construction Equipment','excavator',[['Excavators & Backhoes','excavator'],['Cranes & Loaders','excavator']]],['Hotel & Kitchen Equipment','kitchen',[['Cooking & Bakery','kitchen'],['Refrigeration & Laundry','kitchen']]],['Food Processing & Packaging','food',[]],['Electrical Equipment','generator',[]],['Textile Machinery','textile',[]],['Agricultural Equipment','tractor',[]],['Commercial Vehicles','truck',[]],['Material Handling','truck',[]],['Factory Liquidation','factory',[]]];
    categories.forEach(([name,icon,children],position)=>{const key=id();const attrs=JSON.stringify([{key:'operating_hours',label:'Operating hours',type:'number',required:false,unit:'hours',filterable:true},{key:'power_kw',label:'Power',type:'number',required:false,unit:'kW',filterable:true}]);run('INSERT INTO categories(id,name,slug,position,icon,attributes) VALUES(?,?,?,?,?,?)',key,name,slug(name),position,icon,attrs);children.forEach(([n,i],j)=>run('INSERT INTO categories(id,name,slug,parent_id,position,icon,attributes) VALUES(?,?,?,?,?,?,?)',id(),n,slug(n),key,j,i,attrs));});
    run('INSERT INTO settings VALUES(?,?)','homepage',JSON.stringify({headline:'Every Asset Has a Second Opportunity.',subtitle:'Buy, sell and discover industrial machinery, construction equipment and business assets.',contactEmail:'hello@rebuildbharat.in'}));
  }
  for(const category of all('SELECT id,version,attributes FROM categories'))run('INSERT OR IGNORE INTO category_versions VALUES(?,?,?,?)',category.id,category.version,category.attributes,now());
  return {db,get,all,run,transaction,audit,notify};
}
export function slug(value) {return value.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');}
export function categoryVisible(store,categoryId,seen=new Set()) {
  if(seen.has(categoryId)) return false; seen.add(categoryId);
  const c=store.get('SELECT * FROM categories WHERE id=?',categoryId);
  return !!c && !!c.active && !c.archived && (!c.parent_id || categoryVisible(store,c.parent_id,seen));
}
export const permissions={customer:['asset.own','enquiry.own','record.own'],inspector:['inspection.assigned'],refurbisher:['repair.assigned'],logistics:['logistics.assigned'],operations:['asset.review','enquiry.manage','record.manage','inspection.manage'],finance:['finance.manage'],auction:['auction.manage'],admin:['*']};
export function can(user,permission){return !!user && (permissions[user.role]?.includes('*') || permissions[user.role]?.includes(permission));}
export function inCompany(s,user,company){return !!user && !!s.get('SELECT user_id FROM memberships WHERE user_id=? AND company_id=?',user.id,company);}
export function validateSpecs(definitions,specs) {
  if(!specs || Array.isArray(specs) || typeof specs!=='object') throw Error('Specifications must be an object');
  const keys=new Set(definitions.map(x=>x.key));for(const key of Object.keys(specs))if(!keys.has(key))throw Error(`Unknown specification: ${key}`);
  for(const a of definitions) {const v=specs[a.key];if(v===undefined||v===null||v===''){if(a.required)throw Error(`${a.label} is required`);continue;}
    if(['number','measurement'].includes(a.type) && (typeof v!=='number'||!Number.isFinite(v)||(a.min!==undefined&&v<a.min)||(a.max!==undefined&&v>a.max)))throw Error(`${a.label} must be a valid number in range`);
    if(a.type==='boolean' && typeof v!=='boolean') throw Error(`${a.label} must be true or false`);
    if(a.type==='dropdown' && !a.options?.includes(v))throw Error(`${a.label} is not an allowed option`);
    if(a.type==='multi-select' && (!Array.isArray(v)||v.some(x=>!a.options?.includes(x))))throw Error(`${a.label} contains an invalid option`);
    if(['text','date','file'].includes(a.type) && (typeof v!=='string'||v.length>2000))throw Error(`${a.label} must be text`);
    if(a.type==='date' && !/^\d{4}-\d{2}-\d{2}$/.test(v))throw Error(`${a.label} must be a date`);
  }
}
