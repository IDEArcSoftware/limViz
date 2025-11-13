document.addEventListener('DOMContentLoaded', function(){
  const toggle = document.getElementById('billingToggle');
  const priceEls = document.querySelectorAll('.price span');
  const tierSelect = document.getElementById('tierSelect');
  const qtyInput = document.getElementById('qty');
  const rushInput = document.getElementById('rush');
  const revsInput = document.getElementById('revs');
  const estimateAmount = document.getElementById('estimateAmount');
  const mailtoLink = document.getElementById('mailtoLink');
  const copyBtn = document.getElementById('copyBtn');

  function formatEUR(n){
    return '€' + Number(n).toLocaleString(undefined,{maximumFractionDigits:0});
  }

  // Toggle display between base price and hourly
  toggle.addEventListener('change', () => {
    priceEls.forEach(el=>{
      if(toggle.checked){
        el.textContent = formatEUR(el.dataset.priceHourly);
      } else {
        el.textContent = formatEUR(el.dataset.priceMonthly);
      }
    });
    updateEstimate();
  });

  // Update estimator
  function getBaseForTier(tier){
    // Use monthly as base unit for stills (prices in the HTML)
    const el = [...priceEls].find(e => e.closest('.card').querySelector('h2').textContent === tier);
    if(!el) return 0;
    return toggle.checked ? Number(el.dataset.priceHourly) : Number(el.dataset.priceMonthly);
  }

  function updateEstimate(){
    const tier = tierSelect.value;
    const qty = Math.max(1, Number(qtyInput.value) || 1);
    const base = getBaseForTier(tier);
    // Simple model:
    // For stills: price scales roughly linearly with qty.
    // For animations (if qty > 6 treat as minutes), we let base represent a package and scale.
    let subtotal = base * Math.min(qty, 1) + (base * 0.6 * (qty - 1));
    if(qty > 3){ // animations / large jobs
      subtotal = base * 0.9 * qty;
    }
    // extra revisions
    subtotal += Number(revsInput.value || 0) * 50;
    // rush
    if(rushInput.checked) subtotal *= 1.3;
    subtotal = Math.round(subtotal);
    estimateAmount.textContent = formatEUR(subtotal);
    mailtoLink.href = `mailto:software@idearc.com.tr?subject=limViz%20estimate%20request&body=${encodeURIComponent(
      `I'm interested in the ${tier} tier.\nQuantity: ${qty}\nRush: ${rushInput.checked ? 'Yes' : 'No'}\nExtra revisions: ${revsInput.value}\nEstimated total: €${subtotal}`
    )}`;
  }

  // initial run
  updateEstimate();

  // events
  [tierSelect, qtyInput, rushInput, revsInput].forEach(el => el.addEventListener('input', updateEstimate));

  // CTA buttons open mailto with tier prefilled
  document.querySelectorAll('.cta').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const tier = btn.dataset.tier || 'Standard';
      const subject = encodeURIComponent(`Request: limViz ${tier} package`);
      const body = encodeURIComponent(`Hi,\n\nI'd like a quote for the ${tier} package.\nPlease advise next steps and lead time.\n\nThanks.`);
      window.location.href = `mailto:software@idearc.com.tr?subject=${subject}&body=${body}`;
    });
  });

  copyBtn.addEventListener('click', (e)=>{
    e.preventDefault();
    const text = `Estimated price: ${estimateAmount.textContent}\nContact: software@idearc.com.tr`;
    navigator.clipboard?.writeText(text).then(()=> {
      copyBtn.textContent = 'Copied';
      setTimeout(()=> copyBtn.textContent = 'Copy estimate', 1800);
    }).catch(()=>{
      // fallback
      alert(text);
    });
  });
});