const express = require('express');
const { exec } = require('child_process');
const si = require('systeminformation');
const fs = require('fs');
const path = require('path');

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'public')));

// DBus configuration
const bus = dbus.systemBus();
const systemd = bus.getProxyObject('org.freedesktop.systemd1', '/org/freedesktop/systemd1');
const manager = systemd.getInterface('org.freedesktop.systemd1.Manager');



// Route principale du dashboard
app.get('/', async (req, res) => {
	try {
		const metrics = await getServerMetrics();
		const services = await getServiceList();
		res.render('dashboard', { metrics, services, error: null });
	} catch (error) {
		res.status(500).send('Erreur lors de la collecte des métriques ou des services');
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
app.get('/service/:name', async (req, res) => {
	const serviceName = req.params.name;
	try {
	  const serviceStatus = await manager.GetUnit(serviceName);
	  res.send(`Status du service ${serviceName}: ${JSON.stringify(serviceStatus)}`);
	} catch (error) {
	  res.status(404).send('Service non trouvé');
	}
  });

// Action sur les services : start, stop, restart
app.post('/service/:name/:action', (req, res) => {
	const { name, action } = req.params;
	const validActions = ['start', 'stop', 'restart'];
	console.log(name, action);

	if (!validActions.includes(action)) {
		return res.status(400).send('Action non valide');
	}

	exec(`sudo systemctl ${action} ${name}`, (err, stdout, stderr) => {
		if (err) {
			return res.status(500).send(`Erreur lors de l'action ${action} sur le service: ${stderr}`);
		}
		if (stdout) console.log(stdout);

		res.send(`Service ${name} ${action} avec succès`);
	});
});

// Route pour obtenir les logs d'un service
app.get('/service/:name/logs', async (req, res) => {
	const serviceName = req.params.name;
	exec(`journalctl -u ${serviceName} --no-pager`, (err, stdout, stderr) => {
		if (err) {
			res.status(404).send('Erreur lors de la récupération des logs du service');
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
		uptime: uptime.uptime
	};
}

// Obtenir la liste des services via DBus
async function getServiceList() {
	try {
		const units = await manager.ListUnits();
		return units.filter(unit => unit[0].endsWith('.service')).map(unit => ({
			unit: unit[0],
			description: unit[1],
			load: unit[2],
			active: unit[3],
			sub: unit[4],
		}));
	} catch (error) {
		console.error('Erreur lors de la récupération de la liste des services:', error);
		throw new Error('Impossible de récupérer la liste des services');
	}
}


// Démarrage de l'application
app.listen(PORT, () => {
	console.log(`Application de monitoring démarrée sur le port ${PORT}`);
});

// Création du fichier .env
if (!fs.existsSync('.env')) {
	fs.writeFileSync('.env', `PORT=4548\nMAX_CPU_USAGE=80\nMAX_MEMORY_USAGE=70`);
}
