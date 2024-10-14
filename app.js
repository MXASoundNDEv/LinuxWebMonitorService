const express = require('express');
const { exec } = require('child_process');
const si = require('systeminformation');
const fs = require('fs');
const path = require('path');
const { log } = require('console');

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json()); // Permet de parser les données JSON dans les requêtes POST

// Route principale du dashboard
app.get('/', async (req, res) => {
	try {
		const metrics = await getServerMetrics();
		exec('systemctl list-units --type=service --no-pager --output=json', (err, stdout, stderr) => {
			if (err) {
				res.status(500).send('Erreur lors de la récupération des services');
			} else {
				const services = JSON.parse(stdout).map(service => ({
					unit: service.unit,
					load: service.load,
					active: service.active,
					sub: service.sub,
					description: service.description
				}));
				res.render('dashboard', { metrics, services, error: null });
			}
		});
	} catch (error) {
		res.status(500).send('Erreur lors de la collecte des métriques');
	}
});

// Nouvelle route pour obtenir les métriques du serveur
app.get('/metrics', async (req, res) => {
	try {
		const metrics = await getServerMetrics();
		res.json(metrics);
	} catch (error) {
		res.status(500).send('Erreur lors de la collecte des métriques');
	}
});

// Route pour afficher les détails d'un service
app.get('/service/:name/details', async (req, res) => {
	const serviceName = req.params.name;
	console.log(`Tentative de récupération des détails pour le service : ${serviceName}`);
	exec(`systemctl status ${serviceName}`, (err, stdout, stderr) => {
		if (err) {
			res.status(404).send('Service non trouvé');
			console.error("Details Error : ", err);
		} else {
			res.setHeader('Content-Type', 'text/plain');
			res.send(stdout);
		}
	});
});

// Route pour effectuer une action sur un service (start/stop/restart)
app.post('/service/:name/:action', async (req, res) => {
	const { name, action } = req.params;
	const { password } = req.body;
	console.log(`Tentative de ${action} du service : ${name} avec le mdp ${password}`);	

	// Valide l'action demandée
	const validActions = ['start', 'stop', 'restart'];
	if (!validActions.includes(action)) {
		return res.status(400).send('Action non valide');
	}

	// Exécute la commande pour gérer le service
	exec(`ehco ${password} | sudo -S systemctl ${action} ${name}`, (err, stdout, stderr) => {
		if (err) {
			return res.status(500).send(`Erreur lors de l'action ${action} sur le service`);
		}
		res.send(`Service ${name} ${action} avec succès`);
	});
});

// Route pour obtenir les logs d'un service
app.get('/service/:name/logs', async (req, res) => {
	const serviceName = req.params.name;
	exec(`journalctl -u ${serviceName} --no-pager`, (err, stdout, stderr) => {
		if (err) {
			res.status(404).send('Erreur lors de la récupération des logs du service');
			console.error("Logs Error : ", err);
		} else {
			res.send(stdout);
		}
	});
});

// Obtenir les métriques du serveur
async function getServerMetrics() {
	const cpu = await si.currentLoad();
	const memory = await si.mem();
	const temp = await si.cpuTemperature();
	const disk = await si.fsSize();
	const network = await si.networkStats();
	const battery = await si.battery();
	const uptime = await si.time();

	return {
		cpu: cpu.currentLoad,
		memory: (memory.active / memory.total) * 100,
		temperature: temp.main,
		diskUsage: disk.map(d => ({
			fs: d.fs,
			usage: (d.used / d.size) * 100
		})),
		network: network.map(n => ({
			iface: n.iface,
			rx: n.rx_bytes,
			tx: n.tx_bytes
		})),
		battery: battery.percent,
		uptime: uptime.uptime / 60
	};
}

// Démarrage de l'application
app.listen(PORT, () => {
	console.log(`Application de monitoring démarrée sur le port ${PORT}`);
});

// Création du fichier .env
if (!fs.existsSync('.env')) {
	fs.writeFileSync('.env', `PORT=4548\nMAX_CPU_USAGE=80\nMAX_MEMORY_USAGE=70`);
}