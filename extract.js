const fs = require('fs');
const content = fs.readFileSync('CLUB_EVE_COMPLETE_SERVICE_ARCHITECTURE_FULL_REPAIRED.md', 'utf8');
const lines = content.split('\n');
let currentService = '';
let status = '';
let order = '';
const services = [];

for (const line of lines) {
  const sMatch = line.match(/^## \d+\.\s+`(.*)`/);
  if (sMatch) {
    if (currentService && order) {
      services.push({ name: currentService, order: parseInt(order), status });
    }
    currentService = sMatch[1];
    status = '';
    order = '';
  }
  const statMatch = line.match(/\*\*Status:\*\*\s*(.*)/);
  if (statMatch) status = statMatch[1].trim();
  
  const ordMatch = line.match(/\*\*Implementation Order:\*\*\s*(\d+)/);
  if (ordMatch) order = ordMatch[1];
}
if (currentService && order) {
  services.push({ name: currentService, order: parseInt(order), status });
}
services.sort((a,b) => a.order - b.order);
console.log(JSON.stringify(services, null, 2));
