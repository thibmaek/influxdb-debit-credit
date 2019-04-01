Most of the time I try clean coding, seting up envs nicely, dockerizing or scripting stuff.

This however is the dirtiest of hacks, calling Python scripts from Node. It is a way to get data from [Debit & Credit](https://debitandcredit.app) into InfluxDB and later visualise it in Grafana.

1. Export a CSV for one month from Debit & Credit
2. Place that CSV in the same folder as this repo and call it `debit_credit.csv`
3. `npm i`
4. Install all Python modules
5. Copy `.env.sample` to `.env` and fill in details
6. `node index.js --output` to see output
7. `node index.js --post` to post to InfluxDB

Thank you https://github.com/fabio-miranda/csv-to-influxdb
