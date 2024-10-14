window.onload = function () {


    const chartconf = { grid: { borderVisible: false }, tooltip: true, tooltipLine: { strokeStyle: '#bbbbbb' } }
    const TimeSeriesConf = { lineWidth: 2.5, strokeStyle: '#00ff00', interpolation: 'bezier', fillStyle: 'rgba(255,0,0,0.33)' }
    var cpuChart = new SmoothieChart(chartconf);
    var memoryChart = new SmoothieChart(chartconf);
    var temperatureChart = new SmoothieChart(chartconf);
    var diskChart = new SmoothieChart(chartconf);
    var networkChart = new SmoothieChart(chartconf);
    var batteryChart = new SmoothieChart(chartconf);

    var cpuSeries = new TimeSeries();
    var memorySeries = new TimeSeries();
    var temperatureSeries = new TimeSeries();
    var diskSeries = new TimeSeries();
    var networkSeries = new TimeSeries();
    var batterySeries = new TimeSeries();

    cpuChart.addTimeSeries(cpuSeries, TimeSeriesConf);
    memoryChart.addTimeSeries(memorySeries, TimeSeriesConf);
    temperatureChart.addTimeSeries(temperatureSeries, TimeSeriesConf);
    diskChart.addTimeSeries(diskSeries, TimeSeriesConf);
    networkChart.addTimeSeries(networkSeries, TimeSeriesConf);
    batteryChart.addTimeSeries(batterySeries, TimeSeriesConf);

    cpuChart.streamTo(document.getElementById('cpuChart'), 1000);
    memoryChart.streamTo(document.getElementById('memoryChart'), 1000);
    temperatureChart.streamTo(document.getElementById('temperatureChart'), 1000);
    diskChart.streamTo(document.getElementById('diskChart'), 1000);
    networkChart.streamTo(document.getElementById('networkChart'), 1000);
    batteryChart.streamTo(document.getElementById('batteryChart'), 1000);

    function updateMetrics() {
        fetch('/metrics').then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        }).then(data => {
            cpuSeries.append(new Date().getTime(), parseFloat(data.cpu.toFixed(2)));
            memorySeries.append(new Date().getTime(), parseFloat(data.memory.toFixed(2)));
            temperatureSeries.append(new Date().getTime(), parseFloat(data.temperature.toFixed(2)));
            batterySeries.append(new Date().getTime(), data.battery);
            diskSeries.append(new Date().getTime(), parseFloat(data.diskUsage[0].usage.toFixed(2)));
            networkSeries.append(new Date().getTime(), parseFloat(data.network[0].rx.toFixed(2)));

            // Uptime Update
            document.getElementById('uptimeText').textContent = `Uptime: ${data.uptime} seconds`;
        }).catch(error => {
            console.error('Erreur lors de la mise à jour des métriques:', error);
        });
    }

    setInterval(updateMetrics, 1000);
};

let actionServiceName = '';
let actionType = '';

function manageService(serviceName, action) {
    fetch(`/service/${serviceName}/${action}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.text();
        })
        .then(result => {
            alert(result);
            location.reload(); // Recharger la page pour mettre à jour l'état des services
        })
        .catch(error => {
            console.error('Erreur lors de l\'action sur le service:', error);
            alert('Erreur lors de l\'action sur le service');
        });
}

function viewLogs(serviceName) {
    fetch(`/service/${serviceName}/logs`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.text();
        })
        .then(logs => {
            document.getElementById('serviceLogs').textContent = logs;
            document.getElementById('logModal').style.display = 'block';
        })
        .catch(error => {
            console.error('Erreur lors de la récupération des logs du service:', error);
            alert('Erreur lors de la récupération des logs du service');
        });
}

function showServiceDetails(serviceName) {
    fetch('/service/' + encodeURIComponent(serviceName) + '/details')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.text();
        })
        .then(data => {
            document.getElementById('serviceDetails').textContent = data;
            document.getElementById('serviceDetailsModal').style.display = 'block';
        })
        .catch(error => console.error('Erreur lors de la récupération des détails du service:', error));
}

function toggleSettingsPanel() {
    const panel = document.getElementById('settingsPanel');
    panel.style.display = (panel.style.display === 'none' || panel.style.display === '') ? 'block' : 'none';
}

function promptPasswordAndPerformAction(serviceName, action) {
    actionServiceName = serviceName;
    actionType = action;
    document.getElementById('passwordModal').style.display = 'block';
}

function performServiceAction() {
    const password = document.getElementById('adminPassword').value;
    fetch('/service/' + actionServiceName + '/' + actionType, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ password })
    })
        .then(response => {
            if (response.ok) {
                alert(`Service ${actionServiceName} ${actionType} avec succès`);
            } else {
                alert('Erreur lors de l\'action sur le service');
            }
            closeModal('passwordModal');
        })
        .catch(error => console.error('Erreur lors de l\'action sur le service:', error));
}


function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}