const form = document.getElementById('waitlist-form');
const emailInput = document.getElementById('email-input');
const successMsg = document.getElementById('form-success');
const errorMsg = document.getElementById('form-error');

if (form) {
  form.addEventListener('submit', function(e) {
    e.preventDefault();
    const email = emailInput.value.trim();
    if (!email) return;
    
    // Store locally
    try {
      const existing = JSON.parse(localStorage.getItem('fixy-waitlist') || '[]');
      if (!existing.includes(email)) {
        existing.push(email);
        localStorage.setItem('fixy-waitlist', JSON.stringify(existing));
      }
    } catch(e) {}
    
    successMsg.style.display = 'block';
    errorMsg.style.display = 'none';
    emailInput.value = '';
    
    setTimeout(() => { successMsg.style.display = 'none'; }, 4000);
  });
}
