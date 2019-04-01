const csvtojson = require('csvtojson');
const fs = require('fs');
const { exec } = require('child_process');

require('dotenv').config();

const CSV_FILE = 'debit_credit.csv';
const CSV_FILE_MAPPED = 'debit_credit_mapped.csv';
const JSON_FILE = 'debit_credit.json'
const PYTHON_SCRIPT = 'csv-to-influxdb.py';
const TIMEFORMAT = "%d %B %Y, %H:%M"; // e.g: (30 March 2013, 07:06) http://strftime.org/

(async () => {
  const r = await csvtojson().fromFile(CSV_FILE)

  const mapped = r.map(i => {
    return {
      timestamp: i.Date.replace(
        ` ${new Date().toLocaleString("en", { month: 'long' })} `,
        `-${new Date().toLocaleString("en", { month: '2-digit' })}-`
      ),
      description: i.Description,
      category: i.Category,
      payee: i.Payee,
      tag: i.Tag,
      account: i.Account,
      transfer_account: i["Transfer Account"],
      type: i.Amount.startsWith('-') ? 'expense' : 'income',
      value: `${Math.abs(parseFloat(i.Amount))}`,
    };
  });

  const [_, __, ...args] = process.argv;

  if (args.includes('--output')) {
    console.log(mapped);
  }

  if (args.includes('--post')) {
    fs.writeFile(JSON_FILE, JSON.stringify(mapped, null, 2), (writeErr) => {
      if (writeErr) throw new Error(writeErr);

      exec(`node ./node_modules/.bin/json2csv -i ${JSON_FILE} -o ${CSV_FILE_MAPPED}`, (jsonConvertErr) => {
        if (jsonConvertErr) throw new Error(jsonConvertErr);

        const host = `${process.env.INFLUXDB_HOST}:${process.env.INFLUXDB_PORT}`

        if (!host || host.length <= 0 || host.includes('undefined')) {
          throw new Error(`No valid host received: ${host}`);
        }

        console.log(`Sending ${CSV_FILE_MAPPED} to ${process.env.INFLUXDB_USER}@${host} in database: ${process.env.INFLUXDB_NAME}`);

        exec(
          `python ${PYTHON_SCRIPT} -i ${CSV_FILE_MAPPED} -s ${host} -u "${process.env.INFLUXDB_USER}" -p "${process.env.INFLUXDB_PASS}" --dbname ${process.env.INFLUXDB_NAME} --timeformat "${TIMEFORMAT}" --tagcolumns description,category,payee,tag,account,transfer_account,type`,
          (insertErr, out, e) => {
            if (insertErr) throw new Error(insertErr);
            if (e) throw new Error(e);
            console.log(out, e);
          }
        )
      });
    });
  };
})()
