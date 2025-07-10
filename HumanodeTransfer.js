const { ApiPromise, WsProvider } = require('@polkadot/api');
const { Keyring } = require('@polkadot/keyring');
const fs = require('fs');
const chalk = require('chalk');

// TXT dosyasından mnemonic'leri oku
const mnemonics = fs.readFileSync('mnemonics.txt', 'utf8')
  .split('\n')
  .map(line => line.trim())
  .filter(Boolean);

const recipient = ''; // Alıcı adresi
const minimumBalance = BigInt(400_000_000_000); // 0.4 HMND (BigInt olarak tanımlandı)

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function createApi() {
  const wsProvider = new WsProvider('wss://explorer-rpc-ws.mainnet.stages.humanode.io');
  const api = await ApiPromise.create({ provider: wsProvider });

  wsProvider.on('disconnected', () => {
    console.log(chalk.yellow('WebSocket bağlantısı kesildi. İşlem tamamlandı ve script sonlanıyor.'));
    process.exit(0);
  });

  return api;
}

async function showSplashScreen() {
  console.clear();

  const humanodeText = `
╭╮╱╭╮╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╭╮╱╱╱╭━━━━╮╱╱╱╱╱╱╱╱╱╱╭━╮╱╱╱╱╱╭━━━╮╱╱╱╱╱╱╱╱╭╮
┃┃╱┃┃╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱┃┃╱╱╱┃╭╮╭╮┃╱╱╱╱╱╱╱╱╱╱┃╭╯╱╱╱╱╱┃╭━╮┃╱╱╱╱╱╱╱╭╯╰╮
┃╰━╯┣╮╭┳╮╭┳━━┳━╮╭━━┳━╯┣━━╮╰╯┃┃┣┻┳━━┳━╮╭━━┳╯╰┳━━┳━╮┃╰━━┳━━┳━┳┳━┻╮╭╋╮
┃╭━╮┃┃┃┃╰╯┃╭╮┃╭╮┫╭╮┃╭╮┃┃━┫╱╱┃┃┃╭┫╭╮┃╭╮┫━━╋╮╭┫┃━┫╭╯╰━━╮┃╭━┫╭╋┫╭╮┃┃┣┫
┃┃╱┃┃╰╯┃┃┃┃╭╮┃┃┃┃╰╯┃╰╯┃┃━┫╱╱┃┃┃┃┃╭╮┃┃┃┣━━┃┃┃┃┃━┫┃╱┃╰━╯┃╰━┫┃┃┃╰╯┃╰┫┃
╰╯╱╰┻━━┻┻┻┻╯╰┻╯╰┻━━┻━━╻━━╯╱╱╰╯╰╯╰╯╰┻╯╰┻━━╯╰╯╰━━┻╯╱╰━━━┻━━┻╯╰┫╭━┻━┻╯
╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱┃┃
╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╰╯`;

  await sleep(2000); // 2 saniye animasyon beklet
  console.log(chalk.blue.bold(humanodeText));
  console.log(chalk.yellow.bold(kralBTCText));
}

async function sendTransaction() {
  const api = await createApi();

  for (let i = 0; i < mnemonics.length; i++) {
    try {
      if (i > 0) await sleep(1000);

      const mnemonic = mnemonics[i];
      const keyring = new Keyring({ type: 'sr25519' });
      const sender = keyring.addFromMnemonic(mnemonic);

      const { data: balance } = await api.query.system.account(sender.address);
      const availableBalance = balance.free.toBigInt();

      const transfer = api.tx.balances.transfer(recipient, availableBalance.toString());
      const fee = await transfer.paymentInfo(sender);

      const sendAmount = availableBalance - minimumBalance - fee.partialFee.toBigInt();

      if (sendAmount > 0n) {
        const transferWithFee = api.tx.balances.transfer(recipient, sendAmount.toString());
        const hash = await transferWithFee.signAndSend(sender);
        console.log(chalk.green(`✅ İşlem başarılı: ${sender.address} → ${hash.toHex()}`));
      } else {
        console.log(chalk.red(`⛔ Yetersiz bakiye (sadece 0.4 bırakılacak kadar yok): ${sender.address}`));
      }
    } catch (error) {
      console.error(chalk.red(`������ Hata (${mnemonics[i]}): ${error.message}`));
    }
  }

  await api.disconnect();
  console.log(chalk.green('������ Tüm işlemler tamamlandı.'));
  process.exit(0);
}

// Başlat
showSplashScreen().then(() => {
  sendTransaction().catch(console.error);
});