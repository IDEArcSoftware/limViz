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

  // Make updateEstimate global so i18n can call it
  window.updateEstimate = updateEstimate;

  function formatPrice(n){
    return window.i18n.formatPrice(n);
  }

  // Toggle display between base price and hourly
  toggle.addEventListener('change', () => {
    priceEls.forEach(el=>{
      const basePrice = toggle.checked ? 
        Number(el.dataset.priceHourly) : 
        Number(el.dataset.priceMonthly);
      const convertedPrice = window.i18n.convertPrice(basePrice);
      el.textContent = formatPrice(convertedPrice);
    });
    updateEstimate();
  });

  // Update estimator
  function getBaseForTier(tier){
    const el = [...priceEls].find(e => {
      const card = e.closest('.card');
      const h2 = card.querySelector('h2');
      const h2Text = h2.textContent.trim();
      return h2Text === tier || 
             (tier === 'Basic' && h2Text === window.i18n.t('basic')) ||
             (tier === 'Standard' && h2Text === window.i18n.t('standard')) ||
             (tier === 'Premium' && h2Text === window.i18n.t('premium'));
    });
    if(!el) return 0;
    const basePrice = toggle.checked ? 
      Number(el.dataset.priceHourly) : 
      Number(el.dataset.priceMonthly);
    return window.i18n.convertPrice(basePrice);
  }

  function updateEstimate(){
    const tier = tierSelect.value;
    const qty = Math.max(1, Number(qtyInput.value) || 1);
    const base = getBaseForTier(tier);
    let subtotal = base * Math.min(qty, 1) + (base * 0.6 * (qty - 1));
    if(qty > 3){
      subtotal = base * 0.9 * qty;
    }
    // Extra revisions (convert from EUR)
    const extraRevCost = window.i18n.convertPrice(50);
    subtotal += Number(revsInput.value || 0) * extraRevCost;
    if(rushInput.checked) subtotal *= 1.3;
    subtotal = Math.round(subtotal);
    estimateAmount.textContent = formatPrice(subtotal);
    
    const tierName = window.i18n.t(tier.toLowerCase());
    const currencySymbol = window.i18n.currentCurrency === 'TRY' ? '₺' : '€';
    const emailBody = `${window.i18n.t('emailInterestedIn')} ${tierName} ${window.i18n.t('tier').toLowerCase()}\n${window.i18n.t('emailQuantity')} ${qty}\n${window.i18n.t('emailRush')} ${rushInput.checked ? window.i18n.t('emailYes') : window.i18n.t('emailNo')}\n${window.i18n.t('emailExtraRevisions')} ${revsInput.value}\n${window.i18n.t('emailEstimatedTotal')} ${currencySymbol}${subtotal.toLocaleString()}`;
    
    mailtoLink.href = `mailto:software@idearc.com.tr?subject=${encodeURIComponent(window.i18n.t('emailSubjectRequest') + ' ' + tierName)}&body=${encodeURIComponent(emailBody)}`;
  }

  // initial run
  updateEstimate();

  // events
  [tierSelect, qtyInput, rushInput, revsInput].forEach(el => el.addEventListener('input', updateEstimate));

  // CTA buttons open mailto with tier prefilled
  document.querySelectorAll('.cta').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const tier = btn.dataset.tier || 'Standard';
      const tierName = window.i18n.t(tier.toLowerCase());
      const subject = encodeURIComponent(`${window.i18n.t('emailSubjectRequest')} limViz ${tierName}`);
      const body = encodeURIComponent(`${window.i18n.t('emailHi')}${tierName} ${window.i18n.t('emailPackage')}`);
      window.location.href = `mailto:software@idearc.com.tr?subject=${subject}&body=${body}`;
    });
  });

  copyBtn.addEventListener('click', (e)=>{
    e.preventDefault();
    const text = `${window.i18n.t('estimatedPrice')} ${estimateAmount.textContent}\n${window.i18n.t('contact')}: software@idearc.com.tr`;
    navigator.clipboard?.writeText(text).then(()=> {
      const originalText = copyBtn.textContent;
      copyBtn.textContent = window.i18n.t('copied');
      setTimeout(()=> copyBtn.textContent = originalText, 1800);
    }).catch(()=>{
      alert(text);
    });
  });

  // Update select options when language changes
  function updateSelectOptions() {
    const options = tierSelect.querySelectorAll('option');
    options.forEach(opt => {
      const key = opt.value.toLowerCase();
      opt.textContent = window.i18n.t(key);
    });
  }

  // Listen for language changes
  const observer = new MutationObserver(() => {
    updateSelectOptions();
    updateEstimate();
  });
  
  observer.observe(document.body, { 
    childList: true, 
    subtree: true,
    attributes: true,
    attributeFilter: ['data-lang']
  });

  updateSelectOptions();
});