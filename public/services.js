// Shared by the server and browser: one source of truth for launchable divisions.
export const serviceCatalog = [
  {key:'trade',name:'Equipment trade & resale',brand:'Rebuild Trade',icon:'factory',description:'Machinery brokerage, equipment listings, buyer enquiries and managed resale.',route:'browse',defaultEnabled:true},
  {key:'inspection',name:'Inspections & certification',brand:'Rebuild Certified',icon:'shield',description:'Technical inspections, documented findings and reviewed certificates.',kind:'inspection',defaultEnabled:true},
  {key:'repair',name:'Refurbishment & repairs',brand:'Rebuild Renew',icon:'tool',description:'Repair requests, quotations, refurbishment progress and quality review.',kind:'repair',defaultEnabled:true},
  {key:'liquidation',name:'Factory & asset liquidation',brand:'Rebuild Liquidate',icon:'factory',description:'Complete factory, hotel and industrial inventory liquidation projects.',kind:'liquidation',defaultEnabled:true},
  {key:'business',name:'Business sales & acquisitions',brand:'Rebuild Business',icon:'briefcase',description:'Confidential business mandates, buyer qualification and secure document sharing.',kind:'business',defaultEnabled:true},
  {key:'rentals',name:'Equipment rentals',brand:'Rebuild Lease',icon:'clock',description:'Daily rates, booking requests and conflict-checked confirmations.',route:'rentals',defaultEnabled:false},
  {key:'auctions',name:'Auctions',brand:'Rebuild Auction',icon:'chart',description:'Server-validated bids, manual bidder approval, reserve prices and anti-sniping.',route:'auctions',defaultEnabled:false},
  {key:'logistics',name:'Logistics & installation',brand:'Rebuild Logistics',icon:'truck',description:'Dismantling, transport, delivery and installation coordination.',kind:'logistics',defaultEnabled:true}
];
export function serviceEnabled(store,key) {
  const service=serviceCatalog.find(s=>s.key===key);
  if(!service)return false;
  const saved=store.get('SELECT value FROM settings WHERE key=?','feature.'+key);
  return saved?saved.value==='true':service.defaultEnabled;
}
export function serviceFlags(store){return Object.fromEntries(serviceCatalog.map(s=>[s.key,serviceEnabled(store,s.key)]));}
