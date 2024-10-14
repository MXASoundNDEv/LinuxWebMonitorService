// Charger les paramètres enregistrés depuis le localStorage
document.addEventListener('DOMContentLoaded', function() {
  const storedColor = localStorage.getItem('dashboardColor');
  const storedCharts = JSON.parse(localStorage.getItem('selectedCharts'));

  if (storedColor) {
    document.body.style.backgroundColor = storedColor;
  }

  if (storedCharts) {
    document.querySelectorAll('.chart-container').forEach((chart, index) => {
      chart.style.display = storedCharts.includes(index) ? 'block' : 'none';
    });
  }
});

function saveSettings() {
  // Sauvegarder la couleur sélectionnée
  const color = document.getElementById('dashboardColor').value;
  localStorage.setItem('dashboardColor', color);
  document.body.style.backgroundColor = color;

  // Sauvegarder les graphiques sélectionnés
  const selectedCharts = [];
  document.querySelectorAll('.chart-checkbox').forEach((checkbox, index) => {
    if (checkbox.checked) {
      selectedCharts.push(index);
    }
  });
  localStorage.setItem('selectedCharts', JSON.stringify(selectedCharts));

  // Appliquer les changements d'affichage des graphiques
  document.querySelectorAll('.chart-container').forEach((chart, index) => {
    chart.style.display = selectedCharts.includes(index) ? 'block' : 'none';
  });
}

