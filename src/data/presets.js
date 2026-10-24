export const presets = [
  {id:'ssc',name:'SSC CGL / CHSL / MTS / GD',slots:[['signature','Signature',280,93,10,20]]},
  {id:'ibps',name:'IBPS PO / Clerk',slots:[['photo','Passport Photo',200,230,20,50],['signature','Signature (black ink)',140,60,10,20],['thumb','Left Thumb Impression',240,240,20,50],['declaration','Handwritten Declaration',800,400,50,100]]},
  {id:'sbi',name:'SBI PO / Clerk',slots:[['photo','Passport Photo',200,230,20,50],['signature','Signature (black ink)',140,60,10,20],['thumb','Left Thumb Impression',240,240,20,50],['declaration','Handwritten Declaration',800,400,50,100]]},
  {id:'rrb',name:'RRB NTPC UG 2026 — Signature',slots:[['signature','Signature (black ink, running hand)',140,60,30,49]]},
  {id:'mpsc',name:'MPSC (Maharashtra)',slots:[['photo','Photo',200,230,20,50],['signature','Signature',256,64,10,20]]},
  {id:'neet',name:'NTA NEET UG',slots:[['photo','Passport Photo',413,531,10,200],['postcard','Postcard Photo (4×6 inch)',1200,1800,10,200],['signature','Signature',300,130,4,30]]},
  {id:'upsc',name:'UPSC CSE / NDA / CDS',slots:[['photo','Photo',350,350,20,300],['signature','Signature',350,350,20,300]]},
  {id:'mahadbt',name:'MahaDBT Scholarship',slots:[['photo','Photo',200,230,20,50],['signature','Signature',140,60,10,20]]},
].map(p=>({...p,slots:p.slots.map(([id,label,width,height,minKB,maxKB])=>({id,label,width,height,minKB,maxKB}))}));
export const notice='Specs change with every notification — check yours; if it differs, use Custom mode.';
