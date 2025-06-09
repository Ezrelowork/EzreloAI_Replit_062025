
document.addEventListener('DOMContentLoaded', function () {
  const zipInput = document.getElementById('zip');
  const resultsDiv = document.getElementById('results');
  const form = document.getElementById('zipForm');
  const resultsContainer = document.getElementById('results-container');
  const addressDisplay = document.getElementById('address-display');

  if (!form || !zipInput || !resultsDiv || !resultsContainer || !addressDisplay) {
    console.error('❌ One or more required DOM elements not found.');
    return;
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    const address = zipInput.value.trim();
if (!address) {
  resultsDiv.innerHTML = '<p>Please enter a ZIP code or address.</p>';
  return;
}

// Check if it's ZIP only (5-digit number)
const isZipOnly = /^\d{5}$/.test(address);
if (isZipOnly) {
  resultsDiv.innerHTML = `
    <div class="bg-yellow-100 text-yellow-800 px-4 py-3 rounded-md mb-4">
      <strong>Tip:</strong> For better results, please enter your full address (e.g., "123 Main St, City, State ZIP").
    </div>
  `;
  return;
}

    resultsDiv.innerHTML = '<p>Searching...</p>';

    fetch('http://localhost:3001/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ address })
    })
    .then(response => response.json())
    .then(data => {
      console.log('✅ Data from server:', data);
      resultsDiv.innerHTML = '';

      resultsContainer.classList.remove('hidden');
      addressDisplay.textContent = `${data.city}, ${data.state} ${data.zip}`;

      const title = document.querySelector('#zip-header');
if (title) {
  title.textContent = `Utility Providers for ZIP ${data.zip} (${data.city}, ${data.state})`;
}

      console.log('📦 Raw GPT response:', data.gptResponse);

      const lines = data.gptResponse.split('\n').map(line => line.trim()).filter(Boolean);

      let currentCategory = '';
      let currentProvider = '';
      let currentPhone = '';

      const categoryIcons = {
        'Electricity': 'fas fa-bolt',
        'Gas': 'fas fa-fire',
        'Water': 'fas fa-tint',
        'Internet': 'fas fa-wifi',
        'Trash': 'fas fa-trash-alt',
        'Phone': 'fas fa-phone',
        'Healthcare': 'fas fa-heartbeat',
        'Home Services': 'fas fa-home',
        'Veterinarians': 'fas fa-paw',
        'Other': 'fas fa-circle'
      };

      lines.forEach((line, idx) => {
        if (line.startsWith('- ') && line.endsWith(':')) {
          if (currentCategory && currentProvider) {
            const card = document.createElement('div');
            const iconClass = categoryIcons[currentCategory] || categoryIcons['Other'];
            card.className = 'bg-white rounded-lg shadow-md p-8 text-center w-full max-w-sm mx-auto';
            card.innerHTML = `
              <div class="inline-flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 text-blue-600 mb-6">
                <i class="${iconClass} text-2xl"></i>
              </div>
              <h3 class="text-xl font-semibold text-gray-900 mb-3">${currentCategory}</h3>
              <p class="text-gray-800 break-words">${currentProvider}</p>
              <p class="text-sm text-gray-500 whitespace-nowrap">${currentPhone}</p>
            `;
            resultsDiv.appendChild(card);
          }

          currentCategory = line.replace('- ', '').replace(':', '').trim();
          currentProvider = '';
          currentPhone = '';
        } else if (!line.includes('Phone number:') && currentCategory && !currentProvider) {
          currentProvider = line.replace('- ', '').trim();
        } else if (line.includes('Phone number:')) {
          currentPhone = line.split('Phone number:')[1].trim();
        }

        if (idx === lines.length - 1 && currentCategory && currentProvider) {
          const card = document.createElement('div');
          const iconClass = categoryIcons[currentCategory] || categoryIcons['Other'];
          card.className = 'bg-white rounded-lg shadow-md p-8 text-center w-full max-w-sm mx-auto';
          card.innerHTML = `
            <div class="inline-flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 text-blue-600 mb-6">
              <i class="${iconClass} text-2xl"></i>
            </div>
            <h3 class="text-xl font-semibold text-gray-900 mb-3">${currentCategory}</h3>
            <p class="text-gray-800 break-words">${currentProvider}</p>
            <p class="text-sm text-gray-500 whitespace-nowrap">${currentPhone}</p>
          `;
          resultsDiv.appendChild(card);
        }
      });
    })
    .catch(err => {
      console.error('❌ Fetch error:', err);
      resultsDiv.innerHTML = '<p>Error fetching data. See console.</p>';
    });
  });
});
