# Raspi Monitor Dashboard

## Installation

1. Clonez le dépôt :
   ```bash
   git clone https://github.com/MXASoundNDEv/LinuxWebMonitorService.git
   cd raspi-monitor-dashboard
   ```

2. Installez les dépendances :
   ```bash
   npm install
   ```

3. Lancez l'application en développement :
   ```bash
   npm run dev
   ```

## Utilisation

- Accédez au dashboard sur `http://localhost:4548` pour voir les métriques du système et gérer les services.
- Pour démarrer automatiquement avec `systemd` :
  ```bash
  sudo systemctl enable monitoring-dashboard.service
  sudo systemctl start monitoring-dashboard.service
  ```
