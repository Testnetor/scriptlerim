// Gereken modüller
import { ApiPromise, WsProvider } from '@polkadot/api';
import { Keyring } from '@polkadot/keyring';
import readline from 'readline';
import chalk from 'chalk';

const mainMnemonic = "law icon laundry erosion swing clarify box grab cliff know motion harvest";
const amountToSend = 400_000_000_000_000_000n; // Gerçek 0.4 HMND

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
console.log("🔑 Alıcı mnemonicleri girin (her satıra bir tane, sadece ENTER'a basarak bitirin):");

let input = "";
rl.on("line", (line) => {
  if (line.trim() === "") {
    rl.close();
  } else {
    input += line + "\n";
  }
});

rl.on("close", async () => {
  const mnemonics = input.trim().split("\n").filter(Boolean);
  console.log(`✉️ Ana cüzdandan ${mnemonics.length} cüzdana 0.4 HMND gönderilecek...`);

  const wsProvider = new WsProvider('wss://explorer-rpc-ws.mainnet.stages.humanode.io');
  const api = await ApiPromise.create({ provider: wsProvider });

  const keyring = new Keyring({ type: 'sr25519' });
  const sender = keyring.addFromMnemonic(mainMnemonic);

  const { data: balance } = await api.query.system.account(sender.address);
  let availableBalance = balance.free.toBigInt();

  for (let i = 0; i < mnemonics.length; i++) {
    try {
      const receiver = keyring.addFromMnemonic(mnemonics[i]);
      const transfer = api.tx.balances.transfer(receiver.address, amountToSend.toString());
      const fee = await transfer.paymentInfo(sender);
      const totalNeeded = amountToSend + fee.partialFee.toBigInt();

      if (availableBalance < totalNeeded) {
        console.log(chalk.red(`⛔ [${i + 1}] Yetersiz bakiye: ${sender.address}`));
        continue;
      }

      const txHash = await transfer.signAndSend(sender);
      console.log(chalk.green(`✅ [${i + 1}] ${sender.address} → ${receiver.address} | TX: ${txHash.toHex()}`));

      // Bakiye güncelle
      availableBalance -= totalNeeded;

      // Çakışma olmaması için bekle
      await sleep(6000);

    } catch (err) {
      console.error(chalk.red(`❌ [${i + 1}] Hata: ${err.message}`));
      await sleep(3000); // hata sonrası da biraz bekle
    }
  }

  await api.disconnect();
  console.log(chalk.green("🏁 Tüm işlemler tamamlandı."));
  process.exit(0);
});
