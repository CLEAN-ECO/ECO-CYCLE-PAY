console.log("EcoCycle Pay System Active");

function formatCurrency(amount) {
    return new Intl.NumberFormat('en-NG', {
        style: 'currency',
        currency: 'NGN',
    }).format(amount);
}

// Example: save data to local storage for the demo
function saveSubmission(weight, type) {
    const data = {
        weight: weight,
        type: type,
        date: new Date().toLocaleDateString()
    };
    localStorage.setItem('lastSubmission', JSON.stringify(data));
}